import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  PageHeader,
  Button,
  EmptyState,
  SectionHeader,
  ConfirmDialog,
  Input,
} from '@/components/ui';
import { ArrowLeft, Calculator, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCycles, useInputs, useAddChannel, useUpdateGrowthFactor } from '../api/salesPlanHooks';
import { salesPlanApi } from '../api/salesPlanApi';
import { CycleStatusBadge } from '../components/CycleStatusBadge';
import { AddChannelDialog } from '../components/AddChannelDialog';
import { AopSubNav } from '../components/AopSubNav';
import { SalesPlanInsights } from '../components/SalesPlanInsights';
import { PLAN_MONTHS, CHANNELS } from '../data/mockChannels';
import {
  SEASONALITY_WEIGHTS,
  LY_MONTHLY_SALES_RATIO,
  computeBlendedSeasonality,
} from '../data/mockGuardrails';
import type { ChannelId } from '../types/aopPlanning.types';
import type { InputsResponse } from '../api/salesPlanApi';

interface ChannelTarget {
  channelId: ChannelId;
  label: string;
  netSalesTarget: number;
  gmPctTarget: number;
  growthPctTarget: number;
  pyActual: number;
  discountPct: number;
  lcMrpMultiple: number;
  hasOTB: boolean;
}

// Seed values for the derived-price columns. Discount phases GSV back up to MRP
// (MRP = GSV / (1 - discount)); the LC:MRP multiple divides MRP down to Landed
// Cost (LC = MRP / multiple). Both are editable per channel.
const DEFAULT_DISCOUNT_PCT = 20;
const DEFAULT_LC_MRP_MULTIPLE = 5;

/** MRP = GSV / (1 - discount). Guards discount >= 100% (undefined MRP). */
function computeMrp(gsv: number, discountPct: number): number {
  const d = discountPct / 100;
  return d < 1 ? gsv / (1 - d) : 0;
}

/** Landed Cost = MRP / (LC:MRP multiple). Guards a zero/negative multiple. */
function computeLandedCost(mrp: number, multiple: number): number {
  return multiple > 0 ? mrp / multiple : 0;
}

const INITIAL_TARGETS: ChannelTarget[] = [
  { channelId: 'EBO', label: 'EBO', netSalesTarget: 26, gmPctTarget: 12.5, growthPctTarget: 7.0, pyActual: 24.3, discountPct: DEFAULT_DISCOUNT_PCT, lcMrpMultiple: DEFAULT_LC_MRP_MULTIPLE, hasOTB: true },
  { channelId: 'SIS', label: 'SIS', netSalesTarget: 19, gmPctTarget: 13.0, growthPctTarget: 6.0, pyActual: 17.9, discountPct: DEFAULT_DISCOUNT_PCT, lcMrpMultiple: DEFAULT_LC_MRP_MULTIPLE, hasOTB: true },
  { channelId: 'MBO', label: 'MBO', netSalesTarget: 6.5, gmPctTarget: 10.2, growthPctTarget: 4.5, pyActual: 6.2, discountPct: DEFAULT_DISCOUNT_PCT, lcMrpMultiple: DEFAULT_LC_MRP_MULTIPLE, hasOTB: true },
  { channelId: 'AJIO', label: 'AJIO', netSalesTarget: 15, gmPctTarget: 18.0, growthPctTarget: 25.0, pyActual: 12.0, discountPct: DEFAULT_DISCOUNT_PCT, lcMrpMultiple: DEFAULT_LC_MRP_MULTIPLE, hasOTB: true },
  { channelId: 'DISTRIBUTION', label: 'Distribution', netSalesTarget: 22, gmPctTarget: 8.2, growthPctTarget: 5.0, pyActual: 20.9, discountPct: DEFAULT_DISCOUNT_PCT, lcMrpMultiple: DEFAULT_LC_MRP_MULTIPLE, hasOTB: true },
];

const CHANNEL_LABELS: Record<string, string> = Object.fromEntries(
  CHANNELS.map((c) => [c.id, c.label]),
);

