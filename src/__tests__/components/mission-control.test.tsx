import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { MissionControl } from "@/components/mission-control";

describe("MissionControl", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the header with SYSTEM_ACTIVE", () => {
    render(<MissionControl />);
    expect(screen.getByText("SYSTEM_ACTIVE")).toBeInTheDocument();
  });

  it("renders the target filename", () => {
    render(<MissionControl />);
    expect(screen.getByText("Target: wallet.fc")).toBeInTheDocument();
  });

  it("renders all security checks", () => {
    render(<MissionControl />);
    expect(screen.getByText("Re-entrancy")).toBeInTheDocument();
    expect(screen.getByText("Access Control")).toBeInTheDocument();
    expect(screen.getByText("Integer Overflow")).toBeInTheDocument();
    expect(screen.getByText("Gas Limit")).toBeInTheDocument();
  });

  it("renders the Security Score label", () => {
    render(<MissionControl />);
    expect(screen.getByText("Security Score")).toBeInTheDocument();
  });

  it("renders initial score of 100", () => {
    render(<MissionControl />);
    expect(screen.getByText("100")).toBeInTheDocument();
  });

  it("renders code panel with FunC code", () => {
    render(<MissionControl />);
    expect(screen.getByText(";; Analyzing Smart Contract...")).toBeInTheDocument();
    expect(screen.getByText("recv_internal")).toBeInTheDocument();
  });

  it("updates score to 45 after first timeout", async () => {
    render(<MissionControl />);
    expect(screen.getByText("100")).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2100);
    });
    expect(screen.getByText("45")).toBeInTheDocument();
  });

  it("shows fixing overlay after second timeout", async () => {
    render(<MissionControl />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2100);
    });
    expect(screen.getByText("45")).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2100);
    });
    expect(screen.getByText("Applying Auto-Patch...")).toBeInTheDocument();
  });
});
