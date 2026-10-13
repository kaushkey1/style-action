import { Route } from 'react-router-dom';
import { ExceptionFeedPage } from './pages/ExceptionFeedPage';
import { ApprovalQueuePage } from './pages/ApprovalQueuePage';

export const exceptionRoutes = (
  <>
    <Route path="/exceptions" element={<ExceptionFeedPage />} />
    <Route path="/approvals" element={<ApprovalQueuePage />} />
  </>
);
