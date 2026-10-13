import { useNavigate, useParams, useLocation, useSearchParams } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, ImageOff } from 'lucide-react';
import { Badge, SectionHeader, MetricGrid, MetricCard, EmptyState, Skeleton } from '@/components/ui';
import { cn, formatCurrency, formatNumber } from '@/lib/utils';
import { useProductMetrics, useProductDetail } from '../api/storeProductApi';
import type { ProductDetailResponse, ProductMetricsResponse, SizeEntry } from '../api/storeProductApi';

export function ProductDetailPage(): React.ReactNode {
  const { storeId, styleCode } = useParams<{ storeId: string; styleCode: string }>();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const locationState = location.state as { fromDate?: string; toDate?: string; backLabel?: string; backPath?: string } | null;
  // Prefer URL params (survive refresh/back-nav) over navigation state.
  const fromDate = searchParams.get('dateFrom') ?? locationState?.fromDate;
  const toDate = searchParams.get('dateTo') ?? locationState?.toDate;

  const { data: metrics, isLoading: metricsLoading, isError: metricsError } = useProductMetrics(storeId, styleCode, fromDate, toDate);
  const { data: detail, isLoading: detailLoading, isError: detailError } = useProductDetail(storeId, styleCode, fromDate, toDate);

  const isLoading = metricsLoading || detailLoading;
  const isError = metricsError || detailError;

  if (!storeId || !styleCode) {
    return (
      <div className="animate-fadeInUp">
        <div className="flex items-center gap-2">
          <BackButton />
          <h1 className="min-w-0 flex-1 truncate text-lg md:text-2xl font-bold text-gray-900">Product Detail</h1>
        </div>
        <p className="text-sm text-gray-500 mt-4">Product not found.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="animate-fadeInUp">
        <div className="mb-4 flex items-center gap-2">
          <BackButton />
          <h1 className="min-w-0 flex-1 truncate text-lg md:text-2xl font-bold text-gray-900">{styleCode}</h1>
        </div>
        <div className="space-y-4">
          {/* Header card skeleton */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex gap-4">
              <Skeleton className="w-32 h-32 md:w-40 md:h-40 rounded-lg shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            </div>
          </div>
          {/* Chart section skeleton */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
            <Skeleton className="h-4 w-56" />
            <Skeleton className="h-56 w-full" />
          </div>
          {/* Metric section skeleton */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
            <Skeleton className="h-4 w-32" />
            {/* eslint-disable-next-line design-system/prefer-metric-grid -- skeleton placeholders, not MetricCards */}
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !metrics) {
    return (
      <div className="animate-fadeInUp">
        <div className="mb-4 flex items-center gap-2">
          <BackButton />
          <h1 className="min-w-0 flex-1 truncate text-lg md:text-2xl font-bold text-gray-900">{styleCode}</h1>
        </div>
        <EmptyState icon={AlertTriangle} description="Failed to load product data. Please try again." />
      </div>
    );
  }

  return (
    <div className="animate-fadeInUp space-y-4">
      <div className="flex items-center gap-2">
        <BackButton />
        <h1 className="min-w-0 flex-1 truncate text-lg md:text-2xl font-bold text-gray-900">
          {`${styleCode}${detail?.attributes?.color ? ` — ${detail.attributes.color}` : ''}`}
        </h1>
      </div>
      <ProductContent metrics={metrics} detail={detail} />
    </div>
  );
}

function BackButton(): React.ReactNode {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => navigate(-1)}
      aria-label="Go back"
      className="flex items-center justify-center h-8 w-8 -ml-1 shrink-0 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
    >
      <ArrowLeft className="w-5 h-5" />
    </button>
  );
}

function ProductContent({ metrics, detail }: {
  metrics: ProductMetricsResponse;
  detail: ProductDetailResponse | undefined;
}): React.ReactNode {
  const attrs = detail?.attributes;
  const fashionGrade = attrs?.fashion_grade_desc ?? attrs?.fashion_grade ?? '';
  const percolation = detail?.percolation;
  const summary = detail?.summary;
  const health = detail?.health_score;
  const sizeData = detail?.size_breakdown;

  const forwardCoverDisplay = metrics.forward_cover_weeks != null ? `${metrics.forward_cover_weeks}w` : '0w';

  const imageUrl = detail?.image_urls?.[0];

  return (
    <div className="space-y-4">
      {/* Header card */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex gap-4">
          <div className="w-32 h-32 md:w-40 md:h-40 bg-gray-100 rounded-lg overflow-hidden shrink-0 flex items-center justify-center ring-1 ring-inset ring-black/10">
            {imageUrl ? (
              <img src={imageUrl} alt={attrs?.color ?? 'Product'} className="w-full h-full object-contain" loading="lazy" />
            ) : (
              <ImageOff className="w-10 h-10 text-gray-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
          {fashionGrade && <Badge variant="default" size="sm" className="mb-2">{fashionGrade}</Badge>}
          {attrs && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500 flex-wrap">
              {attrs.category && <span>{attrs.category}</span>}
              {attrs.subcategory && <><span aria-hidden="true">&rsaquo;</span><span>{attrs.subcategory}</span></>}
              {attrs.brand && <><span aria-hidden="true">&rsaquo;</span><span>{attrs.brand}</span></>}
            </div>
          )}
          {metrics.markdown_pct > 0 && (
            <div className="flex items-center gap-4 mt-2">
              <span className="text-sm font-medium text-amber-700 tabular-nums">MD {metrics.markdown_pct}%</span>
            </div>
          )}
          {percolation && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-gray-500 capitalize">{percolation.state.replace('-', ' ')}</span>
            </div>
          )}
          </div>
        </div>
      </div>


      {/* Stock & flow */}
      <div>
        <SectionHeader title="Stock & Flow" />
        <MetricGrid columns={3}>
          <MetricCard label="Stock Quantity" value={formatNumber(metrics.sellable_stock)} />
          <MetricCard label="Sell Through" value={`${metrics.sell_through_pct}%`} />
          <MetricCard label="ROS (14d)" value={String(metrics.ros_14d)} />
          <MetricCard label="Days on Hand" value={metrics.days_on_hand != null ? String(metrics.days_on_hand) : '0'} />
          <MetricCard label="Weeks of Cover" value={forwardCoverDisplay} />
          <MetricCard label="Markdown %" value={`${metrics.markdown_pct}%`} />
          <MetricCard label="ASP" value={formatCurrency(metrics.asp)} />
          <MetricCard label="FP Sell Through" value={summary?.fp_sell_through_pct != null ? `${summary.fp_sell_through_pct}%` : '—'} />
          <MetricCard label="Units Sold" value={formatNumber(metrics.units_sold)} />
        </MetricGrid>
      </div>

      {/* Two-column: Percolation & Size availability */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {percolation && (
          <div>
            <SectionHeader title="Percolation & Age" />
            <MetricGrid columns={3}>
              <MetricCard label="Store Age" value={summary?.store_age_days != null ? `${summary.store_age_days}d` : '—'} subtitle={percolation.state.replace(/-/g, ' ')} />
              <MetricCard label="Option Age" value={summary?.age_days != null ? `${summary.age_days}d` : '—'} />
              <MetricCard label="GRN Date" value={attrs?.store_grn_date ?? 'N/A'} />
              <MetricCard label="Store Launch" value={summary?.store_launch_date ?? percolation.store_launch_date ?? 'N/A'} />
            </MetricGrid>
          </div>
        )}

        {sizeData && (
          <div>
            <SectionHeader
              title="Size Availability"
              inlineActions
              actions={<span className="text-xs text-gray-500">Fill rate: {sizeData.fill_rate_pct}%</span>}
            />
            <SizeGrid sizes={sizeData.sizes} />
          </div>
        )}
      </div>

      {/* Two-column: Health + Attributes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {health && (
          <div>
            <SectionHeader title="Health Score Breakdown" />
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="space-y-3">
                <HealthRow label="Sell Through Attainment" value={health.components.st_attainment} weight={45} />
                <HealthRow label="Markdown Discipline" value={health.components.markdown_discipline} weight={20} />
                <HealthRow label="Size Health" value={health.components.size_health} weight={20} />
                <HealthRow label="Age Risk" value={health.components.age_risk} weight={15} />
              </div>
            </div>
          </div>
        )}

        {attrs && (
          <div>
            <SectionHeader title="Product Attributes" />
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              {attrs.category && <AttrRow label="Category" value={attrs.category} />}
              {attrs.subcategory && <AttrRow label="Subcategory" value={attrs.subcategory} />}
              {attrs.color && <AttrRow label="Color" value={attrs.color} />}
              {attrs.segment && <AttrRow label="Segment" value={attrs.segment} />}
              {attrs.family && <AttrRow label="Family" value={attrs.family} />}
              {attrs.class_level && <AttrRow label="Class" value={attrs.class_level} />}
              {attrs.brick && <AttrRow label="Brick" value={attrs.brick} />}
              {attrs.brand && <AttrRow label="Brand" value={attrs.brand} />}
              {attrs.fabric && <AttrRow label="Fabric" value={attrs.fabric} />}
              {attrs.fit && <AttrRow label="Fit" value={attrs.fit} />}
              {attrs.sleeve && <AttrRow label="Sleeve" value={attrs.sleeve} />}
              {attrs.neckline && <AttrRow label="Neckline" value={attrs.neckline} />}
              {attrs.pattern && <AttrRow label="Pattern" value={attrs.pattern} />}
              {attrs.mood && <AttrRow label="Mood" value={attrs.mood} />}
              {attrs.length1 && <AttrRow label="Length" value={attrs.length1} />}
              {attrs.season && <AttrRow label="Season" value={`${attrs.season}${attrs.season_year ? ` ${attrs.season_year}` : ''}`} />}
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

function AttrRow({ label, value }: { label: string; value: string }): React.ReactNode {
  return (
    <div>
      <span className="text-xs text-gray-500">{label}</span>
      <p className="text-sm text-gray-900">{value}</p>
    </div>
  );
}


function SizeGrid({ sizes }: { sizes: SizeEntry[] }): React.ReactNode {
  return (
    /* eslint-disable-next-line no-restricted-syntax -- dynamic grid columns based on number of sizes */
    <div className="grid gap-2 mt-2" style={{ gridTemplateColumns: `repeat(${sizes.length}, minmax(0, 1fr))` }}>
      {sizes.map((s) => {
        const isOut = s.qty === 0;
        return (
          <div
            key={s.size}
            className={cn(
              'h-14 rounded-lg flex flex-col items-center justify-center text-xs border',
              isOut ? 'bg-red-50 border-red-200 text-red-700' : 'bg-white border-gray-200 text-gray-700',
            )}
          >
            <span className="font-semibold">{s.size}</span>
            <span className="tabular-nums">{isOut ? 'OOS' : s.qty}</span>
          </div>
        );
      })}
    </div>
  );
}

function HealthRow({ label, value, weight }: { label: string; value: number; weight: number }): React.ReactNode {
  return (
    <div className="flex items-center gap-3">
      <div className="w-44 shrink-0">
        <span className="text-sm text-gray-700">{label}</span>
        <span className="text-xs text-gray-400 ml-1">({weight}%)</span>
      </div>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        {/* eslint-disable-next-line no-restricted-syntax -- dynamic width from computed health component value */}
        <div className={cn('h-full rounded-full', value >= 75 ? 'bg-emerald-500' : value >= 50 ? 'bg-amber-500' : 'bg-red-500')} style={{ width: `${value}%` }} />
      </div>
      <span className="text-sm font-medium text-gray-900 tabular-nums w-10 text-right">{value}%</span>
    </div>
  );
}
