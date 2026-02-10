import { NextResponse } from "next/server";
import { AnalysisResult } from "@/types/analysis";
import crypto from "crypto";
import { SYSTEM_PROMPT, createAnalysisPrompt } from "@/lib/analyzer/prompts";
import { createAIProvider, getProviderConfig } from "@/lib/analyzer/ai-providers";

// Simple in-memory cache for demo purposes
const analysisCache = new Map<string, any>();

function extractContractName(filename?: string): string {
  if (!filename) return "contract";
  const nameWithoutExt = filename.replace(/\.(tact|fc|func)$/i, "");
  return nameWithoutExt || "contract";
}

function parseAIResponse(responseText: string): AnalysisResult {
  // Remove markdown code blocks if present
  let cleaned = responseText.trim();
  
  // Remove ```json and ``` markers
  cleaned = cleaned.replace(/^```json\s*/i, "").replace(/```\s*$/, "");
  cleaned = cleaned.trim();
  
  try {
    const parsed = JSON.parse(cleaned) as AnalysisResult;
    
    // Validate required fields
    if (!parsed.analysisMetadata || !parsed.securityScore || !parsed.grade || 
        !parsed.executiveSummary || !parsed.findingsSummary || !parsed.findings) {
      throw new Error("Missing required fields in AI response");
    }
    
    return parsed;
  } catch (error) {
    console.error("Failed to parse AI response:", error);
    throw new Error("Invalid JSON response from AI");
  }
}

export async function POST(req: Request) {
  try {
    const { code, contractName, filename } = await req.json();

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { error: "Invalid code provided" },
        { status: 400 }
      );
    }

    // Generate a hash of the normalized code for caching
    const normalizedCode = code.replace(/\s+/g, ' ').trim();
    const codeHash = crypto.createHash('sha256').update(normalizedCode).digest('hex');

    // Check cache first
    if (analysisCache.has(codeHash)) {
      console.log("Returning cached analysis result for hash:", codeHash);
      return NextResponse.json(analysisCache.get(codeHash));
    }

    // Extract contract name
    const finalContractName = contractName || extractContractName(filename);

    // Get AI provider configuration
    const providerConfig = getProviderConfig();
    if (!providerConfig) {
      return NextResponse.json(
        { 
          error: "AI provider not configured",
          details: "Please set your API Key in the environment variable"
        },
        { status: 500 }
      );
    }

    // Log provider and model selection
    console.log(`[AI Provider] Using ${providerConfig.provider.toUpperCase()} with model: ${providerConfig.model || 'default'}`);
    console.log(`[Analysis] Contract: ${finalContractName}, Lines: ${code.split('\n').length}`);

    // Prompts
    const systemPrompt = SYSTEM_PROMPT;
    const analysisPrompt = createAnalysisPrompt(code, finalContractName);

    // Call AI provider
    let aiResponse: AnalysisResult;
    const startTime = Date.now();
    try {
      console.log(`[AI Request] Sending request to ${providerConfig.provider.toUpperCase()}...`);
      const provider = createAIProvider(providerConfig);
      const response = await provider.generateResponse(systemPrompt, analysisPrompt);
      const duration = Date.now() - startTime;
      console.log(`[AI Response] Received response from ${providerConfig.provider.toUpperCase()} in ${duration}ms`);

      // Parse the response
      aiResponse = parseAIResponse(response.content);
      
      // Add analysis date if not present
      if (!aiResponse.analysisMetadata.analysisDate) {
        aiResponse.analysisMetadata.analysisDate = new Date().toISOString();
      }

      // Log analysis results
      console.log(`[Analysis Complete] Score: ${aiResponse.securityScore}, Grade: ${aiResponse.grade}, Findings: ${aiResponse.findings.length} (${aiResponse.findingsSummary.critical} critical, ${aiResponse.findingsSummary.high} high)`);

    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.error(`[AI Error] ${providerConfig.provider.toUpperCase()} request failed after ${duration}ms:`, error.message || error);
      return NextResponse.json(
        { 
          error: `Failed to analyze code with ${providerConfig.provider.toUpperCase()}.`, 
          details: error.message || "Unknown error",
          hint: `Please check your ${providerConfig.provider.toUpperCase()} API key and try again.`
        },
        { status: 500 }
      );
    }

    // Cache the result
    analysisCache.set(codeHash, aiResponse);
    console.log(`[Cache] Stored analysis result for hash: ${codeHash.substring(0, 8)}...`);

    return NextResponse.json(aiResponse);

  } catch (error: any) {
    console.error("Analysis failed:", error);
    return NextResponse.json(
      { 
        error: "Failed to analyze code.", 
        details: error.message || "Unknown error" 
      },
      { status: 500 }
    );
  }
}

