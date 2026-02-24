import { AIProviderInterface } from "../ai-providers";
import { AttackSurface } from "@/types/analysis";
import { mapFunctions } from "../utils";
import { getAttackSurfacePrompt } from "./prompts";
import { extractArrayFromAIResponse } from "../ai-response";

/**
 * Enumerates attack surfaces in a TON smart contract.
 * Identifies entry points, risk factors, and trust boundaries.
 */
export async function enumerateAttackSurface(
  code: string,
  language: string,
  provider: AIProviderInterface
): Promise<AttackSurface[]> {
  const functions = mapFunctions(code);

  try {
    const prompt = getAttackSurfacePrompt(code, language, functions);

    const aiResponse = await provider.generateResponse(
      "You are a security researcher specializing in TON smart contract security. Always return valid JSON arrays.",
      prompt,
      { temperature: 0.1 }
    );

    const response = aiResponse.content;
    if (!response) {
      throw new Error("Empty response from AI");
    }

    const parsed = JSON.parse(response);
    const attackSurfaces = extractArrayFromAIResponse<AttackSurface>(
      parsed,
      ["attackSurfaces", "attack_surface"],
      "Attack Surface"
    );

    if (attackSurfaces.length === 0) {
      console.warn("[Attack Surface] No attack surfaces found in AI response, using fallback");
      return generateFallbackAttackSurfaces(functions, code);
    }

    const validated = (attackSurfaces as unknown as Record<string, unknown>[]).map((as, index) => ({
      id: (as.id as string) || `AS${index + 1}`,
      entryPoint: (as.entryPoint || as.entry_point || as.function || as.name || "unknown") as string,
      riskFactors: Array.isArray(as.riskFactors) ? (as.riskFactors as string[]) :
                   Array.isArray(as.risk_factors) ? (as.risk_factors as string[]) :
                   Array.isArray(as.risks) ? (as.risks as string[]) : [],
      notes: (as.notes || as.description || as.note || "") as string,
      lineNumber: (as.lineNumber || as.line_number || as.line || undefined) as number | undefined,
    })).filter((as) => as.entryPoint !== "unknown" || as.riskFactors.length > 0);

    return validated.length > 0 ? validated : generateFallbackAttackSurfaces(functions, code);

  } catch (error: unknown) {
    console.error("Attack surface enumeration failed:", error);
    return generateFallbackAttackSurfaces(functions, code);
  }
}

/**
 * Fallback: derive basic attack surfaces from function names and code patterns
 * when the AI response is unavailable or empty.
 */
function generateFallbackAttackSurfaces(
  functions: Array<{name: string, startLine: number, endLine: number}>,
  code: string
): AttackSurface[] {
  const surfaces: AttackSurface[] = [];
  const riskyKeywords = ['withdraw', 'transfer', 'send', 'deposit', 'mint', 'burn', 'admin', 'owner'];
  const codeLines = code.split('\n');

  for (const func of functions) {
    const funcCode = codeLines.slice(func.startLine - 1, func.endLine).join('\n');
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
