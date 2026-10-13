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
import {
  getStageBadgeConfig,
} from '../data/mockBuyingModuleV2';
import { useCategoryGroups } from '../api/categoryBuyPlanApi';
import { planPath, toSubcategory } from '../api/categoryPlanData';
import { CategoryQueryState } from '../components/CategoryQueryState';
import { CategoryPlanBreadcrumbs } from '../components/CategoryPlanBreadcrumbs';

export default function BuyPlanSubcategoryPage() {
  const { saleMonth, catCode } = useParams<{ saleMonth: string; catCode: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const query = useCategoryGroups('subcategories', { sale_month: saleMonth, category: catCode, run_id: searchParams.get('run') ?? undefined })
  const runId = query.data?.run.run_id ?? searchParams.get('run') ?? undefined

  const catName = query.data?.context?.category_name ?? catCode ?? ''
  const subcategories = query.data?.items.map(row => toSubcategory(row, query.data.run)) ?? []

  const totalOptions = query.data?.summary.option_count ?? 0
  const totalSysQty = query.data?.summary.total_quantity ?? 0
  const totalHeld = query.data?.summary.held_count ?? 0

  if (!saleMonth || !catCode) {
    return (
      <div className="animate-fadeInUp p-4 space-y-6">
        <PageHeader title="Subcategories" backTo="/buy-plans" />
        <EmptyState title="Invalid navigation" description="Missing sale month or category." />
      </div>
    )
  }

  if (query.isPending || query.isError) return <CategoryQueryState query={query} variant="subcategories"
    title={`${catName} - Subcategories`} backTo={planPath(saleMonth, undefined, undefined, undefined, runId)} />
  return (
    <div className="animate-fadeInUp p-4 space-y-6">
      <PageHeader
        title={`${catName} - Subcategories`}
        backTo={planPath(saleMonth, undefined, undefined, undefined, runId)}
      />

      {/* Range Summary - always at TOP */}
      <section aria-label="Range summary" className="rounded-lg border border-gray-200 bg-white p-4">
        <CategoryPlanBreadcrumbs saleMonth={saleMonth} runId={runId} category={{ code: catCode, name: catName }} />
        <div className="overflow-x-auto">
          <div className="flex divide-x divide-gray-100">
            {[
              { label: 'Total Options', value: totalOptions.toString() },
              { label: 'Sys Buy Qty', value: totalSysQty.toLocaleString() },
              { label: 'Held Options', value: totalHeld.toString(), highlight: totalHeld > 0 },
              { label: 'Flagged by Planner', value: '-', highlight: false },
              { label: 'Subcategories', value: subcategories.length.toString() },
            ].map((stat) => (
              <div key={stat.label} className="min-w-[120px] flex-1 px-4 py-1 first:pl-0 last:pr-0">
                <div className={cn('text-xs font-medium mb-0.5', stat.highlight ? 'text-amber-600' : 'text-gray-500')}>
                  {stat.label}
                </div>
                <div className={cn('text-lg font-semibold', stat.highlight ? 'text-amber-700' : 'text-gray-900')}>
                  {stat.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Subcategory cards */}
      {subcategories.length === 0 ? (
        <EmptyState
          title="No subcategories"
          description="No subcategories have been defined for this category."
        />
      ) : (
        <div
          // eslint-disable-next-line design-system/prefer-metric-grid -- card grid, not a KPI metric row
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
        >
          {subcategories.map((sub) => {
            const { label: stageLabel, variant: stageVariant } = getStageBadgeConfig(sub.stage)
            return (
              <Card
                key={sub.code}
                className={cn(
                  'cursor-pointer hover:shadow-md transition-shadow border-gray-200 hover:border-primary/30',
                  sub.flaggedCount !== null && sub.flaggedCount > 0 && 'border-amber-200'
                )}
                onClick={() => navigate(planPath(saleMonth, catCode, sub.code, undefined, runId))}
              >
                <CardHeader className="pb-2">
                  {/* eslint-disable-next-line design-system/prefer-section-header -- in-card header, not a page section header */}
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold text-gray-900">{sub.name}</CardTitle>
                    <Badge variant={stageVariant} size="sm">{stageLabel}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                    <div>
                      <div className="text-gray-500 text-xs">Bricks</div>
                      <div className="font-medium text-gray-900">{sub.brickCount}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-xs">Options</div>
                      <div className="font-medium text-gray-900">{sub.optionsCount}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-xs">Sys Buy Qty</div>
                      <div className="font-medium text-gray-900">{sub.sysBuyQty.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-xs">Held</div>
                      <div className={cn('font-medium', sub.heldCount > 0 ? 'text-red-600' : 'text-gray-900')}>
                        {sub.heldCount > 0 ? sub.heldCount : '-'}
                      </div>
                    </div>
                  </div>
                  {sub.flaggedCount !== null && sub.flaggedCount > 0 && (
                    <div className="flex items-center gap-1 text-xs text-amber-700 bg-amber-50 rounded px-2 py-1">
                      <span>{sub.flaggedCount} planner exception{sub.flaggedCount > 1 ? 's' : ''}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-end gap-1 mt-2 pt-2 border-t border-gray-100">
                    <div className="text-xs text-primary">
                      View bricks
                    </div>
                    <ChevronRight className="w-4 h-4 text-primary" />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
