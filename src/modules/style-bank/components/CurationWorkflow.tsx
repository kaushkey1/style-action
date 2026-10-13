import { useState, useMemo, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  CheckCircle2, XCircle,
  Lock, Check, MessageSquareWarning, LayoutGrid,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useShowroomCurationStore } from '../stores/useShowroomCurationStore';
import { StyleDetailPanel } from './StyleDetailPanel';
import { StageGateDialog } from './StageGateDialog';
import { SendBackDialog } from './SendBackDialog';
import { ConstraintCompliancePanel } from './ConstraintCompliancePanel';
import { MoodBoardView } from './MoodBoardView';
import type { ShowroomStyle, StyleSource } from '../types/showroom-types';
import { cn } from '@/lib/utils';
import {
  FilterBar, FilterSelect, /* FilterPills, */
  EmptyState, Button,
} from '@/components/ui';

const PODS = [
  { id: 'MW-1', name: 'Men Formal' },
  { id: 'MW-2', name: 'Men Casual' },
  { id: 'MW-3', name: 'Men Ethnic' },
  { id: 'WW-1', name: 'Women Western' },
  { id: 'WW-2', name: 'Women Ethnic' },
  { id: 'KW-1', name: 'Kids Wear' },
];


// Category options mapped from PODs
const CATEGORY_OPTIONS = [
  { value: '__all__', label: 'All Categories' },
  ...PODS.map((p) => ({ value: p.name, label: p.name })),
];

// Source filter options
const SOURCE_OPTIONS = [
  { value: '__all__', label: 'All Sources' },
  { value: 'daas', label: 'AI Generated' },
  { value: 'vendor', label: 'Vendor' },
  { value: 'rebuy', label: 'Re-buy' },
];

// Margin filter options for FilterPills — disabled for now
// const MARGIN_OPTIONS = [
//   { value: 'all', label: 'All' },
//   { value: 'passing', label: '\u226553%' },
//   { value: 'failing', label: '<53%' },
// ];

