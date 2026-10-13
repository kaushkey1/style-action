import { Route } from 'react-router-dom';
import { AgentWorkforcePage } from './pages/AgentWorkforcePage';

export const agentRoutes = (
  <>
    <Route path="/agents" element={<AgentWorkforcePage />} />
  </>
);
