import { Sparkles } from 'lucide-react';
import { useAskImpetusStore } from '../stores/useAskImpetusStore';
import { cn } from '@/lib/utils';

export function AskImpetusFAB({ className }: { className?: string }) {
  const { isOpen, open, nudges } = useAskImpetusStore();
  const unengagedNudges = nudges.filter((n) => !n.dismissed && !n.engaged).length;

  if (isOpen) return null;

  return (
    <button
      onClick={() => open()}
      className={cn(
        'fixed bottom-6 right-4 z-20 w-14 h-14 rounded-full',
        'bg-gradient-to-br from-primary to-purple-600 text-white shadow-lg',
        'flex items-center justify-center',
        'hover:shadow-xl transition-shadow',
        'focus-visible:outline-none focus-kb:ring-2 focus-kb:ring-primary focus-kb:ring-offset-2',
        className,
      )}
      aria-label="Ask Impetus AI assistant"
    >
      <Sparkles className="w-6 h-6" />
      {unengagedNudges > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-error text-white text-xs font-bold flex items-center justify-center">
          {unengagedNudges}
        </span>
      )}
    </button>
  );
}
