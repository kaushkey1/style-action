import { useState } from 'react';
import { Sparkles, X, ArrowRight } from 'lucide-react';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useNavigationStore } from '@/hooks/useNavigationStore';
import { cn } from '@/lib/utils';

const insightMessages = [
  'Revenue is 3.2% above target today. 4 exceptions need your attention.',
  'Inventory DOH at 42 days — 5 categories exceed threshold. Agent has prepared markdown recommendations.',
  '3 critical exceptions are awaiting your approval. Estimated impact: ₹1.2 Cr.',
];

export function MobileAIInsightStrip() {
  const isMobile = useIsMobile();
  const { setAskImpetusOpen, addChatMessage } = useNavigationStore();
  const [dismissed, setDismissed] = useState(false);

  if (!isMobile || dismissed) return null;

  // Show a rotating insight — use simple index based on current hour
  const insightIndex = new Date().getHours() % insightMessages.length;
  const insight = insightMessages[insightIndex];

  const handleInvestigate = () => {
    addChatMessage('user', `Tell me more about: ${insight}`);
    setTimeout(() => {
      addChatMessage(
        'assistant',
        `Here's a detailed breakdown:\n\n${insight}\n\nThis is a prototype demonstration. In production, I would provide real-time drill-down analysis with actionable recommendations.\n\nWould you like me to open the relevant dashboard?`,
      );
    }, 1000);
    setAskImpetusOpen(true);
  };

  return (
    <div
      className={cn(
        'mx-4 mt-2 mb-3 p-3 rounded-lg',
        'bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200',
        'lg:hidden',
      )}
    >
      <div className="flex items-start gap-2.5">
        <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-700 leading-relaxed">{insight}</p>
          <button
            onClick={handleInvestigate}
            className="flex items-center gap-1 mt-1.5 text-xs font-medium text-primary hover:text-primary-700"
          >
            Investigate
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="min-w-8 min-h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 shrink-0"
          aria-label="Dismiss insight"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
