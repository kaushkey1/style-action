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
  type EnrolmentRow,
  type VmiStatus,
} from '../../data/vmiConfigSeed';
import { AdminSectionCard, SectionFooter, StatusBadge } from './shared';

function keyOf(rows: EnrolmentRow[]): string {
  return JSON.stringify(rows);
}

/** R1 — Product & EAN Enrolment. */
export function EnrolmentTab(): React.ReactNode {
  const stored = useVmiConfigStore((s) => s.enrolment);
  const setEnrolment = useVmiConfigStore((s) => s.setEnrolment);
  const recordAudit = useVmiConfigStore((s) => s.recordAudit);
  const { success: toastSuccess, error: toastError } = useToast();

  const [rows, setRows] = useState<EnrolmentRow[]>(stored);
  const [search, setSearch] = useState('');

  const dirty = keyOf(rows) !== keyOf(stored);

  // Validation: EAN required, style required, and unique among active rows whose
  // effective periods overlap.
  const errors = useMemo(() => {
    const map: Record<string, string> = {};
    const active = rows.filter((r) => r.status === 'Active' && r.ean.trim());
    for (const r of rows) {
      if (!r.ean.trim()) {
        map[r.id] = 'EAN is required';
      } else if (!r.styleId.trim()) {
        map[r.id] = 'Style ID is required';
      } else if (
        r.status === 'Active' &&
        active.some(
          (o) =>
            o.id !== r.id &&
            o.ean.trim() === r.ean.trim() &&
            periodsOverlap(r.effectiveFrom, r.effectiveTo, o.effectiveFrom, o.effectiveTo),
        )
      ) {
        map[r.id] = 'Duplicate active EAN (overlapping dates)';
      }
    }
    return map;
  }, [rows]);

  const hasErrors = Object.keys(errors).length > 0;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.styleId.toLowerCase().includes(q) ||
        r.optionCode.toLowerCase().includes(q) ||
        r.ean.toLowerCase().includes(q) ||
        r.brand.toLowerCase().includes(q),
    );
  }, [rows, search]);

  function update(id: string, patch: Partial<EnrolmentRow>): void {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function addRow(): void {
    setRows((prev) => [
      {
        id: newRowId('enr'),
        styleId: '',
        optionCode: '',
        ean: '',
        brand: '',
        segment: '',
        autoReorder: true,
        status: 'Pending',
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
    setEnrolment(rows);
    recordAudit('Enrolment', 'Saved', `${rows.length} variant${rows.length === 1 ? '' : 's'}`);
    toastSuccess('Enrolment configuration saved.');
  }

  function handleReset(): void {
    setRows(stored);
    setSearch('');
  }

  function handleExport(): void {
    const headers = ['styleId', 'optionCode', 'ean', 'brand', 'segment', 'autoReorder', 'status', 'effectiveFrom', 'effectiveTo'];
    const data = rows.map((r) => [r.styleId, r.optionCode, r.ean, r.brand, r.segment, r.autoReorder, r.status, r.effectiveFrom, r.effectiveTo]);
    downloadTextFile('vmi_enrolment.csv', toCsv(headers, data));
  }

  return (
    <AdminSectionCard
      title="Product & EAN Enrolment"
      description="Enrol styles and their EAN variants into automated replenishment. EAN must be unique among active variants; edits create a new state pending approval."
      actions={
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handleExport} disabled={rows.length === 0}>
            <Download className="w-3.5 h-3.5 mr-1" />
            Export
          </Button>
          <Button size="sm" variant="outline" onClick={addRow}>
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add EAN
          </Button>
        </div>
      }
    >
      <div className="mb-3 max-w-xs">
        <FilterSearch value={search} onChange={setSearch} placeholder="Search style / option / EAN / brand..." />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title={rows.length === 0 ? 'No enrolled variants' : 'No matching variants'}
          description={rows.length === 0 ? 'Add an EAN to enrol it into automated replenishment.' : 'Try a different search.'}
        />
      ) : (
        <DataTable minWidth="1100px">
          <DataTableHeader>
            <DataTableHead>Style ID</DataTableHead>
            <DataTableHead>Option</DataTableHead>
            <DataTableHead>EAN</DataTableHead>
            <DataTableHead>Brand</DataTableHead>
            <DataTableHead>Segment</DataTableHead>
            <DataTableHead align="center">Auto-reorder</DataTableHead>
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
                    <Input
                      aria-label="Style ID"
                      value={r.styleId}
                      onChange={(e) => update(r.id, { styleId: e.target.value })}
                      className="min-w-[9rem]"
                    />
                  </DataTableCell>
                  <DataTableCell>
                    <Input
                      aria-label="Option code"
                      value={r.optionCode}
                      onChange={(e) => update(r.id, { optionCode: e.target.value })}
                      className="min-w-[9rem]"
                    />
                  </DataTableCell>
                  <DataTableCell>
                    <Input
                      aria-label="EAN"
                      value={r.ean}
                      onChange={(e) => update(r.id, { ean: e.target.value })}
                      className={err ? 'min-w-[8rem] border-red-400' : 'min-w-[8rem]'}
                    />
                    {err ? <p className="mt-1 text-xs text-red-600">{err}</p> : null}
                  </DataTableCell>
                  <DataTableCell>
                    <Input
                      aria-label="Brand"
                      value={r.brand}
                      onChange={(e) => update(r.id, { brand: e.target.value })}
                      className="min-w-[7rem]"
                    />
                  </DataTableCell>
                  <DataTableCell>
                    <Input
                      aria-label="Segment"
                      value={r.segment}
                      onChange={(e) => update(r.id, { segment: e.target.value })}
                      className="min-w-[8rem]"
                    />
                  </DataTableCell>
                  <DataTableCell align="center">
                    <Switch
                      aria-label="Automated reorder eligibility"
                      checked={r.autoReorder}
                      onCheckedChange={(v) => update(r.id, { autoReorder: v })}
                    />
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
                      aria-label={`Remove ${r.ean || 'variant'}`}
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

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-500">
        <span>Status legend:</span>
        <StatusBadge status="Active" />
        <StatusBadge status="Pending" />
        <StatusBadge status="Rejected" />
        <StatusBadge status="Inactive" />
      </div>

      <SectionFooter onSave={handleSave} onReset={handleReset} dirty={dirty} saveDisabled={hasErrors} />
    </AdminSectionCard>
  );
}
