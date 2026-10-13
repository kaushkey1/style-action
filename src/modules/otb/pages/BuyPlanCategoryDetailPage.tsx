/* eslint-disable design-system/prefer-section-header, design-system/prefer-metric-grid -- category detail uses custom KPI + table layouts */
import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, History, X } from 'lucide-react';
import { KpiCard } from '../../range/components/KpiCard';
import { EmptyState, ShimmerKpiGrid, ShimmerTable } from '@/components/ui';
import {cn, getCurrencySymbol} from '@/lib/utils';
import { mockCategoryDetails, mockCategoryHistoryEntries } from '../data/mockCategoryView';

import type { FashionGradeRow, CategoryHistoryEntry } from '../data/mockCategoryView';

export default function BuyPlanCategoryDetailPage(): React.ReactNode {
  const { id: categoryCode } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [selectedGradeAudit, setSelectedGradeAudit] = useState<string>('');

  const detail = useMemo(
    () => (categoryCode ? mockCategoryDetails[categoryCode] ?? null : null),
    [categoryCode],
  );
  const fashionGrades = useMemo(() => detail?.fashion_grades ?? [], [detail]);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, [categoryCode]);

  const totals = useMemo(
    () =>
      fashionGrades.reduce(
        (acc, g) => ({
          options: acc.options + g.options,
          quantity: acc.quantity + g.buy_qty,
          otbAllocated: acc.otbAllocated + g.otb_allocated,
          otbUsed: acc.otbUsed + g.otb_used,
          revenue: acc.revenue + g.revenue,
          stores: Math.max(acc.stores, g.stores),
        }),
        { options: 0, quantity: 0, otbAllocated: 0, otbUsed: 0, revenue: 0, stores: 0 },
      ),
    [fashionGrades],
  );

  const otbUsagePercentage = totals.otbAllocated > 0 ? Math.round((totals.otbUsed / totals.otbAllocated) * 100) : 0;
  const planCount = fashionGrades.length;
  const completedCount = fashionGrades.filter((g) => g.status === 'Completed').length;
  const planCompletionPercentage = planCount > 0 ? Math.round((completedCount / planCount) * 100) : 0;
  const pendingApprovals = fashionGrades.filter((g) => g.status === 'Buy Plan Approval').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 h-[92px]" />
        <div className="px-6 py-6 space-y-6">
          <ShimmerKpiGrid />
          <ShimmerTable rows={4} />
        </div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <EmptyState
          title="Category not found"
          description="The category you're looking for doesn't exist."
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="h-[52px] px-6 flex items-center justify-between">
          <button
            onClick={() => navigate('/buy-plans')}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Go back to Category Overview</span>
          </button>
          <div className="text-sm font-semibold text-primary-700 bg-indigo-50 border border-indigo-200 rounded-lg px-3.5 py-1.5">
            {detail.hit}
          </div>
        </div>
        <div className="h-[40px] px-6 flex items-center">
          <div className="flex gap-6 items-center">
            <button className="px-1 py-3 border-b-2 text-sm font-medium transition-colors border-indigo-700 text-primary-700">
              Fashion Grades
            </button>
            <span className="text-sm text-gray-500">— {detail.category_name}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard
            label="OTB Utilization"
            value={otbUsagePercentage.toString()}
            unit="%"
            status={otbUsagePercentage >= 80 ? 'Optimal' : otbUsagePercentage >= 70 ? 'Monitor' : 'At Risk'}
            target={`${getCurrencySymbol()}${(totals.otbUsed / 10000000).toFixed(1)} Cr / ${getCurrencySymbol()}${(totals.otbAllocated / 10000000).toFixed(1)} Cr`}
            progressValue={otbUsagePercentage}
          />
          <KpiCard
            label="Plan Progress"
            value={planCompletionPercentage.toString()}
            unit="%"
            status={planCompletionPercentage >= 80 ? 'On Track' : planCompletionPercentage >= 60 ? 'Monitor' : 'At Risk'}
            target={`${completedCount} / ${planCount} plans`}
            progressValue={planCompletionPercentage}
          />
          <KpiCard
            label="Total Options"
            value={totals.options.toLocaleString()}
            unit=""
            status="Healthy"
            target={`${pendingApprovals} pending approvals`}
          />
          <KpiCard
            label="Expected Revenue"
            value={`${getCurrencySymbol()}${(totals.revenue / 10000000).toFixed(1)}`}
            unit="Cr"
            status="On Track"
            target={`${(totals.quantity / 1000).toFixed(0)} K units`}
          />
        </div>

        {/* Fashion Grades Table */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Fashion Grades</h3>
            <p className="text-xs text-gray-400 mt-0.5">Performance by fashion grade within {detail.category_name}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-500 font-medium">
                  <th className="text-left px-4 py-2.5">BUY PLAN ID</th>
                  <th className="text-left px-4 py-2.5">FASHION GRADE</th>
                  <th className="text-right px-4 py-2.5">OPTIONS</th>
                  <th className="text-right px-4 py-2.5">BUY QTY</th>
                  <th className="text-right px-4 py-2.5">OTB USAGE</th>
                  <th className="text-right px-4 py-2.5">AVG ASP</th>
                  <th className="text-right px-4 py-2.5">REVENUE</th>
                  <th className="text-right px-4 py-2.5">MARGIN %</th>
                  <th className="text-center px-4 py-2.5">STORES</th>
                  <th className="text-left px-4 py-2.5">STATUS</th>
                  <th className="w-[40px]"></th>
                  <th className="w-[28px]"></th>
                </tr>
              </thead>
              <tbody>
                {fashionGrades.map((grade) => (
                  <FashionGradeTableRow
                    key={grade.id}
                    grade={grade}
                    onAudit={(gradeId) => {
                      setSelectedGradeAudit(gradeId);
                      setShowAuditModal(true);
                    }}
                    onNavigate={(runId) => navigate(`/buy-plans/brand/${runId}`)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Audit Trail Modal */}
      {showAuditModal && selectedGradeAudit && (
        <AuditTrailModal
          gradeId={selectedGradeAudit}
          categoryName={detail.category_name}
          entries={mockCategoryHistoryEntries}
          onClose={() => {
            setShowAuditModal(false);
            setSelectedGradeAudit('');
          }}
        />
      )}
    </div>
  );
}

// ── Fashion Grade Table Row ────────────────────────────────────────

function FashionGradeTableRow({
  grade,
  onAudit,
  onNavigate,
}: {
  grade: FashionGradeRow;
  onAudit: (gradeId: string) => void;
  onNavigate: (runId: string) => void;
}): React.ReactNode {
  return (
    <tr
      className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
      onClick={(e) => {
        if (!(e.target as HTMLElement).closest('.audit-btn')) {
          onNavigate(grade.run_id);
        }
      }}
    >
      <td className="px-4 py-3">
        <span className="text-sm font-medium text-primary">{grade.buy_plan_id}</span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-start gap-2">
          <span
            className={cn(
              'inline-flex items-center justify-center w-8 h-8 rounded-lg text-[10px] font-bold',
              grade.fashion_grade_code === 'COR' ? 'bg-blue-100 text-blue-700' :
              grade.fashion_grade_code === 'FAS' ? 'bg-purple-100 text-purple-700' :
              grade.fashion_grade_code === 'ULT' ? 'bg-amber-100 text-amber-700' :
              'bg-gray-100 text-gray-700',
            )}
          >
            {grade.fashion_grade_code}
          </span>
          <span className="text-sm font-medium text-gray-900">{grade.fashion_grade}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-right">
        <span className="text-sm text-gray-900">{grade.options.toLocaleString()}</span>
      </td>
      <td className="px-4 py-3 text-right">
        <span className="text-sm text-gray-900">
          {grade.buy_qty >= 1000000
            ? `${(grade.buy_qty / 1000000).toFixed(1)}M`
            : `${(grade.buy_qty / 1000).toFixed(0)} K`}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex flex-col items-end">
          <span className="text-sm font-medium text-gray-900">{grade.otb_usage_percentage}%</span>
          <span className="text-xs text-gray-500">{getCurrencySymbol()}{(grade.otb_used / 10000000).toFixed(2)} Cr</span>
        </div>
      </td>
      <td className="px-4 py-3 text-right">
        <span className="text-sm text-gray-900">{getCurrencySymbol()}{grade.avg_asp.toLocaleString()}</span>
      </td>
      <td className="px-4 py-3 text-right">
        <span className="text-sm font-medium text-gray-900">{getCurrencySymbol()}{(grade.revenue / 10000000).toFixed(2)} Cr</span>
      </td>
      <td className="px-4 py-3 text-right">
        <span className="text-sm text-gray-900">{grade.margin_percentage}%</span>
      </td>
      <td className="px-4 py-3 text-center">
        <span className="text-sm text-gray-900">{grade.stores}</span>
      </td>
      <td className="px-4 py-3">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium',
            grade.status === 'Buy Plan Review' ? 'bg-indigo-50 text-primary-700' :
            grade.status === 'Costing' ? 'bg-amber-50 text-amber-700' :
            grade.status === 'Completed' ? 'bg-gray-100 text-gray-600' :
            'bg-green-50 text-green-700',
          )}
        >
          <span
            className={cn(
              'w-1.5 h-1.5 rounded-full',
              grade.status === 'Buy Plan Review' ? 'bg-indigo-500' :
              grade.status === 'Costing' ? 'bg-amber-500' :
              grade.status === 'Completed' ? 'bg-gray-400' :
              'bg-green-500',
            )}
          />
          {grade.status}
        </span>
      </td>
      <td className="px-2 py-3">
        <button
          className="audit-btn p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
          onClick={(e) => {
            e.stopPropagation();
            onAudit(grade.id);
          }}
          aria-label={`View history for ${grade.fashion_grade}`}
        >
          <History className="w-3.5 h-3.5" />
        </button>
      </td>
      <td className="px-4 py-3">
        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
      </td>
    </tr>
  );
}

