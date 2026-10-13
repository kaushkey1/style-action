import { EmptyState, PageSkeleton } from '@/components/ui';
import { useStoreAuditData } from '@/hooks/data/useStoreAuditData';
import { StoreHealthScoreHeader } from './StoreHealthScoreHeader';
import { StoreHealthCharts } from './StoreHealthCharts';
import { StoreHealthFixFirst } from './StoreHealthFixFirst';
import { StoreHealthSummary } from './StoreHealthSummary';
import { StoreChecklistGrades } from './StoreChecklistGrades';
import { StoreActionItems } from './StoreActionItems';

interface StoreHealthTabProps {
  storeCode: string | null;
  storeName?: string;
}

export function StoreHealthTab({ storeCode, storeName }: StoreHealthTabProps) {
  const { data, loading } = useStoreAuditData(storeCode);

  if (loading) return <PageSkeleton />;

  if (!data) {
    return <EmptyState description="No audit data available for this store" />;
  }

  return (
    <div className="space-y-4 animate-fadeInUp">
      <StoreHealthScoreHeader data={data} storeName={storeName} />
      <StoreHealthCharts data={data} />
      <StoreHealthFixFirst data={data} />
      <StoreHealthSummary data={data} />
      <StoreChecklistGrades data={data} />
      <StoreActionItems data={data} />
    </div>
  );
}
