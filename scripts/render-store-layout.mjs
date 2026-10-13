#!/usr/bin/env node
/**
 * Renders 2D store layout SVGs from dg2n layout ZIPs.
 *
 * Usage:
 *   node scripts/render-store-layout.mjs                    # batch all stores
 *   node scripts/render-store-layout.mjs --store 5943       # single store
 *
 * Reads ZIPs from ~/Desktop/dg2n-layouts/{storeCode}.zip
 * Outputs HTML to ~/Desktop/dg2n-layouts/html/{storeCode}.html
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { join, basename } from 'path';
import { execSync } from 'child_process';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// --- Fixture SVG icons (from dg2n, black strokes overlaid on colored rects) ---
const FIXTURE_SVGS = {
  'WALL-BAY': `<svg viewBox="0 0 600 425" fill="none"><rect width="24" height="55" fill="black" opacity="0.5"/><rect x="576" width="24" height="55" fill="black" opacity="0.5"/><rect y="55" width="600" height="20" fill="black" opacity="0.5"/><rect x="5" y="80" width="590" height="340" stroke="black" stroke-width="10"/><line x1="300" y1="65" x2="300" y2="275" stroke="black" stroke-width="10"/></svg>`,
  '4-WAY': `<svg viewBox="0 0 1100 1100" fill="none"><line y1="386.727" x2="704.749" y2="386.727" stroke="black" stroke-width="20"/><line x1="395.25" y1="693.273" x2="1100" y2="693.273" stroke="black" stroke-width="20"/><line x1="694.051" y1="0" x2="694.051" y2="704.749" stroke="black" stroke-width="20"/><line x1="387.508" y1="395.25" x2="387.508" y2="1100" stroke="black" stroke-width="20"/><rect x="326.328" y="323.859" width="432.563" height="433.548" stroke="black" stroke-width="10"/></svg>`,
  'A-RAIL': `<svg viewBox="0 0 1200 850" fill="none"><rect x="15" y="215" width="1170" height="420" stroke="black" stroke-width="30"/><line x1="17" y1="425" x2="1189" y2="425" stroke="black" stroke-width="20"/><line x1="222" y1="650" x2="222" y2="850" stroke="black" stroke-width="30"/><line x1="222" y1="0" x2="222" y2="200" stroke="black" stroke-width="30"/><line x1="605" y1="650" x2="605" y2="850" stroke="black" stroke-width="30"/><line x1="605" y1="0" x2="605" y2="200" stroke="black" stroke-width="30"/><line x1="983" y1="650" x2="983" y2="850" stroke="black" stroke-width="30"/><line x1="983" y1="0" x2="983" y2="200" stroke="black" stroke-width="30"/></svg>`,
  'H-GONDOLA': `<svg viewBox="0 0 2300 1023" fill="none"><path d="M1115.55 518.035L650.52 222.586V798.911L1115.55 518.035Z" fill="#D9D9D9"/><rect x="158.387" y="219.336" width="2004.42" height="581.498" stroke="black" stroke-width="20"/><rect x="632.695" y="158.391" width="1183" height="706.037" stroke="black" stroke-width="20"/><line x1="312.074" y1="209.336" x2="312.074" y2="810.834" stroke="black" stroke-width="20"/><line x1="1819" y1="516.008" x2="637" y2="516.008" stroke="black" stroke-width="30"/><line x1="2151.61" y1="491.414" x2="2300" y2="491.414" stroke="black" stroke-width="40"/><line y1="491.414" x2="148.387" y2="491.414" stroke="black" stroke-width="40"/><line x1="809.379" y1="148.391" x2="809.379" y2="0" stroke="black" stroke-width="40"/><line x1="809.379" y1="1022.82" x2="809.379" y2="874.433" stroke="black" stroke-width="40"/><line x1="1243.94" y1="148.391" x2="1243.94" y2="0" stroke="black" stroke-width="40"/><line x1="1243.94" y1="1022.82" x2="1243.94" y2="874.433" stroke="black" stroke-width="40"/><line x1="1681.15" y1="148.391" x2="1681.15" y2="0" stroke="black" stroke-width="40"/><line x1="1681.15" y1="1022.82" x2="1681.15" y2="874.433" stroke="black" stroke-width="40"/></svg>`,
  'NESTED-TABLE': `<svg viewBox="0 0 1500 1200" fill="none"><rect x="10" y="510" width="1480" height="680" stroke="black" stroke-width="20"/><rect x="185" y="248" width="1130" height="430" stroke="black" stroke-width="20"/><rect x="314" y="10" width="873" height="426" stroke="black" stroke-width="20"/></svg>`,
  'IMPULSE': `<svg viewBox="0 0 1200 525" fill="none"><rect x="7.5" y="7.5" width="585" height="235" stroke="black" stroke-width="15"/><rect x="2.5" y="277.5" width="595" height="205" stroke="black" stroke-width="5"/><rect x="602.5" y="42.5" width="595" height="205" stroke="black" stroke-width="5"/><rect x="607.5" y="282.5" width="585" height="235" stroke="black" stroke-width="15"/><rect x="6.25" y="256.25" width="1187.5" height="12.5" stroke="black" stroke-width="12.5"/><line x1="54.5" y1="275" x2="54.5" y2="419" stroke="black" stroke-width="7"/><line x1="665.5" y1="106" x2="665.5" y2="250" stroke="black" stroke-width="7"/><line x1="173.5" y1="275" x2="173.5" y2="419" stroke="black" stroke-width="7"/><line x1="784.5" y1="106" x2="784.5" y2="250" stroke="black" stroke-width="7"/><line x1="803.5" y1="286" x2="803.5" y2="512" stroke="black" stroke-width="7"/><line x1="192.5" y1="12" x2="192.5" y2="238" stroke="black" stroke-width="7"/><line x1="292.5" y1="275" x2="292.5" y2="419" stroke="black" stroke-width="7"/><line x1="903.5" y1="106" x2="903.5" y2="250" stroke="black" stroke-width="7"/><line x1="411.5" y1="275" x2="411.5" y2="419" stroke="black" stroke-width="7"/><line x1="1022.5" y1="106" x2="1022.5" y2="250" stroke="black" stroke-width="7"/><line x1="1002.5" y1="286" x2="1002.5" y2="512" stroke="black" stroke-width="7"/><line x1="391.5" y1="12" x2="391.5" y2="238" stroke="black" stroke-width="7"/><line x1="530.5" y1="275" x2="530.5" y2="419" stroke="black" stroke-width="7"/><line x1="1141.5" y1="106" x2="1141.5" y2="250" stroke="black" stroke-width="7"/></svg>`,
};

// --- Config ---
const LAYOUTS_DIR = join(process.env.HOME, 'Desktop/dg2n-layouts');
const OUTPUT_DIR = join(LAYOUTS_DIR, 'html');
const SCALE = 24; // pixels per meter
const PADDING = 40; // px padding around the SVG
const CONCURRENCY = 5;

// --- Fixture dimensions (meters) — exact dg2n SVG viewBox sizes ---
const FIXTURE_DIMS = {
  'WALL-BAY':      { w: 0.6, h: 0.425 },  // per bay — multiplied by Count field
  '4-WAY':         { w: 1.1, h: 1.1 },
  'A-RAIL':        { w: 1.2, h: 0.85 },
  'H-GONDOLA':     { w: 2.3, h: 1.022 },
  'NESTED-TABLE':  { w: 1.5, h: 1.2 },
  'GLASS-TABLE':   { w: 1.5, h: 1.2 },
  'IMPULSE':       { w: 1.2, h: 0.525 },
};
const DEFAULT_DIM = { w: 1.1, h: 1.1 };

// --- Brand color mapping — matches dg2n's category-based palette ---
const BRAND_CATEGORY_COLORS = {
  // Kids/youth brands → pink
  'KB-TEAM-SPIRIT': '#ffbdff', 'KG-FRENDZ': '#ffbdff', 'RIO-GIRLS': '#ffbdff',
  'POINT-COVE': '#ffbdff', 'YB-DNMX': '#ffbdff',

  // Women's western wear → tan/light yellow
  'TEAMSPIRIT WOMENS WEAR': '#ffe8a3', 'RIO': '#ffe8a3', 'FIG': '#ffe8a3',
  'RIO-BASIC': '#ffe8a3', 'DNMX WOMENS WEAR': '#ffe8a3',

  // Men's casual → cyan
  'PERFORMAX MENS CASUAL': '#80ffff', 'DNMX MENS CASUAL': '#80ffff',
  'TEAMSPIRIT MENS CASUAL': '#80ffff', 'NETPLAY SMART CASUALS': '#80ffff',
  'LEE COOPER MENS CASUAL': '#80ffff', 'JOHN-PLAYERS': '#80ffff',
  'JOHN-PLAYERS-JEANS': '#80ffff',

  // Men's formal → light blue
  'NETPLAY FORMAL WEAR': '#c2e0ff',

  // Ethnic/fusion → yellow
  'AVAASA-SET': '#ffff85', 'KRITA': '#ffff85', 'SIYAHI': '#ffff85',
  'FUSION': '#ffff85', 'AVAASA-MIX-N-MATCH': '#ffff85',

  // Premium → dark blue
  'ROYAAJ': '#004e98',
};
const DEFAULT_BRAND_COLOR = '#4CAF50'; // green for everything else

function brandColor(brand, colorMap) {
  if (!colorMap.has(brand)) {
    colorMap.set(brand, BRAND_CATEGORY_COLORS[brand] || DEFAULT_BRAND_COLOR);
  }
  return colorMap.get(brand);
}

// --- Parse CSV ---
function parseCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const header = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    const vals = line.split(',');
    return Object.fromEntries(header.map((h, i) => [h, (vals[i] || '').trim()]));
  });
}

// --- Extract floor outline from GLB wall meshes ---
// Returns an array of wall rectangles [{x,y,w,h}] in fixture coordinates
function extractFloorOutline(glbPath) {
  try {
    const buf = readFileSync(glbPath);
    const magic = buf.readUInt32LE(0);
    if (magic !== 0x46546C67) return null;

    const jsonLen = buf.readUInt32LE(12);
    const json = JSON.parse(buf.slice(20, 20 + jsonLen).toString('utf-8'));

    const wallNodes = json.nodes?.filter(n => n.name === 'wall') || [];
    if (wallNodes.length < 3) return null;

    // Extract wall rectangles from bounding boxes
    // Use uniform thickness for clean rendering — walls vary wildly in GLB
    const rects = [];
    const WALL_THICKNESS = 0.15; // meters — uniform visual thickness for all walls
    for (const n of wallNodes) {
      if (n.mesh === undefined) continue;
      const mesh = json.meshes[n.mesh];
      const prim = mesh.primitives[0];
      const posAcc = json.accessors[prim.attributes.POSITION];
      if (!posAcc.min || !posAcc.max) continue;

      const [minX, , minZ] = posAcc.min;
      const [maxX, , maxZ] = posAcc.max;
      const rawW = maxX - minX;
      const rawH = Math.abs(maxZ - minZ);

      // Convert GLB (X,Z) to fixture (X, -Z)
      const fyMin = -maxZ;
      const fyMax = -minZ;

      // Set uniform thickness on the thin dimension
      // Extend length by WALL_THICKNESS on each end to guarantee corner overlap
      if (rawW < rawH) {
        // Vertical wall: w is thickness, h is length
        const midX = (minX + maxX) / 2;
        rects.push({
          x: midX - WALL_THICKNESS / 2,
          y: fyMin - WALL_THICKNESS,
          w: WALL_THICKNESS,
          h: (fyMax - fyMin) + WALL_THICKNESS * 2,
        });
      } else {
        // Horizontal wall: h is thickness, w is length
        const midY = (fyMin + fyMax) / 2;
        rects.push({
          x: minX - WALL_THICKNESS,
          y: midY - WALL_THICKNESS / 2,
          w: rawW + WALL_THICKNESS * 2,
          h: WALL_THICKNESS,
        });
      }
    }

    return rects.length >= 3 ? rects : null;
  } catch {
    return null;
  }
}

// --- Convex Hull (Graham scan) ---
function computeConvexHull(points) {
  if (points.length < 3) return points;
  // Deduplicate
  const seen = new Set();
  const unique = points.filter(p => {
    const key = `${p[0].toFixed(4)},${p[1].toFixed(4)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  if (unique.length < 3) return unique;

  // Find lowest point
  let start = 0;
  for (let i = 1; i < unique.length; i++) {
    if (unique[i][1] < unique[start][1] || (unique[i][1] === unique[start][1] && unique[i][0] < unique[start][0])) {
      start = i;
    }
  }
  [unique[0], unique[start]] = [unique[start], unique[0]];
  const pivot = unique[0];

  unique.sort((a, b) => {
    if (a === pivot) return -1;
    if (b === pivot) return 1;
    const angle = Math.atan2(a[1] - pivot[1], a[0] - pivot[0]) - Math.atan2(b[1] - pivot[1], b[0] - pivot[0]);
    if (Math.abs(angle) < 1e-10) {
      return Math.hypot(a[0] - pivot[0], a[1] - pivot[1]) - Math.hypot(b[0] - pivot[0], b[1] - pivot[1]);
    }
    return angle;
  });

  const hull = [unique[0], unique[1]];
  for (let i = 2; i < unique.length; i++) {
    while (hull.length > 1) {
      const a = hull[hull.length - 2];
      const b = hull[hull.length - 1];
      const c = unique[i];
      const cross = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
      if (cross <= 0) hull.pop();
      else break;
    }
    hull.push(unique[i]);
  }
  return hull;
}

// --- Concave outline via grid boundary contour tracing ---
function computeConcaveOutline(points, cellSize) {
  if (points.length < 6) return null;

  let gMinX = Infinity, gMinY = Infinity, gMaxX = -Infinity, gMaxY = -Infinity;
  points.forEach(([x, y]) => {
    gMinX = Math.min(gMinX, x); gMinY = Math.min(gMinY, y);
    gMaxX = Math.max(gMaxX, x); gMaxY = Math.max(gMaxY, y);
  });

  const pad = cellSize * 2;
  gMinX -= pad; gMinY -= pad; gMaxX += pad; gMaxY += pad;

  const cols = Math.ceil((gMaxX - gMinX) / cellSize) + 1;
  const rows = Math.ceil((gMaxY - gMinY) / cellSize) + 1;
  if (cols * rows > 100000) return null;

  // Mark occupied cells with radius expansion
  const grid = Array.from({ length: rows }, () => new Uint8Array(cols));
  const expand = 1; // expand each point by 1 cell in each direction
  points.forEach(([x, y]) => {
    const c = Math.floor((x - gMinX) / cellSize);
    const r = Math.floor((y - gMinY) / cellSize);
    for (let dr = -expand; dr <= expand; dr++) {
      for (let dc = -expand; dc <= expand; dc++) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) grid[nr][nc] = 1;
      }
    }
  });

  // Fill interior gaps (flood fill from edges to find exterior, invert)
  const exterior = Array.from({ length: rows }, () => new Uint8Array(cols));
  const queue = [];
  // Seed edges
  for (let c = 0; c < cols; c++) {
    if (!grid[0][c]) { exterior[0][c] = 1; queue.push([0, c]); }
    if (!grid[rows-1][c]) { exterior[rows-1][c] = 1; queue.push([rows-1, c]); }
  }
  for (let r = 0; r < rows; r++) {
    if (!grid[r][0]) { exterior[r][0] = 1; queue.push([r, 0]); }
    if (!grid[r][cols-1]) { exterior[r][cols-1] = 1; queue.push([r, cols-1]); }
  }
  // BFS flood fill exterior
  while (queue.length > 0) {
    const [r, c] = queue.shift();
    for (const [dr, dc] of [[0,1],[0,-1],[1,0],[-1,0]]) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !grid[nr][nc] && !exterior[nr][nc]) {
        exterior[nr][nc] = 1;
        queue.push([nr, nc]);
      }
    }
  }
  // Fill interior: any non-exterior, non-occupied cell becomes occupied
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!grid[r][c] && !exterior[r][c]) grid[r][c] = 1;
    }
  }

  // Trace boundary using contour following (clockwise)
  // Find starting point: first occupied cell from top-left scan
  let startR = -1, startC = -1;
  outer: for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c]) { startR = r; startC = c; break outer; }
    }
  }
  if (startR < 0) return null;

  // Moore neighborhood tracing
  const dirs = [[0,1],[1,1],[1,0],[1,-1],[0,-1],[-1,-1],[-1,0],[-1,1]]; // 8 directions
  const contour = [[startR, startC]];
  let cr = startR, cc = startC, dir = 7; // start looking up-left
  const maxIter = rows * cols * 2;
  for (let iter = 0; iter < maxIter; iter++) {
    // Find next boundary cell
    let found = false;
    const searchStart = (dir + 5) % 8; // backtrack direction
    for (let i = 0; i < 8; i++) {
      const d = (searchStart + i) % 8;
      const nr = cr + dirs[d][0], nc = cc + dirs[d][1];
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc]) {
        cr = nr; cc = nc; dir = d;
        found = true;
        break;
      }
    }
    if (!found) break;
    if (cr === startR && cc === startC) break; // closed loop
    contour.push([cr, cc]);
  }

  if (contour.length < 4) return null;

  // Convert grid coords to world coords
  const worldContour = contour.map(([r, c]) => [
    gMinX + (c + 0.5) * cellSize,
    gMinY + (r + 0.5) * cellSize,
  ]);

  // Simplify: reduce points using Douglas-Peucker
  return simplifyPolygon(worldContour, cellSize * 0.5);
}

function simplifyPolygon(points, tolerance) {
  if (points.length <= 4) return points;
  // Douglas-Peucker simplification
  function dpSimplify(pts, tol) {
    if (pts.length <= 2) return pts;
    let maxDist = 0, maxIdx = 0;
    const [sx, sy] = pts[0], [ex, ey] = pts[pts.length - 1];
    const dx = ex - sx, dy = ey - sy;
    const len = Math.hypot(dx, dy);
    for (let i = 1; i < pts.length - 1; i++) {
      const d = len > 0
        ? Math.abs(dy * pts[i][0] - dx * pts[i][1] + ex * sy - ey * sx) / len
        : Math.hypot(pts[i][0] - sx, pts[i][1] - sy);
      if (d > maxDist) { maxDist = d; maxIdx = i; }
    }
    if (maxDist > tol) {
      const left = dpSimplify(pts.slice(0, maxIdx + 1), tol);
      const right = dpSimplify(pts.slice(maxIdx), tol);
      return left.slice(0, -1).concat(right);
    }
    return [pts[0], pts[pts.length - 1]];
  }
  return dpSimplify(points, tolerance);
}

// --- Get fixture size ---
function getFixtureSize(blockName, fixtureTypeMap, count) {
  const fixtureType = fixtureTypeMap[blockName] || 'unknown';

  // Wall bays: width = Count * 0.6m (matches dg2n rendering)
  if (fixtureType === 'WALL-BAY') {
    const bays = count || 1;
    return { w: FIXTURE_DIMS['WALL-BAY'].w * bays, h: FIXTURE_DIMS['WALL-BAY'].h };
  }

  return FIXTURE_DIMS[fixtureType] || DEFAULT_DIM;
}

// --- Process a single store ZIP ---
function processStore(zipPath) {
  const storeCode = basename(zipPath, '.zip');
  const extractDir = join(LAYOUTS_DIR, `_tmp_${storeCode}`);
  mkdirSync(extractDir, { recursive: true });

  try {
    execSync(`unzip -o -qq "${zipPath}" -d "${extractDir}" 2>/dev/null`, { stdio: 'pipe' });
  } catch {
    return null;
  }

  // Parse store-config.json
  const configPath = join(extractDir, 'store-config.json');
  if (!existsSync(configPath)) {
    cleanup(extractDir);
    return null;
  }
  const config = JSON.parse(readFileSync(configPath, 'utf-8'));
  const floors = config.floor || [{ name: 'GF', floor_index: 0 }];
  const fixtureTypeMap = config.block_fixture_types || {};

  // Parse location-master.csv
  const locPath = join(extractDir, 'location-master.csv');
  if (!existsSync(locPath)) {
    cleanup(extractDir);
    return null;
  }
  const fixtures = parseCSV(readFileSync(locPath, 'utf-8'));

  // Parse brand-fixture-report.csv
  const reportPath = join(extractDir, 'brand-fixture-report.csv');
  const brandReport = existsSync(reportPath) ? parseCSV(readFileSync(reportPath, 'utf-8')) : [];

  // Determine main origin for coordinate normalization
  const originCounts = {};
  fixtures.forEach(f => {
    const key = `${f['Origin X (m)']},${f['Origin Y (m)']}`;
    originCounts[key] = (originCounts[key] || 0) + 1;
  });
  let mainOrigin = [0, 0];
  let maxCount = 0;
  Object.entries(originCounts).forEach(([key, count]) => {
    if (count > maxCount && key !== '0,0') {
      maxCount = count;
      mainOrigin = key.split(',').map(Number);
    }
  });

  // Normalize fixture positions
  const normalizedFixtures = fixtures.map(f => {
    let posX = parseFloat(f['Pos X (m)']) || 0;
    let posY = parseFloat(f['Pos Y (m)']) || 0;
    const originX = parseFloat(f['Origin X (m)']) || 0;
    const originY = parseFloat(f['Origin Y (m)']) || 0;

    // If origin is 0,0 and position is far from store bounds, apply offset
    if (originX === 0 && originY === 0 && (posX < -100 || posY < -100)) {
      posX = posX - mainOrigin[0];
      posY = posY - mainOrigin[1];
    }

    return {
      blockName: f['Block Name'],
      floorIndex: parseInt(f['Floor Index']) || 0,
      x: posX,
      y: posY,
      rotation: parseFloat(f['Rotation Z (deg)']) || parseFloat(f['Rotation Y (deg)']) || 0,
      brand: f['Brand'] || 'unassigned',
      fixtureId: f['Fixture ID'] || '',
      count: parseInt(f['Count']) || 1,
    };
  });

  // Extract floor outlines
  const floorOutlines = {};
  floors.forEach(floor => {
    const glbName = floor.glb_file_name || `GF-floor-${floor.floor_index}.glb`;
    const glbPath = join(extractDir, glbName);
    if (existsSync(glbPath)) {
      floorOutlines[floor.floor_index] = extractFloorOutline(glbPath);
    }
  });

  // Get store name from config or first fixture
  const storeName = storeCode;

  cleanup(extractDir);

  return { storeCode, storeName, floors, normalizedFixtures, fixtureTypeMap, floorOutlines, brandReport };
}

function cleanup(dir) {
  try { execSync(`rm -rf "${dir}"`, { stdio: 'pipe' }); } catch { /* ignore */ }
}

