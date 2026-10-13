import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import {
  PageHeader,
  Spinner,
  EmptyState,
} from "@/components/ui";
import { cn, formatDate } from "@/lib/utils";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { useAuthStore } from "@/hooks/useAuthStore";
import { useTaskDetail } from "../hooks/useTaskDetail";
import { useTaskComments, useTaskActivities } from "../hooks/useTaskComments";
import { useTaskMutations } from "../hooks/useTaskMutations";
import type { Task, TaskStatus } from "../types/task.types";
import { canUserDo, type TaskAction } from "../lib/permissions";
import { DetailActionBar } from "../components/DetailActionBar";
import { LinkedExceptionCard } from "../components/LinkedExceptionCard";
import { DetailsTable } from "../components/DetailsTable";
import { DetailMetaChips } from "../components/DetailMetaChips";
import { MobileDetailKebab } from "../components/MobileDetailKebab";
import { ActionsList } from "../components/ActionsList";
import { CommentThread } from "../components/CommentThread";
import { CommentComposer } from "../components/CommentComposer";
import { ReviewBanner, ClosedBanner } from "../components/TaskBanners";
import { ActionConfirmModal } from "../components/ActionConfirmModal";
import { EditTaskModal } from "../components/EditTaskModal";
import { ReassignTaskModal } from "../components/ReassignTaskModal";

const AUTO_FLIP: Partial<Record<TaskStatus, TaskStatus>> = {
  open: "in_progress",
  reopened: "in_progress",
};

export function TaskDetailPage(): React.JSX.Element {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const locationState = location.state as {
    backLabel?: string;
    backPath?: string;
  } | null;
  const backLabel = locationState?.backLabel ?? "Tasks";
  const backPath = locationState?.backPath ?? "/tasks";
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const userEmail = useAuthStore((s) => s.user?.email ?? "");
  const detailQuery = useTaskDetail(id);
  const task = detailQuery.data?.task;
  const { isLoading, isError } = detailQuery;
  const { data: comments = [] } = useTaskComments(id);
  const { data: activities = [] } = useTaskActivities(id);
  const { patch: autoFlipMutation } = useTaskMutations();

  const [pendingAction, setPendingAction] = useState<TaskAction | null>(null);
  const handleAction = (action: TaskAction): void => setPendingAction(action);

  // Auto-flip open→in_progress / reopened→in_progress on first view by the assignee.
  // The BE auto-clears `unread_by_assignee` on the GET, so we only patch the status.
  useEffect(() => {
    if (!task) return;
    if (!userEmail || task.assigned_to !== userEmail) return;
    const nextStatus = AUTO_FLIP[task.status];
    if (nextStatus === undefined) return;
    autoFlipMutation.mutate({ id: task.id, patch: { status: nextStatus } });
    // Only fire once per task id — deps intentionally minimal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task?.id]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError || !task) {
    return (
      <div className="space-y-4 animate-fadeInUp">
        <PageHeader
          title="Task not found"
          backTo={{ label: backLabel, path: backPath }}
        />
        <EmptyState description={`No task with id ${id ?? "—"}.`} />
      </div>
    );
  }

  // On mobile the primary transitions move to a sticky bottom bar (thumb reach).
  const hasStickyCta =
    isMobile &&
    (canUserDo("submit_for_review", task, userEmail) ||
      canUserDo("approve_close", task, userEmail) ||
      canUserDo("reopen", task, userEmail) ||
      canUserDo("restore", task, userEmail));

  return (
    <div className={cn("space-y-4 animate-fadeInUp", hasStickyCta && "pb-24")}>
      {/* Flat header. Mobile: back + kebab on one row, title below (matches lab).
          Desktop: back + title (left), primary CTA (right). */}
      {isMobile ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => void navigate(backPath)}
              aria-label={`Back to ${backLabel}`}
              className="-ml-1.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <MobileDetailKebab task={task} userEmail={userEmail} onAction={handleAction} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 text-pretty">{task.title}</h1>
            {/* Due date + assignor sit directly under the title. */}
            <p className="mt-1 text-xs text-gray-500">
              {task.due_date ? `Due ${formatDate(task.due_date)}` : "No due date"}
              {" · from "}
              {task.assignor.split("@")[0] ?? task.assignor}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <button
              type="button"
              onClick={() => void navigate(backPath)}
              aria-label={`Back to ${backLabel}`}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            {/* Full title — wraps to a second line rather than truncating. */}
            <h1 className="min-w-0 text-lg font-bold text-gray-900 text-pretty">{task.title}</h1>
          </div>
          <DetailActionBar task={task} userEmail={userEmail} onAction={handleAction} />
        </div>
      )}

      {isMobile ? (
        <MobileBody
          task={task}
          userEmail={userEmail}
          comments={comments}
          activities={activities}
          onAction={handleAction}
        />
      ) : (
        <DesktopBody
          task={task}
          userEmail={userEmail}
          comments={comments}
          activities={activities}
          onAction={handleAction}
        />
      )}

      <ActionConfirmModal
        task={task}
        action={
          pendingAction === "edit" || pendingAction === "reassign"
            ? null
            : pendingAction
        }
        onClose={() => setPendingAction(null)}
      />
      <EditTaskModal
        task={task}
        isOpen={pendingAction === "edit"}
        onClose={() => setPendingAction(null)}
      />
      <ReassignTaskModal
        task={task}
        isOpen={pendingAction === "reassign"}
        onClose={() => setPendingAction(null)}
      />

      {/* Mobile: sticky bottom bar for the primary workflow CTA (like the Create
          bar on the list). Portaled to <body> so the page's animate-fadeInUp
          transform can't become the containing block and break `fixed`. */}
      {hasStickyCta &&
        createPortal(
          <div className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
            <DetailActionBar
              task={task}
              userEmail={userEmail}
              onAction={handleAction}
              variant="sticky"
            />
          </div>,
          document.body,
        )}
    </div>
  );
}

