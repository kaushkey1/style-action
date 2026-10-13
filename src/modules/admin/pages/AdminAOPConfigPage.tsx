import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Input, Modal, ModalFooter, PageHeader, Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui';
import { useToast } from '@/hooks/useToast';
import { aopAdminApi, aopError } from '../api/aopAdminApi';
import { planningErrors } from '../api/aopPlanningDraft';
import { MAX_DRAFT_CELLS } from '../api/aopGridDraft';
import { useAopAdminConfig, useAopAdminContext } from '../api/useAopAdminConfig';
import { AopErrorState } from '../components/aop/AopFields';
import { AopChangeList } from '../components/aop/AopChangeList';
import { AopMetricsTab } from '../components/aop/AopMetricsTab';
import { AopParametersTab } from '../components/aop/AopParametersTab';
import { AopPlanningTab } from '../components/aop/AopPlanningTab';
import { ConfigLoadingState, SectionFooter } from '../components/shared/config/ConfigPrimitives';
import { useAopAdminDraftStore } from '../stores/useAopAdminDraftStore';
import type { AdminChannel, ChannelPlanningDefaults, Configuration, DraftChange, Preview, SaveRequest } from '../types/aopAdmin';

const TABS = [
  { id: 'parameters', label: 'Planning Parameters' }, { id: 'planning', label: 'Planning & Seasons' },
  { id: 'metrics', label: 'KPI Metrics & Formulae' },
];

export function AdminAOPConfigPage(): ReactNode {
  const context = useAopAdminContext();
  const query = useAopAdminConfig();
  return <div className="min-w-0 space-y-4"><PageHeader title="AOP Configuration" />
    {query.isPending && <ConfigLoadingState label="Loading AOP configuration…" />}
    {query.isError && <AopErrorState message={aopError(query.error)} onRetry={() => void query.refetch()} />}
    {query.data && <AopEditor key={`${context.tenantId}:${context.orgId}`} current={query.data.configuration} canWrite={query.data.can_write} channels={query.data.channels} channelTemplate={query.data.channel_defaults_template} />}
  </div>;
}

