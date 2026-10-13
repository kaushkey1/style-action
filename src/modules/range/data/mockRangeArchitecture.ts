import type {
  BuyingModelId,
  BmAllocationSummary,
  RANetworkKPI,
  RASegment,
  RAFamily,
  RABrick,
  SystemRecommendation,
  Hit
} from "./types/rangeArchitecture";

// Re-export types for convenience
export type {
  BuyingModelId,
  BmAllocationSummary,
  RANetworkKPI,
  RASegment,
  RAFamily,
  RABrick,
  SystemRecommendation,
  Hit
};

// Re-export constants
export { BUYING_MODELS } from "./types/rangeArchitecture";

// Style-level BM metadata
export interface StyleBmMetadata {
  styleId: string;
  styleName: string;
  buyingModel: BuyingModelId;
  channelDestination: string[]; // ['omnichannel', 'store-exclusive', 'online-exclusive', 'platform-ajio', 'platform-trends']
  channelExclusivity: boolean;
  inventoryOwnership: 'brand' | 'vendor' | 'retailer';
  marginProfile: number; // percentage
  leadTime: number; // in days
  returnToVendor: boolean;
}

export interface CategoryExecutionProfile {
  categoryId: string;
  categoryName: string;
  season: string;
  totalOtb: number;
  totalOptions: number;
  bmAllocations: BmAllocationSummary[];
  channelSplit: {
    offline: number;
    online: number;
    marketplace: number;
    social: number;
  };
  bmChannelMatrix: Record<BuyingModelId, {
    offline: number;
    online: number;
    marketplace: number;
    social: number;
  }>;
  sourcingEngineSplit: {
    scaleMargin: number;
    fastResponse: number;
    testRepeat: number;
  };
}

export const mockNetworkKPIs: RANetworkKPI = {
  rangeLockProgress: {
    value: 75,
    lockedSegments: 3,
    totalSegments: 4,
    optionsLocked: 3456,
    totalOptions: 4800,
    raLocked: 3120,
    raTarget: 3960,
    nonRaLocked: 336,
    nonRaTarget: 840,
    unlockedSegments: ["KW"],
    deadlineDate: "Mar 8, 2026",
    daysRemaining: 12
  },
  coreFashionSplit: {
    core: 72,
    fashion: 28,
    targetCore: 70,
    targetFashion: 30,
    status: "Completed"
  },
  fixtureUtilization: {
    value: 91,
    capacity: 5200,
    planned: 4732,
    density: 2.17,
    targetDensity: 2.17,
    status: "Completed"
  },
  ftfAdoption: {
    value: 34,
    adopted: 34,
    partial: 44,
    ignored: 22,
    ftfOptions: 1360,
    totalOptions: 4000,
    status: "New"
  }
};

