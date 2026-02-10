import { AIProviderInterface } from "./ai-providers";
import { AttackSurface } from "@/types/analysis";
import { mapFunctions } from "./utils";
import { getAttackSurfacePrompt } from "./prompts/hacker-prompts";

/**
 * Enumerates attack surfaces in a TON smart contract
 * Identifies entry points, risk factors, and trust boundaries
 */
export async function enumerateAttackSurface(
  code: string,
  language: string,
  provider: AIProviderInterface
): Promise<AttackSurface[]> {
  // Parse contract structure
  const functions = mapFunctions(code);
  
  // Extract state variables and external calls (basic heuristics)
  const stateVars = extractStateVariables(code);
  const externalCalls = extractExternalCalls(code);
  const tonHandlers = extractTONHandlers(code);
  
  // Build context for AI
  const context = {
    functions,
    stateVars,
    externalCalls,
    tonHandlers
  };
  
  try {
    const prompt = getAttackSurfacePrompt(code, language, functions);
    
    const aiResponse = await provider.generateResponse(
      "You are a security researcher specializing in TON smart contract security. Always return valid JSON arrays.",
      prompt,
      { temperature: 0.1 } // Low temperature for deterministic analysis
    );
    
    const response = aiResponse.content;
    if (!response) {
      throw new Error("Empty response from AI");
    }
    
    // Parse JSON response
    const parsed = JSON.parse(response);
    
    // Handle JSON object response (required by response_format: json_object)
    let attackSurfaces: AttackSurface[] = [];
    
    // First check for the expected key
    if (parsed.attackSurfaces && Array.isArray(parsed.attackSurfaces)) {
      attackSurfaces = parsed.attackSurfaces;
    } else if (parsed.attack_surface && Array.isArray(parsed.attack_surface)) {
      attackSurfaces = parsed.attack_surface;
    } else if (Array.isArray(parsed)) {
      // Fallback: direct array (shouldn't happen with json_object format)
      attackSurfaces = parsed;
    } else {
      // Try to find any array in the response
      const keys = Object.keys(parsed);
      for (const key of keys) {
        if (Array.isArray(parsed[key])) {
          attackSurfaces = parsed[key];
          break;
        }
      }
    }
    
    // If still empty, log warning
    if (attackSurfaces.length === 0) {
      console.warn("[Attack Surface] No attack surfaces found in AI response, using fallback");
    }
    
    // Validate and add IDs if missing
    const validated = attackSurfaces.map((as: any, index: number) => ({
      id: as.id || `AS${index + 1}`,
      entryPoint: as.entryPoint || as.entry_point || as.function || as.name || "unknown",
      riskFactors: Array.isArray(as.riskFactors) ? as.riskFactors : 
                   Array.isArray(as.risk_factors) ? as.risk_factors : 
                   Array.isArray(as.risks) ? as.risks : [],
      notes: as.notes || as.description || as.note || "",
      lineNumber: as.lineNumber || as.line_number || as.line || undefined
    })).filter((as: AttackSurface) => as.entryPoint !== "unknown" || as.riskFactors.length > 0);
    
    return validated.length > 0 ? validated : generateFallbackAttackSurfaces(functions, code);
    
  } catch (error: any) {
    console.error("Attack surface enumeration failed:", error);
    
    // Fallback: Generate basic attack surfaces from function analysis
    return generateFallbackAttackSurfaces(functions, code);
  }
}

/**
 * Extract state variables from code (heuristic-based)
 */
function extractStateVariables(code: string): string[] {
  const vars: string[] = [];
  const lines = code.split('\n');
  
  // Look for common state variable patterns
  const patterns = [
    /(?:global\s+)?(int|cell|slice|builder)\s+(\w+)/g,
    /(\w+)\s*::=/g, // FunC assignment
  ];
  
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(code)) !== null) {
      const varName = match[2] || match[1];
      if (varName && !vars.includes(varName)) {
        vars.push(varName);
      }
    }
  }
  
  return vars;
}

/**
 * Extract external calls from code
 */
function extractExternalCalls(code: string): string[] {
  const calls: string[] = [];
  
  // Look for send_raw_message, external library calls
  const patterns = [
    /send_raw_message/g,
    /send_message/g,
    /\.load_/g,
    /\.store_/g,
  ];
  
  for (const pattern of patterns) {
    if (pattern.test(code)) {
      calls.push(pattern.source);
    }
  }
  
  return calls;
}

/**
 * Extract TON-specific handlers
 */
function extractTONHandlers(code: string): string[] {
  const handlers: string[] = [];
  
  const tonPatterns = [
    /recv_internal/g,
    /recv_external/g,
    /tick_tock/g,
    /on_bounce/g,
  ];
  
  for (const pattern of tonPatterns) {
    if (pattern.test(code)) {
      handlers.push(pattern.source);
    }
  }
  
  return handlers;
}

/**
 * Fallback: Generate basic attack surfaces from function analysis
 */
function generateFallbackAttackSurfaces(
  functions: Array<{name: string, startLine: number, endLine: number}>,
  code: string
): AttackSurface[] {
  const surfaces: AttackSurface[] = [];
  
  // Identify potentially risky functions
  const riskyKeywords = ['withdraw', 'transfer', 'send', 'deposit', 'mint', 'burn', 'admin', 'owner'];
  
  for (const func of functions) {
    const funcCode = code.split('\n').slice(func.startLine - 1, func.endLine).join('\n');
    const isRisky = riskyKeywords.some(keyword => 
      func.name.toLowerCase().includes(keyword) || funcCode.toLowerCase().includes(keyword)
    );
    
    if (isRisky || func.name.includes('recv')) {
      const riskFactors: string[] = [];
      
      if (funcCode.includes('send_raw_message') || funcCode.includes('send_message')) {
        riskFactors.push('external call');
      }
      if (funcCode.includes('balance') || funcCode.includes('total')) {
        riskFactors.push('affects balance');
      }
      if (!funcCode.includes('throw_unless') && !funcCode.includes('equal_slices')) {
        riskFactors.push('missing access control');
      }
      
      surfaces.push({
        id: `AS${surfaces.length + 1}`,
        entryPoint: func.name,
        riskFactors: riskFactors.length > 0 ? riskFactors : ['potential entry point'],
        notes: `Function ${func.name} may be an attack surface`,
        lineNumber: func.startLine
      });
    }
  }
  
  return surfaces;
}

