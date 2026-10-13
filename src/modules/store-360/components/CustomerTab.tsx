import { useMemo } from 'react';
import { Badge, SectionHeader, EmptyState } from '@/components/ui';
import { getStore360Data } from '../data/mockStore360'; // mock-ok — config lookup
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line } from 'recharts';

interface CustomerTabProps {
  storeId: string;
}

// Helper to format month strings from "2025-10" to "Oct"
function formatMonth(month: string): string {
  const [, monthNum] = month.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[parseInt(monthNum!, 10) - 1] || month;
}

export function CustomerTab({ storeId }: CustomerTabProps) {
  const data = useMemo(() => getStore360Data(storeId), [storeId]);

  // Calculate percentages for the stacked bar
  const totalResponses = data.nps.promoters + data.nps.passives + data.nps.detractors;
  const promoterPct = totalResponses > 0 ? (data.nps.promoters / totalResponses) * 100 : 0;
  const passivePct = totalResponses > 0 ? (data.nps.passives / totalResponses) * 100 : 0;
  const detractorPct = totalResponses > 0 ? (data.nps.detractors / totalResponses) * 100 : 0;

  // Format trend data with nicer month labels
  const formattedTrend = data.nps.trend.map(item => ({
    ...item,
    monthLabel: formatMonth(item.month),
  }));

  return (
    <div className="space-y-4">
      {/* NPS Score Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <SectionHeader title="Net Promoter Score" className="mb-4" />

        {/* Score Display */}
        <div className="mb-6">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-semibold text-gray-900">{data.nps.npsScore}</span>
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {data.nps.period} · {data.nps.responseCount} responses
          </div>
        </div>

        {/* P/P/D Breakdown - Stacked Bar */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Response Distribution</h4>
          <div className="flex h-6 rounded-full overflow-hidden">
            {/* eslint-disable-next-line no-restricted-syntax -- dynamic percentage widths for stacked bar chart */}
            <div className="bg-green-500" style={{ width: `${promoterPct}%` }} />
            {/* eslint-disable-next-line no-restricted-syntax -- dynamic percentage widths for stacked bar chart */}
            <div className="bg-amber-400" style={{ width: `${passivePct}%` }} />
            {/* eslint-disable-next-line no-restricted-syntax -- dynamic percentage widths for stacked bar chart */}
            <div className="bg-red-500" style={{ width: `${detractorPct}%` }} />
          </div>
          <div className="flex justify-between mt-3">
            <div className="text-center">
              <div className="text-xs text-gray-500">Promoters</div>
              <div className="text-sm font-medium text-gray-900">{data.nps.promoters}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500">Passives</div>
              <div className="text-sm font-medium text-gray-900">{data.nps.passives}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500">Detractors</div>
              <div className="text-sm font-medium text-gray-900">{data.nps.detractors}</div>
            </div>
          </div>
        </div>

        {/* NPS Trend Chart */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">NPS Trend</h4>
          <div role="img" aria-label="NPS score trend over 6 months">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={formattedTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="monthLabel" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Silent NPS */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <SectionHeader title="Silent NPS" className="mb-4" />

        {/* Overall Score */}
        <div className="mb-6">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-semibold text-gray-900">{data.silentNps.silentNpsScore}</span>
          </div>
          <div className="text-xs text-gray-500 mt-1">{data.silentNps.period}</div>
        </div>

        {/* Factors Table */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Factors</h4>
          {data.silentNps.factors.length === 0 ? (
            <EmptyState description="No factor data" />
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-medium text-gray-500 pb-3">Factor</th>
                  <th className="text-right text-xs font-medium text-gray-500 pb-3">Score</th>
                  <th className="text-right text-xs font-medium text-gray-500 pb-3">Weight</th>
                  <th className="text-right text-xs font-medium text-gray-500 pb-3">Trend</th>
                </tr>
              </thead>
              <tbody>
                {data.silentNps.factors.map((factor, idx) => (
                  <tr key={idx} className="border-b border-gray-50">
                    <td className="py-3 text-sm text-gray-900">{factor.factor}</td>
                    <td className="py-3 text-sm text-gray-700 text-right tabular-nums">{factor.score}</td>
                    <td className="py-3 text-sm text-gray-700 text-right tabular-nums">
                      {(factor.weight * 100).toFixed(0)}%
                    </td>
                    <td className="py-3 text-sm text-right">
                      {factor.trend === 'up' && <Badge variant="success">↑ Up</Badge>}
                      {factor.trend === 'down' && <Badge variant="destructive">↓ Down</Badge>}
                      {factor.trend === 'stable' && <Badge variant="outline">→ Stable</Badge>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
