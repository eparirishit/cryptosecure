import { AIProviderInterface } from "../ai-providers";
import { ExploitAttempt, AttackSurface, LegacySeverity } from "@/types/analysis";
import { getHackerAgentPrompt } from "./prompts";
import { extractArrayFromAIResponse } from "../ai-response";

/**
 * Hacker Agent - Generates creative exploit attempts.
 * Uses adversarial AI mindset to find novel attack vectors.
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

    const parsed = JSON.parse(response);
    const exploits = extractArrayFromAIResponse<Record<string, unknown>>(
      parsed,
      ["exploits", "exploitAttempts"],
      "Hacker Agent"
    );

    if (exploits.length === 0) {
      console.warn("[Hacker Agent] No exploits found in AI response, using static fallback");
      return generateFallbackExploits(code, attackSurfaces);
    }

    return exploits.map((exp, index): ExploitAttempt => ({
      id: (exp.id as string) || `EXP${index + 1}`,
      attackSurfaceId: (exp.attackSurfaceId || exp.attack_surface_id || attackSurfaces[0]?.id || "AS1") as string,
      title: (exp.title || exp.name || "Unknown Exploit") as string,
      type: normalizeExploitType((exp.type || exp.attackType || "other") as string),
      prerequisites: (exp.prerequisites || exp.requirements || "") as string,
      steps: Array.isArray(exp.steps) ? (exp.steps as string[]) :
             Array.isArray(exp.attackSteps) ? (exp.attackSteps as string[]) : [],
      expectedImpact: (exp.expectedImpact || exp.impact || exp.expected_impact || "") as string,
      likelihood: normalizeLikelihood((exp.likelihood || "medium") as string),
      status: "theoretical" as const,
      exploitCode: (exp.exploitCode || exp.exploit_code || undefined) as string | undefined,
      vulnerableLines: Array.isArray(exp.vulnerableLines) ? (exp.vulnerableLines as number[]) :
                       Array.isArray(exp.vulnerable_lines) ? (exp.vulnerable_lines as number[]) : undefined,
      tonSpecificNotes: (exp.tonSpecificNotes || exp.ton_specific_notes || undefined) as string | undefined,
      severity: resolveSeverity(exp.severity as string | undefined, exp.type as string),
    }));

  } catch (error: unknown) {
    console.error("Exploit generation failed, using static fallback:", error);
    return generateFallbackExploits(code, attackSurfaces);
  }
}

/**
 * Static fallback exploit generator — detects obvious vulnerability patterns
 * without calling the AI. Used when AI fails or returns an empty array.
 */
