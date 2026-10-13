import { useEffect } from 'react';
import { Download, CheckCircle, Loader2 } from 'lucide-react';
import { PageHeader, SectionHeader, MetricGrid, EmptyState, Pagination } from '@/components/ui';
import { cn, formatDateTime } from '@/lib/utils';
import { usePlanogramStore } from '../stores/usePlanogramStore';
import BrandSelector from '../components/BrandSelector';
import FileUploader from '../components/FileUploader';
import UploadStatusScreen from '../components/UploadStatusScreen';

function formatUploadDate(raw: string): string {
  try {
    return formatDateTime(new Date(raw));
  } catch {
    return raw;
  }
}

export default function PlanogramDashboardPage(): React.ReactNode {
  const selectedBrandId = usePlanogramStore((s) => s.selectedBrandId);
  const summary = usePlanogramStore((s) => s.summary);
  const summaryLoading = usePlanogramStore((s) => s.summaryLoading);
  const summaryError = usePlanogramStore((s) => s.summaryError);
  const uploadStatus = usePlanogramStore((s) => s.uploadStatus);
  const downloading = usePlanogramStore((s) => s.downloading);
  const activeTab = usePlanogramStore((s) => s.activeTab);
  const uploadHistory = usePlanogramStore((s) => s.uploadHistory);
  const historyLoading = usePlanogramStore((s) => s.historyLoading);
  const historyError = usePlanogramStore((s) => s.historyError);
  const downloadExcel = usePlanogramStore((s) => s.downloadExcel);
  const setActiveTab = usePlanogramStore((s) => s.setActiveTab);
  const loadUploadHistory = usePlanogramStore((s) => s.loadUploadHistory);
  const historyPage = usePlanogramStore((s) => s.historyPage);
  const historyPageSize = usePlanogramStore((s) => s.historyPageSize);
  const historyHasMore = usePlanogramStore((s) => s.historyHasMore);
  const setHistoryPage = usePlanogramStore((s) => s.setHistoryPage);
  const setHistoryPageSize = usePlanogramStore((s) => s.setHistoryPageSize);

  // Load history when switching to history tab
  useEffect(() => {
    if (activeTab === 'history') {
      loadUploadHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only run when tab changes
  }, [activeTab]);

  const isUploading = uploadStatus !== 'idle';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Brand Planogram Management"
      />

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={cn(
              'py-2 px-1 border-b-2 font-medium text-sm min-h-[44px] md:min-h-0',
              activeTab === 'upload'
                ? 'border-indigo-600 text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
            )}
          >
            Upload Planogram
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={cn(
              'py-2 px-1 border-b-2 font-medium text-sm min-h-[44px] md:min-h-0',
              activeTab === 'history'
                ? 'border-indigo-600 text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
            )}
          >
            Upload History
          </button>
        </nav>
      </div>

      {activeTab === 'upload' ? (
        <div className="space-y-6">
          {/* Brand Dropdown — always visible */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <SectionHeader
              title={<span className="text-lg">Brand Dropdown</span>}
              className="mb-4"
            />
            <BrandSelector />
          </div>

          {/* Upload Status Screen replaces everything below brand selector */}
          {isUploading ? (
            <UploadStatusScreen />
          ) : (
            <>
              {/* Current Planogram Summary */}
              {selectedBrandId && summaryLoading && (
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center justify-center gap-2 py-8">
                    <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                    <span className="text-sm text-gray-500">Loading summary...</span>
                  </div>
                </div>
              )}

              {selectedBrandId && summaryError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
                  {summaryError}
                </div>
              )}

              {selectedBrandId && summary && !summaryLoading && (
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <SectionHeader
                    title={<span className="text-lg">Current Planogram Summary</span>}
                    actions={
                      <button
                        type="button"
                        onClick={downloadExcel}
                        disabled={downloading}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 min-h-[44px] md:min-h-0"
                      >
                        {downloading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                        Download Current Planogram
                      </button>
                    }
                    className="mb-4"
                  />

                  <MetricGrid columns={4}>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-500">Total Sites</p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {summary.total_sites.toLocaleString()}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-500">Total Options</p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {summary.total_options.toLocaleString()}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-500">Total Quantity</p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {summary.total_quantity.toLocaleString()}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-500">Fashion Grade Mix</p>
                      <div className="mt-1 space-y-0.5">
                        {summary.fashion_grade_mix.map((item) => (
                          <div key={item.fashion_grade} className="text-xs font-medium text-gray-700">
                            {item.fashion_grade}: {item.percentage}%
                          </div>
                        ))}
                      </div>
                    </div>
                  </MetricGrid>
                </div>
              )}

              {/* Upload Modified Planogram */}
              {selectedBrandId && (
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Upload Modified Planogram
                  </h2>
                  <FileUploader />
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        /* Upload History Tab */
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-4 md:px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Uploads</h2>
          </div>

          {historyLoading && (
            <div className="flex items-center justify-center gap-2 py-12">
              <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
              <span className="text-sm text-gray-500">Loading history...</span>
            </div>
          )}

          {historyError && (
            <div className="p-4 text-sm text-red-700">{historyError}</div>
          )}

          {!historyLoading && !historyError && uploadHistory.length === 0 && (
            <EmptyState
              title="No uploads yet"
              description="Upload a planogram to see history here."
            />
          )}

          {!historyLoading && !historyError && uploadHistory.length > 0 && (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-[700px] w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Upload ID
                      </th>
                      <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Brand
                      </th>
                      <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Uploaded At
                      </th>
                      <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Uploaded By
                      </th>
                      <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sites Affected
                      </th>
                      <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Changes
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {uploadHistory.map((entry) => (
                      <tr key={entry.upload_id} className="hover:bg-gray-50">
                        <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {entry.upload_id}
                        </td>
                        <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {entry.brand_id_desc}
                        </td>
                        <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatUploadDate(entry.uploaded_at)}
                        </td>
                        <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {entry.uploaded_by}
                        </td>
                        <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                          <span
                            className={cn(
                              'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                              entry.status === 'success'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800',
                            )}
                          >
                            {entry.status === 'success' && <CheckCircle className="w-3 h-3 mr-1" />}
                            {entry.status}
                          </span>
                        </td>
                        <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {parseInt(entry.sites_affected, 10).toLocaleString()}
                        </td>
                        <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {entry.changes}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Pagination
                currentPage={historyPage}
                totalPages={historyHasMore ? historyPage + 1 : historyPage}
                onPageChange={setHistoryPage}
                pageSize={historyPageSize}
                onPageSizeChange={setHistoryPageSize}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}
