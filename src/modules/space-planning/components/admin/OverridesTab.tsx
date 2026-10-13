import { useRef, useState } from 'react';
import { Check, Download, Plus, Search, Upload, X } from 'lucide-react';
import {
  Badge,
  Button,
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeader,
  DataTableRow,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  EmptyState,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Spinner,
} from '@/components/ui';
import { useToast } from '@/hooks/useToast';
import { formatDate } from '@/lib/utils';
import {
  parseAdminApiError,
  useAdminOverrides,
  useBulkOverrides,
  useCreateOverride,
  useOverridePreview,
  useOverrideStatus,
  type AdminOverrideCreate,
  type AdminOverrideRule,
} from '../../api/adminConfigApi';
import { useAdminConfigStore } from '../../stores/useAdminConfigStore';
import { ADMIN_CATEGORIES, ADMIN_FORMATS, AdminSectionCard, NumberField, PendingEngineBadge } from './adminConfigShared';

const RULE_TYPES = [
  { id: 'deduction', label: 'Deduction' },
  { id: 'efficiency_band', label: 'Efficiency Band' },
  { id: 'pod_bound', label: 'Pod Bound' },
  { id: 'bor', label: 'Best of Rest' },
  { id: 'lft_option', label: 'LFT & Options' },
];
const DEDUCTION_LINES = ['non_apps', 'accessories', 'innerwear', 'lingerie', 'footwear'];
const STATUS_VARIANT: Record<string, 'default' | 'warning' | 'success' | 'error'> = {
  submitted: 'warning',
  approved: 'success',
  rejected: 'error',
  inactive: 'default',
};

const CSV_HEADER =
  'rule_type,applies_to,category,pod_id,line,method,payload,effective_from,effective_to';
const CSV_EXAMPLES = [
  'efficiency_band,TRENDS_JUNIOR,KW,,,,min=0.7;max=1.0,2026-08-01,',
  'deduction,TRENDS_MAN,,,footwear,percentage,value=0.08,2026-08-01,2026-12-31',
  'bor,TRENDS_WOMAN,,,,,rate=0.12;enabled=true,2026-08-01,',
  'pod_bound,TRENDS_FULL,KW,20. Kids: Boys,,,min_sqft=400;max_sqft=900;cap_type=soft,2026-08-01,',
];

function parsePayload(text: string): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const pair of text.split(';')) {
    const [k, v] = pair.split('=');
    if (!k || v === undefined) continue;
    const key = k.trim();
    const raw = v.trim();
    if (raw === 'true' || raw === 'false') out[key] = raw === 'true';
    else if (raw !== '' && !Number.isNaN(Number(raw))) out[key] = Number(raw);
    else out[key] = raw;
  }
  return out;
}

function payloadSummary(rule: AdminOverrideRule): string {
  return Object.entries(rule.payload)
    .map(([k, v]) => `${k}=${String(v)}`)
    .join(' · ');
}

interface AddRuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function AddRuleDialog({ open, onOpenChange }: AddRuleDialogProps): React.ReactNode {
  const podMaster = useAdminConfigStore((s) => s.draft?.pod_master);
  const createMutation = useCreateOverride();
  const { success: toastSuccess, error: toastError } = useToast();

  const [ruleType, setRuleType] = useState('efficiency_band');
  const [appliesTo, setAppliesTo] = useState('TRENDS_FULL');
  const [category, setCategory] = useState('KW');
  const [podId, setPodId] = useState('');
  const [line, setLine] = useState('non_apps');
  const [method, setMethod] = useState('percentage');
  const [values, setValues] = useState<Record<string, number>>({});
  const [capType, setCapType] = useState('hard');
  const [borEnabled, setBorEnabled] = useState(true);
  const [effFrom, setEffFrom] = useState('');
  const [effTo, setEffTo] = useState('');
  const [remarks, setRemarks] = useState('');

  const setValue = (k: string, v: number): void => setValues((prev) => ({ ...prev, [k]: v }));

  const buildPayload = (): Record<string, unknown> => {
    switch (ruleType) {
      case 'deduction':
        return { value: values.value ?? 0 };
      case 'efficiency_band':
        return { min: values.min ?? 0, max: values.max ?? 0 };
      case 'pod_bound':
        return {
          min_sqft: values.min_sqft ?? 0,
          max_sqft: values.max_sqft ?? 0,
          cap_type: capType,
        };
      case 'bor':
        return { rate: values.rate ?? 0, enabled: borEnabled };
      case 'lft_option':
        return {
          lft_factor: values.lft_factor ?? 0,
          options_per_lft: values.options_per_lft ?? 0,
          min_options: values.min_options ?? 0,
          max_options: values.max_options ?? 0,
        };
      default:
        return {};
    }
  };

