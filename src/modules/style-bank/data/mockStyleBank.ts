import type { Product, BrandCollection } from '../types/types';
import type {
  ShowroomStyle,
  StyleSource,
  CurationStage,
  ShortlistDecision,
  Colorway,
  MoodBoardAnnotation,
  CollectionSendBack,
  MoodBoard,
  ConstraintCompliance,
  CollectionProgress,
  ShowroomSummary,
} from '../types/showroom-types';
import collectionData from './lere27_collection.json';

const brandCollection = collectionData as BrandCollection;

// ── Helper: deterministic hash for consistent mock data ──────────────────

function hashStr(str: string): number {
  return str.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
}

// ── Source assignment logic ──────────────────────────────────────────────

function assignSource(_product: Product, index: number): StyleSource {
  // ~40% AI Generated, ~40% vendor, ~20% re-buy
  const mod = index % 10;
  if (mod < 4) return 'daas';
  if (mod < 8) return 'vendor';
  return 'rebuy';
}

// ── POD assignment ───────────────────────────────────────────────────────

const PODS = [
  { id: 'MW-1', name: 'Men Formal', segment: 'mens-formal' },
  { id: 'MW-2', name: 'Men Casual', segment: 'mens-casual' },
  { id: 'MW-3', name: 'Men Ethnic', segment: 'mens-ethnic' },
  { id: 'WW-1', name: 'Women Western', segment: 'womens-western' },
  { id: 'WW-2', name: 'Women Ethnic', segment: 'womens-ethnic' },
  { id: 'KW-1', name: 'Kids Wear', segment: 'kids-wear' },
];

const VENDORS = [
  { id: 'V001', name: 'Arvind Ltd.' },
  { id: 'V002', name: 'Raymond Textiles' },
  { id: 'V003', name: 'Bombay Dyeing' },
  { id: 'V004', name: 'Welspun India' },
  { id: 'V005', name: 'Gokaldas Exports' },
  { id: 'V006', name: 'Shahi Exports' },
];

const TREND_SIGNALS = [
  { signal: 'Oversized streetwear rising +23% on Instagram', strength: 78, direction: 'rising' as const, gap: 'Brand X dominates ₹2 K-3 K oversized T-shirts' },
  { signal: 'Minimalist neutral tones trending +18% on Pinterest', strength: 65, direction: 'rising' as const, gap: 'Unserved demand in premium minimal basics' },
  { signal: 'Sustainable fabrics gaining traction +31% YoY', strength: 82, direction: 'rising' as const, gap: 'No major player in organic cotton casual' },
  { signal: 'Retro Y2 K prints stable at high search volume', strength: 55, direction: 'stable' as const, gap: 'Gap in ₹1.5 K-2.5 K range for Y2 K styles' },
  { signal: 'Athleisure crossover declining -8% from peak', strength: 42, direction: 'declining' as const, gap: 'Market saturated but premium segment open' },
  { signal: 'Bold graphic prints surging +45% on TikTok', strength: 88, direction: 'rising' as const, gap: 'No quality graphic tees under ₹2 K' },
];

const PRIOR_SEASONS = ['SS25', 'AW25', 'SS24', 'AW24'];

// ── Silhouette descriptions by category ─────────────────────────────────

