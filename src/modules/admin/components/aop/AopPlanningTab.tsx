import type { ReactNode } from 'react';
import { ConfigCard, ReadOnlyRow, ValuePill } from '../shared/config/ConfigPrimitives';
import { monthLabel } from '../../api/aopAdminCalendar';
import type { Season } from '../../types/aopAdmin';

export function AopPlanningTab({ seasons }: { seasons: Season[] }): ReactNode {
  return <div className="space-y-4">
    <ConfigCard title="Season Calendar" description="Seasons repeat every year. The season calendar is read-only.">
      {seasons.map((season) => <ReadOnlyRow key={season.season_code} label={season.season_code} description={season.season_name}>
        <ValuePill>{monthLabel(season.months[0] ?? 0)}–{monthLabel(season.months.at(-1) ?? 0)}</ValuePill>
      </ReadOnlyRow>)}
    </ConfigCard>
    <ConfigCard title="Planning rules">
      <div className="space-y-3 text-sm text-gray-600">
        <p><strong className="font-medium text-gray-900">Existing stores:</strong> use their own prior-year monthly sales curve when available.</p>
        <p><strong className="font-medium text-gray-900">Partial-history stores:</strong> retain available history and fill missing months from the plan's monthly curve, then normalise the weights.</p>
        <p><strong className="font-medium text-gray-900">New stores:</strong> use the plan's monthly curve. User-added stores allocate their annual target across months from opening through March.</p>
        <p><strong className="font-medium text-gray-900">Operating dates:</strong> opening, closure and reopening dates determine operating days. Closed periods receive zero; remaining values are scaled to reconcile to the channel target.</p>
        <p>Channel targets, each plan's monthly weights and store operating dates remain in that AOP's planning screens.</p>
      </div>
    </ConfigCard>
    <ConfigCard title="Fiscal calendar">
      <ReadOnlyRow label="Financial year" description="The AOP fiscal calendar is fixed."><ValuePill>April–March</ValuePill></ReadOnlyRow>
    </ConfigCard>
  </div>;
}
