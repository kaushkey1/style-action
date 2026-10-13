/* eslint-disable design-system/prefer-section-header, design-system/prefer-metric-grid -- range architecture uses custom layouts */
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Package, History, X } from 'lucide-react';
import { KpiCard } from '../components/KpiCard';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState, ShimmerKpiGrid, ShimmerTable, Badge } from '@/components/ui';
import { cn } from '@/lib/utils';
import { useRangeStore } from '../stores/useRangeStore';
import { useHits, useSegmentSummary, useBuyingModels, useSegments } from '../api/rangeHooks';

// Helper function to get full category name from segment code
const getCategoryNameFromSegmentCode = (segmentCode: string): string => {
  const mapping: Record<string, string> = {
    'seg-mw-formal-shirts': 'Men Western: Formal Shirts',
    'seg-mw-casual-shirts': 'Men Western: Casual Shirts',
    'seg-mw-denim': 'Men Western: Denim Bottoms',
    'seg-mw-casual-tshirts': 'Men Western: Casual T-shirts',
    'seg-mw-non-denim': 'Men Western: Non-Denim Bottoms',
    'seg-mw-formal-trouser': 'Men Western: Formal Trouser & Suits',
    'seg-mi-festive': 'Men Indian: Festive Wear',
    'seg-mw-sports': 'Men: Sports / Athleisure',
    'seg-ww-western-tops': 'Women: Western Tops',
    'seg-ww-dresses': 'Women: Western Dress, Jackets and Blazers',
    'seg-ww-denim': 'Women Western: Denim Bottoms',
    'seg-ww-non-denim': 'Women Western: Non-Denim Bottoms',
    'seg-ww-kurta': 'Women Indian: Kurta/SKD/Bottoms',
    'seg-ww-saree': 'Women Indian: Saree/Lehenga',
    'seg-wif-festive': 'Women Indian/Fusion: Festive SKD',
    'seg-ww-sports': 'Women: Sports / Athleisure',
    'seg-kw-infant': 'Kids: Infant',
    'seg-kw-boys': 'Kids: Boys',
    'seg-kw-girls': 'Kids: Girls'
  };
  return mapping[segmentCode] || segmentCode;
};

