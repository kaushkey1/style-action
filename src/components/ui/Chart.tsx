import * as React from 'react';
import {
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend as RechartsLegend,
} from 'recharts';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Chart config — maps series keys to labels + colors
// ---------------------------------------------------------------------------

export interface ChartSeriesConfig {
  label: string;
  color: string;
  icon?: React.ComponentType;
}

export type ChartConfig = Record<string, ChartSeriesConfig>;

// ---------------------------------------------------------------------------
// ChartContainer — responsive wrapper with CSS variable injection
// ---------------------------------------------------------------------------

interface ChartContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  config: ChartConfig;
  children: React.ReactElement;
  /** Height for ResponsiveContainer. Default: 300 */
  height?: number;
}

export function ChartContainer({
  config,
  children,
  height = 300,
  className,
  style,
  ...props
}: ChartContainerProps) {
  // Inject chart colors as CSS variables so Recharts can reference them
  const cssVars = Object.entries(config).reduce<Record<string, string>>(
    (acc, [key, value]) => {
      acc[`--color-${key}`] = value.color;
      return acc;
    },
    {},
  );

  return (
    <div
      className={cn('w-full', className)}
      style={{ ...cssVars, ...style } as React.CSSProperties}
      {...props}
    >
      <ResponsiveContainer width="100%" minWidth={0} height={height}>
        {children}
      </ResponsiveContainer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ChartTooltipContent — styled tooltip for all chart types
// ---------------------------------------------------------------------------

interface TooltipPayloadItem {
  name?: string;
  value?: number | string;
  dataKey?: string;
  color?: string;
  payload?: Record<string, unknown>;
}

interface ChartTooltipContentProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
  config?: ChartConfig;
  /** Formatter for values. Default: locale string */
  valueFormatter?: (value: number | string) => string;
  /** Hide label row */
  hideLabel?: boolean;
  className?: string;
}

export function ChartTooltipContent({
  active,
  payload,
  label,
  config,
  valueFormatter,
  hideLabel,
  className,
}: ChartTooltipContentProps) {
  if (!active || !payload?.length) return null;

  const formatValue = valueFormatter ?? ((v: number | string) => {
    if (typeof v === 'number') return v.toLocaleString('en-IN');
    return String(v);
  });

  return (
    <div
      className={cn(
        'rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-md text-xs',
        className,
      )}
    >
      {!hideLabel && label && (
        <p className="font-medium text-gray-900 mb-1.5">{label}</p>
      )}
      <div className="space-y-1">
        {payload.map((item, i) => {
          const key = String(item.dataKey ?? item.name ?? i);
          const seriesConfig = config?.[key];
          const displayLabel = seriesConfig?.label ?? item.name ?? key;
          const dotColor = item.color ?? seriesConfig?.color ?? '#6366f1';

          return (
            <div key={key} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: dotColor }}
                />
                <span className="text-gray-500">{displayLabel}</span>
              </div>
              <span className="font-medium text-gray-900 tabular-nums">
                {formatValue(item.value ?? 0)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ChartLegend — styled legend
// ---------------------------------------------------------------------------

interface LegendPayloadItem {
  value?: string;
  dataKey?: string;
  color?: string;
}

interface ChartLegendContentProps {
  payload?: LegendPayloadItem[];
  config?: ChartConfig;
  className?: string;
}

export function ChartLegendContent({
  payload,
  config,
  className,
}: ChartLegendContentProps) {
  if (!payload?.length) return null;

  return (
    <div className={cn('flex items-center justify-center gap-4 text-xs pt-2', className)}>
      {payload.map((item) => {
        const key = String(item.dataKey ?? item.value ?? '');
        const seriesConfig = config?.[key];
        const displayLabel = seriesConfig?.label ?? item.value ?? key;
        const dotColor = item.color ?? seriesConfig?.color ?? '#6366f1';

        return (
          <div key={key} className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: dotColor }}
            />
            <span className="text-gray-500">{displayLabel}</span>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Re-export Recharts tooltip/legend for use with custom content renderers
// ---------------------------------------------------------------------------

export const ChartTooltip = RechartsTooltip;
export const ChartLegend = RechartsLegend;
