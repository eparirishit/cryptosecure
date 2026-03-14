import { describe, it, expect } from "vitest";
import {
  detectLanguage,
  createAnalysisPrompt,
  formatPreviousFindingsContext,
} from "@/lib/analyzer/analyze/prompts";
import type { Finding } from "@/types/analysis";

describe("detectLanguage", () => {
  it("detects FunC by #include", () => {
    expect(detectLanguage('#include "stdlib.fc"')).toBe("FunC");
  });

  it("detects FunC by 'impure' keyword", () => {
    expect(detectLanguage("() recv_internal() impure {}")).toBe("FunC");
  });

  it("detects FunC by 'slice' keyword", () => {
    expect(detectLanguage("slice s = in_msg_body;")).toBe("FunC");
  });

  it("detects FunC by 'cell' keyword", () => {
    expect(detectLanguage("cell c = begin_cell();")).toBe("FunC");
  });

  it("detects Tact by 'contract' keyword", () => {
    expect(detectLanguage("contract MyContract {}")).toBe("Tact");
  });

  it("detects Tact by 'trait' keyword", () => {
    expect(detectLanguage("trait Ownable {}")).toBe("Tact");
  });

  it("returns Unknown for unrecognized code", () => {
    expect(detectLanguage("function hello() { return 42; }")).toBe("Unknown");
  });

  it("prioritizes FunC over Tact when both keywords present", () => {
    // FunC check comes first in the code
    expect(detectLanguage("slice s; contract C {}")).toBe("FunC");
  });
});

describe("createAnalysisPrompt", () => {
  it("includes contract name and code", () => {
    const prompt = createAnalysisPrompt("int x = 5;", "TestContract");
    expect(prompt).toContain("TestContract");
    expect(prompt).toContain("int x = 5;");
  });

  it("includes line count", () => {
    const code = "line1\nline2\nline3";
    const prompt = createAnalysisPrompt(code, "Test");
    expect(prompt).toContain("Lines of Code: 3");
  });

  it("includes additional context when provided", () => {
    const prompt = createAnalysisPrompt("code", "Test", "some context");
    expect(prompt).toContain("Additional Context: some context");
  });

  it("omits additional context when empty", () => {
    const prompt = createAnalysisPrompt("code", "Test", "");
    expect(prompt).not.toContain("Additional Context:");
  });

  it("escapes XML entities in code", () => {
    const prompt = createAnalysisPrompt("a < b && c > d", "Test");
    expect(prompt).toContain("&lt;");
    expect(prompt).toContain("&gt;");
    expect(prompt).toContain("&amp;");
  });

  it("detects language and includes it", () => {
    const prompt = createAnalysisPrompt('#include "stdlib.fc"', "Test");
    expect(prompt).toContain("Language: FunC");
  });
});

describe("formatPreviousFindingsContext", () => {
  it("returns empty string for empty/null findings", () => {
    expect(formatPreviousFindingsContext([])).toBe("");
    expect(formatPreviousFindingsContext(null as unknown as Finding[])).toBe("");
  });

  it("includes finding severity, id, and title", () => {
    const findings: Finding[] = [
      {
        id: "CRIT-001",
        title: "Test Finding",
        severity: "CRITICAL",
        category: "test",
        description: "desc",
        impact: "impact",
        recommendation: "rec",
        codeChanges: {
          vulnerableCode: "bad code",
          fixedCode: "good code",
          startLine: 1,
          endLine: 2,
          changeDescription: "fix",
        },
      },
    ];
    const result = formatPreviousFindingsContext(findings);
    expect(result).toContain("[CRITICAL] CRIT-001: Test Finding");
    expect(result).toContain("Vulnerable pattern: bad code");
    expect(result).toContain("Applied fix: good code");
  });

  it("includes re-analysis instructions", () => {
    const findings: Finding[] = [
      {
        id: "F1",
        title: "T",
        severity: "HIGH",
        category: "c",
        description: "d",
        impact: "i",
        recommendation: "r",
        codeChanges: {
          vulnerableCode: "v",
          fixedCode: "f",
          startLine: 1,
          endLine: 1,
          changeDescription: "c",
        },
      },
    ];
    const result = formatPreviousFindingsContext(findings);
    expect(result).toContain("RE-ANALYSIS");
    expect(result).toContain("positiveFindings");
  });
});
