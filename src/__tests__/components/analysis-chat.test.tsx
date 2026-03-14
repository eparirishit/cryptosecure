import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AnalysisChat } from "@/components/analysis-chat";

describe("AnalysisChat", () => {
  it("renders the chat input", () => {
    render(<AnalysisChat />);
    const input = screen.getByPlaceholderText(/Ask Audie/i);
    expect(input).toBeInTheDocument();
  });

  it("renders quick action buttons", () => {
    render(<AnalysisChat />);
    expect(screen.getByText(/How do I fix the reentrancy/)).toBeInTheDocument();
    expect(screen.getByText(/Explain the impact/)).toBeInTheDocument();
  });

  it("shows Audie AI branding", () => {
    render(<AnalysisChat />);
    expect(screen.getByText("Audie AI")).toBeInTheDocument();
  });
});
