import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Package,
  DollarSign,
  BarChart3,
  TrendingUp,
  Layers,
  Target
} from 'lucide-react';
import { PageHeader, Badge, SectionHeader } from '@/components/ui';
import { HierarchyNavigator } from '../components/HierarchyNavigator';
import {
  merchandiseHierarchy,
  getHierarchyPath
} from '../data/mockMerchandiseHierarchy';
import type { HierarchyLevel } from '../data/mockMerchandiseHierarchy';
import {cn, getCurrencySymbol} from '@/lib/utils';
import { getBuyingModelColor, BUYING_MODELS } from '@/modules/otb/types/buyingModels';
import type { BuyingModelId } from '@/modules/otb/types/buyingModels';

// ─── Hierarchy Summary Component ────────────────────────────────────────────

interface HierarchySummaryProps {
  item: HierarchyLevel;
  path: HierarchyLevel[];
}

function HierarchySummary({ item, path }: HierarchySummaryProps) {
  const sellThroughColor = item.sellThrough >= 80 ? 'text-green-600' :
                          item.sellThrough >= 70 ? 'text-amber-600' : 'text-red-600';

  // Mock BM split data based on hierarchy level
  const getBmSplit = () => {
    const splits: { bmId: BuyingModelId; percentage: number }[] = [];

    // Create a pseudo-random but consistent distribution based on item ID
    const hash = item.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

    if (hash % 3 === 0) {
      splits.push(
        { bmId: 'BM-1', percentage: 45 },
        { bmId: 'BM-2', percentage: 30 },
        { bmId: 'BM-4', percentage: 25 }
      );
    } else if (hash % 3 === 1) {
      splits.push(
        { bmId: 'BM-1', percentage: 50 },
        { bmId: 'BM-2', percentage: 20 },
        { bmId: 'BM-3', percentage: 20 },
        { bmId: 'BM-6', percentage: 10 }
      );
    } else {
      splits.push(
        { bmId: 'BM-1', percentage: 40 },
        { bmId: 'BM-4', percentage: 35 },
        { bmId: 'BM-6', percentage: 25 }
      );
    }

    return splits;
  };

  const bmSplits = getBmSplit();

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{item.name}</h2>
          <p className="text-sm text-gray-500 capitalize">{item.level} level details</p>

          {/* Breadcrumb Path */}
          <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
            {path.map((pathItem, index) => (
              <span key={pathItem.id}>
                {index > 0 && ' › '}
                {pathItem.name}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" size="sm" className="capitalize">
            {item.level}
          </Badge>
          {item.children && (
            <Badge variant="default" size="sm">
              {item.children.length} sub-items
            </Badge>
          )}
        </div>
      </div>

      {/* BM Split Display */}
      <div className="mb-6 p-3 bg-gray-50 rounded-lg">
        <div className="text-xs font-semibold text-gray-600 mb-2">Buying Model Split</div>
        <div className="flex flex-wrap gap-2">
          {bmSplits.map(split => {
            const bmColor = getBuyingModelColor(split.bmId);
            const bmMeta = BUYING_MODELS[split.bmId];
            return (
              <div key={split.bmId} className="flex items-center gap-1">
                <span className={cn(
                  "text-xs font-medium px-2 py-0.5 rounded-full",
                  bmColor.bg,
                  bmColor.text
                )}>
                  {bmMeta.code}
                </span>
                <span className="text-sm font-semibold text-gray-700">
                  {split.percentage}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Key Performance Metrics */}
      {/* eslint-disable-next-line design-system/prefer-metric-grid -- hierarchy summary with icons */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Package className="w-5 h-5 text-gray-500" />
            <span className="text-sm text-gray-500">Options</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{item.optionCount.toLocaleString()}</p>
          <p className="text-xs text-gray-500">total options</p>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Target className="w-5 h-5 text-gray-500" />
            <span className="text-sm text-gray-500">Stock Quantity</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{(item.stockQty / 1000).toFixed(0)} K</p>
          <p className="text-xs text-gray-500">pieces</p>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-gray-500" />
            <span className="text-sm text-gray-500">Revenue</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{getCurrencySymbol()}{(item.revenue / 10000000).toFixed(1)} Cr</p>
          <p className="text-xs text-gray-500">total revenue</p>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <BarChart3 className="w-5 h-5 text-gray-500" />
            <span className="text-sm text-gray-500">Sell Through</span>
          </div>
          <p className={cn('text-2xl font-bold', sellThroughColor)}>{item.sellThrough}%</p>
          <p className="text-xs text-gray-500">performance</p>
        </div>
      </div>
    </div>
  );
}

// ─── Attribute Detail Component ─────────────────────────────────────────────

interface AttributeDetailProps {
  item: HierarchyLevel;
}

function AttributeDetail({ item }: AttributeDetailProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <SectionHeader
        title="5-Key Attributes Profile"
        subtitle="Merchandise hierarchy breakdown with primary attributes"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Merchandise Hierarchy */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Layers className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-gray-900">Merchandise Hierarchy</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between p-3 bg-gray-50 rounded">
              <span className="text-sm font-medium text-gray-700">Level:</span>
              <span className="text-sm text-gray-900 capitalize">{item.level}</span>
            </div>
            <div className="flex justify-between p-3 bg-gray-50 rounded">
              <span className="text-sm font-medium text-gray-700">Name:</span>
              <span className="text-sm text-gray-900">{item.name}</span>
            </div>
            <div className="flex justify-between p-3 bg-gray-50 rounded">
              <span className="text-sm font-medium text-gray-700">ID:</span>
              <span className="text-sm text-gray-900 font-mono">{item.id}</span>
            </div>
          </div>
        </div>

        {/* Silhouettes */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-gray-900">Silhouettes</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {item.attributes.silhouette.map((silhouette, index) => (
              <Badge key={index} variant="outline" size="sm" className="bg-blue-50 text-blue-700 border-blue-200">
                {silhouette}
              </Badge>
            ))}
          </div>
        </div>

        {/* Fabric Split */}
        <div>
          { }
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-gray-900">Fabric Split</h3>
          </div>
          <div className="space-y-2">
            {item.attributes.fabricSplit.map((fabric, index) => (
              // eslint-disable-next-line design-system/prefer-section-header -- fabric split data row
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{fabric.fabric}</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-500 h-2 rounded-full"
                      style={{ width: `${fabric.percentage}%` }} // eslint-disable-line no-restricted-syntax -- dynamic width
                    />
                  </div>
                  <span className="text-xs text-gray-500 w-8">{fabric.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Prints */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-gray-900">Prints</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {item.attributes.prints.map((print, index) => (
              <Badge key={index} variant="outline" size="sm" className="bg-green-50 text-green-700 border-green-200">
                {print}
              </Badge>
            ))}
          </div>
        </div>

        {/* Colors */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-5 h-5 rounded border border-gray-300 bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500" />
            <h3 className="text-lg font-semibold text-gray-900">Colors</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {item.attributes.colors.map((color, index) => (
              <Badge key={index} variant="outline" size="sm" className="bg-pink-50 text-pink-700 border-pink-200">
                {color}
              </Badge>
            ))}
          </div>
        </div>

        {/* Price Point */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-gray-900">Price Point</h3>
          </div>
          <div className="space-y-3">
            <div className="p-4 bg-primary-50 rounded-lg">
              <p className="text-lg font-bold text-primary">{item.attributes.pricePoint.primary}</p>
              <p className="text-xs text-gray-600">Primary range</p>
            </div>
            <div className="flex justify-between text-sm">
              <div>
                <p className="text-gray-500">Min:</p>
                <p className="font-medium">{getCurrencySymbol()}{item.attributes.pricePoint.min.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-500">Max:</p>
                <p className="font-medium">{getCurrencySymbol()}{item.attributes.pricePoint.max.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page Component ────────────────────────────────────────────────────

export function RangeHierarchyDetailPage() {
  const { hierarchyId } = useParams<{ hierarchyId: string }>();
  const navigate = useNavigate();
  const [selectedChild, setSelectedChild] = useState<HierarchyLevel | null>(null);

  // Find the hierarchy item
  const findHierarchyItem = (id: string): HierarchyLevel | null => {
    const searchInLevel = (items: HierarchyLevel[]): HierarchyLevel | null => {
      for (const item of items) {
        if (item.id === id) return item;
        if (item.children) {
          const found = searchInLevel(item.children);
          if (found) return found;
        }
      }
      return null;
    };
    return searchInLevel(merchandiseHierarchy);
  };

  const hierarchyItem = hierarchyId ? findHierarchyItem(hierarchyId) : null;

  // No hierarchyId — show top-level hierarchy browser
  if (!hierarchyId) {
    return (
      <div className="animate-fadeInUp space-y-6">
        <PageHeader
          title="Merchandise Hierarchy"
          actions={
            <button
              onClick={() => navigate('/range')}
              className="flex items-center gap-2 text-primary hover:text-primary/80"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Range
            </button>
          }
        />
        <HierarchyNavigator
          data={merchandiseHierarchy}
          title="All Segments"
          showAttributes={true}
          onDrillDown={(item) => navigate(`/range/hierarchy/${item.id}`)}
        />
      </div>
    );
  }

  if (!hierarchyItem) {
    return (
      <div className="animate-fadeInUp space-y-4">
        <PageHeader
          title="Hierarchy Not Found"
          actions={
            <button
              onClick={() => navigate('/range/hierarchy')}
              className="flex items-center gap-2 text-primary hover:text-primary/80"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Hierarchy
            </button>
          }
        />
      </div>
    );
  }

  const hierarchyPath = getHierarchyPath(hierarchyItem.id);
  const children = hierarchyItem.children || [];

  return (
    <div className="animate-fadeInUp space-y-6">
      {/* Page Header */}
      <PageHeader
        title={`${hierarchyItem.name} - Hierarchy Detail`}
        actions={
          <button
            onClick={() => navigate('/range')}
            className="flex items-center gap-2 text-primary hover:text-primary/80"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Range
          </button>
        }
      />

      {/* Hierarchy Summary */}
      <HierarchySummary item={hierarchyItem} path={hierarchyPath} />

      {/* 5-Key Attributes */}
      <AttributeDetail item={hierarchyItem} />

      {/* Child Navigation */}
      {children.length > 0 && (
        // eslint-disable-next-line no-restricted-syntax -- container panel needs p-6 for visual separation
        <div className="bg-gray-50 rounded-lg p-6">
          <HierarchyNavigator
            data={children}
            title={`${hierarchyItem.name} Sub-Categories`}
            showAttributes={true}
            onItemSelect={setSelectedChild}
            onDrillDown={(item) => navigate(`/range/hierarchy/${item.id}`)}
          />
        </div>
      )}

      {/* Selected Child Details */}
      {selectedChild && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <SectionHeader
            title={`${selectedChild.name} - Quick View`}
            subtitle="Selected item details - double-click to navigate deeper"
          />
          {/* eslint-disable-next-line design-system/prefer-metric-grid -- quick-view summary within selected child card */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6 mt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{selectedChild.optionCount.toLocaleString()}</p>
              <p className="text-sm text-gray-500">Options</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{(selectedChild.stockQty / 1000).toFixed(0)} K</p>
              <p className="text-sm text-gray-500">Stock Qty</p>
            </div>
            <div className="text-center">
              <p className={cn(
                'text-2xl font-bold',
                selectedChild.sellThrough >= 80 ? 'text-green-600' :
                selectedChild.sellThrough >= 70 ? 'text-amber-600' : 'text-red-600'
              )}>
                {selectedChild.sellThrough}%
              </p>
              <p className="text-sm text-gray-500">Sell Through</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}