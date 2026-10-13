import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ConsoleSidebar } from '@/components/layout/ConsoleSidebar';
import { MobileSplitDrawer } from '@/components/layout/MobileSplitDrawer';
import { TooltipProvider } from '@/components/ui';
import { getProductById } from '@/data/navigationConfig';
import { searchIndex } from '@/data/searchIndex';
import { useAuthStore } from '@/hooks/useAuthStore';
import { useMobileSearch } from '@/hooks/useMobileSearch';
import { useNavigationStore } from '@/hooks/useNavigationStore';
import { ConsoleHomePage } from '@/modules/dashboard/pages/ConsoleHomePage';

vi.mock('@/modules/dashboard/components/MyTasksSection', () => ({ MyTasksSection: () => null }));

const plan = getProductById('cortex')!;
const poReviewSearchItem = searchIndex.find(item => item.id === 'cortex-po-review')!;
let queryClient: QueryClient;

function setVisibility(orgId: number, enabled?: boolean) {
  queryClient.setQueryData(['screen-config', orgId], {
    modules: {
      ...(enabled === undefined ? {} : { po_review: { enabled, features: {}, config: {} } }),
      buy_plan: {
        enabled: true,
        features: {
          show_test_scale_view: false,
          show_category_view: false,
        },
        config: {},
      },
    },
    settings: {},
  });
}

function Wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/buy-plans']}>
        <TooltipProvider>{children}</TooltipProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  setVisibility(1, true);
  setVisibility(17, false);
  useAuthStore.setState({
    user: null,
    activeOrgId: 1,
    activeRoleSlug: null,
    availableRoles: [],
    organizations: [
      { orgId: 1, orgName: 'Impetus', orgConfig: { timezone: 'Asia/Kolkata' } },
      { orgId: 17, orgName: 'Superdry', orgConfig: { timezone: 'Asia/Kolkata' } },
    ],
  });
  useNavigationStore.setState({ activeProductId: 'cortex' });
  localStorage.removeItem('impetus-recent-searches');
});

afterEach(() => {
  cleanup();
  queryClient.clear();
  localStorage.removeItem('impetus-recent-searches');
});

describe.each(['desktop', 'mobile', 'home'] as const)('PO Review in %s navigation', surface => {
  async function renderNavigation() {
    render(
      surface === 'desktop' ? <ConsoleSidebar mode="l1" activeProduct={plan} />
        : surface === 'mobile' ? <MobileSplitDrawer isOpen onClose={vi.fn()} />
          : <ConsoleHomePage />,
      { wrapper: Wrapper },
    );
    if (surface === 'mobile') fireEvent.click(screen.getByRole('button', { name: 'Plan', exact: true }));
    expect(await screen.findByRole('button', { name: 'Buy Plan', exact: true })).toBeInTheDocument();
  }

  it('keeps PO Review visible for FNL independently of the other Buy Plan flags', async () => {
    await renderNavigation();
    expect(screen.getByRole('button', { name: 'PO Review', exact: true })).toBeInTheDocument();
  });

  it('hides PO Review for Superdry', async () => {
    useAuthStore.setState({ activeOrgId: 17 });
    await renderNavigation();
    expect(screen.queryByRole('button', { name: 'PO Review', exact: true })).not.toBeInTheDocument();
  });

  it('hides PO Review when an older cached config has no PO Review module', async () => {
    setVisibility(1);
    await renderNavigation();
    expect(screen.queryByRole('button', { name: 'PO Review', exact: true })).not.toBeInTheDocument();
  });

  it('updates when switching between FNL and Superdry', async () => {
    await renderNavigation();
    expect(screen.getByRole('button', { name: 'PO Review', exact: true })).toBeInTheDocument();
    act(() => useAuthStore.setState({ activeOrgId: 17 }));
    await waitFor(() => expect(screen.queryByRole('button', { name: 'PO Review', exact: true })).not.toBeInTheDocument());
    act(() => useAuthStore.setState({ activeOrgId: 1 }));
    expect(await screen.findByRole('button', { name: 'PO Review', exact: true })).toBeInTheDocument();
  });
});

describe('PO Review search visibility', () => {
  it('filters search results and recent items when switching to Superdry', async () => {
    localStorage.setItem('impetus-recent-searches', JSON.stringify([poReviewSearchItem]));
    const { result } = renderHook(() => useMobileSearch(), { wrapper: Wrapper });
    act(() => result.current.setQuery('PO Review'));
    await waitFor(() => expect(result.current.results.map(item => item.id)).toContain('cortex-po-review'));
    expect(result.current.recentSearches.map(item => item.id)).toContain('cortex-po-review');

    act(() => useAuthStore.setState({ activeOrgId: 17 }));
    await waitFor(() => {
      expect(result.current.results.map(item => item.id)).not.toContain('cortex-po-review');
      expect(result.current.recentSearches.map(item => item.id)).not.toContain('cortex-po-review');
    });

    act(() => useAuthStore.setState({ activeOrgId: 1 }));
    await waitFor(() => expect(result.current.recentSearches.map(item => item.id)).toContain('cortex-po-review'));
  });
});
