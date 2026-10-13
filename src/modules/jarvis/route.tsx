import { Route, Navigate } from 'react-router-dom';
import { ModuleHub } from './pages/ModuleHub';
import { CustomerExperienceModule } from './pages/CustomerExperienceModule';
import { StoreViewPage } from '@/modules/store-view/pages/StoreViewPage';
import { StoreDetailPage } from '@/modules/store-view/pages/StoreDetailPage';

export const jarvisRoutes = (
  <>
    <Route path="/jarvis" element={<ModuleHub />} />
    <Route path="/jarvis/customer-experience" element={<CustomerExperienceModule />} />
    <Route path="/jarvis/customer-experience/*" element={<CustomerExperienceModule />} />
    <Route path="/jarvis/store-view/store/:storeId" element={<StoreDetailPage />} />
    <Route path="/jarvis/store-view/store/:storeId/:tab" element={<StoreDetailPage />} />
    <Route path="/jarvis/store-view" element={<StoreViewPage />} />
    <Route path="/jarvis/store-view/:viewMode" element={<StoreViewPage />} />
    <Route path="/jarvis/store-view/:viewMode/:storeId" element={<StoreViewPage />} />
    <Route path="/jarvis/store-readiness" element={<Navigate to="/jarvis" replace />} />
    <Route path="/jarvis/churn-prediction" element={<Navigate to="/jarvis" replace />} />
  </>
);
