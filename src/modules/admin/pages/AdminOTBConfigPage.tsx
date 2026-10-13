import { useState, useCallback, useMemo, useEffect } from 'react';
import { Save, RotateCcw, Info, CheckCircle2, X, Plus, FlaskConical, ChevronDown, ChevronRight, Loader2, Trash2 } from 'lucide-react';
import {
  Button,
  Input,
  Badge,
  PageHeader,
  Switch,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  ConfirmDialog,
} from '@/components/ui';
import { useOTBStore } from '@/modules/otb/stores/otb.store';
import { mockOTBConfig } from '@/modules/otb/data/mockOTB';
import { cn, apiUrl, apiHeaders } from '@/lib/utils';
import type { AggregationLevel, CalculationFrequency, OTBKPIFormula } from '@/modules/otb/types/otb.types';
import { useANRAdminStore } from '../stores/useANRAdminStore';
import { useToast } from '@/hooks/useToast';
import { useModuleConfig } from '@/hooks/useScreenConfig';
import { parseOtbConfig } from '@/modules/otb/data/otbTenantConfig';
import { SuperdryOTBConfig } from '../components/otb/SuperdryOTBConfig';

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
  className?: string;
}

function NumberField({ value, onChange, suffix, step = 1, min, max, className }: NumberFieldProps) {
  return (
    <div className="flex items-center gap-1.5">
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        step={step}
        min={min}
        max={max}
        className={cn('w-24 text-right py-1.5 text-sm', className)}
      />
      {suffix && (
        <span className="text-sm text-gray-500 w-8">{suffix}</span>
      )}
    </div>
  );
}

// ─── Total Validation Display ───────────────────────────────────────

function TotalDisplay({ values, target = 100 }: { values: number[]; target?: number }) {
  const total = values.reduce((sum, v) => sum + v, 0);
  const isValid = total === target;

  return (
    <div className={cn(
      'flex items-center gap-2 mt-3 px-3 py-2 rounded-lg text-sm font-medium',
      isValid ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
    )}>
      {isValid ? (
        <CheckCircle2 className="w-4 h-4" />
      ) : (
        <Info className="w-4 h-4" />
      )}
      <span>Total: {total}%</span>
      {!isValid && (
        <span className="text-xs font-normal ml-1">(must equal {target}%)</span>
      )}
    </div>
  );
}

// ─── Section Footer ─────────────────────────────────────────────────

interface SectionFooterProps {
  onSave: () => void;
  onReset: () => void;
  isValid?: boolean;
}

function SectionFooter({ onSave, onReset, isValid = true }: SectionFooterProps) {
  return (
    <div className="flex items-center gap-3 pt-4 mt-4 border-t border-gray-200">
      <Button onClick={onSave} disabled={!isValid}>
        <Save className="w-4 h-4 mr-1.5" />
        Save Changes
      </Button>
      <Button variant="secondary" onClick={onReset}>
        <RotateCcw className="w-4 h-4 mr-1.5" />
        Reset to Defaults
      </Button>
    </div>
  );
}

// ─── Tab 1: Budget Structure ────────────────────────────────────────

function BudgetStructureTab() {
  const { config, loading, saving, error, updateConstants } = useANRAdminStore();
  const fetchConfig = useANRAdminStore((s) => s.fetch);
  const saveConfig = useANRAdminStore((s) => s.save);
  const resetToDefaults = useANRAdminStore((s) => s.resetToDefaults);
  const { success: toastSuccess, error: toastError } = useToast();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchConfig('otb_budget'); }, []);

  const c = config?.constants;
  const coreNoos = c?.otb_core_noos_pct ?? 30;
  const fashion = c?.otb_fashion_pct ?? 10;

  const tierTotal = coreNoos + fashion;
  const isTierValid = tierTotal === 100;

  const handleChange = useCallback((key: 'otb_core_noos_pct' | 'otb_fashion_pct', value: number) => {
    if (!c) return;
    updateConstants({ ...c, [key]: value });
  }, [c, updateConstants]);

  const handleSave = useCallback(async () => {
    try {
      await saveConfig('otb_budget');
      toastSuccess('Budget structure saved');
    } catch {
      toastError('Failed to save budget structure');
    }
  }, [saveConfig, toastSuccess, toastError]);

  const handleReset = useCallback(async () => {
    try {
      await resetToDefaults('otb_budget');
      toastSuccess('Budget structure reset to defaults');
    } catch {
      toastError('Failed to reset budget structure');
    }
  }, [resetToDefaults, toastSuccess, toastError]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-gray-500">
        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading budget structure…
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Budget Split */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Budget Split</h3>

        <FieldRow label="Core / NOOS" description="Allocation for basic and never-out-of-stock styles">
          <NumberField value={coreNoos} onChange={(v) => handleChange('otb_core_noos_pct', v)} suffix="%" min={0} max={100} />
        </FieldRow>

        <FieldRow label="Fashion" description="Allocation for trend-driven and seasonal styles">
          <NumberField value={fashion} onChange={(v) => handleChange('otb_fashion_pct', v)} suffix="%" min={0} max={100} />
        </FieldRow>

        <TotalDisplay values={[coreNoos, fashion]} />
      </div>

      <SectionFooter onSave={handleSave} onReset={handleReset} isValid={isTierValid && !saving} />
    </div>
  );
}

// ─── Tab 2: Sourcing Engines (BACKLOG #29 — hidden from UI) ────────

// @ts-expect-error TS6133 -- BACKLOG #29: tab hidden from UI
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function SourcingEnginesTab() {
  const config = useOTBStore((s) => s.config);
  const updateConfig = useOTBStore((s) => s.updateConfig);

  const [scaleMargin, setScaleMargin] = useState(config.sourcingEngines.scaleMarginShare);
  const [fastResponse, setFastResponse] = useState(config.sourcingEngines.fastResponseShare);
  const [testRepeat, setTestRepeat] = useState(config.sourcingEngines.testRepeatShare);

  const total = scaleMargin + fastResponse + testRepeat;
  const isValid = total === 100;

  const handleSave = useCallback(() => {
    updateConfig({
      sourcingEngines: {
        scaleMarginShare: scaleMargin,
        fastResponseShare: fastResponse,
        testRepeatShare: testRepeat,
      },
    });
  }, [scaleMargin, fastResponse, testRepeat, updateConfig]);

  const handleReset = useCallback(() => {
    const defaults = mockOTBConfig.sourcingEngines;
    setScaleMargin(defaults.scaleMarginShare);
    setFastResponse(defaults.fastResponseShare);
    setTestRepeat(defaults.testRepeatShare);
  }, []);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Sourcing Engine Allocation</h3>

        <FieldRow label="Scale Margin Share" description="High-volume, long-lead-time vendors with best margins">
          <NumberField value={scaleMargin} onChange={setScaleMargin} suffix="%" min={0} max={100} />
        </FieldRow>

        <FieldRow label="Fast Response Share" description="Quick-turn vendors for in-season replenishment">
          <NumberField value={fastResponse} onChange={setFastResponse} suffix="%" min={0} max={100} />
        </FieldRow>

        <FieldRow label="Test & Repeat Share" description="Small-batch test runs with rapid repeat capability">
          <NumberField value={testRepeat} onChange={setTestRepeat} suffix="%" min={0} max={100} />
        </FieldRow>

        <TotalDisplay values={[scaleMargin, fastResponse, testRepeat]} />
      </div>

      <SectionFooter onSave={handleSave} onReset={handleReset} isValid={isValid} />
    </div>
  );
}

// ─── Tab 3: Guardrails (BACKLOG #29 — hidden from UI) ──────────────

// @ts-expect-error TS6133 -- BACKLOG #29: tab hidden from UI
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function GuardrailsTab() {
  const config = useOTBStore((s) => s.config);
  const updateConfig = useOTBStore((s) => s.updateConfig);

  const [otbCap, setOtbCap] = useState(config.guardrails.otbCap);
  const [vendorConcentration, setVendorConcentration] = useState(config.guardrails.vendorConcentrationLimit);
  const [intakeMargin, setIntakeMargin] = useState(config.guardrails.intakeMarginFloor);
  const [pricingFloor, setPricingFloor] = useState(config.guardrails.pricingFloorMultiplier);
  const [chaseAutoRealloc, setChaseAutoRealloc] = useState(config.guardrails.chaseAutoReallocationLimit);

  const handleSave = useCallback(() => {
    updateConfig({
      guardrails: {
        otbCap,
        vendorConcentrationLimit: vendorConcentration,
        intakeMarginFloor: intakeMargin,
        pricingFloorMultiplier: pricingFloor,
        chaseAutoReallocationLimit: chaseAutoRealloc,
      },
    });
  }, [otbCap, vendorConcentration, intakeMargin, pricingFloor, chaseAutoRealloc, updateConfig]);

  const handleReset = useCallback(() => {
    const defaults = mockOTBConfig.guardrails;
    setOtbCap(defaults.otbCap);
    setVendorConcentration(defaults.vendorConcentrationLimit);
    setIntakeMargin(defaults.intakeMarginFloor);
    setPricingFloor(defaults.pricingFloorMultiplier);
    setChaseAutoRealloc(defaults.chaseAutoReallocationLimit);
  }, []);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Guardrail Thresholds</h3>

        <FieldRow label="OTB Cap" description="Maximum utilization percentage before exception is raised">
          <NumberField value={otbCap} onChange={setOtbCap} suffix="%" min={100} max={200} />
        </FieldRow>

        <FieldRow label="Vendor Concentration Limit" description="Maximum share any single vendor can hold within a POD">
          <NumberField value={vendorConcentration} onChange={setVendorConcentration} suffix="%" min={1} max={100} />
        </FieldRow>

        <FieldRow label="Intake Margin Floor" description="Minimum intake margin required for any purchase order">
          <NumberField value={intakeMargin} onChange={setIntakeMargin} suffix="%" min={0} max={100} />
        </FieldRow>

        <FieldRow label="Pricing Floor Multiplier" description="Minimum cost-to-MRP multiplier for margin protection">
          <NumberField value={pricingFloor} onChange={setPricingFloor} suffix="x" step={0.01} min={1} max={5} />
        </FieldRow>

        <FieldRow label="Chase Auto-Reallocation Limit" description="Maximum percentage of chase budget that can be auto-reallocated">
          <NumberField value={chaseAutoRealloc} onChange={setChaseAutoRealloc} suffix="%" min={0} max={100} />
        </FieldRow>
      </div>

      <SectionFooter onSave={handleSave} onReset={handleReset} />
    </div>
  );
}

