"use client";

import { Sparkles, ArrowRight, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AnalysisChat() {
  return (
    <div className="w-full my-8">
      {/* Gradient Background Glow */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl opacity-10 blur transition duration-500 group-hover:opacity-30"></div>
        
        {/* Main Card */}
        <div className="relative rounded-xl bg-white dark:bg-neutral-950 p-1 shadow-[0_2px_8px_rgba(0,0,0,0.04)] ring-1 ring-black/5">
            <div className="flex items-center gap-3 p-3 bg-neutral-50/50 dark:bg-neutral-900/50 rounded-lg border border-neutral-100 dark:border-neutral-800 focus-within:ring-2 focus-within:ring-indigo-500/30 transition-all">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 shadow-sm">
                    <Sparkles className="h-4 w-4" />
                </div>
                
                <input 
                    type="text" 
                    placeholder="Ask Audie to explain a vulnerability or suggest a fix..."
                    className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-neutral-400 text-neutral-900 dark:text-neutral-100 font-medium"
                />
                
                <Button 
                    size="sm" 
                    className="h-8 px-3 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm rounded-md transition-all"
                >
                    <ArrowRight className="h-4 w-4" />
                </Button>
            </div>

            <div className="px-3 py-2 flex justify-between items-center">
                <div className="flex gap-2">
                    <button className="text-[10px] px-2 py-1 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors font-medium border border-transparent hover:border-neutral-200 dark:hover:border-neutral-700">
                        How do I fix the reentrancy?
                    </button>
                    <button className="text-[10px] px-2 py-1 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors font-medium border border-transparent hover:border-neutral-200 dark:hover:border-neutral-700">
                        Explain the impact
                    </button>
                </div>

                <div className="flex items-center gap-2 text-xs text-neutral-400">
                    <span className="opacity-70">Powered by</span>
                    <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-bold">
                        <Bot className="h-3.5 w-3.5" />
                        <span>Audie AI</span>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
