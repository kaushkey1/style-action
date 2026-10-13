import {
  Badge,
  Button,
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeader,
  DataTableRow,
  EmptyState,
  Spinner,
} from '@/components/ui';
import { formatDateTime } from '@/lib/utils';
import {
  useAdminAuditLog,
  useAdminConfigVersions,
  useAdminRuns,
} from '../../api/adminConfigApi';
import { AdminSectionCard } from './adminConfigShared';

const TAB_LABELS: Record<string, string> = {
  planning_parameters: 'Planning Parameters',
  deduction_rules: 'Deduction Rules',
  efficiency_bands: 'Efficiency Bands',
  fixture_capacity: 'Fixture Capacity',
  floor_placement: 'Floor Placement',
  pod_master: 'Pod Master',
  format_category: 'Formats & Scope',
  season_windows: 'Season Windows',
  mappings: 'Mappings',
};

const FIELD_LABELS: Record<string, string> = {
  wspsf_same_season: 'Same season weight',
  wspsf_recency: 'Recency weight',
  wspsf_three_yr: 'Three-year weight',
  blend_past: 'Blend — past',
  blend_aop: 'Blend — AOP',
  bor_rate: 'BOR rate',
  bor_min_carpet_sqft: 'BOR min carpet sqft',
  lft_sqft_factor: 'LFT sqft factor',
  sell_through_default: 'Sell-through default',
  waterfill_tolerance: 'Waterfill tolerance',
  waterfill_max_iter: 'Waterfill max iterations',
  ded_non_apps: 'Non-apparel rate',
  ded_accessories: 'Accessories rate',
  ded_innerwear: 'Innerwear rate',
  ded_lingerie: 'Lingerie rate',
  footwear_rate: 'Footwear rate',
  footwear_cap_sqft: 'Footwear cap (sqft)',
  footwear_min_carpet_sqft: 'Footwear min carpet (sqft)',
  deduction_sequence: 'Deduction sequence',
  rounding_rule: 'Option rounding rule',
};

function LoadingRow(): React.ReactNode {
  return (
    <div className="flex items-center justify-center py-8">
      <Spinner />
    </div>
  );
}

interface QueryErrorProps {
  onRetry: () => void;
}

