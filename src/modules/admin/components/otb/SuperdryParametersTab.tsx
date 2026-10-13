/**
 * Parameters tab for the channel-led (Superdry) OTB Configuration screen.
 *
 * Replaces FNL's "Budget Structure" tab: Superdry has no Core/NOOS vs Fashion
 * split. The equivalent levers are the per-channel NSM / sell-through
 * parameters and the LC / MRP multiplier.
 *
 * Editable scalar levers (per-channel NSM/sell-through, commercial params and
 * live constants) are saved to otb_config_master — each save is versioned and
 * audited server-side.
 */

import { useCallback, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  updateOtbConfiguration,
  type OtbConfigChange,
  type OtbConfiguration,
} from '../../api/otbConfigurationApi';
import {
  ConfigCard,
  DerivedValueField,
  NotUsedBadge,
  NumberField,
  ReadOnlyRow,
  SectionFooter,
  ValuePill,
  Chips,
} from './shared';
import { channelLabel } from '@/modules/otb/data/channelDisplayNames';
import { useDerivationSummary } from '@/modules/otb/api/otbDashboardApi';
import { useToast } from '@/hooks/useToast';
import { useAuthStore } from '@/hooks/useAuthStore';
import { cn } from '@/lib/utils';

/**
 * Brand-level Sell-Through must not fall below this (fraction). The brand-level
 * value is the OTB-share weighted average of the per-channel sell-through, so
 * dropping any large channel too low trips this guardrail and blocks saving.
 */
const MIN_SELL_THROUGH = 0.6;

/** Round a fraction to 4 dp to keep the derived-value diff stable across renders. */
function round4(value: number): number {
  return Math.round(value * 10000) / 10000;
}

/**
 * Every Constants field shares these so the input boxes line up: a common box
 * width wide enough for the largest value (aop_unit_multiplier = 100000), and
 * a fixed unit slot that stays reserved even on the unit-less rows.
 */
const CONST_BOX = 'w-32';
const CONST_SUFFIX_SLOT = 'w-4';

/** Constants the seasonal engine actually reads. */
const LIVE_CONSTANTS: { key: string; label: string; description: string; suffix?: string; step?: number }[] = [
  { key: 'target_woc', label: 'Target Weeks of Cover', description: 'Drives Target Closing Inventory (reporting only on the seasonal path)' },
  { key: 'default_mrp', label: 'Default MRP', description: 'Last-resort fallback when an org has no MRP history' },
  { key: 'aop_unit_multiplier', label: 'AOP Unit Multiplier', description: 'Converts AOP values from lakhs to rupees', step: 1000 },
];

/** Present in config but never read by the engine on the seasonal path. */
const INERT_CONSTANTS: { key: string; label: string; reason: string }[] = [
  { key: 'default_margin', label: 'Default Margin', reason: 'Only used on the monthly planning path; ignored for seasonal orgs.' },
  { key: 'default_target_cover', label: 'Default Target Cover', reason: 'No consumers in the OTB engine.' },
  { key: 'min_net_sales_threshold', label: 'Min Net Sales Threshold', reason: 'No consumers in the OTB engine.' },
];

interface ChannelDraft {
  nsm_pct: number;
  sell_through_pct: number;
  nsm_discount_pct: number;
  /** UI-only this phase — edited in the grid but excluded from the save diff. */
  aop_achievement_pct: number;
}

interface ParametersDraft {
  channels: Record<string, ChannelDraft>;
  lc_mrp_multiple: number;
  nsm_discount_pct: number;
  constants: Record<string, number>;
}

