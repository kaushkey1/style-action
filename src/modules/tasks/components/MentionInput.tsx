import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  useEffect,
  useId,
  useMemo,
} from 'react';
import { Avatar } from '@/components/ui';
import { cn } from '@/lib/utils';
import { useUsers } from '../hooks/useUsers';
import type { User } from '../types/task.types';

export interface MentionInputHandle {
  clear: () => void;
  focus: () => void;
}

export interface MentionChange {
  /** Plain-text serialization: chips become `@email`, line breaks become `\n`. */
  text: string;
  /** Emails of every mention chip currently in the editor. */
  mentions: string[];
}

interface MentionInputProps {
  onChange: (value: MentionChange) => void;
  onSubmit: () => void;
  placeholder?: string;
  ariaLabel?: string;
}

/** Soft-indigo identity pill. contentEditable=false → the browser deletes it as one unit. */
const CHIP_CLASS =
  'mention-chip inline-flex items-center rounded bg-primary/10 px-1.5 py-0.5 align-middle text-sm font-medium leading-none text-primary';

const MENTION_RE = /@([^\s@]*)$/;
const MENTION_DEBOUNCE_MS = 200;
const MAX_SUGGESTIONS = 5;

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

/** Serialize the editor DOM back to a plain string. Chips → `@email`, blocks/BR → `\n`. */
function serialize(root: HTMLElement): string {
  const parts: string[] = [];
  const walk = (node: Node): void => {
    node.childNodes.forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        parts.push((child as Text).data.replace(/\u00A0/g, ' '));
      } else if (child instanceof HTMLElement) {
        const email = child.getAttribute('data-email');
        if (email) {
          parts.push(`@${email}`);
        } else if (child.tagName === 'BR') {
          parts.push('\n');
        } else {
          if ((child.tagName === 'DIV' || child.tagName === 'P') && parts.length > 0) {
            parts.push('\n');
          }
          walk(child);
        }
      }
    });
  };
  walk(root);
  return parts.join('');
}

/** Find an in-progress `@query` token immediately before a collapsed caret. */
function getMentionMatch(root: HTMLElement): { range: Range; query: string } | null {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || !sel.isCollapsed) return null;
  const node = sel.anchorNode;
  if (!node || node.nodeType !== Node.TEXT_NODE || !root.contains(node)) return null;
  const offset = sel.anchorOffset;
  const before = (node as Text).data.slice(0, offset);
  const match = before.match(MENTION_RE);
  if (!match) return null;
  const at = match.index ?? 0;
  const prev = at > 0 ? before[at - 1] : '';
  // Only trigger when `@` starts a token (start-of-node or after whitespace) — never mid-email.
  if (prev && !/\s/.test(prev)) return null;
  const range = document.createRange();
  range.setStart(node, at);
  range.setEnd(node, offset);
  return { range, query: match[1] ?? '' };
}

function chipLabel(user: User): string {
  return user.name.trim() || user.email.split('@')[0] || user.email;
}

/**
 * Rich comment input with @mention pill chips. Replaces a plain textarea so a
 * mention renders as a real chip (name shown, `@email` stored). Manages the
 * contentEditable DOM imperatively — React never re-renders the editor body, so
 * the caret and chips survive keystrokes.
 */
