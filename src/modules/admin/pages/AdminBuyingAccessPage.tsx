import { useState } from 'react';
import { Check, Minus, Info, ShieldCheck, Users } from 'lucide-react';
import {
  Badge,
  Button,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  PageHeader,
  DataTable,
  DataTableHeader,
  DataTableBody,
  DataTableRow,
  DataTableHead,
  DataTableCell,
} from '@/components/ui';
import { cn } from '@/lib/utils';

// ─── Access Matrix Data ──────────────────────────────────────────────────────

type AccessLevel = 'view' | 'edit' | 'view+edit' | 'none'

interface ScreenAccess {
  screen: string
  superAdmin: AccessLevel
  commercial: AccessLevel
  flHead: AccessLevel
  formatHead: AccessLevel
  buyer: AccessLevel
  note?: string
}

const ACCESS_MATRIX: ScreenAccess[] = [
  {
    screen: 'Buy Plan — Month Overview',
    superAdmin: 'view+edit',
    commercial: 'view',
    flHead: 'view',
    formatHead: 'view',
    buyer: 'view',
  },
  {
    screen: 'Buy Plan — Category / Subcategory / Brick',
    superAdmin: 'view+edit',
    commercial: 'view',
    flHead: 'view',
    formatHead: 'view',
    buyer: 'view',
    note: 'Format Head and Buyer see own assigned category only',
  },
  {
    screen: 'Buy Plan — Options Workbench (View)',
    superAdmin: 'view+edit',
    commercial: 'view',
    flHead: 'view',
    formatHead: 'view',
    buyer: 'view',
    note: 'Buyer sees own assigned category + subcategory only',
  },
  {
    screen: 'Buy Plan — Options Workbench (Edit / Submit)',
    superAdmin: 'edit',
    commercial: 'none',
    flHead: 'none',
    formatHead: 'none',
    buyer: 'edit',
    note: 'Only Buyer / Planner can edit quantities and submit for review',
  },
  {
    screen: 'OTB Review — Exception Approval',
    superAdmin: 'view+edit',
    commercial: 'view+edit',
    flHead: 'view',
    formatHead: 'none',
    buyer: 'none',
  },
  {
    screen: 'OTB Review — OTB Approval',
    superAdmin: 'view+edit',
    commercial: 'view+edit',
    flHead: 'view',
    formatHead: 'none',
    buyer: 'none',
  },
  {
    screen: 'Exception Queue',
    superAdmin: 'view+edit',
    commercial: 'view+edit',
    flHead: 'view',
    formatHead: 'view',
    buyer: 'view',
    note: 'Each role sees only their own pending exceptions; Super Admin sees all',
  },
  {
    screen: 'Test & Scale',
    superAdmin: 'view+edit',
    commercial: 'view',
    flHead: 'view',
    formatHead: 'edit',
    buyer: 'view',
    note: 'Format Head can trigger scale / close test; others view only',
  },
  {
    screen: 'PO Review',
    superAdmin: 'view+edit',
    commercial: 'view+edit',
    flHead: 'view',
    formatHead: 'none',
    buyer: 'view',
    note: 'Only Commercial / CFO can approve and release POs',
  },
  {
    screen: 'Admin Panel',
    superAdmin: 'view+edit',
    commercial: 'none',
    flHead: 'none',
    formatHead: 'none',
    buyer: 'none',
    note: 'Admin access is restricted to Super Admin only',
  },
]

function AccessCell({ level }: { level: AccessLevel }) {
  if (level === 'none') {
    return (
      <div className="flex items-center justify-center">
        <Minus className="w-4 h-4 text-gray-400" />
      </div>
    )
  }
  if (level === 'view') {
    return (
      <div className="flex items-center justify-center">
        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-1.5 py-0.5">
          <Check className="w-3 h-3" /> View
        </span>
      </div>
    )
  }
  if (level === 'edit') {
    return (
      <div className="flex items-center justify-center">
        <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded px-1.5 py-0.5">
          <Check className="w-3 h-3" /> Edit
        </span>
      </div>
    )
  }
  // view+edit
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-1.5 py-0.5">
        <Check className="w-3 h-3" /> View
      </span>
      <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded px-1.5 py-0.5">
        <Check className="w-3 h-3" /> Edit
      </span>
    </div>
  )
}

