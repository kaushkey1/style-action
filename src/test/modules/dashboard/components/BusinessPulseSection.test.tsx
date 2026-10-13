import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui';

function makeQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

// Mock Recharts
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PieChart: () => <div data-testid="pie-chart" />,
  Pie: () => null,
  Cell: () => null,
  Tooltip: () => null,
  Legend: () => null,
}));

vi.mock('@/hooks/useMediaQuery', () => ({
  useIsMobile: () => false,
  useIsTouch: () => false,
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useSearchParams: () => [new URLSearchParams(), vi.fn()],
    useLocation: () => ({ pathname: '/', search: '', hash: '', state: null, key: 'default' }),
  };
});

import { BusinessPulseSection } from '@/modules/dashboard/components/BusinessPulseSection';

describe('BusinessPulseSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderWithProvider(ui: React.ReactElement) {
    return render(
      <QueryClientProvider client={makeQueryClient()}>
        <TooltipProvider>{ui}</TooltipProvider>
      </QueryClientProvider>,
    );
  }

  it('renders without crashing with no data', () => {
    renderWithProvider(<BusinessPulseSection />);
  });

  it('displays info message when no pulse data available', () => {
    renderWithProvider(<BusinessPulseSection pulse={null} pulseError={null} />);
    expect(screen.getByText(/Business Pulse data is available when using/i)).toBeInTheDocument();
  });

  it('displays error message when pulse error occurs', () => {
    renderWithProvider(<BusinessPulseSection pulse={null} pulseError="Failed to load data" />);
    expect(screen.getByText(/Business Pulse could not be loaded/i)).toBeInTheDocument();
    expect(screen.getByText('Failed to load data')).toBeInTheDocument();
  });

  it('displays data notice when provided', () => {
    const mockPulse = {
      data_notice: 'Test notice message',
      category_revenue_chart: [],
      revenue_margin_table: [],
      fashion_grade_table: [],
      format_table: [],
      kpi_cards: [],
    };
    renderWithProvider(<BusinessPulseSection pulse={mockPulse} />);
    expect(screen.getByText('Test notice message')).toBeInTheDocument();
  });

  it('renders tables when data is provided', () => {
    const mockPulse = {
      category_revenue_chart: [],
      revenue_margin_table: [{ label: 'Test', value: 100 }],
      fashion_grade_table: [{ grade: 'A0', count: 10 }],
      format_table: [{ format: 'Test Format', revenue: 1000 }],
      kpi_cards: [],
    };
    renderWithProvider(<BusinessPulseSection pulse={mockPulse as Record<string, unknown>} />);
    const tables = screen.getAllByRole('table');
    expect(tables.length).toBeGreaterThan(0);
  });
});
