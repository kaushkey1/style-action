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
  ADMIN_CATEGORIES,
  AdminSectionCard,
  NumberField,
  TabErrorSummary,
} from './adminConfigShared';
import { findFieldError } from './adminConfigHelpers';

const TAB = 'efficiency_bands';

export function EfficiencyBandsTab(): React.ReactNode {
  const bands = useAdminConfigStore((s) => s.draft?.efficiency_bands);
  const fieldErrors = useAdminConfigStore((s) => s.fieldErrors);
  const updateSection = useAdminConfigStore((s) => s.updateSection);

  if (!bands) return null;

  const setBand = (category: string, part: 'min' | 'max', value: number): void => {
    const current = bands[category] ?? { min: 0, max: 0 };
    updateSection('efficiency_bands', {
      ...bands,
      [category]: { ...current, [part]: value },
    });
  };

  return (
    <div className="space-y-4">
      <TabErrorSummary errors={fieldErrors} tab={TAB} />

      <AdminSectionCard title="Efficiency Bands (× wSPSF)">
        <p className="text-xs text-gray-500 mb-3">
          Per-category clamp on space efficiency: 0 &lt; min ≤ max ≤ 3.
        </p>
        <div className="overflow-x-auto -mx-1 px-1">
          <DataTable className="min-w-[420px]">
            <DataTableHeader>
                <DataTableHead>Category</DataTableHead>
                <DataTableHead>Min</DataTableHead>
                <DataTableHead>Max</DataTableHead>
              </DataTableHeader>
            <DataTableBody>
              {ADMIN_CATEGORIES.map((cat) => {
                const band = bands[cat] ?? { min: 0, max: 0 };
                const error = findFieldError(fieldErrors, TAB, cat);
                return (
                  <DataTableRow key={cat}>
                    <DataTableCell className="font-medium text-gray-900">
                      {cat}
                      {error && <div className="text-xs font-normal text-red-600">{error}</div>}
                    </DataTableCell>
                    <DataTableCell>
                      <NumberField
                        ariaLabel={`${cat} band min`}
                        value={band.min}
                        onChange={(v) => setBand(cat, 'min', v)}
                        inputClassName="w-28"
                        error={undefined}
                      />
                    </DataTableCell>
                    <DataTableCell>
                      <NumberField
                        ariaLabel={`${cat} band max`}
                        value={band.max}
                        onChange={(v) => setBand(cat, 'max', v)}
                        inputClassName="w-28"
                        error={undefined}
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
