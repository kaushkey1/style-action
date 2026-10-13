import React, { useEffect, useCallback, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

type PanelWidth = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

interface DetailPanelProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  width?: PanelWidth;
  showClose?: boolean;
  headerActions?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  closeOnEscape?: boolean;
  mobileOverlay?: boolean;
}

const widthStyles: Record<PanelWidth, string> = {
  sm: 'w-72',
  md: 'w-80',
  lg: 'w-96',
  xl: 'w-[28rem]',
  '2xl': 'w-[32rem]',
};

/**
 * Slide-in detail panel for master-detail layouts
 */
export function DetailPanel({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  width = 'md',
  showClose = true,
  headerActions,
  footer,
  className,
  closeOnEscape = true,
  mobileOverlay = true,
}: DetailPanelProps): React.JSX.Element | null {
  const panelRef = useRef<HTMLDivElement>(null);

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEscape) {
        onClose();
      }
    },
    [onClose, closeOnEscape]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Move focus into panel when it opens
      requestAnimationFrame(() => {
        panelRef.current?.focus();
      });
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, handleEscape]);

  return (
    <>
      {mobileOverlay && (
        <div
          className={cn(
            'fixed inset-0 bg-black/30 z-40 lg:hidden transition-opacity duration-200',
            isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          )}
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <div
        ref={panelRef}
        tabIndex={-1}
        className={cn(
          'flex flex-col bg-white border-l border-gray-200 outline-none shrink-0 overflow-hidden',
          'transition-[max-width,opacity] duration-300 ease-in-out',
          'lg:relative lg:h-full',
          'fixed inset-y-0 right-0 z-50 lg:z-auto',
          isOpen
            ? cn(widthStyles[width], 'max-w-[32rem] opacity-100')
            : 'max-w-0 opacity-0 lg:border-l-0',
          className
        )}
        role="complementary"
        aria-label={title ?? 'Detail panel'}
      >
        {(title || showClose || headerActions) && (
          <div className="flex items-start justify-between gap-4 px-4 py-3 border-b border-gray-100 shrink-0">
            <div className="flex-1 min-w-0">
              {title && (
                <h3 className="text-base font-semibold text-gray-900 truncate">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-sm text-gray-500 mt-0.5 truncate">{subtitle}</p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {headerActions}
              {showClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Close panel"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4">{children}</div>

        {footer && (
          <div className="shrink-0 px-4 py-3 border-t border-gray-100 bg-gray-50">
            {footer}
          </div>
        )}
      </div>
    </>
  );
}

interface DetailPanelSectionProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Section within a DetailPanel
 */
export function DetailPanelSection({
  title,
  children,
  className,
}: DetailPanelSectionProps): React.JSX.Element {
  return (
    <div className={cn('mb-6 last:mb-0', className)}>
      {title && (
        <h4 className="text-sm font-medium text-gray-700 mb-2">{title}</h4>
      )}
      {children}
    </div>
  );
}

interface DetailPanelRowProps {
  label: string;
  value: React.ReactNode;
  className?: string;
}

/**
 * Label-value row within a DetailPanel
 */
export function DetailPanelRow({
  label,
  value,
  className,
}: DetailPanelRowProps): React.JSX.Element {
  return (
    <div className={cn('flex items-start justify-between py-1.5', className)}>
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm text-gray-900 text-right">{value}</span>
    </div>
  );
}

export default DetailPanel;
