import { Route } from 'react-router-dom';
import { OTBDashboardPage } from './pages/OTBDashboardPage';
import { OTBPodDetailPage } from './pages/OTBPodDetailPage';
import { OTBCalculationSheetPage } from './pages/OTBCalculationSheetPage';
import { OTBCategoryPage } from './pages/OTBCategoryPage';
import { OTBCategoryDetailPage } from './pages/OTBCategoryDetailPage';
import { OTBCategoryCalcSheetPage } from './pages/OTBCategoryCalcSheetPage';
import { ChaseManagerPage } from './pages/ChaseManagerPage';
import { MicroDropManagerPage } from './pages/MicroDropManagerPage';
import { OTBUtilizationPage } from './pages/OTBUtilizationPage';
import { OTBChannelDetailPage } from './pages/OTBChannelDetailPage';
import { OTBCategoryKpiDetailPage } from './pages/OTBCategoryKpiDetailPage';
import { BuyPlanV3Page } from './pages/BuyPlanV3Page';
import { BuyPlanDetailV3 } from './pages/BuyPlanDetailV3';
import BuyPlanCategoryPage from './pages/BuyPlanCategoryPage';
import BuyPlanOptionsDetailPage from './pages/BuyPlanOptionsDetailPage';
import { DistributionPlanPage } from './pages/DistributionPlanPage';
import { DistributionPlanDetailPageV5 } from './pages/DistributionPlanDetailPageV5';
import DistributionPlanBrandView from './pages/DistributionPlanBrandView';
import DistributionPlanFashionGradePage from './pages/DistributionPlanFashionGradePage';
import DistributionPlanCategoryDetailPage from './pages/DistributionPlanCategoryDetailPage';
import BuyPlanBrandDetailPage from './pages/BuyPlanBrandDetailPage';
import BuyPlanCategoryViewDetailPage from './pages/BuyPlanCategoryViewDetailPage';
import BuyPlanCategoryListPage from './pages/BuyPlanCategoryListPage';
import BuyPlanSubcategoryPage from './pages/BuyPlanSubcategoryPage';
import BuyPlanBrickPage from './pages/BuyPlanBrickPage';
import BuyPlanOptionsWorkbenchPage from './pages/BuyPlanOptionsWorkbenchPage';
import OTBMonthListPage from './pages/OTBMonthListPage';
import OTBCategoryReviewPage from './pages/OTBCategoryReviewPage';
import ExceptionQueuePage from './pages/ExceptionQueuePage';
import TestScalePage from './pages/TestScalePage';
import POReviewPage from './pages/POReviewPage';

export const otbRoutes = (
  <>
    <Route path="/otb" element={<OTBDashboardPage />} />
    <Route path="/otb/pod/:podId" element={<OTBPodDetailPage />} />
    <Route path="/otb/pod/:podId/sheet/:otbId" element={<OTBCalculationSheetPage />} />
    <Route path="/otb/category" element={<OTBCategoryPage />} />
    <Route path="/otb/category/:categoryId" element={<OTBCategoryDetailPage />} />
    <Route path="/otb/category/:categoryId/detail/:otbId" element={<OTBCategoryCalcSheetPage />} />
    <Route path="/otb/channel/:format" element={<OTBChannelDetailPage />} />
    <Route path="/otb/category-detail/:categoryId" element={<OTBCategoryKpiDetailPage />} />
    <Route path="/otb/core-noos" element={<ChaseManagerPage />} />
    <Route path="/otb/fashion" element={<MicroDropManagerPage />} />
    <Route path="/otb/utilization" element={<OTBUtilizationPage />} />
    <Route path="/otb/review" element={<OTBMonthListPage />} />
    <Route path="/otb/review/:saleMonth" element={<OTBCategoryReviewPage />} />
    {/* Buy Plans — specific deep routes MUST come before generic /:id catch-all */}
    <Route path="/buy-plans/options/:id" element={<BuyPlanOptionsDetailPage />} />
    <Route path="/buy-plans/brand/:id" element={<BuyPlanBrandDetailPage />} />
    <Route path="/buy-plans/category/:id" element={<BuyPlanCategoryViewDetailPage />} />
    {/* Buying category-view drill-down. Namespaced under /month/ so it cannot
        shadow the single-segment /buy-plans/:id route below — without this,
        BuyPlanDetailV3 becomes permanently unreachable. */}
    <Route path="/buy-plans/month/:saleMonth/category/:catCode/sub/:subCode/brick/:brickCode" element={<BuyPlanOptionsWorkbenchPage />} />
    <Route path="/buy-plans/month/:saleMonth/category/:catCode/sub/:subCode" element={<BuyPlanBrickPage />} />
    <Route path="/buy-plans/month/:saleMonth/category/:catCode" element={<BuyPlanSubcategoryPage />} />
    <Route path="/buy-plans/month/:saleMonth" element={<BuyPlanCategoryListPage />} />
    <Route path="/buy-plans" element={<BuyPlanCategoryPage />} />
    <Route path="/buy-plans-v3" element={<BuyPlanV3Page />} />
    <Route path="/buy-plans/:id" element={<BuyPlanDetailV3 />} />
    <Route path="/otb/exceptions" element={<ExceptionQueuePage />} />
    <Route path="/test-scale" element={<TestScalePage />} />
    <Route path="/po-review" element={<POReviewPage />} />
    <Route path="/distribution-plans" element={<DistributionPlanBrandView />} />
    <Route path="/distribution-plans/clusters" element={<DistributionPlanPage />} />
    <Route path="/distribution-plans/category/:categoryCode" element={<DistributionPlanFashionGradePage />} />
    <Route path="/distribution-plans/category-detail/:dpPlanId" element={<DistributionPlanCategoryDetailPage />} />
    <Route path="/distribution-plans/:id" element={<DistributionPlanDetailPageV5 />} />
  </>
);
