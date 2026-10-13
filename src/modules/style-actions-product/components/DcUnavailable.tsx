import { Button, EmptyState } from '@/components/ui';

import { DC_LABEL, DC_LABEL_PLURAL } from './display';

import type { DcItem } from '../api/types';

interface DcUnavailableProps {
  /** The DC asked for; null when the snapshot holds no DC at all. */
  readonly dcCode: string | null;
  readonly dcs: readonly DcItem[];
  readonly onPick: (dcCode: string) => void;
}

/** A DC the snapshot does not hold: say so and offer the DCs it has, never show empty figures (S2-R1). */
export function DcUnavailable({ dcCode, dcs, onPick }: DcUnavailableProps): React.ReactNode {
  return (
    <div data-testid="dc-not-in-snapshot">
      <EmptyState
        className="mx-auto max-w-lg"
        title={dcCode ? `${DC_LABEL} ${dcCode} is not in this snapshot` : `This snapshot holds no ${DC_LABEL_PLURAL}`}
        description={dcs.length ? `This snapshot holds ${dcs.length === 1 ? DC_LABEL : DC_LABEL_PLURAL} ${dcs.map((item) => item.dc_code).join(', ')}.` : 'Data health shows the snapshot scope.'}
        action={
          dcs.length ? (
            <div className="flex flex-wrap justify-center gap-2">
              {dcs.map((item) => (
                <Button key={item.dc_code} variant="outline" size="sm" onClick={() => onPick(item.dc_code)} className="min-h-11 md:min-h-0">
                  Open {DC_LABEL} {item.dc_code}
                </Button>
              ))}
            </div>
          ) : undefined
        }
      />
    </div>
  );
}
