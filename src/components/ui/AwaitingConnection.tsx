import { WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AwaitingConnectionProps {
  /** Module or feature name shown in the message */
  feature?: string;
  /** Optional retry callback */
  onRetry?: () => void;
  className?: string;
}

export function AwaitingConnection({
  feature,
  onRetry,
  className,
}: AwaitingConnectionProps): React.ReactNode {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}>
      <WifiOff className="w-10 h-10 text-gray-400 mb-4" />
      <h3 className="text-base font-semibold text-gray-700 mb-1">
        Awaiting API Connection
      </h3>
      <p className="text-sm text-gray-500 max-w-sm">
        {feature
          ? `The ${feature} module is ready for backend integration. Connect the API endpoint to see live data.`
          : 'This module is ready for backend integration. Connect the API endpoint to see live data.'}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 text-sm font-medium text-primary hover:text-primary/80 transition-colors min-h-[44px] px-4"
          type="button"
        >
          Retry Connection
        </button>
      )}
    </div>
  );
}
