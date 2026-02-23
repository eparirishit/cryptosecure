"use client";

import { HackerModeResult, ExploitAttempt, AttackSurface } from "@/types/analysis";
import { 
  Shield, 
  Bug,
  ChevronDown,
  ChevronUp,
  Target,
  ShieldAlert,
  Award
} from "lucide-react";
import { useState } from "react";

interface HackerModeResultsProps {
  result: HackerModeResult;
}

export function HackerModeResults({ result }: HackerModeResultsProps) {
  const [expandedExploits, setExpandedExploits] = useState<Set<string>>(new Set());
  const [expandedSurfaces, setExpandedSurfaces] = useState<Set<string>>(new Set());

  const toggleExploit = (id: string) => {
    const newSet = new Set(expandedExploits);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedExploits(newSet);
  };

  const toggleSurface = (id: string) => {
    const newSet = new Set(expandedSurfaces);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedSurfaces(newSet);
  };

  const plausibleExploits = result.exploits.filter(e => e.status === "plausible");
  const theoreticalExploits = result.exploits.filter(e => e.status === "theoretical");
  const notApplicableExploits = result.exploits.filter(e => e.status === "not-applicable");

  // Mapping Risk Level to Grade-like visual styles
  const getRiskLevelStyles = (risk: string) => {
    switch (risk) {
      case "Critical":
        return "bg-gradient-to-br from-red-600 to-red-800 border-red-500 text-white";
      case "High":
        return "bg-gradient-to-br from-orange-500 to-red-500 border-orange-400 text-white";
      case "Medium":
        return "bg-gradient-to-br from-yellow-400 to-amber-500 border-yellow-300 text-white";
      case "Low":
        return "bg-gradient-to-br from-green-500 to-emerald-600 border-green-400 text-white";
      default:
        return "bg-gradient-to-br from-blue-500 to-blue-600 border-blue-400 text-white";
    }
  };
  
  // Mapping Resilience Score to color
  const getScoreStyles = (score: number) => {
      if (score >= 90) return "bg-gradient-to-br from-green-500 to-emerald-600 border-green-400 text-white";
      if (score >= 75) return "bg-gradient-to-br from-yellow-400 to-amber-500 border-yellow-300 text-white";
      if (score >= 60) return "bg-gradient-to-br from-orange-500 to-red-500 border-orange-400 text-white";
      if (score >= 40) return "bg-gradient-to-br from-red-500 to-rose-600 border-red-400 text-white";
      return "bg-gradient-to-br from-red-600 to-red-800 border-red-500 text-white";
  };

  // Severity colors matching Standard Audit
  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case "Critical": return { text: "text-red-600", border: "border-l-red-500", bg: "bg-red-50" };
      case "High": return { text: "text-orange-600", border: "border-l-orange-500", bg: "bg-orange-50" };
      case "Medium": return { text: "text-yellow-600", border: "border-l-yellow-500", bg: "bg-yellow-50" };
      case "Low": return { text: "text-blue-600", border: "border-l-blue-500", bg: "bg-blue-50" };
      default: return { text: "text-neutral-600", border: "border-l-neutral-500", bg: "bg-neutral-50" };
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "plausible":
        return <span className="px-2 py-0.5 text-xs font-medium rounded bg-red-100 text-red-800 border border-red-200">PLAUSIBLE</span>;
      case "theoretical":
        return <span className="px-2 py-0.5 text-xs font-medium rounded bg-yellow-100 text-yellow-800 border border-yellow-200">THEORETICAL</span>;
      case "not-applicable":
        return <span className="px-2 py-0.5 text-xs font-medium rounded bg-neutral-100 text-neutral-600 border border-neutral-200">NOT APPLICABLE</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-top-4">
      {/* Executive Summary, Score & Risk Level */}
      <div className="relative">
         {/* Background gradient overlay */}
         <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 dark:from-purple-950/20 dark:via-indigo-950/20 dark:to-blue-900/20 rounded-2xl -z-10"></div>

         <div className="grid gap-6 lg:grid-cols-12 p-6">
          {/* Summary */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-700 text-white shadow-lg">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-xl text-neutral-900 dark:text-neutral-100">Hacker Assessment</h3>
            </div>
            <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm rounded-xl p-5 border border-neutral-200/50 dark:border-neutral-800/50 shadow-sm flex-1">
              <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed text-sm">
                {result.summary}
              </p>
            </div>
          </div>

           {/* Score & Risk Cards */}
           <div className="lg:col-span-5 grid grid-cols-2 gap-4 h-full">
             {/* Resilience Score Card */}
             <div className={`relative overflow-hidden rounded-2xl border-2 shadow-lg transition-all hover:scale-105 h-full ${getScoreStyles(result.hackerResilienceScore)}`}>
               {/* Decorative pattern */}
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
               <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
               
               <div className="relative p-6 flex flex-col items-center justify-center h-full">
                 <div className="mb-2 p-2 rounded-full bg-white/20 backdrop-blur-sm">
                   <Shield className="h-6 w-6" />
                 </div>
                 <div className="text-6xl font-black tracking-tight mb-1 drop-shadow-lg">
                   {result.hackerResilienceScore}
                 </div>
                 <div className="text-xs font-semibold uppercase tracking-widest opacity-90 text-center">
                   Resilience Score
                 </div>
               </div>
             </div>

             {/* Risk Level Card (Grade Equivalent) */}
             <div className={`relative overflow-hidden rounded-2xl border-2 shadow-lg transition-all hover:scale-105 h-full ${getRiskLevelStyles(result.riskLevel)}`}>
               {/* Decorative pattern */}
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
               <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
               
               <div className="relative p-6 flex flex-col items-center justify-center h-full">
                 <div className="mb-2 p-2 rounded-full bg-white/20 backdrop-blur-sm">
                   <Award className="h-6 w-6" />
                 </div>
                 <div className="text-3xl font-black tracking-tight mb-1 drop-shadow-lg text-center">
                   {result.riskLevel}
                 </div>
                 <div className="text-xs font-semibold uppercase tracking-widest opacity-90 text-center">
                   Risk Level
                 </div>
               </div>
             </div>
           </div>
         </div>
      </div>

      {/* Attack Surface Map */}
      {result.attackSurface.length > 0 && (
        <div className="mb-8">
          <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
            <Target className="h-5 w-5" />
            Attack Surface Map
          </h3>
          
          <div className="space-y-3">
            {result.attackSurface.map((surface) => {
              const isExpanded = expandedSurfaces.has(surface.id);
              return (
                <div key={surface.id} className="bg-white dark:bg-neutral-900 p-4 rounded-lg border-l-4 shadow-sm border-l-blue-500">
                  <div className="flex justify-between items-start cursor-pointer" onClick={() => toggleSurface(surface.id)}>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-base">{surface.entryPoint}</h4>
                            <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                                {surface.riskFactors.length} Risk Factors
                            </span>
                        </div>
                        {surface.lineNumber && (
                            <span className="text-xs font-mono opacity-60 block bg-neutral-100 px-2 py-1 rounded w-fit">
                                Line {surface.lineNumber}
                            </span>
                        )}
                    </div>
                    <div>
                        {isExpanded ? <ChevronUp className="h-4 w-4 opacity-50"/> : <ChevronDown className="h-4 w-4 opacity-50"/>}
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div className="mt-4 space-y-3 pt-3 border-t border-neutral-100">
                        <div>
                            <h5 className="text-xs font-bold uppercase mb-1 text-blue-600 opacity-80">Risk Factors</h5>
                            <ul className="list-disc list-inside space-y-1 text-sm opacity-90">
                                {surface.riskFactors.map((factor, idx) => (
                                    <li key={idx}>{factor}</li>
                                ))}
                            </ul>
                        </div>
                        {surface.notes && (
                            <div>
                                <h5 className="text-xs font-bold uppercase mb-1 text-neutral-600 opacity-80">Notes</h5>
                                <p className="text-sm opacity-90">{surface.notes}</p>
                            </div>
                        )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Exploit Attempts */}
      <div>
        <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
          <Bug className="h-5 w-5" />
          Exploit Attempts
        </h3>
        
        <div className="space-y-4">
          {result.exploits.length === 0 ? (
            <div className="p-8 text-center border-2 border-dashed border-green-200 rounded-xl bg-green-50/50">
              <Bug className="h-10 w-10 text-green-500 mx-auto mb-3" />
              <h4 className="font-bold text-green-800 text-lg">No Exploits Found</h4>
              <p className="text-green-700">The AI agent did not identify any exploit attempts for this contract.</p>
            </div>
          ) : (
            <>
            {/* Plausible Exploits First */}
            {plausibleExploits.map((exploit) => {
              const isExpanded = expandedExploits.has(exploit.id);
              const recommendation = result.recommendations.find(r => r.exploitId === exploit.id);
              const styles = getSeverityStyles(exploit.severity);
              
              return (
                <div key={exploit.id} className={`bg-white dark:bg-neutral-900 p-4 rounded-lg border-l-4 shadow-sm ${styles.border}`}>
                  <div className="flex justify-between items-start cursor-pointer" onClick={() => toggleExploit(exploit.id)}>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-base">{exploit.title}</h4>
                        {getStatusBadge(exploit.status)}
                        <span className={`text-xs px-2 py-0.5 rounded ${
                            exploit.severity === "Critical" ? "bg-red-100 text-red-700" :
                            exploit.severity === "High" ? "bg-orange-100 text-orange-700" :
                            "bg-yellow-100 text-yellow-700"
                        }`}>
                          {exploit.severity}
                        </span>
                      </div>
                      <div className="text-sm text-neutral-600">
                          Type: {exploit.type} • Likelihood: {exploit.likelihood}
                      </div>
                    </div>
                    <div>
                        {isExpanded ? <ChevronUp className="h-4 w-4 opacity-50"/> : <ChevronDown className="h-4 w-4 opacity-50"/>}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 space-y-3 pt-3 border-t border-neutral-100">
                      <div>
                        <h5 className={`text-xs font-bold uppercase mb-1 ${styles.text} opacity-80`}>Prerequisites</h5>
                        <p className="text-sm opacity-90">{exploit.prerequisites || "None specified"}</p>
                      </div>
                      
                      <div>
                        <h5 className={`text-xs font-bold uppercase mb-1 ${styles.text} opacity-80`}>Expected Impact</h5>
                        <p className="text-sm opacity-90">{exploit.expectedImpact || "Not specified"}</p>
                      </div>

                      {exploit.exploitCode && (
                        <div>
                          <h5 className="text-xs font-bold uppercase mb-1 text-red-600 opacity-80 flex items-center gap-2">
                            Exploit Code
                            <span className="ml-auto text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded">
                              EDUCATIONAL ONLY
                            </span>
                          </h5>
                          <div className="bg-neutral-950 p-3 rounded border border-neutral-800 overflow-x-auto">
                            <code className="text-sm font-mono block whitespace-pre-wrap text-green-400">
                                {exploit.exploitCode}
                            </code>
                          </div>
                        </div>
                      )}

                      {exploit.tonSpecificNotes && (
                        <div>
                          <h5 className="text-xs font-bold uppercase mb-1 text-neutral-600 opacity-80">TON-Specific Notes</h5>
                          <p className="text-sm opacity-90">{exploit.tonSpecificNotes}</p>
                        </div>
                      )}

                      {recommendation && (
                        <div className="mt-2 pt-2">
                          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded border border-green-100 dark:border-green-900/30">
                             <h5 className="text-xs font-bold uppercase mb-1 text-green-700 flex items-center gap-2">
                                <Shield className="h-3 w-3" />
                                Defense Recommendation
                             </h5>
                             <p className="text-sm text-green-800 mb-2">{recommendation.mitigation}</p>
                             {recommendation.codeExample && (
                                <div className="mt-2">
                                    <div className="text-xs font-mono text-green-800 mb-1 opacity-70">Code Example:</div>
                                    <code className="text-xs font-mono block whitespace-pre-wrap bg-white/50 p-2 rounded text-green-900 border border-green-200">
                                        {recommendation.codeExample}
                                    </code>
                                </div>
                             )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Theoretical Exploits */}
            {theoreticalExploits.map((exploit) => {
              const isExpanded = expandedExploits.has(exploit.id);
              const styles = { text: "text-yellow-600", border: "border-l-yellow-500" };
              
              return (
                <div key={exploit.id} className={`bg-white dark:bg-neutral-900 p-4 rounded-lg border-l-4 shadow-sm ${styles.border}`}>
                  <div className="flex justify-between items-start cursor-pointer" onClick={() => toggleExploit(exploit.id)}>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-base">{exploit.title}</h4>
                        {getStatusBadge(exploit.status)}
                      </div>
                      <div className="text-sm text-neutral-600">
                          Type: {exploit.type} • Likelihood: {exploit.likelihood}
                      </div>
                    </div>
                    <div>
                        {isExpanded ? <ChevronUp className="h-4 w-4 opacity-50"/> : <ChevronDown className="h-4 w-4 opacity-50"/>}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 space-y-3 pt-3 border-t border-neutral-100">
                      <div>
                        <h5 className={`text-xs font-bold uppercase mb-1 ${styles.text} opacity-80`}>Prerequisites</h5>
                        <p className="text-sm opacity-90">{exploit.prerequisites || "None specified"}</p>
                      </div>
                      
                      <div>
                        <h5 className={`text-xs font-bold uppercase mb-1 ${styles.text} opacity-80`}>Expected Impact</h5>
                        <p className="text-sm opacity-90">{exploit.expectedImpact || "Not specified"}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