function num(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

/** Fractions (0.9) are stored; the UI edits whole percents (90). */
function toPercent(fraction: number | undefined): number {
  return Math.round(num(fraction) * 100);
}

function buildDraft(config: OtbConfiguration): ParametersDraft {
  const params = config.channel_config?.channel_params ?? {};
  const channels: Record<string, ChannelDraft> = {};
  for (const [name, p] of Object.entries(params)) {
    channels[name] = {
      nsm_pct: num(p.nsm_pct),
      sell_through_pct: num(p.sell_through_pct),
      nsm_discount_pct: num(p.nsm_discount_pct),
      aop_achievement_pct: num(p.aop_achievement_pct),
    };
  }
  const constants: Record<string, number> = {};
  for (const { key } of LIVE_CONSTANTS) {
    constants[key] = num(config.constants?.[key]);
  }
  return {
    channels,
    lc_mrp_multiple: num(config.lc_mrp_multiple),
    nsm_discount_pct: num(config.nsm_discount_pct),
    constants,
  };
}

/**
 * Right-aligned read-only value that matches the width of the editable Constants
 * inputs so the derived (weighted) rows stay in the same column.
 */
function ConstReadonly({ value, box, slot }: { value: string; box: string; slot: string }) {
  return (
    <div className="flex items-center gap-1">
      <span className={cn(box, 'text-right py-1.5 text-sm text-gray-900 tabular-nums')}>{value}</span>
      <span className={cn('text-sm text-gray-500', slot)}>%</span>
    </div>
  );
}

/** Percent input backed by a fraction-valued field. */
function PercentField({
  value,
  onChange,
  inputWidth,
  suffixWidth,
}: {
  value: number;
  onChange: (fraction: number) => void;
  inputWidth?: string;
  suffixWidth?: string;
}) {
  return (
    <NumberField
      value={toPercent(value)}
      onChange={(pct) => onChange(pct / 100)}
      suffix="%"
      min={0}
      max={100}
      inputWidth={inputWidth}
      suffixWidth={suffixWidth}
    />
  );
}

export function SuperdryParametersTab({
  config,
  onSaved,
}: {
  config: OtbConfiguration;
  onSaved?: () => void | Promise<void>;
}) {
  const { success: toastSuccess, info: toastInfo, error: toastError } = useToast();
  const userEmail = useAuthStore((s) => s.user?.email ?? '');

  const initial = useMemo(() => buildDraft(config), [config]);
  const [draft, setDraft] = useState<ParametersDraft>(initial);

  // Brand-level NSM Share / Sell-Through = OTB-share weighted average of the
  // per-channel draft values. Weights = each channel's OTB Value (buy_lc) share
  // for the target season (e.g. AW 2026), normalised over the channels that are
  // actually configured. Null until the derivation weights are available.
  const weightSeason = config.target_seasons?.[0]?.name ?? undefined;
  const { data: derivation } = useDerivationSummary({ season: weightSeason });

  const weighted = useMemo<{ nsm: number; st: number } | null>(() => {
    const buyLcByChannel: Record<string, number> = {};
    for (const r of derivation?.items ?? []) buyLcByChannel[r.channel] = r.buy_lc || 0;

    let totalWeight = 0;
    for (const ch of Object.keys(draft.channels)) totalWeight += buyLcByChannel[ch] ?? 0;
    if (totalWeight <= 0) return null;

    let nsm = 0;
    let st = 0;
    for (const [ch, p] of Object.entries(draft.channels)) {
      const w = (buyLcByChannel[ch] ?? 0) / totalWeight;
      nsm += p.nsm_pct * w;
      st += p.sell_through_pct * w;
    }
    return { nsm, st };
  }, [derivation, draft.channels]);

  const threshold = num(config.min_sell_through_pct, MIN_SELL_THROUGH);
  const belowThreshold = weighted !== null && weighted.st < threshold;

  const channelConfig = config.channel_config ?? {};
  const excluded = channelConfig.exclude_formats ?? [];

  // Channels with parameters first, then the excluded ones with no data —
  // each group alphabetical by display name.
  const byLabel = (a: string, b: string) => channelLabel(a).localeCompare(channelLabel(b));
  const allChannels = [
    ...Object.keys(draft.channels).sort(byLabel),
    ...excluded.filter((c) => !(c in draft.channels)).sort(byLabel),
  ];

  const setChannel = useCallback((channel: string, field: keyof ChannelDraft, value: number) => {
    setDraft((prev) => {
      const existing: ChannelDraft = prev.channels[channel] ?? { nsm_pct: 0, sell_through_pct: 0, nsm_discount_pct: 0, aop_achievement_pct: 0 };
      return {
        ...prev,
        channels: { ...prev.channels, [channel]: { ...existing, [field]: value } },
      };
    });
  }, []);

  const setConstant = useCallback((key: string, value: number) => {
    setDraft((prev) => ({ ...prev, constants: { ...prev.constants, [key]: value } }));
  }, []);

  // Diff the draft against the saved config → list of editable json_path changes.
  const changes = useMemo<OtbConfigChange[]>(() => {
    const out: OtbConfigChange[] = [];
    for (const [channel, params] of Object.entries(draft.channels)) {
      const base = initial.channels[channel];
      if (!base || params.nsm_pct !== base.nsm_pct) {
        out.push({ json_path: `channel_config.channel_params.${channel}.nsm_pct`, value: params.nsm_pct });
      }
      if (!base || params.sell_through_pct !== base.sell_through_pct) {
        out.push({
          json_path: `channel_config.channel_params.${channel}.sell_through_pct`,
          value: params.sell_through_pct,
        });
      }
      if (!base || params.nsm_discount_pct !== base.nsm_discount_pct) {
        out.push({
          json_path: `channel_config.channel_params.${channel}.nsm_discount_pct`,
          value: params.nsm_discount_pct,
        });
      }
    }
    if (draft.lc_mrp_multiple !== initial.lc_mrp_multiple) {
      out.push({ json_path: 'lc_mrp_multiple', value: draft.lc_mrp_multiple });
    }
    if (draft.nsm_discount_pct !== initial.nsm_discount_pct) {
      out.push({ json_path: 'nsm_discount_pct', value: draft.nsm_discount_pct });
    }
    // Persist the derived brand-level weighted values (read-only in the UI) so
    // the stored globals stay in sync with the per-channel inputs.
    if (weighted) {
      if (round4(weighted.nsm) !== round4(num(config.nsm_share_pct))) {
        out.push({ json_path: 'nsm_share_pct', value: round4(weighted.nsm) });
      }
      if (round4(weighted.st) !== round4(num(config.sell_through_pct))) {
        out.push({ json_path: 'sell_through_pct', value: round4(weighted.st) });
      }
    }
    for (const { key } of LIVE_CONSTANTS) {
      if (draft.constants[key] !== initial.constants[key]) {
        out.push({ json_path: `constants.${key}`, value: draft.constants[key] ?? 0 });
      }
    }
    return out;
  }, [draft, initial, weighted, config]);

  const saveMutation = useMutation({
    mutationFn: () => updateOtbConfiguration(changes, userEmail),
    onSuccess: async (result) => {
      toastSuccess(`Saved — configuration is now v${result.version ?? '?'}.`);
      await onSaved?.();
    },
    onError: (err) => {
      toastError(err instanceof Error ? err.message : 'Failed to save configuration');
    },
  });

  const handleSave = () => {
    if (belowThreshold) {
      toastError(`Weighted sell-through is below the ${toPercent(threshold)}% minimum — adjust the channel sell-through values before saving.`);
      return;
    }
    if (changes.length === 0) {
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
      {/* Channel Parameters */}
      <ConfigCard
        title="Channel Parameters"
        description="Per-channel new-season (NSM) share, discount, sell-through and AOP achievement, applied when computing the sales target and buy quantity for each channel. Full price = sales target / (1 − discount)."
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left font-medium text-gray-500 text-xs uppercase tracking-wider py-2">Channel</th>
                <th className="text-right font-medium text-gray-500 text-xs uppercase tracking-wider py-2">NSM %</th>
                <th className="text-right font-medium text-gray-500 text-xs uppercase tracking-wider py-2">Discount %</th>
                <th className="text-right font-medium text-gray-500 text-xs uppercase tracking-wider py-2">Sell-Through %</th>
                <th className="text-right font-medium text-gray-500 text-xs uppercase tracking-wider py-2">AOP Achievement %</th>
              </tr>
            </thead>
            <tbody>
              {allChannels.map((channel) => {
                const params = draft.channels[channel];
                const isExcluded = !params;
                return (
                  <tr
                    key={channel}
                    className={cn('border-b border-gray-100 last:border-b-0', isExcluded && 'opacity-60')}
                  >
                    <td className="py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{channelLabel(channel)}</span>
                        {isExcluded && (
                          <NotUsedBadge reason="Excluded from OTB — no channel parameters are defined for this channel." />
                        )}
                      </div>
                    </td>
                    <td className="py-2 text-right">
                      <div className="flex justify-end">
                        {isExcluded ? (
                          <DerivedValueField value="—" suffix="%" />
                        ) : (
                          <PercentField
                            value={params.nsm_pct}
                            onChange={(v) => setChannel(channel, 'nsm_pct', v)}
                          />
                        )}
                      </div>
                    </td>
                    <td className="py-2 text-right">
                      <div className="flex justify-end">
                        {isExcluded ? (
                          <DerivedValueField value="—" suffix="%" />
                        ) : (
                          <PercentField
                            value={params.nsm_discount_pct}
                            onChange={(v) => setChannel(channel, 'nsm_discount_pct', v)}
                          />
                        )}
                      </div>
                    </td>
                    <td className="py-2 text-right">
                      <div className="flex justify-end">
                        {isExcluded ? (
                          <DerivedValueField value="—" suffix="%" />
                        ) : (
                          <PercentField
                            value={params.sell_through_pct}
                            onChange={(v) => setChannel(channel, 'sell_through_pct', v)}
                          />
                        )}
                      </div>
                    </td>
                    <td className="py-2 text-right">
                      <div className="flex justify-end">
                        {isExcluded ? (
                          <DerivedValueField value="—" suffix="%" />
                        ) : (
                          <PercentField
                            value={params.aop_achievement_pct}
                            onChange={(v) => setChannel(channel, 'aop_achievement_pct', v)}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {excluded.length > 0 && (
          <div className="mt-3 px-3 py-2 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">
              Excluded channels:{' '}
              <span className="text-gray-700">{excluded.map(channelLabel).join(', ')}</span>
            </p>
          </div>
        )}
      </ConfigCard>

      {/* Constants */}
      <ConfigCard title="Constants" description="Global numeric levers used by the OTB engine.">
        <ReadOnlyRow
          label="LC / MRP Multiplier"
          description="Landed cost per unit = MRP ÷ this multiplier. Inverse driver of total OTB value."
        >
          <NumberField
            value={draft.lc_mrp_multiple}
            onChange={(v) => setDraft((p) => ({ ...p, lc_mrp_multiple: v }))}
            step={0.01}
            min={0}
            inputWidth={CONST_BOX}
            suffixWidth={CONST_SUFFIX_SLOT}
          />
        </ReadOnlyRow>

        <ReadOnlyRow
          label="NSM Share"
          description="Weighted average of the per-channel NSM %, weighted by each channel's OTB share (read-only)."
        >
          <ConstReadonly
            value={weighted ? String(toPercent(weighted.nsm)) : '—'}
            box={CONST_BOX}
            slot={CONST_SUFFIX_SLOT}
          />
        </ReadOnlyRow>

        <ReadOnlyRow label="NSM Discount" description="Global default; overridden per channel above. Full price = sales target / (1 − discount)">
          <PercentField
            value={draft.nsm_discount_pct}
            onChange={(v) => setDraft((p) => ({ ...p, nsm_discount_pct: v }))}
            inputWidth={CONST_BOX}
            suffixWidth={CONST_SUFFIX_SLOT}
          />
        </ReadOnlyRow>

        <ReadOnlyRow
          label="Sell-Through"
          description="Weighted average of the per-channel sell-through, weighted by each channel's OTB share (read-only)."
        >
          <div className="flex flex-col items-end gap-1">
            <ConstReadonly
              value={weighted ? String(toPercent(weighted.st)) : '—'}
              box={CONST_BOX}
              slot={CONST_SUFFIX_SLOT}
            />
            {weighted && weighted.st < threshold && (
              <p className="text-xs text-red-600 text-right">
                Weighted sell-through {toPercent(weighted.st)}% is below the {toPercent(threshold)}% minimum.
              </p>
            )}
          </div>
        </ReadOnlyRow>

        <ReadOnlyRow
          label="Minimum Sell-Through Threshold"
          description="Brand-level weighted sell-through must stay at or above this to save."
        >
          <ConstReadonly value={String(toPercent(threshold))} box={CONST_BOX} slot={CONST_SUFFIX_SLOT} />
        </ReadOnlyRow>

        {LIVE_CONSTANTS.map(({ key, label, description, suffix, step }) => (
          <ReadOnlyRow key={key} label={label} description={description}>
            <NumberField
              value={draft.constants[key] ?? 0}
              onChange={(v) => setConstant(key, v)}
              suffix={suffix}
              step={step ?? 1}
              min={0}
              inputWidth={CONST_BOX}
              suffixWidth={CONST_SUFFIX_SLOT}
            />
          </ReadOnlyRow>
        ))}

        {INERT_CONSTANTS.map(({ key, label, reason }) => (
          <ReadOnlyRow key={key} label={label} muted reason={reason}>
            <ValuePill>{config.constants?.[key] ?? '—'}</ValuePill>
          </ReadOnlyRow>
        ))}
      </ConfigCard>

      {/* Channel Settings — documented in config, not read by the engine */}
      <ConfigCard
        title="Channel Settings"
        muted
        description="Descriptive channel metadata stored alongside the parameters. The engine attributes all stock and inward to EBO_Channel regardless of these values."
      >
        <ReadOnlyRow label="Grain Column" muted reason="Structural — changing it would require a calculator change.">
          <ValuePill>{channelConfig.grain_column ?? '—'}</ValuePill>
        </ReadOnlyRow>
        <ReadOnlyRow label="Shared Inventory" muted reason="No consumers in the OTB engine; the behaviour it describes is hardcoded.">
          <ValuePill>{String(channelConfig.shared_inventory ?? '—')}</ValuePill>
        </ReadOnlyRow>
        <ReadOnlyRow label="Inventory Channels" muted reason="No consumers in the OTB engine.">
          <Chips items={(channelConfig.inventory_channels ?? []).map(channelLabel)} active={false} />
        </ReadOnlyRow>
        <ReadOnlyRow label="Demand-Only Channels" muted reason="No consumers in the OTB engine.">
          <Chips items={(channelConfig.demand_only_channels ?? []).map(channelLabel)} active={false} />
        </ReadOnlyRow>
      </ConfigCard>

      <SectionFooter
        onSave={handleSave}
        onReset={handleReset}
        isValid={changes.length > 0 && !saveMutation.isPending && !belowThreshold}
      />
    </div>
  );
}