export const mockSegments: RASegment[] = [
  {
    id: "seg-mw-formal-shirts",
    code: "MW-SH",
    name: "Men Western: Formal Shirts",
    abbreviation: "MC",
    category: "Menswear",
    season: "SS26",
    phase: "Range Planning",
    totalOptions: 480,
    optionsLocked: 428,
    raOptions: 380,
    raOptionTarget: 396,
    nonRaOptions: 48,
    nonRaOptionTarget: 84,
    buyQty: 690000,
    coreSplit: 55,
    fashionSplit: 45,
    fixtureUtilization: 92,
    ftfAdoption: 38,
    storesCovered: 450,
    totalStores: 450,
    status: "Ongoing",
    isLocked: false,
    alertMessage: "Spring refresh ready",
    bmCount: 5,
    families: [
      {
        id: "fam-mw-sh-formal",
        code: "MW-SH-FOR",
        name: "Formal Shirts",
        segmentId: "seg-mw-formal-shirts",
        options: 120,
        optionTarget: 120,
        buyQty: 180000,
        budget: 32000000,
        fashionPct: 30,
        ftfPct: 25,
        stores: 450,
        totalStores: 450,
        status: "Ongoing",
        contributionPct: 25,
        progressPct: 100,
        stage: "Designing",
        risk: "Low",
        bmCount: 2,
        bmAllocations: [
          {
            buyingModelId: "BM-1",
            code: "BM-1",
            shortLabel: "In-House",
            sharePct: 70,
            optionTarget: 84,
            optionsBuilt: 82,
            milestoneStatus: "on_track"
          },
          {
            buyingModelId: "BM-2",
            code: "BM-2",
            shortLabel: "ODM",
            sharePct: 30,
            optionTarget: 36,
            optionsBuilt: 30,
            milestoneStatus: "on_track"
          }
        ],
        raPlanPct: 100,
        vendorPct: 0
      },
      {
        id: "fam-mw-sh-casual",
        code: "MW-SH-CAS",
        name: "Casual Shirts",
        segmentId: "seg-mw-formal-shirts",
        options: 180,
        optionTarget: 180,
        buyQty: 240000,
        budget: 48000000,
        fashionPct: 60,
        ftfPct: 45,
        stores: 450,
        totalStores: 450,
        status: "New",
        alertMessage: "Spring refresh ready",
        contributionPct: 37,
        progressPct: 89,
        stage: "Designing",
        risk: "Medium",
        bmCount: 3,
        bmAllocations: [
          {
            buyingModelId: "BM-1",
            code: "BM-1",
            shortLabel: "In-House",
            sharePct: 50,
            optionTarget: 90,
            optionsBuilt: 88,
            milestoneStatus: "on_track"
          },
          {
            buyingModelId: "BM-2",
            code: "BM-2",
            shortLabel: "ODM",
            sharePct: 25,
            optionTarget: 45,
            optionsBuilt: 40,
            milestoneStatus: "at_risk"
          },
          {
            buyingModelId: "BM-6",
            code: "BM-6",
            shortLabel: "Consignment",
            sharePct: 25,
            optionTarget: 45,
            optionsBuilt: 0,
            milestoneStatus: "not_due"
          }
        ],
        raPlanPct: 75,
        vendorPct: 25
      },
      {
        id: "fam-mw-sh-smart",
        code: "MW-SH-SMT",
        name: "Smart Casuals",
        segmentId: "seg-mw-formal-shirts",
        options: 100,
        optionTarget: 100,
        buyQty: 150000,
        budget: 28000000,
        fashionPct: 50,
        ftfPct: 35,
        stores: 380,
        totalStores: 450,
        status: "Ongoing",
        contributionPct: 21,
        progressPct: 97,
        stage: "Designing",
        risk: "Low",
        bmCount: 2,
        bmAllocations: [
          {
            buyingModelId: "BM-1",
            code: "BM-1",
            shortLabel: "In-House",
            sharePct: 60,
            optionTarget: 60,
            optionsBuilt: 58,
            milestoneStatus: "on_track"
          },
          {
            buyingModelId: "BM-4",
            code: "BM-4",
            shortLabel: "Ext. Brand",
            sharePct: 40,
            optionTarget: 40,
            optionsBuilt: 38,
            milestoneStatus: "complete"
          }
        ],
        raPlanPct: 100,
        vendorPct: 0
      },
      {
        id: "fam-mw-sh-ethnic",
        code: "MW-SH-ETH",
        name: "Ethnic Wear",
        segmentId: "seg-mw-formal-shirts",
        options: 80,
        buyQty: 120000,
        fashionPct: 35,
        ftfPct: 20,
        stores: 320,
        status: "Ongoing",
        bmCount: 3,
        bmAllocations: [
          {
            buyingModelId: "BM-1",
            code: "BM-1",
            shortLabel: "In-House",
            sharePct: 40,
            optionTarget: 32,
            optionsBuilt: 30,
            milestoneStatus: "on_track"
          },
          {
            buyingModelId: "BM-3",
            code: "BM-3",
            shortLabel: "Vendor Nom.",
            sharePct: 40,
            optionTarget: 32,
            optionsBuilt: 28,
            milestoneStatus: "on_track"
          },
          {
            buyingModelId: "BM-6",
            code: "BM-6",
            shortLabel: "Consignment",
            sharePct: 20,
            optionTarget: 16,
            optionsBuilt: 0,
            milestoneStatus: "not_due"
          }
        ],
        raPlanPct: 80,
        vendorPct: 20
      }
    ]
  },
  {
    id: "seg-ww-casual-tops",
    code: "WW-TOP",
    name: "Women Western: Casual Tops",
    abbreviation: "WW",
    category: "Womenswear",
    season: "SS26",
    phase: "Designing",
    totalOptions: 520,
    optionsLocked: 468,
    raOptions: 416,
    raOptionTarget: 442,
    nonRaOptions: 52,
    nonRaOptionTarget: 78,
    buyQty: 710000,
    coreSplit: 60,
    fashionSplit: 40,
    fixtureUtilization: 90,
    ftfAdoption: 48,
    storesCovered: 450,
    totalStores: 450,
    status: "Ongoing",
    isLocked: false,
    bmCount: 4,
    families: [
      {
        id: "fam-ww-top-casual",
        code: "WW-TOP-CAS",
        name: "Casual Tops",
        segmentId: "seg-ww-casual-tops",
        options: 200,
        buyQty: 280000,
        fashionPct: 45,
        ftfPct: 50,
        stores: 450,
        status: "Ongoing",
        bmCount: 3,
        bmAllocations: [
          {
            buyingModelId: "BM-1",
            code: "BM-1",
            shortLabel: "In-House",
            sharePct: 45,
            optionTarget: 90,
            optionsBuilt: 88,
            milestoneStatus: "on_track"
          },
          {
            buyingModelId: "BM-2",
            code: "BM-2",
            shortLabel: "ODM",
            sharePct: 35,
            optionTarget: 70,
            optionsBuilt: 65,
            milestoneStatus: "on_track"
          },
          {
            buyingModelId: "BM-4",
            code: "BM-4",
            shortLabel: "Ext. Brand",
            sharePct: 20,
            optionTarget: 40,
            optionsBuilt: 38,
            milestoneStatus: "complete"
          }
        ],
        raPlanPct: 100,
        vendorPct: 0
      },
      {
        id: "fam-ww-top-formal",
        code: "WW-TOP-FOR",
        name: "Formal Blouses",
        segmentId: "seg-ww-casual-tops",
        options: 120,
        buyQty: 150000,
        fashionPct: 30,
        ftfPct: 35,
        stores: 380,
        status: "Ongoing",
        bmCount: 2,
        bmAllocations: [
          {
            buyingModelId: "BM-1",
            code: "BM-1",
            shortLabel: "In-House",
            sharePct: 65,
            optionTarget: 78,
            optionsBuilt: 75,
            milestoneStatus: "on_track"
          },
          {
            buyingModelId: "BM-2",
            code: "BM-2",
            shortLabel: "ODM",
            sharePct: 35,
            optionTarget: 42,
            optionsBuilt: 40,
            milestoneStatus: "on_track"
          }
        ],
        raPlanPct: 100,
        vendorPct: 0
      },
      {
        id: "fam-ww-top-active",
        code: "WW-TOP-ACT",
        name: "Activewear",
        segmentId: "seg-ww-casual-tops",
        options: 130,
        buyQty: 180000,
        fashionPct: 55,
        ftfPct: 60,
        stores: 420,
        status: "New",
        alertMessage: "BM-1 Design Lock overdue",
        bmCount: 3,
        bmAllocations: [
          {
            buyingModelId: "BM-1",
            code: "BM-1",
            shortLabel: "In-House",
            sharePct: 35,
            optionTarget: 46,
            optionsBuilt: 40,
            milestoneStatus: "at_risk"
          },
          {
            buyingModelId: "BM-2",
            code: "BM-2",
            shortLabel: "ODM",
            sharePct: 30,
            optionTarget: 39,
            optionsBuilt: 35,
            milestoneStatus: "on_track"
          },
          {
            buyingModelId: "BM-4",
            code: "BM-4",
            shortLabel: "Ext. Brand",
            sharePct: 35,
            optionTarget: 45,
            optionsBuilt: 43,
            milestoneStatus: "complete"
          }
        ],
        raPlanPct: 100,
        vendorPct: 0
      },
      {
        id: "fam-ww-top-youth",
        code: "WW-TOP-YTH",
        name: "Youth Fashion",
        segmentId: "seg-ww-casual-tops",
        options: 70,
        buyQty: 100000,
        fashionPct: 70,
        ftfPct: 65,
        stores: 280,
        status: "New",
        alertMessage: "BM-6 consignment not signed",
        bmCount: 4,
        bmAllocations: [
          {
            buyingModelId: "BM-1",
            code: "BM-1",
            shortLabel: "In-House",
            sharePct: 30,
            optionTarget: 21,
            optionsBuilt: 20,
            milestoneStatus: "on_track"
          },
          {
            buyingModelId: "BM-2",
            code: "BM-2",
            shortLabel: "ODM",
            sharePct: 25,
            optionTarget: 18,
            optionsBuilt: 15,
            milestoneStatus: "on_track"
          },
          {
            buyingModelId: "BM-4",
            code: "BM-4",
            shortLabel: "Ext. Brand",
            sharePct: 25,
            optionTarget: 17,
            optionsBuilt: 16,
            milestoneStatus: "complete"
          },
          {
            buyingModelId: "BM-6",
            code: "BM-6",
            shortLabel: "Consignment",
            sharePct: 20,
            optionTarget: 14,
            optionsBuilt: 0,
            milestoneStatus: "at_risk"
          }
        ],
        raPlanPct: 80,
        vendorPct: 20
      }
    ]
  },
  {
    id: "seg-kw-boys-casual",
    code: "KW-BOY",
    name: "Kids: Boys Casual",
    abbreviation: "KW",
    category: "Kidswear",
    season: "SS26",
    phase: "Costing",
    totalOptions: 320,
    optionsLocked: 0,
    raOptions: 256,
    raOptionTarget: 272,
    nonRaOptions: 32,
    nonRaOptionTarget: 48,
    buyQty: 470000,
    coreSplit: 70,
    fashionSplit: 30,
    fixtureUtilization: 85,
    ftfAdoption: 35,
    storesCovered: 450,
    totalStores: 450,
    status: "New",
    isLocked: false,
    alertMessage: "Costing delayed 2 weeks",
    bmCount: 3,
    families: [
      {
        id: "fam-kw-boy-casual",
        code: "KW-BOY-CAS",
        name: "Boys Casual",
        segmentId: "seg-kw-boys-casual",
        options: 150,
        buyQty: 200000,
        fashionPct: 35,
        ftfPct: 40,
        stores: 400,
        status: "Ongoing",
        bmCount: 2,
        bmAllocations: [
          {
            buyingModelId: "BM-1",
            code: "BM-1",
            shortLabel: "In-House",
            sharePct: 55,
            optionTarget: 83,
            optionsBuilt: 80,
            milestoneStatus: "on_track"
          },
          {
            buyingModelId: "BM-2",
            code: "BM-2",
            shortLabel: "ODM",
            sharePct: 45,
            optionTarget: 67,
            optionsBuilt: 65,
            milestoneStatus: "on_track"
          }
        ],
        raPlanPct: 100,
        vendorPct: 0
      },
      {
        id: "fam-kw-boy-school",
        code: "KW-BOY-SCH",
        name: "School Wear",
        segmentId: "seg-kw-boys-casual",
        options: 100,
        buyQty: 180000,
        fashionPct: 20,
        ftfPct: 25,
        stores: 450,
        status: "Ongoing",
        bmCount: 2,
        bmAllocations: [
          {
            buyingModelId: "BM-1",
            code: "BM-1",
            shortLabel: "In-House",
            sharePct: 70,
            optionTarget: 70,
            optionsBuilt: 68,
            milestoneStatus: "on_track"
          },
          {
            buyingModelId: "BM-2",
            code: "BM-2",
            shortLabel: "ODM",
            sharePct: 30,
            optionTarget: 30,
            optionsBuilt: 28,
            milestoneStatus: "on_track"
          }
        ],
        raPlanPct: 100,
        vendorPct: 0
      },
      {
        id: "fam-kw-boy-youth",
        code: "KW-BOY-YTH",
        name: "Youth Boys",
        segmentId: "seg-kw-boys-casual",
        options: 70,
        buyQty: 90000,
        fashionPct: 45,
        ftfPct: 50,
        stores: 320,
        status: "New",
        alertMessage: "BM-2 vendor submissions 60% received",
        bmCount: 3,
        bmAllocations: [
          {
            buyingModelId: "BM-1",
            code: "BM-1",
            shortLabel: "In-House",
            sharePct: 40,
            optionTarget: 28,
            optionsBuilt: 26,
            milestoneStatus: "on_track"
          },
          {
            buyingModelId: "BM-2",
            code: "BM-2",
            shortLabel: "ODM",
            sharePct: 40,
            optionTarget: 28,
            optionsBuilt: 17,
            milestoneStatus: "at_risk"
          },
          {
            buyingModelId: "BM-6",
            code: "BM-6",
            shortLabel: "Consignment",
            sharePct: 20,
            optionTarget: 14,
            optionsBuilt: 0,
            milestoneStatus: "not_due"
          }
        ],
        raPlanPct: 80,
        vendorPct: 20
      }
    ]
  },
  {
    id: "seg-mw-casual-shirts",
    code: "FW-MEN",
    name: "Men Western: Casual Shirts",
    abbreviation: "MW",
    category: "Menswear",
    season: "SS26",
    phase: "Sourcing",
    totalOptions: 280,
    optionsLocked: 280,
    raOptions: 168,
    raOptionTarget: 196,
    nonRaOptions: 56,
    nonRaOptionTarget: 84,
    buyQty: 360000,
    coreSplit: 75,
    fashionSplit: 25,
    fixtureUtilization: 80,
    ftfAdoption: 20,
    storesCovered: 420,
    totalStores: 450,
    status: "Locked",
    isLocked: true,
    bmCount: 3,
    families: [
      {
        id: "fam-fw-men-formal",
        code: "FW-MEN-FOR",
        name: "Formal Shoes",
        segmentId: "seg-mw-casual-shirts",
        options: 120,
        buyQty: 150000,
        fashionPct: 20,
        ftfPct: 15,
        stores: 380,
        status: "Ongoing",
        bmCount: 3,
        bmAllocations: [
          {
            buyingModelId: "BM-3",
            code: "BM-3",
            shortLabel: "Vendor Nom.",
            sharePct: 40,
            optionTarget: 48,
            optionsBuilt: 45,
            milestoneStatus: "on_track"
          },
          {
            buyingModelId: "BM-4",
            code: "BM-4",
            shortLabel: "Ext. Brand",
            sharePct: 40,
            optionTarget: 48,
            optionsBuilt: 46,
            milestoneStatus: "complete"
          },
          {
            buyingModelId: "BM-6",
            code: "BM-6",
            shortLabel: "Consignment",
            sharePct: 20,
            optionTarget: 24,
            optionsBuilt: 0,
            milestoneStatus: "not_due"
          }
        ],
        raPlanPct: 80,
        vendorPct: 20
      },
      {
        id: "fam-fw-men-casual",
        code: "FW-MEN-CAS",
        name: "Casual Footwear",
        segmentId: "seg-mw-casual-shirts",
        options: 100,
        buyQty: 130000,
        fashionPct: 30,
        ftfPct: 25,
        stores: 420,
        status: "Ongoing",
        bmCount: 3,
        bmAllocations: [
          {
            buyingModelId: "BM-3",
            code: "BM-3",
            shortLabel: "Vendor Nom.",
            sharePct: 35,
            optionTarget: 35,
            optionsBuilt: 33,
            milestoneStatus: "on_track"
          },
          {
            buyingModelId: "BM-4",
            code: "BM-4",
            shortLabel: "Ext. Brand",
            sharePct: 45,
            optionTarget: 45,
            optionsBuilt: 43,
            milestoneStatus: "complete"
          },
          {
            buyingModelId: "BM-6",
            code: "BM-6",
            shortLabel: "Consignment",
            sharePct: 20,
            optionTarget: 20,
            optionsBuilt: 0,
            milestoneStatus: "not_due"
          }
        ],
        raPlanPct: 80,
        vendorPct: 20
      },
      {
        id: "fam-fw-men-sports",
        code: "FW-MEN-SPT",
        name: "Sports Footwear",
        segmentId: "seg-mw-casual-shirts",
        options: 60,
        buyQty: 80000,
        fashionPct: 35,
        ftfPct: 30,
        stores: 350,
        status: "New",
        alertMessage: "External brand concentration warning",
        bmCount: 2,
        bmAllocations: [
          {
            buyingModelId: "BM-4",
            code: "BM-4",
            shortLabel: "Ext. Brand",
            sharePct: 70,
            optionTarget: 42,
            optionsBuilt: 40,
            milestoneStatus: "complete"
          },
          {
            buyingModelId: "BM-6",
            code: "BM-6",
            shortLabel: "Consignment",
            sharePct: 30,
            optionTarget: 18,
            optionsBuilt: 0,
            milestoneStatus: "not_due"
          }
        ],
        raPlanPct: 70,
        vendorPct: 30
      }
    ]
  }
];