// ─── User Assignment Data ────────────────────────────────────────────────────

interface BuyingUser {
  userId: string
  fullName: string
  role: string
  category: string
  subcategory: string
  status: 'Active' | 'Inactive'
}

const BUYING_USERS: BuyingUser[] = [
  { userId: 'USR-001', fullName: 'Priya Sharma', role: 'Buyer / Planner', category: "Men's Casuals", subcategory: 'Tops', status: 'Active' },
  { userId: 'USR-002', fullName: 'Arjun Nair', role: 'Buyer / Planner', category: "Men's Casuals", subcategory: 'Bottoms', status: 'Active' },
  { userId: 'USR-003', fullName: 'Meera Pillai', role: 'Buyer / Planner', category: "Women's Indian Wear", subcategory: 'Kurtas', status: 'Active' },
  { userId: 'USR-004', fullName: 'Rohit Gupta', role: 'Buyer / Planner', category: "Men's Formals", subcategory: 'Shirts', status: 'Active' },
  { userId: 'USR-005', fullName: 'Kavya Reddy', role: 'Format Head', category: "Men's Casuals", subcategory: 'All Subcategories', status: 'Active' },
  { userId: 'USR-006', fullName: 'Sanjay Kumar', role: 'Format Head', category: "Women's Indian Wear", subcategory: 'All Subcategories', status: 'Active' },
  { userId: 'USR-007', fullName: 'Deepika Joshi', role: 'F&L Head', category: 'All Categories', subcategory: '—', status: 'Active' },
  { userId: 'USR-008', fullName: 'Ankit Mehta', role: 'Commercial / CFO', category: 'All Categories', subcategory: '—', status: 'Active' },
]

const ROLE_VARIANT: Record<string, 'primary' | 'success' | 'warning' | 'outline' | 'default'> = {
  'Super Admin': 'primary',
  'Commercial / CFO': 'warning',
  'F&L Head': 'success',
  'Format Head': 'default',
  'Buyer / Planner': 'outline',
}

// ─── Component ───────────────────────────────────────────────────────────────

