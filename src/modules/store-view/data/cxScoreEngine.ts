// CX Score computation engine — pure functions that take data from 4 sources
// (NPS, Silent NPS, Store Audit, Google Reviews) and output a composite CX Score
// with per-journey-stage breakdown. Only uses real data — never hallucinated.

import type { StoreAuditData, ChecklistTheme } from '../types/storeAudit.types';
import type { GoogleReviewsStore } from '../types/googleReviews.types';

// ─── Types ────────────────────────────────────────────────────────────────

export type JourneyStage =
  | 'discovery'
  | 'in-store'
  | 'trial'
  | 'checkout'
  | 'post-purchase';

export type CXSourceKey = 'nps' | 'silentNps' | 'audit' | 'google';

export interface CXSourceScore {
  key: CXSourceKey;
  label: string;
  rawValue: number | null;
  rawUnit: string;
  normalized: number;
  available: boolean;
}

export interface JourneyStageScore {
  stage: JourneyStage;
  label: string;
  score: number;
  sources: { key: CXSourceKey; label: string; score: number; detail: string }[];
}

export interface CXScoreResult {
  compositeScore: number;
  sources: CXSourceScore[];
  journeyStages: JourneyStageScore[];
  availableSourceCount: number;
}

// ─── Source Data Inputs ───────────────────────────────────────────────────

export interface NPSInput {
  npsScore: number;
  totalResponses: number;
  dpiDrivers?: { category: string; dpi: number; selectedPercent: number }[];
}

export interface SilentNPSInput {
  totalFootfall: number;
  conversionRate: number;
  avgTrialDwell: number;
  avgCashWait: number;
  attendedPercent: number;
  sentimentPositive: number;
  sentimentNegative: number;
  audioSentimentScore: number | null;
  avgBillingTime: number;
  peakQueueLength: number;
}

// ─── Normalization ────────────────────────────────────────────────────────

function normalizeNPS(nps: number): number {
  return Math.max(0, Math.min(100, (nps + 100) / 2));
}

function normalizeGoogleRating(rating: number): number {
  return Math.max(0, Math.min(100, ((rating - 1) / 4) * 100));
}

function normalizeAuditScore(score: number): number {
  return Math.max(0, Math.min(100, (score / 3) * 100));
}

function normalizeSilentNPS(input: SilentNPSInput): number {
  const conversionScore = Math.min(100, input.conversionRate * 2);
  const attendedScore = input.attendedPercent;
  const sentimentTotal = input.sentimentPositive + input.sentimentNegative;
  const cctvSentiment = sentimentTotal > 0
    ? (input.sentimentPositive / sentimentTotal) * 100
    : 50;
  const sentimentScore = input.audioSentimentScore != null
    ? (cctvSentiment * 0.6 + input.audioSentimentScore * 0.4)
    : cctvSentiment;
  const billingScore = Math.max(0, 100 - input.avgBillingTime * 0.3);
  const queueScore = Math.max(0, 100 - input.peakQueueLength * 5);
  const waitScore = (billingScore + queueScore) / 2;

  return (conversionScore * 0.30 + attendedScore * 0.25 + sentimentScore * 0.25 + waitScore * 0.20);
}

// ─── Default weights ──────────────────────────────────────────────────────

const DEFAULT_WEIGHTS: Record<CXSourceKey, number> = {
  nps: 0.30,
  google: 0.25,
  audit: 0.25,
  silentNps: 0.20,
};

function redistributeWeights(available: CXSourceKey[]): Record<CXSourceKey, number> {
  const totalAvailable = available.reduce((sum, k) => sum + DEFAULT_WEIGHTS[k], 0);
  if (totalAvailable === 0) return DEFAULT_WEIGHTS;

  const result: Record<CXSourceKey, number> = { nps: 0, google: 0, audit: 0, silentNps: 0 };
  for (const k of available) {
    result[k] = DEFAULT_WEIGHTS[k] / totalAvailable;
  }
  return result;
}

// ─── Journey Stage Mapping — per source ───────────────────────────────────

const AUDIT_THEME_TO_STAGE: Record<ChecklistTheme, JourneyStage> = {
  'Store Entry': 'discovery',
  'In-Store Look & Feel': 'in-store',
  'Product Exploration': 'trial',
  'Trial Avenues': 'trial',
  'Checkout & Experience': 'checkout',
};

const GRADE_SCORE: Record<string, number> = {
  'Good': 100,
  'Amber': 60,
  'Red': 20,
  'Insufficient': 50,
  'N/A': 50,
  'NOT_SUBMITTED': 50,
};

