import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn (class name utility)", () => {
  it("merges multiple class strings", () => {
    expect(cn("bg-red-500", "text-white")).toBe("bg-red-500 text-white");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible");
  });

  it("deduplicates conflicting Tailwind classes", () => {
    const result = cn("bg-red-500", "bg-blue-500");
    expect(result).toBe("bg-blue-500");
  });

  it("handles undefined and null inputs", () => {
    expect(cn("base", undefined, null)).toBe("base");
  });

  it("handles empty inputs", () => {
    expect(cn()).toBe("");
  });

  it("handles array inputs", () => {
    expect(cn(["bg-red-500", "text-white"])).toBe("bg-red-500 text-white");
  });
});
