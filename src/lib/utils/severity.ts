export const SEVERITY_DISPLAY_NAMES: Record<string, string> = {
  CRITICAL:      "Critical",
  HIGH:          "High",
  MEDIUM:        "Medium",
  LOW:           "Low",
  INFORMATIONAL: "Informational",
};

export function getSeverityDisplayName(severity: string): string {
  return SEVERITY_DISPLAY_NAMES[severity] ?? severity;
}

export function getScoreGradientClass(score: number): string {
  if (score >= 90) return "bg-gradient-to-br from-green-500 to-emerald-600 border-green-400 text-white";
  if (score >= 75) return "bg-gradient-to-br from-yellow-400 to-amber-500 border-yellow-300 text-white";
  if (score >= 60) return "bg-gradient-to-br from-orange-500 to-red-500 border-orange-400 text-white";
  if (score >= 40) return "bg-gradient-to-br from-red-500 to-rose-600 border-red-400 text-white";
  return "bg-gradient-to-br from-red-600 to-red-800 border-red-500 text-white";
}

export function getGradeGradientClass(grade: string): string {
  switch (grade) {
    case "A": return "bg-gradient-to-br from-green-500 to-emerald-600 border-green-400 text-white";
    case "B": return "bg-gradient-to-br from-yellow-400 to-amber-500 border-yellow-300 text-white";
    case "C": return "bg-gradient-to-br from-orange-500 to-red-500 border-orange-400 text-white";
    case "D": return "bg-gradient-to-br from-red-500 to-rose-600 border-red-400 text-white";
    default:  return "bg-gradient-to-br from-red-600 to-red-800 border-red-500 text-white";
  }
}

export function getGradeLabel(grade: string): string {
  switch (grade) {
    case "A": return "Excellent";
    case "B": return "Good";
    case "C": return "Moderate";
    case "D": return "Poor";
    default:  return "Critical";
  }
}

export function getRiskLevelGradientClass(risk: string): string {
  switch (risk) {
    case "Critical": return "bg-gradient-to-br from-red-600 to-red-800 border-red-500 text-white";
    case "High":     return "bg-gradient-to-br from-orange-500 to-red-500 border-orange-400 text-white";
    case "Medium":   return "bg-gradient-to-br from-yellow-400 to-amber-500 border-yellow-300 text-white";
    case "Low":      return "bg-gradient-to-br from-green-500 to-emerald-600 border-green-400 text-white";
    default:         return "bg-gradient-to-br from-blue-500 to-blue-600 border-blue-400 text-white";
  }
}

export interface SeverityStyles {
  text: string;
  border: string;
  bg: string;
}

export function getSeverityStyles(severity: string): SeverityStyles {
  switch (severity) {
    case "Critical":
    case "CRITICAL":
      return { text: "text-red-600",     border: "border-l-red-500",     bg: "bg-red-50"     };
    case "High":
    case "HIGH":
      return { text: "text-orange-600",  border: "border-l-orange-500",  bg: "bg-orange-50"  };
    case "Medium":
    case "MEDIUM":
      return { text: "text-yellow-600",  border: "border-l-yellow-500",  bg: "bg-yellow-50"  };
    case "Low":
    case "LOW":
      return { text: "text-blue-600",    border: "border-l-blue-500",    bg: "bg-blue-50"    };
    default:
      return { text: "text-neutral-600", border: "border-l-neutral-500", bg: "bg-neutral-50" };
  }
}

export interface SeveritySectionConfig {
  severity: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
}

export const SEVERITY_SECTION_CONFIGS: SeveritySectionConfig[] = [
  { severity: "CRITICAL",      colorClass: "text-red-600",     bgClass: "bg-red-50/50 dark:bg-red-900/20",      borderClass: "border-l-red-500"     },
  { severity: "HIGH",          colorClass: "text-orange-600",  bgClass: "bg-orange-50/50 dark:bg-orange-900/20", borderClass: "border-l-orange-500"  },
  { severity: "MEDIUM",        colorClass: "text-yellow-600",  bgClass: "bg-yellow-50/50 dark:bg-yellow-900/20", borderClass: "border-l-yellow-500"  },
  { severity: "LOW",           colorClass: "text-blue-600",    bgClass: "bg-blue-50/50 dark:bg-blue-900/20",    borderClass: "border-l-blue-500"    },
  { severity: "INFORMATIONAL", colorClass: "text-neutral-600", bgClass: "bg-neutral-50/50 dark:bg-neutral-900/20", borderClass: "border-l-neutral-500" },
];
