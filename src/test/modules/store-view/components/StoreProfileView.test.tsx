import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TooltipProvider } from '@/components/ui';
import { StoreProfileView } from '@/modules/store-view/components/StoreProfileView';
import type { StoreIntelligenceDetailResponse } from '@/modules/store-view/api/storeIntelligenceApi';

let isMobile = false;

vi.mock('@/hooks/useMediaQuery', () => ({
  useIsMobile: () => isMobile,
  useIsTouch: () => false,
}));

function renderWithProviders(ui: React.ReactElement) {
  return render(<TooltipProvider>{ui}</TooltipProvider>);
}

const mockApiDetail: StoreIntelligenceDetailResponse = {
  store_id: 'store-001',
  store_name: 'Phoenix Mall Linking Road',
  cluster: 'C1',
  fashionForwardness: 75,
  affluenceScore: 82,
  youthIndex: 68,
  familyIndex: 45,
  destinationScore: 88,
  lfl_2y_cagr_pct: 12.5,
  growth_yoy_pct: 8.3,
  gmrof_rs_per_sft: 850,
  catchment_summary: 'High affluence urban catchment',
  shoppers_summary: 'Young professionals and families',
  demand_summary: 'Strong demand for western wear',
  situation_summary: 'Store performing well',
  last_year_lakhs: 450,
  this_year_lakhs: 520,
  detailed_json_cdn_url: null,
  detailed_analysis_pdf_cdn_url: null,
  analysis_data: null,
  category_demand_profile: [],
  category_best_period_benchmarking: [],
  store_ratings: null,
  competition_analysis: [],
};

const mockApiDetailWithAnalysis: StoreIntelligenceDetailResponse = {
  ...mockApiDetail,
  analysis_data: {
    positioning: {
      statement: 'Premium fashion destination',
      differentiator: 'Curated mix of contemporary and classic styles',
      fashionCoreSplit: { fashion: 70, core: 30 },
    },
    catchmentDeepDive: {
      narrative: 'Urban catchment with high disposable income',
      incomeBands: [
        { band: '10L+', percent: 45, profile: 'High income professionals' },
        { band: '5-10L', percent: 35, profile: 'Mid income families' },
      ],
      culturalProfile: 'Diverse, cosmopolitan',
      shoppingBehavior: 'Frequent, high-value transactions',
      priceSensitivity: 'Low price sensitivity',
    },
    competitiveLandscape: {
      intensityScore: 'HIGH',
      biggestThreat: 'Westside nearby',
      gapsToExploit: 'Premium denim category underserved',
      whatCompetitorsDoBetter: 'Better window displays',
    },
    demandSignals: {
      topCategories: [
        { rank: 1, category: 'Denim', priceRange: '2000-5000', why: 'High growth segment' },
      ],
      underservedCategories: 'Premium athleisure',
      seasonalPatterns: [{ period: 'Q4', pattern: 'Festive spike' }],
      weatherImpact: 'Monsoon affects footfall',
      onlineCompetition: 'Amazon strong in basics',
    },
    categoryMixRecommendation: [
      { category: 'Denim', percent: 25, notes: 'High demand' },
      { category: 'Tops', percent: 30, notes: 'Core category' },
    ],
    priceArchitecture: [
      { band: 'Premium (3000+)', percent: 40, rationale: 'Affluent catchment' },
    ],
    topActions: [
      { title: 'Expand denim', description: 'Add 15% more denim SKUs' },
      { title: 'Improve displays', description: 'Refresh window quarterly' },
    ],
  },
};

