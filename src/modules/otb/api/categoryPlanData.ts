import type { BPStage, BuyPlanOption as MockOption } from '../data/mockBuyingModuleV2';
import type { CategoryRun, PlanGroup, PlanMonth, PlanOption } from './categoryBuyPlanApi';

export type BuyPlanOption = Omit<MockOption, 'mrp' | 'cost' | 'intakeMarginPct' | 'plannerQty'> & {
  mrp: number | null;
  cost: number | null;
  intakeMarginPct: number | null;
  plannerQty: number | null;
  storeCount: number;
  daysOfCover: number;
  otbValue: number | null;
  source: PlanOption;
};

export function planPath(month?: string, category?: string, subcategory?: string, brick?: string, runId?: string) {
  let path = `/buy-plans/month/${encodeURIComponent(month ?? '')}`;
  if (category) path += `/category/${encodeURIComponent(category)}`;
  if (subcategory) path += `/sub/${encodeURIComponent(subcategory)}`;
  if (brick) path += `/brick/${encodeURIComponent(brick)}`;
  return runId ? `${path}?run=${encodeURIComponent(runId)}` : path;
}

export const toStage = (stage: string) => stage as BPStage;
export const numberText = (value: number | null | undefined, digits?: number) =>
  value == null ? '-' : digits === undefined ? value.toLocaleString() : value.toFixed(digits);
export const moneyText = (value: number | null | undefined) => value == null ? '-' : `₹${value.toLocaleString()}`;
export const lakhText = (value: number | null | undefined) => value == null ? '-' : `₹${(value / 100000).toFixed(1)}L`;

export function toMonth(row: PlanMonth) {
  return { saleMonth: row.sale_month.slice(0, 7), runId: row.run_id,
    label: new Date(`${row.sale_month.slice(0, 7)}-01T00:00:00`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
    year: Number(row.sale_month.slice(0, 4)), stage: toStage(row.stage), categories: row.category_count,
    optionsTotal: row.option_count, flaggedCount: null, heldCount: row.held_count, otbValue: row.otb_value };
}

export function toCategory(row: PlanGroup, run: CategoryRun) {
  return { code: row.code, name: row.name, stage: toStage(run.stage), optionsCount: row.option_count,
    heldCount: row.held_count, otbValue: row.otb_value, totalSysQty: row.total_quantity,
    subcategories: (row.children ?? []).map(child => toSubcategory(child, run)) };
}

export function toSubcategory(row: PlanGroup, run: CategoryRun) {
  return { code: row.code, name: row.name, stage: toStage(run.stage), bricks: row.children ?? [],
    brickCount: row.brick_count ?? row.children?.length ?? 0, optionsCount: row.option_count,
    sysBuyQty: row.total_quantity, heldCount: row.held_count, flaggedCount: null };
}

export function toBrick(row: PlanGroup) {
  return { code: row.code, name: row.name, optionsCount: row.option_count, sysBuyQty: row.total_quantity,
    plannerQty: null, heldCount: row.held_count };
}

export function toOption(row: PlanOption, run: CategoryRun): BuyPlanOption {
  const a = row.attributes;
  const control = (value: string) => value === 'pass' ? 'pass' as const : value === 'fail' ? 'fail' as const : 'warn' as const;
  return { code: row.code, segment: row.fashion_grade, family: a.family ?? '-', class_name: a.class_name ?? '-',
    brand: a.brand ?? '-', neckType: a.neck_type ?? '-', sleeveType: a.sleeve ?? '-', fit: a.fit ?? '-',
    fabric: a.fabric ?? '-', pattern: a.pattern ?? '-', mrp: a.mrp, cost: a.cost,
    intakeMarginPct: a.intake_margin === null ? null : a.intake_margin * 100,
    trueRos: row.true_ros, fwdRos: row.forward_ros, sysBuyQty: row.total_quantity, calcQty: row.total_quantity,
    plannerQty: null, ctl01: control(row.ctl01), ctl02: control(row.ctl02), ctl03: control(row.ctl03),
    status: row.held_count > 0 ? 'held' : a.is_new_option ? 'new_option' : 'ready',
    isNewOption: a.is_new_option, brickCode: row.brick, styleId: a.style_id ?? row.code,
    colorName: a.color ?? undefined, imageUrl: a.image_url ?? undefined,
    storeCount: row.store_count, daysOfCover: run.parameters.days_of_cover, otbValue: row.otb_value, source: row };
}

export function controlReason(option: BuyPlanOption, id: string) {
  const reasons = option.source.controls?.filter(c => c.id === id && c.status === 'fail')
    .map(c => c.reason?.toLowerCase().replaceAll('_', ' ')).filter(Boolean);
  return reasons?.length ? [...new Set(reasons)].join('; ') : 'Control check failed';
}
