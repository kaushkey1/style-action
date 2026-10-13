import { create } from 'zustand';
import {
  MOCK_STORES,
  getPlPool,
  computeEnvelope,
  solveCategories,
  solvePods,
  type SpacePlanStore,
  type StoreAssumptions,
  type CategoryAllocation,
  type SubcategoryPod,
  type Scenario,
  type VersionEntry,
  type PlanStatus,
  type EnvelopeStep,
} from '../data/mockSpacePlanningData';

type SpaceTab = 'inputs' | 'categories' | 'floors' | 'subcategories';

// Shape returned by the v3 detail API (space_planning_*_v1 tables).
export interface StoreSpsf {
  prevYearSpsf: number | null;
  currentSpsf: number | null;
  spsfTrendPct: number | null;
}

export interface SpaceStoreDetailInput {
  store: {
    code: string;
    status: PlanStatus;
    currentVersion: number;
    carpetArea: number;
    floors: number;
    spsf: StoreSpsf;
  };
  plPool: number;
  envelope: EnvelopeStep[];
  assumptions: {
    totalDeductionPct: number;
    footwearPct: number;
    footwearCapSqft: number;
    ebPct: number;
    bestOfRestPct: number;
    bestOfRestThreshold: number;
    wSpsfWeights: [number, number, number];
    blend: [number, number];
  };
  categories: CategoryAllocation[];
  pods: SubcategoryPod[];
  versions: Array<{
    version: number;
    timestamp: string;
    author: string;
    summary: string;
    isCurrent: boolean;
    /** saved against an older engine run — shown in history, never applied */
    isStale?: boolean;
    payload: {
      categories: Array<{ code: string; newSpace: number }>;
      // keyed by (category, podId); legacy positional ids are stale-only
      pods: Array<{ category?: string; podId?: string; id?: number; newSpace: number }>;
    };
  }>;
}

interface SpacePlanState {
  stores: SpacePlanStore[];
  activeStoreCode: string | null;
  activeTab: SpaceTab;
  assumptions: StoreAssumptions | null;
  categories: CategoryAllocation[];
  pods: SubcategoryPod[];
  scenarios: Scenario[];
  activeScenarioId: string | null;
  versions: VersionEntry[];
  currentVersion: number;
  isDirty: boolean;
  editingCell: { type: 'category' | 'subcategory'; index: number } | null;
  selectedCategoryCode: string | null;
  showExceptionsOnly: boolean;
  plPool: number;
  storeStatus: PlanStatus;
  carpetArea: number;
  floors: number;
  envelope: EnvelopeStep[];
  storeSpsf: StoreSpsf | null;

  loadStore: (code: string) => void;
  hydrateFromDetail: (detail: SpaceStoreDetailInput) => void;
  setActiveTab: (tab: SpaceTab) => void;
  updateAssumption: (key: string, value: number) => void;
  editCategorySpace: (index: number, newValue: number) => void;
  editPodSpace: (index: number, newValue: number) => void;
  resetManualEdit: (type: 'category' | 'subcategory', index: number) => void;
  setEditingCell: (cell: { type: 'category' | 'subcategory'; index: number } | null) => void;
  setSelectedCategoryCode: (code: string | null) => void;
  setShowExceptionsOnly: (show: boolean) => void;
  saveVersion: (summary: string) => void;
  restoreVersion: (versionNum: number) => void;
  createScenario: (name: string) => void;
  switchScenario: (id: string) => void;
  duplicateScenario: (id: string) => void;
  deleteScenario: (id: string) => void;
  makeScenarioActive: (id: string) => void;
  recompute: () => void;
}

