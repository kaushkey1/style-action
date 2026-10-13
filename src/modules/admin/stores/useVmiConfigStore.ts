import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  DEFAULT_DC_PO,
  DEFAULT_IN_TRANSIT,
  DEFAULT_INTER_DC,
  DEFAULT_LEAD_TIMES,
  DEFAULT_SALES_WINDOW,
  DEFAULT_STORE_STO,
  SEED_ENROLMENT,
  SEED_OVERRIDES,
  SEED_VENDOR_MOQ,
  newRowId,
  type AuditEntry,
  type DcPoConfig,
  type EnrolmentRow,
  type InTransitConfig,
  type InterDcConfig,
  type LeadTimesConfig,
  type OverrideRow,
  type SalesWindowConfig,
  type StoreStoConfig,
  type VendorMoqRow,
} from '../data/vmiConfigSeed';

/**
 * Local (frontend-only) VMI configuration store for the admin prototype.
 * Persisted to localStorage so edits survive reloads. Each tab commits its own
 * draft via the setters below; there is no backend yet.
 */
interface VmiConfigState {
  enrolment: EnrolmentRow[];
  vendorMoq: VendorMoqRow[];
  salesWindow: SalesWindowConfig;
  leadTimes: LeadTimesConfig;
  storeSto: StoreStoConfig;
  dcPo: DcPoConfig;
  inTransit: InTransitConfig;
  interDc: InterDcConfig;
  overrides: OverrideRow[];
  /** Version history — newest first. */
  auditLog: AuditEntry[];
  /** ISO timestamp of the last committed change, or null. */
  lastModified: string | null;

  recordAudit: (group: string, action: string, detail: string) => void;
  setEnrolment: (rows: EnrolmentRow[]) => void;
  setVendorMoq: (rows: VendorMoqRow[]) => void;
  setSalesWindow: (config: SalesWindowConfig) => void;
  setLeadTimes: (config: LeadTimesConfig) => void;
  setStoreSto: (config: StoreStoConfig) => void;
  setDcPo: (config: DcPoConfig) => void;
  setInTransit: (config: InTransitConfig) => void;
  setInterDc: (config: InterDcConfig) => void;
  setOverrides: (rows: OverrideRow[]) => void;
  resetAll: () => void;
}

function stamp(): string {
  return new Date().toISOString();
}

const AUDIT_LIMIT = 100;
const AUDIT_USER = 'admin@local';

const SEED_STATE = {
  enrolment: SEED_ENROLMENT,
  vendorMoq: SEED_VENDOR_MOQ,
  salesWindow: DEFAULT_SALES_WINDOW,
  leadTimes: DEFAULT_LEAD_TIMES,
  storeSto: DEFAULT_STORE_STO,
  dcPo: DEFAULT_DC_PO,
  inTransit: DEFAULT_IN_TRANSIT,
  interDc: DEFAULT_INTER_DC,
  overrides: SEED_OVERRIDES,
  auditLog: [] as AuditEntry[],
};

export const useVmiConfigStore = create<VmiConfigState>()(
  persist(
    (set) => ({
      ...SEED_STATE,
      lastModified: null,

      recordAudit: (group, action, detail) =>
        set((state) => ({
          auditLog: [
            { id: newRowId('aud'), group, action, detail, by: AUDIT_USER, at: stamp() },
            ...state.auditLog,
          ].slice(0, AUDIT_LIMIT),
        })),
      setEnrolment: (rows) => set({ enrolment: rows, lastModified: stamp() }),
      setVendorMoq: (rows) => set({ vendorMoq: rows, lastModified: stamp() }),
      setSalesWindow: (config) => set({ salesWindow: config, lastModified: stamp() }),
      setLeadTimes: (config) => set({ leadTimes: config, lastModified: stamp() }),
      setStoreSto: (config) => set({ storeSto: config, lastModified: stamp() }),
      setDcPo: (config) => set({ dcPo: config, lastModified: stamp() }),
      setInTransit: (config) => set({ inTransit: config, lastModified: stamp() }),
      setInterDc: (config) => set({ interDc: config, lastModified: stamp() }),
      setOverrides: (rows) => set({ overrides: rows, lastModified: stamp() }),
      resetAll: () => set({ ...SEED_STATE, lastModified: null }),
    }),
    { name: 'vmi-config', version: 3 },
  ),
);
