import { useState } from 'react';
import {
  Smartphone,
  Wifi,
  Battery,
  Signal,
  AlertCircle,
  CheckCircle2,
  LayoutGrid,
  ToggleLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge, Button, Tabs, TabsList, TabsTrigger, TabsContent, Switch, SectionHeader, EmptyState } from '@/components/ui';
import { mobileCardConfigs, featureToggles, mockMobileKpiValues } from '../data/mockAdminData';
import type { FeatureToggle } from '../data/mockAdminData';
import { useToast } from '@/hooks/useToast';

const mockKpiValues = mockMobileKpiValues;

type ToggleKey = 'ceo' | 'regDir' | 'storeMgr' | 'associate';

export function AdminMobilePage() {
  const [selectedRoleId, setSelectedRoleId] = useState(mobileCardConfigs[0]?.roleId ?? '');
  const [toggleState, setToggleState] = useState<Record<string, Record<ToggleKey, boolean>>>(() => {
    const initial: Record<string, Record<ToggleKey, boolean>> = {};
    featureToggles.forEach((ft: FeatureToggle) => {
      initial[ft.feature] = {
        ceo: ft.ceo,
        regDir: ft.regDir,
        storeMgr: ft.storeMgr,
        associate: ft.associate,
      };
    });
    return initial;
  });

  const { success } = useToast();
  const selectedConfig = mobileCardConfigs.find((c) => c.roleId === selectedRoleId) ?? mobileCardConfigs[0];

  if (!selectedConfig) return null;

  const handleToggle = (feature: string, role: ToggleKey) => {
    setToggleState((prev) => {
      const current = prev[feature];
      if (!current) return prev;
      return {
        ...prev,
        [feature]: {
          ...current,
          [role]: !current[role],
        },
      };
    });
  };

  return (
    <div className="relative">
      <div className="absolute inset-0 z-10 flex items-start justify-center pt-48 bg-white/60 rounded-lg">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <Smartphone className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-sm font-semibold text-gray-500">Coming Soon</p>
          <p className="text-xs text-gray-400 mt-1">Platform configuration is under development</p>
        </div>
      </div>
    <div className="space-y-6 pointer-events-none select-none opacity-40 grayscale">
      <Tabs defaultValue="cards">
        <TabsList>
          <TabsTrigger value="cards">
            <LayoutGrid className="w-4 h-4 mr-1.5 inline-block" />
            Card Builder
          </TabsTrigger>
          <TabsTrigger value="toggles">
            <ToggleLeft className="w-4 h-4 mr-1.5 inline-block" />
            Feature Toggles
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Card Builder */}
        <TabsContent value="cards">
          {/* Role Selector */}
          <div className="flex items-center gap-2 mb-4">
            {mobileCardConfigs.map((config) => (
              <Button
                key={config.roleId}
                variant={selectedRoleId === config.roleId ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setSelectedRoleId(config.roleId)}
              >
                {config.roleName}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left: Card Configuration */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
              <SectionHeader
                title="Card Configuration"
                actions={
                  <Badge variant={selectedConfig.status === 'published' ? 'success' : 'warning'}>
                    {selectedConfig.status === 'published' ? 'Published' : 'Draft'}
                  </Badge>
                }
              />

              {/* Hero Metric */}
              <div>
                {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Hero Metric</label>
                <p className="text-sm text-gray-900 mt-0.5">{selectedConfig.heroMetric}</p>
              </div>

              {/* Hero Comparison */}
              <div>
                {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Hero Comparison</label>
                <p className="text-sm text-gray-900 mt-0.5">{selectedConfig.heroComparison}</p>
              </div>

              {/* Health Indicators */}
              <div>
                {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Health Indicators</label>
                <div className="mt-1 space-y-1">
                  {selectedConfig.healthIndicators.map((indicator) => (
                    <div key={indicator} className="flex items-center gap-2 text-sm text-gray-700">
                      <CheckCircle2 className="w-3 h-3 text-green-500" />
                      {indicator}
                    </div>
                  ))}
                </div>
              </div>

              {/* KPI Cards */}
              <div>
                {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">KPI Cards</label>
                {selectedConfig.kpiCards.length > 0 ? (
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {selectedConfig.kpiCards.map((kpi) => (
                      <Badge key={kpi} variant="primary" size="sm">{kpi}</Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 mt-0.5 italic">No KPI cards configured</p>
                )}
              </div>

              {/* Exception Feed */}
              <div>
                {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Exception Feed</label>
                <p className="text-sm text-gray-900 mt-0.5">{selectedConfig.exceptionFeed}</p>
              </div>

              {/* Extra Feature */}
              <div>
                {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Extra Feature</label>
                <p className="text-sm text-gray-900 mt-0.5">{selectedConfig.extraFeature}</p>
              </div>

              {/* Save Draft / Publish Actions */}
              <div className="border-t border-gray-100 pt-3">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => success('Mobile card configuration saved as draft')}
                  >
                    Save Draft
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={selectedConfig.status !== 'draft'}
                    onClick={() => success('Mobile card configuration published')}
                  >
                    Publish
                  </Button>
                </div>
              </div>
            </div>

            {/* Change Summary */}
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-3 mt-3">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Change Summary</h4>
              <div className="space-y-1 text-xs text-gray-600">
                <p>Hero Metric: {selectedConfig.heroMetric}</p>
                <p>KPI Cards: {selectedConfig.kpiCards.length} configured</p>
                <p>Exception Feed: {selectedConfig.exceptionFeed}</p>
                <p>Last updated: 2026-02-14 09:15</p>
              </div>
            </div>

            {/* Right: Phone Preview */}
            <div className="flex justify-center">
              <div className="w-[300px] rounded-lg border-2 border-gray-300 bg-gray-950 p-2 shadow-lg">
                {/* Phone notch */}
                <div className="flex items-center justify-between gap-2 px-4 pt-1 pb-2">
                  <span className="text-[10px] text-gray-400 font-medium">9:41</span>
                  <div className="flex items-center gap-1">
                    <Signal className="w-3 h-3 text-gray-400" />
                    <Wifi className="w-3 h-3 text-gray-400" />
                    <Battery className="w-3 h-3 text-gray-400" />
                  </div>
                </div>

                {/* Phone content */}
                <div className="bg-gray-50 rounded-lg overflow-hidden min-h-[480px]">
                  {/* App header */}
                  <div className="bg-primary px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-white" />
                      <span className="text-xs font-semibold text-white">Impetus</span>
                    </div>
                    <p className="text-[10px] text-primary-100 mt-0.5">{selectedConfig.roleName}</p>
                  </div>

                  {/* Hero Metric */}
                  <div className="bg-white mx-2 mt-2 rounded-lg p-3 border border-gray-200">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide">{selectedConfig.heroMetric}</p>
                    <p className="text-xl font-bold text-gray-900 mt-0.5">
                      {selectedRoleId === 'role-associate' ? '78%' : '\u20B948.2 Cr'}
                    </p>
                    <p className="text-[10px] text-green-600 mt-0.5">+4.2% {selectedConfig.heroComparison}</p>
                  </div>

                  {/* Health Indicators */}
                  <div className="flex items-center gap-1.5 mx-2 mt-2 px-1">
                    {selectedConfig.healthIndicators.map((_, i) => (
                      <div
                        key={i}
                        className={cn(
                          'w-2 h-2 rounded-full',
                          i === 0 ? 'bg-green-500' : i === 1 ? 'bg-green-500' : 'bg-yellow-500'
                        )}
                        title={selectedConfig.healthIndicators[i]}
                      />
                    ))}
                    <span className="text-[10px] text-gray-500 ml-1">Health</span>
                  </div>

                  {/* KPI Cards Grid */}
                  {selectedConfig.kpiCards.length > 0 && (
                    <div className="grid grid-cols-2 gap-1.5 mx-2 mt-2">
                      {selectedConfig.kpiCards.map((kpi) => (
                        <div key={kpi} className="bg-white rounded-lg border border-gray-200 p-2">
                          <p className="text-[10px] text-gray-500 truncate">{kpi}</p>
                          <p className="text-sm font-semibold text-gray-900 mt-0.5">
                            {mockKpiValues[kpi] || '--'}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Exception Feed Line */}
                  {selectedConfig.exceptionFeed !== 'None' && (
                    <div className="flex items-center gap-1.5 mx-2 mt-2 bg-white rounded-lg border border-gray-200 p-2">
                      <AlertCircle className="w-3 h-3 text-red-500 shrink-0" />
                      <span className="text-[10px] text-gray-700">
                        3 open exceptions ({selectedConfig.exceptionFeed})
                      </span>
                    </div>
                  )}

                  {/* Bottom spacer */}
                  <div className="h-4" />
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Tab 2: Feature Toggles */}
        <TabsContent value="toggles">
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left text-xs font-semibold text-gray-700 px-4 py-3">Feature</th>
                  <th className="text-center text-xs font-semibold text-gray-700 px-4 py-3">CEO</th>
                  <th className="text-center text-xs font-semibold text-gray-700 px-4 py-3">Reg. Dir</th>
                  <th className="text-center text-xs font-semibold text-gray-700 px-4 py-3">Store Mgr</th>
                  <th className="text-center text-xs font-semibold text-gray-700 px-4 py-3">Associate</th>
                </tr>
              </thead>
              <tbody>
                {featureToggles.length === 0 ? (
                  <tr><td colSpan={5}><EmptyState description="No feature toggles configured" /></td></tr>
                ) : featureToggles.map((ft, i) => (
                  <tr
                    key={ft.feature}
                    className={cn(
                      'border-b border-gray-100',
                      i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                    )}
                  >
                    <td className="text-sm text-gray-900 px-4 py-2.5">{ft.feature}</td>
                    {(['ceo', 'regDir', 'storeMgr', 'associate'] as ToggleKey[]).map((role) => (
                      <td key={role} className="text-center px-4 py-2.5">
                        <div className="flex justify-center">
                          <Switch
                            checked={toggleState[ft.feature]?.[role] ?? false}
                            onCheckedChange={() => handleToggle(ft.feature, role)}
                            aria-label={`${ft.feature} for ${role}`}
                          />
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
    </div>
  );
}
