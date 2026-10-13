import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, MotionConfig } from 'motion/react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Bot, Zap, Search, Wand2, ListChecks, Upload, SquarePen, X, ChevronDown, Pin, PinOff, Pencil, Trash2 } from 'lucide-react';
import {
  Button,
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from '@/components/ui';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { formatRelativeTime } from '@/lib/utils';
import { sendGBrainChat, fileToChatPayload, searchKnowledge } from '../api/agenticBrainApi';
import type { ChatFilePayload } from '../api/agenticBrainApi';
import type { SearchResult } from '../data/agenticBrainTypes';
import { SearchResultsMessage } from '../components/SearchResultsMessage';
import { AiComposer, type ComposerMode, type AiComposerHandle } from '../components/AiComposer';
import { HERO_SPRING, HERO_FLIGHT_SPRING, HERO_FLIGHT_MS, SEND_FLIGHT_MS } from '../components/chatMotion';
import { isAcceptedFile } from '../components/composerFiles';
import { AiMessage, UserBubble, TypingIndicator, type Source } from '../components/ChatMessages';
import { RecentChats, ChatActionsSheet } from '../components/RecentChats';
import { humanizeSkill, iconForCategory } from '../components/skillsCatalog';
import type { DisplaySkill } from '../components/skillsCatalog';

interface Message {
  id: string;
  role: 'user' | 'ai';
  text: string;
  skillLabel?: string;
  sources?: Source[];
  /** Present on Knowledge Search replies — ranked documents instead of an AI answer.
      Content is stored trimmed; the Knowledge Base page re-fetches full documents. */
  searchResults?: SearchResult[];
  createdAt: string;
}

const SUGGESTED_PROMPTS: Record<ComposerMode, string[]> = {
  assistant: [
    'What are the top-selling categories this month?',
    'Summarize recent market trends in fashion retail',
    'What is our current inventory health status?',
    'Show me the latest sourcing updates',
  ],
  analyst: [
    'Analyze sales performance vs plan for Q2',
    'Compare store metrics across regions',
    'What are the key exceptions flagged today?',
    'Generate a report on markdown triggers',
  ],
};

/** Find in Docs has no route — it toggles the composer's Knowledge Search chip on. */
const QUICK_ACTIONS: { label: string; icon: typeof Search; route?: string }[] = [
  { label: 'Find in Docs', icon: Search },
  { label: 'Browse Capabilities', icon: Wand2, route: '/knowledge-base/skills' },
  { label: 'Run Task', icon: ListChecks, route: '/agents-brain/virtual-team' },
];

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: string;
  pinned?: boolean;
}

/** Cap stored conversations, evicting the oldest UNPINNED chats first. */
function trimConversations(list: Conversation[]): Conversation[] {
  if (list.length <= MAX_CONVERSATIONS) return list;
  const excess = list.length - MAX_CONVERSATIONS;
  const removeSet = new Set(
    list
      .filter((c) => !c.pinned)
      .sort((a, b) => a.updatedAt.localeCompare(b.updatedAt))
      .slice(0, excess)
      .map((c) => c.id),
  );
  return list.filter((c) => !removeSet.has(c.id));
}

/** A message sent while the assistant is still responding — held in a visible
    queue and auto-sent in order, with a "Send now" (steer) escape hatch. */
interface QueuedItem {
  id: string;
  text: string;
  skill: DisplaySkill | null;
  files: File[];
}

const LEGACY_CHAT_STORAGE_KEY = 'agentic-brain-chat-messages';
const CONVERSATIONS_KEY = 'agentic-brain-chat-conversations';
const ACTIVE_CONVERSATION_KEY = 'agentic-brain-chat-active-id';
const CHAT_MODE_KEY = 'agentic-brain-chat-mode';
const MAX_CONVERSATIONS = 20;
const CONVERSATION_TITLE_MAX_LENGTH = 60;

function normalizeMessages(raw: unknown): Message[] {
  if (!Array.isArray(raw)) return [];
  // Normalize (also migrates any older persisted shape) so rendering never sees undefined fields.
  return raw.map((m, i) => {
    const o = m as Partial<Message> & { role?: string; time?: string };
    return {
      id: o.id ?? `hist-${i}`,
      role: o.role === 'user' ? 'user' : 'ai',
      text: o.text ?? '',
      skillLabel: o.skillLabel,
      sources: o.sources,
      searchResults: Array.isArray(o.searchResults) ? o.searchResults : undefined,
      createdAt: o.createdAt ?? '',
    } satisfies Message;
  });
}

