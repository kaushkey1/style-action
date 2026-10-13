import { useState } from 'react';
import { FileSpreadsheet, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { MetricGrid } from '@/components/ui';
import { usePlanogramStore } from '../stores/usePlanogramStore';
import type { UploadValidationErrorItem, ErrorSummaryItem } from '../types/planogram.types';

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function downloadErrorReport(errors: UploadValidationErrorItem[]): void {
  const headers = 'Row,Site,Brand ID,Field,Value,Message';
  const rows = errors.map(e =>
    [e.row, e.site ?? '', e.brand_id ?? '', e.field, e.value ?? '', `"${e.message}"`].join(','),
  );
  const csv = [headers, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'planogram_upload_errors.csv';
  a.click();
  URL.revokeObjectURL(url);
}

// ── Uploading State ──────────────────────────────────────────────────

function UploadingView(): React.ReactNode {
  const { uploadResult, cancelUpload } = usePlanogramStore();
  if (!uploadResult) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg py-12 text-center">
      <FileSpreadsheet className="w-12 h-12 text-primary mx-auto" />
      <p className="mt-3 text-sm font-medium text-gray-900">
        {uploadResult.file.name}
      </p>
      <p className="text-xs text-gray-500">
        {formatFileSize(uploadResult.file.size)}
      </p>

      <p className="mt-4 text-base font-medium text-gray-900">
        Uploading planogram...
      </p>

      {/* Indeterminate progress bar */}
      <div className="mt-4 mx-auto w-64 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full w-1/3 bg-indigo-500 rounded-full animate-pulse" />
      </div>

      <p className="mt-4 text-sm text-gray-500">
        Validating and processing your file.
        <br />
        This may take a few seconds.
      </p>

      <button
        type="button"
        onClick={cancelUpload}
        className="mt-4 text-sm text-gray-500 hover:text-gray-700 min-h-[44px] md:min-h-0"
      >
        Cancel
      </button>
    </div>
  );
}

// ── Success State ────────────────────────────────────────────────────

function SuccessView(): React.ReactNode {
  const { resetUpload, setActiveTab } = usePlanogramStore();

  return (
    <div className="bg-white border border-gray-200 rounded-lg py-12 text-center">
      <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
      <p className="mt-3 text-lg font-semibold text-green-900">
        Planogram Updated Successfully
      </p>

      <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
        <button
          type="button"
          onClick={resetUpload}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 min-h-[44px] md:min-h-0"
        >
          Upload Another File
        </button>
        <button
          type="button"
          onClick={() => {
            resetUpload();
            setActiveTab('history');
          }}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 min-h-[44px] md:min-h-0"
        >
          View Upload History
        </button>
      </div>
    </div>
  );
}

// ── Validation Error State ───────────────────────────────────────────

const MAX_VISIBLE_ERRORS = 10;

function ErrorSummarySection({ summary }: { summary: ErrorSummaryItem[] }): React.ReactNode {
  return (
    <div className="mt-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Error Summary</h3>
      <div className="overflow-x-auto -mx-3 px-3">
        <table className="min-w-[400px] w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 pr-4 text-gray-500 font-medium">Issue</th>
              <th className="text-right py-2 pr-4 text-gray-500 font-medium">Count</th>
              <th className="text-left py-2 text-gray-500 font-medium">Rows</th>
            </tr>
          </thead>
          <tbody>
            {summary.map((item) => (
              <tr key={item.field} className="border-b border-gray-100">
                <td className="py-2 pr-4 text-gray-900">{item.label}</td>
                <td className="py-2 pr-4 text-right text-red-600 font-medium">{item.count}</td>
                <td className="py-2 text-gray-500">
                  {item.rows.length <= 5
                    ? item.rows.join(', ')
                    : `${item.rows.slice(0, 5).join(', ')}... (+${item.rows.length - 5} more)`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ValidationErrorView(): React.ReactNode {
  const { uploadResult, resetUpload } = usePlanogramStore();
  const validationData = uploadResult?.validationErrors;
  const errors = validationData?.errors ?? [];
  const errorSummary = validationData?.error_summary ?? [];
  const totalRows = uploadResult?.totalRows ?? 0;
  const apiMessage = validationData?.message ?? uploadResult?.errorMessage;
  const [showAll, setShowAll] = useState(false);

  const visibleErrors = showAll ? errors : errors.slice(0, MAX_VISIBLE_ERRORS);

  return (
    <div className="bg-white border border-gray-200 rounded-lg py-8 px-4 md:px-8">
      <div className="text-center">
        <XCircle className="w-12 h-12 text-red-500 mx-auto" />
        <p className="mt-3 text-lg font-semibold text-red-900">
          Upload Failed — Validation Errors
        </p>
        {apiMessage && (
          <p className="mt-1 text-sm text-red-700">{apiMessage}</p>
        )}
        <p className="mt-1 text-sm text-red-600">
          No rows were saved. Fix the errors below and re-upload.
        </p>
      </div>

      <div className="mt-6">
        <MetricGrid columns={3}>
          <div className="p-4 bg-gray-50 rounded-lg text-center">
            <p className="text-sm text-gray-500">Total Rows</p>
            <p className="text-2xl font-semibold text-gray-900">{totalRows.toLocaleString()}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg text-center">
            <p className="text-sm text-gray-500">Errors Found</p>
            <p className="text-2xl font-semibold text-red-600">{errors.length.toLocaleString()}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg text-center">
            <p className="text-sm text-gray-500">Rows Saved</p>
            <p className="text-2xl font-semibold text-gray-900">0</p>
          </div>
        </MetricGrid>
      </div>

      {/* Error summary table */}
      {errorSummary.length > 0 && <ErrorSummarySection summary={errorSummary} />}

      {/* Detailed error list */}
      <div className="mt-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Errors</h3>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2 max-h-80 overflow-y-auto">
          {visibleErrors.map((error, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              <p className="text-sm text-red-700">
                <span className="font-medium">Row {error.row}</span>
                {error.site && <span className="text-red-500"> (Site: {error.site})</span>}
                {': '}
                {error.message}
              </p>
            </div>
          ))}
        </div>
        {errors.length > MAX_VISIBLE_ERRORS && !showAll && (
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="mt-2 text-sm text-primary hover:underline"
          >
            Show all {errors.length} errors
          </button>
        )}
      </div>

      <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
        <button
          type="button"
          onClick={() => downloadErrorReport(errors)}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 min-h-[44px] md:min-h-0"
        >
          Download Error Report
        </button>
        <button
          type="button"
          onClick={resetUpload}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 min-h-[44px] md:min-h-0"
        >
          Re-upload
        </button>
      </div>
    </div>
  );
}

// ── Server Error State ───────────────────────────────────────────────

function ServerErrorView(): React.ReactNode {
  const { uploadResult, resetUpload } = usePlanogramStore();

  const message =
    uploadResult?.errorMessage ?? 'Network error. Please check your connection and try again.';

  return (
    <div className="bg-white border border-gray-200 rounded-lg py-12 text-center">
      <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
      <p className="mt-3 text-lg font-semibold text-gray-900">Upload Failed</p>
      <p className="mt-2 text-sm text-gray-600 max-w-md mx-auto">{message}</p>
      <button
        type="button"
        onClick={resetUpload}
        className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 min-h-[44px] md:min-h-0"
      >
        Try Again
      </button>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────

export default function UploadStatusScreen(): React.ReactNode {
  const uploadStatus = usePlanogramStore((s) => s.uploadStatus);

  switch (uploadStatus) {
    case 'uploading':
      return <UploadingView />;
    case 'success':
      return <SuccessView />;
    case 'validation_error':
      return <ValidationErrorView />;
    case 'server_error':
      return <ServerErrorView />;
    default:
      return null;
  }
}
