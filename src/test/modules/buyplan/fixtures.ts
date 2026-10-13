import type { RunOptionItem, RunOptionsResponse } from '@/modules/otb/api/buyPlanApi';

/** A delivery date safely in the future (avoids past-date validation). */
export const FUTURE_DATE = new Date(Date.now() + 60 * 864e5).toISOString().split('T')[0] ?? '';

export function makeOption(overrides: Partial<RunOptionItem> = {}): RunOptionItem {
  return {
    id: 1,
    option_code: 'O1',
    color: 'BLACK',
    is_enabled: true,
    status: 'Pending Costing',
    drop_number: 1,
    mrp: 999,
    cost_price: 0,
    quantity: 5,
    expected_margin: 40,
    actual_margin: 40,
    intake_margin: 0,
    net_intake_margin: 0,
    revenue: 0,
    fabric: null,
    fit: null,
    pattern: null,
    pattern_type: null,
    length: null,
    neck_type: null,
    weave: null,
    sleeve: null,
    waist: null,
    wash: null,
    stores: 0,
    sizes: '',
    delivery_date: null,
    comments: null,
    image_urls: null,
    ...overrides,
  };
}

export function makeRun(option: RunOptionItem): RunOptionsResponse {
  return {
    run_id: 'R1',
    buy_plan_id: 'BP-1',
    buy_plan_display_id: 'BP-1',
    status: 'draft',
    kpi: {
      active_options: option.is_enabled ? 1 : 0,
      total_options: 1,
      total_quantity: option.quantity,
      expected_revenue: 0,
      otb_used: 0,
      otb_total: 1000,
      otb_used_percentage: 0,
      avg_nim: 0,
    },
    styles: [
      {
        style_code: 'S1',
        style_description: 'STYLE ONE',
        total_options: 1,
        active_options: option.is_enabled ? 1 : 0,
        gim: 0,
        nim: 0,
        options: [option],
      },
    ],
  };
}
