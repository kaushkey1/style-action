import { useState } from 'react';
import { Users, UserCheck, Clock, TrendingDown, Eye, Activity, Building2, BarChart3, GitGraph, Table2, PieChart } from 'lucide-react';
import type { AttendedUnattendedEntry, EmotionsEntry, FootfallEntry, DeptAnalyticsEntry, FirstZoneVisitEntry, DeptDwellTimeEntry } from '../api/smartiTypes';
import {
  MetricGrid,
  MetricCard,
  SectionHeader,
  Card,
  CardContent,
  CardTitle,
  DataTable,
  DataTableHeader,
  DataTableBody,
  DataTableRow,
  DataTableHead,
  DataTableCell,
  Badge,
  EmptyState,
} from '@/components/ui';
import { SourceBadge } from '../components/SourceBadge';
import { useJarvisDateStore } from '../stores/useJarvisDateStore';
import {
  useSmartiFootfall,
  useSmartiActiveCount,
  useSmartiAttendedUnattended,
  useSmartiDemographics,
  useSmartiEmotions,
  useSmartiCustomerTransitions,
  useSmartiDeptAnalytics,
  useSmartiFirstZoneVisit,
  useSmartiDeptDwellTime,
  useSmartiCameraHeatmaps,
} from '../api/smartiQueries';
import { TransitionHeatmap } from '../components/TransitionHeatmap';
import { ChordDiagram } from '../components/ChordDiagram';
import { CameraHeatmapGrid } from '../components/CameraHeatmapGrid';

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toLocaleString();
}

type FlowView = 'chord' | 'table';
type FirstStopView = 'chart' | 'table';
type DwellView = 'chart' | 'table';

const DWELL_BIN_COLORS = ['#c7d2fe', '#a5b4fc', '#818cf8', '#6366f1', '#4f46e5', '#3730a3'];

interface WalkInTabProps {
  startDateOverride?: string;
  endDateOverride?: string;
}

