import React from 'react';
import * as ToastPrimitive from '@radix-ui/react-toast';
import { X, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastData {
  id: string;
  title?: string;
  description: string;
  variant?: ToastVariant;
  duration?: number;
  action?: React.ReactNode;
}

interface ToastProps {
  id: string;
  title?: string;
  description: string;
  variant?: ToastVariant;
  duration?: number;
  action?: React.ReactNode;
  onClose: (id: string) => void;
}

const variantConfig: Record<ToastVariant, { icon: React.ReactNode; className: string }> = {
  success: {
    icon: <CheckCircle className="w-5 h-5 text-green-500" />,
    className: 'border-green-200 bg-green-50',
  },
  error: {
    icon: <XCircle className="w-5 h-5 text-red-500" />,
    className: 'border-red-200 bg-red-50',
  },
  warning: {
    icon: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
    className: 'border-yellow-200 bg-yellow-50',
  },
  info: {
    icon: <Info className="w-5 h-5 text-blue-500" />,
    className: 'border-blue-200 bg-blue-50',
  },
};

/**
 * Toast component
 */
export function Toast({
  id,
  title,
  description,
  variant = 'info',
  duration = 5000,
  action,
  onClose,
}: ToastProps): React.JSX.Element {
  const config = variantConfig[variant];

  return (
    <ToastPrimitive.Root
      defaultOpen
      className={cn(
        'relative flex items-start gap-3 rounded-lg border p-4 shadow-lg',
        'data-[state=open]:animate-slideIn',
        'data-[state=closed]:animate-slideOut',
        'data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)]',
        'data-[swipe=cancel]:translate-x-0',
        'data-[swipe=end]:animate-slideOut',
        config.className
      )}
      duration={duration}
      onOpenChange={(open) => {
        if (!open) {
          onClose(id);
        }
      }}
    >
      <div className="flex-shrink-0 mt-0.5">{config.icon}</div>

      <div className="flex-1 min-w-0">
        {title && (
          <ToastPrimitive.Title className="text-sm font-semibold text-gray-900">
            {title}
          </ToastPrimitive.Title>
        )}
        <ToastPrimitive.Description className="text-sm text-gray-600 mt-0.5">
          {description}
        </ToastPrimitive.Description>
        {action && <div className="mt-2">{action}</div>}
      </div>

      <ToastPrimitive.Close
        className={cn(
          'flex-shrink-0 p-1 rounded-md',
          'text-gray-400 hover:text-gray-600',
          'focus:outline-none focus-kb:ring-2 focus-kb:ring-gray-200'
        )}
        aria-label="Close"
      >
        <X className="w-4 h-4" />
      </ToastPrimitive.Close>
    </ToastPrimitive.Root>
  );
}

/**
 * Toast viewport component
 */
export function ToastViewport(): React.JSX.Element {
  return (
    <ToastPrimitive.Viewport
      className={cn(
        'fixed top-16 right-0 flex flex-col gap-2 p-4 w-full max-w-md z-50',
        'outline-none'
      )}
    />
  );
}

export const ToastProvider = ToastPrimitive.Provider;

export default Toast;
