import { Badge, DataTable, DataTableHeader, DataTableBody, DataTableRow, DataTableHead, DataTableCell } from '@/components/ui';
import { cn, formatNumber } from '@/lib/utils';

import type { EngineOutputDetailData, LineMetadata } from '../../types/engine.types';

// ─── Sub-components for each output type ──────────────────────────────

function ReplenishmentSection({ detail }: { readonly detail: Extract<EngineOutputDetailData, { kind: 'replenishment' }> }): React.ReactNode {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <span className="text-gray-500">Target stock: <span className="font-medium text-gray-700 tabular-nums">{formatNumber(detail.targetStock)}</span></span>
        <span className="text-gray-500">DC before: <span className="font-medium text-gray-700 tabular-nums">{formatNumber(detail.dcStockBefore)}</span></span>
        <span className="text-gray-500">DC after: <span className="font-medium text-gray-700 tabular-nums">{formatNumber(detail.dcStockAfter)}</span></span>
        <span className="text-gray-500">Rationing: <span className="font-medium text-gray-700">{detail.rationingStatus}</span></span>
      </div>
      <DataTable minWidth="400px">
        <DataTableHeader>
          <DataTableHead>Size</DataTableHead>
          <DataTableHead align="right">Share</DataTableHead>
          <DataTableHead align="right">Target</DataTableHead>
          <DataTableHead align="right">Position</DataTableHead>
          <DataTableHead align="right">Dispatch</DataTableHead>
        </DataTableHeader>
        <DataTableBody>
          {detail.sizeSplit.map((row) => (
            <DataTableRow key={row.size}>
              <DataTableCell className="font-medium">{row.size}</DataTableCell>
              <DataTableCell align="right" className="tabular-nums">{row.share}%</DataTableCell>
              <DataTableCell align="right" className="tabular-nums">{row.target}</DataTableCell>
              <DataTableCell align="right" className="tabular-nums">{row.position}</DataTableCell>
              <DataTableCell align="right" className="tabular-nums">{row.dispatch}</DataTableCell>
            </DataTableRow>
          ))}
        </DataTableBody>
      </DataTable>
    </div>
  );
}

function PullbackSection({ detail }: { readonly detail: Extract<EngineOutputDetailData, { kind: 'pullback' }> }): React.ReactNode {
  return (
    <div className="space-y-2 text-xs">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="text-gray-500">Type: <span className="font-medium text-gray-700">{detail.pullbackType}</span></div>
        <div className="text-gray-500">Reason: <span className="font-medium text-gray-700">{detail.reason}</span></div>
        <div className="text-gray-500">Rank: <span className="font-medium text-gray-700 tabular-nums">{detail.rank}</span></div>
        <div className="text-gray-500">Units pulled: <span className="font-medium text-gray-700 tabular-nums">{detail.unitsPulled}</span></div>
        <div className="text-gray-500">Route: <span className="font-medium text-gray-700">{detail.route}</span></div>
        <div className="text-gray-500">Space floor: <span className="font-medium text-gray-700 tabular-nums">{detail.spaceFloorBefore} &rarr; {detail.spaceFloorAfter}</span></div>
        {detail.linkedReplacement ? (
          <div className="text-gray-500">Linked replacement: <span className="font-medium text-gray-700">{detail.linkedReplacement}</span></div>
        ) : null}
      </div>
    </div>
  );
}

function MarkdownSection({ detail }: { readonly detail: Extract<EngineOutputDetailData, { kind: 'markdown' }> }): React.ReactNode {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <span className="text-gray-500">Tier: <span className="font-medium text-gray-700">{detail.ladderTier}</span></span>
        <span className="text-gray-500">Depth: <span className="font-medium text-gray-700 tabular-nums">{detail.depth}%</span></span>
        <span className="text-gray-500">Headroom: <span className={cn('font-medium tabular-nums', detail.headroom > 0 ? 'text-green-700' : 'text-red-700')}>{'₹'}{formatNumber(detail.headroom)}</span></span>
        <span className="text-gray-500">Floor clamp: <span className="font-medium text-gray-700">{detail.floorClamp ? 'Yes' : 'No'}</span></span>
        <span className="text-gray-500">One-way: <span className="font-medium text-gray-700">{detail.oneWayDoor ? 'Yes' : 'No'}</span></span>
        <span className="text-gray-500">Next eligible: <span className="font-medium text-gray-700">{detail.nextStepEligible ? 'Yes' : 'No'}</span></span>
      </div>
      <DataTable minWidth="400px">
        <DataTableHeader>
          <DataTableHead>Size</DataTableHead>
          <DataTableHead align="right">Full</DataTableHead>
          <DataTableHead align="right">Ladder</DataTableHead>
          <DataTableHead align="right">Floor</DataTableHead>
          <DataTableHead align="right">Marked</DataTableHead>
        </DataTableHeader>
        <DataTableBody>
          {detail.priceTable.map((row) => (
            <DataTableRow key={row.size}>
              <DataTableCell className="font-medium">{row.size}</DataTableCell>
              <DataTableCell align="right" className="tabular-nums">{'₹'}{formatNumber(row.fullPrice)}</DataTableCell>
              <DataTableCell align="right" className="tabular-nums">{'₹'}{formatNumber(row.ladderPrice)}</DataTableCell>
              <DataTableCell align="right" className="tabular-nums">{'₹'}{formatNumber(row.floorPrice)}</DataTableCell>
              <DataTableCell align="right" className="tabular-nums font-medium">{'₹'}{formatNumber(row.markedPrice)}</DataTableCell>
            </DataTableRow>
          ))}
        </DataTableBody>
      </DataTable>
    </div>
  );
}

function HoldSection({ detail }: { readonly detail: Extract<EngineOutputDetailData, { kind: 'hold' }> }): React.ReactNode {
  return (
    <div className="space-y-1 text-xs">
      <div className="text-gray-700">{detail.reason}</div>
      <div className="text-gray-500 italic">{detail.nextStep}</div>
    </div>
  );
}

// ─── Line metadata strip ──────────────────────────────────────────────

function LineMetadataStrip({ metadata }: { readonly metadata: LineMetadata }): React.ReactNode {
  return (
    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100 text-xs text-gray-500">
      <span>Run: <span className="text-gray-700">{metadata.runId}</span></span>
      <Badge variant="default" size="sm">{metadata.lineState.replace('_', ' ')}</Badge>
      <Badge variant={metadata.autonomyBand === 'auto' ? 'success' : 'warning'} size="sm">
        {metadata.autonomyBand === 'auto' ? 'Auto' : 'Stop & Approve'}
      </Badge>
      {metadata.triggers.length > 0 ? (
        <span className="flex items-center gap-1">
          {metadata.triggers.map((t) => (
            <Badge key={t} variant="outline" size="sm">{t}</Badge>
          ))}
        </span>
      ) : null}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────

interface EngineOutputDetailProps {
  readonly detail: EngineOutputDetailData;
  readonly lineMetadata: LineMetadata;
}

/** Conditional detail section below the gate stepper. */
export function EngineOutputDetail({ detail, lineMetadata }: EngineOutputDetailProps): React.ReactNode {
  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold text-gray-900">Engine Output</h4>
      {detail.kind === 'replenishment' ? <ReplenishmentSection detail={detail} /> : null}
      {detail.kind === 'pullback' ? <PullbackSection detail={detail} /> : null}
      {detail.kind === 'markdown' ? <MarkdownSection detail={detail} /> : null}
      {detail.kind === 'hold' ? <HoldSection detail={detail} /> : null}
      <LineMetadataStrip metadata={lineMetadata} />
    </div>
  );
}
