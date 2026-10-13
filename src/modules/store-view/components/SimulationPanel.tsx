import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ArrowRight, Check, X } from 'lucide-react';
import { SectionHeader } from '@/components/ui';
import type { SimulationResult } from '@/modules/range/data/mockSpacePlanning';

interface SimulationPanelProps {
  result: SimulationResult;
  onDismiss: () => void;
}

export function SimulationPanel({ result, onDismiss }: SimulationPanelProps) {
  const [applied, setApplied] = useState(false);

  return (
    <div className="mt-3 bg-gray-50 border border-gray-200 rounded-lg p-4">
      <SectionHeader
        title={`Simulation: ${result.title}`}
        actions={
          <button
            onClick={onDismiss}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            aria-label="Close simulation"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        }
        className="mb-4"
      />

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Current State</p>
          <div className="space-y-2">
            {result.metrics.map(m => (
              <div key={m.label} className="flex justify-between text-sm">
                <span className="text-gray-600">{m.label}</span>
                <span className="font-medium text-gray-900">{m.current} {m.unit}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Projected State</p>
          <div className="space-y-2">
            {result.metrics.map(m => (
              <div key={m.label} className="flex justify-between text-sm">
                <span className="text-gray-600">{m.label}</span>
                <span className="font-medium text-gray-900">
                  {m.projected} {m.unit}
                  {m.delta !== 0 && (
                    <span className={cn('ml-1 text-xs', m.delta > 0 ? 'text-emerald-600' : 'text-red-600')}>
                      [{m.delta > 0 ? '+' : ''}{m.delta}]
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-3 mb-4">
        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Delta Summary</p>
        <div className="flex gap-4">
          {result.metrics.map(m => (
            <div key={m.label} className="flex items-center gap-1.5 text-xs">
              <span className="text-gray-500">{m.label}:</span>
              <span className={cn(
                'font-medium',
                m.delta > 0 ? 'text-emerald-600' : m.delta < 0 ? 'text-red-600' : 'text-gray-500'
              )}>
                {m.delta > 0 ? '+' : ''}{m.delta} {m.unit}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setApplied(true)}
          disabled={applied}
          className={cn(
            'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
            applied
              ? 'bg-emerald-100 text-emerald-700 cursor-default'
              : 'bg-primary text-white hover:bg-primary/90'
          )}
        >
          {applied ? (
            <span className="flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Applied</span>
          ) : (
            <span className="flex items-center gap-1"><ArrowRight className="w-3.5 h-3.5" /> Apply</span>
          )}
        </button>
        {!applied && (
          <button
            onClick={onDismiss}
            className="px-3 py-1.5 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-200 transition-colors"
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
}
