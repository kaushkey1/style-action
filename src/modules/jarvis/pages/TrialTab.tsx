import {
  MetricGrid,
  MetricCard,
  SectionHeader,
  Card,
  CardContent,
  Badge,
  DataTable,
  DataTableHeader,
  DataTableBody,
  DataTableRow,
  DataTableHead,
  DataTableCell,
  EmptyState,
} from '@/components/ui';
import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { SourceBadge } from '../components/SourceBadge';
import { useJarvisDateStore } from '../stores/useJarvisDateStore';
import { useSmartiAreaCount, useSmartiAttendedUnattended, useSmartiDeptAttendedUnattended } from '../api/smartiQueries';
import type { AreaCountEntry, AttendedUnattendedEntry, DeptAttendedEntry, DeptCameraAttended } from '../api/smartiTypes';

function formatSeconds(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}

function DeptAttendedRow({ dept }: { dept: DeptAttendedEntry }): React.ReactNode {
  const [expanded, setExpanded] = useState(false);
  const hasPerCamera = dept.perCamera.length > 0;

  return (
    <>
      <DataTableRow>
        <DataTableCell className="font-medium text-xs">
          {hasPerCamera ? (
            <button
              type="button"
              className="flex items-center gap-1 min-h-[44px] md:min-h-0"
              onClick={() => setExpanded((prev) => !prev)}
              aria-expanded={expanded}
              aria-label={`Toggle camera details for ${dept.name}`}
            >
              {expanded ? (
                <ChevronDown className="w-3 h-3 text-gray-400" />
              ) : (
                <ChevronRight className="w-3 h-3 text-gray-400" />
              )}
              {dept.name}
            </button>
          ) : (
            dept.name
          )}
        </DataTableCell>
        <DataTableCell align="right" className="text-xs tabular-nums">{dept.attended}</DataTableCell>
        <DataTableCell align="right" className="text-xs tabular-nums">{dept.unattended}</DataTableCell>
        <DataTableCell align="right" className="text-xs tabular-nums">{dept.totalVisits}</DataTableCell>
        <DataTableCell>
          <Badge
            variant={dept.attendedRate < 20 ? 'error' : dept.attendedRate < 50 ? 'warning' : 'success'}
            size="sm"
          >
            {dept.attendedRate}%
          </Badge>
        </DataTableCell>
      </DataTableRow>
      {expanded && dept.perCamera.map((cam: DeptCameraAttended) => {
        const camRate = cam.totalVisits > 0 ? Math.round((cam.attended / cam.totalVisits) * 100) : 0;
        return (
          <DataTableRow key={cam.cameraId}>
            <DataTableCell className="text-xs text-gray-500 pl-8">{cam.cameraName}</DataTableCell>
            <DataTableCell align="right" className="text-xs tabular-nums text-gray-500">{cam.attended}</DataTableCell>
            <DataTableCell align="right" className="text-xs tabular-nums text-gray-500">{cam.unattended}</DataTableCell>
            <DataTableCell align="right" className="text-xs tabular-nums text-gray-500">{cam.totalVisits}</DataTableCell>
            <DataTableCell>
              <Badge
                variant={camRate < 20 ? 'error' : camRate < 50 ? 'warning' : 'success'}
                size="sm"
              >
                {camRate}%
              </Badge>
            </DataTableCell>
          </DataTableRow>
        );
      })}
    </>
  );
}

interface TrialTabProps {
  startDateOverride?: string;
  endDateOverride?: string;
}

