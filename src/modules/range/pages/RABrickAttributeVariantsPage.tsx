/* eslint-disable design-system/prefer-section-header -- brick attributes uses custom layouts */
import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Download, Columns3, X, ChevronDown, ChevronRight, Palette, Store, Layers, Search, ArrowUpRight, ArrowDownRight, Info, ArrowRight, Calculator, Target, ShieldCheck, Pencil } from 'lucide-react';
import { useDownload } from '@/hooks/useDownload';
import { IMPETUS_APP_BASE } from '@/lib/api';
import { cn, getActiveTenantId, getCurrencySymbol } from '@/lib/utils';
import {
  Button,
  Input,
  PageHeader,
  Badge,
  Pagination,
  ShimmerTable,
  EmptyState,
  FilterSelect,
  Sheet,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Progress,
} from '@/components/ui';
import { useNetworkOverviewDetail, useNetworkOverviewDetailFilters, useNetworkOverviewDetailStores, useSubmitToPlm, useRAActivityLog, useBulkBuyerEdit, usePlmSubmission, usePlmSubmissionItems, useRetryPlmSubmission } from '../api/rangeHooks';
import type { NetworkOverviewDetailRow } from '../api/rangeApi';
import { buildValidationChecks, computeValidationSummary, generateNarrative } from '../data/mockValidation';
import { classifyLifecycle } from '../data/types/raLifecycle';
import { ValidationCheckCard, ValidationSummaryBar } from '../components/ValidationCheckCard';
import { PlmStatusChip } from '../components/PlmStatusChip';
import { PlmSubmissionDrawer } from '../components/PlmSubmissionDrawer';
import { formatPlmBatchRef, publicationStatus, submissionItemDetail, submissionItemStatus } from '../data/types/raPlmSubmission';
import type { PlmSubmissionStatus, PlmSubmissionSummary, PlmSubmissionItem } from '../data/types/raPlmSubmission';

const DEFAULT_PAGE_SIZE = 50;

type AttrKey = 'fabric' | 'fit' | 'length' | 'pattern' | 'waist' | 'neck' | 'sleeve' | 'wash' | 'blend' | 'weave';

const ALL_ATTR_COLUMNS: { key: AttrKey; label: string }[] = [
  { key: 'fabric', label: 'Fabric' },
  { key: 'fit', label: 'Fit' },
  { key: 'length', label: 'Length' },
  { key: 'pattern', label: 'Pattern' },
  { key: 'waist', label: 'Waist' },
  { key: 'neck', label: 'Neck' },
  { key: 'sleeve', label: 'Sleeve' },
  { key: 'wash', label: 'Wash' },
  { key: 'blend', label: 'Blend' },
  { key: 'weave', label: 'Weave' },
];

const DEFAULT_VISIBLE: AttrKey[] = ['fabric', 'fit', 'length', 'pattern'];

function getSourceBadgeVariant(source: string | null): 'info' | 'success' | 'secondary' | 'default' {
  if (!source) return 'default';
  const s = source.toLowerCase();
  if (s.includes('ftf') && s.includes('past')) return 'success';
  if (s.includes('ftf') || s.includes('forecast')) return 'info';
  if (s.includes('past')) return 'secondary';
  return 'default';
}

function fixPriceSymbol(price: string | null): string | null {
  if (!price) return price;
  return price.replace(/₹/g, getCurrencySymbol());
}

function parsePriceRange(priceStr: string | null): { min: number; max: number } {
  if (!priceStr) return { min: 0, max: 0 };
  const nums = priceStr.replace(/[^0-9.,\-–]/g, ' ').split(/[\s\-–]+/).map(s => parseFloat(s.replace(/,/g, ''))).filter(n => !isNaN(n));
  if (nums.length >= 2) return { min: nums[0] ?? 0, max: nums[1] ?? 0 };
  if (nums.length === 1) return { min: nums[0] ?? 0, max: nums[0] ?? 0 };
  return { min: 0, max: 0 };
}

