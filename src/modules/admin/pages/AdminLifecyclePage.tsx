import { useState } from 'react';
import {
  Store,
  ArrowRight,
  CheckSquare,
  Square,
  AlertTriangle,
  MapPin,
  Users,
  Target,
  Layers,
  Plus,
  UserMinus,
  TrendingDown,
  Shield,
  Bell,
  X,
} from 'lucide-react';
import {
  Badge,
  Button,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Input,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  MetricGrid,
  PageHeader,
  SectionHeader,
  EmptyState,
} from '@/components/ui';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';

// ── Inline mock data ──

const storeData = {
  name: 'Andheri Infinity Mall',
  code: 'STORE-MUM-ANH-001',
  region: 'West > Maharashtra > Mumbai',
  format: 'Mall' as const,
  sqFt: 3200,
  opened: '2024-03-15',
  opsPod: 'Pod 9 — West 1 (MH, Goa)',
  status: 'active' as const,
};

const podData = {
  number: 1,
  name: 'Menswear Shirt — Netplay',
  rmLead: 'Rahul Mehta',
  stores: 312,
  target: 866,
};

const userData = {
  name: 'Vineeth Nair',
  role: 'Regional Director',
  primary: 'Pod 9 — West 1 (MH, Goa) — POD Head',
  groups: ['West Region Leadership', 'Maharashtra Cluster'],
  status: 'active' as const,
  openExceptions: 3,
};

const replacementUsers = [
  { id: 'u1', name: 'Sneha Kapoor', role: 'Cluster Manager', region: 'West 1' },
  { id: 'u2', name: 'Ravi Menon', role: 'Regional Director', region: 'South 1' },
  { id: 'u3', name: 'Amit Sharma', role: 'Cluster Manager', region: 'West 2' },
  { id: 'u4', name: 'Priya Desai', role: 'Regional Director', region: 'North 1' },
];

const kpiData = {
  name: 'Same Store Revenue Growth %',
  code: 'SSG_PCT',
  area: 'Revenue',
  status: 'Published',
  inUseSince: '2025-04-01',
};

const replacementKpis = [
  { id: 'kpi-sa', name: 'Revenue Achievement %', code: 'SA_PCT' },
  { id: 'kpi-nsv', name: 'Net Revenue Value', code: 'NSV' },
  { id: 'kpi-conv', name: 'Conversion %', code: 'CONV_PCT' },
  { id: 'kpi-gm', name: 'Net Gross Margin %', code: 'GM_PCT' },
];

// ── Check icon helper ──

function CheckIcon({ checked }: { checked: boolean }) {
  return checked ? (
    <CheckSquare className="w-4 h-4 text-primary" />
  ) : (
    <Square className="w-4 h-4 text-gray-400" />
  );
}

// ── Tab 1: Store Lifecycle Changes ──

