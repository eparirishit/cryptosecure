import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("openai", () => {
  return {
    default: class MockOpenAI {
      constructor() {}
      chat = { completions: { create: vi.fn() } };
    },
  };
});

vi.mock("@google/genai", () => ({
  GoogleGenAI: class MockGoogleGenAI {
    constructor() {}
    models = { generateContentStream: vi.fn() };
  },
}));

import { createAIProvider, getProviderConfig } from "@/lib/analyzer/ai-providers";

describe("createAIProvider", () => {
  it("creates an OpenAI provider", () => {
    const provider = createAIProvider({ provider: "openai", apiKey: "test-key" });
    expect(provider).toBeDefined();
    expect(provider.generateResponse).toBeInstanceOf(Function);
  });

  it("creates a Gemini provider", () => {
    const provider = createAIProvider({ provider: "gemini", apiKey: "test-key" });
    expect(provider).toBeDefined();
    expect(provider.generateResponse).toBeInstanceOf(Function);
  });

  it("creates a Claude provider", () => {
    const provider = createAIProvider({ provider: "claude", apiKey: "test-key" });
    expect(provider).toBeDefined();
    expect(provider.generateResponse).toBeInstanceOf(Function);
  });

  it("accepts a custom model", () => {
    const provider = createAIProvider({ provider: "openai", apiKey: "key", model: "gpt-3.5-turbo" });
    expect(provider).toBeDefined();
  });

  it("throws for unsupported provider", () => {
    expect(() =>
      createAIProvider({ provider: "unknown" as any, apiKey: "key" })
    ).toThrow("Unsupported AI provider");
  });
});

describe("getProviderConfig", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.OPENAI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    delete process.env.CLAUDE_API_KEY;
    delete process.env.AI_PROVIDER;
    delete process.env.OPENAI_MODEL;
    delete process.env.GEMINI_MODEL;
    delete process.env.CLAUDE_MODEL;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns null when no API keys are set", () => {
    expect(getProviderConfig()).toBeNull();
  });

  it("detects OpenAI key", () => {
    process.env.OPENAI_API_KEY = "sk-test";
    const config = getProviderConfig();
    expect(config).not.toBeNull();
    expect(config!.provider).toBe("openai");
    expect(config!.apiKey).toBe("sk-test");
  });

  it("detects Gemini key", () => {
    process.env.GEMINI_API_KEY = "gemini-test";
    const config = getProviderConfig();
    expect(config).not.toBeNull();
    expect(config!.provider).toBe("gemini");
  });

  it("detects Claude key", () => {
    process.env.CLAUDE_API_KEY = "claude-test";
    const config = getProviderConfig();
    expect(config).not.toBeNull();
    expect(config!.provider).toBe("claude");
  });

  it("prioritizes OpenAI over Gemini", () => {
    process.env.OPENAI_API_KEY = "sk-test";
    process.env.GEMINI_API_KEY = "gemini-test";
    const config = getProviderConfig();
    expect(config!.provider).toBe("openai");
  });

  it("uses custom model from env var", () => {
    process.env.OPENAI_API_KEY = "sk-test";
    process.env.OPENAI_MODEL = "gpt-3.5-turbo";
    const config = getProviderConfig();
    expect(config!.model).toBe("gpt-3.5-turbo");
  });

  it("handles explicit AI_PROVIDER env var", () => {
    process.env.AI_PROVIDER = "gemini";
    process.env.GEMINI_API_KEY = "gemini-key";
    const config = getProviderConfig();
    expect(config).not.toBeNull();
    expect(config!.provider).toBe("gemini");
  });

  it("returns null for explicit provider without matching key", () => {
    process.env.AI_PROVIDER = "openai";
    const config = getProviderConfig();
    expect(config).toBeNull();
  });
});

describe("OpenAI provider generateResponse", () => {
  it("calls the OpenAI API and returns content", async () => {
    const provider = createAIProvider({ provider: "openai", apiKey: "key" });
    // Access the internal mocked client
    const mockCreate = vi.fn().mockResolvedValue({
      choices: [{ message: { content: '{"result": true}' } }],
    });
    (provider as any).client = { chat: { completions: { create: mockCreate } } };

    const result = await provider.generateResponse("system", "user");
    expect(result.content).toBe('{"result": true}');
    expect(mockCreate).toHaveBeenCalled();
  });

  it("throws when OpenAI returns empty content", async () => {
    const provider = createAIProvider({ provider: "openai", apiKey: "key" });
    const mockCreate = vi.fn().mockResolvedValue({
      choices: [{ message: { content: null } }],
    });
    (provider as any).client = { chat: { completions: { create: mockCreate } } };

    await expect(provider.generateResponse("system", "user")).rejects.toThrow("Empty response");
  });
});

