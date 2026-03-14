import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardAction,
} from "@/components/ui/card";

describe("Card components", () => {
  it("renders Card with children", () => {
    render(<Card data-testid="card">Card content</Card>);
    expect(screen.getByTestId("card")).toHaveTextContent("Card content");
  });

  it("Card applies data-slot attribute", () => {
    render(<Card data-testid="card">test</Card>);
    expect(screen.getByTestId("card")).toHaveAttribute("data-slot", "card");
  });

  it("renders CardHeader", () => {
    render(<CardHeader data-testid="header">Header</CardHeader>);
    expect(screen.getByTestId("header")).toBeInTheDocument();
  });

  it("renders CardTitle", () => {
    render(<CardTitle>My Title</CardTitle>);
    expect(screen.getByText("My Title")).toBeInTheDocument();
  });

  it("renders CardDescription", () => {
    render(<CardDescription>My Description</CardDescription>);
    expect(screen.getByText("My Description")).toBeInTheDocument();
  });

  it("renders CardContent", () => {
    render(<CardContent data-testid="content">Body</CardContent>);
    expect(screen.getByTestId("content")).toHaveTextContent("Body");
  });

  it("renders CardFooter", () => {
    render(<CardFooter data-testid="footer">Footer</CardFooter>);
    expect(screen.getByTestId("footer")).toBeInTheDocument();
  });

  it("renders CardAction", () => {
    render(<CardAction data-testid="action">Action</CardAction>);
    expect(screen.getByTestId("action")).toBeInTheDocument();
  });

  it("passes custom className to Card", () => {
    render(<Card data-testid="card" className="custom-class">test</Card>);
    expect(screen.getByTestId("card")).toHaveClass("custom-class");
  });
});
