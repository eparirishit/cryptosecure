import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/components/mission-control", () => ({
  MissionControl: () => <div data-testid="mission-control">MissionControl Mock</div>,
}));

import Home from "@/app/page";

describe("Home page", () => {
  it("renders the hero heading", () => {
    render(<Home />);
    expect(screen.getByText("Ship Secure")).toBeInTheDocument();
    expect(screen.getByText("TON Contracts")).toBeInTheDocument();
  });

  it("renders the CTA button", () => {
    render(<Home />);
    expect(screen.getByText("Audit My Code Now")).toBeInTheDocument();
  });

  it("renders the tagline badge", () => {
    render(<Home />);
    expect(screen.getByText("The Standard for TON Security")).toBeInTheDocument();
  });

  it("renders the Get Started button in header", () => {
    render(<Home />);
    expect(screen.getByText("Get Started")).toBeInTheDocument();
  });

  it("renders the description text", () => {
    render(<Home />);
    expect(screen.getByText(/Secure your TON smart contracts/)).toBeInTheDocument();
  });

  it("renders the MissionControl component", () => {
    render(<Home />);
    expect(screen.getByTestId("mission-control")).toBeInTheDocument();
  });
});
