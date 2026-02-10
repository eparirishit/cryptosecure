import { AIProviderInterface } from "./ai-providers";
import { DefenseRecommendation, ExploitAttempt } from "@/types/analysis";
import { getDefenderAgentPrompt } from "./prompts/hacker-prompts";

/**
 * Defender Agent - Generates defensive recommendations
 * Provides specific hardening steps for each plausible exploit
 */
export async function generateDefenseRecommendations(
  code: string,
  plausibleExploits: ExploitAttempt[],
  provider: AIProviderInterface
): Promise<DefenseRecommendation[]> {
  if (plausibleExploits.length === 0) {
    return [];
  }
  
  try {
    const prompt = getDefenderAgentPrompt(code, plausibleExploits);
    
    const aiResponse = await provider.generateResponse(
      "You are a security expert helping developers defend against attacks. Provide specific, actionable recommendations with code examples. Always return valid JSON arrays.",
      prompt
    );
    
    const response = aiResponse.content;
    if (!response) {
      throw new Error("Empty response from AI");
    }
    
    // Parse JSON response
    const parsed = JSON.parse(response);
    
    // Handle JSON object response (required by response_format: json_object)
    let recommendations: any[] = [];
    
    // First check for the expected key
    if (parsed.recommendations && Array.isArray(parsed.recommendations)) {
      recommendations = parsed.recommendations;
    } else if (parsed.defenses && Array.isArray(parsed.defenses)) {
      recommendations = parsed.defenses;
    } else if (Array.isArray(parsed)) {
      // Fallback: direct array (shouldn't happen with json_object format)
      recommendations = parsed;
    } else {
      // Try to find any array in the response
      const keys = Object.keys(parsed);
      for (const key of keys) {
        if (Array.isArray(parsed[key])) {
          recommendations = parsed[key];
          console.warn(`[Defender Agent] Found recommendations under unexpected key: ${key}`);
          break;
        }
      }
    }
    
    if (recommendations.length === 0) {
      console.warn("[Defender Agent] No recommendations found in AI response, using fallback");
    }
    
    // Validate and normalize recommendations
    return recommendations.map((rec: any) => ({
      exploitId: rec.exploitId || rec.exploit_id || "",
      mitigation: rec.mitigation || rec.recommendation || rec.defense || "",
      codeExample: rec.codeExample || rec.code_example || rec.example || undefined,
      tonSpecific: rec.tonSpecific || rec.ton_specific || false
    })).filter((rec: DefenseRecommendation) => rec.exploitId && rec.mitigation);
    
  } catch (error: any) {
    console.error("Defense recommendation generation failed:", error);
    
    // Fallback: Generate basic recommendations
    return generateFallbackRecommendations(plausibleExploits);
  }
}

/**
 * Generate fallback recommendations based on exploit types
 */
function generateFallbackRecommendations(exploits: ExploitAttempt[]): DefenseRecommendation[] {
  const recommendations: DefenseRecommendation[] = [];
  
  for (const exploit of exploits) {
    let mitigation = "";
    let codeExample = "";
    let tonSpecific = false;
    
    switch (exploit.type) {
      case "reentrancy":
        mitigation = "Add reentrancy guards and ensure state changes happen before external calls. Use message mode 64 for bounce protection.";
        codeExample = "throw_unless(401, equal_slices(sender_address, owner_address));\n// Update state before external call\nbalance -= amount;\nsend_raw_message(msg, 64);";
        tonSpecific = true;
        break;
        
      case "access-control":
        mitigation = "Add proper access control checks using throw_unless and equal_slices to verify sender identity.";
        codeExample = "throw_unless(401, equal_slices(sender_address, owner_address));";
        tonSpecific = true;
        break;
        
      case "economic":
        mitigation = "Implement rate limiting, maximum withdrawal limits, and fee validation to prevent economic attacks.";
        codeExample = "throw_unless(402, amount <= max_withdrawal);\nthrow_unless(403, balance >= amount + fee);";
        break;
        
      case "dos":
        mitigation = "Add gas limits, restrict tick-tock handlers, and validate message sizes to prevent denial of service.";
        codeExample = "throw_unless(404, msg_data.length <= MAX_MESSAGE_SIZE);";
        tonSpecific = true;
        break;
        
      case "integer-overflow":
        mitigation = "Use safe math operations and validate input ranges to prevent integer overflow/underflow.";
        codeExample = "throw_unless(405, a >= 0 && b >= 0);\nthrow_unless(406, result >= a);";
        break;
        
      default:
        mitigation = "Review the exploit steps and add appropriate validation checks and access controls.";
        break;
    }
    
    recommendations.push({
      exploitId: exploit.id,
      mitigation,
      codeExample: codeExample || undefined,
      tonSpecific
    });
  }
  
  return recommendations;
}

