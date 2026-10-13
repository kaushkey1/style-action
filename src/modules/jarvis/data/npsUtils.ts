// ─── NPS Types, Labels & Computation ───────────────────────────────────────
// All NPS types, display-label maps, and metric computation in one place.
// Data is fetched live from BigQuery via the Jarvis NPS API.
// These functions receive pre-filtered NPSResponse[] from the caller.

// ─── Core Data Types ───────────────────────────────────────────────────────

export interface NPSSubRatings {
  staffFriendlinessService: number;
  billingExperience: number;
  productSizeAvailability: number;
  storeAmbience: number;
  trialRoomExperience: number;
  productOptionsVariety: number;
}

export interface NPSResponse {
  date: string;
  npsScore: number;
  feedback: string | null;
  channel: string;
  mainReason: string | null;
  secondaryReason: string | null;
  subRatings: NPSSubRatings | null;
}

// ─── Display Labels ────────────────────────────────────────────────────────

export const NPS_REASON_LABELS: Record<string, string> = {
  'Staff Helpfulness & Issue Resolution': 'Staff & Service',
  'Product Selection & Availability': 'Product Selection',
  'Store Environment & Ambience': 'Store Ambience',
  'Billing & Checkout Experience': 'Billing & Checkout',
  'Pricing & Overall Value': 'Pricing & Value',
  'Offers & Promotions': 'Offers & Promos',
};

export const NPS_DIMENSION_LABELS: Record<keyof NPSSubRatings, string> = {
  staffFriendlinessService: 'Staff & Service',
  billingExperience: 'Billing Experience',
  productSizeAvailability: 'Product Availability',
  storeAmbience: 'Store Ambience',
  trialRoomExperience: 'Trial Room',
  productOptionsVariety: 'Product Variety',
};

// ─── Computed Types ────────────────────────────────────────────────────────

export interface NPSDriverScore {
  reason: string;
  label: string;
  driverScore: number;
  selectedPercent: number;
  selectedCount: number;
  promoters: number;
  detractors: number;
}

export interface NPSMetrics {
  overallScore: number;
  totalResponses: number;
  promoters: number;
  passives: number;
  detractors: number;
  reasonBreakdown: NPSDriverScore[];
  subRatings: { dimension: string; label: string; score: number }[];
}

export interface NPSTrendPoint {
  label: string;
  nps: number;
  responses: number;
  promoters: number;
  passives: number;
  detractors: number;
}

export type VerbatimSort = 'newest' | 'highest' | 'lowest';

export interface NPSVerbatim {
  date: string;
  npsScore: number;
  feedback: string;
  category: 'promoter' | 'passive' | 'detractor';
}

// ─── Core NPS Computation ──────────────────────────────────────────────────

function computeNPS(responses: NPSResponse[]): { nps: number; promoters: number; passives: number; detractors: number } {
  const total = responses.length;
  if (total === 0) return { nps: 0, promoters: 0, passives: 0, detractors: 0 };

  const promoters = responses.filter((r) => r.npsScore >= 9).length;
  const passives = responses.filter((r) => r.npsScore >= 7 && r.npsScore <= 8).length;
  const detractors = responses.filter((r) => r.npsScore <= 6).length;
  const nps = Math.round(((promoters - detractors) / total) * 1000) / 10;

  return { nps, promoters, passives, detractors };
}

function computeDriverScores(responses: NPSResponse[]): NPSDriverScore[] {
  const withReasons = responses.filter((r) => r.mainReason !== null);
  if (withReasons.length === 0) return [];

  const allReasons = new Set<string>();
  for (const r of withReasons) {
    if (r.mainReason) allReasons.add(r.mainReason);
    if (r.secondaryReason) allReasons.add(r.secondaryReason);
  }

  return Array.from(allReasons)
    .map((reason) => {
      const subset = withReasons.filter((r) => r.mainReason === reason || r.secondaryReason === reason);
      const total = subset.length;
      const promoters = subset.filter((r) => r.npsScore >= 9).length;
      const detractors = subset.filter((r) => r.npsScore <= 6).length;
      const driverScore = total > 0 ? Math.round(((promoters - detractors) / total) * 1000) / 10 : 0;
      const selectedPercent = Math.round((total / withReasons.length) * 1000) / 10;

      return {
        reason,
        label: NPS_REASON_LABELS[reason] ?? reason,
        driverScore,
        selectedPercent,
        selectedCount: total,
        promoters,
        detractors,
      };
    })
    .sort((a, b) => b.selectedCount - a.selectedCount);
}

