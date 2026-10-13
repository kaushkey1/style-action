import { useParams } from 'react-router-dom';
import { StorePerformanceDashboard } from '../components/StorePerformanceDashboard';
import { UnifiedPlanningDashboard } from '../components/UnifiedPlanningDashboard';

export function StoreViewPage() {
  const { viewMode, storeId } = useParams<{ viewMode?: string; storeId?: string }>();
  // A specific store opens the tabbed StoreDetailPage via its own routes
  // (/store-view/store/:storeId). Here we only handle the list and the
  // category/space view modes.
  if (viewMode || storeId) {
    return <UnifiedPlanningDashboard />;
  }
  return <StorePerformanceDashboard />;
}
