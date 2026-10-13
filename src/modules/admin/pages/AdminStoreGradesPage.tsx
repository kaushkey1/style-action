import { useState, useMemo, useCallback } from 'react';
import {
  Badge,
  Button,
  KpiLabel,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Pagination,
  usePagination,
  MetricGrid,
  PageHeader,
  EmptyState,
} from '@/components/ui';
import { useUnifiedPlanningStore } from '@/modules/store-view/stores/unified-planning.store';
import {cn, getFormattingConfig, getCurrencySymbol} from '@/lib/utils';
import { AlertTriangle, Check, X, Clock, Settings2 } from 'lucide-react';
import type { StoreGrade } from '@/modules/store-view/types/unified-planning.types';
import {
  storeSpaceProfiles,
  spsfTargets,
  getSpsfTargetForGrade,
  getSpsfRagStatus,
} from '@/modules/range/data/mockSpacePlanning';
import {
  storeClusters,
  storeTwinAnalyses,
  reclassificationTriggers,
} from '@/modules/store-view/data/mockStoreIntelligence';
import useToast from '@/hooks/useToast';

const gradeOptions: StoreGrade[] = ['A+', 'A1', 'A2', 'B1', 'B2', 'C1'];

const gradeBadgeVariant = (grade: string) =>
  grade.startsWith('A') ? ('success' as const) : ('default' as const);

// Map app grades to OM display labels for summary cards
const gradeCardConfig: { appGrades: string[]; omLabel: string; omGrade: string }[] = [
  { appGrades: ['A+'], omLabel: 'A (HSHP)', omGrade: 'A' },
  { appGrades: ['A1'], omLabel: 'A1 (HSLP)', omGrade: 'A1' },
  { appGrades: ['A2'], omLabel: 'A2 (LSHP)', omGrade: 'A2' },
  { appGrades: ['B1', 'B2', 'C1'], omLabel: 'A3 (LSLP)', omGrade: 'A3' },
];

const ragColorClasses: Record<string, string> = {
  red: 'bg-red-100 text-red-700',
  amber: 'bg-amber-100 text-amber-700',
  green: 'bg-green-100 text-green-700',
  blue: 'bg-blue-100 text-blue-700',
};

const ragDotClasses: Record<string, string> = {
  red: 'bg-error',
  amber: 'bg-warning',
  green: 'bg-success',
  blue: 'bg-primary',
};

const gapScoreColor = (score: number) => {
  if (score >= 75) return 'bg-success';
  if (score >= 60) return 'bg-warning';
  return 'bg-error';
};

