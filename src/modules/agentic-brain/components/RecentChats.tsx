/**
 * Recent chats list for the Ask AI welcome screen — pinned chats sort first,
 * long lists collapse to 5 behind a "Show all" toggle, and each row exposes
 * Pin / Rename / Delete via a kebab (DropdownMenu on desktop, BottomSheet on
 * mobile). Rename edits inline in the row.
 */
import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Pin, PinOff, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import {
  BottomSheet, Button,
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from '@/components/ui';
import { formatRelativeTime } from '@/lib/utils';
import { useIsMobile } from '@/hooks/useMediaQuery';

export interface RecentChatSummary {
  id: string;
  title: string;
  updatedAt: string;
  pinned?: boolean;
}

const COLLAPSED_COUNT = 5;

interface RecentChatsProps {
  chats: RecentChatSummary[];
  onOpen: (id: string) => void;
  onTogglePin: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
}

export function RecentChats({ chats, onOpen, onTogglePin, onRename, onDelete }: RecentChatsProps): React.ReactNode {
  const isMobile = useIsMobile();
  const [showAll, setShowAll] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState('');
  const [actionSheetId, setActionSheetId] = useState<string | null>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  const sorted = [...chats].sort((a, b) => {
    if ((a.pinned === true) !== (b.pinned === true)) return a.pinned ? -1 : 1;
    return b.updatedAt.localeCompare(a.updatedAt);
  });
  const visible = showAll ? sorted : sorted.slice(0, COLLAPSED_COUNT);
  const actionSheetChat = actionSheetId ? (chats.find((c) => c.id === actionSheetId) ?? null) : null;

  useEffect(() => {
    if (renamingId) {
      renameInputRef.current?.focus();
      renameInputRef.current?.select();
    }
  }, [renamingId]);

  function startRename(chat: RecentChatSummary): void {
    setRenamingId(chat.id);
    setRenameDraft(chat.title);
  }

  function commitRename(): void {
    if (renamingId) {
      const title = renameDraft.trim();
      if (title) onRename(renamingId, title);
    }
    setRenamingId(null);
  }

  if (chats.length === 0) return null;

  return (
    <div className="mt-8">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">Recent chats</p>
      <div className="space-y-1.5">
        {visible.map((c) => (
          <div
            key={c.id}
            className="group relative flex min-h-[44px] items-center gap-2 rounded-lg border border-gray-200 bg-white pl-3 pr-1.5 transition-colors hover:border-primary/30"
          >
            {renamingId === c.id ? (
              /* eslint-disable-next-line no-restricted-syntax -- inline rename field inside the row; Input primitive is too tall here */
              <input
                ref={renameInputRef}
                value={renameDraft}
                onChange={(e) => setRenameDraft(e.target.value)}
                onBlur={commitRename}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitRename();
                  if (e.key === 'Escape') setRenamingId(null);
                }}
                aria-label="Rename chat"
                className="min-w-0 flex-1 bg-transparent py-2.5 text-base lg:text-sm text-gray-900 focus:outline-none"
              />
            ) : (
              <button
                type="button"
                onClick={() => onOpen(c.id)}
                className="flex min-w-0 flex-1 items-center gap-2 rounded-lg py-2.5 text-left focus-visible:outline-none focus-kb:ring-2 focus-kb:ring-primary"
              >
                {c.pinned ? (
                  <Pin className="h-4 w-4 shrink-0 text-primary" aria-label="Pinned" />
                ) : (
                  <MessageSquare className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
                )}
                <span className="truncate text-sm text-gray-700">{c.title}</span>
              </button>
            )}

            <span className="shrink-0 text-xs text-gray-400">{formatRelativeTime(c.updatedAt)}</span>

            {isMobile ? (
              <button
                type="button"
                onClick={() => setActionSheetId(c.id)}
                aria-label={`Chat options: ${c.title}`}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 focus-visible:outline-none focus-kb:ring-2 focus-kb:ring-primary"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label={`Chat options: ${c.title}`}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-gray-400 opacity-0 transition-opacity hover:bg-gray-100 hover:text-gray-600 focus-visible:opacity-100 focus-visible:outline-none focus-kb:ring-2 focus-kb:ring-primary group-hover:opacity-100 touch:opacity-100 data-[state=open]:opacity-100"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem onSelect={() => onTogglePin(c.id)}>
                    {c.pinned ? <PinOff className="mr-2 h-4 w-4" /> : <Pin className="mr-2 h-4 w-4" />}
                    {c.pinned ? 'Unpin' : 'Pin'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => startRename(c)}>
                    <Pencil className="mr-2 h-4 w-4" /> Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-error hover:bg-error-50 focus:bg-error-50 focus:text-error"
                    onSelect={() => onDelete(c.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        ))}
      </div>

      {sorted.length > COLLAPSED_COUNT && (
        <Button variant="ghost" size="sm" onClick={() => setShowAll((v) => !v)} className="mt-2 w-full">
          {showAll ? 'Show less' : `Show all (${sorted.length})`}
        </Button>
      )}

      {/* Mobile row actions */}
      <ChatActionsSheet
        chat={actionSheetChat}
        onClose={() => setActionSheetId(null)}
        onTogglePin={onTogglePin}
        onRenameRequest={startRename}
        onDelete={onDelete}
      />
    </div>
  );
}

/** Mobile bottom sheet with Pin / Rename / Delete for one chat — shared by the
    recent-chats rows and the conversation title bar. */
export function ChatActionsSheet({
  chat,
  onClose,
  onTogglePin,
  onRenameRequest,
  onDelete,
}: {
  chat: RecentChatSummary | null;
  onClose: () => void;
  onTogglePin: (id: string) => void;
  onRenameRequest: (chat: RecentChatSummary) => void;
  onDelete: (id: string) => void;
}): React.ReactNode {
  return (
    <BottomSheet isOpen={chat !== null} onClose={onClose} title={chat?.title}>
      {chat && (
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => {
              onTogglePin(chat.id);
              onClose();
            }}
            className="flex min-h-12 w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm text-gray-700 hover:bg-gray-50"
          >
            {chat.pinned ? <PinOff className="h-4 w-4 text-gray-500" aria-hidden /> : <Pin className="h-4 w-4 text-gray-500" aria-hidden />}
            {chat.pinned ? 'Unpin' : 'Pin'}
          </button>
          <button
            type="button"
            onClick={() => {
              onRenameRequest(chat);
              onClose();
            }}
            className="flex min-h-12 w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm text-gray-700 hover:bg-gray-50"
          >
            <Pencil className="h-4 w-4 text-gray-500" aria-hidden /> Rename
          </button>
          <button
            type="button"
            onClick={() => {
              onDelete(chat.id);
              onClose();
            }}
            className="flex min-h-12 w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm text-error hover:bg-error-50"
          >
            <Trash2 className="h-4 w-4" aria-hidden /> Delete
          </button>
        </div>
      )}
    </BottomSheet>
  );
}
