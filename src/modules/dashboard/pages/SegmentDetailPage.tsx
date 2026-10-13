import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { EmptyState, FilterSearch, TableMetricsInfo } from '@/components/ui';
import { AOPMobileCard } from '@/modules/aop/components/AOPMobileCard';
import { consumeSegmentDrill } from '../stores/segmentDrillStore';
import { stripIndexPrefix } from '@/modules/category-director/lib/apiAdapters';
import type { DrilldownRow } from '../types/businessPulseUi';

export function SegmentDetailPage(): React.ReactNode {
  const { segmentName } = useParams();
  const navigate = useNavigate();
  const decodedName = segmentName ? decodeURIComponent(segmentName) : '';
  const [search, setSearch] = useState('');

  // Hide bottom nav bar on detail pages — user is deep-diving
  useEffect(() => {
    const bottomNav = document.querySelector(
      'nav[aria-label="Bottom navigation"]',
    ) as HTMLElement | null;
    if (bottomNav) bottomNav.style.display = "none";
    return () => {
      if (bottomNav) bottomNav.style.display = "";
    };
  }, []);

  // Consume drill data once via lazy initializer
  const [data] = useState(() => consumeSegmentDrill());
  const headers: string[] = data?.headers ?? [];

  // Drill stack for multi-level: Segment (L1) → Class (L2) → Brick (L3)
  const [drillStack, setDrillStack] = useState<DrilldownRow[]>([]);

  // Current level: root children or deeper drill
  const currentRow = drillStack.length > 0 ? drillStack[drillStack.length - 1] : data?.row ?? null;
  const currentChildren: DrilldownRow[] = currentRow?.children ?? [];

  // Breadcrumb trail. Apply stripIndexPrefix defensively so prefixed names
  // (e.g. "9. WESTERN TOPS") never show as crumbs.
  const breadcrumbs = useMemo(() => {
    const trail = [stripIndexPrefix(decodedName)];
    for (const row of drillStack) {
      trail.push(stripIndexPrefix(row.name));
    }
    return trail;
  }, [decodedName, drillStack]);

  // KPI values from current level's parent
  const kpiRow = drillStack.length > 0 ? drillStack[drillStack.length - 1] : data?.row ?? null;

  const filteredChildren = search.trim()
    ? currentChildren.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
    : currentChildren;

  function handleBack() {
    if (drillStack.length > 0) {
      setDrillStack(drillStack.slice(0, -1));
      setSearch('');
    } else {
      navigate('/dashboard');
    }
  }

  function handleCardClick(child: DrilldownRow) {
    if (child.children?.length) {
      setDrillStack([...drillStack, child]);
      setSearch('');
    }
  }

  // Full-screen overlay matching AOP drill-down pattern
  return (
    <div className="fixed left-0 right-0 top-[calc(3.5rem+env(safe-area-inset-top,0px))] bottom-0 z-[35] bg-gray-50 overflow-y-auto lg:hidden">
      {/* Sticky header */}
      { }
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
                        // Navigate back to this breadcrumb level
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
            {kpiRow.values.map((val, i) => (
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
            description="Navigate from the dashboard to view segment details."
            variant="neutral"
          />
        ) : currentChildren.length === 0 ? (
          <EmptyState
            title="No breakdown data"
            description={`No sub-items found for ${breadcrumbs[breadcrumbs.length - 1]}.`}
            variant="neutral"
          />
        ) : (
          <>
            {currentChildren.length > 5 && (
              <div className="mb-3">
                <FilterSearch
                  placeholder="Search..."
                  value={search}
                  onChange={setSearch}
                />
              </div>
            )}
            <div className="space-y-3">
              {filteredChildren.map((child) => {
                const hasChildren = !!child.children?.length;
                return (
                  <AOPMobileCard
                    key={child.id}
                    title={child.name}
                    metrics={child.values.map((val, i) => ({
                      label: headers[i + 1] ?? '',
                      value: val,
                    }))}
                    onClick={() => handleCardClick(child)}
                    showChevron={hasChildren}
                    className={!hasChildren ? 'cursor-default' : undefined}
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
