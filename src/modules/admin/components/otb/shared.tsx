/**
 * Shared read-only presentation primitives for the channel-led (Superdry)
 * OTB Configuration screen.
 *
 * Visual language deliberately mirrors the store-led (FNL) tabs in
 * AdminOTBConfigPage so both orgs read as the same screen.
 */

import { useState, type ReactNode } from 'react';
import { Info, Plus, RotateCcw, Save, X } from 'lucide-react';
import {
  Badge,
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui';
import { cn } from '@/lib/utils';

/** Card shell matching the FNL tabs. */
export function ConfigCard({
  title,
  description,
  muted,
  children,
}: {
  title: string;
  description?: string;
  muted?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        'bg-white rounded-lg border border-gray-200 p-4',
        muted && 'opacity-60',
      )}
    >
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        {muted && <NotUsedBadge />}
      </div>
      {description && <p className="text-xs text-gray-500 mb-3">{description}</p>}
      {children}
    </div>
  );
}

/**
 * Marks config the calculator reads but never acts on, so the screen doesn't
 * imply control that doesn't exist.
 */
export function NotUsedBadge({
  reason = 'Present in config but not read by the OTB engine.',
}: {
  reason?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-500 border border-gray-200 cursor-help">
          <Info className="w-2.5 h-2.5" />
          Not used
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <p className="max-w-xs text-xs">{reason}</p>
      </TooltipContent>
    </Tooltip>
  );
}

/** Label + description on the left, value on the right. Mirrors FNL's FieldRow. */
export function ReadOnlyRow({
  label,
  description,
  muted,
  reason,
  children,
}: {
  label: string;
  description?: string;
  muted?: boolean;
  reason?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        'flex items-start justify-between gap-6 py-3 border-b border-gray-100 last:border-b-0',
        muted && 'opacity-60',
      )}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-gray-900">{label}</p>
          {muted && <NotUsedBadge reason={reason} />}
        </div>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
      <div className="flex-shrink-0 text-sm text-gray-900 font-medium tabular-nums">
        {children}
      </div>
    </div>
  );
}

/** Read-only value pill, styled like the FNL disabled inputs. */
export function ValuePill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-block px-3 py-1.5 rounded-md bg-gray-50 border border-gray-200 text-sm text-gray-900 font-mono">
      {children}
    </span>
  );
}

/** Chip row. `active` chips use the FNL indigo treatment. */
export function Chips({
  items,
  active = true,
  emptyLabel = 'None',
}: {
  items: string[];
  active?: boolean;
  emptyLabel?: string;
}) {
  if (items.length === 0) {
    return <span className="text-xs text-gray-400">{emptyLabel}</span>;
  }
  return (
    <div className="flex flex-wrap gap-2 justify-end">
      {items.map((item) => (
        <span
          key={item}
          className={cn(
            'px-2.5 py-1 rounded-md text-xs font-medium border',
            active
              ? 'bg-indigo-50 text-primary-700 border-indigo-200'
              : 'bg-gray-50 text-gray-500 border-gray-200',
          )}
        >
          {item}
        </span>
      ))}
    </div>
  );
}

/** "All" is meaningful here: an empty scope list means no filter is applied. */
export function ScopeValue({ items }: { items: unknown[] }) {
  if (!items || items.length === 0) {
    return (
      <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
        All
      </span>
    );
  }
  return <Chips items={items.map(String)} />;
}

// ─── Editable primitives ────────────────────────────────────────────
// Mirrors the store-led (FNL) tabs in AdminOTBConfigPage, whose equivalents
// are unexported locals in that file.

/** Number input with the unit rendered *outside* the box, e.g. `[ 90 ] %`. */
export function NumberField({
  value,
  onChange,
  suffix,
  step = 1,
  min,
  max,
  className,
  suffixWidth,
  inputWidth,
}: {
  value: number;
  onChange: (value: number) => void;
  suffix?: string;
  step?: number;
  min?: number;
  max?: number;
  className?: string;
  /**
   * Fixed width for the unit slot. Set this on every field in a group so the
   * input boxes line up even when only some of them carry a unit.
   */
  suffixWidth?: string;
  /** Override the box width so a group of fields can share one size. */
  inputWidth?: string;
}) {
  return (
    <div className="flex items-center gap-1">
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        step={step}
        min={min}
        max={max}
        className={cn(inputWidth ?? 'w-24', 'text-right py-1.5 text-sm', className)}
      />
      {(suffix || suffixWidth) && (
        <span className={cn('text-sm text-gray-500 whitespace-nowrap', suffixWidth)}>
          {suffix}
        </span>
      )}
    </div>
  );
}

