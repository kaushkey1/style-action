import { useNavigate } from 'react-router-dom';
import { Card, CardContent, Button, Badge } from '@/components/ui';
import { cn } from '@/lib/utils';

import type { LucideIcon } from 'lucide-react';

type ModuleStatus = 'live' | 'coming-soon';

interface ModuleCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  status: ModuleStatus;
  route?: string;
}

export function ModuleCard({ title, description, icon: Icon, status, route }: ModuleCardProps): React.ReactNode {
  const navigate = useNavigate();
  const isLive = status === 'live';

  return (
    <Card className={cn('flex flex-col transition-shadow', isLive && 'hover:shadow-md')}>
      <CardContent className="flex flex-col items-center text-center gap-4 p-4">
        <div
          className={cn(
            'flex items-center justify-center w-12 h-12 rounded-lg',
            isLive ? 'bg-primary-50 text-primary-600' : 'bg-gray-100 text-gray-500'
          )}
        >
          <Icon className="w-6 h-6" />
        </div>

        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500 line-clamp-2">{description}</p>
        </div>

        {isLive ? (
          <Button
            size="sm"
            onClick={() => { if (route) navigate(route); }}
          >
            Open Module
          </Button>
        ) : (
          <Badge variant="default" size="md">Coming Soon</Badge>
        )}
      </CardContent>
    </Card>
  );
}
