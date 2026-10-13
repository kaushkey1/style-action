import { ChevronDown, ChevronUp } from 'lucide-react';
import {
  Label,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import { useAdminConfigStore } from '../../stores/useAdminConfigStore';
import {
  AdminSectionCard,
  NumberField,
  PendingEngineBadge,
  SumIndicator,
  TabErrorSummary,
} from './adminConfigShared';
import { findFieldError } from './adminConfigHelpers';
import type { AdminDeductionRules } from '../../api/adminConfigApi';

const TAB = 'deduction_rules';

const LINES: { key: string; label: string; sources: string[] }[] = [
  { key: 'footwear', label: 'Footwear', sources: ['file', 'formula'] },
  { key: 'nonapps_acc', label: 'Non-Apparel / Accessories', sources: ['file', 'formula'] },
  { key: 'iw_lingerie', label: 'Innerwear / Lingerie', sources: ['file', 'formula'] },
  { key: 'bor', label: 'BOR', sources: ['formula'] },
];

const FOOTWEAR_SCOPES = ['P0_ONLY', 'ALL_ROWS'];

const RATE_FIELDS: { key: string; label: string; hint?: string }[] = [
  { key: 'ded_non_apps', label: 'Non-apparel rate', hint: '0–1 fraction' },
  { key: 'ded_accessories', label: 'Accessories rate', hint: '0–1 fraction' },
  { key: 'ded_innerwear', label: 'Innerwear rate', hint: '0–1 fraction' },
  { key: 'ded_lingerie', label: 'Lingerie rate', hint: '0–1 fraction' },
  { key: 'footwear_rate', label: 'Footwear rate', hint: '0–1 fraction' },
  { key: 'footwear_cap_sqft', label: 'Footwear cap (sqft)' },
  { key: 'footwear_min_carpet_sqft', label: 'Footwear min carpet (sqft)' },
];

const DED_SUM_KEYS = ['ded_non_apps', 'ded_accessories', 'ded_innerwear', 'ded_lingerie'];
const DED_SUM_MAX = 0.15;

const SEQUENCE_LABELS: Record<string, string> = {
  non_apps: 'Non-apparel',
  accessories: 'Accessories',
  innerwear: 'Innerwear',
  lingerie: 'Lingerie',
  footwear: 'Footwear',
  bor: 'Best of Rest',
};

export function DeductionRulesTab(): React.ReactNode {
  const rules = useAdminConfigStore((s) => s.draft?.deduction_rules);
  const fieldErrors = useAdminConfigStore((s) => s.fieldErrors);
  const updateSection = useAdminConfigStore((s) => s.updateSection);

  if (!rules) return null;

  const setRules = (next: AdminDeductionRules): void => updateSection('deduction_rules', next);
  const err = (field: string): string | undefined => findFieldError(fieldErrors, TAB, field);

  const setMode = (line: string, source: string): void => {
    setRules({
      ...rules,
      modes: { ...rules.modes, [line]: { ...rules.modes[line], source } },
    });
  };
  const setScope = (scope: string): void => {
    setRules({
      ...rules,
      modes: { ...rules.modes, footwear: { ...rules.modes.footwear, source: rules.modes.footwear?.source ?? 'file', scope } },
    });
  };
  const setRate = (key: string, value: number): void => {
    setRules({ ...rules, formula_rates: { ...rules.formula_rates, [key]: value } });
  };

  const dedSum = DED_SUM_KEYS.reduce((acc, k) => acc + (rules.formula_rates[k] ?? 0), 0);

  return (
    <div className="space-y-4">
      <TabErrorSummary errors={fieldErrors} tab={TAB} />

      <AdminSectionCard title="Deduction Modes">
        <p className="text-xs text-gray-500 mb-3">
          Source per deduction line — applied by the engine on the next run.
        </p>
        <div className="space-y-3">
          {LINES.map((line) => {
            const mode = rules.modes[line.key];
            const lineError = err(line.key);
            return (
              <div
                key={line.key}
                className="flex flex-col sm:flex-row sm:items-center gap-2 border-b border-gray-100 pb-3 last:border-b-0 last:pb-0"
              >
                <span className="w-52 text-sm font-medium text-gray-700">{line.label}</span>
                <RadioGroup
                  value={mode?.source ?? line.sources[0] ?? 'file'}
                  onValueChange={(v) => setMode(line.key, v)}
                  className="flex items-center gap-4"
                >
                  {line.sources.map((src) => (
                    <div key={src} className="flex items-center gap-1.5">
                      <RadioGroupItem value={src} id={`mode-${line.key}-${src}`} />
                      <Label htmlFor={`mode-${line.key}-${src}`} className="text-sm capitalize">
                        {src}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
                {line.key === 'footwear' && (
                  <div className="flex items-center gap-2 sm:ml-4">
                    <span className="text-xs text-gray-500">Scope</span>
                    <Select value={mode?.scope ?? 'P0_ONLY'} onValueChange={setScope}>
                      <SelectTrigger className="w-32 h-8 text-sm" aria-label="Footwear scope">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FOOTWEAR_SCOPES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {err('footwear.scope') && (
                      <span className="text-xs text-red-600">{err('footwear.scope')}</span>
                    )}
                  </div>
                )}
                {lineError && <span className="text-xs text-red-600">{lineError}</span>}
              </div>
            );
          })}
        </div>
      </AdminSectionCard>

      <AdminSectionCard title="Deduction Sequence" badge={<PendingEngineBadge />}>
        <p className="text-xs text-gray-500 mb-3">
          Order in which deductions are applied to the carpet area. Each step reduces the space
          the next one sees — see the projected remaining space in the Overrides tab preview.
          {findFieldError(fieldErrors, TAB, 'sequence') && (
            <span className="block text-red-600 mt-1">
              {findFieldError(fieldErrors, TAB, 'sequence')}
            </span>
          )}
        </p>
        <ol className="space-y-1.5 max-w-md">
          {rules.sequence.map((lineKey, i) => (
            <li
              key={lineKey}
              className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5"
            >
              <span className="w-6 text-xs text-gray-400">{i + 1}.</span>
              <span className="flex-1 text-sm font-medium text-gray-900">
                {SEQUENCE_LABELS[lineKey] ?? lineKey}
              </span>
              <button
                type="button"
                aria-label={`Move ${lineKey} earlier`}
                disabled={i === 0}
                onClick={() => {
                  const next = [...rules.sequence];
                  const a = next[i];
                  const b = next[i - 1];
                  if (a === undefined || b === undefined) return;
                  next[i] = b;
                  next[i - 1] = a;
                  setRules({ ...rules, sequence: next });
                }}
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <button
                type="button"
                aria-label={`Move ${lineKey} later`}
                disabled={i === rules.sequence.length - 1}
                onClick={() => {
                  const next = [...rules.sequence];
                  const a = next[i];
                  const b = next[i + 1];
                  if (a === undefined || b === undefined) return;
                  next[i] = b;
                  next[i + 1] = a;
                  setRules({ ...rules, sequence: next });
                }}
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ol>
      </AdminSectionCard>

      <AdminSectionCard
        title="Formula Rates"
        actions={<SumIndicator label="Σ four deductions" sum={dedSum} max={DED_SUM_MAX} />}
      >
        <p className="text-xs text-gray-500 mb-3">
          Rates apply when the matching line runs in formula mode; file mode ignores them.
        </p>
        {/* eslint-disable-next-line design-system/prefer-metric-grid -- form input grid, not metric cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {RATE_FIELDS.map((f) => (
            <NumberField
              key={f.key}
              label={f.label}
              value={rules.formula_rates[f.key] ?? 0}
              onChange={(v) => setRate(f.key, v)}
              error={err(f.key)}
              hint={f.hint}
            />
          ))}
        </div>
      </AdminSectionCard>
    </div>
  );
}
