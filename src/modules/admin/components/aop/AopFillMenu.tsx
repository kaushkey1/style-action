import { useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { MoreVertical, RotateCcw, X } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { useToast } from '@/hooks/useToast';
import { monthLabel } from '../../api/aopAdminCalendar';
import { buildContextFillPreview, GRID_PARAMETERS, type GridColumn, type GridContext, type GridFillAction } from '../../api/aopGridDraft';
import type { DraftChange, SiteParameters } from '../../types/aopAdmin';

type FillTarget = { kind: 'column'; column: GridColumn } | { kind: 'site'; site: SiteParameters };
interface Props {
  target: FillTarget;
  channel: string;
  sites: SiteParameters[];
  columns: GridColumn[];
  context: GridContext;
  disabled: boolean;
  onApply: (changes: DraftChange[], label: string) => void;
  onReset: () => void;
}

export function AopFillMenu(props: Props): ReactNode {
  const [open, setOpen] = useState(false);
  const anchor = useRef<HTMLButtonElement>(null);
  const { target, channel, disabled } = props;
  const name = target.kind === 'column'
    ? `${channel} ${monthLabel(target.column.month)} ${GRID_PARAMETERS.find((item) => item.key === target.column.parameter)?.label}%`
    : `${target.site.name} (${target.site.code})`;
  if (disabled) return null;
  return <Dialog.Root modal={false} open={open} onOpenChange={setOpen}>
    <Dialog.Trigger asChild>
      <Button ref={anchor} variant="ghost" size="icon" aria-label={`${name} fill options`}
        className="h-11 min-h-11 w-11 min-w-11 shrink-0 text-gray-400 @2xl:h-6 @2xl:min-h-6 @2xl:w-6 @2xl:min-w-6 transition-[opacity,color,background-color,box-shadow] duration-150 ease-out active:scale-100 [@media(hover:hover)]:opacity-0 group-hover/fill:opacity-100 group-focus-within/fill:opacity-100 data-[state=open]:opacity-100 focus:opacity-100 motion-reduce:transition-none">
        <MoreVertical className="h-4 w-4" aria-hidden="true" />
      </Button>
    </Dialog.Trigger>
    {open && <Dialog.Portal><FillPanel {...props} name={name} anchor={anchor} onClose={() => setOpen(false)} /></Dialog.Portal>}
  </Dialog.Root>;
}

function FillPanel({ target, sites, columns, context, onApply, onReset, name, anchor, onClose }: Props & {
  name: string; anchor: RefObject<HTMLButtonElement | null>; onClose: () => void;
}): ReactNode {
  const panel = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number; side: 'top' | 'bottom' }>({ top: 0, left: 0, side: 'bottom' });
  const [value, setValue] = useState('');
  const toast = useToast();
  useLayoutEffect(() => {
    function positionPanel(): void {
      if (!anchor.current || !panel.current) return;
      const trigger = anchor.current.getBoundingClientRect();
      // Layout dimensions stay stable while the entry animation scales the panel.
      const box = { width: panel.current.offsetWidth, height: panel.current.offsetHeight };
      const left = Math.max(12, Math.min(trigger.right - box.width, window.innerWidth - box.width - 12));
      const below = trigger.bottom + 6;
      const side = below + box.height <= window.innerHeight - 12 ? 'bottom' : 'top';
      const top = Math.max(12, Math.min(side === 'bottom' ? below : trigger.top - box.height - 6, window.innerHeight - box.height - 12));
      setPosition((previous) => previous.top === top && previous.left === left && previous.side === side ? previous : { top, left, side });
    }
    positionPanel();
    const observer = new ResizeObserver(positionPanel);
    if (panel.current) observer.observe(panel.current);
    window.addEventListener('resize', positionPanel);
    window.addEventListener('scroll', positionPanel, true);
    return () => { observer.disconnect(); window.removeEventListener('resize', positionPanel); window.removeEventListener('scroll', positionPanel, true); };
  }, [anchor]);
  const targetSites = target.kind === 'site' ? [target.site] : sites;
  const targetColumns = target.kind === 'column' ? [target.column] : columns;
  const monthCount = new Set(targetColumns.map((column) => column.month)).size;
  const parameters = GRID_PARAMETERS.filter((metric) => targetColumns.some((column) => column.parameter === metric.key));
  const action: GridFillAction | null = value.trim() ? { kind: 'value', value } : null;
  const preview = action ? buildContextFillPreview(context, targetSites, targetColumns, action) : null;
  const reset = buildContextFillPreview(context, targetSites, targetColumns, { kind: 'reset' });
  const errors = [...new Set(preview?.errors ?? [])];
  return <Dialog.Content ref={panel} data-side={position.side}
    // eslint-disable-next-line no-restricted-syntax -- Position this compact portal against its grid trigger and clamp it inside the viewport.
    style={{ top: position.top, left: position.left }}
    className="fixed z-50 w-80 max-w-[calc(100vw-1.5rem)] max-h-[calc(100dvh-1.5rem)] overflow-y-auto rounded-lg border border-gray-200 bg-white p-3 text-left shadow-lg transition-none origin-top-right data-[side=top]:origin-bottom-right motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-safe:duration-150 motion-safe:ease-out motion-safe:data-[side=bottom]:slide-in-from-top-1 motion-safe:data-[side=top]:slide-in-from-bottom-1"
    onPaste={(event) => event.stopPropagation()}>
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0">
        <Dialog.Title className="break-words text-sm font-semibold text-gray-900">{name}</Dialog.Title>
        <Dialog.Description className="mt-0.5 text-xs text-gray-500">
          {target.kind === 'column' ? `${targetSites.length} ${targetSites.length === 1 ? 'matching site' : 'matching sites'}`
            : `${monthCount} ${monthCount === 1 ? 'month' : 'months'} · ${parameters.map((metric) => `${metric.label}%`).join(', ')}`}
        </Dialog.Description>
      </div>
      <Dialog.Close asChild><Button variant="ghost" size="icon" aria-label="Close fill options" className="h-11 min-h-11 w-11 min-w-11 shrink-0 lg:h-8 lg:min-h-8 lg:w-8 lg:min-w-8"><X className="h-4 w-4" /></Button></Dialog.Close>
    </div>
    <div className="mt-3">
      <Input label="Value (%)" inputMode="decimal" value={value} placeholder="Enter percentage" onChange={(event) => setValue(event.target.value)}
        containerClassName="space-y-1 [&_label]:text-xs" className="h-11 px-3 py-2 lg:h-9 lg:py-1.5" />
    </div>
    <div className={`space-y-1 text-xs ${preview ? 'mt-2' : ''}`} aria-live="polite">
      {errors.length ? <p role="alert" className="text-red-700">{errors[0]}{errors.length > 1 ? ` (${errors.length} issues)` : ''}</p>
        : preview && <p className="text-gray-600">{preview.cells.length ? `${preview.cells.length} ${preview.cells.length === 1 ? 'cell will' : 'cells will'} change.` : 'No values changed.'}</p>}
      {!!preview?.unchanged && <p className="text-gray-500">{preview.unchanged} already match.</p>}
    </div>
    <div className="mt-3 flex items-center justify-between gap-2 border-t border-gray-100 pt-2">
      <Button variant="ghost" size="sm" className="shrink-0 gap-1 px-1.5 text-xs" disabled={!reset.cells.length || !!reset.errors.length}
        title={reset.errors[0] ?? (reset.cells.length ? `Remove ${reset.cells.length} monthly overrides and use inherited values` : 'These cells already use inherited defaults')}
        onClick={() => {
          onApply(reset.cells.map((cell) => cell.change), reset.label);
          onReset();
          onClose();
        }}><RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />Reset to default</Button>
      <div className="flex shrink-0 items-center gap-1">
        <Button variant="ghost" size="sm" className="px-2 text-xs" onClick={onClose}>Cancel</Button>
        <Button size="sm" className="px-2.5 text-xs" disabled={!preview?.cells.length || !!errors.length} onClick={() => {
          if (!preview || errors.length) return;
          onApply(preview.cells.map((cell) => cell.change), preview.label);
          toast.success(`${preview.cells.length} ${preview.cells.length === 1 ? 'cell' : 'cells'} updated in draft`);
          onClose();
        }}>Apply to draft</Button>
      </div>
    </div>
  </Dialog.Content>;
}
