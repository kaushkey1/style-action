import type { OptionPerformanceData } from './mockRangePlans';
import { POD_MW_P1, POD_MW_P2, POD_WIW_P1, POD_WIW_P2, POD_WWW_P3, POD_KW_P1, POD_FW_P1, POD_NA_P1 } from '@/modules/otb/data/mockOTB';

// ─── Mock Option Performance Data (Post N-Day) ────────────────────────────
// 55 options with sell-through data and classifications

export const mockOptionPerformance: OptionPerformanceData[] = [
  // ─── Winners (ROS > 2×) ──────────────────────────────────────────────
  { styleId: 'OP-001', styleName: 'Linen Camp Collar Shirt', segmentId: 'MC', podId: POD_MW_P1, fixtureType: '4-Way Rack', rosActual: 4.8, rosPlanned: 2.0, rosMultiple: 2.4, classification: 'winner', sellThroughPct: 92, revenueShare: 4.2, revenuePerLFT: 8500, action: 'chase' },
  { styleId: 'OP-002', styleName: 'Block Print Kurta', segmentId: 'WIW', podId: POD_WIW_P1, fixtureType: 'Wall Unit (8ft)', rosActual: 5.2, rosPlanned: 2.2, rosMultiple: 2.36, classification: 'winner', sellThroughPct: 90, revenueShare: 5.1, revenuePerLFT: 9200, action: 'chase' },
  { styleId: 'OP-003', styleName: 'High-Rise Wide Leg Jeans', segmentId: 'WWW', podId: POD_WWW_P3, fixtureType: 'Straight Rack (6ft)', rosActual: 4.0, rosPlanned: 1.8, rosMultiple: 2.22, classification: 'winner', sellThroughPct: 88, revenueShare: 3.8, revenuePerLFT: 7800, action: 'chase' },
  { styleId: 'OP-004', styleName: 'Graphic Printed Tee', segmentId: 'MC', podId: POD_MW_P1, fixtureType: 'Nested Table', rosActual: 6.0, rosPlanned: 2.5, rosMultiple: 2.40, classification: 'winner', sellThroughPct: 95, revenueShare: 3.2, revenuePerLFT: 6200, action: 'chase' },
  { styleId: 'OP-005', styleName: 'Embroidered Anarkali', segmentId: 'WIW', podId: POD_WIW_P1, fixtureType: 'Display Table', rosActual: 3.6, rosPlanned: 1.5, rosMultiple: 2.40, classification: 'winner', sellThroughPct: 86, revenueShare: 4.5, revenuePerLFT: 10200, action: 'chase' },
  { styleId: 'OP-006', styleName: 'Canvas Low-Top Sneaker', segmentId: 'FW', podId: POD_FW_P1, fixtureType: 'Slatwall Panel (4ft)', rosActual: 3.2, rosPlanned: 1.4, rosMultiple: 2.29, classification: 'winner', sellThroughPct: 84, revenueShare: 3.6, revenuePerLFT: 7400, action: 'chase' },
  { styleId: 'OP-007', styleName: 'Textured Polo', segmentId: 'MC', podId: POD_MW_P1, fixtureType: '4-Way Rack', rosActual: 4.4, rosPlanned: 2.0, rosMultiple: 2.20, classification: 'winner', sellThroughPct: 89, revenueShare: 2.8, revenuePerLFT: 7200, action: 'chase' },
  { styleId: 'OP-008', styleName: 'Chikankari Kurta Set', segmentId: 'WIW', podId: POD_WIW_P1, fixtureType: 'Waterfall Arm', rosActual: 4.2, rosPlanned: 1.8, rosMultiple: 2.33, classification: 'winner', sellThroughPct: 91, revenueShare: 4.8, revenuePerLFT: 11000, action: 'chase' },
  { styleId: 'OP-009', styleName: 'Cargo Jogger', segmentId: 'MC', podId: POD_MW_P2, fixtureType: 'Straight Rack (4ft)', rosActual: 5.6, rosPlanned: 2.2, rosMultiple: 2.55, classification: 'winner', sellThroughPct: 94, revenueShare: 2.4, revenuePerLFT: 5800, action: 'chase' },
  { styleId: 'OP-010', styleName: 'Kids Character Tee', segmentId: 'KW', podId: POD_KW_P1, fixtureType: 'Gondola (4ft)', rosActual: 7.0, rosPlanned: 3.0, rosMultiple: 2.33, classification: 'winner', sellThroughPct: 96, revenueShare: 2.0, revenuePerLFT: 4200, action: 'chase' },

  // ─── Strong (ROS 1.2-2×) ─────────────────────────────────────────────
  { styleId: 'OP-011', styleName: 'Oxford Button-Down', segmentId: 'MC', podId: POD_MW_P1, fixtureType: 'Straight Rack (4ft)', rosActual: 3.2, rosPlanned: 2.0, rosMultiple: 1.60, classification: 'strong', sellThroughPct: 78, revenueShare: 2.8, revenuePerLFT: 5600, action: 'chase' },
  { styleId: 'OP-012', styleName: 'Slim Fit Chino', segmentId: 'MC', podId: POD_MW_P2, fixtureType: 'Wall Unit (4ft)', rosActual: 2.8, rosPlanned: 1.8, rosMultiple: 1.56, classification: 'strong', sellThroughPct: 75, revenueShare: 2.4, revenuePerLFT: 4800, action: 'chase' },
  { styleId: 'OP-013', styleName: 'Printed Wrap Skirt', segmentId: 'WWW', podId: POD_WWW_P3, fixtureType: 'Waterfall Arm', rosActual: 2.4, rosPlanned: 1.5, rosMultiple: 1.60, classification: 'strong', sellThroughPct: 74, revenueShare: 1.8, revenuePerLFT: 5400, action: 'chase' },
  { styleId: 'OP-014', styleName: 'French Connection Suit', segmentId: 'MF', podId: POD_MW_P2, fixtureType: '4-Way Rack', rosActual: 1.8, rosPlanned: 1.2, rosMultiple: 1.50, classification: 'strong', sellThroughPct: 72, revenueShare: 3.5, revenuePerLFT: 9800, action: 'chase' },
  { styleId: 'OP-015', styleName: 'A-Line Midi Dress', segmentId: 'WWW', podId: POD_WWW_P3, fixtureType: 'Display Table', rosActual: 2.2, rosPlanned: 1.4, rosMultiple: 1.57, classification: 'strong', sellThroughPct: 76, revenueShare: 2.2, revenuePerLFT: 6800, action: 'chase' },
  { styleId: 'OP-016', styleName: 'Banarasi Silk Dupatta', segmentId: 'WIW', podId: POD_WIW_P2, fixtureType: 'Wall Unit (4ft)', rosActual: 2.0, rosPlanned: 1.3, rosMultiple: 1.54, classification: 'strong', sellThroughPct: 73, revenueShare: 2.6, revenuePerLFT: 6400, action: 'chase' },
  { styleId: 'OP-017', styleName: 'Terry Cotton Shorts', segmentId: 'MC', podId: POD_MW_P2, fixtureType: 'Nested Table', rosActual: 3.6, rosPlanned: 2.5, rosMultiple: 1.44, classification: 'strong', sellThroughPct: 70, revenueShare: 1.6, revenuePerLFT: 3800, action: 'chase' },
  { styleId: 'OP-018', styleName: 'Kids Denim Jacket', segmentId: 'KW', podId: POD_KW_P1, fixtureType: 'Wall Unit (4ft)', rosActual: 3.0, rosPlanned: 2.0, rosMultiple: 1.50, classification: 'strong', sellThroughPct: 72, revenueShare: 1.4, revenuePerLFT: 3600, action: 'chase' },
  { styleId: 'OP-019', styleName: 'Slip-On Espadrille', segmentId: 'FW', podId: POD_FW_P1, fixtureType: 'Gondola (4ft)', rosActual: 2.6, rosPlanned: 1.6, rosMultiple: 1.63, classification: 'strong', sellThroughPct: 76, revenueShare: 2.2, revenuePerLFT: 5200, action: 'chase' },
  { styleId: 'OP-020', styleName: 'Leather Crossbody Bag', segmentId: 'NA', podId: POD_NA_P1, fixtureType: 'Slatwall Panel (4ft)', rosActual: 1.6, rosPlanned: 1.0, rosMultiple: 1.60, classification: 'strong', sellThroughPct: 74, revenueShare: 1.5, revenuePerLFT: 4600, action: 'chase' },

  // ─── Stable (ROS 0.8-1.2×) ───────────────────────────────────────────
  { styleId: 'OP-021', styleName: 'Regular Fit Trouser', segmentId: 'MF', podId: POD_MW_P2, fixtureType: 'Straight Rack (6ft)', rosActual: 1.8, rosPlanned: 1.8, rosMultiple: 1.00, classification: 'stable', sellThroughPct: 62, revenueShare: 2.0, revenuePerLFT: 4200, action: 'monitor' },
  { styleId: 'OP-022', styleName: 'Stripe Cotton Shirt', segmentId: 'MC', podId: POD_MW_P1, fixtureType: 'Wall Unit (8ft)', rosActual: 2.0, rosPlanned: 2.0, rosMultiple: 1.00, classification: 'stable', sellThroughPct: 60, revenueShare: 1.8, revenuePerLFT: 3600, action: 'monitor' },
  { styleId: 'OP-023', styleName: 'Relaxed Fit Jeans', segmentId: 'MC', podId: POD_MW_P2, fixtureType: 'Straight Rack (4ft)', rosActual: 2.2, rosPlanned: 2.2, rosMultiple: 1.00, classification: 'stable', sellThroughPct: 58, revenueShare: 1.6, revenuePerLFT: 3200, action: 'monitor' },
  { styleId: 'OP-024', styleName: 'Printed Churidar Set', segmentId: 'WIW', podId: POD_WIW_P1, fixtureType: 'Wall Unit (4ft)', rosActual: 2.4, rosPlanned: 2.2, rosMultiple: 1.09, classification: 'stable', sellThroughPct: 64, revenueShare: 2.0, revenuePerLFT: 4800, action: 'monitor' },
  { styleId: 'OP-025', styleName: 'Ribbed Knit Top', segmentId: 'WWW', podId: POD_WWW_P3, fixtureType: 'Straight Rack (4ft)', rosActual: 1.6, rosPlanned: 1.5, rosMultiple: 1.07, classification: 'stable', sellThroughPct: 58, revenueShare: 1.2, revenuePerLFT: 3200, action: 'monitor' },
  { styleId: 'OP-026', styleName: 'Kids Printed T-Shirt', segmentId: 'KW', podId: POD_KW_P1, fixtureType: 'Gondola (8ft)', rosActual: 3.8, rosPlanned: 3.5, rosMultiple: 1.09, classification: 'stable', sellThroughPct: 62, revenueShare: 1.2, revenuePerLFT: 2800, action: 'monitor' },
  { styleId: 'OP-027', styleName: 'Straight Leg Jean', segmentId: 'WWW', podId: POD_WWW_P3, fixtureType: 'Wall Unit (8ft)', rosActual: 1.4, rosPlanned: 1.5, rosMultiple: 0.93, classification: 'stable', sellThroughPct: 55, revenueShare: 1.6, revenuePerLFT: 3800, action: 'monitor' },
  { styleId: 'OP-028', styleName: 'Cotton Palazzo', segmentId: 'WIW', podId: POD_WIW_P1, fixtureType: 'Display Table', rosActual: 2.0, rosPlanned: 2.2, rosMultiple: 0.91, classification: 'stable', sellThroughPct: 54, revenueShare: 1.4, revenuePerLFT: 4200, action: 'monitor' },
  { styleId: 'OP-029', styleName: 'Sport Sandal', segmentId: 'FW', podId: POD_FW_P1, fixtureType: 'Slatwall Panel (4ft)', rosActual: 1.2, rosPlanned: 1.4, rosMultiple: 0.86, classification: 'stable', sellThroughPct: 52, revenueShare: 1.0, revenuePerLFT: 2800, action: 'monitor' },
  { styleId: 'OP-030', styleName: 'Woven Belt', segmentId: 'NA', podId: POD_NA_P1, fixtureType: 'Slatwall Panel (4ft)', rosActual: 0.8, rosPlanned: 0.9, rosMultiple: 0.89, classification: 'stable', sellThroughPct: 50, revenueShare: 0.6, revenuePerLFT: 2200, action: 'monitor' },
  { styleId: 'OP-031', styleName: 'Tailored Blazer', segmentId: 'MF', podId: POD_MW_P2, fixtureType: '4-Way Rack', rosActual: 1.4, rosPlanned: 1.4, rosMultiple: 1.00, classification: 'stable', sellThroughPct: 60, revenueShare: 2.8, revenuePerLFT: 8200, action: 'monitor' },
  { styleId: 'OP-032', styleName: 'Mandarin Collar Kurta', segmentId: 'WIW', podId: POD_WIW_P1, fixtureType: 'Waterfall Arm', rosActual: 2.2, rosPlanned: 2.0, rosMultiple: 1.10, classification: 'stable', sellThroughPct: 62, revenueShare: 1.8, revenuePerLFT: 5000, action: 'monitor' },
  { styleId: 'OP-033', styleName: 'Kids Cargo Short', segmentId: 'KW', podId: POD_KW_P1, fixtureType: 'Nested Table', rosActual: 3.0, rosPlanned: 3.2, rosMultiple: 0.94, classification: 'stable', sellThroughPct: 56, revenueShare: 0.8, revenuePerLFT: 2400, action: 'monitor' },
  { styleId: 'OP-034', styleName: 'Pleated Culottes', segmentId: 'WWW', podId: POD_WWW_P3, fixtureType: 'Straight Rack (6ft)', rosActual: 1.4, rosPlanned: 1.6, rosMultiple: 0.88, classification: 'stable', sellThroughPct: 52, revenueShare: 1.0, revenuePerLFT: 2600, action: 'monitor' },

  // ─── Weak (ROS < 0.8×) ───────────────────────────────────────────────
  { styleId: 'OP-035', styleName: 'Cargo Utility Shirt', segmentId: 'MC', podId: POD_MW_P1, fixtureType: 'Straight Rack (4ft)', rosActual: 0.8, rosPlanned: 2.0, rosMultiple: 0.40, classification: 'weak', sellThroughPct: 18, revenueShare: 0.2, revenuePerLFT: 800, action: 'remove' },
  { styleId: 'OP-036', styleName: 'Pleated Palazzo', segmentId: 'WWW', podId: POD_WWW_P3, fixtureType: 'Waterfall Arm', rosActual: 0.6, rosPlanned: 1.5, rosMultiple: 0.40, classification: 'weak', sellThroughPct: 22, revenueShare: 0.3, revenuePerLFT: 900, action: 'remove' },
  { styleId: 'OP-037', styleName: 'Formal Loafer', segmentId: 'FW', podId: POD_FW_P1, fixtureType: 'Slatwall Panel (4ft)', rosActual: 0.4, rosPlanned: 1.0, rosMultiple: 0.40, classification: 'weak', sellThroughPct: 15, revenueShare: 0.1, revenuePerLFT: 600, action: 'remove' },
  { styleId: 'OP-038', styleName: 'Heavy Wool Blazer', segmentId: 'MF', podId: POD_MW_P2, fixtureType: 'Wall Unit (4ft)', rosActual: 0.6, rosPlanned: 1.2, rosMultiple: 0.50, classification: 'weak', sellThroughPct: 20, revenueShare: 0.4, revenuePerLFT: 1200, action: 'markdown' },
  { styleId: 'OP-039', styleName: 'Velvet Maxi Dress', segmentId: 'WWW', podId: POD_WWW_P3, fixtureType: 'Display Table', rosActual: 0.5, rosPlanned: 1.0, rosMultiple: 0.50, classification: 'weak', sellThroughPct: 24, revenueShare: 0.3, revenuePerLFT: 1100, action: 'markdown' },
  { styleId: 'OP-040', styleName: 'Embroidered Shrug', segmentId: 'WIW', podId: POD_WIW_P1, fixtureType: 'Wall Unit (4ft)', rosActual: 0.8, rosPlanned: 1.8, rosMultiple: 0.44, classification: 'weak', sellThroughPct: 26, revenueShare: 0.4, revenuePerLFT: 1400, action: 'markdown' },
  { styleId: 'OP-041', styleName: 'Kids Formal Suit', segmentId: 'KW', podId: POD_KW_P1, fixtureType: 'Wall Unit (4ft)', rosActual: 0.8, rosPlanned: 1.5, rosMultiple: 0.53, classification: 'weak', sellThroughPct: 28, revenueShare: 0.3, revenuePerLFT: 1800, action: 'markdown' },
  { styleId: 'OP-042', styleName: 'Studded Clutch', segmentId: 'NA', podId: POD_NA_P1, fixtureType: 'Slatwall Panel (4ft)', rosActual: 0.3, rosPlanned: 0.8, rosMultiple: 0.38, classification: 'weak', sellThroughPct: 14, revenueShare: 0.1, revenuePerLFT: 500, action: 'remove' },
  { styleId: 'OP-043', styleName: 'Platform Heel Sandal', segmentId: 'FW', podId: POD_FW_P1, fixtureType: 'Gondola (4ft)', rosActual: 0.6, rosPlanned: 1.2, rosMultiple: 0.50, classification: 'weak', sellThroughPct: 20, revenueShare: 0.2, revenuePerLFT: 800, action: 'markdown' },
  { styleId: 'OP-044', styleName: 'Oversized Cardigan', segmentId: 'WWW', podId: POD_WWW_P3, fixtureType: 'Straight Rack (4ft)', rosActual: 0.4, rosPlanned: 1.0, rosMultiple: 0.40, classification: 'weak', sellThroughPct: 16, revenueShare: 0.2, revenuePerLFT: 700, action: 'remove' },
  { styleId: 'OP-045', styleName: 'Crochet Vest', segmentId: 'WWW', podId: POD_WWW_P3, fixtureType: 'Waterfall Arm', rosActual: 0.5, rosPlanned: 1.0, rosMultiple: 0.50, classification: 'weak', sellThroughPct: 22, revenueShare: 0.2, revenuePerLFT: 800, action: 'markdown' },

  // Additional strong/stable
  { styleId: 'OP-046', styleName: 'Nehru Jacket', segmentId: 'MF', podId: POD_MW_P2, fixtureType: 'Mannequin Platform', rosActual: 1.8, rosPlanned: 1.0, rosMultiple: 1.80, classification: 'strong', sellThroughPct: 82, revenueShare: 2.0, revenuePerLFT: 12000, action: 'chase' },
  { styleId: 'OP-047', styleName: 'Denim Jacket', segmentId: 'MC', podId: POD_MW_P1, fixtureType: 'Mannequin Platform', rosActual: 2.0, rosPlanned: 1.2, rosMultiple: 1.67, classification: 'strong', sellThroughPct: 80, revenueShare: 1.8, revenuePerLFT: 10500, action: 'chase' },
  { styleId: 'OP-048', styleName: 'Silk Saree', segmentId: 'WIW', podId: POD_WIW_P2, fixtureType: 'Wall Unit (8ft)', rosActual: 1.6, rosPlanned: 1.2, rosMultiple: 1.33, classification: 'strong', sellThroughPct: 68, revenueShare: 5.2, revenuePerLFT: 14000, action: 'chase' },
  { styleId: 'OP-049', styleName: 'Track Pant', segmentId: 'MC', podId: POD_MW_P2, fixtureType: 'Wall Unit (4ft)', rosActual: 2.8, rosPlanned: 2.4, rosMultiple: 1.17, classification: 'stable', sellThroughPct: 64, revenueShare: 1.4, revenuePerLFT: 3200, action: 'monitor' },
  { styleId: 'OP-050', styleName: 'Cotton Pajama Set', segmentId: 'KW', podId: POD_KW_P1, fixtureType: 'Gondola (8ft)', rosActual: 4.2, rosPlanned: 3.8, rosMultiple: 1.11, classification: 'stable', sellThroughPct: 60, revenueShare: 1.0, revenuePerLFT: 2400, action: 'monitor' },
];

// ─── Performance Summary ────────────────────────────────────────────────────

export const performanceSummary = {
  winners: { count: 10, pct: 18, avgRosMultiple: 2.35 },
  strong: { count: 12, pct: 22, avgRosMultiple: 1.56 },
  stable: { count: 14, pct: 25, avgRosMultiple: 0.98 },
  weak: { count: 11, pct: 20, avgRosMultiple: 0.45 },
  total: 50,
  rationalizationCandidates: 8,
  freedFixturePositions: 336,
};
