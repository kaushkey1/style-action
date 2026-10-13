import { Route } from 'react-router-dom';
import { CycleDashboardPage } from './pages/CycleDashboardPage';
import { CycleSetupPage } from './pages/CycleSetupPage';
import { ChannelTargetsPage } from './pages/ChannelTargetsPage';
import { PlanningWorkspacePage } from './pages/PlanningWorkspacePage';
import { ScenarioComparePage } from './pages/ScenarioComparePage';
import { ReviewApprovalPage } from './pages/ReviewApprovalPage';
import { AuditHistoryPage } from './pages/AuditHistoryPage';
import { ManageStoresPage } from './pages/ManageStoresPage';
import { PromotePage } from './pages/PromotePage';
import { MonitorPage } from './pages/MonitorPage';

export const aopPlanningRoutes = (
  <>
    <Route path="/sales-plan" element={<CycleDashboardPage />} />
    <Route path="/sales-plan/setup/:cycleId" element={<CycleSetupPage />} />
    <Route path="/sales-plan/targets/:cycleId" element={<ChannelTargetsPage />} />
    <Route path="/sales-plan/workspace/:cycleId" element={<PlanningWorkspacePage />} />
    <Route path="/sales-plan/scenarios/:cycleId" element={<ScenarioComparePage />} />
    <Route path="/sales-plan/review/:cycleId" element={<ReviewApprovalPage />} />
    <Route path="/sales-plan/audit/:cycleId" element={<AuditHistoryPage />} />
    <Route path="/sales-plan/manage-stores/:cycleId" element={<ManageStoresPage />} />
    <Route path="/sales-plan/promote/:cycleId" element={<PromotePage />} />
    <Route path="/sales-plan/monitor/:cycleId" element={<MonitorPage />} />
  </>
);
