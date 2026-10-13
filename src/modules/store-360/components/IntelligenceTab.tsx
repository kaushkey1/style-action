import { StoreIntelligenceDetail } from '@/modules/store-view/components/StoreIntelligenceDetail';

interface IntelligenceTabProps {
  storeId: string;
}

export function IntelligenceTab({ storeId }: IntelligenceTabProps) {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  return <StoreIntelligenceDetail storeId={storeId} yearMonth={yearMonth} />;
}
