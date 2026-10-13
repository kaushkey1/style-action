import { cn, formatNumber } from '@/lib/utils';
import { Badge } from '@/components/ui';
import { useSpacePlanStore } from '../stores/useSpacePlanStore';
import { getFloorLayouts, type CategoryAllocation, type FloorLayout } from '../data/mockSpacePlanningData';

const CATEGORY_COLORS: Record<string, string> = {
  WIW: 'bg-indigo-500',
  WWW: 'bg-violet-500',
  KW: 'bg-emerald-500',
  MC: 'bg-sky-500',
  MF: 'bg-amber-500',
};

// Top-to-bottom display order (highest floor first) — matches the physical layout.
const FLOOR_ORDER: Record<string, number> = {
  Single: 0, Ground: 0, First: 1, Second: 2, Third: 3, Fourth: 4, Fifth: 5, Sixth: 6,
};

// Build the floor layout from each category's real `floor` (category_result_v1.floor).
function layoutsFromCategoryFloors(categories: CategoryAllocation[]): FloorLayout[] {
  const byFloor = new Map<string, FloorLayout['categories']>();
  for (const c of categories) {
    const label = c.floor ?? 'Unassigned';
    const bucket = byFloor.get(label) ?? [];
    bucket.push({ code: c.code, name: c.name, space: c.newSpace });
    byFloor.set(label, bucket);
  }
  return [...byFloor.entries()]
    .map(([label, cats]) => ({ label, categories: cats, totalSpace: cats.reduce((s, c) => s + c.space, 0) }))
    .sort((a, b) => (FLOOR_ORDER[b.label] ?? 99) - (FLOOR_ORDER[a.label] ?? 99));
}

export function FloorsTab(): React.ReactNode {
  const categories = useSpacePlanStore((s) => s.categories);
  const floors = useSpacePlanStore((s) => s.floors);

  if (categories.length === 0) return null;

  // Prefer the real per-category floor from the API; fall back to the count-based
  // template only when floor data is absent (mock stores).
  const hasRealFloors = categories.every((c) => !!c.floor);
  const layouts = hasRealFloors
    ? layoutsFromCategoryFloors(categories)
    : getFloorLayouts(floors, categories);
  const floorCount = hasRealFloors ? layouts.length : floors;
  const plPool = categories.reduce((s, c) => s + c.newSpace, 0);

  return (
    <div className="space-y-4 animate-fadeInUp">
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        {/* eslint-disable-next-line design-system/prefer-section-header -- inline title with config badge */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900">Floor Layout</h3>
          <Badge variant="outline" size="sm">{floorCount}-floor config</Badge>
        </div>

        <div className="space-y-6">
          {layouts.map((floor) => (
            <div key={floor.label}>
              { }
              <div className="flex items-center gap-3 mb-2">
                <Badge variant="default" size="sm">{floor.label}</Badge>
                <span className="text-xs text-gray-500">{formatNumber(floor.totalSpace)} sq ft</span>
              </div>

              {/* Floor blocks — taller for readability */}
              <div className="flex h-20 rounded-lg overflow-hidden border border-gray-200">
                {floor.categories.map((cat) => {
                  const pct = floor.totalSpace > 0 ? (cat.space / floor.totalSpace) * 100 : 0;
                  const bgColor = CATEGORY_COLORS[cat.code] ?? 'bg-gray-400';

                  return (
                    <div
                      key={cat.code}
                      className={cn(
                        bgColor,
                        'flex flex-col items-center justify-center text-white border-r border-white/20 last:border-r-0',
                      )}
                      // eslint-disable-next-line no-restricted-syntax -- dynamic width from data
                      style={{ width: `${Math.max(pct, 8)}%` }}
                      title={`${cat.name}: ${formatNumber(cat.space)} sq ft (${pct.toFixed(1)}%)`}
                    >
                      <span className="text-sm font-semibold">{cat.code}</span>
                      <span className="text-xs opacity-80">{formatNumber(cat.space)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-6 pt-4 border-t border-gray-100 flex-wrap">
          {categories.map((cat) => (
            <div key={cat.code} className="flex items-center gap-1.5">
              <div className={cn('w-3 h-3 rounded', CATEGORY_COLORS[cat.code] ?? 'bg-gray-400')} />
              <span className="text-xs text-gray-700 font-medium">{cat.code}</span>
              <span className="text-xs text-gray-500">{formatNumber(cat.newSpace)}</span>
            </div>
          ))}
          <span className="text-xs text-gray-500 ml-auto font-mono">= {formatNumber(plPool)} sq ft</span>
        </div>
      </div>
    </div>
  );
}
