import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/hooks/useAuthStore';

export function RedirectIfAuth({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (isAuthenticated) return <Navigate to="/home" replace />;
  return <>{children}</>;
}