describe('StoreProfileView', () => {
  beforeEach(() => {
    isMobile = false;
  });

  describe('empty state', () => {
    it('shows "No profile data available" when apiDetail is null', () => {
      renderWithProviders(<StoreProfileView storeId="store-001" apiDetail={null} />);
      expect(screen.getByText(/no profile data available/i)).toBeInTheDocument();
    });

    it('shows "No profile data available" when apiDetail is undefined', () => {
      renderWithProviders(<StoreProfileView storeId="store-001" />);
      expect(screen.getByText(/no profile data available/i)).toBeInTheDocument();
    });
  });

  describe('basic rendering', () => {
    it('renders store name when apiDetail is provided', () => {
      renderWithProviders(<StoreProfileView storeId="store-001" apiDetail={mockApiDetail} />);
      expect(screen.getByText('Phoenix Mall Linking Road')).toBeInTheDocument();
    });

    it('renders cluster when provided', () => {
      renderWithProviders(<StoreProfileView storeId="store-001" apiDetail={mockApiDetail} />);
      expect(screen.getByText('C1')).toBeInTheDocument();
    });

    it('falls back to storeId when store_name is null', () => {
      const detailWithoutName = { ...mockApiDetail, store_name: null };
      renderWithProviders(<StoreProfileView storeId="store-002" apiDetail={detailWithoutName} />);
      expect(screen.getByText('store-002')).toBeInTheDocument();
    });
  });

  describe('metric cards', () => {
    it('renders Affluence metric card', () => {
      renderWithProviders(<StoreProfileView storeId="store-001" apiDetail={mockApiDetail} />);
      expect(screen.getByText('Affluence')).toBeInTheDocument();
      expect(screen.getByText('82/100')).toBeInTheDocument();
    });

    it('renders Fashion metric card', () => {
      renderWithProviders(<StoreProfileView storeId="store-001" apiDetail={mockApiDetail} />);
      expect(screen.getByText('Fashion')).toBeInTheDocument();
      expect(screen.getByText('75/100')).toBeInTheDocument();
    });

    it('renders Youth metric card', () => {
      renderWithProviders(<StoreProfileView storeId="store-001" apiDetail={mockApiDetail} />);
      expect(screen.getByText('Youth')).toBeInTheDocument();
      expect(screen.getByText('68/100')).toBeInTheDocument();
    });

    it('renders Family metric card', () => {
      renderWithProviders(<StoreProfileView storeId="store-001" apiDetail={mockApiDetail} />);
      expect(screen.getByText('Family')).toBeInTheDocument();
      expect(screen.getByText('45/100')).toBeInTheDocument();
    });

    it('renders Destination metric card', () => {
      renderWithProviders(<StoreProfileView storeId="store-001" apiDetail={mockApiDetail} />);
      expect(screen.getByText('Destination')).toBeInTheDocument();
      expect(screen.getByText('88/100')).toBeInTheDocument();
    });

    it('renders N/A when affluenceScore is null', () => {
      const detailWithNullAffluence = { ...mockApiDetail, affluenceScore: null };
      renderWithProviders(<StoreProfileView storeId="store-001" apiDetail={detailWithNullAffluence} />);
      const affluenceCards = screen.getAllByText('N/A');
      expect(affluenceCards.length).toBeGreaterThan(0);
    });

    it('renders N/A when fashionForwardness is null', () => {
      const detailWithNullFashion = { ...mockApiDetail, fashionForwardness: null };
      renderWithProviders(<StoreProfileView storeId="store-001" apiDetail={detailWithNullFashion} />);
      const naCards = screen.getAllByText('N/A');
      expect(naCards.length).toBeGreaterThan(0);
    });

    it('renders N/A when all metrics are null', () => {
      const detailWithNullMetrics = {
        ...mockApiDetail,
        affluenceScore: null,
        fashionForwardness: null,
        youthIndex: null,
        familyIndex: null,
        destinationScore: null,
      };
      renderWithProviders(<StoreProfileView storeId="store-001" apiDetail={detailWithNullMetrics} />);
      const naCards = screen.getAllByText('N/A');
      expect(naCards.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('NarrativeCard (via StoreProfileView)', () => {
    it('renders Catchment card with title and summary text', () => {
      renderWithProviders(<StoreProfileView storeId="store-001" apiDetail={mockApiDetail} />);
      expect(screen.getByText('Catchment')).toBeInTheDocument();
      expect(screen.getByText('High affluence urban catchment')).toBeInTheDocument();
    });

    it('renders Shoppers card with summary', () => {
      renderWithProviders(<StoreProfileView storeId="store-001" apiDetail={mockApiDetail} />);
      expect(screen.getByText('Shoppers')).toBeInTheDocument();
      expect(screen.getByText('Young professionals and families')).toBeInTheDocument();
    });

    it('renders Demand card with summary', () => {
      renderWithProviders(<StoreProfileView storeId="store-001" apiDetail={mockApiDetail} />);
      expect(screen.getByText('Demand')).toBeInTheDocument();
      expect(screen.getByText('Strong demand for western wear')).toBeInTheDocument();
    });

    it('renders Situation card with summary', () => {
      renderWithProviders(<StoreProfileView storeId="store-001" apiDetail={mockApiDetail} />);
      expect(screen.getByText('Situation')).toBeInTheDocument();
      expect(screen.getByText('Store performing well')).toBeInTheDocument();
    });

    it('shows fallback summary when catchment_summary is null', () => {
      const detailWithNullCatchment = { ...mockApiDetail, catchment_summary: null };
      renderWithProviders(<StoreProfileView storeId="store-001" apiDetail={detailWithNullCatchment} />);
      expect(screen.getByText('Catchment')).toBeInTheDocument();
      expect(screen.getByText(/affluence.*fashion/i)).toBeInTheDocument();
    });

    it('does not show toggle button when narrative is absent', () => {
      isMobile = true;
      renderWithProviders(<StoreProfileView storeId="store-001" apiDetail={mockApiDetail} />);
      expect(screen.queryByLabelText('Collapse narrative')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Expand narrative')).not.toBeInTheDocument();
    });
  });

  describe('DeepResearchSection (via StoreProfileView with analysis_data)', () => {
    it('renders "Run Full Store Analysis" button', () => {
      renderWithProviders(<StoreProfileView storeId="store-001" apiDetail={mockApiDetail} />);
      expect(screen.getByText('Run Full Store Analysis')).toBeInTheDocument();
    });

    it('opens dialog when "Run Full Store Analysis" button is clicked', () => {
      renderWithProviders(<StoreProfileView storeId="store-001" apiDetail={mockApiDetailWithAnalysis} />);

      const button = screen.getByText('Run Full Store Analysis');
      fireEvent.click(button);

      // Dialog should open with title
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Full Store Analysis')).toBeInTheDocument();
    });

    it('shows store name in dialog header', () => {
      renderWithProviders(<StoreProfileView storeId="store-001" apiDetail={mockApiDetailWithAnalysis} />);

      const button = screen.getByText('Run Full Store Analysis');
      fireEvent.click(button);

      // Store name appears in both main view and dialog subtitle
      const storeNameElements = screen.getAllByText('Phoenix Mall Linking Road');
      expect(storeNameElements.length).toBeGreaterThanOrEqual(2);
    });

    it('renders positioning data when analysis_data has positioning', async () => {
      const user = userEvent.setup();
      renderWithProviders(<StoreProfileView storeId="store-001" apiDetail={mockApiDetailWithAnalysis} />);

      const button = screen.getByText('Run Full Store Analysis');
      await user.click(button);

      expect(screen.getByText('Premium fashion destination')).toBeInTheDocument();
      expect(screen.getByText('Curated mix of contemporary and classic styles')).toBeInTheDocument();
    });

    it('renders catchment deep dive section', async () => {
      const user = userEvent.setup();
      renderWithProviders(<StoreProfileView storeId="store-001" apiDetail={mockApiDetailWithAnalysis} />);

      const button = screen.getByText('Run Full Store Analysis');
      await user.click(button);

      expect(screen.getByText('Catchment Deep Dive')).toBeInTheDocument();
      expect(screen.getByText('Urban catchment with high disposable income')).toBeInTheDocument();
    });

    it('renders competitive landscape section', async () => {
      const user = userEvent.setup();
      renderWithProviders(<StoreProfileView storeId="store-001" apiDetail={mockApiDetailWithAnalysis} />);

      const button = screen.getByText('Run Full Store Analysis');
      await user.click(button);

      expect(screen.getByText('Competitive Landscape')).toBeInTheDocument();
      expect(screen.getByText('Westside nearby')).toBeInTheDocument();
    });

    it('renders demand signals section', async () => {
      const user = userEvent.setup();
      renderWithProviders(<StoreProfileView storeId="store-001" apiDetail={mockApiDetailWithAnalysis} />);

      const button = screen.getByText('Run Full Store Analysis');
      await user.click(button);

      expect(screen.getByText('Local Demand Signals')).toBeInTheDocument();
      // "Denim" appears in both demand signals and category mix tables
      const denimElements = screen.getAllByText('Denim');
      expect(denimElements.length).toBeGreaterThanOrEqual(1);
    });

    it('closes dialog when close button is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<StoreProfileView storeId="store-001" apiDetail={mockApiDetailWithAnalysis} />);

      // Open dialog
      const openButton = screen.getByText('Run Full Store Analysis');
      await user.click(openButton);

      expect(screen.getByRole('dialog')).toBeInTheDocument();

      // Close dialog
      const closeButton = screen.getByLabelText('Close');
      await user.click(closeButton);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('shows empty state when analysis_data is null', async () => {
      const user = userEvent.setup();
      renderWithProviders(<StoreProfileView storeId="store-001" apiDetail={mockApiDetail} />);

      const button = screen.getByText('Run Full Store Analysis');
      await user.click(button);

      expect(screen.getByText(/deep research for phoenix mall linking road has not been generated yet/i)).toBeInTheDocument();
    });

    it('calls window.open when download PDF button is clicked with pdf_cdn_url', async () => {
      const user = userEvent.setup();
      const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

      const detailWithPdf = {
        ...mockApiDetail,
        detailed_analysis_pdf_cdn_url: 'https://cdn.example.com/report.pdf',
      };

      renderWithProviders(<StoreProfileView storeId="store-001" apiDetail={detailWithPdf} />);

      const button = screen.getByText('Run Full Store Analysis');
      await user.click(button);

      const downloadButton = screen.getByLabelText('Download as PDF');
      await user.click(downloadButton);

      expect(windowOpenSpy).toHaveBeenCalledWith('https://cdn.example.com/report.pdf', '_blank');

      windowOpenSpy.mockRestore();
    });
  });

  describe('edge cases', () => {
    it('handles empty strings for summary fields', () => {
      const detailWithEmptyStrings = {
        ...mockApiDetail,
        catchment_summary: '',
        shoppers_summary: '',
        demand_summary: '',
        situation_summary: '',
      };

      renderWithProviders(<StoreProfileView storeId="store-001" apiDetail={detailWithEmptyStrings} />);

      // Empty string '' is not nullish, so ?? does not trigger fallback.
      // The component renders empty summaries — section titles still present.
      expect(screen.getByText('Catchment')).toBeInTheDocument();
      expect(screen.getByText('Shoppers')).toBeInTheDocument();
      expect(screen.getByText('Demand')).toBeInTheDocument();
      expect(screen.getByText('Situation')).toBeInTheDocument();
    });

    it('handles missing cluster gracefully', () => {
      const detailWithoutCluster = { ...mockApiDetail, cluster: null };
      renderWithProviders(<StoreProfileView storeId="store-001" apiDetail={detailWithoutCluster} />);

      expect(screen.getByText('Phoenix Mall Linking Road')).toBeInTheDocument();
      expect(screen.queryByText('C1')).not.toBeInTheDocument();
    });

    it('handles decimal metric values by rounding', () => {
      const detailWithDecimals = {
        ...mockApiDetail,
        affluenceScore: 82.7,
        fashionForwardness: 75.3,
      };

      renderWithProviders(<StoreProfileView storeId="store-001" apiDetail={detailWithDecimals} />);

      expect(screen.getByText('83/100')).toBeInTheDocument();
      expect(screen.getByText('75/100')).toBeInTheDocument();
    });
  });
});
