import { useState } from 'react';
import {
  Calendar,
  AlertTriangle,
  ShieldCheck,
  Zap,
  ArrowRightLeft,
  Clock,
  Save,
  RotateCcw,
  Info,
} from 'lucide-react';
import {
  Badge,
  Button,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Input,
  Switch,
  PageHeader,
} from '@/components/ui';
import { cn } from '@/lib/utils';

// ── Default Values ──

const defaultMilestones = {
  planStart: 180,
  planEnd: 35,
  buyStart: 34,
  buyEnd: 14,
  makeStart: 14,
  makeEnd: 7,
  moveStart: 7,
  moveEnd: 1,
};

const defaultAgentSLAs = {
  detectionLatency: 60,
  alertDelivery: 15,
  cascadeAnalysis: 5,
};

const defaultExceptionThresholds = {
  s1HealthThreshold: 70,
  s2MissedDays: 2,
  s3ApproachingDays: 7,
  s4InformationalDays: 14,
  s1EscalationMinutes: 15,
  s2EscalationMinutes: 60,
  s3EscalationMinutes: 240,
  s4EscalationMinutes: 1440,
};

interface GateConfig {
  type: string;
  label: string;
  defaultSlaHours: number;
  autoApproveHours: number | null;
  escalateTo: string;
  dualSignOff: boolean;
}

const defaultGates: GateConfig[] = [
  { type: 'otb-approval', label: 'OTB Approval', defaultSlaHours: 24, autoApproveHours: null, escalateTo: 'Head of Buying', dualSignOff: true },
  { type: 'otb-lock', label: 'OTB Lock', defaultSlaHours: 12, autoApproveHours: null, escalateTo: 'Head of Buying', dualSignOff: true },
  { type: 'style-closure', label: 'Style Closure', defaultSlaHours: 12, autoApproveHours: null, escalateTo: 'Category Head', dualSignOff: false },
  { type: 'buy-plan', label: 'Buy Plan', defaultSlaHours: 24, autoApproveHours: null, escalateTo: 'Head of Buying', dualSignOff: true },
  { type: 'space-plan', label: 'Space Plan', defaultSlaHours: 24, autoApproveHours: null, escalateTo: 'Head of VM', dualSignOff: false },
  { type: 'capacity-booking', label: 'Capacity Booking', defaultSlaHours: 24, autoApproveHours: null, escalateTo: 'Head of Sourcing', dualSignOff: false },
  { type: 'range-review', label: 'Range Review', defaultSlaHours: 24, autoApproveHours: null, escalateTo: 'Category Head', dualSignOff: false },
  { type: 'sm-validation', label: 'SM Validation', defaultSlaHours: 48, autoApproveHours: 48, escalateTo: 'Regional Manager', dualSignOff: false },
  { type: 'phase-transition', label: 'Phase Transition', defaultSlaHours: 12, autoApproveHours: null, escalateTo: 'Head of Ops', dualSignOff: false },
  { type: 'liquidation-routing', label: 'Liquidation Routing', defaultSlaHours: 12, autoApproveHours: null, escalateTo: 'Head of Trading', dualSignOff: false },
  { type: 'chase-order', label: 'Chase Order', defaultSlaHours: 8, autoApproveHours: null, escalateTo: 'Head of Buying', dualSignOff: false },
  { type: 'below-cost-markdown', label: 'Below-Cost Markdown', defaultSlaHours: 24, autoApproveHours: null, escalateTo: 'CFO + Head of Trading', dualSignOff: true },
];

const defaultSourcingEngines = {
  fastResponse: {
    milestoneCount: 28,
    day7CheckpointEnabled: true,
    day14CheckpointEnabled: true,
    prebookChaseSplit: '60:40',
    chaseDecisionDay: 7,
    chaseConfirmationDay: 14,
  },
  scaleMargin: {
    reorderPointThreshold: 14,
    safetyStockDays: 7,
    autoPOEnabled: true,
  },
  testRepeat: {
    testStoreCount: 80,
    sellThroughThreshold: 65,
    scaleDecisionDay: 7,
    microDropMaxStyles: 50,
    otbReservePercent: 5,
  },
};

