import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import {
  SectionHeader,
  EmptyState,
  Badge,
  KpiLabel,
  MetricGrid,
  MetricCard,
} from '@/components/ui';
import {
  storeSpaceProfiles,
  getStoreSegmentBricks,
} from '@/data/mockSpacePlanning'; // mock-ok — config lookup
import type {
  SegmentBrickPlan,
  BrickAllocation,
} from '@/data/mockSpacePlanning';
import {
  fixtureProportionRules,
  seasonalFixtureCalendar,
} from '@/data/mockFixtureProportions'; // mock-ok — config lookup
import { getStoreById } from '@/modules/aop/data/mockAOPStorePlans'; // mock-ok — config lookup

interface SpaceAOPTabProps {
  storeId: string;
}

export function SpaceAOPTab({ storeId }: SpaceAOPTabProps) {
  const profile = useMemo(
    () => storeSpaceProfiles.find((p) => p.storeId === storeId),
    [storeId]
  );
  const aopStore = useMemo(() => getStoreById(storeId), [storeId]);

  // Memoize expensive brick calculation
  const brickPlan = useMemo(() => {
    const aopSegments = aopStore?.segments.map((s) => ({
      segmentId: s.segmentId,
      annualRevenue: s.annualRevenue,
    }));
    return getStoreSegmentBricks(storeId, aopSegments);
  }, [storeId, aopStore]);

  // Get active fixture proportions (current period from calendar)
  const activeCalendar = useMemo(
    () => seasonalFixtureCalendar.find((c) => c.status === 'active'),
    []
  );
  const activePeriod = activeCalendar?.period ?? 'regular';
  const activeRules = useMemo(
    () => fixtureProportionRules.filter((r) => r.period === activePeriod),
    [activePeriod]
  );

  // Expandable segments state
  const [expandedSegments, setExpandedSegments] = useState<Set<string>>(
    new Set()
  );
  const toggleSegment = (code: string) => {
    setExpandedSegments((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  if (!profile) {
    return <EmptyState description="Store profile not found" />;
  }

  return (
    <div className="space-y-4">
      {/* Section 1: Store Space Summary */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <SectionHeader title="Space & AOP Summary" className="mb-4" />
        <MetricGrid columns={4}>
          <MetricCard
            label={<KpiLabel abbr="SPSF" />}
            value={`₹${profile.spsf}`}
          />
          <MetricCard
            label={<KpiLabel abbr="GMROF" />}
            value={`₹${profile.gmrof}`}
          />
          <MetricCard
            label="Carpet Area"
            value={`${profile.carpetArea.toLocaleString()} SFT`}
          />
          <MetricCard
            label="Saleable Area"
            value={`${profile.saleableArea.toLocaleString()} SFT`}
          />
          {aopStore && (
            <MetricCard
              label="AOP Target"
              value={`₹${aopStore.annualRevenue.toFixed(2)} Cr`}
            />
          )}
        </MetricGrid>
      </div>

      {/* Section 2: Segment × Brick Planning Table */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <SectionHeader title="Segment × Brick Capacity" className="mb-4" />
        {brickPlan.segments.length === 0 ? (
          <EmptyState description="No segment planning data available" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-medium text-gray-500 pb-3">
                    Segment
                  </th>
                  <th className="text-right text-xs font-medium text-gray-500 pb-3">
                    SFT
                  </th>
                  <th className="text-right text-xs font-medium text-gray-500 pb-3">
                    AOP Target
                  </th>
                  <th className="text-right text-xs font-medium text-gray-500 pb-3">
                    Space Capacity
                  </th>
                  <th className="text-right text-xs font-medium text-gray-500 pb-3">
                    Cap vs AOP
                  </th>
                  <th className="text-center text-xs font-medium text-gray-500 pb-3 w-12"></th>
                </tr>
              </thead>
              <tbody>
                {brickPlan.segments.map((segment) => (
                  <SegmentRow
                    key={segment.segmentCode}
                    segment={segment}
                    isExpanded={expandedSegments.has(segment.segmentCode)}
                    onToggle={() => toggleSegment(segment.segmentCode)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Section 3: Fixture Proportions (Current Period) */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <SectionHeader
          title="Fixture Markdown Proportions"
          className="mb-4"
        />
        {activeCalendar && (
          <div className="text-sm text-gray-700 mb-4">
            Current Period: <span className="font-semibold">{activeCalendar.label}</span>
          </div>
        )}
        {activeRules.length === 0 ? (
          <EmptyState description="No fixture proportion rules for current period" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-medium text-gray-500 pb-3">
                    Segment
                  </th>
                  <th className="text-right text-xs font-medium text-gray-500 pb-3">
                    Regular %
                  </th>
                  <th className="text-right text-xs font-medium text-gray-500 pb-3">
                    Markdown %
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 pb-3 pl-4">
                    Display Priority
                  </th>
                  <th className="text-right text-xs font-medium text-gray-500 pb-3">
                    Max Depth
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 pb-3 pl-4">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody>
                {activeRules.map((rule) => (
                  <tr key={rule.id} className="border-b border-gray-50">
                    <td className="py-3 text-sm text-gray-900">
                      {rule.segmentName}
                    </td>
                    <td className="py-3 text-sm text-gray-700 text-right tabular-nums">
                      {rule.regularFixturePct}%
                    </td>
                    <td className="py-3 text-sm text-gray-700 text-right tabular-nums">
                      {rule.markdownFixturePct}%
                    </td>
                    <td className="py-3 text-sm text-gray-700 pl-4 capitalize">
                      {rule.displayPriority}
                    </td>
                    <td className="py-3 text-sm text-gray-700 text-right tabular-nums">
                      {rule.maxMarkdownDepth}
                    </td>
                    <td className="py-3 text-xs text-gray-500 pl-4">
                      {rule.notes}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

interface SegmentRowProps {
  segment: SegmentBrickPlan;
  isExpanded: boolean;
  onToggle: () => void;
}

function SegmentRow({ segment, isExpanded, onToggle }: SegmentRowProps) {
  const capacityColor =
    segment.capacityVsAopPct >= 100
      ? 'text-green-700'
      : segment.capacityVsAopPct >= 90
        ? 'text-amber-700'
        : 'text-red-700';

  return (
    <>
      {/* Main segment row */}
      <tr className="border-b border-gray-50 hover:bg-gray-50">
        <td className="py-3 text-sm">
          <button
            onClick={onToggle}
            className="flex items-center gap-2 text-gray-900 hover:text-gray-700 transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
            <span className="font-semibold">{segment.segmentName}</span>
          </button>
        </td>
        <td className="py-3 text-sm text-gray-700 text-right tabular-nums">
          {segment.totalSft.toLocaleString()}
        </td>
        <td className="py-3 text-sm text-gray-700 text-right tabular-nums">
          ₹{segment.aopTargetLakhs}L
        </td>
        <td className="py-3 text-sm text-gray-700 text-right tabular-nums">
          ₹{segment.spaceCapacityLakhs}L
        </td>
        <td
          className={`py-3 text-sm text-right tabular-nums font-semibold ${capacityColor}`}
        >
          {segment.capacityVsAopPct.toFixed(1)}%
        </td>
        <td className="py-3 text-center">
          <button
            onClick={onToggle}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        </td>
      </tr>

      {/* Expanded brick rows */}
      {isExpanded &&
        segment.bricks.map((brick) => (
          <BrickRow key={brick.brickCode} brick={brick} />
        ))}
    </>
  );
}

interface BrickRowProps {
  brick: BrickAllocation;
}

function BrickRow({ brick }: BrickRowProps) {
  const fashionGradeVariant = (
    grade: BrickAllocation['fashionGrade']
  ): 'success' | 'default' | 'warning' | 'destructive' => {
    switch (grade) {
      case 'Core':
        return 'success';
      case 'Ultimate':
        return 'default';
      case 'Fashion':
        return 'warning';
      case 'Fast Fashion':
        return 'destructive';
    }
  };

  return (
    <tr className="border-b border-gray-50 bg-gray-50">
      <td className="py-3 text-sm text-gray-700 pl-8">
        <span className="text-gray-400 mr-2">└</span>
        {brick.brickName}
      </td>
      <td className="py-3 text-sm text-gray-700 text-right tabular-nums">
        {brick.sft}
      </td>
      <td className="py-3 text-sm text-gray-500 text-right">—</td>
      <td className="py-3 text-sm text-gray-700 text-right tabular-nums">
        ₹{brick.nsvCapacityLakhs}L
      </td>
      <td className="py-3 text-sm text-right">
        <Badge variant={fashionGradeVariant(brick.fashionGrade)} size="sm">
          {brick.fashionGrade}
        </Badge>
      </td>
      <td className="py-3 text-sm text-gray-700 text-center tabular-nums">
        {brick.fixtures}
      </td>
    </tr>
  );
}
