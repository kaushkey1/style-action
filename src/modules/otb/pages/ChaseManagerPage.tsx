import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Check,
  X,
  AlertTriangle,
  Star,
  TrendingUp,
  TrendingDown,
  Download,
} from 'lucide-react';
import { Badge, Button, PageHeader, Pagination, usePagination, DataTable, DataTableHeader, DataTableBody, DataTableRow, DataTableHead, DataTableCell, SectionHeader, MetricGrid, StoreFilterSelect, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';
import { useDownload } from '@/hooks/useDownload';
import { IMPETUS_APP_BASE } from '@/lib/api';
import { cn, formatCurrencyFromLakhs } from '@/lib/utils';
import { useOTBStore } from '../stores/otb.store';
import { mockSellThroughTriage, mockTestLots, podNameMap } from '../data/mockOTB';
import { OTBTabNavigation } from '../components/OTBTabNavigation';
import type { ChaseSignal, ChaseRecommendation, SellThroughTriage, TriageClassification } from '../types/otb.types';

// ─── Signal badge config ────────────────────────────────────────────

const signalConfig: Record<ChaseSignal, {
  label: string;
  icon: React.ElementType;
  bg: string;
  text: string;
}> = {
  winner: { label: 'Winner', icon: Star, bg: 'bg-red-100', text: 'text-red-700' },
  strong: { label: 'Strong', icon: TrendingUp, bg: 'bg-amber-100', text: 'text-amber-700' },
  stable: { label: 'Stable', icon: TrendingUp, bg: 'bg-gray-100', text: 'text-gray-700' },
  weak: { label: 'Weak', icon: TrendingUp, bg: 'bg-gray-100', text: 'text-gray-500' },
  stockout: { label: 'Stockout', icon: AlertTriangle, bg: 'bg-red-100', text: 'text-red-700' },
};

function SignalBadge({ signal }: { signal: ChaseSignal }) {
  const config = signalConfig[signal];
  const Icon = config.icon;
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium', config.bg, config.text)}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}

// ─── Priority badge ─────────────────────────────────────────────────

function PriorityBadge({ priority }: { priority: 'P1' | 'P2' | 'P3' }) {
  const variant = priority === 'P1' ? 'error' : priority === 'P2' ? 'warning' : 'info';
  return <Badge variant={variant} size="sm">{priority}</Badge>;
}

// ─── Chase action text ──────────────────────────────────────────────

function getChaseAction(rec: ChaseRecommendation): string {
  if (rec.signal === 'stockout') return 'Emergency replenish';
  return `Chase +${rec.chasePctIncrease}%`;
}

// ─── Recommendation card ────────────────────────────────────────────

function RecommendationCard({
  rec,
  onApprove,
  onReject,
  onCreatePO,
}: {
  rec: ChaseRecommendation;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onCreatePO: (id: string) => void;
}) {
  const isActioned = rec.status !== 'pending';

  return (
    <div
      className={cn(
        'bg-white rounded-lg border border-gray-200 p-3 transition-all duration-200',
        !isActioned && 'hover:border-primary/30 hover:shadow-md',
        rec.status === 'approved' && 'border-green-200 bg-green-50/30',
        rec.status === 'rejected' && 'border-red-200 bg-red-50/30 opacity-60',
        rec.status === 'po-created' && 'border-green-200 bg-green-50/30'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left: Details */}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <PriorityBadge priority={rec.priority} />
            <SignalBadge signal={rec.signal} />
            {rec.status === 'approved' && (
              <Badge variant="success" size="sm">Approved</Badge>
            )}
            {rec.status === 'rejected' && (
              <Badge variant="error" size="sm">Rejected</Badge>
            )}
            {rec.status === 'po-created' && (
              <Badge variant="success" size="sm">PO Created</Badge>
            )}
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-900">
              {rec.styleName}
              <span className="ml-1.5 text-xs text-gray-500 font-normal">{rec.styleId}</span>
            </p>
            <p className="text-xs text-gray-500 mt-0.5">{rec.podName}</p>
          </div>

          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>ROS {rec.rosMultiple}x</span>
            <span>Qty: {rec.currentQty.toLocaleString()} + {rec.recommendedChaseQty.toLocaleString()}</span>
            <span>{rec.affectedStoreCount} stores</span>
          </div>

          {/* Agent reasoning */}
          <details className="mt-2">
            <summary className="text-xs text-primary cursor-pointer hover:text-primary/80 font-medium">
              Agent reasoning
            </summary>
            <p className="text-xs text-gray-500 mt-1 pl-2 border-l-2 border-gray-200">
              ROS {rec.rosMultiple}x plan across {rec.affectedStoreCount} stores.
              {rec.signal === 'winner' && ' Winner signal detected — projected to sell out within 7 days at current velocity.'}
              {rec.signal === 'strong' && ' Strong demand signal — above-plan performance sustained over 5+ days.'}
              {rec.signal === 'stockout' && ' Stockout risk — cover days below threshold in affected stores.'}
              {rec.signal === 'stable' && ' Consistent demand — maintaining plan-level velocity.'}
              {rec.signal === 'weak' && ' Below-plan performance — monitoring for trend reversal.'}
              {' '}Recommended chase of +{rec.chasePctIncrease}% ({rec.recommendedChaseQty.toLocaleString()} units) at {formatCurrencyFromLakhs(rec.estimatedAmount)}.
            </p>
          </details>
        </div>

        {/* Right: Amount + Actions */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-900">
              {formatCurrencyFromLakhs(rec.estimatedAmount)}
            </p>
            <p className="text-xs text-gray-500">{getChaseAction(rec)}</p>
          </div>

          {!isActioned && (
            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant="primary"
                className="h-7 px-2.5 text-xs"
                onClick={() => onApprove(rec.id)}
                aria-label={`Approve chase for ${rec.styleName}`}
              >
                <Check className="w-3 h-3 mr-1" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-2.5 text-xs border-error/40 text-error hover:bg-error-50 hover:border-error/60"
                onClick={() => onReject(rec.id)}
                aria-label={`Reject chase for ${rec.styleName}`}
              >
                <X className="w-3 h-3 mr-1" />
                Reject
              </Button>
            </div>
          )}

          {rec.status === 'approved' && rec.approvedBy && (
            <div className="flex items-center gap-2">
              <p className="text-xs text-gray-500">
                by {rec.approvedBy}
              </p>
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-2.5 text-xs"
                onClick={() => onCreatePO(rec.id)}
              >
                Create PO
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Triage classification badge ─────────────────────────────────────

function TriageClassificationBadge({ classification }: { classification: TriageClassification }) {
  const config: Record<TriageClassification, { variant: 'success' | 'warning' | 'error'; label: string }> = {
    winner: { variant: 'success', label: 'Winner' },
    'size-break-salvage': { variant: 'warning', label: 'Size-break Salvage' },
    loser: { variant: 'error', label: 'Loser' },
  };
  const c = config[classification];
  return <Badge variant={c.variant} size="sm">{c.label}</Badge>;
}

// ─── Day-7 signal badge ──────────────────────────────────────────────

function Day7SignalBadge({ signal }: { signal: 'green' | 'amber' | 'red' | null }) {
  if (!signal) return <span className="text-xs text-gray-400">&mdash;</span>;
  const config: Record<string, { variant: 'success' | 'warning' | 'error'; label: string }> = {
    green: { variant: 'success', label: 'Green' },
    amber: { variant: 'warning', label: 'Amber' },
    red: { variant: 'error', label: 'Red' },
  };
  const c = config[signal];
  if (!c) return null;
  return <Badge variant={c.variant} size="sm">{c.label}</Badge>;
}

// ─── Re-cut status badge ─────────────────────────────────────────────

function RecutStatusBadge({ item }: { item: SellThroughTriage }) {
  if (item.classification === 'winner' && item.estimatedChaseAmount) {
    return <Badge variant="success" size="sm">Triggered</Badge>;
  }
  if (item.classification === 'size-break-salvage' && item.estimatedChaseAmount) {
    return <Badge variant="warning" size="sm">Pending</Badge>;
  }
  return <Badge variant="default" size="sm">Not Eligible</Badge>;
}

// ─── Test lot status badge ───────────────────────────────────────────

function TestLotStatusBadge({ status }: { status: string }) {
  const config: Record<string, { variant: 'success' | 'warning' | 'error' | 'info' | 'default'; label: string }> = {
    active: { variant: 'info', label: 'Active' },
    'winner-scaling': { variant: 'success', label: 'Scaling' },
    killed: { variant: 'error', label: 'Killed' },
    completed: { variant: 'default', label: 'Completed' },
  };
  const c = config[status] ?? { variant: 'default' as const, label: status };
  return <Badge variant={c.variant} size="sm">{c.label}</Badge>;
}

// ─── Page Component ─────────────────────────────────────────────────

export function ChaseManagerPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const storeParam = searchParams.get('store');
  const fiscalYear = useOTBStore((s) => s.fiscalYear);
  const budget = useOTBStore((s) => s.budget);
  const chaseRecommendations = useOTBStore((s) => s.chaseRecommendations);
  const chaseHistory = useOTBStore((s) => s.chaseHistory);
  const approveChase = useOTBStore((s) => s.approveChase);
  const rejectChase = useOTBStore((s) => s.rejectChase);
  const approveAllP1 = useOTBStore((s) => s.approveAllP1);
  const createPOFromChase = useOTBStore((s) => s.createPOFromChase);

  const triageItems = useOTBStore((s) => s.triageItems);
  const classifyTriage = useOTBStore((s) => s.classifyTriage);

  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const { download: downloadHistory, isDownloading: isDownloadingHistory } = useDownload(IMPETUS_APP_BASE);

  // Chase tier data from budget
  const chaseTier = budget?.tiers.find((t) => t.tier === 'chase');
  const chaseBudget = chaseTier?.budget ?? 0;
  const chaseConsumed = chaseTier?.consumed ?? 0;
  const chaseRemaining = chaseTier?.remaining ?? 0;
  const consumedPct = chaseBudget > 0 ? Math.round((chaseConsumed / chaseBudget) * 100) : 0;

  // Pending recommendations
  const pendingRecs = chaseRecommendations.filter((r) => r.status === 'pending');
  const pendingP1 = pendingRecs.filter((r) => r.priority === 'P1');
  const totalRecommendedAmount = pendingRecs.reduce((sum, r) => sum + r.estimatedAmount, 0);

  // Config for chase window
  const config = useOTBStore((s) => s.config);
  const windowStart = config.chaseTriggers.chaseWindowStart;
  const windowEnd = config.chaseTriggers.chaseWindowEnd;

  function toggleSort(key: string) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  const sortedHistory = useMemo(() => {
    if (!sortKey) return chaseHistory;
    return [...chaseHistory].sort((a, b) => {
      const aVal = a[sortKey as keyof typeof a];
      const bVal = b[sortKey as keyof typeof b];
      const cmp = typeof aVal === 'number' && typeof bVal === 'number'
        ? aVal - bVal
        : String(aVal).localeCompare(String(bVal));
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [chaseHistory, sortKey, sortDir]);

  // Pagination for chase history
  const { totalPages, totalItems, pageSize, getPageItems } = usePagination(sortedHistory, 10);
  const pageItems = getPageItems(currentPage);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Core / NOOS"
        backTo={{ label: 'OTB', path: '/otb' }}
        badges={<Badge variant="primary" size="sm">{fiscalYear}</Badge>}
        actions={
          <StoreFilterSelect
            value={storeParam}
            onChange={(name) => {
              if (name) {
                searchParams.set('store', name);
              } else {
                searchParams.delete('store');
              }
              setSearchParams(searchParams);
            }}
          />
        }
      />

      <OTBTabNavigation />

      <div className="space-y-4">
        {/* ─── Chase Budget Overview ──────────────────────────────── */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <SectionHeader
            title="Chase Budget Overview"
            actions={<Badge variant="success" size="sm" dot>Active</Badge>}
          />

          <MetricGrid columns={4} className="mb-0">
            <div>
              <p className="text-xs text-gray-500">Network Chase Budget</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrencyFromLakhs(chaseBudget)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Consumed</p>
              <p className="text-lg font-bold text-gray-900">
                {formatCurrencyFromLakhs(chaseConsumed)}
                <span className="ml-1 text-sm font-normal text-gray-500">({consumedPct}%)</span>
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Remaining</p>
              <p className="text-lg font-bold text-primary">{formatCurrencyFromLakhs(chaseRemaining)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Window</p>
              <p className="text-sm font-semibold text-gray-900">N+{windowStart} to N+{windowEnd}</p>
            </div>
          </MetricGrid>

          {/* Progress bar */}
          <div className="mt-3">
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              { }
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                // eslint-disable-next-line no-restricted-syntax -- dynamic width
                style={{ width: `${Math.min(consumedPct, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* ─── Chase Recommendations ─────────────────────────────── */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <SectionHeader
            title="Chase Recommendations"
            subtitle={`from A11 OTB Guardian \u00B7 ${pendingRecs.length} pending`}
            actions={
              <>
                {pendingP1.length > 0 && (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={approveAllP1}
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Approve All P1 ({pendingP1.length})
                  </Button>
                )}
                <Button size="sm" variant="outline" aria-label="Export chase recommendations">
                  <Download className="w-4 h-4 mr-1" />
                  Export
                </Button>
              </>
            }
          />

          {/* Recommendation cards */}
          <div className="space-y-2">
            {chaseRecommendations.length === 0 ? (
              <div className="p-4 text-center bg-white rounded-lg border border-gray-200">
                <p className="text-sm font-medium text-gray-900">No chase recommendations</p>
                <p className="text-xs text-gray-500 mt-1">All styles are within stock thresholds</p>
              </div>
            ) : chaseRecommendations.map((rec) => (
              <RecommendationCard
                key={rec.id}
                rec={rec}
                onApprove={approveChase}
                onReject={rejectChase}
                onCreatePO={createPOFromChase}
              />
            ))}
          </div>

          {/* Total */}
          {pendingRecs.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
              <p className="text-sm text-gray-700">
                Total recommended ({pendingRecs.length} items)
              </p>
              <p className="text-sm font-semibold text-gray-900">
                {formatCurrencyFromLakhs(totalRecommendedAmount)}
              </p>
            </div>
          )}
        </div>

        {/* ─── Chase History ──────────────────────────────────────── */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <SectionHeader
            title="Chase History"
            actions={
              <Button variant="outline" size="sm" onClick={() => downloadHistory('/otb/chase/history', 'chase_history.xlsx')} disabled={isDownloadingHistory} className="shrink-0">
                <Download className="w-4 h-4 mr-1.5" />
                {isDownloadingHistory ? 'Downloading...' : 'Download'}
              </Button>
            }
          />

          <DataTable className="[&_table]:text-sm">
            <DataTableHeader className="border-b-gray-100">
              <DataTableHead className="pr-3 cursor-pointer select-none hover:text-gray-700" onClick={() => toggleSort('date')}>
                Date {sortKey === 'date' && (sortDir === 'asc' ? '↑' : '↓')}
              </DataTableHead>
              <DataTableHead className="pr-3">Style</DataTableHead>
              <DataTableHead className="pr-3">Segment / Family</DataTableHead>
              <DataTableHead align="right" className="pr-3 cursor-pointer select-none hover:text-gray-700" onClick={() => toggleSort('amount')}>
                Amount {sortKey === 'amount' && (sortDir === 'asc' ? '↑' : '↓')}
              </DataTableHead>
              <DataTableHead align="right" className="pr-3 cursor-pointer select-none hover:text-gray-700" onClick={() => toggleSort('storeCount')}>
                Stores {sortKey === 'storeCount' && (sortDir === 'asc' ? '↑' : '↓')}
              </DataTableHead>
              <DataTableHead>Approved By</DataTableHead>
            </DataTableHeader>
            <DataTableBody>
              {chaseHistory.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-sm text-gray-500">No chase history yet</td></tr>
              ) : pageItems.map((entry) => (
                <DataTableRow
                  key={entry.id}
                  className="border-b border-gray-50 last:border-b-0"
                >
                  <DataTableCell className="pr-3 whitespace-nowrap">
                    {new Date(entry.date).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                    })}
                  </DataTableCell>
                  <DataTableCell className="pr-3">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-900 font-medium">{entry.styleName}</span>
                      <SignalBadge signal={entry.signal} />
                    </div>
                    <span className="text-xs text-gray-500">{entry.styleId}</span>
                  </DataTableCell>
                  <DataTableCell className="pr-3">{podNameMap[entry.podId] ?? entry.podId}</DataTableCell>
                  <DataTableCell align="right" className="pr-3 font-medium text-gray-900">
                    {formatCurrencyFromLakhs(entry.amount)}
                  </DataTableCell>
                  <DataTableCell align="right" className="pr-3">{entry.storeCount}</DataTableCell>
                  <DataTableCell>{entry.approvedBy}</DataTableCell>
                </DataTableRow>
              ))}
            </DataTableBody>
          </DataTable>
          {totalPages > 1 && (
            <div className="mt-4 pt-3 border-t border-gray-100">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={totalItems}
                pageSize={pageSize}
              />
            </div>
          )}
        </div>

        {/* ─── Sell-Through Triage ──────────────────────────────── */}
        <SellThroughTriageSection
          triageItems={triageItems}
          mockItems={mockSellThroughTriage}
          onClassify={classifyTriage}
        />

        {/* ─── Test Lots ───────────────────────────────────────── */}
        <TestLotsSection />
      </div>
    </div>
  );
}

// ─── Sell-Through Triage Section ─────────────────────────────────────

function SellThroughTriageSection({
  triageItems,
  mockItems,
  onClassify,
}: {
  triageItems: SellThroughTriage[];
  mockItems: SellThroughTriage[];
  onClassify: (id: string, classification: TriageClassification) => void;
}) {
  const { download, isDownloading } = useDownload(IMPETUS_APP_BASE);

  // Merge store state with mock data (store may have updated classifications)
  const items = useMemo(() => {
    const storeMap = new Map(triageItems.map((t) => [t.id, t]));
    return mockItems.map((item) => storeMap.get(item.id) ?? item);
  }, [triageItems, mockItems]);

  // Separate day-7 and day-14 items
  const day7Items = items.filter((i) => i.checkpoint === 'day-7');
  const day14Items = items.filter((i) => i.checkpoint === 'day-14');

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <SectionHeader
        title="Sell-Through Triage"
        subtitle="Day-7 and Day-14 style performance classification"
        actions={
          <Button variant="outline" size="sm" onClick={() => download('/otb/chase/sell-through-triage', 'sell_through_triage.xlsx')} disabled={isDownloading} className="shrink-0">
            <Download className="w-4 h-4 mr-1.5" />
            {isDownloading ? 'Downloading...' : 'Download'}
          </Button>
        }
      />

      <DataTable>
        <DataTableHeader>
          <DataTableHead>Style ID</DataTableHead>
          <DataTableHead>Style Name</DataTableHead>
          <DataTableHead>Checkpoint</DataTableHead>
          <DataTableHead align="right">Actual ST%</DataTableHead>
          <DataTableHead align="center">Signal</DataTableHead>
          <DataTableHead align="center">Classification</DataTableHead>
          <DataTableHead align="center">Re-Cut</DataTableHead>
          <DataTableHead align="center">Action</DataTableHead>
        </DataTableHeader>
        <DataTableBody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={8} className="py-8 text-center text-sm text-gray-500">
                No triage items
              </td>
            </tr>
          ) : (
            <>
              {/* Day-7 items */}
              {day7Items.map((item) => (
                <DataTableRow key={item.id}>
                  <DataTableCell className="font-mono text-xs text-gray-700">{item.styleId}</DataTableCell>
                  <DataTableCell className="font-medium text-gray-900">{item.styleName}</DataTableCell>
                  <DataTableCell>
                    <Badge variant="info" size="sm">Day-7</Badge>
                  </DataTableCell>
                  <DataTableCell align="right">
                    <div className="flex items-center justify-end gap-1">
                      <span className={cn(
                        'font-medium',
                        item.rosVsPlan >= 1.0 ? 'text-green-700' : item.rosVsPlan >= 0.7 ? 'text-amber-700' : 'text-red-700'
                      )}>
                        {item.actualSellThrough}%
                      </span>
                      {item.rosVsPlan >= 1.0
                        ? <TrendingUp className="w-3 h-3 text-green-600" />
                        : <TrendingDown className="w-3 h-3 text-red-600" />
                      }
                    </div>
                  </DataTableCell>
                  <DataTableCell align="center">
                    <TriageClassificationBadge classification={item.classification} />
                  </DataTableCell>
                  <DataTableCell align="center">
                    <span className="text-xs text-gray-400">Awaiting Day-14</span>
                  </DataTableCell>
                  <DataTableCell align="center">
                    <RecutStatusBadge item={item} />
                  </DataTableCell>
                  <DataTableCell align="center">
                    <span className="text-xs text-gray-400">&mdash;</span>
                  </DataTableCell>
                </DataTableRow>
              ))}
              {/* Day-14 items */}
              {day14Items.map((item) => (
                <DataTableRow key={item.id}>
                  <DataTableCell className="font-mono text-xs text-gray-700">{item.styleId}</DataTableCell>
                  <DataTableCell className="font-medium text-gray-900">{item.styleName}</DataTableCell>
                  <DataTableCell>
                    <Badge variant="primary" size="sm">Day-14</Badge>
                  </DataTableCell>
                  <DataTableCell align="right">
                    <div className="flex items-center justify-end gap-1">
                      <span className={cn(
                        'font-medium',
                        item.rosVsPlan >= 1.0 ? 'text-green-700' : item.rosVsPlan >= 0.7 ? 'text-amber-700' : 'text-red-700'
                      )}>
                        {item.actualSellThrough}%
                      </span>
                      {item.rosVsPlan >= 1.0
                        ? <TrendingUp className="w-3 h-3 text-green-600" />
                        : <TrendingDown className="w-3 h-3 text-red-600" />
                      }
                    </div>
                  </DataTableCell>
                  <DataTableCell align="center">
                    <TriageClassificationBadge classification={item.classification} />
                  </DataTableCell>
                  <DataTableCell align="center">
                    <TriageClassificationBadge classification={item.classification} />
                  </DataTableCell>
                  <DataTableCell align="center">
                    <RecutStatusBadge item={item} />
                  </DataTableCell>
                  <DataTableCell align="center">
                    {item.status === 'pending-review' ? (
                      <ClassifyDropdown
                        itemId={item.id}
                        onClassify={onClassify}
                      />
                    ) : (
                      <Badge variant="default" size="sm">Actioned</Badge>
                    )}
                  </DataTableCell>
                </DataTableRow>
              ))}
            </>
          )}
        </DataTableBody>
      </DataTable>
    </div>
  );
}

// ─── Classify Dropdown ───────────────────────────────────────────────

function ClassifyDropdown({
  itemId,
  onClassify,
}: {
  itemId: string;
  onClassify: (id: string, classification: TriageClassification) => void;
}) {
  return (
    <Select
      onValueChange={(val) => onClassify(itemId, val as TriageClassification)}
    >
      <SelectTrigger size="sm" className="h-7 min-w-[100px]">
        <SelectValue placeholder="Classify" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="winner">Winner</SelectItem>
        <SelectItem value="size-break-salvage">Size-break</SelectItem>
        <SelectItem value="loser">Loser</SelectItem>
      </SelectContent>
    </Select>
  );
}

// ─── Test Lots Section ───────────────────────────────────────────────

function TestLotsSection() {
  const { download, isDownloading } = useDownload(IMPETUS_APP_BASE);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <SectionHeader
        title="Test Lots"
        subtitle="Micro-lot test orders for demand validation"
        actions={
          <Button variant="outline" size="sm" onClick={() => download('/otb/chase/test-lots', 'chase_test_lots.xlsx')} disabled={isDownloading} className="shrink-0">
            <Download className="w-4 h-4 mr-1.5" />
            {isDownloading ? 'Downloading...' : 'Download'}
          </Button>
        }
      />

      <DataTable>
        <DataTableHeader>
          <DataTableHead>Lot ID</DataTableHead>
          <DataTableHead>Style</DataTableHead>
          <DataTableHead align="right">Qty</DataTableHead>
          <DataTableHead align="center">Day-7 Signal</DataTableHead>
          <DataTableHead align="center">Day-14 Classification</DataTableHead>
          <DataTableHead align="center">Status</DataTableHead>
        </DataTableHeader>
        <DataTableBody>
          {mockTestLots.length === 0 ? (
            <tr>
              <td colSpan={6} className="py-8 text-center text-sm text-gray-500">
                No test lots
              </td>
            </tr>
          ) : (
            mockTestLots.map((lot) => (
              <DataTableRow key={lot.id}>
                <DataTableCell className="font-mono text-xs text-gray-700">{lot.id}</DataTableCell>
                <DataTableCell>
                  <span className="font-medium text-gray-900">{lot.styleName}</span>
                  <span className="ml-1.5 text-xs text-gray-500">{lot.styleId}</span>
                </DataTableCell>
                <DataTableCell align="right" className="font-medium text-gray-900">
                  {lot.quantity.toLocaleString()}
                </DataTableCell>
                <DataTableCell align="center">
                  <Day7SignalBadge signal={lot.day7Signal} />
                </DataTableCell>
                <DataTableCell align="center">
                  {lot.day14Classification ? (
                    <TriageClassificationBadge classification={lot.day14Classification} />
                  ) : (
                    <span className="text-xs text-gray-400">&mdash;</span>
                  )}
                </DataTableCell>
                <DataTableCell align="center">
                  <TestLotStatusBadge status={lot.status} />
                </DataTableCell>
              </DataTableRow>
            ))
          )}
        </DataTableBody>
      </DataTable>
    </div>
  );
}
