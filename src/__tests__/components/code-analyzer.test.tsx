import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

vi.mock("@react-pdf/renderer", () => ({
  pdf: vi.fn(),
  Page: ({ children }: any) => <div>{children}</div>,
  Text: ({ children }: any) => <span>{children}</span>,
  View: ({ children }: any) => <div>{children}</div>,
  Document: ({ children }: any) => <div>{children}</div>,
  StyleSheet: { create: (s: any) => s },
  Font: { register: vi.fn() },
}));

import { CodeAnalyzer } from "@/components/code-analyzer";

describe("CodeAnalyzer", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the title", () => {
    render(<CodeAnalyzer />);
    expect(screen.getByText("Smart Contract Auditor")).toBeInTheDocument();
  });

  it("renders upload and snippet tabs", () => {
    render(<CodeAnalyzer />);
    expect(screen.getByText("Upload")).toBeInTheDocument();
    expect(screen.getByText("Snippet")).toBeInTheDocument();
  });

  it("renders the Analyze Security button (disabled initially)", () => {
    render(<CodeAnalyzer />);
    const analyzeButton = screen.getByText("Analyze Security");
    expect(analyzeButton).toBeInTheDocument();
    expect(analyzeButton.closest("button")).toBeDisabled();
  });

  it("shows drag and drop area on upload tab", () => {
    render(<CodeAnalyzer />);
    expect(screen.getByText("Drop files here")).toBeInTheDocument();
    expect(screen.getByText(/Attach contract files/)).toBeInTheDocument();
  });

  it("switches to snippet tab and shows textarea", () => {
    render(<CodeAnalyzer />);
    fireEvent.click(screen.getByText("Snippet"));
    expect(screen.getByPlaceholderText(/Paste your smart contract/)).toBeInTheDocument();
  });

  it("shows Activate Hacker Mode button", () => {
    render(<CodeAnalyzer />);
    expect(screen.getByText("Activate Hacker Mode")).toBeInTheDocument();
  });

  it("shows the description text", () => {
    render(<CodeAnalyzer />);
    expect(screen.getByText(/Upload your contract files or paste code/)).toBeInTheDocument();
  });

  it("switches tabs and clears state", () => {
    render(<CodeAnalyzer />);
    fireEvent.click(screen.getByText("Snippet"));
    const textarea = screen.getByPlaceholderText(/Paste your smart contract/);
    fireEvent.change(textarea, { target: { value: "some code" } });

    fireEvent.click(screen.getByText("Upload"));
    expect(screen.getByText("Drop files here")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Snippet"));
    const newTextarea = screen.getByPlaceholderText(/Paste your smart contract/);
    expect(newTextarea).toHaveValue("");
  });

  it("shows language buttons in snippet mode", () => {
    render(<CodeAnalyzer />);
    fireEvent.click(screen.getByText("Snippet"));
    expect(screen.getByText("TACT")).toBeInTheDocument();
    expect(screen.getByText("FC")).toBeInTheDocument();
    expect(screen.getByText("FUNC")).toBeInTheDocument();
  });

  it("allows entering code in snippet mode", () => {
    render(<CodeAnalyzer />);
    fireEvent.click(screen.getByText("Snippet"));
    const textarea = screen.getByPlaceholderText(/Paste your smart contract/);
    fireEvent.change(textarea, { target: { value: "() recv_internal() {}" } });
    expect(textarea).toHaveValue("() recv_internal() {}");
  });

  it("shows auto-detect error when unrecognized code is typed", () => {
    render(<CodeAnalyzer />);
    fireEvent.click(screen.getByText("Snippet"));
    const textarea = screen.getByPlaceholderText(/Paste your smart contract/);
    fireEvent.change(textarea, { target: { value: "int x = 5;" } });
    expect(screen.getAllByText(/Unable to auto-detect language/).length).toBeGreaterThan(0);
  });

  it("click to upload link exists", () => {
    render(<CodeAnalyzer />);
    expect(screen.getByText("Click to upload")).toBeInTheDocument();
  });

  it("accepts a valid .fc file", async () => {
    render(<CodeAnalyzer />);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    const file = new File(["() recv_internal() {}"], "contract.fc", { type: "text/plain" });
    Object.defineProperty(fileInput, "files", { value: [file] });
    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(screen.getByText("contract.fc")).toBeInTheDocument();
    });
  });

  it("removes uploaded file when remove button clicked", async () => {
    render(<CodeAnalyzer />);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    const file = new File(["() recv_internal() {}"], "contract.fc", { type: "text/plain" });
    Object.defineProperty(fileInput, "files", { value: [file] });
    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(screen.getByText("contract.fc")).toBeInTheDocument();
    });

    const removeButton = screen.getByTitle("Remove file");
    fireEvent.click(removeButton);

    expect(screen.getByText("Drop files here")).toBeInTheDocument();
  });

  it("handles snippet language selection via FunC code", () => {
    render(<CodeAnalyzer />);
    fireEvent.click(screen.getByText("Snippet"));
    const textarea = screen.getByPlaceholderText(/Paste your smart contract/);
    fireEvent.change(textarea, { target: { value: "() recv_internal(int balance) impure {}" } });
    expect(screen.getByText("FUNC")).toBeInTheDocument();
  });

  it("selecting a language enables analysis", () => {
    render(<CodeAnalyzer />);
    fireEvent.click(screen.getByText("Snippet"));

    const textarea = screen.getByPlaceholderText(/Paste your smart contract/);
    fireEvent.change(textarea, { target: { value: "() recv_internal() impure { }" } });

    const analyzeBtn = screen.getByText("Analyze Security").closest("button");
    expect(analyzeBtn).not.toBeDisabled();
  });

  it("shows progress stepper when analyzing", async () => {
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({
        analysisMetadata: { contractName: "test", language: "FunC", linesOfCode: 1, analysisDate: "2025-01-01", totalIssuesFound: 0 },
        securityScore: 95,
        grade: "A",
        executiveSummary: "No issues found",
        findingsSummary: { critical: 0, high: 0, medium: 0, low: 0, informational: 0, totalFindings: 0 },
        findings: [],
        recommendations: [],
        gasOptimizations: [],
      }),
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse));

    render(<CodeAnalyzer />);
    fireEvent.click(screen.getByText("Snippet"));

    const textarea = screen.getByPlaceholderText(/Paste your smart contract/);
    fireEvent.change(textarea, { target: { value: "() recv_internal() impure { }" } });

    const analyzeBtn = screen.getByText("Analyze Security").closest("button")!;
    fireEvent.click(analyzeBtn);

    await waitFor(() => {
      expect(screen.getByText("Scan in progress...")).toBeInTheDocument();
    });

    vi.unstubAllGlobals();
  });

  it("detects Tact code in snippet and auto-selects language", () => {
    render(<CodeAnalyzer />);
    fireEvent.click(screen.getByText("Snippet"));
    const textarea = screen.getByPlaceholderText(/Paste your smart contract/);
    fireEvent.change(textarea, { target: { value: "contract MyContract { }" } });
    const tactBtn = screen.getByText("TACT");
    expect(tactBtn.closest("button")).toHaveClass("bg-blue-600");
  });

  it("clears snippet when switching to upload tab", () => {
    render(<CodeAnalyzer />);
    fireEvent.click(screen.getByText("Snippet"));
    const textarea = screen.getByPlaceholderText(/Paste your smart contract/);
    fireEvent.change(textarea, { target: { value: "() recv_internal() impure {}" } });

    fireEvent.click(screen.getByText("Upload"));
    fireEvent.click(screen.getByText("Snippet"));

    const newTextarea = screen.getByPlaceholderText(/Paste your smart contract/);
    expect(newTextarea).toHaveValue("");
  });

  it("shows accepted file types text", () => {
    render(<CodeAnalyzer />);
    expect(screen.getByText(/\.tact, \.fc, \.func/)).toBeInTheDocument();
  });
});