function QueryError({ onRetry }: QueryErrorProps): React.ReactNode {
  return (
    <div className="flex items-center gap-3 py-4">
      <span className="text-sm text-red-600">Failed to load.</span>
      <Button variant="outline" size="sm" onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
}

export function VersionsRunsTab(): React.ReactNode {
  const versionsQuery = useAdminConfigVersions();
  const runsQuery = useAdminRuns();
  const auditQuery = useAdminAuditLog();

  return (
    <div className="space-y-4">
      <AdminSectionCard
        title="Audit Log"
        actions={
          auditQuery.data && auditQuery.data.length > 0 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const rows = auditQuery.data ?? [];
                const esc = (v: string | number | null): string =>
                  `"${String(v ?? '').replace(/"/g, '""')}"`;
                const csv = [
                  'changed_at,changed_by,version,tab,field,old_value,new_value',
                  ...rows.map((a) =>
                    [a.changed_at, a.changed_by, a.version, TAB_LABELS[a.section] ?? a.section,
                      a.field, a.old_value, a.new_value].map(esc).join(','),
                  ),
                ].join('\n');
                const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
                const link = document.createElement('a');
                link.href = url;
                link.download = 'space-planning-config-audit.csv';
                link.click();
                URL.revokeObjectURL(url);
              }}
            >
              Export CSV
            </Button>
          ) : undefined
        }
      >
        {auditQuery.isPending ? (
          <LoadingRow />
        ) : auditQuery.isError ? (
          <QueryError onRetry={() => void auditQuery.refetch()} />
        ) : auditQuery.data.length === 0 ? (
          <EmptyState
            title="No changes recorded yet"
            description="Every value changed on this screen is logged here — who, when, old and new."
          />
        ) : (
          <div className="overflow-x-auto -mx-1 px-1">
            <DataTable className="min-w-[860px]">
              <DataTableHeader>
                  <DataTableHead>When</DataTableHead>
                  <DataTableHead>By</DataTableHead>
                  <DataTableHead>Version</DataTableHead>
                  <DataTableHead>Tab</DataTableHead>
                  <DataTableHead>Field</DataTableHead>
                  <DataTableHead>Old value</DataTableHead>
                  <DataTableHead>New value</DataTableHead>
                </DataTableHeader>
              <DataTableBody>
                {auditQuery.data.map((a, i) => (
                  <DataTableRow key={`${a.changed_at}-${a.section}-${a.field}-${i}`}>
                    <DataTableCell className="text-gray-500 whitespace-nowrap">
                      {a.changed_at ? formatDateTime(a.changed_at) : '—'}
                    </DataTableCell>
                    <DataTableCell className="text-gray-700">{a.changed_by ?? '—'}</DataTableCell>
                    <DataTableCell className="text-gray-500">
                      {a.version !== null ? `v${a.version}` : '—'}
                    </DataTableCell>
                    <DataTableCell className="text-gray-700 whitespace-nowrap">
                      {TAB_LABELS[a.section] ?? a.section}
                    </DataTableCell>
                    <DataTableCell className="text-gray-700">
                      {FIELD_LABELS[a.field] ?? a.field}
                    </DataTableCell>
                    <DataTableCell className="text-gray-500 line-through">
                      {a.old_value ?? '—'}
                    </DataTableCell>
                    <DataTableCell className="font-medium text-gray-900">
                      {a.new_value ?? '—'}
                    </DataTableCell>
                  </DataTableRow>
                ))}
              </DataTableBody>
            </DataTable>
          </div>
        )}
      </AdminSectionCard>

      <AdminSectionCard title="Version History">
        {versionsQuery.isPending ? (
          <LoadingRow />
        ) : versionsQuery.isError ? (
          <QueryError onRetry={() => void versionsQuery.refetch()} />
        ) : versionsQuery.data.length === 0 ? (
          <EmptyState title="No versions yet" description="Save the config to create v1." />
        ) : (
          <div className="overflow-x-auto -mx-1 px-1">
            <DataTable className="min-w-[680px]">
              <DataTableHeader>
                  <DataTableHead>Version</DataTableHead>
                  <DataTableHead>Status</DataTableHead>
                  <DataTableHead>Description</DataTableHead>
                  <DataTableHead>Saved by</DataTableHead>
                  <DataTableHead>Saved at</DataTableHead>
                </DataTableHeader>
              <DataTableBody>
                {versionsQuery.data.map((v) => (
                  <DataTableRow key={v.config_id}>
                    <DataTableCell className="font-medium text-gray-900">
                      v{v.version}
                      {v.is_latest && (
                        <Badge variant="success" size="sm" className="ml-2">
                          Current
                        </Badge>
                      )}
                    </DataTableCell>
                    <DataTableCell className="text-gray-500">{v.status ?? '—'}</DataTableCell>
                    <DataTableCell className="text-gray-700 max-w-[280px] truncate">
                      {v.description ?? '—'}
                    </DataTableCell>
                    <DataTableCell className="text-gray-700">{v.created_by ?? '—'}</DataTableCell>
                    <DataTableCell className="text-gray-500">
                      {v.created_at ? formatDateTime(v.created_at) : '—'}
                    </DataTableCell>
                  </DataTableRow>
                ))}
              </DataTableBody>
            </DataTable>
          </div>
        )}
      </AdminSectionCard>

      <AdminSectionCard title="Run Log">
        {runsQuery.isPending ? (
          <LoadingRow />
        ) : runsQuery.isError ? (
          <QueryError onRetry={() => void runsQuery.refetch()} />
        ) : runsQuery.data.length === 0 ? (
          <EmptyState title="No runs yet" description="Engine batches appear here once run." />
        ) : (
          <div className="overflow-x-auto -mx-1 px-1">
            <DataTable className="min-w-[720px]">
              <DataTableHeader>
                  <DataTableHead>Batch</DataTableHead>
                  <DataTableHead>Started</DataTableHead>
                  <DataTableHead>Finished</DataTableHead>
                  <DataTableHead className="text-right">Stores</DataTableHead>
                  <DataTableHead className="text-right">OK</DataTableHead>
                  <DataTableHead className="text-right">Other</DataTableHead>
                  <DataTableHead>Config version</DataTableHead>
                </DataTableHeader>
              <DataTableBody>
                {runsQuery.data.map((r, i) => (
                  <DataTableRow key={r.batch_id ?? `run-${i}`}>
                    <DataTableCell className="font-mono text-xs text-gray-700">
                      {r.batch_id ? r.batch_id.slice(0, 8) : '—'}
                    </DataTableCell>
                    <DataTableCell className="text-gray-500">
                      {r.started_at ? formatDateTime(r.started_at) : '—'}
                    </DataTableCell>
                    <DataTableCell className="text-gray-500">
                      {r.finished_at ? formatDateTime(r.finished_at) : '—'}
                    </DataTableCell>
                    <DataTableCell className="text-right text-gray-700">
                      {r.stores_total}
                    </DataTableCell>
                    <DataTableCell className="text-right text-gray-700">{r.stores_ok}</DataTableCell>
                    <DataTableCell className="text-right text-gray-700">
                      {r.stores_other}
                    </DataTableCell>
                    <DataTableCell className="text-gray-700">
                      {r.config_version !== null ? `v${r.config_version}` : '—'}
                    </DataTableCell>
                  </DataTableRow>
                ))}
              </DataTableBody>
            </DataTable>
          </div>
        )}
      </AdminSectionCard>
    </div>
  );
}
