/**
 * AiComposer — the unified DS composer for Ask AI (Agentic Brain chat).
 * Attach (+), mode dropdown, and send live inside one rounded-lg box (concentric radii 8 = 4 + 4).
 * Skills: type "/" for the composer-anchored picker (keyboard-navigable, start-only) or the centered
 * Skills button for the manager. A selected skill shows as a start pill (hover ✕); backspace removes it.
 */
import { useState, useRef, useEffect, useImperativeHandle } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, ArrowUp, ChevronDown, Bot, Zap, X, Upload, Sparkles, Check, Search } from 'lucide-react';
import {
  Button, BottomSheet,
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  Tooltip, TooltipTrigger, TooltipContent,
} from '@/components/ui';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { SkillsMenu, SkillPill } from './SkillsMenu';
import { FILE_INPUT_ACCEPT, getFileVisual } from './composerFiles';
import { SEND_SPRING } from './chatMotion';
import type { DisplaySkill } from './skillsCatalog';

export type ComposerMode = 'assistant' | 'analyst';

export interface AiComposerHandle {
  /** Append files to the composer's attachment chips (e.g. from drag-and-drop). */
  addFiles: (files: File[]) => void;
  /** Pre-select a skill pill (e.g. "Use in Chat" from a Capability detail page). */
  setSkill: (skill: DisplaySkill) => void;
}

interface AiComposerProps {
  mode: ComposerMode;
  onModeChange: (m: ComposerMode) => void;
  onSend: (text: string, opts: { skill: DisplaySkill | null; files: File[] }) => void;
  showSkillsButton?: boolean;
  placeholder?: string;
  /** Knowledge Search toggle — while on, sends act as knowledge-base searches.
      Shown as a removable chip next to + (GPT web-search pattern). */
  kbSearch?: boolean;
  onKbSearchChange?: (on: boolean) => void;
  /** Shared-element id for the text row — lets the typed text FLIP into the
      newest chat bubble on send. The caller advances the id per send (e.g.
      `sent-message-<seq>`); the row remounts under the fresh id so the
      outgoing bubble can claim the previous one in the same commit. */
  textLayoutId?: string;
  ref?: React.Ref<AiComposerHandle>;
}

