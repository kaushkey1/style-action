import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Download, History } from 'lucide-react';
import {
  PageHeader,
  FilterBar,
  FilterSearch,
  EmptyState,
  Pagination,
  Button,
  Skeleton,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui';
import { formatNumber } from '@/lib/utils';
import { STATUS_CONFIG } from '../data/mockSpacePlanningData';
import {
  useV3Stores,
  useV3StoreDetail,
  useSaveSpacePlanVersion,
  formatLabel,
  type V3StoreListItem,
} from '../api/spacePlanningV3Api';
import { VersionHistoryPanel, type HistoryVersionItem } from '../components/VersionHistoryPanel';
import { FormatSummaryCards } from '../components/FormatSummaryCards';

const PAGE_SIZE = 20;

/** Version-history slide-over for a store on the listing — fetches the store
 * detail on demand; Restore posts the selected version's payload as a new one. */
function StoreHistorySheet({ store, onClose }: { store: V3StoreListItem | null; onClose: () => void }): React.ReactNode {
  const code = store?.code;
  const { data: detail, isLoading } = useV3StoreDetail(code);
  const saveMutation = useSaveSpacePlanVersion(code ?? '');

  const versions: HistoryVersionItem[] = (detail?.versions ?? []).map((v) => ({
    version: v.version,
    timestamp: v.timestamp,
    author: v.author,
    summary: v.summary,
    isCurrent: v.isCurrent,
    changes: v.changes ?? [],
    isStale: v.isStale === true,
  }));

  const handleRestore = (versionNum: number): void => {
    const v = detail?.versions.find((x) => x.version === versionNum);
    if (!v || saveMutation.isPending) return;
    saveMutation.mutate({
      summary: `Restored from v${versionNum}`,
      categories: v.payload.categories,
      // legacy positional pod entries can't be restored — keyed entries only
      pods: v.payload.pods.flatMap((p) =>
        p.category && p.podId
          ? [{ category: p.category, podId: p.podId, newSpace: p.newSpace }]
          : [],
      ),
    });
  };

  return (
    <VersionHistoryPanel
      open={!!store}
      onOpenChange={(o) => { if (!o) onClose(); }}
      versions={versions}
      storeLabel={store ? `${store.code} · ${store.name}` : undefined}
      onRestore={detail ? handleRestore : undefined}
      isLoading={isLoading}
    />
  );
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'review', label: 'Review' },
  { value: 'approved', label: 'Approved' },
];

