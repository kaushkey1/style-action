/**
 * DocumentReader — full-document markdown reader for knowledge-search results
 * that don't map to a wiki page (uploads, web ingests). Extracted from the
 * dissolved standalone Search page's detail view.
 */
import { ArrowLeft, Download, ExternalLink } from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Card, Badge, Button, SectionHeader } from '@/components/ui';
import { RelevanceBar } from './SearchResultCard';
import type { SearchResult } from '@/modules/agentic-brain/data/agenticBrainTypes';

interface DocumentReaderProps {
  result: SearchResult;
  onBack: () => void;
}

export function DocumentReader({ result, onBack }: DocumentReaderProps): React.ReactNode {
  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to results
      </Button>

      <Card className="p-4">
        <SectionHeader
          title={result.title}
          actions={
            <div className="flex items-center gap-2">
              {result.category && (
                <Badge variant="primary" size="sm">{result.category}</Badge>
              )}
              {result.score != null && <RelevanceBar score={result.score} />}
            </div>
          }
          className="mb-4"
        />
        {/* Links — use doc_url (CDN) for originals */}
        {result.doc_url && (
          <div className="flex items-center gap-3 mb-4">
            <a
              href={result.doc_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <ExternalLink className="w-3 h-3" /> View Original
            </a>
            <a
              href={result.doc_url}
              download
              className="inline-flex items-center gap-1 text-xs text-gray-500 hover:underline"
            >
              <Download className="w-3 h-3" /> Download
            </a>
          </div>
        )}
        {/* Full document content — no truncation */}
        <div className="prose prose-sm max-w-none text-gray-700 overflow-x-auto">
          <Markdown remarkPlugins={[remarkGfm]}>{result.content ?? ''}</Markdown>
        </div>
      </Card>
    </div>
  );
}
