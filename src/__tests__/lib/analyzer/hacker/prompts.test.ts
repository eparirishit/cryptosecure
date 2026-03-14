import { describe, it, expect } from "vitest";
import {
  getAttackSurfacePrompt,
  getHackerAgentPrompt,
  getDefenderAgentPrompt,
  ATTACK_SURFACE_PROMPT,
  HACKER_AGENT_PROMPT,
  DEFENDER_AGENT_PROMPT,
} from "@/lib/analyzer/hacker/prompts";

describe("prompt constants", () => {
  it("ATTACK_SURFACE_PROMPT is a non-empty string", () => {
    expect(ATTACK_SURFACE_PROMPT.length).toBeGreaterThan(100);
    expect(ATTACK_SURFACE_PROMPT).toContain("attackSurfaces");
  });

  it("HACKER_AGENT_PROMPT is a non-empty string", () => {
    expect(HACKER_AGENT_PROMPT.length).toBeGreaterThan(100);
    expect(HACKER_AGENT_PROMPT).toContain("exploits");
  });

  it("DEFENDER_AGENT_PROMPT is a non-empty string", () => {
    expect(DEFENDER_AGENT_PROMPT.length).toBeGreaterThan(100);
    expect(DEFENDER_AGENT_PROMPT).toContain("recommendations");
  });
});

describe("getAttackSurfacePrompt", () => {
  it("includes code and language", () => {
    const result = getAttackSurfacePrompt("int x = 5;", "func", [
      { name: "main", startLine: 1, endLine: 3 },
    ]);
    expect(result).toContain("int x = 5;");
    expect(result).toContain("FUNC");
    expect(result).toContain("main (lines 1-3)");
  });

  it("includes the base prompt", () => {
    const result = getAttackSurfacePrompt("code", "tact", []);
    expect(result).toContain("attackSurfaces");
  });
});

describe("getHackerAgentPrompt", () => {
  it("includes code, language, and attack surfaces", () => {
    const surfaces = [
      { id: "AS1", entryPoint: "recv_internal", riskFactors: ["external call"], notes: "test" },
    ];
    const result = getHackerAgentPrompt("code here", "func", surfaces);
    expect(result).toContain("code here");
    expect(result).toContain("FUNC");
    expect(result).toContain("recv_internal");
    expect(result).toContain("AS1");
  });
});

describe("getDefenderAgentPrompt", () => {
  it("includes code and exploit details", () => {
    const exploits = [
      { id: "EXP1", title: "Reentrancy", type: "reentrancy", prerequisites: "none", steps: ["step1"] },
    ];
    const result = getDefenderAgentPrompt("contract code", exploits);
    expect(result).toContain("contract code");
    expect(result).toContain("EXP1");
    expect(result).toContain("Reentrancy");
  });
});
