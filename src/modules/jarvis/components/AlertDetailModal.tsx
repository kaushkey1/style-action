import { useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle, XCircle, Eye } from 'lucide-react';
import { Modal, ModalFooter, Badge, Button } from '@/components/ui';
import { useToast } from '@/hooks/useToast';

import type { AlertEntry } from '../api/smartiTypes';

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

const ALERT_DESCRIPTIONS: Record<string, string> = {
  unauthorized_access: 'Unauthorized person detected in a restricted area. The system identified an individual without valid access credentials.',
  crowd_detection: 'Abnormal crowd density detected in the monitored zone. The number of individuals exceeds the configured threshold.',
  fire_smoke_detection: 'Potential fire or smoke detected by the camera. Visual analysis indicates signs of combustion or smoke particles.',
  loitering: 'Individual detected lingering in the area beyond the allowed duration. This may indicate suspicious activity.',
  intrusion_detection: 'Movement detected in a restricted or secured zone during off-hours. Perimeter breach may have occurred.',
  slip_and_fall: 'A person was detected falling in the monitored area. Immediate attention may be required for safety.',
  violence_detection: 'Physical altercation or aggressive behavior detected between individuals in the monitored zone.',
  shoplifting: 'Suspicious behavior matching shoplifting patterns detected. An individual may be concealing merchandise.',
};

const ALERT_SOLUTIONS: Record<string, string> = {
  unauthorized_access: 'Verify the individual\'s identity and access permissions. If unauthorized, notify security and escort them from the restricted area.',
  crowd_detection: 'Monitor the situation and consider crowd management measures. Alert floor staff to manage customer flow if density continues to increase.',
  fire_smoke_detection: 'Immediately verify the alert visually. If confirmed, activate fire safety protocols, alert occupants, and contact emergency services.',
  loitering: 'Dispatch security personnel to assess the situation. Engage the individual to determine their intent and provide assistance if needed.',
  intrusion_detection: 'Alert on-site security immediately. Review camera footage to assess the nature of the intrusion and secure the affected area.',
  slip_and_fall: 'Dispatch first aid personnel to the location immediately. Document the incident and secure the area to prevent further falls.',
  violence_detection: 'Alert security personnel immediately. Do not intervene alone. Contact law enforcement if the situation escalates.',
  shoplifting: 'Notify loss prevention staff discreetly. Monitor the individual and follow store protocol for suspected theft.',
};

function getAlertDescription(type: string): string {
  return ALERT_DESCRIPTIONS[type] ?? `A ${formatAlertType(type).toLowerCase()} event was detected by the CCTV analytics system in the monitored zone.`;
}

function getAlertSolution(type: string, severity: string): string {
  const base = ALERT_SOLUTIONS[type] ?? `Review the CCTV footage and assess the situation. Take appropriate action based on store protocols.`;
  if (severity === 'high') {
    return `URGENT: ${base}`;
  }
  return base;
}

interface AlertDetailModalProps {
  alert: AlertEntry;
  isOpen: boolean;
  onClose: () => void;
  onPrev: (() => void) | null;
  onNext: (() => void) | null;
  currentIndex: number;
  totalCount: number;
}

export function AlertDetailModal({
  alert,
  isOpen,
  onClose,
  onPrev,
  onNext,
  currentIndex,
  totalCount,
}: AlertDetailModalProps): React.ReactNode {
  const { success } = useToast();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && onPrev) onPrev();
      if (e.key === 'ArrowRight' && onNext) onNext();
    },
    [onPrev, onNext],
  );

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyDown]);

  const handleAcknowledge = (): void => {
    success('Alert acknowledged');
  };

  const handleResolve = (): void => {
    success('Alert marked as resolved');
  };

  const handleIgnore = (): void => {
    success('Alert dismissed');
  };

  const alertId = alert.serialId || alert.id.slice(0, 12);
  const cameraLabel = alert.cameraName || alert.cameraId;
  const siteLabel = alert.siteName || alert.siteId || '--';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Alert Details" size="full">
      <div className="space-y-4">
        {/* Two-column layout: image + info grid */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* CCTV Frame */}
          <div className="w-full md:w-3/5">
            <p className="text-xs font-medium text-gray-500 mb-1.5">CCTV Frame</p>
            <div className="aspect-video w-full rounded-lg border border-gray-200 bg-gray-50 overflow-hidden">
              {alert.frameUrl ? (
                <img
                  src={alert.frameUrl}
                  alt={`CCTV frame for ${formatAlertType(alert.type)} alert`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sm text-gray-400">
                  No frame available
                </div>
              )}
            </div>
          </div>

          {/* Alarm Information Grid */}
          <div className="w-full md:w-2/5">
            <p className="text-xs font-medium text-gray-500 mb-1.5">Alarm Information</p>
            <div className="rounded-lg border border-gray-200 divide-y divide-gray-100">
              <InfoRow label="Date & Time" value={formatAlertTime(alert.createdAt)} />
              <InfoRow label="Category">
                <Badge variant="outline" size="sm">{alert.category}</Badge>
              </InfoRow>
              <InfoRow label="Alert Type" value={formatAlertType(alert.type)} />
              <InfoRow label="Alert ID">
                <span className="font-mono text-xs">{alertId}</span>
              </InfoRow>
              <InfoRow label="Severity">
                <Badge variant={SEVERITY_VARIANT[alert.severity] ?? 'default'} size="sm" dot>
                  {alert.severity}
                </Badge>
              </InfoRow>
              <InfoRow label="Status">
                <Badge variant={STATUS_VARIANT[alert.status] ?? 'default'} size="sm">
                  {alert.status}
                </Badge>
              </InfoRow>
              <InfoRow label="Camera" value={cameraLabel} />
              <InfoRow label="Site" value={siteLabel} />
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">Description</p>
          <p className="text-sm text-gray-700 leading-relaxed">
            {getAlertDescription(alert.type)}
          </p>
        </div>

        {/* Solution */}
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">Recommended Action</p>
          <p className="text-sm text-gray-700 leading-relaxed">
            {getAlertSolution(alert.type, alert.severity)}
          </p>
        </div>
      </div>

      <ModalFooter className="flex-col sm:flex-row gap-2">
        <div className="flex items-center gap-2 mr-auto">
          <Button
            variant="outline"
            size="icon"
            onClick={onPrev ?? undefined}
            disabled={!onPrev}
            aria-label="Previous alert"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-xs text-gray-500">
            {currentIndex + 1} of {totalCount}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={onNext ?? undefined}
            disabled={!onNext}
            aria-label="Next alert"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleIgnore}>
            <XCircle className="w-3.5 h-3.5 mr-1" />
            Ignore
          </Button>
          <Button variant="outline" size="sm" onClick={handleAcknowledge}>
            <Eye className="w-3.5 h-3.5 mr-1" />
            Acknowledge
          </Button>
          <Button variant="primary" size="sm" onClick={handleResolve}>
            <CheckCircle className="w-3.5 h-3.5 mr-1" />
            Resolve
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
}

interface InfoRowProps {
  label: string;
  value?: string;
  children?: React.ReactNode;
}

function InfoRow({ label, value, children }: InfoRowProps): React.ReactNode {
  return (
    // eslint-disable-next-line design-system/prefer-section-header -- key-value row in info grid, not a section header
    <div className="flex items-center justify-between px-3 py-2">
      <span className="text-xs text-gray-500">{label}</span>
      {children ?? <span className="text-xs font-medium text-gray-900">{value}</span>}
    </div>
  );
}
