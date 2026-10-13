import { CheckCircle } from 'lucide-react';
import { dailyCadence } from '../data/mockCadence';
import { cn } from '@/lib/utils';

export function DailyCadenceStrip() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3">
      <h3 className="text-sm font-semibold text-gray-900 mb-2">Today's Rhythm</h3>
      <div className="-mx-1 px-1">
        <div className="flex flex-wrap items-center gap-1">
          {dailyCadence.map((event, idx) => {
            const isCompleted = event.status === 'completed';
            const isActive = event.status === 'active';

            return (
              <div key={event.id} className="flex items-center">
                {/* Event node */}
                <div
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 border text-xs transition-all duration-200',
                    isCompleted && 'bg-gray-50 border-gray-200 text-gray-400',
                    isActive && 'bg-primary/5 border-primary/40 text-primary ring-1 ring-primary/20',
                    !isCompleted && !isActive && 'bg-white border-gray-200 text-gray-500'
                  )}
                  title={event.summary}
                >
                  {/* Status indicator */}
                  {isCompleted ? (
                    <CheckCircle className="w-3 h-3 text-success shrink-0" />
                  ) : isActive ? (
                    <span className="relative flex h-2 w-2 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                    </span>
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-gray-300 shrink-0" />
                  )}

                  {/* Time */}
                  <span className={cn('font-medium', isActive && 'text-primary font-semibold')}>
                    {event.time}
                  </span>

                  {/* Name */}
                  <span className={cn('hidden sm:inline', isCompleted && 'line-through')}>
                    {event.name}
                  </span>
                </div>

                {/* Connector line between nodes */}
                {idx < dailyCadence.length - 1 && (
                  <div
                    className={cn(
                      'w-4 h-px mx-0.5',
                      isCompleted ? 'bg-success/40' : 'bg-gray-200'
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
