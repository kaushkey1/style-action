import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { PageHeader, Button, Card } from '@/components/ui';
import { Check, X, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useExternalBrandsStore } from '../stores/useExternalBrandsStore';
import {cn, getCurrencySymbol} from '@/lib/utils';

// Mock product catalog data - Women's Western Wear
const mockCatalogProducts = [
  {
    id: 'TAS26ZWEWAM132465',
    styleCode: 'WES-FLR-DRS-01',
    name: 'FLORAL MAXI DRESS',
    image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=200&h=250&fit=crop&q=80',
    targetQuantity: 8500,
    mrp: 2299,
    cost: 920,
    matchScore: 92,
    colors: ['#8B4513', '#000000', '#FF69B4', '#4B0082', '#FFFFFF'],

    catalogAttributes: {
      fabric: 'Viscose Rayon',
      fit: 'Regular',
      pattern: 'Floral Print',
      length: '52"',
      neckline: 'V-Neck',
      sleeve: '3/4th Sleeves',
      waist: 'Elasticated',
    },

    rangeRequirements: {
      fabric: 'Viscose/Rayon',
      fit: 'Regular/Relaxed',
      pattern: 'Print/Solid',
      length: '50-54"',
      neckline: 'V-Neck/Round',
      sleeve: '3/4th/Full',
      waist: 'Elasticated/Drawstring',
    },

    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  },
  {
    id: 'TAS26ZWEWAM132466',
    styleCode: 'WES-EMB-TOP-02',
    name: 'EMBROIDERED PEASANT TOP',
    image: 'https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=200&h=250&fit=crop&q=80',
    targetQuantity: 12000,
    mrp: 1599,
    cost: 640,
    matchScore: 88,
    colors: ['#FFFFFF', '#87CEEB', '#FFB6C1', '#FAFAD2'],

    catalogAttributes: {
      fabric: '100% Cotton',
      fit: 'Relaxed',
      pattern: 'Embroidered',
      length: '26"',
      neckline: 'Round Neck',
      sleeve: 'Short Sleeves',
      hem: 'Curved',
    },

    rangeRequirements: {
      fabric: 'Cotton/Cotton Blend',
      fit: 'Regular/Relaxed',
      pattern: 'Embroidered/Print',
      length: '24-28"',
      neckline: 'Round/Square',
      sleeve: 'Short/Sleeveless',
      hem: 'Straight/Curved',
    },

    sizes: ['XS', 'S', 'M', 'L', 'XL'],
  },
  {
    id: 'TAS26ZWEWAM132467',
    styleCode: 'WES-DNM-SKT-03',
    name: 'DENIM A-LINE SKIRT',
    image: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=200&h=250&fit=crop&q=80',
    targetQuantity: 6500,
    mrp: 1899,
    cost: 760,
    matchScore: 85,
    colors: ['#4169E1', '#000080', '#696969'],

    catalogAttributes: {
      fabric: 'Denim - Cotton Stretch',
      fit: 'Regular',
      pattern: 'Solid',
      length: '22"',
      waist: 'High Rise',
      closure: 'Button & Zip',
    },

    rangeRequirements: {
      fabric: 'Denim',
      fit: 'Regular/Slim',
      pattern: 'Solid/Washed',
      length: '20-24"',
      waist: 'Mid/High Rise',
      closure: 'Button/Zip',
    },

    sizes: ['XS', 'S', 'M', 'L', 'XL'],
  },
  {
    id: 'TAS26ZWEWAM132468',
    styleCode: 'WES-BHM-DRS-04',
    name: 'BOHEMIAN TIERED DRESS',
    image: 'https://images.unsplash.com/photo-1599662875272-64de8289f6d8?w=200&h=250&fit=crop&q=80',
    targetQuantity: 7200,
    mrp: 2799,
    cost: 1120,
    matchScore: 78,
    colors: ['#FFE4B5', '#F4A460', '#DDA0DD', '#98FB98', '#FFB6C1'],

    catalogAttributes: {
      fabric: 'Cotton Voile',
      fit: 'Relaxed',
      pattern: 'Paisley Print',
      length: '48"',
      neckline: 'Off-Shoulder',
      style: 'Tiered',
    },

    rangeRequirements: {
      fabric: 'Cotton/Voile',
      fit: 'Relaxed/Loose',
      pattern: 'Print',
      length: '46-50"',
      neckline: 'Off-Shoulder/Bardot',
      style: 'Tiered/Flowy',
    },

    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
  },
  {
    id: 'TAS26ZWEWAM132469',
    styleCode: 'WES-PLZ-PNT-05',
    name: 'PALAZZO PANTS',
    image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=200&h=250&fit=crop&q=80',
    targetQuantity: 9500,
    mrp: 1699,
    cost: 680,
    matchScore: 90,
    colors: ['#000000', '#FFFFFF', '#808080', '#F5F5DC', '#8B4513'],

    catalogAttributes: {
      fabric: 'Viscose Crepe',
      fit: 'Relaxed',
      pattern: 'Solid',
      length: '42"',
      waist: 'Elasticated',
      style: 'Wide Leg',
    },

    rangeRequirements: {
      fabric: 'Viscose/Crepe',
      fit: 'Relaxed',
      pattern: 'Solid/Print',
      length: '40-44"',
      waist: 'Elasticated',
      style: 'Wide Leg/Palazzo',
    },

    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  },
  {
    id: 'TAS26ZWEWAM132470',
    styleCode: 'WES-CRP-TOP-06',
    name: 'CROP TOP WITH TASSELS',
    image: 'https://images.unsplash.com/photo-1596783074918-c84cb06531ca?w=200&h=250&fit=crop&q=80',
    targetQuantity: 5400,
    mrp: 1299,
    cost: 520,
    matchScore: 82,
    colors: ['#FF1493', '#FFFFFF', '#000000', '#FFD700'],

    catalogAttributes: {
      fabric: 'Cotton Jersey',
      fit: 'Fitted',
      pattern: 'Solid',
      length: '18"',
      neckline: 'Halter',
      details: 'Tassel Trim',
    },

    rangeRequirements: {
      fabric: 'Cotton/Jersey',
      fit: 'Fitted/Regular',
      pattern: 'Solid/Print',
      length: '16-20"',
      neckline: 'Halter/Bandeau',
      details: 'Embellished',
    },

    sizes: ['XS', 'S', 'M', 'L'],
  },
  {
    id: 'TAS26ZWEWAM132471',
    styleCode: 'WES-KFT-DRS-07',
    name: 'KAFTAN MAXI DRESS',
    image: 'https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=200&h=250&fit=crop&q=80',
    targetQuantity: 4200,
    mrp: 3299,
    cost: 1320,
    matchScore: 75,
    colors: ['#9370DB', '#FF6347', '#40E0D0', '#FFA07A', '#E0FFFF'],

    catalogAttributes: {
      fabric: 'Chiffon',
      fit: 'Oversized',
      pattern: 'Abstract Print',
      length: '54"',
      neckline: 'V-Neck',
      sleeve: 'Batwing',
    },

    rangeRequirements: {
      fabric: 'Chiffon/Georgette',
      fit: 'Oversized/Loose',
      pattern: 'Print',
      length: '52-56"',
      neckline: 'V-Neck/Boat',
      sleeve: 'Batwing/Dolman',
    },

    sizes: ['Free Size', 'Plus Size'],
  },
  {
    id: 'TAS26ZWEWAM132472',
    styleCode: 'WES-SHR-DRS-08',
    name: 'SHIRT DRESS',
    image: 'https://images.unsplash.com/photo-1565155003033-252a7073802c?w=200&h=250&fit=crop&q=80',
    targetQuantity: 8800,
    mrp: 2199,
    cost: 880,
    matchScore: 86,
    colors: ['#4169E1', '#FFFFFF', '#FFB6C1', '#90EE90'],

    catalogAttributes: {
      fabric: 'Cotton Poplin',
      fit: 'Regular',
      pattern: 'Striped',
      length: '38"',
      collar: 'Shirt Collar',
      closure: 'Button Through',
    },

    rangeRequirements: {
      fabric: 'Cotton/Poplin',
      fit: 'Regular/Relaxed',
      pattern: 'Striped/Check',
      length: '36-40"',
      collar: 'Shirt Collar',
      closure: 'Button/Zip',
    },

    sizes: ['XS', 'S', 'M', 'L', 'XL'],
  },
];

