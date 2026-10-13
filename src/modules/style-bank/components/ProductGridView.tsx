import { useState, useMemo } from 'react';
import { ThumbsUp, ThumbsDown, PackageSearch } from 'lucide-react';
import type { Product } from '../types/types';
import type { ShowroomStyle } from '../types/showroom-types';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/ui';

interface ProductGridViewProps {
  products: Product[];
  showroomStyles: ShowroomStyle[];
  onProductClick: (product: Product) => void;
  sortKey?: string;
  compact?: boolean;
  className?: string;
}

type SortKey = 'newest' | 'price-asc' | 'price-desc' | 'margin-asc' | 'margin-desc' | 'name-az';

export function ProductGridView({
  products,
  showroomStyles,
  onProductClick,
  sortKey: sortKeyProp = 'newest',
  compact = false,
  className,
}: ProductGridViewProps) {
  const sortKey = sortKeyProp as SortKey;

  // Build lookup map for ShowroomStyle by product ID
  const styleMap = useMemo(() => {
    const map = new Map<string, ShowroomStyle>();
    showroomStyles.forEach((s) => map.set(s.product.id, s));
    return map;
  }, [showroomStyles]);

  // Sort products locally
  const sortedProducts = useMemo(() => {
    const sorted = [...products];
    switch (sortKey) {
      case 'newest':
        sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'price-asc':
        sorted.sort((a, b) => a.price.mrp - b.price.mrp);
        break;
      case 'price-desc':
        sorted.sort((a, b) => b.price.mrp - a.price.mrp);
        break;
      case 'margin-asc': {
        sorted.sort((a, b) => {
          const mA = styleMap.get(a.id)?.commercial.margin ?? 0;
          const mB = styleMap.get(b.id)?.commercial.margin ?? 0;
          return mA - mB;
        });
        break;
      }
      case 'margin-desc': {
        sorted.sort((a, b) => {
          const mA = styleMap.get(a.id)?.commercial.margin ?? 0;
          const mB = styleMap.get(b.id)?.commercial.margin ?? 0;
          return mB - mA;
        });
        break;
      }
      case 'name-az':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }
    return sorted;
  }, [products, sortKey, styleMap]);

  if (products.length === 0) {
    return (
      <EmptyState
        icon={PackageSearch}
        title="No products found"
        description="Try adjusting your filters to see more results."
        className={className}
      />
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Product grid */}
      <div
        className={cn(
          'grid gap-3',
          compact
            ? 'grid-cols-2 lg:grid-cols-3'
            : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5'
        )}
      >
        {sortedProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            showroomStyle={styleMap.get(product.id)}
            onClick={() => onProductClick(product)}
          />
        ))}
      </div>
    </div>
  );
}

// ── Product Card ─────────────────────────────────────────────────────────

interface ProductCardProps {
  product: Product;
  showroomStyle?: ShowroomStyle;
  onClick: () => void;
}

function ProductCard({ product, showroomStyle, onClick }: ProductCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  return (
    <div
      className={cn(
        'bg-white rounded-lg border border-gray-200 overflow-hidden cursor-pointer',
        'hover:border-primary/30 hover:shadow-md transition-all duration-200',
        'group'
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {/* Image area — 3:4 aspect ratio */}
      <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
        {!imageError ? (
          <img
            src={product.primaryImage}
            alt={product.name}
            className={cn(
              'w-full h-full object-cover transition-opacity duration-300',
              imageLoaded ? 'opacity-100' : 'opacity-0'
            )}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <PackageSearch className="w-8 h-8" />
          </div>
        )}

        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 animate-pulse bg-gray-200" />
        )}

        {/* Hover action buttons */}
        <div
          className={cn(
            'absolute inset-x-0 bottom-0 p-2 flex justify-center gap-2',
            'bg-gradient-to-t from-black/40 to-transparent',
            'opacity-0 group-hover:opacity-100 touch:opacity-100 transition-opacity duration-200'
          )}
        >
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); }}
            className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white text-xs font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
            aria-label="Shortlist"
          >
            <ThumbsUp className="w-3 h-3" />
            <span>Shortlist</span>
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); }}
            className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition-colors shadow-sm"
            aria-label="Reject"
          >
            <ThumbsDown className="w-3 h-3" />
            <span>Reject</span>
          </button>
        </div>
      </div>

      {/* Card body */}
      <div className="p-3">
        {/* Name — single line truncated */}
        <h3 className="text-sm font-semibold text-gray-900 truncate">
          {product.name}
        </h3>

        {/* Brand — muted */}
        <p className="text-xs text-gray-500 mt-0.5 truncate">{product.brand}</p>

        {/* Colorway dots */}
        <div className="flex items-center gap-1 mt-2">
          {product.colors.slice(0, 5).map((color, idx) => (
            <span
              key={idx}
              className="w-4 h-4 rounded-full border border-gray-200"
              // eslint-disable-next-line no-restricted-syntax -- dynamic color from product data
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
          {product.colors.length > 5 && (
            <span className="text-[10px] text-gray-500 font-medium ml-0.5">
              +{product.colors.length - 5}
            </span>
          )}
        </div>

        {/* Shortlist status indicators */}
        {showroomStyle && (
          <div className="flex items-center gap-2 mt-2">
            <ShortlistIndicator label="D" status={showroomStyle.shortlistStatus.designer} />
            <ShortlistIndicator label="B" status={showroomStyle.shortlistStatus.buyer} />
            <ShortlistIndicator label="C" status={showroomStyle.shortlistStatus.categoryHead} />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Shortlist status indicator ───────────────────────────────────────────

function ShortlistIndicator({
  label,
  status,
}: {
  label: string;
  status: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-[10px] font-semibold',
        status === 'shortlisted' && 'text-green-600',
        status === 'rejected' && 'text-red-500',
        (status === 'pending' || status === 'needs_modification') && 'text-gray-400'
      )}
    >
      {label}
      {status === 'shortlisted' ? '\u2713' : status === 'rejected' ? '\u2715' : '\u25CB'}
    </span>
  );
}
