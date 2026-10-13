import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

interface TenantConfigResponse {
  tenant_id: string;
  modules: Record<string, unknown>;
}

const TENANT_CONFIG_STALE_TIME = 30 * 60 * 1000;

function fetchTenantConfig(): Promise<TenantConfigResponse> {
  return apiFetch<TenantConfigResponse>('/tenant/config');
}

export const tenantConfigKeys = {
  all: ['tenant-config'] as const,
};

export function useTenantConfig(): TenantConfigResponse | undefined {
  const { data } = useQuery({
    queryKey: tenantConfigKeys.all,
    queryFn: fetchTenantConfig,
    staleTime: TENANT_CONFIG_STALE_TIME,
  });
  return data;
}

export function useTenantModuleConfig<T = Record<string, unknown>>(
  module: string,
): T | undefined {
  const config = useTenantConfig();
  if (!config?.modules) return undefined;
  return config.modules[module] as T | undefined;
}
