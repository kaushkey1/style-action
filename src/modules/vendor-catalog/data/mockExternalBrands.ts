import type {
  BrandStyle,
  BrandCatalog,
  Slot,
  Session,
  MatchResult,
} from '../types/external-brands.types';

// ─── Mock Brand Styles ───────────────────────────────────────────────────────

const leviStyles: BrandStyle[] = [
  {
    id: 'levi-001',
    brand: "Levi's",
    brandId: 'brand-levis',
    name: "511 Slim Indigo Wash",
    code: 'AAS26DENIM01234',
    mrp: 1699,
    moq: 500,
    wholesaleCost: 850,
    attributes: {
      brick: { value: 'Denim', confidence: 98 },
      fit: { value: 'Slim', confidence: 94 },
      fabric: { value: 'Cotton Blend', confidence: 92 },
      wash: { value: 'Dark Indigo', confidence: 96 },
      pattern: { value: 'Solid', confidence: 100 },
      length: { value: 'Full', confidence: 100 },
    },
    images: ['https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=600&fit=crop&q=80'],  // Dark denim jeans
    sizeRun: ['28', '30', '32', '34', '36', '38', '40'],
    drop: 'FW26 Drop 1',
    colourway: 'Indigo',
    state: 'auto_shortlisted',
  },
  {
    id: 'levi-002',
    brand: "Levi's",
    brandId: 'brand-levis',
    name: "501 Original Stonewash",
    code: 'AAS26DENIM01235',
    mrp: 1999,
    moq: 450,
    wholesaleCost: 950,
    attributes: {
      brick: { value: 'Denim', confidence: 98 },
      fit: { value: 'Regular', confidence: 95 },
      fabric: { value: 'Cotton', confidence: 93 },
      wash: { value: 'Light Stone', confidence: 94 },
      pattern: { value: 'Solid', confidence: 100 },
      length: { value: 'Full', confidence: 100 },
    },
    images: ['https://images.unsplash.com/photo-1555689502-c4b22d76c56f?w=400&h=600&fit=crop&q=80'],  // Light wash denim
    sizeRun: ['28', '30', '32', '34', '36', '38', '40', '42'],
    drop: 'FW26 Drop 1',
    colourway: 'Stone',
    state: 'auto_shortlisted',
  },
  {
    id: 'levi-003',
    brand: "Levi's",
    brandId: 'brand-levis',
    name: "Trucker Jacket Dark Horse",
    code: 'AAS26JACK01236',
    mrp: 3499,
    moq: 300,
    wholesaleCost: 1750,
    attributes: {
      brick: { value: 'Jackets', confidence: 99 },
      fit: { value: 'Regular', confidence: 92 },
      fabric: { value: 'Denim', confidence: 95 },
      wash: { value: 'Dark Horse', confidence: 88 },
      pattern: { value: 'Solid', confidence: 100 },
      length: { value: 'Waist', confidence: 90 },
    },
    images: ['https://images.unsplash.com/photo-1548624313-0396c75e4b9b?w=400&h=600&fit=crop&q=80'],  // Denim jacket
    sizeRun: ['S', 'M', 'L', 'XL', 'XXL'],
    drop: 'FW26 Drop 1',
    colourway: 'Dark Horse',
    state: 'unscored',
  },
  {
    id: 'levi-004',
    brand: "Levi's",
    brandId: 'brand-levis',
    name: "512 Slim Taper Black",
    code: 'AAS26DENIM01237',
    mrp: 1799,
    moq: 400,
    wholesaleCost: 900,
    attributes: {
      brick: { value: 'Denim', confidence: 98 },
      fit: { value: 'Slim', confidence: 96 },
      fabric: { value: 'Cotton Stretch', confidence: 91 },
      wash: { value: 'Black', confidence: 100 },
      pattern: { value: 'Solid', confidence: 100 },
      length: { value: 'Full', confidence: 100 },
    },
    images: ['https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400&h=600&fit=crop&q=80'],  // Black jeans
    sizeRun: ['28', '30', '32', '34', '36', '38'],
    drop: 'FW26 Drop 1',
    colourway: 'Black',
    state: 'auto_shortlisted',
  },
  {
    id: 'levi-005',
    brand: "Levi's",
    brandId: 'brand-levis',
    name: "Graphic Tee White Logo",
    code: 'AAS26TEE01238',
    mrp: 799,
    moq: 600,
    wholesaleCost: 400,
    attributes: {
      brick: { value: 'T-Shirts', confidence: 99 },
      fit: { value: 'Regular', confidence: 95 },
      fabric: { value: 'Cotton', confidence: 98 },
      wash: { value: 'NA', confidence: 100 },
      pattern: { value: 'Graphic', confidence: 100 },
      length: { value: 'Regular', confidence: 100 },
    },
    images: ['https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400&h=600&fit=crop&q=80'],  // Graphic t-shirt
    sizeRun: ['S', 'M', 'L', 'XL', 'XXL'],
    drop: 'FW26 Drop 1',
    colourway: 'White',
    state: 'unscored',
  },
];

