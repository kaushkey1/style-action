/* eslint-disable design-system/prefer-section-header, design-system/prefer-metric-grid -- range architecture uses custom layouts */
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronDown, ChevronRight as ChevronRightIcon, Package, Download } from "lucide-react";
import { useDownload } from "@/hooks/useDownload";
import { KpiCard } from "../components/KpiCard";
import { BrickReviewTable } from "../components/BrickReviewTable";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  EmptyState,
  ShimmerKpiGrid,
  ShimmerTable,
  ShimmerCard,
  Input,
  Button,
} from "@/components/ui";
import { cn, formatCurrency } from "@/lib/utils";
import { useRangeStore } from "../stores/useRangeStore";
import { useHits, useFamilyDetail, useBricks, useSegments, useUpdateBuyerEdit, type BuyerEditPayload } from "../api/rangeHooks";

// Helper function to get full category name from segment code
const getCategoryNameFromSegmentCode = (segmentCode: string): string => {
  const mapping: Record<string, string> = {
    "seg-mw-formal-shirts": "Men Western: Formal Shirts",
    "seg-mw-casual-shirts": "Men Western: Casual Shirts",
    "seg-mw-denim": "Men Western: Denim Bottoms",
    "seg-mw-casual-tshirts": "Men Western: Casual T-shirts",
    "seg-mw-non-denim": "Men Western: Non-Denim Bottoms",
    "seg-mw-formal-trouser": "Men Western: Formal Trouser & Suits",
    "seg-mi-festive": "Men Indian: Festive Wear",
    "seg-mw-sports": "Men: Sports / Athleisure",
    "seg-ww-western-tops": "Women: Western Tops",
    "seg-ww-dresses": "Women: Western Dress, Jackets and Blazers",
    "seg-ww-denim": "Women Western: Denim Bottoms",
    "seg-ww-non-denim": "Women Western: Non-Denim Bottoms",
    "seg-ww-kurta": "Women Indian: Kurta/SKD/Bottoms",
    "seg-ww-saree": "Women Indian: Saree/Lehenga",
    "seg-wif-festive": "Women Indian/Fusion: Festive SKD",
    "seg-ww-sports": "Women: Sports / Athleisure",
    "seg-kw-infant": "Kids: Infant",
    "seg-kw-boys": "Kids: Boys",
    "seg-kw-girls": "Kids: Girls",
  };
  return mapping[segmentCode] || segmentCode;
};

