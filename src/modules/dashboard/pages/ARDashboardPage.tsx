import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowDown, ArrowRight, Flag, TrendingUp, TrendingDown } from 'lucide-react';
import {
  Badge,
  Button,
  ConfirmDialog,
  MetricCard,
  MetricGrid,
  Progress,
  SectionHeader,
  DataTable,
  DataTableHeader,
  DataTableBody,
  DataTableRow,
  DataTableHead,
  DataTableCell,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  StoreFilterSelect,
  PageHeader,
} from '@/components/ui';
import {
  arPipelineRuns,
  arPullbacks,
  arReplenishments,
  arRedistributions,
  arSummary,
  arVendorHealth,
  arVendorSwitchEvents,
  type ARPipelineRun,
  type ARVendorHealth,
  type ARVendorSwitchEvent,
  type RunStatus,
  type ActionStatus,
  type PullbackSubType,
  type CoreTriggerType,
  type FeasibilityStatus,
  type UpstreamPipelineStatus,
} from '../data/mockAR';
import { activeWorkflows } from '@/modules/inventory/data/mockInventoryWorkflows';
import { mockFashionLifecycle } from '@/modules/otb/data/mockOTB';
import { useOTBStore } from '@/modules/otb/stores/otb.store';
import type { FashionLifecycleStage } from '@/modules/otb/types/otb.types';
import { cn, formatDuration, formatNumber } from '@/lib/utils';

// ─── Helpers ──────────────────────────────────────────────────────────

