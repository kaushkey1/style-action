import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import environment, { isMockMode } from '@/environment';
import { useAuthStore } from '@/hooks/useAuthStore';

export { isMockMode };

/**
 * Canonical "now" for the mock prototype.
 * Every component that needs the current time should import this
 * instead of constructing its own Date.
 */
export const MOCK_NOW = new Date('2026-02-20T10:00:00+05:30');

/**
 * Merge class names with Tailwind CSS support
 * Combines clsx for conditional classes and tailwind-merge for deduplication
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Parse a date string, treating it as UTC if no timezone is specified.
 * Backend returns timestamps without timezone suffix, but they are in UTC.
 */
function parseAsUTC(dateStr: string): Date {
  // If the string already has timezone info (Z or +/-offset), parse as-is
  if (/Z$|[+-]\d{2}:\d{2}$/.test(dateStr)) {
    return new Date(dateStr);
  }
  // Date-only strings (e.g. "2024-03-15") need T00:00:00Z, not just Z
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return new Date(dateStr + 'T00:00:00Z');
  }
  // Otherwise, append 'Z' to treat as UTC
  return new Date(dateStr + 'Z');
}

/**
 * Format a date for display. Canonical display format is `MMM DD, YYYY`
 * (e.g. "Jun 02, 2026") per ux-patterns.md §21. Day is zero-padded so the
 * column width of dates in tables / lists stays stable across the month.
 */
export function formatDate(
  date: string | Date,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }
): string {
  const d = typeof date === 'string' ? parseAsUTC(date) : date;
  return d.toLocaleDateString('en-US', options);
}

/**
 * Format a date with time for display. Canonical format is
 * `MMM DD, YYYY, hh:mm AM/PM` per ux-patterns.md §21.
 */
export function formatDateTime(
  date: string | Date,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }
): string {
  const d = typeof date === 'string' ? parseAsUTC(date) : date;
  return d.toLocaleDateString('en-US', options);
}

/** Numeric timestamp in the browser's timezone: YYYY-MM-DD HH:mm. */
export function formatDateTimeNumeric(date: string | Date | null | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? parseAsUTC(date) : date;
  if (Number.isNaN(d.getTime())) return '—';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: string | Date | null | undefined): string {
  if (!date) return 'just now';
  const d = typeof date === 'string' ? parseAsUTC(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
  }

  return formatDate(d);
}

/**
 * Number of days the BE data lake lags behind today. Data is available
 * through (today − DATA_FRESHNESS_LAG_DAYS) at most.
 */
export const DATA_FRESHNESS_LAG_DAYS = 2;

/** Latest calendar date for which BE data is guaranteed available (T-2). */
export function getDataAvailableThroughDate(): Date {
  const d = new Date();
  d.setDate(d.getDate() - DATA_FRESHNESS_LAG_DAYS);
  d.setHours(23, 59, 59, 999);
  return d;
}

/** Same as getDataAvailableThroughDate, formatted as YYYY-MM-DD (matches FilterDateRange's wire format). */
export function getDataAvailableThroughDateIso(): string {
  const d = getDataAvailableThroughDate();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Format the 7-day date range for a weekly bucket starting at `iso`.
 * Examples:
 *   "2026-03-29" → "Mar 29 – Apr 4, 2026"
 *   "2026-12-28" → "Dec 28, 2026 – Jan 3, 2027" (cross-year)
 *   "2026-04-01" → "Apr 1 – 7, 2026" (same month — end day only)
 * Returns "" if `iso` is not parseable.
 */
export function formatWeekRange(iso: string): string {
  const start = parseAsUTC(iso);
  if (Number.isNaN(start.getTime())) return '';
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  const startMonth = start.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });
  const endMonth = end.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });
  const startDay = start.getUTCDate();
  const endDay = end.getUTCDate();
  const startYear = start.getUTCFullYear();
  const endYear = end.getUTCFullYear();
  if (startYear !== endYear) {
    return `${startMonth} ${startDay}, ${startYear} – ${endMonth} ${endDay}, ${endYear}`;
  }
  if (startMonth === endMonth) {
    return `${startMonth} ${startDay} – ${endDay}, ${endYear}`;
  }
  return `${startMonth} ${startDay} – ${endMonth} ${endDay}, ${endYear}`;
}

