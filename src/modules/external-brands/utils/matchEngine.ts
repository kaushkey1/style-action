import type {
  BrandStyle,
  Slot,
  MatchResult,
  AttributeMatch,
} from '../types/external-brands.types';
import { getCurrencySymbol } from '@/lib/utils';

// ─── Match Engine Configuration ──────────────────────────────────────────────

interface MatchWeights {
  brick: number;
  price: number;
  fit: number;
  fabric: number;
  pattern: number;
  wash: number;
  color: number;
}

const DEFAULT_WEIGHTS: MatchWeights = {
  brick: 0.30, // 30% - Most important, must match
  price: 0.20, // 20% - Critical for positioning
  fit: 0.15,   // 15% - Key style attribute
  fabric: 0.15, // 15% - Material matters
  pattern: 0.10, // 10% - Visual attribute
  wash: 0.05,   // 5% - For denim/washed items
  color: 0.05,  // 5% - Color family
};

const AUTO_SHORTLIST_THRESHOLD = 80;
const DISPLAY_THRESHOLD = 60;

// ─── Attribute Matching Functions ────────────────────────────────────────────

function matchBrick(styleValue: string, slotBrick: string): AttributeMatch {
  const normalized = styleValue.toLowerCase().trim();
  const target = slotBrick.toLowerCase().trim();

  if (normalized === target) {
    return { attribute: 'brick', status: 'match', note: `${styleValue} matches` };
  }

  // Handle similar bricks
  const similarBricks: Record<string, string[]> = {
    'denim': ['jeans', 'denims'],
    'shirts': ['shirt', 'casual shirts'],
    'polos': ['polo', 'polo shirts'],
    'jackets': ['jacket', 'outerwear'],
  };

  for (const [key, values] of Object.entries(similarBricks)) {
    if ((key === target || values.includes(target)) &&
        (key === normalized || values.includes(normalized))) {
      return { attribute: 'brick', status: 'partial', note: `${styleValue} similar to ${slotBrick}` };
    }
  }

  return { attribute: 'brick', status: 'miss', note: `${styleValue} ≠ ${slotBrick}` };
}

function matchPrice(mrp: number, priceBand: { min: number; max: number }): AttributeMatch {
  if (mrp >= priceBand.min && mrp <= priceBand.max) {
    return {
      attribute: 'price',
      status: 'match',
      note: `${getCurrencySymbol()}${mrp} in range ${getCurrencySymbol()}${priceBand.min}-${priceBand.max}`
    };
  }

  const tolerance = 0.1; // 10% tolerance
  const midPoint = (priceBand.min + priceBand.max) / 2;
  const deviation = Math.abs(mrp - midPoint) / midPoint;

  if (deviation <= tolerance) {
    return {
      attribute: 'price',
      status: 'partial',
      note: `${getCurrencySymbol()}${mrp} near range ${getCurrencySymbol()}${priceBand.min}-${priceBand.max}`
    };
  }

  return {
    attribute: 'price',
    status: 'miss',
    note: `${getCurrencySymbol()}${mrp} outside ${getCurrencySymbol()}${priceBand.min}-${priceBand.max}`
  };
}

function matchAttribute(
  styleAttr: { value: string; confidence: number } | undefined,
  slotAttr: string | undefined,
  attributeName: string
): AttributeMatch {
  if (!slotAttr) {
    return { attribute: attributeName, status: 'na', note: 'Not specified' };
  }

  if (!styleAttr || !styleAttr.value || styleAttr.value === 'NA') {
    return { attribute: attributeName, status: 'na', note: 'Not available' };
  }

  // Low confidence = partial match at best
  if (styleAttr.confidence < 60) {
    return {
      attribute: attributeName,
      status: 'partial',
      note: `Low confidence (${styleAttr.confidence}%)`
    };
  }

  const normalized = styleAttr.value.toLowerCase().trim();
  const target = slotAttr.toLowerCase().trim();

  if (normalized === target) {
    return { attribute: attributeName, status: 'match', note: `${styleAttr.value} matches` };
  }

  // Handle similar values
  const similarities: Record<string, string[]> = {
    // Fits
    'slim': ['slim fit', 'tailored'],
    'regular': ['regular fit', 'classic', 'standard'],
    'relaxed': ['relaxed fit', 'comfort', 'loose'],

    // Washes
    'dark': ['dark indigo', 'dark blue', 'dark wash'],
    'light': ['light stone', 'light blue', 'light wash'],
    'medium': ['medium blue', 'medium wash'],

    // Patterns
    'solid': ['plain', 'solid color'],
    'striped': ['stripes', 'pinstripe'],
    'printed': ['print', 'graphic', 'floral'],

    // Fabrics
    'cotton': ['100% cotton', 'cotton blend', 'cotton mix'],
    'denim': ['denim fabric', 'jeans material'],
    'polyester': ['poly', 'synthetic', 'polyester blend'],
  };

  for (const [key, values] of Object.entries(similarities)) {
    if ((key === target || values.includes(target)) &&
        (key === normalized || values.includes(normalized))) {
      return {
        attribute: attributeName,
        status: 'partial',
        note: `${styleAttr.value} similar to ${slotAttr}`
      };
    }
  }

  return { attribute: attributeName, status: 'miss', note: `${styleAttr.value} ≠ ${slotAttr}` };
}

