import {
  SectionHeader,
  InfoHeaderIcon,
  TableToolbar,
  TableMetricsInfo,
  EmptyState,
} from '@/components/ui';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useTableSearchSort } from '@/hooks/useTableSearchSort';
import { AOPMobileCard } from '@/modules/aop/components/AOPMobileCard';
import type { StoreHealthRow } from '../data/mockCategoryDirectorData';

function parseNumeric(value: string): number {
  const cleaned = value.replace(/[^\d.-]/g, '');
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

const STORE_HEALTH_HEADERS = ['Grade', 'Stores', 'Optimally Stocked', 'Overstocked', 'Understocked', 'Rev/Day'];
const STORE_HEALTH_INFO_KEYS: Record<string, string> = {
  Grade: 'Grade',
  Stores: 'Stores',
  'Optimally Stocked': 'Optimally Stocked',
  Overstocked: 'Overstocked',
  Understocked: 'Understocked',
  'Rev/Day': 'Rev/Day',
};
const STORE_HEALTH_SORT_FIELDS: Record<string, (r: StoreHealthRow) => number> = {
  Stores: (r) => parseNumeric(r.stores),
  'Optimally Stocked': (r) => parseNumeric(r.rightStocked),
  Overstocked: (r) => parseNumeric(r.overstocked),
  Understocked: (r) => parseNumeric(r.understocked),
  'Rev/Day': (r) => parseNumeric(r.revPerDay),
};
const STORE_HEALTH_SORT_COLUMNS = Object.keys(STORE_HEALTH_SORT_FIELDS).map((k) => ({ key: k, label: k }));

export function StoreHealthSection({ rows }: { rows: StoreHealthRow[] }): React.ReactNode {
  const isMobile = useIsMobile();
  const { search, setSearch, sortKey, sortDir, setSortKey, setSortDir, filteredRows } =
    useTableSearchSort(rows, {
      searchField: (r) => r.grade,
      sortFields: STORE_HEALTH_SORT_FIELDS,
      defaultSortKey: 'Rev/Day',
    });

  const toolbar = (
    <TableToolbar
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search grades..."
      sortColumns={STORE_HEALTH_SORT_COLUMNS}
      sortKey={sortKey}
      sortDir={sortDir}
      onSortChange={(k, d) => { setSortKey(k); setSortDir(d); }}
    />
  );

  if (isMobile) {
    return (
      <div className="space-y-3">
        <SectionHeader
          title={<>Store Health by Grade <TableMetricsInfo metrics={Object.keys(STORE_HEALTH_INFO_KEYS)} /></>}
          actions={toolbar}
        />
        {filteredRows.map((r) => (
          <div key={r.grade} title="A0: Flagship stores, A1: High-traffic, A2: Standard, A3: Smaller format">
            <AOPMobileCard
              title={r.grade}
              metrics={[
                { label: 'Stores', value: r.stores },
                { label: 'Optimally Stocked', value: r.rightStocked },
                { label: 'Overstocked', value: r.overstocked },
                { label: 'Understocked', value: r.understocked },
                { label: 'Rev/Day', value: r.revPerDay },
              ]}
              onClick={() => {}}
              className="cursor-default"
              showChevron={false}
            />
          </div>
        ))}
        {filteredRows.length === 0 && (
          <EmptyState
            title="No results"
            description={search ? `No grades matching "${search}"` : 'No store health data for the current filters.'}
            variant="neutral"
          />
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <SectionHeader title="Store Health by Grade" actions={toolbar} />
      <div className="overflow-x-auto mt-3">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {STORE_HEALTH_HEADERS.map((h) => (
                <th key={h} className="text-left py-2.5 px-3 font-medium text-gray-500 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1">
                    {h}
                    {STORE_HEALTH_INFO_KEYS[h] && <InfoHeaderIcon metricKey={STORE_HEALTH_INFO_KEYS[h]} />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={STORE_HEALTH_HEADERS.length} className="py-6">
                  <EmptyState
                    title="No results"
                    description={search ? `No grades matching "${search}"` : 'No store health data for the current filters.'}
                    variant="neutral"
                    className="py-6"
                  />
                </td>
              </tr>
            ) : (
              filteredRows.map((r) => (
                <tr key={r.grade} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="py-2 px-3 font-medium text-gray-900" title="A0: Flagship stores, A1: High-traffic, A2: Standard, A3: Smaller format">{r.grade}</td>
                  <td className="py-2 px-3 text-gray-700 tabular-nums">{r.stores}</td>
                  <td className="py-2 px-3 text-gray-700 tabular-nums">{r.rightStocked}</td>
                  <td className="py-2 px-3 text-gray-700 tabular-nums">{r.overstocked}</td>
                  <td className="py-2 px-3 text-gray-700 tabular-nums">{r.understocked}</td>
                  <td className="py-2 px-3 text-gray-700 tabular-nums">{r.revPerDay}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