export default function SpacePlanningDashboardPage(): React.ReactNode {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [formatFilter, setFormatFilter] = useState('__all__');
  const [cityFilter, setCityFilter] = useState('__all__');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('carpet');
  const [page, setPage] = useState(1);
  const [historyStore, setHistoryStore] = useState<V3StoreListItem | null>(null);

  const { data, isLoading, isError, refetch } = useV3Stores();
  const stores = useMemo(() => data?.items ?? [], [data]);

  const formats = useMemo(
    () => [...new Set(stores.map((s) => formatLabel(s.format, s.subformat)))].sort(),
    [stores],
  );

  const cities = useMemo(
    () => [...new Set(stores.map((s) => s.city).filter(Boolean))].sort(),
    [stores],
  );

  const filtered = useMemo(() => {
    let result = stores;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter((s) =>
        s.name.toLowerCase().includes(q) || s.code.includes(q) || s.city.toLowerCase().includes(q),
      );
    }
    if (formatFilter !== '__all__') {
      result = result.filter((s) => formatLabel(s.format, s.subformat) === formatFilter);
    }
    if (cityFilter !== '__all__') {
      result = result.filter((s) => s.city === cityFilter);
    }
    if (statusFilter !== 'all') {
      result = result.filter((s) => s.status === statusFilter);
    }

    result = [...result].sort((a, b) => {
      if (sortBy === 'carpet') return b.carpetArea - a.carpetArea;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'pool') return b.plPool - a.plPool;
      return 0;
    });

    return result;
  }, [stores, search, formatFilter, cityFilter, statusFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleRowClick = useCallback((store: V3StoreListItem) => {
    navigate(`/space-planning/${store.code}`);
  }, [navigate]);

  const handleExport = useCallback(() => {
    const esc = (v: string | number): string => {
      const str = String(v ?? '');
      return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
    };
    const header = ['Store Code', 'Store Name', 'Floors', 'City', 'Format', 'Carpet (sqft)', 'PL Pool', 'Status'];
    const rows = filtered.map((s) => [
      s.code,
      s.name,
      s.floors,
      s.city,
      formatLabel(s.format, s.subformat),
      s.carpetArea,
      s.plPool,
      STATUS_CONFIG[s.status].label,
    ].map(esc).join(','));
    const csv = [header.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'space-planning-stores.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, [filtered]);

  return (
    <div className="animate-fadeInUp space-y-4">
      <PageHeader
        title="Space Planning — Store Planner"
        actions={
          <Button size="sm" variant="outline" onClick={handleExport} disabled={filtered.length === 0}>
            <Download className="w-3.5 h-3.5 mr-1" />Export
          </Button>
        }
      />

      {/* Format-wise summary cards (categories + subcategories per format) */}
      <FormatSummaryCards />

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        {/* Status + format + sort filters */}
        {/* eslint-disable-next-line design-system/prefer-section-header -- filter bar with dropdowns and search */}
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <FilterBar className="mb-0">
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                <SelectTrigger className="w-28 h-8 text-sm">
                  {/* Show the filter's name when unfiltered — "All" alone is ambiguous */}
                  <SelectValue placeholder="Status">
                    {statusFilter === 'all' ? 'Status' : STATUS_OPTIONS.find((o) => o.value === statusFilter)?.label}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={formatFilter} onValueChange={(v) => { setFormatFilter(v); setPage(1); }}>
                <SelectTrigger className="w-32 h-8 text-sm">
                  <SelectValue placeholder="Format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Formats</SelectItem>
                  {formats.map((f) => (
                    <SelectItem key={f} value={f}>{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={cityFilter} onValueChange={(v) => { setCityFilter(v); setPage(1); }}>
                <SelectTrigger className="w-32 h-8 text-sm">
                  <SelectValue placeholder="City" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Cities</SelectItem>
                  {cities.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-28 h-8 text-sm">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="carpet">Carpet ↓</SelectItem>
                  <SelectItem value="pool">PL Pool ↓</SelectItem>
                  <SelectItem value="name">Name A-Z</SelectItem>
                </SelectContent>
              </Select>
            </FilterBar>
          </div>
          <FilterSearch
            value={search}
            onChange={(v) => { setSearch(v); setPage(1); }}
            placeholder="Search store or city..."
            className="w-56"
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto -mx-4 px-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2.5 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Store Code</th>
                <th className="text-left py-2.5 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[160px]">Store Name</th>
                <th className="text-center py-2.5 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Floors</th>
                <th className="text-left py-2.5 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">City</th>
                <th className="text-left py-2.5 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Format</th>
                <th className="text-right py-2.5 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Carpet (sft)</th>
                <th className="text-right py-2.5 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">PL Pool</th>
                <th className="w-14 px-1" />
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={`sk-${i}`} className="border-b border-gray-100">
                    <td colSpan={8} className="py-3 px-3"><Skeleton className="h-8 w-full" /></td>
                  </tr>
                ))
              ) : isError ? (
                <tr>
                  <td colSpan={8} className="py-8">
                    <EmptyState
                      title="Failed to load stores"
                      description="Something went wrong fetching space plans."
                      variant="neutral"
                      action={<Button size="sm" onClick={() => refetch()}>Retry</Button>}
                    />
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8">
                    <EmptyState
                      title="No stores match"
                      description="Try adjusting your filters or search"
                      variant="neutral"
                    />
                  </td>
                </tr>
              ) : (
                paginated.map((store) => {
                  const pool = store.plPool;
                  return (
                    <tr
                      key={store.code}
                      className="border-b border-gray-100 cursor-pointer hover:bg-gray-50/50 transition-colors group"
                      onClick={() => handleRowClick(store)}
                    >
                      <td className="py-3 px-3 font-mono text-sm text-gray-900">{store.code}</td>
                      <td className="py-3 px-3 text-sm font-semibold text-gray-900">{store.name}</td>
                      <td className="py-3 px-3 text-center font-mono text-sm text-gray-700">{store.floors}</td>
                      <td className="py-3 px-3 text-sm text-gray-700">{store.city || '—'}</td>
                      <td className="py-3 px-3 text-sm text-gray-700">{formatLabel(store.format, store.subformat)}</td>
                      <td className="py-3 px-3 text-right font-mono text-sm text-gray-900">{formatNumber(store.carpetArea)}</td>
                      <td className="py-3 px-3 text-right font-mono text-sm font-semibold text-gray-900">{formatNumber(pool)}</td>
                      <td className="py-3 px-1">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={(e) => { e.stopPropagation(); setHistoryStore(store); }}
                            className="text-gray-400 hover:text-gray-600 transition-colors p-0.5"
                            aria-label={`View version history for ${store.code}`}
                            title="Version history"
                          >
                            <History className="w-4 h-4" />
                          </button>
                          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="mt-4">
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>

      {/* Version history slide-over (opened from the per-row history icon) */}
      <StoreHistorySheet store={historyStore} onClose={() => setHistoryStore(null)} />
    </div>
  );
}
