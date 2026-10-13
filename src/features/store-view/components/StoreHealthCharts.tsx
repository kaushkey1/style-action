import {
  PieChart, Pie, Cell, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import type { StoreAuditData, AuditTag } from '@/modules/store-view/types/storeAudit.types';

const GRADE_COLORS: Record<string, string> = {
  Good: '#22c55e',
  Amber: '#f59e0b',
  Red: '#ef4444',
};

const TAG_COLORS: Record<AuditTag, string> = {
  GRADE_CONFIRMED: '#22c55e',
  VIDEO_CONTRADICTS_GRADE: '#ef4444',
  INSUFFICIENT_EVIDENCE: '#f59e0b',
  SUBMITTER_NOTE_CONFIRMS: '#3b82f6',
  NO_RELEVANT_VIDEO: '#94a3b8',
};

function tagDisplayLabel(tag: string): string {
  return tag.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');
}

interface StoreHealthChartsProps {
  data: StoreAuditData;
}

export function StoreHealthCharts({ data }: StoreHealthChartsProps) {
  // Grade distribution
  const gradeCounts: Record<string, number> = { Good: 0, Amber: 0, Red: 0 };
  for (const item of data.checklistItems) {
    const grade = item.finalGrade === 'Insufficient' || item.finalGrade === 'N/A' ? 'Amber' : item.finalGrade;
    if (grade in gradeCounts) gradeCounts[grade] = (gradeCounts[grade] ?? 0) + 1;
  }
  const gradeData = Object.entries(gradeCounts)
    .filter(([, count]) => count > 0)
    .map(([name, value]) => ({ name, value }));

  // Evidence tags
  const tagCounts: Record<string, number> = {};
  for (const item of data.checklistItems) {
    tagCounts[item.tag] = (tagCounts[item.tag] || 0) + 1;
  }
  const tagData = Object.entries(tagCounts)
    .sort(([, a], [, b]) => b - a)
    .map(([tag, count]) => ({
      name: tagDisplayLabel(tag),
      value: count,
      fill: TAG_COLORS[tag as AuditTag] || '#94a3b8',
    }));

  // Priority breakdown
  const priorityData = [
    { name: 'S0 Critical', value: data.s0Count, fill: '#ef4444' },
    { name: 'S1 High', value: data.s1Count, fill: '#f59e0b' },
    { name: 'S2 Medium', value: data.s2Count, fill: '#3b82f6' },
  ];

  return (
    // eslint-disable-next-line design-system/prefer-metric-grid -- chart layout with mixed content types, not uniform metric cards
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
      {/* Grade Distribution Donut */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Grade Distribution</h3>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={gradeData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                dataKey="value"
                paddingAngle={2}
              >
                {gradeData.map((entry) => (
                  <Cell key={entry.name} fill={GRADE_COLORS[entry.name]} />
                ))}
              </Pie>
              <Legend
                verticalAlign="bottom"
                iconType="circle"
                iconSize={8}
                formatter={(value: string) => <span className="text-xs text-gray-600">{value}</span>}
              />
              <Tooltip
                formatter={(value) => [`${value} items`, '']}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Evidence Tags Horizontal Bar */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Evidence Tags</h3>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={tagData} layout="vertical" margin={{ left: 0, right: 16, top: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 10 }} />
              <Tooltip
                formatter={(value) => [`${value} items`, '']}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {tagData.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Issue Priority Breakdown */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Issue Priority Breakdown</h3>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={priorityData} margin={{ left: 0, right: 16, top: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(value) => [`${value} items`, '']}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
              />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {priorityData.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
