import { useState } from 'react';
import {
  SectionHeader,
  Badge,
  Card,
  CardContent,
  MetricGrid,
  MetricCard,
  EmptyState,
} from '@/components/ui';
import { AlertTriangle, Bell, ShieldAlert, Activity } from 'lucide-react';
import { AlertCard } from '../components/AlertCard';
import { AlertDetailModal } from '../components/AlertDetailModal';
import { SourceBadge } from '../components/SourceBadge';
import { useJarvisDateStore } from '../stores/useJarvisDateStore';
import { useSmartiAlerts } from '../api/smartiQueries';

import type { AlertEntry } from '../api/smartiTypes';

export function ActionTrackerTab(): React.ReactNode {
  const { startDate, endDate } = useJarvisDateStore((s) => s.dateRange);
  const alerts = useSmartiAlerts(startDate, endDate);
  const [selectedAlertIndex, setSelectedAlertIndex] = useState<number | null>(null);

  const alertList: AlertEntry[] = alerts.data?.alerts ?? [];
  const selectedAlert = selectedAlertIndex !== null ? alertList[selectedAlertIndex] ?? null : null;
  const alertTotal = alerts.data?.total ?? 0;

  const highCount = alertList.filter((a) => a.severity === 'high').length;
  const mediumCount = alertList.filter((a) => a.severity === 'medium').length;
  const triggeredCount = alertList.filter((a) => a.status === 'triggered').length;
  const typeGroups = alertList.reduce<Record<string, number>>((acc, a) => {
    acc[a.type] = (acc[a.type] ?? 0) + 1;
    return acc;
  }, {});
  const topType = Object.entries(typeGroups).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Action Tracker"
        subtitle={alerts.isLoading ? 'Loading alerts...' : `${alertTotal} alerts detected by CCTV`}
        actions={<SourceBadge source="cctv" />}
      />

      {/* Alert Summary Metrics */}
      <MetricGrid columns={4}>
        <MetricCard
          label="Total Alerts"
          value={alerts.isLoading ? '...' : String(alertTotal)}
          icon={Bell}
          badge={<SourceBadge source="cctv" />}
        />
        <MetricCard
          label="High Severity"
          value={alerts.isLoading ? '...' : String(highCount)}
          icon={ShieldAlert}
          iconColor="error"
          status={highCount > 0 ? 'critical' : 'on-track'}
        />
        <MetricCard
          label="Triggered"
          value={alerts.isLoading ? '...' : String(triggeredCount)}
          icon={AlertTriangle}
          iconColor="warning"
        />
        <MetricCard
          label="Top Alert Type"
          value={alerts.isLoading ? '...' : topType ? topType[0].split('_').join(' ') : '--'}
          subtitle={topType ? `${topType[1]} occurrences` : undefined}
          icon={Activity}
        />
      </MetricGrid>

      {/* Severity Breakdown */}
      {!alerts.isLoading && alertList.length > 0 && (
        <Card>
          <CardContent className="p-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-medium text-gray-500">By Severity:</span>
              <Badge variant="error" dot>High: {highCount}</Badge>
              <Badge variant="warning" dot>Medium: {mediumCount}</Badge>
              <Badge variant="default" dot>Low: {alertList.length - highCount - mediumCount}</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alert Cards */}
      <div>
        <SectionHeader
          title="CCTV Alerts"
          subtitle="Real-time incident detection from video analytics"
          actions={
            !alerts.isLoading && (
              <Badge variant="outline" size="sm">{alertList.length} shown</Badge>
            )
          }
        />
        {alerts.isLoading ? (
          <div className="p-4 text-center text-sm text-gray-500">Loading alerts...</div>
        ) : alerts.error ? (
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-red-600">Failed to load alerts: {alerts.error.message}</p>
            </CardContent>
          </Card>
        ) : alertList.length === 0 ? (
          <EmptyState
            title="No alerts"
            description="No CCTV alerts detected for this date range"
          />
        ) : (
          <div className="space-y-2">
            {alertList.map((alert, index) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onViewDetails={() => setSelectedAlertIndex(index)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Alert Detail Modal */}
      {selectedAlert !== null && selectedAlertIndex !== null && (
        <AlertDetailModal
          alert={selectedAlert}
          isOpen
          onClose={() => setSelectedAlertIndex(null)}
          onPrev={selectedAlertIndex > 0 ? () => setSelectedAlertIndex(selectedAlertIndex - 1) : null}
          onNext={selectedAlertIndex < alertList.length - 1 ? () => setSelectedAlertIndex(selectedAlertIndex + 1) : null}
          currentIndex={selectedAlertIndex}
          totalCount={alertList.length}
        />
      )}
    </div>
  );
}
