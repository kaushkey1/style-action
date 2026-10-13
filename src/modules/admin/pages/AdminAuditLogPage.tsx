import { useState, useMemo } from 'react';
import {
  Download,
  Search,
  CheckCircle2,
  Undo2,
  Circle,
  Settings,
  X,
} from 'lucide-react';
import { Badge, Button, Input, Pagination, usePagination, PageHeader, FilterBar, EmptyState } from '@/components/ui';
import { cn } from '@/lib/utils';
import { useSearch } from '@/hooks/useSearch';
import { useFilters } from '@/hooks/useFilters';
import { auditEntries, type AuditEntry } from '../data/mockAdminData';

const AREA_VALUES = ['All', 'Org', 'Role', 'Group', 'KPI', 'Exception', 'Mobile', 'Baseline', 'Notification'] as const;
const STATUS_VALUES = ['All', 'Published', 'Reverted', 'Draft', 'Auto'] as const;

const areaBadgeVariant: Record<AuditEntry['area'], 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'default' | 'outline'> = {
  Org: 'primary',
  Role: 'info',
  Group: 'secondary',
  KPI: 'success',
  Exception: 'error',
  Mobile: 'warning',
  Baseline: 'default',
  Notification: 'outline',
};

function StatusBadge({ status }: { status: AuditEntry['status'] }) {
  switch (status) {
    case 'Published':
      return (
        <Badge variant="success" size="sm">
          <CheckCircle2 className="w-3 h-3" />
          Published
        </Badge>
      );
    case 'Reverted':
      return (
        <Badge variant="warning" size="sm">
          <Undo2 className="w-3 h-3" />
          Reverted
        </Badge>
      );
    case 'Draft':
      return (
        <Badge variant="outline" size="sm">
          <Circle className="w-3 h-3" />
          Draft
        </Badge>
      );
    case 'Auto':
      return (
        <Badge variant="default" size="sm">
          <Settings className="w-3 h-3" />
          Auto
        </Badge>
      );
  }
}

function DetailPanel({
  entry,
  onClose,
}: {
  entry: AuditEntry;
  onClose: () => void;
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mt-2">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">Change Details</h3>
        <button
          type="button"
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Close detail panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Change Info */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between gap-2 text-sm">
          <span className="text-gray-500">Timestamp</span>
          <span className="text-gray-900">{entry.timestamp}</span>
        </div>
        <div className="flex items-center justify-between gap-2 text-sm">
          <span className="text-gray-500">Actor</span>
          <span className="text-gray-900">{entry.actor}</span>
        </div>
        <div className="flex items-center justify-between gap-2 text-sm">
          <span className="text-gray-500">Role</span>
          <span className="text-gray-900">{entry.actorRole}</span>
        </div>
        <div className="flex items-center justify-between gap-2 text-sm">
          <span className="text-gray-500">Area</span>
          <Badge variant={areaBadgeVariant[entry.area]} size="sm">{entry.area}</Badge>
        </div>
        <div className="flex items-center justify-between gap-2 text-sm">
          <span className="text-gray-500">Status</span>
          <StatusBadge status={entry.status} />
        </div>
        {entry.reason && (
          <div className="text-sm">
            <span className="text-gray-500 block mb-1">Reason</span>
            <span className="text-gray-700">{entry.reason}</span>
          </div>
        )}
        <div className="text-sm">
          <span className="text-gray-500 block mb-1">Detail</span>
          <span className="text-gray-700">{entry.detail}</span>
        </div>
      </div>

      {/* Before/After diff panel */}
      {entry.before && entry.after && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Before / After</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-red-50 rounded-lg p-3 border border-red-100">
              <span className="text-xs font-medium text-red-600 block mb-1">Before</span>
              <span className="text-sm text-gray-800">{entry.before}</span>
            </div>
            <div className="bg-green-50 rounded-lg p-3 border border-green-100">
              <span className="text-xs font-medium text-green-600 block mb-1">After</span>
              <span className="text-sm text-gray-800">{entry.after}</span>
            </div>
          </div>
        </div>
      )}

      {/* Revert button — only for Published entries */}
      {entry.status === 'Published' && (
        <div className="pt-3 border-t border-gray-100">
          <Button
            variant="outline"
            size="sm"
            className="text-warning-600 border-warning-300 hover:bg-warning-50"
          >
            <Undo2 className="w-3 h-3 mr-1.5" />
            Revert Change
          </Button>
        </div>
      )}
    </div>
  );
}

