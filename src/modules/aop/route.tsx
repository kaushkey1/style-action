import { Route } from "react-router-dom";
import { AOPDashboardPage } from "./pages/AOPDashboardPage";
import { AOPStoreDetailPage } from "./pages/AOPStoreDetailPage";
import { AOPStorePerformancePage } from "./pages/AOPStorePerformancePage";

export const aopRoutes = (
  <>
    {/* Command product routes */}
    <Route path="/command/aop" element={<AOPDashboardPage />} />
    {/* Variance Tracker merged into the converged page — opens with variance pre-on */}
    <Route path="/command/aop/variance-tracker" element={<AOPDashboardPage initialVariance />} />
    <Route path="/command/aop/store/:storeId" element={<AOPStoreDetailPage />} />
    <Route path="/command/aop/store-performance/:storeId" element={<AOPStorePerformancePage />} />
    {/* Legacy /aop aliases */}
    <Route path="/aop" element={<AOPDashboardPage />} />
    <Route path="/aop/variance-tracker" element={<AOPDashboardPage initialVariance />} />
    <Route path="/aop/store/:storeId" element={<AOPStoreDetailPage />} />
    <Route path="/aop/store-performance/:storeId" element={<AOPStoreDetailPage />} />
  </>
);
