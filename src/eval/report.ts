/**
 * Evaluation Report Generator — HTML
 *
 * Reads snapshots and ground-truth, computes all metrics,
 * and writes a self-contained HTML report.
 *
 * Usage:
 *   npx tsx src/eval/report.ts          # generates eval-report.html
 *   npx tsx src/eval/report.ts --open   # generates and opens in browser
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { GROUND_TRUTH } from './ground-truth';
import {
  computeDetectionMetrics,
  computeMatchConfidence,
  computeScoreAccuracy,
  computeStructuralCompleteness,
  computeFixQuality,
} from './metrics';
import type { AnalyzeSnapshot, HackSnapshot, ConsistencySnapshot } from './types';

const SNAPSHOT_DIR = path.resolve(__dirname, 'snapshots');
const OUT_FILE = path.resolve(process.cwd(), 'eval-report.html');

function load<T>(file: string): T | null {
  const p = path.join(SNAPSHOT_DIR, file);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

function pct(n: number): string {
  if (isNaN(n)) return 'N/A';
  return (n * 100).toFixed(1) + '%';
}

function pctNum(n: number): number {
  return Math.round(n * 1000) / 10;
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* ─── Aggregate metrics helpers ─────────────────────────────────── */

interface ContractAuditData {
  name: string;
  isSecure: boolean;
  precision: number;
  recall: number;
  f1: number;
  tp: number;
  fp: number;
  fn: number;
  score: number;
  scoreRange: [number, number];
  grade: string;
  gradeOk: boolean;
  scoreOk: boolean;
  structComplete: boolean;
  codeComp: boolean;
  fixRate: number;
  vulnBreakdown: {
    category: string;
    confidence: number;
    kw: number;
    cat: number;
    sev: number;
    lr: number;
    matched: boolean;
  }[];
}

interface ContractHackData {
  name: string;
  resilience: number;
  risk: string;
  totalExploits: number;
  plausible: number;
}

interface ContractConsistencyData {
  name: string;
  scores: number[];
  stdDev: number;
  grades: string[];
  stable: boolean;
}

