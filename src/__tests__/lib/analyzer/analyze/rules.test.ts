import { describe, it, expect } from "vitest";
import { RULES } from "@/lib/analyzer/analyze/rules";

describe("Security Rules", () => {
  it("has at least 4 rules defined", () => {
    expect(RULES.length).toBeGreaterThanOrEqual(4);
  });

  it("each rule has required fields", () => {
    for (const rule of RULES) {
      expect(rule.id).toBeTruthy();
      expect(rule.title).toBeTruthy();
      expect(rule.severity).toBeTruthy();
      expect(rule.description).toBeTruthy();
      expect(rule.suggestion).toBeTruthy();
      expect(rule.pattern).toBeInstanceOf(RegExp);
    }
  });

  it("FUNC_BOUNCED_CHECK rule is inverted (fail if NOT present)", () => {
    const rule = RULES.find((r) => r.id === "FUNC_BOUNCED_CHECK");
    expect(rule).toBeDefined();
    expect(rule!.invert).toBe(true);
    expect(rule!.pattern.test("flags & 1")).toBe(true);
  });

  it("FUNC_OWNER_CHECK rule is inverted", () => {
    const rule = RULES.find((r) => r.id === "FUNC_OWNER_CHECK");
    expect(rule).toBeDefined();
    expect(rule!.invert).toBe(true);
    expect(rule!.pattern.test("equal_slices")).toBe(true);
  });

  it("FUNC_SEND_RAW_MSG matches dangerous send modes", () => {
    const rule = RULES.find((r) => r.id === "FUNC_SEND_RAW_MSG");
    expect(rule).toBeDefined();
    expect(rule!.pattern.test("send_raw_message(msg, 0)")).toBe(true);
    expect(rule!.pattern.test("send_raw_message(msg, 1)")).toBe(true);
    expect(rule!.pattern.test("send_raw_message(msg, 2)")).toBe(true);
    expect(rule!.pattern.test("send_raw_message(msg, 64)")).toBe(false);
  });

  it("TIPJAR_VULNERABILITY matches balance subtraction or send_raw_message", () => {
    const rule = RULES.find((r) => r.id === "TIPJAR_VULNERABILITY");
    expect(rule).toBeDefined();
    expect(rule!.pattern.test("total_balance -= amount")).toBe(true);
    expect(rule!.pattern.test("send_raw_message(msg, 64)")).toBe(true);
  });

  it("all rules have valid severity values", () => {
    const validSeverities = ["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFORMATIONAL"];
    for (const rule of RULES) {
      expect(validSeverities).toContain(rule.severity);
    }
  });
});
