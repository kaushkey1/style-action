import { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Loader2,
} from 'lucide-react';
import {
  DetailPanel,
  DetailPanelSection,
  DetailPanelRow,
  Badge,
  Button,
} from '@/components/ui';
import { cn, formatCurrency } from '@/lib/utils';
import type { ShowroomStyle, Colorway } from '../types/showroom-types';
import { CommentTrail } from './CommentTrail';
import { ShortlistNoteInput } from './ShortlistNoteInput';
import { useShowroomCurationStore } from '../stores/useShowroomCurationStore';

// ── Source badge mapping ─────────────────────────────────────────────────

const SOURCE_BADGE: Record<string, { label: string; variant: 'primary' | 'info' | 'success' }> = {
  daas: { label: 'AI Generated', variant: 'primary' },
  vendor: { label: 'Vendor', variant: 'info' },
  rebuy: { label: 'Re-buy', variant: 'success' },
};

// ── Props ────────────────────────────────────────────────────────────────

interface StyleDetailPanelProps {
  style: ShowroomStyle | null;
  isOpen: boolean;
  onClose: () => void;
  onShortlist: (styleId: string) => void;
  onReject: (styleId: string) => void;
  onNext?: () => void;
  onPrevious?: () => void;
  className?: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────

function getActiveColorway(
  colorways: Colorway[],
  activeColorwayId: string | null,
  localId: string | null
): Colorway | null {
  if (colorways.length === 0) return null;
  const id = localId ?? activeColorwayId;
  if (id) {
    const found = colorways.find((c) => c.id === id);
    if (found) return found;
  }
  return colorways[0] ?? null;
}


// ── Main Component ───────────────────────────────────────────────────────

export function StyleDetailPanel({
  style,
  isOpen,
  onClose,
  // onShortlist / onReject disabled — API integration pending
  // onNext / onPrevious stubbed for Phase 2 keyboard nav
  className,
}: StyleDetailPanelProps) {
  // ── Local state ──────────────────────────────────────────────────────

  const [activeColorwayId, setActiveColorwayId] = useState<string | null>(null);
  const [noteAction, setNoteAction] = useState<'shortlisted' | 'rejected' | null>(null);
  const [bomDetail, setBomDetail] = useState<ShowroomStyle | null>(null);
  const [bomLoading, setBomLoading] = useState(false);
  const [imageTab, setImageTab] = useState<'garment' | 'sheet' | 'artwork' | 'swatch'>('garment');

  const fetchStyleDetail = useShowroomCurationStore((s) => s.fetchStyleDetail);

  // Reset local state when style changes
  useEffect(() => {
    if (style) {
      setActiveColorwayId(style.activeColorwayId ?? style.colorways[0]?.id ?? null);
      setNoteAction(null);
      setBomDetail(null);
      setImageTab('garment');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Only reset when style changes
  }, [style?.product.id]);

  // Fetch BOM detail on open (API mode only)
  useEffect(() => {
    if (!style) return;

    let cancelled = false;
    setBomLoading(true);

    fetchStyleDetail(style.product.id).then((detail) => {
      if (!cancelled) {
        setBomDetail(detail);
        setBomLoading(false);
      }
    });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Only re-fetch when style changes
  }, [style?.product.id]);

  // ── Early return ─────────────────────────────────────────────────────

  if (!style) {
    return (
      <DetailPanel isOpen={isOpen} onClose={onClose} width="2xl" className={className}>
        <div className="flex items-center justify-center h-32 text-sm text-gray-500">
          Select a style to view details
        </div>
      </DetailPanel>
    );
  }

  // ── Derived data ─────────────────────────────────────────────────────

  const { product, commercial, shortlistStatus, colorways } = style;
  const activeColorway = getActiveColorway(colorways, style.activeColorwayId, activeColorwayId);
  const hasMultipleColorways = colorways.length > 1;

  // Swatches from the active colorway (or product fallback)
  const displaySwatches = activeColorway?.fabricSwatches.length
    ? activeColorway.fabricSwatches
    : style.fabricSwatches;

  // Source badge config
  const sourceBadge = SOURCE_BADGE[style.source];

  // Check if any notes exist
  const hasNotes = !!(
    shortlistStatus.designerNote ||
    shortlistStatus.buyerNote ||
    shortlistStatus.categoryHeadNote
  );

  // Header title: product name, subtitle: category · collection
  const headerTitle = product.name;
  const headerSubtitle = `${product.category} · ${product.collection}`;

  // ── Action handlers ──────────────────────────────────────────────────

  const handleNoteSubmit = (note: string) => {
    if (note.trim()) {
      const addShortlistNote = useShowroomCurationStore.getState().addShortlistNote;
      addShortlistNote(product.id, note);
    }
    setNoteAction(null);
  };

  const handleNoteDismiss = () => {
    setNoteAction(null);
  };

  // ── Render ───────────────────────────────────────────────────────────

  return (
    <DetailPanel
      isOpen={isOpen}
      onClose={onClose}
      title={headerTitle}
      subtitle={headerSubtitle}
      width="2xl"
      headerActions={
        sourceBadge ? (
          <Badge variant={sourceBadge.variant} size="sm">
            {sourceBadge.label}
          </Badge>
        ) : undefined
      }
      className={className}
    >
      {/* ── Actions (Shortlist / Reject) ──────────────────────────────── */}
      {noteAction ? (
        <div className="pb-3 mb-3 border-b border-gray-100">
          <ShortlistNoteInput
            action={noteAction}
            onSubmit={handleNoteSubmit}
            onDismiss={handleNoteDismiss}
          />
        </div>
      ) : (
        <div className="flex gap-2 pb-3 mb-3 border-b border-gray-100">
          <Button
            variant="primary"
            size="sm"
            disabled
            className="flex-1"
          >
            Shortlist
          </Button>
          <Button
            variant="destructive"
            size="sm"
            disabled
            className="flex-1"
          >
            Reject
          </Button>
        </div>
      )}

      {/* ── Colorway Selector ─────────────────────────────────────────── */}
      {hasMultipleColorways && (
        <div className="pb-3 mb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              {colorways.map((cw) => (
                <button
                  key={cw.id}
                  type="button"
                  onClick={() => setActiveColorwayId(cw.id)}
                  className={cn(
                    'w-6 h-6 rounded-full border-2 transition-all duration-200 flex-shrink-0',
                    cw.id === activeColorwayId
                      ? 'border-primary ring-2 ring-primary/20 scale-110'
                      : 'border-gray-200 hover:border-gray-400',
                    !cw.available && 'opacity-40'
                  )}
                  // eslint-disable-next-line no-restricted-syntax -- dynamic background color from data
                  style={{ backgroundColor: cw.colorHex }}
                  title={cw.available ? cw.name : `${cw.name} (unavailable)`}
                  aria-label={`Select colorway: ${cw.name}`}
                />
              ))}
            </div>
            {activeColorway && (
              <span
                className={cn(
                  'text-xs text-gray-700',
                  !activeColorway.available && 'line-through text-gray-400'
                )}
              >
                {activeColorway.name}
                {!activeColorway.available && (
                  <span className="ml-1 text-gray-400 no-underline">(unavailable)</span>
                )}
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── Image Tabs (API mode — multiple image types) ────────────────── */}
      {style.product.images.length > 1 && (
        <DetailPanelSection title="Views">
          <div className="space-y-2">
            <div className="flex gap-1">
              {(['garment', 'sheet', 'artwork', 'swatch'] as const).map((tab) => {
                const imgIndex = tab === 'garment' ? 0 : tab === 'sheet' ? 1 : tab === 'artwork' ? 2 : 3;
                const hasImage = !!style.product.images[imgIndex];
                if (!hasImage) return null;
                return (
                  <button
                    key={tab}
                    onClick={() => setImageTab(tab)}
                    className={cn(
                      'px-2.5 py-1 text-xs font-medium rounded transition-colors capitalize',
                      imageTab === tab
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                    )}
                  >
                    {tab === 'sheet' ? 'Tech Sheet' : tab}
                  </button>
                );
              })}
            </div>
            {(() => {
              const imgIndex = imageTab === 'garment' ? 0 : imageTab === 'sheet' ? 1 : imageTab === 'artwork' ? 2 : 3;
              const imgUrl = style.product.images[imgIndex];
              if (!imgUrl) return null;
              return (
                <div className="rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                  <img
                    src={imgUrl}
                    alt={`${imageTab} view`}
                    className="w-full h-auto object-contain max-h-64"
                  />
                </div>
              );
            })()}
          </div>
        </DetailPanelSection>
      )}

      {/* ── Fabric ──────────────────────────────────────────────────────── */}
      <DetailPanelSection title="Fabric">
        <div className="flex items-center gap-3">
          {displaySwatches.length > 0 && (
            <div className="flex gap-1.5">
              {displaySwatches.map((swatch, idx) => (
                <div
                  key={idx}
                  className="w-10 h-10 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0"
                >
                  <img
                    src={swatch}
                    alt={`Fabric swatch ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
          <div className="inline-block bg-gray-100 px-2.5 py-1 rounded-lg">
            <span className="text-sm font-medium text-gray-900">
              {style.fabricType}
            </span>
          </div>
        </div>
      </DetailPanelSection>

      {/* ── Silhouette Description ──────────────────────────────────────── */}
      <DetailPanelSection title="Silhouette">
        <p className="text-sm text-gray-700 leading-relaxed">
          {style.silhouetteDescription}
        </p>
      </DetailPanelSection>


      {/* ── Commercial ──────────────────────────────────────────────────── */}
      <DetailPanelSection title="Commercial">
        {commercial.mrp != null && commercial.mrp > 0 && (
          <DetailPanelRow label="Predicted Cost" value={formatCurrency(commercial.mrp)} />
        )}
        {commercial.margin != null && commercial.margin > 0 && (
          <DetailPanelRow
            label="Margin"
            value={
              <Badge dot variant={commercial.marginPass ? 'success' : 'error'} size="sm">
                {commercial.margin}%
              </Badge>
            }
          />
        )}
        {commercial.sellThroughRate != null && (
          <DetailPanelRow
            label="Predicted Sell-Through"
            value={`${commercial.sellThroughRate}%`}
          />
        )}
      </DetailPanelSection>

      {/* ── BOM Breakdown (API mode) ──────────────────────────────────── */}
      <DetailPanelSection title="Cost Breakdown">
          {bomLoading ? (
            <div className="flex items-center gap-2 text-gray-400 py-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-xs">Loading cost data...</span>
            </div>
          ) : bomDetail?.bom ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-1.5">
              {[
                { label: 'Predicted Cost', value: formatCurrency(bomDetail.bom.totalLandedCost) },
              ].map((item) => (
                <div
                  key={item.label}
                  // eslint-disable-next-line design-system/prefer-section-header -- label-value pair in BOM breakdown
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-gray-600">{item.label}</span>
                  <span className="font-medium text-gray-900">{item.value}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400">No cost data available</p>
          )}
        </DetailPanelSection>

      {/* ── Trend Attribution (optional) ────────────────────────────────── */}
      {style.trendAttribution && (
        <DetailPanelSection title="Trend Attribution">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 space-y-2">
            <p className="text-sm text-purple-800">
              &ldquo;{style.trendAttribution.signal}&rdquo;
            </p>

            {/* Signal strength bar */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-purple-600">Strength</span>
              <div className="flex-1 h-1.5 bg-purple-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full transition-all"
                  // eslint-disable-next-line no-restricted-syntax -- dynamic width percentage for signal strength bar
                  style={{ width: `${style.trendAttribution.signalStrength}%` }}
                />
              </div>
              <span className="text-xs font-medium text-purple-800">
                {style.trendAttribution.signalStrength}%
              </span>
            </div>

            {/* Trend direction */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-purple-600">Trend</span>
              <Badge
                variant={
                  style.trendAttribution.trendDirection === 'rising' ? 'success' :
                  style.trendAttribution.trendDirection === 'stable' ? 'warning' : 'error'
                }
                size="sm"
              >
                {style.trendAttribution.trendDirection === 'rising' && (
                  <TrendingUp className="w-3 h-3" />
                )}
                {style.trendAttribution.trendDirection === 'stable' && (
                  <Minus className="w-3 h-3" />
                )}
                {style.trendAttribution.trendDirection === 'declining' && (
                  <TrendingDown className="w-3 h-3" />
                )}
                {style.trendAttribution.trendDirection}
              </Badge>
            </div>

            {/* Competitor gap */}
            {style.trendAttribution.competitorGap && (
              <p className="text-xs text-purple-600">
                Competitor gap: {style.trendAttribution.competitorGap}
              </p>
            )}
          </div>
        </DetailPanelSection>
      )}


      {/* ── Historical Performance (optional) ──────────────────────────── */}
      {style.historicalPerformance && (
        <DetailPanelSection title="Historical Performance">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-1.5">
            {[
              { label: 'Prior Season', value: style.historicalPerformance.priorSeason },
              { label: 'Sell-through', value: `${style.historicalPerformance.sellThrough}%` },
              { label: 'Return Rate', value: `${style.historicalPerformance.returnRate}%` },
              { label: 'Stores Stocked', value: `${style.historicalPerformance.storesStocked}/${style.historicalPerformance.totalStores}` },
            ].map((item) => (
              <div
                key={item.label}
                // eslint-disable-next-line design-system/prefer-section-header -- label-value pair in performance breakdown
                className="flex items-center justify-between text-sm"
              >
                <span className="text-green-700">{item.label}</span>
                <span className="font-medium text-green-900">{item.value}</span>
              </div>
            ))}
            {style.historicalPerformance.refreshNote && (
              <p className="text-xs text-green-600 pt-1">
                Refresh: {style.historicalPerformance.refreshNote}
              </p>
            )}
          </div>
        </DetailPanelSection>
      )}

      {/* ── Comment Trail ───────────────────────────────────────────────── */}
      {hasNotes && (
        <DetailPanelSection title="Notes">
          <CommentTrail
            designerNote={shortlistStatus.designerNote}
            designerAt={shortlistStatus.designerAt}
            buyerNote={shortlistStatus.buyerNote}
            buyerAt={shortlistStatus.buyerAt}
            categoryHeadNote={shortlistStatus.categoryHeadNote}
            categoryHeadAt={shortlistStatus.categoryHeadAt}
          />
        </DetailPanelSection>
      )}

    </DetailPanel>
  );
}
