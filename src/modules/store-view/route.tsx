import { Route } from 'react-router-dom';
import { StoreViewPage } from './pages/StoreViewPage';
import { StoreDetailPage } from './pages/StoreDetailPage';
import { CompanionAppPage } from './pages/CompanionAppPage';

export const storeViewRoutes = (
  <>
    {/* IP Health Dashboard sub-apps (opened from the store-view front page menu) */}
    <Route path="/command/companion-app" element={<CompanionAppPage />} />
    <Route path="/jarvis/companion-app" element={<CompanionAppPage />} />

    {/* Store Detail — tabbed page. The static `store` segment outranks the generic
        `:viewMode`, so these win over the StoreViewPage routes below. */}
    <Route path="/store-view/store/:storeId" element={<StoreDetailPage />} />
    <Route path="/store-view/store/:storeId/:tab" element={<StoreDetailPage />} />
    <Route path="/command/store-view/store/:storeId" element={<StoreDetailPage />} />
    <Route path="/command/store-view/store/:storeId/:tab" element={<StoreDetailPage />} />

    {/* Command product alias — same component as /store-view/* */}
    <Route path="/command/store-view" element={<StoreViewPage />} />
    <Route path="/command/store-view/:viewMode" element={<StoreViewPage />} />
    <Route path="/command/store-view/:viewMode/:storeId" element={<StoreViewPage />} />
    <Route path="/store-view" element={<StoreViewPage />} />
    <Route path="/store-view/:viewMode" element={<StoreViewPage />} />
    <Route path="/store-view/:viewMode/:storeId" element={<StoreViewPage />} />
  </>
);
