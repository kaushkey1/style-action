import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowRight, CheckCircle, XCircle, AlertTriangle, Clock } from 'lucide-react';
import {
  Badge,
  Button,
  EmptyState,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  FilterBar,
  FilterPills,
  FilterSearch,
  StoreFilterSelect,
  PageHeader,
  DataTable,
  DataTableHeader,
  DataTableBody,
  DataTableRow,
  DataTableHead,
  DataTableCell,
} from '@/components/ui';
import {
  arDailyActions,
  arLifecycleTransitions,
  arRotationAlerts,
  arTriageBridges,
  arReplenishments,
  arPullbacks,
  type ARDailyAction,
  type ARLifecycleTransition,
  type ARRotationAlert,
  type ARTriageBridge,
  type ARReplenishment,
  type CoreTriggerType,
  type FeasibilityStatus,
  type UpstreamPipelineStatus,
  type SizeBreakdown,
} from '../data/mockAR';
import {cn, getCurrencySymbol} from '@/lib/utils';

// ─── Helpers ──────────────────────────────────────────────────────────

function matchesStoreFilter(storeName: string, query: string): boolean {
  const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
  const q = normalize(query);
  const s = normalize(storeName);
  return s.includes(q) || q.includes(s);
}

const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 } as const;

const priorityBorder: Record<string, string> = {
  critical: 'border-l-red-500',
  high: 'border-l-amber-500',
  medium: 'border-l-blue-500',
  low: 'border-l-gray-300',
};

const severityBorder: Record<string, string> = {
  critical: 'border-l-red-500',
  high: 'border-l-amber-500',
  medium: 'border-l-blue-500',
};