function generateFallbackExploits(
  code: string,
  attackSurfaces: AttackSurface[]
): ExploitAttempt[] {
  const exploits: ExploitAttempt[] = [];
  const firstSurfaceId = attackSurfaces[0]?.id || "AS1";

  // ── Reentrancy ──────────────────────────────────────────────────────────────
  // Pattern: send_raw_message / send_message appears BEFORE a state update
  // (balance -=, balance =, storage write) in the same handler.
  const hasSend = /send_raw_message|send_message/.test(code);
  const hasStateAfterSend = (() => {
    const sendIdx = code.search(/send_raw_message|send_message/);
    if (sendIdx === -1) return false;
    const after = code.slice(sendIdx);
    return /balance\s*[-+]?=|set_data\s*\(|store_/.test(after);
  })();

  if (hasSend && hasStateAfterSend) {
    exploits.push({
      id: "FB-EXP1",
      attackSurfaceId: firstSurfaceId,
      title: "Reentrancy via External Call Before State Update",
      type: "reentrancy",
      prerequisites: "Attacker can call the withdraw/transfer function",
      steps: [
        "Attacker calls the function that sends a message",
        "External message is dispatched before balance is updated",
        "Attacker re-enters the contract while old balance is still stored",
        "Attacker drains funds by repeating the withdrawal"
      ],
      expectedImpact: "Complete drain of contract funds",
      likelihood: "high",
      status: "theoretical",
      severity: "Critical",
      tonSpecificNotes: "In TON the actor model means reentrancy happens via chained messages, not recursive calls — the state update must happen before any send_raw_message."
    });
  }

  // ── Missing Access Control on recv_external ──────────────────────────────
  // Pattern: recv_external exists with accept_message() but no throw_unless / auth check
  const hasRecvExternal = /recv_external/.test(code);
  const hasAcceptMessage = /accept_message\s*\(\)/.test(code);
  const hasAuthCheck = /throw_unless|throw_if|equal_slices|load_msg_addr/.test(
    (code.match(/recv_external[\s\S]*?(?=\(\)\s*\{[\s\S]*?\n\})/)?.[0]) || ""
  );

  if (hasRecvExternal && hasAcceptMessage && !hasAuthCheck) {
    exploits.push({
      id: "FB-EXP2",
      attackSurfaceId: firstSurfaceId,
      title: "Unauthorized Access via Unprotected recv_external",
      type: "access-control",
      prerequisites: "Attacker can send an external message to the contract",
      steps: [
        "Attacker crafts an external message with any desired op-code",
        "recv_external calls accept_message() with no sender verification",
        "Attacker executes privileged operations (balance reset, ownership change)"
      ],
      expectedImpact: "Arbitrary state manipulation — attacker can set balance to any value or take ownership",
      likelihood: "high",
      status: "theoretical",
      severity: "Critical",
      tonSpecificNotes: "recv_external accepts messages from any off-chain source; without a signature or owner check any actor can trigger admin functions."
    });
  }

  // ── Missing Balance Check Before Withdrawal ──────────────────────────────
  // Pattern: coins are loaded and sent but balance is never compared first
  const hasWithdraw = /load_coins/.test(code);
  const hasBalanceCheck = /balance\s*>=|throw_unless[\s\S]{0,60}balance/.test(code);

  if (hasWithdraw && !hasBalanceCheck) {
    exploits.push({
      id: "FB-EXP3",
      attackSurfaceId: firstSurfaceId,
      title: "Unchecked Withdrawal — No Balance Validation",
      type: "other",
      prerequisites: "Attacker can call withdraw with an amount larger than the stored balance",
      steps: [
        "Attacker calls withdraw with amount > current balance",
        "Contract sends the requested amount without checking sufficiency",
        "Contract balance underflows or TON runtime covers with borrowed gas"
      ],
      expectedImpact: "Contract over-spends, leading to unexpected balance state or runtime error",
      likelihood: "medium",
      status: "theoretical",
      severity: "High"
    });
  }

  return exploits;
}

function normalizeExploitType(type: string): ExploitAttempt["type"] {
  const normalized = type.toLowerCase();
  if (normalized.includes("reentrancy") || normalized.includes("re-entry")) return "reentrancy";
  if (normalized.includes("access") || normalized.includes("auth") || normalized.includes("permission")) return "access-control";
  if (normalized.includes("economic") || normalized.includes("sandwich") || normalized.includes("grief")) return "economic";
  if (normalized.includes("dos") || normalized.includes("denial") || normalized.includes("gas")) return "dos";
  if (normalized.includes("overflow") || normalized.includes("underflow") || normalized.includes("integer")) return "integer-overflow";
  return "other";
}

function normalizeLikelihood(likelihood: string): "low" | "medium" | "high" {
  const normalized = likelihood.toLowerCase();
  if (normalized.includes("high") || normalized.includes("very")) return "high";
  if (normalized.includes("low") || normalized.includes("unlikely")) return "low";
  return "medium";
}

function normalizeSeverity(severity: string): LegacySeverity {
  const normalized = severity.toLowerCase();
  if (normalized.includes("critical")) return "Critical";
  if (normalized.includes("high")) return "High";
  if (normalized.includes("medium")) return "Medium";
  if (normalized.includes("low")) return "Low";
  return "Info";
}

function determineSeverityFromType(type: string): LegacySeverity {
  const normalized = type.toLowerCase();
  if (normalized.includes("reentrancy") || normalized.includes("access-control")) return "Critical";
  if (normalized.includes("economic") || normalized.includes("overflow")) return "High";
  if (normalized.includes("dos")) return "Medium";
  return "Low";
}

const SEVERITY_RANK: Record<LegacySeverity, number> = {
  Critical: 4, High: 3, Medium: 2, Low: 1, Info: 0
};

/**
 * Resolve final severity: use AI value when it is meaningful (High+),
 * otherwise fall back to the type-based severity so that obvious exploit
 * types (reentrancy, access-control) are never silently downgraded to Info.
 */
function resolveSeverity(aiSeverity: string | undefined, exploitType: string): LegacySeverity {
  const fromAI = normalizeSeverity(aiSeverity || "");
  if (fromAI === "Info") {
    return determineSeverityFromType(exploitType);
  }
  const fromType = determineSeverityFromType(exploitType);
  return SEVERITY_RANK[fromAI] >= SEVERITY_RANK[fromType] ? fromAI : fromType;
}
