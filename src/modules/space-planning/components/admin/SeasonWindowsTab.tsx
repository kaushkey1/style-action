import { useId } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeader,
  DataTableRow,
  Input,
} from '@/components/ui';
import { useAdminConfigStore } from '../../stores/useAdminConfigStore';
import { AdminSectionCard, TabErrorSummary } from './adminConfigShared';
import { findFieldError } from './adminConfigHelpers';
import type { AdminSeasonWindow, AdminSeasonWindows } from '../../api/adminConfigApi';

const TAB = 'season_windows';

interface WindowTableProps {
  rows: AdminSeasonWindow[];
  purpose: 'spsf' | 'sheet1' | 'season';
  onChange: (
    purpose: 'spsf' | 'sheet1' | 'season',
    index: number,
    patch: Partial<AdminSeasonWindow>,
  ) => void;
  /** season rows carry dates only — no space season/file columns */
  hideSpaceCols?: boolean;
}

function WindowTable({ rows, purpose, onChange, hideSpaceCols }: WindowTableProps): React.ReactNode {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        No windows configured yet — documented defaults apply until engine migration 006 lands.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto -mx-1 px-1">
      <DataTable className="min-w-[560px]">
        <DataTableHeader>
            <DataTableHead>Window</DataTableHead>
            <DataTableHead>Sales start</DataTableHead>
            <DataTableHead>Sales end</DataTableHead>
            {!hideSpaceCols && <DataTableHead>Space season</DataTableHead>}
            {!hideSpaceCols && <DataTableHead>Space file</DataTableHead>}
          </DataTableHeader>
        <DataTableBody>
          {rows.map((w, i) => (
            <DataTableRow key={w.window}>
              <DataTableCell className="font-medium text-gray-900">{w.window}</DataTableCell>
              <DataTableCell>
                <Input
                  type="date"
                  aria-label={`${w.window} sales start`}
                  value={w.sales_start ?? ''}
                  onChange={(e) => onChange(purpose, i, { sales_start: e.target.value || null })}
                  className="h-8 w-36 text-sm"
                />
              </DataTableCell>
              <DataTableCell>
                <Input
                  type="date"
                  aria-label={`${w.window} sales end`}
                  value={w.sales_end ?? ''}
                  onChange={(e) => onChange(purpose, i, { sales_end: e.target.value || null })}
                  className="h-8 w-36 text-sm"
                />
              </DataTableCell>
              {!hideSpaceCols && (
                <DataTableCell>
                  <Input
                    aria-label={`${w.window} space season`}
                    value={w.space_season ?? ''}
                    onChange={(e) => onChange(purpose, i, { space_season: e.target.value || null })}
                    className="h-8 w-24 text-sm"
                  />
                </DataTableCell>
              )}
              {!hideSpaceCols && (
                <DataTableCell>
                  <Input
                    aria-label={`${w.window} space file`}
                    value={w.space_file ?? ''}
                    onChange={(e) => onChange(purpose, i, { space_file: e.target.value || null })}
                    className="h-8 w-36 text-sm"
                  />
                </DataTableCell>
              )}
            </DataTableRow>
          ))}
        </DataTableBody>
      </DataTable>
    </div>
  );
}

