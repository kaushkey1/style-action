/**
 * Channel-led (Superdry) variant of the OTB Configuration screen.
 *
 * Reads the calculator-owned config (otb_config_master) and lets the child tabs
 * edit the editable fields. After a successful Save the screen offers to
 * trigger an OTB run (Temporal): on Proceed the whole admin screen is locked
 * ("Recalculating OTB…") until the backend run finishes. Reloading mid-run
 * re-locks, because the run status is queried from the backend on mount.
 */

import { useCallback, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Settings2, SlidersHorizontal } from 'lucide-react';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  EmptyState,
  ConfirmDialog,
  PageHeader,
} from '@/components/ui';
import {
  fetchOtbConfiguration,
  type OtbConfiguration,
} from '../../api/otbConfigurationApi';
import {
  triggerOtbRun,
  getOtbRunStatus,
  getActiveOtbRun,
  getLatestOtbRun,
  OtbRunConflictError,
} from '../../api/otbRunApi';
import { SuperdryParametersTab } from './SuperdryParametersTab';
import { SuperdryPlanningTab } from './SuperdryPlanningTab';
import { SuperdryKpiFormulaeTab } from './SuperdryKpiFormulaeTab';
import { otbKeys } from '@/modules/otb/api/otbDashboardApi';
import { useToast } from '@/hooks/useToast';
import { useAuthStore } from '@/hooks/useAuthStore';
import { formatDateTimeNumeric } from '@/lib/utils';

const POLL_INTERVAL_MS = 2500;

