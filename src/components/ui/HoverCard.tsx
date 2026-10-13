import { useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { BottomSheet } from './BottomSheet';

const HOVER_DELAY_IN = 200;
const HOVER_DELAY_OUT = 150;

interface HoverCardProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  title?: string;
  className?: string;
}

export function HoverCard({ trigger, children, title, className }: HoverCardProps): React.ReactNode {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number; placement: 'above' | 'below' } | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMobile = useIsMobile();

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (isMobile) return;
    clearTimer();
    timerRef.current = setTimeout(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        const CARD_HEIGHT = 200;
        const PADDING = 8;
        const spaceAbove = rect.top;

        const placement = spaceAbove >= CARD_HEIGHT + PADDING ? 'above' : 'below';

        let left = rect.left + rect.width / 2;
        const CARD_WIDTH = 280;
        const halfCard = CARD_WIDTH / 2;
        if (left - halfCard < PADDING) left = halfCard + PADDING;
        if (left + halfCard > window.innerWidth - PADDING) left = window.innerWidth - halfCard - PADDING;

        setPosition({
          top: placement === 'above' ? rect.top - PADDING : rect.bottom + PADDING,
          left,
          placement,
        });
      }
      setIsOpen(true);
    }, HOVER_DELAY_IN);
  }, [isMobile, clearTimer]);

  const handleMouseLeave = useCallback(() => {
    if (isMobile) return;
    clearTimer();
    timerRef.current = setTimeout(() => {
      setIsOpen(false);
    }, HOVER_DELAY_OUT);
  }, [isMobile, clearTimer]);

  const handleClick = useCallback(() => {
    if (!isMobile) return;
    setIsOpen(true);
  }, [isMobile]);

  if (isMobile) {
    return (
      <>
        <div
          ref={triggerRef}
          onClick={handleClick}
          onKeyDown={(e) => { if (e.key === 'Enter') setIsOpen(true); }}
          role="button"
          tabIndex={0}
          className="inline-flex"
        >
          {trigger}
        </div>
        <BottomSheet
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title={title ?? ''}
        >
          <div className="p-4">{children}</div>
        </BottomSheet>
      </>
    );
  }

  return (
    <div
      ref={triggerRef}
      className="inline-flex"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {trigger}
      {isOpen && position && createPortal(
        <div
          className={cn(
            'fixed z-50 w-[280px] bg-white border border-gray-200 rounded-lg p-4',
            'shadow-[0_8px_30px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.06)]',
            'animate-fadeIn',
            className,
          )}
           
          style={{
            top: position.top,
            left: position.left,
            transform: position.placement === 'above' ? 'translate(-50%, -100%)' : 'translate(-50%, 0)',
          }}
          onMouseEnter={() => { clearTimer(); }}
          onMouseLeave={handleMouseLeave}
        >
          {children}
        </div>,
        document.body,
      )}
    </div>
  );
}
