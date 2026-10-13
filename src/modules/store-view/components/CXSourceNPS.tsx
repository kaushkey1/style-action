import { NPSViewPanel } from './NPSViewPanel';

interface CXSourceNPSProps {
  storeCode: string;
  storeName?: string;
}

export function CXSourceNPS({ storeCode, storeName }: CXSourceNPSProps): React.ReactNode {
  return <NPSViewPanel storeCode={storeCode} storeName={storeName} />;
}
