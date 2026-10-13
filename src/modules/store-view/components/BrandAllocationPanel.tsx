import { Badge, DataTable, DataTableHeader, DataTableBody, DataTableRow, DataTableHead, DataTableCell } from '@/components/ui';
import {cn, formatNumber, getCurrencySymbol} from '@/lib/utils';
import { getStoreBrandAllocations } from '@/modules/range/data/mockSpacePlanning';

interface BrandAllocationPanelProps {
  storeId: string;
  segmentCode: string;
  segmentName: string;
}

export function BrandAllocationPanel({ storeId, segmentCode, segmentName }: BrandAllocationPanelProps) {
  const brands = getStoreBrandAllocations(storeId, segmentCode);

  if (brands.length === 0) {
    return <p className="text-xs text-gray-500 py-2 px-4">No brand data available for {segmentName}.</p>;
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-1 mb-2">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Brand Breakdown — {segmentName}</p>
      <DataTable>
        <DataTableHeader className="bg-gray-50">
          <DataTableHead>Brand</DataTableHead>
          <DataTableHead>Type</DataTableHead>
          <DataTableHead align="center">Tier</DataTableHead>
          <DataTableHead align="right">SFT</DataTableHead>
          <DataTableHead align="right">GMROF</DataTableHead>
          <DataTableHead align="right">Fix</DataTableHead>
          <DataTableHead align="right">Opts</DataTableHead>
          <DataTableHead align="right">Penetr.</DataTableHead>
          <DataTableHead>Indicator</DataTableHead>
        </DataTableHeader>
        <DataTableBody>
          {brands.map((b) => (
            <DataTableRow key={b.brandName}>
              <DataTableCell className="font-medium text-gray-900">{b.brandName}</DataTableCell>
              <DataTableCell>
                <Badge variant={b.type === 'PL' ? 'default' : 'secondary'} className="text-xs px-1.5 py-0">
                  {b.type}
                </Badge>
              </DataTableCell>
              <DataTableCell align="center" className="text-gray-600">{b.tier}</DataTableCell>
              <DataTableCell align="right">{formatNumber(b.sft)}</DataTableCell>
              <DataTableCell align="right" className="font-medium text-gray-900">{getCurrencySymbol()}{b.gmrof}</DataTableCell>
              <DataTableCell align="right">{b.fixtures}</DataTableCell>
              <DataTableCell align="right">{b.options}</DataTableCell>
              <DataTableCell align="right">{b.penetration}%</DataTableCell>
              <DataTableCell>
                {b.indicator === 'expand' && (
                  <span className={cn('text-xs font-semibold px-1.5 py-0.5 rounded', 'bg-emerald-50 text-emerald-700')}>
                    Expand
                  </span>
                )}
                {b.indicator === 'exit' && (
                  <span className={cn('text-xs font-semibold px-1.5 py-0.5 rounded', 'bg-red-50 text-red-700')}>
                    Exit
                  </span>
                )}
              </DataTableCell>
            </DataTableRow>
          ))}
        </DataTableBody>
      </DataTable>
      <div className="mt-3 pt-2 border-t border-gray-200 flex gap-4 text-xs text-gray-500">
        <span><span className="inline-block w-2 h-2 rounded-sm bg-emerald-500 mr-1" /> GMROF &gt; 1.2x segment avg</span>
        <span><span className="inline-block w-2 h-2 rounded-sm bg-red-500 mr-1" /> GMROF &lt; 0.7x segment avg</span>
      </div>
    </div>
  );
}
