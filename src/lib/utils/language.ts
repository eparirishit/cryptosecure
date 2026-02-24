import { detectLanguage } from "@/lib/analyzer/prompts";
import {
  ALLOWED_FILE_TYPES,
  ALLOWED_LANGUAGES,
  MAX_FILE_SIZE,
  type LanguageType,
} from "@/lib/constants";

export function isValidFileType(fileName: string): boolean {
  const extension = fileName.toLowerCase().substring(fileName.lastIndexOf("."));
  return (ALLOWED_FILE_TYPES as readonly string[]).includes(extension);
}

export function isValidFileSize(fileSize: number): boolean {
  return fileSize <= MAX_FILE_SIZE;
}

export function isValidLanguage(language: string | LanguageType | ""): boolean {
  if (!language) return false;
  return (ALLOWED_LANGUAGES as readonly string[]).includes(
    language.toLowerCase()
  );
}

export function autoDetectLanguage(
  code: string
): { language: LanguageType | null; error: string | null } {
  if (!code.trim()) return { language: null, error: null };

  const detected = detectLanguage(code);

  const languageMap: Record<string, LanguageType> = {
    FunC: "func",
    Tact: "tact",
  };

  const mapped = languageMap[detected];
  if (mapped) return { language: mapped, error: null };

  if (detected === "Unknown") {
    return {
      language: null,
      error:
        "Unable to auto-detect language. Please manually select a language type (Tact, FC, or Func).",
    };
  }

  return {
    language: null,
    error: `Detected language "${detected}" is not supported. Supported languages are: Tact, FC, or Func.`,
  };
}
