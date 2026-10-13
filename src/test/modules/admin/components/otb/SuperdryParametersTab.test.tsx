import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui';
import { SuperdryParametersTab } from '@/modules/admin/components/otb/SuperdryParametersTab';
import { updateOtbConfiguration, type OtbConfiguration, type ChannelParams } from '@/modules/admin/api/otbConfigurationApi';
import { useDerivationSummary, type ApiDerivationSummaryRow } from '@/modules/otb/api/otbDashboardApi';

vi.mock('@/modules/admin/api/otbConfigurationApi', () => ({
  updateOtbConfiguration: vi.fn().mockResolvedValue({ version: 2, updated_fields: [] }),
}));
vi.mock('@/modules/otb/api/otbDashboardApi', () => ({
  useDerivationSummary: vi.fn(),
}));
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ success: vi.fn(), info: vi.fn(), error: vi.fn() }),
}));
vi.mock('@/hooks/useAuthStore', () => ({
  useAuthStore: (selector: (s: { user: { email: string } }) => unknown) =>
    selector({ user: { email: 'tester@example.com' } }),
}));

const mockUpdate = vi.mocked(updateOtbConfiguration);
const mockDeriv = vi.mocked(useDerivationSummary);

/** Per-channel OTB Value (buy_lc) weights — EBO dominates (~92%). */
function setWeights(buyLcByChannel: Record<string, number>) {
  const items = Object.entries(buyLcByChannel).map(
    ([channel, buy_lc]) => ({ channel, buy_lc } as ApiDerivationSummaryRow),
  );
  mockDeriv.mockReturnValue({
    data: { items, total_row: null, lc_mrp_multiple: 4.55 },
    isLoading: false,
    isError: false,
  } as unknown as ReturnType<typeof useDerivationSummary>);
}

const SINGLE_CHANNEL: Record<string, ChannelParams> = {
  EBO_Channel: { nsm_pct: 0.9, sell_through_pct: 0.6, nsm_discount_pct: 0.1 },
};

const TWO_CHANNELS: Record<string, ChannelParams> = {
  EBO_Channel: { nsm_pct: 0.9, sell_through_pct: 0.6, nsm_discount_pct: 0.1 },
  Distribution: { nsm_pct: 1.0, sell_through_pct: 1.0, nsm_discount_pct: 0.1 },
};

function makeConfig(channels: Record<string, ChannelParams> = SINGLE_CHANNEL): OtbConfiguration {
  return {
    org_name: 'Superdry',
    planning_model: 'seasonal',
    planning_frequency: null,
    otb_granularity: null,
    calculation_frequency: [],
    lc_mrp_multiple: 4.55,
    nsm_share_pct: 0.55,
    nsm_discount_pct: 0.1,
    sell_through_pct: 0.6,
    min_sell_through_pct: 0.6,
    max_holding_days: null,
    include_partial_devaluation: null,
    constants: {},
    channel_config: { channel_params: channels, exclude_formats: [] },
    aggregation_levels: [],
    plan_aggregation_levels: [],
    inventory_age_filter: {} as OtbConfiguration['inventory_age_filter'],
    devaluation_buckets: [],
    formats_in_scope: [],
    segments_in_scope: [],
    fashion_grades_in_scope: [],
    season_definitions: {},
    target_seasons: [{ code: '0002', name: 'AW', year: 2026 }],
    hit_names_by_frequency: {},
    exclude_kpis: [],
    non_negative_kpis: [],
    filter_rules: [],
    kpi_formulae: {},
    version: 1,
    updated_at: null,
    updated_by: null,
  };
}

function renderTab(config: OtbConfiguration) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <TooltipProvider>
        <SuperdryParametersTab config={config} />
      </TooltipProvider>
    </QueryClientProvider>,
  );
}

describe('SuperdryParametersTab — channel-wise discount %', () => {
  beforeEach(() => {
    mockUpdate.mockClear();
    setWeights({ EBO_Channel: 506_300_000, Distribution: 45_200_000 });
  });

  it('renders a Discount % column with the per-channel value', () => {
    renderTab(makeConfig());
    expect(screen.getByText('Discount %')).toBeInTheDocument();

    // Channel row inputs (within the Channel Parameters table): NSM=90, Discount=10,
    // ST=60, AOP Achievement=0 (unset in the fixture). OSM is derived, not an input.
    const table = screen.getByRole('table');
    const values = within(table)
      .getAllByRole('spinbutton')
      .map((i) => (i as HTMLInputElement).value);
    expect(values).toEqual(['90', '10', '60', '0']);
  });

  it('emits a per-channel nsm_discount_pct change on save', async () => {
    renderTab(makeConfig());
    const table = screen.getByRole('table');
    const rowInputs = within(table).getAllByRole('spinbutton') as HTMLInputElement[];
    const discountInput = rowInputs[1]; // NSM, Discount, Sell-Through, AOP Achievement

    fireEvent.change(discountInput, { target: { value: '15' } });
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => expect(mockUpdate).toHaveBeenCalledTimes(1));
    const [changes] = mockUpdate.mock.calls[0];
    expect(changes).toEqual(
      expect.arrayContaining([
        { json_path: 'channel_config.channel_params.EBO_Channel.nsm_discount_pct', value: 0.15 },
      ]),
    );
  });
});

describe('SuperdryParametersTab — weighted brand-level + threshold', () => {
  beforeEach(() => {
    mockUpdate.mockClear();
    setWeights({ EBO_Channel: 506_300_000, Distribution: 45_200_000 });
  });

  it('shows read-only OTB-share weighted NSM Share, Sell-Through and the threshold', () => {
    renderTab(makeConfig(TWO_CHANNELS));
    // Weighted (EBO ~91.8%, Dist ~8.2%): NSM = .9/.918 + 1/.082 ≈ 91%; ST ≈ 63%.
    expect(screen.getByText('91')).toBeInTheDocument();
    expect(screen.getByText('63')).toBeInTheDocument();
    expect(screen.getByText('Minimum Sell-Through Threshold')).toBeInTheDocument();
  });

  it('persists the weighted nsm_share_pct / sell_through_pct on save', async () => {
    renderTab(makeConfig(TWO_CHANNELS));
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));
    await waitFor(() => expect(mockUpdate).toHaveBeenCalledTimes(1));
    const [changes] = mockUpdate.mock.calls[0];
    const paths = (changes as { json_path: string }[]).map((c) => c.json_path);
    expect(paths).toContain('nsm_share_pct');
    expect(paths).toContain('sell_through_pct');
  });

  it('warns in red and blocks save when weighted sell-through drops below 60%', () => {
    renderTab(makeConfig(TWO_CHANNELS));
    // Rows sorted by label: Distribution first, EBO second. Four inputs per row
    // (NSM, Discount, Sell-Through, AOP Achievement) → EBO sell-through is index 6.
    const table = screen.getByRole('table');
    const inputs = within(table).getAllByRole('spinbutton') as HTMLInputElement[];
    fireEvent.change(inputs[6], { target: { value: '50' } }); // EBO sell-through -> 50%

    expect(screen.getByText(/below the 60% minimum/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save changes/i })).toBeDisabled();
  });
});
