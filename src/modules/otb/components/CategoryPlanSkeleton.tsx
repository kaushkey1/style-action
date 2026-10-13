import { Card, CardContent, CardHeader, Skeleton } from '@/components/ui';
import { cn } from '@/lib/utils';

export type CategorySkeletonVariant = 'months' | 'categories' | 'subcategories' | 'bricks' | 'options' | 'exceptions' | 'stores';

const labels: Record<CategorySkeletonVariant, string> = {
  months: 'Loading buy plan months', categories: 'Loading categories',
  subcategories: 'Loading subcategories', bricks: 'Loading bricks',
  options: 'Loading options', exceptions: 'Loading exceptions', stores: 'Loading store allocations',
};

function SummarySkeleton({ count = 5, compact = false, fullWidth = false }: { count?: number; compact?: boolean; fullWidth?: boolean }) {
  return (
    <div className={cn('flex flex-wrap', compact ? 'gap-2' : 'gap-3')}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={cn('bg-white border border-gray-200 rounded-lg space-y-2',
          compact ? 'px-3 py-2 min-w-[110px]' : 'px-4 py-3 min-w-[120px]', fullWidth && 'flex-1')}>
          <Skeleton className="h-3 w-20" />
          <Skeleton className={cn('w-12', compact ? 'h-5' : 'h-6')} />
        </div>
      ))}
    </div>
  );
}

function TableSkeleton({ columns = 8 }: { columns?: number }) {
  return (
    <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
      <table className="w-full min-w-[800px]">
        <thead>
          <tr className="border-b border-gray-100">
            {Array.from({ length: columns }, (_, i) => (
              <th key={i} className="px-4 py-2.5"><Skeleton className="h-3 w-16" /></th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 5 }, (_, row) => (
            <tr key={row} className="border-b border-gray-50 last:border-0">
              {Array.from({ length: columns }, (_, col) => (
                <td key={col} className="px-4 py-3"><Skeleton className={cn('h-4', col === 0 ? 'w-28' : 'w-12')} /></td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TabsSkeleton() {
  return <div className="flex gap-6 border-b border-gray-200 px-4 py-2.5">
    <Skeleton className="h-5 w-20" /><Skeleton className="h-5 w-44" />
  </div>;
}

function HierarchySkeleton() {
  return <>
    <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Skeleton className="h-5 w-20" /><Skeleton className="h-3 w-3" />
        <Skeleton className="h-5 w-28" /><Skeleton className="h-3 w-3" />
        <Skeleton className="h-5 w-28" />
      </div>
      <div className="overflow-x-auto">
        <div className="flex divide-x divide-gray-100">
          {Array.from({ length: 5 }, (_, i) => <div key={i} className="min-w-[120px] flex-1 px-4 py-1 first:pl-0 last:pr-0 space-y-2">
            <Skeleton className="h-3 w-20" /><Skeleton className="h-6 w-12" />
          </div>)}
        </div>
      </div>
    </div>
    {/* eslint-disable-next-line design-system/prefer-metric-grid -- matches the hierarchy card grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {Array.from({ length: 6 }, (_, i) => <Card key={i}>
        <CardHeader className="pb-2"><Skeleton className="h-5 w-3/4" /></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 mb-3">
            {Array.from({ length: 4 }, (_, stat) => <div key={stat} className="space-y-2">
              <Skeleton className="h-3 w-16" /><Skeleton className="h-4 w-10" />
            </div>)}
          </div>
          <div className="flex justify-end pt-2 border-t border-gray-100"><Skeleton className="h-3 w-24" /></div>
        </CardContent>
      </Card>)}
    </div>
  </>;
}

export function OptionCardsSkeleton() {
  return <div role="status" aria-label="Loading options" aria-busy="true">
    <span className="sr-only">Loading options</span>
    <div aria-hidden="true">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))] items-start gap-3">
        {Array.from({ length: 5 }, (_, i) => <div key={i} className="bg-white border border-gray-200 rounded-lg p-3 space-y-3">
          <div className="flex gap-3">
            <Skeleton className="w-20 h-24 shrink-0" />
            <div className="flex-1 min-w-0 space-y-2">
              <Skeleton className="h-4 w-full" /><Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-5 w-full" /><Skeleton className="h-3 w-2/3" />
            </div>
          </div>
          {Array.from({ length: 5 }, (_, row) => <div key={row} className="flex justify-between gap-3">
            <Skeleton className="h-3 w-20" /><Skeleton className="h-3 w-10" />
          </div>)}
          <div className="flex gap-1 pt-2 border-t border-gray-100">
            {Array.from({ length: 3 }, (_, ctl) => <Skeleton key={ctl} className="h-5 w-12 rounded-full" />)}
          </div>
        </div>)}
      </div>
    </div>
  </div>;
}

function OptionsSkeleton() {
  return <>
    <SummarySkeleton count={7} compact fullWidth />
    <TabsSkeleton />
    <div className="flex flex-wrap items-center gap-3 bg-white border border-gray-200 rounded-lg px-3 py-2">
      {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-8 w-40" />)}
      <Skeleton className="h-9 w-56 ml-auto" />
    </div>
    <div>
      <div className="flex gap-2 mb-3"><Skeleton className="h-5 w-32" /></div>
      <OptionCardsSkeleton />
    </div>
  </>;
}

export function CategoryPlanSkeleton({ variant }: { variant: CategorySkeletonVariant }) {
  return (
    <div role="status" aria-label={labels[variant]} aria-busy="true">
      <span className="sr-only">{labels[variant]}</span>
      <div aria-hidden="true" className={variant === 'options' || variant === 'months' || variant === 'stores' ? 'space-y-4' : 'space-y-6'}>
        {variant === 'months' && <>
          <div className="bg-white rounded-lg border border-gray-200 p-4 flex flex-wrap gap-2">
            <Skeleton className="h-9 w-32" /><Skeleton className="h-9 w-36" />
          </div>
          <TableSkeleton />
        </>}
        {variant === 'categories' && <><SummarySkeleton fullWidth /><TabsSkeleton /><TableSkeleton /></>}
        {(variant === 'subcategories' || variant === 'bricks') && <HierarchySkeleton />}
        {variant === 'options' && <OptionsSkeleton />}
        {variant === 'exceptions' && <><Skeleton className="h-11 w-full" /><TableSkeleton columns={9} /></>}
        {variant === 'stores' && <><SummarySkeleton count={3} /><Skeleton className="h-8 w-44" /><TableSkeleton columns={12} /></>}
      </div>
    </div>
  );
}
