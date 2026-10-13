import { useMemo, useState } from 'react';
import { Download, Plus, Trash2 } from 'lucide-react';
import {
  Alert,
  AlertContent,
  AlertDescription,
  AlertIcon,
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
  type VendorMoqRow,
  type VmiStatus,
} from '../../data/vmiConfigSeed';
import { AdminSectionCard, EanSelect, NumberField, SectionFooter } from './shared';

function keyOf(rows: VendorMoqRow[]): string {
  return JSON.stringify(rows);
}

/** R5 — Vendor & MOQ mapping. */
export function VendorMoqTab(): React.ReactNode {
  const stored = useVmiConfigStore((s) => s.vendorMoq);
  const enrolment = useVmiConfigStore((s) => s.enrolment);
  const setVendorMoq = useVmiConfigStore((s) => s.setVendorMoq);
  const recordAudit = useVmiConfigStore((s) => s.recordAudit);
  const { success: toastSuccess, error: toastError } = useToast();

  const [rows, setRows] = useState<VendorMoqRow[]>(stored);
  const [search, setSearch] = useState('');

  const dirty = keyOf(rows) !== keyOf(stored);

  const enrolledEans = useMemo(
    () => Array.from(new Set(enrolment.filter((e) => e.status !== 'Inactive').map((e) => e.ean.trim()).filter(Boolean))),
    [enrolment],
  );

  const errors = useMemo(() => {
    const map: Record<string, string> = {};
    const active = rows.filter((r) => r.status === 'Active');
    for (const r of rows) {
      if (!r.ean.trim()) {
        map[r.id] = 'EAN is required';
      } else if (!r.vendorCode.trim()) {
        map[r.id] = 'Vendor code is required';
      } else if (r.moq === null || Number.isNaN(r.moq) || !Number.isInteger(r.moq) || r.moq < 1) {
        map[r.id] = 'MOQ must be a positive whole number';
      } else if (
        r.status === 'Active' &&
        active.some(
          (o) =>
            o.id !== r.id &&
            o.ean.trim() === r.ean.trim() &&
            o.vendorCode.trim() === r.vendorCode.trim() &&
            periodsOverlap(r.effectiveFrom, r.effectiveTo, o.effectiveFrom, o.effectiveTo),
        )
      ) {
        map[r.id] = 'Duplicate active EAN + vendor (overlapping dates)';
      }
    }
    return map;
  }, [rows]);

  const hasErrors = Object.keys(errors).length > 0;

  // Enrolled, auto-reorder EANs with no active vendor mapping in the current draft.
  const missingVendor = useMemo(() => {
    const mapped = new Set(rows.filter((r) => r.status === 'Active').map((r) => r.ean.trim()));
    return enrolment
      .filter((e) => e.status === 'Active' && e.autoReorder && !mapped.has(e.ean.trim()))
      .map((e) => e.ean);
  }, [rows, enrolment]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.ean.toLowerCase().includes(q) ||
        r.vendorCode.toLowerCase().includes(q) ||
        r.vendorName.toLowerCase().includes(q),
    );
  }, [rows, search]);

  function update(id: string, patch: Partial<VendorMoqRow>): void {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function addRow(): void {
    setRows((prev) => [
      {
        id: newRowId('vmq'),
        ean: '',
        vendorCode: '',
        vendorName: '',
        moq: 1,
        status: 'Active',
        effectiveFrom: '',
        effectiveTo: '',
      },
      ...prev,
    ]);
  }

  function removeRow(id: string): void {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  function handleSave(): void {
    if (hasErrors) {
      toastError('Fix the highlighted rows before saving.');
      return;
    }
    setVendorMoq(rows);
    recordAudit('Vendor & MOQ', 'Saved', `${rows.length} mapping${rows.length === 1 ? '' : 's'}`);
    toastSuccess('Vendor & MOQ configuration saved.');
  }

  function handleReset(): void {
    setRows(stored);
    setSearch('');
  }

  function handleExport(): void {
    const headers = ['ean', 'vendorCode', 'vendorName', 'moq', 'status', 'effectiveFrom', 'effectiveTo'];
    const data = rows.map((r) => [r.ean, r.vendorCode, r.vendorName, r.moq, r.status, r.effectiveFrom, r.effectiveTo]);
    downloadTextFile('vmi_vendor_moq.csv', toCsv(headers, data));
  }

  return (
    <AdminSectionCard
      title="Vendor & MOQ"
      description="Map each PO-eligible EAN to a supplier and its minimum order quantity. Orders below MOQ are not placed."
      actions={
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handleExport} disabled={rows.length === 0}>
            <Download className="w-3.5 h-3.5 mr-1" />
            Export
          </Button>
          <Button size="sm" variant="outline" onClick={addRow}>
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add mapping
          </Button>
        </div>
      }
    >
      {missingVendor.length > 0 ? (
        <div className="mb-3">
          <Alert variant="warning" size="sm">
            <AlertIcon />
            <AlertContent>
              <AlertDescription>
                {missingVendor.length} enrolled EAN{missingVendor.length > 1 ? 's have' : ' has'} no active vendor/MOQ
                mapping: {missingVendor.slice(0, 6).join(', ')}
                {missingVendor.length > 6 ? ` +${missingVendor.length - 6} more` : ''}.
              </AlertDescription>
            </AlertContent>
          </Alert>
        </div>
      ) : null}

      <div className="mb-3 max-w-xs">
        <FilterSearch value={search} onChange={setSearch} placeholder="Search EAN / vendor..." />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title={rows.length === 0 ? 'No vendor mappings' : 'No matching mappings'}
          description={rows.length === 0 ? 'Add a vendor mapping for a PO-eligible EAN.' : 'Try a different search.'}
        />
      ) : (
        <DataTable minWidth="900px">
          <DataTableHeader>
            <DataTableHead>EAN</DataTableHead>
            <DataTableHead>Vendor code</DataTableHead>
            <DataTableHead>Vendor name</DataTableHead>
            <DataTableHead align="right">MOQ</DataTableHead>
            <DataTableHead>Status</DataTableHead>
            <DataTableHead>Eff. from</DataTableHead>
            <DataTableHead>Eff. to</DataTableHead>
            <DataTableHead align="center">Remove</DataTableHead>
          </DataTableHeader>
          <DataTableBody>
            {filtered.map((r) => {
              const err = errors[r.id];
              return (
                <DataTableRow key={r.id}>
                  <DataTableCell>
                    <EanSelect value={r.ean} options={enrolledEans} onChange={(v) => update(r.id, { ean: v })} error={Boolean(err)} />
                    {err ? <p className="mt-1 text-xs text-red-600">{err}</p> : null}
                  </DataTableCell>
                  <DataTableCell>
                    <Input
                      aria-label="Vendor code"
                      value={r.vendorCode}
                      onChange={(e) => update(r.id, { vendorCode: e.target.value })}
                      className="min-w-[8rem]"
                    />
                  </DataTableCell>
                  <DataTableCell>
                    <Input
                      aria-label="Vendor name"
                      value={r.vendorName}
                      onChange={(e) => update(r.id, { vendorName: e.target.value })}
                      className="min-w-[9rem]"
                    />
                  </DataTableCell>
                  <DataTableCell align="right">
                    <div className="flex justify-end">
                      <NumberField
                        value={r.moq}
                        onChange={(v) => update(r.id, { moq: v ?? Number.NaN })}
                        min={1}
                      />
                    </div>
                  </DataTableCell>
                  <DataTableCell>
                    <Select value={r.status} onValueChange={(v) => update(r.id, { status: v as VmiStatus })}>
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
                    <Input
                      aria-label="Effective from"
                      type="date"
                      value={r.effectiveFrom}
                      onChange={(e) => update(r.id, { effectiveFrom: e.target.value })}
                    />
                  </DataTableCell>
                  <DataTableCell>
                    <Input
                      aria-label="Effective to"
                      type="date"
                      value={r.effectiveTo}
                      onChange={(e) => update(r.id, { effectiveTo: e.target.value })}
                    />
                  </DataTableCell>
                  <DataTableCell align="center">
                    <button
                      type="button"
                      onClick={() => removeRow(r.id)}
                      aria-label={`Remove mapping for ${r.ean || 'EAN'}`}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
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
  );
}
