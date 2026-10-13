import { Download } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeader,
  DataTableRow,
  EmptyState,
  Skeleton,
} from '@/components/ui';
import { formatDate, formatDateTime } from '@/lib/utils';
import { useAnrAuditLog, useAnrConfigVersions, type AnrAuditRow } from '../api/anrConfigApi';

function auditCsv(rows: AnrAuditRow[]): string {
  const header = 'version,action,config_type,fashion_grade,store_code,param_key,old_value,new_value,changed_by,changed_at,effective_from,reason';
  const esc = (v: string | number | null): string => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = rows.map((r) =>
    [r.version, r.action, r.configType, r.fashionGrade, r.storeCode, r.paramKey,
     r.oldValue, r.newValue, r.changedBy, r.changedAt, r.effectiveFrom, r.reason]
      .map(esc).join(','),
  );
  return [header, ...lines].join('\n');
}

export function AnrVersionsAuditTab(): React.ReactNode {
  const versionsQuery = useAnrConfigVersions();
  const auditQuery = useAnrAuditLog();

  const handleExport = (): void => {
    const rows = auditQuery.data ?? [];
    const blob = new Blob([auditCsv(rows)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'anr-config-audit.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Versions</h2>
          {versionsQuery.isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : versionsQuery.isError ? (
            <p className="text-sm text-red-600" role="alert">Failed to load versions.</p>
          ) : (versionsQuery.data ?? []).length === 0 ? (
            <EmptyState title="No versions yet" description="Publish a config to create the first version." />
          ) : (
            <div className="overflow-x-auto -mx-1 px-1">
              <DataTable className="min-w-[640px]">
                <DataTableHeader>
                  <DataTableHead>Version</DataTableHead>
                  <DataTableHead>Status</DataTableHead>
                  <DataTableHead>Reason</DataTableHead>
                  <DataTableHead>Effective From</DataTableHead>
                  <DataTableHead>Published By</DataTableHead>
                  <DataTableHead>Published At</DataTableHead>
                </DataTableHeader>
                <DataTableBody>
                  {(versionsQuery.data ?? []).map((v) => (
                    <DataTableRow key={v.version}>
                      <DataTableCell className="font-medium text-gray-900">v{v.version}</DataTableCell>
                      <DataTableCell>
                        <span className="inline-flex items-center gap-1.5">
                          <Badge variant={v.status === 'published' ? 'success' : 'warning'} size="sm">
                            {v.status}
                          </Badge>
                          {v.isLatestPublished && <Badge variant="info" size="sm">current</Badge>}
                        </span>
                      </DataTableCell>
                      <DataTableCell className="max-w-[280px] truncate" title={v.reason ?? ''}>
                        {v.reason ?? '—'}
                      </DataTableCell>
                      <DataTableCell>{v.effectiveFrom ? formatDate(v.effectiveFrom) : '—'}</DataTableCell>
                      <DataTableCell>{v.publishedBy ?? '—'}</DataTableCell>
                      <DataTableCell>{v.publishedAt ? formatDateTime(v.publishedAt) : '—'}</DataTableCell>
                    </DataTableRow>
                  ))}
                </DataTableBody>
              </DataTable>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h2 className="text-sm font-semibold text-gray-900">Audit Log</h2>
            <Button
              size="sm"
              variant="outline"
              onClick={handleExport}
              disabled={(auditQuery.data ?? []).length === 0}
            >
              <Download className="w-3.5 h-3.5 mr-1" />
              Export CSV
            </Button>
          </div>
          {auditQuery.isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : auditQuery.isError ? (
            <p className="text-sm text-red-600" role="alert">Failed to load audit log.</p>
          ) : (auditQuery.data ?? []).length === 0 ? (
            <EmptyState title="No changes recorded" description="Publish a config change to see it here." />
          ) : (
            <div className="overflow-x-auto -mx-1 px-1">
              <DataTable className="min-w-[860px]">
                <DataTableHeader>
                  <DataTableHead>When</DataTableHead>
                  <DataTableHead>Version</DataTableHead>
                  <DataTableHead>Tab</DataTableHead>
                  <DataTableHead>Grade</DataTableHead>
                  <DataTableHead>Parameter</DataTableHead>
                  <DataTableHead>Change</DataTableHead>
                  <DataTableHead>By</DataTableHead>
                  <DataTableHead>Effective</DataTableHead>
                  <DataTableHead>Reason</DataTableHead>
                </DataTableHeader>
                <DataTableBody>
                  {(auditQuery.data ?? []).map((a, i) => (
                    <DataTableRow key={`${a.changedAt}-${a.configType}-${a.paramKey}-${i}`}>
                      <DataTableCell className="whitespace-nowrap">
                        {a.changedAt ? formatDateTime(a.changedAt) : '—'}
                      </DataTableCell>
                      <DataTableCell>{a.version !== null ? `v${a.version}` : '—'}</DataTableCell>
                      <DataTableCell>{a.configType}</DataTableCell>
                      <DataTableCell>
                        {a.fashionGrade}
                        {a.storeCode && (
                          <span className="text-gray-500"> · {a.storeCode}</span>
                        )}
                      </DataTableCell>
                      <DataTableCell>{a.paramKey}</DataTableCell>
                      <DataTableCell>
                        <span className="text-red-700 line-through">{a.oldValue ?? '∅'}</span>
                        <span className="text-gray-400 mx-1">→</span>
                        <span className="text-green-700 font-medium">{a.newValue ?? '∅'}</span>
                      </DataTableCell>
                      <DataTableCell>{a.changedBy ?? '—'}</DataTableCell>
                      <DataTableCell>{a.effectiveFrom ? formatDate(a.effectiveFrom) : '—'}</DataTableCell>
                      <DataTableCell className="max-w-[220px] truncate" title={a.reason ?? ''}>
                        {a.reason ?? '—'}
                      </DataTableCell>
                    </DataTableRow>
                  ))}
                </DataTableBody>
              </DataTable>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
