import { Route } from 'react-router-dom';
import { WikiPage } from './pages/WikiPage';
import { SkillsPage } from './pages/SkillsPage';
import { SearchRedirect } from './pages/SearchRedirect';
import { KBChatPage } from './pages/KBChatPage';

export const knowledgeBaseRoutes = (
  <>
    <Route path="/knowledge-base/wiki" element={<WikiPage />} />
    <Route path="/knowledge-base/skills" element={<SkillsPage />} />
    <Route path="/knowledge-base/search" element={<SearchRedirect />} />
    <Route path="/knowledge-base/chat" element={<KBChatPage />} />
  </>
);
