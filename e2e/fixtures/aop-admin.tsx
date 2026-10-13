import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { TooltipProvider } from '../../src/components/ui';
import { AdminAOPConfigPage } from '../../src/modules/admin/pages/AdminAOPConfigPage';
import { useAuthStore } from '../../src/hooks/useAuthStore';
import '../../src/index.css';

// Browser-test entry only: all API responses are intercepted by the spec.
useAuthStore.setState({ tenantId: 'tenant', resolvedOrgId: 'org' });
const container = document.getElementById('root');
if (!container) throw new Error('Missing browser-test root');
createRoot(container).render(<MemoryRouter>
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <TooltipProvider><main className="p-4"><AdminAOPConfigPage /></main></TooltipProvider>
  </QueryClientProvider>
</MemoryRouter>);