// ─── Main Match Calculation ──────────────────────────────────────────────────

export function calculateMatch(
  style: BrandStyle,
  slot: Slot,
  weights: Partial<MatchWeights> = {}
): MatchResult {
  const w = { ...DEFAULT_WEIGHTS, ...weights };
  const breakdown: AttributeMatch[] = [];
  let totalScore = 0;
  let totalWeight = 0;

  // 1. Match Brick (hard filter + weighted)
  const brickAttr = style.attributes.brick;
  const brickMatch = brickAttr ? matchBrick(brickAttr.value, slot.brick) :
    { attribute: 'brick', status: 'miss' as const, note: 'No brick data' };
  breakdown.push(brickMatch);

  // Hard filter: brick must at least partially match
  if (brickMatch.status === 'miss') {
    return {
      styleId: style.id,
      slotId: slot.id,
      score: 0,
      breakdown,
      hardFilterFailed: true,
    };
  }

  // Add brick score
  if (brickMatch.status === 'match') totalScore += w.brick * 100;
  else if (brickMatch.status === 'partial') totalScore += w.brick * 60;
  totalWeight += w.brick;

  // 2. Match Price
  const priceMatch = matchPrice(style.mrp, slot.priceBand);
  breakdown.push(priceMatch);
  if (priceMatch.status === 'match') totalScore += w.price * 100;
  else if (priceMatch.status === 'partial') totalScore += w.price * 70;
  else totalScore += w.price * 20;
  totalWeight += w.price;

  // 3. Match Fit
  if (slot.attributes.fit) {
    const fitMatch = matchAttribute(style.attributes.fit, slot.attributes.fit, 'fit');
    breakdown.push(fitMatch);
    if (fitMatch.status === 'match') totalScore += w.fit * 100;
    else if (fitMatch.status === 'partial') totalScore += w.fit * 60;
    else if (fitMatch.status !== 'na') totalScore += w.fit * 20;
    if (fitMatch.status !== 'na') totalWeight += w.fit;
  }

  // 4. Match Fabric
  if (slot.attributes.fabric || style.attributes.fabric) {
    const fabricMatch = matchAttribute(
      style.attributes.fabric,
      slot.attributes.fabric || slot.attributes.material,
      'fabric'
    );
    breakdown.push(fabricMatch);
    if (fabricMatch.status === 'match') totalScore += w.fabric * 100;
    else if (fabricMatch.status === 'partial') totalScore += w.fabric * 60;
    else if (fabricMatch.status !== 'na') totalScore += w.fabric * 20;
    if (fabricMatch.status !== 'na') totalWeight += w.fabric;
  }

  // 5. Match Pattern
  if (slot.attributes.pattern) {
    const patternMatch = matchAttribute(style.attributes.pattern, slot.attributes.pattern, 'pattern');
    breakdown.push(patternMatch);
    if (patternMatch.status === 'match') totalScore += w.pattern * 100;
    else if (patternMatch.status === 'partial') totalScore += w.pattern * 60;
    else if (patternMatch.status !== 'na') totalScore += w.pattern * 20;
    if (patternMatch.status !== 'na') totalWeight += w.pattern;
  }

  // 6. Match Wash (for denim)
  if (slot.attributes.wash && slot.brick.toLowerCase().includes('denim')) {
    const washMatch = matchAttribute(style.attributes.wash, slot.attributes.wash, 'wash');
    breakdown.push(washMatch);
    if (washMatch.status === 'match') totalScore += w.wash * 100;
    else if (washMatch.status === 'partial') totalScore += w.wash * 60;
    else if (washMatch.status !== 'na') totalScore += w.wash * 20;
    if (washMatch.status !== 'na') totalWeight += w.wash;
  }

  // 7. Match Color
  if (slot.attributes.color) {
    const colorMatch = matchAttribute(
      style.attributes.color || { value: style.colourway || 'NA', confidence: 90 },
      slot.attributes.color,
      'color'
    );
    breakdown.push(colorMatch);
    if (colorMatch.status === 'match') totalScore += w.color * 100;
    else if (colorMatch.status === 'partial') totalScore += w.color * 60;
    else if (colorMatch.status !== 'na') totalScore += w.color * 20;
    if (colorMatch.status !== 'na') totalWeight += w.color;
  }

  // Calculate final score
  const finalScore = totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;

  return {
    styleId: style.id,
    slotId: slot.id,
    score: finalScore,
    breakdown,
    hardFilterFailed: false,
  };
}

