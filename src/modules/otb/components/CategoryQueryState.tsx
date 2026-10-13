import { Button, EmptyState, PageHeader } from '@/components/ui';
import { CategoryPlanSkeleton, type CategorySkeletonVariant } from './CategoryPlanSkeleton';

export function CategoryQueryState({ query, variant, title, backTo }: {
  query: { isPending: boolean; refetch: () => unknown };
  variant: CategorySkeletonVariant;
  title?: string;
  backTo?: string;
}) {
  const content = query.isPending ? <CategoryPlanSkeleton variant={variant} /> : <EmptyState
    title="Buy plan could not be loaded"
    description="Please retry the request."
    action={<Button variant="outline" onClick={() => void query.refetch()}>Retry</Button>}
  />;
  return title ? <div className={variant === 'options' ? 'p-4 pb-28 space-y-4' : 'p-4 space-y-6'}>
    <PageHeader title={title} backTo={backTo} />
    {content}
  </div> : content;
}
