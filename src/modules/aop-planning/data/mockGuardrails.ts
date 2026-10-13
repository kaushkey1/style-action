import type { GuardrailBand } from '../types/aopPlanning.types';

export const GROWTH_BANDS: Record<string, GuardrailBand> = {
  'A+': { minGrowth: 4, maxGrowth: 7 },
  A: { minGrowth: 4, maxGrowth: 7 },
  A1: { minGrowth: 3, maxGrowth: 6 },
  A2: { minGrowth: 2, maxGrowth: 5 },
  A3: { minGrowth: 1, maxGrowth: 4 },
};

export const DEFAULT_BAND: GuardrailBand = { minGrowth: 2, maxGrowth: 7 };

export const GM_PCT_FLOOR = 40;

// Apr, May, Jun, Jul, Aug, Sep, Oct, Nov, Dec, Jan, Feb, Mar
export const SEASONALITY_WEIGHTS = [7, 6, 5, 6, 7, 8, 12, 11, 10, 8, 7, 13];

// Last year's actual month-wise sales, expressed as a % share of the year (sums
// to 100). Used to auto-populate the seasonality index when a growth % is applied.
// Apr, May, Jun, Jul, Aug, Sep, Oct, Nov, Dec, Jan, Feb, Mar
export const LY_MONTHLY_SALES_RATIO = [6, 5, 5, 6, 8, 9, 13, 12, 11, 7, 6, 12];

// Blend confirmed in planning: 50% weight to last year's month-wise sales ratio
// + 50% weight to the seasonality index.
export const LY_BLEND_WEIGHT = 0.5;
export const INDEX_BLEND_WEIGHT = 0.5;

/**
 * Auto-populate the seasonality index from last year's data:
 *   blended[m] = 0.5 x LY_month_ratio[m] + 0.5 x seasonality_index[m]
 * The result is normalised to sum to 100% and rounded to 1 decimal. Remains
 * fully editable by the planner afterwards.
 */
export function computeBlendedSeasonality(
  lyRatio: readonly number[],
  seasonalityIndex: readonly number[],
): number[] {
  const blended = seasonalityIndex.map(
    (idx, i) => LY_BLEND_WEIGHT * (lyRatio[i] ?? 0) + INDEX_BLEND_WEIGHT * idx,
  );
  const total = blended.reduce((sum, w) => sum + w, 0);
  if (total <= 0) return blended.map(() => 0);
  return blended.map((w) => Math.round((w / total) * 100 * 10) / 10);
}

export function getGuardrailBand(grade: string | null): GuardrailBand {
  if (!grade) return DEFAULT_BAND;
  return GROWTH_BANDS[grade] ?? DEFAULT_BAND;
}

export function computeGuardrailStatus(
  growthPct: number,
  band: GuardrailBand,
): 'within' | 'above' | 'below' {
  if (growthPct > band.maxGrowth) return 'above';
  if (growthPct < band.minGrowth) return 'below';
  return 'within';
}
