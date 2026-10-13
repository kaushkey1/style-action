// src/data/mockFixtureProportions.ts

export type ProportionPeriod = 'regular' | 'markdown' | 'eoss' | 'festive';

export interface FixtureProportionRule {
  id: string;
  segmentCode: string;
  segmentName: string;
  period: ProportionPeriod;
  regularFixturePct: number;   // % of segment fixtures for regular merchandise
  markdownFixturePct: number;  // % of segment fixtures for markdown/promo
  displayPriority: 'front' | 'middle' | 'back';
  maxMarkdownDepth: number;    // max garments per markdown fixture
  notes: string;
}

export interface SeasonalFixtureCalendar {
  id: string;
  period: ProportionPeriod;
  label: string;
  startDate: string;
  endDate: string;
  fixtureShiftPct: number;     // % of total fixtures that shift to markdown
  impactedSegments: string[];
  status: 'upcoming' | 'active' | 'completed';
}

export const fixtureProportionRules: FixtureProportionRule[] = [
  // Regular Period Rules
  {
    id: 'prop-001',
    segmentCode: 'MC',
    segmentName: "Men's Casual",
    period: 'regular',
    regularFixturePct: 88,
    markdownFixturePct: 12,
    displayPriority: 'front',
    maxMarkdownDepth: 25,
    notes: 'Standard allocation with minimal markdown presence for regular periods'
  },
  {
    id: 'prop-002',
    segmentCode: 'MF',
    segmentName: "Men's Formal",
    period: 'regular',
    regularFixturePct: 90,
    markdownFixturePct: 10,
    displayPriority: 'middle',
    maxMarkdownDepth: 20,
    notes: 'Formal wear maintains higher regular proportion due to steady demand'
  },
  {
    id: 'prop-003',
    segmentCode: 'WIW',
    segmentName: "Women's Indian Wear",
    period: 'regular',
    regularFixturePct: 85,
    markdownFixturePct: 15,
    displayPriority: 'front',
    maxMarkdownDepth: 30,
    notes: 'Higher markdown allocation for seasonal collections and trend-driven inventory'
  },
  {
    id: 'prop-004',
    segmentCode: 'WWW',
    segmentName: "Women's Western Wear",
    period: 'regular',
    regularFixturePct: 87,
    markdownFixturePct: 13,
    displayPriority: 'front',
    maxMarkdownDepth: 28,
    notes: 'Balanced allocation with focus on current season merchandise'
  },
  {
    id: 'prop-005',
    segmentCode: 'KW',
    segmentName: 'Kids Wear',
    period: 'regular',
    regularFixturePct: 92,
    markdownFixturePct: 8,
    displayPriority: 'middle',
    maxMarkdownDepth: 22,
    notes: 'Highest regular proportion due to fast turnover and size-specific inventory'
  },

  // EOSS Period Rules (Aggressive Reallocation)
  {
    id: 'prop-006',
    segmentCode: 'MC',
    segmentName: "Men's Casual",
    period: 'eoss',
    regularFixturePct: 55,
    markdownFixturePct: 45,
    displayPriority: 'back',
    maxMarkdownDepth: 40,
    notes: 'Aggressive markdown allocation during end-of-season sale - regular items move to back'
  },
  {
    id: 'prop-007',
    segmentCode: 'MF',
    segmentName: "Men's Formal",
    period: 'eoss',
    regularFixturePct: 65,
    markdownFixturePct: 35,
    displayPriority: 'middle',
    maxMarkdownDepth: 35,
    notes: 'Moderate shift for formal wear as base styles remain relevant across seasons'
  },
  {
    id: 'prop-008',
    segmentCode: 'WIW',
    segmentName: "Women's Indian Wear",
    period: 'eoss',
    regularFixturePct: 50,
    markdownFixturePct: 50,
    displayPriority: 'back',
    maxMarkdownDepth: 45,
    notes: 'Equal split during EOSS as festive/seasonal inventory needs aggressive clearance'
  },
  {
    id: 'prop-009',
    segmentCode: 'WWW',
    segmentName: "Women's Western Wear",
    period: 'eoss',
    regularFixturePct: 52,
    markdownFixturePct: 48,
    displayPriority: 'back',
    maxMarkdownDepth: 42,
    notes: 'Near-equal allocation prioritizing markdown visibility for seasonal clearance'
  },
  {
    id: 'prop-010',
    segmentCode: 'KW',
    segmentName: 'Kids Wear',
    period: 'eoss',
    regularFixturePct: 70,
    markdownFixturePct: 30,
    displayPriority: 'front',
    maxMarkdownDepth: 30,
    notes: 'Conservative markdown allocation as kids wear maintains steady demand year-round'
  },

  // Festive Period Rules
  {
    id: 'prop-011',
    segmentCode: 'MC',
    segmentName: "Men's Casual",
    period: 'festive',
    regularFixturePct: 70,
    markdownFixturePct: 30,
    displayPriority: 'front',
    maxMarkdownDepth: 32,
    notes: 'Festive promotion displays with regular merchandise taking priority'
  },
  {
    id: 'prop-012',
    segmentCode: 'MF',
    segmentName: "Men's Formal",
    period: 'festive',
    regularFixturePct: 75,
    markdownFixturePct: 25,
    displayPriority: 'front',
    maxMarkdownDepth: 28,
    notes: 'Festive formal wear featured prominently with select promotional items'
  },
  {
    id: 'prop-013',
    segmentCode: 'WIW',
    segmentName: "Women's Indian Wear",
    period: 'festive',
    regularFixturePct: 65,
    markdownFixturePct: 35,
    displayPriority: 'front',
    maxMarkdownDepth: 38,
    notes: 'Heavy festive merchandise focus with significant promotional display allocation'
  },
  {
    id: 'prop-014',
    segmentCode: 'WWW',
    segmentName: "Women's Western Wear",
    period: 'festive',
    regularFixturePct: 72,
    markdownFixturePct: 28,
    displayPriority: 'front',
    maxMarkdownDepth: 30,
    notes: 'Festive collections and party wear featured with complementary promotions'
  },
  {
    id: 'prop-015',
    segmentCode: 'KW',
    segmentName: 'Kids Wear',
    period: 'festive',
    regularFixturePct: 80,
    markdownFixturePct: 20,
    displayPriority: 'front',
    maxMarkdownDepth: 25,
    notes: 'Festive kids collections prioritized with minimal markdown presence'
  },

  // Markdown Period Rules (Routine Clearance)
  {
    id: 'prop-016',
    segmentCode: 'MC',
    segmentName: "Men's Casual",
    period: 'markdown',
    regularFixturePct: 75,
    markdownFixturePct: 25,
    displayPriority: 'middle',
    maxMarkdownDepth: 30,
    notes: 'Routine clearance with balanced fixture allocation'
  },
  {
    id: 'prop-017',
    segmentCode: 'MF',
    segmentName: "Men's Formal",
    period: 'markdown',
    regularFixturePct: 82,
    markdownFixturePct: 18,
    displayPriority: 'middle',
    maxMarkdownDepth: 24,
    notes: 'Limited markdown fixtures for slow-moving formal inventory'
  },
  {
    id: 'prop-018',
    segmentCode: 'WIW',
    segmentName: "Women's Indian Wear",
    period: 'markdown',
    regularFixturePct: 70,
    markdownFixturePct: 30,
    displayPriority: 'middle',
    maxMarkdownDepth: 35,
    notes: 'Moderate markdown presence for mid-season style rotation'
  },
  {
    id: 'prop-019',
    segmentCode: 'WWW',
    segmentName: "Women's Western Wear",
    period: 'markdown',
    regularFixturePct: 73,
    markdownFixturePct: 27,
    displayPriority: 'middle',
    maxMarkdownDepth: 32,
    notes: 'Regular markdown clearance balanced with current season offerings'
  },
  {
    id: 'prop-020',
    segmentCode: 'KW',
    segmentName: 'Kids Wear',
    period: 'markdown',
    regularFixturePct: 85,
    markdownFixturePct: 15,
    displayPriority: 'middle',
    maxMarkdownDepth: 26,
    notes: 'Minimal markdown allocation due to consistent demand and rapid size turnover'
  }
];

