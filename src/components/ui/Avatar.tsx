import * as React from 'react';
import { User as UserIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type AvatarSize = 'xs' | 'sm' | 'md';

const SIZE_CLASSES: Record<AvatarSize, string> = {
  xs: 'w-6 h-6 text-[10px]',   // 24px
  sm: 'w-8 h-8 text-xs',       // 32px
  md: 'w-10 h-10 text-sm',     // 40px
};

export interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Initials override. If omitted, derived from `name` (first + last initials). */
  initials?: string;
  /** Used to auto-derive initials when `initials` not provided. Accepts a display
   *  name ("Priya Shah") or an email ("a.narendra@ril.com" → "AN"). */
  name?: string;
  size?: AvatarSize;
  /** Fall back to Lucide <User> icon if no initials/name. */
  fallbackIcon?: boolean;
}

/**
 * First + last initials (two letters). Handles both display names ("Priya Shah"
 * → "PS") and emails / dotted handles ("a.narendra@ril.com" → "AN"); a single
 * token falls back to its first two letters ("retailcommandcenter" → "RE").
 */
function deriveInitials(name: string): string {
  const raw = name.trim();
  if (!raw) return '';
  const local = raw.includes('@') ? raw.slice(0, raw.indexOf('@')) : raw;
  const parts = local.split(/[\s._-]+/).filter(Boolean);
  const first = parts[0];
  if (!first) return '';
  if (parts.length === 1) return first.slice(0, 2).toUpperCase();
  const last = parts[parts.length - 1] ?? '';
  return (first.charAt(0) + last.charAt(0)).toUpperCase();
}

export const Avatar = React.forwardRef<HTMLSpanElement, AvatarProps>(
  ({ initials, name, size = 'sm', fallbackIcon = true, className, ...rest }, ref) => {
    const text = initials ?? (name ? deriveInitials(name) : '');
    const showIcon = !text && fallbackIcon;
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-full bg-gray-200 text-gray-700 font-medium select-none',
          SIZE_CLASSES[size],
          className,
        )}
        aria-label={name ? `Avatar for ${name}` : undefined}
        {...rest}
      >
        {showIcon ? <UserIcon className="w-3/5 h-3/5 text-gray-500" aria-hidden /> : text}
      </span>
    );
  },
);
Avatar.displayName = 'Avatar';
