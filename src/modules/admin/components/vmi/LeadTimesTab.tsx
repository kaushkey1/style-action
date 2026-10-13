import { useState } from 'react';
import { useToast } from '@/hooks/useToast';
import { useVmiConfigStore } from '../../stores/useVmiConfigStore';
import type { LeadTimesConfig } from '../../data/vmiConfigSeed';
import { AdminSectionCard, FieldRow, NumberField, SectionFooter } from './shared';

function keyOf(c: LeadTimesConfig): string {
  return JSON.stringify(c);
}

function requiredLeadError(v: number | null): string | undefined {
  if (v === null || Number.isNaN(v)) return 'Required';
  if (!Number.isInteger(v) || v < 0) return 'Must be a non-negative whole number';
  return undefined;
}

function optionalLeadError(v: number | null): string | undefined {
  if (v === null || Number.isNaN(v)) return undefined;
  if (!Number.isInteger(v) || v < 0) return 'Must be a non-negative whole number';
  return undefined;
}

/** R6 — Lead Times. */
export function LeadTimesTab(): React.ReactNode {
  const stored = useVmiConfigStore((s) => s.leadTimes);
  const setLeadTimes = useVmiConfigStore((s) => s.setLeadTimes);
  const { success: toastSuccess, error: toastError } = useToast();

  const [draft, setDraft] = useState<LeadTimesConfig>(stored);
  const dirty = keyOf(draft) !== keyOf(stored);

  const dcToStoreError = requiredLeadError(draft.dcToStore);
  const vendorToDcError = requiredLeadError(draft.vendorToDc);
  const dcToDcError = optionalLeadError(draft.dcToDc);
  const hasErrors = Boolean(dcToStoreError || vendorToDcError || dcToDcError);

  function handleSave(): void {
    if (hasErrors) {
      toastError('Fix the highlighted fields before saving.');
      return;
    }
    setLeadTimes(draft);
    toastSuccess('Lead-time configuration saved.');
  }

  return (
    <div className="space-y-4">
      <AdminSectionCard
        title="Lead Times"
        description="Days used to derive the expected delivery date for STO, PO and Inter-DC transfer recommendations."
      >
        <FieldRow label="DC → store lead time" description="Baseline: 4 days.">
          <NumberField
            value={draft.dcToStore}
            onChange={(v) => setDraft((p) => ({ ...p, dcToStore: v ?? Number.NaN }))}
            suffix="days"
            error={dcToStoreError}
          />
        </FieldRow>
        <FieldRow label="Vendor → DC lead time" description="Baseline: 7 days.">
          <NumberField
            value={draft.vendorToDc}
            onChange={(v) => setDraft((p) => ({ ...p, vendorToDc: v ?? Number.NaN }))}
            suffix="days"
            error={vendorToDcError}
          />
        </FieldRow>
        <FieldRow
          label="DC → DC lead time"
          description="Used by Inter-DC Shift. No documented default — leave blank if not set."
        >
          <NumberField
            value={draft.dcToDc}
            onChange={(v) => setDraft((p) => ({ ...p, dcToDc: v }))}
            suffix="days"
            error={dcToDcError}
          />
        </FieldRow>

        {draft.dcToDc === null ? (
          <p className="mt-3 text-xs text-amber-700">
            DC → DC lead time is not set — Inter-DC transfer delivery dates cannot be generated while Inter-DC Shift is
            enabled.
          </p>
        ) : null}

        <SectionFooter
          onSave={handleSave}
          onReset={() => setDraft(stored)}
          dirty={dirty}
          saveDisabled={hasErrors}
        />
      </AdminSectionCard>

      <AdminSectionCard
        title="Calculation context"
        description="System-controlled — shown for transparency, not editable."
      >
        <ul className="space-y-1.5 text-xs text-gray-600 list-disc pl-4">
          <li>STO delivery date = run date + DC → store lead time.</li>
          <li>PO delivery date = run date + vendor → DC lead time.</li>
          <li>Inter-DC delivery date = run date + DC → DC lead time.</li>
        </ul>
      </AdminSectionCard>
    </div>
  );
}