export const mockCategoryProfiles: CategoryExecutionProfile[] = [
  {
    categoryId: "cat-mw-shirts",
    categoryName: "Men Western: Formal Shirts",
    season: "SS26",
    totalOtb: 216000000,
    totalOptions: 480,
    bmAllocations: [
      {
        buyingModelId: "BM-1",
        code: "BM-1",
        shortLabel: "In-House",
        sharePct: 50,
        optionTarget: 240,
        optionsBuilt: 230,
        milestoneStatus: "on_track"
      },
      {
        buyingModelId: "BM-2",
        code: "BM-2",
        shortLabel: "ODM",
        sharePct: 25,
        optionTarget: 120,
        optionsBuilt: 110,
        milestoneStatus: "on_track"
      },
      {
        buyingModelId: "BM-4",
        code: "BM-4",
        shortLabel: "Ext. Brand",
        sharePct: 15,
        optionTarget: 72,
        optionsBuilt: 68,
        milestoneStatus: "complete"
      },
      {
        buyingModelId: "BM-6",
        code: "BM-6",
        shortLabel: "Consignment",
        sharePct: 10,
        optionTarget: 48,
        optionsBuilt: 0,
        milestoneStatus: "not_due"
      }
    ],
    channelSplit: {
      offline: 65,
      online: 25,
      marketplace: 5,
      social: 5
    },
    bmChannelMatrix: {
      "BM-1": { offline: 35, online: 12, marketplace: 2, social: 1 },
      "BM-2": { offline: 12, online: 9, marketplace: 2, social: 2 },
      "BM-3": { offline: 0, online: 0, marketplace: 0, social: 0 },
      "BM-4": { offline: 10, online: 4, marketplace: 1, social: 0 },
      "BM-5": { offline: 0, online: 0, marketplace: 0, social: 0 },
      "BM-6": { offline: 8, online: 0, marketplace: 0, social: 2 },
      "BM-7": { offline: 0, online: 0, marketplace: 0, social: 0 },
      "BM-8": { offline: 0, online: 0, marketplace: 0, social: 0 }
    },
    sourcingEngineSplit: {
      scaleMargin: 55,
      fastResponse: 40,
      testRepeat: 5
    }
  },
  {
    categoryId: "cat-ww-tops",
    categoryName: "Women Western: Casual Tops",
    season: "SS26",
    totalOtb: 234000000,
    totalOptions: 520,
    bmAllocations: [
      {
        buyingModelId: "BM-1",
        code: "BM-1",
        shortLabel: "In-House",
        sharePct: 45,
        optionTarget: 234,
        optionsBuilt: 223,
        milestoneStatus: "on_track"
      },
      {
        buyingModelId: "BM-2",
        code: "BM-2",
        shortLabel: "ODM",
        sharePct: 30,
        optionTarget: 156,
        optionsBuilt: 145,
        milestoneStatus: "on_track"
      },
      {
        buyingModelId: "BM-4",
        code: "BM-4",
        shortLabel: "Ext. Brand",
        sharePct: 20,
        optionTarget: 104,
        optionsBuilt: 100,
        milestoneStatus: "complete"
      },
      {
        buyingModelId: "BM-6",
        code: "BM-6",
        shortLabel: "Consignment",
        sharePct: 5,
        optionTarget: 26,
        optionsBuilt: 0,
        milestoneStatus: "not_due"
      }
    ],
    channelSplit: {
      offline: 60,
      online: 30,
      marketplace: 7,
      social: 3
    },
    bmChannelMatrix: {
      "BM-1": { offline: 30, online: 13, marketplace: 1.5, social: 0.5 },
      "BM-2": { offline: 15, online: 12, marketplace: 2, social: 1 },
      "BM-3": { offline: 0, online: 0, marketplace: 0, social: 0 },
      "BM-4": { offline: 12, online: 5, marketplace: 2.5, social: 0.5 },
      "BM-5": { offline: 0, online: 0, marketplace: 0, social: 0 },
      "BM-6": { offline: 3, online: 0, marketplace: 1, social: 1 },
      "BM-7": { offline: 0, online: 0, marketplace: 0, social: 0 },
      "BM-8": { offline: 0, online: 0, marketplace: 0, social: 0 }
    },
    sourcingEngineSplit: {
      scaleMargin: 50,
      fastResponse: 45,
      testRepeat: 5
    }
  }
];


