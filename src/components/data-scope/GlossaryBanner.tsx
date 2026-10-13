import { BookOpen } from 'lucide-react';
import {
  Alert,
  AlertAction,
  AlertContent,
  AlertDescription,
  AlertIcon,
  Button,
} from '@/components/ui';
import { useGlossary } from '@/modules/glossary/useGlossary';
import { useGlossaryStore } from '@/modules/glossary/useGlossaryStore';
import { useIsMobile, useIsTouch } from '@/hooks/useMediaQuery';

interface GlossaryBannerProps {
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Desktop-only banner that opens the Metric Glossary — a visible, up-front
 * alternative to the per-metric tooltip "View all definitions" link. Mirrors
 * DataScopeBanner (Alert variant="info" + AlertAction). Renders null on
 * touch / mobile, or when the current page has no registered metrics.
 */
export function GlossaryBanner({ size = 'sm', className }: GlossaryBannerProps): React.ReactNode {
  const { pageCount } = useGlossary();
  const openGlossary = useGlossaryStore((s) => s.openGlossary);
  const isMobile = useIsMobile();
  const isTouch = useIsTouch();

  if (isMobile || isTouch || pageCount === 0) return null;

  return (
    <Alert variant="info" size={size} truncateOnMobile className={className}>
      <AlertIcon icon={BookOpen} />
      <AlertContent>
        <AlertDescription>
          <span className="font-medium">{pageCount} metrics</span> on this page — open the glossary
          for plain-language definitions, formulas, and worked examples.
        </AlertDescription>
      </AlertContent>
      <AlertAction>
        <Button
          variant="ghost"
          size="sm"
          // min-h-8 matches DataScopeBanner's density override.
          className="min-h-8 text-primary-700 hover:text-primary-800 hover:bg-primary-100"
          onClick={() => openGlossary()}
        >
          View Glossary
        </Button>
      </AlertAction>
    </Alert>
  );
}
