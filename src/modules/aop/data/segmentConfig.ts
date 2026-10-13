/**
 * AOP segment groups for client-side filtering of category/brick rows.
 * Each segment matches row labels by keyword patterns.
 * "Others" is the catch-all for anything that doesn't match.
 */

export interface SegmentGroup {
  value: string;
  label: string;
  /** Case-insensitive keyword patterns to match against row labels */
  patterns: RegExp;
}

const SEGMENT_GROUPS: SegmentGroup[] = [
  {
    value: 'mens',
    label: "Men's",
    patterns: /\bmen[\s':]/i,
  },
  {
    value: 'womens',
    label: "Women's",
    patterns: /\bwomen/i,
  },
  {
    value: 'kids',
    label: 'Kids',
    patterns: /\b(?:kids?|boys?|girls?|children)/i,
  },
];

/** All segment pill options including All and Others */
export const SEGMENT_PILL_OPTIONS = [
  { value: 'all', label: 'All' },
  ...SEGMENT_GROUPS.map(g => ({ value: g.value, label: g.label })),
  { value: 'others', label: 'Others' },
];

/** Classify a row label into a segment value */
export function getRowSegment(label: string): string {
  for (const group of SEGMENT_GROUPS) {
    if (group.patterns.test(label)) return group.value;
  }
  return 'others';
}

/** Filter rows by segment value. Returns all rows if segment is 'all'. */
export function filterRowsBySegment<T extends { label: string }>(
  rows: T[],
  segment: string,
): T[] {
  if (segment === 'all') return rows;
  return rows.filter(row => getRowSegment(row.label) === segment);
}