export const mockSystemRecommendations: SystemRecommendation[] = [
  {
    id: "rec-1",
    priority: "Critical",
    type: "lock",
    action: "Increase Fashion Split in Kidswear",
    description: "FTF signals strong demand for fashion-forward kids styles. Current 30% below target.",
    segments: ["KW"],
    metric: "30% → 35%",
    impact: "+₹2.1 Cr revenue",
    linkedKpi: "Core/Fashion",
    rationale: "FTF analysis shows 65% year-over-year growth in fashion-forward kidswear, particularly in graphic tees and character merchandise. Current allocation underindexes this trend by 5 percentage points.",
    segmentId: "seg-kw-boys-casual",
    actionButton: {
      label: "Go to Kidswear",
      link: "/ra/segment/seg-kw-boys"
    }
  },
  {
    id: "rec-2",
    priority: "Critical",
    type: "bm_milestone",
    action: "Lock Kidswear Range Immediately",
    description: "KW segment unlocked with only 12 days until N-120 deadline.",
    segments: ["KW"],
    metric: "0 → 320 options",
    impact: "₹144M at risk",
    linkedKpi: "Range Lock",
    rationale: "Kidswear segment has zero locked options with production deadline in 12 days. This risks missing the Spring launch window for 320 SKUs affecting 450 stores.",
    segmentId: "seg-kw-boys-casual",
    actionButton: {
      label: "Go to Kidswear",
      link: "/ra/segment/seg-kw-boys"
    }
  },
  {
    id: "rec-3",
    priority: "Urgent",
    type: "inventory",
    action: "Review ignored FTF recommendations",
    description: "22% of FTF trend signals being ignored across network.",
    segments: ["MC", "WW"],
    metric: "34% adoption",
    impact: "-5% forecast accuracy",
    linkedKpi: "FTF Adoption",
    rationale: "Historical analysis shows ignoring >20% of FTF signals correlates with 5-8% lower sell-through rates. Current ignored rate of 22% puts ₹18 Cr of inventory at risk.",
    actionButton: {
      label: "View FTF Analysis"
    }
  },
  {
    id: "rec-4",
    priority: "Medium",
    type: "allocation",
    action: "Optimize fixture density in Men's Footwear",
    description: "Fixture utilization at 80% indicates opportunity to add 40 more options.",
    segments: ["MW"],
    metric: "80% → 95%",
    impact: "+₹3.2 Cr opportunity",
    linkedKpi: "Fixture Util",
    rationale: "Men's Footwear has 20% unutilized fixture capacity. Adding 40 high-velocity options could generate additional ₹3.2 Cr with existing infrastructure.",
    segmentId: "seg-mw-casual-shirts",
    actionButton: {
      label: "Go to Footwear"
    }
  },
  {
    id: "rec-5",
    priority: "Opportunity",
    type: "performance",
    action: "Accelerate consignment agreements for Spring",
    description: "BM-6 allocation not materializing — agreements unsigned.",
    segments: ["MC", "WW", "KW"],
    metric: "0 → 107 options",
    impact: "Zero OTB consumption",
    linkedKpi: "Range Lock",
    rationale: "107 consignment options allocated but no agreements signed. These require no OTB and could provide 15% margin upside if executed within 5 days.",
    actionButton: {
      label: "Review Agreements"
    }
  },
  {
    id: "rec-6",
    priority: "Medium",
    type: "ftf",
    action: "Increase oversized silhouettes in Womenswear",
    description: "FTF shows 45% YoY growth in oversized tops, currently under-indexed.",
    segments: ["WW"],
    metric: "+15 options",
    impact: "+₹1.8 Cr",
    linkedKpi: "FTF Adoption",
    segmentId: "seg-ww-casual-tops",
    familyId: "fam-ww-top-casual",
    actionButton: {
      label: "Go to Women's Tops"
    }
  },
  {
    id: "rec-7",
    priority: "Opportunity",
    type: "performance",
    action: "Consider test batch for sustainable fabrics",
    description: "FTF signals 75% growth in sustainable fabric demand.",
    segments: ["MC", "WW"],
    metric: "0 → 20 options",
    impact: "Test & learn",
    linkedKpi: "FTF Adoption",
    rationale: "Consumer sentiment analysis shows strong preference for sustainable options in premium segments. Test batch of 20 options recommended for validation.",
    actionButton: {
      label: "View Sustainability Report"
    }
  }
];

