# CryptoSecure — Test Suite Documentation

This project uses **Vitest** for test execution, **React Testing Library** for component tests, and **@vitest/coverage-istanbul** for code coverage.

## Test Commands

| Command | Purpose |
|---------|---------|
| `npm test` | Run the full test suite once |
| `npm run test:watch` | Run tests in watch mode (re-runs on file changes) |
| `npm run test:coverage` | Run tests with Istanbul coverage output |
| `npm run test:ui` | Open the Vitest browser UI on port `51204` |

## Configuration

- **Test runner:** Vitest with `jsdom` environment
- **Setup file:** `src/__tests__/setup.ts`
- **Test file pattern:** `src/**/*.test.{ts,tsx}`
- **Coverage provider:** Istanbul (`@vitest/coverage-istanbul`)
- **Path alias:** `@/` maps to `src/`

## Coverage

**Overall line coverage: ~89%** (excluding files that cannot be tested in jsdom).

### Files excluded from coverage

| File | Reason |
|------|--------|
| `src/components/pdf-report.tsx` | Uses `@react-pdf/renderer`, incompatible with jsdom |
| `src/components/hacker-pdf-report.tsx` | Same as above |
| `src/components/code-analyzer.tsx` | 1 100-line UI orchestrator; logic tested through individual component, API route, and utility tests |
| `src/app/icon.tsx` | Simple image-generation component |

## Test Suite Summary

The suite contains **309 tests** across **32 test files**, organized into 5 categories.

| Category | Test Files | Tests | Scope |
|----------|-----------|-------|-------|
| Utility tests | 6 | 67 | Reusable helpers under `src/lib/utils/` and `src/lib/constants.ts` |
| Analyzer logic tests | 6 | 64 | Core security-analysis engine under `src/lib/analyzer/` |
| Hacker Mode tests | 5 | 30 | Adversarial analysis pipeline under `src/lib/analyzer/hacker/` |
| API route tests | 2 | 24 | Next.js API endpoints (`/api/analyze`, `/api/hack`) |
| Component tests | 13 | 124 | UI components via jsdom + React Testing Library |
| **Total** | **32** | **309** | |

---

## 1. Utility Tests

Validate reusable helpers under `src/lib/utils/` and app-wide constants.

### Test files

| File | Tests |
|------|-------|
| `src/__tests__/lib/utils/severity.test.ts` | 20 |
| `src/__tests__/lib/utils/language.test.ts` | 17 |
| `src/__tests__/lib/utils/code.test.ts` | 14 |
| `src/__tests__/lib/utils/cn.test.ts` | 6 |
| `src/__tests__/lib/utils/apply-fixes.test.ts` | 5 |
| `src/__tests__/lib/constants.test.ts` | 5 |

### What is covered

- **Severity utilities** — Label mapping, display names, badge styles, severity ordering, score-to-grade conversion
- **Language utilities** — File type validation (`.tact`, `.fc`, `.func`), file size validation (1 MB limit), language string validation, auto-detection for FunC and Tact code
- **Code utilities** — Code normalization, vulnerable code position matching, `applyAllFixes` for AI-generated code replacements, edge cases for missing/empty code fields
- **cn utility** — Tailwind class merging and deduplication via `clsx` + `tailwind-merge`
- **Constants** — `MAX_FILE_SIZE`, `ALLOWED_FILE_TYPES`, `ALLOWED_LANGUAGES`, progress step definitions for both analysis and hacker mode

---

## 2. Analyzer Logic Tests

Validate the core security-analysis logic under `src/lib/analyzer/`.

### Test files

| File | Tests |
|------|-------|
| `src/__tests__/lib/analyzer/ai-response.test.ts` | — |
| `src/__tests__/lib/analyzer/ai-providers.test.ts` | — |
| `src/__tests__/lib/analyzer/utils.test.ts` | 11 |
| `src/__tests__/lib/analyzer/analyze/prompts.test.ts` | 17 |
| `src/__tests__/lib/analyzer/analyze/rules.test.ts` | 7 |
| `src/__tests__/lib/analyzer/analyze/engine.test.ts` | 16 |

### What is covered

- **AI response extraction** — JSON block extraction from markdown fenced code, fallback plain-text parsing
- **AI provider abstraction** — Provider creation for OpenAI, Gemini, and Claude; environment-based config detection (`getProviderConfig`)
- **OpenAI provider** — `generateResponse` API calls, empty response handling
- **Gemini provider** — Streaming accumulation, empty response handling, error wrapping, temperature passthrough
- **Claude provider** — Fetch-based API calls, error HTTP responses, empty content handling
- **Parser utilities** — Comment stripping, function-name extraction from contract source
- **Prompt construction** — Audit prompt creation, previous-findings context formatting, language detection heuristics
- **Security rules** — Rule definitions, regex pattern matching for known vulnerability patterns
- **Static analysis engine** — Vulnerability detection with scoring, severity stats, auto-patch generation, TipJar-specific override logic, bounced-check insertion, auth-check insertion, `send_raw_message` mode fix

---

## 3. Hacker Mode Tests

Validate the adversarial analysis pipeline under `src/lib/analyzer/hacker/`.

### Test files