/**
 * Format a full-month period as "June, 2026" (full month name + year).
 * Use when a selected date range spans exactly one calendar month.
 */
export function formatMonthYear(date: string | Date): string {
  const d = typeof date === 'string' ? parseAsUTC(date) : date;
  const month = d.toLocaleDateString('en-US', { month: 'long', timeZone: 'UTC' });
  return `${month}, ${d.getUTCFullYear()}`;
}

/**
 * True when [fromIso, toIso] spans exactly one full calendar month
 * (the 1st through the last day of the same month/year).
 */
export function isFullCalendarMonth(fromIso: string, toIso: string): boolean {
  const from = parseAsUTC(fromIso);
  const to = parseAsUTC(toIso);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return false;
  if (from.getUTCFullYear() !== to.getUTCFullYear() || from.getUTCMonth() !== to.getUTCMonth()) return false;
  if (from.getUTCDate() !== 1) return false;
  const lastDay = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + 1, 0)).getUTCDate();
  return to.getUTCDate() === lastDay;
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length).trim() + '...';
}

/**
 * Capitalize first letter
 */
export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function toTitleCase(text: string): string {
  return text.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Generate initials from a name
 */
export function getInitials(name: string, maxLength = 2): string {
  return name
    .split(' ')
    .map((word) => word[0])
    .filter(Boolean)
    .slice(0, maxLength)
    .join('')
    .toUpperCase();
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

/**
 * Sleep/delay function
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if value is defined (not null or undefined)
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

interface FormattingConfig {
  locale: string;
  currency: string;
}

const _fmtConfig: FormattingConfig = { locale: 'en-IN', currency: 'INR' };

export function setFormattingConfig(locale: string, currency: string): void {
  _fmtConfig.locale = locale;
  _fmtConfig.currency = currency;
}

export function getFormattingConfig(): Readonly<FormattingConfig> {
  return _fmtConfig;
}

function isIndianLocale(): boolean {
  return _fmtConfig.locale.endsWith('-IN');
}

export function getCurrencySymbol(): string {
  return new Intl.NumberFormat(_fmtConfig.locale, {
    style: 'currency', currency: _fmtConfig.currency,
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(0).replace(/[\d\s.,]/g, '').trim();
}

export function formatNumber(num: number): string {
  return num.toLocaleString(_fmtConfig.locale);
}

/**
 * Comparator for category/subcategory names that follow the "N <NAME>" prefix
 * convention used by the command-center merchandise hierarchy. Matches both
 * "1. MEN APPAREL" (period delimiter) and "29 men" (space delimiter) — any
 * leading digits followed by a non-digit character.
 *
 * Sort order: ascending by numeric prefix when both have one (so 1 < 2 < 10 < …),
 * alphabetical when neither has one, prefix-first when only one has one.
 * "Others" (case-insensitive) is always pinned to the bottom.
 */
export function compareCategoryNames(a: string, b: string): number {
  const aOthers = a.trim().toLowerCase() === 'others';
  const bOthers = b.trim().toLowerCase() === 'others';
  if (aOthers && !bOthers) return 1;
  if (bOthers && !aOthers) return -1;
  if (aOthers && bOthers) return 0;
  const aMatch = /^(\d+)\D/.exec(a);
  const bMatch = /^(\d+)\D/.exec(b);
  if (aMatch && bMatch) return Number(aMatch[1]) - Number(bMatch[1]);
  if (aMatch && !bMatch) return -1;
  if (!aMatch && bMatch) return 1;
  return a.localeCompare(b);
}

/**
 * Numeric sort key derived from a name's leading digits. Used as a
 * `sortFields` extractor in `useTableSearchSort` (which requires a number,
 * not a comparator) to mirror `compareCategoryNames` ordering: names with a
 * numeric prefix sort by that number, names without one all collapse to the
 * bottom on ASC (top on DESC). Tiebreaking among non-numeric names is not
 * preserved — use `compareCategoryNames` directly when full ordering matters.
 */
export function numericPrefixSortKey(name: string): number {
  const match = /^(\d+)\D/.exec(name);
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
}

export function formatCompactNumber(num: number): string {
  const formatted = Intl.NumberFormat(_fmtConfig.locale, {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(num);
  return formatted.replace(/([0-9.])([A-Za-z])/, (_, n, unit: string) => `${n} ${unit.toUpperCase()}`);
}

export function formatCurrency(value: number, opts?: { compact?: boolean; decimals?: number }): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  const sym = opts?.compact ? '' : getCurrencySymbol();
  const loc = _fmtConfig.locale;

  if (isIndianLocale()) {
    if (abs >= 9950000) {
      const cr = abs / 10000000;
      const dec = opts?.decimals ?? (cr >= 100 ? 0 : 1);
      return `${sign}${sym}${cr.toLocaleString(loc, { maximumFractionDigits: dec })} Cr`;
    }
    if (abs >= 100000) {
      const l = abs / 100000;
      return `${sign}${sym}${l.toLocaleString(loc, { maximumFractionDigits: opts?.decimals ?? 1 })} L`;
    }
  } else {
    if (abs >= 999500000) {
      const b = abs / 1000000000;
      const dec = opts?.decimals ?? (b >= 100 ? 0 : 1);
      return `${sign}${sym}${b.toLocaleString(loc, { maximumFractionDigits: dec })} B`;
    }
    if (abs >= 999500) {
      const m = abs / 1000000;
      return `${sign}${sym}${m.toLocaleString(loc, { maximumFractionDigits: opts?.decimals ?? 1 })} M`;
    }
  }
  if (abs >= 1000) {
    const k = abs / 1000;
    return `${sign}${sym}${k.toLocaleString(loc, { maximumFractionDigits: opts?.decimals ?? 1 })} K`;
  }
  return `${sign}${sym}${abs.toLocaleString(loc, { maximumFractionDigits: 0 })}`;
}

export function formatCurrencyFromLakhs(lakhs: number, opts?: { compact?: boolean; decimals?: number }): string {
  return formatCurrency(lakhs * 100000, opts);
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number | null): string {
  if (bytes === null || bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format duration in human-readable format (MM:SS or HH:MM:SS)
 */
export function formatDuration(seconds: number | null): string {
  if (seconds === null) return '0:00';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

/**
 * Get dimensions string from width and height
 */
export function getDimensionsString(width: number | null, height: number | null): string {
  if (width === null || height === null) return '';
  return `${width} \u00d7 ${height}`;
}

// ─── Tenant Resolution ──────────────────────────────────────────────────

const DEFAULT_TENANT = "fnl";
const DEFAULT_ORG_UUID = "5331f8af-b091-cb9f-e2a4-d247f2acaf16";

// hiruzen_org_id → X-Tenant-ID
const ORG_ID_TO_TENANT: Record<number, string> = {
  1: "fnl",
  3: "fnl",
  5: "fnl",
  8: "rbl",
  9: "rbl",
  10: "demo_org",
  17: "rbl",
  18: "rbl",
  19: "demo_org",
};

const ORG_NAME_TO_TENANT: Record<string, string> = {
  "acme corp": "fnl",
  impetus: "fnl",
  fnl: "fnl",
  shein: "fnl",
  superdry: "rbl",
  hamleys: "rbl",
  granary: "granary",
  demo_org: "demo_org",
};

function resolveOrgNameTenant(orgId: number): string {
  const { organizations, user } = useAuthStore.getState();
  const org =
    organizations.find((o) => o.orgId === orgId) ??
    user?.workspace.find((ws) => ws.orgId === orgId);
  return ORG_NAME_TO_TENANT[org?.orgName.trim().toLowerCase() ?? ""] ?? DEFAULT_TENANT;
}

export function getActiveTenantId(): string {
  const { tenantId, activeOrgId } = useAuthStore.getState();

  if (activeOrgId !== null) {
    const mapped = ORG_ID_TO_TENANT[activeOrgId];
    if (mapped) return mapped;
  }

  if (tenantId) return tenantId;
  if (activeOrgId === null) return DEFAULT_TENANT;

  return resolveOrgNameTenant(activeOrgId);
}

export function getActiveOrgUuid(): string {
  const { resolvedOrgId, activeOrgId } = useAuthStore.getState();
  if (resolvedOrgId) return resolvedOrgId;
  if (activeOrgId === null) return DEFAULT_ORG_UUID;
  return String(activeOrgId);
}

// ─── React Query Stale Times (shared across all modules) ────────────────

export const STALE_TIMES = {
  FILTERS: 30 * 60 * 1000,
  LISTING: 5 * 60 * 1000,
  DETAIL: 2 * 60 * 1000,
  HISTORY: 1 * 60 * 1000,
} as const;

// ─── API Configuration ──────────────────────────────────────────────────

export const API_BASE_URL = environment.API_BASE_URL;
export const API_SERVICE_PATH = '/service/public/impetus-agentic/v1.0';

export function apiHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'X-Tenant-ID': getActiveTenantId(),
    'X-Org-ID': getActiveOrgUuid(),
  };
}

export function apiUrl(path: string): string {
  return `${API_BASE_URL}${API_SERVICE_PATH}${path}`;
}

// ─── Store Intelligence visit tracking ──────────────────────────────────

/** Get the timestamp of the user's last visit to the intelligence dashboard. */
export function getLastVisitTimestamp(): string | null {
  return localStorage.getItem('intelligence-last-visit');
}

/** Record the current time as the user's last visit to the intelligence dashboard. */
export function updateLastVisitTimestamp(): void {
  localStorage.setItem('intelligence-last-visit', new Date().toISOString());
}

// ─── Status / RAG helpers ──────────────────────────────────────────────

export type RagStatus = 'on-track' | 'warning' | 'critical';

/** Card-level RAG left-border color class (border-l-3 style). */
export function ragCardClasses(status: RagStatus): string {
  const map: Record<RagStatus, string> = {
    'on-track': 'border-l-success',
    'warning': 'border-l-warning',
    'critical': 'border-l-error',
  };
  return map[status];
}

/** Map a RAG status to a Badge variant. */
export function ragBadgeVariant(status: RagStatus): 'success' | 'warning' | 'error' {
  const map: Record<RagStatus, 'success' | 'warning' | 'error'> = {
    'on-track': 'success',
    'warning': 'warning',
    'critical': 'error',
  };
  return map[status];
}

/** Map a RAG status to its display label. */
export function ragLabel(status: RagStatus): string {
  const map: Record<RagStatus, string> = {
    'on-track': 'On Track',
    'warning': 'Warning',
    'critical': 'Critical',
  };
  return map[status];
}

/** Left-border severity class for alert-style items. */
export function severityBorderClasses(severity: 'high' | 'medium' | 'low'): string {
  const map: Record<'high' | 'medium' | 'low', string> = {
    high: 'border-l-error bg-red-50/50',
    medium: 'border-l-warning bg-amber-50/50',
    low: 'border-l-primary bg-primary-50/50',
  };
  return map[severity];
}

// ─── Store Intelligence normalizers ─────────────────────────────────────
// Safely merge a partial/unknown Gemini JSON response against typed defaults
// so the UI never crashes on missing fields.

function obj(v: unknown): Record<string, unknown> {
  return v != null && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}
function str(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback;
}
function num(v: unknown, fallback = 0): number {
  return typeof v === 'number' && !Number.isNaN(v) ? v : fallback;
}
function arr<T>(v: unknown, mapFn: (item: unknown) => T): T[] {
  return Array.isArray(v) ? v.map(mapFn) : [];
}

/** Normalize a partial StoreDeepResearch response into a safe, fully-typed object. */
export function normalizeStoreDeepResearch(raw: unknown): {
  storeId: string;
  positioning: { statement: string; differentiator: string; fashionCoreSplit: { fashion: number; core: number } };
  catchmentDeepDive: { narrative: string; incomeBands: { band: string; percent: number; profile: string }[]; culturalProfile: string; shoppingBehavior: string; priceSensitivity: string };
  competitiveLandscape: { intensityScore: string; biggestThreat: string; gapsToExploit: string; whatCompetitorsDoBetter: string };
  demandSignals: { topCategories: { rank: number; category: string; priceRange: string; why: string }[]; underservedCategories: string; seasonalPatterns: { period: string; pattern: string }[]; weatherImpact: string; onlineCompetition: string };
  categoryMixRecommendation: { category: string; percent: number; notes: string }[];
  priceArchitecture: { band: string; percent: number; rationale: string }[];
  topActions: { title: string; description: string }[];
} {
  const r = obj(raw);
  const pos = obj(r.positioning);
  const fcs = obj(pos.fashionCoreSplit);
  const cd = obj(r.catchmentDeepDive);
  const cl = obj(r.competitiveLandscape);
  const ds = obj(r.demandSignals);

  return {
    storeId: str(r.storeId),
    positioning: {
      statement: str(pos.statement),
      differentiator: str(pos.differentiator),
      fashionCoreSplit: { fashion: num(fcs.fashion), core: num(fcs.core) },
    },
    catchmentDeepDive: {
      narrative: str(cd.narrative),
      incomeBands: arr(cd.incomeBands, (b) => {
        const o = obj(b);
        return { band: str(o.band), percent: num(o.percent), profile: str(o.profile) };
      }),
      culturalProfile: str(cd.culturalProfile),
      shoppingBehavior: str(cd.shoppingBehavior),
      priceSensitivity: str(cd.priceSensitivity),
    },
    competitiveLandscape: {
      intensityScore: str(cl.intensityScore),
      biggestThreat: str(cl.biggestThreat),
      gapsToExploit: str(cl.gapsToExploit),
      whatCompetitorsDoBetter: str(cl.whatCompetitorsDoBetter),
    },
    demandSignals: {
      topCategories: arr(ds.topCategories, (c) => {
        const o = obj(c);
        return { rank: num(o.rank), category: str(o.category), priceRange: str(o.priceRange), why: str(o.why) };
      }),
      underservedCategories: str(ds.underservedCategories),
      seasonalPatterns: arr(ds.seasonalPatterns, (s) => {
        const o = obj(s);
        return { period: str(o.period), pattern: str(o.pattern) };
      }),
      weatherImpact: str(ds.weatherImpact),
      onlineCompetition: str(ds.onlineCompetition),
    },
    categoryMixRecommendation: arr(r.categoryMixRecommendation, (c) => {
      const o = obj(c);
      return { category: str(o.category), percent: num(o.percent), notes: str(o.notes) };
    }),
    priceArchitecture: arr(r.priceArchitecture, (b) => {
      const o = obj(b);
      return { band: str(o.band), percent: num(o.percent), rationale: str(o.rationale) };
    }),
    topActions: arr(r.topActions, (a) => {
      const o = obj(a);
      return { title: str(o.title), description: str(o.description) };
    }),
  };
}

/** Normalize a partial StoreProfile (narrative cards) response into a safe, fully-typed object. */
export function normalizeStoreProfile(raw: unknown, storeId: string): {
  storeId: string;
  catchmentSummary: string;
  catchmentNarrative: string;
  shoppersSummary: string;
  shoppersNarrative: string;
  demandSummary: string;
  demandNarrative: string;
  dateGenerated: string;
} {
  const r = obj(raw);
  return {
    storeId,
    catchmentSummary: str(r.catchmentSummary),
    catchmentNarrative: str(r.catchmentNarrative),
    shoppersSummary: str(r.shoppersSummary),
    shoppersNarrative: str(r.shoppersNarrative),
    demandSummary: str(r.demandSummary),
    demandNarrative: str(r.demandNarrative),
    dateGenerated: str(r.dateGenerated, new Date().toISOString()),
  };
}

/** Normalize partial catchment scores into a safe, fully-typed object. */
export function normalizeCatchmentScores(raw: unknown, storeId: string): {
  storeId: string;
  affluenceScore: number;
  fashionForwardness: number;
  familyIndex: number;
  youthIndex: number;
  destinationScore: number;
  catchmentPopulation: number;
  estimatedApparelSpend: number;
  currentMarketShare: number;
} {
  const r = obj(raw);
  return {
    storeId,
    affluenceScore: num(r.affluenceScore),
    fashionForwardness: num(r.fashionForwardness),
    familyIndex: num(r.familyIndex),
    youthIndex: num(r.youthIndex),
    destinationScore: num(r.destinationScore),
    catchmentPopulation: num(r.catchmentPopulation),
    estimatedApparelSpend: num(r.estimatedApparelSpend),
    currentMarketShare: num(r.currentMarketShare),
  };
}

/**
 * Check whether a store name matches a search query.
 * Normalizes both strings (lowercases, strips punctuation, collapses whitespace)
 * and checks for bidirectional substring inclusion.
 */
export function matchesStoreFilter(storeName: string, query: string): boolean {
  const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
  return normalize(storeName).includes(normalize(query)) || normalize(query).includes(normalize(storeName));
}

export function getLastYearMonth(): string {
  const now = new Date();
  const last = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const year = last.getFullYear();
  const month = String(last.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/** Convert a "YYYY-MM" string to the ISO start and end dates of that month. */
export function yearMonthToDateRange(yearMonth: string): { fromDate: string; toDate: string } {
  const [y, m] = yearMonth.split('-').map(Number);
  const from = new Date(y ?? 0, (m ?? 1) - 1, 1);
  const to = new Date(y ?? 0, m ?? 1, 0); // day 0 of next month = last day of this month
  // Use local date parts — toISOString() would shift dates in UTC+N timezones
  const fmt = (d: Date): string =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return { fromDate: fmt(from), toDate: fmt(to) };
}

/**
 * Check if a file type is supported for upload
 */
export function isSupportedFileType(file: File): boolean {
  const supportedTypes = [
    // Images
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    // Videos
    'video/mp4',
    'video/webm',
    'video/quicktime',
    // Audio
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
  ];
  return supportedTypes.includes(file.type);
}

// ─── Text measurement ───────────────────────────────────────────────────

// ─── RAG cell classifier ─────────────────────────────────────────────────────

export interface RagThreshold {
  green_value: number;
  amber_value: number;
  direction: 'higher-is-better' | 'lower-is-better';
}

/**
 * Classifies a numeric cell value against a KPI threshold.
 * Returns null when the threshold is not applicable (value is a dash, non-finite, etc.).
 */
export function classifyRag(
  value: number,
  threshold: RagThreshold | null | undefined,
): 'green' | 'amber' | 'red' | null {
  if (!threshold) return null;
  if (!Number.isFinite(value)) return null;
  if (threshold.direction === 'lower-is-better') {
    if (value <= threshold.green_value) return 'green';
    if (value <= threshold.amber_value) return 'amber';
    return 'red';
  }
  if (value >= threshold.green_value) return 'green';
  if (value >= threshold.amber_value) return 'amber';
  return 'red';
}

/** Maps a RAG status to the Tailwind text-color class for table cells. */
export function ragToTextClass(rag: 'green' | 'amber' | 'red' | null): string {
  if (rag === 'green') return 'text-green-700';
  if (rag === 'amber') return 'text-amber-700';
  if (rag === 'red') return 'text-red-700';
  return 'text-gray-700';
}

let _measureCanvas: HTMLCanvasElement | null = null;

/**
 * Measure the rendered pixel width of a string for a given CSS font. Used to size
 * fixed table columns to their content. Falls back to a rough estimate outside the
 * browser (SSR / jsdom). Defaults to semibold Inter 14px (the widest table weight)
 * so callers don't underestimate.
 */
export function measureTextWidth(
  text: string,
  font = '600 14px Inter, system-ui, sans-serif',
): number {
  if (typeof document === 'undefined') return text.length * 8;
  if (!_measureCanvas) _measureCanvas = document.createElement('canvas');
  const ctx = _measureCanvas.getContext('2d');
  if (!ctx) return text.length * 8;
  ctx.font = font;
  return ctx.measureText(text).width;
}

/**
 * Serialize rows to a CSV string. Values containing commas, quotes or newlines
 * are quoted and internal quotes doubled.
 */
export function toCsv(
  headers: string[],
  rows: Array<Array<string | number | boolean | null | undefined>>,
): string {
  const esc = (v: string | number | boolean | null | undefined): string => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.map(esc).join(','), ...rows.map((r) => r.map(esc).join(','))].join('\n');
}

/** Trigger a browser download of a text file (CSV by default). No-op outside the browser. */
export function downloadTextFile(
  filename: string,
  content: string,
  mime = 'text/csv;charset=utf-8;',
): void {
  if (typeof document === 'undefined') return;
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Do two effective-date periods overlap? Empty `from` = open start, empty `to` =
 * open end. ISO `YYYY-MM-DD` strings compare correctly lexicographically.
 */
export function periodsOverlap(aFrom: string, aTo: string, bFrom: string, bTo: string): boolean {
  const aStart = aFrom || '0000-01-01';
  const aEnd = aTo || '9999-12-31';
  const bStart = bFrom || '0000-01-01';
  const bEnd = bTo || '9999-12-31';
  return aStart <= bEnd && bStart <= aEnd;
}

/** Is an effective-to date in the past (expired)? Empty = open-ended (not expired). */
export function isExpired(effectiveTo: string, todayIso: string): boolean {
  return effectiveTo !== '' && effectiveTo < todayIso;
}
