import type { CarryoverStyle } from './mockRangePlans';

// ─── Mock Carryover Styles ─────────────────────────────────────────────────
// 35 NOOS styles with performance metrics and carryover decisions

export const mockCarryoverStyles: CarryoverStyle[] = [
  // ─── MC (Men's Casuals) — Shirts ─────────────────────────────────────
  { styleId: 'MC-001', styleName: 'Oxford Classic', subCategory: 'Shirts', segmentId: 'MC', sellThrough90d: 82, rosTrend: 'growing', intakeMargin: 55, revenueShare: 3.2, competitorHasEquivalent: true, customerFeedback: 'positive', decision: 'continue', decisionReason: 'High sell-through, growing ROS, above margin floor', decisionBy: 'system', overriddenBy: null, storesCarrying: 420, fixturePositions: 3360, otbImpact: 1420000 },
  { styleId: 'MC-002', styleName: 'Linen Blend', subCategory: 'Shirts', segmentId: 'MC', sellThrough90d: 74, rosTrend: 'stable', intakeMargin: 54, revenueShare: 2.8, competitorHasEquivalent: true, customerFeedback: 'positive', decision: 'continue', decisionReason: 'Strong sell-through, stable demand', decisionBy: 'system', overriddenBy: null, storesCarrying: 420, fixturePositions: 3360, otbImpact: 1180000 },
  { styleId: 'MC-003', styleName: 'Mandarin Collar', subCategory: 'Shirts', segmentId: 'MC', sellThrough90d: 58, rosTrend: 'declining', intakeMargin: 53, revenueShare: 1.8, competitorHasEquivalent: false, customerFeedback: 'mixed', decision: 'refresh', decisionReason: 'Declining trend but unique positioning — refresh with new colorways', decisionBy: 'system', overriddenBy: null, storesCarrying: 350, fixturePositions: 2800, otbImpact: 840000 },
  { styleId: 'MC-004', styleName: 'Printed Floral', subCategory: 'Shirts', segmentId: 'MC', sellThrough90d: 45, rosTrend: 'declining', intakeMargin: 52, revenueShare: 1.2, competitorHasEquivalent: true, customerFeedback: 'mixed', decision: 'refresh', decisionReason: 'Below target but viable — needs fabric refresh', decisionBy: 'system', overriddenBy: null, storesCarrying: 300, fixturePositions: 2400, otbImpact: 620000 },
  { styleId: 'MC-005', styleName: 'Oversized Check', subCategory: 'Shirts', segmentId: 'MC', sellThrough90d: 32, rosTrend: 'sharp-decline', intakeMargin: 48, revenueShare: 0.6, competitorHasEquivalent: true, customerFeedback: 'negative', decision: 'exit', decisionReason: 'Sharp decline, below margin floor, negative feedback', decisionBy: 'system', overriddenBy: null, storesCarrying: 280, fixturePositions: 2240, otbImpact: 480000 },
  { styleId: 'MC-006', styleName: 'Denim Shirt', subCategory: 'Shirts', segmentId: 'MC', sellThrough90d: 28, rosTrend: 'sharp-decline', intakeMargin: 46, revenueShare: 0.4, competitorHasEquivalent: true, customerFeedback: 'negative', decision: 'exit', decisionReason: 'Lowest sell-through, below margin, competitor has better', decisionBy: 'system', overriddenBy: null, storesCarrying: 250, fixturePositions: 2000, otbImpact: 360000 },
  { styleId: 'MC-007', styleName: 'Slim Fit Stretch', subCategory: 'Shirts', segmentId: 'MC', sellThrough90d: 52, rosTrend: 'stable', intakeMargin: 54, revenueShare: 2.0, competitorHasEquivalent: true, customerFeedback: 'neutral', decision: 'undecided', decisionReason: 'Borderline — needs manual review by Category Head', decisionBy: 'system', overriddenBy: null, storesCarrying: 380, fixturePositions: 3040, otbImpact: 920000 },
  { styleId: 'MC-008', styleName: 'Henley Textured', subCategory: 'T-Shirts', segmentId: 'MC', sellThrough90d: 78, rosTrend: 'growing', intakeMargin: 56, revenueShare: 2.6, competitorHasEquivalent: false, customerFeedback: 'positive', decision: 'continue', decisionReason: 'Growing category, above margin, unique design', decisionBy: 'system', overriddenBy: null, storesCarrying: 400, fixturePositions: 3200, otbImpact: 1080000 },
  { styleId: 'MC-009', styleName: 'Polo Pique', subCategory: 'T-Shirts', segmentId: 'MC', sellThrough90d: 85, rosTrend: 'stable', intakeMargin: 58, revenueShare: 3.8, competitorHasEquivalent: true, customerFeedback: 'positive', decision: 'continue', decisionReason: 'Best seller, high margin, customer favorite', decisionBy: 'system', overriddenBy: null, storesCarrying: 420, fixturePositions: 3360, otbImpact: 1560000 },
  { styleId: 'MC-010', styleName: 'Graphic Print Crew', subCategory: 'T-Shirts', segmentId: 'MC', sellThrough90d: 35, rosTrend: 'sharp-decline', intakeMargin: 50, revenueShare: 0.5, competitorHasEquivalent: true, customerFeedback: 'mixed', decision: 'exit', decisionReason: 'Trend has passed, below sell-through floor', decisionBy: 'system', overriddenBy: null, storesCarrying: 280, fixturePositions: 2240, otbImpact: 420000 },

  // ─── MF (Men's Formals) ──────────────────────────────────────────────
  { styleId: 'MF-001', styleName: 'Slim Fit Suit', subCategory: 'Suits', segmentId: 'MF', sellThrough90d: 65, rosTrend: 'stable', intakeMargin: 57, revenueShare: 4.2, competitorHasEquivalent: true, customerFeedback: 'positive', decision: 'continue', decisionReason: 'Core category staple, healthy performance', decisionBy: 'system', overriddenBy: null, storesCarrying: 380, fixturePositions: 3040, otbImpact: 2200000 },
  { styleId: 'MF-002', styleName: 'Pleated Trouser', subCategory: 'Trousers', segmentId: 'MF', sellThrough90d: 72, rosTrend: 'growing', intakeMargin: 55, revenueShare: 3.5, competitorHasEquivalent: true, customerFeedback: 'positive', decision: 'continue', decisionReason: 'Growing demand, solid performance', decisionBy: 'system', overriddenBy: null, storesCarrying: 400, fixturePositions: 3200, otbImpact: 1480000 },
  { styleId: 'MF-003', styleName: 'Double Breasted Blazer', subCategory: 'Blazers', segmentId: 'MF', sellThrough90d: 42, rosTrend: 'declining', intakeMargin: 53, revenueShare: 1.1, competitorHasEquivalent: false, customerFeedback: 'neutral', decision: 'refresh', decisionReason: 'Declining but unique — refresh with modern cut', decisionBy: 'system', overriddenBy: null, storesCarrying: 280, fixturePositions: 2240, otbImpact: 680000 },
  { styleId: 'MF-004', styleName: 'Striped Formal Shirt', subCategory: 'Shirts', segmentId: 'MF', sellThrough90d: 69, rosTrend: 'stable', intakeMargin: 54, revenueShare: 2.9, competitorHasEquivalent: true, customerFeedback: 'positive', decision: 'continue', decisionReason: 'Stable demand, above all thresholds', decisionBy: 'system', overriddenBy: null, storesCarrying: 420, fixturePositions: 3360, otbImpact: 1260000 },
  { styleId: 'MF-005', styleName: 'Linen Trouser', subCategory: 'Trousers', segmentId: 'MF', sellThrough90d: 48, rosTrend: 'declining', intakeMargin: 52, revenueShare: 1.4, competitorHasEquivalent: true, customerFeedback: 'mixed', decision: 'undecided', decisionReason: 'Seasonal item — needs manual review for SS26 viability', decisionBy: 'system', overriddenBy: null, storesCarrying: 320, fixturePositions: 2560, otbImpact: 780000 },

  // ─── WIW (Women's Indian Wear) ───────────────────────────────────────
  { styleId: 'WIW-001', styleName: 'Embroidered Kurta Set', subCategory: 'Kurtas', segmentId: 'WIW', sellThrough90d: 88, rosTrend: 'growing', intakeMargin: 56, revenueShare: 5.1, competitorHasEquivalent: true, customerFeedback: 'positive', decision: 'continue', decisionReason: 'Top performer, maximum sell-through', decisionBy: 'system', overriddenBy: null, storesCarrying: 380, fixturePositions: 3040, otbImpact: 2400000 },
  { styleId: 'WIW-002', styleName: 'Cotton Straight Kurta', subCategory: 'Kurtas', segmentId: 'WIW', sellThrough90d: 76, rosTrend: 'stable', intakeMargin: 54, revenueShare: 3.8, competitorHasEquivalent: true, customerFeedback: 'positive', decision: 'continue', decisionReason: 'Everyday staple, consistent demand', decisionBy: 'system', overriddenBy: null, storesCarrying: 380, fixturePositions: 3040, otbImpact: 1680000 },
  { styleId: 'WIW-003', styleName: 'Printed Palazzo Set', subCategory: 'Sets', segmentId: 'WIW', sellThrough90d: 55, rosTrend: 'declining', intakeMargin: 53, revenueShare: 1.6, competitorHasEquivalent: true, customerFeedback: 'mixed', decision: 'refresh', decisionReason: 'Pattern fatigue — needs fresh prints for SS26', decisionBy: 'system', overriddenBy: null, storesCarrying: 320, fixturePositions: 2560, otbImpact: 860000 },
  { styleId: 'WIW-004', styleName: 'Bandhani Dupatta', subCategory: 'Dupattas', segmentId: 'WIW', sellThrough90d: 62, rosTrend: 'stable', intakeMargin: 58, revenueShare: 1.2, competitorHasEquivalent: false, customerFeedback: 'positive', decision: 'continue', decisionReason: 'Unique offering, good margin, accessory upsell', decisionBy: 'system', overriddenBy: null, storesCarrying: 350, fixturePositions: 2800, otbImpact: 420000 },
  { styleId: 'WIW-005', styleName: 'Anarkali Heavy', subCategory: 'Festive', segmentId: 'WIW', sellThrough90d: 30, rosTrend: 'sharp-decline', intakeMargin: 49, revenueShare: 0.4, competitorHasEquivalent: true, customerFeedback: 'negative', decision: 'exit', decisionReason: 'Festive only — not relevant for SS26', decisionBy: 'system', overriddenBy: null, storesCarrying: 200, fixturePositions: 1600, otbImpact: 520000 },

  // ─── WWW (Women's Western Wear) ──────────────────────────────────────
  { styleId: 'WWW-001', styleName: 'Fitted Blazer', subCategory: 'Blazers', segmentId: 'WWW', sellThrough90d: 70, rosTrend: 'growing', intakeMargin: 55, revenueShare: 2.8, competitorHasEquivalent: true, customerFeedback: 'positive', decision: 'continue', decisionReason: 'Growing category, workwear staple', decisionBy: 'system', overriddenBy: null, storesCarrying: 350, fixturePositions: 2800, otbImpact: 1540000 },
  { styleId: 'WWW-002', styleName: 'Wide Leg Trouser', subCategory: 'Trousers', segmentId: 'WWW', sellThrough90d: 68, rosTrend: 'stable', intakeMargin: 54, revenueShare: 2.4, competitorHasEquivalent: true, customerFeedback: 'positive', decision: 'continue', decisionReason: 'Stable demand, versatile piece', decisionBy: 'system', overriddenBy: null, storesCarrying: 380, fixturePositions: 3040, otbImpact: 1260000 },
  { styleId: 'WWW-003', styleName: 'Pleated Midi Skirt', subCategory: 'Skirts', segmentId: 'WWW', sellThrough90d: 44, rosTrend: 'declining', intakeMargin: 52, revenueShare: 0.9, competitorHasEquivalent: true, customerFeedback: 'neutral', decision: 'refresh', decisionReason: 'Update with SS26 color palette', decisionBy: 'system', overriddenBy: null, storesCarrying: 300, fixturePositions: 2400, otbImpact: 540000 },
  { styleId: 'WWW-004', styleName: 'Boyfriend Jeans', subCategory: 'Denims', segmentId: 'WWW', sellThrough90d: 25, rosTrend: 'sharp-decline', intakeMargin: 47, revenueShare: 0.3, competitorHasEquivalent: true, customerFeedback: 'negative', decision: 'exit', decisionReason: 'Silhouette trend has passed, below all thresholds', decisionBy: 'system', overriddenBy: null, storesCarrying: 250, fixturePositions: 2000, otbImpact: 380000 },
  { styleId: 'WWW-005', styleName: 'Wrap Dress', subCategory: 'Dresses', segmentId: 'WWW', sellThrough90d: 64, rosTrend: 'stable', intakeMargin: 55, revenueShare: 2.2, competitorHasEquivalent: false, customerFeedback: 'positive', decision: 'continue', decisionReason: 'Unique design, solid performance', decisionBy: 'system', overriddenBy: null, storesCarrying: 340, fixturePositions: 2720, otbImpact: 1180000 },

  // ─── KW (Kids Wear) ──────────────────────────────────────────────────
  { styleId: 'KW-001', styleName: 'Cotton Romper Set', subCategory: 'Infant', segmentId: 'KW', sellThrough90d: 80, rosTrend: 'growing', intakeMargin: 56, revenueShare: 2.4, competitorHasEquivalent: true, customerFeedback: 'positive', decision: 'continue', decisionReason: 'Essential baby category, high repeat purchase', decisionBy: 'system', overriddenBy: null, storesCarrying: 320, fixturePositions: 2560, otbImpact: 680000 },
  { styleId: 'KW-002', styleName: 'Denim Dungaree', subCategory: 'Kids Boys', segmentId: 'KW', sellThrough90d: 62, rosTrend: 'stable', intakeMargin: 54, revenueShare: 1.8, competitorHasEquivalent: true, customerFeedback: 'positive', decision: 'continue', decisionReason: 'Solid performer, evergreen style', decisionBy: 'system', overriddenBy: null, storesCarrying: 300, fixturePositions: 2400, otbImpact: 540000 },
  { styleId: 'KW-003', styleName: 'Ethnic Lehenga Set', subCategory: 'Kids Girls', segmentId: 'KW', sellThrough90d: 38, rosTrend: 'declining', intakeMargin: 51, revenueShare: 0.7, competitorHasEquivalent: true, customerFeedback: 'mixed', decision: 'exit', decisionReason: 'Festive only, poor SS26 relevance', decisionBy: 'system', overriddenBy: null, storesCarrying: 220, fixturePositions: 1760, otbImpact: 340000 },

  // ─── FW (Footwear) ───────────────────────────────────────────────────
  { styleId: 'FW-001', styleName: 'Canvas Sneaker', subCategory: 'Casual', segmentId: 'FW', sellThrough90d: 75, rosTrend: 'growing', intakeMargin: 56, revenueShare: 3.5, competitorHasEquivalent: true, customerFeedback: 'positive', decision: 'continue', decisionReason: 'Category leader, strong growth', decisionBy: 'system', overriddenBy: null, storesCarrying: 300, fixturePositions: 2400, otbImpact: 1080000 },
  { styleId: 'FW-002', styleName: 'Formal Loafer', subCategory: 'Formal', segmentId: 'FW', sellThrough90d: 22, rosTrend: 'sharp-decline', intakeMargin: 45, revenueShare: 0.2, competitorHasEquivalent: true, customerFeedback: 'negative', decision: 'exit', decisionReason: 'Category consolidation, worst performer', decisionBy: 'system', overriddenBy: null, storesCarrying: 200, fixturePositions: 1600, otbImpact: 280000 },
  { styleId: 'FW-003', styleName: 'Sports Running Shoe', subCategory: 'Sports', segmentId: 'FW', sellThrough90d: 68, rosTrend: 'stable', intakeMargin: 54, revenueShare: 2.8, competitorHasEquivalent: true, customerFeedback: 'positive', decision: 'continue', decisionReason: 'Stable category, good margin', decisionBy: 'system', overriddenBy: null, storesCarrying: 280, fixturePositions: 2240, otbImpact: 920000 },

  // ─── NA (Non-Apparel) ────────────────────────────────────────────────
  { styleId: 'NA-001', styleName: 'Leather Belt Classic', subCategory: 'Belts', segmentId: 'NA', sellThrough90d: 70, rosTrend: 'stable', intakeMargin: 60, revenueShare: 1.2, competitorHasEquivalent: true, customerFeedback: 'positive', decision: 'continue', decisionReason: 'High margin accessory, always in demand', decisionBy: 'system', overriddenBy: null, storesCarrying: 280, fixturePositions: 2240, otbImpact: 320000 },
  { styleId: 'NA-002', styleName: 'Printed Scarf', subCategory: 'Scarves', segmentId: 'NA', sellThrough90d: 40, rosTrend: 'declining', intakeMargin: 52, revenueShare: 0.4, competitorHasEquivalent: true, customerFeedback: 'neutral', decision: 'undecided', decisionReason: 'Seasonal relevance for SS26 — needs review', decisionBy: 'system', overriddenBy: null, storesCarrying: 200, fixturePositions: 1600, otbImpact: 180000 },
];

// ─── Carryover Summary ─────────────────────────────────────────────────────

export const carryoverSummary = {
  totalNOOS: 842,
  continueCount: 612,
  continuePct: 73,
  refreshCount: 98,
  refreshPct: 12,
  exitCount: 84,
  exitPct: 10,
  undecidedCount: 48,
  undecidedPct: 5,
  freedCapacity: {
    optionSlots: 84,
    storesAffected: 420,
    fixturePositions: 672,
    otbFreed: 2840000000,
  },
  freedAllocation: {
    newFashion: 48,
    competitiveGapFilling: 20,
    deeperStock: 16,
  },
};
