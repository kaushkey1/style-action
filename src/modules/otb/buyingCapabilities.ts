/**
 * Buying-local capability layer (spec v10, Part 6 + BR-127/BR-133).
 *
 * The shared matrix in `@/permissions` is deliberately coarse: six modules ×
 * three actions (view / edit / approve). That is the right granularity for the
 * console as a whole, and it stays the outer gate.
 *
 * It cannot, however, express the Buying module's four distinct stage gates —
 * collapsing them loses BR-127 entirely, because "approve the buy plan",
 * "approve the OTB", "submit the PO" and "approve the PO" all flatten to a
 * single `approve` on two modules. That is exactly how the CFO's release
 * control came to be guarded by `otb.approve`, which Commercial also holds.
 *
 * So the stage gates live here, derived from the role slugs the app already
 * issues. No other module is affected.
 */

export type BuyingCapability =
  | 'buyplan.view'
  | 'buyplan.flag'
  | 'buyplan.approve'        // BR-127 gate 1 — Planner
  | 'buyplan.held.decide'
  | 'otb.view'
  | 'otb.approve'            // BR-127 gate 2 — Commercial
  | 'otb.hold'
  | 'otb.reject'
  | 'otb.exception.resolve'
  | 'exception.approve'
  | 'po.view'
  | 'po.submit'              // BR-127 gate 3 — Buyer
  | 'po.approve'             // BR-127 gate 4 — CFO
  | 'po.release'             // BR-127 gate 4 — CFO
  | 'admin.configure'

/**
 * Role slug → capabilities.
 *
 * `pm` is treated as the Planner and `buyer` as the Buyer, because BR-123
 * separates them: a Planner approves the buy plan before OTB exists, a Buyer
 * submits purchase orders after it does. The app's DevRoleSwitcher labels
 * `buyer` as "Buyer / Planner", which fuses the two — worth confirming with
 * the business before this reaches SIT.
 */
const MATRIX: Record<string, BuyingCapability[]> = {
  pm: ['buyplan.view', 'buyplan.flag', 'buyplan.approve', 'otb.view', 'po.view'],

  buyer: ['buyplan.view', 'buyplan.flag', 'otb.view', 'po.view', 'po.submit'],

  'format-head': [
    'buyplan.view', 'buyplan.flag', 'otb.view', 'po.view',
  ],

  'financial-commercial-admin': [
    'buyplan.view', 'buyplan.held.decide',
    'otb.view', 'otb.approve', 'otb.hold', 'otb.reject', 'otb.exception.resolve',
    'po.view',
  ],

  // BR-127a — at OTB the CFO holds a veto, not an approval: hold and reject,
  // but not approve. The PO gates are theirs alone.
  ceo: [
    'buyplan.view', 'otb.view', 'otb.hold', 'otb.reject',
    'exception.approve',
    'po.view', 'po.approve', 'po.release',
  ],

  'super-admin': [
    'buyplan.view', 'buyplan.flag', 'buyplan.approve', 'buyplan.held.decide',
    'otb.view', 'otb.approve', 'otb.hold', 'otb.reject', 'otb.exception.resolve',
    'exception.approve',
    'po.view', 'po.submit', 'po.approve', 'po.release',
    'admin.configure',
  ],
}

/** Every capability a role holds. Unknown roles get read-only. */
export function capabilitiesFor(roleSlug: string | null | undefined): BuyingCapability[] {
  if (!roleSlug) return []
  return MATRIX[roleSlug] ?? ['buyplan.view', 'otb.view', 'po.view']
}

export function roleHas(roleSlug: string | null | undefined, cap: BuyingCapability): boolean {
  return capabilitiesFor(roleSlug).includes(cap)
}

/** The four stage gates of BR-127, for the reachability test and the admin screen. */
export const STAGE_GATES: ReadonlyArray<{ id: string; label: string; cap: BuyingCapability }> = [
  { id: 'BR-127.1', label: 'Approve the Buy Plan', cap: 'buyplan.approve' },
  { id: 'BR-127.2', label: 'Approve the OTB', cap: 'otb.approve' },
  { id: 'BR-127.3', label: 'Submit the purchase order', cap: 'po.submit' },
  { id: 'BR-127.4', label: 'Approve and release the purchase order', cap: 'po.approve' },
]

export const ALL_BUYING_CAPABILITIES: BuyingCapability[] = [
  'buyplan.view', 'buyplan.flag', 'buyplan.approve', 'buyplan.held.decide',
  'otb.view', 'otb.approve', 'otb.hold', 'otb.reject', 'otb.exception.resolve',
  'exception.approve',
  'po.view', 'po.submit', 'po.approve', 'po.release',
  'admin.configure',
]

export const BUYING_ROLE_SLUGS = Object.keys(MATRIX)
