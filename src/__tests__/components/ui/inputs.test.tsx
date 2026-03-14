import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SimpleTooltip } from "@/components/ui/simple-tooltip";

describe("Input", () => {
  it("renders an input element", () => {
    render(<Input data-testid="input" />);
    expect(screen.getByTestId("input")).toBeInTheDocument();
    expect(screen.getByTestId("input").tagName).toBe("INPUT");
  });

  it("passes type prop", () => {
    render(<Input data-testid="input" type="email" />);
    expect(screen.getByTestId("input")).toHaveAttribute("type", "email");
  });

  it("applies custom className", () => {
    render(<Input data-testid="input" className="my-class" />);
    expect(screen.getByTestId("input")).toHaveClass("my-class");
  });

  it("has data-slot attribute", () => {
    render(<Input data-testid="input" />);
    expect(screen.getByTestId("input")).toHaveAttribute("data-slot", "input");
  });
});

describe("Textarea", () => {
  it("renders a textarea element", () => {
    render(<Textarea data-testid="ta" />);
    expect(screen.getByTestId("ta")).toBeInTheDocument();
    expect(screen.getByTestId("ta").tagName).toBe("TEXTAREA");
  });

  it("applies custom className", () => {
    render(<Textarea data-testid="ta" className="my-class" />);
    expect(screen.getByTestId("ta")).toHaveClass("my-class");
  });

  it("has data-slot attribute", () => {
    render(<Textarea data-testid="ta" />);
    expect(screen.getByTestId("ta")).toHaveAttribute("data-slot", "textarea");
  });
});

describe("SimpleTooltip", () => {
  it("renders children", () => {
    render(
      <SimpleTooltip content="Tooltip text">
        <span>Hover me</span>
      </SimpleTooltip>
    );
    expect(screen.getByText("Hover me")).toBeInTheDocument();
  });

  it("renders tooltip content in DOM (hidden by CSS)", () => {
    render(
      <SimpleTooltip content="Tooltip text">
        <span>Hover me</span>
      </SimpleTooltip>
    );
    expect(screen.getByText("Tooltip text")).toBeInTheDocument();
  });
});
