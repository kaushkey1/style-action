import { lazy, Suspense } from 'react';
import { Route } from 'react-router-dom';
import DocsSpacePlanningPage from './pages/DocsSpacePlanningPage';

const DesignSystemPage = lazy(() => import('./pages/DesignSystemPage').then(m => ({ default: m.DesignSystemPage })));

/**
 * Local route extensions — see `route.local.tsx` (gitignored) for personal /
 * sandbox routes a developer wants to register without committing them.
 *
 * `import.meta.glob` returns `{}` when no matching file exists, so this is a
 * zero-impact no-op for any developer who hasn't created a local file.
 * Required `localRoutes` export shape: a `<Route>` element or fragment of
 * <Route> elements.
 */
type LocalRouteModule = { localRoutes?: React.ReactNode };
const localRouteModules = import.meta.glob<LocalRouteModule>('./route.local.tsx', { eager: true });
const localRoutes = Object.values(localRouteModules)
  .map((m) => m.localRoutes)
  .filter((r): r is React.ReactNode => r != null);

export const docsRoutes = (
  <>
    <Route path="/docs/space-planning" element={<DocsSpacePlanningPage />} />
    {import.meta.env.DEV && (
      <>
        <Route
          path="/design-system"
          element={
            <Suspense fallback={<div className="p-4 text-gray-500">Loading Design System...</div>}>
              <DesignSystemPage />
            </Suspense>
          }
        />
        {localRoutes}
      </>
    )}
  </>
);
