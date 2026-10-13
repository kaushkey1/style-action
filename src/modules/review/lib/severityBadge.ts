import type { ExceptionSeverity } from '@/modules/exceptions/data/mockExceptions';

type SeverityBadgeVariant = 'error' | 'warning' | 'info' | 'default';

/**
 * Severity → human label + Badge variant.
 * Used by ReviewListItem (left pane row) and ReviewDetailHeader (right pane)
 * to render a consistent status pill in place of the old `<SeverityGlyph>`
 * bars. Colors mirror the glyph palette (S1 red, S2 amber, S3 indigo, S4 gray).
 */
export const SEVERITY_BADGE: Record<ExceptionSeverity, { label: string; variant: SeverityBadgeVariant }> = {
  S1: { label: 'Critical', variant: 'error' },
  S2: { label: 'High', variant: 'warning' },
  S3: { label: 'Medium', variant: 'info' },
  S4: { label: 'Low', variant: 'default' },
};
