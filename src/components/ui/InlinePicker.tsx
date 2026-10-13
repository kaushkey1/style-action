import React, { useState, useCallback } from 'react';
import { ChevronDown, ChevronUp, Check, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';
import { Input } from './Input';

interface PickerItem {
  id: string;
  [key: string]: unknown;
}

interface InlinePickerProps<T extends PickerItem> {
  items: T[];
  selectedIds: Set<string>;
  onSelectionChange: (selectedIds: Set<string>) => void;
  onConfirm?: (selectedItems: T[]) => void;
  renderItem: (item: T, isSelected: boolean) => React.ReactNode;
  placeholder?: string;
  selectedLabel?: (count: number) => string;
  multiple?: boolean;
  maxHeight?: number;
  searchable?: boolean;
  searchFilter?: (item: T, query: string) => boolean;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
  disabled?: boolean;
  filterTabs?: Array<{ id: string; label: string; filter: (item: T) => boolean }>;
}

/**
 * Inline picker for selecting items from a list
 */
export function InlinePicker<T extends PickerItem>({
  items,
  selectedIds,
  onSelectionChange,
  onConfirm,
  renderItem,
  placeholder = 'Select items...',
  selectedLabel = (count) => `${count} selected`,
  multiple = true,
  maxHeight = 300,
  searchable = false,
  searchFilter,
  searchPlaceholder = 'Search...',
  emptyMessage = 'No items found',
  className,
  disabled = false,
  filterTabs,
}: InlinePickerProps<T>): React.JSX.Element {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const filteredItems = items.filter((item) => {
    if (searchQuery && searchFilter) {
      if (!searchFilter(item, searchQuery)) return false;
    }
    if (activeFilter && filterTabs) {
      const tab = filterTabs.find((t) => t.id === activeFilter);
      if (tab && !tab.filter(item)) return false;
    }
    return true;
  });

  const handleToggle = useCallback(() => {
    if (!disabled) {
      setIsExpanded((prev) => !prev);
      if (!isExpanded) {
        setSearchQuery('');
      }
    }
  }, [disabled, isExpanded]);

  const handleItemClick = useCallback(
    (item: T) => {
      const newSelected = new Set(selectedIds);

      if (newSelected.has(item.id)) {
        newSelected.delete(item.id);
      } else {
        if (!multiple) {
          newSelected.clear();
        }
        newSelected.add(item.id);
      }

      onSelectionChange(newSelected);

      if (!multiple) {
        setIsExpanded(false);
      }
    },
    [selectedIds, multiple, onSelectionChange]
  );

  const handleConfirm = useCallback(() => {
    if (onConfirm) {
      const selectedItems = items.filter((item) => selectedIds.has(item.id));
      onConfirm(selectedItems);
    }
    setIsExpanded(false);
  }, [items, selectedIds, onConfirm]);

  const handleClear = useCallback(() => {
    onSelectionChange(new Set());
  }, [onSelectionChange]);

  const triggerLabel =
    selectedIds.size > 0 ? selectedLabel(selectedIds.size) : placeholder;

  return (
    <div className={cn('relative', className)}>
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={cn(
          'w-full flex items-center justify-between gap-2 px-3 py-2',
          'border border-gray-300 rounded-lg bg-white',
          'text-sm text-left',
          'hover:border-gray-400 focus:outline-none focus-kb:ring-2 focus-kb:ring-primary/20 focus-kb:border-primary',
          'transition-colors duration-150',
          disabled && 'opacity-50 cursor-not-allowed',
          isExpanded && 'border-primary ring-2 ring-primary/20 rounded-b-none'
        )}
        aria-expanded={isExpanded}
        aria-haspopup="listbox"
      >
        <span className={cn(selectedIds.size === 0 && 'text-gray-400')}>
          {triggerLabel}
        </span>
        <div className="flex items-center gap-1">
          {selectedIds.size > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className="p-0.5 hover:bg-gray-100 rounded"
              aria-label="Clear selection"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </button>

      <div
        className={cn(
          'absolute left-0 right-0 z-20',
          'bg-white border border-t-0 border-gray-300 rounded-b-lg shadow-lg',
          'transition-all duration-200 ease-in-out origin-top',
          isExpanded
            ? 'opacity-100 scale-y-100'
            : 'opacity-0 scale-y-0 pointer-events-none'
        )}
      >
        {searchable && (
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="pl-8 h-8 text-sm"
              />
            </div>
          </div>
        )}

        {filterTabs && filterTabs.length > 0 && (
          <div className="flex gap-1 p-2 border-b border-gray-100 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveFilter(null)}
              className={cn(
                'px-2 py-1 text-xs rounded-full whitespace-nowrap',
                activeFilter === null
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              All
            </button>
            {filterTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id)}
                className={cn(
                  'px-2 py-1 text-xs rounded-full whitespace-nowrap',
                  activeFilter === tab.id
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        <div
          className="overflow-y-auto"
          style={{ maxHeight }}
          role="listbox"
          aria-multiselectable={multiple}
        >
          {filteredItems.length === 0 ? (
            <div className="p-4 text-sm text-gray-400 text-center">
              {emptyMessage}
            </div>
          ) : (
            <div className="p-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
              {filteredItems.map((item) => {
                const isSelected = selectedIds.has(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleItemClick(item)}
                    className={cn(
                      'relative rounded-lg overflow-hidden',
                      'ring-2 transition-all duration-150',
                      isSelected
                        ? 'ring-primary'
                        : 'ring-transparent hover:ring-gray-300'
                    )}
                    role="option"
                    aria-selected={isSelected}
                  >
                    {renderItem(item, isSelected)}
                    {isSelected && (
                      <div className="absolute top-1 right-1 p-0.5 bg-primary rounded-full">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {multiple && onConfirm && (
          <div className="flex items-center justify-between p-2 border-t border-gray-100 bg-gray-50">
            <span className="text-xs text-gray-500">
              {selectedIds.size} selected
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsExpanded(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirm}
                disabled={selectedIds.size === 0}
              >
                Confirm
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default InlinePicker;
