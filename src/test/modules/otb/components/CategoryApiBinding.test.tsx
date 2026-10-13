import type { ReactNode } from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import BuyPlanCategoryListPage from '@/modules/otb/pages/BuyPlanCategoryListPage';
import BuyPlanOptionsWorkbenchPage from '@/modules/otb/pages/BuyPlanOptionsWorkbenchPage';
import { moneyText, planPath, toOption } from '@/modules/otb/api/categoryPlanData';
import type { CategoryRun, PlanMetrics, PlanOption } from '@/modules/otb/api/categoryBuyPlanApi';
import { TooltipProvider } from '@/components/ui';

const hooks = vi.hoisted(() => ({
  useCategoryGroups: vi.fn(), useCategoryOptionList: vi.fn(), useCategoryStoreList: vi.fn(), useCategoryExceptions: vi.fn(),
}));
vi.mock('@/modules/otb/api/categoryBuyPlanApi', () => hooks);
vi.mock('@/permissions', () => ({
  useModulePermissions: () => ({ approve: false }),
  PermissionGate: ({ children }: { children: ReactNode }) => children,
}));
vi.mock('@/modules/otb/stores/buyPlan.store', () => ({
  useBuyPlanStore: () => ({ categorySubmissions: {}, heldDecisions: {}, poSentOptions: {},
    otbCategoryStatuses: {}, calculateOTB: vi.fn(), submitForCommercialReview: vi.fn(),
    setHeldDecision: vi.fn(), approveOTB: vi.fn(), holdOTB: vi.fn() }),
}));

const run: CategoryRun = { run_id: 'run-1', sale_month: '2026-11-01', current_month: '2026-09-01',
  version: 1, stage: 'planning', created_at: '2026-09-25',
  parameters: { days_of_cover: 60, month_days: 30, reference_date: '2026-09-25' } };
const metrics: PlanMetrics = { option_count: 1, store_count: 3, total_quantity: 17,
  held_count: 1, held_store_options: 3, eligible_quantity: 0, missing_cost_count: 1,
  otb_value: null, ctl01: 'pass', ctl02: 'fail', ctl03: 'fail' };
const option: PlanOption = { ...metrics, code: 'OPTION-17', category: 'C', subcategory: 'Tops / Tees',
  brick: 'B', fashion_grade: 'APL-FASHION', true_ros: 0.12, forward_ros: 0.13,
  ideal_closing_stock: 12, expected_sales: 5, opening_stock: 0, inwards: 0,
  controls: [{ id: 'CTL-02', status: 'fail', actual: null, target: null, reason: 'MISSING_MRP_OR_COST' }],
  attributes: { category_name: 'Menswear', subcategory_name: 'Tops / Tees', brick_name: 'Tees',
    style_id: 'STYLE-1', brand: 'Brand', family: 'Tops', class_name: 'Tees', fabric: 'Cotton',
    fit: 'Regular', pattern: null, neck_type: null, sleeve: null, color: 'Blue', mrp: 1000,
    cost: null, intake_margin: null, image_url: null, is_new_option: false } };
const success = (data: unknown) => ({ data, isPending: false, isError: false, refetch: vi.fn() });

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('ResizeObserver', class {
    observe() {}
    disconnect() {}
  });
  hooks.useCategoryOptionList.mockReturnValue(success({ run, items: [option], summary: metrics,
    pagination: { page: 1, page_size: 100, total_records: 1 } }));
  hooks.useCategoryExceptions.mockReturnValue(success({ run, items: [option], summary: metrics,
    pagination: { page: 1, page_size: 50, total_records: 1 } }));
  hooks.useCategoryStoreList.mockReturnValue(success({ run, items: [
    { site: 'S1', option_code: option.code, attributes: { store_name: 'Store One' },
      ideal_closing_stock: 4, expected_sales: 2, opening_stock: 0, inwards: 0, buy_qty: 6 },
    { site: 'S2', option_code: option.code, attributes: { store_name: 'Store Two' },
      ideal_closing_stock: 4, expected_sales: 2, opening_stock: 0, inwards: 0, buy_qty: 6 },
    { site: 'S3', option_code: option.code, attributes: { store_name: 'Store Three' },
      ideal_closing_stock: 4, expected_sales: 1, opening_stock: 0, inwards: 0, buy_qty: 5 },
  ], pagination: { page: 1, page_size: 100, total_records: 3 } }));
});

afterEach(() => vi.unstubAllGlobals());