export function getSegmentById(id: string): RASegment | undefined {
  return mockSegments.find(s => s.id === id);
}

export function getFamilyById(familyId: string): RAFamily | undefined {
  for (const segment of mockSegments) {
    const family = segment.families.find(f => f.id === familyId);
    if (family) return family;
  }
  return undefined;
}

export function getSegmentRecommendations(segmentId?: string): SystemRecommendation[] {
  if (!segmentId) return mockSystemRecommendations;
  return mockSystemRecommendations.filter(r => r.segmentId === segmentId);
}

// Mock Hit (Season) data
export const mockHits: Hit[] = [
  {
    id: "hit-6-2026",
    name: "Hit 6 2026",
    season: "Spring/Summer",
    year: 2026,
    startDate: "2026-06-01",
    endDate: "2026-08-31",
    n120Date: "2026-03-08",
    daysUntilN120: 12,
    isActive: true
  },
  {
    id: "hit-7-2026",
    name: "Hit 7 2026",
    season: "Monsoon",
    year: 2026,
    startDate: "2026-07-01",
    endDate: "2026-09-30",
    n120Date: "2026-04-08",
    daysUntilN120: 43,
    isActive: false
  },
  {
    id: "hit-8-2026",
    name: "Hit 8 2026",
    season: "Autumn",
    year: 2026,
    startDate: "2026-08-01",
    endDate: "2026-10-31",
    n120Date: "2026-05-08",
    daysUntilN120: 73,
    isActive: false
  }
];

export function getActiveHit(): Hit {
  const activeHit = mockHits.find(h => h.isActive);
  if (activeHit) return activeHit;
  // Always return first hit as fallback
  return mockHits[0]!;
}

// Store Range Data
export interface StoreRangeData {
  id: string;
  storeCode: string;
  storeName: string;
  storeGrade: "A0" | "A1" | "A2" | "A3" | "B" | "C";
  state: string;
  city: string;
  storeRank: number;
  totalOptions: number;
  aopAchievement: number;
  otbFit: number;
  fixtureUtilization: number;
  segmentCount: number;
  fixtureCount: number;
  isTopPerformer: boolean;
}

