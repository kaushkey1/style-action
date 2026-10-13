import { Route } from 'react-router-dom';
import { ShowroomLayout } from './components/ShowroomLayout';
import { ShowroomJourneyOverview } from './components/ShowroomJourneyOverview';
import { BrandResearchView } from './components/BrandResearchView';
import { StyleBankDashboard } from './components/StyleBankDashboard';
import { CurationWorkflow } from './components/CurationWorkflow';
import { CollectionProgressDashboard } from './components/CollectionProgressDashboard';

export const styleBankRoutes = (
  <Route path="/showroom" element={<ShowroomLayout />}>
    <Route index element={<ShowroomJourneyOverview />} />
    <Route path="brands" element={<BrandResearchView />} />
    <Route path="discover" element={<StyleBankDashboard />} />
    <Route path="curate" element={<CurationWorkflow />} />
    <Route path="curate/:podId" element={<CurationWorkflow />} />
    <Route path="progress" element={<CollectionProgressDashboard />} />
  </Route>
);
