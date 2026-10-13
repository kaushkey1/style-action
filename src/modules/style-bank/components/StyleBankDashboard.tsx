import { useState, useMemo, useEffect } from 'react';
import {
  PackageSearch,
  X,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
// import { PinterestGrid } from './PinterestGrid';
import { ProductGridView } from './ProductGridView';
// import { CollectionGrid } from './CollectionGrid';
import { StyleDetailPanel } from './StyleDetailPanel';
import { useStyleBankStore } from '../stores/store';
import { useShowroomCurationStore } from '../stores/useShowroomCurationStore';
import type { /* BrandCollection, */ Product /* , Collection */ } from '../types/types';
import type { CurationStage, StyleSource } from '../types/showroom-types';
// import collectionData from '../data/lere27_collection.json';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Button,
  EmptyState,
} from '@/components/ui';

// const brandCollection = collectionData as BrandCollection;

const STAGE_OPTIONS: { value: CurationStage; label: string }[] = [
  { value: 'pool', label: 'All Pool' },
  { value: 'designer_shortlist', label: 'Designer' },
  { value: 'buyer_shortlist', label: 'Buyer' },
  { value: 'final_approved', label: 'Final' },
];

const SOURCE_OPTIONS: { value: StyleSource; label: string }[] = [
  { value: 'daas', label: 'AI Generated' },
  { value: 'vendor', label: 'Vendor' },
  { value: 'rebuy', label: 'Re-buy' },
];

