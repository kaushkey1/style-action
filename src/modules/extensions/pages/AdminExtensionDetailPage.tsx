import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ExternalLink, Trash2 } from 'lucide-react';
import {
  PageHeader,
  Button,
  Switch,
  Input,
  Spinner,
  EmptyState,
  ConfirmDialog,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui';
import { useExtensionStore } from '../stores/useExtensionStore';
import { ExtensionStatusBadge } from '../components/ExtensionStatusBadge';
import { SubscriptionManager } from '../components/SubscriptionManager';
import { DatasetConfigList } from '../components/DatasetConfigList';
import { QueryLogTable } from '../components/QueryLogTable';

type DetailTab = 'overview' | 'subscriptions' | 'datasets' | 'logs';

export function AdminExtensionDetailPage(): React.ReactNode {
  const { extensionSlug } = useParams<{ extensionSlug: string }>();
  const navigate = useNavigate();

  const detail = useExtensionStore((s) => s.detail);
  const detailLoading = useExtensionStore((s) => s.detailLoading);
  const detailError = useExtensionStore((s) => s.detailError);
  const saving = useExtensionStore((s) => s.saving);
  const fetchDetail = useExtensionStore((s) => s.fetchDetail);
  const toggle = useExtensionStore((s) => s.toggle);
  const uninstall = useExtensionStore((s) => s.uninstall);
  const updateExtension = useExtensionStore((s) => s.updateExtension);
  const resetDetail = useExtensionStore((s) => s.resetDetail);

  const [activeTab, setActiveTab] = useState<DetailTab>('overview');
  const [showUninstall, setShowUninstall] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookDirty, setWebhookDirty] = useState(false);

  useEffect(() => {
    if (extensionSlug) {
      void fetchDetail(extensionSlug);
    }
    return () => resetDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only: actions are stable
  }, [extensionSlug]);

  useEffect(() => {
    if (detail) {
      setWebhookUrl(detail.webhook_url);
      setWebhookDirty(false);
    }
  }, [detail]);

  const handleToggle = useCallback(async () => {
    if (!extensionSlug) return;
    try {
      await toggle(extensionSlug);
    } catch {
      // error in store
    }
  }, [extensionSlug, toggle]);

  const handleUninstall = useCallback(async () => {
    if (!extensionSlug) return;
    try {
      await uninstall(extensionSlug);
      navigate('/admin/extensions');
    } catch {
      // error in store
    }
  }, [extensionSlug, uninstall, navigate]);

  const handleWebhookSave = useCallback(async () => {
    if (!extensionSlug || !webhookDirty) return;
    try {
      await updateExtension(extensionSlug, { webhook_url: webhookUrl });
      setWebhookDirty(false);
    } catch {
      // error in store
    }
  }, [extensionSlug, webhookUrl, webhookDirty, updateExtension]);

  if (detailLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner className="w-6 h-6" />
      </div>
    );
  }

  if (detailError) {
    return (
      <div className="p-4">
        <EmptyState
          description={detailError}
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => extensionSlug && void fetchDetail(extensionSlug)}
            >
              Retry
            </Button>
          }
        />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="p-4">
        <EmptyState description="Extension not found." />
      </div>
    );
  }

  const slug = extensionSlug ?? detail.extension.slug;

  return (
    <>
      <PageHeader
        backTo={{ label: 'Extensions', path: '/admin/extensions' }}
        title={detail.extension.name}
        badges={<ExtensionStatusBadge status={detail.status} />}
        actions={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">
                {detail.status === 'enabled' ? 'Enabled' : 'Disabled'}
              </span>
              <Switch
                checked={detail.status === 'enabled'}
                onCheckedChange={handleToggle}
                disabled={saving}
                aria-label="Toggle extension"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowUninstall(true)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Uninstall
            </Button>
          </div>
        }
      />

      <div className="p-4 space-y-6">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as DetailTab)}>
          <TabsList variant="underline">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
            <TabsTrigger value="datasets">Datasets</TabsTrigger>
            <TabsTrigger value="logs">Query Log</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="space-y-6 pt-4">
              <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoField label="Slug" value={detail.extension.slug} mono />
                  <InfoField label="Version" value={`v${detail.extension.version}`} />
                  <InfoField label="Provider" value={detail.extension.provider ?? '—'} />
                  <InfoField label="Installed" value={new Date(detail.installed_at).toLocaleDateString()} />
                </div>
                {detail.extension.description && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Description</p>
                    <p className="text-sm text-gray-700">{detail.extension.description}</p>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
                <p className="text-sm font-medium text-gray-700">Webhook URL</p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    value={webhookUrl}
                    onChange={(e) => {
                      setWebhookUrl(e.target.value);
                      setWebhookDirty(true);
                    }}
                    className="flex-1"
                    placeholder="https://..."
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleWebhookSave}
                    disabled={!webhookDirty || saving}
                  >
                    {saving ? 'Saving…' : 'Save'}
                  </Button>
                </div>
              </div>

              {detail.extension.iframe_base_url && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/extensions/${slug}/embed`)}
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  Open Extension
                </Button>
              )}
            </div>
          </TabsContent>

          <TabsContent value="subscriptions">
            <div className="pt-4">
              <SubscriptionManager slug={slug} />
            </div>
          </TabsContent>

          <TabsContent value="datasets">
            <div className="pt-4">
              <DatasetConfigList slug={slug} />
            </div>
          </TabsContent>

          <TabsContent value="logs">
            <div className="pt-4">
              <QueryLogTable slug={slug} />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <ConfirmDialog
        open={showUninstall}
        onOpenChange={(open) => { if (!open) setShowUninstall(false); }}
        title="Uninstall Extension"
        description={`Are you sure you want to uninstall "${detail.extension.name}"? This will remove all subscriptions and dataset configs.`}
        confirmLabel="Uninstall"
        variant="destructive"
        onConfirm={handleUninstall}
        confirmDisabled={saving}
      />
    </>
  );
}

function InfoField({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}): React.ReactNode {
  return (
    <div>
      <p className="text-xs font-medium text-gray-500 mb-0.5">{label}</p>
      <p className={`text-sm text-gray-900 ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  );
}
