import { AlertTriangle } from 'lucide-react';
import { Card, Skeleton } from '@/components/ui';

interface CategoryActionCardsProps {
  summary: string | undefined;
  isLoading: boolean;
}

export function CategoryActionCards({
  summary,
  isLoading,
}: CategoryActionCardsProps): React.ReactNode {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <h3 className="text-sm font-medium text-gray-900">What needs attention</h3>
        </div>
      </div>
      {isLoading ? (
        <div className="space-y-2 mt-1">
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-5/6" />
          <Skeleton className="h-3.5 w-4/6" />
        </div>
      ) : summary ? (
        <p className="text-sm text-gray-700 leading-relaxed">{summary}</p>
      ) : (
        <p className="text-sm text-gray-400">No data available</p>
      )}
    </Card>
  );
}