// ─── Tab 4: Utilization Thresholds (BACKLOG #29 — hidden from UI) ───

// @ts-expect-error TS6133 -- BACKLOG #29: tab hidden from UI
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function UtilizationTab() {
  const config = useOTBStore((s) => s.config);
  const updateConfig = useOTBStore((s) => s.updateConfig);

  const [greenFloor, setGreenFloor] = useState(config.utilization.greenFloor);
  const [greenCeiling, setGreenCeiling] = useState(config.utilization.greenCeiling);
  const [amberFloor, setAmberFloor] = useState(config.utilization.amberFloor);
  const [amberCeiling, setAmberCeiling] = useState(config.utilization.amberCeiling);
  const [severityUnder, setSeverityUnder] = useState(config.utilization.exceptionSeverityUnder);
  const [severityOver, setSeverityOver] = useState(config.utilization.exceptionSeverityOver);

  const handleSave = useCallback(() => {
    updateConfig({
      utilization: {
        greenFloor,
        greenCeiling,
        amberFloor,
        amberCeiling,
        exceptionSeverityUnder: severityUnder,
        exceptionSeverityOver: severityOver,
      },
    });
  }, [greenFloor, greenCeiling, amberFloor, amberCeiling, severityUnder, severityOver, updateConfig]);

  const handleReset = useCallback(() => {
    const defaults = mockOTBConfig.utilization;
    setGreenFloor(defaults.greenFloor);
    setGreenCeiling(defaults.greenCeiling);
    setAmberFloor(defaults.amberFloor);
    setAmberCeiling(defaults.amberCeiling);
    setSeverityUnder(defaults.exceptionSeverityUnder);
    setSeverityOver(defaults.exceptionSeverityOver);
  }, []);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Utilization RAG Thresholds</h3>

        <FieldRow label="Green Floor" description="Minimum utilization for healthy (green) status">
          <NumberField value={greenFloor} onChange={setGreenFloor} suffix="%" min={0} max={100} />
        </FieldRow>

        <FieldRow label="Green Ceiling" description="Maximum utilization for healthy (green) status">
          <NumberField value={greenCeiling} onChange={setGreenCeiling} suffix="%" min={100} max={200} />
        </FieldRow>

        <FieldRow label="Amber Floor" description="Minimum utilization for warning (amber) status">
          <NumberField value={amberFloor} onChange={setAmberFloor} suffix="%" min={0} max={100} />
        </FieldRow>

        <FieldRow label="Amber Ceiling" description="Maximum utilization for warning (amber) status">
          <NumberField value={amberCeiling} onChange={setAmberCeiling} suffix="%" min={100} max={200} />
        </FieldRow>

        {/* Visual range indicator */}
        <div className="mt-3 px-3 py-2.5 bg-gray-50 rounded-lg">
          <p className="text-xs font-medium text-gray-500 mb-2">Threshold Ranges</p>
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <Badge variant="destructive" className="text-xs">Red</Badge>
            <span>&lt; {amberFloor}%</span>
            <span className="mx-1 text-gray-400">|</span>
            <Badge className="bg-amber-100 text-amber-700 text-xs">Amber</Badge>
            <span>{amberFloor}% - {greenFloor}%</span>
            <span className="mx-1 text-gray-400">|</span>
            <Badge className="bg-green-100 text-green-700 text-xs">Green</Badge>
            <span>{greenFloor}% - {greenCeiling}%</span>
            <span className="mx-1 text-gray-400">|</span>
            <Badge className="bg-amber-100 text-amber-700 text-xs">Amber</Badge>
            <span>{greenCeiling}% - {amberCeiling}%</span>
            <span className="mx-1 text-gray-400">|</span>
            <Badge variant="destructive" className="text-xs">Red</Badge>
            <span>&gt; {amberCeiling}%</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Exception Severity Mapping</h3>

        <FieldRow label="Exception Severity (Under-utilized)" description="Severity level when utilization falls below amber floor">
          <Select value={severityUnder} onValueChange={setSeverityUnder}>
            <SelectTrigger size="sm" className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="S1">S1</SelectItem>
              <SelectItem value="S2">S2</SelectItem>
              <SelectItem value="S3">S3</SelectItem>
            </SelectContent>
          </Select>
        </FieldRow>

        <FieldRow label="Exception Severity (Over-utilized)" description="Severity level when utilization exceeds amber ceiling">
          <Select value={severityOver} onValueChange={setSeverityOver}>
            <SelectTrigger size="sm" className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="S1">S1</SelectItem>
              <SelectItem value="S2">S2</SelectItem>
              <SelectItem value="S3">S3</SelectItem>
            </SelectContent>
          </Select>
        </FieldRow>
      </div>

      <SectionFooter onSave={handleSave} onReset={handleReset} />
    </div>
  );
}

// ─── Tab 5: Chase Triggers (BACKLOG #29 — hidden from UI) ──────────

// @ts-expect-error TS6133 -- BACKLOG #29: tab hidden from UI
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function ChaseTriggersTab() {
  const config = useOTBStore((s) => s.config);
  const updateConfig = useOTBStore((s) => s.updateConfig);

  const [winnerRos, setWinnerRos] = useState(config.chaseTriggers.winnerRosThreshold);
  const [strongRos, setStrongRos] = useState(config.chaseTriggers.strongRosThreshold);
  const [stockoutCover, setStockoutCover] = useState(config.chaseTriggers.stockoutCoverDayThreshold);
  const [windowStart, setWindowStart] = useState(config.chaseTriggers.chaseWindowStart);
  const [windowEnd, setWindowEnd] = useState(config.chaseTriggers.chaseWindowEnd);

  const handleSave = useCallback(() => {
    updateConfig({
      chaseTriggers: {
        winnerRosThreshold: winnerRos,
        strongRosThreshold: strongRos,
        stockoutCoverDayThreshold: stockoutCover,
        chaseWindowStart: windowStart,
        chaseWindowEnd: windowEnd,
      },
    });
  }, [winnerRos, strongRos, stockoutCover, windowStart, windowEnd, updateConfig]);

  const handleReset = useCallback(() => {
    const defaults = mockOTBConfig.chaseTriggers;
    setWinnerRos(defaults.winnerRosThreshold);
    setStrongRos(defaults.strongRosThreshold);
    setStockoutCover(defaults.stockoutCoverDayThreshold);
    setWindowStart(defaults.chaseWindowStart);
    setWindowEnd(defaults.chaseWindowEnd);
  }, []);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">ROS Signal Thresholds</h3>

        <FieldRow label="Winner ROS Threshold" description="Rate of sale multiple to classify a style as a winner">
          <NumberField value={winnerRos} onChange={setWinnerRos} suffix="x" step={0.1} min={0.1} max={10} />
        </FieldRow>

        <FieldRow label="Strong ROS Threshold" description="Rate of sale multiple to classify a style as strong performer">
          <NumberField value={strongRos} onChange={setStrongRos} suffix="x" step={0.1} min={0.1} max={10} />
        </FieldRow>

        <FieldRow label="Stockout Cover Day Threshold" description="Cover days below which a stockout alert is triggered">
          <NumberField value={stockoutCover} onChange={setStockoutCover} suffix="d" step={1} min={1} max={60} />
        </FieldRow>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Chase Window</h3>

        <FieldRow label="Chase Window Start" description="Earliest day (from PO creation) a chase order can be placed">
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-gray-500">N +</span>
            <Input
              type="number"
              value={windowStart}
              onChange={(e) => setWindowStart(Number(e.target.value))}
              min={1}
              max={windowEnd}
              className="w-20 text-right py-1.5 text-sm"
            />
            <span className="text-sm text-gray-500 w-10">days</span>
          </div>
        </FieldRow>

        <FieldRow label="Chase Window End" description="Latest day (from PO creation) a chase order can be placed">
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-gray-500">N +</span>
            <Input
              type="number"
              value={windowEnd}
              onChange={(e) => setWindowEnd(Number(e.target.value))}
              min={windowStart}
              max={120}
              className="w-20 text-right py-1.5 text-sm"
            />
            <span className="text-sm text-gray-500 w-10">days</span>
          </div>
        </FieldRow>
      </div>

      <SectionFooter onSave={handleSave} onReset={handleReset} />
    </div>
  );
}

