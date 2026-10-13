import { ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BetaBadge, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui';
interface NavItemProps {
  icon: React.ElementType;
  label: string;
  tooltip?: string;
  isActive?: boolean;
  onClick: () => void;
  opensInNewTab?: boolean;
  beta?: boolean;
}

export function NavItem({ icon: Icon, label, tooltip, isActive, onClick, opensInNewTab, beta }: NavItemProps) {
  const button = (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-1 w-full py-1.5 cursor-pointer group transition-[color,background-color,transform] active:scale-[0.97]',
        'focus-visible:outline-none focus-kb:ring-2 focus-kb:ring-white/50 rounded-lg',
      )}
      aria-label={tooltip ?? label}
      aria-current={isActive ? 'page' : undefined}
    >
      <div
        className={cn(
          'relative flex items-center justify-center w-10 h-7 rounded-md transition-colors',
          isActive
            ? 'bg-white/25'
            : 'bg-transparent group-hover:bg-white/10'
        )}
      >
        <Icon className="w-[18px] h-[18px] text-white/90" />
        {beta && (
          <BetaBadge size="xs" className="absolute -top-1 -right-2 shadow-sm" />
        )}
      </div>
      <span
        className="text-xs leading-tight text-center text-white/70 group-hover:text-white/90 transition-colors truncate w-full px-0.5"
        title={label}
      >
        {label}
        {opensInNewTab && (
          <ExternalLink className="inline-block w-2 h-2 ml-0.5 -mt-0.5" />
        )}
      </span>
    </button>
  );

  if (!tooltip) return button;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent side="right">{tooltip}</TooltipContent>
    </Tooltip>
  );
}
