/**
 * Canonical raw-channel -> display-name mapping for channel-led orgs (Superdry).
 *
 * Single source of truth. Consumed by the OTB Dashboard, the Channel Detail
 * page and the OTB admin Parameters tab, so a channel rename is a one-line
 * change here rather than an edit in every screen.
 */

export const CHANNEL_DISPLAY_NAMES: Record<string, string> = {
  EBO_Channel: 'EBO',
  Ecom_own_site: 'Superdry.in',
  Distribution: 'Distribution',
  Omni: 'Omni',
  Others: 'Others',
  SIS_Channel: 'SIS',
  RBL_MBO: 'MBO',
};

/** Friendly label for a raw channel key; falls back to the raw key. */
export function channelLabel(raw: string): string {
  return CHANNEL_DISPLAY_NAMES[raw] ?? raw;
}
