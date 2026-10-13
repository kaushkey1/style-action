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
} from '@/components/ui';
import { useToast } from '@/hooks/useToast';
import { MOCK_NOW, toCsv, downloadTextFile, isExpired, periodsOverlap } from '@/lib/utils';
import { useVmiConfigStore } from '../../stores/useVmiConfigStore';
import {
  OVERRIDE_PARAMETERS,
  OVERRIDE_PRECEDENCE,
  OVERRIDE_SCOPES,
  VMI_STATUSES,
  newRowId,
  type OverrideParameter,
  type OverrideRow,
  type OverrideScope,
  type VmiStatus,
} from '../../data/vmiConfigSeed';
import { AdminSectionCard, FieldRow, NumberField, SectionFooter } from './shared';

const TODAY_ISO = MOCK_NOW.toISOString().slice(0, 10);

function keyOf(rows: OverrideRow[]): string {
  return JSON.stringify(rows);
}

function scopeLabel(s: OverrideScope): string {
  return OVERRIDE_SCOPES.find((o) => o.value === s)?.label ?? s;
}

interface ResolveResult {
  defaultValue: number | null;
  resolvedValue: number | null;
  source: string;
}

/** Resolve the value that applies for a parameter + entity, honouring override precedence. */
function resolveValue(
  param: OverrideParameter,
  entity: string,
  defaultFor: Record<OverrideParameter, number | null>,
  rows: OverrideRow[],
): ResolveResult {
  const defaultValue = defaultFor[param];
  const q = entity.trim().toLowerCase();
  if (!q) return { defaultValue, resolvedValue: defaultValue, source: 'Global default' };
  const candidates = rows.filter(
    (r) =>
      r.status === 'Active' &&
      r.parameter === param &&
      r.entityRef.trim().toLowerCase() === q &&
      !isExpired(r.effectiveTo, TODAY_ISO),
  );
  for (const scope of OVERRIDE_PRECEDENCE) {
    const match = candidates.find((r) => r.scope === scope);
    if (match) return { defaultValue, resolvedValue: match.value, source: scopeLabel(scope) };
  }
  return { defaultValue, resolvedValue: defaultValue, source: 'Global default' };
}

