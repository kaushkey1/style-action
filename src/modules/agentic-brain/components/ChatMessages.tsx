/**
 * Chat message renderers for Ask AI — modern patterns:
 * user bubble, full-width AI answer with avatar + source citations + hover action row
 * (copy / 👍 / 👎 / regenerate), and a typing indicator.
 */
import { useState } from 'react';
import { motion } from 'motion/react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ThinkingOrb } from 'thinking-orbs';
import { Sparkles, Copy, ThumbsUp, ThumbsDown, RotateCcw, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SEND_FLIGHT_SPRING } from './chatMotion';

export interface Source {
  title: string;
  source: string;
}

function ActionBtn({ label, pressed, onClick, children }: { label: string; pressed?: boolean; onClick?: () => void; children: React.ReactNode }): React.ReactNode {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      onClick={onClick}
      className={cn('flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-gray-100 focus-visible:outline-none focus-kb:ring-2 focus-kb:ring-primary', pressed ? 'text-primary' : 'text-gray-400 hover:text-gray-700')}
    >
      {children}
    </button>
  );
}

const USER_BUBBLE_CLASSES = 'max-w-[80%] whitespace-pre-wrap rounded-lg rounded-br-sm bg-primary px-3.5 py-2 text-sm leading-relaxed text-white';

export function UserBubble({ text, skillLabel, time, layoutId }: { text: string; skillLabel?: string; time?: string; layoutId?: string }): React.ReactNode {
  return (
    <div className="flex flex-col items-end gap-1">
      {skillLabel && (
        <span className="inline-flex items-center gap-1 rounded-md bg-primary-50 px-1.5 py-0.5 text-[11px] font-medium text-primary-700">
          <Sparkles className="h-3 w-3" aria-hidden /> {skillLabel}
        </span>
      )}
      {layoutId ? (
        /* Shared-element target: the typed text FLIPs here from the composer
           row on every send. The brief 2px blur masks the width morph between
           the full-width row and the auto-sized bubble. */
        <motion.div
          layoutId={layoutId}
          transition={SEND_FLIGHT_SPRING}
          initial={{ filter: 'blur(2px)' }}
          animate={{ filter: 'blur(0px)' }}
          className={USER_BUBBLE_CLASSES}
        >
          {text}
        </motion.div>
      ) : (
        <div className={USER_BUBBLE_CLASSES}>{text}</div>
      )}
      {time && <span className="px-1 text-[11px] text-gray-400">{time}</span>}
    </div>
  );
}

export function AiMessage({ text, sources, time, onRegenerate }: { text: string; sources?: Source[]; time?: string; onRegenerate?: () => void }): React.ReactNode {
  const [vote, setVote] = useState<'up' | 'down' | null>(null);
  const [copied, setCopied] = useState(false);
  const status = copied ? 'Copied' : vote ? 'Thanks for the feedback' : time;

  function copy(): void {
    void navigator.clipboard?.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div className="group/msg flex flex-col gap-2">
      <div className="flex items-start gap-2.5">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary" aria-hidden>
          <Sparkles className="h-4 w-4" />
        </span>
        <div className="prose prose-sm min-w-0 max-w-none flex-1 pt-0.5 text-gray-700">
          <Markdown remarkPlugins={[remarkGfm]}>{text}</Markdown>
        </div>
      </div>

      {sources && sources.length > 0 && (
        <div className="ml-9 flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-gray-400">Sources</span>
          {sources.map((s, i) => (
            <span key={`${s.source}-${i}`} className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-xs text-gray-600" title={s.source}>
              <FileText className="h-3 w-3 text-primary" aria-hidden />
              <span className="max-w-[180px] truncate">{s.title || s.source}</span>
            </span>
          ))}
        </div>
      )}

      <div className="ml-9 flex items-center gap-0.5 opacity-0 transition-opacity group-hover/msg:opacity-100 focus-within:opacity-100">
        <ActionBtn label="Copy" onClick={copy}>
          <Copy className="h-3.5 w-3.5" />
        </ActionBtn>
        <ActionBtn label="Good response" pressed={vote === 'up'} onClick={() => setVote((v) => (v === 'up' ? null : 'up'))}>
          <ThumbsUp className="h-3.5 w-3.5" />
        </ActionBtn>
        <ActionBtn label="Bad response" pressed={vote === 'down'} onClick={() => setVote((v) => (v === 'down' ? null : 'down'))}>
          <ThumbsDown className="h-3.5 w-3.5" />
        </ActionBtn>
        {onRegenerate && (
          <ActionBtn label="Regenerate" onClick={onRegenerate}>
            <RotateCcw className="h-3.5 w-3.5" />
          </ActionBtn>
        )}
        {status && <span className="ml-1.5 text-[11px] text-gray-400">{status}</span>}
      </div>
    </div>
  );
}

export function TypingIndicator(): React.ReactNode {
  return (
    /* Enters with the shared chat cross-blur rise so it reads as part of the
       send sequence instead of popping in beside the flying bubble. */
    <div className="animate-chat-enter flex items-start gap-2.5">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary" aria-hidden>
        <Sparkles className="h-4 w-4" />
      </span>
      <span className="flex items-center gap-2 pt-1">
        {/* Light-only app — pin the theme so an OS dark preference can't flip
            the orb to light ink on our light background. The orb is monochrome
            by design (no color prop); the filter remaps its dark ink to the
            primary indigo (#6366f1). */}
        <ThinkingOrb
          state="composing"
          size={20}
          theme="light"
          aria-label="Assistant is composing a response"
          className="[filter:invert(44%)_sepia(51%)_saturate(4671%)_hue-rotate(224deg)_brightness(97%)_contrast(94%)]"
        />
        <span className="text-sm text-gray-500" aria-hidden>
          Thinking…
        </span>
      </span>
    </div>
  );
}