interface PhaseGateConfig {
  from: string;
  to: string;
  requiredMilestones: string[];
  blockIfIncomplete: boolean;
  autoNotify: boolean;
}

const defaultPhaseGates: PhaseGateConfig[] = [
  {
    from: 'PLAN',
    to: 'BUY',
    requiredMilestones: ['Range Architecture', 'Space Plan', 'Capacity Booking', 'OTB Approval'],
    blockIfIncomplete: true,
    autoNotify: true,
  },
  {
    from: 'BUY',
    to: 'MAKE',
    requiredMilestones: ['Buy Plan Approval', 'Style Closure', 'Vendor PO Confirmation'],
    blockIfIncomplete: true,
    autoNotify: true,
  },
  {
    from: 'MAKE',
    to: 'MOVE',
    requiredMilestones: ['Production Complete', 'Quality Check', 'Logistics Booking'],
    blockIfIncomplete: true,
    autoNotify: true,
  },
  {
    from: 'MOVE',
    to: 'SELL',
    requiredMilestones: ['Stock Received', 'VM Setup', 'SM Validation'],
    blockIfIncomplete: false,
    autoNotify: true,
  },
];

// ── Tab 1: Milestones ──

function MilestonesTab() {
  const [milestones, setMilestones] = useState(defaultMilestones);
  const [agentSLAs, setAgentSLAs] = useState(defaultAgentSLAs);

  const phaseFields = [
    { label: 'PLAN Phase Start', key: 'planStart' as const, suffix: 'N-' },
    { label: 'PLAN Phase End', key: 'planEnd' as const, suffix: 'N-' },
    { label: 'BUY Phase Start', key: 'buyStart' as const, suffix: 'N-' },
    { label: 'BUY Phase End', key: 'buyEnd' as const, suffix: 'N-' },
    { label: 'MAKE Phase Start', key: 'makeStart' as const, suffix: 'N-' },
    { label: 'MAKE Phase End', key: 'makeEnd' as const, suffix: 'N-' },
    { label: 'MOVE Phase Start', key: 'moveStart' as const, suffix: 'N-' },
    { label: 'MOVE Phase End', key: 'moveEnd' as const, suffix: 'N-' },
  ];

  const slaFields = [
    { label: 'Detection Latency SLO', key: 'detectionLatency' as const, unit: 'minutes' },
    { label: 'Alert Delivery SLO', key: 'alertDelivery' as const, unit: 'minutes' },
    { label: 'Cascade Analysis SLO', key: 'cascadeAnalysis' as const, unit: 'minutes' },
  ];

  return (
    <div className="space-y-4">
      {/* Phase Boundaries */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-gray-900">Phase Boundaries</h3>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          {phaseFields.map((field) => (
            <div key={field.key} className="flex items-center justify-between gap-2">
              <label className="text-sm text-gray-700 whitespace-nowrap">{field.label}</label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-mono">{field.suffix}</span>
                <Input
                  type="number"
                  value={milestones[field.key]}
                  onChange={(e) =>
                    setMilestones((prev) => ({
                      ...prev,
                      [field.key]: parseInt(e.target.value) || 0,
                    }))
                  }
                  className="w-20 text-center text-sm h-8"
                />
                <span className="text-xs text-gray-500">days</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Calendar Monitor Agent (A14) SLA Settings */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-gray-900">Calendar Monitor Agent (A14) SLA Settings</h3>
        </div>
        <div className="space-y-3">
          {slaFields.map((field) => (
            <div key={field.key} className="flex items-center justify-between gap-2">
              <label className="text-sm text-gray-700">{field.label}</label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={agentSLAs[field.key]}
                  onChange={(e) =>
                    setAgentSLAs((prev) => ({
                      ...prev,
                      [field.key]: parseInt(e.target.value) || 0,
                    }))
                  }
                  className="w-20 text-center text-sm h-8"
                />
                <span className="text-xs text-gray-500">{field.unit}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => {
            setMilestones(defaultMilestones);
            setAgentSLAs(defaultAgentSLAs);
          }}
        >
          <RotateCcw className="w-3 h-3 mr-1" />
          Reset to Defaults
        </Button>
        <Button>
          <Save className="w-3 h-3 mr-1" />
          Save Changes
        </Button>
      </div>
    </div>
  );
}

// ── Tab 2: Exceptions ──

function ExceptionsTab() {
  const [thresholds, setThresholds] = useState(defaultExceptionThresholds);

  const severityRows = [
    {
      severity: 'S1',
      label: 'Calendar health drops below',
      key: 's1HealthThreshold' as const,
      unit: '%',
      variant: 'error' as const,
      escalationKey: 's1EscalationMinutes' as const,
    },
    {
      severity: 'S2',
      label: 'Milestone missed by',
      key: 's2MissedDays' as const,
      unit: 'days',
      variant: 'warning' as const,
      escalationKey: 's2EscalationMinutes' as const,
    },
    {
      severity: 'S3',
      label: 'Approaching deadline within',
      key: 's3ApproachingDays' as const,
      unit: 'days',
      variant: 'default' as const,
      escalationKey: 's3EscalationMinutes' as const,
    },
    {
      severity: 'S4',
      label: 'Informational threshold',
      key: 's4InformationalDays' as const,
      unit: 'days',
      variant: 'outline' as const,
      escalationKey: 's4EscalationMinutes' as const,
    },
  ];

  const formatEscalationTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    if (minutes < 1440) return `${minutes / 60} hr`;
    return `${minutes / 1440} day`;
  };

  return (
    <div className="space-y-4">
      {/* Severity Thresholds */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-gray-900">Exception Severity Thresholds</h3>
        </div>
        <div className="space-y-3">
          {severityRows.map((row) => (
            <div
              key={row.severity}
              className="flex items-center justify-between gap-2 py-2 border-b border-gray-50 last:border-0"
            >
              <div className="flex items-center gap-3">
                <Badge
                  variant={row.variant}
                  className={cn(row.variant === 'outline' && 'text-gray-500 border-gray-300')}
                >
                  {row.severity}
                </Badge>
                <span className="text-sm text-gray-700">{row.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={thresholds[row.key]}
                  onChange={(e) =>
                    setThresholds((prev) => ({
                      ...prev,
                      [row.key]: parseInt(e.target.value) || 0,
                    }))
                  }
                  className="w-20 text-center text-sm h-8"
                />
                <span className="text-xs text-gray-500">{row.unit}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Auto-Escalation Timing */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-gray-900">Auto-Escalation Timing</h3>
        </div>
        <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left text-xs font-medium text-gray-500 pb-2">Severity</th>
              <th className="text-left text-xs font-medium text-gray-500 pb-2">Escalation After</th>
              <th className="text-left text-xs font-medium text-gray-500 pb-2">Escalate To</th>
            </tr>
          </thead>
          <tbody>
            {severityRows.map((row) => (
              <tr key={row.severity} className="border-b border-gray-50 last:border-0">
                <td className="py-2.5">
                  <Badge
                    variant={row.variant}
                    className={cn(row.variant === 'outline' && 'text-gray-500 border-gray-300')}
                  >
                    {row.severity}
                  </Badge>
                </td>
                <td className="py-2.5">
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={thresholds[row.escalationKey]}
                      onChange={(e) =>
                        setThresholds((prev) => ({
                          ...prev,
                          [row.escalationKey]: parseInt(e.target.value) || 0,
                        }))
                      }
                      className="w-20 text-center text-sm h-8"
                    />
                    <span className="text-xs text-gray-500">min ({formatEscalationTime(thresholds[row.escalationKey])})</span>
                  </div>
                </td>
                <td className="py-2.5 text-sm text-gray-700">
                  {row.severity === 'S1' && 'CEO / Business Head'}
                  {row.severity === 'S2' && 'Head of Operations'}
                  {row.severity === 'S3' && 'Category Head'}
                  {row.severity === 'S4' && 'Pod Lead (auto-assign)'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {/* Info note */}
      <div className="flex items-center gap-2 px-1">
        <Info className="w-3 h-3 text-gray-400 shrink-0" />
        <span className="text-xs text-gray-500">
          Escalation timing is measured from the moment the exception is generated. S1 exceptions also trigger an immediate Slack/Teams notification.
        </span>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => setThresholds(defaultExceptionThresholds)}
        >
          <RotateCcw className="w-3 h-3 mr-1" />
          Reset to Defaults
        </Button>
        <Button>
          <Save className="w-3 h-3 mr-1" />
          Save Changes
        </Button>
      </div>
    </div>
  );
}

// ── Tab 3: Human Gates ──

function HumanGatesTab() {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-gray-900">Gate SLA Defaults</h3>
          <Badge variant="default" size="sm">12 gates</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Gate Type</th>
                <th className="text-center px-3 py-2 text-xs font-medium text-gray-500">Default SLA (hrs)</th>
                <th className="text-center px-3 py-2 text-xs font-medium text-gray-500">Auto-Approve After (hrs)</th>
                <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Escalate To</th>
                <th className="text-center px-3 py-2 text-xs font-medium text-gray-500">Dual Sign-off</th>
              </tr>
            </thead>
            <tbody>
              {defaultGates.map((gate) => (
                <tr key={gate.type} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{gate.label}</span>
                      <span className="text-xs text-gray-500 font-mono">{gate.type}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-center text-sm text-gray-700">{gate.defaultSlaHours}h</td>
                  <td className="px-3 py-2.5 text-center text-sm text-gray-700">
                    {gate.autoApproveHours !== null ? `${gate.autoApproveHours}h` : (
                      <span className="text-gray-500">--</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-sm text-gray-700">{gate.escalateTo}</td>
                  <td className="px-3 py-2.5 text-center">
                    {gate.dualSignOff ? (
                      <Badge variant="primary" size="sm">Required</Badge>
                    ) : (
                      <span className="text-xs text-gray-500">No</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info note */}
      <div className="flex items-center gap-2 px-1">
        <Info className="w-3 h-3 text-gray-400 shrink-0" />
        <span className="text-xs text-gray-500">
          Auto-Approve is only available for SM Validation gates. Dual sign-off requires approval from both the primary approver and a secondary authority (e.g., CFO for below-cost markdowns).
        </span>
      </div>
    </div>
  );
}

// ── Tab 4: Sourcing Engines ──

function SourcingEnginesTab() {
  const [fastResponse, setFastResponse] = useState(defaultSourcingEngines.fastResponse);
  const [scaleMargin, setScaleMargin] = useState(defaultSourcingEngines.scaleMargin);
  const [testRepeat, setTestRepeat] = useState(defaultSourcingEngines.testRepeat);

  return (
    <div className="space-y-4">
      {/* Fast Response */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-gray-900">Fast Response</h3>
          <Badge variant="primary" size="sm">60% of drops</Badge>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          <div className="flex items-center justify-between gap-2">
            {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
            <label className="text-sm text-gray-700">Milestone Count</label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={fastResponse.milestoneCount}
                onChange={(e) =>
                  setFastResponse((prev) => ({
                    ...prev,
                    milestoneCount: parseInt(e.target.value) || 0,
                  }))
                }
                className="w-20 text-center text-sm h-8"
              />
              <span className="text-xs text-gray-500">milestones</span>
            </div>
          </div>
          <div className="flex items-center justify-between gap-2">
            {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
            <label className="text-sm text-gray-700">Pre-book:Chase Split</label>
            <div className="flex items-center gap-2">
              <Input
                type="text"
                value={fastResponse.prebookChaseSplit}
                onChange={(e) =>
                  setFastResponse((prev) => ({
                    ...prev,
                    prebookChaseSplit: e.target.value,
                  }))
                }
                className="w-20 text-center text-sm h-8"
              />
            </div>
          </div>
          <div className="flex items-center justify-between gap-2">
            {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
            <label className="text-sm text-gray-700">Chase Decision Day</label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={fastResponse.chaseDecisionDay}
                onChange={(e) =>
                  setFastResponse((prev) => ({
                    ...prev,
                    chaseDecisionDay: parseInt(e.target.value) || 0,
                  }))
                }
                className="w-20 text-center text-sm h-8"
              />
              <span className="text-xs text-gray-500">day</span>
            </div>
          </div>
          <div className="flex items-center justify-between gap-2">
            {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
            <label className="text-sm text-gray-700">Chase Confirmation Day</label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={fastResponse.chaseConfirmationDay}
                onChange={(e) =>
                  setFastResponse((prev) => ({
                    ...prev,
                    chaseConfirmationDay: parseInt(e.target.value) || 0,
                  }))
                }
                className="w-20 text-center text-sm h-8"
              />
              <span className="text-xs text-gray-500">day</span>
            </div>
          </div>
          <div className="flex items-center justify-between gap-2">
            {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
            <label className="text-sm text-gray-700">Day 7 Checkpoint</label>
            <Switch
              checked={fastResponse.day7CheckpointEnabled}
              onCheckedChange={(checked) =>
                setFastResponse((prev) => ({ ...prev, day7CheckpointEnabled: checked }))
              }
              aria-label="Toggle Day 7 Checkpoint"
            />
          </div>
          <div className="flex items-center justify-between gap-2">
            {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
            <label className="text-sm text-gray-700">Day 14 Checkpoint</label>
            <Switch
              checked={fastResponse.day14CheckpointEnabled}
              onCheckedChange={(checked) =>
                setFastResponse((prev) => ({ ...prev, day14CheckpointEnabled: checked }))
              }
              aria-label="Toggle Day 14 Checkpoint"
            />
          </div>
        </div>
      </div>

      {/* Scale Margin */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <ArrowRightLeft className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-gray-900">Scale Margin</h3>
          <Badge variant="success" size="sm">30% of drops</Badge>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          <div className="flex items-center justify-between gap-2">
            {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
            <label className="text-sm text-gray-700">Reorder Point Threshold</label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={scaleMargin.reorderPointThreshold}
                onChange={(e) =>
                  setScaleMargin((prev) => ({
                    ...prev,
                    reorderPointThreshold: parseInt(e.target.value) || 0,
                  }))
                }
                className="w-20 text-center text-sm h-8"
              />
              <span className="text-xs text-gray-500">days cover</span>
            </div>
          </div>
          <div className="flex items-center justify-between gap-2">
            {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
            <label className="text-sm text-gray-700">Safety Stock Days</label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={scaleMargin.safetyStockDays}
                onChange={(e) =>
                  setScaleMargin((prev) => ({
                    ...prev,
                    safetyStockDays: parseInt(e.target.value) || 0,
                  }))
                }
                className="w-20 text-center text-sm h-8"
              />
              <span className="text-xs text-gray-500">days</span>
            </div>
          </div>
          <div className="flex items-center justify-between gap-2">
            {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
            <label className="text-sm text-gray-700">Auto-PO Generation</label>
            <Switch
              checked={scaleMargin.autoPOEnabled}
              onCheckedChange={(checked) =>
                setScaleMargin((prev) => ({ ...prev, autoPOEnabled: checked }))
              }
              aria-label="Toggle Auto-PO Generation"
            />
          </div>
        </div>
      </div>

      {/* Test & Repeat */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <RotateCcw className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-gray-900">Test & Repeat</h3>
          <Badge variant="warning" size="sm">10% of drops</Badge>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          <div className="flex items-center justify-between gap-2">
            {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
            <label className="text-sm text-gray-700">Test Store Count</label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={testRepeat.testStoreCount}
                onChange={(e) =>
                  setTestRepeat((prev) => ({
                    ...prev,
                    testStoreCount: parseInt(e.target.value) || 0,
                  }))
                }
                className="w-20 text-center text-sm h-8"
              />
              <span className="text-xs text-gray-500">stores</span>
            </div>
          </div>
          <div className="flex items-center justify-between gap-2">
            {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
            <label className="text-sm text-gray-700">Sell-Through Threshold for Scale</label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={testRepeat.sellThroughThreshold}
                onChange={(e) =>
                  setTestRepeat((prev) => ({
                    ...prev,
                    sellThroughThreshold: parseInt(e.target.value) || 0,
                  }))
                }
                className="w-20 text-center text-sm h-8"
              />
              <span className="text-xs text-gray-500">%</span>
            </div>
          </div>
          <div className="flex items-center justify-between gap-2">
            {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
            <label className="text-sm text-gray-700">Scale Decision Day</label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={testRepeat.scaleDecisionDay}
                onChange={(e) =>
                  setTestRepeat((prev) => ({
                    ...prev,
                    scaleDecisionDay: parseInt(e.target.value) || 0,
                  }))
                }
                className="w-20 text-center text-sm h-8"
              />
              <span className="text-xs text-gray-500">day</span>
            </div>
          </div>
          <div className="flex items-center justify-between gap-2">
            {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
            <label className="text-sm text-gray-700">Micro-Drop Max Styles</label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={testRepeat.microDropMaxStyles}
                onChange={(e) =>
                  setTestRepeat((prev) => ({
                    ...prev,
                    microDropMaxStyles: parseInt(e.target.value) || 0,
                  }))
                }
                className="w-20 text-center text-sm h-8"
              />
              <span className="text-xs text-gray-500">styles</span>
            </div>
          </div>
          <div className="flex items-center justify-between gap-2">
            {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
            <label className="text-sm text-gray-700">OTB Reserve</label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={testRepeat.otbReservePercent}
                onChange={(e) =>
                  setTestRepeat((prev) => ({
                    ...prev,
                    otbReservePercent: parseInt(e.target.value) || 0,
                  }))
                }
                className="w-20 text-center text-sm h-8"
              />
              <span className="text-xs text-gray-500">%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => {
            setFastResponse(defaultSourcingEngines.fastResponse);
            setScaleMargin(defaultSourcingEngines.scaleMargin);
            setTestRepeat(defaultSourcingEngines.testRepeat);
          }}
        >
          <RotateCcw className="w-3 h-3 mr-1" />
          Reset to Defaults
        </Button>
        <Button>
          <Save className="w-3 h-3 mr-1" />
          Save Changes
        </Button>
      </div>
    </div>
  );
}

// ── Tab 5: Phase Gates ──

function PhaseGatesTab() {
  const [gates, setGates] = useState(defaultPhaseGates);

  const phaseColors: Record<string, string> = {
    PLAN: 'bg-blue-100 text-blue-700',
    BUY: 'bg-purple-100 text-purple-700',
    MAKE: 'bg-amber-100 text-amber-700',
    MOVE: 'bg-green-100 text-green-700',
    SELL: 'bg-red-100 text-red-700',
  };

  return (
    <div className="space-y-4">
      {gates.map((gate, index) => (
        <div key={`${gate.from}-${gate.to}`} className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <ArrowRightLeft className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-gray-900">
              <span className={cn('px-1.5 py-0.5 rounded text-xs font-medium', phaseColors[gate.from])}>
                {gate.from}
              </span>
              <span className="mx-1.5 text-gray-500">to</span>
              <span className={cn('px-1.5 py-0.5 rounded text-xs font-medium', phaseColors[gate.to])}>
                {gate.to}
              </span>
            </h3>
          </div>

          {/* Required Milestones */}
          <div className="mb-3">
            <span className="text-xs text-gray-500">Required Milestones Before Transition</span>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {gate.requiredMilestones.map((milestone) => (
                <span
                  key={milestone}
                  className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700"
                >
                  {milestone}
                </span>
              ))}
            </div>
          </div>

          {/* Toggle Settings */}
          <div className="flex items-center gap-6 pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between gap-2 flex-1">
              <div>
                <p className="text-sm text-gray-900">Block transition if incomplete</p>
                <p className="text-xs text-gray-500">Prevent phase transition until all milestones are done</p>
              </div>
              <Switch
                checked={gate.blockIfIncomplete}
                onCheckedChange={(checked) =>
                  setGates((prev) =>
                    prev.map((g, i) =>
                      i === index ? { ...g, blockIfIncomplete: checked } : g
                    )
                  )
                }
                aria-label={`Block ${gate.from} to ${gate.to} transition if incomplete`}
              />
            </div>
            <div className="w-px h-8 bg-gray-200" />
            <div className="flex items-center justify-between gap-2 flex-1">
              <div>
                <p className="text-sm text-gray-900">Auto-notify on transition</p>
                <p className="text-xs text-gray-500">Send notifications when phase transition occurs</p>
              </div>
              <Switch
                checked={gate.autoNotify}
                onCheckedChange={(checked) =>
                  setGates((prev) =>
                    prev.map((g, i) =>
                      i === index ? { ...g, autoNotify: checked } : g
                    )
                  )
                }
                aria-label={`Auto-notify on ${gate.from} to ${gate.to} transition`}
              />
            </div>
          </div>
        </div>
      ))}

      {/* Info note */}
      <div className="flex items-center gap-2 px-1">
        <Info className="w-3 h-3 text-gray-400 shrink-0" />
        <span className="text-xs text-gray-500">
          The MOVE to SELL transition is not blocked by default because SM Validation has an auto-approve fallback after 48 hours.
        </span>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => setGates(defaultPhaseGates)}
        >
          <RotateCcw className="w-3 h-3 mr-1" />
          Reset to Defaults
        </Button>
        <Button>
          <Save className="w-3 h-3 mr-1" />
          Save Changes
        </Button>
      </div>
    </div>
  );
}

// ── Main Page ──

export function AdminCalendarConfigPage() {
  return (
    <div className="relative">
      <div className="absolute inset-0 z-10 flex items-start justify-center pt-48 bg-white/60 rounded-lg">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <Calendar className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-sm font-semibold text-gray-500">Coming Soon</p>
          <p className="text-xs text-gray-400 mt-1">Module configuration is under development</p>
        </div>
      </div>
    <div className="space-y-4 pointer-events-none select-none opacity-40 grayscale">
      <PageHeader title="Calendar Configuration" />

      <Tabs defaultValue="milestones">
        <TabsList>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          <TabsTrigger value="exceptions">Exceptions</TabsTrigger>
          <TabsTrigger value="gates">Human Gates</TabsTrigger>
          <TabsTrigger value="sourcing">Sourcing Engines</TabsTrigger>
          <TabsTrigger value="phases">Phase Gates</TabsTrigger>
        </TabsList>

        <TabsContent value="milestones">
          <MilestonesTab />
        </TabsContent>

        <TabsContent value="exceptions">
          <ExceptionsTab />
        </TabsContent>

        <TabsContent value="gates">
          <HumanGatesTab />
        </TabsContent>

        <TabsContent value="sourcing">
          <SourcingEnginesTab />
        </TabsContent>

        <TabsContent value="phases">
          <PhaseGatesTab />
        </TabsContent>
      </Tabs>
    </div>
    </div>
  );
}
