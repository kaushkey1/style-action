import { useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui';

import type { CameraHeatmapEntry } from '../api/smartiTypes';

interface CameraHeatmapGridProps {
  cameras: CameraHeatmapEntry[];
}

const PAGE_SIZE = 6;

export function CameraHeatmapGrid({ cameras }: CameraHeatmapGridProps): React.ReactNode {
  const [page, setPage] = useState(0);

  const totalPages = Math.ceil(cameras.length / PAGE_SIZE);
  const start = page * PAGE_SIZE;
  const visible = cameras.slice(start, start + PAGE_SIZE);

  return (
    <div className="space-y-4">
      {/* eslint-disable-next-line design-system/prefer-metric-grid -- camera heatmap cards, not metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {visible.map((cam) => (
          <div key={cam.cameraId} className="border border-gray-200 rounded-lg overflow-hidden">
            {/* eslint-disable-next-line design-system/prefer-section-header -- camera card header with status badge, not a page section */}
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-xs font-medium text-gray-700 truncate max-w-[160px]" title={cam.cameraName}>
                {cam.cameraName}
              </span>
              <Badge variant={cam.isActive ? 'success' : 'outline'} size="sm">
                {cam.isActive ? 'Online' : 'Offline'}
              </Badge>
            </div>
            {/* Image */}
            <div className="aspect-video bg-gray-100 flex items-center justify-center">
              {cam.imageUrl ? (
                <img
                  src={cam.imageUrl}
                  alt={`Heatmap for ${cam.cameraName}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-1.5 text-gray-400">
                  <AlertCircle className="w-6 h-6" />
                  <span className="text-[11px]">Camera Image is unavailable</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        /* eslint-disable-next-line design-system/prefer-section-header -- pagination controls, not a page section */
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-gray-500">
            {start + 1} - {Math.min(start + PAGE_SIZE, cameras.length)} of {cameras.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="p-1.5 rounded text-gray-400 hover:text-gray-600 disabled:opacity-30"
              disabled={page === 0}
              onClick={() => setPage(0)}
              aria-label="First page"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="p-1.5 rounded text-gray-400 hover:text-gray-600 disabled:opacity-30"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                type="button"
                className={`min-w-[28px] h-7 rounded text-xs font-medium transition-colors ${
                  i === page
                    ? 'bg-indigo-500 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                onClick={() => setPage(i)}
                aria-label={`Page ${i + 1}`}
                aria-current={i === page ? 'page' : undefined}
              >
                {i + 1}
              </button>
            ))}
            <button
              type="button"
              className="p-1.5 rounded text-gray-400 hover:text-gray-600 disabled:opacity-30"
              disabled={page === totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="p-1.5 rounded text-gray-400 hover:text-gray-600 disabled:opacity-30"
              disabled={page === totalPages - 1}
              onClick={() => setPage(totalPages - 1)}
              aria-label="Last page"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
