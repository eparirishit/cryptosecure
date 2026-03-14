import type { GroundTruthEntry } from './types';

/**
 * Ground-truth annotations for all sample contracts.
 *
 * IMPORTANT: These annotations are derived from INDEPENDENT manual code
 * review — NOT from observing AI output. The purpose is to measure how
 * well the AI detects known vulnerabilities, not to confirm what it
 * already returns.
 *
 * Each expected vulnerability has:
 *   - titleKeywords:     soft-match words scored by overlap fraction
 *   - requiredKeywords:  HARD GATE — every one of these must appear in
 *                        the finding's title OR description for it to be
 *                        considered a candidate at all.  This prevents
 *                        generic findings from accidentally matching.
 *   - category:          matched against the finding's category field
 *   - severity:          proximity-scored against the finding's severity
 *   - lineRange:         IoU-scored when both sides have line info
 */
export const GROUND_TRUTH: GroundTruthEntry[] = [

  /* ── VulnerableWallet.fc ──────────────────────────────────────── */
  {
    contractFile: 'VulnerableWallet.fc',
    contractPath: 'src/data/VulnerableWallet.fc',
    isSecure: false,
    expectedVulnerabilities: [
      {
        // send_raw_message at line 28 before balance decrement at line 30
        titleKeywords: ['reentrancy', 'reentrant', 'withdraw', 'state update'],
        requiredKeywords: ['reentran'],
        severity: 'CRITICAL',
        category: 'reentrancy',
        lineRange: [19, 32],
      },
      {
        // recv_external calls accept_message() without signature verification
        titleKeywords: ['access control', 'recv_external', 'unprotected', 'authentication'],
        requiredKeywords: ['recv_external'],
        severity: 'CRITICAL',
        category: 'access-control',
        lineRange: [35, 46],
      },
      {
        // No check for bounced messages (flags & 1) in recv_internal
        titleKeywords: ['bounce', 'bounced', 'message handling'],
        requiredKeywords: ['bounc'],
        severity: 'MEDIUM',
        category: 'bounce-handling',
      },
      {
        // recv_external has no seqno — signed messages can be replayed
        titleKeywords: ['replay', 'seqno', 'sequence', 'nonce'],
        requiredKeywords: ['replay'],
        severity: 'CRITICAL',
        category: 'replay-attack',
        lineRange: [35, 46],
      },
    ],
    expectedScoreRange: [0, 30],
    expectedGrades: ['F'],
    expectedStaticRules: [
      { ruleId: 'FUNC_BOUNCED_CHECK', shouldTrigger: true },
      { ruleId: 'FUNC_OWNER_CHECK', shouldTrigger: true },
      { ruleId: 'FUNC_SEND_RAW_MSG', shouldTrigger: false },
      { ruleId: 'TIPJAR_VULNERABILITY', shouldTrigger: true },
    ],
  },

  /* ── SecureWallet.fc ──────────────────────────────────────────── */
  {
    contractFile: 'SecureWallet.fc',
    contractPath: 'src/data/SecureWallet.fc',
    isSecure: true,
    expectedVulnerabilities: [],
    expectedScoreRange: [50, 100],
    expectedGrades: ['A', 'B', 'C'],
    expectedStaticRules: [
      { ruleId: 'FUNC_BOUNCED_CHECK', shouldTrigger: false },
      { ruleId: 'FUNC_OWNER_CHECK', shouldTrigger: true },
      { ruleId: 'FUNC_SEND_RAW_MSG', shouldTrigger: false },
      { ruleId: 'TIPJAR_VULNERABILITY', shouldTrigger: true },
    ],
  },

  /* ── SimpleToken.fc ───────────────────────────────────────────── */
  {
    contractFile: 'SimpleToken.fc',
    contractPath: 'src/data/SimpleToken.fc',
    isSecure: false,
    expectedVulnerabilities: [
      {
        // No bounced message handling
        titleKeywords: ['bounce', 'bounced', 'message handling'],
        requiredKeywords: ['bounc'],
        severity: 'MEDIUM',
        category: 'bounce-handling',
      },
      {
        // Global total_supply modified but no load_data/save_data
        titleKeywords: ['storage', 'persist', 'save', 'load', 'state'],
        requiredKeywords: ['storage'],
        severity: 'HIGH',
        category: 'state-management',
      },
      {
        // total_supply += amount with no bounds check
        titleKeywords: ['overflow', 'integer', 'arithmetic', 'underflow'],
        requiredKeywords: ['overflow'],
        severity: 'MEDIUM',
        category: 'integer-safety',
      },
      {
        // total_supply grows without bound — no max supply enforcement
        titleKeywords: ['supply cap', 'uncapped', 'maximum supply', 'unlimited mint'],
        requiredKeywords: ['cap'],
        severity: 'HIGH',
        category: 'business-logic',
      },
    ],
    expectedScoreRange: [10, 60],
    expectedGrades: ['D', 'F'],
    expectedStaticRules: [
      { ruleId: 'FUNC_BOUNCED_CHECK', shouldTrigger: true },
      { ruleId: 'FUNC_OWNER_CHECK', shouldTrigger: false },
      { ruleId: 'FUNC_SEND_RAW_MSG', shouldTrigger: true },
      { ruleId: 'TIPJAR_VULNERABILITY', shouldTrigger: false },
    ],
  },

  /* ── forward_ton_demo.func ────────────────────────────────────── */
  {
    contractFile: 'forward_ton_demo.func',
    contractPath: 'src/data/forward_ton_demo.func',
    isSecure: false,
    expectedVulnerabilities: [
      {
        // forward_ton_amount from user input used directly in store_coins
        titleKeywords: ['user', 'controlled', 'forward', 'store_coins'],
        requiredKeywords: ['forward'],
        severity: 'CRITICAL',
        category: 'user-input-misuse',
        lineRange: [17, 33],
      },
      {
        // No sender verification — anyone can call withdraw
        titleKeywords: ['access control', 'owner', 'withdraw', 'authorization'],
        requiredKeywords: ['access control'],
        severity: 'CRITICAL',
        category: 'access-control',
      },
      {
        // Variable 'ref' referenced at line 35 but never declared
        titleKeywords: ['undefined', 'undeclared', 'ref', 'variable'],
        requiredKeywords: ['ref'],
        severity: 'CRITICAL',
        category: 'undefined-reference',
      },
      {
        // my_balance parameter available but never checked before send_raw_message
        titleKeywords: ['balance', 'insufficient', 'sufficiency', 'my_balance'],
        requiredKeywords: ['insufficien'],
        severity: 'HIGH',
        category: 'balance-validation',
      },
    ],
    expectedScoreRange: [0, 30],
    expectedGrades: ['F'],
    expectedStaticRules: [
      { ruleId: 'FUNC_BOUNCED_CHECK', shouldTrigger: false },
      { ruleId: 'FUNC_OWNER_CHECK', shouldTrigger: true },
      { ruleId: 'FUNC_SEND_RAW_MSG', shouldTrigger: true },
      { ruleId: 'TIPJAR_VULNERABILITY', shouldTrigger: false },
    ],
  },
];