// ── Audit Trail Modal ──────────────────────────────────────────────

function AuditTrailModal({
  gradeId,
  categoryName,
  entries,
  onClose,
}: {
  gradeId: string;
  categoryName: string;
  entries: CategoryHistoryEntry[];
  onClose: () => void;
}): React.ReactNode {
  const gradeName = gradeId === 'FASHION_BASICS'
    ? 'Fashion Basics'
    : gradeId.charAt(0) + gradeId.slice(1).toLowerCase();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-3xl w-full mx-4 max-h-[80vh] overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Buy Plan History</h2>
            <p className="text-sm text-gray-500 mt-1">{gradeName} Grade - {categoryName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700"
            aria-label="Close history"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-4 overflow-y-auto max-h-[60vh]">
          {entries.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No history available</p>
          ) : (
            <div className="space-y-3">
              {entries.map((entry) => (
                <div key={entry.id} className="bg-white border border-gray-200 rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{entry.field}</span>
                      <span className="text-xs text-gray-500">modified</span>
                    </div>
                    <span className="text-xs text-gray-500">{entry.date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="px-2 py-0.5 bg-red-50 text-red-700 rounded">{entry.from}</span>
                    <span className="text-gray-400">&rarr;</span>
                    <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded">{entry.to}</span>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">By {entry.user}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="px-6 py-3 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
