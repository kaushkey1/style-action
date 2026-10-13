import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { EmptyState, TableMetricsInfo, TableToolbar } from '@/components/ui';
import { cn } from '@/lib/utils';
import { useTableSearchSort } from '@/hooks/useTableSearchSort';
import { consumeSubcategoryDrill } from '../stores/subcategoryDrillStore';
import { stripIndexPrefix } from '../lib/apiAdapters';
import type { DrilldownTableRow } from '../data/mockCategoryDirectorData';

function parseNumeric(value: string | number | undefined): number {
  if (value == null) return 0;
  const cleaned = String(value).replace(/[^\d.-]/g, '');
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

// ---------------------------------------------------------------------------
// DrillCard — self-contained card for child items
// ---------------------------------------------------------------------------

function DrillCard({
  title,
  metrics,
  onClick,
  showChevron,
}: {
  title: string;
  metrics: { label: string; value: string | number }[];
  onClick?: () => void;
  showChevron?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full bg-white rounded-lg border border-gray-200 p-3 text-left transition-all duration-150',
        showChevron ? 'hover:border-gray-300 hover:shadow-sm active:bg-gray-50' : 'cursor-default',
      )}
    >
      {/* eslint-disable-next-line design-system/prefer-section-header -- mobile drill card title, not a section header */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold text-gray-900">{title}</p>
        {showChevron && <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />}
      </div>
      {/* eslint-disable-next-line design-system/prefer-metric-grid -- dynamic drill card with variable columns from data */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2">
        {metrics.map((m) => (
          <div key={m.label}>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">{m.label}</p>
            <p className="text-sm font-medium text-gray-900">{m.value}</p>
          </div>
        ))}
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// SubcategoryDrilldownPage — full-screen mobile drilldown overlay.
// Hierarchy: Category (L1) → Subcategory (L2). No third "brick" level.
// ---------------------------------------------------------------------------

export function SubcategoryDrilldownPage(): React.ReactNode {
  const { categoryName } = useParams();
  const navigate = useNavigate();
  const decodedName = categoryName ? decodeURIComponent(categoryName) : '';

  // Hide bottom nav bar on detail pages — user is deep-diving
  useEffect(() => {
    const bottomNav = document.querySelector(
      'nav[aria-label="Bottom navigation"]',
    ) as HTMLElement | null;
    if (bottomNav) bottomNav.style.display = 'none';
    return () => {
      if (bottomNav) bottomNav.style.display = '';
    };
  }, []);

  // On desktop (lg+), redirect back — desktop uses inline expand
  useEffect(() => {
    const mql = window.matchMedia('(min-width: 1024px)');
    if (mql.matches) {
      navigate('/dashboard', { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Only run on mount
  }, []);

  // Consume drill data once via lazy initializer
  const [data] = useState(() => consumeSubcategoryDrill());
  const headers: string[] = useMemo(() => data?.headers ?? [], [data]);

  // Drill stack now supports just one level beyond the entry point
  // (Category → Subcategory). Kept as a stack so the back-button breadcrumb
  // pattern continues to work if PM ever re-adds depth.
  const [drillStack, setDrillStack] = useState<DrilldownTableRow[]>([]);

  const currentRow = drillStack.length > 0 ? drillStack[drillStack.length - 1] : data?.row ?? null;
  const currentChildren: DrilldownTableRow[] = currentRow?.children ?? [];

  const breadcrumbs = useMemo(() => {
    // Defensive: cells[0] and URL params are now stripped at source, but apply
    // stripIndexPrefix in case any legacy prefixed string slips through.
    const trail = [stripIndexPrefix(decodedName)];
    for (const row of drillStack) {
      trail.push(stripIndexPrefix(String(row.cells[0])));
    }
    return trail;
  }, [decodedName, drillStack]);

  const kpiRow = drillStack.length > 0 ? drillStack[drillStack.length - 1] : data?.row ?? null;

  const sortFields: Record<string, (r: DrilldownTableRow) => number> = useMemo(() => {
    const fields: Record<string, (r: DrilldownTableRow) => number> = {};
    headers.slice(1).forEach((h, i) => {
      fields[h] = (r) => parseNumeric(r.cells[i + 1]);
    });
    return fields;
  }, [headers]);
  const sortColumns = useMemo(
    () => Object.keys(sortFields).map((k) => ({ key: k, label: k })),
    [sortFields],
  );

  const { search, setSearch, sortKey, sortDir, setSortKey, setSortDir, filteredRows: filteredChildren } =
    useTableSearchSort(currentChildren, {
      searchField: (r) => String(r.cells[0]),
      sortFields,
    });

  function handleBack() {
    if (drillStack.length > 0) {
      setDrillStack(drillStack.slice(0, -1));
      setSearch('');
    } else {
      navigate('/dashboard');
    }
  }

  function handleCardClick(child: DrilldownTableRow) {
    if (child.children?.length) {
      setDrillStack([...drillStack, child]);
      setSearch('');
    }
  }

  return (
    <div className="fixed left-0 right-0 top-[calc(3.5rem+env(safe-area-inset-top,0px))] bottom-0 z-[35] bg-gray-50 overflow-y-auto lg:hidden">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-2 min-w-0">
          <button
            className="p-1.5 -ml-1.5 text-gray-500 hover:text-gray-700"
            onClick={handleBack}
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-1 text-sm min-w-0 truncate flex-1">
            {breadcrumbs.map((crumb, i) => {
              const isLast = i === breadcrumbs.length - 1;
              return (
                <span key={i} className="flex items-center gap-1 min-w-0">
                  {i > 0 && <span className="text-gray-400 shrink-0">&rsaquo;</span>}
                  {isLast ? (
                    <span className="font-semibold text-gray-900 truncate">{crumb}</span>
                  ) : (
                    <button
                      onClick={() => {
                        setDrillStack(drillStack.slice(0, i));
                        setSearch('');
                      }}
                      className="text-gray-500 hover:text-gray-900 truncate"
                    >
                      {crumb}
                    </button>
                  )}
                </span>
              );
            })}
          </div>
          {headers.length > 1 && <TableMetricsInfo metrics={headers.slice(1)} />}
        </div>
      </div>

      {/* Summary KPI grid */}
      {kpiRow && (
        <div className="p-4">
          {/* eslint-disable-next-line design-system/prefer-metric-grid -- dynamic KPI grid from drill data */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {kpiRow.cells.slice(1).map((val, i) => (
              <div key={headers[i + 1] ?? i} className="bg-white rounded-lg border border-gray-200 p-3">
                <p className="text-xs text-gray-500 uppercase tracking-wider">{headers[i + 1] ?? ''}</p>
                <p className="text-lg font-bold text-gray-900 mt-0.5">{val}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="px-4 pb-4 pb-safe">
        {!data ? (
          <EmptyState
            title="No data available"
            description="Navigate from the category dashboard to view subcategory details."
            variant="neutral"
          />
        ) : currentChildren.length === 0 ? (
          <EmptyState
            title="No breakdown data"
            description={`No subcategories found for ${breadcrumbs[breadcrumbs.length - 1]}.`}
            variant="neutral"
          />
        ) : (
          <>
            <div className="mb-3">
              <TableToolbar
                search={search}
                onSearchChange={setSearch}
                searchPlaceholder="Search..."
                sortColumns={sortColumns}
                sortKey={sortKey}
                sortDir={sortDir}
                onSortChange={(k, d) => { setSortKey(k); setSortDir(d); }}
              />
            </div>
            <div className="space-y-3">
              {filteredChildren.map((child) => {
                const childName = String(child.cells[0]);
                const hasChildren = !!child.children?.length;
                return (
                  <DrillCard
                    key={childName}
                    title={childName}
                    metrics={child.cells.slice(1).map((val, i) => ({
                      label: headers[i + 1] ?? '',
                      value: val,
                    }))}
                    onClick={() => handleCardClick(child)}
                    showChevron={hasChildren}
                  />
                );
              })}
              {search && filteredChildren.length === 0 && (
                <EmptyState title="No results" description={`No items matching "${search}"`} variant="neutral" />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
