# Test Suite Overview

This project uses `Vitest` for test execution and `React Testing Library` for component tests.

## Test Commands

| Command | Purpose |
|---------|---------|
| `npm test` | Run the full test suite once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage output |
| `npm run test:ui` | Open the Vitest browser UI on port `51204` |

## Current Test Types

The current suite includes 4 main categories of tests:

1. Utility tests
2. Analyzer logic tests
3. API route tests
4. Component tests

## 1. Utility Tests

These tests validate reusable helpers under `src/lib/utils/`.

### Covered files

- `src/__tests__/lib/utils/severity.test.ts`
- `src/__tests__/lib/utils/language.test.ts`
- `src/__tests__/lib/utils/code.test.ts`

### What is covered

- Severity label mapping and display naming
- Score, grade, and risk-level styling helpers
- Severity style/config generation
- File type validation
- File size validation
- Language validation
- Language auto-detection for FunC and Tact code
- Code normalization
- Vulnerable code position matching
- Applying AI-generated fixes to source code

## 2. Analyzer Logic Tests

These tests validate the core security-analysis logic under `src/lib/analyzer/`.

### Covered files

- `src/__tests__/lib/analyzer/ai-response.test.ts`
- `src/__tests__/lib/analyzer/utils.test.ts`
- `src/__tests__/lib/analyzer/analyze/prompts.test.ts`
- `src/__tests__/lib/analyzer/analyze/rules.test.ts`
- `src/__tests__/lib/analyzer/analyze/engine.test.ts`
- `src/__tests__/lib/analyzer/hacker/feasibility-check.test.ts`

### What is covered

- Extracting arrays from AI responses
- Fallback parsing behavior for unexpected AI response shapes
- Stripping comments from smart contract code
- Mapping functions from contract source
- Detecting contract language from source code
- Creating audit prompts for AI providers
- Formatting previous findings for re-analysis
- Security rule definitions and regex matching
- Static vulnerability detection
- Security scoring behavior
- Vulnerability stats aggregation
- Auto-patch generation for detected issues
- Exploit feasibility validation for Hacker Mode

## 3. API Route Tests

These tests validate the Next.js API endpoints under `src/app/api/`.

### Covered files

- `src/__tests__/api/analyze-route.test.ts`
- `src/__tests__/api/hack-route.test.ts`

### What is covered

- Request validation for missing or invalid input
- Error handling when no AI provider is configured
- Error handling when the AI provider throws
- Successful JSON response generation for `/api/analyze`
- Hacker Mode request validation for `/api/hack`
- No-attack-surface behavior
- Full exploit pipeline behavior with mocked dependencies
- Recommendation generation flow in Hacker Mode

## 4. Component Tests

These tests validate isolated UI components using `jsdom` and `React Testing Library`.

### Covered files

- `src/__tests__/components/progress-stepper.test.tsx`
- `src/__tests__/components/logo.test.tsx`
- `src/__tests__/components/analysis-chat.test.tsx`

### What is covered

- Progress stepper title/subtitle rendering
- Active-step description rendering behavior
- Presence of all progress step labels
- Logo rendering
- Logo variants and custom class handling
- Analysis chat input rendering
- Quick-action button rendering
- Audie AI branding visibility

## What Is Not Covered Yet

The current test suite does not yet include:

- End-to-end browser tests
- Full-page integration tests
- PDF rendering/export tests
- Tests for larger container components such as `code-analyzer` or `analysis-results`
- Real provider integration tests against OpenAI, Gemini, or Claude APIs
- Visual regression or snapshot tests

## Summary

The suite currently focuses on the most important testable layers:

- Pure utility logic
- Core audit/analyzer behavior
- API contract behavior
- Small reusable UI components

This gives good coverage of the application’s core logic without introducing slower E2E coverage yet.
