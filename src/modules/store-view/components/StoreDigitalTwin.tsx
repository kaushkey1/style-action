import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ExternalLink, LayoutGrid, Grid3X3, ZoomIn, ZoomOut, RotateCcw, BarChart3, FileText, Loader2 } from 'lucide-react';
import { cn, STALE_TIMES } from '@/lib/utils';
import { appApiFetch } from '@/lib/api';
import { useFixtureView } from '../api/storePerformanceHooks';
import { NPSViewPanel } from './NPSViewPanel';
import type { StorePlanogramEntry } from '../stores/unified-planning.store';

interface LayoutFile {
  format: string;
  store_code: string;
  store_name: string;
  gcs_file_path: string;
  signed_url: string;
}

interface StoreLayoutResponse {
  store_code: string;
  files: LayoutFile[];
}

interface StoreDigitalTwinProps {
  storeCode?: string;
  storeId?: string;
  yearMonth?: string;
  planogram?: StorePlanogramEntry[];
  onViewChange?: (view: '2d' | 'fixture' | 'nps') => void;
  /** Hide the NPS View toggle (e.g. when NPS lives in a separate Customer Voice
   *  tab). Defaults to true so existing usages are unaffected. */
  showNpsView?: boolean;
}

const segmentColors: Record<string, { bg: string; text: string; dot: string }> = {
  "Men's Casual": { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  "Men's Formal": { bg: 'bg-cyan-50', text: 'text-cyan-700', dot: 'bg-cyan-400' },
  "Women's Indian Wear": { bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-400' },
  "Women's Western Wear": { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  "Kids Wear": { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
};

export function StoreDigitalTwin({
  storeCode = '5943',
  yearMonth,
  onViewChange,
  showNpsView = true,
}: StoreDigitalTwinProps) {
  const [viewType, setViewType] = useState<'2d' | '3d' | 'fixture' | 'nps'>('2d');

  const handleViewChange = useCallback((next: '2d' | 'fixture' | 'nps') => {
    setViewType(next);
    onViewChange?.(next);
  }, [onViewChange]);
  const [hoveredFixture, setHoveredFixture] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);

  const zoomIn = useCallback(() => setZoom(z => Math.min(z + 0.25, 3)), []);
  const zoomOut = useCallback(() => setZoom(z => Math.max(z - 0.25, 0.5)), []);
  const zoomReset = useCallback(() => setZoom(1), []);

  const { data: fixtureData, isLoading: fixtureLoading } = useFixtureView(storeCode, yearMonth);

  // Fetch store layout PDF from API
  const { data: layoutData, isLoading: layoutLoading } = useQuery({
    queryKey: ['store-layout', storeCode],
    queryFn: () => appApiFetch<StoreLayoutResponse>(`/store-view/${storeCode}/layout`),
    enabled: !!storeCode,
    staleTime: STALE_TIMES.DETAIL,
  });
  const layoutPdfUrl = layoutData?.files?.[0]?.signed_url ?? null;
  const dg2nSrc = `https://ai.dg2n.com/trends/s/${storeCode}/digital-twin-anon`;

  const zones = [
    { name: 'Mens Casual', color: 'bg-blue-500' },
    { name: 'Mens Formal', color: 'bg-cyan-400' },
    { name: 'Womens Ethnic', color: 'bg-yellow-400' },
    { name: 'Womens Western', color: 'bg-green-500' },
    { name: 'Kids', color: 'bg-purple-500' },
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6 overflow-hidden">
      {/* Header with view toggle — complex layout with toggle buttons, not a simple section header */}
      {/* eslint-disable-next-line design-system/prefer-section-header */}
      <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Store Digital Twin
          </span>
          <span className="text-sm text-gray-600">
            GMetri Planogram
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white border border-gray-200 rounded-lg p-0.5">
            <button
              onClick={() => handleViewChange('2d')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                viewType === '2d'
                  ? 'bg-primary text-white'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              <LayoutGrid className="w-4 h-4" />
              2D View
            </button>
            {/* <button
              onClick={() => setViewType('3d')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                viewType === '3d'
                  ? 'bg-primary text-white'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              <Box className="w-4 h-4" />
              3D View
            </button> */}
            <button
              onClick={() => handleViewChange('fixture')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                viewType === 'fixture'
                  ? 'bg-primary text-white'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              <Grid3X3 className="w-4 h-4" />
              Fixture View
            </button>
            {showNpsView && (
              <button
                onClick={() => handleViewChange('nps')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                  viewType === 'nps'
                    ? 'bg-primary text-white'
                    : 'text-gray-600 hover:text-gray-900'
                )}
              >
                <BarChart3 className="w-4 h-4" />
                NPS View
              </button>
            )}
          </div>

          <button
            type="button"
            className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 font-medium"
            onClick={() => window.open(dg2nSrc, '_blank', 'noopener,noreferrer')}
          >
            Open in GMetri
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* View area */}
      <div className="relative">
        {viewType === '2d' ? (
          <div className="relative">
            {/* Zoom controls */}
            <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
            <div className="flex items-center gap-1 bg-white/90 border border-gray-200 rounded-lg p-1 shadow-sm">
              <button
                onClick={zoomOut}
                className="p-1.5 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                title="Zoom out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-medium text-gray-600 min-w-[3rem] text-center tabular-nums">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={zoomIn}
                className="p-1.5 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                title="Zoom in"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <div className="w-px h-4 bg-gray-200 mx-0.5" />
              <button
                onClick={zoomReset}
                className="p-1.5 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                title="Reset zoom"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
            {layoutPdfUrl && (
              <a
                href={layoutPdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 bg-white/90 border border-gray-200 rounded-lg px-2.5 py-1.5 shadow-sm text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open PDF
              </a>
            )}
            </div>
            {/* Layout PDF viewer */}
            <div className="overflow-auto h-[500px] bg-white scroll-smooth">
              {layoutLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="w-6 h-6 border-2 border-gray-300 border-t-primary rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Loading store layout...</p>
                  </div>
                </div>
              ) : layoutPdfUrl ? (
                 
                <iframe
                  key={zoom}
                  src={`${layoutPdfUrl}#toolbar=0&navpanes=0&zoom=${Math.round(zoom * 100)}`}
                  title="Store Layout PDF"
                  style={{ width: `${zoom * 100}%`, height: `${zoom * 500}px`, minWidth: '100%', border: 'none', display: 'block' }} // eslint-disable-line no-restricted-syntax -- iframe sized at zoom×base so PDF viewer renders at native resolution without pixel-upscaling blur
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No layout available for this store</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : viewType === '3d' ? (
          <iframe
            src={dg2nSrc}
            title="Store 3D View"
            className="w-full h-[500px] border-0"
            allowFullScreen
          />
        ) : viewType === 'nps' ? (
          <NPSViewPanel storeCode={storeCode} />
        ) : null
          // <img
          //   src="/Screenshot3.png"
          //   alt="Store Fixture view"
          //   className="w-full h-auto max-h-[400px] object-contain bg-gray-100"
          // />
        }
      </div>

      {/* Fixture Data Overlay — visible when Fixture View is active */}
      {viewType === 'fixture' && (
        <div className="px-5 py-4 border-t border-gray-100 space-y-5">
          {fixtureLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-gray-400 mr-2" />
              <span className="text-sm text-gray-500">Loading fixture data...</span>
            </div>
          ) : !fixtureData ? (
            <div className="text-center py-12">
              <p className="text-sm text-gray-500">No fixture data available for this store</p>
            </div>
          ) : (
            <>
              {/* Fixture Summary Row */}
              {/* eslint-disable-next-line design-system/prefer-metric-grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: 'Total Fixtures', value: fixtureData.total_fixtures?.toLocaleString('en-IN') ?? 'N/A', sub: '' },
                  { label: 'Current Stock Quantity', value: fixtureData.current_stock?.toLocaleString('en-IN') ?? 'N/A', sub: '' },
                  { label: 'Max Capacity', value: fixtureData.max_capacity?.toLocaleString('en-IN') ?? 'N/A', sub: '' },
                  { label: 'Avg Utilization', value: fixtureData.avg_utilization != null ? `${Math.round(fixtureData.avg_utilization)}%` : 'N/A', sub: 'vs 85% target' },
                ].map((metric) => (
                  <div key={metric.label} className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500">{metric.label}</p>
                    <p className="text-xl font-bold text-gray-900">{metric.value}</p>
                    <p className="text-xs text-gray-500">{metric.sub}</p>
                  </div>
                ))}
              </div>

              {/* Fixture Overlay Table */}
              {fixtureData.overlay.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Fixture Overlay
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-2">Type</th>
                          <th className="text-right py-2 px-2">No of Fixtures</th>
                          <th className="text-left py-2 px-2">Category</th>
                          <th className="text-right py-2 px-2">Slots</th>
                          <th className="text-right py-2 px-2">Filled Slots</th>
                          <th className="text-right py-2 px-2">Utilization</th>
                        </tr>
                      </thead>
                      <tbody>
                        {fixtureData.overlay.map((item, idx) => {
                          const slots = item.slots ?? 0;
                          const filled = item.filledslots ?? 0;
                          const util = slots > 0 ? Math.round((filled / slots) * 100) : 0;
                          const category = item.category_desc ?? '';
                          const colors = segmentColors[category];
                          const isHovered = hoveredFixture === `${item.fixture_type}-${idx}`;
                          return (
                            <tr
                              key={`${item.fixture_type}-${item.category_desc}-${idx}`}
                              className={cn(
                                'border-b transition-colors cursor-default',
                                colors?.bg || 'bg-white',
                                isHovered && 'ring-1 ring-inset ring-gray-300'
                              )}
                              onMouseEnter={() => setHoveredFixture(`${item.fixture_type}-${idx}`)}
                              onMouseLeave={() => setHoveredFixture(null)}
                            >
                              <td className="py-2 px-2">{item.fixture_type ?? '—'}</td>
                              <td className="text-right py-2 px-2 tabular-nums">{item.fixture_count ?? '—'}</td>
                              <td className="py-2 px-2">
                                <span className="flex items-center gap-1.5">
                                  {colors && <span className={cn('w-2 h-2 rounded-full', colors.dot)} />}
                                  <span className={colors?.text}>{category || '—'}</span>
                                </span>
                              </td>
                              <td className="text-right py-2 px-2 tabular-nums">{slots}</td>
                              <td className="text-right py-2 px-2 tabular-nums">{filled}</td>
                              <td className="text-right py-2 px-2">
                                <span className={cn(
                                  'font-semibold',
                                  util >= 80 ? 'text-green-600' : util >= 60 ? 'text-amber-600' : 'text-red-600'
                                )}>
                                  {util}%
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Footer with zones legend and metadata — footer bar, not a section header */}
      {/* eslint-disable-next-line design-system/prefer-section-header */}
      <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500 mr-2">Zones:</span>
          {zones.map((zone, idx) => (
            <div key={idx} className="flex items-center gap-1 mr-3">
              <div className={cn('w-3 h-3 rounded-sm', zone.color)} />
              <span className="text-xs text-gray-600">{zone.name}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span>Last updated: 48hrs ago</span>
        </div>
      </div>

    </div>
  );
}
