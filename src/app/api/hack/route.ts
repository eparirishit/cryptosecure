import { NextResponse } from "next/server";
import { HackerModeResult, ExploitAttempt, Finding, Severity } from "@/types/analysis";
import { enumerateAttackSurface } from "@/lib/analyzer/attack-surface";
import { generateExploits } from "@/lib/analyzer/hacker-agent";
import { validateExploitFeasibility } from "@/lib/analyzer/feasibility-check";
import { generateDefenseRecommendations } from "@/lib/analyzer/defender-agent";
import { getProviderConfig, createAIProvider } from "@/lib/analyzer/ai-providers";

// Simple rate limiting (in-memory for MVP)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
// Higher limit for development, lower for production
const RATE_LIMIT_MAX = process.env.NODE_ENV === 'production' ? 5 : 20; // Max requests per hour
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds

function checkRateLimit(ip: string): { allowed: boolean; resetTime?: number; remaining?: number } {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
  }
  
  if (record.count >= RATE_LIMIT_MAX) {
    return { allowed: false, resetTime: record.resetTime, remaining: 0 };
  }
  
  record.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX - record.count };
}

function getClientIP(req: Request): string {
  // Try to get IP from headers
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  
  const realIP = req.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }
  
  return "unknown";
}

function calculateVulnerabilityPenalty(findings: Finding[]): number {
  let penalty = 0;
  for (const finding of findings) {
    switch (finding.severity as Severity) {
      case "CRITICAL": penalty += 20; break;
      case "HIGH":     penalty += 12; break;
      case "MEDIUM":   penalty += 5;  break;
      case "LOW":      penalty += 2;  break;
      default:         break;
    }
  }
  return penalty;
}

function calculateHackerResilienceScore(
  exploits: ExploitAttempt[],
  findings: Finding[] = [],
  vulnerabilityScore: number | null = null
): number {
  let score = 100;

  for (const exploit of exploits) {
    if (exploit.status === "not-applicable") {
      continue; // Don't penalize for impossible exploits
    }

    if (exploit.status === "plausible") {
      switch (exploit.likelihood) {
        case "high":   score -= 20; break;
        case "medium": score -= 10; break;
        case "low":    score -= 5;  break;
      }
      switch (exploit.severity) {
        case "Critical": score -= 15; break;
        case "High":     score -= 10; break;
        case "Medium":   score -= 5;  break;
        case "Low":      score -= 2;  break;
        case "Info":     score -= 1;  break; // was missing — caused 0 severity penalty
      }
    } else if (exploit.status === "theoretical") {
      score -= 1;
    }
  }

  // Penalty from known static-analysis vulnerability findings
  score -= calculateVulnerabilityPenalty(findings);

  // If a vulnerability score exists from the standard audit, the resilience score
  // cannot exceed it by more than 15 points — prevents contradictory readings
  // (e.g. vulnerability score 35 but resilience score 90).
  if (vulnerabilityScore !== null) {
    score = Math.min(score, vulnerabilityScore + 15);
  }

  return Math.max(0, Math.round(score));
}

function determineRiskLevel(score: number, plausibleExploits: number): HackerModeResult["riskLevel"] {
  if (score < 30 || plausibleExploits > 3) {
    return "Critical";
  }
  if (score < 50 || plausibleExploits > 1) {
    return "High";
  }
  if (score < 70) {
    return "Medium";
  }
  if (score < 90) {
    return "Low";
  }
  return "None";
}

