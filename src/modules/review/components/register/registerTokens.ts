/* Action Register module-local tokens — severity, end-state, tone formatters.
   Self-contained so it doesn't couple to production utils. */

export type Severity = 'S1' | 'S2' | 'S3' | 'S4';
export type EndState = 'open' | 'approved' | 'rejected' | 'delegated';
export type Tone = 'critical' | 'warning' | 'on-track' | 'monitoring';

export const SEVERITY: Record<Severity, { label: string; text: string; bg: string; dot: string }> = {
  S1: { label: 'Critical', text: 'text-red-700',   bg: 'bg-red-50',   dot: 'bg-red-500' },
  S2: { label: 'High',     text: 'text-amber-700', bg: 'bg-amber-50', dot: 'bg-amber-500' },
  S3: { label: 'Medium',   text: 'text-blue-700',  bg: 'bg-blue-50',  dot: 'bg-blue-500' },
  S4: { label: 'Low',      text: 'text-gray-600',  bg: 'bg-gray-100', dot: 'bg-gray-400' },
};

export const END_STATE: Record<EndState, { label: string; text: string; bg: string; dot: string }> = {
  open:      { label: 'Needs decision', text: 'text-amber-700', bg: 'bg-amber-50', dot: 'bg-amber-500' },
  approved:  { label: 'Approved',       text: 'text-green-700', bg: 'bg-green-50', dot: 'bg-green-500' },
  rejected:  { label: 'Rejected',       text: 'text-red-700',   bg: 'bg-red-50',   dot: 'bg-red-500' },
  delegated: { label: 'Delegated',      text: 'text-purple-700', bg: 'bg-purple-50', dot: 'bg-purple-500' },
};

export const TONE_TEXT: Record<Tone, string> = {
  critical: 'text-red-600',
  warning: 'text-amber-600',
  'on-track': 'text-green-600',
  monitoring: 'text-blue-600',
};

/** Compact INR: ₹19.1 Cr, ₹3.7 L, ₹14,800. */
export function inr(n: number): string {
  if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(n % 1_00_00_000 === 0 ? 0 : 1)} Cr`;
  if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(n % 1_00_000 === 0 ? 0 : 1)} L`;
  return `₹${n.toLocaleString('en-IN')}`;
}
