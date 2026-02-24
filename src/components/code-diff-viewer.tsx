"use client";

import { ScrollBar } from "@/components/ui/scroll-area";
import * as Diff from 'diff';
import { useMemo, forwardRef, useImperativeHandle, useRef } from "react";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import { AlignJustify, Columns } from "lucide-react";

type ViewMode = "unified" | "side-by-side";

interface CodeDiffViewerProps {
  originalCode: string;
  patchedCode: string;
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
}

export const CodeDiffViewer = forwardRef<{ scrollTo: (top: number) => void }, CodeDiffViewerProps>(
    ({ originalCode, patchedCode, onScroll, viewMode = "unified", onViewModeChange }, ref) => {
  
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const leftScrollRef = useRef<HTMLDivElement>(null);
  const rightScrollRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
      scrollTo: (top: number) => {
          if (scrollViewportRef.current) {
              scrollViewportRef.current.scrollTop = top;
          }
      }
  }));

  // Use the 'diff' library to calculate differences
  const diffChanges = useMemo(() => {
     return Diff.diffLines(originalCode, patchedCode, { newlineIsToken: false });
  }, [originalCode, patchedCode]);

  const renderDiff = () => {
      const lines: React.ReactNode[] = [];
      let originalLineNumber = 1;
      let patchedLineNumber = 1;

      diffChanges.forEach((part, partIdx) => {
          // Split content into lines, handling trailing newlines carefully
          // diffLines usually preserves newlines at the end of strings
          const partLines = part.value.split('\n');
          if (partLines[partLines.length - 1] === '') partLines.pop();

          if (part.added) {
              // Green lines (Added)
              partLines.forEach((line, lineIdx) => {
                  lines.push(
                      <div key={`add-${partIdx}-${lineIdx}`} className="flex bg-green-900/20 text-green-300">
                          <div className="w-12 flex-shrink-0 text-right mr-4 select-none border-r border-green-900/50 pr-2 opacity-50 text-xs py-0.5 font-mono">
                              {/* No original line number */}
                              <span className="text-transparent">.</span>
                          </div>
                          <div className="w-12 flex-shrink-0 text-right mr-4 select-none border-r border-green-900/50 pr-2 opacity-80 text-xs py-0.5 font-mono">
                              {patchedLineNumber++}
                          </div>
                          <pre className="flex-1 whitespace-pre-wrap break-all font-mono text-sm py-0.5 pl-2">
                              <span className="select-none mr-2 opacity-50">+</span>{line}
                          </pre>
                      </div>
                  );
              });
          } else if (part.removed) {
              // Red lines (Removed)
              partLines.forEach((line, lineIdx) => {
                  lines.push(
                      <div key={`del-${partIdx}-${lineIdx}`} className="flex bg-red-900/20 text-red-300 opacity-80">
                          <div className="w-12 flex-shrink-0 text-right mr-4 select-none border-r border-red-900/50 pr-2 opacity-80 text-xs py-0.5 font-mono">
                              {originalLineNumber++}
                          </div>
                          <div className="w-12 flex-shrink-0 text-right mr-4 select-none border-r border-red-900/50 pr-2 opacity-50 text-xs py-0.5 font-mono">
                              {/* No patched line number */}
                              <span className="text-transparent">.</span>
                          </div>
                          <pre className="flex-1 whitespace-pre-wrap break-all font-mono text-sm py-0.5 pl-2 line-through decoration-red-500/50">
                              <span className="select-none mr-2 opacity-50">-</span>{line}
                          </pre>
                      </div>
                  );
              });
          } else {
              // Unchanged lines
              partLines.forEach((line, lineIdx) => {
                  lines.push(
                      <div key={`same-${partIdx}-${lineIdx}`} className="flex text-neutral-400 hover:bg-neutral-900/50">
                          <div className="w-12 flex-shrink-0 text-right mr-4 select-none border-r border-neutral-800 pr-2 opacity-30 text-xs py-0.5 font-mono">
                              {originalLineNumber++}
                          </div>
                          <div className="w-12 flex-shrink-0 text-right mr-4 select-none border-r border-neutral-800 pr-2 opacity-30 text-xs py-0.5 font-mono">
                              {patchedLineNumber++}
                          </div>
                          <pre className="flex-1 whitespace-pre-wrap break-all font-mono text-sm py-0.5 pl-2">
                              <span className="select-none mr-2 opacity-0"> </span>{line}
                          </pre>
                      </div>
                  );
              });
          }
      });

      return lines;
  };

  // Render side-by-side view.
  //
  // Two invariants that keep the panels vertically aligned:
  //   1. leftLines.length === rightLines.length at all times (padding rows
  //      are inserted on the shorter side of every modification hunk).
  //   2. Every row — content or padding — is exactly ONE line tall.
  //      Wrapping is disabled (whitespace-pre) so a long line never pushes
  //      subsequent rows out of sync with the opposite panel.
  const renderSideBySide = () => {
    const leftLines: React.ReactNode[] = [];
    const rightLines: React.ReactNode[] = [];
    let originalLineNumber = 1;
    let patchedLineNumber = 1;
    let rowKey = 0;

    // Gutter shared between all row types (keeps column width identical).
    const GUTTER = "w-12 flex-shrink-0 text-right select-none pr-2 text-xs py-0.5 font-mono";
    // Code cell: whitespace-pre so long lines never wrap and row heights stay equal.
    const CODE = "flex-1 whitespace-pre font-mono text-sm py-0.5 pl-2";

    // A blank placeholder row — height matches a real code row because it
    // contains a non-breaking space (empty text would collapse in some browsers).
    const emptyRow = (side: "left" | "right") => (
      <div key={`${side}-empty-${rowKey}`} className="flex bg-neutral-950/40">
        <div className={`${GUTTER} border-r border-neutral-800/40`} />
        <pre className={`${CODE} select-none text-transparent`}>{"\u00A0"}</pre>
      </div>
    );

    const splitPart = (value: string) => {
      const lines = value.split("\n");
      if (lines[lines.length - 1] === "") lines.pop();
      return lines;
    };

    let i = 0;
    while (i < diffChanges.length) {
      const part = diffChanges[i];
      const partLines = splitPart(part.value);

      if (part.removed) {
        // Look ahead: a `removed` immediately followed by `added` is a
        // modification hunk — align both sides row-by-row and pad the
        // shorter side so the panels stay in sync.
        const next = diffChanges[i + 1];
        const addedLines = next?.added ? splitPart(next.value) : [];
        const hunkLen = Math.max(partLines.length, addedLines.length);

        for (let j = 0; j < hunkLen; j++) {
          if (j < partLines.length) {
            leftLines.push(
              <div key={`left-del-${rowKey}`} className="flex bg-red-900/20 text-red-300">
                <div className={`${GUTTER} border-r border-red-900/50 opacity-70`}>
                  {originalLineNumber++}
                </div>
                <pre className={`${CODE} line-through decoration-red-500/50`}>
                  <span className="select-none mr-1 opacity-50">-</span>{partLines[j]}
                </pre>
              </div>
            );
          } else {
            leftLines.push(emptyRow("left"));
          }

          if (j < addedLines.length) {
            rightLines.push(
              <div key={`right-add-${rowKey}`} className="flex bg-green-900/20 text-green-300">
                <div className={`${GUTTER} border-r border-green-900/50 opacity-70`}>
                  {patchedLineNumber++}
                </div>
                <pre className={CODE}>
                  <span className="select-none mr-1 opacity-50">+</span>{addedLines[j]}
                </pre>
              </div>
            );
          } else {
            rightLines.push(emptyRow("right"));
          }

          rowKey++;
        }

        // Consume both parts (skip ahead past the paired `added` if present).
        i += next?.added ? 2 : 1;
      } else if (part.added) {
        // Pure insertion — nothing was removed immediately before this block.
        partLines.forEach((line) => {
          leftLines.push(emptyRow("left"));
          rightLines.push(
            <div key={`right-add-${rowKey}`} className="flex bg-green-900/20 text-green-300">
              <div className={`${GUTTER} border-r border-green-900/50 opacity-70`}>
                {patchedLineNumber++}
              </div>
              <pre className={CODE}>
                <span className="select-none mr-1 opacity-50">+</span>{line}
              </pre>
            </div>
          );
          rowKey++;
        });
        i++;
      } else {
        // Unchanged lines — shown identically on both sides.
        partLines.forEach((line) => {
          leftLines.push(
            <div key={`left-same-${rowKey}`} className="flex text-neutral-400 hover:bg-neutral-900/30">
              <div className={`${GUTTER} border-r border-neutral-800 opacity-30`}>
                {originalLineNumber++}
              </div>
              <pre className={CODE}>{line}</pre>
            </div>
          );
          rightLines.push(
            <div key={`right-same-${rowKey}`} className="flex text-neutral-400 hover:bg-neutral-900/30">
              <div className={`${GUTTER} border-r border-neutral-800 opacity-30`}>
                {patchedLineNumber++}
              </div>
              <pre className={CODE}>{line}</pre>
            </div>
          );
          rowKey++;
        });
        i++;
      }
    }

    return { leftLines, rightLines };
  };

  // Handle synchronized scrolling for side-by-side view
  const handleLeftScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (rightScrollRef.current && viewMode === "side-by-side") {
      rightScrollRef.current.scrollTop = e.currentTarget.scrollTop;
    }
    if (onScroll) onScroll(e);
  };

  const handleRightScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (leftScrollRef.current && viewMode === "side-by-side") {
      leftScrollRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  return (
    <div className="rounded-md border bg-neutral-950 font-mono text-sm overflow-hidden shadow-2xl h-full flex flex-col">
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-2 bg-neutral-900 border-b border-neutral-800">
        <span className="text-xs font-bold text-neutral-400 tracking-wider">PATCH PREVIEW</span>
        <div className="flex items-center gap-4">
          {onViewModeChange && (
            <div className="flex items-center gap-1 bg-neutral-800 rounded-lg p-1">
              <button
                onClick={() => onViewModeChange("unified")}
                title="Unified View"
                aria-label="Switch to unified view"
                className={`p-2 rounded transition-colors ${
                  viewMode === "unified"
                    ? "bg-neutral-700 text-white"
                    : "text-neutral-400 hover:text-neutral-300 hover:bg-neutral-700/50"
                }`}
              >
                <AlignJustify className="h-4 w-4" />
              </button>
              <button
                onClick={() => onViewModeChange("side-by-side")}
                title="Side by Side View"
                aria-label="Switch to side by side view"
                className={`p-2 rounded transition-colors ${
                  viewMode === "side-by-side"
                    ? "bg-neutral-700 text-white"
                    : "text-neutral-400 hover:text-neutral-300 hover:bg-neutral-700/50"
                }`}
              >
                <Columns className="h-4 w-4" />
              </button>
            </div>
          )}
          <div className="flex gap-4 text-xs font-medium">
            <span className="flex items-center gap-2 text-red-400"><div className="w-1.5 h-1.5 bg-red-500 rounded-full shadow-[0_0_4px_rgba(239,68,68,0.5)]"></div> Removed</span>
            <span className="flex items-center gap-2 text-green-400"><div className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_4px_rgba(34,197,94,0.5)]"></div> Added</span>
          </div>
        </div>
      </div>
      
      {viewMode === "unified" ? (
        /* Unified View */
        <ScrollAreaPrimitive.Root className="relative overflow-hidden flex-1 w-full">
          <ScrollAreaPrimitive.Viewport 
              ref={scrollViewportRef} 
              className="h-full w-full rounded-[inherit]"
              onScroll={onScroll}
          >
              <div className="min-w-[600px] p-4 space-y-0.5">
                  {renderDiff()}
              </div>
          </ScrollAreaPrimitive.Viewport>
          <ScrollBar />
          <ScrollAreaPrimitive.Corner />
        </ScrollAreaPrimitive.Root>
      ) : (
        /* Side-by-Side View */
        (() => {
          const { leftLines, rightLines } = renderSideBySide();
          return (
            <div className="flex-1 flex overflow-hidden">
              {/* LEFT — original */}
              <ScrollAreaPrimitive.Root className="relative overflow-hidden flex-1 w-1/2 border-r border-neutral-800">
                <ScrollAreaPrimitive.Viewport
                  ref={leftScrollRef}
                  className="h-full w-full rounded-[inherit]"
                  onScroll={handleLeftScroll}
                >
                  {/* min-w-max lets long non-wrapping lines expand the scroll area */}
                  <div className="p-4 space-y-0.5 min-w-max">
                    <div className="sticky top-0 bg-neutral-900/95 backdrop-blur-sm z-10 pb-2 mb-2 border-b border-neutral-800">
                      <span className="text-xs font-bold text-neutral-400 tracking-wider">ORIGINAL</span>
                    </div>
                    {leftLines}
                  </div>
                </ScrollAreaPrimitive.Viewport>
                <ScrollBar orientation="vertical" />
                <ScrollBar orientation="horizontal" />
                <ScrollAreaPrimitive.Corner />
              </ScrollAreaPrimitive.Root>

              {/* RIGHT — modified */}
              <ScrollAreaPrimitive.Root className="relative overflow-hidden flex-1 w-1/2">
                <ScrollAreaPrimitive.Viewport
                  ref={rightScrollRef}
                  className="h-full w-full rounded-[inherit]"
                  onScroll={handleRightScroll}
                >
                  <div className="p-4 space-y-0.5 min-w-max">
                    <div className="sticky top-0 bg-neutral-900/95 backdrop-blur-sm z-10 pb-2 mb-2 border-b border-neutral-800">
                      <span className="text-xs font-bold text-neutral-400 tracking-wider">MODIFIED</span>
                    </div>
                    {rightLines}
                  </div>
                </ScrollAreaPrimitive.Viewport>
                <ScrollBar orientation="vertical" />
                <ScrollBar orientation="horizontal" />
                <ScrollAreaPrimitive.Corner />
              </ScrollAreaPrimitive.Root>
            </div>
          );
        })()
      )}
    </div>
  );
});

CodeDiffViewer.displayName = "CodeDiffViewer";
