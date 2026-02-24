"use client";

import {
  AlertOctagon,
  ShieldAlert,
  AlertTriangle,
  Info,
  CheckCircle,
  Bug,
  ArrowRight,
  Wand2,
  Shield,
  Award,
  FileCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SeveritySection } from "@/components/severity-section";
import type { AnalysisResult } from "@/types/analysis";
import {
  getScoreGradientClass,
  getGradeGradientClass,
  getGradeLabel,
} from "@/lib/utils/severity";

interface AnalysisResultsProps {
  result: AnalysisResult;
  currentCode: string;
  isHacking: boolean;
  hackerResult: boolean;
  onActivateHackerMode: () => void;
}

export function AnalysisResults({
  result,
  currentCode,
  isHacking,
  hackerResult,
  onActivateHackerMode,
}: AnalysisResultsProps) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-top-4">
      {/* 1. Executive Summary, Score & Grade */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-blue-900/20 rounded-2xl -z-10" />

        <div className="grid gap-6 lg:grid-cols-12 p-6">
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
                <FileCheck className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-xl text-neutral-900 dark:text-neutral-100">
                Executive Summary
              </h3>
            </div>
            <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm rounded-xl p-5 border border-neutral-200/50 dark:border-neutral-800/50 shadow-sm">
              <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-line text-sm">
                {result.executiveSummary}
              </p>
            </div>
          </div>

          <div className="lg:col-span-5 grid grid-cols-2 gap-4">
            {/* Security Score Card */}
            <ScoreCard
              icon={Shield}
              value={result.securityScore}
              label="Security Score"
              sublabel="out of 100"
              gradientClass={getScoreGradientClass(result.securityScore)}
            />
            {/* Grade Card */}
            <ScoreCard
              icon={Award}
              value={result.grade}
              label="Grade"
              sublabel={getGradeLabel(result.grade)}
              gradientClass={getGradeGradientClass(result.grade)}
            />
          </div>
        </div>
      </div>

      {/* 2. Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard value={result.findingsSummary.critical} label="Critical" colorClass="text-red-600 dark:text-red-400"     bgClass="bg-red-50/50 dark:bg-red-900/20"     borderClass="border-red-100 dark:border-red-900/50" />
        <StatCard value={result.findingsSummary.high}     label="High"     colorClass="text-orange-600 dark:text-orange-400" bgClass="bg-orange-50/50 dark:bg-orange-900/20" borderClass="border-orange-100 dark:border-orange-900/50" />
        <StatCard value={result.findingsSummary.medium}   label="Medium"   colorClass="text-yellow-600 dark:text-yellow-400" bgClass="bg-yellow-50/50 dark:bg-yellow-900/20" borderClass="border-yellow-100 dark:border-yellow-900/50" />
        <StatCard value={result.findingsSummary.low}      label="Low"      colorClass="text-blue-600 dark:text-blue-400"   bgClass="bg-blue-50/50 dark:bg-blue-900/20"   borderClass="border-blue-100 dark:border-blue-900/50" />
        <StatCard value={result.findingsSummary.informational} label="Info" colorClass="text-neutral-600 dark:text-neutral-400" bgClass="bg-neutral-50/50 dark:bg-neutral-900/20" borderClass="border-neutral-100 dark:border-neutral-900/50" />
      </div>

      {/* Hacker Mode Promo */}
      {!isHacking && !hackerResult && (
        <div className="p-6 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-2 border-purple-200 dark:border-purple-800 rounded-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-purple-900 dark:text-purple-100 mb-2 flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                Hacker Mode (Premium Audit)
              </h3>
              <p className="text-sm text-purple-700 dark:text-purple-300">
                Activate our AI-powered adversarial analysis to discover novel
                attack vectors that static analysis might miss.
              </p>
            </div>
            <Button
              onClick={onActivateHackerMode}
              size="lg"
              className="bg-purple-600 hover:bg-purple-700 text-white whitespace-nowrap"
            >
              <ShieldAlert className="mr-2 h-4 w-4" /> Activate Hacker Mode
            </Button>
          </div>
        </div>
      )}

      {/* 3. Security Findings */}
      <div>
        <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
          <Bug className="h-5 w-5" />
          Security Findings
        </h3>

        {result.findings.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed border-green-200 rounded-xl bg-green-50/50">
            <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-3" />
            <h4 className="font-bold text-green-800 text-lg">All Clear!</h4>
            <p className="text-green-700">
              No known vulnerabilities detected in your code.
            </p>
          </div>
        ) : (
          <>
            <SeveritySection severity="CRITICAL"      count={result.findingsSummary.critical}      findings={result.findings.filter((f) => f.severity === "CRITICAL")}      icon={AlertOctagon}  colorClass="text-red-600"     bgClass="bg-red-50/50 dark:bg-red-900/20"      borderClass="border-l-red-500"     originalCode={currentCode} />
            <SeveritySection severity="HIGH"          count={result.findingsSummary.high}          findings={result.findings.filter((f) => f.severity === "HIGH")}          icon={ShieldAlert}   colorClass="text-orange-600"  bgClass="bg-orange-50/50 dark:bg-orange-900/20" borderClass="border-l-orange-500"  originalCode={currentCode} />
            <SeveritySection severity="MEDIUM"        count={result.findingsSummary.medium}        findings={result.findings.filter((f) => f.severity === "MEDIUM")}        icon={AlertTriangle} colorClass="text-yellow-600"  bgClass="bg-yellow-50/50 dark:bg-yellow-900/20" borderClass="border-l-yellow-500"  originalCode={currentCode} />
            <SeveritySection severity="LOW"           count={result.findingsSummary.low}           findings={result.findings.filter((f) => f.severity === "LOW")}           icon={Info}          colorClass="text-blue-600"    bgClass="bg-blue-50/50 dark:bg-blue-900/20"    borderClass="border-l-blue-500"    originalCode={currentCode} />
            <SeveritySection severity="INFORMATIONAL" count={result.findingsSummary.informational} findings={result.findings.filter((f) => f.severity === "INFORMATIONAL")} icon={Info}          colorClass="text-neutral-600" bgClass="bg-neutral-50/50 dark:bg-neutral-900/20" borderClass="border-l-neutral-500" originalCode={currentCode} />
          </>
        )}
      </div>

      {/* 4. Recommendations */}
      {result.recommendations && result.recommendations.length > 0 && (
        <div>
          <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
            <ShieldAlert className="h-5 w-5" />
            Recommendations
          </h3>
          <div className="space-y-3">
            {result.recommendations.map((rec, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-lg border-l-4 ${
                  rec.priority === "High"
                    ? "bg-red-50/50 dark:bg-red-900/20 border-red-500"
                    : rec.priority === "Medium"
                    ? "bg-yellow-50/50 dark:bg-yellow-900/20 border-yellow-500"
                    : "bg-blue-50/50 dark:bg-blue-900/20 border-blue-500"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-bold text-base">
                    {rec.title || "Recommendation"}
                  </h4>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      rec.priority === "High"
                        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        : rec.priority === "Medium"
                        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                        : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    }`}
                  >
                    {rec.priority} Priority
                  </span>
                </div>
                <p className="text-sm opacity-90 mb-2">{rec.description}</p>
                {rec.rationale && (
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 italic">
                    {rec.rationale}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Gas Optimizations */}
      {result.gasOptimizations && result.gasOptimizations.length > 0 && (
        <div>
          <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            Gas Optimizations
          </h3>
          <div className="space-y-3">
            {result.gasOptimizations.map((opt, idx) => (
              <div
                key={idx}
                className="p-4 rounded-lg border bg-neutral-50/50 dark:bg-neutral-900/20"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-bold text-base">{opt.location}</h4>
                  <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    {opt.estimatedGasSavings ?? opt.estimatedSavings ?? "N/A"}
                  </span>
                </div>
                <p className="text-sm opacity-90">{opt.description}</p>
                {opt.currentApproach && opt.optimizedApproach && (
                  <div className="space-y-2 mt-2">
                    <div>
                      <div className="text-xs font-bold uppercase mb-1 text-red-600 opacity-80">
                        Current Approach
                      </div>
                      <code className="text-sm font-mono block whitespace-pre-wrap bg-neutral-100 dark:bg-neutral-950 p-2 rounded">
                        {opt.currentApproach}
                      </code>
                    </div>
                    <div>
                      <div className="text-xs font-bold uppercase mb-1 text-green-600 opacity-80">
                        Optimized Approach
                      </div>
                      <code className="text-sm font-mono block whitespace-pre-wrap bg-neutral-100 dark:bg-neutral-950 p-2 rounded">
                        {opt.optimizedApproach}
                      </code>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. Code Quality Observations */}
      {result.codeQualityObservations &&
        result.codeQualityObservations.length > 0 && (
          <div>
            <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
              <Info className="h-5 w-5" />
              Code Quality Observations
            </h3>
            <ul className="space-y-2 list-disc list-inside">
              {result.codeQualityObservations.map((obs, idx) => {
                const description =
                  typeof obs === "string" ? obs : obs.description;
                return (
                  <li
                    key={idx}
                    className="text-sm text-neutral-600 dark:text-neutral-400"
                  >
                    {description}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

      {/* 7. Positive Findings */}
      {result.positiveFindings && result.positiveFindings.length > 0 && (
        <div>
          <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Positive Findings
          </h3>
          <div className="p-4 rounded-lg border border-green-200 bg-green-50/50 dark:bg-green-900/20">
            <ul className="space-y-2 list-disc list-inside">
              {result.positiveFindings.map((finding, idx) => {
                const description =
                  typeof finding === "string" ? finding : finding.description;
                const aspect =
                  typeof finding === "string" ? undefined : finding.aspect;
                return (
                  <li
                    key={idx}
                    className="text-sm text-green-700 dark:text-green-400"
                  >
                    {aspect && (
                      <span className="font-semibold">{aspect}: </span>
                    )}
                    {description}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}

      {/* 8. Next Steps */}
      {result.nextSteps && (
        <div>
          <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
            <ArrowRight className="h-5 w-5" />
            Next Steps
          </h3>
          <div className="p-4 rounded-lg border bg-blue-50/50 dark:bg-blue-900/20">
            <p className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-line">
              {result.nextSteps}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Internal sub-components ──────────────────────────────────────────────────

interface ScoreCardProps {
  icon: React.ComponentType<{ className?: string }>;
  value: string | number;
  label: string;
  sublabel: string;
  gradientClass: string;
}

function ScoreCard({
  icon: Icon,
  value,
  label,
  sublabel,
  gradientClass,
}: ScoreCardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border-2 shadow-lg transition-all hover:scale-105 ${gradientClass}`}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12" />
      <div className="relative p-6 flex flex-col items-center justify-center h-full">
        <div className="mb-2 p-2 rounded-full bg-white/20 backdrop-blur-sm">
          <Icon className="h-6 w-6" />
        </div>
        <div className="text-6xl font-black tracking-tight mb-1 drop-shadow-lg">
          {value}
        </div>
        <div className="text-xs font-semibold uppercase tracking-widest opacity-90">
          {label}
        </div>
        <div className="mt-3 text-xs opacity-75">{sublabel}</div>
      </div>
    </div>
  );
}

interface StatCardProps {
  value: number;
  label: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
}

function StatCard({
  value,
  label,
  colorClass,
  bgClass,
  borderClass,
}: StatCardProps) {
  return (
    <div
      className={`p-4 ${bgClass} border ${borderClass} rounded-lg flex flex-col items-center justify-center`}
    >
      <span className={`${colorClass} font-bold text-3xl`}>{value}</span>
      <span
        className={`text-xs ${colorClass.replace("600", "600/80").replace("400", "400/80")} uppercase font-bold tracking-wider mt-1`}
      >
        {label}
      </span>
    </div>
  );
}
