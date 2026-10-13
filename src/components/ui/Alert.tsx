import React, { Children, createContext, isValidElement, useContext, type ReactNode } from 'react';
import { Info, AlertTriangle, XCircle, CheckCircle2, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type AlertVariant = 'info' | 'warning' | 'error' | 'success' | 'neutral';
type AlertSize = 'sm' | 'md';

interface AlertContextValue {
  variant: AlertVariant;
  truncateOnMobile: boolean;
  hasIcon: boolean;
}

const AlertContext = createContext<AlertContextValue | null>(null);

function useAlertContext(component: string): AlertContextValue {
  const ctx = useContext(AlertContext);
  if (!ctx) {
    throw new Error(`<${component}> must be used inside <Alert>`);
  }
  return ctx;
}

function detectIconChild(children: ReactNode): boolean {
  let found = false;
  Children.forEach(children, (child) => {
    if (found) return;
    if (isValidElement(child) && child.type === AlertIcon) {
      found = true;
    }
  });
  return found;
}

const containerStyles: Record<AlertVariant, string> = {
  info: 'bg-primary-50 border-primary-100 text-primary-700',
  warning: 'bg-warning-50 border-amber-200 text-warning-600',
  error: 'bg-error-50 border-red-200 text-error-600',
  success: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  neutral: 'bg-gray-50 border-gray-200 text-gray-700',
};

const iconColorStyles: Record<AlertVariant, string> = {
  info: 'text-primary-600',
  warning: 'text-warning-600',
  error: 'text-error-500',
  success: 'text-emerald-600',
  neutral: 'text-gray-500',
};

const sizeStyles: Record<AlertSize, string> = {
  sm: 'text-xs px-3 py-2',
  md: 'text-sm px-4 py-2.5',
};

const variantIcon: Record<AlertVariant, LucideIcon> = {
  info: Info,
  warning: AlertTriangle,
  error: XCircle,
  success: CheckCircle2,
  neutral: Info,
};

interface AlertProps {
  variant?: AlertVariant;
  size?: AlertSize;
  truncateOnMobile?: boolean;
  className?: string;
  children: ReactNode;
}

export function Alert({
  variant = 'info',
  size = 'sm',
  truncateOnMobile = false,
  className,
  children,
}: AlertProps): React.ReactNode {
  const hasIcon = detectIconChild(children);
  return (
    <AlertContext.Provider value={{ variant, truncateOnMobile, hasIcon }}>
      <div
        role="status"
        data-slot="alert"
        className={cn(
          'flex flex-wrap items-center gap-x-2 gap-y-2 rounded-lg border leading-relaxed',
          containerStyles[variant],
          sizeStyles[size],
          className,
        )}
      >
        {children}
      </div>
    </AlertContext.Provider>
  );
}

interface AlertIconProps {
  icon?: LucideIcon;
  className?: string;
}

export function AlertIcon({ icon, className }: AlertIconProps): React.ReactNode {
  const { variant } = useAlertContext('AlertIcon');
  const Icon = icon ?? variantIcon[variant];
  return (
    <Icon
      data-slot="icon"
      aria-hidden="true"
      className={cn('w-4 h-4 shrink-0', iconColorStyles[variant], className)}
    />
  );
}

interface AlertContentProps {
  className?: string;
  children: ReactNode;
}

export function AlertContent({ className, children }: AlertContentProps): React.ReactNode {
  return (
    <div data-slot="content" className={cn('flex-1 min-w-0', className)}>
      {children}
    </div>
  );
}

interface AlertTitleProps {
  className?: string;
  children: ReactNode;
}

export function AlertTitle({ className, children }: AlertTitleProps): React.ReactNode {
  return (
    <h3 data-slot="title" className={cn('text-sm font-semibold leading-tight', className)}>
      {children}
    </h3>
  );
}

interface AlertDescriptionProps {
  className?: string;
  children: ReactNode;
}

export function AlertDescription({ className, children }: AlertDescriptionProps): React.ReactNode {
  const { truncateOnMobile } = useAlertContext('AlertDescription');
  return (
    <p
      data-slot="description"
      className={cn(truncateOnMobile && 'line-clamp-2 lg:line-clamp-none', className)}
    >
      {children}
    </p>
  );
}

interface AlertActionProps {
  className?: string;
  children: ReactNode;
}

export function AlertAction({ className, children }: AlertActionProps): React.ReactNode {
  const { hasIcon } = useAlertContext('AlertAction');
  return (
    <div
      data-slot="action"
      className={cn(
        // Mobile: full row below content. Indent pl-6 (= w-4 icon + gap-x-2) so the action
        // optically aligns with the description's left edge when an icon is present.
        // Desktop: sits inline-end via ml-auto, no indent.
        'shrink-0 basis-full lg:basis-auto lg:ml-auto lg:pl-3 lg:self-center',
        hasIcon && 'pl-6 lg:pl-3',
        className,
      )}
    >
      {children}
    </div>
  );
}
