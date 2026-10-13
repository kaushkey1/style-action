import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PageHeader,
  Card,
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  EmptyState,
  SectionHeader,
  Skeleton,
} from '@/components/ui';
import {
  Search,
  Building2,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  Upload,
} from 'lucide-react';
import { UploadCatalogDialog } from '../components/UploadCatalogDialog';
import { formatRelativeTime } from '@/lib/utils';
import { useCatalogList, useCatalogFilters } from '../api/vendorCatalogHooks';

const ALL = 'all';
const ITEMS_PER_PAGE = 10;

export function BrandListingPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBrand, setFilterBrand] = useState<string>(ALL);
  const [filterSeason, setFilterSeason] = useState<string>(ALL);
  const [filterClass, setFilterClass] = useState<string>(ALL);
  const [filterBrick, setFilterBrick] = useState<string>(ALL);
  const [currentPage, setCurrentPage] = useState(1);
  const [uploadOpen, setUploadOpen] = useState(false);

  const queryParams = useMemo(
    () => ({
      brand: filterBrand === ALL ? undefined : filterBrand,
      season: filterSeason === ALL ? undefined : filterSeason,
      class_desc: filterClass === ALL ? undefined : filterClass,
      brick: filterBrick === ALL ? undefined : filterBrick,
      search: searchTerm.trim() || undefined,
      page: currentPage,
      page_size: ITEMS_PER_PAGE,
    }),
    [filterBrand, filterSeason, filterClass, filterBrick, searchTerm, currentPage],
  );

  const { data: filtersData } = useCatalogFilters();
  const { data: catalogData, isLoading, isError, refetch } = useCatalogList(queryParams);

  const items = useMemo(() => catalogData?.items ?? [], [catalogData]);
  const pagination = catalogData?.pagination;
  const totalPages = pagination?.total_pages ?? 1;
  const totalRecords = pagination?.total_records ?? 0;
  const startIndex = pagination ? (pagination.page - 1) * pagination.page_size : 0;
  const endIndex = startIndex + items.length;

  const handleRowClick = (item: typeof items[number]): void => {
    if (!item.brand || !item.class_desc || !item.brick_desc) return;
    const brandSlug = item.brand.toLowerCase().replace(/\s+/g, '-');
    const segmentSlug = item.class_desc.toLowerCase().replace(/\s+/g, '-');
    const familySlug = item.brick_desc.toLowerCase().replace(/\s+/g, '-');
    navigate(`/external-brands/${brandSlug}/${segmentSlug}/${familySlug}`, {
      state: {
        brand: item.brand,
        segment: item.class_desc,
        family: item.brick_desc,
        runId: item.run_id,
      },
    });
  };

  return (
    <div className="p-3">
      <PageHeader
        title="Catalog Buying"
        backTo={{ label: 'Range Architecture', path: '/range' }}
      />

      {/* Filters and Search */}
      <div className="mt-6">
        <div className="flex items-center gap-2">
          <Select value={filterBrand} onValueChange={(v) => { setFilterBrand(v); setCurrentPage(1); }}>
            <SelectTrigger className="w-[140px] h-8 text-gray-600 border-gray-300">
              <SelectValue placeholder="All Brands" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All Brands</SelectItem>
              {(filtersData?.brands ?? []).map((b) => (
                <SelectItem key={b} value={b}>{b}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterSeason} onValueChange={(v) => { setFilterSeason(v); setCurrentPage(1); }}>
            <SelectTrigger className="w-[140px] h-8 text-gray-600 border-gray-300">
              <SelectValue placeholder="All Seasons" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All Seasons</SelectItem>
              {(filtersData?.seasons ?? []).map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterClass} onValueChange={(v) => { setFilterClass(v); setCurrentPage(1); }}>
            <SelectTrigger className="w-[140px] h-8 text-gray-600 border-gray-300">
              <SelectValue placeholder="All Classes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All Classes</SelectItem>
              {(filtersData?.classes ?? []).map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterBrick} onValueChange={(v) => { setFilterBrick(v); setCurrentPage(1); }}>
            <SelectTrigger className="w-[140px] h-8 text-gray-600 border-gray-300">
              <SelectValue placeholder="All Bricks" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All Bricks</SelectItem>
              {(filtersData?.bricks ?? []).map((b) => (
                <SelectItem key={b} value={b}>{b}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex-1" />
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by brand or style code..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="pl-10"
            />
          </div>
          <Button variant="primary" size="sm" onClick={() => setUploadOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </Button>
        </div>
      </div>

      <UploadCatalogDialog open={uploadOpen} onOpenChange={setUploadOpen} />

      {/* Table View */}
      <div className="mt-6">
        <SectionHeader title={`Catalog Buying (${totalRecords})`} />

        <Card className="mt-4 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-3 text-xs font-medium text-gray-700 uppercase">Catalog ID</th>
                  <th className="text-left p-3 text-xs font-medium text-gray-700 uppercase">Brand</th>
                  <th className="text-left p-3 text-xs font-medium text-gray-700 uppercase">Season</th>
                  <th className="text-left p-3 text-xs font-medium text-gray-700 uppercase">Class</th>
                  <th className="text-left p-3 text-xs font-medium text-gray-700 uppercase">Brick</th>
                  <th className="text-center p-3 text-xs font-medium text-gray-700 uppercase">Styles</th>
                  <th className="text-center p-3 text-xs font-medium text-gray-700 uppercase">Articles</th>
                  <th className="text-right p-3 text-xs font-medium text-gray-700 uppercase">Quantity</th>
                  <th className="text-center p-3 text-xs font-medium text-gray-700 uppercase">Avg Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {isLoading && Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={`sk-${idx}`}>
                    <td colSpan={9} className="p-3">
                      <Skeleton className="h-8 w-full" />
                    </td>
                  </tr>
                ))}

                {!isLoading && items.map((item, idx) => (
                  <tr
                    key={`${item.run_id}-${item.class_desc}-${item.brick_desc}-${idx}`}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => handleRowClick(item)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleRowClick(item);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={`Open ${item.brand ?? ''} ${item.class_desc ?? ''} ${item.brick_desc ?? ''}`}
                  >
                    <td className="p-3">
                      <div className="text-sm font-medium text-gray-900 truncate max-w-[180px]" title={item.run_id ?? ''}>
                        {item.run_id?.slice(0, 8) ?? '—'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {item.updated_at ? formatRelativeTime(item.updated_at) : '—'}
                      </div>
                    </td>
                    <td className="p-3 text-sm text-gray-900">{item.brand ?? '—'}</td>
                    <td className="p-3 text-sm text-gray-900">{item.season ?? '—'}</td>
                    <td className="p-3 text-sm text-gray-900">{item.class_desc ?? '—'}</td>
                    <td className="p-3 text-sm text-gray-900">{item.brick_desc ?? '—'}</td>
                    <td className="p-3 text-center">
                      <span className="text-sm font-medium text-gray-900">{(item.total_styles ?? 0).toLocaleString()}</span>
                    </td>
                    <td className="p-3 text-center">
                      <span className="text-sm text-gray-900">{(item.total_articles ?? 0).toLocaleString()}</span>
                    </td>
                    <td className="p-3 text-right">
                      <span className="text-sm font-medium text-gray-900">{(item.total_qty ?? 0).toLocaleString()}</span>
                    </td>
                    <td className="p-3 text-center">
                      <span className="text-sm text-gray-900">
                        {item.avg_score != null ? item.avg_score.toFixed(1) : '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            /* eslint-disable-next-line design-system/prefer-section-header -- pagination bar, not a section header */
            <div className="flex items-center justify-between border-t p-3">
              <div className="text-sm text-gray-600">
                Showing {startIndex + 1} to {endIndex} of {totalRecords.toLocaleString()} results
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((page) => {
                      if (totalPages <= 7) return true;
                      if (page === 1 || page === totalPages) return true;
                      if (Math.abs(page - currentPage) <= 1) return true;
                      if (page === currentPage - 2 || page === currentPage + 2) return true;
                      return false;
                    })
                    .map((page, idx, arr) => (
                      <React.Fragment key={page}>
                        {idx > 0 && arr[idx - 1] !== page - 1 && (
                          <span className="px-2 text-gray-400">...</span>
                        )}
                        <Button
                          variant={page === currentPage ? 'primary' : 'ghost'}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className="min-w-[32px]"
                        >
                          {page}
                        </Button>
                      </React.Fragment>
                    ))}
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* Error State */}
          {isError && (
            <EmptyState
              icon={AlertCircle}
              title="Failed to load catalogs"
              description="Something went wrong fetching the catalog list."
              action={
                <Button variant="primary" size="sm" onClick={() => refetch()}>
                  Retry
                </Button>
              }
            />
          )}

          {/* Empty State */}
          {!isLoading && !isError && items.length === 0 && (
            <EmptyState
              icon={Building2}
              title="No catalogs found"
              description="Try adjusting your search or filters"
            />
          )}
        </Card>
      </div>
    </div>
  );
}
