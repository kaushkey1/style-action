/**
 * VMI (Vendor Managed Inventory) configuration — types + seed defaults for the
 * Phase-1 admin configuration prototype (frontend-only, local state).
 *
 * Baselines mirror `src/modules/inventory/data/configs/replenishment_configuration.json`
 * and the requirement doc (sales window 30d; DC→store lead 4d; vendor→DC lead 7d;
 * DC→DC lead used but no documented default). Row data is illustrative seed data.
 */

export type VmiStatus = 'Active' | 'Inactive' | 'Pending' | 'Rejected';

export const VMI_STATUSES: VmiStatus[] = ['Active', 'Inactive', 'Pending', 'Rejected'];

/** Product & EAN enrolment record (R1). */
export interface EnrolmentRow {
  id: string;
  styleId: string;
  optionCode: string;
  ean: string;
  brand: string;
  segment: string;
  /** Automated-reorder eligibility flag. */
  autoReorder: boolean;
  status: VmiStatus;
  effectiveFrom: string; // ISO YYYY-MM-DD
  effectiveTo: string; // ISO YYYY-MM-DD or ''
}

/** Vendor mapping + MOQ record (R5). */
export interface VendorMoqRow {
  id: string;
  ean: string;
  vendorCode: string;
  vendorName: string;
  /** Minimum Order Quantity for the product-vendor combination. */
  moq: number;
  status: VmiStatus;
  effectiveFrom: string;
  effectiveTo: string;
}

export type SalesWindowApplicability = 'global' | 'category';

/** Sales window / ADS config (R2). */
export interface SalesWindowConfig {
  /** Sales history window in days (baseline 30). */
  windowDays: number;
  applicability: SalesWindowApplicability;
  effectiveFrom: string;
  effectiveTo: string;
}

/** Lead-time config (R6). */
export interface LeadTimesConfig {
  /** DC→store lead time in days (baseline 4). */
  dcToStore: number;
  /** Vendor→DC lead time in days (baseline 7). */
  vendorToDc: number;
  /** DC→DC lead time in days — used by Inter-DC Shift; no documented default. */
  dcToDc: number | null;
}

// ─── Seed defaults ──────────────────────────────────────────────────────────

export const DEFAULT_SALES_WINDOW: SalesWindowConfig = {
  windowDays: 30,
  applicability: 'global',
  effectiveFrom: '2026-04-01',
  effectiveTo: '',
};

export const DEFAULT_LEAD_TIMES: LeadTimesConfig = {
  dcToStore: 4,
  vendorToDc: 7,
  dcToDc: null,
};

