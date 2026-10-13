import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/hooks/useAuthStore';
import {
  fetchExceptionFeedback,
  submitExceptionFeedback,
} from './exceptionFeedbackApi';
import type { ExceptionFeedbackItem } from './exceptionFeedbackApi';

const exceptionFeedbackKeys = {
  all: ['exception-feedback'] as const,
  byException: (exceptionId: string) =>
    [...exceptionFeedbackKeys.all, exceptionId] as const,
};

export type { ExceptionFeedbackItem };

export function useExceptionFeedback(exceptionId: string, enabled: boolean = true): {
  feedback: ExceptionFeedbackItem | null;
  isLoading: boolean;
} {
  // userEmail goes in the request header but does NOT gate the query — auth-store
  // hydration is async and a closed gate prevents invalidation from refetching.
  // `enabled` lets callers defer the per-exception fetch until the row is open
  // (the Action Register keeps every row's detail mounted for its animation).
  const userEmail = useAuthStore((s) => s.user?.email ?? '');
  const { data, isLoading } = useQuery({
    queryKey: exceptionFeedbackKeys.byException(exceptionId),
    queryFn: () => fetchExceptionFeedback(exceptionId, userEmail),
    staleTime: 5 * 60 * 1000,
    enabled: !!exceptionId && enabled,
  });
  return { feedback: data ?? null, isLoading };
}

export function useSubmitExceptionFeedback(): {
  submit: (
    payload: {
      exceptionId: string;
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
      exceptionId: string;
      feedback: string;
      markedHelpful: boolean;
    }) =>
      submitExceptionFeedback({
        exception_id: payload.exceptionId,
        feedback: payload.feedback,
        marked_helpful: payload.markedHelpful,
        userEmail,
      }),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: exceptionFeedbackKeys.byException(variables.exceptionId),
      });
    },
  });

  const submit = (
    payload: { exceptionId: string; feedback: string; markedHelpful: boolean },
    options?: { onError?: (error: unknown) => void },
  ): void => {
    mutate(payload, { onError: options?.onError });
  };

  return { submit, isPending, isSuccess };
}