const SILHOUETTE_DESCRIPTIONS: Record<string, string[]> = {
  'evening-wear': [
    'Floor-length column silhouette with structured bodice, high neckline, concealed back zip, tailored princess seams, subtle train detail',
    'Fitted sheath with asymmetric drape, one-shoulder construction, bias-cut skirt panel, invisible hem finish',
    'A-line gown with empire waist, cap sleeves, sweetheart neckline, layered tulle overlay, corset back closure',
  ],
  'cocktail': [
    'Structured mini with peplum waist, bateau neckline, three-quarter sleeves, dart-fitted bodice, concealed side zip',
    'Bodycon midi with halter neck, open back detail, side slit to knee, reinforced bust panel, stretch construction',
    'Fit-and-flare with V-neckline, box pleat skirt, set-in sleeves, grosgrain waist detail, lined bodice',
  ],
  'ready-to-wear': [
    'Relaxed straight cut, dropped shoulder, crew neck, side seam pockets, split hem, double-needle topstitch',
    'Slim-fit tailored silhouette, notch collar, two-button front, jetted pockets, center back vent',
    'Oversized boxy fit, band collar, hidden button placket, curved hem, reinforced shoulder seams',
  ],
  'smart-casual': [
    'Modern regular fit, button-down collar, single chest pocket, back yoke with locker loop, adjustable cuffs',
    'Tapered chino with mid-rise waist, slash pockets, welt back pockets, extended tab waistband, clean front',
    'Unstructured blazer, patch pockets, notch lapel, half-canvas construction, natural shoulder, single vent',
  ],
  'outerwear': [
    'Oversized cocoon coat, stand collar, raglan sleeves, welt pockets, concealed snap closure, dropped hem',
    'Tailored trench with storm flap, double-breasted front, self-belt, epaulets, inverted back pleat',
    'Cropped bomber, ribbed collar and cuffs, zip front, slash pockets, quilted lining, elasticated hem',
  ],
  'workwear': [
    'Tailored straight-leg trouser, high-rise waist, pressed crease, slash pockets, grosgrain waistband facing',
    'Structured pencil skirt, back kick pleat, contour waistband, concealed back zip, fully lined',
    'Classic button-front shirt, spread collar, french cuffs, darted back, curved hem, mother-of-pearl buttons',
  ],
  'artisanal': [
    'Hand-draped asymmetric tunic, raw-edge hem, artisan pleating, adjustable tie waist, organic silhouette',
    'Deconstructed jacket, exposed seams, hand-stitched lapels, patch pockets, unlined construction, frayed edges',
    'Sculptural wrap dress, origami fold detail, architectural collar, self-tie closure, handwoven textile panels',
  ],
  'sustainable': [
    'Relaxed wide-leg pant, elastic waist, side pockets, clean finish seams, undyed natural fabric, minimal construction',
    'Boxy crop top, round neck, cap sleeves, organic cotton jersey, enzyme-washed finish, minimal labeling',
    'Loose-fit midi dress, scoop neck, gathered waist, tiered skirt, zero-waste pattern cutting, natural dye',
  ],
  'limited-edition': [
    'Avant-garde deconstructed blazer, asymmetric hem, exposed lining, statement shoulder, numbered edition label',
    'Sculptural mini dress, architectural pleats, bonded seams, exaggerated collar, collectible packaging',
    'Hand-embellished evening jacket, custom hardware, artisan beading, structured shoulder, silk lining, archive piece',
  ],
};

// ── Fabric types by category ────────────────────────────────────────────

const FABRIC_TYPES: Record<string, string[]> = {
  'evening-wear': ['silk crepe de chine', 'silk charmeuse', 'tulle overlay on silk base'],
  'cocktail': ['stretch crepe', 'silk mix', 'ponte knit'],
  'ready-to-wear': ['cotton jersey 180gsm', 'organic cotton', 'cotton twill'],
  'smart-casual': ['cotton poplin', 'linen blend', 'cotton twill'],
  'outerwear': ['wool blend twill', 'cotton gabardine', 'polyester blend'],
  'workwear': ['cotton poplin', 'polyester blend', 'rayon crepe'],
  'artisanal': ['handloom cotton', 'raw silk', 'linen blend'],
  'sustainable': ['organic cotton', 'Tencel lyocell', 'recycled polyester'],
  'limited-edition': ['silk mix', 'double-face wool', 'Italian jacquard'],
};

// ── Color palettes for colorway generation ──────────────────────────────

