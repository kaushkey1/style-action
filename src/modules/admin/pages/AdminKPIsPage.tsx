import { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Layers,
  Target,
  Activity,
  Settings2,
} from 'lucide-react';
import {
  Badge,
  Button,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Input,
  Switch,
  PageHeader,
  SectionHeader,
  EmptyState,
} from '@/components/ui';
import { fetchThresholds, updateThreshold, resetOneThreshold, updateKpiConfig, fetchKpiGroups } from '../api/thresholdApi';
import type { KpiThreshold, KpiGroupItem } from '../api/thresholdApi';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';


// ── Tab 1: KPI Groups ──

function KPIGroupsTab() {
  const [groups, setGroups] = useState<KpiGroupItem[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<KpiGroupItem | null>(null);
  const [thresholdMap, setThresholdMap] = useState<Record<string, KpiThreshold>>({});

  useEffect(() => {
    fetchKpiGroups().then(setGroups).catch(() => {});
    fetchThresholds().then((data) => {
      const map: Record<string, KpiThreshold> = {};
      for (const t of data) map[t.kpi_code] = t;
      setThresholdMap(map);
    }).catch(() => {});
  }, []);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left text-xs font-medium text-gray-500 pb-2">KPI Group Name</th>
              <th className="text-left text-xs font-medium text-gray-500 pb-2">Assigned To</th>
              <th className="text-right text-xs font-medium text-gray-500 pb-2">KPI Count</th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {groups.length === 0 ? (
              <tr><td colSpan={4}><EmptyState description="No KPI groups configured" /></td></tr>
            ) : groups.map((group) => (
              <tr
                key={group.id}
                onClick={() => setSelectedGroup(group)}
                className={cn(
                  'border-b border-gray-50 cursor-pointer transition-colors',
                  selectedGroup?.id === group.id
                    ? 'bg-primary/5'
                    : 'hover:bg-gray-50'
                )}
              >
                <td className="py-2.5 text-sm font-medium text-gray-900">{group.name}</td>
                <td className="py-2.5 text-sm text-gray-600">{group.assigned_to ?? '—'}</td>
                <td className="py-2.5 text-sm text-gray-700 text-right">
                  <Badge variant="default">{group.kpi_count}</Badge>
                </td>
                <td className="py-2.5">
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {selectedGroup && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-gray-900">{selectedGroup.name}</h3>
          </div>
          {/* eslint-disable-next-line design-system/prefer-metric-grid -- info grid, not metric cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <span className="text-xs text-gray-500">Assigned To</span>
              <p className="text-sm text-gray-900 font-medium">{selectedGroup.assigned_to ?? '—'}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500">KPI Count</span>
              <p className="text-sm text-gray-900 font-medium">{selectedGroup.kpi_count}</p>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-3">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">KPIs in this Group</h4>
            <div className="space-y-1">
              {selectedGroup.kpi_codes.length === 0 ? (
                <p className="text-sm text-gray-400">No KPIs assigned</p>
              ) : selectedGroup.kpi_codes.map((code) => {
                const kpi = thresholdMap[code];
                return (
                  <div key={code} className="flex items-center justify-between gap-2 py-1.5 px-2 rounded hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-3 h-3 text-gray-400" />
                      <span className="text-sm text-gray-900">{kpi?.display_name ?? code}</span>
                      <span className="text-xs text-gray-500 font-mono">{code}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">{kpi?.sub_domain ?? ''}</span>
                      <Badge
                        variant={kpi?.config_status === 'published' ? 'success' : 'warning'}
                        size="sm"
                      >
                        {kpi?.config_status ?? 'published'}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tab 2: Configure ──

function validateThreshold(green: number, amber: number, direction: string): string | null {
  if (green === amber) return 'Green and amber cannot be equal';
  if (direction === 'higher-is-better' && green <= amber) return 'Green must be greater than amber for this metric';
  if (direction === 'lower-is-better' && green >= amber) return 'Green must be less than amber for this metric';
  return null;
}

function ConfigureTab() {
  const [selectedKpiId, setSelectedKpiId] = useState<string | null>(null);
  const { success: toastSuccess, error: toastError } = useToast();

  const [thresholdMap, setThresholdMap] = useState<Record<string, KpiThreshold>>({});
  const [editGreen, setEditGreen] = useState<number | null>(null);
  const [editAmber, setEditAmber] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const loadThresholds = useCallback(async () => {
    try {
      const data = await fetchThresholds();
      const map: Record<string, KpiThreshold> = {};
      for (const t of data) map[t.kpi_code] = t;
      setThresholdMap(map);
    } catch {
      // thresholds unavailable — fall back to mock display
    }
  }, []);

  useEffect(() => {
    loadThresholds();
  }, [loadThresholds]);

  const pgCode = selectedKpiId;
  const pgThreshold = pgCode ? thresholdMap[pgCode] ?? null : null;

  useEffect(() => {
    if (pgThreshold) {
      setEditGreen(pgThreshold.green_value);
      setEditAmber(pgThreshold.amber_value);
    } else {
      setEditGreen(null);
      setEditAmber(null);
    }
  }, [pgThreshold, selectedKpiId]);

  const isDirty = pgThreshold != null && editGreen != null && editAmber != null &&
    (editGreen !== pgThreshold.green_value || editAmber !== pgThreshold.amber_value);
  const validationError = pgThreshold && editGreen != null && editAmber != null
    ? validateThreshold(editGreen, editAmber, pgThreshold.direction)
    : null;

  const handleSave = async (): Promise<void> => {
    if (!pgCode || editGreen == null || editAmber == null) return;
    setSaving(true);
    try {
      await updateThreshold(pgCode, editGreen, editAmber);
      toastSuccess('Threshold updated');
      await loadThresholds();
    } catch (e) {
      toastError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async (): Promise<void> => {
    if (!pgCode) return;
    setSaving(true);
    try {
      const updated = await resetOneThreshold(pgCode);
      setEditGreen(updated.green_value);
      setEditAmber(updated.amber_value);
      toastSuccess('Reset to default');
      await loadThresholds();
    } catch (e) {
      toastError(e instanceof Error ? e.message : 'Reset failed');
    } finally {
      setSaving(false);
    }
  };

  const allThresholds = Object.values(thresholdMap);

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* Left column: KPI list */}
      <div className="col-span-12 md:col-span-4">
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <SectionHeader title="KPI List" className="mb-2" />
          <div className="space-y-1 max-h-[70vh] overflow-y-auto">
            {allThresholds.length === 0 ? (
              <EmptyState description="No KPIs configured" />
            ) : allThresholds.map((kpi) => (
              <button
                key={kpi.kpi_code}
                onClick={() => setSelectedKpiId(kpi.kpi_code)}
                className={cn(
                  'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
                  selectedKpiId === kpi.kpi_code
                    ? 'bg-primary text-white font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate">{kpi.display_name}</span>
                  <Badge
                    variant={kpi.config_status === 'published' ? 'success' : 'warning'}
                    size="sm"
                    className={cn(selectedKpiId === kpi.kpi_code && 'bg-white/20 text-white')}
                  >
                    {kpi.config_status}
                  </Badge>
                </div>
                <span className={cn(
                  'text-xs',
                  selectedKpiId === kpi.kpi_code ? 'text-white/70' : 'text-gray-500'
                )}>
                  {kpi.kpi_code}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right column: KPI configuration */}
      <div className="col-span-12 md:col-span-8 space-y-4">
        {pgThreshold ? (
          <>
            {/* Identity Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <SectionHeader
                title={
                  <span className="flex items-center gap-2">
                    <Settings2 className="w-4 h-4 text-primary" />
                    Identity
                  </span>
                }
                actions={
                  <Badge variant={pgThreshold.config_status === 'published' ? 'success' : 'warning'}>
                    {pgThreshold.config_status}
                  </Badge>
                }
              />
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                <div>
                  <span className="text-xs text-gray-500">Name</span>
                  <p className="text-sm text-gray-900">{pgThreshold.display_name}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Code</span>
                  <p className="text-sm text-gray-900 font-mono">{pgThreshold.kpi_code}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Area</span>
                  <p className="text-sm text-gray-900">{pgThreshold.sub_domain ?? '—'}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Unit</span>
                  <p className="text-sm text-gray-900 capitalize">{pgThreshold.unit ?? '—'}</p>
                </div>
                {pgThreshold.formula && (
                  <div className="col-span-2">
                    <span className="text-xs text-gray-500">Formula</span>
                    <p className="text-sm text-gray-700 font-mono bg-gray-50 rounded-lg px-3 py-1.5 mt-0.5">
                      {pgThreshold.formula}
                    </p>
                  </div>
                )}
                <div>
                  <span className="text-xs text-gray-500">Direction</span>
                  <p className="text-sm text-gray-900 flex items-center gap-1">
                    {pgThreshold.direction === 'higher-is-better' ? (
                      <ArrowUpRight className="w-3 h-3 text-success" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3 text-success" />
                    )}
                    {pgThreshold.direction === 'higher-is-better' ? 'Higher is better' : 'Lower is better'}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Refresh</span>
                  <p className="text-sm text-gray-900 flex items-center gap-1">
                    <RefreshCw className="w-3 h-3 text-gray-400" />
                    {pgThreshold.refresh ?? '—'}
                  </p>
                </div>
              </div>
            </div>

            {/* Thresholds Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-gray-900">Thresholds</h3>
              </div>
              {pgThreshold && editGreen != null && editAmber != null ? (
                <>
                  {/* eslint-disable-next-line design-system/prefer-metric-grid -- threshold cards with inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-2.5 rounded-lg bg-green-50 border border-green-200">
                      <Badge variant="success" dot size="sm" className="mb-1.5">Green</Badge>
                      <Input
                        type="number"
                        value={editGreen}
                        onChange={(e) => setEditGreen(Number(e.target.value))}
                        step={pgThreshold.unit === '%' ? 0.5 : 1}
                        className={cn('text-sm h-8', validationError && 'border-red-400')}
                      />
                    </div>
                    <div className="p-2.5 rounded-lg bg-yellow-50 border border-yellow-200">
                      <Badge variant="warning" dot size="sm" className="mb-1.5">Amber</Badge>
                      <Input
                        type="number"
                        value={editAmber}
                        onChange={(e) => setEditAmber(Number(e.target.value))}
                        step={pgThreshold.unit === '%' ? 0.5 : 1}
                        className={cn('text-sm h-8', validationError && 'border-red-400')}
                      />
                    </div>
                    <div className="p-2.5 rounded-lg bg-red-50 border border-red-200">
                      <Badge variant="error" dot size="sm" className="mb-1.5">Red</Badge>
                      <p className="text-sm text-red-900 mt-1.5">
                        {pgThreshold.direction === 'higher-is-better'
                          ? `< ${editAmber}`
                          : `> ${editAmber}`}
                      </p>
                    </div>
                  </div>
                  {validationError && <p className="text-xs text-red-600 mt-2">{validationError}</p>}
                  <div className="flex items-center gap-2 mt-3">
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={!isDirty || !!validationError || saving}
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleReset} disabled={saving}>
                      Reset to Default
                    </Button>
                    {pgThreshold.green_value !== pgThreshold.default_green && (
                      <span className="text-[10px] text-gray-400">
                        Default: G={pgThreshold.default_green}, A={pgThreshold.default_amber}
                      </span>
                    )}
                  </div>
                </>
              ) : null}
            </div>

            {/* Exception Settings */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-gray-900">Exception Settings</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm text-gray-900">Exception on Amber</p>
                    <p className="text-xs text-gray-500">Severity: {pgThreshold.amber_severity}</p>
                  </div>
                  <Switch
                    checked={pgThreshold.exception_on_amber}
                    onCheckedChange={async (checked) => {
                      await updateKpiConfig(pgThreshold.kpi_code, { exception_on_amber: checked });
                      await loadThresholds();
                    }}
                  />
                </div>
                <div className="border-t border-gray-100" />
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm text-gray-900">Exception on Red</p>
                    <p className="text-xs text-gray-500">Severity: {pgThreshold.red_severity}</p>
                  </div>
                  <Switch
                    checked={pgThreshold.exception_on_red}
                    onCheckedChange={async (checked) => {
                      await updateKpiConfig(pgThreshold.kpi_code, { exception_on_red: checked });
                      await loadThresholds();
                    }}
                  />
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-center h-64">
            <p className="text-sm text-gray-500">{allThresholds.length === 0 ? 'Loading KPIs...' : 'Select a KPI to configure'}</p>
          </div>
        )}
      </div>
    </div>
  );
}


// ── Main Page ──

export function AdminKPIsPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="KPI Configuration" />

      <Tabs defaultValue="groups">
        <TabsList>
          <TabsTrigger value="groups">KPI Groups</TabsTrigger>
          <TabsTrigger value="configure">Configure</TabsTrigger>
        </TabsList>

        <TabsContent value="groups">
          <KPIGroupsTab />
        </TabsContent>

        <TabsContent value="configure">
          <ConfigureTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
