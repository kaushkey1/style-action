// Mock data for Buying Module v2 — demand-led buying UI
// Covers: Buy Plan hierarchy, OTB Review, Exception Queue, Test & Scale, PO Review

// ─── Types ───────────────────────────────────────────────────────────────────

export type BPStage =
  | 'planning'
  | 'demand_calc'
  | 'buyer_review'
  | 'cat_approval'
  | 'commercial'
  | 'otb_review'
  | 'released'

export type CTLStatus = 'pass' | 'fail' | 'warn'
export type OptionStatus = 'ready' | 'held' | 'exception' | 'new_option'
export type ExceptionApprovalStep =
  | 'buyer'
  | 'format-head'
  | 'financial-commercial-admin'
  | 'ceo'

export type OTBMonthStatus = 'draft' | 'exceptions_pending' | 'pending_cfo' | 'approved'
export type POStatus = 'pending' | 'approved' | 'flagged' | 'released'
export type TestScaleStatus = 'in_test' | 'scale_triggered' | 'below_target' | 'closed'
export type ExceptionStatus = 'pending' | 'approved' | 'rejected'

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface BuyPlanMonth {
  saleMonth: string       // e.g. '2026-10'
  label: string           // e.g. 'October 2026'
  year: number
  monthNum: number        // 1-12
  stage: BPStage
  categories: number
  optionsTotal: number
  flaggedCount: number
  heldCount: number
  otbValueLakh: number
}

export interface BuyPlanSubcategoryRef {
  code: string
  name: string
  optionsCount: number
  sysBuyQty: number
  stage: BPStage
}

export interface BuyPlanCategory {
  code: string
  name: string
  stage: BPStage
  subcategories: BuyPlanSubcategoryRef[]
  heldCount: number
  optionsCount: number
  otbValue: number        // in Lakh
  saleMonth: string
  totalSysQty?: number
}

export interface BuyPlanBrickRef {
  code: string
  name: string
}

export interface BuyPlanSubcategory {
  code: string
  name: string
  catCode: string
  bricks: BuyPlanBrickRef[]
  brickCount: number
  optionsCount: number
  sysBuyQty: number
  heldCount: number
  flaggedCount: number
  stage: BPStage
}

export interface BuyPlanBrick {
  code: string
  name: string
  subCode: string
  optionsCount: number
  sysBuyQty: number
  plannerQty: number      // default = sysBuyQty
  variancePct: number
  heldCount: number
  ctl01Summary: CTLStatus   // worst of all options
  ctl02Summary: CTLStatus
  ctl03Summary: CTLStatus
}

export interface BuyPlanOption {
  code: string
  segment: string
  family: string
  class_name: string
  brand: string
  neckType: string
  sleeveType: string
  fit: string
  fabric: string
  pattern: string
  mrp: number
  cost: number
  intakeMarginPct: number
  trueRos: number
  fwdRos: number
  sysBuyQty: number
  plannerQty: number      // starts equal to sysBuyQty
  ctl01: CTLStatus
  ctl02: CTLStatus
  ctl03: CTLStatus
  status: OptionStatus
  isNewOption: boolean
  brickCode: string
  calcQty?: number   // computed qty even for held options (what would have been bought absent CTL failure)
  // Card view fields (enriched at read time)
  styleId?: string
  colorName?: string
  hexCode?: string
  imageUrl?: string
}

export interface OTBException {
  id: string
  description: string
  systemValue: string
  proposedValue: string
  reason: string
  type: string
}

export interface OTBCategoryRow {
  code: string
  category: string
  otbRequested: number    // Lakh
  otbApproved: number     // Lakh
  marginPct: number
  exceptions: OTBException[]
  status: 'pending' | 'approved' | 'rejected' | 'held'
}

export interface OTBMonth {
  saleMonth: string
  label: string
  categories: number
  otbRequested: number    // Lakh
  otbApproved: number     // Lakh
  exceptionsPending: number
  intakeMarginPct: number
  deadline: string
  otbPeriodEnd: string
  status: OTBMonthStatus
}

export interface ExceptionItem {
  id: string
  type: 'CTL_OVERRIDE' | 'AOP_UPLIFT' | 'SCALE_TRIGGER' | 'MARGIN_OVERRIDE' | 'VENDOR_MBQ'
  otbRef: string
  saleMonth: string
  category: string
  optionCode: string
  systemValue: string
  proposedValue: string
  reason: string
  raisedBy: string
  currentApprovalStep: ExceptionApprovalStep
  status: ExceptionStatus
}

export interface TestScaleOption {
  id: string
  optionCode: string
  category: string
  brick: string
  testStores: number
  depthPerStore: number
  windowStart: string
  daysElapsed: number
  measuredRos: number
  targetRos: number
  status: TestScaleStatus
}

export interface POCheckResult {
  check: string
  passed: boolean
}

