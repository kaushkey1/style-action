import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui';
import { formatNumber } from '@/lib/utils';
import type { CategoryAllocation, SubcategoryPod } from '../data/mockSpacePlanningData';

interface WhyPopoverProps {
  children: React.ReactNode;
  category?: CategoryAllocation;
  pod?: SubcategoryPod;
  plPool?: number;
}

export function WhyPopover({ children, category, pod, plPool }: WhyPopoverProps): React.ReactNode {
  if (!category && !pod) return children;

  const lines: Array<{ label: string; value: string }> = [];

  if (category) {
    lines.push(
      { label: 'Sales share', value: `${(category.salesShare * 100).toFixed(1)}%` },
      { label: 'Efficiency', value: `${category.efficiencyActual.toFixed(2)} (${category.efficiencyLow.toFixed(2)}–${category.efficiencyHigh.toFixed(2)})` },
      { label: 'Bound', value: category.boundBadge === '@lower' ? 'at lower' : category.boundBadge === '@upper' ? 'at upper' : category.boundBadge === '>sigmaMax' ? `exceeded ΣMAX (${formatNumber(category.sigmaMax)})` : category.boundBadge === 'manual' ? 'manual override' : 'free' },
      { label: 'Space', value: `${formatNumber(category.newSpace)} sq ft` },
    );
    if (plPool) {
      lines.push({ label: 'Pool share', value: `${((category.newSpace / plPool) * 100).toFixed(1)}%` });
    }
  }

  if (pod) {
    // MIN is the only hard bound; MAX is a soft guideline (info only).
    lines.push(
      { label: 'Min', value: `${formatNumber(pod.min)} sq ft` },
      { label: 'Allocated', value: `${formatNumber(pod.newSpace)} sq ft` },
      { label: 'Bound', value: pod.boundBadge === '@min' ? 'at minimum' : pod.boundBadge === '@max' ? 'at max guideline' : 'ok' },
    );
  }

  const title = category
    ? `Why ${formatNumber(category.newSpace)} sq ft?`
    : pod
      ? `Why ${formatNumber(pod.newSpace)} sq ft?`
      : '';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="cursor-help">
          {children}
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <p className="font-semibold mb-1">{title}</p>
        <div className="space-y-0.5">
          {lines.map((line) => (
            <div key={line.label} className="flex items-start justify-between gap-3 text-xs">
              <span className="text-gray-400 flex-shrink-0">{line.label}</span>
              <span className="font-mono text-right">{line.value}</span>
            </div>
          ))}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
