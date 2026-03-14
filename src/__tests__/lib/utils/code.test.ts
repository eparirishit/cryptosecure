import { describe, it, expect } from "vitest";
import { normalizeCode, findCodePosition, applyAllFixes } from "@/lib/utils/code";
import type { Finding } from "@/types/analysis";

describe("normalizeCode", () => {
  it("converts \\r\\n to \\n", () => {
    expect(normalizeCode("a\r\nb")).toBe("a\nb");
  });

  it("converts lone \\r to \\n", () => {
    expect(normalizeCode("a\rb")).toBe("a\nb");
  });

  it("trims trailing whitespace from each line", () => {
    expect(normalizeCode("hello   \nworld  ")).toBe("hello\nworld");
  });

  it("leaves leading whitespace intact", () => {
    expect(normalizeCode("  indented\n    more")).toBe("  indented\n    more");
  });

  it("handles empty string", () => {
    expect(normalizeCode("")).toBe("");
  });
});

describe("findCodePosition", () => {
  const code = [
    "line0",
    "line1",
    "vulnerable_code_here",
    "line3",
    "line4",
  ].join("\n");

  it("finds exact match and returns correct line indices", () => {
    const result = findCodePosition(code, "vulnerable_code_here");
    expect(result).toEqual({ startIdx: 2, endIdx: 2 });
  });

  it("finds multi-line exact match", () => {
    const result = findCodePosition(code, "vulnerable_code_here\nline3");
    expect(result).toEqual({ startIdx: 2, endIdx: 3 });
  });

  it("returns null when vulnerable code is not found", () => {
    const result = findCodePosition(code, "not_in_code");
    expect(result).toBeNull();
  });

  it("returns a match at position 0 for empty vulnerable code (indexOf behavior)", () => {
    const result = findCodePosition(code, "");
    expect(result).toEqual({ startIdx: 0, endIdx: 0 });
  });

  it("handles fuzzy matching with partial line overlap", () => {
    const original = "  int balance = 100;\n  send_raw_message(msg, 0);\n  balance -= amount;";
    const vulnerable = "send_raw_message(msg, 0);\nbalance -= amount;";
    const result = findCodePosition(original, vulnerable);
    expect(result).not.toBeNull();
    expect(result!.startIdx).toBe(1);
  });
});

describe("applyAllFixes", () => {
  const originalCode = "line0\nvulnerable_line\nline2\nline3";

  const makeFinding = (overrides: Partial<Finding> = {}): Finding => ({
    id: "TEST-001",
    title: "Test Vuln",
    severity: "HIGH",
    category: "test",
    description: "desc",
    impact: "impact",
    recommendation: "fix it",
    codeChanges: {
      vulnerableCode: "vulnerable_line",
      fixedCode: "fixed_line",
      startLine: 2,
      endLine: 2,
      changeDescription: "Fixed the vulnerability",
    },
    ...overrides,
  });

  it("replaces vulnerable code with fixed code", () => {
    const result = applyAllFixes(originalCode, [makeFinding()]);
    expect(result).toBe("line0\nfixed_line\nline2\nline3");
  });

  it("returns original code when no findings have changes", () => {
    const finding = makeFinding({
      codeChanges: {
        vulnerableCode: "",
        fixedCode: "",
        startLine: 0,
        endLine: 0,
        changeDescription: "",
      },
    });
    const result = applyAllFixes(originalCode, [finding]);
    expect(result).toBe(originalCode);
  });

  it("handles multiple non-overlapping fixes (bottom-up)", () => {
    const code = "a\nb_vuln\nc\nd_vuln\ne";
    const findings = [
      makeFinding({
        id: "F1",
        codeChanges: {
          vulnerableCode: "b_vuln",
          fixedCode: "b_fixed",
          startLine: 2,
          endLine: 2,
          changeDescription: "fix b",
        },
      }),
      makeFinding({
        id: "F2",
        codeChanges: {
          vulnerableCode: "d_vuln",
          fixedCode: "d_fixed",
          startLine: 4,
          endLine: 4,
          changeDescription: "fix d",
        },
      }),
    ];
    const result = applyAllFixes(code, findings);
    expect(result).toBe("a\nb_fixed\nc\nd_fixed\ne");
  });

  it("skips findings with missing fixedCode", () => {
    const finding = makeFinding({
      codeChanges: {
        vulnerableCode: "vulnerable_line",
        fixedCode: "",
        startLine: 2,
        endLine: 2,
        changeDescription: "no fix",
      },
    });
    const result = applyAllFixes(originalCode, [finding]);
    expect(result).toBe(originalCode);
  });
});
