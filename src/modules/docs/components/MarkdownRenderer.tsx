import { useEffect, useMemo, useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { X } from 'lucide-react';
import type { TocItem } from './DocsLayout';

interface MarkdownRendererProps {
  content: string;
  onHeadings?: (headings: TocItem[]) => void;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export function MarkdownRenderer({ content, onHeadings }: MarkdownRendererProps) {
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null);

  const closeLightbox = useCallback(() => setLightbox(null), []);

  // Close on Escape key
  useEffect(() => {
    if (!lightbox) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [lightbox, closeLightbox]);

  const headings = useMemo(() => {
    const result: TocItem[] = [];
    const lines = content.split('\n');
    for (const line of lines) {
      const match = line.match(/^(#{1,3})\s+(.+)$/);
      if (match && match[1] && match[2]) {
        result.push({
          id: slugify(match[2]),
          label: match[2],
          level: match[1].length,
        });
      }
    }
    return result;
  }, [content]);

  useEffect(() => {
    onHeadings?.(headings);
  }, [headings, onHeadings]);

  return (
    <>
    {lightbox && (
      // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- dialog overlay with keyboard close
      <div
        role="dialog"
        aria-label="Image preview"
        className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-[32px]"
        onClick={closeLightbox}
        onKeyDown={(e) => { if (e.key === 'Escape') closeLightbox(); }}
      >
        <button
          onClick={closeLightbox}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          aria-label="Close"
        >
          <X className="w-6 h-6" />
        </button>
        {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions -- stop propagation only */}
        <img
          src={lightbox.src}
          alt={lightbox.alt}
          className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    )}
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => {
          const text = String(children);
          return <h1 id={slugify(text)} className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b border-gray-200">{children}</h1>;
        },
        h2: ({ children }) => {
          const text = String(children);
          return <h2 id={slugify(text)} className="text-xl font-semibold text-gray-900 mt-10 mb-4">{children}</h2>;
        },
        h3: ({ children }) => {
          const text = String(children);
          return <h3 id={slugify(text)} className="text-lg font-medium text-gray-900 mt-8 mb-3">{children}</h3>;
        },
        p: ({ children }) => <div className="text-sm text-gray-700 leading-relaxed mb-4">{children}</div>,
        ul: ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-1 text-sm text-gray-700">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal pl-6 mb-4 space-y-1 text-sm text-gray-700">{children}</ol>,
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
        a: ({ href, children }) => (
          <a href={href} className="text-primary underline hover:text-primary/80 transition-colors">{children}</a>
        ),
        table: ({ children }) => (
          <div className="overflow-x-auto mb-6">
            <table className="min-w-full border border-gray-200 rounded-lg text-sm">{children}</table>
          </div>
        ),
        thead: ({ children }) => <thead className="bg-gray-50">{children}</thead>,
        th: ({ children }) => <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase border-b border-gray-200">{children}</th>,
        td: ({ children }) => <td className="px-3 py-2 text-sm text-gray-700 border-b border-gray-100">{children}</td>,
        tr: ({ children }) => <tr className="hover:bg-gray-50">{children}</tr>,
        code: ({ className, children }) => {
          const isBlock = className?.includes('language-');
          if (isBlock) {
            return <code className="block bg-gray-100 rounded-lg p-4 text-xs font-mono text-gray-800 overflow-x-auto mb-4">{children}</code>;
          }
          return <code className="bg-gray-100 rounded px-1.5 py-0.5 text-xs font-mono text-gray-800">{children}</code>;
        },
        pre: ({ children }) => <pre className="mb-4">{children}</pre>,
        img: ({ src, alt }) => (
          <figure className="my-6">
            <button
              type="button"
              onClick={() => src && setLightbox({ src, alt: alt || '' })}
              className="block w-full text-left"
              aria-label={`View ${alt || 'image'} fullscreen`}
            >
              <img
                src={src}
                alt={alt || ''}
                className="rounded-lg shadow-sm border border-gray-200 max-w-full cursor-pointer hover:shadow-md transition-shadow"
              />
            </button>
            {alt && <figcaption className="mt-2 text-xs text-gray-500 text-center">{alt}</figcaption>}
          </figure>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-gray-300 pl-4 py-1 my-4 text-sm text-gray-600 italic">{children}</blockquote>
        ),
        hr: () => <hr className="my-8 border-gray-200" />,
        strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
      }}
    >
      {content}
    </ReactMarkdown>
    </>
  );
}