export default function RAFamilyDetailPage() {
  const { segmentId, familyId } = useParams();
  const navigate = useNavigate();
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  const { download, isDownloading } = useDownload();
  const { mutateAsync: mutateBuyerEdit } = useUpdateBuyerEdit();
  const selectedHit = useRangeStore((s) => s.selectedHit);
  const selectHit = useRangeStore((s) => s.selectHit);
  const bricksPage = useRangeStore((s) => s.bricksPage);
  const bricksPageSize = useRangeStore((s) => s.bricksPageSize);
  const setBricksPage = useRangeStore((s) => s.setBricksPage);
  const setBricksPageSize = useRangeStore((s) => s.setBricksPageSize);

  const { data: availableHits } = useHits();
  const { data: segmentsData } = useSegments(selectedHit ?? '');
  const segments = segmentsData?.segments ?? [];
  const { data: familyDetail, isLoading: familyDetailLoading } = useFamilyDetail(segmentId ?? '', familyId ?? '', selectedHit ?? '');
  const { data: bricksData, isLoading: bricksLoading } = useBricks(segmentId ?? '', familyId ?? '', selectedHit ?? '', bricksPage, bricksPageSize);
  const bricks = bricksData?.bricks ?? [];
  const bricksPagination = bricksData?.pagination ?? null;

  useEffect(() => {
    if (availableHits?.default_hit && !selectedHit) {
      selectHit(availableHits.default_hit);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- set default hit when data arrives
  }, [availableHits]);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => (prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]));
  };

  const handleSegmentChange = (newSegmentId: string) => {
    navigate(`/ra/segment/${newSegmentId}`);
  };

  const handleBrickSave = async (resultId: string, payload: BuyerEditPayload) => {
    await mutateBuyerEdit({ resultId, payload });
    // React Query invalidation in useUpdateBuyerEdit handles refetch
  };

  const handlePageChange = (page: number) => {
    setBricksPage(page);
  };

  const handlePageSizeChange = (size: string) => {
    const newSize = parseInt(size);
    setBricksPageSize(newSize);
  };

  // Show loading if hits haven't resolved yet OR data is actively loading
  if (!selectedHit || familyDetailLoading || bricksLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 h-[132px]" />
        <div className="px-6 py-6 space-y-6">
          <ShimmerKpiGrid />
          <ShimmerCard />
          <ShimmerTable rows={8} />
        </div>
      </div>
    );
  }

  if (!familyDetail) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <EmptyState
          icon={Package}
          title="Family not found"
          description="Unable to load family data. Please select a valid family."
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        {/* Row 1: Title */}
        <div className="h-[52px] px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/ra/segment/${segmentId}`)}
              className="p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h1 className="text-base font-bold text-gray-900 whitespace-nowrap">Range Architecture</h1>
            {segments.length > 0 && (
              <Select value={segmentId} onValueChange={handleSegmentChange}>
                <SelectTrigger className="min-w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {segments.map((s) => (
                    <SelectItem key={s.segment_code} value={s.segment_code}>
                      {getCategoryNameFromSegmentCode(s.segment_code)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          {selectedHit && (
            <div className="text-sm font-semibold text-primary-700 bg-indigo-50 border border-indigo-200 rounded-lg px-3.5 py-1.5">
              {selectedHit}
            </div>
          )}
        </div>

        {/* Row 2: Main Navigation */}
        <div className="h-[40px] px-6 flex items-center">
          <div className="flex gap-6">
            <button
              onClick={() => navigate("/range")}
              className="font-normal text-gray-500 border-b-2 border-transparent pb-2 hover:text-gray-700"
            >
              Network Overview
            </button>
            <button
              onClick={() => navigate("/ra/store-range")}
              className="font-normal text-gray-500 border-b-2 border-transparent pb-2 hover:text-gray-700"
            >
              Store Range
            </button>
          </div>
        </div>

        {/* Family Header */}
        <div className="px-6 py-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/ra/segment/${segmentId}`)}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
            >
              <ChevronLeft className="w-3 h-3" />
              Back to {segmentId ? getCategoryNameFromSegmentCode(segmentId) : "Category"}
            </button>
            <span className="text-xs text-gray-400">·</span>
            <h2 className="text-sm font-semibold text-gray-900">{familyDetail.family_name}</h2>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6">
        {/* Zone 1: KPIs */}
        <div className="grid grid-cols-4 gap-3">
          <KpiCard
            label="Options Planned"
            value={familyDetail.performance.options_planned.toString()}
            unit="options"
            status="Ongoing"
            target={
              familyDetail.performance.progress_pct != null ? `${familyDetail.performance.progress_pct}% progress` : ""
            }
            progressValue={familyDetail.performance.progress_pct ?? undefined}
          />
          <KpiCard
            label="Budget"
            value={formatCurrency(familyDetail.performance.budget)}
            unit=""
            status="Ongoing"
            target={
              familyDetail.performance.contribution_pct != null
                ? `${familyDetail.performance.contribution_pct}% contribution`
                : ""
            }
          />
          <KpiCard
            label="Store Coverage"
            value={familyDetail.performance.store_count.toString()}
            unit="stores"
            status="Healthy"
            target=""
          />
          <KpiCard
            label="Core / Fashion"
            value={`${familyDetail.composition.core_pct} / ${familyDetail.composition.fashion_pct}`}
            unit="% split"
            status="Ongoing"
            target={`ASP: ${formatCurrency(familyDetail.composition.blended_asp)}`}
          />
        </div>

        {/* Zone 2: Composition Detail */}
        <div className="bg-white rounded-lg border border-gray-200 mt-6">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Composition</h3>
          </div>
          <div className="p-4 grid grid-cols-5 gap-4">
            <div>
              <div className="text-xs text-gray-400 mb-1">Core %</div>
              <div className="text-lg font-semibold text-gray-900">{familyDetail.composition.core_pct}%</div>
            </div>
            <div>
              <div className="text-xs text-gray-400 mb-1">Fashion %</div>
              <div className="text-lg font-semibold text-gray-900">{familyDetail.composition.fashion_pct}%</div>
            </div>
            <div>
              <div className="text-xs text-gray-400 mb-1">Blended ASP</div>
              <div className="text-lg font-semibold text-gray-900">
                {formatCurrency(familyDetail.composition.blended_asp)}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-400 mb-1">Price Min</div>
              <div className="text-lg font-semibold text-gray-900">
                {formatCurrency(familyDetail.composition.price_range_min)}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-400 mb-1">Price Max</div>
              <div className="text-lg font-semibold text-gray-900">
                {formatCurrency(familyDetail.composition.price_range_max)}
              </div>
            </div>
          </div>
        </div>

        {/* Zone 3: Bricks Table */}
        <div className="bg-white rounded-lg border border-gray-200 mt-6">
          <div className="px-4 py-3 border-b border-gray-100 flex items-start justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Bricks</h3>
              <p className="text-xs text-gray-400 mt-0.5">Brick-level breakdown for {familyDetail.family_name}</p>
            </div>
            {segmentId && familyId && (
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  download(`/range/segments/${segmentId}/families/${familyId}/bricks`, "range_bricks.xlsx", {
                    params: { hit: selectedHit },
                  })
                }
                disabled={isDownloading}
                className="shrink-0"
              >
                <Download className="w-4 h-4 mr-1.5" />
                {isDownloading ? "Downloading..." : "Download"}
              </Button>
            )}
          </div>

          {bricks.length > 0 ? (
            <>
              <BrickReviewTable bricks={bricks} onSave={handleBrickSave} />

              {/* Pagination Bar */}
              {bricksPagination && (
                <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">Rows per page</span>
                    <Select value={bricksPageSize.toString()} onValueChange={handlePageSizeChange}>
                      <SelectTrigger className="w-[70px] h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[10, 20, 50, 100].map((size) => (
                          <SelectItem key={size} value={size.toString()}>
                            {size}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="text-xs text-gray-500">
                      {(bricksPage - 1) * bricksPageSize + 1}–
                      {Math.min(bricksPage * bricksPageSize, bricksPagination.total_records)} of{" "}
                      {bricksPagination.total_records}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">Page</span>
                    <Input
                      type="number"
                      min={1}
                      max={bricksPagination.total_pages}
                      value={bricksPage}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (val >= 1 && val <= bricksPagination.total_pages) {
                          handlePageChange(val);
                        }
                      }}
                      className="w-14 h-7 text-xs text-center"
                    />
                    <span className="text-xs text-gray-500">of {bricksPagination.total_pages}</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handlePageChange(bricksPage - 1)}
                        disabled={bricksPage <= 1}
                        className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="w-4 h-4 text-gray-500" />
                      </button>
                      <button
                        onClick={() => handlePageChange(bricksPage + 1)}
                        disabled={bricksPage >= bricksPagination.total_pages}
                        className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ChevronRightIcon className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="py-12">
              <EmptyState
                icon={Package}
                title="No bricks found"
                description={`No bricks available for ${familyDetail.family_name}`}
              />
            </div>
          )}
        </div>

        {/* Zone 4: Attribute Breakdowns (Collapsible) */}
        {familyDetail.attributes && (
          <div className="mt-8">
            <div className="text-sm font-medium text-gray-500 mb-3">Attribute Breakdown</div>
            <div className="flex flex-wrap gap-2">
              {["Silhouettes", "Fabric Types", "Patterns", "Colors"].map((section) => (
                <button
                  key={section}
                  onClick={() => toggleSection(section)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                    expandedSections.includes(section)
                      ? "bg-indigo-50 text-primary-700 border border-indigo-200"
                      : "bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100",
                  )}
                >
                  <span>{section}</span>
                  <ChevronDown
                    className={cn(
                      "w-3 h-3 transition-transform",
                      expandedSections.includes(section) ? "rotate-180" : "",
                    )}
                  />
                </button>
              ))}
            </div>

            {expandedSections.length > 0 && (
              <div className="mt-4 space-y-4">
                {expandedSections.map((section) => {
                  const data =
                    section === "Silhouettes"
                      ? familyDetail.attributes.silhouettes
                      : section === "Fabric Types"
                        ? familyDetail.attributes.fabric_types
                        : section === "Patterns"
                          ? familyDetail.attributes.patterns
                          : familyDetail.attributes.colors;

                  return (
                    <div key={section} className="bg-white rounded-lg border border-gray-200 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-gray-900">{section}</h4>
                        <button
                          onClick={() => toggleSection(section)}
                          className="text-xs text-gray-400 hover:text-gray-600"
                        >
                          Close
                        </button>
                      </div>
                      <div className="grid grid-cols-4 gap-4">
                        {data.map((item) => (
                          <div key={item.value}>
                            <div className="text-xs text-gray-400 mb-1">{item.value}</div>
                            <div className="text-lg font-semibold text-gray-900">{item.count}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Price Points */}
        {familyDetail.attributes?.price_points && (
          <div className="bg-white rounded-lg border border-gray-200 mt-4 p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Price Points</h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-xs text-gray-400 mb-1">Min</div>
                <div className="text-lg font-semibold text-gray-900">
                  {familyDetail.attributes.price_points.min != null
                    ? formatCurrency(familyDetail.attributes.price_points.min)
                    : "N/A"}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-1">Max</div>
                <div className="text-lg font-semibold text-gray-900">
                  {familyDetail.attributes.price_points.max != null
                    ? formatCurrency(familyDetail.attributes.price_points.max)
                    : "N/A"}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-1">Mode</div>
                <div className="text-lg font-semibold text-gray-900">
                  {familyDetail.attributes.price_points.mode != null
                    ? formatCurrency(familyDetail.attributes.price_points.mode)
                    : "N/A"}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
