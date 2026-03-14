import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Logo } from "@/components/logo";

describe("Logo", () => {
  it("renders the CryptoSecure text", () => {
    render(<Logo />);
    expect(screen.getByText("CryptoSecure")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(<Logo className="my-custom-class" />);
    expect(container.firstChild).toHaveClass("my-custom-class");
  });

  it("renders default variant with background div", () => {
    const { container } = render(<Logo variant="default" />);
    const bgDiv = container.querySelector(".bg-blue-600");
    expect(bgDiv).toBeInTheDocument();
  });

  it("renders minimal variant without background div", () => {
    const { container } = render(<Logo variant="minimal" />);
    const bgDiv = container.querySelector(".bg-blue-600");
    expect(bgDiv).not.toBeInTheDocument();
  });
});
