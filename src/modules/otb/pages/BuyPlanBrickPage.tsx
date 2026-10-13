import { useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import {
  PageHeader,
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
} from '@/components/ui';
import { cn } from '@/lib/utils';
import { useCategoryGroups } from '../api/categoryBuyPlanApi';
import { planPath, toBrick } from '../api/categoryPlanData';
import { CategoryQueryState } from '../components/CategoryQueryState';
import { CategoryPlanBreadcrumbs } from '../components/CategoryPlanBreadcrumbs';
import { useBuyPlanStore } from '../stores/buyPlan.store';

export default function BuyPlanBrickPage() {
  const { saleMonth, catCode, subCode } = useParams<{
    saleMonth: string
    catCode: string
    subCode: string
  }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const query = useCategoryGroups('bricks', { sale_month: saleMonth, category: catCode, subcategory: subCode, run_id: searchParams.get('run') ?? undefined })
  const runId = query.data?.run.run_id ?? searchParams.get('run') ?? undefined
  const store = useBuyPlanStore()
  const plannerEdits: Record<string, number> = (store as unknown as Record<string, Record<string, number>>).plannerEdits ?? {}

  const bricks = useMemo(() => query.data?.items.map(toBrick) ?? [], [query.data])
  const subName = query.data?.context?.subcategory_name ?? subCode ?? ''
  const catName = query.data?.context?.category_name ?? catCode ?? ''

  // Auto-navigate if only one brick
  useEffect(() => {
    if (bricks.length === 1 && bricks[0]) {
      navigate(
        planPath(saleMonth, catCode, subCode, bricks[0].code, runId),
        { replace: true }
      )
    }
  }, [bricks, saleMonth, catCode, subCode, runId, navigate])

  const totalSysQty = bricks.reduce((s, b) => s + b.sysBuyQty, 0)
  const totalHeld = bricks.reduce((s, b) => s + b.heldCount, 0)

  if (!saleMonth || !catCode || !subCode) {
    return (
      <div className="animate-fadeInUp p-4 space-y-6">
        <PageHeader title="Bricks" backTo="/buy-plans" />
        <EmptyState title="Invalid navigation" description="Missing route parameters." />
      </div>
    )
  }

  if (query.isPending || query.isError) return <CategoryQueryState query={query} variant="bricks"
    title={`${subName} - Bricks`} backTo={planPath(saleMonth, catCode, undefined, undefined, runId)} />
  if (bricks.length === 0) {
    return (
      <div className="animate-fadeInUp p-4 space-y-6">
        <PageHeader
          title={`${subName} - Bricks`}
          backTo={planPath(saleMonth, catCode, undefined, undefined, runId)}
        />
        <EmptyState title="No bricks found" description="No bricks are defined for this subcategory." />
      </div>
    )
  }

  // Don't render if single brick - useEffect will navigate away
  if (bricks.length === 1 && bricks[0]) return <CategoryQueryState query={{ ...query, isPending: true }} variant="options"
    title={`${bricks[0].code} - Options Workbench`} backTo={planPath(saleMonth, catCode, undefined, undefined, runId)} />

  return (
    <div className="animate-fadeInUp p-4 space-y-6">
      <PageHeader
        title={`${subName} - Bricks`}
        backTo={planPath(saleMonth, catCode, undefined, undefined, runId)}
      />

      {/* Range Summary at TOP */}
      <section aria-label="Range summary" className="rounded-lg border border-gray-200 bg-white p-4">
        <CategoryPlanBreadcrumbs saleMonth={saleMonth} runId={runId}
          category={{ code: catCode, name: catName }} subcategory={{ code: subCode, name: subName }} />
        <div className="overflow-x-auto">
          <div className="flex divide-x divide-gray-100">
            {[
              { label: 'Bricks', value: bricks.length.toString() },
              { label: 'Sys Buy Qty', value: totalSysQty.toLocaleString() },
              { label: 'Planner Qty', value: '-' },
              { label: 'Held Options', value: totalHeld.toString(), highlight: totalHeld > 0 },
              { label: 'Flagged by Planner', value: '-', highlight: false },
            ].map((stat) => (
              <div key={stat.label} className="min-w-[120px] flex-1 px-4 py-1 first:pl-0 last:pr-0">
                <div className={cn('text-xs font-medium mb-0.5', stat.highlight ? 'text-amber-600' : 'text-gray-500')}>
                  {stat.label}
                </div>
                <div className={cn('text-xl font-bold', stat.highlight ? 'text-amber-700' : 'text-gray-900')}>
                  {stat.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Brick cards */}
      {/* eslint-disable-next-line design-system/prefer-metric-grid -- card grid, not a KPI metric row */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {bricks.map((brick) => {
          const plannerQty = plannerEdits[brick.code] ?? brick.plannerQty
          const variance = plannerQty !== null && brick.sysBuyQty > 0
            ? Math.round(((plannerQty - brick.sysBuyQty) / brick.sysBuyQty) * 100)
            : 0
          const hasVariance = variance !== 0

          return (
            <Card
              key={brick.code}
              className={cn(
                'cursor-pointer hover:shadow-md transition-shadow hover:border-primary/30',
                hasVariance ? 'border-amber-300' : 'border-gray-200'
              )}
              onClick={() =>
                navigate(planPath(saleMonth, catCode, subCode, brick.code, runId))
              }
            >
              <CardHeader className="pb-2">
                {/* eslint-disable-next-line design-system/prefer-section-header -- card header row, not a page section header */}
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-gray-900">
                    {brick.code} - {brick.name}
                  </CardTitle>
                  {hasVariance && (
                    <Badge variant="warning" size="sm">
                      {variance > 0 ? '+' : ''}{variance}%
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                  <div>
                    <div className="text-gray-500 text-xs">Options</div>
                    <div className="font-medium text-gray-900">{brick.optionsCount}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs">Held</div>
                    <div className={cn('font-medium', brick.heldCount > 0 ? 'text-red-600' : 'text-gray-900')}>
                      {brick.heldCount > 0 ? brick.heldCount : '-'}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs">Sys Buy Qty</div>
                    <div className="font-medium text-gray-900">
                      {brick.sysBuyQty > 0 ? brick.sysBuyQty.toLocaleString() : '-'}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs">Planner Qty</div>
                    <div className={cn('font-medium', hasVariance ? 'text-amber-700' : 'text-gray-900')}>
                      {plannerQty !== null && plannerQty > 0 ? plannerQty.toLocaleString() : '-'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-1 text-xs text-primary font-medium">
                    View options <ChevronRight className="w-3 h-3" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
