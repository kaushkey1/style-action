import { Route } from 'react-router-dom';
import { AgenticBrainChatPage } from './pages/AgenticBrainChatPage';
import { VirtualTeamPage } from './pages/VirtualTeamPage';
import { CronJobsPage } from './pages/CronJobsPage';
import { SessionsPage } from './pages/SessionsPage';
import { WorkflowsPage } from './pages/WorkflowsPage';

export const agenticBrainRoutes = (
  <>
    <Route path="/agents-brain/chat" element={<AgenticBrainChatPage />} />
    <Route path="/agents-brain/virtual-team" element={<VirtualTeamPage />} />
    <Route path="/agents-brain/cron" element={<CronJobsPage />} />
    <Route path="/agents-brain/sessions" element={<SessionsPage />} />
    <Route path="/agents-brain/workflows" element={<WorkflowsPage />} />
  </>
);
