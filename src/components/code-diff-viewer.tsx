"use client";

import { ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
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

  // Split code into lines for side-by-side view
  const originalLines = useMemo(() => originalCode.split('\n'), [originalCode]);
  const patchedLines = useMemo(() => patchedCode.split('\n'), [patchedCode]);

  // We need to reconstruct the lines to show line numbers properly
  // Diff library returns blocks of added/removed/common text
  
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

  // Render side-by-side view - returns separate left and right content
  const renderSideBySide = () => {
    const leftLines: React.ReactNode[] = [];
    const rightLines: React.ReactNode[] = [];
    let originalLineNumber = 1;
    let patchedLineNumber = 1;

    diffChanges.forEach((part) => {
      const partLines = part.value.split('\n');
      if (partLines[partLines.length - 1] === '') partLines.pop();

      if (part.added) {
        // Only show in right column
        partLines.forEach((line) => {
          leftLines.push(
            <div key={`left-add-${patchedLineNumber}`} className="flex text-neutral-600 bg-neutral-950/50">
              <div className="w-12 flex-shrink-0 text-right mr-4 select-none border-r border-neutral-800 pr-2 opacity-30 text-xs py-0.5 font-mono">
                {/* Empty for added lines */}
              </div>
              <pre className="flex-1 whitespace-pre-wrap break-all font-mono text-sm py-0.5 pl-2 text-neutral-700">
                {/* Empty */}
              </pre>
            </div>
          );
          rightLines.push(
            <div key={`right-add-${patchedLineNumber}`} className="flex text-green-300 bg-green-900/20">
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
        // Only show in left column
        partLines.forEach((line) => {
          leftLines.push(
            <div key={`left-del-${originalLineNumber}`} className="flex text-red-300 opacity-80 bg-red-900/20">
              <div className="w-12 flex-shrink-0 text-right mr-4 select-none border-r border-red-900/50 pr-2 opacity-80 text-xs py-0.5 font-mono">
                {originalLineNumber++}
              </div>
              <pre className="flex-1 whitespace-pre-wrap break-all font-mono text-sm py-0.5 pl-2 line-through decoration-red-500/50">
                <span className="select-none mr-2 opacity-50">-</span>{line}
              </pre>
            </div>
          );
          rightLines.push(
            <div key={`right-del-${originalLineNumber}`} className="flex text-neutral-600 bg-neutral-950/50">
              <div className="w-12 flex-shrink-0 text-right mr-4 select-none border-r border-neutral-800 pr-2 opacity-30 text-xs py-0.5 font-mono">
                {/* Empty for removed lines */}
              </div>
              <pre className="flex-1 whitespace-pre-wrap break-all font-mono text-sm py-0.5 pl-2 text-neutral-700">
                {/* Empty */}
              </pre>
            </div>
          );
        });
      } else {
        // Show in both columns
        partLines.forEach((line) => {
          leftLines.push(
            <div key={`left-same-${originalLineNumber}`} className="flex text-neutral-400 hover:bg-neutral-900/30">
              <div className="w-12 flex-shrink-0 text-right mr-4 select-none border-r border-neutral-800 pr-2 opacity-30 text-xs py-0.5 font-mono">
                {originalLineNumber++}
              </div>
              <pre className="flex-1 whitespace-pre-wrap break-all font-mono text-sm py-0.5 pl-2">
                {line}
              </pre>
            </div>
          );
          rightLines.push(
            <div key={`right-same-${patchedLineNumber}`} className="flex text-neutral-400 hover:bg-neutral-900/30">
              <div className="w-12 flex-shrink-0 text-right mr-4 select-none border-r border-neutral-800 pr-2 opacity-30 text-xs py-0.5 font-mono">
                {patchedLineNumber++}
              </div>
              <pre className="flex-1 whitespace-pre-wrap break-all font-mono text-sm py-0.5 pl-2">
                {line}
              </pre>
            </div>
          );
        });
      }
    });

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
              <ScrollAreaPrimitive.Root className="relative overflow-hidden flex-1 w-1/2 border-r border-neutral-800">
                <ScrollAreaPrimitive.Viewport 
                    ref={leftScrollRef} 
                    className="h-full w-full rounded-[inherit]"
                    onScroll={handleLeftScroll}
                >
                    <div className="p-4 space-y-0.5">
                        <div className="sticky top-0 bg-neutral-900/95 backdrop-blur-sm z-10 pb-2 mb-2 border-b border-neutral-800">
                          <span className="text-xs font-bold text-neutral-400 tracking-wider">ORIGINAL</span>
                        </div>
                        {leftLines}
                    </div>
                </ScrollAreaPrimitive.Viewport>
                <ScrollBar />
                <ScrollAreaPrimitive.Corner />
              </ScrollAreaPrimitive.Root>
              <ScrollAreaPrimitive.Root className="relative overflow-hidden flex-1 w-1/2">
                <ScrollAreaPrimitive.Viewport 
                    ref={rightScrollRef} 
                    className="h-full w-full rounded-[inherit]"
                    onScroll={handleRightScroll}
                >
                    <div className="p-4 space-y-0.5">
                        <div className="sticky top-0 bg-neutral-900/95 backdrop-blur-sm z-10 pb-2 mb-2 border-b border-neutral-800">
                          <span className="text-xs font-bold text-neutral-400 tracking-wider">MODIFIED</span>
                        </div>
                        {rightLines}
                    </div>
                </ScrollAreaPrimitive.Viewport>
                <ScrollBar />
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
