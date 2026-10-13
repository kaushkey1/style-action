// FnL Hierarchy Data Model
// Based on actual FnL hierarchy from Excel file

export interface FnLHierarchy {
  segments: {
    [segmentCode: string]: SegmentData;
  };
}

export interface SegmentData {
  segmentId: string;
  segmentName: string;
  families: Family[];
}

export interface Family {
  familyId: string;
  familyName: string;
  segmentId: string;
  bricks: Brick[];
  performance: RangeMetrics;
}

export interface Brick {
  brickId: string;
  brickName: string;
  familyId: string;
  performance: RangeMetrics;
  attributeVariants: BrickAttributeVariant[];
}

export interface BrickAttributeVariant {
  id: string;
  silhouette: string;
  fabricType: string;
  print: string;
  priceRange: string;
  optionCount: number;
  totalQuantity: number;
  source: 'Past Sales' | 'FTF' | 'Past Sales & FTF';
}

export interface RangeMetrics {
  optionsPlanned: number;
  budget: string;
  progress: number;
  status: 'active' | 'locked' | 'review' | 'draft';
  stage: string;
  risk: 'Low' | 'Medium' | 'High';
  contribution: string;
  storeCount: number;
  sellThrough?: number;
  margin?: number;
}

// FnL Hierarchy Data based on actual Excel structure
export const fnlHierarchy: FnLHierarchy = {
  segments: {
    'MC': {
      segmentId: 'MC',
      segmentName: "Men's Casual",
      families: [
        {
          familyId: 'YOUTH_BOYS',
          familyName: 'Youth Boys',
          segmentId: 'MC',
          bricks: [
            {
              brickId: 'SWEAT_SHIRT',
              brickName: 'Sweat Shirt',
              familyId: 'YOUTH_BOYS',
              performance: {
                optionsPlanned: 45,
                budget: '₹8 Cr',
                progress: 92,
                status: 'active',
                stage: 'Designing',
                risk: 'Low',
                contribution: '25%',
                storeCount: 320,
                sellThrough: 78,
                margin: 52
              },
              attributeVariants: [
                {
                  id: 'SWEAT_SHIRT_1',
                  silhouette: 'Oversized T-Shirts',
                  fabricType: 'Knits',
                  print: 'Solids/Plain',
                  priceRange: '₹1,200-1,800',
                  optionCount: 12,
                  totalQuantity: 2400,
                  source: 'Past Sales'
                },
                {
                  id: 'SWEAT_SHIRT_2',
                  silhouette: 'Oversized T-Shirts',
                  fabricType: 'Knits',
                  print: 'Stripes/Checks',
                  priceRange: '₹1,200-1,800',
                  optionCount: 8,
                  totalQuantity: 1600,
                  source: 'FTF'
                },
                {
                  id: 'SWEAT_SHIRT_3',
                  silhouette: 'Regular Shirts',
                  fabricType: 'Knits',
                  print: 'All-over print',
                  priceRange: '₹1,500-2,200',
                  optionCount: 6,
                  totalQuantity: 1200,
                  source: 'Past Sales & FTF'
                },
                {
                  id: 'SWEAT_SHIRT_4',
                  silhouette: 'Oversized T-Shirts',
                  fabricType: 'Others',
                  print: 'Placement print',
                  priceRange: '₹1,200-1,800',
                  optionCount: 4,
                  totalQuantity: 800,
                  source: 'Past Sales'
                }
              ]
            }
          ],
          performance: {
            optionsPlanned: 180,
            budget: '₹32 Cr',
            progress: 85,
            status: 'active',
            stage: 'Range Planning',
            risk: 'Low',
            contribution: '35%',
            storeCount: 400
          }
        },
        {
          familyId: 'ACTIVEWEAR',
          familyName: 'Activewear',
          segmentId: 'MC',
          bricks: [
            {
              brickId: 'TRACK_PANTS',
              brickName: 'Track Pants',
              familyId: 'ACTIVEWEAR',
              performance: {
                optionsPlanned: 35,
                budget: '₹6 Cr',
                progress: 88,
                status: 'active',
                stage: 'Designing',
                risk: 'Low',
                contribution: '22%',
                storeCount: 380,
                sellThrough: 82,
                margin: 48
              },
              attributeVariants: [
                {
                  id: 'TRACK_PANTS_1',
                  silhouette: 'Regular Shirts',
                  fabricType: 'Woven',
                  print: 'Solids/Plain',
                  priceRange: '₹800-1,200',
                  optionCount: 15,
                  totalQuantity: 3000,
                  source: 'Past Sales & FTF'
                },
                {
                  id: 'TRACK_PANTS_2',
                  silhouette: 'Regular Shirts',
                  fabricType: 'Knits',
                  print: 'Stripes/Checks',
                  priceRange: '₹800-1,200',
                  optionCount: 10,
                  totalQuantity: 2000,
                  source: 'Past Sales'
                },
                {
                  id: 'TRACK_PANTS_3',
                  silhouette: 'Boxy Polos',
                  fabricType: 'Others',
                  print: 'Solids/Plain',
                  priceRange: '₹900-1,400',
                  optionCount: 8,
                  totalQuantity: 1600,
                  source: 'FTF'
                }
              ]
            }
          ],
          performance: {
            optionsPlanned: 150,
            budget: '₹28 Cr',
            progress: 72,
            status: 'active',
            stage: 'Designing',
            risk: 'Medium',
            contribution: '28%',
            storeCount: 380
          }
        },
        {
          familyId: 'CASUAL_WEAR',
          familyName: 'Casual Wear',
          segmentId: 'MC',
          bricks: [
            {
              brickId: 'KURTAS',
              brickName: 'Kurtas',
              familyId: 'CASUAL_WEAR',
              performance: {
                optionsPlanned: 42,
                budget: '₹7 Cr',
                progress: 75,
                status: 'active',
                stage: 'Range Planning',
                risk: 'Medium',
                contribution: '20%',
                storeCount: 350,
                sellThrough: 65,
                margin: 55
              },
              attributeVariants: [
                {
                  id: 'KURTAS_1',
                  silhouette: 'Heavy Cardigans',
                  fabricType: 'Others',
                  print: 'All-over print',
                  priceRange: '₹2,000-3,000',
                  optionCount: 6,
                  totalQuantity: 1200,
                  source: 'Past Sales'
                },
                {
                  id: 'KURTAS_2',
                  silhouette: 'Heavy Cardigans',
                  fabricType: 'Woven',
                  print: 'Solids/Plain',
                  priceRange: '₹1,800-2,500',
                  optionCount: 8,
                  totalQuantity: 1600,
                  source: 'Past Sales & FTF'
                },
                {
                  id: 'KURTAS_3',
                  silhouette: 'Regular Shirts',
                  fabricType: 'Others',
                  print: 'Placement print',
                  priceRange: '₹2,200-3,200',
                  optionCount: 4,
                  totalQuantity: 800,
                  source: 'FTF'
                }
              ]
            }
          ],
          performance: {
            optionsPlanned: 220,
            budget: '₹35 Cr',
            progress: 68,
            status: 'active',
            stage: 'Range Planning',
            risk: 'Low',
            contribution: '32%',
            storeCount: 420
          }
        },
        {
          familyId: 'SMART_CASUALS',
          familyName: 'Smart Casuals',
          segmentId: 'MC',
          bricks: [
            {
              brickId: 'POLO_SHIRTS',
              brickName: 'Polo Shirts',
              familyId: 'SMART_CASUALS',
              performance: {
                optionsPlanned: 38,
                budget: '₹5 Cr',
                progress: 45,
                status: 'review',
                stage: 'Range Planning',
                risk: 'High',
                contribution: '18%',
                storeCount: 300,
                sellThrough: 58,
                margin: 42
              },
              attributeVariants: []
            }
          ],
          performance: {
            optionsPlanned: 160,
            budget: '₹30 Cr',
            progress: 45,
            status: 'review',
            stage: 'Range Planning',
            risk: 'High',
            contribution: '25%',
            storeCount: 350
          }
        }
      ]
    },
    'WIW': {
      segmentId: 'WIW',
      segmentName: "Women's Wear",
      families: [
        {
          familyId: 'ETHNIC_WEAR',
          familyName: 'Ethnic Wear',
          segmentId: 'WIW',
          bricks: [
            {
              brickId: 'CAPRIS',
              brickName: 'Capris',
              familyId: 'ETHNIC_WEAR',
              performance: {
                optionsPlanned: 65,
                budget: '₹12 Cr',
                progress: 92,
                status: 'active',
                stage: 'Designing',
                risk: 'Low',
                contribution: '28%',
                storeCount: 450,
                sellThrough: 85,
                margin: 58
              },
              attributeVariants: []
            },
            {
              brickId: 'SALWARS',
              brickName: 'Salwars',
              familyId: 'ETHNIC_WEAR',
              performance: {
                optionsPlanned: 48,
                budget: '₹8 Cr',
                progress: 88,
                status: 'active',
                stage: 'Designing',
                risk: 'Low',
                contribution: '22%',
                storeCount: 420,
                sellThrough: 82,
                margin: 54
              },
              attributeVariants: []
            }
          ],
          performance: {
            optionsPlanned: 280,
            budget: '₹45 Cr',
            progress: 88,
            status: 'active',
            stage: 'Designing',
            risk: 'Low',
            contribution: '38%',
            storeCount: 480
          }
        },
        {
          familyId: 'WESTERN_WEAR',
          familyName: 'Western Wear',
          segmentId: 'WIW',
          bricks: [
            {
              brickId: 'WOVEN_TOPS',
              brickName: 'Woven Tops',
              familyId: 'WESTERN_WEAR',
              performance: {
                optionsPlanned: 55,
                budget: '₹9 Cr',
                progress: 78,
                status: 'active',
                stage: 'Range Planning',
                risk: 'Low',
                contribution: '25%',
                storeCount: 400,
                sellThrough: 72,
                margin: 51
              },
              attributeVariants: []
            }
          ],
          performance: {
            optionsPlanned: 240,
            budget: '₹38 Cr',
            progress: 76,
            status: 'active',
            stage: 'Range Planning',
            risk: 'Low',
            contribution: '32%',
            storeCount: 450
          }
        },
        {
          familyId: 'FUSION_ETHNIC_WEAR',
          familyName: 'Fusion Ethnic Wear',
          segmentId: 'WIW',
          bricks: [
            {
              brickId: 'WOVEN',
              brickName: 'Woven',
              familyId: 'FUSION_ETHNIC_WEAR',
              performance: {
                optionsPlanned: 42,
                budget: '₹7 Cr',
                progress: 85,
                status: 'active',
                stage: 'Designing',
                risk: 'Medium',
                contribution: '20%',
                storeCount: 380,
                sellThrough: 68,
                margin: 49
              },
              attributeVariants: []
            }
          ],
          performance: {
            optionsPlanned: 200,
            budget: '₹42 Cr',
            progress: 82,
            status: 'active',
            stage: 'Designing',
            risk: 'Medium',
            contribution: '28%',
            storeCount: 420
          }
        },
        {
          familyId: 'INNER_WEAR',
          familyName: 'Inner Wear',
          segmentId: 'WIW',
          bricks: [
            {
              brickId: 'SKORTS',
              brickName: 'Skorts',
              familyId: 'INNER_WEAR',
              performance: {
                optionsPlanned: 28,
                budget: '₹4 Cr',
                progress: 95,
                status: 'locked',
                stage: 'Costing',
                risk: 'Low',
                contribution: '15%',
                storeCount: 280,
                sellThrough: 88,
                margin: 62
              },
              attributeVariants: []
            }
          ],
          performance: {
            optionsPlanned: 120,
            budget: '₹25 Cr',
            progress: 92,
            status: 'locked',
            stage: 'Costing',
            risk: 'Low',
            contribution: '18%',
            storeCount: 320
          }
        }
      ]
    },
    'WWW': {
      segmentId: 'WWW',
      segmentName: "Men's Wear",
      families: [
        {
          familyId: 'FORMAL_WEAR',
          familyName: 'Formal Wear',
          segmentId: 'WWW',
          bricks: [
            {
              brickId: 'CARGO',
              brickName: 'Cargo',
              familyId: 'FORMAL_WEAR',
              performance: {
                optionsPlanned: 35,
                budget: '₹8 Cr',
                progress: 98,
                status: 'locked',
                stage: 'Costing',
                risk: 'Low',
                contribution: '30%',
                storeCount: 380,
                sellThrough: 92,
                margin: 58
              },
              attributeVariants: []
            }
          ],
          performance: {
            optionsPlanned: 180,
            budget: '₹35 Cr',
            progress: 95,
            status: 'locked',
            stage: 'Costing',
            risk: 'Low',
            contribution: '42%',
            storeCount: 400
          }
        },
        {
          familyId: 'SMART_CASUALS_WWW',
          familyName: 'Smart Casuals',
          segmentId: 'WWW',
          bricks: [
            {
              brickId: 'FORMAL_SHIRTS',
              brickName: 'Formal Shirts',
              familyId: 'SMART_CASUALS_WWW',
              performance: {
                optionsPlanned: 45,
                budget: '₹6 Cr',
                progress: 82,
                status: 'active',
                stage: 'Designing',
                risk: 'Low',
                contribution: '25%',
                storeCount: 350,
                sellThrough: 78,
                margin: 54
              },
              attributeVariants: []
            }
          ],
          performance: {
            optionsPlanned: 160,
            budget: '₹28 Cr',
            progress: 78,
            status: 'active',
            stage: 'Designing',
            risk: 'Low',
            contribution: '35%',
            storeCount: 380
          }
        },
        {
          familyId: 'WINTER_WEAR',
          familyName: 'Winter Wear',
          segmentId: 'WWW',
          bricks: [
            {
              brickId: 'JACKETS',
              brickName: 'Jackets',
              familyId: 'WINTER_WEAR',
              performance: {
                optionsPlanned: 32,
                budget: '₹5 Cr',
                progress: 75,
                status: 'active',
                stage: 'Range Planning',
                risk: 'Medium',
                contribution: '22%',
                storeCount: 280,
                sellThrough: 65,
                margin: 48
              },
              attributeVariants: []
            }
          ],
          performance: {
            optionsPlanned: 140,
            budget: '₹22 Cr',
            progress: 72,
            status: 'active',
            stage: 'Range Planning',
            risk: 'Medium',
            contribution: '28%',
            storeCount: 320
          }
        },
        {
          familyId: 'DENIM_WEAR',
          familyName: 'Denim Wear',
          segmentId: 'WWW',
          bricks: [
            {
              brickId: 'JEANS',
              brickName: 'Jeans',
              familyId: 'DENIM_WEAR',
              performance: {
                optionsPlanned: 28,
                budget: '₹4 Cr',
                progress: 68,
                status: 'review',
                stage: 'Range Planning',
                risk: 'Medium',
                contribution: '20%',
                storeCount: 250,
                sellThrough: 62,
                margin: 45
              },
              attributeVariants: []
            }
          ],
          performance: {
            optionsPlanned: 120,
            budget: '₹18 Cr',
            progress: 65,
            status: 'review',
            stage: 'Range Planning',
            risk: 'Medium',
            contribution: '25%',
            storeCount: 300
          }
        }
      ]
    },
    'KW': {
      segmentId: 'KW',
      segmentName: "Kids Wear",
      families: [
        {
          familyId: 'BOYS',
          familyName: 'Boys',
          segmentId: 'KW',
          bricks: [
            {
              brickId: 'KNIT_TOPS',
              brickName: 'Knit Tops',
              familyId: 'BOYS',
              performance: {
                optionsPlanned: 38,
                budget: '₹5 Cr',
                progress: 68,
                status: 'active',
                stage: 'Range Planning',
                risk: 'High',
                contribution: '28%',
                storeCount: 280,
                sellThrough: 58,
                margin: 45
              },
              attributeVariants: []
            }
          ],
          performance: {
            optionsPlanned: 150,
            budget: '₹22 Cr',
            progress: 65,
            status: 'active',
            stage: 'Range Planning',
            risk: 'High',
            contribution: '35%',
            storeCount: 350
          }
        },
        {
          familyId: 'GIRLS',
          familyName: 'Girls',
          segmentId: 'KW',
          bricks: [
            {
              brickId: 'FLAT_KNIT',
              brickName: 'Flat Knit',
              familyId: 'GIRLS',
              performance: {
                optionsPlanned: 35,
                budget: '₹6 Cr',
                progress: 62,
                status: 'active',
                stage: 'Range Planning',
                risk: 'High',
                contribution: '25%',
                storeCount: 320,
                sellThrough: 55,
                margin: 42
              },
              attributeVariants: []
            },
            {
              brickId: 'DUPATTAS',
              brickName: 'Dupattas',
              familyId: 'GIRLS',
              performance: {
                optionsPlanned: 25,
                budget: '₹3 Cr',
                progress: 58,
                status: 'active',
                stage: 'Range Planning',
                risk: 'High',
                contribution: '18%',
                storeCount: 250,
                sellThrough: 52,
                margin: 38
              },
              attributeVariants: []
            }
          ],
          performance: {
            optionsPlanned: 140,
            budget: '₹25 Cr',
            progress: 58,
            status: 'active',
            stage: 'Range Planning',
            risk: 'High',
            contribution: '32%',
            storeCount: 380
          }
        },
        {
          familyId: 'TODDLER_BOYS',
          familyName: 'Toddler Boys',
          segmentId: 'KW',
          bricks: [
            {
              brickId: 'WOVEN_DRESS',
              brickName: 'Woven Dress',
              familyId: 'TODDLER_BOYS',
              performance: {
                optionsPlanned: 22,
                budget: '₹3 Cr',
                progress: 45,
                status: 'review',
                stage: 'Range Planning',
                risk: 'High',
                contribution: '15%',
                storeCount: 200,
                sellThrough: 48,
                margin: 35
              },
              attributeVariants: []
            }
          ],
          performance: {
            optionsPlanned: 90,
            budget: '₹15 Cr',
            progress: 42,
            status: 'review',
            stage: 'Range Planning',
            risk: 'High',
            contribution: '22%',
            storeCount: 280
          }
        },
        {
          familyId: 'TODDLER_GIRLS',
          familyName: 'Toddler Girls',
          segmentId: 'KW',
          bricks: [
            {
              brickId: 'SALWARS_TODDLER',
              brickName: 'Salwars',
              familyId: 'TODDLER_GIRLS',
              performance: {
                optionsPlanned: 18,
                budget: '₹2 Cr',
                progress: 38,
                status: 'draft',
                stage: 'Planning',
                risk: 'High',
                contribution: '12%',
                storeCount: 180,
                sellThrough: 42,
                margin: 32
              },
              attributeVariants: []
            }
          ],
          performance: {
            optionsPlanned: 80,
            budget: '₹18 Cr',
            progress: 38,
            status: 'draft',
            stage: 'Planning',
            risk: 'High',
            contribution: '18%',
            storeCount: 220
          }
        }
      ]
    }
  }
};

// Helper functions to get data
export function getFamiliesBySegment(segmentId: string): Family[] {
  return fnlHierarchy.segments[segmentId]?.families || [];
}

export function getBricksByFamily(familyId: string): Brick[] {
  for (const segment of Object.values(fnlHierarchy.segments)) {
    const family = segment.families.find(f => f.familyId === familyId);
    if (family) {
      return family.bricks;
    }
  }
  return [];
}

export function getFamilyById(familyId: string): Family | undefined {
  for (const segment of Object.values(fnlHierarchy.segments)) {
    const family = segment.families.find(f => f.familyId === familyId);
    if (family) {
      return family;
    }
  }
  return undefined;
}

export function getBrickById(brickId: string): Brick | undefined {
  for (const segment of Object.values(fnlHierarchy.segments)) {
    for (const family of segment.families) {
      const brick = family.bricks.find(b => b.brickId === brickId);
      if (brick) {
        return brick;
      }
    }
  }
  return undefined;
}