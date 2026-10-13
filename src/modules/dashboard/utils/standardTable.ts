import { measureTextWidth } from "@/lib/utils";

/** Minimum width per metric column before horizontal scroll appears. */
export const MIN_METRIC_COL_PX = 150;

/** Cell padding (left + right) added to the measured label width for the first column. */
const FIRST_COL_CHROME_PX = 28;
/** Clamp bounds for the data-derived first-column width. */
const FIRST_COL_MIN_PX = 160;
const FIRST_COL_MAX_PX = 360;

/**
 * Width (px) for a frozen first column sized to fit its longest label.
 * Pass the header label plus every first-cell value. Used both internally and by
 * callers that need the SAME width across sibling tables (optical alignment).
 */
export function computeFirstColWidth(labels: Array<string | null | undefined>): number {
  let max = 0;
  for (const label of labels) {
    const w = measureTextWidth(label ?? "");
    if (w > max) max = w;
  }
  return Math.round(Math.min(Math.max(max + FIRST_COL_CHROME_PX, FIRST_COL_MIN_PX), FIRST_COL_MAX_PX));
}

/** Parse a formatted metric string ("₹12.5 Cr", "1,234", "12.3%") into a sortable number. */
export function parseNumericValue(val: string): number {
  const match = val.replace(/,/g, "").match(/(-?[\d.]+)\s*(K|L|Cr)?/i);
  if (!match || !match[1]) return 0;
  const n = parseFloat(match[1]);
  if (!Number.isFinite(n)) return 0;
  const unit = match[2]?.toUpperCase();
  if (unit === "CR") return n * 10_000_000;
  if (unit === "L") return n * 100_000;
  if (unit === "K") return n * 1_000;
  return n;
}