export function AiComposer({ mode, onModeChange, onSend, showSkillsButton = true, placeholder, kbSearch = false, onKbSearchChange, textLayoutId, ref }: AiComposerProps): React.ReactNode {
  const [input, setInput] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [skill, setSkill] = useState<DisplaySkill | null>(null);
  const [skillsOpen, setSkillsOpen] = useState(false);
  const [skillsMode, setSkillsMode] = useState<'picker' | 'manager'>('picker');
  const [slashMode, setSlashMode] = useState(false);
  // Mobile: attach + mode menus open as bottom sheets instead of dropdowns.
  const isMobile = useIsMobile();
  const [attachSheetOpen, setAttachSheetOpen] = useState(false);
  const [modeSheetOpen, setModeSheetOpen] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    addFiles: (picked: File[]) => {
      if (picked.length > 0) setFiles((f) => [...f, ...picked]);
    },
    setSkill: (picked: DisplaySkill) => {
      setSkill(picked);
      setInput('');
      setSlashMode(false);
      setTimeout(() => taRef.current?.focus(), 0);
    },
  }), []);

  const ModeIcon = mode === 'assistant' ? Bot : Zap;
  const modeText = mode === 'assistant' ? 'AI Assistant' : 'AI Analyst';
  const canAddSkill = !skill && input.trim() === '' && !kbSearch;
  // Knowledge Search sends are queries — text required, skills/files don't apply.
  const canSend = kbSearch
    ? input.trim().length > 0 && !slashMode
    : (input.trim().length > 0 || files.length > 0 || skill !== null) && !slashMode;

  function toggleKbSearch(on: boolean): void {
    if (!onKbSearchChange) return;
    onKbSearchChange(on);
    if (on) {
      setSkill(null);
      setSlashMode(false);
      setSkillsOpen(false);
    }
    setTimeout(() => taRef.current?.focus(), 0);
  }

  // auto-grow textarea
  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [input]);

  // close skills on outside-click / Esc
  useEffect(() => {
    if (!skillsOpen) return;
    const reset = (): void => {
      setSkillsOpen(false);
      if (slashMode) { setSlashMode(false); setInput(''); }
    };
    const onDoc = (e: MouseEvent): void => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) reset();
    };
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') reset();
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [skillsOpen, slashMode]);

  function pickSkill(s: DisplaySkill): void {
    setSkill(s);
    setSkillsOpen(false);
    setSlashMode(false);
    setInput('');
    setTimeout(() => taRef.current?.focus(), 0);
  }

  function submit(): void {
    if (!canSend) return;
    onSend(input.trim(), { skill, files });
    setInput('');
    // Knowledge Search sends don't consume attachments — keep them for when the chip comes off.
    if (!kbSearch) {
      setSkill(null);
      setFiles([]);
    }
    // The text row remounts under a fresh layoutId after send (shared-element
    // handoff to the chat bubble) — restore focus so typing continues seamlessly.
    requestAnimationFrame(() => taRef.current?.focus());
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>): void {
    const picked = Array.from(e.target.files ?? []);
    if (picked.length > 0) setFiles((f) => [...f, ...picked]);
    e.target.value = '';
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>): void {
    if (e.key === '/' && canAddSkill) {
      e.preventDefault();
      setSkillsMode('picker');
      setSlashMode(true);
      setSkillsOpen(true);
      return;
    }
    if (e.key === 'Backspace' && input === '') {
      if (slashMode) { e.preventDefault(); setSlashMode(false); setSkillsOpen(false); return; }
      if (skill) { e.preventDefault(); setSkill(null); return; }
    }
    if (e.key === 'Enter' && !e.shiftKey && !slashMode) {
      e.preventDefault();
      submit();
    }
  }

  const resolvedPlaceholder = slashMode
    ? 'Select a Skill'
    : skill
      ? 'Add details… (optional)'
      : kbSearch
        ? 'Search the knowledge base…'
        : placeholder ?? 'Ask anything…   (/ for skills)';

  return (
    <div ref={rootRef}>
      <div className="relative">
        <div className="rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
          {/* eslint-disable-next-line no-restricted-syntax -- hidden native file input for attachments */}
          <input ref={fileInputRef} type="file" accept={FILE_INPUT_ACCEPT} multiple className="hidden" onChange={handleFileSelect} />

          <AnimatePresence initial={false}>
            {files.length > 0 && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2, ease: 'easeOut' }} className="overflow-hidden">
                <div className="flex flex-wrap gap-2 px-2 pb-1 pt-1">
                  {files.map((f, i) => {
                    const visual = getFileVisual(f);
                    const VisualIcon = visual.icon;
                    return (
                      <span key={`${f.name}-${i}`} className="flex w-56 select-none items-center gap-2 rounded-lg border border-gray-200 bg-white py-1.5 pl-1.5 pr-2">
                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${visual.tileClass}`}>
                          <VisualIcon className="h-4 w-4" aria-hidden />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-xs font-medium text-gray-900">{f.name}</span>
                          <span className="block text-xs uppercase text-gray-400">{visual.label}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                          className="ml-1 shrink-0 rounded-sm p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 focus-visible:outline-none focus-kb:ring-2 focus-kb:ring-primary"
                          aria-label={`Remove ${f.name}`}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* key forces a clean remount when the layoutId advances after a send —
              the old row unmounts as the bubble mounts, giving Motion an
              unambiguous shared-element pairing on every message. */}
          <motion.div key={textLayoutId ?? 'text-row'} layoutId={textLayoutId} transition={SEND_SPRING} className="flex items-start gap-2 px-2 pt-1.5">
            {skill && <SkillPill label={skill.label} icon={skill.icon} onRemove={() => setSkill(null)} />}
            {slashMode && <span className="pt-1 text-sm font-semibold text-primary" aria-hidden>/</span>}
            {/* eslint-disable-next-line no-restricted-syntax -- composer needs a borderless auto-grow textarea */}
            <textarea
              ref={taRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={resolvedPlaceholder}
              aria-label="Message input"
              className="block flex-1 resize-none bg-transparent pt-1 text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
            />
          </motion.div>

          <div className="mt-3 flex items-center gap-1.5 px-1">
            {/* attach — bottom sheet on mobile, dropdown on desktop */}
            {isMobile ? (
              <button
                type="button"
                aria-label="Add attachment"
                onClick={() => setAttachSheetOpen(true)}
                className="flex h-9 w-9 items-center justify-center rounded-sm text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-kb:ring-2 focus-kb:ring-primary"
              >
                <Plus className="h-5 w-5" />
              </button>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button type="button" aria-label="Add attachment" className="flex h-9 w-9 items-center justify-center rounded-sm text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-kb:ring-2 focus-kb:ring-primary">
                    <Plus className="h-5 w-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" side="top" className="w-56">
                  <DropdownMenuItem onSelect={() => fileInputRef.current?.click()}>
                    <Upload className="mr-2 h-4 w-4" /> Upload files
                  </DropdownMenuItem>
                  {onKbSearchChange && (
                    <DropdownMenuItem onSelect={() => toggleKbSearch(!kbSearch)}>
                      <Search className="mr-2 h-4 w-4" /> Knowledge Search
                      {kbSearch && <Check className="ml-auto h-4 w-4 text-primary" />}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Knowledge Search chip — hover swaps the icon to ✕ (always ✕ on touch); click removes */}
            {kbSearch && onKbSearchChange && (
              <button
                type="button"
                onClick={() => toggleKbSearch(false)}
                aria-pressed="true"
                aria-label="Turn off Knowledge Search"
                className="group/kbs inline-flex h-9 shrink-0 select-none items-center gap-1.5 rounded-lg border border-primary-200 bg-primary-50 px-2.5 text-xs font-medium text-primary-700 transition-colors hover:bg-primary-100 focus-visible:outline-none focus-kb:ring-2 focus-kb:ring-primary"
              >
                <Search className="h-3.5 w-3.5 group-hover/kbs:hidden touch:hidden" aria-hidden />
                <X className="hidden h-3.5 w-3.5 group-hover/kbs:block touch:block" aria-hidden />
                Knowledge Search
              </button>
            )}

            {/* mode — hidden while Knowledge Search is on (sends are searches, not chats);
                bottom sheet on mobile, dropdown on desktop */}
            {!kbSearch && (isMobile ? (
              <button
                type="button"
                aria-label={`Mode: ${modeText}`}
                onClick={() => setModeSheetOpen(true)}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100 focus-visible:outline-none focus-kb:ring-2 focus-kb:ring-primary"
              >
                <ModeIcon className="h-3.5 w-3.5 text-primary" />
                {modeText}
                <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
              </button>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button type="button" aria-label={`Mode: ${modeText}`} className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100 focus-visible:outline-none focus-kb:ring-2 focus-kb:ring-primary">
                  <ModeIcon className="h-3.5 w-3.5 text-primary" />
                  {modeText}
                  <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" side="top" className="w-64">
                  <DropdownMenuItem className="items-start gap-2" onSelect={() => onModeChange('assistant')}>
                    <Bot className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-gray-900">AI Assistant</div>
                      <div className="text-xs text-gray-500">Answers from your company knowledge base</div>
                    </div>
                    {mode === 'assistant' && <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem className="items-start gap-2" onSelect={() => onModeChange('analyst')}>
                    <Zap className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-gray-900">AI Analyst</div>
                      <div className="text-xs text-gray-500">Deep analysis &amp; complex tasks</div>
                    </div>
                    {mode === 'analyst' && <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ))}

            {/* send */}
            <Button
              type="button"
              variant="primary"
              size="icon"
              onClick={submit}
              disabled={!canSend}
              aria-label="Send message"
              className="ml-auto h-8 w-8 min-h-0 min-w-0 rounded-full p-0 lg:min-h-0 lg:min-w-0"
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* picker menu (opened by "/") */}
        <AnimatePresence>
          {skillsOpen && skillsMode === 'picker' && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.16, ease: 'easeOut' }}
              className="absolute bottom-full left-0 z-40 mb-2"
            >
              <SkillsMenu mode="picker" query={slashMode ? input : ''} onPick={pickSkill} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Skills button (manager) */}
      {showSkillsButton && (
        <div className="mt-3 flex justify-center">
          <div className="relative">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => {
                    if (skillsOpen && skillsMode === 'manager') {
                      setSkillsOpen(false);
                    } else {
                      setSkillsMode('manager');
                      setSlashMode(false);
                      setSkillsOpen(true);
                    }
                  }}
                  disabled={!canAddSkill}
                  aria-expanded={skillsOpen && skillsMode === 'manager'}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-kb:ring-2 focus-kb:ring-primary"
                >
                  <Sparkles className="h-4 w-4 text-primary" /> Skills
                  <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                </button>
              </TooltipTrigger>
              {!canAddSkill && (
                <TooltipContent>
                  {kbSearch
                    ? 'Turn off Knowledge Search to use skills.'
                    : 'A skill can only be added at the start — clear your message first.'}
                </TooltipContent>
              )}
            </Tooltip>

            <AnimatePresence>
              {skillsOpen && skillsMode === 'manager' && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.98 }}
                  transition={{ duration: 0.16, ease: 'easeOut' }}
                  className="absolute bottom-full left-1/2 z-40 mb-2 -translate-x-1/2"
                >
                  <SkillsMenu mode="manager" onPick={pickSkill} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Mobile bottom sheets for attach + mode */}
      <BottomSheet isOpen={attachSheetOpen} onClose={() => setAttachSheetOpen(false)} title="Add attachment">
        <button
          type="button"
          onClick={() => {
            setAttachSheetOpen(false);
            fileInputRef.current?.click();
          }}
          className="flex min-h-12 w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm text-gray-700 hover:bg-gray-50"
        >
          <Upload className="h-4 w-4 shrink-0 text-gray-500" aria-hidden />
          Upload files
        </button>
        {onKbSearchChange && (
          <button
            type="button"
            onClick={() => {
              setAttachSheetOpen(false);
              toggleKbSearch(!kbSearch);
            }}
            className="flex min-h-12 w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm text-gray-700 hover:bg-gray-50"
          >
            <Search className="h-4 w-4 shrink-0 text-gray-500" aria-hidden />
            <span className="flex-1">Knowledge Search</span>
            {kbSearch && <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden />}
          </button>
        )}
      </BottomSheet>

      <BottomSheet isOpen={modeSheetOpen} onClose={() => setModeSheetOpen(false)} title="Mode">
        <button
          type="button"
          onClick={() => {
            onModeChange('assistant');
            setModeSheetOpen(false);
          }}
          className="flex min-h-12 w-full items-start gap-2 rounded-lg px-3 py-3 text-left hover:bg-gray-50"
        >
          <Bot className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium text-gray-900">AI Assistant</span>
            <span className="block text-xs text-gray-500">Answers from your company knowledge base</span>
          </span>
          {mode === 'assistant' && <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />}
        </button>
        <button
          type="button"
          onClick={() => {
            onModeChange('analyst');
            setModeSheetOpen(false);
          }}
          className="flex min-h-12 w-full items-start gap-2 rounded-lg px-3 py-3 text-left hover:bg-gray-50"
        >
          <Zap className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium text-gray-900">AI Analyst</span>
            <span className="block text-xs text-gray-500">Deep analysis &amp; complex tasks</span>
          </span>
          {mode === 'analyst' && <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />}
        </button>
      </BottomSheet>
    </div>
  );
}
