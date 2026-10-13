import { useId, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Badge, Input } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { AdminFieldError } from '../../api/adminConfigApi';

// Domain constants — mirror admin_service.py so labels/order match the backend.
export const ADMIN_CATEGORIES = ['WIW', 'WWW', 'MC', 'MF', 'KW'] as const;
export const ADMIN_FLOORS = ['Single', 'Ground', 'First', 'Second', 'Third', 'Fourth'] as const;
export const ADMIN_STORE_TYPES = ['STANDALONE', 'MALL'] as const;
export const ADMIN_FLOOR_CONFIGS = ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE'] as const;
export const ADMIN_FORMATS = [
  'TRENDS_FULL',
  'TRENDS_MAN',
  'TRENDS_WOMAN',
  'TRENDS_JUNIOR',
] as const;

/** Amber marker for config the backend persists but the engine does not read yet (§2.2). */
export function PendingEngineBadge(): React.ReactNode {
  return (
    <Badge variant="warning" size="sm" className="uppercase tracking-wide">
      Pending engine
    </Badge>
  );
}

interface TabErrorSummaryProps {
  errors: AdminFieldError[];
  tab: string;
}

/** Red panel at the top of a tab listing that tab's server validation errors. */
export function TabErrorSummary({ errors, tab }: TabErrorSummaryProps): React.ReactNode {
  const tabErrors = errors.filter((e) => e.tab === tab);
  if (tabErrors.length === 0) return null;
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-3" role="alert">
      <div className="flex items-center gap-2 text-sm font-medium text-red-700">
        <AlertCircle className="w-4 h-4" />
        Fix the following before saving
      </div>
      <ul className="mt-1.5 space-y-0.5 text-sm text-red-700 list-disc list-inside">
        {tabErrors.map((e) => (
          <li key={`${e.field}-${e.error}`}>
            <span className="font-medium">{e.field}</span>: {e.error}
          </li>
        ))}
      </ul>
    </div>
  );
}

interface NumberFieldProps {
  label?: string;
  value: number;
  onChange: (v: number) => void;
  error?: string;
  hint?: string;
  ariaLabel?: string;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
}

/**
 * Numeric input that tolerates intermediate typing states ("0.", "-") by
 * keeping local text and only committing parseable values upward.
 */
export function NumberField({
  label,
  value,
  onChange,
  error,
  hint,
  ariaLabel,
  disabled,
  className,
  inputClassName,
}: NumberFieldProps): React.ReactNode {
  const id = useId();
  const [text, setText] = useState<string>(String(value));
  const [lastValue, setLastValue] = useState<number>(value);

  // Render-phase sync (React's "adjust state when props change" pattern):
  // only take the incoming value when it genuinely differs from what's typed —
  // otherwise "0." would be clobbered back to "0" mid-keystroke.
  if (value !== lastValue) {
    setLastValue(value);
    if (parseFloat(text) !== value) setText(String(value));
  }

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {label && (
        <label htmlFor={id} className="text-xs font-medium text-gray-500">
          {label}
        </label>
      )}
      <Input
        id={id}
        type="number"
        inputMode="decimal"
        step="any"
        value={text}
        aria-label={label ?? ariaLabel}
        aria-invalid={error ? true : undefined}
        disabled={disabled}
        onChange={(e) => {
          const t = e.target.value;
          setText(t);
          const n = parseFloat(t);
          if (!Number.isNaN(n)) onChange(n);
        }}
        onBlur={() => {
          if (Number.isNaN(parseFloat(text))) setText(String(value));
        }}
        className={cn('h-8 text-sm', error && 'border-red-400', inputClassName)}
      />
      {error && <span className="text-xs text-red-600">{error}</span>}
      {!error && hint && <span className="text-xs text-gray-400">{hint}</span>}
    </div>
  );
}

interface SumIndicatorProps {
  label: string;
  sum: number;
  target?: number;
  max?: number;
}

/** Live sum chip — green when the constraint holds, red when it doesn't. */
export function SumIndicator({ label, sum, target, max }: SumIndicatorProps): React.ReactNode {
  const EPS = 1e-9;
  const ok =
    target !== undefined ? Math.abs(sum - target) <= EPS : max !== undefined ? sum <= max + EPS : true;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-medium',
        ok ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700',
      )}
    >
      {label}: {Number(sum.toFixed(6))}
      {target !== undefined && ` / ${target}`}
      {max !== undefined && ` (max ${max})`}
    </span>
  );
}

interface AdminSectionCardProps {
  title: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export function AdminSectionCard({
  title,
  badge,
  actions,
  children,
}: AdminSectionCardProps): React.ReactNode {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          {badge}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}