function AopEditor({ current, canWrite, channels, channelTemplate }: { current: Configuration; canWrite: boolean; channels: AdminChannel[]; channelTemplate: ChannelPlanningDefaults }): ReactNode {
  const context = useAopAdminContext();
  const client = useQueryClient();
  const toast = useToast();
  const scope = `${context.tenantId}:${context.orgId}`;
  const editorRef = useRef<HTMLDivElement>(null);
  const [historyNotice, setHistoryNotice] = useState('');
  const retained = useAopAdminDraftStore((state) => state.drafts[scope]);
  const editDraft = useAopAdminDraftStore((state) => state.edit);
  const replaceDraft = useAopAdminDraftStore((state) => state.replace);
  const editBatch = useAopAdminDraftStore((state) => state.editBatch);
  const undo = useAopAdminDraftStore((state) => state.undo);
  const redo = useAopAdminDraftStore((state) => state.redo);
  const changes = Object.fromEntries(Object.entries(retained?.changes ?? {}).filter(([, { operation }]) => {
    if (operation.op === 'set_channel_setting' || operation.op === 'add_channel') return false;
    if (operation.op === 'set_season' || operation.op === 'remove_season') return false;
    if (operation.op !== 'set_setting' || operation.section !== 'planning_settings') return true;
    const field = Array.isArray(operation.path) ? operation.path[0] : operation.path.split('.')[0];
    return !['category_allocation_defaults', 'monthly_phasing_defaults', 'channel_planning_defaults'].includes(field ?? '');
  }));
  const base = Object.keys(changes).length ? retained?.baseConfiguration ?? current : current;
  const pending = Object.values(changes);
  const [tab, setTab] = useState('parameters');
  const [isReviewOpen, setReviewOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [review, setReview] = useState<{ request: SaveRequest; preview: Preview } | null>(null);
  const preview = useMutation({ mutationFn: (request: SaveRequest) => aopAdminApi.preview(request), onSuccess: (result, request) => setReview({ request, preview: result }) });
  const save = useMutation({
    mutationFn: aopAdminApi.save,
    onSuccess: (result) => {
      replaceDraft(scope, result.configuration);
      client.setQueryData([...context.key, 'config'], { configuration: result.configuration, can_write: canWrite, channels, channel_defaults_template: channelTemplate });
      void client.invalidateQueries({ queryKey: context.key });
      setReviewOpen(false); setReview(null); setReason('');
      toast.success(result.unchanged ? 'No configuration changes to save' : 'AOP configuration saved');
    },
  });
  const rebase = useMutation({ mutationFn: aopAdminApi.config, onSuccess: (result) => {
    if (result.configuration) { replaceDraft(scope, result.configuration, changes); client.setQueryData([...context.key, 'config'], result); setReview(null); preview.reset(); save.reset(); }
  } });
  useEffect(() => {
    function historyShortcut(event: KeyboardEvent): void {
      if (!(event.ctrlKey || event.metaKey) || event.altKey || !canWrite || save.isPending) return;
      const key = event.key.toLowerCase();
      if (key !== 'z' && key !== 'y') return;
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      // Leave native text undo intact in search/reason fields and open dialogs.
      if (target.closest('[role="dialog"], textarea, [contenteditable="true"], [role="combobox"]')) return;
      if (target instanceof HTMLInputElement && target.dataset.gridRow === undefined) return;
      if (target !== document.body && !editorRef.current?.contains(target)) return;
      event.preventDefault();
      const isRedo = key === 'y' || event.shiftKey;
      const draft = useAopAdminDraftStore.getState().drafts[scope];
      const entry = (isRedo ? draft?.future : draft?.past)?.at(-1);
      if (!entry) return;
      if (isRedo) redo(scope); else undo(scope);
      setReview(null);
      setHistoryNotice(`${isRedo ? 'Restored' : 'Undone'}: ${entry.label}`);
    }
    document.addEventListener('keydown', historyShortcut);
    return () => document.removeEventListener('keydown', historyShortcut);
  }, [scope, canWrite, save.isPending, undo, redo]);
  const onChange = (change: DraftChange): void => { editDraft(scope, base, change); setReview(null); };
  const edit = { changes, onChange, disabled: !canWrite || save.isPending,
    onBatchChange: (batch: DraftChange[], label: string): void => { editBatch(scope, base, batch, label); setReview(null); },
  };
  const validationErrors = planningErrors(base, changes);
  if (pending.length > MAX_DRAFT_CELLS) validationErrors.push('Save at most 10,000 changes at a time. Undo some edits before saving.');
  const valid = pending.length > 0 && pending.every((change) => !change.error) && !validationErrors.length;
  return <div ref={editorRef} className="min-w-0 space-y-4">
    <span className="sr-only" role="status">{historyNotice}</span>
    <p className="text-xs text-gray-500">{canWrite ? 'Settings are saved for reference only and do not affect AOP plans or calculations.' : 'Read-only access'}</p>
    {base.config_id !== current.config_id && <p role="status" className="text-sm text-amber-700">The saved configuration has changed. Load it and review your pending changes before saving.</p>}
    <Tabs value={tab} onValueChange={setTab}><TabsList variant="underline" className="overflow-x-auto">{TABS.map((item) => <TabsTrigger key={item.id} value={item.id} variant="underline">{item.label}</TabsTrigger>)}</TabsList>
    <TabsContent value="parameters">
      <AopParametersTab {...edit} config={base} channels={channels} />
    </TabsContent>
    <TabsContent value="planning"><AopPlanningTab seasons={base.season_definitions} /></TabsContent>
    <TabsContent value="metrics"><AopMetricsTab {...edit} config={base} /></TabsContent></Tabs>
    {!!validationErrors.length && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{validationErrors.map((error) => <p key={error}>{error}</p>)}</div>}
    {canWrite && <SectionFooter pendingCount={pending.length} isValid={valid} isSaving={save.isPending} onSave={() => setReviewOpen(true)} onReset={() => { replaceDraft(scope, current); setReview(null); }} />}
    <Modal isOpen={isReviewOpen} onClose={() => { if (!save.isPending) setReviewOpen(false); }} title="Review AOP configuration changes" description="Review the changes and provide a reason before saving." size="full">
      <div className="space-y-4"><Input label="Reason for change" value={reason} disabled={save.isPending} onChange={(event) => { setReason(event.target.value); setReview(null); }} />
        {preview.isError && <AopErrorState message={aopError(preview.error)} />}{save.isError && <AopErrorState message={aopError(save.error)} />}
        {(save.isError || base.config_id !== current.config_id) && <Button variant="secondary" disabled={rebase.isPending} onClick={() => rebase.mutate()}>Load latest and retain pending edits</Button>}
        {rebase.isError && <AopErrorState message={aopError(rebase.error)} />}
        {review && <><p className="text-sm">{review.preview.changes.length} changes will be saved to Admin configuration.</p><AopChangeList changes={review.preview.changes} /></>}
      </div><ModalFooter><Button variant="secondary" disabled={save.isPending} onClick={() => setReviewOpen(false)}>Back to editing</Button>
        {review ? <Button disabled={save.isPending} onClick={() => save.mutate(review.request)}>{save.isPending ? 'Saving…' : 'Confirm Save'}</Button>
          : <Button disabled={!valid || reason.trim().length < 3 || preview.isPending} onClick={() => preview.mutate({ baseConfigId: base.config_id, baseVersion: base.version_no, requestId: crypto.randomUUID(), reason: reason.trim(), operations: pending.map((change) => change.operation) })}>{preview.isPending ? 'Checking…' : 'Preview changes'}</Button>}
      </ModalFooter>
    </Modal>
  </div>;
}