export const mockStoreRangeData: StoreRangeData[] = [
  {
    id: "store-001",
    storeCode: "BLR-001",
    storeName: "Forum Mall Koramangala",
    storeGrade: "A0",
    state: "Karnataka",
    city: "Bangalore",
    storeRank: 1,
    totalOptions: 2374,
    aopAchievement: 97,
    otbFit: 100,
    fixtureUtilization: 92,
    segmentCount: 7,
    fixtureCount: 187,
    isTopPerformer: true
  },
  {
    id: "store-002",
    storeCode: "MUM-001",
    storeName: "Infinity Mall Malad",
    storeGrade: "A0",
    state: "Maharashtra",
    city: "Mumbai",
    storeRank: 2,
    totalOptions: 2250,
    aopAchievement: 94,
    otbFit: 98,
    fixtureUtilization: 89,
    segmentCount: 7,
    fixtureCount: 182,
    isTopPerformer: true
  },
  {
    id: "store-003",
    storeCode: "DEL-001",
    storeName: "Select City Walk",
    storeGrade: "A0",
    state: "Delhi",
    city: "New Delhi",
    storeRank: 3,
    totalOptions: 2180,
    aopAchievement: 92,
    otbFit: 95,
    fixtureUtilization: 88,
    segmentCount: 7,
    fixtureCount: 175,
    isTopPerformer: true
  },
  {
    id: "store-004",
    storeCode: "CHE-001",
    storeName: "Express Avenue",
    storeGrade: "A1",
    state: "Tamil Nadu",
    city: "Chennai",
    storeRank: 12,
    totalOptions: 1850,
    aopAchievement: 85,
    otbFit: 88,
    fixtureUtilization: 82,
    segmentCount: 6,
    fixtureCount: 145,
    isTopPerformer: false
  },
  {
    id: "store-005",
    storeCode: "PUN-001",
    storeName: "Phoenix Marketcity",
    storeGrade: "A1",
    state: "Maharashtra",
    city: "Pune",
    storeRank: 15,
    totalOptions: 1680,
    aopAchievement: 82,
    otbFit: 85,
    fixtureUtilization: 78,
    segmentCount: 6,
    fixtureCount: 132,
    isTopPerformer: false
  },
  {
    id: "store-006",
    storeCode: "HYD-001",
    storeName: "Inorbit Mall",
    storeGrade: "A1",
    state: "Telangana",
    city: "Hyderabad",
    storeRank: 18,
    totalOptions: 1620,
    aopAchievement: 80,
    otbFit: 82,
    fixtureUtilization: 75,
    segmentCount: 6,
    fixtureCount: 128,
    isTopPerformer: false
  },
  {
    id: "store-007",
    storeCode: "KOL-001",
    storeName: "South City Mall",
    storeGrade: "A2",
    state: "West Bengal",
    city: "Kolkata",
    storeRank: 25,
    totalOptions: 1450,
    aopAchievement: 75,
    otbFit: 78,
    fixtureUtilization: 70,
    segmentCount: 5,
    fixtureCount: 110,
    isTopPerformer: false
  },
  {
    id: "store-008",
    storeCode: "AMD-001",
    storeName: "Ahmedabad One Mall",
    storeGrade: "A2",
    state: "Gujarat",
    city: "Ahmedabad",
    storeRank: 32,
    totalOptions: 1320,
    aopAchievement: 70,
    otbFit: 72,
    fixtureUtilization: 68,
    segmentCount: 5,
    fixtureCount: 98,
    isTopPerformer: false
  },
  {
    id: "store-009",
    storeCode: "JAI-001",
    storeName: "World Trade Park",
    storeGrade: "A3",
    state: "Rajasthan",
    city: "Jaipur",
    storeRank: 45,
    totalOptions: 1150,
    aopAchievement: 65,
    otbFit: 68,
    fixtureUtilization: 62,
    segmentCount: 4,
    fixtureCount: 85,
    isTopPerformer: false
  },
  {
    id: "store-010",
    storeCode: "LUC-001",
    storeName: "Phoenix United Mall",
    storeGrade: "A3",
    state: "Uttar Pradesh",
    city: "Lucknow",
    storeRank: 58,
    totalOptions: 980,
    aopAchievement: 60,
    otbFit: 62,
    fixtureUtilization: 58,
    segmentCount: 4,
    fixtureCount: 72,
    isTopPerformer: false
  }
];