function computeAuditJourneyScores(audit: StoreAuditData): Record<JourneyStage, number> {
  const stageScores: Record<JourneyStage, { sum: number; count: number }> = {
    discovery: { sum: 0, count: 0 },
    'in-store': { sum: 0, count: 0 },
    trial: { sum: 0, count: 0 },
    checkout: { sum: 0, count: 0 },
    'post-purchase': { sum: 0, count: 0 },
  };

  for (const item of audit.checklistItems) {
    const stage = AUDIT_THEME_TO_STAGE[item.theme];
    if (stage) {
      const score = GRADE_SCORE[item.finalGrade] ?? 50;
      const entry = stageScores[stage];
      entry.sum += score;
      entry.count += 1;
    }
  }

  const result: Record<JourneyStage, number> = {
    discovery: -1,
    'in-store': -1,
    trial: -1,
    checkout: -1,
    'post-purchase': -1,
  };
  for (const [stage, { sum, count }] of Object.entries(stageScores) as [JourneyStage, { sum: number; count: number }][]) {
    if (count > 0) {
      result[stage] = Math.round(sum / count);
    }
  }
  return result;
}

// NPS DPI drivers → journey stages. The DPI driver category names come from the live API.
const DPI_CATEGORY_TO_STAGE: Record<string, JourneyStage> = {
  'Store Environment & Ambience': 'in-store',
  'Product Selection & Availability': 'trial',
  'Billing & Checkout Experience': 'checkout',
  'Staff Helpfulness & Issue Resolution': 'post-purchase',
  'Pricing & Overall Value': 'post-purchase',
  'Offers & Promotions': 'discovery',
};

function computeNPSJourneyScores(input: NPSInput): Record<JourneyStage, number> {
  const result: Record<JourneyStage, number> = {
    discovery: -1,
    'in-store': -1,
    trial: -1,
    checkout: -1,
    'post-purchase': -1,
  };

  if (!input.dpiDrivers || input.dpiDrivers.length === 0) {
    const baseScore = normalizeNPS(input.npsScore);
    return {
      discovery: Math.round(baseScore),
      'in-store': Math.round(baseScore),
      trial: Math.round(baseScore),
      checkout: Math.round(baseScore),
      'post-purchase': Math.round(baseScore),
    };
  }

  for (const d of input.dpiDrivers) {
    const stage = DPI_CATEGORY_TO_STAGE[d.category];
    if (stage) {
      result[stage] = Math.round((d.dpi + 100) / 2);
    }
  }

  return result;
}


function computeGoogleJourneyScores(google: GoogleReviewsStore): Record<JourneyStage, number> {
  // Google's rating is store-wide, so it contributes equally to every stage.
  //
  // This previously gated on `topics[]` — the "People often mention" pills
  // scraped from Google Maps — but the Places API does not expose them. The gate
  // was also the only thing topics did: the old weighted mean was
  // `Σ(base × count) / Σ(count)`, which collapses to `base` for any lit stage,
  // so `count` never affected the value. Dropping it changes which stages Google
  // appears on, not what it scores.
  const score = Math.round(normalizeGoogleRating(google.googleRating));
  return {
    discovery: score,
    'in-store': score,
    trial: score,
    checkout: score,
    'post-purchase': score,
  };
}

function computeSilentNPSJourneyScores(input: SilentNPSInput): Record<JourneyStage, number> {
  const footfallScore = Math.min(100, input.totalFootfall > 0 ? 70 : 30);
  const conversionScore = Math.min(100, input.conversionRate * 2);
  const sentimentTotal = input.sentimentPositive + input.sentimentNegative;
  const sentimentScore = sentimentTotal > 0
    ? (input.sentimentPositive / sentimentTotal) * 100
    : 50;
  const trialScore = Math.min(100, input.attendedPercent * 1.2);
  const waitScore = Math.max(0, 100 - input.avgCashWait * 0.5);

  return {
    discovery: Math.round(footfallScore),
    'in-store': Math.round(sentimentScore),
    trial: Math.round(trialScore),
    checkout: Math.round((conversionScore + waitScore) / 2),
    'post-purchase': -1,
  };
}

// ─── Main Computation ─────────────────────────────────────────────────────

