import { useEffect, useState } from 'react';

import { Search, X } from 'lucide-react';

import { Button, Input } from '@/components/ui';

/** Debounce for search boxes that write the URL, as the worklist's search does. */
const SEARCH_DEBOUNCE_MS = 300;

interface PagerProps {
  readonly page: number;
  readonly pages: number;
  readonly onPage: (page: number) => void;
  /** Test id of the pager row; Previous and Next take `-prev` and `-next`. */
  readonly testid?: string;
}

/** The module's one pager ("Page X of Y", Previous, Next), shared by the worklist and every long list (S2-C44). */
export function Pager({ page, pages, onPage, testid }: PagerProps): React.ReactNode {
  if (pages <= 1) return null;
  return (
    <div data-testid={testid} className="flex items-center justify-between gap-2 pt-2 text-xs text-gray-600">
      <span className="tabular-nums">Page {page} of {pages}</span>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" data-testid={testid ? `${testid}-prev` : undefined} disabled={page <= 1} onClick={() => onPage(page - 1)} className="min-h-11 md:min-h-0">
          Previous
        </Button>
        <Button variant="outline" size="sm" data-testid={testid ? `${testid}-next` : undefined} disabled={page >= pages} onClick={() => onPage(page + 1)} className="min-h-11 md:min-h-0">
          Next
        </Button>
      </div>
    </div>
  );
}

interface ListSearchProps {
  readonly value: string;
  readonly onSearch: (value: string) => void;
  /** Also the box's accessible name. */
  readonly placeholder: string;
  readonly testid: string;
  /** Debounce before onSearch; 0 writes at once. */
  readonly debounceMs?: number;
}

/**
 * A search box for a section's control row (S2-C64): a bare Input with a search icon, no FilterBar wrapper, so it lines
 * up with the card's content edge; the height of the segmented controls beside it (38 px from 768 px, 44 px touch
 * target below), the pickers' border, full width below 768 px and 15rem from there. Debounced like the worklist's.
 */
export function ListSearch({ value, onSearch, placeholder, testid, debounceMs = SEARCH_DEBOUNCE_MS }: ListSearchProps): React.ReactNode {
  const [draft, setDraft] = useState(value);
  const [seen, setSeen] = useState(value);
  const [sent, setSent] = useState<string | null>(null);
  if (value !== seen) {
    // The query changed from outside (Clear search, a link): show it. Our own debounced write coming back is not
    // "outside", so it never overwrites what has been typed since.
    setSeen(value);
    if (value !== sent) setDraft(value);
  }
  useEffect(() => {
    if (draft.trim() === value) return undefined;
    const timer = setTimeout(() => {
      const next = draft.trim();
      setSent(next);
      onSearch(next);
    }, debounceMs);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- debounce depends only on the typed value; onSearch writes the URL or state
  }, [draft]);
  return (
    <div data-testid={testid} className="w-full md:w-60">
      <Input
        aria-label={placeholder}
        placeholder={placeholder}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        leftIcon={<Search className="size-3.5" aria-hidden />}
        rightIcon={
          draft ? (
            <Button variant="ghost" size="sm" aria-label="Clear search" onClick={() => setDraft('')} className="relative -mr-2 h-7 w-7 p-0 text-gray-400 hover:text-gray-600">
              <span aria-hidden className="absolute -inset-2" />
              <X className="size-3.5" aria-hidden />
            </Button>
          ) : undefined
        }
        className="h-9.5 min-h-11 border-gray-300 py-0 pl-8 pr-8 text-sm md:min-h-0 md:text-xs lg:text-xs"
      />
    </div>
  );
}
