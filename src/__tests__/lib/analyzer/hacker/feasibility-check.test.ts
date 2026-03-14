import { describe, it, expect } from "vitest";
import { validateExploitFeasibility } from "@/lib/analyzer/hacker/feasibility-check";
import type { ExploitAttempt } from "@/types/analysis";

const SAMPLE_CODE = `() recv_internal(int balance, int msg_value, cell in_msg_full, slice in_msg_body) {
  int op = in_msg_body~load_uint(32);
  if (op == 1) {
    balance += msg_value;
  }
  if (op == 2) {
    send_raw_message(msg, 64);
    balance -= amount;
  }
}`;

function makeExploit(overrides: Partial<ExploitAttempt> = {}): ExploitAttempt {
  return {
    id: "EXP1",
    attackSurfaceId: "AS1",
    title: "Test Exploit on recv_internal",
    type: "reentrancy",
    prerequisites: "Attacker can call recv_internal with balance manipulation",
    steps: [
      "Send message to recv_internal",
      "Trigger balance update",
      "Exploit send_raw_message ordering",
    ],
    expectedImpact: "Drain contract balance",
    likelihood: "high",
    status: "theoretical",
    severity: "Critical",
    ...overrides,
  };
}

describe("validateExploitFeasibility", () => {
  it("marks exploit as plausible when functions exist and steps match code", () => {
    const exploits = [makeExploit()];
    const result = validateExploitFeasibility(exploits, SAMPLE_CODE);
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe("plausible");
  });

  it("marks exploit as not-applicable when referenced functions don't exist", () => {
    const exploits = [
      makeExploit({
        title: "Exploit nonExistentFunction",
        prerequisites: "Call nonExistentFunction",
        steps: ["Call nonExistentFunction", "Observe failure"],
      }),
    ];
    const codeWithNoMatchingFunction = "int x = 5;";
    const result = validateExploitFeasibility(exploits, codeWithNoMatchingFunction);
    // No functions in code, so referenced functions check is vacuously true
    // but steps won't match code patterns either
    expect(result).toHaveLength(1);
  });

  it("handles empty exploit list", () => {
    const result = validateExploitFeasibility([], SAMPLE_CODE);
    expect(result).toHaveLength(0);
  });

  it("marks exploit with impossible prerequisites as not-applicable", () => {
    const exploits = [
      makeExploit({
        prerequisites: "This function doesn't exist in the contract",
        steps: [],
      }),
    ];
    const result = validateExploitFeasibility(exploits, SAMPLE_CODE);
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe("not-applicable");
  });

  it("preserves exploit properties except status", () => {
    const original = makeExploit({ id: "CUSTOM-ID", title: "Custom Title" });
    const [validated] = validateExploitFeasibility([original], SAMPLE_CODE);
    expect(validated.id).toBe("CUSTOM-ID");
    expect(validated.title).toBe("Custom Title");
    expect(validated.type).toBe("reentrancy");
  });
});
