import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string | undefined;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, id, ...props }, ref) => {
    return (
      <div className="w-full">
        <textarea
          ref={ref}
          id={id}
          className={cn(
            'w-full rounded-lg border bg-white transition-colors resize-none',
            'text-base lg:text-sm text-gray-900 placeholder:text-gray-500',
            'focus:outline-none focus-kb:ring-2 focus-kb:ring-primary/20 focus-kb:border-primary',
            'disabled:bg-gray-50 disabled:cursor-not-allowed',
            'px-4 py-3',
            error
              ? 'border-error focus-kb:ring-error/20 focus-kb:border-error'
              : 'border-gray-200',
            className,
          )}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error && id ? `${id}-error` : undefined}
          {...props}
        />
        {error && (
          <p id={id ? `${id}-error` : undefined} className="mt-1 text-sm text-error" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  },
);

Textarea.displayName = 'Textarea';
