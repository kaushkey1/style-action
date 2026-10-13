import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Skeleton, EmptyState } from '@/components/ui';
import { usePersonaStore } from '@/hooks/usePersonaStore';
import {
  fetchPersonaInsights,
  fetchScopeInsights,
} from '@/modules/store-view/api/insightsApi';
import { InsightCard } from './InsightCard';
import { cn } from '@/lib/utils';
import type { InsightPersonaId, Insight } from '@/modules/store-view/api/insightsApi';

export function InsightsListing(): React.ReactNode {
  const personaId = usePersonaStore((s) => s.personaId) as InsightPersonaId;
  const [searchParams] = useSearchParams();
  const fromStoreView = searchParams.get('from') === 'store-view';
  const [domainFilter, setDomainFilter] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const { data: personaData, isLoading: personaLoading } = useQuery({
    queryKey: ['insights', personaId, 'with-store'],
    queryFn: () => fetchPersonaInsights(personaId, { includeStore: true }),
    staleTime: 5 * 60 * 1000,
    enabled: !fromStoreView,
  });

  const { data: storeData, isLoading: storeLoading } = useQuery({
    queryKey: ['insights', 'store-view'],
    queryFn: () => fetchScopeInsights('store-view'),
    staleTime: 5 * 60 * 1000,
    enabled: fromStoreView,
  });

  const data = fromStoreView ? storeData : personaData;
  const loading = fromStoreView ? storeLoading : personaLoading;

  const insights = useMemo(() => data?.insights ?? [], [data]);

  const domains = useMemo(() => {
    const set = new Set<string>();
    for (const i of insights) {
      if (i.sub_domain) set.add(i.sub_domain);
    }
    return Array.from(set).sort();
  }, [insights]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const i of insights) {
      if (i.category) set.add(i.category);
    }
    return Array.from(set).sort();
  }, [insights]);

  const filtered = useMemo(() => {
    let result: Insight[] = insights;
    if (domainFilter) {
      result = result.filter((i) => i.sub_domain === domainFilter);
    }
    if (categoryFilter) {
      result = result.filter((i) => i.category === categoryFilter);
    }
    return result;
  }, [insights, domainFilter, categoryFilter]);

  // Deep-link: ?insight=<id> scrolls to + pulses the matching card (polls ~2s for async render).
  useEffect(() => {
    const id = searchParams.get('insight');
    if (!id) return;
    let tries = 0;
    const tick = (): void => {
      const el = document.querySelector<HTMLElement>(`[data-insight-anchor="${id}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const cls = ['animate-highlight-ring', 'ring-2', 'ring-primary', 'ring-offset-2', 'rounded-lg'];
        el.classList.add(...cls);
        window.setTimeout(() => el.classList.remove(...cls), 1700);
        return;
      }
      if (tries++ < 20) window.setTimeout(tick, 100);
    };
    tick();
     
  }, [searchParams, insights.length]);

  const hasActiveFilters = domainFilter !== null || categoryFilter !== null;

  const handleClearFilters = (): void => {
    setDomainFilter(null);
    setCategoryFilter(null);
  };

  if (loading) {
    return (
      <div className="space-y-2 p-4">
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (insights.length === 0) {
    return (
      <div className="py-12">
        <EmptyState description="No insights available" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Domain / category filter bar lives ABOVE the card container and
          stays sticky as the user scrolls through insights. No negative
          margins — the parent doesn't clip horizontal overflow, so margin
          bleed would force a horizontal page scrollbar. */}
      <div className="sticky top-0 z-20 py-2 bg-gray-50/90 backdrop-blur-sm">
        {/* Filter chips — horizontal scroll on mobile (mobile-guidelines §Filter Pattern) */}
        {(domains.length > 1 || categories.length > 0) && (
          <div className="flex flex-wrap gap-1.5 overflow-x-auto scrollbar-hide lg:flex-wrap lg:overflow-visible">
            {/* Domain filters */}
            {domains.length > 1 && (
              <>
                <button
                  onClick={() => setDomainFilter(null)}
                  className={cn(
                    'text-sm font-medium px-2.5 py-1.5 rounded-full border transition-colors whitespace-nowrap min-h-[44px] md:min-h-0',
                    !domainFilter
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400',
                  )}
                >
                  All domains
                </button>
                {domains.map((d) => (
                  <button
                    key={d}
                    onClick={() => setDomainFilter(domainFilter === d ? null : d)}
                    className={cn(
                      'text-sm font-medium px-2.5 py-1.5 rounded-full border transition-colors whitespace-nowrap min-h-[44px] md:min-h-0',
                      domainFilter === d
                        ? 'bg-primary text-white border-primary'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400',
                    )}
                  >
                    {d}
                  </button>
                ))}
              </>
            )}

            {/* Category filters */}
            {categories.length > 0 && (
              <>
                {domains.length > 1 && (
                  <span className="text-sm text-gray-400 self-center mx-1">|</span>
                )}
                {categories.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCategoryFilter(categoryFilter === c ? null : c)}
                    className={cn(
                      'text-sm font-medium px-2.5 py-1.5 rounded-full border transition-colors whitespace-nowrap min-h-[44px] md:min-h-0',
                      categoryFilter === c
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400',
                    )}
                  >
                    {c}
                  </button>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* Cards container — owns the white-card visual (border + bg). No
          internal scroll; the cards flow with page scroll instead so the
          chip bar above stays visible at the top of the page. Count line
          sits at the top so it reads as a header of the listing.
          `overflow-hidden` clips the InsightCard children's bg + border-b
          so they don't leak past the parent's rounded corners. */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <p className="px-4 py-3 text-sm font-medium text-gray-500 border-b border-gray-100">
          {filtered.length} of {insights.length} insights
        </p>
        {filtered.length === 0 ? (
          <div className="py-12">
            <EmptyState
              description="No insights match your current filters"
              action={
                hasActiveFilters ? (
                  <button
                    onClick={handleClearFilters}
                    className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors min-h-[44px] md:min-h-0 px-3 py-2"
                  >
                    Clear filters
                  </button>
                ) : undefined
              }
            />
          </div>
        ) : (
          filtered.map((insight) => (
            <InsightCard key={insight.id} insight={insight} />
          ))
        )}
      </div>
    </div>
  );
}