export const useSpacePlanStore = create<SpacePlanState>((set, get) => ({
  stores: MOCK_STORES,
  activeStoreCode: null,
  activeTab: 'inputs',
  assumptions: null,
  categories: [],
  pods: [],
  scenarios: [],
  activeScenarioId: null,
  versions: [],
  currentVersion: 0,
  isDirty: false,
  editingCell: null,
  selectedCategoryCode: null,
  showExceptionsOnly: false,
  plPool: 0,
  storeStatus: 'not_run',
  carpetArea: 0,
  floors: 0,
  envelope: [],
  storeSpsf: null,

  loadStore: (code) => {
    const store = MOCK_STORES.find((s) => s.code === code);
    if (!store) return;

    const plPool = getPlPool(store.carpetArea, store.assumptions);

    set({
      activeStoreCode: code,
      activeTab: 'inputs',
      assumptions: { ...store.assumptions },
      categories: store.categories.map((c) => ({ ...c })),
      pods: store.pods.map((p) => ({ ...p })),
      scenarios: store.scenarios.map((s) => ({ ...s, categories: s.categories.map((c) => ({ ...c })), pods: s.pods.map((p) => ({ ...p })) })),
      activeScenarioId: store.scenarios.find((s) => s.isActive)?.id ?? null,
      versions: store.versions.map((v) => ({ ...v })),
      currentVersion: store.currentVersion,
      isDirty: false,
      editingCell: null,
      selectedCategoryCode: null,
      showExceptionsOnly: false,
      plPool,
      storeStatus: store.status,
      carpetArea: store.carpetArea,
      floors: store.floors,
      envelope: computeEnvelope(store.carpetArea, store.assumptions),
      storeSpsf: null,
    });
  },

  hydrateFromDetail: (detail) => {
    // Build a full StoreAssumptions from the API's flat assumptions +
    // per-category efficiency bands (the client solver reads these).
    const efficiencyBands: Record<string, { low: number; high: number }> = {};
    for (const c of detail.categories) {
      efficiencyBands[c.code] = { low: c.efficiencyLow, high: c.efficiencyHigh };
    }
    const assumptions: StoreAssumptions = {
      efficiencyBands,
      wSpsfWeights: detail.assumptions.wSpsfWeights,
      blend: detail.assumptions.blend,
      footwearCapSqft: detail.assumptions.footwearCapSqft,
      bestOfRestPct: detail.assumptions.bestOfRestPct,
      bestOfRestThreshold: detail.assumptions.bestOfRestThreshold,
      sellThroughPct: 0,
      initialDeductions: {},
      totalDeductionPct: detail.assumptions.totalDeductionPct,
      footwearPct: detail.assumptions.footwearPct,
      ebPct: detail.assumptions.ebPct,
    };

    // API `share` is a 0–1 fraction; the UI renders it as a 0–100 percentage
    // (matching the mock convention). salesShare stays 0–1 (rendered ×100 at use).
    const categories = detail.categories.map((c) => ({ ...c, share: c.share * 100 }));
    const pods = detail.pods.map((p) => ({ ...p }));

    // Map API versions → VersionEntry: snapshot = version payload overlaid onto
    // the hydrated rows, so the existing snapshot-based restoreVersion works.
    const versions: VersionEntry[] = (detail.versions ?? []).map((v) => {
      const catOverride = new Map(v.payload.categories.map((e) => [e.code, e.newSpace]));
      const podOverride = new Map(
        v.payload.pods
          .filter((e) => e.category && e.podId)
          .map((e) => [`${e.category}|${e.podId}`, e.newSpace]),
      );
      return {
        version: v.version,
        timestamp: v.timestamp,
        author: v.author,
        summary: v.summary,
        isCurrent: v.isCurrent,
        isStale: v.isStale === true,
        diffs: [],
        snapshot: {
          assumptions: { ...assumptions },
          categories: categories.map((c) => {
            const space = catOverride.get(c.code);
            if (space === undefined) return { ...c };
            return {
              ...c,
              newSpace: Math.round(space),
              share: detail.plPool > 0 ? (space / detail.plPool) * 100 : c.share,
            };
          }),
          pods: pods.map((p) => {
            const space = podOverride.get(`${p.categoryCode}|${p.name}`);
            return space === undefined ? { ...p } : { ...p, newSpace: Math.round(space) };
          }),
        },
      };
    });

    set({
      activeStoreCode: detail.store.code,
      activeTab: 'inputs',
      assumptions,
      categories,
      pods,
      scenarios: [],
      activeScenarioId: null,
      versions,
      currentVersion: detail.store.currentVersion,
      isDirty: false,
      editingCell: null,
      selectedCategoryCode: null,
      showExceptionsOnly: false,
      plPool: detail.plPool,
      storeStatus: detail.store.status,
      carpetArea: detail.store.carpetArea,
      floors: detail.store.floors,
      envelope: detail.envelope,
      storeSpsf: detail.store.spsf ?? null,
    });
  },

  setActiveTab: (tab) => set({ activeTab: tab, editingCell: null }),

  updateAssumption: (key, value) => {
    const { assumptions, categories, pods } = get();
    if (!assumptions) return;

    const store = MOCK_STORES.find((s) => s.code === get().activeStoreCode);
    if (!store) return;

    const updated = { ...assumptions, [key]: value };
    const newPool = getPlPool(store.carpetArea, updated);
    const newCategories = solveCategories(newPool, categories);
    const newPods = newCategories.flatMap((cat) => {
      const catPods = pods.filter((p) => p.categoryCode === cat.code);
      return solvePods(cat.newSpace, catPods);
    });

    set({
      assumptions: updated,
      plPool: newPool,
      categories: newCategories,
      pods: newPods,
      isDirty: true,
    });
  },

  editCategorySpace: (index, newValue) => {
    const { categories, plPool, pods } = get();
    const newCategories = solveCategories(plPool, categories, index, newValue);

    const editedCat = newCategories[index];
    const newPods = newCategories.flatMap((cat) => {
      const catPods = pods.filter((p) => p.categoryCode === cat.code);
      if (cat.code === editedCat?.code) {
        return solvePods(cat.newSpace, catPods);
      }
      return solvePods(cat.newSpace, catPods);
    });

    set({
      categories: newCategories,
      pods: newPods,
      isDirty: true,
      editingCell: null,
    });
  },

  editPodSpace: (index, newValue) => {
    const { pods, categories } = get();
    const pod = pods[index];
    if (!pod) return;

    const catPods = pods.filter((p) => p.categoryCode === pod.categoryCode);
    const catPodStartIndex = pods.indexOf(catPods[0]!);
    const localIndex = index - catPodStartIndex;

    const cat = categories.find((c) => c.code === pod.categoryCode);
    if (!cat) return;

    const newCatPods = solvePods(cat.newSpace, catPods, localIndex, newValue);

    const newPods = [...pods];
    for (let i = 0; i < newCatPods.length; i++) {
      const globalIdx = catPodStartIndex + i;
      const resolved = newCatPods[i];
      if (resolved) {
        newPods[globalIdx] = resolved;
      }
    }

    set({ pods: newPods, isDirty: true, editingCell: null });
  },

  resetManualEdit: (type, index) => {
    const { categories, plPool, pods } = get();

    if (type === 'category') {
      const newCats = categories.map((c, i) => i === index ? { ...c, isManual: false, boundBadge: 'free' as const } : c);
      const resolved = solveCategories(plPool, newCats);
      set({ categories: resolved, isDirty: true });
    } else {
      const pod = pods[index];
      if (!pod) return;
      const newPods = pods.map((p, i) => i === index ? { ...p, isManual: false } : p);
      const cat = categories.find((c) => c.code === pod.categoryCode);
      if (!cat) return;
      const catPods = newPods.filter((p) => p.categoryCode === pod.categoryCode);
      const resolved = solvePods(cat.newSpace, catPods);
      const finalPods = [...newPods];
      const startIdx = newPods.indexOf(catPods[0]!);
      for (let i = 0; i < resolved.length; i++) {
        const r = resolved[i];
        if (r) finalPods[startIdx + i] = r;
      }
      set({ pods: finalPods, isDirty: true });
    }
  },

  setEditingCell: (cell) => set({ editingCell: cell }),
  setSelectedCategoryCode: (code) => set({ selectedCategoryCode: code }),
  setShowExceptionsOnly: (show) => set({ showExceptionsOnly: show }),

  saveVersion: (summary) => {
    const { versions, currentVersion, assumptions, categories, pods, stores, activeStoreCode } = get();
    const newVersion: VersionEntry = {
      version: currentVersion + 1,
      timestamp: new Date().toISOString(),
      author: 'you',
      summary,
      isCurrent: true,
      diffs: [{ field: 'Plan', oldValue: `v${currentVersion}`, newValue: `v${currentVersion + 1}`, note: summary }],
      snapshot: assumptions ? {
        assumptions: { ...assumptions },
        categories: categories.map((c) => ({ ...c })),
        pods: pods.map((p) => ({ ...p })),
      } : null,
    };

    const updatedVersions = versions.map((v) => ({ ...v, isCurrent: false }));
    updatedVersions.push(newVersion);

    const updatedStores = stores.map((s) =>
      s.code === activeStoreCode
        ? { ...s, currentVersion: currentVersion + 1, lastEditedAt: newVersion.timestamp, lastEditedBy: 'you' }
        : s,
    );

    set({
      versions: updatedVersions,
      currentVersion: currentVersion + 1,
      isDirty: false,
      stores: updatedStores,
    });
  },

  restoreVersion: (versionNum) => {
    const { versions } = get();
    const target = versions.find((v) => v.version === versionNum);
    if (!target?.snapshot) return;

    set({
      assumptions: { ...target.snapshot.assumptions },
      categories: target.snapshot.categories.map((c) => ({ ...c })),
      pods: target.snapshot.pods.map((p) => ({ ...p })),
      isDirty: true,
    });
  },

  createScenario: (name) => {
    const { scenarios, categories, pods, assumptions, plPool } = get();
    if (!assumptions) return;

    const newScenario: Scenario = {
      id: `scenario-${Date.now()}`,
      name,
      isActive: false,
      categories: categories.map((c) => ({ ...c })),
      pods: pods.map((p) => ({ ...p })),
      assumptions: { ...assumptions },
      plPool,
      exceptionCount: categories.filter((c) => c.boundBadge === '>sigmaMax').length,
      optionsTotalMin: categories.reduce((s, c) => s + c.optionsMin, 0),
      optionsTotalMax: categories.reduce((s, c) => s + c.optionsMax, 0),
    };

    set({ scenarios: [...scenarios, newScenario] });
  },

  switchScenario: (id) => {
    const { scenarios } = get();
    const target = scenarios.find((s) => s.id === id);
    if (!target) return;

    set({
      categories: target.categories.map((c) => ({ ...c })),
      pods: target.pods.map((p) => ({ ...p })),
      assumptions: { ...target.assumptions },
      plPool: target.plPool,
      activeScenarioId: id,
      isDirty: true,
    });
  },

  duplicateScenario: (id) => {
    const { scenarios } = get();
    const source = scenarios.find((s) => s.id === id);
    if (!source) return;

    const dup: Scenario = {
      ...source,
      id: `scenario-${Date.now()}`,
      name: `${source.name} (copy)`,
      isActive: false,
      categories: source.categories.map((c) => ({ ...c })),
      pods: source.pods.map((p) => ({ ...p })),
    };

    set({ scenarios: [...scenarios, dup] });
  },

  deleteScenario: (id) => {
    const { scenarios, activeScenarioId } = get();
    const filtered = scenarios.filter((s) => s.id !== id);
    set({
      scenarios: filtered,
      activeScenarioId: activeScenarioId === id ? (filtered[0]?.id ?? null) : activeScenarioId,
    });
  },

  makeScenarioActive: (id) => {
    const { scenarios } = get();
    const updated = scenarios.map((s) => ({ ...s, isActive: s.id === id }));
    set({ scenarios: updated, activeScenarioId: id });

    const target = updated.find((s) => s.id === id);
    if (target) {
      set({
        categories: target.categories.map((c) => ({ ...c })),
        pods: target.pods.map((p) => ({ ...p })),
        assumptions: { ...target.assumptions },
        plPool: target.plPool,
        isDirty: true,
      });
    }
  },

  recompute: () => {
    const { assumptions, categories, pods } = get();
    if (!assumptions) return;

    const store = MOCK_STORES.find((s) => s.code === get().activeStoreCode);
    if (!store) return;

    const newPool = getPlPool(store.carpetArea, assumptions);
    const newCategories = solveCategories(newPool, categories);
    const newPods = newCategories.flatMap((cat) => {
      const catPods = pods.filter((p) => p.categoryCode === cat.code);
      return solvePods(cat.newSpace, catPods);
    });

    set({ plPool: newPool, categories: newCategories, pods: newPods });
  },
}));
