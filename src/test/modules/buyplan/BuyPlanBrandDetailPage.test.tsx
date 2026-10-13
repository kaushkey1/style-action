/**
 * Buy Plan — Brand detail page: costing state-flow UI behaviour.
 *
 * These live in a dedicated `buyplan` test folder even though the source sits
 * under `src/modules/otb/` (there is no `src/modules/buyplan`). They verify the
 * front-end guardrails the backend does NOT enforce: field editability by
 * status × costing_engine_enabled, the zero-quantity "not eligible for costing"
 * guard, the Save cost coercion (cost_price → null when costing is enabled), and
 * the Send-to-Costing / Send-to-DP buttons + toast.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { TooltipProvider } from '@/components/ui';
import { makeOption, makeRun, FUTURE_DATE } from './fixtures';

const h = vi.hoisted(() => ({
  costingEnabled: true,
  runData: null as unknown,
  toggleSpy: vi.fn(),
  updateSpy: vi.fn(),
  sendCostingSpy: vi.fn(),
  sendDpSpy: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
  useParams: () => ({ id: 'R1' }),
  useNavigate: () => vi.fn(),
}));
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ success: h.toastSuccess, error: h.toastError }),
}));
vi.mock('@/permissions', () => ({
  useModulePermissions: () => ({ edit: true }),
}));
vi.mock('@/hooks/useScreenConfig', () => ({
  useFeatureFlag: () => h.costingEnabled,
}));
vi.mock('@/modules/otb/api/buyPlanHooks', () => ({
  useRunOptionsFilters: () => ({ data: undefined }),
  useRunOptions: () => ({ data: h.runData, isLoading: false, error: null }),
  useDownloadRunOptions: () => ({ mutate: vi.fn(), isPending: false }),
  useToggleOptionActive: () => ({ mutate: h.toggleSpy, isPending: false }),
  useUpdateOptionQuantity: () => ({ mutate: h.updateSpy, isPending: false }),
  useUpdateRunStatus: () => ({ mutate: h.sendCostingSpy, isPending: false }),
  useSendToDp: () => ({ mutate: h.sendDpSpy, isPending: false }),
}));

import BuyPlanBrandDetailPage from '@/modules/otb/pages/BuyPlanBrandDetailPage';

function renderPage() {
  return render(
    <TooltipProvider>
      <BuyPlanBrandDetailPage />
    </TooltipProvider>,
  );
}

/** The option card's edit actions live in a collapsed section; expand it. */
function expandCard(container: HTMLElement) {
  const chevron = container.querySelector('.lucide-chevron-down');
  const btn = chevron?.closest('button');
  if (btn) fireEvent.click(btn);
}

beforeEach(() => {
  vi.clearAllMocks();
  h.costingEnabled = true;
  h.runData = null;
  // Send-to-DP mutation fires the onSuccess callback (drives the toast).
  h.sendDpSpy.mockImplementation((_arg: unknown, opts?: { onSuccess?: () => void }) => opts?.onSuccess?.());
});

describe('BuyPlanBrandDetailPage — zero quantity guard', () => {
  it('shows the "not eligible for costing" banner for an active qty-0 option', () => {
    h.costingEnabled = true;
    h.runData = makeRun(makeOption({ quantity: 0, status: 'Pending Costing' }));
    renderPage();

    expect(
      screen.getByText(/Quantity is 0 — not eligible for costing\. Increase quantity or mark this option as inactive\./),
    ).toBeInTheDocument();
  });

  it('disables Send to Costing when an active option has qty 0', () => {
    h.costingEnabled = true;
    h.runData = makeRun(makeOption({ quantity: 0, status: 'Pending Costing' }));
    renderPage();

    const btn = screen.getByRole('button', { name: /Send to Costing/i });
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute(
      'title',
      expect.stringContaining('0 quantity'),
    );
  });

  it('does not show the banner for an inactive qty-0 option', () => {
    h.costingEnabled = true;
    h.runData = makeRun(makeOption({ quantity: 0, is_enabled: false, status: 'Pending Costing' }));
    renderPage();

    expect(screen.queryByText(/not eligible for costing/)).not.toBeInTheDocument();
  });
});

describe('BuyPlanBrandDetailPage — Save cost coercion', () => {
  it('sends cost_price=null and costing_disabled=false when costing is enabled', () => {
    h.costingEnabled = true;
    h.runData = makeRun(
      makeOption({ status: 'Costing Received', quantity: 5, mrp: 999, cost_price: 400, delivery_date: FUTURE_DATE }),
    );
    const { container } = renderPage();

    expandCard(container);
    fireEvent.click(screen.getByRole('button', { name: /^Edit$/i }));
    const save = screen.getByRole('button', { name: /^Save$/i });
    expect(save).toBeEnabled();
    fireEvent.click(save);

    expect(h.updateSpy).toHaveBeenCalledTimes(1);
    const payload = h.updateSpy.mock.calls[0][0];
    expect(payload.optionId).toBe(1);
    expect(payload.costPrice).toBeNull();
    expect(payload.costingDisabled).toBe(false);
  });

  it('sends the entered cost and costing_disabled=true when costing is disabled', () => {
    h.costingEnabled = false;
    h.runData = makeRun(
      makeOption({ status: 'Pending Costing', quantity: 5, mrp: 999, cost_price: 400, delivery_date: FUTURE_DATE }),
    );
    const { container } = renderPage();

    expandCard(container);
    fireEvent.click(screen.getByRole('button', { name: /^Edit$/i }));
    const save = screen.getByRole('button', { name: /^Save$/i });
    expect(save).toBeEnabled();
    fireEvent.click(save);

    expect(h.updateSpy).toHaveBeenCalledTimes(1);
    const payload = h.updateSpy.mock.calls[0][0];
    expect(payload.costPrice).toBe(400);
    expect(payload.costingDisabled).toBe(true);
  });
});

describe('BuyPlanBrandDetailPage — Send to DP', () => {
  it('enables Send to DP for a costed option and toasts "to DP" on success', () => {
    h.costingEnabled = true;
    h.runData = makeRun(
      makeOption({ status: 'Costing Received', quantity: 5, mrp: 999, cost_price: 400, delivery_date: FUTURE_DATE }),
    );
    renderPage();

    const dp = screen.getByRole('button', { name: /Send to DP/i });
    expect(dp).toBeEnabled();
    fireEvent.click(dp);

    expect(h.sendDpSpy).toHaveBeenCalled();
    expect(h.toastSuccess).toHaveBeenCalledWith('Successfully sent to DP');
  });
});