export function computeCXScore(
  nps: NPSInput | null,
  silentNps: SilentNPSInput | null,
  audit: StoreAuditData | null,
  google: GoogleReviewsStore | null,
): CXScoreResult {
  const sources: CXSourceScore[] = [];
  const available: CXSourceKey[] = [];

  // NPS
  if (nps && nps.totalResponses > 0) {
    const norm = normalizeNPS(nps.npsScore);
    sources.push({ key: 'nps', label: 'NPS', rawValue: nps.npsScore, rawUnit: 'pts', normalized: Math.round(norm), available: true });
    available.push('nps');
  } else {
    sources.push({ key: 'nps', label: 'NPS', rawValue: null, rawUnit: 'pts', normalized: 0, available: false });
  }

  // Silent NPS
  if (silentNps) {
    const norm = normalizeSilentNPS(silentNps);
    sources.push({ key: 'silentNps', label: 'Silent NPS', rawValue: Math.round(norm), rawUnit: 'pts', normalized: Math.round(norm), available: true });
    available.push('silentNps');
  } else {
    sources.push({ key: 'silentNps', label: 'Silent NPS', rawValue: null, rawUnit: 'pts', normalized: 0, available: false });
  }

  // Audit
  if (audit) {
    const norm = normalizeAuditScore(audit.overallScore);
    sources.push({ key: 'audit', label: 'Store Audit', rawValue: Math.round(audit.overallScore * 100) / 100, rawUnit: '/ 3.0', normalized: Math.round(norm), available: true });
    available.push('audit');
  } else {
    sources.push({ key: 'audit', label: 'Store Audit', rawValue: null, rawUnit: '/ 3.0', normalized: 0, available: false });
  }

  // Google
  if (google && google.totalReviews > 0) {
    const norm = normalizeGoogleRating(google.googleRating);
    sources.push({ key: 'google', label: 'Google Reviews', rawValue: google.googleRating, rawUnit: '/ 5.0', normalized: Math.round(norm), available: true });
    available.push('google');
  } else {
    sources.push({ key: 'google', label: 'Google Reviews', rawValue: null, rawUnit: '/ 5.0', normalized: 0, available: false });
  }

  // Composite score
  const weights = redistributeWeights(available);
  let compositeScore = 0;
  for (const s of sources) {
    if (s.available) {
      compositeScore += s.normalized * weights[s.key];
    }
  }
  compositeScore = Math.round(compositeScore);

  // Journey stage breakdown — cumulative from all available sources
  const npsJourney = nps && nps.totalResponses > 0 ? computeNPSJourneyScores(nps) : null;
  const silentNpsJourney = silentNps ? computeSilentNPSJourneyScores(silentNps) : null;
  const auditJourney = audit ? computeAuditJourneyScores(audit) : null;
  const googleJourney = google ? computeGoogleJourneyScores(google) : null;

  const STAGE_META: { stage: JourneyStage; label: string }[] = [
    { stage: 'discovery', label: 'Discovery & Arrival' },
    { stage: 'in-store', label: 'In-Store Experience' },
    { stage: 'trial', label: 'Trial & Exploration' },
    { stage: 'checkout', label: 'Checkout & Billing' },
    { stage: 'post-purchase', label: 'Post-Purchase' },
  ];

  const journeyStages: JourneyStageScore[] = STAGE_META.map(({ stage, label }) => {
    const stageSources: JourneyStageScore['sources'] = [];

    if (npsJourney && npsJourney[stage] >= 0) {
      stageSources.push({ key: 'nps', label: 'NPS', score: npsJourney[stage], detail: `${npsJourney[stage]} NPS-derived` });
    }
    if (silentNpsJourney && silentNpsJourney[stage] >= 0) {
      stageSources.push({ key: 'silentNps', label: 'Silent NPS', score: silentNpsJourney[stage], detail: `${silentNpsJourney[stage]} observed` });
    }
    if (auditJourney && auditJourney[stage] >= 0) {
      stageSources.push({ key: 'audit', label: 'Audit', score: auditJourney[stage], detail: `${auditJourney[stage]} compliance` });
    }
    if (googleJourney && googleJourney[stage] >= 0) {
      stageSources.push({ key: 'google', label: 'Google', score: googleJourney[stage], detail: `${googleJourney[stage]} from reviews` });
    }

    const stageScore = stageSources.length > 0
      ? Math.round(stageSources.reduce((s, src) => s + src.score, 0) / stageSources.length)
      : -1;

    return { stage, label, score: stageScore >= 0 ? stageScore : compositeScore, sources: stageSources };
  });

  return {
    compositeScore,
    sources,
    journeyStages,
    availableSourceCount: available.length,
  };
}

export function getCXScoreColor(score: number): string {
  if (score >= 70) return 'text-green-600';
  if (score >= 50) return 'text-amber-600';
  return 'text-red-600';
}

export function getCXScoreBgColor(score: number): string {
  if (score >= 70) return 'bg-green-500';
  if (score >= 50) return 'bg-amber-500';
  return 'bg-red-500';
}

export function getCXScoreLabel(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 50) return 'Average';
  if (score >= 30) return 'Below Average';
  return 'Poor';
}
