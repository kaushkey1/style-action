import { useMemo, useState } from 'react';
import { Download, Plus, Trash2 } from 'lucide-react';
import {
  Button,
  DataTable,
  DataTableHeader,
  DataTableBody,
  DataTableRow,
  DataTableHead,
  DataTableCell,
  EmptyState,
  Input,
  Switch,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  FilterSearch,
} from '@/components/ui';
import { useToast } from '@/hooks/useToast';
import { toCsv, downloadTextFile, periodsOverlap } from '@/lib/utils';
import { useVmiConfigStore } from '../../stores/useVmiConfigStore';
import {
  VMI_STATUSES,
  newRowId,
  type DcPoConfig,
  type DcPoRow,
  type VmiStatus,
} from '../../data/vmiConfigSeed';
import { AdminSectionCard, EanSelect, FieldRow, NumberField, SectionFooter } from './shared';

function keyOf(c: DcPoConfig): string {
  return JSON.stringify(c);
}

function isNonNegInt(v: number | null): boolean {
  return v !== null && !Number.isNaN(v) && Number.isInteger(v) && v >= 0;
}

/** R4 — DC Replenishment & PO. */
export function DcPoTab(): React.ReactNode {
  const stored = useVmiConfigStore((s) => s.dcPo);
  const enrolment = useVmiConfigStore((s) => s.enrolment);
  const setDcPo = useVmiConfigStore((s) => s.setDcPo);
  const recordAudit = useVmiConfigStore((s) => s.recordAudit);
  const { success: toastSuccess, error: toastError } = useToast();

  const [draft, setDraft] = useState<DcPoConfig>(stored);
  const [search, setSearch] = useState('');
  const dirty = keyOf(draft) !== keyOf(stored);

  const enrolledEans = useMemo(
    () => Array.from(new Set(enrolment.filter((e) => e.status !== 'Inactive').map((e) => e.ean.trim()).filter(Boolean))),
    [enrolment],
  );

  const defaultError = useMemo(() => {
    if (!isNonNegInt(draft.defaultTrigger) || !isNonNegInt(draft.defaultMaxCover)) {
      return 'Trigger and max cover must be zero or positive whole numbers';
    }
    if ((draft.defaultMaxCover ?? 0) < (draft.defaultTrigger ?? 0)) {
      return 'Max cover must be greater than or equal to the trigger';
    }
    return undefined;
  }, [draft.defaultTrigger, draft.defaultMaxCover]);

  const rowErrors = useMemo(() => {
    const map: Record<string, string> = {};
    const active = draft.rows.filter((r) => r.status === 'Active');
    for (const r of draft.rows) {
      if (!r.dc.trim() || !r.ean.trim()) {
        map[r.id] = 'DC and EAN are required';
      } else if (!isNonNegInt(r.trigger) || !isNonNegInt(r.maxCover) || !isNonNegInt(r.minQty)) {
        map[r.id] = 'Cover and min qty must be zero or positive whole numbers';
      } else if ((r.maxCover ?? 0) < (r.trigger ?? 0)) {
        map[r.id] = 'Max cover must be ≥ trigger';
      } else if (
        r.status === 'Active' &&
        active.some(
          (o) =>
            o.id !== r.id &&
            o.dc.trim() === r.dc.trim() &&
            o.ean.trim() === r.ean.trim() &&
            periodsOverlap(r.effectiveFrom, r.effectiveTo, o.effectiveFrom, o.effectiveTo),
        )
      ) {
        map[r.id] = 'Duplicate active DC + EAN (overlapping dates)';
      }
    }
    return map;
  }, [draft.rows]);

  const hasErrors = Boolean(defaultError) || Object.keys(rowErrors).length > 0;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return draft.rows;
    return draft.rows.filter((r) => r.dc.toLowerCase().includes(q) || r.ean.toLowerCase().includes(q));
  }, [draft.rows, search]);

  function updateRow(id: string, patch: Partial<DcPoRow>): void {
    setDraft((p) => ({ ...p, rows: p.rows.map((r) => (r.id === id ? { ...r, ...patch } : r)) }));
  }

  function addRow(): void {
    setDraft((p) => ({
      ...p,
      rows: [
        { id: newRowId('dcpo'), dc: '', ean: '', trigger: p.defaultTrigger, maxCover: p.defaultMaxCover, minQty: 0, poEnabled: p.poEnabled, status: 'Active', effectiveFrom: '', effectiveTo: '' },
        ...p.rows,
      ],
    }));
  }

  function removeRow(id: string): void {
    setDraft((p) => ({ ...p, rows: p.rows.filter((r) => r.id !== id) }));
  }

  function handleSave(): void {
    if (hasErrors) {
      toastError('Fix the highlighted fields before saving.');
      return;
    }
    setDcPo(draft);
    recordAudit('DC / PO', 'Saved', `trigger ${draft.defaultTrigger}d / max ${draft.defaultMaxCover}d · ${draft.rows.length} rule${draft.rows.length === 1 ? '' : 's'}`);
    toastSuccess('DC / PO configuration saved.');
  }

  function handleReset(): void {
    setDraft(stored);
    setSearch('');
  }

  function handleExport(): void {
    const headers = ['dc', 'ean', 'trigger', 'maxCover', 'minQty', 'poEnabled', 'status', 'effectiveFrom', 'effectiveTo'];
    const data = draft.rows.map((r) => [r.dc, r.ean, r.trigger, r.maxCover, r.minQty, r.poEnabled, r.status, r.effectiveFrom, r.effectiveTo]);
    downloadTextFile('vmi_dc_po.csv', toCsv(headers, data));
  }

  return (
    <div className="space-y-4">
      <AdminSectionCard title="DC defaults" description="Applied to every DC-product unless a specific rule below overrides it. PO runs after STO.">
        <FieldRow label="DC target cover / PO trigger" description="Baseline: 15 days.">
          <NumberField value={draft.defaultTrigger} onChange={(v) => setDraft((p) => ({ ...p, defaultTrigger: v ?? Number.NaN }))} suffix="days" />
        </FieldRow>
        <FieldRow label="DC maximum cover" description="Top-up ceiling. Baseline: 28 days. Must be ≥ trigger.">
          <NumberField value={draft.defaultMaxCover} onChange={(v) => setDraft((p) => ({ ...p, defaultMaxCover: v ?? Number.NaN }))} suffix="days" error={defaultError} />
        </FieldRow>
        <FieldRow label="PO enabled" description="Master switch for vendor purchase-order generation.">
          <Switch aria-label="PO enabled" checked={draft.poEnabled} onCheckedChange={(v) => setDraft((p) => ({ ...p, poEnabled: v }))} />
        </FieldRow>
      </AdminSectionCard>

      <AdminSectionCard
        title="DC-product rules"
        description="Per DC × EAN trigger, max cover, minimum quantity and PO enablement."
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleExport} disabled={draft.rows.length === 0}>
              <Download className="w-3.5 h-3.5 mr-1" />
              Export
            </Button>
            <Button size="sm" variant="outline" onClick={addRow}>
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add rule
            </Button>
          </div>
        }
      >
        <div className="mb-3 max-w-xs">
          <FilterSearch value={search} onChange={setSearch} placeholder="Search DC / EAN..." />
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title={draft.rows.length === 0 ? 'No DC rules' : 'No matching rules'}
            description={draft.rows.length === 0 ? 'DCs without a rule use the defaults above.' : 'Try a different search.'}
          />
        ) : (
          <DataTable minWidth="1000px">
            <DataTableHeader>
              <DataTableHead>DC</DataTableHead>
              <DataTableHead>EAN</DataTableHead>
              <DataTableHead align="right">Trigger</DataTableHead>
              <DataTableHead align="right">Max cover</DataTableHead>
              <DataTableHead align="right">Min qty</DataTableHead>
              <DataTableHead align="center">PO</DataTableHead>
              <DataTableHead>Status</DataTableHead>
              <DataTableHead>Eff. from</DataTableHead>
              <DataTableHead align="center">Remove</DataTableHead>
            </DataTableHeader>
            <DataTableBody>
              {filtered.map((r) => {
                const err = rowErrors[r.id];
                return (
                  <DataTableRow key={r.id}>
                    <DataTableCell>
                      <Input aria-label="DC" value={r.dc} onChange={(e) => updateRow(r.id, { dc: e.target.value })} className={err ? 'min-w-[7.5rem] border-red-400' : 'min-w-[7.5rem]'} />
                      {err ? <p className="mt-1 text-xs text-red-600">{err}</p> : null}
                    </DataTableCell>
                    <DataTableCell>
                      <EanSelect value={r.ean} options={enrolledEans} onChange={(v) => updateRow(r.id, { ean: v })} error={Boolean(err)} />
                    </DataTableCell>
                    <DataTableCell align="right">
                      <div className="flex justify-end">
                        <NumberField value={r.trigger} onChange={(v) => updateRow(r.id, { trigger: v ?? Number.NaN })} suffix="d" />
                      </div>
                    </DataTableCell>
                    <DataTableCell align="right">
                      <div className="flex justify-end">
                        <NumberField value={r.maxCover} onChange={(v) => updateRow(r.id, { maxCover: v ?? Number.NaN })} suffix="d" />
                      </div>
                    </DataTableCell>
                    <DataTableCell align="right">
                      <div className="flex justify-end">
                        <NumberField value={r.minQty} onChange={(v) => updateRow(r.id, { minQty: v ?? Number.NaN })} />
                      </div>
                    </DataTableCell>
                    <DataTableCell align="center">
                      <Switch aria-label="PO enabled" checked={r.poEnabled} onCheckedChange={(v) => updateRow(r.id, { poEnabled: v })} />
                    </DataTableCell>
                    <DataTableCell>
                      <Select value={r.status} onValueChange={(v) => updateRow(r.id, { status: v as VmiStatus })}>
                        <SelectTrigger aria-label="Status" className="min-w-[7.5rem]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {VMI_STATUSES.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </DataTableCell>
                    <DataTableCell>
                      <Input aria-label="Effective from" type="date" value={r.effectiveFrom} onChange={(e) => updateRow(r.id, { effectiveFrom: e.target.value })} />
                    </DataTableCell>
                    <DataTableCell align="center">
                      <button type="button" onClick={() => removeRow(r.id)} aria-label={`Remove rule for ${r.dc || 'DC'}`} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </DataTableCell>
                  </DataTableRow>
                );
              })}
            </DataTableBody>
          </DataTable>
        )}

        <SectionFooter onSave={handleSave} onReset={handleReset} dirty={dirty} saveDisabled={hasErrors} />
      </AdminSectionCard>

      <AdminSectionCard title="Calculation context" description="System-controlled — shown for transparency, not editable.">
        <ul className="space-y-1.5 text-xs text-gray-600 list-disc pl-4">
          <li>PO is calculated after STO. The DC is topped up to the maximum cover, net of remaining stock and eligible vendor→DC in-transit.</li>
          <li>Orders below the vendor MOQ are skipped.</li>
          <li>When Inter-DC Shift is enabled, the vendor PO uses only the net shortfall remaining after internal DC redistribution.</li>
        </ul>
      </AdminSectionCard>
    </div>
  );
}
