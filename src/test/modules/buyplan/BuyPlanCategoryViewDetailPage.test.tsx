/**
 * Buy Plan — Category-view detail page: parity checks with the Brand detail page.
 * The zero-quantity guard and Send-to-Costing gating are duplicated across both
 * pages, so this asserts they behave identically here.
 */
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { TooltipProvider } from '@/components/ui';
import { makeOption, makeRun } from './fixtures';

const h = vi.hoisted(() => ({
  costingEnabled: true,
  runData: null as unknown,
}));

vi.mock('react-router-dom', () => ({
  useParams: () => ({ id: 'R1' }),
  useNavigate: () => vi.fn(),
}));
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn() }),
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
  useToggleOptionActive: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateOptionQuantity: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateRunStatus: () => ({ mutate: vi.fn(), isPending: false }),
  useSendToDp: () => ({ mutate: vi.fn(), isPending: false }),
}));

import BuyPlanCategoryViewDetailPage from '@/modules/otb/pages/BuyPlanCategoryViewDetailPage';

function renderPage() {
  return render(
    <TooltipProvider>
      <BuyPlanCategoryViewDetailPage />
    </TooltipProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  h.costingEnabled = true;
  h.runData = null;
});

describe('BuyPlanCategoryViewDetailPage — zero quantity guard (parity)', () => {
  it('shows the "not eligible for costing" banner for an active qty-0 option', () => {
    h.runData = makeRun(makeOption({ quantity: 0, status: 'Pending Costing' }));
    renderPage();

    expect(
      screen.getByText(/Quantity is 0 — not eligible for costing\. Increase quantity or mark this option as inactive\./),
    ).toBeInTheDocument();
  });

  it('disables Send to Costing when an active option has qty 0', () => {
    h.runData = makeRun(makeOption({ quantity: 0, status: 'Pending Costing' }));
    renderPage();

    expect(screen.getByRole('button', { name: /Send to Costing/i })).toBeDisabled();
  });
});
