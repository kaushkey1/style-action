import { useTimePeriodStore, type TimePeriod } from '@/hooks/useTimePeriodStore';
import { cn } from '@/lib/utils';

const periods: { value: TimePeriod; label: string; title: string }[] = [
  { value: 'WTD', label: 'WTD', title: 'Week to Date' },
  { value: 'MTD', label: 'MTD', title: 'Month to Date' },
  { value: 'YTD', label: 'YTD', title: 'Year to Date' },
];

export function TimePeriodFilter() {
  const { timePeriod, setTimePeriod } = useTimePeriodStore();

  return (
    <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 p-0.5">
      {periods.map((p) => (
        <button
          key={p.value}
          onClick={() => setTimePeriod(p.value)}
          title={p.title}
          className={cn(
            'px-2.5 py-1 text-xs font-medium rounded-md transition-all duration-150',
            timePeriod === p.value
              ? 'bg-white text-primary shadow-sm border border-gray-200'
              : 'text-gray-500 hover:text-gray-700'
          )}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
