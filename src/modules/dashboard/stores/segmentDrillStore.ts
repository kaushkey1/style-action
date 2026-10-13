import type { DrilldownRow } from '../types/businessPulseUi';

/**
 * Module-scoped store for passing segment drill-down data to the detail page.
 * Set before navigating, consumed by SegmentDetailPage on mount.
 */
let _pending: { row: DrilldownRow; headers: string[] } | null = null;

export function setSegmentDrill(row: DrilldownRow, headers: string[]): void {
  _pending = { row, headers };
}

export function consumeSegmentDrill(): { row: DrilldownRow; headers: string[] } | null {
  const d = _pending;
  _pending = null;
  return d;
}
