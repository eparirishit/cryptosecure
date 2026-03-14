import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProgressStepper } from "@/components/progress-stepper";

const STEPS = [
  { title: "Parsing code", description: "Reading syntax" },
  { title: "Analyzing logic", description: "Identifying patterns" },
  { title: "Scanning vulnerabilities" },
  { title: "Generating report" },
] as const;

describe("ProgressStepper", () => {
  it("renders the title", () => {
    render(
      <ProgressStepper steps={STEPS} currentStep={0} title="Analyzing..." />
    );
    expect(screen.getByText("Analyzing...")).toBeInTheDocument();
  });

  it("renders the subtitle when provided", () => {
    render(
      <ProgressStepper
        steps={STEPS}
        currentStep={0}
        title="Title"
        subtitle="Please wait"
      />
    );
    expect(screen.getByText("Please wait")).toBeInTheDocument();
  });

  it("does not render subtitle when not provided", () => {
    render(
      <ProgressStepper steps={STEPS} currentStep={0} title="Title" />
    );
    expect(screen.queryByText("Please wait")).not.toBeInTheDocument();
  });

  it("renders all step titles", () => {
    render(
      <ProgressStepper steps={STEPS} currentStep={0} title="Title" />
    );
    expect(screen.getByText("Parsing code")).toBeInTheDocument();
    expect(screen.getByText("Analyzing logic")).toBeInTheDocument();
    expect(screen.getByText("Scanning vulnerabilities")).toBeInTheDocument();
    expect(screen.getByText("Generating report")).toBeInTheDocument();
  });

  it("shows description for the active step only", () => {
    render(
      <ProgressStepper steps={STEPS} currentStep={0} title="Title" />
    );
    expect(screen.getByText("Reading syntax")).toBeInTheDocument();
    expect(screen.queryByText("Identifying patterns")).not.toBeInTheDocument();
  });

  it("changes which step description is visible based on currentStep", () => {
    render(
      <ProgressStepper steps={STEPS} currentStep={1} title="Title" />
    );
    expect(screen.queryByText("Reading syntax")).not.toBeInTheDocument();
    expect(screen.getByText("Identifying patterns")).toBeInTheDocument();
  });
});