function gatherData() {
  const audits: ContractAuditData[] = [];
  const hacks: ContractHackData[] = [];
  const consistency: ContractConsistencyData[] = [];

  for (const gt of GROUND_TRUTH) {
    const baseName = path.basename(gt.contractFile, path.extname(gt.contractFile));

    // Audit
    const aSnap = load<AnalyzeSnapshot>(`${baseName}.analyze.json`);
    if (aSnap) {
      const det = computeDetectionMetrics(aSnap.response.findings, gt.expectedVulnerabilities);
      const sa = computeScoreAccuracy(aSnap.response.securityScore, gt.expectedScoreRange);
      const sc = computeStructuralCompleteness(aSnap.response);
      const fq = computeFixQuality(aSnap.response.findings);

      const vulnBreakdown = gt.expectedVulnerabilities.map((ev) => {
        const scores = aSnap.response.findings.map((f) => computeMatchConfidence(f, ev));
        const best = scores.reduce((a, b) => (a.confidence > b.confidence ? a : b), {
          keywordScore: 0, categoryScore: 0, severityScore: 0, lineRangeScore: 0, confidence: 0,
        });
        return {
          category: ev.category,
          confidence: best.confidence,
          kw: best.keywordScore,
          cat: best.categoryScore,
          sev: best.severityScore,
          lr: best.lineRangeScore,
          matched: best.confidence >= 0.50,
        };
      });

      audits.push({
        name: gt.contractFile,
        isSecure: gt.isSecure,
        precision: det.precision,
        recall: det.recall,
        f1: det.f1,
        tp: det.truePositives,
        fp: det.falsePositives,
        fn: det.falseNegatives,
        score: aSnap.response.securityScore,
        scoreRange: gt.expectedScoreRange,
        grade: aSnap.response.grade,
        gradeOk: gt.expectedGrades.includes(aSnap.response.grade),
        scoreOk: sa.withinRange,
        structComplete: sc.overallComplete,
        codeComp: sc.hasCompleteCodeComparison,
        fixRate: fq.fixQualityRate,
        vulnBreakdown,
      });
    }

    // Hack
    const hSnap = load<HackSnapshot>(`${baseName}.hack.json`);
    if (hSnap) {
      const r = hSnap.response;
      hacks.push({
        name: gt.contractFile,
        resilience: r.hackerResilienceScore,
        risk: r.riskLevel,
        totalExploits: r.exploits.length,
        plausible: r.exploits.filter((e) => e.status === 'plausible').length,
      });
    }

    // Consistency
    const cSnap = load<ConsistencySnapshot>(`${baseName}.consistency.json`);
    if (cSnap && cSnap.runs.length >= 2) {
      const scores = cSnap.runs.map((r) => r.response.securityScore);
      const grades = cSnap.runs.map((r) => r.response.grade);
      const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
      const sd = Math.sqrt(scores.map((v) => (v - mean) ** 2).reduce((a, b) => a + b, 0) / (scores.length - 1));
      const uniqueGrades = [...new Set(grades)];
      consistency.push({
        name: gt.contractFile,
        scores,
        stdDev: sd,
        grades: uniqueGrades,
        stable: sd < 10 && uniqueGrades.length === 1,
      });
    }
  }

  // Aggregates
  const vulnAudits = audits.filter((a) => !a.isSecure && !isNaN(a.recall));
  const avgRecall = vulnAudits.length > 0 ? vulnAudits.reduce((s, a) => s + a.recall, 0) / vulnAudits.length : 0;
  const avgPrecision = vulnAudits.length > 0 ? vulnAudits.reduce((s, a) => s + a.precision, 0) / vulnAudits.length : 0;
  const avgF1 = vulnAudits.length > 0 ? vulnAudits.reduce((s, a) => s + a.f1, 0) / vulnAudits.length : 0;
  const totalTP = vulnAudits.reduce((s, a) => s + a.tp, 0);
  const totalExpected = vulnAudits.reduce((s, a) => s + a.tp + a.fn, 0);
  const totalFindings = vulnAudits.reduce((s, a) => s + a.tp + a.fp, 0);
  const microRecall = totalExpected > 0 ? totalTP / totalExpected : 0;
  const microPrecision = totalFindings > 0 ? totalTP / totalFindings : 0;

  return { audits, hacks, consistency, avgRecall, avgPrecision, avgF1, microRecall, microPrecision, totalTP, totalExpected, totalFindings };
}

/* ─── HTML generation ───────────────────────────────────────────── */

