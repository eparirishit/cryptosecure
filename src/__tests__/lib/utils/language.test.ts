import { describe, it, expect } from "vitest";
import {
  isValidFileType,
  isValidFileSize,
  isValidLanguage,
  autoDetectLanguage,
} from "@/lib/utils/language";
import { MAX_FILE_SIZE } from "@/lib/constants";

describe("isValidFileType", () => {
  it("accepts .tact files", () => {
    expect(isValidFileType("contract.tact")).toBe(true);
  });

  it("accepts .fc files", () => {
    expect(isValidFileType("contract.fc")).toBe(true);
  });

  it("accepts .func files", () => {
    expect(isValidFileType("contract.func")).toBe(true);
  });

  it("is case-insensitive", () => {
    expect(isValidFileType("contract.TACT")).toBe(true);
    expect(isValidFileType("Contract.FC")).toBe(true);
  });

  it("rejects unsupported file types", () => {
    expect(isValidFileType("contract.sol")).toBe(false);
    expect(isValidFileType("contract.rs")).toBe(false);
    expect(isValidFileType("contract.js")).toBe(false);
    expect(isValidFileType("readme.md")).toBe(false);
  });

  it("rejects files without extensions", () => {
    expect(isValidFileType("contract")).toBe(false);
  });
});

describe("isValidFileSize", () => {
  it("accepts files at exactly the max size", () => {
    expect(isValidFileSize(MAX_FILE_SIZE)).toBe(true);
  });

  it("accepts files under the max size", () => {
    expect(isValidFileSize(0)).toBe(true);
    expect(isValidFileSize(1024)).toBe(true);
  });

  it("rejects files over the max size", () => {
    expect(isValidFileSize(MAX_FILE_SIZE + 1)).toBe(false);
  });
});

describe("isValidLanguage", () => {
  it("accepts valid languages", () => {
    expect(isValidLanguage("tact")).toBe(true);
    expect(isValidLanguage("fc")).toBe(true);
    expect(isValidLanguage("func")).toBe(true);
  });

  it("is case-insensitive", () => {
    expect(isValidLanguage("TACT")).toBe(true);
    expect(isValidLanguage("Func")).toBe(true);
  });

  it("rejects invalid languages", () => {
    expect(isValidLanguage("solidity")).toBe(false);
    expect(isValidLanguage("rust")).toBe(false);
  });

  it("rejects empty string", () => {
    expect(isValidLanguage("")).toBe(false);
  });
});

describe("autoDetectLanguage", () => {
  it("returns null for empty/whitespace input", () => {
    expect(autoDetectLanguage("")).toEqual({ language: null, error: null });
    expect(autoDetectLanguage("   ")).toEqual({ language: null, error: null });
  });

  it("detects FunC code as 'func'", () => {
    const funcCode = '#include "stdlib.fc"\nint main() impure { cell c = begin_cell(); }';
    const result = autoDetectLanguage(funcCode);
    expect(result.language).toBe("func");
    expect(result.error).toBeNull();
  });

  it("detects Tact code as 'tact'", () => {
    const tactCode = 'contract Counter { message Add { amount: Int } }';
    const result = autoDetectLanguage(tactCode);
    expect(result.language).toBe("tact");
    expect(result.error).toBeNull();
  });

  it("returns error for unrecognized code", () => {
    const unknownCode = "function hello() { return 42; }";
    const result = autoDetectLanguage(unknownCode);
    expect(result.language).toBeNull();
    expect(result.error).toContain("Unable to auto-detect");
  });
});
