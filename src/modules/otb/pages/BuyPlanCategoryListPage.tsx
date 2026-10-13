import React, { useState } from 'react';
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronRight, TrendingUp, AlertTriangle } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  PageHeader,
  Badge,
  Button,
  DataTable,
  DataTableHeader,
  DataTableBody,
  DataTableRow,
  DataTableHead,
  DataTableCell,
  EmptyState,
  Pagination,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui';
import { cn } from '@/lib/utils';
import {
  getSaleMonthLabel,
  getStageBadgeConfig,
  type BPStage,
} from '../data/mockBuyingModuleV2';
import { useCategoryExceptions, useCategoryGroups } from '../api/categoryBuyPlanApi';
import { controlReason, lakhText, moneyText, numberText, planPath, toCategory, toOption } from '../api/categoryPlanData';
import { CategoryQueryState } from '../components/CategoryQueryState';

const PIPELINE_STAGES = ['Planning', 'Demand', 'Buyer Review', 'Cat Approval', 'Commercial', 'OTB Review', 'Released']
const STAGE_INDEX: Record<BPStage, number> = {
  planning: 0,
  demand_calc: 1,
  buyer_review: 2,
  cat_approval: 3,
  commercial: 4,
  otb_review: 5,
  released: 6,
}

function PipelineBar({ stage }: { stage: BPStage }) {
  const current = STAGE_INDEX[stage]
  return (
    <div className="flex gap-0.5 items-center min-w-[160px]" title={`Stage: ${PIPELINE_STAGES[current]}`}>
      {PIPELINE_STAGES.map((s, i) => (
        <div
          key={s}
          title={s}
          className={cn(
            'h-2 flex-1 rounded-full transition-colors',
            i < current
              ? 'bg-primary/40'
              : i === current
              ? 'bg-primary'
              : 'bg-gray-200'
          )}
        />
      ))}
    </div>
  )
}

type TabId = 'pipeline' | 'exceptions'