export function SeasonWindowsTab(): React.ReactNode {
  const seasons = useAdminConfigStore((s) => s.draft?.season_windows);
  const fieldErrors = useAdminConfigStore((s) => s.fieldErrors);
  const updateSection = useAdminConfigStore((s) => s.updateSection);
  const aspFromId = useId();

  if (!seasons) return null;

  const setSeasons = (next: AdminSeasonWindows): void => updateSection('season_windows', next);

  const patchWindow = (
    purpose: 'spsf' | 'sheet1' | 'season',
    index: number,
    patch: Partial<AdminSeasonWindow>,
  ): void => {
    setSeasons({
      ...seasons,
      [purpose]: seasons[purpose].map((w, i) => (i === index ? { ...w, ...patch } : w)),
    });
  };

  const moveProbe = (index: number, direction: -1 | 1): void => {
    const target = index + direction;
    if (target < 0 || target >= seasons.probe_order.length) return;
    const next = [...seasons.probe_order];
    const a = next[index];
    const b = next[target];
    if (a === undefined || b === undefined) return;
    next[index] = b;
    next[target] = a;
    setSeasons({ ...seasons, probe_order: next });
  };

  return (
    <div className="space-y-4">
      <TabErrorSummary errors={fieldErrors} tab={TAB} />

      <AdminSectionCard title="wSPSF Sales Windows">
        <p className="text-xs text-gray-500 mb-3">
          Each window should span 3 whole months. Applied by the engine on the next run.
        </p>
        {(() => {
          const overlaps: string[] = [];
          const spans = seasons.spsf.filter((w) => w.sales_start && w.sales_end);
          for (let i = 0; i < spans.length; i += 1) {
            for (let j = i + 1; j < spans.length; j += 1) {
              const a = spans[i];
              const b = spans[j];
              if (!a || !b) continue;
              if ((a.sales_start ?? '') <= (b.sales_end ?? '') && (b.sales_start ?? '') <= (a.sales_end ?? '')) {
                overlaps.push(`${a.window} ↔ ${b.window}`);
              }
            }
          }
          return overlaps.length > 0 ? (
            <p className="text-xs text-amber-600 mb-3">
              Overlapping reference periods: {overlaps.join(', ')} — check whether this is
              intentional.
            </p>
          ) : null;
        })()}
        <WindowTable rows={seasons.spsf} purpose="spsf" onChange={patchWindow} />
      </AdminSectionCard>

      <AdminSectionCard title="Season Date Windows">
        <p className="text-xs text-gray-500 mb-3">
          Planning-cycle date ranges per season (SS23…FW25 plus SAME_SEASON / RECENCY) — the
          engine's sales queries are built from these. Always saved with every version.
        </p>
        <WindowTable
          rows={seasons.season ?? []}
          purpose="season"
          onChange={patchWindow}
          hideSpaceCols
        />
      </AdminSectionCard>

      <AdminSectionCard title="Sheet1 Windows">
        <WindowTable rows={seasons.sheet1} purpose="sheet1" onChange={patchWindow} />
      </AdminSectionCard>

      <AdminSectionCard title="ASP Anchor">
        <div className="flex items-center gap-3">
          <label htmlFor={aspFromId} className="text-sm text-gray-700">
            ASP computed from
          </label>
          <Input
            id={aspFromId}
            type="date"
            value={seasons.asp_from ?? ''}
            onChange={(e) => setSeasons({ ...seasons, asp_from: e.target.value || null })}
            className="h-8 w-40 text-sm"
          />
          {findFieldError(fieldErrors, TAB, 'asp_from') && (
            <span className="text-xs text-red-600">
              {findFieldError(fieldErrors, TAB, 'asp_from')}
            </span>
          )}
        </div>
      </AdminSectionCard>

      <AdminSectionCard title="Season Probe Order">
        <p className="text-xs text-gray-500 mb-3">
          Fallback order used when a store lacks data in the preferred season.
        </p>
        <ol className="space-y-1.5">
          {seasons.probe_order.map((season, i) => (
            <li
              key={season}
              className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5"
            >
              <span className="w-6 text-xs text-gray-400">{i + 1}.</span>
              <span className="flex-1 text-sm font-medium text-gray-900">{season}</span>
              <button
                type="button"
                aria-label={`Move ${season} up`}
                disabled={i === 0}
                onClick={() => moveProbe(i, -1)}
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <button
                type="button"
                aria-label={`Move ${season} down`}
                disabled={i === seasons.probe_order.length - 1}
                onClick={() => moveProbe(i, 1)}
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ol>
      </AdminSectionCard>
    </div>
  );
}
