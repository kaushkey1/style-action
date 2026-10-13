import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/hooks/useAuthStore';
import {
  fetchAllInsightFeedback,
  submitInsightFeedback,
} from './insightFeedbackApi';
import type { InsightFeedbackItem } from './insightFeedbackApi';

// Single shared key — server scopes results to the current session via cookie auth,
// so we don't gate or partition the cache by email (which can be empty during
// auth hydration and would silently disable the query).
const INSIGHT_FEEDBACK_KEY = ['insight-feedback'] as const;

export type { InsightFeedbackItem };

const EMPTY_FEEDBACKS: InsightFeedbackItem[] = [];

function useAllInsightFeedback(): {
  feedbacks: InsightFeedbackItem[];
  isLoading: boolean;
} {
  const userEmail = useAuthStore((s) => s.user?.email ?? '');
  const { data, isLoading } = useQuery({
    queryKey: INSIGHT_FEEDBACK_KEY,
    queryFn: () => fetchAllInsightFeedback(userEmail),
    staleTime: 5 * 60 * 1000,
  });
  return { feedbacks: data ?? EMPTY_FEEDBACKS, isLoading };
}

export function useInsightFeedback(insightId: string): {
  feedback: InsightFeedbackItem | null;
  isLoading: boolean;
} {
  const { feedbacks, isLoading } = useAllInsightFeedback();
  const feedback = useMemo<InsightFeedbackItem | null>(() => {
    const matches = feedbacks.filter((f) => f.insight_id === insightId);
    if (matches.length === 0) return null;
    const sorted = [...matches].sort((a, b) =>
      b.created_at.localeCompare(a.created_at),
    );
    return sorted[0] ?? null;
  }, [feedbacks, insightId]);
  return { feedback, isLoading };
}

export function useSubmitInsightFeedback(): {
  submit: (
    payload: {
      insightId: string;
      feedback: string;
      markedHelpful: boolean;
    },
    options?: { onError?: (error: unknown) => void },
  ) => void;
  isPending: boolean;
  isSuccess: boolean;
} {
  const userEmail = useAuthStore((s) => s.user?.email ?? '');
  const queryClient = useQueryClient();
  const { mutate, isPending, isSuccess } = useMutation({
    mutationFn: (payload: {
      insightId: string;
      feedback: string;
      markedHelpful: boolean;
    }) =>
      submitInsightFeedback({
        insight_id: payload.insightId,
        feedback: payload.feedback,
        marked_helpful: payload.markedHelpful,
        userEmail,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: INSIGHT_FEEDBACK_KEY });
    },
  });

  const submit = (
    payload: { insightId: string; feedback: string; markedHelpful: boolean },
    options?: { onError?: (error: unknown) => void },
  ): void => {
    mutate(payload, { onError: options?.onError });
  };

  return { submit, isPending, isSuccess };
}
