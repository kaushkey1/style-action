/* eslint-disable design-system/prefer-section-header, design-system/prefer-metric-grid -- range architecture uses custom layouts */
// ████ ACTIVE FILE - USED BY localhost:5173/range ████
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ArrowLeft,
  Package,
  Target,
  BarChart3,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Award,
  ChevronDown,
  ChevronRight,
  Palette,
  Layers,
  Sparkles,
  Edit3,
  Save,
  Eye,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent, Badge, Button, PageHeader, SectionHeader, MetricGrid, MetricCard, EmptyState, FilterBar, FilterSelect, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Input, DataTable, DataTableHeader, DataTableBody, DataTableRow, DataTableHead, DataTableCell, ShimmerKpiGrid, ShimmerTable } from '@/components/ui';
import { segmentRangeSummary } from '../data/mockRangePlans';
import type { RangeStatus } from '../data/mockRangePlans';
import { mockStoreRangePlans } from '../data/mockStoreRangePlans';
import { getFamiliesBySegment, getBrickById, getFamilyById } from '../data/mockFnLHierarchy';
import { useRangeStore } from '../stores/useRangeStore';
import { useModulePermissions } from '@/permissions';
import { useHits, useHealthSummary, useSegments } from '../api/rangeHooks';
import {cn, getCurrencySymbol} from '@/lib/utils';
import { mockSegments, mockCategoryProfiles } from '../data/mockRangeArchitecture';
import { getBuyingModelColor, BUYING_MODELS } from '@/modules/otb/types/buyingModels';
import type { BuyingModelId } from '@/modules/otb/types/buyingModels';

// ─── Helpers ────────────────────────────────────────────────────────────────

function statusBadgeVariant(status: RangeStatus): 'success' | 'warning' | 'default' {
  if (status === 'locked' || status === 'active') return 'success';
  if (status === 'review') return 'warning';
  return 'default';
}

function statusLabel(status: RangeStatus): string {
  if (status === 'locked') return 'Locked';
  if (status === 'active') return 'Active';
  if (status === 'review') return 'In Review';
  return 'Draft';
}

// ─── Network Overview Tab ───────────────────────────────────────────────────

