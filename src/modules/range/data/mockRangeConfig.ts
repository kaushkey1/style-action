// ─── Range Configuration (Admin) ────────────────────────────────────────────

export interface RangeConfig {
  rangeParams: {
    targetOptionsA0A1: number;
    targetOptionsA2: number;
    targetOptionsA3: number;
    defaultSizeSet: number;
    stockingDensityTarget: number;
    optionReductionTarget: number;
  };
  fashionSplit: {
    a0a1Core: number;
    a0a1Fashion: number;
    a2Core: number;
    a2Fashion: number;
    a3Core: number;
    a3Fashion: number;
  };
  priceLadder: {
    highAffluence: { entry: number; mid: number; premium: number };
    mediumAffluence: { entry: number; mid: number; premium: number };
    lowAffluence: { entry: number; mid: number; premium: number };
  };
  carryoverRules: {
    sellThroughFloorContinue: number;
    sellThroughFloorRefresh: number;
    maxCarryoverPct: number;
    minNewFashionPct: number;
  };
  externalBrands: {
    floor: number;
    ceiling: number;
  };
}

export const mockRangeConfig: RangeConfig = {
  rangeParams: {
    targetOptionsA0A1: 2000,
    targetOptionsA2: 1800,
    targetOptionsA3: 1500,
    defaultSizeSet: 8,
    stockingDensityTarget: 2.17,
    optionReductionTarget: 2000,
  },
  fashionSplit: {
    a0a1Core: 65,
    a0a1Fashion: 35,
    a2Core: 70,
    a2Fashion: 30,
    a3Core: 80,
    a3Fashion: 20,
  },
  priceLadder: {
    highAffluence: { entry: 25, mid: 45, premium: 30 },
    mediumAffluence: { entry: 40, mid: 45, premium: 15 },
    lowAffluence: { entry: 50, mid: 40, premium: 10 },
  },
  carryoverRules: {
    sellThroughFloorContinue: 60,
    sellThroughFloorRefresh: 40,
    maxCarryoverPct: 65,
    minNewFashionPct: 20,
  },
  externalBrands: {
    floor: 15,
    ceiling: 40,
  },
};
