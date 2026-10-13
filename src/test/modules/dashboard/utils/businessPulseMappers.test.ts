import { describe, it, expect } from 'vitest';
import {
  computeNetRevenueTotal,
  mapRevenueMarginTable,
  mapFashionGradeTable,
} from '@/modules/dashboard/utils/businessPulseMappers';
import type {
  BusinessPulseResponse,
  BusinessPulseFormatRow,
  BusinessPulseRevenueMarginRow,
  BusinessPulseFashionGradeRow,
} from '@/modules/dashboard/api/dashboardApi';

function makePulse(
  overrides: Partial<BusinessPulseResponse> = {},
): BusinessPulseResponse {
  return {
    kpi_cards: [],
    monthly_revenue_chart: [],
    category_revenue_chart: [],
    revenue_margin_table: [],
    fashion_grade_table: [],
    format_table: [],
    revenue_snapshot: [],
    ...overrides,
  };
}

function formatRow(totalNetSales: number): BusinessPulseFormatRow {
  return {
    FORMAT_DESC_STD: 'TRENDS',
    total_net_sales: totalNetSales,
    margin_pct: 40,
    total_units_sold: 0,
    store_count: 0,
  };
}

function marginRow(revenue: number): BusinessPulseRevenueMarginRow {
  return { name: 'MEN APPAREL', revenue };
}

describe('computeNetRevenueTotal', () => {
  it('sums format_table.total_net_sales when present', () => {
    const pulse = makePulse({
      format_table: [formatRow(600_000_000), formatRow(316_000_000)],
      // present but ignored because format_table already yields a positive total
      revenue_margin_table: [marginRow(1)],
    });
    expect(computeNetRevenueTotal(pulse)).toBe(916_000_000);
  });

  it('falls back to revenue_margin_table.revenue when format_table is empty', () => {
    const pulse = makePulse({
      format_table: [],
      revenue_margin_table: [marginRow(500), marginRow(416)],
    });
    expect(computeNetRevenueTotal(pulse)).toBe(916);
  });

  it('ignores non-finite values in the sum', () => {
    const pulse = makePulse({
      format_table: [
        formatRow(100),
        {
          FORMAT_DESC_STD: 'X',
          total_net_sales: Number.NaN,
          margin_pct: 0,
          total_units_sold: 0,
          store_count: 0,
        },
      ],
    });
    expect(computeNetRevenueTotal(pulse)).toBe(100);
  });

  it('returns 0 when both tables are empty', () => {
    expect(computeNetRevenueTotal(makePulse())).toBe(0);
  });
});

describe('mapRevenueMarginTable — Gross Revenue column', () => {
  function marginRow(
    overrides: Partial<BusinessPulseRevenueMarginRow> = {},
  ): BusinessPulseRevenueMarginRow {
    return {
      name: '1. MEN APPAREL',
      subcategory_desc: '4. SHIRTS',
      revenue: 5_000_000_000,
      gm_pct: 42,
      sell_through_pct: 15,
      aged_inv_pct: 20,
      fresh_pct: 60,
      ...overrides,
    };
  }

  it('renders an em-dash in the Gross Revenue cell when the API omits it', () => {
    const rows = mapRevenueMarginTable([marginRow()]);
    // values[0] is the Gross Revenue cell (column inserted before Net Revenue).
    expect(rows[0]?.values[0]).toBe('—');
  });

  it('renders a formatted ₹ value when gross_revenue is present', () => {
    const rows = mapRevenueMarginTable([marginRow({ gross_revenue: 6_000_000_000 })]);
    expect(rows[0]?.values[0]).toMatch(/^₹/);
  });
});

describe('mapFashionGradeTable — Gross Revenue column', () => {
  function gradeRow(
    overrides: Partial<BusinessPulseFashionGradeRow> = {},
  ): BusinessPulseFashionGradeRow {
    return {
      fashion_grade_bucket: 'FASHION',
      revenue: 6_000_000_000,
      gm_pct: 42.9,
      mix_pct: 67.7,
      sell_through_pct: 14,
      aged_pct: 24,
      markdown_pct: -0.02,
      ...overrides,
    };
  }

  it('inserts a Gross Revenue header before Net Revenue', () => {
    const config = mapFashionGradeTable([gradeRow()]);
    expect(config.headers[1]).toBe('Gross Revenue');
    expect(config.headers[2]).toBe('Net Revenue');
  });

  it('renders an em-dash in the Gross Revenue cell when the API omits it', () => {
    const config = mapFashionGradeTable([gradeRow()]);
    expect(config.rows[0]?.[1]).toBe('—');
  });

  it('renders a formatted ₹ value when gross_revenue is present', () => {
    const config = mapFashionGradeTable([gradeRow({ gross_revenue: 7_000_000_000 })]);
    expect(config.rows[0]?.[1]).toMatch(/^₹/);
  });
});