const uspaStyles: BrandStyle[] = [
  {
    id: 'uspa-001',
    brand: 'USPA',
    brandId: 'brand-uspa',
    name: 'Classic Polo Navy',
    code: 'AAS26POLO02234',
    mrp: 1299,
    moq: 500,
    wholesaleCost: 650,
    attributes: {
      brick: { value: 'Polos', confidence: 99 },
      fit: { value: 'Regular', confidence: 97 },
      fabric: { value: 'Cotton Pique', confidence: 95 },
      wash: { value: 'NA', confidence: 100 },
      pattern: { value: 'Solid', confidence: 100 },
      length: { value: 'Regular', confidence: 100 },
    },
    images: ['https://images.unsplash.com/photo-1625910513390-a1c48a83d5ce?w=400&h=600&fit=crop&q=80'],  // Navy polo shirt
    sizeRun: ['S', 'M', 'L', 'XL', 'XXL', 'XXXL'],
    drop: 'FW26 Drop 1',
    colourway: 'Navy',
    state: 'auto_shortlisted',
  },
  {
    id: 'uspa-002',
    brand: 'USPA',
    brandId: 'brand-uspa',
    name: 'Stretch Chinos Beige',
    code: 'AAS26CHINO02235',
    mrp: 1599,
    moq: 400,
    wholesaleCost: 800,
    attributes: {
      brick: { value: 'Chinos', confidence: 98 },
      fit: { value: 'Slim', confidence: 93 },
      fabric: { value: 'Cotton Stretch', confidence: 92 },
      wash: { value: 'NA', confidence: 100 },
      pattern: { value: 'Solid', confidence: 100 },
      length: { value: 'Full', confidence: 100 },
    },
    images: ['https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400&h=600&fit=crop&q=80'],  // Beige chinos
    sizeRun: ['28', '30', '32', '34', '36', '38', '40'],
    drop: 'FW26 Drop 1',
    colourway: 'Beige',
    state: 'unscored',
  },
  {
    id: 'uspa-003',
    brand: 'USPA',
    brandId: 'brand-uspa',
    name: 'Windbreaker Jacket Red',
    code: 'AAS26JACK02236',
    mrp: 2499,
    moq: 300,
    wholesaleCost: 1250,
    attributes: {
      brick: { value: 'Jackets', confidence: 99 },
      fit: { value: 'Regular', confidence: 94 },
      fabric: { value: 'Polyester', confidence: 96 },
      wash: { value: 'NA', confidence: 100 },
      pattern: { value: 'Color Block', confidence: 90 },
      length: { value: 'Hip', confidence: 92 },
    },
    images: ['https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=600&fit=crop&q=80'],  // Red windbreaker jacket
    sizeRun: ['S', 'M', 'L', 'XL', 'XXL'],
    drop: 'FW26 Drop 1',
    colourway: 'Red/Navy',
    state: 'auto_shortlisted',
  },
];

