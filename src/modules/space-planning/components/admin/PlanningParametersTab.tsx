import { Plus, Trash2 } from 'lucide-react';
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import { useAdminConfigStore } from '../../stores/useAdminConfigStore';
import {
  ADMIN_CATEGORIES,
  AdminSectionCard,
  NumberField,
  PendingEngineBadge,
  SumIndicator,
  TabErrorSummary,
} from './adminConfigShared';
import { findFieldError } from './adminConfigHelpers';
import { ROUNDING_RULES } from './adminConfigValidation';
import type { AdminLftOption, AdminPlanningParameters } from '../../api/adminConfigApi';

const TAB = 'planning_parameters';

const DEFAULT_LFT: AdminLftOption = {
  lft_factor: 3.3,
  options_per_lft: 1,
  min_options: 0,
  max_options: 100,
};

export function PlanningParametersTab(): React.ReactNode {
  const pp = useAdminConfigStore((s) => s.draft?.planning_parameters);
  const roundingRule = useAdminConfigStore((s) => s.draft?.rounding_rule);
  const lftOptions = useAdminConfigStore((s) => s.draft?.lft_options);
  const fieldErrors = useAdminConfigStore((s) => s.fieldErrors);
  const updateSection = useAdminConfigStore((s) => s.updateSection);

  if (!pp || lftOptions === undefined) return null;

  const set = (key: keyof AdminPlanningParameters, value: number): void => {
    updateSection('planning_parameters', { ...pp, [key]: value });
  };
  const err = (field: string): string | undefined => findFieldError(fieldErrors, TAB, field);

  const setLft = (cat: string, patch: Partial<AdminLftOption>): void => {
    const current = lftOptions[cat] ?? DEFAULT_LFT;
    updateSection('lft_options', { ...lftOptions, [cat]: { ...current, ...patch } });
  };
  const removeLft = (cat: string): void => {
    const next = { ...lftOptions };
    delete next[cat];
    updateSection('lft_options', next);
  };

  const wSum = pp.wspsf_same_season + pp.wspsf_recency + pp.wspsf_three_yr;
  const blendSum = pp.blend_past + pp.blend_aop;

  const lftCats = Object.keys(lftOptions);
  const missingLftCats = ADMIN_CATEGORIES.filter((c) => !lftCats.includes(c));
  const sample = lftCats[0] ? lftOptions[lftCats[0]] : undefined;
  const sampleCat = lftCats[0];

  return (
    <div className="space-y-4">
      <TabErrorSummary errors={fieldErrors} tab={TAB} />

      <AdminSectionCard
        title="wSPSF Weights"
        actions={<SumIndicator label="Σ weights" sum={wSum} target={1} />}
      >
        {/* eslint-disable-next-line design-system/prefer-metric-grid -- form input grid, not metric cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <NumberField
            label="Same season"
            value={pp.wspsf_same_season}
            onChange={(v) => set('wspsf_same_season', v)}
            error={err('wspsf_same_season')}
            hint="0–1 fraction"
          />
          <NumberField
            label="Recency"
            value={pp.wspsf_recency}
            onChange={(v) => set('wspsf_recency', v)}
            error={err('wspsf_recency')}
            hint="0–1 fraction"
          />
          <NumberField
            label="Three-year"
            value={pp.wspsf_three_yr}
            onChange={(v) => set('wspsf_three_yr', v)}
            error={err('wspsf_three_yr')}
            hint="0–1 fraction"
          />
        </div>
      </AdminSectionCard>

      <AdminSectionCard
        title="Past vs AOP Blend"
        actions={<SumIndicator label="Σ blend" sum={blendSum} target={1} />}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <NumberField
            label="Blend — past"
            value={pp.blend_past}
            onChange={(v) => set('blend_past', v)}
            error={err('blend_past')}
          />
          <NumberField
            label="Blend — AOP"
            value={pp.blend_aop}
            onChange={(v) => set('blend_aop', v)}
            error={err('blend_aop')}
          />
        </div>
      </AdminSectionCard>

      <AdminSectionCard title="BOR & Sizing">
        {/* eslint-disable-next-line design-system/prefer-metric-grid -- form input grid, not metric cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <NumberField
            label="BOR rate"
            value={pp.bor_rate}
            onChange={(v) => set('bor_rate', v)}
            error={err('bor_rate')}
            hint="0–0.5 fraction"
          />
          <NumberField
            label="BOR min carpet sqft"
            value={pp.bor_min_carpet_sqft}
            onChange={(v) => set('bor_min_carpet_sqft', v)}
            error={err('bor_min_carpet_sqft')}
          />
          <NumberField
            label="LFT sqft factor"
            value={pp.lft_sqft_factor}
            onChange={(v) => set('lft_sqft_factor', v)}
            error={err('lft_sqft_factor')}
          />
          <NumberField
            label="Sell-through default"
            value={pp.sell_through_default}
            onChange={(v) => set('sell_through_default', v)}
            error={err('sell_through_default')}
            hint="0–1 fraction"
          />
        </div>
      </AdminSectionCard>

      <AdminSectionCard
        title="LFT & Options Conversion"
        badge={<PendingEngineBadge />}
        actions={
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Rounding</span>
            <Select
              value={roundingRule || 'standard'}
              onValueChange={(v) => updateSection('rounding_rule', v)}
            >
              <SelectTrigger className="h-8 w-44 text-sm" aria-label="Option rounding rule">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROUNDING_RULES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r.replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      >
        <p className="text-xs text-gray-500 mb-3">
          Per-category conversion of allocated sqft into linear feet and option capacity.
          Categories without a row keep the engine defaults (global LFT factor above).
        </p>
        {lftCats.length > 0 && (
          <div className="space-y-2 mb-3">
            {lftCats.map((cat) => {
              const o = lftOptions[cat] ?? DEFAULT_LFT;
              return (
                <div key={cat} className="flex flex-wrap items-end gap-3">
                  <span className="w-10 text-sm font-medium text-gray-900 pb-1.5">{cat}</span>
                  <NumberField
                    label="Sqft → LFT factor"
                    value={o.lft_factor}
                    onChange={(v) => setLft(cat, { lft_factor: v })}
                    inputClassName="w-24"
                  />
                  <NumberField
                    label="Options / LFT"
                    value={o.options_per_lft}
                    onChange={(v) => setLft(cat, { options_per_lft: v })}
                    inputClassName="w-24"
                  />
                  <NumberField
                    label="Min options"
                    value={o.min_options}
                    onChange={(v) => setLft(cat, { min_options: v })}
                    inputClassName="w-24"
                  />
                  <NumberField
                    label="Max options"
                    value={o.max_options}
                    onChange={(v) => setLft(cat, { max_options: v })}
                    inputClassName="w-24"
                  />
                  <button
                    type="button"
                    aria-label={`Remove LFT config for ${cat}`}
                    onClick={() => removeLft(cat)}
                    className="p-1.5 mb-1 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  {err(`lft_options.${cat}`) && (
                    <span className="text-xs text-red-600 pb-2">{err(`lft_options.${cat}`)}</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {missingLftCats.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-400">Add category:</span>
            {missingLftCats.map((cat) => (
              <Button key={cat} variant="outline" size="sm" onClick={() => setLft(cat, {})}>
                <Plus className="w-3.5 h-3.5 mr-1" />
                {cat}
              </Button>
            ))}
          </div>
        )}
        {sample && sampleCat && (
          <p className="text-xs text-gray-400 mt-3">
            Sample ({sampleCat}): 100 sqft ÷ {sample.lft_factor} = {(100 / (sample.lft_factor || 1)).toFixed(1)} LFT ×{' '}
            {sample.options_per_lft} = {((100 / (sample.lft_factor || 1)) * sample.options_per_lft).toFixed(1)}{' '}
            options → rounded via “{(roundingRule || 'standard').replace(/_/g, ' ')}”, clamped to{' '}
            {sample.min_options}–{sample.max_options}.
          </p>
        )}
      </AdminSectionCard>

      <details className="rounded-lg border border-gray-200 bg-white">
        <summary className="cursor-pointer p-4 text-sm font-semibold text-gray-900 select-none">
          Advanced — Waterfill Solver
        </summary>
        <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <NumberField
            label="Waterfill tolerance"
            value={pp.waterfill_tolerance}
            onChange={(v) => set('waterfill_tolerance', v)}
            error={err('waterfill_tolerance')}
            hint="Must be > 0"
          />
          <NumberField
            label="Waterfill max iterations"
            value={pp.waterfill_max_iter}
            onChange={(v) => set('waterfill_max_iter', Math.round(v))}
            error={err('waterfill_max_iter')}
            hint="10–1000"
          />
        </div>
      </details>
    </div>
  );
}
