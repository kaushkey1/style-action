import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeader,
  DataTableRow,
} from '@/components/ui';
import { useAdminConfigStore } from '../../stores/useAdminConfigStore';
import {
  AdminSectionCard,
  NumberField,
  TabErrorSummary,
} from './adminConfigShared';
import { findFieldError } from './adminConfigHelpers';

const TAB = 'pod_master';

export function PodMasterTab(): React.ReactNode {
  const rows = useAdminConfigStore((s) => s.draft?.pod_master);
  const fieldErrors = useAdminConfigStore((s) => s.fieldErrors);
  const updateSection = useAdminConfigStore((s) => s.updateSection);

  if (!rows) return null;

  const setSqft = (index: number, part: 'min_sqft' | 'max_sqft', value: number): void => {
    updateSection(
      'pod_master',
      rows.map((r, i) => (i === index ? { ...r, [part]: value } : r)),
    );
  };

  return (
    <div className="space-y-4">
      <TabErrorSummary errors={fieldErrors} tab={TAB} />

      <AdminSectionCard title={`Pod Master (${rows.length} pods)`}>
        <p className="text-xs text-gray-500 mb-3">
          Min/Max sqft per pod. Pod ids are fixed — the engine's brick→pod mapping
          references them.
        </p>
        <div className="overflow-x-auto -mx-1 px-1">
          <DataTable className="min-w-[560px]">
            <DataTableHeader>
                <DataTableHead>Category</DataTableHead>
                <DataTableHead>Pod</DataTableHead>
                <DataTableHead>Min sqft</DataTableHead>
                <DataTableHead>Max sqft</DataTableHead>
              </DataTableHeader>
            <DataTableBody>
              {rows.map((row, i) => {
                const error = findFieldError(fieldErrors, TAB, row.pod_id);
                return (
                  <DataTableRow key={`${row.category}-${row.pod_id}`}>
                    <DataTableCell className="text-gray-500">{row.category}</DataTableCell>
                    <DataTableCell className="font-medium text-gray-900">
                      {row.pod_id}
                      {error && <div className="text-xs font-normal text-red-600">{error}</div>}
                    </DataTableCell>
                    <DataTableCell>
                      <NumberField
                        ariaLabel={`${row.pod_id} min sqft`}
                        value={row.min_sqft}
                        onChange={(v) => setSqft(i, 'min_sqft', v)}
                        inputClassName="w-24"
                      />
                    </DataTableCell>
                    <DataTableCell>
                      <NumberField
                        ariaLabel={`${row.pod_id} max sqft`}
                        value={row.max_sqft}
                        onChange={(v) => setSqft(i, 'max_sqft', v)}
                        inputClassName="w-24"
                      />
                    </DataTableCell>
                  </DataTableRow>
                );
              })}
            </DataTableBody>
          </DataTable>
        </div>
      </AdminSectionCard>
    </div>
  );
}
