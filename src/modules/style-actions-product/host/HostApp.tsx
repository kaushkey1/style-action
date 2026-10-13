import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { TooltipProvider } from '@/components/ui';

import { styleActionsProductRoutes } from '../route';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 0, refetchOnWindowFocus: false } } });

/**
 * Minimal dev/test host for the Style Actions product module: the same pages and API client as in
 * the app, without the app shell (which loads third-party scripts and unrelated APIs). Used by the
 * integrated Productflow journeys and Screenflow checks; not part of the production build.
 */
export function HostApp(): React.ReactNode {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <main className="min-h-screen bg-gray-50">
            <Routes>
              {styleActionsProductRoutes}
              <Route path="*" element={<Navigate to="/style-actions-product" replace />} />
            </Routes>
          </main>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