// --- SVG Rendering ---
function renderFloorSVG(storeData, floorIndex, colorMap) {
  const fixtures = storeData.normalizedFixtures.filter(f => f.floorIndex === floorIndex);
  const outline = storeData.floorOutlines[floorIndex];

  if (fixtures.length === 0 && !outline) return null;

  // Compute bounds from fixtures AND floor outline (both in fixture coordinate space now)
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  fixtures.forEach(f => {
    const size = getFixtureSize(f.blockName, storeData.fixtureTypeMap, f.count);
    minX = Math.min(minX, f.x - size.w / 2);
    minY = Math.min(minY, f.y - size.h / 2);
    maxX = Math.max(maxX, f.x + size.w / 2);
    maxY = Math.max(maxY, f.y + size.h / 2);
  });

  // Include wall rect corners in bounds
  if (outline && outline.length >= 3) {
    outline.forEach(r => {
      minX = Math.min(minX, r.x, r.x + r.w);
      minY = Math.min(minY, r.y, r.y + r.h);
      maxX = Math.max(maxX, r.x, r.x + r.w);
      maxY = Math.max(maxY, r.y, r.y + r.h);
    });
  }

  // Add padding
  const floorPad = 1.0; // meters
  minX -= floorPad;
  minY -= floorPad;
  maxX += floorPad;
  maxY += floorPad;

  // Handle edge case
  if (!isFinite(minX)) { minX = 0; minY = 0; maxX = 50; maxY = 30; }

  const width = (maxX - minX) * SCALE + PADDING * 2;
  const height = (maxY - minY) * SCALE + PADDING * 2;

  const tx = (x) => (x - minX) * SCALE + PADDING;
  const ty = (y) => (maxY - y) * SCALE + PADDING; // flip Y

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.round(width)}" height="${Math.round(height)}" viewBox="0 0 ${Math.round(width)} ${Math.round(height)}" style="background:#f8fafc;">`;

  // Draw floor outline — wall rectangles from GLB, or fallback to fixture-derived concave hull
  if (outline && outline.length >= 3) {
    // Draw each wall as a filled rectangle — natural overlap at corners gives clean joints
    for (const r of outline) {
      // Convert all 4 corners to SVG coords, then derive rect from min/max
      const sx1 = tx(r.x), sx2 = tx(r.x + r.w);
      const sy1 = ty(r.y), sy2 = ty(r.y + r.h);
      const rx = Math.min(sx1, sx2);
      const ry = Math.min(sy1, sy2);
      const rw = Math.abs(sx2 - sx1);
      const rh = Math.abs(sy2 - sy1);
      if (rw < 0.5) continue; // skip degenerate rects
      if (rh < 0.5) continue;
      svg += `<rect x="${rx.toFixed(1)}" y="${ry.toFixed(1)}" width="${rw.toFixed(1)}" height="${rh.toFixed(1)}" fill="#334155"/>`;
    }
  } else {
    const fixturePoints = fixtures.map(f => [f.x, f.y]);
    const concave = computeConcaveOutline(fixturePoints, 2.0);
    if (concave && concave.length > 4) {
      const pts = concave.map(([x, y]) => `${tx(x).toFixed(1)},${ty(y).toFixed(1)}`).join(' ');
      svg += `<polygon points="${pts}" fill="none" stroke="#334155" stroke-width="1.5" opacity="0.8"/>`;
    } else {
      svg += `<rect x="${PADDING}" y="${PADDING}" width="${((maxX-minX)*SCALE).toFixed(1)}" height="${((maxY-minY)*SCALE).toFixed(1)}" fill="none" stroke="#334155" stroke-width="1.5" opacity="0.8" rx="4"/>`;
    }
  }

  // Draw fixtures
  const rxPx = (2.1 * SCALE / 18).toFixed(1); // rounded corners scaled to match dg2n
  const strokeW = (0.5 * SCALE / 18).toFixed(2); // stroke width scaled

  fixtures.forEach(f => {
    const size = getFixtureSize(f.blockName, storeData.fixtureTypeMap, f.count);
    const fixtureType = storeData.fixtureTypeMap[f.blockName] || 'unknown';
    const color = brandColor(f.brand, colorMap);
    const cx = tx(f.x);
    const cy = ty(f.y);
    const w = size.w * SCALE;
    const h = size.h * SCALE;
    const isWallBay = fixtureType === 'WALL-BAY';

    // Wrap entire fixture in a group with rotation applied once
    const hasRotation = f.rotation !== 0;
    if (hasRotation) {
      svg += `<g transform="rotate(${-f.rotation} ${cx.toFixed(1)} ${cy.toFixed(1)})">`;
    }

    // Wall-bay inward offset: push 0.28m away from wall (matches dg2n translate(0,0.28))
    // In our flipped-Y SVG, "down" in local coords = inward from wall
    const wallOffset = isWallBay ? 0.28 * SCALE : 0;

    if (isWallBay) {
      // Render each bay as a separate rect + icon (matches dg2n structure)
      const bayW = FIXTURE_DIMS['WALL-BAY'].w * SCALE;
      const bayH = FIXTURE_DIMS['WALL-BAY'].h * SCALE;
      const iconSvg = FIXTURE_SVGS['WALL-BAY'];
      const iconContent = iconSvg.replace(/<\/?svg[^>]*>/g, '');

      for (let b = 0; b < f.count; b++) {
        const offset = (b - (f.count - 1) / 2) * bayW;
        const bx = cx + offset - bayW / 2;
        const by = cy - bayH / 2 + wallOffset;
        svg += `<rect x="${bx.toFixed(1)}" y="${by.toFixed(1)}" width="${bayW.toFixed(1)}" height="${bayH.toFixed(1)}" fill="${color}" opacity="0.7" rx="${rxPx}" stroke="#1e293b" stroke-width="${strokeW}"/>`;
        svg += `<svg x="${bx.toFixed(1)}" y="${by.toFixed(1)}" width="${bayW.toFixed(1)}" height="${bayH.toFixed(1)}" viewBox="0 0 600 425" preserveAspectRatio="xMidYMid meet" fill="none">${iconContent}</svg>`;
      }
    } else {
      // Non-wall-bay fixtures: single rect + icon
      const rx = cx - w / 2;
      const ry = cy - h / 2;
      svg += `<rect x="${rx.toFixed(1)}" y="${ry.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" fill="${color}" opacity="0.7" rx="${rxPx}" stroke="#1e293b" stroke-width="${strokeW}"/>`;

      const iconType = fixtureType === 'GLASS-TABLE' ? 'NESTED-TABLE' : fixtureType;
      const iconSvg = FIXTURE_SVGS[iconType];
      if (iconSvg) {
        const vbMatch = iconSvg.match(/viewBox="([^"]+)"/);
        const vb = vbMatch ? vbMatch[1] : '0 0 100 100';
        svg += `<svg x="${rx.toFixed(1)}" y="${ry.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" viewBox="${vb}" preserveAspectRatio="xMidYMid meet" fill="none">${iconSvg.replace(/<\/?svg[^>]*>/g, '')}</svg>`;
      }
    }

    // Close rotation group BEFORE text so labels always stay horizontal
    if (hasRotation) {
      svg += '</g>';
    }

    // Brand label below fixture (matches dg2n: sans-serif, bold, dark text)
    // Text is always horizontal — positioned at the fixture center (unrotated)
    const label = f.brand.length > 20 ? f.brand.substring(0, 19) + '..' : f.brand;
    const fontSize = Math.min(6, Math.max(4, Math.max(w, h) / Math.max(label.length, 1) * 0.8));
    const labelY = cy + Math.max(w, h) / 2 + fontSize + 1.5;
    svg += `<text x="${cx.toFixed(1)}" y="${labelY.toFixed(1)}" text-anchor="middle" fill="#1e293b" font-size="${fontSize.toFixed(1)}" font-family="sans-serif" font-weight="600">${escapeXml(label)}</text>`;
    // Fixture ID (smaller, lighter — only for non-wall-bay fixtures)
    if (f.fixtureId && !isWallBay) {
      const idLabel = f.fixtureId.length > 14 ? f.fixtureId.substring(0, 13) + '..' : f.fixtureId;
      const idFontSize = fontSize * 0.7;
      svg += `<text x="${cx.toFixed(1)}" y="${(labelY + idFontSize + 1).toFixed(1)}" text-anchor="middle" fill="#94a3b8" font-size="${idFontSize.toFixed(1)}" font-family="sans-serif">${escapeXml(idLabel)}</text>`;
    }
  });

  svg += '</svg>';
  return { svg, width: Math.round(width), height: Math.round(height) };
}

