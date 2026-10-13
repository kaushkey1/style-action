import { Store, Users, TrendingDown } from 'lucide-react';
import { PageHeader } from '@/components/ui';
import { ModuleCard } from '../components/ModuleCard';

const MODULES = [
  {
    id: 'customer-experience',
    title: 'CX',
    description: 'CX intelligence — silent NPS, journey analytics, CCTV insights, and action tracker.',
    icon: Users,
    status: 'live' as const,
    route: '/jarvis/customer-experience',
  },
  {
    id: 'store-readiness',
    title: 'Store Readiness',
    description: 'Monitor store operations, compliance, and readiness metrics across locations.',
    icon: Store,
    status: 'coming-soon' as const,
  },
  {
    id: 'churn-prediction',
    title: 'Churn Analysis',
    description: 'Predict customer churn risk and identify retention opportunities.',
    icon: TrendingDown,
    status: 'coming-soon' as const,
  },
] as const;

export function ModuleHub(): React.ReactNode {
  return (
    <div className="space-y-4 animate-fadeInUp">
      <PageHeader
        title="Jarvis"
        badges={<span className="text-sm font-normal text-gray-500">AI-powered retail intelligence modules</span>}
      />

      {/* eslint-disable-next-line design-system/prefer-metric-grid -- module cards are not KPI metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {MODULES.map((mod) => (
          <ModuleCard
            key={mod.id}
            title={mod.title}
            description={mod.description}
            icon={mod.icon}
            status={mod.status}
            route={'route' in mod ? mod.route : undefined}
          />
        ))}
      </div>
    </div>
  );
}
