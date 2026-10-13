/**
 * Companion App → Business Health. Three sections behind a sub-nav:
 * Business Overview · Store Performance · AI insights.
 *
 * Business Overview, Store Performance and the store drill-down are live from
 * the `companion` backend (/v1.0/companion/*). CX (rating distribution,
 * difficulty split, data-quality) is folded into the Business Overview
 * response. The AI briefing uses the live summary API; AI insights is not enabled.
 */
import { useEffect, useState } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import { EmptyState, Input, Pagination, Spinner } from '@/components/ui';
import { cn } from '@/lib/utils';
import { useDateRange } from '../shared/dateRange';
import { CompanionBriefing } from '../shared/CompanionBriefing';
import {
  useBusinessOverview,
  useSalesDetail,
  useStorePerformance,
  useStoreLocations,
  useStoreDirectory,
  useStoreDetail,
} from '../api/companionHooks';
import type {
  BusinessOverviewResponse,
  CompanionRange,
  SalesDetailResponse,
  StoreDetailResponse,
  StoreDirRow,
  StorePerformanceResponse,
} from '../api/companionApi';
import {
  AttentionCard,
  BarList,
  ChartPanel,
  Donut,
  KpiGrid,
  MiniTable,
  Panel,
  ScatterCompare,
  StatusRibbon,
  StoreMap,
  TrendChart,
  VBarChart,
} from './bhKit';

const dateValCols = (valueLabel: string) => [
  { key: 'date' as const, label: 'Date' },
  { key: 'value' as const, label: valueLabel, align: 'right' as const },
];

function seriesRows(
  data: { date: string; value: number }[],
  valueFmt: (v: number) => string = (v) => v.toLocaleString('en-IN'),
): { date: string; value: string }[] {
  return data.map((d) => ({ date: d.date, value: valueFmt(d.value) }));
}

/**
 * Adaptive rupee formatter — picks Cr / L / K / plain per value size, so a
 * store's ₹20.66 L and a network total's ₹12.59 Cr both read naturally.
 * Input is raw rupees. Matches the backend `fmt_inr` exactly.
 */
const formatINR = (amount: number): string => {
  const abs = Math.abs(amount);
  if (abs >= 1e7) return `₹${(amount / 1e7).toFixed(2)} Cr`;
  if (abs >= 1e5) return `₹${(amount / 1e5).toFixed(2)} L`;
  if (abs >= 1e3) return `₹${(amount / 1e3).toFixed(1)} K`;
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
};

// Plain rupees for per-order / average amounts (AOV, single-order e-GMV) that
// never reach Lakh/Cr territory — the adaptive scale would be noise there.
const rupeeFmt = (v: number) => `₹${v.toLocaleString('en-IN')}`;

type Section = 'overview' | 'stores' | 'insights';
const SECTIONS: { key: Section; label: string; disabled?: boolean }[] = [
  { key: 'overview', label: 'Business Overview' },
  { key: 'stores', label: 'Store Performance' },
  { key: 'insights', label: 'AI insights', disabled: true },
];

/** Turn the shared DateRangeContext value into the API range param. */
function useCompanionRange(): CompanionRange {
  const range = useDateRange();
  return range ? { from: range.from, to: range.to } : {};
}

/** Debounce a fast-changing value (e.g. a search box) before querying. */
function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

/* A pair of panels side by side on desktop. */
function Row({ children }: { children: React.ReactNode }): React.ReactNode {
  return <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">{children}</div>;
}

function GroupHeading({ children }: { children: React.ReactNode }): React.ReactNode {
  return <h2 className="text-sm font-semibold text-gray-900">{children}</h2>;
}

/** Loading / error / empty gate for a live section. */
function AsyncSection<T>({
  query,
  isEmpty,
  children,
}: {
  query: { data: T | undefined; isLoading: boolean; isError: boolean };
  isEmpty?: (data: T) => boolean;
  children: (data: T) => React.ReactNode;
}): React.ReactNode {
  if (query.isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner />
      </div>
    );
  }
  if (query.isError || !query.data) {
    return (
      <EmptyState
        title="Couldn’t load this data"
        description="The Companion data service didn’t respond. Try again shortly."
      />
    );
  }
  if (isEmpty?.(query.data)) {
    return (
      <EmptyState
        title="No activity in this period"
        description="No Companion orders or scans were recorded for the selected date range."
      />
    );
  }
  return <>{children(query.data)}</>;
}