export default function RASegmentOverviewPage() {
  const { segmentId } = useParams();
  const navigate = useNavigate();
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [selectedGradeAudit, setSelectedGradeAudit] = useState<string>('');

  const selectedHit = useRangeStore((s) => s.selectedHit);
  const selectHit = useRangeStore((s) => s.selectHit);

  const { data: availableHits } = useHits();
  const { data: segmentsData } = useSegments(selectedHit ?? '');
  const segments = segmentsData?.segments ?? [];
  const { data: segmentSummary, isLoading: segmentSummaryLoading } = useSegmentSummary(segmentId ?? '', selectedHit ?? '');
  const { data: buyingModels } = useBuyingModels(segmentId ?? '', selectedHit ?? '');

  // Get current segment name
  const currentSegment = segments.find(s => s.segment_code === segmentId);
  const categoryName = segmentId ? getCategoryNameFromSegmentCode(segmentId) : '';

  useEffect(() => {
    if (availableHits?.default_hit && !selectedHit) {
      selectHit(availableHits.default_hit);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- set default hit when data arrives
  }, [availableHits]);

  // Show loading if hits haven't resolved yet OR data is actively loading
  if (!selectedHit || segmentSummaryLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 h-[132px]" />
        <div className="px-6 py-6 space-y-6">
          <ShimmerKpiGrid />
          <ShimmerTable rows={6} />
        </div>
      </div>
    );
  }

  if (!segmentSummary) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <EmptyState
          icon={Package}
          title="Segment not found"
          description="Unable to load segment data. Please select a valid segment."
        />
      </div>
    );
  }

  const renderOverviewTab = () => (
    <>
      {/* Zone 1: KPIs */}
      <div className="grid grid-cols-4 gap-3">
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

      {/* Zone 2: Fashion Grades Table */}
      <div className="bg-white rounded-lg border border-gray-200 mt-6">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Fashion Grades</h3>
          <p className="text-xs text-gray-400 mt-0.5">Performance by fashion grade within {categoryName || currentSegment?.segment_name || segmentSummary?.segment_name || 'category'}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-500 font-medium">
                <th className="text-left px-4 py-2.5 font-medium">RANGE ARCH ID</th>
                <th className="text-left px-4 py-2.5 font-medium">FASHION GRADE</th>
                <th className="text-left px-4 py-2.5 font-medium">OPTIONS</th>
                <th className="text-left px-4 py-2.5 font-medium">BUY QTY</th>
                <th className="text-left px-4 py-2.5 font-medium">MIX %</th>
                <th className="text-left px-4 py-2.5 font-medium">AVG PRICE</th>
                <th className="text-left px-4 py-2.5 font-medium">STORES</th>
                <th className="text-left px-4 py-2.5 font-medium">FTF ADOPTION</th>
                <th className="text-left px-4 py-2.5 font-medium">STATUS</th>
                <th className="w-[40px]"></th>
                <th className="w-[28px]"></th>
              </tr>
            </thead>
            <tbody>
              {/* Core Fashion Grade */}
              <tr
                className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={(e) => {
                  if (!(e.target as HTMLElement).closest('.audit-btn')) {
                    navigate(`/ra/segment/${segmentId}/family/CORE/brick/BR001`);
                  }
                }}
              >
                <td className="px-4 py-3">
                  <span className="text-sm font-medium text-primary">RA-{segmentId}-{selectedHit || 'H1'}-CORE</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-start gap-2">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-[10px] font-bold bg-blue-100 text-blue-700">
                      COR
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-gray-900">Core</span>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-gray-900">245</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-gray-900">180 K</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-gray-900">35%</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-gray-900">₹1,299</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-gray-900">420</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-gray-900">85%</span>
                </td>
                <td className="px-4 py-3">
                  <Badge variant="default" size="sm">
                    Ongoing
                  </Badge>
                </td>
                <td className="px-2 py-3">
                  <button
                    className="audit-btn p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedGradeAudit('CORE');
                      setShowAuditModal(true);
                    }}
                  >
                    <History className="w-3.5 h-3.5" />
                  </button>
                </td>
                <td className="px-4 py-3">
                  <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                </td>
              </tr>

              {/* Fashion Grade */}
              <tr
                className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={(e) => {
                  if (!(e.target as HTMLElement).closest('.audit-btn')) {
                    navigate(`/ra/segment/${segmentId}/family/FASHION/brick/BR002`);
                  }
                }}
              >
                <td className="px-4 py-3">
                  <span className="text-sm font-medium text-primary">RA-{segmentId}-{selectedHit || 'H1'}-FASHION</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-start gap-2">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-[10px] font-bold bg-purple-100 text-purple-700">
                      FSH
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-gray-900">Fashion</span>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-gray-900">312</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-gray-900">220 K</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-gray-900">40%</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-gray-900">₹1,599</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-gray-900">385</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-gray-900">72%</span>
                </td>
                <td className="px-4 py-3">
                  <Badge variant="default" size="sm">
                    Ongoing
                  </Badge>
                </td>
                <td className="px-2 py-3">
                  <button
                    className="audit-btn p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedGradeAudit('FASHION');
                      setShowAuditModal(true);
                    }}
                  >
                    <History className="w-3.5 h-3.5" />
                  </button>
                </td>
                <td className="px-4 py-3">
                  <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                </td>
              </tr>

              {/* Ultimate Grade */}
              <tr
                className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={(e) => {
                  if (!(e.target as HTMLElement).closest('.audit-btn')) {
                    navigate(`/ra/segment/${segmentId}/family/ULTIMATE/brick/BR003`);
                  }
                }}
              >
                <td className="px-4 py-3">
                  <span className="text-sm font-medium text-primary">RA-{segmentId}-{selectedHit || 'H1'}-ULTIMATE</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-start gap-2">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-[10px] font-bold bg-amber-100 text-amber-700">
                      ULT
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-gray-900">Ultimate</span>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-gray-900">89</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-gray-900">45 K</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-gray-900">15%</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-gray-900">₹2,999</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-gray-900">180</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-amber-600 font-medium">42%</span>
                </td>
                <td className="px-4 py-3">
                  <Badge variant="warning" size="sm">
                    New
                  </Badge>
                </td>
                <td className="px-2 py-3">
                  <button
                    className="audit-btn p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedGradeAudit('ULTIMATE');
                      setShowAuditModal(true);
                    }}
                  >
                    <History className="w-3.5 h-3.5" />
                  </button>
                </td>
                <td className="px-4 py-3">
                  <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                </td>
              </tr>

              {/* Fashion Basics Grade */}
              <tr
                className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={(e) => {
                  if (!(e.target as HTMLElement).closest('.audit-btn')) {
                    navigate(`/ra/segment/${segmentId}/family/FASHION_BASICS/brick/BR004`);
                  }
                }}
              >
                <td className="px-4 py-3">
                  <span className="text-sm font-medium text-primary">RA-{segmentId}-{selectedHit || 'H1'}-BASICS</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-start gap-2">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-[10px] font-bold bg-gray-100 text-gray-700">
                      FB
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-gray-900">Fashion Basics</span>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-gray-900">156</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-gray-900">95 K</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-gray-900">10%</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-gray-900">₹899</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-gray-900">420</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-gray-900">90%</span>
                </td>
                <td className="px-4 py-3">
                  <Badge variant="default" size="sm">
                    Ongoing
                  </Badge>
                </td>
                <td className="px-2 py-3">
                  <button
                    className="audit-btn p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedGradeAudit('FASHION_BASICS');
                      setShowAuditModal(true);
                    }}
                  >
                    <History className="w-3.5 h-3.5" />
                  </button>
                </td>
                <td className="px-4 py-3">
                  <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Zone 3: BM Composition */}
      {buyingModels && buyingModels.buying_models.length > 0 && (
        <div className="mt-6">
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">Buying Model Composition</h3>
              <p className="text-xs text-gray-400 mt-0.5">Allocation strategy across different buying models</p>
            </div>
            <div className="p-4">
              <table className="w-full">
                <thead>
                  <tr className="text-[10px] text-gray-400 uppercase tracking-wider border-b border-gray-100">
                    <th className="text-left pb-2 font-medium">BUYING MODEL</th>
                    <th className="text-left pb-2 font-medium">SHARE %</th>
                    <th className="text-left pb-2 font-medium">OPT TARGET</th>
                    <th className="text-left pb-2 font-medium">OPTS BUILT</th>
                    <th className="text-left pb-2 font-medium">STATUS</th>
                    <th className="text-right pb-2 font-medium">PROGRESS</th>
                  </tr>
                </thead>
                <tbody>
                  {buyingModels.buying_models.map((bm) => {
                    const progressPct = bm.option_target > 0
                      ? Math.round(((bm.options_built ?? 0) / bm.option_target) * 100)
                      : 0;

                    return (
                      <tr key={bm.bm_code} className="border-b border-gray-50">
                        <td className="py-2.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-primary-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                              {bm.bm_code}
                            </span>
                            <span className="text-xs text-gray-700">{bm.short_name}</span>
                          </div>
                        </td>
                        <td className="py-2.5 text-xs text-gray-900 font-medium">{bm.share_pct}%</td>
                        <td className="py-2.5 text-xs text-gray-900">{bm.option_target}</td>
                        <td className="py-2.5 text-xs text-gray-900">{bm.options_built ?? 0}</td>
                        <td className="py-2.5">
                          <StatusBadge status={bm.status} />
                        </td>
                        <td className="py-2.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  "h-full rounded-full",
                                  progressPct >= 90 ? "bg-green-500" :
                                  progressPct >= 50 ? "bg-amber-500" : "bg-red-500"
                                )}
                                // eslint-disable-next-line no-restricted-syntax -- Dynamic progress bar width
                                style={{ width: `${Math.min(100, progressPct)}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-gray-500 w-8 text-right">
                              {progressPct}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );

  // Mock audit trail data
  const getAuditTrailData = (grade: string) => {
    const auditData = {
      CORE: {
        workflowId: 'RAF085000455502AWSS2026H5',
        createdDate: '2024-03-15 09:30 AM',
        lastModified: '2024-03-18 02:45 PM',
        status: 'Approved',
        approvedBy: 'Rajesh Kumar',
        approvalDate: '2024-03-18 03:00 PM',
        changes: [
          { field: 'Buy Options', from: '240', to: '245', user: 'Priya Sharma', date: '2024-03-16 10:00 AM' },
          { field: 'Buy Quantity', from: '175 K', to: '180 K', user: 'Amit Patel', date: '2024-03-17 11:30 AM' },
          { field: 'Price Points', from: '₹1,199-₹1,399', to: '₹1,299', user: 'Priya Sharma', date: '2024-03-17 02:00 PM' }
        ]
      },
      FASHION: {
        workflowId: 'RAF085000455503AWSS2026H5',
        createdDate: '2024-03-14 10:00 AM',
        lastModified: '2024-03-19 11:30 AM',
        status: 'Approved',
        approvedBy: 'Sunita Mehta',
        approvalDate: '2024-03-19 12:00 PM',
        changes: [
          { field: 'Hierarchy Updates', from: 'Seasonal Styles', to: 'Fashion Forward', user: 'Vikram Singh', date: '2024-03-15 09:00 AM' },
          { field: 'Buy Options', from: '300', to: '312', user: 'Neha Gupta', date: '2024-03-16 03:00 PM' },
          { field: 'Store Coverage', from: '350', to: '385', user: 'Vikram Singh', date: '2024-03-18 10:00 AM' }
        ]
      },
      ULTIMATE: {
        workflowId: 'RAF085000455504AWSS2026H5',
        createdDate: '2024-03-13 02:00 PM',
        lastModified: '2024-03-17 04:00 PM',
        status: 'Under Review',
        approvedBy: '-',
        approvalDate: '-',
        changes: [
          { field: 'Buy Quantity', from: '50 K', to: '45 K', user: 'Arjun Reddy', date: '2024-03-14 11:00 AM' },
          { field: 'Price Range', from: '₹2,499-₹3,499', to: '₹2,999', user: 'Kavita Rao', date: '2024-03-15 02:30 PM' },
          { field: 'FTF Adoption Target', from: '60%', to: '42%', user: 'Arjun Reddy', date: '2024-03-17 03:30 PM' }
        ]
      },
      FASHION_BASICS: {
        workflowId: 'RAF085000455505AWSS2026H5',
        createdDate: '2024-03-12 11:00 AM',
        lastModified: '2024-03-16 09:00 AM',
        status: 'Approved',
        approvedBy: 'Deepak Joshi',
        approvalDate: '2024-03-16 10:00 AM',
        changes: [
          { field: 'Buy Options', from: '150', to: '156', user: 'Ritu Verma', date: '2024-03-13 10:00 AM' },
          { field: 'Mix %', from: '8%', to: '10%', user: 'Sanjay Kapoor', date: '2024-03-14 02:00 PM' },
          { field: 'Store Coverage', from: 'All Stores', to: '420 Stores', user: 'Ritu Verma', date: '2024-03-15 11:00 AM' }
        ]
      }
    };
    return auditData[grade as keyof typeof auditData] || auditData.CORE;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        {/* Row 1: Title and Segment Selector */}
        <div className="h-[52px] px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/range')}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Go back to Network Overview</span>
            </button>
          </div>
          {selectedHit && (
            <div className="text-sm font-semibold text-primary-700 bg-indigo-50 border border-indigo-200 rounded-lg px-3.5 py-1.5">
              {selectedHit}
            </div>
          )}
        </div>

        {/* Category-level Tab */}
        <div className="h-[40px] px-6 flex items-center">
          <div className="flex gap-6 items-center">
            <button
              className="px-1 py-3 border-b-2 text-sm font-medium transition-colors border-indigo-700 text-primary-700"
            >
              Category Overview ({segmentId})
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6">
        {renderOverviewTab()}
      </div>

      {/* Audit Trail Modal */}
      {showAuditModal && selectedGradeAudit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full mx-4 max-h-[80vh] overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Workflow History</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedGradeAudit === 'FASHION_BASICS' ? 'Fashion Basics' :
                   selectedGradeAudit.charAt(0) + selectedGradeAudit.slice(1).toLowerCase()} Grade Audit Trail
                </p>
              </div>
              <button
                onClick={() => {
                  setShowAuditModal(false);
                  setSelectedGradeAudit('');
                }}
                className="p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="px-6 py-4 overflow-y-auto max-h-[60vh]">
              {(() => {
                const auditData = getAuditTrailData(selectedGradeAudit);
                return (
                  <>
                    {/* Workflow Info */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Workflow ID</p>
                          <p className="text-sm font-mono text-gray-900">{auditData.workflowId}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Status</p>
                          <Badge
                            variant={auditData.status === 'Approved' ? 'success' :
                                   auditData.status === 'Under Review' ? 'warning' :
                                   'default'}
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

                    {/* Change History */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">Change History</h3>
                      <div className="space-y-3">
                        {auditData.changes.map((change: { field: string; from: string; to: string; user: string; date: string }, index: number) => (
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
                              <span className="text-gray-400">→</span>
                              <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded">{change.to}</span>
                            </div>
                            <div className="mt-2 text-xs text-gray-500">
                              By {change.user}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => {
                  setShowAuditModal(false);
                  setSelectedGradeAudit('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
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
