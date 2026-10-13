import { useState, useCallback, useEffect } from 'react';
import { Save, RotateCcw, Info, Loader2 } from 'lucide-react';
import {
  Button,
  Input,
  Badge,
  PageHeader,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  DataTable,
  DataTableHeader,
  DataTableBody,
  DataTableRow,
  DataTableHead,
  DataTableCell,
} from '@/components/ui';
import { cn } from '@/lib/utils';
import { SimplePullbackTemplateSelector } from '../components/SimplePullbackTemplateSelector';
import { CollapsibleSection } from '../components/CollapsibleSection';
import {
  FilterRulesEditor,
  ConstantsEditor,
} from '../components/ANRConfigEditor';
import type { PullbackTemplate } from '../data/anrConfigTypes';
import { useANRAdminStore } from '../stores/useANRAdminStore';
import { useToast } from '@/hooks/useToast';

// ─── Field Row Component ────────────────────────────────────────────

interface FieldRowProps {
  label: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

function FieldRow({ label, description, children, className }: FieldRowProps) {
  return (
    <div className={cn('flex items-start justify-between gap-6 py-3 border-b border-gray-100 last:border-b-0', className)}>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {description && (
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        )}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

// ─── Number Input with suffix ───────────────────────────────────────

interface NumberFieldProps {
  value: number;
  onChange: (value: number) => void;
  suffix?: string;
  step?: number;
  min?: number;
  max?: number;
}

function NumberField({ value, onChange, suffix, step = 1, min, max }: NumberFieldProps) {
  return (
    <div className="flex items-center gap-1.5">
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        step={step}
        min={min}
        max={max}
        className="w-24 text-right py-1.5 text-sm"
      />
      {suffix && (
        <span className="text-sm text-gray-500 w-16">{suffix}</span>
      )}
    </div>
  );
}

// ─── Section Footer ─────────────────────────────────────────────────

function SectionFooter({ onSave, onReset, saving }: { onSave: () => void; onReset: () => void; saving?: boolean }) {
  return (
    <div className="flex items-center gap-3 pt-4 mt-4 border-t border-gray-200">
      <Button onClick={onSave} disabled={saving}>
        {saving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Save className="w-4 h-4 mr-1.5" />}
        {saving ? 'Saving...' : 'Save Changes'}
      </Button>
      <Button variant="secondary" onClick={onReset} disabled={saving}>
        <RotateCcw className="w-4 h-4 mr-1.5" />
        Reset to Defaults
      </Button>
    </div>
  );
}

// ─── Defaults (unified Inventory & A&R configuration) ───────────────

const DEFAULTS = {
  coverDays: {
    coreNoos: 30,
    ultimatesFashionBasics: 30,
    fashion: 45,
    fastFashion: 30,
    seasonal: 90,
    zeroToleranceDays: 180,
  },
  ageingAlerts: {
    noosPreWarningDays: 25,
    noosBreachDays: 30,
    fashionPreWarningDays: 38,
    fashionBreachDays: 45,
    noosStockoutProjectedDays: 7,
    rosDeclineWowThresholdPct: 30,
  },
  sizeCompleteness: {
    minThresholdPct: 80,
    brokenSetMarkdownDays: 7,
    brokenSetMinBsi: 0.4,
  },
  replenishment: {
    leadTimeDaysStandard: 3,
    leadTimeDaysExpress: 1,
    safetyStockMultiplier: 1.5,
    fillRateTarget: 95,
    stockoutAlertThreshold: 7,
    vmiVendors: 'Raymond, Arvind, Siyaram',
    minStoreGradeForExpress: 'A1',
    noosAutoApprovalWithinBudget: true,
    dispatchSlaMetroHours: 48,
    dispatchSlaTier23Hours: 72,
    noosTransferEligible: false,
    vmiEnabled: false,
    // Eligibility thresholds (from filter rules)
    minRosForEligibility: 0.2,
    minDisplayStock: 4,
    excludeWithActivePOs: true,
    maxFillRateBrick: 120,
    maxFillRateOptions: 120,
    minReplenishmentQty: 4,
    minStoreReplenishmentQty: 4,
  },
  pullback: {
    shared: {
      trailingWindowDays: 7,
      pullbackCooldownDays: 14,
    },
    bottomSeller: {
      enabled: true,
      minRosVsNetworkAvg: true,
      minStrVsAvg: true,
      excludeCoreGrade: true,
      minStockAgeDays: 45,
      fillRateFloor: 90,
      targetOptionGap: 3,
      targetBrickGap: 15,
    },
    brokenSet: {
      enabled: true,
      minBsiThreshold: 0.5,
      minStrVsAvg: true,
      excludeCoreGrade: true,
      requireNoInboundPOs: true,
      fillRateFloor: 90,
    },
    lifecycleCrossed: {
      enabled: true,
    },
    planogramOverfill: {
      enabled: true,
      dryRun: true,
      overfillThresholdPct: 120,
    },
  },
  redistribution: {
    minWocDonor: 12,
    maxWocRecipient: 4,
    minRosRecipient: 0.5,
    postMoveTrackingDays: 14,
    donorRosBelowNetworkAvg: true,
  },
  lifecycle: {
    a0ToA1Days: 45,
    a1ToA2Days: 45,
    a2ToA3Days: 30,
    strGateA1ToA2: 35,
    strGateA2ToA3: 25,
    rotationNetworkAgeThreshold: 60,
    rotationStoreAgeThreshold: 14,
    maxTransfersBeforeBlock: 3,
    enableSeasonalExemptions: true,
  },
  clearance: {
    maxInStoreClearanceWeeks: 4,
    clearanceSellThroughThresholdPct: 70,
    stage3MarkdownPct: '35-40',
    ajioListingWeeks: 3,
    residualDisposalTargetPct: 10,
    noLandfill: true,
    recyclingCertificateRequired: true,
  },
  channels: [
    { name: 'In-Store Clearance Counter', priority: 1, minRecoveryPct: 60, approvalLevel: 'R&M Head', trigger: 'Day 45 Stage 3 (35-40% markdown per SOP-09)' },
    { name: 'Ajio Clearance Event', priority: 2, minRecoveryPct: 40, approvalLevel: 'Auto', trigger: 'In-store clearance STR <70% after 4 weeks per SOP-09' },
    { name: 'Jio Outlet / Value Retail', priority: 3, minRecoveryPct: 50, approvalLevel: 'Auto', trigger: 'Post-Ajio clearance residual (40-50% markdown)' },
    { name: 'Employee Sale (Quarterly)', priority: 4, minRecoveryPct: 50, approvalLevel: 'R&M Head', trigger: 'Quarterly employee purchase event (40-50% markdown)' },
    { name: 'NGO / Community Donation', priority: 5, minRecoveryPct: 0, approvalLevel: 'R&M Head + Finance', trigger: 'Unsold after employee sale — at cost for CSR' },
    { name: 'Textile Recycling', priority: 6, minRecoveryPct: 0, approvalLevel: 'SCM Head', trigger: 'Final disposal — no landfill/incineration per SOP-09' },
  ],
  fillRate: {
    defaultFillRate: 0.9,
    overstockThresholdPct: 120,
    understockThresholdPct: 90,
  },
  scopeConstants: {
    trailingDays: 7,
    segmentsInScope: [42, 55, 56, 80],
    subFormatsInScope: [14, 42, 43, 49],
    brandsInScope: 'All active brands',
    minSalesThreshold: 0.01,
  },
};

// ─── Tab 1: Cover Days ──────────────────────────────────────────────

function CoverDaysTab() {
  const { config, loading, saving, error: apiError, fetch: fetchConfig, setConfig, save, resetToDefaults } = useANRAdminStore();
  const { success: toastSuccess, error: toastError } = useToast();

  // eslint-disable-next-line react-hooks/exhaustive-deps -- fetch on mount only
  useEffect(() => { fetchConfig('cover_days'); }, []);

  const updateConstant = useCallback(<K extends keyof import('../data/anrConfigTypes').ANRConstants>(
    key: K,
    value: import('../data/anrConfigTypes').ANRConstants[K],
  ) => {
    if (config) setConfig({ ...config, constants: { ...config.constants, [key]: value } });
  }, [config, setConfig]);

  const handleSave = useCallback(async () => {
    try {
      await save('cover_days');
      toastSuccess('Cover days configuration saved');
    } catch {
      toastError('Failed to save cover days configuration');
    }
  }, [save, toastSuccess, toastError]);

  const handleReset = useCallback(async () => {
    try {
      await resetToDefaults('cover_days');
      toastSuccess('Configuration reset to defaults');
    } catch {
      toastError('Failed to reset configuration');
    }
  }, [resetToDefaults, toastSuccess, toastError]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 px-4">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        <span className="text-sm text-gray-500">Loading configuration...</span>
      </div>
    );
  }

  if (apiError) {
    return (
      <div className="flex items-start gap-2 px-3 py-2.5 bg-red-50 rounded-lg text-sm text-red-700">
        <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <span>{apiError}</span>
      </div>
    );
  }

  if (!config) return null;

  const c = config.constants;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Target Cover Days by Category Type</h3>

        <FieldRow label="Core / NOOS" description="Never-out-of-stock basics with continuous replenishment">
          <NumberField value={c.cd_core_noos ?? DEFAULTS.coverDays.coreNoos} onChange={(v) => updateConstant('cd_core_noos', v)} suffix="d" min={1} max={90} />
        </FieldRow>

        <FieldRow label="Ultimates / Fashion Basics" description="High-volume essentials and perennial fashion staples">
          <NumberField value={c.cd_ultimates_fashion_basics ?? DEFAULTS.coverDays.ultimatesFashionBasics} onChange={(v) => updateConstant('cd_ultimates_fashion_basics', v)} suffix="d" min={1} max={90} />
        </FieldRow>

        <FieldRow label="Fashion" description="Trend-driven seasonal styles with lifecycle management">
          <NumberField value={c.cd_fashion ?? DEFAULTS.coverDays.fashion} onChange={(v) => updateConstant('cd_fashion', v)} suffix="d" min={1} max={90} />
        </FieldRow>

        <FieldRow label="Fast Fashion" description="Quick-turn, high-fashion-quotient items with aggressive exit">
          <NumberField value={c.cd_fast_fashion ?? DEFAULTS.coverDays.fastFashion} onChange={(v) => updateConstant('cd_fast_fashion', v)} suffix="d" min={1} max={90} />
        </FieldRow>

        <FieldRow label="Seasonal" description="Holiday and event-specific merchandise with hard exit dates">
          <NumberField value={c.cd_seasonal ?? DEFAULTS.coverDays.seasonal} onChange={(v) => updateConstant('cd_seasonal', v)} suffix="d" min={1} max={180} />
        </FieldRow>
      </div>

      {/* SOP-07 Ageing Alert Thresholds */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Ageing Alert Thresholds (SOP-07)</h3>
        <p className="text-xs text-gray-500 mb-3">Per SOP-07 Step 7.1: automated alerts generated when ageing thresholds are crossed. NOOS and fashion items have distinct thresholds.</p>

        <FieldRow label="NOOS Pre-Warning" description="NOOS option store ageing pre-warning alert (action required before breach)">
          <NumberField value={c.noos_pre_warning_days ?? DEFAULTS.ageingAlerts.noosPreWarningDays} onChange={(v) => updateConstant('noos_pre_warning_days', v)} suffix="d" min={1} max={60} />
        </FieldRow>

        <FieldRow label="NOOS Breach" description="NOOS option ageing breach threshold — mandatory action">
          <NumberField value={c.noos_breach_days ?? DEFAULTS.ageingAlerts.noosBreachDays} onChange={(v) => updateConstant('noos_breach_days', v)} suffix="d" min={1} max={60} />
        </FieldRow>

        <FieldRow label="Fashion Pre-Warning" description="Fashion option ageing pre-warning alert (action required before breach)">
          <NumberField value={c.fashion_pre_warning_days ?? DEFAULTS.ageingAlerts.fashionPreWarningDays} onChange={(v) => updateConstant('fashion_pre_warning_days', v)} suffix="d" min={1} max={90} />
        </FieldRow>

        <FieldRow label="Fashion Breach" description="Fashion option ageing breach threshold — triggers markdown or transfer">
          <NumberField value={c.fashion_breach_days ?? DEFAULTS.ageingAlerts.fashionBreachDays} onChange={(v) => updateConstant('fashion_breach_days', v)} suffix="d" min={1} max={90} />
        </FieldRow>

        <FieldRow label="NOOS Projected Stockout Alert" description="Alert when projected days-to-stockout falls below this threshold for NOOS options">
          <NumberField value={c.noos_stockout_projected_days ?? DEFAULTS.ageingAlerts.noosStockoutProjectedDays} onChange={(v) => updateConstant('noos_stockout_projected_days', v)} suffix="d" min={1} max={30} />
        </FieldRow>

        <FieldRow label="ROS Decline WoW Threshold" description="Week-on-week ROS decline percentage that triggers an early warning alert for fashion options">
          <NumberField value={c.ros_decline_wow_threshold_pct ?? DEFAULTS.ageingAlerts.rosDeclineWowThresholdPct} onChange={(v) => updateConstant('ros_decline_wow_threshold_pct', v)} suffix="%" min={10} max={80} />
        </FieldRow>
      </div>

      {/* SOP-07 Size Completeness */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Size Completeness Rules (SOP-07)</h3>
        <p className="text-xs text-gray-500 mb-3">Per SOP-07 Step 7.3: size completion is a non-negotiable standard. Broken sets that cannot be replenished must be marked down.</p>

        <FieldRow label="Min Size Completeness" description="Size completeness index below which replenishment or markdown is triggered">
          <NumberField value={c.min_size_completeness_pct ?? DEFAULTS.sizeCompleteness.minThresholdPct} onChange={(v) => updateConstant('min_size_completeness_pct', v)} suffix="%" min={50} max={100} />
        </FieldRow>

        <FieldRow label="Broken Set Markdown Deadline" description="Days within which a broken size set must be replenished. If not, mandatory markdown (SOP-07).">
          <NumberField value={c.broken_set_markdown_days ?? DEFAULTS.sizeCompleteness.brokenSetMarkdownDays} onChange={(v) => updateConstant('broken_set_markdown_days', v)} suffix="d" min={1} max={30} />
        </FieldRow>

        <FieldRow label="Broken Set Display Rule" description="Per SOP-07: displaying incomplete size sets beyond the markdown deadline without markdown action is not permitted">
          <Badge variant="error" className="text-xs">Mandatory Enforcement</Badge>
        </FieldRow>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Zero-Tolerance Threshold</h3>
        <FieldRow label="Absolute Exit Threshold" description="Network age beyond which no inventory should remain in any store. Triggers automatic lifecycle pullback and liquidation routing.">
          <NumberField value={c.zero_tolerance_days ?? DEFAULTS.coverDays.zeroToleranceDays} onChange={(v) => updateConstant('zero_tolerance_days', v)} suffix="d" min={90} max={365} />
        </FieldRow>
      </div>

      <div className="flex items-start gap-2 px-3 py-2.5 bg-blue-50 rounded-lg text-sm text-blue-700">
        <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <span>Cover day targets drive A&amp;R replenishment triggers and pullback thresholds. V4.2 discipline: Core/NOOS and Ultimates &le;30d, Fashion &le;45d. Zero tolerance beyond {c.zero_tolerance_days ?? DEFAULTS.coverDays.zeroToleranceDays}d network age. NOOS items alert at {c.noos_pre_warning_days ?? DEFAULTS.ageingAlerts.noosPreWarningDays}d/{c.noos_breach_days ?? DEFAULTS.ageingAlerts.noosBreachDays}d, Fashion at {c.fashion_pre_warning_days ?? DEFAULTS.ageingAlerts.fashionPreWarningDays}d/{c.fashion_breach_days ?? DEFAULTS.ageingAlerts.fashionBreachDays}d per SOP-07.</span>
      </div>

      <SectionFooter onSave={handleSave} onReset={handleReset} saving={saving} />
    </div>
  );
}

// ─── Tab 2: Replenishment (merged from Inventory + A&R) ─────────────

function ReplenishmentTab() {
  // All state is API-backed via the store
  const { config, loading, saving, error: apiError, fetch: fetchConfig, setConfig, save, resetToDefaults } = useANRAdminStore();
  const { success: toastSuccess, error: toastError } = useToast();

  // eslint-disable-next-line react-hooks/exhaustive-deps -- fetch on mount only
  useEffect(() => { fetchConfig('replenishment'); }, []);

  const updateConstant = useCallback(<K extends keyof import('../data/anrConfigTypes').ANRConstants>(
    key: K,
    value: import('../data/anrConfigTypes').ANRConstants[K],
  ) => {
    if (config) setConfig({ ...config, constants: { ...config.constants, [key]: value } });
  }, [config, setConfig]);

  const handleSave = useCallback(async () => {
    try {
      await save('replenishment');
      toastSuccess('Replenishment configuration saved');
    } catch {
      toastError('Failed to save replenishment configuration');
    }
  }, [save, toastSuccess, toastError]);

  const handleReset = useCallback(async () => {
    try {
      await resetToDefaults('replenishment');
      toastSuccess('Configuration reset to defaults');
    } catch {
      toastError('Failed to reset configuration');
    }
  }, [resetToDefaults, toastSuccess, toastError]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 px-4">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        <span className="text-sm text-gray-500">Loading configuration...</span>
      </div>
    );
  }

  if (apiError) {
    return (
      <div className="flex items-start gap-2 px-3 py-2.5 bg-red-50 rounded-lg text-sm text-red-700">
        <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <span>{apiError}</span>
      </div>
    );
  }

  if (!config) return null;

  const c = config.constants;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Replenishment Parameters</h3>

        <FieldRow label="Standard Lead Time" description="Default lead time for replenishment orders from DC">
          <NumberField value={c.lead_time_standard ?? DEFAULTS.replenishment.leadTimeDaysStandard} onChange={(v) => updateConstant('lead_time_standard', v)} suffix="d" min={1} max={30} />
        </FieldRow>

        <FieldRow label="Express Lead Time" description="Express delivery for A+ and A1 stores on critical stockouts">
          <NumberField value={c.lead_time_express ?? DEFAULTS.replenishment.leadTimeDaysExpress} onChange={(v) => updateConstant('lead_time_express', v)} suffix="d" min={1} max={7} />
        </FieldRow>

        <FieldRow label="Minimum Grade for Express" description="Minimum store grade eligible for express delivery">
          <Input
            value={c.min_grade_express ?? DEFAULTS.replenishment.minStoreGradeForExpress}
            onChange={(e) => updateConstant('min_grade_express', e.target.value)}
            className="w-24 py-1.5 text-sm text-center"
          />
        </FieldRow>

        <FieldRow label="Safety Stock Multiplier" description="Factor applied to average demand for safety stock calculation">
          <NumberField value={c.safety_stock_multiplier ?? DEFAULTS.replenishment.safetyStockMultiplier} onChange={(v) => updateConstant('safety_stock_multiplier', v)} suffix="x" step={0.1} min={0.5} max={5} />
        </FieldRow>

        <FieldRow label="Fill Rate Target" description="Target percentage of demand fulfilled from available DC stock">
          <NumberField value={c.fill_rate_target ?? DEFAULTS.replenishment.fillRateTarget} onChange={(v) => updateConstant('fill_rate_target', v)} suffix="%" min={50} max={100} />
        </FieldRow>

        <FieldRow label="Stockout Alert Threshold" description="Days of cover below which stockout alert is triggered for Red List">
          <NumberField value={c.stockout_alert_threshold ?? DEFAULTS.replenishment.stockoutAlertThreshold} onChange={(v) => updateConstant('stockout_alert_threshold', v)} suffix="d" min={1} max={30} />
        </FieldRow>

        <FieldRow label="FVA Sort Order" description="Fair Value Allocation priority for distributing limited DC stock">
          <span className="text-sm text-gray-700 font-mono">ROS DESC, WOC ASC</span>
        </FieldRow>

        <FieldRow label="VMI Vendor List" description="Vendor Managed Inventory partners with direct replenishment">
          <Input
            value={c.vmi_vendors ?? DEFAULTS.replenishment.vmiVendors}
            onChange={(e) => updateConstant('vmi_vendors', e.target.value)}
            className="w-64 py-1.5 text-sm"
          />
        </FieldRow>

        <FieldRow label="VMI Integration" description="Enable Vendor Managed Inventory for listed vendors">
          <button type="button" onClick={() => updateConstant('vmi_enabled', !(c.vmi_enabled ?? DEFAULTS.replenishment.vmiEnabled))} aria-label="Toggle VMI integration">
            <Badge variant={(c.vmi_enabled ?? DEFAULTS.replenishment.vmiEnabled) ? 'success' : 'default'} className="text-xs cursor-pointer">
              {(c.vmi_enabled ?? DEFAULTS.replenishment.vmiEnabled) ? 'Enabled' : 'Disabled'}
            </Badge>
          </button>
        </FieldRow>
      </div>

      {/* SOP-07 NOOS Rules */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">NOOS Replenishment Rules (SOP-07)</h3>
        <p className="text-xs text-gray-500 mb-3">Per SOP-07 Step 7.2: NOOS replenishment is system-driven. No manual approval required within remaining OTB budget. NOOS must never reach zero stock.</p>

        <FieldRow label="NOOS Auto-Approval" description="Automatically approve standard NOOS replenishments within remaining OTB budget (no R&M Planner approval needed)">
          <button type="button" onClick={() => updateConstant('noos_auto_approval', !(c.noos_auto_approval ?? DEFAULTS.replenishment.noosAutoApprovalWithinBudget))} aria-label="Toggle NOOS auto-approval">
            <Badge variant={(c.noos_auto_approval ?? DEFAULTS.replenishment.noosAutoApprovalWithinBudget) ? 'success' : 'default'} className="text-xs cursor-pointer">
              {(c.noos_auto_approval ?? DEFAULTS.replenishment.noosAutoApprovalWithinBudget) ? 'Enabled' : 'Disabled'}
            </Badge>
          </button>
        </FieldRow>

        <FieldRow label="Dispatch SLA (Metro)" description="Maximum hours to dispatch NOOS replenishment for Metro stores (SOP-07)">
          <NumberField value={c.dispatch_sla_metro_hours ?? DEFAULTS.replenishment.dispatchSlaMetroHours} onChange={(v) => updateConstant('dispatch_sla_metro_hours', v)} suffix="h" min={12} max={96} />
        </FieldRow>

        <FieldRow label="Dispatch SLA (Tier 2/3)" description="Maximum hours to dispatch NOOS replenishment for Tier 2/3 stores (SOP-07)">
          <NumberField value={c.dispatch_sla_tier23_hours ?? DEFAULTS.replenishment.dispatchSlaTier23Hours} onChange={(v) => updateConstant('dispatch_sla_tier23_hours', v)} suffix="h" min={24} max={120} />
        </FieldRow>

        <FieldRow label="NOOS Transfer Eligibility" description="Per SOP-07 Step 7.4: inter-store transfers are only for fashion options, not NOOS. NOOS has replenishment depth.">
          <button type="button" onClick={() => updateConstant('noos_transfer_eligible', !(c.noos_transfer_eligible ?? DEFAULTS.replenishment.noosTransferEligible))} aria-label="Toggle NOOS transfer eligibility">
            <Badge variant={(c.noos_transfer_eligible ?? DEFAULTS.replenishment.noosTransferEligible) ? 'warning' : 'success'} className="text-xs cursor-pointer">
              {(c.noos_transfer_eligible ?? DEFAULTS.replenishment.noosTransferEligible) ? 'Eligible (non-standard)' : 'Not Eligible (SOP-07)'}
            </Badge>
          </button>
        </FieldRow>

        <FieldRow label="Zero Stock Escalation" description="NOOS zero stock is a critical failure requiring immediate SCM escalation to R&M Head">
          <Badge variant="error" className="text-xs">Mandatory — Critical Failure</Badge>
        </FieldRow>
      </div>

      {/* Replenishment formula */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">A&amp;R Replenishment Formula</h3>
        <div className="px-3 py-2.5 bg-gray-50 rounded-lg font-mono text-sm text-gray-800">
          replenishment_qty = (ros &times; lead_time_days) &minus; closing_stock_qty
        </div>
        <p className="text-xs text-gray-500 mt-2">ROS is pre-aggregated over a 7-day trailing window using strict greater-than (&gt;) comparison. PO items excluded via filter (po_qty == 0), not subtracted from formula.</p>
      </div>

      {/* Eligibility Thresholds */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-1">Eligibility Thresholds</h3>
        <p className="text-xs text-gray-500 mb-3">Pre-qualification rules that determine which store-article combinations are eligible for replenishment.</p>

        <FieldRow label="Min ROS for Eligibility" description="Minimum rate of sale to qualify for replenishment">
          <NumberField value={c.min_ros_eligibility ?? DEFAULTS.replenishment.minRosForEligibility} onChange={(v) => updateConstant('min_ros_eligibility', v)} suffix="units/d" step={0.05} min={0} max={5} />
        </FieldRow>
        <FieldRow label="Min Display Stock" description="Minimum units currently in store to qualify">
          <NumberField value={c.min_display_stock ?? DEFAULTS.replenishment.minDisplayStock} onChange={(v) => updateConstant('min_display_stock', v)} min={0} max={20} />
        </FieldRow>
        <FieldRow label="Exclude with Active POs" description="Exclude articles with purchase orders already in transit">
          <button type="button" onClick={() => updateConstant('exclude_active_pos', !(c.exclude_active_pos ?? DEFAULTS.replenishment.excludeWithActivePOs))} aria-label="Toggle exclude active POs">
            <Badge variant={(c.exclude_active_pos ?? DEFAULTS.replenishment.excludeWithActivePOs) ? 'success' : 'default'} className="text-xs cursor-pointer">
              {(c.exclude_active_pos ?? DEFAULTS.replenishment.excludeWithActivePOs) ? 'Excluded' : 'Included'}
            </Badge>
          </button>
        </FieldRow>
        <FieldRow label="Max Fill Rate (Brick)" description="Brick-level fill rate must be below this to allow replenishment">
          <NumberField value={c.max_fill_rate_brick ?? DEFAULTS.replenishment.maxFillRateBrick} onChange={(v) => updateConstant('max_fill_rate_brick', v)} suffix="%" min={100} max={200} />
        </FieldRow>
        <FieldRow label="Max Fill Rate (Options)" description="Option-level fill rate must be below this to allow replenishment">
          <NumberField value={c.max_fill_rate_options ?? DEFAULTS.replenishment.maxFillRateOptions} onChange={(v) => updateConstant('max_fill_rate_options', v)} suffix="%" min={100} max={200} />
        </FieldRow>
        <FieldRow label="Min Replenishment Qty" description="Minimum units per replenishment allocation">
          <NumberField value={c.min_replenishment_qty ?? DEFAULTS.replenishment.minReplenishmentQty} onChange={(v) => updateConstant('min_replenishment_qty', v)} min={1} max={20} />
        </FieldRow>
        <FieldRow label="Min Store Replenishment" description="Minimum items replenished per store per run">
          <NumberField value={c.min_store_replenishment_qty ?? DEFAULTS.replenishment.minStoreReplenishmentQty} onChange={(v) => updateConstant('min_store_replenishment_qty', v)} min={1} max={20} />
        </FieldRow>
      </div>

      {/* Filter Rules - API-backed */}
      <CollapsibleSection
        title="Filter Rules"
        badge={`${config.filter_rules.filter((r) => r.is_active).length} active`}
        badgeVariant="success"
        defaultOpen={true}
      >
        <FilterRulesEditor
          rules={config.filter_rules}
          onChange={(rules) => setConfig({ ...config, filter_rules: rules })}
        />
      </CollapsibleSection>

      {/* Constants & Scope - API-backed */}
      <CollapsibleSection title="Constants & Scope" defaultOpen={true}>
        <ConstantsEditor
          constants={config.constants}
          onChange={(constants) => setConfig({ ...config, constants })}
        />
      </CollapsibleSection>

      <SectionFooter onSave={handleSave} onReset={handleReset} saving={saving} />
    </div>
  );
}

// ─── Tab 3: Pullback Parameters ─────────────────────────────────────

function PullbackParametersTab() {
  // Template selection
  const [selectedTemplate, setSelectedTemplate] = useState<PullbackTemplate>('bottom_seller');

  // All state is API-backed via the store
  const { config, loading, saving, error: apiError, fetch: fetchConfig, setConfig, save, resetToDefaults } = useANRAdminStore();
  const { success: toastSuccess, error: toastError } = useToast();

  // Fetch config when template changes
  // eslint-disable-next-line react-hooks/exhaustive-deps -- stable store actions
  useEffect(() => { fetchConfig(selectedTemplate); }, [selectedTemplate]);

  const updateConstant = useCallback(<K extends keyof import('../data/anrConfigTypes').ANRConstants>(
    key: K,
    value: import('../data/anrConfigTypes').ANRConstants[K],
  ) => {
    if (config) setConfig({ ...config, constants: { ...config.constants, [key]: value } });
  }, [config, setConfig]);

  const handleSave = useCallback(async () => {
    try {
      await save(selectedTemplate);
      toastSuccess('Pullback configuration saved');
    } catch {
      toastError('Failed to save pullback configuration');
    }
  }, [selectedTemplate, save, toastSuccess, toastError]);

  const handleReset = useCallback(async () => {
    try {
      await resetToDefaults(selectedTemplate);
      toastSuccess('Configuration reset to defaults');
    } catch {
      toastError('Failed to reset configuration');
    }
  }, [selectedTemplate, resetToDefaults, toastSuccess, toastError]);

  if (loading) {
    return (
      <div className="space-y-4">
        <SimplePullbackTemplateSelector
          selectedTemplate={selectedTemplate}
          onTemplateChange={setSelectedTemplate}
        />
        <div className="flex items-center justify-center gap-2 py-12 px-4">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          <span className="text-sm text-gray-500">Loading configuration...</span>
        </div>
      </div>
    );
  }

  if (apiError) {
    return (
      <div className="space-y-4">
        <SimplePullbackTemplateSelector
          selectedTemplate={selectedTemplate}
          onTemplateChange={setSelectedTemplate}
        />
        <div className="flex items-start gap-2 px-3 py-2.5 bg-red-50 rounded-lg text-sm text-red-700">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{apiError}</span>
        </div>
      </div>
    );
  }

  if (!config) return null;

  const c = config.constants;

  return (
    <div className="space-y-4">
      {/* Template Selector */}
      <SimplePullbackTemplateSelector
        selectedTemplate={selectedTemplate}
        onTemplateChange={setSelectedTemplate}
      />

      {/* Shared Parameters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Shared Parameters</h3>
        <FieldRow label="Trailing Window" description="Trailing window for ROS calculation across all pullback types">
          <NumberField value={c.trailing_window ?? DEFAULTS.pullback.shared.trailingWindowDays} onChange={(v) => updateConstant('trailing_window', v)} suffix="d" min={1} max={90} />
        </FieldRow>
        <FieldRow label="Pullback Cooldown" description="Days between consecutive pullbacks for the same store">
          <NumberField value={c.pullback_cooldown ?? DEFAULTS.pullback.shared.pullbackCooldownDays} onChange={(v) => updateConstant('pullback_cooldown', v)} suffix="d" min={1} max={60} />
        </FieldRow>
      </div>

      {/* Bottom Seller */}
      {selectedTemplate === 'bottom_seller' && (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        {/* eslint-disable-next-line design-system/prefer-section-header -- inline toggle badge requires custom layout */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Bottom Seller Pullback</h3>
            <p className="text-xs text-gray-500 mt-0.5">Pulls back lowest-performing options by ROS. Two-phase: Phase 1 removes complete options (ascending ROS), Phase 2 pulls partial quantities.</p>
          </div>
          <button type="button" onClick={() => updateConstant('bs_enabled', !(c.bs_enabled ?? DEFAULTS.pullback.bottomSeller.enabled))} aria-label="Toggle bottom seller">
            <Badge variant={(c.bs_enabled ?? DEFAULTS.pullback.bottomSeller.enabled) ? 'success' : 'default'} className="text-xs cursor-pointer">
              {(c.bs_enabled ?? DEFAULTS.pullback.bottomSeller.enabled) ? 'Active' : 'Inactive'}
            </Badge>
          </button>
        </div>
        <FieldRow label="Min Stock Age" description="Stock must be older than this many days in store">
          <NumberField value={c.bs_min_stock_age ?? DEFAULTS.pullback.bottomSeller.minStockAgeDays} onChange={(v) => updateConstant('bs_min_stock_age', v)} suffix="d" min={1} max={180} />
        </FieldRow>
        <FieldRow label="Planogram Fill Rate Floor" description="Planogram fill rate must be at or above this % to trigger pullback">
          <NumberField value={c.bs_fill_rate_floor ?? DEFAULTS.pullback.bottomSeller.fillRateFloor} onChange={(v) => updateConstant('bs_fill_rate_floor', v)} suffix="%" min={50} max={100} />
        </FieldRow>
        <FieldRow label="Target Option Gap" description="Target number of options to remove per store">
          <NumberField value={c.bs_target_option_gap ?? DEFAULTS.pullback.bottomSeller.targetOptionGap} onChange={(v) => updateConstant('bs_target_option_gap', v)} min={1} max={20} />
        </FieldRow>
        <FieldRow label="Target Brick Gap" description="Target unit gap per brick after pullback">
          <NumberField value={c.bs_target_brick_gap ?? DEFAULTS.pullback.bottomSeller.targetBrickGap} onChange={(v) => updateConstant('bs_target_brick_gap', v)} suffix="units" min={1} max={100} />
        </FieldRow>
        <FieldRow label="Exclude Core/NOOS Grade" description="Exclude core/NOOS fashion grade from pullback eligibility">
          <button type="button" onClick={() => updateConstant('bs_exclude_core', !(c.bs_exclude_core ?? DEFAULTS.pullback.bottomSeller.excludeCoreGrade))} aria-label="Toggle exclude core">
            <Badge variant={(c.bs_exclude_core ?? DEFAULTS.pullback.bottomSeller.excludeCoreGrade) ? 'success' : 'default'} className="text-xs cursor-pointer">
              {(c.bs_exclude_core ?? DEFAULTS.pullback.bottomSeller.excludeCoreGrade) ? 'Excluded' : 'Included'}
            </Badge>
          </button>
        </FieldRow>
        <FieldRow label="ROS Comparison" description="Store ROS must be at or below network average">
          <Badge variant="info" className="text-xs">ROS &le; Network Average</Badge>
        </FieldRow>
        <FieldRow label="STR Comparison" description="STR must be at or below average STR">
          <Badge variant="info" className="text-xs">STR &le; Average</Badge>
        </FieldRow>
      </div>
      )}

      {/* Broken Set */}
      {selectedTemplate === 'broken_set' && (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        {/* eslint-disable-next-line design-system/prefer-section-header -- inline toggle badge requires custom layout */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Broken Set Pullback</h3>
            <p className="text-xs text-gray-500 mt-0.5">Pulls back options with incomplete size profiles where replenishment is unavailable.</p>
          </div>
          <button type="button" onClick={() => updateConstant('br_enabled', !(c.br_enabled ?? DEFAULTS.pullback.brokenSet.enabled))} aria-label="Toggle broken set">
            <Badge variant={(c.br_enabled ?? DEFAULTS.pullback.brokenSet.enabled) ? 'success' : 'default'} className="text-xs cursor-pointer">
              {(c.br_enabled ?? DEFAULTS.pullback.brokenSet.enabled) ? 'Active' : 'Inactive'}
            </Badge>
          </button>
        </div>
        <FieldRow label="Min BSI Threshold" description="Broken size index above which pullback is triggered">
          <NumberField value={c.br_min_bsi ?? DEFAULTS.pullback.brokenSet.minBsiThreshold} onChange={(v) => updateConstant('br_min_bsi', v)} suffix="" step={0.05} min={0} max={1} />
        </FieldRow>
        <FieldRow label="Planogram Fill Rate Floor" description="Fill rate must be at or above this % to trigger pullback">
          <NumberField value={c.br_fill_rate_floor ?? DEFAULTS.pullback.brokenSet.fillRateFloor} onChange={(v) => updateConstant('br_fill_rate_floor', v)} suffix="%" min={50} max={100} />
        </FieldRow>
        <FieldRow label="Exclude Core/NOOS Grade" description="Exclude core/NOOS items from broken set pullback">
          <button type="button" onClick={() => updateConstant('br_exclude_core', !(c.br_exclude_core ?? DEFAULTS.pullback.brokenSet.excludeCoreGrade))} aria-label="Toggle exclude core">
            <Badge variant={(c.br_exclude_core ?? DEFAULTS.pullback.brokenSet.excludeCoreGrade) ? 'success' : 'default'} className="text-xs cursor-pointer">
              {(c.br_exclude_core ?? DEFAULTS.pullback.brokenSet.excludeCoreGrade) ? 'Excluded' : 'Included'}
            </Badge>
          </button>
        </FieldRow>
        <FieldRow label="Require No Inbound POs" description="Only eligible if no inbound POs that could complete the set">
          <button type="button" onClick={() => updateConstant('br_require_no_pos', !(c.br_require_no_pos ?? DEFAULTS.pullback.brokenSet.requireNoInboundPOs))} aria-label="Toggle require no POs">
            <Badge variant={(c.br_require_no_pos ?? DEFAULTS.pullback.brokenSet.requireNoInboundPOs) ? 'success' : 'default'} className="text-xs cursor-pointer">
              {(c.br_require_no_pos ?? DEFAULTS.pullback.brokenSet.requireNoInboundPOs) ? 'Required' : 'Not Required'}
            </Badge>
          </button>
        </FieldRow>
        <FieldRow label="STR Comparison" description="STR must be at or below average">
          <Badge variant="info" className="text-xs">STR &le; Average</Badge>
        </FieldRow>
      </div>
      )}

      {/* Lifecycle Crossed */}
      {selectedTemplate === 'lifecycle_crossed' && (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        {/* eslint-disable-next-line design-system/prefer-section-header -- inline toggle badge requires custom layout */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Lifecycle Crossed Pullback</h3>
            <p className="text-xs text-gray-500 mt-0.5">Pulls back items that have exceeded their lifecycle cover days threshold. Threshold values are configured in the Lifecycle &amp; Rotation tab.</p>
          </div>
          <button type="button" onClick={() => updateConstant('lc_enabled', !(c.lc_enabled ?? DEFAULTS.pullback.lifecycleCrossed.enabled))} aria-label="Toggle lifecycle crossed">
            <Badge variant={(c.lc_enabled ?? DEFAULTS.pullback.lifecycleCrossed.enabled) ? 'success' : 'default'} className="text-xs cursor-pointer">
              {(c.lc_enabled ?? DEFAULTS.pullback.lifecycleCrossed.enabled) ? 'Active' : 'Inactive'}
            </Badge>
          </button>
        </div>
        <FieldRow label="Trigger Rule" description="Stock age exceeds the configured cover days for its fashion grade">
          <Badge variant="info" className="text-xs">stock_age &gt; cover_days</Badge>
        </FieldRow>
        <div className="flex items-start gap-2 px-3 py-2 bg-gray-50 rounded-lg text-xs text-gray-600">
          <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          <span>Cover day thresholds per fashion grade are configured in the Lifecycle &amp; Rotation tab.</span>
        </div>
      </div>
      )}

      {/* Planogram Overfill */}
      {selectedTemplate === 'planogram_overfill' && (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        {/* eslint-disable-next-line design-system/prefer-section-header -- inline toggle badge requires custom layout */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Planogram Overfill Pullback</h3>
            <p className="text-xs text-gray-500 mt-0.5">Pulls back excess stock where inventory exceeds planogram targets.</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => updateConstant('po_dry_run', !(c.po_dry_run ?? DEFAULTS.pullback.planogramOverfill.dryRun))} aria-label="Toggle dry run">
              <Badge variant={(c.po_dry_run ?? DEFAULTS.pullback.planogramOverfill.dryRun) ? 'warning' : 'default'} className="text-xs cursor-pointer">
                {(c.po_dry_run ?? DEFAULTS.pullback.planogramOverfill.dryRun) ? 'Dry Run' : 'Live'}
              </Badge>
            </button>
            <button type="button" onClick={() => updateConstant('po_enabled', !(c.po_enabled ?? DEFAULTS.pullback.planogramOverfill.enabled))} aria-label="Toggle planogram overfill">
              <Badge variant={(c.po_enabled ?? DEFAULTS.pullback.planogramOverfill.enabled) ? 'success' : 'default'} className="text-xs cursor-pointer">
                {(c.po_enabled ?? DEFAULTS.pullback.planogramOverfill.enabled) ? 'Active' : 'Inactive'}
              </Badge>
            </button>
          </div>
        </div>
        <FieldRow label="Overfill Threshold" description="Fill rate at or above which overfill pullback is triggered">
          <NumberField value={c.po_overfill_threshold ?? DEFAULTS.pullback.planogramOverfill.overfillThresholdPct} onChange={(v) => updateConstant('po_overfill_threshold', v)} suffix="%" min={100} max={200} />
        </FieldRow>
      </div>
      )}

      {/* Filter Rules - API-backed */}
      <CollapsibleSection
        title="Filter Rules"
        badge={`${config.filter_rules.filter((r) => r.is_active).length} active`}
        badgeVariant="success"
        defaultOpen={false}
      >
        <FilterRulesEditor
          rules={config.filter_rules}
          onChange={(rules) => setConfig({ ...config, filter_rules: rules })}
        />
      </CollapsibleSection>

      {/* Constants & Scope - API-backed */}
      <CollapsibleSection title="Constants & Scope" defaultOpen={false}>
        <ConstantsEditor
          constants={config.constants}
          onChange={(constants) => setConfig({ ...config, constants })}
        />
      </CollapsibleSection>

      <div className="flex items-start gap-2 px-3 py-2.5 bg-blue-50 rounded-lg text-sm text-blue-700">
        <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <span>Pullback pipelines run daily at 6:00 AM in sequence: Bottom Seller &rarr; Broken Set &rarr; Lifecycle Crossed &rarr; Planogram Overfill. Each type uses FVA allocation to distribute pullback quantities fairly across eligible stores.</span>
      </div>

      <SectionFooter onSave={handleSave} onReset={handleReset} saving={saving} />
    </div>
  );
}

// ─── Tab 4: Redistribution Parameters ───────────────────────────────

function RedistributionParametersTab() {
  // All state is API-backed via the store
  const { config, loading, saving, error: apiError, fetch: fetchConfig, setConfig, save, resetToDefaults } = useANRAdminStore();
  const { success: toastSuccess, error: toastError } = useToast();

  // eslint-disable-next-line react-hooks/exhaustive-deps -- fetch on mount only
  useEffect(() => { fetchConfig('redistribution'); }, []);

  const updateConstant = useCallback(<K extends keyof import('../data/anrConfigTypes').ANRConstants>(
    key: K,
    value: import('../data/anrConfigTypes').ANRConstants[K],
  ) => {
    if (config) setConfig({ ...config, constants: { ...config.constants, [key]: value } });
  }, [config, setConfig]);

  const handleSave = useCallback(async () => {
    try {
      await save('redistribution');
      toastSuccess('Redistribution configuration saved');
    } catch {
      toastError('Failed to save redistribution configuration');
    }
  }, [save, toastSuccess, toastError]);

  const handleReset = useCallback(async () => {
    try {
      await resetToDefaults('redistribution');
      toastSuccess('Configuration reset to defaults');
    } catch {
      toastError('Failed to reset configuration');
    }
  }, [resetToDefaults, toastSuccess, toastError]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 px-4">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        <span className="text-sm text-gray-500">Loading configuration...</span>
      </div>
    );
  }

  if (apiError) {
    return (
      <div className="flex items-start gap-2 px-3 py-2.5 bg-red-50 rounded-lg text-sm text-red-700">
        <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <span>{apiError}</span>
      </div>
    );
  }

  if (!config) return null;

  const c = config.constants;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Redistribution Parameters</h3>

        <FieldRow label="Minimum WOC for Donor" description="Minimum weeks of cover for donor store eligibility">
          <NumberField value={c.min_woc_donor ?? DEFAULTS.redistribution.minWocDonor} onChange={(v) => updateConstant('min_woc_donor', v)} suffix="wk" min={1} max={52} />
        </FieldRow>

        <FieldRow label="Maximum WOC for Recipient" description="Maximum weeks of cover for recipient store eligibility">
          <NumberField value={c.max_woc_recipient ?? DEFAULTS.redistribution.maxWocRecipient} onChange={(v) => updateConstant('max_woc_recipient', v)} suffix="wk" min={1} max={52} />
        </FieldRow>

        <FieldRow label="Minimum ROS for Recipient" description="Minimum ROS for recipient store eligibility">
          <NumberField value={c.min_ros_recipient ?? DEFAULTS.redistribution.minRosRecipient} onChange={(v) => updateConstant('min_ros_recipient', v)} suffix="units/day" step={0.1} min={0} max={10} />
        </FieldRow>

        <FieldRow label="Donor ROS Below Network Avg" description="Donor store ROS must be below network-wide average for the same article">
          <button type="button" onClick={() => updateConstant('donor_ros_below_avg', !(c.donor_ros_below_avg ?? DEFAULTS.redistribution.donorRosBelowNetworkAvg))} aria-label="Toggle donor ROS rule">
            <Badge variant={(c.donor_ros_below_avg ?? DEFAULTS.redistribution.donorRosBelowNetworkAvg) ? 'success' : 'default'} className="text-xs cursor-pointer">
              {(c.donor_ros_below_avg ?? DEFAULTS.redistribution.donorRosBelowNetworkAvg) ? 'Required' : 'Not Required'}
            </Badge>
          </button>
        </FieldRow>

        <FieldRow label="Delivery Preference" description="Preferred transfer route for redistribution">
          <span className="text-sm text-gray-700 font-mono">IST preferred, DC route as fallback</span>
        </FieldRow>

        <FieldRow label="Post-Move Tracking" description="Days to track post-move performance">
          <NumberField value={c.post_move_tracking ?? DEFAULTS.redistribution.postMoveTrackingDays} onChange={(v) => updateConstant('post_move_tracking', v)} suffix="d" min={1} max={60} />
        </FieldRow>
      </div>

      {/* Filter Rules - API-backed */}
      <CollapsibleSection
        title="Filter Rules"
        badge={`${config.filter_rules.filter((r) => r.is_active).length} active`}
        badgeVariant="success"
        defaultOpen={true}
      >
        <FilterRulesEditor
          rules={config.filter_rules}
          onChange={(rules) => setConfig({ ...config, filter_rules: rules })}
        />
      </CollapsibleSection>

      {/* Constants & Scope - API-backed */}
      <CollapsibleSection title="Constants & Scope" defaultOpen={true}>
        <ConstantsEditor
          constants={config.constants}
          onChange={(constants) => setConfig({ ...config, constants })}
        />
      </CollapsibleSection>

      {/* Visual timeline */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Phase Timeline</h3>
        <div className="flex items-center gap-1 text-xs">
          <Badge variant="success" className="text-xs">Fresh</Badge>
          <span className="text-gray-400">0–30d</span>
          <span className="text-gray-400 mx-1">→</span>
          <Badge className="bg-blue-100 text-blue-700 text-xs">Maturing</Badge>
          <span className="text-gray-400">30–60d</span>
          <span className="text-gray-400 mx-1">→</span>
          <Badge variant="warning" className="text-xs">Ageing</Badge>
          <span className="text-gray-400">60–90d</span>
          <span className="text-gray-400 mx-1">→</span>
          <Badge variant="error" className="text-xs">Deep Discount</Badge>
          <span className="text-gray-400">90–120d</span>
          <span className="text-gray-400 mx-1">→</span>
          <Badge variant="error" className="text-xs">Liquidation</Badge>
          <span className="text-gray-400">120d+</span>
        </div>
      </div>

      <SectionFooter onSave={handleSave} onReset={handleReset} saving={saving} />
    </div>
  );
}

// ─── Tab 5: Lifecycle & Rotation ────────────────────────────────────

function LifecyclePhasesTab() {
  const { config, loading, saving, error: apiError, fetch: fetchConfig, setConfig, save, resetToDefaults } = useANRAdminStore();
  const { success: toastSuccess, error: toastError } = useToast();

  // eslint-disable-next-line react-hooks/exhaustive-deps -- fetch on mount only
  useEffect(() => { fetchConfig('lifecycle_rotation'); }, []);

  const updateConstant = useCallback(<K extends keyof import('../data/anrConfigTypes').ANRConstants>(
    key: K,
    value: import('../data/anrConfigTypes').ANRConstants[K],
  ) => {
    if (config) setConfig({ ...config, constants: { ...config.constants, [key]: value } });
  }, [config, setConfig]);

  const handleSave = useCallback(async () => {
    try {
      await save('lifecycle_rotation');
      toastSuccess('Lifecycle & Rotation configuration saved');
    } catch {
      toastError('Failed to save configuration');
    }
  }, [save, toastSuccess, toastError]);

  const handleReset = useCallback(async () => {
    try {
      await resetToDefaults('lifecycle_rotation');
      toastSuccess('Configuration reset to defaults');
    } catch {
      toastError('Failed to reset configuration');
    }
  }, [resetToDefaults, toastSuccess, toastError]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 px-4">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        <span className="text-sm text-gray-500">Loading configuration...</span>
      </div>
    );
  }

  if (apiError) {
    return (
      <div className="flex items-start gap-2 px-3 py-2.5 bg-red-50 rounded-lg text-sm text-red-700">
        <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <span>{apiError}</span>
      </div>
    );
  }

  if (!config) return null;

  const c = config.constants;
  const a0ToA1 = c.lr_a0_a1_days ?? DEFAULTS.lifecycle.a0ToA1Days;
  const a1ToA2 = c.lr_a1_a2_days ?? DEFAULTS.lifecycle.a1ToA2Days;
  const a2ToA3 = c.lr_a2_a3_days ?? DEFAULTS.lifecycle.a2ToA3Days;
  const strGateA1A2 = c.lr_str_gate_a1_a2 ?? DEFAULTS.lifecycle.strGateA1ToA2;
  const strGateA2A3 = c.lr_str_gate_a2_a3 ?? DEFAULTS.lifecycle.strGateA2ToA3;
  const rotationNetworkAge = c.lr_network_age_threshold ?? DEFAULTS.lifecycle.rotationNetworkAgeThreshold;
  const rotationStoreAge = c.lr_store_age_threshold ?? DEFAULTS.lifecycle.rotationStoreAgeThreshold;
  const seasonalExemptions = c.lr_seasonal_exemptions ?? DEFAULTS.lifecycle.enableSeasonalExemptions;

  const a1End = a0ToA1;
  const a2End = a0ToA1 + a1ToA2;
  const a3Start = a0ToA1 + a1ToA2 + a2ToA3;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Phase Transition Thresholds (45+45+30 Model)</h3>

        <FieldRow label="A0 &rarr; A1 Transition" description="Full-price launch window. Day 0 = first receipt at any store (network age).">
          <NumberField value={a0ToA1} onChange={(v) => updateConstant('lr_a0_a1_days', v)} suffix="d" min={1} max={180} />
        </FieldRow>

        <FieldRow label="A1 &rarr; A2 Transition" description="First markdown tier. Triggered by age or STR gate failure.">
          <NumberField value={a1ToA2} onChange={(v) => updateConstant('lr_a1_a2_days', v)} suffix="d" min={1} max={180} />
        </FieldRow>

        <FieldRow label="A2 &rarr; A3 / Liquidation" description="Deep markdown / outlet routing. Exit velocity accelerated.">
          <NumberField value={a2ToA3} onChange={(v) => updateConstant('lr_a2_a3_days', v)} suffix="d" min={1} max={180} />
        </FieldRow>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">STR Gate Thresholds</h3>
        <p className="text-xs text-gray-500 mb-3">Sell-through rate gates that can accelerate phase transitions. If STR falls below the gate threshold, the item transitions early regardless of age.</p>

        <FieldRow label="STR Gate: A1 &rarr; A2" description="Sell-through rate below which A1 items transition early to A2">
          <NumberField value={strGateA1A2} onChange={(v) => updateConstant('lr_str_gate_a1_a2', v)} suffix="%" min={0} max={100} />
        </FieldRow>

        <FieldRow label="STR Gate: A2 &rarr; A3" description="Sell-through rate below which A2 items transition early to A3">
          <NumberField value={strGateA2A3} onChange={(v) => updateConstant('lr_str_gate_a2_a3', v)} suffix="%" min={0} max={100} />
        </FieldRow>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Anti-Rotation Controls</h3>
        <p className="text-xs text-gray-500 mb-3">Detects and blocks inventory rotation — the practice of transferring items between stores to reset store age and delay markdown. Uses dual-clock ageing.</p>

        <FieldRow label="Network Age Threshold" description="Network age above which rotation detection activates">
          <NumberField value={rotationNetworkAge} onChange={(v) => updateConstant('lr_network_age_threshold', v)} suffix="d" min={1} max={365} />
        </FieldRow>

        <FieldRow label="Store Age Threshold" description="Store age below which rotation is flagged (combined with network age)">
          <NumberField value={rotationStoreAge} onChange={(v) => updateConstant('lr_store_age_threshold', v)} suffix="d" min={1} max={180} />
        </FieldRow>

        <FieldRow label="Max Transfers Before Block" description="Maximum inter-store transfers before item is auto-blocked from further movement">
          <NumberField value={c.lr_max_transfers_before_block ?? DEFAULTS.lifecycle.maxTransfersBeforeBlock} onChange={(v) => updateConstant('lr_max_transfers_before_block', v)} min={1} max={10} />
        </FieldRow>

        <FieldRow label="Rotation Detection Rule" description="Combination rule that triggers rotation alert">
          <span className="text-sm text-gray-700 font-mono">network_age &gt; {rotationNetworkAge}d AND store_age &lt; {rotationStoreAge}d</span>
        </FieldRow>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Seasonal Overrides</h3>
        <FieldRow label="Seasonal Exemptions" description="Exempt seasonal/festive merchandise from standard lifecycle phase durations and rotation rules">
          <button type="button" onClick={() => updateConstant('lr_seasonal_exemptions', !seasonalExemptions)} aria-label="Toggle seasonal exemptions">
            <Badge variant={seasonalExemptions ? 'success' : 'default'} className="text-xs cursor-pointer">
              {seasonalExemptions ? 'Enabled' : 'Disabled'}
            </Badge>
          </button>
        </FieldRow>
      </div>

      {/* Lifecycle timeline */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Lifecycle Timeline</h3>
        <div className="flex items-center gap-1 text-xs flex-wrap">
          <Badge className="bg-green-100 text-green-700 text-xs">A0 Full Price</Badge>
          <span className="text-gray-500">0&ndash;{a1End}d</span>
          <span className="text-gray-400 mx-1">&rarr;</span>
          <Badge className="bg-blue-100 text-blue-700 text-xs">A1 Markdown I</Badge>
          <span className="text-gray-500">{a1End}&ndash;{a2End}d</span>
          <span className="text-gray-500 text-[10px] mx-0.5">(STR &lt; {strGateA1A2}%)</span>
          <span className="text-gray-400 mx-1">&rarr;</span>
          <Badge className="bg-amber-100 text-amber-700 text-xs">A2 Markdown II</Badge>
          <span className="text-gray-500">{a2End}&ndash;{a3Start}d</span>
          <span className="text-gray-500 text-[10px] mx-0.5">(STR &lt; {strGateA2A3}%)</span>
          <span className="text-gray-400 mx-1">&rarr;</span>
          <Badge variant="error" className="text-xs">A3 / Liquidation</Badge>
          <span className="text-gray-500">{a3Start}d+</span>
        </div>
      </div>

      <div className="flex items-start gap-2 px-3 py-2.5 bg-blue-50 rounded-lg text-sm text-blue-700">
        <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <span>Dual-clock ageing: Store Age resets on store receipt (not on transfer), Network Age starts at first receipt anywhere and never resets. Both clocks are used for lifecycle and rotation decisions.</span>
      </div>

      <SectionFooter onSave={handleSave} onReset={handleReset} saving={saving} />
    </div>
  );
}

// ─── Tab 6: Liquidation Channels ────────────────────────────────────

function LiquidationChannelsTab() {
  const { config, loading, saving, error: apiError, fetch: fetchConfig, setConfig, save, resetToDefaults } = useANRAdminStore();
  const { success: toastSuccess, error: toastError } = useToast();

  // eslint-disable-next-line react-hooks/exhaustive-deps -- fetch on mount only
  useEffect(() => { fetchConfig('liquidation_channels'); }, []);

  const updateConstant = useCallback(<K extends keyof import('../data/anrConfigTypes').ANRConstants>(
    key: K,
    value: import('../data/anrConfigTypes').ANRConstants[K],
  ) => {
    if (config) setConfig({ ...config, constants: { ...config.constants, [key]: value } });
  }, [config, setConfig]);

  const handleSave = useCallback(async () => {
    try {
      await save('liquidation_channels');
      toastSuccess('Liquidation channels configuration saved');
    } catch {
      toastError('Failed to save configuration');
    }
  }, [save, toastSuccess, toastError]);

  const handleReset = useCallback(async () => {
    try {
      await resetToDefaults('liquidation_channels');
      toastSuccess('Configuration reset to defaults');
    } catch {
      toastError('Failed to reset configuration');
    }
  }, [resetToDefaults, toastSuccess, toastError]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 px-4">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        <span className="text-sm text-gray-500">Loading configuration...</span>
      </div>
    );
  }

  if (apiError) {
    return (
      <div className="flex items-start gap-2 px-3 py-2.5 bg-red-50 rounded-lg text-sm text-red-700">
        <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <span>{apiError}</span>
      </div>
    );
  }

  if (!config) return null;

  const c = config.constants;

  // Channel metadata (static — names, approval, triggers are not editable)
  const channelMeta = [
    { key: 1, name: 'In-Store Clearance Counter', approvalLevel: 'R&M Head', trigger: 'Day 45 Stage 3 (35-40% markdown per SOP-09)' },
    { key: 2, name: 'Ajio Clearance Event', approvalLevel: 'Auto', trigger: 'In-store clearance STR <70% after 4 weeks per SOP-09' },
    { key: 3, name: 'Jio Outlet / Value Retail', approvalLevel: 'Auto', trigger: 'Post-Ajio clearance residual (40-50% markdown)' },
    { key: 4, name: 'Employee Sale (Quarterly)', approvalLevel: 'R&M Head', trigger: 'Quarterly employee purchase event (40-50% markdown)' },
    { key: 5, name: 'NGO / Community Donation', approvalLevel: 'R&M Head + Finance', trigger: 'Unsold after employee sale — at cost for CSR' },
    { key: 6, name: 'Textile Recycling', approvalLevel: 'SCM Head', trigger: 'Final disposal — no landfill/incineration per SOP-09' },
  ] as const;

  const defaultPriorities = [1, 2, 3, 4, 5, 6];
  const defaultRecoveries = [60, 40, 50, 50, 0, 0];

  return (
    <div className="space-y-4">
      {/* SOP-09 Clearance Rules */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Clearance & Disposal Rules (SOP-09)</h3>
        <p className="text-xs text-gray-500 mb-3">Per SOP-09: clearance items are repriced at 35-40% below original MRP. 4-week maximum in-store clearance period. Items below sell-through threshold transfer to Ajio.</p>

        <FieldRow label="Stage 3 Markdown Range" description="Markdown percentage below original MRP for Stage 3 clearance counter">
          <span className="text-sm font-medium text-gray-900">35&ndash;40%</span>
        </FieldRow>

        <FieldRow label="Max In-Store Clearance Period" description="Maximum weeks items remain on clearance counter before transfer to Ajio">
          <NumberField value={c.lc_max_clearance_weeks ?? DEFAULTS.clearance.maxInStoreClearanceWeeks} onChange={(v) => updateConstant('lc_max_clearance_weeks', v)} suffix="wk" min={1} max={12} />
        </FieldRow>

        <FieldRow label="Clearance Sell-Through Threshold" description="In-store clearance sell-through below which items transfer to Ajio clearance event">
          <NumberField value={c.lc_clearance_str_threshold ?? DEFAULTS.clearance.clearanceSellThroughThresholdPct} onChange={(v) => updateConstant('lc_clearance_str_threshold', v)} suffix="%" min={30} max={100} />
        </FieldRow>

        <FieldRow label="Ajio Clearance Listing Period" description="Maximum weeks items are listed on Ajio clearance sale event">
          <NumberField value={c.lc_ajio_listing_weeks ?? DEFAULTS.clearance.ajioListingWeeks} onChange={(v) => updateConstant('lc_ajio_listing_weeks', v)} suffix="wk" min={1} max={8} />
        </FieldRow>

        <FieldRow label="Residual Disposal Target" description="Target maximum residual disposal as % of original units for any option season">
          <NumberField value={c.lc_residual_disposal_target ?? DEFAULTS.clearance.residualDisposalTargetPct} onChange={(v) => updateConstant('lc_residual_disposal_target', v)} suffix="%" min={1} max={25} />
        </FieldRow>

        <FieldRow label="Disposal Restrictions" description="Per SOP-09 Step 9.3: no garment destruction (landfill or incineration). Recycling certificate required per batch.">
          <div className="flex items-center gap-2">
            <Badge variant="error" className="text-xs">No Landfill</Badge>
            <Badge variant="info" className="text-xs">Recycling Cert Required</Badge>
          </div>
        </FieldRow>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Disposal Channel Hierarchy (SOP-09)</h3>
        <DataTable>
          <DataTableHeader>
            <DataTableHead>Channel</DataTableHead>
            <DataTableHead>Priority</DataTableHead>
            <DataTableHead>Min Recovery %</DataTableHead>
            <DataTableHead>Approval</DataTableHead>
            <DataTableHead>A&R Trigger</DataTableHead>
          </DataTableHeader>
          <DataTableBody>
            {channelMeta.map((ch, idx) => {
              const priorityKey = `lc_ch${ch.key}_priority` as keyof import('../data/anrConfigTypes').ANRConstants;
              const recoveryKey = `lc_ch${ch.key}_min_recovery` as keyof import('../data/anrConfigTypes').ANRConstants;
              return (
                <DataTableRow key={ch.key}>
                  <DataTableCell className="font-medium text-gray-900">{ch.name}</DataTableCell>
                  <DataTableCell>
                    <Input
                      type="number"
                      value={(c[priorityKey] as number) ?? defaultPriorities[idx]}
                      onChange={(e) => updateConstant(priorityKey, Number(e.target.value))}
                      min={1}
                      max={10}
                      className="w-16 text-right py-1 text-sm"
                    />
                  </DataTableCell>
                  <DataTableCell>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        value={(c[recoveryKey] as number) ?? defaultRecoveries[idx]}
                        onChange={(e) => updateConstant(recoveryKey, Number(e.target.value))}
                        min={0}
                        max={100}
                        className="w-16 text-right py-1 text-sm"
                      />
                      <span className="text-xs text-gray-500">%</span>
                    </div>
                  </DataTableCell>
                  <DataTableCell>
                    <Badge variant={ch.approvalLevel === 'Auto' ? 'success' : 'warning'} className="text-[10px]">
                      {ch.approvalLevel}
                    </Badge>
                  </DataTableCell>
                  <DataTableCell className="text-xs text-gray-500 max-w-48">{ch.trigger}</DataTableCell>
                </DataTableRow>
              );
            })}
          </DataTableBody>

        </DataTable>
      </div>

      <div className="flex items-start gap-2 px-3 py-2.5 bg-blue-50 rounded-lg text-sm text-blue-700">
        <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <span>Per SOP-09: disposal hierarchy is Outlet &rarr; Employee Sale (quarterly) &rarr; NGO Donation &rarr; Textile Recycling. No landfill or incineration. Quarterly Clearance Recovery Report required for R&amp;M Head and CEO F&amp;L. Options with &gt;15% residual disposal trigger a buying post-mortem.</span>
      </div>

      <SectionFooter onSave={handleSave} onReset={handleReset} saving={saving} />
    </div>
  );
}

// ─── Tab 7: CORE Reordering Parameters ──────────────────────────────

interface ConfigFieldProps {
  label: string;
  value: string;
  description: string;
}

function ConfigField({ label, value, description }: ConfigFieldProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-gray-900">{value}</p>
      <p className="mt-0.5 text-xs text-gray-500">{description}</p>
    </div>
  );
}

function CoreReorderingTab() {
  const { config, loading, error: apiError, fetch: fetchConfig } = useANRAdminStore();

  // eslint-disable-next-line react-hooks/exhaustive-deps -- fetch on mount only
  useEffect(() => { fetchConfig('core_reordering'); }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 px-4">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        <span className="text-sm text-gray-500">Loading configuration...</span>
      </div>
    );
  }

  if (apiError) {
    return (
      <div className="flex items-start gap-2 px-3 py-2.5 bg-red-50 rounded-lg text-sm text-red-700">
        <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <span>{apiError}</span>
      </div>
    );
  }

  if (!config) return null;

  const c = config.constants;

  return (
    <div className="space-y-4">
      {/* Section 1: Demand Computation */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-1">Demand Computation</h3>
        <p className="text-xs text-gray-500 mb-3">Parameters governing how daily demand is calculated and anomalies are detected.</p>
        <div className="grid grid-cols-2 gap-4">
          <ConfigField
            label="ADS Window"
            value={`${c.cr_ads_window ?? 7} days`}
            description="Trailing days for Average Daily Revenue"
          />
          <ConfigField
            label="OOS Correction"
            value={(c.cr_oos_correction ?? true) ? 'Enabled' : 'Disabled'}
            description="Substitute lost revenue during stockouts"
          />
          <ConfigField
            label="Demand Spike Threshold"
            value={`${c.cr_demand_spike_threshold ?? 1.5}x ADS`}
            description="Above this = demand spike alert"
          />
          <ConfigField
            label="Demand Drop Threshold"
            value={`${c.cr_demand_drop_threshold ?? 0.5}x ADS`}
            description="Below this = demand drop alert"
          />
        </div>
      </div>

      {/* Section 2: Store Thresholds */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-1">Store Thresholds</h3>
        <p className="text-xs text-gray-500 mb-3">Safety stock and review parameters at the store level, tiered by store grade.</p>
        <div className="grid grid-cols-2 gap-4">
          <ConfigField
            label="Store Safety Stock Days (A+ tier)"
            value={`${c.cr_store_ss_days_a_plus ?? 5} days`}
            description="Safety stock buffer for top-tier stores"
          />
          <ConfigField
            label="Store Safety Stock Days (A1-A3 tier)"
            value={`${c.cr_store_ss_days_a1_a3 ?? 7} days`}
            description="Safety stock buffer for standard-tier stores"
          />
          <ConfigField
            label="Store Review Period"
            value={`${c.cr_store_review_period ?? 7} days`}
            description="Frequency at which store-level demand is reviewed"
          />
          <ConfigField
            label="Service Level Target"
            value={`${c.cr_service_level_target ?? 95}%`}
            description="Target fill rate at store-size level"
          />
        </div>
      </div>

      {/* Section 3: DC Thresholds */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-1">DC Thresholds</h3>
        <p className="text-xs text-gray-500 mb-3">Distribution center cover parameters and festive pre-build buffers.</p>
        <div className="grid grid-cols-2 gap-4">
          <ConfigField
            label="DC Min Cover Days"
            value={`${c.cr_dc_min_cover_days ?? 14} days`}
            description="Trigger reorder below this"
          />
          <ConfigField
            label="DC Max Cover Days"
            value={`${c.cr_dc_max_cover_days ?? 28} days`}
            description="Order up to this level"
          />
          <ConfigField
            label="DC Safety Stock Days"
            value={`${c.cr_dc_safety_stock_days ?? '5-7'} days`}
            description="Safety stock buffer at DC level"
          />
          <ConfigField
            label="DC Festive Buffer Days"
            value={`${c.cr_dc_festive_buffer_days ?? 14} days`}
            description="Pre-build buffer during surge"
          />
          <ConfigField
            label="DC Festive Buffer Lead"
            value={`T-${c.cr_dc_festive_buffer_lead ?? 30} days`}
            description="Start pre-build this many days before festive window"
          />
        </div>
      </div>

      {/* Section 4: Vendor Safety Stock */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-1">Vendor Safety Stock</h3>
        <p className="text-xs text-gray-500 mb-3">Finished goods and fabric safety stock targets at vendor locations.</p>
        <div className="grid grid-cols-2 gap-4">
          <ConfigField
            label="FG SS Target"
            value={`${c.cr_fg_ss_target ?? 7} days of DC pull rate`}
            description="Finished goods safety stock target at vendor"
          />
          <ConfigField
            label="FG SS Trigger"
            value={`${c.cr_fg_ss_trigger ?? 50}% of target`}
            description="Below this, trigger upstream replenishment"
          />
          <ConfigField
            label="FF SS Target"
            value={`${c.cr_ff_ss_target ?? 14} days of consumption`}
            description="Fabric/fabric safety stock target at vendor"
          />
          <ConfigField
            label="FF SS Trigger"
            value={`${c.cr_ff_ss_trigger ?? 50}% of target`}
            description="Below this, trigger greige consumption"
          />
        </div>
      </div>

      {/* Section 5: Vendor Management */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-1">Vendor Management</h3>
        <p className="text-xs text-gray-500 mb-3">Vendor performance thresholds and auto-switch governance rules.</p>
        <div className="grid grid-cols-2 gap-4">
          <ConfigField
            label="OTIF Threshold"
            value={`${c.cr_otif_threshold ?? 95}%`}
            description="Below this, trigger auto-switch evaluation"
          />
          <ConfigField
            label="FTR Threshold"
            value={`${c.cr_ftr_threshold ?? 95}%`}
            description="Below this, trigger auto-switch evaluation"
          />
          <ConfigField
            label="Max Vendor Shift %"
            value={`${c.cr_max_vendor_shift ?? 30}%`}
            description="Max allocation shift per auto-switch event"
          />
          <ConfigField
            label="Min Vendor Stability Period"
            value={`${c.cr_min_vendor_stability_period ?? 14} days`}
            description="Min days before re-switch"
          />
          <ConfigField
            label="Costing Validity Window"
            value={`${c.cr_costing_validity_window ?? 90} days (rolling)`}
            description="No re-cost within this window"
          />
        </div>
      </div>

      {/* Section 6: Surge / Festive */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-1">Surge / Festive</h3>
        <p className="text-xs text-gray-500 mb-3">Demand multipliers and special routing for festive and surge periods.</p>
        <div className="grid grid-cols-2 gap-4">
          <ConfigField
            label="Default Surge Factor"
            value={`${c.cr_default_surge_factor ?? 1.0}`}
            description="Multiplier during non-festive periods"
          />
          <ConfigField
            label="Festive Surge Factor"
            value={`${c.cr_festive_surge_factor ?? 1.5}x`}
            description="Typical multiplier during Diwali etc."
          />
          <ConfigField
            label="DSD Enabled (Festive)"
            value={(c.cr_dsd_enabled_festive ?? false) ? 'TRUE' : 'FALSE'}
            description="Direct-Store-Delivery bypass for festive speed"
          />
        </div>
      </div>

      <div className="flex items-start gap-2 px-3 py-2.5 bg-blue-50 rounded-lg text-sm text-blue-700">
        <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <span>CORE reordering parameters are read-only reference values. Changes to these parameters require approval from SCM Head and are propagated to the CORE reordering engine.</span>
      </div>
    </div>
  );
}

// ─── Tab 9: Planogram & Fill Rate ──────────────────────────────────

function PlanogramFillRateTab() {
  const { config, loading, saving, error: apiError, fetch: fetchConfig, setConfig, save, resetToDefaults } = useANRAdminStore();
  const { success: toastSuccess, error: toastError } = useToast();

  // eslint-disable-next-line react-hooks/exhaustive-deps -- fetch on mount only
  useEffect(() => { fetchConfig('planogram_fill_rate'); }, []);

  const updateConstant = useCallback(<K extends keyof import('../data/anrConfigTypes').ANRConstants>(
    key: K,
    value: import('../data/anrConfigTypes').ANRConstants[K],
  ) => {
    if (config) setConfig({ ...config, constants: { ...config.constants, [key]: value } });
  }, [config, setConfig]);

  const handleSave = useCallback(async () => {
    try {
      await save('planogram_fill_rate');
      toastSuccess('Planogram & fill rate configuration saved');
    } catch {
      toastError('Failed to save planogram & fill rate configuration');
    }
  }, [save, toastSuccess, toastError]);

  const handleReset = useCallback(async () => {
    try {
      await resetToDefaults('planogram_fill_rate');
      toastSuccess('Configuration reset to defaults');
    } catch {
      toastError('Failed to reset configuration');
    }
  }, [resetToDefaults, toastSuccess, toastError]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 px-4">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        <span className="text-sm text-gray-500">Loading configuration...</span>
      </div>
    );
  }

  if (apiError) {
    return (
      <div className="flex items-start gap-2 px-3 py-2.5 bg-red-50 rounded-lg text-sm text-red-700">
        <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <span>{apiError}</span>
      </div>
    );
  }

  if (!config) return null;

  const c = config.constants;
  const understockVal = c.pf_understock_threshold ?? DEFAULTS.fillRate.understockThresholdPct;
  const overstockVal = c.pf_overstock_threshold ?? DEFAULTS.fillRate.overstockThresholdPct;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Fill Rate Thresholds</h3>

        <FieldRow label="Default Fill Rate" description="Target fill rate for planogram calculations (90% = 0.9)">
          <NumberField value={c.pf_default_fill_rate ?? DEFAULTS.fillRate.defaultFillRate} onChange={(v) => updateConstant('pf_default_fill_rate', v)} suffix="" step={0.05} min={0.5} max={1.0} />
        </FieldRow>

        <FieldRow label="Understock Threshold" description="Fill rate below which store is eligible for replenishment">
          <NumberField value={understockVal} onChange={(v) => updateConstant('pf_understock_threshold', v)} suffix="%" min={50} max={100} />
        </FieldRow>

        <FieldRow label="Overstock Threshold" description="Fill rate above which store is eligible for planogram-overfill pullback">
          <NumberField value={overstockVal} onChange={(v) => updateConstant('pf_overstock_threshold', v)} suffix="%" min={100} max={200} />
        </FieldRow>

        <div className="mt-3 rounded-lg bg-gray-50 p-3">
          <h4 className="text-xs font-semibold text-gray-700 mb-2">Fill Rate Interpretation</h4>
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center gap-2">
              <Badge variant="error" className="text-[10px] w-20 justify-center">&lt; {understockVal}%</Badge>
              <span className="text-gray-600">Below target &mdash; replenishment eligible</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="success" className="text-[10px] w-20 justify-center">{understockVal}&ndash;{overstockVal}%</Badge>
              <span className="text-gray-600">Healthy range &mdash; no action</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="warning" className="text-[10px] w-20 justify-center">&ge; {overstockVal}%</Badge>
              <span className="text-gray-600">Overstocked &mdash; pullback eligible</span>
            </div>
          </div>
        </div>
      </div>

      {/* BACKLOG: Scope & Constants — API integration pending
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Scope &amp; Constants</h3>
        <p className="text-xs text-gray-500 mb-3">Shared constants used across all pipeline configurations. These scope the data queries and control pipeline behaviour.</p>

        <FieldRow label="Trailing Days" description="Number of trailing days for sales aggregation in data source queries">
          <NumberField value={trailingDays} onChange={setTrailingDays} suffix="d" min={1} max={90} />
        </FieldRow>

        <FieldRow label="Segments in Scope" description="Merchandise hierarchy segment codes included in pipeline queries">
          <Input
            value={segmentsInScope}
            onChange={(e) => setSegmentsInScope(e.target.value)}
            className="w-48 py-1.5 text-sm font-mono"
          />
        </FieldRow>

        <FieldRow label="Sub-Formats in Scope" description="Store sub-format codes included in pipeline queries">
          <Input
            value={subFormatsInScope}
            onChange={(e) => setSubFormatsInScope(e.target.value)}
            className="w-48 py-1.5 text-sm font-mono"
          />
        </FieldRow>

        <FieldRow label="Min Sales Threshold" description="Minimum sales threshold to consider an article active">
          <NumberField value={minSalesThreshold} onChange={setMinSalesThreshold} suffix="" step={0.01} min={0} max={1} />
        </FieldRow>
      </div>
      */}

      <div className="flex items-start gap-2 px-3 py-2.5 bg-blue-50 rounded-lg text-sm text-blue-700">
        <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <span>Planogram fill rate is computed at the site &times; brand &times; fashion grade &times; segment &times; family &times; brick level. Group expansion and family resolution ensure complete coverage even when planogram entries are at higher hierarchy levels.</span>
      </div>

      <SectionFooter onSave={handleSave} onReset={handleReset} saving={saving} />
    </div>
  );
}

// ─── Main Page Component ────────────────────────────────────────────

export function AdminInventoryConfigPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="Inventory &amp; A&amp;R Configuration" />

      <Tabs defaultValue="cover-days">
        <TabsList variant="underline">
          <TabsTrigger value="cover-days" variant="underline">Cover Days</TabsTrigger>
          <TabsTrigger value="replenishment" variant="underline">Replenishment</TabsTrigger>
          <TabsTrigger value="pullback" variant="underline">Pullback</TabsTrigger>
          <TabsTrigger value="redistribution" variant="underline">Redistribution</TabsTrigger>
          <TabsTrigger value="lifecycle" variant="underline">Lifecycle &amp; Rotation</TabsTrigger>
          <TabsTrigger value="liquidation" variant="underline">Liquidation Channels</TabsTrigger>
          <TabsTrigger value="planogram" variant="underline">Planogram &amp; Fill Rate</TabsTrigger>
          <TabsTrigger value="core-reordering" variant="underline">CORE Reordering</TabsTrigger>
        </TabsList>

        <TabsContent value="cover-days">
          <CoverDaysTab />
        </TabsContent>
        <TabsContent value="replenishment">
          <ReplenishmentTab />
        </TabsContent>
        <TabsContent value="pullback">
          <PullbackParametersTab />
        </TabsContent>
        <TabsContent value="redistribution">
          <RedistributionParametersTab />
        </TabsContent>
        <TabsContent value="lifecycle">
          <LifecyclePhasesTab />
        </TabsContent>
        <TabsContent value="liquidation">
          <LiquidationChannelsTab />
        </TabsContent>
        <TabsContent value="planogram">
          <PlanogramFillRateTab />
        </TabsContent>
        <TabsContent value="core-reordering">
          <CoreReorderingTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
