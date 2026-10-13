/**
 * Companion App → Product Health. Four sections behind a sub-nav:
 * Product Overview · Journey & Funnel · Discovery & Catalogue · Customer Experience.
 * Session & Path Diagnostics lives inside Journey & Funnel (not its own nav).
 * Live GA4, catalogue snapshots and insight_box feedback from Companion APIs.
 */
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button, EmptyState, Pagination, Spinner } from '@/components/ui';
import { useDateRange } from '../shared/dateRange';
import { useProductOverview, useJourneyFunnel, useDiscoveryCatalogue, useProductCx } from '../api/companionHooks';
import { CompanionBriefing } from '../shared/CompanionBriefing';
import {
  AttentionCard,
  BarList,
  ChartPanel,
  Donut,
  KpiGrid,
  MiniTable,
  Panel,
  TrendChart,
  VBarChart,
} from '../business-health/bhKit';
import { Funnel, Gauge, ProgressRows, StackedBar } from './phKit';


const pct = (v: number) => `${v}%`;

const dateCols = (label: string) => [
  { key: 'date' as const, label: 'Date' },
  { key: 'value' as const, label, align: 'right' as const },
];
function trendRows(data: { date: string; value: number }[], fmt: (v: number) => string = (v) => v.toLocaleString('en-IN')) {
  return data.map((d) => ({ date: d.date, value: fmt(d.value) }));
}

type Section = 'overview' | 'journey' | 'catalogue' | 'cx' | 'insights';
const SECTIONS: { key: Section; label: string; disabled?: boolean }[] = [
  { key: 'overview', label: 'Product Overview' },
  { key: 'journey', label: 'Journey & Funnel' },
  { key: 'catalogue', label: 'Discovery & Catalogue' },
  { key: 'cx', label: 'Customer Experience' },
  { key: 'insights', label: 'AI insights', disabled: true },
];

function Row({ children }: { children: React.ReactNode }): React.ReactNode {
  return <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">{children}</div>;
}
function Group({ title, children }: { title: string; children: React.ReactNode }): React.ReactNode {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
      {children}
    </section>
  );
}


function ProductStatus({ loading, retry }: { loading: boolean; retry: () => void }): React.ReactNode {
  if (loading) return <div className="flex justify-center py-12" role="status" aria-label="Loading Product Health"><Spinner /></div>;
  return <EmptyState title="Couldn’t load Product Health" description="The Companion data service didn’t respond. Try again shortly." action={<Button variant="outline" onClick={retry}>Retry</Button>} />;
}

function DataNotes({ notes, hasData }: { notes: string[]; hasData: boolean }): React.ReactNode {
  return <div className="space-y-2">
    {!hasData && <EmptyState title="No activity in this date range" description="Choose another date range to see activity." />}
    {notes.map((note) => <p key={note} className="text-xs text-gray-500">{note}</p>)}
  </div>;
}

/* ── Product Overview ────────────────────────────────────────────────── */

