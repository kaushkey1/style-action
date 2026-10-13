/**
 * Shared date-range filter for the Companion App dashboards.
 * Mock data is fixed, so the filter windows the daily trend series it can see
 * and carries the selected range for everything else. When BQ is wired, pass
 * `range` into every query instead.
 */
import { createContext, useContext } from 'react';

export interface DateRange {
  from: string; // 'YYYY-MM-DD'
  to: string;
}

export const DateRangeContext = createContext<DateRange | null>(null);

export function useDateRange(): DateRange | null {
  return useContext(DateRangeContext);
}

/** Filter a `{date}` series down to the active range (no-op if unset). */
export function windowSeries<T extends { date: string }>(data: T[], range: DateRange | null): T[] {
  if (!range) return data;
  return data.filter((d) => d.date >= range.from && d.date <= range.to);
}

export function fmtRangeLabel(range: DateRange): string {
  const d = (iso: string) => {
    const [y, m, day] = iso.split('-');
    return `${day}/${m}/${y}`;
  };
  return `${d(range.from)} – ${d(range.to)}`;
}
