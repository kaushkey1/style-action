import { useState, useEffect, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';

export interface TocItem {
  id: string;
  label: string;
  level: number;
}

interface DocsLayoutProps {
  toc: TocItem[];
  children: React.ReactNode;
}

export function DocsLayout({ toc, children }: DocsLayoutProps) {
  const [activeId, setActiveId] = useState<string>('');
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: '-80px 0px -80% 0px' }
    );

    const headings = contentRef.current?.querySelectorAll('h1[id], h2[id], h3[id]');
    headings?.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [children]);

  const scrollTo = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  return (
    <div className="flex h-[calc(100dvh-3rem)]">
      <nav className="w-56 border-r border-gray-200 overflow-y-auto py-6 px-4 flex-shrink-0 hidden lg:block">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">On this page</p>
        <ul className="space-y-1">
          {toc.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => scrollTo(item.id)}
                className={cn(
                  'block w-full text-left text-sm py-1 transition-colors',
                  item.level === 3 ? 'pl-4' : 'pl-0',
                  activeId === item.id
                    ? 'text-primary font-medium'
                    : 'text-gray-500 hover:text-gray-900'
                )}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div ref={contentRef} className="flex-1 overflow-y-auto py-8 px-8">
        <div className="max-w-3xl">
          {children}
        </div>
      </div>
    </div>
  );
}