const pepeStyles: BrandStyle[] = [
  {
    id: 'pepe-001',
    brand: 'Pepe Jeans',
    brandId: 'brand-pepe',
    name: 'Slim Fit Washed Blue',
    code: 'AAS26DENIM03234',
    mrp: 2299,
    moq: 350,
    wholesaleCost: 1150,
    attributes: {
      brick: { value: 'Denim', confidence: 97 },
      fit: { value: 'Slim', confidence: 95 },
      fabric: { value: 'Cotton Lycra', confidence: 93 },
      wash: { value: 'Medium Blue', confidence: 94 },
      pattern: { value: 'Solid', confidence: 100 },
      length: { value: 'Full', confidence: 100 },
    },
    images: ['https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400&h=600&fit=crop&q=80'],  // Blue jeans
    sizeRun: ['28', '30', '32', '34', '36'],
    drop: 'FW26 Drop 1',
    colourway: 'Blue',
    state: 'auto_shortlisted',
  },
  {
    id: 'pepe-002',
    brand: 'Pepe Jeans',
    brandId: 'brand-pepe',
    name: 'Printed Shirt White Floral',
    code: 'AAS26SHIRT03235',
    mrp: 1799,
    moq: 400,
    wholesaleCost: 900,
    attributes: {
      brick: { value: 'Shirts', confidence: 98 },
      fit: { value: 'Regular', confidence: 96 },
      fabric: { value: 'Cotton', confidence: 97 },
      wash: { value: 'NA', confidence: 100 },
      pattern: { value: 'Floral', confidence: 95 },
      length: { value: 'Regular', confidence: 100 },
    },
    images: ['https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400&h=600&fit=crop&q=80'],  // Floral print shirt
    sizeRun: ['S', 'M', 'L', 'XL', 'XXL'],
    drop: 'FW26 Drop 1',
    colourway: 'White/Blue',
    state: 'unscored',
  },
];

// ─── Mock Slots ──────────────────────────────────────────────────────────────

export const mockSlots: Slot[] = [
  // Denim Slots
  {
    id: 'slot-001',
    brick: 'Denim',
    fashionGrade: 'Fashion Essential',
    priceBand: { min: 1500, max: 1800 },
    attributes: { fit: 'Slim', wash: 'Dark' },
    targetOptions: 4,
    state: 'auto_shortlist_pending',
    shortlist: [],
  },
  {
    id: 'slot-002',
    brick: 'Denim',
    fashionGrade: 'Core',
    priceBand: { min: 1800, max: 2100 },
    attributes: { fit: 'Regular', wash: 'Light' },
    targetOptions: 3,
    state: 'auto_shortlist_pending',
    shortlist: [],
  },
  {
    id: 'slot-003',
    brick: 'Denim',
    fashionGrade: 'Fashion Essential',
    priceBand: { min: 1500, max: 1800 },
    attributes: { fit: 'Slim', wash: 'Black' },
    targetOptions: 2,
    state: 'partial',
    shortlist: [],
  },
  {
    id: 'slot-004',
    brick: 'Denim',
    fashionGrade: 'Fashion Forward',
    priceBand: { min: 2100, max: 2500 },
    attributes: { fit: 'Skinny', wash: 'Distressed' },
    targetOptions: 2,
    state: 'empty',
    shortlist: [],
  },
  // Polo Slots
  {
    id: 'slot-005',
    brick: 'Polos',
    fashionGrade: 'Core',
    priceBand: { min: 1200, max: 1500 },
    attributes: { fit: 'Regular', pattern: 'Solid' },
    targetOptions: 3,
    state: 'auto_shortlist_pending',
    shortlist: [],
  },
  {
    id: 'slot-006',
    brick: 'Polos',
    fashionGrade: 'Fashion Essential',
    priceBand: { min: 1000, max: 1200 },
    attributes: { fit: 'Slim', pattern: 'Striped' },
    targetOptions: 2,
    state: 'empty',
    shortlist: [],
  },
  // Jackets Slots
  {
    id: 'slot-007',
    brick: 'Jackets',
    fashionGrade: 'Fashion Forward',
    priceBand: { min: 3000, max: 4000 },
    attributes: { fit: 'Regular', material: 'Denim' },
    targetOptions: 2,
    state: 'empty',
    shortlist: [],
  },
  {
    id: 'slot-008',
    brick: 'Jackets',
    fashionGrade: 'Core',
    priceBand: { min: 2000, max: 3000 },
    attributes: { fit: 'Regular', material: 'Polyester' },
    targetOptions: 3,
    state: 'auto_shortlist_pending',
    shortlist: [],
  },
  // Chinos Slots
  {
    id: 'slot-009',
    brick: 'Chinos',
    fashionGrade: 'Core',
    priceBand: { min: 1500, max: 2000 },
    attributes: { fit: 'Slim', color: 'Neutral' },
    targetOptions: 3,
    state: 'empty',
    shortlist: [],
  },
  // Shirts Slots
  {
    id: 'slot-010',
    brick: 'Shirts',
    fashionGrade: 'Fashion Essential',
    priceBand: { min: 1500, max: 2000 },
    attributes: { fit: 'Regular', pattern: 'Printed' },
    targetOptions: 4,
    state: 'empty',
    shortlist: [],
  },
];

