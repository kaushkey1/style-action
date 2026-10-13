import { Route } from 'react-router-dom';
import { TasksPage } from './pages/TasksPage';
import { TaskDetailPage } from './pages/TaskDetailPage';

export const tasksRoutes = (
  <>
    <Route path="/tasks" element={<TasksPage />} />
    <Route path="/tasks/:id" element={<TaskDetailPage />} />
  </>
);
