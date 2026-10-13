import { Navigate } from 'react-router-dom';
import { useModuleEnabled } from '@/hooks/useScreenConfig';

interface ModuleGuardProps {
  module: string;
  children: React.ReactNode;
}

export function ModuleGuard({ module, children }: ModuleGuardProps): React.ReactNode {
  const enabled = useModuleEnabled(module);
  if (!enabled) return <Navigate to="/" replace />;
  return <>{children}</>;
}