export default function BuyPlanCategoryListPage() {
  const { saleMonth } = useParams<{ saleMonth: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({})
  const [activeTab, setActiveTab] = useState<TabId>('pipeline')
  const [exceptionPageState, setExceptionPageState] = useState<{ runId?: string; page: number }>({ page: 1 })
  const reduceMotion = useReducedMotion()

  const monthLabel = getSaleMonthLabel(saleMonth ?? '')
  const query = useCategoryGroups('categories', { sale_month: saleMonth, run_id: searchParams.get('run') ?? undefined })
  const runId = query.data?.run.run_id ?? searchParams.get('run') ?? undefined
  const exceptionPage = exceptionPageState.runId === runId ? exceptionPageState.page : 1
  const exceptions = useCategoryExceptions(runId ?? '', exceptionPage, activeTab === 'exceptions')
  const categories = query.data?.items.map(row => toCategory(row, query.data.run)) ?? []
  const heldOptions = exceptions.data?.items.map(row => ({ ...toOption(row, exceptions.data.run), catName: row.attributes.category_name ?? row.category })) ?? []

  const totalOTB = query.data?.summary.otb_value
  const totalOptions = query.data?.summary.option_count ?? 0
  const totalHeld = query.data?.summary.held_count ?? 0
  const totalExceptions = exceptions.data?.pagination.total_records ?? totalHeld
  const totalSysQty = query.data?.summary.total_quantity ?? 0

  const toggleExpand = (catCode: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setExpandedCats(prev => ({ ...prev, [catCode]: !prev[catCode] }))
  }

  if (saleMonth && (query.isPending || query.isError)) return <CategoryQueryState query={query}
    variant="categories" title={`${monthLabel} - Buy Plans`} backTo="/buy-plans?tab=category" />
  if (!saleMonth || categories.length === 0) {
    return (
      <div className="animate-fadeInUp p-4 space-y-6">
        <PageHeader title="Buy Plans" backTo="/buy-plans" />
        <EmptyState title="No categories found" description="No buy plan data for this sale month." />
      </div>
    )
  }

  return (
    <div className="animate-fadeInUp p-4 space-y-6">
      <PageHeader title={`${monthLabel} - Buy Plans`} backTo="/buy-plans" />

      {/* Summary stat strip */}
      <div className="flex flex-wrap gap-3">
        {[
          { label: 'Total OTB', value: lakhText(totalOTB) },
          { label: 'Categories', value: categories.length },
          { label: 'Options', value: totalOptions > 0 ? totalOptions.toLocaleString() : '-' },
          { label: 'Total Qty', value: totalSysQty > 0 ? totalSysQty.toLocaleString() : '-' },
          { label: 'Held Options', value: totalHeld, highlight: totalHeld > 0 },
        ].map((stat) => (
          <div
            key={stat.label}
            className={cn(
              'bg-white border rounded-lg px-4 py-3 min-w-[120px] flex-1',
              stat.highlight ? 'border-amber-200 bg-amber-50' : 'border-gray-200'
            )}
          >
            <div className={cn('text-xs font-medium mb-0.5', stat.highlight ? 'text-amber-600' : 'text-gray-500')}>
              {stat.label}
            </div>
            <div className={cn('text-lg font-semibold', stat.highlight ? 'text-amber-700' : 'text-gray-900')}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('pipeline')}
          className={cn(
            'px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
            activeTab === 'pipeline'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          )}
        >
          Pipeline
        </button>
        <button
          onClick={() => setActiveTab('exceptions')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
            activeTab === 'exceptions'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          )}
        >
          Exceptions Needing Approval
          {totalExceptions > 0 && (
            <span className={cn(
              'rounded-full px-1.5 py-0.5 text-[10px] font-bold min-w-[18px] text-center',
              activeTab === 'exceptions' ? 'bg-primary text-white' : 'bg-amber-100 text-amber-700'
            )}>
              {totalExceptions}
            </span>
          )}
        </button>
      </div>

      {/* Pipeline tab */}
      {activeTab === 'pipeline' && (
        <DataTable className="rounded-lg border border-gray-200 bg-white">
          <DataTableHeader>
              <DataTableHead>Category</DataTableHead>
              <DataTableHead>Pipeline Progress</DataTableHead>
              <DataTableHead>Options</DataTableHead>
              <DataTableHead>Total Qty</DataTableHead>
              <DataTableHead>Held</DataTableHead>
              <DataTableHead>OTB Value</DataTableHead>
              <DataTableHead>Stage</DataTableHead>
              <DataTableHead></DataTableHead>
          </DataTableHeader>
          <DataTableBody>
            {categories.map((cat) => {
              const { label: stageLabel, variant: stageVariant } = getStageBadgeConfig(cat.stage)
              const isExpanded = !!expandedCats[cat.code]
              const hasSubs = cat.subcategories.length > 0
              const panelId = `subcategories-${encodeURIComponent(cat.code)}`

              return (
                <React.Fragment key={cat.code}>
                  <DataTableRow
                    className="hover:bg-gray-50"
                    onClick={() => navigate(planPath(saleMonth, cat.code, undefined, undefined, runId))}
                  >
                    <DataTableCell>
                      <div className="flex items-center gap-2">
                        {hasSubs && (
                          <button
                            type="button"
                            aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${cat.name}`}
                            aria-expanded={isExpanded}
                            aria-controls={panelId}
                            className="rounded text-gray-400 hover:text-gray-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                            onClick={(e) => toggleExpand(cat.code, e)}
                          >
                            <ChevronRight className={cn('w-4 h-4 transition-transform duration-200 ease-out motion-reduce:transition-none', isExpanded && 'rotate-90')} />
                          </button>
                        )}
                        <span className="font-medium text-gray-900">{cat.name}</span>
                      </div>
                    </DataTableCell>
                    <DataTableCell>
                      <PipelineBar stage={cat.stage} />
                    </DataTableCell>
                    <DataTableCell>
                      {cat.optionsCount > 0 ? cat.optionsCount : '-'}
                    </DataTableCell>
                    <DataTableCell>
                      {(cat.totalSysQty ?? 0) > 0 ? (cat.totalSysQty ?? 0).toLocaleString() : '-'}
                    </DataTableCell>
                    <DataTableCell>
                      {cat.heldCount > 0 ? (
                        <Badge variant="error" size="sm">{cat.heldCount}</Badge>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </DataTableCell>
                    <DataTableCell>
                      {cat.otbValue !== null ? (
                        <span className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3 text-gray-400" />
                          {lakhText(cat.otbValue)}
                        </span>
                      ) : '-'}
                    </DataTableCell>
                    <DataTableCell>
                      <Badge variant={stageVariant} size="sm">{stageLabel}</Badge>
                    </DataTableCell>
                    <DataTableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(planPath(saleMonth, cat.code, undefined, undefined, runId))
                        }}
                      >
                        View
                      </Button>
                    </DataTableCell>
                  </DataTableRow>

                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.tr key="subcategories" className="bg-gray-50">
                        <td colSpan={8} className="p-0">
                          <motion.div
                            id={panelId}
                            role="region"
                            aria-label={`${cat.name} subcategories`}
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: reduceMotion ? 0 : 0.24, ease: 'easeInOut' }}
                            className="overflow-hidden"
                          >
                            <div className="pb-1">
                              {cat.subcategories.map((sub, index) => (
                                <div key={sub.code} className="relative pl-14">
                                  <div aria-hidden="true" className="absolute left-5 top-0 h-1/2 w-9 border-b border-l border-gray-200" />
                                  {index < cat.subcategories.length - 1 && <div aria-hidden="true" className="absolute left-5 top-1/2 bottom-0 border-l border-gray-200" />}
                                  <Link to={planPath(saleMonth, cat.code, sub.code, undefined, runId)} aria-label={sub.name}
                                    className={cn('block cursor-pointer bg-white px-4 py-4 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40',
                                    index < cat.subcategories.length - 1 && 'border-b border-gray-100')}>
                                    <dl className="grid grid-cols-12 gap-5 text-left">
                                      <div className="col-span-3 min-w-0">
                                        <dt className="text-[10px] uppercase tracking-wide text-gray-500 mb-2">Subcategory</dt>
                                        <dd>
                                          <span className="font-medium text-gray-900">{sub.name}</span>
                                        </dd>
                                      </div>
                                      <div>
                                        <dt className="text-[10px] uppercase tracking-wide text-gray-500 mb-2">Bricks</dt>
                                        <dd className="font-medium text-gray-900">{sub.brickCount}</dd>
                                      </div>
                                      <div className="col-span-2">
                                        <dt className="text-[10px] uppercase tracking-wide text-gray-500 mb-2">Options</dt>
                                        <dd className="font-medium text-gray-900">{sub.optionsCount}</dd>
                                      </div>
                                      <div className="col-span-2">
                                        <dt className="text-[10px] uppercase tracking-wide text-gray-500 mb-2">Sys Buy Qty</dt>
                                        <dd className="font-medium text-gray-900">{numberText(sub.sysBuyQty)}</dd>
                                      </div>
                                      <div className="col-span-2">
                                        <dt className="text-[10px] uppercase tracking-wide text-gray-500 mb-2">Held</dt>
                                        <dd className={cn('font-medium', sub.heldCount > 0 ? 'text-red-600' : 'text-gray-900')}>
                                          {sub.heldCount > 0 ? sub.heldCount : '-'}
                                        </dd>
                                      </div>
                                      <div className="col-span-2">
                                        <dt className="text-[10px] uppercase tracking-wide text-gray-500 mb-2">Stage</dt>
                                        <dd><Badge variant={getStageBadgeConfig(sub.stage).variant} size="sm">
                                          {getStageBadgeConfig(sub.stage).label}
                                        </Badge></dd>
                                      </div>
                                    </dl>
                                  </Link>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        </td>
                      </motion.tr>
                    )}
                  </AnimatePresence>
                </React.Fragment>
              )
            })}
          </DataTableBody>
        </DataTable>
      )}

      {/* Exceptions tab */}
      {activeTab === 'exceptions' && (
        <div>
          {exceptions.isPending || exceptions.isError ? <CategoryQueryState query={exceptions} variant="exceptions" /> : heldOptions.length === 0 ? (
            <EmptyState
              title="No exceptions"
              description="All options are passing CTL controls. No exceptions require approval."
            />
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>
                  <strong>{totalExceptions}</strong> option{totalExceptions > 1 ? 's' : ''} held across all categories - failed CTL control checks. Only Commercial can accept or reject these.
                </span>
              </div>

              <DataTable className="rounded-lg border border-gray-200 bg-white">
                <DataTableHeader>
                    <DataTableHead>Option Code</DataTableHead>
                    <DataTableHead>Category</DataTableHead>
                    <DataTableHead>Class</DataTableHead>
                    <DataTableHead>Brand</DataTableHead>
                    <DataTableHead>Color</DataTableHead>
                    <DataTableHead>MRP (₹)</DataTableHead>
                    <DataTableHead>Intake margin</DataTableHead>
                    <DataTableHead>CTL Controls</DataTableHead>
                    <DataTableHead>Reason</DataTableHead>
                </DataTableHeader>
                <DataTableBody>
                  {heldOptions.map((opt) => {
                    const failed: string[] = []
                    if (opt.ctl01 === 'fail') failed.push('CTL-01')
                    if (opt.ctl02 === 'fail') failed.push('CTL-02')
                    if (opt.ctl03 === 'fail') failed.push('CTL-03')
                    return (
                      <DataTableRow key={`${opt.source.category}/${opt.source.subcategory}/${opt.code}`} className="hover:bg-gray-50">
                        <DataTableCell>
                          <span className="font-mono text-xs font-medium text-gray-900">{opt.code}</span>
                        </DataTableCell>
                        <DataTableCell>
                          <span className="text-xs text-gray-700">{opt.catName}</span>
                        </DataTableCell>
                        <DataTableCell>
                          <span className="text-xs">{opt.class_name}</span>
                        </DataTableCell>
                        <DataTableCell>{opt.brand}</DataTableCell>
                        <DataTableCell>
                          <div className="flex items-center gap-1.5">
                            {opt.hexCode && (
                              <div
                                className="w-3 h-3 rounded-full border border-gray-300"
                                // eslint-disable-next-line no-restricted-syntax
                                style={{ backgroundColor: opt.hexCode }}
                              />
                            )}
                            <span className="text-xs">{opt.colorName ?? '-'}</span>
                          </div>
                        </DataTableCell>
                        <DataTableCell>{moneyText(opt.mrp)}</DataTableCell>
                        <DataTableCell>
                          <span className={cn(opt.ctl02 === 'fail' ? 'text-red-600' : 'text-gray-700')}>
                            {numberText(opt.intakeMarginPct, 1)}{opt.intakeMarginPct !== null ? '%' : ''}
                          </span>
                        </DataTableCell>
                        <DataTableCell>
                          <div className="flex gap-1">
                            {[
                              { id: 'CTL-01', status: opt.ctl01 },
                              { id: 'CTL-02', status: opt.ctl02 },
                              { id: 'CTL-03', status: opt.ctl03 },
                            ].map(control => (
                              <Tooltip key={control.id}>
                                <TooltipTrigger asChild>
                                  <button type="button" className="inline-flex cursor-help rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
                                    <Badge size="sm" variant={control.status === 'fail' ? 'error' : control.status === 'warn' ? 'warning' : 'success'}>
                                      {control.id}
                                    </Badge>
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent side="top">
                                  <p className="font-medium">{control.id} {control.status === 'fail' ? 'failed' : control.status === 'pass' ? 'passed' : 'not evaluated'}</p>
                                  <p className="mt-1 first-letter:uppercase">
                                    {control.status === 'fail' ? controlReason(opt, control.id)
                                      : control.status === 'pass' ? 'Control check passed.' : 'This control has not been evaluated.'}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            ))}
                          </div>
                        </DataTableCell>
                        <DataTableCell>
                          <span className="text-xs text-amber-700">
                            {failed.length > 0 ? `Failed ${failed.join(', ')}` : 'Control check failed'}
                          </span>
                        </DataTableCell>
                      </DataTableRow>
                    )
                  })}
                </DataTableBody>
              </DataTable>
              {exceptions.data && (
                <Pagination
                  currentPage={exceptions.data.pagination.page}
                  totalPages={Math.max(1, Math.ceil(exceptions.data.pagination.total_records / exceptions.data.pagination.page_size))}
                  totalItems={exceptions.data.pagination.total_records}
                  pageSize={exceptions.data.pagination.page_size}
                  onPageChange={page => setExceptionPageState({ runId, page })}
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
