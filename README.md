
# CryptoSecure — AI-Powered Smart Contract Security Scanner

An AI-powered security tool that analyzes TON smart contracts in seconds, identifies vulnerabilities, and provides actionable fixes—making blockchain security accessible to every developer.

---

## Problem Statement

The TON blockchain is experiencing explosive growth with integration into Telegram's 900+ million users, but this rapid expansion has created a critical security crisis:

- **14,995 vulnerabilities** were recently discovered across just 1,640 TON smart contracts (9+ bugs per contract on average)
- Smart contract bugs have led to **hundreds of millions of dollars stolen** across blockchain ecosystems
- Professional security audits cost **$10,000–$50,000** and take **2–4 weeks**, making them inaccessible to most developers
- Existing automated tools only catch syntax errors, missing critical semantic vulnerabilities
- Most TON developers lack security expertise, yet handle contracts managing real money

**The Result:** Developers launch vulnerable contracts, hackers exploit them, and users lose funds—undermining trust in the entire ecosystem.

---

## Our Solution

**CryptoSecure** is an AI-powered security scanner that democratizes smart contract security by:

1. **Instant Analysis** — Scans FunC/Tact smart contracts in under 60 seconds (vs. weeks for manual audits)
2. **Comprehensive Detection** — Identifies 8+ vulnerability types including reentrancy, access control issues, integer overflow, unchecked returns, and TON-specific defects
3. **Plain English Explanations** — Translates technical vulnerabilities into understandable language with real-world impact descriptions
4. **Actionable Fixes** — Provides line-by-line recommendations and secure code alternatives with a side-by-side diff view
5. **Hacker Mode** — Adversarial multi-stage AI pipeline that simulates real attacks: enumerates attack surfaces, generates exploit strategies, validates feasibility, and produces a Hacker Resilience Score
6. **Iterative Re-Analysis** — Apply AI-suggested fixes and re-run the audit on the patched code; the score is guaranteed to improve if critical issues were resolved
7. **PDF Audit Reports** — Export a complete audit report as a PDF for sharing or compliance purposes

**How It Works:**
```
Developer uploads contract → AI analyzes against vulnerability patterns →
Security score (0–100) + grade (A–F) generated → Critical issues highlighted →
Line-by-line fixes suggested → Developer applies fixes → Re-analysis confirms improvement
```

---

## Target Users

**Primary:** TON smart contract developers (DeFi protocols, NFT projects, dApps, DAOs)  
**Secondary:** Project teams conducting pre-deployment checks, auditors for preliminary screening, educational institutions teaching blockchain security

---

## Key Features

1. **Smart Contract Upload** — Support for FunC and Tact languages via file upload or direct code paste
2. **AI-Powered Analysis Engine** — Multi-provider AI (OpenAI, Gemini, Claude) detects semantic vulnerabilities beyond basic syntax checking
3. **Security Score Dashboard** — Visual 0–100 security rating with letter grade (A–F) and breakdown by severity (Critical, High, Medium, Low, Informational)
4. **Vulnerability Report** — Detailed findings with:
   - Issue description in plain language
   - Affected code lines and function name
   - Potential exploit scenarios
   - Remediation steps with before/after code examples
5. **Side-by-Side Diff Viewer** — Synchronized code comparison between the original and AI-corrected contract
6. **Hacker Mode** — Four-stage adversarial analysis pipeline:
   - Stage 1: Attack surface enumeration
   - Stage 2: Exploit strategy generation
   - Stage 3: Feasibility validation
   - Stage 4: Defensive recommendation synthesis
7. **Iterative Re-Analysis** — Re-audit patched code with context from previous findings to verify fixes and surface remaining issues
8. **PDF Report Export** — Downloadable audit and Hacker Mode reports for sharing or compliance
9. **Sample Vulnerable Contracts** — Pre-loaded test cases for demonstration

---

## Setup Instructions

### Prerequisites
- Node.js 18+

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure an AI provider:**

   Create a `.env.local` file in the root directory with **one** of the following:

   ```bash
   # Option A — OpenAI
   OPENAI_API_KEY=your_openai_api_key_here

   # Option B — Google Gemini
   GEMINI_API_KEY=your_gemini_api_key_here

   # Option C — Anthropic Claude
   CLAUDE_API_KEY=your_claude_api_key_here
   ```

   The app auto-detects whichever key is present (OpenAI is checked first, then Gemini, then Claude). You only need **one** key. All features including Hacker Mode require a configured provider.

   | Provider | Default Model |
   |----------|--------------|
   | OpenAI   | `gpt-4.1-2025-04-14` |
   | Gemini   | `gemini-2.5-pro` |
   | Claude   | `claude-sonnet-4-20250514` |

   Override the model via `OPENAI_MODEL`, `GEMINI_MODEL`, or `CLAUDE_MODEL` env vars.

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to `http://localhost:3000`

---

## Testing

| Command | Description |
|---------|-------------|
| `npm test` | Run the full test suite once |
| `npm run test:watch` | Run tests in watch mode (re-runs on file changes) |
| `npm run test:coverage` | Run tests with coverage report |

---

## Technology Stack

**Frontend:**
- Next.js 15 (App Router) + TypeScript
- Tailwind CSS + shadcn/ui component library
- Lucide React for icons
- `@react-pdf/renderer` for PDF report generation
- `diff` library for side-by-side code comparison

**Backend / AI:**
- Next.js API Routes (serverless)
- Multi-provider AI support: OpenAI GPT-4.1, Google Gemini 2.5 Pro, Anthropic Claude Sonnet
- Custom static analysis engine for rule-based vulnerability detection
- In-memory response caching (SHA-256 keyed) to avoid redundant API calls
- In-memory rate limiting for Hacker Mode in production

**Deployment:**
- Vercel for hosting
- GitHub for version control

---

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── analyze/route.ts   # Standard audit API endpoint
│   │   └── hack/route.ts      # Hacker Mode API endpoint
│   └── page.tsx
├── components/                # UI components (analyzer, diff viewer, results, etc.)
├── lib/
│   ├── analyzer/
│   │   ├── analyze/           # Standard audit pipeline (prompts, rules, engine)
│   │   ├── hacker/            # Hacker Mode pipeline (attack surface, exploits, defense)
│   │   ├── ai-providers.ts    # Multi-provider AI abstraction
│   │   ├── ai-response.ts     # Shared JSON extraction helper
│   │   └── utils.ts           # FunC/Tact code parsing utilities
│   ├── utils/                 # Client-side utilities (code, language, severity)
│   └── constants.ts           # App-wide constants
└── types/
    └── analysis.ts            # Shared TypeScript types
```

---

## Why This Matters

Smart contract vulnerabilities aren't just technical bugs—they represent real money at risk and eroded trust in blockchain technology. By making security analysis accessible, fast, and educational, CryptoSecure empowers developers to build safer applications, protects users from financial loss, and strengthens the entire TON ecosystem.

As TON aims to onboard 500 million users by 2027, security cannot be an afterthought or a luxury only large projects can afford. **Every developer deserves access to world-class security tools.**
