/**
 * Zustand store for ANR admin configuration — API-backed.
 *
 * Manages fetch, local edits, and save for a single workflow type.
 * Organization ID is resolved from the X-Org-ID header automatically.
 */

import { create } from 'zustand';
import type { ANRConfigData, ANRConstants, ANRFilterRule, WorkflowType } from '../data/anrConfigTypes';
import {
  fetchFullConfig,
  batchUpdateConstants,
  updateFilterRule,
  toggleDataSource,
  resetConstantsToDefaults,
  type ApiConstant,
  type ApiFullConfig,
} from '../api/adminApi';

interface ANRAdminState {
  /** Transformed config for component consumption. */
  config: ANRConfigData | null;
  /** Raw API response (kept for reverse mapping on save). */
  raw: ApiFullConfig | null;
  /** Original config snapshot for reset. */
  original: ANRConfigData | null;

  loading: boolean;
  saving: boolean;
  error: string | null;

  // --- Actions ---
  fetch: (workflowType: WorkflowType) => Promise<void>;
  setConfig: (config: ANRConfigData) => void;
  updateConstants: (constants: ANRConstants) => void;
  updateFilterRules: (rules: ANRFilterRule[]) => void;
  save: (workflowType: WorkflowType) => Promise<void>;
  resetToDefaults: (workflowType: WorkflowType) => Promise<void>;
  reset: () => void;
}

export const useANRAdminStore = create<ANRAdminState>((set, get) => ({
  config: null,
  raw: null,
  original: null,
  loading: false,
  saving: false,
  error: null,

  fetch: async (workflowType) => {
    set({ loading: true, error: null });
    try {
      const { raw, config } = await fetchFullConfig(workflowType);
      set({
        config,
        raw,
        original: structuredClone(config),
        loading: false,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to load config',
        loading: false,
      });
    }
  },

  setConfig: (config) => set({ config }),

  updateConstants: (constants) => {
    const { config } = get();
    if (config) set({ config: { ...config, constants } });
  },

  updateFilterRules: (rules) => {
    const { config } = get();
    if (config) set({ config: { ...config, filter_rules: rules } });
  },

  save: async (workflowType) => {
    const { config, raw, original } = get();
    if (!config || !raw || !original) return;

    set({ saving: true, error: null });
    try {
      // 1. Save only changed constants
      await batchUpdateConstants(
        workflowType,
        config.constants,
        original.constants,
        raw.constants as ApiConstant[],
      );

      // 2. Save filter rules that changed
      for (let i = 0; i < config.filter_rules.length; i++) {
        const current = config.filter_rules[i];
        const orig = original.filter_rules[i];
        if (!current || !orig) continue;
        if (
          current.is_active !== orig.is_active ||
          current.value !== orig.value
        ) {
          const updates: { value?: { value: unknown }; is_active?: boolean } = {};
          if (current.is_active !== orig.is_active) {
            updates.is_active = current.is_active;
          }
          if (current.value !== orig.value) {
            updates.value = { value: current.value };
          }
          await updateFilterRule(workflowType, current.name, updates);
        }
      }

      // 3. Save data source toggles that changed
      const allSources = [
        ...(config.data_sources ?? []),
        ...(config.custom_data_sources ?? []),
      ];
      const allOrigSources = [
        ...(original.data_sources ?? []),
        ...(original.custom_data_sources ?? []),
      ];
      for (const src of allSources) {
        const origSrc = allOrigSources.find((s) => s.name === src.name);
        if (origSrc && src.is_active !== origSrc.is_active) {
          await toggleDataSource(workflowType, src.name, src.is_active);
        }
      }

      // Refresh from server after save
      const { raw: newRaw, config: newConfig } = await fetchFullConfig(workflowType);
      set({
        config: newConfig,
        raw: newRaw,
        original: structuredClone(newConfig),
        saving: false,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to save config',
        saving: false,
      });
      throw err;
    }
  },

  resetToDefaults: async (workflowType) => {
    set({ saving: true, error: null });
    try {
      await resetConstantsToDefaults(workflowType);
      // Re-fetch to get the reset values
      const { raw, config } = await fetchFullConfig(workflowType);
      set({
        config,
        raw,
        original: structuredClone(config),
        saving: false,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to reset to defaults',
        saving: false,
      });
      throw err;
    }
  },

  reset: () => {
    const { original } = get();
    if (original) {
      set({ config: structuredClone(original), error: null });
    }
  },
}));