function StoreLifecycleTab() {
  const { success } = useToast();
  const [transition, setTransition] = useState<string>('');
  const [closureReason, setClosureReason] = useState<string>('');
  const [expectedReopenDate, setExpectedReopenDate] = useState<string>('');

  const lifecycleStates = [
    { id: 'active', label: 'Active', current: true },
    { id: 'ramping_up', label: 'Ramping Up (90 days)', current: false },
    { id: 'temporarily_closed', label: 'Temporarily Closed', current: false },
    { id: 'decommissioned', label: 'Decommissioned', current: false },
  ];

  return (
    <div className="space-y-4">
      {/* Store Info Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-gray-900">{storeData.name}</h3>
          </div>
          <Badge variant="success" dot dotColor="bg-green-500">Active</Badge>
        </div>
        {/* eslint-disable-next-line design-system/prefer-metric-grid -- responsive info layout */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2 text-sm">
          <div>
            <span className="text-gray-500 text-xs block">Store Code</span>
            <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">{storeData.code}</code>
          </div>
          <div>
            <span className="text-gray-500 text-xs block">Region</span>
            <span className="text-gray-900 font-medium">{storeData.region}</span>
          </div>
          <div>
            <span className="text-gray-500 text-xs block">Format</span>
            <Badge variant="info" size="sm">{storeData.format}</Badge>
          </div>
          <div>
            <span className="text-gray-500 text-xs block">Sq. Ft.</span>
            <span className="text-gray-900 font-medium">{storeData.sqFt.toLocaleString('en-IN')}</span>
          </div>
          <div>
            <span className="text-gray-500 text-xs block">Opened</span>
            <span className="text-gray-900 font-medium">{storeData.opened}</span>
          </div>
          <div>
            <span className="text-gray-500 text-xs block">Ops Pod</span>
            <span className="text-gray-900 font-medium">{storeData.opsPod}</span>
          </div>
        </div>
      </div>

      {/* Lifecycle Status Diagram */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <SectionHeader title="Lifecycle Status" />
        <div className="flex items-center gap-2 flex-wrap">
          {lifecycleStates.map((state, idx) => (
            <div key={state.id} className="flex items-center gap-2">
              <div
                className={cn(
                  'px-3 py-2 rounded-lg border text-xs font-medium transition-all',
                  state.current
                    ? 'bg-primary/10 border-primary text-primary ring-2 ring-primary/20'
                    : 'bg-gray-50 border-gray-200 text-gray-600'
                )}
              >
                {state.current && <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary mr-1.5" />}
                {state.label}
              </div>
              {idx < lifecycleStates.length - 1 && (
                <ArrowRight className="w-4 h-4 text-gray-400 shrink-0" />
              )}
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Active stores can transition to Temporarily Closed or Decommissioned. Ramping Up stores automatically become Active after 90 days.
        </p>
      </div>

      {/* Transition Action Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Transition Action</h3>
        <div className="max-w-xs">
          <Select value={transition} onValueChange={setTransition}>
            <SelectTrigger size="sm">
              <SelectValue placeholder="Select transition..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="temporarily_closed">Active &rarr; Temporarily Closed</SelectItem>
              <SelectItem value="decommissioned">Active &rarr; Decommissioned</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Temporarily Closed form */}
        {transition === 'temporarily_closed' && (
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                {/* eslint-disable-next-line jsx-a11y/label-has-associated-control -- Radix Select handles accessibility */}
                <label className="text-xs font-medium text-gray-700 block mb-1">Closure Reason</label>
                <Select value={closureReason} onValueChange={setClosureReason}>
                  <SelectTrigger size="sm">
                    <SelectValue placeholder="Select reason..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="renovation">Renovation</SelectItem>
                    <SelectItem value="lease_expiry">Lease Expiry</SelectItem>
                    <SelectItem value="seasonal">Seasonal</SelectItem>
                    <SelectItem value="flood_disaster">Flood / Disaster</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                {/* eslint-disable-next-line jsx-a11y/label-has-associated-control -- Input component handles accessibility */}
                <label className="text-xs font-medium text-gray-700 block mb-1">Expected Reopen Date</label>
                <Input
                  type="date"
                  value={expectedReopenDate}
                  onChange={(e) => setExpectedReopenDate(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-gray-700 mb-2">Cascade Effects</h4>
              <div className="space-y-1.5">
                {[
                  { label: 'Suppress all exception generation for this store', checked: true },
                  { label: 'Exclude store KPI data from pod/region aggregations', checked: true },
                  { label: 'Grey out store in all dashboards with reason badge', checked: true },
                  { label: 'Notify Operations POD Head and assigned Product Pod leads', checked: true },
                  { label: 'Pause store-level notifications for Store Manager', checked: true },
                  { label: 'Reassign Store Manager to another store (manual)', checked: false },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckIcon checked={item.checked} />
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
              <Button variant="outline" size="sm" onClick={() => setTransition('')}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  success('Store lifecycle transition initiated — store marked as Temporarily Closed');
                  setTransition('');
                }}
              >
                Confirm Closure
              </Button>
            </div>
          </div>
        )}

        {/* Decommissioned form */}
        {transition === 'decommissioned' && (
          <div className="mt-4 space-y-4">
            <div className="bg-red-50 rounded-lg border border-red-200 p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">
                This action is permanent. The store will be removed from all live views. Historical data is preserved.
              </p>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-gray-700 mb-2">Cascade Effects</h4>
              <div className="space-y-1.5">
                {[
                  { label: 'Remove store from all active dashboards and views', checked: true },
                  { label: 'Disable all exception rules for this store', checked: true },
                  { label: 'Archive KPI data (historical preserved for LY comparisons)', checked: true },
                  { label: 'Remove from pod store counts and target calculations', checked: true },
                  { label: 'Deactivate Store Manager and Associate accounts', checked: true },
                  { label: 'Notify all related POD Heads and Regional Director', checked: true },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckIcon checked={item.checked} />
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
              <Button variant="outline" size="sm" onClick={() => setTransition('')}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  success('Store decommissioned — removed from all live views');
                  setTransition('');
                }}
              >
                Confirm Decommission
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Tab 2: Pod Restructuring ──

type RestructureType = 'split' | 'merge' | 'move';

interface SplitPod {
  name: string;
  region: string;
  stores: string;
  target: string;
  lead: string;
}

function PodRestructuringTab() {
  const { success, info } = useToast();
  const [restructureType, setRestructureType] = useState<RestructureType>('split');
  const [splitPods, setSplitPods] = useState<SplitPod[]>([
    { name: 'Menswear Shirt — Netplay (North)', region: 'North', stores: '156', target: '433', lead: 'Rahul Mehta' },
    { name: 'Menswear Shirt — Netplay (South)', region: 'South', stores: '156', target: '433', lead: '' },
  ]);
  const [moveSourcePod, setMoveSourcePod] = useState<string>('');
  const [moveTargetPod, setMoveTargetPod] = useState<string>('');
  const [moveStoreCount, setMoveStoreCount] = useState<string>('');
  const [moveReason, setMoveReason] = useState<string>('');

  const typeOptions: { value: RestructureType; label: string }[] = [
    { value: 'split', label: 'Split pod into two or more pods' },
    { value: 'merge', label: 'Merge with another pod' },
    { value: 'move', label: 'Move stores between pods' },
  ];

  return (
    <div className="space-y-4">
      {/* Source Pod Info */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Layers className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-gray-900">Source Pod</h3>
        </div>
        {/* eslint-disable-next-line design-system/prefer-metric-grid -- responsive info layout */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-2 text-sm">
          <div>
            <span className="text-gray-500 text-xs block">Pod</span>
            <span className="text-gray-900 font-medium">Pod {podData.number}: {podData.name}</span>
          </div>
          <div>
            <span className="text-gray-500 text-xs block">R&M Lead</span>
            <span className="text-gray-900 font-medium">{podData.rmLead}</span>
          </div>
          <div>
            <span className="text-gray-500 text-xs block">Stores</span>
            <span className="text-gray-900 font-semibold">{podData.stores}</span>
          </div>
          <div>
            <span className="text-gray-500 text-xs block">FY27 Target</span>
            <span className="text-gray-900 font-semibold">{'\u20B9'}{podData.target} Cr</span>
          </div>
        </div>
      </div>

      {/* Restructure Type */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Restructure Type</h3>
        <div className="flex flex-col gap-2">
          {typeOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setRestructureType(opt.value)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium text-left transition-all duration-200',
                restructureType === opt.value
                  ? 'bg-primary/5 border-primary text-primary'
                  : 'bg-white border-gray-200 text-gray-700 hover:border-primary/30'
              )}
            >
              <span
                className={cn(
                  'w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0',
                  restructureType === opt.value ? 'border-primary' : 'border-gray-300'
                )}
              >
                {restructureType === opt.value && (
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                )}
              </span>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Split Configuration */}
      {restructureType === 'split' && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Split Configuration</h3>
          <div className="space-y-4">
            {splitPods.length === 0 ? (
              <EmptyState description="No pods configured for split" />
            ) : splitPods.map((pod, idx) => (
              <div key={idx} className="bg-gray-50 rounded-lg border border-gray-200 p-3">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-semibold text-gray-700">New Pod {String.fromCharCode(65 + idx)}</span>
                  {splitPods.length > 2 && (
                    <button
                      onClick={() => setSplitPods((prev) => prev.filter((_, i) => i !== idx))}
                      className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
                      aria-label="Remove pod"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div>
                    {/* eslint-disable-next-line jsx-a11y/label-has-associated-control -- Input component handles accessibility */}
                    <label className="text-xs text-gray-500 block mb-1">Name</label>
                    <Input
                      value={pod.name}
                      onChange={(e) => {
                        setSplitPods((prev) => prev.map((p, i) => i === idx ? { ...p, name: e.target.value } : p));
                      }}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div>
                    {/* eslint-disable-next-line jsx-a11y/label-has-associated-control -- Radix Select handles accessibility */}
                    <label className="text-xs text-gray-500 block mb-1">Region</label>
                    <Select
                      value={pod.region}
                      onValueChange={(val) => {
                        setSplitPods((prev) => prev.map((p, i) => i === idx ? { ...p, region: val } : p));
                      }}
                    >
                      <SelectTrigger size="sm">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="North">North</SelectItem>
                        <SelectItem value="South">South</SelectItem>
                        <SelectItem value="East">East</SelectItem>
                        <SelectItem value="West">West</SelectItem>
                        <SelectItem value="Central">Central</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    {/* eslint-disable-next-line jsx-a11y/label-has-associated-control -- Input component handles accessibility */}
                    <label className="text-xs text-gray-500 block mb-1">Stores</label>
                    <Input
                      type="number"
                      value={pod.stores}
                      onChange={(e) => {
                        setSplitPods((prev) => prev.map((p, i) => i === idx ? { ...p, stores: e.target.value } : p));
                      }}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Target ({'\u20B9'} Cr)</label>
                    <Input
                      type="number"
                      value={pod.target}
                      onChange={(e) => {
                        setSplitPods((prev) => prev.map((p, i) => i === idx ? { ...p, target: e.target.value } : p));
                      }}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div>
                    {/* eslint-disable-next-line jsx-a11y/label-has-associated-control -- Radix Select handles accessibility */}
                    <label className="text-xs text-gray-500 block mb-1">R&M Lead</label>
                    <Select
                      value={pod.lead}
                      onValueChange={(val) => {
                        setSplitPods((prev) => prev.map((p, i) => i === idx ? { ...p, lead: val } : p));
                      }}
                    >
                      <SelectTrigger size="sm">
                        <SelectValue placeholder="Select lead..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Rahul Mehta">Rahul Mehta</SelectItem>
                        <SelectItem value="Sneha Kapoor">Sneha Kapoor</SelectItem>
                        <SelectItem value="Amit Sharma">Amit Sharma</SelectItem>
                        <SelectItem value="Priya Desai">Priya Desai</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ))}
            <button
              onClick={() => setSplitPods((prev) => [...prev, { name: '', region: '', stores: '', target: '', lead: '' }])}
              className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-600 transition-colors"
            >
              <Plus className="w-3 h-3" />
              Add Another Pod
            </button>
          </div>
        </div>
      )}

      {/* Move Stores */}
      {restructureType === 'move' && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Move Stores Between Pods</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
              <label className="text-xs font-medium text-gray-700 block mb-1">Source Pod</label>
              <Select value={moveSourcePod} onValueChange={setMoveSourcePod}>
                <SelectTrigger size="sm">
                  <SelectValue placeholder="Select source pod..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pod-1">Pod 1: Menswear Shirt — Netplay</SelectItem>
                  <SelectItem value="pod-2">Pod 2: Menswear Trouser — Netplay</SelectItem>
                  <SelectItem value="pod-3">Pod 3: Menswear Jacket — Netplay</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
              <label className="text-xs font-medium text-gray-700 block mb-1">Target Pod</label>
              <Select value={moveTargetPod} onValueChange={setMoveTargetPod}>
                <SelectTrigger size="sm">
                  <SelectValue placeholder="Select target pod..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pod-4">Pod 4: Menswear Formal — John Players</SelectItem>
                  <SelectItem value="pod-5">Pod 5: Menswear Casual — DNMX</SelectItem>
                  <SelectItem value="pod-6">Pod 6: Menswear Premium — Allen Solly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
              <label className="text-xs font-medium text-gray-700 block mb-1">Number of Stores</label>
              <Input
                type="number"
                value={moveStoreCount}
                onChange={(e) => setMoveStoreCount(e.target.value)}
                placeholder="e.g., 25"
                className="h-8 text-xs"
              />
            </div>
            <div>
              {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
              <label className="text-xs font-medium text-gray-700 block mb-1">Reason</label>
              <Select value={moveReason} onValueChange={setMoveReason}>
                <SelectTrigger size="sm">
                  <SelectValue placeholder="Select reason..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rebalance">Regional Rebalancing</SelectItem>
                  <SelectItem value="performance">Performance Optimization</SelectItem>
                  <SelectItem value="capacity">Capacity Adjustment</SelectItem>
                  <SelectItem value="restructure">Organizational Restructure</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* Merge placeholder */}
      {restructureType === 'merge' && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Merge Configuration</h3>
          <div className="max-w-sm">
            {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
            <label className="text-xs font-medium text-gray-700 block mb-1">Merge with Pod</label>
            <Select defaultValue="">
              <SelectTrigger size="sm">
                <SelectValue placeholder="Select pod to merge with..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pod-2">Pod 2: Menswear Trouser — Netplay</SelectItem>
                <SelectItem value="pod-3">Pod 3: Menswear Jacket — Netplay</SelectItem>
                <SelectItem value="pod-4">Pod 4: Menswear Formal — John Players</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Cascade Effects */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Cascade Effects</h3>
        <div className="space-y-1.5">
          {[
            'New pods created with copied KPI configuration',
            'Stores redistributed between pods',
            'Revenue targets split per admin allocation',
            'Exception routing updated for affected stores',
            'Historical data attributed to original pod for LY',
            'Team members reassigned (admin confirms)',
          ].map((label) => (
            <div key={label} className="flex items-center gap-2 text-sm text-gray-700">
              <CheckIcon checked />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm">Cancel</Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => info('Impact Preview: 312 stores affected, 2 new pods to be created, target split: 433 Cr each')}
        >
          Preview Impact
        </Button>
        <Button
          size="sm"
          onClick={() => success(`Pod ${restructureType} executed successfully — 312 stores restructured`)}
        >
          Execute {restructureType === 'split' ? 'Split' : restructureType === 'merge' ? 'Merge' : 'Move'}
        </Button>
      </div>
    </div>
  );
}

// ── Tab 3: User Offboarding ──

type UserActionType = 'deactivate' | 'transfer' | 'change_role';

function UserOffboardingTab() {
  const { success } = useToast();
  const [actionType, setActionType] = useState<UserActionType>('transfer');
  const [replacementUser, setReplacementUser] = useState<string>('');

  const actionOptions: { value: UserActionType; label: string }[] = [
    { value: 'deactivate', label: 'Deactivate — remove access, unassign from all groups' },
    { value: 'transfer', label: 'Transfer — move responsibilities to another user' },
    { value: 'change_role', label: 'Change role — keep user, change their role assignment' },
  ];

  return (
    <div className="space-y-4">
      {/* User Info Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-gray-900">{userData.name}</h3>
          </div>
          <Badge variant="success" dot dotColor="bg-green-500">Active</Badge>
        </div>
        {/* eslint-disable-next-line design-system/prefer-metric-grid -- responsive info layout */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2 text-sm">
          <div>
            <span className="text-gray-500 text-xs block">Role</span>
            <Badge variant="primary" size="sm">{userData.role}</Badge>
          </div>
          <div className="col-span-2">
            <span className="text-gray-500 text-xs block">Primary Assignment</span>
            <span className="text-gray-900 font-medium">{userData.primary}</span>
          </div>
          <div className="col-span-2">
            <span className="text-gray-500 text-xs block">Groups</span>
            <div className="flex flex-wrap gap-1 mt-0.5">
              {userData.groups.map((g) => (
                <Badge key={g} variant="outline" size="sm">{g}</Badge>
              ))}
            </div>
          </div>
          <div>
            <span className="text-gray-500 text-xs block">Open Exceptions</span>
            <span className="text-gray-900 font-semibold">{userData.openExceptions}</span>
          </div>
        </div>
      </div>

      {/* Action Type */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Action Type</h3>
        <div className="flex flex-col gap-2">
          {actionOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setActionType(opt.value)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium text-left transition-all duration-200',
                actionType === opt.value
                  ? 'bg-primary/5 border-primary text-primary'
                  : 'bg-white border-gray-200 text-gray-700 hover:border-primary/30'
              )}
            >
              <span
                className={cn(
                  'w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0',
                  actionType === opt.value ? 'border-primary' : 'border-gray-300'
                )}
              >
                {actionType === opt.value && (
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                )}
              </span>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Transfer Details */}
      {actionType === 'transfer' && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Transfer Details</h3>
          <div className="max-w-sm mb-4">
            {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
            <label className="text-xs font-medium text-gray-700 block mb-1">Select Replacement</label>
            <Select value={replacementUser} onValueChange={setReplacementUser}>
              <SelectTrigger size="sm">
                <SelectValue placeholder="Choose replacement user..." />
              </SelectTrigger>
              <SelectContent>
                {replacementUsers.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name} — {u.role}, {u.region}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-gray-700 mb-2">Transfer Scope</h4>
            <div className="space-y-1.5">
              {[
                'All group memberships transferred',
                'Open exceptions reassigned to replacement',
                'Notification config cloned for new user',
                'Previous user deactivated after transfer',
              ].map((label) => (
                <div key={label} className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckIcon checked />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Deactivate Details */}
      {actionType === 'deactivate' && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
          <h3 className="text-sm font-semibold text-gray-900">Deactivation Effects</h3>
          <div className="space-y-1.5">
            {[
              'Remove from all functional groups',
              'Revoke all platform access (web & mobile)',
              'Unassign from exception routing',
              'Remove from notification lists',
            ].map((label) => (
              <div key={label} className="flex items-center gap-2 text-sm text-gray-700">
                <CheckIcon checked />
                <span>{label}</span>
              </div>
            ))}
          </div>

          <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-3 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-800">
              Pod 9 (West 1) will have no POD Head after deactivation.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">Assign Replacement Now</Button>
            <Button variant="ghost" size="sm">Leave Vacant</Button>
          </div>
        </div>
      )}

      {/* Change Role */}
      {actionType === 'change_role' && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">New Role Assignment</h3>
          <div className="max-w-sm">
            {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
            <label className="text-xs font-medium text-gray-700 block mb-1">New Role</label>
            <Select defaultValue="">
              <SelectTrigger size="sm">
                <SelectValue placeholder="Select new role..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="role-cluster">Cluster Manager</SelectItem>
                <SelectItem value="role-catdir">Category Director</SelectItem>
                <SelectItem value="role-ctops">Control Tower Operator</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Warnings Card */}
      <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-4">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-4 h-4 text-yellow-600" />
          <h3 className="text-sm font-semibold text-yellow-800">Warnings</h3>
        </div>
        <ul className="space-y-1 text-sm text-yellow-800">
          <li className="flex items-start gap-2">
            <Shield className="w-3 h-3 mt-1 shrink-0" />
            Pod 9 (West 1) POD Head role will transfer to {replacementUser ? replacementUsers.find((u) => u.id === replacementUser)?.name ?? 'selected user' : '[selected user]'}
          </li>
          <li className="flex items-start gap-2">
            <Bell className="w-3 h-3 mt-1 shrink-0" />
            3 open exceptions will be reassigned
          </li>
          <li className="flex items-start gap-2">
            <Store className="w-3 h-3 mt-1 shrink-0" />
            159 stores affected by POD Head change
          </li>
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm">Cancel</Button>
        <Button
          size="sm"
          onClick={() => success(`User ${actionType} completed — ${userData.name}'s responsibilities have been ${actionType === 'transfer' ? 'transferred' : actionType === 'deactivate' ? 'removed' : 'updated'}`)}
        >
          Execute {actionType === 'transfer' ? 'Transfer' : actionType === 'deactivate' ? 'Deactivate' : 'Role Change'}
        </Button>
      </div>
    </div>
  );
}

// ── Tab 4: KPI Deprecation ──

function KpiDeprecationTab() {
  const { success } = useToast();
  const [reason, setReason] = useState<string>('');
  const [replacementKpi, setReplacementKpi] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [effectiveDate, setEffectiveDate] = useState<'immediately' | 'scheduled'>('immediately');
  const [scheduledDate, setScheduledDate] = useState<string>('');

  const selectedReplacement = replacementKpis.find((k) => k.id === replacementKpi);

  return (
    <div className="space-y-4">
      {/* KPI Info Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-gray-900">{kpiData.name}</h3>
          </div>
          <Badge variant="success" size="sm">Published</Badge>
        </div>
        {/* eslint-disable-next-line design-system/prefer-metric-grid -- responsive info layout */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-2 text-sm">
          <div>
            <span className="text-gray-500 text-xs block">Code</span>
            <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">{kpiData.code}</code>
          </div>
          <div>
            <span className="text-gray-500 text-xs block">Area</span>
            <span className="text-gray-900 font-medium">{kpiData.area}</span>
          </div>
          <div>
            <span className="text-gray-500 text-xs block">Status</span>
            <Badge variant="primary" size="sm">{kpiData.status}</Badge>
          </div>
          <div>
            <span className="text-gray-500 text-xs block">In Use Since</span>
            <span className="text-gray-900 font-medium">{kpiData.inUseSince}</span>
          </div>
        </div>
      </div>

      {/* Deprecation Details */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Deprecation Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
            <label className="text-xs font-medium text-gray-700 block mb-1">Reason</label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger size="sm">
                <SelectValue placeholder="Select reason..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="replaced">Replaced by new metric</SelectItem>
                <SelectItem value="no_longer_tracked">No longer tracked</SelectItem>
                <SelectItem value="data_source_discontinued">Data source discontinued</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
            <label className="text-xs font-medium text-gray-700 block mb-1">Replacement KPI</label>
            <Select value={replacementKpi} onValueChange={setReplacementKpi}>
              <SelectTrigger size="sm">
                <SelectValue placeholder="Select replacement..." />
              </SelectTrigger>
              <SelectContent>
                {replacementKpis.map((kpi) => (
                  <SelectItem key={kpi.id} value={kpi.id}>
                    {kpi.name} ({kpi.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
            <label className="text-xs font-medium text-gray-700 block mb-1">Notes</label>
            {/* eslint-disable-next-line no-restricted-syntax -- no Textarea primitive yet */}
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes about this deprecation..."
              rows={3}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus-kb:ring-2 focus-kb:ring-primary/20 focus-kb:border-primary"
            />
          </div>
          <div className="md:col-span-2">
            {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
            <label className="text-xs font-medium text-gray-700 block mb-2">Effective Date</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setEffectiveDate('immediately')}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all duration-200',
                  effectiveDate === 'immediately'
                    ? 'bg-primary/5 border-primary text-primary'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-primary/30'
                )}
              >
                <span
                  className={cn(
                    'w-3 h-3 rounded-full border-2 flex items-center justify-center shrink-0',
                    effectiveDate === 'immediately' ? 'border-primary' : 'border-gray-300'
                  )}
                >
                  {effectiveDate === 'immediately' && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                </span>
                Immediately
              </button>
              <button
                onClick={() => setEffectiveDate('scheduled')}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all duration-200',
                  effectiveDate === 'scheduled'
                    ? 'bg-primary/5 border-primary text-primary'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-primary/30'
                )}
              >
                <span
                  className={cn(
                    'w-3 h-3 rounded-full border-2 flex items-center justify-center shrink-0',
                    effectiveDate === 'scheduled' ? 'border-primary' : 'border-gray-300'
                  )}
                >
                  {effectiveDate === 'scheduled' && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                </span>
                Scheduled
              </button>
              {effectiveDate === 'scheduled' && (
                <Input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="h-8 text-xs max-w-[180px]"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Impact Analysis Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Impact Analysis</h3>
        <div className="space-y-3">
          <div>
            <h4 className="text-xs font-semibold text-gray-700 mb-1.5">Visibility</h4>
            {/* eslint-disable-next-line design-system/prefer-metric-grid -- visibility stats, not metric cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-gray-50 rounded-lg p-2.5">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Users className="w-3 h-3 text-gray-500" />
                  <span className="text-xs text-gray-500">Roles</span>
                </div>
                <p className="text-sm font-bold text-gray-900">4</p>
                <p className="text-xs text-gray-500">see this KPI</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2.5">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Layers className="w-3 h-3 text-gray-500" />
                  <span className="text-xs text-gray-500">Groups</span>
                </div>
                <p className="text-sm font-bold text-gray-900">8</p>
                <p className="text-xs text-gray-500">have it assigned</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2.5">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <MapPin className="w-3 h-3 text-gray-500" />
                  <span className="text-xs text-gray-500">Mobile Layouts</span>
                </div>
                <p className="text-sm font-bold text-gray-900">2</p>
                <p className="text-xs text-gray-500">include it</p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-gray-700 mb-1.5">Exception Rules</h4>
            <div className="flex items-center gap-4 text-sm text-gray-700">
              <span><span className="font-semibold">3</span> active rules will be disabled</span>
              <span><span className="font-semibold">2</span> open exceptions auto-closed</span>
            </div>
          </div>

          {selectedReplacement && (
            <div>
              <h4 className="text-xs font-semibold text-gray-700 mb-1.5">Replacement Auto-Substitution Preview</h4>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckIcon checked />
                  <span>Dashboard tiles &rarr; {selectedReplacement.name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckIcon checked />
                  <span>Mobile cards &rarr; {selectedReplacement.name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckIcon checked />
                  <span>Exception rules &rarr; new rules created (draft)</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cascade Effects */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Cascade Effects</h3>
        <div className="space-y-1.5">
          {[
            'Remove from all KPI groups and mobile layouts',
            'Disable exception generation for this KPI',
            'Mark as "Deprecated" in KPI library (not deleted)',
            'Historical data preserved for reporting',
            'Auto-substitute replacement in dashboards',
            'Notify all affected users',
            'Audit log entry with deprecation reason',
          ].map((label) => (
            <div key={label} className="flex items-center gap-2 text-sm text-gray-700">
              <CheckIcon checked />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm">Cancel</Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => success(`KPI "${kpiData.name}" deprecated successfully — all cascade effects applied`)}
        >
          Deprecate KPI
        </Button>
      </div>
    </div>
  );
}

// ── Main Page ──

export function AdminLifecyclePage() {
  return (
    <div className="relative">
      <div className="absolute inset-0 z-10 flex items-start justify-center pt-48 bg-white/60 rounded-lg">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <Store className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-sm font-semibold text-gray-500">Coming Soon</p>
          <p className="text-xs text-gray-400 mt-1">Platform configuration is under development</p>
        </div>
      </div>
    <div className="space-y-4 pointer-events-none select-none opacity-40 grayscale">
      <PageHeader title="Lifecycle Management" />

      {/* Summary Cards */}
      <MetricGrid columns={4}>
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="flex items-center gap-2 mb-1">
            <Store className="w-4 h-4 text-primary" />
            <span className="text-xs text-gray-500">Store Transitions</span>
          </div>
          <p className="text-xl font-bold text-gray-900">18</p>
          <p className="text-xs text-gray-500">this quarter</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="flex items-center gap-2 mb-1">
            <Layers className="w-4 h-4 text-secondary" />
            <span className="text-xs text-gray-500">Pod Changes</span>
          </div>
          <p className="text-xl font-bold text-gray-900">3</p>
          <p className="text-xs text-gray-500">pending restructures</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="flex items-center gap-2 mb-1">
            <UserMinus className="w-4 h-4 text-warning" />
            <span className="text-xs text-gray-500">User Changes</span>
          </div>
          <p className="text-xl font-bold text-gray-900">7</p>
          <p className="text-xs text-gray-500">offboarded this month</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="w-4 h-4 text-error" />
            <span className="text-xs text-gray-500">KPI Deprecations</span>
          </div>
          <p className="text-xl font-bold text-gray-900">2</p>
          <p className="text-xs text-gray-500">in last 6 months</p>
        </div>
      </MetricGrid>

      {/* Tabs */}
      <Tabs defaultValue="store">
        <TabsList>
          <TabsTrigger value="store">Store Lifecycle</TabsTrigger>
          <TabsTrigger value="pod">Pod Restructuring</TabsTrigger>
          <TabsTrigger value="user">User Offboarding</TabsTrigger>
          <TabsTrigger value="kpi">KPI Deprecation</TabsTrigger>
        </TabsList>

        <TabsContent value="store">
          <StoreLifecycleTab />
        </TabsContent>

        <TabsContent value="pod">
          <PodRestructuringTab />
        </TabsContent>

        <TabsContent value="user">
          <UserOffboardingTab />
        </TabsContent>

        <TabsContent value="kpi">
          <KpiDeprecationTab />
        </TabsContent>
      </Tabs>
    </div>
    </div>
  );
}
