import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/components/code-analyzer", () => ({
  CodeAnalyzer: () => <div data-testid="code-analyzer">CodeAnalyzer Mock</div>,
}));

import AuditorPage from "@/app/auditor/page";

describe("AuditorPage", () => {
  it("renders the header with logo", () => {
    render(<AuditorPage />);
    expect(screen.getByText("CryptoSecure")).toBeInTheDocument();
  });

  it("renders Back to Home link", () => {
    render(<AuditorPage />);
    expect(screen.getByText("Back to Home")).toBeInTheDocument();
  });

  it("renders the CodeAnalyzer component", () => {
    render(<AuditorPage />);
    expect(screen.getByTestId("code-analyzer")).toBeInTheDocument();
  });
});