export const SEED_ENROLMENT: EnrolmentRow[] = [
  { id: 'enr-1', styleId: 'TCO26CMSCNP125363', optionCode: '443112764BLACK', ean: '8901234500017', brand: 'NETPLAY', segment: 'MENS WEAR', autoReorder: true, status: 'Active', effectiveFrom: '2026-04-01', effectiveTo: '' },
  { id: 'enr-2', styleId: 'TCO26CMSCNP125363', optionCode: '443112764NAVY', ean: '8901234500024', brand: 'NETPLAY', segment: 'MENS WEAR', autoReorder: true, status: 'Active', effectiveFrom: '2026-04-01', effectiveTo: '' },
  { id: 'enr-3', styleId: 'TCO26CMSSHT119042', optionCode: '551220981WHITE', ean: '8901234500031', brand: 'NETPLAY', segment: 'MENS WEAR', autoReorder: true, status: 'Active', effectiveFrom: '2026-04-01', effectiveTo: '' },
  { id: 'enr-4', styleId: 'TCO26CMSSHT119042', optionCode: '551220981BLUE', ean: '8901234500048', brand: 'NETPLAY', segment: 'MENS WEAR', autoReorder: false, status: 'Pending', effectiveFrom: '2026-05-01', effectiveTo: '' },
  { id: 'enr-5', styleId: 'TCO26CWSTOP204118', optionCode: '772341105RED', ean: '8901234500055', brand: 'DNMX', segment: 'WOMENS WEAR', autoReorder: true, status: 'Active', effectiveFrom: '2026-04-01', effectiveTo: '' },
  { id: 'enr-6', styleId: 'TCO26CWSTOP204118', optionCode: '772341105BLACK', ean: '8901234500062', brand: 'DNMX', segment: 'WOMENS WEAR', autoReorder: true, status: 'Active', effectiveFrom: '2026-04-01', effectiveTo: '' },
  { id: 'enr-7', styleId: 'TCO26CWSDRS310875', optionCode: '883450220GREEN', ean: '8901234500079', brand: 'DNMX', segment: 'WOMENS WEAR', autoReorder: true, status: 'Active', effectiveFrom: '2026-04-01', effectiveTo: '' },
  { id: 'enr-8', styleId: 'TCO26CKSTEE401229', optionCode: '994561337YELLOW', ean: '8901234500086', brand: 'YU', segment: 'KIDS WEAR', autoReorder: false, status: 'Inactive', effectiveFrom: '2026-04-01', effectiveTo: '2026-06-30' },
  { id: 'enr-9', styleId: 'TCO26CKSTEE401229', optionCode: '994561337BLUE', ean: '8901234500093', brand: 'YU', segment: 'KIDS WEAR', autoReorder: true, status: 'Active', effectiveFrom: '2026-04-01', effectiveTo: '' },
  { id: 'enr-10', styleId: 'TCO26CMFSHO502441', optionCode: '105678442BROWN', ean: '8901234500109', brand: 'PERFORMAX', segment: 'FOOTWEAR', autoReorder: true, status: 'Active', effectiveFrom: '2026-04-01', effectiveTo: '' },
  { id: 'enr-11', styleId: 'TCO26CMFSHO502441', optionCode: '105678442BLACK', ean: '8901234500116', brand: 'PERFORMAX', segment: 'FOOTWEAR', autoReorder: true, status: 'Rejected', effectiveFrom: '2026-05-15', effectiveTo: '' },
  { id: 'enr-12', styleId: 'TCO26CMSJKT610553', optionCode: '216789553OLIVE', ean: '8901234500123', brand: 'NETPLAY', segment: 'MENS WEAR', autoReorder: true, status: 'Active', effectiveFrom: '2026-04-01', effectiveTo: '' },
];

export const SEED_VENDOR_MOQ: VendorMoqRow[] = [
  { id: 'vmq-1', ean: '8901234500017', vendorCode: 'VND-RAY01', vendorName: 'Raymond', moq: 120, status: 'Active', effectiveFrom: '2026-04-01', effectiveTo: '' },
  { id: 'vmq-2', ean: '8901234500024', vendorCode: 'VND-RAY01', vendorName: 'Raymond', moq: 120, status: 'Active', effectiveFrom: '2026-04-01', effectiveTo: '' },
  { id: 'vmq-3', ean: '8901234500031', vendorCode: 'VND-ARV02', vendorName: 'Arvind', moq: 200, status: 'Active', effectiveFrom: '2026-04-01', effectiveTo: '' },
  { id: 'vmq-4', ean: '8901234500055', vendorCode: 'VND-SIY03', vendorName: 'Siyaram', moq: 150, status: 'Active', effectiveFrom: '2026-04-01', effectiveTo: '' },
  { id: 'vmq-5', ean: '8901234500062', vendorCode: 'VND-SIY03', vendorName: 'Siyaram', moq: 150, status: 'Active', effectiveFrom: '2026-04-01', effectiveTo: '' },
  { id: 'vmq-6', ean: '8901234500079', vendorCode: 'VND-ARV02', vendorName: 'Arvind', moq: 100, status: 'Active', effectiveFrom: '2026-04-01', effectiveTo: '' },
  { id: 'vmq-7', ean: '8901234500093', vendorCode: 'VND-RAY01', vendorName: 'Raymond', moq: 80, status: 'Active', effectiveFrom: '2026-04-01', effectiveTo: '' },
  { id: 'vmq-8', ean: '8901234500109', vendorCode: 'VND-BAT04', vendorName: 'Bata', moq: 60, status: 'Active', effectiveFrom: '2026-04-01', effectiveTo: '' },
  { id: 'vmq-9', ean: '8901234500123', vendorCode: 'VND-RAY01', vendorName: 'Raymond', moq: 90, status: 'Inactive', effectiveFrom: '2026-04-01', effectiveTo: '2026-07-31' },
];

