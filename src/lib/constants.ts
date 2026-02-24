export const MAX_FILE_SIZE = 1024 * 1024; // 1MB

export const ALLOWED_FILE_TYPES = ['.tact', '.fc', '.func'] as const;

export const ALLOWED_LANGUAGES = ['tact', 'fc', 'func'] as const;
export type LanguageType = typeof ALLOWED_LANGUAGES[number];

export const ANALYSIS_PROGRESS_STEPS = [
  { title: "Parsing contract code",       description: "Reading and validating syntax",         duration: 1500 },
  { title: "Analyzing contract logic",    description: "Identifying functions and patterns",    duration: 2000 },
  { title: "Scanning for vulnerabilities", description: "Checking security patterns",           duration: 2500 },
  { title: "Generating security report",  description: "Compiling findings",                   duration: 1500 },
] as const;

export const HACKER_PROGRESS_STEPS = [
  { title: "Enumerating attack surfaces...",        duration: 1500 },
  { title: "Generating exploit strategies...",      duration: 2000 },
  { title: "Validating attack feasibility...",      duration: 1500 },
  { title: "Preparing defensive recommendations...", duration: 1000 },
] as const;