const COLOR_PALETTES: Record<string, Array<{ name: string; hex: string }>> = {
  'evening-wear': [
    { name: 'Midnight Black', hex: '#0D0D0D' },
    { name: 'Deep Navy', hex: '#1B2A4A' },
    { name: 'Burgundy', hex: '#722F37' },
    { name: 'Champagne', hex: '#F7E7CE' },
    { name: 'Emerald', hex: '#046307' },
    { name: 'Ivory', hex: '#FFFFF0' },
    { name: 'Gunmetal', hex: '#2A3439' },
    { name: 'Dusty Rose', hex: '#DCAE96' },
  ],
  'cocktail': [
    { name: 'Red', hex: '#C41E3A' },
    { name: 'Black', hex: '#1A1A1A' },
    { name: 'Hot Pink', hex: '#FF69B4' },
    { name: 'Electric Blue', hex: '#0047AB' },
    { name: 'White', hex: '#FAFAFA' },
    { name: 'Gold', hex: '#CFB53B' },
    { name: 'Silver', hex: '#C0C0C0' },
    { name: 'Plum', hex: '#8E4585' },
  ],
  'ready-to-wear': [
    { name: 'White', hex: '#FFFFFF' },
    { name: 'Black', hex: '#1C1C1C' },
    { name: 'Navy', hex: '#1F3A5F' },
    { name: 'Grey Melange', hex: '#A9A9A9' },
    { name: 'Olive', hex: '#556B2F' },
    { name: 'Rust', hex: '#B7410E' },
    { name: 'Sand', hex: '#C2B280' },
    { name: 'Charcoal', hex: '#36454F' },
  ],
  'smart-casual': [
    { name: 'Sky Blue', hex: '#87CEEB' },
    { name: 'White', hex: '#FFFFFF' },
    { name: 'Khaki', hex: '#C3B091' },
    { name: 'Navy', hex: '#1F3A5F' },
    { name: 'Stone', hex: '#928E85' },
    { name: 'Sage', hex: '#9CAF88' },
    { name: 'Powder Blue', hex: '#B0E0E6' },
    { name: 'Ecru', hex: '#C2B280' },
  ],
  'outerwear': [
    { name: 'Camel', hex: '#C19A6B' },
    { name: 'Black', hex: '#1A1A1A' },
    { name: 'Olive', hex: '#556B2F' },
    { name: 'Navy', hex: '#1F3A5F' },
    { name: 'Burgundy', hex: '#722F37' },
    { name: 'Stone', hex: '#928E85' },
  ],
  'workwear': [
    { name: 'White', hex: '#FFFFFF' },
    { name: 'Light Blue', hex: '#ADD8E6' },
    { name: 'Black', hex: '#1A1A1A' },
    { name: 'Charcoal', hex: '#36454F' },
    { name: 'Navy', hex: '#1F3A5F' },
    { name: 'Blush', hex: '#DE5D83' },
  ],
  'artisanal': [
    { name: 'Indigo', hex: '#3F51B5' },
    { name: 'Natural', hex: '#E8DCC8' },
    { name: 'Terracotta', hex: '#E2725B' },
    { name: 'Turmeric', hex: '#E3A857' },
    { name: 'Madder Red', hex: '#A2231D' },
    { name: 'Ajrakh Blue', hex: '#2C4A6E' },
  ],
  'sustainable': [
    { name: 'Undyed Natural', hex: '#E8DCC8' },
    { name: 'Sage', hex: '#9CAF88' },
    { name: 'Earth Brown', hex: '#8B7355' },
    { name: 'Denim Blue', hex: '#5B7F95' },
    { name: 'Oat', hex: '#D4C5A9' },
    { name: 'Moss', hex: '#8A9A5B' },
  ],
  'limited-edition': [
    { name: 'Obsidian', hex: '#0B0B0B' },
    { name: 'Archive Red', hex: '#8B0000' },
    { name: 'Titanium', hex: '#878681' },
    { name: 'Pearl', hex: '#EAE0C8' },
    { name: 'Cobalt', hex: '#0047AB' },
    { name: 'Oxidized Gold', hex: '#B5A642' },
  ],
};

// ── Designer and buyer note arrays ──────────────────────────────────────

const DESIGNER_NOTES = [
  'Strong silhouette, fits SS26 trend direction',
  'Recommend for hero range — high visual impact in-store',
  'Color story aligns with mood board, fabric hand is excellent',
  'Proportions are on-trend, suggest as campaign piece',
  'Unique construction detail differentiates from market',
  'Clean lines, versatile styling potential across multiple occasions',
  'Fabric drape elevates the design; strong showroom presence',
  'Pattern placement needs adjustment but silhouette is approved',
  'Excellent print quality, recommend for window display',
  'Good base design, suggest colorway expansion for depth',
];

const BUYER_NOTES = [
  'Margin too thin at current cost — renegotiate with vendor',
  'Good volume potential for Tier 1 and Tier 2 stores',
  'Renegotiate with vendor to improve landed cost by 8-10%',
  'Strong sell-through prediction based on similar styles last season',
  'Price point competitive, fills gap in mid-tier ladder',
  'High return risk based on comparable category data',
  'Recommend wider size range for inclusive sizing push',
  'Vendor has capacity for quick replenishment if needed',
  'Category margin contribution strong, fast-track for approval',
  'Need alternative fabric source — current vendor lead time too long',
];

// ── Curation stage assignment ────────────────────────────────────────────

function assignCurationStage(index: number): {
  stage: CurationStage;
  shortlist: {
    designer: ShortlistDecision;
    buyer: ShortlistDecision;
    categoryHead: ShortlistDecision;
  };
} {
  const mod = index % 20;
  if (mod < 5) {
    // Pool (25%) — not yet reviewed
    return {
      stage: 'pool',
      shortlist: { designer: 'pending', buyer: 'pending', categoryHead: 'pending' },
    };
  }
  if (mod < 10) {
    // Designer shortlisted (25%)
    return {
      stage: 'designer_shortlist',
      shortlist: { designer: 'shortlisted', buyer: 'pending', categoryHead: 'pending' },
    };
  }
  if (mod < 15) {
    // Buyer shortlisted (25%)
    return {
      stage: 'buyer_shortlist',
      shortlist: { designer: 'shortlisted', buyer: 'shortlisted', categoryHead: 'pending' },
    };
  }
  // Final approved (25%)
  return {
    stage: 'final_approved',
    shortlist: { designer: 'shortlisted', buyer: 'shortlisted', categoryHead: 'shortlisted' },
  };
}

