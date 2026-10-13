import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, BarChart3, CheckCircle2, ShieldCheck, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  MetricCard,
  MetricGrid,
  SectionHeader,
  Badge,
  Progress,
  EmptyState,
  DataTable,
  DataTableHeader,
  DataTableBody,
  DataTableRow,
  DataTableHead,
  DataTableCell,
} from '@/components/ui';
import { useShowroomCurationStore } from '../stores/useShowroomCurationStore';
import type { CollectionProgress } from '../types/showroom-types';

// ── Status config ──────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<CollectionProgress['status'], { label: string; variant: 'default' | 'warning' | 'info' | 'primary' | 'success' }> = {
  not_started: { label: 'Not Started', variant: 'default' },
  designer_review: { label: 'Designer Review', variant: 'warning' },
  buyer_review: { label: 'Buyer Review', variant: 'info' },
  cat_head_review: { label: 'Cat Head Review', variant: 'primary' },
  finalized: { label: 'Finalized', variant: 'success' },
};

// ── Curation Funnel ────────────────────────────────────────────────────────

interface FunnelData {
  pool: number;
  designer: number;
  buyer: number;
  final: number;
}

function CurationFunnel({ data }: { data: FunnelData }) {
  const { pool, designer, buyer, final: finalCount } = data;
  const isEmpty = pool === 0 && designer === 0 && buyer === 0 && finalCount === 0;

  const stages = [
    { label: 'Pool', count: pool },
    { label: 'Designer', count: designer },
    { label: 'Buyer', count: buyer },
    { label: 'Final', count: finalCount },
  ];

  // Compute conversion rates between stages
  const conversionRates = [
    pool > 0 ? Math.round((designer / pool) * 100) : 0,
    designer > 0 ? Math.round((buyer / designer) * 100) : 0,
    buyer > 0 ? Math.round((finalCount / buyer) * 100) : 0,
  ];

  // SVG dimensions
  const svgWidth = 600;
  const svgHeight = 120;
  const stageWidth = 130;
  const gapWidth = 20;
  const startX = (svgWidth - (stageWidth * 4 + gapWidth * 3)) / 2;

  // Max height for the tallest stage, narrowing for each subsequent stage
  const maxHeight = 90;
  const heights = isEmpty
    ? [maxHeight, maxHeight, maxHeight, maxHeight]
    : [
        maxHeight,
        maxHeight * 0.75,
        maxHeight * 0.55,
        maxHeight * 0.4,
      ];

  const centerY = svgHeight / 2;

  // Colors for each stage
  const fills = ['#e0e7ff', '#c7d2fe', '#a5b4fc', '#818cf8'];
  const strokes = ['#6366f1', '#6366f1', '#6366f1', '#6366f1'];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <SectionHeader title="Curation Funnel" subtitle="Style pipeline from pool to final approval" />
      <div className="flex justify-center overflow-x-auto">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full max-w-[600px]"
          role="img"
          aria-label="Curation funnel showing style progression from pool to final approval"
        >
          {stages.map((stage, i) => {
            const x = startX + i * (stageWidth + gapWidth);
            const h = heights[i]!;
            const halfH = h / 2;

            // Trapezoid points: wider at left, narrower at right
            const nextH = i < 3 ? heights[i + 1]! : h * 0.8;
            const nextHalfH = nextH / 2;

            const points = [
              `${x},${centerY - halfH}`,
              `${x + stageWidth},${centerY - nextHalfH}`,
              `${x + stageWidth},${centerY + nextHalfH}`,
              `${x},${centerY + halfH}`,
            ].join(' ');

            return (
              <g key={stage.label}>
                <polygon
                  points={points}
                  fill={fills[i]}
                  stroke={strokes[i]}
                  strokeWidth="1"
                  opacity={isEmpty ? 0.3 : 1}
                />
                <text
                  x={x + stageWidth / 2}
                  y={centerY - 6}
                  textAnchor="middle"
                  className="text-xs font-semibold fill-gray-900"
                  fontSize="11"
                >
                  {stage.label}
                </text>
                <text
                  x={x + stageWidth / 2}
                  y={centerY + 12}
                  textAnchor="middle"
                  className="text-xs fill-gray-600"
                  fontSize="12"
                  fontWeight="600"
                >
                  {stage.count.toLocaleString('en-IN')}
                </text>

                {/* Conversion rate label between stages */}
                {i < 3 && !isEmpty && (
                  <text
                    x={x + stageWidth + gapWidth / 2}
                    y={centerY + halfH + 14}
                    textAnchor="middle"
                    className="fill-gray-500"
                    fontSize="9"
                  >
                    {conversionRates[i]}% pass
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

// ── Needs Attention Section ────────────────────────────────────────────────

function NeedsAttention({ items }: { items: CollectionProgress[] }) {
  const navigate = useNavigate();

  if (items.length === 0) return null;

  return (
    <div>
      <SectionHeader
        title="Needs Attention"
        subtitle={`${items.length} POD${items.length > 1 ? 's' : ''} at risk`}
      />
      <div className="space-y-2">
        {items.map((pod) => (
          <div
            key={pod.podId}
            className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start justify-between gap-3"
          >
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {pod.podName} ({pod.podId})
                </p>
                <p className="text-xs text-gray-600 mt-0.5">
                  {pod.riskReason ?? 'Behind schedule'}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate(`/showroom/curate/${pod.podId}`)}
              className="text-xs font-medium text-primary hover:text-primary-600 transition-colors whitespace-nowrap"
            >
              View
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── POD Status Table ───────────────────────────────────────────────────────

function PodStatusTable({ collections }: { collections: CollectionProgress[] }) {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <SectionHeader title="POD Status" className="px-4 pt-3 mb-0 pb-0" />
      <DataTable>
        <DataTableHeader>
          <DataTableHead>POD</DataTableHead>
          <DataTableHead align="right">Pool</DataTableHead>
          <DataTableHead align="right">Designer</DataTableHead>
          <DataTableHead align="right">Buyer</DataTableHead>
          <DataTableHead align="right">Final</DataTableHead>
          <DataTableHead>Status</DataTableHead>
          <DataTableHead>Progress</DataTableHead>
        </DataTableHeader>
        <DataTableBody>
          {collections.map((pod) => {
            const statusConfig = STATUS_CONFIG[pod.status];
            return (
              <DataTableRow
                key={pod.podId}
                onClick={() => navigate(`/showroom/curate/${pod.podId}`)}
                className="cursor-pointer focus-visible:outline-none focus-kb:ring-2 focus-kb:ring-primary focus-kb:ring-offset-2"
                role="link"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(`/showroom/curate/${pod.podId}`);
                  }
                }}
              >
                <DataTableCell>
                  <div className="flex items-center gap-1.5">
                    {pod.atRisk && <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />}
                    <span className="font-medium text-gray-900">{pod.podName}</span>
                  </div>
                </DataTableCell>
                <DataTableCell align="right" className="tabular-nums">{pod.poolCount}</DataTableCell>
                <DataTableCell align="right" className="tabular-nums">{pod.designerShortlistCount}</DataTableCell>
                <DataTableCell align="right" className="tabular-nums">{pod.buyerShortlistCount || '\u2014'}</DataTableCell>
                <DataTableCell align="right" className="tabular-nums">{pod.finalApprovedCount || '\u2014'}</DataTableCell>
                <DataTableCell>
                  <Badge variant={statusConfig.variant} size="sm">
                    {statusConfig.label}
                  </Badge>
                </DataTableCell>
                <DataTableCell>
                  <div className="flex items-center gap-2 min-w-[100px]">
                    <Progress
                      value={pod.completionPercentage}
                      size="sm"
                      className="flex-1"
                      indicatorClassName={cn(
                        pod.completionPercentage === 100
                          ? 'bg-green-500'
                          : pod.completionPercentage >= 60
                            ? 'bg-amber-500'
                            : 'bg-red-500'
                      )}
                    />
                    <span className="text-xs font-medium text-gray-600 w-7 text-right tabular-nums">
                      {pod.completionPercentage}%
                    </span>
                  </div>
                </DataTableCell>
              </DataTableRow>
            );
          })}
        </DataTableBody>
      </DataTable>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export function ShowroomJourneyOverview() {
  const showroomSummary = useShowroomCurationStore((s) => s.showroomSummary);
  const collectionProgress = useShowroomCurationStore((s) => s.collectionProgress);

  // Compute funnel data by summing across all PODs
  const funnelData = useMemo<FunnelData>(() => {
    if (!collectionProgress.length) {
      return { pool: 0, designer: 0, buyer: 0, final: 0 };
    }
    return collectionProgress.reduce(
      (acc, pod) => ({
        pool: acc.pool + pod.poolCount,
        designer: acc.designer + pod.designerShortlistCount,
        buyer: acc.buyer + pod.buyerShortlistCount,
        final: acc.final + pod.finalApprovedCount,
      }),
      { pool: 0, designer: 0, buyer: 0, final: 0 }
    );
  }, [collectionProgress]);

  // At-risk PODs
  const atRiskPods = useMemo(
    () => collectionProgress.filter((p) => p.atRisk),
    [collectionProgress]
  );

  // Fallback values when summary is missing
  const summary = showroomSummary ?? {
    season: 'SS26',
    totalPods: 0,
    podsFinalized: 0,
    totalStylesApproved: 0,
    totalStylesTarget: 0,
    overallCompletion: 0,
    avgMargin: 0,
    avgComplianceScore: 0,
    podsAtRisk: 0,
    collections: [],
  };

  const isEmpty =
    summary.totalPods === 0 ||
    (funnelData.pool === 0 &&
      funnelData.designer === 0 &&
      funnelData.buyer === 0 &&
      funnelData.final === 0);

  return (
    <div className="space-y-4 animate-fadeInUp">
      {/* KPI Row */}
      <MetricGrid columns={4}>
        <MetricCard
          label="PODs Finalized"
          value={`${summary.podsFinalized} / ${summary.totalPods}`}
          icon={CheckCircle2}
          iconColor={summary.podsFinalized === summary.totalPods ? 'success' : 'warning'}
        />
        <MetricCard
          label="Styles Approved"
          value={`${summary.totalStylesApproved} / ${summary.totalStylesTarget}`}
          icon={BarChart3}
          iconColor="info"
        />
        <MetricCard
          label="Avg Margin"
          value={`${summary.avgMargin}%`}
          icon={TrendingUp}
          iconColor={summary.avgMargin >= 53 ? 'success' : 'warning'}
        />
        <MetricCard
          label="At Risk"
          value={summary.podsAtRisk}
          icon={ShieldCheck}
          iconColor={summary.podsAtRisk === 0 ? 'success' : 'error'}
        />
      </MetricGrid>

      {/* Curation Funnel */}
      <CurationFunnel data={funnelData} />

      {/* Empty State */}
      {isEmpty && (
        <EmptyState description="Curation has not started. Begin by discovering styles." />
      )}

      {/* Needs Attention */}
      {!isEmpty && <NeedsAttention items={atRiskPods} />}

      {/* POD Status Table */}
      {!isEmpty && <PodStatusTable collections={collectionProgress} />}

    </div>
  );
}
