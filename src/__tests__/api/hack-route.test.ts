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

  it("returns 500 when provider is not configured", async () => {
    mockedGetProviderConfig.mockReturnValue(null);
    const res = await POST(makeRequest({ code: "int x = 5;", language: "func" }));
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toContain("AI service not configured");
  });

  it("returns empty exploits when generateExploits returns []", async () => {
    mockedEnumerateAttackSurface.mockResolvedValue([
      { id: "AS1", entryPoint: "recv_internal", riskFactors: ["test"], notes: "test" },
    ]);
    mockedGenerateExploits.mockResolvedValue([]);

    const res = await POST(makeRequest({ code: "code", language: "func" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.exploits).toEqual([]);
    expect(json.summary).toContain("no exploit strategies");
  });

  it("calculates score correctly with multiple exploits", async () => {
    const mockSurfaces = [
      { id: "AS1", entryPoint: "recv_internal", riskFactors: ["test"], notes: "" },
    ];
    const mockExploits = [
      {
        id: "EXP1", attackSurfaceId: "AS1", title: "Exploit 1",
        type: "reentrancy" as const, prerequisites: "", steps: [],
        expectedImpact: "", likelihood: "high" as const,
        status: "plausible" as const, severity: "Critical" as const,
      },
      {
        id: "EXP2", attackSurfaceId: "AS1", title: "Exploit 2",
        type: "dos" as const, prerequisites: "", steps: [],
        expectedImpact: "", likelihood: "medium" as const,
        status: "theoretical" as const, severity: "Medium" as const,
      },
    ];

    mockedEnumerateAttackSurface.mockResolvedValue(mockSurfaces);
    mockedGenerateExploits.mockResolvedValue(mockExploits);
    mockedValidateExploitFeasibility.mockReturnValue(mockExploits);
    mockedGenerateDefenseRecommendations.mockResolvedValue([]);

    const res = await POST(makeRequest({ code: "code", language: "func" }));
    const json = await res.json();
    expect(json.hackerResilienceScore).toBeGreaterThanOrEqual(0);
    expect(json.hackerResilienceScore).toBeLessThanOrEqual(100);
    expect(json.riskLevel).toBeDefined();
    expect(json.summary).toContain("1 plausible exploit");
  });

  it("includes vulnerabilityScore in scoring when provided", async () => {
    const mockSurfaces = [
      { id: "AS1", entryPoint: "recv_internal", riskFactors: ["test"], notes: "" },
    ];
    const mockExploits = [
      {
        id: "EXP1", attackSurfaceId: "AS1", title: "Exploit 1",
        type: "reentrancy" as const, prerequisites: "", steps: [],
        expectedImpact: "", likelihood: "low" as const,
        status: "plausible" as const, severity: "Low" as const,
      },
    ];

    mockedEnumerateAttackSurface.mockResolvedValue(mockSurfaces);
    mockedGenerateExploits.mockResolvedValue(mockExploits);
    mockedValidateExploitFeasibility.mockReturnValue(mockExploits);
    mockedGenerateDefenseRecommendations.mockResolvedValue([]);

    const res = await POST(
      makeRequest({ code: "code", language: "func", vulnerabilityScore: 30 })
    );
    const json = await res.json();
    expect(json.hackerResilienceScore).toBeLessThanOrEqual(45);
  });

  it("includes originalVulnerabilities in scoring", async () => {
    const mockSurfaces = [
      { id: "AS1", entryPoint: "recv_internal", riskFactors: ["test"], notes: "" },
    ];
    const mockExploits = [
      {
        id: "EXP1", attackSurfaceId: "AS1", title: "Exploit 1",
        type: "other" as const, prerequisites: "", steps: [],
        expectedImpact: "", likelihood: "low" as const,
        status: "not-applicable" as const, severity: "Info" as const,
      },
    ];
    const findings = [
      {
        id: "CRIT-1", title: "Crit", severity: "CRITICAL", category: "test",
        description: "", impact: "", recommendation: "",
        codeChanges: { vulnerableCode: "", fixedCode: "", startLine: 1, endLine: 1, changeDescription: "" },
      },
    ];

    mockedEnumerateAttackSurface.mockResolvedValue(mockSurfaces);
    mockedGenerateExploits.mockResolvedValue(mockExploits);
    mockedValidateExploitFeasibility.mockReturnValue(mockExploits);
    mockedGenerateDefenseRecommendations.mockResolvedValue([]);

    const res = await POST(
      makeRequest({ code: "code", language: "func", originalVulnerabilities: findings })
    );
    const json = await res.json();
    expect(json.hackerResilienceScore).toBeLessThanOrEqual(80);
  });

  it("returns 500 when an unexpected error occurs", async () => {
    mockedEnumerateAttackSurface.mockRejectedValue(new Error("Unexpected"));

    const res = await POST(makeRequest({ code: "code", language: "func" }));
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toContain("failed");
  });

  it("reads x-forwarded-for header for client IP", async () => {
    mockedEnumerateAttackSurface.mockResolvedValue([]);
    const req = new Request("http://localhost:3000/api/hack", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": "1.2.3.4, 5.6.7.8",
      },
      body: JSON.stringify({ code: "code", language: "func" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it("reads x-real-ip header when x-forwarded-for is absent", async () => {
    mockedEnumerateAttackSurface.mockResolvedValue([]);
    const req = new Request("http://localhost:3000/api/hack", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-real-ip": "10.0.0.1",
      },
      body: JSON.stringify({ code: "code", language: "func" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it("returns risk level 'None' for high score with zero plausible exploits", async () => {
    mockedEnumerateAttackSurface.mockResolvedValue([]);

    const res = await POST(makeRequest({ code: "code", language: "func" }));
    const json = await res.json();
    expect(json.riskLevel).toBe("None");
  });

  it("returns risk level 'Critical' when score is very low", async () => {
    const surfaces = [
      { id: "AS1", entryPoint: "recv_internal", riskFactors: ["x"], notes: "" },
    ];
    const exploits = Array.from({ length: 5 }, (_, i) => ({
      id: `EXP${i}`,
      attackSurfaceId: "AS1",
      title: `Exploit ${i}`,
      type: "reentrancy" as const,
      prerequisites: "",
      steps: [],
      expectedImpact: "",
      likelihood: "high" as const,
      status: "plausible" as const,
      severity: "Critical" as const,
    }));

    mockedEnumerateAttackSurface.mockResolvedValue(surfaces);
    mockedGenerateExploits.mockResolvedValue(exploits);
    mockedValidateExploitFeasibility.mockReturnValue(exploits);
    mockedGenerateDefenseRecommendations.mockResolvedValue([]);

    const res = await POST(makeRequest({ code: "code", language: "func" }));
    const json = await res.json();
    expect(json.riskLevel).toBe("Critical");
    expect(json.hackerResilienceScore).toBe(0);
  });

  it("returns risk level 'Medium' for moderate score", async () => {
    const surfaces = [
      { id: "AS1", entryPoint: "recv_internal", riskFactors: ["x"], notes: "" },
    ];
    const exploits = [
      {
        id: "EXP1",
        attackSurfaceId: "AS1",
        title: "Exploit 1",
        type: "other" as const,
        prerequisites: "",
        steps: [],
        expectedImpact: "",
        likelihood: "medium" as const,
        status: "plausible" as const,
        severity: "Medium" as const,
      },
    ];

    mockedEnumerateAttackSurface.mockResolvedValue(surfaces);
    mockedGenerateExploits.mockResolvedValue(exploits);
    mockedValidateExploitFeasibility.mockReturnValue(exploits);
    mockedGenerateDefenseRecommendations.mockResolvedValue([]);

    const res = await POST(
      makeRequest({
        code: "code",
        language: "func",
        vulnerabilityScore: 45,
      })
    );
    const json = await res.json();
    expect(json.riskLevel).toBe("Medium");
  });

  it("handles Info severity in exploit scoring", async () => {
    const surfaces = [
      { id: "AS1", entryPoint: "recv_internal", riskFactors: ["x"], notes: "" },
    ];
    const exploits = [
      {
        id: "EXP1",
        attackSurfaceId: "AS1",
        title: "Info exploit",
        type: "other" as const,
        prerequisites: "",
        steps: [],
        expectedImpact: "",
        likelihood: "low" as const,
        status: "plausible" as const,
        severity: "Info" as const,
      },
    ];

    mockedEnumerateAttackSurface.mockResolvedValue(surfaces);
    mockedGenerateExploits.mockResolvedValue(exploits);
    mockedValidateExploitFeasibility.mockReturnValue(exploits);
    mockedGenerateDefenseRecommendations.mockResolvedValue([]);

    const res = await POST(makeRequest({ code: "code", language: "func" }));
    const json = await res.json();
    expect(json.hackerResilienceScore).toBe(94);
  });

  it("penalizes findings of all severities in calculateVulnerabilityPenalty", async () => {
    const surfaces = [
      { id: "AS1", entryPoint: "fn", riskFactors: ["x"], notes: "" },
    ];
    const exploits = [
      {
        id: "EXP1",
        attackSurfaceId: "AS1",
        title: "T",
        type: "other" as const,
        prerequisites: "",
        steps: [],
        expectedImpact: "",
        likelihood: "low" as const,
        status: "not-applicable" as const,
        severity: "Info" as const,
      },
    ];
    const findings = [
      { id: "1", title: "H", severity: "HIGH", category: "t", description: "", impact: "", recommendation: "", codeChanges: { vulnerableCode: "", fixedCode: "", startLine: 1, endLine: 1, changeDescription: "" } },
      { id: "2", title: "M", severity: "MEDIUM", category: "t", description: "", impact: "", recommendation: "", codeChanges: { vulnerableCode: "", fixedCode: "", startLine: 1, endLine: 1, changeDescription: "" } },
      { id: "3", title: "L", severity: "LOW", category: "t", description: "", impact: "", recommendation: "", codeChanges: { vulnerableCode: "", fixedCode: "", startLine: 1, endLine: 1, changeDescription: "" } },
    ];

    mockedEnumerateAttackSurface.mockResolvedValue(surfaces);
    mockedGenerateExploits.mockResolvedValue(exploits);
    mockedValidateExploitFeasibility.mockReturnValue(exploits);
    mockedGenerateDefenseRecommendations.mockResolvedValue([]);

    const res = await POST(
      makeRequest({ code: "c", language: "func", originalVulnerabilities: findings })
    );
    const json = await res.json();
    expect(json.hackerResilienceScore).toBe(81);
  });
});
