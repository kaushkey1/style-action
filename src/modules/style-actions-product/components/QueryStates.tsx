import { Button, EmptyState, Skeleton } from '@/components/ui';

import { errorSentence } from './display';
import { Term } from './Term';

/** Loading placeholder shared by the data screens. */
export function LoadingBlock({ label }: { readonly label: string }): React.ReactNode {
  return (
    <div className="space-y-3" aria-busy="true" aria-label={label}>
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}

/** Error as a plain sentence with its code in a tooltip, and a retry (S2-C67 L3). */
export function ErrorBlock({ error, onRetry }: { readonly error: unknown; readonly onRetry?: () => void }): React.ReactNode {
  const { sentence, code } = errorSentence(error);
  const action =
    onRetry || code ? (
      <div className="flex items-center justify-center gap-3">
        {code ? (
          <Term help={`Error code: ${code}`}>
            <span className="text-xs text-gray-500">Details</span>
          </Term>
        ) : null}
        {onRetry ? (
          <Button variant="outline" size="sm" onClick={onRetry} className="min-h-11 md:min-h-0">
            Retry
          </Button>
        ) : null}
      </div>
    ) : undefined;
  return (
    <div role="alert" data-testid="error-state">
      <EmptyState title="Could not load this view" description={sentence} action={action} />
    </div>
  );
}
