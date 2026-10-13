import type { DrilldownTableRow } from '../data/mockCategoryDirectorData';

/**
 * Module-scoped store for passing subcategory drill-down data to the detail page.
 * Set before navigating, consumed by SubcategoryDrilldownPage on mount.
 */

interface DrillData {
  row: DrilldownTableRow;
  headers: string[];
  parentName: string;
}

let _pending: DrillData | null = null;

export function setSubcategoryDrill(row: DrilldownTableRow, headers: string[], parentName: string): void {
  _pending = { row, headers, parentName };
}

export function consumeSubcategoryDrill(): DrillData | null {
  const d = _pending;
  _pending = null;
  return d;
}
