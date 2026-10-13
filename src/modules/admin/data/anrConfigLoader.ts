import type { ANRConfig, ANRConfigData, PullbackTemplate, WorkflowType } from './anrConfigTypes';

// Import all configuration files
import replenishmentConfig from '@/modules/inventory/data/configs/replenishment_configuration.json';
import redistributionConfig from '@/modules/inventory/data/configs/redistribution_configuration.json';
import pullbackBottomSellerConfig from '@/modules/inventory/data/configs/pullback_bottom_seller_configuration.json';
import pullbackBrokenSetConfig from '@/modules/inventory/data/configs/pullback_broken_set_configuration.json';
import pullbackLifecycleCrossedConfig from '@/modules/inventory/data/configs/pullback_lifecycle_crossed_configuration.json';
import pullbackPlanogramOverfillConfig from '@/modules/inventory/data/configs/pullback_planogram_overfill_configuration.json';

// Map workflow types to their configurations
const configMap: Record<WorkflowType, ANRConfig> = {
  core_reordering: {} as ANRConfig,
  cover_days: {} as ANRConfig,
  lifecycle_rotation: {} as ANRConfig,
  liquidation_channels: {} as ANRConfig,
  otb_budget: {} as ANRConfig,
  otb_kpi_formulae: {} as ANRConfig,
  otb_planning: {} as ANRConfig,
  planogram_fill_rate: {} as ANRConfig,
  replenishment: replenishmentConfig as unknown as ANRConfig,
  redistribution: redistributionConfig as unknown as ANRConfig,
  bottom_seller: pullbackBottomSellerConfig as unknown as ANRConfig,
  broken_set: pullbackBrokenSetConfig as unknown as ANRConfig,
  lifecycle_crossed: pullbackLifecycleCrossedConfig as unknown as ANRConfig,
  planogram_overfill: pullbackPlanogramOverfillConfig as unknown as ANRConfig,
};

/**
 * Get all organization IDs for a given workflow type
 */
export function getOrgIds(workflow: WorkflowType): string[] {
  const config = configMap[workflow];
  return Object.keys(config);
}

/**
 * Get configuration for a specific organization and workflow
 */
export function getConfig(workflow: WorkflowType, orgId: string): ANRConfigData | null {
  const config = configMap[workflow];
  return config[orgId] || null;
}

/**
 * Get all organization names mapped to their IDs
 */
export function getOrgNames(workflow: WorkflowType): Record<string, string> {
  const config = configMap[workflow];
  const orgNames: Record<string, string> = {};

  Object.entries(config).forEach(([orgId, data]) => {
    orgNames[orgId] = data.org_name;
  });

  return orgNames;
}

/**
 * Convenience function to get replenishment config
 */
export function getReplenishmentConfig(orgId: string): ANRConfigData | null {
  return getConfig('replenishment', orgId);
}

/**
 * Convenience function to get redistribution config
 */
export function getRedistributionConfig(orgId: string): ANRConfigData | null {
  return getConfig('redistribution', orgId);
}

/**
 * Convenience function to get pullback config by template
 */
export function getPullbackConfig(template: PullbackTemplate, orgId: string): ANRConfigData | null {
  return getConfig(template, orgId);
}

/**
 * Pullback template metadata
 */
export const pullbackTemplates: Array<{
  id: PullbackTemplate;
  label: string;
  description: string;
  badge: 'error' | 'warning' | 'info' | 'success';
}> = [
  {
    id: 'bottom_seller',
    label: 'Bottom Seller',
    description: 'Pulls back lowest-performing options by ROS',
    badge: 'error',
  },
  {
    id: 'broken_set',
    label: 'Broken Set',
    description: 'Pulls back options with incomplete size profiles',
    badge: 'warning',
  },
  {
    id: 'lifecycle_crossed',
    label: 'Lifecycle Crossed',
    description: 'Pulls back items exceeding lifecycle thresholds',
    badge: 'info',
  },
  {
    id: 'planogram_overfill',
    label: 'Planogram Overfill',
    description: 'Pulls back excess stock beyond planogram targets',
    badge: 'success',
  },
];
