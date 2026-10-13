import { useState } from 'react';

import { Button, Card, DataTable, DataTableBody, DataTableCell, DataTableHead, DataTableHeader, DataTableRow, EmptyState, Skeleton } from '@/components/ui';

import { useDcStock } from '../api/queries';
import { DC_LABEL, EMPTY, formatUnits } from './display';
import { ListSearch, Pager } from './ListControls';
import { ProvenanceChip } from './ProvenanceChip';
import { matchesQuery, pageSlice } from './scope';
import { ErrorBlock } from './QueryStates';

/** Rows per page; the section is secondary to the stores (S2-D7, S2-C44). */
const STOCK_PAGE_SIZE = 10;
const UNCLASSIFIED_LABEL = 'Not stocked at any store (attributes pending extend)';

interface DcStockSectionProps {
  readonly snapshotId: string;
  readonly dcCode: string;
}

/** The DC's own saleable stock by brick and grade (S2-R2, S2-C10); not a sum of its stores. */
export function DcStockSection({ snapshotId, dcCode }: DcStockSectionProps): React.ReactNode {
  const stock = useDcStock(snapshotId, dcCode);
  // Secondary section: its search and page stay local, not in the URL (S2-C46).
  const [query, setQuery] = useState('');
  const [page, setPage] = useState<number | null>(null);
  const handleSearch = (next: string): void => {
    setQuery(next);
    setPage(null);
  };
  const hasRows = Boolean(stock.data?.items.length);
  let body: React.ReactNode;
  let total: React.ReactNode = null;
  if (stock.isLoading) body = <Skeleton className="h-24 w-full" />;
  else if (stock.error || !stock.data) body = <ErrorBlock error={stock.error} onRetry={() => void stock.refetch()} />;
  else {
    const { items, unclassified, totals, attributes_source: source } = stock.data;
    const hasUnclassified = unclassified.options > 0 || unclassified.units > 0;
    total = (
      <p className="text-xs text-gray-500">
        <span data-testid="dc-stock-total-units" className="font-semibold tabular-nums text-gray-900">{formatUnits(totals.units)}</span> units ·{' '}
        <span className="tabular-nums">{formatUnits(totals.options)}</span> options
      </p>
    );
    if (!items.length && !hasUnclassified) body = <EmptyState title={`The ${DC_LABEL} holds no saleable stock`} description={`No saleable units at ${DC_LABEL} ${dcCode} on the snapshot date.`} />;
    else {
      const matching = items.filter((item) => matchesQuery([item.brick, item.grade_class], query));
      const slice = pageSlice(matching, STOCK_PAGE_SIZE, page, -1);
      body = (
        <>
          {query ? (
            <p className="text-xs tabular-nums text-gray-500">
              Showing {formatUnits(matching.length)} of {formatUnits(items.length)} brick × grade rows
            </p>
          ) : null}
          {source === 'store_rows' ? (
            <p className="text-xs text-gray-500">Brick and grade come from the stores' stock rows until this snapshot is extended.</p>
          ) : null}
          {query && !matching.length ? (
            <EmptyState
              title={`No brick or grade matches "${query}"`}
              description="Search looks at brick and grade."
              action={
                <Button variant="outline" size="sm" data-testid="dc-stock-clear-search" onClick={() => handleSearch('')} className="min-h-11 md:min-h-0">
                  Clear search
                </Button>
              }
            />
          ) : (
          <DataTable className="relative" minWidth="0px">
            <caption className="sr-only">Saleable stock at {DC_LABEL} {dcCode} by brick and grade</caption>
            <DataTableHeader>
              <DataTableHead className="px-2">Brick</DataTableHead>
              <DataTableHead className="px-2">Grade</DataTableHead>
              <DataTableHead align="right" className="px-2">Options</DataTableHead>
              <DataTableHead align="right" className="px-2">Units</DataTableHead>
            </DataTableHeader>
            <DataTableBody>
              {slice.items.map((item) => (
                <DataTableRow key={`${item.brick ?? ''}-${item.grade_class}`} className="hover:bg-transparent">
                  <DataTableCell className="px-2 py-1.5 font-medium text-gray-900">{item.brick ?? EMPTY}</DataTableCell>
                  <DataTableCell className="px-2 py-1.5">{item.grade_class}</DataTableCell>
                  <DataTableCell align="right" className="px-2 py-1.5 tabular-nums">{formatUnits(item.options)}</DataTableCell>
                  <DataTableCell align="right" className="px-2 py-1.5 tabular-nums">{formatUnits(item.units)}</DataTableCell>
                </DataTableRow>
              ))}
              {hasUnclassified && !query ? (
                <DataTableRow className="hover:bg-transparent">
                  <DataTableCell colSpan={2} className="px-2 py-1.5 text-gray-600">{UNCLASSIFIED_LABEL}</DataTableCell>
                  <DataTableCell align="right" className="px-2 py-1.5 tabular-nums">{formatUnits(unclassified.options)}</DataTableCell>
                  <DataTableCell align="right" className="px-2 py-1.5 tabular-nums">
                    <span data-testid="dc-stock-unclassified-units">{formatUnits(unclassified.units)}</span>
                  </DataTableCell>
                </DataTableRow>
              ) : null}
            </DataTableBody>
          </DataTable>
          )}
          <Pager page={slice.page} pages={slice.pages} onPage={setPage} testid="dc-stock-pager" />
        </>
      );
    }
  }
  return (
    <Card className="min-w-0 space-y-2 p-3" data-testid="dc-stock">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            {DC_LABEL} stock by brick and grade
            <ProvenanceChip provenance="observed" note={`Saleable ${DC_LABEL} stock on the snapshot date; negative rows count as 0`} />
          </h2>
          <p className="text-xs text-gray-500">The {DC_LABEL}'s own saleable stock on the snapshot date; not part of the store totals.</p>
          {total}
        </div>
        {/* No control row here: the search takes the header's right slot (S2-C64). */}
        {hasRows ? <ListSearch value={query} onSearch={handleSearch} placeholder="Search stock" testid="dc-stock-search" debounceMs={0} /> : null}
      </div>
      {body}
    </Card>
  );
}