function ProductOverview(): React.ReactNode {
  const range = useDateRange();
  const query = useProductOverview(range ? { from: range.from, to: range.to } : {});

  const p = query.data;
  if (query.isError || !p) return <ProductStatus loading={query.isLoading} retry={() => { void query.refetch(); }} />;

  return (
    <div className="space-y-6">
      <DataNotes notes={p.notes} hasData={p.hasData} />
      {!p.cxDataQuality.trustworthy && <p role="alert" className="rounded-md border border-amber-200 px-3 py-2 text-xs text-amber-700">{p.cxDataQuality.note}</p>}
      <CompanionBriefing view="product" />

      <Group title="Product overview — GA4 Companion activity">
        <KpiGrid items={p.overviewKpis} />
      </Group>

      <Group title="Trends">
        <Row>
          <Panel title="Daily active users"><TrendChart data={p.overviewTrends.activeUsers} series={[{ key: 'value', label: 'Active users' }]} /></Panel>
          <ChartPanel
            title="Daily engaged sessions"
            table={<MiniTable columns={dateCols('Engaged sessions')} rows={trendRows(p.overviewTrends.engagedSessions)} />}
          >
            <TrendChart data={p.overviewTrends.engagedSessions} series={[{ key: 'value', label: 'Engaged sessions' }]} />
          </ChartPanel>
        </Row>
        <Row>
          <Panel title="Daily journey volume (funnel starts)"><TrendChart data={p.overviewTrends.funnelStarts} series={[{ key: 'value', label: 'Funnel starts' }]} /></Panel>
          <Panel title="Payment-success sessions"><TrendChart data={p.overviewTrends.paymentSuccess} series={[{ key: 'value', label: 'Payment success' }]} /></Panel>
        </Row>
        <Row>
          <Panel title="Checkout-conversion trend"><TrendChart data={p.overviewTrends.checkoutConv} series={[{ key: 'value', label: 'Conversion %' }]} valueFormatter={pct} /></Panel>
          <Panel title="Scan-success trend"><TrendChart data={p.overviewTrends.scanSuccess} series={[{ key: 'value', label: 'Scan success %' }]} valueFormatter={pct} /></Panel>
        </Row>
        <Panel title="Average-rating trend">
          <TrendChart data={p.overviewTrends.avgRating} series={[{ key: 'value', label: 'Avg rating' }]} valueFormatter={(v) => v.toFixed(2)} height={200} />
        </Panel>
      </Group>

      <Group title="Product summaries">
        <Panel title="Overall Companion journey"><Funnel stages={p.companyJourneyFunnel} /></Panel>
        <Row>
          <Panel title="Converted vs non-converted sessions"><Donut data={p.convertedSplit} /></Panel>
          <Panel title="Largest funnel drop-offs"><BarList data={p.largestDropOffs} /></Panel>
        </Row>
        <Row>
          <Panel title="Scanner outcomes"><VBarChart data={p.scannerOutcomes} xKey="label" /></Panel>
          <Panel title="Experience rating distribution"><VBarChart data={p.experienceRatingDist} xKey="label" /></Panel>
        </Row>
      </Group>

      <Group title="Product attention">
        {/* eslint-disable-next-line design-system/prefer-metric-grid -- attention cards, not the KPI strip */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {p.overviewAttention.map((c) => (
            <AttentionCard key={c.key} title={c.title} value={c.value} note={c.note} status={c.status} />
          ))}
        </div>
      </Group>
    </div>
  );
}

/* ── Journey & Funnel ────────────────────────────────────────────────── */

function JourneyFunnel(): React.ReactNode {
  const range = useDateRange();
  const query = useJourneyFunnel(range ? { from: range.from, to: range.to } : {});

  const [mode, setMode] = useState<'sessions' | 'users'>('sessions');

  const p = query.data;
  if (query.isError || !p) return <ProductStatus loading={query.isLoading} retry={() => { void query.refetch(); }} />;

  return (
    <div className="space-y-6">
      <DataNotes notes={p.notes} hasData={p.hasData} />
      <Group title="Journey & funnel">
        <KpiGrid items={p.journeyKpis} />
      </Group>

      <Panel
        title="Companion funnel"
        actions={
          <div className="inline-flex rounded-md border border-gray-300 p-0.5 text-xs">
            {(['sessions', 'users'] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setMode(k)}
                className={cn('rounded px-2 py-0.5 font-medium capitalize', mode === k ? 'bg-primary-50 text-primary' : 'text-gray-500')}
              >
                {k}
              </button>
            ))}
          </div>
        }
      >
        <Funnel stages={mode === 'sessions' ? p.funnelSessions : p.funnelUsers} />
      </Panel>

      <Group title="Scanner analysis">
        <Row>
          <Panel title="Scanner stage reach"><VBarChart data={p.scannerStages} xKey="label" /></Panel>
          <Panel title="Scanner outcome signals — not found / API error"><BarList data={p.scannerOutcomeBars} /></Panel>
        </Row>
        <Row>
          <Panel title="Scanner journey by city"><BarList data={p.scannerByCity} /></Panel>
          <Panel title="Scanner drop-off" subtitle="Scanner opened → product found">
            <div className="flex h-full flex-col justify-center gap-1 py-6">
              <p className="text-3xl font-semibold tabular-nums text-gray-900">{p.scannerDropOff.count.toLocaleString('en-IN')}</p>
              <p className="text-sm text-amber-600">{p.scannerDropOff.pct === null ? '—' : `${p.scannerDropOff.pct.toFixed(1)}%`} of scanner-opened sessions dropped before a product was found</p>
            </div>
          </Panel>
        </Row>
        <Panel title="Scan lookup success" subtitle="Successful lookups ÷ scan attempts">
          <TrendChart data={p.scanSuccessTrend} series={[{ key: 'value', label: 'Scan success %' }]} valueFormatter={pct} height={200} />
        </Panel>
        <Panel title="Daily scanner outcome trend">
          <StackedBar
            data={p.scanOutcomeStacked}
            xKey="date"
            series={[{ key: 'found', label: 'Found' }, { key: 'notFound', label: 'Not found' }, { key: 'apiError', label: 'API error' }, { key: 'other', label: 'Other / unspecified' }]}
            height={200}
          />
        </Panel>
        <Panel title="Supporting session / user / event tables">
          <MiniTable
            columns={[
              { key: 'stage', label: 'Stage' },
              { key: 'users', label: 'Users', align: 'right' },
              { key: 'sessions', label: 'Sessions', align: 'right' },
              { key: 'events', label: 'Events', align: 'right' },
            ]}
            rows={p.scannerStageTable.map((r) => ({
              stage: r.stage,
              users: r.users.toLocaleString('en-IN'),
              sessions: r.sessions.toLocaleString('en-IN'),
              events: r.events.toLocaleString('en-IN'),
            }))}
          />
        </Panel>
      </Group>

      <Group title="Cart & checkout analysis">
        <Panel title="Cart-to-payment funnel"><Funnel stages={p.cartCheckoutFunnel} /></Panel>
        <Row>
          <Panel title="Checkout outcome"><Donut data={p.checkoutOutcome} /></Panel>
          <Panel title="Cart drop-offs"><BarList data={p.cartDropOffs} /></Panel>
        </Row>
        <Panel title="Daily checkout conversion">
          <TrendChart data={p.dailyConversionTrend} series={[{ key: 'value', label: 'Conversion %' }]} valueFormatter={pct} height={200} />
        </Panel>
      </Group>

      <Group title="Coupon analysis">
        <Row>
          <Panel title="Coupon stage reach"><BarList data={p.couponStageReach} /></Panel>
          <Panel title="Coupon outcome"><BarList data={p.couponOutcome} /></Panel>
        </Row>
        <Panel title="Coupon detail">
          <MiniTable
            columns={[
              { key: 'metric', label: 'Metric' },
              { key: 'value', label: 'Value', align: 'right' },
            ]}
            rows={p.couponDetail}
          />
        </Panel>
      </Group>

      <Group title="Technology breakdowns">
        <Row>
          <Panel title="Sessions by platform"><Donut data={p.sessionsByPlatform} /></Panel>
          <Panel title="Conversion by platform">
            <MiniTable
              columns={[
                { key: 'platform', label: 'Platform' },
                { key: 'sessions', label: 'Sessions', align: 'right' },
                { key: 'conv', label: 'Conversion', align: 'right' },
              ]}
              rows={p.conversionByPlatform}
            />
          </Panel>
        </Row>
        <Row>
          <Panel title="Sessions by operating system"><BarList data={p.sessionsByOs} /></Panel>
          <Panel title="Conversion by operating system">
            <MiniTable
              columns={[
                { key: 'os', label: 'OS' },
                { key: 'sessions', label: 'Sessions', align: 'right' },
                { key: 'conv', label: 'Conversion', align: 'right' },
              ]}
              rows={p.conversionByOs}
            />
          </Panel>
        </Row>
      </Group>

      <Panel title="Session & path diagnostics">
        <EmptyState title="Diagnostics unavailable" description="Session paths, exit points and journey duration are not available yet." />
      </Panel>
    </div>
  );
}

