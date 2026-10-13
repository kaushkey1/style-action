import { NavLink, useParams } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface NavTab {
  label: string;
  segment: string;
}

const TABS: NavTab[] = [
  { label: 'Planning Inputs', segment: 'targets' },
  { label: 'Manage Stores', segment: 'manage-stores' },
  { label: 'Workspace', segment: 'workspace' },
  { label: 'Scenarios', segment: 'scenarios' },
  { label: 'Review', segment: 'review' },
  { label: 'Promote', segment: 'promote' },
  { label: 'Monitor', segment: 'monitor' },
];

export function AopSubNav(): React.ReactNode {
  const { cycleId } = useParams<{ cycleId: string }>();
  return (
    <nav className="border-b border-gray-200 -mx-4 px-4 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8" aria-label="Sales Plan sections">
      <div className="flex items-center gap-0 overflow-x-auto scrollbar-hide">
        {TABS.map((tab) => (
          <NavLink
            key={tab.segment}
            to={`/sales-plan/${tab.segment}/${cycleId ?? ''}`}
            className={({ isActive }) =>
              cn(
                'px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
                isActive
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
              )
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
