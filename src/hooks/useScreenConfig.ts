import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useAuthStore } from '@/hooks/useAuthStore';
import { appApiFetch } from '@/lib/api';
import { setFormattingConfig } from '@/lib/utils';

interface SidebarItem {
  key: string;
  label: string;
  icon: string;
  path: string;
}

interface ModuleConfig {
  enabled: boolean;
  features: Record<string, boolean>;
  config: Record<string, unknown>;
}

interface ScreenConfig {
  tenant_id: string;
  org_id: string;
  hiruzen_org_id: string;
  db_schema: string;
  sidebar: SidebarItem[];
  modules: Record<string, ModuleConfig>;
  components: Record<string, Record<string, unknown>>;
  settings: Record<string, unknown>;
}

const SCREEN_CONFIG_STALE_TIME = 30 * 60 * 1000;

async function fetchScreenConfig(orgId: number): Promise<ScreenConfig> {
  return appApiFetch<ScreenConfig>('/orgconfig/resolve-org', { org_id: orgId });
}

const screenConfigKeys = {
  all: ['screen-config'] as const,
  org: (orgId: number) => [...screenConfigKeys.all, orgId] as const,
};

export function useScreenConfig(): ScreenConfig | undefined {
  const activeOrgId = useAuthStore((s) => s.activeOrgId);

  const { data } = useQuery({
    queryKey: screenConfigKeys.org(activeOrgId ?? 0),
    queryFn: () => fetchScreenConfig(activeOrgId!),
    staleTime: SCREEN_CONFIG_STALE_TIME,
    enabled: activeOrgId !== null,
  });

  useEffect(() => {
    const locale = (data?.settings?.locale as string) ?? 'en-IN';
    const currency = (data?.settings?.currency as string) ?? 'INR';
    setFormattingConfig(locale, currency);
    if (data?.tenant_id && data?.org_id) {
      const store = useAuthStore.getState();
      if (store.tenantId !== data.tenant_id || store.resolvedOrgId !== data.org_id
          || store.locale !== locale || store.currency !== currency) {
        useAuthStore.getState().setTenantInfo(data.tenant_id, data.org_id, locale, currency);
      }
    }
  }, [data]);

  return data;
}

export function useModuleEnabled(module: string, defaultValue = true): boolean {
  const config = useScreenConfig();
  if (!config) return defaultValue;
  const mod = config.modules[module];
  if (!mod) return defaultValue;
  return mod.enabled ?? defaultValue;
}

export function useFeatureFlag(module: string, flag: string, defaultValue = true): boolean {
  const config = useScreenConfig();
  if (!config) return defaultValue;
  const mod = config.modules[module];
  if (!mod) return defaultValue;
  const val = mod.features[flag];
  if (val === undefined) return defaultValue;
  return val;
}

export function useModuleConfig<T = Record<string, unknown>>(module: string): T | undefined {
  const config = useScreenConfig();
  if (!config) return undefined;
  const mod = config.modules[module];
  if (!mod) return undefined;
  return mod.config as T;
}

export function useComponentConfig(key: string): Record<string, unknown> | undefined {
  const config = useScreenConfig();
  if (!config) return undefined;
  return config.components[key];
}

export function useSidebarItems(): SidebarItem[] | undefined {
  const config = useScreenConfig();
  return config?.sidebar;
}

export function useOrgSettings(): { locale: string; currency: string } {
  const config = useScreenConfig();
  return {
    locale: (config?.settings?.locale as string) ?? 'en-IN',
    currency: (config?.settings?.currency as string) ?? 'INR',
  };
}
