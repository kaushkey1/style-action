import axios from 'axios';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TooltipProvider } from '@/components/ui';
import type { CategoryRun, PlanMetrics, PlanOption } from '@/modules/otb/api/categoryBuyPlanApi';
import BuyPlanCategoryListPage from '@/modules/otb/pages/BuyPlanCategoryListPage';

const run: CategoryRun = {
  run_id: 'run-1', sale_month: '2026-11-01', current_month: '2026-09-01', version: 1,
  stage: 'planning', created_at: '2026-09-30',
  parameters: { days_of_cover: 60, month_days: 30, reference_date: '2026-09-30' },
};
const metrics: PlanMetrics = {
  option_count: 121, store_count: 3, total_quantity: 242, eligible_quantity: 0,
  held_count: 121, held_store_options: 363, missing_cost_count: 121, otb_value: null,
  ctl01: 'pass', ctl02: 'fail', ctl03: 'fail',
};
const option: PlanOption = {
  ...metrics, option_count: 1, held_count: 1, code: 'OPTION', category: 'C', subcategory: 'Tops',
  brick: 'B', fashion_grade: 'APL-FASHION', true_ros: 0.1, forward_ros: 0.1,
  controls: [{ id: 'CTL-02', status: 'fail', actual: null, target: null, reason: 'MISSING_MRP_OR_COST' }],
  attributes: {
    category_name: 'Menswear', subcategory_name: 'Tops', brick_name: 'Tees', style_id: null,
    brand: 'Brand', family: 'Tops', class_name: 'Tees', fabric: 'Cotton', fit: 'Regular',
    pattern: null, neck_type: null, sleeve: null, color: 'Blue', mrp: 1000, cost: null,
    intake_margin: null, image_url: null, is_new_option: false,
  },
};
type Request = { resource: string; runId: string; page: number; pageSize: number };
let requests: Request[];
let totalRecords: number;
let failingPage: number | undefined;
let client: QueryClient;

beforeEach(() => {
  requests = [];
  totalRecords = 121;
  failingPage = undefined;
  client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  vi.spyOn(axios, 'get').mockImplementation(async (url, config) => {
    const params = config?.params as { run_id?: string; page?: number; page_size?: number };
    const resource = url.endsWith('/exceptions') ? 'exceptions' : 'categories';
    const runId = params.run_id ?? run.run_id;
    const page = params.page ?? 1;
    const pageSize = params.page_size ?? 50;
    requests.push({ resource, runId, page, pageSize });
    if (resource === 'exceptions' && page === failingPage) throw new Error('Request failed');
    const start = (page - 1) * pageSize;
    const items = resource === 'categories'
      ? [{ ...metrics, code: 'C', name: 'Menswear' }]
      : Array.from({ length: Math.max(0, Math.min(pageSize, totalRecords - start)) }, (_, index) => ({
        ...option, code: `${runId}-OPTION-${start + index + 1}`,
      }));
    return { data: { data: {
      run: { ...run, run_id: runId }, items,
      summary: { ...metrics, held_count: totalRecords },
      pagination: { page, page_size: pageSize, total_records: totalRecords },
    } } };
  });
});

afterEach(() => {
  cleanup();
  client.clear();
  vi.restoreAllMocks();
});

function renderPage() {
  render(<QueryClientProvider client={client}>
    <TooltipProvider>
      <MemoryRouter initialEntries={['/buy-plans/month/2026-11?run=run-1']}>
        <Link to="/buy-plans/month/2026-11?run=run-2">Another run</Link>
        <Routes>
          <Route path="/buy-plans/month/:saleMonth" element={<BuyPlanCategoryListPage />} />
        </Routes>
      </MemoryRouter>
    </TooltipProvider>
  </QueryClientProvider>);
}

function exceptionRequests() {
  return requests.filter(request => request.resource === 'exceptions');
}

async function openExceptions() {
  fireEvent.click(await screen.findByRole('button', { name: /Exceptions Needing Approval/ }));
}

describe('Buy Plan exceptions server pagination', () => {
  it('does not download exception pages while the Pipeline tab is open', async () => {
    // Regression: opening Pipeline used to start downloading every exception page in the background.
    renderPage();
    const tab = await screen.findByRole('button', { name: /Exceptions Needing Approval/ });
    expect(tab).toHaveTextContent('121');
    expect(exceptionRequests()).toEqual([]);
  });

  it('renders the first page immediately and fetches further pages only on navigation', async () => {
    // Regression: the first rows stayed hidden until the entire held-option dataset was fetched.
    renderPage();
    await openExceptions();
    await screen.findByText('run-1-OPTION-1');
    expect(exceptionRequests()).toEqual([{ resource: 'exceptions', runId: 'run-1', page: 1, pageSize: 50 }]);
    expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(51);
    expect(screen.getByText(/options held across all categories/)).toHaveTextContent('121 options');
    expect(screen.getByRole('button', { name: /Exceptions Needing Approval/ })).toHaveTextContent('121');
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
    await screen.findByText('run-1-OPTION-51');
    expect(screen.queryByText('run-1-OPTION-1')).not.toBeInTheDocument();
    expect(exceptionRequests().map(request => request.page)).toEqual([1, 2]);
    expect(screen.getByText(/options held across all categories/)).toHaveTextContent('121 options');

    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
    await screen.findByText('run-1-OPTION-101');
    expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(22);
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
    expect(exceptionRequests().map(request => request.page)).toEqual([1, 2, 3]);

    fireEvent.click(screen.getByRole('button', { name: 'Previous page' }));
    await screen.findByText('run-1-OPTION-51');
    expect(exceptionRequests().map(request => request.page)).toEqual([1, 2, 3]);
  });

  it('starts at the first page when navigating to another run', async () => {
    // A previous run's page number must not skip the beginning of a newly selected run.
    renderPage();
    await openExceptions();
    await screen.findByText('run-1-OPTION-1');
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
    await screen.findByText('run-1-OPTION-51');
    fireEvent.click(screen.getByRole('link', { name: 'Another run' }));
    await screen.findByText('run-2-OPTION-1');
    expect(exceptionRequests().filter(request => request.runId === 'run-2').map(request => request.page)).toEqual([1]);
    expect(screen.queryByText('run-1-OPTION-51')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled();
  });

  it('retries just the failed page and does not render stale rows as success', async () => {
    // A later page failure should never restart the old fetch-all-pages chain.
    failingPage = 2;
    renderPage();
    await openExceptions();
    await screen.findByText('run-1-OPTION-1');
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
    await screen.findByText('Buy plan could not be loaded');
    expect(screen.queryByText('run-1-OPTION-1')).not.toBeInTheDocument();
    failingPage = undefined;
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    await screen.findByText('run-1-OPTION-51');
    expect(exceptionRequests().map(request => request.page)).toEqual([1, 2, 2]);
  });

  it('shows the empty state without requesting more pages when there are no exceptions', async () => {
    // An empty response must terminate loading without requesting a nonexistent next page.
    totalRecords = 0;
    renderPage();
    await openExceptions();
    await waitFor(() => expect(screen.getByText('No exceptions')).toBeInTheDocument());
    expect(exceptionRequests().map(request => request.page)).toEqual([1]);
    expect(screen.queryByRole('button', { name: 'Next page' })).not.toBeInTheDocument();
  });
});
