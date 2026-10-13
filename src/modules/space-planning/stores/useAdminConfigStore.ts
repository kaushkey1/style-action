import { create } from 'zustand';
import { validateAdminDraft } from '../components/admin/adminConfigValidation';
import type {
  AdminConfigResponse,
  AdminConfigSections,
  AdminFieldError,
  AdminVersionInfo,
} from '../api/adminConfigApi';

/** Tab ids mirror the backend's error `tab` values + the non-section tabs. */
export type AdminTabId = keyof AdminConfigSections | 'versions' | 'overrides';

function clone<T>(value: T): T {
  return structuredClone(value);
}

interface AdminConfigState {
  /** Version number the store was last hydrated from (null = never). */
  hydratedVersion: number | null;
  versionInfo: AdminVersionInfo | null;
  original: AdminConfigSections | null;
  draft: AdminConfigSections | null;
  /** Per-section dirty flags, recomputed on every update (not in selectors). */
  dirty: Partial<Record<keyof AdminConfigSections, boolean>>;
  anyDirty: boolean;
  /** Server 422 field errors, mapped to tabs by the components. */
  fieldErrors: AdminFieldError[];
  hydrate: (resp: AdminConfigResponse) => void;
  updateSection: <K extends keyof AdminConfigSections>(
    key: K,
    value: AdminConfigSections[K],
  ) => void;
  discard: () => void;
  setFieldErrors: (errors: AdminFieldError[]) => void;
}

export const useAdminConfigStore = create<AdminConfigState>((set, get) => ({
  hydratedVersion: null,
  versionInfo: null,
  original: null,
  draft: null,
  dirty: {},
  anyDirty: false,
  fieldErrors: [],

  hydrate: (resp) => {
    const sections: AdminConfigSections = {
      planning_parameters: resp.planning_parameters,
      deduction_rules: resp.deduction_rules,
      efficiency_bands: resp.efficiency_bands,
      fixture_capacity: resp.fixture_capacity,
      floor_placement: resp.floor_placement,
      pod_master: resp.pod_master,
      format_category: resp.format_category,
      season_windows: resp.season_windows,
      mappings: resp.mappings,
      rounding_rule: resp.rounding_rule,
      lft_options: resp.lft_options,
      category_min_space: resp.category_min_space ?? {},
    };
    set({
      hydratedVersion: resp.version.version,
      versionInfo: resp.version,
      original: clone(sections),
      draft: clone(sections),
      dirty: {},
      anyDirty: false,
      fieldErrors: [],
    });
  },

  updateSection: (key, value) => {
    const { draft, original, dirty } = get();
    if (!draft || !original) return;
    const nextDraft = { ...draft, [key]: value };
    const nextDirty = {
      ...dirty,
      [key]: JSON.stringify(value) !== JSON.stringify(original[key]),
    };
    set({
      draft: nextDraft,
      dirty: nextDirty,
      anyDirty: Object.values(nextDirty).some(Boolean),
      // live client-side validation (mirrors the server's §5 rules);
      // any server 422 errors are replaced — the user is editing again
      fieldErrors: validateAdminDraft(nextDraft),
    });
  },

  discard: () => {
    const { original } = get();
    if (!original) return;
    set({ draft: clone(original), dirty: {}, anyDirty: false, fieldErrors: [] });
  },

  setFieldErrors: (errors) => set({ fieldErrors: errors }),
}));
