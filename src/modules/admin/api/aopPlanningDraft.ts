import type { Configuration, DraftChange } from '../types/aopAdmin';
import { draftSeasons } from './aopAdminDraft';

export function draftPlanning(config: Configuration, changes: Record<string, DraftChange>): Configuration['planning_settings'] {
  const settings = structuredClone(config.planning_settings);
  for (const change of Object.values(changes)) {
    const op = change.operation;
    if (change.error || op.op !== 'set_setting' || op.section !== 'planning_settings') continue;
    const path = Array.isArray(op.path) ? op.path : op.path.split('.');
    const [field] = path;
    if (field === 'initial_growth_pct' || field === 'max_cell_increase_ratio' || field === 'new_store_gm_fallback_pct') {
      settings[field] = op.value;
    }
  }
  return settings;
}

export function planningErrors(config: Configuration, changes: Record<string, DraftChange>): string[] {
  const errors: string[] = [];
  const seasons = draftSeasons(config, changes);
  const months = seasons.flatMap((season) => season.months);
  if (seasons.length !== 2 || !['AW', 'SS'].every((code) => seasons.some((season) => season.season_code === code))
    || months.length !== 12 || new Set(months).size !== 12) {
    errors.push('AW and SS must cover every month exactly once.');
  }
  let min = config.kpi_settings.growth.warning_min_pct;
  let max = config.kpi_settings.growth.warning_max_pct;
  for (const { operation, error } of Object.values(changes)) {
    if (error || operation.op !== 'set_setting' || operation.section !== 'kpi_settings') continue;
    if (operation.path === 'growth.warning_min_pct') min = operation.value;
    if (operation.path === 'growth.warning_max_pct') max = operation.value;
  }
  if (min !== null && max !== null && min > max) errors.push('Growth warning minimum must not exceed the maximum.');
  return errors;
}