/* ── Discovery & Catalogue ───────────────────────────────────────────── */

// Match the Companion backend's catalogue attention thresholds.
function catalogueStatus(value: number): 'critical' | 'warning' | 'success' {
  return value < 50 ? 'critical' : value < 80 ? 'warning' : 'success';
}

function DiscoveryCatalogue(): React.ReactNode {
  const range = useDateRange();
  const query = useDiscoveryCatalogue(range ? { from: range.from, to: range.to } : {});

  const p = query.data;
  if (query.isError || !p) return <ProductStatus loading={query.isLoading} retry={() => { void query.refetch(); }} />;

  // The headline now explicitly describes SAP; never average the pipelines or
  // substitute the network OVERALL value when SAP is unavailable.
  const sap = p.pipelineCompletion.find((row) => String(row.pipeline).trim().toUpperCase() === 'SAP');
  const completion = typeof sap?.value === 'number' && Number.isFinite(sap.value) ? sap.value : null;
  const completionStatus = completion === null ? undefined : catalogueStatus(completion);
  const ajio = p.pipelineOverview.find((row) => String(row.pipeline).trim().toUpperCase() === 'AJIO CE');
  const ajioPct = String(ajio?.pct ?? '').trim();
  const completionNote = /^\d+(\.\d+)?%$/.test(ajioPct)
    ? `SAP is 99%+ of total product volume — AJIO CE is separately ~${ajioPct} complete`
    : 'SAP is 99%+ of total product volume — AJIO CE completion is unavailable';
  const catalogueKpis = p.catalogueKpis.map((item) => {
    if (item.key === 'complete_catalog') return { ...item, label: 'Completed Products' };
    if (item.key === 'missing_catalog') return { ...item, label: 'Missing Products' };
    if (item.key === 'completion_percentage') {
      return {
        ...item,
        label: 'Catalogue completion (SAP)',
        value: completion === null ? '—' : `${completion.toFixed(2)}%`,
        status: completionStatus,
      };
    }
    return item;
  });

  return (
    <div className="space-y-6">
      <DataNotes notes={p.notes} hasData={p.hasData} />
      <Group title="Catalogue health — network-wide">
        <KpiGrid items={catalogueKpis} statusKeys={['completion_percentage']} />
      </Group>

      <Group title="Catalogue visuals">
        <Row>
          <Panel title="Overall completion">
            {completion === null ? (
              <EmptyState description="SAP catalogue completion unavailable" />
            ) : (
              <Gauge
                value={completion}
                label="Catalogue completion (SAP)"
                sublabel={completionNote}
                status={completionStatus}
              />
            )}
            <p className="mt-2 text-xs text-gray-500">Snapshot: {p.snapshotTime}</p>
          </Panel>
          <Panel title="Pipeline overview">
            <MiniTable
              columns={[
                { key: 'pipeline', label: 'Pipeline' },
                { key: 'total', label: 'Total', align: 'right' },
                { key: 'completed', label: 'Completed', align: 'right' },
                { key: 'pct', label: 'Completion', align: 'right' },
              ]}
              rows={p.pipelineOverview}
            />
          </Panel>
        </Row>
        <Row>
          <Panel title="Pipeline completion"><VBarChart data={p.pipelineCompletion} xKey="pipeline" valueFormatter={pct} /></Panel>
          <Panel title="Attribute fill rate"><ProgressRows data={p.attributeFill} /></Panel>
        </Row>
        <Row>
          <Panel title="Media coverage by pipeline">
            <BarList data={p.mediaCoverageByPipeline} valueFormatter={pct} />
          </Panel>
          <Panel title="Missing products by pipeline">
            <MiniTable
              columns={[
                { key: 'pipeline', label: 'Pipeline' },
                { key: 'missing', label: 'Missing / incomplete', align: 'right' },
                { key: 'topGap', label: 'Top gap' },
              ]}
              rows={p.missingByPipeline}
            />
          </Panel>
        </Row>
      </Group>

      <Group title="Scan metrics">
        <KpiGrid items={p.scanKpis} />
      </Group>

      <Group title="Scan visuals">
        <Row>
          <Panel title="Daily scan volume"><TrendChart data={p.dailyScanVolume} series={[{ key: 'value', label: 'Scans' }]} /></Panel>
          <Panel title="Daily scan success"><TrendChart data={p.dailyScanSuccess} series={[{ key: 'value', label: 'Success %' }]} valueFormatter={pct} /></Panel>
        </Row>
        <Panel title="Scan lookup outcomes">
          <StackedBar
            data={p.scanOutcomeStacked}
            xKey="date"
            series={[{ key: 'found', label: 'Found' }, { key: 'notFound', label: 'Not found' }, { key: 'apiError', label: 'API error' }, { key: 'other', label: 'Other / unspecified' }]}
          />
        </Panel>
        <Panel title="Scanner outcomes"><BarList data={p.scanOutcomesBar} /></Panel>
        <Row>
          <Panel title="Most frequently scanned EANs">
            <MiniTable
              columns={[
                { key: 'ean', label: 'EAN' },
                { key: 'product', label: 'Product' },
                { key: 'scans', label: 'Scans', align: 'right' },
                { key: 'found', label: 'In catalogue' },
              ]}
              rows={p.topScannedEans.map((r) => ({ ...r, scans: r.scans.toLocaleString('en-IN') }))}
            />
          </Panel>
          <Panel title="Most frequent catalogue-gap EANs">
            <MiniTable
              columns={[
                { key: 'ean', label: 'EAN' },
                { key: 'scans', label: 'Scans', align: 'right' },
                { key: 'stores', label: 'Stores', align: 'right' },
                { key: 'firstSeen', label: 'First seen' },
              ]}
              rows={p.topGapEans.map((r) => ({ ...r, scans: r.scans.toLocaleString('en-IN'), stores: String(r.stores) }))}
            />
          </Panel>
        </Row>
        <Panel title="Stores encountering catalogue gaps">
          <MiniTable
            columns={[
              { key: 'store', label: 'Store' },
              { key: 'state', label: 'State' },
              { key: 'gapScans', label: 'Gap scans', align: 'right' },
              { key: 'gapEans', label: 'Gap EANs', align: 'right' },
            ]}
            rows={p.gapStores.map((r) => ({ ...r, gapScans: String(r.gapScans), gapEans: String(r.gapEans) }))}
          />
        </Panel>
      </Group>
    </div>
  );
}

