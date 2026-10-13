import { useState, useCallback } from 'react';
import { DocsLayout } from '../components/DocsLayout';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import type { TocItem } from '../components/DocsLayout';
import content from '../content/docs/space-planning.md?raw';

export default function DocsSpacePlanningPage() {
  const [toc, setToc] = useState<TocItem[]>([]);

  const handleHeadings = useCallback((headings: TocItem[]) => {
    setToc(headings);
  }, []);

  return (
    <DocsLayout toc={toc}>
      <MarkdownRenderer content={content} onHeadings={handleHeadings} />
    </DocsLayout>
  );
}
