import { useParams } from 'react-router-dom';
import { Store360Hub } from '../components/Store360Hub';

// Default: Phoenix Palladium, Mumbai (store code 5943)
const DEFAULT_STORE_ID = 'b3a1d5e7-8f2c-4a19-b6d4-1e7f3c5a9b2d';

export function Store360Page() {
  const { storeId } = useParams<{ storeId: string }>();
  const resolvedStoreId = storeId ?? DEFAULT_STORE_ID;

  return <Store360Hub storeId={resolvedStoreId} />;
}