export function SuperdryOTBConfig() {
  const { success: toastSuccess, error: toastError } = useToast();
  const userEmail = useAuthStore((s) => s.user?.email ?? '');
  const tenantId = useAuthStore((s) => s.tenantId);
  const orgId = useAuthStore((s) => s.resolvedOrgId);
  const queryClient = useQueryClient();

  const [config, setConfig] = useState<OtbConfiguration | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // OTB run state. `workflowId` is set only while a run is in progress, so it
  // doubles as the "recalculating / screen locked" flag.
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [workflowId, setWorkflowId] = useState<string | null>(null);
  const isRecalculating = workflowId !== null;

  const latestRunQuery = useQuery({
    queryKey: ['otb-run-latest', tenantId, orgId],
    queryFn: getLatestOtbRun,
    refetchInterval: 30_000,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchOtbConfiguration();
        if (!cancelled) setConfig(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load OTB configuration');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Reload-awareness: if a run is already in progress for this org, re-lock and
  // resume polling. The run lives in the backend, so a page refresh is safe.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const active = await getActiveOtbRun();
        if (!cancelled && active) setWorkflowId(active.workflow_id);
      } catch {
        // Non-fatal — the screen just won't auto-lock on mount.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Quiet re-fetch after a save — keeps the loaded view mounted (no spinner)
  // and lets the child tabs rebuild their draft from the newly-saved config.
  const refresh = useCallback(async () => {
    const data = await fetchOtbConfiguration();
    setConfig(data);
  }, []);

  // A tab saved successfully → refresh, then offer to trigger a run.
  const handleSaved = useCallback(async () => {
    await refresh();
    setConfirmOpen(true);
  }, [refresh]);

  const triggerMutation = useMutation({
    mutationFn: () =>
      triggerOtbRun(userEmail, { config_version: config?.version ?? null }),
    onSuccess: (handle) => {
      setConfirmOpen(false);
      setWorkflowId(handle.workflow_id);
    },
    onError: (err) => {
      setConfirmOpen(false);
      if (err instanceof OtbRunConflictError) {
        toastError(err.message);
      } else {
        toastError(err instanceof Error ? err.message : 'Failed to start OTB run');
      }
    },
  });

  // Poll the run status while a run is in progress.
  const statusQuery = useQuery({
    queryKey: ['otb-run-status', workflowId],
    queryFn: () => getOtbRunStatus(workflowId as string),
    enabled: isRecalculating,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status && status !== 'RUNNING' ? false : POLL_INTERVAL_MS;
    },
  });

  // React to a terminal status: unlock, refresh dashboards + config, toast.
  const polledStatus = statusQuery.data?.status;
  useEffect(() => {
    if (!workflowId || !polledStatus || polledStatus === 'RUNNING') return;

    if (polledStatus === 'COMPLETED') {
      toastSuccess('OTB run complete — results have been updated.');
      queryClient.invalidateQueries({ queryKey: otbKeys.all });
      // Describe is authoritative immediately; visibility indexing can lag.
      if (statusQuery.data?.completed_at) {
        queryClient.setQueryData(['otb-run-latest', tenantId, orgId], statusQuery.data);
      } else {
        void queryClient.invalidateQueries({ queryKey: ['otb-run-latest', tenantId, orgId] });
      }
      void refresh();
    } else {
      toastError(`OTB run ${polledStatus.toLowerCase().replace('_', ' ')}.`);
    }
    setWorkflowId(null);
  }, [polledStatus, workflowId, queryClient, refresh, toastSuccess, toastError, statusQuery.data, tenantId, orgId]);

  const header = (
    <PageHeader
      title="OTB Configuration"
      className="[&>div:first-child]:flex-wrap"
      actions={
        <div className="flex flex-col gap-1" aria-live="polite">
          <div className="flex items-center gap-2" title="Last configuration update (local time)">
            <Settings2 className="w-4 h-4 text-gray-400" aria-hidden="true" />
            <span className="text-xs text-gray-500">
              Last config updated: {loading ? 'Loading…' : error ? 'Unavailable' : formatDateTimeNumeric(config?.updated_at)}
            </span>
          </div>
          <div className="flex items-center gap-2" title="Latest successful OTB run (local time)">
            <Settings2 className="w-4 h-4 text-gray-400" aria-hidden="true" />
            <span className="text-xs text-gray-500">
              Last OTB run performed: {latestRunQuery.isPending ? 'Loading…' : latestRunQuery.isError ? 'Unavailable' : formatDateTimeNumeric(latestRunQuery.data?.completed_at)}
            </span>
          </div>
        </div>
      }
    />
  );

  if (loading) {
    return (
      <div className="space-y-4">
        {header}
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        {header}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="space-y-4">
        {header}
        <div className="bg-white rounded-lg border border-gray-200">
          <EmptyState
            icon={SlidersHorizontal}
            title="No OTB configuration"
            description="This organisation has no active OTB configuration row."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {header}
      {isRecalculating && (
        <div
          role="status"
          aria-live="polite"
          className="sticky top-0 z-20 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3"
        >
          <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-amber-600" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Recalculating OTB… Please wait!</p>
            <p className="text-xs text-amber-700">
              You cannot make changes to the admin screen while a calculation is in progress.
            </p>
          </div>
        </div>
      )}

      {/* React 19 `inert` fully disables interaction/focus within while a run is
          in progress — no per-tab changes needed. */}
      <div inert={isRecalculating || undefined} className={isRecalculating ? 'opacity-60' : undefined}>
        <Tabs defaultValue="parameters">
          <TabsList variant="underline">
            <TabsTrigger value="parameters" variant="underline">Parameters</TabsTrigger>
            <TabsTrigger value="planning" variant="underline">Planning</TabsTrigger>
            <TabsTrigger value="kpi-formulae" variant="underline">KPI Formulae</TabsTrigger>
          </TabsList>

          <TabsContent value="parameters">
            <SuperdryParametersTab key={config.version ?? 'v'} config={config} onSaved={handleSaved} />
          </TabsContent>
          <TabsContent value="planning">
            <SuperdryPlanningTab key={config.version ?? 'v'} config={config} onSaved={handleSaved} />
          </TabsContent>
          <TabsContent value="kpi-formulae">
            <SuperdryKpiFormulaeTab config={config} />
          </TabsContent>
        </Tabs>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Do you want to trigger an OTB run?"
        description="This recalculates OTB from the configuration you just saved. While the run is in progress the admin screen will be locked and you won't be able to make changes until it finishes."
        confirmLabel="Proceed"
        cancelLabel="Cancel"
        onConfirm={() => triggerMutation.mutate()}
        confirmDisabled={triggerMutation.isPending}
      />
    </div>
  );
}