interface BodyProps {
  task: Task;
  userEmail: string;
  comments: Parameters<typeof CommentThread>[0]["comments"];
  activities: Parameters<typeof CommentThread>[0]["activities"];
  onAction: (action: TaskAction) => void;
}

function DesktopBody({
  task,
  userEmail,
  comments,
  activities,
  onAction,
}: BodyProps): React.JSX.Element {
  const showReview = task.status === "in_review" && task.assignor === userEmail;
  const showClosed = task.status === "done" || task.status === "cancelled";
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_480px] gap-4">
      <div className="space-y-4 min-w-0">
        {showReview && <ReviewBanner task={task} />}
        {showClosed && <ClosedBanner task={task} />}
        <DescriptionCard task={task} />
        {task.exception_id !== null && (
          <LinkedExceptionCard exceptionId={task.exception_id} />
        )}
        <CommentThread comments={comments} activities={activities} />
        <CommentComposer taskId={task.id} />
      </div>
      <aside className="space-y-4 lg:sticky lg:top-4 self-start">
        <DetailsTable task={task} />
        <ActionsList task={task} userEmail={userEmail} onAction={onAction} />
      </aside>
    </div>
  );
}

function MobileBody({
  task,
  userEmail,
  comments,
  activities,
}: BodyProps): React.JSX.Element {
  const showReview = task.status === "in_review" && task.assignor === userEmail;
  const showClosed = task.status === "done" || task.status === "cancelled";
  // Lab layout: compact meta chips → description → linked → conversation.
  // Meta is display-only (edit via the header kebab → Edit); secondary actions
  // live in the header kebab; the primary workflow CTA is the sticky bottom bar.
  return (
    <div className="space-y-4">
      {showReview && <ReviewBanner task={task} />}
      {showClosed && <ClosedBanner task={task} />}

      <DetailMetaChips task={task} />

      <MobileSection label="Description">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-700 whitespace-pre-line">{task.description}</p>
        </div>
      </MobileSection>

      {task.exception_id !== null && (
        <MobileSection label="Linked">
          <LinkedExceptionCard exceptionId={task.exception_id} showLabel={false} />
        </MobileSection>
      )}

      {/* Conversation — label + All/Comments/Activity toggle outside the card;
          feed + composer combined in one container; full-width Send. */}
      <CommentThread
        comments={comments}
        activities={activities}
        labelOutside
        footer={<CommentComposer taskId={task.id} bare fullWidthSend />}
      />
    </div>
  );
}

/** Eyebrow label above a section's card — the lab's label-outside pattern. */
function MobileSection({ label, children }: { label: string; children: React.ReactNode }): React.JSX.Element {
  return (
    <div>
      <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-gray-500">{label}</p>
      {children}
    </div>
  );
}

function DescriptionCard({ task }: { task: Task }): React.JSX.Element {
  return (
    <article className="bg-white border border-gray-200 rounded-lg p-4">
      <h2 className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-2">
        Description
      </h2>
      <p className="text-sm text-gray-700 whitespace-pre-line">
        {task.description}
      </p>
    </article>
  );
}
