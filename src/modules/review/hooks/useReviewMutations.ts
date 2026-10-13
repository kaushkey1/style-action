import { useMutation, useQueryClient } from '@tanstack/react-query';
import { approveReviewItem, rejectReviewItem, type ApprovePayload, type RejectPayload } from '../api/reviewApi';

export function useReviewMutations() {
  const queryClient = useQueryClient();

  const approve = useMutation({
    mutationFn: (payload: ApprovePayload) => approveReviewItem(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['review', 'items'] });
    },
  });

  const reject = useMutation({
    mutationFn: (payload: RejectPayload) => rejectReviewItem(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['review', 'items'] });
    },
  });

  return { approve, reject };
}
