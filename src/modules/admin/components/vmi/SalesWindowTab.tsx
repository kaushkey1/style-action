import { useState } from 'react';
import {
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import { useToast } from '@/hooks/useToast';
import { useVmiConfigStore } from '../../stores/useVmiConfigStore';
import type { SalesWindowApplicability, SalesWindowConfig } from '../../data/vmiConfigSeed';
import { AdminSectionCard, FieldRow, NumberField, SectionFooter } from './shared';

function keyOf(c: SalesWindowConfig): string {
  return JSON.stringify(c);
}

/** R2 — Sales Window & ADS. */
export function SalesWindowTab(): React.ReactNode {
  const stored = useVmiConfigStore((s) => s.salesWindow);
  const setSalesWindow = useVmiConfigStore((s) => s.setSalesWindow);
  const { success: toastSuccess, error: toastError } = useToast();

  const [draft, setDraft] = useState<SalesWindowConfig>(stored);
  const dirty = keyOf(draft) !== keyOf(stored);

  const windowError =
    draft.windowDays === null ||
    Number.isNaN(draft.windowDays) ||
    !Number.isInteger(draft.windowDays) ||
    draft.windowDays < 1
      ? 'Sales window must be a positive whole number'
      : undefined;

  const hasErrors = Boolean(windowError);

  function handleSave(): void {
    if (hasErrors) {
      toastError('Fix the highlighted fields before saving.');
      return;
    }
    setSalesWindow(draft);
    toastSuccess('Sales window configuration saved.');
  }

  return (
    <div className="space-y-4">
      <AdminSectionCard
        title="Sales Window & ADS"
        description="Controls the sales history considered when calculating Average Daily Sales (ADS / Rate of Sale)."
      >
        <FieldRow label="Sales window" description="Number of days of sales history used for ADS. Baseline: 30 days.">
          <NumberField
            value={draft.windowDays}
            onChange={(v) => setDraft((p) => ({ ...p, windowDays: v ?? Number.NaN }))}
            suffix="days"
            min={1}
            error={windowError}
          />
        </FieldRow>
        <FieldRow label="Applicability" description="Scope this window applies to.">
          <Select
            value={draft.applicability}
            onValueChange={(v) => setDraft((p) => ({ ...p, applicability: v as SalesWindowApplicability }))}
          >
            <SelectTrigger aria-label="Applicability" className="min-w-[11rem]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="global">Global default</SelectItem>
              <SelectItem value="category">Category override</SelectItem>
            </SelectContent>
          </Select>
        </FieldRow>
        <FieldRow label="Effective from">
          <Input
            aria-label="Effective from"
            type="date"
            value={draft.effectiveFrom}
            onChange={(e) => setDraft((p) => ({ ...p, effectiveFrom: e.target.value }))}
          />
        </FieldRow>
        <FieldRow label="Effective to" description="Leave blank for open-ended.">
          <Input
            aria-label="Effective to"
            type="date"
            value={draft.effectiveTo}
            onChange={(e) => setDraft((p) => ({ ...p, effectiveTo: e.target.value }))}
          />
        </FieldRow>

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
          <li>
            <span className="font-medium text-gray-900">ADS / RoS</span> = total units sold during the sales window ÷
            number of days in the window.
          </li>
          <li>ADS is calculated at EAN × store level and feeds STO, DC-gap and cover calculations.</li>
          <li>With no sales in the window, ADS is shown as 0 (no fallback unless a rule is separately approved).</li>
        </ul>
      </AdminSectionCard>
    </div>
  );
}
