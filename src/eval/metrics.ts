import type { Finding, AnalysisResult, Severity } from '@/types/analysis';
import type {
  DetectionMetrics,
  ExpectedVulnerability,
  ScoreAccuracy,
  StructuralCompleteness,
  FixQualityMetrics,
  MatchConfidence,
} from './types';

const MATCH_THRESHOLD = 0.50;

const SEVERITY_ORDER: Record<Severity, number> = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
  INFORMATIONAL: 0,
};

/**
 * Multi-signal match scoring between a finding and an expected vulnerability.
 *
 * Produces a confidence score in [0, 1] from four signals:
 *   1. Title keyword overlap (40%)  — fraction of expected keywords found,
 *      with a hard gate on requiredKeywords.
 *   2. Category similarity   (25%)  — normalised substring match.
 *   3. Severity proximity    (20%)  — penalises severity distance.
 *   4. Line-range overlap    (15%)  — IoU of line ranges when both present.
 *
 * A finding is considered a match when confidence >= MATCH_THRESHOLD.
 */
export function computeMatchConfidence(
  finding: Finding,
  expected: ExpectedVulnerability,
): MatchConfidence {
  const title = finding.title.toLowerCase();
  const desc = finding.description?.toLowerCase() ?? '';

  // ── Signal 1: Title keywords ──
  const matched = expected.titleKeywords.filter((kw) =>
    title.includes(kw.toLowerCase()),
  );
  const keywordFraction =
    expected.titleKeywords.length > 0
      ? matched.length / expected.titleKeywords.length
      : 0;

  // Hard gate: every required keyword must appear in title OR description
  if (expected.requiredKeywords && expected.requiredKeywords.length > 0) {
    const allRequired = expected.requiredKeywords.every(
      (rk) => title.includes(rk.toLowerCase()) || desc.includes(rk.toLowerCase()),
    );
    if (!allRequired) {
      return { keywordScore: 0, categoryScore: 0, severityScore: 0, lineRangeScore: 0, confidence: 0 };
    }
  }

  // ── Signal 2: Category similarity ──
  const normCat = (s: string) =>
    s.toLowerCase().replace(/[\s\-_]+/g, '');
  const expectedCat = normCat(expected.category);
  const findingCat = normCat(finding.category);
  const categoryScore =
    expectedCat === findingCat
      ? 1
      : findingCat.includes(expectedCat) || expectedCat.includes(findingCat)
        ? 0.6
        : 0;

  // ── Signal 3: Severity proximity ──
  const diff = Math.abs(
    SEVERITY_ORDER[finding.severity] - SEVERITY_ORDER[expected.severity],
  );
  const severityScore = Math.max(0, 1 - diff * 0.35);

  // ── Signal 4: Line-range overlap (IoU) ──
  let lineRangeScore = 0.5; // neutral when not available
  if (expected.lineRange && finding.codeChanges?.startLine != null) {
    const [eStart, eEnd] = expected.lineRange;
    const fStart = finding.codeChanges.startLine;
    const fEnd = finding.codeChanges.endLine ?? fStart;

    const overlapStart = Math.max(eStart, fStart);
    const overlapEnd = Math.min(eEnd, fEnd);
    const overlap = Math.max(0, overlapEnd - overlapStart + 1);
    const unionLen = Math.max(eEnd, fEnd) - Math.min(eStart, fStart) + 1;
    lineRangeScore = unionLen > 0 ? overlap / unionLen : 0;
  }

  const confidence =
    keywordFraction * 0.4 +
    categoryScore * 0.25 +
    severityScore * 0.2 +
    lineRangeScore * 0.15;

  return {
    keywordScore: keywordFraction,
    categoryScore,
    severityScore,
    lineRangeScore,
    confidence,
  };
}

/**
 * Compute precision, recall, and F1 between actual findings and expected
 * ground-truth vulnerabilities using multi-signal confidence scoring.
 *
 * Uses the Hungarian-style greedy approach: pairs are formed in descending
 * confidence order so the best matches are consumed first.
 */