/** Read-only companion to NumberField — keeps derived values visually aligned. */
export function DerivedValueField({
  value,
  suffix,
  inputWidth,
  suffixWidth,
}: {
  value: string;
  suffix?: string;
  /** Override the value box width so a group of fields can share one size. */
  inputWidth?: string;
  /** Fixed width for the unit slot, to line up with NumberField groups. */
  suffixWidth?: string;
}) {
  return (
    <div className="flex items-center gap-1">
      <span className={cn(inputWidth ?? 'w-24', 'text-right py-1.5 text-sm text-gray-500 tabular-nums')}>{value}</span>
      {(suffix || suffixWidth) && (
        <span className={cn('text-sm text-gray-400 whitespace-nowrap', suffixWidth)}>{suffix}</span>
      )}
    </div>
  );
}

/** Add/remove list editor — Badge + X to remove, Input + Plus to add. */
export function ChipArrayEditor({
  items,
  onChange,
  placeholder = 'Value',
  numeric = false,
  emptyLabel,
}: {
  items: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  numeric?: boolean;
  emptyLabel?: ReactNode;
}) {
  const [draft, setDraft] = useState('');

  const add = () => {
    const v = draft.trim();
    if (!v || items.includes(v)) {
      setDraft('');
      return;
    }
    onChange([...items, v]);
    setDraft('');
  };

  return (
    <div className="flex flex-col gap-2 items-end">
      {items.length === 0 && emptyLabel}
      {items.length > 0 && (
        <div className="flex flex-wrap gap-1.5 justify-end">
          {items.map((item) => (
            <Badge key={item} variant="secondary" className="gap-1">
              {item}
              <button
                type="button"
                aria-label={`Remove ${item}`}
                onClick={() => onChange(items.filter((i) => i !== item))}
                className="ml-0.5 hover:text-red-600"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      <div className="flex items-center gap-1.5">
        <Input
          type={numeric ? 'number' : 'text'}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={placeholder}
          className="w-28 py-1 text-sm"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
        />
        <Button variant="secondary" size="sm" onClick={add} className="h-7 px-2">
          <Plus className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

/**
 * Pick-from-a-list editor: a dropdown of the remaining options on the right,
 * selected values as removable chips below. Mirrors FNL's KPI exclusion rows.
 */
export function ChipSelectEditor({
  items,
  options,
  onChange,
  placeholder = 'Select to add',
  emptyLabel,
}: {
  items: string[];
  options: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  emptyLabel?: ReactNode;
}) {
  const available = options.filter((o) => !items.includes(o));

  return (
    <div className="w-full">
      <div className="flex items-center justify-end gap-2">
        {items.length === 0 && emptyLabel}
        {available.length > 0 && (
          <Select value="" onValueChange={(v) => v && onChange([...items, v])}>
            <SelectTrigger size="sm" className="w-64 font-mono text-xs">
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {available.map((opt) => (
                <SelectItem key={opt} value={opt} className="font-mono text-xs">
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      {items.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2 justify-end">
          {items.map((item) => (
            <Badge key={item} variant="secondary" className="gap-1 font-mono text-[11px]">
              {item}
              <button
                type="button"
                aria-label={`Remove ${item}`}
                onClick={() => onChange(items.filter((i) => i !== item))}
                className="ml-0.5 hover:text-red-600"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

/** Toggleable chip row for enum-ish multi-selects (frequencies, agg levels). */
export function ToggleChips({
  options,
  selected,
  onToggle,
}: {
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 justify-end">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onToggle(opt)}
          className={cn(
            'px-3 py-1.5 rounded-md text-xs font-medium border transition-colors',
            selected.includes(opt)
              ? 'bg-indigo-50 text-primary-700 border-indigo-200'
              : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100',
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

/** Save / Reset footer. Matches the FNL tabs' SectionFooter. */
export function SectionFooter({
  onSave,
  onReset,
  isValid = true,
}: {
  onSave: () => void;
  onReset: () => void;
  isValid?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 pt-4 mt-4 border-t border-gray-200">
      <Button onClick={onSave} disabled={!isValid}>
        <Save className="w-4 h-4 mr-1.5" />
        Save Changes
      </Button>
      <Button variant="secondary" onClick={onReset}>
        <RotateCcw className="w-4 h-4 mr-1.5" />
        Reset to Defaults
      </Button>
    </div>
  );
}
