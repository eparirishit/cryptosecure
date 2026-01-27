"use client";

import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  Zap,
  CheckCircle,
  Activity,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

// Mission Control Component
const MissionControl = () => {
  const [score, setScore] = useState(100);
  const [checks, setChecks] = useState([
    { name: "Re-entrancy", status: "ok" },
    { name: "Access Control", status: "ok" },
    { name: "Integer Overflow", status: "ok" },
    { name: "Gas Limit", status: "ok" },
  ]);
  const [scanningLine, setScanningLine] = useState(0);

  useEffect(() => {
    const cycle = async () => {
      setScore(100);
      setChecks((c) => c.map((x) => ({ ...x, status: "ok" })));
      setScanningLine(0);
      await new Promise((r) => setTimeout(r, 2000));
      setScanningLine(1);
      setScore(45);
      setChecks((c) =>
        c.map((x) =>
          x.name === "Access Control" ? { ...x, status: "fail" } : x,
        ),
      );
      await new Promise((r) => setTimeout(r, 2000));
      setChecks((c) =>
        c.map((x) =>
          x.name === "Access Control" ? { ...x, status: "fixing" } : x,
        ),
      );
      await new Promise((r) => setTimeout(r, 1000));
      cycle();
    };
    cycle();
  }, []);

  const [code, setCode] = useState("");
  const [showFix, setShowFix] = useState(false);

  const vulnerableCode = `() recv_internal(int msg_value, cell in_msg_full, slice in_msg_body) impure {
    if (in_msg_body.slice_empty?()) { return (); }
    
    ;; Vulnerable: No access control
    int op = in_msg_body~load_uint(32);
    
    if (op == 1) {
      ;; Withdraw all funds
      send_raw_message(msg, 128);
    }
}`;

  const fixedCode = `() recv_internal(int msg_value, cell in_msg_full, slice in_msg_body) impure {
    if (in_msg_body.slice_empty?()) { return (); }
    
    ;; Fixed: Access control added
    throw_unless(401, equal_slices(sender_address, owner_address));
    int op = in_msg_body~load_uint(32);
    
    if (op == 1) {
      ;; Withdraw all funds
      send_raw_message(msg, 128);
    }
}`;

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setCode(vulnerableCode.substring(0, i));
      i++;
      if (i > vulnerableCode.length) {
        clearInterval(interval);
        setTimeout(() => setShowFix(true), 1000);
      }
    }, 30);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full max-w-lg mx-auto bg-neutral-900/95 backdrop-blur-xl rounded-2xl shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden border border-white/10 flex flex-col relative z-10 transform hover:scale-[1.02] transition-transform duration-500">
      <div className="bg-white/5 px-4 py-3 border-b border-white/5 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="absolute inset-0 bg-green-500 blur-[4px] opacity-50 animate-pulse"></div>
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
      <div className="flex h-[380px]">
        <div className="flex-1 bg-[#0d1117]/50 p-5 font-mono text-xs text-neutral-400 border-r border-white/5 overflow-hidden relative">
          <div
            className="absolute left-0 top-10 w-full h-8 bg-gradient-to-r from-red-500/20 to-transparent border-l-2 border-red-500 transition-opacity duration-300"
            style={{ opacity: score < 50 ? 1 : 0 }}
          ></div>
          <div className="space-y-2 leading-relaxed">
            <div className="text-neutral-600 italic">
              ;; Analyzing Smart Contract...
            </div>
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
          {checks.find((c) => c.status === "fixing") && (
            <div className="absolute inset-0 bg-green-900/20 flex items-center justify-center backdrop-blur-[2px]">
              <div className="bg-green-500 text-black px-4 py-2 rounded-full text-xs font-bold animate-bounce shadow-[0_0_20px_rgba(34,197,94,0.5)]">
                Applying Auto-Patch...
              </div>
            </div>
          )}
        </div>
        <div className="w-56 bg-black/20 p-5 flex flex-col gap-6">
          <div className="text-center p-4 bg-white/5 rounded-xl border border-white/5 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="text-[10px] text-neutral-400 mb-1 uppercase tracking-widest font-semibold">
              Security Score
            </div>
            <div
              className={`text-4xl font-black tracking-tighter transition-all duration-500 ${score > 80 ? "text-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.5)]" : "text-red-400 drop-shadow-[0_0_10px_rgba(248,113,113,0.5)]"}`}
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
                <span className="text-neutral-300 font-medium">
                  {check.name}
                </span>
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
};

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-neutral-900 font-sans selection:bg-blue-100">
      <header className="sticky top-0 z-50 w-full border-b border-neutral-100 bg-white/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Logo />
          <Link href="/auditor">
            <Button className="bg-neutral-900 text-white hover:bg-neutral-800 transition-all hover:scale-105 shadow-lg shadow-neutral-900/20">
              Get Started
            </Button>
          </Link>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="py-24 md:py-32 px-4 border-b border-neutral-100 relative overflow-hidden bg-neutral-50">
          {/* 1. Vignette Overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(255,255,255,0.8)_70%,#ffffff_100%)] z-10 pointer-events-none"></div>

          {/* 2. 3D Grid Floor - High Contrast Slate & Animation */}
          <div className="absolute inset-0 perspective-[1000px] overflow-hidden pointer-events-none">
            <div
              className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] bg-[linear-gradient(to_right,#94a3b8_1px,transparent_1px),linear-gradient(to_bottom,#94a3b8_1px,transparent_1px)] bg-[size:60px_60px] animate-[gridMove_20s_linear_infinite] opacity-40"
              style={{
                transform: "rotateX(60deg)",
                transformOrigin: "center center",
              }}
            ></div>
            {/* Horizon Fade */}
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-white/80"></div>
          </div>

          {/* 3. Floating Particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[20%] left-[10%] w-2 h-2 bg-blue-400/20 rounded-full blur-[1px] animate-float"></div>
            <div className="absolute top-[60%] right-[15%] w-3 h-3 bg-purple-400/20 rounded-full blur-[2px] animate-float-delayed"></div>
            <div className="absolute bottom-[20%] left-[30%] w-1 h-1 bg-blue-600/30 rounded-full animate-float"></div>
          </div>

          <div className="container mx-auto max-w-6xl relative z-20">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="text-left space-y-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-sm font-medium mb-2 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>The Standard for TON Security</span>
                </div>
                <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1] text-neutral-900 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-100">
                  Ship Secure <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                    TON Contracts
                  </span>
                </h1>
                <p className="text-xl text-neutral-600 leading-relaxed max-w-lg animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
                  Secure your TON smart contracts in seconds. Analyze your FunC
                  & Tact code, fix vulnerabilities instantly, and export audit
                  reports.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300">
                  <Link href="/auditor">
                    <Button
                      size="lg"
                      className="h-14 px-8 text-lg bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xl shadow-blue-600/20 transition-all hover:scale-105 hover:shadow-blue-600/40"
                    >
                      Audit My Code Now
                    </Button>
                  </Link>
              </div>

              <div className="relative lg:translate-x-10 animate-in fade-in zoom-in duration-1000 delay-200 perspective-1000">
                <div className="absolute -inset-10 bg-gradient-to-tr from-blue-100 via-indigo-100 to-purple-100 rounded-full blur-3xl opacity-60 -z-10 animate-pulse"></div>
                <div className="transform rotate-y-[-15deg] hover:rotate-0 transition-all duration-700 ease-out preserve-3d">
                  <MissionControl />
                </div>
              </div>
            </div>
          </div>

          <style jsx>{`
            @keyframes gridMove {
              0% {
                transform: rotateX(60deg) translateY(0);
              }
              100% {
                transform: rotateX(60deg) translateY(60px);
              }
            }
            @keyframes float {
              0%,
              100% {
                transform: translateY(0);
              }
              50% {
                transform: translateY(-20px);
              }
            }
            @keyframes float-delayed {
              0%,
              100% {
                transform: translateY(0);
              }
              50% {
                transform: translateY(-15px);
              }
            }
            .animate-float {
              animation: float 6s ease-in-out infinite;
            }
            .animate-float-delayed {
              animation: float-delayed 8s ease-in-out infinite;
            }
            .perspective-1000 {
              perspective: 1000px;
            }
            .preserve-3d {
              transform-style: preserve-3d;
            }
            .rotate-y-\[-15deg\] {
              transform: rotateY(-15deg) rotateX(0deg);
            }
          `}</style>
        </section>
      </main>
    </div>
  );
}
