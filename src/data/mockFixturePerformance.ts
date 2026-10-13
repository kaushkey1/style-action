import type { FixturePerformanceData } from '@/modules/range/data/mockRangePlans';

// ─── Mock Fixture Performance Data ─────────────────────────────────────────

export const mockFixturePerformance: FixturePerformanceData[] = [
  { fixtureType: '4-Way', avgSellThrough: 72, revenuePerLFT: 4200, bestSegment: 'MC', worstSegment: 'MF', action: 'keep' },
  { fixtureType: 'Arail', avgSellThrough: 68, revenuePerLFT: 3800, bestSegment: 'MF', worstSegment: 'WWW', action: 'keep' },
  { fixtureType: 'Arail', avgSellThrough: 65, revenuePerLFT: 3500, bestSegment: 'MC', worstSegment: 'WWW', action: 'keep' },
  { fixtureType: 'Wall Panels', avgSellThrough: 70, revenuePerLFT: 4000, bestSegment: 'WIW', worstSegment: 'NA', action: 'keep' },
  { fixtureType: 'Wall Panels', avgSellThrough: 78, revenuePerLFT: 5100, bestSegment: 'WIW', worstSegment: 'MC', action: 'keep' },
  { fixtureType: 'H-Gondola', avgSellThrough: 58, revenuePerLFT: 2800, bestSegment: 'KW', worstSegment: 'NA', action: 'review' },
  { fixtureType: 'H-Gondola', avgSellThrough: 62, revenuePerLFT: 3200, bestSegment: 'KW', worstSegment: 'FW', action: 'keep' },
  { fixtureType: 'Nesting Table', avgSellThrough: 45, revenuePerLFT: 1900, bestSegment: 'KW', worstSegment: 'MC', action: 'reassign' },
  { fixtureType: 'Glass Table', avgSellThrough: 74, revenuePerLFT: 5600, bestSegment: 'WWW', worstSegment: 'WIW', action: 'keep' },
  { fixtureType: 'Glass Table', avgSellThrough: 85, revenuePerLFT: 8200, bestSegment: 'WWW', worstSegment: 'KW', action: 'keep' },
  { fixtureType: 'Wall Panels', avgSellThrough: 66, revenuePerLFT: 4800, bestSegment: 'WIW', worstSegment: 'WWW', action: 'keep' },
  { fixtureType: 'Wall Panels', avgSellThrough: 38, revenuePerLFT: 1400, bestSegment: 'FW', worstSegment: 'NA', action: 'reassign' },
];
