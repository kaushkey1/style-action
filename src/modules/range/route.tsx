import { Route } from 'react-router-dom';
import RangeArchitecturePage from './pages/RangeArchitecturePage';
import RAFamilyDetailPage from './pages/RAFamilyDetailPage';
import RABrickAttributeVariantsPage from './pages/RABrickAttributeVariantsPage';
import RAStoreRangePage from './pages/RAStoreRangePage';
import StoreRangeDetailV2 from './pages/StoreRangeDetailV2';
import StoreRangeDigitalTwin from './pages/StoreRangeDigitalTwin';
import StoreLayoutDigitalTwin from './pages/StoreLayoutDigitalTwin';
import { RangePerformancePage } from './pages/RangePerformancePage';
import { CarryoverDecisionPage } from './pages/CarryoverDecisionPage';
import { RangeHierarchyDetailPage } from './pages/RangeHierarchyDetailPage';

export const rangeRoutes = (
  <>
    <Route path="/range" element={<RangeArchitecturePage />} />
    <Route path="/range/detail/:id" element={<RABrickAttributeVariantsPage />} />
    <Route path="/range/network-overview" element={<RangeArchitecturePage />} />
    <Route path="/range/segment/:segmentId/family/:familyId" element={<RAFamilyDetailPage />} />
    <Route path="/range/segment/:segmentId/family/:familyId/brick/:brickId" element={<RABrickAttributeVariantsPage />} />
    <Route path="/range/store-range" element={<RAStoreRangePage />} />
    <Route path="/range/store/:storeId" element={<StoreRangeDetailV2 />} />
    <Route path="/range/store/:storeId/digital-twin" element={<StoreLayoutDigitalTwin />} />
    <Route path="/range/store/:storeId/grid-view" element={<StoreRangeDigitalTwin />} />
    <Route path="/range/performance" element={<RangePerformancePage />} />
    <Route path="/range/carryover" element={<CarryoverDecisionPage />} />
    <Route path="/range/hierarchy" element={<RangeHierarchyDetailPage />} />
    <Route path="/range/hierarchy/:hierarchyId" element={<RangeHierarchyDetailPage />} />
  </>
);