/* ── Business Overview ───────────────────────────────────────────────── */

function BusinessOverview(): React.ReactNode {
  const range = useCompanionRange();
  const query = useBusinessOverview(range);
  const [showMore, setShowMore] = useState(false);

  return (
    <AsyncSection
      query={query}
      isEmpty={(d) => d.overviewKpis.length === 0}
    >
      {(d: BusinessOverviewResponse) => (
        <div className="space-y-6">
          <CompanionBriefing view="business" />

          <section className="space-y-3">
            <GroupHeading>Business overview</GroupHeading>
            <KpiGrid items={d.overviewKpis} />
            {d.growthUnavailableNote && (
              <p className="text-xs text-gray-400">{d.growthUnavailableNote}</p>
            )}
          </section>

          <section className="space-y-3">
            <GroupHeading>Trends</GroupHeading>
            <Row>
              <ChartPanel
                title="Daily e-GMV"
                table={<MiniTable columns={dateValCols('e-GMV')} rows={seriesRows(d.overviewTrends.egmv, formatINR)} />}
              >
                <TrendChart data={d.overviewTrends.egmv} series={[{ key: 'value', label: 'e-GMV' }]} valueFormatter={formatINR} />
              </ChartPanel>
              <ChartPanel
                title="Daily completed orders"
                table={<MiniTable columns={dateValCols('Orders')} rows={seriesRows(d.overviewTrends.orders)} />}
              >
                <TrendChart data={d.overviewTrends.orders} series={[{ key: 'value', label: 'Orders' }]} />
              </ChartPanel>
            </Row>
            <Row>
              <Panel title="Purchasing customers over time">
                <TrendChart data={d.overviewTrends.customers} series={[{ key: 'value', label: 'Customers' }]} />
              </Panel>
              <Panel title="Average order value over time">
                <TrendChart data={d.overviewTrends.aov} series={[{ key: 'value', label: 'AOV' }]} valueFormatter={rupeeFmt} />
              </Panel>
            </Row>
            <Row>
              <Panel title="Ordering stores over time">
                <TrendChart data={d.overviewTrends.orderingStores} series={[{ key: 'value', label: 'Ordering stores' }]} height={200} />
              </Panel>
              <Panel title="Fulfilment-rate trend">
                <TrendChart data={d.overviewTrends.fulfilment} series={[{ key: 'value', label: 'Fulfilment %' }]} valueFormatter={(v) => `${v}%`} height={200} />
              </Panel>
            </Row>
            <Panel title="Payment-failure trend">
              <TrendChart data={d.overviewTrends.paymentFailure} series={[{ key: 'value', label: 'Failure %' }]} valueFormatter={(v) => `${v}%`} height={200} />
            </Panel>
          </section>

          <section className="space-y-3">
            <GroupHeading>Summaries</GroupHeading>
            <Panel title="Order-status ribbon">
              <StatusRibbon segments={d.orderLifecycle} />
            </Panel>
            <Row>
              <ChartPanel
                title="Top stores by e-GMV"
                table={<MiniTable columns={[{ key: 'label', label: 'Store' }, { key: 'value', label: 'e-GMV', align: 'right' }]} rows={d.topStoresByEgmv.map((s) => ({ label: s.label, value: formatINR(s.value) }))} />}
              >
                <BarList data={d.topStoresByEgmv} valueFormatter={formatINR} />
              </ChartPanel>
              <ChartPanel
                title="Revenue by state"
                table={<MiniTable columns={[{ key: 'label', label: 'State' }, { key: 'value', label: 'e-GMV', align: 'right' }]} rows={d.revenueByState.map((s) => ({ label: s.label, value: formatINR(s.value) }))} />}
              >
                <BarList data={d.revenueByState} valueFormatter={formatINR} pageSize={8} />
              </ChartPanel>
            </Row>
            <Row>
              <ChartPanel
                title="Customer rating distribution"
                table={<MiniTable columns={[{ key: 'label', label: 'Rating' }, { key: 'value', label: 'Responses', align: 'right' }]} rows={d.ratingDistribution.map((s) => ({ label: s.label, value: s.value.toLocaleString('en-IN') }))} />}
              >
                <VBarChart data={d.ratingDistribution} xKey="label" />
              </ChartPanel>
              <Panel title="Purchase-difficulty split">
                <Donut data={d.purchaseDifficultySplit} />
              </Panel>
            </Row>
            {!d.cxDataQuality.trustworthy && (
              <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                {d.cxDataQuality.note ?? 'CX snapshot may be incomplete for this period.'}
              </p>
            )}
          </section>

          <section className="space-y-3">
            <GroupHeading>Business attention</GroupHeading>
            {/* eslint-disable-next-line design-system/prefer-metric-grid -- attention cards, not the KPI strip */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {d.attentionCards.map((c) => (
                <AttentionCard key={c.key} title={c.title} value={c.value} note={c.note} status={c.status} />
              ))}
            </div>
            <p className="text-xs text-gray-400">Use agreed targets before labelling these as healthy or unhealthy.</p>
          </section>

          {/* Full sales-performance detail, collapsed by default. */}
          <div className="flex justify-center border-t border-gray-200 pt-4">
            <button
              type="button"
              onClick={() => setShowMore((v) => !v)}
              aria-expanded={showMore}
              className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-4 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
            >
              {showMore ? 'Show less' : 'Show more'}
              <ChevronDown className={cn('h-4 w-4 transition-transform', showMore && 'rotate-180')} aria-hidden />
            </button>
          </div>

          {showMore && <SalesDetail range={range} />}
        </div>
      )}
    </AsyncSection>
  );
}

/* ── Sales detail (only what Business Overview doesn't already show) ──── */

function SalesDetail({ range }: { range: CompanionRange }): React.ReactNode {
  const query = useSalesDetail(range);
  const [showTable, setShowTable] = useState(false);

  return (
    <AsyncSection query={query} isEmpty={(d) => d.salesTable.length === 0}>
      {(d: SalesDetailResponse) => {
        const upo = d.salesKpis.find((k) => k.key === 'upo');
        return (
          <div className="space-y-6">
            <section className="space-y-3">
              <GroupHeading>Sales detail</GroupHeading>
              {upo && (
                <p className="text-xs text-gray-500">
                  Units per order <span className="font-semibold text-gray-900">{upo.value}</span>
                  {upo.trend ? <span className="ml-1 text-green-600">{upo.trend}</span> : null}
                </p>
              )}
              <Row>
                <Panel title="Order-value distribution">
                  <VBarChart data={d.orderValueHistogram} xKey="label" />
                </Panel>
                <Panel title="Payment-mode share">
                  <Donut data={d.paymentModeShare} />
                </Panel>
              </Row>
            </section>

            <section className="space-y-3">
              <GroupHeading>Monthly &amp; trend detail</GroupHeading>
              <Row>
                <Panel title="Monthly completed orders"><VBarChart data={d.salesTrends.monthlyOrders} xKey="month" /></Panel>
                <Panel title="Monthly e-GMV"><VBarChart data={d.salesTrends.monthlyEgmv} xKey="month" valueFormatter={formatINR} /></Panel>
              </Row>
            </section>

            <section className="space-y-3">
              <GroupHeading>Store &amp; geography ranking</GroupHeading>
              <Row>
                <ChartPanel
                  title="Stores by e-GMV"
                  table={<MiniTable columns={[{ key: 'label', label: 'Store' }, { key: 'value', label: 'e-GMV', align: 'right' }]} rows={d.storesByEgmv.map((s) => ({ label: s.label, value: formatINR(s.value) }))} />}
                >
                  <BarList data={d.storesByEgmv} valueFormatter={formatINR} pageSize={6} />
                </ChartPanel>
                <ChartPanel
                  title="Stores by completed-order count"
                  table={<MiniTable columns={[{ key: 'label', label: 'Store' }, { key: 'value', label: 'Orders', align: 'right' }]} rows={d.storesByOrderCount.map((s) => ({ label: s.label, value: s.value.toLocaleString('en-IN') }))} />}
                >
                  <BarList data={d.storesByOrderCount} pageSize={6} />
                </ChartPanel>
              </Row>
            </section>

            <section className="space-y-3">
              <GroupHeading>Brand breakdown</GroupHeading>
              <Row>
                <Panel title="Top brands by e-GMV">
                  <BarList data={d.topBrandsByEgmv} valueFormatter={formatINR} />
                </Panel>
                <Panel title="Brand units sold">
                  <MiniTable
                    columns={[
                      { key: 'brand', label: 'Brand' },
                      { key: 'units', label: 'Units', align: 'right' },
                      { key: 'egmv', label: 'e-GMV', align: 'right' },
                    ]}
                    rows={d.brandUnitsSold.map((b) => ({ brand: b.brand, units: b.units.toLocaleString('en-IN'), egmv: b.egmv }))}
                  />
                </Panel>
              </Row>
            </section>

            <section className="space-y-3">
              <GroupHeading>Payment &amp; geography detail</GroupHeading>
              <Row>
                <Panel title="Payment-mode order count">
                  <MiniTable
                    columns={[
                      { key: 'mode', label: 'Payment mode' },
                      { key: 'orders', label: 'Orders', align: 'right' },
                    ]}
                    rows={d.paymentModeShare.map((p) => ({ mode: p.label, orders: p.value.toLocaleString('en-IN') }))}
                  />
                </Panel>
                <Panel title="Revenue by delivery state"><BarList data={d.revenueByState} valueFormatter={formatINR} /></Panel>
                <Panel title="Orders by state">
                  <MiniTable
                    columns={[
                      { key: 'state', label: 'State' },
                      { key: 'orders', label: 'Orders', align: 'right' },
                      { key: 'egmv', label: 'e-GMV', align: 'right' },
                    ]}
                    rows={d.ordersByState.map((r) => ({ state: r.state, orders: r.orders.toLocaleString('en-IN'), egmv: r.egmv }))}
                  />
                </Panel>
              </Row>
            </section>

            <Panel
              title="Detailed sales"
              actions={
                <button
                  type="button"
                  onClick={() => setShowTable((v) => !v)}
                  className="rounded-md border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
                >
                  {showTable ? 'Hide table' : 'View table'}
                </button>
              }
            >
              {showTable ? (
                <MiniTable
                  columns={[
                    { key: 'date', label: 'Order date' },
                    { key: 'orderId', label: 'Order ID' },
                    { key: 'store', label: 'Store' },
                    { key: 'state', label: 'State' },
                    { key: 'customer', label: 'Customer' },
                    { key: 'units', label: 'Units', align: 'right' },
                    { key: 'egmv', label: 'e-GMV', align: 'right' },
                    { key: 'payment', label: 'Payment mode' },
                    { key: 'status', label: 'Status' },
                  ]}
                  rows={d.salesTable.map((r) => ({ ...r, units: String(r.units) }))}
                />
              ) : (
                <p className="text-xs text-gray-400">Order-level detail — {d.salesTable.length}+ rows. Open with “View table”.</p>
              )}
            </Panel>
          </div>
        );
      }}
    </AsyncSection>
  );
}

/* ── Store Performance ───────────────────────────────────────────────── */

function StoreDetailPanel({ s }: { s: StoreDetailResponse }): React.ReactNode {
  return (
    <Panel title={`${s.name}`} subtitle={`${s.city}, ${s.state} · Store ${s.code}`}>
      <KpiGrid
        items={[
          { key: 'o', label: 'Completed orders', value: s.orders.toLocaleString('en-IN') },
          { key: 'g', label: 'e-GMV', value: s.egmv },
          { key: 'a', label: 'Scan attempts', value: s.scanAttempts.toLocaleString('en-IN') },
          { key: 'ss', label: 'Successful scans', value: s.scanSuccess.toLocaleString('en-IN') },
          { key: 'sr', label: 'Scan success', value: s.scanSuccessRate },
          { key: 'lo', label: 'Last order date', value: s.lastOrder },
        ]}
      />
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-medium text-gray-500">Daily orders &amp; e-GMV</p>
          <TrendChart
            data={s.dailyOrders.map((day, i) => ({ date: day.date, orders: day.value, egmv: s.dailyEgmv[i]?.value ?? 0 }))}
            series={[
              { key: 'orders', label: 'Orders' },
              { key: 'egmv', label: 'e-GMV (₹ L)' },
            ]}
            height={200}
          />
        </div>
        <div>
          <p className="mb-2 text-xs font-medium text-gray-500">Daily scans</p>
          <TrendChart data={s.dailyScans} series={[{ key: 'value', label: 'Scans' }]} height={200} />
        </div>
        <div>
          <p className="mb-2 text-xs font-medium text-gray-500">Top brands</p>
          <BarList data={s.topBrands} valueFormatter={formatINR} />
        </div>
        <div>
          <p className="mb-2 text-xs font-medium text-gray-500">Payment-mode split</p>
          <Donut data={s.paymentSplit} height={180} />
        </div>
      </div>
      <div className="mt-4">
        <p className="mb-2 text-xs font-medium text-gray-500">Store details &amp; map position</p>
        <StoreMap
          stores={
            s.lat != null && s.lng != null
              ? [{ name: s.name, city: s.city, activity: 'Store location', lat: s.lat, lng: s.lng }]
              : []
          }
          label={`${s.name} — ${s.city}`}
        />
      </div>
    </Panel>
  );
}

const DIRECTORY_COLUMNS = [
  { key: 'name' as const, label: 'Store' },
  { key: 'id' as const, label: 'Store ID' },
  { key: 'code' as const, label: 'Code' },
  { key: 'city' as const, label: 'City' },
  { key: 'state' as const, label: 'State' },
  { key: 'activity' as const, label: 'Companion activity' },
  { key: 'orders' as const, label: 'Orders', align: 'right' as const },
  { key: 'egmv' as const, label: 'e-GMV', align: 'right' as const },
  { key: 'scans' as const, label: 'Scan lookups', align: 'right' as const },
  { key: 'scanSuccess' as const, label: 'Scan success', align: 'right' as const },
  { key: 'lastOrder' as const, label: 'Last order' },
  { key: 'daysSince' as const, label: 'Days since', align: 'right' as const },
];

/** Selected-store detail: fetched live by numeric Orbis UID. */
function SelectedStore({ row, range }: { row: StoreDirRow; range: CompanionRange }): React.ReactNode {
  const query = useStoreDetail(row.uid === null ? null : String(row.uid), range);
  return (
    <AsyncSection query={query}>
      {(s: StoreDetailResponse) => <StoreDetailPanel s={s} />}
    </AsyncSection>
  );
}

const DIRECTORY_PAGE_SIZES = [20, 50, 100];
const DIRECTORY_DEFAULT_PAGE_SIZE = 20;

/**
 * Store directory — search (store code / name) and pagination are handled
 * server-side (`/companion/store-directory`), so only the current page's rows
 * travel to the client. Search is debounced; page state resets on new search
 * or page-size change. The previous page stays visible while the next loads.
 */
function StoreDirectory({
  range,
  selected,
  onSelect,
}: {
  range: CompanionRange;
  selected: StoreDirRow | null;
  onSelect: (row: StoreDirRow | null) => void;
}): React.ReactNode {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DIRECTORY_DEFAULT_PAGE_SIZE);
  const debouncedSearch = useDebouncedValue(search, 300);

  const query = useStoreDirectory(range, { page, pageSize, search: debouncedSearch });

  const rows = query.data?.rows ?? [];
  const total = query.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const displayRows = rows.map((r) => ({
    ...r,
    orders: r.orders.toLocaleString('en-IN'),
    scans: r.scans.toLocaleString('en-IN'),
    daysSince: String(r.daysSince),
  }));

  const searchInput = (
    <Input
      type="search"
      value={search}
      onChange={(e) => {
        setSearch(e.target.value);
        setPage(1);
      }}
      placeholder="Search store code or name"
      aria-label="Search store directory by code or name"
      leftIcon={<Search className="h-4 w-4" aria-hidden />}
      containerClassName="w-full sm:w-64"
      className="!py-1.5 text-xs"
    />
  );

  return (
    <Panel
      title="Store directory"
      subtitle={selected ? undefined : 'Select a store to filter this section to it'}
      actions={searchInput}
    >
      {query.isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner />
        </div>
      ) : query.isError ? (
        <EmptyState title="Couldn’t load stores" description="Try again shortly." />
      ) : total === 0 ? (
        <EmptyState
          title="No stores match"
          description={debouncedSearch ? 'Try a different store code or name.' : 'No stores in this period.'}
        />
      ) : (
        <>
          <MiniTable
            columns={DIRECTORY_COLUMNS}
            rows={displayRows}
            onRowClick={(_, i) => onSelect(rows[i] ?? null)}
            isRowActive={(_, i) => selected?.code === rows[i]?.code}
          />
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={total}
            pageSize={pageSize}
            pageSizeOptions={DIRECTORY_PAGE_SIZES}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
            className="-mx-4 -mb-4 mt-2"
          />
        </>
      )}
    </Panel>
  );
}

