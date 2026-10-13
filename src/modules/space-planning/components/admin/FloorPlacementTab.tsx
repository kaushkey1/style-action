import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeader,
  DataTableRow,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import { useAdminConfigStore } from '../../stores/useAdminConfigStore';
import {
  ADMIN_CATEGORIES,
  ADMIN_FLOOR_CONFIGS,
  ADMIN_FLOORS,
  ADMIN_STORE_TYPES,
  AdminSectionCard,
  TabErrorSummary,
} from './adminConfigShared';

const TAB = 'floor_placement';

export function FloorPlacementTab(): React.ReactNode {
  const rows = useAdminConfigStore((s) => s.draft?.floor_placement);
  const fieldErrors = useAdminConfigStore((s) => s.fieldErrors);
  const updateSection = useAdminConfigStore((s) => s.updateSection);

  if (!rows) return null;

  const byKey = new Map(
    rows.map((r, i) => [`${r.store_type}|${r.floor_config}|${r.category}`, i]),
  );

  const setFloor = (
    storeType: string,
    floorConfig: string,
    category: string,
    floor: string,
  ): void => {
    const idx = byKey.get(`${storeType}|${floorConfig}|${category}`);
    if (idx === undefined) return;
    updateSection(
      'floor_placement',
      rows.map((r, i) => (i === idx ? { ...r, floor } : r)),
    );
  };

  return (
    <div className="space-y-4">
      <TabErrorSummary errors={fieldErrors} tab={TAB} />

      {ADMIN_STORE_TYPES.map((storeType) => {
        const configs = ADMIN_FLOOR_CONFIGS.filter((cfg) =>
          rows.some((r) => r.store_type === storeType && r.floor_config === cfg),
        );
        if (configs.length === 0) return null;
        return (
          <AdminSectionCard key={storeType} title={`${storeType} stores`}>
            <div className="overflow-x-auto -mx-1 px-1">
              <DataTable className="min-w-[760px]">
                <DataTableHeader>
                    <DataTableHead>Floor config</DataTableHead>
                    {ADMIN_CATEGORIES.map((cat) => (
                      <DataTableHead key={cat} className="text-center">
                        {cat}
                      </DataTableHead>
                    ))}
                  </DataTableHeader>
                <DataTableBody>
                  {configs.map((cfg) => (
                    <DataTableRow key={cfg}>
                      <DataTableCell className="font-medium text-gray-900">
                        {cfg} floor{cfg === 'ONE' ? '' : 's'}
                      </DataTableCell>
                      {ADMIN_CATEGORIES.map((cat) => {
                        const idx = byKey.get(`${storeType}|${cfg}|${cat}`);
                        const row = idx === undefined ? undefined : rows[idx];
                        return (
                          <DataTableCell key={cat}>
                            {row ? (
                              <Select
                                value={row.floor}
                                onValueChange={(v) => setFloor(storeType, cfg, cat, v)}
                              >
                                <SelectTrigger
                                  className="w-28 h-8 text-sm mx-auto"
                                  aria-label={`${storeType} ${cfg} ${cat} floor`}
                                >
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {ADMIN_FLOORS.map((f) => (
                                    <SelectItem key={f} value={f}>
                                      {f}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
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
        );
      })}
    </div>
  );
}