export function WalkInTab({ startDateOverride, endDateOverride }: WalkInTabProps = {}): React.ReactNode {
  const [flowView, setFlowView] = useState<FlowView>('chord');
  const [firstStopView, setFirstStopView] = useState<FirstStopView>('chart');
  const [dwellDeptView, setDwellDeptView] = useState<DwellView>('chart');
  const [dwellOverallView, setDwellOverallView] = useState<DwellView>('chart');
  const storeDate = useJarvisDateStore((s) => s.dateRange);
  const startDate = startDateOverride ?? storeDate.startDate;
  const endDate = endDateOverride ?? storeDate.endDate;

  const footfall = useSmartiFootfall(startDate, endDate);
  const activeCount = useSmartiActiveCount();
  const attendedUnattended = useSmartiAttendedUnattended(startDate, endDate);
  const demographics = useSmartiDemographics(startDate, endDate);
  const emotions = useSmartiEmotions(startDate, endDate);
  const customerTransitions = useSmartiCustomerTransitions(startDate, endDate);
  const deptAnalytics = useSmartiDeptAnalytics(startDate, endDate);
  const firstZoneVisit = useSmartiFirstZoneVisit(startDate, endDate);
  const deptDwellTime = useSmartiDeptDwellTime(startDate, endDate);
  const cameraHeatmaps = useSmartiCameraHeatmaps(startDate, endDate);

  // Compute footfall totals
  const footfallData: FootfallEntry[] = footfall.data?.data ?? [];
  const totalEntries = footfallData.reduce((sum: number, f: FootfallEntry) => sum + f.customerEntries, 0);
  const totalExits = footfallData.reduce((sum: number, f: FootfallEntry) => sum + f.customerExits, 0);
  const totalStaffEntries = footfallData.reduce((sum: number, f: FootfallEntry) => sum + f.staffEntries, 0);

  // Active count
  const activeCustomers = activeCount.data?.data?.activeCustomers ?? 0;
  const activeStaff = activeCount.data?.data?.activeStaff ?? 0;
  const ratio = activeStaff > 0 ? `1:${Math.round(activeCustomers / activeStaff)}` : '--';

  // Attended/unattended totals
  const auData: AttendedUnattendedEntry[] = attendedUnattended.data?.data ?? [];
  const totalAttended = auData.reduce((sum: number, a: AttendedUnattendedEntry) => sum + a.attended, 0);
  const totalUnattended = auData.reduce((sum: number, a: AttendedUnattendedEntry) => sum + a.unattended, 0);
  const totalInteractions = totalAttended + totalUnattended;
  const attendedRate = totalInteractions > 0 ? Math.round((totalAttended / totalInteractions) * 100) : 0;

  // Peak footfall hour
  const peakEntry = footfallData.reduce<{ time: string; count: number }>(
    (best, f) => f.customerEntries > best.count ? { time: f.time, count: f.customerEntries } : best,
    { time: '--', count: 0 },
  );

  const isSingleDay = startDate === endDate;

  const dwellDepts = deptDwellTime.data?.departments ?? [];
  const firstDept = dwellDepts[0];
  const dwellBinKeys = firstDept ? Object.keys(firstDept.bins) : [];
  const overallDwellBins = dwellBinKeys.map((key) => ({
    label: key,
    count: dwellDepts.reduce((sum, d) => sum + (d.bins[key] ?? 0), 0),
  }));
  const overallDwellTotal = overallDwellBins.reduce((s, b) => s + b.count, 0);

  const isLoading = footfall.isLoading || activeCount.isLoading;

  return (
    <div className="space-y-4">
      <SectionHeader title="Walk-in Journey" subtitle="Customer entry, greeting, and initial engagement — powered by Smarti CCTV" />

      {/* Walk-in Metrics */}
      <MetricGrid columns={3}>
        <MetricCard
          label="Total Walk-ins"
          value={isLoading ? '...' : formatNumber(totalEntries)}
          badge={<SourceBadge source="cctv" />}
          icon={Users}
        />
        <MetricCard
          label="Total Exits"
          value={isLoading ? '...' : formatNumber(totalExits)}
          badge={<SourceBadge source="cctv" />}
          icon={TrendingDown}
        />
        <MetricCard
          label="Staff Entries"
          value={isLoading ? '...' : formatNumber(totalStaffEntries)}
          badge={<SourceBadge source="cctv" />}
          icon={UserCheck}
        />
        <MetricCard
          label="Customer:Staff (Live)"
          value={activeCount.isLoading ? '...' : ratio}
          subtitle={`${activeCustomers} customers · ${activeStaff} staff`}
          badge={<SourceBadge source="cctv" />}
          status={activeCustomers / Math.max(activeStaff, 1) > 10 ? 'critical' : activeCustomers / Math.max(activeStaff, 1) > 6 ? 'warning' : 'on-track'}
          icon={Activity}
        />
        <MetricCard
          label="Staff Interaction Rate"
          value={attendedUnattended.isLoading ? '...' : `${attendedRate}%`}
          subtitle={`${totalAttended} attended / ${totalInteractions} total`}
          badge={<SourceBadge source="cctv" />}
          status={attendedRate < 20 ? 'critical' : attendedRate < 50 ? 'warning' : 'on-track'}
          icon={Eye}
        />
        <MetricCard
          label="Peak Footfall"
          value={isLoading ? '...' : `${peakEntry.count}`}
          subtitle={peakEntry.time !== '--' ? `at ${formatTime(peakEntry.time)}` : undefined}
          badge={<SourceBadge source="cctv" />}
          icon={Clock}
        />
      </MetricGrid>

      {/* Floor Traffic Analysis */}
      <div>
        <SectionHeader
          title="Floor Traffic Analysis"
          subtitle="Visitor traffic and staffing by department"
          actions={
            <Badge variant="outline" size="sm">
              {deptAnalytics.data?.departments?.length ?? 0} departments
            </Badge>
          }
        />
        <Card>
          <CardContent className="p-0">
            {deptAnalytics.isLoading ? (
              <div className="p-4 text-center text-sm text-gray-500">Loading departments...</div>
            ) : deptAnalytics.error ? (
              <EmptyState title="Failed to load" description={deptAnalytics.error.message} />
            ) : (deptAnalytics.data?.departments?.length ?? 0) === 0 ? (
              <EmptyState title="No department data" description="No department analytics available for this date range" />
            ) : (
              <DataTable minWidth="500px">
                <DataTableHeader>
                  <DataTableHead>Department</DataTableHead>
                  <DataTableHead align="right">Total Unique Visitors</DataTableHead>
                  <DataTableHead align="right">Total Visits</DataTableHead>
                  <DataTableHead align="right">Employee Count</DataTableHead>
                </DataTableHeader>
                <DataTableBody>
                  {(deptAnalytics.data?.departments ?? []).map((dept: DeptAnalyticsEntry) => (
                    <DataTableRow key={dept.departmentId}>
                      <DataTableCell className="font-medium text-xs">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3 h-3 text-gray-400 shrink-0" />
                          {dept.name}
                        </div>
                      </DataTableCell>
                      <DataTableCell align="right" className="text-xs tabular-nums">{dept.visitorCount.toLocaleString()}</DataTableCell>
                      <DataTableCell align="right" className="text-xs tabular-nums">{dept.totalVisits.toLocaleString()}</DataTableCell>
                      <DataTableCell align="right" className="text-xs tabular-nums">{dept.employeeCount}</DataTableCell>
                    </DataTableRow>
                  ))}
                </DataTableBody>
              </DataTable>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dwell Time Analytics — 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Dwell Time By Department */}
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="p-4">
              {/* eslint-disable-next-line design-system/prefer-section-header -- card header with chart/table toggle */}
              <div className="flex items-center justify-between mb-3">
                <CardTitle className="text-sm">Dwell Time By Department</CardTitle>
                <div className="flex items-center gap-1 rounded-lg border border-gray-200 p-0.5">
                  <button
                    type="button"
                    className={`p-1.5 rounded-md transition-colors ${dwellDeptView === 'chart' ? 'bg-primary-100 text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
                    onClick={() => setDwellDeptView('chart')}
                    aria-label="Bar chart view"
                  >
                    <BarChart3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    className={`p-1.5 rounded-md transition-colors ${dwellDeptView === 'table' ? 'bg-primary-100 text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
                    onClick={() => setDwellDeptView('table')}
                    aria-label="Table view"
                  >
                    <Table2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {deptDwellTime.isLoading ? (
                <div className="py-8 text-center text-sm text-gray-500">Loading department dwell time...</div>
              ) : deptDwellTime.error ? (
                <EmptyState title="Failed to load" description={deptDwellTime.error.message} />
              ) : dwellDepts.length === 0 ? (
                <EmptyState title="No data" description="No department dwell time data for this period" />
              ) : dwellDeptView === 'chart' ? (
                <div className="space-y-3">
                  {/* Legend */}
                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                    {dwellBinKeys.map((bin, i) => (
                      <div key={bin} className="flex items-center gap-1 text-[10px] text-gray-500">
                        {/* eslint-disable-next-line no-restricted-syntax -- dynamic bin color */}
                        <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: DWELL_BIN_COLORS[i] ?? '#e5e7eb' }} />
                        {bin}
                      </div>
                    ))}
                  </div>
                  {/* Horizontal stacked bars */}
                  <div className="space-y-2">
                    {dwellDepts.map((dept: DeptDwellTimeEntry) => {
                      const entries = Object.entries(dept.bins);
                      const deptTotal = entries.reduce((s, [, c]) => s + c, 0);
                      return (
                        <div key={dept.departmentId} className="flex items-center gap-2">
                          <span className="w-28 text-xs text-gray-700 truncate shrink-0" title={dept.name}>{dept.name}</span>
                          <div className="flex-1 flex h-5 rounded overflow-hidden bg-gray-100">
                            {entries.map(([bin, count], i) =>
                              count > 0 ? (
                                <div
                                  key={bin}
                                  className="transition-all hover:opacity-80"
                                  title={`${bin}: ${count}`}
                                  // eslint-disable-next-line no-restricted-syntax -- dynamic width/color from dwell time data
                                  style={{ width: `${(count / Math.max(deptTotal, 1)) * 100}%`, backgroundColor: DWELL_BIN_COLORS[i] ?? '#e5e7eb' }}
                                />
                              ) : null,
                            )}
                          </div>
                          <span className="text-xs font-semibold text-gray-900 w-8 text-right tabular-nums shrink-0">{deptTotal}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <DataTable minWidth="600px">
                  <DataTableHeader>
                    <DataTableHead>Zone Name</DataTableHead>
                    {dwellBinKeys.map((bin) => (
                      <DataTableHead key={bin} align="right">{bin}</DataTableHead>
                    ))}
                    <DataTableHead align="right">Total</DataTableHead>
                  </DataTableHeader>
                  <DataTableBody>
                    {dwellDepts.map((dept: DeptDwellTimeEntry) => {
                      const deptTotal = Object.values(dept.bins).reduce((s, c) => s + c, 0);
                      return (
                        <DataTableRow key={dept.departmentId}>
                          <DataTableCell className="font-medium text-xs">{dept.name}</DataTableCell>
                          {Object.values(dept.bins).map((count, i) => (
                            <DataTableCell key={i} align="right" className="text-xs tabular-nums">{count}</DataTableCell>
                          ))}
                          <DataTableCell align="right" className="text-xs tabular-nums font-semibold">{deptTotal}</DataTableCell>
                        </DataTableRow>
                      );
                    })}
                  </DataTableBody>
                </DataTable>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Overall Dwell Time Distribution */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-4">
              {/* eslint-disable-next-line design-system/prefer-section-header -- card header with chart/table toggle */}
              <div className="flex items-center justify-between mb-3">
                <CardTitle className="text-sm">Overall Dwell Time Distribution</CardTitle>
                <div className="flex items-center gap-1 rounded-lg border border-gray-200 p-0.5">
                  <button
                    type="button"
                    className={`p-1.5 rounded-md transition-colors ${dwellOverallView === 'chart' ? 'bg-primary-100 text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
                    onClick={() => setDwellOverallView('chart')}
                    aria-label="Donut chart view"
                  >
                    <PieChart className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    className={`p-1.5 rounded-md transition-colors ${dwellOverallView === 'table' ? 'bg-primary-100 text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
                    onClick={() => setDwellOverallView('table')}
                    aria-label="Table view"
                  >
                    <Table2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {deptDwellTime.isLoading ? (
                <div className="py-8 text-center text-sm text-gray-500">Loading dwell time...</div>
              ) : deptDwellTime.error ? (
                <EmptyState title="Failed to load" description={deptDwellTime.error.message} />
              ) : overallDwellBins.length === 0 ? (
                <EmptyState title="No data" description="No dwell time data for this period" />
              ) : dwellOverallView === 'chart' ? (
                (() => {
                  const R = 60, CX = 80, CY = 80;
                  const CIRC = 2 * Math.PI * R;
                  let cumOffset = 0;
                  const segs = overallDwellBins.map((bin, i) => {
                    const dash = overallDwellTotal > 0 ? (bin.count / overallDwellTotal) * CIRC : 0;
                    const seg = { label: bin.label, count: bin.count, dash, offset: cumOffset, color: DWELL_BIN_COLORS[i] ?? '#e5e7eb' };
                    cumOffset += dash;
                    return seg;
                  });
                  return (
                    <div className="flex flex-col items-center py-4">
                      <svg viewBox="0 0 160 160" className="w-40 h-40">
                        <circle cx={CX} cy={CY} r={R} fill="none" stroke="#f3f4f6" strokeWidth="20" />
                        {segs.map((s) =>
                          s.dash > 0 ? (
                            <circle
                              key={s.label}
                              cx={CX}
                              cy={CY}
                              r={R}
                              fill="none"
                              stroke={s.color}
                              strokeWidth="20"
                              strokeDasharray={`${s.dash} ${CIRC - s.dash}`}
                              strokeDashoffset={-s.offset}
                              transform={`rotate(-90 ${CX} ${CY})`}
                            />
                          ) : null,
                        )}
                        <text x={CX} y={CY - 4} textAnchor="middle" fontSize="20" fontWeight="700" fill="#111827">
                          {overallDwellTotal}
                        </text>
                        <text x={CX} y={CY + 14} textAnchor="middle" fontSize="11" fill="#6b7280">
                          Total
                        </text>
                      </svg>
                      <div className="flex flex-wrap gap-x-4 gap-y-1.5 justify-center mt-3">
                        {overallDwellBins.map((bin, i) => (
                          <div key={bin.label} className="flex items-center gap-1.5 text-xs">
                            {/* eslint-disable-next-line no-restricted-syntax -- dynamic bin color */}
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: DWELL_BIN_COLORS[i] ?? '#e5e7eb' }} />
                            <span className="text-gray-600">{bin.label}</span>
                            <span className="font-semibold text-gray-900 tabular-nums">{bin.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()
              ) : (
                <DataTable>
                  <DataTableHeader>
                    <DataTableHead>Time Category</DataTableHead>
                    <DataTableHead align="right">Count</DataTableHead>
                  </DataTableHeader>
                  <DataTableBody>
                    {overallDwellBins.map((bin) => (
                      <DataTableRow key={bin.label}>
                        <DataTableCell className="text-xs">{bin.label}</DataTableCell>
                        <DataTableCell align="right" className="text-xs tabular-nums font-semibold">{bin.count}</DataTableCell>
                      </DataTableRow>
                    ))}
                  </DataTableBody>
                </DataTable>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Store HeatMap */}
      <div>
        <SectionHeader
          title="Store HeatMap"
          subtitle="Camera heatmap overlays from CCTV analytics"
          actions={
            <Badge variant="outline" size="sm">
              {cameraHeatmaps.data?.cameras.length ?? 0} cameras
            </Badge>
          }
        />
        <Card>
          <CardContent className="p-4">
            {cameraHeatmaps.isLoading ? (
              <div className="py-8 text-center text-sm text-gray-500">Loading camera heatmaps...</div>
            ) : cameraHeatmaps.error ? (
              <EmptyState title="Failed to load" description={cameraHeatmaps.error.message} />
            ) : (cameraHeatmaps.data?.cameras.length ?? 0) === 0 ? (
              <EmptyState title="No cameras" description="No camera data available" />
            ) : (
              <CameraHeatmapGrid cameras={cameraHeatmaps.data!.cameras} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Customer Flow Intelligence — First Stop + Journey (single-day only) */}
      <div>
        <SectionHeader
          title="Customer Flow Intelligence"
          subtitle="Zone-to-zone transition patterns from CCTV tracking"
          actions={
            !isSingleDay ? (
              <Badge variant="outline" size="sm">Single-day only</Badge>
            ) : customerTransitions.isLoading ? (
              <Badge variant="outline" size="sm">Loading...</Badge>
            ) : (
              <Badge variant="primary" size="sm">Live CCTV</Badge>
            )
          }
        />
        {!isSingleDay ? (
          <Card>
            <CardContent className="p-4">
              <EmptyState
                title="Single-day view required"
                description="Customer flow data is available for single-day selections only. Select &ldquo;Today&rdquo; to view zone-to-zone transitions."
              />
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* First Department Visit After Store Entry */}
            <Card>
              <CardContent className="p-4">
                {/* eslint-disable-next-line design-system/prefer-section-header -- inline card title with view toggle */}
                <div className="flex items-center justify-between mb-3">
                  <CardTitle className="text-sm">First Department Visit After Store Entry</CardTitle>
                  <div className="flex items-center gap-1 rounded-lg border border-gray-200 p-0.5">
                    <button
                      type="button"
                      className={`p-1.5 rounded-md transition-colors ${firstStopView === 'chart' ? 'bg-primary-100 text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
                      onClick={() => setFirstStopView('chart')}
                      aria-label="Bar chart view"
                    >
                      <BarChart3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      className={`p-1.5 rounded-md transition-colors ${firstStopView === 'table' ? 'bg-primary-100 text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
                      onClick={() => setFirstStopView('table')}
                      aria-label="Table view"
                    >
                      <Table2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {firstZoneVisit.isLoading ? (
                  <div className="py-8 text-center text-sm text-gray-500">Loading first-zone data...</div>
                ) : firstZoneVisit.error ? (
                  <EmptyState title="Failed to load" description={firstZoneVisit.error.message} />
                ) : (firstZoneVisit.data?.entries?.length ?? 0) === 0 ? (
                  <EmptyState title="No data" description="No first-zone visit data for this period" />
                ) : firstStopView === 'chart' ? (
                  (() => {
                    const sorted = (firstZoneVisit.data?.entries ?? [])
                      .slice()
                      .sort((a: FirstZoneVisitEntry, b: FirstZoneVisitEntry) => b.count - a.count);
                    const maxCount = sorted[0]?.count ?? 1;
                    const CHART_H = 320;
                    const step = Math.max(Math.ceil(maxCount / 7 / 3) * 3, 1);
                    const yMax = Math.ceil(maxCount / step) * step;
                    const tickCount = yMax / step;
                    const ticks = Array.from({ length: tickCount + 1 }, (_, i) => i * step);
                    return (
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 mb-4">
                          <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 shrink-0" />
                          <span className="text-xs text-gray-500">First Visits (After Store Entry + Threshold)</span>
                        </div>
                        <div className="flex">
                          {/* Y-axis ticks */}
                          <div
                            className="flex flex-col justify-between items-end pr-2 shrink-0 w-7"
                            // eslint-disable-next-line no-restricted-syntax -- dynamic chart height
                            style={{ height: `${CHART_H}px` }}
                          >
                            {ticks.slice().reverse().map((t) => (
                              <span key={t} className="text-[10px] text-gray-400 tabular-nums leading-none">{t}</span>
                            ))}
                          </div>
                          {/* Chart area */}
                          <div className="flex-1 relative border-l border-gray-200">
                            {/* Gridlines */}
                            {ticks.map((t) => (
                              <div
                                key={t}
                                className="absolute left-0 right-0 border-t border-dashed border-gray-100"
                                // eslint-disable-next-line no-restricted-syntax -- gridline position from data
                                style={{ bottom: `${(t / yMax) * CHART_H}px` }}
                              />
                            ))}
                            {/* Bars */}
                            <div
                              className="relative flex items-end justify-around px-3"
                              // eslint-disable-next-line no-restricted-syntax -- dynamic chart height
                              style={{ height: `${CHART_H}px` }}
                            >
                              {sorted.map((entry: FirstZoneVisitEntry) => {
                                const barH = yMax > 0 ? Math.max((entry.count / yMax) * CHART_H, 2) : 2;
                                return (
                                  <div
                                    key={entry.departmentId}
                                    className="w-10 bg-indigo-400 rounded-t hover:bg-indigo-500 transition-colors cursor-default"
                                    // eslint-disable-next-line no-restricted-syntax -- dynamic bar height from data
                                    style={{ height: `${barH}px` }}
                                    title={`${entry.name}: ${entry.count} visits`}
                                  />
                                );
                              })}
                            </div>
                          </div>
                        </div>
                        {/* X-axis labels */}
                        <div className="flex justify-around pl-7 px-3 mt-0 border-t border-gray-200 pt-1.5">
                          {sorted.map((entry: FirstZoneVisitEntry) => (
                            <div key={entry.departmentId} className="w-10 text-center">
                              <span className="text-[10px] text-gray-500 leading-tight line-clamp-2">{entry.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div className="space-y-2">
                    {(firstZoneVisit.data?.entries ?? [])
                      .sort((a: FirstZoneVisitEntry, b: FirstZoneVisitEntry) => b.count - a.count)
                      .map((entry: FirstZoneVisitEntry) => (
                        <div key={entry.departmentId} className="flex items-center gap-3 text-xs">
                          <span className="w-40 text-gray-700 truncate">{entry.name}</span>
                          <div className="flex-1 bg-gray-100 rounded-full h-2">
                            <div
                              className="h-2 rounded-full bg-indigo-500 transition-all"
                              // eslint-disable-next-line no-restricted-syntax -- dynamic width from API percentage
                              style={{ width: `${Math.min(entry.percentage, 100)}%` }}
                            />
                          </div>
                          <span className="font-semibold text-gray-900 w-14 text-right tabular-nums">
                            {entry.count}
                          </span>
                          <span className="text-gray-500 w-10 text-right tabular-nums">
                            {entry.percentage}%
                          </span>
                        </div>
                      ))}
                    <div className="pt-2 border-t border-gray-100 flex justify-between text-xs text-gray-500">
                      <span>Total first visits</span>
                      <span className="font-semibold text-gray-900 tabular-nums">
                        {firstZoneVisit.data?.total ?? 0}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Customer Journey */}
            <Card>
              <CardContent className="p-4">
                {/* eslint-disable-next-line design-system/prefer-section-header -- inline card title with view toggle */}
                <div className="flex items-center justify-between mb-3">
                  <CardTitle className="text-sm">Customer Journey</CardTitle>
                  <div className="flex items-center gap-1 rounded-lg border border-gray-200 p-0.5">
                    <button
                      type="button"
                      className={`p-1.5 rounded-md transition-colors ${flowView === 'chord' ? 'bg-primary-100 text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
                      onClick={() => setFlowView('chord')}
                      aria-label="Chord diagram view"
                    >
                      <GitGraph className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      className={`p-1.5 rounded-md transition-colors ${flowView === 'table' ? 'bg-primary-100 text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
                      onClick={() => setFlowView('table')}
                      aria-label="Table view"
                    >
                      <Table2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {customerTransitions.isLoading ? (
                  <div className="py-8 text-center text-sm text-gray-500">Loading transition data...</div>
                ) : customerTransitions.error ? (
                  <EmptyState title="Failed to load" description={customerTransitions.error.message} />
                ) : !customerTransitions.data ? (
                  <EmptyState title="No data" description="No transition data available" />
                ) : flowView === 'chord' ? (
                  <ChordDiagram
                    clusters={customerTransitions.data.clusters}
                    edges={customerTransitions.data.edges}
                  />
                ) : (
                  <TransitionHeatmap
                    clusters={customerTransitions.data.clusters}
                    edges={customerTransitions.data.edges}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Demographics + Emotions — side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Demographics */}
        <div>
          <SectionHeader title="Customer Demographics" subtitle="Gender and age group distribution" />
          <Card>
            <CardContent className="p-4">
              {demographics.isLoading ? (
                <p className="text-sm text-gray-500 text-center">Loading demographics...</p>
              ) : !demographics.data?.data ? (
                <EmptyState title="No data" description="No demographic data available" />
              ) : (
                <div className="space-y-4">
                  {/* Gender */}
                  <div>
                    <CardTitle className="text-xs text-gray-500 mb-2">Gender</CardTitle>
                    <div className="space-y-2">
                      {(Object.entries(demographics.data.data.gender) as [string, number][]).map(([gender, pct]) => (
                        <div key={gender} className="flex items-center gap-3 text-xs">
                          <span className="w-16 text-gray-600 capitalize">{gender}</span>
                          <div className="flex-1 bg-gray-100 rounded-full h-2">
                            <div
                              className="h-2 rounded-full bg-indigo-500 transition-all"
                              // eslint-disable-next-line no-restricted-syntax -- dynamic width from API percentage
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="font-semibold text-gray-900 w-12 text-right tabular-nums">{pct.toFixed(1)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Age Groups */}
                  <div className="border-t border-gray-100 pt-3">
                    <CardTitle className="text-xs text-gray-500 mb-2">Age Groups</CardTitle>
                    <div className="space-y-2">
                      {(Object.entries(demographics.data.data.ageGroup) as [string, number][]).map(([group, pct]) => (
                        <div key={group} className="flex items-center gap-3 text-xs">
                          <span className="w-24 text-gray-600 capitalize">{group.replace(/([A-Z])/g, ' $1').trim()}</span>
                          <div className="flex-1 bg-gray-100 rounded-full h-2">
                            <div
                              className="h-2 rounded-full bg-indigo-400 transition-all"
                              // eslint-disable-next-line no-restricted-syntax -- dynamic width from API percentage
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                          <span className="font-semibold text-gray-900 w-12 text-right tabular-nums">{pct.toFixed(1)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Emotions */}
        <div>
          <SectionHeader
            title="Customer Emotion Analysis"
            subtitle="Overall sentiment from CCTV and audio analysis"
            actions={<SourceBadge source="audio" />}
          />
          <Card>
            <CardContent className="p-4">
              {emotions.isLoading ? (
                <p className="text-sm text-gray-500 text-center">Loading emotions...</p>
              ) : !emotions.data?.data ? (
                <EmptyState title="No data" description="No emotion data available" />
              ) : (
                <div className="space-y-4">
                  {/* Overall */}
                  <div>
                    <CardTitle className="text-xs text-gray-500 mb-2">Overall Sentiment</CardTitle>
                    <div className="space-y-2">
                      {[
                        { label: 'Neutral', value: emotions.data.data.overall.neutral, color: 'bg-gray-400' },
                        { label: 'Positive', value: emotions.data.data.overall.positive, color: 'bg-green-500' },
                        { label: 'Negative', value: emotions.data.data.overall.negative, color: 'bg-red-500' },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center gap-3 text-xs">
                          <span className="w-16 text-gray-600">{item.label}</span>
                          <div className="flex-1 bg-gray-100 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${item.color} transition-all`}
                              // eslint-disable-next-line no-restricted-syntax -- dynamic width from API percentage
                              style={{ width: `${item.value}%` }}
                            />
                          </div>
                          <span className="font-semibold text-gray-900 w-10 text-right tabular-nums">{item.value}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Hourly breakdown */}
                  {(emotions.data.data.hourly?.length ?? 0) > 0 && (
                    <div className="border-t border-gray-100 pt-3">
                      <CardTitle className="text-xs text-gray-500 mb-2">Hourly Breakdown</CardTitle>
                      <DataTable minWidth="350px">
                        <DataTableHeader>
                          <DataTableHead>Time</DataTableHead>
                          <DataTableHead align="right">Neutral</DataTableHead>
                          <DataTableHead align="right">Positive</DataTableHead>
                          <DataTableHead align="right">Negative</DataTableHead>
                        </DataTableHeader>
                        <DataTableBody>
                          {emotions.data.data.hourly.map((h: EmotionsEntry) => (
                            <DataTableRow key={h.time}>
                              <DataTableCell className="text-xs">{formatTime(h.time)}</DataTableCell>
                              <DataTableCell align="right" className="text-xs tabular-nums">{h.neutral}%</DataTableCell>
                              <DataTableCell align="right" className="text-xs tabular-nums text-green-600">{h.positive}%</DataTableCell>
                              <DataTableCell align="right" className="text-xs tabular-nums text-red-600">{h.negative}%</DataTableCell>
                            </DataTableRow>
                          ))}
                        </DataTableBody>
                      </DataTable>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
