# CryptoSecure - AI-Powered Smart Contract Security Scanner

An AI-powered security tool that analyzes TON smart contracts in seconds, identifies vulnerabilities, and provides actionable fixes—making blockchain security accessible to every developer.

---

## Problem Statement

The TON blockchain is experiencing explosive growth with integration into Telegram's 900+ million users, but this rapid expansion has created a critical security crisis:

- **14,995 vulnerabilities** were recently discovered across just 1,640 TON smart contracts (9+ bugs per contract on average)
- Smart contract bugs have led to **hundreds of millions of dollars stolen** across blockchain ecosystems
- Professional security audits cost **$10,000-$50,000** and take **2-4 weeks**, making them inaccessible to most developers
- Existing automated tools only catch syntax errors, missing critical semantic vulnerabilities
- Most TON developers lack security expertise, yet handle contracts managing real money

**The Result:** Developers launch vulnerable contracts, hackers exploit them, and users lose funds—undermining trust in the entire ecosystem.

---

## Our Solution

**CryptoSecure** is an AI-powered security scanner that democratizes smart contract security by:

1. **Instant Analysis** - Scans FunC/Tact smart contracts in under 30 seconds (vs. weeks for manual audits)
2. **Comprehensive Detection** - Identifies 8+ vulnerability types including reentrancy, access control issues, integer overflow, unchecked returns, and TON-specific defects
3. **Plain English Explanations** - Translates technical vulnerabilities into understandable language with real-world impact descriptions
4. **Actionable Fixes** - Provides line-by-line recommendations and secure code alternatives
5. **Free Access** - Makes professional-grade security analysis available to every developer

**How It Works:**
```
Developer uploads contract code → AI analyzes against vulnerability database → 
Generates security score (0-100) → Highlights critical issues → 
Suggests specific fixes → Developer implements improvements
```

---

## Target Users

**Primary:** TON smart contract developers (DeFi protocols, NFT projects, dApps, DAOs)
**Secondary:** Project teams conducting pre-deployment checks, auditors for preliminary screening, educational institutions teaching blockchain security

---

## Key Features (MVP)

1. **Smart Contract Upload** - Support for FunC and Tact languages via file upload or code paste
2. **AI-Powered Analysis Engine** - Leverages Claude AI to detect semantic vulnerabilities beyond basic syntax checking
3. **Security Score Dashboard** - Visual 0-100 security rating with breakdown by severity (Critical, High, Medium, Low)
4. **Vulnerability Report** - Detailed findings with:
   - Issue description in plain language
   - Affected code lines
   - Potential exploit scenarios
   - Remediation steps with code examples
5. **Sample Vulnerable Contracts** - Pre-loaded test cases for demonstration
6. **Comparison View** - Before/after code showing secure alternatives

---

## Setup Instructions

### Prerequisites
- Node.js 18+ installed

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   
   Create a `.env.local` file in the root directory:
   ```bash
   OPENAI_API_KEY=your_openai_api_key_here
   CLAUDE_API_KEY=your_claude_api_key_here
   ```
   
   Get your OpenAI API key from: https://platform.openai.com/api-keys
   
   **Note:** The regular security scan works without an API key, but Hacker Mode requires it.

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to `http://localhost:3000`

## Technology Stack

**Frontend:**
- React.js for user interface
- Recharts for security score visualization
- Lucide React for icons
- Tailwind CSS for styling

**Backend/AI:**
- OpenAI GPT-4o & Claude Sonnet API for AI-powered analysis
- Custom vulnerability database based on TONScanner research
- Static analysis engine for initial vulnerability detection

**Deployment:**
- Vercel for hosting
- GitHub for version control


## Why This Matters

Smart contract vulnerabilities aren't just technical bugs—they represent real money at risk and eroded trust in blockchain technology. By making security analysis accessible, fast, and educational, CryptoSecure empowers developers to build safer applications, protects users from financial loss, and strengthens the entire TON ecosystem.

As TON aims to onboard 500 million users by 2027, security cannot be an afterthought or a luxury only large projects can afford. **Every developer deserves access to world-class security tools.**

