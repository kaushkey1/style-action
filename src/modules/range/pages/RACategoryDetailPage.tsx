/* eslint-disable design-system/prefer-section-header, design-system/prefer-metric-grid -- range architecture uses custom layouts */
import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Package, History, X } from 'lucide-react';
import { KpiCard } from '../components/KpiCard';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState, ShimmerKpiGrid, ShimmerTable, Badge } from '@/components/ui';
import { cn } from '@/lib/utils';
import { useRangeStore } from '../stores/useRangeStore';
import { useHits, useSegmentSummary } from '../api/rangeHooks';
import { getRACategoryEntries } from '../data/mockRACategoryView';
import type { RACategoryEntry } from '../data/mockRACategoryView';

const CATEGORY_NAME_MAP: Record<string, string> = {
  '42': 'Men Western: Formal Shirts',
  '55': 'Men Western: Casual Shirts',
  '56': 'Men Western: Denim Bottoms',
  '80': 'Men Western: Casual T-shirts',
};

const GRADE_COLOR_DEFAULT = { bg: 'bg-gray-100', text: 'text-gray-700' } as const;

const FASHION_GRADE_COLORS: Record<string, { bg: string; text: string }> = {
  COR: { bg: 'bg-blue-100', text: 'text-blue-700' },
  FSH: { bg: 'bg-purple-100', text: 'text-purple-700' },
  ULT: { bg: 'bg-amber-100', text: 'text-amber-700' },
  FB:  GRADE_COLOR_DEFAULT,
};

interface AuditTrail {
  workflowId: string;
  createdDate: string;
  lastModified: string;
  status: string;
  approvedBy: string;
  approvalDate: string;
  changes: Array<{ field: string; from: string; to: string; user: string; date: string }>;
}

const AUDIT_DEFAULT: AuditTrail = {
  workflowId: 'RAF085000455502AWSS2026H5',
  createdDate: '2024-03-15 09:30 AM',
  lastModified: '2024-03-18 02:45 PM',
  status: 'Approved',
  approvedBy: 'Rajesh Kumar',
  approvalDate: '2024-03-18 03:00 PM',
  changes: [
    { field: 'Buy Options', from: '240', to: '245', user: 'Priya Sharma', date: '2024-03-16 10:00 AM' },
    { field: 'Buy Quantity', from: '175 K', to: '180 K', user: 'Amit Patel', date: '2024-03-17 11:30 AM' },
    { field: 'Price Points', from: '1,199-1,399', to: '1,299', user: 'Priya Sharma', date: '2024-03-17 02:00 PM' },
  ],
};

const AUDIT_DATA: Record<string, AuditTrail> = {
  COR: AUDIT_DEFAULT,
  FSH: {
    workflowId: 'RAF085000455503AWSS2026H5',
    createdDate: '2024-03-14 10:00 AM',
    lastModified: '2024-03-19 11:30 AM',
    status: 'Approved',
    approvedBy: 'Sunita Mehta',
    approvalDate: '2024-03-19 12:00 PM',
    changes: [
      { field: 'Hierarchy Updates', from: 'Seasonal Styles', to: 'Fashion Forward', user: 'Vikram Singh', date: '2024-03-15 09:00 AM' },
      { field: 'Buy Options', from: '300', to: '312', user: 'Neha Gupta', date: '2024-03-16 03:00 PM' },
      { field: 'Store Coverage', from: '350', to: '385', user: 'Vikram Singh', date: '2024-03-18 10:00 AM' },
    ],
  },
  ULT: {
    workflowId: 'RAF085000455504AWSS2026H5',
    createdDate: '2024-03-13 02:00 PM',
    lastModified: '2024-03-17 04:00 PM',
    status: 'Under Review',
    approvedBy: '-',
    approvalDate: '-',
    changes: [
      { field: 'Buy Quantity', from: '50 K', to: '45 K', user: 'Arjun Reddy', date: '2024-03-14 11:00 AM' },
      { field: 'Price Range', from: '2,499-3,499', to: '2,999', user: 'Kavita Rao', date: '2024-03-15 02:30 PM' },
      { field: 'FTF Adoption Target', from: '60%', to: '42%', user: 'Arjun Reddy', date: '2024-03-17 03:30 PM' },
    ],
  },
  FB: {
    workflowId: 'RAF085000455505AWSS2026H5',
    createdDate: '2024-03-12 11:00 AM',
    lastModified: '2024-03-16 09:00 AM',
    status: 'Approved',
    approvedBy: 'Deepak Joshi',
    approvalDate: '2024-03-16 10:00 AM',
    changes: [
      { field: 'Buy Options', from: '150', to: '156', user: 'Ritu Verma', date: '2024-03-13 10:00 AM' },
      { field: 'Mix %', from: '8%', to: '10%', user: 'Sanjay Kapoor', date: '2024-03-14 02:00 PM' },
      { field: 'Store Coverage', from: 'All Stores', to: '420 Stores', user: 'Ritu Verma', date: '2024-03-15 11:00 AM' },
    ],
  },
};