function conversationTitle(messages: Message[]): string {
  const firstUserText = messages.find((m) => m.role === 'user')?.text.trim() ?? '';
  const title = firstUserText || 'New chat';
  return title.length > CONVERSATION_TITLE_MAX_LENGTH
    ? `${title.slice(0, CONVERSATION_TITLE_MAX_LENGTH)}…`
    : title;
}

function loadConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(CONVERSATIONS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter((c): c is Conversation => typeof c === 'object' && c !== null && 'id' in c)
        .map((c) => ({
          id: String(c.id),
          title: typeof c.title === 'string' ? c.title : 'New chat',
          messages: normalizeMessages(c.messages),
          updatedAt: typeof c.updatedAt === 'string' ? c.updatedAt : '',
          pinned: c.pinned === true,
        }));
    }
    // One-time migration: the previous build stored a single thread in sessionStorage.
    const legacy = sessionStorage.getItem(LEGACY_CHAT_STORAGE_KEY);
    if (legacy) {
      sessionStorage.removeItem(LEGACY_CHAT_STORAGE_KEY);
      const messages = normalizeMessages(JSON.parse(legacy) as unknown);
      if (messages.length > 0) {
        return [{
          id: `c-${Date.now()}`,
          title: conversationTitle(messages),
          messages,
          updatedAt: messages[messages.length - 1]?.createdAt ?? new Date().toISOString(),
        }];
      }
    }
    return [];
  } catch {
    return [];
  }
}

function loadActiveConversationId(): string | null {
  return localStorage.getItem(ACTIVE_CONVERSATION_KEY);
}

function loadMode(): ComposerMode {
  return sessionStorage.getItem(CHAT_MODE_KEY) === 'analyst' ? 'analyst' : 'assistant';
}

function saveConversations(conversations: Conversation[]): void {
  try {
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
  } catch {
    // storage full — silently ignore
  }
}

const NO_MESSAGES: Message[] = [];

/** Router-state payload for the "Use in Chat" handoff from a Capability detail. */
function readSkillHandoff(state: unknown): { name: string; category: string } | null {
  if (typeof state !== 'object' || state === null || !('skill' in state)) return null;
  const skill = (state as { skill: unknown }).skill;
  if (typeof skill !== 'object' || skill === null) return null;
  const { name, category } = skill as { name?: unknown; category?: unknown };
  return typeof name === 'string' && typeof category === 'string' ? { name, category } : null;
}

/** The newest user message mid-flight: it claims the composer text row's
    layoutId so the typed text FLIPs from the composer into the bubble. */
interface TextFlight {
  msgId: string;
  layoutId: string;
}