// ─── R3: Store Replenishment / STO ───────────────────────────────────────────

export interface StoreStoRow {
  id: string;
  store: string;
  ean: string;
  /** Store Target Day Cover for this store-product (overrides the default). */
  targetDayCover: number | null;
  /** Store minimum quantity / MBQ. */
  minQty: number | null;
  status: VmiStatus;
  effectiveFrom: string;
  effectiveTo: string;
}

export interface StoreStoConfig {
  /** Baseline Store Target Day Cover (7 days). */
  defaultTargetDayCover: number;
  rows: StoreStoRow[];
}

export const DEFAULT_STORE_STO: StoreStoConfig = {
  defaultTargetDayCover: 7,
  rows: [
    { id: 'sto-1', store: 'S001', ean: '8901234500017', targetDayCover: 10, minQty: 2, status: 'Active', effectiveFrom: '2026-04-01', effectiveTo: '' },
    { id: 'sto-2', store: 'S014', ean: '8901234500017', targetDayCover: 7, minQty: 1, status: 'Active', effectiveFrom: '2026-04-01', effectiveTo: '' },
    { id: 'sto-3', store: 'S037', ean: '8901234500055', targetDayCover: 14, minQty: 4, status: 'Active', effectiveFrom: '2026-04-01', effectiveTo: '' },
    { id: 'sto-4', store: 'S001', ean: '8901234500079', targetDayCover: 7, minQty: 2, status: 'Active', effectiveFrom: '2026-04-01', effectiveTo: '' },
  ],
};

// ─── R4: DC Replenishment & PO ────────────────────────────────────────────────

export interface DcPoRow {
  id: string;
  dc: string;
  ean: string;
  /** DC target cover / PO trigger. */
  trigger: number | null;
  /** DC maximum cover for PO top-up. */
  maxCover: number | null;
  minQty: number | null;
  poEnabled: boolean;
  status: VmiStatus;
  effectiveFrom: string;
  effectiveTo: string;
}

export interface DcPoConfig {
  /** Baseline DC target cover / PO trigger (15 days). */
  defaultTrigger: number;
  /** Baseline DC maximum cover (28 days). */
  defaultMaxCover: number;
  poEnabled: boolean;
  rows: DcPoRow[];
}

export const DEFAULT_DC_PO: DcPoConfig = {
  defaultTrigger: 15,
  defaultMaxCover: 28,
  poEnabled: true,
  rows: [
    { id: 'dcpo-1', dc: 'DC-NORTH', ean: '8901234500017', trigger: 15, maxCover: 28, minQty: 60, poEnabled: true, status: 'Active', effectiveFrom: '2026-04-01', effectiveTo: '' },
    { id: 'dcpo-2', dc: 'DC-WEST', ean: '8901234500055', trigger: 12, maxCover: 30, minQty: 50, poEnabled: true, status: 'Active', effectiveFrom: '2026-04-01', effectiveTo: '' },
    { id: 'dcpo-3', dc: 'DC-NORTH', ean: '8901234500109', trigger: 15, maxCover: 28, minQty: 40, poEnabled: false, status: 'Inactive', effectiveFrom: '2026-04-01', effectiveTo: '2026-07-31' },
  ],
};

// ─── R7: In-Transit Treatment ─────────────────────────────────────────────────

