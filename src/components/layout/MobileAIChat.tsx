import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Plus, Sparkles, AlertTriangle, BarChart3, Package, type LucideIcon } from 'lucide-react';
import { useNavigationStore } from '@/hooks/useNavigationStore';
import { getProductById } from '@/data/navigationConfig';
import { cn } from '@/lib/utils';

// ─── Mock AI responses ───────────────────────────────────────────────────────

const mockResponses: Record<string, string> = {
  default:
    'I can help you with that. Based on the current data, here are the key insights:\n\n1. **Revenue** is tracking 3.2% above target\n2. **Inventory health** shows 4 categories with excess stock\n3. **Exception queue** has 3 critical items pending approval\n\nWould you like me to drill into any of these?',
  exceptions:
    'There are currently **6 active exceptions** across your portfolio:\n\n- **3 Critical (S1)**: Stock-out risk in Premium Men\'s, delivery delay in Mumbai DC, margin breach on Summer collection\n- **2 High (S2)**: Quality hold on incoming shipment, vendor payment escalation\n- **1 Medium (S3)**: Forecast variance in Kids category\n\nThe 3 critical items need your approval. Shall I open the approval queue?',
  inventory:
    'Here\'s your inventory snapshot:\n\n- **DOH**: 42 days (target: 38)\n- **GMROI**: 3.2x (green)\n- **Slow movers**: 127 SKUs flagged for markdown\n- **Stock-out risk**: 23 SKUs across 5 stores\n\nThe allocation agent has prepared recommendations for the slow movers. Would you like to review them?',
};

function getAIResponse(userMessage: string): string {
  const lower = userMessage.toLowerCase();
  if (lower.includes('exception') || lower.includes('approval') || lower.includes('critical')) {
    return mockResponses.exceptions ?? mockResponses.default ?? '';
  }
  if (lower.includes('inventory') || lower.includes('stock') || lower.includes('allocation')) {
    return mockResponses.inventory ?? mockResponses.default ?? '';
  }
  return mockResponses.default ?? '';
}

// ─── Suggestion data ─────────────────────────────────────────────────────────

interface Suggestion {
  icon: LucideIcon;
  text: string;
  color: string;
}

const defaultSuggestions: Suggestion[] = [
  { icon: AlertTriangle, text: 'Show critical exceptions', color: 'text-error' },
  { icon: BarChart3, text: "How's revenue vs target?", color: 'text-primary' },
  { icon: Package, text: 'Inventory health summary', color: 'text-amber-600' },
];

// ─── Bold markdown parser ────────────────────────────────────────────────────