function getAuditTrailData(grade: string): AuditTrail {
  return AUDIT_DATA[grade] ?? AUDIT_DEFAULT;
}

export default function RACategoryDetailPage(): React.ReactNode {
  const { categoryCode } = useParams();
  const navigate = useNavigate();
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [selectedGradeAudit, setSelectedGradeAudit] = useState('');

  const selectedHit = useRangeStore((s) => s.selectedHit);
  const selectHit = useRangeStore((s) => s.selectHit);

  const { data: availableHits } = useHits();
  const { data: segmentSummary, isLoading: summaryLoading } = useSegmentSummary(categoryCode ?? '', selectedHit ?? '');

  useEffect(() => {
    if (availableHits?.default_hit && !selectedHit) {
      selectHit(availableHits.default_hit);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- set default hit when data arrives
  }, [availableHits]);

  const categoryName = categoryCode ? (CATEGORY_NAME_MAP[categoryCode] ?? categoryCode) : '';
  const entries: RACategoryEntry[] = useMemo(
    () => (categoryCode ? getRACategoryEntries(categoryCode) : []),
    [categoryCode],
  );

  if (!selectedHit || summaryLoading) {
    return (
      <div className="flex flex-col h-full bg-gray-50">
        <div className="bg-white border-b border-gray-200 h-[92px]" />
        <div className="p-4 md:px-6 md:py-6 space-y-4">
          <ShimmerKpiGrid />
          <ShimmerTable rows={6} />
        </div>
      </div>
    );
  }

  if (!categoryCode || (entries.length === 0 && !segmentSummary)) {
    return (
      <div className="flex flex-col h-full bg-gray-50 items-center justify-center">
        <EmptyState
          icon={Package}
          title="Category not found"
          description="Unable to load category data. Please select a valid category."
        />
      </div>
    );
  }

  const formatQty = (qty: number): string => {
    if (qty >= 1000) return `${(qty / 1000).toFixed(0)} K`;
    return qty.toString();
  };

  const handleRowClick = (entry: RACategoryEntry): void => {
    navigate(`/ra/segment/${entry.segmentId}/family/${entry.familyId}/brick/${entry.brickId}`);
  };

  const handleRowKeyDown = (e: React.KeyboardEvent, entry: RACategoryEntry): void => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleRowClick(entry);
    }
  };

  const openAudit = (gradeCode: string, e: React.MouseEvent): void => {
    e.stopPropagation();
    setSelectedGradeAudit(gradeCode);
    setShowAuditModal(true);
  };

  const closeAudit = (): void => {
    setShowAuditModal(false);
    setSelectedGradeAudit('');
  };

  const auditData = selectedGradeAudit ? getAuditTrailData(selectedGradeAudit) : null;

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="h-[52px] px-4 md:px-6 flex items-center justify-between">
          <button
            onClick={() => navigate('/range')}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors min-h-[44px] md:min-h-0"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Go back to Network Overview</span>
          </button>
          {selectedHit && (
            <div className="text-sm font-semibold text-primary-700 bg-indigo-50 border border-indigo-200 rounded-lg px-3.5 py-1.5">
              {selectedHit}
            </div>
          )}
        </div>

        <div className="h-[40px] px-4 md:px-6 flex items-center">
          <button className="px-1 py-3 border-b-2 text-sm font-medium border-indigo-700 text-primary-700">
            {categoryName} ({categoryCode})
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 md:px-6 md:py-6 space-y-4 md:space-y-6">
        {/* KPI Cards */}
        {segmentSummary && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard
              label="Range Progress"
              value={segmentSummary.range_progress.pct != null ? segmentSummary.range_progress.pct.toString() : '0'}
              unit="%"
              status={segmentSummary.range_progress.status as 'On Track' | 'At Risk' | 'Monitor' || 'On Track'}
              target={`${segmentSummary.range_progress.options_planned}${segmentSummary.range_progress.options_target != null ? ` / ${segmentSummary.range_progress.options_target}` : ''} options`}
              progressValue={segmentSummary.range_progress.pct ?? undefined}
            />
            <KpiCard
              label="AOP Target"
              value={segmentSummary.aop_target.current_value.toLocaleString()}
              unit=""
              status={segmentSummary.aop_target.status as 'On Track' | 'At Risk' | 'Monitor' || 'On Track'}
              target={segmentSummary.aop_target.target_value != null ? `Target: ${segmentSummary.aop_target.target_value.toLocaleString()}` : ''}
              progressValue={segmentSummary.aop_target.pct ?? undefined}
            />
            <KpiCard
              label="Fixture Utilization"
              value={segmentSummary.fixture_utilization.pct != null ? segmentSummary.fixture_utilization.pct.toString() : 'N/A'}
              unit="%"
              status={segmentSummary.fixture_utilization.status as 'Healthy' | 'Monitor' || 'Healthy'}
              target={segmentSummary.fixture_utilization.pct != null && segmentSummary.fixture_utilization.pct < 80 ? 'Below 80% target' : 'On target'}
            />
            <KpiCard
              label="FTF Adoption"
              value={segmentSummary.ftf_adoption.ftf_pct.toString()}
              unit="%"
              status={segmentSummary.ftf_adoption.status as 'On Track' | 'Low' || 'On Track'}
              target={`${segmentSummary.ftf_adoption.ftf_bricks} / ${segmentSummary.ftf_adoption.total_bricks} bricks`}
              progressValue={segmentSummary.ftf_adoption.ftf_pct}
            />
          </div>
        )}

        {/* RA Entries Table */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Range Architecture Entries</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {entries.length} entries across fashion grades and buying models for {categoryName}
            </p>
          </div>

          {entries.length === 0 ? (
            <EmptyState description="No range architecture entries for this category" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b border-gray-100 text-xs text-gray-500 font-medium">
                    <th className="text-left px-4 py-2.5 font-medium">RA ID</th>
                    <th className="text-left px-4 py-2.5 font-medium">FASHION GRADE</th>
                    <th className="text-left px-4 py-2.5 font-medium">BUYING MODEL</th>
                    <th className="text-left px-4 py-2.5 font-medium">OPTIONS</th>
                    <th className="text-left px-4 py-2.5 font-medium">BUY QTY</th>
                    <th className="text-left px-4 py-2.5 font-medium">MIX %</th>
                    <th className="text-left px-4 py-2.5 font-medium">AVG PRICE</th>
                    <th className="text-left px-4 py-2.5 font-medium">STORES</th>
                    <th className="text-left px-4 py-2.5 font-medium">FTF</th>
                    <th className="text-left px-4 py-2.5 font-medium">STATUS</th>
                    <th className="w-[28px]"></th>
                    <th className="w-[28px]"></th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => {
                    const gradeColors = FASHION_GRADE_COLORS[entry.fashionGradeCode] ?? GRADE_COLOR_DEFAULT;
                    return (
                      <tr
                        key={entry.id}
                        className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                        tabIndex={0}
                        role="link"
                        aria-label={`View details for ${entry.fashionGrade} ${entry.bmCode}`}
                        onClick={() => handleRowClick(entry)}
                        onKeyDown={(e) => handleRowKeyDown(e, entry)}
                      >
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium text-primary">{entry.raId}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              'inline-flex items-center justify-center w-8 h-8 rounded-lg text-[10px] font-bold',
                              gradeColors.bg, gradeColors.text,
                            )}>
                              {entry.fashionGradeCode}
                            </span>
                            <span className="text-sm font-medium text-gray-900">{entry.fashionGrade}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-primary-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                              {entry.bmCode}
                            </span>
                            <span className="text-xs text-gray-500">{entry.bmName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-900">{entry.options}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-900">{formatQty(entry.buyQty)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-900">{entry.mixPct}%</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-900">{entry.avgPrice.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-900">{entry.storeCount}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn(
                            'text-sm',
                            entry.ftfAdoptionPct < 50 ? 'text-amber-700 font-medium' : 'text-gray-900',
                          )}>
                            {entry.ftfAdoptionPct}%
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={entry.status} />
                        </td>
                        <td className="px-2 py-3">
                          <button
                            className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 flex items-center justify-center"
                            aria-label={`View audit trail for ${entry.fashionGrade}`}
                            onClick={(e) => openAudit(entry.fashionGradeCode, e)}
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>
                        </td>
                        <td className="px-2 py-3">
                          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Audit Trail Modal */}
      {showAuditModal && auditData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="px-4 md:px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Workflow History</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedGradeAudit === 'FB' ? 'Fashion Basics' :
                   selectedGradeAudit === 'COR' ? 'Core' :
                   selectedGradeAudit === 'FSH' ? 'Fashion' :
                   selectedGradeAudit === 'ULT' ? 'Ultimate' :
                   selectedGradeAudit} Grade Audit Trail
                </p>
              </div>
              <button
                onClick={closeAudit}
                className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700 min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 flex items-center justify-center"
                aria-label="Close audit trail"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-4 md:px-6 py-4 overflow-y-auto max-h-[60vh]">
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Workflow ID</p>
                    <p className="text-sm font-mono text-gray-900">{auditData.workflowId}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Status</p>
                    <Badge
                      variant={auditData.status === 'Approved' ? 'success' : auditData.status === 'Under Review' ? 'warning' : 'default'}
                      size="sm"
                    >
                      {auditData.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Created Date</p>
                    <p className="text-sm text-gray-900">{auditData.createdDate}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Last Modified</p>
                    <p className="text-sm text-gray-900">{auditData.lastModified}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Approved By</p>
                    <p className="text-sm text-gray-900">{auditData.approvedBy}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Approval Date</p>
                    <p className="text-sm text-gray-900">{auditData.approvalDate}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Change History</h3>
                <div className="space-y-3">
                  {auditData.changes.map((change, index) => (
                    <div key={index} className="bg-white border border-gray-200 rounded-lg p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">{change.field}</span>
                          <span className="text-xs text-gray-500">modified</span>
                        </div>
                        <span className="text-xs text-gray-500">{change.date}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="px-2 py-0.5 bg-red-50 text-red-700 rounded">{change.from}</span>
                        <span className="text-gray-400">&rarr;</span>
                        <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded">{change.to}</span>
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        By {change.user}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-4 md:px-6 py-3 border-t border-gray-200 flex justify-end">
              <button
                onClick={closeAudit}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 min-h-[44px] md:min-h-0"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
