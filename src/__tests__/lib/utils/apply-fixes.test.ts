import { describe, it, expect } from "vitest";
import { applyAllFixes } from "@/lib/utils/code";
import type { Finding } from "@/types/analysis";

function makeFinding(overrides: Partial<Finding> = {}): Finding {
  return {
    id: "TEST-001",
    title: "Test",
    severity: "HIGH",
    category: "Test",
    description: "desc",
    impact: "impact",
    recommendation: "fix it",
    codeChanges: {
      vulnerableCode: "bad()",
      fixedCode: "good()",
      startLine: 1,
      endLine: 1,
      changeDescription: "Fixed",
    },
    ...overrides,
  };
}

describe("applyAllFixes", () => {
  it("returns original code when no findings", () => {
    const code = "line1\nline2\nline3";
    expect(applyAllFixes(code, [])).toBe(code);
  });

  it("replaces vulnerable code with fixed code", () => {
    const code = "int x = bad();\nint y = 5;";
    const finding = makeFinding({
      codeChanges: {
        vulnerableCode: "bad()",
        fixedCode: "good()",
        startLine: 1,
        endLine: 1,
        changeDescription: "Fix",
      },
    });
    const result = applyAllFixes(code, [finding]);
    expect(result).toContain("good()");
  });

  it("handles multiline fixes", () => {
    const code = "line1\nold_code_1\nold_code_2\nline4";
    const finding = makeFinding({
      codeChanges: {
        vulnerableCode: "old_code_1\nold_code_2",
        fixedCode: "new_code_1\nnew_code_2\nnew_code_3",
        startLine: 2,
        endLine: 3,
        changeDescription: "Fix",
      },
    });
    const result = applyAllFixes(code, [finding]);
    expect(result).toContain("new_code_1");
    expect(result).toContain("new_code_3");
    expect(result).not.toContain("old_code_1");
  });

  it("skips findings without codeChanges", () => {
    const code = "line1\nline2";
    const finding = makeFinding({
      codeChanges: {
        vulnerableCode: "",
        fixedCode: "",
        startLine: 1,
        endLine: 1,
        changeDescription: "Fix",
      },
    });
    const result = applyAllFixes(code, [finding]);
    expect(result).toBe(code);
  });

  it("applies multiple non-overlapping fixes", () => {
    const code = "aaa\nbbb\nccc\nddd";
    const findings = [
      makeFinding({
        id: "F1",
        codeChanges: {
          vulnerableCode: "aaa",
          fixedCode: "AAA",
          startLine: 1,
          endLine: 1,
          changeDescription: "Fix 1",
        },
      }),
      makeFinding({
        id: "F2",
        codeChanges: {
          vulnerableCode: "ddd",
          fixedCode: "DDD",
          startLine: 4,
          endLine: 4,
          changeDescription: "Fix 2",
        },
      }),
    ];
    const result = applyAllFixes(code, findings);
    expect(result).toContain("AAA");
    expect(result).toContain("DDD");
  });
});
