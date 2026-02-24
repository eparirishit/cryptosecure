import { NextResponse } from "next/server";
import { AnalysisResult } from "@/types/analysis";
import crypto from "crypto";
import { SYSTEM_PROMPT, createAnalysisPrompt, formatPreviousFindingsContext } from "@/lib/analyzer/analyze/prompts";
import { createAIProvider, getProviderConfig } from "@/lib/analyzer/ai-providers";

const analysisCache = new Map<string, AnalysisResult>();

function extractContractName(filename?: string): string {
  if (!filename) return "contract";
  const nameWithoutExt = filename.replace(/\.(tact|fc|func)$/i, "");
  return nameWithoutExt || "contract";
}

function parseAIResponse(responseText: string): AnalysisResult {
  let cleaned = responseText.trim();
  
  cleaned = cleaned.replace(/^```json\s*/i, "").replace(/```\s*$/, "");
  cleaned = cleaned.trim();
  
  try {
    const parsed = JSON.parse(cleaned) as AnalysisResult;
    
    const missingFields = [];
    if (!parsed.analysisMetadata) missingFields.push('analysisMetadata');
    if (parsed.securityScore === undefined || parsed.securityScore === null) missingFields.push('securityScore');
    if (!parsed.grade) missingFields.push('grade');
    if (!parsed.executiveSummary) missingFields.push('executiveSummary');
    if (!parsed.findingsSummary) missingFields.push('findingsSummary');
    if (!parsed.findings) missingFields.push('findings');

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields in AI response: ${missingFields.join(', ')}`);
    }
    
    if (!parsed.proposedCodeComplete
        && parsed.completeCodeComparison?.hasChanges
        && parsed.completeCodeComparison.corrected) {
      parsed.proposedCodeComplete = parsed.completeCodeComparison.corrected;
    }
    
    return parsed;
  } catch (error) {
    console.error("Failed to parse AI response:", error);
    throw new Error("Invalid JSON response from AI");
  }
}

export async function POST(req: Request) {
  try {
    const { code, contractName, filename, previousFindings } = await req.json();

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { error: "Invalid code provided" },
        { status: 400 }
      );
    }

    const isReanalysis = Array.isArray(previousFindings) && previousFindings.length > 0;
    const additionalContext = isReanalysis
      ? formatPreviousFindingsContext(previousFindings)
      : '';

    const normalizedCode = code.replace(/\s+/g, ' ').trim();
    const cacheInput = isReanalysis
      ? normalizedCode + '::reanalysis'
      : normalizedCode;
    const codeHash = crypto.createHash('sha256').update(cacheInput).digest('hex');

    if (analysisCache.has(codeHash)) {
      console.log("Returning cached analysis result for hash:", codeHash);
      return NextResponse.json(analysisCache.get(codeHash));
    }

    const finalContractName = contractName || extractContractName(filename);

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

    console.log(`[AI Provider] Using ${providerConfig.provider.toUpperCase()} with model: ${providerConfig.model || 'default'}`);
    console.log(`[Analysis] Contract: ${finalContractName}, Lines: ${code.split('\n').length}${isReanalysis ? `, Re-analysis with ${previousFindings.length} previous findings` : ''}`);

    const analysisPrompt = createAnalysisPrompt(code, finalContractName, additionalContext);

    // Call AI provider
    let aiResponse: AnalysisResult;
    const startTime = Date.now();
    try {
      console.log(`[AI Request] Sending request to ${providerConfig.provider.toUpperCase()}...`);
      const provider = createAIProvider(providerConfig);
      const response = await provider.generateResponse(SYSTEM_PROMPT, analysisPrompt);
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

    } catch (error: unknown) {
      const duration = Date.now() - startTime;
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[AI Error] ${providerConfig.provider.toUpperCase()} request failed after ${duration}ms:`, message);
      return NextResponse.json(
        {
          error: `Failed to analyze code with ${providerConfig.provider.toUpperCase()}.`,
          details: message,
          hint: `Please check your ${providerConfig.provider.toUpperCase()} API key and try again.`
        },
        { status: 500 }
      );
    }

    // Cache the result
    analysisCache.set(codeHash, aiResponse);
    console.log(`[Cache] Stored analysis result for hash: ${codeHash.substring(0, 8)}...`);

    return NextResponse.json(aiResponse);

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Analysis failed:", error);
    return NextResponse.json(
      {
        error: "Failed to analyze code.",
        details: message
      },
      { status: 500 }
    );
  }
}