export interface InTransitConfig {
  stoEnabled: boolean;
  poEnabled: boolean;
  /** In-transit look-back period (45 days). */
  lookbackDays: number | null;
  effectiveFrom: string;
  effectiveTo: string;
}

export const DEFAULT_IN_TRANSIT: InTransitConfig = {
  stoEnabled: true,
  poEnabled: true,
  lookbackDays: 45,
  effectiveFrom: '2026-04-01',
  effectiveTo: '',
};

// ─── R8: Inter-DC Shift ───────────────────────────────────────────────────────

export interface InterDcConfig {
  /** Feature flag — default Off. */
  enabled: boolean;
  /** Protected DC buffer days (15). */
  protectedBufferDays: number | null;
  /** DC-gap cover trigger (15). */
  gapCoverTrigger: number | null;
  effectiveFrom: string;
  effectiveTo: string;
}

export const DEFAULT_INTER_DC: InterDcConfig = {
  enabled: false,
  protectedBufferDays: 15,
  gapCoverTrigger: 15,
  effectiveFrom: '2026-04-01',
  effectiveTo: '',
};

// ─── R9: Defaults & Override Resolution ───────────────────────────────────────

export type OverrideScope = 'product' | 'store' | 'dc' | 'product_location';

export const OVERRIDE_SCOPES: { value: OverrideScope; label: string }[] = [
  { value: 'product_location', label: 'Product + Location' },
  { value: 'store', label: 'Store (location)' },
  { value: 'dc', label: 'DC (location)' },
  { value: 'product', label: 'Product' },
];

/** Precedence order (highest → lowest), per the requirement doc. */
export const OVERRIDE_PRECEDENCE: OverrideScope[] = ['product_location', 'store', 'dc', 'product'];

export type OverrideParameter =
  | 'sales_window'
  | 'store_cover'
  | 'dc_trigger'
  | 'dc_max_cover'
  | 'dc_to_store_lead'
  | 'vendor_to_dc_lead'
  | 'in_transit_lookback';

export const OVERRIDE_PARAMETERS: { value: OverrideParameter; label: string }[] = [
  { value: 'sales_window', label: 'Sales window (days)' },
  { value: 'store_cover', label: 'Store target day cover' },
  { value: 'dc_trigger', label: 'DC trigger cover' },
  { value: 'dc_max_cover', label: 'DC max cover' },
  { value: 'dc_to_store_lead', label: 'DC→store lead time' },
  { value: 'vendor_to_dc_lead', label: 'Vendor→DC lead time' },
  { value: 'in_transit_lookback', label: 'In-transit look-back' },
];

export interface OverrideRow {
  id: string;
  parameter: OverrideParameter;
  scope: OverrideScope;
  /** EAN / store / DC key the override applies to. */
  entityRef: string;
  value: number | null;
  reason: string;
  approver: string;
  status: VmiStatus;
  effectiveFrom: string;
  effectiveTo: string;
}

export const SEED_OVERRIDES: OverrideRow[] = [
  { id: 'ovr-1', parameter: 'store_cover', scope: 'product_location', entityRef: '8901234500017 @ S001', value: 10, reason: 'High-velocity flagship', approver: 'a.nand', status: 'Active', effectiveFrom: '2026-04-01', effectiveTo: '' },
  { id: 'ovr-2', parameter: 'sales_window', scope: 'product', entityRef: '8901234500055', value: 45, reason: 'Seasonal volatility', approver: 'a.nand', status: 'Active', effectiveFrom: '2026-04-01', effectiveTo: '' },
];

// ─── R10: Audit / version history ─────────────────────────────────────────────

export interface AuditEntry {
  id: string;
  /** Configuration group, e.g. 'Enrolment'. */
  group: string;
  /** Action, e.g. 'Saved', 'Imported', 'Reset'. */
  action: string;
  detail: string;
  by: string;
  at: string; // ISO timestamp
}

/** Generate a client-side id for new rows. */
export function newRowId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}
