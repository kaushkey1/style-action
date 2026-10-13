import type { FixturePerformanceData } from './mockRangePlans';

// ─── Mock Fixture Performance Data ─────────────────────────────────────────

export const mockFixturePerformance: FixturePerformanceData[] = [
  { fixtureType: '4-Way Rack', avgSellThrough: 72, revenuePerLFT: 4200, bestSegment: 'MC', worstSegment: 'MF', action: 'keep' },
  { fixtureType: 'Straight Rack (4ft)', avgSellThrough: 68, revenuePerLFT: 3800, bestSegment: 'MF', worstSegment: 'WWW', action: 'keep' },
  { fixtureType: 'Straight Rack (6ft)', avgSellThrough: 65, revenuePerLFT: 3500, bestSegment: 'MC', worstSegment: 'WWW', action: 'keep' },
  { fixtureType: 'Wall Unit (4ft)', avgSellThrough: 70, revenuePerLFT: 4000, bestSegment: 'WIW', worstSegment: 'NA', action: 'keep' },
  { fixtureType: 'Wall Unit (8ft)', avgSellThrough: 78, revenuePerLFT: 5100, bestSegment: 'WIW', worstSegment: 'MC', action: 'keep' },
  { fixtureType: 'Gondola (4ft)', avgSellThrough: 58, revenuePerLFT: 2800, bestSegment: 'KW', worstSegment: 'NA', action: 'review' },
  { fixtureType: 'Gondola (8ft)', avgSellThrough: 62, revenuePerLFT: 3200, bestSegment: 'KW', worstSegment: 'FW', action: 'keep' },
  { fixtureType: 'Nested Table', avgSellThrough: 45, revenuePerLFT: 1900, bestSegment: 'KW', worstSegment: 'MC', action: 'reassign' },
  { fixtureType: 'Display Table', avgSellThrough: 74, revenuePerLFT: 5600, bestSegment: 'WWW', worstSegment: 'WIW', action: 'keep' },
  { fixtureType: 'Mannequin Platform', avgSellThrough: 85, revenuePerLFT: 8200, bestSegment: 'WWW', worstSegment: 'KW', action: 'keep' },
  { fixtureType: 'Waterfall Arm', avgSellThrough: 66, revenuePerLFT: 4800, bestSegment: 'WIW', worstSegment: 'WWW', action: 'keep' },
  { fixtureType: 'Slatwall Panel (4ft)', avgSellThrough: 38, revenuePerLFT: 1400, bestSegment: 'FW', worstSegment: 'NA', action: 'reassign' },
];