// ── Colorway generation ─────────────────────────────────────────────────

function generateColorways(product: Product, hash: number): Colorway[] {
  const categoryKey = product.category.toLowerCase().replace(/\s+/g, '-');
  const palette = COLOR_PALETTES[categoryKey] ?? COLOR_PALETTES['ready-to-wear']!;

  // Determine number of colorways based on hash distribution
  // ~40% get 1, ~35% get 2-3, ~20% get 4-5, ~5% get 6+
  const mod20 = hash % 20;
  let count: number;
  if (mod20 < 8) count = 1;
  else if (mod20 < 15) count = 2 + (hash % 2);
  else if (mod20 < 19) count = 4 + (hash % 2);
  else count = 6 + (hash % 3);

  // Don't exceed available palette colors
  count = Math.min(count, palette.length);

  const colorways: Colorway[] = [];
  for (let i = 0; i < count; i++) {
    const color = palette[(hash + i) % palette.length]!;
    const cwId = `${product.id}-cw-${i + 1}`;
    colorways.push({
      id: cwId,
      name: color.name,
      colorHex: color.hex,
      images: product.images,
      fabricSwatches: [`/placeholder-swatch-${(i % 3) + 1}.jpg`],
      available: (hash + i) % 10 !== 0, // ~10% unavailable
    });
  }

  return colorways;
}

// ── Generate ShowroomStyle from Product ──────────────────────────────────

function generateShowroomStyle(product: Product, index: number): ShowroomStyle {
  const source = assignSource(product, index);
  const hash = hashStr(product.id);
  const pod = PODS[hash % PODS.length]!;
  const vendor = VENDORS[hash % VENDORS.length]!;
  const { stage, shortlist } = assignCurationStage(index);

  const mrp = product.price.mrp;
  const asp = Math.round(mrp * 0.85);
  const marginRate = 48 + (hash % 15); // 48-62%
  const computedUnitCost = Math.round(asp * (1 - marginRate / 100));
  const margin = marginRate;
  const marginPass = margin >= 53;

  const priceTiers = ['entry', 'mid', 'premium'] as const;
  const fashionGrades = ['core', 'fashion'] as const;

  // Silhouette description — deterministic from category
  const categoryKey = product.category.toLowerCase().replace(/\s+/g, '-');
  const silhouettes = SILHOUETTE_DESCRIPTIONS[categoryKey] ?? SILHOUETTE_DESCRIPTIONS['ready-to-wear']!;
  const silhouetteDescription = silhouettes[hash % silhouettes.length]!;

  // Fabric type — deterministic from category
  const fabrics = FABRIC_TYPES[categoryKey] ?? FABRIC_TYPES['ready-to-wear']!;
  const fabricType = fabrics[hash % fabrics.length]!;

  // Fabric swatches — 1-2 placeholder URLs
  const fabricSwatches = hash % 3 === 0
    ? ['/placeholder-swatch-1.jpg', '/placeholder-swatch-2.jpg']
    : ['/placeholder-swatch-1.jpg'];

  // Unit cost — null for ~20% (hash % 5 === 0)
  const unitCostValue: number | null = hash % 5 === 0 ? null : computedUnitCost;

  // Colorways
  const colorways = generateColorways(product, hash);

  // Active colorway — set on ~5% of styles
  const activeColorwayId = hash % 20 === 0 && colorways.length > 0 ? colorways[0]!.id : null;

  // Designer/buyer notes on ~40% of styles that have passed those stages
  const hasDesignerNote = shortlist.designer === 'shortlisted' && (hash % 5 < 2);
  const hasBuyerNote = shortlist.buyer === 'shortlisted' && ((hash + 1) % 5 < 2);

  const style: ShowroomStyle = {
    product,
    source,
    curationStage: stage,
    shortlistStatus: {
      designer: shortlist.designer,
      designerNote: hasDesignerNote ? DESIGNER_NOTES[hash % DESIGNER_NOTES.length] : undefined,
      designerAt: shortlist.designer !== 'pending' ? '2026-01-15T10:30:00Z' : undefined,
      buyer: shortlist.buyer,
      buyerNote: hasBuyerNote ? BUYER_NOTES[hash % BUYER_NOTES.length] : undefined,
      buyerAt: shortlist.buyer !== 'pending' ? '2026-02-01T14:00:00Z' : undefined,
      categoryHead: shortlist.categoryHead,
      categoryHeadAt: shortlist.categoryHead !== 'pending' ? '2026-02-10T09:00:00Z' : undefined,
    },
    commercial: {
      mrp,
      asp,
      unitCost: computedUnitCost,
      margin,
      marginPass,
      sellThroughRate: source === 'rebuy' ? 75 + (hash % 20) : undefined,
    },
    podId: pod.id,
    podName: pod.name,
    segmentId: pod.segment,
    subCategoryId: categoryKey,
    priceTier: priceTiers[hash % 3]!,
    fashionGrade: fashionGrades[hash % 2 === 0 ? 0 : 1]!,
    silhouetteDescription,
    fabricType,
    fabricSwatches,
    unitCost: unitCostValue,
    colorways,
    activeColorwayId,
    moodBoardIds: [],
    agentFlags: {
      marginAlert: !marginPass,
      gapFill: hash % 7 === 0,
      conflictFlag: hash % 11 === 0,
      autoSurfaced: source === 'rebuy',
    },
  };

  // Source-specific metadata
  if (source === 'daas') {
    const trend = TREND_SIGNALS[hash % TREND_SIGNALS.length]!;
    style.trendAttribution = {
      signal: trend.signal,
      signalStrength: trend.strength,
      competitorGap: trend.gap,
      trendDirection: trend.direction,
    };
  }

  if (source === 'vendor') {
    style.vendorId = vendor!.id;
    style.vendorName = vendor!.name;
    const totalLanded = computedUnitCost;
    style.bom = {
      fabricCost: Math.round(totalLanded * 0.45),
      trimsCost: Math.round(totalLanded * 0.06),
      cmtCost: Math.round(totalLanded * 0.35),
      logisticsCost: Math.round(totalLanded * 0.08),
      totalLandedCost: totalLanded,
    };
  }

  if (source === 'rebuy') {
    const season = PRIOR_SEASONS[hash % PRIOR_SEASONS.length]!;
    style.historicalPerformance = {
      priorSeason: season,
      sellThrough: 75 + (hash % 20),
      returnRate: 2 + (hash % 5),
      storesStocked: 280 + (hash % 100),
      totalStores: 380,
      refreshNote: hash % 3 === 0 ? 'New colorway (Navy)' : hash % 3 === 1 ? 'Updated fabric weight' : undefined,
    };
  }

  return style;
}

