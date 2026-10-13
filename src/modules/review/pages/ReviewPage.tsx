import { BetaBadge, Skeleton, Button } from '@/components/ui';
import { useRegisterRows } from '../hooks/useRegisterRows';
import { RegisterSurface } from '../components/register/RegisterSurface';

export function ReviewPage(): React.ReactNode {
  const { loading, error } = useRegisterRows();

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-3 p-4">
        <h1 className="text-2xl font-bold text-gray-900">
          Action Register <BetaBadge className="ml-2 align-middle" />
        </h1>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p className="font-medium">Failed to load data</p>
          <p className="mt-1 text-xs">{error}</p>
          <Button size="sm" variant="outline" className="mt-2" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="mb-4 shrink-0">
        <h1 className="text-2xl font-bold text-gray-900">
          Action Register <BetaBadge className="ml-2 align-middle" />
        </h1>
      </div>
      <div className="mb-4 lg:overflow-hidden lg:rounded-lg lg:border lg:border-gray-200 lg:bg-white">
        <RegisterSurface />
      </div>
    </div>
  );
}
