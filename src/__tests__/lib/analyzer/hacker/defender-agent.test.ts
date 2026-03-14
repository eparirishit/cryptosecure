import { describe, it, expect, vi } from "vitest";
import { generateDefenseRecommendations } from "@/lib/analyzer/hacker/defender-agent";
import type { ExploitAttempt } from "@/types/analysis";
import type { AIProviderInterface } from "@/lib/analyzer/ai-providers";

function makeExploit(type: ExploitAttempt["type"]): ExploitAttempt {
  return {
    id: `EXP-${type}`,
    attackSurfaceId: "AS1",
    title: `${type} exploit`,
    type,
    prerequisites: "none",
    steps: ["step1"],
    expectedImpact: "high",
    likelihood: "high",
    status: "plausible",
    severity: "Critical",
  };
}

describe("generateDefenseRecommendations", () => {
  it("returns empty array when no exploits provided", async () => {
    const provider: AIProviderInterface = { generateResponse: vi.fn() };
    const result = await generateDefenseRecommendations("code", [], provider);
    expect(result).toEqual([]);
  });

  it("parses AI response with recommendations", async () => {
    const aiResponse = JSON.stringify({
      recommendations: [
        { exploitId: "EXP1", mitigation: "Add access control", codeExample: "code", tonSpecific: true },
      ],
    });
    const provider: AIProviderInterface = {
      generateResponse: vi.fn().mockResolvedValue({ content: aiResponse }),
    };
    const result = await generateDefenseRecommendations("code", [makeExploit("reentrancy")], provider);
    expect(result).toHaveLength(1);
    expect(result[0].mitigation).toBe("Add access control");
    expect(result[0].tonSpecific).toBe(true);
  });

  it("uses fallback on AI failure", async () => {
    const provider: AIProviderInterface = {
      generateResponse: vi.fn().mockRejectedValue(new Error("fail")),
    };
    const exploits = [makeExploit("reentrancy"), makeExploit("access-control")];
    const result = await generateDefenseRecommendations("code", exploits, provider);
    expect(result).toHaveLength(2);
    expect(result[0].exploitId).toBe("EXP-reentrancy");
    expect(result[0].tonSpecific).toBe(true);
  });

  it("generates fallback for each exploit type", async () => {
    const provider: AIProviderInterface = {
      generateResponse: vi.fn().mockRejectedValue(new Error("fail")),
    };
    const types: ExploitAttempt["type"][] = ["reentrancy", "access-control", "economic", "dos", "integer-overflow", "other"];
    const exploits = types.map(makeExploit);
    const result = await generateDefenseRecommendations("code", exploits, provider);
    expect(result).toHaveLength(6);
    for (const rec of result) {
      expect(rec.mitigation.length).toBeGreaterThan(0);
    }
  });

  it("filters out recommendations with missing exploitId", async () => {
    const aiResponse = JSON.stringify({
      recommendations: [
        { exploitId: "EXP1", mitigation: "Good rec" },
        { exploitId: "", mitigation: "Bad rec" },
        { mitigation: "No id" },
      ],
    });
    const provider: AIProviderInterface = {
      generateResponse: vi.fn().mockResolvedValue({ content: aiResponse }),
    };
    const result = await generateDefenseRecommendations("code", [makeExploit("reentrancy")], provider);
    expect(result).toHaveLength(1);
    expect(result[0].exploitId).toBe("EXP1");
  });
});
