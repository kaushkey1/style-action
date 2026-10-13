import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Avatar } from '@/components/ui';
import { formatDate, formatRelativeTime } from '@/lib/utils';
import type { Task } from '../types/task.types';
import { TaskStatusPill } from './TaskStatusPill';
import { PriorityChip } from './PriorityChip';

interface DetailsTableProps {
  task: Task;
}

interface Row {
  label: string;
  value: React.ReactNode;
  copy?: string;
}

/** Hover-revealed copy-to-clipboard button shown at the right of a detail row. */
function CopyButton({ value }: { value: string }): React.JSX.Element {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      aria-label={`Copy ${value}`}
      onClick={() => {
        void navigator.clipboard?.writeText(value);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
      }}
      className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded text-gray-400 opacity-0 transition-opacity hover:bg-gray-100 hover:text-gray-600 focus-visible:opacity-100 group-hover:opacity-100"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

/**
 * Right-rail key/value table for the task detail page.
 * Shows status / priority / people / dates / linkage in a fixed order.
 */
export function DetailsTable({ task }: DetailsTableProps): React.JSX.Element {
  const rows: Row[] = [
    { label: 'Status',    value: <TaskStatusPill status={task.status} /> },
    { label: 'Priority',  value: <PriorityChip priority={task.priority} /> },
    {
      label: 'Assigned to',
      copy: task.assigned_to,
      value: (
        <span className="flex min-w-0 items-center gap-2">
          <Avatar name={task.assigned_to} size="xs" />
          <span className="break-words text-gray-900">{task.assigned_to}</span>
        </span>
      ),
    },
    {
      label: 'Assignor',
      copy: task.assignor,
      value: (
        <span className="flex min-w-0 items-center gap-2">
          <Avatar name={task.assignor} size="xs" />
          <span className="break-words text-gray-900">{task.assignor}</span>
        </span>
      ),
    },
    { label: 'Due',       value: task.due_date
      ? <span className="text-gray-900 tabular-nums">{formatDate(task.due_date)}</span>
      : <span className="text-gray-400">—</span> },
    { label: 'Created',   value: <span className="text-gray-700 tabular-nums">{formatRelativeTime(task.created_at)}</span> },
    { label: 'Updated',   value: <span className="text-gray-700 tabular-nums">{formatRelativeTime(task.updated_at)}</span> },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">Details</p>
      <dl className="-mx-4 divide-y divide-gray-100 border-t border-gray-100">
        {rows.map((row) => (
          <div key={row.label} className="group grid grid-cols-[110px_1fr] items-center gap-2 px-4 py-2.5">
            <dt className="text-xs text-gray-500">{row.label}</dt>
            <dd className="flex min-w-0 items-center gap-2 text-sm">
              <span className="min-w-0 flex-1">{row.value}</span>
              {row.copy && <CopyButton value={row.copy} />}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
