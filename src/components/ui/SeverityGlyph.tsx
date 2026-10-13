import { Tooltip, TooltipTrigger, TooltipContent } from './Tooltip';
import { cn } from '@/lib/utils';
import type { ExceptionSeverity } from '@/modules/exceptions/data/mockExceptions';

interface SeverityGlyphProps {
  severity: ExceptionSeverity;
  size?: 'sm' | 'md';
}

const SEVERITY_CONFIG: Record<ExceptionSeverity, { filled: number; color: string; label: string }> = {
  S1: { filled: 4, color: 'text-red-500', label: 'S1 Critical' },
  S2: { filled: 3, color: 'text-amber-500', label: 'S2 High' },
  S3: { filled: 2, color: 'text-indigo-500', label: 'S3 Medium' },
  S4: { filled: 1, color: 'text-gray-400', label: 'S4 Low' },
};

export function SeverityGlyph({ severity, size = 'sm' }: SeverityGlyphProps): React.ReactNode {
  const config = SEVERITY_CONFIG[severity];
  const dimensions = size === 'sm' ? { width: 14, height: 12 } : { width: 18, height: 16 };
  const barWidth = size === 'sm' ? 2.5 : 3;
  const gap = size === 'sm' ? 1 : 1.5;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cn('inline-flex items-center shrink-0', config.color)} aria-label={config.label}>
          <svg
            width={dimensions.width}
            height={dimensions.height}
            viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
            fill="none"
            aria-hidden="true"
          >
            {[0, 1, 2, 3].map((i) => {
              const barHeight = ((i + 1) / 4) * dimensions.height;
              const x = i * (barWidth + gap);
              const y = dimensions.height - barHeight;
              const isFilled = i < config.filled;

              return (
                <rect
                  key={i}
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  rx={0.5}
                  fill={isFilled ? 'currentColor' : 'currentColor'}
                  opacity={isFilled ? 1 : 0.2}
                />
              );
            })}
          </svg>
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">
        {config.label}
      </TooltipContent>
    </Tooltip>
  );
}
