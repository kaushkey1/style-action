import { useState, useCallback, useEffect } from 'react';
import { FileSearch } from 'lucide-react';
import {
  DataTable,
  DataTableHeader,
  DataTableBody,
  DataTableRow,
  DataTableHead,
  DataTableCell,
  Pagination,
  Badge,
  Spinner,
  EmptyState,
} from '@/components/ui';
import { formatDateTime } from '@/lib/utils';
import { useExtensionStore } from '../stores/useExtensionStore';

import type { QueryLogStatus } from '../data/extensionTypes';

const PAGE_SIZE = 20;

const STATUS_VARIANT: Record<QueryLogStatus, 'default' | 'info' | 'success' | 'error'> = {
  pending: 'default',
  running: 'info',
  completed: 'success',
  failed: 'error',
};

function formatBytes(bytes: number | null): string {
  if (bytes === null) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatDuration(ms: number | null): string {
  if (ms === null) return '—';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

interface QueryLogTableProps {
  slug: string;
}

export function QueryLogTable({ slug }: QueryLogTableProps): React.ReactNode {
  const queryLogs = useExtensionStore((s) => s.queryLogs);
  const fetchQueryLogs = useExtensionStore((s) => s.fetchQueryLogs);

  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const loadPage = useCallback(
    async (p: number) => {
      setLoading(true);
      await fetchQueryLogs(slug, p, PAGE_SIZE);
      setLoading(false);
    },
    [slug, fetchQueryLogs],
  );

  useEffect(() => {
    void loadPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only: loadPage is stable
  }, []);

  const handlePageChange = useCallback(
    (p: number) => {
      setPage(p);
      void loadPage(p);
    },
    [loadPage],
  );

  if (loading && !queryLogs) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="w-5 h-5" />
      </div>
    );
  }

  if (!queryLogs || queryLogs.items.length === 0) {
    return (
      <EmptyState
        icon={FileSearch}
        description="No query logs found for this extension."
      />
    );
  }

  const totalPages = Math.max(1, Math.ceil(queryLogs.total / PAGE_SIZE));

  return (
    <div className="space-y-0">
      <DataTable minWidth="700px">
        <DataTableHeader>
          <DataTableHead>Time</DataTableHead>
          <DataTableHead>Mode</DataTableHead>
          <DataTableHead>Status</DataTableHead>
          <DataTableHead>Rows</DataTableHead>
          <DataTableHead>Bytes</DataTableHead>
          <DataTableHead>Duration</DataTableHead>
        </DataTableHeader>
        <DataTableBody>
          {queryLogs.items.map((log) => (
            <DataTableRow key={log.id}>
              <DataTableCell>
                <span className="whitespace-nowrap">{formatDateTime(log.created_at)}</span>
              </DataTableCell>
              <DataTableCell>
                <Badge variant="outline" size="sm">{log.query_mode}</Badge>
              </DataTableCell>
              <DataTableCell>
                <Badge variant={STATUS_VARIANT[log.status]} size="sm">
                  {log.status}
                </Badge>
              </DataTableCell>
              <DataTableCell>
                {log.row_count !== null ? log.row_count.toLocaleString() : '—'}
              </DataTableCell>
              <DataTableCell>{formatBytes(log.bytes_processed)}</DataTableCell>
              <DataTableCell>{formatDuration(log.duration_ms)}</DataTableCell>
            </DataTableRow>
          ))}
        </DataTableBody>
      </DataTable>

      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          totalItems={queryLogs.total}
          pageSize={PAGE_SIZE}
        />
      )}
    </div>
  );
}
