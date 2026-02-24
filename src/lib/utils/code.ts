import type { Finding } from "@/types/analysis";

export function normalizeCode(code: string): string {
  return code
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n");
}

export function findCodePosition(
  originalCode: string,
  vulnerableCode: string
): { startIdx: number; endIdx: number } | null {
  const normalizedOriginal = normalizeCode(originalCode);
  const normalizedVulnerable = normalizeCode(vulnerableCode);

  const exactMatch = normalizedOriginal.indexOf(normalizedVulnerable);
  if (exactMatch !== -1) {
    const beforeMatch = normalizedOriginal.substring(0, exactMatch);
    const startLine = beforeMatch.split("\n").length - 1;
    const endLine = startLine + normalizedVulnerable.split("\n").length - 1;
    return { startIdx: startLine, endIdx: endLine };
  }

  const originalLines = normalizedOriginal.split("\n");
  const vulnerableLines = normalizedVulnerable
    .split("\n")
    .filter((line) => line.trim().length > 0);

  if (vulnerableLines.length === 0) return null;

  for (let i = 0; i < originalLines.length; i++) {
    const originalLine = originalLines[i].trim();
    const firstVulnerableLine = vulnerableLines[0].trim();

    if (
      originalLine.includes(firstVulnerableLine) ||
      firstVulnerableLine.includes(originalLine)
    ) {
      let matchCount = 0;
      for (
        let j = 0;
        j < vulnerableLines.length && i + j < originalLines.length;
        j++
      ) {
        const origLine = originalLines[i + j].trim();
        const vulnLine = vulnerableLines[j].trim();
        if (
          origLine.includes(vulnLine) ||
          vulnLine.includes(origLine) ||
          origLine === vulnLine
        ) {
          matchCount++;
        } else {
          break;
        }
      }

      if (matchCount >= Math.ceil(vulnerableLines.length * 0.8)) {
        return { startIdx: i, endIdx: i + matchCount - 1 };
      }
    }
  }

  return null;
}

export function applyAllFixes(
  originalCode: string,
  findings: Finding[]
): string {
  const codeLines = originalCode.split("\n");

  const findingsWithChanges = findings
    .filter((f) => f.codeChanges && f.codeChanges.vulnerableCode)
    .map((finding) => {
      if (!finding.codeChanges) return null;

      const vulnerableCodeToMatch = finding.codeChanges.vulnerableCode;
      const fixedCodeToUse = finding.codeChanges.fixedCode;

      if (!vulnerableCodeToMatch || !fixedCodeToUse) {
        console.warn(`Finding ${finding.id}: Missing code fields. Skipping.`);
        return null;
      }

      const position = findCodePosition(originalCode, vulnerableCodeToMatch);
      let startIdx: number;
      let endIdx: number;

      if (position) {
        startIdx = position.startIdx;
        endIdx = position.endIdx;
      } else if (
        finding.codeChanges.startLine &&
        finding.codeChanges.endLine
      ) {
        startIdx = Math.max(0, finding.codeChanges.startLine - 1);
        endIdx = Math.min(
          codeLines.length - 1,
          finding.codeChanges.endLine - 1
        );

        const codeAtLines = codeLines.slice(startIdx, endIdx + 1).join("\n");
        const normalizedCodeAtLines = normalizeCode(codeAtLines);
        const normalizedVulnerable = normalizeCode(vulnerableCodeToMatch);

        if (
          !normalizedCodeAtLines.includes(normalizedVulnerable) &&
          !normalizedVulnerable.includes(normalizedCodeAtLines)
        ) {
          console.warn(
            `Finding ${finding.id}: Code at lines ${startIdx + 1}-${endIdx + 1} doesn't match. Skipping.`
          );
          return null;
        }
      } else {
        console.warn(
          `Finding ${finding.id}: No valid position found. Skipping.`
        );
        return null;
      }

      return { finding, startIdx, endIdx, fixedCode: fixedCodeToUse };
    })
    .filter(
      (
        item
      ): item is {
        finding: Finding;
        startIdx: number;
        endIdx: number;
        fixedCode: string;
      } => item !== null
    )
    .sort((a, b) => b.startIdx - a.startIdx);

  const modifiedLines = [...codeLines];
  let lowestModifiedLine = Infinity;

  for (const { startIdx, endIdx, fixedCode } of findingsWithChanges) {
    if (endIdx >= lowestModifiedLine) continue;

    const fixedLines = fixedCode.split("\n");
    const linesToRemove = endIdx - startIdx + 1;
    modifiedLines.splice(startIdx, linesToRemove, ...fixedLines);
    lowestModifiedLine = startIdx;
  }

  return modifiedLines.join("\n");
}
