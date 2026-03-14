import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { HackerModeResults } from "@/components/hacker-mode-results";
import type { HackerModeResult } from "@/types/analysis";

const mockResult: HackerModeResult = {
  hackerResilienceScore: 45,
  riskLevel: "High",
  summary: "Multiple exploits found during hacker assessment.",
  attackSurface: [
    { id: "AS1", entryPoint: "recv_internal", riskFactors: ["external call", "affects balance"], notes: "Main handler" },
  ],
  exploits: [
    {
      id: "EXP1",
      attackSurfaceId: "AS1",
      title: "Reentrancy Attack",
      type: "reentrancy",
      prerequisites: "Can call recv_internal",
      steps: ["Send message", "Re-enter"],
      expectedImpact: "Drain funds",
      likelihood: "high",
      status: "plausible",
      severity: "Critical",
    },
    {
      id: "EXP2",
      attackSurfaceId: "AS1",
      title: "Theoretical DoS",
      type: "dos",
      prerequisites: "none",
      steps: ["Flood messages"],
      expectedImpact: "Service disruption",
      likelihood: "low",
      status: "theoretical",
      severity: "Medium",
    },
  ],
  recommendations: [
    { exploitId: "EXP1", mitigation: "Add reentrancy guard", codeExample: "check_reentrancy();" },
  ],
};

describe("HackerModeResults", () => {
  it("renders the summary", () => {
    render(<HackerModeResults result={mockResult} />);
    expect(screen.getByText(/Multiple exploits found/)).toBeInTheDocument();
  });

  it("renders the resilience score", () => {
    render(<HackerModeResults result={mockResult} />);
    expect(screen.getByText("45")).toBeInTheDocument();
  });

  it("renders the risk level", () => {
    render(<HackerModeResults result={mockResult} />);
    expect(screen.getByText("High")).toBeInTheDocument();
  });

  it("renders attack surface entries", () => {
    render(<HackerModeResults result={mockResult} />);
    expect(screen.getByText("recv_internal")).toBeInTheDocument();
    expect(screen.getByText("2 Risk Factors")).toBeInTheDocument();
  });

  it("expands attack surface details on click", () => {
    render(<HackerModeResults result={mockResult} />);
    fireEvent.click(screen.getByText("recv_internal"));
    expect(screen.getByText("external call")).toBeInTheDocument();
    expect(screen.getByText("affects balance")).toBeInTheDocument();
    expect(screen.getByText("Main handler")).toBeInTheDocument();
  });

  it("renders exploit cards", () => {
    render(<HackerModeResults result={mockResult} />);
    expect(screen.getByText("Reentrancy Attack")).toBeInTheDocument();
    expect(screen.getByText("Theoretical DoS")).toBeInTheDocument();
  });

  it("shows PLAUSIBLE badge for plausible exploits", () => {
    render(<HackerModeResults result={mockResult} />);
    expect(screen.getByText("PLAUSIBLE")).toBeInTheDocument();
  });

  it("shows THEORETICAL badge for theoretical exploits", () => {
    render(<HackerModeResults result={mockResult} />);
    expect(screen.getByText("THEORETICAL")).toBeInTheDocument();
  });

  it("expands exploit details on click", () => {
    render(<HackerModeResults result={mockResult} />);
    fireEvent.click(screen.getByText("Reentrancy Attack"));
    expect(screen.getByText(/Can call recv_internal/)).toBeInTheDocument();
    expect(screen.getByText(/Drain funds/)).toBeInTheDocument();
    expect(screen.getByText("Add reentrancy guard")).toBeInTheDocument();
  });

  it("shows No Exploits message when empty", () => {
    const emptyResult = { ...mockResult, exploits: [] };
    render(<HackerModeResults result={emptyResult} />);
    expect(screen.getByText("No Exploits Found")).toBeInTheDocument();
  });
});
