/**
 * Range Architecture — Attribute Variants Page Redesign
 *
 * Wireframe prototype: transforms the page from a read-only report
 * into a buyer workspace with inline editing, performance signals,
 * budget guardrails, and a color/store/performance detail panel.
 */

import { useState } from 'react'
import {
  Button,
  Badge,
  Sheet,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Progress,
  PageHeader,
  FilterSelect,
  Input,
  Pagination,
} from '@/components/ui'
import { cn } from '@/lib/utils'
import {
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Check,
  Flag,
  Columns3,
  Download,
  Search,
  ChevronRight,
  Palette,
  BarChart3,
  Store,
  Layers,
  Info,
  Edit3,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'

// ─── Mock Data ──────────────────────────────────────────────────────────────

const BUDGET_TOTAL = 31000000
const BUDGET_USED = 23400000

const MOCK_ROWS = [
  {
    id: '1',
    brick: 'Slim Fit Jeans',
    brand: 'Denizen',
    buyingModel: 'Manufacturing',
    fabric: 'Cotton Stretch',
    fit: 'Slim',
    length: 'Ankle',
    pattern: 'Solid',
    colors: 6,
    colorList: ['Black', 'Navy', 'Mid Blue', 'Charcoal', 'Olive', 'Rust'],
    source: 'FTF + Past Sales',
    storeSpread: 45,
    historical: { options: 8, qty: 3200, mrp: '₹999 – ₹1,499' },
    system: { options: 12, qty: 4200, mrp: '₹999 – ₹1,699' },
    buyer: { options: 12, qty: 4200, mrp: '₹999 – ₹1,699' },
    ros: 3.2,
    asp: 1249,
    contributionPct: 18.5,
    state: 'default' as const,
    isNew: false,
  },
  {
    id: '2',
    brick: 'Regular Fit Jeans',
    brand: 'Denizen',
    buyingModel: 'Manufacturing',
    fabric: 'Cotton Stretch',
    fit: 'Regular',
    length: 'Full',
    pattern: 'Solid',
    colors: 4,
    colorList: ['Black', 'Dark Blue', 'Mid Blue', 'Grey'],
    source: 'Historical',
    storeSpread: 52,
    historical: { options: 15, qty: 5800, mrp: '₹899 – ₹1,499' },
    system: { options: 10, qty: 4100, mrp: '₹999 – ₹1,499' },
    buyer: { options: 13, qty: 5000, mrp: '₹999 – ₹1,499' },
    ros: 4.1,
    asp: 1149,
    contributionPct: 22.3,
    state: 'modified' as const,
    isNew: false,
  },
  {
    id: '3',
    brick: 'Skinny Fit Jeans',
    brand: 'Denizen',
    buyingModel: 'Manufacturing',
    fabric: 'Lycra Denim',
    fit: 'Skinny',
    length: 'Ankle',
    pattern: 'Solid',
    colors: 3,
    colorList: ['Black', 'Dark Blue', 'Grey'],
    source: 'FTF Forecast',
    storeSpread: 28,
    historical: { options: 0, qty: 0, mrp: '-' },
    system: { options: 6, qty: 1800, mrp: '₹1,299 – ₹1,999' },
    buyer: { options: 6, qty: 1800, mrp: '₹1,299 – ₹1,999' },
    ros: 0,
    asp: 1599,
    contributionPct: 7.2,
    state: 'default' as const,
    isNew: true,
  },
  {
    id: '4',
    brick: 'Relaxed Fit Jeans',
    brand: 'Denizen',
    buyingModel: 'Manufacturing',
    fabric: 'Cotton',
    fit: 'Relaxed',
    length: 'Full',
    pattern: 'Solid',
    colors: 3,
    colorList: ['Black', 'Khaki', 'Stone'],
    source: 'Past Sales',
    storeSpread: 35,
    historical: { options: 10, qty: 3600, mrp: '₹799 – ₹1,299' },
    system: { options: 6, qty: 2100, mrp: '₹899 – ₹1,299' },
    buyer: { options: 6, qty: 2100, mrp: '₹899 – ₹1,299' },
    ros: 1.8,
    asp: 999,
    contributionPct: 9.4,
    state: 'default' as const,
    isNew: false,
  },
  {
    id: '5',
    brick: 'Bootcut Jeans',
    brand: 'Denizen',
    buyingModel: 'Manufacturing',
    fabric: 'Cotton Stretch',
    fit: 'Bootcut',
    length: 'Full',
    pattern: 'Solid',
    colors: 2,
    colorList: ['Dark Blue', 'Black'],
    source: 'Historical',
    storeSpread: 15,
    historical: { options: 8, qty: 2200, mrp: '₹899 – ₹1,299' },
    system: { options: 3, qty: 800, mrp: '₹999 – ₹1,299' },
    buyer: { options: 3, qty: 800, mrp: '₹999 – ₹1,299' },
    ros: 0.6,
    asp: 1099,
    contributionPct: 3.1,
    state: 'flagged' as const,
    isNew: false,
  },
  {
    id: '6',
    brick: 'Tapered Fit Jeans',
    brand: 'Denizen',
    buyingModel: 'Manufacturing',
    fabric: 'Cotton Stretch',
    fit: 'Tapered',
    length: 'Ankle',
    pattern: 'Washed',
    colors: 4,
    colorList: ['Light Blue', 'Mid Blue', 'Grey', 'Black'],
    source: 'FTF + Past Sales',
    storeSpread: 38,
    historical: { options: 5, qty: 1900, mrp: '₹1,099 – ₹1,699' },
    system: { options: 8, qty: 3000, mrp: '₹1,099 – ₹1,799' },
    buyer: { options: 8, qty: 3000, mrp: '₹1,099 – ₹1,799' },
    ros: 2.9,
    asp: 1399,
    contributionPct: 14.8,
    state: 'approved' as const,
    isNew: false,
  },
]

const MOCK_COLOR_BREAKDOWN = [
  { color: 'Black', hex: '#1a1a1a', historicalQty: 1200, systemQty: 1500, buyerQty: 1500, ros: 4.8, pct: 35.7, trend: 'up' as const, isNew: false },
  { color: 'Navy', hex: '#1e3a5f', historicalQty: 800, systemQty: 1000, buyerQty: 1000, ros: 3.6, pct: 23.8, trend: 'up' as const, isNew: false },
  { color: 'Mid Blue', hex: '#4a90d9', historicalQty: 500, systemQty: 700, buyerQty: 700, ros: 2.8, pct: 16.7, trend: 'flat' as const, isNew: false },
  { color: 'Charcoal', hex: '#4a4a4a', historicalQty: 300, systemQty: 450, buyerQty: 450, ros: 1.9, pct: 10.7, trend: 'flat' as const, isNew: false },
  { color: 'Olive', hex: '#556b2f', historicalQty: 250, systemQty: 350, buyerQty: 350, ros: 1.4, pct: 8.3, trend: 'down' as const, isNew: false },
  { color: 'Rust', hex: '#b7410e', historicalQty: 0, systemQty: 200, buyerQty: 200, ros: 0, pct: 4.8, trend: 'flat' as const, isNew: true },
]

const MOCK_STORES = [
  {
    format: 'Trends',
    stores: [
      { site: 'TRD001', name: 'Phoenix Mall, Mumbai', qty: 280, options: 12, ros: 4.2 },
      { site: 'TRD002', name: 'Select City Walk, Delhi', qty: 240, options: 12, ros: 3.8 },
      { site: 'TRD003', name: 'UB City, Bangalore', qty: 210, options: 10, ros: 3.5 },
      { site: 'TRD004', name: 'Ambience Mall, Gurgaon', qty: 190, options: 10, ros: 3.1 },
    ],
  },
  {
    format: 'Trends Woman',
    stores: [
      { site: 'TWM001', name: 'Inorbit Malad, Mumbai', qty: 150, options: 8, ros: 2.4 },
      { site: 'TWM002', name: 'Forum Mall, Bangalore', qty: 130, options: 8, ros: 2.1 },
    ],
  },
  {
    format: 'Azorte',
    stores: [
      { site: 'AZR001', name: 'VR Mall, Chennai', qty: 90, options: 6, ros: 1.5 },
      { site: 'AZR002', name: 'Lulu Mall, Kochi', qty: 80, options: 6, ros: 1.2 },
    ],
  },
]

// ─── Helper Components ──────────────────────────────────────────────────────

function DeltaBadge({ current, historical }: { current: number; historical: number }) {
  if (historical === 0) return <Badge variant="info" size="sm">New</Badge>
  const pct = Math.round(((current - historical) / historical) * 100)
  if (pct === 0) return <span className="text-xs text-gray-400">—</span>
  const isUp = pct > 0
  return (
    <span className={cn('inline-flex items-center gap-0.5 text-xs font-medium', isUp ? 'text-emerald-600' : 'text-amber-600')}>
      {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
      {isUp ? '+' : ''}{pct}%
    </span>
  )
}

function RosIndicator({ ros, avgRos = 2.5 }: { ros: number; avgRos?: number }) {
  if (ros === 0) return <span className="text-xs text-gray-400">New</span>
  const ratio = ros / avgRos
  const color = ratio >= 1.2 ? 'bg-emerald-500' : ratio >= 0.8 ? 'bg-amber-400' : 'bg-red-400'
  return (
    <div className="flex items-center gap-1.5">
      <div className={cn('w-2 h-2 rounded-full', color)} />
      <span className="text-xs font-medium text-gray-700">{ros.toFixed(1)}</span>
    </div>
  )
}

function RowStateIcon({ state }: { state: string }) {
  switch (state) {
    case 'approved':
      return <CheckCircle2 className="w-4 h-4 text-emerald-500" />
    case 'modified':
      return <Edit3 className="w-4 h-4 text-blue-500" />
    case 'flagged':
      return <Flag className="w-4 h-4 text-amber-500" />
    default:
      return <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
  }
}

function TrendIcon({ trend }: { trend: string }) {
  switch (trend) {
    case 'up':
      return <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
    case 'down':
      return <TrendingDown className="w-3.5 h-3.5 text-amber-500" />
    default:
      return <Minus className="w-3.5 h-3.5 text-gray-400" />
  }
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function RADetailRedesignPage() {
  const [selectedRow, setSelectedRow] = useState<(typeof MOCK_ROWS)[0] | null>(null)
  const [detailTab, setDetailTab] = useState('colors')

  const budgetPct = Math.round((BUDGET_USED / BUDGET_TOTAL) * 100)
  const totalSystemOptions = MOCK_ROWS.reduce((s, r) => s + r.system.options, 0)
  const totalBuyerOptions = MOCK_ROWS.reduce((s, r) => s + r.buyer.options, 0)
  const totalSystemQty = MOCK_ROWS.reduce((s, r) => s + r.system.qty, 0)
  const totalBuyerQty = MOCK_ROWS.reduce((s, r) => s + r.buyer.qty, 0)
  const avgDepth = totalBuyerOptions > 0 ? Math.round(totalBuyerQty / totalBuyerOptions) : 0
  const newPct = Math.round((MOCK_ROWS.filter((r) => r.isNew).length / MOCK_ROWS.length) * 100)
  const reviewedCount = MOCK_ROWS.filter((r) => r.state !== 'default').length

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* ── Page Header ── */}
      <PageHeader
        backTo={{ label: 'Range Architecture', path: '/range' }}
        title="Men's Bottoms / Jeans / Core"
        badges={<Badge variant="outline" size="sm">{reviewedCount} of {MOCK_ROWS.length} reviewed</Badge>}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-1.5" />
              Download
            </Button>
            <Button variant="primary" size="sm">
              <Check className="w-4 h-4 mr-1.5" />
              Submit Range
            </Button>
          </div>
        }
      />

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* ── Section 1: Budget Bar ── */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-xs text-gray-500 mb-0.5">OTB Budget</p>
                <p className="text-lg font-bold text-gray-900">
                  ₹{(BUDGET_TOTAL / 1e7).toFixed(1)} Cr
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Buyer Allocation</p>
                <p className="text-lg font-bold text-gray-900">
                  ₹{(BUDGET_USED / 1e7).toFixed(2)} Cr
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Remaining</p>
                <p
                  className={cn(
                    'text-lg font-bold',
                    budgetPct > 90 ? 'text-amber-600' : 'text-emerald-600',
                  )}
                >
                  ₹{((BUDGET_TOTAL - BUDGET_USED) / 1e7).toFixed(2)} Cr
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 mb-0.5">Utilization</p>
              <p
                className={cn(
                  'text-lg font-bold',
                  budgetPct > 90 ? 'text-amber-600' : 'text-gray-900',
                )}
              >
                {budgetPct}%
              </p>
            </div>
          </div>
          <Progress value={budgetPct} className="h-2" />
        </div>

        {/* ── Section 2: KPI Summary Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <p className="text-xs text-gray-500">Combinations</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{MOCK_ROWS.length}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <p className="text-xs text-gray-500">Options (Sys / Buyer)</p>
            <p className="text-xl font-bold text-gray-900 mt-1">
              {totalSystemOptions}{' '}
              <span className="text-gray-400 font-normal text-sm">/</span>{' '}
              {totalBuyerOptions}
            </p>
            <DeltaBadge current={totalBuyerOptions} historical={totalSystemOptions} />
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <p className="text-xs text-gray-500">Qty (Sys / Buyer)</p>
            <p className="text-xl font-bold text-gray-900 mt-1">
              {(totalSystemQty / 1000).toFixed(1)}K{' '}
              <span className="text-gray-400 font-normal text-sm">/</span>{' '}
              {(totalBuyerQty / 1000).toFixed(1)}K
            </p>
            <DeltaBadge current={totalBuyerQty} historical={totalSystemQty} />
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <p className="text-xs text-gray-500">Avg Depth</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{avgDepth}</p>
            <p className="text-xs text-gray-400 mt-0.5">units per option</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <p className="text-xs text-gray-500">Newness</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{newPct}%</p>
            <p className="text-xs text-gray-400 mt-0.5">{100 - newPct}% carryover</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <p className="text-xs text-gray-500">Price Bands</p>
            <div className="flex items-end gap-1.5 mt-1.5">
              {[
                { label: '₹8-1K', count: 9, h: 16 },
                { label: '₹1-1.5K', count: 22, h: 28 },
                { label: '₹1.5-2K', count: 6, h: 12 },
              ].map((b) => (
                <div key={b.label} className="flex flex-col items-center">
                  <span className="text-[9px] text-gray-400 leading-tight">{b.label}</span>
                  <div
                    className="w-5 bg-indigo-300 rounded-t mt-0.5"
                    style={{ height: `${b.h}px` }}
                  />
                  <span className="text-[10px] font-medium text-gray-600">{b.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Section 3: Table Card ── */}
        <div className="bg-white rounded-lg border border-gray-200">
          {/* Filters */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FilterSelect
                  value="all"
                  onChange={() => {}}
                  placeholder="All Bricks"
                  options={[{ value: 'all', label: 'All Bricks' }]}
                />
                <FilterSelect
                  value="all"
                  onChange={() => {}}
                  placeholder="All Fabrics"
                  options={[{ value: 'all', label: 'All Fabrics' }]}
                />
                <FilterSelect
                  value="all"
                  onChange={() => {}}
                  placeholder="All Fits"
                  options={[{ value: 'all', label: 'All Fits' }]}
                />
                <FilterSelect
                  value="contribution"
                  onChange={() => {}}
                  placeholder="Sort by"
                  options={[
                    { value: 'contribution', label: 'Sort: Contribution' },
                    { value: 'deviation', label: 'Sort: Biggest Change' },
                    { value: 'ros', label: 'Sort: Best ROS' },
                    { value: 'modified', label: 'Sort: Buyer Modified' },
                  ]}
                />
              </div>
              <div className="flex items-center gap-2">
                <FilterSelect
                  value="all"
                  onChange={() => {}}
                  placeholder="All States"
                  options={[
                    { value: 'all', label: 'All States' },
                    { value: 'default', label: 'Unreviewed' },
                    { value: 'modified', label: 'Modified' },
                    { value: 'approved', label: 'Approved' },
                    { value: 'flagged', label: 'Flagged' },
                  ]}
                />
                <Button variant="outline" size="sm">
                  <Columns3 className="w-4 h-4 mr-1.5" />
                  Columns
                </Button>
              </div>
            </div>
          </div>

          {/* ── Main Table ── */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="w-10 px-2 py-2.5" />
                  <th className="text-left px-4 py-2.5 text-xs uppercase text-gray-500 font-medium whitespace-nowrap min-w-[150px]">
                    Brick
                  </th>
                  <th className="text-left px-3 py-2.5 text-xs uppercase text-gray-500 font-medium whitespace-nowrap">
                    Brand
                  </th>
                  <th className="text-left px-3 py-2.5 text-xs uppercase text-gray-500 font-medium whitespace-nowrap">
                    Fabric
                  </th>
                  <th className="text-left px-3 py-2.5 text-xs uppercase text-gray-500 font-medium whitespace-nowrap">
                    Fit
                  </th>
                  <th className="text-left px-3 py-2.5 text-xs uppercase text-gray-500 font-medium whitespace-nowrap">
                    Length
                  </th>
                  <th className="text-left px-3 py-2.5 text-xs uppercase text-gray-500 font-medium whitespace-nowrap">
                    Pattern
                  </th>
                  <th className="text-center px-3 py-2.5 text-xs uppercase text-gray-500 font-medium whitespace-nowrap">
                    Colors
                  </th>
                  <th className="text-center px-3 py-2.5 text-xs uppercase text-gray-500 font-medium whitespace-nowrap">
                    <span className="inline-flex items-center gap-1">
                      ROS <Info className="w-3 h-3 text-gray-400" />
                    </span>
                  </th>
                  <th className="text-right px-3 py-2.5 text-xs uppercase text-gray-500 font-medium whitespace-nowrap">
                    Contrib %
                  </th>
                  {/* Buyer zone */}
                  <th className="text-right px-3 py-2.5 text-xs uppercase text-gray-500 font-semibold whitespace-nowrap border-l-2 border-indigo-200 bg-indigo-50/40">
                    Buyer Opts
                  </th>
                  <th className="text-center px-2 py-2.5 text-xs text-gray-400 whitespace-nowrap bg-indigo-50/40">
                    vs Sys
                  </th>
                  <th className="text-right px-3 py-2.5 text-xs uppercase text-gray-500 font-semibold whitespace-nowrap bg-indigo-50/40">
                    Buyer Qty
                  </th>
                  <th className="text-center px-2 py-2.5 text-xs text-gray-400 whitespace-nowrap bg-indigo-50/40">
                    vs Sys
                  </th>
                  <th className="text-right px-3 py-2.5 text-xs uppercase text-gray-500 font-medium whitespace-nowrap bg-indigo-50/40">
                    MRP Range
                  </th>
                  {/* End buyer zone */}
                  <th className="text-center px-3 py-2.5 text-xs uppercase text-gray-500 font-medium whitespace-nowrap">
                    Stores
                  </th>
                  <th className="text-left px-3 py-2.5 text-xs uppercase text-gray-500 font-medium whitespace-nowrap">
                    Source
                  </th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody>
                {MOCK_ROWS.map((row) => {
                  const isSelected = selectedRow?.id === row.id
                  const rowBg = isSelected
                    ? 'bg-indigo-50'
                    : row.state === 'flagged'
                      ? 'bg-amber-50/30'
                      : ''
                  return (
                    <tr
                      key={row.id}
                      className={cn(
                        'border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-50',
                        rowBg,
                      )}
                      onClick={() => {
                        setSelectedRow(row)
                        setDetailTab('colors')
                      }}
                    >
                      <td className="px-2 py-3 text-center">
                        <RowStateIcon state={row.state} />
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-gray-900">{row.brick}</span>
                        {row.isNew && (
                          <Badge variant="info" size="sm" className="ml-1.5">
                            New
                          </Badge>
                        )}
                      </td>
                      <td className="px-3 py-3 text-xs text-gray-700">{row.brand}</td>
                      <td className="px-3 py-3 text-xs text-gray-700">{row.fabric}</td>
                      <td className="px-3 py-3 text-xs text-gray-700">{row.fit}</td>
                      <td className="px-3 py-3 text-xs text-gray-700">{row.length}</td>
                      <td className="px-3 py-3 text-xs text-gray-700">{row.pattern}</td>
                      <td className="px-3 py-3 text-center">
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600">
                          <Palette className="w-3 h-3" />
                          {row.colors}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex justify-center">
                          <RosIndicator ros={row.ros} />
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-400 rounded-full"
                              style={{
                                width: `${Math.min(row.contributionPct * 4, 100)}%`,
                              }}
                            />
                          </div>
                          <span className="text-xs font-medium text-gray-700">
                            {row.contributionPct}%
                          </span>
                        </div>
                      </td>
                      {/* Buyer zone */}
                      <td className="px-3 py-3 text-right border-l-2 border-indigo-100 bg-indigo-50/20">
                        <span
                          className={cn(
                            'text-sm font-semibold',
                            row.state === 'modified' ? 'text-blue-700' : 'text-gray-900',
                          )}
                        >
                          {row.buyer.options}
                        </span>
                      </td>
                      <td className="px-2 py-3 text-center bg-indigo-50/20">
                        <DeltaBadge
                          current={row.buyer.options}
                          historical={row.system.options}
                        />
                      </td>
                      <td className="px-3 py-3 text-right bg-indigo-50/20">
                        <span
                          className={cn(
                            'text-sm font-semibold',
                            row.state === 'modified' ? 'text-blue-700' : 'text-gray-900',
                          )}
                        >
                          {row.buyer.qty >= 1000
                            ? `${(row.buyer.qty / 1000).toFixed(1)}K`
                            : row.buyer.qty}
                        </span>
                      </td>
                      <td className="px-2 py-3 text-center bg-indigo-50/20">
                        <DeltaBadge current={row.buyer.qty} historical={row.system.qty} />
                      </td>
                      <td className="px-3 py-3 text-right text-xs text-gray-700 bg-indigo-50/20 whitespace-nowrap">
                        {row.buyer.mrp}
                      </td>
                      {/* End buyer zone */}
                      <td className="px-3 py-3 text-center">
                        <span className="text-sm font-medium text-gray-900">
                          {row.storeSpread}
                        </span>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <Badge
                          variant={row.source.includes('FTF') ? 'info' : 'secondary'}
                          size="sm"
                        >
                          {row.source}
                        </Badge>
                      </td>
                      <td className="px-2 py-3">
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Totals Footer */}
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-6">
                <span className="text-gray-500">
                  Combinations:{' '}
                  <span className="font-semibold text-gray-900">{MOCK_ROWS.length}</span>
                </span>
                <span className="text-gray-500">
                  Buyer Options:{' '}
                  <span className="font-semibold text-gray-900">{totalBuyerOptions}</span>
                </span>
                <span className="text-gray-500">
                  Buyer Qty:{' '}
                  <span className="font-semibold text-gray-900">
                    {(totalBuyerQty / 1000).toFixed(1)}K
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-3 text-gray-500">
                <span className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full border-2 border-gray-300" /> Unreviewed
                </span>
                <span className="flex items-center gap-1">
                  <Edit3 className="w-3 h-3 text-blue-500" /> Modified
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Approved
                </span>
                <span className="flex items-center gap-1">
                  <Flag className="w-3 h-3 text-amber-500" /> Flagged
                </span>
              </div>
            </div>
          </div>

          <Pagination
            currentPage={1}
            totalPages={3}
            onPageChange={() => {}}
            totalItems={150}
            pageSize={50}
            onPageSizeChange={() => {}}
          />
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          Detail Panel (Sheet from right)
          ════════════════════════════════════════════════════════════════════════ */}
      <Sheet
        isOpen={selectedRow !== null}
        onClose={() => setSelectedRow(null)}
        title={selectedRow?.brick ?? ''}
        description={
          selectedRow
            ? `${selectedRow.fabric} / ${selectedRow.fit} / ${selectedRow.length} / ${selectedRow.pattern}`
            : undefined
        }
        width="lg"
      >
        {selectedRow && (
          <div className="flex flex-col h-full">
            {/* Quick Actions */}
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <RowStateIcon state={selectedRow.state} />
                <span className="text-sm font-medium text-gray-700 capitalize">
                  {selectedRow.state === 'default' ? 'Unreviewed' : selectedRow.state}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Flag className="w-3.5 h-3.5" />
                  Flag
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit
                </Button>
                <Button variant="primary" size="sm" className="gap-1.5">
                  <Check className="w-3.5 h-3.5" />
                  Approve
                </Button>
              </div>
            </div>

            {/* Panel KPIs */}
            <div className="px-5 py-3 border-b border-gray-100">
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <p className="text-[10px] uppercase text-gray-400">ROS</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <RosIndicator ros={selectedRow.ros} />
                    <span className="text-[10px] text-gray-400">u/store/wk</span>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-gray-400">ASP</p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5">
                    ₹{selectedRow.asp.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-gray-400">Contribution</p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5">
                    {selectedRow.contributionPct}%
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-gray-400">Stores</p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5">
                    {selectedRow.storeSpread}
                  </p>
                </div>
              </div>
            </div>

            {/* H → S → B Comparison Strip */}
            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50">
              <p className="text-[10px] uppercase text-gray-400 mb-2">
                Options / Quantity Progression
              </p>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-[10px] text-gray-400 mb-1">Historical</p>
                  <p className="text-lg font-bold text-gray-400">
                    {selectedRow.historical.options}
                  </p>
                  <p className="text-xs text-gray-400">
                    {selectedRow.historical.qty > 0
                      ? `${(selectedRow.historical.qty / 1000).toFixed(1)}K qty`
                      : '—'}
                  </p>
                </div>
                <div className="text-center border-x border-gray-200 relative">
                  <p className="text-[10px] text-gray-400 mb-1">System</p>
                  <p className="text-lg font-bold text-gray-700">
                    {selectedRow.system.options}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(selectedRow.system.qty / 1000).toFixed(1)}K qty
                  </p>
                  {selectedRow.historical.options > 0 && (
                    <div className="absolute -top-0.5 right-2">
                      <DeltaBadge
                        current={selectedRow.system.options}
                        historical={selectedRow.historical.options}
                      />
                    </div>
                  )}
                </div>
                <div className="text-center relative">
                  <p className="text-[10px] text-blue-500 font-medium mb-1">Buyer</p>
                  <p
                    className={cn(
                      'text-lg font-bold',
                      selectedRow.state === 'modified' ? 'text-blue-700' : 'text-gray-900',
                    )}
                  >
                    {selectedRow.buyer.options}
                  </p>
                  <p className="text-xs text-gray-700">
                    {(selectedRow.buyer.qty / 1000).toFixed(1)}K qty
                  </p>
                  <div className="absolute -top-0.5 right-2">
                    <DeltaBadge
                      current={selectedRow.buyer.options}
                      historical={selectedRow.system.options}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ── Tabs ── */}
            <Tabs
              value={detailTab}
              onValueChange={setDetailTab}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <TabsList className="px-5 pt-2 bg-white border-b border-gray-100 shrink-0">
                <TabsTrigger value="colors" className="gap-1.5">
                  <Palette className="w-3.5 h-3.5" />
                  Colors ({selectedRow.colors})
                </TabsTrigger>
                <TabsTrigger value="performance" className="gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5" />
                  Performance
                </TabsTrigger>
                <TabsTrigger value="stores" className="gap-1.5">
                  <Store className="w-3.5 h-3.5" />
                  Stores ({selectedRow.storeSpread})
                </TabsTrigger>
                <TabsTrigger value="derivation" className="gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  Derivation
                </TabsTrigger>
              </TabsList>

              {/* ── Colors Tab ── */}
              <TabsContent value="colors" className="flex-1 overflow-auto px-5 py-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">
                      {MOCK_COLOR_BREAKDOWN.length} Colors
                    </p>
                    <Button variant="outline" size="sm">
                      + Add Color
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {MOCK_COLOR_BREAKDOWN.map((c) => (
                      <div
                        key={c.color}
                        className="bg-gray-50 rounded-lg p-3 border border-gray-100"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-5 h-5 rounded-full border border-gray-200 shrink-0"
                              style={{ backgroundColor: c.hex }}
                            />
                            <div>
                              <span className="text-sm font-medium text-gray-900">
                                {c.color}
                              </span>
                              {c.isNew && (
                                <Badge variant="info" size="sm" className="ml-1.5">
                                  New
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <TrendIcon trend={c.trend} />
                            <RosIndicator ros={c.ros} />
                            <span className="text-xs text-gray-500 w-10 text-right">
                              {c.pct}%
                            </span>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3 mt-2.5 text-center">
                          <div>
                            <p className="text-[10px] text-gray-400">Historical</p>
                            <p className="text-xs font-medium text-gray-500">
                              {c.historicalQty > 0
                                ? `${(c.historicalQty / 1000).toFixed(1)}K`
                                : '—'}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-400">System</p>
                            <p className="text-xs font-medium text-gray-700">
                              {(c.systemQty / 1000).toFixed(1)}K
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] text-blue-500 font-medium">Buyer</p>
                            <p className="text-xs font-semibold text-gray-900">
                              {(c.buyerQty / 1000).toFixed(1)}K
                            </p>
                          </div>
                        </div>
                        <div className="mt-2">
                          <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-400 rounded-full"
                              style={{ width: `${c.pct}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* ── Performance Tab ── */}
              <TabsContent value="performance" className="flex-1 overflow-auto px-5 py-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                      <p className="text-[10px] uppercase text-gray-400">Sell-Through (LY)</p>
                      <p className="text-xl font-bold text-gray-900 mt-1">72%</p>
                      <p className="text-xs text-emerald-600">Above avg (65%)</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                      <p className="text-[10px] uppercase text-gray-400">
                        ROS Trend (3 Seasons)
                      </p>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-sm text-gray-400">2.1</span>
                        <span className="text-gray-300">→</span>
                        <span className="text-sm text-gray-500">2.8</span>
                        <span className="text-gray-300">→</span>
                        <span className="text-lg font-bold text-gray-900">3.2</span>
                      </div>
                      <p className="text-xs text-emerald-600 flex items-center gap-0.5 mt-1">
                        <TrendingUp className="w-3 h-3" /> +52% over 3 seasons
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <p className="text-[10px] uppercase text-gray-400 mb-2">
                      Price Realization
                    </p>
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Avg MRP</p>
                        <p className="text-sm font-semibold text-gray-900">₹1,399</p>
                      </div>
                      <div className="text-xl text-gray-300">→</div>
                      <div>
                        <p className="text-xs text-gray-500">Avg Selling Price</p>
                        <p className="text-sm font-semibold text-gray-900">₹1,249</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Discount</p>
                        <p className="text-sm font-semibold text-amber-600">10.7%</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <p className="text-[10px] uppercase text-gray-400 mb-2">
                      Category Ranking
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="bg-indigo-100 text-indigo-700 font-bold text-lg w-10 h-10 rounded-lg flex items-center justify-center">
                        #2
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          2nd highest contributor
                        </p>
                        <p className="text-xs text-gray-500">
                          out of {MOCK_ROWS.length} combinations
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-blue-900">
                          System recommends +50% options vs historical
                        </p>
                        <p className="text-xs text-blue-700 mt-1">
                          FTF detected 35% growth in Slim Fit Ankle across Trends stores. 3 new
                          West-region stores contribute to higher demand.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* ── Stores Tab ── */}
              <TabsContent value="stores" className="flex-1 overflow-auto px-5 py-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">
                      {selectedRow.storeSpread} stores across {MOCK_STORES.length} formats
                    </p>
                    <Input
                      type="text"
                      placeholder="Search stores..."
                      leftIcon={<Search className="w-3.5 h-3.5" />}
                      containerClassName="w-48"
                      className="h-8 !py-0 text-xs"
                    />
                  </div>

                  {MOCK_STORES.map((group) => (
                    <div key={group.format}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-gray-900 uppercase">
                            {group.format}
                          </span>
                          <Badge variant="secondary" size="sm">
                            {group.stores.length} stores
                          </Badge>
                        </div>
                        <span className="text-xs text-gray-500">
                          {group.stores
                            .reduce((s: number, st: any) => s + st.qty, 0)
                            .toLocaleString()}{' '}
                          qty
                        </span>
                      </div>
                      <div className="bg-gray-50 rounded-lg border border-gray-100 overflow-hidden mb-3">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-gray-200 bg-gray-100/50">
                              <th className="text-left px-3 py-1.5 font-medium text-gray-500">
                                Store
                              </th>
                              <th className="text-right px-3 py-1.5 font-medium text-gray-500">
                                Options
                              </th>
                              <th className="text-right px-3 py-1.5 font-medium text-gray-500">
                                Qty
                              </th>
                              <th className="text-right px-3 py-1.5 font-medium text-gray-500">
                                ROS
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {group.stores.map((store: any) => (
                              <tr
                                key={store.site}
                                className="border-b border-gray-100 last:border-0"
                              >
                                <td className="px-3 py-2">
                                  <span className="text-gray-900 font-medium">
                                    {store.name}
                                  </span>
                                  <span className="text-gray-400 ml-1.5">{store.site}</span>
                                </td>
                                <td className="px-3 py-2 text-right text-gray-700">
                                  {store.options}
                                </td>
                                <td className="px-3 py-2 text-right text-gray-700">
                                  {store.qty}
                                </td>
                                <td className="px-3 py-2 text-right">
                                  <RosIndicator ros={store.ros} />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* ── Derivation Tab ── */}
              <TabsContent value="derivation" className="flex-1 overflow-auto px-5 py-4">
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <p className="text-[10px] uppercase text-gray-400 mb-2">Data Source</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="info" size="sm">
                        {selectedRow.source}
                      </Badge>
                      <span className="text-xs text-gray-600">
                        {selectedRow.source.includes('FTF')
                          ? 'Forecast-to-Fulfill engine blended with past sales'
                          : selectedRow.source === 'Historical'
                            ? 'Based on last 2 seasons of sales performance'
                            : 'Based on past sales data only'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <p className="text-[10px] uppercase text-gray-400 mb-2">Buying Model</p>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          selectedRow.buyingModel === 'Manufacturing' ? 'info' : 'default'
                        }
                        size="sm"
                      >
                        {selectedRow.buyingModel}
                      </Badge>
                      <span className="text-xs text-gray-600">
                        {selectedRow.buyingModel === 'Manufacturing'
                          ? 'New production — 12-16 week lead time'
                          : 'Vendor catalog sourcing — 4-6 week lead time'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <p className="text-[10px] uppercase text-gray-400 mb-2">Confidence</p>
                    <div className="flex items-center gap-3">
                      <div className="w-24">
                        <Progress value={78} className="h-2" />
                      </div>
                      <span className="text-sm font-medium text-gray-900">78%</span>
                      <span className="text-xs text-gray-500">4 data signals</span>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <p className="text-[10px] uppercase text-gray-400 mb-2">Signals Used</p>
                    <div className="space-y-2">
                      {[
                        { signal: 'Past 2 seasons sales', weight: '40%', status: 'Strong' },
                        { signal: 'FTF demand forecast', weight: '30%', status: 'Strong' },
                        { signal: 'Market trend data', weight: '20%', status: 'Moderate' },
                        { signal: 'Store cluster affinity', weight: '10%', status: 'Weak' },
                      ].map((s) => (
                        <div key={s.signal} className="flex items-center justify-between">
                          <span className="text-xs text-gray-700">{s.signal}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">{s.weight}</span>
                            <Badge
                              variant={
                                s.status === 'Strong'
                                  ? 'success'
                                  : s.status === 'Moderate'
                                    ? 'warning'
                                    : 'secondary'
                              }
                              size="sm"
                            >
                              {s.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {selectedRow.isNew && (
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-blue-900">
                            New introduction — no historical data
                          </p>
                          <p className="text-xs text-blue-700 mt-1">
                            Recommended by FTF based on market trend analysis. Consider
                            conservative quantities and monitoring sell-through in weeks 1-4.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </Sheet>
    </div>
  )
}