function NetworkOverviewTab() {
  const navigate = useNavigate();
  const selectedHit = useRangeStore((s) => s.selectedHit);
  const selectHit = useRangeStore((s) => s.selectHit);

  const { data: availableHits } = useHits();
  const { data: healthSummary, isLoading: healthLoading } = useHealthSummary(selectedHit ?? '');
  const { data: segmentsData, isLoading: segmentsLoading } = useSegments(selectedHit ?? '');
  const apiSegments = segmentsData?.segments ?? [];

  useEffect(() => {
    if (availableHits?.default_hit && !selectedHit) {
      selectHit(availableHits.default_hit);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- set default hit when data arrives
  }, [availableHits]);

  const statusBadgeVariant = (status: string | null): 'success' | 'warning' | 'error' => {
    if (!status) return 'success';
    if (['On Track', 'Optimal', 'Healthy', 'Locked', 'completed'].includes(status)) return 'success';
    if (['Monitor', 'Low', 'in_progress'].includes(status)) return 'warning';
    return 'error';
  };

  if (healthLoading || segmentsLoading) {
    return (
      <div className="space-y-4">
        <ShimmerKpiGrid />
        <ShimmerTable rows={4} />
      </div>
    );
  }

  if (!healthSummary && apiSegments.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title="No range data available"
        description="Unable to load range architecture data. Please try again later."
      />
    );
  }

  return (
    <div className="space-y-4">

      {/* Hit Selector */}
      {availableHits && (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Hit:</span>
          <Select value={selectedHit || ''} onValueChange={selectHit}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableHits.hits.map((hit) => (
                <SelectItem key={hit.hit} value={hit.hit}>
                  {hit.hit} - {hit.season}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Range Health KPIs */}
      {healthSummary && (
        <div>
          <SectionHeader
            title="Range Health"
            subtitle="Lock progress, fashion mix, utilization & trend adoption"
          />

          <MetricGrid columns={4}>
            {healthSummary.core_fashion_split && (
              <div className="bg-white border border-gray-200 rounded-lg px-5 py-4 flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <span className="text-xs text-gray-500 font-medium">Core / Fashion Split</span>
                  <Badge variant={statusBadgeVariant(healthSummary.core_fashion_split.status)} dot className="text-xs">
                    {healthSummary.core_fashion_split.status || 'Optimal'}
                  </Badge>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold text-gray-900 tracking-tight">
                    {healthSummary.core_fashion_split.core_pct} / {healthSummary.core_fashion_split.fashion_pct}
                  </span>
                  <span className="text-sm text-gray-400">% ratio</span>
                </div>
                <div className="text-xs text-gray-500">
                  Core: {healthSummary.core_fashion_split.core_options} · Fashion: {healthSummary.core_fashion_split.fashion_options}
                </div>
              </div>
            )}

            {healthSummary.range_lock_progress && (
              <div className="bg-white border border-gray-200 rounded-lg px-5 py-4 flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <span className="text-xs text-gray-500 font-medium">Range Lock Progress</span>
                  <Badge variant={statusBadgeVariant(healthSummary.range_lock_progress.status)} dot className="text-xs">
                    {healthSummary.range_lock_progress.status || 'On Track'}
                  </Badge>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold text-gray-900 tracking-tight">
                    {healthSummary.range_lock_progress.completed_segments}
                  </span>
                  <span className="text-sm text-gray-400">of {healthSummary.range_lock_progress.total_segments} segments</span>
                </div>
                <div className="text-xs text-gray-500">
                  {healthSummary.range_lock_progress.pct}% complete
                </div>
                <div className="w-full h-[3px] bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full", healthSummary.range_lock_progress.pct >= 80 ? 'bg-green-500' : healthSummary.range_lock_progress.pct >= 50 ? 'bg-amber-500' : 'bg-red-500')}
                    style={{ width: `${Math.min(Math.max(healthSummary.range_lock_progress.pct, 0), 100)}%` }} // eslint-disable-line no-restricted-syntax -- Progress bar requires dynamic width percentage
                    role="progressbar"
                    aria-valuenow={healthSummary.range_lock_progress.pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  />
                </div>
              </div>
            )}

            {healthSummary.ftf_adoption && (
              <div className="bg-white border border-gray-200 rounded-lg px-5 py-4 flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <span className="text-xs text-gray-500 font-medium">FTF Adoption</span>
                  <Badge variant={statusBadgeVariant(healthSummary.ftf_adoption.status)} dot className="text-xs">
                    {healthSummary.ftf_adoption.status || 'On Track'}
                  </Badge>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold text-gray-900 tracking-tight">
                    {healthSummary.ftf_adoption.ftf_pct}%
                  </span>
                  <span className="text-sm text-gray-400">adoption rate</span>
                </div>
                <div className="text-xs text-gray-500">
                  {healthSummary.ftf_adoption.ftf_bricks} / {healthSummary.ftf_adoption.total_bricks} bricks
                </div>
                <div className="w-full h-[3px] bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full", healthSummary.ftf_adoption.ftf_pct >= 80 ? 'bg-green-500' : healthSummary.ftf_adoption.ftf_pct >= 50 ? 'bg-amber-500' : 'bg-red-500')}
                    style={{ width: `${Math.min(Math.max(healthSummary.ftf_adoption.ftf_pct, 0), 100)}%` }} // eslint-disable-line no-restricted-syntax -- Progress bar requires dynamic width percentage
                    role="progressbar"
                    aria-valuenow={healthSummary.ftf_adoption.ftf_pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  />
                </div>
              </div>
            )}

            {healthSummary.fixture_utilization && (
              <div className="bg-white border border-gray-200 rounded-lg px-5 py-4 flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <span className="text-xs text-gray-500 font-medium">Fixture Utilization</span>
                  <Badge variant={statusBadgeVariant(healthSummary.fixture_utilization.status)} dot className="text-xs">
                    {healthSummary.fixture_utilization.status || 'Healthy'}
                  </Badge>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold text-gray-900 tracking-tight">
                    {healthSummary.fixture_utilization.pct != null ? `${healthSummary.fixture_utilization.pct}%` : 'N/A'}
                  </span>
                  <span className="text-sm text-gray-400">capacity used</span>
                </div>
                <div className="text-xs text-gray-500">
                  {healthSummary.fixture_utilization.inventory_count != null
                    ? `${healthSummary.fixture_utilization.inventory_count.toLocaleString()} units`
                    : 'Data pending'}
                </div>
              </div>
            )}
          </MetricGrid>
        </div>
      )}

      {/* Segments Table */}
      {apiSegments.length > 0 && (
        <div>
          <SectionHeader
            title="Segments"
            subtitle="Click segment to view Segment Overview with detailed breakdown"
          />

          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className={cn(
              "grid px-4 py-2.5 border-b border-gray-200 bg-gray-50",
              "grid-cols-[1fr_130px_130px_120px_120px_180px_150px_100px]",
              "text-[10px] font-semibold text-gray-400 uppercase tracking-wider"
            )}>
              <span>SEGMENT</span>
              <span className="text-right">OPTIONS</span>
              <span className="text-right">BUY QTY</span>
              <span className="text-right">FASHION</span>
              <span className="text-right">FTF</span>
              <span className="text-right">STORES</span>
              <span className="ml-8">STATUS</span>
              <span></span>
            </div>

            {apiSegments.map((segment, i) => {
              const isLast = i === apiSegments.length - 1;
              const isLocked = segment.run_status === 'completed' || segment.run_status === 'Locked';

              return (
                <div
                  key={segment.segment_code}
                  role="button"
                  tabIndex={0}
                  className={cn(
                    "grid px-4 py-3 cursor-pointer transition-colors items-center",
                    "grid-cols-[1fr_130px_130px_120px_120px_180px_150px_100px]",
                    "hover:bg-gray-50 focus-kb:bg-gray-50 focus:outline-none focus-kb:ring-2 focus-kb:ring-indigo-500",
                    !isLast && "border-b border-gray-100"
                  )}
                  onClick={() => navigate(`/ra/segment/${segment.segment_code}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate(`/ra/segment/${segment.segment_code}`);
                    }
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0",
                      isLocked ? "bg-indigo-50 text-primary-700" : "bg-red-50 text-red-700"
                    )}>
                      {segment.segment_code.slice(0, 3).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                        {segment.segment_name}
                        {segment.bm_count != null && segment.bm_count > 0 && (
                          <span className="text-xs text-gray-400">• {segment.bm_count} BMs</span>
                        )}
                        {segment.alert && (
                          <span className={cn(
                            "text-[10px] font-medium px-2 py-0.5 rounded-full max-w-[200px] truncate ml-1",
                            isLocked ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"
                          )}>
                            {segment.alert}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-bold text-gray-900">{segment.total_options}</span>
                    {segment.target_options != null && (
                      <span className="text-xs text-gray-400"> / {segment.target_options}</span>
                    )}
                  </div>

                  <div className="text-right text-sm font-semibold text-gray-900">
                    {segment.buy_qty.toLocaleString()}
                  </div>

                  <div className="text-right text-sm font-semibold text-gray-900">
                    {segment.fashion_pct}%
                  </div>

                  <div className="text-right">
                    <span className={cn(
                      "text-sm font-semibold",
                      segment.ftf_adoption_pct < 30 ? "text-amber-700" : "text-gray-900"
                    )}>
                      {segment.ftf_adoption_pct}%
                    </span>
                  </div>

                  <div className="text-right text-xs text-gray-600">
                    {segment.store_count}{segment.total_stores != null ? ` / ${segment.total_stores}` : ''}
                  </div>

                  <div className="flex justify-start ml-8">
                    <Badge variant={statusBadgeVariant(segment.run_status)} dot className="text-xs">
                      {segment.run_status}
                    </Badge>
                  </div>

                  <div className="text-right">
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}


// ─── Store Range Tab ────────────────────────────────────────────────────────

function StoreRangeTab() {
  const navigate = useNavigate();

  // Filter states
  const [gradeFilter, setGradeFilter] = useState<string>('All');
  const [stateFilter, setStateFilter] = useState<string>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [storeFilter, setStoreFilter] = useState<string>('all');

  // Extract unique states, cities, and stores from data for filter options
  const storeLocationData = useMemo(() => {
    // Function to extract state and city from store name
    const extractLocation = (storeName: string) => {
      const name = storeName.toLowerCase();

      if (name.includes('malad') || name.includes('mumbai') || name.includes('thane')) {
        return { state: 'Maharashtra', city: name.includes('thane') ? 'Thane' : 'Mumbai' };
      } else if (name.includes('nashik')) {
        return { state: 'Maharashtra', city: 'Nashik' };
      } else if (name.includes('pune')) {
        return { state: 'Maharashtra', city: 'Pune' };
      } else if (name.includes('bangalore') || name.includes('koramangala')) {
        return { state: 'Karnataka', city: 'Bangalore' };
      } else if (name.includes('delhi') || name.includes('gurgaon') || name.includes('ncr')) {
        return { state: 'Delhi NCR', city: name.includes('gurgaon') ? 'Gurgaon' : 'Delhi' };
      } else if (name.includes('hyderabad')) {
        return { state: 'Telangana', city: 'Hyderabad' };
      } else if (name.includes('chennai')) {
        return { state: 'Tamil Nadu', city: 'Chennai' };
      } else if (name.includes('kolkata')) {
        return { state: 'West Bengal', city: 'Kolkata' };
      }

      return { state: 'Other', city: 'Other' };
    };

    const stateMapping: Record<string, Set<string>> = {};

    // Build state-city mapping
    mockStoreRangePlans.forEach(store => {
      const { state, city } = extractLocation(store.storeName);
      if (!stateMapping[state]) {
        stateMapping[state] = new Set();
      }
      stateMapping[state].add(city);
    });

    // Get available states
    const states = Object.keys(stateMapping).filter(state => state !== 'Other').sort();

    // Get cities based on selected state
    const cities = stateFilter === 'all'
      ? Array.from(new Set(Object.values(stateMapping).flatMap(s => Array.from(s)))).filter(city => city !== 'Other').sort()
      : Array.from(stateMapping[stateFilter] || []).sort();

    return { states, cities };
  }, [stateFilter]);

  // Define filter options
  const stateOptions = [
    { value: 'all', label: 'All States' },
    ...storeLocationData.states.map(state => ({ value: state, label: state }))
  ];

  const cityOptions = [
    { value: 'all', label: 'All Cities' },
    ...storeLocationData.cities.map(city => ({ value: city, label: city }))
  ];

  const storeOptions = [
    { value: 'all', label: 'All Stores' },
    ...mockStoreRangePlans.slice(0, 20).map(store => ({ value: store.storeId, label: store.storeName }))
  ];

  // Calculate peer benchmarks for comparative intelligence
  const storeBenchmarks = useMemo(() => {
    const storesByGrade: Record<string, typeof mockStoreRangePlans> = {};

    // Group stores by grade for peer comparison
    mockStoreRangePlans.forEach(store => {
      if (!storesByGrade[store.storeGrade]) {
        storesByGrade[store.storeGrade] = [];
      }
      storesByGrade[store.storeGrade]!.push(store);
    });

    // Calculate percentiles and rankings for each store
    const benchmarks: Record<string, {
      otbPercentile: number;
      fixturePercentile: number;
      densityPercentile: number;
      gradeRank: number;
      totalInGrade: number;
      clusterRank: number;
      totalInCluster: number;
    }> = {};

    Object.values(storesByGrade).forEach((stores) => {
      if (!stores || stores.length === 0) return;

      const sortedByOtb = [...stores].sort((a, b) => b.otbFitPct - a.otbFitPct);
      const sortedByFixture = [...stores].sort((a, b) => b.fixtureUtilization - a.fixtureUtilization);
      const sortedByDensity = [...stores].sort((a, b) => b.stockingDensity - a.stockingDensity);

      stores.forEach(store => {
        const otbRank = sortedByOtb.findIndex(s => s.storeId === store.storeId) + 1;
        const fixtureRank = sortedByFixture.findIndex(s => s.storeId === store.storeId) + 1;
        const densityRank = sortedByDensity.findIndex(s => s.storeId === store.storeId) + 1;

        benchmarks[store.storeId] = {
          otbPercentile: Math.round((1 - (otbRank - 1) / stores.length) * 100),
          fixturePercentile: Math.round((1 - (fixtureRank - 1) / stores.length) * 100),
          densityPercentile: Math.round((1 - (densityRank - 1) / stores.length) * 100),
          gradeRank: otbRank,
          totalInGrade: stores.length,
          clusterRank: otbRank, // Use same as grade rank for simplicity
          totalInCluster: stores.length, // Use same as grade total for simplicity
        };
      });
    });

    return benchmarks;
  }, []);

  // Helper function to extract location (shared with storeLocationData)
  const extractLocation = (storeName: string) => {
    const name = storeName.toLowerCase();

    if (name.includes('malad') || name.includes('mumbai') || name.includes('thane')) {
      return { state: 'Maharashtra', city: name.includes('thane') ? 'Thane' : 'Mumbai' };
    } else if (name.includes('nashik')) {
      return { state: 'Maharashtra', city: 'Nashik' };
    } else if (name.includes('pune')) {
      return { state: 'Maharashtra', city: 'Pune' };
    } else if (name.includes('bangalore') || name.includes('koramangala')) {
      return { state: 'Karnataka', city: 'Bangalore' };
    } else if (name.includes('delhi') || name.includes('gurgaon') || name.includes('ncr')) {
      return { state: 'Delhi NCR', city: name.includes('gurgaon') ? 'Gurgaon' : 'Delhi' };
    } else if (name.includes('hyderabad')) {
      return { state: 'Telangana', city: 'Hyderabad' };
    } else if (name.includes('chennai')) {
      return { state: 'Tamil Nadu', city: 'Chennai' };
    } else if (name.includes('kolkata')) {
      return { state: 'West Bengal', city: 'Kolkata' };
    }

    return { state: 'Other', city: 'Other' };
  };

  // Filter stores based on criteria
  const filteredStores = useMemo(() => {
    return mockStoreRangePlans.filter(store => {
      // Grade filter - now supporting A0, A1, A2, A3
      if (gradeFilter !== 'All' && store.storeGrade !== gradeFilter) {
        return false;
      }

      const location = extractLocation(store.storeName);

      // State filter
      if (stateFilter !== 'all' && location.state !== stateFilter) {
        return false;
      }

      // City filter
      if (cityFilter !== 'all' && location.city !== cityFilter) {
        return false;
      }

      // Individual store filter
      if (storeFilter !== 'all' && store.storeId !== storeFilter) {
        return false;
      }

      return true;
    });
  }, [gradeFilter, stateFilter, cityFilter, storeFilter]);

  // Helper functions
  const getPerformanceRank = (store: typeof mockStoreRangePlans[0]) => {
    const benchmark = storeBenchmarks[store.storeId];
    if (!benchmark) return null;

    if (benchmark.gradeRank <= Math.ceil(benchmark.totalInGrade * 0.2)) {
      return { level: 'top', label: `Top ${benchmark.gradeRank}/${benchmark.totalInGrade} in Grade ${store.storeGrade}` };
    } else if (benchmark.gradeRank <= Math.ceil(benchmark.totalInGrade * 0.5)) {
      return { level: 'above-avg', label: `${benchmark.gradeRank}/${benchmark.totalInGrade} in Grade ${store.storeGrade}` };
    } else {
      return { level: 'below-avg', label: `${benchmark.gradeRank}/${benchmark.totalInGrade} in Grade ${store.storeGrade}` };
    }
  };

  const getTrendIndicator = (store: typeof mockStoreRangePlans[0]) => {
    // Simulate trend based on performance vs targets
    const otbVsTarget = store.otbFitPct - 90; // 90% as baseline target
    const fixtureVsTarget = store.fixtureUtilization - 85; // 85% as baseline target
    const overallTrend = (otbVsTarget + fixtureVsTarget) / 2;

    if (overallTrend > 5) return { direction: 'up', color: 'text-green-600' };
    if (overallTrend < -5) return { direction: 'down', color: 'text-red-600' };
    return { direction: 'stable', color: 'text-gray-500' };
  };


  return (
    <div className="space-y-4">
      <SectionHeader
        title="Store Range Plans"
        subtitle="Range architecture and planning status across store network"
      />

      {/* Filter Bar */}
      <FilterBar>
        <FilterSelect
          placeholder="All Grades"
          options={[
            { value: 'All', label: 'All Grades' },
            { value: 'A', label: 'A' },
            { value: 'A1', label: 'A1' },
            { value: 'A2', label: 'A2' },
            { value: 'A3', label: 'A3' },
          ]}
          value={gradeFilter}
          onChange={setGradeFilter}
          searchable
        />
        <FilterSelect
          placeholder="All States"
          options={stateOptions}
          value={stateFilter}
          onChange={setStateFilter}
          searchable
        />
        <FilterSelect
          placeholder="All Cities"
          options={cityOptions}
          value={cityFilter}
          onChange={setCityFilter}
          searchable
        />
        <FilterSelect
          placeholder="All Stores"
          options={storeOptions}
          value={storeFilter}
          onChange={setStoreFilter}
          searchable
        />
      </FilterBar>

      {/* Summary Strip */}
      <p className="text-xs text-gray-500 px-1">
        2174 stores • 30,000 unique options • Avg AOP Achievement 60% • Average OTB Utilization 75%
      </p>

      {filteredStores.length === 0 ? (
        <EmptyState description="No stores match your current filters" />
      ) : (
      <DataTable>
        <DataTableHeader>
          <DataTableHead>Store Name</DataTableHead>
          <DataTableHead>Grade</DataTableHead>
          <DataTableHead>POD/Area</DataTableHead>
          <DataTableHead>Manager</DataTableHead>
          <DataTableHead align="right">Options</DataTableHead>
          <DataTableHead align="right">Stock (K)</DataTableHead>
          <DataTableHead align="right">Sell Through %</DataTableHead>
          <DataTableHead align="right">Revenue (Cr)</DataTableHead>
          <DataTableHead align="center">Core/Fashion</DataTableHead>
          <DataTableHead align="right">Fixture Util %</DataTableHead>
          <DataTableHead align="right">SIS Space %</DataTableHead>
          <DataTableHead align="center">Actions</DataTableHead>
        </DataTableHeader>
        <DataTableBody>
          {filteredStores.map((store) => {
            const performanceRank = getPerformanceRank(store);
            const trendIndicator = getTrendIndicator(store);

            // Calculate metrics
            const stockK = Math.round(store.totalOptions * 2.5); // Rough estimate
            const sellThrough = Math.round(store.otbFitPct * 0.85);
            const revenue = (store.totalOptions * 0.015).toFixed(1);
            const coreOptions = store.segments.reduce((acc, seg) => acc + seg.coreOptions, 0);
            const corePct = Math.round((coreOptions / store.totalOptions) * 100);
            const fashionPct = 100 - corePct;

            // Check if store has SIS zones (simulated based on fixture data)
            const hasSisZone = store.segments.some(seg => seg.allocatedSFT > 1000);
            const sisPct = hasSisZone ? Math.round((store.segments.reduce(
              (acc, seg) => acc + (seg.allocatedSFT > 1000 ? seg.allocatedSFT * 0.15 : 0), 0
            ) / store.saleableArea) * 100) : 0;

            // Get POD/Area from store name
            const getPod = (name: string) => {
              if (name.toLowerCase().includes('malad') || name.toLowerCase().includes('thane')) return 'Mumbai West';
              if (name.toLowerCase().includes('koramangala') || name.toLowerCase().includes('bangalore')) return 'Bangalore';
              if (name.toLowerCase().includes('ncr') || name.toLowerCase().includes('gurgaon')) return 'Delhi NCR';
              if (name.toLowerCase().includes('hyderabad')) return 'Hyderabad';
              return 'Mumbai West';
            };

            return (
              <DataTableRow
                key={store.storeId}
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => navigate(`/range/store/${store.storeId}`)}
              >
                <DataTableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{store.storeName}</span>
                    {performanceRank?.level === 'top' && (
                      <Award className="w-3 h-3 text-green-600" aria-label="Top performer" />
                    )}
                    {trendIndicator.direction === 'up' && <TrendingUp className="w-3 h-3 text-green-600" />}
                    {trendIndicator.direction === 'down' && <TrendingDown className="w-3 h-3 text-red-600" />}
                  </div>
                </DataTableCell>
                <DataTableCell>
                  <Badge variant="outline" size="sm">{store.storeGrade}</Badge>
                </DataTableCell>
                <DataTableCell className="text-gray-500">{getPod(store.storeName)}</DataTableCell>
                <DataTableCell className="text-gray-500">
                  {store.storeGrade === 'A' ? 'Raj Kumar' :
                   store.storeGrade === 'A1' ? 'Priya Sharma' :
                   store.storeGrade === 'A2' ? 'Amit Singh' : 'Kavita Patel'}
                </DataTableCell>
                <DataTableCell align="right" className="font-medium">
                  {store.totalOptions.toLocaleString()}
                </DataTableCell>
                <DataTableCell align="right">{stockK}</DataTableCell>
                <DataTableCell align="right">
                  <span className={cn(
                    "font-medium",
                    sellThrough >= 70 ? "text-green-700" :
                    sellThrough >= 60 ? "text-amber-700" : "text-red-700"
                  )}>
                    {sellThrough}%
                  </span>
                </DataTableCell>
                <DataTableCell align="right" className="font-medium">{getCurrencySymbol()}{revenue}</DataTableCell>
                <DataTableCell align="center">
                  <div className="flex items-center justify-center gap-1">
                    <div className="flex h-2 w-20 rounded-full overflow-hidden">
                      {/* eslint-disable-next-line no-restricted-syntax -- Dynamic width for core/fashion split */}
                      <div className="bg-gray-500" style={{ width: `${corePct}%` }} />
                      {/* eslint-disable-next-line no-restricted-syntax -- Dynamic width for core/fashion split */}
                      <div className="bg-gray-400" style={{ width: `${fashionPct}%` }} />
                    </div>
                    <span className="text-xs text-gray-500">{corePct}/{fashionPct}</span>
                  </div>
                </DataTableCell>
                <DataTableCell align="right">
                  <span className={cn(
                    "font-medium",
                    store.fixtureUtilization >= 90 ? "text-green-700" :
                    store.fixtureUtilization >= 80 ? "text-amber-700" : "text-red-700"
                  )}>
                    {store.fixtureUtilization}%
                  </span>
                </DataTableCell>
                <DataTableCell align="right">
                  {sisPct > 0 ? (
                    <span className={cn(
                      "font-medium",
                      sisPct > 20 ? "text-amber-700" : "text-gray-700"
                    )}>
                      {sisPct}%
                    </span>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </DataTableCell>
                <DataTableCell align="center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/range/store/${store.storeId}`);
                    }}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </DataTableCell>
              </DataTableRow>
            );
          })}
        </DataTableBody>
      </DataTable>
      )}
    </div>
  );
}

