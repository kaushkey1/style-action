import React from 'react';
import { X, AlertTriangle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge, Button } from '@/components/ui';
import { ruleLabel, titleCase } from '../data/exceptionRules';

import type { PlanningException } from '../types/aopPlanning.types';

interface ExceptionRowProps {
  exception: PlanningException;
  onAcknowledge: () => void;
  onResolve: () => void;
  onNavigate: () => void;
}

export function ExceptionRow({
  exception,
  onAcknowledge,
  onResolve,
  onNavigate,
}: ExceptionRowProps): React.ReactNode {
  const isHard = exception.severity === 'hard';
  const isOpen = exception.status === 'open';
  const isAcknowledged = exception.status === 'acknowledged';

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3 border-l-2',
        isHard ? 'border-l-red-500' : 'border-l-amber-500',
      )}
    >
      {/* Severity icon */}
      <div className="shrink-0 mt-0.5">
        {isHard ? (
          <X className="w-4 h-4 text-red-500" />
        ) : (
          <AlertTriangle className="w-4 h-4 text-amber-500" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">
          {ruleLabel(exception.rule)}
        </p>
        <p className="text-xs text-gray-600 mt-0.5">{exception.message}</p>
        <p className="text-xs text-gray-500 mt-0.5">
          Affected: {exception.affectedEntity}
        </p>
      </div>

      {/* Status + Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <Badge
          variant={
            exception.status === 'resolved'
              ? 'success'
              : exception.status === 'acknowledged'
                ? 'warning'
                : 'error'
          }
          size="sm"
        >
          {titleCase(exception.status)}
        </Badge>

        {!isHard && isOpen && (
          <Button variant="outline" size="sm" onClick={onAcknowledge}>
            Acknowledge
          </Button>
        )}

        {isAcknowledged && (
          <Button variant="outline" size="sm" onClick={onResolve}>
            Resolve
          </Button>
        )}

        {exception.deepLinkRowId && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onNavigate}
            aria-label={`Navigate to ${exception.affectedEntity}`}
          >
            <ArrowRight className="w-4 h-4" />
            Go
          </Button>
        )}
      </div>
    </div>
  );
}
