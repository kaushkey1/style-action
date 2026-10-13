import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Puzzle, Search } from 'lucide-react';
import { PageHeader, Input, Skeleton, EmptyState } from '@/components/ui';
import { useExtensionStore } from '../stores/useExtensionStore';
import { CatalogCard, InstalledCard } from '../components/ExtensionCard';
import { InstallExtensionModal } from '../components/InstallExtensionModal';

type TabKey = 'installed' | 'catalog';

function CardSkeleton(): React.ReactNode {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
      <div className="flex items-start gap-3">
        <Skeleton className="w-10 h-10 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  );
}

export function AdminExtensionsPage(): React.ReactNode {
  const navigate = useNavigate();

  const catalog = useExtensionStore((s) => s.catalog);
  const installed = useExtensionStore((s) => s.installed);
  const catalogLoading = useExtensionStore((s) => s.catalogLoading);
  const installedLoading = useExtensionStore((s) => s.installedLoading);
  const listError = useExtensionStore((s) => s.listError);
  const fetchCatalog = useExtensionStore((s) => s.fetchCatalog);
  const fetchInstalled = useExtensionStore((s) => s.fetchInstalled);

  const [activeTab, setActiveTab] = useState<TabKey>('installed');
  const [search, setSearch] = useState('');
  const [installSlug, setInstallSlug] = useState<string | null>(null);

  useEffect(() => {
    void fetchCatalog();
    void fetchInstalled();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only: actions are stable
  }, []);

  const installedSlugs = useMemo(
    () => new Set(installed.map((e) => e.slug)),
    [installed],
  );

  const filteredInstalled = useMemo(() => {
    if (!search.trim()) return installed;
    const q = search.toLowerCase();
    return installed.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.slug.toLowerCase().includes(q),
    );
  }, [installed, search]);

  const filteredCatalog = useMemo(() => {
    if (!search.trim()) return catalog;
    const q = search.toLowerCase();
    return catalog.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.slug.toLowerCase().includes(q) ||
        (e.provider?.toLowerCase().includes(q) ?? false),
    );
  }, [catalog, search]);

  const handleInstall = useCallback((slug: string) => {
    setInstallSlug(slug);
  }, []);

  const handleCardClick = useCallback(
    (slug: string) => {
      navigate(`/admin/extensions/${slug}`);
    },
    [navigate],
  );

  const installTarget = catalog.find((e) => e.slug === installSlug);
  const isLoading = activeTab === 'installed' ? installedLoading : catalogLoading;

  return (
    <>
      <PageHeader
        backTo={{ label: 'Admin', path: '/admin' }}
        title="Extensions"
        actions={
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <Input
              placeholder="Search extensions…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        }
        tabs={[
          {
            label: `Installed (${installed.length})`,
            isActive: activeTab === 'installed',
            onClick: () => setActiveTab('installed'),
          },
          {
            label: `Catalog (${catalog.length})`,
            isActive: activeTab === 'catalog',
            onClick: () => setActiveTab('catalog'),
          },
        ]}
      />

      <div className="p-4">
        {listError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {listError}
          </div>
        )}

        {isLoading ? (
          /* eslint-disable-next-line design-system/prefer-metric-grid -- extension card grid, not KPI metrics */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : activeTab === 'installed' ? (
          filteredInstalled.length === 0 ? (
            <EmptyState
              icon={Puzzle}
              description={
                search
                  ? 'No installed extensions match your search.'
                  : 'No extensions installed yet. Browse the catalog to get started.'
              }
            />
          ) : (
            /* eslint-disable-next-line design-system/prefer-metric-grid -- extension card grid, not KPI metrics */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredInstalled.map((ext) => (
                <InstalledCard
                  key={ext.id}
                  extension={ext}
                  onClick={handleCardClick}
                />
              ))}
            </div>
          )
        ) : filteredCatalog.length === 0 ? (
          <EmptyState
            icon={Puzzle}
            description={
              search
                ? 'No catalog extensions match your search.'
                : 'No extensions available in the catalog.'
            }
          />
        ) : (
          /* eslint-disable-next-line design-system/prefer-metric-grid -- extension card grid, not KPI metrics */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCatalog.map((ext) => (
              <CatalogCard
                key={ext.id}
                extension={ext}
                isInstalled={installedSlugs.has(ext.slug)}
                onInstall={handleInstall}
              />
            ))}
          </div>
        )}
      </div>

      {installTarget && (
        <InstallExtensionModal
          isOpen={!!installSlug}
          onClose={() => setInstallSlug(null)}
          extensionSlug={installTarget.slug}
          extensionName={installTarget.name}
        />
      )}
    </>
  );
}
