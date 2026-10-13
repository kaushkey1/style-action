import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { useAuthStore } from '@/hooks/useAuthStore'

export type SubmissionStatus = 'draft' | 'submitted' | 'calculating_otb' | 'otb_ready' | 'otb_approved' | 'otb_held' | 'released'
export type OTBCatStatus = 'pending' | 'approved' | 'rejected' | 'held'
export type POItemStatus = 'pending' | 'approved' | 'flagged' | 'released'

/** BR-115 — a Planner flags a held cell; the flag then walks the chain. */
export type FlagStage =
  | 'planner_flagged'
  | 'commercial_reviewed'
  | 'cathead_requested'
  | 'fnl_approved'
  | 'refused'

export interface CellFlag {
  reason: string
  comment: string
  stage: FlagStage
  history: Array<{ stage: FlagStage; at: string; by: string; comment?: string }>
}

/** BR-119 — one entry per state change: who, when, what changed, and why. */
export interface AuditEntry {
  id: string
  at: string
  actor: string
  role: string
  screen: string
  action: string
  object: string
  key: string
  from?: string | null
  to?: string | null
  reason?: string | null
  denied?: boolean
}

interface BuyPlanStore {
  // OTB submission flow: key = brickCode
  categorySubmissions: Record<string, SubmissionStatus>
  // Commercial held-option decisions: optionCode → decision
  heldDecisions: Record<string, 'accept' | 'reject'>
  // Commercial OTB exception resolutions: catCode → exceptionId → decision
  otbResolutions: Record<string, Record<string, 'approved' | 'rejected'>>

  // PO flow: brickKey → option codes sent for CFO approval
  poSentOptions: Record<string, string[]>
  // PO created: brickKey → optCode → PO number
  poCreatedOptions: Record<string, Record<string, string>>

  // OTB Category review state: saleMonth → catCode → status (persists across navigation)
  otbCategoryStatuses: Record<string, Record<string, OTBCatStatus>>
  // OTB Category reductions: saleMonth → catCode → reduction%
  otbCategoryReductions: Record<string, Record<string, number>>

  // PO item statuses: poId → status (persists across navigation)
  poItemStatuses: Record<string, POItemStatus>

  /* ── slices the screens already referenced but which did not exist ──────
     Two pages read `flaggedOptions` and `plannerEdits` off this store through
     `as unknown as` casts; neither field was ever here, so "Flagged by Planner"
     was permanently zero. */
  cellFlags: Record<string, CellFlag>
  otbNumbers: Record<string, Record<string, string>>
  otbRecompute: Record<string, Record<string, { units: number; reason: string }>>
  exceptionStatus: Record<string, 'approved' | 'rejected'>
  audit: AuditEntry[]

  flagCell: (code: string, reason: string, comment: string) => void
  advanceFlag: (code: string, stage: FlagStage, comment?: string) => void
  setExceptionStatus: (id: string, status: 'approved' | 'rejected') => void
  markOTBStale: (saleMonth: string, catCode: string, units: number, reason: string) => void
  clearOTBStale: (saleMonth: string, catCode: string) => void
  mintOTBNumber: (saleMonth: string, catCode: string) => string
  logAudit: (e: Omit<AuditEntry, 'id' | 'at' | 'actor' | 'role'>) => void
  setPoItemStatus: (id: string, status: POItemStatus) => void
  setPoItemStatuses: (updates: Record<string, POItemStatus>) => void

  // OTB submission actions
  submitForCommercialReview: (key: string) => void
  setHeldDecision: (optionCode: string, decision: 'accept' | 'reject') => void
  calculateOTB: (key: string) => void
  approveOTB: (key: string) => void
  holdOTB: (key: string) => void
  resolveOTBException: (catCode: string, exId: string, decision: 'approved' | 'rejected') => void

  // OTB category review actions
  setOTBCategoryStatus: (saleMonth: string, catCode: string, status: OTBCatStatus) => void
  setOTBCategoryReduction: (saleMonth: string, catCode: string, pct: number) => void

  // PO actions
  sendForPOApproval: (brickKey: string, optionCodes: string[]) => void
  cfoCertifyPOs: (brickKey: string) => void

  reset: () => void
}

/** Screen tag derived from the route, so no call site has to remember it. */
function screenOf(): string {
  const p = typeof location !== 'undefined' ? location.pathname : ''
  if (p.startsWith('/buy-plans')) return 'Buy Plan'
  if (p.startsWith('/otb/exceptions')) return 'Exception Queue'
  if (p.startsWith('/otb')) return 'OTB'
  if (p.startsWith('/po-review')) return 'PO Review'
  if (p.startsWith('/test-scale')) return 'Test & Scale'
  if (p.startsWith('/admin')) return 'Admin'
  return 'Elsewhere'
}

