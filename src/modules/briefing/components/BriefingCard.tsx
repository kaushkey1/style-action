import { useNavigate } from 'react-router-dom';
import { Badge, DrillMenu } from '@/components/ui';
import { ActionGroup } from '@/modules/review/components/register/ActionGroup';
import { SEVERITY_BADGE } from '@/modules/review/lib/severityBadge';
import { inr } from '@/modules/review/components/register/registerTokens';
import { getRowDrillTargets } from '@/lib/routing';
import type { RegisterException } from '@/modules/review/hooks/useRegisterRows';
import type { EndState } from '@/modules/review/components/register/registerTokens';

interface BriefingCardProps {
  exception: RegisterException;
  endState: EndState;
  onEndStateChange: (state: EndState) => void;
}

export function BriefingCard({ exception, endState, onEndStateChange }: BriefingCardProps): React.ReactNode {
  const navigate = useNavigate();

  const handleCardClick = (): void => {
    navigate(`/review?sel=${exception.id}`);
  };

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-white transition-shadow hover:shadow-md">
      <button
        type="button"
        onClick={handleCardClick}
        className="flex h-full w-full flex-col p-3 text-left focus-visible:outline-none focus-kb:ring-2 focus-kb:ring-inset focus-kb:ring-primary"
      >
        <div className="mb-1.5 flex items-center gap-2">
          <Badge variant={SEVERITY_BADGE[exception.severity].variant} dot size="sm">
            {SEVERITY_BADGE[exception.severity].label}
          </Badge>
        </div>
        <h3 className="mb-1.5 pr-7 text-sm font-semibold leading-snug text-gray-900">{exception.title}</h3>
        <div className="mt-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs">
            {exception.valueInr ? (
              <>
                <span className="tabular-nums font-semibold text-gray-900">{inr(exception.valueInr)}</span>
                <span className="text-gray-400">·</span>
              </>
            ) : null}
            <span className="text-xs text-gray-500">SLA: {exception.sla ? `${exception.sla.replace('d', '')} ${exception.sla === '1d' ? 'day' : 'days'}` : 'NA'}</span>
          </div>
          {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions -- propagation stop only; ActionGroup is the interactive element */}
          <div
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <ActionGroup
              exception={exception}
              endState={endState}
              onEndStateChange={onEndStateChange}
            />
          </div>
        </div>
      </button>
      {/* Drill-down kebab — top-right */}
      <div className="absolute right-1.5 top-1.5">
        <DrillMenu
          rowLabel={exception.title}
          targets={getRowDrillTargets({ category: exception.category, from: 'dashboard' })}
        />
      </div>
    </div>
  );
}