// ─── Segment Mix Tab ────────────────────────────────────────────────────────

function SegmentMixTab() {
  const setActiveTab = useRangeStore((s) => s.setActiveTab);
  const { edit: canEdit } = useModulePermissions('rangeArch');

  const [selectedSegment, setSelectedSegment] = useState<string | null>(() => {
    // Check URL params for initial segment selection
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('segment');
  });

  const [segmentActiveTab, setSegmentActiveTab] = useState<'segment-overview' | 'family-level' | 'brick-level' | 'fashion-trends'>('segment-overview');
  const [selectedFamily, setSelectedFamily] = useState<string | null>(null);
  const [expandedCluster, setExpandedCluster] = useState<number | null>(null);

  // State for brick-level editing
  const [isGlobalEditing, setIsGlobalEditing] = useState(false);
  const [buyerData, setBuyerData] = useState<{ [key: string]: { priceRange: string; optionCount: number; totalQuantity: number } }>({});

  // Brick selection state
  const selectedBrickId = useRangeStore((s) => s.selectedBrickId);
  const selectBrick = useRangeStore((s) => s.selectBrick);

  // State for BM allocations editing
  const [editingBmAllocations, setEditingBmAllocations] = useState<{ [familyId: string]: { [bmId: string]: number } }>({});
  const [isEditingBmFamily, setIsEditingBmFamily] = useState<string | null>(null);

  // State for style BM metadata editing (to be implemented)
  // const [expandedStyleRow, setExpandedStyleRow] = useState<string | null>(null);
  // const [editingStyleMetadata, setEditingStyleMetadata] = useState<{ [styleId: string]: StyleBmMetadata }>({});

  // State for channel assignments (to be implemented)
  // const [channelAssignmentPopup, setChannelAssignmentPopup] = useState<string | null>(null);

  // Helper to get brick variants for the table
  const getBrickVariantsForTable = () => {
    if (selectedBrickId) {
      // Show only the selected brick's variants
      const selectedBrick = getBrickById(selectedBrickId);
      if (selectedBrick && selectedBrick.attributeVariants) {
        return selectedBrick.attributeVariants.map(variant => ({
          ...variant,
          brickName: selectedBrick.brickName
        }));
      }
      return [];
    } else if (selectedFamily) {
      // Show bricks from the selected family only
      const family = getFamilyById(selectedFamily);
      if (family) {
        return family.bricks.flatMap(brick =>
          brick.attributeVariants?.map(variant => ({
            ...variant,
            brickName: brick.brickName
          })) || []
        );
      }
      return [];
    } else {
      // Show all bricks' variants from all families
      return getFamiliesBySegment(selectedSegmentData?.segmentId || '').flatMap(family =>
        family.bricks.flatMap(brick =>
          brick.attributeVariants?.map(variant => ({
            ...variant,
            brickName: brick.brickName
          })) || []
        )
      );
    }
  };

  // Filter to main 4 segments
  const mainSegments = segmentRangeSummary.filter(seg =>
    ['MC', 'WIW', 'WWW', 'KW'].includes(seg.segmentId)
  );

  const nameMap = {
    'MC': "Men's Casual",
    'WIW': "Women's Wear",
    'WWW': "Men's Wear",
    'KW': "Kids Wear"
  };

  const selectedSegmentData = selectedSegment
    ? mainSegments.find(seg => seg.segmentId === selectedSegment)
    : null;


  if (selectedSegment && selectedSegmentData) {
    const segmentName = nameMap[selectedSegmentData.segmentId as keyof typeof nameMap];

    return (
      <div className="space-y-6">
        {/* Back Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSelectedSegment(null);
              // Clear URL parameters
              const url = new URL(window.location.href);
              url.search = '';
              window.history.pushState({}, '', url.pathname);
              // Navigate back to Network Overview tab
              setActiveTab('network');
            }}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Network Overview
          </button>
        </div>

        {/* Tabbed Interface */}
        <Tabs
          value={segmentActiveTab}
          onValueChange={(value) => setSegmentActiveTab(value as typeof segmentActiveTab)}
          className="space-y-6"
        >
          <TabsList variant="underline" className="bg-transparent p-0">
            <TabsTrigger value="segment-overview" variant="underline" className="text-base font-semibold">
              Segment Overview
            </TabsTrigger>
            <TabsTrigger value="family-level" variant="underline" className="text-base font-semibold" disabled>
              Family-level breakdown
            </TabsTrigger>
            <TabsTrigger
              value="brick-level"
              variant="underline"
              className="text-base font-semibold"
              disabled
            >
              Brick-level breakdown
            </TabsTrigger>
            <TabsTrigger value="fashion-trends" variant="underline" className="text-base font-semibold">
              Fashion Trends
            </TabsTrigger>
          </TabsList>

          {/* Segment Overview Tab */}
          <TabsContent value="segment-overview" className="space-y-4 animate-fadeInUp" role="tabpanel" aria-label="Segment overview">
            {/* eslint-disable-next-line no-restricted-syntax -- Animation delay needed for staggered entrance animation */}
            <div className="animate-slideInDown" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
              <SectionHeader
                title={`${segmentName} Overview`}
                subtitle="Family status and progress monitoring"
              />

              {/* Range Architecture KPI Cards */}
              <MetricGrid columns={4}>
                <div className="bg-white border border-gray-200 rounded-lg px-5 py-4 flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <span className="text-xs text-gray-500 font-medium">Range Progress</span>
                    <Badge variant="success" dot className="text-xs">Locked</Badge>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">89%</div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                      {/* eslint-disable-next-line no-restricted-syntax -- Dynamic progress bar width for Range Progress KPI */}
                    <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '89%' }}></div>
                    </div>
                    <span className="text-xs font-medium text-green-700">↗ +12%</span>
                  </div>
                  <div className="text-xs text-green-700">428 / 480 options locked</div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg px-5 py-4 flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <span className="text-xs text-gray-500 font-medium">AOP Target</span>
                    <Badge variant="success" dot className="text-xs">On Track</Badge>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">₹142.5M</div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                      {/* eslint-disable-next-line no-restricted-syntax -- Dynamic progress bar width for AOP Target KPI */}
                    <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '94%' }}></div>
                    </div>
                    <span className="text-xs font-medium text-green-700">↗ +5.2%</span>
                  </div>
                  <div className="text-xs text-green-700">Target: ₹152M</div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg px-5 py-4 flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <span className="text-xs text-gray-500 font-medium">Fixture Utilization</span>
                    <Badge variant="warning" dot className="text-xs">Monitor</Badge>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">76%</div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                      {/* eslint-disable-next-line no-restricted-syntax -- Dynamic progress bar width for Fixture Utilization KPI */}
                    <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: '76%' }}></div>
                    </div>
                    <span className="text-xs font-medium text-amber-700">↘ -3%</span>
                  </div>
                  <div className="text-xs text-amber-700">Below 80% target</div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg px-5 py-4 flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <span className="text-xs text-gray-500 font-medium">FTF Adoption</span>
                    <Badge variant="success" dot className="text-xs">Strong</Badge>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">32%</div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                      {/* eslint-disable-next-line no-restricted-syntax -- Dynamic progress bar width for FTF Adoption KPI */}
                    <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '64%' }}></div>
                    </div>
                    <span className="text-xs font-medium text-green-700">↗ +8%</span>
                  </div>
                  <div className="text-xs text-green-700">Above 30% target</div>
                </div>
              </MetricGrid>

              {/* Families Table */}
              <div className="space-y-3">
                <SectionHeader
                  title="Families"
                  subtitle="Click on a family to explore detailed breakdown"
                />

                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className={cn(
                    "grid px-4 py-2.5 border-b border-gray-200 bg-gray-50",
                    "grid-cols-[1fr_130px_130px_120px_120px_180px_150px_100px]",
                    "text-[10px] font-semibold text-gray-400 uppercase tracking-wider"
                  )}>
                    <span>FAMILY</span>
                    <span className="text-right">OPTIONS</span>
                    <span className="text-right">BUY QTY</span>
                    <span className="text-right">FASHION</span>
                    <span className="text-right">FTF</span>
                    <span className="text-right">STORES</span>
                    <span className="ml-8">STATUS</span>
                    <span></span>
                  </div>

                  {[
                    {
                      id: 'activewear',
                      name: 'Activewear',
                      abbr: 'AW',
                      options: 128,
                      optTarget: 150,
                      buyQty: 45000,
                      fashionPct: '35%',
                      ftfAdoption: '42%',
                      storeCoverage: '485 / 485',
                      status: 'Locked',
                      locked: true,
                      alert: 'Spring refresh ready'
                    },
                    {
                      id: 'youth-boys',
                      name: 'Youth Boys',
                      abbr: 'YB',
                      options: 95,
                      optTarget: 120,
                      buyQty: 32000,
                      fashionPct: '28%',
                      ftfAdoption: '38%',
                      storeCoverage: '478 / 485',
                      status: 'Locked',
                      locked: true,
                      alert: null
                    },
                    {
                      id: 'casual-wear',
                      name: 'Casual Wear',
                      abbr: 'CW',
                      options: 87,
                      optTarget: 100,
                      buyQty: 28500,
                      fashionPct: '22%',
                      ftfAdoption: '31%',
                      storeCoverage: '485 / 485',
                      status: 'Locked',
                      locked: true,
                      alert: null
                    },
                    {
                      id: 'smart-casuals',
                      name: 'Smart Casuals',
                      abbr: 'SC',
                      options: 64,
                      optTarget: 75,
                      buyQty: 22000,
                      fashionPct: '45%',
                      ftfAdoption: '28%',
                      storeCoverage: '465 / 485',
                      status: 'Planning',
                      locked: false,
                      alert: 'Trend integration pending'
                    }
                  ].map((family, i) => {
                    const isLast = i === 3;

                    return (
                      <div
                        key={family.id}
                        role="button"
                        tabIndex={0}
                        className={cn(
                          "grid px-4 py-3 cursor-pointer transition-colors items-center",
                          "grid-cols-[1fr_130px_130px_120px_120px_180px_150px_100px]",
                          "hover:bg-gray-50 focus-kb:bg-gray-50 focus:outline-none focus-kb:ring-2 focus-kb:ring-indigo-500",
                          !isLast && "border-b border-gray-100"
                        )}
                        onClick={() => setSegmentActiveTab('family-level')}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setSegmentActiveTab('family-level');
                          }
                        }}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0",
                            family.locked ? "bg-indigo-50 text-primary-700" : "bg-red-50 text-red-700"
                          )}>
                            {family.abbr}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                              {family.name}
                              {family.alert && (
                                <span className={cn(
                                  "text-[10px] font-medium px-2 py-0.5 rounded-full max-w-[200px] truncate",
                                  family.locked ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"
                                )}>
                                  {family.alert}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-sm font-bold text-gray-900">{family.options}</span>
                          <span className="text-xs text-gray-400"> / {family.optTarget}</span>
                        </div>

                        <div className="text-right text-sm font-semibold text-gray-900">
                          {family.buyQty.toLocaleString()}
                        </div>

                        <div className="text-right text-sm font-semibold text-gray-900">
                          {family.fashionPct}
                        </div>

                        <div className="text-right text-sm font-semibold text-gray-900">
                          {family.ftfAdoption}
                        </div>

                        <div className="text-right text-xs text-gray-600">
                          {family.storeCoverage}
                        </div>

                        <div className="flex justify-start ml-8">
                          <Badge variant={family.locked ? 'success' : 'warning'} dot className="text-xs">
                            {family.status}
                          </Badge>
                        </div>

                        <div className="text-right">
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* System Recommendations for Segment - HIDDEN (moved to backlog) */}
              {/* <div className="space-y-3">
                <SectionHeader
                  title="System Recommendations"
                  subtitle={`AI-driven actions for ${segmentName} from range analysis, FTF signals & market context`}
                />

                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className={cn(
                    "grid px-4 py-2.5 border-b border-gray-200 bg-gray-50",
                    "grid-cols-[1fr_160px_150px_150px_120px_130px_140px]",
                    "text-[10px] font-semibold text-gray-400 uppercase tracking-wider"
                  )}>
                    <span>ACTION</span>
                    <span className="-ml-4">METRIC</span>
                    <span>IMPACT</span>
                    <span>LINKED KPI</span>
                    <span>FAMILIES</span>
                    <span>PRIORITY</span>
                    <span className="text-right">ACTIONS</span>
                  </div>

                  {(() => {
                    const segmentRecommendations = selectedSegmentData.segmentId === 'MC' ? [
                      {
                        id: '1',
                        action: 'Increase Fashion Split to 35% in Activewear',
                        families: ['Activewear'],
                        priority: 'Critical',
                        metric: 'Current: 30% • Target: 35%',
                        rationale: 'Activewear family at 30% fashion vs 35% network opportunity. FTF signals show 45% growth in athleisure categories.',
                        impact: 'Estimated +₹2.1 Cr revenue potential',
                        linkedKpi: 'Core / Fashion Split'
                      },
                      {
                        id: '2',
                        action: 'Optimize FTF adoption in Smart Casuals',
                        families: ['Smart Casuals'],
                        priority: 'Urgent',
                        metric: 'Current: 28% • Target: 35%',
                        rationale: 'Smart Casuals lagging FTF adoption. Market signals show strong demand for comfort-fit options.',
                        impact: 'Estimated +₹1.4 Cr revenue uplift',
                        linkedKpi: 'FTF Adoption'
                      },
                      {
                        id: '3',
                        action: 'Accelerate Youth Boys range completion',
                        families: ['Youth Boys'],
                        priority: 'Medium',
                        metric: 'Progress: 85% • Target: 95%',
                        rationale: 'Youth Boys family behind target completion rate. Critical for upcoming season launch.',
                        impact: 'Range lock timeline at risk',
                        linkedKpi: 'Range Progress'
                      }
                    ] : selectedSegmentData.segmentId === 'WIW' ? [
                      {
                        id: '1',
                        action: 'Expand festive collection in Women\'s Traditional',
                        families: ['Traditional', 'Fusion'],
                        priority: 'Critical',
                        metric: 'Opportunity: +45 options',
                        rationale: 'Upcoming festival season shows 60% higher demand for traditional wear.',
                        impact: 'Estimated +₹3.2 Cr revenue potential',
                        linkedKpi: 'Seasonal Mix'
                      },
                      {
                        id: '2',
                        action: 'Optimize Western Wear fabric choices',
                        families: ['Western'],
                        priority: 'Medium',
                        metric: 'Comfort index: 72%',
                        rationale: 'Customer feedback indicates preference for breathable fabrics in western wear.',
                        impact: 'Improved customer satisfaction',
                        linkedKpi: 'Customer NPS'
                      }
                    ] : [
                      {
                        id: '1',
                        action: 'Review segment-specific opportunities',
                        families: ['All'],
                        priority: 'Medium',
                        metric: 'Analysis pending',
                        rationale: 'Segment analysis in progress for targeted recommendations.',
                        impact: 'Optimization potential identified',
                        linkedKpi: 'Range Efficiency'
                      }
                    ];

                    return segmentRecommendations.map((rec, i) => {
                      const isLast = i === segmentRecommendations.length - 1;

                      const priorityConfig = rec.priority === 'Critical'
                        ? { variant: 'error', dotColor: 'bg-red-500' }
                        : rec.priority === 'Urgent'
                        ? { variant: 'warning', dotColor: 'bg-amber-500' }
                        : { variant: 'info', dotColor: 'bg-blue-500' };

                      return (
                        <div key={rec.id} className={cn(!isLast && "border-b border-gray-100")}>
                          <div
                            className={cn(
                              "grid px-4 py-3 items-center transition-colors hover:bg-gray-50",
                              "grid-cols-[1fr_160px_150px_150px_120px_130px_140px]"
                            )}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className={cn("w-[7px] h-[7px] rounded-full shrink-0", priorityConfig.dotColor)} />
                              <div>
                                <div className="text-sm font-medium text-gray-900 truncate">
                                  {rec.action}
                                </div>
                                <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                                  {rec.rationale}
                                </div>
                              </div>
                            </div>

                            <div className="-ml-4">
                              <span className="text-xs font-medium text-gray-900">
                                {rec.metric}
                              </span>
                            </div>

                            <div>
                              <span className="text-xs font-medium text-gray-900">
                                {rec.impact}
                              </span>
                            </div>

                            <div>
                              <span className="text-xs font-medium text-primary-700">
                                {rec.linkedKpi}
                              </span>
                            </div>

                            <div className="flex gap-1">
                              {rec.families.map(family => (
                                <span
                                  key={family}
                                  className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-primary-700"
                                >
                                  {family}
                                </span>
                              ))}
                            </div>

                            <div>
                              <Badge variant={priorityConfig.variant as 'error' | 'warning' | 'info'} className="text-xs">
                                {rec.priority}
                              </Badge>
                            </div>

                            <div className="text-right">
                              <Button
                                size="sm"
                                className="text-xs px-2 py-1"
                                onClick={() => setSegmentActiveTab('family-level')}
                              >
                                View Details
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()
                  }
                </div>
              </div> */}

              {/* Buying Model Composition Section */}
              <div className="space-y-3 mt-6">
                <SectionHeader
                  title="Buying Model Composition"
                  subtitle="Allocation strategy across different buying models"
                />
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Buying Model</th>
                          <th className="px-4 py-2.5 text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Share %</th>
                          <th className="px-4 py-2.5 text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Option Target</th>
                          <th className="px-4 py-2.5 text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Options Built</th>
                          <th className="px-4 py-2.5 text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Milestone Status</th>
                          <th className="px-4 py-2.5 text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Progress</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          // Get category profile data based on selected segment
                          const categoryProfile = mockCategoryProfiles.find(cp => {
                            if (selectedSegmentData?.segmentId === 'MC' || selectedSegmentData?.segmentId === 'WWW') {
                              return cp.categoryName === "Men's Shirts";
                            } else if (selectedSegmentData?.segmentId === 'WIW') {
                              return cp.categoryName === "Women's Tops";
                            }
                            return null;
                          });

                          if (!categoryProfile) return null;

                          return categoryProfile.bmAllocations.map((allocation, index) => {
                            const bmMeta = BUYING_MODELS[allocation.buyingModelId];
                            const colors = getBuyingModelColor(allocation.buyingModelId);
                            const isLast = index === categoryProfile.bmAllocations.length - 1;

                            return (
                              <tr key={allocation.buyingModelId} className={cn(!isLast && "border-b border-gray-100")}>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <span className={cn(
                                      "px-2 py-0.5 rounded text-xs font-semibold",
                                      colors.bg,
                                      colors.text
                                    )}>
                                      {allocation.code}
                                    </span>
                                    <span className="text-sm font-medium text-gray-900">{bmMeta.shortLabel}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <span className="text-sm font-semibold text-gray-900">{allocation.sharePct}%</span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <span className="text-sm text-gray-900">{allocation.optionTarget}</span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <span className="text-sm font-semibold text-gray-900">{allocation.optionsBuilt}</span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  {allocation.milestoneStatus === 'on_track' && (
                                    <Badge variant="success" size="sm">On Track</Badge>
                                  )}
                                  {allocation.milestoneStatus === 'at_risk' && (
                                    <Badge variant="warning" size="sm">At Risk</Badge>
                                  )}
                                  {allocation.milestoneStatus === 'complete' && (
                                    <Badge variant="success" size="sm">Complete</Badge>
                                  )}
                                  {allocation.milestoneStatus === 'not_due' && (
                                    <Badge variant="outline" size="sm">Not Due</Badge>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <div className="flex items-center justify-center gap-2">
                                    <div className="w-full max-w-[80px] bg-gray-200 rounded-full h-1.5">
                                      <div
                                        className={cn(
                                          "h-1.5 rounded-full",
                                          allocation.optionsBuilt >= allocation.optionTarget * 0.9 ? "bg-green-500" :
                                          allocation.optionsBuilt >= allocation.optionTarget * 0.7 ? "bg-amber-500" :
                                          "bg-red-500"
                                        )}
                                        style={{ width: `${Math.min(100, (allocation.optionsBuilt / allocation.optionTarget) * 100)}%` }} // eslint-disable-line no-restricted-syntax -- Progress bar width
                                      />
                                    </div>
                                    <span className="text-xs text-gray-500">
                                      {Math.round((allocation.optionsBuilt / allocation.optionTarget) * 100)}%
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            );
                          });
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Family-level breakdown Tab */}
          <TabsContent value="family-level" className="space-y-4 animate-fadeInUp" role="tabpanel" aria-label="Segment family-level breakdown">
            {/* eslint-disable-next-line no-restricted-syntax -- Animation delay needed for staggered entrance animation */}
            <div className="animate-slideInDown" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
              <SectionHeader
                title="Family-level Breakdown"
                subtitle={`${segmentName} family performance and expansion across all stores`}
              />

              {/* Family Expandable Cards */}
              <div className="space-y-4">
                {getFamiliesBySegment(selectedSegmentData.segmentId).map((familyData, familyIndex) => {
                  return (
                    // eslint-disable-next-line no-restricted-syntax -- Dynamic animation delay for staggered entrance
                    <div key={familyIndex} className="animate-slideInLeft" style={{ animationDelay: `${0.2 + familyIndex * 0.1}s`, animationFillMode: 'both' }}>
                      {/* Family Header Card */}
                      <div
                        className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:shadow-md hover:border-primary/30 transition-all duration-200"
                        role="button"
                        tabIndex={0}
                        onClick={() => setExpandedCluster(expandedCluster === familyIndex ? null : familyIndex)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpandedCluster(expandedCluster === familyIndex ? null : familyIndex); } }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              {expandedCluster === familyIndex ? (
                                <ChevronDown className="w-4 h-4 text-primary" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-gray-400" />
                              )}
                              <h3 className="text-lg font-semibold text-gray-900">{familyData.familyName}</h3>
                            </div>
                            <Badge
                              variant={
                                familyData.performance.status === 'active' ? 'default' :
                                familyData.performance.status === 'locked' ? 'success' :
                                familyData.performance.status === 'review' ? 'warning' : 'secondary'
                              }
                              size="sm"
                            >
                              {familyData.performance.status}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <div className="text-sm text-gray-500">Options</div>
                              <div className="text-lg font-semibold text-gray-900">{familyData.performance.optionsPlanned}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-gray-500">Budget</div>
                              <div className="text-lg font-semibold text-gray-900">{familyData.performance.budget}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-gray-500">Progress</div>
                              <div className="text-lg font-semibold text-gray-900">{familyData.performance.progress}%</div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-gray-500">Stores</div>
                              <div className="text-lg font-semibold text-gray-900">{familyData.performance.storeCount}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-gray-500">Contribution</div>
                              <div className="text-lg font-semibold text-primary">{familyData.performance.contribution}</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Family Details */}
                      {expandedCluster === familyIndex && (
                        // eslint-disable-next-line no-restricted-syntax -- Dynamic animation delay for staggered entrance
                        <div className="bg-gray-50 rounded-lg p-4 mt-3 border-l-4 border-l-primary/20 transition-all duration-200 animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
                          <Tabs defaultValue="overview" className="space-y-4">
                            <TabsList className="grid w-full grid-cols-3" role="tablist">
                              <TabsTrigger value="overview">Overview</TabsTrigger>
                              <TabsTrigger value="composition">Composition</TabsTrigger>
                              <TabsTrigger value="attributes">Attributes</TabsTrigger>
                            </TabsList>

                            <TabsContent value="overview" className="space-y-4" role="tabpanel">
                              <SectionHeader title="Performance Overview" />
                              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                <div className="bg-white border border-gray-200 rounded-lg p-3">
                                  <div className="text-sm text-gray-500 mb-1">Options Planned</div>
                                  <div className="text-xl font-bold text-gray-900">{familyData.performance.optionsPlanned}</div>
                                  <div className="text-xs text-green-600">Stage: {familyData.performance.stage}</div>
                                </div>
                                <div className="bg-white border border-gray-200 rounded-lg p-3">
                                  <div className="text-sm text-gray-500 mb-1">Budget Allocated</div>
                                  <div className="text-xl font-bold text-gray-900">{familyData.performance.budget}</div>
                                  <div className="text-xs text-gray-600">Risk: {familyData.performance.risk}</div>
                                </div>
                                <div className="bg-white border border-gray-200 rounded-lg p-3">
                                  <div className="text-sm text-gray-500 mb-1">Store Coverage</div>
                                  <div className="text-xl font-bold text-gray-900">{familyData.performance.storeCount}</div>
                                  <div className="text-xs text-gray-600">stores</div>
                                </div>
                                <div className="bg-white border border-gray-200 rounded-lg p-3">
                                  <div className="text-sm text-gray-500 mb-1">Contribution</div>
                                  <div className="text-xl font-bold text-primary">{familyData.performance.contribution}</div>
                                  <div className="text-xs text-gray-600">to segment</div>
                                </div>
                              </div>

                              {/* BM Slot Allocation */}
                              <div className="bg-white border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="text-md font-semibold text-gray-900">Buying Model Allocation</h4>
                                  <Button
                                    variant={isEditingBmFamily === familyData.familyId ? "primary" : "outline"}
                                    size="sm"
                                    onClick={() => {
                                      if (isEditingBmFamily === familyData.familyId) {
                                        // Save logic here
                                        setIsEditingBmFamily(null);
                                      } else {
                                        // Initialize edit state with current values from mockSegments
                                        const segment = mockSegments.find(s => s.name === (segmentName === "Men's Casual" ? "Men's Shirts" : segmentName === "Women's Wear" ? "Women's Tops" : "Men's Shirts"));
                                        const family = segment?.families.find(f => f.name === familyData.familyName);
                                        if (family) {
                                          const allocations: { [bmId: string]: number } = {};
                                          family.bmAllocations.forEach(alloc => {
                                            allocations[alloc.buyingModelId] = alloc.optionTarget;
                                          });
                                          setEditingBmAllocations({ ...editingBmAllocations, [familyData.familyId]: allocations });
                                        }
                                        setIsEditingBmFamily(familyData.familyId);
                                      }
                                    }}
                                    className={isEditingBmFamily === familyData.familyId ? "" : "text-primary hover:text-primary"}
                                  >
                                    {isEditingBmFamily === familyData.familyId ? (
                                      <>
                                        <Save className="w-4 h-4 mr-1" />
                                        Save
                                      </>
                                    ) : (
                                      <>
                                        <Edit3 className="w-4 h-4 mr-1" />
                                        Edit
                                      </>
                                    )}
                                  </Button>
                                </div>

                                {/* Get BM allocations from mockSegments */}
                                {(() => {
                                  const segment = mockSegments.find(s => s.name === (segmentName === "Men's Casual" ? "Men's Shirts" : segmentName === "Women's Wear" ? "Women's Tops" : "Men's Shirts"));
                                  const family = segment?.families.find(f => f.name === familyData.familyName);

                                  if (!family) return <div className="text-sm text-gray-500">No allocation data available</div>;

                                  return (
                                    <div className="space-y-2">
                                      {isEditingBmFamily === familyData.familyId ? (
                                        // Edit mode
                                        <div className="grid grid-cols-2 gap-3">
                                          {family.bmAllocations.map(allocation => {
                                            const bmColor = getBuyingModelColor(allocation.buyingModelId);
                                            return (
                                              <div key={allocation.buyingModelId} className="flex items-center gap-2">
                                                <span className={cn(
                                                  "text-xs font-medium px-2 py-1 rounded-full",
                                                  bmColor.bg,
                                                  bmColor.text
                                                )}>
                                                  {allocation.code}: {allocation.shortLabel}
                                                </span>
                                                <Input
                                                  type="number"
                                                  value={editingBmAllocations[familyData.familyId]?.[allocation.buyingModelId] || 0}
                                                  onChange={(e) => {
                                                    const value = parseInt(e.target.value) || 0;
                                                    setEditingBmAllocations({
                                                      ...editingBmAllocations,
                                                      [familyData.familyId]: {
                                                        ...editingBmAllocations[familyData.familyId],
                                                        [allocation.buyingModelId]: value
                                                      }
                                                    });
                                                  }}
                                                  className="w-20 h-7 text-sm"
                                                  min="0"
                                                />
                                                <span className="text-xs text-gray-500">slots</span>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      ) : (
                                        // View mode
                                        <div className="flex flex-wrap gap-2">
                                          {family.bmAllocations.map(allocation => {
                                            const bmColor = getBuyingModelColor(allocation.buyingModelId);
                                            return (
                                              <div key={allocation.buyingModelId} className="flex items-center gap-1">
                                                <span className={cn(
                                                  "text-xs font-medium px-2 py-1 rounded-full",
                                                  bmColor.bg,
                                                  bmColor.text
                                                )}>
                                                  {allocation.code}: {allocation.shortLabel}
                                                </span>
                                                <span className="text-sm font-semibold text-gray-700">
                                                  {allocation.optionTarget}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                  ({allocation.sharePct}%)
                                                </span>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}

                                      {/* Total validation */}
                                      {isEditingBmFamily === familyData.familyId && (
                                        <div className="pt-2 border-t border-gray-200">
                                          <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Total Allocated:</span>
                                            <span className={cn(
                                              "font-semibold",
                                              Object.values(editingBmAllocations[familyData.familyId] || {}).reduce((sum, val) => sum + val, 0) === familyData.performance.optionsPlanned
                                                ? "text-green-600"
                                                : "text-red-600"
                                            )}>
                                              {Object.values(editingBmAllocations[familyData.familyId] || {}).reduce((sum, val) => sum + val, 0)} / {familyData.performance.optionsPlanned}
                                            </span>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })()}
                              </div>

                              {/* Brick Navigation */}
                              <div className="bg-white border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="text-md font-semibold text-gray-900">View Bricks in {familyData.familyName}</h4>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      selectBrick(null);
                                      setSelectedFamily(familyData.familyId);
                                      setSegmentActiveTab('brick-level');
                                    }}
                                    className="text-primary hover:text-primary"
                                  >
                                    <ArrowRight className="w-4 h-4 mr-2" />
                                    View All Bricks
                                  </Button>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  {familyData.bricks.slice(0, 4).map((brick, brickIndex) => (
                                    <button
                                      key={brickIndex}
                                      onClick={() => {
                                        selectBrick(brick.brickId);
                                        setSegmentActiveTab('brick-level');
                                        setSelectedFamily(familyData.familyId);
                                      }}
                                      className="bg-gray-50 rounded-lg p-3 text-left hover:bg-primary/5 hover:border-primary/20 transition-all cursor-pointer border border-gray-200"
                                    >
                                      <div className="text-sm font-semibold text-gray-900">{brick.brickName}</div>
                                      <div className="text-xs text-gray-600 mt-1">{brick.performance.optionsPlanned} options</div>
                                      <div className="text-xs text-primary mt-1">→ View Details</div>
                                    </button>
                                  ))}
                                </div>
                                {familyData.bricks.length > 4 && (
                                  <div className="text-xs text-gray-500 mt-2 text-center">
                                    +{familyData.bricks.length - 4} more bricks available
                                  </div>
                                )}
                              </div>
                            </TabsContent>

                            <TabsContent value="composition" className="space-y-4">
                              <SectionHeader title="Product Composition" />
                              <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white border border-gray-200 rounded-lg p-4">
                                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Core vs Fashion Split</h4>
                                  <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm text-gray-600">Core Options</span>
                                      <span className="text-sm font-semibold text-gray-900">{Math.floor(familyData.performance.optionsPlanned * 0.7)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm text-gray-600">Fashion Options</span>
                                      <span className="text-sm font-semibold text-gray-900">{Math.floor(familyData.performance.optionsPlanned * 0.3)}</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                      <div className="bg-blue-500 h-2 rounded-full w-7/10"></div>
                                    </div>
                                    <span className="text-xs text-blue-700 font-medium">70% Core, 30% Fashion</span>
                                  </div>
                                </div>
                                <div className="bg-white border border-gray-200 rounded-lg p-4">
                                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Price Architecture</h4>
                                  <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm text-gray-600">Blended ASP</span>
                                      <span className="text-sm font-semibold text-gray-900">
                                        {getCurrencySymbol()}{familyData.segmentId === 'MC' ? '1299' : familyData.segmentId === 'WIW' ? '1599' : familyData.segmentId === 'WWW' ? '1899' : '999'}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm text-gray-600">Price Range</span>
                                      <span className="text-sm font-semibold text-gray-900">
                                        {getCurrencySymbol()}{familyData.segmentId === 'MC' ? '599-2499' : familyData.segmentId === 'WIW' ? '799-2999' : familyData.segmentId === 'WWW' ? '999-3499' : '399-1999'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </TabsContent>

                            <TabsContent value="attributes" className="space-y-4">
                              <SectionHeader title="Executive Attributes Intelligence" subtitle="AI-curated attribute insights with performance indicators" />

                              {/* Style & Design Attributes */}
                              <div className="space-y-4">
                                <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-lg p-4 border border-blue-200">
                                  <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                      <div className="p-2 bg-blue-100 rounded-lg">
                                        <Palette className="w-5 h-5 text-blue-600" />
                                      </div>
                                      <div>
                                        <h3 className="text-lg font-bold text-gray-900">Style & Design Attributes</h3>
                                        <p className="text-sm text-gray-600">Primary design characteristics and aesthetic elements</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className="text-right">
                                        <p className="text-xs text-gray-500">Confidence Score</p>
                                        <p className="text-sm font-bold text-green-600">94%</p>
                                      </div>
                                      <div className="p-1 bg-green-100 rounded">
                                        <TrendingUp className="w-4 h-4 text-green-600" />
                                      </div>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="bg-white/70 backdrop-blur rounded-lg p-3 border border-blue-100">
                                      <div className="flex items-center gap-2 mb-2">
                                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                        <p className="text-xs text-gray-600 font-medium">Silhouettes</p>
                                      </div>
                                      <div className="space-y-1">
                                        {(familyData.segmentId === 'MC' ? [
                                          { name: 'Regular Fit', percentage: 45 },
                                          { name: 'Slim Fit', percentage: 35 },
                                          { name: 'Relaxed Fit', percentage: 20 }
                                        ] : familyData.segmentId === 'WIW' ? [
                                          { name: 'Regular', percentage: 40 },
                                          { name: 'A-Line', percentage: 30 },
                                          { name: 'Fitted', percentage: 30 }
                                        ] : familyData.segmentId === 'WWW' ? [
                                          { name: 'Tailored Fit', percentage: 50 },
                                          { name: 'Regular Fit', percentage: 30 },
                                          { name: 'Comfort Fit', percentage: 20 }
                                        ] : [
                                          { name: 'Regular', percentage: 60 },
                                          { name: 'Relaxed', percentage: 25 },
                                          { name: 'Slim', percentage: 15 }
                                        ]).slice(0, 2).map((item, i) => (
                                          <div key={i} className="flex items-center justify-between">
                                            <span className="text-xs text-gray-700">{item.name}</span>
                                            <span className="text-xs font-semibold text-blue-700">{item.percentage}%</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>

                                    <div className="bg-white/70 backdrop-blur rounded-lg p-3 border border-blue-100">
                                      <div className="flex items-center gap-2 mb-2">
                                        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                                        <p className="text-xs text-gray-600 font-medium">Color Palette</p>
                                      </div>
                                      <div className="space-y-1">
                                        {(familyData.segmentId === 'MC' ? [
                                          { name: 'Navy & Blues', percentage: 35 },
                                          { name: 'Earth Tones', percentage: 25 }
                                        ] : familyData.segmentId === 'WIW' ? [
                                          { name: 'Vibrant Colors', percentage: 40 },
                                          { name: 'Pastels', percentage: 30 }
                                        ] : familyData.segmentId === 'WWW' ? [
                                          { name: 'Neutrals', percentage: 45 },
                                          { name: 'Classic Colors', percentage: 35 }
                                        ] : [
                                          { name: 'Bright Colors', percentage: 50 },
                                          { name: 'Primary Colors', percentage: 30 }
                                        ]).map((item, i) => (
                                          <div key={i} className="flex items-center justify-between">
                                            <span className="text-xs text-gray-700">{item.name}</span>
                                            <span className="text-xs font-semibold text-purple-700">{item.percentage}%</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>

                                    <div className="bg-white/70 backdrop-blur rounded-lg p-3 border border-blue-100">
                                      <div className="flex items-center gap-2 mb-2">
                                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                        <p className="text-xs text-gray-600 font-medium">Print Types</p>
                                      </div>
                                      <div className="space-y-1">
                                        {(familyData.segmentId === 'MC' ? [
                                          { name: 'Solid', percentage: 60 },
                                          { name: 'Graphic', percentage: 25 }
                                        ] : familyData.segmentId === 'WIW' ? [
                                          { name: 'Floral', percentage: 35 },
                                          { name: 'Geometric', percentage: 30 }
                                        ] : familyData.segmentId === 'WWW' ? [
                                          { name: 'Solid', percentage: 55 },
                                          { name: 'Subtle Prints', percentage: 25 }
                                        ] : [
                                          { name: 'Fun Prints', percentage: 45 },
                                          { name: 'Character', percentage: 30 }
                                        ]).map((item, i) => (
                                          <div key={i} className="flex items-center justify-between">
                                            <span className="text-xs text-gray-700">{item.name}</span>
                                            <span className="text-xs font-semibold text-green-700">{item.percentage}%</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>

                                    <div className="bg-white/70 backdrop-blur rounded-lg p-3 border border-blue-100">
                                      <div className="flex items-center gap-2 mb-2">
                                        <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                                        <p className="text-xs text-gray-600 font-medium">Price Points</p>
                                      </div>
                                      <div className="space-y-1">
                                        {(familyData.segmentId === 'MC' ? [
                                          { name: '₹800-1200', percentage: 45 },
                                          { name: '₹1200-1800', percentage: 35 }
                                        ] : familyData.segmentId === 'WIW' ? [
                                          { name: '₹1200-2000', percentage: 40 },
                                          { name: '₹2000-3500', percentage: 35 }
                                        ] : familyData.segmentId === 'WWW' ? [
                                          { name: '₹2000-3500', percentage: 50 },
                                          { name: '₹3500-5000', percentage: 30 }
                                        ] : [
                                          { name: '₹600-900', percentage: 55 },
                                          { name: '₹900-1200', percentage: 30 }
                                        ]).map((item, i) => (
                                          <div key={i} className="flex items-center justify-between">
                                            <span className="text-xs text-gray-700">{item.name}</span>
                                            <span className="text-xs font-semibold text-amber-700">{item.percentage}%</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Material & Fabric Attributes */}
                                <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 rounded-lg p-4 border border-emerald-200">
                                  <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                      <div className="p-2 bg-emerald-100 rounded-lg">
                                        <Layers className="w-5 h-5 text-emerald-600" />
                                      </div>
                                      <div>
                                        <h3 className="text-lg font-bold text-gray-900">Material & Fabric Attributes</h3>
                                        <p className="text-sm text-gray-600">Fabric composition and material performance indicators</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className="text-right">
                                        <p className="text-xs text-gray-500">Performance Score</p>
                                        <p className="text-sm font-bold text-emerald-600">
                                          {familyData.segmentId === 'MC' ? '87%' : familyData.segmentId === 'WIW' ? '92%' : familyData.segmentId === 'WWW' ? '89%' : '85%'}
                                        </p>
                                      </div>
                                      <div className="p-1 bg-emerald-100 rounded">
                                        <Target className="w-4 h-4 text-emerald-600" />
                                      </div>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                    <div className="bg-white/70 backdrop-blur rounded-lg p-4 border border-emerald-100">
                                      <div className="flex items-center gap-2 mb-3">
                                        <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                                        <p className="text-sm text-gray-700 font-semibold">Fabric Composition</p>
                                      </div>
                                      <div className="space-y-3">
                                        {(familyData.segmentId === 'MC' ? [
                                          { fabric: 'Cotton', percentage: 45, trend: 'up' },
                                          { fabric: 'Cotton Blends', percentage: 35, trend: 'stable' },
                                          { fabric: 'Synthetic', percentage: 20, trend: 'down' }
                                        ] : familyData.segmentId === 'WIW' ? [
                                          { fabric: 'Cotton', percentage: 35, trend: 'stable' },
                                          { fabric: 'Silk Blends', percentage: 30, trend: 'up' },
                                          { fabric: 'Synthetic', percentage: 35, trend: 'stable' }
                                        ] : familyData.segmentId === 'WWW' ? [
                                          { fabric: 'Wool Blends', percentage: 40, trend: 'up' },
                                          { fabric: 'Cotton', percentage: 30, trend: 'stable' },
                                          { fabric: 'Premium Blends', percentage: 30, trend: 'up' }
                                        ] : [
                                          { fabric: 'Cotton', percentage: 50, trend: 'stable' },
                                          { fabric: 'Cotton Blends', percentage: 30, trend: 'stable' },
                                          { fabric: 'Fun Fabrics', percentage: 20, trend: 'up' }
                                        ]).map((item, i) => (
                                          <div key={i} className="flex items-center justify-between">
                                            <span className="text-xs text-gray-700">{item.fabric}</span>
                                            <div className="flex items-center gap-2">
                                              <span className="text-xs font-semibold text-emerald-700">{item.percentage}%</span>
                                              <div className={cn(
                                                "w-2 h-2 rounded-full",
                                                item.trend === 'up' && "bg-green-500",
                                                item.trend === 'stable' && "bg-gray-400",
                                                item.trend === 'down' && "bg-red-500"
                                              )}></div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>

                                    <div className="bg-white/70 backdrop-blur rounded-lg p-4 border border-emerald-100">
                                      <div className="flex items-center gap-2 mb-3">
                                        <div className="w-3 h-3 bg-teal-500 rounded-full"></div>
                                        <p className="text-sm text-gray-700 font-semibold">Quality Indicators</p>
                                      </div>
                                      <div className="space-y-3">
                                        {[
                                          { metric: 'Durability', score: familyData.segmentId === 'WWW' ? 92 : familyData.segmentId === 'MC' ? 85 : 88 },
                                          { metric: 'Comfort', score: familyData.segmentId === 'WIW' ? 94 : familyData.segmentId === 'MC' ? 87 : 90 },
                                          { metric: 'Care Rating', score: familyData.segmentId === 'MC' ? 82 : familyData.segmentId === 'WWW' ? 88 : 85 }
                                        ].map((item, i) => (
                                          <div key={i} className="space-y-1">
                                            <div className="flex items-center justify-between">
                                              <span className="text-xs text-gray-700">{item.metric}</span>
                                              <span className="text-xs font-semibold text-teal-700">{item.score}%</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                                              {/* eslint-disable-next-line no-restricted-syntax -- Dynamic width for quality score progress bar */}
                                              <div className="bg-teal-500 h-1.5 rounded-full" style={{ width: `${item.score}%` }} />
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>

                                    <div className="bg-white/70 backdrop-blur rounded-lg p-4 border border-emerald-100">
                                      <div className="flex items-center gap-2 mb-3">
                                        <div className="w-3 h-3 bg-cyan-500 rounded-full"></div>
                                        <p className="text-sm text-gray-700 font-semibold">Sustainability Score</p>
                                      </div>
                                      <div className="text-center">
                                        <div className="text-3xl font-bold text-cyan-600 mb-1">
                                          {familyData.segmentId === 'MC' ? 'B+' : familyData.segmentId === 'WIW' ? 'A-' : familyData.segmentId === 'WWW' ? 'A' : 'B'}
                                        </div>
                                        <div className="text-xs text-gray-600 mb-3">
                                          {familyData.segmentId === 'MC' ? 'Good sustainability practices' : familyData.segmentId === 'WIW' ? 'Excellent eco-friendly sourcing' : familyData.segmentId === 'WWW' ? 'Premium sustainable materials' : 'Improving sustainability profile'}
                                        </div>
                                        <div className="flex items-center justify-center gap-1">
                                          <Badge variant="outline" size="sm" className="bg-cyan-50 text-cyan-700 border-cyan-200">
                                            Eco-Friendly
                                          </Badge>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </TabsContent>
                          </Tabs>
                        </div>
                      )}
                    </div>
                  );
                })}

              </div>


            </div>
          </TabsContent>


          {/* Brick-level breakdown Tab */}
          <TabsContent value="brick-level" className="space-y-4 animate-fadeInUp" role="tabpanel" aria-label="Segment brick-level breakdown">
            {/* eslint-disable-next-line no-restricted-syntax -- Animation delay needed for staggered entrance animation */}
            <div className="animate-slideInDown" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
              <SectionHeader
                title={selectedBrickId ? `${getBrickById(selectedBrickId)?.brickName || 'Brick'} Attribute Variants` : "Brick-level Breakdown"}
                subtitle={selectedBrickId
                  ? `Detailed attribute combinations for ${getBrickById(selectedBrickId)?.brickName || 'selected brick'}`
                  : `${selectedFamily ? getFamilyById(selectedFamily)?.familyName || 'Selected Family' : 'Selected Family'} brick attribute combinations and detailed analysis`
                }
              />

              {/* Back to All Bricks Button - only show when viewing single brick */}
              {selectedBrickId && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => selectBrick(null)}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to All Bricks
                  </Button>
                </div>
              )}

              {/* Global Edit Controls */}
              <div className="flex justify-between items-center mb-4">
                <div className="text-sm text-gray-600">
                  {isGlobalEditing ? 'Editing mode: Click Save to apply all changes' : 'View mode: Click Edit to modify buyer values'}
                </div>
                {canEdit && <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (isGlobalEditing) {
                      // Save logic - just toggle off editing mode
                      setIsGlobalEditing(false);
                    } else {
                      // Edit logic - initialize all buyer data and toggle on editing
                      const variants = getBrickVariantsForTable();
                      const initialBuyerData: { [key: string]: { priceRange: string; optionCount: number; totalQuantity: number } } = {};
                      variants.forEach(variant => {
                        if (!buyerData[variant.id]) {
                          initialBuyerData[variant.id] = {
                            priceRange: variant.priceRange,
                            optionCount: variant.optionCount,
                            totalQuantity: variant.totalQuantity
                          };
                        }
                      });
                      if (Object.keys(initialBuyerData).length > 0) {
                        setBuyerData(prev => ({ ...prev, ...initialBuyerData }));
                      }
                      setIsGlobalEditing(true);
                    }
                  }}
                  className={cn(
                    "text-sm px-3 py-2",
                    isGlobalEditing && "bg-indigo-50 border-indigo-200 text-primary-700 hover:bg-indigo-100"
                  )}
                >
                  {isGlobalEditing ? (
                    <><Save className="w-4 h-4 mr-2" />Save All Changes</>
                  ) : (
                    <><Edit3 className="w-4 h-4 mr-2" />Edit All Values</>
                  )}
                </Button>}
              </div>

              {/* Brick Attributes Table */}
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900" rowSpan={2}>Brick Name</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900" rowSpan={2}>Silhouette</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900" rowSpan={2}>Fabric</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900" rowSpan={2}>Print</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900" rowSpan={2}>Buying Model</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900 border-r border-gray-300" colSpan={3}>Price Range</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900 border-r border-gray-300" colSpan={3}>Option Count</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900" colSpan={3}>Total Quantity</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900" rowSpan={2}>Source</th>
                      </tr>
                      <tr>
                        <th className="px-2 py-2 text-center text-xs font-medium text-gray-600">Historical</th>
                        <th className="px-2 py-2 text-center text-xs font-medium text-gray-600">System</th>
                        <th className="px-2 py-2 text-center text-xs font-medium text-gray-600 border-r border-gray-300">Buyer</th>
                        <th className="px-2 py-2 text-center text-xs font-medium text-gray-600">Historical</th>
                        <th className="px-2 py-2 text-center text-xs font-medium text-gray-600">System</th>
                        <th className="px-2 py-2 text-center text-xs font-medium text-gray-600 border-r border-gray-300">Buyer</th>
                        <th className="px-2 py-2 text-center text-xs font-medium text-gray-600">Historical</th>
                        <th className="px-2 py-2 text-center text-xs font-medium text-gray-600">System</th>
                        <th className="px-2 py-2 text-center text-xs font-medium text-gray-600 border-r border-gray-300">Buyer</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {getBrickVariantsForTable().map((variant) => {
                        const currentBuyerData = buyerData[variant.id] || {
                          priceRange: variant.priceRange,
                          optionCount: variant.optionCount,
                          totalQuantity: variant.totalQuantity
                        };

                        const updateBuyerData = (field: string, value: string | number) => {
                          setBuyerData(prev => ({
                            ...prev,
                            [variant.id]: {
                              ...currentBuyerData,
                              [field]: value
                            }
                          }));
                        };

                        return (
                          <tr key={variant.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{variant.brickName}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{variant.silhouette}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{variant.fabricType}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{variant.print}</td>

                            {/* Buying Model Column */}
                            <td className="px-4 py-3 text-center">
                              {(() => {
                                // Mock BM assignment based on price range and source
                                const priceValue = variant.priceRange ? parseInt(variant.priceRange.replace(/[₹,]/g, '')) : 0;
                                const isHighPrice = priceValue > 2000;
                                const isMidPrice = priceValue > 1200;
                                const isConsignment = variant.print === 'TBD' || variant.source === 'Past Sales' && priceValue < 1000;

                                let bmId: BuyingModelId | null = null;
                                if (isConsignment) {
                                  bmId = 'BM-6';
                                } else if (isHighPrice) {
                                  bmId = 'BM-1';
                                } else if (isMidPrice) {
                                  bmId = 'BM-2';
                                } else {
                                  bmId = 'BM-4';
                                }

                                const colors = getBuyingModelColor(bmId);

                                if (isConsignment && variant.print === 'TBD') {
                                  // Placeholder row for BM-6
                                  return (
                                    <span className="text-xs text-gray-400 italic">
                                      BM-6 Slots
                                    </span>
                                  );
                                }

                                return (
                                  <span
                                    className={cn(
                                      "px-2 py-0.5 rounded text-xs font-semibold inline-block",
                                      colors.bg,
                                      colors.text
                                    )}
                                  >
                                    {bmId}
                                  </span>
                                );
                              })()}
                            </td>

                            {/* Price Range Columns */}
                            <td className="px-2 py-3 text-center text-xs text-gray-600">{getCurrencySymbol()}{Math.round(parseFloat(variant.priceRange.replace(/[₹,-]/g, '')) * 0.85)}-{Math.round(parseFloat(variant.priceRange.replace(/[₹,-]/g, '')) * 0.95)}</td>
                            <td className="px-2 py-3 text-center text-xs text-gray-700">{variant.priceRange}</td>
                            <td className="px-2 py-3 text-center text-xs border-r border-gray-200">
                              {isGlobalEditing ? (
                                <Input
                                  type="text"
                                  value={currentBuyerData.priceRange}
                                  onChange={(e) => updateBuyerData('priceRange', e.target.value)}
                                  className="text-center text-xs h-7 px-1"
                                />
                              ) : (
                                <span className="text-gray-900 font-medium">{currentBuyerData.priceRange}</span>
                              )}
                            </td>

                            {/* Option Count Columns */}
                            <td className="px-2 py-3 text-center text-xs text-gray-600">{Math.round(variant.optionCount * 0.8)}</td>
                            <td className="px-2 py-3 text-center text-xs text-gray-700">{variant.optionCount}</td>
                            <td className="px-2 py-3 text-center text-xs border-r border-gray-200">
                              {isGlobalEditing ? (
                                <Input
                                  type="number"
                                  value={currentBuyerData.optionCount}
                                  onChange={(e) => updateBuyerData('optionCount', parseInt(e.target.value) || 0)}
                                  className="text-center text-xs h-7 px-1"
                                />
                              ) : (
                                <span className="text-gray-900 font-medium">{currentBuyerData.optionCount}</span>
                              )}
                            </td>

                            {/* Total Quantity Columns */}
                            <td className="px-2 py-3 text-center text-xs text-gray-600">{Math.round(variant.totalQuantity * 0.7).toLocaleString()}</td>
                            <td className="px-2 py-3 text-center text-xs text-gray-700">{variant.totalQuantity.toLocaleString()}</td>
                            <td className="px-2 py-3 text-center text-xs">
                              {isGlobalEditing ? (
                                <Input
                                  type="number"
                                  value={currentBuyerData.totalQuantity}
                                  onChange={(e) => updateBuyerData('totalQuantity', parseInt(e.target.value) || 0)}
                                  className="text-center text-xs h-7 px-1"
                                />
                              ) : (
                                <span className="text-gray-900 font-medium">{currentBuyerData.totalQuantity.toLocaleString()}</span>
                              )}
                            </td>

                            <td className="px-4 py-3 text-center">
                              <span className={cn(
                                "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
                                variant.source === 'Past Sales' && "bg-blue-100 text-blue-800",
                                variant.source === 'FTF' && "bg-green-100 text-green-800",
                                variant.source === 'Past Sales & FTF' && "bg-purple-100 text-purple-800"
                              )}>
                                {variant.source}
                              </span>
                            </td>

                          </tr>
                        );
                      })}

                      {/* Add placeholder rows for BM-6 consignment slots */}
                      {[1, 2, 3].map((index) => (
                        <tr key={`consignment-placeholder-${index}`} className="hover:bg-gray-50 transition-colors opacity-60">
                          <td className="px-4 py-3 text-sm text-gray-400 italic" colSpan={4}>
                            Consignment Slot {index} (BM-6) - To be filled by vendor
                          </td>

                          {/* Buying Model Column */}
                          <td className="px-4 py-3 text-center">
                            <span
                              className={cn(
                                "px-2 py-0.5 rounded text-xs font-semibold inline-block",
                                getBuyingModelColor('BM-6' as BuyingModelId).bg,
                                getBuyingModelColor('BM-6' as BuyingModelId).text
                              )}
                            >
                              BM-6
                            </span>
                          </td>

                          {/* Price Range Columns */}
                          <td className="px-2 py-3 text-center text-xs text-gray-400">—</td>
                          <td className="px-2 py-3 text-center text-xs text-gray-400">—</td>
                          <td className="px-2 py-3 text-center text-xs border-r border-gray-200 text-gray-400">TBD</td>

                          {/* Option Count Columns */}
                          <td className="px-2 py-3 text-center text-xs text-gray-400">0</td>
                          <td className="px-2 py-3 text-center text-xs text-gray-400">0</td>
                          <td className="px-2 py-3 text-center text-xs border-r border-gray-200 text-gray-400">TBD</td>

                          {/* Total Quantity Columns */}
                          <td className="px-2 py-3 text-center text-xs text-gray-400">0</td>
                          <td className="px-2 py-3 text-center text-xs text-gray-400">0</td>
                          <td className="px-2 py-3 text-center text-xs text-gray-400">TBD</td>

                          {/* Source Column */}
                          <td className="px-4 py-3 text-center">
                            <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800">
                              Vendor-sourced
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Table Summary Footer */}
                <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
                  <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-6">
                      <span>
                        Total Combinations: <span className="font-medium text-gray-900">
                          {getBrickVariantsForTable().length}
                        </span>
                      </span>
                      <span>
                        System Options: <span className="font-medium text-gray-900">
                          {getBrickVariantsForTable().reduce(
                            (total, variant) => total + variant.optionCount, 0
                          )}
                        </span>
                      </span>
                      <span>
                        Buyer Options: <span className="font-medium text-primary-700">
                          {getBrickVariantsForTable().reduce(
                            (total, variant) => {
                              const buyerOptions = buyerData[variant.id]?.optionCount || variant.optionCount;
                              return total + buyerOptions;
                            }, 0
                          )}
                        </span>
                      </span>
                      <span>
                        System Quantity: <span className="font-medium text-gray-900">
                          {getBrickVariantsForTable().reduce(
                            (total, variant) => total + variant.totalQuantity, 0
                          ).toLocaleString()}
                        </span>
                      </span>
                      <span>
                        Buyer Quantity: <span className="font-medium text-primary-700">
                          {getBrickVariantsForTable().reduce(
                            (total, variant) => {
                              const buyerQuantity = buyerData[variant.id]?.totalQuantity || variant.totalQuantity;
                              return total + buyerQuantity;
                            }, 0
                          ).toLocaleString()}
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-100 rounded-full"></div>
                        <span className="text-xs">Past Sales</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-100 rounded-full"></div>
                        <span className="text-xs">FTF</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-purple-100 rounded-full"></div>
                        <span className="text-xs">Past Sales & FTF</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Fashion Trends Tab */}
          <TabsContent value="fashion-trends" className="space-y-6">
            {/* Executive Fashion Intelligence - MetricGrid Pattern */}
            <div className="space-y-3">
              <SectionHeader
                title="Executive Fashion Intelligence"
                subtitle={`AI-powered trend analysis and revenue impact for ${segmentName}`}
              />
              <MetricGrid>
                <MetricCard
                  label={selectedSegmentData.segmentId === 'MC' ? "Sustainable Revenue Impact" : selectedSegmentData.segmentId === 'WIW' ? "Power Dressing Revenue Impact" : selectedSegmentData.segmentId === 'WWW' ? "Smart Casual Revenue Impact" : "Gender-Neutral Revenue Impact"}
                  value={selectedSegmentData.segmentId === 'MC' ? "₹42 L" : selectedSegmentData.segmentId === 'WIW' ? "₹58 L" : selectedSegmentData.segmentId === 'WWW' ? "₹65 L" : "₹38 L"}
                  trend={selectedSegmentData.segmentId === 'MC' ? "+25% vs ₹34 L last year" : selectedSegmentData.segmentId === 'WIW' ? "+30% vs ₹45 L last year" : selectedSegmentData.segmentId === 'WWW' ? "+35% vs ₹48 L last year" : "+40% vs ₹27 L last year"}
                  subtitle="From trend optimization"
                  status="on-track"
                />
                <MetricCard
                  label={selectedSegmentData.segmentId === 'MC' ? "Tech-Apparel Opportunity" : selectedSegmentData.segmentId === 'WIW' ? "Day-to-Night Adoption" : selectedSegmentData.segmentId === 'WWW' ? "Hybrid Work Adoption" : "Interactive Elements Adoption"}
                  value={selectedSegmentData.segmentId === 'MC' ? "+22%" : selectedSegmentData.segmentId === 'WIW' ? "+28%" : selectedSegmentData.segmentId === 'WWW' ? "+40%" : "+45%"}
                  trend={selectedSegmentData.segmentId === 'MC' ? "+22% vs 18% baseline" : selectedSegmentData.segmentId === 'WIW' ? "+28% vs 22% baseline" : selectedSegmentData.segmentId === 'WWW' ? "+40% vs 28% baseline" : "+45% vs 25% baseline"}
                  subtitle="Market penetration growth"
                  status="on-track"
                />
                <MetricCard
                  label="Premium Trend Margin"
                  value={selectedSegmentData.segmentId === 'MC' ? "38%" : selectedSegmentData.segmentId === 'WIW' ? "42%" : selectedSegmentData.segmentId === 'WWW' ? "45%" : "35%"}
                  trend={selectedSegmentData.segmentId === 'MC' ? "+12% vs 26% standard" : selectedSegmentData.segmentId === 'WIW' ? "+15% vs 27% standard" : selectedSegmentData.segmentId === 'WWW' ? "+18% vs 27% standard" : "+10% vs 25% standard"}
                  subtitle="Trend-driven category"
                  status="on-track"
                />
                <MetricCard
                  label="Trend Adoption Rate"
                  value={selectedSegmentData.segmentId === 'MC' ? "75%" : selectedSegmentData.segmentId === 'WIW' ? "82%" : selectedSegmentData.segmentId === 'WWW' ? "88%" : "68%"}
                  trend={selectedSegmentData.segmentId === 'MC' ? "+8% vs network avg" : selectedSegmentData.segmentId === 'WIW' ? "+12% vs network avg" : selectedSegmentData.segmentId === 'WWW' ? "+15% vs network avg" : "+5% vs network avg"}
                  subtitle="Segment responsiveness"
                  status="on-track"
                />
              </MetricGrid>
            </div>

            {/* Strategic Fashion Actions */}
            <div className="space-y-3">
              <SectionHeader
                title="Strategic Fashion Actions"
                subtitle="AI-recommended priority actions with revenue impact"
                actions={
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <Badge variant="info" size="sm">3 actions</Badge>
                  </div>
                }
              />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white border border-gray-200 rounded-lg p-4 border-l-4 border-l-red-500">
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="error" size="sm">Critical</Badge>
                    <span className="text-xs font-semibold text-green-700">
                      {selectedSegmentData.segmentId === 'MC' ? "+₹25 L" : selectedSegmentData.segmentId === 'WIW' ? "+₹32 L" : selectedSegmentData.segmentId === 'WWW' ? "+₹38 L" : "+₹22 L"}
                    </span>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    {selectedSegmentData.segmentId === 'MC' ? "Launch Sustainable Tech-Wear" : selectedSegmentData.segmentId === 'WIW' ? "Launch Professional Comfort Line" : selectedSegmentData.segmentId === 'WWW' ? "Launch Hybrid Work Collection" : "Launch Gender-Neutral Line"}
                  </h4>
                  <p className="text-xs text-gray-600 mb-3">
                    {selectedSegmentData.segmentId === 'MC' ? "Untapped ₹25 L opportunity. Competitor analysis shows 35% market gap in sustainable athletic-casual wear." : selectedSegmentData.segmentId === 'WIW' ? "Untapped ₹32 L opportunity. Work-from-home trend shows 45% demand gap in professional comfort wear." : selectedSegmentData.segmentId === 'WWW' ? "Untapped ₹38 L opportunity. Hybrid work culture shows 50% gap in smart-casual professional wear." : "Untapped ₹22 L opportunity. Inclusive design trend shows 40% market gap in gender-neutral kids wear."}
                  </p>
                  <div className="space-y-2">
                    <div className="text-xs text-gray-500">Timeline: {selectedSegmentData.segmentId === 'MC' ? "4 weeks" : selectedSegmentData.segmentId === 'WIW' ? "3 weeks" : selectedSegmentData.segmentId === 'WWW' ? "5 weeks" : "6 weeks"}</div>
                    <Button size="sm" variant="outline" className="w-full">Review Strategy</Button>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4 border-l-4 border-l-amber-500">
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="warning" size="sm">High Impact</Badge>
                    <span className="text-xs font-semibold text-green-700">
                      {selectedSegmentData.segmentId === 'MC' ? "+₹15 L" : selectedSegmentData.segmentId === 'WIW' ? "+₹18 L" : selectedSegmentData.segmentId === 'WWW' ? "+₹20 L" : "+₹12 L"}
                    </span>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    {selectedSegmentData.segmentId === 'MC' ? "Optimize Eco-Friendly Materials" : selectedSegmentData.segmentId === 'WIW' ? "Expand Day-to-Night Options" : selectedSegmentData.segmentId === 'WWW' ? "Enhance Technical Fabric Range" : "Increase Interactive Elements"}
                  </h4>
                  <p className="text-xs text-gray-600 mb-3">
                    {selectedSegmentData.segmentId === 'MC' ? "Increase organic cotton & recycled options by 40%. Environmental consciousness shows 3x higher conversion." : selectedSegmentData.segmentId === 'WIW' ? "Expand versatile pieces by 35%. Multi-occasion wear shows 2.5x higher engagement." : selectedSegmentData.segmentId === 'WWW' ? "Increase performance fabric options by 30%. Technical features show 2.8x higher premium acceptance." : "Expand color-changing & glow features by 50%. Interactive elements show 4x higher engagement."}
                  </p>
                  <div className="space-y-2">
                    <div className="text-xs text-gray-500">Timeline: 2 weeks</div>
                    <Button size="sm" variant="outline" className="w-full">Review Strategy</Button>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4 border-l-4 border-l-blue-500">
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="info" size="sm">Operational</Badge>
                    <span className="text-xs font-semibold text-green-700">
                      {selectedSegmentData.segmentId === 'MC' ? "+₹8 L" : selectedSegmentData.segmentId === 'WIW' ? "+₹12 L" : selectedSegmentData.segmentId === 'WWW' ? "+₹14 L" : "+₹7 L"}
                    </span>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    {selectedSegmentData.segmentId === 'MC' ? "Regional Fit Optimization" : selectedSegmentData.segmentId === 'WIW' ? "Size Range Optimization" : selectedSegmentData.segmentId === 'WWW' ? "Professional Fit Adjustment" : "Age-Group Sizing Optimization"}
                  </h4>
                  <p className="text-xs text-gray-600 mb-3">
                    {selectedSegmentData.segmentId === 'MC' ? "Adjust casual wear sizing. Regional data shows 60% preference for relaxed fit vs network standard." : selectedSegmentData.segmentId === 'WIW' ? "Expand size range for professional wear. Inclusive sizing shows 55% better conversion." : selectedSegmentData.segmentId === 'WWW' ? "Optimize smart-casual fits. Professional wear data shows 65% preference for tailored comfort." : "Adjust sizing for growth phases. Age-specific fitting shows 70% better satisfaction."}
                  </p>
                  <div className="space-y-2">
                    <div className="text-xs text-gray-500">Timeline: 1 week</div>
                    <Button size="sm" variant="outline" className="w-full">Review Strategy</Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Advanced Fashion Intelligence */}
            <div className="space-y-3">
              <SectionHeader
                title="Advanced Fashion Intelligence"
                subtitle="Multi-dimensional trend analysis with predictive insights"
                actions={
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <Badge variant="info" size="sm">AI-Powered</Badge>
                  </div>
                }
              />
              <div className="bg-white border border-gray-200 rounded-lg">
                <Tabs defaultValue="trends" className="">
                  <div className="px-4 pt-4">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="trends">Market Trends</TabsTrigger>
                      <TabsTrigger value="seasonal">Seasonal Intel</TabsTrigger>
                      <TabsTrigger value="competitor">Competitive</TabsTrigger>
                      <TabsTrigger value="performance">Performance</TabsTrigger>
                    </TabsList>
                  </div>
                  <TabsContent value="trends" className="px-4 pb-4 space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      <div className="bg-white border border-gray-200 rounded-lg p-4 border-l-4 border-l-green-500">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-green-600" />
                            <h4 className="font-semibold text-gray-900">Rising Trends</h4>
                          </div>
                          <Badge variant="success" size="sm">
                            {selectedSegmentData.segmentId === 'MC' ? "+25%" : selectedSegmentData.segmentId === 'WIW' ? "+30%" : selectedSegmentData.segmentId === 'WWW' ? "+35%" : "+40%"} avg
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          {(selectedSegmentData.segmentId === 'MC' ? [
                            { trend: 'Sustainable Materials', growth: '+25%', impact: 'High' },
                            { trend: 'Oversized Fits', growth: '+18%', impact: 'Medium' },
                            { trend: 'Tech-Enabled Apparel', growth: '+15%', impact: 'Medium' }
                          ] : selectedSegmentData.segmentId === 'WIW' ? [
                            { trend: 'Power Dressing Revival', growth: '+30%', impact: 'High' },
                            { trend: 'Sustainable Fashion', growth: '+28%', impact: 'High' },
                            { trend: 'Day-to-Night Versatile', growth: '+22%', impact: 'Medium' }
                          ] : selectedSegmentData.segmentId === 'WWW' ? [
                            { trend: 'Smart Casual Dominance', growth: '+35%', impact: 'High' },
                            { trend: 'Sustainable Suiting', growth: '+20%', impact: 'Medium' },
                            { trend: 'Technical Fabrics', growth: '+16%', impact: 'Medium' }
                          ] : [
                            { trend: 'Gender-Neutral Designs', growth: '+40%', impact: 'High' },
                            { trend: 'Interactive Elements', growth: '+32%', impact: 'Medium' },
                            { trend: 'Mini-Me Collections', growth: '+24%', impact: 'Medium' }
                          ]).map((item, i) => (
                            <div key={i} className="flex justify-between items-center text-sm">
                              <span className="text-gray-700">{item.trend}</span>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-green-700">{item.growth}</span>
                                <Badge variant={item.impact === 'High' ? 'success' : 'warning'} size="sm">{item.impact}</Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-white border border-gray-200 rounded-lg p-4 border-l-4 border-l-amber-500">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-600" />
                            <h4 className="font-semibold text-gray-900">Declining Trends</h4>
                          </div>
                          <Badge variant="warning" size="sm">Monitor</Badge>
                        </div>
                        <div className="space-y-2">
                          {(selectedSegmentData.segmentId === 'MC' ? [
                            { trend: 'Fast Fashion', decline: '-12%', reason: 'Sustainability focus' },
                            { trend: 'Skinny Fits', decline: '-8%', reason: 'Comfort preference' },
                            { trend: 'Synthetic Basics', decline: '-15%', reason: 'Eco-consciousness' }
                          ] : selectedSegmentData.segmentId === 'WIW' ? [
                            { trend: 'Rigid Formal Wear', decline: '-18%', reason: 'Hybrid work culture' },
                            { trend: 'Single-Use Pieces', decline: '-14%', reason: 'Versatility demand' },
                            { trend: 'Heavy Embellishments', decline: '-10%', reason: 'Minimalist trend' }
                          ] : selectedSegmentData.segmentId === 'WWW' ? [
                            { trend: 'Traditional Suits', decline: '-22%', reason: 'Smart casual rise' },
                            { trend: 'Occasion-Only Wear', decline: '-16%', reason: 'Versatility focus' },
                            { trend: 'Dry-Clean Only', decline: '-12%', reason: 'Convenience need' }
                          ] : [
                            { trend: 'Gender-Specific Colors', decline: '-25%', reason: 'Inclusive trend' },
                            { trend: 'Character Licensing', decline: '-18%', reason: 'Creative preference' },
                            { trend: 'Synthetic Materials', decline: '-20%', reason: 'Health awareness' }
                          ]).map((item, i) => (
                            <div key={i} className="text-sm">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-gray-700">{item.trend}</span>
                                <span className="font-semibold text-red-600">{item.decline}</span>
                              </div>
                              <p className="text-xs text-gray-500">{item.reason}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-white border border-gray-200 rounded-lg p-4 border-l-4 border-l-blue-500">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Target className="w-4 h-4 text-blue-600" />
                            <h4 className="font-semibold text-gray-900">Emerging Opportunities</h4>
                          </div>
                          <Badge variant="info" size="sm">Watch</Badge>
                        </div>
                        <div className="space-y-2">
                          {(selectedSegmentData.segmentId === 'MC' ? [
                            { opportunity: 'Premium Basics', potential: '₹15 Cr' },
                            { opportunity: 'Regional Festival Wear', potential: '₹8 Cr' },
                            { opportunity: 'Athleisure Crossover', potential: '₹12 Cr' }
                          ] : selectedSegmentData.segmentId === 'WIW' ? [
                            { opportunity: 'Work-from-Home Comfort', potential: '₹22 Cr' },
                            { opportunity: 'Occasion Wear Refresh', potential: '₹18 Cr' },
                            { opportunity: 'Sustainable Premium', potential: '₹25 Cr' }
                          ] : selectedSegmentData.segmentId === 'WWW' ? [
                            { opportunity: 'Hybrid Work Collection', potential: '₹28 Cr' },
                            { opportunity: 'Weekend Casual Premium', potential: '₹16 Cr' },
                            { opportunity: 'Tech-Enhanced Formals', potential: '₹20 Cr' }
                          ] : [
                            { opportunity: 'School-to-Play Versatility', potential: '₹14 Cr' },
                            { opportunity: 'Teen Fashion Forward', potential: '₹11 Cr' },
                            { opportunity: 'Sustainable Kids Line', potential: '₹9 Cr' }
                          ]).map((item, i) => (
                            <div key={i} className="flex justify-between items-center text-sm">
                              <span className="text-gray-700">{item.opportunity}</span>
                              <span className="font-semibold text-blue-700">{item.potential}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="seasonal" className="px-4 pb-4 space-y-4">
                    <div className="text-center py-8">
                      <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500">Seasonal intelligence analysis coming soon...</p>
                    </div>
                  </TabsContent>

                  <TabsContent value="competitor" className="px-4 pb-4 space-y-4">
                    <div className="text-center py-8">
                      <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500">Competitive analysis coming soon...</p>
                    </div>
                  </TabsContent>

                  <TabsContent value="performance" className="px-4 pb-4 space-y-4">
                    <div className="text-center py-8">
                      <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500">Performance analytics coming soon...</p>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Segment Range Mix"
        subtitle="Network-wide segment distribution with detailed attribute analysis"
      />

      {mainSegments.length === 0 ? (
        <EmptyState description="No segments to display" />
      ) : (
      <MetricGrid>
        {mainSegments.map((seg) => {
          const segmentName = nameMap[seg.segmentId as keyof typeof nameMap];

          return (
            <button
              key={seg.segmentId}
              onClick={() => setSelectedSegment(seg.segmentId)}
              className={cn(
                'bg-white rounded-lg border border-gray-200 p-4 text-left transition-all hover:shadow-lg',
                'hover:border-primary/40 focus:outline-none focus-kb:ring-2 focus-kb:ring-primary/20'
              )}
            >
              <div className="flex items-center justify-between gap-1 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-400" />
                  <h4 className="text-sm font-semibold text-gray-900">{segmentName}</h4>
                </div>
                <Badge variant={statusBadgeVariant(seg.status)} size="sm">
                  {statusLabel(seg.status)}
                </Badge>
              </div>

              <p className="text-2xl font-bold text-gray-900 mb-3">
                {seg.avgOptions}
                <span className="text-xs font-normal text-gray-500 ml-1">avg options</span>
              </p>

              {/* Core / Fashion Split Bar */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span>Core {seg.corePct}%</span>
                  <span>Fashion {seg.fashionPct}%</span>
                </div>
                <div className="flex h-2 rounded-full overflow-hidden">
                  {/* eslint-disable-next-line no-restricted-syntax -- Dynamic width for core/fashion split */}
                  <div className="bg-gray-500" style={{ width: `${seg.corePct}%` }} />
                  {/* eslint-disable-next-line no-restricted-syntax -- Dynamic width for core/fashion split */}
                  <div className="bg-gray-400" style={{ width: `${seg.fashionPct}%` }} />
                </div>
              </div>

              {/* Price Tier Distribution */}
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Price Tier Distribution</p>
                <div className="flex h-2 rounded-full overflow-hidden mb-1">
                  {/* eslint-disable-next-line no-restricted-syntax -- Dynamic width for price tier distribution */}
                  <div className="bg-blue-400" style={{ width: `${seg.priceMix.entry}%` }} />
                  {/* eslint-disable-next-line no-restricted-syntax -- Dynamic width for price tier distribution */}
                  <div className="bg-blue-600" style={{ width: `${seg.priceMix.mid}%` }} />
                  {/* eslint-disable-next-line no-restricted-syntax -- Dynamic width for price tier distribution */}
                  <div className="bg-blue-800" style={{ width: `${seg.priceMix.premium}%` }} />
                </div>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Entry {seg.priceMix.entry}%</span>
                  <span>Mid {seg.priceMix.mid}%</span>
                  <span>Premium {seg.priceMix.premium}%</span>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-1 text-xs text-primary font-medium">
                View Details
                <ArrowRight className="w-3 h-3" />
              </div>
            </button>
          );
        })}
      </MetricGrid>
      )}
    </div>
  );
}



// ─── Main Page Component ────────────────────────────────────────────────────

export function RangeDashboardPage() {
  const activeTab = useRangeStore((s) => s.activeTab);
  const setActiveTab = useRangeStore((s) => s.setActiveTab);
  const selectedHit = useRangeStore((s) => s.selectedHit);
  const selectHit = useRangeStore((s) => s.selectHit);
  const { data: availableHits } = useHits();

  // Handle URL parameter driven tab switching
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const segment = urlParams.get('segment');

    if (segment && activeTab !== 'segment-mix') {
      setActiveTab('segment-mix');
    }
  }, [activeTab, setActiveTab]);

  return (
    <div className="animate-fadeInUp space-y-4">
      {/* Page Header */}
      <PageHeader
        title="Range Architecture"
        actions={
          availableHits ? (
            <Select value={selectedHit || ''} onValueChange={selectHit}>
              <SelectTrigger className="w-40 text-sm font-medium text-primary-700 bg-indigo-50 border-indigo-200 hover:bg-indigo-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableHits.hits.map((hit) => (
                  <SelectItem key={hit.hit} value={hit.hit}>
                    {hit.hit}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : undefined
        }
      />

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as typeof activeTab)}
      >
        <TabsList variant="underline">
          <TabsTrigger value="network" variant="underline">Network Overview</TabsTrigger>
          {/* Segment Range Planning tab - hidden from tabs but accessible via URL params */}
          <TabsTrigger value="store-range" variant="underline">Store Range</TabsTrigger>
        </TabsList>

        <TabsContent value="network">
          <NetworkOverviewTab />
        </TabsContent>

        {/* Segment Mix tab - not shown in tab list but navigated to directly via segment clicks */}
        <TabsContent value="segment-mix">
          <SegmentMixTab />
        </TabsContent>

        <TabsContent value="store-range">
          <StoreRangeTab />
        </TabsContent>


      </Tabs>
    </div>
  );
}
