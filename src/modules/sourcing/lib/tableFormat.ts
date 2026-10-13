import {formatCompactNumber, getFormattingConfig} from '@/lib/utils';

const EM_DASH = '—';

// ── Display formatters (mirror OperationsSupplyChainSection.tsx:22-45) ──────

export function fmtLocaleIntOps(value: unknown): string {
  if (value == null || value === '') return EM_DASH;
  const n = Number(value);
  if (!Number.isFinite(n)) return EM_DASH;
  if (Math.abs(n) >= 1_000) return formatCompactNumber(n);
  return n.toLocaleString(getFormattingConfig().locale);
}

export function fmtFixed1PctOps(value: unknown): string {
  if (value == null || value === '') return EM_DASH;
  const n = Number(value);
  return Number.isFinite(n) ? `${n.toFixed(1)}%` : EM_DASH;
}

export function fmtIntOrDashOps(value: unknown): string {
  if (value == null || value === '') return EM_DASH;
  const n = Number(value);
  return Number.isFinite(n) ? String(n) : EM_DASH;
}

// ── Sort extractor ─ cleans '₹18.2 Cr', '94%', '12,400', '64 days', '4.4%' ──

export function parseNumeric(value: string | number | undefined | null): number {
  if (value == null) return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const cleaned = String(value).replace(/[^\d.-]/g, '');
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

// ── D7 splitters ────────────────────────────────────────────────────────────

export interface ZeroFillStatusParts {
  cause: string;
  status: string;
}

export function splitZeroFillStatus(raw: string): ZeroFillStatusParts {
  // Raw shapes: "No GRN — Escalated", "Partial GRN — At Risk", "Partial GRN — Monitoring", etc.
  // GRN = Goods Receipt Note (logistics term).
  const [rawCause, rawStatus] = raw.split('—').map((s) => s.trim());
  const cause = ((): string => {
    if (!rawCause) return 'Unknown';
    if (/^no\s+grn/i.test(rawCause)) return 'No goods received';
    if (/^partial\s+grn/i.test(rawCause)) return 'Partial delivery received';
    return rawCause;
  })();
  const status = ((): string => {
    if (!rawStatus) return 'Unknown';
    // Title-case-ish: lowercase the rest for humanised reading.
    return rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1).toLowerCase();
  })();
  return { cause, status };
}

export type DefectSeverity = 'High' | 'Medium' | 'Low';

export interface DefectImpactParts {
  severity: DefectSeverity;
  resolution: string;
}

export function splitDefectImpact(raw: string): DefectImpactParts {
  // Raw shapes: "High — Returns & rework", "Medium — Partial rework", "Low — Repackage"
  const [rawSeverity, rawResolution] = raw.split('—').map((s) => s.trim());
  const severity: DefectSeverity = (() => {
    const s = (rawSeverity ?? '').toLowerCase();
    if (s.startsWith('high')) return 'High';
    if (s.startsWith('medium') || s.startsWith('med')) return 'Medium';
    if (s.startsWith('low')) return 'Low';
    return 'Medium';
  })();
  const resolution = rawResolution ?? raw;
  return { severity, resolution };
}