const CX_PAGE_SIZE = 20;

function FeedbackTable({ rows }: { rows: Record<string, string | number>[] }): React.ReactNode {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(rows.length / CX_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  if (!rows.length) return <EmptyState description="No store feedback in this date range" />;
  return <div className="space-y-3">
        <MiniTable
          columns={[
            { key: 'store', label: 'Store' },
            { key: 'state', label: 'State' },
            { key: 'responses', label: 'Responses', align: 'right' },
            { key: 'avg', label: 'Avg rating', align: 'right' },
            { key: 'positive', label: 'Positive share', align: 'right' },
            { key: 'difficulty', label: 'Difficulty share', align: 'right' },
            { key: 'wfp', label: 'Written-feedback part.', align: 'right' },
          ]}
          rows={rows.slice((currentPage - 1) * CX_PAGE_SIZE, currentPage * CX_PAGE_SIZE)}
        />
    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setPage} totalItems={rows.length} pageSize={CX_PAGE_SIZE} />
  </div>;
}

/* ── Customer Experience ─────────────────────────────────────────────── */

function CustomerExperience(): React.ReactNode {
  const range = useDateRange();
  const query = useProductCx(range ? { from: range.from, to: range.to } : {});

  const p = query.data;
  if (query.isError || !p) return <ProductStatus loading={query.isLoading} retry={() => { void query.refetch(); }} />;

  return (
    <div className="space-y-6">
      <DataNotes notes={p.notes} hasData={p.hasData} />
      {!p.cxDataQuality.trustworthy && <p role="alert" className="rounded-md border border-amber-200 px-3 py-2 text-xs text-amber-700">{p.cxDataQuality.note}</p>}
      <Group title="Customer experience">
        <KpiGrid items={p.cxKpis} />
      </Group>

      <Group title="Trends & distributions">
        <Row>
          <Panel title="Daily response volume"><TrendChart data={p.cxTrends.dailyResponses} series={[{ key: 'value', label: 'Responses' }]} /></Panel>
          <Panel title="Average rating over time"><TrendChart data={p.cxTrends.ratingOverTime} series={[{ key: 'value', label: 'Avg rating' }]} valueFormatter={(v) => v.toFixed(2)} /></Panel>
        </Row>
        <Row>
          <Panel title="Rating distribution"><BarList data={p.cxRatingDist} /></Panel>
          <Panel title="Purchase difficulty"><Donut data={p.purchaseDifficultySplit} /></Panel>
        </Row>
        <Row>
          <Panel title="Difficulty categories"><BarList data={p.difficultyCategories} /></Panel>
          <Panel title="Written-feedback participation"><Donut data={p.writtenFeedbackParticipation} /></Panel>
        </Row>
        <Row>
          <Panel title="Average-rating trend"><TrendChart data={p.cxTrends.ratingOverTime} series={[{ key: 'value', label: 'Avg rating' }]} valueFormatter={(v) => v.toFixed(2)} /></Panel>
          <Panel title="Purchase-difficulty trend"><TrendChart data={p.cxTrends.difficultyOverTime} series={[{ key: 'value', label: 'Difficulty %' }]} valueFormatter={pct} /></Panel>
        </Row>
        <Row>
          <Panel title="Purchase difficulty by store"><BarList data={p.difficultyByStore} valueFormatter={pct} /></Panel>
          <Panel title="Feedback by store"><BarList data={p.feedbackByStore} pageSize={5} /></Panel>
        </Row>
        <Panel title="Feedback by state"><BarList data={p.feedbackByState} pageSize={5} /></Panel>
      </Group>

      <Panel title="Rating & response comparison by store" subtitle="Written comments and personal identifiers are not shown.">
        <FeedbackTable key={`${range?.from ?? "all"}:${range?.to ?? "all"}`} rows={p.cxFeedbackTable} />
      </Panel>

      <Panel title="Survey deployment inventory">
        <MiniTable
          columns={[
            { key: 'slot', label: 'Application slot' },
            { key: 'survey', label: 'Survey ID' },
            { key: 'deployedOn', label: 'Deployed on' },
            { key: 'status', label: 'Status' },
            { key: 'responses', label: 'Responses in range', align: 'right' },
          ]}
          rows={p.surveyDeploymentInventory}
        />
      </Panel>
    </div>
  );
}

/* ── Shell ───────────────────────────────────────────────────────────── */

export function ProductHealthDashboard(): React.ReactNode {
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

      {section === 'overview' && <ProductOverview />}
      {section === 'journey' && <JourneyFunnel />}
      {section === 'catalogue' && <DiscoveryCatalogue />}
      {section === 'cx' && <CustomerExperience />}
    </div>
  );
}

export default ProductHealthDashboard;
