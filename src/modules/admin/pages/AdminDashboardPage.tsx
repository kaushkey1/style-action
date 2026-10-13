import { Link } from 'react-router-dom';
import {
  CheckCircle,
  Clock,
  Circle,
  Database,
  AlertTriangle,
  Bot,
  ArrowRight,
  Settings,
  Users,
  BarChart3,
  Bell,
  Smartphone,
  FileText,
  Building2,
  Shield,
} from 'lucide-react';
import { Badge, Button, Progress, PageHeader, SectionHeader, MetricGrid, EmptyState } from '@/components/ui';
import { cn } from '@/lib/utils';
import { setupSections, systemHealthSummary } from '../data/mockAdminData';

const sectionIcons: Record<string, React.ElementType> = {
  org: Building2,
  roles: Shield,
  groups: Users,
  kpis: BarChart3,
  exceptions: AlertTriangle,
  mobile: Smartphone,
  notifications: Bell,
  audit: FileText,
};

function statusBadge(status: 'complete' | 'in_progress' | 'not_started') {
  switch (status) {
    case 'complete':
      return <Badge variant="success" size="sm">Complete</Badge>;
    case 'in_progress':
      return <Badge variant="warning" size="sm">In Progress</Badge>;
    case 'not_started':
      return <Badge variant="default" size="sm">Not Started</Badge>;
  }
}

function statusIcon(status: 'complete' | 'in_progress' | 'not_started') {
  switch (status) {
    case 'complete':
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    case 'in_progress':
      return <Clock className="w-4 h-4 text-yellow-600" />;
    case 'not_started':
      return <Circle className="w-4 h-4 text-gray-400" />;
  }
}

function progressColor(status: 'complete' | 'in_progress' | 'not_started') {
  switch (status) {
    case 'complete':
      return 'bg-green-500';
    case 'in_progress':
      return 'bg-yellow-500';
    case 'not_started':
      return 'bg-gray-300';
  }
}

function SetupProgressCard({ section }: { section: typeof setupSections[0] }) {
  const Icon = sectionIcons[section.id] || Settings;
  return (
    <Link
      to={section.route}
      className={cn(
        'bg-white rounded-lg border border-gray-200 p-4',
        'hover:border-primary/30 hover:shadow-md transition-all duration-200',
        'block'
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-semibold text-gray-900">{section.name}</span>
        </div>
        {statusIcon(section.status)}
      </div>
      <p className="text-xs text-gray-500 mb-3">{section.description}</p>
      <Progress
        value={section.completedSteps}
        max={section.totalSteps}
        size="sm"
        indicatorClassName={progressColor(section.status)}
      />
      <div className="flex items-center justify-between gap-1 mt-2">
        <span className="text-xs text-gray-500">
          {section.completedSteps}/{section.totalSteps} steps
        </span>
        {statusBadge(section.status)}
      </div>
    </Link>
  );
}

function SystemHealthSection() {
  const { dataPipeline, exceptionEngine, agentWorkforce } = systemHealthSummary;

  const healthCards = [
    {
      title: 'Data Pipeline',
      icon: Database,
      status: dataPipeline.status,
      stats: [
        { label: 'Healthy', value: dataPipeline.healthy, color: 'text-green-600' },
        { label: 'Stale', value: dataPipeline.stale, color: 'text-yellow-600' },
        { label: 'No Source', value: dataPipeline.noSource, color: 'text-red-600' },
      ],
    },
    {
      title: 'Exception Engine',
      icon: AlertTriangle,
      status: exceptionEngine.status,
      stats: [
        { label: 'Active Rules', value: exceptionEngine.activeRules, color: 'text-gray-900' },
        { label: 'Fired Today', value: exceptionEngine.firedToday, color: 'text-gray-900' },
        { label: 'Avg Latency', value: exceptionEngine.avgLatency, color: 'text-gray-900' },
      ],
    },
    {
      title: 'Agent Workforce',
      icon: Bot,
      status: agentWorkforce.status,
      stats: [
        { label: 'Active Agents', value: agentWorkforce.activeAgents, color: 'text-gray-900' },
        { label: 'Tasks Today', value: agentWorkforce.tasksToday, color: 'text-gray-900' },
        { label: 'Resolved', value: agentWorkforce.resolvedToday, color: 'text-green-600' },
      ],
    },
  ];

  return (
    <div>
      <SectionHeader title="System Health" />
      <MetricGrid columns={3} className="mb-0">
        {healthCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="bg-white rounded-lg border border-gray-200 p-4"
            >
              <div className="flex items-center justify-between gap-1 mb-3">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-semibold text-gray-900">{card.title}</span>
                </div>
                <Badge
                  variant={card.status === 'operational' ? 'success' : 'error'}
                  size="sm"
                  dot
                >
                  {card.status === 'operational' ? 'Operational' : 'Degraded'}
                </Badge>
              </div>
              <MetricGrid columns={3} className="gap-2 mb-0">
                {card.stats.map((stat) => (
                  <div key={stat.label} className="text-center p-2 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500">{stat.label}</p>
                    <p className={cn('text-xl font-bold', stat.color)}>{stat.value}</p>
                  </div>
                ))}
              </MetricGrid>
            </div>
          );
        })}
      </MetricGrid>
    </div>
  );
}

