import { AlertTriangle, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LinkedExceptionCardProps {
  exceptionId: string;
  /** Render the internal "Linked" label. Mobile detail sets false (label sits outside). */
  showLabel?: boolean;
}

/**
 * Linked exception shown on a task detail page. Matches the Action Register's
 * linked-entity row treatment: a pale-primary icon tile + kind eyebrow + the
 * reference, the whole row a button that deep-links to /review/:id.
 */
export function LinkedExceptionCard({ exceptionId, showLabel = true }: LinkedExceptionCardProps): React.JSX.Element {
  const navigate = useNavigate();
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      {showLabel && <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-2">Linked</p>}
      <button
        type="button"
        onClick={() => void navigate(`/review/${exceptionId}`)}
        aria-label={`Open exception ${exceptionId}`}
        className="group flex w-full items-center gap-3 rounded-lg p-1.5 text-left transition-colors hover:bg-gray-50 focus-visible:outline-none focus-kb:ring-2 focus-kb:ring-primary focus-kb:ring-inset"
      >
        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-50">
          <AlertTriangle className="h-4 w-4 text-primary" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-semibold uppercase tracking-wider text-gray-500">Exception</span>
          <span className="block truncate font-mono text-xs leading-tight text-gray-700">{exceptionId}</span>
        </span>
        <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-gray-400 transition-colors group-hover:text-gray-600" aria-hidden />
      </button>
    </div>
  );
}
