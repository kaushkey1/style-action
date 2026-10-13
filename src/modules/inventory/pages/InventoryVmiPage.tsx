import { PageHeader } from '@/components/ui';
import { ReorderOrdersTab } from '../components/ReorderOrdersTab';

/**
 * VMI (Vendor Managed Inventory) — STO/PO replenishment recommendations.
 * Promoted from a Command Center tab to its own INVENTORY sub-nav page.
 */
export default function InventoryVmiPage(): React.ReactNode {
  return (
    <div className="animate-fadeInUp space-y-4">
      <PageHeader title="VMI" />
      <ReorderOrdersTab />
    </div>
  );
}
