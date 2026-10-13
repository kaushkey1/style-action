/* eslint-disable no-restricted-syntax, design-system/prefer-metric-grid, design-system/prefer-section-header */
import { useState, useMemo, useRef, useEffect, useCallback, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';

import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import {
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Store,
  ChevronRight,
  ChevronDown,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  LayoutGrid,
  MapPin,
  CheckCircle2,
  Clock,
  Target,
  Lock,
  FileCheck,
  CircleAlert,
  Layers,
  RefreshCw,
  CalendarDays,
  Archive,
  Sparkles,
  Send,
  Crown,
  Ruler,
  Palette,
  Wrench,
  Users,
  UserCircle,
  Map,
  Maximize2,
  Package,
  Truck,
  XCircle,
  Circle,
  Info,
  ExternalLink,
  ShoppingBag,
  Calculator,
  Bot,
  Eye,
  type LucideIcon,
} from 'lucide-react';
import {
  PageHeader,
  MetricCard,
  MetricGrid,
  SectionHeader,
  KpiLabel,
  Badge,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  FilterBar,
  FilterSelect,
  FilterPills,
  FilterSearch,
  PageSkeleton,
  EmptyState,
  DataTable,
  DataTableHeader,
  DataTableBody,
  DataTableRow,
  DataTableHead,
  DataTableCell,
  ConfirmDialog,
  Pagination,
  usePagination,
  NotionalBadge,
  Button,
  Modal,
  Tooltip as UITooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useSpacePlanningData } from '@/hooks/data/useSpacePlanningData';
import { useToast } from '@/hooks/useToast';
import type { StoreSpaceProfile, SpaceRecommendation, PulsePointTask, StoreSegmentData, SPSFTarget, FixtureRebalancingRec, MovementTier, NSOStore, StoreSpaceChange, SpaceChangeType, RAFeedback, TacticalReallocation, GeneratedScenarioResult, FixturePlanogramScore } from '@/data/mockSpacePlanning';
import { getStorePlanningContext, getNetworkSegmentAggregates, networkSpaceMetricsData, formatPlEbSplits, formatFohBohSplits, getAopRecoveryAdvice, storeManagerMap, getSegmentFixtureAssignments, computeRAFixtureDemand, generateStoreFixtures, getStockingDensity, matchScenarioTemplate, getStorePlanogramCompliance, seedPulsePointTasks, getStoreSegmentTrend } from '@/data/mockSpacePlanning'; // mock-ok — computation helpers
import { getCompetitorsForStore, competitiveGapScores, catchmentProfiles } from '@/modules/store-view/data/mockStoreIntelligence'; // mock-ok — reused for NSO site intel
import { cn } from '@/lib/utils';
import 'leaflet/dist/leaflet.css';

// ─── Helper: SPSF status ─────────────────────────────────────────────────────

function getSpsfStatus(spsf: number, gradeAvg: number, floor: number): 'green' | 'amber' | 'red' {
  if (spsf >= gradeAvg) return 'green';
  if (spsf >= floor) return 'amber';
  return 'red';
}

function statusBadge(status: 'green' | 'amber' | 'red') {
  const map = { green: { variant: 'success' as const, label: 'On Target' }, amber: { variant: 'warning' as const, label: 'Below Target' }, red: { variant: 'error' as const, label: 'Below Min. Threshold' } };
  return map[status];
}

function planStatusBadge(status: string) {
  if (status === 'active') return { variant: 'success' as const, label: 'Active', icon: CheckCircle2 };
  if (status === 'locked') return { variant: 'success' as const, label: 'Locked', icon: Lock };
  if (status === 'under-review') return { variant: 'default' as const, label: 'Under Review', icon: FileCheck };
  if (status === 'superseded') return { variant: 'outline' as const, label: 'Superseded', icon: Archive };
  return { variant: 'outline' as const, label: 'Draft', icon: Clock };
}

function rebalancingStatusBadge(status: FixtureRebalancingRec['status']): { variant: 'default' | 'success' | 'warning' | 'error' | 'outline'; label: string } {
  const map: Record<FixtureRebalancingRec['status'], { variant: 'default' | 'success' | 'warning' | 'error' | 'outline'; label: string }> = {
    'recommended': { variant: 'default', label: 'Recommended' },
    'accepted': { variant: 'success', label: 'Accepted' },
    'queued-for-ra': { variant: 'warning', label: 'Queued for RA' },
    'in-ra-cycle': { variant: 'warning', label: 'In RA Cycle' },
    'pending-execution': { variant: 'outline', label: 'Pending Execution' },
    'executed': { variant: 'success', label: 'Executed' },
    'rejected': { variant: 'error', label: 'Rejected' },
  };
  return map[status];
}

function transferStatusBadge(status: string): { variant: 'default' | 'success' | 'warning' | 'error' | 'info' | 'outline'; label: string } {
  switch (status) {
    case 'raised': return { variant: 'outline', label: 'Raised' };
    case 'dispatched': return { variant: 'info', label: 'Dispatched' };
    case 'in-transit': return { variant: 'warning', label: 'In Transit' };
    case 'inwarded': return { variant: 'default', label: 'Inwarded' };
    case 'completed': return { variant: 'success', label: 'Completed' };
    default: return { variant: 'outline', label: status };
  }
}

function conversionStatusBadge(status: string): { variant: 'default' | 'success' | 'warning' | 'error' | 'info' | 'outline'; label: string } {
  switch (status) {
    case 'recommended': return { variant: 'default', label: 'Recommended' };
    case 'approved': return { variant: 'success', label: 'Approved' };
    case 'in-progress': return { variant: 'info', label: 'In Progress' };
    case 'completed': return { variant: 'success', label: 'Completed' };
    case 'rejected': return { variant: 'error', label: 'Rejected' };
    default: return { variant: 'outline', label: status };
  }
}

function scenarioStatusBadge(status: string) {
  switch (status) {
    case 'draft': return { variant: 'outline' as const, label: 'Draft' };
    case 'simulated': return { variant: 'info' as const, label: 'Simulated' };
    case 'approved': return { variant: 'success' as const, label: 'Approved' };
    case 'testing': return { variant: 'warning' as const, label: 'Testing' };
    case 'rolled-out': return { variant: 'success' as const, label: 'Rolled Out' };
    default: return { variant: 'outline' as const, label: status };
  }
}

function abTestStatusBadge(status: string) {
  switch (status) {
    case 'designing': return { variant: 'outline' as const, label: 'Designing' };
    case 'active': return { variant: 'warning' as const, label: 'Active' };
    case 'completed': return { variant: 'success' as const, label: 'Completed' };
    default: return { variant: 'outline' as const, label: status };
  }
}

// ─── Persona Configuration ────────────────────────────────────────────────────

type PersonaId = 'ceo' | 'space-planner' | 'visual-merchandiser' | 'store-ops' | 'cluster-manager' | 'store-manager' | 'state-head' | 'buyer' | 'planner';

interface PersonaTab {
  value: string;
  label: string;
}

interface PersonaConfig {
  id: PersonaId;
  label: string;
  icon: LucideIcon;
  subtitle: string;
  tabs: PersonaTab[];
  defaultTab: string;
}

const PERSONAS: PersonaConfig[] = [
  {
    id: 'ceo',
    label: 'CEO',
    icon: Crown,
    subtitle: 'Strategic network overview — format performance, alerts & approvals',
    tabs: [
      { value: 'format-view', label: 'Format View' },
      { value: 'alerts-recs', label: 'Alerts & Recommendations' },
      { value: 'fixture-rebalancing', label: 'Fixture Rebalancing' },
    ],
    defaultTab: 'format-view',
  },
  {
    id: 'space-planner',
    label: 'Space Planner',
    icon: Ruler,
    subtitle: 'Operational planning — store diagnostics, space simulation & prescriptions',
    tabs: [
      { value: 'store-planner', label: 'Store Planner' },
      // Future tabs — will be enabled in upcoming sprints:
      // { value: 'agentic-space', label: 'Agentic Command' },
      // { value: 'format-pulse', label: 'Format Pulse' },
      // { value: 'space-simulation', label: 'Space Simulation' },
      // { value: 'fixture-rebalancing', label: 'Fixture Rebalancing' },
      // { value: 'fixture-transfers', label: 'Fixture Transfers' },
      // { value: 'nso-tracker', label: 'Store Projects' },
      // { value: 'scenarios', label: 'Scenarios' },
      // { value: 'impact-analytics', label: 'Impact Analytics' },
      // { value: 'ra-feedback', label: 'RA Feedback' },
    ],
    defaultTab: 'store-planner',
  },
  {
    id: 'visual-merchandiser',
    label: 'Visual Merchandiser',
    icon: Palette,
    subtitle: 'Fixture optimization — layout planning & planogram compliance',
    tabs: [
      { value: 'fixture-layout', label: 'Fixture Layout' },
      { value: 'planogram-compliance', label: 'Planogram Compliance' },
    ],
    defaultTab: 'fixture-layout',
  },
  {
    id: 'store-ops',
    label: 'Store Operations',
    icon: Wrench,
    subtitle: 'Execution tracking — task status, compliance & implementation health',
    tabs: [
      { value: 'store-health', label: 'Store Health' },
      { value: 'task-tracker', label: 'Task Tracker' },
    ],
    defaultTab: 'store-health',
  },
  {
    id: 'cluster-manager',
    label: 'Cluster Manager',
    icon: Users,
    subtitle: 'Multi-store oversight — cluster comparison & underperformer identification',
    tabs: [
      { value: 'cluster-overview', label: 'Cluster Overview' },
      { value: 'store-comparison', label: 'Store Comparison' },
    ],
    defaultTab: 'cluster-overview',
  },
  {
    id: 'store-manager',
    label: 'Store Manager',
    icon: UserCircle,
    subtitle: 'My store — current plan, accepted recommendations & pending actions',
    tabs: [
      { value: 'my-store', label: 'My Store' },
      { value: 'action-items', label: 'Action Items' },
    ],
    defaultTab: 'my-store',
  },
  {
    id: 'state-head',
    label: 'State Head',
    icon: Map,
    subtitle: 'State-level performance — zone rollup, city clusters & format mix',
    tabs: [
      { value: 'state-overview', label: 'State Overview' },
      { value: 'city-drilldown', label: 'City Drilldown' },
    ],
    defaultTab: 'state-overview',
  },
  {
    id: 'buyer',
    label: 'Buyer',
    icon: ShoppingBag,
    subtitle: 'Range-to-space mapping — see how range selections translate to fixture allocation & GMetri 3D',
    tabs: [
      { value: 'ra-space-mapping', label: 'Range → Space' },
      { value: 'fixture-rebalancing', label: 'Fixture Allocation' },
      { value: 'ra-feedback', label: 'RA Feedback' },
    ],
    defaultTab: 'ra-space-mapping',
  },
  {
    id: 'planner',
    label: 'Planner',
    icon: Calculator,
    subtitle: 'AOP-driven space planning — target-to-space cascade & scenario analysis',
    tabs: [
      { value: 'format-pulse', label: 'Format Pulse' },
      { value: 'space-simulation', label: 'Space Simulation' },
      { value: 'scenarios', label: 'Scenarios' },
      { value: 'impact-analytics', label: 'Impact Analytics' },
    ],
    defaultTab: 'format-pulse',
  },
];

function getPersona(id: PersonaId): PersonaConfig {
  return PERSONAS.find(p => p.id === id)!;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function SpacePlanningPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { data, loading } = useSpacePlanningData();
  const [activePersona, setActivePersona] = useState<PersonaId>('space-planner');
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [acceptedRecs, setAcceptedRecs] = useState<Set<string>>(new Set());
  const [pulsePointTasks, setPulsePointTasks] = useState<PulsePointTask[]>(seedPulsePointTasks);
  const [selectedFormat, setSelectedFormat] = useState<string>('all');
  const [selectedCluster, setSelectedCluster] = useState<string>('all');
  const [showBelowFloorStores, setShowBelowFloorStores] = useState(false);
  const [showPendingRecs, setShowPendingRecs] = useState(false);
  const [rebalancingActions, setRebalancingActions] = useState<Record<string, 'accepted' | 'rejected'>>({});
  const [raFeedbackActions, setRaFeedbackActions] = useState<Record<string, 'acknowledged' | 'resolved'>>({});
  const [selectedRebalancing, setSelectedRebalancing] = useState<Set<string>>(new Set());
  const [expandedTier, setExpandedTier] = useState<MovementTier | null>(null);
  const [expandedConvGroup, setExpandedConvGroup] = useState<string | null>(null);
  const [expandedAlertGrade, setExpandedAlertGrade] = useState<string | null>(null);
  const [expandedRecsGrade, setExpandedRecsGrade] = useState<string | null>(null);
  const [expandedNSOId, setExpandedNSOId] = useState<string | null>(null);
  const [compareScenarios, setCompareScenarios] = useState<string[]>([]);
  const [scenarioInput, setScenarioInput] = useState('');
  const [scenarioGenerating, setScenarioGenerating] = useState(false);
  const [generatedScenario, setGeneratedScenario] = useState<GeneratedScenarioResult | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [spActiveTab, setSpActiveTab] = useState<string | null>(null);
  const [storeGenModal, setStoreGenModal] = useState<{ open: boolean; storeName?: string; context?: string }>({ open: false });

  // Listen for StoreGen open events from child components
  const handleStoreGenEvent = useCallback((e: Event) => {
    const detail = (e as CustomEvent).detail as { storeName?: string; context?: string };
    setStoreGenModal({ open: true, storeName: detail.storeName, context: detail.context });
  }, []);
  useEffect(() => {
    window.addEventListener('open-storegen', handleStoreGenEvent);
    return () => window.removeEventListener('open-storegen', handleStoreGenEvent);
  }, [handleStoreGenEvent]);

  const belowThresholdRef = useRef<HTMLDivElement>(null);
  const pendingRecsRef = useRef<HTMLDivElement>(null);

  const persona = getPersona(activePersona);

  // ── Available formats ──
  const availableFormats = useMemo(() => {
    if (!data) return [];
    const formats = [...new Set(data.storeSpaceProfiles.map(p => p.format))].sort();
    return formats;
  }, [data]);

  // ── All store rows (unfiltered — used for cross-format views) ──
  const allStoreRows = useMemo(() => {
    if (!data) return [];
    return data.storeSpaceProfiles.map((profile) => {
      const spsfTarget = data.spsfTargets.find((t) => t.grade === profile.grade);
      const spsfStatus = spsfTarget ? getSpsfStatus(profile.spsf, spsfTarget.current, spsfTarget.floor) : 'amber';
      const spsfGap = spsfTarget ? Math.round(((profile.spsf - spsfTarget.target) / spsfTarget.target) * 100) : 0;
      const pendingRecs = data.spaceRecommendations.filter((r) => r.storeId === profile.storeId).length;
      const aopGapPct = profile.aopTargetCr > 0 ? Math.round(((profile.aopRunRateCr - profile.aopTargetCr) / profile.aopTargetCr) * 100) : 0;
      return { ...profile, spsfStatus, spsfGap, spsfTarget: spsfTarget?.target ?? 0, pendingRecs, aopGapPct };
    });
  }, [data]);

  // ── Computed store rows (filtered by format) ──
  const storeRows = useMemo(() => {
    if (selectedFormat === 'all') return allStoreRows;
    return allStoreRows.filter(r => r.format === selectedFormat);
  }, [allStoreRows, selectedFormat]);

  // ── Format-filtered metrics ──
  const metrics = useMemo(() => {
    if (!data) return null;
    const profiles = selectedFormat === 'all'
      ? data.storeSpaceProfiles
      : data.storeSpaceProfiles.filter(p => p.format === selectedFormat);
    if (profiles.length === 0) return { avgSpsf: 0, avgGmrof: 0, avgUtil: 0, belowFloor: 0, actionNeeded: 0, totalRecs: 0 };
    const avgSpsf = Math.round(profiles.reduce((s, p) => s + p.spsf, 0) / profiles.length);
    const avgGmrof = Math.round(profiles.reduce((s, p) => s + p.gmrof, 0) / profiles.length);
    const avgUtil = Math.round((profiles.reduce((s, p) => s + p.fixtureUtilization, 0) / profiles.length) * 10) / 10;
    const filteredRecs = selectedFormat === 'all'
      ? data.spaceRecommendations
      : data.spaceRecommendations.filter(r => profiles.some(p => p.storeId === r.storeId));
    const belowFloor = storeRows.filter((r) => r.spsfStatus === 'red').length;
    const actionNeeded = storeRows.filter((r) => r.spsfStatus !== 'green').length;
    const totalRecs = filteredRecs.length;
    return { avgSpsf, avgGmrof, avgUtil, belowFloor, actionNeeded, totalRecs };
  }, [data, storeRows, selectedFormat]);

  // ── Selected store detail ──
  const selectedStore = useMemo(() => {
    if (!selectedStoreId || !data) return null;
    const profile = data.storeSpaceProfiles.find((p) => p.storeId === selectedStoreId);
    const segments = data.storeSegmentAllocations.find((s) => s.storeId === selectedStoreId)?.segments ?? [];
    const recs = data.spaceRecommendations.filter((r) => r.storeId === selectedStoreId);
    const fashionSplits = data.storeFashionSplits[selectedStoreId] ?? [];
    const row = storeRows.find((r) => r.storeId === selectedStoreId);
    const benchmarks = data.gradeSegmentBenchmarks.filter((b) => b.grade === profile?.grade);
    const diagnostics = data.storeDiagnostics.find((d) => d.storeId === selectedStoreId);
    const spsfTarget = data.spsfTargets.find((t) => t.grade === profile?.grade);
    if (!profile || !row) return null;
    return { profile, segments, recs, fashionSplits, row, benchmarks, diagnostics, spsfTarget };
  }, [selectedStoreId, data, storeRows]);

  if (loading) return <PageSkeleton />;
  if (!data || !metrics) return null;

  // ── Fixture rebalancing metrics ──
  const rebalancingRecs = data.fixtureRebalancingRecs;
  const pendingRebalancingCount = rebalancingRecs.filter(r => r.status === 'recommended').length;
  const totalGmrofImpact = rebalancingRecs.reduce((sum, r) => sum + r.gmrofImpact, 0);
  const totalTransportCost = rebalancingRecs.reduce((sum, r) => sum + r.transportCostLakhs, 0);
  const uniqueStores = new Set([...rebalancingRecs.map(r => r.sourceStoreId), ...rebalancingRecs.map(r => r.targetStoreId)]).size;

  function handleSelectStore(storeId: string) {
    setSelectedStoreId(storeId);
    setAcceptedRecs(new Set());
  }

  function toggleRec(recId: string) {
    setAcceptedRecs((prev) => {
      const next = new Set(prev);
      if (next.has(recId)) next.delete(recId);
      else next.add(recId);
      return next;
    });
  }

  function handleExecuteRec(rec: SpaceRecommendation) {
    const storeProfile = data?.storeSpaceProfiles.find(p => p.storeId === rec.storeId);
    const task: PulsePointTask = {
      id: `pp-${rec.id}-${Date.now()}`,
      recId: rec.id,
      storeId: rec.storeId,
      storeName: rec.storeName,
      format: storeProfile?.format ?? 'Trends',
      title: rec.title,
      description: `${rec.segment}: ${rec.currentSpacePct}% → ${rec.recommendedSpacePct}% (${rec.currentSft.toLocaleString()} → ${rec.newSft.toLocaleString()} Sq. Ft.)`,
      segment: rec.segment,
      segmentCode: rec.segmentCode,
      status: 'pushed',
      assignee: storeManagerMap[rec.storeId] ?? 'Store Manager',
      createdAt: new Date().toISOString(),
    };
    setPulsePointTasks(prev => [...prev, task]);
  }

  function handleExecuteAll(recs: SpaceRecommendation[]) {
    const ts = Date.now();
    const newTasks = recs.map((rec, i) => {
      const storeProfile = data?.storeSpaceProfiles.find(p => p.storeId === rec.storeId);
      return {
        id: `pp-${rec.id}-${ts + i}`,
        recId: rec.id,
        storeId: rec.storeId,
        storeName: rec.storeName,
        format: storeProfile?.format ?? 'Trends',
        title: rec.title,
        description: `${rec.segment}: ${rec.currentSpacePct}% → ${rec.recommendedSpacePct}% (${rec.currentSft.toLocaleString()} → ${rec.newSft.toLocaleString()} Sq. Ft.)`,
        segment: rec.segment,
        segmentCode: rec.segmentCode,
        status: 'pushed' as const,
        assignee: storeManagerMap[rec.storeId] ?? 'Store Manager',
        createdAt: new Date().toISOString(),
      };
    });
    setPulsePointTasks(prev => [...prev, ...newTasks]);
  }

  // Compute persona default tab (override when store is selected for space-planner)
  const personaDefaultTab = activePersona === 'space-planner' && selectedStoreId
    ? 'store-planner'
    : persona.defaultTab;

  return (
    <div className="space-y-4 animate-fadeInUp">
      <PageHeader
        title={persona.tabs.length === 1 ? `Space Planning — ${persona.tabs[0]!.label}` : 'Space Planning'}
      />

      <Tabs defaultValue={personaDefaultTab} value={selectedStoreId && persona.tabs.some(t => t.value === 'store-planner') ? 'store-planner' : spActiveTab ?? undefined} onValueChange={(v) => setSpActiveTab(v)} key={activePersona}>
        {persona.tabs.length > 1 && (
          <TabsList variant="underline">
            {persona.tabs.map(tab => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                onClick={() => {
                  if (tab.value === 'format-pulse' || tab.value === 'format-view') setSelectedStoreId(null);
                }}
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* CEO: FORMAT VIEW (same as Format Pulse with format filters)      */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="format-view">
          <FilterBar>
            <FilterPills
              value={selectedFormat}
              onChange={setSelectedFormat}
              options={[
                { value: 'all', label: 'All Formats', count: data.storeSpaceProfiles.length },
                ...availableFormats.map(fmt => ({
                  value: fmt,
                  label: fmt,
                  count: data.storeSpaceProfiles.filter(p => p.format === fmt).length,
                })),
              ]}
            />
          </FilterBar>
          <div className="space-y-6">
            <MetricGrid>
              <MetricCard
                label={<>{selectedFormat === 'all' ? 'Network' : selectedFormat} Avg <KpiLabel abbr="SPSF" /></>}
                value={`Rs ${metrics.avgSpsf}`}
                icon={TrendingUp}
                iconColor="info"
                subtitle={selectedFormat === 'all' ? `FY27 Plan: Rs ${networkSpaceMetricsData.lflSpsf.fy27Plan} (+${networkSpaceMetricsData.lflSpsf.growthPct}%)` : `${storeRows.length} stores in format`}
                status={metrics.avgSpsf >= 700 ? 'on-track' : 'warning'}
              />
              <MetricCard
                label={<>Stores Below Threshold</>}
                value={String(metrics.belowFloor)}
                icon={AlertTriangle}
                iconColor="error"
                subtitle={`${metrics.actionNeeded} need attention`}
                status={metrics.belowFloor > 0 ? 'critical' : 'on-track'}
              />
              <MetricCard
                label={<>Pending Recommendations</>}
                value={String(metrics.totalRecs)}
                icon={Lightbulb}
                iconColor="warning"
                subtitle="AI-generated space optimization"
                status="warning"
              />
            </MetricGrid>
            <NetworkAnalysis stores={selectedFormat === 'all' ? data.storeSpaceProfiles : data.storeSpaceProfiles.filter(p => p.format === selectedFormat)} recs={data.spaceRecommendations} onSelectStore={handleSelectStore} />
          </div>
        </TabsContent>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* CEO: ALERTS & RECOMMENDATIONS                                    */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="alerts-recs">
          <div className="space-y-6">
            <PersonaAlertRecsView
              storeRows={allStoreRows}
              recs={data.spaceRecommendations}
              onSelectStore={handleSelectStore}
              onViewStore={(id) => navigate(`/store-360/${id}`)}
              showFormatFilter
            />
            <TacticalReallocationSection reallocations={data.tacticalReallocations} />
          </div>
        </TabsContent>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* SPACE PLANNER: FORMAT PULSE (original)                           */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="format-pulse">
          {/* Format Filter */}
          <FilterBar>
            <FilterPills
              value={selectedFormat}
              onChange={setSelectedFormat}
              options={[
                { value: 'all', label: 'All Formats', count: data.storeSpaceProfiles.length },
                ...availableFormats.map(fmt => ({
                  value: fmt,
                  label: fmt,
                  count: data.storeSpaceProfiles.filter(p => p.format === fmt).length,
                })),
              ]}
            />
          </FilterBar>
          <div className="space-y-6">
            {/* ── Row 1: Primary KPIs ── */}
            <MetricGrid>
              <MetricCard
                label={<>{selectedFormat === 'all' ? 'Network' : selectedFormat} Avg <KpiLabel abbr="SPSF" /></>}
                value={`Rs ${metrics.avgSpsf}`}
                icon={TrendingUp}
                iconColor="info"
                subtitle={selectedFormat === 'all' ? `FY27 Plan: Rs ${networkSpaceMetricsData.lflSpsf.fy27Plan} (+${networkSpaceMetricsData.lflSpsf.growthPct}%)` : `${storeRows.length} stores in format`}
                status={metrics.avgSpsf >= 700 ? 'on-track' : 'warning'}
              />
              <MetricCard
                label={<>{selectedFormat === 'all' ? 'Network' : selectedFormat} Avg <KpiLabel abbr="GMROF" /></>}
                value={`Rs ${metrics.avgGmrof}`}
                icon={LayoutGrid}
                iconColor="success"
                subtitle="Gross margin return on footage"
                status="on-track"
              />
              <div role="button" tabIndex={0} aria-label="Show stores needing action" className="cursor-pointer" onClick={() => { setShowBelowFloorStores(true); setTimeout(() => belowThresholdRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50); }} onKeyDown={(e) => { if (e.key === 'Enter') { setShowBelowFloorStores(true); setTimeout(() => belowThresholdRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50); } }}>
                <MetricCard
                  label="Stores Needing Action"
                  value={metrics.actionNeeded}
                  icon={AlertTriangle}
                  iconColor={metrics.belowFloor > 0 ? 'error' : 'warning'}
                  subtitle={`${metrics.belowFloor} below min. threshold, ${metrics.actionNeeded - metrics.belowFloor} below target`}
                  status={metrics.belowFloor > 0 ? 'critical' : 'warning'}
                />
              </div>
              <div role="button" tabIndex={0} aria-label="Show pending recommendations" className="cursor-pointer" onClick={() => { setShowPendingRecs(true); setTimeout(() => pendingRecsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50); }} onKeyDown={(e) => { if (e.key === 'Enter') { setShowPendingRecs(true); setTimeout(() => pendingRecsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50); } }}>
                <MetricCard
                  label="Pending Recommendations"
                  value={metrics.totalRecs}
                  icon={Lightbulb}
                  iconColor="warning"
                  subtitle="AI-generated space actions"
                />
              </div>
            </MetricGrid>

            {/* ── Row 2: Operational KPIs ── */}
            <MetricGrid>
              <MetricCard
                label="Stocking Density"
                value={`${networkSpaceMetricsData.stockingDensity.blended} pcs/sft`}
                icon={Layers}
                iconColor="info"
                subtitle={`Replen ${networkSpaceMetricsData.stockingDensity.replen} · Fashion ${networkSpaceMetricsData.stockingDensity.fashion}`}
              />
              <MetricCard
                label="Inventory Turns"
                value={`${networkSpaceMetricsData.inventoryTurns.current}x`}
                icon={RefreshCw}
                iconColor={networkSpaceMetricsData.inventoryTurns.current >= networkSpaceMetricsData.inventoryTurns.target ? 'success' : 'warning'}
                subtitle={`Target ${networkSpaceMetricsData.inventoryTurns.target}x`}
                status={networkSpaceMetricsData.inventoryTurns.current >= networkSpaceMetricsData.inventoryTurns.target ? 'on-track' : 'warning'}
              />
              <MetricCard
                label="Cover Days"
                value={`${networkSpaceMetricsData.coverDays.blended}d`}
                icon={CalendarDays}
                iconColor="info"
                subtitle={`Core ${networkSpaceMetricsData.coverDays.core}d · Fashion ${networkSpaceMetricsData.coverDays.fashion}d`}
              />
              <MetricCard
                label="Aged Stock"
                value={`Rs ${networkSpaceMetricsData.agedStock.value} ${networkSpaceMetricsData.agedStock.unit}`}
                icon={Archive}
                iconColor="error"
                subtitle={networkSpaceMetricsData.agedStock.target}
                status="critical"
              />
            </MetricGrid>

            {/* ── Negative state: Critical alert when stores are below SPSF floor ── */}
            {(metrics.belowFloor > 0 || showBelowFloorStores) && (
              <div ref={belowThresholdRef} className="bg-white border border-gray-200 border-l-3 border-l-red-500 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowBelowFloorStores(v => !v)}
                  className="w-full p-3 flex items-start gap-2 text-left hover:bg-gray-50 transition-colors"
                >
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">
                      {metrics.belowFloor} store{metrics.belowFloor > 1 ? 's' : ''} below minimum Sales Per Sq. Ft. threshold
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      These stores are generating less revenue per square foot than the minimum acceptable threshold for their grade. Immediate space reallocation review required.
                    </p>
                  </div>
                  <ChevronDown className={cn('w-4 h-4 text-gray-400 shrink-0 mt-0.5 transition-transform', showBelowFloorStores && 'rotate-180')} />
                </button>
                {showBelowFloorStores && (() => {
                  const belowStores = storeRows.filter(s => s.spsfStatus === 'red');
                  const byGrade = belowStores.reduce<Record<string, { count: number; avgSpsf: number; threshold: number; totalRecs: number }>>((acc, s) => {
                    if (!acc[s.grade]) acc[s.grade] = { count: 0, avgSpsf: 0, threshold: data.spsfTargets.find(sp => sp.grade === s.grade)?.floor ?? 0, totalRecs: 0 };
                    acc[s.grade]!.count++;
                    acc[s.grade]!.avgSpsf += s.spsf;
                    acc[s.grade]!.totalRecs += s.pendingRecs;
                    return acc;
                  }, {});
                  const gradeAggRows = Object.entries(byGrade).map(([grade, d]) => ({ grade, ...d, avgSpsf: Math.round(d.avgSpsf / d.count) })).sort((a, b) => a.grade.localeCompare(b.grade));
                  const byFormat = belowStores.reduce<Record<string, number>>((acc, s) => { acc[s.format] = (acc[s.format] ?? 0) + 1; return acc; }, {});
                  const formatEntries = Object.entries(byFormat).sort((a, b) => b[1] - a[1]);
                  return (
                    <div className="border-t border-gray-100 p-4 space-y-4">
                      {/* By grade */}
                      <div>
                        <p className="text-xs font-semibold text-gray-700 mb-2">Breakdown by Grade</p>
                        <DataTable>
                          <DataTableHeader>
                            <DataTableHead>Grade</DataTableHead>
                            <DataTableHead className="text-right">Stores</DataTableHead>
                            <DataTableHead className="text-right">Avg Sales/Sq.Ft.</DataTableHead>
                            <DataTableHead className="text-right">Min. Threshold</DataTableHead>
                            <DataTableHead className="text-right">Avg Gap</DataTableHead>
                            <DataTableHead className="text-right">Pending Recs</DataTableHead>
                            <DataTableHead className="w-28" />
                          </DataTableHeader>
                          <DataTableBody>
                            {gradeAggRows.map(g => {
                              const isExpanded = expandedAlertGrade === g.grade;
                              const gradeStores = isExpanded ? belowStores.filter(s => s.grade === g.grade).sort((a, b) => a.spsf - b.spsf) : [];
                              return (
                                <Fragment key={g.grade}>
                                  <DataTableRow>
                                    <DataTableCell className="font-medium text-gray-900">{g.grade}</DataTableCell>
                                    <DataTableCell className="text-right tabular-nums text-gray-700">{g.count}</DataTableCell>
                                    <DataTableCell className="text-right tabular-nums font-medium text-red-700">Rs {g.avgSpsf}</DataTableCell>
                                    <DataTableCell className="text-right tabular-nums text-gray-700">Rs {g.threshold}</DataTableCell>
                                    <DataTableCell className="text-right tabular-nums text-red-700">-Rs {g.threshold - g.avgSpsf}</DataTableCell>
                                    <DataTableCell className="text-right tabular-nums text-gray-700">{g.totalRecs}</DataTableCell>
                                    <DataTableCell className="text-right">
                                      <button
                                        onClick={() => setExpandedAlertGrade(isExpanded ? null : g.grade)}
                                        className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                                      >
                                        {isExpanded ? 'Hide' : 'View Stores'} <ChevronDown className={cn('w-3 h-3 transition-transform', isExpanded && 'rotate-180')} />
                                      </button>
                                    </DataTableCell>
                                  </DataTableRow>
                                  {isExpanded && gradeStores.map(s => (
                                    <DataTableRow key={s.storeId} onClick={() => handleSelectStore(s.storeId)} className="cursor-pointer bg-red-50/40 hover:bg-red-50">
                                      <DataTableCell>
                                        <p className="text-xs font-medium text-gray-900">{s.storeName}</p>
                                        <p className="text-[10px] text-gray-500">{s.city} · {s.format}</p>
                                      </DataTableCell>
                                      <DataTableCell />
                                      <DataTableCell className="text-right tabular-nums text-xs font-medium text-red-700">Rs {s.spsf}</DataTableCell>
                                      <DataTableCell className="text-right tabular-nums text-xs text-gray-500">Rs {g.threshold}</DataTableCell>
                                      <DataTableCell className="text-right tabular-nums text-xs text-red-700">-Rs {g.threshold - s.spsf}</DataTableCell>
                                      <DataTableCell className="text-right tabular-nums text-xs text-gray-700">{s.pendingRecs}</DataTableCell>
                                      <DataTableCell className="text-right">
                                        <ChevronRight className="w-3 h-3 text-gray-400" />
                                      </DataTableCell>
                                    </DataTableRow>
                                  ))}
                                </Fragment>
                              );
                            })}
                          </DataTableBody>
                        </DataTable>
                      </div>
                      {/* By format */}
                      <div>
                        <p className="text-xs font-semibold text-gray-700 mb-2">Breakdown by Format</p>
                        <div className="flex flex-wrap gap-2">
                          {formatEntries.map(([fmt, count]) => (
                            <span key={fmt} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs">
                              <span className="font-medium text-gray-900">{fmt}</span>
                              <Badge variant="error" size="sm">{count} stores</Badge>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* ── Negative state: Pending recommendations needing action ── */}
            {(metrics.totalRecs > 5 || showPendingRecs) && (() => {
              const filteredRecs = selectedFormat === 'all'
                ? data.spaceRecommendations
                : data.spaceRecommendations.filter(r => storeRows.some(s => s.storeId === r.storeId));
              const segCounts = filteredRecs.reduce<Record<string, { segment: string; increase: number; reduce: number; totalSpsfDelta: number }>>((acc, r) => {
                if (!acc[r.segment]) acc[r.segment] = { segment: r.segment, increase: 0, reduce: 0, totalSpsfDelta: 0 };
                if (r.recommendedSpacePct > r.currentSpacePct) acc[r.segment]!.increase++;
                else acc[r.segment]!.reduce++;
                acc[r.segment]!.totalSpsfDelta += r.spsfDelta;
                return acc;
              }, {});
              const segSummary = Object.values(segCounts).sort((a, b) => (b.increase + b.reduce) - (a.increase + a.reduce));
              return (
                <div ref={pendingRecsRef} className="bg-white border border-gray-200 border-l-3 border-l-amber-500 rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowPendingRecs(v => !v)}
                    className="w-full p-3 flex items-start gap-2 text-left hover:bg-gray-50 transition-colors"
                  >
                    <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">
                        {metrics.totalRecs} AI recommendations pending review
                      </p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        Multiple stores have unactioned space recommendations. Review and accept or dismiss to keep plans current.
                      </p>
                    </div>
                    <ChevronDown className={cn('w-4 h-4 text-gray-400 shrink-0 mt-0.5 transition-transform', showPendingRecs && 'rotate-180')} />
                  </button>
                  {showPendingRecs && (
                    <div className="border-t border-gray-100 p-4 space-y-4">
                      {/* Segment breakdown */}
                      <div>
                        <p className="text-xs font-semibold text-gray-700 mb-2">Recommendations by Segment</p>
                        <div className="grid grid-cols-4 gap-1 text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-1">
                          <div>Segment</div>
                          <div className="text-right">Expand Area</div>
                          <div className="text-right">Reduce Area</div>
                          <div className="text-right">Avg Sales/Sq.Ft. Impact</div>
                        </div>
                        {segSummary.map(s => (
                          <div key={s.segment} className="grid grid-cols-4 gap-1 py-1.5 text-xs border-t border-gray-100">
                            <div className="font-medium text-gray-900">{s.segment}</div>
                            <div className="text-right tabular-nums text-green-700">{s.increase > 0 ? `+${s.increase}` : '—'}</div>
                            <div className="text-right tabular-nums text-red-700">{s.reduce > 0 ? s.reduce : '—'}</div>
                            <div className={cn('text-right tabular-nums font-medium', s.totalSpsfDelta >= 0 ? 'text-green-700' : 'text-red-700')}>
                              {s.totalSpsfDelta >= 0 ? '+' : ''}Rs {Math.round(s.totalSpsfDelta / (s.increase + s.reduce))}/Sq.Ft.
                            </div>
                          </div>
                        ))}
                      </div>
                      {/* Grade-level distribution with store drill-down */}
                      <div>
                        <p className="text-xs font-semibold text-gray-700 mb-2">Recommendations by Grade</p>
                        {(() => {
                          const gradeData = filteredRecs.reduce<Record<string, { count: number; stores: Set<string>; totalSpsfDelta: number }>>((acc, r) => {
                            const store = storeRows.find(s => s.storeId === r.storeId);
                            const g = store?.grade ?? 'Unknown';
                            if (!acc[g]) acc[g] = { count: 0, stores: new Set(), totalSpsfDelta: 0 };
                            acc[g]!.count++;
                            acc[g]!.stores.add(r.storeId);
                            acc[g]!.totalSpsfDelta += r.spsfDelta;
                            return acc;
                          }, {});
                          const gradeRecsRows = Object.entries(gradeData)
                            .map(([grade, d]) => ({ grade, count: d.count, storeCount: d.stores.size, avgSpsfDelta: Math.round(d.totalSpsfDelta / d.count) }))
                            .sort((a, b) => a.grade.localeCompare(b.grade));
                          return (
                            <DataTable>
                              <DataTableHeader>
                                <DataTableHead>Grade</DataTableHead>
                                <DataTableHead className="text-right">Recommendations</DataTableHead>
                                <DataTableHead className="text-right">Stores Affected</DataTableHead>
                                <DataTableHead className="text-right">Avg Sales/Sq.Ft. Impact</DataTableHead>
                                <DataTableHead className="w-28" />
                              </DataTableHeader>
                              <DataTableBody>
                                {gradeRecsRows.map(g => {
                                  const isExpanded = expandedRecsGrade === g.grade;
                                  const gradeStores = isExpanded
                                    ? (() => {
                                        const seen = new Set<string>();
                                        const result: typeof storeRows = [];
                                        for (const r of filteredRecs) {
                                          const store = storeRows.find(s => s.storeId === r.storeId);
                                          if (store && store.grade === g.grade && !seen.has(r.storeId)) {
                                            seen.add(r.storeId);
                                            result.push(store);
                                          }
                                        }
                                        return result.sort((a, b) => a.spsf - b.spsf);
                                      })()
                                    : [];
                                  return (
                                    <Fragment key={g.grade}>
                                      <DataTableRow>
                                        <DataTableCell className="font-medium text-gray-900">{g.grade}</DataTableCell>
                                        <DataTableCell className="text-right tabular-nums text-amber-700">{g.count}</DataTableCell>
                                        <DataTableCell className="text-right tabular-nums text-gray-700">{g.storeCount}</DataTableCell>
                                        <DataTableCell className={cn('text-right tabular-nums font-medium', g.avgSpsfDelta >= 0 ? 'text-green-700' : 'text-red-700')}>
                                          {g.avgSpsfDelta >= 0 ? '+' : ''}Rs {g.avgSpsfDelta}/Sq.Ft.
                                        </DataTableCell>
                                        <DataTableCell className="text-right">
                                          <button
                                            onClick={() => setExpandedRecsGrade(isExpanded ? null : g.grade)}
                                            className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                                          >
                                            {isExpanded ? 'Hide' : 'View Stores'} <ChevronDown className={cn('w-3 h-3 transition-transform', isExpanded && 'rotate-180')} />
                                          </button>
                                        </DataTableCell>
                                      </DataTableRow>
                                      {isExpanded && gradeStores.map(s => {
                                        const storeRecs = filteredRecs.filter(r => r.storeId === s.storeId);
                                        return (
                                          <DataTableRow key={s.storeId} onClick={() => handleSelectStore(s.storeId)} className="cursor-pointer bg-amber-50/40 hover:bg-amber-50">
                                            <DataTableCell>
                                              <p className="text-xs font-medium text-gray-900">{s.storeName}</p>
                                              <p className="text-[10px] text-gray-500">{s.city} · {s.format}</p>
                                            </DataTableCell>
                                            <DataTableCell className="text-right tabular-nums text-xs text-amber-700">{storeRecs.length} recs</DataTableCell>
                                            <DataTableCell />
                                            <DataTableCell className={cn('text-right tabular-nums text-xs font-medium', 'text-green-700')}>
                                              +Rs {Math.round(storeRecs.reduce((sum, r) => sum + r.spsfDelta, 0) / storeRecs.length)}/Sq.Ft.
                                            </DataTableCell>
                                            <DataTableCell className="text-right">
                                              <ChevronRight className="w-3 h-3 text-gray-400" />
                                            </DataTableCell>
                                          </DataTableRow>
                                        );
                                      })}
                                    </Fragment>
                                  );
                                })}
                              </DataTableBody>
                            </DataTable>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ── Renovation / Refit Alert ── */}
            {(() => {
              const renovationStores = data.nsoStores.filter(s => s.projectType !== 'nso' && s.overallStatus !== 'completed');
              if (renovationStores.length === 0) return null;
              const delayed = renovationStores.filter(s => s.overallStatus === 'delayed').length;
              return (
                <div className="bg-white border border-gray-200 border-l-3 border-l-indigo-500 rounded-lg overflow-hidden">
                  <div className="p-3 flex items-start gap-2">
                    <Wrench className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">
                        {renovationStores.length} store{renovationStores.length > 1 ? 's' : ''} currently under renovation / refit
                        {delayed > 0 && <Badge variant="warning" size="sm" className="ml-2">{delayed} delayed</Badge>}
                      </p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        Space planning recommendations for these stores should account for ongoing structural changes. Fixture conversions can be bundled with renovation at zero incremental downtime.
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {renovationStores.map(s => (
                          <button
                            key={s.storeId}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs hover:border-indigo-300 hover:bg-indigo-50 transition-colors cursor-pointer"
                            onClick={() => { setActivePersona('space-planner'); setSpActiveTab('nso-tracker'); setExpandedNSOId(s.storeId); }}
                          >
                            <span className="font-medium text-gray-900">{s.storeName}</span>
                            <Badge variant={s.projectType === 'renovation' ? 'warning' : 'info'} size="sm">{s.projectType === 'renovation' ? 'Renovation' : 'Refit'}</Badge>
                            <Badge variant={s.overallStatus === 'delayed' ? 'error' : 'success'} size="sm">
                              Step {s.currentStep}/{s.steps.length}
                            </Badge>
                            <span className="text-gray-400">Target: {s.targetLaunchDate}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ── Space Composition: Private Label / Exclusive Brand + Front of House / Back of House ── */}
            <div className="grid grid-cols-2 gap-4">
              {/* Private Label vs Exclusive Brand Split — per-format when All Formats */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <SectionHeader title="Space Allocation — Private Label vs Exclusive Brand" />
                {(() => {
                  if (selectedFormat !== 'all') {
                    // Single format selected — show that format's split or fallback to network
                    const fmtSplit = formatPlEbSplits.find(f => f.format === selectedFormat) ?? networkSpaceMetricsData.plEbSplit;
                    return (
                      <>
                        <div className="flex h-3 rounded-full overflow-hidden mb-3">
                          <div className="bg-indigo-500" style={{ width: `${fmtSplit.pl}%` }} />
                          <div className="bg-emerald-400" style={{ width: `${fmtSplit.eb}%` }} />
                          <div className="bg-gray-300" style={{ width: `${fmtSplit.nonApparels}%` }} />
                          <div className="bg-amber-300" style={{ width: `${fmtSplit.innerwear}%` }} />
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
                          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-indigo-500" />Private Label {fmtSplit.pl}%</span>
                          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400" />Exclusive Brand {fmtSplit.eb}%</span>
                          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-gray-300" />Non-Apparels {fmtSplit.nonApparels}%</span>
                          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-300" />Innerwear {fmtSplit.innerwear}%</span>
                        </div>
                      </>
                    );
                  }
                  // All Formats — show per-format breakdown
                  return (
                    <div className="space-y-2.5">
                      {formatPlEbSplits.map(fmt => (
                        <div key={fmt.format}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-gray-700">{fmt.format}</span>
                            <span className="text-[10px] text-gray-400">PL {fmt.pl}% · EB {fmt.eb}%</span>
                          </div>
                          <div className="flex h-2 rounded-full overflow-hidden">
                            <div className="bg-indigo-500" style={{ width: `${fmt.pl}%` }} />
                            <div className="bg-emerald-400" style={{ width: `${fmt.eb}%` }} />
                            <div className="bg-gray-300" style={{ width: `${fmt.nonApparels}%` }} />
                            <div className="bg-amber-300" style={{ width: `${fmt.innerwear}%` }} />
                          </div>
                        </div>
                      ))}
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-gray-500 pt-1 border-t border-gray-100">
                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />Private Label</span>
                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />Exclusive Brand</span>
                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-gray-300" />Non-Apparels</span>
                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-300" />Innerwear</span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Front of House vs Back of House Split — per-format when All Formats */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <SectionHeader title="Front of House / Back of House Split" />
                {(() => {
                  if (selectedFormat !== 'all') {
                    const fmtFoh = formatFohBohSplits.find(f => f.format === selectedFormat) ?? { ...networkSpaceMetricsData.fohBohSplit, displayCapacityUtil: networkSpaceMetricsData.displayCapacityUtil, fixturesFillRate: networkSpaceMetricsData.fixturesFillRate };
                    return (
                      <>
                        <div className="flex h-3 rounded-full overflow-hidden mb-3">
                          <div className="bg-indigo-500" style={{ width: `${fmtFoh.foh}%` }} />
                          <div className="bg-gray-300" style={{ width: `${fmtFoh.boh}%` }} />
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-600">
                          <div className="flex gap-4">
                            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-indigo-500" />Front of House {fmtFoh.foh}%</span>
                            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-gray-300" />Back of House {fmtFoh.boh}%</span>
                          </div>
                          <div className="flex gap-3 text-gray-400">
                            <span>Target FOH: {fmtFoh.fohTarget}</span>
                            <span>Target BOH: {fmtFoh.bohTarget}</span>
                          </div>
                        </div>
                        <div className="mt-3 flex gap-6 text-xs">
                          <div>
                            <p className="text-gray-500">Display Capacity Util.</p>
                            <p className="text-sm font-semibold text-gray-900">{fmtFoh.displayCapacityUtil}%</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Fixture Fill Rate</p>
                            <p className="text-sm font-semibold text-gray-900">{fmtFoh.fixturesFillRate}%</p>
                          </div>
                        </div>
                      </>
                    );
                  }
                  // All Formats — show per-format breakdown
                  return (
                    <div className="space-y-2.5">
                      {formatFohBohSplits.map(fmt => (
                        <div key={fmt.format}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-gray-700">{fmt.format}</span>
                            <span className="text-[10px] text-gray-400">FOH {fmt.foh}% · BOH {fmt.boh}% · DCU {fmt.displayCapacityUtil}% · FFR {fmt.fixturesFillRate}%</span>
                          </div>
                          <div className="flex h-2 rounded-full overflow-hidden">
                            <div className="bg-indigo-500" style={{ width: `${fmt.foh}%` }} />
                            <div className="bg-gray-300" style={{ width: `${fmt.boh}%` }} />
                          </div>
                        </div>
                      ))}
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-gray-500 pt-1 border-t border-gray-100">
                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />Front of House</span>
                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-gray-300" />Back of House</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* ── Network Analysis (merged Segment + Geography views) ── */}
            <NetworkAnalysis stores={selectedFormat === 'all' ? data.storeSpaceProfiles : data.storeSpaceProfiles.filter(p => p.format === selectedFormat)} recs={data.spaceRecommendations} onSelectStore={handleSelectStore} />

          </div>
        </TabsContent>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* TAB 2: STORE PLANNER (Hero Screen)                               */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="store-planner">
          {!selectedStore ? (
            <StorePlannerBrowser stores={selectedFormat === 'all' ? data.storeSpaceProfiles : data.storeSpaceProfiles.filter(p => p.format === selectedFormat)} spsfTargets={data.spsfTargets} onSelect={handleSelectStore} />
          ) : (
            <StorePlannerView
              store={selectedStore}
              acceptedRecs={acceptedRecs}
              onToggleRec={toggleRec}
              pulsePointTasks={pulsePointTasks}
              onExecuteRec={handleExecuteRec}
              onExecuteAll={handleExecuteAll}
              onCreateTask={(task) => setPulsePointTasks(prev => [...prev, task])}
              spaceChanges={data.storeSpaceChanges.filter(sc => sc.storeId === selectedStore.profile.storeId)}
              onBack={() => setSelectedStoreId(null)}
            />
          )}
        </TabsContent>

        {/* Hit Plan tab — 12-hit cadence replaces seasonal planning */}
        {/* <TabsContent value="hit-plan">
          <HitPlanView stores={data.storeSpaceProfiles} recs={data.spaceRecommendations} />
        </TabsContent> */}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* SPACE PLANNER: SPACE SIMULATION                                  */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="space-simulation">
          {(() => {
            const matched = scenarioInput.trim() ? matchScenarioTemplate(scenarioInput) : null;
            const preview = matched?.preview ?? null;

            const handleGenerate = () => {
              if (!matched) return;
              setScenarioGenerating(true);
              setGeneratedScenario(null);
              setShowComparison(false);
              setTimeout(() => {
                setGeneratedScenario(matched.result);
                setScenarioGenerating(false);
              }, 1200);
            };

            const handleCompare = () => {
              if (!generatedScenario) {
                // Generate first, then show comparison after generation completes
                if (!matched) return;
                setScenarioGenerating(true);
                setGeneratedScenario(null);
                setShowComparison(false);
                setTimeout(() => {
                  setGeneratedScenario(matched.result);
                  setScenarioGenerating(false);
                  setShowComparison(true);
                }, 1200);
              } else {
                setShowComparison(true);
              }
            };

            return (
              <div className="space-y-6">
                {/* ── Input Section ── */}
                <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-4">
                  <div>
                    {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Describe your space planning scenario</label>
                    <textarea
                      className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                      rows={2}
                      placeholder='e.g., "Decongest stores", "Expand women ethnic", "Sportswear push", "Convert 4-way to a-rail"'
                      value={scenarioInput}
                      onChange={(e) => {
                        setScenarioInput(e.target.value);
                        setGeneratedScenario(null);
                        setShowComparison(false);
                      }}
                    />
                  </div>

                  {/* Preview — appears when keywords match */}
                  {preview && (
                    <div className="rounded-lg border border-dashed border-indigo-200 bg-indigo-50/50 p-3 space-y-2">
                      <p className="text-xs font-semibold text-indigo-700">Scenario Preview</p>
                      <div className="space-y-1.5 text-sm text-gray-700">
                        {[
                          { label: 'Scope', value: preview.scope, color: 'bg-indigo-400' },
                          { label: 'Change', value: preview.change, color: 'bg-indigo-400' },
                          { label: 'SPSF Impact', value: preview.spsfImpact, color: 'bg-indigo-400' },
                          { label: 'Capacity Impact', value: preview.capacityImpact, color: 'bg-indigo-400' },
                          ...(preview.warning ? [{ label: 'Warning', value: preview.warning, color: 'bg-amber-400' }] : []),
                        ].map(item => (
                          <div key={item.label} className="flex items-start gap-2">
                            <span className={cn('mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full', item.color)} />
                            <span><strong>{item.label}:</strong> {item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <Button size="sm" onClick={handleGenerate} disabled={!scenarioInput.trim() || scenarioGenerating}>
                      {scenarioGenerating ? 'Generating...' : 'Generate Full Scenario'}
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleCompare} disabled={!scenarioInput.trim() || scenarioGenerating}>
                      Compare with Current Plan
                    </Button>
                  </div>
                </div>

                {/* ── Loading State ── */}
                {scenarioGenerating && (
                  <div className="rounded-lg border border-gray-200 bg-white p-8 flex items-center justify-center gap-3">
                    <RefreshCw className="w-4 h-4 text-indigo-500 animate-spin" />
                    <span className="text-sm text-gray-500">Simulating scenario across {matched?.result.scope.storeCount ?? 0} stores...</span>
                  </div>
                )}

                {/* ── Generated Scenario Results ── */}
                {generatedScenario && !scenarioGenerating && (
                  <div className="space-y-6">
                    {/* Header */}
                    <div className="rounded-lg border border-gray-200 bg-white p-4">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900">{generatedScenario.title}</h3>
                          <p className="text-xs text-gray-500 mt-0.5">{generatedScenario.description}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="outline" size="sm">{generatedScenario.scope.storeCount} stores</Badge>
                          <Badge variant="outline" size="sm">{generatedScenario.scope.region} · {generatedScenario.scope.grade}</Badge>
                        </div>
                      </div>

                      {/* Network Impact KPIs */}
                      <MetricGrid columns={4}>
                        <MetricCard
                          label="Projected SPSF"
                          value={`Rs ${generatedScenario.networkImpact.projectedAvgSpsf}`}
                          subtitle={`+${generatedScenario.networkImpact.spsfDeltaPct}% vs current Rs ${generatedScenario.networkImpact.currentAvgSpsf}`}
                        />
                        <MetricCard
                          label="Projected GMROF"
                          value={`${generatedScenario.networkImpact.projectedAvgGmrof.toFixed(1)}x`}
                          subtitle={`vs current ${generatedScenario.networkImpact.currentAvgGmrof.toFixed(1)}x`}
                        />
                        <MetricCard
                          label="Investment"
                          value={`Rs ${generatedScenario.networkImpact.investmentLakhs}L`}
                          subtitle={`Payback: ${generatedScenario.networkImpact.paybackMonths} months`}
                        />
                        <MetricCard
                          label="Option Delta"
                          value={`${generatedScenario.networkImpact.optionDelta > 0 ? '+' : ''}${generatedScenario.networkImpact.optionDelta.toLocaleString()}`}
                          subtitle="Net option capacity change"
                        />
                      </MetricGrid>
                    </div>

                    {/* Fixture Changes with Stock Availability */}
                    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <SectionHeader title="Fixture Changes" subtitle="Fixture reallocation across segment zones with merchandise availability" />
                      </div>
                      <DataTable>
                        <DataTableHeader>
                          <DataTableHead>From</DataTableHead>
                          <DataTableHead>To</DataTableHead>
                          <DataTableHead className="text-right">Qty</DataTableHead>
                          <DataTableHead>Zone</DataTableHead>
                          <DataTableHead>Merchandise Status</DataTableHead>
                          <DataTableHead>Execution Path</DataTableHead>
                        </DataTableHeader>
                        <DataTableBody>
                          {generatedScenario.fixtureChanges.map((fc, i) => (
                            <DataTableRow key={i}>
                              <DataTableCell className="text-gray-700">{fc.from}</DataTableCell>
                              <DataTableCell className="font-medium">
                                <span className="flex items-center gap-1">
                                  <ArrowRight className="w-3 h-3 text-indigo-500" /> {fc.to}
                                </span>
                              </DataTableCell>
                              <DataTableCell className="text-right tabular-nums font-semibold">{fc.qty}</DataTableCell>
                              <DataTableCell className="text-gray-500 text-xs">{fc.zone}</DataTableCell>
                              <DataTableCell>
                                {fc.stockStatus === 'available' ? (
                                  <Badge variant="success" size="sm">{fc.availableQty}/{fc.qty} Available</Badge>
                                ) : fc.stockStatus === 'partial' ? (
                                  <Badge variant="warning" size="sm">{fc.availableQty}/{fc.qty} Available</Badge>
                                ) : (
                                  <Badge variant="error" size="sm">Not Available</Badge>
                                )}
                              </DataTableCell>
                              <DataTableCell>
                                {fc.stockStatus === 'available' ? (
                                  <span className="text-xs text-green-700 font-medium">Execute now — trigger DC replenishment</span>
                                ) : fc.stockStatus === 'partial' ? (
                                  <span className="text-xs text-amber-700 font-medium">
                                    {fc.availableQty} now, {fc.qty - fc.availableQty} in {fc.nextRACycle}
                                    {fc.etaWeeks && <span className="text-gray-400"> (ETA {fc.etaWeeks}w)</span>}
                                  </span>
                                ) : (
                                  <span className="text-xs text-red-700 font-medium">
                                    Queue for {fc.nextRACycle}
                                  </span>
                                )}
                              </DataTableCell>
                            </DataTableRow>
                          ))}
                        </DataTableBody>
                      </DataTable>
                      {/* Summary strip */}
                      {(() => {
                        const allAvailable = generatedScenario.fixtureChanges.every(fc => fc.stockStatus === 'available');
                        const anyNeedsRa = generatedScenario.fixtureChanges.some(fc => fc.stockStatus === 'needs-ra');
                        const raItems = generatedScenario.fixtureChanges.filter(fc => fc.stockStatus !== 'available');
                        return (
                          <div className={cn(
                            'px-4 py-2 border-t text-xs flex items-center gap-2',
                            allAvailable ? 'bg-green-50 border-green-200 text-green-800' : anyNeedsRa ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-blue-50 border-blue-200 text-blue-800',
                          )}>
                            {allAvailable ? (
                              <><CheckCircle2 className="w-3.5 h-3.5" /> All merchandise available — can execute immediately</>
                            ) : (
                              <><Clock className="w-3.5 h-3.5" /> {raItems.length} fixture change{raItems.length > 1 ? 's' : ''} need{raItems.length === 1 ? 's' : ''} RA cycle — {raItems[0]?.nextRACycle ?? 'next cycle'}</>
                            )}
                          </div>
                        );
                      })()}
                    </div>

                    {/* Segment Impact */}
                    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <SectionHeader title="Segment Impact" subtitle="SPSF impact by affected segment" />
                      </div>
                      <DataTable>
                        <DataTableHeader>
                          <DataTableHead>Segment</DataTableHead>
                          <DataTableHead className="text-right">Current SFT%</DataTableHead>
                          <DataTableHead className="text-right">New SFT%</DataTableHead>
                          <DataTableHead className="text-right">Current SPSF</DataTableHead>
                          <DataTableHead className="text-right">Projected SPSF</DataTableHead>
                          <DataTableHead className="text-right">Delta</DataTableHead>
                        </DataTableHeader>
                        <DataTableBody>
                          {generatedScenario.segmentImpact.map(seg => (
                            <DataTableRow key={seg.segment}>
                              <DataTableCell className="font-medium">{seg.segment}</DataTableCell>
                              <DataTableCell className="text-right tabular-nums">{seg.currentSftPct}%</DataTableCell>
                              <DataTableCell className={cn('text-right tabular-nums font-medium', seg.newSftPct !== seg.currentSftPct ? 'text-indigo-700' : 'text-gray-600')}>
                                {seg.newSftPct}%
                                {seg.newSftPct !== seg.currentSftPct && (
                                  <span className={cn('ml-1 text-xs', seg.newSftPct > seg.currentSftPct ? 'text-green-700' : 'text-red-700')}>
                                    ({seg.newSftPct > seg.currentSftPct ? '+' : ''}{seg.newSftPct - seg.currentSftPct})
                                  </span>
                                )}
                              </DataTableCell>
                              <DataTableCell className="text-right tabular-nums">Rs {seg.currentSpsf}</DataTableCell>
                              <DataTableCell className="text-right tabular-nums font-medium">Rs {seg.projectedSpsf}</DataTableCell>
                              <DataTableCell className={cn('text-right tabular-nums font-semibold', seg.delta >= 0 ? 'text-green-700' : 'text-red-700')}>
                                {seg.delta >= 0 ? '+' : ''}Rs {seg.delta}
                              </DataTableCell>
                            </DataTableRow>
                          ))}
                        </DataTableBody>
                      </DataTable>
                    </div>

                    {/* Affected Stores */}
                    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <SectionHeader title={`Affected Stores (${generatedScenario.affectedStores.length} shown)`} subtitle="Top impacted stores by projected SPSF uplift" />
                      </div>
                      <DataTable>
                        <DataTableHeader>
                          <DataTableHead>Store</DataTableHead>
                          <DataTableHead>City</DataTableHead>
                          <DataTableHead>Grade</DataTableHead>
                          <DataTableHead className="text-right">Current SPSF</DataTableHead>
                          <DataTableHead className="text-right">Projected SPSF</DataTableHead>
                          <DataTableHead className="text-right">Fixtures Changed</DataTableHead>
                          <DataTableHead>Impact</DataTableHead>
                          <DataTableHead></DataTableHead>
                        </DataTableHeader>
                        <DataTableBody>
                          {generatedScenario.affectedStores.map(store => (
                            <DataTableRow key={store.storeId}>
                              <DataTableCell className="font-medium">{store.storeName}</DataTableCell>
                              <DataTableCell className="text-gray-500">{store.city}</DataTableCell>
                              <DataTableCell>{store.grade}</DataTableCell>
                              <DataTableCell className="text-right tabular-nums">Rs {store.currentSpsf}</DataTableCell>
                              <DataTableCell className="text-right tabular-nums font-medium text-green-700">Rs {store.projectedSpsf}</DataTableCell>
                              <DataTableCell className="text-right tabular-nums">{store.fixturesChanged}</DataTableCell>
                              <DataTableCell>
                                <Badge variant={store.status === 'high-impact' ? 'success' : store.status === 'moderate' ? 'warning' : 'outline'} size="sm">
                                  {store.status === 'high-impact' ? 'High Impact' : store.status === 'moderate' ? 'Moderate' : 'Low Impact'}
                                </Badge>
                              </DataTableCell>
                              <DataTableCell>
                                <button
                                  className="inline-flex items-center gap-1 rounded border border-gray-200 px-2 py-1 text-xs text-indigo-600 hover:bg-indigo-50 transition-colors"
                                  onClick={() => setStoreGenModal({ open: true, storeName: store.storeName, context: `Redesign layout for ${store.storeName} — ${store.fixturesChanged} fixture changes projected` })}
                                >
                                  <ExternalLink className="w-3 h-3" /> StoreGen
                                </button>
                              </DataTableCell>
                            </DataTableRow>
                          ))}
                        </DataTableBody>
                      </DataTable>
                    </div>

                    {/* Risk Assessment with Mitigation */}
                    {generatedScenario.risks.length > 0 && (
                      <div className="rounded-lg border border-gray-200 bg-white p-4">
                        <SectionHeader title="Risk Assessment & Mitigation" subtitle="Identified risks with recommended actions" />
                        <div className="space-y-3 mt-3">
                          {generatedScenario.risks.map((risk, i) => (
                            <div key={i} className={cn(
                              'rounded-lg border overflow-hidden',
                              risk.level === 'high' ? 'border-red-200' : risk.level === 'medium' ? 'border-amber-200' : 'border-blue-200',
                            )}>
                              <div className={cn(
                                'flex items-start gap-2 px-3 py-2 text-sm',
                                risk.level === 'high' ? 'bg-red-50 text-red-800' :
                                risk.level === 'medium' ? 'bg-amber-50 text-amber-800' :
                                'bg-blue-50 text-blue-800',
                              )}>
                                <AlertTriangle className={cn('w-4 h-4 shrink-0 mt-0.5', risk.level === 'high' ? 'text-red-500' : risk.level === 'medium' ? 'text-amber-500' : 'text-blue-500')} />
                                <div>
                                  <span className="font-semibold capitalize">{risk.level} Risk: </span>
                                  {risk.description}
                                </div>
                              </div>
                              <div className="px-3 py-2 bg-white border-t border-gray-100">
                                <div className="flex items-start gap-2 text-xs text-gray-700">
                                  <Lightbulb className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                                  <div>
                                    <span className="font-semibold text-indigo-700">Mitigation: </span>
                                    {risk.mitigation}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Comparison with Current Plan */}
                    {showComparison && (
                      <div className="rounded-lg border border-indigo-200 bg-indigo-50/30 p-4 space-y-3">
                        <SectionHeader title="vs Current Plan" subtitle="How this scenario compares to the active baseline" />
                        <div className="grid grid-cols-4 gap-4">
                          <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
                            <p className="text-xs text-gray-500 mb-1">SPSF Delta</p>
                            <p className="text-lg font-bold text-green-700">+{generatedScenario.networkImpact.spsfDeltaPct}%</p>
                            <p className="text-[10px] text-gray-400">Rs {generatedScenario.networkImpact.currentAvgSpsf} → Rs {generatedScenario.networkImpact.projectedAvgSpsf}</p>
                          </div>
                          <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
                            <p className="text-xs text-gray-500 mb-1">GMROF Change</p>
                            <p className="text-lg font-bold text-green-700">+{(generatedScenario.networkImpact.projectedAvgGmrof - generatedScenario.networkImpact.currentAvgGmrof).toFixed(1)}x</p>
                            <p className="text-[10px] text-gray-400">{generatedScenario.networkImpact.currentAvgGmrof.toFixed(1)}x → {generatedScenario.networkImpact.projectedAvgGmrof.toFixed(1)}x</p>
                          </div>
                          <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
                            <p className="text-xs text-gray-500 mb-1">Investment Required</p>
                            <p className="text-lg font-bold text-gray-900">Rs {generatedScenario.networkImpact.investmentLakhs}L</p>
                            <p className="text-[10px] text-gray-400">Payback in {generatedScenario.networkImpact.paybackMonths} months</p>
                          </div>
                          <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
                            <p className="text-xs text-gray-500 mb-1">Stores Impacted</p>
                            <p className="text-lg font-bold text-gray-900">{generatedScenario.scope.storeCount}</p>
                            <p className="text-[10px] text-gray-400">{generatedScenario.affectedStores.filter(s => s.status === 'high-impact').length} high impact</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 pt-2">
                          <Button size="sm" onClick={() => {
                            toast.success(`Scenario "${generatedScenario.title}" saved as draft — view in Scenarios tab`, 'Scenario Saved');
                            setTimeout(() => setSpActiveTab('scenarios'), 800);
                          }}>
                            Save as Draft Scenario
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => {
                            toast.success(`A/B test created for "${generatedScenario.title}" — view in Scenarios tab`, 'A/B Test Created');
                            setTimeout(() => setSpActiveTab('scenarios'), 800);
                          }}>
                            Create A/B Test
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setStoreGenModal({ open: true, context: `Visualize "${generatedScenario.title}" — upload store DXF to see AI-optimized fixture layout` })}>
                            <ExternalLink className="w-3.5 h-3.5 mr-1" /> Visualize in StoreGen
                          </Button>
                          <span className="text-[10px] text-gray-400 ml-2">Saved scenarios and A/B tests appear in the Scenarios tab</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Empty state — no scenario generated yet */}
                {!generatedScenario && !scenarioGenerating && (
                  <EmptyState
                    description='Type a scenario above and click Generate to simulate network-wide impact. Try: "Decongest stores", "Expand women ethnic", "Sportswear push"'
                  />
                )}
              </div>
            );
          })()}
        </TabsContent>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* FIXTURE REBALANCING (CEO + SPACE PLANNER)                        */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="fixture-rebalancing">
          {(() => {
            const isCeo = activePersona === 'ceo';
            const sortedRecs = [...rebalancingRecs].sort((a, b) => b.gmrofImpact - a.gmrofImpact);
            const displayRecs = isCeo ? sortedRecs : rebalancingRecs;
            const pendingRecs = displayRecs.filter(r => r.status === 'recommended' && !rebalancingActions[r.id]);

            // ── CEO: Tier-aggregated view ──
            if (isCeo) {
              const tierOrder: MovementTier[] = ['intra-cluster', 'intra-city', 'inter-city', 'inter-state'];
              const tierLabels: Record<MovementTier, string> = { 'intra-cluster': 'Intra-Cluster', 'intra-city': 'Intra-City', 'inter-city': 'Inter-City (same state)', 'inter-state': 'Inter-State' };
              const tierDesc: Record<MovementTier, string> = { 'intra-cluster': 'Within same cluster — lowest logistics cost', 'intra-city': 'Same city, different clusters', 'inter-city': 'Different cities within same state', 'inter-state': 'Cross-state movement — highest cost' };
              const tierAggregates = tierOrder.map(tier => {
                const recs = displayRecs.filter(r => r.movementTier === tier);
                const totalFixtures = recs.reduce((s, r) => s + r.quantity, 0);
                const totalGmrof = recs.reduce((s, r) => s + r.gmrofImpact, 0);
                const totalTransport = recs.reduce((s, r) => s + r.transportCostLakhs, 0);
                const roi = totalTransport > 0 ? ((totalGmrof * 100) / totalTransport).toFixed(1) : '0'; // GMROF in Cr → Lakhs (×100), then ÷ transport in Lakhs = payback multiple
                const pending = recs.filter(r => r.status === 'recommended' && !rebalancingActions[r.id]).length;
                const avgSourceUtil = recs.length > 0 ? Math.round(recs.reduce((s, r) => s + r.sourceUtilization * r.quantity, 0) / totalFixtures) : 0;
                const avgTargetUtil = recs.length > 0 ? Math.round(recs.reduce((s, r) => s + r.targetUtilization * r.quantity, 0) / totalFixtures) : 0;
                return { tier, label: tierLabels[tier], description: tierDesc[tier], moves: recs.length, fixtures: totalFixtures, gmrof: totalGmrof, transport: totalTransport, roi, pending, recs, avgSourceUtil, avgTargetUtil };
              }).filter(t => t.moves > 0);

              // Fixture type conversion aggregation
              type ConvGroupItem = typeof data.fixtureConversions[number];
              type ConvGroup = { from: string; to: string; stores: number; totalQty: number; netCapacity: number; totalCost: number; pending: number; inventoryReady: number; inventoryTotal: number; segments: string[]; nextRACycle: string | null; items: ConvGroupItem[] };
              const conversionGroups = (() => {
                const map: Record<string, ConvGroup> = {};
                data.fixtureConversions.forEach(fc => {
                  const key = `${fc.fromFixture} → ${fc.toFixture}`;
                  const existing = map[key] || { from: fc.fromFixture, to: fc.toFixture, stores: 0, totalQty: 0, netCapacity: 0, totalCost: 0, pending: 0, inventoryReady: 0, inventoryTotal: 0, segments: [], nextRACycle: null, items: [] };
                  existing.stores += 1;
                  existing.totalQty += fc.quantity;
                  existing.netCapacity += (fc.impactPreview.afterCapacity - fc.impactPreview.beforeCapacity);
                  existing.totalCost += fc.impactPreview.costEstimate;
                  if (fc.status === 'recommended') existing.pending += 1;
                  if (fc.inventoryStatus.available) existing.inventoryReady += 1;
                  existing.inventoryTotal += 1;
                  if (!existing.segments.includes(fc.segmentAffected)) existing.segments.push(fc.segmentAffected);
                  if (!fc.inventoryStatus.available && fc.inventoryStatus.nextRACycle) existing.nextRACycle = fc.inventoryStatus.nextRACycle;
                  existing.items.push(fc);
                  map[key] = existing;
                });
                return Object.entries(map).map(([key, v]) => ({ key, ...v }));
              })();

              return (
                <TooltipProvider>
                <div className="space-y-6">
                  <div className="flex items-center gap-2">
                    <SectionHeader title="Fixture Movement Summary" subtitle="Ground fixture rebalancing across network — prioritized by proximity" />
                    <NotionalBadge />
                  </div>
                  <MetricGrid>
                    <MetricCard
                      label="Pending Recommendations"
                      value={String(pendingRebalancingCount)}
                      icon={ArrowRight}
                      iconColor="info"
                      subtitle={`Across ${uniqueStores} stores`}
                      status={pendingRebalancingCount > 5 ? 'warning' : 'on-track'}
                    />
                    <MetricCard
                      label="Est. GMROF Uplift"
                      value={`+${totalGmrofImpact.toFixed(1)} Cr`}
                      icon={TrendingUp}
                      iconColor="success"
                      subtitle="Network uplift from all transfers"
                      status="on-track"
                    />
                    <MetricCard
                      label="Transport Cost"
                      value={`Rs ${totalTransportCost.toFixed(1)}L`}
                      icon={Truck}
                      iconColor="warning"
                      subtitle={`Payback: ${totalTransportCost > 0 ? ((totalGmrofImpact * 100) / totalTransportCost).toFixed(1) : 0}x transport cost`}
                      status={totalTransportCost > 10 ? 'warning' : 'on-track'}
                    />
                  </MetricGrid>

                  {/* Selective approval bar */}
                  {pendingRecs.length > 0 && (
                    <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-4 py-2">
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300"
                            checked={pendingRecs.every(r => selectedRebalancing.has(r.id))}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedRebalancing(new Set(pendingRecs.map(r => r.id)));
                              } else {
                                setSelectedRebalancing(new Set());
                              }
                            }}
                          />
                          Select All ({pendingRecs.length})
                        </label>
                        {selectedRebalancing.size > 0 && (
                          <span className="text-xs text-gray-500">{selectedRebalancing.size} selected</span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          className="rounded bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-40"
                          disabled={selectedRebalancing.size === 0}
                          onClick={() => {
                            const next = { ...rebalancingActions };
                            selectedRebalancing.forEach(id => { next[id] = 'accepted'; });
                            setRebalancingActions(next);
                            setSelectedRebalancing(new Set());
                          }}
                        >
                          Approve Selected ({selectedRebalancing.size})
                        </button>
                        <button
                          className="rounded border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                          disabled={selectedRebalancing.size === 0}
                          onClick={() => {
                            const next = { ...rebalancingActions };
                            selectedRebalancing.forEach(id => { next[id] = 'rejected'; });
                            setRebalancingActions(next);
                            setSelectedRebalancing(new Set());
                          }}
                        >
                          Reject Selected
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Movement by Proximity table */}
                  <SectionHeader title="Movement by Proximity" subtitle="Prioritized by transportation cost — intra-cluster moves have highest ROI" />
                  <DataTable>
                    <DataTableHeader>
                      <DataTableHead className="w-6" />
                      <DataTableHead className="max-w-[160px]">Tier / Fixture</DataTableHead>
                      <DataTableHead className="text-right">
                        <UITooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex items-center gap-1 cursor-help">Units <Info className="w-3 h-3 text-gray-400" /></span>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            <p className="text-xs">Total physical fixture units being transferred. Sum of quantities across all transfers in this tier.</p>
                          </TooltipContent>
                        </UITooltip>
                      </DataTableHead>
                      <DataTableHead className="text-right">
                        <UITooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex items-center gap-1 cursor-help">Source Fill % <Info className="w-3 h-3 text-gray-400" /></span>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            <p className="text-xs"><strong>Stock fill rate</strong> at source store — % of fixture option slots that have stock. <strong>38% = only 38 of 100 slots filled</strong>. Low fill rate means insufficient stock to utilize the fixture, making it a candidate to move out.</p>
                          </TooltipContent>
                        </UITooltip>
                      </DataTableHead>
                      <DataTableHead className="text-right">
                        <UITooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex items-center gap-1 cursor-help">Target Fill % <Info className="w-3 h-3 text-gray-400" /></span>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            <p className="text-xs"><strong>Projected stock fill rate</strong> at target store after receiving fixtures. <strong>94% = 94 of 100 slots will be stocked</strong>. High fill rate means the store has enough inventory to fully utilize the incoming fixture — strong demand signal.</p>
                          </TooltipContent>
                        </UITooltip>
                      </DataTableHead>
                      <DataTableHead className="text-right">Transport</DataTableHead>
                      <DataTableHead className="text-right">GMROF Uplift</DataTableHead>
                      <DataTableHead className="text-right">
                        <UITooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex items-center gap-1 cursor-help">Payback <Info className="w-3 h-3 text-gray-400" /></span>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            <p className="text-xs">GMROF Uplift ÷ Transport Cost. A payback of <strong>14x</strong> means every Rs 1 spent on transport generates Rs 14 in GMROF uplift. Higher is better.</p>
                          </TooltipContent>
                        </UITooltip>
                      </DataTableHead>
                      <DataTableHead>Status</DataTableHead>
                    </DataTableHeader>
                    <DataTableBody>
                      {tierAggregates.map(tier => (
                        <Fragment key={tier.tier}>
                          <DataTableRow
                            className="cursor-pointer hover:bg-gray-50 font-medium"
                            onClick={() => setExpandedTier(expandedTier === tier.tier ? null : tier.tier)}
                          >
                            <DataTableCell>
                              {expandedTier === tier.tier
                                ? <ChevronDown className="w-4 h-4 text-gray-400" />
                                : <ChevronRight className="w-4 h-4 text-gray-400" />
                              }
                            </DataTableCell>
                            <DataTableCell>
                              <p className="text-sm font-medium text-gray-900">{tier.label}</p>
                              <p className="text-xs text-gray-500 font-normal">{tier.description}</p>
                            </DataTableCell>
                            <DataTableCell className="text-right tabular-nums">{tier.fixtures}</DataTableCell>
                            <DataTableCell className="text-right">
                              <Badge variant={tier.avgSourceUtil < 50 ? 'warning' : 'default'} size="sm">{tier.avgSourceUtil}%</Badge>
                            </DataTableCell>
                            <DataTableCell className="text-right">
                              <Badge variant={tier.avgTargetUtil > 85 ? 'success' : 'default'} size="sm">{tier.avgTargetUtil}%</Badge>
                            </DataTableCell>
                            <DataTableCell className="text-right tabular-nums">Rs {tier.transport.toFixed(1)}L</DataTableCell>
                            <DataTableCell className="text-right tabular-nums text-green-700">+{tier.gmrof.toFixed(1)} Cr</DataTableCell>
                            <DataTableCell className="text-right">
                              <Badge variant={Number(tier.roi) >= 50 ? 'success' : Number(tier.roi) >= 10 ? 'default' : 'warning'} size="sm">{tier.roi}x</Badge>
                            </DataTableCell>
                            <DataTableCell>
                              {tier.pending > 0 ? <Badge variant="warning" size="sm">{tier.pending} pending</Badge> : <span className="text-gray-400">—</span>}
                            </DataTableCell>
                          </DataTableRow>

                          {/* Expanded: individual recs in this tier */}
                          {expandedTier === tier.tier && tier.recs.map(rec => {
                            const actionOverride = rebalancingActions[rec.id];
                            const effectiveStatus = actionOverride ?? rec.status;
                            const sb = rebalancingStatusBadge(effectiveStatus);
                            const isPending = rec.status === 'recommended' && !actionOverride;
                            return (
                              <DataTableRow key={rec.id} className="bg-gray-50/60">
                                <DataTableCell>
                                  {isPending && (
                                    <input
                                      type="checkbox"
                                      className="rounded border-gray-300"
                                      checked={selectedRebalancing.has(rec.id)}
                                      onChange={(e) => {
                                        const next = new Set(selectedRebalancing);
                                        if (e.target.checked) next.add(rec.id); else next.delete(rec.id);
                                        setSelectedRebalancing(next);
                                      }}
                                    />
                                  )}
                                </DataTableCell>
                                <DataTableCell className="pl-8">
                                  <p className="text-sm text-gray-900">{rec.fixtureType} <span className="text-gray-400">×{rec.quantity}</span></p>
                                  <p className="text-xs text-gray-500">{rec.sourceStoreName} → {rec.targetStoreName}</p>
                                </DataTableCell>
                                <DataTableCell className="text-right tabular-nums text-xs text-gray-500">{rec.quantity}</DataTableCell>
                                <DataTableCell className="text-right">
                                  <Badge variant={rec.sourceUtilization < 50 ? 'warning' : 'default'} size="sm">{rec.sourceUtilization}%</Badge>
                                </DataTableCell>
                                <DataTableCell className="text-right">
                                  <Badge variant={rec.targetUtilization > 85 ? 'success' : 'default'} size="sm">{rec.targetUtilization}%</Badge>
                                </DataTableCell>
                                <DataTableCell className="text-right tabular-nums text-xs">Rs {rec.transportCostLakhs.toFixed(2)}L</DataTableCell>
                                <DataTableCell className="text-right tabular-nums text-green-700 text-xs">+{rec.gmrofImpact} Cr</DataTableCell>
                                <DataTableCell className="text-right tabular-nums text-xs">
                                  {rec.transportCostLakhs > 0 ? `${((rec.gmrofImpact * 100) / rec.transportCostLakhs).toFixed(1)}x` : '—'}
                                </DataTableCell>
                                <DataTableCell>
                                  <Badge variant={sb.variant} size="sm">{sb.label}</Badge>
                                </DataTableCell>
                              </DataTableRow>
                            );
                          })}
                        </Fragment>
                      ))}
                    </DataTableBody>
                  </DataTable>

                  {/* Fixture Type Conversions — clustered by conversion type */}
                  <div className="flex items-center gap-2 pt-4">
                    <SectionHeader title="Fixture Type Conversions" subtitle="From existing network inventory — grouped by conversion type" />
                    <NotionalBadge />
                  </div>
                  <DataTable>
                    <DataTableHeader>
                      <DataTableHead className="w-8" />
                      <DataTableHead>Conversion</DataTableHead>
                      <DataTableHead>Segments</DataTableHead>
                      <DataTableHead className="text-right">Stores</DataTableHead>
                      <DataTableHead className="text-right">
                        <UITooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex items-center gap-1 cursor-help">Fixtures <Info className="w-3 h-3 text-gray-400" /></span>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            <p className="text-xs">Total number of physical fixture units being converted across all stores in this group.</p>
                          </TooltipContent>
                        </UITooltip>
                      </DataTableHead>
                      <DataTableHead className="text-center">
                        <UITooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex items-center gap-1 cursor-help">Inventory <Info className="w-3 h-3 text-gray-400" /></span>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            <p className="text-xs">Fixture availability for the conversion. Shows how many stores have target fixtures in stock (DC or store surplus). <strong>Not ready</strong> = procurement needed, linked to next RA/buying cycle.</p>
                          </TooltipContent>
                        </UITooltip>
                      </DataTableHead>
                      <DataTableHead className="text-right">
                        <UITooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex items-center gap-1 cursor-help">Capacity Δ <Info className="w-3 h-3 text-gray-400" /></span>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            <p className="text-xs">Net change in <strong>option slots</strong> — how many additional SKU options the fixtures can hold after conversion. Positive = more display capacity.</p>
                          </TooltipContent>
                        </UITooltip>
                      </DataTableHead>
                      <DataTableHead className="text-right">
                        <UITooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex items-center gap-1 cursor-help">Fixture Cost <Info className="w-3 h-3 text-gray-400" /></span>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            <p className="text-xs">Estimated cost of <strong>procuring and installing</strong> the new fixtures (not transport). Includes fixture purchase, installation labour, and old fixture removal.</p>
                          </TooltipContent>
                        </UITooltip>
                      </DataTableHead>
                      <DataTableHead className="text-right">
                        <UITooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex items-center gap-1 cursor-help">Pending <Info className="w-3 h-3 text-gray-400" /></span>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            <p className="text-xs">Conversions in <strong>Recommended</strong> status — AI has identified the opportunity but awaiting Space Planner review and approval before execution can begin.</p>
                          </TooltipContent>
                        </UITooltip>
                      </DataTableHead>
                    </DataTableHeader>
                    <DataTableBody>
                      {conversionGroups.map(g => (
                        <Fragment key={g.key}>
                          <DataTableRow
                            className="cursor-pointer hover:bg-gray-50"
                            onClick={() => setExpandedConvGroup(expandedConvGroup === g.key ? null : g.key)}
                          >
                            <DataTableCell>
                              {expandedConvGroup === g.key
                                ? <ChevronDown className="w-4 h-4 text-gray-400" />
                                : <ChevronRight className="w-4 h-4 text-gray-400" />
                              }
                            </DataTableCell>
                            <DataTableCell>
                              <p className="text-sm font-medium text-gray-900">{g.from} <span className="text-gray-400">→</span> {g.to}</p>
                            </DataTableCell>
                            <DataTableCell>
                              <div className="flex flex-wrap gap-1">
                                {g.segments.map(s => <Badge key={s} variant="outline" size="sm">{s}</Badge>)}
                              </div>
                            </DataTableCell>
                            <DataTableCell className="text-right tabular-nums">{g.stores}</DataTableCell>
                            <DataTableCell className="text-right tabular-nums">{g.totalQty}</DataTableCell>
                            <DataTableCell className="text-center">
                              <span className={cn('text-xs', g.inventoryReady === g.inventoryTotal ? 'text-green-700' : 'text-amber-700')}>
                                {g.inventoryReady}/{g.inventoryTotal} ready
                              </span>
                              {g.nextRACycle && (
                                <p className="text-xs text-amber-600 mt-0.5">Next: {g.nextRACycle}</p>
                              )}
                            </DataTableCell>
                            <DataTableCell className="text-right">
                              <span className={g.netCapacity >= 0 ? 'text-green-700 tabular-nums' : 'text-amber-700 tabular-nums'}>
                                {g.netCapacity >= 0 ? '+' : ''}{g.netCapacity} options
                              </span>
                            </DataTableCell>
                            <DataTableCell className="text-right tabular-nums">Rs {(g.totalCost / 1000).toFixed(0)}K</DataTableCell>
                            <DataTableCell className="text-right">
                              {g.pending > 0 ? <Badge variant="warning" size="sm">{g.pending} awaiting approval</Badge> : <span className="text-gray-400">—</span>}
                            </DataTableCell>
                          </DataTableRow>

                          {/* Expanded: store-level detail */}
                          {expandedConvGroup === g.key && g.items.map(fc => {
                            const csb = conversionStatusBadge(fc.status);
                            const capacityDelta = fc.impactPreview.afterCapacity - fc.impactPreview.beforeCapacity;
                            const invLabel = fc.inventoryStatus.source === 'dc' ? 'DC'
                              : fc.inventoryStatus.source === 'store-surplus' ? 'Store Surplus'
                              : 'Procurement';
                            return (
                              <DataTableRow key={fc.id} className="bg-gray-50/60">
                                <DataTableCell />
                                <DataTableCell className="pl-8">
                                  <p className="text-sm text-gray-900">{fc.storeName}</p>
                                  <p className="text-xs text-gray-500">{fc.trigger}</p>
                                </DataTableCell>
                                <DataTableCell>
                                  <Badge variant="outline" size="sm">{fc.segmentAffected}</Badge>
                                </DataTableCell>
                                <DataTableCell className="text-right text-xs text-gray-500">1</DataTableCell>
                                <DataTableCell className="text-right tabular-nums text-xs">{fc.quantity}</DataTableCell>
                                <DataTableCell className="text-center">
                                  <span className={cn('inline-flex items-center gap-1 text-xs', fc.inventoryStatus.available ? 'text-green-700' : 'text-red-600')}>
                                    {fc.inventoryStatus.available ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                                    {invLabel}
                                  </span>
                                  {!fc.inventoryStatus.available && fc.inventoryStatus.nextRACycle && (
                                    <p className="text-xs text-amber-600 mt-0.5">{fc.inventoryStatus.nextRACycle}</p>
                                  )}
                                </DataTableCell>
                                <DataTableCell className="text-right">
                                  <span className={cn('text-xs tabular-nums', capacityDelta >= 0 ? 'text-green-700' : 'text-amber-700')}>
                                    {capacityDelta >= 0 ? '+' : ''}{capacityDelta}
                                  </span>
                                </DataTableCell>
                                <DataTableCell className="text-right tabular-nums text-xs">Rs {fc.impactPreview.costEstimate.toLocaleString('en-IN')}</DataTableCell>
                                <DataTableCell>
                                  <Badge variant={csb.variant} size="sm">{csb.label}</Badge>
                                </DataTableCell>
                              </DataTableRow>
                            );
                          })}
                        </Fragment>
                      ))}
                    </DataTableBody>
                  </DataTable>
                  {/* ── Renovation Opportunity: Bundle fixture conversions with ongoing renovations ── */}
                  {(() => {
                    const activeRenovations = data.nsoStores.filter(s => s.projectType !== 'nso' && s.overallStatus !== 'completed');
                    if (activeRenovations.length === 0) return null;
                    // Cross-reference: which fixture conversions can be bundled with these renovations
                    const renovationStoreNames = new Set(activeRenovations.map(s => s.storeName));
                    const bundleableConversions = data.fixtureConversions.filter(fc => renovationStoreNames.has(fc.storeName));
                    const totalBundled = activeRenovations.reduce((s, r) => s + (r.bundledFixtureChanges?.length ?? 0), 0);
                    return (
                      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 space-y-3">
                        <div className="flex items-start gap-2">
                          <Wrench className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900">
                              Renovation Opportunity — {activeRenovations.length} store{activeRenovations.length > 1 ? 's' : ''} with active renovation/refit
                            </p>
                            <p className="text-xs text-gray-600 mt-0.5">
                              These stores already have downtime and contractor budgets allocated. Fixture type conversions can be bundled at zero incremental downtime and shared installation costs.
                            </p>
                          </div>
                        </div>
                        <DataTable>
                          <DataTableHeader>
                            <DataTableHead>Store</DataTableHead>
                            <DataTableHead>Project Type</DataTableHead>
                            <DataTableHead>Progress</DataTableHead>
                            <DataTableHead>Target Date</DataTableHead>
                            <DataTableHead>Bundled Conversions</DataTableHead>
                            <DataTableHead>Additional Opportunities</DataTableHead>
                          </DataTableHeader>
                          <DataTableBody>
                            {activeRenovations.map(s => {
                              const additionalOps = bundleableConversions.filter(fc => fc.storeName === s.storeName && fc.status === 'recommended');
                              return (
                                <DataTableRow key={s.storeId}>
                                  <DataTableCell>
                                    <p className="text-sm font-medium text-gray-900">{s.storeName}</p>
                                    <p className="text-xs text-gray-500">{s.city} · {s.format}</p>
                                  </DataTableCell>
                                  <DataTableCell>
                                    <Badge variant={s.projectType === 'renovation' ? 'warning' : 'info'} size="sm">{s.projectType === 'renovation' ? 'Renovation' : 'Refit'}</Badge>
                                  </DataTableCell>
                                  <DataTableCell>
                                    <div className="flex items-center gap-2">
                                      <div className="w-16 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                                        <div className={cn('h-full rounded-full', s.overallStatus === 'delayed' ? 'bg-amber-500' : 'bg-green-500')} style={{ width: `${Math.round((s.currentStep / s.steps.length) * 100)}%` }} />
                                      </div>
                                      <span className="text-xs text-gray-600 tabular-nums">{s.currentStep}/{s.steps.length}</span>
                                    </div>
                                  </DataTableCell>
                                  <DataTableCell className="text-xs text-gray-700">{s.targetLaunchDate}</DataTableCell>
                                  <DataTableCell>
                                    {s.bundledFixtureChanges && s.bundledFixtureChanges.length > 0 ? (
                                      <div className="flex flex-wrap gap-1">
                                        {s.bundledFixtureChanges.map((b, i) => (
                                          <Badge key={i} variant="outline" size="sm">{b.from} → {b.to} ×{b.qty}</Badge>
                                        ))}
                                      </div>
                                    ) : <span className="text-xs text-gray-400">None planned</span>}
                                  </DataTableCell>
                                  <DataTableCell>
                                    {additionalOps.length > 0 ? (
                                      <Badge variant="info" size="sm">{additionalOps.length} can be bundled</Badge>
                                    ) : (
                                      <span className="text-xs text-gray-400">—</span>
                                    )}
                                  </DataTableCell>
                                </DataTableRow>
                              );
                            })}
                          </DataTableBody>
                        </DataTable>
                        {totalBundled > 0 && (
                          <p className="text-xs text-indigo-700">
                            {totalBundled} fixture conversion{totalBundled > 1 ? 's' : ''} already planned as part of renovation scope — saving est. 2-3 days of additional store downtime per conversion.
                          </p>
                        )}
                      </div>
                    );
                  })()}
                </div>
                </TooltipProvider>
              );
            }

            // ── Space Planner: detailed fixture-level view ──
            const pendingBatchCount = displayRecs.filter(r => r.status === 'recommended' && !rebalancingActions[r.id]).length;
            return (
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <SectionHeader title="Fixture Rebalancing" subtitle="AI-recommended ground fixture transfers based on utilization & GMROF impact" />
                  <NotionalBadge />
                </div>
                <MetricGrid>
                  <MetricCard
                    label="Pending Recommendations"
                    value={String(pendingRebalancingCount)}
                    icon={ArrowRight}
                    iconColor="info"
                    subtitle={`Across ${uniqueStores} stores`}
                    status={pendingRebalancingCount > 5 ? 'warning' : 'on-track'}
                  />
                  <MetricCard
                    label="Est. GMROF Uplift"
                    value={`+${totalGmrofImpact.toFixed(1)} Cr`}
                    icon={TrendingUp}
                    iconColor="success"
                    subtitle="Estimated network uplift"
                    status="on-track"
                  />
                  <MetricCard
                    label="Transport Cost"
                    value={`Rs ${totalTransportCost.toFixed(1)}L`}
                    icon={Truck}
                    iconColor="warning"
                    subtitle={`Payback: ${totalTransportCost > 0 ? ((totalGmrofImpact * 100) / totalTransportCost).toFixed(1) : 0}x transport cost`}
                    status={totalTransportCost > 10 ? 'warning' : 'on-track'}
                  />
                </MetricGrid>
                {pendingBatchCount > 0 && (
                  <div className="flex justify-end">
                    <button
                      className="rounded bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
                      onClick={() => {
                        const next = { ...rebalancingActions };
                        displayRecs.forEach(r => { if (r.status === 'recommended' && !next[r.id]) next[r.id] = 'accepted'; });
                        setRebalancingActions(next);
                      }}
                    >
                      Batch Approve All ({pendingBatchCount})
                    </button>
                  </div>
                )}
                <DataTable>
                  <DataTableHeader>
                    <DataTableHead>Fixture Type</DataTableHead>
                    <DataTableHead>Source Store</DataTableHead>
                    <DataTableHead className="text-right">Source Util%</DataTableHead>
                    <DataTableHead>Target Store</DataTableHead>
                    <DataTableHead className="text-right">Target Util%</DataTableHead>
                    <DataTableHead className="text-right">Qty</DataTableHead>
                    <DataTableHead>Tier</DataTableHead>
                    <DataTableHead className="text-right">Transport</DataTableHead>
                    <DataTableHead className="text-right">GMROF Impact</DataTableHead>
                    <DataTableHead>Status</DataTableHead>
                    <DataTableHead className="text-right">Actions</DataTableHead>
                  </DataTableHeader>
                  <DataTableBody>
                    {displayRecs.map(rec => {
                      const actionOverride = rebalancingActions[rec.id];
                      const effectiveStatus = actionOverride ?? rec.status;
                      const sb = rebalancingStatusBadge(effectiveStatus);
                      const tierLabel = rec.movementTier === 'intra-cluster' ? 'Cluster' : rec.movementTier === 'intra-city' ? 'City' : rec.movementTier === 'inter-city' ? 'State' : 'Inter-State';
                      return (
                        <DataTableRow key={rec.id}>
                          <DataTableCell className="font-medium">{rec.fixtureType}</DataTableCell>
                          <DataTableCell>
                            <p className="text-sm">{rec.sourceStoreName}</p>
                            <p className="text-xs text-gray-500">{rec.sourceCluster}</p>
                          </DataTableCell>
                          <DataTableCell className="text-right">
                            <Badge variant={rec.sourceUtilization < 50 ? 'warning' : 'default'} size="sm">{rec.sourceUtilization}%</Badge>
                          </DataTableCell>
                          <DataTableCell>
                            <p className="text-sm">{rec.targetStoreName}</p>
                            <p className="text-xs text-gray-500">{rec.targetCluster}</p>
                          </DataTableCell>
                          <DataTableCell className="text-right">
                            <Badge variant={rec.targetUtilization > 90 ? 'error' : 'default'} size="sm">{rec.targetUtilization}%</Badge>
                          </DataTableCell>
                          <DataTableCell className="text-right">{rec.quantity}</DataTableCell>
                          <DataTableCell>
                            <Badge variant={rec.movementTier === 'intra-cluster' ? 'success' : rec.movementTier === 'inter-state' ? 'warning' : 'default'} size="sm">{tierLabel}</Badge>
                          </DataTableCell>
                          <DataTableCell className="text-right tabular-nums text-xs">Rs {rec.transportCostLakhs.toFixed(2)}L</DataTableCell>
                          <DataTableCell className="text-right text-green-700 font-medium">+{rec.gmrofImpact} Cr</DataTableCell>
                          <DataTableCell>
                            <Badge variant={sb.variant} size="sm">{sb.label}</Badge>
                          </DataTableCell>
                          <DataTableCell className="text-right">
                            {rec.status === 'recommended' && !actionOverride && (
                              <div className="flex gap-1 justify-end">
                                <button className="rounded bg-indigo-600 px-2 py-1 text-xs font-medium text-white hover:bg-indigo-700" onClick={() => setRebalancingActions(prev => ({ ...prev, [rec.id]: 'accepted' }))}>Accept</button>
                                <button className="rounded border border-gray-300 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50" onClick={() => setRebalancingActions(prev => ({ ...prev, [rec.id]: 'rejected' }))}>Reject</button>
                              </div>
                            )}
                          </DataTableCell>
                        </DataTableRow>
                      );
                    })}
                  </DataTableBody>
                </DataTable>
                {/* Fixture Type Conversions — detail view */}
                <div className="flex items-center gap-2 pt-4">
                  <SectionHeader title="Fixture Type Conversions" subtitle="In-store fixture replacements for density optimization and capacity upgrades" />
                  <NotionalBadge />
                </div>
                <TooltipProvider>
                <DataTable>
                  <DataTableHeader>
                      <DataTableHead>Store</DataTableHead>
                      <DataTableHead>Type</DataTableHead>
                      <DataTableHead>From → To</DataTableHead>
                      <DataTableHead className="text-right">Qty</DataTableHead>
                      <DataTableHead>Segment</DataTableHead>
                      <DataTableHead>Trigger</DataTableHead>
                      <DataTableHead className="text-center">Inventory</DataTableHead>
                      <DataTableHead className="text-right">Capacity Δ</DataTableHead>
                      <DataTableHead className="text-right">Cost</DataTableHead>
                      <DataTableHead>Status</DataTableHead>
                  </DataTableHeader>
                  <DataTableBody>
                    {data.fixtureConversions.map(fc => {
                      const csb = conversionStatusBadge(fc.status);
                      const capacityDelta = fc.impactPreview.afterCapacity - fc.impactPreview.beforeCapacity;
                      const invLabel = fc.inventoryStatus.source === 'dc' ? 'DC'
                        : fc.inventoryStatus.source === 'store-surplus' ? 'Store Surplus'
                        : 'Procurement';
                      return (
                        <DataTableRow key={fc.id}>
                          <DataTableCell className="font-medium">{fc.storeName}</DataTableCell>
                          <DataTableCell>
                            <Badge variant="outline" size="sm">{fc.conversionType}</Badge>
                          </DataTableCell>
                          <DataTableCell>
                            <span className="text-sm">{fc.fromFixture} <span className="text-gray-400">→</span> {fc.toFixture}</span>
                          </DataTableCell>
                          <DataTableCell className="text-right">{fc.quantity}</DataTableCell>
                          <DataTableCell className="text-sm">{fc.segmentAffected}</DataTableCell>
                          <DataTableCell className="text-xs text-gray-600 max-w-[180px] truncate">{fc.trigger}</DataTableCell>
                          <DataTableCell className="text-center">
                            <UITooltip>
                              <TooltipTrigger asChild>
                                <span className={cn('inline-flex items-center gap-1 text-xs cursor-help', fc.inventoryStatus.available ? 'text-green-700' : 'text-red-600')}>
                                  {fc.inventoryStatus.available ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                                  {invLabel}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-xs">
                                <p className="text-xs">{fc.inventoryStatus.unitsInStock} of {fc.inventoryStatus.unitsNeeded} units available ({invLabel})</p>
                                {!fc.inventoryStatus.available && (
                                  <p className="text-xs mt-0.5 text-amber-600">
                                    Procurement required{fc.inventoryStatus.nextRACycle ? ` — linked to ${fc.inventoryStatus.nextRACycle} buying cycle` : ' — no RA cycle linked yet'}
                                  </p>
                                )}
                              </TooltipContent>
                            </UITooltip>
                          </DataTableCell>
                          <DataTableCell className="text-right">
                            <span className={capacityDelta >= 0 ? 'text-green-700' : 'text-amber-700'}>
                              {capacityDelta >= 0 ? '+' : ''}{capacityDelta}
                            </span>
                          </DataTableCell>
                          <DataTableCell className="text-right">Rs {fc.impactPreview.costEstimate.toLocaleString('en-IN')}</DataTableCell>
                          <DataTableCell>
                            <UITooltip>
                              <TooltipTrigger asChild>
                                <span className="cursor-help">
                                  <Badge variant={csb.variant} size="sm">{csb.label}</Badge>
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-xs">
                                <p className="text-xs">
                                  {fc.status === 'recommended' && 'AI-recommended — awaiting Space Planner approval'}
                                  {fc.status === 'approved' && 'Approved by Space Planner — awaiting store execution'}
                                  {fc.status === 'in-progress' && 'Conversion being executed at store'}
                                  {fc.status === 'completed' && 'Conversion completed and verified'}
                                  {fc.status === 'rejected' && 'Rejected by Space Planner — will not proceed'}
                                </p>
                              </TooltipContent>
                            </UITooltip>
                          </DataTableCell>
                        </DataTableRow>
                      );
                    })}
                  </DataTableBody>
                </DataTable>
                </TooltipProvider>

                {/* ── Renovation Opportunity: Bundle conversions with ongoing renovations ── */}
                {(() => {
                  const activeRenovations = data.nsoStores.filter(s => s.projectType !== 'nso' && s.overallStatus !== 'completed');
                  if (activeRenovations.length === 0) return null;
                  const renovationStoreNames = new Set(activeRenovations.map(s => s.storeName));
                  const bundleableConversions = data.fixtureConversions.filter(fc => renovationStoreNames.has(fc.storeName) && fc.status === 'recommended');
                  return (
                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 space-y-3 mt-4">
                      <div className="flex items-start gap-2">
                        <Wrench className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900">
                            Renovation Opportunity — Bundle Fixture Conversions
                          </p>
                          <p className="text-xs text-gray-600 mt-0.5">
                            {activeRenovations.length} store{activeRenovations.length > 1 ? 's' : ''} with active renovation/refit. Fixture conversions can be bundled at zero incremental downtime.
                          </p>
                        </div>
                      </div>
                      {activeRenovations.map(s => {
                        const storeConversions = bundleableConversions.filter(fc => fc.storeName === s.storeName);
                        return (
                          <div key={s.storeId} className="bg-white rounded-lg border border-indigo-100 p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-gray-900">{s.storeName}</p>
                                <Badge variant={s.projectType === 'renovation' ? 'warning' : 'info'} size="sm">{s.projectType === 'renovation' ? 'Renovation' : 'Refit'}</Badge>
                                <Badge variant={s.overallStatus === 'delayed' ? 'error' : 'success'} size="sm">Step {s.currentStep}/{s.steps.length}</Badge>
                              </div>
                              <span className="text-xs text-gray-500">Target: {s.targetLaunchDate}</span>
                            </div>
                            {s.renovationScope && (
                              <p className="text-xs text-gray-600 mb-2">{s.renovationScope}</p>
                            )}
                            {s.bundledFixtureChanges && s.bundledFixtureChanges.length > 0 && (
                              <div className="mb-2">
                                <p className="text-[10px] uppercase tracking-wide text-gray-500 font-medium mb-1">Already Bundled</p>
                                <div className="flex flex-wrap gap-1">
                                  {s.bundledFixtureChanges.map((b, i) => (
                                    <Badge key={i} variant="success" size="sm">{b.from} → {b.to} ×{b.qty}</Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            {storeConversions.length > 0 && (
                              <div>
                                <p className="text-[10px] uppercase tracking-wide text-amber-700 font-medium mb-1">Can Also Bundle ({storeConversions.length})</p>
                                <div className="flex flex-wrap gap-1">
                                  {storeConversions.map(fc => (
                                    <Badge key={fc.id} variant="warning" size="sm">{fc.fromFixture} → {fc.toFixture} ×{fc.quantity} ({fc.segmentAffected})</Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            );
          })()}
        </TabsContent>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* SPACE PLANNER: FIXTURE TRANSFERS (STO/STN)                       */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="fixture-transfers">
          {(() => {
            const transfers = data.fixtureTransfers;
            const countByStatus = (s: string) => transfers.filter(t => t.status === s).length;
            return (
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <SectionHeader title="Fixture Transfers (STO/STN)" subtitle="Track fixture movements between stores — from request to completion" />
                  <NotionalBadge />
                </div>
                <MetricGrid>
                  <MetricCard label="Raised" value={String(countByStatus('raised'))} icon={Package} iconColor="info" subtitle="Awaiting dispatch" />
                  <MetricCard label="Dispatched" value={String(countByStatus('dispatched'))} icon={Send} iconColor="info" subtitle="Sent from source" />
                  <MetricCard label="In Transit" value={String(countByStatus('in-transit'))} icon={Truck} iconColor="warning" subtitle="En route to destination" />
                  <MetricCard label="Inwarded" value={String(countByStatus('inwarded'))} icon={Archive} iconColor="info" subtitle="Received at destination" />
                  <MetricCard label="Completed" value={String(countByStatus('completed'))} icon={CheckCircle2} iconColor="success" subtitle="Transfer closed" />
                </MetricGrid>
                <DataTable>
                  <DataTableHeader>
                      <DataTableHead>STO#</DataTableHead>
                      <DataTableHead>Fixture Type</DataTableHead>
                      <DataTableHead className="text-right">Qty</DataTableHead>
                      <DataTableHead>Source Store</DataTableHead>
                      <DataTableHead>Dest Store</DataTableHead>
                      <DataTableHead>Status</DataTableHead>
                      <DataTableHead>Raised Date</DataTableHead>
                      <DataTableHead>Raised By</DataTableHead>
                  </DataTableHeader>
                  <DataTableBody>
                    {transfers.map(t => {
                      const sb = transferStatusBadge(t.status);
                      return (
                        <DataTableRow key={t.id}>
                          <DataTableCell className="font-medium">{t.stoNumber}</DataTableCell>
                          <DataTableCell>{t.fixtureType}</DataTableCell>
                          <DataTableCell className="text-right">{t.quantity}</DataTableCell>
                          <DataTableCell>{t.sourceStoreName}</DataTableCell>
                          <DataTableCell>{t.destStoreName}</DataTableCell>
                          <DataTableCell><Badge variant={sb.variant}>{sb.label}</Badge></DataTableCell>
                          <DataTableCell>{t.raisedAt}</DataTableCell>
                          <DataTableCell>{t.raisedBy}</DataTableCell>
                        </DataTableRow>
                      );
                    })}
                  </DataTableBody>
                </DataTable>
              </div>
            );
          })()}
        </TabsContent>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* SPACE PLANNER: STORE PROJECTS (NSO + Renovation + Refit)          */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="nso-tracker">
          {(() => {
            const allProjects = data.nsoStores;
            const nsoCount = allProjects.filter(s => s.projectType === 'nso').length;
            const renCount = allProjects.filter(s => s.projectType === 'renovation').length;
            const refitCount = allProjects.filter(s => s.projectType === 'refit').length;
            const nsoStatusBadge = (status: NSOStore['overallStatus']): { variant: 'default' | 'success' | 'warning' | 'error'; label: string } => {
              const map: Record<NSOStore['overallStatus'], { variant: 'default' | 'success' | 'warning' | 'error'; label: string }> = {
                'on-track': { variant: 'success', label: 'On Track' },
                'delayed': { variant: 'warning', label: 'Delayed' },
                'at-risk': { variant: 'error', label: 'At Risk' },
                'completed': { variant: 'default', label: 'Completed' },
              };
              return map[status];
            };
            const projectTypeBadge = (type: NSOStore['projectType']): { variant: 'primary' | 'warning' | 'info'; label: string } => {
              if (type === 'nso') return { variant: 'primary', label: 'New Store' };
              if (type === 'renovation') return { variant: 'warning', label: 'Renovation' };
              return { variant: 'info', label: 'Refit' };
            };
            const stepIcon = (status: 'pending' | 'in-progress' | 'completed' | 'blocked') => {
              if (status === 'completed') return <CheckCircle2 className="w-4 h-4 text-green-600" />;
              if (status === 'in-progress') return <Clock className="w-4 h-4 text-indigo-600 animate-pulse" />;
              if (status === 'blocked') return <XCircle className="w-4 h-4 text-red-600" />;
              return <Circle className="w-4 h-4 text-gray-300" />;
            };
            return (
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <SectionHeader title="Store Projects" subtitle="NSO, renovation, and refit tracker — all stores in flux" />
                  <NotionalBadge />
                </div>

                <MetricGrid columns={4}>
                  <MetricCard label="Total Projects" value={allProjects.length} subtitle={`${nsoCount} NSO · ${renCount} renovation`} />
                  <MetricCard label="Refits" value={refitCount} subtitle="Fixture swap / segment shift" />
                  <MetricCard label="Delayed / At Risk" value={allProjects.filter(s => s.overallStatus === 'delayed' || s.overallStatus === 'at-risk').length} status="critical" />
                </MetricGrid>

                <div className="space-y-3">
                  {allProjects.map(nso => {
                    const isExpanded = expandedNSOId === nso.storeId;
                    const badge = nsoStatusBadge(nso.overallStatus);
                    const ptBadge = projectTypeBadge(nso.projectType);
                    return (
                      <div key={nso.storeId} className="border border-gray-200 rounded-lg bg-white overflow-hidden">
                        <button
                          onClick={() => setExpandedNSOId(isExpanded ? null : nso.storeId)}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                        >
                          {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />}
                          <Badge variant={ptBadge.variant} size="sm">{ptBadge.label}</Badge>
                          <span className="text-sm font-medium text-gray-900 min-w-[180px]">{nso.storeName}</span>
                          <Badge variant="outline" size="sm">{nso.format}</Badge>
                          <span className="text-xs text-gray-500">{nso.city}</span>
                          <span className="text-xs text-gray-500">{nso.carpetArea.toLocaleString()} sft</span>
                          <span className="text-xs text-gray-500 ml-auto">{nso.projectType === 'nso' ? 'Launch' : 'Target'}: {nso.targetLaunchDate}</span>
                          <Badge variant={badge.variant} size="sm">{badge.label}</Badge>
                          <span className="text-xs font-medium text-gray-700 tabular-nums">Step {nso.currentStep}/{nso.steps.length}</span>
                        </button>

                        {isExpanded && (
                          <div className="px-4 pb-4 pt-1 border-t border-gray-100">
                            {/* Renovation/Refit scope */}
                            {nso.renovationScope && (
                              <div className="flex items-start gap-2 px-3 py-2 mb-3 rounded-md bg-indigo-50 border border-indigo-200">
                                <Wrench className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                                <div>
                                  <span className="text-xs font-semibold text-indigo-700">Scope: </span>
                                  <span className="text-xs text-indigo-800">{nso.renovationScope}</span>
                                </div>
                              </div>
                            )}

                            {/* Bundled fixture changes */}
                            {nso.bundledFixtureChanges && nso.bundledFixtureChanges.length > 0 && (
                              <div className="flex items-start gap-2 px-3 py-2 mb-3 rounded-md bg-purple-50 border border-purple-200">
                                <Layers className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                                <div>
                                  <span className="text-xs font-semibold text-purple-700">Bundled Fixture Changes: </span>
                                  <span className="text-xs text-purple-800">
                                    {nso.bundledFixtureChanges.map((fc, i) => (
                                      <span key={i}>{i > 0 ? ' · ' : ''}{fc.from} → {fc.to} ({fc.qty})</span>
                                    ))}
                                  </span>
                                </div>
                              </div>
                            )}

                            {nso.delayReason && (
                              <div className="flex items-center gap-2 px-3 py-2 mb-3 rounded-md bg-amber-50 border border-amber-200">
                                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                                <span className="text-xs text-amber-800">{nso.delayReason}</span>
                              </div>
                            )}

                            {/* Site Intelligence — LFL, Competitors, Catchment, Gap Analysis (NSO only) */}
                            {nso.siteIntel && (() => {
                              const nsoCompetitors = getCompetitorsForStore(nso.storeId);
                              const gapScore = competitiveGapScores.find(g => g.storeId === nso.storeId);
                              const catchment = catchmentProfiles.find(c => c.storeId === nso.storeId);
                              const gapBandColor = !gapScore ? 'text-gray-500' : gapScore.gapBand === 'leader' ? 'text-green-700' : gapScore.gapBand === 'competitive' ? 'text-blue-700' : gapScore.gapBand === 'gap-exists' ? 'text-amber-700' : 'text-red-700';
                              const gapBandBg = !gapScore ? 'bg-gray-100' : gapScore.gapBand === 'leader' ? 'bg-green-100' : gapScore.gapBand === 'competitive' ? 'bg-blue-100' : gapScore.gapBand === 'gap-exists' ? 'bg-amber-100' : 'bg-red-100';
                              return (
                                <div className="mb-4 space-y-3">
                                  {/* Row 1: LFL + Projections + Catchment */}
                                  <div className="grid grid-cols-3 gap-3">
                                    {/* LFL Reference Store */}
                                    <div className="rounded-md border border-blue-200 bg-blue-50 p-3">
                                      <p className="text-[10px] font-semibold text-blue-700 uppercase tracking-wide mb-1.5">LFL Reference Store</p>
                                      <p className="text-sm font-semibold text-gray-900">{nso.siteIntel.lflStore.storeName}</p>
                                      <p className="text-xs text-gray-600">{nso.siteIntel.lflStore.city} · Grade {nso.siteIntel.lflStore.grade} · {nso.siteIntel.lflStore.carpetArea.toLocaleString()} sft</p>
                                      <div className="mt-2 flex gap-3 text-xs">
                                        <span className="text-gray-600">SPSF <span className="font-semibold text-gray-900">Rs {nso.siteIntel.lflStore.spsf}</span></span>
                                        <span className="text-gray-600">GMROF <span className="font-semibold text-gray-900">Rs {nso.siteIntel.lflStore.gmrof}</span></span>
                                      </div>
                                      <div className="mt-1.5 flex items-center gap-1">
                                        <div className="flex-1 h-1 bg-blue-200 rounded-full overflow-hidden">
                                          <div className="h-full bg-blue-600 rounded-full" style={{ width: `${nso.siteIntel.lflStore.similarity}%` }} />
                                        </div>
                                        <span className="text-[10px] font-medium text-blue-700">{nso.siteIntel.lflStore.similarity}% match</span>
                                      </div>
                                      <div className="mt-2 pt-2 border-t border-blue-200 flex gap-3 text-xs">
                                        <span className="text-gray-600">Proj. SPSF <span className="font-semibold text-indigo-700">Rs {nso.siteIntel.projectedSpsf}</span></span>
                                        <span className="text-gray-600">Proj. GMROF <span className="font-semibold text-indigo-700">Rs {nso.siteIntel.projectedGmrof}</span></span>
                                      </div>
                                    </div>

                                    {/* Catchment Profile — from Store Intelligence */}
                                    <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
                                      <p className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wide mb-1.5">Catchment Profile</p>
                                      {catchment ? (
                                        <div className="space-y-1 text-xs">
                                          <div className="flex justify-between"><span className="text-gray-600">Affluence</span><span className="font-medium text-gray-900">{catchment.affluenceScore}/100</span></div>
                                          <div className="flex justify-between"><span className="text-gray-600">Fashion Forward</span><span className="font-medium text-gray-900">{catchment.fashionForwardness}/100</span></div>
                                          <div className="flex justify-between"><span className="text-gray-600">Youth Index</span><span className="font-medium text-gray-900">{catchment.youthIndex}/100</span></div>
                                          <div className="flex justify-between"><span className="text-gray-600">Family Index</span><span className="font-medium text-gray-900">{catchment.familyIndex}/100</span></div>
                                          <div className="flex justify-between"><span className="text-gray-600">Destination</span><span className="font-medium text-gray-900">{catchment.destinationScore}/100</span></div>
                                          <div className="mt-1.5 pt-1.5 border-t border-emerald-200 flex justify-between"><span className="text-gray-600">Population</span><span className="font-medium text-gray-900">{(catchment.catchmentPopulation / 1000).toFixed(0)}K</span></div>
                                          <div className="flex justify-between"><span className="text-gray-600">Apparel Spend</span><span className="font-medium text-gray-900">Rs {catchment.estimatedApparelSpend} Cr</span></div>
                                        </div>
                                      ) : (
                                        <p className="text-xs text-gray-500">Not yet profiled</p>
                                      )}
                                    </div>

                                    {/* Competitive Landscape — from Store Intelligence */}
                                    <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
                                      <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Competitive Landscape</p>
                                      {nsoCompetitors.length > 0 ? (
                                        <div className="space-y-1">
                                          {nsoCompetitors.map(c => (
                                            <div key={c.id} className="flex items-center gap-1.5 text-xs">
                                              <span className={`w-1.5 h-1.5 rounded-full ${c.tier === 'aspirational' ? 'bg-purple-500' : c.tier === 'direct' ? 'bg-red-500' : 'bg-amber-400'}`} />
                                              <span className="text-gray-800 font-medium flex-1 truncate">{c.storeName}</span>
                                              <span className="text-gray-400 tabular-nums">Rs {c.estimatedSpsf}</span>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <p className="text-xs text-gray-500">No competitors mapped</p>
                                      )}
                                    </div>
                                  </div>

                                  {/* Row 2: 6-Dimension Competitive Gap Score */}
                                  {gapScore && (
                                    <div className="rounded-md border border-gray-200 bg-white p-3">
                                      <div className="flex items-center justify-between mb-2">
                                        <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide">Competitive Gap Analysis</p>
                                        <div className="flex items-center gap-2">
                                          <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', gapBandBg, gapBandColor)}>{gapScore.gapBand.replace('-', ' ')}</span>
                                          <span className="text-xs font-semibold text-gray-900 tabular-nums">{gapScore.overallScore}/100</span>
                                        </div>
                                      </div>
                                      <div className="grid grid-cols-6 gap-2">
                                        {Object.entries(gapScore.dimensions).map(([dim, val]) => (
                                          <div key={dim} className="text-center">
                                            <div className="h-12 flex items-end justify-center">
                                              <div className={cn('w-5 rounded-t', val >= 70 ? 'bg-green-400' : val >= 55 ? 'bg-amber-400' : 'bg-red-400')} style={{ height: `${val}%` }} />
                                            </div>
                                            <p className="text-[9px] text-gray-500 mt-1 leading-tight">{dim.replace(/([A-Z])/g, ' $1').trim()}</p>
                                            <p className="text-[10px] font-semibold text-gray-700 tabular-nums">{val}</p>
                                          </div>
                                        ))}
                                      </div>
                                      <p className="text-[10px] text-gray-500 mt-2">{gapScore.topGap}</p>
                                    </div>
                                  )}
                                </div>
                              );
                            })()}

                            {/* Step header */}
                            <div className="flex items-center gap-3 py-1.5 mb-1 border-b border-gray-200">
                              <span className="text-xs font-medium text-gray-500 w-6 text-right">#</span>
                              <span className="w-4" />
                              <span className="text-xs font-medium text-gray-500 flex-1">Step</span>
                              <span className="text-xs font-medium text-gray-500 w-20">Owner</span>
                              <span className="text-xs font-medium text-gray-500 w-24">Due Date</span>
                              <span className="text-xs font-medium text-gray-500 w-24">Completed</span>
                            </div>

                            <div className="space-y-0">
                              {nso.steps.map(step => (
                                <div key={step.step} className="flex items-center gap-3 py-1.5 border-b border-gray-100 last:border-0">
                                  <span className="text-xs text-gray-400 w-6 text-right tabular-nums">{step.step}</span>
                                  {stepIcon(step.status)}
                                  <span className={cn('text-sm flex-1', step.status === 'completed' ? 'text-gray-700' : step.status === 'in-progress' ? 'text-indigo-700 font-medium' : step.status === 'blocked' ? 'text-red-700 font-medium' : 'text-gray-400')}>{step.name}</span>
                                  <span className="text-xs text-gray-500 w-20">{step.owner}</span>
                                  <span className="text-xs text-gray-400 w-24 tabular-nums">{step.dueDate}</span>
                                  {step.completedAt ? (
                                    <span className="text-xs text-green-600 w-24 tabular-nums">{step.completedAt}</span>
                                  ) : (
                                    <span className="w-24" />
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </TabsContent>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* SPACE PLANNER: SCENARIOS                                         */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="scenarios">
          {(() => {
            const scenarios = data.spaceScenarios;
            const tests = data.abTests;
            const segments = scenarios[0]?.sftAllocations.map(a => a.segment) ?? [];
            const selectedScenarios = scenarios.filter(s => compareScenarios.includes(s.id));

            const toggleCompare = (id: string) => {
              setCompareScenarios(prev => {
                if (prev.includes(id)) return prev.filter(x => x !== id);
                if (prev.length >= 4) return prev;
                return [...prev, id];
              });
            };

            return (
              <div className="space-y-8">
                {/* Section 1: Scenario List */}
                <div className="space-y-4">
                  <SectionHeader title={<span className="inline-flex items-center gap-2">Scenario Planning <NotionalBadge /></span>} />
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {scenarios.map(sc => {
                      const badge = scenarioStatusBadge(sc.status);
                      const isSelected = compareScenarios.includes(sc.id);
                      return (
                        <div
                          key={sc.id}
                          className={cn(
                            'rounded-lg border bg-white p-5 space-y-4 transition-colors',
                            isSelected && 'border-indigo-500 ring-1 ring-indigo-200',
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-semibold text-gray-900 truncate">{sc.name}</h4>
                                {sc.isBaseline && <Badge variant="outline">Baseline</Badge>}
                                <Badge variant={badge.variant}>{badge.label}</Badge>
                              </div>
                              <p className="text-xs text-gray-500">{sc.description}</p>
                              <p className="text-xs text-gray-400">Created {sc.createdAt}</p>
                            </div>
                            <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer whitespace-nowrap">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleCompare(sc.id)}
                                disabled={!isSelected && compareScenarios.length >= 4}
                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                              />
                              Compare
                            </label>
                          </div>
                          <MetricGrid columns={4}>
                            <MetricCard label="Avg SPSF" value={`${sc.projectedMetrics.avgSpsf}`} subtitle="/sqft" />
                            <MetricCard label="Avg GMROF" value={sc.projectedMetrics.avgGmrof.toFixed(1)} subtitle="x" />
                            <MetricCard label="Option Count" value={sc.projectedMetrics.optionCount.toLocaleString()} />
                            <MetricCard label="Investment Cost" value={sc.projectedMetrics.investmentCost === 0 ? '--' : `${(sc.projectedMetrics.investmentCost / 1000).toFixed(0)}K`} />
                          </MetricGrid>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Section 2: Comparison Table */}
                {selectedScenarios.length >= 2 && (
                  <div className="space-y-4">
                    <SectionHeader title="Scenario Comparison" />
                    <div className="rounded-lg border bg-white overflow-x-auto">
                      <DataTable>
                        <DataTableHeader>
                            <DataTableHead className="sticky left-0 bg-white z-10">Segment</DataTableHead>
                            {selectedScenarios.map(sc => (
                              <Fragment key={sc.id}>
                                <DataTableHead className="text-center">{sc.name} SFT%</DataTableHead>
                                <DataTableHead className="text-center">{sc.name} SPSF</DataTableHead>
                              </Fragment>
                            ))}
                        </DataTableHeader>
                        <DataTableBody>
                          {segments.map(seg => (
                            <DataTableRow key={seg}>
                              <DataTableCell className="font-medium sticky left-0 bg-white z-10">{seg}</DataTableCell>
                              {selectedScenarios.map(sc => {
                                const alloc = sc.sftAllocations.find(a => a.segment === seg);
                                return (
                                  <Fragment key={sc.id}>
                                    <DataTableCell className="text-center">{alloc?.sftPct ?? '--'}%</DataTableCell>
                                    <DataTableCell className="text-center">{alloc?.projectedSpsf ?? '--'}</DataTableCell>
                                  </Fragment>
                                );
                              })}
                            </DataTableRow>
                          ))}
                          {/* Summary row */}
                          <DataTableRow className="border-t-2 border-gray-200 font-semibold bg-gray-50">
                            <DataTableCell className="sticky left-0 bg-gray-50 z-10">Avg SPSF</DataTableCell>
                            {selectedScenarios.map(sc => (
                              <Fragment key={sc.id}>
                                <DataTableCell className="text-center">--</DataTableCell>
                                <DataTableCell className="text-center">{sc.projectedMetrics.avgSpsf}</DataTableCell>
                              </Fragment>
                            ))}
                          </DataTableRow>
                          <DataTableRow className="font-semibold bg-gray-50">
                            <DataTableCell className="sticky left-0 bg-gray-50 z-10">GMROF</DataTableCell>
                            {selectedScenarios.map(sc => (
                              <Fragment key={sc.id}>
                                <DataTableCell className="text-center">--</DataTableCell>
                                <DataTableCell className="text-center">{sc.projectedMetrics.avgGmrof.toFixed(1)}x</DataTableCell>
                              </Fragment>
                            ))}
                          </DataTableRow>
                          <DataTableRow className="font-semibold bg-gray-50">
                            <DataTableCell className="sticky left-0 bg-gray-50 z-10">Options</DataTableCell>
                            {selectedScenarios.map(sc => (
                              <Fragment key={sc.id}>
                                <DataTableCell className="text-center">--</DataTableCell>
                                <DataTableCell className="text-center">{sc.projectedMetrics.optionCount.toLocaleString()}</DataTableCell>
                              </Fragment>
                            ))}
                          </DataTableRow>
                          <DataTableRow className="font-semibold bg-gray-50">
                            <DataTableCell className="sticky left-0 bg-gray-50 z-10">Investment</DataTableCell>
                            {selectedScenarios.map(sc => (
                              <Fragment key={sc.id}>
                                <DataTableCell className="text-center">--</DataTableCell>
                                <DataTableCell className="text-center">{sc.projectedMetrics.investmentCost === 0 ? '--' : `${(sc.projectedMetrics.investmentCost / 1000).toFixed(0)}K`}</DataTableCell>
                              </Fragment>
                            ))}
                          </DataTableRow>
                        </DataTableBody>
                      </DataTable>
                    </div>
                  </div>
                )}

                {/* Section 3: A/B Tests */}
                <div className="space-y-4">
                  <SectionHeader title={<span className="inline-flex items-center gap-2">A/B Tests <NotionalBadge /></span>} />
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {tests.map(test => {
                      const badge = abTestStatusBadge(test.status);
                      return (
                        <div key={test.id} className="rounded-lg border bg-white p-5 space-y-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-semibold text-gray-900">{test.scenarioName}</h4>
                                <Badge variant={badge.variant}>{badge.label}</Badge>
                              </div>
                              <p className="text-xs text-gray-500">{test.id} -- {test.startDate} to {test.endDate}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-6 text-xs text-gray-600">
                            <span>Test Stores: <span className="font-semibold text-gray-900">{test.testStores}</span></span>
                            <span>Control Stores: <span className="font-semibold text-gray-900">{test.controlStores}</span></span>
                          </div>
                          {test.results && (
                            <div className="rounded-md bg-gray-50 border p-3 space-y-2">
                              <p className="text-xs font-medium text-gray-700">Results</p>
                              <div className="grid grid-cols-4 gap-3 text-xs">
                                <div>
                                  <p className="text-gray-500">Test SPSF</p>
                                  <p className="font-semibold text-gray-900">{test.results.testSpsf}</p>
                                </div>
                                <div>
                                  <p className="text-gray-500">Control SPSF</p>
                                  <p className="font-semibold text-gray-900">{test.results.controlSpsf}</p>
                                </div>
                                <div>
                                  <p className="text-gray-500">Lift</p>
                                  <p className={cn('font-semibold', test.results.lift > 0 ? 'text-green-600' : 'text-red-600')}>
                                    {test.results.lift > 0 ? '+' : ''}{test.results.lift}%
                                  </p>
                                </div>
                                <div>
                                  <p className="text-gray-500">p-value</p>
                                  <p className="font-semibold text-gray-900">
                                    {test.results.pValue}
                                    {test.results.pValue < 0.05 && (
                                      <span className="ml-1 text-green-600 font-medium">Significant</span>
                                    )}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })()}
        </TabsContent>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* SPACE PLANNER: IMPACT ANALYTICS                                  */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="impact-analytics">
          {(() => {
            const comparison = data.planComparison;
            const trend = data.spsfTrend;
            const totalSalesImpact = comparison.reduce((sum, r) => sum + r.salesImpactLakhs, 0);
            const segmentsImproved = comparison.filter((r) => r.currentSpsf > r.previousSpsf).length;
            const latestSpsf = trend[trend.length - 1]?.spsf ?? 0;
            const firstSpsf = trend[0]?.spsf ?? 0;
            const spsfGrowth = firstSpsf > 0 ? ((latestSpsf - firstSpsf) / firstSpsf * 100) : 0;

            return (
              <div className="space-y-8">
                {/* Section 1: Plan-over-Plan Comparison */}
                <div>
                  <SectionHeader
                    title={<span className="inline-flex items-center gap-2">Plan Impact Analysis <NotionalBadge /></span>}
                    subtitle="v2.0 → v3.0 comparison — segment-level space reallocation and sales impact"
                  />
                  <DataTable>
                    <DataTableHeader>
                      <DataTableHead>Segment</DataTableHead>
                      <DataTableHead className="text-right">Previous SFT%</DataTableHead>
                      <DataTableHead className="text-right">Current SFT%</DataTableHead>
                      <DataTableHead className="text-right">Delta</DataTableHead>
                      <DataTableHead className="text-right">Previous SPSF</DataTableHead>
                      <DataTableHead className="text-right">Current SPSF</DataTableHead>
                      <DataTableHead className="text-right">Sales Impact (Lakhs)</DataTableHead>
                    </DataTableHeader>
                    <DataTableBody>
                      {comparison.map((row) => (
                        <DataTableRow key={row.segment}>
                          <DataTableCell className="font-medium text-gray-900">{row.segment}</DataTableCell>
                          <DataTableCell className="text-right tabular-nums text-gray-700">{row.previousSftPct}%</DataTableCell>
                          <DataTableCell className="text-right tabular-nums text-gray-700">{row.currentSftPct}%</DataTableCell>
                          <DataTableCell className="text-right tabular-nums">
                            <span className={cn(
                              'text-sm font-medium',
                              row.deltaSftPct > 0 ? 'text-green-700' : row.deltaSftPct < 0 ? 'text-red-700' : 'text-gray-500'
                            )}>
                              {row.deltaSftPct > 0 ? '+' : ''}{row.deltaSftPct}%
                            </span>
                          </DataTableCell>
                          <DataTableCell className="text-right tabular-nums text-gray-700">Rs {row.previousSpsf}</DataTableCell>
                          <DataTableCell className="text-right tabular-nums text-gray-700">Rs {row.currentSpsf}</DataTableCell>
                          <DataTableCell className="text-right tabular-nums">
                            <span className="text-sm font-medium text-green-700">{row.salesImpactLakhs.toFixed(1)}L</span>
                          </DataTableCell>
                        </DataTableRow>
                      ))}
                      <DataTableRow className="border-t-2 border-gray-200 bg-gray-50">
                        <DataTableCell className="font-semibold text-gray-900">Total</DataTableCell>
                        <DataTableCell />
                        <DataTableCell />
                        <DataTableCell />
                        <DataTableCell />
                        <DataTableCell />
                        <DataTableCell className="text-right tabular-nums">
                          <span className="text-sm font-semibold text-green-700">{totalSalesImpact.toFixed(1)}L</span>
                        </DataTableCell>
                      </DataTableRow>
                    </DataTableBody>
                  </DataTable>
                </div>

                {/* Section 2: SPSF/GMROF Trend Chart */}
                <div>
                  <SectionHeader
                    title={<span className="inline-flex items-center gap-2">SPSF &amp; GMROF Trend <NotionalBadge /></span>}
                    subtitle="Weekly network performance — actual vs target"
                  />
                  <div className="rounded-lg border border-gray-200 bg-white p-4">
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={trend} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="week" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                        <YAxis yAxisId="spsf" tick={{ fontSize: 12 }} stroke="#9ca3af" label={{ value: 'SPSF (Rs)', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }} />
                        <YAxis yAxisId="gmrof" orientation="right" tick={{ fontSize: 12 }} stroke="#9ca3af" label={{ value: 'GMROF', angle: 90, position: 'insideRight', style: { fontSize: 12 } }} />
                        <Tooltip contentStyle={{ fontSize: 12 }} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Line yAxisId="spsf" type="monotone" dataKey="spsf" name="SPSF" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
                        <Line yAxisId="spsf" type="monotone" dataKey="target" name="Target" stroke="#d1d5db" strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
                        <Line yAxisId="gmrof" type="monotone" dataKey="gmrof" name="GMROF" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Section 3: Summary KPIs */}
                <MetricGrid columns={4}>
                  <MetricCard label="Network Avg SPSF" value={`Rs ${latestSpsf}`} />
                  <MetricCard label="SPSF Growth" value={`${spsfGrowth > 0 ? '+' : ''}${spsfGrowth.toFixed(1)}%`} status={spsfGrowth >= 0 ? 'on-track' : 'critical'} />
                  <MetricCard label="Total Sales Impact" value={`${totalSalesImpact.toFixed(1)}L`} status="on-track" />
                  <MetricCard label="Segments Improved" value={`${segmentsImproved} / ${comparison.length}`} />
                </MetricGrid>
              </div>
            );
          })()}
        </TabsContent>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* SPACE PLANNER: RA FEEDBACK                                       */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="ra-feedback">
          {(() => {
            const items = data.raFeedback;
            const pendingCount = items.filter((f: RAFeedback) => f.status === 'pending').length;
            const capacityGapCount = items.filter((f: RAFeedback) => f.type === 'capacity-gap').length;
            const excessCapacityCount = items.filter((f: RAFeedback) => f.type === 'excess-capacity').length;
            const resolvedCount = items.filter((f: RAFeedback) => f.status === 'resolved').length;

            const typeBadge = (type: RAFeedback['type']) => {
              if (type === 'capacity-gap') return { variant: 'error' as const, label: 'Capacity Gap' };
              if (type === 'excess-capacity') return { variant: 'warning' as const, label: 'Excess Capacity' };
              return { variant: 'outline' as const, label: 'Budget Cut' };
            };

            const severityBadge = (sev: RAFeedback['severity']) => {
              if (sev === 'high') return 'error' as const;
              if (sev === 'medium') return 'warning' as const;
              return 'default' as const;
            };

            const statusVariant = (s: RAFeedback['status']) => {
              if (s === 'pending') return 'outline' as const;
              if (s === 'acknowledged') return 'info' as const;
              return 'success' as const;
            };

            return (
              <div className="space-y-8">
                <SectionHeader
                  title={<span className="inline-flex items-center gap-2">RA Feedback <NotionalBadge /></span>}
                  subtitle="Range Architecture capacity alignment — gaps, excess and budget impacts"
                />

                <MetricGrid columns={4}>
                  <MetricCard label="Pending Items" value={pendingCount} status="warning" />
                  <MetricCard label="Capacity Gaps" value={capacityGapCount} status="critical" />
                  <MetricCard label="Excess Capacity" value={excessCapacityCount} />
                  <MetricCard label="Resolved" value={resolvedCount} status="on-track" />
                </MetricGrid>

                <div className="space-y-4">
                  {items.map((item: RAFeedback) => {
                    const tb = typeBadge(item.type);
                    const effectiveStatus = raFeedbackActions[item.id] ?? item.status;
                    return (
                      <div key={item.id} className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant={tb.variant} size="sm">{tb.label}</Badge>
                            <span className="text-sm font-medium">{item.segment} Segment</span>
                            <Badge variant={severityBadge(item.severity)} size="sm">{item.severity}</Badge>
                          </div>
                          <Badge variant={statusVariant(effectiveStatus)} size="sm">{effectiveStatus}</Badge>
                        </div>
                        <p className="text-sm text-gray-700">{item.message}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>{item.storeCount} stores affected</span>
                          <span>Option gap: <span className={item.optionGap < 0 ? 'text-red-600' : 'text-amber-600'}>{item.optionGap > 0 ? '+' : ''}{item.optionGap}</span></span>
                          <span>{item.createdAt}</span>
                        </div>
                        <div className="bg-gray-50 rounded p-3 space-y-1">
                          <p className="text-xs font-medium text-gray-600">Recommendations:</p>
                          <ul className="list-disc list-inside space-y-0.5">
                            {item.recommendations.map((rec: string, i: number) => (
                              <li key={i} className="text-xs text-gray-600">{rec}</li>
                            ))}
                          </ul>
                        </div>
                        {effectiveStatus === 'pending' && (
                          <div className="flex gap-2">
                            <button className="rounded bg-indigo-600 px-2 py-1 text-xs font-medium text-white hover:bg-indigo-700 transition-colors" onClick={() => setRaFeedbackActions(prev => ({ ...prev, [item.id]: 'acknowledged' }))}>Acknowledge</button>
                            <button className="rounded border border-gray-300 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors" onClick={() => setRaFeedbackActions(prev => ({ ...prev, [item.id]: 'resolved' }))}>Resolve</button>
                          </div>
                        )}
                        {effectiveStatus === 'acknowledged' && (
                          <div className="flex gap-2">
                            <button className="rounded bg-green-600 px-2 py-1 text-xs font-medium text-white hover:bg-green-700 transition-colors" onClick={() => setRaFeedbackActions(prev => ({ ...prev, [item.id]: 'resolved' }))}>Mark Resolved</button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </TabsContent>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* VISUAL MERCHANDISER: FIXTURE LAYOUT                              */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="fixture-layout">
          <VMFixtureLayoutView stores={selectedFormat === 'all' ? data.storeSpaceProfiles : data.storeSpaceProfiles.filter(p => p.format === selectedFormat)} selectedStoreId={selectedStoreId} onSelectStore={handleSelectStore} onBack={() => setSelectedStoreId(null)} />
        </TabsContent>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* VISUAL MERCHANDISER: PLANOGRAM COMPLIANCE                        */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="planogram-compliance">
          <VMPlanogramComplianceView stores={selectedFormat === 'all' ? data.storeSpaceProfiles : data.storeSpaceProfiles.filter(p => p.format === selectedFormat)} selectedStoreId={selectedStoreId} onSelectStore={handleSelectStore} onBack={() => setSelectedStoreId(null)} />
        </TabsContent>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* STORE OPERATIONS: STORE HEALTH (format-locked)                   */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="store-health">
          <div className="space-y-4">
            <FilterBar>
              <FilterPills
                value={selectedFormat === 'all' && availableFormats.length > 0 ? availableFormats[0]! : selectedFormat}
                onChange={setSelectedFormat}
                options={availableFormats.map(fmt => ({ value: fmt, label: fmt, count: data.storeSpaceProfiles.filter(p => p.format === fmt).length }))}
              />
            </FilterBar>
            <StoreOpsHealthView
              stores={data.storeSpaceProfiles.filter(p => p.format === (selectedFormat === 'all' ? availableFormats[0] ?? '' : selectedFormat))}
              recs={data.spaceRecommendations}
            />
          </div>
        </TabsContent>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* STORE OPERATIONS: TASK TRACKER (format-locked)                   */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="task-tracker">
          <div className="space-y-4">
            <FilterBar>
              <FilterPills
                value={selectedFormat === 'all' && availableFormats.length > 0 ? availableFormats[0]! : selectedFormat}
                onChange={setSelectedFormat}
                options={availableFormats.map(fmt => ({ value: fmt, label: fmt, count: pulsePointTasks.filter(t => t.format === fmt).length }))}
              />
            </FilterBar>
            <StoreOpsTaskTrackerView
              tasks={pulsePointTasks.filter(t => t.format === (selectedFormat === 'all' ? availableFormats[0] ?? '' : selectedFormat))}
              onUpdateTask={(id, status) => setPulsePointTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t))}
            />
          </div>
        </TabsContent>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* CLUSTER MANAGER: CLUSTER OVERVIEW (cluster-locked)               */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="cluster-overview">
          {(() => {
            const allClusters = [...new Set(data.storeSpaceProfiles.map(s => s.cluster))].sort();
            const activeCl = selectedCluster === 'all' && allClusters.length > 0 ? allClusters[0]! : selectedCluster;
            const clusterStores = data.storeSpaceProfiles.filter(s => s.cluster === activeCl);
            return (
              <div className="space-y-4">
                <FilterBar>
                  <FilterPills
                    value={activeCl}
                    onChange={setSelectedCluster}
                    options={allClusters.map(cl => ({ value: cl, label: cl, count: data.storeSpaceProfiles.filter(s => s.cluster === cl).length }))}
                  />
                </FilterBar>
                <ClusterOverviewView stores={clusterStores} recs={data.spaceRecommendations} spsfTargets={data.spsfTargets} onViewCluster={() => setSpActiveTab('store-comparison')} />
              </div>
            );
          })()}
        </TabsContent>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* CLUSTER MANAGER: STORE COMPARISON (cluster-locked)               */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="store-comparison">
          {(() => {
            const allClusters = [...new Set(data.storeSpaceProfiles.map(s => s.cluster))].sort();
            const activeCl = selectedCluster === 'all' && allClusters.length > 0 ? allClusters[0]! : selectedCluster;
            const clusterStores = data.storeSpaceProfiles.filter(s => s.cluster === activeCl);
            return (
              <div className="space-y-4">
                <FilterBar>
                  <FilterPills
                    value={activeCl}
                    onChange={setSelectedCluster}
                    options={allClusters.map(cl => ({ value: cl, label: cl, count: data.storeSpaceProfiles.filter(s => s.cluster === cl).length }))}
                  />
                </FilterBar>
                <ClusterStoreComparisonView stores={clusterStores} spsfTargets={data.spsfTargets} onSelectStore={handleSelectStore} />
              </div>
            );
          })()}
        </TabsContent>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* STORE MANAGER: MY STORE                                          */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="my-store">
          <StoreManagerMyStoreView stores={data.storeSpaceProfiles} segments={data.storeSegmentAllocations} recs={data.spaceRecommendations} spsfTargets={data.spsfTargets} />
        </TabsContent>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* STORE MANAGER: ACTION ITEMS                                      */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="action-items">
          <StoreManagerActionItemsView stores={data.storeSpaceProfiles} recs={data.spaceRecommendations} tasks={pulsePointTasks} onUpdateTask={(id, status) => setPulsePointTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t))} />
        </TabsContent>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* STATE HEAD: STATE OVERVIEW (format-locked)                       */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="state-overview">
          <div className="space-y-4">
            <FilterBar>
              <FilterPills
                value={selectedFormat === 'all' && availableFormats.length > 0 ? availableFormats[0]! : selectedFormat}
                onChange={setSelectedFormat}
                options={availableFormats.map(fmt => ({ value: fmt, label: fmt, count: data.storeSpaceProfiles.filter(p => p.format === fmt).length }))}
              />
            </FilterBar>
            <StateHeadOverviewView
              stores={data.storeSpaceProfiles.filter(p => p.format === (selectedFormat === 'all' ? availableFormats[0] ?? '' : selectedFormat))}
              recs={data.spaceRecommendations}
              spsfTargets={data.spsfTargets}
            />
          </div>
        </TabsContent>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* STATE HEAD: CITY DRILLDOWN (format-locked)                       */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="city-drilldown">
          <div className="space-y-4">
            <FilterBar>
              <FilterPills
                value={selectedFormat === 'all' && availableFormats.length > 0 ? availableFormats[0]! : selectedFormat}
                onChange={setSelectedFormat}
                options={availableFormats.map(fmt => ({ value: fmt, label: fmt, count: data.storeSpaceProfiles.filter(p => p.format === fmt).length }))}
              />
            </FilterBar>
            <StateHeadCityDrilldownView
              stores={data.storeSpaceProfiles.filter(p => p.format === (selectedFormat === 'all' ? availableFormats[0] ?? '' : selectedFormat))}
              recs={data.spaceRecommendations}
              spsfTargets={data.spsfTargets}
              onSelectStore={handleSelectStore}
            />
          </div>
        </TabsContent>

        {/* ── Agentic Space Command ── */}
        <TabsContent value="agentic-space">
          <div className="space-y-6">
            {/* Agent Status */}
            <div className="rounded-lg bg-gradient-to-r from-gray-900 to-gray-800 p-4 text-white">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-indigo-400" />
                  <h3 className="text-sm font-semibold">Space Planning Agents — Active</h3>
                </div>
                <Badge variant="success" className="text-xs">4 agents running</Badge>
              </div>
              <div className="grid grid-cols-4 gap-4">
                {[
                  { name: 'SPSF Monitor', status: 'Scanning 186 stores', color: 'bg-emerald-400' },
                  { name: 'Fixture Optimizer', status: '12 rebalancing recs generated', color: 'bg-blue-400' },
                  { name: 'RA-Space Mapper', status: 'Processing Spring \'26 range', color: 'bg-purple-400' },
                  { name: 'AOP Gap Closer', status: '8 stores need intervention', color: 'bg-amber-400' },
                ].map(a => (
                  <div key={a.name} className="bg-white/10 rounded-md p-2.5">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className={cn('h-1.5 w-1.5 rounded-full', a.color)} />
                      <span className="text-xs font-medium text-white/90">{a.name}</span>
                    </div>
                    <p className="text-[10px] text-white/60">{a.status}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Pending Agent Actions */}
            <SectionHeader title="Pending Agent Actions" subtitle="Space optimization actions requiring human approval" />
            <div className="space-y-3">
              {[
                { id: 'sa-1', agent: 'SPSF Monitor', action: 'Reallocate 80 sqft from Men Casual to Women Western', store: 'Trends MG Road, Bengaluru', reason: 'Women Western SPSF ₹1,820/sqft vs Men Casual ₹980/sqft — 86% higher productivity', impact: '+₹14K/day revenue', confidence: 94 },
                { id: 'sa-2', agent: 'Fixture Optimizer', action: 'Move 2 gondolas from Back-of-House to selling floor', store: 'Trends Phoenix, Mumbai', reason: 'BOH ratio 32% exceeds grade target of 25% — 7% excess non-selling space', impact: '+₹8K/day revenue', confidence: 88 },
                { id: 'sa-3', agent: 'AOP Gap Closer', action: 'Increase Kids section from 12% to 18% of floor', store: 'Trends Anna Nagar, Chennai', reason: 'AOP gap ₹4.2L/month — Kids catchment index 1.8x but space share only 12%', impact: 'Close ₹2.1L AOP gap', confidence: 82 },
                { id: 'sa-4', agent: 'RA-Space Mapper', action: 'Add 3 wall fixtures for new Ethnic range (28 options)', store: 'Trends Salt Lake, Kolkata', reason: 'Spring \'26 Ethnic range needs 3 additional wall units — current capacity insufficient', impact: 'Enable range placement', confidence: 91 },
              ].map(item => (
                <div key={item.id} className="rounded-lg border border-gray-200 bg-white p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary">{item.agent}</Badge>
                        <span className="text-sm font-semibold text-gray-900">{item.action}</span>
                      </div>
                      <p className="text-xs text-gray-500 mb-1">{item.store}</p>
                      <p className="text-xs text-gray-600">{item.reason}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs">
                        <span className="text-indigo-600 font-medium">{item.impact}</span>
                        <span className="text-gray-400">Confidence: {item.confidence}%</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button variant="outline" size="sm" onClick={() => toast.info(`Preview: ${item.action}`)}>
                        <Eye className="h-3.5 w-3.5 mr-1" /> Preview
                      </Button>
                      <Button variant="primary" size="sm" onClick={() => toast.success(`Approved: ${item.action}`)}>
                        Approve
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => toast.info('Rejected')}>
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Auto-Executed */}
            <SectionHeader title="Auto-Executed (Within Guardrails)" subtitle="Actions taken autonomously — no approval needed" />
            <div className="space-y-2">
              {[
                { time: '09:45', action: 'Updated SPSF targets for 12 Grade-C stores based on catchment refresh', agent: 'SPSF Monitor' },
                { time: '08:30', action: 'Generated fixture transfer orders for 6 stores (renovation complete)', agent: 'Fixture Optimizer' },
                { time: '07:15', action: 'Published planogram compliance scores to PulsePoint for 186 stores', agent: 'RA-Space Mapper' },
                { time: 'Yesterday', action: 'Flagged 3 stores with BOH ratio >35% — sent alerts to cluster managers', agent: 'SPSF Monitor' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2 rounded bg-gray-50 text-xs">
                  <span className="text-gray-400 w-16 shrink-0">{item.time}</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                  <span className="text-gray-700 flex-1">{item.action}</span>
                  <Badge variant="secondary">{item.agent}</Badge>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* ── Buyer: Range → Space Mapping ── */}
        <TabsContent value="ra-space-mapping">
          <div className="space-y-6">
            <SectionHeader title="Range → Space Mapping" subtitle="How your range selections translate to fixture allocation in each store" />

            <MetricGrid columns={4}>
              <MetricCard label="Range Options" value="9,800" status="on-track" subtitle="active across network" />
              <MetricCard label="Fixture Coverage" value="86%" status="warning" subtitle="options with fixture assignment" />
              <MetricCard label="GMetri 3D Ready" value="118 stores" status="on-track" subtitle="with RA visualization" />
              <MetricCard label="Capacity Gaps" value="23 stores" status="critical" subtitle="insufficient fixture capacity" />
            </MetricGrid>

            {/* RA to Fixture mapping table */}
            <div className="rounded-lg border border-gray-200 bg-white">
              <div className="p-4 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900">Range → Fixture Demand by Category</h3>
                <p className="text-xs text-gray-500 mt-0.5">Shows how category range plans translate to fixture requirements across store formats</p>
              </div>
              <DataTable>
                <DataTableHeader>
                  <DataTableRow>
                    <DataTableHead>Category</DataTableHead>
                    <DataTableHead className="text-right">Options</DataTableHead>
                    <DataTableHead className="text-right">Sqft Needed</DataTableHead>
                    <DataTableHead className="text-right">Sqft Allocated</DataTableHead>
                    <DataTableHead className="text-right">Gap</DataTableHead>
                    <DataTableHead>Fixture Type</DataTableHead>
                    <DataTableHead>Status</DataTableHead>
                  </DataTableRow>
                </DataTableHeader>
                <DataTableBody>
                  {[
                    { cat: 'Men Casual Wear', options: 1420, needed: 2840, allocated: 2600, gap: -240, fixture: 'Wall + Gondola', status: 'gap' },
                    { cat: 'Women Western', options: 1180, needed: 2360, allocated: 2500, gap: 140, fixture: 'Wall + Table', status: 'ok' },
                    { cat: 'Women Ethnic', options: 980, needed: 1960, allocated: 1800, gap: -160, fixture: 'Wall + Mannequin', status: 'gap' },
                    { cat: 'Men Formal', options: 720, needed: 1440, allocated: 1440, gap: 0, fixture: 'Wall', status: 'ok' },
                    { cat: 'Kids Wear', options: 860, needed: 1720, allocated: 1500, gap: -220, fixture: 'Gondola + Table', status: 'gap' },
                    { cat: 'Accessories', options: 640, needed: 960, allocated: 1000, gap: 40, fixture: 'Counter + Display', status: 'ok' },
                  ].map(row => (
                    <DataTableRow key={row.cat}>
                      <DataTableCell className="font-medium text-gray-900">{row.cat}</DataTableCell>
                      <DataTableCell className="text-right">{row.options.toLocaleString()}</DataTableCell>
                      <DataTableCell className="text-right">{row.needed.toLocaleString()} sqft</DataTableCell>
                      <DataTableCell className="text-right">{row.allocated.toLocaleString()} sqft</DataTableCell>
                      <DataTableCell className={cn('text-right font-medium', row.gap < 0 ? 'text-red-600' : row.gap > 0 ? 'text-emerald-600' : 'text-gray-500')}>
                        {row.gap > 0 ? '+' : ''}{row.gap} sqft
                      </DataTableCell>
                      <DataTableCell className="text-xs text-gray-500">{row.fixture}</DataTableCell>
                      <DataTableCell>
                        <Badge variant={row.status === 'ok' ? 'success' : 'destructive'}>
                          {row.status === 'ok' ? 'Covered' : 'Gap'}
                        </Badge>
                      </DataTableCell>
                    </DataTableRow>
                  ))}
                </DataTableBody>
              </DataTable>
            </div>

            {/* RA → VM → GMetri flow */}
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Range → VM → GMetri Pipeline</h3>
              <p className="text-xs text-gray-500 mb-4">How range decisions cascade through the system to 3D store visualization</p>
              <div className="flex items-center gap-2">
                {[
                  { step: 'Buyer creates range plan', done: true },
                  { step: 'System computes fixture demand', done: true },
                  { step: 'Space Planner resolves gaps', done: true },
                  { step: 'VM assigns display rules', done: false },
                  { step: 'GMetri 3D updated', done: false },
                ].map((s, i) => (
                  <Fragment key={s.step}>
                    <div className="flex items-center gap-1.5">
                      <div className={cn('flex items-center justify-center h-6 w-6 rounded-full text-[10px] font-bold', s.done ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400')}>
                        {i + 1}
                      </div>
                      <span className={cn('text-xs whitespace-nowrap', s.done ? 'text-gray-900 font-medium' : 'text-gray-400')}>{s.step}</span>
                    </div>
                    {i < 4 && <ChevronRight className="h-3.5 w-3.5 text-gray-300 shrink-0" />}
                  </Fragment>
                ))}
              </div>
            </div>

            {/* Stores with 3D preview */}
            <SectionHeader title="GMetri 3D Store Previews" subtitle="Stores where range placement can be visualized in 3D" />
            <div className="grid grid-cols-3 gap-3">
              {[
                { store: 'Trends MG Road, Bengaluru', format: 'Trends A', coverage: 94, ready: true },
                { store: 'Trends Phoenix, Mumbai', format: 'Trends A+', coverage: 100, ready: true },
                { store: 'Trends Jubilee Hills, Hyderabad', format: 'Trends A', coverage: 97, ready: true },
                { store: 'Trends Salt Lake, Kolkata', format: 'Trends B', coverage: 82, ready: true },
                { store: 'Trends Anna Nagar, Chennai', format: 'Trends B', coverage: 67, ready: false },
                { store: 'Trends CP, Delhi', format: 'Trends A', coverage: 78, ready: false },
              ].map(s => (
                <div key={s.store} className="rounded-lg border border-gray-200 bg-white p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{s.store}</p>
                      <p className="text-xs text-gray-500">{s.format}</p>
                    </div>
                    <Badge variant={s.coverage >= 90 ? 'success' : s.coverage >= 80 ? 'warning' : 'destructive'}>
                      {s.coverage}% placed
                    </Badge>
                  </div>
                  {s.ready ? (
                    <Button variant="outline" size="sm" className="w-full text-indigo-600" onClick={() => toast.info(`Opening GMetri 3D for ${s.store}`)}>
                      <Eye className="h-3.5 w-3.5 mr-1" /> View in 3D
                    </Button>
                  ) : (
                    <p className="text-xs text-gray-400 text-center py-1">Pending fixture resolution</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* ── StoreGen CAD Modal ── */}
      <Modal
        isOpen={storeGenModal.open}
        onClose={() => setStoreGenModal({ open: false })}
        title={`StoreGen — AI Layout Designer${storeGenModal.storeName ? ` · ${storeGenModal.storeName}` : ''}`}
        description={storeGenModal.context ?? 'Upload the store DXF to generate an optimized fixture layout'}
        size="full"
      >
        <div className="flex flex-col" style={{ height: 'calc(95vh - 120px)' }}>
          <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 border-b border-indigo-100 text-xs text-indigo-700">
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Connected to <strong>create.dg2n.store</strong> — GMetri AI StoreGen</span>
            {storeGenModal.storeName && (
              <Badge variant="outline" size="sm" className="ml-auto">{storeGenModal.storeName}</Badge>
            )}
          </div>
          <iframe
            src="https://create.dg2n.store"
            className="flex-1 w-full border-0"
            title="StoreGen CAD Editor"
            allow="clipboard-read; clipboard-write"
          />
        </div>
      </Modal>
    </div>
  );
}

// ─── VM: Fixture Layout View ──────────────────────────────────────────────────

function VMFixtureLayoutView({ stores, selectedStoreId, onSelectStore, onBack }: {
  stores: StoreSpaceProfile[];
  selectedStoreId: string | null;
  onSelectStore: (id: string) => void;
  onBack: () => void;
}) {
  const [selectedFormat, setSelectedFormat] = useState('all');
  const filtered = selectedFormat === 'all' ? stores : stores.filter(s => s.format === selectedFormat);
  const formats = [...new Set(stores.map(s => s.format))].sort();

  // Store detail: fixture breakdown for selected store
  const selectedProfile = selectedStoreId ? stores.find(s => s.storeId === selectedStoreId) : null;
  const storeFixtures = useMemo(() => {
    if (!selectedStoreId) return [];
    const fixtures = generateStoreFixtures(selectedStoreId);
    const agg: Record<string, { name: string; count: number; lft: number; avgUtil: number; totalUtil: number }> = {};
    for (const f of fixtures) {
      if (!agg[f.fixtureTypeName]) agg[f.fixtureTypeName] = { name: f.fixtureTypeName, count: 0, lft: 0, avgUtil: 0, totalUtil: 0 };
      agg[f.fixtureTypeName]!.count += 1;
      agg[f.fixtureTypeName]!.lft += f.lft;
      agg[f.fixtureTypeName]!.totalUtil += f.utilization;
    }
    return Object.values(agg).map(a => ({ ...a, avgUtil: Math.round(a.totalUtil / a.count) })).sort((a, b) => b.count - a.count);
  }, [selectedStoreId]);

  // Aggregate fixture types across sample stores (group by type name, not code)
  // NOTE: All hooks must be called before any conditional return
  const fixtureAgg = useMemo(() => {
    const sample = filtered.slice(0, 20);
    const agg: Record<string, { name: string; count: number; lft: number; stores: number }> = {};
    for (const s of sample) {
      const fixtures = generateStoreFixtures(s.storeId);
      for (const f of fixtures) {
        if (!agg[f.fixtureTypeName]) agg[f.fixtureTypeName] = { name: f.fixtureTypeName, count: 0, lft: 0, stores: 0 };
        agg[f.fixtureTypeName]!.count += 1;
        agg[f.fixtureTypeName]!.lft += f.lft;
      }
      const types = new Set(fixtures.map(f => f.fixtureTypeName));
      for (const t of types) {
        if (agg[t]) agg[t].stores += 1;
      }
    }
    return Object.values(agg).sort((a, b) => b.count - a.count);
  }, [filtered]);

  const networkAvgUtil = Math.round((filtered.reduce((s, p) => s + p.fixtureUtilization, 0) / filtered.length) * 10) / 10;
  const avgFixtures = Math.round(filtered.reduce((s, p) => s + p.totalFixtures, 0) / filtered.length);
  const lowUtilStores = filtered.filter(s => s.fixtureUtilization < 75).sort((a, b) => a.fixtureUtilization - b.fixtureUtilization);

  // ── Store detail view (conditional render after all hooks) ──
  if (selectedProfile) {
    const totalFixtures = storeFixtures.reduce((s, f) => s + f.count, 0);
    const storeAvgUtil = totalFixtures > 0 ? Math.round(storeFixtures.reduce((s, f) => s + f.avgUtil * f.count, 0) / totalFixtures) : 0;
    const lowUtil = storeFixtures.filter(f => f.avgUtil < 70);

    return (
      <div className="space-y-6">
        <button type="button" onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 font-medium">
          <ArrowRight className="w-3.5 h-3.5 rotate-180" /> Back to all stores
        </button>

        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{selectedProfile.storeName}</h3>
            <p className="text-sm text-gray-500">{selectedProfile.city} · {selectedProfile.format} · Grade {selectedProfile.grade}</p>
          </div>
          <Badge variant={selectedProfile.fixtureUtilization >= 75 ? 'success' : selectedProfile.fixtureUtilization >= 60 ? 'warning' : 'error'} size="sm">
            {selectedProfile.fixtureUtilization}% overall utilization
          </Badge>
        </div>

        <MetricGrid>
          <MetricCard label="Total Fixtures" value={String(totalFixtures)} icon={LayoutGrid} iconColor="info" subtitle={`${storeFixtures.length} fixture types`} />
          <MetricCard label="Avg Utilization" value={`${storeAvgUtil}%`} icon={Target} iconColor={storeAvgUtil >= 75 ? 'success' : 'warning'} status={storeAvgUtil >= 75 ? 'on-track' : 'warning'} subtitle={storeAvgUtil >= 75 ? 'Healthy' : 'Below 75% target'} />
          <MetricCard label="Carpet Area" value={`${selectedProfile.carpetArea.toLocaleString()} sft`} icon={Maximize2} iconColor="info" subtitle={`Saleable: ${selectedProfile.saleableArea.toLocaleString()} sft`} />
        </MetricGrid>

        <SectionHeader title="Fixture Breakdown" subtitle="Per-type fixture count, linear footage and utilization" />
        <DataTable>
          <DataTableHeader>
            <DataTableHead>Fixture Type</DataTableHead>
            <DataTableHead className="text-right">Count</DataTableHead>
            <DataTableHead className="text-right">Linear Ft.</DataTableHead>
            <DataTableHead className="text-right">Avg Utilization</DataTableHead>
            <DataTableHead>Status</DataTableHead>
          </DataTableHeader>
          <DataTableBody>
            {storeFixtures.map(f => (
              <DataTableRow key={f.name}>
                <DataTableCell className="font-medium text-gray-900">{f.name}</DataTableCell>
                <DataTableCell className="text-right tabular-nums">{f.count}</DataTableCell>
                <DataTableCell className="text-right tabular-nums">{Math.round(f.lft)}</DataTableCell>
                <DataTableCell className="text-right tabular-nums">
                  <span className={f.avgUtil >= 75 ? 'text-green-700' : f.avgUtil >= 60 ? 'text-amber-700' : 'text-red-700 font-medium'}>{f.avgUtil}%</span>
                </DataTableCell>
                <DataTableCell>
                  <Badge variant={f.avgUtil >= 75 ? 'success' : f.avgUtil >= 60 ? 'warning' : 'error'} size="sm">
                    {f.avgUtil >= 75 ? 'Good' : f.avgUtil >= 60 ? 'Review' : 'Low'}
                  </Badge>
                </DataTableCell>
              </DataTableRow>
            ))}
          </DataTableBody>
        </DataTable>

        {lowUtil.length > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-medium text-amber-800">{lowUtil.length} fixture type{lowUtil.length > 1 ? 's' : ''} below 70% utilization</p>
            <p className="text-xs text-amber-700 mt-1">
              {lowUtil.map(f => `${f.name} (${f.avgUtil}%)`).join(', ')}. Consider reducing fixture count or reallocating to higher-demand segments.
            </p>
          </div>
        )}
      </div>
    );
  }

  // ── Network-level fixture aggregation view ──
  return (
    <div className="space-y-6">
      <FilterBar>
        <FilterPills
          value={selectedFormat}
          onChange={setSelectedFormat}
          options={[{ value: 'all', label: 'All Formats', count: stores.length }, ...formats.map(f => ({ value: f, label: f, count: stores.filter(s => s.format === f).length }))]}
        />
      </FilterBar>
      <MetricGrid>
        <MetricCard label="Avg Fixtures/Store" value={String(avgFixtures)} icon={LayoutGrid} iconColor="info" subtitle={`Across ${filtered.length} stores`} />
        <MetricCard label="Avg Fixture Utilization" value={`${networkAvgUtil}%`} icon={Target} iconColor={networkAvgUtil >= 80 ? 'success' : 'warning'} subtitle={networkAvgUtil >= 80 ? 'Healthy utilization' : 'Below 80% target'} status={networkAvgUtil >= 80 ? 'on-track' : 'warning'} />
        <MetricCard label="Low Utilization Stores" value={String(lowUtilStores.length)} icon={AlertTriangle} iconColor="error" subtitle="Below 75% fixture utilization" status={lowUtilStores.length > 0 ? 'critical' : 'on-track'} />
      </MetricGrid>

      <SectionHeader title="Fixture Type Distribution" subtitle="Aggregate fixture counts across sampled stores" />
      <DataTable>
        <DataTableHeader>
          <DataTableHead>Fixture Type</DataTableHead>
          <DataTableHead className="text-right">Total Count</DataTableHead>
          <DataTableHead className="text-right">Total Linear Ft.</DataTableHead>
          <DataTableHead className="text-right">Stores Using</DataTableHead>
        </DataTableHeader>
        <DataTableBody>
          {fixtureAgg.map(f => (
            <DataTableRow key={f.name}>
              <DataTableCell className="font-medium text-gray-900">{f.name}</DataTableCell>
              <DataTableCell className="text-right tabular-nums">{f.count}</DataTableCell>
              <DataTableCell className="text-right tabular-nums">{Math.round(f.lft).toLocaleString()}</DataTableCell>
              <DataTableCell className="text-right tabular-nums">{f.stores}</DataTableCell>
            </DataTableRow>
          ))}
        </DataTableBody>
      </DataTable>

      {lowUtilStores.length > 0 && (
        <>
          <SectionHeader title="Low Utilization Stores" subtitle={`${lowUtilStores.length} stores below 75% fixture utilization`} />
          <DataTable>
            <DataTableHeader>
              <DataTableHead>Store</DataTableHead>
              <DataTableHead className="text-right">Fixtures</DataTableHead>
              <DataTableHead className="text-right">Utilization</DataTableHead>
              <DataTableHead className="text-right">Underperforming</DataTableHead>
              <DataTableHead className="w-16" />
            </DataTableHeader>
            <DataTableBody>
              {lowUtilStores.slice(0, 15).map(s => (
                <DataTableRow key={s.storeId} onClick={() => onSelectStore(s.storeId)} className="cursor-pointer">
                  <DataTableCell>
                    <p className="text-sm font-medium text-gray-900">{s.storeName}</p>
                    <p className="text-xs text-gray-500">{s.city} · {s.format} · {s.grade}</p>
                  </DataTableCell>
                  <DataTableCell className="text-right tabular-nums">{s.totalFixtures}</DataTableCell>
                  <DataTableCell className="text-right tabular-nums">
                    <span className={s.fixtureUtilization < 60 ? 'text-red-700 font-medium' : 'text-amber-700'}>{s.fixtureUtilization}%</span>
                  </DataTableCell>
                  <DataTableCell className="text-right tabular-nums text-red-600">{s.underperformingFixtures}</DataTableCell>
                  <DataTableCell className="text-right">
                    <span className="text-xs font-medium text-indigo-600">View →</span>
                  </DataTableCell>
                </DataTableRow>
              ))}
            </DataTableBody>
          </DataTable>
        </>
      )}
    </div>
  );
}

// ─── VM: Planogram Compliance View ────────────────────────────────────────────

function scoreColor(score: number) {
  return score >= 80 ? 'text-green-700' : score >= 60 ? 'text-amber-700' : 'text-red-700';
}
function scoreBg(score: number) {
  return score >= 80 ? 'bg-green-100 text-green-800' : score >= 60 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800';
}
function taskBadge(status: FixturePlanogramScore['taskStatus']) {
  const m = { completed: { v: 'success' as const, l: 'Done' }, 'in-progress': { v: 'default' as const, l: 'In Progress' }, pending: { v: 'warning' as const, l: 'Pending' }, overdue: { v: 'error' as const, l: 'Overdue' } };
  return m[status];
}

function VMPlanogramComplianceView({ stores, selectedStoreId, onSelectStore, onBack }: {
  stores: StoreSpaceProfile[];
  selectedStoreId: string | null;
  onSelectStore: (id: string) => void;
  onBack: () => void;
}) {
  const [expandedFixture, setExpandedFixture] = useState<string | null>(null);

  const storeReports = useMemo(() => {
    return stores.slice(0, 30).map(s => {
      const report = getStorePlanogramCompliance(s.storeId);
      return { ...s, report };
    }).sort((a, b) => a.report.overallScore - b.report.overallScore);
  }, [stores]);

  // ── Store-level detail view ──
  const selectedProfile = selectedStoreId ? stores.find(s => s.storeId === selectedStoreId) : null;
  const selectedReport = selectedStoreId ? storeReports.find(s => s.storeId === selectedStoreId)?.report : null;

  if (selectedProfile && selectedReport) {
    const { fixtures } = selectedReport;
    const overdue = fixtures.filter(f => f.taskStatus === 'overdue');
    const withNegativeLift = fixtures.filter(f => f.salesLiftPct < 0);

    return (
      <div className="space-y-6">
        <button type="button" onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 font-medium">
          <ArrowRight className="w-3.5 h-3.5 rotate-180" /> Back to all stores
        </button>

        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{selectedProfile.storeName}</h3>
            <p className="text-sm text-gray-500">{selectedProfile.city} · {selectedProfile.format} · Grade {selectedProfile.grade}</p>
          </div>
          <Badge variant={selectedReport.overallScore >= 80 ? 'success' : selectedReport.overallScore >= 60 ? 'warning' : 'error'} size="sm">
            {selectedReport.overallScore}% planogram compliance
          </Badge>
        </div>

        <MetricGrid>
          <MetricCard label="Overall Score" value={`${selectedReport.overallScore}%`} icon={Target} iconColor={selectedReport.overallScore >= 80 ? 'success' : 'warning'} status={selectedReport.overallScore >= 80 ? 'on-track' : selectedReport.overallScore >= 60 ? 'warning' : 'critical'} subtitle={`${selectedReport.fixturesCompliant} of ${selectedReport.fixturesTotal} fixtures compliant`} />
          <MetricCard label="Tasks Completed" value={`${selectedReport.tasksCompleted}/${selectedReport.tasksTotal}`} icon={CheckCircle2} iconColor={selectedReport.tasksCompleted === selectedReport.tasksTotal ? 'success' : 'info'} subtitle={`${Math.round((selectedReport.tasksCompleted / selectedReport.tasksTotal) * 100)}% done`} status={selectedReport.tasksCompleted === selectedReport.tasksTotal ? 'on-track' : 'warning'} />
          <MetricCard label="Avg Image Score" value={selectedReport.avgImageScore !== null ? `${selectedReport.avgImageScore}%` : '—'} icon={FileCheck} iconColor={selectedReport.avgImageScore !== null && selectedReport.avgImageScore >= 75 ? 'success' : 'warning'} subtitle={`${selectedReport.fixturesAudited} of ${selectedReport.fixturesTotal} scored by AI`} />
          <MetricCard label="Sales Lift" value={`${selectedReport.salesLiftPct > 0 ? '+' : ''}${selectedReport.salesLiftPct}%`} icon={TrendingUp} iconColor={selectedReport.salesLiftPct > 0 ? 'success' : 'error'} subtitle="Avg SPSF change post-planogram" status={selectedReport.salesLiftPct > 3 ? 'on-track' : selectedReport.salesLiftPct > 0 ? 'warning' : 'critical'} />
        </MetricGrid>

        {/* Fixture-level detail table */}
        <SectionHeader title="Fixture-level Planogram Compliance" subtitle="Suggested vs executed planogram per fixture — expand for scoring breakdown & sales impact" />
        <DataTable>
          <DataTableHeader>
            <DataTableHead>Fixture</DataTableHead>
            <DataTableHead className="text-right">Suggested</DataTableHead>
            <DataTableHead className="text-right">Executed</DataTableHead>
            <DataTableHead className="text-right">Match %</DataTableHead>
            <DataTableHead className="text-right">Score</DataTableHead>
            <DataTableHead>Image</DataTableHead>
            <DataTableHead>Task</DataTableHead>
            <DataTableHead className="text-right">Sales Lift</DataTableHead>
            <DataTableHead className="w-8" />
          </DataTableHeader>
          <DataTableBody>
            {fixtures.map(f => {
              const isExpanded = expandedFixture === f.fixtureCode;
              return (
                <Fragment key={f.fixtureCode}>
                  <DataTableRow
                    onClick={() => setExpandedFixture(isExpanded ? null : f.fixtureCode)}
                    className="cursor-pointer"
                  >
                    <DataTableCell>
                      <p className="text-sm font-medium text-gray-900">{f.fixtureName}</p>
                      <p className="text-xs text-gray-400">{f.fixtureCode} · {f.segment}</p>
                    </DataTableCell>
                    <DataTableCell className="text-right tabular-nums">{f.suggestedOptions}</DataTableCell>
                    <DataTableCell className="text-right tabular-nums">{f.executedOptions}</DataTableCell>
                    <DataTableCell className="text-right tabular-nums">
                      <span className={scoreColor(f.productMatchPct)}>{f.productMatchPct}%</span>
                    </DataTableCell>
                    <DataTableCell className="text-right">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold ${scoreBg(f.overallScore)}`}>
                        {f.overallScore}
                      </span>
                    </DataTableCell>
                    <DataTableCell>
                      {f.imageGrade ? (
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold ${scoreBg(f.imageScore ?? 0)}`}>
                          {f.imageGrade}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </DataTableCell>
                    <DataTableCell>
                      <Badge variant={taskBadge(f.taskStatus).v} size="sm">{taskBadge(f.taskStatus).l}</Badge>
                    </DataTableCell>
                    <DataTableCell className="text-right tabular-nums">
                      <span className={f.salesLiftPct >= 0 ? 'text-green-700' : 'text-red-700'}>
                        {f.salesLiftPct > 0 ? '+' : ''}{f.salesLiftPct}%
                      </span>
                    </DataTableCell>
                    <DataTableCell className="text-right">
                      {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-gray-400" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-400" />}
                    </DataTableCell>
                  </DataTableRow>

                  {/* Expanded detail row */}
                  {isExpanded && (
                    <DataTableRow className="bg-gray-50">
                      <DataTableCell colSpan={9}>
                        <div className="py-2 grid grid-cols-3 gap-6">
                          {/* Column 1: Score breakdown */}
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Score Breakdown</p>
                            <div className="space-y-1.5">
                              {[
                                { label: 'Elevation Accuracy', val: f.elevationScore, weight: '35%' },
                                { label: 'Facing Count', val: f.facingScore, weight: '35%' },
                                { label: 'Adjacency Rules', val: f.adjacencyScore, weight: '30%' },
                              ].map(d => (
                                <div key={d.label} className="flex items-center gap-2">
                                  <span className="text-xs text-gray-600 w-28">{d.label}</span>
                                  <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                      className={d.val >= 80 ? 'bg-green-500 h-full' : d.val >= 60 ? 'bg-amber-400 h-full' : 'bg-red-500 h-full'}
                                      style={{ width: `${d.val}%` }}
                                    />
                                  </div>
                                  <span className={`text-xs tabular-nums w-8 text-right font-medium ${scoreColor(d.val)}`}>{d.val}</span>
                                  <span className="text-[10px] text-gray-400 w-6">({d.weight})</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Column 2: Image scoring */}
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Image Scoring</p>
                            {f.imageScore !== null ? (
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className={`text-2xl font-bold ${scoreColor(f.imageScore)}`}>{f.imageGrade}</span>
                                  <span className="text-sm text-gray-500">({f.imageScore}/100)</span>
                                </div>
                                <p className="text-xs text-gray-500">
                                  {f.imageScore >= 90 ? 'Excellent — planogram matches reference image closely'
                                    : f.imageScore >= 75 ? 'Good — minor elevation deviations detected'
                                    : f.imageScore >= 60 ? 'Acceptable — multiple fixture positions differ from plan'
                                    : 'Poor — significant deviation from suggested planogram'}
                                </p>
                                <p className="text-[10px] text-gray-400 mt-1">Last scored: {f.lastAuditDate}</p>
                              </div>
                            ) : (
                              <div className="text-xs text-gray-400 italic">Not yet scored — awaiting store photo upload</div>
                            )}
                          </div>

                          {/* Column 3: Sales impact */}
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Sales Impact</p>
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-600">SPSF Before</span>
                                <span className="tabular-nums font-medium">Rs {f.weeklySpsfBefore}</span>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-600">SPSF After</span>
                                <span className="tabular-nums font-medium">Rs {f.weeklySpsfAfter}</span>
                              </div>
                              <div className="flex items-center justify-between text-xs border-t border-gray-200 pt-1">
                                <span className="text-gray-700 font-medium">Net Lift</span>
                                <span className={`tabular-nums font-semibold ${f.salesLiftPct >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                  {f.salesLiftPct > 0 ? '+' : ''}{f.salesLiftPct}%
                                </span>
                              </div>
                              <p className="text-[10px] text-gray-400 mt-1">
                                {f.overallScore >= 80 && f.salesLiftPct > 5 ? 'High compliance driving measurable uplift' : f.overallScore < 60 ? 'Low compliance — potential sales leakage' : 'Moderate compliance — review fixture for optimization'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </DataTableCell>
                    </DataTableRow>
                  )}
                </Fragment>
              );
            })}
          </DataTableBody>
        </DataTable>

        {/* Action callouts */}
        {overdue.length > 0 && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-medium text-red-800">Overdue Fixtures ({overdue.length})</p>
            <p className="text-xs text-red-700 mt-1">
              {overdue.map(f => f.fixtureCode).join(', ')} — planogram correction tasks past due. Escalate to store manager.
            </p>
          </div>
        )}

        {withNegativeLift.length > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-medium text-amber-800">Negative Sales Impact ({withNegativeLift.length} fixtures)</p>
            <p className="text-xs text-amber-700 mt-1">
              These fixtures show declining SPSF post-planogram update. Review whether the new planogram fits local demand patterns.
            </p>
          </div>
        )}
      </div>
    );
  }

  // ── Network-level compliance dashboard ──

  const avgScore = storeReports.length > 0 ? Math.round(storeReports.reduce((s, c) => s + c.report.overallScore, 0) / storeReports.length) : 0;
  const compliantStores = storeReports.filter(c => c.report.overallScore >= 80).length;
  const criticalStores = storeReports.filter(c => c.report.overallScore < 60).length;
  const totalTasks = storeReports.reduce((s, c) => s + c.report.tasksTotal, 0);
  const completedTasks = storeReports.reduce((s, c) => s + c.report.tasksCompleted, 0);
  const taskPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const avgLift = storeReports.length > 0 ? Math.round(storeReports.reduce((s, c) => s + c.report.salesLiftPct, 0) / storeReports.length * 10) / 10 : 0;

  return (
    <div className="space-y-6">
      <MetricGrid>
        <MetricCard label="Avg Compliance" value={`${avgScore}%`} icon={Target} iconColor={avgScore >= 80 ? 'success' : 'warning'} subtitle={`${compliantStores} of ${storeReports.length} stores compliant`} status={avgScore >= 80 ? 'on-track' : 'warning'} />
        <MetricCard label="Critical Stores" value={String(criticalStores)} icon={AlertTriangle} iconColor="error" subtitle="Below 60% compliance" status={criticalStores > 0 ? 'critical' : 'on-track'} />
        <MetricCard label="Task Completion" value={`${taskPct}%`} icon={CheckCircle2} iconColor={taskPct >= 80 ? 'success' : 'warning'} subtitle={`${completedTasks} of ${totalTasks} fixture tasks done`} status={taskPct >= 80 ? 'on-track' : 'warning'} />
        <MetricCard label="Avg Sales Lift" value={`${avgLift > 0 ? '+' : ''}${avgLift}%`} icon={TrendingUp} iconColor={avgLift > 0 ? 'success' : 'error'} subtitle="SPSF change post-planogram" status={avgLift > 3 ? 'on-track' : avgLift > 0 ? 'warning' : 'critical'} />
      </MetricGrid>

      <SectionHeader title="Store Planogram Compliance" subtitle="Suggested vs executed planogram scoring — click a store for fixture-level detail" />
      <DataTable>
        <DataTableHeader>
          <DataTableHead>Store</DataTableHead>
          <DataTableHead className="text-right">Score</DataTableHead>
          <DataTableHead className="text-right">Fixtures</DataTableHead>
          <DataTableHead className="text-right">Tasks</DataTableHead>
          <DataTableHead className="text-right">Img Score</DataTableHead>
          <DataTableHead className="text-right">Sales Lift</DataTableHead>
          <DataTableHead>Status</DataTableHead>
          <DataTableHead className="w-12" />
        </DataTableHeader>
        <DataTableBody>
          {storeReports.map(s => {
            const r = s.report;
            const variant = r.overallScore >= 80 ? 'success' as const : r.overallScore >= 60 ? 'warning' as const : 'error' as const;
            const label = r.overallScore >= 80 ? 'Compliant' : r.overallScore >= 60 ? 'Partial' : 'Non-Compliant';
            return (
              <DataTableRow key={s.storeId} onClick={() => onSelectStore(s.storeId)} className="cursor-pointer">
                <DataTableCell>
                  <p className="text-sm font-medium text-gray-900">{s.storeName}</p>
                  <p className="text-xs text-gray-500">{s.city} · {s.format} · Grade {s.grade}</p>
                </DataTableCell>
                <DataTableCell className="text-right tabular-nums font-medium">
                  <span className={scoreColor(r.overallScore)}>{r.overallScore}%</span>
                </DataTableCell>
                <DataTableCell className="text-right tabular-nums">
                  <span className="text-green-700">{r.fixturesCompliant}</span>
                  <span className="text-gray-400">/{r.fixturesTotal}</span>
                </DataTableCell>
                <DataTableCell className="text-right tabular-nums">
                  <span className={r.tasksCompleted === r.tasksTotal ? 'text-green-700' : 'text-amber-700'}>{r.tasksCompleted}</span>
                  <span className="text-gray-400">/{r.tasksTotal}</span>
                </DataTableCell>
                <DataTableCell className="text-right tabular-nums">
                  {r.avgImageScore !== null ? (
                    <span className={scoreColor(r.avgImageScore)}>{r.avgImageScore}%</span>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </DataTableCell>
                <DataTableCell className="text-right tabular-nums">
                  <span className={r.salesLiftPct >= 0 ? 'text-green-700' : 'text-red-700'}>
                    {r.salesLiftPct > 0 ? '+' : ''}{r.salesLiftPct}%
                  </span>
                </DataTableCell>
                <DataTableCell><Badge variant={variant} size="sm">{label}</Badge></DataTableCell>
                <DataTableCell className="text-right">
                  <span className="text-xs font-medium text-indigo-600">View →</span>
                </DataTableCell>
              </DataTableRow>
            );
          })}
        </DataTableBody>
      </DataTable>
    </div>
  );
}

// ─── Store Ops: Store Health View ─────────────────────────────────────────────

function StoreOpsHealthView({ stores, recs }: {
  stores: StoreSpaceProfile[];
  recs: SpaceRecommendation[];
}) {
  const [expandedCluster, setExpandedCluster] = useState<string | null>(null);
  const [expandedStoreId, setExpandedStoreId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const draft = stores.filter(s => s.planStatus === 'draft');
  const reviewed = stores.filter(s => s.planStatus === 'under-review');
  const locked = stores.filter(s => s.planStatus === 'locked' || s.planStatus === 'active');
  const withPendingRecs = stores.filter(s => recs.some(r => r.storeId === s.storeId));

  // Filter by plan status
  const filteredStores = statusFilter === 'all' ? stores
    : statusFilter === 'draft' ? draft
    : statusFilter === 'under-review' ? reviewed
    : locked;

  // Group by cluster and build summaries
  const clusterSummaries = useMemo(() => {
    const grouped: Record<string, StoreSpaceProfile[]> = {};
    for (const s of filteredStores) {
      (grouped[s.cluster] ??= []).push(s);
    }
    const summaries = Object.entries(grouped).map(([cluster, clusterStores]) => {
      const clusterRecs = recs.filter(r => clusterStores.some(s => s.storeId === r.storeId));
      const storesWithRecs = clusterStores.filter(s => recs.some(r => r.storeId === s.storeId)).length;
      const draftCount = clusterStores.filter(s => s.planStatus === 'draft').length;
      const lockedCount = clusterStores.filter(s => s.planStatus === 'locked' || s.planStatus === 'active').length;
      const avgSpsf = Math.round(clusterStores.reduce((sum, s) => sum + s.spsf, 0) / clusterStores.length);
      return { cluster, stores: clusterStores, recCount: clusterRecs.length, storesWithRecs, draftCount, lockedCount, avgSpsf };
    });
    summaries.sort((a, b) => {
      if (a.storesWithRecs > 0 && b.storesWithRecs === 0) return -1;
      if (b.storesWithRecs > 0 && a.storesWithRecs === 0) return 1;
      return a.avgSpsf - b.avgSpsf;
    });
    return summaries;
  }, [filteredStores, recs]);

  // Sort stores within an expanded cluster
  const sortClusterStores = (clusterStores: StoreSpaceProfile[]) =>
    [...clusterStores].sort((a, b) => {
      const aRecs = recs.filter(r => r.storeId === a.storeId).length;
      const bRecs = recs.filter(r => r.storeId === b.storeId).length;
      if (aRecs > 0 && bRecs === 0) return -1;
      if (bRecs > 0 && aRecs === 0) return 1;
      return a.spsf - b.spsf;
    });

  const planBadge = (status: string) => {
    if (status === 'locked' || status === 'active') return { variant: 'success' as const, label: 'Locked' };
    if (status === 'under-review') return { variant: 'default' as const, label: 'Under Review' };
    return { variant: 'warning' as const, label: 'Draft' };
  };

  return (
    <div className="space-y-6">
      <MetricGrid>
        <MetricCard label="Plans Locked" value={String(locked.length)} icon={Lock} iconColor="success" subtitle={`${Math.round((locked.length / stores.length) * 100)}% of ${stores.length} stores`} status="on-track" />
        <MetricCard label="Under Review" value={String(reviewed.length)} icon={FileCheck} iconColor="info" subtitle="Awaiting approval" />
        <MetricCard label="Draft" value={String(draft.length)} icon={Clock} iconColor="warning" subtitle="Not yet submitted" status={draft.length > stores.length * 0.3 ? 'warning' : 'on-track'} />
        <MetricCard label="Pending Recs" value={String(withPendingRecs.length)} icon={Lightbulb} iconColor="warning" subtitle="Stores with unactioned recommendations" status="warning" />
      </MetricGrid>

      <SectionHeader title="Cluster Health" subtitle={`${clusterSummaries.length} clusters · ${filteredStores.length} stores — drill into a cluster to view stores`} />

      <FilterBar>
        <FilterPills
          value={statusFilter}
          onChange={(v) => { setStatusFilter(v); setExpandedCluster(null); setExpandedStoreId(null); }}
          options={[
            { value: 'all', label: 'All', count: stores.length },
            { value: 'draft', label: 'Draft', count: draft.length },
            { value: 'under-review', label: 'Under Review', count: reviewed.length },
            { value: 'locked', label: 'Locked', count: locked.length },
          ]}
        />
      </FilterBar>

      {/* ── Cluster accordion ─────────────────────────────────────────────── */}
      <div className="space-y-2">
        {clusterSummaries.map(cs => {
          const isClusterOpen = expandedCluster === cs.cluster;
          const lockedPct = cs.stores.length > 0 ? Math.round((cs.lockedCount / cs.stores.length) * 100) : 0;

          return (
            <div key={cs.cluster} className="border border-gray-200 rounded-lg bg-white overflow-hidden">
              {/* Cluster header row */}
              <button
                onClick={() => { setExpandedCluster(isClusterOpen ? null : cs.cluster); setExpandedStoreId(null); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
              >
                {isClusterOpen ? <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />}
                <MapPin className="w-4 h-4 text-indigo-500 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900">{cs.cluster}</p>
                  <p className="text-xs text-gray-500">{cs.stores.length} store{cs.stores.length !== 1 ? 's' : ''} · Avg Rs {cs.avgSpsf}/sft</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {cs.draftCount > 0 && <Badge variant="warning" size="sm">{cs.draftCount} draft</Badge>}
                  {cs.storesWithRecs > 0 && <Badge variant="error" size="sm">{cs.recCount} rec{cs.recCount > 1 ? 's' : ''}</Badge>}
                  <span className="text-xs tabular-nums text-gray-500">{lockedPct}% locked</span>
                </div>
              </button>

              {/* Expanded cluster → store list */}
              {isClusterOpen && (
                <div className="border-t border-gray-100 bg-gray-50/50">
                  <div className="px-4 py-2 flex items-center gap-2 border-b border-gray-100">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Stores in {cs.cluster}</span>
                    <span className="text-xs text-gray-400">({cs.stores.length})</span>
                  </div>
                  <div className="space-y-px">
                    {sortClusterStores(cs.stores).map(s => {
                      const storeRecs = recs.filter(r => r.storeId === s.storeId);
                      const isStoreOpen = expandedStoreId === s.storeId;
                      const pb = planBadge(s.planStatus);

                      return (
                        <div key={s.storeId} className="bg-white">
                          <button
                            onClick={() => setExpandedStoreId(isStoreOpen ? null : s.storeId)}
                            className="w-full flex items-center gap-3 px-6 py-2.5 text-left hover:bg-gray-50 transition-colors"
                          >
                            {isStoreOpen ? <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />}
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900">{s.storeName}</p>
                              <p className="text-xs text-gray-500">{s.city} · {s.grade} · {s.hit}</p>
                            </div>
                            <span className="text-sm tabular-nums text-gray-700">Rs {s.spsf}</span>
                            <Badge variant={pb.variant} size="sm">{pb.label}</Badge>
                            {storeRecs.length > 0 && (
                              <Badge variant="warning" size="sm">{storeRecs.length} rec{storeRecs.length > 1 ? 's' : ''}</Badge>
                            )}
                          </button>

                          {/* Store expanded → recommendation cards */}
                          {isStoreOpen && (
                            <div className="px-6 pb-3 pt-1 border-t border-gray-100">
                              {storeRecs.length === 0 ? (
                                <p className="text-xs text-gray-400 py-2">No pending recommendations for this store.</p>
                              ) : (
                                <div className="space-y-2 mt-2">
                                  {storeRecs.map(r => (
                                    <div key={r.id} className="rounded-md border border-gray-100 bg-gray-50 p-3">
                                      <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0 flex-1">
                                          <p className="text-sm font-medium text-gray-900">{r.title}</p>
                                          <p className="text-xs text-gray-500 mt-0.5">{r.trigger}</p>
                                        </div>
                                        <div className="flex items-center gap-3 shrink-0">
                                          <span className={cn('text-sm font-semibold tabular-nums', r.spsfDelta >= 0 ? 'text-green-700' : 'text-red-700')}>
                                            {r.spsfDelta >= 0 ? '+' : ''}{r.spsfDelta} Rs/sft
                                          </span>
                                          <Badge variant={r.executionPath.stockStatus === 'in-dc' ? 'success' : r.executionPath.stockStatus === 'in-pipeline' ? 'warning' : 'error'} size="sm">
                                            {r.executionPath.stockStatus === 'in-dc' ? 'In DC' : r.executionPath.stockStatus === 'in-pipeline' ? 'In Pipeline' : 'Needs RA'}
                                          </Badge>
                                        </div>
                                      </div>
                                      <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                                        <span>{r.segment}: {r.currentSpacePct}% → {r.recommendedSpacePct}%</span>
                                        <span>{r.currentSft.toLocaleString()} → {r.newSft.toLocaleString()} sft</span>
                                        <span>{r.currentOptions} → {r.newOptionCapacity} options</span>
                                        {r.executionPath.etaWeeks && <span className="text-amber-600">{r.executionPath.etaWeeks}w ETA</span>}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Store Ops: Task Tracker View ─────────────────────────────────────────────

function StoreOpsTaskTrackerView({ tasks, onUpdateTask }: {
  tasks: PulsePointTask[];
  onUpdateTask: (taskId: string, status: PulsePointTask['status']) => void;
}) {
  const pushed = tasks.filter(t => t.status === 'pushed');
  const inProgress = tasks.filter(t => t.status === 'in-progress');
  const completed = tasks.filter(t => t.status === 'completed');

  return (
    <div className="space-y-6">
      <MetricGrid>
        <MetricCard label="Total Tasks" value={String(tasks.length)} icon={Layers} iconColor="info" subtitle="All PulsePoint tasks" />
        <MetricCard label="Pushed" value={String(pushed.length)} icon={Send} iconColor="warning" subtitle="Awaiting store action" status={pushed.length > 0 ? 'warning' : 'on-track'} />
        <MetricCard label="In Progress" value={String(inProgress.length)} icon={RefreshCw} iconColor="info" subtitle="Being implemented" />
        <MetricCard label="Completed" value={String(completed.length)} icon={CheckCircle2} iconColor="success" subtitle={tasks.length > 0 ? `${Math.round((completed.length / tasks.length) * 100)}% completion` : 'No tasks yet'} status="on-track" />
      </MetricGrid>

      {tasks.length === 0 ? (
        <EmptyState
          icon={Send}
          title="No tasks yet"
          description="Tasks will appear here when recommendations are pushed to stores via the Space Planner view. Switch to Space Planner persona and push recommendations to generate PulsePoint tasks."
        />
      ) : (
        <>
          <SectionHeader title="Active Tasks" subtitle={`${pushed.length + inProgress.length} tasks requiring attention`} />
          <DataTable>
            <DataTableHeader>
              <DataTableHead>Task</DataTableHead>
              <DataTableHead>Store</DataTableHead>
              <DataTableHead>Assignee</DataTableHead>
              <DataTableHead>Status</DataTableHead>
              <DataTableHead className="text-right">Action</DataTableHead>
            </DataTableHeader>
            <DataTableBody>
              {tasks.map(t => (
                <DataTableRow key={t.id}>
                  <DataTableCell>
                    <p className="text-sm font-medium text-gray-900">{t.title}</p>
                    <p className="text-xs text-gray-500">{t.description}</p>
                  </DataTableCell>
                  <DataTableCell className="text-sm">{t.storeName}</DataTableCell>
                  <DataTableCell className="text-sm">{t.assignee}</DataTableCell>
                  <DataTableCell>
                    <Badge variant={t.status === 'completed' ? 'success' : t.status === 'in-progress' ? 'default' : 'warning'} size="sm">
                      {t.status === 'pushed' ? 'Pushed' : t.status === 'in-progress' ? 'In Progress' : 'Completed'}
                    </Badge>
                  </DataTableCell>
                  <DataTableCell className="text-right">
                    {t.status === 'pushed' && (
                      <button className="rounded bg-indigo-600 px-2 py-1 text-xs font-medium text-white hover:bg-indigo-700 transition-colors" onClick={() => onUpdateTask(t.id, 'in-progress')}>
                        Mark In-Progress
                      </button>
                    )}
                    {t.status === 'in-progress' && (
                      <button className="rounded bg-green-600 px-2 py-1 text-xs font-medium text-white hover:bg-green-700 transition-colors" onClick={() => onUpdateTask(t.id, 'completed')}>
                        Mark Completed
                      </button>
                    )}
                    {t.status === 'completed' && (
                      <span className="text-xs text-gray-400">Done</span>
                    )}
                  </DataTableCell>
                </DataTableRow>
              ))}
            </DataTableBody>
          </DataTable>
        </>
      )}
    </div>
  );
}

// ─── Cluster Manager: Cluster Overview ────────────────────────────────────────

function ClusterOverviewView({ stores, recs, spsfTargets, onViewCluster }: {
  stores: StoreSpaceProfile[];
  recs: SpaceRecommendation[];
  spsfTargets: { grade: string; target: number; current: number; floor: number }[];
  onViewCluster: () => void;
}) {
  const clusters = useMemo(() => {
    const map: Record<string, StoreSpaceProfile[]> = {};
    for (const s of stores) {
      if (!map[s.cluster]) map[s.cluster] = [];
      map[s.cluster]!.push(s);
    }
    return Object.entries(map).map(([cluster, clusterStores]) => {
      const avgSpsf = Math.round(clusterStores.reduce((a, s) => a + s.spsf, 0) / clusterStores.length);
      const avgGmrof = Math.round(clusterStores.reduce((a, s) => a + s.gmrof, 0) / clusterStores.length);
      const avgUtil = Math.round((clusterStores.reduce((a, s) => a + s.fixtureUtilization, 0) / clusterStores.length) * 10) / 10;
      const belowFloor = clusterStores.filter(s => {
        const t = spsfTargets.find(sp => sp.grade === s.grade);
        return t ? s.spsf < t.floor : false;
      }).length;
      const pendingRecs = recs.filter(r => clusterStores.some(s => s.storeId === r.storeId)).length;
      return { cluster, stores: clusterStores, count: clusterStores.length, avgSpsf, avgGmrof, avgUtil, belowFloor, pendingRecs };
    }).sort((a, b) => a.avgSpsf - b.avgSpsf);
  }, [stores, recs, spsfTargets]);

  const networkAvg = Math.round(stores.reduce((a, s) => a + s.spsf, 0) / stores.length);

  return (
    <div className="space-y-6">
      <MetricGrid>
        <MetricCard label="Total Clusters" value={String(clusters.length)} icon={Users} iconColor="info" subtitle={`${stores.length} stores across all clusters`} />
        <MetricCard label="Network Avg SPSF" value={`Rs ${networkAvg}`} icon={TrendingUp} iconColor="info" subtitle="Benchmark for comparison" />
        <MetricCard label="Underperforming Clusters" value={String(clusters.filter(c => c.avgSpsf < networkAvg).length)} icon={AlertTriangle} iconColor="warning" subtitle="Below AOP plan target" status={clusters.filter(c => c.avgSpsf < networkAvg).length >= 3 ? 'warning' : 'on-track'} />
      </MetricGrid>

      <SectionHeader title="Cluster Performance Ranking" subtitle="Sorted by average SPSF (lowest first)" />
      <DataTable>
        <DataTableHeader>
          <DataTableHead>Cluster</DataTableHead>
          <DataTableHead className="text-right">Stores</DataTableHead>
          <DataTableHead className="text-right">Avg SPSF</DataTableHead>
          <DataTableHead className="text-right">Avg GMROF</DataTableHead>
          <DataTableHead className="text-right">Avg Util.</DataTableHead>
          <DataTableHead className="text-right">Below Floor</DataTableHead>
          <DataTableHead className="text-right">Pending Recs</DataTableHead>
          <DataTableHead className="w-8" />
        </DataTableHeader>
        <DataTableBody>
          {clusters.map(c => (
            <DataTableRow key={c.cluster} onClick={onViewCluster} className="cursor-pointer">
              <DataTableCell className="font-medium text-gray-900">{c.cluster}</DataTableCell>
              <DataTableCell className="text-right tabular-nums">{c.count}</DataTableCell>
              <DataTableCell className="text-right tabular-nums">
                <span className={c.avgSpsf < networkAvg ? 'text-red-700 font-medium' : 'text-green-700'}>Rs {c.avgSpsf}</span>
              </DataTableCell>
              <DataTableCell className="text-right tabular-nums">Rs {c.avgGmrof}</DataTableCell>
              <DataTableCell className="text-right tabular-nums">{c.avgUtil}%</DataTableCell>
              <DataTableCell className="text-right tabular-nums">
                {c.belowFloor > 0 ? <span className="text-red-700">{c.belowFloor}</span> : <span className="text-gray-400">0</span>}
              </DataTableCell>
              <DataTableCell className="text-right tabular-nums">{c.pendingRecs}</DataTableCell>
              <DataTableCell><ChevronRight className="w-4 h-4 text-gray-400" /></DataTableCell>
            </DataTableRow>
          ))}
        </DataTableBody>
      </DataTable>
    </div>
  );
}

// ─── Cluster Manager: Store Comparison ────────────────────────────────────────

function ClusterStoreComparisonView({ stores, spsfTargets, onSelectStore }: {
  stores: StoreSpaceProfile[];
  spsfTargets: { grade: string; target: number; current: number; floor: number }[];
  onSelectStore: (id: string) => void;
}) {
  const clusterNames = [...new Set(stores.map(s => s.cluster))].sort();
  const [selectedCluster, setSelectedCluster] = useState(clusterNames[0] || '');
  const clusterStores = stores.filter(s => s.cluster === selectedCluster).sort((a, b) => b.spsf - a.spsf);

  return (
    <div className="space-y-6">
      <FilterBar>
        <FilterSelect
          value={selectedCluster}
          onChange={setSelectedCluster}
          options={clusterNames.map(c => ({ value: c, label: c }))}
          placeholder="Select cluster"
        />
      </FilterBar>

      <SectionHeader title={`${selectedCluster} — ${clusterStores.length} Stores`} subtitle="Ranked by SPSF (highest first)" />
      <DataTable>
        <DataTableHeader>
          <DataTableHead>Store</DataTableHead>
          <DataTableHead className="text-right">Carpet Area</DataTableHead>
          <DataTableHead className="text-right">SPSF</DataTableHead>
          <DataTableHead className="text-right">vs Target</DataTableHead>
          <DataTableHead className="text-right">GMROF</DataTableHead>
          <DataTableHead className="text-right">Fixtures</DataTableHead>
          <DataTableHead className="text-right">Util.</DataTableHead>
          <DataTableHead>Plan</DataTableHead>
        </DataTableHeader>
        <DataTableBody>
          {clusterStores.map(s => {
            const t = spsfTargets.find(sp => sp.grade === s.grade);
            const gap = t ? Math.round(((s.spsf - t.target) / t.target) * 100) : 0;
            return (
              <DataTableRow key={s.storeId} onClick={() => onSelectStore(s.storeId)} className="cursor-pointer">
                <DataTableCell>
                  <p className="text-sm font-medium text-gray-900">{s.storeName}</p>
                  <p className="text-xs text-gray-500">{s.format} · {s.grade}</p>
                </DataTableCell>
                <DataTableCell className="text-right tabular-nums">{s.carpetArea.toLocaleString()} Sq.Ft.</DataTableCell>
                <DataTableCell className="text-right tabular-nums font-medium">Rs {s.spsf}</DataTableCell>
                <DataTableCell className="text-right tabular-nums">
                  <span className={gap >= 0 ? 'text-green-700' : 'text-red-700'}>{gap >= 0 ? '+' : ''}{gap}%</span>
                </DataTableCell>
                <DataTableCell className="text-right tabular-nums">Rs {s.gmrof}</DataTableCell>
                <DataTableCell className="text-right tabular-nums">{s.totalFixtures}</DataTableCell>
                <DataTableCell className="text-right tabular-nums">{s.fixtureUtilization}%</DataTableCell>
                <DataTableCell>
                  <Badge variant={planStatusBadge(s.planStatus).variant} size="sm">
                    {planStatusBadge(s.planStatus).label}
                  </Badge>
                </DataTableCell>
              </DataTableRow>
            );
          })}
        </DataTableBody>
      </DataTable>
    </div>
  );
}

// ─── Store Manager: My Store View ─────────────────────────────────────────────

function StoreManagerMyStoreView({ stores, segments, recs, spsfTargets }: {
  stores: StoreSpaceProfile[];
  segments: StoreSegmentData[];
  recs: SpaceRecommendation[];
  spsfTargets: SPSFTarget[];
}) {
  // Default to first store as "my store"
  const myStore = stores[0];
  if (!myStore) return null;
  const t = spsfTargets.find(sp => sp.grade === myStore.grade);
  const mySegments = segments.find(s => s.storeId === myStore.storeId)?.segments ?? [];
  const myRecs = recs.filter(r => r.storeId === myStore.storeId);
  const gap = t ? Math.round(((myStore.spsf - t.target) / t.target) * 100) : 0;
  const density = getStockingDensity(myStore.storeId);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-base font-semibold text-gray-900">{myStore.storeName}</h3>
            <p className="text-sm text-gray-500">{myStore.city} · {myStore.format} · Grade {myStore.grade} · {myStore.cluster}</p>
          </div>
          <Badge variant={planStatusBadge(myStore.planStatus).variant}>
            {planStatusBadge(myStore.planStatus).label}
          </Badge>
        </div>
      </div>

      <MetricGrid>
        <MetricCard label={<>My <KpiLabel abbr="SPSF" /></>} value={`Rs ${myStore.spsf}`} icon={TrendingUp} iconColor={gap >= 0 ? 'success' : 'error'} subtitle={`Target Rs ${t?.target ?? '—'} (${gap >= 0 ? '+' : ''}${gap}%)`} status={gap >= 0 ? 'on-track' : gap >= -10 ? 'warning' : 'critical'} />
        <MetricCard label={<>My <KpiLabel abbr="GMROF" /></>} value={`Rs ${myStore.gmrof}`} icon={LayoutGrid} iconColor="success" subtitle="Gross margin return on footage" status="on-track" />
        <MetricCard label="Carpet Area" value={`${myStore.carpetArea.toLocaleString()} Sq.Ft.`} icon={Maximize2} iconColor="info" subtitle={`Saleable: ${myStore.saleableArea.toLocaleString()} Sq.Ft. (${myStore.saleableRatio}%)`} />
        <MetricCard label="Pending Recs" value={String(myRecs.length)} icon={Lightbulb} iconColor="warning" subtitle={myRecs.length > 0 ? 'Action required' : 'All clear'} status={myRecs.length > 0 ? 'warning' : 'on-track'} />
      </MetricGrid>

      <SectionHeader title="Category Performance" subtitle="SPSF, efficiency & space-to-sales alignment per category" />
      <DataTable>
        <DataTableHeader>
          <DataTableHead>Category</DataTableHead>
          <DataTableHead className="text-right">Space %</DataTableHead>
          <DataTableHead className="text-right">Sales %</DataTableHead>
          <DataTableHead className="text-right">Efficiency</DataTableHead>
          <DataTableHead className="text-right">GMROF</DataTableHead>
          <DataTableHead className="text-right">Options</DataTableHead>
          <DataTableHead>Signal</DataTableHead>
        </DataTableHeader>
        <DataTableBody>
          {mySegments.sort((a, b) => b.efficiency - a.efficiency).map(seg => {
            const effColor = seg.efficiency >= 1.1 ? 'text-green-700' : seg.efficiency >= 0.9 ? 'text-gray-700' : 'text-red-700';
            const signal = seg.efficiency >= 1.1 ? 'Expand' : seg.efficiency >= 0.9 ? 'Hold' : 'Contract';
            const signalVariant = seg.efficiency >= 1.1 ? 'success' : seg.efficiency >= 0.9 ? 'default' : 'error';
            return (
              <DataTableRow key={seg.segmentCode}>
                <DataTableCell className="font-medium text-gray-900">{seg.segment}</DataTableCell>
                <DataTableCell className="text-right tabular-nums">{seg.spacePercent}%</DataTableCell>
                <DataTableCell className="text-right tabular-nums">{seg.nsvPercent}%</DataTableCell>
                <DataTableCell className="text-right">
                  <span className={cn('font-semibold tabular-nums', effColor)}>{seg.efficiency.toFixed(2)}</span>
                </DataTableCell>
                <DataTableCell className="text-right tabular-nums">Rs {seg.gmrof}</DataTableCell>
                <DataTableCell className="text-right tabular-nums">{seg.options}</DataTableCell>
                <DataTableCell>
                  <Badge variant={signalVariant as 'success' | 'default' | 'error'} size="sm">{signal}</Badge>
                </DataTableCell>
              </DataTableRow>
            );
          })}
        </DataTableBody>
      </DataTable>

      {/* Space vs Sales — visual alignment */}
      <SectionHeader title="Space vs Sales Alignment" subtitle="Efficiency > 1.0 means category earns more than its share of space" />
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="space-y-2">
          {mySegments.sort((a, b) => b.efficiency - a.efficiency).map(seg => {
            const maxPct = Math.max(...mySegments.map(s => Math.max(s.spacePercent, s.nsvPercent)));
            const scale = 100 / (maxPct > 0 ? maxPct : 1);
            return (
              <div key={seg.segmentCode} className="flex items-center gap-3">
                <span className="text-xs font-medium text-gray-700 w-36 truncate">{seg.segment}</span>
                <div className="flex-1 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-400 w-12">Space</span>
                    <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gray-400 rounded-full" style={{ width: `${seg.spacePercent * scale}%` }} />
                    </div>
                    <span className="text-[10px] tabular-nums text-gray-500 w-8 text-right">{seg.spacePercent}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-400 w-12">Sales</span>
                    <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div className={cn('h-full rounded-full', seg.efficiency >= 1.0 ? 'bg-green-500' : 'bg-red-400')} style={{ width: `${seg.nsvPercent * scale}%` }} />
                    </div>
                    <span className="text-[10px] tabular-nums text-gray-500 w-8 text-right">{seg.nsvPercent}%</span>
                  </div>
                </div>
                <span className={cn('text-xs font-semibold tabular-nums w-10 text-right', seg.efficiency >= 1.0 ? 'text-green-700' : 'text-red-700')}>
                  {seg.efficiency.toFixed(2)}
                </span>
              </div>
            );
          })}
        </div>
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-4 text-[10px] text-gray-400">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-400" /> Space share</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> Sales share (efficient)</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400" /> Sales share (underperforming)</span>
        </div>
      </div>

      {/* Space-to-Sales Trend — 6-hit historical performance */}
      {(() => {
        const trend = getStoreSegmentTrend(myStore.storeId, mySegments, myStore.spsf);
        if (trend.length === 0) return null;

        // Colors per segment for the chart
        const segColors: Record<string, string> = { MC: '#6366f1', MF: '#0ea5e9', WIW: '#10b981', WWW: '#f59e0b', KW: '#ef4444' };

        return (
          <>
            <SectionHeader title="Space-to-Sales Trend" subtitle="Segment-level GMROF and category efficiency over last 6 hits" />

            {/* Segment GMROF trend — multi-line chart */}
            {(() => {
              // Reshape trend data for Recharts: each hit becomes { hit, MC, MF, WIW, WWW, KW }
              const segTrendData = trend.map(t => {
                const row: Record<string, string | number> = { hit: t.hit };
                for (const s of t.segments) row[s.segmentCode] = s.gmrof;
                return row;
              });

              return (
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Segment GMROF Trend</p>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={segTrendData} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="hit" tick={{ fontSize: 11, fill: '#6b7280' }} />
                        <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
                        <Tooltip formatter={(val) => [`Rs ${val}`, '']} contentStyle={{ fontSize: 12 }} />
                        <Legend iconType="circle" iconSize={6} wrapperStyle={{ fontSize: 11 }} />
                        {mySegments.map(seg => (
                          <Line key={seg.segmentCode} type="monotone" dataKey={seg.segmentCode} stroke={segColors[seg.segmentCode] ?? '#6b7280'} strokeWidth={2} dot={{ r: 3 }} name={seg.segment} />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="mt-2 text-[10px] text-gray-400">GMROF = Gross Margin Return on Footage (Rs per sq.ft. of segment area). Trend shows last 6 hits.</p>
                </div>
              );
            })()}

            {/* Category efficiency trend — sparklines in a table */}
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Category Efficiency Trend</p>
              <div className="space-y-3">
                {mySegments.sort((a, b) => b.efficiency - a.efficiency).map(seg => {
                  const segTrend = trend.map(t => {
                    const s = t.segments.find(s => s.segmentCode === seg.segmentCode);
                    return { hit: t.hit, efficiency: s?.efficiency ?? 1.0 };
                  });
                  const color = segColors[seg.segmentCode] ?? '#6b7280';
                  const first = segTrend[0]?.efficiency ?? 1.0;
                  const last = segTrend[segTrend.length - 1]?.efficiency ?? 1.0;
                  const delta = Math.round((last - first) * 100);

                  return (
                    <div key={seg.segmentCode} className="flex items-center gap-3">
                      <span className="text-xs font-medium text-gray-700 w-36 truncate">{seg.segment}</span>
                      <div className="flex-1 h-10">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={segTrend} margin={{ top: 2, right: 4, bottom: 2, left: 4 }}>
                            <Line type="monotone" dataKey="efficiency" stroke={color} strokeWidth={1.5} dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                      <span className="text-xs font-semibold tabular-nums text-gray-900 w-10 text-right">{last.toFixed(2)}</span>
                      <span className={cn('text-[10px] font-medium tabular-nums w-12 text-right', delta >= 0 ? 'text-green-700' : 'text-red-700')}>
                        {delta >= 0 ? '+' : ''}{delta}pp
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100 text-[10px] text-gray-400">
                Efficiency = Sales % / Space %. Above 1.0 means the category earns more than its space share. Trend shows last 6 hits (H1–H6).
              </div>
            </div>
          </>
        );
      })()}

      {density && (
        <>
          <SectionHeader title="Stocking Density" subtitle="Current inventory density metrics" />
          <MetricGrid>
            <MetricCard label="Current Density" value={`${density.current} pcs/sft`} icon={Layers} iconColor="info" subtitle={`Target: ${density.target} pcs/sft`} />
            <MetricCard label="Deviation" value={`${density.deviation > 0 ? '+' : ''}${density.deviation}%`} icon={RefreshCw} iconColor={density.ragStatus === 'green' ? 'success' : 'warning'} subtitle={density.ragStatus === 'green' ? 'Within range' : 'Needs attention'} status={density.ragStatus === 'green' ? 'on-track' : 'warning'} />
          </MetricGrid>
        </>
      )}
    </div>
  );
}

// ─── Store Manager: Action Items View ─────────────────────────────────────────

function StoreManagerActionItemsView({ stores, recs, tasks, onUpdateTask }: {
  stores: StoreSpaceProfile[];
  recs: SpaceRecommendation[];
  tasks: PulsePointTask[];
  onUpdateTask: (taskId: string, status: PulsePointTask['status']) => void;
}) {
  const myStore = stores[0];
  const [recActions, setRecActions] = useState<Record<string, 'acknowledged' | 'flagged'>>({});
  if (!myStore) return null;
  const myRecs = recs.filter(r => r.storeId === myStore.storeId);
  const myTasks = tasks.filter(t => t.storeId === myStore.storeId);
  const pendingRecs = myRecs.filter(r => !recActions[r.id]);
  const actionedRecs = myRecs.filter(r => recActions[r.id]);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-gray-900">{myStore.storeName} — Action Items</h3>
        <p className="text-xs text-gray-500 mt-1">{pendingRecs.length} pending recommendations + {myTasks.filter(t => t.status !== 'completed').length} active tasks</p>
      </div>

      {pendingRecs.length > 0 && (
        <>
          <SectionHeader title="Pending Recommendations" subtitle="AI-generated space optimization actions for your store" />
          <DataTable>
            <DataTableHeader>
              <DataTableHead>Recommendation</DataTableHead>
              <DataTableHead>Segment</DataTableHead>
              <DataTableHead className="text-right">Current</DataTableHead>
              <DataTableHead className="text-right">Recommended</DataTableHead>
              <DataTableHead className="text-right">Impact</DataTableHead>
              <DataTableHead className="text-right">Action</DataTableHead>
            </DataTableHeader>
            <DataTableBody>
              {pendingRecs.map(r => (
                <DataTableRow key={r.id}>
                  <DataTableCell>
                    <p className="text-sm font-medium text-gray-900">{r.title}</p>
                    <p className="text-xs text-gray-500">{r.segment}: {r.currentSpacePct}% → {r.recommendedSpacePct}%</p>
                  </DataTableCell>
                  <DataTableCell className="text-sm">{r.segment}</DataTableCell>
                  <DataTableCell className="text-right tabular-nums">{r.currentSpacePct}%</DataTableCell>
                  <DataTableCell className="text-right tabular-nums text-indigo-600 font-medium">{r.recommendedSpacePct}%</DataTableCell>
                  <DataTableCell className="text-right tabular-nums">
                    <span className={r.math.spsfDelta >= 0 ? 'text-green-700' : 'text-red-700'}>
                      {r.math.spsfDelta >= 0 ? '+' : ''}Rs {Math.round(r.math.spsfDelta)}
                    </span>
                  </DataTableCell>
                  <DataTableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button className="rounded bg-indigo-600 px-2 py-1 text-xs font-medium text-white hover:bg-indigo-700 transition-colors" onClick={() => setRecActions(prev => ({ ...prev, [r.id]: 'acknowledged' }))}>
                        Acknowledge
                      </button>
                      <button className="rounded border border-amber-300 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100 transition-colors" onClick={() => setRecActions(prev => ({ ...prev, [r.id]: 'flagged' }))}>
                        Flag Issue
                      </button>
                    </div>
                  </DataTableCell>
                </DataTableRow>
              ))}
            </DataTableBody>
          </DataTable>
        </>
      )}

      {actionedRecs.length > 0 && (
        <>
          <SectionHeader title="Actioned Recommendations" subtitle="Recommendations you have reviewed" />
          <DataTable>
            <DataTableHeader>
              <DataTableHead>Recommendation</DataTableHead>
              <DataTableHead>Segment</DataTableHead>
              <DataTableHead className="text-right">Change</DataTableHead>
              <DataTableHead>Status</DataTableHead>
            </DataTableHeader>
            <DataTableBody>
              {actionedRecs.map(r => (
                <DataTableRow key={r.id}>
                  <DataTableCell>
                    <p className="text-sm font-medium text-gray-900">{r.title}</p>
                  </DataTableCell>
                  <DataTableCell className="text-sm">{r.segment}</DataTableCell>
                  <DataTableCell className="text-right tabular-nums text-sm">{r.currentSpacePct}% → {r.recommendedSpacePct}%</DataTableCell>
                  <DataTableCell>
                    <Badge variant={recActions[r.id] === 'acknowledged' ? 'success' : 'warning'} size="sm">
                      {recActions[r.id] === 'acknowledged' ? 'Acknowledged' : 'Flagged'}
                    </Badge>
                  </DataTableCell>
                </DataTableRow>
              ))}
            </DataTableBody>
          </DataTable>
        </>
      )}

      {myTasks.length > 0 && (
        <>
          <SectionHeader title="PulsePoint Tasks" subtitle="Tasks pushed from space planning" />
          <DataTable>
            <DataTableHeader>
              <DataTableHead>Task</DataTableHead>
              <DataTableHead>Segment</DataTableHead>
              <DataTableHead>Status</DataTableHead>
              <DataTableHead className="text-right">Action</DataTableHead>
            </DataTableHeader>
            <DataTableBody>
              {myTasks.map(t => (
                <DataTableRow key={t.id}>
                  <DataTableCell>
                    <p className="text-sm font-medium text-gray-900">{t.title}</p>
                    <p className="text-xs text-gray-500">{t.description}</p>
                  </DataTableCell>
                  <DataTableCell className="text-sm">{t.segment}</DataTableCell>
                  <DataTableCell>
                    <Badge variant={t.status === 'completed' ? 'success' : t.status === 'in-progress' ? 'default' : 'warning'} size="sm">
                      {t.status === 'pushed' ? 'Pushed' : t.status === 'in-progress' ? 'In Progress' : 'Completed'}
                    </Badge>
                  </DataTableCell>
                  <DataTableCell className="text-right">
                    {t.status === 'pushed' && (
                      <button className="rounded bg-indigo-600 px-2 py-1 text-xs font-medium text-white hover:bg-indigo-700 transition-colors" onClick={() => onUpdateTask(t.id, 'in-progress')}>
                        Start
                      </button>
                    )}
                    {t.status === 'in-progress' && (
                      <button className="rounded bg-green-600 px-2 py-1 text-xs font-medium text-white hover:bg-green-700 transition-colors" onClick={() => onUpdateTask(t.id, 'completed')}>
                        Mark Done
                      </button>
                    )}
                    {t.status === 'completed' && (
                      <span className="text-xs text-gray-400">Done</span>
                    )}
                  </DataTableCell>
                </DataTableRow>
              ))}
            </DataTableBody>
          </DataTable>
        </>
      )}

      {myRecs.length === 0 && myTasks.length === 0 && (
        <EmptyState icon={CheckCircle2} title="All clear" description="No pending recommendations or tasks for your store. Your space plan is up to date." />
      )}
    </div>
  );
}

// ─── State Head: State Overview ───────────────────────────────────────────────

function StateHeadOverviewView({ stores, recs, spsfTargets }: {
  stores: StoreSpaceProfile[];
  recs: SpaceRecommendation[];
  spsfTargets: { grade: string; target: number; current: number; floor: number }[];
}) {
  const zones = useMemo(() => {
    const map: Record<string, StoreSpaceProfile[]> = {};
    for (const s of stores) {
      if (!map[s.zone]) map[s.zone] = [];
      map[s.zone]!.push(s);
    }
    return Object.entries(map).map(([zone, zoneStores]) => {
      const avgSpsf = Math.round(zoneStores.reduce((a, s) => a + s.spsf, 0) / zoneStores.length);
      const avgGmrof = Math.round(zoneStores.reduce((a, s) => a + s.gmrof, 0) / zoneStores.length);
      const avgUtil = Math.round((zoneStores.reduce((a, s) => a + s.fixtureUtilization, 0) / zoneStores.length) * 10) / 10;
      const totalArea = zoneStores.reduce((a, s) => a + s.carpetArea, 0);
      const belowFloor = zoneStores.filter(s => { const t = spsfTargets.find(sp => sp.grade === s.grade); return t ? s.spsf < t.floor : false; }).length;
      const locked = zoneStores.filter(s => s.planStatus === 'locked' || s.planStatus === 'active').length;
      const cities = [...new Set(zoneStores.map(s => s.city))].length;
      const pendingRecs = recs.filter(r => zoneStores.some(s => s.storeId === r.storeId)).length;
      return { zone, stores: zoneStores, count: zoneStores.length, avgSpsf, avgGmrof, avgUtil, totalArea, belowFloor, locked, cities, pendingRecs };
    }).sort((a, b) => b.count - a.count);
  }, [stores, recs, spsfTargets]);

  const networkAvg = Math.round(stores.reduce((a, s) => a + s.spsf, 0) / stores.length);
  const totalCities = [...new Set(stores.map(s => s.city))].length;

  return (
    <div className="space-y-6">
      <MetricGrid>
        <MetricCard label="Total Stores" value={String(stores.length)} icon={Store} iconColor="info" subtitle={`Across ${totalCities} cities, ${zones.length} zones`} />
        <MetricCard label="Network Avg SPSF" value={`Rs ${networkAvg}`} icon={TrendingUp} iconColor="info" subtitle="Sales per square foot" />
        <MetricCard label="Total Carpet Area" value={`${Math.round(stores.reduce((a, s) => a + s.carpetArea, 0) / 100000).toLocaleString()} L Sq.Ft.`} icon={Maximize2} iconColor="info" subtitle="Lakhs of square feet" />
        <MetricCard label="Plans Locked" value={`${Math.round((stores.filter(s => s.planStatus === 'locked' || s.planStatus === 'active').length / stores.length) * 100)}%`} icon={Lock} iconColor="success" subtitle={`${stores.filter(s => s.planStatus === 'locked' || s.planStatus === 'active').length} of ${stores.length}`} status="on-track" />
      </MetricGrid>

      <SectionHeader title="Zone-wise Performance" subtitle="Performance comparison across zones" />
      <DataTable>
        <DataTableHeader>
          <DataTableHead>Zone</DataTableHead>
          <DataTableHead className="text-right">Stores</DataTableHead>
          <DataTableHead className="text-right">Cities</DataTableHead>
          <DataTableHead className="text-right">Avg SPSF</DataTableHead>
          <DataTableHead className="text-right">Avg GMROF</DataTableHead>
          <DataTableHead className="text-right">Avg Util.</DataTableHead>
          <DataTableHead className="text-right">Below Floor</DataTableHead>
          <DataTableHead className="text-right">Locked %</DataTableHead>
        </DataTableHeader>
        <DataTableBody>
          {zones.map(z => (
            <DataTableRow key={z.zone}>
              <DataTableCell className="font-medium text-gray-900">{z.zone}</DataTableCell>
              <DataTableCell className="text-right tabular-nums">{z.count}</DataTableCell>
              <DataTableCell className="text-right tabular-nums">{z.cities}</DataTableCell>
              <DataTableCell className="text-right tabular-nums">
                <span className={z.avgSpsf < networkAvg ? 'text-red-700 font-medium' : 'text-green-700'}>Rs {z.avgSpsf}</span>
              </DataTableCell>
              <DataTableCell className="text-right tabular-nums">Rs {z.avgGmrof}</DataTableCell>
              <DataTableCell className="text-right tabular-nums">{z.avgUtil}%</DataTableCell>
              <DataTableCell className="text-right tabular-nums">
                {z.belowFloor > 0 ? <span className="text-red-700">{z.belowFloor}</span> : <span className="text-gray-400">0</span>}
              </DataTableCell>
              <DataTableCell className="text-right">
                <Badge variant={Math.round((z.locked / z.count) * 100) >= 80 ? 'success' : 'warning'} size="sm">
                  {Math.round((z.locked / z.count) * 100)}%
                </Badge>
              </DataTableCell>
            </DataTableRow>
          ))}
        </DataTableBody>
      </DataTable>

      <SectionHeader title="Format Mix by Zone" subtitle="Store count by format within each zone" />
      <DataTable>
        <DataTableHeader>
          <DataTableHead>Zone</DataTableHead>
          {[...new Set(stores.map(s => s.format))].sort().map(f => (
            <DataTableHead key={f} className="text-right">{f}</DataTableHead>
          ))}
        </DataTableHeader>
        <DataTableBody>
          {zones.map(z => (
            <DataTableRow key={z.zone}>
              <DataTableCell className="font-medium text-gray-900">{z.zone}</DataTableCell>
              {[...new Set(stores.map(s => s.format))].sort().map(f => (
                <DataTableCell key={f} className="text-right tabular-nums">{z.stores.filter(s => s.format === f).length}</DataTableCell>
              ))}
            </DataTableRow>
          ))}
        </DataTableBody>
      </DataTable>
    </div>
  );
}

// ─── State Head: City Drilldown ───────────────────────────────────────────────

function StateHeadCityDrilldownView({ stores, recs, spsfTargets, onSelectStore }: {
  stores: StoreSpaceProfile[];
  recs: SpaceRecommendation[];
  spsfTargets: { grade: string; target: number; current: number; floor: number }[];
  onSelectStore: (id: string) => void;
}) {
  const zoneNames = [...new Set(stores.map(s => s.zone))].sort();
  const [selectedZone, setSelectedZone] = useState(zoneNames[0] || '');

  const cities = useMemo(() => {
    const zoneStores = stores.filter(s => s.zone === selectedZone);
    const map: Record<string, StoreSpaceProfile[]> = {};
    for (const s of zoneStores) {
      if (!map[s.city]) map[s.city] = [];
      map[s.city]!.push(s);
    }
    return Object.entries(map).map(([city, cityStores]) => {
      const avgSpsf = Math.round(cityStores.reduce((a, s) => a + s.spsf, 0) / cityStores.length);
      const avgGmrof = Math.round(cityStores.reduce((a, s) => a + s.gmrof, 0) / cityStores.length);
      const belowFloor = cityStores.filter(s => { const t = spsfTargets.find(sp => sp.grade === s.grade); return t ? s.spsf < t.floor : false; }).length;
      const pendingRecs = recs.filter(r => cityStores.some(s => s.storeId === r.storeId)).length;
      const formats = [...new Set(cityStores.map(s => s.format))].join(', ');
      return { city, stores: cityStores, count: cityStores.length, avgSpsf, avgGmrof, belowFloor, pendingRecs, formats };
    }).sort((a, b) => b.count - a.count);
  }, [stores, recs, spsfTargets, selectedZone]);

  const networkAvg = Math.round(stores.reduce((a, s) => a + s.spsf, 0) / stores.length);

  return (
    <div className="space-y-6">
      <FilterBar>
        <FilterPills
          value={selectedZone}
          onChange={setSelectedZone}
          options={zoneNames.map(z => ({ value: z, label: `${z} Zone`, count: stores.filter(s => s.zone === z).length }))}
        />
      </FilterBar>

      <SectionHeader title={`${selectedZone} Zone — ${cities.length} Cities`} subtitle="City-level performance breakdown" />
      <DataTable>
        <DataTableHeader>
          <DataTableHead>City</DataTableHead>
          <DataTableHead className="text-right">Stores</DataTableHead>
          <DataTableHead>Formats</DataTableHead>
          <DataTableHead className="text-right">Avg SPSF</DataTableHead>
          <DataTableHead className="text-right">Avg GMROF</DataTableHead>
          <DataTableHead className="text-right">Below Floor</DataTableHead>
          <DataTableHead className="text-right">Pending Recs</DataTableHead>
        </DataTableHeader>
        <DataTableBody>
          {cities.map(c => (
            <DataTableRow key={c.city}>
              <DataTableCell className="font-medium text-gray-900">{c.city}</DataTableCell>
              <DataTableCell className="text-right tabular-nums">{c.count}</DataTableCell>
              <DataTableCell className="text-xs text-gray-500">{c.formats}</DataTableCell>
              <DataTableCell className="text-right tabular-nums">
                <span className={c.avgSpsf < networkAvg ? 'text-red-700 font-medium' : 'text-green-700'}>Rs {c.avgSpsf}</span>
              </DataTableCell>
              <DataTableCell className="text-right tabular-nums">Rs {c.avgGmrof}</DataTableCell>
              <DataTableCell className="text-right tabular-nums">
                {c.belowFloor > 0 ? <span className="text-red-700">{c.belowFloor}</span> : <span className="text-gray-400">0</span>}
              </DataTableCell>
              <DataTableCell className="text-right tabular-nums">{c.pendingRecs}</DataTableCell>
            </DataTableRow>
          ))}
        </DataTableBody>
      </DataTable>

      {cities.length > 0 && (
        <>
          <SectionHeader title={`Stores in ${cities[0]!.city}`} subtitle="Top city store details" />
          <DataTable>
            <DataTableHeader>
              <DataTableHead>Store</DataTableHead>
              <DataTableHead className="text-right">SPSF</DataTableHead>
              <DataTableHead className="text-right">GMROF</DataTableHead>
              <DataTableHead className="text-right">Util.</DataTableHead>
              <DataTableHead>Plan</DataTableHead>
            </DataTableHeader>
            <DataTableBody>
              {cities[0]!.stores.slice(0, 10).map(s => (
                <DataTableRow key={s.storeId} onClick={() => onSelectStore(s.storeId)} className="cursor-pointer">
                  <DataTableCell>
                    <p className="text-sm font-medium text-gray-900">{s.storeName}</p>
                    <p className="text-xs text-gray-500">{s.format} · {s.grade}</p>
                  </DataTableCell>
                  <DataTableCell className="text-right tabular-nums font-medium">Rs {s.spsf}</DataTableCell>
                  <DataTableCell className="text-right tabular-nums">Rs {s.gmrof}</DataTableCell>
                  <DataTableCell className="text-right tabular-nums">{s.fixtureUtilization}%</DataTableCell>
                  <DataTableCell>
                    <Badge variant={planStatusBadge(s.planStatus).variant} size="sm">
                      {planStatusBadge(s.planStatus).label}
                    </Badge>
                  </DataTableCell>
                </DataTableRow>
              ))}
            </DataTableBody>
          </DataTable>
        </>
      )}
    </div>
  );
}

// ─── CEO Alerts & Recs View ───────────────────────────────────────────────────

function PersonaAlertRecsView({ storeRows, recs, onSelectStore, onViewStore, showFormatFilter }: {
  storeRows: { storeId: string; storeName: string; city: string; format: string; grade: string; spsf: number; spsfStatus: 'green' | 'amber' | 'red'; spsfGap: number; spsfTarget: number; pendingRecs: number }[];
  recs: SpaceRecommendation[];
  onSelectStore: (id: string) => void;
  onViewStore?: (id: string) => void;
  showFormatFilter?: boolean;
}) {
  const [expandedFormat, setExpandedFormat] = useState<string | null>(null);
  const [alertFormatFilter, setAlertFormatFilter] = useState<string>('all');

  const filteredRows = alertFormatFilter === 'all' ? storeRows : storeRows.filter(r => r.format === alertFormatFilter);
  const alertFormats = useMemo(() => [...new Set(storeRows.map(r => r.format))].sort(), [storeRows]);

  const belowFloor = filteredRows.filter(r => r.spsfStatus === 'red');
  const needsAttention = filteredRows.filter(r => r.spsfStatus === 'amber');
  const storesWithRecs = filteredRows.filter(r => r.pendingRecs > 0);

  // Aggregate by format
  const formatSummary = useMemo(() => {
    const formats = [...new Set(filteredRows.map(s => s.format))].sort();
    return formats.map(fmt => {
      const fmtStores = filteredRows.filter(s => s.format === fmt);
      const critical = fmtStores.filter(s => s.spsfStatus === 'red');
      const warning = fmtStores.filter(s => s.spsfStatus === 'amber');
      const onTrack = fmtStores.filter(s => s.spsfStatus === 'green');
      const avgSpsf = Math.round(fmtStores.reduce((a, s) => a + s.spsf, 0) / fmtStores.length);
      const fmtRecs = recs.filter(r => fmtStores.some(s => s.storeId === r.storeId));
      return { format: fmt, total: fmtStores.length, critical: critical.length, warning: warning.length, onTrack: onTrack.length, avgSpsf, recsCount: fmtRecs.length, topCritical: critical.sort((a, b) => a.spsf - b.spsf).slice(0, 5) };
    });
  }, [filteredRows, recs]);

  return (
    <div className="space-y-6">
      {showFormatFilter && (
        <FilterBar>
          <FilterPills
            value={alertFormatFilter}
            onChange={setAlertFormatFilter}
            options={[
              { value: 'all', label: 'All Formats', count: storeRows.length },
              ...alertFormats.map(fmt => ({
                value: fmt,
                label: fmt,
                count: storeRows.filter(r => r.format === fmt).length,
              })),
            ]}
          />
        </FilterBar>
      )}
      <MetricGrid>
        <MetricCard
          label="Critical Stores"
          value={String(belowFloor.length)}
          icon={AlertTriangle}
          iconColor="error"
          subtitle={`Across ${formatSummary.filter(f => f.critical > 0).length} formats`}
          status={belowFloor.length > 0 ? 'critical' : 'on-track'}
        />
        <MetricCard
          label="Needs Attention"
          value={String(needsAttention.length)}
          icon={CircleAlert}
          iconColor="warning"
          subtitle="Below target but above floor"
          status={needsAttention.length > 0 ? 'warning' : 'on-track'}
        />
        <MetricCard
          label="Pending Recommendations"
          value={String(recs.length)}
          icon={Lightbulb}
          iconColor="info"
          subtitle={`Across ${storesWithRecs.length} stores`}
          status="warning"
        />
      </MetricGrid>

      <SectionHeader title="Format-Level Health Overview" subtitle="Aggregated performance and alerts by retail format" />
      <DataTable>
        <DataTableHeader>
          <DataTableHead>Format</DataTableHead>
          <DataTableHead className="text-right">Stores</DataTableHead>
          <DataTableHead className="text-right">Avg SPSF</DataTableHead>
          <DataTableHead className="text-right">Critical</DataTableHead>
          <DataTableHead className="text-right">Warning</DataTableHead>
          <DataTableHead className="text-right">On Track</DataTableHead>
          <DataTableHead className="text-right">Pending Recs</DataTableHead>
          <DataTableHead className="w-10" />
        </DataTableHeader>
        <DataTableBody>
          {formatSummary.map(fmt => (
            <Fragment key={fmt.format}>
              <DataTableRow
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => setExpandedFormat(expandedFormat === fmt.format ? null : fmt.format)}
              >
                <DataTableCell>
                  <div className="flex items-center gap-2">
                    <Badge variant={formatBadgeVariant[fmt.format] ?? 'default'} size="sm">{fmt.format}</Badge>
                  </div>
                </DataTableCell>
                <DataTableCell className="text-right tabular-nums font-medium">{fmt.total}</DataTableCell>
                <DataTableCell className="text-right tabular-nums font-medium">Rs {fmt.avgSpsf}</DataTableCell>
                <DataTableCell className="text-right">
                  {fmt.critical > 0 ? <span className="tabular-nums font-medium text-red-700">{fmt.critical}</span> : <span className="text-gray-400">0</span>}
                </DataTableCell>
                <DataTableCell className="text-right">
                  {fmt.warning > 0 ? <span className="tabular-nums font-medium text-amber-700">{fmt.warning}</span> : <span className="text-gray-400">0</span>}
                </DataTableCell>
                <DataTableCell className="text-right">
                  <span className="tabular-nums font-medium text-green-700">{fmt.onTrack}</span>
                </DataTableCell>
                <DataTableCell className="text-right">
                  {fmt.recsCount > 0 ? <Badge variant="warning" size="sm">{fmt.recsCount}</Badge> : <span className="text-gray-400">—</span>}
                </DataTableCell>
                <DataTableCell className="text-right">
                  {expandedFormat === fmt.format
                    ? <ChevronDown className="w-4 h-4 text-gray-400" />
                    : <ChevronRight className="w-4 h-4 text-gray-400" />
                  }
                </DataTableCell>
              </DataTableRow>

              {/* Expanded: top critical stores for this format */}
              {expandedFormat === fmt.format && fmt.topCritical.length > 0 && (
                fmt.topCritical.map(store => (
                  <DataTableRow key={store.storeId} className="bg-red-50/40">
                    <DataTableCell className="pl-10">
                      <p className="text-sm text-gray-900">{store.storeName}</p>
                      <p className="text-xs text-gray-500">{store.city} · Grade {store.grade}</p>
                    </DataTableCell>
                    <DataTableCell />
                    <DataTableCell className="text-right tabular-nums font-medium text-red-700">Rs {store.spsf}</DataTableCell>
                    <DataTableCell className="text-right tabular-nums text-red-600">{store.spsfGap}%</DataTableCell>
                    <DataTableCell />
                    <DataTableCell />
                    <DataTableCell className="text-right">
                      {store.pendingRecs > 0 && <Badge variant="warning" size="sm">{store.pendingRecs} recs</Badge>}
                    </DataTableCell>
                    <DataTableCell className="text-right">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800"
                        onClick={(e) => { e.stopPropagation(); (onViewStore ?? onSelectStore)(store.storeId); }}
                      >
                        View <ArrowRight className="w-3 h-3" />
                      </button>
                    </DataTableCell>
                  </DataTableRow>
                ))
              )}

              {/* Expanded: no critical stores message */}
              {expandedFormat === fmt.format && fmt.topCritical.length === 0 && (
                <DataTableRow className="bg-green-50/40">
                  <DataTableCell colSpan={8} className="pl-10 text-sm text-green-700">
                    All stores in this format are performing above minimum threshold
                  </DataTableCell>
                </DataTableRow>
              )}
            </Fragment>
          ))}
        </DataTableBody>
      </DataTable>
    </div>
  );
}

// ─── Mid-Season Tactical Reallocation ────────────────────────────────────────

function TacticalReallocationSection({ reallocations }: { reallocations: TacticalReallocation[] }) {
  const statusVariant = (s: TacticalReallocation['status']) => {
    switch (s) {
      case 'detected': return 'outline' as const;
      case 'approved': return 'success' as const;
      case 'executing': return 'info' as const;
      case 'completed': return 'default' as const;
      case 'deferred-to-ra': return 'destructive' as const;
    }
  };

  return (
    <div>
      <SectionHeader
        title={<span className="inline-flex items-center gap-2">Tactical Reallocation Alerts <NotionalBadge /></span>}
        subtitle="Mid-hit space swaps triggered by velocity changes — stock availability is the critical gate"
      />
      <TooltipProvider>
      <DataTable>
        <DataTableHeader>
          <DataTableHead>Segment</DataTableHead>
          <DataTableHead>
            <UITooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex items-center gap-1 cursor-help">
                  Trigger <Info className="w-3 h-3 text-gray-400" />
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <p className="text-xs"><strong>Outperforming:</strong> Segment selling faster than AOP plan — needs more space/stock.</p>
                <p className="text-xs mt-1"><strong>Underperforming:</strong> Segment selling slower than AOP plan — space can be reallocated.</p>
              </TooltipContent>
            </UITooltip>
          </DataTableHead>
          <DataTableHead className="text-right">
            <UITooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex items-center gap-1 cursor-help">
                  Velocity <Info className="w-3 h-3 text-gray-400" />
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <p className="text-xs">Sell-through velocity relative to AOP plan. <strong>1.0x = on AOP target</strong>.</p>
                <p className="text-xs mt-1">&gt;1.5x triggers outperforming alert. &lt;0.7x triggers underperforming alert.</p>
              </TooltipContent>
            </UITooltip>
          </DataTableHead>
          <DataTableHead className="text-center">Stock Available</DataTableHead>
          <DataTableHead>
            <UITooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex items-center gap-1 cursor-help">
                  Stock Source <Info className="w-3 h-3 text-gray-400" />
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <p className="text-xs">Where additional stock will come from to fulfill the reallocation:</p>
                <p className="text-xs mt-1"><strong>Warehouse:</strong> Available in central warehouse, ready to ship.</p>
                <p className="text-xs mt-0.5"><strong>Pipeline:</strong> In transit or on order, arriving within 2-4 weeks.</p>
                <p className="text-xs mt-0.5"><strong>Needs Manufacturing:</strong> No stock available — requires production order.</p>
              </TooltipContent>
            </UITooltip>
          </DataTableHead>
          <DataTableHead className="text-right">Stores</DataTableHead>
          <DataTableHead className="text-right">Fixtures</DataTableHead>
          <DataTableHead>Status</DataTableHead>
          <DataTableHead>Approval Level</DataTableHead>
        </DataTableHeader>
        <DataTableBody>
          {reallocations.map(r => (
            <DataTableRow key={r.id} className={r.status === 'deferred-to-ra' ? 'opacity-60' : undefined}>
              <DataTableCell>
                <span className={r.status === 'deferred-to-ra' ? 'line-through text-gray-400' : 'font-medium text-gray-900'}>
                  {r.triggerSegment}
                </span>
              </DataTableCell>
              <DataTableCell>
                <Badge variant={r.triggerType === 'outperforming' ? 'success' : 'destructive'} size="sm">
                  {r.triggerType}
                </Badge>
              </DataTableCell>
              <DataTableCell className="text-right tabular-nums">{r.velocity.toFixed(1)}x</DataTableCell>
              <DataTableCell className="text-center">
                {r.stockAvailable
                  ? <CheckCircle2 className="w-4 h-4 text-green-600 inline-block" />
                  : <XCircle className="w-4 h-4 text-red-500 inline-block" />
                }
              </DataTableCell>
              <DataTableCell>
                <span className={cn('text-sm', r.stockSource === 'needs-manufacturing' ? 'text-red-600 font-medium' : 'text-gray-700')}>
                  {r.stockSource === 'warehouse' ? 'Warehouse' : r.stockSource === 'pipeline' ? 'Pipeline' : 'Needs Manufacturing'}
                </span>
              </DataTableCell>
              <DataTableCell className="text-right tabular-nums">{r.storeCount}</DataTableCell>
              <DataTableCell className="text-right tabular-nums">{r.fixturesSwapped || '—'}</DataTableCell>
              <DataTableCell>
                <Badge variant={statusVariant(r.status)} size="sm">
                  {r.status}
                </Badge>
              </DataTableCell>
              <DataTableCell>
                <span className={cn('text-sm', r.status === 'deferred-to-ra' ? 'text-gray-400 italic' : 'text-gray-700')}>
                  {r.approvalLevel}
                </span>
              </DataTableCell>
            </DataTableRow>
          ))}
        </DataTableBody>
      </DataTable>
      </TooltipProvider>
      <p className="text-xs text-gray-500 mt-2">
        Approval routing: &lt;5 stores → Space Planner | 5-50 stores → Cluster Manager + SP | &gt;50 stores → CEO approval required
      </p>
    </div>
  );
}

// ─── Format color map (consistent across views) ───────────────────────────────

const formatColor: Record<string, string> = {
  'Trends': '#6366f1',
  'Yousta': '#3b82f6',
  'Fashion Factory': '#f59e0b',
  'AZORTE': '#10b981',
};

const formatBadgeVariant: Record<string, 'default' | 'info' | 'warning' | 'success'> = {
  'Trends': 'default',
  'Yousta': 'info',
  'Fashion Factory': 'warning',
  'AZORTE': 'success',
};

// ─── Helper: derive competitor lat/lng from parent store position + distance ────

function competitorLatLng(
  storeLat: number, storeLng: number,
  distanceStr: string, index: number
): [number, number] {
  const km = parseFloat(distanceStr) || 0.5;
  const bearing = (index * 137.5) % 360; // golden angle spread
  const rad = (bearing * Math.PI) / 180;
  const latOffset = km * 0.009 * Math.cos(rad);
  const lngOffset = km * 0.011 * Math.sin(rad);
  return [storeLat + latOffset, storeLng + lngOffset];
}

// ─── India bounds constant ──────────────────────────────────────────────────────

const INDIA_BOUNDS: [[number, number], [number, number]] = [[6, 68], [37, 98]];

// ─── FitBoundsOnLoad (reused from IntelligenceMapView pattern) ─────────────────

function FitBoundsOnLoad({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  useMemo(() => {
    if (positions.length > 1) {
      const lats = positions.map((p) => p[0]);
      const lngs = positions.map((p) => p[1]);
      map.fitBounds([
        [Math.max(Math.min(...lats) - 1, INDIA_BOUNDS[0][0]), Math.max(Math.min(...lngs) - 1, INDIA_BOUNDS[0][1])],
        [Math.min(Math.max(...lats) + 1, INDIA_BOUNDS[1][0]), Math.min(Math.max(...lngs) + 1, INDIA_BOUNDS[1][1])],
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

// ─── Store Planner Browser (replaces StoreSelector) ────────────────────────────

function StorePlannerBrowser({ stores, spsfTargets, onSelect }: {
  stores: StoreSpaceProfile[];
  spsfTargets: { grade: string; current: number; target: number; floor: number }[];
  onSelect: (id: string) => void;
}) {
  const [viewMode, setViewMode] = useState<'list' | 'map' | 'format'>('list');
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [zoneFilter, setZoneFilter] = useState('all');
  const [formatFilter, setFormatFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredStores = useMemo(() => {
    return stores.filter((s) => {
      if (search && !s.storeName.toLowerCase().includes(search.toLowerCase()) && !s.city.toLowerCase().includes(search.toLowerCase())) return false;
      if (gradeFilter !== 'all' && s.grade !== gradeFilter) return false;
      if (zoneFilter !== 'all' && s.zone !== zoneFilter) return false;
      if (formatFilter !== 'all' && s.format !== formatFilter) return false;
      if (statusFilter !== 'all' && s.planStatus !== statusFilter) return false;
      return true;
    });
  }, [stores, search, gradeFilter, zoneFilter, formatFilter, statusFilter]);

  function handleFormatDrilldown(format: string) {
    setFormatFilter(format);
    setViewMode('list');
  }

  return (
    <div className="space-y-3">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <SectionHeader title="Browse Stores" subtitle="Search, filter, and select a store to plan" />
        <FilterPills
          value={viewMode}
          onChange={(v) => setViewMode(v as 'list' | 'map' | 'format')}
          options={[
            { value: 'list', label: 'List' },
            { value: 'map', label: 'Map' },
            { value: 'format', label: 'Format Summary' },
          ]}
        />
      </div>

      {/* Filter bar (shared across List and Map) */}
      {viewMode !== 'format' && (
        <FilterBar>
          <FilterSelect
            value={gradeFilter}
            onChange={setGradeFilter}
            placeholder="Grade"
            options={[
              { value: 'all', label: 'All Grades' },
              { value: 'A', label: 'Grade A' },
              { value: 'A1', label: 'Grade A1' },
              { value: 'A2', label: 'Grade A2' },
              { value: 'A3', label: 'Grade A3' },
            ]}
          />
          <FilterSelect
            value={zoneFilter}
            onChange={setZoneFilter}
            placeholder="Zone"
            options={[
              { value: 'all', label: 'All Zones' },
              { value: 'West', label: 'West' },
              { value: 'North', label: 'North' },
              { value: 'South', label: 'South' },
              { value: 'East', label: 'East' },
            ]}
          />
          <FilterSelect
            value={formatFilter}
            onChange={setFormatFilter}
            placeholder="Format"
            options={[
              { value: 'all', label: 'All Formats' },
              { value: 'Trends', label: 'Trends' },
              { value: 'Yousta', label: 'Yousta' },
              { value: 'Fashion Factory', label: 'Fashion Factory' },
              { value: 'AZORTE', label: 'AZORTE' },
            ]}
          />
          <FilterSelect
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="Plan Status"
            options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'draft', label: 'Draft' },
              { value: 'under-review', label: 'Under Review' },
              { value: 'locked', label: 'Locked' },
              { value: 'active', label: 'Active' },
              { value: 'superseded', label: 'Superseded' },
            ]}
          />
          <FilterSearch
            value={search}
            onChange={setSearch}
            placeholder="Search store or city..."
          />
        </FilterBar>
      )}

      {/* View body */}
      {viewMode === 'list' && (
        <StoreListView stores={filteredStores} totalCount={stores.length} spsfTargets={spsfTargets} onSelect={onSelect} />
      )}
      {viewMode === 'map' && (
        <StoreMapView stores={filteredStores} onSelect={onSelect} />
      )}
      {viewMode === 'format' && (
        <FormatSummaryView stores={filteredStores} onFormatClick={handleFormatDrilldown} />
      )}
    </div>
  );
}

// ─── List View ─────────────────────────────────────────────────────────────────

function StoreListView({ stores, totalCount, spsfTargets, onSelect }: {
  stores: StoreSpaceProfile[];
  totalCount: number;
  spsfTargets: { grade: string; current: number; target: number; floor: number }[];
  onSelect: (id: string) => void;
}) {
  const [page, setPage] = useState(1);
  const [prevStores, setPrevStores] = useState(stores);
  if (stores !== prevStores) {
    setPrevStores(stores);
    setPage(1);
  }
  const { totalPages, totalItems, pageSize, getPageItems } = usePagination(stores, 25);
  const pageStores = getPageItems(page);

  if (stores.length === 0) {
    return <EmptyState description="No stores match the current filters. Try adjusting your search or filter criteria." />;
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-500">Showing {stores.length} of {totalCount} stores</p>
      <DataTable>
        <DataTableHeader>
          <DataTableHead>Store</DataTableHead>
          <DataTableHead className="text-center">Format</DataTableHead>
          <DataTableHead className="text-right"><KpiLabel abbr="SPSF" /></DataTableHead>
          <DataTableHead className="text-right"><KpiLabel abbr="GMROF" /></DataTableHead>
          <DataTableHead className="text-right">AOP Gap</DataTableHead>
          <DataTableHead className="text-right">Carpet Area</DataTableHead>
          <DataTableHead className="text-right">Fixture Util.</DataTableHead>
          <DataTableHead className="text-center">Status</DataTableHead>
          <DataTableHead className="text-center">Plan</DataTableHead>
          <DataTableHead className="w-8" />
        </DataTableHeader>
        <DataTableBody>
          {pageStores.map((s) => {
            const spsfTarget = spsfTargets.find((t) => t.grade === s.grade);
            const spsfStatus = spsfTarget ? getSpsfStatus(s.spsf, spsfTarget.current, spsfTarget.floor) : 'amber';
            const aopGapPct = s.aopTargetCr > 0 ? Math.round(((s.aopRunRateCr - s.aopTargetCr) / s.aopTargetCr) * 100) : 0;
            const plan = planStatusBadge(s.planStatus);
            const status = statusBadge(spsfStatus);
            return (
              <DataTableRow key={s.storeId} onClick={() => onSelect(s.storeId)} className="cursor-pointer">
                <DataTableCell>
                  <p className="text-sm font-medium text-gray-900">{s.storeName}</p>
                  <p className="text-xs text-gray-500">{s.city} · Grade {s.grade}</p>
                </DataTableCell>
                <DataTableCell className="text-center">
                  <Badge variant={formatBadgeVariant[s.format] ?? 'default'} size="sm">{s.format}</Badge>
                </DataTableCell>
                <DataTableCell className="text-right tabular-nums font-medium">Rs {s.spsf}</DataTableCell>
                <DataTableCell className="text-right tabular-nums font-medium">Rs {s.gmrof}</DataTableCell>
                <DataTableCell className="text-right tabular-nums">
                  <span className={cn('font-medium', aopGapPct >= 0 ? 'text-green-700' : 'text-red-700')}>
                    {aopGapPct >= 0 ? '+' : ''}{aopGapPct}%
                  </span>
                </DataTableCell>
                <DataTableCell className="text-right tabular-nums">{s.carpetArea.toLocaleString()} Sq. Ft.</DataTableCell>
                <DataTableCell className="text-right tabular-nums">
                  <span className={cn('font-medium', s.fixtureUtilization >= 75 ? 'text-green-700' : s.fixtureUtilization >= 65 ? 'text-amber-600' : 'text-red-700')}>
                    {s.fixtureUtilization}%
                  </span>
                </DataTableCell>
                <DataTableCell className="text-center">
                  <Badge variant={status.variant} size="sm">{status.label}</Badge>
                </DataTableCell>
                <DataTableCell className="text-center">
                  <Badge variant={plan.variant} size="sm">{plan.label}</Badge>
                </DataTableCell>
                <DataTableCell className="w-8">
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </DataTableCell>
              </DataTableRow>
            );
          })}
        </DataTableBody>
      </DataTable>
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
        totalItems={totalItems}
        pageSize={pageSize}
      />
    </div>
  );
}

// ─── Format Summary View ───────────────────────────────────────────────────────

interface FormatAggregate {
  format: string;
  storeCount: number;
  totalCarpetArea: number;
  totalSaleableArea: number;
  avgSpsf: number;
  avgGmrof: number;
  avgFixtureUtil: number;
  totalAopTargetCr: number;
  totalAopRunRateCr: number;
}

function FormatSummaryView({ stores, onFormatClick }: {
  stores: StoreSpaceProfile[];
  onFormatClick: (format: string) => void;
}) {
  const aggregates = useMemo(() => {
    const groups: Record<string, StoreSpaceProfile[]> = {};
    stores.forEach((s) => {
      const arr = groups[s.format] ?? (groups[s.format] = []);
      arr.push(s);
    });
    return Object.entries(groups).map(([format, group]): FormatAggregate => ({
      format,
      storeCount: group.length,
      totalCarpetArea: group.reduce((sum, s) => sum + s.carpetArea, 0),
      totalSaleableArea: group.reduce((sum, s) => sum + s.saleableArea, 0),
      avgSpsf: Math.round(group.reduce((sum, s) => sum + s.spsf, 0) / group.length),
      avgGmrof: Math.round(group.reduce((sum, s) => sum + s.gmrof, 0) / group.length),
      avgFixtureUtil: Math.round(group.reduce((sum, s) => sum + s.fixtureUtilization, 0) / group.length),
      totalAopTargetCr: +group.reduce((sum, s) => sum + s.aopTargetCr, 0).toFixed(2),
      totalAopRunRateCr: +group.reduce((sum, s) => sum + s.aopRunRateCr, 0).toFixed(2),
    })).sort((a, b) => b.storeCount - a.storeCount);
  }, [stores]);

  const networkTotals = useMemo(() => ({
    totalStores: stores.length,
    totalCarpetArea: stores.reduce((sum, s) => sum + s.carpetArea, 0),
    avgSpsf: stores.length ? Math.round(stores.reduce((sum, s) => sum + s.spsf, 0) / stores.length) : 0,
    avgGmrof: stores.length ? Math.round(stores.reduce((sum, s) => sum + s.gmrof, 0) / stores.length) : 0,
  }), [stores]);

  return (
    <div className="space-y-4">
      {/* Summary MetricGrid */}
      <MetricGrid>
        <MetricCard label="Total Stores" value={networkTotals.totalStores} icon={Store} iconColor="info" />
        <MetricCard label="Total Carpet Area" value={`${networkTotals.totalCarpetArea.toLocaleString()} Sq. Ft.`} icon={LayoutGrid} iconColor="success" />
        <MetricCard label={<>Avg <KpiLabel abbr="SPSF" /></>} value={`Rs ${networkTotals.avgSpsf}`} icon={TrendingUp} iconColor="info" />
        <MetricCard label={<>Avg <KpiLabel abbr="GMROF" /></>} value={`Rs ${networkTotals.avgGmrof}`} icon={Target} iconColor="warning" />
      </MetricGrid>

      {/* Format breakdown table */}
      <div className="space-y-2">
        <SectionHeader title="Format Breakdown" subtitle="Click a format to filter the store list" />
        <DataTable>
          <DataTableHeader>
            <DataTableHead>Format</DataTableHead>
            <DataTableHead className="text-right">Stores</DataTableHead>
            <DataTableHead className="text-right">Total Carpet Area</DataTableHead>
            <DataTableHead className="text-right">Total Saleable Area</DataTableHead>
            <DataTableHead className="text-right">Avg Sales Per Sq. Ft.</DataTableHead>
            <DataTableHead className="text-right">Avg GM Return on Footage</DataTableHead>
            <DataTableHead className="text-right">Avg Fixture Util.</DataTableHead>
            <DataTableHead className="text-right">AOP Target</DataTableHead>
            <DataTableHead className="text-right">AOP Run Rate</DataTableHead>
          </DataTableHeader>
          <DataTableBody>
            {aggregates.map((agg) => (
              <DataTableRow key={agg.format} onClick={() => onFormatClick(agg.format)} className="cursor-pointer">
                <DataTableCell>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: formatColor[agg.format] ?? '#6b7280' }} />
                    <span className="font-medium text-gray-900">{agg.format}</span>
                  </div>
                </DataTableCell>
                <DataTableCell className="text-right tabular-nums font-medium">{agg.storeCount}</DataTableCell>
                <DataTableCell className="text-right tabular-nums">{agg.totalCarpetArea.toLocaleString()} Sq. Ft.</DataTableCell>
                <DataTableCell className="text-right tabular-nums">{agg.totalSaleableArea.toLocaleString()} Sq. Ft.</DataTableCell>
                <DataTableCell className="text-right tabular-nums">Rs {agg.avgSpsf}</DataTableCell>
                <DataTableCell className="text-right tabular-nums">Rs {agg.avgGmrof}</DataTableCell>
                <DataTableCell className="text-right tabular-nums">
                  <span className={cn('font-medium', agg.avgFixtureUtil >= 75 ? 'text-green-700' : agg.avgFixtureUtil >= 65 ? 'text-amber-600' : 'text-red-700')}>
                    {agg.avgFixtureUtil}%
                  </span>
                </DataTableCell>
                <DataTableCell className="text-right tabular-nums">Rs {agg.totalAopTargetCr} Cr</DataTableCell>
                <DataTableCell className="text-right tabular-nums">Rs {agg.totalAopRunRateCr} Cr</DataTableCell>
              </DataTableRow>
            ))}
          </DataTableBody>
        </DataTable>
      </div>
    </div>
  );
}

// ─── Map View ──────────────────────────────────────────────────────────────────

function StoreMapView({ stores, onSelect }: { stores: StoreSpaceProfile[]; onSelect: (id: string) => void }) {
  const positions = useMemo(() => stores.map((s) => [s.latitude, s.longitude] as [number, number]), [stores]);

  if (stores.length === 0) {
    return <EmptyState description="No stores match the current filters." />;
  }

  return (
    <div className="space-y-2">
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden" style={{ height: 520 }}>
        <MapContainer center={[22.5, 78.5]} zoom={5} maxBounds={[[6, 68], [37, 98]]} maxBoundsViscosity={1.0} minZoom={4} className="h-full w-full" scrollWheelZoom preferCanvas>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitBoundsOnLoad positions={positions} />
          {stores.map((s) => (
            <CircleMarker
              key={s.storeId}
              center={[s.latitude, s.longitude]}
              radius={7}
              pathOptions={{
                fillColor: formatColor[s.format] ?? '#6b7280',
                color: '#fff',
                weight: 1,
                fillOpacity: 0.85,
              }}
              eventHandlers={{ click: () => onSelect(s.storeId) }}
            >
              <Popup>
                <div className="text-xs space-y-1 min-w-[160px]">
                  <p className="font-semibold text-sm text-gray-900">{s.storeName}</p>
                  <p className="text-gray-600">{s.city} · {s.format} · Grade {s.grade}</p>
                  <p className="text-gray-600">Sales/Sq.Ft. Rs {s.spsf} · GM Return on Footage Rs {s.gmrof}</p>
                  <p className="text-gray-600">Carpet {s.carpetArea.toLocaleString()} Sq. Ft.</p>
                </div>
              </Popup>
            </CircleMarker>
          ))}
          {/* Competitor markers */}
          {stores.flatMap((s) =>
            s.competitors.map((c, ci) => {
              const [lat, lng] = competitorLatLng(s.latitude, s.longitude, c.distance, ci);
              return (
                <CircleMarker
                  key={`${s.storeId}-comp-${ci}`}
                  center={[lat, lng]}
                  radius={4}
                  pathOptions={{
                    fillColor: c.type === 'Direct' ? '#dc2626' : '#d97706',
                    color: '#fff',
                    weight: 1,
                    fillOpacity: 0.75,
                  }}
                >
                  <Popup>
                    <div className="text-xs min-w-[120px]">
                      <p className="font-semibold">{c.name}</p>
                      <p className="text-gray-600">{c.distance} from {s.storeName}</p>
                      <p className="text-gray-600">{c.type} competitor</p>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })
          )}
        </MapContainer>
      </div>
      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-gray-600 flex-wrap">
        {Object.entries(formatColor).map(([name, color]) => (
          <div key={name} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
            <span>{name}</span>
          </div>
        ))}
        <span className="text-gray-300">|</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#dc2626' }} />
          <span>Direct Competitor</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#d97706' }} />
          <span>Adjacent Competitor</span>
        </div>
      </div>
    </div>
  );
}

// ─── Store Planner View (First-Principles Space Planning) ─────────────────────

// Type helper — matches the selectedStore shape
type StoreDetail = {
  profile: StoreSpaceProfile;
  segments: { segment: string; segmentCode: string; sft: number; spacePercent: number; nsvPercent: number; efficiency: number; gmrof: number; fixtures: number; options: number; garments: number }[];
  recs: SpaceRecommendation[];
  fashionSplits: { segment: string; core: number; ultimate: number; fashion: number; fastFashion: number }[];
  row: StoreSpaceProfile & { spsfStatus: string; spsfGap: number; spsfTarget: number; pendingRecs: number; aopGapPct: number };
  benchmarks: { grade: string; segmentCode: string; benchmarkSpacePercent: number; benchmarkGmrof: number }[];
  diagnostics: { storeId: string; reasons: string[] } | undefined;
  spsfTarget: { grade: string; current: number; target: number; stretch: number; floor: number } | undefined;
};

interface StorePlannerProps {
  store: StoreDetail;
  acceptedRecs: Set<string>;
  onToggleRec: (id: string) => void;
  pulsePointTasks: PulsePointTask[];
  onExecuteRec: (rec: SpaceRecommendation) => void;
  onExecuteAll: (recs: SpaceRecommendation[]) => void;
  onCreateTask: (task: PulsePointTask) => void;
  spaceChanges: StoreSpaceChange[];
  onBack: () => void;
}

function StorePlannerView({ store, acceptedRecs, onToggleRec, pulsePointTasks, onExecuteRec, onExecuteAll, onCreateTask, spaceChanges }: StorePlannerProps) {

  const toast = useToast();
  const { profile, recs, diagnostics, spsfTarget } = store;
  const [expandedSegment, setExpandedSegment] = useState<string | null>(null);
  const [expandedSimSeg, setExpandedSimSeg] = useState<string | null>(null);
  const [showRecMath, setShowRecMath] = useState<string | null>(null);
  const [targetPcts, setTargetPcts] = useState<Record<string, number>>({});
  const [areaOverride, setAreaOverride] = useState<number | null>(null);
  const [confirmExec, setConfirmExec] = useState<{ type: 'single' | 'batch'; rec?: SpaceRecommendation; recs?: SpaceRecommendation[] } | null>(null);
  const [activatedLevers, setActivatedLevers] = useState<Set<string>>(new Set());

  // Comprehensive planning context with rich segment data
  const planContext = useMemo(() => getStorePlanningContext(profile.storeId), [profile.storeId]);

  // Derived financials
  const annualNsvLakhs = profile.aopRunRateCr * 100;
  const dailyRunRateLakhs = +(annualNsvLakhs / 365).toFixed(2);

  // ── Simulation cascade (area-based: SFT → Options → Qty → NSV) ──
  const effectiveArea = areaOverride ?? profile.saleableArea;
  const areaReduced = areaOverride !== null && areaOverride < profile.saleableArea;
  const areaDeltaSft = effectiveArea - profile.saleableArea;

  const simulation = useMemo(() => {
    const segs = planContext.segments.map((seg) => {
      const newPct = targetPcts[seg.segmentCode] ?? seg.spacePercent;
      const newSft = Math.round(effectiveArea * newPct / 100);
      const deltaSft = newSft - seg.sft;
      // Options proportional to SFT (options per sft ratio stays constant)
      const optionsPerSft = seg.liveOptions / seg.sft;
      const newOptions = Math.round(newSft * optionsPerSft);
      const deltaOptions = newOptions - seg.liveOptions;
      // Qty change (maintain avg depth)
      const deltaQty = Math.round(deltaOptions * seg.avgDepth);
      // NSV change: each option earns avgNsvPerOptionK (thousands Rs per year)
      const deltaNsvLakhs = +(deltaOptions * seg.avgNsvPerOptionK / 100).toFixed(1);
      return {
        ...seg, newPct, newSft, deltaSft,
        deltaOptions, newOptions, deltaQty, deltaNsvLakhs,
      };
    });
    const totalNewPct = segs.reduce((s, seg) => s + seg.newPct, 0);
    const totalDeltaNsvLakhs = segs.reduce((s, seg) => s + seg.deltaNsvLakhs, 0);
    const totalDeltaOptions = segs.reduce((s, seg) => s + seg.deltaOptions, 0);
    const totalDeltaQty = segs.reduce((s, seg) => s + seg.deltaQty, 0);
    const projectedRunRateCr = +(profile.aopRunRateCr + totalDeltaNsvLakhs / 100).toFixed(2);
    const projectedAopGapPct = profile.aopTargetCr > 0
      ? Math.round(((projectedRunRateCr - profile.aopTargetCr) / profile.aopTargetCr) * 100 * 10) / 10
      : 0;
    const hasChanges = Object.keys(targetPcts).length > 0 || areaOverride !== null;
    return { segs, totalNewPct, totalDeltaNsvLakhs, totalDeltaOptions, totalDeltaQty, projectedRunRateCr, projectedAopGapPct, hasChanges };
  }, [planContext.segments, targetPcts, effectiveArea, profile.aopRunRateCr, profile.aopTargetCr, areaOverride]);

  // AOP Recovery Advisor
  const advisor = useMemo(() => getAopRecoveryAdvice(profile.storeId), [profile.storeId]);
  const [advisorOpen, setAdvisorOpen] = useState(true);

  function handlePctChange(segCode: string, value: number) {
    setTargetPcts(prev => ({ ...prev, [segCode]: value }));
  }

  function resetSimulation() {
    setTargetPcts({});
    setAreaOverride(null);
  }

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <PageHeader
        title={profile.storeName}
        backTo={{ label: 'Space Planning', path: '/space-planning' }}
        actions={
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-gray-500">{profile.planVersion}</span>
            <Badge variant={planStatusBadge(profile.planStatus).variant} size="sm">{planStatusBadge(profile.planStatus).label}</Badge>
            {profile.planStatus === 'draft' && (
              <button className="rounded bg-indigo-600 px-2 py-1 text-xs font-medium text-white hover:bg-indigo-700 transition-colors" onClick={() => toast.success(`Plan for ${profile.storeName} submitted for review`, 'Plan Submitted')}>Submit for Review</button>
            )}
            {profile.planStatus === 'under-review' && (
              <button className="rounded bg-indigo-600 px-2 py-1 text-xs font-medium text-white hover:bg-indigo-700 transition-colors" onClick={() => toast.success(`Plan for ${profile.storeName} locked — ${profile.planVersion}`, 'Plan Locked')}>Lock Plan</button>
            )}
            {profile.planStatus === 'locked' && (
              <span className="text-xs text-gray-400">Locked by {profile.planLockedBy} on {profile.planLockedAt}</span>
            )}
            <button
              className="inline-flex items-center gap-1 rounded border border-indigo-200 bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
              onClick={() => {
                // Dispatch custom event to open StoreGen modal in parent
                window.dispatchEvent(new CustomEvent('open-storegen', { detail: { storeName: profile.storeName, context: `Redesign layout for ${profile.storeName} (${profile.city}, Grade ${profile.grade}) — ${profile.saleableArea.toLocaleString()} sq.ft. saleable area` } }));
              }}
            >
              <ExternalLink className="w-3 h-3" /> Open in StoreGen
            </button>
            <span className="text-xs text-gray-400">Hit: {profile.hit}</span>
          </div>
        }
      />

      {/* ── Negative state alerts ── */}
      {spsfTarget && profile.spsf < spsfTarget.floor && (
        <div className="bg-white border border-gray-200 border-l-3 border-l-red-500 rounded-lg p-3 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-gray-900">Sales Per Sq. Ft. below minimum threshold</p>
            <p className="text-xs text-gray-600 mt-0.5">
              Current Sales Per Sq. Ft. Rs {profile.spsf} is below the minimum threshold of Rs {spsfTarget.floor} for Grade {profile.grade} stores.
              This store requires immediate space reallocation to recover productivity.
            </p>
          </div>
        </div>
      )}
      {store.row.aopGapPct < -10 && (
        <div className="bg-white border border-gray-200 border-l-3 border-l-red-500 rounded-lg p-3 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-gray-900">AOP gap critical ({store.row.aopGapPct}%)</p>
            <p className="text-xs text-gray-600 mt-0.5">
              Run rate Rs {profile.aopRunRateCr} Cr vs target Rs {profile.aopTargetCr} Cr. Space reallocation alone may not close this gap — consider reviewing assortment depth and markdown calendar.
            </p>
          </div>
        </div>
      )}
      {planContext.segments.some(s => (s.corePct + (100 - s.fashionPct - s.ffPct - s.corePct > 0 ? 0 : 0)) < 60) && (
        <div className="bg-white border border-gray-200 border-l-3 border-l-amber-500 rounded-lg p-3 flex items-start gap-2">
          <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-gray-900">Fashion grade imbalance detected</p>
            <p className="text-xs text-gray-600 mt-0.5">
              One or more segments have Core% below 60%. High fashion/fast-fashion mix increases markdown risk. Review fashion grade targets in the segment detail below.
            </p>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* AOP RECOVERY ADVISOR                                                 */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {!advisor.isOnTrack && (
        <div className="border-2 border-indigo-200 rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setAdvisorOpen(o => !o)}
            className="w-full px-4 py-3 bg-indigo-50 border-b border-indigo-200 flex items-center justify-between hover:bg-indigo-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span className="text-sm font-semibold text-indigo-900">AOP Recovery Advisor</span>
              <Badge variant="error" size="sm">Rs {advisor.aopGapLakhs}L gap</Badge>
            </div>
            <div className="flex items-center gap-2">
              {advisor.totalRecoverablePct >= 100 ? (
                <Badge variant="success" size="sm">100% closable</Badge>
              ) : (
                <Badge variant="warning" size="sm">{advisor.totalRecoverablePct}% closable</Badge>
              )}
              <ChevronDown className={cn('w-4 h-4 text-indigo-400 transition-transform', advisorOpen && 'rotate-180')} />
            </div>
          </button>

          {advisorOpen && (
            <div className="p-4 space-y-3 bg-white">
              {/* Recovery roadmap bar */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-gray-500 uppercase font-semibold tracking-wide">Recovery Roadmap</span>
                  <span className="text-[10px] text-gray-500">Rs {advisor.totalRecoverableLakhs}L / Rs {advisor.aopGapLakhs}L recoverable</span>
                </div>
                <div className="flex h-4 rounded-full overflow-hidden bg-gray-100">
                  {advisor.strategies.map((s, i) => {
                    const pct = advisor.aopGapLakhs > 0 ? (s.nsvGainLakhs / advisor.aopGapLakhs) * 100 : 0;
                    const colors = ['bg-indigo-600', 'bg-emerald-500', 'bg-amber-500', 'bg-blue-500', 'bg-purple-500'];
                    return (
                      <div
                        key={s.lever}
                        className={cn('flex items-center justify-center text-[8px] font-semibold text-white', colors[i % colors.length])}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                        title={`${s.leverLabel}: Rs ${s.nsvGainLakhs}L (${Math.round(pct)}%)`}
                      >
                        {pct > 8 && s.lever}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Strategy cards */}
              {advisor.strategies.map((s) => (
                <div key={s.lever} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="px-3 py-2.5 flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn(
                          'inline-flex items-center justify-center w-6 h-5 rounded text-[9px] font-bold',
                          s.lever === 'L1' ? 'bg-indigo-100 text-indigo-700' :
                          s.lever === 'L2' ? 'bg-emerald-100 text-emerald-700' :
                          s.lever === 'L3' ? 'bg-amber-100 text-amber-700' :
                          s.lever === 'L4' ? 'bg-blue-100 text-blue-700' :
                          'bg-purple-100 text-purple-700',
                        )}>
                          {s.lever}
                        </span>
                        <span className="text-xs font-semibold text-gray-900">{s.title}</span>
                      </div>
                      <p className="text-[10px] text-gray-500 ml-8">{s.description}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-green-700 tabular-nums">+Rs {s.nsvGainLakhs}L</p>
                      <p className="text-[10px] text-gray-400">{s.cumulativeGapClosedPct}% closed</p>
                    </div>
                  </div>

                  {/* Cascade detail lines */}
                  <div className="px-3 pb-2.5 pt-0">
                    <div className="ml-8 space-y-0.5">
                      {s.details.map((line, i) => (
                        <p key={i} className="text-[10px] text-gray-600 flex items-start gap-1">
                          <ArrowRight className="w-2.5 h-2.5 text-gray-400 shrink-0 mt-0.5" />
                          {line}
                        </p>
                      ))}
                    </div>

                    {/* Deduction strategies breakdown for L1 */}
                    {s.deductionStrategies && s.deductionStrategies.length > 0 && (
                      <div className="ml-8 mt-2 pt-2 border-t border-gray-100">
                        <p className="text-[9px] text-gray-500 uppercase font-semibold tracking-wide mb-1">Deduction Optimization Breakdown</p>
                        {s.deductionStrategies.map((d) => (
                          <div key={d.item} className="flex items-center justify-between py-1 text-[10px] border-b border-gray-50 last:border-0">
                            <div>
                              <span className="font-medium text-gray-700">{d.item}</span>
                              <span className="text-gray-400 ml-1">{d.current} → {d.proposed}</span>
                            </div>
                            <div className="text-right tabular-nums">
                              <span className="text-green-700 font-medium">+{d.sftGained} sft → +{d.optionsGained} opt → +Rs {d.nsvGainLakhs}L</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Activate button */}
                    <div className="ml-8 mt-2 pt-2 border-t border-gray-100 flex items-center justify-between">
                      {activatedLevers.has(s.lever) ? (
                        <div className="flex items-center gap-1.5 text-[10px] text-green-700 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Task raised — assigned to {storeManagerMap[profile.storeId] ?? 'Store Manager'}
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            const task: PulsePointTask = {
                              id: `pp-adv-${s.lever}-${Date.now()}`,
                              recId: `advisor-${s.lever}`,
                              storeId: profile.storeId,
                              storeName: profile.storeName,
                              format: profile.format,
                              title: `${s.leverLabel}: ${s.title}`,
                              description: s.details.join(' | '),
                              segment: s.leverLabel,
                              segmentCode: s.lever,
                              status: 'pushed',
                              assignee: storeManagerMap[profile.storeId] ?? 'Store Manager',
                              createdAt: new Date().toISOString(),
                            };
                            onCreateTask(task);
                            setActivatedLevers(prev => new Set(prev).add(s.lever));
                            toast.success(`Task raised for "${s.leverLabel}" — assigned to ${task.assignee}`, 'PulsePoint');
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                        >
                          <Send className="w-3 h-3" />
                          Raise Task for Store
                        </button>
                      )}
                      <span className="text-[10px] text-gray-400">+Rs {s.nsvGainLakhs}L potential</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 1: STORE CONTEXT + DIAGNOSTIC                                */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Store context — spans 2 cols */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-gray-500">{planContext.catchment.type}</p>
              <p className="text-xs text-gray-400 mt-0.5">{planContext.catchment.demographics}</p>
            </div>
            <div className="text-right space-y-0.5">
              <p className="text-xs text-gray-500">AOP Target</p>
              <p className="text-sm font-semibold text-gray-900">Rs {profile.aopTargetCr} Cr</p>
              <p className={cn('text-xs tabular-nums', profile.aopRunRateCr >= profile.aopTargetCr ? 'text-green-700' : 'text-red-700')}>
                Run rate: Rs {profile.aopRunRateCr} Cr ({store.row.aopGapPct >= 0 ? '+' : ''}{store.row.aopGapPct}%)
              </p>
            </div>
          </div>

        {/* Key metrics row */}
        <div className="grid grid-cols-6 gap-3 pt-3 border-t border-gray-100">
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide"><KpiLabel abbr="SPSF" /></p>
            <p className="text-base font-semibold text-gray-900 tabular-nums">Rs {profile.spsf}</p>
            <p className="text-[10px] text-gray-400">Target: Rs {spsfTarget?.target ?? '--'}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide"><KpiLabel abbr="GMROF" /></p>
            <p className="text-base font-semibold text-gray-900 tabular-nums">Rs {profile.gmrof}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">Daily Run Rate</p>
            <p className="text-base font-semibold text-gray-900 tabular-nums">Rs {dailyRunRateLakhs}L</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">Footfall</p>
            <p className="text-base font-semibold text-gray-900 tabular-nums">{planContext.catchment.monthlyFootfall}/mo</p>
            <p className="text-[10px] text-gray-400">{planContext.catchment.conversionPct}% conv.</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">Avg Basket</p>
            <p className="text-base font-semibold text-gray-900 tabular-nums">Rs {planContext.catchment.avgBasketRs.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">Fixtures</p>
            <p className="text-base font-semibold text-gray-900 tabular-nums">{profile.totalFixtures}</p>
            <p className="text-[10px] text-gray-400">{profile.fixtureUtilization}% util.</p>
          </div>
        </div>

        {/* Competitor context */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex flex-wrap gap-1.5">
            {planContext.competitors.map((c) => (
              <span key={c.name} className="group relative">
                <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium cursor-default', c.type === 'Direct' ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-600')}>
                  <MapPin className="w-2.5 h-2.5" /> {c.name} ({c.distance})
                </span>
                <span className="absolute left-0 top-full mt-1 w-56 bg-gray-900 text-white rounded-lg p-2 text-[10px] opacity-0 group-hover:opacity-100 pointer-events-none z-20">
                  <p className="text-gray-300">{c.strength}</p>
                  <p className="text-indigo-300 mt-0.5">{c.implication}</p>
                </span>
              </span>
            ))}
          </div>
        </div>
        </div>

        {/* Store Diagnostic — top right */}
        {diagnostics && diagnostics.reasons.length > 0 && (
          <div className="bg-white border border-gray-200 border-l-3 border-l-amber-500 rounded-lg p-4">
            <div className="flex items-center gap-1.5 mb-3">
              <CircleAlert className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs font-semibold text-gray-900">Store Diagnostic</span>
            </div>
            <ul className="space-y-2">
              {diagnostics.reasons.map((reason, i) => (
                <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                  <span className="text-gray-400 mt-0.5 shrink-0">{i + 1}.</span>
                  {reason}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 2: AREA BREAKDOWN — Carpet → Saleable                        */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <SectionHeader title="Area Breakdown" subtitle="Carpet area to saleable area cascade" />
        <div className="mt-3 space-y-2">
          {/* Carpet area full bar */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500">Carpet Area</span>
              <span className="text-xs font-semibold text-gray-900 tabular-nums">{profile.carpetArea.toLocaleString()} sft</span>
            </div>
            <div className="flex h-5 rounded overflow-hidden text-[9px] font-medium">
              <div className="bg-indigo-500 text-white flex items-center justify-center" style={{ width: `${profile.saleableRatio}%` }}>
                Saleable {profile.saleableRatio}%
              </div>
              <div className="bg-gray-200 text-gray-600 flex items-center justify-center" style={{ width: `${100 - profile.saleableRatio}%` }}>
                Deductions {(100 - profile.saleableRatio).toFixed(1)}%
              </div>
            </div>
          </div>
          {/* Deductions breakdown */}
          <div className="flex gap-3 text-[10px] text-gray-500 pl-1">
            <span>Back of House: {profile.deductions.stockroomStaff.toLocaleString()}</span>
            <span>Aisles: {profile.deductions.mainAisles.toLocaleString()}</span>
            <span>Trial: {profile.deductions.trialRooms}</span>
            <span>Cash: {profile.deductions.cashCounters}</span>
            <span>Decompression: {profile.deductions.decompression}</span>
          </div>
          {/* Saleable area → segment split */}
          <div>
            <div className="flex items-center justify-between mb-1 mt-2">
              <span className="text-xs text-gray-500">Saleable Area — Segment Split</span>
              <span className="text-xs font-semibold text-gray-900 tabular-nums">{profile.saleableArea.toLocaleString()} sft</span>
            </div>
            <div className="flex h-5 rounded overflow-hidden text-[9px] font-medium">
              {planContext.segments.map((seg, i) => {
                const colors = ['bg-indigo-500 text-white', 'bg-indigo-400 text-white', 'bg-indigo-300 text-indigo-900', 'bg-indigo-200 text-indigo-800', 'bg-indigo-100 text-indigo-700'];
                return (
                  <div key={seg.segmentCode} className={cn('flex items-center justify-center', colors[i % colors.length])} style={{ width: `${seg.spacePercent}%` }}>
                    {seg.segment} {seg.spacePercent}%
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 3: SEGMENT ANALYSIS (The core analysis table)                 */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <TooltipProvider>
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <SectionHeader title="Segment Performance" subtitle="Current allocation vs revenue — click to expand for stock health, Private Label/Exclusive Brand split, fixtures" />
        </div>
        {/* Column headers */}
        <div className="grid grid-cols-12 gap-1 px-4 py-2 bg-gray-50 text-[10px] font-medium text-gray-500 uppercase tracking-wide border-b border-gray-100">
          <div className="col-span-2">Segment</div>
          <div className="text-right">Space</div>
          <div className="text-right">Net Sales Value</div>
          <div className="text-right">Eff.</div>
          <div className="text-right"><KpiLabel abbr="GMROF" /></div>
          <div className="text-right"><KpiLabel abbr="SPSF" /></div>
          <div className="text-right">
            <UITooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex items-center gap-0.5 cursor-help">Trend <Info className="w-2.5 h-2.5 text-gray-400" /></span>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <p className="text-xs">GMROF change (Rs/sqft) over the last 6 months. <strong>+16 ↑</strong> means GMROF improved by Rs 16/sqft. Positive trend supports &quot;Expand&quot;, negative trend triggers &quot;Review&quot; or &quot;Contract&quot;.</p>
              </TooltipContent>
            </UITooltip>
          </div>
          <div className="text-right">Options</div>
          <div className="text-right">Sell-Thru</div>
          <div className="text-center">Action</div>
          <div></div>
        </div>
        {/* Segment rows */}
        <div className="divide-y divide-gray-100">
          {planContext.segments.map((seg) => {
            const isExpanded = expandedSegment === seg.segmentCode;
            const trendDelta = seg.gmrofTrend[5]! - seg.gmrofTrend[0]!;
            return (
              <div key={seg.segmentCode}>
                <button
                  type="button"
                  onClick={() => setExpandedSegment(isExpanded ? null : seg.segmentCode)}
                  className="w-full grid grid-cols-12 gap-1 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left items-center"
                >
                  <div className="col-span-2">
                    <p className="text-xs font-semibold text-gray-900">{seg.segment}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs tabular-nums font-medium text-gray-900">{seg.spacePercent}%</p>
                    <p className="text-[10px] tabular-nums text-gray-400">{seg.sft.toLocaleString()} sft</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs tabular-nums font-medium text-gray-900">{seg.nsvPercent}%</p>
                    <p className="text-[10px] tabular-nums text-gray-400">Rs {seg.annualNsvLakhs}L</p>
                  </div>
                  <div className="text-right">
                    <EfficiencyIndicator efficiency={seg.efficiency} />
                  </div>
                  <div className="text-right text-xs tabular-nums font-medium text-gray-900">Rs {seg.gmrof}</div>
                  <div className="text-right text-xs tabular-nums text-gray-700">Rs {seg.spsf}</div>
                  <div className="text-right">
                    <span className={cn('text-[10px] tabular-nums font-medium', trendDelta > 5 ? 'text-green-700' : trendDelta < -5 ? 'text-red-700' : 'text-gray-400')}>
                      {trendDelta > 0 ? '+' : ''}{trendDelta}
                      {seg.trendDirection === 'up' ? ' ↑' : seg.trendDirection === 'down' ? ' ↓' : ' →'}
                    </span>
                  </div>
                  <div className="text-right text-xs tabular-nums text-gray-700">{seg.liveOptions}</div>
                  <div className="text-right">
                    <span className={cn('text-[10px] tabular-nums font-medium', seg.sellThruPct >= 70 ? 'text-green-700' : seg.sellThruPct >= 60 ? 'text-amber-700' : 'text-red-700')}>
                      {seg.sellThruPct}%
                    </span>
                  </div>
                  <div className="text-center">
                    <UITooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-help">
                          <Badge
                            variant={seg.action === 'Expand' ? 'success' : seg.action === 'Contract' ? 'error' : seg.action === 'Review' ? 'warning' : 'default'}
                            size="sm"
                          >
                            {seg.action}
                          </Badge>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <p className="text-xs">
                          {seg.action === 'Expand' && 'High efficiency + positive trend — allocate more space/fixtures to this segment.'}
                          {seg.action === 'Contract' && 'Low efficiency — reduce space allocation and reallocate to higher-performing segments.'}
                          {seg.action === 'Review' && 'Borderline performance — investigate stock health, assortment mix, and trend before deciding to expand or contract. Click to expand for details.'}
                          {seg.action === 'Hold' && 'Performing at benchmark — no reallocation needed. Continue current allocation.'}
                        </p>
                      </TooltipContent>
                    </UITooltip>
                  </div>
                  <div className="text-right">
                    <ChevronDown className={cn('w-3 h-3 text-gray-400 transition-transform', isExpanded && 'rotate-180')} />
                  </div>
                </button>

                {/* ── Expanded detail ── */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 bg-gray-50/50 space-y-4 border-t border-gray-100">
                    {/* Assessment reasons */}
                    <div className={cn('bg-white border border-gray-200 border-l-3 rounded-lg p-3', seg.action === 'Expand' ? 'border-l-green-500' : seg.action === 'Contract' ? 'border-l-red-500' : seg.action === 'Review' ? 'border-l-amber-500' : 'border-l-gray-400')}>
                      <p className="text-[10px] font-semibold text-gray-900 uppercase tracking-wide mb-1.5">
                        Why {seg.action}?
                      </p>
                      <ul className="space-y-0.5">
                        {seg.actionReasons.map((r, i) => (
                          <li key={i} className="text-xs text-gray-700 flex items-start gap-1.5">
                            <span className="text-gray-400 shrink-0">{i + 1}.</span> {r}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      {/* Stock Health */}
                      <div>
                        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Stock Health</p>
                        <div className="space-y-1.5">
                          {[
                            { label: 'Stock Cover', value: `${seg.stockCoverDays}d`, ok: seg.stockCoverDays <= 35 },
                            { label: 'Sell-Through', value: `${seg.sellThruPct}%`, ok: seg.sellThruPct >= 65 },
                            { label: 'Aged Stock (>90d)', value: `${seg.agedStockPct}%`, ok: seg.agedStockPct <= 10 },
                            { label: 'Rotation', value: `${seg.rotationTurns}x / yr`, ok: seg.rotationTurns >= 3.5 },
                            { label: 'Avg Depth', value: `${seg.avgDepth} pcs/opt`, ok: true },
                            { label: 'Fill Rate', value: `${seg.fillRate}%`, ok: seg.fillRate >= 80 },
                          ].map(m => (
                            <div key={m.label} className="flex items-center justify-between text-[10px]">
                              <span className="text-gray-500">{m.label}</span>
                              <span className={cn('font-medium tabular-nums', m.ok ? 'text-gray-900' : 'text-red-700')}>{m.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Private Label / Exclusive Brand Split */}
                      <div>
                        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Private Label / Exclusive Brand Split</p>
                        <div className="flex h-2.5 rounded-full overflow-hidden mb-2">
                          <div className="bg-indigo-500" style={{ width: `${seg.plSpacePct}%` }} />
                          <div className="bg-gray-300" style={{ width: `${seg.ebSpacePct}%` }} />
                        </div>
                        <div className="space-y-1.5 text-[10px]">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-500" />Private Label ({seg.plSpacePct}%)</span>
                            <span className="font-medium tabular-nums text-gray-900">Rs {seg.plGmrof} GM Return on Footage</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-400" />Exclusive Brand ({seg.ebSpacePct}%)</span>
                            <span className="font-medium tabular-nums text-gray-900">Rs {seg.ebGmrof} GM Return on Footage</span>
                          </div>
                          <p className={cn('text-[10px] pt-1', seg.plGmrof > seg.ebGmrof ? 'text-green-700' : 'text-amber-700')}>
                            Private Label {seg.plGmrof > seg.ebGmrof ? 'outperforms' : 'underperforms'} Exclusive Brand by Rs {Math.abs(seg.plGmrof - seg.ebGmrof)}
                          </p>
                        </div>
                      </div>

                      {/* Fixture Breakdown + Fashion Grade */}
                      <div>
                        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Fixtures ({seg.totalFixtures})</p>
                        <div className="space-y-1">
                          {seg.fixtureBreakdown.map(ft => (
                            <div key={ft.type} className="flex items-center justify-between text-[10px]">
                              <span className="text-gray-600 truncate mr-2">{ft.type}</span>
                              <span className="text-gray-900 tabular-nums shrink-0">{ft.count} × {ft.optCap} opt</span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Fashion Grade</p>
                          <div className="flex gap-1">
                            {[
                              { label: 'Core', pct: seg.corePct, bg: 'bg-indigo-100 text-indigo-700' },
                              { label: 'Fashion', pct: seg.fashionPct, bg: 'bg-amber-50 text-amber-700' },
                              { label: 'FF', pct: seg.ffPct, bg: 'bg-red-50 text-red-600' },
                            ].map(g => (
                              <div key={g.label} className={cn('flex-1 p-1 rounded text-center text-[9px]', g.bg)}>
                                <p className="font-semibold tabular-nums">{g.pct}%</p>
                                <p className="opacity-75">{g.label}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* GMROF Trend mini sparkline */}
                    <div className="flex items-center gap-3 pt-2 border-t border-gray-200">
                      <span className="text-[10px] text-gray-500 shrink-0">GM Return on Footage Trend (6mo):</span>
                      <div className="flex items-end gap-0.5 h-5">
                        {seg.gmrofTrend.map((v, i) => {
                          const max = Math.max(...seg.gmrofTrend);
                          const min = Math.min(...seg.gmrofTrend);
                          const range = max - min || 1;
                          const h = 6 + ((v - min) / range) * 14; // 6-20px
                          return (
                            <div
                              key={i}
                              className={cn('w-4 rounded-sm', i === 5 ? (seg.trendDirection === 'up' ? 'bg-green-500' : seg.trendDirection === 'down' ? 'bg-red-400' : 'bg-gray-400') : 'bg-gray-200')}
                              style={{ height: `${h}px` }}
                              title={`Rs ${v}`}
                            />
                          );
                        })}
                      </div>
                      <span className="text-[10px] text-gray-400 tabular-nums">Rs {seg.gmrofTrend[0]} → Rs {seg.gmrofTrend[5]}</span>
                      <span className="text-[10px] text-gray-400 tabular-nums ml-auto">vs Benchmark: Rs {seg.benchmarkGmrof}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      </TooltipProvider>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 5: SPACE SIMULATION — The Hero Interactive Panel               */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <div className="bg-white border-2 border-indigo-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 bg-indigo-50 border-b border-indigo-200 flex items-center justify-between">
          <div>
            <SectionHeader title="Space Simulation" subtitle="Adjust segment space % and see the cascade: Sq. Ft. → Options → Qty → Net Sales Value impact. Expand rows for fixture type plan." />
          </div>
          {simulation.hasChanges && (
            <button type="button" onClick={resetSimulation} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium px-3 py-1 rounded border border-indigo-300 hover:bg-indigo-100 transition-colors">
              Reset
            </button>
          )}
        </div>

        {/* Total Area Override — area removal simulation */}
        <div className="px-4 py-3 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
              <label className="text-xs font-medium text-gray-600 whitespace-nowrap">Total Saleable Area</label>
              <div className="relative">
                <input
                  type="number"
                  min={500}
                  max={profile.saleableArea * 2}
                  step={100}
                  value={effectiveArea}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    if (v === profile.saleableArea) { setAreaOverride(null); }
                    else if (v > 0) { setAreaOverride(v); }
                  }}
                  className={cn(
                    'w-24 text-center text-xs tabular-nums font-semibold rounded border px-2 py-1',
                    areaOverride !== null ? 'border-indigo-400 text-indigo-700 bg-indigo-50' : 'border-gray-200 text-gray-900 bg-white'
                  )}
                />
                <span className="ml-1 text-[10px] text-gray-500">Sq. Ft.</span>
              </div>
              <span className="text-[10px] text-gray-400">Current: {profile.saleableArea.toLocaleString()} Sq. Ft.</span>
            </div>
            {areaReduced && (
              <div className="flex items-center gap-3 ml-auto">
                <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-red-50 border border-red-200">
                  <ArrowDownRight className="w-3 h-3 text-red-600" />
                  <span className="text-[10px] font-semibold text-red-700 tabular-nums">
                    {areaDeltaSft.toLocaleString()} Sq. Ft. ({Math.round((areaDeltaSft / profile.saleableArea) * 100)}%)
                  </span>
                </div>
                <div className="text-[10px] text-gray-500">
                  Segment ratios maintained — all segments shrink proportionally
                </div>
              </div>
            )}
            {areaOverride !== null && !areaReduced && areaDeltaSft > 0 && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-green-50 border border-green-200 ml-auto">
                <ArrowUpRight className="w-3 h-3 text-green-600" />
                <span className="text-[10px] font-semibold text-green-700 tabular-nums">
                  +{areaDeltaSft.toLocaleString()} Sq. Ft. (+{Math.round((areaDeltaSft / profile.saleableArea) * 100)}%)
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Area reduction impact summary */}
        {areaReduced && (
          <div className="px-4 py-2 bg-red-50/50 border-b border-red-100">
            <div className="flex items-center gap-6 text-[10px]">
              <div>
                <span className="text-gray-500 uppercase font-medium">Area Lost: </span>
                <span className="font-semibold text-red-700 tabular-nums">{Math.abs(areaDeltaSft).toLocaleString()} Sq. Ft.</span>
              </div>
              <div>
                <span className="text-gray-500 uppercase font-medium">Options Lost: </span>
                <span className="font-semibold text-red-700 tabular-nums">{Math.abs(simulation.totalDeltaOptions)}</span>
              </div>
              <div>
                <span className="text-gray-500 uppercase font-medium">Garments Lost: </span>
                <span className="font-semibold text-red-700 tabular-nums">{Math.abs(simulation.totalDeltaQty).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-gray-500 uppercase font-medium">Net Sales Value Impact: </span>
                <span className="font-semibold text-red-700 tabular-nums">
                  {simulation.totalDeltaNsvLakhs >= 0 ? '+' : ''}Rs {simulation.totalDeltaNsvLakhs.toFixed(1)}L/yr
                </span>
              </div>
              <div>
                <span className="text-gray-500 uppercase font-medium">New Sales Per Sq. Ft.: </span>
                <span className="font-semibold text-gray-900 tabular-nums">
                  Rs {effectiveArea > 0 ? Math.round((profile.aopRunRateCr * 10000000 + simulation.totalDeltaNsvLakhs * 100000) / effectiveArea) : 0}/Sq.Ft.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Simulation column headers */}
        <div className="grid grid-cols-11 gap-1 px-4 py-2 bg-gray-50 text-[10px] font-medium text-gray-500 uppercase tracking-wide border-b border-gray-100">
          <div className="col-span-2">Segment</div>
          <div className="text-right">Current</div>
          <div className="text-center">Target %</div>
          <div className="text-right">New Sq. Ft.</div>
          <div className="text-right">Options</div>
          <div className="text-right">Qty</div>
          <div className="text-right">Current Net Sales</div>
          <div className="text-right">Net Sales Impact</div>
          <div className="text-right">New Net Sales</div>
          <div className="text-center">AI Target</div>
        </div>

        {/* Simulation rows */}
        <div className="divide-y divide-gray-100">
          {simulation.segs.map((seg) => {
            const changed = seg.newPct !== seg.spacePercent;
            const newNsvLakhs = +(seg.annualNsvLakhs + seg.deltaNsvLakhs).toFixed(1);
            const isSimExpanded = expandedSimSeg === seg.segmentCode;
            const hasRecTarget = seg.recommendedSpacePct !== seg.spacePercent;
            return (
              <div key={seg.segmentCode}>
                <div className={cn('grid grid-cols-11 gap-1 px-4 py-2 items-center', changed && 'bg-indigo-50/30')}>
                  <div className="col-span-2">
                    <button
                      type="button"
                      onClick={() => setExpandedSimSeg(isSimExpanded ? null : seg.segmentCode)}
                      className="text-left flex items-center gap-1"
                    >
                      <ChevronDown className={cn('w-3 h-3 text-gray-400 transition-transform shrink-0', isSimExpanded && 'rotate-180')} />
                      <div>
                        <p className="text-xs font-semibold text-gray-900">{seg.segment}</p>
                      </div>
                    </button>
                  </div>
                  <div className="text-right">
                    <p className="text-xs tabular-nums text-gray-500">{seg.spacePercent}%</p>
                    <p className="text-[10px] tabular-nums text-gray-400">{seg.sft.toLocaleString()} sft</p>
                  </div>
                  <div className="text-center">
                    <input
                      type="number"
                      min={0}
                      max={60}
                      step={1}
                      value={seg.newPct}
                      onChange={(e) => handlePctChange(seg.segmentCode, Number(e.target.value))}
                      className={cn('w-14 text-center text-xs tabular-nums font-semibold rounded border px-1 py-0.5', changed ? 'border-indigo-400 text-indigo-700 bg-indigo-50' : 'border-gray-200 text-gray-900 bg-white')}
                    />
                  </div>
                  <div className="text-right">
                    <p className={cn('text-xs tabular-nums font-medium', changed ? 'text-gray-900' : 'text-gray-400')}>{seg.newSft.toLocaleString()}</p>
                    {seg.deltaSft !== 0 && (
                      <p className={cn('text-[10px] tabular-nums', seg.deltaSft > 0 ? 'text-green-700' : 'text-red-700')}>
                        {seg.deltaSft > 0 ? '+' : ''}{seg.deltaSft.toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className={cn('text-xs tabular-nums', changed ? 'text-gray-900' : 'text-gray-400')}>{seg.newOptions}</p>
                    {seg.deltaOptions !== 0 && (
                      <p className={cn('text-[10px] tabular-nums', seg.deltaOptions > 0 ? 'text-green-700' : 'text-red-700')}>
                        {seg.deltaOptions > 0 ? '+' : ''}{seg.deltaOptions}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    {seg.deltaQty !== 0 ? (
                      <>
                        <p className="text-xs tabular-nums text-gray-900">{(seg.totalQty + seg.deltaQty).toLocaleString()}</p>
                        <p className={cn('text-[10px] tabular-nums', seg.deltaQty > 0 ? 'text-green-700' : 'text-red-700')}>
                          {seg.deltaQty > 0 ? '+' : ''}{seg.deltaQty.toLocaleString()}
                        </p>
                      </>
                    ) : (
                      <p className="text-xs tabular-nums text-gray-400">{seg.totalQty.toLocaleString()}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs tabular-nums text-gray-500">Rs {seg.annualNsvLakhs}L</p>
                  </div>
                  <div className="text-right">
                    {seg.deltaNsvLakhs !== 0 && (
                      <span className={cn('text-xs tabular-nums font-semibold', seg.deltaNsvLakhs > 0 ? 'text-green-700' : 'text-red-700')}>
                        {seg.deltaNsvLakhs > 0 ? '+' : ''}Rs {seg.deltaNsvLakhs}L
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    {changed && (
                      <p className={cn('text-xs tabular-nums font-medium', seg.deltaNsvLakhs >= 0 ? 'text-gray-900' : 'text-red-700')}>Rs {newNsvLakhs}L</p>
                    )}
                  </div>
                  <div className="text-center">
                    {hasRecTarget ? (
                      <button
                        type="button"
                        onClick={() => handlePctChange(seg.segmentCode, seg.recommendedSpacePct)}
                        className={cn(
                          'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors',
                          seg.newPct === seg.recommendedSpacePct
                            ? 'bg-green-100 text-green-700 border border-green-300'
                            : seg.action === 'Expand'
                              ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
                              : seg.action === 'Contract'
                                ? 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                                : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100',
                        )}
                        title={`Click to set target to AI-recommended ${seg.recommendedSpacePct}%`}
                      >
                        {seg.newPct === seg.recommendedSpacePct ? <CheckCircle2 className="w-3 h-3" /> : <ArrowRight className="w-3 h-3" />}
                        {seg.recommendedSpacePct}%
                      </button>
                    ) : (
                      <span className="text-[10px] text-gray-400">Hold</span>
                    )}
                  </div>
                </div>

                {/* Constraint violation warning */}
                {changed && (seg.newPct < 10 || seg.newPct > 30) && (
                  <div className={cn('mx-4 mb-1 px-3 py-1.5 rounded bg-white border border-gray-200 border-l-3 text-[10px] flex items-center gap-1.5', seg.newPct < 10 ? 'border-l-red-500 text-gray-700' : 'border-l-amber-500 text-gray-700')}>
                    <AlertTriangle className="w-3 h-3 shrink-0" />
                    {seg.newPct < 10
                      ? `Segment below minimum (C2): ${seg.segment} at ${seg.newPct}% is below the 10% minimum. This violates optimizer constraint C2 and may result in poor category visibility.`
                      : `Segment above ceiling (C3): ${seg.segment} at ${seg.newPct}% exceeds the 30% maximum. This violates optimizer constraint C3 and creates concentration risk.`
                    }
                  </div>
                )}

                {/* Expandable: Private Label/Exclusive Brand Split + Fixture Type Allocation */}
                {isSimExpanded && (() => {
                  const plSft = Math.round(seg.newSft * seg.plSpacePct / 100);
                  const ebSft = seg.newSft - plSft;
                  const plOptions = Math.round(seg.newOptions * seg.plSpacePct / 100);
                  const ebOptions = seg.newOptions - plOptions;
                  const plQty = Math.round((seg.totalQty + seg.deltaQty) * seg.plSpacePct / 100);
                  const ebQty = (seg.totalQty + seg.deltaQty) - plQty;
                  const newNsvTotal = seg.annualNsvLakhs + seg.deltaNsvLakhs;
                  const plNsvLakhs = +(newNsvTotal * seg.plSpacePct / 100).toFixed(1);
                  const ebNsvLakhs = +(newNsvTotal - plNsvLakhs).toFixed(1);
                  return (
                    <div className="px-6 pb-3 pt-1 bg-gray-50/50 border-t border-gray-100 space-y-4">
                      {/* Private Label / Exclusive Brand Split */}
                      <div>
                        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
                          Private Label / Exclusive Brand Split — {seg.segment}
                        </p>
                        {/* Stacked bar */}
                        <div className="flex h-5 rounded overflow-hidden mb-2">
                          <div className="bg-indigo-500 flex items-center justify-center" style={{ width: `${seg.plSpacePct}%` }}>
                            <span className="text-[9px] text-white font-bold">Private Label {seg.plSpacePct}%</span>
                          </div>
                          <div className="bg-amber-400 flex items-center justify-center" style={{ width: `${seg.ebSpacePct}%` }}>
                            <span className="text-[9px] text-gray-900 font-bold">Exclusive Brand {seg.ebSpacePct}%</span>
                          </div>
                        </div>
                        {/* Private Label / Exclusive Brand detail table */}
                        <div className="grid grid-cols-7 gap-1 text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-1">
                          <div>Type</div>
                          <div className="text-right">Space %</div>
                          <div className="text-right">Sq. Ft.</div>
                          <div className="text-right">Options</div>
                          <div className="text-right">Qty</div>
                          <div className="text-right">Net Sales</div>
                          <div className="text-right">GM Return on Footage</div>
                        </div>
                        {[
                          { label: 'Private Label', pct: seg.plSpacePct, sft: plSft, options: plOptions, qty: plQty, nsv: plNsvLakhs, gmrof: seg.plGmrof, color: 'text-indigo-700' },
                          { label: 'Exclusive Brand', pct: seg.ebSpacePct, sft: ebSft, options: ebOptions, qty: ebQty, nsv: ebNsvLakhs, gmrof: seg.ebGmrof, color: 'text-amber-700' },
                        ].map(row => (
                          <div key={row.label} className="grid grid-cols-7 gap-1 py-1.5 text-[10px] border-t border-gray-100">
                            <div className={cn('font-medium', row.color)}>{row.label}</div>
                            <div className="text-right tabular-nums text-gray-700">{row.pct}%</div>
                            <div className="text-right tabular-nums text-gray-700">{row.sft.toLocaleString()}</div>
                            <div className="text-right tabular-nums text-gray-700">{row.options}</div>
                            <div className="text-right tabular-nums text-gray-700">{row.qty.toLocaleString()}</div>
                            <div className="text-right tabular-nums text-gray-700">Rs {row.nsv}L</div>
                            <div className="text-right tabular-nums font-medium text-gray-900">Rs {row.gmrof}</div>
                          </div>
                        ))}
                      </div>

                      {/* Fixture Type Allocation */}
                      <div>
                        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
                          Fixture Type Allocation — {seg.segment} ({seg.totalFixtures} fixtures)
                        </p>
                        <div className="grid grid-cols-5 gap-1 text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-1">
                          <div>Type</div>
                          <div className="text-right">Current %</div>
                          <div className="text-right">Recommended %</div>
                          <div className="text-right">Opt Cap/Unit</div>
                          <div>Display</div>
                        </div>
                        {seg.fixtureTypeMix.map(ft => (
                          <div key={ft.type} className="grid grid-cols-5 gap-1 py-1 text-[10px] border-t border-gray-100">
                            <div className="text-gray-700">{ft.type}</div>
                            <div className="text-right tabular-nums text-gray-600">{ft.currentPct}%</div>
                            <div className={cn('text-right tabular-nums font-medium', ft.recommendedPct !== ft.currentPct ? 'text-indigo-700' : 'text-gray-600')}>
                              {ft.recommendedPct}%
                              {ft.recommendedPct !== ft.currentPct && (
                                <span className={cn('ml-1', ft.recommendedPct > ft.currentPct ? 'text-green-700' : 'text-red-700')}>
                                  ({ft.recommendedPct > ft.currentPct ? '+' : ''}{ft.recommendedPct - ft.currentPct})
                                </span>
                              )}
                            </div>
                            <div className="text-right tabular-nums text-gray-600">{ft.optCapPerUnit} opt</div>
                            <div className="text-gray-500">{ft.displayMethod}</div>
                          </div>
                        ))}
                      </div>

                      {/* RA → VM → Fixture Area Demand */}
                      {(() => {
                        const demand = computeRAFixtureDemand(profile.storeId, seg.segmentCode, seg.newSft);
                        const isDeficit = demand.areaGap < 0;
                        const isTight = demand.areaGapPct >= 0 && demand.areaGapPct < 15;
                        const fixtureColors: Record<string, string> = { '4WAY': 'bg-blue-400', 'SR4': 'bg-indigo-400', 'SR6': 'bg-indigo-500', 'WU4': 'bg-purple-400', 'WU8': 'bg-purple-500', 'GD4': 'bg-teal-400', 'GD8': 'bg-teal-500', 'NT': 'bg-amber-400', 'DT': 'bg-pink-400', 'MP': 'bg-orange-400', 'WFA': 'bg-cyan-400', 'SWP': 'bg-emerald-400' };
                        return (
                          <div className="mb-3">
                            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                              RA → Fixture Demand — {seg.segment}
                            </p>
                            {/* Demand vs Allocation summary strip */}
                              <div className={cn(
                                'flex items-center gap-4 mb-2 px-2 py-1.5 rounded text-[10px] border',
                                isDeficit ? 'bg-red-50 border-red-200' : isTight ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'
                              )}>
                                <div>
                                  <span className="text-gray-500">Fixtures: </span>
                                  <span className="font-semibold text-gray-900">{demand.totalFixturesNeeded}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500">Area Needed: </span>
                                  <span className="font-semibold text-gray-900">{demand.totalAreaNeeded} sqft</span>
                                </div>
                                <div className="border-l border-gray-300 pl-3">
                                  <span className="text-gray-500">Allocated: </span>
                                  <span className="font-semibold text-gray-900">{demand.allocatedAreaSqft.toLocaleString()} sqft</span>
                                </div>
                                <div>
                                  <span className="text-gray-500">Gap: </span>
                                  <span className={cn('font-bold', isDeficit ? 'text-red-700' : isTight ? 'text-amber-700' : 'text-green-700')}>
                                    {demand.areaGap > 0 ? '+' : ''}{demand.areaGap} sqft ({demand.areaGapPct > 0 ? '+' : ''}{demand.areaGapPct}%)
                                  </span>
                                </div>
                                {isDeficit && (
                                  <div className="flex items-center gap-1 text-red-600 ml-auto">
                                    <AlertTriangle className="w-3 h-3" />
                                    <span className="font-medium">Area deficit</span>
                                  </div>
                                )}
                              </div>

                              {/* Fixture breakdown table */}
                              <div className="grid grid-cols-10 gap-1 text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-1">
                                <div>Fixture Type</div>
                                <div className="text-center">VM Display</div>
                                <div className="text-right">Area/Unit</div>
                                <div className="text-right">Count</div>
                                <div className="text-right">Total Area</div>
                                <div className="text-right">Slots</div>
                                <div className="text-right">Util</div>
                                <div className="col-span-3">RA Bricks → VM Garment Type</div>
                              </div>
                              {demand.fixtureBreakdown.map(fd => (
                                <div key={fd.fixtureCode} className={cn(
                                  'grid grid-cols-10 gap-1 py-1.5 text-[10px] border-t border-gray-100',
                                  fd.utilization > 95 && 'bg-red-50/50'
                                )}>
                                  <div className="text-gray-700 font-medium truncate" title={fd.fixtureType}>{fd.fixtureType}</div>
                                  <div className="text-center text-gray-600">{fd.displayMethod}</div>
                                  <div className="text-right tabular-nums text-gray-600">{fd.areaSqft} sqft</div>
                                  <div className="text-right tabular-nums font-semibold text-gray-900">{fd.fixturesNeeded}</div>
                                  <div className="text-right tabular-nums font-semibold text-gray-900">{fd.totalAreaSqft} sqft</div>
                                  <div className="text-right tabular-nums">
                                    <span className={cn('font-medium', fd.utilization > 95 ? 'text-red-700' : 'text-gray-900')}>{fd.slotsConsumed}</span>
                                    <span className="text-gray-400">/{fd.totalSlots}</span>
                                  </div>
                                  <div className="text-right">
                                    <div className="flex items-center justify-end gap-1">
                                      <div className="w-10 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                          className={cn('h-full rounded-full', fd.utilization > 95 ? 'bg-red-500' : fd.utilization > 80 ? 'bg-amber-500' : 'bg-emerald-500')}
                                          style={{ width: `${Math.min(100, fd.utilization)}%` }}
                                        />
                                      </div>
                                      <span className={cn('tabular-nums', fd.utilization > 95 ? 'text-red-700' : 'text-gray-600')}>{fd.utilization}%</span>
                                    </div>
                                  </div>
                                  <div className="col-span-3 flex flex-wrap gap-1">
                                    {fd.bricks.map(b => (
                                      <span key={b.brickCode} className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded bg-gray-100 text-[9px] text-gray-600" title={`${b.familyName} → ${b.brickName} (${b.fashionGrade}) → VM: ${b.vmGarmentType} → ${b.options} opts → ${b.slotsUsed} slots`}>
                                        <span className={cn(
                                          'w-1.5 h-1.5 rounded-full shrink-0',
                                          b.vmGarmentType === 'Hanging' ? 'bg-indigo-400' : b.vmGarmentType === 'Folded' ? 'bg-amber-400' : b.vmGarmentType === 'Accessory' ? 'bg-teal-400' : 'bg-pink-400'
                                        )} />
                                        {b.brickName}
                                        <span className="text-gray-400">{b.options}opt</span>
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              ))}

                            {/* Area composition bar */}
                            <div className="flex items-center gap-2 text-[10px]">
                              <span className="text-gray-500 shrink-0">Area split:</span>
                              <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden flex">
                                {demand.fixtureBreakdown.map(fd => {
                                  const pct = demand.totalAreaNeeded > 0 ? (fd.totalAreaSqft / demand.totalAreaNeeded) * 100 : 0;
                                  return (
                                    <div
                                      key={fd.fixtureCode}
                                      className={cn('h-full', fixtureColors[fd.fixtureCode] || 'bg-gray-400')}
                                      style={{ width: `${pct}%` }}
                                      title={`${fd.fixtureType}: ${fd.totalAreaSqft} sqft (${Math.round(pct)}%)`}
                                    />
                                  );
                                })}
                              </div>
                              <span className="text-gray-500 shrink-0 tabular-nums">{demand.totalAreaNeeded} sqft</span>
                            </div>
                            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[9px] text-gray-500">
                              {demand.fixtureBreakdown.map(fd => (
                                <span key={fd.fixtureCode} className="flex items-center gap-1">
                                  <span className={cn('w-2 h-2 rounded-sm', fixtureColors[fd.fixtureCode] || 'bg-gray-400')} />
                                  {fd.fixtureType} ({fd.totalAreaSqft} sqft)
                                </span>
                              ))}
                            </div>
                            {/* VM garment type legend */}
                            <div className="mt-1 flex items-center gap-3 text-[9px] text-gray-400">
                              <span>VM Garment Types:</span>
                              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-indigo-400" /> Hanging</span>
                              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Folded</span>
                              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-teal-400" /> Accessory</span>
                              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-pink-400" /> Styled</span>
                            </div>
                          </div>
                        );
                      })()}

                      {/* RA → Fixture Slot Assignment */}
                      <div>
                        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
                          Option → Fixture Assignment — {seg.segment}
                        </p>
                        <p className="text-[10px] text-gray-400 mb-2">
                          Shows which fixtures each RA option/brick is assigned to and slot utilization. If productionized, this is where it goes.
                        </p>
                        {(() => {
                          const assignments = getSegmentFixtureAssignments(profile.storeId, seg.segmentCode);
                          const totalSlots = assignments.reduce((s, a) => s + a.slotsTotal, 0);
                          const usedSlots = assignments.reduce((s, a) => s + a.slotsUsed, 0);
                          const overflowed = assignments.filter(a => a.utilization > 95);
                          return (
                            <>
                              {/* Summary strip */}
                              <div className="flex items-center gap-4 mb-2 text-[10px]">
                                <div>
                                  <span className="text-gray-500">Fixtures: </span>
                                  <span className="font-semibold text-gray-900">{assignments.length}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500">Slots: </span>
                                  <span className="font-semibold text-gray-900 tabular-nums">{usedSlots}/{totalSlots}</span>
                                  <span className="text-gray-400 ml-1">({totalSlots > 0 ? Math.round((usedSlots / totalSlots) * 100) : 0}%)</span>
                                </div>
                                <div>
                                  <span className="text-gray-500">Available: </span>
                                  <span className="font-semibold text-green-700 tabular-nums">{totalSlots - usedSlots} slots</span>
                                </div>
                                {overflowed.length > 0 && (
                                  <div className="flex items-center gap-1 text-red-600">
                                    <AlertTriangle className="w-3 h-3" />
                                    <span className="font-medium">{overflowed.length} fixture{overflowed.length > 1 ? 's' : ''} near capacity</span>
                                  </div>
                                )}
                              </div>
                              {/* Fixture table */}
                              <div className="grid grid-cols-8 gap-1 text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-1">
                                <div>Fixture</div>
                                <div>Type</div>
                                <div className="text-center">Display</div>
                                <div className="text-center">Grade</div>
                                <div className="text-right">Slots</div>
                                <div className="text-right">Util</div>
                                <div className="col-span-2">Assigned Bricks</div>
                              </div>
                              {assignments.slice(0, 8).map(fa => (
                                <div key={fa.fixtureCode} className={cn('grid grid-cols-8 gap-1 py-1.5 text-[10px] border-t border-gray-100', fa.utilization > 95 && 'bg-red-50/50')}>
                                  <div className="font-mono text-gray-700">{fa.fixtureCode}</div>
                                  <div className="text-gray-600 truncate">{fa.fixtureType}</div>
                                  <div className="text-center text-gray-600">{fa.displayMethod}</div>
                                  <div className="text-center">
                                    <span className={cn(
                                      'px-1 py-0.5 rounded text-[9px] font-medium',
                                      fa.fashionGrade === 'Core' ? 'bg-blue-50 text-blue-700' : fa.fashionGrade === 'Fashion' ? 'bg-purple-50 text-purple-700' : 'bg-orange-50 text-orange-700'
                                    )}>
                                      {fa.fashionGrade}
                                    </span>
                                  </div>
                                  <div className="text-right tabular-nums">
                                    <span className={cn('font-medium', fa.utilization > 95 ? 'text-red-700' : 'text-gray-900')}>{fa.slotsUsed}</span>
                                    <span className="text-gray-400">/{fa.slotsTotal}</span>
                                  </div>
                                  <div className="text-right">
                                    <div className="flex items-center justify-end gap-1">
                                      <div className="w-10 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                          className={cn('h-full rounded-full', fa.utilization > 95 ? 'bg-red-500' : fa.utilization > 80 ? 'bg-amber-500' : 'bg-emerald-500')}
                                          style={{ width: `${Math.min(100, fa.utilization)}%` }}
                                        />
                                      </div>
                                      <span className={cn('tabular-nums font-medium', fa.utilization > 95 ? 'text-red-700' : 'text-gray-600')}>{fa.utilization}%</span>
                                    </div>
                                  </div>
                                  <div className="col-span-2 flex flex-wrap gap-1">
                                    {fa.assignedOptions.map(opt => (
                                      <span key={opt.brickCode} className="inline-flex items-center px-1 py-0.5 rounded bg-gray-100 text-[9px] text-gray-600" title={`${opt.brickName}: ${opt.slotsConsumed} slot${opt.slotsConsumed > 1 ? 's' : ''}`}>
                                        {opt.brickName} <span className="text-gray-400 ml-0.5">×{opt.slotsConsumed}</span>
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              ))}
                              {assignments.length > 8 && (
                                <p className="text-[10px] text-gray-400 mt-1">Showing 8 of {assignments.length} fixtures</p>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  );
                })()}
              </div>
            );
          })}
        </div>

        {/* Simulation summary footer */}
        <div className={cn('px-4 py-3 border-t-2 flex items-center justify-between', simulation.totalNewPct !== 100 ? 'bg-red-50 border-red-200' : simulation.hasChanges ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200')}>
          <div className="flex items-center gap-4">
            <div className="text-xs">
              <span className="text-gray-500">Total Space: </span>
              <span className={cn('font-semibold tabular-nums', simulation.totalNewPct !== 100 ? 'text-red-700' : 'text-gray-900')}>
                {simulation.totalNewPct}%
              </span>
              {simulation.totalNewPct !== 100 && <span className="text-red-500 text-[10px] ml-1">(must = 100%)</span>}
            </div>
            {simulation.hasChanges && (
              <div className="text-xs">
                <span className="text-gray-500">Net Sales Value Impact: </span>
                <span className={cn('font-semibold tabular-nums', simulation.totalDeltaNsvLakhs >= 0 ? 'text-green-700' : 'text-red-700')}>
                  {simulation.totalDeltaNsvLakhs >= 0 ? '+' : ''}Rs {simulation.totalDeltaNsvLakhs.toFixed(1)}L/yr
                </span>
              </div>
            )}
          </div>
          {simulation.hasChanges && (simulation.totalNewPct === 100 || areaOverride !== null) && (
            <div className="flex items-center gap-4 text-xs">
              {areaOverride !== null && (
                <div>
                  <span className="text-gray-500">Effective Area: </span>
                  <span className="font-semibold text-gray-900 tabular-nums">{effectiveArea.toLocaleString()} Sq. Ft.</span>
                  <span className="text-gray-400 ml-1">({areaDeltaSft >= 0 ? '+' : ''}{areaDeltaSft.toLocaleString()})</span>
                </div>
              )}
              <div>
                <span className="text-gray-500">Projected Run Rate: </span>
                <span className="font-semibold text-gray-900 tabular-nums">Rs {simulation.projectedRunRateCr} Cr</span>
              </div>
              <div>
                <span className="text-gray-500">AOP Gap: </span>
                <span className={cn('font-semibold tabular-nums', simulation.projectedAopGapPct >= 0 ? 'text-green-700' : 'text-red-700')}>
                  {simulation.projectedAopGapPct >= 0 ? '+' : ''}{simulation.projectedAopGapPct}%
                </span>
                <span className="text-gray-400 ml-1">vs {store.row.aopGapPct}% current</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 6: AI RECOMMENDATIONS (Area-based with full math)             */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <div className="space-y-4">
        {/* AI Recommendations — area-based */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <SectionHeader title={`AI Recommendations (${recs.length})`} subtitle="Area-based space changes with full impact cascade" />
          </div>
          {recs.length === 0 ? (
            <EmptyState description="No pending recommendations for this store" />
          ) : (
            <div className="divide-y divide-gray-100">
              {recs.map((rec) => {
                const isAccepted = acceptedRecs.has(rec.id);
                const isMathShown = showRecMath === rec.id;
                const deltaPct = rec.recommendedSpacePct - rec.currentSpacePct;
                const isIncrease = deltaPct > 0;
                const recTask = pulsePointTasks.find(t => t.recId === rec.id);
                const recExecuted = !!recTask;
                const recStatus = recTask?.status;
                return (
                  <div key={rec.id} className={cn('transition-colors', isAccepted && 'bg-green-50/50')}>
                    {/* Rec header */}
                    <div className="px-4 py-3">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={isIncrease ? 'success' : 'error'} size="sm">
                              {isIncrease ? 'Expand Area' : 'Reduce Area'} — {rec.segment}
                            </Badge>
                            <span className="text-xs font-semibold text-gray-900">{rec.title}</span>
                            {recExecuted && (
                              <Badge variant={recStatus === 'pushed' ? 'primary' : recStatus === 'in-progress' ? 'warning' : 'success'} size="sm">
                                {recStatus === 'pushed' ? 'Pushed to PulsePoint' : recStatus === 'in-progress' ? 'Store: In Progress' : 'Completed'}
                              </Badge>
                            )}
                          </div>
                          {/* Area cascade summary */}
                          <div className="flex items-center gap-3 text-[10px] text-gray-500">
                            <span>{rec.currentSft.toLocaleString()} sft <ArrowRight className="w-2.5 h-2.5 inline" /> {rec.newSft.toLocaleString()} sft</span>
                            <span className="text-gray-300">|</span>
                            <span>{rec.currentOptions} opt <ArrowRight className="w-2.5 h-2.5 inline" /> {rec.newOptionCapacity} opt</span>
                            <span className="text-gray-300">|</span>
                            <span className={cn('font-medium', isIncrease ? 'text-green-700' : 'text-red-700')}>
                              {isIncrease ? '+' : ''}Rs {rec.spsfDelta}/Sq.Ft.
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button type="button" onClick={() => setShowRecMath(isMathShown ? null : rec.id)} className="text-[10px] text-indigo-600 hover:text-indigo-700 font-medium px-2 py-0.5 rounded border border-indigo-200 hover:bg-indigo-50">
                            {isMathShown ? 'Hide Details' : 'Show Math'}
                          </button>
                          {isAccepted && !recExecuted && (() => {
                            const ep = rec.executionPath;
                            if (ep.stockStatus === 'in-dc') {
                              return (
                                <button
                                  type="button"
                                  onClick={() => setConfirmExec({ type: 'single', rec })}
                                  className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100"
                                >
                                  <Send className="w-3 h-3" /> Trigger DC Replenishment
                                </button>
                              );
                            }
                            if (ep.stockStatus === 'in-pipeline') {
                              return (
                                <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-amber-50 border border-amber-200 text-amber-700">
                                  <Clock className="w-3 h-3" /> Stock in Pipeline — ETA {ep.etaWeeks}w
                                </span>
                              );
                            }
                            // needs-ra
                            return (
                              <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-orange-50 border border-orange-200 text-orange-700">
                                <Clock className="w-3 h-3" /> Queued for {ep.nextRACycle}
                              </span>
                            );
                          })()}
                          <button
                            type="button"
                            onClick={() => !recExecuted && onToggleRec(rec.id)}
                            disabled={recExecuted}
                            className={cn(
                              'flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition-colors',
                              recExecuted
                                ? 'bg-green-600 text-white opacity-60 cursor-not-allowed'
                                : isAccepted
                                  ? 'bg-green-600 text-white'
                                  : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
                            )}
                          >
                            {isAccepted || recExecuted ? <><CheckCircle2 className="w-3 h-3" /> Accepted</> : 'Accept'}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expanded: Full math + hierarchy split */}
                    {isMathShown && (
                      <div className="px-4 pb-4 space-y-3 border-t border-gray-100 bg-gray-50/50">
                        {/* Trigger & Constraint */}
                        <div className="grid grid-cols-2 gap-3 pt-3">
                          <div>
                            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Why</p>
                            <p className="text-[10px] text-gray-600">{rec.trigger}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Constraint</p>
                            <p className="text-[10px] text-gray-600">{rec.constraint}</p>
                          </div>
                        </div>

                        {/* Full transparent math */}
                        <div className="bg-white border border-gray-200 rounded-lg p-3">
                          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Sales Per Sq. Ft. Impact Calculation</p>
                          <div className="space-y-1 text-[10px] font-mono tabular-nums">
                            <div className="flex justify-between text-gray-600">
                              <span>Current {rec.segment} Net Sales Value</span>
                              <span>Rs {rec.math.currentSegNsvLakhs}L</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                              <span>Avg Net Sales per option</span>
                              <span>Rs {rec.math.avgNsvPerOption}K/yr</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                              <span>Option change ({rec.currentOptions} → {rec.newOptionCapacity})</span>
                              <span className={cn(rec.math.deltaOptions >= 0 ? 'text-green-700' : 'text-red-700')}>
                                {rec.math.deltaOptions >= 0 ? '+' : ''}{rec.math.deltaOptions} options
                              </span>
                            </div>
                            <div className="flex justify-between text-gray-600 border-t border-gray-100 pt-1">
                              <span>Net Sales delta = {Math.abs(rec.math.deltaOptions)} opt x Rs {rec.math.avgNsvPerOption}K</span>
                              <span className={cn('font-medium', rec.math.deltaNsvLakhs >= 0 ? 'text-green-700' : 'text-red-700')}>
                                {rec.math.deltaNsvLakhs >= 0 ? '+' : ''}Rs {rec.math.deltaNsvLakhs}L
                              </span>
                            </div>
                            <div className="flex justify-between text-gray-900 border-t border-gray-200 pt-1 font-semibold">
                              <span>Sales/Sq.Ft. delta = Rs {Math.abs(rec.math.deltaNsvLakhs)}L x 1,00,000 / {rec.math.storeSaleableArea.toLocaleString()} sft</span>
                              <span className={cn(rec.math.spsfDelta >= 0 ? 'text-green-700' : 'text-red-700')}>
                                +Rs {rec.math.spsfDelta}/Sq.Ft.
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Hierarchy Split Table */}
                        <div>
                          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
                            Option Split — {rec.segment} ({rec.newOptionCapacity} options)
                          </p>
                          <div className="grid grid-cols-6 gap-1 text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-1">
                            <div className="col-span-2">Family</div>
                            <div className="text-right">Options</div>
                            <div className="text-right">Qty</div>
                            <div className="text-right">Core / Fashion / FF</div>
                            <div className="text-right">Mix %</div>
                          </div>
                          {rec.hierarchySplit.map(h => (
                            <div key={h.family} className="grid grid-cols-6 gap-1 py-1 text-[10px] border-t border-gray-100">
                              <div className="col-span-2 text-gray-700 font-medium">{h.family}</div>
                              <div className="text-right tabular-nums text-gray-700">{h.options}</div>
                              <div className="text-right tabular-nums text-gray-600">{h.qty.toLocaleString()}</div>
                              <div className="text-right tabular-nums text-gray-500">{h.fashionGrade.corePct}/{h.fashionGrade.fashionPct}/{h.fashionGrade.ffPct}</div>
                              <div className="text-right tabular-nums text-gray-600">{h.optionsPct}%</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {/* Batch execute footer */}
          {(() => {
            const acceptedButNotExecuted = recs.filter(r => acceptedRecs.has(r.id) && !pulsePointTasks.some(t => t.recId === r.id));
            if (acceptedButNotExecuted.length === 0) return null;
            const dcReady = acceptedButNotExecuted.filter(r => r.executionPath.stockStatus === 'in-dc');
            const inPipeline = acceptedButNotExecuted.filter(r => r.executionPath.stockStatus === 'in-pipeline');
            const needsRa = acceptedButNotExecuted.filter(r => r.executionPath.stockStatus === 'needs-ra');
            return (
              <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-600 space-y-0.5">
                    {dcReady.length > 0 && <p><span className="text-green-700 font-medium">{dcReady.length}</span> ready — stock in DC, trigger replenishment</p>}
                    {inPipeline.length > 0 && <p><span className="text-amber-700 font-medium">{inPipeline.length}</span> awaiting stock in pipeline</p>}
                    {needsRa.length > 0 && <p><span className="text-orange-700 font-medium">{needsRa.length}</span> queued for next RA cycle</p>}
                  </div>
                  {dcReady.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setConfirmExec({ type: 'batch', recs: dcReady })}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700"
                    >
                      <Send className="w-3.5 h-3.5" /> Trigger DC Replenishment ({dcReady.length})
                    </button>
                  )}
                </div>
              </div>
            );
          })()}
        </div>

        {/* PulsePoint Tasks Panel */}
        {(() => {
          const storeTasks = pulsePointTasks.filter(t => t.storeId === profile.storeId);
          if (storeTasks.length === 0) return null;
          const pushedCount = storeTasks.filter(t => t.status === 'pushed').length;
          const inProgressCount = storeTasks.filter(t => t.status === 'in-progress').length;
          const completedCount = storeTasks.filter(t => t.status === 'completed').length;
          return (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <SectionHeader title={`PulsePoint Tasks (${storeTasks.length})`} subtitle="Tasks pushed to store for execution" />
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    Pushed {pushedCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    In Progress {inProgressCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    Completed {completedCount}
                  </span>
                </div>
              </div>
              <div className="divide-y divide-gray-100">
                {storeTasks.map(task => (
                  <div key={task.id} className="px-4 py-3 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900">{task.title}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        {task.description} · Assigned to {task.assignee}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={task.status === 'pushed' ? 'primary' : task.status === 'in-progress' ? 'warning' : 'success'} size="sm">
                        {task.status === 'pushed' ? 'Pushed' : task.status === 'in-progress' ? 'In Progress' : 'Completed'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </div>

      {/* ── Space Changes ── */}
      {spaceChanges.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <SectionHeader title="Space Changes" subtitle="Active and pending area modifications" />
            <NotionalBadge />
          </div>
          {spaceChanges.map(sc => {
            const delta = sc.sqftAfter - sc.sqftBefore;
            const isIncrease = delta > 0;
            const changeTypeLabel: Record<SpaceChangeType, string> = {
              'decrease': 'Space Decrease',
              'increase': 'Space Increase',
              'sis-carve-out': 'SIS Carve-out',
              'sis-reclaim': 'SIS Reclaim',
            };
            const statusVariant = sc.status === 'completed' ? 'success' : sc.status === 'in-progress' ? 'info' : sc.status === 'approved' ? 'success' : 'outline';
            return (
              <div key={sc.id} className="rounded-lg border border-gray-200 bg-white p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={isIncrease ? 'success' : 'warning'} size="sm">{changeTypeLabel[sc.changeType]}</Badge>
                    <span className="text-sm font-medium">{sc.zoneAffected}</span>
                  </div>
                  <Badge variant={statusVariant} size="sm">{sc.status}</Badge>
                </div>
                <p className="text-xs text-gray-600">{sc.reason}</p>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>{sc.sqftBefore} → {sc.sqftAfter} sqft (<span className={isIncrease ? 'text-green-700 font-medium' : 'text-amber-700 font-medium'}>{isIncrease ? '+' : ''}{delta} sqft</span>)</span>
                  <span>{sc.fixturesAffected} fixtures affected</span>
                  <span>Effective: {sc.effectiveDate}</span>
                </div>
                {sc.sisDetails && (
                  <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded px-2 py-1">
                    <span className="font-medium">SIS:</span>
                    <span>{sc.sisDetails.partnerBrand}</span>
                    <Badge variant="outline" size="sm">{sc.sisDetails.sisType}</Badge>
                    <Badge variant="outline" size="sm">{sc.sisDetails.duration}</Badge>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Execute confirmation dialog */}
      <ConfirmDialog
        open={!!confirmExec}
        onOpenChange={(open) => { if (!open) setConfirmExec(null); }}
        title={confirmExec?.type === 'batch'
          ? `Trigger DC replenishment for ${confirmExec.recs?.length} recommendations`
          : 'Trigger DC Replenishment'}
        description={confirmExec?.type === 'batch'
          ? `This will trigger stock replenishment from DC for ${confirmExec.recs?.length} recommendations at ${profile.storeName}. Once stock reaches the store, a PulsePoint task will be auto-created for the store manager (${storeManagerMap[profile.storeId] ?? 'Store Manager'}) to execute the space change.`
          : `This will trigger stock replenishment from DC for "${confirmExec?.rec?.title ?? ''}" (${confirmExec?.rec?.executionPath.dcUnitsAvailable ?? 0} units available, ${confirmExec?.rec?.executionPath.unitsNeeded ?? 0} needed). Once stock reaches ${profile.storeName} (~${confirmExec?.rec?.executionPath.etaWeeks ?? 2} weeks), a PulsePoint task will be auto-created for the store manager.`}
        confirmLabel={confirmExec?.type === 'batch' ? `Trigger Replenishment (${confirmExec.recs?.length ?? 0})` : 'Trigger Replenishment'}
        onConfirm={() => {
          if (confirmExec?.type === 'single' && confirmExec.rec) {
            onExecuteRec(confirmExec.rec);
            toast.success(`DC replenishment triggered for ${profile.storeName} — ETA ${confirmExec.rec.executionPath.etaWeeks ?? 2} weeks`, 'Replenishment');
          } else if (confirmExec?.type === 'batch' && confirmExec.recs) {
            onExecuteAll(confirmExec.recs);
            toast.success(`DC replenishment triggered for ${confirmExec.recs.length} recommendations at ${profile.storeName}`, 'Replenishment');
          }
          setConfirmExec(null);
        }}
      />
    </div>
  );
}

// ─── Hit Plan View (commented out — 12-hit cadence replaces seasonal planning) ─
// HitPlanView will replace SeasonPlanView with monthly hit-based cadence.
// Keeping the code for reference until the hit-based view is built.

/*
function SeasonPlanView({ stores, recs }: { stores: StoreSpaceProfile[]; recs: SpaceRecommendation[] }) {
  const draft = stores.filter((s) => s.planStatus === 'draft').length;
  const reviewed = stores.filter((s) => s.planStatus === 'reviewed').length;
  const locked = stores.filter((s) => s.planStatus === 'locked').length;
  const totalAopTarget = stores.reduce((s, p) => s + p.aopTargetCr, 0);
  const totalAopRunRate = stores.reduce((s, p) => s + p.aopRunRateCr, 0);
  const networkGapPct = totalAopTarget > 0 ? Math.round(((totalAopRunRate - totalAopTarget) / totalAopTarget) * 100 * 10) / 10 : 0;

  return (
    <div className="space-y-4">
      <SectionHeader title="AW26 Season Plan" subtitle="Network-wide plan status and aggregate projections" />

      <MetricGrid>
        <MetricCard label="Plans Draft" value={draft} icon={Clock} iconColor="warning" subtitle={`${draft} stores need planning`} status={draft > 5 ? 'warning' : 'on-track'} />
        <MetricCard label="Plans Reviewed" value={reviewed} icon={FileCheck} iconColor="info" subtitle="Awaiting final lock" />
        <MetricCard label="Plans Locked" value={locked} icon={Lock} iconColor="success" subtitle="Ready for execution" status={locked > 0 ? 'on-track' : 'warning'} />
        <MetricCard label="Network AOP Gap" value={`${networkGapPct}%`} icon={Target} iconColor={networkGapPct >= 0 ? 'success' : 'error'} subtitle={`Rs ${totalAopRunRate.toFixed(1)} Cr / Rs ${totalAopTarget.toFixed(1)} Cr`} status={networkGapPct >= -5 ? 'on-track' : 'critical'} />
      </MetricGrid>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <DataTable>
          <DataTableHeader>
            <DataTableHead>Store</DataTableHead>
            <DataTableHead className="text-right">AOP Target</DataTableHead>
            <DataTableHead className="text-right">Run Rate</DataTableHead>
            <DataTableHead className="text-right">Gap</DataTableHead>
            <DataTableHead className="text-right">Pending Actions</DataTableHead>
            <DataTableHead className="text-center">Status</DataTableHead>
          </DataTableHeader>
          <DataTableBody>
            {stores.map((s) => {
              const gap = s.aopTargetCr > 0 ? Math.round(((s.aopRunRateCr - s.aopTargetCr) / s.aopTargetCr) * 100 * 10) / 10 : 0;
              const storeRecs = recs.filter((r) => r.storeId === s.storeId).length;
              const plan = planStatusBadge(s.planStatus);
              return (
                <DataTableRow key={s.storeId}>
                  <DataTableCell>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{s.storeName}</p>
                      <p className="text-xs text-gray-500">{s.city} · Grade {s.grade}</p>
                    </div>
                  </DataTableCell>
                  <DataTableCell className="text-right text-sm text-gray-700 tabular-nums">Rs {s.aopTargetCr} Cr</DataTableCell>
                  <DataTableCell className="text-right text-sm text-gray-700 tabular-nums">Rs {s.aopRunRateCr} Cr</DataTableCell>
                  <DataTableCell className="text-right">
                    <span className={cn('text-xs font-medium tabular-nums', gap >= 0 ? 'text-green-700' : gap >= -10 ? 'text-amber-700' : 'text-red-700')}>
                      {gap >= 0 ? '+' : ''}{gap}%
                    </span>
                  </DataTableCell>
                  <DataTableCell className="text-right">
                    {storeRecs > 0 ? <Badge variant="warning" size="sm">{storeRecs}</Badge> : <span className="text-xs text-gray-400">--</span>}
                  </DataTableCell>
                  <DataTableCell className="text-center">
                    <Badge variant={plan.variant} size="sm">{plan.label}</Badge>
                  </DataTableCell>
                </DataTableRow>
              );
            })}
          </DataTableBody>
        </DataTable>
      </div>
    </div>
  );
}
*/

// ─── Sub-components ───────────────────────────────────────────────────────────

function EfficiencyIndicator({ efficiency }: { efficiency: number }) {
  const color = efficiency >= 1.05 ? 'text-green-700' : efficiency <= 0.85 ? 'text-red-700' : 'text-gray-400';
  const Icon = efficiency >= 1.05 ? ArrowUpRight : efficiency <= 0.85 ? ArrowDownRight : ArrowRight;
  return (
    <div className={cn('flex items-center gap-0.5 w-20 justify-end', color)} title={`Rev/Space ratio: ${efficiency.toFixed(2)}x — segment earns ${Math.round((efficiency - 1) * 100)}% ${efficiency >= 1 ? 'more' : 'less'} revenue than the space it uses`}>
      <Icon className="w-3 h-3" />
      <span className="text-[10px] tabular-nums">{efficiency.toFixed(2)}x</span>
    </div>
  );
}

// ─── Network Analysis (merged Segment + Geography views) ──────────────────────

type HierarchyLevel = 'overall' | 'zone' | 'cluster' | 'city';
type NetworkView = 'segment' | 'geography';

function NetworkAnalysis({
  stores,
  recs,
  onSelectStore,
}: {
  stores: StoreSpaceProfile[];
  recs: SpaceRecommendation[];
  onSelectStore: (id: string) => void;
}) {
  const [view, setView] = useState<NetworkView>('segment');
  const [level, setLevel] = useState<HierarchyLevel>('overall');
  const [path, setPath] = useState<{ zone?: string; cluster?: string; city?: string }>({});

  // ── Segment view data (filtered by stores prop from format filter) ──
  const storeIds = useMemo(() => stores.map(s => s.storeId), [stores]);
  const aggregates = useMemo(() => getNetworkSegmentAggregates(storeIds), [storeIds]);

  // ── Geography view data ──
  const filteredStores = useMemo(() => {
    let result = stores;
    if (path.zone) result = result.filter((s) => s.zone === path.zone);
    if (path.cluster) result = result.filter((s) => s.cluster === path.cluster);
    if (path.city) result = result.filter((s) => s.city === path.city);
    return result;
  }, [stores, path]);

  function aggregate(group: StoreSpaceProfile[]) {
    const storeIds = new Set(group.map((s) => s.storeId));
    const recCount = recs.filter((r) => storeIds.has(r.storeId)).length;
    const avgSpsf = group.length > 0 ? Math.round(group.reduce((s, p) => s + p.spsf, 0) / group.length) : 0;
    const avgGmrof = group.length > 0 ? Math.round(group.reduce((s, p) => s + p.gmrof, 0) / group.length) : 0;
    const avgUtil = group.length > 0 ? Math.round((group.reduce((s, p) => s + p.fixtureUtilization, 0) / group.length) * 10) / 10 : 0;
    const totalArea = group.reduce((s, p) => s + p.saleableArea, 0);
    return { count: group.length, avgSpsf, avgGmrof, avgUtil, recCount, totalArea };
  }

  const groups = useMemo(() => {
    if (level === 'overall') {
      const zones = [...new Set(filteredStores.map((s) => s.zone))].sort();
      return zones.map((zone) => {
        const group = filteredStores.filter((s) => s.zone === zone);
        return { key: zone, label: `${zone} Zone`, ...aggregate(group) };
      });
    }
    if (level === 'zone') {
      const clusters = [...new Set(filteredStores.map((s) => s.cluster))].sort();
      return clusters.map((cluster) => {
        const group = filteredStores.filter((s) => s.cluster === cluster);
        return { key: cluster, label: cluster, ...aggregate(group) };
      });
    }
    if (level === 'cluster') {
      const cities = [...new Set(filteredStores.map((s) => s.city))].sort();
      return cities.map((city) => {
        const group = filteredStores.filter((s) => s.city === city);
        return { key: city, label: city, ...aggregate(group) };
      });
    }
    return filteredStores.map((s) => ({
      key: s.storeId, label: s.storeName, count: 1,
      avgSpsf: s.spsf, avgGmrof: s.gmrof, avgUtil: s.fixtureUtilization,
      recCount: recs.filter((r) => r.storeId === s.storeId).length,
      totalArea: s.saleableArea,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, filteredStores, recs]);

  const totals = useMemo(() => aggregate(filteredStores), [filteredStores, recs]); // eslint-disable-line react-hooks/exhaustive-deps

  function drillDown(key: string) {
    if (level === 'overall') { setPath({ zone: key }); setLevel('zone'); }
    else if (level === 'zone') { setPath((p) => ({ ...p, cluster: key })); setLevel('cluster'); }
    else if (level === 'cluster') { setPath((p) => ({ ...p, city: key })); setLevel('city'); }
    else { onSelectStore(key); }
  }

  function goToLevel(target: HierarchyLevel) {
    if (target === 'overall') { setPath({}); setLevel('overall'); }
    else if (target === 'zone') { setPath({ zone: path.zone }); setLevel('zone'); }
    else if (target === 'cluster') { setPath({ zone: path.zone, cluster: path.cluster }); setLevel('cluster'); }
  }

  const breadcrumbs: { label: string; level: HierarchyLevel }[] = [{ label: 'All Stores', level: 'overall' }];
  if (path.zone) breadcrumbs.push({ label: `${path.zone} Zone`, level: 'zone' });
  if (path.cluster) breadcrumbs.push({ label: path.cluster, level: 'cluster' });
  if (path.city) breadcrumbs.push({ label: path.city, level: 'city' });

  const nextLevelLabel = level === 'overall' ? 'Zone' : level === 'zone' ? 'Cluster' : level === 'cluster' ? 'City' : 'Store';

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <SectionHeader title="Network Analysis" subtitle={view === 'segment' ? `Segment performance across ${stores.length} stores` : 'Overall → Zone → Cluster → City → Store'} />
        <FilterPills
          value={view}
          onChange={(v) => { setView(v as NetworkView); if (v === 'geography') { setLevel('overall'); setPath({}); } }}
          options={[
            { value: 'segment', label: 'By Segment' },
            { value: 'geography', label: 'By Geography' },
          ]}
        />
      </div>

      {view === 'segment' ? (
        /* ── Segment view ── */
        <DataTable>
          <DataTableHeader>
            <DataTableHead>Segment</DataTableHead>
            <DataTableHead className="text-right">Underperforming</DataTableHead>
            <DataTableHead className="text-right">Avg Space %</DataTableHead>
            <DataTableHead className="text-right">Avg Net Sales %</DataTableHead>
            <DataTableHead className="text-right">Efficiency</DataTableHead>
            <DataTableHead className="text-right">Avg <KpiLabel abbr="GMROF" /></DataTableHead>
            <DataTableHead className="text-right">Sell-Thru</DataTableHead>
            <DataTableHead className="text-right">Aged %</DataTableHead>
            <DataTableHead className="text-right">Private Label %</DataTableHead>
            <DataTableHead>Top Store</DataTableHead>
          </DataTableHeader>
          <DataTableBody>
            {aggregates.map((seg) => (
              <DataTableRow key={seg.segmentCode}>
                <DataTableCell>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{seg.segment}</p>
                  </div>
                </DataTableCell>
                <DataTableCell className="text-right text-sm tabular-nums">
                  <span className={seg.underperformingStores > 0 ? 'text-red-700 font-medium' : 'text-gray-500'}>{seg.underperformingStores}</span>
                  <span className="text-gray-400 text-xs"> / {seg.totalStores}</span>
                </DataTableCell>
                <DataTableCell className="text-right text-sm tabular-nums text-gray-700">{seg.avgSpacePct}%</DataTableCell>
                <DataTableCell className="text-right text-sm tabular-nums text-gray-700">{seg.avgNsvPct}%</DataTableCell>
                <DataTableCell className="text-right text-sm tabular-nums text-gray-700">{seg.avgEfficiency.toFixed(2)}x</DataTableCell>
                <DataTableCell className="text-right text-sm tabular-nums font-medium text-gray-900">Rs {seg.avgGmrof}</DataTableCell>
                <DataTableCell className="text-right">
                  <span className={cn('text-xs tabular-nums font-medium', seg.avgSellThruPct >= 65 ? 'text-green-700' : 'text-amber-700')}>{seg.avgSellThruPct}%</span>
                </DataTableCell>
                <DataTableCell className="text-right">
                  <span className={cn('text-xs tabular-nums', seg.avgAgedStockPct <= 10 ? 'text-gray-500' : 'text-red-700')}>{seg.avgAgedStockPct}%</span>
                </DataTableCell>
                <DataTableCell className="text-right text-xs tabular-nums text-gray-700">{seg.avgPlPct}%</DataTableCell>
                <DataTableCell>
                  <p className="text-xs text-gray-600 truncate max-w-[120px]">{seg.topStore}</p>
                </DataTableCell>
              </DataTableRow>
            ))}
          </DataTableBody>
        </DataTable>
      ) : (
        /* ── Geography view ── */
        <>
          {/* Breadcrumb */}
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-center gap-1 text-xs">
            {breadcrumbs.map((bc, i) => (
              <span key={bc.level} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="w-3 h-3 text-gray-400" />}
                {i < breadcrumbs.length - 1 ? (
                  <button type="button" className="text-indigo-600 hover:underline" onClick={() => goToLevel(bc.level)}>
                    {bc.label}
                  </button>
                ) : (
                  <span className="font-medium text-gray-700">{bc.label}</span>
                )}
              </span>
            ))}
          </div>

          {/* Summary row */}
          <div className="px-4 py-2 border-b border-gray-100 flex items-center gap-6 text-xs text-gray-600">
            <span><span className="font-semibold text-gray-900">{totals.count}</span> stores</span>
            <span>Avg Sales/Sq.Ft. <span className="font-semibold text-gray-900">Rs {totals.avgSpsf}</span></span>
            <span>Avg GM Return on Footage <span className="font-semibold text-gray-900">Rs {totals.avgGmrof}</span></span>
            <span>Avg Util <span className="font-semibold text-gray-900">{totals.avgUtil}%</span></span>
            <span>Total Area <span className="font-semibold text-gray-900">{totals.totalArea.toLocaleString()} sft</span></span>
            {totals.recCount > 0 && (
              <Badge variant="warning" size="sm">{totals.recCount} rec{totals.recCount > 1 ? 's' : ''}</Badge>
            )}
          </div>

          {/* Groups table */}
          {groups.length === 0 ? (
            <div className="px-4 py-8">
              <EmptyState
                icon={MapPin}
                title={`No ${nextLevelLabel.toLowerCase()}s found`}
                description="No stores exist at this level of the hierarchy. Navigate back to see available regions."
              />
            </div>
          ) : (
            <DataTable>
              <DataTableHeader>
                <DataTableHead>{nextLevelLabel}</DataTableHead>
                <DataTableHead className="text-right">Stores</DataTableHead>
                <DataTableHead className="text-right">Total Area</DataTableHead>
                <DataTableHead className="text-right">Avg <KpiLabel abbr="SPSF" /></DataTableHead>
                <DataTableHead className="text-right">Avg <KpiLabel abbr="GMROF" /></DataTableHead>
                <DataTableHead className="text-right">Fixture Util.</DataTableHead>
                <DataTableHead className="text-right">Recs</DataTableHead>
                <DataTableHead></DataTableHead>
              </DataTableHeader>
              <DataTableBody>
                {groups.map((g) => (
                  <DataTableRow key={g.key} className="cursor-pointer hover:bg-gray-50" onClick={() => drillDown(g.key)}>
                    <DataTableCell>
                      <div className="flex items-center gap-2">
                        {level === 'city' ? <Store className="w-3.5 h-3.5 text-gray-400 shrink-0" /> : <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />}
                        <span className="text-sm font-medium text-gray-900">{g.label}</span>
                      </div>
                    </DataTableCell>
                    <DataTableCell className="text-right text-sm tabular-nums text-gray-700">{g.count}</DataTableCell>
                    <DataTableCell className="text-right text-sm tabular-nums text-gray-700">{g.totalArea.toLocaleString()} sft</DataTableCell>
                    <DataTableCell className="text-right">
                      <span className="text-sm font-semibold text-gray-900 tabular-nums">Rs {g.avgSpsf}</span>
                    </DataTableCell>
                    <DataTableCell className="text-right text-sm tabular-nums text-gray-700">Rs {g.avgGmrof}</DataTableCell>
                    <DataTableCell className="text-right">
                      <span className={cn('text-xs tabular-nums', g.avgUtil >= 75 ? 'text-green-700' : g.avgUtil >= 65 ? 'text-amber-700' : 'text-red-700')}>
                        {g.avgUtil}%
                      </span>
                    </DataTableCell>
                    <DataTableCell className="text-right">
                      {g.recCount > 0 ? (
                        <Badge variant="warning" size="sm">{g.recCount}</Badge>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </DataTableCell>
                    <DataTableCell className="text-right">
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </DataTableCell>
                  </DataTableRow>
                ))}
              </DataTableBody>
            </DataTable>
          )}
        </>
      )}
    </div>
  );
}