// ─── Mock Catalog ────────────────────────────────────────────────────────────

export const mockCatalog: BrandCatalog = {
  id: 'catalog-001',
  brand: 'Multi-Brand',
  brandId: 'multi',
  category: 'Mens Casual',
  season: 'FW26',
  drop: 'Drop 1',
  styles: [...leviStyles, ...uspaStyles, ...pepeStyles],
  receivedAt: new Date('2024-04-20T10:00:00'),
};

// ─── Mock Match Results ──────────────────────────────────────────────────────

export const mockMatchResults: MatchResult[] = [
  // Levi's 511 Slim Indigo - Perfect match for slot-001
  {
    styleId: 'levi-001',
    slotId: 'slot-001',
    score: 92,
    breakdown: [
      { attribute: 'brick', status: 'match', note: 'Denim match' },
      { attribute: 'price', status: 'match', note: '₹1699 in range ₹1500-1800' },
      { attribute: 'fit', status: 'match', note: 'Slim match' },
      { attribute: 'wash', status: 'match', note: 'Dark match' },
    ],
    hardFilterFailed: false,
  },
  // Levi's 501 Original - Good match for slot-002
  {
    styleId: 'levi-002',
    slotId: 'slot-002',
    score: 87,
    breakdown: [
      { attribute: 'brick', status: 'match' },
      { attribute: 'price', status: 'match' },
      { attribute: 'fit', status: 'match' },
      { attribute: 'wash', status: 'partial', note: 'Light Stone vs Light' },
    ],
    hardFilterFailed: false,
  },
  // Levi's 512 Black - Good match for slot-003
  {
    styleId: 'levi-004',
    slotId: 'slot-003',
    score: 94,
    breakdown: [
      { attribute: 'brick', status: 'match' },
      { attribute: 'price', status: 'match' },
      { attribute: 'fit', status: 'match' },
      { attribute: 'wash', status: 'match', note: 'Black match' },
    ],
    hardFilterFailed: false,
  },
  // USPA Polo - Perfect for slot-005
  {
    styleId: 'uspa-001',
    slotId: 'slot-005',
    score: 95,
    breakdown: [
      { attribute: 'brick', status: 'match' },
      { attribute: 'price', status: 'match' },
      { attribute: 'fit', status: 'match' },
      { attribute: 'pattern', status: 'match' },
    ],
    hardFilterFailed: false,
  },
  // USPA Windbreaker - Good for slot-008
  {
    styleId: 'uspa-003',
    slotId: 'slot-008',
    score: 85,
    breakdown: [
      { attribute: 'brick', status: 'match' },
      { attribute: 'price', status: 'match' },
      { attribute: 'fit', status: 'match' },
      { attribute: 'material', status: 'match' },
    ],
    hardFilterFailed: false,
  },
  // Pepe Slim Fit - Alternative for slot-001
  {
    styleId: 'pepe-001',
    slotId: 'slot-001',
    score: 81,
    breakdown: [
      { attribute: 'brick', status: 'match' },
      { attribute: 'price', status: 'partial', note: '₹2299 slightly above ₹1800' },
      { attribute: 'fit', status: 'match' },
      { attribute: 'wash', status: 'partial', note: 'Medium vs Dark' },
    ],
    hardFilterFailed: false,
  },
  // Lower scoring matches (60-79%)
  {
    styleId: 'levi-003',
    slotId: 'slot-007',
    score: 78,
    breakdown: [
      { attribute: 'brick', status: 'match' },
      { attribute: 'price', status: 'match' },
      { attribute: 'fit', status: 'match' },
      { attribute: 'material', status: 'match' },
    ],
    hardFilterFailed: false,
  },
  {
    styleId: 'uspa-002',
    slotId: 'slot-009',
    score: 72,
    breakdown: [
      { attribute: 'brick', status: 'match' },
      { attribute: 'price', status: 'match' },
      { attribute: 'fit', status: 'match' },
      { attribute: 'color', status: 'match' },
    ],
    hardFilterFailed: false,
  },
  {
    styleId: 'pepe-002',
    slotId: 'slot-010',
    score: 68,
    breakdown: [
      { attribute: 'brick', status: 'match' },
      { attribute: 'price', status: 'match' },
      { attribute: 'fit', status: 'match' },
      { attribute: 'pattern', status: 'partial' },
    ],
    hardFilterFailed: false,
  },
];

