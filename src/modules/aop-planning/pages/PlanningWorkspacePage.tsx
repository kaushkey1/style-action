import { useState, useMemo, useCallback, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  PageHeader,
  Button,
  EmptyState,
  Alert,
  AlertContent,
  AlertTitle,
  AlertDescription,
  FilterSearch,
  FilterSelect,
  ConfirmDialog,
  MetricGrid,
  MetricCard,
} from '@/components/ui';
import { AlertTriangle, Download, FileText, Save, History } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAOPPlanningStore } from '../stores/useAOPPlanningStore';
import {
  useCycles,
  useWorkspace,
  useExceptions,
  useUpdateCell,
  useUpdateChannelCell,
  useStoreCategories,
  useUpdateStoreCategories,
  useUpdateException,
  useStores,
} from '../api/salesPlanHooks';
import { WorkflowStepper } from '../components/WorkflowStepper';
import { CycleStatusBadge } from '../components/CycleStatusBadge';
import { GuardrailChip } from '../components/GuardrailChip';
import { HierarchyGrid } from '../components/HierarchyGrid';
import { QuarterlyHierarchyGrid } from '../components/QuarterlyHierarchyGrid';
import { PriorYearSalesDialog } from '../components/PriorYearSalesDialog';
import { ExceptionsDrawer } from '../components/ExceptionsDrawer';
import { NewStoreProjectionPanel } from '../components/NewStoreProjectionPanel';
import { CategoryAllocationPanel } from '../components/CategoryAllocationPanel';
import { CategoryBreakdownView } from '../components/CategoryBreakdownView';
import { BrickBreakdownView } from '../components/BrickBreakdownView';
import { ChannelVariancePanel } from '../components/ChannelVariancePanel';
import { VersionHistoryDialog } from '../components/VersionHistoryDialog';
import { AopSubNav } from '../components/AopSubNav';
import { CHANNELS } from '../data/mockChannels';
import { STATUS_TO_PHASE } from '../types/aopPlanning.types';
import type { ChannelId, StoreClassification } from '../types/aopPlanning.types';

const CHANNEL_FILTER_OPTIONS = [
  { value: '__all__', label: 'All Channels' },
  ...CHANNELS.map((ch) => ({ value: ch.id, label: ch.label })),
];

const CLASSIFICATION_FILTER_OPTIONS = [
  { value: '__all__', label: 'All Store Types' },
  { value: 'LFL', label: 'LFL' },
  { value: 'ANNUALISED', label: 'Annualised' },
  { value: 'NEW', label: 'New' },
  { value: 'CLOSURE', label: 'Closure' },
];

