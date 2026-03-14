/**
 * AI Response Evaluation Tests (Snapshot-based)
 *
 * Evaluates captured AI analysis responses against ground-truth
 * annotations using multi-signal confidence scoring.
 * No network calls — reads from src/eval/snapshots/.
 *
 * Run `npm run test:snapshot` first to capture snapshots.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { GROUND_TRUTH } from './ground-truth';
import {
  computeDetectionMetrics,
  computeMatchConfidence,
  computeScoreAccuracy,
  computeStructuralCompleteness,
  computeFixQuality,
} from './metrics';
import type { AnalyzeSnapshot, HackSnapshot } from './types';

const SNAPSHOT_DIR = path.resolve(__dirname, 'snapshots');

function loadAnalyzeSnapshot(contractFile: string): AnalyzeSnapshot | null {
  const baseName = path.basename(contractFile, path.extname(contractFile));
  const file = path.join(SNAPSHOT_DIR, `${baseName}.analyze.json`);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, 'utf-8'));
}

function loadHackSnapshot(contractFile: string): HackSnapshot | null {
  const baseName = path.basename(contractFile, path.extname(contractFile));
  const file = path.join(SNAPSHOT_DIR, `${baseName}.hack.json`);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, 'utf-8'));
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  Standard Audit Evaluation                                         */
/* ═══════════════════════════════════════════════════════════════════ */
describe('AI Response Evaluation — Standard Audit', () => {
  for (const gt of GROUND_TRUTH) {
    describe(gt.contractFile, () => {
      const snapshot = loadAnalyzeSnapshot(gt.contractFile);

      it('should have a captured snapshot', () => {
        expect(snapshot).not.toBeNull();
      });

      if (!snapshot) return;
      const result = snapshot.response;

      // ── Detection Metrics (multi-signal) ──
      if (gt.expectedVulnerabilities.length > 0) {
        const metrics = computeDetectionMetrics(result.findings, gt.expectedVulnerabilities);

        it(`should achieve recall ≥ 0.6 (detect ≥60% of known vulns)`, () => {
          expect(metrics.recall).toBeGreaterThanOrEqual(0.6);
        });

        it(`should achieve precision ≥ 0.3`, () => {
          expect(metrics.precision).toBeGreaterThanOrEqual(0.3);
        });

        it(`should achieve F1 ≥ 0.4`, () => {
          expect(metrics.f1).toBeGreaterThanOrEqual(0.4);
        });

        // Per-vuln confidence diagnostics: matched expected vulns
        // should have confidence well above threshold (not marginal matches)
        it('matched findings should have confidence > 0.52', () => {
          for (const ev of gt.expectedVulnerabilities) {
            const scores = result.findings.map((f) => computeMatchConfidence(f, ev));
            const best = Math.max(...scores.map((s) => s.confidence));
            if (best >= 0.50) {
              expect(best).toBeGreaterThan(0.52);
            }
          }
        });
      }

      // ── Score Accuracy ──
      it(`should have security score within expected range [${gt.expectedScoreRange}]`, () => {
        const accuracy = computeScoreAccuracy(result.securityScore, gt.expectedScoreRange);
        expect(accuracy.withinRange).toBe(true);
      });

      it(`should have grade matching expected grades [${gt.expectedGrades}]`, () => {
        expect(gt.expectedGrades).toContain(result.grade);
      });

      // ── Structural Completeness ──
      it('should be structurally complete (all required fields present)', () => {
        const structural = computeStructuralCompleteness(result);
        expect(structural.overallComplete).toBe(true);
      });

      it('should have completeCodeComparison', () => {
        const structural = computeStructuralCompleteness(result);
        expect(structural.hasCompleteCodeComparison).toBe(true);
      });

      it('every finding should have codeChanges', () => {
        const structural = computeStructuralCompleteness(result);
        expect(structural.allFindingsHaveCodeChanges).toBe(true);
      });

      // ── Fix Quality ──
      if (!gt.isSecure) {
        it('should have fix quality rate ≥ 0.5 (fixes actually modify the code)', () => {
          const fixQuality = computeFixQuality(result.findings);
          expect(fixQuality.fixQualityRate).toBeGreaterThanOrEqual(0.5);
        });
      }

      // ── Secure contract: false-positive budget ──
      if (gt.isSecure) {
        it('should report ≤ 2 CRITICAL findings on a secure contract', () => {
          const criticals = result.findings.filter((f) => f.severity === 'CRITICAL');
          expect(criticals.length).toBeLessThanOrEqual(2);
        });

        it('should have security score ≥ 50 (not overly harsh on secure code)', () => {
          expect(result.securityScore).toBeGreaterThanOrEqual(50);
        });
      }
    });
  }
});

/* ═══════════════════════════════════════════════════════════════════ */
/*  Hacker Mode Evaluation                                            */
/* ═══════════════════════════════════════════════════════════════════ */
describe('AI Response Evaluation — Hacker Mode', () => {
  for (const gt of GROUND_TRUTH) {
    describe(gt.contractFile, () => {
      const snapshot = loadHackSnapshot(gt.contractFile);

      it('should have a captured snapshot', () => {
        expect(snapshot).not.toBeNull();
      });

      if (!snapshot) return;
      const result = snapshot.response;

      // ── Attack Surfaces ──
      it('should identify at least one attack surface', () => {
        expect(result.attackSurface.length).toBeGreaterThanOrEqual(1);
      });

      // ── Score Correlation ──
      if (!gt.isSecure) {
        it('should have resilience score ≤ 85 for a vulnerable contract', () => {
          expect(result.hackerResilienceScore).toBeLessThanOrEqual(85);
        });

        it('should find at least one plausible exploit', () => {
          const plausible = result.exploits.filter((e) => e.status === 'plausible');
          expect(plausible.length).toBeGreaterThanOrEqual(1);
        });

        it('should assign a risk level', () => {
          expect(['Low', 'Medium', 'High', 'Critical']).toContain(result.riskLevel);
        });
      }

      if (gt.isSecure) {
        it('should have a defined resilience score for a secure contract', () => {
          expect(result.hackerResilienceScore).toBeGreaterThanOrEqual(0);
          expect(result.hackerResilienceScore).toBeLessThanOrEqual(100);
        });
      }

      // ── Recommendations ──
      it('should have defense recommendations for plausible exploits', () => {
        const plausible = result.exploits.filter((e) => e.status === 'plausible');
        if (plausible.length > 0) {
          expect(result.recommendations.length).toBeGreaterThanOrEqual(1);
        }
      });
    });
  }
});
