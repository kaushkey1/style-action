import {
  LayoutGrid,
  Maximize,
  BarChart3,
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Wrench
} from 'lucide-react';
import { Badge, Progress, SectionHeader } from '@/components/ui';
import {cn, getCurrencySymbol} from '@/lib/utils';
import type {
  StoreSpacePlan,
  SegmentSpaceAllocation,
  FixtureAllocation
} from '../data/mockMerchandiseHierarchy';

// ─── Fixture Utilization Component ──────────────────────────────────────────

interface FixtureUtilizationProps {
  fixture: FixtureAllocation;
  compact?: boolean;
}

function FixtureUtilization({ fixture, compact = false }: FixtureUtilizationProps) {
  const utilizationColor = fixture.currentUtilization >= 90 ? 'bg-red-500' :
                          fixture.currentUtilization >= 80 ? 'bg-amber-500' : 'bg-green-500';

  if (compact) {
    return (
      // eslint-disable-next-line design-system/prefer-section-header -- compact fixture row, not a section header
      <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
        <span className="text-xs font-medium text-gray-900">{fixture.fixtureType}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">{fixture.count}x</span>
          <Progress
            value={fixture.currentUtilization}
            max={100}
            className="w-12 h-2"
            indicatorClassName={utilizationColor}
          />
          <span className="text-xs font-medium text-gray-900">{fixture.currentUtilization}%</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      {/* eslint-disable-next-line design-system/prefer-section-header -- fixture card header with badge */}
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-gray-900">{fixture.fixtureType}</h4>
        <Badge
          variant={fixture.currentUtilization >= 90 ? 'destructive' :
                   fixture.currentUtilization >= 80 ? 'warning' : 'success'}
          size="sm"
        >
          {fixture.currentUtilization}% utilized
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <p className="text-xs text-gray-500">Count</p>
          <p className="text-sm font-medium text-gray-900">{fixture.count} units</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Total SFT</p>
          <p className="text-sm font-medium text-gray-900">{fixture.totalSFT} sqft</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Max Capacity</p>
          <p className="text-sm font-medium text-gray-900">{fixture.maxCapacity} options</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">SFT per Unit</p>
          <p className="text-sm font-medium text-gray-900">{fixture.sftPerFixture} sqft</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">Utilization</span>
          <span className="text-gray-900 font-medium">{fixture.currentUtilization}%</span>
        </div>
        <Progress
          value={fixture.currentUtilization}
          max={100}
          className="h-3"
          indicatorClassName={utilizationColor}
        />
      </div>
    </div>
  );
}

// ─── Segment Space Card Component ───────────────────────────────────────────

interface SegmentSpaceCardProps {
  segment: SegmentSpaceAllocation;
  onFixtureClick?: (segment: SegmentSpaceAllocation) => void;
  compact?: boolean;
}

function SegmentSpaceCard({ segment, onFixtureClick, compact = false }: SegmentSpaceCardProps) {
  const efficiencyColor = segment.efficiency >= 95 ? 'text-green-600' :
                         segment.efficiency >= 85 ? 'text-amber-600' : 'text-red-600';

  const efficiencyIcon = segment.efficiency >= 95 ? CheckCircle :
                        segment.efficiency >= 85 ? AlertTriangle : TrendingUp;

  const EfficiencyIcon = efficiencyIcon;

  if (compact) {
    return (
      // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- interactive segment card
      <div
        className="bg-white rounded-lg border border-gray-200 p-3 hover:border-primary/30 transition-colors cursor-pointer"
        onClick={() => onFixtureClick?.(segment)}
      >
        {/* eslint-disable-next-line design-system/prefer-section-header -- compact segment card header */}
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold text-gray-900">{segment.segmentName}</h4>
          <Badge variant="outline" size="sm">{segment.percentage.toFixed(1)}%</Badge>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs mb-2">
          <div>
            <span className="text-gray-500">SFT:</span>
            <span className="ml-1 font-medium text-gray-900">{segment.allocatedSFT.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-gray-500">Fixtures:</span>
            <span className="ml-1 font-medium text-gray-900">{segment.fixtures.length}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <EfficiencyIcon className={cn('w-3 h-3', efficiencyColor)} />
          <span className={cn('text-xs font-medium', efficiencyColor)}>
            {segment.efficiency.toFixed(1)}% efficient
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      {/* eslint-disable-next-line design-system/prefer-section-header -- segment card header with multi-badge layout */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900">{segment.segmentName}</h3>
        <div className="flex items-center gap-2">
          <Badge variant="outline" size="sm">{segment.percentage.toFixed(1)}% of store</Badge>
          <Badge variant={segment.efficiency >= 95 ? 'success' :
                         segment.efficiency >= 85 ? 'warning' : 'destructive'} size="sm">
            {segment.efficiency.toFixed(1)}% efficient
          </Badge>
        </div>
      </div>

      {/* Key Metrics */}
      {/* eslint-disable-next-line design-system/prefer-metric-grid -- embedded metrics within segment card */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Maximize className="w-3 h-3 text-gray-500" />
            <span className="text-xs text-gray-500">Allocated SFT</span>
          </div>
          <p className="text-sm font-semibold text-gray-900">{segment.allocatedSFT.toLocaleString()}</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <LayoutGrid className="w-3 h-3 text-gray-500" />
            <span className="text-xs text-gray-500">Fixtures</span>
          </div>
          <p className="text-sm font-semibold text-gray-900">{segment.fixtures.length} types</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Target className="w-3 h-3 text-gray-500" />
            <span className="text-xs text-gray-500">Planned Rev</span>
          </div>
          <p className="text-sm font-semibold text-gray-900">{getCurrencySymbol()}{(segment.plannedRevenue / 10000000).toFixed(1)} Cr</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <BarChart3 className="w-3 h-3 text-gray-500" />
            <span className="text-xs text-gray-500">Actual Rev</span>
          </div>
          <p className="text-sm font-semibold text-gray-900">
            {getCurrencySymbol()}{segment.actualRevenue ? (segment.actualRevenue / 10000000).toFixed(1) : '0.0'} Cr
          </p>
        </div>
      </div>

      {/* Fixtures */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <Wrench className="w-4 h-4" />
          Fixture Breakdown
        </h4>
        {segment.fixtures.map((fixture, index) => (
          <FixtureUtilization key={index} fixture={fixture} compact />
        ))}
      </div>

      {/* Action Button */}
      <div className="mt-4 pt-3 border-t border-gray-100">
        <button
          onClick={() => onFixtureClick?.(segment)}
          className="w-full text-center text-sm text-primary hover:text-primary/80 font-medium"
        >
          View Fixture Details →
        </button>
      </div>
    </div>
  );
}

// ─── Main Space Planning Panel Component ────────────────────────────────────

interface SpacePlanningPanelProps {
  spacePlan: StoreSpacePlan;
  onSegmentClick?: (segment: SegmentSpaceAllocation) => void;
  compact?: boolean;
}

export function SpacePlanningPanel({
  spacePlan,
  onSegmentClick,
  compact = false
}: SpacePlanningPanelProps) {
  const totalPlannedRevenue = spacePlan.segments.reduce((sum, seg) => sum + seg.plannedRevenue, 0);
  const totalActualRevenue = spacePlan.segments.reduce((sum, seg) => sum + (seg.actualRevenue || 0), 0);
  const overallEfficiency = totalActualRevenue / totalPlannedRevenue * 100;
  const totalFixtures = spacePlan.segments.reduce((sum, seg) => sum + seg.fixtures.length, 0);

  return (
    <div className="space-y-4">
      <SectionHeader
        title={`${spacePlan.storeName} - Space Planning`}
        subtitle={`${spacePlan.totalSFT.toLocaleString()} total SFT • ${spacePlan.segments.length} segments • ${totalFixtures} fixture types`}
        actions={
          <Badge variant={overallEfficiency >= 95 ? 'success' :
                         overallEfficiency >= 85 ? 'warning' : 'destructive'} size="sm">
            {overallEfficiency.toFixed(1)}% efficiency
          </Badge>
        }
      />

      {/* Store Overview */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        {/* eslint-disable-next-line design-system/prefer-metric-grid -- store overview metrics with icons */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Maximize className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-500">Total SFT</span>
            </div>
            <p className="text-lg font-bold text-gray-900">{spacePlan.totalSFT.toLocaleString()}</p>
            <p className="text-xs text-gray-500">square feet</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Target className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-500">Planned Revenue</span>
            </div>
            <p className="text-lg font-bold text-gray-900">{getCurrencySymbol()}{(totalPlannedRevenue / 10000000).toFixed(1)} Cr</p>
            <p className="text-xs text-gray-500">target</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <BarChart3 className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-500">Actual Revenue</span>
            </div>
            <p className="text-lg font-bold text-gray-900">{getCurrencySymbol()}{(totalActualRevenue / 10000000).toFixed(1)} Cr</p>
            <p className="text-xs text-gray-500">achieved</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-500">Efficiency</span>
            </div>
            <p className={cn(
              'text-lg font-bold',
              overallEfficiency >= 95 ? 'text-green-600' :
              overallEfficiency >= 85 ? 'text-amber-600' : 'text-red-600'
            )}>
              {overallEfficiency.toFixed(1)}%
            </p>
            <p className="text-xs text-gray-500">vs plan</p>
          </div>
        </div>
      </div>

      {/* Segment Breakdown */}
      {compact ? (
        // eslint-disable-next-line design-system/prefer-metric-grid -- card grid layout, not metric grid
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {spacePlan.segments.map((segment) => (
            <SegmentSpaceCard
              key={segment.segmentId}
              segment={segment}
              onFixtureClick={onSegmentClick}
              compact
            />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {spacePlan.segments.map((segment) => (
            <SegmentSpaceCard
              key={segment.segmentId}
              segment={segment}
              onFixtureClick={onSegmentClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Store SFT Distribution Chart Component ─────────────────────────────────

interface SFTDistributionProps {
  segments: SegmentSpaceAllocation[];
}

export function SFTDistribution({ segments }: SFTDistributionProps) {
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-yellow-500',
    'bg-red-500',
    'bg-indigo-500',
    'bg-pink-500',
    'bg-gray-500'
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Store SFT Distribution</h3>

      {/* Visual Bar */}
      <div className="flex h-8 rounded-lg overflow-hidden bg-gray-100 mb-4">
        {segments.map((segment, index) => (
          <div
            key={segment.segmentId}
            className={cn(colors[index % colors.length], 'transition-all duration-200')}
            style={{ width: `${segment.percentage}%` }} // eslint-disable-line no-restricted-syntax -- dynamic width
            title={`${segment.segmentName}: ${segment.percentage.toFixed(1)}%`}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-2">
        {segments.map((segment, index) => (
          <div key={segment.segmentId} className="flex items-center gap-2">
            <div className={cn('w-3 h-3 rounded', colors[index % colors.length])} />
            <span className="text-sm text-gray-700">{segment.segmentName}</span>
            <span className="text-xs text-gray-500">{segment.percentage.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}