| File | Tests |
|------|-------|
| `src/__tests__/lib/analyzer/hacker/attack-surface.test.ts` | 5 |
| `src/__tests__/lib/analyzer/hacker/hacker-agent.test.ts` | 8 |
| `src/__tests__/lib/analyzer/hacker/defender-agent.test.ts` | 5 |
| `src/__tests__/lib/analyzer/hacker/prompts.test.ts` | 7 |
| `src/__tests__/lib/analyzer/hacker/feasibility-check.test.ts` | 5 |

### What is covered

- **Attack surface enumeration** — AI-based parsing, fallback detection of risky keywords (`send_raw_message`, `accept_message`) and missing access control patterns
- **Exploit generation** — AI response parsing, static fallback for reentrancy / unprotected `recv_external` / missing balance checks, exploit type normalization
- **Defense recommendations** — AI response parsing, fallback generation per exploit type, filtering of invalid recommendations
- **Prompt templates** — Content verification, code/language/function inclusion in prompt strings
- **Feasibility validation** — Exploit plausibility checks against actual source code patterns

---

## 4. API Route Tests

Validate the Next.js API endpoints under `src/app/api/`.

### Test files

| File | Tests |
|------|-------|
| `src/__tests__/api/analyze-route.test.ts` | 7 |
| `src/__tests__/api/hack-route.test.ts` | 17 |

### What is covered

#### `/api/analyze`
- Request validation (missing/invalid code)
- Missing AI provider handling (`500` response)
- Error propagation from AI providers
- Successful analysis response with JSON parsing
- Re-analysis with previous findings context

#### `/api/hack`
- Request validation: missing code, missing language
- AI provider not configured (`500` response)
- Full four-stage exploit pipeline with mocked dependencies
- Empty attack surfaces → early return
- Empty exploits → early return with attack surfaces
- Client IP extraction from `x-forwarded-for` and `x-real-ip` headers
- Scoring logic: multiple exploit severities/likelihoods, vulnerability penalty from findings (CRITICAL/HIGH/MEDIUM/LOW), Info severity, `vulnerabilityScore` cap
- Risk level determination: None, Low, Medium, High, Critical
- Unexpected error handling

---

## 5. Component Tests

Validate UI components using `jsdom` and React Testing Library.

### Test files

| File | Tests |
|------|-------|
| `src/__tests__/components/progress-stepper.test.tsx` | — |
| `src/__tests__/components/logo.test.tsx` | — |
| `src/__tests__/components/analysis-chat.test.tsx` | — |
| `src/__tests__/components/severity-section.test.tsx` | — |
| `src/__tests__/components/analysis-results.test.tsx` | — |
| `src/__tests__/components/hacker-mode-results.test.tsx` | — |
| `src/__tests__/components/code-diff-viewer.test.tsx` | — |
| `src/__tests__/components/mission-control.test.tsx` | — |
| `src/__tests__/components/code-analyzer.test.tsx` | — |
| `src/__tests__/components/ui/card.test.tsx` | — |
| `src/__tests__/components/ui/inputs.test.tsx` | — |
| `src/__tests__/app/page.test.tsx` | — |
| `src/__tests__/app/auditor-page.test.tsx` | — |

### What is covered

- **ProgressStepper** — Renders steps, highlights active step, shows descriptions
- **Logo** — Renders both default and compact variants, accepts custom class names
- **AnalysisChat** — Chat input, quick-action buttons, Audie AI assistant branding
- **SeveritySection** — Section header with severity badge, finding count, expand/collapse toggle
- **AnalysisResults** — Executive summary, security score, letter grade, finding stats by severity, recommendations, gas optimizations, hacker mode promo
- **HackerModeResults** — Resilience score gauge, risk level badge, attack surface list, exploit cards with status badges (plausible / theoretical / not-applicable)
- **CodeDiffViewer** — Unified and side-by-side views, added/removed/unchanged line highlighting, modification hunks with context padding, view-mode toggle
- **MissionControl** — Security check animations, score display, timer-driven state transitions (score drop, fixing overlay)
- **CodeAnalyzer** — Tab switching (upload / snippet), snippet textarea, auto-detect language (Tact / FunC), scan button state, drag-and-drop area, file type description
- **Card / Input / Textarea / SimpleTooltip** — UI primitive rendering and prop forwarding
- **Home page** — Hero heading, CTA button, tagline text, MissionControl integration
- **Auditor page** — Header with logo, "Back to Home" link, CodeAnalyzer integration

---

## What Is Not Covered

| Area | Reason |
|------|--------|
| End-to-end browser tests | No E2E framework (Playwright / Cypress) is configured |
| PDF rendering/export | `@react-pdf/renderer` requires a non-jsdom environment |
| Real AI provider integration | Tests mock API calls; no live calls to OpenAI / Gemini / Claude |
| Visual regression / snapshot tests | Not implemented |
| Rate limiting (production) | Rate limiter is disabled in test/development mode |

---

## Running Tests

```bash
# Full suite (one-shot)
npm test

# Watch mode (re-runs on save)
npm run test:watch

# Coverage report
npm run test:coverage

# Browser-based UI
npm run test:ui
```

All **309 tests** across **32 files** pass with **~89% line coverage** of the testable codebase. The suite thoroughly validates:

- Pure utility and helper logic
- Core audit/analyzer engine and scoring
- AI provider abstraction layer (mocked)
- Hacker Mode adversarial analysis pipeline
- API route contracts and error handling
- UI component rendering and interaction
