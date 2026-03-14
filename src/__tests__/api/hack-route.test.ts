import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/analyzer/ai-providers", () => ({
  getProviderConfig: vi.fn(),
  createAIProvider: vi.fn(),
}));

vi.mock("@/lib/analyzer/hacker/attack-surface", () => ({
  enumerateAttackSurface: vi.fn(),
}));

vi.mock("@/lib/analyzer/hacker/hacker-agent", () => ({
  generateExploits: vi.fn(),
}));

vi.mock("@/lib/analyzer/hacker/feasibility-check", () => ({
  validateExploitFeasibility: vi.fn(),
}));

vi.mock("@/lib/analyzer/hacker/defender-agent", () => ({
  generateDefenseRecommendations: vi.fn(),
}));

import { POST } from "@/app/api/hack/route";
import { getProviderConfig, createAIProvider } from "@/lib/analyzer/ai-providers";
import { enumerateAttackSurface } from "@/lib/analyzer/hacker/attack-surface";
import { generateExploits } from "@/lib/analyzer/hacker/hacker-agent";
import { validateExploitFeasibility } from "@/lib/analyzer/hacker/feasibility-check";
import { generateDefenseRecommendations } from "@/lib/analyzer/hacker/defender-agent";

const mockedGetProviderConfig = vi.mocked(getProviderConfig);
const mockedCreateAIProvider = vi.mocked(createAIProvider);
const mockedEnumerateAttackSurface = vi.mocked(enumerateAttackSurface);
const mockedGenerateExploits = vi.mocked(generateExploits);
const mockedValidateExploitFeasibility = vi.mocked(validateExploitFeasibility);
const mockedGenerateDefenseRecommendations = vi.mocked(generateDefenseRecommendations);

function makeRequest(body: Record<string, unknown>): Request {
  return new Request("http://localhost:3000/api/hack", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/hack", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetProviderConfig.mockReturnValue({
      provider: "openai",
      apiKey: "test-key",
      model: "gpt-4",
    });
    mockedCreateAIProvider.mockReturnValue({
      generateResponse: vi.fn(),
    });
  });

  it("returns 400 if code is missing", async () => {
    const res = await POST(makeRequest({ language: "func" }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("Invalid code");
  });

  it("returns 400 if language is missing", async () => {
    const res = await POST(makeRequest({ code: "int x = 5;" }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("Invalid language");
  });

  it("returns result with no exploits when no attack surfaces found", async () => {
    mockedEnumerateAttackSurface.mockResolvedValue([]);

    const res = await POST(
      makeRequest({ code: "int x = 5;", language: "func" })
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.attackSurface).toEqual([]);
    expect(json.exploits).toEqual([]);
    expect(json.hackerResilienceScore).toBeDefined();
  });

  it("returns full result when exploits are found", async () => {
    const mockSurfaces = [
      { id: "AS1", entryPoint: "recv_internal", riskFactors: ["external call"], notes: "test" },
    ];
    const mockExploits = [
      {
        id: "EXP1",
        attackSurfaceId: "AS1",
        title: "Reentrancy",
        type: "reentrancy" as const,
        prerequisites: "none",
        steps: ["step1"],
        expectedImpact: "high",
        likelihood: "high" as const,
        status: "plausible" as const,
        severity: "Critical" as const,
      },
    ];

    mockedEnumerateAttackSurface.mockResolvedValue(mockSurfaces);
    mockedGenerateExploits.mockResolvedValue(mockExploits);
    mockedValidateExploitFeasibility.mockReturnValue(mockExploits);
    mockedGenerateDefenseRecommendations.mockResolvedValue([
      { exploitId: "EXP1", mitigation: "Fix it" },
    ]);

    const res = await POST(
      makeRequest({ code: "() recv_internal() { send_raw_message(msg, 0); }", language: "func" })
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.exploits).toHaveLength(1);
    expect(json.attackSurface).toHaveLength(1);
    expect(json.recommendations).toHaveLength(1);
    expect(json.riskLevel).toBeDefined();
    expect(json.hackerResilienceScore).toBeLessThanOrEqual(100);
  });
});