// ── Generate all ShowroomStyles ──────────────────────────────────────────

export const showroomStyles: ShowroomStyle[] = brandCollection.products.map(
  (product, index) => generateShowroomStyle(product, index)
);

// Assign some styles to mood boards
showroomStyles.slice(0, 7).forEach((s) => s.moodBoardIds.push('a1b2c3d4-db01-4a5b-8c6d-7e8f9a0b1c2d'));
showroomStyles.slice(10, 15).forEach((s) => s.moodBoardIds.push('a1b2c3d4-db02-4a5b-8c6d-7e8f9a0b1c2d'));
showroomStyles.slice(20, 26).forEach((s) => s.moodBoardIds.push('a1b2c3d4-db03-4a5b-8c6d-7e8f9a0b1c2d'));

// ── Mood Board Annotations ──────────────────────────────────────────────

function generateMoodBoardAnnotations(styleIds: string[], boardIndex: number): MoodBoardAnnotation[] {
  // 2-3 annotations per mood board
  const annotationCount = 2 + (boardIndex % 2);
  const annotations: MoodBoardAnnotation[] = [];
  const annotationTexts = [
    'Hero piece — anchor for the visual narrative',
    'Consider moving to secondary position, supporting role in the story',
    'Color needs to be pulled warmer to match the palette direction',
    'Strong standalone but may compete with adjacent styles in fixture layout',
    'Fabric hand reinforces the theme, keep as lead swatch',
    'Print scale works well at this price tier',
    'Suggested pairing with accessory capsule for campaign styling',
    'This piece drives the editorial angle for the collection lookbook',
  ];
  const authors = ['Priya Sharma', 'Arjun Kapoor', 'Kavita Singh', 'Meera Nair'];

  for (let i = 0; i < annotationCount && i < styleIds.length; i++) {
    const textIdx = (boardIndex * 3 + i) % annotationTexts.length;
    const authorIdx = (boardIndex + i) % authors.length;
    annotations.push({
      styleId: styleIds[i]!,
      note: annotationTexts[textIdx]!,
      author: authors[authorIdx]!,
      updatedAt: `2026-01-${18 + boardIndex + i}T${10 + i}:30:00Z`,
    });
  }

  return annotations;
}

// ── Mood Boards ──────────────────────────────────────────────────────────

const board1StyleIds = showroomStyles.slice(0, 7).map((s) => s.product.id);
const board2StyleIds = showroomStyles.slice(10, 15).map((s) => s.product.id);
const board3StyleIds = showroomStyles.slice(20, 26).map((s) => s.product.id);

