import React, { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@/lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'link' | 'destructive' | 'outline-destructive';

type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean;
  isLoading?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-white hover:bg-primary-600 focus-kb:ring-primary/20',
  secondary:
    'bg-secondary-700 text-white hover:bg-secondary-800 focus-kb:ring-secondary/20',
  outline:
    'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus-kb:ring-gray-200',
  ghost:
    'bg-transparent text-gray-700 hover:bg-gray-100 focus-kb:ring-gray-200',
  link:
    'bg-transparent text-primary underline-offset-4 hover:underline focus-kb:ring-0 p-0 h-auto',
  destructive:
    'bg-error text-white hover:bg-error-600 focus-kb:ring-error/20',
  'outline-destructive':
    'border border-error/30 bg-white text-error hover:bg-error/5 hover:border-error/50 focus-kb:ring-error/20',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'min-h-12 lg:min-h-8 h-8 px-3 text-sm',
  md: 'min-h-12 lg:min-h-10 h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
  icon: 'min-h-12 min-w-12 lg:min-h-10 lg:min-w-10 h-10 w-10',
};

/**
 * Loading spinner component
 */
function LoadingSpinner(): React.JSX.Element {
  return (
    <svg
      className="animate-spin h-5 w-5"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

/**
 * Button component with variants and sizes
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      asChild = false,
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';

    return (
      <Comp
        className={cn(
          'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-[color,background-color,border-color,box-shadow,transform] active:scale-[0.97] cursor-pointer',
          'focus:outline-none focus-kb:ring-4',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        ref={ref}
        disabled={disabled ?? isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <LoadingSpinner />
            <span className="ml-2">{children}</span>
          </>
        ) : (
          children
        )}
      </Comp>
    );
  }
);

Button.displayName = 'Button';

export default Button;
