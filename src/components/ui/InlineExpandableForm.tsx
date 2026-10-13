import React, { useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

interface InlineExpandableFormProps {
  isExpanded: boolean;
  onToggle: () => void;
  triggerLabel: React.ReactNode;
  triggerVariant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  submitLabel?: string;
  cancelLabel?: string;
  onSubmit?: () => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  submitDisabled?: boolean;
  className?: string;
  contentClassName?: string;
}

/**
 * Inline expandable form — replaces modal dialogs with inline UI
 */
export function InlineExpandableForm({
  isExpanded,
  onToggle,
  triggerLabel,
  triggerVariant = 'outline',
  title,
  description,
  children,
  footer,
  submitLabel = 'Submit',
  cancelLabel = 'Cancel',
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitDisabled = false,
  className,
  contentClassName,
}: InlineExpandableFormProps): React.JSX.Element {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isExpanded && contentRef.current) {
      const firstInput = contentRef.current.querySelector<HTMLInputElement | HTMLTextAreaElement>(
        'input, textarea, select'
      );
      if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
      }
    }
  }, [isExpanded]);

  useEffect(() => {
    if (!isExpanded) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        (onCancel ?? onToggle)();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isExpanded, onCancel, onToggle]);

  const handleCancel = () => {
    (onCancel ?? onToggle)();
  };

  return (
    <div className={cn('relative', className)}>
      <Button
        variant={triggerVariant}
        onClick={onToggle}
        className={cn(
          'flex items-center gap-1.5',
          isExpanded && 'rounded-b-none border-b-0'
        )}
        aria-expanded={isExpanded}
      >
        {triggerLabel}
        {isExpanded ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </Button>

      <div
        ref={contentRef}
        className={cn(
          'overflow-hidden transition-all duration-200 ease-in-out',
          isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <div
          className={cn(
            'border border-gray-200 rounded-lg rounded-tl-none p-4 bg-gray-50',
            contentClassName
          )}
        >
          {(title || description) && (
            <div className="mb-4">
              {title && (
                <h4 className="text-sm font-medium text-gray-900">{title}</h4>
              )}
              {description && (
                <p className="text-sm text-gray-500 mt-0.5">{description}</p>
              )}
            </div>
          )}

          <div className="space-y-4">{children}</div>

          {footer ?? (onSubmit && (
            <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-gray-200">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                {cancelLabel}
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={onSubmit}
                disabled={submitDisabled || isSubmitting}
                isLoading={isSubmitting}
              >
                {submitLabel}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface InlineFormFooterProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Inline form footer component
 */
export function InlineFormFooter({ children, className }: InlineFormFooterProps): React.JSX.Element {
  return (
    <div className={cn('flex items-center justify-end gap-2 mt-4 pt-4 border-t border-gray-200', className)}>
      {children}
    </div>
  );
}

export default InlineExpandableForm;
