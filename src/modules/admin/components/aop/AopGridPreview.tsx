import { useState, type ReactNode } from 'react';
import { Input } from '@/components/ui';
import { monthLabel } from '../../api/aopAdminCalendar';
import { GRID_PARAMETERS, type GridPreview } from '../../api/aopGridDraft';

export function AopGridPreview({ preview }: { preview: GridPreview }): ReactNode {
  const [siteSearch, setSiteSearch] = useState('');
  const cells = preview.cells.filter((cell) => `${cell.site.name} ${cell.site.code}`.toLocaleLowerCase().includes(siteSearch.trim().toLocaleLowerCase()));
  const issues = [...new Set(preview.errors)];
  const siteCount = new Set(preview.cells.map((cell) => cell.site.site_reference)).size;
  const monthCount = new Set(preview.cells.map((cell) => cell.month)).size;
  return <div className="min-w-0 space-y-2">
    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
      <span>{siteCount} {siteCount === 1 ? 'site' : 'sites'} · {monthCount} {monthCount === 1 ? 'month' : 'months'} · {preview.cells.length.toLocaleString()} {preview.cells.length === 1 ? 'cell' : 'cells'}</span>
    </div>
    {!!preview.skipped && <p className="text-xs text-gray-500">{preview.skipped} blank cells skipped.</p>}
    {!!preview.unchanged && <p className="text-xs text-gray-500">{preview.unchanged} unchanged cells skipped.</p>}
    {!!preview.filteredOut && <p className="text-xs text-gray-500">{preview.filteredOut} cells from unselected parameters skipped.</p>}
    {!preview.cells.length && !preview.errors.length && <p className="text-sm text-gray-600">No values changed.</p>}
    {!!preview.errors.length && <div role="alert" className="max-h-24 overflow-auto rounded-lg border border-red-200 p-3 text-xs text-red-700">
      <p className="font-medium">Nothing will be applied until these errors are fixed.</p>
      {issues.map((error) => <p key={error}>{error}</p>)}
    </div>}
    {!!preview.cells.length && <>
      <Input type="search" aria-label="Search preview sites" placeholder="Find a site in these changes" value={siteSearch} onChange={(event) => setSiteSearch(event.target.value)} className="py-2 text-sm" />
      <div className="relative max-h-[40vh] overflow-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm" aria-label="Preview cell changes">
          <thead className="sticky top-0 bg-gray-50"><tr>{['Site', 'Month / parameter', 'Current → new %'].map((label) => <th key={label} scope="col" className="px-2 py-2 text-left text-xs font-medium text-gray-500 last:text-right">{label}</th>)}</tr></thead>
          <tbody>{cells.map((cell) => <tr key={`${cell.site.site_reference}:${cell.month}:${cell.parameter}`} className="border-t border-gray-100">
            <th scope="row" className="px-2 py-2 text-left font-normal"><p className="break-words">{cell.site.name}</p><p className="break-all text-xs text-gray-500">{cell.site.code}</p></th>
            <td className="px-2 py-2"><p>{monthLabel(cell.month)}</p><p className="text-xs text-gray-500">{GRID_PARAMETERS.find((metric) => metric.key === cell.parameter)?.label}</p></td>
            <td className="px-2 py-2 text-right tabular-nums"><span className="break-all text-gray-500">{cell.before}</span><span className="mx-1 text-gray-400" aria-hidden="true">→</span><span className="font-medium">{cell.after}</span></td>
          </tr>)}</tbody>
        </table>
        {!cells.length && <p className="p-3 text-sm text-gray-500">No matching sites in this preview.</p>}
      </div>
    </>}
  </div>;
}