function computeSubRatings(responses: NPSResponse[]): { dimension: string; label: string; score: number }[] {
  const withRatings = responses.filter((r) => r.subRatings !== null);
  if (withRatings.length === 0) return [];

  const dims = Object.keys(NPS_DIMENSION_LABELS) as (keyof NPSSubRatings)[];

  return dims
    .map((dim) => {
      let sum = 0;
      let count = 0;
      for (const r of withRatings) {
        if (r.subRatings) {
          const val = r.subRatings[dim];
          if (val > 0) {
            sum += val;
            count += 1;
          }
        }
      }
      return {
        dimension: dim,
        label: NPS_DIMENSION_LABELS[dim],
        score: count > 0 ? Math.round((sum / count) * 10) / 10 : 0,
      };
    })
    .sort((a, b) => b.score - a.score);
}

// ─── Public API ────────────────────────────────────────────────────────────

export function getNPSMetrics(responses: NPSResponse[]): NPSMetrics {
  const { nps, promoters, passives, detractors } = computeNPS(responses);

  return {
    overallScore: nps,
    totalResponses: responses.length,
    promoters,
    passives,
    detractors,
    reasonBreakdown: computeDriverScores(responses),
    subRatings: computeSubRatings(responses),
  };
}

/** Monthly trend — one point per YYYY-MM */
export function getMonthlyTrend(responses: NPSResponse[]): NPSTrendPoint[] {
  const byMonth = new Map<string, NPSResponse[]>();

  for (const r of responses) {
    const key = r.date.slice(0, 7); // YYYY-MM
    const existing = byMonth.get(key);
    if (existing) {
      existing.push(r);
    } else {
      byMonth.set(key, [r]);
    }
  }

  const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return Array.from(byMonth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, grouped]) => {
      const monthIdx = parseInt(key.slice(5, 7), 10) - 1;
      const year = key.slice(2, 4);
      const { nps, promoters, passives, detractors } = computeNPS(grouped);
      return {
        label: `${MONTH_NAMES[monthIdx]} '${year}`,
        nps,
        responses: grouped.length,
        promoters,
        passives,
        detractors,
      };
    });
}

/** Weekly trend — one point per ISO week */
export function getWeeklyTrend(responses: NPSResponse[]): NPSTrendPoint[] {
  const byWeek = new Map<string, NPSResponse[]>();

  for (const r of responses) {
    const d = new Date(r.date);
    const dayOfWeek = d.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(d);
    monday.setDate(d.getDate() + mondayOffset);
    const key = monday.toISOString().slice(0, 10);
    const existing = byWeek.get(key);
    if (existing) {
      existing.push(r);
    } else {
      byWeek.set(key, [r]);
    }
  }

  return Array.from(byWeek.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, grouped]) => {
      const d = new Date(key);
      const label = `${d.getDate()} ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()]}`;
      const { nps, promoters, passives, detractors } = computeNPS(grouped);
      return { label, nps, responses: grouped.length, promoters, passives, detractors };
    });
}

/** Daily trend — one point per date */
export function getDailyTrend(responses: NPSResponse[]): NPSTrendPoint[] {
  const byDay = new Map<string, NPSResponse[]>();

  for (const r of responses) {
    const existing = byDay.get(r.date);
    if (existing) {
      existing.push(r);
    } else {
      byDay.set(r.date, [r]);
    }
  }

  return Array.from(byDay.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, grouped]) => {
      const d = new Date(key);
      const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const label = `${d.getDate()} ${MONTHS[d.getMonth()]}`;
      const { nps, promoters, passives, detractors } = computeNPS(grouped);
      return { label, nps, responses: grouped.length, promoters, passives, detractors };
    });
}

/** Verbatims — sorted and categorized */
export function getVerbatims(responses: NPSResponse[], sort: VerbatimSort): NPSVerbatim[] {
  const withFeedback: NPSVerbatim[] = responses
    .filter((r) => r.feedback !== null && r.feedback.trim().length > 0)
    .map((r) => ({
      date: r.date,
      npsScore: r.npsScore,
      feedback: r.feedback!,
      category: r.npsScore >= 9 ? 'promoter' as const : r.npsScore >= 7 ? 'passive' as const : 'detractor' as const,
    }));

  switch (sort) {
    case 'newest':
      return withFeedback.sort((a, b) => b.date.localeCompare(a.date) || b.feedback.length - a.feedback.length);
    case 'highest':
      return withFeedback
        .filter((v) => v.npsScore >= 7)
        .sort((a, b) => b.npsScore - a.npsScore || b.feedback.length - a.feedback.length);
    case 'lowest':
      return withFeedback
        .filter((v) => v.npsScore <= 6)
        .sort((a, b) => a.npsScore - b.npsScore || b.feedback.length - a.feedback.length);
    default:
      return withFeedback;
  }
}

/** NPS score distribution — count per score (0-10) */
export function getScoreDistribution(responses: NPSResponse[]): { score: number; count: number }[] {
  const counts = new Array<number>(11).fill(0);
  for (const r of responses) {
    if (r.npsScore >= 0 && r.npsScore <= 10) {
      const current = counts[r.npsScore];
      if (current !== undefined) {
        counts[r.npsScore] = current + 1;
      }
    }
  }
  return counts.map((count, score) => ({ score, count }));
}
