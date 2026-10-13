import { useState } from 'react';
import { Settings2 } from 'lucide-react';
import { Badge, Input, SectionHeader, EmptyState } from '@/components/ui';
import { cn } from '@/lib/utils';

const STAGES = [
  {
    name: 'Stage 1: Designer Curation',
    gateRequired: false,
    gateLabel: '',
    autonomy: 'T3 — Creative',
    passRate: '40%',
    severity: 'S3',
    milestone: '',
    sla: '',
  },
  {
    name: 'Stage 2: Buyer Evaluation',
    gateRequired: true,
    gateLabel: 'style-closure',
    autonomy: 'T3',
    passRate: '50%',
    severity: 'S2',
    milestone: 'N-20',
    sla: '48 hours',
  },
  {
    name: 'Stage 3: Category Head Approval',
    gateRequired: true,
    gateLabel: 'range-review',
    autonomy: 'T2',
    passRate: '80%',
    severity: 'S2',
    milestone: 'N-15',
    sla: '24 hours',
  },
];

const POD_ASSIGNMENTS = [
  { pod: 'MW-1 Men Formal', designer: 'Arjun Kapoor', buyer: 'Neha Sharma', catHead: 'Rajesh Mehta' },
  { pod: 'MW-2 Men Casual', designer: 'Priya Sharma', buyer: 'Amit Patel', catHead: 'Rajesh Mehta' },
  { pod: 'MW-3 Men Ethnic', designer: 'Vikram Das', buyer: 'Sunita Roy', catHead: 'Rajesh Mehta' },
  { pod: 'WW-1 Women Western', designer: 'Kavita Singh', buyer: 'Deepa Reddy', catHead: 'Sunita Iyer' },
  { pod: 'WW-2 Women Ethnic', designer: 'Meera Nair', buyer: 'Ritu Gupta', catHead: 'Sunita Iyer' },
  { pod: 'KW-1 Kids Wear', designer: 'Ananya Bose', buyer: 'Rahul Verma', catHead: 'Sunita Iyer' },
];

export function AdminShowroomPage() {
  const [gates, setGates] = useState(STAGES.map((s) => s.gateRequired));
  const [minMargin, setMinMargin] = useState(53);
  const [autoReject, setAutoReject] = useState(false);
  const [rebuyThreshold, setRebuyThreshold] = useState(80);
  const [maxVendorConc, setMaxVendorConc] = useState(30);

  return (
    <div className="relative">
      <div className="absolute inset-0 z-10 flex items-start justify-center pt-48 bg-white/60 rounded-lg">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <Settings2 className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-sm font-semibold text-gray-500">Coming Soon</p>
          <p className="text-xs text-gray-400 mt-1">Module configuration is under development</p>
        </div>
      </div>
    <div className="space-y-6 pointer-events-none select-none opacity-40 grayscale">
      {/* Approval Flow */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <SectionHeader title="Approval Flow" className="mb-4" />
        <div className="divide-y divide-gray-100">
          {STAGES.map((stage, idx) => (
            <div key={idx} className="py-4 first:pt-0 last:pb-0">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">{stage.name}</h4>
              {/* eslint-disable-next-line design-system/prefer-metric-grid -- config layout */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-gray-500">Gate Required</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const newGates = [...gates];
                        newGates[idx] = !newGates[idx];
                        setGates(newGates);
                      }}
                      className={cn(
                        'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
                        gates[idx] ? 'bg-primary' : 'bg-gray-200'
                      )}
                    >
                      <span className={cn(
                        'inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform shadow-sm',
                        gates[idx] ? 'translate-x-4.5' : 'translate-x-0.5'
                      )} />
                    </button>
                    {stage.gateLabel && (
                      <span className="text-xs text-gray-400">{stage.gateLabel}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-gray-500">Autonomy</span>
                  <span className="text-sm font-medium text-gray-900">{stage.autonomy}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-gray-500">Severity</span>
                  <Badge variant={stage.severity === 'S2' ? 'warning' : 'default'}>
                    {stage.severity}
                  </Badge>
                </div>
                {stage.milestone && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm text-gray-500">Calendar Milestone</span>
                    <span className="text-sm font-medium text-gray-900">{stage.milestone}</span>
                  </div>
                )}
                {stage.sla && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm text-gray-500">SLA</span>
                    <span className="text-sm font-medium text-gray-900">{stage.sla}</span>
                  </div>
                )}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-gray-500">Pass Rate Guide</span>
                  <span className="text-sm font-medium text-gray-900">{stage.passRate}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Margin & Commercial Rules */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <SectionHeader title="Margin & Commercial Rules" className="mb-4" />
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <span className="text-sm font-medium text-gray-900">Minimum Intake Margin</span>
              <p className="text-xs text-gray-500">Styles below this threshold are flagged</p>
            </div>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                value={minMargin}
                onChange={(e) => setMinMargin(Number(e.target.value))}
                className="w-16 py-1.5 text-sm text-right"
              />
              <span className="text-sm text-gray-500">%</span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <div>
              <span className="text-sm font-medium text-gray-900">Auto-reject below threshold</span>
              <p className="text-xs text-gray-500">Automatically flag and hide styles below margin floor</p>
            </div>
            <button
              onClick={() => setAutoReject(!autoReject)}
              className={cn(
                'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
                autoReject ? 'bg-primary' : 'bg-gray-200'
              )}
            >
              <span className={cn(
                'inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform shadow-sm',
                autoReject ? 'translate-x-4.5' : 'translate-x-0.5'
              )} />
            </button>
          </div>

          <div className="flex items-center justify-between gap-2">
            <div>
              <span className="text-sm font-medium text-gray-900">Re-buy auto-surface threshold</span>
              <p className="text-xs text-gray-500">Sell-through rate above which re-buys auto-surface</p>
            </div>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                value={rebuyThreshold}
                onChange={(e) => setRebuyThreshold(Number(e.target.value))}
                className="w-16 py-1.5 text-sm text-right"
              />
              <span className="text-sm text-gray-500">%</span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <div>
              <span className="text-sm font-medium text-gray-900">Max vendor concentration</span>
              <p className="text-xs text-gray-500">Maximum share of collection from a single vendor</p>
            </div>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                value={maxVendorConc}
                onChange={(e) => setMaxVendorConc(Number(e.target.value))}
                className="w-16 py-1.5 text-sm text-right"
              />
              <span className="text-sm text-gray-500">%</span>
            </div>
          </div>
        </div>
      </div>

      {/* POD Assignments */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <SectionHeader title="POD Assignments" className="mb-4" />
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">POD</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Designer</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Buyer</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category Head</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {POD_ASSIGNMENTS.length === 0 ? (
                <tr><td colSpan={4}><EmptyState description="No POD assignments configured" /></td></tr>
              ) : POD_ASSIGNMENTS.map((row) => (
                <tr key={row.pod} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.pod}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 hover:text-primary cursor-pointer">{row.designer}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 hover:text-primary cursor-pointer">{row.buyer}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 hover:text-primary cursor-pointer">{row.catHead}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    </div>
  );
}
