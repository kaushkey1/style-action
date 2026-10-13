export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const MONTH_OPTIONS = MONTHS.map((label, index) => ({ value: String(index + 1), label }));
export const FISCAL_MONTHS = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3];
export const monthLabel = (month: number): string => MONTHS[month - 1] ?? 'Invalid month';

export function monthRange(start: number, end: number): number[] {
  if (![start, end].every((month) => Number.isInteger(month) && month >= 1 && month <= 12)) throw new Error('Choose valid start and end months.');
  return Array.from({ length: (end - start + 12) % 12 + 1 }, (_, index) => (start + index - 1) % 12 + 1);
}
