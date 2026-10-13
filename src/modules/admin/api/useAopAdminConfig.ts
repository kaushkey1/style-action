import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/hooks/useAuthStore';
import { aopAdminApi } from './aopAdminApi';

export function useAopAdminContext(): { tenantId: string | null; orgId: string | null; key: readonly (string | null)[] } {
  const tenantId = useAuthStore((state) => state.tenantId);
  const orgId = useAuthStore((state) => state.resolvedOrgId);
  return { tenantId, orgId, key: ['aop-admin', tenantId, orgId] as const };
}

export function useAopAdminConfig(): ReturnType<typeof useQuery<import('../types/aopAdmin').ConfigResponse>> {
  const context = useAopAdminContext();
  return useQuery({
    queryKey: [...context.key, 'config'], queryFn: aopAdminApi.config,
    enabled: !!context.tenantId && !!context.orgId, staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}
