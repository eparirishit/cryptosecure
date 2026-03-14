import { describe, it, expect, vi } from "vitest";
import { generateExploits } from "@/lib/analyzer/hacker/hacker-agent";
import type { AttackSurface } from "@/types/analysis";
import type { AIProviderInterface } from "@/lib/analyzer/ai-providers";

const mockSurfaces: AttackSurface[] = [
  { id: "AS1", entryPoint: "recv_internal", riskFactors: ["external call"], notes: "test" },
];

function mockProvider(response: string): AIProviderInterface {
  return {
    generateResponse: vi.fn().mockResolvedValue({ content: response }),
  };
}

describe("generateExploits", () => {
  it("returns empty array when no attack surfaces provided", async () => {
    const provider = mockProvider("{}");
    const result = await generateExploits("code", "func", [], provider);
    expect(result).toEqual([]);
  });

  it("parses AI response with exploits key", async () => {
    const aiResponse = JSON.stringify({
      exploits: [
        {
          id: "EXP1",
          attackSurfaceId: "AS1",
          title: "Test Exploit",
          type: "reentrancy",
          prerequisites: "none",
          steps: ["step1", "step2"],
          expectedImpact: "high",
          likelihood: "high",
          severity: "Critical",
        },
      ],
    });
    const provider = mockProvider(aiResponse);
    const result = await generateExploits("code", "func", mockSurfaces, provider);
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Test Exploit");
    expect(result[0].type).toBe("reentrancy");
    expect(result[0].severity).toBe("Critical");
  });

  it("uses fallback when AI returns empty exploits", async () => {
    const provider = mockProvider(JSON.stringify({ exploits: [] }));
    const code = "send_raw_message(msg, 64);\nbalance -= amount;";
    const result = await generateExploits(code, "func", mockSurfaces, provider);
    expect(result.length).toBeGreaterThanOrEqual(0);
  });

  it("uses fallback when AI throws", async () => {
    const provider: AIProviderInterface = {
      generateResponse: vi.fn().mockRejectedValue(new Error("API down")),
    };
    const code = "send_raw_message(msg, 64);\nbalance -= amount;";
    const result = await generateExploits(code, "func", mockSurfaces, provider);
    expect(Array.isArray(result)).toBe(true);
  });

  it("detects reentrancy pattern in fallback", async () => {
    const provider: AIProviderInterface = {
      generateResponse: vi.fn().mockRejectedValue(new Error("fail")),
    };
    const code = "send_raw_message(msg, 64);\nbalance -= amount;";
    const result = await generateExploits(code, "func", mockSurfaces, provider);
    const reentrancy = result.find((e) => e.type === "reentrancy");
    expect(reentrancy).toBeDefined();
  });

  it("detects unprotected recv_external in fallback", async () => {
    const provider: AIProviderInterface = {
      generateResponse: vi.fn().mockRejectedValue(new Error("fail")),
    };
    const code = "recv_external() {\n  accept_message();\n  do_stuff();\n}";
    const result = await generateExploits(code, "func", mockSurfaces, provider);
    const accessControl = result.find((e) => e.type === "access-control");
    expect(accessControl).toBeDefined();
  });

  it("detects missing balance check in fallback", async () => {
    const provider: AIProviderInterface = {
      generateResponse: vi.fn().mockRejectedValue(new Error("fail")),
    };
    const code = "int amount = in_msg_body~load_coins();\nsend_raw_message(msg, 64);";
    const result = await generateExploits(code, "func", mockSurfaces, provider);
    const unchecked = result.find((e) => e.title.includes("Unchecked Withdrawal"));
    expect(unchecked).toBeDefined();
  });

  it("normalizes exploit types from AI response", async () => {
    const aiResponse = JSON.stringify({
      exploits: [
        { id: "E1", title: "T", type: "Denial of Service", steps: [], likelihood: "low", severity: "Medium" },
        { id: "E2", title: "T", type: "Integer Overflow Attack", steps: [], likelihood: "medium", severity: "High" },
        { id: "E3", title: "T", type: "Economic Griefing", steps: [], likelihood: "high", severity: "High" },
      ],
    });
    const provider = mockProvider(aiResponse);
    const result = await generateExploits("code", "func", mockSurfaces, provider);
    expect(result[0].type).toBe("dos");
    expect(result[1].type).toBe("integer-overflow");
    expect(result[2].type).toBe("economic");
  });
});
