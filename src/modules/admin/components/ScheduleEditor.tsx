import { Clock } from 'lucide-react';
import { Input } from '@/components/ui';
import { cn } from '@/lib/utils';

interface ScheduleEditorProps {
  cron: string;
  onUpdate: (cron: string) => void;
  className?: string;
}

// Simple cron to human-readable conversion
function cronToReadable(cron: string): string {
  if (cron === '0 6 * * *') return 'Daily at 6:00 AM';
  if (cron === '0 0 * * *') return 'Daily at midnight';
  if (cron === '0 12 * * *') return 'Daily at noon';
  if (cron === '0 */6 * * *') return 'Every 6 hours';
  if (cron === '0 0 * * 0') return 'Weekly on Sunday';
  return cron; // fallback to raw cron
}

export function ScheduleEditor({ cron, onUpdate, className }: ScheduleEditorProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <label htmlFor="schedule-cron" className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
        <Clock className="w-3.5 h-3.5" />
        Schedule
      </label>
      <div className="relative">
        <Input
          id="schedule-cron"
          type="text"
          value={cron}
          onChange={(e) => onUpdate(e.target.value)}
          placeholder="0 6 * * *"
          className="text-sm font-mono pr-24"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">
          {cronToReadable(cron)}
        </div>
      </div>
      <p className="text-xs text-gray-500">
        Cron expression for pipeline schedule
      </p>
    </div>
  );
}
