import { useState } from 'react';
import { Input, Switch } from '@/components/ui';
import { useToast } from '@/hooks/useToast';
import { useVmiConfigStore } from '../../stores/useVmiConfigStore';
import type { InTransitConfig } from '../../data/vmiConfigSeed';
import { AdminSectionCard, FieldRow, NumberField, SectionFooter } from './shared';

function keyOf(c: InTransitConfig): string {
  return JSON.stringify(c);
}

/** R7 — In-Transit Treatment. */
export function InTransitTab(): React.ReactNode {
  const stored = useVmiConfigStore((s) => s.inTransit);
  const setInTransit = useVmiConfigStore((s) => s.setInTransit);
  const { success: toastSuccess, error: toastError } = useToast();

  const [draft, setDraft] = useState<InTransitConfig>(stored);
  const dirty = keyOf(draft) !== keyOf(stored);

  const lookbackError =
    draft.lookbackDays === null ||
    Number.isNaN(draft.lookbackDays) ||
    !Number.isInteger(draft.lookbackDays) ||
    draft.lookbackDays < 1
      ? 'Look-back must be a positive whole number'
      : undefined;

  const hasErrors = Boolean(lookbackError);

  function handleSave(): void {
    if (hasErrors) {
      toastError('Fix the highlighted fields before saving.');
      return;
    }
    setInTransit(draft);
    toastSuccess('In-transit configuration saved.');
  }

  return (
    <div className="space-y-4">
      <AdminSectionCard
        title="In-Transit Treatment"
        description="Considers stock already ordered but not yet received, to prevent repeat ordering on subsequent daily runs."
      >
        <FieldRow label="Include in-transit for STO" description="Deduct store-bound in-transit before generating STO.">
          <Switch aria-label="In-transit for STO" checked={draft.stoEnabled} onCheckedChange={(v) => setDraft((p) => ({ ...p, stoEnabled: v }))} />
        </FieldRow>
        <FieldRow label="Include in-transit for PO" description="Deduct DC-bound in-transit before generating PO.">
          <Switch aria-label="In-transit for PO" checked={draft.poEnabled} onCheckedChange={(v) => setDraft((p) => ({ ...p, poEnabled: v }))} />
        </FieldRow>
        <FieldRow label="Look-back period" description="Only orders within this window count as in-transit. Baseline: 45 days.">
          <NumberField value={draft.lookbackDays} onChange={(v) => setDraft((p) => ({ ...p, lookbackDays: v ?? Number.NaN }))} suffix="days" min={1} error={lookbackError} />
        </FieldRow>
        <FieldRow label="Effective from">
          <Input aria-label="Effective from" type="date" value={draft.effectiveFrom} onChange={(e) => setDraft((p) => ({ ...p, effectiveFrom: e.target.value }))} />
        </FieldRow>
        <FieldRow label="Effective to" description="Leave blank for open-ended.">
          <Input aria-label="Effective to" type="date" value={draft.effectiveTo} onChange={(e) => setDraft((p) => ({ ...p, effectiveTo: e.target.value }))} />
        </FieldRow>

        <SectionFooter onSave={handleSave} onReset={() => setDraft(stored)} dirty={dirty} saveDisabled={hasErrors} />
      </AdminSectionCard>

      <AdminSectionCard title="Calculation context" description="System-controlled — shown for transparency, not editable.">
        <ul className="space-y-1.5 text-xs text-gray-600 list-disc pl-4">
          <li>Eligible in-transit is treated as available stock so the same requirement isn't ordered again on the next run.</li>
          <li>Store-bound and DC-bound in-transit are shown separately; each recommendation shows the in-transit quantity applied.</li>
          <li>Eligible upstream order statuses are not defined in the source — any status filter must be separately agreed before it is added.</li>
        </ul>
      </AdminSectionCard>
    </div>
  );
}