function matchesStoreFilter(storeName: string, query: string): boolean {
  const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
  const q = normalize(query);
  const s = normalize(storeName);
  return s.includes(q) || q.includes(s);
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

const runStatusVariant: Record<RunStatus, 'success' | 'primary' | 'error' | 'warning' | 'default'> = {
  completed: 'success',
  running: 'primary',
  failed: 'error',
  dry_run: 'warning',
  scheduled: 'default',
};

const actionStatusVariant: Record<ActionStatus, 'success' | 'primary' | 'warning' | 'error' | 'default' | 'info'> = {
  approved: 'success',
  completed: 'success',
  in_transit: 'primary',
  pending: 'warning',
  rejected: 'error',
  escalated: 'error',
};

const pullbackSubTypeLabel: Record<PullbackSubType, string> = {
  BottomSeller: 'Bottom Seller',
  BrokenSet: 'Broken Set',
  LifecycleCrossed: 'Lifecycle Crossed',
  PlanogramOverfill: 'Planogram Overfill',
};

const itemTypeVariant: Record<string, 'primary' | 'info' | 'warning'> = {
  NOOS: 'primary',
  fashion: 'info',
  fast_fashion: 'warning',
};

const triggerTypeLabel: Record<CoreTriggerType, string> = {
  STORE_MIN_BREACH: 'Store Min',
  DC_MIN_BREACH: 'DC Min',
  DC_PROJECTED_STOCKOUT: 'DC Stockout',
  FG_SS_LOW: 'FG SS Low',
  DEMAND_SPIKE: 'Demand Spike',
  VENDOR_SWITCH: 'Vendor Switch',
  FESTIVE_PREBUILD: 'Festive Build',
  MANUAL: 'Manual',
};

const triggerTypeVariant: Record<CoreTriggerType, 'error' | 'warning' | 'primary' | 'default'> = {
  STORE_MIN_BREACH: 'error',
  DC_MIN_BREACH: 'error',
  DC_PROJECTED_STOCKOUT: 'error',
  FG_SS_LOW: 'warning',
  DEMAND_SPIKE: 'warning',
  VENDOR_SWITCH: 'primary',
  FESTIVE_PREBUILD: 'primary',
  MANUAL: 'default',
};

const feasibilityVariant: Record<FeasibilityStatus, 'success' | 'warning' | 'error'> = {
  FEASIBLE: 'success',
  PARTIALLY_FEASIBLE: 'warning',
  INFEASIBLE: 'error',
};

const upstreamVariant: Record<UpstreamPipelineStatus, 'success' | 'warning' | 'error'> = {
  healthy: 'success',
  constrained: 'warning',
  critical: 'error',
};

// ─── Lifecycle stage config ──────────────────────────────────────────

const stageConfig: Record<FashionLifecycleStage, { label: string; variant: 'success' | 'warning' | 'error' | 'default' }> = {
  'a0-a1-fresh': { label: 'Fresh (A0-A1)', variant: 'success' },
  'a2-a3-cascade': { label: 'Cascade (A2-A3)', variant: 'warning' },
  'liquidation': { label: 'Liquidation', variant: 'error' },
  'written-off': { label: 'Written Off', variant: 'default' },
};

function stageDaysRemaining(stage: FashionLifecycleStage, networkAge: number): number {
  switch (stage) {
    case 'a0-a1-fresh': return Math.max(0, 45 - networkAge);
    case 'a2-a3-cascade': return Math.max(0, 90 - networkAge);
    case 'liquidation': return Math.max(0, 120 - networkAge);
    case 'written-off': return 0;
  }
}

// ─── Pipeline Runs Tab ────────────────────────────────────────────────

function PipelineRunsTab({ storeFilter }: { storeFilter: string | null }) {
  const sortedRuns = useMemo(
    () => [...arPipelineRuns].sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime()),
    []
  );

  function typeLabel(run: ARPipelineRun): string {
    if (run.sub_type === 'pullback' && run.pullback_sub_type) {
      return pullbackSubTypeLabel[run.pullback_sub_type];
    }
    return run.sub_type.charAt(0).toUpperCase() + run.sub_type.slice(1);
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <SectionHeader
          title="Pipeline Runs"
          subtitle={storeFilter ? `${arPipelineRuns.length} runs (network-level data)` : `${arPipelineRuns.length} runs total`}
          className="mb-0"
        />
      </div>
      <DataTable>
        <DataTableHeader className="bg-gray-50">
          <DataTableHead>Run ID</DataTableHead>
          <DataTableHead>Type</DataTableHead>
          <DataTableHead>Status</DataTableHead>
          <DataTableHead>Started</DataTableHead>
          <DataTableHead>Duration</DataTableHead>
          <DataTableHead align="right">Stores</DataTableHead>
          <DataTableHead align="right">SKUs</DataTableHead>
          <DataTableHead align="right">Actions</DataTableHead>
          <DataTableHead align="right">Units</DataTableHead>
          <DataTableHead align="right">Value</DataTableHead>
        </DataTableHeader>
        <DataTableBody>
          {sortedRuns.map((run) => (
            <DataTableRow key={run.id} className="border-t border-gray-100">
              <DataTableCell>
                <span className="font-mono text-xs text-gray-700">{run.id}</span>
              </DataTableCell>
              <DataTableCell>
                <span className="text-xs text-gray-900">{typeLabel(run)}</span>
                {run.dry_run && (
                  <Badge variant="warning" className="ml-1 text-xs">Dry Run</Badge>
                )}
              </DataTableCell>
              <DataTableCell>
                <Badge variant={runStatusVariant[run.status]} className="text-xs capitalize">
                  {run.status.replace('_', ' ')}
                </Badge>
              </DataTableCell>
              <DataTableCell>
                <span className="text-xs text-gray-700">{formatTime(run.started_at)}</span>
              </DataTableCell>
              <DataTableCell>
                <span className="text-xs text-gray-700">
                  {run.duration_sec ? formatDuration(run.duration_sec) : '--'}
                </span>
              </DataTableCell>
              <DataTableCell align="right">
                <span className="text-xs text-gray-700">{formatNumber(run.stores_processed)}</span>
              </DataTableCell>
              <DataTableCell align="right">
                <span className="text-xs text-gray-700">{formatNumber(run.skus_evaluated)}</span>
              </DataTableCell>
              <DataTableCell align="right">
                <span className="text-xs text-gray-700">
                  {run.actions_approved}/{run.actions_generated}
                </span>
              </DataTableCell>
              <DataTableCell align="right">
                <span className="text-xs text-gray-700">{formatNumber(run.total_units)}</span>
              </DataTableCell>
              <DataTableCell align="right">
                <span className="text-xs font-medium text-gray-900">{run.total_value_lakh} L</span>
              </DataTableCell>
            </DataTableRow>
          ))}
        </DataTableBody>
      </DataTable>
    </div>
  );
}

// ─── Pullback Tab ─────────────────────────────────────────────────────

