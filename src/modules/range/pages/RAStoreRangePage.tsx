import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TrendingUp, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Download } from "lucide-react";
import { useDownload } from "@/hooks/useDownload";
import { IMPETUS_APP_BASE } from "@/lib/api";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  PageHeader,
  FilterBar,
  FilterSelect,
  EmptyState,
  Badge,
  Button,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { mockStoreRangeData, type StoreRangeData, mockHits, getActiveHit } from "../data/mockRangeArchitecture";

type SortField =
  | "storeName"
  | "storeGrade"
  | "city"
  | "storeRank"
  | "totalOptions"
  | "aopAchievement"
  | "otbFit"
  | "fixtureUtilization";
type SortDirection = "asc" | "desc";

function SortIcon({
  field,
  sortField,
  sortDirection,
}: {
  field: SortField;
  sortField: SortField;
  sortDirection: SortDirection;
}) {
  if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-gray-400" />;
  return sortDirection === "asc" ? (
    <ArrowUp className="w-3 h-3 text-primary" />
  ) : (
    <ArrowDown className="w-3 h-3 text-primary" />
  );
}

export default function RAStoreRangePage() {
  const navigate = useNavigate();
  const { download, isDownloading } = useDownload(IMPETUS_APP_BASE);
  const [stores] = useState<StoreRangeData[]>(mockStoreRangeData);
  const [selectedHit] = useState(getActiveHit());
  const [filters, setFilters] = useState({
    grade: "all",
    state: "all",
    city: "all",
    store: "all",
  });
  const [sortField, setSortField] = useState<SortField>("storeRank");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Compute filtered stores directly
  let filteredStores = [...stores];
  if (filters.grade !== "all") {
    filteredStores = filteredStores.filter((s) => s.storeGrade === filters.grade);
  }
  if (filters.state !== "all") {
    filteredStores = filteredStores.filter((s) => s.state === filters.state);
  }
  if (filters.city !== "all") {
    filteredStores = filteredStores.filter((s) => s.city === filters.city);
  }
  if (filters.store !== "all") {
    filteredStores = filteredStores.filter((s) => s.id === filters.store);
  }

  // Sort filtered stores
  filteredStores.sort((a, b) => {
    const direction = sortDirection === "asc" ? 1 : -1;

    switch (sortField) {
      case "storeName":
        return direction * a.storeName.localeCompare(b.storeName);
      case "storeGrade":
        return direction * a.storeGrade.localeCompare(b.storeGrade);
      case "city":
        return direction * a.city.localeCompare(b.city);
      case "storeRank":
        return direction * (a.storeRank - b.storeRank);
      case "totalOptions":
        return direction * (a.totalOptions - b.totalOptions);
      case "aopAchievement":
        return direction * (a.aopAchievement - b.aopAchievement);
      case "otbFit":
        return direction * (a.otbFit - b.otbFit);
      case "fixtureUtilization":
        return direction * (a.fixtureUtilization - b.fixtureUtilization);
      default:
        return 0;
    }
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleFilterChange = (filterKey: keyof typeof filters, value: string) => {
    setFilters((prev) => ({ ...prev, [filterKey]: value }));
  };

  // Get unique values for dropdowns
  const grades = ["all", ...Array.from(new Set(stores.map((s) => s.storeGrade)))];
  const states = ["all", ...Array.from(new Set(stores.map((s) => s.state)))];
  const cities = ["all", ...Array.from(new Set(stores.map((s) => s.city)))];

  // Calculate summary stats
  const summaryStats = {
    totalStores: filteredStores.length,
    uniqueOptions: filteredStores.reduce((sum, store) => sum + store.totalOptions, 0),
    avgAopAchievement: Math.round(
      filteredStores.reduce((sum, store) => sum + store.aopAchievement, 0) / (filteredStores.length || 1),
    ),
    avgOtbUtilization: Math.round(
      filteredStores.reduce((sum, store) => sum + store.otbFit, 0) / (filteredStores.length || 1),
    ),
  };

  const getGradeBadgeColor = (grade: string) => {
    switch (grade) {
      case "A0":
        return "bg-indigo-100 text-primary-700 border-indigo-200";
      case "A1":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "A2":
        return "bg-cyan-100 text-cyan-700 border-cyan-200";
      case "A3":
        return "bg-teal-100 text-teal-700 border-teal-200";
      case "B":
        return "bg-gray-100 text-gray-700 border-gray-200";
      default:
        return "bg-gray-50 text-gray-600 border-gray-200";
    }
  };

  const getPerformanceVariant = (value: number, type: "achievement" | "utilization") => {
    if (type === "achievement") {
      if (value >= 90) return "success" as const;
      if (value >= 80) return "default" as const;
      if (value >= 70) return "warning" as const;
      return "error" as const;
    } else {
      if (value >= 85) return "success" as const;
      if (value >= 75) return "default" as const;
      if (value >= 65) return "warning" as const;
      return "error" as const;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <PageHeader
        title="Range Architecture"
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => download("/range/stores", "range_stores.xlsx", { params: { hit: selectedHit.id } })}
              disabled={isDownloading}
              className="shrink-0"
            >
              <Download className="w-4 h-4 mr-1.5" />
              {isDownloading ? "Downloading..." : "Download"}
            </Button>
            <Select value={selectedHit.id} disabled>
              <SelectTrigger className="w-40">
                <SelectValue>
                  <span className="text-sm font-medium">{selectedHit.name}</span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {mockHits.map((hit) => (
                  <SelectItem key={hit.id} value={hit.id}>
                    {hit.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        }
        tabs={[
          { label: "Network Overview", isActive: false, onClick: () => navigate("/range") },
          { label: "Store Range", isActive: true },
        ]}
      />

      {/* Filters and Summary */}
      <div className="px-6 py-4">
        {/* Filter Bar */}
        <FilterBar>
          <FilterSelect
            value={filters.grade}
            onChange={(value: string) => handleFilterChange("grade", value)}
            placeholder="Grade"
            options={grades.map((g) => ({ value: g, label: g === "all" ? "All Grades" : `Grade ${g}` }))}
            searchable
          />
          <FilterSelect
            value={filters.state}
            onChange={(value: string) => handleFilterChange("state", value)}
            placeholder="State"
            options={states.map((s) => ({ value: s, label: s === "all" ? "All States" : s }))}
            searchable
          />
          <FilterSelect
            value={filters.city}
            onChange={(value: string) => handleFilterChange("city", value)}
            placeholder="City"
            options={cities.map((c) => ({ value: c, label: c === "all" ? "All Cities" : c }))}
            searchable
          />
          <FilterSelect
            value={filters.store}
            onChange={(value: string) => handleFilterChange("store", value)}
            placeholder="Store"
            options={[
              { value: "all", label: "All Stores" },
              ...stores.map((s) => ({ value: s.id, label: s.storeName })),
            ]}
            searchable
          />
        </FilterBar>

        {/* Summary Stats */}
        <div className="mt-4 text-sm text-gray-600">
          <span className="font-semibold text-gray-900">{summaryStats.totalStores} stores</span> ·
          <span className="ml-2">{(summaryStats.uniqueOptions / 1000).toFixed(1)} K unique options</span> ·
          <span className="ml-2">Avg AOP Achievement {summaryStats.avgAopAchievement}%</span> ·
          <span className="ml-2">Average OTB Utilization {summaryStats.avgOtbUtilization}%</span>
        </div>
      </div>

      {/* Store Table */}
      <div className="px-6 pb-6">
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left px-4 py-2">
                    <button
                      onClick={() => handleSort("storeName")}
                      className="flex items-center gap-1 text-xs uppercase text-gray-500 font-medium hover:text-gray-700"
                    >
                      Store
                      <SortIcon field="storeName" sortField={sortField} sortDirection={sortDirection} />
                    </button>
                  </th>
                  <th className="text-left px-3 py-2">
                    <button
                      onClick={() => handleSort("storeGrade")}
                      className="flex items-center gap-1 text-xs uppercase text-gray-500 font-medium hover:text-gray-700"
                    >
                      Grade
                      <SortIcon field="storeGrade" sortField={sortField} sortDirection={sortDirection} />
                    </button>
                  </th>
                  <th className="text-left px-3 py-2">
                    <button
                      onClick={() => handleSort("city")}
                      className="flex items-center gap-1 text-xs uppercase text-gray-500 font-medium hover:text-gray-700"
                    >
                      Location
                      <SortIcon field="city" sortField={sortField} sortDirection={sortDirection} />
                    </button>
                  </th>
                  <th className="text-center px-3 py-2">
                    <button
                      onClick={() => handleSort("storeRank")}
                      className="flex items-center justify-center gap-1 text-xs uppercase text-gray-500 font-medium hover:text-gray-700 w-full"
                    >
                      Rank
                      <SortIcon field="storeRank" sortField={sortField} sortDirection={sortDirection} />
                    </button>
                  </th>
                  <th className="text-right px-3 py-2">
                    <button
                      onClick={() => handleSort("totalOptions")}
                      className="flex items-center justify-end gap-1 text-xs uppercase text-gray-500 font-medium hover:text-gray-700 w-full"
                    >
                      Options
                      <SortIcon field="totalOptions" sortField={sortField} sortDirection={sortDirection} />
                    </button>
                  </th>
                  <th className="text-right px-3 py-2">
                    <button
                      onClick={() => handleSort("aopAchievement")}
                      className="flex items-center justify-end gap-1 text-xs uppercase text-gray-500 font-medium hover:text-gray-700 w-full"
                    >
                      AOP Achv
                      <SortIcon field="aopAchievement" sortField={sortField} sortDirection={sortDirection} />
                    </button>
                  </th>
                  <th className="text-right px-3 py-2">
                    <button
                      onClick={() => handleSort("otbFit")}
                      className="flex items-center justify-end gap-1 text-xs uppercase text-gray-500 font-medium hover:text-gray-700 w-full"
                    >
                      OTB Fit
                      <SortIcon field="otbFit" sortField={sortField} sortDirection={sortDirection} />
                    </button>
                  </th>
                  <th className="text-right px-3 py-2">
                    <button
                      onClick={() => handleSort("fixtureUtilization")}
                      className="flex items-center justify-end gap-1 text-xs uppercase text-gray-500 font-medium hover:text-gray-700 w-full"
                    >
                      Fixture Util
                      <SortIcon field="fixtureUtilization" sortField={sortField} sortDirection={sortDirection} />
                    </button>
                  </th>
                  <th className="text-center px-3 py-2 text-xs uppercase text-gray-500 font-medium">Segments</th>
                  <th className="text-center px-3 py-2 text-xs uppercase text-gray-500 font-medium">Fixtures</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredStores.map((store) => (
                  <tr
                    key={store.id}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/range/store/${store.id}`)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{store.storeName}</div>
                          <div className="text-xs text-gray-500">{store.storeCode}</div>
                        </div>
                        {store.isTopPerformer && <TrendingUp className="w-4 h-4 text-green-600 flex-shrink-0" />}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold rounded border",
                          getGradeBadgeColor(store.storeGrade),
                        )}
                      >
                        {store.storeGrade}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="text-sm text-gray-900">{store.city}</div>
                      <div className="text-xs text-gray-500">{store.state}</div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      {store.isTopPerformer ? (
                        <span className="inline-flex items-center gap-1 text-sm font-medium text-green-700">
                          #{store.storeRank}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-600">#{store.storeRank}</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <span className="text-sm font-medium text-gray-900">{store.totalOptions.toLocaleString()}</span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <Badge variant={getPerformanceVariant(store.aopAchievement, "achievement")} size="sm">
                        {store.aopAchievement}%
                      </Badge>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <Badge variant={getPerformanceVariant(store.otbFit, "utilization")} size="sm">
                        {store.otbFit}%
                      </Badge>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <Badge variant={getPerformanceVariant(store.fixtureUtilization, "utilization")} size="sm">
                        {store.fixtureUtilization}%
                      </Badge>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="text-sm text-gray-600">{store.segmentCount}</span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="text-sm text-gray-600">{store.fixtureCount}</span>
                    </td>
                    <td className="px-3 py-3">
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredStores.length === 0 && (
            <EmptyState title="No stores found" description="No stores match the selected filters" />
          )}
        </div>
      </div>
    </div>
  );
}
