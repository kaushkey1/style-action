import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import {
  Badge,
  Card,
  CardContent,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import { cn } from '@/lib/utils';
import {
  GRADE_LABELS,
  WEEKDAYS,
  fieldErrorMap,
  gradesForTab,
  isFieldHidden,
  type AnrFieldMeta,
  type AnrTabMeta,
} from './anrConfigMeta';
import type { AnrConfigValues, AnrFieldError } from '../api/anrConfigApi';

interface AnrConfigTabProps {
  tab: AnrTabMeta;
  values: AnrConfigValues;
  errors: AnrFieldError[];
  disabled: boolean;
  onChange: (tabId: string, grade: string, key: string, value: string) => void;
}

/** Amber marker: stored + versioned here, read by the calculator only after its PG loader lands. */
function PendingEngineBadge(): React.ReactNode {
  return (
    <Badge variant="warning" size="sm" className="uppercase tracking-wide">
      Pending engine
    </Badge>
  );
}

function DaysField({
  value,
  disabled,
  onChange,
}: {
  value: string;
  disabled: boolean;
  onChange: (v: string) => void;
}): React.ReactNode {
  const selected = new Set(value.split(',').map((d) => d.trim()).filter(Boolean));
  const toggle = (day: string): void => {
    const next = new Set(selected);
    if (next.has(day)) next.delete(day);
    else next.add(day);
    onChange(WEEKDAYS.filter((d) => next.has(d)).join(','));
  };
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Pullback run days">
      {WEEKDAYS.map((day) => {
        const isOn = selected.has(day);
        return (
          <button
            key={day}
            type="button"
            disabled={disabled}
            aria-pressed={isOn}
            onClick={() => toggle(day)}
            className={cn(
              'px-2.5 py-1.5 rounded-lg border text-xs font-medium min-h-[44px] lg:min-h-0',
              isOn
                ? 'border-indigo-600 bg-indigo-50 text-gray-900'
                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300',
              disabled && 'opacity-60 cursor-not-allowed',
            )}
          >
            {day.slice(0, 3)}
          </button>
        );
      })}
    </div>
  );
}

function Field({
  meta,
  value,
  error,
  disabled,
  onChange,
}: {
  meta: AnrFieldMeta;
  value: string;
  error?: string;
  disabled: boolean;
  onChange: (v: string) => void;
}): React.ReactNode {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1" htmlFor={`anr-${meta.key}`}>
        {meta.label}
      </label>
      {meta.kind === 'days' ? (
        <DaysField value={value} disabled={disabled} onChange={onChange} />
      ) : meta.kind === 'bool' ? (
        <Select value={value} onValueChange={onChange} disabled={disabled}>
          <SelectTrigger id={`anr-${meta.key}`} className="w-full" aria-label={meta.label}>
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">Yes</SelectItem>
            <SelectItem value="false">No</SelectItem>
          </SelectContent>
        </Select>
      ) : meta.kind === 'enum' ? (
        <Select value={value} onValueChange={onChange} disabled={disabled || (meta.options?.length ?? 0) < 2}>
          <SelectTrigger id={`anr-${meta.key}`} className="w-full" aria-label={meta.label}>
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            {(meta.options ?? []).map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Input
          id={`anr-${meta.key}`}
          value={value}
          inputMode={meta.kind === 'int' ? 'numeric' : 'decimal'}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          onChange={(e) => onChange(e.target.value)}
          className={cn(error && 'border-red-300 focus-visible:ring-red-300')}
        />
      )}
      {error ? (
        <p className="mt-1 flex items-center gap-1 text-xs text-red-600" role="alert">
          <AlertCircle className="w-3 h-3 shrink-0" />
          {error}
        </p>
      ) : (
        meta.hint && <p className="mt-1 text-xs text-gray-500">{meta.hint}</p>
      )}
    </div>
  );
}

export function AnrConfigTab({
  tab,
  values,
  errors,
  disabled,
  onChange,
}: AnrConfigTabProps): React.ReactNode {
  const grades = gradesForTab(tab.id);
  const [grade, setGrade] = useState<string>(grades[0] ?? 'FASHION');
  const activeGrade = grades.includes(grade) ? grade : (grades[0] ?? 'FASHION');
  const fgValues = values[tab.id]?.[activeGrade] ?? {};
  const inlineErrors = fieldErrorMap(errors, tab.id, activeGrade);
  const gradeHasErrors = (fg: string): boolean =>
    errors.some((e) => e.tab === tab.id && e.field.startsWith(`${fg} · `));

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">{tab.label}</h2>
            <p className="mt-0.5 text-xs text-gray-500 max-w-2xl">{tab.description}</p>
          </div>
          <PendingEngineBadge />
        </div>

        {/* Fashion-grade selector — FG defaults; store overrides come in phase 2 */}
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Fashion grade">
          {grades.map((fg) => (
            <button
              key={fg}
              type="button"
              aria-pressed={fg === activeGrade}
              onClick={() => setGrade(fg)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm min-h-[44px] lg:min-h-0',
                fg === activeGrade
                  ? 'border-indigo-600 bg-indigo-50 font-medium text-gray-900'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300',
              )}
            >
              {GRADE_LABELS[fg] ?? fg}
              {gradeHasErrors(fg) && (
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" title="Has validation errors" />
              )}
            </button>
          ))}
        </div>

        {tab.id === 'lifecycle' && (
          <p className="text-xs text-gray-500">
            Active Core has no lifecycle pullback. Discontinued Core follows the Fashion
            parameters, ageing from the discontinuation date.
          </p>
        )}

        {/* eslint-disable-next-line design-system/prefer-metric-grid -- form input grid, not metric cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {tab.fields
            .filter((meta) => !isFieldHidden(tab.id, meta.key, fgValues))
            .map((meta) => (
              <Field
                key={meta.key}
                meta={meta}
                value={fgValues[meta.key] ?? ''}
                error={inlineErrors[meta.key]}
                disabled={disabled}
                onChange={(v) => onChange(tab.id, activeGrade, meta.key, v)}
              />
            ))}
        </div>

        {inlineErrors.priorities && (
          <p className="flex items-center gap-1 text-xs text-red-600" role="alert">
            <AlertCircle className="w-3 h-3 shrink-0" />
            {inlineErrors.priorities}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