export const MentionInput = forwardRef<MentionInputHandle, MentionInputProps>(
  ({ onChange, onSubmit, placeholder, ariaLabel }, ref) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);
    const [isEmpty, setIsEmpty] = useState(true);
    const listboxId = useId();

    const debouncedQuery = useDebouncedValue(query, MENTION_DEBOUNCE_MS);
    const { data: users = [] } = useUsers({ search: debouncedQuery, enabled: open });
    const suggestions = useMemo(() => users.slice(0, MAX_SUGGESTIONS), [users]);
    // Suggestions arrive async; clamp the highlighted option to the current list.
    const activeOption = suggestions.length > 0 ? Math.min(activeIndex, suggestions.length - 1) : 0;

    const emitChange = (): void => {
      const root = editorRef.current;
      if (!root) return;
      const text = serialize(root);
      const mentions = Array.from(root.querySelectorAll('[data-email]'), (el) =>
        el.getAttribute('data-email'),
      ).filter((v): v is string => Boolean(v));
      setIsEmpty(text.trim() === '');
      onChange({ text, mentions });
    };

    useImperativeHandle(ref, () => ({
      clear: () => {
        if (editorRef.current) editorRef.current.innerHTML = '';
        setOpen(false);
        setQuery('');
        setIsEmpty(true);
        onChange({ text: '', mentions: [] });
      },
      focus: () => editorRef.current?.focus(),
    }));

    const handleInput = (): void => {
      const root = editorRef.current;
      if (!root) return;
      const match = getMentionMatch(root);
      if (match) {
        setQuery(match.query);
        setActiveIndex(0);
        setOpen(true);
      } else {
        setOpen(false);
      }
      emitChange();
    };

    const selectUser = (user: User): void => {
      const root = editorRef.current;
      if (!root) return;
      const match = getMentionMatch(root);
      if (!match) return;
      match.range.deleteContents();

      const chip = document.createElement('span');
      chip.setAttribute('data-email', user.email);
      chip.setAttribute('contenteditable', 'false');
      chip.className = CHIP_CLASS;
      chip.textContent = `@${chipLabel(user)}`;
      match.range.insertNode(chip);

      // Trailing nbsp so the caret has a landing spot after the chip.
      const space = document.createTextNode('\u00A0');
      chip.after(space);
      const sel = window.getSelection();
      if (sel) {
        const caret = document.createRange();
        caret.setStart(space, 1);
        caret.collapse(true);
        sel.removeAllRanges();
        sel.addRange(caret);
      }

      setOpen(false);
      setQuery('');
      root.focus();
      emitChange();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>): void => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        onSubmit();
        return;
      }
      if (open && suggestions.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setActiveIndex((i) => (i + 1) % suggestions.length);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setActiveIndex((i) => (i - 1 + suggestions.length) % suggestions.length);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          const user = suggestions[activeOption];
          if (user) selectUser(user);
        } else if (e.key === 'Escape') {
          e.preventDefault();
          setOpen(false);
        }
      }
    };

    return (
      <div className="relative w-full">
        <div
          ref={editorRef}
          role="textbox"
          aria-multiline="true"
          aria-label={ariaLabel}
          aria-activedescendant={open && suggestions.length > 0 ? `${listboxId}-${activeOption}` : undefined}
          tabIndex={0}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onBlur={() => setOpen(false)}
          className={cn(
            'w-full rounded-lg border border-gray-200 bg-white transition-colors',
            'min-h-[5.5rem] max-h-60 overflow-y-auto whitespace-pre-wrap break-words',
            'px-4 py-3 text-base lg:text-sm text-gray-900 leading-6 cursor-text',
            'focus:outline-none focus-kb:ring-2 focus-kb:ring-primary/20 focus-kb:border-primary',
          )}
        />
        {isEmpty && placeholder && (
          <span className="pointer-events-none absolute left-4 top-3 text-base lg:text-sm text-gray-500">
            {placeholder}
          </span>
        )}
        {open && suggestions.length > 0 && (
          <ul
            id={listboxId}
            role="listbox"
            aria-label="User mentions"
            className="absolute left-0 right-0 top-full z-10 mt-1 max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-md"
          >
            {suggestions.map((user, i) => (
              <li key={user.email} id={`${listboxId}-${i}`} role="option" aria-selected={i === activeOption}>
                <button
                  type="button"
                  // preventDefault on mousedown keeps the editor focused so the caret
                  // (and the @query range) survives the click.
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectUser(user)}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={cn(
                    'flex w-full items-center gap-2 px-3 py-2 text-left text-sm',
                    i === activeOption ? 'bg-gray-50' : 'hover:bg-gray-50',
                  )}
                >
                  <Avatar name={user.name} size="xs" />
                  <span className="font-medium text-gray-900">{user.name}</span>
                  <span className="truncate text-xs text-gray-500">{user.email}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  },
);

MentionInput.displayName = 'MentionInput';
