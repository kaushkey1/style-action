import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  cn,
  truncate,
  capitalize,
  getInitials,
  debounce,
  isDefined,
  formatNumber,
  formatCurrency,
  formatCurrencyFromLakhs,
  formatFileSize,
  formatDuration,
  formatDate,
  formatRelativeTime,
  getDimensionsString,
  matchesStoreFilter,
  ragCardClasses,
  ragBadgeVariant,
  ragLabel,
  severityBorderClasses,
  normalizeStoreDeepResearch,
  normalizeStoreProfile,
  normalizeCatchmentScores,
  sleep,
  formatDateTime,
  formatCompactNumber,
  apiHeaders,
  apiUrl,
  getLastVisitTimestamp,
  updateLastVisitTimestamp,
  isSupportedFileType,
} from '@/lib/utils';

// ─── cn ───────────────────────────────────────────────────────────────────

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditional classes', () => {
    const shouldHide = false;
    expect(cn('base', shouldHide && 'hidden', 'visible')).toBe('base visible');
  });

  it('deduplicates tailwind classes', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2');
  });

  it('returns empty string for no inputs', () => {
    expect(cn()).toBe('');
  });
});

// ─── truncate ─────────────────────────────────────────────────────────────

describe('truncate', () => {
  it('returns text unchanged if within limit', () => {
    expect(truncate('hello', 10)).toBe('hello');
  });

  it('truncates and adds ellipsis', () => {
    expect(truncate('hello world', 5)).toBe('hello...');
  });

  it('handles exact length', () => {
    expect(truncate('hello', 5)).toBe('hello');
  });
});

// ─── capitalize ───────────────────────────────────────────────────────────

describe('capitalize', () => {
  it('capitalizes first letter', () => {
    expect(capitalize('hello')).toBe('Hello');
  });

  it('handles already capitalized', () => {
    expect(capitalize('Hello')).toBe('Hello');
  });

  it('handles single character', () => {
    expect(capitalize('h')).toBe('H');
  });

  it('handles empty string', () => {
    expect(capitalize('')).toBe('');
  });
});

// ─── getInitials ──────────────────────────────────────────────────────────

describe('getInitials', () => {
  it('returns initials from two-word name', () => {
    expect(getInitials('John Doe')).toBe('JD');
  });

  it('returns single initial for one word', () => {
    expect(getInitials('John')).toBe('J');
  });

  it('respects maxLength', () => {
    expect(getInitials('John Michael Doe', 3)).toBe('JMD');
  });

  it('defaults to 2 initials', () => {
    expect(getInitials('John Michael Doe')).toBe('JM');
  });

  it('uppercases initials', () => {
    expect(getInitials('john doe')).toBe('JD');
  });
});

// ─── isDefined ────────────────────────────────────────────────────────────

