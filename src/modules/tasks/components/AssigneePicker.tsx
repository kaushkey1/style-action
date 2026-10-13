import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';
import {
  Avatar,
  BottomSheet,
  FilterSearch,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Spinner,
} from '@/components/ui';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useUsers } from '../hooks/useUsers';

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

interface AssigneePickerProps {
  value: string;
  onChange: (email: string) => void;
  disabled?: boolean;
  /** Optional list of emails to exclude (e.g. the current user shouldn't appear). */
  excludeEmails?: readonly string[];
}

/**
 * Searchable single-select for picking a task assignee.
 *
 * Built on Radix Select (via @/components/ui/Select) so the popover renders in
 * a Portal — works correctly inside a Modal / Dialog where custom-positioned
 * popovers can get clipped by the focus trap. The search input is API-driven
 * via `GET /v1.0/users?search=<query>` with a small debounce so we don't fire
 * on every keystroke.
 */
export function AssigneePicker({
  value,
  onChange,
  disabled,
  excludeEmails = [],
}: AssigneePickerProps): React.JSX.Element {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  const debouncedQuery = useDebouncedValue(query, 200);
  const searchRef = useRef<HTMLInputElement>(null);

  // Fetch only while the popover is open; the cache stays primed for next open.
  const { data: users = [], isFetching } = useUsers({
    search: debouncedQuery,
    enabled: open,
  });

  // Focus the search input when the dropdown opens (desktop only) — avoids the
  // `autoFocus` prop which jsx-a11y/no-autofocus forbids. On mobile we skip it so
  // the keyboard + focus ring don't pop before the user chooses to search.
  useEffect(() => {
    if (!open || isMobile) return;
    const id = window.setTimeout(() => searchRef.current?.focus(), 50);
    return () => window.clearTimeout(id);
  }, [open, isMobile]);

  const handleOpenChange = (next: boolean): void => {
    setOpen(next);
    if (!next) setQuery('');
  };

  const visibleUsers = useMemo(
    () => users.filter((u) => !excludeEmails.includes(u.email)),
    [users, excludeEmails],
  );

  // The currently selected user might not be in the latest search result — fall
  // back to a minimal placeholder built from the email so the trigger never
  // renders blank after the popover reopens with a filtered list.
  const selectedUser =
    users.find((u) => u.email === value) ??
    (value
      ? {
          id: -1,
          email: value,
          name: value,
          initials: (value[0] ?? '?').toUpperCase(),
          username: null,
          active: true,
        }
      : null);

  // Mobile: a dedicated BottomSheet with a server-driven search, instead of the
  // shared Select's mobile sheet (which has no search box).
  if (isMobile) {
    return (
      <>
        <button
          type="button"
          onClick={() => handleOpenChange(true)}
          disabled={disabled}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-label="Select assignee"
          className={cn(
            'flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-gray-300 bg-white px-3 text-base',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary',
            'disabled:cursor-not-allowed disabled:opacity-50',
          )}
        >
          {selectedUser ? (
            <span className="inline-flex min-w-0 items-center gap-2">
              <Avatar name={selectedUser.name} size="xs" />
              <span className="truncate text-gray-900">{selectedUser.name}</span>
            </span>
          ) : (
            <span className="text-gray-400">Select assignee</span>
          )}
          <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
        </button>

        <BottomSheet
          isOpen={open}
          onClose={() => handleOpenChange(false)}
          title="Select assignee"
          zIndex={60}
          header={<FilterSearch value={query} onChange={setQuery} placeholder="Search by name or email" />}
        >
          {/* Fixed-height region so the sheet keeps a consistent size regardless
              of how many results match (empty state centered, list scrolls). */}
          <div className="flex h-[58vh] flex-col">
            {visibleUsers.length === 0 ? (
              <div className="flex flex-1 items-center justify-center px-1">
                <p className="text-center text-sm text-gray-500">
                  {isFetching
                    ? 'Searching…'
                    : query.trim()
                      ? `No users match “${query}”`
                      : 'No users available'}
                </p>
              </div>
            ) : (
              <ul className="flex-1 space-y-1 overflow-y-auto pb-2">
                {visibleUsers.map((u) => {
                  const isSel = u.email === value;
                  return (
                    <li key={u.email}>
                      <button
                        type="button"
                        onClick={() => { onChange(u.email); handleOpenChange(false); }}
                        className={cn(
                          'flex min-h-12 w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition-colors',
                          isSel ? 'bg-primary/5' : 'hover:bg-gray-50',
                        )}
                      >
                        <Avatar name={u.name} size="xs" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-gray-900">{u.name}</span>
                          <span className="block truncate text-xs text-gray-500">{u.email}</span>
                        </span>
                        {isSel && <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </BottomSheet>
      </>
    );
  }

  return (
    <Select value={value || undefined} onValueChange={onChange} disabled={disabled} open={open} onOpenChange={handleOpenChange}>
      <SelectTrigger className="w-full" aria-label="Select assignee">
        <SelectValue placeholder="Select assignee">
          {selectedUser && (
            <span className="inline-flex items-center gap-2">
              <Avatar name={selectedUser.name} size="xs" />
              <span className="text-gray-900">{selectedUser.name}</span>
            </span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <div className="sticky top-0 bg-white p-2 border-b border-gray-100 z-10">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <Input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or email"
              className="pl-8 h-8 text-sm"
              // Keep focus inside the input — Radix would otherwise reroute keystrokes to the listbox.
              onKeyDown={(e) => e.stopPropagation()}
            />
            {isFetching && (
              <span className="absolute right-2 top-1/2 -translate-y-1/2">
                <Spinner size="sm" />
              </span>
            )}
          </div>
        </div>
        {visibleUsers.length === 0 ? (
          <p className="px-3 py-4 text-xs text-gray-500 text-center">
            {isFetching
              ? 'Searching…'
              : query.trim()
                ? `No users match “${query}”`
                : 'No users available'}
          </p>
        ) : (
          visibleUsers.map((u) => (
            <SelectItem key={u.email} value={u.email}>
              <span className="inline-flex items-center gap-2">
                <Avatar name={u.name} size="xs" />
                <span className="font-medium text-gray-900">{u.name}</span>
                <span className="text-xs text-gray-500">{u.email}</span>
              </span>
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}
