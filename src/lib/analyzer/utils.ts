export function stripComments(code: string): string {
  // Remove single-line comments (// ...) or (;; ...) for FunC
  let clean = code.replace(/\/\/.*$/gm, "").replace(/;;.*$/gm, "");
  
  // Remove multi-line comments (/* ... */) or ({- ... -}) for FunC
  clean = clean.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\{-[\s\S]*?-\}/g, "");
  
  return clean;
}

// normalizeCode removed as requested to avoid trimming whitespace/comments before audit

export interface FunctionMap {
  name: string;
  startLine: number;
  endLine: number;
}

export function mapFunctions(code: string): FunctionMap[] {
  const lines = code.split("\n");
  const functions: FunctionMap[] = [];
  let braceDepth = 0;
  let currentFunc: Partial<FunctionMap> | null = null;

  // Heuristic Regex for FunC function definition
  // Matches: return_type function_name(args) ... {
  // Examples: 
  // () recv_internal(...) {
  // int sum(int a, int b) {
  const funcDefRegex = /^(?:[\w\(\)\[\]]+\s+)?(\w+)\s*\(/;

  for (let i = 0; i < lines.length; i++) {
    const line = stripComments(lines[i]).trim();
    if (!line) continue;

    // Check for function start if at depth 0
    if (braceDepth === 0 && line.includes("{")) {
        const match = line.match(funcDefRegex);
        if (match) {
            currentFunc = {
                name: match[1],
                startLine: i + 1
            };
        } else {
            // Fallback: maybe previous line had the signature?
            if (i > 0) {
                const prevLine = stripComments(lines[i-1]).trim();
                const prevMatch = prevLine.match(funcDefRegex);
                if (prevMatch) {
                    currentFunc = {
                        name: prevMatch[1],
                        startLine: i // Start at signature line
                    };
                }
            }
        }
    }

    // Count braces
    const openBraces = (line.match(/\{/g) || []).length;
    const closeBraces = (line.match(/\}/g) || []).length;
    
    braceDepth += openBraces - closeBraces;

    // Check for function end
    if (braceDepth === 0 && currentFunc && currentFunc.startLine !== undefined) {
        functions.push({
            name: currentFunc.name!,
            startLine: currentFunc.startLine,
            endLine: i + 1
        });
        currentFunc = null;
    }
  }

  return functions;
}
