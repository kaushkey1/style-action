import { PageHeader, Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui';
import { formatDateTime } from '@/lib/utils';
import { useVmiConfigStore } from '../stores/useVmiConfigStore';
import { EnrolmentTab } from '../components/vmi/EnrolmentTab';
import { SalesWindowTab } from '../components/vmi/SalesWindowTab';
import { VendorMoqTab } from '../components/vmi/VendorMoqTab';
import { LeadTimesTab } from '../components/vmi/LeadTimesTab';
import { StoreStoTab } from '../components/vmi/StoreStoTab';
import { DcPoTab } from '../components/vmi/DcPoTab';
import { InTransitTab } from '../components/vmi/InTransitTab';
import { InterDcTab } from '../components/vmi/InterDcTab';
import { OverridesTab } from '../components/vmi/OverridesTab';
import { ApprovalsAuditTab } from '../components/vmi/ApprovalsAuditTab';

/**
 * VMI Configuration (Admin → Modules → VMI). Frontend prototype (local state):
 * all ten configuration groups that drive VMI replenishment are maintainable here.
 */
export function AdminVmiConfigPage(): React.ReactNode {
  const lastModified = useVmiConfigStore((s) => s.lastModified);

  return (
    <div className="space-y-4">
      <PageHeader
        title="VMI Configuration"
        actions={
          lastModified ? (
            <span className="text-xs text-gray-500">Last saved: {formatDateTime(lastModified)}</span>
          ) : undefined
        }
      />

      <p className="text-sm text-gray-500">
        Maintain the parameters that drive Vendor Managed Inventory replenishment (CORE Reorder / STO, PO, Inter-DC).
        Only business-maintained parameters are editable; calculation logic is shown for transparency.
      </p>

      <Tabs defaultValue="enrolment">
        <TabsList variant="underline">
          <TabsTrigger value="enrolment" variant="underline">
            1. Enrolment
          </TabsTrigger>
          <TabsTrigger value="sales-window" variant="underline">
            2. Sales Window
          </TabsTrigger>
          <TabsTrigger value="store-sto" variant="underline">
            3. Store / STO
          </TabsTrigger>
          <TabsTrigger value="dc-po" variant="underline">
            4. DC / PO
          </TabsTrigger>
          <TabsTrigger value="vendor-moq" variant="underline">
            5. Vendor & MOQ
          </TabsTrigger>
          <TabsTrigger value="lead-times" variant="underline">
            6. Lead Times
          </TabsTrigger>
          <TabsTrigger value="in-transit" variant="underline">
            7. In-Transit
          </TabsTrigger>
          <TabsTrigger value="inter-dc" variant="underline">
            8. Inter-DC Shift
          </TabsTrigger>
          <TabsTrigger value="overrides" variant="underline">
            9. Defaults & Overrides
          </TabsTrigger>
          <TabsTrigger value="approvals" variant="underline">
            10. Approvals & Audit
          </TabsTrigger>
        </TabsList>

        <TabsContent value="enrolment">
          <EnrolmentTab />
        </TabsContent>
        <TabsContent value="sales-window">
          <SalesWindowTab />
        </TabsContent>
        <TabsContent value="store-sto">
          <StoreStoTab />
        </TabsContent>
        <TabsContent value="dc-po">
          <DcPoTab />
        </TabsContent>
        <TabsContent value="vendor-moq">
          <VendorMoqTab />
        </TabsContent>
        <TabsContent value="lead-times">
          <LeadTimesTab />
        </TabsContent>
        <TabsContent value="in-transit">
          <InTransitTab />
        </TabsContent>
        <TabsContent value="inter-dc">
          <InterDcTab />
        </TabsContent>
        <TabsContent value="overrides">
          <OverridesTab />
        </TabsContent>
        <TabsContent value="approvals">
          <ApprovalsAuditTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
