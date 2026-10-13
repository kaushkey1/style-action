import { ApiService } from '@/lib/api';

const CT_BASE = '/service/public/storeops/v1/apex/control-tower';

function ctParams(snapshotDate?: string): Record<string, unknown> {
  return snapshotDate ? { snapshot_date: snapshotDate } : {};
}

export const controlTowerApi = {
  businessPulse: async (snapshotDate?: string) => {
    const res = await ApiService.get(`${CT_BASE}/business-pulse`, {
      params: ctParams(snapshotDate),
    });
    return res.data;
  },

  inventoryHealth: async (snapshotDate?: string) => {
    const res = await ApiService.get(`${CT_BASE}/inventory-health`, {
      params: ctParams(snapshotDate),
    });
    return res.data;
  },

  geography: async (snapshotDate?: string) => {
    const res = await ApiService.get(`${CT_BASE}/geography`, {
      params: ctParams(snapshotDate),
    });
    return res.data;
  },

  categories: async (snapshotDate?: string) => {
    const res = await ApiService.get(`${CT_BASE}/categories`, {
      params: ctParams(snapshotDate),
    });
    return res.data;
  },

  supplyChain: async (snapshotDate?: string) => {
    const res = await ApiService.get(`${CT_BASE}/supply-chain`, {
      params: ctParams(snapshotDate),
    });
    return res.data;
  },

  workingCapital: async (snapshotDate?: string) => {
    const res = await ApiService.get(`${CT_BASE}/working-capital`, {
      params: ctParams(snapshotDate),
    });
    return res.data;
  },

  space: async (snapshotDate?: string) => {
    const res = await ApiService.get(`${CT_BASE}/space`, {
      params: ctParams(snapshotDate),
    });
    return res.data;
  },

  dataFreshness: async () => {
    const res = await ApiService.get(`${CT_BASE}/data-freshness`);
    return res.data;
  },
};
