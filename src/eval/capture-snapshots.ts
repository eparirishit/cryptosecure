/**
 * Snapshot Capture Script
 *
 * Run this once (or whenever prompts/providers change) to capture
 * AI responses to disk. The captured snapshots are used by the
 * offline evaluation tests.
 *
 * Usage:
 *   npm run test:snapshot
 *
 * Requires the dev server to be running at http://localhost:3000.
 */

import fs from 'fs';
import path from 'path';
import { GROUND_TRUTH } from './ground-truth';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const SNAPSHOT_DIR = path.resolve(__dirname, 'snapshots');
const CONSISTENCY_RUNS = 3;

async function main() {
  // Ensure snapshots directory exists
  if (!fs.existsSync(SNAPSHOT_DIR)) {
    fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
  }

  console.log('╔══════════════════════════════════════════╗');
  console.log('║   CryptoSecure — Snapshot Capture        ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log(`Server: ${BASE_URL}`);
  console.log(`Output: ${SNAPSHOT_DIR}`);
  console.log(`Contracts: ${GROUND_TRUTH.length}`);
  console.log(`Consistency runs: ${CONSISTENCY_RUNS}`);
  console.log('');

  for (const entry of GROUND_TRUTH) {
    console.log(`\n── ${entry.contractFile} ${'─'.repeat(40 - entry.contractFile.length)}`);

    // Read contract source
    const contractPath = path.resolve(process.cwd(), entry.contractPath);
    if (!fs.existsSync(contractPath)) {
      console.error(`  ✗ Contract file not found: ${contractPath}`);
      continue;
    }
    const code = fs.readFileSync(contractPath, 'utf-8');
    const baseName = path.basename(entry.contractFile, path.extname(entry.contractFile));

    // ── Capture /api/analyze snapshots (multiple runs for consistency) ──
    const analyzeRuns = [];
    for (let run = 1; run <= CONSISTENCY_RUNS; run++) {
      process.stdout.write(`  [analyze] Run ${run}/${CONSISTENCY_RUNS}...`);
      try {
        const res = await fetch(`${BASE_URL}/api/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code,
            contractName: baseName,
            filename: entry.contractFile,
          }),
        });

        if (!res.ok) {
          const err = await res.text();
          console.log(` ✗ HTTP ${res.status}: ${err.substring(0, 100)}`);
          continue;
        }

        const response = await res.json();
        const snapshot = {
          capturedAt: new Date().toISOString(),
          provider: response.analysisMetadata?.language || 'unknown',
          contractFile: entry.contractFile,
          response,
        };
        analyzeRuns.push(snapshot);
        console.log(` ✓ Score: ${response.securityScore}, Grade: ${response.grade}, Findings: ${response.findings?.length || 0}`);
      } catch (err: any) {
        console.log(` ✗ ${err.message}`);
      }
    }

    // Save individual analyze snapshot (first run)
    if (analyzeRuns.length > 0) {
      fs.writeFileSync(
        path.join(SNAPSHOT_DIR, `${baseName}.analyze.json`),
        JSON.stringify(analyzeRuns[0], null, 2),
      );
    }

    // Save consistency snapshots (all runs)
    if (analyzeRuns.length > 1) {
      fs.writeFileSync(
        path.join(SNAPSHOT_DIR, `${baseName}.consistency.json`),
        JSON.stringify({ contractFile: entry.contractFile, runs: analyzeRuns }, null, 2),
      );
    }

    // ── Capture /api/hack snapshot ──
    process.stdout.write(`  [hack]    Run 1/1...`);
    try {
      const res = await fetch(`${BASE_URL}/api/hack`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          language: entry.contractFile.endsWith('.fc') || entry.contractFile.endsWith('.func')
            ? 'FunC'
            : 'Tact',
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        console.log(` ✗ HTTP ${res.status}: ${err.substring(0, 100)}`);
      } else {
        const response = await res.json();
        const snapshot = {
          capturedAt: new Date().toISOString(),
          provider: 'unknown',
          contractFile: entry.contractFile,
          response,
        };
        fs.writeFileSync(
          path.join(SNAPSHOT_DIR, `${baseName}.hack.json`),
          JSON.stringify(snapshot, null, 2),
        );
        console.log(` ✓ Resilience: ${response.hackerResilienceScore}, Risk: ${response.riskLevel}, Exploits: ${response.exploits?.length || 0}`);
      }
    } catch (err: any) {
      console.log(` ✗ ${err.message}`);
    }
  }

  console.log('\n════════════════════════════════════════════');
  console.log('Snapshot capture complete.');
  console.log(`Files saved to: ${SNAPSHOT_DIR}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