export function StyleBankDashboard() {
  const {
    selectedCollection,
    // setSelectedCollection,
    selectedProduct,
    setSelectedProduct,
    searchQuery,
    setSearchQuery,
    discoverLayout,
    sortOrder,
  } = useStyleBankStore();

  const {
    filteredStyles,
    setActiveCurationStage,
    setSourceFilter,
    categoryFilter,
    setCategoryFilter,
    brandFilter,
    setBrandFilter,
    collectionFilter,
    setCollectionFilter,
    shortlistStyle,
    // collectionProgress,
    isLoading,
    error,
    filterOptions,
    currentPage,
    totalCount,
    pageSize,
    loadFilterOptions,
    fetchStyles,
    setPage,
  } = useShowroomCurationStore();

  // Load filter options and initial styles on mount
  useEffect(() => {
    loadFilterOptions();
    fetchStyles();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only, actions are stable refs
  }, []);

  // View-local filters (reset when navigating away)
  const [stageFilter, setStageFilter] = useState<CurationStage>('pool');
  const [localSourceFilter, setLocalSourceFilter] = useState<StyleSource | null>(null);

  // Sync local stage filter with store
  const handleStageChange = (stage: CurationStage) => {
    setStageFilter(stage);
    setActiveCurationStage(stage);
  };

  const handleSourceChange = (source: StyleSource | null) => {
    setLocalSourceFilter(source);
    setSourceFilter(source);
  };

  // Use filter options from the store (populated from API or mock data)
  const availableBrands = useMemo(
    () => filterOptions.brands.map((name) => ({ id: name, name })),
    [filterOptions.brands],
  );

  const availableCollections = useMemo(
    () => filterOptions.segments.map((name) => ({ id: name, name })),
    [filterOptions.segments],
  );

  const availableCategories = useMemo(
    () => filterOptions.categories.map((name) => ({ id: name, name })),
    [filterOptions.categories],
  );

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  // Use filteredStyles products
  const baseProducts = useMemo(() => {
    return filteredStyles.map((s) => s.product);
  }, [filteredStyles]);

  const filteredProducts = useMemo(() => {
    let products = baseProducts;

    if (selectedCollection) {
      const collectionProductIds = selectedCollection.products;
      products = products.filter((p) => collectionProductIds.includes(p.id));
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query)
      );
    }

    return products;
  }, [selectedCollection, searchQuery, baseProducts]);

  // const handleCollectionClick = (collection: Collection) => {
  //   setSelectedCollection(collection);
  // };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
  };

  const handleClearFilters = () => {
    setCategoryFilter(null);
    setBrandFilter(null);
    setCollectionFilter(null);
    handleStageChange('pool');
    handleSourceChange(null);
    setSearchQuery('');
  };

  // Check if any filters are active
  const hasActiveFilters =
    !!categoryFilter ||
    !!brandFilter ||
    !!collectionFilter ||
    stageFilter !== 'pool' ||
    !!localSourceFilter ||
    !!searchQuery;

  // Count active filters
  const activeFilterCount = [
    categoryFilter,
    brandFilter,
    collectionFilter,
    stageFilter !== 'pool' ? 1 : 0,
    localSourceFilter,
    searchQuery,
  ].filter(Boolean).length;

  // Find the ShowroomStyle for the selected product
  const selectedShowroomStyle = selectedProduct
    ? filteredStyles.find((s) => s.product.id === selectedProduct.id)
    : undefined;

  const isDetailPanelOpen = !!selectedProduct;

  // Effective layout: if a collection is drilled into, show products
  const effectiveLayout = selectedCollection ? 'collection-detail' : discoverLayout;

  return (
    <div className="min-h-screen bg-gray-50 animate-fadeInUp">
      <div className="bg-white border-b border-gray-200 px-6 py-2">
          {/* Cascading filters row */}
          <div className="flex items-center gap-3">
            {/* Category */}
            <Select
              value={categoryFilter || '__all__'}
              onValueChange={(val) => {
                setCategoryFilter(val === '__all__' ? null : val);
                // Reset dependent filters
                setBrandFilter(null);
                setCollectionFilter(null);
              }}
            >
              <SelectTrigger className="w-40" size="sm">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Categories</SelectItem>
                {availableCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Brand */}
            <Select
              value={brandFilter || '__all__'}
              onValueChange={(val) => {
                setBrandFilter(val === '__all__' ? null : val);
                // Reset dependent collection filter
                setCollectionFilter(null);
              }}
            >
              <SelectTrigger className="w-40" size="sm">
                <SelectValue placeholder="All Brands" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Brands</SelectItem>
                {availableBrands.map((brand) => (
                  <SelectItem key={brand.id} value={brand.id}>
                    {brand.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Style-level filters — hidden on Collections tab */}
            {effectiveLayout !== 'collections' && (
              <>
                {/* Collection */}
                <Select
                  value={collectionFilter || '__all__'}
                  onValueChange={(val) =>
                    setCollectionFilter(val === '__all__' ? null : val)
                  }
                >
                  <SelectTrigger className="w-40" size="sm">
                    <SelectValue placeholder="All Collections" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All Collections</SelectItem>
                    {availableCollections.map((col) => (
                      <SelectItem key={col.id} value={col.id}>
                        {col.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Stage filter (view-local) */}
                <Select
                  value={stageFilter}
                  onValueChange={(val) => handleStageChange(val as CurationStage)}
                >
                  <SelectTrigger className="w-36" size="sm">
                    <SelectValue placeholder="All Pool" />
                  </SelectTrigger>
                  <SelectContent>
                    {STAGE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Source filter (view-local) */}
                <Select
                  value={localSourceFilter ?? '__all__'}
                  onValueChange={(val) => handleSourceChange(val === '__all__' ? null : val as StyleSource)}
                >
                  <SelectTrigger className="w-36" size="sm">
                    <SelectValue placeholder="All Sources" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All Sources</SelectItem>
                    {SOURCE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Clear filters */}
                {hasActiveFilters && (
                  <button
                    onClick={handleClearFilters}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <X className="w-3 h-3" />
                    Clear ({activeFilterCount})
                  </button>
                )}
              </>
            )}
          </div>
      </div>

      {/* Main content area — grid shrinks when detail panel is open */}
      <div className="flex">
        <div
          className={cn(
            'flex-1 min-w-0 p-4 transition-all duration-200',
            isDetailPanelOpen ? 'mr-0' : ''
          )}
        >
          {/* Loading state */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin mb-3" />
              <p className="text-sm">Loading designs...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <AlertCircle className="w-8 h-8 mb-3 text-red-400" />
              <p className="text-sm font-medium text-gray-700">Failed to load designs</p>
              <p className="text-xs text-gray-400 mt-1">{error}</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => fetchStyles()}>
                Retry
              </Button>
            </div>
          ) : filteredProducts.length === 0 ? (
            /* Empty state */
            <EmptyState
              icon={PackageSearch}
              title="No styles found"
              description="Try adjusting your filters or search query to see more results."
            />
          ) : (
            <>
              {/* Feed layout — disabled for now */}
              {/* {effectiveLayout === 'feed' && (
                <PinterestGrid
                  products={filteredProducts}
                  onProductClick={handleProductClick}
                  showroomStyles={filteredStyles}
                />
              )} */}

              {/* Grid layout */}
              {effectiveLayout === 'grid' && (
                <ProductGridView
                  products={filteredProducts}
                  showroomStyles={filteredStyles}
                  onProductClick={handleProductClick}
                  sortKey={sortOrder}
                  compact={isDetailPanelOpen}
                />
              )}

              {/* Collections layout — disabled for now */}
              {/* {effectiveLayout === 'collections' && (
                <CollectionGrid
                  collections={brandCollection.collections}
                  onCollectionClick={handleCollectionClick}
                  collectionProgress={collectionProgress}
                />
              )} */}

              {/* Collection detail — disabled for now */}
              {/* {effectiveLayout === 'collection-detail' && selectedCollection && (
                <>
                  <div className="mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">Color Story:</span>
                      {selectedCollection.colorStory.map((color, idx) => (
                        <div
                          key={idx}
                          className="w-6 h-6 rounded-full border border-gray-200"
                          // eslint-disable-next-line no-restricted-syntax -- dynamic color
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>
                  <PinterestGrid
                    products={filteredProducts}
                    onProductClick={handleProductClick}
                    showroomStyles={filteredStyles}
                  />
                </>
              )} */}

              {/* Pagination */}
              {totalPages > 1 && (
                // eslint-disable-next-line design-system/prefer-section-header -- pagination bar, not a section header
                <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 mt-4 rounded-b-lg">
                  <p className="text-xs text-gray-500">
                    Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, totalCount)} of {totalCount} designs
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={currentPage <= 1}
                      onClick={() => setPage(currentPage - 1)}
                      className="p-1.5 rounded border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs text-gray-600 min-w-[80px] text-center">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      disabled={currentPage >= totalPages}
                      onClick={() => setPage(currentPage + 1)}
                      className="p-1.5 rounded border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Clear filters action for empty state */}
          {filteredProducts.length === 0 && !isLoading && !error && hasActiveFilters && (
            <div className="flex justify-center mt-4">
              <Button variant="outline" size="sm" onClick={handleClearFilters}>
                Clear Filters
              </Button>
            </div>
          )}
        </div>

        {/* Style Detail Panel as side panel */}
        <StyleDetailPanel
          // eslint-disable-next-line no-restricted-syntax -- 'style' is a component prop (ShowroomStyle), not an inline CSS style
          style={selectedShowroomStyle ?? null}
          isOpen={isDetailPanelOpen}
          onClose={() => setSelectedProduct(null)}
          onShortlist={(styleId) => shortlistStyle(styleId, 'shortlisted')}
          onReject={(styleId) => shortlistStyle(styleId, 'rejected')}
        />

      </div>
    </div>
  );
}