export function PlanningWorkspacePage(): React.ReactNode {
  const { cycleId } = useParams<{ cycleId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Opening an older revision's detail: `?version=N` loads that version's data.
  const versionParam = searchParams.get('version');
  const viewVersion = versionParam ? parseInt(versionParam, 10) : undefined;

  const cycles = useAOPPlanningStore((s) => s.cycles);
  const gridRows = useAOPPlanningStore((s) => s.gridRows);
  const expandedRowIds = useAOPPlanningStore((s) => s.expandedRowIds);
  const expandedGolyRowIds = useAOPPlanningStore((s) => s.expandedGolyRowIds);
  const exceptions = useAOPPlanningStore((s) => s.exceptions);
  const exceptionsDrawerOpen = useAOPPlanningStore((s) => s.exceptionsDrawerOpen);
  const newStoreProjections = useAOPPlanningStore((s) => s.newStoreProjections);
  const selectedNewStoreId = useAOPPlanningStore((s) => s.selectedNewStoreId);
  const searchQuery = useAOPPlanningStore((s) => s.searchQuery);

  const toggleRowExpanded = useAOPPlanningStore((s) => s.toggleRowExpanded);
  const toggleGolyExpanded = useAOPPlanningStore((s) => s.toggleGolyExpanded);
  const pinCell = useAOPPlanningStore((s) => s.pinCell);
  const toggleExceptionsDrawer = useAOPPlanningStore((s) => s.toggleExceptionsDrawer);
  const selectNewStore = useAOPPlanningStore((s) => s.selectNewStore);
  const setProjectionMethod = useAOPPlanningStore((s) => s.setProjectionMethod);
  const acknowledgeProjection = useAOPPlanningStore((s) => s.acknowledgeProjection);
  const transitionCycleStatus = useAOPPlanningStore((s) => s.transitionCycleStatus);
  const expandAll = useAOPPlanningStore((s) => s.expandAll);
  const collapseAll = useAOPPlanningStore((s) => s.collapseAll);
  const setSearchQuery = useAOPPlanningStore((s) => s.setSearchQuery);
  const selectedStoreForCategory = useAOPPlanningStore((s) => s.selectedStoreForCategory);
  const selectStoreForCategory = useAOPPlanningStore((s) => s.selectStoreForCategory);
  const saveDraft = useAOPPlanningStore((s) => s.saveDraft);
  const isDirty = useAOPPlanningStore((s) => s.isDirty);
  const hydrate = useAOPPlanningStore((s) => s.hydrate);

  // ── Hydrate store from the Sales Plan API ──
  const { data: cyclesData } = useCycles();
  const { data: ws } = useWorkspace(cycleId, viewVersion);
  const { data: excData } = useExceptions(cycleId);
  const apiCycle = cyclesData?.cycles.find((c) => c.id === cycleId);
  const updateCell = useUpdateCell(cycleId ?? '');
  const updateChannelCell = useUpdateChannelCell(cycleId ?? '');
  const updateException = useUpdateException(cycleId ?? '');

  const handleAcknowledgeException = useCallback(
    (exceptionId: string) => {
      updateException.mutate(
        { exceptionId, status: 'acknowledged' },
        { onError: (e: unknown) => window.alert(e instanceof Error ? e.message : 'Update failed') },
      );
    },
    [updateException],
  );

  const handleResolveException = useCallback(
    (exceptionId: string) => {
      updateException.mutate(
        { exceptionId, status: 'resolved' },
        { onError: (e: unknown) => window.alert(e instanceof Error ? e.message : 'Update failed') },
      );
    },
    [updateException],
  );

  useEffect(() => {
    if (apiCycle || ws?.rows || excData) {
      hydrate({ cycle: apiCycle, gridRows: ws?.rows, exceptions: excData });
    }
  }, [apiCycle, ws, excData, hydrate]);

  // Category allocation panel (per store) — id format "st:{channel}:{storeId}".
  const catParts =
    selectedStoreForCategory?.startsWith('st:') ? selectedStoreForCategory.split(':') : null;
  const catChannel = catParts?.[1] ?? '';
  const catStoreId = catParts ? catParts.slice(2).join(':') : null;
  const { data: storeCats } = useStoreCategories(cycleId, catStoreId);
  const updateCats = useUpdateStoreCategories(cycleId ?? '');

  const [showSaved, setShowSaved] = useState(false);
  const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false);
  const [versionDialogOpen, setVersionDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'stores' | 'categories'>('stores');
  const [period, setPeriod] = useState<'monthly' | 'quarterly'>('monthly');
  const [priorYearRowId, setPriorYearRowId] = useState<string | null>(null);
  const [channelFilter, setChannelFilter] = useState<ChannelId | '__all__'>('__all__');
  const [classificationFilter, setClassificationFilter] = useState<StoreClassification | '__all__'>('__all__');
  const [stateFilter, setStateFilter] = useState('__all__');
  const [cityFilter, setCityFilter] = useState('__all__');

  // Store master (same source as Manage Stores) — used for state/city filters and the store count.
  const { data: storeList } = useStores(cycleId);

  // store code → { state, city } from the Manage Stores list (grid store row id = st:{channel}:{code}).
  const storeMetaByCode = useMemo(() => {
    const map = new Map<string, { state: string; city: string }>();
    for (const s of storeList ?? []) {
      map.set(s.code, { state: s.state ?? '', city: s.city ?? '' });
    }
    return map;
  }, [storeList]);

  const stateOptions = useMemo(
    () => [
      { value: '__all__', label: 'All States' },
      ...[...new Set((storeList ?? []).map((s) => s.state).filter(Boolean))]
        .sort()
        .map((v) => ({ value: v, label: v })),
    ],
    [storeList],
  );
  const cityOptions = useMemo(
    () => [
      { value: '__all__', label: 'All Cities' },
      ...[...new Set((storeList ?? []).map((s) => s.city).filter(Boolean))]
        .sort()
        .map((v) => ({ value: v, label: v })),
    ],
    [storeList],
  );

  const cycle = cycles.find((c) => c.id === cycleId);

  const filteredRows = useMemo(() => {
    let rows = gridRows;

    if (channelFilter !== '__all__') {
      rows = rows.filter(
        (r) => r.id === 'total' || r.id === channelFilter || r.channelId === channelFilter,
      );
    }

    if (classificationFilter !== '__all__') {
      rows = rows.filter(
        (r) => r.level !== 'store' || r.storeClassification === classificationFilter,
      );
    }

    const codeOf = (id: string): string => id.split(':').slice(2).join(':');
    if (stateFilter !== '__all__') {
      rows = rows.filter(
        (r) => r.level !== 'store' || storeMetaByCode.get(codeOf(r.id))?.state === stateFilter,
      );
    }
    if (cityFilter !== '__all__') {
      rows = rows.filter(
        (r) => r.level !== 'store' || storeMetaByCode.get(codeOf(r.id))?.city === cityFilter,
      );
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      rows = rows.filter(
        (r) => r.level !== 'store' || r.label.toLowerCase().includes(q),
      );
    }

    return rows;
  }, [gridRows, channelFilter, classificationFilter, stateFilter, cityFilter, storeMetaByCode, searchQuery]);

  const handleCellEdit = useCallback(
    (rowId: string, monthId: string, value: number) => {
      // Store rows have id "st:{channel}:{storeId}" — persist via API (+40% guard).
      if (rowId.startsWith('st:') && cycleId) {
        const [, channel, ...rest] = rowId.split(':');
        const storeId = rest.join(':');
        if (!channel || !storeId) return;
        updateCell.mutate(
          { channel, storeId, monthId, value },
          {
            onError: (err: unknown) => {
              const msg = err instanceof Error ? err.message : 'Edit rejected';
              window.alert(msg);
            },
          },
        );
      } else if (rowId.startsWith('ch:') && cycleId) {
        // Channel rows have id "ch:{channel}". A channel has no stored row, so the edit
        // persists by redistributing to child stores server-side. pinCell runs first for
        // instant horizontal feedback; the mutation reconciles (or rolls back) on refetch.
        const channel = rowId.slice(3);
        if (!channel) return;
        pinCell(rowId, monthId, value);
        updateChannelCell.mutate(
          { channel, monthId, value },
          {
            onError: (err: unknown) => {
              const msg = err instanceof Error ? err.message : 'Edit rejected';
              window.alert(msg);
            },
          },
        );
      } else {
        // Enterprise Total (or no cycle): local pin-and-redistribute only (not persisted).
        pinCell(rowId, monthId, value);
      }
    },
    [pinCell, updateCell, updateChannelCell, cycleId],
  );

  const handlePinCell = useCallback(
    (rowId: string, monthId: string) => {
      const row = gridRows.find((r) => r.id === rowId);
      if (!row) return;
      const cell = row.months.find((m) => m.monthId === monthId);
      if (!cell) return;
      pinCell(rowId, monthId, cell.value);
    },
    [gridRows, pinCell],
  );

  const handleExport = useCallback(() => {
    const monthOrder =
      ws?.months && ws.months.length > 0
        ? ws.months.map((m) => ({ id: m.id, label: m.shortLabel }))
        : (filteredRows[0]?.months ?? []).map((m) => ({ id: m.monthId, label: m.monthId }));

    const escapeCell = (value: string | number): string => {
      const s = String(value);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };

    const header = [
      'Level',
      'Entity',
      'Channel',
      ...monthOrder.map((m) => `${m.label} (Cr)`),
      'FY Total (Cr)',
      'PY Total (Cr)',
      'Growth %',
      'GM %',
    ];

    const lines = filteredRows.map((r) => {
      const valueByMonth = new Map(r.months.map((m) => [m.monthId, m.value]));
      return [
        r.level,
        r.label,
        r.channelId ?? '',
        ...monthOrder.map((m) => (valueByMonth.get(m.id) ?? 0).toFixed(2)),
        r.fyTotal.toFixed(2),
        r.priorYearTotal.toFixed(2),
        r.growthPct.toFixed(1),
        r.gmPct.toFixed(1),
      ]
        .map(escapeCell)
        .join(',');
    });

    const csv = [header.map(escapeCell).join(','), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(cycle?.name ?? 'workspace').replace(/\s+/g, '_')}_workspace.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [filteredRows, ws, cycle?.name]);

  // Month columns (id + label) for the prior-year sales dialog.
  const monthColumns = useMemo(() => {
    if (ws?.months && ws.months.length > 0) {
      return ws.months.map((m) => ({ id: m.id, label: m.shortLabel }));
    }
    const total = gridRows.find((r) => r.id === 'total');
    return (total?.months ?? []).map((m) => ({ id: m.monthId, label: m.monthId }));
  }, [ws, gridRows]);

  if (!cycle) {
    return <EmptyState title="Cycle not found" description="The requested planning cycle does not exist." />;
  }

  // Viewing an older revision's detail: same full view as the latest, but
  // read-only (edits always target the current version).
  const isViewingOldVersion = viewVersion != null && viewVersion !== cycle.version;
  const isReadOnly =
    cycle.status === 'LOCKED' || cycle.status === 'PROMOTED' || isViewingOldVersion;
  const displayVersion = viewVersion ?? cycle.version;
  const phase = STATUS_TO_PHASE[cycle.status];
  const cycleExceptions = exceptions.filter((e) => e.cycleId === cycle.id);
  const hardOpen = cycleExceptions.filter((e) => e.severity === 'hard' && e.status === 'open');
  const softOpen = cycleExceptions.filter((e) => e.severity === 'soft' && e.status === 'open');
  const totalRow = gridRows.find((r) => r.id === 'total');

  // Store count mirrors Manage Stores (same source); fall back to grid rows if unloaded.
  const storeCount = storeList?.length ?? gridRows.filter((r) => r.level === 'store').length;
  const newStoreCount = storeList
    ? storeList.filter((s) => s.isNew).length
    : gridRows.filter((r) => r.isNewStore).length;

  const selectedProjection = selectedNewStoreId
    ? newStoreProjections.find((p) => p.storeId === selectedNewStoreId) ?? null
    : null;


  return (
    <div className="space-y-4">
      <PageHeader
        title={cycle.name}
        backTo={{ label: 'Sales Plan', path: '/sales-plan' }}
        actions={
          <div className="flex items-center gap-2">
            <CycleStatusBadge status={cycle.status} />
            {totalRow && (
              <GuardrailChip
                status={totalRow.guardrailStatus}
                growthPct={totalRow.growthPct}
              />
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setVersionDialogOpen(true)}
              aria-label="View version history"
            >
              <History className="w-4 h-4 mr-1" />
              v{displayVersion}
            </Button>
            <button
              onClick={toggleExceptionsDrawer}
              className={cn(
                'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
                hardOpen.length > 0
                  ? 'text-red-700 bg-red-50'
                  : softOpen.length > 0
                    ? 'text-amber-700 bg-amber-50'
                    : 'text-gray-500 bg-gray-100',
              )}
            >
              <AlertTriangle className="w-3 h-3" />
              {hardOpen.length > 0 && <span>✕{hardOpen.length}</span>}
              {softOpen.length > 0 && <span>⚠{softOpen.length}</span>}
              {hardOpen.length === 0 && softOpen.length === 0 && <span>0</span>}
            </button>
            {!isReadOnly && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    saveDraft();
                    setShowSaved(true);
                    setTimeout(() => setShowSaved(false), 2000);
                  }}
                >
                  <Save className="w-4 h-4 mr-1" />
                  {showSaved ? 'Saved' : isDirty ? 'Save Draft' : 'Saved'}
                </Button>
                <Button
                  size="sm"
                  disabled={hardOpen.length > 0}
                  onClick={() => setSubmitConfirmOpen(true)}
                >
                  Submit
                </Button>
              </>
            )}
          </div>
        }
      />

      <AopSubNav />

      <div className="sticky top-0 z-20 bg-white pb-3 space-y-3">
        <WorkflowStepper currentPhase={phase} status={cycle.status} />

        {isViewingOldVersion ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
              <FileText className="w-4 h-4 text-gray-500" />
              Viewing v{displayVersion} — read-only. The latest version is v{cycle.version}.
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/sales-plan/workspace/${cycleId}`)}
            >
              Back to latest (v{cycle.version})
            </Button>
          </div>
        ) : (
          isReadOnly && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">
                This plan is {cycle.status.toLowerCase()} — read-only mode
              </span>
            </div>
          )
        )}

        {hardOpen.length > 0 && !isReadOnly && (
          <Alert variant="error">
            <AlertContent>
              <AlertTitle>{hardOpen.length} hard exception{hardOpen.length > 1 ? 's' : ''} must be resolved</AlertTitle>
              <AlertDescription>
                Submit is blocked until all hard exceptions are cleared.
                <Button variant="ghost" size="sm" className="ml-2" onClick={toggleExceptionsDrawer}>
                  View exceptions
                </Button>
              </AlertDescription>
            </AlertContent>
          </Alert>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center gap-1 border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('stores')}
              className={cn(
                'px-3 py-1.5 text-xs font-medium transition-colors',
                viewMode === 'stores' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50',
              )}
            >
              Store View
            </button>
            <button
              onClick={() => setViewMode('categories')}
              className={cn(
                'px-3 py-1.5 text-xs font-medium transition-colors',
                viewMode === 'categories' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50',
              )}
            >
              Category View
            </button>
          </div>

          {/* Monthly / Quarterly period toggle (stores grid) */}
          {viewMode === 'stores' && (
            <div className="flex items-center gap-1 border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setPeriod('monthly')}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium transition-colors',
                  period === 'monthly' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50',
                )}
              >
                Monthly
              </button>
              <button
                onClick={() => setPeriod('quarterly')}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium transition-colors',
                  period === 'quarterly' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50',
                )}
              >
                Quarterly
              </button>
            </div>
          )}

          {/* Channel filter */}
          <FilterSelect
            placeholder="All Channels"
            value={channelFilter}
            onChange={(v) => setChannelFilter(v as ChannelId | '__all__')}
            options={CHANNEL_FILTER_OPTIONS}
          />

          {/* Store type filter */}
          {viewMode === 'stores' && (
            <FilterSelect
              placeholder="All Store Types"
              value={classificationFilter}
              onChange={(v) => setClassificationFilter(v as StoreClassification | '__all__')}
              options={CLASSIFICATION_FILTER_OPTIONS}
            />
          )}

          {/* State / City filters */}
          {viewMode === 'stores' && (
            <>
              <FilterSelect
                placeholder="All States"
                value={stateFilter}
                onChange={setStateFilter}
                options={stateOptions}
                searchable
              />
              <FilterSelect
                placeholder="All Cities"
                value={cityFilter}
                onChange={setCityFilter}
                options={cityOptions}
                searchable
              />
            </>
          )}

          {/* Expand/Collapse */}
          {viewMode === 'stores' && (
            <div className="flex items-center gap-1 text-xs">
              <button onClick={expandAll} className="px-2 py-1 text-gray-600 hover:text-gray-900 font-medium">
                Expand All
              </button>
              <span className="text-gray-400">|</span>
              <button onClick={collapseAll} className="px-2 py-1 text-gray-600 hover:text-gray-900 font-medium">
                Collapse
              </button>
            </div>
          )}

          {/* Search */}
          <FilterSearch placeholder="Search stores..." value={searchQuery} onChange={setSearchQuery} />

          {/* Actions */}
          <div className="flex items-center gap-2 ml-auto">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="w-4 h-4 mr-1" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Summary KPIs */}
      {totalRow && (
        <MetricGrid columns={4}>
          <MetricCard label="GSV" value={`₹${totalRow.fyTotal.toFixed(1)} Cr`} />
          <MetricCard label="PY Total" value={`₹${totalRow.priorYearTotal.toFixed(1)} Cr`} />
          <MetricCard label="Growth" value={`${totalRow.growthPct >= 0 ? '+' : ''}${totalRow.growthPct.toFixed(1)}%`} />
          <MetricCard label="Stores" value={`${storeCount} (${newStoreCount} new)`} />
        </MetricGrid>
      )}

      {/* Grid or Category View */}
      {viewMode === 'stores' ? (
        period === 'monthly' ? (
          <HierarchyGrid
            rows={filteredRows}
            expandedRowIds={expandedRowIds}
            expandedGolyRowIds={expandedGolyRowIds}
            isReadOnly={isReadOnly}
            onToggleExpand={toggleRowExpanded}
            onToggleGoly={toggleGolyExpanded}
            onCellEdit={handleCellEdit}
            onPinCell={handlePinCell}
            onSelectNewStore={selectNewStore}
            onEditCategory={selectStoreForCategory}
            onViewPriorYear={setPriorYearRowId}
          />
        ) : (
          <QuarterlyHierarchyGrid
            rows={filteredRows}
            expandedRowIds={expandedRowIds}
            onToggleExpand={toggleRowExpanded}
          />
        )
      ) : (
        <div className="space-y-6">
          {cycleId && <BrickBreakdownView cycleId={cycleId} channel={channelFilter} />}
          <CategoryBreakdownView
            gridRows={gridRows}
            activeChannelId={channelFilter}
          />
        </div>
      )}

      {/* Channel variance: top-down target vs bottom-up (Σ store working) */}
      {cycleId && viewMode === 'stores' && (
        <div className="mt-6">
          <ChannelVariancePanel cycleId={cycleId} />
        </div>
      )}

      {/* Exceptions Drawer */}
      <ExceptionsDrawer
        exceptions={cycleExceptions}
        isOpen={exceptionsDrawerOpen}
        onClose={toggleExceptionsDrawer}
        onAcknowledge={handleAcknowledgeException}
        onResolve={handleResolveException}
        onNavigate={() => {}}
      />

      {/* Last year's sales for a store */}
      <PriorYearSalesDialog
        row={gridRows.find((r) => r.id === priorYearRowId) ?? null}
        monthColumns={monthColumns}
        isOpen={priorYearRowId !== null}
        onClose={() => setPriorYearRowId(null)}
      />

      {/* New Store Projection Panel */}
      {selectedProjection && (
        <NewStoreProjectionPanel
          projection={selectedProjection}
          onMethodChange={(method) => setProjectionMethod(selectedProjection.storeId, method)}
          onAcknowledge={() => acknowledgeProjection(selectedProjection.storeId)}
          onClose={() => selectNewStore(null)}
        />
      )}

      {/* Category Allocation Panel */}
      {catStoreId && storeCats && (
        <CategoryAllocationPanel
          isOpen={!!selectedStoreForCategory}
          onClose={() => selectStoreForCategory(null)}
          storeName={storeCats.storeName}
          fyTotal={storeCats.fyTotal}
          allocations={storeCats.allocations}
          onApply={(updated) => {
            updateCats.mutate(
              {
                storeId: catStoreId,
                channel: catChannel,
                allocations: updated.map((a) => ({ category: a.category, pct: a.pct })),
              },
              {
                onError: (e: unknown) =>
                  window.alert(e instanceof Error ? e.message : 'Apply failed'),
              },
            );
            selectStoreForCategory(null);
          }}
        />
      )}

      {/* Submit Confirmation */}
      <ConfirmDialog
        open={submitConfirmOpen}
        onOpenChange={setSubmitConfirmOpen}
        title="Submit for Review"
        description="This will submit the plan for L1/L2 review. Hard exceptions must be cleared before submission. Continue?"
        confirmLabel="Submit"
        onConfirm={() => {
          transitionCycleStatus(cycle.id, 'SUBMITTED');
          navigate(`/sales-plan/review/${cycle.id}`);
        }}
      />

      {cycleId && (
        <VersionHistoryDialog
          cycleId={cycleId}
          cycleName={cycle.name}
          isOpen={versionDialogOpen}
          onClose={() => setVersionDialogOpen(false)}
        />
      )}
    </div>
  );
}
