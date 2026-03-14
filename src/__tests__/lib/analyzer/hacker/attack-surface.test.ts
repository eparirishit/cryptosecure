import { describe, it, expect, vi } from "vitest";
import { enumerateAttackSurface } from "@/lib/analyzer/hacker/attack-surface";
import type { AIProviderInterface } from "@/lib/analyzer/ai-providers";

const SAMPLE_CODE = `() recv_internal(int balance, int msg_value, cell in_msg_full, slice in_msg_body) {
  int op = in_msg_body~load_uint(32);
  if (op == 1) {
    ;; deposit
  }
  if (op == 2) {
    send_raw_message(msg, 64);
    balance -= amount;
  }
}

() withdraw(int amount) {
  send_raw_message(msg, 64);
}`;

describe("enumerateAttackSurface", () => {
  it("parses AI response with attackSurfaces key", async () => {
    const aiResponse = JSON.stringify({
      attackSurfaces: [
        { id: "AS1", entryPoint: "recv_internal", riskFactors: ["external call"], notes: "handles deposits" },
        { id: "AS2", entryPoint: "withdraw", riskFactors: ["fund transfer"], notes: "sends funds" },
      ],
    });
    const provider: AIProviderInterface = {
      generateResponse: vi.fn().mockResolvedValue({ content: aiResponse }),
    };
    const result = await enumerateAttackSurface(SAMPLE_CODE, "func", provider);
    expect(result).toHaveLength(2);
    expect(result[0].entryPoint).toBe("recv_internal");
    expect(result[1].entryPoint).toBe("withdraw");
  });

  it("uses fallback when AI returns empty surfaces", async () => {
    const provider: AIProviderInterface = {
      generateResponse: vi.fn().mockResolvedValue({ content: JSON.stringify({ attackSurfaces: [] }) }),
    };
    const result = await enumerateAttackSurface(SAMPLE_CODE, "func", provider);
    expect(result.length).toBeGreaterThan(0);
    const names = result.map((s) => s.entryPoint);
    expect(names).toContain("recv_internal");
  });

  it("uses fallback when AI throws", async () => {
    const provider: AIProviderInterface = {
      generateResponse: vi.fn().mockRejectedValue(new Error("API down")),
    };
    const result = await enumerateAttackSurface(SAMPLE_CODE, "func", provider);
    expect(result.length).toBeGreaterThan(0);
  });

  it("fallback detects risky keywords in function code", async () => {
    const provider: AIProviderInterface = {
      generateResponse: vi.fn().mockRejectedValue(new Error("fail")),
    };
    const result = await enumerateAttackSurface(SAMPLE_CODE, "func", provider);
    const withdrawSurface = result.find((s) => s.entryPoint === "withdraw");
    expect(withdrawSurface).toBeDefined();
    expect(withdrawSurface!.riskFactors).toContain("external call");
  });

  it("fallback detects missing access control", async () => {
    const provider: AIProviderInterface = {
      generateResponse: vi.fn().mockRejectedValue(new Error("fail")),
    };
    const result = await enumerateAttackSurface(SAMPLE_CODE, "func", provider);
    const withMissingAuth = result.find((s) =>
      s.riskFactors.includes("missing access control")
    );
    expect(withMissingAuth).toBeDefined();
  });
});
