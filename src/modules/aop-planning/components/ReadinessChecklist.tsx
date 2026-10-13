import React from 'react';
import { Check, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

import type { ReadinessCheck, ReadinessStatus } from '../types/aopPlanning.types';

interface ReadinessChecklistProps {
  checks: ReadinessCheck[];
}

const STATUS_ICON_CONFIG: Record<
  ReadinessStatus,
  { icon: React.ReactNode; bgClass: string }
> = {
  ready: {
    icon: <Check className="w-4 h-4 text-green-600" />,
    bgClass: 'bg-green-100',
  },
  pending: {
    icon: <AlertTriangle className="w-4 h-4 text-amber-600" />,
    bgClass: 'bg-amber-100',
  },
  error: {
    icon: <X className="w-4 h-4 text-red-600" />,
    bgClass: 'bg-red-100',
  },
};

export function ReadinessChecklist({ checks }: ReadinessChecklistProps): React.ReactNode {
  if (checks.length === 0) {
    return (
      <p className="text-sm text-gray-500 py-4 text-center">
        No readiness checks configured
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {checks.map((check) => {
        const config = STATUS_ICON_CONFIG[check.status];
        return (
          <div
            key={check.id}
            className="border border-gray-200 rounded-lg p-4 flex items-start gap-3"
          >
            <div
              className={cn(
                'shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
                config.bgClass,
              )}
            >
              {config.icon}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900">
                {check.label}
              </p>
              <p className="text-sm text-gray-700 mt-0.5">
                {check.description}
              </p>
              {check.detail && (
                <p className="text-xs text-gray-500 mt-1">{check.detail}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
