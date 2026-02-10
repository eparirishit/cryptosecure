import { Vulnerability, LegacySeverity } from "@/types/analysis";
import { RULES } from "./rules";
import { mapFunctions } from "./utils";

export interface StaticAnalysisResult {
  vulnerabilities: Vulnerability[];
  summary: string;
  score: number;
  stats: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
  patchedCode: string;
}

function mapSeverity(s: string): LegacySeverity {
  switch(s) {
    case "CRITICAL": return "Critical";
    case "HIGH": return "High";
    case "MEDIUM": return "Medium";
    case "LOW": return "Low";
    case "INFORMATIONAL": return "Info";
    default: return "Info";
  }
}

export function analyzeCodeStatic(rawCode: string): StaticAnalysisResult {
  const cleanCode = rawCode;
  const codeLines = rawCode.split("\n"); 
  const functionMap = mapFunctions(rawCode);
  const vulnerabilities: Vulnerability[] = [];

  let score = 100;

  // Helper to find function for a line
  const findFunction = (lineNo: number) => {
    return functionMap.find(f => lineNo >= f.startLine && lineNo <= f.endLine)?.name;
  };

  // Helper to extract snippet
  const getSnippet = (lineNo: number) => {
      if (lineNo <= 0 || lineNo > codeLines.length) return undefined;
      // Return the specific line + optionally context
      return codeLines[lineNo - 1].trim();
  };

  // 1. Check specific Rules
  for (const rule of RULES) {
    const matches = rule.pattern.test(cleanCode);
    
    const isVulnerable = rule.invert ? !matches : matches;

    if (isVulnerable) {
      // Deduct score
      switch (rule.severity) {
        case "CRITICAL": score -= 25; break;
        case "HIGH": score -= 15; break;
        case "MEDIUM": score -= 10; break;
        case "LOW": score -= 5; break;
        case "INFORMATIONAL": score -= 0; break;
      }

      let lineNo = 0; // 0 indicates "General/Global"
      let funcName: string | undefined = undefined;
      let affectedCode: string | undefined = undefined;

      if (!rule.invert) {
        // Rule found a BAD pattern. Locate it.
        for (let i = 0; i < codeLines.length; i++) {
            const lineClean = codeLines[i];
            if (rule.pattern.test(lineClean)) {
                lineNo = i + 1;
                funcName = findFunction(lineNo);
                affectedCode = getSnippet(lineNo);
                break; // Just report the first occurrence for now
            }
        }
      } else {
          // Rule missed a GOOD pattern (Inverted).
          // E.g. Missing Bounced Check
          lineNo = 1; 
          if (rule.id === "FUNC_BOUNCED_CHECK") {
             const recv = functionMap.find(f => f.name === "recv_internal");
             if (recv) {
                 lineNo = recv.startLine;
                 funcName = recv.name;
                 affectedCode = `// Missing checks in ${recv.name}`;
             }
          } else if (rule.id === "FUNC_OWNER_CHECK") {
              // If global owner check missing, maybe point to a sensitive function found
              const sensitive = functionMap.find(f => f.name.includes("withdraw") || f.name.includes("admin"));
              if (sensitive) {
                  lineNo = sensitive.startLine;
                  funcName = sensitive.name;
                  affectedCode = `// Missing auth in ${sensitive.name}`;
              }
          }
      }

      vulnerabilities.push({
        line: lineNo,
        severity: mapSeverity(rule.severity),
        title: rule.title,
        description: rule.description,
        scenario: rule.scenario,
        suggestion: rule.suggestion,
        function: funcName,
        affectedCode: affectedCode
      });
    }
  }
  
  // TipJar specific logic override
  const hasWithdraw = /total_balance\s*-=/.test(cleanCode);
  const hasAuth = /equal_slices/.test(cleanCode);
  
  if (hasWithdraw && !hasAuth) {
     const exists = vulnerabilities.find(v => v.title === "Potential Unprotected Withdrawal");
     if (!exists) {
         // Try to find line for total_balance -=
         let lineNo = 0;
         let funcName = undefined;
         let affectedCode = undefined;
         for(let i=0; i<codeLines.length; i++) {
             if(/total_balance\s*-=/.test(codeLines[i])) {
                 lineNo = i+1;
                 funcName = findFunction(lineNo);
                 affectedCode = getSnippet(lineNo);
                 break;
             }
         }

         vulnerabilities.push({
             line: lineNo,
             severity: "Critical",
             title: "Potential Unprotected Withdrawal",
             description: "Funds are subtracted from total_balance, but no owner authentication (equal_slices) was detected.",
             scenario: "The contract subtracts from `total_balance` based on a user request (op=2). However, no `throw_unless` checks the sender's identity. Any user can simply request a withdrawal and drain the pot.",
             suggestion: "Add access control checks immediately.",
             function: funcName,
             affectedCode: affectedCode
         });
         score -= 30;
     }
  } else if (hasWithdraw && hasAuth) {
      const index = vulnerabilities.findIndex(v => v.title === "Potential Unprotected Withdrawal");
      if (index !== -1) {
          vulnerabilities.splice(index, 1);
          score += 25;
      }
  }

  // 2. Generate Auto-Fix Patch
  let patchedLines = [...codeLines];
  // Sort vulnerabilities by line number (descending) to avoid offset issues when inserting lines
  const sortedVulns = [...vulnerabilities].sort((a, b) => b.line - a.line);

  for (const vuln of sortedVulns) {
      if (vuln.line <= 0) continue;

      if (vuln.title === "Potential Unprotected Withdrawal" || vuln.title === "Missing Owner Access Control") {
          // Heuristic: Insert check BEFORE the vulnerable line
          const insertLineIndex = vuln.line - 1; // 0-based index
          const indentation = patchedLines[insertLineIndex].match(/^\s*/)?.[0] || "";
          const fixLine = `${indentation}throw_unless(401, equal_slices(sender_address, owner_address)); ;; Auto-fixed security check`;
          patchedLines.splice(insertLineIndex, 0, fixLine);
      } 
      else if (vuln.title === "Missing Bounced Message Check") {
          // Heuristic: Insert check at start of function (usually line + 1 for opening brace)
          // line is likely the function definition line
          // We try to find the opening brace
          let insertLineIndex = vuln.line; // Default to next line
          // Check if brace is on same line
          if (patchedLines[vuln.line-1].includes("{")) {
             insertLineIndex = vuln.line;
          } else {
              // Maybe brace is on next line? Just default to next for now.
          }
          
          const indentation = "    "; // Default indent
          const fixLine = `${indentation}if (flags & 1) { return (); } ;; Auto-fixed bounced check`;
          patchedLines.splice(insertLineIndex, 0, fixLine);
      }
      else if (vuln.title === "Unchecked Message Sending") {
         // Heuristic: Replace mode 0/1/2 with 64
         // Find the line with send_raw_message
         const lineIndex = vuln.line - 1;
         const originalLine = patchedLines[lineIndex];
         // Replace the mode argument
         const fixedLine = originalLine.replace(/(send_raw_message\s*\(\s*[^,]+,\s*)(0|1|2)(\s*\))/, "$164$3");
         
         // If replacement happened, update line
         if (fixedLine !== originalLine) {
             patchedLines[lineIndex] = fixedLine + " ;; Auto-fixed to mode 64";
         }
      }
  }

  const patchedCode = patchedLines.join("\n");

  // Calculate Stats
  const stats = {
      total: vulnerabilities.length,
      critical: vulnerabilities.filter(v => v.severity === "Critical").length,
      high: vulnerabilities.filter(v => v.severity === "High").length,
      medium: vulnerabilities.filter(v => v.severity === "Medium").length,
      low: vulnerabilities.filter(v => v.severity === "Low").length,
      info: vulnerabilities.filter(v => v.severity === "Info").length
  };

  return {
    vulnerabilities,
    summary: `Static analysis completed. Found ${vulnerabilities.length} potential issues.`,
    score: Math.max(0, Math.round(score)),
    stats,
    patchedCode
  };
}
