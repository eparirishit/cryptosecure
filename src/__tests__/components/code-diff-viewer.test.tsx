import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CodeDiffViewer } from "@/components/code-diff-viewer";

describe("CodeDiffViewer", () => {
  it("renders the PATCH PREVIEW header", () => {
    render(<CodeDiffViewer originalCode="line1" patchedCode="line1" />);
    expect(screen.getByText("PATCH PREVIEW")).toBeInTheDocument();
  });

  it("renders Removed and Added legends", () => {
    render(<CodeDiffViewer originalCode="old" patchedCode="new" />);
    expect(screen.getByText("Removed")).toBeInTheDocument();
    expect(screen.getByText("Added")).toBeInTheDocument();
  });

  it("shows unchanged lines", () => {
    render(<CodeDiffViewer originalCode="same line" patchedCode="same line" />);
    expect(screen.getByText("same line")).toBeInTheDocument();
  });

  it("shows added lines with + prefix", () => {
    render(<CodeDiffViewer originalCode="" patchedCode="new line" />);
    expect(screen.getByText("new line")).toBeInTheDocument();
  });

  it("shows removed lines with - prefix", () => {
    render(<CodeDiffViewer originalCode="old line" patchedCode="" />);
    expect(screen.getByText("old line")).toBeInTheDocument();
  });

  it("renders view mode toggle buttons when onViewModeChange provided", () => {
    render(
      <CodeDiffViewer
        originalCode="a"
        patchedCode="b"
        onViewModeChange={() => {}}
      />
    );
    expect(screen.getByTitle("Unified View")).toBeInTheDocument();
    expect(screen.getByTitle("Side by Side View")).toBeInTheDocument();
  });

  it("does not render toggle buttons without onViewModeChange", () => {
    render(<CodeDiffViewer originalCode="a" patchedCode="b" />);
    expect(screen.queryByTitle("Unified View")).not.toBeInTheDocument();
  });

  it("renders side-by-side view", () => {
    render(
      <CodeDiffViewer
        originalCode="old"
        patchedCode="new"
        viewMode="side-by-side"
        onViewModeChange={() => {}}
      />
    );
    expect(screen.getByText("ORIGINAL")).toBeInTheDocument();
    expect(screen.getByText("MODIFIED")).toBeInTheDocument();
  });

  it("side-by-side shows removed and added content", () => {
    render(
      <CodeDiffViewer
        originalCode="removed line"
        patchedCode="added line"
        viewMode="side-by-side"
      />
    );
    expect(screen.getByText("removed line")).toBeInTheDocument();
    expect(screen.getByText("added line")).toBeInTheDocument();
  });

  it("side-by-side shows unchanged lines on both sides", () => {
    render(
      <CodeDiffViewer
        originalCode={"same\nold line\nsame"}
        patchedCode={"same\nnew line\nsame"}
        viewMode="side-by-side"
      />
    );
    const sameElements = screen.getAllByText("same");
    expect(sameElements.length).toBeGreaterThanOrEqual(2);
  });

  it("side-by-side handles pure insertion (no removal)", () => {
    render(
      <CodeDiffViewer
        originalCode="line1"
        patchedCode={"line1\ninserted"}
        viewMode="side-by-side"
      />
    );
    expect(screen.getByText("inserted")).toBeInTheDocument();
  });

  it("side-by-side handles modification hunk with padding", () => {
    render(
      <CodeDiffViewer
        originalCode={"a\nb\nc"}
        patchedCode={"a\nx\ny\nz\nc"}
        viewMode="side-by-side"
      />
    );
    expect(screen.getByText("x")).toBeInTheDocument();
    expect(screen.getByText("y")).toBeInTheDocument();
    expect(screen.getByText("z")).toBeInTheDocument();
  });

  it("renders multiline diff correctly in unified view", () => {
    render(
      <CodeDiffViewer
        originalCode={"line1\nline2\nline3"}
        patchedCode={"line1\nchanged\nline3"}
      />
    );
    expect(screen.getByText("line1")).toBeInTheDocument();
    expect(screen.getByText("line2")).toBeInTheDocument();
    expect(screen.getByText("changed")).toBeInTheDocument();
    expect(screen.getByText("line3")).toBeInTheDocument();
  });
});
