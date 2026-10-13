#!/usr/bin/env node
/*
 * Self-tests for the Pillar 4 gate evaluator (SDET finding F4: the gate logic
 * must itself be tested). Zero deps — runs anywhere `node` exists.
 *
 * Usage:  node ci/tests/test_gates.cjs
 * Exit 0 = all assertions passed; non-zero = a gate-logic regression.
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const EVAL = path.join(ROOT, 'ci', 'evaluate_gates.cjs');

let passed = 0, failed = 0;
const check = (name, cond) => { cond ? (passed++, console.log(`  PASS  ${name}`)) : (failed++, console.log(`  FAIL  ${name}`)); };
const run = (args) => spawnSync('node', [EVAL, ...args], { encoding: 'utf8' }).status;

const td = fs.mkdtempSync(path.join(os.tmpdir(), 'gates-'));
const w = (f, c) => { const p = path.join(td, f); fs.writeFileSync(p, c); return p; };

const resPass = w('res_pass.json', JSON.stringify({ numTotalTests: 20, numPassedTests: 18, numFailedTests: 1, numPendingTests: 1 }));
const resFail = w('res_fail.json', JSON.stringify({ numTotalTests: 10, numPassedTests: 5, numFailedTests: 5, numPendingTests: 0 }));
const cov = w('cov.json', JSON.stringify({ total: { lines: { pct: 83.3 } } }));
const gReport = w('g_report.yml', 'threshold_pass_rate: 0.75\ncoverage_baseline: null\nmode: report-only\n');
const gBlock = w('g_block.yml', 'threshold_pass_rate: 0.75\ncoverage_baseline: null\nmode: blocking\n');
const gBase = w('g_base.yml', 'threshold_pass_rate: 0.75\ncoverage_baseline: 90.0\nmode: blocking\n');
const missing = path.join(td, 'nope.json');

check('report-only + failing tests -> exit 0', run(['--results', resFail, '--config', gReport]) === 0);
check('blocking + 50% pass-rate -> exit 1', run(['--results', resFail, '--config', gBlock]) === 1);
check('blocking + 94% pass-rate, no baseline -> exit 0', run(['--results', resPass, '--config', gBlock]) === 0);
check('blocking + coverage 83% < baseline 90% -> exit 1', run(['--results', resPass, '--coverage', cov, '--config', gBase]) === 1);
check('blocking + no data -> exit 0 (no false block)', run(['--results', missing, '--config', gBlock]) === 0);
check('--report-only overrides blocking config -> exit 0', run(['--results', resFail, '--config', gBlock, '--report-only']) === 0);

fs.rmSync(td, { recursive: true, force: true });
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