// ─── Tab 6: Reconciliation Settings (BACKLOG #29 — hidden from UI) ─

// @ts-expect-error TS6133 -- BACKLOG #29: tab hidden from UI
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function ReconciliationSettingsTab() {
  const config = useOTBStore((s) => s.config);
  const updateConfig = useOTBStore((s) => s.updateConfig);

  const [varianceTolerance, setVarianceTolerance] = useState(config.reconciliation.varianceTolerance);
  const [autoCloseThreshold, setAutoCloseThreshold] = useState(config.reconciliation.autoCloseThreshold);
  const [frequency, setFrequency] = useState(config.reconciliation.reconciliationFrequency);
  const [includeTierBreakdown, setIncludeTierBreakdown] = useState(config.reconciliation.includeTierBreakdown);

  const handleSave = useCallback(() => {
    updateConfig({
      reconciliation: {
        varianceTolerance,
        autoCloseThreshold,
        reconciliationFrequency: frequency,
        includeTierBreakdown,
      },
    });
  }, [varianceTolerance, autoCloseThreshold, frequency, includeTierBreakdown, updateConfig]);

  const handleReset = useCallback(() => {
    const defaults = mockOTBConfig.reconciliation;
    setVarianceTolerance(defaults.varianceTolerance);
    setAutoCloseThreshold(defaults.autoCloseThreshold);
    setFrequency(defaults.reconciliationFrequency);
    setIncludeTierBreakdown(defaults.includeTierBreakdown);
  }, []);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Reconciliation Thresholds</h3>

        <FieldRow label="Variance Tolerance" description="Maximum acceptable variance (%) before flagging for review">
          <NumberField value={varianceTolerance} onChange={setVarianceTolerance} suffix="%" min={0} max={100} />
        </FieldRow>

        <FieldRow label="Auto-Close Threshold" description="Auto-close reconciliation if variance is below this threshold">
          <NumberField value={autoCloseThreshold} onChange={setAutoCloseThreshold} suffix="%" min={0} max={100} />
        </FieldRow>

        <FieldRow label="Reconciliation Frequency" description="How often reconciliation runs are executed">
          <Select value={frequency} onValueChange={(v: 'weekly' | 'bi-weekly' | 'monthly') => setFrequency(v)}>
            <SelectTrigger size="sm" className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </FieldRow>

        <FieldRow label="Include Tier Breakdown" description="Show per-tier breakdown in reconciliation reports">
          <Switch
            checked={includeTierBreakdown}
            onCheckedChange={setIncludeTierBreakdown}
          />
        </FieldRow>
      </div>

      <SectionFooter onSave={handleSave} onReset={handleReset} />
    </div>
  );
}

// ─── Tab 7: Margin Bridge (BACKLOG #29 — hidden from UI) ───────────

// @ts-expect-error TS6133 -- BACKLOG #29: tab hidden from UI
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function MarginBridgeTab() {
  const config = useOTBStore((s) => s.config);
  const updateConfig = useOTBStore((s) => s.updateConfig);

  const [intakeMarginTarget, setIntakeMarginTarget] = useState(config.marginBridge.intakeMarginTarget);
  const [promoDiscountCap, setPromoDiscountCap] = useState(config.marginBridge.promoDiscountCap);
  const [markdownBudget, setMarkdownBudget] = useState(config.marginBridge.markdownBudget);
  const [logisticsCostCap, setLogisticsCostCap] = useState(config.marginBridge.logisticsCostCap);
  const [netGMFloor, setNetGMFloor] = useState(config.marginBridge.netGMFloor);

  const handleSave = useCallback(() => {
    updateConfig({
      marginBridge: {
        intakeMarginTarget,
        promoDiscountCap,
        markdownBudget,
        logisticsCostCap,
        netGMFloor,
      },
    });
  }, [intakeMarginTarget, promoDiscountCap, markdownBudget, logisticsCostCap, netGMFloor, updateConfig]);

  const handleReset = useCallback(() => {
    const defaults = mockOTBConfig.marginBridge;
    setIntakeMarginTarget(defaults.intakeMarginTarget);
    setPromoDiscountCap(defaults.promoDiscountCap);
    setMarkdownBudget(defaults.markdownBudget);
    setLogisticsCostCap(defaults.logisticsCostCap);
    setNetGMFloor(defaults.netGMFloor);
  }, []);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Margin Bridge Targets</h3>

        <FieldRow label="Intake Margin Target" description="Target gross margin at point of intake">
          <NumberField value={intakeMarginTarget} onChange={setIntakeMarginTarget} suffix="%" min={0} max={100} />
        </FieldRow>

        <FieldRow label="Promo Discount Cap" description="Maximum allowable promotional discount as % of revenue">
          <NumberField value={promoDiscountCap} onChange={setPromoDiscountCap} suffix="%" min={0} max={100} />
        </FieldRow>

        <FieldRow label="Markdown Budget" description="Markdown budget as a percentage of revenue">
          <NumberField value={markdownBudget} onChange={setMarkdownBudget} suffix="%" min={0} max={100} />
        </FieldRow>

        <FieldRow label="Logistics Cost Cap" description="Maximum logistics cost as a percentage of revenue">
          <NumberField value={logisticsCostCap} onChange={setLogisticsCostCap} suffix="%" min={0} max={100} />
        </FieldRow>

        <FieldRow label="Net GM Floor" description="Minimum acceptable net gross margin after all deductions">
          <NumberField value={netGMFloor} onChange={setNetGMFloor} suffix="%" min={0} max={100} />
        </FieldRow>
      </div>

      {/* Visual margin waterfall summary */}
      <div className="flex items-start gap-2 px-3 py-2.5 bg-blue-50 rounded-lg text-sm text-blue-700">
        <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <span>
          Margin waterfall: Intake ({intakeMarginTarget}%) - Promo ({promoDiscountCap}%) - Markdown ({markdownBudget}%) - Logistics ({logisticsCostCap}%) = Net GM floor ({netGMFloor}%)
        </span>
      </div>

      <SectionFooter onSave={handleSave} onReset={handleReset} />
    </div>
  );
}

// ─── Tab 8: Sell-Through Rules (BACKLOG #29 — hidden from UI) ──────

// @ts-expect-error TS6133 -- BACKLOG #29: tab hidden from UI
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function SellThroughRulesTab() {
  const config = useOTBStore((s) => s.config);
  const updateConfig = useOTBStore((s) => s.updateConfig);

  const [day7Winner, setDay7Winner] = useState(config.sellThroughRules.day7WinnerThreshold);
  const [day7Loser, setDay7Loser] = useState(config.sellThroughRules.day7LoserThreshold);
  const [day14Winner, setDay14Winner] = useState(config.sellThroughRules.day14WinnerST);
  const [day14Loser, setDay14Loser] = useState(config.sellThroughRules.day14LoserST);
  const [autoMarkdownDays, setAutoMarkdownDays] = useState(config.sellThroughRules.autoMarkdownTriggerDays);
  const [carryoverThreshold, setCarryoverThreshold] = useState(config.sellThroughRules.carryoverThreshold);

  const handleSave = useCallback(() => {
    updateConfig({
      sellThroughRules: {
        day7WinnerThreshold: day7Winner,
        day7LoserThreshold: day7Loser,
        day14WinnerST: day14Winner,
        day14LoserST: day14Loser,
        autoMarkdownTriggerDays: autoMarkdownDays,
        carryoverThreshold,
      },
    });
  }, [day7Winner, day7Loser, day14Winner, day14Loser, autoMarkdownDays, carryoverThreshold, updateConfig]);

  const handleReset = useCallback(() => {
    const defaults = mockOTBConfig.sellThroughRules;
    setDay7Winner(defaults.day7WinnerThreshold);
    setDay7Loser(defaults.day7LoserThreshold);
    setDay14Winner(defaults.day14WinnerST);
    setDay14Loser(defaults.day14LoserST);
    setAutoMarkdownDays(defaults.autoMarkdownTriggerDays);
    setCarryoverThreshold(defaults.carryoverThreshold);
  }, []);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Day-7 Checkpoint</h3>

        <FieldRow label="Day-7 Winner Threshold" description="Sell-through rate above this % classifies a style as a winner at day 7">
          <NumberField value={day7Winner} onChange={setDay7Winner} suffix="%" min={0} max={100} />
        </FieldRow>

        <FieldRow label="Day-7 Loser Threshold" description="Sell-through rate below this % classifies a style as a loser at day 7">
          <NumberField value={day7Loser} onChange={setDay7Loser} suffix="%" min={0} max={100} />
        </FieldRow>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Day-14 Checkpoint</h3>

        <FieldRow label="Day-14 Winner ST" description="Sell-through rate above this % confirms winner classification at day 14">
          <NumberField value={day14Winner} onChange={setDay14Winner} suffix="%" min={0} max={100} />
        </FieldRow>

        <FieldRow label="Day-14 Loser ST" description="Sell-through rate below this % confirms loser classification at day 14">
          <NumberField value={day14Loser} onChange={setDay14Loser} suffix="%" min={0} max={100} />
        </FieldRow>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Markdown & Carryover</h3>

        <FieldRow label="Auto-Markdown Trigger" description="Days with sell-through below 8% before auto-markdown is triggered">
          <NumberField value={autoMarkdownDays} onChange={setAutoMarkdownDays} suffix="d" min={1} max={180} />
        </FieldRow>

        <FieldRow label="Carryover Threshold" description="Remaining stock % below which a style is not carried over to next season">
          <NumberField value={carryoverThreshold} onChange={setCarryoverThreshold} suffix="%" min={0} max={100} />
        </FieldRow>
      </div>

      <SectionFooter onSave={handleSave} onReset={handleReset} />
    </div>
  );
}

