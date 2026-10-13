import { cn } from '@/lib/utils';
import type { TaskPriority } from '../types/task.types';

interface PriorityPickerProps {
  value: TaskPriority;
  onChange: (value: TaskPriority) => void;
  disabled?: boolean;
}

// Critical → Low. The dot carries the priority's semantic hue; the selected chip
// uses the primary accent (project rule: primary = selected) with a white dot.
const PRIORITIES: TaskPriority[] = ['Critical', 'High', 'Medium', 'Low'];
const DOT: Record<TaskPriority, string> = {
  Critical: 'bg-red-500',
  High: 'bg-amber-500',
  Medium: 'bg-blue-500',
  Low: 'bg-gray-400',
};

/** Rounded-chip priority selector — a dot + label per option (create/edit form). */
export function PriorityPicker({ value, onChange, disabled }: PriorityPickerProps): React.JSX.Element {
  return (
    <div role="radiogroup" aria-label="Priority" className="flex flex-wrap gap-1.5">
      {PRIORITIES.map((p) => {
        const isActive = p === value;
        return (
          <button
            key={p}
            type="button"
            role="radio"
            aria-checked={isActive}
            disabled={disabled}
            onClick={() => onChange(p)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
              isActive ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
              disabled && 'opacity-50 cursor-not-allowed',
            )}
          >
            <span className={cn('h-1.5 w-1.5 rounded-full', isActive ? 'bg-white' : DOT[p])} aria-hidden />
            {p}
          </button>
        );
      })}
    </div>
  );
}
