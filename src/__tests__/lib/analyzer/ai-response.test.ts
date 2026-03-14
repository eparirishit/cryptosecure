import { describe, it, expect, vi } from "vitest";
import { extractArrayFromAIResponse } from "@/lib/analyzer/ai-response";

describe("extractArrayFromAIResponse", () => {
  it("returns data from the first matching preferred key", () => {
    const parsed = { findings: [1, 2, 3], other: [4, 5] };
    const result = extractArrayFromAIResponse(parsed, ["findings"], "test");
    expect(result).toEqual([1, 2, 3]);
  });

  it("tries preferred keys in order", () => {
    const parsed = { secondary: [4, 5], primary: [1, 2] };
    const result = extractArrayFromAIResponse(parsed, ["primary", "secondary"], "test");
    expect(result).toEqual([1, 2]);
  });

  it("skips non-array preferred keys", () => {
    const parsed = { name: "not-array", items: [1, 2, 3] };
    const result = extractArrayFromAIResponse(parsed, ["name", "items"], "test");
    expect(result).toEqual([1, 2, 3]);
  });

  it("falls back to the first top-level array and logs a warning", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const parsed = { unexpectedKey: [10, 20] };
    const result = extractArrayFromAIResponse(parsed, ["findings"], "TestLabel");
    expect(result).toEqual([10, 20]);
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining("[TestLabel]"),
    );
    spy.mockRestore();
  });

  it("returns an empty array when no arrays exist", () => {
    const parsed = { name: "string", count: 42 };
    const result = extractArrayFromAIResponse(parsed, ["items"], "test");
    expect(result).toEqual([]);
  });

  it("returns an empty array for an empty object", () => {
    const result = extractArrayFromAIResponse({}, ["items"], "test");
    expect(result).toEqual([]);
  });
});