describe('isDefined', () => {
  it('returns true for defined values', () => {
    expect(isDefined(0)).toBe(true);
    expect(isDefined('')).toBe(true);
    expect(isDefined(false)).toBe(true);
  });

  it('returns false for null', () => {
    expect(isDefined(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isDefined(undefined)).toBe(false);
  });
});

// ─── formatNumber ─────────────────────────────────────────────────────────

describe('formatNumber', () => {
  it('formats with Indian locale separators', () => {
    const result = formatNumber(1234567);
    // en-IN: 12,34,567
    expect(result).toBe('12,34,567');
  });

  it('handles zero', () => {
    expect(formatNumber(0)).toBe('0');
  });
});

// ─── formatCurrency ───────────────────────────────────────────────────────

describe('formatCurrency', () => {
  it('formats large values in crores', () => {
    const result = formatCurrency(10000000);
    expect(result).toContain('Cr');
    expect(result).toContain('₹');
  });

  it('formats values in lakhs', () => {
    const result = formatCurrency(500000);
    expect(result).toContain('L');
    expect(result).toContain('₹');
  });

  it('formats small values without suffix', () => {
    const result = formatCurrency(5000);
    expect(result).toContain('₹');
    expect(result).not.toContain('Cr');
    expect(result).not.toContain('L');
  });

  it('handles negative values', () => {
    const result = formatCurrency(-10000000);
    expect(result).toMatch(/^-/);
    expect(result).toContain('Cr');
  });

  it('omits rupee symbol in compact mode', () => {
    const result = formatCurrency(10000000, { compact: true });
    expect(result).not.toContain('₹');
    expect(result).toContain('Cr');
  });
});

// ─── formatCurrencyFromLakhs ──────────────────────────────────────────────

describe('formatCurrencyFromLakhs', () => {
  it('converts lakhs to rupees and formats', () => {
    // 100 lakhs = 1 Cr
    const result = formatCurrencyFromLakhs(100);
    expect(result).toContain('Cr');
  });

  it('handles small lakh values', () => {
    const result = formatCurrencyFromLakhs(2);
    expect(result).toContain('L');
  });
});

// ─── formatFileSize ───────────────────────────────────────────────────────

describe('formatFileSize', () => {
  it('formats null as 0 Bytes', () => {
    expect(formatFileSize(null)).toBe('0 Bytes');
  });

  it('formats 0 as 0 Bytes', () => {
    expect(formatFileSize(0)).toBe('0 Bytes');
  });

  it('formats bytes', () => {
    expect(formatFileSize(500)).toBe('500 Bytes');
  });

  it('formats kilobytes', () => {
    expect(formatFileSize(1024)).toBe('1 KB');
  });

  it('formats megabytes', () => {
    expect(formatFileSize(1048576)).toBe('1 MB');
  });

  it('formats gigabytes', () => {
    expect(formatFileSize(1073741824)).toBe('1 GB');
  });
});

// ─── formatDuration ───────────────────────────────────────────────────────

describe('formatDuration', () => {
  it('formats null as 0:00', () => {
    expect(formatDuration(null)).toBe('0:00');
  });

  it('formats seconds only', () => {
    expect(formatDuration(45)).toBe('0:45');
  });

  it('formats minutes and seconds', () => {
    expect(formatDuration(125)).toBe('2:05');
  });

  it('formats hours, minutes, and seconds', () => {
    expect(formatDuration(3661)).toBe('1:01:01');
  });
});

// ─── formatDate ───────────────────────────────────────────────────────────

describe('formatDate', () => {
  it('formats a date string', () => {
    const result = formatDate('2024-03-15');
    expect(result).toContain('Mar');
    expect(result).toContain('15');
    expect(result).toContain('2024');
  });

  it('formats a Date object', () => {
    const result = formatDate(new Date('2024-03-15T00:00:00Z'));
    expect(result).toContain('Mar');
    expect(result).toContain('15');
  });
});

// ─── formatRelativeTime ───────────────────────────────────────────────────

describe('formatRelativeTime', () => {
  it('returns "just now" for null', () => {
    expect(formatRelativeTime(null)).toBe('just now');
  });

  it('returns "just now" for undefined', () => {
    expect(formatRelativeTime(undefined)).toBe('just now');
  });

  it('returns "just now" for very recent dates', () => {
    const now = new Date();
    expect(formatRelativeTime(now)).toBe('just now');
  });

  it('returns minutes ago', () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
    expect(formatRelativeTime(fiveMinAgo)).toBe('5 minutes ago');
  });

  it('returns singular minute', () => {
    const oneMinAgo = new Date(Date.now() - 60 * 1000);
    expect(formatRelativeTime(oneMinAgo)).toBe('1 minute ago');
  });

  it('returns hours ago', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    expect(formatRelativeTime(twoHoursAgo)).toBe('2 hours ago');
  });

  it('returns days ago', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    expect(formatRelativeTime(threeDaysAgo)).toBe('3 days ago');
  });
});

// ─── getDimensionsString ──────────────────────────────────────────────────

