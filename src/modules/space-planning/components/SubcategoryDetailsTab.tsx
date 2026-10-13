import React from 'react';
import {
  Badge,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui';
import { formatNumber } from '@/lib/utils';
import { Info } from 'lucide-react';
import { useSpacePlanStore } from '../stores/useSpacePlanStore';
import { WhyPopover } from './WhyPopover';

/** Neutral bound info tag (MIN is the only hard bound; MAX is a soft guideline). */
function BoundTag({ badge }: { badge: string }): React.ReactNode {
  if (badge === '@min') return <Badge variant="outline" size="sm">At min</Badge>;
  if (badge === '@max') return <Badge variant="outline" size="sm">At max</Badge>;
  return <span className="text-xs text-gray-400">OK</span>;
}

export function SubcategoryDetailsTab(): React.ReactNode {
  const categories = useSpacePlanStore((s) => s.categories);
  const pods = useSpacePlanStore((s) => s.pods);
  const selectedCategoryCode = useSpacePlanStore((s) => s.selectedCategoryCode);
  const showExceptionsOnly = useSpacePlanStore((s) => s.showExceptionsOnly);
  const setSelectedCategoryCode = useSpacePlanStore((s) => s.setSelectedCategoryCode);

  const filteredCategoryCodes = selectedCategoryCode
    ? [selectedCategoryCode]
    : categories.map((c) => c.code);

  return (
    <div className="space-y-4 animate-fadeInUp">
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        {/* Controls */}
        { }
        <div className="flex items-center gap-3 mb-4">
          <span className="text-sm text-gray-500">Category:</span>
          <Select
            value={selectedCategoryCode ?? '__all__'}
            onValueChange={(v) => setSelectedCategoryCode(v === '__all__' ? null : v)}
          >
            <SelectTrigger className="w-48 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.code} value={c.code}>{c.code} — {c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Active category context */}
        {selectedCategoryCode && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            {/* eslint-disable-next-line design-system/prefer-section-header -- category scope context with action */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {selectedCategoryCode} — {categories.find((c) => c.code === selectedCategoryCode)?.name}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {formatNumber(categories.find((c) => c.code === selectedCategoryCode)?.newSpace ?? 0)} sq ft allocated
                </p>
              </div>
              <button
                onClick={() => setSelectedCategoryCode(null)}
                className="text-xs text-primary hover:underline font-medium"
              >
                Show all categories
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto -mx-4 px-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2.5 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[220px]">Pod</th>
                <th className="text-right py-2.5 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Min</th>
                <th className="text-right py-2.5 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">New</th>
                <th className="text-center py-2.5 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Bound</th>
                <th className="text-right py-2.5 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Options</th>
              </tr>
            </thead>
            <tbody>
              {filteredCategoryCodes.map((catCode) => {
                const cat = categories.find((c) => c.code === catCode);
                if (!cat) return null;

                const catPods = pods.filter((p) => p.categoryCode === catCode);
                let filteredPods = catPods;
                if (showExceptionsOnly) {
                  filteredPods = catPods.filter((p) => p.isManual);
                }

                const subtotalSpace = catPods.reduce((s, p) => s + p.newSpace, 0);
                const subtotalOpts = catPods.reduce((s, p) => s + p.optionsMax, 0);

                return (
                  <React.Fragment key={catCode}>
                    {/* Category header row (when showing all) */}
                    {filteredCategoryCodes.length > 1 && (
                      <tr className="bg-gray-50/70">
                        <td colSpan={5} className="py-2 px-3">
                          <span className="text-xs font-semibold text-gray-700">{catCode}</span>
                          <span className="text-xs text-gray-500 ml-2">{cat.name}</span>
                        </td>
                      </tr>
                    )}

                    {filteredPods.map((pod) => (
                      <tr
                        key={`${pod.categoryCode}-${pod.id}`}
                        className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors"
                      >
                        {/* Pod name */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" size="sm">{pod.id}</Badge>
                            <span className="text-sm text-gray-900 whitespace-normal">{pod.name}</span>
                          </div>
                        </td>

                        {/* Min */}
                        <td className="py-3 px-3 text-right font-mono text-sm text-gray-500">{formatNumber(pod.min)}</td>

                        {/* New (read-only) */}
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <span className="font-mono text-sm font-semibold text-gray-900">
                              {formatNumber(pod.newSpace)}
                            </span>
                            <WhyPopover pod={pod}>
                              <Info className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 cursor-help flex-shrink-0" />
                            </WhyPopover>
                          </div>
                        </td>

                        {/* Bound (neutral info tag) */}
                        <td className="py-3 px-3 text-center">
                          <BoundTag badge={pod.boundBadge} />
                        </td>

                        {/* Options (recommended, single value) */}
                        <td className="py-3 px-3 text-right font-mono text-sm text-gray-700">
                          {formatNumber(pod.optionsMax)}
                        </td>
                      </tr>
                    ))}

                    {/* Subtotal row */}
                    <tr className="border-t-2 border-gray-300 bg-gray-50/50">
                      <td className="py-2.5 px-3 text-sm font-semibold text-gray-700">
                        {catCode} subtotal
                      </td>
                      <td className="py-2.5 px-3" />
                      <td className="py-2.5 px-3 text-right font-mono text-sm font-bold text-gray-900">
                        {formatNumber(subtotalSpace)}
                      </td>
                      <td className="py-2.5 px-3" />
                      <td className="py-2.5 px-3 text-right font-mono text-sm text-gray-700">
                        {formatNumber(subtotalOpts)}
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
