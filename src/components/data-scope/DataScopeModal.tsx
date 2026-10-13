import { useQuery } from "@tanstack/react-query";
import {
  Badge,
  Modal,
  Skeleton,
} from "@/components/ui";
import { dashboardApi, type DataScoreRow } from "@/modules/dashboard/api/dashboardApi";
import { getCurrencySymbol } from '@/lib/utils';

interface DataScopeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const INR_CR = 10_000_000;
const INR_L = 100_000;

function formatInr(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  if (abs >= INR_CR) return `${getCurrencySymbol()}${(value / INR_CR).toFixed(1)} Cr`;
  if (abs >= INR_L) return `${getCurrencySymbol()}${(value / INR_L).toFixed(1)} L`;
  return `${getCurrencySymbol()}${Math.round(value).toLocaleString("en-IN")}`;
}

/**
 * Detail surface for the Data Scope banner. Renders as a centered modal on
 * desktop and an automatic bottom-sheet on mobile (Modal handles the swap).
 */
export function DataScopeModal({ isOpen, onClose }: DataScopeModalProps): React.ReactNode {
  const { data: scoreData, isLoading: scoreLoading } = useQuery({
    queryKey: ["dataScope", "dataScore"],
    queryFn: () => dashboardApi.dataScore(10),
    enabled: isOpen,
    staleTime: 30 * 60 * 1000,
  });

  const { data: filterOptions, isLoading: filterLoading } = useQuery({
    queryKey: ["dataScope", "filterOptions"],
    queryFn: () => dashboardApi.filterOptions(),
    enabled: isOpen,
    staleTime: 30 * 60 * 1000,
  });

  const topBrands = scoreData?.top_brands ?? [];
  const brandTotal = scoreData?.total_brands ?? 0;
  const formats = filterOptions?.formats ?? [];
  const categories = filterOptions?.categories ?? [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Data Scope" size="lg">
      <div className="space-y-5 py-2">
        {scoreLoading ? <BrandsSkeleton /> : <TopBrandsSection rows={topBrands} total={brandTotal} />}
        {filterLoading ? (
          <ChipSkeleton title="Store Formats" />
        ) : formats.length > 0 ? (
          <ChipSection title="Store Formats" total={formats.length} items={formats} />
        ) : null}
        {filterLoading ? (
          <ChipSkeleton title="Categories" />
        ) : categories.length > 0 ? (
          <ChipSection title="Categories" total={categories.length} items={categories} />
        ) : null}
      </div>
    </Modal>
  );
}

function BrandsSkeleton(): React.ReactNode {
  return (
    <section>
      <div className="flex items-baseline justify-between mb-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-14" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="grid grid-cols-[1fr_auto_auto] gap-3 items-center">
            {/* eslint-disable-next-line no-restricted-syntax -- dynamic skeleton width variation */}
            <Skeleton className="h-4" style={{ width: `${60 + (i % 3) * 15}%` }} />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-10" />
          </div>
        ))}
      </div>
    </section>
  );
}

function ChipSkeleton({ title }: { title: string }): React.ReactNode {
  return (
    <section>
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</span>
        <Skeleton className="h-3 w-12" />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {Array.from({ length: 8 }).map((_, i) => (
          // eslint-disable-next-line no-restricted-syntax -- dynamic skeleton width variation
          <Skeleton key={i} className="h-6 rounded-full" style={{ width: `${48 + (i % 4) * 16}px` }} />
        ))}
      </div>
    </section>
  );
}

function SectionHeading({ title, total }: { title: string; total: number }): React.ReactNode {
  return (
    <div className="flex items-baseline justify-between mb-2">
      <h5 className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</h5>
      <span className="text-xs text-gray-400">{total} total</span>
    </div>
  );
}

function TopBrandsSection({
  rows,
  total,
}: {
  rows: DataScoreRow[];
  total: number;
}): React.ReactNode {
  return (
    <section>
      <SectionHeading title="Top Brands" total={total} />
      <div className="space-y-1.5 text-sm">
        {rows.map((row, i) => {
          const name = row.BRAND_DESC_STD?.trim() || `Brand ${i + 1}`;
          const pct = row.pct_share;
          const pctLabel = pct != null ? (pct < 1 ? "<1%" : `${pct.toFixed(1)}%`) : "—";
          return (
            <div key={name} className="grid grid-cols-[1fr_auto_auto] gap-3 text-gray-700">
              <span className="truncate">{name}</span>
              <span className="text-gray-500 text-xs">{formatInr(row.net_sales)}</span>
              <span className="text-gray-900 font-medium text-xs w-10 text-right">{pctLabel}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ChipSection({
  title,
  total,
  items,
}: {
  title: string;
  total: number;
  items: string[];
}): React.ReactNode {
  return (
    <section>
      <SectionHeading title={title} total={total} />
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <Badge key={item} className="bg-gray-100 text-gray-700 border-gray-200">
            {item}
          </Badge>
        ))}
      </div>
    </section>
  );
}
