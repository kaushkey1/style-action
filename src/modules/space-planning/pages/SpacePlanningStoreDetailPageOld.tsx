import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Save, Download, AlertTriangle } from 'lucide-react';
import {
  Button,
  Badge,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  EmptyState,
  Skeleton,
  PageHeader,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Input,
} from '@/components/ui';
import { cn, formatNumber } from '@/lib/utils';
import { useSpacePlanStore } from '../stores/useSpacePlanStore';
import { STATUS_CONFIG, MOCK_STORES } from '../data/mockSpacePlanningData';
import type { PlanStatus } from '../data/mockSpacePlanningData';
import { InputsTab } from '../components/InputsTab';
import { CategoryDetailsTab } from '../components/CategoryDetailsTab';
import { FloorsTab } from '../components/FloorsTab';
import { SubcategoryDetailsTab } from '../components/SubcategoryDetailsTab';
import { ExportDialog } from '../components/ExportDialog';

const STATUS_BADGE_VARIANT: Record<PlanStatus, 'outline' | 'warning' | 'info' | 'success'> = {
  not_run: 'outline',
  draft: 'warning',
  review: 'info',
  approved: 'success',
};

export default function SpacePlanningStoreDetailPageOld(): React.ReactNode {
  const { code } = useParams<{ code: string }>();

  const loadStore = useSpacePlanStore((s) => s.loadStore);
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
  const saveVersion = useSpacePlanStore((s) => s.saveVersion);

  const [exportOpen, setExportOpen] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);

  useEffect(() => {
    if (code) {
      loadStore(code);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only: load store data on initial render
  }, [code]);

  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent): void => { e.preventDefault(); };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  const store = MOCK_STORES.find((s) => s.code === code);

  if (!store) {
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

  if (activeStoreCode !== code) {
    return (
      <div className="animate-fadeInUp space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[storeStatus];
  const exceptionCount = categories.filter((c) => c.boundBadge === '>sigmaMax').length;
  const totalOptionsMin = categories.reduce((s, c) => s + c.optionsMin, 0);
  const totalOptionsMax = categories.reduce((s, c) => s + c.optionsMax, 0);
  const totalUnitsMin = categories.reduce((s, c) => s + c.unitsMin, 0);
  const totalUnitsMax = categories.reduce((s, c) => s + c.unitsMax, 0);

  const handleSaveWithComment = (comment: string): void => {
    saveVersion(comment);
    setSaveDialogOpen(false);
  };

  return (
    <div className="animate-fadeInUp space-y-4">
      {/* Header */}
      <PageHeader
        title={`${store.code} · ${store.name} · ${store.format} · ${formatNumber(store.carpetArea)} sq ft`}
        backTo={{ label: 'Space Planning (Old)', path: '/space-planning/old' }}
        badges={
          <>
            <Badge variant={STATUS_BADGE_VARIANT[storeStatus]} size="sm" dot>
              {statusCfg.label} · v{currentVersion}
            </Badge>
            {isDirty && <Badge variant="warning" size="sm">unsaved</Badge>}
          </>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => setSaveDialogOpen(true)} disabled={!isDirty}>
              <Save className="w-3.5 h-3.5 mr-1" />Save
            </Button>
            <Button size="sm" variant="outline" onClick={() => setExportOpen(true)}>
              <Download className="w-3.5 h-3.5 mr-1" />Export
            </Button>
          </div>
        }
      />

      {/* KPI Metric Strip */}
      {/* eslint-disable-next-line design-system/prefer-metric-grid -- custom 4-item KPI strip, not a standard MetricGrid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <p className="text-xs font-medium text-gray-500">Units Range</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{(totalUnitsMin / 1000).toFixed(1)}k–{(totalUnitsMax / 1000).toFixed(1)}k</p>
          <p className="text-xs text-gray-400 mt-0.5">total units</p>
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
      <ExportDialog open={exportOpen} onOpenChange={setExportOpen} />
      <SaveCommentDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        onSave={handleSaveWithComment}
        categories={categories}
      />
    </div>
  );
}

function SaveCommentDialog({
  open,
  onOpenChange,
  onSave,
  categories,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (comment: string) => void;
  categories: Array<{ isManual: boolean; code: string }>;
}): React.ReactNode {
  const [comment, setComment] = useState('');

  const manualEdits = categories.filter((c) => c.isManual).map((c) => c.code);
  const suggestion = manualEdits.length > 0
    ? `Manual edits: ${manualEdits.join(', ')}`
    : 'Saved current state';

  const handleSave = (): void => {
    onSave(comment.trim() || suggestion);
    setComment('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Save Version</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          <p className="text-sm text-gray-500">Describe what you changed in this version.</p>
          <Input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={suggestion}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
            aria-label="Version comment"
          />
        </div>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>
            <Save className="w-3.5 h-3.5 mr-1" />Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
