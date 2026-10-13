/**
 * SearchResultCard — one knowledge-search result row, shared by the Knowledge
 * Base page (full variant) and the Ask AI "Knowledge Search" results message
 * (compact variant). Extracted from the dissolved standalone Search page.
 */
import { FileText, Globe, BookOpen, Upload } from 'lucide-react';
import { Card, Badge } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { SearchResult } from '@/modules/agentic-brain/data/agenticBrainTypes';

/** Guess source type from title/source for icon display. */
function getSourceIcon(result: SearchResult): { icon: typeof FileText; label: string } {
  const src = (result.source ?? result.title ?? '').toLowerCase();
  if (src.includes('http') || src.includes('www')) return { icon: Globe, label: 'Web' };
  if (src.includes('upload') || src.endsWith('.pdf') || src.endsWith('.docx')) return { icon: Upload, label: 'Upload' };
  return { icon: BookOpen, label: 'Wiki' };
}

export function RelevanceBar({ score }: { score: number }): React.ReactNode {
  const pct = Math.round(score * 100);
  const color = pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-amber-500' : 'bg-gray-400';
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        {/* eslint-disable-next-line no-restricted-syntax -- dynamic width requires inline style */}
        <div className={cn('h-full rounded-full', color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-500">{pct}%</span>
    </div>
  );
}

interface SearchResultCardProps {
  result: SearchResult;
  onView: () => void;
  /** Compact rows for the chat results message; full cards on the Knowledge Base page. */
  compact?: boolean;
}

export function SearchResultCard({ result, onView, compact = false }: SearchResultCardProps): React.ReactNode {
  const { icon: SourceIcon, label: sourceLabel } = getSourceIcon(result);

  return (
    <Card
      className={cn('cursor-pointer hover:border-primary/30 transition-colors', compact ? 'p-3' : 'p-4')}
      onClick={onView}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onView();
        }
      }}
      aria-label={`View result: ${result.title}`}
    >
      <div className="flex items-start gap-3">
        <div className={cn('rounded-lg bg-gray-100 flex items-center justify-center shrink-0 mt-0.5', compact ? 'w-7 h-7' : 'w-8 h-8')}>
          <SourceIcon className={cn('text-gray-500', compact ? 'w-3.5 h-3.5' : 'w-4 h-4')} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h4 className="text-sm font-medium text-gray-900 truncate">{result.title}</h4>
            <div className="flex items-center gap-2 shrink-0">
              {!compact && result.category && (
                <Badge variant="primary" size="sm">{result.category}</Badge>
              )}
              <Badge variant="default" size="sm">{sourceLabel}</Badge>
            </div>
          </div>

          <p className={cn('text-xs text-gray-500 mb-2', compact ? 'line-clamp-2' : 'line-clamp-3')}>
            {(result.content ?? '').slice(0, 400)}
          </p>

          {/* eslint-disable-next-line design-system/prefer-section-header -- card footer layout */}
          <div className="flex items-center justify-between">
            {result.score != null ? <RelevanceBar score={result.score} /> : <span />}
            <div className="flex gap-2">
              <span className="text-xs text-primary bg-primary/5 px-2 py-0.5 rounded-lg">
                View
              </span>
              {result.doc_url && (
                <a
                  href={result.doc_url}
                  download
                  className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-lg hover:bg-gray-200"
                  onClick={(e) => e.stopPropagation()}
                >
                  Download
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