  const handleSubmit = (): void => {
    const body: AdminOverrideCreate = {
      rule_type: ruleType,
      applies_to: appliesTo,
      category: ['efficiency_band', 'pod_bound', 'lft_option'].includes(ruleType) ? category : '',
      pod_id: ruleType === 'pod_bound' ? podId : '',
      line: ruleType === 'deduction' ? line : '',
      method: ruleType === 'deduction' ? method : null,
      payload: buildPayload(),
      effective_from: effFrom,
      effective_to: effTo || null,
      remarks: remarks || null,
    };
    createMutation.mutate(body, {
      onSuccess: () => {
        toastSuccess('Override submitted for approval');
        onOpenChange(false);
      },
      onError: (e) => {
        const parsed = parseAdminApiError(e);
        toastError(
          parsed.fieldErrors.map((f) => f.error).join('; ') || parsed.message,
          'Could not submit',
        );
      },
    });
  };

  const pods = (podMaster ?? []).filter((p) => p.category === category);
  const numField = (key: string, label: string): React.ReactNode => (
    <NumberField
      key={key}
      label={label}
      value={values[key] ?? 0}
      onChange={(v) => setValue(key, v)}
    />
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add format override</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Rule type</p>
              <Select value={ruleType} onValueChange={setRuleType}>
                <SelectTrigger className="h-8 text-sm" aria-label="Rule type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RULE_TYPES.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Format</p>
              <Select value={appliesTo} onValueChange={setAppliesTo}>
                <SelectTrigger className="h-8 text-sm" aria-label="Format">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ADMIN_FORMATS.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {['efficiency_band', 'pod_bound', 'lft_option'].includes(ruleType) && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Category</p>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-8 text-sm w-32" aria-label="Category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ADMIN_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {ruleType === 'pod_bound' && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Pod</p>
              <Select value={podId} onValueChange={setPodId}>
                <SelectTrigger className="h-8 text-sm" aria-label="Pod">
                  <SelectValue placeholder="Select pod…" />
                </SelectTrigger>
                <SelectContent>
                  {pods.map((p) => (
                    <SelectItem key={p.pod_id} value={p.pod_id}>
                      {p.pod_id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {ruleType === 'deduction' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Line</p>
                <Select value={line} onValueChange={setLine}>
                  <SelectTrigger className="h-8 text-sm" aria-label="Deduction line">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEDUCTION_LINES.map((l) => (
                      <SelectItem key={l} value={l}>
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Method</p>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger className="h-8 text-sm" aria-label="Method">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (fraction)</SelectItem>
                    <SelectItem value="fixed_sqft">Fixed sqft</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {ruleType === 'deduction' &&
              numField('value', method === 'percentage' ? 'Value (0–1 fraction)' : 'Value (sqft)')}
            {ruleType === 'efficiency_band' && (
              <>
                {numField('min', 'Min')}
                {numField('max', 'Max')}
              </>
            )}
            {ruleType === 'pod_bound' && (
              <>
                {numField('min_sqft', 'Min sqft')}
                {numField('max_sqft', 'Max sqft')}
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Cap type</p>
                  <Select value={capType} onValueChange={setCapType}>
                    <SelectTrigger className="h-8 text-sm" aria-label="Cap type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hard">Hard (blocks allocation)</SelectItem>
                      <SelectItem value="soft">Soft (warning only)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            {ruleType === 'bor' && (
              <>
                {numField('rate', 'BoR rate (0–0.5)')}
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Enabled</p>
                  <Select
                    value={borEnabled ? 'yes' : 'no'}
                    onValueChange={(v) => setBorEnabled(v === 'yes')}
                  >
                    <SelectTrigger className="h-8 text-sm w-24" aria-label="BoR enabled">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            {ruleType === 'lft_option' && (
              <>
                {numField('lft_factor', 'Sqft → LFT factor')}
                {numField('options_per_lft', 'Options per LFT')}
                {numField('min_options', 'Min options')}
                {numField('max_options', 'Max options')}
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Effective from</p>
              <Input
                type="date"
                aria-label="Effective from"
                value={effFrom}
                onChange={(e) => setEffFrom(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Effective to (optional)</p>
              <Input
                type="date"
                aria-label="Effective to"
                value={effTo}
                onChange={(e) => setEffTo(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
          </div>
          <Input
            aria-label="Remarks"
            placeholder="Remarks (optional)"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <DialogFooter className="mt-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!effFrom || createMutation.isPending}>
            {createMutation.isPending ? 'Submitting…' : 'Submit for approval'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StorePreview(): React.ReactNode {
  const [storeInput, setStoreInput] = useState('');
  const [storeCode, setStoreCode] = useState('');
  const previewQuery = useOverridePreview(storeCode);

  return (
    <AdminSectionCard
      title="Preview — resolve for a store"
      badge={<PendingEngineBadge />}
      actions={
        <div className="flex items-center gap-2">
          <Input
            aria-label="Store code"
            placeholder="Store code…"
            value={storeInput}
            onChange={(e) => setStoreInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setStoreCode(storeInput.trim());
            }}
            className="h-8 w-36 text-sm"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setStoreCode(storeInput.trim())}
            disabled={!storeInput.trim()}
          >
            <Search className="w-4 h-4 mr-1" />
            Resolve
          </Button>
        </div>
      }
    >
      {!storeCode ? (
        <p className="text-sm text-gray-500">
          Enter a store code to see the effective config (format override wins over global) and
          the deduction waterfall on its carpet area.
        </p>
      ) : previewQuery.isPending ? (
        <div className="flex justify-center py-6">
          <Spinner />
        </div>
      ) : previewQuery.isError ? (
        <p className="text-sm text-red-600">
          {parseAdminApiError(previewQuery.error).message}
        </p>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            <span className="font-medium text-gray-900">{previewQuery.data.store_code}</span>
            {' · '}
            {previewQuery.data.format} · carpet{' '}
            {previewQuery.data.carpet_area_sqft.toLocaleString()} sqft · resolved on{' '}
            {formatDate(previewQuery.data.resolved_on)}
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
                Efficiency bands
              </p>
              <ul className="space-y-0.5">
                {previewQuery.data.bands.map((b) => (
                  <li key={b.category} className="text-sm text-gray-700">
                    {b.category}: {b.min} – {b.max}{' '}
                    {b.source === 'override' ? (
                      <Badge variant="info" size="sm">
                        override
                      </Badge>
                    ) : (
                      <span className="text-gray-400">global</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
                Deduction waterfall
              </p>
              <ul className="space-y-0.5">
                {previewQuery.data.deductions.waterfall.map((w) => (
                  <li key={w.line} className="text-sm text-gray-700">
                    {w.line} ({w.method === 'percentage' ? `${w.value}` : `${w.value} sqft`}
                    {w.source === 'override' ? ', override' : ''}): −
                    {w.deducted_sqft.toLocaleString()} → {w.remaining_sqft.toLocaleString()} sqft
                  </li>
                ))}
              </ul>
              <p className="text-sm font-medium text-gray-900 mt-1">
                Final remaining: {previewQuery.data.deductions.final_remaining_sqft.toLocaleString()} sqft
              </p>
            </div>
          </div>
        </div>
      )}
    </AdminSectionCard>
  );
}

export function OverridesTab(): React.ReactNode {
  const overridesQuery = useAdminOverrides();
  const statusMutation = useOverrideStatus();
  const bulkMutation = useBulkOverrides();
  const { success: toastSuccess, error: toastError } = useToast();

  const [addOpen, setAddOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState('__all__');
  const [statusFilter, setStatusFilter] = useState('__all__');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleStatus = (rule: AdminOverrideRule, action: 'approve' | 'reject' | 'deactivate'): void => {
    statusMutation.mutate(
      { ruleId: rule.rule_id, action },
      {
        onSuccess: () => toastSuccess(`Rule ${action}d`),
        onError: (e) => toastError(parseAdminApiError(e).message, `Could not ${action}`),
      },
    );
  };

  const downloadTemplate = (): void => {
    const csv = [CSV_HEADER, ...CSV_EXAMPLES].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'space-planning-overrides-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleUpload = (file: File): void => {
    void file.text().then((text) => {
      const lines = text.split(/\r?\n/).filter((l) => l.trim());
      const rows = lines
        .filter((l) => !l.startsWith('rule_type'))
        .map((l) => {
          const [ruleType, appliesTo, category, podId, line, method, payload, effFrom, effTo] =
            l.split(',');
          const row: AdminOverrideCreate = {
            rule_type: (ruleType ?? '').trim(),
            applies_to: (appliesTo ?? '').trim(),
            category: (category ?? '').trim(),
            pod_id: (podId ?? '').trim(),
            line: (line ?? '').trim(),
            method: (method ?? '').trim() || null,
            payload: parsePayload(payload ?? ''),
            effective_from: (effFrom ?? '').trim(),
            effective_to: (effTo ?? '').trim() || null,
          };
          return row;
        });
      if (rows.length === 0) {
        toastError('No data rows found in the file');
        return;
      }
      bulkMutation.mutate(
        { rows },
        {
          onSuccess: (res) => toastSuccess(`${res.created} rules submitted for approval`),
          onError: (e) => {
            const parsed = parseAdminApiError(e);
            const rowErrors = parsed.fieldErrors.length
              ? parsed.fieldErrors.map((f) => f.error).join('; ')
              : parsed.message;
            toastError(rowErrors, 'Upload rejected — nothing was created');
          },
        },
      );
    });
  };

  const rules = (overridesQuery.data ?? []).filter(
    (r) =>
      (typeFilter === '__all__' || r.rule_type === typeFilter) &&
      (statusFilter === '__all__' || r.status === statusFilter),
  );

  return (
    <div className="space-y-4">
      <AdminSectionCard
        title="Format Overrides"
        badge={<PendingEngineBadge />}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-8 w-40 text-sm" aria-label="Filter by type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All types</SelectItem>
                {RULE_TYPES.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 w-36 text-sm" aria-label="Filter by status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All statuses</SelectItem>
                {Object.keys(STATUS_VARIANT).map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={downloadTemplate}>
              <Download className="w-4 h-4 mr-1" />
              Template
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileRef.current?.click()}
              disabled={bulkMutation.isPending}
            >
              <Upload className="w-4 h-4 mr-1" />
              {bulkMutation.isPending ? 'Uploading…' : 'Upload CSV'}
            </Button>
            <Input
              ref={fileRef}
              type="file"
              accept=".csv"
              className="hidden"
              aria-label="Upload overrides CSV"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleUpload(f);
                e.target.value = '';
              }}
            />
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Add rule
            </Button>
          </div>
        }
      >
        <p className="text-xs text-gray-500 mb-3">
          Rules override the global config for one store format, within their effective window.
          New rules need approval by a second user (maker-checker). Applied to engine runs after
          the engine update.
        </p>
        {overridesQuery.isPending ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : overridesQuery.isError ? (
          <p className="text-sm text-red-600">Failed to load rules.</p>
        ) : rules.length === 0 ? (
          <EmptyState
            title="No override rules"
            description="Add a rule to vary config by store format from a given date."
          />
        ) : (
          <div className="overflow-x-auto -mx-1 px-1">
            <DataTable className="min-w-[980px]">
              <DataTableHeader>
                  <DataTableHead>Type</DataTableHead>
                  <DataTableHead>Format</DataTableHead>
                  <DataTableHead>Target</DataTableHead>
                  <DataTableHead>Values</DataTableHead>
                  <DataTableHead>Effective</DataTableHead>
                  <DataTableHead>Status</DataTableHead>
                  <DataTableHead>By</DataTableHead>
                  <DataTableHead>Actions</DataTableHead>
                </DataTableHeader>
              <DataTableBody>
                {rules.map((r) => (
                  <DataTableRow key={r.rule_id}>
                    <DataTableCell className="text-gray-700 whitespace-nowrap">
                      {RULE_TYPES.find((t) => t.id === r.rule_type)?.label ?? r.rule_type}
                    </DataTableCell>
                    <DataTableCell className="text-gray-700">{r.applies_to}</DataTableCell>
                    <DataTableCell className="text-gray-500">
                      {[r.category, r.pod_id, r.line, r.method].filter(Boolean).join(' · ') || '—'}
                    </DataTableCell>
                    <DataTableCell className="text-gray-700">{payloadSummary(r)}</DataTableCell>
                    <DataTableCell className="text-gray-500 whitespace-nowrap">
                      {formatDate(r.effective_from)}
                      {r.effective_to ? ` – ${formatDate(r.effective_to)}` : ' →'}
                    </DataTableCell>
                    <DataTableCell>
                      <Badge variant={STATUS_VARIANT[r.status] ?? 'default'} size="sm">
                        {r.status}
                      </Badge>
                    </DataTableCell>
                    <DataTableCell className="text-gray-500">{r.created_by ?? '—'}</DataTableCell>
                    <DataTableCell>
                      <div className="flex items-center gap-1">
                        {r.status === 'submitted' && (
                          <>
                            <button
                              type="button"
                              aria-label={`Approve rule ${r.rule_id}`}
                              onClick={() => handleStatus(r, 'approve')}
                              className="p-1.5 rounded-lg text-green-600 hover:bg-green-50"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              aria-label={`Reject rule ${r.rule_id}`}
                              onClick={() => handleStatus(r, 'reject')}
                              className="p-1.5 rounded-lg text-red-600 hover:bg-red-50"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {r.status === 'approved' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatus(r, 'deactivate')}
                          >
                            Deactivate
                          </Button>
                        )}
                      </div>
                    </DataTableCell>
                  </DataTableRow>
                ))}
              </DataTableBody>
            </DataTable>
          </div>
        )}
      </AdminSectionCard>

      <StorePreview />

      <AddRuleDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}
