import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  EmptyState,
  Input,
  PageHeader,
  PageSkeleton,
} from '@/components/ui';
import { useToast } from '@/hooks/useToast';
import { cn, formatDateTime } from '@/lib/utils';
import { AlertTriangle, CheckCircle2, Loader2, Lock, XCircle } from 'lucide-react';
import {
  adminConfigKeys,
  parseAdminApiError,
  useAdminConfig,
  useAdminRunStatus,
  useSaveAdminConfig,
  type AdminConfigSections,
  type AdminRunStatus,
} from '../api/adminConfigApi';
import { useAdminConfigStore, type AdminTabId } from '../stores/useAdminConfigStore';
import { tabHasErrors } from '../components/admin/adminConfigHelpers';
import { PlanningParametersTab } from '../components/admin/PlanningParametersTab';
import { DeductionRulesTab } from '../components/admin/DeductionRulesTab';
import { EfficiencyBandsTab } from '../components/admin/EfficiencyBandsTab';
import { FixtureCapacityTab } from '../components/admin/FixtureCapacityTab';
import { FloorPlacementTab } from '../components/admin/FloorPlacementTab';
import { PodMasterTab } from '../components/admin/PodMasterTab';
import { CategoryMinimumsTab } from '../components/admin/CategoryMinimumsTab';
import { FormatsScopeTab } from '../components/admin/FormatsScopeTab';
import { SeasonWindowsTab } from '../components/admin/SeasonWindowsTab';
import { MappingsTab } from '../components/admin/MappingsTab';
import { OverridesTab } from '../components/admin/OverridesTab';
import { VersionsRunsTab } from '../components/admin/VersionsRunsTab';

interface TabDef {
  id: AdminTabId;
  label: string;
  /** Persisted now, read by the engine only after migration 006 (§2.2). */
  pendingEngine?: boolean;
}

const TABS: TabDef[] = [
  { id: 'planning_parameters', label: 'Planning Parameters', pendingEngine: true },
  { id: 'deduction_rules', label: 'Deduction Rules', pendingEngine: true },
  { id: 'efficiency_bands', label: 'Efficiency Bands' },
  { id: 'fixture_capacity', label: 'Fixture Capacity' },
  { id: 'floor_placement', label: 'Floor Placement' },
  { id: 'pod_master', label: 'Pod Master' },
  { id: 'category_min_space', label: 'Category Minimums', pendingEngine: true },
  { id: 'format_category', label: 'Formats & Scope' },
  { id: 'season_windows', label: 'Season Windows' },
  { id: 'mappings', label: 'Mappings' },
  { id: 'overrides', label: 'Overrides', pendingEngine: true },
  { id: 'versions', label: 'Versions & Runs' },
];

// sections that live inside another tab's UI — their dirty state lights that tab
const TAB_EXTRA_SECTIONS: Partial<Record<string, (keyof AdminConfigSections)[]>> = {
  planning_parameters: ['lft_options', 'rounding_rule'],
};

// tabs that stay interactive while a run locks config editing
const LOCK_EXEMPT_TABS: AdminTabId[] = ['versions', 'overrides'];

// every version must say what changed (server enforces the same rule)
const MIN_DESCRIPTION_LEN = 10;

