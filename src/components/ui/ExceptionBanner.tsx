import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ChevronRight } from 'lucide-react';

interface ExceptionBannerProps {
  count: number;
  domain: string;
  route: string;
}

export function ExceptionBanner({ count, domain, route }: ExceptionBannerProps): React.ReactNode {
  const navigate = useNavigate();

  if (count === 0) return null;

  return (
    <button
      type="button"
      onClick={() => navigate(route)}
      className="flex items-center justify-between w-full rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 hover:bg-red-100 transition-colors"
      aria-label={`${count} active exceptions in ${domain} domain. Click to view.`}
    >
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 shrink-0" />
        <span>
          <span className="font-semibold">{count}</span> active exception{count !== 1 ? 's' : ''} in {domain} domain
        </span>
      </div>
      <ChevronRight className="w-4 h-4 shrink-0" />
    </button>
  );
}
