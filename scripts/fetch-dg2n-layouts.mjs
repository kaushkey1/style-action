#!/usr/bin/env node
/**
 * Fetches layout data from dg2n for all store codes in the CSV,
 * extracts floor info from each store's ZIP, and produces an HTML mapping file.
 *
 * Usage: node scripts/fetch-dg2n-layouts.mjs
 *
 * Requires: Node 18+ (for native fetch and streams)
 * Set DG2N_SUPABASE_ANON_KEY, DG2N_AUTH_EMAIL and DG2N_AUTH_PASSWORD in your environment.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

// --- Config ---
const CSV_PATH = 'docs/references/data/TRENDS_Sheet1.csv';
const OUTPUT_HTML = 'docs/references/data/dg2n-layout-mapping.html';
const TEMP_DIR = '/tmp/dg2n-layouts';
const BASE_URL = 'https://dg2n-layout3d-backend.rc.dg2n.com';
const FRONTEND_URL = 'https://dg2n-layout3d-frontend.vercel.app';
const SUPABASE_ANON_KEY = process.env.DG2N_SUPABASE_ANON_KEY;
const AUTH_EMAIL = process.env.DG2N_AUTH_EMAIL;
const AUTH_PASSWORD = process.env.DG2N_AUTH_PASSWORD;

// Concurrency limit to avoid hammering the API
const CONCURRENCY = 5;
const DELAY_MS = 200;

// --- Helpers ---
function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function authenticate() {
  if (!SUPABASE_ANON_KEY || !AUTH_EMAIL || !AUTH_PASSWORD) {
    throw new Error('Set DG2N_SUPABASE_ANON_KEY, DG2N_AUTH_EMAIL and DG2N_AUTH_PASSWORD before fetching layouts.');
  }
  console.log('Authenticating with Supabase...');
  const res = await fetch(`${BASE_URL}/supabase/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ email: AUTH_EMAIL, password: AUTH_PASSWORD }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Auth failed (${res.status}): ${text}`);
  }
  const data = await res.json();
  console.log(`Authenticated. Token expires in ${data.expires_in}s`);
  return data.access_token;
}

async function fetchStoreSaves(storeCode, token) {
  const url = `${BASE_URL}/supabase/rest/v1/store_saves?select=id,store_id,store_name,zip_path,status,created_at&store_id=ilike.%25${storeCode}%25&order=created_at.desc&limit=1`;
  const res = await fetch(url, {
    headers: {
      'authorization': `Bearer ${token}`,
      'apikey': SUPABASE_ANON_KEY,
      'accept-profile': 'public',
    },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.length > 0 ? data[0] : null;
}

async function downloadAndExtractConfig(zipPath, storeCode, token) {
  const zipUrl = `${BASE_URL}/supabase/storage/v1/object/store-archives/${zipPath}`;
  const localZip = join(TEMP_DIR, `${storeCode}.zip`);
  const extractDir = join(TEMP_DIR, storeCode);

  const res = await fetch(zipUrl, {
    headers: {
      'authorization': `Bearer ${token}`,
      'apikey': SUPABASE_ANON_KEY,
    },
  });

  if (!res.ok) return null;

  const buffer = Buffer.from(await res.arrayBuffer());
  writeFileSync(localZip, buffer);

  mkdirSync(extractDir, { recursive: true });

  try {
    execSync(`unzip -o -qq "${localZip}" store-config.json -d "${extractDir}" 2>/dev/null`);
    const configPath = join(extractDir, 'store-config.json');
    if (existsSync(configPath)) {
      return JSON.parse(readFileSync(configPath, 'utf-8'));
    }
  } catch {
    // store-config.json might not exist in some ZIPs
  }
  return null;
}

function generateHTML(rows) {
  const tableRows = rows
    .map(r => {
      const layoutUrl = `${FRONTEND_URL}/layout/${r.storeCode}`;
      return `    <tr>
      <td>${r.storeCode}</td>
      <td>${r.storeName || '-'}</td>
      <td>${r.floorName}</td>
      <td>${r.floorIndex}</td>
      <td><a href="${layoutUrl}" target="_blank">${layoutUrl}</a></td>
      <td>${r.status || '-'}</td>
    </tr>`;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>dg2n Layout Store Mapping</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; margin: 2rem; background: #f9fafb; color: #111827; }
    h1 { font-size: 1.5rem; font-weight: 600; margin-bottom: 0.25rem; }
    .meta { color: #6b7280; font-size: 0.875rem; margin-bottom: 1.5rem; }
    table { width: 100%; border-collapse: collapse; background: white; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
    th { background: #f3f4f6; text-align: left; padding: 0.625rem 0.75rem; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; color: #6b7280; border-bottom: 1px solid #e5e7eb; }
    td { padding: 0.5rem 0.75rem; font-size: 0.8125rem; border-bottom: 1px solid #f3f4f6; }
    tr:hover td { background: #f9fafb; }
    a { color: #4f46e5; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .status-live { color: #059669; font-weight: 500; }
    .summary { margin-top: 1rem; font-size: 0.8125rem; color: #6b7280; }
  </style>
</head>
<body>
  <h1>dg2n Layout Store Mapping</h1>
  <p class="meta">Generated on ${new Date().toISOString().split('T')[0]} | ${rows.length} floor layouts across ${new Set(rows.map(r => r.storeCode)).size} stores</p>
  <table>
    <thead>
      <tr>
        <th>Store Code</th>
        <th>Store Name</th>
        <th>Floor Name</th>
        <th>Floor Index</th>
        <th>Layout URL</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
${tableRows}
    </tbody>
  </table>
  <p class="summary">
    Source: <code>TRENDS_Sheet1.csv</code> |
    API: <code>dg2n-layout3d-backend.rc.dg2n.com</code>
  </p>
</body>
</html>`;
}

// --- Main ---
async function main() {
  mkdirSync(TEMP_DIR, { recursive: true });

  // Read store codes from CSV
  const csv = readFileSync(CSV_PATH, 'utf-8');
  const storeCodes = csv
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && line !== 'DIGITWIN STORE CODE' && line !== 'DIGITWIN STORE CODE ');

  console.log(`Found ${storeCodes.length} store codes`);

  // Authenticate
  const token = await authenticate();

  // Process stores in batches
  const allRows = [];
  const errors = [];
  let processed = 0;

  for (let i = 0; i < storeCodes.length; i += CONCURRENCY) {
    const batch = storeCodes.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      batch.map(async (storeCode) => {
        try {
          // 1. Get latest store save
          const save = await fetchStoreSaves(storeCode, token);
          if (!save || !save.zip_path) {
            errors.push({ storeCode, error: 'No layout data found' });
            return [];
          }

          // 2. Download ZIP and extract store-config.json
          const config = await downloadAndExtractConfig(save.zip_path, storeCode, token);
          if (!config || !config.floor) {
            // No store-config, assume single floor
            return [{
              storeCode,
              storeName: save.store_name || '',
              floorName: 'Floor 0',
              floorIndex: 0,
              status: save.status,
            }];
          }

          // 3. Map each floor
          return config.floor.map(f => ({
            storeCode,
            storeName: save.store_name || '',
            floorName: f.name || `Floor ${f.floor_index}`,
            floorIndex: f.floor_index,
            status: save.status,
          }));
        } catch (err) {
          errors.push({ storeCode, error: err.message });
          return [];
        }
      })
    );

    for (const rows of results) {
      allRows.push(...rows);
    }

    processed += batch.length;
    if (processed % 50 === 0 || processed === storeCodes.length) {
      console.log(`Progress: ${processed}/${storeCodes.length} stores (${allRows.length} floors found, ${errors.length} errors)`);
    }

    await sleep(DELAY_MS);
  }

  // Sort by store code
  allRows.sort((a, b) => a.storeCode.localeCompare(b.storeCode));

  // Generate HTML
  const html = generateHTML(allRows);
  writeFileSync(OUTPUT_HTML, html);
  console.log(`\nDone! Wrote ${OUTPUT_HTML}`);
  console.log(`  ${allRows.length} floor layouts across ${new Set(allRows.map(r => r.storeCode)).size} stores`);
  if (errors.length > 0) {
    console.log(`  ${errors.length} stores had errors:`);
    // Show first 10 errors
    errors.slice(0, 10).forEach(e => console.log(`    ${e.storeCode}: ${e.error}`));
    if (errors.length > 10) console.log(`    ... and ${errors.length - 10} more`);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