describe('getDimensionsString', () => {
  it('returns formatted dimensions', () => {
    expect(getDimensionsString(1920, 1080)).toBe('1920 × 1080');
  });

  it('returns empty string for null width', () => {
    expect(getDimensionsString(null, 1080)).toBe('');
  });

  it('returns empty string for null height', () => {
    expect(getDimensionsString(1920, null)).toBe('');
  });
});

// ─── matchesStoreFilter ───────────────────────────────────────────────────

describe('matchesStoreFilter', () => {
  it('matches exact name', () => {
    expect(matchesStoreFilter('Phoenix Mall', 'Phoenix Mall')).toBe(true);
  });

  it('matches case-insensitively', () => {
    expect(matchesStoreFilter('Phoenix Mall', 'phoenix mall')).toBe(true);
  });

  it('matches partial query', () => {
    expect(matchesStoreFilter('Phoenix Mall Mumbai', 'phoenix')).toBe(true);
  });

  it('returns false for non-matching', () => {
    expect(matchesStoreFilter('Phoenix Mall', 'Select City')).toBe(false);
  });

  it('strips punctuation for matching', () => {
    // Hyphen is stripped without inserting space, so "Phoenix-Mall" becomes "phoenixmall"
    expect(matchesStoreFilter("Phoenix-Mall (Mumbai)", 'phoenixmall')).toBe(true);
  });
});

// ─── debounce ─────────────────────────────────────────────────────────────

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('delays function execution', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced();
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledOnce();
  });

  it('resets timer on subsequent calls', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced();
    vi.advanceTimersByTime(50);
    debounced();
    vi.advanceTimersByTime(50);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(50);
    expect(fn).toHaveBeenCalledOnce();
  });

  it('passes arguments to the debounced function', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced('hello', 42);
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledWith('hello', 42);
  });
});

// ─── RAG helpers ──────────────────────────────────────────────────────────

describe('ragCardClasses', () => {
  it('returns success class for on-track', () => {
    expect(ragCardClasses('on-track')).toBe('border-l-success');
  });

  it('returns warning class for warning', () => {
    expect(ragCardClasses('warning')).toBe('border-l-warning');
  });

  it('returns error class for critical', () => {
    expect(ragCardClasses('critical')).toBe('border-l-error');
  });
});

describe('ragBadgeVariant', () => {
  it('maps on-track to success', () => {
    expect(ragBadgeVariant('on-track')).toBe('success');
  });

  it('maps warning to warning', () => {
    expect(ragBadgeVariant('warning')).toBe('warning');
  });

  it('maps critical to error', () => {
    expect(ragBadgeVariant('critical')).toBe('error');
  });
});

describe('ragLabel', () => {
  it('maps on-track to "On Track"', () => {
    expect(ragLabel('on-track')).toBe('On Track');
  });

  it('maps warning to "Warning"', () => {
    expect(ragLabel('warning')).toBe('Warning');
  });

  it('maps critical to "Critical"', () => {
    expect(ragLabel('critical')).toBe('Critical');
  });
});

describe('severityBorderClasses', () => {
  it('returns error classes for high severity', () => {
    expect(severityBorderClasses('high')).toContain('border-l-error');
  });

  it('returns warning classes for medium severity', () => {
    expect(severityBorderClasses('medium')).toContain('border-l-warning');
  });

  it('returns primary classes for low severity', () => {
    expect(severityBorderClasses('low')).toContain('border-l-primary');
  });
});

// ─── normalizeStoreDeepResearch ───────────────────────────────────────────