function renderBoldMarkdown(content: string) {
  return content.split(/(\*\*.*?\*\*)/).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <strong key={i} className="font-semibold text-gray-900">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export function MobileAIChat() {
  const isAskImpetusOpen = useNavigationStore((s) => s.isAskImpetusOpen);
  const setAskImpetusOpen = useNavigationStore((s) => s.setAskImpetusOpen);
  const chatMessages = useNavigationStore((s) => s.chatMessages);
  const addChatMessage = useNavigationStore((s) => s.addChatMessage);
  const clearChatMessages = useNavigationStore((s) => s.clearChatMessages);
  const activeProductId = useNavigationStore((s) => s.activeProductId);

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [gifFinished, setGifFinished] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const product = activeProductId ? getProductById(activeProductId) : null;
  const contextLabel = product ? product.label : 'Console Home';
  const hasMessages = chatMessages.length > 0;

  // Play-once timer for welcome GIF — swaps to static after 2s
  useEffect(() => {
    if (!isAskImpetusOpen || hasMessages) return;
    const timer = setTimeout(() => setGifFinished(true), 2000);
    return () => {
      clearTimeout(timer);
      setGifFinished(false);
    };
  }, [isAskImpetusOpen, hasMessages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isTyping]);

  // Lock body scroll and focus input on open
  useEffect(() => {
    if (isAskImpetusOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => inputRef.current?.focus(), 300);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isAskImpetusOpen]);

  if (!isAskImpetusOpen) return null;

  const handleSend = (text?: string) => {
    const message = text ?? input.trim();
    if (!message || isTyping) return;

    addChatMessage('user', message);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      addChatMessage('assistant', getAIResponse(message));
      setIsTyping(false);
    }, 1200);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col animate-in slide-in-from-bottom duration-300">
      {/* Dark header */}
      <div className="bg-[#141414] px-4 pb-3 pt-[calc(env(safe-area-inset-top,0px)+1rem)] flex items-center gap-3 shrink-0">
        <button
          onClick={() => setAskImpetusOpen(false)}
          className="min-w-10 min-h-10 flex items-center justify-center text-white/70 hover:text-white focus-visible:outline-none focus-kb:ring-2 focus-kb:ring-white/50 rounded-lg"
          aria-label="Close chat"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <img
          src="/ai-star-static.webp"
          alt=""
          className="w-8 h-8 rounded-full shrink-0"
        />

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white">Ask Impetus</p>
          <p className="text-xs text-white/50 truncate">Context: {contextLabel}</p>
        </div>

        <button
          onClick={() => {
            clearChatMessages();
            setInput('');
          }}
          className="min-w-10 min-h-10 flex items-center justify-center text-white/50 hover:text-white focus-visible:outline-none focus-kb:ring-2 focus-kb:ring-white/50 rounded-lg"
          aria-label="New chat"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Welcome state */}
        {!hasMessages && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <img
              src={gifFinished ? '/ai-star-static.webp' : '/ai-star-dynamic.gif'}
              alt="Impetus AI"
              className="w-16 h-16 mx-auto mb-4"
            />
            <p className="text-lg font-semibold text-gray-900 mb-1">How can I help?</p>
            <p className="text-sm text-gray-500 max-w-[280px] mb-6">
              Ask me about exceptions, inventory, performance, or any business insight.
            </p>

            {/* Suggestion cards */}
            <div className="w-full max-w-sm space-y-2">
              {defaultSuggestions.map((suggestion) => {
                const Icon = suggestion.icon;
                return (
                  <button
                    key={suggestion.text}
                    onClick={() => handleSend(suggestion.text)}
                    className="w-full flex items-center gap-3 bg-white rounded-lg border border-gray-200 shadow-sm p-3 text-left transition-all active:scale-[0.98] hover:border-primary/30 hover:shadow-md focus-visible:outline-none focus-kb:ring-2 focus-kb:ring-primary"
                  >
                    <Icon className={cn('w-5 h-5 shrink-0', suggestion.color)} />
                    <span className="text-sm text-gray-900">{suggestion.text}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Chat messages */}
        {hasMessages && chatMessages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              'max-w-[85%]',
              msg.role === 'user' ? 'ml-auto' : 'mr-auto',
            )}
          >
            {msg.role === 'user' ? (
              /* eslint-disable-next-line no-restricted-syntax -- chat bubbles use rounded-2xl per spec */
              <div className="bg-primary text-white rounded-2xl rounded-br-sm px-4 py-2.5 text-sm">
                {msg.content}
              </div>
            ) : (
              /* eslint-disable-next-line no-restricted-syntax -- chat bubbles use rounded-2xl per spec */
              <div className="bg-[#f7f0ff] rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {renderBoldMarkdown(msg.content)}
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex items-center gap-1.5 text-gray-400 mr-auto">
            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse" />
            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse [animation-delay:150ms]" />
            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse [animation-delay:300ms]" />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className="shrink-0 border-t border-gray-200 px-4 py-3 bg-white">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-gray-400 shrink-0" />
          {/* eslint-disable-next-line no-restricted-syntax -- chat input requires custom styling outside Input component */}
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything..."
            className="flex-1 h-11 px-4 text-base bg-gray-100 text-gray-900 placeholder:text-gray-400 rounded-full border-0 focus:outline-none focus-kb:ring-2 focus-kb:ring-primary/20"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isTyping}
            className={cn(
              'min-w-11 min-h-11 flex items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-kb:ring-2 focus-kb:ring-primary',
              input.trim() && !isTyping
                ? 'bg-primary text-white hover:bg-primary-700'
                : 'bg-gray-200 text-gray-400',
            )}
            aria-label="Send message"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

        {/* Footer */}
        <p className="text-xs text-gray-400 text-center py-1 pb-safe">
          Powered by Impetus AI{' '}
          <img src="/impetus-mark.svg" alt="" className="w-3 h-3 inline-block" />
        </p>
      </div>
    </div>
  );
}