function PullbackTab({ storeFilter }: { storeFilter: string | null }) {
  const items = useMemo(() => {
    if (!storeFilter) return arPullbacks;
    return arPullbacks.filter(pb => matchesStoreFilter(pb.store_name, storeFilter));
  }, [storeFilter]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <SectionHeader
          title="Pullback Actions"
          subtitle={`${items.length} items`}
          className="mb-0"
        />
      </div>
      <div className="divide-y divide-gray-100">
        {items.map((pb) => (
          <div key={pb.id} className="p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <Badge variant={itemTypeVariant[pb.item_type] ?? 'info'} className="text-xs">
                  {pb.item_type === 'fast_fashion' ? 'Fast Fashion' : pb.item_type}
                </Badge>
                <Badge
                  variant={pb.sub_type === 'BottomSeller' ? 'error' : pb.sub_type === 'BrokenSet' ? 'warning' : 'info'}
                  className="text-xs"
                >
                  {pullbackSubTypeLabel[pb.sub_type]}
                </Badge>
                <span className="text-xs font-mono text-gray-500">{pb.sku}</span>
              </div>
              <Badge variant={actionStatusVariant[pb.status]} className="text-xs capitalize">
                {pb.status.replace('_', ' ')}
              </Badge>
            </div>

            <p className="text-sm font-medium text-gray-900 mb-1">{pb.style_name}</p>

            <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
              <span className="font-medium text-gray-700">{pb.store_name}</span>
              <span>({pb.store_grade})</span>
              <span className="text-gray-400 mx-1">|</span>
              <span>{pb.units} units</span>
            </div>

            {/* eslint-disable-next-line design-system/prefer-metric-grid -- inline detail metrics, not MetricCard layout */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs mb-2">
              <div>
                <span className="text-gray-500">ROS</span>
                <div className="flex items-center gap-1">
                  <span className={cn('font-medium', pb.ros < pb.avg_ros * 0.5 ? 'text-red-600' : 'text-gray-900')}>
                    {pb.ros}
                  </span>
                  <span className="text-gray-500">/ {pb.avg_ros} avg</span>
                </div>
              </div>
              <div>
                <span className="text-gray-500">STR</span>
                <div className="flex items-center gap-1">
                  <span className={cn('font-medium', pb.str < pb.avg_str * 0.5 ? 'text-red-600' : 'text-gray-900')}>
                    {pb.str}%
                  </span>
                  <span className="text-gray-500">/ {pb.avg_str}% avg</span>
                </div>
              </div>
              <div>
                <span className="text-gray-500">WOC</span>
                <span className={cn('block font-medium', pb.woc > 20 ? 'text-red-600' : pb.woc > 10 ? 'text-amber-600' : 'text-gray-900')}>
                  {pb.woc}w
                </span>
              </div>
              {pb.bsi !== undefined && (
                <div>
                  <span className="text-gray-500">BSI</span>
                  <span className={cn('block font-medium', pb.bsi < 0.5 ? 'text-red-600' : 'text-gray-900')}>
                    {pb.bsi}
                  </span>
                </div>
              )}
              <div>
                <span className="text-gray-500">Size %</span>
                <span className={cn('block font-medium', pb.size_completeness_pct < 80 ? 'text-red-600' : 'text-gray-900')}>
                  {pb.size_completeness_pct}%
                </span>
              </div>
            </div>

            {pb.replacement_sku && (
              <div className="flex items-center gap-2 text-xs bg-green-50 border border-green-100 rounded-lg px-3 py-1.5 mb-2">
                <span className="text-green-700 font-medium">Replacement:</span>
                <span className="text-green-800">{pb.replacement_style}</span>
                <span className="text-green-600 font-mono">({pb.replacement_sku})</span>
                {pb.replacement_match_level && (
                  <Badge variant="success" className="text-xs">{pb.replacement_match_level}</Badge>
                )}
              </div>
            )}

            <p className="text-xs text-gray-500">{pb.reason}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Replenishment Tab ────────────────────────────────────────────────

function fillRateIndicatorClass(pct: number): string {
  if (pct === 100) return 'bg-green-500';
  if (pct > 75) return 'bg-amber-500';
  return 'bg-red-500';
}

function ReplenishmentTab({ storeFilter }: { storeFilter: string | null }) {
  const items = useMemo(() => {
    if (!storeFilter) return arReplenishments;
    return arReplenishments.filter(rep => matchesStoreFilter(rep.store_name, storeFilter));
  }, [storeFilter]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <SectionHeader
          title="Replenishment Orders"
          subtitle={`${items.length} items`}
          className="mb-0"
        />
      </div>
      <div className="overflow-x-auto">
        <DataTable>
          <DataTableHeader className="bg-gray-50">
            <DataTableHead>Type</DataTableHead>
            <DataTableHead>Store</DataTableHead>
            <DataTableHead>SKU / Style</DataTableHead>
            <DataTableHead align="right">ROS</DataTableHead>
            <DataTableHead align="right">Stock</DataTableHead>
            <DataTableHead align="right">Replen Qty</DataTableHead>
            <DataTableHead>Fill Rate</DataTableHead>
            <DataTableHead align="right">Size %</DataTableHead>
            <DataTableHead align="right">Stockout</DataTableHead>
            <DataTableHead>Delivery</DataTableHead>
            <DataTableHead>Approval</DataTableHead>
            <DataTableHead>Status</DataTableHead>
            <DataTableHead>Trigger</DataTableHead>
            <DataTableHead>Upstream</DataTableHead>
            <DataTableHead>Feasibility</DataTableHead>
            <DataTableHead>Need-By</DataTableHead>
            <DataTableHead>OOS Corr.</DataTableHead>
          </DataTableHeader>
          <DataTableBody>
            {items.map((rep) => (
              <DataTableRow key={rep.id} className="border-t border-gray-100">
                <DataTableCell>
                  <Badge variant={itemTypeVariant[rep.item_type] ?? 'info'} className="text-xs">
                    {rep.item_type === 'fast_fashion' ? 'Fast' : rep.item_type}
                  </Badge>
                </DataTableCell>
                <DataTableCell>
                  <span className="font-medium text-gray-900 text-xs">{rep.store_name}</span>
                  <span className="text-gray-500 text-xs ml-1">({rep.store_grade})</span>
                </DataTableCell>
                <DataTableCell>
                  <div>
                    <span className="text-xs font-mono text-gray-700">{rep.sku}</span>
                    <p className="text-xs text-gray-500">{rep.style_name}</p>
                  </div>
                </DataTableCell>
                <DataTableCell align="right">
                  <span className="text-xs text-gray-700">{rep.ros}</span>
                </DataTableCell>
                <DataTableCell align="right">
                  <span className={cn('text-xs font-medium', rep.closing_stock === 0 ? 'text-red-600' : 'text-gray-700')}>
                    {rep.closing_stock}
                  </span>
                </DataTableCell>
                <DataTableCell align="right">
                  <span className="text-xs text-gray-700">{rep.replenishment_qty}</span>
                </DataTableCell>
                <DataTableCell>
                  <div className="flex items-center gap-2 min-w-[100px]">
                    <Progress
                      value={rep.fill_rate_pct}
                      className="w-16"
                      size="sm"
                      indicatorClassName={fillRateIndicatorClass(rep.fill_rate_pct)}
                    />
                    <span className={cn(
                      'text-xs font-medium',
                      rep.fill_rate_pct === 100 ? 'text-green-600' : rep.fill_rate_pct > 75 ? 'text-amber-600' : 'text-red-600'
                    )}>
                      {rep.fill_rate_pct}%
                    </span>
                  </div>
                </DataTableCell>
                <DataTableCell align="right">
                  <span className={cn('text-xs font-medium', rep.size_completeness_pct < 80 ? 'text-red-600' : 'text-gray-700')}>
                    {rep.size_completeness_pct}%
                  </span>
                </DataTableCell>
                <DataTableCell align="right">
                  <span className={cn(
                    'text-xs font-medium',
                    rep.projected_stockout_days === 0 ? 'text-red-600' : rep.projected_stockout_days <= 3 ? 'text-amber-600' : 'text-gray-700'
                  )}>
                    {rep.projected_stockout_days === 0 ? 'Now' : `${rep.projected_stockout_days}d`}
                  </span>
                </DataTableCell>
                <DataTableCell>
                  <Badge
                    variant={rep.delivery_mode === 'express' ? 'primary' : rep.delivery_mode === 'cross_dock' ? 'info' : 'default'}
                    className="text-xs capitalize"
                  >
                    {rep.delivery_mode.replace('_', ' ')}
                  </Badge>
                </DataTableCell>
                <DataTableCell>
                  <Badge variant={rep.auto_approved ? 'success' : 'warning'} className="text-xs">
                    {rep.auto_approved ? 'Auto' : 'Manual'}
                  </Badge>
                </DataTableCell>
                <DataTableCell>
                  <Badge variant={actionStatusVariant[rep.status]} className="text-xs capitalize">
                    {rep.status.replace('_', ' ')}
                  </Badge>
                </DataTableCell>
                <DataTableCell>
                  <Badge variant={triggerTypeVariant[rep.trigger_type]} className="text-xs">
                    {triggerTypeLabel[rep.trigger_type]}
                  </Badge>
                </DataTableCell>
                <DataTableCell>
                  <div className="space-y-1">
                    <Badge variant={upstreamVariant[rep.upstream_status]} className="text-xs capitalize">
                      {rep.upstream_status}
                    </Badge>
                    <span className="block text-xs text-gray-500">DC {rep.dc_doc_days}d | FG {rep.vendor_fg_adequacy_pct}%</span>
                  </div>
                </DataTableCell>
                <DataTableCell>
                  <div className="space-y-1">
                    <Badge variant={feasibilityVariant[rep.feasibility_status]} className="text-xs">
                      {rep.feasibility_status.replace('_', ' ')}
                    </Badge>
                    {rep.constraint_annotations && rep.constraint_annotations.length > 0 && (
                      <span className="block text-xs text-gray-500">{rep.constraint_annotations.length} constraint{rep.constraint_annotations.length > 1 ? 's' : ''}</span>
                    )}
                  </div>
                </DataTableCell>
                <DataTableCell>
                  <div className="space-y-1">
                    <span className="text-xs text-gray-700">{rep.store_need_by || '\u2014'}</span>
                    {rep.surge_factor > 1 && (
                      <Badge variant="warning" className="text-xs">
                        Surge {rep.surge_factor}x
                      </Badge>
                    )}
                  </div>
                </DataTableCell>
                <DataTableCell>
                  {rep.oos_corrected ? (
                    <div className="space-y-1">
                      <Badge variant="warning" className="text-xs">OOS Adj</Badge>
                      <span className="block text-xs text-gray-500">{rep.raw_ros} &rarr; {rep.ros}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-500">\u2014</span>
                  )}
                </DataTableCell>
              </DataTableRow>
            ))}
          </DataTableBody>
        </DataTable>
      </div>
    </div>
  );
}

// ─── Redistribution Tab ───────────────────────────────────────────────

function RedistributionTab({ storeFilter }: { storeFilter: string | null }) {
  const items = useMemo(() => {
    if (!storeFilter) return arRedistributions;
    return arRedistributions.filter(rd => matchesStoreFilter(rd.donor_store_name, storeFilter) || matchesStoreFilter(rd.recipient_store_name, storeFilter));
  }, [storeFilter]);

  return (
    <div className="space-y-3">
      <SectionHeader
        title="Redistribution Actions"
        subtitle={`${items.length} items`}
      />
      {items.map((rd) => (
        <div key={rd.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:border-primary/30 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Badge variant={itemTypeVariant[rd.item_type] ?? 'info'} className="text-xs">
                {rd.item_type === 'fast_fashion' ? 'Fast Fashion' : rd.item_type}
              </Badge>
              <span className="text-xs font-mono text-gray-500">{rd.sku}</span>
              <span className="text-sm font-medium text-gray-900">{rd.style_name}</span>
              <Badge variant="default" className="text-xs">{rd.category}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={rd.delivery_type === 'IST' ? 'primary' : 'info'}
                className="text-xs"
              >
                {rd.delivery_type === 'IST' ? 'IST' : 'DC Route'}
              </Badge>
              <Badge variant={actionStatusVariant[rd.status]} className="text-xs capitalize">
                {rd.status.replace('_', ' ')}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Donor */}
            <div className="flex-1 bg-red-50 border border-red-100 rounded-lg p-3">
              <p className="text-xs uppercase font-medium text-red-500 mb-1">Donor</p>
              <p className="text-sm font-medium text-gray-900">{rd.donor_store_name}</p>
              <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                <span>Grade {rd.donor_grade}</span>
                <span className="text-red-600 font-medium">WOC {rd.donor_woc}w</span>
                <span>ROS {rd.donor_ros}</span>
              </div>
            </div>

            {/* Arrow */}
            <div className="flex flex-col items-center gap-1 shrink-0">
              <ArrowRight className="w-5 h-5 text-primary" />
              <span className="text-xs font-medium text-gray-700">{rd.units} units</span>
              <span className="text-xs text-gray-500">{rd.value_lakh} L</span>
            </div>

            {/* Recipient */}
            <div className="flex-1 bg-green-50 border border-green-100 rounded-lg p-3">
              <p className="text-xs uppercase font-medium text-green-600 mb-1">Recipient</p>
              <p className="text-sm font-medium text-gray-900">{rd.recipient_store_name}</p>
              <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                <span>Grade {rd.recipient_grade}</span>
                <span className="text-green-600 font-medium">WOC {rd.recipient_woc}w</span>
                <span>ROS {rd.recipient_ros}</span>
              </div>
            </div>
          </div>

          {/* ROS Comparison */}
          <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
            <span>Donor ROS {rd.donor_ros}</span>
            <ArrowRight className="w-3 h-3 text-gray-400" />
            <span>Recipient ROS {rd.recipient_ros}</span>
            <span className="text-green-600 font-medium">
              ({Math.round((rd.recipient_ros / rd.donor_ros) * 100)}% higher velocity)
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Vendor Health Helper ─────────────────────────────────────────────

function vendorStatusVariant(status: ARVendorHealth['status']): 'success' | 'warning' | 'error' {
  if (status === 'healthy') return 'success';
  if (status === 'warning') return 'warning';
  return 'error';
}

function fgAdequacyVariant(pct: number): 'success' | 'warning' | 'error' {
  if (pct >= 70) return 'success';
  if (pct >= 50) return 'warning';
  return 'error';
}

function metricVariant(value: number, threshold: number): 'success' | 'error' {
  return value >= threshold ? 'success' : 'error';
}

// ─── Vendor Health Section ───────────────────────────────────────────

function VendorHealthSection() {
  return (
    <div className="space-y-3">
      <SectionHeader title="CORE Supply Pipeline" />

      {/* Vendor Health Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <DataTable>
            <DataTableHeader className="bg-gray-50">
              <DataTableHead>Vendor</DataTableHead>
              <DataTableHead>Tier</DataTableHead>
              <DataTableHead align="right">Alloc%</DataTableHead>
              <DataTableHead align="right">OTIF</DataTableHead>
              <DataTableHead align="right">FTR</DataTableHead>
              <DataTableHead align="right">FG SS Adequacy</DataTableHead>
              <DataTableHead align="right">FF SS Adequacy</DataTableHead>
              <DataTableHead align="right">Capacity Available</DataTableHead>
              <DataTableHead align="right">Lead Time</DataTableHead>
              <DataTableHead>Cost Status</DataTableHead>
              <DataTableHead>Status</DataTableHead>
            </DataTableHeader>
            <DataTableBody>
              {arVendorHealth.map((v) => (
                <DataTableRow key={v.id} className="border-t border-gray-100">
                  <DataTableCell>
                    <span className="text-xs font-medium text-gray-900">{v.vendor_name}</span>
                  </DataTableCell>
                  <DataTableCell>
                    <Badge
                      variant={v.vendor_tier === 'Primary' ? 'primary' : v.vendor_tier === 'Secondary' ? 'info' : 'default'}
                      className="text-xs"
                    >
                      {v.vendor_tier}
                    </Badge>
                  </DataTableCell>
                  <DataTableCell align="right">
                    <span className="text-xs text-gray-700">{v.allocation_pct}%</span>
                  </DataTableCell>
                  <DataTableCell align="right">
                    <Badge variant={metricVariant(v.otif_pct, v.otif_threshold)} className="text-xs">
                      {v.otif_pct}%
                    </Badge>
                  </DataTableCell>
                  <DataTableCell align="right">
                    <Badge variant={metricVariant(v.ftr_pct, v.ftr_threshold)} className="text-xs">
                      {v.ftr_pct}%
                    </Badge>
                  </DataTableCell>
                  <DataTableCell align="right">
                    <Badge variant={fgAdequacyVariant(v.fg_ss_adequacy_pct)} className="text-xs">
                      {v.fg_ss_adequacy_pct}%
                    </Badge>
                  </DataTableCell>
                  <DataTableCell align="right">
                    <Badge variant={fgAdequacyVariant(v.ff_ss_adequacy_pct)} className="text-xs">
                      {v.ff_ss_adequacy_pct}%
                    </Badge>
                  </DataTableCell>
                  <DataTableCell align="right">
                    <span className="text-xs text-gray-700">
                      {formatNumber(v.production_available)} / {formatNumber(v.production_capacity_monthly)}
                    </span>
                  </DataTableCell>
                  <DataTableCell align="right">
                    <span className="text-xs text-gray-700">{v.avg_lead_time_days}d</span>
                  </DataTableCell>
                  <DataTableCell>
                    <Badge variant={v.costing_valid ? 'success' : 'error'} className="text-xs">
                      {v.costing_valid ? 'Valid' : 'Expired'}
                    </Badge>
                  </DataTableCell>
                  <DataTableCell>
                    <Badge variant={vendorStatusVariant(v.status)} className="text-xs capitalize">
                      {v.status}
                    </Badge>
                  </DataTableCell>
                </DataTableRow>
              ))}
            </DataTableBody>
          </DataTable>
        </div>
      </div>

      {/* Vendor Switch Events */}
      {arVendorSwitchEvents.length > 0 && (
        <VendorSwitchEventsSection events={arVendorSwitchEvents} />
      )}
    </div>
  );
}

// ─── Vendor Switch Events ────────────────────────────────────────────

function VendorSwitchEventsSection({ events }: { events: ARVendorSwitchEvent[] }) {
  return (
    <div className="space-y-3">
      <SectionHeader
        title="Recent Vendor Switches"
        subtitle={`${events.length} event${events.length > 1 ? 's' : ''}`}
      />
      {events.map((evt) => (
        <div key={evt.id} className="bg-white rounded-lg border border-gray-200 p-3 hover:border-primary/30 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">{formatTime(evt.timestamp)}</span>
              <span className="text-xs font-medium text-gray-900">{evt.style_name}</span>
              <Badge variant="default" className="text-xs">{evt.category}</Badge>
            </div>
            <Badge variant="info" className="text-xs">
              {evt.approved_by}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-700 mb-1">
            <span className="font-medium">{evt.from_vendor}</span>
            <span className="text-gray-500">({evt.from_tier})</span>
            <ArrowRight className="w-3 h-3 text-gray-400" />
            <span className="font-medium">{evt.to_vendor}</span>
            <span className="text-gray-500">({evt.to_tier})</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span>Reason: {evt.switch_reason.replace(/_/g, ' ')}</span>
            <span className="text-gray-400">|</span>
            <span>{evt.triggering_metric}</span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Reversal eligible: {evt.reversal_eligible_date}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Fashion Lifecycle Cascade Section ───────────────────────────────

function FashionLifecycleCascadeSection({
  lifecycle,
  onCascade,
  onFlagAntiRotation,
}: {
  lifecycle: ReturnType<typeof useOTBStore.getState>['fashionLifecycle'];
  onCascade: (optionId: string) => void;
  onFlagAntiRotation: (optionId: string, storeId: string) => void;
}) {
  const [cascadeTarget, setCascadeTarget] = useState<{ optionId: string; name: string; currentStage: string } | null>(null);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <SectionHeader
        title="Fashion Lifecycle Cascade"
        subtitle="45+45+30 lifecycle tracking with dual-clock ageing"
      />

      <DataTable>
        <DataTableHeader>
          <DataTableHead>Option ID</DataTableHead>
          <DataTableHead>Category</DataTableHead>
          <DataTableHead align="center">Current Stage</DataTableHead>
          <DataTableHead align="right">Store Age (d)</DataTableHead>
          <DataTableHead align="right">Network Age (d)</DataTableHead>
          <DataTableHead align="right">Days Remaining</DataTableHead>
          <DataTableHead align="right">Sell-Through %</DataTableHead>
          <DataTableHead align="center">Anti-Rotation</DataTableHead>
          <DataTableHead align="center">Actions</DataTableHead>
        </DataTableHeader>
        <DataTableBody>
          {lifecycle.length === 0 ? (
            <tr>
              <td colSpan={9} className="py-8 text-center text-sm text-gray-500">
                No lifecycle data available
              </td>
            </tr>
          ) : (
            lifecycle.map((opt) => {
              const stage = stageConfig[opt.currentStage];
              const daysRemaining = stageDaysRemaining(opt.currentStage, opt.networkAge);
              const avgStoreAge = opt.storePositions.length > 0
                ? Math.round(opt.storePositions.reduce((s, p) => s + p.storeAge, 0) / opt.storePositions.length)
                : 0;
              const avgSellThrough = opt.storePositions.length > 0
                ? Math.round(opt.storePositions.reduce((s, p) => s + p.sellThrough, 0) / opt.storePositions.length)
                : 0;
              const hasAntiRotation = opt.storePositions.some((p) => p.antiRotationFlag);
              const canCascade = opt.currentStage !== 'written-off';
              const flaggableStore = opt.storePositions.find((p) => !p.antiRotationFlag);

              return (
                <DataTableRow key={opt.optionId}>
                  <DataTableCell className="font-mono text-xs text-gray-700">{opt.optionId}</DataTableCell>
                  <DataTableCell className="font-medium text-gray-900">{opt.optionName}</DataTableCell>
                  <DataTableCell align="center">
                    <Badge variant={stage.variant} size="sm">{stage.label}</Badge>
                  </DataTableCell>
                  <DataTableCell align="right" className="text-gray-700">{avgStoreAge}</DataTableCell>
                  <DataTableCell align="right" className="text-gray-700">{opt.networkAge}</DataTableCell>
                  <DataTableCell align="right">
                    <span className={cn(
                      'font-medium',
                      daysRemaining <= 7 ? 'text-red-700' : daysRemaining <= 15 ? 'text-amber-700' : 'text-gray-700'
                    )}>
                      {daysRemaining}
                    </span>
                  </DataTableCell>
                  <DataTableCell align="right">
                    <div className="flex items-center justify-end gap-1">
                      <span className={cn(
                        'font-medium',
                        avgSellThrough >= 50 ? 'text-green-700' : avgSellThrough >= 30 ? 'text-amber-700' : 'text-red-700'
                      )}>
                        {avgSellThrough}%
                      </span>
                      {avgSellThrough >= 50
                        ? <TrendingUp className="w-3 h-3 text-green-600" />
                        : <TrendingDown className="w-3 h-3 text-red-600" />
                      }
                    </div>
                  </DataTableCell>
                  <DataTableCell align="center">
                    {hasAntiRotation ? (
                      <Badge variant="error" size="sm">Flagged</Badge>
                    ) : (
                      <span className="text-xs text-gray-400">&mdash;</span>
                    )}
                  </DataTableCell>
                  <DataTableCell align="center">
                    <div className="flex items-center justify-center gap-1">
                      {canCascade && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs"
                          onClick={() => setCascadeTarget({ optionId: opt.optionId, name: opt.optionName, currentStage: stageConfig[opt.currentStage].label })}
                          aria-label={`Cascade ${opt.optionName} to next stage`}
                        >
                          <ArrowDown className="w-3 h-3 mr-1" />
                          Cascade
                        </Button>
                      )}
                      {flaggableStore && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-xs"
                          onClick={() => onFlagAntiRotation(opt.optionId, flaggableStore.storeId)}
                          aria-label={`Flag anti-rotation for ${opt.optionName}`}
                        >
                          <Flag className="w-3 h-3 mr-1" />
                          Flag
                        </Button>
                      )}
                    </div>
                  </DataTableCell>
                </DataTableRow>
              );
            })
          )}
        </DataTableBody>
      </DataTable>

      <ConfirmDialog
        open={cascadeTarget !== null}
        onOpenChange={(open) => !open && setCascadeTarget(null)}
        title="Confirm Lifecycle Cascade"
        description={cascadeTarget ? `Move "${cascadeTarget.name}" from ${cascadeTarget.currentStage} to the next lifecycle stage? This will trigger store-level transfers and markdown adjustments.` : ''}
        confirmLabel="Cascade"
        onConfirm={() => {
          if (cascadeTarget) {
            onCascade(cascadeTarget.optionId);
            setCascadeTarget(null);
          }
        }}
      />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────

export function ARDashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const storeFilter = searchParams.get('store');

  const fashionLifecycle = useOTBStore((s) => s.fashionLifecycle);
  const triggerCascade = useOTBStore((s) => s.triggerCascade);
  const flagAntiRotation = useOTBStore((s) => s.flagAntiRotation);

  const todayRuns = arPipelineRuns.filter((r) => r.started_at.startsWith('2026-03-05'));
  const completedToday = todayRuns.filter((r) => r.status === 'completed').length;
  const runningToday = todayRuns.filter((r) => r.status === 'running').length;
  const failedToday = todayRuns.filter((r) => r.status === 'failed').length;

  const filteredCounts = useMemo(() => {
    if (!storeFilter) {
      return {
        pullback: arPullbacks.length,
        replenishment: arReplenishments.length,
        redistribution: arRedistributions.length,
      };
    }
    return {
      pullback: arPullbacks.filter(pb => matchesStoreFilter(pb.store_name, storeFilter)).length,
      replenishment: arReplenishments.filter(rep => matchesStoreFilter(rep.store_name, storeFilter)).length,
      redistribution: arRedistributions.filter(rd => matchesStoreFilter(rd.donor_store_name, storeFilter) || matchesStoreFilter(rd.recipient_store_name, storeFilter)).length,
    };
  }, [storeFilter]);

  return (
    <div className="animate-fadeInUp space-y-4">
      <PageHeader
        title="A&R Dashboard"
        actions={
          <StoreFilterSelect
            value={storeFilter}
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

      {/* Cross-module links */}
      <div className="flex justify-end gap-4">
        <Link to={storeFilter ? `/inventory?store=${encodeURIComponent(storeFilter)}` : '/inventory'} className="text-xs text-primary hover:underline flex items-center gap-1">
          View Inventory Health <ArrowRight className="w-3 h-3" />
        </Link>
        <Link to={storeFilter ? `/inventory?store=${encodeURIComponent(storeFilter)}` : '/inventory'} className="text-xs text-gray-500 hover:text-primary hover:underline flex items-center gap-1">
          Active Workflows ({activeWorkflows.filter(w => w.status !== 'completed').length}) <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Summary Strip */}
      <MetricGrid columns={4}>
        <MetricCard
          label="Pipeline Runs Today"
          value={arSummary.todayRuns}
          subtitle={`${completedToday} completed, ${runningToday} running${failedToday > 0 ? `, ${failedToday} failed` : ''}`}
          status={failedToday > 0 ? 'critical' : runningToday > 0 ? 'warning' : 'on-track'}
        />
        <MetricCard
          label="Pullback Actions"
          value={arSummary.totalPullbacks}
          subtitle={`${arSummary.approvedPullbacks} approved, ${arSummary.pendingPullbacks} pending`}
        />
        <MetricCard
          label="Replenishment Fill Rate"
          value={`${arSummary.avgFillRate}%`}
          subtitle={`${arSummary.fulfilledReplenishments} fully filled, ${arSummary.stockoutReplenishments} stockout`}
          status={arSummary.avgFillRate >= 90 ? 'on-track' : arSummary.avgFillRate >= 70 ? 'warning' : 'critical'}
        />
        <MetricCard
          label="Red List Items"
          value={arSummary.redListCount}
          subtitle={`${arSummary.criticalActions} critical actions today`}
          status={arSummary.redListCount > 0 ? 'critical' : 'on-track'}
        />
      </MetricGrid>

      {/* Tabbed Content */}
      <Tabs defaultValue="pipeline">
        <TabsList variant="underline">
          <TabsTrigger value="pipeline">Pipeline Runs</TabsTrigger>
          <TabsTrigger value="pullback">Pullback ({filteredCounts.pullback})</TabsTrigger>
          <TabsTrigger value="replenishment">Replenishment ({filteredCounts.replenishment})</TabsTrigger>
          <TabsTrigger value="redistribution">Redistribution ({filteredCounts.redistribution})</TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline">
          <PipelineRunsTab storeFilter={storeFilter} />
        </TabsContent>

        <TabsContent value="pullback">
          <PullbackTab storeFilter={storeFilter} />
        </TabsContent>

        <TabsContent value="replenishment">
          <ReplenishmentTab storeFilter={storeFilter} />
        </TabsContent>

        <TabsContent value="redistribution">
          <RedistributionTab storeFilter={storeFilter} />
        </TabsContent>
      </Tabs>

      {/* CORE Supply Pipeline */}
      <VendorHealthSection />

      {/* Fashion Lifecycle Cascade */}
      <FashionLifecycleCascadeSection
        lifecycle={fashionLifecycle.length > 0 ? fashionLifecycle : mockFashionLifecycle}
        onCascade={triggerCascade}
        onFlagAntiRotation={flagAntiRotation}
      />
    </div>
  );
}
