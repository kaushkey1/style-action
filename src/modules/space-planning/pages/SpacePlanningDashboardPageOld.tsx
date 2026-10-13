import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, AlertTriangle } from 'lucide-react';
import {
  PageHeader,
  FilterBar,
  FilterSearch,
  FilterPills,
  EmptyState,
  Pagination,
  Badge,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui';
import { formatNumber } from '@/lib/utils';
import { MOCK_STORES, STATUS_CONFIG, getPlPool } from '../data/mockSpacePlanningData';
import type { SpacePlanStore, PlanStatus } from '../data/mockSpacePlanningData';

const PAGE_SIZE = 20;

const STATUS_BADGE_VARIANT: Record<PlanStatus, 'outline' | 'warning' | 'info' | 'success'> = {
  not_run: 'outline',
  draft: 'warning',
  review: 'info',
  approved: 'success',
};

const STATUS_PILL_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'review', label: 'Review' },
  { value: 'approved', label: 'Approved' },
];

export default function SpacePlanningDashboardPageOld(): React.ReactNode {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [formatFilter, setFormatFilter] = useState('__all__');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('carpet');
  const [page, setPage] = useState(1);

  const formats = useMemo(() => [...new Set(MOCK_STORES.map((s) => s.format))], []);

  const filtered = useMemo(() => {
    let result = MOCK_STORES;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter((s) =>
        s.name.toLowerCase().includes(q) || s.code.includes(q) || s.city.toLowerCase().includes(q),
      );
    }
    if (formatFilter !== '__all__') {
      result = result.filter((s) => s.format === formatFilter);
    }
    if (statusFilter !== 'all') {
      result = result.filter((s) => s.status === statusFilter);
    }

    result = [...result].sort((a, b) => {
      if (sortBy === 'carpet') return b.carpetArea - a.carpetArea;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'pool') return getPlPool(b.carpetArea, b.assumptions) - getPlPool(a.carpetArea, a.assumptions);
      if (sortBy === 'flags') return b.flagCount - a.flagCount;
      return 0;
    });

    return result;
  }, [search, formatFilter, statusFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const needReviewCount = MOCK_STORES.filter((s) => s.status === 'draft' || s.status === 'review').length;

  const handleRowClick = useCallback((store: SpacePlanStore) => {
    navigate(`/space-planning/old/${store.code}`);
  }, [navigate]);

  return (
    <div className="animate-fadeInUp space-y-4">
      <PageHeader
        title={`Space Planning (Old · Static) — ${needReviewCount} of ${MOCK_STORES.length} stores need review`}
      />

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        {/* Status pills + filters */}
        {/* eslint-disable-next-line design-system/prefer-section-header -- filter bar with pills and search */}
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <FilterPills
              value={statusFilter}
              onChange={(v) => { setStatusFilter(v); setPage(1); }}
              options={STATUS_PILL_OPTIONS}
            />
            <FilterBar className="mb-0">
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
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-28 h-8 text-sm">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="carpet">Carpet ↓</SelectItem>
                  <SelectItem value="pool">PL Pool ↓</SelectItem>
                  <SelectItem value="name">Name A-Z</SelectItem>
                  <SelectItem value="flags">Flags ↓</SelectItem>
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

        {/* Summary strip */}
        <p className="text-xs text-gray-500 mb-3 px-1">
          {filtered.length} stores · {filtered.filter((s) => s.status === 'draft').length} draft · {filtered.filter((s) => s.status === 'review').length} in review · {filtered.filter((s) => s.status === 'approved').length} approved
        </p>

        {/* Table */}
        <div className="overflow-x-auto -mx-4 px-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2.5 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">Store</th>
                <th className="text-left py-2.5 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Format</th>
                <th className="text-right py-2.5 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Carpet (sft)</th>
                <th className="text-right py-2.5 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">PL Pool</th>
                <th className="text-left py-2.5 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-center py-2.5 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Issues</th>
                <th className="w-8 px-1" />
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8">
                    <EmptyState
                      title="No stores match"
                      description="Try adjusting your filters or search"
                      variant="neutral"
                    />
                  </td>
                </tr>
              ) : (
                paginated.map((store) => {
                  const pool = getPlPool(store.carpetArea, store.assumptions);
                  const statusCfg = STATUS_CONFIG[store.status];
                  return (
                    <tr
                      key={store.code}
                      className="border-b border-gray-100 cursor-pointer hover:bg-gray-50/50 transition-colors group"
                      onClick={() => handleRowClick(store)}
                    >
                      <td className="py-3 px-3">
                        <p className="text-sm font-semibold text-gray-900">{store.name}</p>
                        <p className="text-xs text-gray-500">{store.code} · {store.city} · {store.floors} floor{store.floors !== 1 ? 's' : ''}</p>
                      </td>
                      <td className="py-3 px-3 text-sm text-gray-700">{store.format}</td>
                      <td className="py-3 px-3 text-right font-mono text-sm text-gray-900">{formatNumber(store.carpetArea)}</td>
                      <td className="py-3 px-3 text-right font-mono text-sm font-semibold text-gray-900">{formatNumber(pool)}</td>
                      <td className="py-3 px-3">
                        <Badge variant={STATUS_BADGE_VARIANT[store.status]} size="sm" dot>
                          {statusCfg.label}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-center">
                        {store.flagCount > 0 ? (
                          <Badge variant="warning" size="sm">
                            <AlertTriangle className="w-3 h-3 mr-0.5" />{store.flagCount}
                          </Badge>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-1">
                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
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
    </div>
  );
}
