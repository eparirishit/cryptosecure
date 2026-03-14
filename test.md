# Test Suite Overview

This project uses `Vitest` for test execution, `React Testing Library` for component tests, and `@vitest/coverage-istanbul` for code coverage.

## Test Commands

| Command | Purpose |
|---------|---------|
| `npm test` | Run the full test suite once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage output |
| `npm run test:ui` | Open the Vitest browser UI on port `51204` |

## Coverage

**Overall line coverage: ~89%** (excluding files that cannot be tested in jsdom).

Excluded from coverage:
- `src/components/pdf-report.tsx` — uses `@react-pdf/renderer` which is incompatible with jsdom
- `src/components/hacker-pdf-report.tsx` — same as above
- `src/components/code-analyzer.tsx` — 1100-line UI orchestration component; its logic is tested through individual component, API route, and utility tests
- `src/app/icon.tsx` — simple image generation component

## Current Test Types

The suite includes 5 main categories across **32 test files** and **309 tests**:

1. Utility tests
2. Analyzer logic tests
3. Hacker Mode tests
4. API route tests
5. Component tests

## 1. Utility Tests

Validate reusable helpers under `src/lib/utils/`.

### Covered files

- `src/__tests__/lib/utils/severity.test.ts`
- `src/__tests__/lib/utils/language.test.ts`
- `src/__tests__/lib/utils/code.test.ts`
- `src/__tests__/lib/utils/cn.test.ts`
- `src/__tests__/lib/utils/apply-fixes.test.ts`
- `src/__tests__/lib/constants.test.ts`

### What is covered

- Severity label mapping, display names, styles, and score-to-grade conversion
- File type, file size, and language validation
- Language auto-detection for FunC and Tact code
- Code normalization and vulnerable code position matching
- `cn` utility for Tailwind class merging and deduplication
- `applyAllFixes` for applying AI-generated code replacements
- Constants: file size limits, allowed types, progress step definitions

## 2. Analyzer Logic Tests

Validate the core security-analysis logic under `src/lib/analyzer/`.

### Covered files

- `src/__tests__/lib/analyzer/ai-response.test.ts`
- `src/__tests__/lib/analyzer/ai-providers.test.ts`
- `src/__tests__/lib/analyzer/utils.test.ts`
- `src/__tests__/lib/analyzer/analyze/prompts.test.ts`
- `src/__tests__/lib/analyzer/analyze/rules.test.ts`
- `src/__tests__/lib/analyzer/analyze/engine.test.ts`

### What is covered

- AI response extraction and fallback parsing
- AI provider creation (OpenAI, Gemini, Claude) and environment-based config detection
- OpenAI `generateResponse`: API calls, empty response handling
- Gemini `generateResponse`: streaming accumulation, empty response, error wrapping, temperature passthrough
- Claude `generateResponse`: fetch-based API calls, error responses, empty content
- Comment stripping and function mapping from contract source
- Audit prompt creation and previous findings formatting
- Security rule definitions and regex matching
- Static vulnerability detection engine with scoring, stats, and auto-patch generation
- TipJar-specific override logic (withdrawal with/without auth)
- Auto-fix patches: bounced check insertion, auth check insertion, send_raw_message mode fix

## 3. Hacker Mode Tests

Validate the adversarial analysis pipeline under `src/lib/analyzer/hacker/`.

### Covered files

- `src/__tests__/lib/analyzer/hacker/attack-surface.test.ts`
- `src/__tests__/lib/analyzer/hacker/hacker-agent.test.ts`
- `src/__tests__/lib/analyzer/hacker/defender-agent.test.ts`
- `src/__tests__/lib/analyzer/hacker/prompts.test.ts`
- `src/__tests__/lib/analyzer/hacker/feasibility-check.test.ts`

### What is covered

- Attack surface enumeration: AI parsing, fallback detection of risky keywords and missing access control
- Exploit generation: AI response parsing, static fallback for reentrancy/unprotected recv_external/missing balance checks, type normalization
- Defense recommendations: AI response parsing, fallback generation per exploit type, filtering invalid recommendations
- Prompt templates: content verification, code/language/function inclusion
- Exploit feasibility validation

## 4. API Route Tests

Validate the Next.js API endpoints under `src/app/api/`.

### Covered files

- `src/__tests__/api/analyze-route.test.ts`
- `src/__tests__/api/hack-route.test.ts`

### What is covered

- `/api/analyze`: request validation, missing provider handling, error propagation, successful response
- `/api/hack`: request validation (missing code/language), provider not configured
- Full exploit pipeline with mocked dependencies
- Empty attack surfaces and empty exploits responses
- Client IP extraction from `x-forwarded-for` and `x-real-ip` headers
- Scoring logic: multiple exploit severities/likelihoods, vulnerability penalty from findings (CRITICAL/HIGH/MEDIUM/LOW), Info severity, `vulnerabilityScore` cap
- Risk level determination: None, Low, Medium, High, Critical
- Unexpected error handling

## 5. Component Tests

Validate UI components using `jsdom` and `React Testing Library`.

### Covered files

- `src/__tests__/components/progress-stepper.test.tsx`
- `src/__tests__/components/logo.test.tsx`
- `src/__tests__/components/analysis-chat.test.tsx`
- `src/__tests__/components/severity-section.test.tsx`
- `src/__tests__/components/analysis-results.test.tsx`
- `src/__tests__/components/hacker-mode-results.test.tsx`
- `src/__tests__/components/code-diff-viewer.test.tsx`
- `src/__tests__/components/mission-control.test.tsx`
- `src/__tests__/components/code-analyzer.test.tsx`
- `src/__tests__/components/ui/card.test.tsx`
- `src/__tests__/components/ui/inputs.test.tsx`
- `src/__tests__/app/page.test.tsx`
- `src/__tests__/app/auditor-page.test.tsx`

### What is covered

- Progress stepper rendering and active-step behavior
- Logo variants and custom class handling
- Analysis chat input, quick actions, and Audie branding
- Severity section: header, count, toggle visibility of findings
- Analysis results: summary, score, grade, finding stats, recommendations, gas optimizations, hacker mode promo
- Hacker mode results: resilience score, risk level, attack surfaces, exploit cards with status badges
- Code diff viewer: unified and side-by-side views, added/removed/unchanged lines, modification hunks with padding, view mode toggle
- Mission control: security checks, score display, timer-driven state transitions (score drop, fixing overlay)
- Code analyzer: tabs, snippet mode, auto-detect language (Tact/FunC), scan button state, drag-and-drop area, file type text
- Card, Input, Textarea, SimpleTooltip UI primitives
- Home page: hero heading, CTA, tagline, MissionControl integration
- Auditor page: header, back link, CodeAnalyzer integration

## What Is Not Covered

- End-to-end browser tests
- PDF rendering/export tests (requires non-jsdom environment)
- Real AI provider integration tests against OpenAI, Gemini, or Claude APIs
- Visual regression or snapshot tests

## Summary

The suite covers **309 tests** across **32 files** with **~89% line coverage** of the testable codebase. It thoroughly validates:

- Pure utility and helper logic
- Core audit/analyzer engine and scoring
- AI provider abstraction layer
- Hacker Mode adversarial analysis pipeline
- API route contracts and error handling
- UI component rendering and interaction