export function CurationWorkflow() {
  // Accept podId from route params
  const { podId: routePodId } = useParams<{ podId?: string }>();

  const {
    activePod, setActivePod,
    activePersona,
    filteredStyles, styles,
    setSourceFilter,
    // setMarginFilter,
    categoryFilter, setCategoryFilter,
    brandFilter, setBrandFilter,
    collectionFilter, setCollectionFilter,
    multiSelectIds, toggleMultiSelect, clearMultiSelect,
    shortlistStyle,
    selectStyle, selectedStyleId,
    showConstraintPanel, toggleConstraintPanel,
    collectionProgress,
    curateViewTab,
    lockShortlist,
    approveCollection,
    approveWithExclusions,
    sendBackCollection,
    getStageGateSummary: getStageGateSummaryAction,
    loadFilterOptions,
    fetchStyles,
    filterOptions,
    currentPage, totalCount, pageSize, setPage,
  } = useShowroomCurationStore();

  // Load data on mount in API mode (in mock mode, store already has data)
  useEffect(() => {
    loadFilterOptions();
    fetchStyles();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only, actions are stable refs
  }, []);

  // Local UI state
  const [stageGateOpen, setStageGateOpen] = useState(false);
  const [sendBackOpen, setSendBackOpen] = useState(false);
  const [localSourceFilter, setLocalSourceFilter] = useState<string>('__all__');
  const [localMarginFilter] = useState<string>('all');

  // Use route podId if available, otherwise fall back to store activePod
  const effectivePodId = routePodId ?? activePod;

  // If route has a podId and it differs from the store, sync it
  // (done via derived state, not effect, to avoid infinite loops)
  if (routePodId && routePodId !== activePod) {
    setActivePod(routePodId);
  }

  // Apply local (view-scoped) filters on top of store-filtered styles
  const displayStyles = useMemo(() => {
    let result = filteredStyles;
    if (localSourceFilter !== '__all__') {
      result = result.filter((s) => s.source === localSourceFilter);
    }
    if (localMarginFilter === 'passing') {
      result = result.filter((s) => s.commercial.marginPass);
    } else if (localMarginFilter === 'failing') {
      result = result.filter((s) => !s.commercial.marginPass);
    }
    return result;
  }, [filteredStyles, localSourceFilter, localMarginFilter]);

  // Stage counts
  const podFilter = (s: ShowroomStyle) => effectivePodId ? s.podId === effectivePodId : true;
  const stageCounts = {
    designer_shortlist: styles.filter((s) => podFilter(s) && (s.curationStage === 'designer_shortlist' || s.curationStage === 'buyer_shortlist' || s.curationStage === 'final_approved')).length,
    buyer_shortlist: styles.filter((s) => podFilter(s) && (s.curationStage === 'buyer_shortlist' || s.curationStage === 'final_approved')).length,
    final_approved: styles.filter((s) => podFilter(s) && s.curationStage === 'final_approved').length,
  };

  // Selected style for detail panel
  const selectedStyle = selectedStyleId
    ? styles.find((s) => s.product.id === selectedStyleId) ?? null
    : null;

  // Brand and collection options derived from current styles
  const brandOptions = useMemo(() => [
    { value: '__all__', label: 'All Brands' },
    ...filterOptions.brands.map((name) => ({ value: name, label: name })),
  ], [filterOptions.brands]);

  const collectionOptions = useMemo(() => [
    { value: '__all__', label: 'All Collections' },
    ...filterOptions.segments.map((name) => ({ value: name, label: name.replace(/\b\w/g, (c) => c.toUpperCase()) })),
  ], [filterOptions.segments]);

  // Send-back banner: check if the current POD has sendBacks
  const currentProgress = effectivePodId
    ? collectionProgress.find((p) => p.podId === effectivePodId)
    : null;
  const hasSendBacks = currentProgress?.sendBacks && currentProgress.sendBacks.length > 0;
  const latestSendBack = hasSendBacks ? currentProgress!.sendBacks![currentProgress!.sendBacks!.length - 1] : null;
  const sendBackFlaggedCount = latestSendBack?.flaggedStyles.length ?? 0;

  // Stage gate summary for dialogs
  const stageGateSummary = effectivePodId
    ? getStageGateSummaryAction(effectivePodId)
    : null;

  // Determine if buyer can lock shortlist (enough reviewed)
  const canLockShortlist = useMemo(() => {
    if (!effectivePodId) return false;
    const podStyles = styles.filter((s) => s.podId === effectivePodId);
    const reviewedCount = podStyles.filter((s) => s.shortlistStatus.buyer !== 'pending').length;
    return reviewedCount > 0 && reviewedCount >= podStyles.length * 0.5;
  }, [effectivePodId, styles]);

  // Styles for send-back dialog
  const sendBackDialogStyles = useMemo(() => {
    if (!effectivePodId) return [];
    return styles
      .filter((s) => s.podId === effectivePodId && s.curationStage === 'buyer_shortlist')
      .map((s) => ({ id: s.product.id, name: s.product.name, margin: s.commercial.margin }));
  }, [effectivePodId, styles]);

  // Styles for stage-gate exclusion list
  const stageGateStyles = useMemo(() => {
    if (!effectivePodId) return [];
    return styles
      .filter((s) => s.podId === effectivePodId && (s.curationStage === 'buyer_shortlist' || s.curationStage === 'final_approved'))
      .map((s) => ({ id: s.product.id, name: s.product.name, margin: s.commercial.margin, marginPass: s.commercial.marginPass }));
  }, [effectivePodId, styles]);

  // Handle filter changes — session-persistent (cascading)
  const handleCategoryChange = (val: string) => {
    setCategoryFilter(val === '__all__' ? null : val);
    // Reset child filters when parent changes
    setBrandFilter(null);
    setCollectionFilter(null);
  };

  const handleBrandChange = (val: string) => {
    setBrandFilter(val === '__all__' ? null : val);
    setCollectionFilter(null);
  };

  const handleCollectionChange = (val: string) => {
    setCollectionFilter(val === '__all__' ? null : val);
  };

  // Handle local filter changes — view-local (reset on nav)
  const handleSourceChange = (val: string) => {
    setLocalSourceFilter(val);
    // Also update store source filter for consistency
    setSourceFilter(val === '__all__' ? null : val as StyleSource);
  };

  // const handleMarginChange = (val: string) => {
  //   setLocalMarginFilter(val);
  //   setMarginFilter(val as 'all' | 'passing' | 'failing');
  // };

  // Stage gate handlers
  const handleLockShortlist = () => {
    if (effectivePodId) {
      lockShortlist(effectivePodId);
      setStageGateOpen(false);
    }
  };

  const handleApproveCollection = () => {
    if (effectivePodId) {
      approveCollection(effectivePodId);
      setStageGateOpen(false);
    }
  };

  const handleApproveWithExclusions = (excludedStyleIds: string[]) => {
    if (effectivePodId) {
      approveWithExclusions(effectivePodId, excludedStyleIds);
      setStageGateOpen(false);
    }
  };

  const handleSendBack = () => {
    setStageGateOpen(false);
    setSendBackOpen(true);
  };

  const handleSendBackSubmit = (generalComment: string, flaggedStyles: Array<{ styleId: string; comment: string }>) => {
    if (effectivePodId) {
      sendBackCollection(effectivePodId, generalComment, flaggedStyles);
      setSendBackOpen(false);
    }
  };

  // Gate type for the dialog
  const gateType = activePersona === 'category_head' ? 'approve_collection' : 'lock_shortlist';

  const podName = effectivePodId
    ? PODS.find((p) => p.id === effectivePodId)?.name ?? effectivePodId
    : 'All PODs';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col animate-fadeInUp">
      {/* Filters */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        {/* Cascading filters: Category x Brand x Collection (session-persistent) + Stage, Source, Margin (view-local) */}
        <FilterBar>
          <FilterSelect
            value={categoryFilter ?? '__all__'}
            onChange={handleCategoryChange}
            placeholder="Category"
            options={CATEGORY_OPTIONS}
            searchable
          />
          <FilterSelect
            value={brandFilter ?? '__all__'}
            onChange={handleBrandChange}
            placeholder="Brand"
            options={brandOptions}
            searchable
          />
          <FilterSelect
            value={collectionFilter ?? '__all__'}
            onChange={handleCollectionChange}
            placeholder="Collection"
            options={collectionOptions}
            searchable
          />
          <FilterSelect
            value={localSourceFilter}
            onChange={handleSourceChange}
            placeholder="Source"
            options={SOURCE_OPTIONS}
            searchable
          />
          {/* <FilterPills
            value={localMarginFilter}
            onChange={handleMarginChange}
            options={MARGIN_OPTIONS}
          /> */}
        </FilterBar>
      </div>

      {/* Send-back alert banner (W19) */}
      {hasSendBacks && latestSendBack && curateViewTab === 'styles' && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-start gap-3">
          <MessageSquareWarning className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-amber-900">
              Collection sent back by {latestSendBack.sentBackBy}
            </p>
            <p className="text-xs text-amber-700 mt-0.5 line-clamp-2">
              {latestSendBack.generalComment}
            </p>
            {sendBackFlaggedCount > 0 && (
              <p className="text-xs text-amber-600 mt-1">
                {sendBackFlaggedCount} style{sendBackFlaggedCount !== 1 ? 's' : ''} flagged for revision
              </p>
            )}
          </div>
        </div>
      )}

      {/* Bulk actions bar */}
      {multiSelectIds.length > 0 && curateViewTab === 'styles' && (
        <div className="bg-primary/5 border-b border-primary/20 px-6 py-3 flex items-center gap-4">
          <span className="text-sm font-medium text-primary">{multiSelectIds.length} selected</span>
          <button
            disabled
            className="px-3 py-1.5 bg-gray-200 text-gray-400 text-sm rounded-lg cursor-not-allowed"
          >
            Shortlist Selected
          </button>
          <button
            disabled
            className="px-3 py-1.5 bg-gray-200 text-gray-400 text-sm rounded-lg cursor-not-allowed"
          >
            Reject Selected
          </button>
          <button onClick={clearMultiSelect} className="text-sm text-gray-500 hover:text-gray-700 ml-auto focus-visible:outline-none focus-kb:ring-2 focus-kb:ring-primary focus-kb:ring-offset-2 rounded-lg">
            Clear selection
          </button>
        </div>
      )}

      {/* Content + Detail Panel in horizontal flex */}
      <div className="flex flex-1 min-h-0">
        {/* Tab content */}
        <div className="flex-1 min-w-0 overflow-y-auto">
          {curateViewTab === 'styles' && (
            <>
              {/* Style grid */}
              <div className="p-4">
                {displayStyles.length > 0 ? (
                  <>
                    {/* eslint-disable-next-line design-system/prefer-metric-grid -- curation style card grid, not metric cards */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                      {displayStyles.map((style) => (
                        <CurationCard
                          key={style.product.id}
                          // eslint-disable-next-line no-restricted-syntax -- dynamic value
                          style={style}
                          activePersona={activePersona}
                          isSelected={multiSelectIds.includes(style.product.id)}
                          onToggleSelect={() => toggleMultiSelect(style.product.id)}
                          onClick={() => selectStyle(style.product.id)}
                        />
                      ))}
                    </div>

                    {/* Pagination */}
                    {totalCount > pageSize && (
                      /* eslint-disable-next-line design-system/prefer-section-header -- pagination controls, not a section header */
                      <div className="flex items-center justify-between border-t border-gray-200 pt-4 mt-4">
                        <p className="text-sm text-gray-500">
                          Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, totalCount)} of {totalCount}
                        </p>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setPage(currentPage - 1)}
                            disabled={currentPage <= 1}
                            className={cn(
                              'p-1.5 rounded-lg border transition-colors',
                              currentPage <= 1 ? 'border-gray-200 text-gray-400 cursor-not-allowed' : 'border-gray-400 text-gray-600 hover:bg-gray-50 hover:border-gray-500',
                            )}
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <span className="text-sm text-gray-700 px-3">
                            Page {currentPage} of {Math.ceil(totalCount / pageSize)}
                          </span>
                          <button
                            onClick={() => setPage(currentPage + 1)}
                            disabled={currentPage >= Math.ceil(totalCount / pageSize)}
                            className={cn(
                              'p-1.5 rounded-lg border transition-colors',
                              currentPage >= Math.ceil(totalCount / pageSize) ? 'border-gray-200 text-gray-400 cursor-not-allowed' : 'border-gray-400 text-gray-600 hover:bg-gray-50 hover:border-gray-500',
                            )}
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  /* Empty state (W24) */
                  <EmptyState
                    icon={LayoutGrid}
                    title="No styles at this stage"
                    description="No styles match the current filters. Try adjusting the stage, source, or margin filters."
                  />
                )}
              </div>
            </>
          )}

          {curateViewTab === 'boards' && (
            <MoodBoardView />
          )}
        </div>

        {/* Constraint Compliance Panel */}
        {showConstraintPanel && (
          <ConstraintCompliancePanel onClose={toggleConstraintPanel} />
        )}

        {/* StyleDetailPanel (replaces ProductDetailModal) */}
        <StyleDetailPanel
          // eslint-disable-next-line no-restricted-syntax -- 'style' is a component prop (ShowroomStyle), not an inline CSS style
          style={selectedStyle}
          isOpen={!!selectedStyleId}
          onClose={() => selectStyle(null)}
          onShortlist={(styleId) => shortlistStyle(styleId, 'shortlisted')}
          onReject={(styleId) => shortlistStyle(styleId, 'rejected')}
        />
      </div>

      {/* Persona-specific sticky footer */}
      {curateViewTab === 'styles' && (
        <>
          {/* Buyer: Lock Shortlist */}
          {activePersona === 'buyer' && canLockShortlist && (
            /* eslint-disable-next-line design-system/prefer-section-header -- sticky footer bar with CTA, not a section header */
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-3 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                <span className="font-medium">{stageCounts.buyer_shortlist}</span> styles in buyer shortlist
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setStageGateOpen(true)}
              >
                <Lock className="w-3.5 h-3.5 mr-1.5" />
                Lock Shortlist
              </Button>
            </div>
          )}

          {/* Category Head: Approve / Send Back */}
          {activePersona === 'category_head' && (
            /* eslint-disable-next-line design-system/prefer-section-header -- sticky footer bar with approval CTAs, not a section header */
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-3 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                <span className="font-medium">{stageCounts.final_approved}</span> styles approved
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSendBackOpen(true)}
                >
                  Send Back with Comments
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setStageGateOpen(true)}
                >
                  <Check className="w-3.5 h-3.5 mr-1.5" />
                  Approve Collection
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* StageGateDialog */}
      {stageGateSummary && effectivePodId && (
        <StageGateDialog
          isOpen={stageGateOpen}
          onClose={() => setStageGateOpen(false)}
          podId={effectivePodId}
          podName={podName}
          gateType={gateType}
          onLockShortlist={handleLockShortlist}
          onApproveCollection={handleApproveCollection}
          onApproveWithExclusions={handleApproveWithExclusions}
          onSendBack={handleSendBack}
          complianceSummary={{
            totalStyles: stageGateSummary.totalStyles,
            passingStyles: stageGateSummary.marginPassCount,
            avgMargin: stageGateSummary.avgMargin,
            belowMarginFloor: stageGateSummary.marginFailCount,
            complianceScore: stageGateSummary.complianceScore,
            issues: stageGateSummary.blockers.map((b) => ({
              severity: 'warning' as const,
              description: b,
            })),
          }}
          styles={stageGateStyles}
        />
      )}

      {/* SendBackDialog */}
      {effectivePodId && (
        <SendBackDialog
          isOpen={sendBackOpen}
          onClose={() => setSendBackOpen(false)}
          podId={effectivePodId}
          podName={podName}
          styles={sendBackDialogStyles}
          onSendBack={handleSendBackSubmit}
        />
      )}
    </div>
  );
}

