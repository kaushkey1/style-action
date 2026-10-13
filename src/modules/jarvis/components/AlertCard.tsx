import { useState } from 'react';
import { ChevronDown, ChevronRight, Camera, MapPin, Clock, AlertTriangle, Eye } from 'lucide-react';
import { Badge, Button } from '@/components/ui';
import { cn } from '@/lib/utils';

import type { AlertEntry } from '../api/smartiTypes';

const SEVERITY_VARIANT: Record<string, 'error' | 'warning' | 'default'> = {
  high: 'error',
  medium: 'warning',
  low: 'default',
};

const STATUS_VARIANT: Record<string, 'error' | 'warning' | 'info' | 'success'> = {
  triggered: 'error',
  acknowledged: 'warning',
  investigating: 'info',
  resolved: 'success',
};

function formatAlertType(type: string): string {
  return type
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function formatAlertTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

interface AlertCardProps {
  alert: AlertEntry;
  className?: string;
  onViewDetails?: () => void;
}

export function AlertCard({ alert, className, onViewDetails }: AlertCardProps): React.ReactNode {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className={cn(
        'bg-white rounded-lg border border-gray-200 transition-all duration-200',
        'hover:border-primary/30 hover:shadow-md',
        isExpanded && 'border-primary/20 shadow-sm',
        className,
      )}
    >
      <button
        type="button"
        className="w-full text-left p-3 flex items-start gap-2"
        onClick={() => setIsExpanded((prev) => !prev)}
        aria-expanded={isExpanded}
        aria-label={`Toggle details for ${formatAlertType(alert.type)} alert`}
      >
        <span className="mt-0.5 shrink-0 text-gray-400">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            <Badge variant={SEVERITY_VARIANT[alert.severity] ?? 'default'} size="sm" dot>
              {alert.severity}
            </Badge>
            <Badge variant={STATUS_VARIANT[alert.status] ?? 'default'} size="sm">
              {alert.status}
            </Badge>
            <Badge variant="outline" size="sm">{alert.category}</Badge>
          </div>
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <p className="text-sm font-medium text-gray-900">{formatAlertType(alert.type)}</p>
          </div>
          {!isExpanded && (
            <p className="text-xs text-gray-500 mt-0.5">
              {formatAlertTime(alert.createdAt)} · Camera {alert.cameraId}
            </p>
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="px-3 pb-3 ml-6 space-y-3 border-t border-gray-100 pt-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="flex items-center gap-2 text-xs">
              <Camera className="w-3 h-3 text-gray-400 shrink-0" />
              <span className="text-gray-500">Camera:</span>
              <span className="text-gray-900 font-medium">{alert.cameraId}</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
              <span className="text-gray-500">Zone:</span>
              <span className="text-gray-900 font-medium">{alert.zoneId}</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Clock className="w-3 h-3 text-gray-400 shrink-0" />
              <span className="text-gray-500">Time:</span>
              <span className="text-gray-900 font-medium">{formatAlertTime(alert.createdAt)}</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <AlertTriangle className="w-3 h-3 text-gray-400 shrink-0" />
              <span className="text-gray-500">Count:</span>
              <span className="text-gray-900 font-medium">{alert.count}</span>
            </div>
          </div>

          {alert.frameUrl && (
            <div>
              <p className="text-xs text-gray-500 font-medium mb-1.5">CCTV Frame</p>
              <img
                src={alert.frameUrl}
                alt={`CCTV frame for ${formatAlertType(alert.type)} alert`}
                className="w-full h-auto max-w-full rounded-lg border border-gray-200"
                loading="lazy"
              />
            </div>
          )}

          {onViewDetails && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails();
              }}
            >
              <Eye className="w-3.5 h-3.5 mr-1.5" />
              View Details
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