const triggerTypeLabel: Record<CoreTriggerType, string> = {
  STORE_MIN_BREACH: 'Store Min Breach',
  DC_MIN_BREACH: 'DC Min Breach',
  DC_PROJECTED_STOCKOUT: 'DC Stockout',
  FG_SS_LOW: 'FG SS Low',
  DEMAND_SPIKE: 'Demand Spike',
  VENDOR_SWITCH: 'Vendor Switch',
  FESTIVE_PREBUILD: 'Festive Pre-Build',
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

const feasibilityLabel: Record<FeasibilityStatus, string> = {
  FEASIBLE: 'Feasible',
  PARTIALLY_FEASIBLE: 'Partial',
  INFEASIBLE: 'Infeasible',
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

function itemTypeBadge(itemType: ARDailyAction['item_type']) {
  const map: Record<string, { label: string; variant: 'primary' | 'info' | 'warning' }> = {
    NOOS: { label: 'NOOS', variant: 'primary' },
    fashion: { label: 'Fashion', variant: 'info' },
    fast_fashion: { label: 'Fast Fashion', variant: 'warning' },
  };
  const entry = map[itemType] ?? { label: itemType, variant: 'info' as const };
  return <Badge variant={entry.variant} className="text-xs">{entry.label}</Badge>;
}

function actionTypeBadge(type: ARDailyAction['action_type']) {
  const map: Record<string, { label: string; variant: 'primary' | 'warning' | 'info' | 'error' | 'default' }> = {
    pullback: { label: 'Pullback', variant: 'warning' },
    replenishment: { label: 'Replenishment', variant: 'primary' },
    redistribution: { label: 'Redistribution', variant: 'info' },
    lifecycle_transition: { label: 'Lifecycle', variant: 'default' },
    markdown_trigger: { label: 'Markdown', variant: 'error' },
    rotation_alert: { label: 'Rotation', variant: 'error' },
    size_completion: { label: 'Size Completion', variant: 'warning' },
    ros_decline: { label: 'ROS Decline', variant: 'error' },
  };
  const entry = map[type] ?? { label: type, variant: 'default' as const };
  return <Badge variant={entry.variant} className="text-xs">{entry.label}</Badge>;
}

function priorityBadge(priority: string) {
  const map: Record<string, 'error' | 'warning' | 'info' | 'default'> = {
    critical: 'error',
    high: 'warning',
    medium: 'info',
    low: 'default',
  };
  return <Badge variant={map[priority] ?? 'default'} className="text-xs capitalize">{priority}</Badge>;
}

function statusBadge(status: string) {
  const map: Record<string, 'warning' | 'success' | 'info' | 'error' | 'default'> = {
    pending: 'warning',
    pending_approval: 'warning',
    approved: 'success',
    auto_approved: 'success',
    in_transit: 'info',
    completed: 'success',
    rejected: 'error',
    escalated: 'error',
    overridden: 'default',
    open: 'warning',
    acknowledged: 'info',
    resolved: 'success',
    ar_action_created: 'success',
    dismissed: 'default',
  };
  const label = status.replace(/_/g, ' ');
  return <Badge variant={map[status] ?? 'default'} className="text-xs capitalize">{label}</Badge>;
}

function phaseBadge(phase: string) {
  const map: Record<string, 'success' | 'primary' | 'warning' | 'error' | 'default'> = {
    A0: 'success',
    A1: 'primary',
    A2: 'warning',
    A3: 'error',
    liquidation: 'error',
  };
  return <Badge variant={map[phase] ?? 'default'} className="text-xs">{phase === 'liquidation' ? 'Liquidation' : phase}</Badge>;
}

// ─── Summary Strip ──────────────────────────────────────────────────

function SummaryStrip({ storeFilter }: { storeFilter: string | null }) {
  const actions = useMemo(() => {
    if (!storeFilter) return arDailyActions;
    return arDailyActions.filter(a => matchesStoreFilter(a.store_name, storeFilter));
  }, [storeFilter]);

  const totalActions = actions.length;
  const redList = actions.filter(a => a.is_red_list).length;
  const critical = actions.filter(a => a.priority === 'critical').length;
  const pendingApproval = actions.filter(a => a.status === 'pending').length;
  const inTransit = actions.filter(a => a.status === 'in_transit').length;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 flex items-center divide-x divide-gray-200">
      <div className="pr-6">
        <p className="text-xs text-gray-500">Total Actions</p>
        <p className="text-lg font-bold text-gray-900">{totalActions}</p>
      </div>
      <div className="px-6">
        <p className="text-xs text-gray-500">Red List</p>
        <p className={cn('text-lg font-semibold', redList > 0 ? 'text-red-600' : 'text-gray-900')}>
          {redList}
        </p>
      </div>
      <div className="px-6">
        <p className="text-xs text-gray-500">Critical</p>
        <p className={cn('text-lg font-semibold', critical > 0 ? 'text-red-600' : 'text-gray-900')}>
          {critical}
        </p>
      </div>
      <div className="px-6">
        <p className="text-xs text-gray-500">Pending Approval</p>
        <p className="text-lg font-bold text-gray-900">{pendingApproval}</p>
      </div>
      <div className="pl-6">
        <p className="text-xs text-gray-500">In Transit</p>
        <p className="text-lg font-bold text-gray-900">{inTransit}</p>
      </div>
    </div>
  );
}

// ─── Daily Action Queue ─────────────────────────────────────────────

function DailyActionQueue({ storeFilter }: { storeFilter: string | null }) {
  const [search, setSearch] = useState('');
  const [actionTypeFilter, setActionTypeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  const actionTypeOptions = [
    { value: 'all', label: 'All' },
    { value: 'pullback', label: 'Pullback' },
    { value: 'replenishment', label: 'Replenishment' },
    { value: 'redistribution', label: 'Redistribution' },
    { value: 'lifecycle_transition', label: 'Lifecycle' },
    { value: 'markdown_trigger', label: 'Markdown' },
    { value: 'rotation_alert', label: 'Rotation' },
    { value: 'size_completion', label: 'Size Completion' },
    { value: 'ros_decline', label: 'ROS Decline' },
  ];

  const priorityOptions = [
    { value: 'all', label: 'All' },
    { value: 'critical', label: 'Critical' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
  ];

  const filtered = useMemo(() => {
    let items = arDailyActions;

    // Apply store filter from URL first
    if (storeFilter) {
      items = items.filter(a => matchesStoreFilter(a.store_name, storeFilter));
    }

    if (search) {
      const q = search.toLowerCase();
      items = items.filter(
        a => a.style_name.toLowerCase().includes(q) ||
          a.sku.toLowerCase().includes(q) ||
          a.store_name.toLowerCase().includes(q) ||
          a.store_id.toLowerCase().includes(q) ||
          q.includes(a.store_name.toLowerCase())
      );
    }
    if (actionTypeFilter !== 'all') {
      items = items.filter(a => a.action_type === actionTypeFilter);
    }
    if (priorityFilter !== 'all') {
      items = items.filter(a => a.priority === priorityFilter);
    }

    return items;
  }, [storeFilter, search, actionTypeFilter, priorityFilter]);

  const redListItems = useMemo(() =>
    filtered.filter(a => a.is_red_list).sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]),
    [filtered]
  );

  const otherItems = useMemo(() =>
    filtered.filter(a => !a.is_red_list).sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]),
    [filtered]
  );

  return (
    <div className="space-y-3">
      <FilterBar>
        <FilterPills value={actionTypeFilter} onChange={setActionTypeFilter} options={actionTypeOptions} />
        <FilterPills value={priorityFilter} onChange={setPriorityFilter} options={priorityOptions} />
        <FilterSearch value={search} onChange={setSearch} placeholder="Search style, SKU, store..." />
      </FilterBar>

      {filtered.length === 0 ? (
        <EmptyState description="No actions match your filters" />
      ) : (
        <div className="space-y-3">
          {/* Red List Section */}
          {redListItems.length > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50/30 p-3 space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span className="text-sm font-semibold text-red-700">Red List Items</span>
                <Badge variant="error" className="text-xs">{redListItems.length}</Badge>
              </div>
              {redListItems.map(action => (
                <ActionRow key={action.id} action={action} />
              ))}
            </div>
          )}

          {/* Remaining Actions */}
          {otherItems.length > 0 && (
            <div className="space-y-2">
              {otherItems.map(action => (
                <ActionRow key={action.id} action={action} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SizeBreakdownTable({ breakdown }: { breakdown: SizeBreakdown[] }) {
  return (
    <div className="mt-2 rounded border border-gray-200 overflow-hidden">
      <DataTable>
        <DataTableHeader className="bg-gray-50">
          <DataTableHead className="px-2 py-1">Size</DataTableHead>
          <DataTableHead className="px-2 py-1" align="right">IP</DataTableHead>
          <DataTableHead className="px-2 py-1" align="right">ADS</DataTableHead>
          <DataTableHead className="px-2 py-1" align="right">DOC</DataTableHead>
          <DataTableHead className="px-2 py-1" align="right">Min</DataTableHead>
          <DataTableHead className="px-2 py-1" align="right">Max</DataTableHead>
          <DataTableHead className="px-2 py-1" align="center">Status</DataTableHead>
        </DataTableHeader>
        <DataTableBody>
          {breakdown.map((s) => (
            <DataTableRow key={s.size} className={cn(
              s.status === 'oos' && 'bg-red-50',
              s.status === 'low' && 'bg-amber-50',
            )}>
              <DataTableCell className="px-2 py-1 font-medium">{s.size}</DataTableCell>
              <DataTableCell className="px-2 py-1" align="right">{s.ip}</DataTableCell>
              <DataTableCell className="px-2 py-1" align="right">{s.ads.toFixed(1)}</DataTableCell>
              <DataTableCell className="px-2 py-1" align="right">{s.doc.toFixed(1)}d</DataTableCell>
              <DataTableCell className="px-2 py-1" align="right">{s.min}</DataTableCell>
              <DataTableCell className="px-2 py-1" align="right">{s.max}</DataTableCell>
              <DataTableCell className="px-2 py-1" align="center">
                <Badge variant={s.status === 'oos' ? 'error' : s.status === 'low' ? 'warning' : 'success'}>
                  {s.status === 'oos' ? 'OOS' : s.status === 'low' ? 'Low' : 'OK'}
                </Badge>
              </DataTableCell>
            </DataTableRow>
          ))}
        </DataTableBody>
      </DataTable>
    </div>
  );
}

function ActionRow({ action }: { action: ARDailyAction }) {
  const matchedRep: ARReplenishment | undefined =
    action.action_type === 'replenishment' || action.action_type === 'size_completion'
      ? arReplenishments.find(r => r.sku === action.sku && r.store_id === action.store_id)
      : undefined;

  const matchedPullback =
    action.action_type === 'pullback' && action.sub_type === 'BrokenSet'
      ? arPullbacks.find(p => p.sku === action.sku && p.store_id === action.store_id)
      : undefined;

  return (
    <div
      className={cn(
        'bg-white rounded-lg border border-gray-200 p-3 border-l-4 hover:border-primary/30 hover:shadow-md transition-all duration-200',
        priorityBorder[action.priority]
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            {action.is_red_list && (
              <Badge variant="error" className="text-xs uppercase font-bold">Red List</Badge>
            )}
            {itemTypeBadge(action.item_type)}
            {actionTypeBadge(action.action_type)}
            {priorityBadge(action.priority)}
            {statusBadge(action.status)}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-900">{action.style_name}</span>
            <span className="text-xs font-mono text-gray-500">{action.sku}</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
            <span>{action.store_name} ({action.store_id})</span>
            <span>{action.units} units</span>
            <span>{action.value_lakh} L</span>
            <span>Net: {action.network_age_days}d / Store: {action.store_age_days}d</span>
            {action.size_completeness_pct !== undefined && (
              <span className={cn('font-medium', action.size_completeness_pct < 80 ? 'text-red-600' : 'text-gray-500')}>
                Size: {action.size_completeness_pct}%
              </span>
            )}
            {action.projected_stockout_days !== undefined && action.projected_stockout_days <= 7 && (
              <span className={cn('font-medium', action.projected_stockout_days === 0 ? 'text-red-600' : 'text-amber-600')}>
                {action.projected_stockout_days === 0 ? 'Stockout' : `Stockout in ${action.projected_stockout_days}d`}
              </span>
            )}
            {action.ros_wow_decline_pct !== undefined && (
              <span className="font-medium text-red-600">
                ROS -{action.ros_wow_decline_pct}% WoW
              </span>
            )}
          </div>
          {action.is_red_list && action.red_list_reason && (
            <p className="text-xs text-red-600 font-medium">{action.red_list_reason}</p>
          )}
          <p className="text-xs text-gray-500">{action.recommended_action}</p>

          {/* CORE Pipeline Context — Replenishment / Size Completion */}
          {matchedRep && (
            <div className="mt-3 space-y-2 border-t border-gray-100 pt-2">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <Badge variant={triggerTypeVariant[matchedRep.trigger_type]}>
                  {triggerTypeLabel[matchedRep.trigger_type]}
                </Badge>
                <Badge variant={feasibilityVariant[matchedRep.feasibility_status]}>
                  {feasibilityLabel[matchedRep.feasibility_status]}
                </Badge>
                <Badge variant={upstreamVariant[matchedRep.upstream_status]}>
                  Pipeline: {matchedRep.upstream_status}
                </Badge>
                {matchedRep.oos_corrected && (
                  <Badge variant="warning">OOS Corrected (raw: {matchedRep.raw_ros})</Badge>
                )}
                {matchedRep.surge_factor > 1 && (
                  <Badge variant="primary">{matchedRep.surge_factor}x Surge</Badge>
                )}
              </div>
              <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                <span>DC DOC: <span className={cn('font-medium', matchedRep.dc_doc_days < 7 ? 'text-red-600' : 'text-gray-700')}>{matchedRep.dc_doc_days}d</span></span>
                <span>Vendor FG: <span className={cn('font-medium', matchedRep.vendor_fg_adequacy_pct < 50 ? 'text-red-600' : 'text-gray-700')}>{matchedRep.vendor_fg_adequacy_pct}%</span></span>
                {matchedRep.next_inbound_eta && <span>Next Inbound: <span className="font-medium text-gray-700">{matchedRep.next_inbound_eta}</span></span>}
                {matchedRep.store_need_by && <span>Need-By: <span className="font-medium text-gray-700">{matchedRep.store_need_by}</span></span>}
              </div>
              {matchedRep.constraint_annotations && matchedRep.constraint_annotations.length > 0 && (
                <div className="text-xs space-y-0.5">
                  {matchedRep.constraint_annotations.map((c, i) => (
                    <p key={i} className="text-amber-700 flex items-start gap-1">
                      <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                      {c}
                    </p>
                  ))}
                </div>
              )}
              {matchedRep.size_breakdown && (
                <SizeBreakdownTable breakdown={matchedRep.size_breakdown} />
              )}
            </div>
          )}

          {/* CORE Pipeline Context — BrokenSet Pullback */}
          {matchedPullback?.size_breakdown && (
            <SizeBreakdownTable breakdown={matchedPullback.size_breakdown} />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Lifecycle Transitions ──────────────────────────────────────────

function LifecycleTransitionsTab({ storeFilter }: { storeFilter: string | null }) {
  const items = useMemo(() => {
    if (!storeFilter) return arLifecycleTransitions;
    return arLifecycleTransitions.filter(t => matchesStoreFilter(t.store_name, storeFilter));
  }, [storeFilter]);

  return (
    <div className="space-y-2">
      {items.length === 0 ? (
        <EmptyState description="No lifecycle transitions pending" />
      ) : (
        items.map(t => (
          <LifecycleTransitionCard key={t.id} transition={t} />
        ))
      )}
    </div>
  );
}

function LifecycleTransitionCard({ transition }: { transition: ARLifecycleTransition }) {
  const triggerVariant: Record<string, 'default' | 'info' | 'warning' | 'error'> = {
    age_based: 'default',
    str_gated: 'warning',
    manual: 'info',
    clearance_sell_through: 'error',
  };

  const transitionStatusVariant: Record<string, 'warning' | 'success' | 'error'> = {
    pending_approval: 'warning',
    auto_approved: 'success',
    approved: 'success',
    rejected: 'error',
    overridden: 'warning',
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 hover:border-primary/30 hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0 space-y-1.5">
          {/* Phase transition + trigger */}
          <div className="flex items-center gap-2 flex-wrap">
            {phaseBadge(transition.from_phase)}
            <ArrowRight className="w-3 h-3 text-gray-400" />
            {phaseBadge(transition.to_phase)}
            <Badge variant={triggerVariant[transition.trigger] ?? 'default'} className="text-xs">
              {transition.trigger.replace(/_/g, ' ')}
            </Badge>
            <Badge variant={transitionStatusVariant[transition.status] ?? 'default'} className="text-xs capitalize">
              {transition.status.replace(/_/g, ' ')}
            </Badge>
          </div>

          {/* Style info */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-900">{transition.style_name}</span>
            <span className="text-xs font-mono text-gray-500">{transition.sku}</span>
          </div>

          {/* Metadata */}
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>{transition.store_name} ({transition.store_id})</span>
            <span>{transition.category}</span>
            <span>Net: {transition.network_age_days}d / Store: {transition.store_age_days}d</span>
            <span>STR: {transition.sell_through_pct}%</span>
            <span>{transition.units} units / {getCurrencySymbol()}{transition.value_lakh} L</span>
          </div>

          {/* STR gated info */}
          {transition.trigger === 'str_gated' && transition.str_gate_threshold !== undefined && (
            <div className="flex items-center gap-2 text-xs">
              <span className={cn(
                'font-medium',
                transition.sell_through_pct < transition.str_gate_threshold ? 'text-red-600' : 'text-green-600'
              )}>
                STR {transition.sell_through_pct}%
              </span>
              <span className="text-gray-500">vs threshold {transition.str_gate_threshold}%</span>
            </div>
          )}

          {/* Clearance sell-through info (SOP-09) */}
          {transition.clearance_weeks !== undefined && transition.clearance_sell_through_pct !== undefined && (
            <div className="flex items-center gap-3 text-xs bg-amber-50 border border-amber-100 rounded-lg px-3 py-1.5">
              <span className="text-amber-700 font-medium">Clearance:</span>
              <span className={cn(
                'font-medium',
                transition.clearance_sell_through_pct < 70 ? 'text-red-600' : 'text-green-600'
              )}>
                {transition.clearance_sell_through_pct}% sell-through
              </span>
              <span className="text-gray-500">after {transition.clearance_weeks}wk</span>
              {transition.clearance_sell_through_pct < 70 && (
                <span className="text-red-600 font-medium">&lt;70% threshold</span>
              )}
            </div>
          )}

          {/* Markdown info */}
          {transition.markdown_pct !== undefined && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-500">Markdown:</span>
              <span className="font-medium text-gray-900">{transition.markdown_pct}% below MRP</span>
            </div>
          )}

          {/* Recommended action */}
          <p className="text-xs text-gray-500">{transition.recommended_action}</p>

          {/* Approve/Reject buttons for pending_approval */}
          {transition.status === 'pending_approval' && (
            <div className="flex items-center gap-2 pt-1">
              <Button size="sm" variant="primary">
                <CheckCircle className="w-3 h-3" />
                Approve
              </Button>
              <Button size="sm" variant="outline">
                <XCircle className="w-3 h-3" />
                Reject
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Rotation Alerts ────────────────────────────────────────────────

function RotationAlertsTab({ storeFilter }: { storeFilter: string | null }) {
  const items = useMemo(() => {
    if (!storeFilter) return arRotationAlerts;
    return arRotationAlerts.filter(a => matchesStoreFilter(a.store_name, storeFilter));
  }, [storeFilter]);

  return (
    <div className="space-y-2">
      {items.length === 0 ? (
        <EmptyState description="No rotation alerts detected" />
      ) : (
        items.map(alert => (
          <RotationAlertCard key={alert.id} alert={alert} />
        ))
      )}
    </div>
  );
}

function RotationAlertCard({ alert }: { alert: ARRotationAlert }) {
  const alertTypeVariant: Record<string, 'error' | 'warning' | 'info'> = {
    rotation_detected: 'error',
    transfer_blocked: 'warning',
    reversal_required: 'error',
  };

  const alertStatusVariant: Record<string, 'warning' | 'info' | 'success' | 'error'> = {
    open: 'warning',
    acknowledged: 'info',
    resolved: 'success',
    escalated: 'error',
  };

  return (
    <div
      className={cn(
        'bg-white rounded-lg border border-gray-200 p-3 border-l-4 hover:border-primary/30 hover:shadow-md transition-all duration-200',
        severityBorder[alert.severity]
      )}
    >
      <div className="flex-1 min-w-0 space-y-1.5">
        {/* Badges row */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={alertTypeVariant[alert.alert_type] ?? 'default'} className="text-xs">
            {alert.alert_type.replace(/_/g, ' ')}
          </Badge>
          {priorityBadge(alert.severity)}
          <Badge variant={alertStatusVariant[alert.status] ?? 'default'} className="text-xs capitalize">
            {alert.status}
          </Badge>
        </div>

        {/* Style info */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-900">{alert.style_name}</span>
          <span className="text-xs font-mono text-gray-500">{alert.sku}</span>
        </div>

        {/* Metadata */}
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span>{alert.store_name} ({alert.store_id})</span>
          <span>{alert.category}</span>
          <span className="font-medium text-red-600">
            Net: {alert.network_age_days}d / Store: {alert.store_age_days}d
          </span>
          <span>{alert.transfer_count} transfers</span>
          <span>Last: {alert.last_transfer_date}</span>
        </div>

        {/* Details */}
        <p className="text-xs text-gray-500">{alert.details}</p>
      </div>
    </div>
  );
}

// ─── Triage Bridge ──────────────────────────────────────────────────

function TriageBridgeTab({ storeFilter }: { storeFilter: string | null }) {
  const items = useMemo(() => {
    if (!storeFilter) return arTriageBridges;
    return arTriageBridges.filter(b => matchesStoreFilter(b.store_name, storeFilter));
  }, [storeFilter]);

  return (
    <div className="space-y-2">
      {items.length === 0 ? (
        <EmptyState description="No triage bridge items" />
      ) : (
        items.map(bridge => (
          <TriageBridgeCard key={bridge.id} bridge={bridge} />
        ))
      )}
    </div>
  );
}

function TriageBridgeCard({ bridge }: { bridge: ARTriageBridge }) {
  const signalVariant: Record<string, 'warning' | 'error' | 'default'> = {
    underperforming: 'warning',
    dead_stock: 'error',
    broken_set: 'error',
  };

  const arActionVariant: Record<string, 'warning' | 'primary' | 'info'> = {
    pullback: 'warning',
    replenishment: 'primary',
    redistribution: 'info',
  };

  const bridgeStatusVariant: Record<string, 'warning' | 'success' | 'default'> = {
    pending: 'warning',
    ar_action_created: 'success',
    completed: 'success',
    dismissed: 'default',
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 hover:border-primary/30 hover:shadow-md transition-all duration-200">
      <div className="flex-1 min-w-0 space-y-1.5">
        {/* Badges row */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="info" className="text-xs">
            <Clock className="w-3 h-3" />
            Day-{bridge.triage_day}
          </Badge>
          <Badge variant={signalVariant[bridge.triage_signal] ?? 'default'} className="text-xs">
            {bridge.triage_signal.replace(/_/g, ' ')}
          </Badge>
          <ArrowRight className="w-3 h-3 text-gray-400" />
          <Badge variant={arActionVariant[bridge.ar_action_type] ?? 'default'} className="text-xs capitalize">
            {bridge.ar_action_type}
          </Badge>
          <Badge variant={bridgeStatusVariant[bridge.status] ?? 'default'} className="text-xs capitalize">
            {bridge.status.replace(/_/g, ' ')}
          </Badge>
        </div>

        {/* Style info */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-900">{bridge.style_name}</span>
          <span className="text-xs font-mono text-gray-500">{bridge.sku}</span>
        </div>

        {/* Metadata */}
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span>{bridge.store_name} ({bridge.store_id})</span>
          <span>{bridge.category}</span>
          <span>{bridge.units} units</span>
          <span>
            STR: <span className={cn('font-medium', bridge.triage_str < bridge.network_avg_str ? 'text-red-600' : 'text-green-600')}>
              {bridge.triage_str}%
            </span>
            {' '}vs avg {bridge.network_avg_str}%
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────

export function ARActionQueuePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const storeFilter = searchParams.get('store');

  // Compute filtered counts for tab badges
  const filteredCounts = useMemo(() => {
    if (!storeFilter) {
      return {
        daily: arDailyActions.length,
        lifecycle: arLifecycleTransitions.length,
        rotation: arRotationAlerts.length,
        triage: arTriageBridges.length,
      };
    }
    return {
      daily: arDailyActions.filter(a => matchesStoreFilter(a.store_name, storeFilter)).length,
      lifecycle: arLifecycleTransitions.filter(t => matchesStoreFilter(t.store_name, storeFilter)).length,
      rotation: arRotationAlerts.filter(a => matchesStoreFilter(a.store_name, storeFilter)).length,
      triage: arTriageBridges.filter(b => matchesStoreFilter(b.store_name, storeFilter)).length,
    };
  }, [storeFilter]);

  return (
    <div className="animate-fadeInUp space-y-4">
      <PageHeader
        title="A&R Action Queue"
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

      {/* Summary strip */}
      <SummaryStrip storeFilter={storeFilter} />

      {/* Tabs */}
      <Tabs defaultValue="daily">
        <TabsList variant="underline">
          <TabsTrigger value="daily">Daily Action Queue ({filteredCounts.daily})</TabsTrigger>
          <TabsTrigger value="lifecycle">Lifecycle Transitions ({filteredCounts.lifecycle})</TabsTrigger>
          <TabsTrigger value="rotation">Rotation Alerts ({filteredCounts.rotation})</TabsTrigger>
          <TabsTrigger value="triage">Triage Bridge ({filteredCounts.triage})</TabsTrigger>
        </TabsList>

        <TabsContent value="daily">
          <DailyActionQueue storeFilter={storeFilter} />
        </TabsContent>
        <TabsContent value="lifecycle">
          <LifecycleTransitionsTab storeFilter={storeFilter} />
        </TabsContent>
        <TabsContent value="rotation">
          <RotationAlertsTab storeFilter={storeFilter} />
        </TabsContent>
        <TabsContent value="triage">
          <TriageBridgeTab storeFilter={storeFilter} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