export function AdminBuyingAccessPage() {
  const [activeTab, setActiveTab] = useState('matrix')

  return (
    <div className="space-y-6">
      <PageHeader title="Buying Access" />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="matrix">
            <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
            Screen Access Matrix
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="w-3.5 h-3.5 mr-1.5" />
            User–Category Assignment
          </TabsTrigger>
        </TabsList>

        {/* ── Tab 1: Screen Access Matrix ── */}
        <TabsContent value="matrix" className="space-y-4">
          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
            <Info className="w-4 h-4 mt-0.5 shrink-0 text-blue-500" />
            <div>
              This matrix defines the baseline screen-level access for each role. Category and subcategory scoping applies on top for Format Head and Buyer / Planner roles — see the User–Category Assignment tab.
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left text-xs font-semibold text-gray-600 px-4 py-3 w-60">Screen / Module</th>
                  <th className="text-center text-xs font-semibold text-gray-600 px-3 py-3 w-28">Super Admin</th>
                  <th className="text-center text-xs font-semibold text-gray-600 px-3 py-3 w-28">Commercial / CFO</th>
                  <th className="text-center text-xs font-semibold text-gray-600 px-3 py-3 w-28">F&L Head</th>
                  <th className="text-center text-xs font-semibold text-gray-600 px-3 py-3 w-28">Format Head</th>
                  <th className="text-center text-xs font-semibold text-gray-600 px-3 py-3 w-28">Buyer / Planner</th>
                  <th className="text-left text-xs font-semibold text-gray-600 px-3 py-3">Notes</th>
                </tr>
              </thead>
              <tbody>
                {ACCESS_MATRIX.map((row, i) => (
                  <tr key={row.screen} className={cn('border-b border-gray-100', i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50')}>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium text-gray-900">{row.screen}</span>
                    </td>
                    <td className="px-3 py-3"><AccessCell level={row.superAdmin} /></td>
                    <td className="px-3 py-3"><AccessCell level={row.commercial} /></td>
                    <td className="px-3 py-3"><AccessCell level={row.flHead} /></td>
                    <td className="px-3 py-3"><AccessCell level={row.formatHead} /></td>
                    <td className="px-3 py-3"><AccessCell level={row.buyer} /></td>
                    <td className="px-3 py-3">
                      {row.note && (
                        <span className="text-xs text-gray-500">{row.note}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap pt-1">
            <span className="font-medium">Legend:</span>
            <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-1.5 py-0.5">
              <Check className="w-3 h-3" /> View — read-only access to the screen
            </span>
            <span className="inline-flex items-center gap-1 text-blue-700 bg-blue-50 border border-blue-200 rounded px-1.5 py-0.5">
              <Check className="w-3 h-3" /> Edit — can submit, approve, or modify
            </span>
            <span className="inline-flex items-center gap-1 text-gray-400">
              <Minus className="w-3 h-3" /> No access
            </span>
          </div>
        </TabsContent>

        {/* ── Tab 2: User–Category Assignment ── */}
        <TabsContent value="users" className="space-y-4">
          {/* Rules callout */}
          {/* eslint-disable-next-line design-system/prefer-metric-grid -- card grid, not a KPI metric row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { role: 'Buyer / Planner', rule: 'Restricted to assigned Category + Subcategory only', color: 'bg-gray-50 border-gray-200 text-gray-700' },
              { role: 'Format Head', rule: 'Assigned Category — all subcategories within', color: 'bg-gray-50 border-gray-200 text-gray-700' },
              { role: 'F&L Head', rule: 'All categories with view access across the board', color: 'bg-green-50 border-green-200 text-green-800' },
              { role: 'Commercial / CFO', rule: 'All categories — OTB and PO approval rights', color: 'bg-amber-50 border-amber-200 text-amber-800' },
            ].map(item => (
              <div key={item.role} className={cn('border rounded-lg px-3 py-3', item.color)}>
                <div className="text-xs font-semibold mb-1">{item.role}</div>
                <div className="text-xs opacity-90">{item.rule}</div>
              </div>
            ))}
          </div>

          {/* eslint-disable-next-line design-system/prefer-section-header -- card header row, not a page section header */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">{BUYING_USERS.length} users configured</p>
            <Button
              size="sm"
              onClick={() => {
                // coming soon toast — no-op in mock
                alert('User assignment configuration coming soon.')
              }}
            >
              + Add User
            </Button>
          </div>

          <DataTable>
            <DataTableHeader>
              <DataTableHead>User ID</DataTableHead>
              <DataTableHead>Full Name</DataTableHead>
              <DataTableHead>Role</DataTableHead>
              <DataTableHead>Category</DataTableHead>
              <DataTableHead>Subcategory</DataTableHead>
              <DataTableHead>Status</DataTableHead>
              <DataTableHead></DataTableHead>
            </DataTableHeader>
            <DataTableBody>
              {BUYING_USERS.map(user => (
                <DataTableRow key={user.userId}>
                  <DataTableCell>
                    <span className="font-mono text-xs font-medium text-gray-700">{user.userId}</span>
                  </DataTableCell>
                  <DataTableCell>
                    <span className="text-sm font-medium text-gray-900">{user.fullName}</span>
                  </DataTableCell>
                  <DataTableCell>
                    <Badge variant={ROLE_VARIANT[user.role] ?? 'outline'} size="sm">
                      {user.role}
                    </Badge>
                  </DataTableCell>
                  <DataTableCell>
                    <span className="text-xs text-gray-700">{user.category}</span>
                  </DataTableCell>
                  <DataTableCell>
                    <span className="text-xs text-gray-700">{user.subcategory}</span>
                  </DataTableCell>
                  <DataTableCell>
                    <Badge
                      variant={user.status === 'Active' ? 'success' : 'default'}
                      size="sm"
                    >
                      {user.status}
                    </Badge>
                  </DataTableCell>
                  <DataTableCell>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs"
                      onClick={() => alert('Edit coming soon.')}
                    >
                      Edit
                    </Button>
                  </DataTableCell>
                </DataTableRow>
              ))}
            </DataTableBody>
          </DataTable>
        </TabsContent>
      </Tabs>
    </div>
  )
}
