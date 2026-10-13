/**
 * DrillMenu — the cross-page drill affordance (flat list + 1-line previews).
 *
 * Desktop: a Radix DropdownMenu. Mobile: a BottomSheet. Trigger is a bare kebab (⋯) for table rows
 * or a labelled "View ▾" button for chart/section headers. Each target navigates (push) to a real
 * route from `@/lib/routing`, so the back gesture / browser back returns to the source.
 */
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MoreHorizontal, ChevronDown, ChevronRight } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from './DropdownMenu';
import { BottomSheet } from './BottomSheet';
import { useIsMobile } from '@/hooks/useMediaQuery';
import type { DrillTarget } from '@/lib/routing';

export interface DrillMenuProps {
  /** Name of the row/entity being drilled, shown in the menu header + aria-label. */
  rowLabel: string;
  targets: DrillTarget[];
  /** 'kebab' (table rows) or 'button' (chart/section headers). */
  trigger?: 'kebab' | 'button';
  triggerLabel?: string;
  align?: 'start' | 'end';
  className?: string;
}

export function DrillMenu({
  rowLabel,
  targets,
  trigger = 'kebab',
  triggerLabel = 'View',
  align = 'end',
  className,
}: DrillMenuProps): React.ReactNode {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [sheetOpen, setSheetOpen] = useState(false);
  const isButton = trigger === 'button';

  // Drop any target that points at the page you're already on — e.g. "Open in
  // Store View" while on Store View is noise. Compare pathname only (ignore the
  // query filters). Also drops empty routes (store-scoped targets with no store).
  const visibleTargets = targets.filter((t) => t.to && t.to.split('?')[0] !== location.pathname);

  // No resolvable destinations (e.g. a store-scoped target dropped for a store-less row) → no affordance.
  if (visibleTargets.length === 0) return null;

  const pick = (to: string): void => {
    setSheetOpen(false);
    navigate(to);
  };
  // Stop the kebab from triggering a clickable parent row underneath it.
  const stop = (e: React.SyntheticEvent): void => e.stopPropagation();

  const buttonCls =
    'inline-flex items-center gap-1 h-8 px-2.5 rounded-lg border border-gray-200 bg-white text-xs font-medium text-primary hover:bg-primary/5 transition-colors data-[state=open]:bg-primary/5';
  const kebabDesktopCls =
    'inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors data-[state=open]:bg-gray-100 data-[state=open]:text-gray-600';
  const kebabMobileCls =
    'inline-flex items-center justify-center min-h-11 min-w-11 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors';

  const triggerInner = isButton ? (
    <>
      {triggerLabel}
      <ChevronDown className="w-3.5 h-3.5 opacity-70" />
    </>
  ) : (
    <MoreHorizontal className="w-4 h-4" />
  );

  if (isMobile) {
    return (
      <span onClick={stop} onKeyDown={stop} role="presentation" className={className}>
        <button
          type="button"
          aria-label={`Drill into ${rowLabel}`}
          onClick={() => setSheetOpen(true)}
          className={isButton ? buttonCls : kebabMobileCls}
        >
          {triggerInner}
        </button>
        <BottomSheet isOpen={sheetOpen} onClose={() => setSheetOpen(false)} title={`Drill into ${rowLabel}`}>
          <div className="space-y-1 pb-2">
            {visibleTargets.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => pick(t.to)}
                  className="w-full flex items-center gap-3 min-h-12 px-2 rounded-lg text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-gray-100 text-gray-600 shrink-0">
                    <Icon className="w-4 h-4" />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-medium text-gray-900">{t.label}</span>
                    <span className="block text-xs text-gray-500 truncate">{t.preview}</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                </button>
              );
            })}
          </div>
        </BottomSheet>
      </span>
    );
  }

  return (
    <span onClick={stop} onKeyDown={stop} role="presentation" className={className}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" aria-label={`Drill into ${rowLabel}`} className={isButton ? buttonCls : kebabDesktopCls}>
            {triggerInner}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align={align} className="min-w-[260px]">
          <DropdownMenuLabel className="text-xs font-normal text-gray-500">Drill into {rowLabel}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {visibleTargets.map((t) => {
            const Icon = t.icon;
            return (
              <DropdownMenuItem key={t.id} onSelect={() => navigate(t.to)} className="items-start py-2">
                <Icon className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
                <span className="flex-1 min-w-0">
                  <span className="block">{t.label}</span>
                  <span className="block text-xs text-gray-500 truncate">{t.preview}</span>
                </span>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </span>
  );
}
