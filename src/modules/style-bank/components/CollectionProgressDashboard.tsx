import { AlertTriangle, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useShowroomCurationStore } from '../stores/useShowroomCurationStore';
import type { CollectionProgress } from '../types/showroom-types';
import { cn } from '@/lib/utils';
import {
  Badge,
  DataTable,
  DataTableHeader,
  DataTableBody,
  DataTableRow,
  DataTableHead,
  DataTableCell,
} from '@/components/ui';

const STATUS_CONFIG: Record<CollectionProgress['status'], { label: string; variant: 'default' | 'warning' | 'info' | 'primary' | 'success' }> = {
  not_started: { label: 'Not Started', variant: 'default' },
  designer_review: { label: 'Designer Review', variant: 'warning' },
  buyer_review: { label: 'Buyer Review', variant: 'info' },
  cat_head_review: { label: 'Cat Head Review', variant: 'primary' },
  finalized: { label: 'Finalized', variant: 'success' },
};

export function CollectionProgressDashboard() {
  const { showroomSummary, collectionProgress } = useShowroomCurationStore();
  const navigate = useNavigate();

  if (!showroomSummary) return null;

  const { overallCompletion } = showroomSummary;

  return (
    <div className="min-h-screen bg-gray-50 animate-fadeInUp">
      {/* Summary header */}
      <div className="bg-white border-b border-gray-200 px-6 py-5">
        {/* Overall progress bar */}
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          { }
          <div
            className={cn(
              'h-full rounded-full transition-all duration-700',
              overallCompletion >= 90 ? 'bg-green-500' : overallCompletion >= 70 ? 'bg-amber-500' : 'bg-red-500'
            )}
            // eslint-disable-next-line no-restricted-syntax -- dynamic width
            style={{ width: `${overallCompletion}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">{overallCompletion}% overall completion</p>
      </div>

      <div className="p-4 space-y-4">
        {/* POD table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <DataTable>
            <DataTableHeader>
              <DataTableHead>POD</DataTableHead>
              <DataTableHead align="right">Pool</DataTableHead>
              <DataTableHead align="right">Designer</DataTableHead>
              <DataTableHead align="right">Buyer</DataTableHead>
              <DataTableHead align="right">Final</DataTableHead>
              <DataTableHead>Status</DataTableHead>
              <DataTableHead>Completion</DataTableHead>
              <DataTableHead>Team</DataTableHead>
              <DataTableHead className="w-8"><span className="sr-only">Navigate</span></DataTableHead>
            </DataTableHeader>
            <DataTableBody>
              {collectionProgress.map((pod) => {
                const statusConfig = STATUS_CONFIG[pod.status];
                return (
                  <DataTableRow
                    key={pod.podId}
                    className="cursor-pointer group/row focus-visible:outline-none focus-kb:ring-2 focus-kb:ring-primary focus-kb:ring-offset-2"
                    onClick={() => navigate(`/showroom/curate/${pod.podId}`)}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        navigate(`/showroom/curate/${pod.podId}`);
                      }
                    }}
                  >
                    <DataTableCell>
                      <div className="flex items-center gap-2">
                        {pod.atRisk && <AlertTriangle className="w-4 h-4 text-red-500" />}
                        <div>
                          <p className="text-sm font-medium text-gray-900">{pod.podId}</p>
                          <p className="text-xs text-gray-500">{pod.podName}</p>
                        </div>
                      </div>
                    </DataTableCell>
                    <DataTableCell align="right" className="text-sm text-gray-600">{pod.poolCount}</DataTableCell>
                    <DataTableCell align="right" className="text-sm text-gray-600">{pod.designerShortlistCount}</DataTableCell>
                    <DataTableCell align="right" className="text-sm text-gray-600">{pod.buyerShortlistCount || '\u2014'}</DataTableCell>
                    <DataTableCell align="right" className="text-sm text-gray-600">{pod.finalApprovedCount || '\u2014'}</DataTableCell>
                    <DataTableCell>
                      <Badge variant={statusConfig.variant} size="sm">
                        {statusConfig.label}
                      </Badge>
                    </DataTableCell>
                    <DataTableCell>
                      <div className="flex items-center gap-2 min-w-[120px]">
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          { }
                          <div
                            className={cn(
                              'h-full rounded-full transition-all',
                              pod.completionPercentage === 100 ? 'bg-green-500' :
                              pod.completionPercentage >= 60 ? 'bg-amber-500' : 'bg-red-500'
                            )}
                            // eslint-disable-next-line no-restricted-syntax -- dynamic width
                            style={{ width: `${pod.completionPercentage}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-gray-600 w-8">{pod.completionPercentage}%</span>
                      </div>
                    </DataTableCell>
                    <DataTableCell>
                      <div className="flex -space-x-1">
                        <InitialAvatar name={pod.designer} color="bg-blue-100 text-blue-700" />
                        <InitialAvatar name={pod.buyer} color="bg-green-100 text-green-700" />
                        <InitialAvatar name={pod.categoryHead} color="bg-purple-100 text-purple-700" />
                      </div>
                    </DataTableCell>
                    <DataTableCell>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover/row:text-gray-600 transition-colors" />
                    </DataTableCell>
                  </DataTableRow>
                );
              })}
            </DataTableBody>
          </DataTable>
        </div>


      </div>
    </div>
  );
}

function InitialAvatar({ name, color }: { name: string; color: string }) {
  const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2);
  return (
    <div className={cn('w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium border border-white', color)} title={name}>
      {initials}
    </div>
  );
}
