// ═══════════════════════════════════════════════════════════════════════════
// Permission Matrix — Normalized, zero-redundancy design
//
// 3NF structure:
//   1. ACTIONS    — atomic action groups (view, edit, approve)
//   2. PRESETS    — named action sets, each defined once
//   3. MODULES    — module identifiers
//   4. PROFILES   — unique permission shapes (profile → module → preset)
//   5. ROLES      — role → profile assignment (many-to-one)
//   6. RESOLVED   — flat Map for O(1) runtime lookups
//
// To add a role:   add one entry to ROLES
// To add a module:  add to ModuleSlug + update PROFILES
// To add an action: add to Action + update PRESETS
// ═══════════════════════════════════════════════════════════════════════════

// ── 1. Actions ─────────────────────────────────────────────────────────────
// view     → view data + download / export
// edit     → edit + delete + submit + create
// approve  → approve + reject

export type Action = 'view' | 'edit' | 'approve';

const ALL_ACTIONS: readonly Action[] = ['view', 'edit', 'approve'] as const;

// ── 2. Presets ─────────────────────────────────────────────────────────────
// Each preset is a superset of the one above it (READ ⊂ WRITE ⊂ APPROVE).

const PRESETS = {
  READ:    ['view'],
  WRITE:   ['view', 'edit'],
  APPROVE: ['view', 'edit', 'approve'],
} as const;

type Preset = keyof typeof PRESETS;

// ── 3. Modules ─────────────────────────────────────────────────────────────

export type ModuleSlug =
  | 'buyPlan'
  | 'otb'
  | 'dp'
  | 'rangeArch'
  | 'inventory'
  | 'anr';

const ALL_MODULES: readonly ModuleSlug[] = [
  'buyPlan', 'otb', 'dp', 'rangeArch', 'inventory', 'anr',
] as const;

// ── 4. Profiles ────────────────────────────────────────────────────────────
// Each profile is a unique permission shape. A module can be:
//   Preset name → grants those actions
//   null        → no access (hidden)
//   (omitted)   → defaults to READ

type ProfileDef = Partial<Record<ModuleSlug, Preset | null>>;

const PROFILES: Record<string, ProfileDef> = {
  FULL_APPROVE: { buyPlan: 'APPROVE', otb: 'APPROVE', dp: 'APPROVE', rangeArch: 'APPROVE', inventory: 'APPROVE', anr: 'APPROVE' },
  FULL_WRITE:   { buyPlan: 'WRITE',   otb: 'WRITE',   dp: 'WRITE',   rangeArch: 'WRITE',   inventory: 'WRITE',   anr: 'WRITE' },
  PLANNING:     { buyPlan: 'WRITE',   dp: 'WRITE',   rangeArch: 'WRITE' },
  OPS:          { inventory: 'WRITE', anr: 'WRITE' },
  OPS_NO_RANGE: { inventory: 'WRITE', anr: 'WRITE', rangeArch: null },
  // Category Head: can approve buy plans + view OTB, no range arch access
  CAT_APPROVE:  { buyPlan: 'APPROVE', otb: 'WRITE', inventory: 'WRITE', anr: 'WRITE', rangeArch: null },
  // Commercial: approves OTB (BR-127 gate 2). Everything else stays at WRITE —
  // FULL_APPROVE would silently grant approve on dp, rangeArch, inventory and
  // anr, which belong to other teams and are not Buying's to elevate.
  COMMERCIAL_APPROVE: { buyPlan: 'WRITE', otb: 'APPROVE', dp: 'WRITE', rangeArch: 'WRITE', inventory: 'WRITE', anr: 'WRITE' },
  READ_ONLY:    {},
};

// ── 5. Roles ───────────────────────────────────────────────────────────────
// Each role maps to exactly one profile. Many roles share a profile.
// Role slugs are lowercase to match backend (lookup normalizes with toLowerCase).

const ROLES: Record<string, string> = {
  'super-admin':                'FULL_APPROVE',
  'ceo':                        'FULL_APPROVE',
  'planning-super-admin':       'FULL_APPROVE',

  'product-support':            'FULL_WRITE',
  'financial-commercial-admin': 'COMMERCIAL_APPROVE',

  'buyer':                      'PLANNING',
  'pm':                         'PLANNING',
  'radmin-buyer':               'PLANNING',

  'sourcing-admin':             'OPS',
  'sourcing-head':              'OPS',
  'format-manager':             'OPS',
  'bizops-user-l1':             'OPS',
  'bizops-user-l2':             'OPS',
  'bizops-user-l3':             'OPS',
  'bizops-user-l4':             'OPS',

  'format-head':                'CAT_APPROVE',
  'cluster-manager':            'OPS_NO_RANGE',
  'sourcing-member':            'OPS_NO_RANGE',

  'finance-admin':              'READ_ONLY',
  'procuro-admin':              'READ_ONLY',
  'sourcing':                   'READ_ONLY',
  'planning-test-role':         'READ_ONLY',
};

// ── 6. Resolution ──────────────────────────────────────────────────────────
// Expand (role × module × action) into a flat Map at import time.
// Runtime lookups are a single Map.get() — O(1).

function resolve(): Map<string, boolean> {
  const map = new Map<string, boolean>();

  for (const [role, profileKey] of Object.entries(ROLES)) {
    const profile = PROFILES[profileKey] ?? {};

    for (const mod of ALL_MODULES) {
      const entry = profile[mod];
      const preset: Preset | null = entry === undefined ? 'READ' : entry;

      for (const action of ALL_ACTIONS) {
        const granted =
          preset !== null && (PRESETS[preset] as readonly string[]).includes(action);
        map.set(`${role}:${mod}:${action}`, granted);
      }
    }
  }

  return map;
}

const resolved = resolve();

// ── Public API ─────────────────────────────────────────────────────────────

export function hasPermission(
  roleSlug: string | null,
  module: ModuleSlug,
  action: Action,
): boolean {
  if (!roleSlug) return false;
  const key = `${roleSlug.toLowerCase()}:${module}:${action}`;
  return resolved.get(key) ?? (action === 'view');
}

export function getModulePermissions(
  roleSlug: string | null,
  module: ModuleSlug,
): Record<Action, boolean> {
  return {
    view: hasPermission(roleSlug, module, 'view'),
    edit: hasPermission(roleSlug, module, 'edit'),
    approve: hasPermission(roleSlug, module, 'approve'),
  };
}
