/**
 * Consistency Tests (Snapshot-based)
 *
 * Validates that multiple runs of the same contract produce
 * consistent results. Uses pre-captured consistency snapshots
 * (3 runs per contract captured by capture-snapshots.ts).
 *
 * Run `npm run test:snapshot` first to capture snapshots.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { GROUND_TRUTH } from './ground-truth';
import type { ConsistencySnapshot } from './types';

const SNAPSHOT_DIR = path.resolve(__dirname, 'snapshots');

function loadConsistencySnapshot(contractFile: string): ConsistencySnapshot | null {
  const baseName = path.basename(contractFile, path.extname(contractFile));
  const file = path.join(SNAPSHOT_DIR, `${baseName}.consistency.json`);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, 'utf-8'));
}

function standardDeviation(values: number[]): number {
  if (values.length <= 1) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map((v) => (v - mean) ** 2);
  return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / (values.length - 1));
}

function jaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  const intersection = new Set([...setA].filter((x) => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  if (union.size === 0) return 1;
  return intersection.size / union.size;
}

describe('Consistency Tests', () => {
  for (const gt of GROUND_TRUTH) {
    describe(gt.contractFile, () => {
      const snapshot = loadConsistencySnapshot(gt.contractFile);

      it('should have consistency snapshots (≥2 runs)', () => {
        expect(snapshot).not.toBeNull();
        if (snapshot) {
          expect(snapshot.runs.length).toBeGreaterThanOrEqual(2);
        }
      });

      if (!snapshot || snapshot.runs.length < 2) return;

      const scores = snapshot.runs.map((r) => r.response.securityScore);
      const grades = snapshot.runs.map((r) => r.response.grade);
      const findingSets = snapshot.runs.map(
        (r) => new Set(r.response.findings.map((f) => f.title.toLowerCase())),
      );

      it(`should have score standard deviation < 10 (scores: [${scores}])`, () => {
        const sd = standardDeviation(scores);
        expect(sd).toBeLessThan(10);
      });

      it('should have the same grade across runs', () => {
        const uniqueGrades = new Set(grades);
        expect(uniqueGrades.size).toBeLessThanOrEqual(1);
      });

      it('should have ≥0.5 Jaccard similarity for finding titles across runs', () => {
        // Compare each pair of runs
        for (let i = 0; i < findingSets.length; i++) {
          for (let j = i + 1; j < findingSets.length; j++) {
            const similarity = jaccardSimilarity(findingSets[i], findingSets[j]);
            expect(similarity).toBeGreaterThanOrEqual(0.5);
          }
        }
      });

      it('core findings should appear in at least 2/3 of runs', () => {
        // Collect all finding titles across all runs
        const allTitles = new Map<string, number>();
        for (const fSet of findingSets) {
          for (const title of fSet) {
            allTitles.set(title, (allTitles.get(title) || 0) + 1);
          }
        }

        // Findings appearing in at least 2 runs are "core"
        const coreFindings = [...allTitles.entries()].filter(([, count]) => count >= 2);
        const totalUnique = allTitles.size;

        if (totalUnique > 0) {
          const coreRate = coreFindings.length / totalUnique;
          // At least 50% of unique findings should be core (stable)
          expect(coreRate).toBeGreaterThanOrEqual(0.5);
        }
      });

      it('score range should be ≤ 20 points across runs', () => {
        const min = Math.min(...scores);
        const max = Math.max(...scores);
        expect(max - min).toBeLessThanOrEqual(20);
      });
    });
  }
});