export async function POST(req: Request) {
  const startTime = Date.now();
  const clientIP = getClientIP(req);
  
  try {
    // Rate limiting (disabled in development for easier testing)
    if (process.env.NODE_ENV === 'production') {
      const rateLimitCheck = checkRateLimit(clientIP);
      if (!rateLimitCheck.allowed) {
      const resetTime = rateLimitCheck.resetTime || Date.now() + RATE_LIMIT_WINDOW;
      const minutesUntilReset = Math.ceil((resetTime - Date.now()) / (60 * 1000));
      console.warn(`[Hacker Mode] Rate limit exceeded for IP: ${clientIP}`);
      return NextResponse.json(
        { 
          error: "Rate limit exceeded",
          details: `Hacker Mode is limited to ${RATE_LIMIT_MAX} requests per hour per IP address. Please try again in approximately ${minutesUntilReset} minute${minutesUntilReset !== 1 ? 's' : ''}.`
        },
        { status: 429 }
      );
      }
    }
    
    const { code, language, originalVulnerabilities = [], vulnerabilityScore = null } = await req.json();
    
    // Log request (without code content for privacy)
    console.log(`[Hacker Mode] Request from IP: ${clientIP}, Language: ${language}, Code length: ${code?.length || 0}`);
    
    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { error: "Invalid code provided" },
        { status: 400 }
      );
    }
    
    if (!language || typeof language !== "string") {
      return NextResponse.json(
        { error: "Invalid language provided" },
        { status: 400 }
      );
    }
    
    const providerConfig = getProviderConfig();
    if (!providerConfig) {
      return NextResponse.json(
        { 
          error: "AI service not configured",
          details: "Please configure an AI provider (OpenAI, Gemini, or Claude) in your .env.local file."
        },
        { status: 500 }
      );
    }

    const provider = createAIProvider(providerConfig);
    
    // Stage 1: Attack Surface Enumeration
    const attackSurface = await enumerateAttackSurface(code, language, provider);
    
    if (attackSurface.length === 0) {
      const score = calculateHackerResilienceScore([], originalVulnerabilities, vulnerabilityScore);
      return NextResponse.json({
        hackerResilienceScore: score,
        attackSurface: [],
        exploits: [],
        summary: "No attack surfaces identified. Contract appears to have minimal external interaction.",
        recommendations: [],
        riskLevel: determineRiskLevel(score, 0)
      } as HackerModeResult);
    }

    // Stage 2: Exploit Generation
    const rawExploits = await generateExploits(code, language, attackSurface, provider);

    if (rawExploits.length === 0) {
      const score = calculateHackerResilienceScore([], originalVulnerabilities, vulnerabilityScore);
      return NextResponse.json({
        hackerResilienceScore: score,
        attackSurface,
        exploits: [],
        summary: "Attack surfaces identified, but no exploit strategies were generated. Contract may be well-protected.",
        recommendations: [],
        riskLevel: determineRiskLevel(score, 0)
      } as HackerModeResult);
    }
    
    // Stage 3: Feasibility Validation
    const validatedExploits = validateExploitFeasibility(rawExploits, code);
    
    // Filter to plausible exploits for defense recommendations
    const plausibleExploits = validatedExploits.filter(e => e.status === "plausible");
    
    // Stage 4: Defensive Recommendations
    const recommendations = await generateDefenseRecommendations(code, plausibleExploits, provider);
    
    // Stage 5: Calculate Hacker Resilience Score
    const hackerResilienceScore = calculateHackerResilienceScore(validatedExploits, originalVulnerabilities, vulnerabilityScore);
    const riskLevel = determineRiskLevel(hackerResilienceScore, plausibleExploits.length);
    
    // Generate summary
    const plausibleCount = plausibleExploits.length;
    const theoreticalCount = validatedExploits.filter(e => e.status === "theoretical").length;
    const summary = `Hacker Mode analysis identified ${attackSurface.length} attack surface(s). ` +
      `${plausibleCount} plausible exploit${plausibleCount !== 1 ? 's' : ''} found, ` +
      `${theoreticalCount} theoretical exploit${theoreticalCount !== 1 ? 's' : ''} identified. ` +
      `Hacker Resilience Score: ${hackerResilienceScore}/100.`;
    
    const result: HackerModeResult = {
      hackerResilienceScore,
      attackSurface,
      exploits: validatedExploits,
      summary,
      recommendations,
      riskLevel
    };
    
    const duration = Date.now() - startTime;
    console.log(`[Hacker Mode] Analysis completed for IP: ${clientIP}, Duration: ${duration}ms, Score: ${hackerResilienceScore}, Risk: ${riskLevel}, Exploits: ${validatedExploits.length} (${plausibleExploits.length} plausible)`);
    
    return NextResponse.json(result);
    
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[Hacker Mode] Analysis failed for IP: ${clientIP}, Duration: ${duration}ms, Error:`, error);
    return NextResponse.json(
      { 
        error: "Hacker Mode analysis failed.",
        details: error.message || "Unknown error"
      },
      { status: 500 }
    );
  }
}