export function TrialTab({ startDateOverride, endDateOverride }: TrialTabProps = {}): React.ReactNode {
  const storeDate = useJarvisDateStore((s) => s.dateRange);
  const startDate = startDateOverride ?? storeDate.startDate;
  const endDate = endDateOverride ?? storeDate.endDate;
  const areaCount = useSmartiAreaCount(startDate, endDate);
  const attendedUnattended = useSmartiAttendedUnattended(startDate, endDate);
  const deptAttended = useSmartiDeptAttendedUnattended(startDate, endDate);

  // Trial room zones from Smarti (identified by queue metadata)
  const allZones: AreaCountEntry[] = areaCount.data?.data ?? [];
  const trialRoomZones = allZones.filter(
    (z: AreaCountEntry) => z.queueType === 'trial_room_queue',
  );
  const totalTrialVisits = trialRoomZones.reduce((sum: number, z: AreaCountEntry) => sum + z.totalVisits, 0);
  const totalTrialServed = trialRoomZones.reduce((sum: number, z: AreaCountEntry) => sum + z.totalServed, 0);
  const avgTrialWait = trialRoomZones.length > 0
    ? trialRoomZones.reduce((sum: number, z: AreaCountEntry) => sum + z.avgWaitTime, 0) / trialRoomZones.length
    : 0;

  // Attended rate from CCTV
  const auData: AttendedUnattendedEntry[] = attendedUnattended.data?.data ?? [];
  const totalAttended = auData.reduce((sum: number, a: AttendedUnattendedEntry) => sum + a.attended, 0);
  const totalInteractions = auData.reduce((sum: number, a: AttendedUnattendedEntry) => sum + a.attended + a.unattended, 0);
  const assistanceRate = totalInteractions > 0 ? Math.round((totalAttended / totalInteractions) * 100) : 0;

  const isLoading = areaCount.isLoading;

  return (
    <div className="space-y-4">
      <SectionHeader title="Trial & Selection Journey" subtitle="Product browsing, trial, and selection behaviour" />

      {/* Trial Metrics */}
      <MetricGrid columns={4}>
        <MetricCard
          label="Trial Room Visits"
          value={isLoading ? '...' : totalTrialVisits.toLocaleString()}
          badge={<SourceBadge source="cctv" />}
        />
        <MetricCard
          label="Trial Room Wait"
          value={isLoading ? '...' : formatSeconds(avgTrialWait)}
          badge={<SourceBadge source="cctv" />}
          status={avgTrialWait > 300 ? 'critical' : avgTrialWait > 120 ? 'warning' : 'on-track'}
        />
        <MetricCard
          label="Staff Assistance Rate"
          value={attendedUnattended.isLoading ? '...' : `${assistanceRate}%`}
          badge={<SourceBadge source="cctv" />}
          status={assistanceRate < 20 ? 'critical' : assistanceRate < 50 ? 'warning' : 'on-track'}
        />
        <MetricCard
          label="Trial Served"
          value={isLoading ? '...' : totalTrialServed.toLocaleString()}
          badge={<SourceBadge source="cctv" />}
        />
      </MetricGrid>

      {/* Trial Room Queue from CCTV */}
      <div>
        <SectionHeader
          title="Trial Room Queues"
          subtitle="Queue metrics from CCTV"
          actions={<Badge variant="outline" size="sm">{trialRoomZones.length} queues</Badge>}
        />
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-gray-500">Loading...</div>
            ) : trialRoomZones.length === 0 ? (
              <EmptyState title="No trial room data" description="No trial room queue data for this period" />
            ) : (
              <DataTable minWidth="400px">
                <DataTableHeader>
                  <DataTableHead>Queue</DataTableHead>
                  <DataTableHead align="right">Visits</DataTableHead>
                  <DataTableHead align="right">Avg Wait</DataTableHead>
                  <DataTableHead align="right">Active</DataTableHead>
                </DataTableHeader>
                <DataTableBody>
                  {trialRoomZones.map((zone: AreaCountEntry) => (
                    <DataTableRow key={zone.areaId}>
                      <DataTableCell className="font-medium text-xs">{zone.areaName}</DataTableCell>
                      <DataTableCell align="right" className="text-xs tabular-nums">{zone.totalVisits}</DataTableCell>
                      <DataTableCell align="right" className="text-xs tabular-nums">{formatSeconds(zone.avgWaitTime)}</DataTableCell>
                      <DataTableCell align="right" className="text-xs tabular-nums">{zone.activeVisitors}</DataTableCell>
                    </DataTableRow>
                  ))}
                </DataTableBody>
              </DataTable>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Staff Interaction by Department */}
      <div>
        <SectionHeader
          title="Staff Interaction by Department"
          subtitle="Per-department attended vs unattended with camera drill-down"
          actions={
            <div className="flex items-center gap-2">
              <SourceBadge source="cctv" />
              <SourceBadge source="audio" />
              <Badge variant="outline" size="sm">
                {deptAttended.data?.departments?.length ?? 0} departments
              </Badge>
            </div>
          }
        />
        <Card>
          <CardContent className="p-0">
            {deptAttended.isLoading ? (
              <div className="p-4 text-center text-sm text-gray-500">Loading department data...</div>
            ) : deptAttended.error ? (
              <EmptyState title="Failed to load" description={deptAttended.error.message} />
            ) : (deptAttended.data?.departments?.length ?? 0) === 0 ? (
              <EmptyState title="No data" description="No department attended/unattended data for this period" />
            ) : (
              <DataTable minWidth="500px">
                <DataTableHeader>
                  <DataTableHead>Department</DataTableHead>
                  <DataTableHead align="right">Attended</DataTableHead>
                  <DataTableHead align="right">Unattended</DataTableHead>
                  <DataTableHead align="right">Total</DataTableHead>
                  <DataTableHead>Rate</DataTableHead>
                </DataTableHeader>
                <DataTableBody>
                  {(deptAttended.data?.departments ?? []).map((dept: DeptAttendedEntry) => (
                    <DeptAttendedRow key={dept.departmentId} dept={dept} />
                  ))}
                </DataTableBody>
              </DataTable>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
