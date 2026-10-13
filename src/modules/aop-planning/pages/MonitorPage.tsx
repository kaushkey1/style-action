import { useParams } from 'react-router-dom';
import {
  PageHeader,
  SectionHeader,
  EmptyState,
  Badge,
  Button,
  Alert,
  AlertContent,
  AlertTitle,
  AlertDescription,
} from '@/components/ui';
import { cn } from '@/lib/utils';
import { useAOPPlanningStore } from '../stores/useAOPPlanningStore';
import { CycleStatusBadge } from '../components/CycleStatusBadge';
import { AopSubNav } from '../components/AopSubNav';

interface ActualRow {
  channel: string;
  plan: number;
  actual: number;
  variance: number;
  status: 'on-track' | 'warning' | 'breach';
}

const MOCK_ACTUALS: ActualRow[] = [
  { channel: 'EBO', plan: 320, actual: 295, variance: -7.8, status: 'breach' },
  { channel: 'SIS', plan: 180, actual: 188, variance: 4.4, status: 'on-track' },
  { channel: 'MBO', plan: 65, actual: 62, variance: -4.6, status: 'warning' },
  { channel: 'AJIO', plan: 140, actual: 155, variance: 10.7, status: 'on-track' },
  { channel: 'Distribution', plan: 115, actual: 110, variance: -4.3, status: 'warning' },
];

const STATUS_STYLES: Record<string, string> = {
  'on-track': 'bg-green-50 text-green-700',
  warning: 'bg-amber-50 text-amber-700',
  breach: 'bg-red-50 text-red-700',
};

export function MonitorPage(): React.ReactNode {
  const { cycleId } = useParams<{ cycleId: string }>();
  const cycles = useAOPPlanningStore((s) => s.cycles);

  const cycle = cycles.find((c) => c.id === cycleId);
  if (!cycle) {
    return <EmptyState title="Cycle not found" description="The requested planning cycle does not exist." />;
  }

  const breachChannels = MOCK_ACTUALS.filter((r) => r.status === 'breach');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Monitor & Reforecast"
        backTo={{ label: cycle.name, path: `/sales-plan/workspace/${cycle.id}` }}
        actions={<CycleStatusBadge status={cycle.status} />}
      />

      <AopSubNav />

      {breachChannels.length > 0 && (
        <Alert variant="warning">
          <AlertContent>
            <AlertTitle>Material variance detected</AlertTitle>
            <AlertDescription>
              {breachChannels.map((r) => r.channel).join(', ')} showing significant deviation from plan.
              <Button variant="ghost" size="sm" className="ml-2" disabled>
                Start Reforecast (coming soon)
              </Button>
            </AlertDescription>
          </AlertContent>
        </Alert>
      )}

      <div>
        <SectionHeader title="Actuals vs Plan — YTD" />
        <div className="mt-3 border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Channel</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">Plan (₹ Cr)</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">Actual (₹ Cr)</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">Variance</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {MOCK_ACTUALS.map((row) => (
                  <tr key={row.channel} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{row.channel}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-700">₹{row.plan}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-700">₹{row.actual}</td>
                    <td className={cn(
                      'px-4 py-3 text-right tabular-nums font-medium',
                      row.variance >= 0 ? 'text-green-600' : 'text-red-600',
                    )}>
                      {row.variance >= 0 ? '+' : ''}{row.variance.toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge className={STATUS_STYLES[row.status]}>{row.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-600">
        A reforecast creates a new version under the same cycle. Only forward periods are editable. Re-promotion bumps the contract version.
      </div>
    </div>
  );
}
