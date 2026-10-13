import { Modal, EmptyState, Spinner } from '@/components/ui';
import { channelLabel } from '../data/channelDisplayNames';
import { useDerivationSummary, type ApiDerivationSummaryRow } from '../api/otbDashboardApi';

const CRORE = 10_000_000;

/** Raw rupees -> Crores string, e.g. 620500000 -> "62.05". */
function toCr(value: number): string {
  return (value / CRORE).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function toUnits(value: number): string {
  return Math.round(value).toLocaleString('en-IN');
}

function toPct(value: number): string {
  return `${value.toLocaleString('en-IN', { maximumFractionDigits: 1 })}%`;
}

interface Column {
  key: keyof ApiDerivationSummaryRow;
  label: string;
  render: (row: ApiDerivationSummaryRow) => string;
}

// Column order mirrors the "4. OTB summary" working sheet, adapted to
// Superdry's channel-led model (REMARK / Count of Store dropped — no source).
const COLUMNS: Column[] = [
  { key: 'gsv', label: 'TTL GSV (Cr)', render: (r) => toCr(r.gsv) },
  { key: 'nsm_gsv', label: 'TTL NSM GSV (Cr)', render: (r) => toCr(r.nsm_gsv) },
  { key: 'mrp', label: 'MRP (Cr)', render: (r) => toCr(r.mrp) },
  { key: 'buy_mrp', label: 'TTL BUY MRP (Cr)', render: (r) => toCr(r.buy_mrp) },
  { key: 'buy_lc', label: 'TTL BUY LC (Cr)', render: (r) => toCr(r.buy_lc) },
  { key: 'buy_units', label: 'TTL BUY UNITS', render: (r) => toUnits(r.buy_units) },
  { key: 'nsm_mix_pct', label: 'NSM MIX %', render: (r) => toPct(r.nsm_mix_pct) },
  { key: 'fp_st_pct', label: 'FP ST %', render: (r) => toPct(r.fp_st_pct) },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  season?: string | null;
}

/**
 * OTB Derivation Summary — a per-channel table showing how the total OTB
 * (Sum of TTL BUY LC) is derived. Channel-led (Superdry) only.
 */
export function OTBDerivationSummaryModal({ isOpen, onClose, season }: Props): React.JSX.Element {
  const seasonParam = season && season !== 'all' ? season : undefined;
  const { data, isLoading, isError } = useDerivationSummary(
    { season: seasonParam },
    isOpen,
  );

  const rows = data?.items ?? [];
  const total = data?.total_row ?? null;
  const otbTotalCr = total ? toCr(total.buy_lc) : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="full"
      title="OTB Derivation Summary"
      description="How the total OTB is built up, channel by channel."
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner />
        </div>
      ) : isError ? (
        <EmptyState
          title="Couldn't load the derivation summary"
          description="Please try again in a moment."
        />
      ) : rows.length === 0 ? (
        <EmptyState
          title="No derivation data"
          description="There is no OTB data for the selected season yet."
        />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500">
                  <th className="text-left font-medium py-2 pr-4 whitespace-nowrap">Channel</th>
                  {COLUMNS.map((c) => (
                    <th key={c.key} className="text-right font-medium py-2 px-3 whitespace-nowrap">
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.channel} className="border-b border-gray-100 text-gray-900">
                    <td className="text-left py-2 pr-4 whitespace-nowrap font-medium">
                      {channelLabel(row.channel)}
                    </td>
                    {COLUMNS.map((c) => (
                      <td key={c.key} className="text-right py-2 px-3 tabular-nums whitespace-nowrap">
                        {c.render(row)}
                      </td>
                    ))}
                  </tr>
                ))}
                {total && (
                  <tr className="border-t-2 border-gray-300 font-semibold text-gray-900 bg-gray-50">
                    <td className="text-left py-2 pr-4 whitespace-nowrap">Grand Total</td>
                    {COLUMNS.map((c) => (
                      <td key={c.key} className="text-right py-2 px-3 tabular-nums whitespace-nowrap">
                        {c.render(total)}
                      </td>
                    ))}
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {data && data.aging_inventory_value > 0 && (
            <p className="mt-4 text-sm text-gray-600">
              <span className="font-semibold text-gray-900">
                Aging Inventory (older than 6 seasons) = ₹{toCr(data.aging_inventory_value)} Cr
              </span>{' '}
              — current on-hand stock tagged older than AW2023 (no channel split).
            </p>
          )}
          {otbTotalCr && (
            <p className="mt-1 text-sm text-gray-600">
              <span className="font-semibold text-gray-900">
                OTB (Total Buy at Landed Cost) = ₹{otbTotalCr} Cr
              </span>{' '}
              — the sum of TTL BUY LC across all channels.
            </p>
          )}
        </>
      )}
    </Modal>
  );
}

export default OTBDerivationSummaryModal;
