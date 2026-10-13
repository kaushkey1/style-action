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

const TAB = 'fixture_capacity';

export function FixtureCapacityTab(): React.ReactNode {
  const rows = useAdminConfigStore((s) => s.draft?.fixture_capacity);
  const fieldErrors = useAdminConfigStore((s) => s.fieldErrors);
  const updateSection = useAdminConfigStore((s) => s.updateSection);

  if (!rows) return null;

  const fixtureTypes = [...new Set(rows.map((r) => r.fixture_type))].sort();
  const byKey = new Map(rows.map((r, i) => [`${r.fixture_type}|${r.category}`, i]));

  const setCell = (
    fixtureType: string,
    category: string,
    part: 'min' | 'max',
    value: number,
  ): void => {
    const idx = byKey.get(`${fixtureType}|${category}`);
    if (idx === undefined) return;
    updateSection(
      'fixture_capacity',
      rows.map((r, i) => (i === idx ? { ...r, [part]: value } : r)),
    );
  };

  return (
    <div className="space-y-4">
      <TabErrorSummary errors={fieldErrors} tab={TAB} />

      <AdminSectionCard title="Fixture Capacity (options per fixture)">
        <p className="text-xs text-gray-500 mb-3">
          Min/Max options per fixture type and category. Cells shown only where the
          combination is configured; 0 ≤ min ≤ max ≤ 500.
        </p>
        <div className="overflow-x-auto -mx-1 px-1">
          <DataTable className="min-w-[860px]">
            <DataTableHeader>
                <DataTableHead>Fixture type</DataTableHead>
                {ADMIN_CATEGORIES.map((cat) => (
                  <DataTableHead key={cat} className="text-center">
                    {cat}
                    <span className="block text-[10px] font-normal text-gray-400">min / max</span>
                  </DataTableHead>
                ))}
              </DataTableHeader>
            <DataTableBody>
              {fixtureTypes.map((ft) => (
                <DataTableRow key={ft}>
                  <DataTableCell className="font-medium text-gray-900 whitespace-nowrap">
                    {ft}
                  </DataTableCell>
                  {ADMIN_CATEGORIES.map((cat) => {
                    const idx = byKey.get(`${ft}|${cat}`);
                    const row = idx === undefined ? undefined : rows[idx];
                    return (
                      <DataTableCell key={cat}>
                        {row ? (
                          <div className="flex items-center gap-1.5 justify-center">
                            <NumberField
                              ariaLabel={`${ft} ${cat} min`}
                              value={row.min}
                              onChange={(v) => setCell(ft, cat, 'min', v)}
                              inputClassName="w-16 text-center"
                            />
                            <span className="text-gray-400">/</span>
                            <NumberField
                              ariaLabel={`${ft} ${cat} max`}
                              value={row.max}
                              onChange={(v) => setCell(ft, cat, 'max', v)}
                              inputClassName="w-16 text-center"
                            />
                          </div>
                        ) : (
                          <span className="block text-center text-gray-400">—</span>
                        )}
                      </DataTableCell>
                    );
                  })}
                </DataTableRow>
              ))}
            </DataTableBody>
          </DataTable>
        </div>
      </AdminSectionCard>
    </div>
  );
}
