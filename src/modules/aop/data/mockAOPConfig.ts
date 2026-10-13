import type { AOPConfig } from './mockAOPTypes';

export const monthNames = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];

export const spsfFloors: Record<string, number> = {
  A: 775,
  A1: 640,
  A2: 450,
  A3: 340,
};

export const spsfTargets: Record<string, number> = {
  A: 900,
  A1: 770,
  A2: 560,
  A3: 430,
};

export const defaultAOPConfig: AOPConfig = {
  planningCycle: 'annual',
  fiscalYear: 'FY 2026-27',
  baseSPSFSource: 'grade_target',
  growthAssumption: 8,
  monthlyWeights: [7, 6, 5, 6, 7, 8, 12, 10, 9, 8, 7, 15],
  intakeMarginFloor: 53,
  deliveredMarginTarget: 42,
  segmentMargins: [
    { segmentId: 'MC', segmentName: "Men's Casuals", coreIntake: 55, fashionIntake: 50, blendedTarget: 53.5 },
    { segmentId: 'MF', segmentName: "Men's Formals", coreIntake: 56, fashionIntake: 51, blendedTarget: 54.5 },
    { segmentId: 'WIW', segmentName: "Women's Indian Wear", coreIntake: 58, fashionIntake: 52, blendedTarget: 56.2 },
    { segmentId: 'WWW', segmentName: "Women's Western Wear", coreIntake: 54, fashionIntake: 48, blendedTarget: 52.2 },
    { segmentId: 'KW', segmentName: 'Kids Wear', coreIntake: 57, fashionIntake: 51, blendedTarget: 55.2 },
    { segmentId: 'FW', segmentName: 'Footwear', coreIntake: 53, fashionIntake: 47, blendedTarget: 51.0 },
    { segmentId: 'NA', segmentName: 'Non-Apparel', coreIntake: 50, fashionIntake: 44, blendedTarget: 48.0 },
  ],
  markdownBudget: 8,
  shrinkageAllowance: 1.5,
  revenueVarianceThreshold: 5,
  marginVarianceThreshold: 3,
  spsfFloorVariance: 5,
  exceptionSeverity: 'S2',
  maxActiveScenarios: 4,
  autoArchiveDays: 30,
};

export const demandShockPresets = [
  { id: 'a1b2c3d4-6001-4a5b-8c6d-7e8f9a0b1c2d', name: 'Competitor Entry (Single Store)', shockType: 'competitor_entry' as const, defaultModifier: -10, defaultDuration: 'permanent' as const, scopeDescription: 'Stores within 3km' },
  { id: 'a1b2c3d4-6002-4a5b-8c6d-7e8f9a0b1c2d', name: 'Competitor Entry (Chain, 5+ stores)', shockType: 'competitor_entry' as const, defaultModifier: -15, defaultDuration: 'permanent' as const, scopeDescription: 'Stores in overlapping catchments' },
  { id: 'a1b2c3d4-6003-4a5b-8c6d-7e8f9a0b1c2d', name: 'Competitor Exit', shockType: 'competitor_exit' as const, defaultModifier: 10, defaultDuration: 'permanent' as const, scopeDescription: 'Stores in overlapping catchments' },
  { id: 'a1b2c3d4-6004-4a5b-8c6d-7e8f9a0b1c2d', name: 'Monsoon Early/Late (±2 weeks)', shockType: 'weather' as const, defaultModifier: -20, defaultDuration: 'temporary' as const, defaultDurationWeeks: 3, scopeDescription: 'Regional (state-level)' },
  { id: 'a1b2c3d4-6005-4a5b-8c6d-7e8f9a0b1c2d', name: 'Festival Shift (±1 week)', shockType: 'festival_shift' as const, defaultModifier: -5, defaultDuration: 'temporary' as const, defaultDurationWeeks: 4, scopeDescription: 'All stores' },
  { id: 'a1b2c3d4-6006-4a5b-8c6d-7e8f9a0b1c2d', name: 'Macro Slowdown (Mild)', shockType: 'macro' as const, defaultModifier: -5, defaultDuration: 'temporary' as const, defaultDurationWeeks: 26, scopeDescription: 'All stores' },
  { id: 'a1b2c3d4-6007-4a5b-8c6d-7e8f9a0b1c2d', name: 'Macro Slowdown (Severe)', shockType: 'macro' as const, defaultModifier: -15, defaultDuration: 'temporary' as const, defaultDurationWeeks: 52, scopeDescription: 'All stores' },
];
