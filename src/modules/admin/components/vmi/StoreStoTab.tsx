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
  type StoreStoConfig,
  type StoreStoRow,
  type VmiStatus,
} from '../../data/vmiConfigSeed';
import { AdminSectionCard, EanSelect, FieldRow, NumberField, SectionFooter } from './shared';

function keyOf(c: StoreStoConfig): string {
  return JSON.stringify(c);
}

/** R3 — Store Replenishment / STO. */
export function StoreStoTab(): React.ReactNode {
  const stored = useVmiConfigStore((s) => s.storeSto);
  const enrolment = useVmiConfigStore((s) => s.enrolment);
  const setStoreSto = useVmiConfigStore((s) => s.setStoreSto);
  const recordAudit = useVmiConfigStore((s) => s.recordAudit);
  const { success: toastSuccess, error: toastError } = useToast();

  const [draft, setDraft] = useState<StoreStoConfig>(stored);
  const [search, setSearch] = useState('');
  const dirty = keyOf(draft) !== keyOf(stored);

  const enrolledEans = useMemo(
    () => Array.from(new Set(enrolment.filter((e) => e.status !== 'Inactive').map((e) => e.ean.trim()).filter(Boolean))),
    [enrolment],
  );

  const defaultError =
    draft.defaultTargetDayCover === null ||
    Number.isNaN(draft.defaultTargetDayCover) ||
    !Number.isInteger(draft.defaultTargetDayCover) ||
    draft.defaultTargetDayCover < 1
      ? 'Default cover must be a positive whole number'
      : undefined;

  const rowErrors = useMemo(() => {
    const map: Record<string, string> = {};
    const active = draft.rows.filter((r) => r.status === 'Active');
    for (const r of draft.rows) {
      if (!r.store.trim() || !r.ean.trim()) {
        map[r.id] = 'Store and EAN are required';
      } else if (r.targetDayCover === null || Number.isNaN(r.targetDayCover) || r.targetDayCover < 0 || !Number.isInteger(r.targetDayCover)) {
        map[r.id] = 'Cover must be zero or a positive whole number';
      } else if (r.status === 'Active' && r.targetDayCover === 0) {
        map[r.id] = 'Active rows require cover greater than zero';
      } else if (r.minQty === null || Number.isNaN(r.minQty) || r.minQty < 0 || !Number.isInteger(r.minQty)) {
        map[r.id] = 'Min qty must be zero or a positive whole number';
      } else if (
        r.status === 'Active' &&
        active.some(
          (o) =>
            o.id !== r.id &&
            o.store.trim() === r.store.trim() &&
            o.ean.trim() === r.ean.trim() &&
            periodsOverlap(r.effectiveFrom, r.effectiveTo, o.effectiveFrom, o.effectiveTo),
        )
      ) {
        map[r.id] = 'Duplicate active store + EAN (overlapping dates)';
      }
    }
    return map;
  }, [draft.rows]);

  const hasErrors = Boolean(defaultError) || Object.keys(rowErrors).length > 0;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return draft.rows;
    return draft.rows.filter((r) => r.store.toLowerCase().includes(q) || r.ean.toLowerCase().includes(q));
  }, [draft.rows, search]);

  function updateRow(id: string, patch: Partial<StoreStoRow>): void {
    setDraft((p) => ({ ...p, rows: p.rows.map((r) => (r.id === id ? { ...r, ...patch } : r)) }));
  }

  function addRow(): void {
    setDraft((p) => ({
      ...p,
      rows: [
        { id: newRowId('sto'), store: '', ean: '', targetDayCover: p.defaultTargetDayCover, minQty: 0, status: 'Active', effectiveFrom: '', effectiveTo: '' },
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
    setStoreSto(draft);
    recordAudit('Store / STO', 'Saved', `default ${draft.defaultTargetDayCover}d · ${draft.rows.length} rule${draft.rows.length === 1 ? '' : 's'}`);
    toastSuccess('Store / STO configuration saved.');
  }

  function handleReset(): void {
    setDraft(stored);
    setSearch('');
  }

  function handleExport(): void {
    const headers = ['store', 'ean', 'targetDayCover', 'minQty', 'status', 'effectiveFrom', 'effectiveTo'];
    const data = draft.rows.map((r) => [r.store, r.ean, r.targetDayCover, r.minQty, r.status, r.effectiveFrom, r.effectiveTo]);
    downloadTextFile('vmi_store_sto.csv', toCsv(headers, data));
  }

  return (
    <div className="space-y-4">
      <AdminSectionCard title="Store defaults" description="Applied to every store-product unless a specific rule below overrides it.">
        <FieldRow label="Store Target Day Cover" description="Baseline: 7 days.">
          <NumberField
            value={draft.defaultTargetDayCover}
            onChange={(v) => setDraft((p) => ({ ...p, defaultTargetDayCover: v ?? Number.NaN }))}
            suffix="days"
            min={1}
            error={defaultError}
          />
        </FieldRow>
      </AdminSectionCard>

      <AdminSectionCard
        title="Store-product rules"
        description="Per store × EAN Target Day Cover and minimum quantity (MBQ). Active rows require cover greater than zero."
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
          <FilterSearch value={search} onChange={setSearch} placeholder="Search store / EAN..." />
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title={draft.rows.length === 0 ? 'No store rules' : 'No matching rules'}
            description={draft.rows.length === 0 ? 'Stores without a rule use the default cover above.' : 'Try a different search.'}
          />
        ) : (
          <DataTable minWidth="880px">
            <DataTableHeader>
              <DataTableHead>Store</DataTableHead>
              <DataTableHead>EAN</DataTableHead>
              <DataTableHead align="right">Target cover</DataTableHead>
              <DataTableHead align="right">Min qty</DataTableHead>
              <DataTableHead>Status</DataTableHead>
              <DataTableHead>Eff. from</DataTableHead>
              <DataTableHead>Eff. to</DataTableHead>
              <DataTableHead align="center">Remove</DataTableHead>
            </DataTableHeader>
            <DataTableBody>
              {filtered.map((r) => {
                const err = rowErrors[r.id];
                return (
                  <DataTableRow key={r.id}>
                    <DataTableCell>
                      <Input aria-label="Store" value={r.store} onChange={(e) => updateRow(r.id, { store: e.target.value })} className={err ? 'min-w-[7rem] border-red-400' : 'min-w-[7rem]'} />
                      {err ? <p className="mt-1 text-xs text-red-600">{err}</p> : null}
                    </DataTableCell>
                    <DataTableCell>
                      <EanSelect value={r.ean} options={enrolledEans} onChange={(v) => updateRow(r.id, { ean: v })} error={Boolean(err)} />
                    </DataTableCell>
                    <DataTableCell align="right">
                      <div className="flex justify-end">
                        <NumberField value={r.targetDayCover} onChange={(v) => updateRow(r.id, { targetDayCover: v ?? Number.NaN })} suffix="d" />
                      </div>
                    </DataTableCell>
                    <DataTableCell align="right">
                      <div className="flex justify-end">
                        <NumberField value={r.minQty} onChange={(v) => updateRow(r.id, { minQty: v ?? Number.NaN })} />
                      </div>
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
                    <DataTableCell>
                      <Input aria-label="Effective to" type="date" value={r.effectiveTo} onChange={(e) => updateRow(r.id, { effectiveTo: e.target.value })} />
                    </DataTableCell>
                    <DataTableCell align="center">
                      <button type="button" onClick={() => removeRow(r.id)} aria-label={`Remove rule for ${r.store || 'store'}`} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
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
          <li>Required store stock = ADS × Store Target Day Cover, subject to the minimum quantity.</li>
          <li>Current store stock + eligible in-transit is deducted before the STO quantity is generated.</li>
          <li>Stores with the greatest need are served first until DC stock is exhausted; unfulfilled demand is reported as a shortfall.</li>
        </ul>
      </AdminSectionCard>
    </div>
  );
}
