/* eslint-disable design-system/prefer-section-header */
import { useState, useCallback, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  PageHeader,
  Button,
  Badge,
  Card,
  EmptyState,
  DataTable,
  DataTableHeader,
  DataTableBody,
  DataTableRow,
  DataTableHead,
  DataTableCell,
  MetricGrid,
  MetricCard,
  FilterBar,
  FilterSearch,
  FilterMultiSelect,
  FilterClear,
  ShimmerTable,
  Pagination,
} from '@/components/ui';
import {
  ArrowLeft,
  Store,
  Package,
  Download,
  TruckIcon,
  Send,
} from 'lucide-react';
import {debounce, getCurrencySymbol} from '@/lib/utils';
import { useToast } from '@/hooks/useToast';
import { useModulePermissions } from '@/permissions';
import {
  useDpAllocations,
  useDpAllocationFilters,
  useDownloadDpAllocations,
  useSendToProcuro,
} from '../api/dpHooks';

// ── Format helpers ───────────────────────────────────────────────────

function formatQty(value: number): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)} K`;
  return value.toLocaleString();
}

function formatValue(value: number): string {
  if (value >= 10000000) return `${getCurrencySymbol()}${(value / 10000000).toFixed(1)} Cr`;
  if (value >= 100000) return `${getCurrencySymbol()}${(value / 100000).toFixed(1)} L`;
  return `${getCurrencySymbol()}${value.toLocaleString()}`;
}

// ── Status badge helper ──────────────────────────────────────────────

const DP_STATUS_BADGE: Record<string, { variant: 'default' | 'info' | 'success' | 'warning' | 'destructive' | 'secondary'; label: string }> = {
  draft: { variant: 'secondary', label: 'Draft' },
  engine_running: { variant: 'info', label: 'Engine Running' },
  engine_failed: { variant: 'destructive', label: 'Engine Failed' },
  dp_generated: { variant: 'info', label: 'DP Generated' },
  approved: { variant: 'success', label: 'Approved' },
  rejected: { variant: 'destructive', label: 'Rejected' },
  submitted_to_procuro: { variant: 'success', label: 'DP Submitted' },
  procuro_acknowledged: { variant: 'success', label: 'DP Acknowledged' },
  po_created: { variant: 'success', label: 'PO Created' },
  executed: { variant: 'success', label: 'Executed' },
};

function formatStatusLabel(status: string): string {
  const parts = status.split('_');
  if (parts.length <= 1) return status;
  return parts.map((w, i) => i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w).join(' ');
}

function getDpStatusBadge(status: string): { variant: 'default' | 'info' | 'success' | 'warning' | 'destructive' | 'secondary'; label: string } {
  return DP_STATUS_BADGE[status] ?? { variant: 'default', label: formatStatusLabel(status) };
}

// ── Main Component ───────────────────────────────────────────────────

export function DistributionPlanDetailPageV5() {
  const navigate = useNavigate();
  const { id: dpPlanId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const runId = searchParams.get('runId');
  const dropNumber = searchParams.get('dropNumber');

  const { edit: canEdit } = useModulePermissions('dp');

  // Pagination (local state — drives query key)
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [storeFilter, setStoreFilter] = useState('all');
  const [styleFilter, setStyleFilter] = useState('all');
  const [purchaseGroupFilter, setPurchaseGroupFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Debounced search
  const debouncedSetSearch = useMemo(
    () => debounce((value: string) => {
      setSearchQuery(value);
      setPage(1);
    }, 300),
    [],
  );

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    debouncedSetSearch(value);
  }, [debouncedSetSearch]);

  const hasActiveFilters = searchTerm !== '' || storeFilter !== 'all' || styleFilter !== 'all' || purchaseGroupFilter !== 'all' || priorityFilter !== 'all';

  const handleClearFilters = useCallback(() => {
    setSearchTerm('');
    setSearchQuery('');
    setStoreFilter('all');
    setStyleFilter('all');
    setPurchaseGroupFilter('all');
    setPriorityFilter('all');
    setPage(1);
  }, []);

  // Build API params from filter state
  const queryParams = useMemo((): Record<string, string | number | undefined> => {
    const params: Record<string, string | number | undefined> = {
      page,
      page_size: pageSize,
    };
    if (dropNumber) params.drop_number = Number(dropNumber);
    if (storeFilter !== 'all') params.store_code = storeFilter;
    if (styleFilter !== 'all') params.style_id = styleFilter;
    if (purchaseGroupFilter !== 'all') params.purchase_group = purchaseGroupFilter;
    if (priorityFilter !== 'all') params.priority = priorityFilter;
    if (searchQuery.trim()) params.search = searchQuery.trim();
    return params;
  }, [page, pageSize, dropNumber, storeFilter, styleFilter, purchaseGroupFilter, priorityFilter, searchQuery]);

  // ── React Query hooks ──────────────────────────────────────────────

  const {
    data: planData,
    isLoading,
    isFetching,
    error: allocationsError,
  } = useDpAllocations(dpPlanId ?? '', queryParams);

  const { data: allocationFilters } = useDpAllocationFilters(dpPlanId ?? '');

  const toast = useToast();
  const downloadMutation = useDownloadDpAllocations();
  const sendToProcuroMutation = useSendToProcuro();

  // ── Derived data ───────────────────────────────────────────────────

  const allocations = planData?.allocations ?? [];
  const pagination = planData?.pagination ?? { page: 1, page_size: pageSize, total_records: 0, total_pages: 1 };

  // ── Filter change handlers (reset to page 1) ──────────────────────

  const handleStoreFilterChange = useCallback((value: string) => {
    setStoreFilter(value);
    setPage(1);
  }, []);

  const handleStyleFilterChange = useCallback((value: string) => {
    setStyleFilter(value);
    setPage(1);
  }, []);

  const handlePurchaseGroupFilterChange = useCallback((value: string) => {
    setPurchaseGroupFilter(value);
    setPage(1);
  }, []);

  const handlePriorityFilterChange = useCallback((value: string) => {
    setPriorityFilter(value);
    setPage(1);
  }, []);

  // ── Page handlers ─────────────────────────────────────────────────

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1);
  };

  const handleDownload = useCallback(() => {
    if (!dpPlanId) return;
    const params: Record<string, string | number | undefined> = {};
    if (dropNumber) params.drop_number = Number(dropNumber);
    if (storeFilter !== 'all') params.store_code = storeFilter;
    if (styleFilter !== 'all') params.style_id = styleFilter;
    if (purchaseGroupFilter !== 'all') params.purchase_group = purchaseGroupFilter;
    if (priorityFilter !== 'all') params.priority = priorityFilter;
    if (searchQuery.trim()) params.search = searchQuery.trim();

    downloadMutation.mutate({ dpPlanId, params });
  }, [dpPlanId, dropNumber, storeFilter, styleFilter, purchaseGroupFilter, priorityFilter, searchQuery, downloadMutation]);

  const handleSendToProcuro = useCallback(() => {
    if (!runId) return;
    const params = dropNumber ? { drop_number: Number(dropNumber) } : undefined;
    sendToProcuroMutation.mutate({ runId, params }, {
      onSuccess: () => {
        toast.success('Successfully submitted to Procuro');
      },
      onError: (err) => {
        const message = err instanceof Error ? err.message : 'Failed to submit to Procuro';
        toast.error(message);
      },
    });
  }, [runId, dropNumber, sendToProcuroMutation, toast]);

  // Determine error message
  const errorMessage = allocationsError instanceof Error
    ? allocationsError.message
    : allocationsError
      ? 'Failed to load allocations'
      : null;

  // 404 state
  if (!isLoading && errorMessage && !planData) {
    return (
      <EmptyState
        description={errorMessage || 'The requested distribution plan could not be found'}
        action={
          <Button onClick={() => navigate('/distribution-plans?tab=brand')} variant="outline">
            <ArrowLeft className="w-4 h-4" />
            Back to Plans
          </Button>
        }
      />
    );
  }

  // Loading state
  if (isLoading && !planData) {
    return (
      <div className="space-y-4">
        <PageHeader
          title="Distribution Plan"
          backTo={{ label: 'Distribution Plans', path: '/distribution-plans?tab=brand' }}
        />
        <ShimmerTable rows={8} />
      </div>
    );
  }

  const statusBadge = planData ? getDpStatusBadge(planData.status) : null;

  return (
    <div className="space-y-4 animate-fadeInUp">
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <button
              onClick={() => navigate('/distribution-plans?tab=brand')}
              className="p-1 -ml-1 rounded hover:bg-gray-100 transition-colors"
              aria-label="Back to Distribution Plans"
            >
              <ArrowLeft className="w-5 h-5 text-gray-500" />
            </button>
            {planData?.display_dp_name ?? planData?.dp_plan_id ?? dpPlanId ?? 'Distribution Plan'}
          </span>
        }
        badges={
          statusBadge ? (
            <Badge variant={statusBadge.variant}>
              {statusBadge.label}
            </Badge>
          ) : undefined
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={downloadMutation.isPending}
            >
              <Download className="w-4 h-4" />
              {downloadMutation.isPending ? 'Downloading...' : 'Download'}
            </Button>
            {canEdit && (
              <Button
                size="sm"
                onClick={handleSendToProcuro}
                disabled={sendToProcuroMutation.isPending || !runId || planData?.status?.toLowerCase() !== 'dp generated'}
              >
                <Send className="w-4 h-4" />
                {sendToProcuroMutation.isPending ? 'Submitting...' : 'Submit DP'}
              </Button>
            )}
          </div>
        }
      />

      {/* KPI Cards */}
      <MetricGrid columns={4}>
        <MetricCard
          icon={Package}
          label="Total SKUs"
          value={planData?.kpi.total_skus?.toString() ?? '0'}
        />
        <MetricCard
          icon={Store}
          label="Stores Covered"
          value={planData?.kpi.total_stores?.toString() ?? '0'}
        />
        <MetricCard
          icon={Package}
          label="Total Units"
          value={planData ? formatQty(planData.kpi.total_units) : '0'}
        />
        <MetricCard
          icon={TruckIcon}
          label="Total Value"
          value={planData ? formatValue(planData.kpi.total_value) : '₹0'}
        />
      </MetricGrid>

      {/* Allocation Table */}
      <Card>
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-900">Allocation Details</h3>
            </div>
            <div className="text-xs text-gray-500">
              {pagination.total_records} rows
            </div>
          </div>

          <FilterBar>
            <FilterSearch
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Search by SKU, Store, or Variant..."
              className="min-w-[320px]"
            />
            <FilterMultiSelect
              value={storeFilter}
              onChange={handleStoreFilterChange}
              placeholder="Stores"
              options={(allocationFilters?.store_codes ?? []).map(s => ({ value: s, label: s }))}
            />
            <FilterMultiSelect
              value={styleFilter}
              onChange={handleStyleFilterChange}
              placeholder="Style"
              options={(allocationFilters?.style_ids ?? []).map(s => ({ value: s, label: s }))}
            />
            <FilterMultiSelect
              value={purchaseGroupFilter}
              onChange={handlePurchaseGroupFilterChange}
              placeholder="Purchase Group"
              options={(allocationFilters?.purchase_groups ?? []).map(pg => ({ value: pg, label: pg }))}
            />
            <FilterMultiSelect
              value={priorityFilter}
              onChange={handlePriorityFilterChange}
              placeholder="Priority"
              options={(allocationFilters?.priorities ?? []).map(p => ({ value: p, label: p }))}
            />
            {hasActiveFilters && <FilterClear onClear={handleClearFilters} />}
          </FilterBar>

          {isFetching && planData ? (
            <ShimmerTable rows={6} />
          ) : allocations.length === 0 ? (
            <EmptyState
              description="No allocations match your filters"
              className="py-12"
            />
          ) : (
            <div className="overflow-auto max-h-[calc(100vh-360px)]">
              <DataTable>
                <DataTableHeader className="sticky top-0 z-10 bg-gray-50">
                  <DataTableHead>Season</DataTableHead>
                  <DataTableHead>Hit</DataTableHead>
                  <DataTableHead>Style ID</DataTableHead>
                  <DataTableHead>Variant Article Number</DataTableHead>
                  <DataTableHead>Size</DataTableHead>
                  <DataTableHead>Purchase Group</DataTableHead>
                  <DataTableHead>Delivery Date</DataTableHead>
                  <DataTableHead>OTB Number</DataTableHead>
                  <DataTableHead>Store Code</DataTableHead>
                  <DataTableHead>DC Code</DataTableHead>
                  <DataTableHead align="right">Qty</DataTableHead>
                  <DataTableHead>UOM</DataTableHead>
                  <DataTableHead align="right">MRP</DataTableHead>
                  <DataTableHead>Priority</DataTableHead>
                  <DataTableHead align="right">Season Year</DataTableHead>
                </DataTableHeader>
                <DataTableBody>
                  {allocations.map((allocation) => (
                    <DataTableRow key={allocation.id}>
                      <DataTableCell className="font-medium">{allocation.season}</DataTableCell>
                      <DataTableCell>{allocation.hit}</DataTableCell>
                      <DataTableCell className="font-mono text-xs">{allocation.style_id}</DataTableCell>
                      <DataTableCell className="font-mono text-xs">{allocation.variant_article_number}</DataTableCell>
                      <DataTableCell>{allocation.size ?? '-'}</DataTableCell>
                      <DataTableCell>{allocation.purchase_group ?? '-'}</DataTableCell>
                      <DataTableCell>{allocation.delivery_date}</DataTableCell>
                      <DataTableCell>{allocation.otb_number || '-'}</DataTableCell>
                      <DataTableCell className="font-medium">{allocation.store_code}</DataTableCell>
                      <DataTableCell>{allocation.dc_id ?? '-'}</DataTableCell>
                      <DataTableCell align="right">{allocation.qty}</DataTableCell>
                      <DataTableCell>{allocation.uom}</DataTableCell>
                      <DataTableCell align="right">{allocation.mrp.toLocaleString()}</DataTableCell>
                      <DataTableCell>
                        <Badge
                          variant={allocation.priority === 'P1' ? 'default' : 'outline'}
                          size="sm"
                        >
                          {allocation.priority}
                        </Badge>
                      </DataTableCell>
                      <DataTableCell align="right">{allocation.season_year}</DataTableCell>
                    </DataTableRow>
                  ))}
                </DataTableBody>
              </DataTable>
            </div>
          )}

          {/* Pagination */}
          {allocations.length > 0 && (
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.total_pages}
              onPageChange={handlePageChange}
              totalItems={pagination.total_records}
              pageSize={pagination.page_size}
              onPageSizeChange={handlePageSizeChange}
            />
          )}
        </div>
      </Card>
    </div>
  );
}
