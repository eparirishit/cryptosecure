import { AIProviderInterface } from "./ai-providers";
import { ExploitAttempt, AttackSurface, LegacySeverity } from "@/types/analysis";
import { getHackerAgentPrompt } from "./prompts/hacker-prompts";

/**
 * Hacker Agent - Generates creative exploit attempts
 * Uses adversarial AI mindset to find novel attack vectors
 */
export async function generateExploits(
  code: string,
  language: string,
  attackSurfaces: AttackSurface[],
  provider: AIProviderInterface
): Promise<ExploitAttempt[]> {
  if (attackSurfaces.length === 0) {
    return [];
  }
  
  try {
    const prompt = getHackerAgentPrompt(code, language, attackSurfaces);
    
    const aiResponse = await provider.generateResponse(
      "You are a malicious attacker trying to exploit TON smart contracts. Think creatively and find novel attack vectors. Always return valid JSON arrays.",
      prompt
    );
    
    const response = aiResponse.content;
    if (!response) {
      throw new Error("Empty response from AI");
    }
    
    // Parse JSON response
    const parsed = JSON.parse(response);
    
    // Handle JSON object response (required by response_format: json_object)
    let exploits: any[] = [];
    
    // First check for the expected key
    if (parsed.exploits && Array.isArray(parsed.exploits)) {
      exploits = parsed.exploits;
    } else if (parsed.exploitAttempts && Array.isArray(parsed.exploitAttempts)) {
      exploits = parsed.exploitAttempts;
    } else if (Array.isArray(parsed)) {
      // Fallback: direct array (shouldn't happen with json_object format)
      exploits = parsed;
    } else {
      // Try to find any array in the response
      const keys = Object.keys(parsed);
      for (const key of keys) {
        if (Array.isArray(parsed[key])) {
          exploits = parsed[key];
          console.warn(`[Hacker Agent] Found exploits under unexpected key: ${key}`);
          break;
        }
      }
    }
    
    if (exploits.length === 0) {
      console.warn("[Hacker Agent] No exploits found in AI response");
    }
    
    // Validate and normalize exploit attempts
    return exploits.map((exp: any, index: number) => ({
      id: exp.id || `EXP${index + 1}`,
      attackSurfaceId: exp.attackSurfaceId || exp.attack_surface_id || attackSurfaces[0]?.id || "AS1",
      title: exp.title || exp.name || "Unknown Exploit",
      type: normalizeExploitType(exp.type || exp.attackType || "other"),
      prerequisites: exp.prerequisites || exp.requirements || "",
      steps: Array.isArray(exp.steps) ? exp.steps : 
             Array.isArray(exp.attackSteps) ? exp.attackSteps : [],
      expectedImpact: exp.expectedImpact || exp.impact || exp.expected_impact || "",
      likelihood: normalizeLikelihood(exp.likelihood || "medium"),
      status: "theoretical" as const, // Will be validated by feasibility check
      exploitCode: exp.exploitCode || exp.exploit_code || undefined,
      vulnerableLines: Array.isArray(exp.vulnerableLines) ? exp.vulnerableLines :
                       Array.isArray(exp.vulnerable_lines) ? exp.vulnerable_lines : undefined,
      tonSpecificNotes: exp.tonSpecificNotes || exp.ton_specific_notes || undefined,
      severity: normalizeSeverity(exp.severity || determineSeverityFromType(exp.type))
    }));
    
  } catch (error: any) {
    console.error("Exploit generation failed:", error);
    return [];
  }
}

/**
 * Normalize exploit type to valid enum value
 */
function normalizeExploitType(type: string): ExploitAttempt["type"] {
  const normalized = type.toLowerCase();
  if (normalized.includes("reentrancy") || normalized.includes("re-entry")) {
    return "reentrancy";
  }
  if (normalized.includes("access") || normalized.includes("auth") || normalized.includes("permission")) {
    return "access-control";
  }
  if (normalized.includes("economic") || normalized.includes("sandwich") || normalized.includes("grief")) {
    return "economic";
  }
  if (normalized.includes("dos") || normalized.includes("denial") || normalized.includes("gas")) {
    return "dos";
  }
  if (normalized.includes("overflow") || normalized.includes("underflow") || normalized.includes("integer")) {
    return "integer-overflow";
  }
  return "other";
}

/**
 * Normalize likelihood to valid enum value
 */
function normalizeLikelihood(likelihood: string): "low" | "medium" | "high" {
  const normalized = likelihood.toLowerCase();
  if (normalized.includes("high") || normalized.includes("very")) {
    return "high";
  }
  if (normalized.includes("low") || normalized.includes("unlikely")) {
    return "low";
  }
  return "medium";
}

/**
 * Normalize severity to valid LegacySeverity type
 */
function normalizeSeverity(severity: string): LegacySeverity {
  const normalized = severity.toLowerCase();
  if (normalized.includes("critical")) {
    return "Critical";
  }
  if (normalized.includes("high")) {
    return "High";
  }
  if (normalized.includes("medium")) {
    return "Medium";
  }
  if (normalized.includes("low")) {
    return "Low";
  }
  return "Info";
}

/**
 * Determine severity based on exploit type
 */
function determineSeverityFromType(type: string): LegacySeverity {
  const normalized = type.toLowerCase();
  if (normalized.includes("reentrancy") || normalized.includes("access-control")) {
    return "Critical";
  }
  if (normalized.includes("economic") || normalized.includes("overflow")) {
    return "High";
  }
  if (normalized.includes("dos")) {
    return "Medium";
  }
  return "Low";
}