export const seasonalFixtureCalendar: SeasonalFixtureCalendar[] = [
  {
    id: 'season-001',
    period: 'eoss',
    label: 'EOSS Wave 1 (Winter Clearance)',
    startDate: '2026-01-15',
    endDate: '2026-02-28',
    fixtureShiftPct: 42,
    impactedSegments: ['MC', 'MF', 'WIW', 'WWW', 'KW'],
    status: 'completed'
  },
  {
    id: 'season-002',
    period: 'festive',
    label: 'Holi Festive Collection',
    startDate: '2026-03-01',
    endDate: '2026-03-15',
    fixtureShiftPct: 28,
    impactedSegments: ['MC', 'WIW', 'WWW', 'KW'],
    status: 'completed'
  },
  {
    id: 'season-003',
    period: 'regular',
    label: 'SS26 Regular Season',
    startDate: '2026-03-16',
    endDate: '2026-06-30',
    fixtureShiftPct: 12,
    impactedSegments: ['MC', 'MF', 'WIW', 'WWW', 'KW'],
    status: 'active'
  },
  {
    id: 'season-004',
    period: 'eoss',
    label: 'EOSS Wave 2 (Summer Clearance)',
    startDate: '2026-07-01',
    endDate: '2026-08-31',
    fixtureShiftPct: 45,
    impactedSegments: ['MC', 'MF', 'WIW', 'WWW', 'KW'],
    status: 'upcoming'
  },
  {
    id: 'season-005',
    period: 'festive',
    label: 'Festive Season (Durga Puja - Diwali)',
    startDate: '2026-10-01',
    endDate: '2026-11-15',
    fixtureShiftPct: 32,
    impactedSegments: ['MC', 'MF', 'WIW', 'WWW', 'KW'],
    status: 'upcoming'
  },
  {
    id: 'season-006',
    period: 'regular',
    label: 'AW26 Regular Season',
    startDate: '2026-11-16',
    endDate: '2026-12-31',
    fixtureShiftPct: 10,
    impactedSegments: ['MC', 'MF', 'WIW', 'WWW', 'KW'],
    status: 'upcoming'
  }
];
