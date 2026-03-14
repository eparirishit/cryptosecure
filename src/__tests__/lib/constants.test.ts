import { describe, it, expect } from "vitest";
import {
  MAX_FILE_SIZE,
  ALLOWED_FILE_TYPES,
  ALLOWED_LANGUAGES,
  ANALYSIS_PROGRESS_STEPS,
  HACKER_PROGRESS_STEPS,
} from "@/lib/constants";

describe("constants", () => {
  it("MAX_FILE_SIZE is 1MB", () => {
    expect(MAX_FILE_SIZE).toBe(1024 * 1024);
  });

  it("ALLOWED_FILE_TYPES contains .tact, .fc, .func", () => {
    expect(ALLOWED_FILE_TYPES).toContain(".tact");
    expect(ALLOWED_FILE_TYPES).toContain(".fc");
    expect(ALLOWED_FILE_TYPES).toContain(".func");
    expect(ALLOWED_FILE_TYPES).toHaveLength(3);
  });

  it("ALLOWED_LANGUAGES contains tact, fc, func", () => {
    expect(ALLOWED_LANGUAGES).toContain("tact");
    expect(ALLOWED_LANGUAGES).toContain("fc");
    expect(ALLOWED_LANGUAGES).toContain("func");
    expect(ALLOWED_LANGUAGES).toHaveLength(3);
  });

  it("ANALYSIS_PROGRESS_STEPS has 4 steps with required fields", () => {
    expect(ANALYSIS_PROGRESS_STEPS).toHaveLength(4);
    for (const step of ANALYSIS_PROGRESS_STEPS) {
      expect(step.title).toBeTruthy();
      expect(step.description).toBeTruthy();
      expect(step.duration).toBeGreaterThan(0);
    }
  });

  it("HACKER_PROGRESS_STEPS has 4 steps with required fields", () => {
    expect(HACKER_PROGRESS_STEPS).toHaveLength(4);
    for (const step of HACKER_PROGRESS_STEPS) {
      expect(step.title).toBeTruthy();
      expect(step.duration).toBeGreaterThan(0);
    }
  });
});
