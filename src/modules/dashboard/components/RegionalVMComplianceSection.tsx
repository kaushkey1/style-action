import { EmptyState, InfoHeaderIcon, SectionHeader, TableMetricsInfo, TableToolbar } from "@/components/ui";
import { useTableSearchSort } from "@/hooks/useTableSearchSort";
import { cn } from "@/lib/utils";
import { VM_COMPLIANCE } from "../data/mockRegional";
import type { VMClusterRow } from "../data/mockRegional";

// ---------------------------------------------------------------------------
// VM Compliance by Cluster
// ---------------------------------------------------------------------------

const HEADERS = ["Cluster", "Stores", "VM Score", "Planogram", "SOP", "Status"];

const VM_SORT_FIELDS: Record<string, (r: VMClusterRow) => number> = {
  "Stores": (r) => r.stores,
  "VM Score": (r) => parseFloat(r.vmScore),
  "Planogram": (r) => parseFloat(r.planogram),
  "SOP": (r) => parseFloat(r.sop),
};

const VM_SORT_COLUMNS = Object.keys(VM_SORT_FIELDS).map((k) => ({ key: k, label: k }));

export function RegionalVMComplianceSection(): React.ReactNode {
  const { search, setSearch, sortKey, sortDir, setSortKey, setSortDir, filteredRows } =
    useTableSearchSort(VM_COMPLIANCE, {
      searchField: (r) => r.cluster,
      sortFields: VM_SORT_FIELDS,
    });

  const toolbarActions = (
    <TableToolbar
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search clusters..."
      sortColumns={VM_SORT_COLUMNS}
      sortKey={sortKey}
      sortDir={sortDir}
      onSortChange={(k, d) => { setSortKey(k); setSortDir(d); }}
    />
  );

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <SectionHeader title={<>VM Compliance by Cluster <TableMetricsInfo metrics={["Stores", "VM Score", "Planogram", "SOP"]} /></>} actions={toolbarActions} />
      <div className="overflow-x-auto mt-3 -mx-4 px-4">
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {HEADERS.map((h, i) => (
                <th
                  key={h}
                  className={cn(
                    "py-2.5 font-medium text-gray-500 text-xs whitespace-nowrap",
                    i === 0 ? "text-left pl-3 pr-3" : "text-right px-3",
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex items-center gap-1",
                      i > 0 && "w-full justify-end",
                    )}
                  >
                    {h}
                    {i >= 1 && i < HEADERS.length - 1 && <InfoHeaderIcon metricKey={h} />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 && search ? (
              <tr>
                <td colSpan={HEADERS.length} className="py-6">
                  <EmptyState title="No results" description={`No clusters matching "${search}"`} variant="neutral" className="py-6" />
                </td>
              </tr>
            ) : (
              filteredRows.map((row) => (
                <tr key={row.cluster} className="border-b border-gray-50 last:border-0">
                  <td className="py-2.5 pl-3 pr-3 text-sm font-medium text-gray-900 whitespace-nowrap">{row.cluster}</td>
                  <td className="py-2.5 px-3 text-sm text-gray-700 text-right tabular-nums whitespace-nowrap">
                    {row.stores}
                  </td>
                  <td className="py-2.5 px-3 text-sm text-gray-700 text-right tabular-nums whitespace-nowrap">
                    {row.vmScore}
                  </td>
                  <td className="py-2.5 px-3 text-sm text-gray-700 text-right tabular-nums whitespace-nowrap">
                    {row.planogram}
                  </td>
                  <td className="py-2.5 px-3 text-sm text-gray-700 text-right tabular-nums whitespace-nowrap">
                    {row.sop}
                  </td>
                  <td className={cn("py-2.5 px-3 text-sm text-right font-medium", row.statusColor)}>
                    {row.status}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