export function AdminStoreGradesPage() {
  const stores = useUnifiedPlanningStore((s) => s.stores);
  const updateStoreGrade = useUnifiedPlanningStore((s) => s.updateStoreGrade);
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [clusterFilter, setClusterFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedReclassStore, setSelectedReclassStore] = useState<string | null>(null);
  const [reclassDecisions, setReclassDecisions] = useState<Record<string, 'accepted' | 'rejected' | 'deferred'>>({});
  const { success } = useToast();

  const handleReclassAction = useCallback((storeId: string, action: 'accepted' | 'rejected' | 'deferred') => {
    setReclassDecisions((prev) => ({ ...prev, [storeId]: action }));
    const labels = { accepted: 'Accepted', rejected: 'Rejected', deferred: 'Deferred' };
    success(`Reclassification ${labels[action].toLowerCase()} for ${stores.find((s) => s.id === storeId)?.name ?? storeId}`);
    setSelectedReclassStore(null);
  }, [stores, success]);

  const availableRegions = useMemo(() => {
    const regions = new Set(stores.map((s) => s.region));
    return ['North', 'South', 'East', 'West'].filter((r) => regions.has(r));
  }, [stores]);

  const availableClusters = useMemo(() => {
    const clusters = new Set(stores.map((s) => s.cluster));
    return storeClusters.filter((c) => clusters.has(c.id));
  }, [stores]);

  const filteredStores = useMemo(() => {
    let result = stores;
    if (regionFilter !== 'all') {
      result = result.filter((s) => s.region === regionFilter);
    }
    if (clusterFilter !== 'all') {
      result = result.filter((s) => s.cluster === clusterFilter);
    }
    return result;
  }, [stores, regionFilter, clusterFilter]);

  const { totalPages, totalItems, pageSize, getPageItems } = usePagination(filteredStores, 25);
  const pageItems = getPageItems(currentPage);

  // Reset page when filters change
  const handleRegionFilter = useCallback((r: string) => {
    setRegionFilter(r);
    setCurrentPage(1);
  }, []);

  const handleClusterFilter = useCallback((c: string) => {
    setClusterFilter(c);
    setCurrentPage(1);
  }, []);

  // Build grade summary cards with intelligence data
  const gradeSummaries = useMemo(() => {
    return gradeCardConfig.map((cfg) => {
      const gradeStores = stores.filter((s) => cfg.appGrades.includes(s.grade));
      const profiles = gradeStores
        .map((s) => storeSpaceProfiles.find((p) => p.storeId === s.id))
        .filter(Boolean);
      const spsfTarget = spsfTargets.find((t) => t.grade === cfg.omGrade);

      const storeCount = gradeStores.length;
      const totalArea = profiles.reduce((sum, p) => sum + (p?.carpetArea || 0), 0);
      const meanSpsf = profiles.length > 0
        ? Math.round(profiles.reduce((sum, p) => sum + (p?.spsf || 0), 0) / profiles.length)
        : 0;
      const meanGmrof = profiles.length > 0
        ? Math.round(profiles.reduce((sum, p) => sum + (p?.gmrof || 0), 0) / profiles.length)
        : 0;
      const revenueCr = gradeStores.reduce((sum, s) => sum + (s.monthlyRevenue ?? 0), 0) / 10000000;

      const ragStatus = spsfTarget ? getSpsfRagStatus(meanSpsf, spsfTarget) : 'green';

      // Intelligence additions
      const clusterIds = [...new Set(gradeStores.map((s) => s.cluster))];
      const avgCompGap = gradeStores.length > 0
        ? Math.round(gradeStores.reduce((sum, s) => sum + s.competitiveGapScore, 0) / gradeStores.length)
        : 0;
      const upliftCr = gradeStores.reduce((sum, s) => {
        const twin = storeTwinAnalyses.find((t) => t.storeId === s.id);
        return sum + (twin?.revenueUpliftMonthly || 0) * 12;
      }, 0) / 10000000;
      const reclassPending = gradeStores.filter((s) => s.hasReclassificationTrigger).length;

      return {
        label: cfg.omLabel,
        storeCount,
        totalArea,
        meanSpsf,
        meanGmrof,
        revenueCr: revenueCr.toFixed(1),
        ragStatus,
        spsfTarget: spsfTarget?.target || 0,
        clusterIds,
        avgCompGap,
        upliftCr: upliftCr.toFixed(0),
        reclassPending,
      };
    });
  }, [stores]);

  return (
    <div className="relative">
      <div className="absolute inset-0 z-10 flex items-start justify-center pt-48 bg-white/60 rounded-lg">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <Settings2 className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-sm font-semibold text-gray-500">Coming Soon</p>
          <p className="text-xs text-gray-400 mt-1">Module configuration is under development</p>
        </div>
      </div>
    <div className="space-y-4 pointer-events-none select-none opacity-40 grayscale">
      <PageHeader
        title="Store Grades"
        actions={
          <span className="text-sm text-gray-500">
            {filteredStores.length} store{filteredStores.length !== 1 ? 's' : ''}
          </span>
        }
      />

      {/* Grade Summary Cards */}
      <MetricGrid columns={4}>
        {gradeSummaries.map((gs) => (
          <div key={gs.label} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{gs.label}</span>
              <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full', ragColorClasses[gs.ragStatus])}>
                <KpiLabel abbr="SPSF" />
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-gray-900">{gs.storeCount}</span>
                <span className="text-xs text-gray-500">stores</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Total Area</span>
                <span className="font-medium text-gray-700 tabular-nums">{gs.totalArea.toLocaleString(getFormattingConfig().locale)} SFT</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Mean <KpiLabel abbr="SPSF" /></span>
                <span className="font-medium text-gray-700 tabular-nums flex items-center gap-1.5">
                  <span className={cn('w-1.5 h-1.5 rounded-full', ragDotClasses[gs.ragStatus])} />
                  {getCurrencySymbol()}{gs.meanSpsf}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Mean <KpiLabel abbr="GMROF" /></span>
                <span className="font-medium text-gray-700 tabular-nums">{getCurrencySymbol()}{gs.meanGmrof}/SFT</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Revenue</span>
                <span className="font-medium text-gray-700 tabular-nums">{getCurrencySymbol()}{gs.revenueCr} Cr</span>
              </div>

              {/* Intelligence additions */}
              <div className="border-t border-gray-100 pt-2 mt-2 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Clusters</span>
                  <span className="font-medium text-gray-700">{gs.clusterIds.join(', ')}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Avg Comp.Gap</span>
                  <span className="font-medium text-gray-700 tabular-nums">{gs.avgCompGap}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Uplift</span>
                  <span className="font-medium text-emerald-600 tabular-nums">{getCurrencySymbol()}{gs.upliftCr} Cr</span>
                </div>
                {gs.reclassPending > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Reclass.</span>
                    <span className="font-medium text-amber-600 tabular-nums flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {gs.reclassPending} pending
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </MetricGrid>

      {/* Filter pills: Region + Cluster */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500">Region</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleRegionFilter('all')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                regionFilter === 'all'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              All
            </button>
            {availableRegions.map((r) => (
              <button
                key={r}
                onClick={() => handleRegionFilter(r)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  regionFilter === r
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500">Cluster</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleClusterFilter('all')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                clusterFilter === 'all'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              All
            </button>
            {availableClusters.map((c) => (
              <button
                key={c.id}
                onClick={() => handleClusterFilter(c.id)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  clusterFilter === c.id
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {c.id}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Store table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left text-xs font-medium text-gray-500 pb-3">Store Name</th>
              <th className="text-left text-xs font-medium text-gray-500 pb-3">City</th>
              <th className="text-left text-xs font-medium text-gray-500 pb-3">Region</th>
              <th className="text-right text-xs font-medium text-gray-500 pb-3">Carpet Area</th>
              <th className="text-right text-xs font-medium text-gray-500 pb-3"><KpiLabel abbr="SPSF" /></th>
              <th className="text-right text-xs font-medium text-gray-500 pb-3">Target</th>
              <th className="text-right text-xs font-medium text-gray-500 pb-3">Gap</th>
              <th className="text-right text-xs font-medium text-gray-500 pb-3"><KpiLabel abbr="GMROF" /></th>
              {/* Intelligence columns */}
              <th className="text-left text-xs font-medium text-gray-500 pb-3">Cluster</th>
              <th className="text-right text-xs font-medium text-gray-500 pb-3">Comp. Gap</th>
              <th className="text-right text-xs font-medium text-gray-500 pb-3">Catch. Score</th>
              <th className="text-right text-xs font-medium text-gray-500 pb-3">Twin Gap</th>
              <th className="text-center text-xs font-medium text-gray-500 pb-3">Reclass.</th>
              <th className="text-left text-xs font-medium text-gray-500 pb-3 w-32">Grade</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.length === 0 ? (
              <tr><td colSpan={9}><EmptyState description="No stores to display" /></td></tr>
            ) : pageItems.map((store) => {
              const profile = storeSpaceProfiles.find((p) => p.storeId === store.id);
              const spsfTarget = getSpsfTargetForGrade(store.grade);
              const spsf = profile?.spsf || 0;
              const gap = spsfTarget ? spsf - spsfTarget.target : 0;
              const ragStatus = spsfTarget ? getSpsfRagStatus(spsf, spsfTarget) : 'green';

              return (
                <tr
                  key={store.id}
                  className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                >
                  <td className="py-3 text-sm font-medium text-gray-900">{store.name}</td>
                  <td className="py-3 text-sm text-gray-700">{store.city}</td>
                  <td className="py-3 text-sm text-gray-700">{store.region}</td>
                  <td className="py-3 text-sm text-gray-700 text-right tabular-nums">
                    {profile ? profile.carpetArea.toLocaleString(getFormattingConfig().locale) : '—'}
                  </td>
                  <td className="py-3 text-right">
                    <span className="text-sm font-medium tabular-nums inline-flex items-center gap-1">
                      <span className={cn('w-1.5 h-1.5 rounded-full', ragDotClasses[ragStatus])} />
                      {getCurrencySymbol()}{spsf}
                    </span>
                  </td>
                  <td className="py-3 text-sm text-gray-500 text-right tabular-nums">
                    {getCurrencySymbol()}{spsfTarget?.target || '—'}
                  </td>
                  <td className="py-3 text-right">
                    <span className={cn(
                      'text-xs font-semibold px-1.5 py-0.5 rounded tabular-nums',
                      ragColorClasses[ragStatus]
                    )}>
                      {gap >= 0 ? '+' : ''}{gap}
                    </span>
                  </td>
                  <td className="py-3 text-sm text-gray-700 text-right tabular-nums">
                    {getCurrencySymbol()}{profile?.gmrof || '—'}
                  </td>
                  {/* Intelligence columns */}
                  <td className="py-3">
                    <span className="text-xs font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                      {store.cluster}
                    </span>
                    <span className="text-xs text-gray-500 ml-1">{store.clusterLabel.split(' ').slice(0, 2).join(' ')}</span>
                  </td>
                  <td className="py-3 text-right">
                    <span className="text-sm tabular-nums inline-flex items-center gap-1">
                      <span className={cn('w-1.5 h-1.5 rounded-full', gapScoreColor(store.competitiveGapScore))} />
                      {store.competitiveGapScore}
                    </span>
                  </td>
                  <td className="py-3 text-sm text-gray-700 text-right tabular-nums">
                    {store.catchmentAffluence}
                  </td>
                  <td className="py-3 text-right">
                    <span className={cn(
                      'text-xs font-semibold tabular-nums',
                      store.twinGapSpsf > 100 ? 'text-red-600' : store.twinGapSpsf > 50 ? 'text-amber-600' : 'text-emerald-600'
                    )}>
                      +{getCurrencySymbol()}{store.twinGapSpsf}
                    </span>
                  </td>
                  <td className="py-3 text-center">
                    {store.hasReclassificationTrigger ? (
                      reclassDecisions[store.id] ? (
                        <span className={cn(
                          'inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded',
                          reclassDecisions[store.id] === 'accepted' ? 'text-emerald-600 bg-emerald-50' :
                          reclassDecisions[store.id] === 'rejected' ? 'text-red-600 bg-red-50' :
                          'text-blue-600 bg-blue-50'
                        )}>
                          {reclassDecisions[store.id] === 'accepted' ? <Check className="w-3 h-3" /> :
                           reclassDecisions[store.id] === 'rejected' ? <X className="w-3 h-3" /> :
                           <Clock className="w-3 h-3" />}
                          {reclassDecisions[store.id] === 'accepted' ? 'Accepted' :
                           reclassDecisions[store.id] === 'rejected' ? 'Rejected' : 'Deferred'}
                        </span>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedReclassStore(store.id); }}
                          className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 hover:text-amber-800 transition-colors"
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Review
                        </button>
                      )
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <Select
                        value={store.grade}
                        onValueChange={(val) => updateStoreGrade(store.id, val as StoreGrade)}
                      >
                        <SelectTrigger size="sm" className="w-24 bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {gradeOptions.map((g) => (
                            <SelectItem key={g} value={g}>
                              {g}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Badge variant={gradeBadgeVariant(store.grade)} size="sm">
                        {store.grade}
                      </Badge>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={totalItems}
          pageSize={pageSize}
        />
      </div>

      {/* Reclassification Detail Panel */}
      {selectedReclassStore && (() => {
        const store = stores.find((s) => s.id === selectedReclassStore);
        const trigger = reclassificationTriggers.find((t) => t.storeId === selectedReclassStore);
        const twin = storeTwinAnalyses.find((t) => t.storeId === selectedReclassStore);
        if (!store || !trigger) return null;

        return (
          <div className="bg-white rounded-lg border border-amber-200 shadow-sm p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <h3 className="text-sm font-semibold text-gray-900">Reclassification Review — {store.name}</h3>
                </div>
                <p className="text-xs text-gray-500">Trigger detected: {new Date(trigger.detectedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              </div>
              <button onClick={() => setSelectedReclassStore(null)} className="text-gray-400 hover:text-gray-600" aria-label="Close reclassification review">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs font-medium text-gray-500 uppercase mb-2">Trigger Details</p>
                <div className="space-y-1.5 text-xs text-gray-600">
                  <div className="flex justify-between">
                    <span>Type</span>
                    <span className="font-medium text-gray-900 capitalize">{trigger.triggerType.replace(/-/g, ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Description</span>
                    <span className="font-medium text-gray-900 text-right max-w-[60%]">{trigger.description}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Current Grade</span>
                    <Badge variant="secondary" className="text-xs">{trigger.currentGrade}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Recommended Grade</span>
                    <Badge variant="default" className="text-xs">{trigger.recommendedGrade}</Badge>
                  </div>
                  {trigger.recommendedCluster && (
                    <div className="flex justify-between">
                      <span>Recommended Cluster</span>
                      <span className="font-medium text-gray-900">{trigger.currentCluster} → {trigger.recommendedCluster}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs font-medium text-gray-500 uppercase mb-2">Supporting Evidence</p>
                <div className="space-y-1.5 text-xs text-gray-600">
                  <div className="flex justify-between">
                    <span>Current <KpiLabel abbr="SPSF" /></span>
                    <span className="font-medium text-gray-900 tabular-nums">{getCurrencySymbol()}{storeSpaceProfiles.find((p) => p.storeId === store.id)?.spsf ?? '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Competitive Gap</span>
                    <span className="font-medium text-gray-900 tabular-nums">{store.competitiveGapScore}/100</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Catchment Affluence</span>
                    <span className="font-medium text-gray-900 tabular-nums">{store.catchmentAffluence}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Twin Gap</span>
                    <span className="font-medium text-red-600 tabular-nums">+{getCurrencySymbol()}{store.twinGapSpsf}</span>
                  </div>
                  {twin && (
                    <div className="flex justify-between">
                      <span>Monthly Uplift</span>
                      <span className="font-medium text-emerald-600 tabular-nums">{getCurrencySymbol()}{(twin.revenueUpliftMonthly / 100000).toFixed(1)} L</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
              <Button
                size="sm"
                onClick={() => handleReclassAction(selectedReclassStore, 'accepted')}
              >
                <Check className="w-3.5 h-3.5 mr-1" />
                Accept Reclassification
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleReclassAction(selectedReclassStore, 'rejected')}
              >
                <X className="w-3.5 h-3.5 mr-1" />
                Reject
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleReclassAction(selectedReclassStore, 'deferred')}
              >
                <Clock className="w-3.5 h-3.5 mr-1" />
                Defer to Next Quarter
              </Button>
            </div>
          </div>
        );
      })()}
    </div>
    </div>
  );
}