export function computeDetectionMetrics(
  findings: Finding[],
  expectedVulns: ExpectedVulnerability[],
): DetectionMetrics {
  if (expectedVulns.length === 0 && findings.length === 0) {
    return { truePositives: 0, falsePositives: 0, falseNegatives: 0, precision: 1, recall: NaN, f1: NaN };
  }

  if (expectedVulns.length === 0 && findings.length > 0) {
    return { truePositives: 0, falsePositives: findings.length, falseNegatives: 0, precision: 0, recall: NaN, f1: NaN };
  }

  // Build scored candidate pairs
  const candidates: { ei: number; fi: number; confidence: number }[] = [];
  for (let ei = 0; ei < expectedVulns.length; ei++) {
    for (let fi = 0; fi < findings.length; fi++) {
      const { confidence } = computeMatchConfidence(findings[fi], expectedVulns[ei]);
      if (confidence >= MATCH_THRESHOLD) {
        candidates.push({ ei, fi, confidence });
      }
    }
  }

  // Greedy assignment in descending confidence
  candidates.sort((a, b) => b.confidence - a.confidence);

  const matchedExpected = new Set<number>();
  const matchedFindings = new Set<number>();

  for (const { ei, fi } of candidates) {
    if (matchedExpected.has(ei) || matchedFindings.has(fi)) continue;
    matchedExpected.add(ei);
    matchedFindings.add(fi);
  }

  const truePositives = matchedExpected.size;
  const falsePositives = findings.length - matchedFindings.size;
  const falseNegatives = expectedVulns.length - matchedExpected.size;

  const precision = findings.length > 0 ? truePositives / findings.length : 0;
  const recall = expectedVulns.length > 0 ? truePositives / expectedVulns.length : 1;
  const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

  return { truePositives, falsePositives, falseNegatives, precision, recall, f1 };
}

/* ── Score Accuracy ───────────────────────────────────────────────── */

export function computeScoreAccuracy(
  actualScore: number,
  expectedRange: [number, number],
): ScoreAccuracy {
  const [min, max] = expectedRange;
  const withinRange = actualScore >= min && actualScore <= max;

  let deviation = 0;
  if (actualScore < min) deviation = min - actualScore;
  else if (actualScore > max) deviation = actualScore - max;

  return { actualScore, expectedRange, withinRange, deviation };
}

/* ── Structural Completeness ──────────────────────────────────────── */

export function computeStructuralCompleteness(
  result: AnalysisResult,
): StructuralCompleteness {
  const hasAnalysisMetadata = !!result.analysisMetadata;
  const hasSecurityScore = typeof result.securityScore === 'number';
  const hasGrade = !!result.grade;
  const hasExecutiveSummary = !!result.executiveSummary;
  const hasFindingsSummary = !!result.findingsSummary;
  const hasFindings = Array.isArray(result.findings);
  const allFindingsHaveCodeChanges =
    hasFindings && result.findings.every((f) => !!f.codeChanges);
  const hasCompleteCodeComparison =
    !!result.completeCodeComparison &&
    typeof result.completeCodeComparison.hasChanges === 'boolean';

  const overallComplete =
    hasAnalysisMetadata &&
    hasSecurityScore &&
    hasGrade &&
    hasExecutiveSummary &&
    hasFindingsSummary &&
    hasFindings &&
    allFindingsHaveCodeChanges;

  return {
    hasAnalysisMetadata,
    hasSecurityScore,
    hasGrade,
    hasExecutiveSummary,
    hasFindingsSummary,
    hasFindings,
    allFindingsHaveCodeChanges,
    hasCompleteCodeComparison,
    overallComplete,
  };
}

/* ── Fix Quality ──────────────────────────────────────────────────── */

export function computeFixQuality(findings: Finding[]): FixQualityMetrics {
  const totalFindings = findings.length;
  if (totalFindings === 0) {
    return { totalFindings: 0, findingsWithValidFix: 0, findingsWithDescription: 0, fixQualityRate: 1 };
  }

  let findingsWithValidFix = 0;
  let findingsWithDescription = 0;

  for (const f of findings) {
    const cc = f.codeChanges;
    if (!cc) continue;
    if (
      cc.fixedCode &&
      cc.vulnerableCode &&
      cc.fixedCode.trim() !== cc.vulnerableCode.trim()
    ) {
      findingsWithValidFix++;
    }
    if (cc.changeDescription && cc.changeDescription.trim().length > 0) {
      findingsWithDescription++;
    }
  }

  return {
    totalFindings,
    findingsWithValidFix,
    findingsWithDescription,
    fixQualityRate: findingsWithValidFix / totalFindings,
  };
}