interface CurationCardProps {
  style: ShowroomStyle;
  activePersona: 'designer' | 'buyer' | 'category_head';
  isSelected: boolean;
  onToggleSelect: () => void;
  onClick: () => void;
}

function CurationCard({ style, activePersona, isSelected, onToggleSelect, onClick }: CurationCardProps) {
  const currentDecision = activePersona === 'designer'
    ? style.shortlistStatus.designer
    : activePersona === 'buyer'
    ? style.shortlistStatus.buyer
    : style.shortlistStatus.categoryHead;

  return (
    <div
      className={cn(
        'bg-white rounded-lg border overflow-hidden transition-all duration-200 cursor-pointer hover:shadow-md',
        isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-gray-200 hover:border-gray-300'
      )}
    >
      {/* Image */}
      <button type="button" className="relative aspect-[3/4] overflow-hidden w-full text-left" onClick={onClick} aria-label={`View ${style.product.name}`}>
        <img
          src={style.product.primaryImage}
          alt={style.product.name}
          className="w-full h-full object-cover"
        />
        {/* Select checkbox */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleSelect(); }}
          className={cn(
            'absolute top-2 right-2 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
            isSelected ? 'bg-primary border-primary text-white' : 'bg-white/80 border-gray-300'
          )}
        >
          {isSelected && <CheckCircle2 className="w-3 h-3" />}
        </button>
      </button>

      {/* Info */}
      <div className="p-3">
        <h3 className="text-sm font-medium text-gray-900 line-clamp-1">{style.product.name}</h3>

        {/* Actions (disabled — API integration pending) */}
        {currentDecision === 'pending' && (
          <div className="flex gap-2 mt-3">
            <button
              disabled
              className="flex-1 px-2 py-1.5 bg-gray-200 text-gray-400 text-xs font-medium rounded-lg cursor-not-allowed"
            >
              Shortlist
            </button>
            <button
              disabled
              className="px-2 py-1.5 bg-gray-200 text-gray-400 text-xs font-medium rounded-lg cursor-not-allowed"
            >
              Reject
            </button>
          </div>
        )}
        {currentDecision === 'shortlisted' && (
          <div className="flex items-center gap-1 mt-3 text-green-600">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">Shortlisted</span>
          </div>
        )}
        {currentDecision === 'rejected' && (
          <div className="flex items-center gap-1 mt-3 text-red-500">
            <XCircle className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">Rejected</span>
          </div>
        )}
      </div>
    </div>
  );
}