export const mockMoodBoards: MoodBoard[] = [
  {
    id: 'a1b2c3d4-db01-4a5b-8c6d-7e8f9a0b1c2d',
    name: 'Urban Streetwear',
    theme: 'Bold prints meet relaxed silhouettes. Target: 18-28 urban male.',
    description: 'A curated collection of oversized fits, graphic elements, and street-ready silhouettes for the urban consumer.',
    colorStory: ['#1a1a2e', '#16213e', '#e94560', '#f5f5dc', '#0f3460', '#533483'],
    styleIds: board1StyleIds,
    annotations: generateMoodBoardAnnotations(board1StyleIds, 0),
    createdBy: 'Priya Sharma',
    podId: 'MW-2',
    season: 'SS26',
    totalRevenue: 1840000000,
    constraintCheck: { passing: 6, total: 7, issues: ['Style 4 margin below 53%'] },
    createdAt: '2026-01-10T09:00:00Z',
    updatedAt: '2026-01-20T15:30:00Z',
  },
  {
    id: 'a1b2c3d4-db02-4a5b-8c6d-7e8f9a0b1c2d',
    name: 'Smart Casual Refresh',
    theme: 'Office-to-evening transition pieces with modern tailoring.',
    description: 'Versatile pieces that bridge workwear and social occasions with refined fabrics and clean lines.',
    colorStory: ['#2c3e50', '#ecf0f1', '#3498db', '#e74c3c', '#f39c12'],
    styleIds: board2StyleIds,
    annotations: generateMoodBoardAnnotations(board2StyleIds, 1),
    createdBy: 'Arjun Kapoor',
    podId: 'MW-1',
    season: 'SS26',
    totalRevenue: 980000000,
    constraintCheck: { passing: 5, total: 5, issues: [] },
    createdAt: '2026-01-12T11:00:00Z',
    updatedAt: '2026-01-22T14:00:00Z',
  },
  {
    id: 'a1b2c3d4-db03-4a5b-8c6d-7e8f9a0b1c2d',
    name: 'Festival Capsule',
    theme: 'Vibrant ethnic-fusion for the festive season buyer.',
    description: 'A celebration-ready capsule blending traditional motifs with contemporary construction.',
    colorStory: ['#c0392b', '#f1c40f', '#27ae60', '#8e44ad', '#e67e22', '#2980b9'],
    styleIds: board3StyleIds,
    annotations: generateMoodBoardAnnotations(board3StyleIds, 2),
    createdBy: 'Kavita Singh',
    podId: 'WW-2',
    season: 'SS26',
    totalRevenue: 1520000000,
    constraintCheck: { passing: 5, total: 6, issues: ['Missing premium price point'] },
    createdAt: '2026-01-14T10:00:00Z',
    updatedAt: '2026-01-25T16:00:00Z',
  },
];

// ── Constraint Compliance ────────────────────────────────────────────────

export const mockConstraintCompliance: ConstraintCompliance = {
  overallScore: 87,
  checks: {
    optionCount: { actual: 485, target: 500, pass: true },
    segmentMix: {
      segments: [
        { id: 'casual', name: 'Casual', actual: 42, target: 40, pass: true },
        { id: 'formal', name: 'Formal', actual: 28, target: 30, pass: true },
        { id: 'ethnic', name: 'Ethnic', actual: 18, target: 18, pass: true },
        { id: 'active', name: 'Active', actual: 12, target: 12, pass: true },
      ],
    },
    coreFashionSplit: {
      coreActual: 72, coreTarget: 72,
      fashionActual: 28, fashionTarget: 28,
      pass: true,
    },
    priceLadder: {
      tiers: [
        { tier: 'Entry', subCategory: 'T-Shirts', covered: true },
        { tier: 'Mid', subCategory: 'T-Shirts', covered: true },
        { tier: 'Premium', subCategory: 'T-Shirts', covered: true },
        { tier: 'Entry', subCategory: 'Shirts', covered: true },
        { tier: 'Mid', subCategory: 'Shirts', covered: true },
        { tier: 'Premium', subCategory: 'Shirts', covered: true },
        { tier: 'Entry', subCategory: 'Kids', covered: true },
        { tier: 'Mid', subCategory: 'Kids', covered: true },
        { tier: 'Premium', subCategory: 'Kids', covered: false },
      ],
      gaps: ['Kids Premium (₹3 K+)'],
    },
    marginFloor: {
      passingStyles: 461,
      failingStyles: 24,
      pass: false,
    },
    otbBudget: {
      utilized: 4820000000,
      envelope: 5200000000,
      percentage: 93,
      pass: true,
    },
    fabricPalette: { inPalette: 478, outOfPalette: 7, pass: true },
    fixtureCapacity: { mapped: 485, total: 500, pass: true },
  },
  issues: [
    {
      severity: 'critical',
      description: '24 styles below 53% intake margin',
      recommendation: '12 fixable with vendor renegotiation, 8 need fabric change, 4 should be dropped',
    },
    {
      severity: 'warning',
      description: 'Kids Premium gap — no options above ₹3 K',
      recommendation: '3 options needed at ₹3 K+. AI Generated can generate proposals for this segment.',
    },
  ],
};

