import { ExploitAttempt } from "@/types/analysis";
import { mapFunctions } from "./utils";

/**
 * Validates exploit attempts against actual contract structure
 * Filters out impossible exploits and marks others as plausible/theoretical
 */
export function validateExploitFeasibility(
  exploits: ExploitAttempt[],
  code: string
): ExploitAttempt[] {
  const functions = mapFunctions(code);
  const functionNames = functions.map(f => f.name.toLowerCase());
  const codeLower = code.toLowerCase();
  
  return exploits.map(exploit => {
    // Check if referenced functions exist
    const referencedFunctions = extractReferencedFunctions(exploit, code);
    const allFunctionsExist = referencedFunctions.every(funcName => 
      functionNames.includes(funcName.toLowerCase())
    );
    
    // Check if prerequisites are possible
    const prerequisitesPossible = checkPrerequisites(exploit.prerequisites, code, functions);
    
    // Check if exploit steps reference valid code patterns
    const stepsValid = validateExploitSteps(exploit.steps, code);
    
    // Determine status
    let status: "plausible" | "theoretical" | "not-applicable" = "theoretical";
    
    if (!allFunctionsExist) {
      status = "not-applicable";
    } else if (prerequisitesPossible && stepsValid) {
      status = "plausible";
    } else if (prerequisitesPossible || stepsValid) {
      status = "theoretical";
    } else {
      status = "not-applicable";
    }
    
    return {
      ...exploit,
      status
    };
  });
}

/**
 * Extract function names referenced in exploit
 */
function extractReferencedFunctions(exploit: ExploitAttempt, code: string): string[] {
  const functions: string[] = [];
  const text = `${exploit.title} ${exploit.prerequisites} ${exploit.steps.join(' ')} ${exploit.expectedImpact}`.toLowerCase();
  
  // Common function name patterns
  const functionPatterns = [
    /call\s+(\w+)/g,
    /invoke\s+(\w+)/g,
    /(\w+)\s*\(/g,
  ];
  
  // Also check against actual function names in code
  const codeFunctions = mapFunctions(code);
  for (const func of codeFunctions) {
    if (text.includes(func.name.toLowerCase())) {
      functions.push(func.name);
    }
  }
  
  return [...new Set(functions)];
}

/**
 * Check if prerequisites are possible given the contract code
 */
function checkPrerequisites(
  prerequisites: string,
  code: string,
  functions: Array<{name: string, startLine: number, endLine: number}>
): boolean {
  if (!prerequisites || prerequisites.trim() === "") {
    return true; // No prerequisites means always possible
  }
  
  const prereqLower = prerequisites.toLowerCase();
  const codeLower = code.toLowerCase();
  
  // Check for common impossible prerequisites
  const impossiblePatterns = [
    /function.*doesn't exist/i,
    /variable.*is immutable/i,
    /cannot.*be called/i,
  ];
  
  for (const pattern of impossiblePatterns) {
    if (pattern.test(prerequisites)) {
      return false;
    }
  }
  
  // Check if prerequisites mention functions that exist
  const mentionedFunctions = functions.filter(f => 
    prereqLower.includes(f.name.toLowerCase())
  );
  
  // If prerequisites mention specific functions, they should exist
  if (mentionedFunctions.length > 0) {
    return true; // Functions exist, prerequisites might be possible
  }
  
  // Check for state variable references
  const stateVarPatterns = [
    /balance/i,
    /owner/i,
    /admin/i,
    /total/i,
  ];
  
  for (const pattern of stateVarPatterns) {
    if (pattern.test(prerequisites) && pattern.test(codeLower)) {
      return true; // State variable exists
    }
  }
  
  // Default: assume possible unless proven otherwise
  return true;
}

/**
 * Validate exploit steps against code patterns
 */
function validateExploitSteps(steps: string[], code: string): boolean {
  if (steps.length === 0) {
    return false;
  }
  
  const codeLower = code.toLowerCase();
  const stepsText = steps.join(' ').toLowerCase();
  
  // Check if steps reference code patterns that exist
  const codePatterns = [
    /send.*message/i,
    /withdraw/i,
    /transfer/i,
    /deposit/i,
    /balance/i,
  ];
  
  let matchesFound = 0;
  for (const pattern of codePatterns) {
    if (pattern.test(stepsText) && pattern.test(codeLower)) {
      matchesFound++;
    }
  }
  
  // If at least some patterns match, steps might be valid
  return matchesFound > 0 || steps.length > 2; // Allow theoretical exploits with detailed steps
}

/**
 * Filter out clearly impossible exploits
 */
export function filterImpossibleExploits(exploits: ExploitAttempt[]): ExploitAttempt[] {
  return exploits.filter(exploit => {
    // Keep all exploits, but mark impossible ones as "not-applicable"
    // This allows users to see what was tried
    return true;
  });
}