function escapeXml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// --- HTML Generation ---
function generateStoreHTML(storeData) {
  const colorMap = new Map();
  const floorSVGs = [];

  for (const floor of storeData.floors) {
    const result = renderFloorSVG(storeData, floor.floor_index, colorMap);
    if (result) {
      floorSVGs.push({ floor, ...result });
    }
  }

  if (floorSVGs.length === 0) return null;

  // Legend
  const legendItems = [...colorMap.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([brand, color]) => `<span style="display:inline-flex;align-items:center;gap:4px;margin-right:12px;margin-bottom:4px;"><span style="width:10px;height:10px;border-radius:2px;background:${color};display:inline-block;"></span><span>${escapeXml(brand)}</span></span>`)
    .join('');

  // Floor tabs
  const tabs = floorSVGs.map((f, i) =>
    `<button onclick="showFloor(${i})" class="floor-tab${i === 0 ? ' active' : ''}" id="tab-${i}">${escapeXml(f.floor.name || 'Floor ' + f.floor.floor_index)}</button>`
  ).join('');

  const floorPanels = floorSVGs.map((f, i) =>
    `<div class="floor-panel${i === 0 ? '' : ' hidden'}" id="floor-${i}">${f.svg}</div>`
  ).join('\n');

  // Stats
  const totalFixtures = storeData.normalizedFixtures.length;
  const totalBrands = new Set(storeData.normalizedFixtures.map(f => f.brand)).size;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Store Layout — ${escapeXml(storeData.storeCode)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; background: #f8fafc; color: #1e293b; }
    .header { padding: 12px 24px; background: white; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: space-between; }
    .header h1 { font-size: 14px; font-weight: 600; }
    .header .meta { font-size: 12px; color: #64748b; }
    .toolbar { padding: 8px 24px; background: white; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; gap: 8px; }
    .floor-tab { padding: 6px 14px; border-radius: 6px; border: 1px solid #e2e8f0; background: transparent; color: #64748b; font-size: 12px; font-weight: 500; cursor: pointer; }
    .floor-tab.active { background: #1e293b; color: white; border-color: #1e293b; }
    .floor-tab:hover:not(.active) { background: #f1f5f9; color: #334155; }
    .layout-container { padding: 16px 24px; overflow: auto; display: flex; justify-content: center; background: #f8fafc; }
    .floor-panel { display: flex; justify-content: center; }
    .floor-panel.hidden { display: none; }
    .legend { padding: 12px 24px; background: white; border-top: 1px solid #e2e8f0; font-size: 11px; line-height: 1.8; display: flex; flex-wrap: wrap; }
    .stats { padding: 8px 24px; background: white; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; display: flex; gap: 16px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>Store ${escapeXml(storeData.storeCode)}</h1>
    </div>
    <div class="meta">${totalFixtures} fixtures &middot; ${totalBrands} brands &middot; ${storeData.floors.length} floor${storeData.floors.length > 1 ? 's' : ''}</div>
  </div>
  <div class="toolbar">
    ${tabs}
  </div>
  <div class="layout-container">
    ${floorPanels}
  </div>
  <div class="legend">${legendItems}</div>
  <div class="stats">
    <span>Store Code: ${escapeXml(storeData.storeCode)}</span>
    <span>Generated: ${new Date().toISOString().split('T')[0]}</span>
  </div>
  <script>
    function showFloor(idx) {
      document.querySelectorAll('.floor-panel').forEach((p, i) => p.classList.toggle('hidden', i !== idx));
      document.querySelectorAll('.floor-tab').forEach((t, i) => t.classList.toggle('active', i === idx));
    }
  </script>
</body>
</html>`;
}

// --- Main ---
async function main() {
  const args = process.argv.slice(2);
  const singleStore = args.includes('--store') ? args[args.indexOf('--store') + 1] : null;

  mkdirSync(OUTPUT_DIR, { recursive: true });

  let zipFiles;
  if (singleStore) {
    const zipPath = join(LAYOUTS_DIR, `${singleStore}.zip`);
    if (!existsSync(zipPath)) {
      console.error(`ZIP not found: ${zipPath}`);
      process.exit(1);
    }
    zipFiles = [zipPath];
  } else {
    zipFiles = readdirSync(LAYOUTS_DIR)
      .filter(f => f.endsWith('.zip'))
      .map(f => join(LAYOUTS_DIR, f));
  }

  console.log(`Processing ${zipFiles.length} store(s)...`);

  let success = 0;
  let errors = 0;
  let totalFloors = 0;

  for (let i = 0; i < zipFiles.length; i += CONCURRENCY) {
    const batch = zipFiles.slice(i, i + CONCURRENCY);

    for (const zipPath of batch) {
      const storeCode = basename(zipPath, '.zip');
      try {
        const data = processStore(zipPath);
        if (!data) {
          errors++;
          continue;
        }

        const html = generateStoreHTML(data);
        if (!html) {
          errors++;
          continue;
        }

        const outPath = join(OUTPUT_DIR, `${storeCode}.html`);
        writeFileSync(outPath, html);
        success++;
        totalFloors += data.floors.length;
      } catch (err) {
        console.error(`  Error ${storeCode}: ${err.message}`);
        errors++;
      }
    }

    const processed = Math.min(i + CONCURRENCY, zipFiles.length);
    if (processed % 50 === 0 || processed === zipFiles.length) {
      console.log(`Progress: ${processed}/${zipFiles.length} (${success} ok, ${errors} errors, ${totalFloors} floors)`);
    }
  }

  console.log(`\nDone! ${success} HTML files written to ${OUTPUT_DIR}`);
  console.log(`  ${totalFloors} total floors, ${errors} errors`);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
