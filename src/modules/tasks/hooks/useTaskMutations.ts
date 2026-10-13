import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/useToast';
import { useAuthStore } from '@/hooks/useAuthStore';
import {
  createTask,
  patchTask,
  type CreateTaskInput,
  type PatchTaskInput,
} from '../api/tasksApi';
import { postComment, type PostCommentInput } from '../api/commentsApi';
import { taskKeys } from '../api/queryKeys';
import { emailToast } from '../lib/emailMockToast';

/**
 * Bundles create + generic patch + addComment mutations and centralises cache
 * invalidation + the email-mock toasts (per spec §R3 "email sent" cue).
 *
 * The `patch` mutation accepts an optional `reason` which the BE uses to
 * auto-post a transition comment (submission / review_feedback / reopen /
 * cancel / restore) in the same transaction as the status change.
 */
export function useTaskMutations() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const navigate = useNavigate();
  const userEmail = useAuthStore((s) => s.user?.email ?? '');

  const create = useMutation({
    mutationFn: (input: CreateTaskInput) => createTask(input, userEmail),
    onSuccess: (task) => {
      void queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: taskKeys.pendingCount(task.assigned_to) });
      void queryClient.invalidateQueries({ queryKey: taskKeys.pendingCount(task.assignor) });
      if (task.exception_id !== null) {
        void queryClient.invalidateQueries({ queryKey: taskKeys.byException(task.exception_id) });
      }
      emailToast(toast, 'task_assigned', task.assigned_to);
      toast.info('Confirmation sent to you');
      void navigate(`/tasks/${task.id}`);
    },
  });

  const patch = useMutation({
    mutationFn: (input: PatchTaskInput) => patchTask(input, userEmail),
    onSuccess: (task) => {
      void queryClient.invalidateQueries({ queryKey: taskKeys.detail(task.id) });
      void queryClient.invalidateQueries({ queryKey: taskKeys.activities(task.id) });
      void queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: taskKeys.pendingCount(task.assigned_to) });
      void queryClient.invalidateQueries({ queryKey: taskKeys.pendingCount(task.assignor) });
      if (userEmail.length > 0) {
        void queryClient.invalidateQueries({ queryKey: taskKeys.pendingCount(userEmail) });
      }
      if (task.exception_id !== null) {
        void queryClient.invalidateQueries({ queryKey: taskKeys.byException(task.exception_id) });
      }
    },
  });

  const addComment = useMutation({
    mutationFn: (input: PostCommentInput) => postComment(input, userEmail),
    onSuccess: (comment) => {
      void queryClient.invalidateQueries({ queryKey: taskKeys.detail(comment.task_id) });
      void queryClient.invalidateQueries({ queryKey: taskKeys.activities(comment.task_id) });
    },
  });

  return { create, patch, addComment };
}
