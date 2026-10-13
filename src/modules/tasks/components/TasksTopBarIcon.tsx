import { useNavigate } from 'react-router-dom';
import { CheckSquare } from 'lucide-react';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useAuthStore } from '@/hooks/useAuthStore';
import { useTasksPendingCount } from '../hooks/useTasksPendingCount';

/**
 * Mobile-only TopBar icon with a pending-count badge.
 * Renders nothing on desktop — the L1 sidebar item already exists there.
 */
export function TasksTopBarIcon(): React.JSX.Element | null {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const userEmail = useAuthStore((s) => s.user?.email ?? '');
  const { data: count = 0 } = useTasksPendingCount(userEmail);
  if (!isMobile) return null;

  return (
    <button
      type="button"
      aria-label={`Tasks (${count} pending)`}
      onClick={() => void navigate('/tasks')}
      className="relative w-11 h-11 inline-flex items-center justify-center text-white hover:bg-white/10 rounded-lg transition-colors"
    >
      <CheckSquare className="w-5 h-5" />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-medium flex items-center justify-center">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </button>
  );
}
