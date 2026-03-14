import { describe, it, expect } from "vitest";
import {
  getSeverityDisplayName,
  getScoreGradientClass,
  getGradeGradientClass,
  getGradeLabel,
  getRiskLevelGradientClass,
  getSeverityStyles,
  SEVERITY_DISPLAY_NAMES,
  SEVERITY_SECTION_CONFIGS,
} from "@/lib/utils/severity";

describe("getSeverityDisplayName", () => {
  it("maps known severity keys to display names", () => {
    expect(getSeverityDisplayName("CRITICAL")).toBe("Critical");
    expect(getSeverityDisplayName("HIGH")).toBe("High");
    expect(getSeverityDisplayName("MEDIUM")).toBe("Medium");
    expect(getSeverityDisplayName("LOW")).toBe("Low");
    expect(getSeverityDisplayName("INFORMATIONAL")).toBe("Informational");
  });

  it("returns the input string for unknown severities", () => {
    expect(getSeverityDisplayName("UNKNOWN")).toBe("UNKNOWN");
    expect(getSeverityDisplayName("")).toBe("");
  });
});

describe("getScoreGradientClass", () => {
  it("returns green for scores >= 90", () => {
    expect(getScoreGradientClass(100)).toContain("green");
    expect(getScoreGradientClass(90)).toContain("green");
  });

  it("returns yellow for scores 75-89", () => {
    expect(getScoreGradientClass(89)).toContain("yellow");
    expect(getScoreGradientClass(75)).toContain("yellow");
  });

  it("returns orange for scores 60-74", () => {
    expect(getScoreGradientClass(74)).toContain("orange");
    expect(getScoreGradientClass(60)).toContain("orange");
  });

  it("returns red/rose for scores 40-59", () => {
    expect(getScoreGradientClass(59)).toContain("red");
    expect(getScoreGradientClass(40)).toContain("rose");
  });

  it("returns dark red for scores below 40", () => {
    expect(getScoreGradientClass(39)).toContain("red-800");
    expect(getScoreGradientClass(0)).toContain("red-800");
  });
});

describe("getGradeGradientClass", () => {
  it("returns correct gradient for each grade", () => {
    expect(getGradeGradientClass("A")).toContain("green");
    expect(getGradeGradientClass("B")).toContain("yellow");
    expect(getGradeGradientClass("C")).toContain("orange");
    expect(getGradeGradientClass("D")).toContain("rose");
  });

  it("returns dark red for unknown grades (F, etc.)", () => {
    expect(getGradeGradientClass("F")).toContain("red-800");
    expect(getGradeGradientClass("Z")).toContain("red-800");
  });
});

describe("getGradeLabel", () => {
  it("returns correct labels", () => {
    expect(getGradeLabel("A")).toBe("Excellent");
    expect(getGradeLabel("B")).toBe("Good");
    expect(getGradeLabel("C")).toBe("Moderate");
    expect(getGradeLabel("D")).toBe("Poor");
  });

  it("returns Critical for unknown grades", () => {
    expect(getGradeLabel("F")).toBe("Critical");
    expect(getGradeLabel("")).toBe("Critical");
  });
});

describe("getRiskLevelGradientClass", () => {
  it("maps each risk level to the correct gradient", () => {
    expect(getRiskLevelGradientClass("Critical")).toContain("red-800");
    expect(getRiskLevelGradientClass("High")).toContain("orange");
    expect(getRiskLevelGradientClass("Medium")).toContain("yellow");
    expect(getRiskLevelGradientClass("Low")).toContain("green");
  });

  it("returns blue for unknown risk levels", () => {
    expect(getRiskLevelGradientClass("None")).toContain("blue");
    expect(getRiskLevelGradientClass("")).toContain("blue");
  });
});

describe("getSeverityStyles", () => {
  it("handles uppercase severity names", () => {
    const styles = getSeverityStyles("CRITICAL");
    expect(styles.text).toBe("text-red-600");
    expect(styles.border).toBe("border-l-red-500");
    expect(styles.bg).toBe("bg-red-50");
  });

  it("handles title-case severity names", () => {
    const styles = getSeverityStyles("High");
    expect(styles.text).toBe("text-orange-600");
  });

  it("handles both cases for all severities", () => {
    expect(getSeverityStyles("Medium").text).toBe("text-yellow-600");
    expect(getSeverityStyles("MEDIUM").text).toBe("text-yellow-600");
    expect(getSeverityStyles("Low").text).toBe("text-blue-600");
    expect(getSeverityStyles("LOW").text).toBe("text-blue-600");
  });

  it("returns neutral for unknown severity", () => {
    const styles = getSeverityStyles("INFORMATIONAL");
    expect(styles.text).toBe("text-neutral-600");
    expect(styles.border).toBe("border-l-neutral-500");
  });
});

describe("SEVERITY_DISPLAY_NAMES", () => {
  it("has exactly 5 entries", () => {
    expect(Object.keys(SEVERITY_DISPLAY_NAMES)).toHaveLength(5);
  });
});

describe("SEVERITY_SECTION_CONFIGS", () => {
  it("has configs for all 5 severity levels", () => {
    expect(SEVERITY_SECTION_CONFIGS).toHaveLength(5);
    const severities = SEVERITY_SECTION_CONFIGS.map((c) => c.severity);
    expect(severities).toEqual(["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFORMATIONAL"]);
  });

  it("each config has all required fields", () => {
    for (const config of SEVERITY_SECTION_CONFIGS) {
      expect(config).toHaveProperty("severity");
      expect(config).toHaveProperty("colorClass");
      expect(config).toHaveProperty("bgClass");
      expect(config).toHaveProperty("borderClass");
    }
  });
});