describe("Gemini provider generateResponse", () => {
  it("accumulates streamed content and returns it", async () => {
    const provider = createAIProvider({ provider: "gemini", apiKey: "key" });
    const mockStream = (async function* () {
      yield { text: '{"part' };
      yield { text: '": 1}' };
    })();
    (provider as any).ai = {
      models: {
        generateContentStream: vi.fn().mockResolvedValue(mockStream),
      },
    };

    const result = await provider.generateResponse("system", "user");
    expect(result.content).toBe('{"part": 1}');
  });

  it("throws on empty streamed response", async () => {
    const provider = createAIProvider({ provider: "gemini", apiKey: "key" });
    const mockStream = (async function* () {
      yield { text: "" };
    })();
    (provider as any).ai = {
      models: {
        generateContentStream: vi.fn().mockResolvedValue(mockStream),
      },
    };

    await expect(provider.generateResponse("system", "user")).rejects.toThrow("Empty response");
  });

  it("wraps API errors with descriptive message", async () => {
    const provider = createAIProvider({ provider: "gemini", apiKey: "key" });
    (provider as any).ai = {
      models: {
        generateContentStream: vi.fn().mockRejectedValue(new Error("quota exceeded")),
      },
    };

    await expect(provider.generateResponse("system", "user")).rejects.toThrow("Gemini API error: quota exceeded");
  });

  it("handles non-Error thrown values", async () => {
    const provider = createAIProvider({ provider: "gemini", apiKey: "key" });
    (provider as any).ai = {
      models: {
        generateContentStream: vi.fn().mockRejectedValue("string error"),
      },
    };

    await expect(provider.generateResponse("system", "user")).rejects.toThrow("Gemini API error: string error");
  });

  it("skips chunks without text property", async () => {
    const provider = createAIProvider({ provider: "gemini", apiKey: "key" });
    const mockStream = (async function* () {
      yield { text: "hello" };
      yield {};
      yield { text: " world" };
    })();
    (provider as any).ai = {
      models: {
        generateContentStream: vi.fn().mockResolvedValue(mockStream),
      },
    };

    const result = await provider.generateResponse("system", "user");
    expect(result.content).toBe("hello world");
  });

  it("passes temperature from options", async () => {
    const provider = createAIProvider({ provider: "gemini", apiKey: "key" });
    const mockGenerate = vi.fn().mockResolvedValue(
      (async function* () {
        yield { text: '{"ok": true}' };
      })()
    );
    (provider as any).ai = { models: { generateContentStream: mockGenerate } };

    await provider.generateResponse("system", "user", { temperature: 0.7 });
    expect(mockGenerate).toHaveBeenCalledWith(
      expect.objectContaining({
        config: expect.objectContaining({
          generationConfig: expect.objectContaining({ temperature: 0.7 }),
        }),
      })
    );
  });
});

describe("Claude provider generateResponse", () => {
  it("calls the Anthropic API and returns content", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ content: [{ text: '{"result": true}' }] }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const provider = createAIProvider({ provider: "claude", apiKey: "key" });
    const result = await provider.generateResponse("system", "user");
    expect(result.content).toBe('{"result": true}');
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.anthropic.com/v1/messages",
      expect.objectContaining({ method: "POST" })
    );

    vi.unstubAllGlobals();
  });

  it("throws on non-OK response from Claude", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      text: () => Promise.resolve("Unauthorized"),
    });
    vi.stubGlobal("fetch", mockFetch);

    const provider = createAIProvider({ provider: "claude", apiKey: "key" });
    await expect(provider.generateResponse("system", "user")).rejects.toThrow("Claude API error");

    vi.unstubAllGlobals();
  });

  it("throws when Claude returns empty content", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ content: [] }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const provider = createAIProvider({ provider: "claude", apiKey: "key" });
    await expect(provider.generateResponse("system", "user")).rejects.toThrow("Empty response");

    vi.unstubAllGlobals();
  });
});