function QuickActionsSection() {
  const quickActions = [
    { label: 'Add KPI', route: '/admin/kpis', icon: BarChart3 },
    { label: 'Manage Roles', route: '/admin/roles', icon: Shield },
    { label: 'Exception Rules', route: '/admin/exceptions', icon: AlertTriangle },
    { label: 'Notification Settings', route: '/admin/notifications', icon: Bell },
    { label: 'Audit Log', route: '/admin/audit-log', icon: FileText },
    { label: 'Organization Tree', route: '/admin/organization', icon: Building2 },
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <SectionHeader title="Quick Actions" />
      <MetricGrid columns={3} className="gap-2 mb-0">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.label} to={action.route}>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-between text-xs"
                asChild
              >
                <span>
                  <span className="flex items-center gap-2">
                    <Icon className="w-3 h-3" />
                    {action.label}
                  </span>
                  <ArrowRight className="w-3 h-3" />
                </span>
              </Button>
            </Link>
          );
        })}
      </MetricGrid>
    </div>
  );
}

export function AdminDashboardPage() {
  const totalSteps = setupSections.reduce((sum, s) => sum + s.totalSteps, 0);
  const completedSteps = setupSections.reduce((sum, s) => sum + s.completedSteps, 0);
  const overallPct = Math.round((completedSteps / totalSteps) * 100);
  const completeSections = setupSections.filter((s) => s.status === 'complete').length;

  return (
    <div className="relative">
      {/* Coming Soon Overlay */}
      <div className="absolute inset-0 z-10 flex items-start justify-center pt-48 bg-white/60 rounded-lg">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <Users className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-sm font-semibold text-gray-500">Coming Soon</p>
          <p className="text-xs text-gray-400 mt-1">User Management is under development</p>
        </div>
      </div>

      {/* Greyed-out content */}
      <div className="space-y-6 pointer-events-none select-none opacity-40 grayscale">
        {/* Page Header */}
        <PageHeader
          title="Setup Progress"
          actions={
            <>
              <span className="text-sm text-gray-500">
                {completeSections}/{setupSections.length} sections complete
              </span>
              <Badge variant={overallPct === 100 ? 'success' : 'primary'} size="lg">
                {overallPct}% overall
              </Badge>
            </>
          }
        />

        {/* Overall Progress Bar */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between gap-1 mb-2">
            <span className="text-sm text-gray-700">Overall Configuration Progress</span>
            <span className="text-sm font-semibold text-gray-900">
              {completedSteps}/{totalSteps} steps
            </span>
          </div>
          <Progress
            value={completedSteps}
            max={totalSteps}
            size="md"
            indicatorClassName={overallPct === 100 ? 'bg-green-500' : 'bg-primary'}
          />
        </div>

        {/* Setup Section Cards */}
        <MetricGrid>
          {setupSections.length === 0 ? (
            <EmptyState description="No setup sections configured" />
          ) : setupSections.map((section) => (
            <SetupProgressCard key={section.id} section={section} />
          ))}
        </MetricGrid>

        {/* System Health */}
        <SystemHealthSection />

        {/* Quick Actions */}
        <QuickActionsSection />
      </div>
    </div>
  );
}
