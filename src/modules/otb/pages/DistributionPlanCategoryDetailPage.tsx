/* eslint-disable design-system/prefer-section-header */
import { useState, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
import { getMockCategoryDetail } from '../data/mockDpCategoryView';

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

function getDpStatusBadge(status: string): { variant: 'default' | 'info' | 'success' | 'warning' | 'destructive' | 'secondary'; label: string } {
  const parts = status.split('_');
  const fallback = parts.length <= 1 ? status : parts.map((w, i) => i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w).join(' ');
  return DP_STATUS_BADGE[status] ?? { variant: 'default', label: fallback };
}

// ── Main Component ───────────────────────────────────────────────────

export default function DistributionPlanCategoryDetailPage(): React.ReactNode {
  const navigate = useNavigate();
  const { dpPlanId } = useParams<{ dpPlanId: string }>();

  const detail = useMemo(() => getMockCategoryDetail(dpPlanId ?? ''), [dpPlanId]);

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [brandFilter, setBrandFilter] = useState('all');
  const [brickFilter, setBrickFilter] = useState('all');
  const [storeFilter, setStoreFilter] = useState('all');
  const [styleFilter, setStyleFilter] = useState('all');
  const [purchaseGroupFilter, setPurchaseGroupFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

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

  const hasActiveFilters = searchTerm !== '' || brandFilter !== 'all' || brickFilter !== 'all' || storeFilter !== 'all' || styleFilter !== 'all' || purchaseGroupFilter !== 'all' || priorityFilter !== 'all';

  const handleClearFilters = useCallback(() => {
    setSearchTerm('');
    setSearchQuery('');
    setBrandFilter('all');
    setBrickFilter('all');
    setStoreFilter('all');
    setStyleFilter('all');
    setPurchaseGroupFilter('all');
    setPriorityFilter('all');
    setPage(1);
  }, []);

  // Filter options from allocation data
  const filterOptions = useMemo(() => {
    if (!detail) return { brands: [], bricks: [], stores: [], styles: [], purchaseGroups: [], priorities: [] };
    const allocs = detail.allocations;
    const unique = <T,>(arr: T[]): T[] => [...new Set(arr)];
    return {
      brands: unique(allocs.map(a => a.brand).filter((b): b is string => !!b)),
      bricks: unique(allocs.map(a => a.brick).filter((b): b is string => !!b)),
      stores: unique(allocs.map(a => a.store_code)),
      styles: unique(allocs.map(a => a.style_id)),
      purchaseGroups: unique(allocs.map(a => a.purchase_group)),
      priorities: unique(allocs.map(a => a.priority)),
    };
  }, [detail]);

  // Filter + paginate allocations
  const filteredAllocations = useMemo(() => {
    if (!detail) return [];
    return detail.allocations.filter(a => {
      if (brandFilter !== 'all' && a.brand !== brandFilter) return false;
      if (brickFilter !== 'all' && a.brick !== brickFilter) return false;
      if (storeFilter !== 'all' && a.store_code !== storeFilter) return false;
      if (styleFilter !== 'all' && a.style_id !== styleFilter) return false;
      if (purchaseGroupFilter !== 'all' && a.purchase_group !== purchaseGroupFilter) return false;
      if (priorityFilter !== 'all' && a.priority !== priorityFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        if (!a.style_id.toLowerCase().includes(q)
          && !a.store_code.toLowerCase().includes(q)
          && !a.variant_article_number.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [detail, brandFilter, brickFilter, storeFilter, styleFilter, purchaseGroupFilter, priorityFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredAllocations.length / pageSize));
  const pagedAllocations = filteredAllocations.slice((page - 1) * pageSize, page * pageSize);

  const handlePageChange = (newPage: number) => setPage(newPage);
  const handlePageSizeChange = (newPageSize: number) => { setPageSize(newPageSize); setPage(1); };

  // 404 state
  if (!detail) {
    return (
      <EmptyState
        description="The requested distribution plan could not be found"
        action={
          <Button onClick={() => navigate('/distribution-plans')} variant="outline">
            <ArrowLeft className="w-4 h-4" />
            Back to Plans
          </Button>
        }
      />
    );
  }

  const statusBadge = getDpStatusBadge(detail.status);

  return (
    <div className="space-y-4 animate-fadeInUp">
      <PageHeader
        title={detail.display_dp_name}
        backTo={{ label: 'Distribution Plans', path: '/distribution-plans' }}
        badges={
          <Badge variant={statusBadge.variant}>
            {statusBadge.label}
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4" />
              Download
            </Button>
            <Button size="sm" disabled>
              <Send className="w-4 h-4" />
              Submit DP
            </Button>
          </div>
        }
      />

      {/* KPI Cards */}
      <MetricGrid columns={4}>
        <MetricCard
          icon={Package}
          label="Total SKUs"
          value={detail.kpi.total_skus.toString()}
        />
        <MetricCard
          icon={Store}
          label="Stores Covered"
          value={detail.kpi.total_stores.toString()}
        />
        <MetricCard
          icon={Package}
          label="Total Units"
          value={formatQty(detail.kpi.total_units)}
        />
        <MetricCard
          icon={TruckIcon}
          label="Total Value"
          value={formatValue(detail.kpi.total_value)}
        />
      </MetricGrid>

      {/* Allocation Table */}
      <Card>
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Allocation Details</h3>
            <div className="text-xs text-gray-500">
              {filteredAllocations.length} rows
            </div>
          </div>

          <FilterBar>
            <FilterMultiSelect
              value={brandFilter}
              onChange={(v) => { setBrandFilter(v); setPage(1); }}
              placeholder="Brand"
              options={filterOptions.brands.map(b => ({ value: b, label: b }))}
            />
            <FilterMultiSelect
              value={brickFilter}
              onChange={(v) => { setBrickFilter(v); setPage(1); }}
              placeholder="Brick"
              options={filterOptions.bricks.map(b => ({ value: b, label: b }))}
            />
            <FilterMultiSelect
              value={storeFilter}
              onChange={(v) => { setStoreFilter(v); setPage(1); }}
              placeholder="Stores"
              options={filterOptions.stores.map(s => ({ value: s, label: s }))}
            />
            <FilterMultiSelect
              value={styleFilter}
              onChange={(v) => { setStyleFilter(v); setPage(1); }}
              placeholder="Style"
              options={filterOptions.styles.map(s => ({ value: s, label: s }))}
            />
            <FilterMultiSelect
              value={purchaseGroupFilter}
              onChange={(v) => { setPurchaseGroupFilter(v); setPage(1); }}
              placeholder="Purchase Group"
              options={filterOptions.purchaseGroups.map(pg => ({ value: pg, label: pg }))}
            />
            <FilterMultiSelect
              value={priorityFilter}
              onChange={(v) => { setPriorityFilter(v); setPage(1); }}
              placeholder="Priority"
              options={filterOptions.priorities.map(p => ({ value: p, label: p }))}
            />
            {hasActiveFilters && <FilterClear onClear={handleClearFilters} />}
            <FilterSearch
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Search by SKU, Store, or Variant..."
              className="min-w-[280px] ml-auto"
            />
          </FilterBar>

          {pagedAllocations.length === 0 ? (
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
                  <DataTableHead>Destination Code</DataTableHead>
                  <DataTableHead align="right">Qty</DataTableHead>
                  <DataTableHead>UOM</DataTableHead>
                  <DataTableHead align="right">MRP</DataTableHead>
                  <DataTableHead>Priority</DataTableHead>
                  <DataTableHead align="right">Season Year</DataTableHead>
                </DataTableHeader>
                <DataTableBody>
                  {pagedAllocations.map((allocation) => (
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

          {pagedAllocations.length > 0 && (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              totalItems={filteredAllocations.length}
              pageSize={pageSize}
              onPageSizeChange={handlePageSizeChange}
            />
          )}
        </div>
      </Card>
    </div>
  );
}