export interface POItem {
  id: string
  poNumber: string
  vendor: string
  category: string
  brick: string
  totalUnits: number
  totalValueLakh: number
  deliveryDate: string
  otbRef: string
  storeCount: number
  checks: POCheckResult[]
  checksPassed: number
  checksFailed: number
  status: POStatus
  releaseDate?: string
  saleMonth: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function worstCTL(...statuses: CTLStatus[]): CTLStatus {
  if (statuses.includes('fail')) return 'fail'
  if (statuses.includes('warn')) return 'warn'
  return 'pass'
}

const COLOR_NAME: Record<string, string> = {
  WHT: 'White', BLK: 'Black', NVY: 'Navy', GRY: 'Grey', RED: 'Red',
  STR: 'Striped', BLU: 'Blue', GRN: 'Green', BEI: 'Beige', OLV: 'Olive',
  BRN: 'Brown', KHK: 'Khaki', NEW: 'Natural',
}
const COLOR_HEX: Record<string, string> = {
  WHT: '#F5F5F5', BLK: '#1A1A1A', NVY: '#1B2A4A', GRY: '#808080', RED: '#DC2626',
  STR: '#6B7280', BLU: '#3B82F6', GRN: '#22C55E', BEI: '#D4B896', OLV: '#6B7C4A',
  BRN: '#8B5E3C', KHK: '#C3A882', NEW: '#E8DDD0',
}

function enrichOptions(opts: BuyPlanOption[]): BuyPlanOption[] {
  const styleIdMap: Record<string, string> = {}
  let styleCounter = 0
  return opts.map((opt, i) => {
    const parts = opt.code.split('-')
    const colorSuffix = parts[parts.length - 1] ?? 'Unknown'
    if (!styleIdMap[opt.class_name]) {
      styleCounter++
      styleIdMap[opt.class_name] = `${opt.brickCode}-STY-${styleCounter}`
    }
    return {
      ...opt,
      styleId: styleIdMap[opt.class_name],
      colorName: COLOR_NAME[colorSuffix] ?? colorSuffix,
      hexCode: COLOR_HEX[colorSuffix] ?? '#888888',
      imageUrl: `https://picsum.photos/seed/${opt.brickCode}-${i + 1}/200/260`,
    }
  })
}

// ─── Options Data ─────────────────────────────────────────────────────────────

const CNT_OPTIONS: BuyPlanOption[] = [
  { code: 'CNT-001-WHT', segment: 'Fashion', family: 'Tops', class_name: 'Crew Neck T-Shirt', brand: 'Roadster', neckType: 'Crew', sleeveType: 'Half', fit: 'Regular', fabric: 'Cotton Jersey', pattern: 'Solid', mrp: 799, cost: 280, intakeMarginPct: 64.9, trueRos: 2.4, fwdRos: 2.1, sysBuyQty: 3600, plannerQty: 3600, ctl01: 'pass', ctl02: 'pass', ctl03: 'pass', status: 'ready', isNewOption: false, brickCode: 'CNT' },
  { code: 'CNT-002-BLK', segment: 'Fashion', family: 'Tops', class_name: 'Crew Neck T-Shirt', brand: 'Roadster', neckType: 'Crew', sleeveType: 'Half', fit: 'Regular', fabric: 'Cotton Jersey', pattern: 'Solid', mrp: 799, cost: 280, intakeMarginPct: 64.9, trueRos: 1.9, fwdRos: 1.7, sysBuyQty: 2880, plannerQty: 2880, ctl01: 'pass', ctl02: 'warn', ctl03: 'pass', status: 'ready', isNewOption: false, brickCode: 'CNT' },
  { code: 'CNT-003-NVY', segment: 'Fashion', family: 'Tops', class_name: 'Crew Neck T-Shirt', brand: 'Roadster', neckType: 'Crew', sleeveType: 'Half', fit: 'Slim', fabric: 'Cotton Jersey', pattern: 'Solid', mrp: 799, cost: 285, intakeMarginPct: 64.3, trueRos: 1.6, fwdRos: 1.4, sysBuyQty: 2400, plannerQty: 2400, ctl01: 'pass', ctl02: 'pass', ctl03: 'pass', status: 'ready', isNewOption: false, brickCode: 'CNT' },
  { code: 'CNT-004-GRY', segment: 'Fashion', family: 'Tops', class_name: 'Crew Neck T-Shirt', brand: 'Mast & Harbour', neckType: 'Crew', sleeveType: 'Half', fit: 'Regular', fabric: 'Pima Cotton', pattern: 'Solid', mrp: 899, cost: 320, intakeMarginPct: 64.4, trueRos: 1.2, fwdRos: 1.0, sysBuyQty: 1800, plannerQty: 1800, ctl01: 'pass', ctl02: 'pass', ctl03: 'pass', status: 'ready', isNewOption: false, brickCode: 'CNT' },
  { code: 'CNT-005-RED', segment: 'Fashion', family: 'Tops', class_name: 'Crew Neck T-Shirt', brand: 'HRX', neckType: 'Crew', sleeveType: 'Half', fit: 'Regular', fabric: 'Polyester Blend', pattern: 'Solid', mrp: 699, cost: 240, intakeMarginPct: 65.7, trueRos: 0.6, fwdRos: 0.5, sysBuyQty: 0, plannerQty: 0, calcQty: 1080, ctl01: 'fail', ctl02: 'pass', ctl03: 'fail', status: 'held', isNewOption: false, brickCode: 'CNT' },
  { code: 'CNT-006-STR', segment: 'Fashion', family: 'Tops', class_name: 'Crew Neck T-Shirt', brand: 'Roadster', neckType: 'Crew', sleeveType: 'Half', fit: 'Regular', fabric: 'Cotton Blend', pattern: 'Striped', mrp: 849, cost: 300, intakeMarginPct: 64.7, trueRos: 0.0, fwdRos: 0.0, sysBuyQty: 0, plannerQty: 0, calcQty: 600, ctl01: 'fail', ctl02: 'pass', ctl03: 'fail', status: 'held', isNewOption: false, brickCode: 'CNT' },
  { code: 'CNT-007-NEW', segment: 'Fashion', family: 'Tops', class_name: 'Crew Neck T-Shirt', brand: 'Here&Now', neckType: 'Crew', sleeveType: 'Half', fit: 'Oversized', fabric: 'Cotton Jersey', pattern: 'Solid', mrp: 999, cost: 360, intakeMarginPct: 63.9, trueRos: 0.0, fwdRos: 1.8, sysBuyQty: 1200, plannerQty: 1200, ctl01: 'pass', ctl02: 'pass', ctl03: 'pass', status: 'new_option', isNewOption: true, brickCode: 'CNT' },
]

const VNT_OPTIONS: BuyPlanOption[] = [
  { code: 'VNT-001-WHT', segment: 'Fashion', family: 'Tops', class_name: 'V-Neck T-Shirt', brand: 'Roadster', neckType: 'V-Neck', sleeveType: 'Half', fit: 'Regular', fabric: 'Cotton Jersey', pattern: 'Solid', mrp: 799, cost: 275, intakeMarginPct: 65.6, trueRos: 2.1, fwdRos: 1.9, sysBuyQty: 3240, plannerQty: 3240, ctl01: 'pass', ctl02: 'pass', ctl03: 'pass', status: 'ready', isNewOption: false, brickCode: 'VNT' },
  { code: 'VNT-002-BLK', segment: 'Fashion', family: 'Tops', class_name: 'V-Neck T-Shirt', brand: 'Roadster', neckType: 'V-Neck', sleeveType: 'Half', fit: 'Regular', fabric: 'Cotton Jersey', pattern: 'Solid', mrp: 799, cost: 275, intakeMarginPct: 65.6, trueRos: 1.7, fwdRos: 1.5, sysBuyQty: 2520, plannerQty: 2520, ctl01: 'pass', ctl02: 'warn', ctl03: 'pass', status: 'ready', isNewOption: false, brickCode: 'VNT' },
  { code: 'VNT-003-GRY', segment: 'Fashion', family: 'Tops', class_name: 'V-Neck T-Shirt', brand: 'Mast & Harbour', neckType: 'V-Neck', sleeveType: 'Half', fit: 'Slim', fabric: 'Pima Cotton', pattern: 'Solid', mrp: 899, cost: 315, intakeMarginPct: 64.9, trueRos: 1.3, fwdRos: 1.1, sysBuyQty: 1800, plannerQty: 1800, ctl01: 'pass', ctl02: 'pass', ctl03: 'pass', status: 'ready', isNewOption: false, brickCode: 'VNT' },
  { code: 'VNT-004-BLU', segment: 'Fashion', family: 'Tops', class_name: 'V-Neck T-Shirt', brand: 'HRX', neckType: 'V-Neck', sleeveType: 'Half', fit: 'Regular', fabric: 'Polyester Blend', pattern: 'Solid', mrp: 699, cost: 238, intakeMarginPct: 65.9, trueRos: 0.4, fwdRos: 0.3, sysBuyQty: 0, plannerQty: 0, calcQty: 720, ctl01: 'fail', ctl02: 'pass', ctl03: 'fail', status: 'held', isNewOption: false, brickCode: 'VNT' },
  { code: 'VNT-005-NEW', segment: 'Fashion', family: 'Tops', class_name: 'V-Neck T-Shirt', brand: 'Here&Now', neckType: 'V-Neck', sleeveType: 'Half', fit: 'Oversized', fabric: 'Cotton Blend', pattern: 'Solid', mrp: 949, cost: 340, intakeMarginPct: 64.2, trueRos: 0.0, fwdRos: 1.6, sysBuyQty: 960, plannerQty: 960, ctl01: 'pass', ctl02: 'pass', ctl03: 'pass', status: 'new_option', isNewOption: true, brickCode: 'VNT' },
]

const PLO_OPTIONS: BuyPlanOption[] = [
  { code: 'PLO-001-WHT', segment: 'Fashion', family: 'Tops', class_name: 'Polo T-Shirt', brand: 'Polo Haus', neckType: 'Polo', sleeveType: 'Half', fit: 'Regular', fabric: 'Pique Cotton', pattern: 'Solid', mrp: 1199, cost: 420, intakeMarginPct: 65.0, trueRos: 1.8, fwdRos: 1.6, sysBuyQty: 2880, plannerQty: 2880, ctl01: 'pass', ctl02: 'pass', ctl03: 'pass', status: 'ready', isNewOption: false, brickCode: 'PLO' },
  { code: 'PLO-002-NVY', segment: 'Fashion', family: 'Tops', class_name: 'Polo T-Shirt', brand: 'Polo Haus', neckType: 'Polo', sleeveType: 'Half', fit: 'Regular', fabric: 'Pique Cotton', pattern: 'Solid', mrp: 1199, cost: 420, intakeMarginPct: 65.0, trueRos: 1.5, fwdRos: 1.3, sysBuyQty: 2160, plannerQty: 2160, ctl01: 'pass', ctl02: 'warn', ctl03: 'pass', status: 'ready', isNewOption: false, brickCode: 'PLO' },
  { code: 'PLO-003-GRN', segment: 'Fashion', family: 'Tops', class_name: 'Polo T-Shirt', brand: 'Roadster', neckType: 'Polo', sleeveType: 'Half', fit: 'Slim', fabric: 'Cotton Lycra', pattern: 'Solid', mrp: 999, cost: 350, intakeMarginPct: 65.0, trueRos: 1.1, fwdRos: 1.0, sysBuyQty: 1680, plannerQty: 1680, ctl01: 'pass', ctl02: 'pass', ctl03: 'pass', status: 'ready', isNewOption: false, brickCode: 'PLO' },
  { code: 'PLO-004-BLK', segment: 'Fashion', family: 'Tops', class_name: 'Polo T-Shirt', brand: 'Polo Haus', neckType: 'Polo', sleeveType: 'Half', fit: 'Regular', fabric: 'Pique Cotton', pattern: 'Striped', mrp: 1299, cost: 460, intakeMarginPct: 64.6, trueRos: 0.3, fwdRos: 0.2, sysBuyQty: 0, plannerQty: 0, calcQty: 480, ctl01: 'fail', ctl02: 'fail', ctl03: 'fail', status: 'held', isNewOption: false, brickCode: 'PLO' },
  { code: 'PLO-005-NEW', segment: 'Fashion', family: 'Tops', class_name: 'Polo T-Shirt', brand: 'Here&Now', neckType: 'Polo', sleeveType: 'Half', fit: 'Oversized', fabric: 'Pique Cotton', pattern: 'Solid', mrp: 1399, cost: 500, intakeMarginPct: 64.3, trueRos: 0.0, fwdRos: 1.4, sysBuyQty: 840, plannerQty: 840, ctl01: 'pass', ctl02: 'pass', ctl03: 'pass', status: 'new_option', isNewOption: true, brickCode: 'PLO' },
]

const DNM_OPTIONS: BuyPlanOption[] = [
  { code: 'DNM-001-BLU', segment: 'Fashion', family: 'Bottoms', class_name: 'Denim', brand: 'Roadster', neckType: '-', sleeveType: '-', fit: 'Slim', fabric: 'Denim Twill', pattern: 'Solid', mrp: 1799, cost: 620, intakeMarginPct: 65.5, trueRos: 1.6, fwdRos: 1.4, sysBuyQty: 2400, plannerQty: 2400, ctl01: 'pass', ctl02: 'pass', ctl03: 'pass', status: 'ready', isNewOption: false, brickCode: 'DNM' },
  { code: 'DNM-002-BLK', segment: 'Fashion', family: 'Bottoms', class_name: 'Denim', brand: 'Roadster', neckType: '-', sleeveType: '-', fit: 'Slim', fabric: 'Denim Twill', pattern: 'Solid', mrp: 1799, cost: 620, intakeMarginPct: 65.5, trueRos: 1.3, fwdRos: 1.1, sysBuyQty: 1920, plannerQty: 1920, ctl01: 'pass', ctl02: 'warn', ctl03: 'pass', status: 'ready', isNewOption: false, brickCode: 'DNM' },
  { code: 'DNM-003-GRY', segment: 'Fashion', family: 'Bottoms', class_name: 'Denim', brand: 'Mast & Harbour', neckType: '-', sleeveType: '-', fit: 'Regular', fabric: 'Stretch Denim', pattern: 'Solid', mrp: 1999, cost: 700, intakeMarginPct: 65.0, trueRos: 1.0, fwdRos: 0.9, sysBuyQty: 1560, plannerQty: 1560, ctl01: 'pass', ctl02: 'pass', ctl03: 'pass', status: 'ready', isNewOption: false, brickCode: 'DNM' },
  { code: 'DNM-004-WHT', segment: 'Fashion', family: 'Bottoms', class_name: 'Denim', brand: 'HRX', neckType: '-', sleeveType: '-', fit: 'Regular', fabric: 'Denim Twill', pattern: 'Solid', mrp: 1599, cost: 545, intakeMarginPct: 65.9, trueRos: 0.5, fwdRos: 0.4, sysBuyQty: 0, plannerQty: 0, calcQty: 840, ctl01: 'fail', ctl02: 'pass', ctl03: 'fail', status: 'held', isNewOption: false, brickCode: 'DNM' },
  { code: 'DNM-005-NEW', segment: 'Fashion', family: 'Bottoms', class_name: 'Denim', brand: 'Here&Now', neckType: '-', sleeveType: '-', fit: 'Skinny', fabric: 'Stretch Denim', pattern: 'Solid', mrp: 2199, cost: 780, intakeMarginPct: 64.5, trueRos: 0.0, fwdRos: 1.2, sysBuyQty: 840, plannerQty: 840, ctl01: 'pass', ctl02: 'pass', ctl03: 'pass', status: 'new_option', isNewOption: true, brickCode: 'DNM' },
]

const CHN_OPTIONS: BuyPlanOption[] = [
  { code: 'CHN-001-BEI', segment: 'Fashion', family: 'Bottoms', class_name: 'Chinos', brand: 'Mast & Harbour', neckType: '-', sleeveType: '-', fit: 'Slim', fabric: 'Cotton Twill', pattern: 'Solid', mrp: 1499, cost: 515, intakeMarginPct: 65.6, trueRos: 1.4, fwdRos: 1.2, sysBuyQty: 2160, plannerQty: 2160, ctl01: 'pass', ctl02: 'pass', ctl03: 'pass', status: 'ready', isNewOption: false, brickCode: 'CHN' },
  { code: 'CHN-002-NVY', segment: 'Fashion', family: 'Bottoms', class_name: 'Chinos', brand: 'Mast & Harbour', neckType: '-', sleeveType: '-', fit: 'Regular', fabric: 'Cotton Twill', pattern: 'Solid', mrp: 1499, cost: 515, intakeMarginPct: 65.6, trueRos: 1.1, fwdRos: 1.0, sysBuyQty: 1680, plannerQty: 1680, ctl01: 'pass', ctl02: 'warn', ctl03: 'pass', status: 'ready', isNewOption: false, brickCode: 'CHN' },
  { code: 'CHN-003-GRN', segment: 'Fashion', family: 'Bottoms', class_name: 'Chinos', brand: 'Roadster', neckType: '-', sleeveType: '-', fit: 'Slim', fabric: 'Stretch Twill', pattern: 'Solid', mrp: 1299, cost: 445, intakeMarginPct: 65.7, trueRos: 0.7, fwdRos: 0.6, sysBuyQty: 960, plannerQty: 960, ctl01: 'pass', ctl02: 'pass', ctl03: 'pass', status: 'ready', isNewOption: false, brickCode: 'CHN' },
  { code: 'CHN-004-BRN', segment: 'Fashion', family: 'Bottoms', class_name: 'Chinos', brand: 'HRX', neckType: '-', sleeveType: '-', fit: 'Regular', fabric: 'Cotton Twill', pattern: 'Solid', mrp: 1199, cost: 408, intakeMarginPct: 66.0, trueRos: 0.4, fwdRos: 0.3, sysBuyQty: 0, plannerQty: 0, calcQty: 720, ctl01: 'fail', ctl02: 'pass', ctl03: 'fail', status: 'held', isNewOption: false, brickCode: 'CHN' },
]

const CAS_SHT_OPTIONS: BuyPlanOption[] = [
  { code: 'CAS-SHT-001-BLU', segment: 'Fashion', family: 'Shorts', class_name: 'Casual Shorts', brand: 'Roadster', neckType: '-', sleeveType: '-', fit: 'Regular', fabric: 'Cotton Blend', pattern: 'Solid', mrp: 999, cost: 348, intakeMarginPct: 65.2, trueRos: 1.9, fwdRos: 1.7, sysBuyQty: 2880, plannerQty: 2880, ctl01: 'pass', ctl02: 'pass', ctl03: 'pass', status: 'ready', isNewOption: false, brickCode: 'CAS-SHT' },
  { code: 'CAS-SHT-002-KHK', segment: 'Fashion', family: 'Shorts', class_name: 'Casual Shorts', brand: 'Roadster', neckType: '-', sleeveType: '-', fit: 'Regular', fabric: 'Cotton Twill', pattern: 'Solid', mrp: 999, cost: 348, intakeMarginPct: 65.2, trueRos: 1.5, fwdRos: 1.3, sysBuyQty: 2160, plannerQty: 2160, ctl01: 'pass', ctl02: 'warn', ctl03: 'pass', status: 'ready', isNewOption: false, brickCode: 'CAS-SHT' },
  { code: 'CAS-SHT-003-GRY', segment: 'Fashion', family: 'Shorts', class_name: 'Casual Shorts', brand: 'Mast & Harbour', neckType: '-', sleeveType: '-', fit: 'Slim', fabric: 'Cotton Blend', pattern: 'Solid', mrp: 1199, cost: 425, intakeMarginPct: 64.6, trueRos: 1.1, fwdRos: 0.9, sysBuyQty: 1560, plannerQty: 1560, ctl01: 'pass', ctl02: 'pass', ctl03: 'pass', status: 'ready', isNewOption: false, brickCode: 'CAS-SHT' },
  { code: 'CAS-SHT-004-BRN', segment: 'Fashion', family: 'Shorts', class_name: 'Casual Shorts', brand: 'HRX', neckType: '-', sleeveType: '-', fit: 'Regular', fabric: 'Polyester', pattern: 'Solid', mrp: 799, cost: 270, intakeMarginPct: 66.2, trueRos: 0.3, fwdRos: 0.2, sysBuyQty: 0, plannerQty: 0, calcQty: 480, ctl01: 'fail', ctl02: 'pass', ctl03: 'fail', status: 'held', isNewOption: false, brickCode: 'CAS-SHT' },
]

const SPT_SHT_OPTIONS: BuyPlanOption[] = [
  { code: 'SPT-SHT-001-BLK', segment: 'Fashion', family: 'Shorts', class_name: 'Sport Shorts', brand: 'HRX', neckType: '-', sleeveType: '-', fit: 'Regular', fabric: 'Polyester Dryfit', pattern: 'Solid', mrp: 699, cost: 238, intakeMarginPct: 65.9, trueRos: 2.2, fwdRos: 2.0, sysBuyQty: 3360, plannerQty: 3360, ctl01: 'pass', ctl02: 'pass', ctl03: 'pass', status: 'ready', isNewOption: false, brickCode: 'SPT-SHT' },
  { code: 'SPT-SHT-002-BLU', segment: 'Fashion', family: 'Shorts', class_name: 'Sport Shorts', brand: 'HRX', neckType: '-', sleeveType: '-', fit: 'Regular', fabric: 'Polyester Dryfit', pattern: 'Solid', mrp: 699, cost: 238, intakeMarginPct: 65.9, trueRos: 1.8, fwdRos: 1.6, sysBuyQty: 2640, plannerQty: 2640, ctl01: 'pass', ctl02: 'pass', ctl03: 'pass', status: 'ready', isNewOption: false, brickCode: 'SPT-SHT' },
  { code: 'SPT-SHT-003-GRY', segment: 'Fashion', family: 'Shorts', class_name: 'Sport Shorts', brand: 'Kappa', neckType: '-', sleeveType: '-', fit: 'Regular', fabric: 'Polyester Blend', pattern: 'Printed', mrp: 899, cost: 312, intakeMarginPct: 65.3, trueRos: 1.4, fwdRos: 1.2, sysBuyQty: 2040, plannerQty: 2040, ctl01: 'pass', ctl02: 'warn', ctl03: 'pass', status: 'ready', isNewOption: false, brickCode: 'SPT-SHT' },
  { code: 'SPT-SHT-004-NEW', segment: 'Fashion', family: 'Shorts', class_name: 'Sport Shorts', brand: 'Campus', neckType: '-', sleeveType: '-', fit: 'Regular', fabric: 'Polyester', pattern: 'Printed', mrp: 999, cost: 355, intakeMarginPct: 64.5, trueRos: 0.0, fwdRos: 1.5, sysBuyQty: 720, plannerQty: 720, ctl01: 'pass', ctl02: 'pass', ctl03: 'pass', status: 'new_option', isNewOption: true, brickCode: 'SPT-SHT' },
]

const FSH_OPTIONS: BuyPlanOption[] = [
  { code: 'FSH-001-WHT', segment: 'Ultimate', family: 'Formal Shirts', class_name: 'Formal Shirt', brand: 'Arrow', neckType: 'Spread', sleeveType: 'Full', fit: 'Slim', fabric: 'Cotton Poplin', pattern: 'Solid', mrp: 2099, cost: 776, intakeMarginPct: 63.0, trueRos: 1.5, fwdRos: 1.3, sysBuyQty: 1080, plannerQty: 1080, ctl01: 'pass', ctl02: 'pass', ctl03: 'pass', status: 'ready', isNewOption: false, brickCode: 'FSH' },
  { code: 'FSH-002-BLU', segment: 'Fashion', family: 'Formal Shirts', class_name: 'Formal Shirt', brand: 'Louis Philippe', neckType: 'Spread', sleeveType: 'Full', fit: 'Regular', fabric: 'Egyptian Cotton', pattern: 'Striped', mrp: 1499, cost: 532, intakeMarginPct: 64.5, trueRos: 2.2, fwdRos: 1.9, sysBuyQty: 1440, plannerQty: 1440, ctl01: 'pass', ctl02: 'pass', ctl03: 'pass', status: 'ready', isNewOption: false, brickCode: 'FSH' },
  { code: 'FSH-003-NVY', segment: 'Fashion', family: 'Formal Shirts', class_name: 'Formal Shirt', brand: 'Van Heusen', neckType: 'Spread', sleeveType: 'Full', fit: 'Tailored', fabric: 'Linen Blend', pattern: 'Checked', mrp: 1899, cost: 679, intakeMarginPct: 64.2, trueRos: 2.6, fwdRos: 2.3, sysBuyQty: 2340, plannerQty: 2340, ctl01: 'pass', ctl02: 'warn', ctl03: 'pass', status: 'new_option', isNewOption: true, brickCode: 'FSH' },
  { code: 'FSH-004-GRY', segment: 'Fashion', family: 'Formal Shirts', class_name: 'Formal Shirt', brand: 'Peter England', neckType: 'Spread', sleeveType: 'Full', fit: 'Slim', fabric: 'Twill', pattern: 'Solid', mrp: 1849, cost: 678, intakeMarginPct: 63.3, trueRos: 1.7, fwdRos: 1.5, sysBuyQty: 1080, plannerQty: 1080, ctl01: 'pass', ctl02: 'pass', ctl03: 'pass', status: 'ready', isNewOption: false, brickCode: 'FSH' },
  { code: 'FSH-005-STR', segment: 'Fashion', family: 'Formal Shirts', class_name: 'Formal Shirt', brand: 'Arrow', neckType: 'Spread', sleeveType: 'Full', fit: 'Regular', fabric: 'Cotton Poplin', pattern: 'Striped', mrp: 1949, cost: 682, intakeMarginPct: 65.0, trueRos: 2.2, fwdRos: 1.9, sysBuyQty: 1260, plannerQty: 1260, ctl01: 'pass', ctl02: 'pass', ctl03: 'pass', status: 'ready', isNewOption: false, brickCode: 'FSH' },
  { code: 'FSH-006-BEI', segment: 'Ultimate', family: 'Formal Shirts', class_name: 'Formal Shirt', brand: 'Louis Philippe', neckType: 'Spread', sleeveType: 'Full', fit: 'Tailored', fabric: 'Egyptian Cotton', pattern: 'Checked', mrp: 2399, cost: 899, intakeMarginPct: 62.5, trueRos: 2.3, fwdRos: 2.0, sysBuyQty: 3420, plannerQty: 3420, ctl01: 'pass', ctl02: 'pass', ctl03: 'pass', status: 'ready', isNewOption: false, brickCode: 'FSH' },
  { code: 'FSH-007-BLK', segment: 'Fashion', family: 'Formal Shirts', class_name: 'Formal Shirt', brand: 'Van Heusen', neckType: 'Spread', sleeveType: 'Full', fit: 'Slim', fabric: 'Linen Blend', pattern: 'Solid', mrp: 1549, cost: 550, intakeMarginPct: 64.5, trueRos: 2.2, fwdRos: 1.9, sysBuyQty: 960, plannerQty: 960, ctl01: 'pass', ctl02: 'pass', ctl03: 'pass', status: 'ready', isNewOption: false, brickCode: 'FSH' },
  { code: 'FSH-008-GRN', segment: 'Ultimate', family: 'Formal Shirts', class_name: 'Formal Shirt', brand: 'Peter England', neckType: 'Spread', sleeveType: 'Full', fit: 'Regular', fabric: 'Twill', pattern: 'Striped', mrp: 2399, cost: 818, intakeMarginPct: 65.9, trueRos: 1.9, fwdRos: 1.7, sysBuyQty: 2400, plannerQty: 2400, ctl01: 'pass', ctl02: 'pass', ctl03: 'pass', status: 'ready', isNewOption: false, brickCode: 'FSH' },
  { code: 'FSH-009-KHK', segment: 'Fashion', family: 'Formal Shirts', class_name: 'Formal Shirt', brand: 'Arrow', neckType: 'Spread', sleeveType: 'Full', fit: 'Tailored', fabric: 'Cotton Poplin', pattern: 'Checked', mrp: 1349, cost: 499, intakeMarginPct: 63.0, trueRos: 1.4, fwdRos: 1.2, sysBuyQty: 1080, plannerQty: 1080, ctl01: 'pass', ctl02: 'pass', ctl03: 'pass', status: 'ready', isNewOption: false, brickCode: 'FSH' },
  { code: 'FSH-010-BRN', segment: 'Fashion', family: 'Formal Shirts', class_name: 'Formal Shirt', brand: 'Louis Philippe', neckType: 'Spread', sleeveType: 'Full', fit: 'Slim', fabric: 'Egyptian Cotton', pattern: 'Solid', mrp: 1999, cost: 696, intakeMarginPct: 65.2, trueRos: 1.9, fwdRos: 1.7, sysBuyQty: 1440, plannerQty: 1440, ctl01: 'pass', ctl02: 'warn', ctl03: 'pass', status: 'ready', isNewOption: false, brickCode: 'FSH' },
  { code: 'FSH-011-OLV', segment: 'Ultimate', family: 'Formal Shirts', class_name: 'Formal Shirt', brand: 'Van Heusen', neckType: 'Spread', sleeveType: 'Full', fit: 'Regular', fabric: 'Linen Blend', pattern: 'Striped', mrp: 2449, cost: 840, intakeMarginPct: 65.7, trueRos: 0.6, fwdRos: 0.5, sysBuyQty: 0, plannerQty: 0, calcQty: 1440, ctl01: 'fail', ctl02: 'pass', ctl03: 'fail', status: 'held', isNewOption: false, brickCode: 'FSH' },
  { code: 'FSH-012-RED', segment: 'Fashion', family: 'Formal Shirts', class_name: 'Formal Shirt', brand: 'Peter England', neckType: 'Spread', sleeveType: 'Full', fit: 'Tailored', fabric: 'Twill', pattern: 'Checked', mrp: 1349, cost: 467, intakeMarginPct: 65.4, trueRos: 0.7, fwdRos: 0.6, sysBuyQty: 0, plannerQty: 0, calcQty: 1260, ctl01: 'fail', ctl02: 'pass', ctl03: 'fail', status: 'held', isNewOption: false, brickCode: 'FSH' },
];

const FTR_OPTIONS: BuyPlanOption[] = [
  { code: 'FTR-001-NVY', segment: 'Ultimate', family: 'Formal Trousers', class_name: 'Formal Trousers', brand: 'Arrow', neckType: '—', sleeveType: '—', fit: 'Slim', fabric: 'Wool Blend', pattern: 'Solid', mrp: 2799, cost: 1037, intakeMarginPct: 63.0, trueRos: 1.1, fwdRos: 1.0, sysBuyQty: 1020, plannerQty: 1020, ctl01: 'pass', ctl02: 'pass', ctl03: 'pass', status: 'ready', isNewOption: false, brickCode: 'FTR' },
  { code: 'FTR-002-GRY', segment: 'Fashion', family: 'Formal Trousers', class_name: 'Formal Trousers', brand: 'Louis Philippe', neckType: '—', sleeveType: '—', fit: 'Regular', fabric: 'Poly Viscose', pattern: 'Checked', mrp: 1749, cost: 647, intakeMarginPct: 63.0, trueRos: 2.6, fwdRos: 2.3, sysBuyQty: 3000, plannerQty: 3000, ctl01: 'pass', ctl02: 'pass', ctl03: 'pass', status: 'ready', isNewOption: false, brickCode: 'FTR' },
  { code: 'FTR-003-BLK', segment: 'Fashion', family: 'Formal Trousers', class_name: 'Formal Trousers', brand: 'Van Heusen', neckType: '—', sleeveType: '—', fit: 'Tailored', fabric: 'Cotton Twill', pattern: 'Solid', mrp: 1649, cost: 614, intakeMarginPct: 62.8, trueRos: 1.8, fwdRos: 1.6, sysBuyQty: 1980, plannerQty: 1980, ctl01: 'pass', ctl02: 'pass', ctl03: 'pass', status: 'new_option', isNewOption: true, brickCode: 'FTR' },
  { code: 'FTR-004-BEI', segment: 'Fashion', family: 'Formal Trousers', class_name: 'Formal Trousers', brand: 'Arrow', neckType: '—', sleeveType: '—', fit: 'Slim', fabric: 'Wool Blend', pattern: 'Checked', mrp: 1649, cost: 602, intakeMarginPct: 63.5, trueRos: 1.3, fwdRos: 1.1, sysBuyQty: 900, plannerQty: 900, ctl01: 'pass', ctl02: 'pass', ctl03: 'pass', status: 'ready', isNewOption: false, brickCode: 'FTR' },
  { code: 'FTR-005-BRN', segment: 'Fashion', family: 'Formal Trousers', class_name: 'Formal Trousers', brand: 'Louis Philippe', neckType: '—', sleeveType: '—', fit: 'Regular', fabric: 'Poly Viscose', pattern: 'Solid', mrp: 1699, cost: 634, intakeMarginPct: 62.7, trueRos: 1.9, fwdRos: 1.7, sysBuyQty: 2520, plannerQty: 2520, ctl01: 'pass', ctl02: 'warn', ctl03: 'pass', status: 'ready', isNewOption: false, brickCode: 'FTR' },
  { code: 'FTR-006-OLV', segment: 'Fashion', family: 'Formal Trousers', class_name: 'Formal Trousers', brand: 'Van Heusen', neckType: '—', sleeveType: '—', fit: 'Tailored', fabric: 'Cotton Twill', pattern: 'Checked', mrp: 2249, cost: 766, intakeMarginPct: 65.9, trueRos: 1.5, fwdRos: 1.3, sysBuyQty: 1440, plannerQty: 1440, ctl01: 'pass', ctl02: 'pass', ctl03: 'pass', status: 'ready', isNewOption: false, brickCode: 'FTR' },
  { code: 'FTR-007-KHK', segment: 'Ultimate', family: 'Formal Trousers', class_name: 'Formal Trousers', brand: 'Arrow', neckType: '—', sleeveType: '—', fit: 'Slim', fabric: 'Wool Blend', pattern: 'Solid', mrp: 2699, cost: 1006, intakeMarginPct: 62.7, trueRos: 1.6, fwdRos: 1.4, sysBuyQty: 2280, plannerQty: 2280, ctl01: 'pass', ctl02: 'pass', ctl03: 'pass', status: 'ready', isNewOption: false, brickCode: 'FTR' },
  { code: 'FTR-008-BLU', segment: 'Fashion', family: 'Formal Trousers', class_name: 'Formal Trousers', brand: 'Louis Philippe', neckType: '—', sleeveType: '—', fit: 'Regular', fabric: 'Poly Viscose', pattern: 'Checked', mrp: 2299, cost: 782, intakeMarginPct: 66.0, trueRos: 0.6, fwdRos: 0.5, sysBuyQty: 0, plannerQty: 0, calcQty: 1140, ctl01: 'fail', ctl02: 'pass', ctl03: 'fail', status: 'held', isNewOption: false, brickCode: 'FTR' },
];

const KRT_OPTIONS: BuyPlanOption[] = [
  { code: 'KRT-001-RED', segment: 'Ultimate', family: 'Kurtis', class_name: 'Kurta', brand: 'W for Woman', neckType: 'Round', sleeveType: 'Three-quarter', fit: 'Straight', fabric: 'Cotton Cambric', pattern: 'Solid', mrp: 2149, cost: 763, intakeMarginPct: 64.5, trueRos: 1.4, fwdRos: 1.2, sysBuyQty: 1500, plannerQty: 1500, ctl01: 'pass', ctl02: 'pass', ctl03: 'pass', status: 'ready', isNewOption: false, brickCode: 'KRT' },
  { code: 'KRT-002-BLU', segment: 'Ultimate', family: 'Kurtis', class_name: 'Kurta', brand: 'Biba', neckType: 'Round', sleeveType: 'Three-quarter', fit: 'A-Line', fabric: 'Rayon', pattern: 'Printed', mrp: 2599, cost: 895, intakeMarginPct: 65.6, trueRos: 2.0, fwdRos: 1.8, sysBuyQty: 1500, plannerQty: 1500, ctl01: 'pass', ctl02: 'pass', ctl03: 'pass', status: 'ready', isNewOption: false, brickCode: 'KRT' },
  { code: 'KRT-003-GRN', segment: 'Fashion', family: 'Kurtis', class_name: 'Kurta', brand: 'Fab India', neckType: 'Round', sleeveType: 'Three-quarter', fit: 'Anarkali', fabric: 'Chanderi', pattern: 'Embroidered', mrp: 1399, cost: 522, intakeMarginPct: 62.7, trueRos: 1.5, fwdRos: 1.3, sysBuyQty: 2640, plannerQty: 2640, ctl01: 'pass', ctl02: 'pass', ctl03: 'pass', status: 'new_option', isNewOption: true, brickCode: 'KRT' },
  { code: 'KRT-004-WHT', segment: 'Fashion', family: 'Kurtis', class_name: 'Kurta', brand: 'Aurelia', neckType: 'Round', sleeveType: 'Three-quarter', fit: 'Straight', fabric: 'Silk Blend', pattern: 'Solid', mrp: 1749, cost: 649, intakeMarginPct: 62.9, trueRos: 2.0, fwdRos: 1.8, sysBuyQty: 2280, plannerQty: 2280, ctl01: 'pass', ctl02: 'pass', ctl03: 'pass', status: 'ready', isNewOption: false, brickCode: 'KRT' },
  { code: 'KRT-005-BEI', segment: 'Fashion', family: 'Kurtis', class_name: 'Kurta', brand: 'W for Woman', neckType: 'Round', sleeveType: 'Three-quarter', fit: 'A-Line', fabric: 'Cotton Cambric', pattern: 'Printed', mrp: 1699, cost: 585, intakeMarginPct: 65.6, trueRos: 2.4, fwdRos: 2.1, sysBuyQty: 2700, plannerQty: 2700, ctl01: 'pass', ctl02: 'pass', ctl03: 'pass', status: 'ready', isNewOption: false, brickCode: 'KRT' },
  { code: 'KRT-006-NVY', segment: 'Fashion', family: 'Kurtis', class_name: 'Kurta', brand: 'Biba', neckType: 'Round', sleeveType: 'Three-quarter', fit: 'Anarkali', fabric: 'Rayon', pattern: 'Embroidered', mrp: 999, cost: 369, intakeMarginPct: 63.1, trueRos: 1.7, fwdRos: 1.5, sysBuyQty: 2700, plannerQty: 2700, ctl01: 'pass', ctl02: 'warn', ctl03: 'pass', status: 'ready', isNewOption: false, brickCode: 'KRT' },
  { code: 'KRT-007-OLV', segment: 'Fashion', family: 'Kurtis', class_name: 'Kurta', brand: 'Fab India', neckType: 'Round', sleeveType: 'Three-quarter', fit: 'Straight', fabric: 'Chanderi', pattern: 'Solid', mrp: 1999, cost: 737, intakeMarginPct: 63.1, trueRos: 1.3, fwdRos: 1.1, sysBuyQty: 1020, plannerQty: 1020, ctl01: 'pass', ctl02: 'pass', ctl03: 'pass', status: 'ready', isNewOption: false, brickCode: 'KRT' },
  { code: 'KRT-008-BRN', segment: 'Ultimate', family: 'Kurtis', class_name: 'Kurta', brand: 'Aurelia', neckType: 'Round', sleeveType: 'Three-quarter', fit: 'A-Line', fabric: 'Silk Blend', pattern: 'Printed', mrp: 2399, cost: 847, intakeMarginPct: 64.7, trueRos: 1.2, fwdRos: 1.1, sysBuyQty: 2040, plannerQty: 2040, ctl01: 'pass', ctl02: 'pass', ctl03: 'pass', status: 'ready', isNewOption: false, brickCode: 'KRT' },
  { code: 'KRT-009-KHK', segment: 'Fashion', family: 'Kurtis', class_name: 'Kurta', brand: 'W for Woman', neckType: 'Round', sleeveType: 'Three-quarter', fit: 'Anarkali', fabric: 'Cotton Cambric', pattern: 'Embroidered', mrp: 1199, cost: 420, intakeMarginPct: 65.0, trueRos: 1.9, fwdRos: 1.7, sysBuyQty: 1620, plannerQty: 1620, ctl01: 'pass', ctl02: 'pass', ctl03: 'pass', status: 'ready', isNewOption: false, brickCode: 'KRT' },
  { code: 'KRT-010-GRY', segment: 'Fashion', family: 'Kurtis', class_name: 'Kurta', brand: 'Biba', neckType: 'Round', sleeveType: 'Three-quarter', fit: 'Straight', fabric: 'Rayon', pattern: 'Solid', mrp: 1699, cost: 618, intakeMarginPct: 63.6, trueRos: 1.4, fwdRos: 1.2, sysBuyQty: 2220, plannerQty: 2220, ctl01: 'pass', ctl02: 'pass', ctl03: 'pass', status: 'ready', isNewOption: false, brickCode: 'KRT' },
  { code: 'KRT-011-BLK', segment: 'Fashion', family: 'Kurtis', class_name: 'Kurta', brand: 'Fab India', neckType: 'Round', sleeveType: 'Three-quarter', fit: 'A-Line', fabric: 'Chanderi', pattern: 'Printed', mrp: 1149, cost: 399, intakeMarginPct: 65.3, trueRos: 1.3, fwdRos: 1.1, sysBuyQty: 2760, plannerQty: 2760, ctl01: 'pass', ctl02: 'warn', ctl03: 'pass', status: 'ready', isNewOption: false, brickCode: 'KRT' },
  { code: 'KRT-012-STR', segment: 'Fashion', family: 'Kurtis', class_name: 'Kurta', brand: 'Aurelia', neckType: 'Round', sleeveType: 'Three-quarter', fit: 'Anarkali', fabric: 'Silk Blend', pattern: 'Embroidered', mrp: 1799, cost: 648, intakeMarginPct: 64.0, trueRos: 1.8, fwdRos: 1.6, sysBuyQty: 1980, plannerQty: 1980, ctl01: 'pass', ctl02: 'pass', ctl03: 'pass', status: 'ready', isNewOption: false, brickCode: 'KRT' },
  { code: 'KRT-013-WHT', segment: 'Fashion', family: 'Kurtis', class_name: 'Kurta', brand: 'W for Woman', neckType: 'Round', sleeveType: 'Three-quarter', fit: 'Straight', fabric: 'Cotton Cambric', pattern: 'Solid', mrp: 2099, cost: 725, intakeMarginPct: 65.5, trueRos: 0.8, fwdRos: 0.7, sysBuyQty: 0, plannerQty: 0, calcQty: 660, ctl01: 'fail', ctl02: 'pass', ctl03: 'fail', status: 'held', isNewOption: false, brickCode: 'KRT' },
  { code: 'KRT-014-RED', segment: 'Ultimate', family: 'Kurtis', class_name: 'Kurta', brand: 'Biba', neckType: 'Round', sleeveType: 'Three-quarter', fit: 'A-Line', fabric: 'Rayon', pattern: 'Printed', mrp: 2349, cost: 842, intakeMarginPct: 64.2, trueRos: 0.9, fwdRos: 0.8, sysBuyQty: 0, plannerQty: 0, calcQty: 1020, ctl01: 'fail', ctl02: 'pass', ctl03: 'fail', status: 'held', isNewOption: false, brickCode: 'KRT' },
  { code: 'KRT-015-GRN', segment: 'Fashion', family: 'Kurtis', class_name: 'Kurta', brand: 'Fab India', neckType: 'Round', sleeveType: 'Three-quarter', fit: 'Anarkali', fabric: 'Chanderi', pattern: 'Embroidered', mrp: 1549, cost: 537, intakeMarginPct: 65.3, trueRos: 0.8, fwdRos: 0.7, sysBuyQty: 0, plannerQty: 0, calcQty: 1080, ctl01: 'fail', ctl02: 'pass', ctl03: 'fail', status: 'held', isNewOption: false, brickCode: 'KRT' },
];

const WTP_OPTIONS: BuyPlanOption[] = [
  { code: 'WTP-001-WHT', segment: 'Fashion', family: 'Women Tops', class_name: 'Women Top', brand: 'Vero Moda', neckType: 'Round', sleeveType: 'Half', fit: 'Regular', fabric: 'Viscose', pattern: 'Solid', mrp: 1149, cost: 430, intakeMarginPct: 62.6, trueRos: 1.6, fwdRos: 1.4, sysBuyQty: 2460, plannerQty: 2460, ctl01: 'pass', ctl02: 'pass', ctl03: 'pass', status: 'ready', isNewOption: false, brickCode: 'WTP' },
  { code: 'WTP-002-BLK', segment: 'Ultimate', family: 'Women Tops', class_name: 'Women Top', brand: 'Only', neckType: 'Round', sleeveType: 'Half', fit: 'Relaxed', fabric: 'Cotton Lycra', pattern: 'Printed', mrp: 1749, cost: 625, intakeMarginPct: 64.3, trueRos: 1.1, fwdRos: 1.0, sysBuyQty: 1440, plannerQty: 1440, ctl01: 'pass', ctl02: 'pass', ctl03: 'pass', status: 'ready', isNewOption: false, brickCode: 'WTP' },
  { code: 'WTP-003-RED', segment: 'Fashion', family: 'Women Tops', class_name: 'Women Top', brand: 'Mango', neckType: 'Round', sleeveType: 'Half', fit: 'Fitted', fabric: 'Georgette', pattern: 'Striped', mrp: 1399, cost: 491, intakeMarginPct: 64.9, trueRos: 1.9, fwdRos: 1.7, sysBuyQty: 2520, plannerQty: 2520, ctl01: 'pass', ctl02: 'warn', ctl03: 'pass', status: 'new_option', isNewOption: true, brickCode: 'WTP' },
  { code: 'WTP-004-BLU', segment: 'Fashion', family: 'Women Tops', class_name: 'Women Top', brand: 'AND', neckType: 'Round', sleeveType: 'Half', fit: 'Regular', fabric: 'Crepe', pattern: 'Solid', mrp: 999, cost: 347, intakeMarginPct: 65.3, trueRos: 1.5, fwdRos: 1.3, sysBuyQty: 1560, plannerQty: 1560, ctl01: 'pass', ctl02: 'warn', ctl03: 'pass', status: 'ready', isNewOption: false, brickCode: 'WTP' },
  { code: 'WTP-005-GRN', segment: 'Ultimate', family: 'Women Tops', class_name: 'Women Top', brand: 'Vero Moda', neckType: 'Round', sleeveType: 'Half', fit: 'Relaxed', fabric: 'Viscose', pattern: 'Printed', mrp: 2099, cost: 785, intakeMarginPct: 62.6, trueRos: 2.6, fwdRos: 2.3, sysBuyQty: 960, plannerQty: 960, ctl01: 'pass', ctl02: 'warn', ctl03: 'pass', status: 'ready', isNewOption: false, brickCode: 'WTP' },
  { code: 'WTP-006-BEI', segment: 'Ultimate', family: 'Women Tops', class_name: 'Women Top', brand: 'Only', neckType: 'Round', sleeveType: 'Half', fit: 'Fitted', fabric: 'Cotton Lycra', pattern: 'Striped', mrp: 1949, cost: 713, intakeMarginPct: 63.4, trueRos: 2.3, fwdRos: 2.0, sysBuyQty: 3360, plannerQty: 3360, ctl01: 'pass', ctl02: 'warn', ctl03: 'pass', status: 'ready', isNewOption: false, brickCode: 'WTP' },
  { code: 'WTP-007-NVY', segment: 'Fashion', family: 'Women Tops', class_name: 'Women Top', brand: 'Mango', neckType: 'Round', sleeveType: 'Half', fit: 'Regular', fabric: 'Georgette', pattern: 'Solid', mrp: 1599, cost: 552, intakeMarginPct: 65.5, trueRos: 1.5, fwdRos: 1.3, sysBuyQty: 1380, plannerQty: 1380, ctl01: 'pass', ctl02: 'pass', ctl03: 'pass', status: 'ready', isNewOption: false, brickCode: 'WTP' },
  { code: 'WTP-008-GRY', segment: 'Ultimate', family: 'Women Tops', class_name: 'Women Top', brand: 'AND', neckType: 'Round', sleeveType: 'Half', fit: 'Relaxed', fabric: 'Crepe', pattern: 'Printed', mrp: 1699, cost: 634, intakeMarginPct: 62.7, trueRos: 1.3, fwdRos: 1.1, sysBuyQty: 3300, plannerQty: 3300, ctl01: 'pass', ctl02: 'warn', ctl03: 'pass', status: 'ready', isNewOption: false, brickCode: 'WTP' },
  { code: 'WTP-009-OLV', segment: 'Fashion', family: 'Women Tops', class_name: 'Women Top', brand: 'Vero Moda', neckType: 'Round', sleeveType: 'Half', fit: 'Fitted', fabric: 'Viscose', pattern: 'Striped', mrp: 999, cost: 374, intakeMarginPct: 62.6, trueRos: 1.2, fwdRos: 1.1, sysBuyQty: 1500, plannerQty: 1500, ctl01: 'pass', ctl02: 'pass', ctl03: 'pass', status: 'ready', isNewOption: false, brickCode: 'WTP' },
  { code: 'WTP-010-STR', segment: 'Fashion', family: 'Women Tops', class_name: 'Women Top', brand: 'Only', neckType: 'Round', sleeveType: 'Half', fit: 'Regular', fabric: 'Cotton Lycra', pattern: 'Solid', mrp: 1649, cost: 594, intakeMarginPct: 64.0, trueRos: 1.4, fwdRos: 1.2, sysBuyQty: 1680, plannerQty: 1680, ctl01: 'pass', ctl02: 'pass', ctl03: 'pass', status: 'ready', isNewOption: false, brickCode: 'WTP' },
  { code: 'WTP-011-BRN', segment: 'Fashion', family: 'Women Tops', class_name: 'Women Top', brand: 'Mango', neckType: 'Round', sleeveType: 'Half', fit: 'Relaxed', fabric: 'Georgette', pattern: 'Printed', mrp: 1649, cost: 615, intakeMarginPct: 62.7, trueRos: 1.5, fwdRos: 1.3, sysBuyQty: 2520, plannerQty: 2520, ctl01: 'pass', ctl02: 'pass', ctl03: 'pass', status: 'ready', isNewOption: false, brickCode: 'WTP' },
  { code: 'WTP-012-KHK', segment: 'Ultimate', family: 'Women Tops', class_name: 'Women Top', brand: 'AND', neckType: 'Round', sleeveType: 'Half', fit: 'Fitted', fabric: 'Crepe', pattern: 'Striped', mrp: 2199, cost: 787, intakeMarginPct: 64.2, trueRos: 1.9, fwdRos: 1.7, sysBuyQty: 2400, plannerQty: 2400, ctl01: 'pass', ctl02: 'pass', ctl03: 'pass', status: 'ready', isNewOption: false, brickCode: 'WTP' },
  { code: 'WTP-013-WHT', segment: 'Fashion', family: 'Women Tops', class_name: 'Women Top', brand: 'Vero Moda', neckType: 'Round', sleeveType: 'Half', fit: 'Regular', fabric: 'Viscose', pattern: 'Solid', mrp: 1249, cost: 454, intakeMarginPct: 63.7, trueRos: 0.5, fwdRos: 0.4, sysBuyQty: 0, plannerQty: 0, calcQty: 1200, ctl01: 'fail', ctl02: 'pass', ctl03: 'fail', status: 'held', isNewOption: false, brickCode: 'WTP' },
  { code: 'WTP-014-BLK', segment: 'Ultimate', family: 'Women Tops', class_name: 'Women Top', brand: 'Only', neckType: 'Round', sleeveType: 'Half', fit: 'Relaxed', fabric: 'Cotton Lycra', pattern: 'Printed', mrp: 2199, cost: 809, intakeMarginPct: 63.2, trueRos: 0.6, fwdRos: 0.5, sysBuyQty: 0, plannerQty: 0, calcQty: 1500, ctl01: 'fail', ctl02: 'pass', ctl03: 'fail', status: 'held', isNewOption: false, brickCode: 'WTP' },
];

const KBT_OPTIONS: BuyPlanOption[] = [
  { code: 'KBT-001-BLU', segment: 'Fashion', family: 'Kids Boys Tops', class_name: 'Kids Boy Top', brand: 'YK', neckType: 'Crew', sleeveType: 'Half', fit: 'Regular', fabric: 'Cotton Jersey', pattern: 'Printed', mrp: 899, cost: 318, intakeMarginPct: 64.6, trueRos: 1.9, fwdRos: 1.7, sysBuyQty: 3060, plannerQty: 3060, ctl01: 'pass', ctl02: 'warn', ctl03: 'pass', status: 'ready', isNewOption: false, brickCode: 'KBT' },
  { code: 'KBT-002-RED', segment: 'Ultimate', family: 'Kids Boys Tops', class_name: 'Kids Boy Top', brand: 'Gini & Jony', neckType: 'Crew', sleeveType: 'Half', fit: 'Relaxed', fabric: 'Cotton Blend', pattern: 'Solid', mrp: 1149, cost: 428, intakeMarginPct: 62.8, trueRos: 2.4, fwdRos: 2.1, sysBuyQty: 1620, plannerQty: 1620, ctl01: 'pass', ctl02: 'pass', ctl03: 'pass', status: 'ready', isNewOption: false, brickCode: 'KBT' },
  { code: 'KBT-003-GRN', segment: 'Ultimate', family: 'Kids Boys Tops', class_name: 'Kids Boy Top', brand: 'HRX Kids', neckType: 'Crew', sleeveType: 'Half', fit: 'Regular', fabric: 'Cotton Jersey', pattern: 'Striped', mrp: 1099, cost: 411, intakeMarginPct: 62.6, trueRos: 1.1, fwdRos: 1.0, sysBuyQty: 3180, plannerQty: 3180, ctl01: 'pass', ctl02: 'pass', ctl03: 'pass', status: 'new_option', isNewOption: true, brickCode: 'KBT' },
  { code: 'KBT-004-WHT', segment: 'Fashion', family: 'Kids Boys Tops', class_name: 'Kids Boy Top', brand: 'YK', neckType: 'Crew', sleeveType: 'Half', fit: 'Relaxed', fabric: 'Cotton Blend', pattern: 'Printed', mrp: 599, cost: 213, intakeMarginPct: 64.4, trueRos: 1.5, fwdRos: 1.3, sysBuyQty: 1020, plannerQty: 1020, ctl01: 'pass', ctl02: 'warn', ctl03: 'pass', status: 'ready', isNewOption: false, brickCode: 'KBT' },
  { code: 'KBT-005-NVY', segment: 'Ultimate', family: 'Kids Boys Tops', class_name: 'Kids Boy Top', brand: 'Gini & Jony', neckType: 'Crew', sleeveType: 'Half', fit: 'Regular', fabric: 'Cotton Jersey', pattern: 'Solid', mrp: 1049, cost: 378, intakeMarginPct: 64.0, trueRos: 1.2, fwdRos: 1.1, sysBuyQty: 2160, plannerQty: 2160, ctl01: 'pass', ctl02: 'pass', ctl03: 'pass', status: 'ready', isNewOption: false, brickCode: 'KBT' },
  { code: 'KBT-006-GRY', segment: 'Ultimate', family: 'Kids Boys Tops', class_name: 'Kids Boy Top', brand: 'HRX Kids', neckType: 'Crew', sleeveType: 'Half', fit: 'Relaxed', fabric: 'Cotton Blend', pattern: 'Striped', mrp: 999, cost: 350, intakeMarginPct: 65.0, trueRos: 1.9, fwdRos: 1.7, sysBuyQty: 1020, plannerQty: 1020, ctl01: 'pass', ctl02: 'pass', ctl03: 'pass', status: 'ready', isNewOption: false, brickCode: 'KBT' },
  { code: 'KBT-007-BLK', segment: 'Fashion', family: 'Kids Boys Tops', class_name: 'Kids Boy Top', brand: 'YK', neckType: 'Crew', sleeveType: 'Half', fit: 'Regular', fabric: 'Cotton Jersey', pattern: 'Printed', mrp: 899, cost: 318, intakeMarginPct: 64.6, trueRos: 1.4, fwdRos: 1.2, sysBuyQty: 3120, plannerQty: 3120, ctl01: 'pass', ctl02: 'pass', ctl03: 'pass', status: 'ready', isNewOption: false, brickCode: 'KBT' },
  { code: 'KBT-008-OLV', segment: 'Ultimate', family: 'Kids Boys Tops', class_name: 'Kids Boy Top', brand: 'Gini & Jony', neckType: 'Crew', sleeveType: 'Half', fit: 'Relaxed', fabric: 'Cotton Blend', pattern: 'Solid', mrp: 1049, cost: 358, intakeMarginPct: 65.9, trueRos: 1.7, fwdRos: 1.5, sysBuyQty: 960, plannerQty: 960, ctl01: 'pass', ctl02: 'pass', ctl03: 'pass', status: 'ready', isNewOption: false, brickCode: 'KBT' },
  { code: 'KBT-009-KHK', segment: 'Fashion', family: 'Kids Boys Tops', class_name: 'Kids Boy Top', brand: 'HRX Kids', neckType: 'Crew', sleeveType: 'Half', fit: 'Regular', fabric: 'Cotton Jersey', pattern: 'Striped', mrp: 699, cost: 258, intakeMarginPct: 63.1, trueRos: 1.2, fwdRos: 1.1, sysBuyQty: 1620, plannerQty: 1620, ctl01: 'pass', ctl02: 'warn', ctl03: 'pass', status: 'ready', isNewOption: false, brickCode: 'KBT' },
  { code: 'KBT-010-STR', segment: 'Fashion', family: 'Kids Boys Tops', class_name: 'Kids Boy Top', brand: 'YK', neckType: 'Crew', sleeveType: 'Half', fit: 'Relaxed', fabric: 'Cotton Blend', pattern: 'Printed', mrp: 749, cost: 278, intakeMarginPct: 62.9, trueRos: 0.3, fwdRos: 0.3, sysBuyQty: 0, plannerQty: 0, calcQty: 660, ctl01: 'fail', ctl02: 'pass', ctl03: 'fail', status: 'held', isNewOption: false, brickCode: 'KBT' },
];

const SPW_OPTIONS: BuyPlanOption[] = [
  { code: 'SPW-001-BLK', segment: 'Fashion', family: 'Sportswear', class_name: 'Sportswear', brand: 'HRX', neckType: 'Crew', sleeveType: 'Half', fit: 'Athletic', fabric: 'Dri-Fit Poly', pattern: 'Solid', mrp: 2049, cost: 733, intakeMarginPct: 64.2, trueRos: 2.3, fwdRos: 2.0, sysBuyQty: 2280, plannerQty: 2280, ctl01: 'pass', ctl02: 'pass', ctl03: 'pass', status: 'ready', isNewOption: false, brickCode: 'SPW' },
  { code: 'SPW-002-BLU', segment: 'Ultimate', family: 'Sportswear', class_name: 'Sportswear', brand: 'Adidas', neckType: 'Crew', sleeveType: 'Half', fit: 'Regular', fabric: 'Poly Spandex', pattern: 'Colour-block', mrp: 2949, cost: 1073, intakeMarginPct: 63.6, trueRos: 1.8, fwdRos: 1.6, sysBuyQty: 3360, plannerQty: 3360, ctl01: 'pass', ctl02: 'pass', ctl03: 'pass', status: 'ready', isNewOption: false, brickCode: 'SPW' },
  { code: 'SPW-003-GRY', segment: 'Ultimate', family: 'Sportswear', class_name: 'Sportswear', brand: 'Puma', neckType: 'Crew', sleeveType: 'Half', fit: 'Compression', fabric: 'Mesh Knit', pattern: 'Solid', mrp: 2649, cost: 980, intakeMarginPct: 63.0, trueRos: 1.8, fwdRos: 1.6, sysBuyQty: 1800, plannerQty: 1800, ctl01: 'pass', ctl02: 'pass', ctl03: 'pass', status: 'new_option', isNewOption: true, brickCode: 'SPW' },
  { code: 'SPW-004-RED', segment: 'Ultimate', family: 'Sportswear', class_name: 'Sportswear', brand: 'Nike', neckType: 'Crew', sleeveType: 'Half', fit: 'Athletic', fabric: 'Dri-Fit Poly', pattern: 'Colour-block', mrp: 2949, cost: 1003, intakeMarginPct: 66.0, trueRos: 1.8, fwdRos: 1.6, sysBuyQty: 1920, plannerQty: 1920, ctl01: 'pass', ctl02: 'pass', ctl03: 'pass', status: 'ready', isNewOption: false, brickCode: 'SPW' },
  { code: 'SPW-005-GRN', segment: 'Fashion', family: 'Sportswear', class_name: 'Sportswear', brand: 'HRX', neckType: 'Crew', sleeveType: 'Half', fit: 'Regular', fabric: 'Poly Spandex', pattern: 'Solid', mrp: 1449, cost: 540, intakeMarginPct: 62.7, trueRos: 1.5, fwdRos: 1.3, sysBuyQty: 2220, plannerQty: 2220, ctl01: 'pass', ctl02: 'pass', ctl03: 'pass', status: 'ready', isNewOption: false, brickCode: 'SPW' },
  { code: 'SPW-006-NVY', segment: 'Fashion', family: 'Sportswear', class_name: 'Sportswear', brand: 'Adidas', neckType: 'Crew', sleeveType: 'Half', fit: 'Compression', fabric: 'Mesh Knit', pattern: 'Colour-block', mrp: 1249, cost: 461, intakeMarginPct: 63.1, trueRos: 1.9, fwdRos: 1.7, sysBuyQty: 2880, plannerQty: 2880, ctl01: 'pass', ctl02: 'pass', ctl03: 'pass', status: 'ready', isNewOption: false, brickCode: 'SPW' },
  { code: 'SPW-007-WHT', segment: 'Fashion', family: 'Sportswear', class_name: 'Sportswear', brand: 'Puma', neckType: 'Crew', sleeveType: 'Half', fit: 'Athletic', fabric: 'Dri-Fit Poly', pattern: 'Solid', mrp: 2049, cost: 719, intakeMarginPct: 64.9, trueRos: 2.3, fwdRos: 2.0, sysBuyQty: 1500, plannerQty: 1500, ctl01: 'pass', ctl02: 'pass', ctl03: 'pass', status: 'ready', isNewOption: false, brickCode: 'SPW' },
  { code: 'SPW-008-OLV', segment: 'Fashion', family: 'Sportswear', class_name: 'Sportswear', brand: 'Nike', neckType: 'Crew', sleeveType: 'Half', fit: 'Regular', fabric: 'Poly Spandex', pattern: 'Colour-block', mrp: 1749, cost: 604, intakeMarginPct: 65.5, trueRos: 1.6, fwdRos: 1.4, sysBuyQty: 1500, plannerQty: 1500, ctl01: 'pass', ctl02: 'warn', ctl03: 'pass', status: 'ready', isNewOption: false, brickCode: 'SPW' },
  { code: 'SPW-009-KHK', segment: 'Ultimate', family: 'Sportswear', class_name: 'Sportswear', brand: 'HRX', neckType: 'Crew', sleeveType: 'Half', fit: 'Compression', fabric: 'Mesh Knit', pattern: 'Solid', mrp: 2899, cost: 1067, intakeMarginPct: 63.2, trueRos: 1.8, fwdRos: 1.6, sysBuyQty: 2880, plannerQty: 2880, ctl01: 'pass', ctl02: 'pass', ctl03: 'pass', status: 'ready', isNewOption: false, brickCode: 'SPW' },
  { code: 'SPW-010-STR', segment: 'Ultimate', family: 'Sportswear', class_name: 'Sportswear', brand: 'Adidas', neckType: 'Crew', sleeveType: 'Half', fit: 'Athletic', fabric: 'Dri-Fit Poly', pattern: 'Colour-block', mrp: 2349, cost: 880, intakeMarginPct: 62.5, trueRos: 1.7, fwdRos: 1.5, sysBuyQty: 2580, plannerQty: 2580, ctl01: 'pass', ctl02: 'pass', ctl03: 'pass', status: 'ready', isNewOption: false, brickCode: 'SPW' },
  { code: 'SPW-011-BRN', segment: 'Ultimate', family: 'Sportswear', class_name: 'Sportswear', brand: 'Puma', neckType: 'Crew', sleeveType: 'Half', fit: 'Regular', fabric: 'Poly Spandex', pattern: 'Solid', mrp: 2249, cost: 823, intakeMarginPct: 63.4, trueRos: 0.6, fwdRos: 0.5, sysBuyQty: 0, plannerQty: 0, calcQty: 840, ctl01: 'fail', ctl02: 'pass', ctl03: 'fail', status: 'held', isNewOption: false, brickCode: 'SPW' },
  { code: 'SPW-012-BEI', segment: 'Ultimate', family: 'Sportswear', class_name: 'Sportswear', brand: 'Nike', neckType: 'Crew', sleeveType: 'Half', fit: 'Compression', fabric: 'Mesh Knit', pattern: 'Colour-block', mrp: 2599, cost: 942, intakeMarginPct: 63.8, trueRos: 0.4, fwdRos: 0.4, sysBuyQty: 0, plannerQty: 0, calcQty: 1320, ctl01: 'fail', ctl02: 'pass', ctl03: 'fail', status: 'held', isNewOption: false, brickCode: 'SPW' },
];

const WSP_OPTIONS: BuyPlanOption[] = [
  { code: 'WSP-001-BLK', segment: 'Ultimate', family: 'Women Sportswear', class_name: 'Women Sportswear', brand: 'HRX Women', neckType: 'Round', sleeveType: 'Sleeveless', fit: 'Athletic', fabric: 'Poly Spandex', pattern: 'Solid', mrp: 3149, cost: 1093, intakeMarginPct: 65.3, trueRos: 1.4, fwdRos: 1.2, sysBuyQty: 2340, plannerQty: 2340, ctl01: 'pass', ctl02: 'pass', ctl03: 'pass', status: 'ready', isNewOption: false, brickCode: 'WSP' },
  { code: 'WSP-002-GRY', segment: 'Fashion', family: 'Women Sportswear', class_name: 'Women Sportswear', brand: 'Adidas', neckType: 'Round', sleeveType: 'Sleeveless', fit: 'Compression', fabric: 'Dri-Fit Poly', pattern: 'Colour-block', mrp: 1849, cost: 682, intakeMarginPct: 63.1, trueRos: 1.4, fwdRos: 1.2, sysBuyQty: 2760, plannerQty: 2760, ctl01: 'pass', ctl02: 'warn', ctl03: 'pass', status: 'ready', isNewOption: false, brickCode: 'WSP' },
  { code: 'WSP-003-NVY', segment: 'Fashion', family: 'Women Sportswear', class_name: 'Women Sportswear', brand: 'Puma', neckType: 'Round', sleeveType: 'Sleeveless', fit: 'Regular', fabric: 'Seamless Knit', pattern: 'Solid', mrp: 1899, cost: 663, intakeMarginPct: 65.1, trueRos: 1.7, fwdRos: 1.5, sysBuyQty: 1200, plannerQty: 1200, ctl01: 'pass', ctl02: 'warn', ctl03: 'pass', status: 'new_option', isNewOption: true, brickCode: 'WSP' },
  { code: 'WSP-004-RED', segment: 'Ultimate', family: 'Women Sportswear', class_name: 'Women Sportswear', brand: 'Nike', neckType: 'Round', sleeveType: 'Sleeveless', fit: 'Athletic', fabric: 'Poly Spandex', pattern: 'Colour-block', mrp: 3099, cost: 1074, intakeMarginPct: 65.3, trueRos: 1.3, fwdRos: 1.1, sysBuyQty: 2460, plannerQty: 2460, ctl01: 'pass', ctl02: 'warn', ctl03: 'pass', status: 'ready', isNewOption: false, brickCode: 'WSP' },
  { code: 'WSP-005-BLU', segment: 'Fashion', family: 'Women Sportswear', class_name: 'Women Sportswear', brand: 'HRX Women', neckType: 'Round', sleeveType: 'Sleeveless', fit: 'Compression', fabric: 'Dri-Fit Poly', pattern: 'Solid', mrp: 1749, cost: 612, intakeMarginPct: 65.0, trueRos: 2.1, fwdRos: 1.8, sysBuyQty: 2460, plannerQty: 2460, ctl01: 'pass', ctl02: 'pass', ctl03: 'pass', status: 'ready', isNewOption: false, brickCode: 'WSP' },
  { code: 'WSP-006-OLV', segment: 'Ultimate', family: 'Women Sportswear', class_name: 'Women Sportswear', brand: 'Adidas', neckType: 'Round', sleeveType: 'Sleeveless', fit: 'Regular', fabric: 'Seamless Knit', pattern: 'Colour-block', mrp: 2949, cost: 1022, intakeMarginPct: 65.3, trueRos: 2.5, fwdRos: 2.2, sysBuyQty: 2400, plannerQty: 2400, ctl01: 'pass', ctl02: 'pass', ctl03: 'pass', status: 'ready', isNewOption: false, brickCode: 'WSP' },
  { code: 'WSP-007-WHT', segment: 'Ultimate', family: 'Women Sportswear', class_name: 'Women Sportswear', brand: 'Puma', neckType: 'Round', sleeveType: 'Sleeveless', fit: 'Athletic', fabric: 'Poly Spandex', pattern: 'Solid', mrp: 2799, cost: 1033, intakeMarginPct: 63.1, trueRos: 1.4, fwdRos: 1.2, sysBuyQty: 960, plannerQty: 960, ctl01: 'pass', ctl02: 'warn', ctl03: 'pass', status: 'ready', isNewOption: false, brickCode: 'WSP' },
  { code: 'WSP-008-GRN', segment: 'Ultimate', family: 'Women Sportswear', class_name: 'Women Sportswear', brand: 'Nike', neckType: 'Round', sleeveType: 'Sleeveless', fit: 'Compression', fabric: 'Dri-Fit Poly', pattern: 'Colour-block', mrp: 3049, cost: 1061, intakeMarginPct: 65.2, trueRos: 2.0, fwdRos: 1.8, sysBuyQty: 1200, plannerQty: 1200, ctl01: 'pass', ctl02: 'pass', ctl03: 'pass', status: 'ready', isNewOption: false, brickCode: 'WSP' },
  { code: 'WSP-009-BEI', segment: 'Fashion', family: 'Women Sportswear', class_name: 'Women Sportswear', brand: 'HRX Women', neckType: 'Round', sleeveType: 'Sleeveless', fit: 'Regular', fabric: 'Seamless Knit', pattern: 'Solid', mrp: 1249, cost: 465, intakeMarginPct: 62.8, trueRos: 0.6, fwdRos: 0.5, sysBuyQty: 0, plannerQty: 0, calcQty: 1260, ctl01: 'fail', ctl02: 'pass', ctl03: 'fail', status: 'held', isNewOption: false, brickCode: 'WSP' },
  { code: 'WSP-010-STR', segment: 'Fashion', family: 'Women Sportswear', class_name: 'Women Sportswear', brand: 'Adidas', neckType: 'Round', sleeveType: 'Sleeveless', fit: 'Athletic', fabric: 'Poly Spandex', pattern: 'Colour-block', mrp: 1549, cost: 550, intakeMarginPct: 64.5, trueRos: 0.7, fwdRos: 0.6, sysBuyQty: 0, plannerQty: 0, calcQty: 1440, ctl01: 'fail', ctl02: 'pass', ctl03: 'fail', status: 'held', isNewOption: false, brickCode: 'WSP' },
];

const BRICK_OPTIONS: Record<string, BuyPlanOption[]> = {
  CNT: CNT_OPTIONS,
  FSH: FSH_OPTIONS,
  FTR: FTR_OPTIONS,
  KRT: KRT_OPTIONS,
  WTP: WTP_OPTIONS,
  KBT: KBT_OPTIONS,
  SPW: SPW_OPTIONS,
  WSP: WSP_OPTIONS,
  VNT: VNT_OPTIONS,
  PLO: PLO_OPTIONS,
  DNM: DNM_OPTIONS,
  CHN: CHN_OPTIONS,
  'CAS-SHT': CAS_SHT_OPTIONS,
  'SPT-SHT': SPT_SHT_OPTIONS,
}

// ─── Bricks Data ─────────────────────────────────────────────────────────────

const BRICKS: Record<string, BuyPlanBrick[]> = {
  TOPS: [
    { code: 'CNT', name: 'Crew Neck T-Shirt', subCode: 'TOPS', optionsCount: 7, sysBuyQty: 15480, plannerQty: 15480, variancePct: 0, heldCount: 2, ctl01Summary: 'fail', ctl02Summary: 'warn', ctl03Summary: 'fail' },
    { code: 'VNT', name: 'V-Neck T-Shirt', subCode: 'TOPS', optionsCount: 5, sysBuyQty: 10440, plannerQty: 10440, variancePct: 0, heldCount: 1, ctl01Summary: 'fail', ctl02Summary: 'warn', ctl03Summary: 'fail' },
    { code: 'PLO', name: 'Polo T-Shirt', subCode: 'TOPS', optionsCount: 5, sysBuyQty: 7560, plannerQty: 7560, variancePct: 0, heldCount: 1, ctl01Summary: 'fail', ctl02Summary: 'warn', ctl03Summary: 'fail' },
  ],
  BTMS: [
    { code: 'DNM', name: 'Denim', subCode: 'BTMS', optionsCount: 5, sysBuyQty: 8640, plannerQty: 8640, variancePct: 0, heldCount: 1, ctl01Summary: 'fail', ctl02Summary: 'warn', ctl03Summary: 'fail' },
    { code: 'CHN', name: 'Chinos', subCode: 'BTMS', optionsCount: 4, sysBuyQty: 6120, plannerQty: 6120, variancePct: 0, heldCount: 1, ctl01Summary: 'fail', ctl02Summary: 'warn', ctl03Summary: 'fail' },
  ],
  SRTS: [
    { code: 'CAS-SHT', name: 'Casual Shorts', subCode: 'SRTS', optionsCount: 4, sysBuyQty: 7200, plannerQty: 7200, variancePct: 0, heldCount: 1, ctl01Summary: 'fail', ctl02Summary: 'warn', ctl03Summary: 'fail' },
    { code: 'SPT-SHT', name: 'Sport Shorts', subCode: 'SRTS', optionsCount: 4, sysBuyQty: 8760, plannerQty: 8760, variancePct: 0, heldCount: 0, ctl01Summary: 'pass', ctl02Summary: 'warn', ctl03Summary: 'pass' },
  ],
  FSHIRTS: [
    { code: 'FSH', name: 'Formal Shirt', subCode: 'FSHIRTS', optionsCount: 0, sysBuyQty: 0, plannerQty: 0, variancePct: 0, heldCount: 0, ctl01Summary: 'pass', ctl02Summary: 'pass', ctl03Summary: 'pass' },
  ],
  FTROUSERS: [
    { code: 'FTR', name: 'Formal Trousers', subCode: 'FTROUSERS', optionsCount: 0, sysBuyQty: 0, plannerQty: 0, variancePct: 0, heldCount: 0, ctl01Summary: 'pass', ctl02Summary: 'pass', ctl03Summary: 'pass' },
  ],
  KURTIS: [
    { code: 'KRT', name: 'Kurta', subCode: 'KURTIS', optionsCount: 0, sysBuyQty: 0, plannerQty: 0, variancePct: 0, heldCount: 0, ctl01Summary: 'pass', ctl02Summary: 'pass', ctl03Summary: 'pass' },
  ],
  WTOPS: [
    { code: 'WTP', name: 'Women Top', subCode: 'WTOPS', optionsCount: 0, sysBuyQty: 0, plannerQty: 0, variancePct: 0, heldCount: 0, ctl01Summary: 'pass', ctl02Summary: 'pass', ctl03Summary: 'pass' },
  ],
  KBTOPS: [
    { code: 'KBT', name: 'Kids Boy Top', subCode: 'KBTOPS', optionsCount: 0, sysBuyQty: 0, plannerQty: 0, variancePct: 0, heldCount: 0, ctl01Summary: 'pass', ctl02Summary: 'pass', ctl03Summary: 'pass' },
  ],
  SPORTSWEAR: [
    { code: 'SPW', name: 'Sportswear', subCode: 'SPORTSWEAR', optionsCount: 0, sysBuyQty: 0, plannerQty: 0, variancePct: 0, heldCount: 0, ctl01Summary: 'pass', ctl02Summary: 'pass', ctl03Summary: 'pass' },
  ],
  WSPORTSWEAR: [
    { code: 'WSP', name: 'Women Sportswear', subCode: 'WSPORTSWEAR', optionsCount: 0, sysBuyQty: 0, plannerQty: 0, variancePct: 0, heldCount: 0, ctl01Summary: 'pass', ctl02Summary: 'pass', ctl03Summary: 'pass' },
  ],
}

// ─── Subcategories Data ───────────────────────────────────────────────────────

const SUBCATEGORIES: Record<string, BuyPlanSubcategory[]> = {
  MC: [
    { code: 'TOPS', name: 'Tops', catCode: 'MC', bricks: [{ code: 'CNT', name: 'Crew Neck T-Shirt' }, { code: 'VNT', name: 'V-Neck T-Shirt' }, { code: 'PLO', name: 'Polo T-Shirt' }], brickCount: 3, optionsCount: 17, sysBuyQty: 33480, heldCount: 4, flaggedCount: 0, stage: 'buyer_review' },
    { code: 'BTMS', name: 'Bottoms', catCode: 'MC', bricks: [{ code: 'DNM', name: 'Denim' }, { code: 'CHN', name: 'Chinos' }], brickCount: 2, optionsCount: 9, sysBuyQty: 14760, heldCount: 2, flaggedCount: 0, stage: 'buyer_review' },
    { code: 'SRTS', name: 'Shorts', catCode: 'MC', bricks: [{ code: 'CAS-SHT', name: 'Casual Shorts' }, { code: 'SPT-SHT', name: 'Sport Shorts' }], brickCount: 2, optionsCount: 8, sysBuyQty: 15960, heldCount: 1, flaggedCount: 0, stage: 'buyer_review' },
  ],
  MF: [
    { code: 'FSHIRTS', name: 'Formal Shirts', catCode: 'MF', bricks: [{ code: 'FSH', name: 'Formal Shirt' }], brickCount: 1, optionsCount: 12, sysBuyQty: 18000, heldCount: 2, flaggedCount: 1, stage: 'buyer_review' },
    { code: 'FTROUSERS', name: 'Formal Trousers', catCode: 'MF', bricks: [{ code: 'FTR', name: 'Formal Trousers' }], brickCount: 1, optionsCount: 8, sysBuyQty: 12000, heldCount: 1, flaggedCount: 0, stage: 'buyer_review' },
  ],
  WIW: [
    { code: 'KURTIS', name: 'Kurtis', catCode: 'WIW', bricks: [{ code: 'KRT', name: 'Kurta' }], brickCount: 1, optionsCount: 15, sysBuyQty: 22000, heldCount: 3, flaggedCount: 2, stage: 'cat_approval' },
  ],
  WWW: [
    { code: 'WTOPS', name: 'Women Tops', catCode: 'WWW', bricks: [{ code: 'WTP', name: 'Women Top' }], brickCount: 1, optionsCount: 14, sysBuyQty: 20000, heldCount: 2, flaggedCount: 1, stage: 'buyer_review' },
  ],
  KW: [
    { code: 'KBTOPS', name: 'Kids Boys Tops', catCode: 'KW', bricks: [{ code: 'KBT', name: 'Kids Boy Top' }], brickCount: 1, optionsCount: 10, sysBuyQty: 15000, heldCount: 1, flaggedCount: 0, stage: 'planning' },
  ],
  MS: [
    { code: 'SPORTSWEAR', name: 'Sportswear', catCode: 'MS', bricks: [{ code: 'SPW', name: 'Sportswear' }], brickCount: 1, optionsCount: 12, sysBuyQty: 18000, heldCount: 2, flaggedCount: 1, stage: 'buyer_review' },
  ],
  WS: [
    { code: 'WSPORTSWEAR', name: 'Women Sportswear', catCode: 'WS', bricks: [{ code: 'WSP', name: 'Women Sportswear' }], brickCount: 1, optionsCount: 10, sysBuyQty: 15000, heldCount: 2, flaggedCount: 0, stage: 'demand_calc' },
  ],
}

// ─── Categories Data ──────────────────────────────────────────────────────────

const CATEGORIES: Record<string, BuyPlanCategory[]> = {
  '2026-10': [
    { code: 'MC', name: "Men's Casuals", stage: 'buyer_review', subcategories: (SUBCATEGORIES['MC'] ?? []).map(s => ({ code: s.code, name: s.name, optionsCount: s.optionsCount, sysBuyQty: s.sysBuyQty, stage: s.stage })), heldCount: 7, optionsCount: 34, otbValue: 124.5, saleMonth: '2026-10' },
    { code: 'MF', name: "Men's Formals", stage: 'cat_approval', subcategories: (SUBCATEGORIES['MF'] ?? []).map(s => ({ code: s.code, name: s.name, optionsCount: s.optionsCount, sysBuyQty: s.sysBuyQty, stage: s.stage })), heldCount: 3, optionsCount: 20, otbValue: 98.2, saleMonth: '2026-10' },
    { code: 'WIW', name: "Women's Indian Wear", stage: 'buyer_review', subcategories: (SUBCATEGORIES['WIW'] ?? []).map(s => ({ code: s.code, name: s.name, optionsCount: s.optionsCount, sysBuyQty: s.sysBuyQty, stage: s.stage })), heldCount: 3, optionsCount: 15, otbValue: 86.7, saleMonth: '2026-10' },
    { code: 'WWW', name: "Women's Western Wear", stage: 'buyer_review', subcategories: (SUBCATEGORIES['WWW'] ?? []).map(s => ({ code: s.code, name: s.name, optionsCount: s.optionsCount, sysBuyQty: s.sysBuyQty, stage: s.stage })), heldCount: 2, optionsCount: 14, otbValue: 72.4, saleMonth: '2026-10' },
    { code: 'KW', name: "Kid's Wear", stage: 'planning', subcategories: (SUBCATEGORIES['KW'] ?? []).map(s => ({ code: s.code, name: s.name, optionsCount: s.optionsCount, sysBuyQty: s.sysBuyQty, stage: s.stage })), heldCount: 1, optionsCount: 10, otbValue: 0, saleMonth: '2026-10' },
    { code: 'MS', name: "Men's Sportswear", stage: 'buyer_review', subcategories: (SUBCATEGORIES['MS'] ?? []).map(s => ({ code: s.code, name: s.name, optionsCount: s.optionsCount, sysBuyQty: s.sysBuyQty, stage: s.stage })), heldCount: 2, optionsCount: 12, otbValue: 58.9, saleMonth: '2026-10' },
    { code: 'WS', name: "Women's Sportswear", stage: 'demand_calc', subcategories: (SUBCATEGORIES['WS'] ?? []).map(s => ({ code: s.code, name: s.name, optionsCount: s.optionsCount, sysBuyQty: s.sysBuyQty, stage: s.stage })), heldCount: 2, optionsCount: 10, otbValue: 0, saleMonth: '2026-10' },
  ],
  '2026-11': [
    { code: 'MC', name: "Men's Casuals", stage: 'planning', subcategories: [], heldCount: 0, optionsCount: 0, otbValue: 0, saleMonth: '2026-11' },
    { code: 'MF', name: "Men's Formals", stage: 'planning', subcategories: [], heldCount: 0, optionsCount: 0, otbValue: 0, saleMonth: '2026-11' },
    { code: 'WIW', name: "Women's Indian Wear", stage: 'planning', subcategories: [], heldCount: 0, optionsCount: 0, otbValue: 0, saleMonth: '2026-11' },
    { code: 'WWW', name: "Women's Western Wear", stage: 'planning', subcategories: [], heldCount: 0, optionsCount: 0, otbValue: 0, saleMonth: '2026-11' },
    { code: 'KW', name: "Kid's Wear", stage: 'planning', subcategories: [], heldCount: 0, optionsCount: 0, otbValue: 0, saleMonth: '2026-11' },
    { code: 'MS', name: "Men's Sportswear", stage: 'planning', subcategories: [], heldCount: 0, optionsCount: 0, otbValue: 0, saleMonth: '2026-11' },
    { code: 'WS', name: "Women's Sportswear", stage: 'planning', subcategories: [], heldCount: 0, optionsCount: 0, otbValue: 0, saleMonth: '2026-11' },
  ],
  '2026-12': [
    { code: 'MC', name: "Men's Casuals", stage: 'released', subcategories: [], heldCount: 5, optionsCount: 32, otbValue: 118.2, saleMonth: '2026-12' },
    { code: 'MF', name: "Men's Formals", stage: 'otb_review', subcategories: [], heldCount: 2, optionsCount: 19, otbValue: 92.1, saleMonth: '2026-12' },
    { code: 'WIW', name: "Women's Indian Wear", stage: 'commercial', subcategories: [], heldCount: 2, optionsCount: 14, otbValue: 80.4, saleMonth: '2026-12' },
    { code: 'WWW', name: "Women's Western Wear", stage: 'otb_review', subcategories: [], heldCount: 1, optionsCount: 13, otbValue: 68.7, saleMonth: '2026-12' },
    { code: 'KW', name: "Kid's Wear", stage: 'cat_approval', subcategories: [], heldCount: 1, optionsCount: 9, otbValue: 42.1, saleMonth: '2026-12' },
    { code: 'MS', name: "Men's Sportswear", stage: 'released', subcategories: [], heldCount: 1, optionsCount: 11, otbValue: 54.2, saleMonth: '2026-12' },
    { code: 'WS', name: "Women's Sportswear", stage: 'cat_approval', subcategories: [], heldCount: 1, optionsCount: 9, otbValue: 38.8, saleMonth: '2026-12' },
  ],
  '2027-01': [
    { code: 'MC', name: "Men's Casuals", stage: 'planning', subcategories: [], heldCount: 0, optionsCount: 0, otbValue: 0, saleMonth: '2027-01' },
    { code: 'MF', name: "Men's Formals", stage: 'planning', subcategories: [], heldCount: 0, optionsCount: 0, otbValue: 0, saleMonth: '2027-01' },
    { code: 'WIW', name: "Women's Indian Wear", stage: 'planning', subcategories: [], heldCount: 0, optionsCount: 0, otbValue: 0, saleMonth: '2027-01' },
    { code: 'WWW', name: "Women's Western Wear", stage: 'planning', subcategories: [], heldCount: 0, optionsCount: 0, otbValue: 0, saleMonth: '2027-01' },
    { code: 'KW', name: "Kid's Wear", stage: 'planning', subcategories: [], heldCount: 0, optionsCount: 0, otbValue: 0, saleMonth: '2027-01' },
    { code: 'MS', name: "Men's Sportswear", stage: 'planning', subcategories: [], heldCount: 0, optionsCount: 0, otbValue: 0, saleMonth: '2027-01' },
    { code: 'WS', name: "Women's Sportswear", stage: 'planning', subcategories: [], heldCount: 0, optionsCount: 0, otbValue: 0, saleMonth: '2027-01' },
  ],
}

// ─── Buy Plan Months ──────────────────────────────────────────────────────────

const BUY_PLAN_MONTHS: BuyPlanMonth[] = [
  { saleMonth: '2027-01', label: 'January 2027', year: 2027, monthNum: 1, stage: 'planning', categories: 7, optionsTotal: 0, flaggedCount: 0, heldCount: 0, otbValueLakh: 0 },
  { saleMonth: '2026-12', label: 'December 2026', year: 2026, monthNum: 12, stage: 'otb_review', categories: 7, optionsTotal: 107, flaggedCount: 4, heldCount: 13, otbValueLakh: 756 },
  { saleMonth: '2026-11', label: 'November 2026', year: 2026, monthNum: 11, stage: 'planning', categories: 7, optionsTotal: 0, flaggedCount: 0, heldCount: 0, otbValueLakh: 0 },
  { saleMonth: '2026-10', label: 'October 2026', year: 2026, monthNum: 10, stage: 'buyer_review', categories: 7, optionsTotal: 193, flaggedCount: 12, heldCount: 20, otbValueLakh: 842 },
]

// ─── OTB Months ───────────────────────────────────────────────────────────────

const OTB_CATEGORY_ROWS: Record<string, OTBCategoryRow[]> = {
  '2026-10': [
    {
      code: 'MC', category: "Men's Casuals", otbRequested: 280.0, otbApproved: 0, marginPct: 64.5, status: 'pending',
      exceptions: [
        { id: 'EX-004', description: 'Scale trigger — CNT-007-NEW ROS exceeds target', systemValue: 'Test order: 1,200 units', proposedValue: 'Scale to 8,400 units', reason: 'Measured ROS 2.1 exceeds target 1.8 — scale trigger met', type: 'SCALE_TRIGGER' },
        { id: 'EX-005', description: 'AOP uplift for Mynow festive campaign', systemValue: '₹262.0L', proposedValue: '₹280.0L', reason: 'Festive season AOP uplift approved by Format Head', type: 'AOP_UPLIFT' },
      ]
    },
    {
      code: 'MF', category: "Men's Formals", otbRequested: 156.0, otbApproved: 0, marginPct: 63.2, status: 'pending',
      exceptions: [
        { id: 'EX-006', description: 'Scale trigger — FSH-005-NEW', systemValue: 'Test order: 600 units', proposedValue: 'Scale to 4,200 units', reason: 'ROS 1.6 exceeds target 1.3 — scale trigger', type: 'SCALE_TRIGGER' },
      ]
    },
    {
      code: 'WIW', category: "Women's Indian Wear", otbRequested: 142.0, otbApproved: 0, marginPct: 65.5, status: 'pending',
      exceptions: [
        { id: 'EX-007', description: 'CTL override — Navratri festive demand', systemValue: '0 units', proposedValue: '1,800 units', reason: 'Navratri festive demand override — Category Head decision', type: 'CTL_OVERRIDE' },
      ]
    },
    {
      code: 'WWW', category: "Women's Western Wear", otbRequested: 118.0, otbApproved: 0, marginPct: 63.8, status: 'pending',
      exceptions: [
        { id: 'EX-008', description: 'AOP uplift — Mynow festive sale', systemValue: '₹108.5L', proposedValue: '₹118.0L', reason: 'Campaign uplift approved for October festive window', type: 'AOP_UPLIFT' },
      ]
    },
    { code: 'KW', category: "Kid's Wear", otbRequested: 68.0, otbApproved: 0, marginPct: 64.2, status: 'pending', exceptions: [] },
    {
      code: 'MS', category: "Men's Sportswear", otbRequested: 88.0, otbApproved: 0, marginPct: 65.0, status: 'pending',
      exceptions: [
        { id: 'EX-009', description: 'Vendor MBQ override — SPW-002-BLK', systemValue: '600 units required', proposedValue: 'MBQ: 1,200 units', reason: 'Vendor minimum buy quantity exceeds system recommended', type: 'VENDOR_MBQ' },
      ]
    },
    { code: 'WS', category: "Women's Sportswear", otbRequested: 62.0, otbApproved: 0, marginPct: 64.5, status: 'pending', exceptions: [] },
  ],
  '2026-12': [
    {
      code: 'MC', category: "Men's Casuals", otbRequested: 118.2, otbApproved: 0, marginPct: 64.8, status: 'pending',
      exceptions: [
        { id: 'EX-001', description: 'CTL-01 override for 2 held options', systemValue: '0 units', proposedValue: '2,400 units', reason: 'Seasonal restocking for festive demand', type: 'CTL_OVERRIDE' },
        { id: 'EX-002', description: 'AOP uplift requested', systemValue: '₹118.2L', proposedValue: '₹128.5L', reason: 'EOSS clearance of prior season stock boosts demand', type: 'AOP_UPLIFT' },
      ]
    },
    {
      code: 'MF', category: "Men's Formals", otbRequested: 92.1, otbApproved: 0, marginPct: 62.4, status: 'pending',
      exceptions: [
        { id: 'EX-003', description: 'Margin threshold override', systemValue: '62.4%', proposedValue: '60.0%', reason: 'Strategic vendor partnership requires relaxed margin threshold this cycle', type: 'MARGIN_OVERRIDE' },
      ]
    },
    { code: 'WIW', category: "Women's Indian Wear", otbRequested: 80.4, otbApproved: 0, marginPct: 65.2, status: 'pending', exceptions: [] },
    { code: 'WWW', category: "Women's Western Wear", otbRequested: 68.7, otbApproved: 0, marginPct: 63.8, status: 'pending', exceptions: [] },
    { code: 'KW', category: "Kid's Wear", otbRequested: 42.1, otbApproved: 0, marginPct: 64.1, status: 'pending', exceptions: [] },
    { code: 'MS', category: "Men's Sportswear", otbRequested: 54.2, otbApproved: 0, marginPct: 65.0, status: 'pending', exceptions: [] },
    {
      code: 'WS', category: "Women's Sportswear", otbRequested: 38.8, otbApproved: 0, marginPct: 64.5, status: 'held',
      exceptions: [
        { id: 'EX-010', description: 'Margin threshold override (competitive pricing)', systemValue: '63.8%', proposedValue: '61.5%', reason: 'Competitive pricing required for launch against new market entrant', type: 'MARGIN_OVERRIDE' },
      ]
    },
  ],
  '2026-11': [
    {
      code: 'MC', category: "Men's Casuals", otbRequested: 110.0, otbApproved: 0, marginPct: 65.1, status: 'pending',
      exceptions: [
        { id: 'EX-011', description: 'CTL-01 held options override (2 options)', systemValue: '0 units', proposedValue: '1,800 units', reason: 'Seasonal demand spike for November festive period — festive ROS historically 2.1x', type: 'CTL_OVERRIDE' },
      ]
    },
    { code: 'MF', category: "Men's Formals", otbRequested: 88.5, otbApproved: 0, marginPct: 63.2, status: 'pending', exceptions: [] },
    { code: 'WIW', category: "Women's Indian Wear", otbRequested: 75.2, otbApproved: 0, marginPct: 65.8, status: 'pending', exceptions: [] },
    { code: 'WWW', category: "Women's Western Wear", otbRequested: 62.4, otbApproved: 0, marginPct: 64.2, status: 'pending', exceptions: [] },
    { code: 'KW', category: "Kid's Wear", otbRequested: 40.8, otbApproved: 0, marginPct: 64.5, status: 'pending', exceptions: [] },
    { code: 'MS', category: "Men's Sportswear", otbRequested: 50.1, otbApproved: 0, marginPct: 65.3, status: 'pending', exceptions: [] },
    { code: 'WS', category: "Women's Sportswear", otbRequested: 36.2, otbApproved: 0, marginPct: 64.9, status: 'pending', exceptions: [] },
  ],
}

const OTB_MONTHS: OTBMonth[] = [
  {
    saleMonth: '2026-12', label: 'December 2026', categories: 7, otbRequested: 494.5, otbApproved: 134.6,
    exceptionsPending: 3, intakeMarginPct: 64.4, deadline: '30 Sep 2026', otbPeriodEnd: '31 Dec 2026',
    status: 'exceptions_pending'
  },
  {
    saleMonth: '2026-11', label: 'November 2026', categories: 7, otbRequested: 463.2, otbApproved: 0,
    exceptionsPending: 1, intakeMarginPct: 64.9, deadline: '31 Aug 2026', otbPeriodEnd: '30 Nov 2026',
    status: 'exceptions_pending'
  },
  {
    saleMonth: '2026-10', label: 'October 2026', categories: 7, otbRequested: 842.0, otbApproved: 0,
    exceptionsPending: 5, intakeMarginPct: 64.6, deadline: '31 Jul 2026', otbPeriodEnd: '31 Oct 2026',
    status: 'pending_cfo'
  },
]

// ─── Exceptions ───────────────────────────────────────────────────────────────

const ALL_EXCEPTIONS: ExceptionItem[] = [
  { id: 'EX-BP-001', type: 'CTL_OVERRIDE', otbRef: 'OTB-2026-12-MC', saleMonth: '2026-12', category: "Men's Casuals", optionCode: 'CNT-005-RED', systemValue: '0 units', proposedValue: '2,400 units', reason: 'Seasonal restocking for festive demand', raisedBy: 'Rohit Sharma', currentApprovalStep: 'format-head', status: 'pending' },
  { id: 'EX-BP-002', type: 'AOP_UPLIFT', otbRef: 'OTB-2026-12-MC', saleMonth: '2026-12', category: "Men's Casuals", optionCode: '-', systemValue: '₹118.2L', proposedValue: '₹128.5L', reason: 'EOSS clearance of prior season boosts next month demand', raisedBy: 'Priya Kapoor', currentApprovalStep: 'format-head', status: 'pending' },
  { id: 'EX-BP-003', type: 'MARGIN_OVERRIDE', otbRef: 'OTB-2026-12-MF', saleMonth: '2026-12', category: "Men's Formals", optionCode: '-', systemValue: '62.4%', proposedValue: '60.0%', reason: 'Strategic vendor partnership requires relaxed margin threshold', raisedBy: 'Amit Jain', currentApprovalStep: 'financial-commercial-admin', status: 'pending' },
  { id: 'EX-BP-004', type: 'SCALE_TRIGGER', otbRef: 'OTB-2026-10-MC', saleMonth: '2026-10', category: "Men's Casuals", optionCode: 'CNT-007-NEW', systemValue: 'Test order: 1,200 units', proposedValue: 'Scale to 8,400 units', reason: 'Measured ROS 2.1 exceeds target 1.8 — scale trigger met', raisedBy: 'System', currentApprovalStep: 'format-head', status: 'pending' },
  { id: 'EX-BP-005', type: 'CTL_OVERRIDE', otbRef: 'OTB-2026-10-WIW', saleMonth: '2026-10', category: "Women's Indian Wear", optionCode: 'KRT-003-YEL', systemValue: '0 units', proposedValue: '1,800 units', reason: 'Navratri festive demand override — Category Head decision', raisedBy: 'Sunita Reddy', currentApprovalStep: 'ceo', status: 'pending' },
  { id: 'EX-BP-006', type: 'VENDOR_MBQ', otbRef: 'OTB-2026-10-MS', saleMonth: '2026-10', category: "Men's Sportswear", optionCode: 'SPW-002-BLK', systemValue: '600 units required', proposedValue: 'MBQ: 1,200 units', reason: 'Vendor minimum buy quantity exceeds system recommended', raisedBy: 'System', currentApprovalStep: 'financial-commercial-admin', status: 'pending' },
  { id: 'EX-BP-007', type: 'AOP_UPLIFT', otbRef: 'OTB-2026-10-WWW', saleMonth: '2026-10', category: "Women's Western Wear", optionCode: '-', systemValue: '₹72.4L', proposedValue: '₹82.0L', reason: 'Campaign uplift for Mynow festive sale', raisedBy: 'Neha Singh', currentApprovalStep: 'financial-commercial-admin', status: 'approved' },
  { id: 'EX-BP-008', type: 'CTL_OVERRIDE', otbRef: 'OTB-2026-11-KW', saleMonth: '2026-11', category: "Kid's Wear", optionCode: 'KBT-004-BLU', systemValue: '0 units', proposedValue: '900 units', reason: 'New school year restock — sell-through historically resets', raisedBy: 'Pooja Mehta', currentApprovalStep: 'buyer', status: 'rejected' },
  { id: 'EX-BP-009', type: 'SCALE_TRIGGER', otbRef: 'OTB-2026-10-MF', saleMonth: '2026-10', category: "Men's Formals", optionCode: 'FSH-005-NEW', systemValue: 'Test order: 600 units', proposedValue: 'Scale to 4,200 units', reason: 'ROS 1.6 exceeds target 1.3 — scale trigger', raisedBy: 'System', currentApprovalStep: 'buyer', status: 'pending' },
  { id: 'EX-BP-010', type: 'MARGIN_OVERRIDE', otbRef: 'OTB-2026-12-WS', saleMonth: '2026-12', category: "Women's Sportswear", optionCode: '-', systemValue: '63.8%', proposedValue: '61.5%', reason: 'Competitive pricing required for launch against new entrant', raisedBy: 'Meghna Pillai', currentApprovalStep: 'ceo', status: 'pending' },
]

function getExceptionRoleFilter(roleSlug: string | null): ExceptionItem[] {
  if (!roleSlug) return []
  if (roleSlug === 'super-admin' || roleSlug === 'planning-super-admin') return ALL_EXCEPTIONS
  if (roleSlug === 'ceo') return ALL_EXCEPTIONS
  if (roleSlug === 'financial-commercial-admin') {
    return ALL_EXCEPTIONS.filter(
      e => e.currentApprovalStep === 'financial-commercial-admin' || e.status !== 'pending'
    )
  }
  if (roleSlug === 'format-head') {
    return ALL_EXCEPTIONS.filter(
      e => e.currentApprovalStep === 'format-head' || e.status !== 'pending'
    )
  }
  // buyer / pm — own raised exceptions
  return ALL_EXCEPTIONS.filter(
    e => e.currentApprovalStep === 'buyer' || e.raisedBy === 'Rohit Sharma' || e.status !== 'pending'
  )
}

// ─── Test & Scale Options ─────────────────────────────────────────────────────

const TEST_SCALE_OPTIONS: TestScaleOption[] = [
  { id: 'TS-001', optionCode: 'CNT-007-NEW', category: "Men's Casuals", brick: 'Crew Neck T-Shirt', testStores: 100, depthPerStore: 12, windowStart: '2026-08-01', daysElapsed: 52, measuredRos: 2.1, targetRos: 1.8, status: 'scale_triggered' },
  { id: 'TS-002', optionCode: 'VNT-005-NEW', category: "Men's Casuals", brick: 'V-Neck T-Shirt', testStores: 100, depthPerStore: 10, windowStart: '2026-08-15', daysElapsed: 38, measuredRos: 1.4, targetRos: 1.6, status: 'in_test' },
  { id: 'TS-003', optionCode: 'PLO-005-NEW', category: "Men's Casuals", brick: 'Polo T-Shirt', testStores: 80, depthPerStore: 8, windowStart: '2026-08-01', daysElapsed: 52, measuredRos: 0.8, targetRos: 1.4, status: 'below_target' },
  { id: 'TS-004', optionCode: 'DNM-005-NEW', category: "Men's Casuals", brick: 'Denim', testStores: 100, depthPerStore: 8, windowStart: '2026-09-01', daysElapsed: 21, measuredRos: 1.1, targetRos: 1.2, status: 'in_test' },
  { id: 'TS-005', optionCode: 'SPT-SHT-004-NEW', category: "Men's Casuals", brick: 'Sport Shorts', testStores: 60, depthPerStore: 12, windowStart: '2026-07-15', daysElapsed: 68, measuredRos: 1.8, targetRos: 1.5, status: 'scale_triggered' },
]

// ─── PO Items ─────────────────────────────────────────────────────────────────

function makePOChecks(allPass: boolean, failIndexes: number[] = []): POCheckResult[] {
  const checkNames = [
    'OTB linkage valid', 'OTB balance sufficient', 'Approval trail complete',
    'Master data integrity', 'Intake margin ≥ threshold', 'Buy plan reconciled',
    'Delivery date in window', 'No duplicate PO', 'Core grade guard',
    'Vendor qualification'
  ]
  return checkNames.map((check, i) => ({
    check,
    passed: allPass ? true : !failIndexes.includes(i)
  }))
}

const PO_ITEMS: POItem[] = [
  { id: 'PO-001', poNumber: 'PO-2026-10-001', vendor: 'Jockey India Pvt Ltd', category: "Men's Casuals", brick: 'Crew Neck T-Shirt', totalUnits: 9600, totalValueLakh: 26.9, deliveryDate: '2026-09-05', otbRef: 'OTB-2026-10-MC', storeCount: 100, checks: makePOChecks(true), checksPassed: 10, checksFailed: 0, status: 'released', releaseDate: '25 Aug 2026', saleMonth: '2026-10' },
  { id: 'PO-002', poNumber: 'PO-2026-10-002', vendor: 'Pepe Jeans India', category: "Men's Casuals", brick: 'Denim', totalUnits: 6720, totalValueLakh: 41.7, deliveryDate: '2026-09-10', otbRef: 'OTB-2026-10-MC', storeCount: 100, checks: makePOChecks(true), checksPassed: 10, checksFailed: 0, status: 'approved', saleMonth: '2026-10' },
  { id: 'PO-003', poNumber: 'PO-2026-10-003', vendor: 'Raymond Ltd', category: "Men's Formals", brick: 'Formal Shirt', totalUnits: 4800, totalValueLakh: 33.6, deliveryDate: '2026-09-12', otbRef: 'OTB-2026-10-MF', storeCount: 80, checks: makePOChecks(false, [4]), checksPassed: 9, checksFailed: 1, status: 'flagged', saleMonth: '2026-10' },
  { id: 'PO-004', poNumber: 'PO-2026-10-004', vendor: 'W for Woman', category: "Women's Indian Wear", brick: 'Kurta', totalUnits: 5400, totalValueLakh: 28.9, deliveryDate: '2026-09-08', otbRef: 'OTB-2026-10-WIW', storeCount: 90, checks: makePOChecks(true), checksPassed: 10, checksFailed: 0, status: 'approved', saleMonth: '2026-10' },
  { id: 'PO-005', poNumber: 'PO-2026-10-005', vendor: 'HRX Sports', category: "Men's Sportswear", brick: 'Sport Shorts', totalUnits: 3360, totalValueLakh: 8.0, deliveryDate: '2026-09-15', otbRef: 'OTB-2026-10-MS', storeCount: 60, checks: makePOChecks(true), checksPassed: 10, checksFailed: 0, status: 'pending', saleMonth: '2026-10' },
  { id: 'PO-006', poNumber: 'PO-2026-12-001', vendor: 'Jockey India Pvt Ltd', category: "Men's Casuals", brick: 'V-Neck T-Shirt', totalUnits: 8040, totalValueLakh: 22.8, deliveryDate: '2026-11-10', otbRef: 'OTB-2026-12-MC', storeCount: 100, checks: makePOChecks(false, [1, 6]), checksPassed: 8, checksFailed: 2, status: 'flagged', saleMonth: '2026-12' },
  { id: 'PO-007', poNumber: 'PO-2026-12-002', vendor: 'Fab India', category: "Women's Indian Wear", brick: 'Kurta', totalUnits: 6000, totalValueLakh: 31.2, deliveryDate: '2026-11-05', otbRef: 'OTB-2026-12-WIW', storeCount: 90, checks: makePOChecks(true), checksPassed: 10, checksFailed: 0, status: 'pending', saleMonth: '2026-12' },
  { id: 'PO-008', poNumber: 'PO-2026-12-003', vendor: 'Adidas India', category: "Men's Sportswear", brick: 'Sportswear', totalUnits: 4200, totalValueLakh: 18.5, deliveryDate: '2026-11-08', otbRef: 'OTB-2026-12-MS', storeCount: 80, checks: makePOChecks(true), checksPassed: 10, checksFailed: 0, status: 'released', releaseDate: '10 Sep 2026', saleMonth: '2026-12' },
  { id: 'PO-009', poNumber: 'PO-2026-11-001', vendor: 'Jockey India Pvt Ltd', category: "Men's Casuals", brick: 'Crew Neck T-Shirt', totalUnits: 7200, totalValueLakh: 20.2, deliveryDate: '2026-10-05', otbRef: 'OTB-2026-11-MC', storeCount: 100, checks: makePOChecks(true), checksPassed: 10, checksFailed: 0, status: 'pending', saleMonth: '2026-11' },
  { id: 'PO-010', poNumber: 'PO-2026-11-002', vendor: 'W for Woman', category: "Women's Indian Wear", brick: 'Kurta', totalUnits: 4800, totalValueLakh: 25.6, deliveryDate: '2026-10-08', otbRef: 'OTB-2026-11-WIW', storeCount: 90, checks: makePOChecks(true), checksPassed: 10, checksFailed: 0, status: 'pending', saleMonth: '2026-11' },
  { id: 'PO-011', poNumber: 'PO-2026-11-003', vendor: 'Raymond Ltd', category: "Men's Formals", brick: 'Formal Shirt', totalUnits: 3600, totalValueLakh: 25.2, deliveryDate: '2026-10-12', otbRef: 'OTB-2026-11-MF', storeCount: 80, checks: makePOChecks(false, [1]), checksPassed: 9, checksFailed: 1, status: 'flagged', saleMonth: '2026-11' },
]

// ─── Exported Helper Functions ─────────────────────────────────────────────────

export function getBuyPlanMonths(): BuyPlanMonth[] {
  return BUY_PLAN_MONTHS
}

/* ── Sale-month scoping ──────────────────────────────────────────────────
   Until now the accessors below category level took no sale month, so every
   month returned the identical assortment with identical quantities and only
   the hand-typed month headers differed. Measured in the running app: all four
   months returned the same 34 options.

   Each month now applies a profile to the base assortment, and every aggregate
   above option level is COMPUTED from the options it summarises. A hand-typed
   total is a second source of truth and drifts from the first — which is how
   six categories came to declare 81 options that existed nowhere. */
interface MonthProfile { qty: number; stage: BPStage; shift: number }

const CAT_NAMES: Record<string, string> = {
  MC: "Men's Casuals",
  MF: "Men's Formals",
  WIW: "Women's Indian Wear",
  WWW: "Women's Western Wear",
  KW: "Kid's Wear",
  MS: "Men's Sportswear",
  WS: "Women's Sportswear",
}

const subRef = (sc: BuyPlanSubcategory): BuyPlanSubcategoryRef => ({
  code: sc.code,
  name: sc.name,
  optionsCount: sc.optionsCount,
  sysBuyQty: sc.sysBuyQty,
  stage: sc.stage,
})

const MONTH_PROFILE: Record<string, MonthProfile> = {
  '2026-10': { qty: 1.0, stage: 'buyer_review', shift: 0 },
  '2026-11': { qty: 0.78, stage: 'cat_approval', shift: 1 },
  '2026-12': { qty: 1.18, stage: 'otb_review', shift: 2 },
  '2027-01': { qty: 0.61, stage: 'planning', shift: 3 },
}
const DEFAULT_MONTH = '2026-10'
const FALLBACK_PROFILE: MonthProfile = { qty: 1.0, stage: 'buyer_review', shift: 0 }
const profileOf = (saleMonth?: string): MonthProfile =>
  MONTH_PROFILE[saleMonth ?? ''] ?? MONTH_PROFILE[DEFAULT_MONTH] ?? FALLBACK_PROFILE
const roundTo = (n: number, step: number) => Math.max(0, Math.round(n / step) * step)

const CAT_ORDER = ['MC', 'MF', 'WIW', 'WWW', 'KW', 'MS', 'WS'] as const

export function getBuyPlanCategories(saleMonth: string): BuyPlanCategory[] {
  const p = profileOf(saleMonth)
  return CAT_ORDER.map(code => {
    const subs = getBuyPlanSubcategories(code, saleMonth)
    const opts = optionsForCategory(code, saleMonth)
    const live = opts.filter(o => o.status !== 'held')
    const qty = live.reduce((t, o) => t + o.sysBuyQty, 0)
    const value = live.reduce((t, o) => t + o.cost * o.sysBuyQty, 0) / 1e5
    return {
      code,
      name: CAT_NAMES[code] ?? code,
      stage: p.stage,
      saleMonth,
      subcategories: subs.map(subRef),
      optionsCount: opts.length,
      heldCount: opts.length - live.length,
      otbValue: Math.round(value * 10) / 10,
      totalSysQty: qty,
    }
  })
}

/** Every option in a category for a month — the single source every level rolls from. */
function optionsForCategory(catCode: string, saleMonth?: string): BuyPlanOption[] {
  const out: BuyPlanOption[] = []
  for (const sub of SUBCATEGORIES[catCode] ?? []) {
    for (const brick of BRICKS[sub.code] ?? []) {
      out.push(...getBuyPlanOptions(brick.code, saleMonth))
    }
  }
  return out
}

export function getHeldOptionsForMonth(saleMonth: string): Array<BuyPlanOption & { catCode: string; catName: string }> {
  const cats = CATEGORIES[saleMonth] ?? []
  const result: Array<BuyPlanOption & { catCode: string; catName: string }> = []
  for (const cat of cats) {
    const subs = SUBCATEGORIES[cat.code] ?? []
    for (const sub of subs) {
      for (const brickRef of sub.bricks) {
        const opts = enrichOptions(BRICK_OPTIONS[brickRef.code] ?? [])
        for (const opt of opts) {
          if (opt.status === 'held') {
            result.push({ ...opt, catCode: cat.code, catName: cat.name })
          }
        }
      }
    }
  }
  return result
}

export function getBuyPlanSubcategories(catCode: string, saleMonth?: string): BuyPlanSubcategory[] {
  const p = profileOf(saleMonth)
  return (SUBCATEGORIES[catCode] ?? []).map(sc => {
    const bricks = getBuyPlanBricks(sc.code, saleMonth)
    const agg = bricks.reduce(
      (a, b) => ({ o: a.o + b.optionsCount, q: a.q + b.sysBuyQty, h: a.h + b.heldCount }),
      { o: 0, q: 0, h: 0 },
    )
    return {
      ...sc,
      brickCount: bricks.length,
      optionsCount: agg.o,
      sysBuyQty: agg.q,
      heldCount: agg.h,
      flaggedCount: 0,
      stage: p.stage,
    }
  })
}

export function getBuyPlanBricks(subCode: string, saleMonth?: string): BuyPlanBrick[] {
  return (BRICKS[subCode] ?? []).map(b => {
    const opts = getBuyPlanOptions(b.code, saleMonth)
    const live = opts.filter(o => o.status !== 'held')
    const sys = live.reduce((t, o) => t + o.sysBuyQty, 0)
    const worst = (k: 'ctl01' | 'ctl02' | 'ctl03'): CTLStatus =>
      opts.some(o => o[k] === 'fail') ? 'fail' : opts.some(o => o[k] === 'warn') ? 'warn' : 'pass'
    return {
      ...b,
      optionsCount: opts.length,
      sysBuyQty: sys,
      plannerQty: sys,
      variancePct: 0,
      heldCount: opts.length - live.length,
      ctl01Summary: worst('ctl01'),
      ctl02Summary: worst('ctl02'),
      ctl03Summary: worst('ctl03'),
    }
  })
}

export function getBuyPlanOptions(brickCode: string, saleMonth?: string): BuyPlanOption[] {
  const base = BRICK_OPTIONS[brickCode] ?? []
  const p = profileOf(saleMonth)
  const shaped = base.map((o, i) => {
    // the held set rotates by month, so no two months present the same plan
    const held = (i + p.shift) % 7 === 6 || o.status === 'held'
    const qty = held ? 0 : roundTo(o.sysBuyQty * p.qty, 60)
    const calc = held
      ? o.calcQty
        ? roundTo(o.calcQty * p.qty, 60)
        : roundTo(o.sysBuyQty * p.qty * 0.35, 60)
      : undefined
    return {
      ...o,
      sysBuyQty: qty,
      plannerQty: qty,
      calcQty: calc,
      status: held ? ('held' as OptionStatus) : o.status === 'held' ? ('ready' as OptionStatus) : o.status,
      ctl01: held ? ('fail' as CTLStatus) : o.status === 'held' ? ('pass' as CTLStatus) : o.ctl01,
      ctl03: held ? ('fail' as CTLStatus) : o.status === 'held' ? ('pass' as CTLStatus) : o.ctl03,
    }
  })
  return enrichOptions(shaped)
}

export function getOTBMonths(): OTBMonth[] {
  return OTB_MONTHS
}

export function getOTBCategoryRows(saleMonth: string): OTBCategoryRow[] {
  return OTB_CATEGORY_ROWS[saleMonth] ?? []
}

export function getExceptions(roleSlug: string | null): ExceptionItem[] {
  return getExceptionRoleFilter(roleSlug)
}

export function getTestScaleOptions(): TestScaleOption[] {
  return TEST_SCALE_OPTIONS
}

export function getPOItems(saleMonth?: string): POItem[] {
  if (!saleMonth) return PO_ITEMS
  return PO_ITEMS.filter(p => p.saleMonth === saleMonth)
}

// ─── Store-Level PO Breakdown ─────────────────────────────────────────────────

export interface POStoreOption {
  optionCode: string
  description: string
  imageUrl: string
  qty: number
  sizes: { S: number; M: number; L: number; XL: number }
}

export interface POStoreBreakdown {
  storeCode: string
  storeName: string
  city: string
  dcCode: string
  dcName: string
  totalUnits: number
  options: POStoreOption[]
}

const STORES: Array<{ storeCode: string; storeName: string; city: string; dcCode: string; dcName: string }> = [
  { storeCode: 'MUM-001', storeName: 'Andheri Phoenix Mills', city: 'Mumbai', dcCode: 'DC-WEST', dcName: 'Mumbai DC (Bhiwandi)' },
  { storeCode: 'MUM-002', storeName: 'Bandra Hill Road', city: 'Mumbai', dcCode: 'DC-WEST', dcName: 'Mumbai DC (Bhiwandi)' },
  { storeCode: 'MUM-003', storeName: 'Powai Galleria', city: 'Mumbai', dcCode: 'DC-WEST', dcName: 'Mumbai DC (Bhiwandi)' },
  { storeCode: 'DEL-001', storeName: 'Select Citywalk', city: 'Delhi', dcCode: 'DC-NORTH', dcName: 'Delhi DC (Gurgaon)' },
  { storeCode: 'DEL-002', storeName: 'DLF Mall of India', city: 'Delhi', dcCode: 'DC-NORTH', dcName: 'Delhi DC (Gurgaon)' },
  { storeCode: 'BLR-001', storeName: 'Indiranagar 12th Main', city: 'Bangalore', dcCode: 'DC-SOUTH', dcName: 'Bangalore DC (Hosur)' },
  { storeCode: 'BLR-002', storeName: 'Phoenix Marketcity', city: 'Bangalore', dcCode: 'DC-SOUTH', dcName: 'Bangalore DC (Hosur)' },
  { storeCode: 'CHN-001', storeName: 'Express Avenue', city: 'Chennai', dcCode: 'DC-SOUTH', dcName: 'Bangalore DC (Hosur)' },
  { storeCode: 'HYD-001', storeName: 'Banjara Hills', city: 'Hyderabad', dcCode: 'DC-SOUTH', dcName: 'Bangalore DC (Hosur)' },
  { storeCode: 'PUN-001', storeName: 'Koregaon Park', city: 'Pune', dcCode: 'DC-WEST', dcName: 'Mumbai DC (Bhiwandi)' },
  { storeCode: 'KOL-001', storeName: 'South City Mall', city: 'Kolkata', dcCode: 'DC-EAST', dcName: 'Kolkata DC (Dankuni)' },
  { storeCode: 'AHM-001', storeName: 'Ahmedabad One Mall', city: 'Ahmedabad', dcCode: 'DC-WEST', dcName: 'Mumbai DC (Bhiwandi)' },
]

// Spread totalUnits evenly across stores, with slight variation
function splitUnitsAcrossStores(totalUnits: number, storeCount: number): number[] {
  const base = Math.floor(totalUnits / storeCount)
  const remainder = totalUnits - base * storeCount
  return Array.from({ length: storeCount }, (_, i) => base + (i < remainder ? 1 : 0))
}

// S:1 M:2 L:3 XL:1 ratio
function sizeBreakdown(qty: number): { S: number; M: number; L: number; XL: number } {
  const unit = Math.round(qty / 7)
  return { S: unit, M: unit * 2, L: unit * 3, XL: Math.max(1, qty - unit * 6) }
}

const PO_OPTIONS_MAP: Record<string, Array<{ optionCode: string; description: string; imageUrl: string }>> = {
  'PO-001': [
    { optionCode: 'CNT-001-WHT', description: 'Crew Neck T-Shirt — White', imageUrl: 'https://picsum.photos/seed/CNT-1/200/260' },
    { optionCode: 'CNT-002-BLK', description: 'Crew Neck T-Shirt — Black', imageUrl: 'https://picsum.photos/seed/CNT-2/200/260' },
    { optionCode: 'CNT-003-NVY', description: 'Crew Neck T-Shirt — Navy', imageUrl: 'https://picsum.photos/seed/CNT-3/200/260' },
  ],
  'PO-002': [
    { optionCode: 'DNM-001-BLU', description: 'Slim Fit Denim — Blue', imageUrl: 'https://picsum.photos/seed/DNM-1/200/260' },
    { optionCode: 'DNM-002-BLK', description: 'Slim Fit Denim — Black', imageUrl: 'https://picsum.photos/seed/DNM-2/200/260' },
  ],
  'PO-003': [
    { optionCode: 'FSH-001-WHT', description: 'Formal Shirt — White', imageUrl: 'https://picsum.photos/seed/FSH-1/200/260' },
    { optionCode: 'FSH-002-BLU', description: 'Formal Shirt — Blue', imageUrl: 'https://picsum.photos/seed/FSH-2/200/260' },
  ],
  'PO-004': [
    { optionCode: 'KRT-001-BLU', description: 'Straight Kurta — Blue', imageUrl: 'https://picsum.photos/seed/KRT-1/200/260' },
    { optionCode: 'KRT-002-GRN', description: 'Straight Kurta — Green', imageUrl: 'https://picsum.photos/seed/KRT-2/200/260' },
    { optionCode: 'KRT-003-OLV', description: 'Straight Kurta — Olive', imageUrl: 'https://picsum.photos/seed/KRT-3/200/260' },
  ],
  'PO-005': [
    { optionCode: 'SPW-001-BLK', description: 'Sport Shorts — Black', imageUrl: 'https://picsum.photos/seed/SPW-1/200/260' },
    { optionCode: 'SPW-002-NVY', description: 'Sport Shorts — Navy', imageUrl: 'https://picsum.photos/seed/SPW-2/200/260' },
  ],
  'PO-006': [
    { optionCode: 'VNT-001-WHT', description: 'V-Neck T-Shirt — White', imageUrl: 'https://picsum.photos/seed/VNT-1/200/260' },
    { optionCode: 'VNT-002-BLK', description: 'V-Neck T-Shirt — Black', imageUrl: 'https://picsum.photos/seed/VNT-2/200/260' },
    { optionCode: 'VNT-003-GRY', description: 'V-Neck T-Shirt — Grey', imageUrl: 'https://picsum.photos/seed/VNT-3/200/260' },
  ],
  'PO-007': [
    { optionCode: 'KRT-004-BEI', description: 'A-Line Kurta — Beige', imageUrl: 'https://picsum.photos/seed/KRT-4/200/260' },
    { optionCode: 'KRT-005-RED', description: 'A-Line Kurta — Red', imageUrl: 'https://picsum.photos/seed/KRT-5/200/260' },
  ],
  'PO-008': [
    { optionCode: 'SPW-003-GRY', description: 'Training Set — Grey', imageUrl: 'https://picsum.photos/seed/SPW-3/200/260' },
    { optionCode: 'SPW-004-BLK', description: 'Training Set — Black', imageUrl: 'https://picsum.photos/seed/SPW-4/200/260' },
    { optionCode: 'SPW-005-NVY', description: 'Training Set — Navy', imageUrl: 'https://picsum.photos/seed/SPW-5/200/260' },
  ],
  'PO-009': [
    { optionCode: 'CNT-001-WHT', description: 'Crew Neck T-Shirt — White', imageUrl: 'https://picsum.photos/seed/CNT-1/200/260' },
    { optionCode: 'CNT-004-GRY', description: 'Crew Neck T-Shirt — Grey', imageUrl: 'https://picsum.photos/seed/CNT-4/200/260' },
  ],
  'PO-010': [
    { optionCode: 'KRT-001-BLU', description: 'Straight Kurta — Blue', imageUrl: 'https://picsum.photos/seed/KRT-1/200/260' },
    { optionCode: 'KRT-003-OLV', description: 'Straight Kurta — Olive', imageUrl: 'https://picsum.photos/seed/KRT-3/200/260' },
  ],
  'PO-011': [
    { optionCode: 'FSH-001-WHT', description: 'Formal Shirt — White', imageUrl: 'https://picsum.photos/seed/FSH-1/200/260' },
    { optionCode: 'FSH-003-BLK', description: 'Formal Shirt — Black', imageUrl: 'https://picsum.photos/seed/FSH-3/200/260' },
  ],
}

export function getPOStoreBreakdown(poId: string): POStoreBreakdown[] {
  const po = PO_ITEMS.find(p => p.id === poId)
  if (!po) return []

  const options = PO_OPTIONS_MAP[poId] ?? []
  const storeCount = Math.min(po.storeCount, STORES.length)
  const stores = STORES.slice(0, storeCount)

  // Split total units across stores and options
  const unitsPerStore = splitUnitsAcrossStores(po.totalUnits, storeCount)

  return stores.map((store, si) => {
    const storeTotal = unitsPerStore[si] ?? 0
    const optionUnits = splitUnitsAcrossStores(storeTotal, options.length)

    const storeOptions: POStoreOption[] = options.map((opt, oi) => {
      const qty = optionUnits[oi] ?? 0
      return {
        optionCode: opt.optionCode,
        description: opt.description,
        imageUrl: opt.imageUrl,
        qty,
        sizes: sizeBreakdown(qty),
      }
    })

    return {
      ...store,
      totalUnits: storeTotal,
      options: storeOptions,
    }
  })
}

// ─── Label Helpers ────────────────────────────────────────────────────────────

export function getSaleMonthLabel(saleMonth: string): string {
  const month = BUY_PLAN_MONTHS.find(m => m.saleMonth === saleMonth)
  if (month) return month.label
  const [year = '', mon = ''] = saleMonth.split('-')
  const date = new Date(parseInt(year), parseInt(mon) - 1, 1)
  return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
}

export function getCategoryName(catCode: string, saleMonth = '2026-10'): string {
  const cats = CATEGORIES[saleMonth] ?? CATEGORIES['2026-10'] ?? []
  return cats.find(c => c.code === catCode)?.name ?? catCode
}

export function getSubcategoryName(catCode: string, subCode: string): string {
  return SUBCATEGORIES[catCode]?.find(s => s.code === subCode)?.name ?? subCode
}

export function getStageBadgeConfig(stage: BPStage): { label: string; variant: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'outline' } {
  const map: Record<BPStage, { label: string; variant: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'outline' }> = {
    planning:     { label: 'Planning',          variant: 'default' },
    demand_calc:  { label: 'Demand Calc',       variant: 'default' },
    buyer_review: { label: 'Buyer Review',      variant: 'warning' },
    cat_approval: { label: 'Cat Approval',      variant: 'primary' },
    commercial:   { label: 'Commercial',        variant: 'info' },
    otb_review:   { label: 'OTB Review',        variant: 'primary' },
    released:     { label: 'Released',          variant: 'success' },
  }
  return map[stage]
}

export function getOTBMonthStatusConfig(status: OTBMonthStatus): { label: string; variant: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'outline' } {
  const map: Record<OTBMonthStatus, { label: string; variant: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'outline' }> = {
    draft:              { label: 'Draft',              variant: 'default' },
    exceptions_pending: { label: 'Exceptions Pending', variant: 'warning' },
    pending_cfo:        { label: 'Pending CFO',        variant: 'primary' },
    approved:           { label: 'Approved',           variant: 'success' },
  }
  return map[status]
}

// suppress unused warning for worstCTL used during data construction
void worstCTL