// Prefilled reason recorded when the seasonality index is auto-populated from the
// LY blend, so the (reason-gated) Generate flow can persist it without friction.
const AUTO_SEASONALITY_REASON =
  'Auto-populated: 50% last-year month-wise sales ratio + 50% seasonality index.';

/** Pull the seasonality index out of an inputs payload, defaulting when absent. */
function baseIndexFromInputs(data: InputsResponse): number[] {
  if (data.seasonality.length === 0) return [...SEASONALITY_WEIGHTS];
  const byMonth = new Map(data.seasonality.map((s) => [s.monthId, s.weightPct]));
  return PLAN_MONTHS.map((m) => byMonth.get(m.id) ?? 0);
}

export function ChannelTargetsPage(): React.ReactNode {
  const { cycleId } = useParams<{ cycleId: string }>();
  const navigate = useNavigate();
  const { data: cyclesData } = useCycles();
  const { data: inputs } = useInputs(cycleId);
  const addChannel = useAddChannel(cycleId ?? '');
  const updateGrowthFactor = useUpdateGrowthFactor(cycleId ?? '');

  const cycle = cyclesData?.cycles.find((c) => c.id === cycleId);

  const [targets, setTargets] = useState<ChannelTarget[]>(INITIAL_TARGETS);
  // Baseline of persisted channel targets, so Generate only re-saves channels the user
  // actually edited (re-saving a channel marks it overridden and freezes it from the
  // top-down growth factor).
  const [baselineTargets, setBaselineTargets] = useState<Record<string, { net: number; gm: number }>>({});
  const [seasonWeights, setSeasonWeights] = useState<number[]>([...SEASONALITY_WEIGHTS]);
  // Baseline captured on hydrate so we can tell when a seasonality value actually changed.
  const [baselineSeasonWeights, setBaselineSeasonWeights] = useState<number[]>([...SEASONALITY_WEIGHTS]);
  // The seasonality index (base) used as the 50% index term of the LY blend. Kept
  // separate from the editable weights so repeated auto-populate never drifts.
  const [seasonalityIndexBase, setSeasonalityIndexBase] = useState<number[]>([...SEASONALITY_WEIGHTS]);
  const [seasonalityReason, setSeasonalityReason] = useState('');
  // Top-down growth factor (%); default 10%. Applied as target = PY x (1 + growth).
  const [growthFactor, setGrowthFactor] = useState<number>(10);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [addChannelOpen, setAddChannelOpen] = useState(false);

  // Hydrate the editable form from an inputs payload (used on load AND directly from
  // mutation responses so edits reflect immediately without depending on a refetch).
  const hydrateForm = useCallback((data: InputsResponse) => {
    setGrowthFactor(data.growthFactorPct);
    setTargets(
      data.channelTargets.map((t) => ({
        channelId: t.channelId as ChannelId,
        label: CHANNEL_LABELS[t.channelId] ?? t.channelId,
        netSalesTarget: t.netSalesTarget,
        gmPctTarget: t.gmPctTarget,
        growthPctTarget: t.growthPct,
        pyActual: t.pyActual,
        discountPct: DEFAULT_DISCOUNT_PCT,
        lcMrpMultiple: DEFAULT_LC_MRP_MULTIPLE,
        hasOTB: true,
      })),
    );
    setBaselineTargets(
      Object.fromEntries(
        data.channelTargets.map((t) => [t.channelId, { net: t.netSalesTarget, gm: t.gmPctTarget }]),
      ),
    );
    if (data.seasonality.length > 0) {
      const next = baseIndexFromInputs(data);
      setSeasonWeights(next);
      setBaselineSeasonWeights(next);
      setSeasonalityIndexBase(next);
    }
  }, []);

  // Auto-populate the seasonality index from last year's data using the confirmed
  // 50/50 blend, normalised to 100%. Prefills the change reason so the result can
  // be persisted on Generate; the weights stay fully editable afterwards.
  const autoPopulateSeasonality = useCallback((indexBase: number[]) => {
    setSeasonWeights(computeBlendedSeasonality(LY_MONTHLY_SALES_RATIO, indexBase));
    setSeasonalityReason((prev) => (prev.trim() ? prev : AUTO_SEASONALITY_REASON));
  }, []);

  useEffect(() => {
    if (inputs) hydrateForm(inputs);
  }, [inputs, hydrateForm]);

  const totalNetSales = useMemo(() => targets.reduce((s, t) => s + t.netSalesTarget, 0), [targets]);
  const totalPY = useMemo(() => targets.reduce((s, t) => s + t.pyActual, 0), [targets]);
  const totalGrowth = totalPY > 0 ? ((totalNetSales - totalPY) / totalPY) * 100 : 0;
  const totalMrp = useMemo(
    () => targets.reduce((s, t) => s + computeMrp(t.netSalesTarget, t.discountPct), 0),
    [targets],
  );
  const totalLandedCost = useMemo(
    () =>
      targets.reduce(
        (s, t) => s + computeLandedCost(computeMrp(t.netSalesTarget, t.discountPct), t.lcMrpMultiple),
        0,
      ),
    [targets],
  );

  const seasonTotal = seasonWeights.reduce((s, w) => s + w, 0);
  const seasonValid = seasonTotal >= 99 && seasonTotal <= 101;
  const seasonalityDirty = useMemo(
    () => seasonWeights.some((w, i) => w !== (baselineSeasonWeights[i] ?? 0)),
    [seasonWeights, baselineSeasonWeights],
  );
  const seasonalityReasonMissing = seasonalityDirty && seasonalityReason.trim().length === 0;

  if (!cycle) {
    return <EmptyState title="Cycle not found" description="The requested planning cycle does not exist." />;
  }

  function updateTarget(channelId: ChannelId, field: keyof ChannelTarget, value: number): void {
    setTargets((prev) =>
      prev.map((t) => {
        if (t.channelId !== channelId) return t;
        const updated = { ...t, [field]: value };
        if (field === 'netSalesTarget' && t.pyActual > 0) {
          updated.growthPctTarget = Math.round(((value - t.pyActual) / t.pyActual) * 100 * 10) / 10;
        }
        if (field === 'growthPctTarget') {
          updated.netSalesTarget = Math.round(t.pyActual * (1 + value / 100) * 10) / 10;
        }
        return updated;
      }),
    );
  }

  function handleApplyGrowthFactor(): void {
    if (!cycleId) return;
    updateGrowthFactor.mutate(growthFactor, {
      // Re-hydrate the form directly from the response so the table updates instantly,
      // independent of query-cache refetch timing.
      onSuccess: (data) => {
        hydrateForm(data);
        // Applying a growth % re-seeds the seasonality index from last year's data
        // (50% LY sales ratio + 50% seasonality index). Uses the base from the
        // fresh response so it stays independent of any in-flight state update.
        autoPopulateSeasonality(baseIndexFromInputs(data));
      },
      onError: (e: unknown) =>
        window.alert(e instanceof Error ? e.message : 'Failed to apply growth factor'),
    });
  }

  function updateSeasonWeight(index: number, value: number): void {
    setSeasonWeights((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  async function handleGenerate(): Promise<void> {
    if (!cycleId) return;
    // A reason/comment is mandatory before persisting a changed seasonality index.
    if (seasonalityReasonMissing) {
      window.alert('Please provide a reason for changing the seasonality index before generating.');
      return;
    }
    setGenerating(true);
    try {
      // Persist only channels the user actually edited (a save marks the channel as
      // overridden, freezing it from the top-down growth factor), then redistribute.
      for (const t of targets) {
        const base = baselineTargets[t.channelId];
        const changed =
          !base || t.netSalesTarget !== base.net || t.gmPctTarget !== base.gm;
        if (!changed) continue;
        await salesPlanApi.updateChannelTarget(cycleId, t.channelId, {
          netSalesTarget: t.netSalesTarget,
          gmPctTarget: t.gmPctTarget,
        });
      }
      // Only push seasonality when a value actually changed (backend requires a reason).
      if (seasonalityDirty) {
        await salesPlanApi.updateSeasonality(
          cycleId,
          PLAN_MONTHS.map((m, i) => ({ monthId: m.id, weightPct: seasonWeights[i] ?? 0 })),
          seasonalityReason.trim(),
        );
        setBaselineSeasonWeights([...seasonWeights]);
        setSeasonalityReason('');
      }
      await salesPlanApi.generate(cycleId);
      navigate(`/sales-plan/workspace/${cycleId}`);
    } catch (e) {
      window.alert(e instanceof Error ? e.message : 'Generate failed');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Planning Inputs"
        actions={
          <div className="flex items-center gap-2">
            <CycleStatusBadge status={cycle.status} />
            <Button variant="outline" size="sm" onClick={() => navigate('/sales-plan')}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Listing
            </Button>
          </div>
        }
      />

      <AopSubNav />

      {/* Enterprise Summary */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        {/* eslint-disable-next-line design-system/prefer-metric-grid -- inline summary strip inside input form, not a page-level KPI section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-500">GSV</p>
            <p className="text-lg font-bold text-gray-900">₹{totalNetSales.toFixed(2)} Cr</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Net Sales Target</p>
            <p className="text-lg font-bold text-gray-900">₹{(inputs?.netSalesTotal ?? 0).toFixed(2)} Cr</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">PY Actual</p>
            <p className="text-lg font-bold text-gray-500">₹{totalPY.toFixed(2)} Cr</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Growth</p>
            <p className={cn('text-lg font-bold', totalGrowth >= 0 ? 'text-green-700' : 'text-red-700')}>
              {totalGrowth >= 0 ? '+' : ''}{totalGrowth.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* AI Insights */}
      <SalesPlanInsights cycleId={cycleId} />

      {/* Top-Down Growth Factor */}
      <div>
        <SectionHeader title="Top-Down Growth Factor" />
        <p className="text-xs text-gray-500 mt-1 mb-3">
          Applied over each channel&rsquo;s prior-year actual to seed its target
          (target = PY &times; (1 + growth)). Channels you edit manually keep their override.
        </p>
        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
          <Input
            label="Growth %"
            type="number"
            step="0.5"
            value={growthFactor}
            onChange={(e) => setGrowthFactor(parseFloat(e.target.value) || 0)}
            containerClassName="w-full sm:w-40"
          />
          <Button
            variant="outline"
            onClick={handleApplyGrowthFactor}
            disabled={updateGrowthFactor.isPending}
            className="min-h-[44px] md:min-h-0"
          >
            {updateGrowthFactor.isPending ? 'Applying…' : 'Apply Growth Factor'}
          </Button>
        </div>
      </div>

      {/* Channel Targets Table */}
      <div>
        <SectionHeader
          title="Channel Targets"
          actions={
            <Button variant="outline" size="sm" onClick={() => setAddChannelOpen(true)}>
              <Plus className="w-4 h-4" />
              Add Channel
            </Button>
          }
        />
        <p className="text-xs text-gray-500 mt-1 mb-1">
          Set the annual GSV target for each channel. Editing GSV auto-calculates Growth; editing Growth auto-calculates GSV.
        </p>
        <p className="text-xs text-gray-500 mb-3">
          <span className="font-medium text-gray-700">MRP</span> = GSV &divide; (1 &minus; Discount) &nbsp;&bull;&nbsp;
          <span className="font-medium text-gray-700">Landed Cost</span> = MRP &divide; (LC:MRP multiple).
          e.g. GSV ₹100 at 20% &rarr; MRP ₹125; at an LC:MRP of 5 &rarr; Landed Cost ₹25.
        </p>
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[760px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Channel</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">PY Actual (₹ Cr)</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">Discount %</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">GSV (₹ Cr)</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">MRP (₹ Cr)</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">Growth %</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">LC:MRP</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">Landed Cost (₹ Cr)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {targets.map((t) => {
                  const mrp = computeMrp(t.netSalesTarget, t.discountPct);
                  const landedCost = computeLandedCost(mrp, t.lcMrpMultiple);
                  return (
                    <tr key={t.channelId} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-semibold text-gray-900">{t.label}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-gray-500">₹{t.pyActual.toFixed(1)}</td>
                      <td className="px-4 py-3 text-right">
                        {/* eslint-disable-next-line no-restricted-syntax -- inline table cell editor */}
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="100"
                          value={t.discountPct}
                          onChange={(e) => updateTarget(t.channelId, 'discountPct', parseFloat(e.target.value) || 0)}
                          className="w-16 text-right text-sm border border-gray-200 rounded px-2 py-1 tabular-nums focus:ring-1 focus:ring-primary focus:border-primary"
                          aria-label={`${t.label} discount percent`}
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        {/* eslint-disable-next-line no-restricted-syntax -- inline table cell editor */}
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={t.netSalesTarget}
                          onChange={(e) => updateTarget(t.channelId, 'netSalesTarget', parseFloat(e.target.value) || 0)}
                          className="w-20 text-right text-sm border border-gray-200 rounded px-2 py-1 tabular-nums focus:ring-1 focus:ring-primary focus:border-primary"
                          aria-label={`${t.label} GSV`}
                        />
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-gray-500">₹{mrp.toFixed(1)}</td>
                      <td className="px-4 py-3 text-right">
                        {/* eslint-disable-next-line no-restricted-syntax -- inline table cell editor */}
                        <input
                          type="number"
                          step="0.5"
                          value={t.growthPctTarget}
                          onChange={(e) => updateTarget(t.channelId, 'growthPctTarget', parseFloat(e.target.value) || 0)}
                          className={cn(
                            'w-16 text-right text-sm border border-gray-200 rounded px-2 py-1 tabular-nums focus:ring-1 focus:ring-primary focus:border-primary',
                            t.growthPctTarget > 7 && 'text-amber-700',
                            t.growthPctTarget < 0 && 'text-red-700',
                          )}
                          aria-label={`${t.label} growth target`}
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        {/* eslint-disable-next-line no-restricted-syntax -- inline table cell editor */}
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={t.lcMrpMultiple}
                          onChange={(e) => updateTarget(t.channelId, 'lcMrpMultiple', parseFloat(e.target.value) || 0)}
                          className="w-16 text-right text-sm border border-gray-200 rounded px-2 py-1 tabular-nums focus:ring-1 focus:ring-primary focus:border-primary"
                          aria-label={`${t.label} LC to MRP multiple`}
                        />
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-gray-500">₹{landedCost.toFixed(1)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-200 bg-gray-50">
                  <td className="px-4 py-3 font-bold text-gray-900">Total</td>
                  <td className="px-4 py-3 text-right tabular-nums font-bold text-gray-500">₹{totalPY.toFixed(1)}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-bold text-gray-400">&mdash;</td>
                  <td className="px-4 py-3 text-right tabular-nums font-bold text-gray-900">₹{totalNetSales.toFixed(1)}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-bold text-gray-500">₹{totalMrp.toFixed(1)}</td>
                  <td className={cn('px-4 py-3 text-right tabular-nums font-bold', totalGrowth >= 0 ? 'text-green-700' : 'text-red-700')}>
                    {totalGrowth >= 0 ? '+' : ''}{totalGrowth.toFixed(1)}%
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-bold text-gray-400">&mdash;</td>
                  <td className="px-4 py-3 text-right tabular-nums font-bold text-gray-500">₹{totalLandedCost.toFixed(1)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {/* Seasonality Weights */}
      <div>
        <SectionHeader
          title="Seasonality Index"
          actions={
            <Button
              variant="outline"
              size="sm"
              onClick={() => autoPopulateSeasonality(seasonalityIndexBase)}
            >
              Auto-populate from last year
            </Button>
          }
        />
        <p className="text-xs text-gray-500 mt-1 mb-3">
          Monthly weights that phase the annual target across the financial year. Must sum to 100%.
          Applying a growth&nbsp;% (or the button above) auto-populates these from last year&rsquo;s data &mdash;
          <span className="font-medium text-gray-700"> 50% last-year month-wise sales ratio + 50% seasonality index</span> &mdash;
          normalised to 100% and fully editable afterwards.
        </p>
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {PLAN_MONTHS.map((m) => (
                    <th key={m.id} className="px-2 py-2 text-center font-medium text-gray-500 min-w-[60px]">
                      {m.shortLabel}
                    </th>
                  ))}
                  <th className="px-3 py-2 text-center font-medium text-gray-500 min-w-[70px]">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  {PLAN_MONTHS.map((m, i) => (
                    <td key={m.id} className="px-1 py-2 text-center">
                      {/* eslint-disable-next-line no-restricted-syntax -- inline seasonality weight editor */}
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="30"
                        value={seasonWeights[i]}
                        onChange={(e) => updateSeasonWeight(i, parseFloat(e.target.value) || 0)}
                        className="w-12 text-center text-sm border border-gray-200 rounded px-1 py-1 tabular-nums focus:ring-1 focus:ring-primary focus:border-primary"
                        aria-label={`${m.shortLabel} weight`}
                      />
                    </td>
                  ))}
                  <td className="px-3 py-2 text-center">
                    <span className={cn(
                      'font-bold tabular-nums',
                      seasonValid ? 'text-green-700' : 'text-red-700',
                    )}>
                      {seasonTotal.toFixed(2)}%
                    </span>
                  </td>
                </tr>
                {/* Visual bars */}
                <tr>
                  {PLAN_MONTHS.map((m, i) => {
                    const weight = seasonWeights[i] ?? 0;
                    const maxWeight = Math.max(...seasonWeights);
                    const heightPct = maxWeight > 0 ? (weight / maxWeight) * 100 : 0;
                    return (
                      <td key={m.id} className="px-1 pb-2 text-center">
                        <div className="mx-auto w-6 h-10 flex items-end justify-center">
                          <div
                            className={cn('w-full rounded-sm', weight >= 10 ? 'bg-gray-700' : 'bg-gray-400')}
                            // eslint-disable-next-line no-restricted-syntax -- dynamic bar height
                            style={{ height: `${Math.max(heightPct, 4)}%` }}
                          />
                        </div>
                      </td>
                    );
                  })}
                  <td />
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        {!seasonValid && (
          <p className="text-xs text-red-600 mt-2">Weights must sum to 100%. Currently at {seasonTotal.toFixed(2)}%.</p>
        )}
        {seasonalityDirty && (
          <Input
            label="Reason for changing seasonality index"
            hint="A reason is required before a changed seasonality index can be saved."
            placeholder="e.g. Shifted festive weight to Nov per revised retail calendar"
            value={seasonalityReason}
            onChange={(e) => setSeasonalityReason(e.target.value)}
            error={seasonalityReasonMissing ? 'This field is required.' : undefined}
            containerClassName="mt-3 md:max-w-md"
          />
        )}
      </div>

      {/* Action Bar */}
      {/* eslint-disable-next-line design-system/prefer-section-header -- action bar with back + generate, not a section header */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <Button variant="outline" onClick={() => navigate('/sales-plan')}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Listing
        </Button>
        <div className="flex items-center gap-3">
          <p className="text-xs text-gray-500">
            Targets will distribute across stores using existing store mix and seasonality weights.
          </p>
          <Button onClick={() => setConfirmOpen(true)} disabled={!seasonValid || seasonalityReasonMissing || generating}>
            <Calculator className="w-4 h-4 mr-1" />
            {generating ? 'Generating…' : 'Generate Plan'}
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Generate AOP Plan"
        description={`This will distribute ₹${totalNetSales.toFixed(1)} Cr across all stores using the channel targets and seasonality weights. You can edit individual store values after generation.`}
        confirmLabel="Generate"
        onConfirm={() => {
          void handleGenerate();
        }}
      />

      <AddChannelDialog
        isOpen={addChannelOpen}
        onClose={() => setAddChannelOpen(false)}
        existingChannels={targets.map((t) => t.channelId)}
        isSaving={addChannel.isPending}
        onAdd={(channel) =>
          addChannel.mutate(channel, {
            onSuccess: () => setAddChannelOpen(false),
            onError: (e: unknown) =>
              window.alert(e instanceof Error ? e.message : 'Failed to add channel'),
          })
        }
      />
    </div>
  );
}
