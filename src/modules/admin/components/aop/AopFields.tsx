import { useId, useState, type ReactNode, type KeyboardEventHandler, type ClipboardEventHandler } from 'react';
import { Button, EmptyState, Input } from '@/components/ui';
import type { DraftChange, Operation } from '../../types/aopAdmin';
import { numberDraft, operationKey } from '../../api/aopAdminDraft';

export interface EditProps {
  changes: Record<string, DraftChange>;
  onChange: (change: DraftChange) => void;
  disabled: boolean;
  onBatchChange?: (changes: DraftChange[], label: string) => void;
}

export function AopNumberField({ operation, value, label, ratio = false, min = 0, max = 100, suffix = '%', placeholder = 'Not set', optional = false, inheritedValue = null, compact = false, description, gridCell, ...edit }: EditProps & {
  operation: Operation; value: number | null; label: string; ratio?: boolean; min?: number; max?: number; suffix?: string; placeholder?: string; optional?: boolean; inheritedValue?: number | null; compact?: boolean; description?: string;
  gridCell?: { row: number; column: number; onKeyDown: KeyboardEventHandler<HTMLInputElement>; onPaste: ClipboardEventHandler<HTMLInputElement> };
}): ReactNode {
  const id = useId();
  const [focused, setFocused] = useState(false);
  const pending = edit.changes[operationKey(operation)];
  const inherited = value === null && inheritedValue !== null;
  const effectiveValue = value ?? inheritedValue;
  const formatted = effectiveValue === null ? '' : String(Number((ratio ? effectiveValue * 100 : effectiveValue).toFixed(6)));
  // Clearing an override saves null, while the unfocused field shows its effective default.
  const input = inherited && !focused && pending?.input === '' ? formatted : pending?.input ?? formatted;
  return <div className="flex items-start gap-1">
    <Input id={id} aria-label={label} type="text" inputMode="decimal" value={input} title={description}
      data-grid-row={gridCell?.row} data-grid-column={gridCell?.column} onKeyDown={gridCell?.onKeyDown} onPaste={gridCell?.onPaste}
      disabled={edit.disabled} placeholder={placeholder} error={pending?.error}
      aria-describedby={[pending?.error ? `${id}-error` : '', description ? `${id}-source` : ''].filter(Boolean).join(' ') || undefined}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      containerClassName={compact ? 'w-20 shrink-0' : 'w-24 shrink-0'}
      onChange={(event) => edit.onChange(!event.target.value.trim() && (operation.op === 'set_setting' || (optional && operation.op === 'set_channel_setting'))
        ? { operation: { ...operation, value: null }, input: '' }
        : numberDraft(operation, event.target.value, ratio, min, max))}
      className={compact ? 'w-20 min-h-11 @2xl:min-h-8 px-2 py-1 text-right text-sm tabular-nums' : 'w-24 text-right py-1.5 text-sm'} />
    <span className={`w-4 shrink-0 whitespace-nowrap text-sm text-gray-500 ${compact ? 'pt-3 @2xl:pt-1.5' : 'pt-1.5'}`}>{suffix}</span>
    {description && <span id={`${id}-source`} className="sr-only">{description}</span>}
  </div>;
}

export function AopErrorState({ message, onRetry }: { message: string; onRetry?: () => void }): ReactNode {
  return <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
    <p>{message}</p>{onRetry && <Button className="mt-2" variant="secondary" onClick={onRetry}>Retry</Button>}
  </div>;
}

export function AopPagination({ total, offset, pageSize, onOffset }: { total: number; offset: number; pageSize: number; onOffset: (offset: number) => void }): ReactNode {
  if (!total) return <EmptyState title="No matching records" description="Adjust the selected filters." />;
  return <div className="flex flex-wrap items-center gap-3 pt-3 text-xs text-gray-500">
    <span>{offset + 1}–{Math.min(offset + pageSize, total)} of {total}</span>
    <Button variant="secondary" size="sm" disabled={!offset} onClick={() => onOffset(Math.max(0, offset - pageSize))}>Previous</Button>
    <Button variant="secondary" size="sm" disabled={offset + pageSize >= total} onClick={() => onOffset(offset + pageSize)}>Next</Button>
  </div>;
}
