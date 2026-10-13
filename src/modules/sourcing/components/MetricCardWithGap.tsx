import type { ComponentProps } from 'react';
import { MetricCard } from '@/components/ui';

type MetricCardProps = ComponentProps<typeof MetricCard>;

interface Props extends MetricCardProps {
  /**
   * Reason the API returned a placeholder. Currently ignored — value cells
   * show "N/A" on their own without an extra info-icon tooltip. Retained on
   * the props so callers don't need a churn change; can be re-surfaced later
   * if product wants the explanation back.
   */
  dataGapReason?: string;
}

/**
 * Thin pass-through around MetricCard kept for sourcing-tab API stability.
 * Drops the `dataGapReason` prop before forwarding so MetricCard doesn't see
 * an unknown attribute.
 */
export function MetricCardWithGap({ dataGapReason, ...rest }: Props) {
  // Intentionally drop dataGapReason — no tooltip rendered today, but the
  // prop stays on the interface so callers don't churn.
  void dataGapReason;
  return <MetricCard {...rest} />;
}
