import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader, Spinner, EmptyState, Button } from '@/components/ui';
import { useExtensionStore } from '../stores/useExtensionStore';
import { ExtensionIframe } from '../components/ExtensionIframe';

export function ExtensionEmbedPage(): React.ReactNode {
  const { extensionSlug } = useParams<{ extensionSlug: string }>();
  const navigate = useNavigate();

  const detail = useExtensionStore((s) => s.detail);
  const detailLoading = useExtensionStore((s) => s.detailLoading);
  const detailError = useExtensionStore((s) => s.detailError);
  const fetchDetail = useExtensionStore((s) => s.fetchDetail);
  const fetchIframeUrl = useExtensionStore((s) => s.fetchIframeUrl);
  const resetDetail = useExtensionStore((s) => s.resetDetail);

  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [iframeError, setIframeError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!extensionSlug) return;

    async function load(): Promise<void> {
      setLoading(true);
      setIframeError(null);
      try {
        await fetchDetail(extensionSlug!);
        const url = await fetchIframeUrl(extensionSlug!);
        setIframeUrl(url);
      } catch (err) {
        setIframeError(err instanceof Error ? err.message : 'Failed to load extension');
      } finally {
        setLoading(false);
      }
    }

    void load();
    return () => resetDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only: actions are stable
  }, [extensionSlug]);

  const handleNavigate = useCallback(
    (path: string) => {
      navigate(path);
    },
    [navigate],
  );

  if (loading || detailLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner className="w-6 h-6" />
      </div>
    );
  }

  const error = detailError ?? iframeError;
  if (error) {
    return (
      <div className="p-4">
        <EmptyState
          description={error}
          action={
            <Button variant="outline" size="sm" onClick={() => navigate(-1 as unknown as string)}>
              Go Back
            </Button>
          }
        />
      </div>
    );
  }

  if (!iframeUrl) {
    return (
      <div className="p-4">
        <EmptyState description="This extension does not support embedded views." />
      </div>
    );
  }

  const slug = extensionSlug ?? '';
  const title = detail?.extension.name ?? 'Extension';

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        backTo={{ label: 'Extension Detail', path: `/admin/extensions/${slug}` }}
        title={title}
      />

      <div className="flex-1 p-4">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden h-full">
          <ExtensionIframe
            src={iframeUrl}
            title={title}
            onNavigate={handleNavigate}
          />
        </div>
      </div>
    </div>
  );
}