function DeltaBadge({ current, historical }: { current: number; historical: number }): React.ReactNode {
  if (historical === 0) return null;
  const pct = Math.round(((current - historical) / historical) * 100);
  if (pct === 0) return null;
  const isUp = pct > 0;
  return (
    <span className="inline-flex items-center text-gray-500">
      {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
    </span>
  );
}

export default function RABrickAttributeVariantsPage(): React.ReactNode {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const { download, isDownloading } = useDownload(IMPETUS_APP_BASE);
  const isDemoOrg = getActiveTenantId() === 'demo_org';

  const runId = params.id ?? '';
  const category = searchParams.get('category') ?? '';
  const subcategory = searchParams.get('subcategory') ?? '';
  const fashionGrade = searchParams.get('fashion_grade') ?? '';
  const fashionGradeDesc = searchParams.get('fashion_grade_desc') ?? fashionGrade;
  const categoryLabel = searchParams.get('category_label') || category;
  const subcategoryLabel = searchParams.get('subcategory_label') || subcategory;
  const hit = searchParams.get('hit') ?? '';

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [brickFilter, setBrickFilter] = useState('all');
  const [fabricFilter, setFabricFilter] = useState('all');
  const [fitFilter, setFitFilter] = useState('all');
  const [lengthFilter, setLengthFilter] = useState('all');
  const [patternFilter, setPatternFilter] = useState('all');
  const [visibleAttrs, setVisibleAttrs] = useState<Set<AttrKey>>(() => new Set(DEFAULT_VISIBLE));
  const [colSelectorOpen, setColSelectorOpen] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const colSelectorRef = useRef<HTMLDivElement>(null);
  const downloadRef = useRef<HTMLDivElement>(null);

  // Detail panel state
  const [detailRow, setDetailRow] = useState<NetworkOverviewDetailRow | null>(null);
  const [detailTab, setDetailTab] = useState('colors');
  const [storeSearch, setStoreSearch] = useState('');

  // PLM submission drawer state
  const [plmDrawerOpen, setPlmDrawerOpen] = useState(false);
  const [plmItemPage, setPlmItemPage] = useState(1);

  // Buyer edit mode state
  type EditMode = 'price_range' | 'option_count';
  const [editMode, setEditMode] = useState<EditMode | null>(null);
  const [editDropdownOpen, setEditDropdownOpen] = useState(false);
  const editDropdownRef = useRef<HTMLDivElement>(null);
  const isEditing = editMode !== null;

  interface RowEdits {
    buyer_options: number;
    buyer_qty: number;
    buyer_price_min?: number;
    buyer_price_max?: number;
  }
  const [editedRows, setEditedRows] = useState<Record<string, RowEdits>>({});
  const [savedEdits, setSavedEdits] = useState<Record<string, RowEdits>>({});
  const bulkBuyerEdit = useBulkBuyerEdit();

  const handleCancelEdit = useCallback(() => {
    setEditedRows({});
    setEditMode(null);
  }, []);

  const handleStartEdit = useCallback((mode: EditMode) => {
    setEditMode(mode);
    setEditDropdownOpen(false);
    setEditedRows({});
  }, []);

  const handleBuyerFieldChange = useCallback((rowKey: string, field: keyof RowEdits, value: string, row: NetworkOverviewDetailRow) => {
    const num = field === 'buyer_price_min' || field === 'buyer_price_max' ? parseFloat(value) : parseInt(value, 10);
    if (isNaN(num) || num < 0) return;
    setEditedRows(prev => {
      const existing = prev[rowKey];
      return {
        ...prev,
        [rowKey]: {
          buyer_options: existing?.buyer_options ?? savedEdits[rowKey]?.buyer_options ?? row.option_count.buyer ?? row.option_count.system,
          buyer_qty: existing?.buyer_qty ?? savedEdits[rowKey]?.buyer_qty ?? row.total_quantity.buyer ?? row.total_quantity.system,
          buyer_price_min: existing?.buyer_price_min ?? savedEdits[rowKey]?.buyer_price_min,
          buyer_price_max: existing?.buyer_price_max ?? savedEdits[rowKey]?.buyer_price_max,
          [field]: num,
        },
      };
    });
  }, [savedEdits]);

  const handleSaveEdits = useCallback(() => {
    if (Object.keys(editedRows).length === 0) {
      setEditMode(null);
      return;
    }
    const edits = Object.entries(editedRows).map(([rowKey, vals]) => ({
      result_id: rowKey,
      buyer_options: vals.buyer_options,
      buyer_qty: vals.buyer_qty,
      buyer_price_point_min: vals.buyer_price_min,
      buyer_price_point_max: vals.buyer_price_max,
    }));
    setSavedEdits(prev => ({ ...prev, ...editedRows }));
    setEditMode(null);
    setEditedRows({});
    bulkBuyerEdit.mutate({ edits });
  }, [editedRows, bulkBuyerEdit]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent): void {
      if (colSelectorRef.current && !colSelectorRef.current.contains(e.target as Node)) {
        setColSelectorOpen(false);
      }
      if (downloadRef.current && !downloadRef.current.contains(e.target as Node)) {
        setDownloadOpen(false);
      }
      if (editDropdownRef.current && !editDropdownRef.current.contains(e.target as Node)) {
        setEditDropdownOpen(false);
      }
    }
    if (colSelectorOpen || downloadOpen || editDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
    return undefined;
  }, [colSelectorOpen, downloadOpen, editDropdownOpen]);

  const toggleAttr = useCallback((key: AttrKey) => {
    setVisibleAttrs(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  // Store data for the detail panel
  const { data: storeData, isLoading: storesLoading } = useNetworkOverviewDetailStores({
    run_id: runId,
    category,
    subcategory,
    fashion_grade: fashionGrade,
    brick: detailRow?.brick_name ?? undefined,
    fabric: detailRow?.fabric ?? undefined,
    fit: detailRow?.fit ?? undefined,
    length: detailRow?.length ?? undefined,
    pattern: detailRow?.pattern ?? undefined,
  });

  const submitToPlm = useSubmitToPlm();
  const plmSelection = { run_id: runId, category, subcategory, fashion_grade: fashionGrade };
  const plmLookup = usePlmSubmission(plmSelection);
  const { refetch: refetchPlmSubmission } = plmLookup;
  const submission = plmLookup.data?.submission;
  const plmItemsQuery = usePlmSubmissionItems(
    submission?.submission_id ?? '', plmItemPage, plmDrawerOpen && submission?.transport === 'kafka',
  );
  const retryPlm = useRetryPlmSubmission(plmSelection);

  const handleOpenPlmSubmission = useCallback(() => {
    setPlmDrawerOpen(true);
    void refetchPlmSubmission();
  }, [refetchPlmSubmission]);

  const { data: activityLogData } = useRAActivityLog(runId);
  const legacyActivity = useMemo(() => {
    const items = activityLogData?.items ?? [];
    return items.find(
      e =>
        e.action === 'submit_to_plm' &&
        e.category === category &&
        e.subcategory === subcategory &&
        (e.fashion_grade ?? '') === fashionGrade,
    );
  }, [activityLogData, category, subcategory, fashionGrade]);

  const legacyResult = submission?.legacy_result
    ?? (submitToPlm.data && !('submission_id' in submitToPlm.data) ? submitToPlm.data : undefined);
  const legacyStatus = legacyResult?.status ?? legacyActivity?.status ?? '';
  const isSentToPlm = !!submission || !!legacyResult || legacyStatus.startsWith('Submitted to PLM')
    || legacyStatus.startsWith('Partially Submitted');

  const { data: detailFilters } = useNetworkOverviewDetailFilters({
    run_id: runId, category, subcategory, fashion_grade: fashionGrade,
  });

  const { data, isLoading, isFetching } = useNetworkOverviewDetail({
    run_id: runId,
    category,
    subcategory,
    fashion_grade: fashionGrade,
    page,
    page_size: pageSize,
    brick: brickFilter !== 'all' ? brickFilter : undefined,
    fabric: fabricFilter !== 'all' ? fabricFilter : undefined,
    fit: fitFilter !== 'all' ? fitFilter : undefined,
    length: lengthFilter !== 'all' ? lengthFilter : undefined,
    pattern: patternFilter !== 'all' ? patternFilter : undefined,
  });

  const handleSubmitToPlm = useCallback(() => {
    if (!runId || !category || !subcategory) return;
    submitToPlm.mutate({ run_id: runId, category, subcategory, fashion_grade: fashionGrade });
  }, [runId, category, subcategory, fashionGrade, submitToPlm]);

  const handlePlmRetry = useCallback(() => {
    if (submission?.transport === 'kafka') retryPlm.mutate(submission.submission_id);
  }, [submission, retryPlm]);

  const plmStatus: PlmSubmissionStatus = submitToPlm.isPending || retryPlm.isPending
    ? 'submitting'
    : submission?.transport === 'kafka'
      ? publicationStatus(submission.status, submission.processing?.status)
      : legacyStatus.startsWith('Submitted to PLM') ? 'submitted'
        : legacyStatus.startsWith('Partially Submitted') ? 'partially_submitted'
          : legacyStatus.startsWith('PLM Submission Failed') ? 'submission_failed'
            : submission ? 'needs_review' : 'not_submitted';

  const plmItems: PlmSubmissionItem[] = (plmItemsQuery.data?.items ?? []).map(item => ({
    id: item.id,
    brick: item.style.brick_name ?? '-',
    brand: item.style.brand_desc ?? '-',
    attributes: [item.style.fabric?.type, item.style.fit, item.style.pattern_type, item.style.color, item.style.length].filter(Boolean).join(' / '),
    status: submissionItemStatus(item),
    detail: submissionItemDetail(item),
    errorReason: item.plm_result ? null : item.error_code,
    businessError: item.plm_result?.error_message ?? item.plm_result?.error
      ?? (item.plm_result?.errors?.length ? item.plm_result.errors.join('; ') : null)
      ?? item.plm_result?.error_code ?? null,
    styleCode: item.plm_result?.style_code ?? item.plm_result?.style_id ?? null,
    retryEligible: !item.plm_result && item.retry_eligible,
  }));
  const hasSavedItems = submission?.transport === 'kafka';
  const plmSummary: PlmSubmissionSummary = {
    status: plmStatus,
    totalItems: submission?.total ?? legacyResult?.submitted ?? legacyActivity?.payload?.submitted ?? 0,
    accepted: hasSavedItems ? submission.processing?.counts.success ?? 0 : legacyResult?.succeeded ?? legacyActivity?.payload?.succeeded ?? 0,
    failed: hasSavedItems
      ? submission.counts.failed + (submission.processing?.counts.validation_failed ?? 0) + (submission.processing?.counts.failed ?? 0)
      : legacyResult?.failed ?? legacyActivity?.payload?.failed ?? 0,
    processing: hasSavedItems ? submission.counts.pending + submission.counts.publishing : 0,
    latestAttemptAt: submission?.created_at ?? legacyActivity?.created_at ?? null,
    batchRef: submission ? formatPlmBatchRef(submission) : null,
    failuresByReason: [],
    retryEligibleCount: plmItems.filter(item => item.retryEligible).length,
    hasSavedItems,
  };

  const pageValidationSummary = useMemo(
    () => computeValidationSummary(buildValidationChecks(4, 6, null)),
    [],
  );

  const items: NetworkOverviewDetailRow[] = useMemo(() => data?.items ?? [], [data]);
  const totalItems = data?.total ?? 0;
  const totalPages = data?.total_pages ?? 1;

  const handlePageChange = useCallback((p: number) => setPage(p), []);
  const handlePageSizeChange = useCallback((ps: number) => {
    setPageSize(ps);
    setPage(1);
  }, []);

  const totals = useMemo(() => {
    const t = data?.totals;
    return {
      combinations: totalItems,
      systemOptions: t?.system_options ?? 0,
      buyerOptions: t?.buyer_options ?? null,
    };
  }, [data, totalItems]);

  const activeAttrCols = useMemo(
    () => ALL_ATTR_COLUMNS.filter(c => visibleAttrs.has(c.key)),
    [visibleAttrs],
  );

  const pageTitle = [categoryLabel, subcategoryLabel, fashionGradeDesc].filter(Boolean).join(' / ');

  const handleRowClick = useCallback((row: NetworkOverviewDetailRow) => {
    setDetailRow(row);
    setDetailTab('colors');
    setStoreSearch('');
  }, []);

  // Parse colors string into array for the detail panel
  const detailColors = useMemo(() => {
    if (!detailRow?.colors) return [];
    return detailRow.colors.split(',').map(c => c.trim()).filter(Boolean);
  }, [detailRow]);

  // Filtered stores for the detail panel
  const filteredStores = useMemo(() => {
    const stores = storeData?.stores ?? [];
    if (!storeSearch) return stores;
    const q = storeSearch.toLowerCase();
    return stores.filter(s =>
      (s.site ?? '').toLowerCase().includes(q) ||
      (s.store_name ?? '').toLowerCase().includes(q) ||
      (s.format ?? '').toLowerCase().includes(q) ||
      (s.state ?? '').toLowerCase().includes(q) ||
      (s.city ?? '').toLowerCase().includes(q) ||
      (s.region ?? '').toLowerCase().includes(q),
    );
  }, [storeData, storeSearch]);

  // Group stores by format for the detail panel
  const storesByFormat = useMemo(() => {
    const groups: Record<string, typeof filteredStores> = {};
    for (const store of filteredStores) {
      const fmt = store.format ?? 'Other';
      if (!groups[fmt]) groups[fmt] = [];
      groups[fmt].push(store);
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredStores]);

  // Build attribute summary for the detail panel title
  const detailAttrSummary = useMemo(() => {
    if (!detailRow) return '';
    return [detailRow.fabric, detailRow.fit, detailRow.length, detailRow.pattern]
      .filter(Boolean)
      .join(' / ');
  }, [detailRow]);

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <PageHeader
        backTo={{ label: 'Range Architecture', path: '/range' }}
        title={pageTitle || 'Brick Detail'}
        actions={
          <div className="flex items-center gap-2">
            {/* Buyer Edit Toggle */}
            {isEditing ? (
              <>
                <span className="text-xs text-gray-500">Editing: {editMode === 'price_range' ? 'Price Range' : 'Option Count'}</span>
                <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSaveEdits}
                  disabled={Object.keys(editedRows).length === 0 || bulkBuyerEdit.isPending}
                >
                  {bulkBuyerEdit.isPending ? 'Saving...' : `Save (${Object.keys(editedRows).length})`}
                </Button>
              </>
            ) : (
              <div className="relative" ref={editDropdownRef}>
                <Button variant="outline" size="sm" onClick={() => setEditDropdownOpen(prev => !prev)}>
                  <Pencil className="w-3.5 h-3.5 mr-1.5" />
                  Edit
                  <ChevronDown className="w-3.5 h-3.5 ml-1" />
                </Button>
                {editDropdownOpen && (
                  <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-lg w-48 py-1">
                    <button
                      type="button"
                      onClick={() => handleStartEdit('option_count')}
                      className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-sm text-gray-700 w-full text-left"
                    >
                      Option Count
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStartEdit('price_range')}
                      className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-sm text-gray-700 w-full text-left"
                    >
                      Price Range
                    </button>
                  </div>
                )}
              </div>
            )}
            {/* PLM Status + Readiness */}
            {plmStatus !== 'not_submitted' && (
              <PlmStatusChip status={plmStatus} onClick={handleOpenPlmSubmission} />
            )}
            {pageValidationSummary.hasBlockingFailure && (
              <Badge variant="destructive" size="sm">Blocked</Badge>
            )}
            <Button
              variant={isSentToPlm ? 'outline' : 'primary'}
              size="sm"
              onClick={isSentToPlm ? handleOpenPlmSubmission : handleSubmitToPlm}
              disabled={submitToPlm.isPending || plmLookup.isPending || (plmLookup.isError && !isSentToPlm) || !runId || (!isSentToPlm && pageValidationSummary.hasBlockingFailure)}
              className="shrink-0"
            >
              {submitToPlm.isPending ? 'Submitting...' : plmLookup.isPending ? 'Checking submission...' : isSentToPlm ? 'View Submission' : 'Send to PLM'}
            </Button>
            {plmLookup.isError && <span role="alert" className="text-xs text-red-700">Unable to refresh submission status.</span>}
            {(submitToPlm.isError || retryPlm.isError) && <span role="alert" className="text-xs text-red-700">Submission request failed. Please try again.</span>}
            <div className="relative" ref={colSelectorRef}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setColSelectorOpen(prev => !prev)}
                className="shrink-0"
                aria-label="Toggle attribute columns"
              >
                <Columns3 className="w-4 h-4 mr-1.5" />
                Columns
                {visibleAttrs.size !== DEFAULT_VISIBLE.length && (
                  <span className="ml-1 text-xs bg-gray-200 text-gray-700 rounded-full px-1.5">
                    {visibleAttrs.size}
                  </span>
                )}
              </Button>
              {colSelectorOpen && (
                <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-lg w-48 py-1">
                  {ALL_ATTR_COLUMNS.map(col => (
                    <button
                      key={col.key}
                      type="button"
                      onClick={() => toggleAttr(col.key)}
                      className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 cursor-pointer text-sm text-gray-700 w-full text-left"
                    >
                      <span className={cn(
                        'w-4 h-4 rounded border flex items-center justify-center shrink-0',
                        visibleAttrs.has(col.key) ? 'bg-gray-900 border-gray-900' : 'border-gray-300',
                      )}>
                        {visibleAttrs.has(col.key) && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </span>
                      {col.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="relative" ref={downloadRef}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDownloadOpen(prev => !prev)}
                disabled={isDownloading || !runId}
                className="shrink-0"
              >
                <Download className="w-4 h-4 mr-1.5" />
                {isDownloading ? 'Downloading...' : 'Download'}
                <ChevronDown className="w-3.5 h-3.5 ml-1" />
              </Button>
              {downloadOpen && (
                <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-lg w-48 py-1">
                  {(() => {
                    const activeFilters: Record<string, string> = {};
                    if (brickFilter !== 'all') activeFilters.brick = brickFilter;
                    if (fabricFilter !== 'all') activeFilters.fabric = fabricFilter;
                    if (fitFilter !== 'all') activeFilters.fit = fitFilter;
                    if (lengthFilter !== 'all') activeFilters.length = lengthFilter;
                    if (patternFilter !== 'all') activeFilters.pattern = patternFilter;
                    const filePrefix = [category, subcategory, fashionGradeDesc].filter(Boolean).join('-').replace(/\s+/g, '_');
                    return (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setDownloadOpen(false);
                            download('/range/network-overview/detail', `${filePrefix}-Range_Architecture.xlsx`, {
                              params: { run_id: runId, category, subcategory, fashion_grade: fashionGrade, download: 'true', ...activeFilters },
                            });
                          }}
                          className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-sm text-gray-700 w-full text-left"
                        >
                          Download RA
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDownloadOpen(false);
                            download('/range/network-overview/detail/download/planogram', `${filePrefix}-Planogram.xlsx`, {
                              params: { category, subcategory, fashion_grade: fashionGrade, ...activeFilters },
                            });
                          }}
                          className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-sm text-gray-700 w-full text-left"
                        >
                          Download Planogram
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDownloadOpen(false);
                            download('/range/network-overview/detail/download/aop', `${filePrefix}-AOP.xlsx`, {
                              params: { category, subcategory, fashion_grade: fashionGrade, hit, ...activeFilters },
                            });
                          }}
                          className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-sm text-gray-700 w-full text-left"
                        >
                          Download AOP
                        </button>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        }
      />

      <div className="flex-1 overflow-auto p-4">
        {/* ── KPI Summary Cards ── */}
        {!isLoading && data && (
          /* eslint-disable-next-line design-system/prefer-metric-grid -- custom compact KPI strip with inline delta badges */
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
            <div className="bg-white rounded-lg border border-gray-200 p-3">
              <p className="text-xs text-gray-500">Total Combinations</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{totals.combinations}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-3">
              <p className="text-xs text-gray-500">System Options</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{totals.systemOptions}</p>
              {totals.buyerOptions != null && totals.buyerOptions !== totals.systemOptions && (
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-xs text-gray-400">Buyer:</span>
                  <span className="text-xs font-semibold text-gray-700">{totals.buyerOptions}</span>
                  <DeltaBadge current={totals.buyerOptions} historical={totals.systemOptions} />
                </div>
              )}
            </div>
            {data.budget != null && (
              <div className="bg-white rounded-lg border border-gray-200 p-3">
                <p className="text-xs text-gray-500">Budget Utilization</p>
                <p className="text-xl font-bold text-gray-900 mt-1">
                  {getCurrencySymbol()}{(data.budget / 1e7).toFixed(1)} Cr
                </p>
                {data.scalePct != null && (
                  <div className="mt-1.5">
                    <Progress value={Math.min(data.scalePct, 100)} className="h-1.5" />
                    <p className={cn('text-[10px] mt-0.5', data.overBudget ? 'text-amber-600' : 'text-gray-400')}>
                      {data.overBudget ? 'Over budget' : `${data.scalePct}% utilized`}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Filters ── */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <FilterSelect
            value={brickFilter}
            onChange={(v) => { setBrickFilter(v); setPage(1); }}
            placeholder="All Bricks"
            options={[
              { value: 'all', label: 'All Bricks' },
              ...(detailFilters?.bricks ?? []).map(b => ({ value: b, label: b })),
            ]}
            searchable
          />
          <FilterSelect
            value={fabricFilter}
            onChange={(v) => { setFabricFilter(v); setPage(1); }}
            placeholder="All Fabrics"
            options={[
              { value: 'all', label: 'All Fabrics' },
              ...(detailFilters?.fabrics ?? []).map(f => ({ value: f, label: f })),
            ]}
            searchable
          />
          <FilterSelect
            value={fitFilter}
            onChange={(v) => { setFitFilter(v); setPage(1); }}
            placeholder="All Fits"
            options={[
              { value: 'all', label: 'All Fits' },
              ...(detailFilters?.fits ?? []).map(f => ({ value: f, label: f })),
            ]}
          />
          <FilterSelect
            value={lengthFilter}
            onChange={(v) => { setLengthFilter(v); setPage(1); }}
            placeholder="All Lengths"
            options={[
              { value: 'all', label: 'All Lengths' },
              ...(detailFilters?.lengths ?? []).map(l => ({ value: l, label: l })),
            ]}
          />
          <FilterSelect
            value={patternFilter}
            onChange={(v) => { setPatternFilter(v); setPage(1); }}
            placeholder="All Patterns"
            options={[
              { value: 'all', label: 'All Patterns' },
              ...(detailFilters?.patterns ?? []).map(p => ({ value: p, label: p })),
            ]}
            searchable
          />
        </div>

        {isLoading && <ShimmerTable rows={8} />}

        {!isLoading && items.length === 0 && (
          <EmptyState
            title="No brick data"
            description="No brick-level data found for this combination."
          />
        )}

        {!isLoading && items.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className={cn("overflow-x-auto transition-opacity", isFetching && !isLoading && "opacity-50 pointer-events-none")}>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th
                      rowSpan={2}
                      className="text-left px-4 py-2 text-xs uppercase text-gray-500 font-medium border-r border-gray-200 whitespace-nowrap"
                    >
                      Brick Name
                    </th>
                    <th
                      rowSpan={2}
                      className="text-left px-3 py-2 text-xs uppercase text-gray-500 font-medium border-r border-gray-200 whitespace-nowrap"
                    >
                      Brand
                    </th>
                    {activeAttrCols.map(col => (
                      <th
                        key={col.key}
                        rowSpan={2}
                        className="text-left px-3 py-2 text-xs uppercase text-gray-500 font-medium border-r border-gray-200 whitespace-nowrap"
                      >
                        {col.label}
                      </th>
                    ))}
                    <th
                      rowSpan={2}
                      className="text-center px-3 py-2 text-xs uppercase text-gray-500 font-medium border-r border-gray-200 whitespace-nowrap"
                    >
                      Colors
                    </th>
                    <th
                      colSpan={2}
                      className="text-left px-3 py-2 text-xs uppercase text-gray-500 font-semibold border-r border-gray-200 bg-gray-100 whitespace-nowrap"
                    >
                      Price Range
                    </th>
                    <th
                      colSpan={2}
                      className="text-left px-3 py-2 text-xs uppercase text-gray-500 font-semibold border-r border-gray-200 bg-gray-100 whitespace-nowrap"
                    >
                      Option Count
                    </th>
                    <th
                      rowSpan={2}
                      className="text-left px-3 py-2 text-xs uppercase text-gray-500 font-medium border-r border-gray-200 whitespace-nowrap"
                    >
                      Source
                    </th>
                    {!isDemoOrg && (
                      <th
                        rowSpan={2}
                        className="text-center px-3 py-2 text-xs uppercase text-gray-500 font-medium whitespace-nowrap"
                      >
                        Store Spread
                      </th>
                    )}
                    <th rowSpan={2} className="w-8" />
                  </tr>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-right px-3 py-1.5 text-[10px] uppercase text-gray-400 font-medium border-r border-gray-100 min-w-[90px]">
                      System
                    </th>
                    <th className="text-right px-3 py-1.5 text-[10px] uppercase text-gray-500 font-semibold border-r border-gray-200 min-w-[90px]">
                      Buyer
                    </th>
                    <th className="text-right px-3 py-1.5 text-[10px] uppercase text-gray-400 font-medium border-r border-gray-100 min-w-[60px]">
                      System
                    </th>
                    <th className="text-right px-3 py-1.5 text-[10px] uppercase text-gray-500 font-semibold border-r border-gray-200 min-w-[60px]">
                      Buyer
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((row, idx) => {
                    const isGrey = row.display === 'grey';
                    const matchPct =
                      isGrey && row.match_score != null
                        ? Math.round(row.match_score * 100)
                        : null;
                    const isSelected = detailRow === row;
                    const rowKey = `${row.brick_code}-${row.brand}-${idx}`;
                    return (
                    <tr
                      key={rowKey}
                      className={cn(
                        'border-b border-gray-100 cursor-pointer transition-colors',
                        isGrey && 'bg-gray-50 opacity-60',
                        isSelected ? 'bg-indigo-50 hover:bg-indigo-50' : 'hover:bg-gray-50',
                      )}
                      onClick={() => handleRowClick(row)}
                    >
                      <td className="px-4 py-3 text-xs text-gray-900 font-medium border-r border-gray-100 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5">
                          {row.brick_name || subcategoryLabel || '-'}
                          {isGrey && (
                            <span
                              title={
                                matchPct != null
                                  ? `Duplicate of a Range Architecture record (${matchPct}% attribute match)`
                                  : 'Duplicate of a Range Architecture record'
                              }
                            >
                              <Badge variant="outline" size="sm">
                                Duplicate{matchPct != null ? ` · ${matchPct}%` : ''}
                              </Badge>
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="px-3 py-3 border-r border-gray-100 whitespace-nowrap">
                        <span className="text-xs font-medium text-gray-700">
                          {row.brand ?? '-'}
                        </span>
                      </td>
                      {activeAttrCols.map(col => (
                        <td key={col.key} className="px-3 py-3 text-xs text-gray-700 border-r border-gray-100 whitespace-nowrap">
                          {row[col.key] ?? '-'}
                        </td>
                      ))}
                      <td className="px-3 py-3 text-center text-xs text-gray-700 border-r border-gray-100 whitespace-nowrap">
                        {row.colors ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-700">
                            <Palette className="w-3 h-3" />
                            {row.color_count}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>

                      {/* Price Range: S / B */}
                      <td className="px-3 py-3 text-right text-xs text-gray-700 border-r border-gray-100 whitespace-nowrap">
                        {fixPriceSymbol(row.price_range.system) ?? '-'}
                      </td>
                      <td className="px-3 py-3 text-right border-r border-gray-200 whitespace-nowrap">
                        {(() => {
                          const savedPrice = savedEdits[rowKey];
                          if (editMode === 'price_range' && !isGrey) {
                            const parsedBuyer = parsePriceRange(row.price_range.buyer ?? row.price_range.system);
                            const minVal = editedRows[rowKey]?.buyer_price_min ?? savedPrice?.buyer_price_min ?? parsedBuyer.min;
                            const maxVal = editedRows[rowKey]?.buyer_price_max ?? savedPrice?.buyer_price_max ?? parsedBuyer.max;
                             
                            return (
                              <div className="flex items-center gap-1">
                                {/* eslint-disable-next-line no-restricted-syntax -- inline table cell edit needs compact input */}
                                <input type="number" min={0} className="w-16 px-1.5 py-1 text-xs text-right border border-gray-300 rounded focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" value={minVal} onClick={(e) => e.stopPropagation()} onChange={(e) => handleBuyerFieldChange(rowKey, 'buyer_price_min', e.target.value, row)} />
                                <span className="text-xs text-gray-400">-</span>
                                {/* eslint-disable-next-line no-restricted-syntax -- inline table cell edit needs compact input */}
                                <input type="number" min={0} className="w-16 px-1.5 py-1 text-xs text-right border border-gray-300 rounded focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" value={maxVal} onClick={(e) => e.stopPropagation()} onChange={(e) => handleBuyerFieldChange(rowKey, 'buyer_price_max', e.target.value, row)} />
                              </div>
                            );
                          }
                          if (savedPrice?.buyer_price_min != null && savedPrice?.buyer_price_max != null) {
                            return <span className="text-xs text-gray-900 font-semibold">{getCurrencySymbol()}{savedPrice.buyer_price_min} - {getCurrencySymbol()}{savedPrice.buyer_price_max}</span>;
                          }
                          return <span className="text-xs text-gray-900 font-semibold">{fixPriceSymbol(row.price_range.buyer) ?? '-'}</span>;
                        })()}
                      </td>

                      {/* Option Count: S / B with deltas */}
                      <td className="px-3 py-3 text-right border-r border-gray-100 whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-xs text-gray-700">{row.option_count.system}</span>
                          <DeltaBadge current={row.option_count.system} historical={row.option_count.historical} />
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right border-r border-gray-200 whitespace-nowrap">
                        {(() => {
                          const displayBuyer = savedEdits[rowKey]?.buyer_options ?? row.option_count.buyer;
                          return editMode === 'option_count' && !isGrey ? (
                            /* eslint-disable-next-line no-restricted-syntax -- inline table cell edit needs compact input without Input wrapper chrome */
                            <input
                              type="number"
                              min={0}
                              className="w-16 px-1.5 py-1 text-xs text-right border border-gray-300 rounded focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                              value={editedRows[rowKey]?.buyer_options ?? displayBuyer ?? row.option_count.system}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => handleBuyerFieldChange(rowKey, 'buyer_options', e.target.value, row)}
                            />
                          ) : (
                            <div className="flex items-center justify-end gap-1">
                              <span className="text-xs text-gray-900 font-semibold">{displayBuyer ?? '-'}</span>
                              {displayBuyer != null && (
                                <DeltaBadge current={displayBuyer} historical={row.option_count.system} />
                              )}
                            </div>
                          );
                        })()}
                      </td>

                      <td className="px-3 py-3 border-r border-gray-100 whitespace-nowrap">
                        <Badge
                          variant={getSourceBadgeVariant(row.source ?? 'Historical')}
                          size="sm"
                        >
                          {row.source ?? 'Historical'}
                        </Badge>
                      </td>
                      {!isDemoOrg && (
                        <td className="px-3 py-3 text-center whitespace-nowrap">
                          {row.store_spread != null && row.store_spread > 0 ? (
                            <span className="text-sm font-medium text-gray-900">
                              {row.store_spread}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                      )}
                      <td className="px-2 py-3">
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Totals Footer */}
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6 text-xs">
                  <span className="text-gray-500">
                    Total Combinations:{' '}
                    <span className="font-semibold text-gray-900">
                      {totals.combinations}
                    </span>
                  </span>
                  <span className="text-gray-500">
                    System Options:{' '}
                    <span className="font-semibold text-gray-900">
                      {totals.systemOptions}
                    </span>
                  </span>
                  {totals.buyerOptions != null && (
                    <span className="text-gray-500">
                      Buyer Options:{' '}
                      <span className="font-semibold text-gray-900">
                        {totals.buyerOptions}
                      </span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageSizeChange={handlePageSizeChange}
            />
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          Detail Panel — opens on row click
          ════════════════════════════════════════════════════════════════════════ */}
      <Sheet
        isOpen={detailRow !== null}
        onClose={() => setDetailRow(null)}
        title={detailRow?.brick_name || subcategoryLabel || 'Detail'}
        description={detailAttrSummary || undefined}
        width="lg"
      >
        {detailRow && (
          <div className="flex flex-col h-full">
            {/* H → S → B Comparison Strip */}
            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50">
              <p className="text-[10px] uppercase text-gray-400 mb-2">Options Progression</p>
              {/* eslint-disable-next-line design-system/prefer-metric-grid -- H/S/B comparison strip with custom progression layout */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-[10px] text-gray-400 mb-1">Historical</p>
                  <p className="text-lg font-bold text-gray-400">{detailRow.option_count.historical}</p>
                  {detailRow.price_range.historical && (
                    <p className="text-[10px] text-gray-400 mt-0.5">{fixPriceSymbol(detailRow.price_range.historical)}</p>
                  )}
                </div>
                <div className="text-center border-x border-gray-200 relative">
                  <p className="text-[10px] text-gray-400 mb-1">System</p>
                  <p className="text-lg font-bold text-gray-700">{detailRow.option_count.system}</p>
                  {detailRow.price_range.system && (
                    <p className="text-[10px] text-gray-500 mt-0.5">{fixPriceSymbol(detailRow.price_range.system)}</p>
                  )}
                  {detailRow.option_count.historical > 0 && (
                    <div className="absolute top-0 right-2">
                      <DeltaBadge current={detailRow.option_count.system} historical={detailRow.option_count.historical} />
                    </div>
                  )}
                </div>
                <div className="text-center relative">
                  <p className="text-[10px] text-gray-700 font-medium mb-1">Buyer</p>
                  <p className="text-lg font-bold text-gray-900">{detailRow.option_count.buyer ?? '—'}</p>
                  {detailRow.price_range.buyer && (
                    <p className="text-[10px] text-gray-700 mt-0.5">{fixPriceSymbol(detailRow.price_range.buyer)}</p>
                  )}
                  {detailRow.option_count.buyer != null && (
                    <div className="absolute top-0 right-2">
                      <DeltaBadge current={detailRow.option_count.buyer} historical={detailRow.option_count.system} />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Tabs */}
            <Tabs value={detailTab} onValueChange={setDetailTab} className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="px-5 pt-2 bg-white border-b border-gray-100 shrink-0">
                <TabsTrigger value="colors" className="gap-1.5">
                  <Palette className="w-3.5 h-3.5" />
                  Colors{detailRow.color_count ? ` (${detailRow.color_count})` : ''}
                </TabsTrigger>
                <TabsTrigger value="stores" className="gap-1.5">
                  <Store className="w-3.5 h-3.5" />
                  Stores{storeData?.stores?.length ? ` (${storeData.stores.length})` : ''}
                </TabsTrigger>
                <TabsTrigger value="derivation" className="gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  Derivation
                </TabsTrigger>
                <TabsTrigger value="validation" className="gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Validation
                </TabsTrigger>
              </TabsList>

              {/* ── Colors Tab ── */}
              <TabsContent value="colors" className="flex-1 overflow-auto px-5 py-4">
                {detailColors.length === 0 ? (
                  <EmptyState description="No color data available for this combination." />
                ) : (
                  <div className="space-y-2">
                    {detailColors.map((color, i) => (
                      <div key={`${color}-${i}`} className="bg-gray-50 rounded-lg p-3 border border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-5 h-5 rounded-full border border-gray-200 bg-gray-300 shrink-0" />
                          <span className="text-sm font-medium text-gray-900">{color}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* ── Stores Tab ── */}
              <TabsContent value="stores" className="flex-1 overflow-auto px-5 py-4">
                <div className="space-y-4">
                  {storeData?.stores && storeData.stores.length > 0 && (
                    <Input
                      type="text"
                      placeholder="Search by site, name, city, state..."
                      value={storeSearch}
                      onChange={(e) => setStoreSearch(e.target.value)}
                      leftIcon={<Search className="w-3.5 h-3.5" />}
                      rightIcon={storeSearch ? (
                        <button
                          type="button"
                          onClick={() => setStoreSearch('')}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                          aria-label="Clear search"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      ) : undefined}
                      className="h-8 !py-0 text-xs"
                    />
                  )}

                  {storesLoading && <ShimmerTable rows={5} />}

                  {!storesLoading && (!storeData?.stores || storeData.stores.length === 0) && (
                    <EmptyState description="No store data found for this combination." />
                  )}

                  {!storesLoading && storesByFormat.length > 0 && storesByFormat.map(([format, stores]) => (
                    <div key={format}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-gray-900 uppercase">{format}</span>
                          <Badge variant="secondary" size="sm">{stores.length} stores</Badge>
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg border border-gray-100 overflow-hidden mb-3">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-gray-200 bg-gray-100/50">
                              <th className="text-left px-3 py-1.5 font-medium text-gray-500">Site</th>
                              <th className="text-left px-3 py-1.5 font-medium text-gray-500">Name</th>
                              <th className="text-left px-3 py-1.5 font-medium text-gray-500">State</th>
                              <th className="text-left px-3 py-1.5 font-medium text-gray-500">City</th>
                              <th className="text-left px-3 py-1.5 font-medium text-gray-500">Region</th>
                            </tr>
                          </thead>
                          <tbody>
                            {stores.map((store) => (
                              <tr key={store.site} className="border-b border-gray-100 last:border-0">
                                <td className="px-3 py-2 text-gray-900 font-medium">{store.site}</td>
                                <td className="px-3 py-2 text-gray-700">{store.store_name ?? '-'}</td>
                                <td className="px-3 py-2 text-gray-700">{store.state ?? '-'}</td>
                                <td className="px-3 py-2 text-gray-700">{store.city ?? '-'}</td>
                                <td className="px-3 py-2 text-gray-700">{store.region ?? '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}

                  {!storesLoading && filteredStores.length === 0 && storeData?.stores && storeData.stores.length > 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">No stores match your search</p>
                  )}

                  {storeData?.total != null && (
                    <p className="text-xs text-gray-500">Total stores: {storeData.total}</p>
                  )}
                </div>
              </TabsContent>

              {/* ── Derivation Tab ── */}
              <TabsContent value="derivation" className="flex-1 overflow-auto px-5 py-4">
                <DerivationPanel row={detailRow} />
              </TabsContent>

              {/* ── Validation Tab (6 Buyer Checks) ── */}
              <TabsContent value="validation" className="flex-1 overflow-auto px-5 py-4">
                <BuyerValidationPanel row={detailRow} />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </Sheet>

      {/* PLM Submission Drawer */}
      <PlmSubmissionDrawer
        isOpen={plmDrawerOpen}
        onClose={() => setPlmDrawerOpen(false)}
        submission={plmSummary}
        items={plmItems}
        itemsLoading={plmItemsQuery.isLoading}
        itemsError={plmItemsQuery.isError}
        itemPage={plmItemPage}
        onItemPageChange={setPlmItemPage}
        validationSummary={pageValidationSummary}
        onRetry={handlePlmRetry}
        isRetrying={retryPlm.isPending}
        planLabel={pageTitle}
      />
    </div>
  );
}

function isGrey(row: NetworkOverviewDetailRow): boolean {
  return row.display === 'grey';
}

function StepNumber({ n }: { n: number }): React.ReactNode {
  return (
    <span className="shrink-0 w-5 h-5 rounded-full bg-gray-900 text-white text-[10px] font-bold flex items-center justify-center">
      {n}
    </span>
  );
}

function MathRow({ label, formula, value }: { label: string; formula?: string; value: string }): React.ReactNode {
  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-700 truncate">{label}</p>
        {formula && <p className="text-[10px] text-gray-400 font-mono truncate">{formula}</p>}
      </div>
      <span className="text-sm font-bold text-gray-900 ml-3 shrink-0">{value}</span>
    </div>
  );
}

type SourceType = 'historical' | 'ftf' | 'blended';

function classifySource(source: string | null): SourceType {
  if (!source) return 'historical';
  const s = source.toLowerCase();
  if (s.includes('ftf') && (s.includes('past') || s.includes('historical'))) return 'blended';
  if (s.includes('ftf') || s.includes('forecast')) return 'ftf';
  return 'historical';
}

// ─── Buyer Validation Panel (RA-06: precise states) ─────────────────────────
function BuyerValidationPanel({ row }: { row: NetworkOverviewDetailRow }): React.ReactNode {
  const checks = useMemo(
    () => buildValidationChecks(row.option_count.historical, row.option_count.system, row.option_count.buyer),
    [row.option_count.historical, row.option_count.system, row.option_count.buyer],
  );
  const summary = useMemo(() => computeValidationSummary(checks), [checks]);

  return (
    <div className="space-y-3">
      <ValidationSummaryBar summary={summary} />
      {checks.map(check => (
        <ValidationCheckCard key={check.id} check={check} />
      ))}
    </div>
  );
}

// ─── Derivation Panel (spec-aligned formulas) ──────────────────────────────
function DerivationPanel({ row }: { row: NetworkOverviewDetailRow }): React.ReactNode {
  const hasHistorical = row.option_count.historical > 0;
  const storeCount = row.store_spread ?? 0;
  const sourceType = classifySource(row.source ?? 'Historical');

  const systemRosPerStore = storeCount > 0
    ? (row.total_quantity.system / storeCount).toFixed(1) : null;
  const optionChange = hasHistorical ? row.option_count.system - row.option_count.historical : null;
  const optionChangePct = hasHistorical && row.option_count.historical > 0
    ? Math.round(((row.option_count.system - row.option_count.historical) / row.option_count.historical) * 100) : null;

  const narrative = generateNarrative(
    row.option_count.historical,
    row.option_count.system,
    row.option_count.buyer,
    row.total_quantity.historical,
    row.total_quantity.system,
    row.total_quantity.buyer,
    storeCount,
  );
  const lifecycle = classifyLifecycle(row.option_count.historical);

  let step = 1;

  return (
    <div className="space-y-4">
      {/* Source Header */}
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant={getSourceBadgeVariant(row.source ?? 'Historical')} size="sm">
          {row.source ?? 'Historical'}
        </Badge>
      </div>

      {/* Step 1: Combination Details (RA-04: separated from option identity) */}
      <div className="bg-white rounded-lg border border-gray-200 p-3">
        <div className="flex items-center gap-2 mb-3">
          <StepNumber n={step++} />
          <div>
            <p className="text-xs font-semibold text-gray-900">Combination Details</p>
            <p className="text-[10px] text-gray-400">This attribute combination can contain multiple planned options</p>
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-700 mb-2">
            <span className="font-semibold">{row.option_count.system} planned options</span> in this combination
          </p>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {row.brick_name && <span className="bg-white border border-gray-200 rounded px-2 py-0.5 text-[10px] text-gray-700">{row.brick_name}</span>}
            {row.fashion_grade && <span className="bg-white border border-gray-200 rounded px-2 py-0.5 text-[10px] text-gray-700">{row.fashion_grade_desc ?? row.fashion_grade}</span>}
            {[row.fabric, row.fit, row.length, row.pattern].filter(Boolean).map((attr, i) => (
              <span key={i} className="bg-white border border-gray-200 rounded px-2 py-0.5 text-[10px] text-gray-700">{attr}</span>
            ))}
            {row.price_range.system && <span className="bg-white border border-gray-200 rounded px-2 py-0.5 text-[10px] text-gray-700">{fixPriceSymbol(row.price_range.system)}</span>}
          </div>
          <details className="mt-2">
            <summary className="text-[10px] text-gray-400 cursor-pointer hover:text-gray-600">Technical: combination signature</summary>
            <p className="text-[10px] font-mono text-gray-500 mt-1">unique_combination = brick x fashion_grade x effective_attributes x MRP</p>
          </details>
        </div>
      </div>

      {/* Step 2: Rate of Sale (RA-07: business-first label) */}
      <div className="bg-white rounded-lg border border-gray-200 p-3">
        <div className="flex items-center gap-2 mb-3">
          <StepNumber n={step++} />
          <div>
            <p className="text-xs font-semibold text-gray-900">Rate of Sale</p>
            <p className="text-[10px] text-gray-400">
              {sourceType === 'ftf' ? 'Predicted demand velocity from FTF engine' : 'How quickly this merchandise sells per store'}
            </p>
          </div>
        </div>
        {sourceType !== 'ftf' && hasHistorical ? (
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-xs mb-2">
              <Calculator className="w-3.5 h-3.5 text-gray-500" />
              <span className="font-semibold text-gray-900">Blended rate of sale</span>
              <span className="font-bold text-gray-900">{systemRosPerStore ?? '—'} qty/store</span>
            </div>
            <p className="text-[10px] text-gray-500">Weighted average of last-year and recent 3-month performance.</p>
            <details className="mt-2">
              <summary className="text-[10px] text-gray-400 cursor-pointer hover:text-gray-600">Calculation details</summary>
              <div className="mt-2 space-y-0.5 divide-y divide-gray-100">
                <p className="text-[10px] font-mono text-gray-500 mb-1">Demand_ROS = weighted_average(LY_ROS, L3M_ROS)</p>
                <MathRow label="Last Year (LY) ROS" formula="Pending — requires LY ROS from API" value="—" />
                <MathRow label="Last 3 Month (L3M) ROS" formula="Pending — requires L3M ROS from API" value="—" />
              </div>
            </details>
          </div>
        ) : sourceType === 'ftf' ? (
          <div className="bg-gray-50 rounded-lg p-3 space-y-2.5">
            <p className="text-xs text-gray-600">
              {hasHistorical ? 'FTF engine overrides historical — detected demand shift.' : 'No historical data. Demand predicted by FTF engine.'}
            </p>
            <div className="flex items-start gap-2">
              <ArrowRight className="w-3 h-3 text-gray-400 mt-0.5 shrink-0" />
              <p className="text-xs text-gray-700"><span className="font-medium">Similar-brick proxy performance</span></p>
            </div>
            <div className="flex items-start gap-2">
              <ArrowRight className="w-3 h-3 text-gray-400 mt-0.5 shrink-0" />
              <p className="text-xs text-gray-700"><span className="font-medium">Market demand signal</span></p>
            </div>
            <div className="flex items-start gap-2">
              <ArrowRight className="w-3 h-3 text-gray-400 mt-0.5 shrink-0" />
              <p className="text-xs text-gray-700"><span className="font-medium">Store cluster affinity</span></p>
            </div>
            {systemRosPerStore != null && (
              <div className="border-t border-gray-200 pt-2 mt-1 flex items-center gap-2 text-xs">
                <Calculator className="w-3.5 h-3.5 text-gray-500" />
                <span className="font-semibold text-gray-900">Predicted rate of sale</span>
                <span className="font-bold text-gray-900">{systemRosPerStore} qty/store</span>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500">No demand data available.</p>
          </div>
        )}
      </div>

      {/* Step 3: Selection Threshold (RA-07: business-first) */}
      <div className="bg-white rounded-lg border border-gray-200 p-3">
        <div className="flex items-center gap-2 mb-3">
          <StepNumber n={step++} />
          <div>
            <p className="text-xs font-semibold text-gray-900">Selection Threshold</p>
            <p className="text-[10px] text-gray-400">Whether this combination meets the minimum demand bar</p>
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" size="sm">Pending</Badge>
            <span className="text-xs text-gray-500">Anchor Range (high demand) or Threshold-Qualified (meets cutoff)</span>
          </div>
          <details className="mt-2">
            <summary className="text-[10px] text-gray-400 cursor-pointer hover:text-gray-600">Calculation details</summary>
            <div className="mt-2 space-y-2">
              <MathRow label="Selection threshold (P80)" formula="Pending — requires P80(ROS) from API" value="—" />
              <MathRow label="Tolerance cutoff" formula="P80 x 0.80" value="—" />
            </div>
          </details>
        </div>
      </div>

      {/* Step 4: Store Capacity (RA-07: business-first label) */}
      <div className="bg-white rounded-lg border border-gray-200 p-3">
        <div className="flex items-center gap-2 mb-3">
          <StepNumber n={step++} />
          <div>
            <p className="text-xs font-semibold text-gray-900">Store Capacity</p>
            <p className="text-[10px] text-gray-400">How this combination fits available shelf space</p>
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="space-y-0.5 divide-y divide-gray-100">
            <MathRow label="Selected options" value={`${row.option_count.system}`} />
            <MathRow label="Stores covered" value={storeCount > 0 ? `${storeCount} stores` : '—'} />
          </div>
          <details className="mt-2">
            <summary className="text-[10px] text-gray-400 cursor-pointer hover:text-gray-600">Calculation details</summary>
            <div className="mt-2 space-y-0.5 divide-y divide-gray-100">
              <MathRow label="Planogram slots" formula="Pending — requires planogram data" value="—" />
              <MathRow label="Fill rate" formula="selected / slots (target: 50-95%)" value="—" />
            </div>
          </details>
        </div>
      </div>


      {/* Option Count */}
      <div className="bg-white rounded-lg border border-gray-200 p-3">
        <div className="flex items-center gap-2 mb-3">
          <StepNumber n={step++} />
          <div>
            <p className="text-xs font-semibold text-gray-900">Option Count</p>
            <p className="text-[10px] text-gray-400">How many distinct options to carry</p>
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 space-y-0.5 divide-y divide-gray-100">
          <MathRow label="System recommendation" value={`${row.option_count.system} options`} />
          {hasHistorical && (
            <MathRow label="vs Historical" value={optionChange != null ? `${optionChange > 0 ? '+' : ''}${optionChange} (${optionChangePct != null ? `${optionChangePct > 0 ? '+' : ''}${optionChangePct}%` : '-'})` : '-'} />
          )}
          {row.option_count.buyer != null && row.option_count.buyer !== row.option_count.system && (
            <MathRow label="Buyer override" value={`${row.option_count.buyer} options`} />
          )}
          {row.color_count != null && row.color_count > 0 && (
            <MathRow label="Color variants" value={`${row.color_count} colors`} />
          )}
        </div>
      </div>

      {/* System Conclusion — data-driven narrative (RA-05) */}
      <div className={cn(
        'rounded-lg p-3 border',
        lifecycle === 'new_introduction' ? 'bg-blue-50 border-blue-200'
          : narrative.optionMovement === 'increase' ? 'bg-emerald-50 border-emerald-200'
            : narrative.optionMovement === 'decrease' ? 'bg-amber-50 border-amber-200'
              : 'bg-blue-50 border-blue-200',
      )}>
        <div className="flex items-start gap-2">
          <Target className={cn(
            'w-4 h-4 mt-0.5 shrink-0',
            lifecycle === 'new_introduction' ? 'text-blue-600'
              : narrative.optionMovement === 'increase' ? 'text-emerald-600'
                : narrative.optionMovement === 'decrease' ? 'text-amber-600' : 'text-blue-600',
          )} />
          <div className="flex-1 min-w-0">
            <p className={cn(
              'text-sm font-semibold',
              lifecycle === 'new_introduction' ? 'text-blue-900'
                : narrative.optionMovement === 'increase' ? 'text-emerald-900'
                  : narrative.optionMovement === 'decrease' ? 'text-amber-900' : 'text-blue-900',
            )}>
              {narrative.selectionRationale}
            </p>
            <p className={cn(
              'text-xs mt-1',
              lifecycle === 'new_introduction' ? 'text-blue-700'
                : narrative.optionMovement === 'increase' ? 'text-emerald-700'
                  : narrative.optionMovement === 'decrease' ? 'text-amber-700' : 'text-blue-700',
            )}>
              {narrative.demandEvidence}
            </p>
            <p className={cn(
              'text-xs mt-1',
              lifecycle === 'new_introduction' ? 'text-blue-600'
                : narrative.optionMovement === 'increase' ? 'text-emerald-600'
                  : narrative.optionMovement === 'decrease' ? 'text-amber-600' : 'text-blue-600',
            )}>
              {narrative.capacityResult}
            </p>
          </div>
        </div>
      </div>

      {/* Duplicate callout */}
      {isGrey(row) && (
        <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-900">Duplicate Record</p>
              <p className="text-xs text-amber-700 mt-1">
                Vendor Catalogue record matching a Range Architecture record
                {row.match_score != null && ` with ${Math.round(row.match_score * 100)}% attribute similarity`}.
                The RA record takes priority.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
