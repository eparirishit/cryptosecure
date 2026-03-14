import { describe, it, expect } from "vitest";
import { analyzeCodeStatic } from "@/lib/analyzer/analyze/engine";

const SECURE_CONTRACT = `() recv_internal(int my_balance, int msg_value, cell in_msg_full, slice in_msg_body) impure {
  slice cs = in_msg_full.begin_parse();
  int flags = cs~load_uint(4);
  if (flags & 1) { return (); }
  slice sender_address = cs~load_msg_addr();
  throw_unless(401, equal_slices(sender_address, owner_address));
  int op = in_msg_body~load_uint(32);
  send_raw_message(msg, 64);
}`;

const VULNERABLE_CONTRACT = `() recv_internal(int my_balance, int msg_value, cell in_msg_full, slice in_msg_body) impure {
  slice cs = in_msg_full.begin_parse();
  int op = in_msg_body~load_uint(32);
  send_raw_message(msg, 0);
}`;

const TIPJAR_VULNERABLE = `() recv_internal(int my_balance, int msg_value, cell in_msg_full, slice in_msg_body) impure {
  slice cs = in_msg_full.begin_parse();
  int flags = cs~load_uint(4);
  if (flags & 1) { return (); }
  int op = in_msg_body~load_uint(32);
  if (op == 2) {
    total_balance -= amount;
    send_raw_message(msg, 64);
  }
}`;

describe("analyzeCodeStatic", () => {
  it("returns a valid result structure", () => {
    const result = analyzeCodeStatic(SECURE_CONTRACT);
    expect(result).toHaveProperty("vulnerabilities");
    expect(result).toHaveProperty("summary");
    expect(result).toHaveProperty("score");
    expect(result).toHaveProperty("stats");
    expect(result).toHaveProperty("patchedCode");
  });

  it("gives higher score to secure code", () => {
    const secure = analyzeCodeStatic(SECURE_CONTRACT);
    const vulnerable = analyzeCodeStatic(VULNERABLE_CONTRACT);
    expect(secure.score).toBeGreaterThan(vulnerable.score);
  });

  it("detects missing bounce check", () => {
    const result = analyzeCodeStatic(VULNERABLE_CONTRACT);
    const bounceVuln = result.vulnerabilities.find(
      (v) => v.title === "Missing Bounced Message Check"
    );
    expect(bounceVuln).toBeDefined();
    expect(bounceVuln!.severity).toBe("Medium");
  });

  it("does NOT flag bounce check in secure contract", () => {
    const result = analyzeCodeStatic(SECURE_CONTRACT);
    const bounceVuln = result.vulnerabilities.find(
      (v) => v.title === "Missing Bounced Message Check"
    );
    expect(bounceVuln).toBeUndefined();
  });

  it("detects unchecked message sending with low mode", () => {
    const result = analyzeCodeStatic(VULNERABLE_CONTRACT);
    const sendVuln = result.vulnerabilities.find(
      (v) => v.title === "Unchecked Message Sending"
    );
    expect(sendVuln).toBeDefined();
    expect(sendVuln!.severity).toBe("High");
  });

  it("detects TipJar vulnerability (withdrawal without auth)", () => {
    const result = analyzeCodeStatic(TIPJAR_VULNERABLE);
    const tipjarVuln = result.vulnerabilities.find(
      (v) => v.title === "Potential Unprotected Withdrawal"
    );
    expect(tipjarVuln).toBeDefined();
    expect(tipjarVuln!.severity).toBe("Critical");
  });

  it("correctly aggregates stats", () => {
    const result = analyzeCodeStatic(VULNERABLE_CONTRACT);
    expect(result.stats.total).toBe(result.vulnerabilities.length);
    const sevCounts =
      result.stats.critical +
      result.stats.high +
      result.stats.medium +
      result.stats.low +
      result.stats.info;
    expect(sevCounts).toBe(result.stats.total);
  });

  it("clamps score to minimum 0", () => {
    const result = analyzeCodeStatic(TIPJAR_VULNERABLE);
    expect(result.score).toBeGreaterThanOrEqual(0);
  });

  it("summary includes finding count", () => {
    const result = analyzeCodeStatic(VULNERABLE_CONTRACT);
    expect(result.summary).toContain(String(result.vulnerabilities.length));
  });

  it("generates patched code", () => {
    const result = analyzeCodeStatic(VULNERABLE_CONTRACT);
    expect(result.patchedCode).toBeDefined();
    expect(typeof result.patchedCode).toBe("string");
  });
});
