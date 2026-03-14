import type { AnalysisResult, HackerModeResult, Severity } from '@/types/analysis';

/* ── Ground-Truth Annotation ──────────────────────────────────────── */

export interface ExpectedVulnerability {
  /** Keywords to match against finding titles (soft match — higher fraction = better score) */
  titleKeywords: string[];
  /**
   * Hard-gate keywords: ALL must appear in title or description for
   * the finding to be considered a candidate match at all.
   * Use this for the core concept that distinguishes this vuln from others.
   */
  requiredKeywords?: string[];
  severity: Severity;
  category: string;
  /** Approximate line range where this vuln lives [start, end] */
  lineRange?: [number, number];
}

export interface MatchConfidence {
  keywordScore: number;
  categoryScore: number;
  severityScore: number;
  lineRangeScore: number;
  confidence: number;
}

export interface ExpectedStaticRule {
  /** Rule ID from rules.ts (e.g. "FUNC_BOUNCED_CHECK") */
  ruleId: string;
  shouldTrigger: boolean;
}

export interface GroundTruthEntry {
  /** Contract filename (basename) */
  contractFile: string;
  /** Relative path from project root to the contract source */
  contractPath: string;
  /** Known vulnerabilities that must be detected */
  expectedVulnerabilities: ExpectedVulnerability[];
  /** Expected score range [min, max] */
  expectedScoreRange: [number, number];
  /** Acceptable letter grades */
  expectedGrades: string[];
  /** Expected static-engine rule triggers */
  expectedStaticRules: ExpectedStaticRule[];
  /** True if the contract is intentionally secure (no known vulns) */
  isSecure: boolean;
}

/* ── Evaluation Metrics ───────────────────────────────────────────── */

export interface DetectionMetrics {
  truePositives: number;
  falsePositives: number;
  falseNegatives: number;
  precision: number;
  recall: number;
  f1: number;
}

export interface ScoreAccuracy {
  actualScore: number;
  expectedRange: [number, number];
  withinRange: boolean;
  deviation: number; // 0 if within range, distance to nearest bound otherwise
}

export interface StructuralCompleteness {
  hasAnalysisMetadata: boolean;
  hasSecurityScore: boolean;
  hasGrade: boolean;
  hasExecutiveSummary: boolean;
  hasFindingsSummary: boolean;
  hasFindings: boolean;
  allFindingsHaveCodeChanges: boolean;
  hasCompleteCodeComparison: boolean;
  overallComplete: boolean;
}

export interface FixQualityMetrics {
  totalFindings: number;
  findingsWithValidFix: number; // fixedCode !== vulnerableCode
  findingsWithDescription: number;
  fixQualityRate: number; // findingsWithValidFix / totalFindings
}

export interface EvalMetrics {
  contractFile: string;
  detection: DetectionMetrics;
  scoreAccuracy: ScoreAccuracy;
  structural: StructuralCompleteness;
  fixQuality: FixQualityMetrics;
}

/* ── Snapshot Data ────────────────────────────────────────────────── */

export interface AnalyzeSnapshot {
  capturedAt: string;
  provider: string;
  contractFile: string;
  response: AnalysisResult;
}

export interface HackSnapshot {
  capturedAt: string;
  provider: string;
  contractFile: string;
  response: HackerModeResult;
}

export interface ConsistencySnapshot {
  contractFile: string;
  runs: AnalyzeSnapshot[];
}
