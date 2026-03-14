import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AnalysisResults } from "@/components/analysis-results";
import type { AnalysisResult } from "@/types/analysis";

const mockResult: AnalysisResult = {
  analysisMetadata: {
    contractName: "TestContract",
    language: "FunC",
    linesOfCode: 50,
    analysisDate: "2025-01-01",
    totalIssuesFound: 1,
  },
  securityScore: 85,
  grade: "B",
  executiveSummary: "The contract has moderate security.",
  findingsSummary: { critical: 0, high: 1, medium: 0, low: 0, informational: 0, totalFindings: 1 },
  findings: [
    {
      id: "HIGH-001",
      title: "Unchecked Send",
      severity: "HIGH",
      category: "Message Handling",
      description: "Send without mode check",
      impact: "Fund loss possible",
      recommendation: "Use mode 64",
      codeChanges: {
        vulnerableCode: "send_raw_message(msg, 0)",
        fixedCode: "send_raw_message(msg, 64)",
        startLine: 10,
        endLine: 10,
        changeDescription: "Changed mode to 64",
      },
    },
  ],
  recommendations: [
    { priority: "High", title: "Fix sends", description: "Use safe modes", rationale: "Prevents drain" },
  ],
  gasOptimizations: [
    { location: "Lines 5-7", description: "Optimize loop", estimatedGasSavings: "~10%" },
  ],
  codeQualityObservations: [{ description: "Good naming conventions" }],
  positiveFindings: [{ aspect: "Bounce handling", description: "Properly handles bounced messages" }],
  nextSteps: "Deploy after fixing high severity issues.",
};

describe("AnalysisResults", () => {
  const defaultProps = {
    result: mockResult,
    currentCode: "int x = 5;",
    isHacking: false,
    hackerResult: false,
    onActivateHackerMode: vi.fn(),
  };

  it("renders the executive summary", () => {
    render(<AnalysisResults {...defaultProps} />);
    expect(screen.getByText("The contract has moderate security.")).toBeInTheDocument();
  });

  it("renders the security score", () => {
    render(<AnalysisResults {...defaultProps} />);
    expect(screen.getByText("85")).toBeInTheDocument();
  });

  it("renders the grade", () => {
    render(<AnalysisResults {...defaultProps} />);
    expect(screen.getByText("B")).toBeInTheDocument();
  });

  it("renders finding stats", () => {
    render(<AnalysisResults {...defaultProps} />);
    expect(screen.getByText("High")).toBeInTheDocument();
  });

  it("renders recommendations section", () => {
    render(<AnalysisResults {...defaultProps} />);
    expect(screen.getByText("Fix sends")).toBeInTheDocument();
    expect(screen.getByText("Prevents drain")).toBeInTheDocument();
  });

  it("renders gas optimizations", () => {
    render(<AnalysisResults {...defaultProps} />);
    expect(screen.getByText("Lines 5-7")).toBeInTheDocument();
    expect(screen.getByText("~10%")).toBeInTheDocument();
  });

  it("renders positive findings", () => {
    render(<AnalysisResults {...defaultProps} />);
    expect(screen.getByText(/Properly handles bounced/)).toBeInTheDocument();
  });

  it("renders next steps", () => {
    render(<AnalysisResults {...defaultProps} />);
    expect(screen.getByText(/Deploy after fixing/)).toBeInTheDocument();
  });

  it("shows hacker mode promo when not hacking", () => {
    render(<AnalysisResults {...defaultProps} />);
    expect(screen.getByText(/Activate Hacker Mode/)).toBeInTheDocument();
  });

  it("hides hacker mode promo when already hacking", () => {
    render(<AnalysisResults {...defaultProps} isHacking={true} />);
    expect(screen.queryByText(/Activate Hacker Mode/)).not.toBeInTheDocument();
  });

  it("shows All Clear when no findings", () => {
    const noFindings = {
      ...mockResult,
      findings: [],
      findingsSummary: { critical: 0, high: 0, medium: 0, low: 0, informational: 0, totalFindings: 0 },
    };
    render(<AnalysisResults {...defaultProps} result={noFindings} />);
    expect(screen.getByText("All Clear!")).toBeInTheDocument();
  });
});
