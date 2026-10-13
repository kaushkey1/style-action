import React, { useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence, useReducedMotion, type MotionProps } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/useMediaQuery';

const DISMISS_THRESHOLD = 80;
// iOS-style drawer curve (mobile bottom sheet) + strong ease-out (desktop dialog),
// per the emil-design-eng guidance. Exits run faster than enters.
const DRAWER_EASE: [number, number, number, number] = [0.32, 0.72, 0, 1];
const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showClose?: boolean;
  className?: string;
}

const sizeStyles = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-4xl',
};

/**
 * Modal component using Radix Dialog.
 * Renders as a bottom sheet on mobile (<lg), centered dialog on desktop.
 */
export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  showClose = true,
  className,
}: ModalProps): React.JSX.Element {
  const isMobile = useIsMobile();
  const reduce = useReducedMotion();
  const dragStartY = useRef(0);
  const dragging = useRef(false);

  // Swipe-to-dismiss on the handle only (detect, not live-drag) so it doesn't
  // fight the Framer enter/exit transform — mirrors the shared BottomSheet.
  const handleDragDown = (e: React.PointerEvent): void => {
    dragging.current = true;
    dragStartY.current = e.clientY;
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const handleDragEnd = (e: React.PointerEvent): void => {
    if (!dragging.current) return;
    dragging.current = false;
    if (e.clientY - dragStartY.current > DISMISS_THRESHOLD) onClose();
  };

  // Enter/exit motion. Reduced motion → fade only (no movement). Mobile slides
  // from the bottom (iOS drawer curve); desktop scale-fades from center (the
  // -50%/-50% translate is held across states so transform-origin stays centered).
  const contentMotion: MotionProps = isMobile
    ? reduce
      ? {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0, transition: { duration: 0.15 } },
          transition: { duration: 0.2 },
        }
      : {
          initial: { y: '100%' },
          animate: { y: 0 },
          exit: { y: '100%', transition: { duration: 0.2, ease: DRAWER_EASE } },
          transition: { duration: 0.3, ease: DRAWER_EASE },
        }
    : reduce
      ? {
          initial: { opacity: 0, x: '-50%', y: '-50%' },
          animate: { opacity: 1, x: '-50%', y: '-50%' },
          exit: { opacity: 0, x: '-50%', y: '-50%', transition: { duration: 0.12 } },
          transition: { duration: 0.15 },
        }
      : {
          initial: { opacity: 0, scale: 0.96, x: '-50%', y: '-50%' },
          animate: { opacity: 1, scale: 1, x: '-50%', y: '-50%' },
          exit: { opacity: 0, scale: 0.96, x: '-50%', y: '-50%', transition: { duration: 0.15, ease: EASE_OUT } },
          transition: { duration: 0.22, ease: EASE_OUT },
        };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AnimatePresence>
        {isOpen && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: EASE_OUT }}
              />
            </Dialog.Overlay>
            <Dialog.Content
              asChild
              forceMount
              // Don't dismiss the modal when the interaction is inside a nested
              // BottomSheet (assignee / priority / date pickers portal to body).
              onInteractOutside={(e) => {
                const target = e.detail.originalEvent.target as Element | null;
                if (target?.closest('[data-bottom-sheet]')) e.preventDefault();
              }}
            >
              <motion.div
                {...contentMotion}
                className={cn(
                  'fixed z-50 bg-white shadow-xl focus:outline-none',
                  isMobile
                    ? 'bottom-0 left-0 right-0 w-full rounded-t-3xl max-h-[85vh] flex flex-col'
                    : cn('left-1/2 top-1/2 w-full rounded-lg max-h-[calc(100dvh-2rem)] flex flex-col', sizeStyles[size]),
                  className,
                )}
              >
                {/* Mobile handle pill — swipe down to dismiss */}
                {isMobile && (
                  <div
                    className="flex justify-center pt-3 pb-1 shrink-0 cursor-grab active:cursor-grabbing touch-none"
                    onPointerDown={handleDragDown}
                    onPointerUp={handleDragEnd}
                    onPointerCancel={handleDragEnd}
                  >
                    <div className="w-10 h-1 rounded-full bg-gray-300" />
                  </div>
                )}

                {(title || showClose) && (
                  <div className={cn(
                    'flex items-center justify-between border-b border-gray-100 shrink-0',
                    isMobile ? 'px-4 py-3' : 'px-6 py-4',
                  )}>
                    <div>
                      {title && (
                        <Dialog.Title className="text-lg font-semibold text-gray-900">
                          {title}
                        </Dialog.Title>
                      )}
                      {description && (
                        <Dialog.Description className="text-sm text-gray-500 mt-1">
                          {description}
                        </Dialog.Description>
                      )}
                    </div>
                    {showClose && (
                      <Dialog.Close asChild>
                        <button
                          type="button"
                          className={cn(
                            'rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors',
                            isMobile ? 'p-2 min-w-10 min-h-10 flex items-center justify-center' : 'p-1.5',
                          )}
                          aria-label="Close"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </Dialog.Close>
                    )}
                  </div>
                )}

                <div className={cn(
                  'overflow-y-auto min-h-0 flex-1',
                  isMobile ? 'px-4 py-4' : 'px-6 py-4',
                )}>
                  {children}
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}

interface ModalFooterProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Modal footer for action buttons
 */
export function ModalFooter({ children, className }: ModalFooterProps): React.JSX.Element {
  return (
    <div
      className={cn(
        'flex items-center justify-end gap-3 border-t border-gray-100 mt-4',
        'px-4 py-3 -mx-4 -mb-4 lg:px-6 lg:py-4 lg:-mx-6',
        className
      )}
    >
      {children}
    </div>
  );
}

export default Modal;
