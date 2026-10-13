import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OTBDerivationSummaryModal } from '@/modules/otb/components/OTBDerivationSummaryModal';
import { useDerivationSummary, type DerivationSummaryResponse } from '@/modules/otb/api/otbDashboardApi';

vi.mock('@/modules/otb/api/otbDashboardApi', () => ({
  useDerivationSummary: vi.fn(),
}));

const mockUseDerivationSummary = vi.mocked(useDerivationSummary);

function makeRow(overrides: Partial<DerivationSummaryResponse['items'][number]>) {
  return {
    channel: 'EBO_Channel',
    is_total: false,
    gsv: 0,
    nsm_gsv: 0,
    mrp: 0,
    buy_mrp: 0,
    buy_lc: 0,
    buy_units: 0,
    nsm_mix_pct: 0,
    fp_st_pct: 0,
    ...overrides,
  };
}

function setHook(value: Partial<ReturnType<typeof useDerivationSummary>>) {
  mockUseDerivationSummary.mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: false,
    ...value,
  } as ReturnType<typeof useDerivationSummary>);
}

describe('OTBDerivationSummaryModal', () => {
  beforeEach(() => {
    mockUseDerivationSummary.mockReset();
  });

  it('renders the per-channel table with grand total and OTB reconciliation', () => {
    const data: DerivationSummaryResponse = {
      items: [
        makeRow({ channel: 'EBO_Channel', buy_lc: 506_300_000, buy_units: 417_807, nsm_mix_pct: 90, fp_st_pct: 60 }),
        makeRow({ channel: 'Distribution', buy_lc: 45_200_000, buy_units: 44_180, nsm_mix_pct: 100, fp_st_pct: 100 }),
      ],
      total_row: makeRow({ channel: 'Grand Total', is_total: true, buy_lc: 620_500_000, buy_units: 534_012, nsm_mix_pct: 72.5, fp_st_pct: 86.08 }),
      lc_mrp_multiple: 4.55,
      aging_inventory_value: 47_300_000, // 4.73 Cr
    };
    setHook({ data });

    render(<OTBDerivationSummaryModal isOpen onClose={() => {}} season="AW" />);

    expect(screen.getByText('OTB Derivation Summary')).toBeInTheDocument();
    expect(screen.getByText('Grand Total')).toBeInTheDocument();
    // 620,500,000 rupees -> 62.05 Cr headline reconciliation
    expect(screen.getByText(/OTB \(Total Buy at Landed Cost\) = ₹62\.05 Cr/)).toBeInTheDocument();
    // aging inventory line shown above the OTB caption (47,300,000 -> 4.73 Cr)
    expect(screen.getByText(/Aging Inventory \(older than 6 seasons\) = ₹4\.73 Cr/)).toBeInTheDocument();
  });

  it('shows a loading state', () => {
    setHook({ isLoading: true });
    render(<OTBDerivationSummaryModal isOpen onClose={() => {}} />);
    expect(screen.queryByText('Grand Total')).not.toBeInTheDocument();
  });

  it('shows an empty state when there are no rows', () => {
    setHook({ data: { items: [], total_row: null, lc_mrp_multiple: 0, aging_inventory_value: 0 } });
    render(<OTBDerivationSummaryModal isOpen onClose={() => {}} />);
    expect(screen.getByText('No derivation data')).toBeInTheDocument();
  });
});
