import { create } from 'zustand';

// Cluster options come from the first /vendor-cluster-teams response — the
// /filters endpoint doesn't yet return a list of available clusters. Tab 1
// populates this store on every successful fetch so the page-level Cluster
// chip can render options without prop-drilling or a second query.

interface ClusterOptionsState {
  clusters: string[];
  setClusters: (clusters: string[]) => void;
}

export const useClusterOptionsStore = create<ClusterOptionsState>((set) => ({
  clusters: [],
  setClusters: (clusters) =>
    set({ clusters: [...new Set(clusters)].sort((a, b) => a.localeCompare(b)) }),
}));
