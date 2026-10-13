import { useState, useRef, useCallback } from 'react';
import { Send, Copy, Check } from 'lucide-react';
import { Input, HoverCard } from '@/components/ui';
import { cn, formatDateTime } from '@/lib/utils';
import type { ConversationMessage } from '../data/mockReviewData';

const AUTHOR_PROFILES: Record<string, { name: string; role: string; email: string }> = {
  'Priya Shah': { name: 'Priya Shah', role: 'Category Manager, Womenswear', email: 'priya.shah@relianceretail.com' },
  'Pradeep Kumar': { name: 'Pradeep Kumar', role: 'Category Manager, Menswear', email: 'pradeep.kumar@relianceretail.com' },
  'Rahul Kumar': { name: 'Rahul Kumar', role: 'CEO, Fashion & Lifestyle', email: 'rahul.kumar@relianceretail.com' },
  'Sourcing Director': { name: 'Sourcing Director', role: 'Head of Sourcing', email: 'sourcing.head@relianceretail.com' },
  'Operations Head': { name: 'Operations Head', role: 'VP Operations', email: 'ops.head@relianceretail.com' },
};

function CopyableEmail({ email }: { email: string }): React.ReactNode {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
      onClick={(e) => {
        e.stopPropagation();
        void navigator.clipboard.writeText(email);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      aria-label={`Copy ${email}`}
    >
      <span className="truncate">{email}</span>
      {copied ? <Check className="w-3 h-3 text-green-600 shrink-0" /> : <Copy className="w-3 h-3 shrink-0" />}
    </button>
  );
}

function AuthorAvatar({ message }: { message: ConversationMessage }): React.ReactNode {
  if (message.authorType === 'system') return null;

  if (message.authorType === 'agent') {
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 text-xs font-semibold text-gray-700 shrink-0">
        AI
      </span>
    );
  }

  const initials = message.authorName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const profile = AUTHOR_PROFILES[message.authorName];

  const avatar = (
    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-200 text-xs font-medium text-gray-600 shrink-0 cursor-pointer">
      {initials}
    </span>
  );

  if (!profile) return avatar;

  return (
    <HoverCard
      trigger={avatar}
      title={profile.name}
    >
      <div className="space-y-2">
        <div>
          <p className="text-sm font-semibold text-gray-900">{profile.name}</p>
          <p className="text-xs text-gray-500 mt-0.5">{profile.role}</p>
        </div>
        <CopyableEmail email={profile.email} />
      </div>
    </HoverCard>
  );
}

const MENTION_SUGGESTIONS = [
  { id: 'priya-shah', name: 'Priya Shah', email: 'priya.shah@relianceretail.com', role: 'Category Manager, Womenswear' },
  { id: 'pradeep-kumar', name: 'Pradeep Kumar', email: 'pradeep.kumar@relianceretail.com', role: 'Category Manager, Menswear' },
  { id: 'rahul-kumar', name: 'Rahul Kumar', email: 'rahul.kumar@relianceretail.com', role: 'CEO' },
  { id: 'sourcing-director', name: 'Sourcing Director', email: 'sourcing.head@relianceretail.com', role: 'Head of Sourcing' },
  { id: 'pricing-agent', name: 'Pricing Agent', email: 'pricing-agent@impetus.ai', role: 'AI Agent', type: 'agent' as const },
  { id: 'vendor-agent', name: 'Vendor Agent', email: 'vendor-agent@impetus.ai', role: 'AI Agent', type: 'agent' as const },
  { id: 'inventory-agent', name: 'Inventory Agent', email: 'inventory-agent@impetus.ai', role: 'AI Agent', type: 'agent' as const },
];

interface ConversationThreadProps {
  messages: ConversationMessage[];
  onSendMessage?: (content: string) => void;
}

export function ConversationThread({ messages, onSendMessage }: ConversationThreadProps): React.ReactNode {
  const [draft, setDraft] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredSuggestions = mentionQuery
    ? MENTION_SUGGESTIONS.filter((s) =>
        s.name.toLowerCase().includes(mentionQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(mentionQuery.toLowerCase()),
      )
    : MENTION_SUGGESTIONS;

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDraft(value);

    const lastAt = value.lastIndexOf('@');
    if (lastAt >= 0 && lastAt === value.length - 1) {
      setShowMentions(true);
      setMentionQuery('');
    } else if (lastAt >= 0 && !value.slice(lastAt + 1).includes(' ')) {
      setShowMentions(true);
      setMentionQuery(value.slice(lastAt + 1));
    } else {
      setShowMentions(false);
      setMentionQuery('');
    }
  }, []);

  const handleSelectMention = useCallback((email: string) => {
    const lastAt = draft.lastIndexOf('@');
    const before = draft.slice(0, lastAt);
    setDraft(`${before}@${email} `);
    setShowMentions(false);
    setMentionQuery('');
    inputRef.current?.focus();
  }, [draft]);

  const handleSend = (): void => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    onSendMessage?.(trimmed);
    setDraft('');
    setShowMentions(false);
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-900">Activity</h3>

      <div className="space-y-3">
        {messages.map((msg) => {
          if (msg.authorType === 'system') {
            return (
              <div key={msg.id} className="text-center">
                <p className="text-xs text-gray-400 italic">
                  {msg.authorName} · {formatDateTime(new Date(msg.timestamp))} — {msg.content}
                </p>
              </div>
            );
          }

          return (
            <div key={msg.id} className={cn(
              'flex items-start gap-2',
              msg.authorType === 'agent' && 'bg-gray-50 rounded-lg p-2.5 -mx-2.5',
            )}>
              <AuthorAvatar message={msg} />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1.5">
                  <span className={cn(
                    'text-xs font-medium',
                    msg.authorType === 'agent' ? 'text-gray-900' : 'text-gray-700',
                  )}>
                    {msg.authorType === 'agent' ? `(AI) ${msg.authorName}` : msg.authorName}
                  </span>
                  <span className="text-xs text-gray-400">{formatDateTime(new Date(msg.timestamp))}</span>
                </div>
                <p className="text-sm text-gray-700 mt-0.5">{msg.content}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Comment input with @mention autocomplete */}
      <div className="relative">
        <div className="flex items-stretch gap-2">
          <Input
            ref={inputRef}
            value={draft}
            onChange={handleInputChange}
            placeholder="Add a comment or @mention to assign"
            containerClassName="flex-1 min-w-0"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !showMentions) {
                e.preventDefault();
                handleSend();
              }
              if (e.key === 'Escape') {
                setShowMentions(false);
              }
            }}
            aria-label="Add a comment"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!draft.trim()}
            aria-label="Send comment"
            className="shrink-0 rounded-lg border border-gray-200 bg-white px-3 text-gray-400 hover:text-gray-600 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        {/* Mention dropdown — shows email + name */}
        {showMentions && filteredSuggestions.length > 0 && (
          <div className="absolute bottom-full left-0 right-0 mb-1 bg-white rounded-lg border border-gray-200 shadow-lg max-h-48 overflow-y-auto z-10">
            {filteredSuggestions.map((suggestion) => (
              <button
                key={suggestion.id}
                type="button"
                onClick={() => handleSelectMention(suggestion.email)}
                className="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors min-h-10"
              >
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-200 text-xs font-medium text-gray-600 shrink-0">
                  {suggestion.type === 'agent' ? 'AI' : suggestion.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 truncate">{suggestion.name}</p>
                  <p className="text-xs text-gray-400 truncate">{suggestion.email}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