// ── Collection Progress ──────────────────────────────────────────────────

// MW-2 send-back data
const mw2SendBack: CollectionSendBack = {
  podId: 'MW-2',
  generalComment: 'Several styles do not meet the margin floor and vendor cost structures need renegotiation before buyer approval can proceed.',
  flaggedStyles: [
    { styleId: showroomStyles.find((s) => s.podId === 'MW-2')?.product.id ?? 'unknown-1', comment: 'Margin 4 points below floor. Negotiate fabric cost down or switch to alternative supplier.' },
    { styleId: showroomStyles.filter((s) => s.podId === 'MW-2')[1]?.product.id ?? 'unknown-2', comment: 'Silhouette too close to existing carryover — differentiation needed.' },
    { styleId: showroomStyles.filter((s) => s.podId === 'MW-2')[2]?.product.id ?? 'unknown-3', comment: 'Color story conflicts with mood board direction for Urban Streetwear capsule.' },
  ],
  sentBackBy: 'Amit Patel',
  sentBackAt: '2026-02-20T11:30:00Z',
};

export const mockCollectionProgress: CollectionProgress[] = [
  {
    podId: 'MW-1', podName: 'Men Formal', season: 'SS26',
    poolCount: 380, designerShortlistCount: 210, buyerShortlistCount: 140, finalApprovedCount: 120,
    status: 'finalized', completionPercentage: 100, atRisk: false,
    targetNDay: '2026-05-01', designer: 'Arjun Kapoor', buyer: 'Neha Sharma', categoryHead: 'Rajesh Mehta',
  },
  {
    podId: 'MW-2', podName: 'Men Casual', season: 'SS26',
    poolCount: 520, designerShortlistCount: 340, buyerShortlistCount: 220, finalApprovedCount: 0,
    status: 'buyer_review', completionPercentage: 68, atRisk: false,
    targetNDay: '2026-05-15', designer: 'Priya Sharma', buyer: 'Amit Patel', categoryHead: 'Rajesh Mehta',
    sendBacks: [mw2SendBack],
  },
  {
    podId: 'MW-3', podName: 'Men Ethnic', season: 'SS26',
    poolCount: 290, designerShortlistCount: 180, buyerShortlistCount: 120, finalApprovedCount: 100,
    status: 'finalized', completionPercentage: 100, atRisk: false,
    targetNDay: '2026-04-20', designer: 'Vikram Das', buyer: 'Sunita Roy', categoryHead: 'Rajesh Mehta',
  },
  {
    podId: 'WW-1', podName: 'Women Western', season: 'SS26',
    poolCount: 450, designerShortlistCount: 280, buyerShortlistCount: 0, finalApprovedCount: 0,
    status: 'designer_review', completionPercentage: 42, atRisk: true,
    riskReason: 'Still in Designer review, 3 weeks behind schedule',
    targetNDay: '2026-05-10', designer: 'Kavita Singh', buyer: 'Deepa Reddy', categoryHead: 'Sunita Iyer',
  },
  {
    podId: 'WW-2', podName: 'Women Ethnic', season: 'SS26',
    poolCount: 410, designerShortlistCount: 250, buyerShortlistCount: 170, finalApprovedCount: 150,
    status: 'finalized', completionPercentage: 100, atRisk: false,
    targetNDay: '2026-04-25', designer: 'Meera Nair', buyer: 'Ritu Gupta', categoryHead: 'Sunita Iyer',
  },
  {
    podId: 'KW-1', podName: 'Kids Wear', season: 'SS26',
    poolCount: 350, designerShortlistCount: 200, buyerShortlistCount: 130, finalApprovedCount: 110,
    status: 'finalized', completionPercentage: 100, atRisk: false,
    targetNDay: '2026-04-15', designer: 'Ananya Bose', buyer: 'Rahul Verma', categoryHead: 'Sunita Iyer',
  },
];

// ── Showroom Summary ─────────────────────────────────────────────────────

export const mockShowroomSummary: ShowroomSummary = {
  season: 'SS26',
  totalPods: 6,
  podsFinalized: 4,
  totalStylesApproved: 480,
  totalStylesTarget: 630,
  overallCompletion: 76,
  avgMargin: 56.2,
  avgComplianceScore: 87,
  podsAtRisk: 1,
  collections: mockCollectionProgress,
};

// ── Stage Gate Summary ──────────────────────────────────────────────────

