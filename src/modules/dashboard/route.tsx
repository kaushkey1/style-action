import { Navigate, Route } from 'react-router-dom';
import { ConsoleHomePage } from './pages/ConsoleHomePage';
import { SegmentDetailPage } from './pages/SegmentDetailPage';
import { DashboardRouter } from './components/DashboardRouter';

export const dashboardRoutes = (
  <>
    <Route path="/home" element={<ConsoleHomePage />} />
    <Route path="/dashboard" element={<DashboardRouter />} />
    <Route path="/dashboard/segment/:segmentName" element={<SegmentDetailPage />} />
    <Route path="/" element={<Navigate to="/home" replace />} />
  </>
);
