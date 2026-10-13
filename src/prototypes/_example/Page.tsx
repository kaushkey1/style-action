/**
 * Example Prototype
 *
 * How to create a new prototype:
 * 1. Copy this folder: cp -r src/prototypes/_example src/prototypes/your-concept
 * 2. Edit Page.tsx with your layout / concept
 * 3. Add an entry to src/prototypes/registry.ts
 * 4. Run: npm run prototype
 * 5. Open https://localhost:5174 (or http:// if no certs)
 *
 * You CAN import from production code:
 *   - UI components: import { Button, Badge, Card } from '@/components/ui'
 *   - Utilities: import { cn, formatCurrency } from '@/lib/utils'
 *   - Mock data: import { mockExceptions } from '@/modules/exceptions/data/mockExceptions'
 *   - Types: import type { ExceptionItem } from '@/modules/exceptions/data/mockExceptions'
 *
 * You CANNOT:
 *   - Modify any file outside src/prototypes/
 *   - Install new packages
 */

import {
  Button,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  MetricCard,
} from '@/components/ui'
import { cn } from '@/lib/utils'

const mockMetrics = [
  { label: 'Total Revenue', value: '12.4Cr', change: '+8.2%', status: 'green' as const },
  { label: 'Store Count', value: '1,247', change: '+12', status: 'green' as const },
  { label: 'Sell-Through', value: '68%', change: '-2.1%', status: 'amber' as const },
  { label: 'Exceptions', value: '34', change: '+5', status: 'red' as const },
]

const mockTableData = [
  { id: 1, store: 'Phoenix Mall, Mumbai', revenue: '24.5L', target: '22.0L', achievement: 111 },
  { id: 2, store: 'Select City Walk, Delhi', revenue: '19.8L', target: '21.0L', achievement: 94 },
  { id: 3, store: 'UB City, Bangalore', revenue: '17.2L', target: '18.5L', achievement: 93 },
  { id: 4, store: 'Ambience Mall, Gurgaon', revenue: '15.9L', target: '14.0L', achievement: 114 },
]

export default function ExamplePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Example Prototype</h1>
        <p className="mt-1 text-sm text-gray-500">
          This is a starter prototype demonstrating UI components, Tailwind, and mock data.
        </p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {mockMetrics.map((m) => (
          <MetricCard
            key={m.label}
            title={m.label}
            value={m.value}
            subtitle={m.change}
            status={m.status}
          />
        ))}
      </div>

      {/* Card with table */}
      <Card>
        <CardHeader>
          <CardTitle>Top Stores by Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-[500px] w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-2 text-left font-medium text-gray-500">Store</th>
                  <th className="py-2 text-right font-medium text-gray-500">Revenue</th>
                  <th className="py-2 text-right font-medium text-gray-500">Target</th>
                  <th className="py-2 text-right font-medium text-gray-500">Achievement</th>
                </tr>
              </thead>
              <tbody>
                {mockTableData.map((row) => (
                  <tr key={row.id} className="border-b border-gray-100">
                    <td className="py-2 text-gray-900">{row.store}</td>
                    <td className="py-2 text-right text-gray-900">{row.revenue}</td>
                    <td className="py-2 text-right text-gray-500">{row.target}</td>
                    <td className="py-2 text-right">
                      <Badge variant={row.achievement >= 100 ? 'success' : 'warning'}>
                        {row.achievement}%
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Buttons demo */}
      <Card>
        <CardHeader>
          <CardTitle>UI Components</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
          </div>
          <div className={cn('mt-4 flex flex-wrap gap-2')}>
            <Badge variant="success">On Track</Badge>
            <Badge variant="warning">At Risk</Badge>
            <Badge variant="destructive">Off Track</Badge>
            <Badge>Default</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
