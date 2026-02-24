"use client";

import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import Link from "next/link";
import { MissionControl } from "@/components/mission-control";

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