function actorNow(): { actor: string; role: string } {
  try {
    const st = useAuthStore.getState()
    const u = st.user as { name?: string; email?: string } | null | undefined
    return { actor: u?.name ?? u?.email ?? 'Demo user', role: st.activeRoleSlug ?? 'unknown' }
  } catch {
    return { actor: 'Demo user', role: 'unknown' }
  }
}

const stamp = () => {
  const d = new Date()
  const p2 = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())} ${p2(d.getHours())}:${p2(d.getMinutes())}:${p2(d.getSeconds())}`
}

export const useBuyPlanStore = create<BuyPlanStore>()(
  persist(
    (set, get) => ({
  categorySubmissions: {},
  heldDecisions: {},
  otbResolutions: {},
  poSentOptions: {},
  poCreatedOptions: {},
  otbCategoryStatuses: {},
  otbCategoryReductions: {},
  poItemStatuses: {},
  cellFlags: {},
  otbNumbers: {},
  otbRecompute: {},
  exceptionStatus: {},
  audit: [],

  logAudit: (e) =>
    set((state) => ({
      audit: [
        ...state.audit,
        {
          id: 'e' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
          at: stamp(),
          ...actorNow(),
          ...e,
        },
      ],
    })),

  /* BR-115 — the flag carries a mandatory reason and comment; quantity is untouched. */
  flagCell: (code, reason, comment) => {
    const { actor } = actorNow()
    set((state) => ({
      cellFlags: {
        ...state.cellFlags,
        [code]: {
          reason,
          comment,
          stage: 'planner_flagged',
          history: [{ stage: 'planner_flagged', at: stamp(), by: actor, comment }],
        },
      },
    }))
    get().logAudit({
      screen: screenOf(), action: 'Cell flagged for review', object: 'Option', key: code,
      from: 'held', to: 'planner_flagged', reason: `${reason} — ${comment}`,
    })
  },

  advanceFlag: (code, stage, comment) => {
    const cur = get().cellFlags[code]
    if (!cur) return
    const { actor } = actorNow()
    set((state) => ({
      cellFlags: {
        ...state.cellFlags,
        [code]: {
          ...cur,
          stage,
          history: [...cur.history, { stage, at: stamp(), by: actor, comment }],
        },
      },
    }))
    get().logAudit({
      screen: screenOf(), action: `Flag advanced to ${stage}`, object: 'Option', key: code,
      from: cur.stage, to: stage, reason: comment ?? null,
    })
  },

  setExceptionStatus: (id, status) => {
    const prev = get().exceptionStatus[id]
    set((state) => ({ exceptionStatus: { ...state.exceptionStatus, [id]: status } }))
    get().logAudit({
      screen: screenOf(), action: `Exception ${status}`, object: 'Exception', key: id,
      from: prev ?? 'pending', to: status,
    })
  },

  /* BR-117 — an approved override leaves OTB stale until it is recomputed. */
  markOTBStale: (saleMonth, catCode, units, reason) => {
    set((state) => ({
      otbRecompute: {
        ...state.otbRecompute,
        [saleMonth]: { ...(state.otbRecompute[saleMonth] ?? {}), [catCode]: { units, reason } },
      },
    }))
    get().logAudit({
      screen: screenOf(), action: 'OTB marked stale by override', object: 'OTB category',
      key: `${saleMonth} · ${catCode}`, from: 'current', to: 'recompute required', reason,
    })
  },

  clearOTBStale: (saleMonth, catCode) => {
    const pending = get().otbRecompute[saleMonth]?.[catCode]
    set((state) => {
      const month = { ...(state.otbRecompute[saleMonth] ?? {}) }
      delete month[catCode]
      return { otbRecompute: { ...state.otbRecompute, [saleMonth]: month } }
    })
    get().logAudit({
      screen: screenOf(), action: 'OTB recomputed', object: 'OTB category',
      key: `${saleMonth} · ${catCode}`, from: 'stale', to: 'current',
      reason: pending ? `+${pending.units} override unit(s) folded in` : null,
    })
  },

  /* BR-103 — the OTB reference is minted on approval, never before. */
  mintOTBNumber: (saleMonth, catCode) => {
    const existing = get().otbNumbers[saleMonth]?.[catCode]
    if (existing) return existing
    const num = `OTB-${saleMonth}-${catCode}`
    set((state) => ({
      otbNumbers: {
        ...state.otbNumbers,
        [saleMonth]: { ...(state.otbNumbers[saleMonth] ?? {}), [catCode]: num },
      },
    }))
    return num
  },

  submitForCommercialReview: (key) =>
    set((state) => ({
      categorySubmissions: { ...state.categorySubmissions, [key]: 'submitted' },
    })),

  setHeldDecision: (optionCode, decision) =>
    set((state) => ({
      heldDecisions: { ...state.heldDecisions, [optionCode]: decision },
    })),

  calculateOTB: (key) => {
    set((state) => ({
      categorySubmissions: { ...state.categorySubmissions, [key]: 'calculating_otb' },
    }))
    setTimeout(() => {
      set((state) => ({
        categorySubmissions: { ...state.categorySubmissions, [key]: 'otb_ready' },
      }))
    }, 2000)
  },

  approveOTB: (key) =>
    set((state) => ({
      categorySubmissions: { ...state.categorySubmissions, [key]: 'otb_approved' },
    })),

  holdOTB: (key) =>
    set((state) => ({
      categorySubmissions: { ...state.categorySubmissions, [key]: 'otb_held' },
    })),

  resolveOTBException: (catCode, exId, decision) =>
    set((state) => ({
      otbResolutions: {
        ...state.otbResolutions,
        [catCode]: {
          ...(state.otbResolutions[catCode] ?? {}),
          [exId]: decision,
        },
      },
    })),

  setOTBCategoryStatus: (saleMonth, catCode, status) =>
    set((state) => ({
      otbCategoryStatuses: {
        ...state.otbCategoryStatuses,
        [saleMonth]: {
          ...(state.otbCategoryStatuses[saleMonth] ?? {}),
          [catCode]: status,
        },
      },
    })),

  setOTBCategoryReduction: (saleMonth, catCode, pct) =>
    set((state) => ({
      otbCategoryReductions: {
        ...state.otbCategoryReductions,
        [saleMonth]: {
          ...(state.otbCategoryReductions[saleMonth] ?? {}),
          [catCode]: pct,
        },
      },
    })),

  setPoItemStatus: (id, status) =>
    set((state) => ({
      poItemStatuses: { ...state.poItemStatuses, [id]: status },
    })),

  setPoItemStatuses: (updates) =>
    set((state) => ({
      poItemStatuses: { ...state.poItemStatuses, ...updates },
    })),

  sendForPOApproval: (brickKey, optionCodes) =>
    set((state) => ({
      poSentOptions: {
        ...state.poSentOptions,
        [brickKey]: [...new Set([...(state.poSentOptions[brickKey] ?? []), ...optionCodes])],
      },
    })),

  cfoCertifyPOs: (brickKey) => {
    const sent = get().poSentOptions[brickKey] ?? []
    if (sent.length === 0) return
    const created: Record<string, string> = {}
    sent.forEach((code, i) => {
      const seq = String(i + 1).padStart(3, '0')
      created[code] = `PO-${brickKey}-${seq}`
    })
    set((state) => ({
      poCreatedOptions: {
        ...state.poCreatedOptions,
        [brickKey]: { ...(state.poCreatedOptions[brickKey] ?? {}), ...created },
      },
      // Clear sent queue after PO creation
      poSentOptions: { ...state.poSentOptions, [brickKey]: [] },
      categorySubmissions: { ...state.categorySubmissions, [brickKey]: 'released' },
    }))
  },

  /* BR-119b — the reset is itself recorded. Wiping the evidence silently is
     how the prototype's audit trail lost its meaning. */
  reset: () => {
    const before = get().audit.length
    const { actor, role } = actorNow()
    set({
      categorySubmissions: {},
      heldDecisions: {},
      otbResolutions: {},
      poSentOptions: {},
      poCreatedOptions: {},
      otbCategoryStatuses: {},
      otbCategoryReductions: {},
      poItemStatuses: {},
      cellFlags: {},
      otbNumbers: {},
      otbRecompute: {},
      exceptionStatus: {},
      audit: [
        {
          id: 'e' + Date.now().toString(36),
          at: stamp(),
          actor,
          role,
          screen: screenOf(),
          action: 'Demonstration data reset',
          object: 'Configuration',
          key: 'all decisions',
          from: `${before} event(s)`,
          to: 'cleared',
        },
      ],
    })
  },
    }),
    {
      name: 'impetus-buyplan-v1',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