// Mock brick data - attribute-level variants with BM assignments
const mockBricks: RABrick[] = [
  // Men's Wear - Formal Shirts - Premium Range bricks
  {
    id: "brick-mw-sh-prem-1",
    familyId: "fam-mw-sh-formal",
    name: "Premium Cotton - Slim Fit Solid",
    silhouette: "Slim Fit",
    fabric: "100% Cotton",
    print: "Solid",
    priceRange: {
      hist: "₹2,499",
      sys: "₹2,599",
      buyer: "₹2,699"
    },
    optionCount: {
      hist: 8,
      sys: 10,
      buyer: 12
    },
    totalQty: {
      hist: 12000,
      sys: 15000,
      buyer: 18000
    },
    source: "Past Sales",
    buyingModelId: "BM-1",
    isBmEditable: true,
    isPlaceholder: false
  },
  {
    id: "brick-mw-sh-prem-2",
    familyId: "fam-mw-sh-formal",
    name: "Premium Cotton - Regular Fit Stripes",
    silhouette: "Regular Fit",
    fabric: "100% Cotton",
    print: "Stripes",
    priceRange: {
      hist: "₹2,299",
      sys: "₹2,399",
      buyer: "₹2,499"
    },
    optionCount: {
      hist: 6,
      sys: 8,
      buyer: 10
    },
    totalQty: {
      hist: 10000,
      sys: 12000,
      buyer: 15000
    },
    source: "Past Sales",
    buyingModelId: "BM-1",
    isBmEditable: true,
    isPlaceholder: false
  },
  {
    id: "brick-mw-sh-prem-3",
    familyId: "fam-mw-sh-formal",
    name: "Poly-Cotton Blend - Slim Fit Checks",
    silhouette: "Slim Fit",
    fabric: "65% Poly 35% Cotton",
    print: "Checks",
    priceRange: {
      hist: "₹1,799",
      sys: "₹1,899",
      buyer: "₹1,999"
    },
    optionCount: {
      hist: 10,
      sys: 12,
      buyer: 15
    },
    totalQty: {
      hist: 18000,
      sys: 20000,
      buyer: 25000
    },
    source: "Past Sales",
    buyingModelId: "BM-2",
    isBmEditable: true,
    isPlaceholder: false
  },
  {
    id: "brick-mw-sh-prem-4",
    familyId: "fam-mw-sh-formal",
    name: "Linen Blend - Relaxed Fit Solid",
    silhouette: "Relaxed Fit",
    fabric: "55% Linen 45% Cotton",
    print: "Solid",
    priceRange: {
      hist: "₹2,799",
      sys: "₹2,999",
      buyer: "₹3,199"
    },
    optionCount: {
      hist: 5,
      sys: 6,
      buyer: 8
    },
    totalQty: {
      hist: 6000,
      sys: 8000,
      buyer: 10000
    },
    source: "Past Sales",
    buyingModelId: "BM-2",
    isBmEditable: true,
    isPlaceholder: false
  },
  {
    id: "brick-mw-sh-prem-5",
    familyId: "fam-mw-sh-formal",
    name: "Oxford Weave - Regular Fit Textured",
    silhouette: "Regular Fit",
    fabric: "Oxford Cotton",
    print: "Textured",
    priceRange: {
      hist: "₹2,199",
      sys: "₹2,299",
      buyer: "₹2,399"
    },
    optionCount: {
      hist: 0,
      sys: 0,
      buyer: 8
    },
    totalQty: {
      hist: 0,
      sys: 0,
      buyer: 12000
    },
    source: "FTF",
    buyingModelId: null,
    isBmEditable: true,
    isPlaceholder: false
  },
  // Placeholder rows for BM-6 (Consignment)
  {
    id: "brick-mw-sh-prem-6",
    familyId: "fam-mw-sh-formal",
    name: "Consignment Slots (BM-6)",
    silhouette: "TBD",
    fabric: "TBD",
    print: "TBD",
    priceRange: {
      hist: "—",
      sys: "—",
      buyer: "—"
    },
    optionCount: {
      hist: 0,
      sys: 0,
      buyer: 30
    },
    totalQty: {
      hist: 0,
      sys: 0,
      buyer: 0
    },
    source: "Past Sales & FTF",
    buyingModelId: "BM-6",
    isBmEditable: false,
    isPlaceholder: true
  },
  // Women's Wear - Casual Tops bricks
  {
    id: "brick-ww-top-cas-1",
    familyId: "fam-ww-top-casual",
    name: "Cotton Jersey - Crop Top Solid",
    silhouette: "Crop Top",
    fabric: "Cotton Jersey",
    print: "Solid",
    priceRange: {
      hist: "₹999",
      sys: "₹1,099",
      buyer: "₹1,199"
    },
    optionCount: {
      hist: 15,
      sys: 18,
      buyer: 20
    },
    totalQty: {
      hist: 25000,
      sys: 30000,
      buyer: 35000
    },
    source: "Past Sales",
    buyingModelId: "BM-1",
    isBmEditable: true,
    isPlaceholder: false
  },
  {
    id: "brick-ww-top-cas-2",
    familyId: "fam-ww-top-casual",
    name: "Modal Blend - Oversized Graphic",
    silhouette: "Oversized",
    fabric: "Modal Blend",
    print: "Graphic",
    priceRange: {
      hist: "₹1,299",
      sys: "₹1,399",
      buyer: "₹1,499"
    },
    optionCount: {
      hist: 12,
      sys: 15,
      buyer: 18
    },
    totalQty: {
      hist: 20000,
      sys: 25000,
      buyer: 30000
    },
    source: "Past Sales",
    buyingModelId: "BM-1",
    isBmEditable: true,
    isPlaceholder: false
  },
  {
    id: "brick-ww-top-cas-3",
    familyId: "fam-ww-top-casual",
    name: "Polyester - Tank Top Stripes",
    silhouette: "Tank Top",
    fabric: "Polyester",
    print: "Stripes",
    priceRange: {
      hist: "₹799",
      sys: "₹899",
      buyer: "₹999"
    },
    optionCount: {
      hist: 20,
      sys: 22,
      buyer: 25
    },
    totalQty: {
      hist: 35000,
      sys: 40000,
      buyer: 45000
    },
    source: "Past Sales",
    buyingModelId: "BM-2",
    isBmEditable: true,
    isPlaceholder: false
  },
  {
    id: "brick-ww-top-cas-4",
    familyId: "fam-ww-top-casual",
    name: "Rayon - Regular Fit Floral",
    silhouette: "Regular Fit",
    fabric: "Rayon",
    print: "Floral",
    priceRange: {
      hist: "₹1,099",
      sys: "₹1,199",
      buyer: "₹1,299"
    },
    optionCount: {
      hist: 10,
      sys: 12,
      buyer: 15
    },
    totalQty: {
      hist: 18000,
      sys: 20000,
      buyer: 25000
    },
    source: "Past Sales",
    buyingModelId: "BM-4",
    isBmEditable: true,
    isPlaceholder: false
  },
  // Smart Casuals bricks
  {
    id: "brick-mw-sh-smart-1",
    familyId: "fam-mw-sh-smart",
    name: "Knit Polo - Slim Fit Solid",
    silhouette: "Slim Fit",
    fabric: "Cotton Knit",
    print: "Solid",
    priceRange: {
      hist: "₹1,499",
      sys: "₹1,599",
      buyer: "₹1,699"
    },
    optionCount: {
      hist: 15,
      sys: 18,
      buyer: 20
    },
    totalQty: {
      hist: 22000,
      sys: 25000,
      buyer: 30000
    },
    source: "Past Sales",
    buyingModelId: "BM-1",
    isBmEditable: true,
    isPlaceholder: false
  },
  {
    id: "brick-mw-sh-smart-2",
    familyId: "fam-mw-sh-smart",
    name: "Chambray - Regular Fit Textured",
    silhouette: "Regular Fit",
    fabric: "Chambray",
    print: "Textured",
    priceRange: {
      hist: "₹1,699",
      sys: "₹1,799",
      buyer: "₹1,899"
    },
    optionCount: {
      hist: 12,
      sys: 15,
      buyer: 18
    },
    totalQty: {
      hist: 18000,
      sys: 22000,
      buyer: 26000
    },
    source: "Past Sales",
    buyingModelId: "BM-1",
    isBmEditable: true,
    isPlaceholder: false
  },
  {
    id: "brick-mw-sh-smart-3",
    familyId: "fam-mw-sh-smart",
    name: "Terry Rayon - Relaxed Fit Pattern",
    silhouette: "Relaxed Fit",
    fabric: "Terry Rayon",
    print: "Pattern",
    priceRange: {
      hist: "₹1,899",
      sys: "₹1,999",
      buyer: "₹2,099"
    },
    optionCount: {
      hist: 8,
      sys: 10,
      buyer: 12
    },
    totalQty: {
      hist: 12000,
      sys: 15000,
      buyer: 18000
    },
    source: "Past Sales & FTF",
    buyingModelId: "BM-4",
    isBmEditable: false,
    isPlaceholder: false
  },
  {
    id: "brick-mw-sh-smart-4",
    familyId: "fam-mw-sh-smart",
    name: "Linen - Cuban Collar Prints",
    silhouette: "Cuban Collar",
    fabric: "Linen",
    print: "Prints",
    priceRange: {
      hist: "₹2,299",
      sys: "₹2,399",
      buyer: "₹2,499"
    },
    optionCount: {
      hist: 6,
      sys: 8,
      buyer: 10
    },
    totalQty: {
      hist: 8000,
      sys: 10000,
      buyer: 12000
    },
    source: "Past Sales & FTF",
    buyingModelId: "BM-4",
    isBmEditable: false,
    isPlaceholder: false
  }
];

