import { useState, useEffect } from 'react';
import { Sparkles, ChevronUp, ChevronDown } from 'lucide-react';
import { Skeleton } from '@/components/ui';
import { cn } from '@/lib/utils';

interface MorningBriefBannerProps {
  /** Number of decisions pending in the queue */
  decisionCount: number;
  /** Total financial value at risk */
  valueAtRisk: string;
  /** Primary KPI summary (e.g., "Revenue at 74% of AOP") */
  primaryKpiStatus: string;
  /** Loading state */
  isLoading?: boolean;
  /** Error state — banner hides entirely */
  isError?: boolean;
  className?: string;
}

const STORAGE_KEY = 'impetus-morning-brief';

function getStoredState(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return true; // first visit of the day → expanded
    const { date, collapsed } = JSON.parse(stored);
    const today = new Date().toDateString();
    if (date !== today) return true; // new day → expanded
    return !collapsed;
  } catch {
    return true;
  }
}

function persistState(collapsed: boolean): void {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ date: new Date().toDateString(), collapsed }),
    );
  } catch {
    // localStorage unavailable
  }
}

export function MorningBriefBanner({
  decisionCount,
  valueAtRisk,
  primaryKpiStatus,
  isLoading,
  isError,
  className,
}: MorningBriefBannerProps) {
  const [expanded, setExpanded] = useState(getStoredState);

  // Stop the pulse animation once user scrolls past
  const [pulsing, setPulsing] = useState(true);
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) setPulsing(false);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggle = () => {
    const next = !expanded;
    setExpanded(next);
    persistState(!next);
  };

  // Error → hide entirely
  if (isError) return null;

  // Loading skeleton
  if (isLoading) {
    return (
      <div className={cn('rounded-lg border border-gray-200 bg-white p-4', className)}>
        <Skeleton className="h-5 w-3/4" />
      </div>
    );
  }

  // Collapsed → 4px accent strip
  if (!expanded) {
    return (
      <button
        onClick={toggle}
        className={cn(
          'w-full h-2 rounded-full bg-gradient-to-r from-primary/40 to-purple-400/40 hover:from-primary/60 hover:to-purple-400/60 transition-colors cursor-pointer',
          'flex items-center justify-center group',
          className,
        )}
        aria-label="Expand morning brief"
      >
        <span className="opacity-0 group-hover:opacity-100 touch:opacity-100 transition-opacity text-xs text-gray-500 flex items-center gap-1 bg-white px-2 py-0.5 rounded-full shadow-sm">
          <ChevronDown className="w-3 h-3" />
          Expand
        </span>
      </button>
    );
  }

  // Expanded — single-line banner
  const briefText = `Good morning. ${decisionCount} decision${decisionCount !== 1 ? 's' : ''} need${decisionCount === 1 ? 's' : ''} your attention · ${valueAtRisk} at risk · ${primaryKpiStatus}`;

  return (
    <div
      className={cn(
        'rounded-lg border border-gray-200 bg-white px-4 py-3 flex items-center gap-3',
        className,
      )}
    >
      {/* Pulse icon */}
      <Sparkles
        className={cn(
          'w-5 h-5 text-primary shrink-0',
          pulsing && 'animate-pulse',
        )}
      />

      {/* Brief text */}
      <p className="text-sm text-gray-700 flex-1 min-w-0 truncate sm:whitespace-normal sm:truncate">
        {briefText}
      </p>

      {/* Collapse toggle */}
      <button
        onClick={toggle}
        className="text-xs text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1 shrink-0"
        aria-label="Collapse morning brief"
      >
        Collapse
        <ChevronUp className="w-3 h-3" />
      </button>
    </div>
  );
}
