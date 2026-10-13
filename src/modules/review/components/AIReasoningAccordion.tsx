import { useState } from 'react';
import { ChevronRight, Sparkles } from 'lucide-react';
// Sparkles used in the gradient badge
import { Badge } from '@/components/ui';
import { cn, formatCurrency } from '@/lib/utils';
import type { UnifiedItem } from '../data/mockReviewData';

interface AIReasoningAccordionProps {
  item: UnifiedItem;
}

export function AIReasoningAccordion({ item }: AIReasoningAccordionProps): React.ReactNode {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 w-full px-3 py-2.5 text-left hover:bg-gray-50 transition-colors"
        aria-expanded={isExpanded}
        aria-label="Toggle AI reasoning details"
      >
        <ChevronRight className={cn('w-3.5 h-3.5 text-gray-400 shrink-0 transition-transform duration-200', isExpanded && 'rotate-90')} />
        <span className="text-sm text-gray-600">Reasoning</span>
        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-gradient-to-r from-primary/10 to-purple-400/10">
          <Sparkles className="w-2.5 h-2.5 text-primary-500" />
          <span className="text-[9px] font-semibold text-primary-600 tracking-wide">AI</span>
        </div>
        <span className="text-xs text-gray-400">·</span>
        <span className="text-xs text-gray-500">{item.agentName}</span>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-3 pb-3 border-t border-gray-100 space-y-3">
          <div className="pt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
            <span><span className="font-medium text-gray-600">Rule:</span> <code className="font-mono text-gray-500">{item.ruleOrSignal}</code></span>
            <span><span className="font-medium text-gray-600">Confidence:</span> <Badge variant="outline" className="text-xs">{item.confidenceBucket}</Badge></span>
          </div>

          {/* Chain-of-thought summary (using the item summary) */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">Reasoning</p>
            <p className="text-sm text-gray-700">{item.summary}</p>
          </div>

          {/* Alternate scenarios — visually distinct sub-card */}
          {item.alternateScenarios && item.alternateScenarios.length > 0 && (
            <div className="rounded-lg border border-gray-200 p-3 mt-1">
              <p className="text-xs font-medium text-gray-500 mb-2">Alternate Scenarios</p>
              <div>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-1.5 pr-3 font-medium text-gray-500">Scenario</th>
                      <th className="text-right py-1.5 pr-3 font-medium text-gray-500">Impact</th>
                      <th className="text-right py-1.5 font-medium text-gray-500">Risk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {item.alternateScenarios.map((scenario) => (
                      <tr
                        key={scenario.label}
                        className={cn(
                          'border-b border-gray-50 last:border-b-0',
                          scenario.riskLevel === 'medium' && 'font-medium',
                        )}
                      >
                        <td className="py-2 pr-3 text-gray-700">
                          {scenario.label}
                        </td>
                        <td className="py-2 pr-3 text-right text-gray-700 tabular-nums">
                          {formatCurrency(scenario.impactInr)}
                        </td>
                        <td className="py-2 text-right">
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-xs',
                              scenario.riskLevel === 'low' && 'bg-green-50 text-green-700 border-green-200',
                              scenario.riskLevel === 'medium' && 'bg-amber-50 text-amber-700 border-amber-200',
                              scenario.riskLevel === 'high' && 'bg-red-50 text-red-700 border-red-200',
                            )}
                          >
                            {scenario.riskLevel}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Source query result table (from API) */}
          {item.sourceQueryResult && item.sourceQueryResult.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Source Evidence</p>
              <div className="overflow-x-auto -mx-3 px-3">
                <table className="min-w-[400px] w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {Object.keys(item.sourceQueryResult[0] ?? {}).map((col) => (
                        <th key={col} className="text-left py-1.5 pr-3 font-medium text-gray-500">
                          {col.replace(/_/g, ' ')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {item.sourceQueryResult.map((row, ri) => (
                      <tr key={ri} className="border-b border-gray-50">
                        {Object.values(row).map((val, ci) => (
                          <td key={ci} className="py-1.5 pr-3 text-gray-700">
                            {val != null ? String(val) : '—'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
