import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { L2Panel, L2PanelToggle } from '@/components/layout/L2Panel';
import { getProductById } from '@/data/navigationConfig';
import { useAuthStore } from '@/hooks/useAuthStore';
import { useNavigationStore } from '@/hooks/useNavigationStore';

const cortex = getProductById('cortex')!;
const otb = cortex.l1Modules.find(module => module.id === 'cortex-otb')!;
const buyPlan = cortex.l1Modules.find(module => module.id === 'cortex-buy-plan')!;
let queryClient: QueryClient;

function setReviewVisibility(
  orgId: number,
  showReviewExceptionView?: boolean,
  showCategoryView = true,
  showTestScaleView?: boolean,
) {
  queryClient.setQueryData(['screen-config', orgId], {
    modules: {
      otb: {
        enabled: true,
        features: showReviewExceptionView === undefined ? {} : { show_review_exception_view: showReviewExceptionView },
        config: {},
      },
      buy_plan: {
        enabled: true,
        features: {
          show_category_view: showCategoryView,
          ...(showTestScaleView === undefined ? {} : { show_test_scale_view: showTestScaleView }),
        },
        config: {},
      },
    },
    settings: {},
  });
}

function renderPanel(module = otb) {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[module.route]}>
        <L2Panel activeL1Module={module} />
        <L2PanelToggle activeL1Module={module} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  setReviewVisibility(1, true);
  setReviewVisibility(8, false, false);
  useAuthStore.setState({
    user: null,
    activeOrgId: 1,
    organizations: [
      { orgId: 1, orgName: 'Impetus', orgConfig: { timezone: 'Asia/Kolkata' } },
      { orgId: 8, orgName: 'Superdry', orgConfig: { timezone: 'Asia/Kolkata' } },
    ],
  });
  useNavigationStore.setState({ isL2PanelCollapsed: false });
});

afterEach(() => {
  cleanup();
  queryClient.clear();
});

describe('OTB navigation uses its own review and exception visibility flag', () => {
  it('shows both links when Review and Exception View is enabled for Impetus/FNL', () => {
    renderPanel();

    expect(screen.getByRole('navigation', { name: 'OTB sub-features' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'OTB Review' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Exception Queue' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Collapse sub-features panel' })).toBeInTheDocument();
  });

  it.each([false, true])('hides the panel and toggle for Superdry when collapsed is %s', isL2PanelCollapsed => {
    useAuthStore.setState({ activeOrgId: 8 });
    useNavigationStore.setState({ isL2PanelCollapsed });
    renderPanel();

    expect(screen.queryByRole('navigation', { name: 'OTB sub-features' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('follows the configured flag instead of the organisation name', () => {
    setReviewVisibility(1, false);
    renderPanel();

    expect(screen.queryByRole('navigation', { name: 'OTB sub-features' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('updates when the selected organisation changes', async () => {
    renderPanel();
    expect(screen.getByRole('button', { name: 'OTB Review' })).toBeInTheDocument();

    act(() => useAuthStore.setState({ activeOrgId: 8 }));
    await waitFor(() => expect(screen.queryByRole('button', { name: 'OTB Review' })).not.toBeInTheDocument());
    expect(screen.queryByRole('button', { name: 'Collapse sub-features panel' })).not.toBeInTheDocument();

    act(() => useAuthStore.setState({ activeOrgId: 1 }));
    expect(await screen.findByRole('button', { name: 'OTB Review' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Exception Queue' })).toBeInTheDocument();
  });

  it('updates both the panel and toggle when the backend flag changes', async () => {
    renderPanel();
    act(() => setReviewVisibility(1, false));

    await waitFor(() => expect(screen.queryByRole('button', { name: 'OTB Review' })).not.toBeInTheDocument());
    expect(screen.queryByRole('button', { name: 'Collapse sub-features panel' })).not.toBeInTheDocument();
  });

  it('uses the same default-visible behavior as Category View when the flag is missing', () => {
    setReviewVisibility(1);
    renderPanel();

    expect(screen.getByRole('button', { name: 'OTB Review' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Exception Queue' })).toBeInTheDocument();
  });

  it.each([false, true])('is independent of Category View when OTB visibility is %s', showReviewExceptionView => {
    setReviewVisibility(1, showReviewExceptionView, !showReviewExceptionView);
    renderPanel();

    expect(Boolean(screen.queryByRole('navigation', { name: 'OTB sub-features' }))).toBe(showReviewExceptionView);
    expect(Boolean(screen.queryByRole('button', { name: 'Collapse sub-features panel' }))).toBe(showReviewExceptionView);
  });

  it('preserves other modules sub-navigation when Review and Exception View is disabled', () => {
    setReviewVisibility(8, false, false, true);
    useAuthStore.setState({ activeOrgId: 8 });
    renderPanel(buyPlan);

    expect(screen.getByRole('button', { name: 'Test & Scale' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Collapse sub-features panel' })).toBeInTheDocument();
  });
});

describe('Buy Plan navigation uses its own Test & Scale visibility flag', () => {
  beforeEach(() => {
    setReviewVisibility(1, true, true, false);
    setReviewVisibility(8, false, false, false);
  });

  it.each([
    { orgId: 1, name: 'Impetus/FNL', collapsed: false },
    { orgId: 1, name: 'Impetus/FNL', collapsed: true },
    { orgId: 8, name: 'Superdry', collapsed: false },
    { orgId: 8, name: 'Superdry', collapsed: true },
  ])('hides the panel and toggle for $name when collapsed is $collapsed', ({ orgId, collapsed }) => {
    useAuthStore.setState({ activeOrgId: orgId });
    useNavigationStore.setState({ isL2PanelCollapsed: collapsed });
    renderPanel(buyPlan);

    expect(screen.queryByRole('navigation', { name: 'Buy Plan sub-features' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('can show Test & Scale independently of Category and OTB visibility', () => {
    setReviewVisibility(8, false, false, true);
    useAuthStore.setState({ activeOrgId: 8 });
    renderPanel(buyPlan);

    expect(screen.getByRole('button', { name: 'Test & Scale' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Collapse sub-features panel' })).toBeInTheDocument();
  });

  it('keeps Test & Scale hidden when cached Superdry config does not have the new flag', () => {
    setReviewVisibility(8, false, false);
    useAuthStore.setState({ activeOrgId: 8 });
    renderPanel(buyPlan);

    expect(screen.queryByRole('navigation', { name: 'Buy Plan sub-features' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('keeps Test & Scale hidden before organization config is available', () => {
    useAuthStore.setState({ activeOrgId: null });
    renderPanel(buyPlan);

    expect(screen.queryByRole('navigation', { name: 'Buy Plan sub-features' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('updates the panel and toggle when the backend enables Test & Scale', async () => {
    renderPanel(buyPlan);
    expect(screen.queryByRole('button', { name: 'Test & Scale' })).not.toBeInTheDocument();

    act(() => setReviewVisibility(1, true, true, true));

    expect(await screen.findByRole('button', { name: 'Test & Scale' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Collapse sub-features panel' })).toBeInTheDocument();
  });

  it('preserves FNL OTB navigation when Test & Scale is disabled', () => {
    renderPanel();

    expect(screen.getByRole('button', { name: 'OTB Review' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Exception Queue' })).toBeInTheDocument();
  });
});
