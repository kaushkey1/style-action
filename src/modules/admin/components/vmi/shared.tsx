/**
 * VMI-local presentation primitives for the VMI Configuration screens.
 * Patterned on the OTB admin `components/otb/shared.tsx` but kept local to the
 * VMI feature to avoid cross-feature coupling.
 */
import { type ReactNode } from 'react';
import { RotateCcw, Save } from 'lucide-react';
import {
  Badge,
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import { cn } from '@/lib/utils';
import type { VmiStatus } from '../../data/vmiConfigSeed';

/** White card shell with a title, optional description and right-aligned actions. */
export function AdminSectionCard({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}): React.ReactNode {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          {description ? <p className="text-xs text-gray-500 mt-0.5">{description}</p> : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
      {children}
    </div>
  );
}

/** Label + description on the left, control on the right. */
export function FieldRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: ReactNode;
}): React.ReactNode {
  return (
    <div className="flex items-start justify-between gap-6 py-3 border-b border-gray-100 last:border-b-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {description ? <p className="text-xs text-gray-500 mt-0.5">{description}</p> : null}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

/** Numeric input with an optional unit suffix and inline error. Empty → null. */
export function NumberField({
  value,
  onChange,
  suffix,
  error,
  min = 0,
  disabled,
  className,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  suffix?: string;
  error?: string;
  min?: number;
  disabled?: boolean;
  className?: string;
}): React.ReactNode {
  return (
    <div className={className}>
      <div className="flex items-center gap-1.5">
        <Input
          type="number"
          inputMode="numeric"
          min={min}
          step={1}
          value={value === null || Number.isNaN(value) ? '' : String(value)}
          onChange={(e) => {
            const raw = e.target.value;
            onChange(raw === '' ? null : Number(raw));
          }}
          disabled={disabled}
          containerClassName="w-24"
          className={cn(error ? 'border-red-400 focus-kb:border-red-400' : undefined)}
        />
        {suffix ? <span className="text-xs text-gray-500 whitespace-nowrap">{suffix}</span> : null}
      </div>
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

const STATUS_VARIANT: Record<VmiStatus, 'success' | 'default' | 'warning' | 'error'> = {
  Active: 'success',
  Inactive: 'default',
  Pending: 'warning',
  Rejected: 'error',
};

/** Colored status pill for a VMI record. */
export function StatusBadge({ status }: { status: VmiStatus }): React.ReactNode {
  return (
    <Badge variant={STATUS_VARIANT[status]} size="sm">
      {status}
    </Badge>
  );
}

/** Dropdown of enrolled EANs; keeps the current value selectable even if not enrolled. */
export function EanSelect({
  value,
  options,
  onChange,
  error,
  className,
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
  error?: boolean;
  className?: string;
}): React.ReactNode {
  const opts = value && !options.includes(value) ? [value, ...options] : options;
  return (
    <Select value={value || undefined} onValueChange={onChange}>
      <SelectTrigger aria-label="EAN" className={cn('min-w-[9rem]', error ? 'border-red-400' : undefined, className)}>
        <SelectValue placeholder="Select EAN" />
      </SelectTrigger>
      <SelectContent>
        {opts.length === 0 ? (
          <SelectItem value="__none__" disabled>
            No enrolled EANs
          </SelectItem>
        ) : (
          opts.map((o) => (
            <SelectItem key={o} value={o}>
              {o}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}

/** Save + Reset footer; both disabled until there are unsaved changes. */
export function SectionFooter({
  onSave,
  onReset,
  dirty,
  saveDisabled,
}: {
  onSave: () => void;
  onReset: () => void;
  dirty: boolean;
  saveDisabled?: boolean;
}): React.ReactNode {
  return (
    <div className="flex items-center justify-end gap-2 pt-3 mt-3 border-t border-gray-100">
      <Button variant="outline" size="sm" onClick={onReset} disabled={!dirty}>
        <RotateCcw className="w-3.5 h-3.5 mr-1" />
        Reset
      </Button>
      <Button size="sm" onClick={onSave} disabled={!dirty || saveDisabled}>
        <Save className="w-3.5 h-3.5 mr-1" />
        Save
      </Button>
    </div>
  );
}