export function AgenticBrainChatPage(): React.ReactNode {
  const navigate = useNavigate();
  const location = useLocation();
  // "Use in Chat" handoff — captured once at mount (this route mounts fresh
  // on navigation). When present, the page opens on a NEW chat instead of
  // the persisted conversation, with the skill pre-loaded as a composer pill.
  const [skillHandoff] = useState(() => readSkillHandoff(location.state));
  const [conversations, setConversations] = useState<Conversation[]>(loadConversations);
  const [activeId, setActiveId] = useState<string | null>(() =>
    skillHandoff ? null : loadActiveConversationId(),
  );
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<ComposerMode>(loadMode);
  // Knowledge Search chip — while on, sends run knowledge-base searches instead of chats.
  const [kbSearch, setKbSearch] = useState(false);
  const [searching, setSearching] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(0);
  const composerRef = useRef<AiComposerHandle>(null);
  // Drag-and-drop file attach — depth counter because dragenter/leave fire on children.
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const dragDepthRef = useRef(0);
  // Messages sent while a response is in flight queue up; steering bumps the
  // run sequence so the superseded in-flight response is discarded on arrival.
  const [queued, setQueued] = useState<QueuedItem[]>([]);
  const runSeqRef = useRef(0);
  const drainQueueRef = useRef<(() => void) | null>(null);
  // Hero transition — active from the first send off the welcome screen until
  // the composer dock flight settles; gates the "ai-composer" layoutId pairing.
  const [heroFlight, setHeroFlight] = useState(false);
  // True when the current conversation view was entered via the hero send (vs
  // reopened from Recents). The hero IS the entrance, so the chunk-stagger
  // enter classes stay off for the life of that view — re-adding them later
  // would replay the CSS enter animation and flash the thread.
  const [enteredViaHero, setEnteredViaHero] = useState(false);
  // Per-send text flight: the composer's text row carries `sent-message-<seq>`;
  // on send the new user bubble claims that id (shared-element FLIP from the
  // composer into the thread) while the row remounts under the next seq.
  const [sendSeq, setSendSeq] = useState(0);
  const [flight, setFlight] = useState<TextFlight | null>(null);
  // Title-bar chat actions (pin/rename/delete for the active chat)
  const isMobile = useIsMobile();
  const [renamingTitle, setRenamingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [titleSheetOpen, setTitleSheetOpen] = useState(false);
  const titleRenameRef = useRef<HTMLInputElement>(null);

  const activeConversation = conversations.find((c) => c.id === activeId) ?? null;
  const messages = activeConversation?.messages ?? NO_MESSAGES;

  useEffect(() => {
    saveConversations(conversations);
  }, [conversations]);

  useEffect(() => {
    if (activeId) localStorage.setItem(ACTIVE_CONVERSATION_KEY, activeId);
    else localStorage.removeItem(ACTIVE_CONVERSATION_KEY);
  }, [activeId]);

  useEffect(() => {
    // Deferred a frame: the thread scrolls in the shell's container, and
    // ConsoleLayout resets that container's scrollTop on route change AFTER
    // this child effect — the rAF makes the scroll-to-bottom win.
    const frame = requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    });
    return () => cancelAnimationFrame(frame);
  }, [messages]);

  useEffect(() => {
    sessionStorage.setItem(CHAT_MODE_KEY, mode);
  }, [mode]);

  const nextId = useCallback((): string => {
    idRef.current += 1;
    return `m${idRef.current}-${Date.now()}`;
  }, []);

  const addMessageTo = useCallback((conversationId: string, msg: Message) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversationId
          ? { ...c, messages: [...c.messages, msg], updatedAt: msg.createdAt }
          : c,
      ),
    );
  }, []);

  const startNewChat = useCallback(() => {
    setRenamingTitle(false);
    setActiveId(null);
  }, []);

  // End the hero flight after the spring settles so later renders (and chats
  // reopened from Recents) drop the layoutId pairing.
  useEffect(() => {
    if (!heroFlight) return;
    const timer = setTimeout(() => setHeroFlight(false), HERO_FLIGHT_MS);
    return () => clearTimeout(timer);
  }, [heroFlight]);

  // Drop the bubble's layoutId once the text flight settles so later layout
  // changes don't re-trigger the shared-element pairing.
  useEffect(() => {
    if (!flight) return;
    const timer = setTimeout(() => setFlight(null), SEND_FLIGHT_MS);
    return () => clearTimeout(timer);
  }, [flight]);

  // Inject the handed-off skill as a composer pill once the welcome composer
  // has mounted, then consume the router state so back/refresh doesn't re-apply.
  useEffect(() => {
    if (!skillHandoff) return;
    const frame = requestAnimationFrame(() => {
      composerRef.current?.setSkill({
        name: skillHandoff.name,
        label: humanizeSkill(skillHandoff.name),
        desc: '',
        category: skillHandoff.category,
        icon: iconForCategory(skillHandoff.category),
      });
    });
    navigate(location.pathname, { replace: true, state: null });
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only: the handoff is captured once at mount
  }, []);

  // Focus the title rename field once it renders; rAF wins over Radix's
  // focus-restore when rename is triggered from the title dropdown.
  useEffect(() => {
    if (!renamingTitle) return;
    const frame = requestAnimationFrame(() => {
      titleRenameRef.current?.focus();
      titleRenameRef.current?.select();
    });
    return () => cancelAnimationFrame(frame);
  }, [renamingTitle]);

  const togglePinChat = useCallback((id: string) => {
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, pinned: !c.pinned } : c)));
  }, []);

  const renameChat = useCallback((id: string, title: string) => {
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, title } : c)));
  }, []);

  const deleteChat = useCallback((id: string) => {
    setRenamingTitle(false);
    setConversations((prev) => prev.filter((c) => c.id !== id));
    setActiveId((prev) => (prev === id ? null : prev));
  }, []);

  /** Core: call the agent (+ retrieve sources in Assistant mode) and append the answer.
      Each run takes a sequence number; steering bumps it so a superseded run's
      response is silently discarded when it finally resolves. */
  const runAssistant = useCallback(
    async (conversationId: string, userText: string, skill: DisplaySkill | null, files: File[], history: Message[]): Promise<void> => {
      runSeqRef.current += 1;
      const seq = runSeqRef.current;
      setLoading(true);
      try {
        let filePayloads: ChatFilePayload[] | undefined;
        if (files.length > 0) filePayloads = await Promise.all(files.map(fileToChatPayload));

        const recentHistory = history
          .slice(-10)
          .map((m) => (m.role === 'user' ? `User: ${m.text}` : `AI: ${m.text}`))
          .join('\n');
        const skillPrefix = skill ? `Use the "${skill.label}" skill.\n` : '';
        const base = `${skillPrefix}${userText || 'Analyze the attached files'}`;
        const contextual = recentHistory
          ? `<conversation-history>\n${recentHistory}\n</conversation-history>\n\nUser's latest message: ${base}`
          : base;

        // Assistant mode grounds in the knowledge base — retrieve real sources in parallel.
        const searchPromise =
          mode === 'assistant' && userText
            ? searchKnowledge(userText, 3, 'hybrid').catch(() => null)
            : Promise.resolve(null);

        const [res, search] = await Promise.all([sendGBrainChat(contextual, 3, filePayloads), searchPromise]);
        const sources: Source[] | undefined = search?.results?.length
          ? search.results.slice(0, 3).map((r) => ({ title: r.title, source: r.source ?? '' }))
          : undefined;

        if (seq !== runSeqRef.current) return; // steered away — discard this response
        addMessageTo(conversationId, { id: nextId(), role: 'ai', text: res.response || 'No response', sources, createdAt: new Date().toISOString() });
      } catch {
        if (seq !== runSeqRef.current) return;
        addMessageTo(conversationId, { id: nextId(), role: 'ai', text: 'Could not reach the agent. Please check the connection.', createdAt: new Date().toISOString() });
      }
      if (seq === runSeqRef.current) {
        setLoading(false);
        drainQueueRef.current?.(); // auto-send the next queued message, if any
      }
    },
    [mode, addMessageTo, nextId],
  );

  /** Append the user message to the thread (creating a conversation if needed) and run the agent. */
  const dispatchSend = useCallback(
    (text: string, opts: { skill: DisplaySkill | null; files: File[] }): void => {
      const displayText = text || (opts.files.length > 0 ? `Sent ${opts.files.map((f) => f.name).join(', ')}` : '');
      const userMsg: Message = { id: nextId(), role: 'user', text: displayText, skillLabel: opts.skill?.label, createdAt: new Date().toISOString() };
      // Text flight: the bubble mounts under the composer row's current
      // layoutId while the row remounts under the next seq — a same-commit
      // handoff, so the typed text FLIPs into the thread on every send.
      setFlight({ msgId: userMsg.id, layoutId: `sent-message-${sendSeq}` });
      setSendSeq((s) => s + 1);
      let conversationId = activeId && conversations.some((c) => c.id === activeId) ? activeId : null;
      if (conversationId) {
        addMessageTo(conversationId, userMsg);
      } else {
        const newId = `c-${Date.now()}`;
        const newConversation: Conversation = {
          id: newId,
          title: conversationTitle([userMsg]),
          messages: [userMsg],
          updatedAt: userMsg.createdAt,
        };
        setConversations((prev) => trimConversations([newConversation, ...prev]));
        setActiveId(newId);
        setHeroFlight(true); // first send from welcome — dock the composer to the bottom
        setEnteredViaHero(true);
        conversationId = newId;
      }
      const history = [...messages, userMsg];
      void runAssistant(conversationId, text, opts.skill, opts.files, history);
    },
    [messages, activeId, conversations, sendSeq, nextId, addMessageTo, runAssistant],
  );

  /** Knowledge Search send: append the query bubble and reply with ranked documents
      (the dissolved Search page's output, as a thread message). Runs independently
      of the chat queue — searches don't contend with an in-flight AI response. */
  const dispatchSearch = useCallback(
    (text: string): void => {
      const userMsg: Message = { id: nextId(), role: 'user', text, createdAt: new Date().toISOString() };
      setFlight({ msgId: userMsg.id, layoutId: `sent-message-${sendSeq}` });
      setSendSeq((s) => s + 1);
      let conversationId = activeId && conversations.some((c) => c.id === activeId) ? activeId : null;
      if (conversationId) {
        addMessageTo(conversationId, userMsg);
      } else {
        const newId = `c-${Date.now()}`;
        setConversations((prev) => trimConversations([{
          id: newId,
          title: conversationTitle([userMsg]),
          messages: [userMsg],
          updatedAt: userMsg.createdAt,
        }, ...prev]));
        setActiveId(newId);
        setHeroFlight(true);
        setEnteredViaHero(true);
        conversationId = newId;
      }
      const targetId = conversationId;
      setSearching(true);
      void (async () => {
        try {
          const res = await searchKnowledge(text, 20, 'hybrid');
          // Trim stored content for localStorage quota. 2000 chars covers the
          // preview and keeps the reader useful for RAG-store docs that have no
          // wiki page to re-fetch; real wiki pages re-fetch in full on View.
          const results = res.results.map((r) => ({ ...r, content: (r.content ?? '').slice(0, 2000) }));
          addMessageTo(targetId, { id: nextId(), role: 'ai', text: '', searchResults: results, createdAt: new Date().toISOString() });
        } catch {
          addMessageTo(targetId, { id: nextId(), role: 'ai', text: 'Could not reach knowledge search. Please check the connection.', createdAt: new Date().toISOString() });
        } finally {
          setSearching(false);
        }
      })();
    },
    [activeId, conversations, sendSeq, nextId, addMessageTo],
  );

  const handleSend = useCallback(
    (text: string, opts: { skill: DisplaySkill | null; files: File[] }): void => {
      if (kbSearch) {
        if (text.trim()) dispatchSearch(text.trim());
        return;
      }
      if (loading) {
        setQueued((prev) => [...prev, { id: `q-${Date.now()}-${prev.length}`, text, skill: opts.skill, files: opts.files }]);
        return;
      }
      dispatchSend(text, opts);
    },
    [kbSearch, dispatchSearch, loading, dispatchSend],
  );

  // Queue drain — invoked by runAssistant when a run completes. Kept in a
  // "latest callback" ref so runAssistant doesn't need queued/dispatchSend
  // in its dependency cycle.
  useEffect(() => {
    drainQueueRef.current = () => {
      const [next, ...rest] = queued;
      if (!next) return;
      setQueued(rest);
      dispatchSend(next.text, { skill: next.skill, files: next.files });
    };
  }, [queued, dispatchSend]);

  /** Steer: stop waiting for the in-flight response and send this message now. */
  const steerQueued = useCallback(
    (id: string): void => {
      const item = queued.find((q) => q.id === id);
      if (!item) return;
      setQueued((prev) => prev.filter((q) => q.id !== id));
      runSeqRef.current += 1; // invalidate the in-flight run
      dispatchSend(item.text, { skill: item.skill, files: item.files });
    },
    [queued, dispatchSend],
  );

  const removeQueued = useCallback((id: string): void => {
    setQueued((prev) => prev.filter((q) => q.id !== id));
  }, []);

  const regenerateLast = useCallback((): void => {
    if (loading || !activeId) return;
    const lastUserIdx = messages.map((m) => m.role).lastIndexOf('user');
    if (lastUserIdx < 0) return;
    const userText = messages[lastUserIdx]?.text ?? '';
    const trimmed = messages.slice(0, lastUserIdx + 1);
    setConversations((prev) => prev.map((c) => (c.id === activeId ? { ...c, messages: trimmed } : c)));
    void runAssistant(activeId, userText, null, [], trimmed);
  }, [loading, activeId, messages, runAssistant]);

  const hasMessages = messages.length > 0;

  // Window-level drag-and-drop while this page is mounted — files can be dropped
  // anywhere in the window (standard chat drop UX), landing as composer chips.
  useEffect(() => {
    const dragHasFiles = (e: DragEvent): boolean =>
      e.dataTransfer !== null && Array.from(e.dataTransfer.types).includes('Files');
    const onDragEnter = (e: DragEvent): void => {
      if (!dragHasFiles(e)) return;
      e.preventDefault();
      dragDepthRef.current += 1;
      setIsDraggingFile(true);
    };
    const onDragOver = (e: DragEvent): void => {
      if (!dragHasFiles(e)) return;
      e.preventDefault();
    };
    const onDragLeave = (e: DragEvent): void => {
      if (!dragHasFiles(e)) return;
      dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
      if (dragDepthRef.current === 0) setIsDraggingFile(false);
    };
    const onDrop = (e: DragEvent): void => {
      if (!dragHasFiles(e)) return;
      e.preventDefault();
      dragDepthRef.current = 0;
      setIsDraggingFile(false);
      const dropped = Array.from(e.dataTransfer?.files ?? []).filter(isAcceptedFile);
      if (dropped.length > 0) composerRef.current?.addFiles(dropped);
    };
    window.addEventListener('dragenter', onDragEnter);
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('dragleave', onDragLeave);
    window.addEventListener('drop', onDrop);
    return () => {
      window.removeEventListener('dragenter', onDragEnter);
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('dragleave', onDragLeave);
      window.removeEventListener('drop', onDrop);
    };
  }, []);

  return (
    <MotionConfig reducedMotion="user">
    <div className="animate-fadeInUp">
      {/* Portaled to <body>: the page root's entry animation applies a transform,
          which would otherwise make position:fixed behave like absolute. */}
      {isDraggingFile && createPortal(
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center border-2 border-dashed border-primary bg-primary-50/90">
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Upload className="h-6 w-6 text-primary" aria-hidden />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-900">Drop files to attach</p>
              <p className="mt-0.5 text-xs text-gray-500">Images, PDF, DOCX, XLSX, CSV, JSON, TXT, MD</p>
            </div>
          </div>
        </div>,
        document.body,
      )}
      {!hasMessages ? (
        /* Home — welcome + composer + Skills centered as a hugging group. min-h
           (not h + overflow) so short content centers while Recent Chats can grow
           the page into the shell's scroller — no inner scrollbar. */
        <div className="flex min-h-[calc(100dvh-10rem)] items-center justify-center px-2 py-6 lg:min-h-[calc(100dvh-8rem)]">
          <div className="w-full max-w-2xl">
            <div className="flex flex-col items-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-primary-50">
                {mode === 'assistant' ? <Bot className="h-7 w-7 text-primary" /> : <Zap className="h-7 w-7 text-primary" />}
              </div>
              <h3 className="mb-1 text-base font-semibold text-gray-900">
                Chat with {mode === 'assistant' ? 'AI Assistant' : 'AI Analyst'}
              </h3>
              <p className="mb-6 max-w-sm text-center text-sm text-gray-500">
                {mode === 'assistant' ? 'Answers grounded in your company knowledge base.' : 'Handles deep analysis and complex tasks.'}
              </p>

              <div className="mb-6 w-full max-w-lg space-y-2">
                <p className="text-center text-xs font-medium uppercase text-gray-400">Try asking</p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {SUGGESTED_PROMPTS[mode].map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => handleSend(prompt, { skill: null, files: [] })}
                      className="min-h-[44px] rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-left text-sm text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6 flex flex-wrap justify-center gap-2">
                {QUICK_ACTIONS.map((action) => (
                  <Button
                    key={action.label}
                    variant="outline"
                    size="sm"
                    onClick={() => (action.route ? navigate(action.route) : setKbSearch(true))}
                  >
                    <action.icon className="mr-1 h-3.5 w-3.5" />
                    {action.label}
                  </Button>
                ))}
              </div>
            </div>

            <motion.div layoutId="ai-composer" transition={HERO_SPRING}>
              <AiComposer
                ref={composerRef}
                mode={mode}
                onModeChange={setMode}
                onSend={handleSend}
                showSkillsButton
                kbSearch={kbSearch}
                onKbSearchChange={setKbSearch}
                textLayoutId={`sent-message-${sendSeq}`}
                placeholder="Ask anything…   (/ for skills)"
              />
            </motion.div>

            <RecentChats
              chats={conversations}
              onOpen={(id) => {
                setEnteredViaHero(false); // reopened chat — quieter chunk-stagger enter
                setActiveId(id);
              }}
              onTogglePin={togglePinChat}
              onRename={renameChat}
              onDelete={deleteChat}
            />
          </div>
        </div>
      ) : (
        /* Conversation — flows in the shell's scroller so the scrollbar sits at the
           window edge (not beside the chat column). The column fills the viewport
           height so the composer is always bottom-aligned (mt-auto) even for short
           threads; once the thread outgrows the screen, sticky pins it. */
        <div className="flex min-h-[calc(100dvh-9.5rem-env(safe-area-inset-top,0px))] flex-col pt-9 lg:min-h-[calc(100dvh-6rem-env(safe-area-inset-top,0px))] lg:pt-7">
          {/* Fixed title band — spans the chat area edge-to-edge and matches the
              Brain sub-panel header (52px, gray-100 divider) so the two dividers
              read as one continuous line. lg:left-[296px] = 76px rail + 220px
              sub-panel. Inner max-w compensates px-4 so content aligns with the
              768px thread column. Portaled to <body>: the page root's entry
              animation applies a transform that would break position:fixed. */}
          {createPortal(
            /* [--chat-enter-blur:0px]: the band spans the full viewport width —
               animating blur on a surface that large rasters expensively in the
               send commit's first frame (measured); opacity+rise is enough here. */
            <div className="animate-chat-enter fixed inset-x-0 top-[calc(3.5rem+env(safe-area-inset-top,0px))] z-20 h-[53px] border-b border-gray-100 bg-white [--chat-enter-blur:0px] lg:left-[296px]">
            <div className="mx-auto flex h-full w-full max-w-[800px] items-center gap-2 px-4">
              <button
                type="button"
                onClick={() => setActiveId(null)}
                aria-label="Back to recent chats"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-kb:ring-2 focus-kb:ring-primary"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              {renamingTitle && activeConversation ? (
                /* eslint-disable-next-line no-restricted-syntax -- inline title rename field; Input primitive is too tall for the title bar */
                <input
                  ref={titleRenameRef}
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  onBlur={() => {
                    if (activeId && titleDraft.trim()) renameChat(activeId, titleDraft.trim());
                    setRenamingTitle(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (activeId && titleDraft.trim()) renameChat(activeId, titleDraft.trim());
                      setRenamingTitle(false);
                    }
                    if (e.key === 'Escape') setRenamingTitle(false);
                  }}
                  aria-label="Rename chat"
                  className="min-w-0 flex-1 bg-transparent text-base font-medium text-gray-900 focus:outline-none lg:text-sm"
                />
              ) : isMobile ? (
                <button
                  type="button"
                  onClick={() => setTitleSheetOpen(true)}
                  aria-label={`Chat options: ${activeConversation?.title ?? ''}`}
                  className="flex min-h-11 min-w-0 flex-1 items-center gap-1 text-left"
                >
                  <span className="truncate text-sm font-medium text-gray-900">{activeConversation?.title}</span>
                  <ChevronDown className="h-3.5 w-3.5 shrink-0 text-gray-400" aria-hidden />
                </button>
              ) : (
                <div className="min-w-0 flex-1">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        aria-label={`Chat options: ${activeConversation?.title ?? ''}`}
                        className="flex max-w-full items-center gap-1 rounded-md px-1.5 py-1 transition-colors hover:bg-gray-100 focus-visible:outline-none focus-kb:ring-2 focus-kb:ring-primary"
                      >
                        <span className="truncate text-sm font-medium text-gray-900">{activeConversation?.title}</span>
                        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-gray-400" aria-hidden />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-44">
                      <DropdownMenuItem onSelect={() => activeId && togglePinChat(activeId)}>
                        {activeConversation?.pinned ? <PinOff className="mr-2 h-4 w-4" /> : <Pin className="mr-2 h-4 w-4" />}
                        {activeConversation?.pinned ? 'Unpin' : 'Pin'}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => {
                          if (!activeConversation) return;
                          setTitleDraft(activeConversation.title);
                          setRenamingTitle(true);
                        }}
                      >
                        <Pencil className="mr-2 h-4 w-4" /> Rename
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-error hover:bg-error-50 focus:bg-error-50 focus:text-error"
                        onSelect={() => activeId && deleteChat(activeId)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
              <Button variant="outline" size="sm" onClick={startNewChat}>
                <SquarePen className="mr-1 h-3.5 w-3.5" />
                New chat
              </Button>
            </div>
          </div>,
          document.body,
          )}

          <div className={`${enteredViaHero ? '' : 'animate-chat-enter animate-chat-enter-1 '}mx-auto w-full max-w-3xl space-y-4 pt-4`}>
            {messages.map((m, i) =>
              m.role === 'user' ? (
                <UserBubble
                  key={m.id}
                  text={m.text}
                  skillLabel={m.skillLabel}
                  time={formatRelativeTime(m.createdAt)}
                  layoutId={flight && flight.msgId === m.id ? flight.layoutId : undefined}
                />
              ) : m.searchResults ? (
                <SearchResultsMessage
                  key={m.id}
                  results={m.searchResults}
                  time={formatRelativeTime(m.createdAt)}
                  onView={(result) => navigate('/knowledge-base/wiki', { state: { doc: result } })}
                />
              ) : (
                <AiMessage
                  key={m.id}
                  text={m.text}
                  sources={m.sources}
                  time={formatRelativeTime(m.createdAt)}
                  onRegenerate={!loading && i === messages.length - 1 ? regenerateLast : undefined}
                />
              ),
            )}
            {(loading || searching) && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>

          {/* mt-auto bottom-aligns for short threads; sticky pins above the mobile
              bottom bar (h-14 + safe area) once the thread scrolls; flush on desktop.
              pb-4/-mb-4 keeps a painted 16px gap below the composer while pinned
              without adding extra space at rest. */}
          <div className={`${enteredViaHero ? '' : 'animate-chat-enter animate-chat-enter-2 '}sticky bottom-[calc(3.5rem+env(safe-area-inset-bottom,0px))] z-10 -mb-4 mt-auto bg-gray-50 pb-4 pt-3 lg:bottom-0`}>
            {queued.length > 0 && (
              <div className="mx-auto mb-2 w-full max-w-3xl space-y-1.5">
                {queued.map((q) => (
                  <div key={q.id} className="flex items-center gap-2 rounded-lg border border-dashed border-gray-300 bg-white px-3 py-1.5">
                    <span className="shrink-0 text-xs font-medium uppercase text-gray-400">Queued</span>
                    <span className="min-w-0 flex-1 truncate text-sm text-gray-700">
                      {q.text || q.files.map((f) => f.name).join(', ')}
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => steerQueued(q.id)}>
                      Send now
                    </Button>
                    <button
                      type="button"
                      onClick={() => removeQueued(q.id)}
                      aria-label="Remove queued message"
                      className="rounded-sm p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 focus-visible:outline-none focus-kb:ring-2 focus-kb:ring-primary"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="mx-auto w-full max-w-3xl">
              {/* One stable wrapper — layoutId applies only during the hero dock
                  (so "New chat" doesn't reverse-flight the composer). Swapping
                  wrapper elements here used to remount AiComposer when the hero
                  ended, wiping any follow-up text typed within the flight. */}
              <motion.div layoutId={heroFlight ? 'ai-composer' : undefined} transition={HERO_FLIGHT_SPRING}>
                <AiComposer
                  ref={composerRef}
                  mode={mode}
                  onModeChange={setMode}
                  onSend={handleSend}
                  showSkillsButton={false}
                  kbSearch={kbSearch}
                  onKbSearchChange={setKbSearch}
                  textLayoutId={`sent-message-${sendSeq}`}
                  placeholder="Ask a follow-up…   (/ for skills)"
                />
              </motion.div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile title-bar chat actions */}
      <ChatActionsSheet
        chat={titleSheetOpen ? activeConversation : null}
        onClose={() => setTitleSheetOpen(false)}
        onTogglePin={togglePinChat}
        onRenameRequest={(chat) => {
          setTitleDraft(chat.title);
          setRenamingTitle(true);
        }}
        onDelete={deleteChat}
      />
    </div>
    </MotionConfig>
  );
}
