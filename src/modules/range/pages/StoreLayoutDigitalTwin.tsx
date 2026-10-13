/* eslint-disable design-system/prefer-section-header, design-system/prefer-metric-grid -- digital twin uses custom layouts */
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Users, Store, Package,
  Eye, EyeOff, ZoomIn, ZoomOut, RotateCcw,
  Grid3x3, Info, TrendingUp, AlertTriangle
} from 'lucide-react';
import {cn, getCurrencySymbol} from '@/lib/utils';
import { Badge } from '@/components/ui';
import { mockStoreRangeData } from '../data/mockRangeArchitecture';

type ViewMode = 'department' | 'performance' | 'density';
type FixtureType = 'wall-rack' | 'island-rack' | 'table' | 'mannequin' | 'gondola' | 'checkout';

interface Fixture {
  id: string;
  type: FixtureType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  department: string;
  products: number;
  capacity: number;
  label?: string;
}

export default function StoreLayoutDigitalTwin() {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('department');
  const [selectedFixture, setSelectedFixture] = useState<string | null>(null);
  const [showLabels, setShowLabels] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1.1);

  // Get store data
  const store = mockStoreRangeData.find(s => s.id === storeId);
  if (!store) {
    return <div className="p-4">Store not found</div>;
  }

  // Department colors
  const departmentColors = {
    'MC': { bg: 'fill-blue-100', border: 'stroke-blue-400', text: 'text-blue-700', label: "Men's Casual" },
    'MF': { bg: 'fill-slate-100', border: 'stroke-slate-400', text: 'text-slate-700', label: "Men's Formal" },
    'WE': { bg: 'fill-purple-100', border: 'stroke-purple-400', text: 'text-purple-700', label: "Women's Ethnic" },
    'WW': { bg: 'fill-pink-100', border: 'stroke-pink-400', text: 'text-pink-700', label: "Women's Western" },
    'KW': { bg: 'fill-green-100', border: 'stroke-green-400', text: 'text-green-700', label: "Kids" },
    'ACC': { bg: 'fill-amber-100', border: 'stroke-amber-400', text: 'text-amber-700', label: "Accessories" },
    'CASH': { bg: 'fill-gray-100', border: 'stroke-gray-400', text: 'text-gray-700', label: "Checkout" }
  };

  // Store dimensions (in grid units - each unit = ~1 meter)
  const storeWidth = 50;
  const storeHeight = 30;

  // Define fixtures with realistic store layout
  const fixtures: Fixture[] = [
    // ENTRANCE (bottom center)

    // LEFT SECTION - Men's Casual
    // Wall fixtures
    { id: 'MC-W1', type: 'wall-rack', x: 0, y: 2, width: 1, height: 4, department: 'MC', products: 48, capacity: 60, label: 'Jeans' },
    { id: 'MC-W2', type: 'wall-rack', x: 0, y: 6, width: 1, height: 4, department: 'MC', products: 42, capacity: 60, label: 'T-Shirts' },
    { id: 'MC-W3', type: 'wall-rack', x: 0, y: 10, width: 1, height: 4, department: 'MC', products: 55, capacity: 60, label: 'Shirts' },
    { id: 'MC-W4', type: 'wall-rack', x: 0, y: 14, width: 1, height: 4, department: 'MC', products: 38, capacity: 60, label: 'Shorts' },

    // Island fixtures
    { id: 'MC-I1', type: 'island-rack', x: 3, y: 3, width: 3, height: 2, department: 'MC', products: 28, capacity: 40, label: 'New Arrivals' },
    { id: 'MC-I2', type: 'island-rack', x: 3, y: 7, width: 3, height: 2, department: 'MC', products: 32, capacity: 40, label: 'Casuals' },
    { id: 'MC-I3', type: 'island-rack', x: 3, y: 11, width: 3, height: 2, department: 'MC', products: 35, capacity: 40, label: 'Trending' },
    { id: 'MC-I4', type: 'island-rack', x: 3, y: 15, width: 3, height: 2, department: 'MC', products: 30, capacity: 40, label: 'Basics' },

    // Tables
    { id: 'MC-T1', type: 'table', x: 7, y: 5, width: 2, height: 2, department: 'MC', products: 24, capacity: 30, label: 'Folded' },
    { id: 'MC-T2', type: 'table', x: 7, y: 13, width: 2, height: 2, department: 'MC', products: 26, capacity: 30, label: 'Stacked' },

    // Men's Formal section
    { id: 'MF-W1', type: 'wall-rack', x: 0, y: 18, width: 1, height: 3, department: 'MF', products: 28, capacity: 40, label: 'Suits' },
    { id: 'MF-W2', type: 'wall-rack', x: 0, y: 21, width: 1, height: 3, department: 'MF', products: 32, capacity: 40, label: 'Blazers' },
    { id: 'MF-I1', type: 'island-rack', x: 3, y: 19, width: 3, height: 2, department: 'MF', products: 22, capacity: 30, label: 'Formal Shirts' },
    { id: 'MF-I2', type: 'island-rack', x: 3, y: 22, width: 3, height: 2, department: 'MF', products: 18, capacity: 30, label: 'Trousers' },

    // CENTER SECTION - Women's Western
    { id: 'WW-I1', type: 'island-rack', x: 11, y: 3, width: 3, height: 2, department: 'WW', products: 42, capacity: 45, label: 'Dresses' },
    { id: 'WW-I2', type: 'island-rack', x: 15, y: 3, width: 3, height: 2, department: 'WW', products: 38, capacity: 45, label: 'Tops' },
    { id: 'WW-I3', type: 'island-rack', x: 11, y: 7, width: 3, height: 2, department: 'WW', products: 40, capacity: 45, label: 'Skirts' },
    { id: 'WW-I4', type: 'island-rack', x: 15, y: 7, width: 3, height: 2, department: 'WW', products: 44, capacity: 45, label: 'Jeans' },
    { id: 'WW-I5', type: 'island-rack', x: 11, y: 11, width: 3, height: 2, department: 'WW', products: 41, capacity: 45, label: 'Jackets' },
    { id: 'WW-I6', type: 'island-rack', x: 15, y: 11, width: 3, height: 2, department: 'WW', products: 39, capacity: 45, label: 'Blouses' },

    // Women's Ethnic section
    { id: 'WE-I1', type: 'island-rack', x: 11, y: 15, width: 3, height: 2, department: 'WE', products: 35, capacity: 40, label: 'Sarees' },
    { id: 'WE-I2', type: 'island-rack', x: 15, y: 15, width: 3, height: 2, department: 'WE', products: 38, capacity: 40, label: 'Kurtas' },
    { id: 'WE-I3', type: 'island-rack', x: 11, y: 19, width: 3, height: 2, department: 'WE', products: 32, capacity: 40, label: 'Lehengas' },
    { id: 'WE-I4', type: 'island-rack', x: 15, y: 19, width: 3, height: 2, department: 'WE', products: 36, capacity: 40, label: 'Suits' },
    { id: 'WE-T1', type: 'table', x: 13, y: 22, width: 3, height: 2, department: 'WE', products: 28, capacity: 35, label: 'Dupattas' },

    // CENTER FEATURE
    { id: 'FEAT1', type: 'mannequin', x: 19, y: 9, width: 2, height: 2, department: 'WW', products: 3, capacity: 3, label: 'Featured' },

    // KIDS SECTION (right side)
    { id: 'KW-W1', type: 'wall-rack', x: 39, y: 2, width: 1, height: 3, department: 'KW', products: 45, capacity: 50, label: 'Boys' },
    { id: 'KW-W2', type: 'wall-rack', x: 39, y: 5, width: 1, height: 3, department: 'KW', products: 42, capacity: 50, label: 'Girls' },
    { id: 'KW-W3', type: 'wall-rack', x: 39, y: 8, width: 1, height: 3, department: 'KW', products: 48, capacity: 50, label: 'Infants' },
    { id: 'KW-I1', type: 'island-rack', x: 35, y: 3, width: 3, height: 2, department: 'KW', products: 38, capacity: 40, label: 'Playwear' },
    { id: 'KW-I2', type: 'island-rack', x: 35, y: 7, width: 3, height: 2, department: 'KW', products: 35, capacity: 40, label: 'School' },
    { id: 'KW-T1', type: 'table', x: 36, y: 11, width: 2, height: 2, department: 'KW', products: 30, capacity: 35, label: 'Essentials' },

    // ACCESSORIES (right lower)
    { id: 'ACC-G1', type: 'gondola', x: 24, y: 3, width: 4, height: 1, department: 'ACC', products: 85, capacity: 100, label: 'Bags' },
    { id: 'ACC-G2', type: 'gondola', x: 24, y: 5, width: 4, height: 1, department: 'ACC', products: 92, capacity: 100, label: 'Belts' },
    { id: 'ACC-G3', type: 'gondola', x: 24, y: 7, width: 4, height: 1, department: 'ACC', products: 78, capacity: 100, label: 'Wallets' },
    { id: 'ACC-G4', type: 'gondola', x: 30, y: 3, width: 4, height: 1, department: 'ACC', products: 88, capacity: 100, label: 'Watches' },
    { id: 'ACC-G5', type: 'gondola', x: 30, y: 5, width: 4, height: 1, department: 'ACC', products: 95, capacity: 100, label: 'Jewelry' },
    { id: 'ACC-G6', type: 'gondola', x: 30, y: 7, width: 4, height: 1, department: 'ACC', products: 82, capacity: 100, label: 'Sunglasses' },

    // More fixtures for dense layout
    { id: 'WW-T1', type: 'table', x: 20, y: 3, width: 2, height: 2, department: 'WW', products: 25, capacity: 30, label: 'Sale' },
    { id: 'WW-T2', type: 'table', x: 20, y: 15, width: 2, height: 2, department: 'WW', products: 28, capacity: 30, label: 'New' },

    // Additional center fixtures
    { id: 'MX-I1', type: 'island-rack', x: 24, y: 11, width: 3, height: 2, department: 'WW', products: 35, capacity: 40, label: 'Premium' },
    { id: 'MX-I2', type: 'island-rack', x: 28, y: 11, width: 3, height: 2, department: 'WE', products: 32, capacity: 40, label: 'Designer' },
    { id: 'MX-I3', type: 'island-rack', x: 24, y: 15, width: 3, height: 2, department: 'ACC', products: 68, capacity: 80, label: 'Footwear' },
    { id: 'MX-I4', type: 'island-rack', x: 28, y: 15, width: 3, height: 2, department: 'ACC', products: 72, capacity: 80, label: 'Shoes' },

    // Additional fixtures to fill the expanded space
    { id: 'WW-W1', type: 'wall-rack', x: 0, y: 24, width: 1, height: 4, department: 'WW', products: 52, capacity: 60, label: 'Coats' },
    { id: 'WE-W1', type: 'wall-rack', x: 49, y: 11, width: 1, height: 4, department: 'WE', products: 46, capacity: 60, label: 'Ethnic Sets' },
    { id: 'WE-W2', type: 'wall-rack', x: 49, y: 15, width: 1, height: 4, department: 'WE', products: 50, capacity: 60, label: 'Anarkalis' },
    { id: 'WE-W3', type: 'wall-rack', x: 49, y: 19, width: 1, height: 4, department: 'WE', products: 48, capacity: 60, label: 'Palazzos' },

    // More center fixtures
    { id: 'MX-I5', type: 'island-rack', x: 32, y: 11, width: 3, height: 2, department: 'WW', products: 36, capacity: 40, label: 'Activewear' },
    { id: 'MX-I6', type: 'island-rack', x: 32, y: 15, width: 3, height: 2, department: 'WW', products: 38, capacity: 40, label: 'Loungewear' },
    { id: 'MX-I7', type: 'island-rack', x: 36, y: 19, width: 3, height: 2, department: 'ACC', products: 75, capacity: 80, label: 'Handbags' },
    { id: 'MX-I8', type: 'island-rack', x: 32, y: 19, width: 3, height: 2, department: 'ACC', products: 70, capacity: 80, label: 'Scarves' },

    // Additional tables
    { id: 'WW-T3', type: 'table', x: 24, y: 9, width: 2, height: 2, department: 'WW', products: 26, capacity: 30, label: 'Flash Sale' },
    { id: 'MC-T3', type: 'table', x: 9, y: 9, width: 2, height: 2, department: 'MC', products: 22, capacity: 30, label: 'Clearance' },
    { id: 'KW-T2', type: 'table', x: 41, y: 5, width: 2, height: 2, department: 'KW', products: 28, capacity: 35, label: 'Newborn' },
    { id: 'KW-T3', type: 'table', x: 41, y: 15, width: 2, height: 2, department: 'KW', products: 32, capacity: 35, label: 'Toys' },

    // More mannequins for visual display
    { id: 'FEAT2', type: 'mannequin', x: 10, y: 0, width: 1, height: 1, department: 'MC', products: 1, capacity: 1, label: 'Look 1' },
    { id: 'FEAT3', type: 'mannequin', x: 25, y: 0, width: 1, height: 1, department: 'WW', products: 1, capacity: 1, label: 'Look 2' },
    { id: 'FEAT4', type: 'mannequin', x: 40, y: 0, width: 1, height: 1, department: 'KW', products: 1, capacity: 1, label: 'Kids' },

    // Additional gondolas for accessories
    { id: 'ACC-G7', type: 'gondola', x: 40, y: 19, width: 4, height: 1, department: 'ACC', products: 90, capacity: 100, label: 'Perfumes' },
    { id: 'ACC-G8', type: 'gondola', x: 45, y: 19, width: 4, height: 1, department: 'ACC', products: 86, capacity: 100, label: 'Cosmetics' },
    { id: 'ACC-G9', type: 'gondola', x: 40, y: 21, width: 4, height: 1, department: 'ACC', products: 94, capacity: 100, label: 'Hair Acc' },
    { id: 'ACC-G10', type: 'gondola', x: 45, y: 21, width: 4, height: 1, department: 'ACC', products: 89, capacity: 100, label: 'Travel' },

    // More wall fixtures on the back wall
    { id: 'TOP-W1', type: 'wall-rack', x: 5, y: 0, width: 4, height: 1, department: 'MC', products: 55, capacity: 60, label: 'Premium' },
    { id: 'TOP-W2', type: 'wall-rack', x: 12, y: 0, width: 4, height: 1, department: 'WW', products: 58, capacity: 60, label: 'Designer' },
    { id: 'TOP-W3', type: 'wall-rack', x: 17, y: 0, width: 4, height: 1, department: 'WW', products: 54, capacity: 60, label: 'Exclusive' },
    { id: 'TOP-W4', type: 'wall-rack', x: 22, y: 0, width: 4, height: 1, department: 'WE', products: 52, capacity: 60, label: 'Bridal' },
    { id: 'TOP-W5', type: 'wall-rack', x: 27, y: 0, width: 4, height: 1, department: 'WE', products: 56, capacity: 60, label: 'Festive' },
    { id: 'TOP-W6', type: 'wall-rack', x: 32, y: 0, width: 4, height: 1, department: 'KW', products: 50, capacity: 60, label: 'Character' },
    { id: 'TOP-W7', type: 'wall-rack', x: 37, y: 0, width: 4, height: 1, department: 'ACC', products: 88, capacity: 100, label: 'Luxury' },
    { id: 'TOP-W8', type: 'wall-rack', x: 42, y: 0, width: 4, height: 1, department: 'ACC', products: 92, capacity: 100, label: 'Sports' },

    // CHECKOUT COUNTERS (bottom center)
    { id: 'CASH-1', type: 'checkout', x: 20, y: 28, width: 2, height: 1, department: 'CASH', products: 0, capacity: 0, label: 'POS 1' },
    { id: 'CASH-2', type: 'checkout', x: 23, y: 28, width: 2, height: 1, department: 'CASH', products: 0, capacity: 0, label: 'POS 2' },
    { id: 'CASH-3', type: 'checkout', x: 26, y: 28, width: 2, height: 1, department: 'CASH', products: 0, capacity: 0, label: 'POS 3' },
    { id: 'CASH-4', type: 'checkout', x: 29, y: 28, width: 2, height: 1, department: 'CASH', products: 0, capacity: 0, label: 'POS 4' },
  ];

  const selectedFixtureData = fixtures.find(f => f.id === selectedFixture);

  // Calculate metrics
  const departmentMetrics = Object.keys(departmentColors).map(dept => {
    const deptFixtures = fixtures.filter(f => f.department === dept);
    const totalProducts = deptFixtures.reduce((sum, f) => sum + f.products, 0);
    const totalCapacity = deptFixtures.reduce((sum, f) => sum + f.capacity, 0);
    return {
      department: dept,
      fixtures: deptFixtures.length,
      products: totalProducts,
      capacity: totalCapacity,
      utilization: totalCapacity > 0 ? Math.round((totalProducts / totalCapacity) * 100) : 0
    };
  }).filter(m => m.fixtures > 0);

  const getFixtureColor = (fixture: Fixture) => {
    const dept = departmentColors[fixture.department as keyof typeof departmentColors];

    if (viewMode === 'performance') {
      const utilization = fixture.capacity > 0 ? fixture.products / fixture.capacity : 0;
      if (utilization > 0.9) return { bg: 'fill-red-100', border: 'stroke-red-400' };
      if (utilization > 0.7) return { bg: 'fill-amber-100', border: 'stroke-amber-400' };
      return { bg: 'fill-green-100', border: 'stroke-green-400' };
    }

    if (viewMode === 'density') {
      const density = fixture.capacity > 0 ? fixture.products / fixture.capacity : 0;
      const opacity = Math.min(density, 1);
      return {
        bg: `fill-indigo-${Math.round(opacity * 9) * 100 || 50}`,
        border: 'stroke-indigo-600'
      };
    }

    return dept || { bg: 'fill-gray-100', border: 'stroke-gray-400' };
  };

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
            <h1 className="text-2xl font-bold text-gray-900">{store.storeName} - Store Layout</h1>
            <Badge variant="outline" className="font-bold">
              Grade {store.storeGrade}
            </Badge>
            {store.isTopPerformer && (
              <Badge variant="success" className="gap-1">
                <TrendingUp className="w-3 h-3" />
                Top Performer
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
              8,500 sq ft
            </div>
            <div className="flex items-center gap-1">
              <Package className="w-3 h-3" />
              {fixtures.length} fixtures
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {store.totalOptions} styles
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
      <div className="flex gap-4">
        {/* Store Visualization */}
        <div className="flex-1">
          <div className="bg-white rounded-lg border border-gray-200">
            {/* Controls */}
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  {(['department', 'performance', 'density'] as ViewMode[]).map(mode => (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      className={cn(
                        "px-3 py-1.5 text-xs font-medium rounded-md capitalize",
                        viewMode === mode
                          ? "bg-indigo-100 text-primary-700"
                          : "text-gray-500 hover:bg-gray-100"
                      )}
                    >
                      {mode}
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
                >
                  <ZoomOut className="w-4 h-4 text-gray-600" />
                </button>
                <span className="text-xs text-gray-500 w-12 text-center">{Math.round(zoomLevel * 100)}%</span>
                <button
                  onClick={() => setZoomLevel(Math.min(1.5, zoomLevel + 0.1))}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <ZoomIn className="w-4 h-4 text-gray-600" />
                </button>
                <button
                  onClick={() => setZoomLevel(1.1)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <RotateCcw className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Store SVG Layout */}
            <div className="p-4 overflow-auto bg-gray-50">
              {/* eslint-disable no-restricted-syntax -- Dynamic SVG layout values */}
              <div
                style={{
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: 'top left',
                  width: `${storeWidth * 24}px`,
                  height: `${storeHeight * 24}px`
                }}
              >
                <svg
                  width={storeWidth * 24}
                  height={storeHeight * 24}
                  className="bg-white"
                  style={{ boxShadow: '0 0 0 3px #374151' }}
                >
                  {/* Store boundary */}
                  <rect
                    x="0"
                    y="0"
                    width={storeWidth * 24}
                    height={storeHeight * 24}
                    fill="white"
                    stroke="#374151"
                    strokeWidth="3"
                  />

                  {/* Entrance */}
                  <rect
                    x={(storeWidth / 2 - 4) * 24}
                    y={(storeHeight - 1) * 24}
                    width={192}
                    height={24}
                    fill="none"
                    stroke="#374151"
                    strokeWidth="3"
                    strokeDasharray="5,5"
                  />
                  <text
                    x={storeWidth * 12}
                    y={(storeHeight - 0.2) * 24}
                    textAnchor="middle"
                    className="fill-gray-600 text-sm font-medium"
                  >
                    ENTRANCE
                  </text>

                  {/* Render fixtures */}
                  {fixtures.map(fixture => {
                    const colors = getFixtureColor(fixture);
                    const isSelected = fixture.id === selectedFixture;

                    return (
                      <g key={fixture.id}>
                        <rect
                          x={fixture.x * 24}
                          y={fixture.y * 24}
                          width={fixture.width * 24}
                          height={fixture.height * 24}
                          className={cn(colors.bg, colors.border)}
                          strokeWidth={isSelected ? 3 : 2}
                          rx="3"
                          onClick={() => setSelectedFixture(fixture.id)}
                          style={{ cursor: 'pointer' }}
                        />

                        {/* Fixture type icon */}
                        <text
                          x={(fixture.x + fixture.width / 2) * 24}
                          y={(fixture.y + fixture.height / 2 - 0.3) * 24}
                          textAnchor="middle"
                          className="fill-gray-700 text-base font-bold pointer-events-none"
                        >
                          {fixture.type === 'wall-rack' && '▬'}
                          {fixture.type === 'island-rack' && '▭'}
                          {fixture.type === 'table' && '▢'}
                          {fixture.type === 'gondola' && '☰'}
                          {fixture.type === 'mannequin' && '◆'}
                          {fixture.type === 'checkout' && '₹'}
                        </text>

                        {/* Labels */}
                        {showLabels && (
                          <>
                            <text
                              x={(fixture.x + fixture.width / 2) * 24}
                              y={(fixture.y + fixture.height / 2 + 0.3) * 24}
                              textAnchor="middle"
                              className="fill-gray-600 text-xs font-medium pointer-events-none"
                            >
                              {fixture.label}
                            </text>
                            <text
                              x={(fixture.x + fixture.width / 2) * 24}
                              y={(fixture.y + fixture.height / 2 + 0.7) * 24}
                              textAnchor="middle"
                              className="fill-gray-500 text-[10px] pointer-events-none"
                            >
                              {fixture.products}/{fixture.capacity}
                            </text>
                          </>
                        )}

                        {/* Utilization indicator */}
                        {fixture.capacity > 0 && (
                          <circle
                            cx={(fixture.x + fixture.width - 0.3) * 24}
                            cy={(fixture.y + 0.3) * 24}
                            r="5"
                            className={cn(
                              fixture.products / fixture.capacity > 0.9 ? 'fill-red-500' :
                              fixture.products / fixture.capacity > 0.7 ? 'fill-amber-500' :
                              'fill-green-500'
                            )}
                          />
                        )}
                      </g>
                    );
                  })}
                </svg>
              </div>
              {/* eslint-enable no-restricted-syntax */}

              {/* Legend */}
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-6">
                  {viewMode === 'department' && (
                    <div className="flex items-center gap-3">
                      {Object.entries(departmentColors).filter(([key]) => key !== 'CASH').map(([key, dept]) => (
                        <div key={key} className="flex items-center gap-1.5">
                          <div className={cn("w-4 h-4 rounded border", dept.bg.replace('fill-', 'bg-'), dept.border.replace('stroke-', 'border-'))} />
                          <span className="text-xs text-gray-600">{dept.label}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {viewMode === 'performance' && (
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500">Utilization:</span>
                      <div className="flex items-center gap-1">
                        <div className="w-4 h-4 bg-green-100 border border-green-400 rounded" />
                        <span className="text-xs text-gray-600">&lt;70%</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-4 h-4 bg-amber-100 border border-amber-400 rounded" />
                        <span className="text-xs text-gray-600">70-90%</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-4 h-4 bg-red-100 border border-red-400 rounded" />
                        <span className="text-xs text-gray-600">&gt;90%</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>▬ Wall Rack</span>
                  <span>▭ Island</span>
                  <span>▢ Table</span>
                  <span>☰ Gondola</span>
                  <span>◆ Mannequin</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Metrics & Products */}
        <div className="w-80 space-y-3">
          {/* Department Metrics */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-3 py-2 border-b border-gray-100">
              <h3 className="text-xs font-semibold text-gray-900">Department Metrics</h3>
            </div>
            <div className="p-3 space-y-1.5">
              {departmentMetrics.map(metric => {
                const deptColor = departmentColors[metric.department as keyof typeof departmentColors];
                return (
                  <div key={metric.department} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <div className={cn("w-2 h-2 rounded", deptColor?.bg.replace('fill-', 'bg-'))} />
                        <span className="text-[10px] font-medium text-gray-900">{deptColor?.label}</span>
                      </div>
                      <span className="text-[10px] text-gray-500">{metric.fixtures}f</span>
                    </div>
                    <div className="flex items-center gap-1 ml-3">
                      <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full",
                            metric.utilization > 90 ? "bg-red-500" :
                            metric.utilization > 70 ? "bg-amber-500" :
                            "bg-green-500"
                          )}
                          // eslint-disable-next-line no-restricted-syntax -- Dynamic value
                          style={{ width: `${metric.utilization}%` }}
                        />
                      </div>
                      <span className="text-[9px] text-gray-600">{metric.utilization}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Fixture with Products */}
          {selectedFixtureData && (
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-xs font-semibold text-gray-900">
                  {selectedFixtureData.label || selectedFixtureData.id}
                </h3>
                <button
                  onClick={() => setSelectedFixture(null)}
                  className="text-gray-400 hover:text-gray-600 text-sm"
                >
                  ✕
                </button>
              </div>

              {/* Fixture Info */}
              <div className="px-3 py-2 border-b border-gray-100 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-gray-500">Type</span>
                  <span className="text-xs font-medium text-gray-900 capitalize">
                    {selectedFixtureData.type.replace('-', ' ')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-gray-500">Department</span>
                  <span className="text-xs font-medium text-gray-900">
                    {departmentColors[selectedFixtureData.department as keyof typeof departmentColors]?.label}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-gray-500">Capacity</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-900">
                      {selectedFixtureData.products} / {selectedFixtureData.capacity}
                    </span>
                    <span className={cn(
                      "text-[10px] font-medium px-1.5 py-0.5 rounded",
                      selectedFixtureData.capacity > 0 && (selectedFixtureData.products / selectedFixtureData.capacity) > 0.9
                        ? "bg-red-100 text-red-700"
                        : selectedFixtureData.capacity > 0 && (selectedFixtureData.products / selectedFixtureData.capacity) > 0.7
                        ? "bg-amber-100 text-amber-700"
                        : "bg-green-100 text-green-700"
                    )}>
                      {selectedFixtureData.capacity > 0 ? Math.round((selectedFixtureData.products / selectedFixtureData.capacity) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Products Display */}
              <div className="p-3">
                <div className="text-[10px] font-semibold text-gray-700 mb-2">Products on Display</div>
                <div className="grid grid-cols-4 gap-1.5 max-h-48 overflow-y-auto">
                  {Array.from({ length: selectedFixtureData.products }).slice(0, 20).map((_, idx) => (
                    <div
                      key={idx}
                      className="relative group cursor-pointer"
                    >
                      <div className="aspect-[3/4] bg-gradient-to-b from-gray-100 to-gray-200 rounded overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20" />
                        <div className="absolute bottom-0 left-0 right-0 p-1 bg-gradient-to-t from-black/50 to-transparent">
                          <div className="text-[7px] text-white font-medium truncate">
                            #{selectedFixtureData.id.slice(0, 3)}{idx + 1001}
                          </div>
                          <div className="text-[6px] text-white/80">
                            {getCurrencySymbol()}{((idx * 137 + 29) % 2000) + 500}
                          </div>
                        </div>
                        {/* Stock indicator */}
                        <div className={cn(
                          "absolute top-1 right-1 w-1.5 h-1.5 rounded-full",
                          idx % 7 === 0 ? "bg-red-500" :
                          idx % 5 === 0 ? "bg-amber-500" :
                          "bg-green-500"
                        )} />
                      </div>

                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 touch:opacity-100 transition-opacity rounded p-1 flex flex-col justify-center">
                        <div className="text-[7px] text-white font-medium">Style #{idx + 1001}</div>
                        <div className="text-[6px] text-gray-400 mt-0.5">
                          {idx % 3 === 0 ? 'New' : idx % 2 === 0 ? 'Best' : 'Trend'}
                        </div>
                        <div className="text-[6px] text-gray-400">
                          {((idx * 17 + 7) % 50) + 10} units
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {selectedFixtureData.products > 20 && (
                  <div className="text-center mt-2">
                    <span className="text-[9px] text-gray-500">
                      +{selectedFixtureData.products - 20} more products
                    </span>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="mt-3 pt-3 border-t border-gray-100 flex gap-2">
                  <button className="flex-1 px-2 py-1 bg-indigo-700 text-white text-[10px] font-medium rounded hover:bg-indigo-800">
                    Rebalance
                  </button>
                  <button className="flex-1 px-2 py-1 bg-white border border-gray-300 text-gray-700 text-[10px] font-medium rounded hover:bg-gray-50">
                    Details
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Store Insights */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-3 py-2 border-b border-gray-100 flex items-center gap-2">
              <Info className="w-3 h-3 text-primary" />
              <h3 className="text-xs font-semibold text-gray-900">Insights</h3>
            </div>
            <div className="p-3 space-y-2">
              <div className="p-2 bg-amber-50 border border-amber-200 rounded">
                <div className="flex items-start gap-1">
                  <AlertTriangle className="w-3 h-3 text-amber-600 mt-0.5" />
                  <div>
                    <div className="text-[10px] font-medium text-amber-800">High Density Alert</div>
                    <div className="text-[9px] text-amber-700">Women's Western at 92% capacity. Consider rebalancing.</div>
                  </div>
                </div>
              </div>
              <div className="p-2 bg-blue-50 border border-blue-200 rounded">
                <div className="text-[10px] font-medium text-blue-800">Optimization</div>
                <div className="text-[9px] text-blue-700">Men's Formal at 55% capacity. Space for 28 more styles.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}