// ─── Tab 9: Procurement Controls ────────────────────────────────────
// BACKLOG #29: Procurement tab hidden until backend APIs are ready
// @ts-expect-error TS6133 -- BACKLOG #29: tab hidden from UI
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function ProcurementControlsTab() {
  const config = useOTBStore((s) => s.config);
  const updateConfig = useOTBStore((s) => s.updateConfig);

  // Vendor Management
  const [consolidationTarget, setConsolidationTarget] = useState(config.vendorManagement.consolidationTarget);
  const [top20ShareTarget, setTop20ShareTarget] = useState(config.vendorManagement.top20ShareTarget);
  const [exitThreshold, setExitThreshold] = useState(config.vendorManagement.exitThreshold);
  const [scorecardFrequency, setScorecardFrequency] = useState(config.vendorManagement.scorecardFrequency);
  const [newVendorGate, setNewVendorGate] = useState(config.vendorManagement.newVendorOnboardingGate);

  // Fabric Rationalization
  const [activeFabricTarget, setActiveFabricTarget] = useState(config.fabricRationalization.activeFabricTarget);
  const [top50FabricShare, setTop50FabricShare] = useState(config.fabricRationalization.top50FabricTargetShare);
  const [volumeRetention, setVolumeRetention] = useState(config.fabricRationalization.volumeThresholdForRetention);
  const [newFabricGate, setNewFabricGate] = useState(config.fabricRationalization.newFabricApprovalGate);

  // Hard Order Blocks (subset of buyingDiscipline)
  const [sizeRatioTolerance, setSizeRatioTolerance] = useState(config.buyingDiscipline.sizeRatioTolerance);
  const [coverBreachCore, setCoverBreachCore] = useState(config.buyingDiscipline.coverBreachCore);
  const [coverBreachFashion, setCoverBreachFashion] = useState(config.buyingDiscipline.coverBreachFashion);
  const [largeLotBlock, setLargeLotBlock] = useState(config.buyingDiscipline.largeLotUnprovenBlock);
  const [fashionHardStop, setFashionHardStop] = useState(config.buyingDiscipline.fashionHardStop);

  const handleSave = useCallback(() => {
    updateConfig({
      vendorManagement: {
        consolidationTarget,
        top20ShareTarget,
        exitThreshold,
        scorecardFrequency,
        newVendorOnboardingGate: newVendorGate,
      },
      fabricRationalization: {
        activeFabricTarget,
        newFabricApprovalGate: newFabricGate,
        volumeThresholdForRetention: volumeRetention,
        top50FabricTargetShare: top50FabricShare,
      },
      buyingDiscipline: {
        ...config.buyingDiscipline,
        sizeRatioTolerance,
        coverBreachCore,
        coverBreachFashion,
        largeLotUnprovenBlock: largeLotBlock,
        fashionHardStop,
      },
    });
  }, [
    consolidationTarget, top20ShareTarget, exitThreshold, scorecardFrequency, newVendorGate,
    activeFabricTarget, newFabricGate, volumeRetention, top50FabricShare,
    sizeRatioTolerance, coverBreachCore, coverBreachFashion, largeLotBlock, fashionHardStop,
    config.buyingDiscipline, updateConfig,
  ]);

  const handleReset = useCallback(() => {
    const vm = mockOTBConfig.vendorManagement;
    setConsolidationTarget(vm.consolidationTarget);
    setTop20ShareTarget(vm.top20ShareTarget);
    setExitThreshold(vm.exitThreshold);
    setScorecardFrequency(vm.scorecardFrequency);
    setNewVendorGate(vm.newVendorOnboardingGate);

    const fr = mockOTBConfig.fabricRationalization;
    setActiveFabricTarget(fr.activeFabricTarget);
    setTop50FabricShare(fr.top50FabricTargetShare);
    setVolumeRetention(fr.volumeThresholdForRetention);
    setNewFabricGate(fr.newFabricApprovalGate);

    const bd = mockOTBConfig.buyingDiscipline;
    setSizeRatioTolerance(bd.sizeRatioTolerance);
    setCoverBreachCore(bd.coverBreachCore);
    setCoverBreachFashion(bd.coverBreachFashion);
    setLargeLotBlock(bd.largeLotUnprovenBlock);
    setFashionHardStop(bd.fashionHardStop);
  }, []);

  return (
    <div className="space-y-4">
      {/* Card 1: Vendor Management */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Vendor Management</h3>

        <FieldRow label="Consolidation Target" description="Maximum active vendors per POD">
          <NumberField value={consolidationTarget} onChange={setConsolidationTarget} suffix="vendors" min={1} max={500} />
        </FieldRow>

        <FieldRow label="Top-20 Share Target" description="Target share of purchases from top 20 vendors">
          <NumberField value={top20ShareTarget} onChange={setTop20ShareTarget} suffix="%" min={0} max={100} />
        </FieldRow>

        <FieldRow label="Exit Threshold" description="Composite scorecard score below which vendor is exit-listed">
          <NumberField value={exitThreshold} onChange={setExitThreshold} suffix="pts" min={0} max={100} />
        </FieldRow>

        <FieldRow label="Scorecard Frequency" description="How often vendor scorecards are reviewed">
          <Select value={scorecardFrequency} onValueChange={(v: 'weekly' | 'monthly' | 'quarterly') => setScorecardFrequency(v)}>
            <SelectTrigger size="sm" className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
            </SelectContent>
          </Select>
        </FieldRow>

        <FieldRow label="New Vendor Gate" description="Require human approval before onboarding new vendors">
          <Switch
            checked={newVendorGate}
            onCheckedChange={setNewVendorGate}
          />
        </FieldRow>
      </div>

      {/* Card 2: Fabric Rationalization */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Fabric Rationalization</h3>

        <FieldRow label="Active Fabric Target" description="Maximum active fabric codes across the network">
          <NumberField value={activeFabricTarget} onChange={setActiveFabricTarget} suffix="fabrics" min={1} max={1000} />
        </FieldRow>

        <FieldRow label="Top-50 Fabric Share" description="Target purchase share from top 50 fabrics">
          <NumberField value={top50FabricShare} onChange={setTop50FabricShare} suffix="%" min={0} max={100} />
        </FieldRow>

        <FieldRow label="Volume Retention Threshold" description="Minimum volume share to retain a fabric in the active list">
          <NumberField value={volumeRetention} onChange={setVolumeRetention} suffix="%" step={0.1} min={0} max={100} />
        </FieldRow>

        <FieldRow label="New Fabric Gate" description="Require approval before adding new fabric codes">
          <Switch
            checked={newFabricGate}
            onCheckedChange={setNewFabricGate}
          />
        </FieldRow>
      </div>

      {/* Card 3: Hard Order Blocks */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Hard Order Blocks</h3>

        <FieldRow label="Size Ratio Tolerance" description="Maximum deviation from planned size ratios before PO is blocked">
          <NumberField value={sizeRatioTolerance} onChange={setSizeRatioTolerance} suffix="%" min={0} max={100} />
        </FieldRow>

        <FieldRow label="Cover Breach (Core)" description="Maximum forward cover days for core/NOOS styles">
          <NumberField value={coverBreachCore} onChange={setCoverBreachCore} suffix="days" min={1} max={365} />
        </FieldRow>

        <FieldRow label="Cover Breach (Fashion)" description="Maximum forward cover days for fashion styles">
          <NumberField value={coverBreachFashion} onChange={setCoverBreachFashion} suffix="days" min={1} max={365} />
        </FieldRow>

        <FieldRow label="Large Lot Block" description="Maximum units per PO for unproven styles">
          <NumberField value={largeLotBlock} onChange={setLargeLotBlock} suffix="units" min={1} max={100000} />
        </FieldRow>

        <FieldRow label="Fashion Hard Stop" description="Days after launch beyond which new fashion POs are blocked">
          <NumberField value={fashionHardStop} onChange={setFashionHardStop} suffix="days" min={1} max={365} />
        </FieldRow>
      </div>

      {/* Info note */}
      <div className="flex items-start gap-2 px-3 py-2.5 bg-blue-50 rounded-lg text-sm text-blue-700">
        <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <span>Hard order blocks are system-enforced. POs that breach these limits require S1 exception override.</span>
      </div>

      <SectionFooter onSave={handleSave} onReset={handleReset} />
    </div>
  );
}

// ─── Tab 10: Planning Setup ─────────────────────────────────────────

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const ALL_AGGREGATION_LEVELS: { value: AggregationLevel; label: string }[] = [
  { value: 'sub_format_code', label: 'Store Sub-Format' },
  { value: 'BRAND_ID', label: 'Brand' },
  { value: 'MH_SEGMENT_CD', label: 'Segment' },
  { value: 'FASHION_GRADE', label: 'Fashion Grade' },
  { value: 'MH_FAMILY_CD', label: 'Family' },
  { value: 'MH_CLASS_CD', label: 'Class' },
  { value: 'MH_BRICK_CD', label: 'Brick' },
];

const ALL_CALC_FREQUENCIES: CalculationFrequency[] = ['Monthly', 'Weekly', 'Quarterly', 'Half Yearly', 'Yearly'];

function PlanningSetupTab() {
  const { config, loading, saving, error, updateConstants } = useANRAdminStore();
  const fetchConfig = useANRAdminStore((s) => s.fetch);
  const saveConfig = useANRAdminStore((s) => s.save);
  const resetToDefaults = useANRAdminStore((s) => s.resetToDefaults);
  const { success: toastSuccess, error: toastError } = useToast();
  const otbConfig = useOTBStore((s) => s.config);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchConfig('otb_planning'); }, []);

  const c = config?.constants;

  // Derived values from API constants — arrays wrapped in useMemo for stable refs
  const fiscalYearStart = c?.otb_fiscal_year_start ?? 4;
  const currentFiscalYear = c?.otb_current_fiscal_year ?? '2026-27';
  const planningFrequency = c?.otb_planning_frequency ?? 'monthly';
  const calcFrequencies = useMemo(() => (c?.otb_calc_frequencies ?? ['Monthly', 'Weekly']) as CalculationFrequency[], [c?.otb_calc_frequencies]);
  const baseMarginPct = c?.otb_base_margin_pct ?? 40;
  const targetWeeksOfCover = c?.otb_target_weeks_of_cover ?? 1;
  const aggregationLevels = useMemo(() => (c?.otb_aggregation_levels ?? []) as AggregationLevel[], [c?.otb_aggregation_levels]);
  const ageFilterEnabled = c?.otb_age_filter_enabled ?? false;
  const ageMaxDays = c?.otb_inventory_age_max_days ?? 60;
  const formats = useMemo(() => c?.otb_store_formats_in_scope ?? [], [c?.otb_store_formats_in_scope]);
  const segments = useMemo(() => c?.otb_segments_in_scope ?? [], [c?.otb_segments_in_scope]);
  const netSalesMinThreshold = c?.otb_net_sales_min_threshold ?? 148;
  const excludeKpis = useMemo(() => c?.otb_exclude_kpis ?? [], [c?.otb_exclude_kpis]);
  const nonNegativeKpis = useMemo(() => c?.otb_non_negative_kpis ?? [], [c?.otb_non_negative_kpis]);
  const hitNames = useMemo(() => c?.otb_hit_names ?? {}, [c?.otb_hit_names]);

  const set = useCallback((key: string, value: unknown) => {
    if (!c) return;
    updateConstants({ ...c, [key]: value });
  }, [c, updateConstants]);

  const getDefaultHitNames = useCallback((freq: string): Record<string, string> => {
    switch (freq) {
      case 'quarterly':
        return { '1': 'Q1', '2': 'Q2', '3': 'Q3', '4': 'Q4' };
      case 'half-yearly':
        return { '1': 'P1', '2': 'P2' };
      case 'yearly':
        return { '1': 'Y1' };
      default:
        return {
          '1': 'H2', '2': 'H3', '3': 'H4', '4': 'H5', '5': 'H6', '6': '07',
          '7': '08', '8': '09', '9': '10', '10': '11', '11': '12', '12': 'H1',
        };
    }
  }, []);

  const handleFrequencyChange = useCallback((freq: string) => {
    if (!c) return;
    updateConstants({ ...c, otb_planning_frequency: freq, otb_hit_names: getDefaultHitNames(freq) });
  }, [c, updateConstants, getDefaultHitNames]);

  const allKpiNames = useMemo(() =>
    otbConfig.calculatorEngine.kpiFormulae.map((f) => f.kpiName),
    [otbConfig.calculatorEngine.kpiFormulae]
  );

  const availableForExclude = useMemo(() =>
    allKpiNames.filter((k) => !excludeKpis.includes(k)),
    [allKpiNames, excludeKpis]
  );

  const availableForNonNeg = useMemo(() =>
    allKpiNames.filter((k) => !nonNegativeKpis.includes(k)),
    [allKpiNames, nonNegativeKpis]
  );

  const [newFormat, setNewFormat] = useState('');
  const [newSegment, setNewSegment] = useState('');

  const toggleCalcFrequency = useCallback((freq: CalculationFrequency) => {
    const next = calcFrequencies.includes(freq) ? calcFrequencies.filter((f) => f !== freq) : [...calcFrequencies, freq];
    set('otb_calc_frequencies', next);
  }, [calcFrequencies, set]);

  const toggleAggregationLevel = useCallback((level: AggregationLevel) => {
    const next = aggregationLevels.includes(level) ? aggregationLevels.filter((l) => l !== level) : [...aggregationLevels, level];
    set('otb_aggregation_levels', next);
  }, [aggregationLevels, set]);

  const addFormat = useCallback(() => {
    const code = Number(newFormat);
    if (code > 0 && !formats.includes(code)) {
      set('otb_store_formats_in_scope', [...formats, code]);
      setNewFormat('');
    }
  }, [newFormat, formats, set]);

  const removeFormat = useCallback((code: number) => {
    set('otb_store_formats_in_scope', formats.filter((f) => f !== code));
  }, [formats, set]);

  const addSegment = useCallback(() => {
    const code = Number(newSegment);
    if (code > 0 && !segments.includes(code)) {
      set('otb_segments_in_scope', [...segments, code]);
      setNewSegment('');
    }
  }, [newSegment, segments, set]);

  const removeSegment = useCallback((code: number) => {
    set('otb_segments_in_scope', segments.filter((s) => s !== code));
  }, [segments, set]);

  const addExcludeKpi = useCallback((kpi: string) => {
    if (kpi && !excludeKpis.includes(kpi)) {
      set('otb_exclude_kpis', [...excludeKpis, kpi]);
    }
  }, [excludeKpis, set]);

  const removeExcludeKpi = useCallback((kpi: string) => {
    set('otb_exclude_kpis', excludeKpis.filter((k) => k !== kpi));
  }, [excludeKpis, set]);

  const addNonNegKpi = useCallback((kpi: string) => {
    if (kpi && !nonNegativeKpis.includes(kpi)) {
      set('otb_non_negative_kpis', [...nonNegativeKpis, kpi]);
    }
  }, [nonNegativeKpis, set]);

  const removeNonNegKpi = useCallback((kpi: string) => {
    set('otb_non_negative_kpis', nonNegativeKpis.filter((k) => k !== kpi));
  }, [nonNegativeKpis, set]);

  const handleSave = useCallback(async () => {
    try {
      await saveConfig('otb_planning');
      toastSuccess('Planning setup saved');
    } catch {
      toastError('Failed to save planning setup');
    }
  }, [saveConfig, toastSuccess, toastError]);

  const handleReset = useCallback(async () => {
    try {
      await resetToDefaults('otb_planning');
      toastSuccess('Planning setup reset to defaults');
    } catch {
      toastError('Failed to reset planning setup');
    }
  }, [resetToDefaults, toastSuccess, toastError]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-gray-500">
        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading planning setup…
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Card 1: Fiscal Calendar */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Fiscal Calendar</h3>

        <FieldRow label="Fiscal Year Start" description="Month when the fiscal year begins">
          <Select value={String(fiscalYearStart)} onValueChange={(v) => set('otb_fiscal_year_start', Number(v))}>
            <SelectTrigger size="sm" className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTH_NAMES.map((name, i) => (
                <SelectItem key={i + 1} value={String(i + 1)}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldRow>

        <FieldRow label="Current Fiscal Year" description="Active fiscal year identifier (e.g. 2026-27)">
          <Select value={currentFiscalYear} onValueChange={(v) => set('otb_current_fiscal_year', v)}>
            <SelectTrigger size="sm" className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 11 }, (_, i) => {
                const y = new Date().getFullYear() + i;
                const label = `${y}-${String(y + 1).slice(2)}`;
                return <SelectItem key={label} value={label}>{label}</SelectItem>;
              })}
            </SelectContent>
          </Select>
        </FieldRow>
      </div>

      {/* Card 2: Planning Parameters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Planning Parameters</h3>

        <FieldRow label="Planning Frequency" description="Primary time grain for OTB calculations">
          <Select value={planningFrequency} onValueChange={handleFrequencyChange}>
            <SelectTrigger size="sm" className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="half-yearly">Half Yearly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </FieldRow>

        <FieldRow label="Calculation Frequencies" description="Frequencies computed in parallel by the OTB engine">
          <div className="flex flex-wrap gap-1.5">
            {ALL_CALC_FREQUENCIES.map((freq) => (
              <button
                key={freq}
                type="button"
                onClick={() => toggleCalcFrequency(freq)}
                className={cn(
                  'px-2.5 py-1 rounded-md text-xs font-medium border transition-colors',
                  calcFrequencies.includes(freq)
                    ? 'bg-indigo-50 text-primary-700 border-indigo-200'
                    : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                )}
              >
                {freq}
              </button>
            ))}
          </div>
        </FieldRow>

        <FieldRow label="Base Margin" description="Default gross margin % for COGS calculation (maps to kpi_formulae Margin)">
          <NumberField value={baseMarginPct} onChange={(v) => set('otb_base_margin_pct', v)} suffix="%" min={0} max={100} />
        </FieldRow>

        <FieldRow label="Target Weeks of Cover" description="Target inventory coverage in weeks of demand">
          <NumberField value={targetWeeksOfCover} onChange={(v) => set('otb_target_weeks_of_cover', v)} suffix="weeks" step={0.5} min={0.5} max={52} />
        </FieldRow>

        <FieldRow label="Net Revenue Min Threshold" description="Minimum net revenue value for a row to be included in calculations">
          <NumberField value={netSalesMinThreshold} onChange={(v) => set('otb_net_sales_min_threshold', v)} min={0} max={10000} />
        </FieldRow>
      </div>

      {/* Card 3: Aggregation Hierarchy */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Aggregation Hierarchy</h3>
        <p className="text-xs text-gray-500 mb-3">Defines the grain for all OTB calculations. Each unique combination produces one row per month in the output.</p>

        <div className="flex flex-wrap gap-2">
          {ALL_AGGREGATION_LEVELS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => toggleAggregationLevel(value)}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium border transition-colors',
                aggregationLevels.includes(value)
                  ? 'bg-indigo-50 text-primary-700 border-indigo-200'
                  : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
              )}
            >
              {label}
              <span className="ml-1 text-[10px] opacity-60">{value}</span>
            </button>
          ))}
        </div>

        {aggregationLevels.length > 0 && (
          <div className="mt-3 px-3 py-2 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">Active grain: <span className="font-mono text-gray-700">{aggregationLevels.join(' × ')}</span></p>
          </div>
        )}
      </div>

      {/* Card 4: Inventory Age Filter */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Inventory Age Filter</h3>

        <FieldRow label="Enable Age Filter" description="Exclude articles older than max_age_days from closing stock calculations">
          <Switch checked={ageFilterEnabled} onCheckedChange={(v) => set('otb_age_filter_enabled', v)} />
        </FieldRow>

        {ageFilterEnabled && (
          <FieldRow label="Max Age Days" description="Articles older than this threshold are excluded from stock">
            <NumberField value={ageMaxDays} onChange={(v) => set('otb_inventory_age_max_days', v)} suffix="days" min={1} max={365} />
          </FieldRow>
        )}
      </div>

      {/* Card 5: Scope Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Scope Filters</h3>

        <FieldRow label="Store Formats in Scope" description="Sub-format codes included in OTB calculations">
          <div className="flex flex-col gap-2 items-end">
            <div className="flex flex-wrap gap-1.5">
              {formats.map((code) => (
                <Badge key={code} variant="secondary" className="gap-1">
                  {code}
                  <button type="button" onClick={() => removeFormat(code)} className="ml-0.5 hover:text-red-600">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex items-center gap-1.5">
              <Input
                type="number"
                value={newFormat}
                onChange={(e) => setNewFormat(e.target.value)}
                placeholder="Code"
                className="w-20 py-1 text-sm"
                onKeyDown={(e) => e.key === 'Enter' && addFormat()}
              />
              <Button variant="secondary" size="sm" onClick={addFormat} className="h-7 px-2">
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </FieldRow>

        <FieldRow label="Merchandise Segments" description="Segment codes included in OTB calculations">
          <div className="flex flex-col gap-2 items-end">
            <div className="flex flex-wrap gap-1.5">
              {segments.map((code) => (
                <Badge key={code} variant="secondary" className="gap-1">
                  {code}
                  <button type="button" onClick={() => removeSegment(code)} className="ml-0.5 hover:text-red-600">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex items-center gap-1.5">
              <Input
                type="number"
                value={newSegment}
                onChange={(e) => setNewSegment(e.target.value)}
                placeholder="Code"
                className="w-20 py-1 text-sm"
                onKeyDown={(e) => e.key === 'Enter' && addSegment()}
              />
              <Button variant="secondary" size="sm" onClick={addSegment} className="h-7 px-2">
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </FieldRow>
      </div>

      {/* Card 6: Period Names */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Period Names</h3>
        <p className="text-xs text-gray-500 mb-3">
          {planningFrequency === 'monthly' || planningFrequency === 'weekly'
            ? 'Maps each month index to a display name used in OTB plan naming (12 periods).'
            : planningFrequency === 'quarterly'
              ? 'Maps each quarter to a display name used in OTB plan naming (4 periods).'
              : planningFrequency === 'half-yearly'
                ? 'Maps each half-year to a display name used in OTB plan naming (2 periods).'
                : 'Maps the yearly period to a display name used in OTB plan naming (1 period).'}
        </p>

        <div className={cn(
          'grid gap-x-4 gap-y-2',
          Object.keys(hitNames).length <= 2 ? 'grid-cols-2' : Object.keys(hitNames).length <= 4 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6'
        )}>
          {Object.entries(hitNames).map(([key, value]) => (
            <div key={key} className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-5 text-right">{key}</span>
              <Input
                type="text"
                value={value}
                onChange={(e) => set('otb_hit_names', { ...hitNames, [key]: e.target.value })}
                className="w-16 py-1 text-sm text-center font-mono"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Card 7: KPI Exclusions */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">KPI Exclusions</h3>

        <div className="py-3 border-b border-gray-100">
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">Excluded KPIs</p>
              <p className="text-xs text-gray-500 mt-0.5">KPIs skipped during OTB calculation (e.g. change-over-LY metrics)</p>
            </div>
            <div className="flex-shrink-0">
              {excludeKpis.length === 0 && <span className="text-xs text-gray-400">None excluded</span>}
              {availableForExclude.length > 0 && (
                <Select value="" onValueChange={addExcludeKpi}>
                  <SelectTrigger size="sm" className="w-64 font-mono text-xs">
                    <SelectValue placeholder="Select KPI to exclude" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableForExclude.map((kpi) => (
                      <SelectItem key={kpi} value={kpi} className="font-mono text-xs">{kpi}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
          {excludeKpis.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {excludeKpis.map((kpi) => (
                <Badge key={kpi} variant="secondary" className="gap-1 font-mono text-[11px]">
                  {kpi}
                  <button type="button" onClick={() => removeExcludeKpi(kpi)} className="ml-0.5 hover:text-red-600">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="py-3 last:border-b-0">
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">Non-Negative KPIs</p>
              <p className="text-xs text-gray-500 mt-0.5">KPIs clamped to zero (negative values replaced with 0)</p>
            </div>
            <div className="flex-shrink-0">
              {nonNegativeKpis.length === 0 && <span className="text-xs text-gray-400">None configured</span>}
              {availableForNonNeg.length > 0 && (
                <Select value="" onValueChange={addNonNegKpi}>
                  <SelectTrigger size="sm" className="w-64 font-mono text-xs">
                    <SelectValue placeholder="Select KPI to add" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableForNonNeg.map((kpi) => (
                      <SelectItem key={kpi} value={kpi} className="font-mono text-xs">{kpi}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
          {nonNegativeKpis.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {nonNegativeKpis.map((kpi) => (
                <Badge key={kpi} variant="secondary" className="gap-1 font-mono text-[11px]">
                  {kpi}
                  <button type="button" onClick={() => removeNonNegKpi(kpi)} className="ml-0.5 hover:text-red-600">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      <SectionFooter onSave={handleSave} onReset={handleReset} isValid={!saving} />
    </div>
  );
}

// ─── Tab 11: KPI Formulae ───────────────────────────────────────────

// ─── Tab: Margin & Freight Cost ─────────────────────────────────────

interface MarginFreightEntry {
  format: string;
  segment: string;
  family: string;
  custom_duty_pct: number;
  freight_cost_per_unit: number;
  insurance_pct: number;
}

interface HierarchyOption {
  code: string;
  display_name: string;
}

const MF_PAGE_SIZE = 20;

function MarginFreightTab() {
  const { success: toastSuccess, error: toastError } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Saved entries from DB (paginated)
  const [savedEntries, setSavedEntries] = useState<MarginFreightEntry[]>([]);
  const [totalSaved, setTotalSaved] = useState(0);
  const [page, setPage] = useState(1);

  // Unsaved entries (local only, pending save)
  const [pendingEntries, setPendingEntries] = useState<MarginFreightEntry[]>([]);

  // Hierarchy options from API
  const [formatOptions, setFormatOptions] = useState<HierarchyOption[]>([]);
  const [segmentOptions, setSegmentOptions] = useState<HierarchyOption[]>([]);
  const [familyOptions, setFamilyOptions] = useState<HierarchyOption[]>([]);

  // Dropdown selections for new entry
  const [selectedFormat, setSelectedFormat] = useState('');
  const [selectedSegment, setSelectedSegment] = useState('');
  const [selectedFamily, setSelectedFamily] = useState('');

  // New entry fields
  const [customDuty, setCustomDuty] = useState(0);
  const [freightCost, setFreightCost] = useState(0);
  const [insurance, setInsurance] = useState(0);

  const fetchSavedEntries = useCallback(async (p: number) => {
    try {
      const res = await fetch(
        apiUrl(`/otb/admin/margin-freight?page=${p}&page_size=${MF_PAGE_SIZE}`),
        { headers: apiHeaders() },
      );
      const json = await res.json();
      if (json.data) {
        setSavedEntries(json.data.entries ?? []);
        setTotalSaved(json.data.total ?? 0);
      }
    } catch {
      toastError('Failed to load saved entries');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initial load: fetch saved entries + hierarchy options
  useEffect(() => {
    (async () => {
      try {
        const [, optionsRes] = await Promise.all([
          fetchSavedEntries(1),
          fetch(apiUrl('/otb/admin/hierarchy-options'), { headers: apiHeaders() }),
        ]);
        const optionsJson = await optionsRes.json();
        if (optionsJson.data) {
          setFormatOptions(optionsJson.data.formats ?? []);
          setSegmentOptions(optionsJson.data.segments ?? []);
          setFamilyOptions(optionsJson.data.families ?? []);
        }
      } catch {
        toastError('Failed to load margin & freight config');
      } finally {
        setLoading(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
    fetchSavedEntries(newPage);
  }, [fetchSavedEntries]);

  const totalPages = Math.ceil(totalSaved / MF_PAGE_SIZE);

  const canAdd = selectedFormat && selectedSegment && selectedFamily;

  const handleAdd = useCallback(() => {
    if (!canAdd) return;

    // Check duplicates in both saved and pending
    const allEntries = [...savedEntries, ...pendingEntries];
    const exists = allEntries.some(
      (e) => e.format === selectedFormat && e.segment === selectedSegment && e.family === selectedFamily,
    );
    if (exists) {
      toastError('This format + segment + family combination already exists');
      return;
    }

    setPendingEntries((prev) => [
      ...prev,
      {
        format: selectedFormat,
        segment: selectedSegment,
        family: selectedFamily,
        custom_duty_pct: customDuty,
        freight_cost_per_unit: freightCost,
        insurance_pct: insurance,
      },
    ]);

    setCustomDuty(0);
    setFreightCost(0);
    setInsurance(0);
  }, [canAdd, selectedFormat, selectedSegment, selectedFamily, customDuty, freightCost, insurance, savedEntries, pendingEntries, toastError]);

  const handleRemovePending = useCallback((idx: number) => {
    setPendingEntries((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  // Delete confirmation for saved entries
  const [deleteTarget, setDeleteTarget] = useState<MarginFreightEntry | null>(null);

  const confirmDeleteSaved = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(apiUrl('/otb/admin/margin-freight'), {
        method: 'DELETE',
        headers: apiHeaders(),
        body: JSON.stringify({
          format: deleteTarget.format,
          segment: deleteTarget.segment,
          family: deleteTarget.family,
        }),
      });
      const json = await res.json();
      if (json.status_code === 200) {
        toastSuccess('Entry deleted');
        fetchSavedEntries(page);
      } else {
        toastError(json.message || 'Failed to delete');
      }
    } catch {
      toastError('Failed to delete entry');
    } finally {
      setDeleteTarget(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deleteTarget, page, fetchSavedEntries]);

  const handleSave = useCallback(async () => {
    if (pendingEntries.length === 0) {
      toastError('No new entries to save');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(apiUrl('/otb/admin/margin-freight'), {
        method: 'POST',
        headers: apiHeaders(),
        body: JSON.stringify({ entries: pendingEntries, updated_by: 'admin' }),
      });
      const json = await res.json();
      if (json.status_code === 200) {
        toastSuccess(json.message || 'Entries saved');
        setPendingEntries([]);
        fetchSavedEntries(1);
        setPage(1);
      } else {
        toastError(json.message || 'Failed to save');
      }
    } catch {
      toastError('Failed to save entries');
    } finally {
      setSaving(false);
    }
  }, [pendingEntries, toastSuccess, toastError, fetchSavedEntries]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-gray-500">
        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading margin & freight config...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add new entry */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Add Margin & Freight Entry</h3>

        {/* Dropdowns row */}
        {/* eslint-disable-next-line design-system/prefer-metric-grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div>
            <span className="text-xs font-medium text-gray-500 mb-1 block">Format *</span>
            <Select value={selectedFormat} onValueChange={setSelectedFormat}>
              <SelectTrigger size="sm">
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                {formatOptions.map((opt) => (
                  <SelectItem key={opt.code} value={opt.display_name}>{opt.display_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <span className="text-xs font-medium text-gray-500 mb-1 block">Segment *</span>
            <Select value={selectedSegment} onValueChange={setSelectedSegment}>
              <SelectTrigger size="sm">
                <SelectValue placeholder="Select segment" />
              </SelectTrigger>
              <SelectContent>
                {segmentOptions.map((opt) => (
                  <SelectItem key={opt.code} value={opt.display_name}>{opt.display_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <span className="text-xs font-medium text-gray-500 mb-1 block">Family *</span>
            <Select value={selectedFamily} onValueChange={setSelectedFamily}>
              <SelectTrigger size="sm">
                <SelectValue placeholder="Select family" />
              </SelectTrigger>
              <SelectContent>
                {familyOptions.map((opt) => (
                  <SelectItem key={opt.code} value={opt.display_name}>{opt.display_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Cost fields row */}
        {/* eslint-disable-next-line design-system/prefer-metric-grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div>
            <span className="text-xs font-medium text-gray-500 mb-1 block">Custom Duty</span>
            <div className="flex items-center gap-1.5">
              <Input
                type="number"
                value={customDuty}
                onChange={(e) => setCustomDuty(Number(e.target.value))}
                min={0}
                max={100}
                step={0.1}
                className="w-full text-right py-1.5 text-sm"
              />
              <span className="text-sm text-gray-500">%</span>
            </div>
          </div>
          <div>
            <span className="text-xs font-medium text-gray-500 mb-1 block">Freight Cost</span>
            <div className="flex items-center gap-1.5">
              <span className="text-sm text-gray-500">&#8377;</span>
              <Input
                type="number"
                value={freightCost}
                onChange={(e) => setFreightCost(Number(e.target.value))}
                min={0}
                step={0.01}
                className="w-full text-right py-1.5 text-sm"
              />
              <span className="text-xs text-gray-400">/unit</span>
            </div>
          </div>
          <div>
            <span className="text-xs font-medium text-gray-500 mb-1 block">Insurance</span>
            <div className="flex items-center gap-1.5">
              <Input
                type="number"
                value={insurance}
                onChange={(e) => setInsurance(Number(e.target.value))}
                min={0}
                max={100}
                step={0.1}
                className="w-full text-right py-1.5 text-sm"
              />
              <span className="text-sm text-gray-500">%</span>
            </div>
          </div>
        </div>

        <Button onClick={handleAdd} disabled={!canAdd} size="sm">
          <Plus className="w-4 h-4 mr-1.5" />
          Add Entry
        </Button>
      </div>

      {/* Pending (unsaved) entries */}
      {pendingEntries.length > 0 && (
        <div className="bg-white rounded-lg border border-amber-300 overflow-hidden">
          <div className="px-4 py-3 border-b border-amber-200 bg-amber-50">
            <h3 className="text-sm font-semibold text-amber-900">
              Unsaved Entries
              <Badge variant="secondary" className="ml-2 text-xs">{pendingEntries.length}</Badge>
            </h3>
          </div>
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-2">Format</th>
                <th className="px-4 py-2">Segment</th>
                <th className="px-4 py-2">Family</th>
                <th className="px-4 py-2 text-right">Custom Duty %</th>
                <th className="px-4 py-2 text-right">Freight Cost /unit</th>
                <th className="px-4 py-2 text-right">Insurance %</th>
                <th className="px-4 py-2 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pendingEntries.map((entry, idx) => (
                <tr key={`pending-${entry.format}-${entry.segment}-${entry.family}`} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-gray-900">{entry.format}</td>
                  <td className="px-4 py-2 text-gray-900">{entry.segment}</td>
                  <td className="px-4 py-2 text-gray-900">{entry.family}</td>
                  <td className="px-4 py-2 text-right text-gray-700">{entry.custom_duty_pct}%</td>
                  <td className="px-4 py-2 text-right text-gray-700">&#8377;{entry.freight_cost_per_unit}</td>
                  <td className="px-4 py-2 text-right text-gray-700">{entry.insurance_pct}%</td>
                  <td className="px-4 py-2">
                    <button
                      type="button"
                      onClick={() => handleRemovePending(idx)}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      title="Remove entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          <div className="px-4 py-3 border-t border-amber-200 bg-amber-50">
            <Button onClick={handleSave} disabled={saving} size="sm">
              {saving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Save className="w-4 h-4 mr-1.5" />}
              Save {pendingEntries.length} {pendingEntries.length === 1 ? 'Entry' : 'Entries'}
            </Button>
          </div>
        </div>
      )}

      {/* Saved entries table */}
      {savedEntries.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">
              Saved Entries
              <Badge variant="secondary" className="ml-2 text-xs">{totalSaved}</Badge>
            </h3>
          </div>
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-2">Format</th>
                <th className="px-4 py-2">Segment</th>
                <th className="px-4 py-2">Family</th>
                <th className="px-4 py-2 text-right">Custom Duty %</th>
                <th className="px-4 py-2 text-right">Freight Cost /unit</th>
                <th className="px-4 py-2 text-right">Insurance %</th>
                <th className="px-4 py-2 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {savedEntries.map((entry) => (
                <tr key={`${entry.format}-${entry.segment}-${entry.family}`} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-gray-900">{entry.format}</td>
                  <td className="px-4 py-2 text-gray-900">{entry.segment}</td>
                  <td className="px-4 py-2 text-gray-900">{entry.family}</td>
                  <td className="px-4 py-2 text-right text-gray-700">{entry.custom_duty_pct}%</td>
                  <td className="px-4 py-2 text-right text-gray-700">&#8377;{entry.freight_cost_per_unit}</td>
                  <td className="px-4 py-2 text-right text-gray-700">{entry.insurance_pct}%</td>
                  <td className="px-4 py-2">
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(entry)}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      title="Delete entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          {/* Pagination */}
          {totalPages > 1 && (
            // eslint-disable-next-line design-system/prefer-section-header
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <span className="text-xs text-gray-500">
                Page {page} of {totalPages} ({totalSaved} total)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => handlePageChange(page - 1)}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= totalPages}
                  onClick={() => handlePageChange(page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {savedEntries.length === 0 && pendingEntries.length === 0 && (
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 text-center text-sm text-gray-500">
          No margin & freight entries configured. Use the form above to add entries.
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Delete Entry"
        description={deleteTarget ? `Are you sure you want to delete the entry for ${deleteTarget.format} / ${deleteTarget.segment} / ${deleteTarget.family}? This action cannot be undone.` : ''}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={confirmDeleteSaved}
      />
    </div>
  );
}

// ─── Tab: KPI Formulae ─────────────────────────────────────────────

const KPI_CATEGORIES = ['Net Revenue', 'Pricing', 'Unit Revenue', 'Discount', 'Inventory', 'Inwards', 'OTB', 'Weeks of Cover', 'Margin', 'COGS', 'Inventory COGS'] as const;

function KPIFormulaeTab() {
  const { config, loading, error } = useANRAdminStore();
  const fetchConfig = useANRAdminStore((s) => s.fetch);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchConfig('otb_kpi_formulae'); }, []);

  const c = config?.constants;
  const formulae = useMemo(() => (c?.otb_kpi_formulae ?? []) as OTBKPIFormula[], [c?.otb_kpi_formulae]);

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(KPI_CATEGORIES));

  const grouped = useMemo(() => {
    const map = new Map<string, OTBKPIFormula[]>();
    for (const cat of KPI_CATEGORIES) map.set(cat, []);
    for (const f of formulae) {
      const list = map.get(f.category) ?? [];
      list.push(f);
      map.set(f.category, list);
    }
    return map;
  }, [formulae]);

  const toggleCategory = useCallback((cat: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-gray-500">
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        Loading KPI formulae...
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-3 py-2.5 bg-red-50 rounded-lg text-sm text-red-700">
        Failed to load KPI formulae: {error}
      </div>
    );
  }

  if (!c) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 px-3 py-2.5 bg-blue-50 rounded-lg text-sm text-blue-700">
        <FlaskConical className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <span>KPI formulae are evaluated sequentially (top to bottom). Each formula can reference raw data columns, previously computed KPIs, prev_otb (carry-forward), and helper functions (SUM, AVG, MAX, MIN, ROUND).</span>
      </div>

      {Array.from(grouped.entries()).map(([category, kpis]) => {
        if (kpis.length === 0) return null;
        const isExpanded = expandedCategories.has(category);

        return (
          <div key={category} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div
              role="button"
              tabIndex={0}
              onClick={() => toggleCategory(category)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleCategory(category); }}
              className="w-full flex items-center justify-between gap-2 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                <span className="text-sm font-semibold text-gray-900">{category}</span>
                <Badge variant="secondary" className="text-xs">{kpis.length}</Badge>
              </div>
            </div>

            {isExpanded && (
              <div className="border-t border-gray-100">
                {kpis.map((kpi) => (
                  <div key={kpi.kpiName} className="px-4 py-2.5 border-b border-gray-50 last:border-b-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-400 w-5">{kpi.evaluationOrder}</span>
                      <p className="text-sm font-medium text-gray-900 font-mono">{kpi.kpiName}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 ml-7">{kpi.description}</p>
                    <p className="mt-1 ml-7 text-xs font-mono text-gray-600 bg-gray-50 px-2 py-1 rounded border border-gray-100 text-left break-all whitespace-normal">
                      {kpi.formula}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

    </div>
  );
}

// ─── Main Page Component ────────────────────────────────────────────

export function AdminOTBConfigPage() {
  // Channel-led orgs (e.g. Superdry) are driven by the calculator-owned
  // `otb_configuration` table rather than the ANR workflow constants that back
  // the store-led tabs below, so they get their own read-only view.
  const rawOtbConfig = useModuleConfig<Record<string, unknown>>('otb');
  const otbConfig = useMemo(() => parseOtbConfig(rawOtbConfig), [rawOtbConfig]);
  const isChannelLed = otbConfig.breakdown_type === 'channel';

  if (isChannelLed) {
    return <SuperdryOTBConfig />;
  }

  return (
    <div className="space-y-4">
      <PageHeader title="OTB Configuration" />

      {/* Tabs */}
      <Tabs defaultValue="budget-structure">
        <TabsList variant="underline">
          <TabsTrigger value="budget-structure" variant="underline">Budget Structure</TabsTrigger>
          {/* BACKLOG #29: Re-enable these tabs once backend OTB inventory config APIs are ready
          <TabsTrigger value="sourcing-engines" variant="underline">Sourcing Engines</TabsTrigger>
          <TabsTrigger value="guardrails" variant="underline">Guardrails</TabsTrigger>
          <TabsTrigger value="utilization" variant="underline">Utilization</TabsTrigger>
          <TabsTrigger value="chase" variant="underline">Chase</TabsTrigger>
          <TabsTrigger value="reconciliation" variant="underline">Reconciliation</TabsTrigger>
          <TabsTrigger value="margin-bridge" variant="underline">Margin Bridge</TabsTrigger>
          <TabsTrigger value="sell-through" variant="underline">Sell-Through</TabsTrigger>
          */}
          {/* BACKLOG #29: Re-enable Procurement tab once backend APIs are ready
          <TabsTrigger value="procurement" variant="underline">Procurement</TabsTrigger>
          */}
          <TabsTrigger value="planning-setup" variant="underline">Planning</TabsTrigger>
          <TabsTrigger value="kpi-formulae" variant="underline">KPI Formulae</TabsTrigger>
          <TabsTrigger value="margin-freight" variant="underline">Margin & Freight Cost</TabsTrigger>
        </TabsList>

        <TabsContent value="budget-structure">
          <BudgetStructureTab />
        </TabsContent>

        {/* BACKLOG #29: Re-enable these tab contents once backend OTB inventory config APIs are ready
        <TabsContent value="sourcing-engines">
          <SourcingEnginesTab />
        </TabsContent>

        <TabsContent value="guardrails">
          <GuardrailsTab />
        </TabsContent>
        <TabsContent value="utilization">
          <UtilizationTab />
        </TabsContent>

        <TabsContent value="chase">
          <ChaseTriggersTab />
        </TabsContent>

        <TabsContent value="reconciliation">
          <ReconciliationSettingsTab />
        </TabsContent>

        <TabsContent value="margin-bridge">
          <MarginBridgeTab />
        </TabsContent>

        <TabsContent value="sell-through">
          <SellThroughRulesTab />
        </TabsContent>
        */}

        {/* BACKLOG #29: Re-enable Procurement tab content once backend APIs are ready
        <TabsContent value="procurement">
          <ProcurementControlsTab />
        </TabsContent>
        */}

        <TabsContent value="planning-setup">
          <PlanningSetupTab />
        </TabsContent>

        <TabsContent value="kpi-formulae">
          <KPIFormulaeTab />
        </TabsContent>

        <TabsContent value="margin-freight">
          <MarginFreightTab />
        </TabsContent>

      </Tabs>
    </div>
  );
}
