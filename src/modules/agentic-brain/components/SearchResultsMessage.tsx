/**
 * SearchResultsMessage — the reply rendered in the Ask AI thread when a message
 * was sent with the Knowledge Search chip on: ranked documents, not an AI answer.
 * "View" hands the document off to the Knowledge Base page for reading.
 */
import { useState } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui';
import { SearchResultCard } from '@/modules/knowledge-base/components/SearchResultCard';
import type { SearchResult } from '../data/agenticBrainTypes';

/** Rows shown before "Show all" — keeps long result sets from flooding the thread. */
const VISIBLE_COUNT = 5;

interface SearchResultsMessageProps {
  results: SearchResult[];
  time: string;
  onView: (result: SearchResult) => void;
}

export function SearchResultsMessage({ results, time, onView }: SearchResultsMessageProps): React.ReactNode {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? results : results.slice(0, VISIBLE_COUNT);

  return (
    <div className="space-y-2" aria-live="polite">
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary-50">
          <Search className="h-3.5 w-3.5 text-primary" aria-hidden />
        </span>
        <span className="font-medium uppercase">Knowledge search</span>
        <span aria-hidden>·</span>
        <span>{results.length} results</span>
        <span aria-hidden>·</span>
        <span>{time}</span>
      </div>

      {results.length === 0 ? (
        <p className="text-sm text-gray-500">No matching documents found. Try a different query.</p>
      ) : (
        <div className="space-y-2">
          {visible.map((result, i) => (
            <SearchResultCard
              key={`${result.title}-${i}`}
              result={result}
              onView={() => onView(result)}
              compact
            />
          ))}
        </div>
      )}

      {!expanded && results.length > VISIBLE_COUNT && (
        <Button variant="ghost" size="sm" onClick={() => setExpanded(true)}>
          Show all {results.length} results
        </Button>
      )}
    </div>
  );
}