describe('API bindings retain the Category design', () => {
  it('keeps the pipeline table and inline subcategories using API values', () => {
    hooks.useCategoryGroups.mockReturnValue(success({ run, summary: metrics, items: [{
      ...metrics, code: 'C', name: 'Menswear', children: [{ ...metrics, code: 'Tops / Tees', name: 'Tops / Tees', brick_count: 2 }],
    }] }));
    render(<MemoryRouter initialEntries={['/buy-plans/month/2026-11?run=run-1']}>
      <Routes>
        <Route path="/buy-plans/month/:saleMonth" element={<BuyPlanCategoryListPage />} />
        <Route path="/buy-plans/month/:saleMonth/category/:catCode/sub/:subCode" element={<div>Subcategory details</div>} />
      </Routes>
    </MemoryRouter>);
    expect(screen.getByRole('columnheader', { name: 'Pipeline Progress' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Stage' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Exceptions Needing Approval/ })).toBeInTheDocument();
    const row = screen.getByText('Menswear').closest('tr')!;
    const expand = within(row).getByRole('button', { name: 'Expand Menswear' });
    fireEvent.click(expand);
    expect(expand).toHaveAttribute('aria-expanded', 'true');
    const details = within(screen.getByRole('region', { name: 'Menswear subcategories' }));
    expect(details.getByRole('link', { name: 'Tops / Tees' })).toHaveAttribute('href',
      '/buy-plans/month/2026-11/category/C/sub/Tops%20%2F%20Tees?run=run-1');
    expect(details.queryByText('Pipeline Progress')).not.toBeInTheDocument();
    expect(details.getByText('Bricks').nextElementSibling).toHaveTextContent('2');
    expect(details.getByText('Held').nextElementSibling).toHaveTextContent('1');
    expect(details.getByText('Sys Buy Qty').nextElementSibling).toHaveTextContent('17');
    expect(within(row).getByText('17')).toBeInTheDocument();
    fireEvent.click(details.getByText('Sys Buy Qty').nextElementSibling!);
    expect(screen.getByText('Subcategory details')).toBeInTheDocument();
  });

  it('keeps option cards, filters and the quantity modal while using real calculations', () => {
    render(<MemoryRouter initialEntries={['/buy-plans/month/2026-11/category/C/sub/Tops%20%2F%20Tees/brick/B?run=run-1']}>
      <Routes><Route path="/buy-plans/month/:saleMonth/category/:catCode/sub/:subCode/brick/:brickCode"
        element={<BuyPlanOptionsWorkbenchPage />} /></Routes>
    </MemoryRouter>);
    expect(screen.getByPlaceholderText('Search option code...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'PO Summary' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit for Commercial Review' })).toBeInTheDocument();
    expect(screen.getByText('Blue')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '17' }));
    const dialog = within(screen.getByRole('dialog'));
    expect(dialog.getByRole('heading', { name: 'Buy Quantity Calculation' })).toBeInTheDocument();
    expect(dialog.getByText('Total units across 3 stores')).toBeInTheDocument();
    expect(dialog.getByText('Days of Cover')).toBeInTheDocument();
    expect(dialog.getByText('60', { exact: true })).toBeInTheDocument();
    expect(dialog.queryByText(/missing mrp or cost/)).not.toBeInTheDocument();
    expect(dialog.getByText('6 + 6 + 5')).toBeInTheDocument();
    const variables = within(dialog.getByRole('region', { name: 'Formula variables' }));
    expect(variables.getByText('Target closing stock').nextElementSibling).toHaveTextContent('12');
    expect(variables.getByText('Expected sales').nextElementSibling).toHaveTextContent('5');
    expect(variables.getByText('Opening stock').nextElementSibling).toHaveTextContent('0');
    expect(variables.getByText('Inwards').nextElementSibling).toHaveTextContent('0');
    expect(hooks.useCategoryStoreList).toHaveBeenCalledWith({run_id: 'run-1', category: 'C', subcategory: 'Tops / Tees', brick: 'B'}, 'OPTION-17');
    expect(dialog.queryByText(/SSU/)).not.toBeInTheDocument();
    expect(hooks.useCategoryOptionList).toHaveBeenCalledWith(expect.objectContaining({ subcategory: 'Tops / Tees', run_id: 'run-1' }));
  });

  it('debounces backend search and uses its results without changing brick totals', async () => {
    const response = (items: PlanOption[]) => success({ run, items, summary: metrics,
      pagination: { page: 1, page_size: 100, total_records: items.length } });
    hooks.useCategoryOptionList.mockImplementation((_scope, _exceptions, filters = {}) => {
      // A server result need not match the display code: never re-filter it locally.
      return response(filters.search ? [] : [option]);
    });
    render(<MemoryRouter initialEntries={['/buy-plans/month/2026-11/category/C/sub/Tops/brick/B?run=run-1']}>
      <Routes><Route path="/buy-plans/month/:saleMonth/category/:catCode/sub/:subCode/brick/:brickCode"
        element={<BuyPlanOptionsWorkbenchPage />} /></Routes>
    </MemoryRouter>);
    const search = screen.getByRole('textbox', { name: 'Search options' });
    search.focus();
    fireEvent.change(search, { target: { value: 'B' } });
    fireEvent.change(search, { target: { value: 'Blue' } });
    expect(hooks.useCategoryOptionList.mock.calls.some(call => call[2]?.search)).toBe(false);
    await waitFor(() => expect(hooks.useCategoryOptionList).toHaveBeenCalledWith(
      expect.objectContaining({ brick: 'B', run_id: 'run-1' }), false,
      expect.objectContaining({ search: 'Blue' }), true));
    expect(screen.getByText('No options match the current filters.')).toBeInTheDocument();
    expect(screen.getByText('Total Options').nextElementSibling).toHaveTextContent('1');
    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(await screen.findByRole('article', { name: 'Option OPTION-17' })).toBeInTheDocument();
    expect(search).toHaveFocus();
  });

  it('shows different styles in one brick grid and toggles Show less', async () => {
    hooks.useCategoryOptionList.mockReturnValue(success({ run, summary: metrics, items: [option,
      { ...option, code: 'OPTION-18', attributes: { ...option.attributes, style_id: 'STYLE-2' } }],
      pagination: { page: 1, page_size: 100, total_records: 2 } }));
    render(<MemoryRouter initialEntries={['/buy-plans/month/2026-11/category/C/sub/Tops/brick/B?run=run-1']}>
      <Routes><Route path="/buy-plans/month/:saleMonth/category/:catCode/sub/:subCode/brick/:brickCode"
        element={<BuyPlanOptionsWorkbenchPage />} /></Routes>
    </MemoryRouter>);
    const cards = within(screen.getByRole('region', { name: 'Brick options' })).getAllByRole('article');
    expect(cards).toHaveLength(2);
    expect(cards[0].parentElement).toBe(cards[1].parentElement);
    const card = within(cards[0]);
    fireEvent.click(card.getByRole('button', { name: 'Details' }));
    expect(card.getByRole('button', { name: 'Show less' })).toHaveAttribute('aria-expanded', 'true');
    expect(card.getByText('Fabric')).toBeInTheDocument();
    fireEvent.click(card.getByRole('button', { name: 'Show less' }));
    await waitFor(() => expect(card.queryByText('Fabric')).not.toBeInTheDocument());
  });

  it('preserves missing values and encodes hierarchy names without changing the route', () => {
    const view = toOption(option, run);
    expect(view.cost).toBeNull();
    expect(view.intakeMarginPct).toBeNull();
    expect(view.sysBuyQty).toBe(17);
    expect(moneyText(view.cost)).toBe('-');
    expect(planPath('2026-11', 'C', 'Tops / Tees', 'B', 'run-1'))
      .toBe('/buy-plans/month/2026-11/category/C/sub/Tops%20%2F%20Tees/brick/B?run=run-1');
  });

  it('shows the API failure reason for the hovered exception control', async () => {
    const user = userEvent.setup();
    hooks.useCategoryGroups.mockReturnValue(success({ run, summary: metrics,
      items: [{ ...metrics, code: 'C', name: 'Menswear' }] }));
    hooks.useCategoryExceptions.mockReturnValue(success({ run, summary: metrics,
      pagination: { page: 1, page_size: 50, total_records: 1 }, items: [{
      ...option, ctl01: 'fail', controls: [
        { id: 'CTL-01', status: 'fail', actual: 0, target: 0, reason: 'NO_BUY_REQUIRED' },
        { id: 'CTL-02', status: 'fail', actual: null, target: null, reason: 'MISSING_MRP_OR_COST' },
        { id: 'CTL-03', status: 'fail', actual: null, target: null, reason: 'MISSING_SELL_THROUGH_TARGET' },
      ],
    }] }));
    render(<TooltipProvider delayDuration={0}>
      <MemoryRouter initialEntries={['/buy-plans/month/2026-11?run=run-1']}>
        <Routes><Route path="/buy-plans/month/:saleMonth" element={<BuyPlanCategoryListPage />} /></Routes>
      </MemoryRouter>
    </TooltipProvider>);
    await user.click(screen.getByRole('button', { name: /Exceptions Needing Approval/ }));
    const row = within(screen.getByText('OPTION-17').closest('tr')!);
    for (const [id, reason] of [
      ['CTL-01', 'no buy required'], ['CTL-02', 'missing mrp or cost'], ['CTL-03', 'missing sell through target'],
    ]) {
      const trigger = row.getByRole('button', { name: id });
      await user.hover(trigger);
      expect(await screen.findByRole('tooltip')).toHaveTextContent(`${id} failed`);
      expect(screen.getByRole('tooltip')).toHaveTextContent(reason);
      await user.unhover(trigger);
      await waitFor(() => expect(screen.queryByRole('tooltip')).not.toBeInTheDocument());
    }
  });
});
