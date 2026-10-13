import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { AlertTriangle, Save } from 'lucide-react';
import {
  Badge,
  Button,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  EmptyState,
  Skeleton,
  PageHeader,
} from '@/components/ui';
import { cn, formatNumber } from '@/lib/utils';
import { useSpacePlanStore } from '../stores/useSpacePlanStore';
import { STATUS_CONFIG } from '../data/mockSpacePlanningData';
import type { PlanStatus } from '../data/mockSpacePlanningData';
import { useV3StoreDetail, useSaveSpacePlanVersion, formatLabel } from '../api/spacePlanningV3Api';
import { InputsTab } from '../components/InputsTab';
import { CategoryDetailsTab } from '../components/CategoryDetailsTab';
import { FloorsTab } from '../components/FloorsTab';
import { SubcategoryDetailsTab } from '../components/SubcategoryDetailsTab';
import { SaveCommentDialog } from '../components/SaveCommentDialog';

const STATUS_BADGE_VARIANT: Record<PlanStatus, 'outline' | 'warning' | 'info' | 'success'> = {
  not_run: 'outline',
  draft: 'warning',
  review: 'info',
  approved: 'success',
};

export default function SpacePlanningStoreDetailPage(): React.ReactNode {
  const { code } = useParams<{ code: string }>();

  const hydrateFromDetail = useSpacePlanStore((s) => s.hydrateFromDetail);
  const activeStoreCode = useSpacePlanStore((s) => s.activeStoreCode);
  const activeTab = useSpacePlanStore((s) => s.activeTab);
  const setActiveTab = useSpacePlanStore((s) => s.setActiveTab);
  const categories = useSpacePlanStore((s) => s.categories);
  const plPool = useSpacePlanStore((s) => s.plPool);
  const currentVersion = useSpacePlanStore((s) => s.currentVersion);
  const isDirty = useSpacePlanStore((s) => s.isDirty);
  const storeStatus = useSpacePlanStore((s) => s.storeStatus);
  const showExceptionsOnly = useSpacePlanStore((s) => s.showExceptionsOnly);
  const setShowExceptionsOnly = useSpacePlanStore((s) => s.setShowExceptionsOnly);

  const [saveDialogOpen, setSaveDialogOpen] = useState(false);

  const { data: detail, isLoading, isError } = useV3StoreDetail(code);
  const saveMutation = useSaveSpacePlanVersion(code ?? '');

  // Persist the CURRENT store state as a new version. Reads via getState() so
  // the freshest edits are included without waiting for a re-render.
  const postVersion = useCallback((summary: string): void => {
    const { categories: cats, pods: podRows } = useSpacePlanStore.getState();
    saveMutation.mutate(
      {
        summary,
        categories: cats.map((c) => ({ code: c.code, newSpace: c.newSpace })),
        pods: podRows.map((p) => ({ category: p.categoryCode, podId: p.name, newSpace: p.newSpace })),
      },
      {
        onSuccess: () => {
          setSaveDialogOpen(false);
        },
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- saveMutation.mutate is stable
  }, [saveMutation.mutate]);

  useEffect(() => {
    if (detail) {
      hydrateFromDetail(detail);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hydrate store when API data arrives
  }, [detail]);

  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent): void => { e.preventDefault(); };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  if (isError) {
    return (
      <div className="animate-fadeInUp">
        <EmptyState
          title="Store not found"
          description={`No space planning data found for store ${code}`}
          variant="neutral"
        />
      </div>
    );
  }

  if (isLoading || !detail || activeStoreCode !== code) {
    return (
      <div className="animate-fadeInUp space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const store = detail.store;

  const statusCfg = STATUS_CONFIG[storeStatus];
  const exceptionCount = categories.filter((c) => c.boundBadge === '>sigmaMax').length;
  const totalOptionsMin = categories.reduce((s, c) => s + c.optionsMin, 0);
  const totalOptionsMax = categories.reduce((s, c) => s + c.optionsMax, 0);

  return (
    <div className="animate-fadeInUp space-y-4">
      {/* Header */}
      <PageHeader
        title={`${store.code} · ${store.name} · ${formatLabel(store.format, store.subformat)} · ${formatNumber(store.carpetArea)} sq ft`}
        backTo={{ label: 'Space Planning', path: '/space-planning' }}
        badges={
          <>
            <Badge variant={STATUS_BADGE_VARIANT[storeStatus]} size="sm" dot>
              {statusCfg.label} · v{currentVersion}
            </Badge>
            {isDirty && <Badge variant="warning" size="sm">unsaved</Badge>}
          </>
        }
        actions={
          <Button
            size="sm"
            onClick={() => setSaveDialogOpen(true)}
            disabled={!isDirty || saveMutation.isPending}
          >
            <Save className="w-3.5 h-3.5 mr-1" />{saveMutation.isPending ? 'Saving…' : 'Save'}
          </Button>
        }
      />

      {/* KPI Metric Strip */}
      {/* eslint-disable-next-line design-system/prefer-metric-grid -- custom 3-item KPI strip, not a standard MetricGrid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <p className="text-xs font-medium text-gray-500">PL Pool</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{formatNumber(plPool)}</p>
          <p className="text-xs text-gray-400 mt-0.5">sq ft</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <p className="text-xs font-medium text-gray-500">Categories</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{categories.length}</p>
          <p className="text-xs text-gray-400 mt-0.5">{exceptionCount > 0 ? `${exceptionCount} with issues` : 'all within bounds'}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <p className="text-xs font-medium text-gray-500">Options Range</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{formatNumber(totalOptionsMin)}–{formatNumber(totalOptionsMax)}</p>
          <p className="text-xs text-gray-400 mt-0.5">across all categories</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        {/* eslint-disable-next-line design-system/prefer-section-header -- tabs bar with exceptions toggle */}
        <div className="flex items-center justify-between">
          <TabsList variant="underline">
            <TabsTrigger value="inputs">Inputs</TabsTrigger>
            <TabsTrigger value="categories">Category details</TabsTrigger>
            <TabsTrigger value="floors">Floors</TabsTrigger>
            <TabsTrigger value="subcategories">Subcategory details</TabsTrigger>
          </TabsList>

          {exceptionCount > 0 && (
            <button
              onClick={() => setShowExceptionsOnly(!showExceptionsOnly)}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
                showExceptionsOnly ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
              )}
              aria-pressed={showExceptionsOnly}
              aria-label="Toggle show exceptions only"
            >
              <AlertTriangle className="w-3 h-3" />
              {exceptionCount} issue{exceptionCount !== 1 ? 's' : ''}
            </button>
          )}
        </div>

        <TabsContent value="inputs">
          <InputsTab />
        </TabsContent>
        <TabsContent value="categories">
          <CategoryDetailsTab />
        </TabsContent>
        <TabsContent value="floors">
          <FloorsTab />
        </TabsContent>
        <TabsContent value="subcategories">
          <SubcategoryDetailsTab />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <SaveCommentDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        onSave={postVersion}
        isSaving={saveMutation.isPending}
        hasError={saveMutation.isError}
        categories={categories}
      />
    </div>
  );
}
