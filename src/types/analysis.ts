export type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFORMATIONAL";
export type Grade = "A" | "B" | "C" | "D" | "F";
export type FindingStatus = "Open" | "Fixed" | "Mitigated" | "Accepted";
export type RecommendationPriority = "High" | "Medium" | "Low";

// export interface FindingLocation {
//   function?: string;
//   lineStart: number;
//   lineEnd: number;
//   snippet?: string;
// }

export interface CodeChanges {
  vulnerableCode: string;
  fixedCode: string;
  startLine: number;
  endLine: number;
  changeDescription: string;
  function?: string;
}

export interface Finding {
  id: string;
  title: string;
  severity: Severity;
  category: string;
  description: string;
  impact: string;
  exploitScenario?: string;
  recommendation: string;
  codeChanges: CodeChanges; // Required: each finding must have codeChanges
  status?: FindingStatus;
  references?: string[];
  cwe?: string;
}

export interface AnalysisMetadata {
  contractName: string;
  language: string;
  linesOfCode: number;
  analysisDate: string;
  analysisTimestamp?: string;
  analysisDuration?: string;
  totalIssuesFound: number;
}

export interface FindingsSummary {
  critical: number;
  high: number;
  medium: number;
  low: number;
  informational: number;
  totalFindings?: number;
}

export interface Recommendation {
  priority: RecommendationPriority;
  title: string;
  description: string;
  rationale: string;
}

export interface GasOptimization {
  location: string;
  description: string;
  estimatedGasSavings: string;
  currentApproach?: string;
  optimizedApproach?: string;
  estimatedSavings?: string;
}

export interface CodeQualityObservation {
  // type: "ERROR" | "WARNING" | "INFO";
  description: string;
}

export interface PositiveFinding {
  aspect: string;
  description: string;
}

export interface CompleteCodeComparison {
  hasChanges: boolean;
  original: string;
  corrected: string;
  changesExplanation: string;
}

export interface AnalysisResult {
  analysisMetadata: AnalysisMetadata;
  securityScore: number;
  grade: Grade;
  executiveSummary: string;
  findingsSummary: FindingsSummary;
  findings: Finding[];
  recommendations: Recommendation[];
  gasOptimizations: GasOptimization[];
  completeCodeComparison?: CompleteCodeComparison;
  codeQualityObservations?: (string | CodeQualityObservation)[];
  positiveFindings?: (string | PositiveFinding)[];
  nextSteps?: string;
  proposedCodeComplete?: string;
}

// Legacy types for backward compatibility (if needed during migration)
export type LegacySeverity = "Critical" | "High" | "Medium" | "Low" | "Info";

export type Vulnerability = LegacyVulnerability;

export interface LegacyVulnerability {
  line: number;
  column?: number;
  severity: LegacySeverity;
  title: string;
  description: string;
  suggestion: string;
  scenario?: string; 
  affectedCode?: string; 
  fileName?: string; 
  function?: string; 
}

export interface AttackSurface {
  id: string;
  entryPoint: string; 
  riskFactors: string[];
  notes: string;
  lineNumber?: number;
}

export interface ExploitAttempt {
  id: string;
  attackSurfaceId: string;
  title: string;
  type: "reentrancy" | "access-control" | "economic" | "dos" | "integer-overflow" | "other";
  prerequisites: string;
  steps: string[];
  expectedImpact: string;
  likelihood: "low" | "medium" | "high";
  status: "plausible" | "theoretical" | "not-applicable";
  exploitCode?: string;
  vulnerableLines?: number[];
  tonSpecificNotes?: string;
  severity: LegacySeverity;
}

export interface DefenseRecommendation {
  exploitId: string;
  mitigation: string;
  codeExample?: string;
  tonSpecific?: boolean;
}

export interface HackerModeResult {
  hackerResilienceScore: number; 
  attackSurface: AttackSurface[];
  exploits: ExploitAttempt[];
  summary: string;
  recommendations: DefenseRecommendation[];
  riskLevel: "Critical" | "High" | "Medium" | "Low" | "None";
}