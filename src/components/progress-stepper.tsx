"use client";

import { CheckCircle, Loader2 } from "lucide-react";

interface Step {
  title: string;
  description?: string;
}

interface ProgressStepperProps {
  steps: readonly Step[];
  currentStep: number;
  title: string;
  subtitle?: string;
}

export function ProgressStepper({
  steps,
  currentStep,
  title,
  subtitle,
}: ProgressStepperProps) {
  return (
    <div className="border-2 border-dashed border-blue-300 rounded-lg p-8 bg-neutral-50 h-[300px] flex items-center justify-center">
      <div className="w-full max-w-xl space-y-6">
        <div>
          <h3 className="text-xl font-semibold text-neutral-900 mb-1">{title}</h3>
          {subtitle && (
            <p className="text-sm text-neutral-600">{subtitle}</p>
          )}
        </div>

        <div className="space-y-0">
          {steps.map((step, index) => {
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            const isLast = index === steps.length - 1;

            return (
              <div key={index} className="flex items-start gap-3">
                <div className="flex flex-col items-center flex-shrink-0">
                  {isCompleted ? (
                    <div className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center shadow-sm">
                      <CheckCircle className="h-3.5 w-3.5 text-white" />
                    </div>
                  ) : isActive ? (
                    <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center shadow-sm">
                      <Loader2 className="h-3.5 w-3.5 text-white animate-spin" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-neutral-300 bg-white" />
                  )}
                  {!isLast && (
                    <div
                      className={`w-0.5 h-6 mt-1.5 ${
                        isCompleted ? "bg-green-600" : "bg-neutral-200"
                      }`}
                    />
                  )}
                </div>

                <div className="flex-1 min-w-0 pb-1">
                  <p
                    className={`text-sm font-medium leading-tight ${
                      isActive
                        ? "text-blue-700"
                        : isCompleted
                        ? "text-green-700"
                        : "text-neutral-400"
                    }`}
                  >
                    {step.title}
                  </p>
                  {step.description && isActive && (
                    <p className="text-xs text-neutral-500 mt-0.5 leading-tight">
                      {step.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
