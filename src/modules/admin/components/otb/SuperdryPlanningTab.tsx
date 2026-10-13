/**
 * Planning tab for the channel-led (Superdry) OTB Configuration screen.
 *
 * Mirrors the FNL Planning tab card-for-card, with the seasonal equivalents:
 * Season Calendar replaces Fiscal Calendar, and the age filter is expressed in
 * seasons rather than days.
 *
 * Editable this round: Max Age (Seasons) — saved to otb_config_master
 * (versioned + audited). List/structural fields (frequencies, granularity,
 * aggregation, scope filters, non-negative KPIs) are shown read-only until the
 * list-edit flow lands.
 */

import { useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  updateOtbConfiguration,
  type OtbConfiguration,
} from '../../api/otbConfigurationApi';
import {
  Chips,
  ConfigCard,
  NumberField,
  ReadOnlyRow,
  ScopeValue,
  SectionFooter,
  ValuePill,
} from './shared';
import { useToast } from '@/hooks/useToast';
import { useAuthStore } from '@/hooks/useAuthStore';

const MONTH_ABBR = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function formatMonths(months: number[] | undefined): string {
  if (!months || months.length === 0) return '—';
  const names = months.map((m) => MONTH_ABBR[m - 1] ?? String(m));
  return `${names[0]}–${names[names.length - 1]}`;
}

interface PlanningDraft {
  max_age_seasons: number;
}

function buildDraft(config: OtbConfiguration): PlanningDraft {
  return {
    max_age_seasons: Number(config.inventory_age_filter?.max_age_seasons ?? 0),
  };
}

