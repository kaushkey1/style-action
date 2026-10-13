import { create } from 'zustand';

import type {
  CatalogExtension,
  InstalledExtension,
  ExtensionInstance,
  EventType,
  Subscription,
  DatasetConfig,
  PaginatedQueryLogs,
  InstallExtensionInput,
  UpdateExtensionInput,
  CreateDatasetInput,
  UpdateDatasetInput,
  InstanceStatus,
} from '../data/extensionTypes';
import * as api from '../api/extensionsApi';

interface ExtensionState {
  // ─── List Page ────────────────────────────────────────────────────────────
  catalog: CatalogExtension[];
  installed: InstalledExtension[];
  catalogLoading: boolean;
  installedLoading: boolean;
  listError: string | null;

  // ─── Detail Page ──────────────────────────────────────────────────────────
  detail: ExtensionInstance | null;
  eventTypes: EventType[];
  subscriptions: Subscription[];
  datasets: DatasetConfig[];
  queryLogs: PaginatedQueryLogs | null;
  detailLoading: boolean;
  detailError: string | null;

  // ─── Mutations ────────────────────────────────────────────────────────────
  saving: boolean;
  saveError: string | null;

  // ─── List Actions ─────────────────────────────────────────────────────────
  fetchCatalog: () => Promise<void>;
  fetchInstalled: () => Promise<void>;
  install: (input: InstallExtensionInput) => Promise<ExtensionInstance>;

  // ─── Detail Actions ───────────────────────────────────────────────────────
  fetchDetail: (slug: string) => Promise<void>;
  updateExtension: (slug: string, input: UpdateExtensionInput) => Promise<void>;
  uninstall: (slug: string) => Promise<void>;
  toggle: (slug: string) => Promise<InstanceStatus>;

  // ─── Subscription Actions ─────────────────────────────────────────────────
  fetchEventTypes: () => Promise<void>;
  fetchSubscriptions: (slug: string) => Promise<void>;
  subscribe: (slug: string, eventTypeIds: string[]) => Promise<void>;
  unsubscribe: (slug: string, eventTypeId: string) => Promise<void>;

  // ─── Dataset Actions ──────────────────────────────────────────────────────
  fetchDatasets: (slug: string) => Promise<void>;
  createDataset: (slug: string, input: CreateDatasetInput) => Promise<void>;
  updateDataset: (slug: string, configId: string, input: UpdateDatasetInput) => Promise<void>;
  deleteDataset: (slug: string, configId: string) => Promise<void>;

  // ─── Query Log Actions ────────────────────────────────────────────────────
  fetchQueryLogs: (slug: string, page: number, pageSize: number) => Promise<void>;

  // ─── iframe ───────────────────────────────────────────────────────────────
  fetchIframeUrl: (slug: string) => Promise<string>;

  // ─── Reset ────────────────────────────────────────────────────────────────
  resetDetail: () => void;
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'An unexpected error occurred';
}

