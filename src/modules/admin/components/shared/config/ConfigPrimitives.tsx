import type { ReactNode } from 'react';
import { Loader2, RotateCcw, Save } from 'lucide-react';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';

export function ConfigLoadingState({ label = 'Loading configuration…' }: { label?: string }): ReactNode {
  return <div role="status" className="flex items-center justify-center py-12">
    <Loader2 className="w-5 h-5 animate-spin text-gray-400" aria-hidden="true" />
    <span className="sr-only">{label}</span>
  </div>;
}

export function ConfigCard({ title, description, muted, badge, children }: {
  title: string; description?: string; muted?: boolean; badge?: ReactNode; children: ReactNode;
}): ReactNode {
  return <div className={cn('bg-white rounded-lg border border-gray-200 p-4', muted && 'opacity-60')}>
    <div className="flex items-center gap-2 mb-3"><h3 className="text-sm font-semibold text-gray-900">{title}</h3>{badge}</div>
    {description && <p className="text-xs text-gray-500 mb-3">{description}</p>}{children}
  </div>;
}

export function ReadOnlyRow({ label, description, muted, badge, children }: {
  label: string; description?: string; muted?: boolean; badge?: ReactNode; children: ReactNode;
}): ReactNode {
  return <div className={cn('flex items-start justify-between gap-6 py-3 border-b border-gray-100 last:border-b-0', muted && 'opacity-60')}>
    <div className="flex-1 min-w-0"><div className="flex items-center gap-2"><p className="text-sm font-medium text-gray-900">{label}</p>{badge}</div>
      {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}</div>
    <div className="flex-shrink-0 text-sm text-gray-900 font-medium tabular-nums">{children}</div>
  </div>;
}

export function ValuePill({ children }: { children: ReactNode }): ReactNode {
  return <span className="inline-block px-3 py-1.5 rounded-md bg-gray-50 border border-gray-200 text-sm text-gray-900 font-mono">{children}</span>;
}

export function SectionFooter({ onSave, onReset, isValid = true, isSaving = false, resetLabel = 'Reset Changes', pendingCount }: {
  onSave: () => void; onReset: () => void; isValid?: boolean; isSaving?: boolean; resetLabel?: string; pendingCount?: number;
}): ReactNode {
  return <div className="flex flex-wrap items-center gap-3 pt-4 mt-4 border-t border-gray-200">
    <Button onClick={onSave} disabled={!isValid || isSaving}><Save className="w-4 h-4 mr-1.5" />{isSaving ? 'Saving…' : 'Save Changes'}</Button>
    <Button variant="secondary" onClick={onReset} disabled={isSaving}><RotateCcw className="w-4 h-4 mr-1.5" />{resetLabel}</Button>
    {pendingCount !== undefined && <span className="text-xs text-gray-500" role="status">{pendingCount} pending {pendingCount === 1 ? 'change' : 'changes'} across tabs</span>}
  </div>;
}
