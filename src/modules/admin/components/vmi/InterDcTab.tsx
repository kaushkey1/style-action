import { useState } from 'react';
import { Input, Switch } from '@/components/ui';
import { useToast } from '@/hooks/useToast';
import { useVmiConfigStore } from '../../stores/useVmiConfigStore';
import type { InterDcConfig } from '../../data/vmiConfigSeed';
import { AdminSectionCard, FieldRow, NumberField, SectionFooter } from './shared';

function keyOf(c: InterDcConfig): string {
  return JSON.stringify(c);
}

function nonNegError(v: number | null): string | undefined {
  if (v === null || Number.isNaN(v)) return 'Required';
  if (!Number.isInteger(v) || v < 0) return 'Must be a non-negative whole number';
  return undefined;
}

/** R8 — Inter-DC Shift. */
export function InterDcTab(): React.ReactNode {
  const stored = useVmiConfigStore((s) => s.interDc);
  const setInterDc = useVmiConfigStore((s) => s.setInterDc);
  const dcToDcLead = useVmiConfigStore((s) => s.leadTimes.dcToDc);
  const { success: toastSuccess, error: toastError } = useToast();

  const [draft, setDraft] = useState<InterDcConfig>(stored);
  const dirty = keyOf(draft) !== keyOf(stored);

  const bufferError = nonNegError(draft.protectedBufferDays);
  const triggerError = nonNegError(draft.gapCoverTrigger);
  // Cannot activate without a DC→DC lead time available (set in Lead Times).
  const leadMissing = draft.enabled && (dcToDcLead === null || Number.isNaN(dcToDcLead));
  const hasErrors = Boolean(bufferError || triggerError || leadMissing);

  function handleSave(): void {
    if (hasErrors) {
      toastError(leadMissing ? 'Set a DC→DC lead time (Lead Times tab) before enabling Inter-DC Shift.' : 'Fix the highlighted fields before saving.');
      return;
    }
    setInterDc(draft);
    toastSuccess('Inter-DC Shift configuration saved.');
  }

  return (
    <div className="space-y-4">
      <AdminSectionCard
        title="Inter-DC Shift"
        description="Transfers surplus stock between DCs before raising a vendor PO for the remaining shortfall. Default: Off."
      >
        <FieldRow label="Enable Inter-DC Shift" description="Requires a DC→DC lead time to be set in the Lead Times tab.">
          <Switch aria-label="Enable Inter-DC Shift" checked={draft.enabled} onCheckedChange={(v) => setDraft((p) => ({ ...p, enabled: v }))} />
        </FieldRow>
        <FieldRow label="Protected DC buffer" description="Cover protected on the source DC before releasing surplus. Baseline: 15 days.">
          <NumberField value={draft.protectedBufferDays} onChange={(v) => setDraft((p) => ({ ...p, protectedBufferDays: v ?? Number.NaN }))} suffix="days" error={bufferError} />
        </FieldRow>
        <FieldRow label="DC-gap cover trigger" description="A DC gap is identified only at or below this cover. Baseline: 15 days.">
          <NumberField value={draft.gapCoverTrigger} onChange={(v) => setDraft((p) => ({ ...p, gapCoverTrigger: v ?? Number.NaN }))} suffix="days" error={triggerError} />
        </FieldRow>
        <FieldRow label="Effective from">
          <Input aria-label="Effective from" type="date" value={draft.effectiveFrom} onChange={(e) => setDraft((p) => ({ ...p, effectiveFrom: e.target.value }))} />
        </FieldRow>
        <FieldRow label="Effective to" description="Leave blank for open-ended.">
          <Input aria-label="Effective to" type="date" value={draft.effectiveTo} onChange={(e) => setDraft((p) => ({ ...p, effectiveTo: e.target.value }))} />
        </FieldRow>

        {leadMissing ? (
          <p className="mt-3 text-xs text-amber-700">
            Inter-DC Shift can't be activated: no DC→DC lead time is set. Add one in the Lead Times tab first.
          </p>
        ) : null}

        <SectionFooter onSave={handleSave} onReset={() => setDraft(stored)} dirty={dirty} saveDisabled={hasErrors} />
      </AdminSectionCard>

      <AdminSectionCard title="Calculation context" description="System-controlled — shown for transparency, not editable.">
        <ul className="space-y-1.5 text-xs text-gray-600 list-disc pl-4">
          <li>DC surplus = stock remaining after protecting buffer cover and the DC's own store deficit requirement.</li>
          <li>Surplus is pooled by EAN and matched to short DCs proportionally; the remaining net shortfall passes to the vendor PO.</li>
          <li>The transfer plan serves the largest coverage need first, drawing from the DC with the largest surplus first (system-controlled).</li>
        </ul>
      </AdminSectionCard>
    </div>
  );
}
