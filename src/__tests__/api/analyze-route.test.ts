import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/analyzer/ai-providers", () => ({
  getProviderConfig: vi.fn(),
  createAIProvider: vi.fn(),
}));

import { POST } from "@/app/api/analyze/route";
import { getProviderConfig, createAIProvider } from "@/lib/analyzer/ai-providers";

const mockedGetProviderConfig = vi.mocked(getProviderConfig);
const mockedCreateAIProvider = vi.mocked(createAIProvider);

function makeRequest(body: Record<string, unknown>): Request {
  return new Request("http://localhost:3000/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/analyze", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 if code is missing", async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("Invalid code");
  });

  it("returns 400 if code is not a string", async () => {
    const res = await POST(makeRequest({ code: 123 }));
    expect(res.status).toBe(400);
  });

  it("returns 500 if no AI provider is configured", async () => {
    mockedGetProviderConfig.mockReturnValue(null);
    const res = await POST(makeRequest({ code: "int x = 5;" }));
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toContain("not configured");
  });

  it("returns 500 when AI provider throws", async () => {
    mockedGetProviderConfig.mockReturnValue({
      provider: "openai",
      apiKey: "test-key",
      model: "gpt-4",
    });
    mockedCreateAIProvider.mockReturnValue({
      generateResponse: vi.fn().mockRejectedValue(new Error("API error")),
    });
    const res = await POST(makeRequest({ code: "int x = 5;" }));
    expect(res.status).toBe(500);
  });

  it("returns valid JSON for a successful analysis", async () => {
    const mockResponse = {
      analysisMetadata: {
        contractName: "test",
        language: "FunC",
        linesOfCode: 1,
        analysisDate: new Date().toISOString(),
        totalIssuesFound: 0,
      },
      securityScore: 95,
      grade: "A",
      executiveSummary: "All good",
      findingsSummary: { critical: 0, high: 0, medium: 0, low: 0, informational: 0, totalFindings: 0 },
      findings: [],
      recommendations: [],
      gasOptimizations: [],
    };

    mockedGetProviderConfig.mockReturnValue({
      provider: "openai",
      apiKey: "test-key",
      model: "gpt-4",
    });
    mockedCreateAIProvider.mockReturnValue({
      generateResponse: vi.fn().mockResolvedValue({
        content: JSON.stringify(mockResponse),
      }),
    });

    const res = await POST(makeRequest({ code: "int x = 5;", contractName: "test" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.securityScore).toBe(95);
    expect(json.grade).toBe("A");
  });
});