/** Top-of-page strip: previous run result + the global edit lock message. */
function RunStatusBanner({ status }: { status: AdminRunStatus | undefined }): React.ReactNode {
  if (!status) return null;
  const run = status.last_run;

  return (
    <div className="space-y-2">
      {status.test_mode && (
        <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs text-blue-700">
          Test mode — save-triggered runs are limited to store{' '}
          {status.test_stores ?? '—'} (full-universe runs disabled until test mode is off).
        </div>
      )}
      {status.locked && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          <Lock className="w-4 h-4 shrink-0" />
          <span>
            Config editing is <span className="font-semibold">blocked for all users</span> while
            the space-plan run triggered by {run?.triggered_by ?? 'another user'}
            {run ? ` (started ${formatDateTime(run.triggered_at)})` : ''} is in progress —
            editing reopens as soon as it completes.
          </span>
        </div>
      )}
      {/* run result is shown only during the lock window; once editing
          reopens the strip disappears (full history lives in Versions & Runs) */}
      {run && status.locked && (
        <div
          className={cn(
            'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm',
            run.status === 'succeeded' && 'border-green-200 bg-green-50 text-green-800',
            run.status === 'failed' && 'border-red-200 bg-red-50 text-red-700',
            run.status !== 'succeeded' &&
              run.status !== 'failed' &&
              'border-gray-200 bg-gray-50 text-gray-700',
          )}
        >
          {run.status === 'succeeded' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : run.status === 'failed' ? (
            <XCircle className="w-4 h-4 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          )}
          <span>
            Previous run {run.status ?? 'status unknown'}
            {run.config_version !== null && ` (config v${run.config_version})`}
            {' · triggered by '}
            {run.triggered_by ?? '—'}
            {run.finished_at
              ? ` · finished ${formatDateTime(run.finished_at)}`
              : ` · started ${formatDateTime(run.triggered_at)}`}
          </span>
        </div>
      )}
      {run && status.locked && run.status && !['succeeded', 'failed'].includes(run.status) && (
        <div className="flex items-center gap-2 px-3 text-xs text-gray-500">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Run {run.run_ref ?? ''} in progress — status refreshes automatically.
        </div>
      )}
    </div>
  );
}

function TabContent({ tab }: { tab: AdminTabId }): React.ReactNode {
  switch (tab) {
    case 'planning_parameters':
      return <PlanningParametersTab />;
    case 'deduction_rules':
      return <DeductionRulesTab />;
    case 'efficiency_bands':
      return <EfficiencyBandsTab />;
    case 'fixture_capacity':
      return <FixtureCapacityTab />;
    case 'floor_placement':
      return <FloorPlacementTab />;
    case 'pod_master':
      return <PodMasterTab />;
    case 'category_min_space':
      return <CategoryMinimumsTab />;
    case 'format_category':
      return <FormatsScopeTab />;
    case 'season_windows':
      return <SeasonWindowsTab />;
    case 'mappings':
      return <MappingsTab />;
    case 'overrides':
      return <OverridesTab />;
    case 'versions':
      return <VersionsRunsTab />;
    default:
      return null;
  }
}

export function AdminSpacePlanningConfigPage(): React.ReactNode {
  const configQuery = useAdminConfig();
  const saveMutation = useSaveAdminConfig();
  const queryClient = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToast();

  const hydratedVersion = useAdminConfigStore((s) => s.hydratedVersion);
  const versionInfo = useAdminConfigStore((s) => s.versionInfo);
  const draft = useAdminConfigStore((s) => s.draft);
  const dirty = useAdminConfigStore((s) => s.dirty);
  const anyDirty = useAdminConfigStore((s) => s.anyDirty);
  const fieldErrors = useAdminConfigStore((s) => s.fieldErrors);
  const hydrate = useAdminConfigStore((s) => s.hydrate);
  const discard = useAdminConfigStore((s) => s.discard);
  const setFieldErrors = useAdminConfigStore((s) => s.setFieldErrors);

  const [activeTab, setActiveTab] = useState<AdminTabId>('planning_parameters');
  const [saveOpen, setSaveOpen] = useState(false);
  const [description, setDescription] = useState('');

  const runStatusQuery = useAdminRunStatus();
  const runLocked = runStatusQuery.data?.locked === true;
  const editingLocked = runLocked && !LOCK_EXEMPT_TABS.includes(activeTab);

  const data = configQuery.data;
  useEffect(() => {
    // Rehydrate whenever the server has a version we haven't loaded — first
    // load, after a save, and after a 409-triggered refetch (reload-discard).
    if (data && data.version.version !== hydratedVersion) {
      hydrate(data);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hydrate is a stable store action
  }, [data, hydratedVersion]);

  const handleSave = (): void => {
    if (!draft || !versionInfo) return;
    saveMutation.mutate(
      { expected_version: versionInfo.version, description: description.trim(), ...draft },
      {
        onSuccess: (res) => {
          setSaveOpen(false);
          setDescription('');
          if (res.run?.disabled) {
            toastSuccess(
              `Saved as version v${res.version} — space-plan run trigger is currently disabled, no run started`,
            );
          } else if (res.run && !res.run.triggered) {
            toastError(
              `Saved as v${res.version}, but the space-plan run could not be started: ${res.run.error ?? 'unknown error'}`,
              'Run not triggered',
            );
          } else {
            toastSuccess(
              res.run?.run_ref
                ? `Saved as version v${res.version} — space-plan run ${res.run.run_ref} started`
                : `Saved as version v${res.version}`,
            );
          }
        },
        onError: (e) => {
          const parsed = parseAdminApiError(e);
          if (parsed.status === 423) {
            setSaveOpen(false);
            toastError(parsed.message, 'Editing blocked');
            void queryClient.invalidateQueries({ queryKey: adminConfigKeys.runStatus() });
          } else if (parsed.status === 409) {
            setSaveOpen(false);
            toastError(parsed.message, 'Version conflict');
            // Reload-discard: refetch → hydrate effect replaces the draft.
            void queryClient.invalidateQueries({ queryKey: adminConfigKeys.config() });
          } else if (parsed.status === 422 && parsed.fieldErrors.length > 0) {
            setSaveOpen(false);
            setFieldErrors(parsed.fieldErrors);
            toastError('Validation failed — check the highlighted tabs');
          } else {
            toastError(parsed.message);
          }
        },
      },
    );
  };

  if (configQuery.isPending) {
    return <PageSkeleton />;
  }

  if (configQuery.isError) {
    const parsed = parseAdminApiError(configQuery.error);
    return (
      <div className="p-4">
        <PageHeader title="Space Planning Config" />
        <EmptyState
          title={parsed.status === 404 ? 'No config version found' : 'Failed to load config'}
          description={parsed.message}
          action={
            <Button variant="outline" onClick={() => void configQuery.refetch()}>
              Retry
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <div className="p-4 pb-0">
        <PageHeader title="Space Planning Config" />
        <p className="mt-1 text-sm text-gray-500">
          All engine parameters in one place — saves create a new immutable version and
          trigger a space-plan run
        </p>
        <div className="mt-3">
          <RunStatusBanner status={runStatusQuery.data} />
        </div>
      </div>

      <div className="flex flex-col flex-1 gap-4 p-4">
        {/* Horizontal tab bar — scrolls sideways when tabs overflow */}
        <nav
          aria-label="Config sections"
          className="flex gap-1 overflow-x-auto border-b border-gray-200 -mx-1 px-1"
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const hasError = tab.id !== 'versions' && tabHasErrors(fieldErrors, tab.id);
            const extraSections = TAB_EXTRA_SECTIONS[tab.id] ?? [];
            const isDirty =
              tab.id !== 'versions' &&
              tab.id !== 'overrides' &&
              (dirty[tab.id] === true || extraSections.some((k) => dirty[k] === true));
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-1.5 whitespace-nowrap px-3 py-2.5 text-sm border-b-2 -mb-px min-h-[44px] lg:min-h-0',
                  isActive
                    ? 'border-indigo-600 font-medium text-gray-900'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300',
                )}
              >
                <span>{tab.label}</span>
                {tab.pendingEngine && (
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"
                    title="Pending engine (migration 006)"
                  />
                )}
                {hasError ? (
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"
                    title="Has validation errors"
                  />
                ) : (
                  isDirty && (
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0"
                      title="Unsaved changes"
                    />
                  )
                )}
              </button>
            );
          })}
        </nav>

        <main
          className={cn(
            'flex-1 min-w-0 pb-20',
            // hard read-only while a run blocks editing (server enforces too)
            editingLocked && 'pointer-events-none opacity-60 select-none',
          )}
          aria-disabled={editingLocked || undefined}
        >
          <TabContent tab={activeTab} />
        </main>
      </div>

      {/* Sticky save footer */}
      <div className="sticky bottom-0 z-10 border-t border-gray-200 bg-white px-4 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="flex-1 text-sm text-gray-500 truncate">
            {versionInfo ? (
              <>
                <span className="font-medium text-gray-900">Version v{versionInfo.version}</span>
                {' · saved by '}
                {versionInfo.created_by ?? '—'}
                {versionInfo.created_at ? ` · ${formatDateTime(versionInfo.created_at)}` : ''}
                {anyDirty && <span className="ml-2 text-amber-600">unsaved changes</span>}
                {fieldErrors.length > 0 && (
                  <span className="ml-2 text-red-600">
                    {fieldErrors.length} validation issue{fieldErrors.length === 1 ? '' : 's'} —
                    check the red tabs
                  </span>
                )}
              </>
            ) : (
              '—'
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" disabled={!anyDirty || saveMutation.isPending} onClick={discard}>
              Discard
            </Button>
            <Button
              disabled={!anyDirty || fieldErrors.length > 0 || saveMutation.isPending || runLocked}
              onClick={() => setSaveOpen(true)}
            >
              {runLocked ? 'Editing blocked (run in progress)' : 'Save as new version'}
            </Button>
          </div>
        </div>
      </div>

      {/* Save dialog — description + expected_version handshake */}
      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Save as new version</DialogTitle>
            <DialogDescription>
              Creates v{versionInfo ? versionInfo.version + 1 : '?'} — the current version stays
              in history and can be inspected any time.
            </DialogDescription>
          </DialogHeader>
          <Input
            aria-label="Version description"
            placeholder="What changed and why? (required)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyDown={(e) => {
              if (
                e.key === 'Enter' &&
                !saveMutation.isPending &&
                description.trim().length >= MIN_DESCRIPTION_LEN
              ) {
                handleSave();
              }
            }}
          />
          <p
            className={cn(
              'text-xs',
              description.trim().length >= MIN_DESCRIPTION_LEN
                ? 'text-gray-400'
                : 'text-amber-600',
            )}
          >
            Every version must say what changed — minimum {MIN_DESCRIPTION_LEN} characters
            {description.trim().length > 0 &&
              description.trim().length < MIN_DESCRIPTION_LEN &&
              ` (${MIN_DESCRIPTION_LEN - description.trim().length} more needed)`}
            .
          </p>
          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => setSaveOpen(false)} disabled={saveMutation.isPending}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saveMutation.isPending || description.trim().length < MIN_DESCRIPTION_LEN}
            >
              {saveMutation.isPending ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