function buildHTML() {
  const d = gatherData();
  const ts = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>CryptoSecure — Evaluation Report</title>
<style>
  :root {
    --bg: #0b0e14;
    --surface: #12161f;
    --surface2: #181d28;
    --border: #252b3a;
    --text: #c5cdd8;
    --text-dim: #6b7a90;
    --accent: #58a6ff;
    --green: #3fb950;
    --red: #f85149;
    --orange: #d29922;
    --purple: #bc8cff;
    --cyan: #56d4dd;
    --radius: 10px;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: var(--bg);
    color: var(--text);
    line-height: 1.6;
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
  }
  h1 {
    font-size: 1.8rem;
    font-weight: 700;
    letter-spacing: -0.02em;
    margin-bottom: 0.25rem;
    color: #e6edf3;
  }
  .subtitle {
    color: var(--text-dim);
    font-size: 0.85rem;
    margin-bottom: 2.5rem;
  }

  /* ── Summary cards ── */
  .summary-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
    gap: 1rem;
    margin-bottom: 2.5rem;
  }
  .card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 1.25rem;
    text-align: center;
  }
  .card-value {
    font-size: 2rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }
  .card-label {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-dim);
    margin-top: 0.25rem;
  }

  /* ── Sections ── */
  .section {
    margin-bottom: 2.5rem;
  }
  .section-title {
    font-size: 1.1rem;
    font-weight: 600;
    color: #e6edf3;
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--border);
  }

  /* ── Tables ── */
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.85rem;
    font-variant-numeric: tabular-nums;
  }
  thead th {
    text-align: left;
    padding: 0.6rem 0.75rem;
    color: var(--text-dim);
    font-weight: 500;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border-bottom: 1px solid var(--border);
  }
  tbody td {
    padding: 0.6rem 0.75rem;
    border-bottom: 1px solid var(--border);
  }
  tbody tr:last-child td { border-bottom: none; }
  tbody tr:hover { background: var(--surface2); }
  .mono { font-family: 'JetBrains Mono', 'Fira Code', monospace; font-size: 0.82rem; }
  .right { text-align: right; }
  .center { text-align: center; }

  /* ── Tags ── */
  .tag {
    display: inline-block;
    padding: 0.15rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 600;
  }
  .tag-pass { background: rgba(63,185,80,0.15); color: var(--green); }
  .tag-fail { background: rgba(248,81,73,0.15); color: var(--red); }
  .tag-warn { background: rgba(210,153,34,0.15); color: var(--orange); }
  .tag-na   { background: rgba(107,122,144,0.15); color: var(--text-dim); }

  .risk-critical { color: var(--red); font-weight: 600; }
  .risk-high { color: var(--orange); font-weight: 600; }
  .risk-medium { color: var(--orange); }
  .risk-low { color: var(--green); }

  /* ── Confidence bars ── */
  .conf-row { display: flex; align-items: center; gap: 0.5rem; margin: 0.3rem 0; }
  .conf-label {
    width: 170px;
    font-size: 0.8rem;
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .conf-bar-track {
    flex: 1;
    height: 8px;
    background: var(--surface2);
    border-radius: 4px;
    overflow: hidden;
    position: relative;
  }
  .conf-bar-fill {
    height: 100%;
    border-radius: 4px;
    transition: width 0.3s;
  }
  .conf-pct {
    width: 40px;
    text-align: right;
    font-size: 0.8rem;
    font-variant-numeric: tabular-nums;
    font-weight: 600;
  }
  .conf-status {
    width: 18px;
    text-align: center;
    font-size: 0.9rem;
  }

  /* ── Signal breakdown mini-bars ── */
  .signals {
    display: flex;
    gap: 0.6rem;
    font-size: 0.7rem;
    color: var(--text-dim);
    margin-top: 0.15rem;
    padding-left: 188px;
  }
  .sig { display: flex; align-items: center; gap: 0.2rem; }
  .sig-dot {
    width: 7px; height: 7px; border-radius: 50%;
    display: inline-block;
  }

  /* ── Contract group ── */
  .contract-group {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 1rem 1.25rem;
    margin-bottom: 0.75rem;
  }
  .contract-group-title {
    font-weight: 600;
    font-size: 0.9rem;
    color: #e6edf3;
    margin-bottom: 0.6rem;
  }

  /* ── Footer ── */
  .footer {
    text-align: center;
    color: var(--text-dim);
    font-size: 0.75rem;
    padding-top: 2rem;
    border-top: 1px solid var(--border);
  }

  @media (max-width: 700px) {
    body { padding: 1rem; }
    .summary-grid { grid-template-columns: repeat(2, 1fr); }
    .signals { padding-left: 0; flex-wrap: wrap; }
    .conf-label { width: 120px; }
  }
</style>
</head>
<body>

<h1>CryptoSecure — Evaluation Report</h1>
<p class="subtitle">Generated ${esc(ts)} &nbsp;·&nbsp; ${GROUND_TRUTH.length} contracts &nbsp;·&nbsp; ${d.totalExpected} expected vulnerabilities</p>

<!-- ═══ Summary Cards ═══ -->
<div class="summary-grid">
  <div class="card">
    <div class="card-value" style="color:var(--accent)">${pct(d.avgRecall)}</div>
    <div class="card-label">Avg Recall</div>
  </div>
  <div class="card">
    <div class="card-value" style="color:var(--purple)">${pct(d.avgPrecision)}</div>
    <div class="card-label">Avg Precision</div>
  </div>
  <div class="card">
    <div class="card-value" style="color:var(--cyan)">${pct(d.avgF1)}</div>
    <div class="card-label">Avg F1</div>
  </div>
  <div class="card">
    <div class="card-value" style="color:var(--green)">${d.totalTP}</div>
    <div class="card-label">True Positives</div>
  </div>
  <div class="card">
    <div class="card-value" style="color:var(--red)">${d.totalFindings - d.totalTP}</div>
    <div class="card-label">False Positives</div>
  </div>
  <div class="card">
    <div class="card-value" style="color:var(--orange)">${d.totalExpected - d.totalTP}</div>
    <div class="card-label">Missed Vulns</div>
  </div>
</div>

<!-- ═══ Detection Accuracy ═══ -->
<div class="section">
  <div class="section-title">Detection Accuracy</div>
  <table>
    <thead>
      <tr>
        <th>Contract</th>
        <th class="right">Precision</th>
        <th class="right">Recall</th>
        <th class="right">F1</th>
        <th class="center">TP</th>
        <th class="center">FP</th>
        <th class="center">FN</th>
      </tr>
    </thead>
    <tbody>
${d.audits.map((a) => `      <tr>
        <td class="mono">${esc(a.name)}</td>
        <td class="right">${pct(a.precision)}</td>
        <td class="right">${isNaN(a.recall) ? '<span class="tag tag-na">N/A</span>' : pct(a.recall)}</td>
        <td class="right">${isNaN(a.f1) ? '<span class="tag tag-na">N/A</span>' : pct(a.f1)}</td>
        <td class="center">${a.tp}</td>
        <td class="center">${a.fp}</td>
        <td class="center">${a.fn}</td>
      </tr>`).join('\n')}
    </tbody>
  </table>
</div>

<!-- ═══ Confidence Breakdown ═══ -->
<div class="section">
  <div class="section-title">Per-Vulnerability Confidence Breakdown</div>
${d.audits.filter((a) => a.vulnBreakdown.length > 0).map((a) => `  <div class="contract-group">
    <div class="contract-group-title">${esc(a.name)}</div>
${a.vulnBreakdown.map((v) => {
  const pctVal = Math.round(v.confidence * 100);
  const barColor = !v.matched ? 'var(--red)' : pctVal >= 70 ? 'var(--green)' : 'var(--orange)';
  return `    <div class="conf-row">
      <span class="conf-status">${v.matched ? '✓' : '✗'}</span>
      <span class="conf-label">${esc(v.category)}</span>
      <div class="conf-bar-track">
        <div class="conf-bar-fill" style="width:${pctVal}%;background:${barColor}"></div>
      </div>
      <span class="conf-pct" style="color:${barColor}">${pctVal}%</span>
    </div>
    <div class="signals">
      <span class="sig"><span class="sig-dot" style="background:var(--accent)"></span>kw ${Math.round(v.kw * 100)}%</span>
      <span class="sig"><span class="sig-dot" style="background:var(--purple)"></span>cat ${Math.round(v.cat * 100)}%</span>
      <span class="sig"><span class="sig-dot" style="background:var(--cyan)"></span>sev ${Math.round(v.sev * 100)}%</span>
      <span class="sig"><span class="sig-dot" style="background:var(--orange)"></span>lr ${Math.round(v.lr * 100)}%</span>
    </div>`;
}).join('\n')}
  </div>`).join('\n')}
</div>

<!-- ═══ Score & Grade ═══ -->
<div class="section">
  <div class="section-title">Score &amp; Grade Accuracy</div>
  <table>
    <thead>
      <tr>
        <th>Contract</th>
        <th class="right">Score</th>
        <th>Expected Range</th>
        <th class="center">Grade</th>
        <th class="center">Status</th>
      </tr>
    </thead>
    <tbody>
${d.audits.map((a) => `      <tr>
        <td class="mono">${esc(a.name)}</td>
        <td class="right">${a.score}</td>
        <td>[${a.scoreRange[0]}, ${a.scoreRange[1]}]</td>
        <td class="center"><strong>${a.grade}</strong></td>
        <td class="center">${a.scoreOk && a.gradeOk ? '<span class="tag tag-pass">Pass</span>' : '<span class="tag tag-fail">Fail</span>'}</td>
      </tr>`).join('\n')}
    </tbody>
  </table>
</div>

<!-- ═══ Structural & Fix Quality ═══ -->
<div class="section">
  <div class="section-title">Structural Completeness &amp; Fix Quality</div>
  <table>
    <thead>
      <tr>
        <th>Contract</th>
        <th class="center">Complete</th>
        <th class="center">Code Comparison</th>
        <th class="right">Fix Rate</th>
      </tr>
    </thead>
    <tbody>
${d.audits.map((a) => `      <tr>
        <td class="mono">${esc(a.name)}</td>
        <td class="center">${a.structComplete ? '<span class="tag tag-pass">Yes</span>' : '<span class="tag tag-fail">No</span>'}</td>
        <td class="center">${a.codeComp ? '<span class="tag tag-pass">Yes</span>' : '<span class="tag tag-fail">No</span>'}</td>
        <td class="right">${pct(a.fixRate)}</td>
      </tr>`).join('\n')}
    </tbody>
  </table>
</div>

<!-- ═══ Hacker Mode ═══ -->
<div class="section">
  <div class="section-title">Hacker Mode</div>
  <table>
    <thead>
      <tr>
        <th>Contract</th>
        <th class="right">Resilience</th>
        <th class="center">Risk Level</th>
        <th class="center">Exploits</th>
        <th class="center">Plausible</th>
      </tr>
    </thead>
    <tbody>
${d.hacks.map((h) => {
  const riskClass = h.risk === 'Critical' ? 'risk-critical' : h.risk === 'High' ? 'risk-high' : h.risk === 'Medium' ? 'risk-medium' : 'risk-low';
  return `      <tr>
        <td class="mono">${esc(h.name)}</td>
        <td class="right">${h.resilience}/100</td>
        <td class="center ${riskClass}">${h.risk}</td>
        <td class="center">${h.totalExploits}</td>
        <td class="center">${h.plausible}</td>
      </tr>`;
}).join('\n')}
    </tbody>
  </table>
</div>

<!-- ═══ Consistency ═══ -->
<div class="section">
  <div class="section-title">Consistency (across 3 runs)</div>
  <table>
    <thead>
      <tr>
        <th>Contract</th>
        <th>Scores</th>
        <th class="right">Std Dev</th>
        <th class="center">Grade(s)</th>
        <th class="center">Stable</th>
      </tr>
    </thead>
    <tbody>
${d.consistency.map((c) => `      <tr>
        <td class="mono">${esc(c.name)}</td>
        <td>${c.scores.join(', ')}</td>
        <td class="right">${c.stdDev.toFixed(1)}</td>
        <td class="center">${c.grades.join(' / ')}</td>
        <td class="center">${c.stable ? '<span class="tag tag-pass">Stable</span>' : '<span class="tag tag-warn">Unstable</span>'}</td>
      </tr>`).join('\n')}
    </tbody>
  </table>
</div>

<div class="footer">
  CryptoSecure Evaluation Framework &nbsp;·&nbsp; Multi-signal confidence scoring (kw 40% · cat 25% · sev 20% · lr 15%) &nbsp;·&nbsp; Match threshold ≥ 50%
</div>

</body>
</html>`;
}

/* ─── Main ──────────────────────────────────────────────────────── */

function main() {
  const html = buildHTML();
  fs.writeFileSync(OUT_FILE, html, 'utf-8');
  console.log(`Report written to ${OUT_FILE}`);

  if (process.argv.includes('--open')) {
    const cmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
    try {
      execSync(`${cmd} "${OUT_FILE}"`);
    } catch {
      console.log('Could not auto-open. Please open the file manually.');
    }
  }
}

main();
