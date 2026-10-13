import React from 'react';
import { Lock, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui';
import { cn } from '@/lib/utils';

import type { CycleStatus } from '../types/aopPlanning.types';

interface CycleStatusBadgeProps {
  status: CycleStatus;
}

const STATUS_CONFIG: Record<CycleStatus, { variant: 'default' | 'info' | 'warning' | 'success' | 'outline'; className?: string; icon?: React.ReactNode }> = {
  DRAFT: { variant: 'outline' },
  SUBMITTED: { variant: 'info' },
  IN_REVIEW: { variant: 'warning' },
  REVISION_REQUESTED: { variant: 'warning' },
  APPROVED: { variant: 'success' },
  LOCKED: {
    variant: 'default',
    className: 'bg-primary/10 text-primary',
    icon: <Lock className="w-3 h-3" />,
  },
  PROMOTED: {
    variant: 'success',
    icon: <CheckCircle className="w-3 h-3" />,
  },
};

function formatStatusLabel(status: CycleStatus): string {
  return status.replace(/_/g, ' ');
}

export function CycleStatusBadge({ status }: CycleStatusBadgeProps): React.ReactNode {
  const config = STATUS_CONFIG[status];

  return (
    <Badge
      variant={config.variant}
      className={cn(config.className)}
    >
      {config.icon}
      {formatStatusLabel(status)}
    </Badge>
  );
}