export function SuperdryPlanningTab({
  config,
  onSaved,
}: {
  config: OtbConfiguration;
  onSaved?: () => void | Promise<void>;
}) {
  const { success: toastSuccess, info: toastInfo, error: toastError } = useToast();
  const userEmail = useAuthStore((s) => s.user?.email ?? '');

  const initial = useMemo(() => buildDraft(config), [config]);
  const [draft, setDraft] = useState<PlanningDraft>(initial);

  const seasons = Object.entries(config.season_definitions ?? {});
  const targetSeasons = config.target_seasons ?? [];
  const ageFilter = config.inventory_age_filter ?? {};
  const filterRules = config.filter_rules ?? [];
  const channelConfig = config.channel_config ?? {};
  const aggregationLevels = channelConfig.aggregation_levels?.length
    ? channelConfig.aggregation_levels
    : config.aggregation_levels ?? [];

  const dirty = draft.max_age_seasons !== initial.max_age_seasons;

  const saveMutation = useMutation({
    mutationFn: () =>
      updateOtbConfiguration(
        [{ json_path: 'inventory_age_filter.max_age_seasons', value: draft.max_age_seasons }],
        userEmail,
      ),
    onSuccess: async (result) => {
      toastSuccess(`Saved — configuration is now v${result.version ?? '?'}.`);
      await onSaved?.();
    },
    onError: (err) => {
      toastError(err instanceof Error ? err.message : 'Failed to save configuration');
    },
  });

  const handleSave = () => {
    if (!dirty) {
      toastInfo('No changes to save.');
      return;
    }
    saveMutation.mutate();
  };

  const handleReset = () => {
    setDraft(initial);
    toastSuccess('Reset to the saved configuration.');
  };

  return (
    <div className="space-y-4">
      {/* Season Calendar — the seasonal analogue of FNL's Fiscal Calendar */}
      <ConfigCard
        title="Season Calendar"
        description="Season definitions and the season the OTB engine currently plans for."
      >
        {seasons.map(([code, season]) => (
          <ReadOnlyRow
            key={code}
            label={season.label ?? season.name ?? code}
            description={`Season code ${code} · ${season.name ?? ''}`}
          >
            <ValuePill>{formatMonths(season.months)}</ValuePill>
          </ReadOnlyRow>
        ))}
        <ReadOnlyRow
          label="Target Season"
          description="Only the first entry is planned; the rest are queued for future runs"
        >
          <div className="flex flex-wrap gap-2 justify-end">
            {targetSeasons.map((s, i) => (
              <span
                key={`${s.code}-${s.year}`}
                className={
                  i === 0
                    ? 'px-2.5 py-1 rounded-md text-xs font-medium bg-indigo-50 text-primary-700 border border-indigo-200'
                    : 'px-2.5 py-1 rounded-md text-xs font-medium bg-gray-50 text-gray-500 border border-gray-200'
                }
              >
                {s.name}
                {i === 0 && <span className="ml-1 opacity-60">active</span>}
              </span>
            ))}
            {targetSeasons.length === 0 && <span className="text-xs text-gray-400">None</span>}
          </div>
        </ReadOnlyRow>
      </ConfigCard>

      {/* Planning Parameters — read-only (structural / list fields) */}
      <ConfigCard title="Planning Parameters">
        <ReadOnlyRow
          label="Planning Model"
          description="Master dispatch for the calculation path — changing it would route the org to a different engine, so it is not editable here"
        >
          <ValuePill>{config.planning_model ?? '—'}</ValuePill>
        </ReadOnlyRow>
        <ReadOnlyRow
          label="Planning Frequency"
          muted
          reason="Structural — editing frequencies is not supported in this version."
        >
          <ValuePill>{config.planning_frequency ?? '—'}</ValuePill>
        </ReadOnlyRow>
        <ReadOnlyRow
          label="Calculation Frequencies"
          muted
          reason="Structural — editing frequencies is not supported in this version."
        >
          <Chips items={config.calculation_frequency ?? []} />
        </ReadOnlyRow>
        <ReadOnlyRow
          label="OTB Granularity"
          muted
          reason="Structural — channel-led orgs plan per channel; changing this needs a calculator change."
        >
          <ValuePill>{config.otb_granularity ?? '—'}</ValuePill>
        </ReadOnlyRow>
      </ConfigCard>

      {/* Aggregation Hierarchy — read-only */}
      <ConfigCard
        title="Aggregation Hierarchy"
        muted
        description="Defines the grain for all OTB calculations. Editing the grain is not supported in this version."
      >
        <Chips items={aggregationLevels} />
        {aggregationLevels.length > 0 && (
          <div className="mt-3 px-3 py-2 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">
              Active grain: <span className="font-mono text-gray-700">{aggregationLevels.join(' × ')}</span>
            </p>
          </div>
        )}
      </ConfigCard>

      {/* Inventory Age Filter — Max Age (Seasons) is editable */}
      <ConfigCard title="Inventory Age Filter">
        <ReadOnlyRow
          label="Max Age (Seasons)"
          description="Stock older than this many seasons is excluded from closing stock"
        >
          <NumberField
            value={draft.max_age_seasons}
            onChange={(v) => setDraft({ max_age_seasons: v })}
            suffix="seasons"
            min={0}
          />
        </ReadOnlyRow>
        <ReadOnlyRow
          label="Enable Age Filter"
          muted
          reason="Only read on the monthly planning path. The seasonal path always applies the max-age-seasons cutoff."
        >
          <ValuePill>{String(ageFilter.enabled ?? '—')}</ValuePill>
        </ReadOnlyRow>
        <ReadOnlyRow label="Mode" muted reason="Descriptive only — never read by the OTB engine.">
          <ValuePill>{ageFilter.mode ?? '—'}</ValuePill>
        </ReadOnlyRow>
        <ReadOnlyRow label="Max Holding Days" muted reason="No consumers in the OTB engine; holding days use a fixed 180-day season.">
          <ValuePill>{config.max_holding_days ?? '—'}</ValuePill>
        </ReadOnlyRow>
        <ReadOnlyRow label="Include Partial Devaluation" muted reason="No consumers in the OTB engine.">
          <ValuePill>{String(config.include_partial_devaluation ?? '—')}</ValuePill>
        </ReadOnlyRow>
        <ReadOnlyRow
          label="Devaluation Buckets"
          muted
          reason="Bucket boundaries feed a devalued-stock column that the OTB calculation does not consume, so the percentages have no effect."
        >
          <Chips
            items={(config.devaluation_buckets ?? []).map(
              (b) => `${b.min_seasons ?? 0}–${b.max_seasons ?? 0} seasons: ${b.devaluation_pct ?? 0}%`,
            )}
            active={false}
          />
        </ReadOnlyRow>
      </ConfigCard>

      {/* Scope Filters — read-only (list edits land in a later round) */}
      <ConfigCard
        title="Scope Filters"
        muted
        description="An empty list means no filter is applied — all values are in scope. List editing is not supported in this version."
      >
        <ReadOnlyRow label="Formats in Scope" description="Store format codes included in OTB calculations">
          <ScopeValue items={config.formats_in_scope ?? []} />
        </ReadOnlyRow>
        <ReadOnlyRow label="Merchandise Segments" description="Segment codes included in OTB calculations">
          <ScopeValue items={config.segments_in_scope ?? []} />
        </ReadOnlyRow>
        <ReadOnlyRow label="Fashion Grades" description="Fashion grades included in OTB calculations">
          <ScopeValue items={config.fashion_grades_in_scope ?? []} />
        </ReadOnlyRow>
      </ConfigCard>

      {/* Period Names — FNL parity; unused for seasonal planning */}
      <ConfigCard
        title="Period Names"
        muted
        description="Maps each period index to a display name used in plan naming. Seasonal orgs derive plan names from the season calendar instead."
      >
        <Chips
          items={Object.entries(config.hit_names_by_frequency ?? {}).map(([k, v]) => `${k}: ${String(v)}`)}
          active={false}
          emptyLabel="Not configured — plan names come from the season calendar"
        />
      </ConfigCard>

      {/* KPI Exclusions — read-only (list edits land in a later round) */}
      <ConfigCard title="KPI Exclusions">
        <ReadOnlyRow
          label="Non-Negative KPIs"
          muted
          reason="List editing is not supported in this version."
        >
          <Chips items={config.non_negative_kpis ?? []} emptyLabel="None configured" />
        </ReadOnlyRow>
        <ReadOnlyRow
          label="Excluded KPIs"
          muted
          reason="No consumers in the OTB engine; KPI selection is driven by the otb_kpi_groups tables."
        >
          <Chips items={config.exclude_kpis ?? []} active={false} emptyLabel="None configured" />
        </ReadOnlyRow>
      </ConfigCard>

      {/* Filter Rules */}
      <ConfigCard
        title="Filter Rules"
        muted
        description="Validation thresholds stored in config. No consumers in the OTB engine."
      >
        {filterRules.length === 0 && <span className="text-xs text-gray-400">None configured</span>}
        {filterRules.map((rule) => (
          <ReadOnlyRow key={rule.name} label={rule.name ?? '—'} description={rule.description}>
            <ValuePill>
              {rule.field} {rule.operator} {rule.value}
            </ValuePill>
          </ReadOnlyRow>
        ))}
      </ConfigCard>

      <SectionFooter
        onSave={handleSave}
        onReset={handleReset}
        isValid={dirty && !saveMutation.isPending}
      />
    </div>
  );
}
