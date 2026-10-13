/**
 * Companion App — opened from the "IP Health Dashboard" menu on the Jarvis
 * front page. Two views toggled at the top (Business Health / Product Health),
 * plus a shared date-range filter carried via DateRangeContext. Business Health
 * and Product Health use the `companion` backend; date ranges drive their
 * activity queries while catalogue and deployment inventory are current snapshots.
 */
import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { FilterDateRange, PageHeader } from '@/components/ui';
import { cn } from '@/lib/utils';
import { BusinessHealthDashboard } from '../business-health/BusinessHealthDashboard';
import { ProductHealthDashboard } from '../product-health/ProductHealthDashboard';
import { DateRangeContext, fmtRangeLabel } from '../shared/dateRange';

type CompanionView = 'business' | 'product';

const VIEWS: { key: CompanionView; label: string }[] = [
  { key: 'business', label: 'Business Health' },
  { key: 'product', label: 'Product Health' },
];

// Live Companion data starts 2026-02-10 (earliest order) and runs to today.
const DATA_START = '2026-02-10';
const DATA_END = new Date().toISOString().slice(0, 10);

export function CompanionAppPage(): React.ReactNode {
  const { pathname } = useLocation();
  const backTo = pathname.startsWith('/jarvis') ? '/jarvis/store-view' : '/command/store-view';
  const [view, setView] = useState<CompanionView>('business');
  // Empty = All time (no windowing).
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const range = from && to ? { from, to } : null;

  return (
    <div className="animate-fadeInUp space-y-4">
      <PageHeader title="Companion App" backTo={backTo} />

      {/* Left-aligned selectors. */}
      <div className="flex gap-6 border-b border-gray-200">
        {VIEWS.map((v) => (
          <button
            key={v.key}
            type="button"
            onClick={() => setView(v.key)}
            aria-pressed={view === v.key}
            className={cn(
              '-mb-px border-b-2 pb-2.5 pt-1 text-sm font-medium transition-colors',
              view === v.key
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-600 hover:text-gray-900',
            )}
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* Shared date filter */}
      {/* eslint-disable-next-line design-system/prefer-section-header -- filter row, not a section header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-gray-500">
          Showing <span className="font-medium text-gray-700">{range ? fmtRangeLabel(range) : 'All time'}</span>
        </p>
        <div className="flex items-center gap-2">
          {range && (
            <button
              type="button"
              onClick={() => {
                setFrom('');
                setTo('');
              }}
              className="text-xs font-medium text-primary hover:underline"
            >
              All time
            </button>
          )}
          <FilterDateRange
            fromValue={from}
            toValue={to}
            onFromChange={setFrom}
            onToChange={setTo}
            hidePresets
            minDate={DATA_START}
            maxDate={DATA_END}
            disabledFutureTooltip="Companion data is available through today"
            disabledPastTooltip={`Companion data starts ${DATA_START}`}
          />
        </div>
      </div>

      <DateRangeContext.Provider value={range}>
        {view === 'business' ? <BusinessHealthDashboard /> : <ProductHealthDashboard />}
      </DateRangeContext.Provider>
    </div>
  );
}

export default CompanionAppPage;
