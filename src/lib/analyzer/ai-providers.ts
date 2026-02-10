import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";

export type AIProvider = "claude" | "openai" | "gemini";

export interface AIProviderConfig {
  provider: AIProvider;
  apiKey: string;
  model?: string;
}

export interface AIResponse {
  content: string;
}

export interface AIOptions {
  temperature?: number;
}

export interface AIProviderInterface {
  generateResponse(systemPrompt: string, userPrompt: string, options?: AIOptions): Promise<AIResponse>;
}

// OpenAI Provider
class OpenAIProvider implements AIProviderInterface {
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, model: string = "gpt-4.1-2025-04-14") {
    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  async generateResponse(systemPrompt: string, userPrompt: string, options?: AIOptions): Promise<AIResponse> {
    console.log(`[OpenAI] Requesting completion with model: ${this.model}`);
    const startTime = Date.now();
    
    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: options?.temperature ?? 0.3,
      response_format: { type: "json_object" },
    });

    const duration = Date.now() - startTime;
    const content = completion.choices[0].message.content;
    
    if (!content) {
      throw new Error("Empty response from OpenAI");
    }

    console.log(`[OpenAI] Response received (${duration}ms), content length: ${content.length} chars`);
    return { content };
  }
}

// Gemini Provider
class GeminiProvider implements AIProviderInterface {
  private ai: GoogleGenAI;
  private model: string;

  constructor(apiKey: string, model: string = "gemini-2.5-pro") {
    this.ai = new GoogleGenAI({
      apiKey: apiKey,
    });
    this.model = model;
  }

  async generateResponse(systemPrompt: string, userPrompt: string, options?: AIOptions): Promise<AIResponse> {
    // Combine system and user prompts for Gemini (it doesn't have separate system messages)
    const combinedPrompt = `${systemPrompt}\n\n${userPrompt}`;
    
    console.log(`[Gemini] Requesting completion with model: ${this.model}`);
    const startTime = Date.now();

    try {
      const config = {
        thinkingConfig: {
          thinkingBudget: -1,
        },
        generationConfig: {
          temperature: options?.temperature ?? 0.3,
          responseMimeType: "application/json",
        },
      };

      const contents = [
        {
          role: "user" as const,
          parts: [
            {
              text: combinedPrompt,
            },
          ],
        },
      ];

      const response = await this.ai.models.generateContentStream({
        model: this.model,
        config,
        contents,
      });

      // Accumulate the streamed content
      let content = "";
      for await (const chunk of response) {
        if (chunk.text) {
          content += chunk.text;
        }
      }

      const duration = Date.now() - startTime;

      if (!content) {
        throw new Error("Empty response from Gemini");
      }

      console.log(`[Gemini] Response received (${duration}ms), content length: ${content.length} chars`);
      return { content };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.error(`[Gemini] API error (${duration}ms):`, error);
      throw new Error(`Gemini API error: ${error.message || error}`);
    }
  }
}

// Claude Provider
class ClaudeProvider implements AIProviderInterface {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string = "claude-sonnet-4-20250514") {
    this.apiKey = apiKey;
    this.model = model;
  }

  async generateResponse(systemPrompt: string, userPrompt: string, options?: AIOptions): Promise<AIResponse> {
    // Enhance system prompt to ensure JSON response for Claude
    const enhancedSystemPrompt = `${systemPrompt}\n\nIMPORTANT: You must respond with ONLY valid JSON. Do not include any markdown formatting, code blocks, or explanatory text outside the JSON.`;

    console.log(`[Claude] Requesting completion with model: ${this.model}`);
    const startTime = Date.now();

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 16384,
        temperature: options?.temperature ?? 0.3,
        system: enhancedSystemPrompt,
        messages: [
          {
            role: "user",
            content: userPrompt,
          },
        ],
      }),
    });

    const duration = Date.now() - startTime;

    if (!response.ok) {
      const error = await response.text();
      console.error(`[Claude] API error (${duration}ms):`, error);
      throw new Error(`Claude API error: ${error}`);
    }

    const data = await response.json();
    const content = data.content?.[0]?.text;
    
    if (!content) {
      throw new Error("Empty response from Claude");
    }

    console.log(`[Claude] Response received (${duration}ms), content length: ${content.length} chars`);
    return { content };
  }
}

// Factory function to create the appropriate provider
export function createAIProvider(config: AIProviderConfig): AIProviderInterface {
  switch (config.provider) {
    case "openai":
      return new OpenAIProvider(config.apiKey, config.model || "gpt-4.1-2025-04-14");
    case "gemini":
      return new GeminiProvider(config.apiKey, config.model || "gemini-2.5-pro");
    case "claude":
      return new ClaudeProvider(config.apiKey, config.model || "claude-sonnet-4-20250514");
    default:
      throw new Error(`Unsupported AI provider: ${config.provider}`);
  }
}

// Get provider configuration from environment variables
export function getProviderConfig(): AIProviderConfig | null {
  // Check for OpenAI
  if (process.env.OPENAI_API_KEY) {
    return {
      provider: "openai",
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL || "gpt-4.1-2025-04-14",
    };
  }

  // Check for Gemini
  if (process.env.GEMINI_API_KEY) {
    return {
      provider: "gemini",
      apiKey: process.env.GEMINI_API_KEY,
      model: process.env.GEMINI_MODEL || "gemini-2.5-pro",
    };
  }

  // Check for Claude
  if (process.env.CLAUDE_API_KEY) {
    return {
      provider: "claude",
      apiKey: process.env.CLAUDE_API_KEY,
      model: process.env.CLAUDE_MODEL || "claude-sonnet-4-20250514",
    };
  }

  // Check for explicit provider selection
  const explicitProvider = process.env.AI_PROVIDER as AIProvider | undefined;
  if (explicitProvider) {
    const apiKeyMap: Record<AIProvider, string | undefined> = {
      openai: process.env.OPENAI_API_KEY,
      gemini: process.env.GEMINI_API_KEY,
      claude: process.env.CLAUDE_API_KEY,
    };

    const apiKey = apiKeyMap[explicitProvider];
    if (apiKey) {
      return {
        provider: explicitProvider,
        apiKey,
        model: process.env[`${explicitProvider.toUpperCase()}_MODEL`] as string | undefined,
      };
    }
  }

  return null;
}

