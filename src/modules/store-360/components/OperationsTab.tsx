import { useMemo } from 'react';
import { Badge, SectionHeader, EmptyState, MetricGrid, MetricCard } from '@/components/ui';
import { getStore360Data } from '../data/mockStore360'; // mock-ok — config lookup

interface OperationsTabProps {
  storeId: string;
}

export function OperationsTab({ storeId }: OperationsTabProps) {
  const data = useMemo(() => getStore360Data(storeId), [storeId]);

  return (
    <div className="space-y-4">
      {/* CCTV Analysis */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <SectionHeader title="CCTV Analysis" className="mb-4" />

        {/* CCTV Summary Metrics */}
        <MetricGrid columns={3} className="mb-6">
          <MetricCard label="Footfall" value={data.cctv.footfall.toLocaleString()} />
          <MetricCard label="Avg Dwell" value={`${data.cctv.avgDwellMinutes} min`} />
          <MetricCard label="Conversion" value={`${data.cctv.conversionRate}%`} />
        </MetricGrid>

        {/* Hot Zones */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Hot Zones</h4>
          {data.cctv.hotZones.length === 0 ? (
            <EmptyState description="No hot zone data" />
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-medium text-gray-500 pb-3">Zone</th>
                  <th className="text-right text-xs font-medium text-gray-500 pb-3">Traffic</th>
                </tr>
              </thead>
              <tbody>
                {data.cctv.hotZones.map((zone, idx) => (
                  <tr key={idx} className="border-b border-gray-50">
                    <td className="py-3 text-sm text-gray-900">{zone.zone}</td>
                    <td className="py-3 text-sm text-right">
                      {zone.traffic === 'high' && <Badge variant="success">high</Badge>}
                      {zone.traffic === 'medium' && <Badge variant="warning">medium</Badge>}
                      {zone.traffic === 'low' && <Badge variant="outline">low</Badge>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* CCTV Alerts */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Alerts</h4>
          {data.cctv.alerts.length === 0 ? (
            <EmptyState description="No alerts" />
          ) : (
            <div className="space-y-2">
              {data.cctv.alerts.map((alert, idx) => (
                <div
                  key={idx}
                  className={`bg-white border border-gray-200 rounded-lg p-3 ${
                    alert.severity === 'critical'
                      ? 'border-l-3 border-l-red-500'
                      : alert.severity === 'warning'
                        ? 'border-l-3 border-l-amber-500'
                        : 'border-l-3 border-l-blue-500'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="text-sm text-gray-900">{alert.type}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{alert.time}</div>
                    </div>
                    <div>
                      {alert.severity === 'critical' && <Badge variant="destructive">critical</Badge>}
                      {alert.severity === 'warning' && <Badge variant="warning">warning</Badge>}
                      {alert.severity === 'info' && <Badge variant="outline">info</Badge>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Hygiene Audit */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <SectionHeader title="Hygiene Audit" className="mb-4" />

        {/* Overall Score */}
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div className="text-3xl font-semibold text-gray-900">{data.hygiene.overallScore}</div>
            <div>
              {data.hygiene.overallScore >= 85 && <Badge variant="success">Pass</Badge>}
              {data.hygiene.overallScore >= 70 && data.hygiene.overallScore < 85 && <Badge variant="warning">Needs Improvement</Badge>}
              {data.hygiene.overallScore < 70 && <Badge variant="destructive">Fail</Badge>}
            </div>
          </div>
          <div className="text-xs text-gray-500 mt-1">Audit Date: {new Date(data.hygiene.auditDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
        </div>

        {/* Categories */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Categories</h4>
          {data.hygiene.categories.length === 0 ? (
            <EmptyState description="No category data" />
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-medium text-gray-500 pb-3">Category</th>
                  <th className="text-right text-xs font-medium text-gray-500 pb-3">Score</th>
                  <th className="text-right text-xs font-medium text-gray-500 pb-3">Status</th>
                  <th className="text-left text-xs font-medium text-gray-500 pb-3 pl-4">Notes</th>
                </tr>
              </thead>
              <tbody>
                {data.hygiene.categories.map((cat, idx) => (
                  <tr key={idx} className="border-b border-gray-50">
                    <td className="py-3 text-sm text-gray-900">{cat.category}</td>
                    <td className="py-3 text-sm text-gray-700 text-right tabular-nums">{cat.score}</td>
                    <td className="py-3 text-sm text-right">
                      {cat.status === 'pass' && <Badge variant="success">pass</Badge>}
                      {cat.status === 'warning' && <Badge variant="warning">warning</Badge>}
                      {cat.status === 'fail' && <Badge variant="destructive">fail</Badge>}
                    </td>
                    <td className="py-3 text-xs text-gray-500 pl-4">{cat.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Image Compliance */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Image Compliance</h4>
          {data.hygiene.images.length === 0 ? (
            <EmptyState description="No compliance images" />
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-medium text-gray-500 pb-3">Label</th>
                  <th className="text-left text-xs font-medium text-gray-500 pb-3">Timestamp</th>
                  <th className="text-right text-xs font-medium text-gray-500 pb-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.hygiene.images.map((img) => (
                  <tr key={img.id} className="border-b border-gray-50">
                    <td className="py-3 text-sm text-gray-900">{img.label}</td>
                    <td className="py-3 text-sm text-gray-700">
                      {new Date(img.timestamp).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="py-3 text-sm text-right">
                      {img.status === 'compliant' && <Badge variant="success">compliant</Badge>}
                      {img.status === 'non-compliant' && <Badge variant="destructive">non-compliant</Badge>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Store Communications */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <SectionHeader title="Store Communications" className="mb-4" />
        {data.communications.length === 0 ? (
          <EmptyState description="No communications" />
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-medium text-gray-500 pb-3">Type</th>
                <th className="text-left text-xs font-medium text-gray-500 pb-3">Title</th>
                <th className="text-left text-xs font-medium text-gray-500 pb-3">Date</th>
                <th className="text-right text-xs font-medium text-gray-500 pb-3">Status</th>
                <th className="text-left text-xs font-medium text-gray-500 pb-3 pl-4">Sent By</th>
              </tr>
            </thead>
            <tbody>
              {data.communications.map((comm) => (
                <tr key={comm.id} className="border-b border-gray-50">
                  <td className="py-3 text-sm">
                    <Badge variant="default">
                      {comm.type === 'vm-directive' && 'VM Directive'}
                      {comm.type === 'promotion-brief' && 'Promotion Brief'}
                      {comm.type === 'compliance-notice' && 'Compliance Notice'}
                      {comm.type === 'planogram-update' && 'Planogram Update'}
                    </Badge>
                  </td>
                  <td className="py-3 text-sm text-gray-900">{comm.title}</td>
                  <td className="py-3 text-sm text-gray-700">
                    {new Date(comm.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="py-3 text-sm text-right">
                    {comm.status === 'acknowledged' && <Badge variant="success">acknowledged</Badge>}
                    {comm.status === 'pending' && <Badge variant="warning">pending</Badge>}
                    {comm.status === 'overdue' && <Badge variant="destructive">overdue</Badge>}
                  </td>
                  <td className="py-3 text-sm text-gray-700 pl-4">{comm.sentBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