describe('normalizeStoreDeepResearch', () => {
  it('returns safe defaults for null input', () => {
    const result = normalizeStoreDeepResearch(null);
    expect(result.storeId).toBe('');
    expect(result.positioning.statement).toBe('');
    expect(result.positioning.fashionCoreSplit.fashion).toBe(0);
    expect(result.catchmentDeepDive.incomeBands).toEqual([]);
    expect(result.demandSignals.topCategories).toEqual([]);
    expect(result.categoryMixRecommendation).toEqual([]);
    expect(result.topActions).toEqual([]);
  });

  it('returns safe defaults for empty object', () => {
    const result = normalizeStoreDeepResearch({});
    expect(result.storeId).toBe('');
    expect(result.positioning.statement).toBe('');
  });

  it('preserves valid data', () => {
    const result = normalizeStoreDeepResearch({
      storeId: 'S001',
      positioning: { statement: 'Premium store', differentiator: 'Location', fashionCoreSplit: { fashion: 60, core: 40 } },
      topActions: [{ title: 'Expand', description: 'Expand floor space' }],
    });
    expect(result.storeId).toBe('S001');
    expect(result.positioning.statement).toBe('Premium store');
    expect(result.positioning.fashionCoreSplit.fashion).toBe(60);
    expect(result.topActions).toHaveLength(1);
    expect(result.topActions[0]!.title).toBe('Expand');
  });

  it('normalizes all nested arrays correctly', () => {
    const result = normalizeStoreDeepResearch({
      storeId: 'S002',
      catchmentDeepDive: {
        narrative: 'Test',
        incomeBands: [{ band: 'High', percent: 30, profile: 'Affluent' }],
        culturalProfile: 'Cosmopolitan',
        shoppingBehavior: 'Weekend',
        priceSensitivity: 'Low',
      },
      competitiveLandscape: {
        intensityScore: '8/10',
        biggestThreat: 'Brand X',
        gapsToExploit: 'Premium segment',
        whatCompetitorsDoBetter: 'Online presence',
      },
      demandSignals: {
        topCategories: [{ rank: 1, category: 'Denim', priceRange: '2000-4000', why: 'Trend' }],
        underservedCategories: 'Activewear',
        seasonalPatterns: [{ period: 'Winter', pattern: 'Heavy coats' }],
        weatherImpact: 'Moderate',
        onlineCompetition: 'High',
      },
      categoryMixRecommendation: [{ category: 'Casual', percent: 40, notes: 'Increase' }],
      priceArchitecture: [{ band: 'Premium', percent: 25, rationale: 'Location' }],
    });

    expect(result.catchmentDeepDive.incomeBands).toHaveLength(1);
    expect(result.catchmentDeepDive.incomeBands[0]!.band).toBe('High');
    expect(result.catchmentDeepDive.culturalProfile).toBe('Cosmopolitan');
    expect(result.competitiveLandscape.intensityScore).toBe('8/10');
    expect(result.demandSignals.topCategories[0]!.category).toBe('Denim');
    expect(result.demandSignals.seasonalPatterns[0]!.period).toBe('Winter');
    expect(result.categoryMixRecommendation[0]!.category).toBe('Casual');
    expect(result.priceArchitecture[0]!.band).toBe('Premium');
  });
});

// ─── normalizeStoreProfile ────────────────────────────────────────────────

describe('normalizeStoreProfile', () => {
  it('returns safe defaults for null input', () => {
    const result = normalizeStoreProfile(null, 'S001');
    expect(result.storeId).toBe('S001');
    expect(result.catchmentSummary).toBe('');
    expect(result.shoppersSummary).toBe('');
    expect(result.demandSummary).toBe('');
  });

  it('preserves valid data', () => {
    const result = normalizeStoreProfile(
      { catchmentSummary: 'Urban area', catchmentNarrative: 'Dense urban' },
      'S002'
    );
    expect(result.storeId).toBe('S002');
    expect(result.catchmentSummary).toBe('Urban area');
    expect(result.catchmentNarrative).toBe('Dense urban');
  });
});

// ─── normalizeCatchmentScores ─────────────────────────────────────────────

