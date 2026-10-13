import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn, ragBadgeVariant, ragLabel, type RagStatus } from '@/lib/utils';
import { Badge } from './Badge';
import { InfoHeaderIcon } from './InfoHeaderIcon';

type IconColor = 'success' | 'warning' | 'error' | 'info';

const iconColorClasses: Record<IconColor, { bg: string; text: string }> = {
  success: { bg: 'bg-green-50', text: 'text-green-600' },
  warning: { bg: 'bg-amber-50', text: 'text-amber-600' },
  error: { bg: 'bg-red-50', text: 'text-red-600' },
  info: { bg: 'bg-blue-50', text: 'text-blue-600' },
};

interface MetricCardProps {
  label: ReactNode;
  value: string | number;
  icon?: LucideIcon;
  iconColor?: IconColor;
  status?: RagStatus;
  subtitle?: string;
  description?: string;
  trend?: string;
  badge?: ReactNode;
  children?: ReactNode;
  className?: string;
  valueClassName?: string;
  size?: 'default' | 'sm';
  /** When set, renders an info icon in the top-right that shows the metric's tooltip/formula */
  infoKey?: string;
  /** Extra line shown in the info tooltip after formula (e.g. dynamic discount value) */
  infoExtra?: string;
}

export function MetricCard({ label, value, icon: Icon, iconColor, status, subtitle, description, trend, badge, children, className, valueClassName, size = 'default', infoKey, infoExtra }: MetricCardProps) {
  const showIconCircle = Icon && iconColor;
  const isSmall = size === 'sm';

  return (
    <div
      className={cn(
        'rounded-lg border border-gray-200 bg-white',
        isSmall ? 'p-3' : 'p-4',
        className
      )}
      {...(infoKey ? { 'data-glossary-anchor': infoKey } : {})}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {showIconCircle ? (
            <div className={cn('p-2 rounded-lg', iconColorClasses[iconColor].bg)}>
              <Icon className={cn('w-4 h-4', iconColorClasses[iconColor].text)} />
            </div>
          ) : Icon ? (
            <Icon className={cn('shrink-0', isSmall ? 'w-4 h-4 text-gray-500' : 'h-4 w-4 text-gray-400')} />
          ) : null}
          <span className={isSmall ? 'text-sm font-semibold text-gray-900' : 'text-xs font-medium text-gray-500'}>{label}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {badge ?? (status && (
            <Badge variant={ragBadgeVariant(status)} className="text-xs">
              {ragLabel(status)}
            </Badge>
          ))}
          {infoKey && <InfoHeaderIcon metricKey={infoKey} extra={infoExtra} glossaryType="kpi" />}
        </div>
      </div>
      {description && (
        <p className="text-xs text-gray-500 mb-2 mt-1">{description}</p>
      )}
      <div className={cn(description ? '' : 'mt-2', 'flex items-baseline gap-2')}>
        <p className={cn(
          isSmall ? 'text-xl font-bold text-gray-900' : 'text-lg lg:text-2xl font-semibold text-gray-900',
          valueClassName
        )}>{value}</p>
        {trend && (
          <span className={cn(
            'text-xs font-medium',
            trend.startsWith('+') || trend.startsWith('\u2191') ? 'text-green-600' : trend.startsWith('-') || trend.startsWith('\u2193') ? 'text-red-600' : 'text-gray-500'
          )}>
            {trend}
          </span>
        )}
      </div>
      {children}
      {subtitle && (
        <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
      )}
    </div>
  );
}