export function getBricksByFamilyId(familyId: string): RABrick[] {
  return mockBricks.filter(brick => brick.familyId === familyId);
}

// Mock Style-level BM metadata for detailed views
export const mockStyleBmMetadata: StyleBmMetadata[] = [
  // Men's Formal Shirts
  {
    styleId: "STY-MW-FOR-001",
    styleName: "Classic White Oxford",
    buyingModel: "BM-1",
    channelDestination: ["omnichannel"],
    channelExclusivity: false,
    inventoryOwnership: "retailer",
    marginProfile: 68,
    leadTime: 90,
    returnToVendor: false
  },
  {
    styleId: "STY-MW-FOR-002",
    styleName: "Blue Checkered Formal",
    buyingModel: "BM-1",
    channelDestination: ["store-exclusive"],
    channelExclusivity: true,
    inventoryOwnership: "retailer",
    marginProfile: 65,
    leadTime: 90,
    returnToVendor: false
  },
  {
    styleId: "STY-MW-FOR-003",
    styleName: "Premium Silk Blend",
    buyingModel: "BM-2",
    channelDestination: ["platform-ajio", "online-exclusive"],
    channelExclusivity: true,
    inventoryOwnership: "retailer",
    marginProfile: 58,
    leadTime: 60,
    returnToVendor: false
  },
  // Men's Casual Shirts
  {
    styleId: "STY-MW-CAS-001",
    styleName: "Printed Beach Shirt",
    buyingModel: "BM-1",
    channelDestination: ["omnichannel"],
    channelExclusivity: false,
    inventoryOwnership: "retailer",
    marginProfile: 66,
    leadTime: 90,
    returnToVendor: false
  },
  {
    styleId: "STY-MW-CAS-002",
    styleName: "Denim Western Shirt",
    buyingModel: "BM-2",
    channelDestination: ["store-exclusive"],
    channelExclusivity: true,
    inventoryOwnership: "retailer",
    marginProfile: 60,
    leadTime: 75,
    returnToVendor: false
  },
  {
    styleId: "STY-MW-CAS-003",
    styleName: "Levi's Original",
    buyingModel: "BM-6",
    channelDestination: ["omnichannel"],
    channelExclusivity: false,
    inventoryOwnership: "vendor",
    marginProfile: 32,
    leadTime: 15,
    returnToVendor: true
  },
  // Women's Casual Tops
  {
    styleId: "STY-WW-CAS-001",
    styleName: "Floral Print Blouse",
    buyingModel: "BM-1",
    channelDestination: ["omnichannel"],
    channelExclusivity: false,
    inventoryOwnership: "retailer",
    marginProfile: 70,
    leadTime: 90,
    returnToVendor: false
  },
  {
    styleId: "STY-WW-CAS-002",
    styleName: "Basic Cotton Tee",
    buyingModel: "BM-2",
    channelDestination: ["platform-trends"],
    channelExclusivity: true,
    inventoryOwnership: "retailer",
    marginProfile: 62,
    leadTime: 60,
    returnToVendor: false
  },
  {
    styleId: "STY-WW-CAS-003",
    styleName: "Zara Originals",
    buyingModel: "BM-4",
    channelDestination: ["store-exclusive"],
    channelExclusivity: true,
    inventoryOwnership: "retailer",
    marginProfile: 45,
    leadTime: 30,
    returnToVendor: false
  },
  // Kids Wear
  {
    styleId: "STY-KW-BOY-001",
    styleName: "Superhero Print Tee",
    buyingModel: "BM-1",
    channelDestination: ["omnichannel"],
    channelExclusivity: false,
    inventoryOwnership: "retailer",
    marginProfile: 72,
    leadTime: 90,
    returnToVendor: false
  },
  {
    styleId: "STY-KW-BOY-002",
    styleName: "School Uniform Set",
    buyingModel: "BM-3",
    channelDestination: ["store-exclusive"],
    channelExclusivity: true,
    inventoryOwnership: "retailer",
    marginProfile: 58,
    leadTime: 45,
    returnToVendor: false
  },
  {
    styleId: "STY-KW-GRL-001",
    styleName: "Disney Princess Dress",
    buyingModel: "BM-5",
    channelDestination: ["omnichannel"],
    channelExclusivity: false,
    inventoryOwnership: "retailer",
    marginProfile: 60,
    leadTime: 120,
    returnToVendor: false
  }
];

// SIS Zone Planning Data
export interface SisZoneAllocation {
  buyingModel: BuyingModelId;
  space: number; // in sqft
  percentOfStore: number;
  productCount: number;
  requiresSisZone: boolean;
  zoneType: 'dedicated' | 'shared' | 'none';
}

export const mockSisZoneAllocations: SisZoneAllocation[] = [
  {
    buyingModel: "BM-1",
    space: 0,
    percentOfStore: 0,
    productCount: 280,
    requiresSisZone: false,
    zoneType: 'none'
  },
  {
    buyingModel: "BM-2",
    space: 0,
    percentOfStore: 0,
    productCount: 120,
    requiresSisZone: false,
    zoneType: 'none'
  },
  {
    buyingModel: "BM-3",
    space: 0,
    percentOfStore: 0,
    productCount: 80,
    requiresSisZone: false,
    zoneType: 'none'
  },
  {
    buyingModel: "BM-4",
    space: 0,
    percentOfStore: 0,
    productCount: 95,
    requiresSisZone: false,
    zoneType: 'none'
  },
  {
    buyingModel: "BM-5",
    space: 0,
    percentOfStore: 0,
    productCount: 45,
    requiresSisZone: false,
    zoneType: 'none'
  },
  {
    buyingModel: "BM-6",
    space: 200,
    percentOfStore: 8,
    productCount: 60,
    requiresSisZone: true,
    zoneType: 'shared'
  },
  {
    buyingModel: "BM-7",
    space: 450,
    percentOfStore: 18,
    productCount: 120,
    requiresSisZone: true,
    zoneType: 'dedicated'
  },
  {
    buyingModel: "BM-8",
    space: 100,
    percentOfStore: 4,
    productCount: 200,
    requiresSisZone: true,
    zoneType: 'shared'
  }
];