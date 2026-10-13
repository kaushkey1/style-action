/** Exception rule display labels + helpers, shared by ExceptionRow and ExceptionsDrawer. */

export const RULE_LABELS: Record<string, string> = {
  high_growth: 'High Growth',
  steep_decline: 'Steep Decline',
  py_data_gap: 'Prior-Year Data Gap',
  closed_store_sales: 'Closed Store Still Selling',
  phasing_deviation: 'Quarterly Phasing Deviation',
};

export function titleCase(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Human label for an exception rule code. */
export function ruleLabel(rule: string): string {
  return RULE_LABELS[rule] ?? titleCase(rule);
}