function StorePerformance(): React.ReactNode {
  const range = useCompanionRange();
  const query = useStorePerformance(range);
  const [selected, setSelected] = useState<StoreDirRow | null>(null);
  // Network map pins — fetched lazily, only while the network view is shown.
  const locations = useStoreLocations(range, !selected);

  return (
    <AsyncSection query={query} isEmpty={(d) => d.storeKpis.length === 0}>
      {(d: StorePerformanceResponse) => {
        // Remount (reset search/page) when the date range changes, so we never
        // request a page past the end of a smaller result set.
        const directory = (
          <StoreDirectory
            key={`${range.from ?? ''}|${range.to ?? ''}`}
            range={range}
            selected={selected}
            onSelect={setSelected}
          />
        );

        if (selected) {
          return (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-gray-500">Store filter</span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary bg-primary-50 px-3 py-1 text-xs font-medium text-primary">
                  {selected.name}
                  <button
                    type="button"
                    onClick={() => setSelected(null)}
                    aria-label={`Clear ${selected.name} filter`}
                    className="-mr-1 rounded-full p-0.5 hover:bg-primary/10"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </span>
              </div>

              <SelectedStore row={selected} range={range} />
              {directory}
            </div>
          );
        }

        return (
          <div className="space-y-6">
            <section className="space-y-3">
              <GroupHeading>Store performance</GroupHeading>
              <KpiGrid items={d.storeKpis} />
            </section>

            <section className="space-y-3">
              <GroupHeading>Visuals</GroupHeading>
              <Row>
                <Panel title="Store locations">
                  <StoreMap
                    stores={locations.data?.stores ?? []}
                    loading={locations.isLoading}
                    error={locations.isError}
                  />
                </Panel>
                <Panel title="Store activity mix">
                  <Donut data={d.storeActivityMix} />
                </Panel>
              </Row>
              <Row>
                <Panel title="Store activity over time">
                  <TrendChart data={d.storeActivityTrends.activeStores} series={[{ key: 'value', label: 'Active stores' }]} />
                </Panel>
                <Panel title="Daily ordering-store trend">
                  <TrendChart data={d.storeActivityTrends.orderingStores} series={[{ key: 'value', label: 'Ordering stores' }]} />
                </Panel>
              </Row>
              <Row>
                <Panel title="Daily scan-active-store trend">
                  <TrendChart data={d.storeActivityTrends.scanActiveStores} series={[{ key: 'value', label: 'Scan-active stores' }]} />
                </Panel>
                <Panel title="Scan activity over time">
                  <TrendChart data={d.storeActivityTrends.scans} series={[{ key: 'value', label: 'Scans' }]} />
                </Panel>
              </Row>
              <Panel title="Order-recency distribution">
                <VBarChart data={d.orderRecency} xKey="label" />
              </Panel>
              <Row>
                <Panel title="Top stores by e-GMV">
                  <BarList data={d.topStoresByEgmv} valueFormatter={formatINR} pageSize={5} />
                </Panel>
                <Panel title="Top stores by orders">
                  <BarList data={d.topStoresByOrders} pageSize={5} />
                </Panel>
              </Row>
              <Panel title="Top stores by scans">
                <BarList data={d.topStoresByScans} pageSize={5} />
              </Panel>
              <Panel title="Scan activity vs orders">
                <ScatterCompare data={d.scansVsOrders} />
              </Panel>
            </section>

            {directory}
          </div>
        );
      }}
    </AsyncSection>
  );
}

/* ── Shell ───────────────────────────────────────────────────────────── */

export function BusinessHealthDashboard(): React.ReactNode {
  const [section, setSection] = useState<Section>('overview');

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {SECTIONS.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={s.disabled ? undefined : () => setSection(s.key)}
            disabled={s.disabled}
            aria-pressed={section === s.key}
            title={s.disabled ? 'Coming soon' : undefined}
            className={cn(
              'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
              s.disabled
                ? 'cursor-not-allowed border-gray-200 bg-white text-gray-400'
                : section === s.key
                  ? 'border-primary bg-primary-50 text-primary'
                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50',
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {section === 'overview' && <BusinessOverview />}
      {section === 'stores' && <StorePerformance />}
    </div>
  );
}

export default BusinessHealthDashboard;
