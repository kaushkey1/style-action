import { ChevronRight, ChevronDown, Circle, CheckCircle2, AlertTriangle, XCircle, Lock } from 'lucide-react';
import {cn, getCurrencySymbol} from '@/lib/utils';
import { useExternalBrandsStore } from '../stores/useExternalBrandsStore';
import type { Slot } from '../types/external-brands.types';

export function SlotTree() {
  const {
    slots,
    selectedSlotId,
    expandedBricks,
    selectSlot,
    toggleBrickExpansion,
  } = useExternalBrandsStore();

  // Group slots by category (brick) - no need for drops/fashion grades
  const slotsByCategory = slots.reduce((acc, slot) => {
    if (!acc[slot.brick]) {
      acc[slot.brick] = [];
    }
    const categorySlots = acc[slot.brick];
    if (categorySlots) {
      categorySlots.push(slot);
    }
    return acc;
  }, {} as Record<string, Slot[]>);

  const getSlotIcon = (slot: Slot) => {
    switch (slot.state) {
      case 'covered':
      case 'locked_covered':
        return <CheckCircle2 className="h-3 w-3 text-green-500" />;
      case 'partial':
      case 'locked_partial':
      case 'auto_shortlist_pending':
        return <AlertTriangle className="h-3 w-3 text-amber-500" />;
      case 'accepted_gap':
        return <XCircle className="h-3 w-3 text-gray-400" />;
      case 'empty':
        return <Circle className="h-3 w-3 text-red-500" />;
      default:
        return <Circle className="h-3 w-3 text-gray-400" />;
    }
  };

  const getSlotLabel = (slot: Slot) => {
    const priceLabel = `${getCurrencySymbol()}${slot.priceBand.min ?? 0}-${slot.priceBand.max ?? 0}`;
    const optionsLabel = `${slot.shortlist.filter(s => s.state === 'confirmed').length}/${slot.targetOptions}`;
    return `${priceLabel} | ${optionsLabel}`;
  };

  const getCategoryCounts = (slots: Slot[]) => {
    const covered = slots.filter(s => s.state === 'covered' || s.state === 'locked_covered').length;
    const partial = slots.filter(s => s.state === 'partial' || s.state === 'locked_partial' || s.state === 'auto_shortlist_pending').length;
    const empty = slots.filter(s => s.state === 'empty').length;
    const gaps = slots.filter(s => s.state === 'accepted_gap').length;

    return { covered, partial, empty, gaps, total: slots.length };
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b bg-white">
        <h2 className="text-sm font-semibold text-gray-900">Slot Tree</h2>
        <p className="text-xs text-gray-600 mt-1">
          Navigate and manage slot allocations
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {Object.entries(slotsByCategory).map(([category, categorySlots]) => {
          const isCategoryExpanded = expandedBricks.has(category);
          const categoryCounts = getCategoryCounts(categorySlots);

          return (
            <div key={category} className="mb-1">
              {/* Category Header */}
              { }
              <button
                onClick={() => toggleBrickExpansion(category)}
                // eslint-disable-next-line design-system/prefer-section-header -- collapsible tree node, not a section header
                className="w-full flex items-center justify-between p-2 text-left hover:bg-gray-100 rounded transition-colors"
              >
                <div className="flex items-center gap-2">
                  {isCategoryExpanded ? (
                    <ChevronDown className="h-3 w-3 text-gray-400" />
                  ) : (
                    <ChevronRight className="h-3 w-3 text-gray-400" />
                  )}
                  <span className="text-sm font-medium text-gray-900">{category}</span>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  {categoryCounts.covered > 0 && (
                    <span className="text-green-600">{categoryCounts.covered}</span>
                  )}
                  {categoryCounts.partial > 0 && (
                    <span className="text-amber-600">{categoryCounts.partial}</span>
                  )}
                  {categoryCounts.empty > 0 && (
                    <span className="text-red-600">{categoryCounts.empty}</span>
                  )}
                  <span className="text-gray-400">/ {categoryCounts.total}</span>
                </div>
              </button>

              {/* Slots */}
              {isCategoryExpanded && (
                <div className="ml-4">
                  {categorySlots.map(slot => (
                    <button
                      key={slot.id}
                      onClick={() => selectSlot(slot.id)}
                      className={cn(
                        'w-full flex items-center gap-2 p-2 text-left hover:bg-gray-100 rounded transition-colors text-xs',
                        selectedSlotId === slot.id && 'bg-indigo-50 hover:bg-indigo-100'
                      )}
                    >
                      <div className="flex items-center gap-1.5 flex-1">
                        {getSlotIcon(slot)}
                        <span className={cn(
                          'text-gray-700',
                          selectedSlotId === slot.id && 'text-gray-900 font-medium'
                        )}>
                          {getSlotLabel(slot)}
                        </span>
                        {slot.isLocked && (
                          <Lock className="h-3 w-3 text-gray-400 ml-1" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary Footer */}
      <div className="p-3 border-t bg-white">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600">Total Slots</span>
          <span className="font-medium text-gray-900">{slots.length}</span>
        </div>

        <div className="mt-2 space-y-1">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-green-500" />
              <span className="text-gray-600">Covered</span>
            </div>
            <span className="font-medium text-gray-900">
              {slots.filter(s => s.state === 'covered' || s.state === 'locked_covered').length}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-amber-500" />
              <span className="text-gray-600">Pending</span>
            </div>
            <span className="font-medium text-gray-900">
              {slots.filter(s => s.state === 'partial' || s.state === 'locked_partial' || s.state === 'auto_shortlist_pending').length}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1">
              <Circle className="h-3 w-3 text-red-500" />
              <span className="text-gray-600">Empty</span>
            </div>
            <span className="font-medium text-gray-900">
              {slots.filter(s => s.state === 'empty').length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}