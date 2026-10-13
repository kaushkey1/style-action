import { Modal, EmptyState } from '@/components/ui';
import { cn } from '@/lib/utils';

import type { PlanningGridRow } from '../types/aopPlanning.types';

interface PriorYearSalesDialogProps {
  row: PlanningGridRow | null;
  monthColumns: { id: string; label: string }[];
  isOpen: boolean;
  onClose: () => void;
}

function formatCr(value: number): string {
  return `₹${value.toFixed(2)} Cr`;
}

function growthPct(current: number, prior: number): number | null {
  if (!prior) return null;
  return ((current - prior) / prior) * 100;
}

function GrowthCell({ value }: { value: number | null }): React.ReactNode {
  if (value === null) {
    return <span className="text-gray-400">—</span>;
  }
  return (
    <span className={cn(value >= 0 ? 'text-green-600' : 'text-red-600')}>
      {value >= 0 ? '+' : ''}{value.toFixed(1)}%
    </span>
  );
}

export function PriorYearSalesDialog({
  row,
  monthColumns,
  isOpen,
  onClose,
}: PriorYearSalesDialogProps): React.ReactNode {
  const pyByMonth = new Map((row?.months ?? []).map((m) => [m.monthId, m.priorYear]));
  const tyByMonth = new Map((row?.months ?? []).map((m) => [m.monthId, m.value]));
  const hasData = (row?.priorYearTotal ?? 0) > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Last year vs this year${row ? ` — ${row.label}` : ''}`}
      description="Prior-year actual vs this year's plan, month by month, with growth."
      size="lg"
    >
      {!row || !hasData ? (
        <EmptyState
          title="No prior-year sales"
          description="This store has no prior-year actuals to show."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-3 py-2 text-left font-medium text-gray-500">Month</th>
                <th className="px-3 py-2 text-right font-medium text-gray-500">Last year (₹ Cr)</th>
                <th className="px-3 py-2 text-right font-medium text-gray-500">This year (₹ Cr)</th>
                <th className="px-3 py-2 text-right font-medium text-gray-500">Growth %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {monthColumns.map((m) => {
                const py = pyByMonth.get(m.id) ?? 0;
                const ty = tyByMonth.get(m.id) ?? 0;
                return (
                  <tr key={m.id}>
                    <td className="px-3 py-2 text-gray-700">{m.label}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-gray-900">{formatCr(py)}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-gray-900">{formatCr(ty)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      <GrowthCell value={growthPct(ty, py)} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-200 bg-gray-50">
                <td className="px-3 py-2 font-bold text-gray-900">Total</td>
                <td className="px-3 py-2 text-right tabular-nums font-bold text-gray-900">
                  {formatCr(row.priorYearTotal)}
                </td>
                <td className="px-3 py-2 text-right tabular-nums font-bold text-gray-900">
                  {formatCr(row.fyTotal)}
                </td>
                <td className="px-3 py-2 text-right tabular-nums font-bold">
                  <GrowthCell value={growthPct(row.fyTotal, row.priorYearTotal)} />
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </Modal>
  );
}