export function ExternalBrandsPage() {
  const { brandId, segmentId, familyId } = useParams();
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  const { loadSession } = useExternalBrandsStore();

  useEffect(() => {
    const sessionId = `${brandId}-${segmentId}-${familyId}`;
    loadSession(sessionId);
  }, [brandId, segmentId, familyId, loadSession]);

  const toggleProductSelection = (productId: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const toggleAllSelection = () => {
    if (selectedProducts.size === mockCatalogProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(mockCatalogProducts.map(p => p.id)));
    }
  };

  const getMatchIcon = (score: number) => {
    if (score >= 90) return <Check className="h-3 w-3" />;
    if (score >= 75) return <AlertCircle className="h-3 w-3" />;
    return <X className="h-3 w-3" />;
  };

  const getMatchColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 75) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const checkAttributeMatch = (catalogValue: string, rangeValue: string): 'match' | 'partial' | 'mismatch' => {
    const catalog = catalogValue.toLowerCase();
    const range = rangeValue.toLowerCase();

    if (catalog === range) return 'match';

    // Check ranges
    if (range.includes('-')) {
      const numCatalog = parseFloat(catalog);
      if (!isNaN(numCatalog)) {
        const parts = range.split('-').map(v => parseFloat(v.trim()));
        const min = parts[0];
        const max = parts[1];
        if (min !== undefined && max !== undefined && !isNaN(min) && !isNaN(max) && numCatalog >= min && numCatalog <= max) {
          return 'match';
        }
      }
    }

    // Check alternatives
    if (range.includes('/')) {
      const alternatives = range.split('/').map(v => v.trim());
      if (alternatives.some(alt => catalog.includes(alt))) return 'match';
    }

    if (catalog.includes(range) || range.includes(catalog)) return 'partial';

    return 'mismatch';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="px-6 py-3">
          {/* eslint-disable-next-line design-system/prefer-section-header */}
          <div className="flex items-center justify-between">
            <div>
              <PageHeader
                title="Catalog Selection"
                backTo={{ label: 'External Brands', path: '/vendor-catalog' }}
              />
              <p className="text-xs text-gray-500 mt-1">
                Review and select products from brand catalog that match your range requirements
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleAllSelection}
              >
                {selectedProducts.size === mockCatalogProducts.length ? 'Deselect All' : 'Select All'}
              </Button>
              <span className="text-sm text-gray-500">
                {selectedProducts.size} of {mockCatalogProducts.length} selected
              </span>
              <Button
                variant="primary"
                size="sm"
                disabled={selectedProducts.size === 0}
              >
                Add to Range Plan ({selectedProducts.size})
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <div className="p-4">
        {/* eslint-disable-next-line design-system/prefer-metric-grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {mockCatalogProducts.map((product) => {
            const isExpanded = expandedProduct === product.id;
            const isSelected = selectedProducts.has(product.id);

            return (
              <Card
                key={product.id}
                className={cn(
                  "overflow-hidden transition-all hover:shadow-lg",
                  isSelected && "ring-2 ring-indigo-500"
                )}
              >
                {/* Product Card */}
                <div className="relative">
                  {/* Selection Checkbox */}
                  <div className="absolute top-3 left-3 z-10">
                    {/* eslint-disable-next-line no-restricted-syntax -- Native checkbox for selection */}
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleProductSelection(product.id)}
                      className="rounded border-gray-300 bg-white/90 backdrop-blur-sm"
                    />
                  </div>

                  {/* Match Score Badge */}
                  <div className="absolute top-3 right-3 z-10">
                    <div className={cn(
                      "px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 border backdrop-blur-sm",
                      getMatchColor(product.matchScore)
                    )}>
                      {getMatchIcon(product.matchScore)}
                      {product.matchScore}%
                    </div>
                  </div>

                  {/* Product Image */}
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-48 object-cover"
                  />

                  {/* Product Info */}
                  <div className="p-4">
                    <div className="mb-3">
                      <h3 className="text-sm font-medium text-gray-900 mb-1">
                        {product.name}
                      </h3>
                      <div className="text-xs text-gray-500">
                        {product.styleCode}
                      </div>
                    </div>

                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500">MRP:</span>
                        <span className="ml-1 font-medium text-gray-900">{getCurrencySymbol()}{product.mrp}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Cost:</span>
                        <span className="ml-1 font-medium text-gray-900">{getCurrencySymbol()}{product.cost}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Qty:</span>
                        <span className="ml-1 font-medium text-gray-900">{product.targetQuantity.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Sizes:</span>
                        <span className="ml-1 font-medium text-gray-900">{product.sizes.length}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">GIM:</span>
                        <span className="ml-1 font-medium text-green-600">
                          {(((product.mrp - product.cost) / product.mrp) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">NIM:</span>
                        <span className="ml-1 font-medium text-amber-600">
                          {(((product.mrp - product.cost - (product.mrp * (product.mrp < 2500 ? 0.05 : 0.18))) / product.mrp) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    {/* Color Swatches */}
                    <div className="flex items-center gap-2 mt-3">
                      <span className="text-xs text-gray-500">Available in {product.colors.length} colors:</span>
                      <div className="flex gap-1">
                        {product.colors.map((color, idx) => (
                          <div
                            key={idx}
                            className="w-4 h-4 rounded-full border border-gray-300"
                            // eslint-disable-next-line no-restricted-syntax -- Dynamic color values required for product color swatches
                            style={{ backgroundColor: color }}
                            title={`Color ${idx + 1}`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Expand Button */}
                    <button
                      onClick={() => setExpandedProduct(isExpanded ? null : product.id)}
                      className="w-full mt-3 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100 rounded transition-colors flex items-center justify-center gap-1 font-medium"
                    >
                      {isExpanded ? (
                        <>Hide Details <ChevronUp className="h-3 w-3" /></>
                      ) : (
                        <>View Details <ChevronDown className="h-3 w-3" /></>
                      )}
                    </button>
                  </div>

                  {/* Expanded Details - Compact */}
                  {isExpanded && (
                    <div className="border-t bg-gray-50 px-4 py-3">
                      <div className="text-[11px]">
                        {/* Compact header row */}
                        {/* eslint-disable-next-line design-system/prefer-metric-grid */}
                        <div className="grid grid-cols-3 gap-x-3 mb-1.5 pb-1 border-b border-gray-200">
                          <div className="font-medium text-gray-500 uppercase">Attribute</div>
                          <div className="font-medium text-gray-500 uppercase">Catalog</div>
                          <div className="font-medium text-gray-500 uppercase text-right">Range Req.</div>
                        </div>

                        {/* Compact attribute rows */}
                        <div className="space-y-0.5">
                          {Object.entries(product.catalogAttributes).map(([key, catalogValue]) => {
                            const rangeValue = product.rangeRequirements[key as keyof typeof product.rangeRequirements];
                            if (!rangeValue) return null;

                            const matchStatus = checkAttributeMatch(catalogValue, rangeValue);

                            return (
                              // eslint-disable-next-line design-system/prefer-metric-grid
                              <div key={key} className="grid grid-cols-3 gap-x-3 py-0.5">
                                <div className="text-gray-600 capitalize truncate">
                                  {key.replace(/([A-Z])/g, ' $1').trim()}
                                </div>
                                <div className={cn(
                                  "truncate",
                                  matchStatus === 'match' && "text-green-700 font-medium",
                                  matchStatus === 'partial' && "text-amber-700",
                                  matchStatus === 'mismatch' && "text-red-700"
                                )}>
                                  {catalogValue}
                                </div>
                                <div className="text-gray-600 text-right truncate">
                                  {rangeValue}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Sizes inline */}
                        <div className="mt-2 pt-1.5 border-t border-gray-200 flex items-center gap-2">
                          <span className="text-gray-500">Sizes:</span>
                          <div className="flex gap-1">
                            {product.sizes.map(size => (
                              <span key={size} className="px-1.5 py-0 text-gray-700">
                                {size}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}