describe('normalizeCatchmentScores', () => {
  it('returns safe defaults for null input', () => {
    const result = normalizeCatchmentScores(null, 'S001');
    expect(result.storeId).toBe('S001');
    expect(result.affluenceScore).toBe(0);
    expect(result.fashionForwardness).toBe(0);
    expect(result.currentMarketShare).toBe(0);
  });

  it('preserves valid scores', () => {
    const result = normalizeCatchmentScores(
      { affluenceScore: 85, fashionForwardness: 72 },
      'S003'
    );
    expect(result.affluenceScore).toBe(85);
    expect(result.fashionForwardness).toBe(72);
  });
});

// ─── formatDateTime ───────────────────────────────────────────────────────

describe('formatDateTime', () => {
  it('formats a date string with time', () => {
    const result = formatDateTime('2024-03-15T14:30:00Z');
    expect(result).toContain('Mar');
    expect(result).toContain('15');
    expect(result).toContain('2024');
  });

  it('formats a Date object with time', () => {
    const result = formatDateTime(new Date('2024-03-15T14:30:00Z'));
    expect(result).toContain('Mar');
  });
});

// ─── formatCompactNumber ──────────────────────────────────────────────────

describe('formatCompactNumber', () => {
  it('formats thousands compactly', () => {
    const result = formatCompactNumber(1500);
    expect(result).toMatch(/1\.5/);
  });

  it('formats millions compactly', () => {
    const result = formatCompactNumber(10000000);
    expect(result).toMatch(/1/);
  });

  it('handles zero', () => {
    expect(formatCompactNumber(0)).toBe('0');
  });
});

// ─── sleep ────────────────────────────────────────────────────────────────

describe('sleep', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('resolves after the specified delay', async () => {
    const resolved = vi.fn();
    sleep(100).then(resolved);

    expect(resolved).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(100);
    expect(resolved).toHaveBeenCalled();
  });
});

// ─── apiHeaders ───────────────────────────────────────────────────────────

describe('apiHeaders', () => {
  it('returns correct content type and tenant headers', () => {
    const headers = apiHeaders();
    expect(headers).toHaveProperty('Content-Type', 'application/json');
    expect(headers).toHaveProperty('X-Tenant-ID', 'fnl');
    expect(headers).toHaveProperty('X-Org-ID');
  });
});

// ─── apiUrl ───────────────────────────────────────────────────────────────

describe('apiUrl', () => {
  it('prepends base URL and service path', () => {
    const url = apiUrl('/stores');
    expect(url).toContain('/service/public/impetus-agentic/v1.0/stores');
  });
});

// ─── getLastVisitTimestamp / updateLastVisitTimestamp ──────────────────────

describe('visit tracking', () => {
  const storage = new Map<string, string>();
  beforeEach(() => {
    storage.clear();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
      clear: () => storage.clear(),
      get length() { return storage.size; },
      key: () => null,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns null when no visit recorded', () => {
    expect(getLastVisitTimestamp()).toBeNull();
  });

  it('records and retrieves last visit timestamp', () => {
    updateLastVisitTimestamp();
    const timestamp = getLastVisitTimestamp();
    expect(timestamp).toBeTruthy();
    expect(new Date(timestamp!).getTime()).not.toBeNaN();
  });
});

// ─── isSupportedFileType ──────────────────────────────────────────────────

describe('isSupportedFileType', () => {
  it('accepts supported image types', () => {
    expect(isSupportedFileType({ type: 'image/jpeg' } as File)).toBe(true);
    expect(isSupportedFileType({ type: 'image/png' } as File)).toBe(true);
    expect(isSupportedFileType({ type: 'image/webp' } as File)).toBe(true);
  });

  it('accepts supported video types', () => {
    expect(isSupportedFileType({ type: 'video/mp4' } as File)).toBe(true);
  });

  it('accepts supported audio types', () => {
    expect(isSupportedFileType({ type: 'audio/mpeg' } as File)).toBe(true);
  });

  it('rejects unsupported types', () => {
    expect(isSupportedFileType({ type: 'application/pdf' } as File)).toBe(false);
    expect(isSupportedFileType({ type: 'text/plain' } as File)).toBe(false);
  });
});
