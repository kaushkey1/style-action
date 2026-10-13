import { EmptyState, Skeleton } from '@/components/ui';
import { useStoreAuditData } from '@/hooks/data/useStoreAuditData';
import { StoreHealthScoreHeader } from '@/features/store-view/components/StoreHealthScoreHeader';
import { StoreHealthCharts } from '@/features/store-view/components/StoreHealthCharts';
import { StoreHealthFixFirst } from '@/features/store-view/components/StoreHealthFixFirst';

interface CXSourceAuditProps {
  storeCode: string;
  storeName?: string;
}

export function CXSourceAudit({ storeCode, storeName }: CXSourceAuditProps): React.ReactNode {
  const { data, loading, error } = useStoreAuditData(storeCode);

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-48 rounded-lg" />
      </div>
    );
  }

  // Distinguished from "no data" so a backend fault is not reported to the user
  // as "this store has never been audited".
  if (error) {
    return (
      <EmptyState
        title="Audit Data Unavailable"
        description="Could not load the store audit. Please try again."
      />
    );
  }

  if (!data) {
    return (
      <EmptyState
        title="No Audit Data"
        description="No audit data available for this store."
      />
    );
  }

  return (
    <div className="space-y-4 animate-fadeInUp">
      <StoreHealthScoreHeader data={data} storeName={storeName} />
      <StoreHealthCharts data={data} />
      <StoreHealthFixFirst data={data} />
    </div>
  );
}
