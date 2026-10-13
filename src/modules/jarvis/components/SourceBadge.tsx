import { Database, Video, AudioLines, TrendingUp, CircleOff } from 'lucide-react';
import { Badge } from '@/components/ui';
import { cn } from '@/lib/utils';

import type { LucideIcon } from 'lucide-react';
import type { SourceType } from '@/modules/jarvis/data/mockJarvis';

const sourceConfig: Record<SourceType, { label: string; variant: 'default' | 'info' | 'warning' | 'outline'; icon: LucideIcon }> = {
  input: { label: 'Input Data', variant: 'info', icon: Database },
  cctv: { label: 'CCTV Observed', variant: 'default', icon: Video },
  audio: { label: 'Audio Analysed', variant: 'default', icon: AudioLines },
  estimated: { label: 'Estimated', variant: 'warning', icon: TrendingUp },
  unavailable: { label: 'Unavailable', variant: 'outline', icon: CircleOff },
};

interface SourceBadgeProps {
  source: SourceType;
  className?: string;
}

export function SourceBadge({ source, className }: SourceBadgeProps): React.ReactNode {
  const config = sourceConfig[source];
  const Icon = config.icon;
  return (
    <Badge variant={config.variant} size="sm" className={cn('gap-1', className)}>
      <Icon className="w-3 h-3" />
      {config.label}
    </Badge>
  );
}
