"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Finding } from "@/types/analysis";
import { getSeverityDisplayName } from "@/lib/utils/severity";

interface SeveritySectionProps {
  severity: string;
  count: number;
  findings: Finding[];
  icon: LucideIcon;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  originalCode: string;
}

export function SeveritySection({
  severity,
  count,
  findings,
  icon: Icon,
  colorClass,
  bgClass,
  borderClass,
}: SeveritySectionProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (count === 0) return null;

  return (
    <div className="border rounded-lg overflow-hidden mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-4 ${bgClass} hover:brightness-95 transition-all`}
      >
        <div className="flex items-center gap-3">
          <Icon className={`h-5 w-5 ${colorClass}`} />
          <span className="font-semibold text-lg">
            {getSeverityDisplayName(severity)} Severity
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-black/5 dark:bg-white/10 border border-black/5">
            {count}
          </span>
          {isOpen ? (
            <ChevronUp className="h-4 w-4 opacity-50" />
          ) : (
            <ChevronDown className="h-4 w-4 opacity-50" />
          )}
        </div>
      </button>

      {isOpen && (
        <div className="p-4 space-y-4 bg-neutral-50/50 dark:bg-neutral-900/50 border-t">
          {findings.map((finding) => (
            <div
              key={finding.id}
              className={`bg-white dark:bg-neutral-900 p-4 rounded-lg border-l-4 shadow-sm ${borderClass}`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-base">{finding.title}</h4>
                    <span className="text-xs px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                      {finding.id}
                    </span>
                    {finding.category && (
                      <span className="text-xs px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                        {finding.category}
                      </span>
                    )}
                  </div>
                  {finding.status && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        finding.status === "Fixed"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : finding.status === "Mitigated"
                          ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                          : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
                      }`}
                    >
                      {finding.status}
                    </span>
                  )}
                </div>
                <div className="text-right ml-4">
                  <span className="text-xs font-mono opacity-60 block bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded">
                    {finding.codeChanges.function || "global"}:
                    {finding.codeChanges.startLine}
                    {finding.codeChanges.endLine !==
                      finding.codeChanges.startLine &&
                      `-${finding.codeChanges.endLine}`}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <h5
                    className={`text-xs font-bold uppercase mb-1 ${colorClass} opacity-80`}
                  >
                    Description
                  </h5>
                  <p className="text-sm opacity-90">{finding.description}</p>
                </div>

                {finding.impact && (
                  <div>
                    <h5
                      className={`text-xs font-bold uppercase mb-1 ${colorClass} opacity-80`}
                    >
                      Impact
                    </h5>
                    <p className="text-sm opacity-90">{finding.impact}</p>
                  </div>
                )}

                {finding.exploitScenario && (
                  <div className="border-l-2 border-blue-400 pl-3 py-1 my-2">
                    <h5 className="text-xs font-bold uppercase mb-1 text-blue-600">
                      Exploit Scenario
                    </h5>
                    <p className="text-sm opacity-90 text-neutral-600 dark:text-neutral-400">
                      {finding.exploitScenario}
                    </p>
                  </div>
                )}

                {finding.codeChanges.vulnerableCode && (
                  <div>
                    <h5 className="text-xs font-bold uppercase mb-1 text-red-600 opacity-80">
                      Affected Code
                    </h5>
                    <div className="bg-neutral-100 dark:bg-neutral-950 p-3 rounded border border-red-100 dark:border-red-900/30">
                      {finding.codeChanges.function && (
                        <div className="text-xs font-mono text-neutral-500 mb-1">
                          function {finding.codeChanges.function}() &#123;
                        </div>
                      )}
                      <code className="text-sm font-mono block whitespace-pre-wrap text-red-700 dark:text-red-400">
                        {finding.codeChanges.vulnerableCode}
                      </code>
                      {finding.codeChanges.function && (
                        <div className="text-xs font-mono text-neutral-500 mt-1">
                          &#125;
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {finding.codeChanges?.fixedCode && (
                  <div>
                    <h5 className="text-xs font-bold uppercase mb-1 text-green-600 opacity-80">
                      Fixed Code
                    </h5>
                    <div className="bg-neutral-50 dark:bg-neutral-950 p-3 rounded border border-green-100 dark:border-green-900/30">
                      <code className="text-sm font-mono block whitespace-pre-wrap text-green-700 dark:text-green-400">
                        {finding.codeChanges.fixedCode}
                      </code>
                    </div>
                    {finding.codeChanges.changeDescription && (
                      <div className="text-xs text-neutral-600 dark:text-neutral-400 italic mt-2">
                        {finding.codeChanges.changeDescription}
                      </div>
                    )}
                  </div>
                )}

                {finding.references && finding.references.length > 0 && (
                  <div>
                    <h5 className="text-xs font-bold uppercase mb-1 text-neutral-600 opacity-80">
                      References
                    </h5>
                    <ul className="text-xs space-y-1">
                      {finding.references.map((ref, idx) => (
                        <li key={idx} className="text-blue-600 dark:text-blue-400">
                          <a
                            href={ref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline"
                          >
                            {ref}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {finding.cwe && (
                  <div className="text-xs text-neutral-500">
                    <span className="font-semibold">CWE:</span> {finding.cwe}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
