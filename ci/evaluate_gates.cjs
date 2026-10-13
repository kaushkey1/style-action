#!/usr/bin/env node
/*
 * Pillar 4 gate evaluator (frontend) — zero external deps.
 *
 * Reads Vitest JSON results (--reporter=json --outputFile) and the
 * coverage-summary.json (json-summary reporter), compares against the
 * thresholds in ci/gates.yml, prints a PASS/FAIL report and the
 * DEPLOY_ALLOWED decision.
 *
 * Honors `mode` in ci/gates.yml: returns exit 0 in report-only (default),
 * non-zero only when mode=blocking AND a gate fails. Same logic runs in the
 * pre-push hook and the PR pipeline.
 *
 * Usage:
 *   node ci/evaluate_gates.cjs [--results coverage/test-results.json]
 *        [--coverage coverage/coverage-summary.json] [--config ci/gates.yml]
 *        [--report-only] [--enforce]
 */
'use strict';
const fs = require('fs');

function arg(name, def) {
  const i = process.argv.indexOf(name);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : def;
}
const hasFlag = (name) => process.argv.includes(name);

function loadConfig(path) {
  const cfg = { threshold_pass_rate: 0.75, coverage_baseline: null, p0_required: 1.0, mode: 'report-only' };
  if (!fs.existsSync(path)) return cfg;
  for (const raw of fs.readFileSync(path, 'utf8').split('\n')) {
    const line = raw.split('#')[0].trim();
    if (!line || !line.includes(':') || line.endsWith(':')) continue; // skip blanks/comments/parent keys
    const idx = line.indexOf(':');
    const key = line.slice(0, idx).trim();
    let val = line.slice(idx + 1).trim();
    if (!(key in cfg)) continue; // ignores nested keys like ratchet.*
    if (/^(null|none|)$/i.test(val)) cfg[key] = null;
    else if (key === 'mode') cfg[key] = val.replace(/['"]/g, '');
    else { const n = parseFloat(val); cfg[key] = Number.isNaN(n) ? val : n; }
  }
  return cfg;
}

function readJSON(path) {
  try { return JSON.parse(fs.readFileSync(path, 'utf8')); } catch { return null; }
}

function passRate(results) {
  if (!results) return null;
  const total = results.numTotalTests ?? 0;
  const failed = results.numFailedTests ?? 0;
  const pending = results.numPendingTests ?? 0;
  const ran = total - pending;
  if (ran <= 0) return null;
  const passed = results.numPassedTests ?? (ran - failed);
  return { rate: passed / ran, total, failed, pending };
}

function coveragePct(summary) {
  if (!summary || !summary.total || !summary.total.lines) return null;
  return summary.total.lines.pct; // already a percentage 0..100
}

function main() {
  const cfg = loadConfig(arg('--config', 'ci/gates.yml'));
  const enforce = hasFlag('--enforce') || (cfg.mode === 'blocking' && !hasFlag('--report-only'));

  const bar = '='.repeat(60);
  console.log(bar);
  console.log('  Pillar 4 — CI/CD gate report' + (enforce ? '  [BLOCKING]' : '  [report-only]'));
  console.log(bar);

  const failures = [];

  const pr = passRate(readJSON(arg('--results', 'coverage/test-results.json')));
  if (!pr) {
    console.log('  tests        : no Vitest results (not wired yet) — SKIP');
  } else {
    const thr = Number(cfg.threshold_pass_rate);
    const ok = pr.rate >= thr;
    console.log(`  tests        : ${(pr.rate * 100).toFixed(1)}% pass (${pr.total} total, ${pr.failed}F/${pr.pending}skipped) vs ${(thr * 100).toFixed(0)}%  -> ${ok ? 'PASS' : 'FAIL'}`);
    if (!ok) failures.push('unit pass-rate below threshold');
  }

  const cov = coveragePct(readJSON(arg('--coverage', 'coverage/coverage-summary.json')));
  const base = cfg.coverage_baseline;
  if (cov == null) {
    console.log('  coverage     : no coverage data (not wired yet) — SKIP');
  } else if (base == null) {
    console.log(`  coverage     : ${cov.toFixed(1)}% (no baseline recorded yet — record this as the baseline)`);
  } else {
    const ok = cov >= Number(base);
    console.log(`  coverage     : ${cov.toFixed(1)}% vs baseline ${Number(base).toFixed(1)}%  -> ${ok ? 'PASS' : 'FAIL'}`);
    if (!ok) failures.push('coverage dropped below baseline');
  }

  const decision = failures.length === 0;
  console.log('-'.repeat(60));
  console.log(`  DEPLOY_ALLOWED = ${decision}`);
  if (failures.length) console.log('  blockers: ' + failures.join('; '));
  console.log(bar);

  process.exit(enforce && !decision ? 1 : 0);
}

main();
