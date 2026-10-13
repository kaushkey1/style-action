import { useState } from 'react';
import { BookOpen, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile, useIsTouch } from '@/hooks/useMediaQuery';
import { useGlossary } from '@/modules/glossary/useGlossary';
import { useGlossaryStore } from '@/modules/glossary/useGlossaryStore';
import { DataScopeBanner } from './DataScopeBanner';
import { GlossaryBanner } from './GlossaryBanner';
import { DataScopeModal } from './DataScopeModal';
import { InfoBannerDeck, type InfoBannerSlide } from './InfoBannerDeck';

interface PageInfoBannersProps {
  /** Data-scope note. Omit on pages with no data-scope disclosure. */
  note?: string;
  className?: string;
}

/**
 * Standardized page info banners. On desktop, when BOTH the Data Scope note and the
 * Glossary banner would show, they are merged into a single rotating "stacked deck"
 * (avoiding two near-identical stacked indigo bars). In every other case — mobile (the
 * Glossary banner is desktop-only) or when only one banner applies — the individual
 * banners render as before. `empty:hidden` collapses the stack when nothing renders.
 */
export function PageInfoBanners({ note, className }: PageInfoBannersProps): React.ReactNode {
  const { pageCount } = useGlossary();
  const openGlossary = useGlossaryStore((s) => s.openGlossary);
  const isMobile = useIsMobile();
  const isTouch = useIsTouch();
  const [dataScopeOpen, setDataScopeOpen] = useState(false);

  // Mirrors GlossaryBanner's own visibility rule (desktop-only, page has metrics).
  const showGlossary = pageCount > 0 && !isMobile && !isTouch;

  // Desktop + both banners → one rotating deck instead of two stacked bars.
  if (note && showGlossary) {
    const slides: InfoBannerSlide[] = [
      {
        icon: Info,
        message: note,
        actionLabel: 'View Data Scope',
        onAction: () => setDataScopeOpen(true),
      },
      {
        icon: BookOpen,
        message: (
          <>
            <span className="font-medium">{pageCount} metrics</span> on this page — open the glossary
            for plain-language definitions, formulas, and worked examples.
          </>
        ),
        actionLabel: 'View Glossary',
        onAction: () => openGlossary(),
      },
    ];

    return (
      <div className={cn('empty:hidden', className)}>
        <InfoBannerDeck slides={slides} />
        <DataScopeModal isOpen={dataScopeOpen} onClose={() => setDataScopeOpen(false)} />
      </div>
    );
  }

  // Otherwise: individual banners (mobile = Data Scope only; or a single applicable banner).
  return (
    <div className={cn('space-y-2 empty:hidden', className)}>
      {note && <DataScopeBanner note={note} />}
      <GlossaryBanner />
    </div>
  );
}
