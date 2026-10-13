import { create } from 'zustand';
import type { KpiCard } from '../api/categoryDirectorApi';

// The 6 hero KPI codes rendered in Tab 2's hero strip. Tab 1's
// /category-performance response is the canonical source; we hoist these
// codes here so Tab 2 doesn't need a second fetch on tab switch.
const HERO_CODES = [
  'ww-sales-plan',
  'ww-fp-st',
  'ww-gm',
  'ww-md-pending',
  'ww-otb',
  'ww-size-comp',
] as const;

interface HeroKpiState {
  heroKpis: KpiCard[] | null;
  setHeroKpis: (cards: KpiCard[]) => void;
  clearHeroKpis: () => void;
}

export const useHeroKpiStore = create<HeroKpiState>((set) => ({
  heroKpis: null,
  setHeroKpis: (cards) =>
    set({
      heroKpis: cards.filter((c) =>
        (HERO_CODES as readonly string[]).includes(c.code),
      ),
    }),
  clearHeroKpis: () => set({ heroKpis: null }),
}));
