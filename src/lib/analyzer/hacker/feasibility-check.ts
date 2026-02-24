import { ExploitAttempt } from "@/types/analysis";
import { mapFunctions, FunctionMap } from "../utils";

/**
 * Validates exploit attempts against actual contract structure.
 * Filters out impossible exploits and marks others as plausible/theoretical.
 */
export function validateExploitFeasibility(
  exploits: ExploitAttempt[],
  code: string
): ExploitAttempt[] {
  const functions = mapFunctions(code);
  const functionNames = functions.map(f => f.name.toLowerCase());

  return exploits.map(exploit => {
    const referencedFunctions = extractReferencedFunctions(exploit, functions);
    const allFunctionsExist = referencedFunctions.every(funcName =>
      functionNames.includes(funcName.toLowerCase())
    );

    const prerequisitesPossible = checkPrerequisites(exploit.prerequisites, code, functions);
    const stepsValid = validateExploitSteps(exploit.steps, code);

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

    return { ...exploit, status };
  });
}

/**
 * Extract function names referenced in exploit description text.
 * Reuses the already-parsed function list to avoid redundant parsing.
 */
function extractReferencedFunctions(exploit: ExploitAttempt, codeFunctions: FunctionMap[]): string[] {
  const text = `${exploit.title} ${exploit.prerequisites} ${exploit.steps.join(' ')} ${exploit.expectedImpact}`.toLowerCase();

  return [
    ...new Set(
      codeFunctions
        .filter(func => text.includes(func.name.toLowerCase()))
        .map(func => func.name)
    )
  ];
}

/**
 * Check if prerequisites are plausible given the contract code.
 */
function checkPrerequisites(
  prerequisites: string,
  code: string,
  functions: FunctionMap[]
): boolean {
  if (!prerequisites || prerequisites.trim() === "") {
    return true;
  }

  const impossiblePatterns = [
    /function.*doesn't exist/i,
    /variable.*is immutable/i,
    /cannot.*be called/i,
  ];

  if (impossiblePatterns.some(p => p.test(prerequisites))) {
    return false;
  }

  const prereqLower = prerequisites.toLowerCase();

  if (functions.some(f => prereqLower.includes(f.name.toLowerCase()))) {
    return true;
  }

  const stateVarPatterns = [/balance/i, /owner/i, /admin/i, /total/i];
  const codeLower = code.toLowerCase();
  if (stateVarPatterns.some(p => p.test(prerequisites) && p.test(codeLower))) {
    return true;
  }

  return true;
}

/**
 * Validate exploit steps against code patterns.
 */
function validateExploitSteps(steps: string[], code: string): boolean {
  if (steps.length === 0) return false;

  const codeLower = code.toLowerCase();
  const stepsText = steps.join(' ').toLowerCase();

  const codePatterns = [
    /send.*message/i,
    /withdraw/i,
    /transfer/i,
    /deposit/i,
    /balance/i,
  ];

  const matchCount = codePatterns.filter(p => p.test(stepsText) && p.test(codeLower)).length;
  return matchCount > 0 || steps.length > 2;
}
