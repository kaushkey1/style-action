import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CheckboxProps {
  checked?: boolean | 'indeterminate';
  onCheckedChange?: (checked: boolean | 'indeterminate') => void;
  label?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  'aria-label'?: string;
  readOnly?: boolean;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
}

export function Checkbox({
  checked,
  onCheckedChange,
  label,
  disabled,
  className,
  id,
  readOnly,
  onChange,
  ...props
}: CheckboxProps): React.ReactNode {
  const handleChange = (value: boolean | 'indeterminate'): void => {
    if (readOnly) return;
    onCheckedChange?.(value);
    if (onChange) {
      const syntheticEvent = { target: { checked: value === true } } as React.ChangeEvent<HTMLInputElement>;
      onChange(syntheticEvent);
    }
  };

  return (
    <label className={cn('flex items-center gap-2 cursor-pointer', disabled && 'cursor-not-allowed opacity-50', className)}>
      <CheckboxPrimitive.Root
        id={id}
        checked={checked}
        onCheckedChange={handleChange}
        disabled={disabled}
        aria-label={props['aria-label']}
        className={cn(
          'peer h-4 w-4 shrink-0 rounded border transition-all duration-150',
          'border-gray-300 bg-white',
          'hover:border-gray-400',
          'focus-visible:outline-none focus-kb:ring-2 focus-kb:ring-primary/20 focus-kb:ring-offset-2',
          'data-[state=checked]:border-primary data-[state=checked]:bg-primary',
          'data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary',
          'disabled:cursor-not-allowed disabled:opacity-50',
        )}
      >
        <CheckboxPrimitive.Indicator className="flex items-center justify-center text-white">
          {checked === 'indeterminate' ? (
            <Minus className="h-3 w-3" strokeWidth={3} />
          ) : (
            <Check className="h-3 w-3" strokeWidth={3} />
          )}
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
      {label && <span className="text-sm text-gray-700 select-none">{label}</span>}
    </label>
  );
}
