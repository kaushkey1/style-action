import { useState, useRef, useEffect, useCallback, } from 'react';
import { createPortal } from 'react-dom';
import { X, Sparkles, Send } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/utils';
import { useAskImpetusStore } from '../stores/useAskImpetusStore';

// ---------------------------------------------------------------------------
// Suggested prompts (empty state)
// ---------------------------------------------------------------------------

const SUGGESTED_PROMPTS = [
  'What needs my approval today?',
  'Show me my worst performing format',
  'Which categories are at markdown risk?',
  'How are my agents performing?',
];

// ---------------------------------------------------------------------------
// Mock AI response generator
// ---------------------------------------------------------------------------

function mockAIResponse(prompt: string): string {
  const lower = prompt.toLowerCase();
  if (lower.includes('approval') || lower.includes('decision'))
    return 'You have 3 pending decisions in the queue. The highest-impact item is the aged inventory markdown programme at ₹262 Cr. I recommend reviewing that first.';
  if (lower.includes('worst') || lower.includes('perform'))
    return 'Fashion Factory is your worst performing format at -5.91% GM%. 93 stores are operating at a loss. The Store Economist agent has initiated a closure analysis.';
  if (lower.includes('markdown') || lower.includes('aged'))
    return 'Aged inventory is at 13.85% (₹262 Cr), breaching the 10.5% threshold. 206 K options are aged beyond 180 days. The Trading Agent has prepared a markdown batch for your approval.';
  return `Here's what I found about "${prompt}": The portfolio spans 2,653 stores with ₹1,320 Cr in revenue. GM% is at 36.56% — below the 40% green threshold. Would you like me to drill down into any specific area?`;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function AskImpetusPanel() {
  const isMobile = useIsMobile();
  const {
    isOpen, close,
    messages, addMessage,
    nudges, engageNudge, dismissNudge,
    isLoading, setLoading,
  } = useAskImpetusStore();

  const [inputValue, setInputValue] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  // Pre-loaded prompt is consumed by the store open() call.
  // For now, suggested prompts serve as the primary entry point.

  const simulateResponse = useCallback((text: string) => {
    setLoading(true);
    const delay = 800 + (Date.now() % 400);
    setTimeout(() => {
      addMessage('assistant', mockAIResponse(text));
      setLoading(false);
    }, delay);
  }, [addMessage, setLoading]);

  const handleSend = () => {
    const text = inputValue.trim();
    if (!text || isLoading) return;
    addMessage('user', text);
    setInputValue('');
    simulateResponse(text);
  };

  const handleSuggestedPrompt = (prompt: string) => {
    setInputValue(prompt);
    addMessage('user', prompt);
    simulateResponse(prompt);
  };

  if (!isOpen) return null;

  const activeNudges = nudges.filter((n) => !n.dismissed && !n.engaged);
  const hasMessages = messages.length > 0;

  const panel = (
    <>
      {/* Backdrop — tablet + mobile */}
      {(isMobile || window.innerWidth < 1280) && (
        <div
          className="fixed inset-0 z-40 bg-black/40"
          onClick={close}
          aria-hidden="true"
        />
      )}

      {/* Panel */}
      <div
        className={cn(
          'fixed z-50 bg-white flex flex-col',
          isMobile
            ? 'inset-0 top-0'
            : window.innerWidth >= 1280
              ? 'top-14 right-0 bottom-0 w-[380px] border-l border-gray-200 shadow-xl'
              : 'top-0 right-0 bottom-0 w-[80vw] max-w-[500px] border-l border-gray-200 shadow-xl',
        )}
        role="complementary"
        aria-label="Ask Impetus AI assistant"
      >
        {/* Header */}
        {/* eslint-disable-next-line design-system/prefer-section-header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="text-base font-semibold text-gray-900">Ask Impetus</h2>
          </div>
          <button
            onClick={close}
            className="p-2 -m-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg"
            aria-label="Close Ask Impetus panel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {/* Proactive nudge card */}
          {activeNudges.map((nudge) => (
            <div key={nudge.id} className="rounded-lg border border-indigo-200 bg-indigo-50/50 p-3">
              <p className="text-xs text-gray-700 leading-relaxed mb-2">{nudge.text}</p>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    engageNudge(nudge.id);
                    handleSuggestedPrompt(nudge.text);
                  }}
                >
                  Yes, show me
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={() => dismissNudge(nudge.id)}
                >
                  Dismiss
                </Button>
              </div>
            </div>
          ))}

          {/* Suggested prompts — only when no messages */}
          {!hasMessages && activeNudges.length === 0 && (
            <div className="space-y-3">
              <div className="text-center py-4">
                <Sparkles className="w-8 h-8 text-primary/30 mx-auto mb-2" />
                <h3 className="text-sm font-semibold text-gray-900">Welcome to Ask Impetus</h3>
                <p className="text-xs text-gray-500 mt-1">Your AI-powered command center.</p>
              </div>
              <div className="space-y-2">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleSuggestedPrompt(prompt)}
                    className="w-full text-left px-3 py-2.5 rounded-lg border border-gray-200 text-xs text-gray-700 hover:bg-gray-50 hover:border-primary/30 transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chat messages */}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                'max-w-[85%] rounded-lg px-3 py-2.5',
                msg.role === 'user'
                  ? 'ml-auto bg-primary text-white'
                  : 'mr-auto bg-gray-100 text-gray-900',
              )}
            >
              <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.content}</p>
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex items-center gap-2 mr-auto bg-gray-100 rounded-lg px-3 py-2.5">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" />
                <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:150ms]" />
                <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="shrink-0 px-4 py-3 border-t border-gray-100 bg-white pb-safe">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type your question..."
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <Button
              size="sm"
              onClick={handleSend}
              disabled={!inputValue.trim() || isLoading}
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-gray-400 text-center mt-1.5">Powered by Impetus AI</p>
        </div>
      </div>
    </>
  );

  return createPortal(panel, document.body);
}
