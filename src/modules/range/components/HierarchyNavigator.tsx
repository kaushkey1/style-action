import { useState } from 'react';
import {
  ChevronRight,
  Package,
  TrendingUp,
  DollarSign,
  Palette,
  Layers,
  Home,
  ArrowUp,
  Target,
  BarChart3
} from 'lucide-react';
import { Badge, Progress, SectionHeader } from '@/components/ui';
import {cn, getCurrencySymbol} from '@/lib/utils';
import type {
  HierarchyLevel,
  AttributeProfile
} from '../data/mockMerchandiseHierarchy';

// ─── Breadcrumb Component ───────────────────────────────────────────────────

interface BreadcrumbProps {
  path: HierarchyLevel[];
  onNavigate: (level: HierarchyLevel | null) => void;
}

function Breadcrumb({ path, onNavigate }: BreadcrumbProps) {
  return (
    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
      <Home
        className="w-4 h-4 text-gray-400 cursor-pointer hover:text-primary"
        onClick={() => onNavigate(null)}
      />
      {path.map((item, index) => (
        <div key={item.id} className="flex items-center gap-2">
          <ChevronRight className="w-3 h-3 text-gray-400" />
          <button
            onClick={() => onNavigate(item)}
            className={cn(
              'text-sm font-medium hover:text-primary transition-colors',
              index === path.length - 1 ? 'text-gray-900' : 'text-gray-600'
            )}
          >
            {item.name}
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Attribute Display Component ────────────────────────────────────────────

interface AttributeDisplayProps {
  attributes: AttributeProfile;
  compact?: boolean;
}

function AttributeDisplay({ attributes, compact = false }: AttributeDisplayProps) {
  if (compact) {
    return (
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-gray-500">Silhouette:</span>
          <span className="ml-1 text-gray-900">{attributes.silhouette.slice(0, 2).join(', ')}</span>
          {attributes.silhouette.length > 2 && <span className="text-gray-500"> +{attributes.silhouette.length - 2}</span>}
        </div>
        <div>
          <span className="text-gray-500">Price:</span>
          <span className="ml-1 text-gray-900">{attributes.pricePoint.primary}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Silhouette */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Layers className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Silhouette</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {attributes.silhouette.map((silhouette, index) => (
            <Badge key={index} variant="outline" size="sm" className="bg-blue-50 text-blue-700 border-blue-200">
              {silhouette}
            </Badge>
          ))}
        </div>
      </div>

      {/* Fabric Split */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Palette className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Fabric Split</span>
        </div>
        <div className="space-y-2">
          {attributes.fabricSplit.map((fabric, index) => (
            <div key={index} className="flex items-center gap-3">
              <span className="text-xs font-medium text-gray-900 w-20">{fabric.fabric}</span>
              <div className="flex-1">
                <Progress
                  value={fabric.percentage}
                  max={100}
                  className="h-2"
                  indicatorClassName="bg-purple-500"
                />
              </div>
              <span className="text-xs text-gray-500 w-8">{fabric.percentage}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Prints */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Target className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Prints</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {attributes.prints.map((print, index) => (
            <Badge key={index} variant="outline" size="sm" className="bg-green-50 text-green-700 border-green-200">
              {print}
            </Badge>
          ))}
        </div>
      </div>

      {/* Colors */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Palette className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Colors</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {attributes.colors.map((color, index) => (
            <Badge key={index} variant="outline" size="sm" className="bg-pink-50 text-pink-700 border-pink-200">
              {color}
            </Badge>
          ))}
        </div>
      </div>

      {/* Price Point */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <DollarSign className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Price Point</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="default" size="sm">{attributes.pricePoint.primary}</Badge>
          <span className="text-xs text-gray-500">
            Range: {getCurrencySymbol()}{attributes.pricePoint.min.toLocaleString()} - {getCurrencySymbol()}{attributes.pricePoint.max.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Hierarchy Card Component ───────────────────────────────────────────────

interface HierarchyCardProps {
  item: HierarchyLevel;
  onClick: () => void;
  onDoubleClick?: () => void;
  showAttributes?: boolean;
}

function HierarchyCard({ item, onClick, onDoubleClick, showAttributes = false }: HierarchyCardProps) {
  const sellThroughColor = item.sellThrough >= 80 ? 'text-green-600' :
                          item.sellThrough >= 70 ? 'text-amber-600' : 'text-red-600';

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- interactive card with click/double-click navigation
    <div
      className="bg-white rounded-lg border border-gray-200 p-4 hover:border-primary/30 hover:shadow-sm transition-all duration-200 cursor-pointer"
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{item.name}</h3>
          <p className="text-xs text-gray-500 capitalize">{item.level}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="default" size="sm">
            {item.optionCount} options
          </Badge>
          {item.children && (
            <Badge variant="outline" size="sm">
              {item.children.length} sub-items
            </Badge>
          )}
        </div>
      </div>

      {/* Key Metrics */}
      {/* eslint-disable-next-line design-system/prefer-metric-grid -- inline metrics within interactive card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3 p-3 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Package className="w-3 h-3 text-gray-500" />
            <span className="text-xs text-gray-500">Stock Qty</span>
          </div>
          <p className="text-sm font-semibold text-gray-900">{(item.stockQty / 1000).toFixed(0)} K</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <DollarSign className="w-3 h-3 text-gray-500" />
            <span className="text-xs text-gray-500">Revenue</span>
          </div>
          <p className="text-sm font-semibold text-gray-900">{getCurrencySymbol()}{(item.revenue / 10000000).toFixed(1)} Cr</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <BarChart3 className="w-3 h-3 text-gray-500" />
            <span className="text-xs text-gray-500">Sell Through</span>
          </div>
          <p className={cn('text-sm font-semibold', sellThroughColor)}>{item.sellThrough}%</p>
        </div>
      </div>

      {/* Attributes */}
      {showAttributes && (
        <div className="border-t border-gray-100 pt-3">
          <AttributeDisplay attributes={item.attributes} compact />
        </div>
      )}

      {/* Drill-down indicator */}
      {item.children && (
        <div className="flex items-center justify-center pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1 text-xs text-primary">
            <span>Double-click to drill down</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Hierarchy Navigator Component ─────────────────────────────────────

interface HierarchyNavigatorProps {
  data: HierarchyLevel[];
  title?: string;
  showAttributes?: boolean;
  onItemSelect?: (item: HierarchyLevel) => void;
  onDrillDown?: (item: HierarchyLevel) => void;
}

export function HierarchyNavigator({
  data,
  title = "Merchandise Hierarchy",
  showAttributes = true,
  onItemSelect,
  onDrillDown
}: HierarchyNavigatorProps) {
  const [currentPath, setCurrentPath] = useState<HierarchyLevel[]>([]);
  const [currentLevel, setCurrentLevel] = useState<HierarchyLevel[]>(data);
  const [selectedItem, setSelectedItem] = useState<HierarchyLevel | null>(null);

  const handleNavigate = (level: HierarchyLevel | null) => {
    if (!level) {
      // Navigate to root
      setCurrentPath([]);
      setCurrentLevel(data);
      setSelectedItem(null);
      return;
    }

    const levelIndex = currentPath.findIndex(item => item.id === level.id);
    if (levelIndex >= 0) {
      // Navigate to existing level in path
      const newPath = currentPath.slice(0, levelIndex + 1);
      setCurrentPath(newPath);
      setCurrentLevel(level.children || []);
      setSelectedItem(level);
    }
  };

  const handleItemClick = (item: HierarchyLevel) => {
    setSelectedItem(item);
    onItemSelect?.(item);
  };

  const handleItemDoubleClick = (item: HierarchyLevel) => {
    if (item.children && item.children.length > 0) {
      setCurrentPath([...currentPath, item]);
      setCurrentLevel(item.children);
      setSelectedItem(item);
      onDrillDown?.(item);
    }
  };

  const handleBackToParent = () => {
    if (currentPath.length > 0) {
      const newPath = currentPath.slice(0, -1);
      setCurrentPath(newPath);

      if (newPath.length === 0) {
        setCurrentLevel(data);
      } else {
        const parent = newPath[newPath.length - 1];
        setCurrentLevel(parent?.children || []);
      }
      setSelectedItem(newPath[newPath.length - 1] || null);
    }
  };

  return (
    <div className="space-y-4">
      <SectionHeader
        title={title}
        subtitle={`Showing ${currentLevel.length} items at ${currentPath.length === 0 ? 'segment' : currentPath[currentPath.length - 1]?.level || 'unknown'} level`}
        actions={
          currentPath.length > 0 && (
            <button
              onClick={handleBackToParent}
              className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 font-medium"
            >
              <ArrowUp className="w-4 h-4" />
              Back to Parent
            </button>
          )
        }
      />

      {/* Breadcrumb */}
      {currentPath.length > 0 && (
        <Breadcrumb path={currentPath} onNavigate={handleNavigate} />
      )}

      {/* Item Grid */}
      {/* eslint-disable-next-line design-system/prefer-metric-grid -- card grid, not metric grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {currentLevel.map((item) => (
          <HierarchyCard
            key={item.id}
            item={item}
            onClick={() => handleItemClick(item)}
            onDoubleClick={() => handleItemDoubleClick(item)}
            showAttributes={showAttributes}
          />
        ))}
      </div>

      {/* Selected Item Details */}
      {selectedItem && showAttributes && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-gray-900">{selectedItem.name} Attributes</h3>
          </div>
          <AttributeDisplay attributes={selectedItem.attributes} />
        </div>
      )}

      {/* Empty State */}
      {currentLevel.length === 0 && (
        <div className="text-center py-8">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No items available at this level</p>
          <button
            onClick={handleBackToParent}
            className="text-primary hover:text-primary/80 text-sm font-medium mt-2"
          >
            Go back to parent level
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Store Segment Breakdown Component ──────────────────────────────────────

interface StoreSegmentBreakdownProps {
  storeId: string;
  storeName: string;
  segments: HierarchyLevel[];
  onSegmentDoubleClick: (segment: HierarchyLevel) => void;
}

export function StoreSegmentBreakdown({
  storeId,
  storeName,
  segments,
  onSegmentDoubleClick
}: StoreSegmentBreakdownProps) {
  return (
    <div className="space-y-4">
      <SectionHeader
        title={`${storeName} - Segment Breakdown`}
        subtitle={`Store ${storeId} • ${segments.length} segments • Double-click to drill down`}
      />

      {/* eslint-disable-next-line design-system/prefer-metric-grid -- interactive segment cards, not standard metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {segments.map((segment) => (
          <div
            key={segment.id}
            className="bg-white rounded-lg border border-gray-200 p-4 hover:border-primary/30 hover:shadow-sm transition-all duration-200 cursor-pointer"
            onDoubleClick={() => onSegmentDoubleClick(segment)}
          >
            {/* eslint-disable-next-line design-system/prefer-section-header -- compact card header with badge */}
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-gray-900">{segment.name}</h4>
              <Badge variant="default" size="sm">{segment.optionCount}</Badge>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Stock:</span>
                <span className="text-gray-900 font-medium">{(segment.stockQty / 1000).toFixed(0)} K pcs</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Revenue:</span>
                <span className="text-gray-900 font-medium">{getCurrencySymbol()}{(segment.revenue / 10000000).toFixed(1)} Cr</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Sell Through:</span>
                <span className={cn(
                  'font-medium',
                  segment.sellThrough >= 80 ? 'text-green-600' :
                  segment.sellThrough >= 70 ? 'text-amber-600' : 'text-red-600'
                )}>
                  {segment.sellThrough}%
                </span>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-100">
              <AttributeDisplay attributes={segment.attributes} compact />
            </div>

            <div className="mt-3 text-center">
              <div className="flex items-center justify-center gap-1 text-xs text-primary">
                <span>Double-click to explore</span>
                <ChevronRight className="w-3 h-3" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}