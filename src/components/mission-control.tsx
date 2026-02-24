"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, Zap, CheckCircle, Activity } from "lucide-react";

type CheckStatus = "ok" | "fail" | "fixing";

interface Check {
  name: string;
  status: CheckStatus;
}

export function MissionControl() {
  const [score, setScore] = useState(100);
  const [checks, setChecks] = useState<Check[]>([
    { name: "Re-entrancy", status: "ok" },
    { name: "Access Control", status: "ok" },
    { name: "Integer Overflow", status: "ok" },
    { name: "Gas Limit", status: "ok" },
  ]);

  useEffect(() => {
    let cancelled = false;

    const cycle = async () => {
      if (cancelled) return;
      setScore(100);
      setChecks((c) => c.map((x) => ({ ...x, status: "ok" as CheckStatus })));
      await new Promise((r) => setTimeout(r, 2000));
      if (cancelled) return;
      setScore(45);
      setChecks((c) =>
        c.map((x) =>
          x.name === "Access Control" ? { ...x, status: "fail" as CheckStatus } : x
        )
      );
      await new Promise((r) => setTimeout(r, 2000));
      if (cancelled) return;
      setChecks((c) =>
        c.map((x) =>
          x.name === "Access Control"
            ? { ...x, status: "fixing" as CheckStatus }
            : x
        )
      );
      await new Promise((r) => setTimeout(r, 1000));
      if (!cancelled) cycle();
    };

    cycle();
    return () => {
      cancelled = true;
    };
  }, []);

  const isFixing = checks.some((c) => c.status === "fixing");

  return (
    <div className="w-full max-w-lg mx-auto bg-neutral-900/95 backdrop-blur-xl rounded-2xl shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden border border-white/10 flex flex-col relative z-10 transform hover:scale-[1.02] transition-transform duration-500">
      {/* Header */}
      <div className="bg-white/5 px-4 py-3 border-b border-white/5 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="absolute inset-0 bg-green-500 blur-[4px] opacity-50 animate-pulse" />
            <Activity className="h-4 w-4 text-green-400 relative z-10" />
          </div>
          <span className="text-xs font-mono text-green-400 tracking-wider">
            SYSTEM_ACTIVE
          </span>
        </div>
        <div className="text-xs font-mono text-neutral-500">
          Target: wallet.fc
        </div>
      </div>

      {/* Body */}
      <div className="flex h-[380px]">
        {/* Code panel */}
        <div className="flex-1 bg-[#0d1117]/50 p-5 font-mono text-xs text-neutral-400 border-r border-white/5 overflow-hidden relative">
          <div
            className="absolute left-0 top-10 w-full h-8 bg-gradient-to-r from-red-500/20 to-transparent border-l-2 border-red-500 transition-opacity duration-300"
            style={{ opacity: score < 50 ? 1 : 0 }}
          />
          <div className="space-y-2 leading-relaxed">
            <div className="text-neutral-600 italic">;; Analyzing Smart Contract...</div>
            <div>
              <span className="text-purple-400">()</span>{" "}
              <span className="text-blue-400">recv_internal</span>(...){" "}
              <span className="text-purple-400">impure</span> &#123;
            </div>
            <div className="pl-4 text-neutral-300">
              int op = in_msg_body~
              <span className="text-yellow-300">load_uint</span>(32);
            </div>
            <div className="pl-4 text-purple-300">if (op == 1) &#123;</div>
            <div className="pl-8 text-white bg-white/5 rounded px-1">
              send_raw_message(msg, 128);
            </div>
            <div className="pl-4">&#125;</div>
            <div>&#125;</div>
          </div>
          {isFixing && (
            <div className="absolute inset-0 bg-green-900/20 flex items-center justify-center backdrop-blur-[2px]">
              <div className="bg-green-500 text-black px-4 py-2 rounded-full text-xs font-bold animate-bounce shadow-[0_0_20px_rgba(34,197,94,0.5)]">
                Applying Auto-Patch...
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-56 bg-black/20 p-5 flex flex-col gap-6">
          <div className="text-center p-4 bg-white/5 rounded-xl border border-white/5 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="text-[10px] text-neutral-400 mb-1 uppercase tracking-widest font-semibold">
              Security Score
            </div>
            <div
              className={`text-4xl font-black tracking-tighter transition-all duration-500 ${
                score > 80
                  ? "text-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.5)]"
                  : "text-red-400 drop-shadow-[0_0_10px_rgba(248,113,113,0.5)]"
              }`}
            >
              {score}
            </div>
          </div>

          <div className="flex-1 space-y-2.5">
            {checks.map((check, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-[11px] p-2.5 rounded-lg bg-white/5 border border-white/5 transition-colors"
              >
                <span className="text-neutral-300 font-medium">{check.name}</span>
                {check.status === "ok" && (
                  <CheckCircle className="h-3.5 w-3.5 text-green-400" />
                )}
                {check.status === "fail" && (
                  <AlertTriangle className="h-3.5 w-3.5 text-red-400 animate-pulse" />
                )}
                {check.status === "fixing" && (
                  <Zap className="h-3.5 w-3.5 text-yellow-400 animate-spin" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
