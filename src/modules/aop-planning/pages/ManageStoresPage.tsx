import { useState, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Search, Store, Upload } from 'lucide-react';
import {
  PageHeader,
  Button,
  Badge,
  Input,
  EmptyState,
  SectionHeader,
  Pagination,
  usePagination,
  FilterSelect,
  DataTable,
  DataTableHeader,
  DataTableBody,
  DataTableRow,
  DataTableHead,
  DataTableCell,
} from '@/components/ui';
import { cn } from '@/lib/utils';
import { useStores, useSetStoreClosure, useCycles, useGenerate, useAddStore, useAddStoresBulk, useInputs } from '../api/salesPlanHooks';
import type { AddStorePayload } from '../api/salesPlanApi';
import { RemoveStoreDialog } from '../components/RemoveStoreDialog';
import { TempClosureDialog } from '../components/TempClosureDialog';
import { FullClosureDialog } from '../components/FullClosureDialog';
import { RelocationDialog } from '../components/RelocationDialog';
import { AddStoreFromManageDialog, type AddStoreFromManagePayload } from '../components/AddStoreFromManageDialog';
import { BulkAddStoresDialog } from '../components/BulkAddStoresDialog';
import { AopSubNav } from '../components/AopSubNav';

import type { StoreListing, StoreStatus, StoreClassification } from '../types/aopPlanning.types';

type TabValue = 'all' | 'active' | 'new' | 'closed';

const PAGE_SIZE = 10;

const CLASSIFICATION_LABELS: Record<StoreClassification, string> = {
  LFL: 'LFL',
  ANNUALISED: 'Annualised',
  NEW: 'New',
  CLOSURE: 'Closure',
  NON_COMPARABLE: 'Non-comparable',
};

// Store classification (matches the Workspace "Store Types" filter):
//  • Closure    — store is closed (full or temporary)
//  • New        — opening date is in the future
//  • LFL        — open for the entire previous fiscal year and earlier (full PY history)
//  • Annualised — opened during the previous fiscal year (less than a full year of history)
function classifyStore(store: StoreListing, fyStart: number | undefined): StoreClassification {
  // Non-comparable = not operational for all 12 months of the FY (mid-year open, closure,
  // renovation, relocation). Comparable stores are then split into LFL vs Annualised.
  if (!isComparable(store, fyStart)) return 'NON_COMPARABLE';
  const launch = store.startDate ? new Date(store.startDate) : null;
  const hasLaunch = launch !== null && !Number.isNaN(launch.getTime());
  if (fyStart && hasLaunch) {
    const prevFyStart = new Date(Date.UTC(fyStart - 1, 3, 1)); // Apr 1 of the previous fiscal year
    return launch.getTime() <= prevFyStart.getTime() ? 'LFL' : 'ANNUALISED';
  }
  return 'LFL';
}

// Comparable = operational for all 12 months of the FY (opened on/before FY start, active all year).
// Prefer the backend-computed flag; fall back to a local computation for mock data.
function isComparable(store: StoreListing, fyStart: number | undefined): boolean {
  if (store.comparable !== undefined) return store.comparable;
  if (store.status !== 'Active') return false;
  const launch = store.startDate ? new Date(store.startDate) : null;
  const hasLaunch = launch !== null && !Number.isNaN(launch.getTime());
  if (!hasLaunch || !fyStart) return true;
  const fyBegin = new Date(Date.UTC(fyStart, 3, 1)); // Apr 1 of the FY start year
  return launch.getTime() <= fyBegin.getTime();
}

