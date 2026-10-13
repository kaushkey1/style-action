import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchPersonaInsights } from '@/modules/store-view/api/insightsApi';
import { InsightsBanner, InsightsBannerSkeleton } from '@/modules/store-view/components/InsightsBanner';

/**
 * Category Director briefing — a thin data adapter over the shared InsightsBanner
 * so every persona's morning briefing renders the one standardized component
 * (identical UI, spacing, padding, type, colour).
 */
export function MorningBriefing(): React.ReactNode {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['insights', 'category-director'],
    queryFn: () => fetchPersonaInsights('category-director'),
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) return <InsightsBannerSkeleton />;
  if (!data || data.insights.length === 0) return null;

  return (
    <InsightsBanner
      data={data}
      onViewAll={() => navigate('/review?tab=insights&from=dashboard')}
      onOpenInsight={(id) => navigate(`/review?tab=insights&insight=${id}&from=dashboard`)}
    />
  );
}

