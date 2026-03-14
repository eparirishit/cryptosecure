# Acceptance Test Plan

**for**

# CryptoSecure

**Version 1.0**

**Prepared By:**
Rishit Epari, Shweta Sharma, Khushboo Patel, Areef Syed

**Advisor:**
Dr. Sean Grimes

**Stakeholder:**
Kruthika Ravi

---

## Table of Contents

1. [Document History](#1-document-history)
2. [Introduction](#2-introduction)
   - 2.1 [Purpose](#21-purpose)
   - 2.2 [References](#22-references)
   - 2.3 [Definitions](#23-definitions)
3. [Test Approach and Constraints](#3-test-approach-and-constraints)
   - 3.1 [Test Objectives](#31-test-objectives)
   - 3.2 [Test Structures](#32-test-structures)
   - 3.3 [Test Constraints](#33-test-constraints)
4. [Test Assumptions and Exclusions](#4-test-assumptions-and-exclusions)
   - 4.1 [Test Assumptions](#41-test-assumptions)
   - 4.2 [Test Exclusions](#42-test-exclusions)
5. [Entry and Exit Criteria](#5-entry-and-exit-criteria)
   - 5.1 [Entry Criteria](#51-entry-criteria)
   - 5.2 [Exit Criteria](#52-exit-criteria)
6. [Testing Participants](#6-testing-participants)
   - 6.1 [Roles and Responsibilities](#61-roles-and-responsibilities)
   - 6.2 [Training Requirements](#62-training-requirements)
   - 6.3 [Problem Reporting](#63-problem-reporting)
   - 6.4 [Progress Reporting](#64-progress-reporting)
7. [Test Cases](#7-test-cases)
   - 7.1 [Introduction](#71-introduction)
   - 7.2 [Test Cases](#72-test-cases)
     - 7.2.1 [Home Page Navigation](#721-home-page-navigation)
     - 7.2.2 [Auditor Page Navigation](#722-auditor-page-navigation)
     - 7.2.3 [File Upload](#723-file-upload)
     - 7.2.4 [Code Snippet Input](#724-code-snippet-input)
     - 7.2.5 [Standard Security Analysis](#725-standard-security-analysis)
     - 7.2.6 [Analysis Results Display](#726-analysis-results-display)
     - 7.2.7 [Code Diff Viewer](#727-code-diff-viewer)
     - 7.2.8 [Apply Fixes and Re-Analysis](#728-apply-fixes-and-re-analysis)
     - 7.2.9 [Hacker Mode](#729-hacker-mode)
     - 7.2.10 [Hacker Mode Results Display](#7210-hacker-mode-results-display)
     - 7.2.11 [PDF Report Export](#7211-pdf-report-export)
     - 7.2.12 [Sample Contracts](#7212-sample-contracts)
     - 7.2.13 [Error Handling](#7213-error-handling)
8. [Traceability Matrix](#8-traceability-matrix)

---

## 1. Document History

| Name | Date | Reason | Version |
|------|------|--------|---------|
| Rishit Epari, Shweta Sharma, Khushboo Patel, Areef Syed | March 08, 2026 | Initial Draft | 1.0 |

---

## 2. Introduction

### 2.1 Purpose

This document provides the plan for completing the acceptance test of CryptoSecure, an AI-powered smart contract security scanner for the TON blockchain. The included test cases were derived from the functional requirements of CryptoSecure, which detail the system's expected behavior for end users.

### 2.2 References

#### 2.2.1 Software Requirements

This document references the functional requirements described in the CryptoSecure README and project documentation. Requirement identifiers are listed for every test case to indicate which requirements the test exercises.

#### 2.2.2 Issue Tracking

The issue tracking system used to track any test failures, bugs, concerns, and backlog items can be found at the project's GitHub repository.

### 2.3 Definitions

| Term | Definition |
|------|------------|
| **Smart Contract** | A self-executing program deployed on a blockchain that automatically enforces the terms of an agreement. |
| **FunC** | A low-level programming language used to write smart contracts on the TON blockchain. |
| **Tact** | A high-level programming language for writing smart contracts on the TON blockchain, designed to be safer and more expressive than FunC. |
| **Security Score** | A numerical rating from 0 to 100 representing the overall security posture of a smart contract, where 100 is fully secure. |
| **Grade** | A letter grade (A through F) derived from the security score. |
| **Severity** | The classification of a vulnerability's impact: Critical, High, Medium, Low, or Informational. |
| **Finding** | A specific vulnerability or security issue identified during analysis, including its description, impact, and recommended fix. |
| **Hacker Mode** | An adversarial analysis feature that simulates real attacks through a four-stage pipeline: attack surface enumeration, exploit generation, feasibility validation, and defensive recommendations. |
| **Hacker Resilience Score** | A numerical score (0–100) measuring a contract's resilience against simulated adversarial attacks. |
| **Attack Surface** | An entry point in a smart contract that a malicious actor could potentially exploit. |
| **Exploit** | A strategy or technique that could be used to take advantage of a vulnerability in a smart contract. |
| **Code Diff** | A side-by-side or unified comparison of the original contract code and the AI-suggested corrected code. |
| **Re-Analysis** | Running the security audit again on code that has had AI-suggested fixes applied, with context from previous findings. |
| **AI Provider** | An external AI service (OpenAI, Google Gemini, or Anthropic Claude) used to power the analysis engine. |
| **PDF Report** | A downloadable audit report exported as a PDF file for sharing or compliance purposes. |
| **Gas Optimization** | A suggestion for reducing the computational cost (gas) of executing a smart contract operation. |
| **SRS** | Software Requirements Specification — a document containing the complete description of the behavior of a system. |
| **Test Case** | An atomic test description including preconditions, actions, and expected postconditions. |

---

## 3. Test Approach and Constraints

This section describes the objectives, structure, and constraints for the acceptance test plan for CryptoSecure.

### 3.1 Test Objectives

Following the prescribed Acceptance Test Plan process verifies that CryptoSecure fulfills all of the functional requirements. CryptoSecure is ready for deployment if and only if it passes all of the test cases contained in this Acceptance Test Plan.

### 3.2 Test Structures

Atomic test cases were derived from the functional requirements. Each test case has a unique identifier, a name, a high-level description of the functionality it tests, and references to its related requirements. Additionally, each test case contains preconditions, actions, and postconditions. Preconditions describe the required state of the system before the test is performed. The actions include an itemized list of steps the tester takes when performing the test. The postconditions describe the state the system is expected to be in after the actions are performed. If the postcondition(s) are met, then the software passes the test case.

### 3.3 Test Constraints

The Acceptance Test Plan only tests the functionality of CryptoSecure as described in the functional requirements. The test cases described in this plan are not concerned with specific design and implementation details of the system. The test cases focus on ensuring the correct system behavior is achieved for the complete set of functions available to users. Testing requires a configured AI provider (OpenAI, Gemini, or Claude) with a valid API key.

---

## 4. Test Assumptions and Exclusions

This section provides greater details about which functions and features of CryptoSecure are and are not covered by the Acceptance Test Plan.

### 4.1 Test Assumptions

The test cases covered in this Acceptance Test Plan are written under the assumption that the related issues are also addressed by unit tests, integration tests, and system tests for CryptoSecure.

The Acceptance Test Plan covers:
- The functional requirements of the application
- The consistency of the user interface and user-facing documentation
- The usability of the system across its primary workflows (upload, analyze, review results, apply fixes, re-analyze, export)

### 4.2 Test Exclusions

It is assumed that unit tests (309 tests across 32 files at ~89% line coverage) exercise areas of the system not covered by the Acceptance Test Plan.

The Acceptance Test Plan does **not** cover:
- Non-functional requirements such as performance benchmarks, scalability, or load testing
- Correctness of AI model outputs (the AI provider is treated as a black box)
- Internal API response caching behavior
- Rate limiting logic (production-only, in-memory)
- The structural integrity or quality of the source code
- Browser compatibility beyond modern Chromium-based browsers

---

## 5. Entry and Exit Criteria

This section lists the criteria that must be satisfied in order for the Acceptance Test Plan to commence, as well as the criteria that must be satisfied to conclude testing.

### 5.1 Entry Criteria

Acceptance testing begins after the following preconditions are met:
- All priority-1 features are implemented by the CryptoSecure development team
- All 309 unit tests pass successfully (`npm test` exits with code 0)
- A proper testing environment is available:
  - Node.js 18+ installed
  - Dependencies installed via `npm install`
  - At least one AI provider API key is configured in `.env.local` (OpenAI, Gemini, or Claude)
  - The development server is running via `npm run dev` and accessible at `https://dev-cryptosecure.vercel.app/`
- The tester has access to sample `.tact` and `.fc`/`.func` smart contract files
- The Test Team Leader has reviewed and approved this test plan

### 5.2 Exit Criteria

The Acceptance Test Plan can end after any of the following conditions are met:
- All test cases were executed and resulted in expected behavior (Success)
- At least one critical-path test case failed to meet the documented specification (Failure — re-test after fix)
- All parties mutually agree to postpone testing until a later date

---

## 6. Testing Participants

This section describes the roles and responsibilities of the parties involved in the Acceptance Test Plan.

### 6.1 Roles and Responsibilities

| Role | Individual(s) |
|------|---------------|
| Test Team Leader | Rishit Epari |
| Testers | Rishit, Epari, Areef Syed |
| Stakeholder | Project Advisor / TON Developer Community |

### 6.2 Training Requirements

All parties involved in the Acceptance Test Plan should:
- Be comfortable with standard web application interfaces
- Understand basic smart contract concepts (especially TON / FunC / Tact)
- Be familiar with the CryptoSecure user interface and its intended workflows
- Have read the CryptoSecure README and feature documentation

### 6.3 Problem Reporting

Any problem found by a tester must be documented and reported via the project's issue tracking system (GitHub Issues). Each reported problem should include:
- Steps to reproduce
- Expected vs. actual behavior
- Screenshot or recording if applicable
- Browser and OS information

Reported problems are to be reviewed by the development team and assigned for resolution.

### 6.4 Progress Reporting

The Acceptance Test Plan Report is to be compiled by the Test Team Leader after the testing process has concluded and one of the exit criteria in Section 5.2 has been satisfied. The report should include a pass/fail status for every test case and notes on any deviations.

---

## 7. Test Cases

### 7.1 Introduction

The test cases below cover all user-facing functionality of CryptoSecure. Each test case includes the following information:

| Field | Description |
|-------|-------------|
| **ID** | A unique identification code for the test case |
| **Name** | A descriptive name of the test |
| **Requirement(s)** | The requirement identifier(s) this test exercises |
| **Description** | A brief overview of the test purpose |
| **Precondition(s)** | The expected state of the software before the actions are executed |
| **Action(s)** | The step(s) to be completed by the tester |
| **Postcondition(s)** | The expected state of the software after the actions are executed |

### 7.2 Test Cases

---

#### 7.2.1 Home Page Navigation

| Field | Value |
|-------|-------|
| **ID** | T7.2.1.1 |
| **Name** | Loading the home page |
| **Requirement(s)** | R1.1, R1.2 |
| **Description** | The user navigates to CryptoSecure and sees the home page. |
| **Precondition(s)** | The development server is running at `https://dev-cryptosecure.vercel.app/`. |
| **Action(s)** | 1. The user opens a web browser and navigates to `https://dev-cryptosecure.vercel.app/`. |
| **Postcondition(s)** | - The home page loads with the CryptoSecure logo in the header. |
| | - The hero section displays the heading "Ship Secure TON Contracts". |
| | - A "Get Started" button is visible in the header. |
| | - An "Audit My Code Now" CTA button is visible in the hero section. |
| | - The MissionControl animation widget is displayed. |

---

| Field | Value |
|-------|-------|
| **ID** | T7.2.1.2 |
| **Name** | Navigating to the auditor page from the home page |
| **Requirement(s)** | R1.2, R1.3 |
| **Description** | The user clicks the CTA button to navigate to the auditor page. |
| **Precondition(s)** | The user is on the home page. |
| **Action(s)** | 1. The user clicks the "Audit My Code Now" button. |
| **Postcondition(s)** | - The browser navigates to `/auditor`. |
| | - The auditor page loads with the CodeAnalyzer component visible. |

---

#### 7.2.2 Auditor Page Navigation

| Field | Value |
|-------|-------|
| **ID** | T7.2.2.1 |
| **Name** | Loading the auditor page |
| **Requirement(s)** | R2.1 |
| **Description** | The user navigates directly to the auditor page. |
| **Precondition(s)** | The development server is running. |
| **Action(s)** | 1. The user navigates to `https://dev-cryptosecure.vercel.app/auditor`. |
| **Postcondition(s)** | - The auditor page loads with the CryptoSecure logo. |
| | - A "Back to Home" button is visible in the header. |
| | - The CodeAnalyzer component is displayed with "Upload" and "Snippet" tabs. |
| | - The "Upload" tab is active by default. |

---

| Field | Value |
|-------|-------|
| **ID** | T7.2.2.2 |
| **Name** | Navigating back to the home page |
| **Requirement(s)** | R2.1, R1.1 |
| **Description** | The user returns to the home page from the auditor page. |
| **Precondition(s)** | The user is on the auditor page. |
| **Action(s)** | 1. The user clicks the "Back to Home" button in the header. |
| **Postcondition(s)** | - The browser navigates to `/`. |
| | - The home page is displayed. |

---

#### 7.2.3 File Upload

| Field | Value |
|-------|-------|
| **ID** | T7.2.3.1 |
| **Name** | Uploading a valid Tact file |
| **Requirement(s)** | R3.1, R3.2 |
| **Description** | The user uploads a valid `.tact` smart contract file. |
| **Precondition(s)** | - The user is on the auditor page. |
| | - The "Upload" tab is active. |
| | - The user has a valid `.tact` file on their local machine. |
| **Action(s)** | 1. The user clicks the upload area or drags a `.tact` file into the drop zone. |
| | 2. The user selects / drops a valid `.tact` file (under 1 MB). |
| **Postcondition(s)** | - The file name is displayed in the upload area. |
| | - The "Scan for Vulnerabilities" button becomes enabled. |
| | - No validation errors are displayed. |

---

| Field | Value |
|-------|-------|
| **ID** | T7.2.3.2 |
| **Name** | Uploading a valid FunC file |
| **Requirement(s)** | R3.1, R3.2 |
| **Description** | The user uploads a valid `.fc` or `.func` smart contract file. |
| **Precondition(s)** | - The user is on the auditor page with the "Upload" tab active. |
| | - The user has a valid `.fc` or `.func` file. |
| **Action(s)** | 1. The user drags or selects a `.fc` / `.func` file (under 1 MB). |
| **Postcondition(s)** | - The file name is displayed. |
| | - The "Scan for Vulnerabilities" button is enabled. |

---

| Field | Value |
|-------|-------|
| **ID** | T7.2.3.3 |
| **Name** | Rejecting an invalid file type |
| **Requirement(s)** | R3.2 |
| **Description** | The user attempts to upload a file with an unsupported extension. |
| **Precondition(s)** | The user is on the auditor page with the "Upload" tab active. |
| **Action(s)** | 1. The user attempts to upload a `.js`, `.sol`, `.txt`, or other unsupported file. |
| **Postcondition(s)** | - An error message is displayed indicating the file type is not supported. |
| | - The "Scan for Vulnerabilities" button remains disabled. |

---

| Field | Value |
|-------|-------|
| **ID** | T7.2.3.4 |
| **Name** | Rejecting an oversized file |
| **Requirement(s)** | R3.3 |
| **Description** | The user attempts to upload a file exceeding the 1 MB size limit. |
| **Precondition(s)** | The user is on the auditor page with the "Upload" tab active. |
| **Action(s)** | 1. The user attempts to upload a `.tact` file that exceeds 1 MB. |
| **Postcondition(s)** | - An error message is displayed indicating the file is too large. |
| | - The "Scan for Vulnerabilities" button remains disabled. |

---

| Field | Value |
|-------|-------|
| **ID** | T7.2.3.5 |
| **Name** | Removing an uploaded file |
| **Requirement(s)** | R3.4 |
| **Description** | The user removes a previously uploaded file. |
| **Precondition(s)** | - The user has successfully uploaded a file. |
| **Action(s)** | 1. The user clicks the remove / clear button next to the uploaded file name. |
| **Postcondition(s)** | - The upload area resets to its initial state. |
| | - The "Scan for Vulnerabilities" button becomes disabled. |

---

#### 7.2.4 Code Snippet Input

| Field | Value |
|-------|-------|
| **ID** | T7.2.4.1 |
| **Name** | Entering a Tact code snippet |
| **Requirement(s)** | R4.1, R4.2 |
| **Description** | The user enters Tact code directly into the snippet editor. |
| **Precondition(s)** | The user is on the auditor page. |
| **Action(s)** | 1. The user clicks the "Snippet" tab. |
| | 2. The user pastes or types valid Tact smart contract code into the textarea. |
| **Postcondition(s)** | - The language is auto-detected and displayed as "Tact". |
| | - The "Scan for Vulnerabilities" button becomes enabled. |

---

| Field | Value |
|-------|-------|
| **ID** | T7.2.4.2 |
| **Name** | Entering a FunC code snippet |
| **Requirement(s)** | R4.1, R4.2 |
| **Description** | The user enters FunC code directly into the snippet editor. |
| **Precondition(s)** | The user is on the auditor page with the "Snippet" tab active. |
| **Action(s)** | 1. The user pastes or types valid FunC smart contract code into the textarea. |
| **Postcondition(s)** | - The language is auto-detected and displayed as "FunC". |
| | - The "Scan for Vulnerabilities" button becomes enabled. |

---

| Field | Value |
|-------|-------|
| **ID** | T7.2.4.3 |
| **Name** | Manual language selection when auto-detect fails |
| **Requirement(s)** | R4.3 |
| **Description** | The user manually selects the language when auto-detection cannot determine it. |
| **Precondition(s)** | The user is on the "Snippet" tab and has entered ambiguous code. |
| **Action(s)** | 1. The user pastes code that cannot be auto-detected. |
| | 2. An error message appears prompting manual language selection. |
| | 3. The user selects "Tact", "FC", or "Func" from the language selector. |
| **Postcondition(s)** | - The error message is cleared. |
| | - The "Scan for Vulnerabilities" button becomes enabled. |

---

#### 7.2.5 Standard Security Analysis

| Field | Value |
|-------|-------|
| **ID** | T7.2.5.1 |
| **Name** | Running a standard security analysis via file upload |
| **Requirement(s)** | R5.1, R5.2, R5.3 |
| **Description** | The user uploads a contract and initiates a security scan. |
| **Precondition(s)** | - The user has uploaded a valid `.tact` or `.fc`/`.func` file. |
| | - An AI provider is configured. |
| **Action(s)** | 1. The user clicks the "Scan for Vulnerabilities" button. |
| **Postcondition(s)** | - A progress stepper is displayed showing the analysis stages. |
| | - After completion, the analysis results panel is displayed. |
| | - The results include a security score (0–100) and letter grade (A–F). |

---

| Field | Value |
|-------|-------|
| **ID** | T7.2.5.2 |
| **Name** | Running a standard security analysis via code snippet |
| **Requirement(s)** | R5.1, R5.2, R5.3 |
| **Description** | The user enters a code snippet and initiates a security scan. |
| **Precondition(s)** | - The user has entered code in the snippet tab with a detected/selected language. |
| | - An AI provider is configured. |
| **Action(s)** | 1. The user clicks the "Scan for Vulnerabilities" button. |
| **Postcondition(s)** | - A progress stepper is displayed with four stages: parsing, analyzing, scanning, generating. |
| | - After completion, the analysis results panel is displayed. |
| | - The results include a security score, grade, executive summary, and findings. |

---

| Field | Value |
|-------|-------|
| **ID** | T7.2.5.3 |
| **Name** | Analysis progress indication |
| **Requirement(s)** | R5.2 |
| **Description** | The progress stepper accurately reflects analysis progress. |
| **Precondition(s)** | A security scan has been initiated. |
| **Action(s)** | 1. The user observes the progress stepper during analysis. |
| **Postcondition(s)** | - The stepper shows four steps: "Parsing contract code", "Analyzing contract logic", "Scanning for vulnerabilities", "Generating security report". |
| | - Each step transitions from inactive to active to completed. |
| | - The scan button shows a loading state during analysis. |

---

#### 7.2.6 Analysis Results Display

| Field | Value |
|-------|-------|
| **ID** | T7.2.6.1 |
| **Name** | Viewing the security score and grade |
| **Requirement(s)** | R6.1, R6.2 |
| **Description** | The user views the overall security score and grade after analysis. |
| **Precondition(s)** | A security analysis has completed successfully. |
| **Action(s)** | 1. The user observes the analysis results panel. |
| **Postcondition(s)** | - A security score between 0 and 100 is displayed. |
| | - A corresponding letter grade (A–F) is displayed. |
| | - An executive summary is visible describing the overall security posture. |

---

| Field | Value |
|-------|-------|
| **ID** | T7.2.6.2 |
| **Name** | Viewing findings grouped by severity |
| **Requirement(s)** | R6.3 |
| **Description** | The user reviews the findings, grouped and color-coded by severity. |
| **Precondition(s)** | Analysis has completed with at least one finding. |
| **Action(s)** | 1. The user scrolls through the findings section of the results. |
| **Postcondition(s)** | - Findings are grouped into severity sections: Critical, High, Medium, Low, Informational. |
| | - Each severity section displays a count of findings. |
| | - Each finding shows: title, description, impact, recommendation, and affected code. |

---

| Field | Value |
|-------|-------|
| **ID** | T7.2.6.3 |
| **Name** | Expanding and collapsing severity sections |
| **Requirement(s)** | R6.3 |
| **Description** | The user toggles the visibility of findings within a severity section. |
| **Precondition(s)** | Analysis has completed with findings in at least one severity group. |
| **Action(s)** | 1. The user clicks the severity section header to collapse it. |
| | 2. The user clicks the severity section header again to expand it. |
| **Postcondition(s)** | - The findings within the section are hidden when collapsed. |
| | - The findings are visible again when expanded. |
| | - The count badge remains visible in both states. |

---

| Field | Value |
|-------|-------|
| **ID** | T7.2.6.4 |
| **Name** | Viewing recommendations |
| **Requirement(s)** | R6.4 |
| **Description** | The user views the prioritized recommendations. |
| **Precondition(s)** | Analysis has completed with at least one recommendation. |
| **Action(s)** | 1. The user scrolls to the recommendations section of the results. |
| **Postcondition(s)** | - Recommendations are displayed with priority levels (High, Medium, Low). |
| | - Each recommendation includes a title, description, and rationale. |

---

| Field | Value |
|-------|-------|
| **ID** | T7.2.6.5 |
| **Name** | Viewing gas optimizations |
| **Requirement(s)** | R6.5 |
| **Description** | The user views gas optimization suggestions. |
| **Precondition(s)** | Analysis has completed and returned gas optimizations. |
| **Action(s)** | 1. The user scrolls to the gas optimizations section. |
| **Postcondition(s)** | - Gas optimization suggestions are displayed. |
| | - Each suggestion includes the location, description, and estimated savings. |

---

#### 7.2.7 Code Diff Viewer

| Field | Value |
|-------|-------|
| **ID** | T7.2.7.1 |
| **Name** | Viewing the code diff in unified mode |
| **Requirement(s)** | R7.1, R7.2 |
| **Description** | The user views the AI-suggested fixes in unified diff mode. |
| **Precondition(s)** | - Analysis has completed with code fixes available. |
| **Action(s)** | 1. The user clicks the "View Fixes" or diff viewer button. |
| **Postcondition(s)** | - The code diff viewer opens in unified mode by default. |
| | - Added lines are highlighted in green. |
| | - Removed lines are highlighted in red. |
| | - Unchanged lines provide context. |

---

| Field | Value |
|-------|-------|
| **ID** | T7.2.7.2 |
| **Name** | Switching to side-by-side diff mode |
| **Requirement(s)** | R7.2 |
| **Description** | The user switches the diff viewer to side-by-side comparison. |
| **Precondition(s)** | The code diff viewer is open in unified mode. |
| **Action(s)** | 1. The user clicks the "Side-by-Side" toggle. |
| **Postcondition(s)** | - The original code is displayed in the left pane. |
| | - The corrected code is displayed in the right pane. |
| | - Modified sections are aligned and highlighted. |

---

| Field | Value |
|-------|-------|
| **ID** | T7.2.7.3 |
| **Name** | Editing the proposed fix |
| **Requirement(s)** | R7.3 |
| **Description** | The user edits the AI-proposed corrected code before applying. |
| **Precondition(s)** | The diff viewer is open with a proposed fix. |
| **Action(s)** | 1. The user clicks the "Edit" button on the corrected code pane. |
| | 2. The user modifies the corrected code in the editor. |
| | 3. The user saves the changes. |
| **Postcondition(s)** | - The corrected code reflects the user's edits. |
| | - The diff view updates to show the user's modifications. |

---

#### 7.2.8 Apply Fixes and Re-Analysis

| Field | Value |
|-------|-------|
| **ID** | T7.2.8.1 |
| **Name** | Applying AI-suggested fixes |
| **Requirement(s)** | R8.1 |
| **Description** | The user applies the AI-suggested fixes to the code. |
| **Precondition(s)** | - Analysis has completed with code fixes. |
| | - The user has reviewed the diff viewer. |
| **Action(s)** | 1. The user clicks the "Apply Fixes" button. |
| **Postcondition(s)** | - The code in the editor is updated with the corrected version. |
| | - The scan button changes to indicate re-analysis is available ("Re-Analyze"). |

---

| Field | Value |
|-------|-------|
| **ID** | T7.2.8.2 |
| **Name** | Running re-analysis on fixed code |
| **Requirement(s)** | R8.2, R8.3 |
| **Description** | The user re-runs the analysis on the patched code. |
| **Precondition(s)** | - The user has applied fixes from a previous analysis. |
| **Action(s)** | 1. The user clicks the "Re-Analyze" / scan button. |
| **Postcondition(s)** | - The progress stepper runs through the analysis stages again. |
| | - New results are displayed with an updated security score and findings. |
| | - The security score is equal to or higher than the previous score if critical issues were resolved. |
| | - Previously fixed issues are no longer listed in the findings. |

---

#### 7.2.9 Hacker Mode

| Field | Value |
|-------|-------|
| **ID** | T7.2.9.1 |
| **Name** | Launching Hacker Mode after standard analysis |
| **Requirement(s)** | R9.1, R9.2 |
| **Description** | The user initiates Hacker Mode adversarial analysis. |
| **Precondition(s)** | - A standard security analysis has completed. |
| | - An AI provider is configured. |
| **Action(s)** | 1. The user clicks the "Hacker Mode" button from the analysis results. |
| **Postcondition(s)** | - A hacker mode progress stepper is displayed with four stages: enumerating attack surfaces, generating exploit strategies, validating attack feasibility, preparing defensive recommendations. |
| | - After completion, the Hacker Mode results panel is displayed. |

---

| Field | Value |
|-------|-------|
| **ID** | T7.2.9.2 |
| **Name** | Hacker Mode progress indication |
| **Requirement(s)** | R9.2 |
| **Description** | The hacker mode progress stepper accurately reflects the multi-stage pipeline. |
| **Precondition(s)** | Hacker Mode analysis has been initiated. |
| **Action(s)** | 1. The user observes the hacker mode progress stepper. |
| **Postcondition(s)** | - The stepper shows: "Enumerating attack surfaces...", "Generating exploit strategies...", "Validating attack feasibility...", "Preparing defensive recommendations...". |
| | - Steps transition from inactive to active to completed. |

---

#### 7.2.10 Hacker Mode Results Display

| Field | Value |
|-------|-------|
| **ID** | T7.2.10.1 |
| **Name** | Viewing the Hacker Resilience Score |
| **Requirement(s)** | R10.1 |
| **Description** | The user views the hacker resilience score and risk level. |
| **Precondition(s)** | Hacker Mode analysis has completed. |
| **Action(s)** | 1. The user observes the Hacker Mode results panel. |
| **Postcondition(s)** | - A Hacker Resilience Score (0–100) is displayed. |
| | - A risk level (None, Low, Medium, High, or Critical) is displayed. |
| | - A summary of attack surfaces and exploits is shown. |

---

| Field | Value |
|-------|-------|
| **ID** | T7.2.10.2 |
| **Name** | Viewing attack surfaces |
| **Requirement(s)** | R10.2 |
| **Description** | The user views the enumerated attack surfaces. |
| **Precondition(s)** | Hacker Mode has completed with at least one attack surface. |
| **Action(s)** | 1. The user scrolls to the attack surfaces section. |
| **Postcondition(s)** | - Each attack surface displays its entry point, risk factors, and notes. |

---

| Field | Value |
|-------|-------|
| **ID** | T7.2.10.3 |
| **Name** | Viewing exploit cards |
| **Requirement(s)** | R10.3 |
| **Description** | The user views the generated exploit attempts. |
| **Precondition(s)** | Hacker Mode has completed with at least one exploit. |
| **Action(s)** | 1. The user scrolls to the exploits section. |
| **Postcondition(s)** | - Each exploit card displays: title, type, severity, likelihood, status (plausible / theoretical / not-applicable), steps, expected impact, and prerequisites. |
| | - Status badges are color-coded. |

---

| Field | Value |
|-------|-------|
| **ID** | T7.2.10.4 |
| **Name** | Viewing defensive recommendations |
| **Requirement(s)** | R10.4 |
| **Description** | The user views the defensive recommendations from Hacker Mode. |
| **Precondition(s)** | Hacker Mode has completed with at least one plausible exploit. |
| **Action(s)** | 1. The user scrolls to the recommendations section of the Hacker Mode results. |
| **Postcondition(s)** | - Each recommendation includes a mitigation strategy. |
| | - Code examples are provided where applicable. |
| | - TON-specific notes are highlighted where applicable. |

---

#### 7.2.11 PDF Report Export

| Field | Value |
|-------|-------|
| **ID** | T7.2.11.1 |
| **Name** | Exporting a standard audit PDF report |
| **Requirement(s)** | R11.1 |
| **Description** | The user downloads a PDF audit report after standard analysis. |
| **Precondition(s)** | A standard security analysis has completed. |
| **Action(s)** | 1. The user clicks the "Download PDF" / export button. |
| **Postcondition(s)** | - A PDF file is downloaded to the user's machine. |
| | - The PDF contains: security score, grade, executive summary, all findings with severity, recommendations, and code changes. |

---

| Field | Value |
|-------|-------|
| **ID** | T7.2.11.2 |
| **Name** | Exporting a Hacker Mode PDF report |
| **Requirement(s)** | R11.2 |
| **Description** | The user downloads a PDF report for the Hacker Mode results. |
| **Precondition(s)** | A Hacker Mode analysis has completed. |
| **Action(s)** | 1. The user clicks the Hacker Mode "Download PDF" / export button. |
| **Postcondition(s)** | - A PDF file is downloaded to the user's machine. |
| | - The PDF contains: resilience score, risk level, attack surfaces, exploits, and defensive recommendations. |

---

#### 7.2.12 Sample Contracts

| Field | Value |
|-------|-------|
| **ID** | T7.2.12.1 |
| **Name** | Loading a sample vulnerable contract |
| **Requirement(s)** | R12.1 |
| **Description** | The user loads one of the pre-built sample vulnerable contracts. |
| **Precondition(s)** | The user is on the auditor page. |
| **Action(s)** | 1. The user clicks a sample contract button (if available in the UI). |
| **Postcondition(s)** | - The code editor is populated with sample contract code. |
| | - The language is auto-detected. |
| | - The "Scan for Vulnerabilities" button is enabled. |

---

#### 7.2.13 Error Handling

| Field | Value |
|-------|-------|
| **ID** | T7.2.13.1 |
| **Name** | Analysis when AI provider is not configured |
| **Requirement(s)** | R13.1 |
| **Description** | The user attempts to run analysis without a configured AI provider. |
| **Precondition(s)** | - No AI provider API key is set in `.env.local`. |
| | - The user has uploaded or entered code. |
| **Action(s)** | 1. The user clicks "Scan for Vulnerabilities". |
| **Postcondition(s)** | - An error message is displayed indicating the AI provider is not configured. |
| | - The user is prompted to configure an API key. |

---

| Field | Value |
|-------|-------|
| **ID** | T7.2.13.2 |
| **Name** | Handling AI provider errors |
| **Requirement(s)** | R13.2 |
| **Description** | The system gracefully handles errors from the AI provider (invalid key, network failure, etc.). |
| **Precondition(s)** | - An invalid or expired AI provider API key is configured. |
| | - The user has entered code. |
| **Action(s)** | 1. The user clicks "Scan for Vulnerabilities". |
| **Postcondition(s)** | - An error message is displayed with details about the failure. |
| | - A hint to check the API key is provided. |
| | - The user can retry after fixing the configuration. |

---

| Field | Value |
|-------|-------|
| **ID** | T7.2.13.3 |
| **Name** | Scanning with empty code input |
| **Requirement(s)** | R13.3 |
| **Description** | The user attempts to scan without providing any code. |
| **Precondition(s)** | - The user is on the auditor page. |
| | - No file is uploaded and no snippet is entered. |
| **Action(s)** | 1. The user observes the "Scan for Vulnerabilities" button state. |
| **Postcondition(s)** | - The "Scan for Vulnerabilities" button is disabled. |
| | - The user cannot initiate an analysis. |

---

## 8. Traceability Matrix

| Requirement | Description | Test Cases |
|-------------|-------------|------------|
| **R1 — Home Page** | | |
| R1.1 | Home page loads with branding and MissionControl | T7.2.1.1 |
| R1.2 | CTA navigation to auditor page | T7.2.1.1, T7.2.1.2 |
| R1.3 | "Get Started" button navigation | T7.2.1.2 |
| **R2 — Auditor Page** | | |
| R2.1 | Auditor page layout with CodeAnalyzer | T7.2.2.1, T7.2.2.2 |
| **R3 — File Upload** | | |
| R3.1 | Upload accepts `.tact`, `.fc`, `.func` files | T7.2.3.1, T7.2.3.2 |
| R3.2 | Rejects unsupported file types | T7.2.3.3 |
| R3.3 | Rejects files over 1 MB | T7.2.3.4 |
| R3.4 | Remove / clear uploaded file | T7.2.3.5 |
| **R4 — Code Snippet Input** | | |
| R4.1 | Snippet tab accepts code input | T7.2.4.1, T7.2.4.2 |
| R4.2 | Auto-detect language (Tact / FunC) | T7.2.4.1, T7.2.4.2 |
| R4.3 | Manual language selection fallback | T7.2.4.3 |
| **R5 — Standard Security Analysis** | | |
| R5.1 | Initiates analysis on button click | T7.2.5.1, T7.2.5.2 |
| R5.2 | Progress stepper shows analysis stages | T7.2.5.1, T7.2.5.2, T7.2.5.3 |
| R5.3 | Returns security score, grade, and findings | T7.2.5.1, T7.2.5.2 |
| **R6 — Analysis Results Display** | | |
| R6.1 | Displays security score (0–100) | T7.2.6.1 |
| R6.2 | Displays letter grade (A–F) | T7.2.6.1 |
| R6.3 | Findings grouped by severity with expand/collapse | T7.2.6.2, T7.2.6.3 |
| R6.4 | Prioritized recommendations displayed | T7.2.6.4 |
| R6.5 | Gas optimization suggestions displayed | T7.2.6.5 |
| **R7 — Code Diff Viewer** | | |
| R7.1 | Unified diff view with color-coded lines | T7.2.7.1 |
| R7.2 | Side-by-side diff comparison toggle | T7.2.7.1, T7.2.7.2 |
| R7.3 | Editable proposed fix | T7.2.7.3 |
| **R8 — Apply Fixes and Re-Analysis** | | |
| R8.1 | Apply AI-suggested fixes to source | T7.2.8.1 |
| R8.2 | Re-analysis with previous findings context | T7.2.8.2 |
| R8.3 | Score improves after fixing critical issues | T7.2.8.2 |
| **R9 — Hacker Mode** | | |
| R9.1 | Launch Hacker Mode from results | T7.2.9.1 |
| R9.2 | Four-stage progress stepper | T7.2.9.1, T7.2.9.2 |
| **R10 — Hacker Mode Results** | | |
| R10.1 | Hacker Resilience Score and risk level | T7.2.10.1 |
| R10.2 | Attack surface enumeration display | T7.2.10.2 |
| R10.3 | Exploit cards with status badges | T7.2.10.3 |
| R10.4 | Defensive recommendations | T7.2.10.4 |
| **R11 — PDF Export** | | |
| R11.1 | Download standard audit PDF report | T7.2.11.1 |
| R11.2 | Download Hacker Mode PDF report | T7.2.11.2 |
| **R12 — Sample Contracts** | | |
| R12.1 | Load pre-built sample contracts | T7.2.12.1 |
| **R13 — Error Handling** | | |
| R13.1 | AI provider not configured error | T7.2.13.1 |
| R13.2 | AI provider failure error with hint | T7.2.13.2 |
| R13.3 | Disabled scan button when no code | T7.2.13.3 |