export function AdminAuditLogPage() {
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  function toggleSort(key: string) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  // Use composable hooks for filters and search
  const { results: filterResults, filters, setFilter } = useFilters(auditEntries, {
    area: 'All',
    status: 'All',
  });

  const { results: searchResults, query: searchQuery, setQuery: setSearchQuery } = useSearch(
    filterResults,
    { fields: ['change', 'actor'] }
  );

  // Apply date filters
  const filteredEntries = useMemo(() => {
    if (!dateFrom && !dateTo) return searchResults;
    return searchResults.filter((entry) => {
      const entryDate = entry.timestamp.split(' ')[0] ?? '';
      if (dateFrom && entryDate < dateFrom) return false;
      if (dateTo && entryDate > dateTo) return false;
      return true;
    });
  }, [searchResults, dateFrom, dateTo]);

  const sorted = useMemo(() => {
    if (!sortKey) return filteredEntries;
    return [...filteredEntries].sort((a, b) => {
      const aVal = a[sortKey as keyof typeof a];
      const bVal = b[sortKey as keyof typeof b];
      const cmp = typeof aVal === 'number' && typeof bVal === 'number'
        ? aVal - bVal
        : String(aVal).localeCompare(String(bVal));
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filteredEntries, sortKey, sortDir]);

  const { totalPages, totalItems, pageSize, getPageItems } = usePagination(sorted, 15);
  const pageItems = getPageItems(currentPage);

  const selectedEntry = selectedEntryId
    ? auditEntries.find((e) => e.id === selectedEntryId) ?? null
    : null;

  return (
    <div className="relative">
      <div className="absolute inset-0 z-10 flex items-start justify-center pt-48 bg-white/60 rounded-lg">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <Settings className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-sm font-semibold text-gray-500">Coming Soon</p>
          <p className="text-xs text-gray-400 mt-1">Platform configuration is under development</p>
        </div>
      </div>
    <div className="space-y-4 pointer-events-none select-none opacity-40 grayscale">
      <PageHeader
        title="Configuration Change Log"
        actions={
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-1.5" />
            Export CSV
          </Button>
        }
      />

      {/* Filter row */}
      <FilterBar>
        {/* Area filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-gray-500">Area:</span>
          <div className="flex flex-wrap gap-1">
            {AREA_VALUES.map((area) => (
              <button
                key={area}
                type="button"
                onClick={() => setFilter('area', area)}
                className={cn(
                  'px-2 py-1 text-xs rounded-lg border transition-colors',
                  filters.area === area
                    ? 'bg-primary/10 border-primary/30 text-primary font-medium'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                )}
              >
                {area}
              </button>
            ))}
          </div>
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-gray-500">Status:</span>
          <div className="flex flex-wrap gap-1">
            {STATUS_VALUES.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setFilter('status', status)}
                className={cn(
                  'px-2 py-1 text-xs rounded-lg border transition-colors',
                  filters.status === status
                    ? 'bg-primary/10 border-primary/30 text-primary font-medium'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                )}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Date range filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-gray-500">Date:</span>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="h-8 text-xs w-[130px]"
          />
          <span className="text-xs text-gray-500">to</span>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="h-8 text-xs w-[130px]"
          />
        </div>

        {/* Search input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
          <Input
            type="text"
            placeholder="Search by change or actor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-7 h-8 text-xs"
          />
        </div>
      </FilterBar>

      {/* Results count */}
      <p className="text-xs text-gray-500">
        Showing {filteredEntries.length} change{filteredEntries.length !== 1 ? 's' : ''}
      </p>

      {/* Change log table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th onClick={() => toggleSort('timestamp')} className="cursor-pointer select-none text-left px-4 py-2 text-xs font-medium text-gray-500">
                Timestamp {sortKey === 'timestamp' && (sortDir === 'asc' ? '↑' : '↓')}
              </th>
              <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Actor</th>
              <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Area</th>
              <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Change</th>
              <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Status</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((entry) => (
              <tr
                key={entry.id}
                onClick={() =>
                  setSelectedEntryId(
                    selectedEntryId === entry.id ? null : entry.id
                  )
                }
                className={cn(
                  'border-b border-gray-50 cursor-pointer transition-colors',
                  selectedEntryId === entry.id
                    ? 'bg-primary/5'
                    : 'hover:bg-gray-50'
                )}
              >
                <td className="px-4 py-2.5 text-xs text-gray-500 whitespace-nowrap">
                  {entry.timestamp}
                </td>
                <td className="px-4 py-2.5 text-sm text-gray-900 whitespace-nowrap">
                  {entry.actor}
                </td>
                <td className="px-4 py-2.5">
                  <Badge variant={areaBadgeVariant[entry.area]} size="sm">
                    {entry.area}
                  </Badge>
                </td>
                <td className="px-4 py-2.5 text-sm text-gray-700">
                  {entry.change}
                </td>
                <td className="px-4 py-2.5">
                  <StatusBadge status={entry.status} />
                </td>
              </tr>
            ))}
            {filteredEntries.length === 0 && (
              <tr>
                <td colSpan={5}>
                  <EmptyState description="No changes match the current filters." />
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={totalItems}
              pageSize={pageSize}
            />
          </div>
        )}
      </div>

      {/* Detail panel (shown below table when a row is selected) */}
      {selectedEntry && (
        <DetailPanel
          entry={selectedEntry}
          onClose={() => setSelectedEntryId(null)}
        />
      )}

      {/* Status legend */}
      <div className="flex items-center justify-center gap-4 text-xs text-gray-500 pt-2">
        <span className="flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-green-500" />
          Published
        </span>
        <span className="text-gray-400">|</span>
        <span className="flex items-center gap-1">
          <Settings className="w-3 h-3 text-gray-400" />
          Auto
        </span>
        <span className="text-gray-400">|</span>
        <span className="flex items-center gap-1">
          <Undo2 className="w-3 h-3 text-yellow-500" />
          Reverted
        </span>
        <span className="text-gray-400">|</span>
        <span className="flex items-center gap-1">
          <Circle className="w-3 h-3 text-gray-400" />
          Draft
        </span>
      </div>
    </div>
    </div>
  );
}
