/* eslint-disable design-system/prefer-section-header -- store range digital twin uses custom layouts */
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Users, Store, TrendingUp,
  Package, Eye, EyeOff, Info,
  ZoomIn, ZoomOut, RotateCcw, Grid3x3
} from 'lucide-react';
import {cn, getCurrencySymbol} from '@/lib/utils';
import { Badge } from '@/components/ui';
import { mockStoreRangeData } from '../data/mockRangeArchitecture';

type ViewLayer = 'departments' | 'fixtures' | 'density' | 'performance';
type FixtureType = 'rack' | 'table' | 'wall' | 'mannequin' | 'counter';

interface GridCell {
  x: number;
  y: number;
  department?: string;
  fixture?: {
    type: FixtureType;
    id: string;
    products: number;
    capacity: number;
    category: string;
  };
  density?: number;
  performance?: 'high' | 'medium' | 'low';
}

export default function StoreRangeDigitalTwin() {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const [viewLayer, setViewLayer] = useState<ViewLayer>('fixtures');
  const [selectedFixture, setSelectedFixture] = useState<string | null>(null);
  const [showLabels, setShowLabels] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1.2);

  // Generate store layout grid (15x10)
  const gridWidth = 15;
  const gridHeight = 10;

  const generateGrid = (): GridCell[][] => {
    const grid: GridCell[][] = [];

    for (let y = 0; y < gridHeight; y++) {
      const row: GridCell[] = [];
      for (let x = 0; x < gridWidth; x++) {
        const cell: GridCell = { x, y };

        // Define department zones
        if (y === 0 && x >= 6 && x <= 8) {
          cell.department = 'ENTRY';
        } else if (y === gridHeight - 1 && (x === 0 || x === gridWidth - 1)) {
          cell.department = 'CASH';
        } else if (x < 5 && y < 4) {
          cell.department = 'MC';
        } else if (x < 5 && y >= 4) {
          cell.department = 'MF';
        } else if (x >= 5 && x < 10 && y < 5) {
          cell.department = 'WW';
        } else if (x >= 5 && x < 10 && y >= 5) {
          cell.department = 'WE';
        } else if (x >= 10 && y < 6) {
          cell.department = 'KW';
        } else if (x >= 10 && y >= 6) {
          cell.department = 'ACC';
        }

        // Add fixtures
        if (cell.department && !['ENTRY', 'CASH'].includes(cell.department)) {
          // Add fixtures in a pattern
          if ((x % 2 === 1 && y % 2 === 1) || (x === 2 && y === 2)) {
            const fixtureTypes: FixtureType[] = ['rack', 'table', 'wall'];
            const typeIndex = (x + y) % fixtureTypes.length;

            cell.fixture = {
              type: fixtureTypes[typeIndex] as FixtureType,
              id: `F${x}${y}`,
              products: Math.floor(Math.random() * 40) + 20,
              capacity: 60,
              category: cell.department
            };
          } else if (x === 0 || x === gridWidth - 1 || y === 1) {
            // Wall fixtures
            if (Math.random() > 0.3) {
              cell.fixture = {
                type: 'wall',
                id: `W${x}${y}`,
                products: Math.floor(Math.random() * 30) + 15,
                capacity: 45,
                category: cell.department
              };
            }
          }

          // Add mannequins at strategic locations
          if ((x === 3 && y === 0) || (x === 7 && y === 2) || (x === 11 && y === 1)) {
            cell.fixture = {
              type: 'mannequin',
              id: `M${x}${y}`,
              products: 1,
              capacity: 1,
              category: cell.department
            };
          }
        }

        // Add density (for heatmap view)
        if (cell.fixture) {
          cell.density = cell.fixture.products / cell.fixture.capacity;
        } else {
          cell.density = 0;
        }

        // Add performance
        if (cell.fixture) {
          const perf = Math.random();
          cell.performance = perf > 0.7 ? 'high' : perf > 0.4 ? 'medium' : 'low';
        }

        row.push(cell);
      }
      grid.push(row);
    }

    return grid;
  };

  const [grid] = useState(generateGrid());

  // Get store data
  const store = mockStoreRangeData.find(s => s.id === storeId);
  if (!store) {
    return <div className="p-4">Store not found</div>;
  }

  // Store metrics
  const storeMetrics = {
    totalSqFt: 8500,
    salesPerSqFt: 8200,
    fixtureCount: 124,
    avgFixtureUtilization: 78,
    departments: 5
  };

  // Department zones
  const departments: Record<string, { name: string; color: string; textColor: string }> = {
    'MC': { name: "Men's Casual", color: 'bg-blue-100 border-blue-300', textColor: 'text-blue-700' },
    'MF': { name: "Men's Formal", color: 'bg-slate-100 border-slate-300', textColor: 'text-slate-700' },
    'WW': { name: "Women's Western", color: 'bg-pink-100 border-pink-300', textColor: 'text-pink-700' },
    'WE': { name: "Women's Ethnic", color: 'bg-purple-100 border-purple-300', textColor: 'text-purple-700' },
    'KW': { name: "Kids Wear", color: 'bg-green-100 border-green-300', textColor: 'text-green-700' },
    'ACC': { name: "Accessories", color: 'bg-amber-100 border-amber-300', textColor: 'text-amber-700' },
    'CASH': { name: "Cashier", color: 'bg-gray-100 border-gray-300', textColor: 'text-gray-700' },
    'ENTRY': { name: "Entrance", color: 'bg-white border-gray-300', textColor: 'text-gray-700' }
  };

  // Get fixture icon based on type
  const getFixtureIcon = (type: FixtureType) => {
    switch (type) {
      case 'rack':
        return '▭'; // Rectangle for clothing rack
      case 'table':
        return '▢'; // Square for display table
      case 'wall':
        return '▬'; // Wall display
      case 'mannequin':
        return '⬟'; // Diamond for mannequin
      case 'counter':
        return '▣'; // Filled square for counter
      default:
        return '□';
    }
  };

  // Calculate department metrics
  const getDepartmentMetrics = (deptCode: string) => {
    let fixtureCount = 0;
    let totalProducts = 0;
    let totalCapacity = 0;

    grid.forEach(row => {
      row.forEach(cell => {
        if (cell.department === deptCode && cell.fixture) {
          fixtureCount++;
          totalProducts += cell.fixture.products;
          totalCapacity += cell.fixture.capacity;
        }
      });
    });

    return {
      fixtures: fixtureCount,
      products: totalProducts,
      capacity: totalCapacity,
      utilization: totalCapacity > 0 ? Math.round((totalProducts / totalCapacity) * 100) : 0
    };
  };

  // Get fixture details
  const getFixtureDetails = (fixtureId: string) => {
    for (const row of grid) {
      for (const cell of row) {
        if (cell.fixture?.id === fixtureId) {
          return cell.fixture;
        }
      }
    }
    return null;
  };

  const selectedFixtureDetails = selectedFixture ? getFixtureDetails(selectedFixture) : null;

  return (
    <div className="animate-fadeInUp space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button
            onClick={() => navigate('/range/store-range')}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to all stores
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{store.storeName} - Digital Twin</h1>
            <Badge variant="outline" className="font-bold">
              Grade {store.storeGrade}
            </Badge>
            {store.isTopPerformer && (
              <Badge variant="success" className="gap-1">
                <TrendingUp className="w-3 h-3" />
                Top Performer #{store.storeRank}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {store.city}, {store.state}
            </div>
            <div className="flex items-center gap-1">
              <Store className="w-3 h-3" />
              {storeMetrics.totalSqFt.toLocaleString()} sq ft
            </div>
            <div className="flex items-center gap-1">
              <Package className="w-3 h-3" />
              {storeMetrics.fixtureCount} fixtures
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {store.totalOptions} unique styles
            </div>
          </div>
        </div>
        <button
          onClick={() => navigate(`/range/store/${storeId}`)}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50"
        >
          <Grid3x3 className="w-4 h-4" />
          View Product Grid
        </button>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-12 gap-4">
        {/* Left Panel - Store Visualization */}
        <div className="col-span-10">
          <div className="bg-white rounded-lg border border-gray-200">
            {/* Controls Bar */}
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  {(['departments', 'fixtures', 'density', 'performance'] as ViewLayer[]).map(layer => (
                    <button
                      key={layer}
                      onClick={() => setViewLayer(layer)}
                      className={cn(
                        "px-3 py-1.5 text-xs font-medium rounded-md capitalize",
                        viewLayer === layer
                          ? "bg-indigo-100 text-primary-700"
                          : "text-gray-500 hover:bg-gray-100"
                      )}
                    >
                      {layer}
                    </button>
                  ))}
                </div>
                <div className="w-px h-6 bg-gray-300" />
                <button
                  onClick={() => setShowLabels(!showLabels)}
                  className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded"
                >
                  {showLabels ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  Labels
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setZoomLevel(Math.max(0.7, zoomLevel - 0.1))}
                  className="p-1 hover:bg-gray-100 rounded"
                  disabled={zoomLevel <= 0.7}
                >
                  <ZoomOut className="w-4 h-4 text-gray-600" />
                </button>
                <span className="text-xs text-gray-500 w-10 text-center">{Math.round(zoomLevel * 100)}%</span>
                <button
                  onClick={() => setZoomLevel(Math.min(2, zoomLevel + 0.1))}
                  className="p-1 hover:bg-gray-100 rounded"
                  disabled={zoomLevel >= 2}
                >
                  <ZoomIn className="w-4 h-4 text-gray-600" />
                </button>
                <button
                  onClick={() => setZoomLevel(1.2)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <RotateCcw className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Store Grid Visualization */}
            <div className="p-4 overflow-auto">
              {/* eslint-disable no-restricted-syntax -- Dynamic value */}
              <div
                className="inline-block"
                style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left' }}
              >
                <div
                  className="inline-grid gap-0 border-2 border-gray-400 bg-gray-50"
                  style={{ gridTemplateColumns: `repeat(${gridWidth}, minmax(0, 1fr))` }}
                >
                {/* eslint-enable no-restricted-syntax */}
                  {grid.flat().map((cell) => {
                    const isSelected = cell.fixture?.id === selectedFixture;
                    const deptInfo = cell.department ? departments[cell.department] : null;

                    return (
                      <button
                        type="button"
                        key={`${cell.x}-${cell.y}`}
                        onClick={() => cell.fixture && setSelectedFixture(cell.fixture.id)}
                        className={cn(
                          "w-16 h-16 border border-gray-200 flex items-center justify-center text-xs relative cursor-pointer transition-all",
                              // Department coloring
                              viewLayer === 'departments' && deptInfo && deptInfo.color,
                              // Fixture highlighting
                              viewLayer === 'fixtures' && cell.fixture && "bg-indigo-50 border-indigo-300",
                              // Density heatmap
                              viewLayer === 'density' && cell.density && (
                                cell.density > 0.8 ? "bg-red-200" :
                                cell.density > 0.6 ? "bg-amber-200" :
                                cell.density > 0.4 ? "bg-yellow-200" :
                                cell.density > 0.2 ? "bg-green-100" :
                                "bg-gray-50"
                              ),
                              // Performance view
                              viewLayer === 'performance' && cell.performance && (
                                cell.performance === 'high' ? "bg-green-200" :
                                cell.performance === 'medium' ? "bg-amber-100" :
                                "bg-red-100"
                              ),
                              // Selection state
                              isSelected && "ring-2 ring-indigo-500 ring-offset-1",
                              // Hover state
                              cell.fixture && "hover:bg-opacity-70"
                            )}
                          >
                            {/* Fixture Icon */}
                            {cell.fixture && (
                              <div className="relative w-full h-full flex items-center justify-center">
                                <span className={cn(
                                  "text-2xl font-bold",
                                  viewLayer === 'departments' && deptInfo ? deptInfo.textColor : "text-gray-700"
                                )}>
                                  {getFixtureIcon(cell.fixture.type)}
                                </span>
                                {showLabels && (
                                  <div className="absolute bottom-1 left-0 right-0 text-[10px] text-center text-gray-600 bg-white/80 px-0.5">
                                    {cell.fixture.id}
                                  </div>
                                )}
                                {/* Utilization indicator */}
                                {viewLayer === 'fixtures' && (
                                  <div className="absolute top-0.5 right-0.5">
                                    <div className={cn(
                                      "w-1.5 h-1.5 rounded-full",
                                      cell.density && cell.density > 0.8 ? "bg-red-500" :
                                      cell.density && cell.density > 0.5 ? "bg-amber-500" :
                                      "bg-green-500"
                                    )} />
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Department Labels (for empty cells) */}
                            {!cell.fixture && showLabels && cell.department && viewLayer === 'departments' && (
                              <span className={cn(
                                "text-sm font-medium",
                                deptInfo?.textColor
                              )}>
                                {cell.department === 'ENTRY' && '↓ ENTRY'}
                                {cell.department === 'CASH' && '₹ CASH'}
                              </span>
                            )}
                          </button>
                        );
                      })}
                </div>

                {/* Legend */}
                <div className="mt-4 flex items-center gap-6">
                  {viewLayer === 'departments' && (
                    <div className="flex items-center gap-3">
                      {Object.entries(departments).filter(([key]) => !['ENTRY', 'CASH'].includes(key)).map(([key, dept]) => (
                        <div key={key} className="flex items-center gap-1.5">
                          <div className={cn("w-5 h-5 rounded border", dept.color)} />
                          <span className="text-xs text-gray-600">{dept.name}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {viewLayer === 'density' && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-500">Density:</span>
                      <div className="flex items-center gap-1">
                        <div className="w-4 h-4 bg-gray-50 border border-gray-300" />
                        <span className="text-[9px] text-gray-500">0%</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-4 h-4 bg-green-100 border border-gray-300" />
                        <span className="text-[9px] text-gray-500">20%</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-4 h-4 bg-yellow-200 border border-gray-300" />
                        <span className="text-[9px] text-gray-500">40%</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-4 h-4 bg-amber-200 border border-gray-300" />
                        <span className="text-[9px] text-gray-500">60%</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-4 h-4 bg-red-200 border border-gray-300" />
                        <span className="text-[9px] text-gray-500">80%+</span>
                      </div>
                    </div>
                  )}

                  {viewLayer === 'performance' && (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <div className="w-4 h-4 bg-green-200 border border-gray-300" />
                        <span className="text-[10px] text-gray-600">High Performance</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-4 h-4 bg-amber-100 border border-gray-300" />
                        <span className="text-[10px] text-gray-600">Medium</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-4 h-4 bg-red-100 border border-gray-300" />
                        <span className="text-[10px] text-gray-600">Low</span>
                      </div>
                    </div>
                  )}

                  {viewLayer === 'fixtures' && (
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-gray-500">Fixtures:</span>
                      <div className="flex items-center gap-1">
                        <span className="text-sm">▭</span>
                        <span className="text-[10px] text-gray-600">Rack</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-sm">▢</span>
                        <span className="text-[10px] text-gray-600">Table</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-sm">▬</span>
                        <span className="text-[10px] text-gray-600">Wall</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-sm">⬟</span>
                        <span className="text-[10px] text-gray-600">Mannequin</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Metrics & Details */}
        <div className="col-span-2 space-y-4">
          {/* Store Overview */}
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <h3 className="text-xs font-semibold text-gray-900 mb-2">Store Overview</h3>
            <div className="space-y-2">
              <div>
                <div className="text-[10px] text-gray-500">Floor Space</div>
                <div className="text-sm font-bold text-gray-900">{storeMetrics.totalSqFt.toLocaleString()} sq ft</div>
              </div>
              <div>
                <div className="text-[10px] text-gray-500">Sales/SqFt</div>
                <div className="text-sm font-bold text-gray-900">{getCurrencySymbol()}{storeMetrics.salesPerSqFt.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-[10px] text-gray-500">Fixture Use</div>
                <div className="flex items-center gap-1">
                  <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    {/* eslint-disable no-restricted-syntax -- Dynamic value */}
                    <div
                      className="h-full bg-indigo-500"
                      style={{ width: `${storeMetrics.avgFixtureUtilization}%` }}
                    />
                    {/* eslint-enable no-restricted-syntax */}
                  </div>
                  <span className="text-xs font-medium text-gray-900">{storeMetrics.avgFixtureUtilization}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Department Breakdown */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-3 py-2 border-b border-gray-100">
              <h3 className="text-xs font-semibold text-gray-900">Departments</h3>
            </div>
            <div className="p-3 space-y-1.5">
              {Object.entries(departments).filter(([key]) => !['ENTRY', 'CASH'].includes(key)).map(([key, dept]) => {
                const metrics = getDepartmentMetrics(key);
                return (
                  <div key={key} className="space-y-0.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className={cn("w-2.5 h-2.5 rounded", dept.color)} />
                        <span className="text-[10px] font-medium text-gray-900">{dept.name}</span>
                      </div>
                      <span className="text-[10px] text-gray-500">{metrics.fixtures}f</span>
                    </div>
                    <div className="flex items-center gap-2 ml-5">
                      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        {/* eslint-disable no-restricted-syntax -- Dynamic value */}
                        <div
                          className={cn(
                            "h-full",
                            metrics.utilization > 80 ? "bg-red-500" :
                            metrics.utilization > 60 ? "bg-amber-500" :
                            "bg-green-500"
                          )}
                          style={{ width: `${metrics.utilization}%` }}
                        />
                        {/* eslint-enable no-restricted-syntax */}
                      </div>
                      <span className="text-[10px] text-gray-600">{metrics.utilization}%</span>
                    </div>
                    <div className="flex items-center justify-between ml-5">
                      <span className="text-[10px] text-gray-500">{metrics.products} / {metrics.capacity} products</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Fixture Details */}
          {selectedFixtureDetails && (
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">Fixture {selectedFixtureDetails.id}</h3>
                <button
                  onClick={() => setSelectedFixture(null)}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <div className="text-xs text-gray-500">Type</div>
                  <div className="text-sm font-medium text-gray-900 capitalize">{selectedFixtureDetails.type}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Department</div>
                  <div className="text-sm font-medium text-gray-900">
                    {departments[selectedFixtureDetails.category]?.name || selectedFixtureDetails.category}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Product Count</div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">
                      {selectedFixtureDetails.products} / {selectedFixtureDetails.capacity}
                    </span>
                    <span className={cn(
                      "text-xs font-medium",
                      (selectedFixtureDetails.products / selectedFixtureDetails.capacity) > 0.8 ? "text-red-600" :
                      (selectedFixtureDetails.products / selectedFixtureDetails.capacity) > 0.5 ? "text-amber-600" :
                      "text-green-600"
                    )}>
                      {Math.round((selectedFixtureDetails.products / selectedFixtureDetails.capacity) * 100)}% full
                    </span>
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <button className="w-full px-3 py-1.5 bg-indigo-700 text-white text-xs font-medium rounded hover:bg-indigo-800">
                    View Products →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Quick Insights */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <Info className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-gray-900">AI Insights</h3>
            </div>
            <div className="p-4 space-y-2">
              <div className="p-2 bg-amber-50 border border-amber-200 rounded">
                <div className="text-xs font-medium text-amber-800 mb-1">Optimize Women's Western</div>
                <div className="text-xs text-amber-700">3 fixtures at 90%+ capacity. Consider adding 2 more racks.</div>
              </div>
              <div className="p-2 bg-blue-50 border border-blue-200 rounded">
                <div className="text-xs font-medium text-blue-800 mb-1">Underutilized Space</div>
                <div className="text-xs text-blue-700">Men's Formal section has 35% empty fixtures.</div>
              </div>
              <div className="p-2 bg-green-50 border border-green-200 rounded">
                <div className="text-xs font-medium text-green-800 mb-1">High Performance</div>
                <div className="text-xs text-green-700">Kids section fixtures show 2.3x turnover vs store avg.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}