/** R9 — Defaults & Override Resolution. */
export function OverridesTab(): React.ReactNode {
  const stored = useVmiConfigStore((s) => s.overrides);
  const setOverrides = useVmiConfigStore((s) => s.setOverrides);
  const recordAudit = useVmiConfigStore((s) => s.recordAudit);
  const salesWindow = useVmiConfigStore((s) => s.salesWindow);
  const storeSto = useVmiConfigStore((s) => s.storeSto);
  const dcPo = useVmiConfigStore((s) => s.dcPo);
  const leadTimes = useVmiConfigStore((s) => s.leadTimes);
  const inTransit = useVmiConfigStore((s) => s.inTransit);
  const { success: toastSuccess, error: toastError } = useToast();

  const [rows, setRows] = useState<OverrideRow[]>(stored);
  const dirty = keyOf(rows) !== keyOf(stored);

  const defaultFor = useMemo<Record<OverrideParameter, number | null>>(
    () => ({
      sales_window: salesWindow.windowDays,
      store_cover: storeSto.defaultTargetDayCover,
      dc_trigger: dcPo.defaultTrigger,
      dc_max_cover: dcPo.defaultMaxCover,
      dc_to_store_lead: leadTimes.dcToStore,
      vendor_to_dc_lead: leadTimes.vendorToDc,
      in_transit_lookback: inTransit.lookbackDays,
    }),
    [salesWindow, storeSto, dcPo, leadTimes, inTransit],
  );

  const errors = useMemo(() => {
    const map: Record<string, string> = {};
    const active = rows.filter((r) => r.status === 'Active');
    const sameKey = (a: OverrideRow, b: OverrideRow): boolean =>
      a.parameter === b.parameter && a.scope === b.scope && a.entityRef.trim().toLowerCase() === b.entityRef.trim().toLowerCase();
    for (const r of rows) {
      if (!r.entityRef.trim()) {
        map[r.id] = 'Entity reference is required';
      } else if (r.value === null || Number.isNaN(r.value)) {
        map[r.id] = 'Value is required';
      } else if (
        r.status === 'Active' &&
        active.some((o) => o.id !== r.id && sameKey(o, r) && periodsOverlap(r.effectiveFrom, r.effectiveTo, o.effectiveFrom, o.effectiveTo))
      ) {
        map[r.id] = 'Overlapping active override (same key + dates)';
      }
    }
    return map;
  }, [rows]);

  const hasErrors = Object.keys(errors).length > 0;

  function update(id: string, patch: Partial<OverrideRow>): void {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function addRow(): void {
    setRows((prev) => [
      {
        id: newRowId('ovr'),
        parameter: 'store_cover',
        scope: 'product_location',
        entityRef: '',
        value: null,
        reason: '',
        approver: '',
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
    setOverrides(rows);
    recordAudit('Defaults & Overrides', 'Saved', `${rows.length} override${rows.length === 1 ? '' : 's'}`);
    toastSuccess('Overrides saved.');
  }

  function handleExport(): void {
    const headers = ['parameter', 'scope', 'entityRef', 'value', 'reason', 'approver', 'status', 'effectiveFrom', 'effectiveTo'];
    const data = rows.map((r) => [r.parameter, r.scope, r.entityRef, r.value, r.reason, r.approver, r.status, r.effectiveFrom, r.effectiveTo]);
    downloadTextFile('vmi_overrides.csv', toCsv(headers, data));
  }

  return (
    <div className="space-y-4">
      <AdminSectionCard title="Global defaults" description="Resolved from the other configuration tabs. Overrides below take precedence per the rules.">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
          {OVERRIDE_PARAMETERS.map((p) => (
            <FieldRow key={p.value} label={p.label}>
              <span className="text-sm font-medium text-gray-900 tabular-nums">
                {defaultFor[p.value] ?? '—'}
              </span>
            </FieldRow>
          ))}
        </div>
      </AdminSectionCard>

      <ResolvePreview defaultFor={defaultFor} rows={rows} />

      <AdminSectionCard
        title="Overrides"
        description="Approved exceptions at product, store, DC or product+location level. Only one active value may resolve per parameter, scope and entity."
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleExport} disabled={rows.length === 0}>
              <Download className="w-3.5 h-3.5 mr-1" />
              Export
            </Button>
            <Button size="sm" variant="outline" onClick={addRow}>
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add override
            </Button>
          </div>
        }
      >
        {rows.length === 0 ? (
          <EmptyState title="No overrides" description="All calculations use the global defaults above." />
        ) : (
          <DataTable minWidth="1150px">
            <DataTableHeader>
              <DataTableHead>Parameter</DataTableHead>
              <DataTableHead>Scope</DataTableHead>
              <DataTableHead>Entity ref</DataTableHead>
              <DataTableHead align="right">Value</DataTableHead>
              <DataTableHead>Reason</DataTableHead>
              <DataTableHead>Approver</DataTableHead>
              <DataTableHead>Status</DataTableHead>
              <DataTableHead align="center">Remove</DataTableHead>
            </DataTableHeader>
            <DataTableBody>
              {rows.map((r) => {
                const err = errors[r.id];
                return (
                  <DataTableRow key={r.id}>
                    <DataTableCell>
                      <Select value={r.parameter} onValueChange={(v) => update(r.id, { parameter: v as OverrideParameter })}>
                        <SelectTrigger aria-label="Parameter" className="min-w-[11rem]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {OVERRIDE_PARAMETERS.map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </DataTableCell>
                    <DataTableCell>
                      <Select value={r.scope} onValueChange={(v) => update(r.id, { scope: v as OverrideScope })}>
                        <SelectTrigger aria-label="Scope" className="min-w-[10rem]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {OVERRIDE_SCOPES.map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </DataTableCell>
                    <DataTableCell>
                      <Input aria-label="Entity reference" value={r.entityRef} onChange={(e) => update(r.id, { entityRef: e.target.value })} className={err ? 'min-w-[10rem] border-red-400' : 'min-w-[10rem]'} placeholder="EAN / store / DC" />
                      {err ? <p className="mt-1 text-xs text-red-600">{err}</p> : null}
                    </DataTableCell>
                    <DataTableCell align="right">
                      <div className="flex justify-end">
                        <NumberField value={r.value} onChange={(v) => update(r.id, { value: v })} />
                      </div>
                    </DataTableCell>
                    <DataTableCell>
                      <Input aria-label="Reason" value={r.reason} onChange={(e) => update(r.id, { reason: e.target.value })} className="min-w-[9rem]" />
                    </DataTableCell>
                    <DataTableCell>
                      <Input aria-label="Approver" value={r.approver} onChange={(e) => update(r.id, { approver: e.target.value })} className="min-w-[7rem]" />
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
                    <DataTableCell align="center">
                      <button type="button" onClick={() => removeRow(r.id)} aria-label="Remove override" className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </DataTableCell>
                  </DataTableRow>
                );
              })}
            </DataTableBody>
          </DataTable>
        )}

        <p className="mt-3 text-xs text-gray-500">
          Precedence (highest → lowest): Product + Location → Location (store/DC) → Product → Global default.
        </p>

        <SectionFooter onSave={handleSave} onReset={() => setRows(stored)} dirty={dirty} saveDisabled={hasErrors} />
      </AdminSectionCard>
    </div>
  );
}

// ─── Resolved-value preview ───────────────────────────────────────────────────

function ResolvePreview({
  defaultFor,
  rows,
}: {
  defaultFor: Record<OverrideParameter, number | null>;
  rows: OverrideRow[];
}): React.ReactNode {
  const [param, setParam] = useState<OverrideParameter>('store_cover');
  const [entity, setEntity] = useState('');

  const result = resolveValue(param, entity, defaultFor, rows);

  return (
    <AdminSectionCard title="Resolved-value preview" description="Check which value applies for a parameter and entity, given the active overrides.">
      <div className="flex flex-col sm:flex-row sm:items-end gap-3">
        <div className="flex-1">
          <span className="block text-xs font-medium text-gray-700 mb-1">Parameter</span>
          <Select value={param} onValueChange={(v) => setParam(v as OverrideParameter)}>
            <SelectTrigger aria-label="Preview parameter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {OVERRIDE_PARAMETERS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1">
          <Input
            label="Entity ref"
            aria-label="Preview entity reference"
            value={entity}
            onChange={(e) => setEntity(e.target.value)}
            placeholder="e.g. 8901234500017 @ S001"
          />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <p className="text-xs text-gray-500">Inherited default</p>
          <p className="text-lg font-semibold text-gray-900 tabular-nums">{result.defaultValue ?? '—'}</p>
        </div>
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
          <p className="text-xs text-gray-500">Resolved value</p>
          <p className="text-lg font-semibold text-gray-900 tabular-nums">{result.resolvedValue ?? '—'}</p>
          <p className="text-xs text-gray-500 mt-0.5">from {result.source}</p>
        </div>
      </div>
    </AdminSectionCard>
  );
}
