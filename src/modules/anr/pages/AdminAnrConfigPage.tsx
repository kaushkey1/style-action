import { useMemo, useState } from 'react';
import {
  Badge,
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
  Textarea,
} from '@/components/ui';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import {
  parseAnrApiError,
  useAnrConfig,
  useDiscardAnrDraft,
  usePublishAnrConfig,
  useSaveAnrDraft,
  type AnrConfigTree,
  type AnrConfigValues,
  type AnrFieldError,
} from '../api/anrConfigApi';
import { ANR_CONFIG_TABS, validateAnrConfig } from '../components/anrConfigMeta';
import { AnrConfigTab } from '../components/AnrConfigTab';
import { AnrVersionsAuditTab } from '../components/AnrVersionsAuditTab';

const VERSIONS_TAB_ID = 'versions';
const MIN_REASON_LEN = 10;

function treeToValues(tree: AnrConfigTree): AnrConfigValues {
  const out: AnrConfigValues = {};
  for (const [ct, grades] of Object.entries(tree)) {
    out[ct] = {};
    for (const [fg, params] of Object.entries(grades)) {
      out[ct][fg] = {};
      for (const [key, cell] of Object.entries(params)) {
        out[ct][fg][key] = cell.value;
      }
    }
  }
  return out;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function AdminAnrConfigPage(): React.ReactNode {
  const configQuery = useAnrConfig();
  const saveDraft = useSaveAnrDraft();
  const publish = usePublishAnrConfig();
  const discardDraft = useDiscardAnrDraft();
  const { success: toastSuccess, error: toastError, info: toastInfo } = useToast();

  const [activeTab, setActiveTab] = useState<string>(ANR_CONFIG_TABS[0]?.id ?? 'replenishment');
  const [values, setValues] = useState<AnrConfigValues | null>(null);
  const [baseline, setBaseline] = useState<string>('');
  const [serverErrors, setServerErrors] = useState<AnrFieldError[]>([]);
  const [publishOpen, setPublishOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState(todayIso());

  const data = configQuery.data;

  // Hydrate editable state from the open draft (fall back to published).
  // Derived-state-during-render pattern: when the server versions change
  // (first load, after save/publish/discard), reset the editable copy.
  const [hydratedKey, setHydratedKey] = useState<string | null>(null);
  const sourceKey = data
    ? `d${data.draft?.version ?? 'x'}-p${data.published?.version ?? 'x'}`
    : null;
  if (data && sourceKey !== hydratedKey) {
    const source = data.draft ?? data.published;
    if (source) {
      const next = treeToValues(source.config);
      setValues(next);
      setBaseline(JSON.stringify(next));
      setServerErrors([]);
    }
    setHydratedKey(sourceKey);
  }

  const clientErrors = useMemo(
    () => (values ? validateAnrConfig(values) : []),
    [values],
  );
  const errors = clientErrors.length > 0 ? clientErrors : serverErrors;
  const isDirty = values !== null && JSON.stringify(values) !== baseline;
  const hasDraft = Boolean(data?.draft);
  const busy = saveDraft.isPending || publish.isPending || discardDraft.isPending;

  const handleChange = (tabId: string, grade: string, key: string, value: string): void => {
    setValues((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [tabId]: {
          ...prev[tabId],
          [grade]: { ...prev[tabId]?.[grade], [key]: value },
        },
      };
    });
    setServerErrors([]);
  };

  const handleSaveDraft = (): void => {
    if (!values) return;
    saveDraft.mutate(values, {
      onSuccess: (r) => {
        toastSuccess(`Draft v${r.version} saved`);
        setServerErrors([]);
      },
      onError: (e) => {
        const parsed = parseAnrApiError(e);
        setServerErrors(parsed.fieldErrors);
        toastError(parsed.status === 422 ? 'Validation failed — fix the highlighted fields' : parsed.message);
      },
    });
  };

  const handlePublish = (): void => {
    publish.mutate(
      { reason: reason.trim(), effective_from: effectiveFrom },
      {
        onSuccess: (r) => {
          setPublishOpen(false);
          setReason('');
          toastSuccess(
            `Published v${r.version} (${r.changedFields} field${r.changedFields === 1 ? '' : 's'} changed)`,
          );
        },
        onError: (e) => {
          const parsed = parseAnrApiError(e);
          setServerErrors(parsed.fieldErrors);
          toastError(parsed.message);
        },
      },
    );
  };

  const handleDiscard = (): void => {
    discardDraft.mutate(undefined, {
      onSuccess: (r) => {
        if (r.discarded) toastSuccess('Draft discarded');
        else toastInfo('No draft to discard');
      },
      onError: (e) => toastError(parseAnrApiError(e).message),
    });
  };

  if (configQuery.isLoading) return <PageSkeleton />;

  if (configQuery.isError || !data || !values) {
    return (
      <div className="p-4">
        <PageHeader title="AnR Config" />
        <div className="mt-6">
          <EmptyState
            title="Config unavailable"
            description="The AnR config could not be loaded. Check that the config tables are provisioned (scripts/sql/008)."
            action={
              <Button variant="outline" onClick={() => void configQuery.refetch()}>
                Retry
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  const publishedVersion = data.published?.version;
  const tabHasErrors = (tabId: string): boolean => errors.some((e) => e.tab === tabId);
  const reasonRemaining = Math.max(0, MIN_REASON_LEN - reason.trim().length);

  return (
    <div className="flex flex-col min-h-full">
      <div className="p-4 pb-0">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <PageHeader title="AnR Config" />
          <div className="flex flex-wrap items-center gap-2">
            {publishedVersion !== undefined && (
              <Badge variant="success" size="sm">Published v{publishedVersion}</Badge>
            )}
            {hasDraft && <Badge variant="warning" size="sm">Draft v{data.draft?.version} open</Badge>}
            <Badge variant="warning" size="sm" className="uppercase tracking-wide">
              Pending engine
            </Badge>
          </div>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Fashion-grade defaults for AnR V2 — save changes as a draft, then publish with a reason
          and effective date. The AnR calculator reads this config once its loader ships.
        </p>
      </div>

      <div className="flex flex-col flex-1 gap-4 p-4">
        {/* Horizontal tab bar — scrolls sideways when tabs overflow */}
        <nav
          aria-label="Config sections"
          className="flex gap-1 overflow-x-auto border-b border-gray-200 -mx-1 px-1"
        >
          {[...ANR_CONFIG_TABS.map((t) => ({ id: t.id, label: t.label })),
            { id: VERSIONS_TAB_ID, label: 'Versions & Audit' }].map((tab) => {
            const isActive = activeTab === tab.id;
            const hasError = tab.id !== VERSIONS_TAB_ID && tabHasErrors(tab.id);
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
                {hasError && (
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" title="Has validation errors" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="flex-1">
          {activeTab === VERSIONS_TAB_ID ? (
            <AnrVersionsAuditTab />
          ) : (
            (() => {
              const tab = ANR_CONFIG_TABS.find((t) => t.id === activeTab);
              return tab ? (
                <AnrConfigTab
                  tab={tab}
                  values={values}
                  errors={errors}
                  disabled={busy}
                  onChange={handleChange}
                />
              ) : null;
            })()
          )}
        </div>

        {activeTab !== VERSIONS_TAB_ID && (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-gray-200 pt-3">
            {clientErrors.length > 0 && (
              <span className="mr-auto text-sm text-red-600" role="alert">
                {clientErrors.length} validation issue{clientErrors.length === 1 ? '' : 's'} to fix
              </span>
            )}
            {hasDraft && (
              <Button variant="outline" onClick={handleDiscard} disabled={busy}>
                Discard draft
              </Button>
            )}
            <Button
              variant="outline"
              onClick={handleSaveDraft}
              disabled={busy || !isDirty || clientErrors.length > 0}
            >
              {saveDraft.isPending && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
              Save draft
            </Button>
            <Button
              onClick={() => setPublishOpen(true)}
              disabled={busy || !hasDraft || isDirty || clientErrors.length > 0}
              title={isDirty ? 'Save the draft before publishing' : undefined}
            >
              Publish…
            </Button>
          </div>
        )}
      </div>

      <Dialog open={publishOpen} onOpenChange={setPublishOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Publish draft v{data.draft?.version}</DialogTitle>
            <DialogDescription>
              Publishing freezes the draft as the live configuration. A reason and effective date
              are required and recorded in the audit log.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1" htmlFor="anr-publish-reason">
                Reason for change
              </label>
              <Textarea
                id="anr-publish-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="Why is this configuration changing?"
              />
              {reasonRemaining > 0 && (
                <p className="mt-1 text-xs text-gray-500">
                  {reasonRemaining} more character{reasonRemaining === 1 ? '' : 's'} required
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1" htmlFor="anr-publish-date">
                Effective from
              </label>
              <Input
                id="anr-publish-date"
                type="date"
                value={effectiveFrom}
                onChange={(e) => setEffectiveFrom(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPublishOpen(false)} disabled={publish.isPending}>
              Cancel
            </Button>
            <Button
              onClick={handlePublish}
              disabled={publish.isPending || reasonRemaining > 0 || !effectiveFrom}
            >
              {publish.isPending && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
              Publish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
