export interface OtbHierarchyLevel {
  column: string;
  label: string;
  filter_type: string;
}

export type OtbFormulaType = 'fnl' | 'rbl';

export type BreakdownType = 'store' | 'channel';
export type PlanningModel = 'monthly' | 'seasonal';

export interface OtbModuleConfig {
  hierarchy: {
    level1: OtbHierarchyLevel;
    level2: OtbHierarchyLevel;
  };
  filters: string[];
  detail_frozen: boolean;
  otb_formula: OtbFormulaType;
  seasonal: boolean;
  planning_model: PlanningModel;
  breakdown_type: BreakdownType;
}

const DEFAULT_OTB_CONFIG: OtbModuleConfig = {
  hierarchy: {
    level1: { column: 'segment', label: 'Segment', filter_type: 'segment' },
    level2: { column: 'family', label: 'Family', filter_type: 'category' },
  },
  filters: ['format', 'segment', 'family'],
  detail_frozen: false,
  otb_formula: 'fnl',
  seasonal: false,
  planning_model: 'monthly',
  breakdown_type: 'store',
};

export function parseOtbConfig(raw: Record<string, unknown> | undefined): OtbModuleConfig {
  if (!raw) return DEFAULT_OTB_CONFIG;

  const hierarchy = raw.hierarchy as OtbModuleConfig['hierarchy'] | undefined;
  const filters = raw.filters as string[] | undefined;
  const detailFrozen = raw.detail_frozen as boolean | undefined;
  const rawH = hierarchy ?? DEFAULT_OTB_CONFIG.hierarchy;
  const h = {
    level1: { ...rawH.level1, label: rawH.level1.column === 'class' ? 'Category' : rawH.level1.label },
    level2: { ...rawH.level2, label: rawH.level2.column === 'brick' ? 'Subcategory' : rawH.level2.label },
  };
  const inferredFormula: OtbFormulaType = h.level1.column === 'class' ? 'rbl' : 'fnl';
  const otbFormula = (raw.otb_formula as OtbFormulaType | undefined) ?? inferredFormula;

  const seasonal = (raw.seasonal as boolean | undefined) ?? DEFAULT_OTB_CONFIG.seasonal;
  const planningModel = (raw.planning_model as PlanningModel | undefined) ?? DEFAULT_OTB_CONFIG.planning_model;
  const breakdownType = (raw.breakdown_type as BreakdownType | undefined) ?? DEFAULT_OTB_CONFIG.breakdown_type;

  return {
    hierarchy: h,
    filters: filters ?? DEFAULT_OTB_CONFIG.filters,
    detail_frozen: detailFrozen ?? DEFAULT_OTB_CONFIG.detail_frozen,
    otb_formula: otbFormula,
    seasonal,
    planning_model: planningModel,
    breakdown_type: breakdownType,
  };
}

export function getOtbSectionTitle(config: OtbModuleConfig): string {
  const l1 = config.hierarchy.level1.label;
  const l2 = config.hierarchy.level2.label;
  return `${l1} / ${l2} OTB Status`;
}

export function getOtbSearchPlaceholder(config: OtbModuleConfig): string {
  const l1 = config.hierarchy.level1.label.toLowerCase();
  const l2 = config.hierarchy.level2.label.toLowerCase();
  return `Search ${l1} or ${l2}...`;
}