// ─── Mock Session ────────────────────────────────────────────────────────────

export const mockSession: Session = {
  id: 'session-001',
  categoryId: 'cat-mens-casual',
  categoryName: 'Mens Casual',
  name: 'FW26 Drop 1 - Mens Casual Curation',
  dropId: 'drop-fw26-1',
  dropLabel: 'FW26 Drop 1',
  mode: 'curate',
  status: 'in_curation',
  catalog: mockCatalog,
  createdAt: new Date('2024-04-20T10:00:00'),
  updatedAt: new Date('2024-04-20T10:30:00'),
};

export const mockSessions: Session[] = [mockSession];

export const mockStyles = [...leviStyles, ...uspaStyles, ...pepeStyles];

// ─── Helper Functions ────────────────────────────────────────────────────────

export function getStyleById(styleId: string): BrandStyle | undefined {
  return mockCatalog.styles.find(s => s.id === styleId);
}

export function getSlotById(slotId: string): Slot | undefined {
  return mockSlots.find(s => s.id === slotId);
}

export function getMatchesForSlot(slotId: string): MatchResult[] {
  return mockMatchResults.filter(m => m.slotId === slotId);
}

export function getMatchesForStyle(styleId: string): MatchResult[] {
  return mockMatchResults.filter(m => m.styleId === styleId);
}

export function getAutoShortlistedStyles(): MatchResult[] {
  return mockMatchResults.filter(m => m.score >= 80);
}

export function getUnscoredStyles(): MatchResult[] {
  return mockMatchResults.filter(m => m.score >= 60 && m.score < 80);
}

// ─── Mock Brand Concentration ────────────────────────────────────────────────

export function calculateBrandConcentration() {
  // This would normally calculate from actual confirmed styles
  // const brandCounts = new Map<string, number>();
  // const totalConfirmed = 0; // Will be calculated from confirmed shortlists
  return [
    { brand: "Levi's", confirmedCount: 3, percentageOfCategory: 11.2, cap: 10, isOverCap: true },
    { brand: 'USPA', confirmedCount: 2, percentageOfCategory: 8.8, cap: 10, isOverCap: false },
    { brand: 'Pepe Jeans', confirmedCount: 1, percentageOfCategory: 5.9, cap: 10, isOverCap: false },
  ];
}

// ─── Mock Coverage Metrics ───────────────────────────────────────────────────

export function calculateCoverageMetrics() {
  const metrics = {
    totalSlots: mockSlots.length,
    coveredSlots: mockSlots.filter(s => s.state === 'covered').length,
    partialSlots: mockSlots.filter(s => s.state === 'partial').length,
    pendingSlots: mockSlots.filter(s => s.state === 'auto_shortlist_pending').length,
    acceptedGaps: mockSlots.filter(s => s.state === 'accepted_gap').length,
    emptySlots: mockSlots.filter(s => s.state === 'empty').length,
    confirmedStyles: 0, // Will be calculated from actual shortlists
    pendingStyles: getAutoShortlistedStyles().length,
  };
  return metrics;
}