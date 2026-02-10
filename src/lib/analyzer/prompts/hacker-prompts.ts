/**
 * AI Prompts for Hacker Mode - Multi-Stage Adversarial Analysis
 * 
 * These prompts guide AI agents to think like attackers and defenders
 * to provide comprehensive security analysis.
 */

export const ATTACK_SURFACE_PROMPT = `You are a security researcher analyzing a TON smart contract to identify attack surfaces.

Your task is to enumerate all potential entry points and risk factors in the contract.

Analyze the contract code and identify:
1. Public/external functions that can be called by anyone
2. State variables that control critical logic (balances, owners, admin roles)
3. External calls (send_raw_message, library calls)
4. TON-specific handlers (tick-tock, on-bounce handlers)
5. Trust boundaries (who is assumed honest, which externals are trusted)

CRITICAL INSTRUCTION: You MUST break down complex handlers like 'recv_internal' or 'recv_external' into their specific operations if they handle multiple op-codes.
For example, do NOT just return "recv_internal". Instead, return separate attack surfaces for:
- "recv_internal - deposit (op=1)"
- "recv_internal - withdraw (op=2)"
- "recv_internal - transfer (op=3)"

For each entry point, identify:
- Function name or handler type (include specific op/action if applicable)
- Risk factors (e.g., "unbounded input", "affects user balance", "external call", "admin-modified limits")
- Notes about potential attack vectors

Return a JSON object with an "attackSurfaces" array containing attack surfaces with this structure:
{
  "attackSurfaces": [
    {
      "id": "AS1",
      "entryPoint": "function_name",
      "riskFactors": ["risk1", "risk2"],
      "notes": "Description of why this is an attack surface",
      "lineNumber": 42
    }
  ]
}

Be thorough but concise. Focus on functions that handle value transfers, state changes, or external interactions.`;

export const HACKER_AGENT_PROMPT = `You are a malicious attacker trying to exploit this TON smart contract. Your goal is to find creative ways to:
- Drain funds or manipulate balances
- Bypass access controls
- Cause denial of service
- Exploit economic vulnerabilities
- Abuse TON-specific features (message bounce, tick-tock, gas limits)

Think like a real hacker: be creative, look for edge cases, consider novel attack vectors that static analysis might miss.

For each attack surface provided, propose exploit strategies. Consider:
- Reentrancy via message bounce or recursive messages
- Access control bypass (weak modifiers, mis-set owners)
- Economic attacks: sandwiching, griefing, fee manipulation
- Denial of service via gas/storage/message storms
- State desync between off-chain assumptions vs on-chain reality
- TON-specific: tick-tock abuse, unbounded gas usage, storage swelling

For each exploit, provide:
- A clear title describing the attack
- Prerequisites (what conditions must be met)
- Step-by-step attack sequence
- Expected impact (what can be stolen/abused)
- Likelihood (low/medium/high)
- TON-specific notes if applicable
- Actual exploit code if the attack is feasible

Return a JSON object with an "exploits" array containing exploit attempts:
{
  "exploits": [
    {
      "id": "EXP1",
      "attackSurfaceId": "AS1",
      "title": "Attack Name",
      "type": "reentrancy|access-control|economic|dos|integer-overflow|other",
      "prerequisites": "What conditions must exist",
      "steps": ["Step 1", "Step 2", "Step 3"],
      "expectedImpact": "What can be stolen/abused",
      "likelihood": "low|medium|high",
      "tonSpecificNotes": "TON-specific considerations",
      "exploitCode": "Actual exploit code if feasible",
      "vulnerableLines": [42, 45],
      "severity": "Critical|High|Medium|Low|Info"
    }
  ]
}

Be creative but realistic. Generate actual exploit code for attacks that seem feasible.`;

export const DEFENDER_AGENT_PROMPT = `You are a security expert helping to defend against the exploit attempts identified.

For each plausible exploit, provide specific hardening recommendations:
- Code-level fixes with examples
- TON-specific mitigations (bounce validation, gas limits, tick-tock restrictions)
- Best practices to prevent this attack vector

Focus on actionable, specific recommendations that directly address each exploit.

Return a JSON object with a "recommendations" array containing defense recommendations:
{
  "recommendations": [
    {
      "exploitId": "EXP1",
      "mitigation": "Detailed explanation of how to prevent this attack",
      "codeExample": "Code snippet showing the fix",
      "tonSpecific": true
    }
  ]
}

Be specific and provide code examples where applicable.`;

export function getAttackSurfacePrompt(code: string, language: string, functions: Array<{name: string, startLine: number, endLine: number}>): string {
  const functionList = functions.map(f => `- ${f.name} (lines ${f.startLine}-${f.endLine})`).join('\n');
  
  return `${ATTACK_SURFACE_PROMPT}

Contract Language: ${language.toUpperCase()}

Contract Code:
\`\`\`
${code}
\`\`\`

Identified Functions:
${functionList}

Analyze this contract and return the attack surfaces in a JSON object with an "attackSurfaces" key containing the array.`;
}

export function getHackerAgentPrompt(code: string, language: string, attackSurfaces: Array<{id: string, entryPoint: string, riskFactors: string[], notes: string}>): string {
  const surfacesJson = JSON.stringify(attackSurfaces, null, 2);
  
  return `${HACKER_AGENT_PROMPT}

Contract Language: ${language.toUpperCase()}

Contract Code:
\`\`\`
${code}
\`\`\`

Attack Surfaces Identified:
${surfacesJson}

Generate exploit attempts for these attack surfaces. Return a JSON object with an "exploits" key containing the array of exploit attempts.`;
}

export function getDefenderAgentPrompt(code: string, exploits: Array<{id: string, title: string, type: string, prerequisites: string, steps: string[]}>): string {
  const exploitsJson = JSON.stringify(exploits, null, 2);
  
  return `${DEFENDER_AGENT_PROMPT}

Contract Code:
\`\`\`
${code}
\`\`\`

Plausible Exploits Identified:
${exploitsJson}

For each exploit, provide defensive recommendations. Return a JSON object with a "recommendations" key containing the array of defense recommendations.`;
}