// ─── Batch Match Processing ──────────────────────────────────────────────────

export function matchStylesWithSlots(
  styles: BrandStyle[],
  slots: Slot[],
  weights?: Partial<MatchWeights>
): MatchResult[] {
  const results: MatchResult[] = [];

  for (const style of styles) {
    for (const slot of slots) {
      // Skip locked slots
      if (slot.state === 'locked_covered' || slot.state === 'locked_partial') {
        continue;
      }

      const match = calculateMatch(style, slot, weights);

      // Only keep matches above display threshold
      if (match.score >= DISPLAY_THRESHOLD && !match.hardFilterFailed) {
        results.push(match);
      }
    }
  }

  return results;
}

// ─── Find Best Fit ───────────────────────────────────────────────────────────

export function findBestFitSlot(
  style: BrandStyle,
  slots: Slot[],
  weights?: Partial<MatchWeights>
): { slotId: string; score: number } | null {
  let bestMatch: { slotId: string; score: number } | null = null;

  for (const slot of slots) {
    // Skip locked slots
    if (slot.state === 'locked_covered') continue;

    const match = calculateMatch(style, slot, weights);

    if (!match.hardFilterFailed && match.score >= DISPLAY_THRESHOLD) {
      if (!bestMatch || match.score > bestMatch.score) {
        bestMatch = { slotId: slot.id, score: match.score };
      }
    }
  }

  return bestMatch;
}

// ─── Auto-Shortlist Detection ────────────────────────────────────────────────

export function isAutoShortlisted(score: number): boolean {
  return score >= AUTO_SHORTLIST_THRESHOLD;
}

export function getAutoShortlistThreshold(): number {
  return AUTO_SHORTLIST_THRESHOLD;
}

export function getDisplayThreshold(): number {
  return DISPLAY_THRESHOLD;
}

// ─── Sort Matches ────────────────────────────────────────────────────────────

export function sortMatches(matches: MatchResult[]): MatchResult[] {
  return [...matches].sort((a, b) => {
    // Auto-shortlisted first
    const aAuto = isAutoShortlisted(a.score);
    const bAuto = isAutoShortlisted(b.score);
    if (aAuto && !bAuto) return -1;
    if (!aAuto && bAuto) return 1;

    // Then by score
    return b.score - a.score;
  });
}

// ─── Group Matches by Slot ───────────────────────────────────────────────────

export function groupMatchesBySlot(matches: MatchResult[]): Map<string, MatchResult[]> {
  const grouped = new Map<string, MatchResult[]>();

  for (const match of matches) {
    const slotMatches = grouped.get(match.slotId) || [];
    slotMatches.push(match);
    grouped.set(match.slotId, slotMatches);
  }

  // Sort each slot's matches
  for (const [slotId, slotMatches] of grouped.entries()) {
    grouped.set(slotId, sortMatches(slotMatches));
  }

  return grouped;
}

// ─── Group Matches by Style ──────────────────────────────────────────────────

export function groupMatchesByStyle(matches: MatchResult[]): Map<string, MatchResult[]> {
  const grouped = new Map<string, MatchResult[]>();

  for (const match of matches) {
    const styleMatches = grouped.get(match.styleId) || [];
    styleMatches.push(match);
    grouped.set(match.styleId, styleMatches);
  }

  // Sort each style's matches by score
  for (const [styleId, styleMatches] of grouped.entries()) {
    grouped.set(styleId, styleMatches.sort((a, b) => b.score - a.score));
  }

  return grouped;
}