export const useExtensionStore = create<ExtensionState>((set, get) => ({
  // ─── Initial State ────────────────────────────────────────────────────────
  catalog: [],
  installed: [],
  catalogLoading: false,
  installedLoading: false,
  listError: null,

  detail: null,
  eventTypes: [],
  subscriptions: [],
  datasets: [],
  queryLogs: null,
  detailLoading: false,
  detailError: null,

  saving: false,
  saveError: null,

  // ─── List Actions ─────────────────────────────────────────────────────────

  fetchCatalog: async () => {
    set({ catalogLoading: true, listError: null });
    try {
      const catalog = await api.fetchCatalog();
      set({ catalog, catalogLoading: false });
    } catch (err) {
      set({ listError: errorMessage(err), catalogLoading: false });
    }
  },

  fetchInstalled: async () => {
    set({ installedLoading: true, listError: null });
    try {
      const installed = await api.fetchInstalled();
      set({ installed, installedLoading: false });
    } catch (err) {
      set({ listError: errorMessage(err), installedLoading: false });
    }
  },

  install: async (input) => {
    set({ saving: true, saveError: null });
    try {
      const instance = await api.installExtension(input);
      const installed = await api.fetchInstalled();
      set({ installed, saving: false });
      return instance;
    } catch (err) {
      set({ saveError: errorMessage(err), saving: false });
      throw err;
    }
  },

  // ─── Detail Actions ───────────────────────────────────────────────────────

  fetchDetail: async (slug) => {
    set({ detailLoading: true, detailError: null });
    try {
      const [detail, eventTypes, subscriptions, datasets] = await Promise.all([
        api.fetchExtensionDetail(slug),
        api.fetchEventTypes(),
        api.fetchSubscriptions(slug),
        api.fetchDatasets(slug),
      ]);
      set({ detail, eventTypes, subscriptions, datasets, detailLoading: false });
    } catch (err) {
      set({ detailError: errorMessage(err), detailLoading: false });
    }
  },

  updateExtension: async (slug, input) => {
    set({ saving: true, saveError: null });
    try {
      const detail = await api.updateExtension(slug, input);
      set({ detail, saving: false });
    } catch (err) {
      set({ saveError: errorMessage(err), saving: false });
      throw err;
    }
  },

  uninstall: async (slug) => {
    set({ saving: true, saveError: null });
    try {
      await api.uninstallExtension(slug);
      const { installed } = get();
      set({
        installed: installed.filter((e) => e.slug !== slug),
        detail: null,
        saving: false,
      });
    } catch (err) {
      set({ saveError: errorMessage(err), saving: false });
      throw err;
    }
  },

  toggle: async (slug) => {
    set({ saving: true, saveError: null });
    try {
      const result = await api.toggleExtension(slug);
      const { detail, installed } = get();
      if (detail) {
        set({ detail: { ...detail, status: result.status } });
      }
      set({
        installed: installed.map((e) =>
          e.slug === slug ? { ...e, status: result.status } : e,
        ),
        saving: false,
      });
      return result.status;
    } catch (err) {
      set({ saveError: errorMessage(err), saving: false });
      throw err;
    }
  },

  // ─── Subscription Actions ─────────────────────────────────────────────────

  fetchEventTypes: async () => {
    try {
      const eventTypes = await api.fetchEventTypes();
      set({ eventTypes });
    } catch {
      // event types are non-critical; swallow errors
    }
  },

  fetchSubscriptions: async (slug) => {
    try {
      const subscriptions = await api.fetchSubscriptions(slug);
      set({ subscriptions });
    } catch {
      // subscriptions are loaded alongside detail; swallow errors
    }
  },

  subscribe: async (slug, eventTypeIds) => {
    set({ saving: true, saveError: null });
    try {
      await api.createSubscriptions(slug, eventTypeIds);
      const subscriptions = await api.fetchSubscriptions(slug);
      set({ subscriptions, saving: false });
    } catch (err) {
      set({ saveError: errorMessage(err), saving: false });
      throw err;
    }
  },

  unsubscribe: async (slug, eventTypeId) => {
    set({ saving: true, saveError: null });
    try {
      await api.deleteSubscription(slug, eventTypeId);
      const { subscriptions } = get();
      set({
        subscriptions: subscriptions.filter((s) => s.event_type_id !== eventTypeId),
        saving: false,
      });
    } catch (err) {
      set({ saveError: errorMessage(err), saving: false });
      throw err;
    }
  },

  // ─── Dataset Actions ──────────────────────────────────────────────────────

  fetchDatasets: async (slug) => {
    try {
      const datasets = await api.fetchDatasets(slug);
      set({ datasets });
    } catch {
      // datasets are loaded alongside detail
    }
  },

  createDataset: async (slug, input) => {
    set({ saving: true, saveError: null });
    try {
      const created = await api.createDataset(slug, input);
      const { datasets } = get();
      set({ datasets: [...datasets, created], saving: false });
    } catch (err) {
      set({ saveError: errorMessage(err), saving: false });
      throw err;
    }
  },

  updateDataset: async (slug, configId, input) => {
    set({ saving: true, saveError: null });
    try {
      const updated = await api.updateDataset(slug, configId, input);
      const { datasets } = get();
      set({
        datasets: datasets.map((d) => (d.id === configId ? updated : d)),
        saving: false,
      });
    } catch (err) {
      set({ saveError: errorMessage(err), saving: false });
      throw err;
    }
  },

  deleteDataset: async (slug, configId) => {
    set({ saving: true, saveError: null });
    try {
      await api.deleteDataset(slug, configId);
      const { datasets } = get();
      set({
        datasets: datasets.filter((d) => d.id !== configId),
        saving: false,
      });
    } catch (err) {
      set({ saveError: errorMessage(err), saving: false });
      throw err;
    }
  },

  // ─── Query Log Actions ────────────────────────────────────────────────────

  fetchQueryLogs: async (slug, page, pageSize) => {
    try {
      const queryLogs = await api.fetchQueryLogs(slug, page, pageSize);
      set({ queryLogs });
    } catch {
      // non-critical
    }
  },

  // ─── iframe ───────────────────────────────────────────────────────────────

  fetchIframeUrl: async (slug) => {
    const result = await api.fetchIframeUrl(slug);
    return result.iframe_url;
  },

  // ─── Reset ────────────────────────────────────────────────────────────────

  resetDetail: () => {
    set({
      detail: null,
      eventTypes: [],
      subscriptions: [],
      datasets: [],
      queryLogs: null,
      detailLoading: false,
      detailError: null,
      saving: false,
      saveError: null,
    });
  },
}));
