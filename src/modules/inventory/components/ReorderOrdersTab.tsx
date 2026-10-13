import { useMemo, useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { cn, formatDateTime } from '@/lib/utils';
import {
  Button,
  Badge,
  Input,
  FilterSelect,
  Pagination,
  ShimmerTable,
  EmptyState,
} from '@/components/ui';
import {
  fetchReorderRuns,
  fetchReorders,
  reorderKeys,
  type ReorderOrderRow,
} from '../api/inventoryApi';

type OrderType = 'STO' | 'PO';
const PAGE_SIZE = 50;

interface Column {
  key: keyof ReorderOrderRow;
  label: string;
  numeric?: boolean;
}

// Shared identity/analytics columns shown for both PO and STO.
const SHARED_COLS: Column[] = [
  { key: 'style_id', label: 'Style' },
  { key: 'option_code', label: 'Option' },
  { key: 'sap_color', label: 'Color' },
  { key: 'size', label: 'Size' },
  { key: 'segment', label: 'Segment' },
  { key: 'brand', label: 'Brand' },
  { key: 'brick', label: 'Brick' },
  { key: 'material_description', label: 'Description' },
  { key: 'qty', label: 'Qty', numeric: true },
  { key: 'priority', label: 'Priority' },
  { key: 'ros', label: 'RoS', numeric: true },
];

const STO_COLS: Column[] = [
  { key: 'source_desc', label: 'Source (DC)' },
  { key: 'dest_desc', label: 'Destination (Store)' },
  { key: 'str_days', label: 'STR', numeric: true },
  { key: 'inventory_position', label: 'Inv Position', numeric: true },
  { key: 'in_transit_qty', label: 'In-Transit', numeric: true },
  { key: 'target_day_cover', label: 'Target Cover', numeric: true },
  { key: 'delivery_date', label: 'Delivery' },
];

const PO_COLS: Column[] = [
  { key: 'source_desc', label: 'Vendor' },
  { key: 'dest_desc', label: 'Dest (DC)' },
  { key: 'inventory_position', label: 'DC Stock', numeric: true },
  { key: 'sto_shipped_out', label: 'STO Shipped', numeric: true },
  { key: 'mrp', label: 'MRP', numeric: true },
  { key: 'costing', label: 'Costing', numeric: true },
  { key: 'otb_number', label: 'OTB' },
  { key: 'delivery_date', label: 'Delivery' },
];

const PRIORITY_OPTIONS = [
  { value: '__all__', label: 'All Priorities' },
  { value: 'P1', label: 'P1' },
  { value: 'P2', label: 'P2' },
  { value: 'P3', label: 'P3' },
  { value: 'P4', label: 'P4' },
];

function fmtCell(row: ReorderOrderRow, col: Column): string {
  const v = row[col.key];
  if (v === null || v === undefined || v === '') return '-';
  if (col.numeric && typeof v === 'number') {
    return Number.isInteger(v) ? v.toLocaleString('en-IN') : v.toFixed(2);
  }
  return String(v);
}

export function ReorderOrdersTab(): React.ReactNode {
  const [orderType, setOrderType] = useState<OrderType>('STO');
  const [runId, setRunId] = useState<string>('__latest__');
  const [priority, setPriority] = useState<string>('__all__');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);

  const { data: runsData } = useQuery({
    queryKey: reorderKeys.runs(),
    queryFn: fetchReorderRuns,
    staleTime: 5 * 60 * 1000,
  });

  const runOptions = useMemo(() => {
    const runs = runsData?.items ?? [];
    return [
      { value: '__latest__', label: 'Latest run' },
      ...runs.map((r) => ({
        value: r.run_id,
        label: `${r.generated_at ? formatDateTime(r.generated_at) : r.run_id.slice(0, 8)} · STO ${r.sto_count} / PO ${r.po_count}`,
      })),
    ];
  }, [runsData]);

  const filters = {
    order_type: orderType,
    run_id: runId === '__latest__' ? undefined : runId,
    priority: priority === '__all__' ? undefined : priority,
    search: searchInput.trim() || undefined,
    page,
    page_size: PAGE_SIZE,
  };

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: reorderKeys.list(filters),
    queryFn: () => fetchReorders(filters),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.total_pages ?? 1;
  const columns = useMemo(
    () => [...SHARED_COLS, ...(orderType === 'STO' ? STO_COLS : PO_COLS)],
    [orderType],
  );

  const resetPage = <T,>(setter: (v: T) => void) => (v: T) => { setter(v); setPage(1); };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {/* PO/STO toggle */}
        <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden" role="tablist" aria-label="Order type">
          {(['STO', 'PO'] as OrderType[]).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={orderType === t}
              onClick={() => { setOrderType(t); setPage(1); }}
              className={cn(
                'px-4 py-1.5 text-sm font-medium transition-colors',
                orderType === t ? 'bg-primary text-white' : 'bg-white text-gray-600 hover:bg-gray-50',
              )}
            >
              {t === 'STO' ? 'STO (DC → Store)' : 'PO (Vendor → DC)'}
            </button>
          ))}
        </div>

        <FilterSelect
          value={runId}
          onChange={resetPage(setRunId)}
          options={runOptions}
          placeholder="Run"
          className="w-full sm:w-auto min-w-[220px]"
        />
        <FilterSelect
          value={priority}
          onChange={resetPage(setPriority)}
          options={PRIORITY_OPTIONS}
          placeholder="Priority"
          className="w-full sm:w-auto"
        />
        <Input
          value={searchInput}
          onChange={(e) => { setSearchInput(e.target.value); setPage(1); }}
          placeholder="Search style / option / EAN / store…"
          className="w-full sm:w-72"
          aria-label="Search reorder orders"
        />
        {isFetching && <span className="text-xs text-gray-400">Loading…</span>}
      </div>

      {/* Table */}
      {isLoading ? (
        <ShimmerTable rows={8} />
      ) : isError ? (
        <div className="flex flex-col items-center gap-3 py-10">
          <p className="text-sm text-gray-500">Failed to load reorder orders.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="No reorder orders"
          description={`No ${orderType} lines found for this run.`}
        />
      ) : (
        <>
          <div className="overflow-x-auto -mx-3 px-3">
            <table className="min-w-[900px] w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  {columns.map((c) => (
                    <th
                      key={String(c.key)}
                      className={cn(
                        'px-3 py-2 text-xs uppercase text-gray-500 font-medium whitespace-nowrap',
                        c.numeric ? 'text-right' : 'text-left',
                      )}
                    >
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((row, idx) => (
                  <tr key={`${row.ean_number}-${row.dest_code}-${idx}`} className="border-b border-gray-100 hover:bg-gray-50">
                    {columns.map((c) => (
                      <td
                        key={String(c.key)}
                        className={cn(
                          'px-3 py-2.5 text-sm text-gray-700 whitespace-nowrap tabular-nums',
                          c.numeric ? 'text-right' : 'text-left',
                        )}
                      >
                        {c.key === 'priority' && row.priority ? (
                          <Badge size="sm" variant="default">{row.priority}</Badge>
                        ) : (
                          fmtCell(row, c)
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={total}
            pageSize={PAGE_SIZE}
          />
        </>
      )}
    </div>
  );
}