export interface StageGateSummary {
  podId: string;
  podName: string;
  currentStage: CollectionProgress['status'];
  totalStyles: number;
  shortlistedCount: number;
  rejectedCount: number;
  pendingCount: number;
  marginPassCount: number;
  marginFailCount: number;
  avgMargin: number;
  complianceScore: number;
  complianceChecks: { name: string; pass: boolean }[];
  readyToAdvance: boolean;
  blockers: string[];
}

export function getStageGateSummary(podId: string): StageGateSummary | null {
  const progress = mockCollectionProgress.find((p) => p.podId === podId);
  if (!progress) return null;

  const podStyles = showroomStyles.filter((s) => s.podId === podId);
  const totalStyles = podStyles.length;

  // Determine which shortlist level to report based on current stage
  let shortlistedCount = 0;
  let rejectedCount = 0;
  let pendingCount = 0;

  if (progress.status === 'designer_review' || progress.status === 'not_started') {
    shortlistedCount = podStyles.filter((s) => s.shortlistStatus.designer === 'shortlisted').length;
    rejectedCount = podStyles.filter((s) => s.shortlistStatus.designer === 'rejected').length;
    pendingCount = podStyles.filter((s) => s.shortlistStatus.designer === 'pending').length;
  } else if (progress.status === 'buyer_review') {
    shortlistedCount = podStyles.filter((s) => s.shortlistStatus.buyer === 'shortlisted').length;
    rejectedCount = podStyles.filter((s) => s.shortlistStatus.buyer === 'rejected').length;
    pendingCount = podStyles.filter((s) => s.shortlistStatus.buyer === 'pending' && s.shortlistStatus.designer === 'shortlisted').length;
  } else if (progress.status === 'cat_head_review') {
    shortlistedCount = podStyles.filter((s) => s.shortlistStatus.categoryHead === 'shortlisted').length;
    rejectedCount = podStyles.filter((s) => s.shortlistStatus.categoryHead === 'rejected').length;
    pendingCount = podStyles.filter((s) => s.shortlistStatus.categoryHead === 'pending' && s.shortlistStatus.buyer === 'shortlisted').length;
  } else {
    // finalized
    shortlistedCount = podStyles.filter((s) => s.curationStage === 'final_approved').length;
    rejectedCount = podStyles.filter((s) => s.shortlistStatus.categoryHead === 'rejected').length;
    pendingCount = 0;
  }

  const marginPassCount = podStyles.filter((s) => s.commercial.marginPass).length;
  const marginFailCount = podStyles.filter((s) => !s.commercial.marginPass).length;
  const avgMargin = totalStyles > 0
    ? Math.round((podStyles.reduce((sum, s) => sum + s.commercial.margin, 0) / totalStyles) * 10) / 10
    : 0;

  // Simplified compliance checks for the gate dialog
  const complianceChecks = [
    { name: 'Option count within target', pass: totalStyles >= 20 },
    { name: 'Margin floor (53%) compliance', pass: marginFailCount <= Math.ceil(totalStyles * 0.1) },
    { name: 'Core/fashion split within tolerance', pass: true },
    { name: 'Price ladder coverage', pass: true },
    { name: 'All pending items reviewed', pass: pendingCount === 0 },
  ];

  const blockers: string[] = [];
  if (marginFailCount > Math.ceil(totalStyles * 0.1)) {
    blockers.push(`${marginFailCount} styles below margin floor — exceeds 10% threshold`);
  }
  if (pendingCount > 0) {
    blockers.push(`${pendingCount} styles still pending review at current stage`);
  }
  if (progress.sendBacks && progress.sendBacks.length > 0) {
    blockers.push('Collection has unresolved send-back comments');
  }

  const readyToAdvance = blockers.length === 0;

  return {
    podId,
    podName: progress.podName,
    currentStage: progress.status,
    totalStyles,
    shortlistedCount,
    rejectedCount,
    pendingCount,
    marginPassCount,
    marginFailCount,
    avgMargin,
    complianceScore: mockConstraintCompliance.overallScore,
    complianceChecks,
    readyToAdvance,
    blockers,
  };
}

// ── Helper: get styles by filter ─────────────────────────────────────────

export function getStylesBySource(source: StyleSource): ShowroomStyle[] {
  return showroomStyles.filter((s) => s.source === source);
}

export function getStylesByStage(stage: CurationStage): ShowroomStyle[] {
  return showroomStyles.filter((s) => s.curationStage === stage);
}

export function getStylesByPod(podId: string): ShowroomStyle[] {
  return showroomStyles.filter((s) => s.podId === podId);
}

export function getStylesForMoodBoard(boardId: string): ShowroomStyle[] {
  return showroomStyles.filter((s) => s.moodBoardIds.includes(boardId));
}

export function getFailingMarginStyles(): ShowroomStyle[] {
  return showroomStyles.filter((s) => !s.commercial.marginPass);
}
