/**
 * Live AI briefing for a Companion dashboard view. Fetches the LLM-generated
 * summary (business | product) for the current date range, renders it in the
 * shared AiBriefing card, and exposes a Refresh button that force-regenerates.
 * Unavailable summaries show a retry state, without fabricated metric claims.
 */
import { Button, EmptyState } from '@/components/ui';
import { AiBriefing } from '../business-health/bhKit';
import { useCompanionAiSummary, useRefreshAiSummary } from '../api/companionHooks';
import type { CompanionRange, CompanionSummaryView } from '../api/companionApi';
import { useDateRange } from './dateRange';

export function CompanionBriefing({
  view,
}: {
  view: CompanionSummaryView;
}): React.ReactNode {
  const dr = useDateRange();
  const range: CompanionRange = dr ? { from: dr.from, to: dr.to } : {};

  const query = useCompanionAiSummary(view, range);
  const refresh = useRefreshAiSummary(view, range);

  // First load with no cached data yet.
  if (query.isLoading) {
    return (
      <AiBriefing label={view === "product" ? "Product briefing" : "Business briefing"} question="What needs attention?" summary="" loading />
    );
  }

  // Keep unavailable metrics out of the narrative.
  const data = query.data;
  if (query.isError || !data) {
    return <EmptyState title="AI briefing unavailable" description="The briefing will appear when the Companion service is available." action={<Button variant="outline" onClick={() => { void query.refetch(); }}>Retry briefing</Button>} />;
  }

  return (
    <AiBriefing
      label={data.label}
      question={data.question}
      summary={data.summary}
      updatedAt={data.updated_at}
      refreshing={refresh.isPending}
      onRefresh={() => refresh.mutate()}
    />
  );
}
