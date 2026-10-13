import { useEffect } from 'react';
import { CalendarDays } from 'lucide-react';
import { Badge, Input, PageHeader, Tabs, TabsList, TabsTrigger, TabsContent, Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui';
import { SMARTI_STORE_CODE, SMARTI_STORE_NAME } from '@/modules/jarvis/api/smartiTypes';
import { useJarvisDateStore } from '@/modules/jarvis/stores/useJarvisDateStore';
import { prefetchJarvisData } from '@/modules/jarvis/api/smartiQueries';
import { CommandCenterTab } from './CommandCenterTab';
import { WalkInTab } from './WalkInTab';
import { TrialTab } from './TrialTab';
import { BillingTab } from './BillingTab';
import { PulsePointActionsTab } from './PulsePointActionsTab';

import type { DatePreset } from '@/modules/jarvis/api/smartiTypes';

const PRESET_LABELS: Record<DatePreset, string> = {
  today: 'Today',
  'this-week': 'This Week',
  'last-week': 'Last Week',
  'this-month': 'This Month',
  custom: 'Custom',
};

export function JarvisDashboardPage(): React.ReactNode {
  const dateRange = useJarvisDateStore((s) => s.dateRange);
  const setPreset = useJarvisDateStore((s) => s.setPreset);
  const setCustomRange = useJarvisDateStore((s) => s.setCustomRange);

  useEffect(() => {
    prefetchJarvisData(dateRange.startDate, dateRange.endDate);
  }, [dateRange.startDate, dateRange.endDate]);

  return (
    <div className="space-y-4 animate-fadeInUp">
      <PageHeader
        title="Jarvis CX Intelligence"
        badges={
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" size="sm">{`Store ${SMARTI_STORE_CODE} · ${SMARTI_STORE_NAME}`}</Badge>
          </div>
        }
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="primary" size="sm">Live CCTV</Badge>
            <div className="flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5 text-gray-400" />
              <Select
                value={dateRange.preset}
                onValueChange={(value) => setPreset(value as DatePreset)}
              >
                <SelectTrigger className="h-7 w-auto min-w-[120px] text-xs border-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">{PRESET_LABELS.today}</SelectItem>
                  <SelectItem value="this-week">{PRESET_LABELS['this-week']}</SelectItem>
                  <SelectItem value="last-week">{PRESET_LABELS['last-week']}</SelectItem>
                  <SelectItem value="this-month">{PRESET_LABELS['this-month']}</SelectItem>
                  <SelectItem value="custom">{PRESET_LABELS.custom}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {dateRange.preset === 'custom' && (
              <div className="flex items-center gap-1.5 text-xs">
                <Input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setCustomRange(e.target.value, dateRange.endDate)}
                  className="h-7 w-auto text-xs"
                  aria-label="Start date"
                />
                <span className="text-gray-400">to</span>
                <Input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setCustomRange(dateRange.startDate, e.target.value)}
                  className="h-7 w-auto text-xs"
                  aria-label="End date"
                />
              </div>
            )}
          </div>
        }
      />

      <div className="px-4 md:px-6 pb-6">
        <Tabs defaultValue="command-center">
          <TabsList variant="underline" className="mb-4 overflow-x-auto">
            <TabsTrigger value="command-center" variant="underline">Command Center</TabsTrigger>
            <TabsTrigger value="walk-in" variant="underline">Walk-in</TabsTrigger>
            <TabsTrigger value="trial" variant="underline">Trial</TabsTrigger>
            <TabsTrigger value="billing" variant="underline">Billing</TabsTrigger>
            <TabsTrigger value="action-tracker" variant="underline">PulsePoint Actions</TabsTrigger>
          </TabsList>

          <TabsContent value="command-center">
            <CommandCenterTab />
          </TabsContent>
          <TabsContent value="walk-in">
            <WalkInTab />
          </TabsContent>
          <TabsContent value="trial">
            <TrialTab />
          </TabsContent>
          <TabsContent value="billing">
            <BillingTab />
          </TabsContent>
          <TabsContent value="action-tracker">
            <PulsePointActionsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
