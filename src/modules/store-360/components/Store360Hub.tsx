import { useMemo } from 'react';
import {
  PageHeader,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Badge,
  EmptyState,
} from '@/components/ui';
import { IntelligenceTab } from './IntelligenceTab';
import { SpaceAOPTab } from './SpaceAOPTab';
import { AopRevenueTab } from './AopRevenueTab';
import { OperationsTab } from './OperationsTab';
import { CustomerTab } from './CustomerTab';
import { storeSpaceProfiles } from '@/data/mockSpacePlanning'; // mock-ok — config lookup

interface Store360HubProps {
  storeId: string;
}

export function Store360Hub({ storeId }: Store360HubProps) {
  const profile = useMemo(
    () => storeSpaceProfiles.find(p => p.storeId === storeId),
    [storeId]
  );

  if (!profile) {
    return (
      <div className="space-y-4 animate-fadeInUp">
        <PageHeader
          title="Store 360"
          backTo={{ label: 'Store View', path: '/store-view' }}
        />
        <EmptyState description="Store not found. Navigate from Store View to open a store's 360 view." />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fadeInUp">
      <PageHeader
        title={profile.storeName}
        backTo={{ label: 'Store View', path: '/store-view' }}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="default" size="sm">{profile.grade}</Badge>
            <Badge
              variant={profile.planStatus === 'active' ? 'success' : profile.planStatus === 'locked' ? 'success' : profile.planStatus === 'under-review' ? 'default' : profile.planStatus === 'superseded' ? 'outline' : 'outline'}
              size="sm"
            >
              {profile.planStatus === 'active' ? 'Active' : profile.planStatus === 'locked' ? 'Plan Locked' : profile.planStatus === 'under-review' ? 'Under Review' : profile.planStatus === 'superseded' ? 'Superseded' : 'Draft'}
            </Badge>
          </div>
        }
      />

      <Tabs defaultValue="intelligence">
        <TabsList>
          <TabsTrigger value="intelligence">Intelligence</TabsTrigger>
          <TabsTrigger value="space-aop">Space & AOP</TabsTrigger>
          <TabsTrigger value="aop-revenue">AOP & Revenue</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
          <TabsTrigger value="customer">Customer</TabsTrigger>
        </TabsList>

        <TabsContent value="intelligence">
          <IntelligenceTab storeId={storeId} />
        </TabsContent>

        <TabsContent value="space-aop">
          <SpaceAOPTab storeId={storeId} />
        </TabsContent>

        <TabsContent value="aop-revenue">
          <AopRevenueTab storeId={storeId} />
        </TabsContent>

        <TabsContent value="operations">
          <OperationsTab storeId={storeId} />
        </TabsContent>

        <TabsContent value="customer">
          <CustomerTab storeId={storeId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
