import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SeveritySection } from "@/components/severity-section";
import { AlertOctagon } from "lucide-react";
import type { Finding } from "@/types/analysis";

const makeFinding = (overrides: Partial<Finding> = {}): Finding => ({
  id: "CRIT-001",
  title: "Test Vulnerability",
  severity: "CRITICAL",
  category: "Access Control",
  description: "A critical vulnerability",
  impact: "Fund loss",
  recommendation: "Fix it",
  codeChanges: {
    vulnerableCode: "bad_code()",
    fixedCode: "good_code()",
    startLine: 10,
    endLine: 12,
    changeDescription: "Fixed the issue",
    function: "recv_internal",
  },
  ...overrides,
});

describe("SeveritySection", () => {
  const defaultProps = {
    severity: "CRITICAL",
    count: 2,
    findings: [makeFinding(), makeFinding({ id: "CRIT-002", title: "Second Vuln" })],
    icon: AlertOctagon,
    colorClass: "text-red-600",
    bgClass: "bg-red-50/50",
    borderClass: "border-l-red-500",
    originalCode: "int x = 5;",
  };

  it("renders nothing when count is 0", () => {
    const { container } = render(<SeveritySection {...defaultProps} count={0} findings={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders the severity header with count", () => {
    render(<SeveritySection {...defaultProps} />);
    expect(screen.getByText("Critical Severity")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("findings are hidden by default", () => {
    render(<SeveritySection {...defaultProps} />);
    expect(screen.queryByText("Test Vulnerability")).not.toBeInTheDocument();
  });

  it("shows findings when clicked", () => {
    render(<SeveritySection {...defaultProps} />);
    fireEvent.click(screen.getByText("Critical Severity"));
    expect(screen.getByText("Test Vulnerability")).toBeInTheDocument();
    expect(screen.getByText("Second Vuln")).toBeInTheDocument();
  });

  it("displays finding details when expanded", () => {
    render(<SeveritySection {...defaultProps} />);
    fireEvent.click(screen.getByText("Critical Severity"));
    expect(screen.getAllByText("A critical vulnerability").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Fund loss").length).toBeGreaterThan(0);
    expect(screen.getAllByText("bad_code()").length).toBeGreaterThan(0);
    expect(screen.getAllByText("good_code()").length).toBeGreaterThan(0);
  });

  it("shows finding category and id", () => {
    render(<SeveritySection {...defaultProps} />);
    fireEvent.click(screen.getByText("Critical Severity"));
    expect(screen.getByText("CRIT-001")).toBeInTheDocument();
    expect(screen.getAllByText("Access Control").length).toBeGreaterThan(0);
  });

  it("collapses when clicked again", () => {
    render(<SeveritySection {...defaultProps} />);
    const header = screen.getByText("Critical Severity");
    fireEvent.click(header);
    expect(screen.getByText("Test Vulnerability")).toBeInTheDocument();
    fireEvent.click(header);
    expect(screen.queryByText("Test Vulnerability")).not.toBeInTheDocument();
  });
});