function getStatusVariant(status: StoreStatus): 'success' | 'error' | 'warning' {
  switch (status) {
    case 'Active':
      return 'success';
    case 'Full Closure':
      return 'error';
    case 'Renovation':
      return 'warning';
    case 'Relocation':
      return 'warning';
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

// New = launch date is in the future (flag computed by the backend from stores.launch_date).
function isNewStore(store: StoreListing): boolean {
  if (store.isNew !== undefined) return store.isNew;
  return store.startDate ? new Date(store.startDate).getTime() > Date.now() : false;
}

// Closed = permanently closed. Renovation is a temporary closure (store reopens), so it is
// NOT counted as closed. Relocation is treated as a new store, also not closed.
function isClosedStore(store: StoreListing): boolean {
  return store.status === 'Full Closure';
}

// Active = store is currently operating (not closed).
function isActiveStore(store: StoreListing): boolean {
  return store.status === 'Active';
}

export function ManageStoresPage(): React.ReactNode {
  const { cycleId } = useParams<{ cycleId: string }>();

  // Store data from the API (seeded into local state so closure/remove actions stay responsive).
  const { data: apiStores, isLoading } = useStores(cycleId);
  const setClosure = useSetStoreClosure(cycleId ?? '');
  const generate = useGenerate(cycleId ?? '');
  const addStore = useAddStore(cycleId ?? '');
  const addStoresBulk = useAddStoresBulk(cycleId ?? '');

  // Bound the closure date pickers to the cycle's fiscal year (Apr fy_start – Mar fy_start+1).
  const { data: cyclesData } = useCycles();
  const { data: inputs } = useInputs(cycleId);
  // Channels for the cycle (incl. custom-added) so new stores can be assigned to them.
  const channelOptions = inputs?.channelTargets.map((t) => ({ id: t.channelId, label: t.channelId }));
  const fyStart = cyclesData?.cycles.find((c) => c.id === cycleId)?.fyStartYear;
  const closureMinDate = fyStart ? `${fyStart}-04-01` : undefined;
  const closureMaxDate = fyStart ? `${fyStart + 1}-03-31` : undefined;
  const [storeListings, setStoreListings] = useState<StoreListing[]>([]);
  const [syncedStores, setSyncedStores] = useState<StoreListing[] | null>(null);
  if (apiStores && apiStores !== syncedStores) {
    setSyncedStores(apiStores);
    setStoreListings(apiStores);
  }

  // Filter dropdown options derived from the real store data.
  const storeStates = useMemo(
    () => [...new Set(storeListings.map((s) => s.state).filter(Boolean))].sort(),
    [storeListings],
  );
  const storeCities = useMemo(
    () => [...new Set(storeListings.map((s) => s.city).filter(Boolean))].sort(),
    [storeListings],
  );

  // Filter states
  const [activeTab, setActiveTab] = useState<TabValue>('all');
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('__all__');
  const [cityFilter, setCityFilter] = useState('__all__');
  const [typeFilter, setTypeFilter] = useState('__all__');
  const [statusFilter, setStatusFilter] = useState('__all__');
  const [currentPage, setCurrentPage] = useState(1);

  // Dialog states
  const [removeDialogStore, setRemoveDialogStore] = useState<StoreListing | null>(null);
  const [tempClosureStore, setTempClosureStore] = useState<StoreListing | null>(null);
  const [fullClosureStore, setFullClosureStore] = useState<StoreListing | null>(null);
  const [relocationStore, setRelocationStore] = useState<StoreListing | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);

  // Tab counts
  const tabCounts = useMemo(() => ({
    all: storeListings.length,
    active: storeListings.filter(isActiveStore).length,
    new: storeListings.filter(isNewStore).length,
    closed: storeListings.filter(isClosedStore).length,
  }), [storeListings]);

  // Filtered data
  const filteredStores = useMemo((): StoreListing[] => {
    let result = storeListings;

    // Tab filtering
    if (activeTab === 'active') {
      result = result.filter(isActiveStore);
    } else if (activeTab === 'new') {
      result = result.filter(isNewStore);
    } else if (activeTab === 'closed') {
      result = result.filter(isClosedStore);
    }

    // Dropdown filters
    if (stateFilter !== '__all__') {
      result = result.filter((s) => s.state === stateFilter);
    }
    if (cityFilter !== '__all__') {
      result = result.filter((s) => s.city === cityFilter);
    }
    if (typeFilter !== '__all__') {
      result = result.filter((s) => classifyStore(s, fyStart) === typeFilter);
    }
    if (statusFilter !== '__all__') {
      result = result.filter((s) => s.status === statusFilter);
    }

    // Search
    if (search.trim()) {
      const query = search.trim().toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.code.toLowerCase().includes(query) ||
          s.state.toLowerCase().includes(query) ||
          s.city.toLowerCase().includes(query),
      );
    }

    return result;
  }, [storeListings, activeTab, stateFilter, cityFilter, typeFilter, statusFilter, search, fyStart]);

  // Pagination
  const { totalPages, totalItems, getPageItems } = usePagination(filteredStores, PAGE_SIZE);
  const pageItems = getPageItems(currentPage);

  // Reset page when filters change
  const handleTabChange = useCallback((tab: TabValue) => {
    setActiveTab(tab);
    setCurrentPage(1);
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  }, []);

  // Dialog handlers
  const handleRemoveClick = useCallback((store: StoreListing) => {
    setRemoveDialogStore(store);
  }, []);

  const handleTempClosureChoice = useCallback((store: StoreListing) => {
    setRemoveDialogStore(null);
    setTempClosureStore(store);
  }, []);

  const handleFullClosureChoice = useCallback((store: StoreListing) => {
    setRemoveDialogStore(null);
    setFullClosureStore(store);
  }, []);

  const handleRelocationChoice = useCallback((store: StoreListing) => {
    setRemoveDialogStore(null);
    setRelocationStore(store);
  }, []);

  const handleTempClosureConfirm = useCallback(
    (storeId: string, closeDate: string, reopenDate: string, reason: string) => {
      setStoreListings((prev) =>
        prev.map((s) =>
          s.id === storeId
            ? {
                ...s,
                status: 'Renovation' as StoreStatus,
                closureType: 'temporary' as const,
                closureReason: reason,
                endDate: closeDate,
                reopenDate,
              }
            : s,
        ),
      );
      setClosure.mutate(
        { storeCode: storeId, body: { type: 'temp', closureDate: closeDate, reopenDate, reason } },
        {
          onSuccess: () => generate.mutate(),  // re-seed so the plan reflects the closure
          onError: (e: unknown) => window.alert(e instanceof Error ? e.message : 'Closure failed'),
        },
      );
      setTempClosureStore(null);
    },
    [setClosure, generate],
  );

  const handleFullClosureConfirm = useCallback(
    (storeId: string, endDate: string, reason: string) => {
      setStoreListings((prev) =>
        prev.map((s) =>
          s.id === storeId
            ? {
                ...s,
                status: 'Full Closure' as StoreStatus,
                closureType: 'full' as const,
                closureReason: reason,
                endDate,
                reopenDate: null,
              }
            : s,
        ),
      );
      setClosure.mutate(
        { storeCode: storeId, body: { type: 'full', closureDate: endDate, reason } },
        {
          onSuccess: () => generate.mutate(),  // re-seed so the plan reflects the closure
          onError: (e: unknown) => window.alert(e instanceof Error ? e.message : 'Closure failed'),
        },
      );
      setFullClosureStore(null);
    },
    [setClosure, generate],
  );

  const handleRelocationConfirm = useCallback(
    (storeId: string, relocationDate: string, reason: string) => {
      setStoreListings((prev) =>
        prev.map((s) =>
          s.id === storeId
            ? {
                ...s,
                status: 'Relocation' as StoreStatus,
                closureType: 'relocation' as const,
                closureReason: reason,
                endDate: relocationDate,
                reopenDate: null,
                isNew: true, // relocation → treated as a new store / new site
              }
            : s,
        ),
      );
      setClosure.mutate(
        { storeCode: storeId, body: { type: 'relocation', closureDate: relocationDate, reason } },
        {
          onSuccess: () => generate.mutate(),  // re-seed so the store is planned as new
          onError: (e: unknown) => window.alert(e instanceof Error ? e.message : 'Relocation failed'),
        },
      );
      setRelocationStore(null);
    },
    [setClosure, generate],
  );

  const handleAddStore = useCallback(
    (store: AddStoreFromManagePayload) => {
      // Opening month index in fiscal order (Apr=0 … Mar=11) from the start date.
      const month = store.startDate ? new Date(store.startDate).getMonth() + 1 : 4;
      const openingMonthIndex = month >= 4 ? month - 4 : month + 8;
      addStore.mutate(
        {
          name: store.name,
          storeCode: store.code,
          state: store.state,
          city: store.city,
          channelId: store.channelId,
          category: store.category,
          grade: store.type,
          storeType: store.storeFormat,
          freshDiscountPct: store.freshDiscountPct,
          eossDiscountPct: store.eossDiscountPct,
          openingMonthIndex,
          method: 'reference',
          annualTarget: 0, // backend derives from the reference store's plan NSV
          referenceStoreCode: store.referenceStoreId,
          referenceAdjustmentPct: 100,
        },
        { onError: (e: unknown) => window.alert(e instanceof Error ? e.message : 'Add store failed') },
      );
    },
    [addStore],
  );

  const handleBulkUpload = useCallback(
    (stores: AddStorePayload[]) => {
      addStoresBulk.mutate(stores, {
        onSuccess: (res) => {
          setBulkDialogOpen(false);
          const failedNote = res.failed > 0
            ? `\n${res.failed} row(s) failed:\n${res.errors.map((e) => `• Row ${e.row}: ${e.error}`).join('\n')}`
            : '';
          window.alert(`${res.created} store(s) uploaded.${failedNote}`);
        },
        onError: (e: unknown) => window.alert(e instanceof Error ? e.message : 'Bulk upload failed'),
      });
    },
    [addStoresBulk],
  );

  const tabs: Array<{ value: TabValue; label: string; count: number }> = [
    { value: 'all', label: 'All', count: tabCounts.all },
    { value: 'active', label: 'Active Stores', count: tabCounts.active },
    { value: 'new', label: 'New Stores', count: tabCounts.new },
    { value: 'closed', label: 'Closed Stores', count: tabCounts.closed },
  ];

  return (
    <div className="space-y-4 animate-fadeInUp">
      <PageHeader
        title="Manage Stores"
        backTo={{ label: 'Sales Plan', path: `/sales-plan/workspace/${cycleId ?? 'cycle-1'}` }}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setBulkDialogOpen(true)}
              className="min-h-[44px] md:min-h-0"
            >
              <Upload className="w-4 h-4" />
              Bulk Upload
            </Button>
            <Button onClick={() => setAddDialogOpen(true)} className="min-h-[44px] md:min-h-0">
              <Plus className="w-4 h-4" />
              Add Store
            </Button>
          </div>
        }
      />

      <AopSubNav />

      <div className="bg-white rounded-lg border border-gray-200">
        {/* Section header */}
        <div className="p-4 pb-0">
          <SectionHeader title="Store Listing" />
        </div>

        {/* Filter row */}
        <div className="px-4 pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <FilterSelect
              placeholder="All States"
              value={stateFilter}
              onChange={(v) => { setStateFilter(v); setCurrentPage(1); }}
              options={[{ value: '__all__', label: 'All States' }, ...storeStates.map((s) => ({ value: s, label: s }))]}
              searchable
            />
            <FilterSelect
              placeholder="All Cities"
              value={cityFilter}
              onChange={(v) => { setCityFilter(v); setCurrentPage(1); }}
              options={[{ value: '__all__', label: 'All Cities' }, ...storeCities.map((c) => ({ value: c, label: c }))]}
              searchable
            />
            <FilterSelect
              placeholder="All Types"
              value={typeFilter}
              onChange={(v) => { setTypeFilter(v); setCurrentPage(1); }}
              options={[
                { value: '__all__', label: 'All Types' },
                { value: 'LFL', label: 'LFL' },
                { value: 'ANNUALISED', label: 'Annualised' },
                { value: 'NON_COMPARABLE', label: 'Non-comparable' },
              ]}
            />
            <FilterSelect
              placeholder="All Statuses"
              value={statusFilter}
              onChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}
              options={[
                { value: '__all__', label: 'All Statuses' },
                { value: 'Active', label: 'Active' },
                { value: 'Renovation', label: 'Renovation' },
                { value: 'Relocation', label: 'Relocation' },
                { value: 'Full Closure', label: 'Full Closure' },
              ]}
            />
          </div>
        </div>

        {/* Tab row + search */}
        <div className="px-4 border-b border-gray-200">
          {/* eslint-disable-next-line design-system/prefer-section-header -- tab row with search input, not a section title + actions pattern */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-1 -mb-px overflow-x-auto">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.value;
                return (
                  <button
                    key={tab.value}
                    onClick={() => handleTabChange(tab.value)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap min-h-[44px] md:min-h-0',
                      isActive
                        ? 'border-primary text-primary'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                    )}
                  >
                    {tab.label}
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded-full text-xs',
                        isActive ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-600',
                      )}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="relative w-full md:w-64 mb-3 md:mb-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search via Store, code, state or city"
                value={search}
                onChange={handleSearchChange}
                className="pl-9 text-sm"
                aria-label="Search stores"
              />
            </div>
          </div>
        </div>

        {/* Summary strip */}
        <div className="px-4 pt-3">
          <p className="text-xs text-gray-500 px-1">
            {isLoading && storeListings.length === 0 ? 'Loading stores…' : null}
            {filteredStores.length} stores
            {' '}&middot;{' '}
            {filteredStores.filter((s) => s.status === 'Active').length} active
            {' '}&middot;{' '}
            {filteredStores.filter((s) => s.status === 'Full Closure').length} full closure
            {' '}&middot;{' '}
            {filteredStores.filter((s) => s.status === 'Renovation').length} renovation
            {' '}&middot;{' '}
            {filteredStores.filter((s) => s.status === 'Relocation').length} relocation
          </p>
        </div>

        {/* Table */}
        {filteredStores.length === 0 ? (
          <EmptyState
            icon={Store}
            description="No stores match your current filters"
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setStateFilter('__all__');
                  setCityFilter('__all__');
                  setTypeFilter('__all__');
                  setStatusFilter('__all__');
                  setActiveTab('all');
                  setCurrentPage(1);
                }}
              >
                Clear Filters
              </Button>
            }
          />
        ) : (
          <>
            <DataTable minWidth="900px" className="mt-2">
              <DataTableHeader>
                <DataTableHead>Store</DataTableHead>
                <DataTableHead>Code</DataTableHead>
                <DataTableHead>State</DataTableHead>
                <DataTableHead>City</DataTableHead>
                <DataTableHead>Type</DataTableHead>
                <DataTableHead>Start Date</DataTableHead>
                <DataTableHead>End Date</DataTableHead>
                <DataTableHead>Status</DataTableHead>
                <DataTableHead>Action</DataTableHead>
              </DataTableHeader>
              <DataTableBody>
                {pageItems.map((store) => (
                  <DataTableRow
                    key={store.id}
                    className={cn(
                      store.status === 'Full Closure' && 'bg-red-50/30',
                      store.status === 'Renovation' && 'bg-amber-50/30',
                      store.status === 'Relocation' && 'bg-amber-50/30',
                    )}
                  >
                    <DataTableCell>
                      <span className="font-medium text-gray-900">{store.name}</span>
                    </DataTableCell>
                    <DataTableCell>{store.code}</DataTableCell>
                    <DataTableCell>{store.state}</DataTableCell>
                    <DataTableCell>{store.city}</DataTableCell>
                    <DataTableCell>{CLASSIFICATION_LABELS[classifyStore(store, fyStart)]}</DataTableCell>
                    <DataTableCell>{store.startDate}</DataTableCell>
                    <DataTableCell>{store.endDate ?? '—'}</DataTableCell>
                    <DataTableCell>
                      <Badge variant={getStatusVariant(store.status)} dot>
                        {store.status}
                      </Badge>
                    </DataTableCell>
                    <DataTableCell>
                      {store.status === 'Active' ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 min-h-[44px] md:min-h-0"
                          onClick={() => handleRemoveClick(store)}
                        >
                          Remove
                        </Button>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </DataTableCell>
                  </DataTableRow>
                ))}
              </DataTableBody>
            </DataTable>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={PAGE_SIZE}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>

      {/* Dialogs */}
      <RemoveStoreDialog
        store={removeDialogStore}
        isOpen={removeDialogStore !== null}
        onClose={() => setRemoveDialogStore(null)}
        onTempClosure={handleTempClosureChoice}
        onFullClosure={handleFullClosureChoice}
        onRelocation={handleRelocationChoice}
      />

      <TempClosureDialog
        store={tempClosureStore}
        isOpen={tempClosureStore !== null}
        onClose={() => setTempClosureStore(null)}
        onConfirm={handleTempClosureConfirm}
        minDate={closureMinDate}
        maxDate={closureMaxDate}
      />

      <FullClosureDialog
        store={fullClosureStore}
        isOpen={fullClosureStore !== null}
        onClose={() => setFullClosureStore(null)}
        onConfirm={handleFullClosureConfirm}
        minDate={closureMinDate}
        maxDate={closureMaxDate}
      />

      <RelocationDialog
        store={relocationStore}
        isOpen={relocationStore !== null}
        onClose={() => setRelocationStore(null)}
        onConfirm={handleRelocationConfirm}
        minDate={closureMinDate}
        maxDate={closureMaxDate}
      />

      <AddStoreFromManageDialog
        isOpen={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onAdd={handleAddStore}
        existingStores={storeListings}
        channelOptions={channelOptions}
      />

      <BulkAddStoresDialog
        isOpen={bulkDialogOpen}
        onClose={() => setBulkDialogOpen(false)}
        onUpload={handleBulkUpload}
        isUploading={addStoresBulk.isPending}
      />
    </div>
  );
}
