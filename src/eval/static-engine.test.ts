/**
 * Static Engine Unit Tests
 *
 * Deterministic tests for the regex-based static analysis engine.
 * No AI calls, no network — runs entirely offline.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { analyzeCodeStatic } from '@/lib/analyzer/analyze/engine';
import { GROUND_TRUTH } from './ground-truth';

function loadContract(relativePath: string): string {
  const fullPath = path.resolve(process.cwd(), relativePath);
  return fs.readFileSync(fullPath, 'utf-8');
}

/* ── Helper: find a vulnerability by title keyword ───────────────── */
function hasVulnMatching(vulns: { title: string }[], keyword: string): boolean {
  return vulns.some((v) => v.title.toLowerCase().includes(keyword.toLowerCase()));
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  VulnerableWallet.fc                                               */
/* ═══════════════════════════════════════════════════════════════════ */
describe('Static Engine — VulnerableWallet.fc', () => {
  const gt = GROUND_TRUTH.find((g) => g.contractFile === 'VulnerableWallet.fc')!;
  const code = loadContract(gt.contractPath);
  const result = analyzeCodeStatic(code);

  it('should detect missing bounce check (FUNC_BOUNCED_CHECK)', () => {
    expect(hasVulnMatching(result.vulnerabilities, 'bounce')).toBe(true);
  });

  it('should detect missing owner access control (FUNC_OWNER_CHECK)', () => {
    expect(hasVulnMatching(result.vulnerabilities, 'access control') ||
           hasVulnMatching(result.vulnerabilities, 'owner')).toBe(true);
  });

  it('should detect TipJar / unprotected withdrawal pattern', () => {
    // FUNC_SEND_RAW_MSG doesn't match (multi-line), but TIPJAR_VULNERABILITY triggers
    // because the regex matches `send_raw_message` anywhere in the code
    expect(hasVulnMatching(result.vulnerabilities, 'unprotected') ||
           hasVulnMatching(result.vulnerabilities, 'withdrawal') ||
           hasVulnMatching(result.vulnerabilities, 'tipjar')).toBe(true);
  });

  it('should have a low security score (≤ 50)', () => {
    expect(result.score).toBeLessThanOrEqual(50);
  });

  it('should find at least 3 vulnerabilities', () => {
    expect(result.vulnerabilities.length).toBeGreaterThanOrEqual(3);
  });

  it('should generate patched code', () => {
    expect(result.patchedCode).toBeDefined();
    expect(result.patchedCode.length).toBeGreaterThan(0);
  });

  it('should include auto-fix for missing access control in patched code', () => {
    expect(result.patchedCode).toContain('throw_unless');
  });
});

/* ═══════════════════════════════════════════════════════════════════ */
/*  SecureWallet.fc                                                   */
/* ═══════════════════════════════════════════════════════════════════ */
describe('Static Engine — SecureWallet.fc', () => {
  const gt = GROUND_TRUTH.find((g) => g.contractFile === 'SecureWallet.fc')!;
  const code = loadContract(gt.contractPath);
  const result = analyzeCodeStatic(code);

  it('should NOT trigger missing bounce check (has flags & 1)', () => {
    expect(hasVulnMatching(result.vulnerabilities, 'bounce')).toBe(false);
  });

  it('should trigger missing owner check (uses check_signature not equal_slices)', () => {
    // SecureWallet uses check_signature for auth, but the static rule looks
    // specifically for `equal_slices`, so FUNC_OWNER_CHECK triggers
    expect(hasVulnMatching(result.vulnerabilities, 'owner') ||
           hasVulnMatching(result.vulnerabilities, 'access control')).toBe(true);
  });

  it('should have a score of 50 (two CRITICAL false positives)', () => {
    // FUNC_OWNER_CHECK (-25) + TIPJAR_VULNERABILITY (-25) = 50
    // These are false positives because SecureWallet IS secure, but the
    // regex-based rules can't recognize check_signature as valid auth
    expect(result.score).toBe(50);
  });

  it('should find exactly 2 vulnerabilities (both false positives)', () => {
    expect(result.vulnerabilities.length).toBe(2);
  });
});

/* ═══════════════════════════════════════════════════════════════════ */
/*  SimpleToken.fc                                                    */
/* ═══════════════════════════════════════════════════════════════════ */
describe('Static Engine — SimpleToken.fc', () => {
  const gt = GROUND_TRUTH.find((g) => g.contractFile === 'SimpleToken.fc')!;
  const code = loadContract(gt.contractPath);
  const result = analyzeCodeStatic(code);

  it('should detect missing bounce check', () => {
    expect(hasVulnMatching(result.vulnerabilities, 'bounce')).toBe(true);
  });

  it('should detect unchecked send_raw_message', () => {
    expect(hasVulnMatching(result.vulnerabilities, 'unchecked') ||
           hasVulnMatching(result.vulnerabilities, 'send') ||
           hasVulnMatching(result.vulnerabilities, 'message')).toBe(true);
  });

  it('should NOT trigger missing owner check (has equal_slices)', () => {
    expect(hasVulnMatching(result.vulnerabilities, 'owner access')).toBe(false);
  });

  it('should have a moderate security score', () => {
    expect(result.score).toBeGreaterThanOrEqual(40);
    expect(result.score).toBeLessThanOrEqual(85);
  });
});

/* ═══════════════════════════════════════════════════════════════════ */
/*  forward_ton_demo.func                                             */
/* ═══════════════════════════════════════════════════════════════════ */
describe('Static Engine — forward_ton_demo.func', () => {
  const gt = GROUND_TRUTH.find((g) => g.contractFile === 'forward_ton_demo.func')!;
  const code = loadContract(gt.contractPath);
  const result = analyzeCodeStatic(code);

  it('should detect missing owner access control', () => {
    expect(hasVulnMatching(result.vulnerabilities, 'access control') ||
           hasVulnMatching(result.vulnerabilities, 'owner')).toBe(true);
  });

  it('should detect unchecked send_raw_message (mode 0)', () => {
    expect(hasVulnMatching(result.vulnerabilities, 'unchecked') ||
           hasVulnMatching(result.vulnerabilities, 'send') ||
           hasVulnMatching(result.vulnerabilities, 'message')).toBe(true);
  });

  it('should have a score below 100 due to detected issues', () => {
    expect(result.score).toBeLessThan(100);
  });
});

/* ═══════════════════════════════════════════════════════════════════ */
/*  Scoring Deduction Math                                            */
/* ═══════════════════════════════════════════════════════════════════ */
describe('Static Engine — Scoring Deductions', () => {
  it('should start at 100 for a minimal safe contract (no send_raw_message)', () => {
    // Must have bounce check + equal_slices AND avoid send_raw_message
    // (which triggers TIPJAR_VULNERABILITY via its OR regex pattern)
    const safeCode = `
      () recv_internal(int msg_value, cell in_msg_full, slice in_msg_body) impure {
        slice cs = in_msg_full.begin_parse();
        int flags = cs~load_uint(4);
        if (flags & 1) { return (); }
        slice sender = cs~load_msg_addr();
        throw_unless(401, equal_slices(sender, owner));
      }
    `;
    const result = analyzeCodeStatic(safeCode);
    expect(result.score).toBe(100);
  });

  it('should deduct exactly 10 for MEDIUM severity (missing bounce)', () => {
    // Has equal_slices, but no bounce check AND no send_raw_message
    const code = `
      () recv_internal(int msg_value, cell in_msg_full, slice in_msg_body) impure {
        slice sender = cs~load_msg_addr();
        throw_unless(401, equal_slices(sender, owner));
      }
    `;
    const result = analyzeCodeStatic(code);
    expect(result.score).toBe(90); // 100 - 10 (MEDIUM)
  });
});

/* ═══════════════════════════════════════════════════════════════════ */
/*  Stats Validation                                                  */
/* ═══════════════════════════════════════════════════════════════════ */
describe('Static Engine — Stats Accuracy', () => {
  it('should have stats that match the vulnerabilities array', () => {
    const gt = GROUND_TRUTH.find((g) => g.contractFile === 'VulnerableWallet.fc')!;
    const code = loadContract(gt.contractPath);
    const result = analyzeCodeStatic(code);

    expect(result.stats.total).toBe(result.vulnerabilities.length);
    expect(result.stats.critical).toBe(
      result.vulnerabilities.filter((v) => v.severity === 'Critical').length,
    );
    expect(result.stats.high).toBe(
      result.vulnerabilities.filter((v) => v.severity === 'High').length,
    );
    expect(result.stats.medium).toBe(
      result.vulnerabilities.filter((v) => v.severity === 'Medium').length,
    );
  });
});
