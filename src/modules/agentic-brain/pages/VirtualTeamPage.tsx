import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  Clock,
  Play,
  Loader2,
  CheckCircle,
  XCircle,
  RefreshCw,
  Zap,
  Trash2,
  Send,
  X,
  RotateCcw,
  Square,
  Upload,
  FileText,
  Bot,
  Wand2,
  BarChart3,
  Brain,
  User,
  Wrench,
  ChevronDown,
  ChevronRight,
  ScrollText,
  Hash,
  Copy,
  Check,
} from 'lucide-react';
import {
  Card,
  Badge,
  MetricGrid,
  MetricCard,
  PageHeader,
  SectionHeader,
  Spinner,
  EmptyState,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Input,
  Textarea,
  Label,
  HoverCard,
} from '@/components/ui';
import { cn, formatDateTime } from '@/lib/utils';
import {
  fetchKanbanTasks,
  fetchKanbanTask,
  launchKanbanTask,
  updateKanbanTask,
  deleteKanbanTask,
  dispatchTask,
  addTaskComment,
  fetchTaskFiles,
  uploadFiles,
  fetchTaskSession,
  gbrainKeys,
  gbrainUrl,
} from '../api/agenticBrainApi';
import { SessionDownloadMenu } from '../components/SessionDownloadMenu';
import type { KanbanTask, UpdateTaskData } from '../data/agenticBrainTypes';

// ─── Status mapping ─────────────────────────────────────────────────────────

const COLUMNS = ['ready', 'running', 'done', 'failed'] as const;
type Column = (typeof COLUMNS)[number];

const COLUMN_CONFIG: Record<Column, { label: string; badgeVariant: 'info' | 'warning' | 'success' | 'error' }> = {
  ready: { label: 'Ready', badgeVariant: 'info' },
  running: { label: 'Running', badgeVariant: 'warning' },
  done: { label: 'Done', badgeVariant: 'success' },
  failed: { label: 'Failed', badgeVariant: 'error' },
};

function mapStatus(t: KanbanTask): Column {
  if (t.status === 'done') return 'done';
  if (t.status === 'running') return 'running';
  if (t.status === 'blocked' || t.consecutive_failures > 0) return 'failed';
  return 'ready';
}

/** gbrain timestamps are unix seconds — convert and render in the app-standard format. */
function formatTime(ts: number): string {
  return formatDateTime(new Date(ts * 1000));
}

// ─── Task Card ──────────────────────────────────────────────────────────────

function TaskCard({
  task,
  onClick,
  onRun,
  onStop,
  hasRunningTask,
}: {
  task: KanbanTask;
  onClick: () => void;
  onRun?: () => void;
  onStop?: () => void;
  hasRunningTask?: boolean;
}): React.ReactNode {
  const col = mapStatus(task);

  return (
    <Card
      className="p-3 cursor-pointer hover:border-primary/30 transition-colors"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={`View task: ${task.title}`}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <h4 className="text-sm font-medium text-gray-900 line-clamp-2">
          {task.title}
        </h4>
        <Badge variant={COLUMN_CONFIG[col].badgeVariant} className="shrink-0 text-xs">
          {COLUMN_CONFIG[col].label}
        </Badge>
      </div>
      {task.body && (
        <p className="text-xs text-gray-500 line-clamp-2 mb-2">{task.body}</p>
      )}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] text-gray-400 font-mono">
          {task.id.slice(0, 12)}
        </span>
        {task.assignee && (
          <Badge variant="primary" size="sm">@{task.assignee}</Badge>
        )}
        {task.consecutive_failures > 0 && (
          <span className="text-[10px] text-red-500">
            {task.consecutive_failures} failures
          </span>
        )}
        {/* Inline actions */}
        {col === 'ready' && onRun && (
          hasRunningTask ? (
            <Badge variant="default" size="sm" className="ml-auto">
              <Clock className="w-3 h-3 mr-0.5" /> Queued
            </Badge>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto text-xs h-6 px-2"
              onClick={(e) => { e.stopPropagation(); onRun(); }}
            >
              <Play className="w-3 h-3 mr-0.5" /> Run
            </Button>
          )
        )}
        {col === 'running' && onStop && (
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto text-xs h-6 px-2 text-red-600"
            onClick={(e) => { e.stopPropagation(); onStop(); }}
          >
            <Square className="w-3 h-3 mr-0.5" /> Stop
          </Button>
        )}
        {col === 'failed' && onRun && (
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto text-xs h-6 px-2 text-amber-600"
            onClick={(e) => { e.stopPropagation(); onRun(); }}
          >
            <RotateCcw className="w-3 h-3 mr-0.5" /> Retry
          </Button>
        )}
      </div>
    </Card>
  );
}

// ─── Session Log Message ─────────────────────────────────────────────────────

interface LogMessage {
  role: string;
  content: string;
}

/** Try to parse tool content as JSON to extract structured output */
function parseToolContent(raw: string): { output: string; status?: string; exitCode?: number } {
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return {
      output: (parsed.output as string) ?? (parsed.result as string) ?? raw,
      status: parsed.status as string | undefined,
      exitCode: parsed.exit_code as number | undefined,
    };
  } catch {
    return { output: raw };
  }
}

function SessionLogMessage({ msg }: { msg: LogMessage }): React.ReactNode {
  const [expanded, setExpanded] = useState(false);
  const isUser = msg.role === 'user';
  const isTool = msg.role === 'tool';
  const RoleIcon = isUser ? User : isTool ? Wrench : Bot;
  const roleColor = isUser ? 'text-primary' : isTool ? 'text-amber-500' : 'text-green-600';
  const roleLabel = isUser ? 'You' : isTool ? 'Tool' : 'Agent';

  // Parse tool content for structured display
  const toolParsed = isTool ? parseToolContent(msg.content) : null;
  const displayContent = toolParsed ? toolParsed.output : msg.content;
  const isLong = isTool && displayContent.length > 200;

  return (
    <div
      className={cn(
        'rounded-lg px-4 py-3 text-sm',
        isUser
          ? 'bg-primary/5 border border-primary/10'
          : isTool
            ? 'bg-amber-50 border border-amber-100'
            : 'bg-white border border-gray-200',
      )}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <RoleIcon className={cn('w-3.5 h-3.5', roleColor)} />
        <span className={cn('text-xs font-medium', roleColor)}>{roleLabel}</span>
        {toolParsed?.status && (
          <Badge variant={toolParsed.exitCode === 0 ? 'success' : 'error'} size="sm">
            {toolParsed.status}{toolParsed.exitCode !== undefined ? ` (${toolParsed.exitCode})` : ''}
          </Badge>
        )}
        {isLong && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="ml-auto flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 min-h-[44px] md:min-h-0"
            aria-label={expanded ? 'Collapse output' : 'Expand output'}
          >
            {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            {expanded ? 'Collapse' : 'Expand'}
          </button>
        )}
      </div>
      <div className={cn(
        'text-sm text-gray-700 whitespace-pre-wrap leading-relaxed pl-5',
        isLong && !expanded && 'line-clamp-3',
      )}>
        {displayContent}
      </div>
    </div>
  );
}

// ─── Task Session Log ────────────────────────────────────────────────────────

function TaskSessionLog({ taskId, isRunning }: { taskId: string; isRunning: boolean }): React.ReactNode {
  const [isOpen, setIsOpen] = useState(false);

  // Direct endpoint: GET /api/gbrain/kanban/tasks/{id}/session
  // Poll every 5s while running, stop when done
  const { data: sessionData, isLoading } = useQuery({
    queryKey: gbrainKeys.taskSession(taskId),
    queryFn: () => fetchTaskSession(taskId),
    enabled: isOpen,
    refetchInterval: isRunning ? 5_000 : false,
  });

  const messages = sessionData?.session?.messages ?? [];
  const exportMeta = { title: `Session Log — ${taskId}`, fileId: taskId };

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center border-b border-gray-200 transition-colors hover:bg-gray-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex-1 min-w-0 flex items-center gap-3 px-4 py-3 text-left min-h-[44px]"
          aria-expanded={isOpen}
        >
          <ScrollText className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-semibold text-gray-900">Session Log</span>
          {messages.length > 0 && (
            <Badge variant="default" size="sm">{messages.length}</Badge>
          )}
          {isRunning && isOpen && messages.length > 0 && (
            <Badge variant="warning" size="sm" dot>Live</Badge>
          )}
        </button>
        {messages.length > 0 && (
          <SessionDownloadMenu
            meta={exportMeta}
            messages={messages}
            ariaLabel="Download session log"
            className="shrink-0"
          />
        )}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-label={isOpen ? 'Collapse session log' : 'Expand session log'}
          className="mr-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 focus-visible:outline-none focus-kb:ring-2 focus-kb:ring-primary"
        >
          {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>

      {isOpen && (
        <div className="p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Spinner size="sm" />
            </div>
          ) : messages.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4">
              {isRunning ? 'Agent is starting up — session will appear shortly...' : 'No session log available for this task.'}
            </p>
          ) : (
            <div className="space-y-2">
              {messages.map((msg, i) => (
                <SessionLogMessage key={i} msg={msg} />
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

// ─── Task Detail View ───────────────────────────────────────────────────────

/** Prompts beyond these bounds clamp to the first 20 lines (line-clamp-[20])
    with a "Show full prompt" toggle. Keep PROMPT_CLAMP_LINES in sync with the
    line-clamp utility below. */
const PROMPT_CLAMP_LINES = 20;
const PROMPT_CLAMP_CHARS = 2000;

/** How long the copy-confirmation check mark shows on the Task ID row. */
const COPY_FEEDBACK_MS = 1500;

function TaskDetailView({
  taskId,
  onBack,
}: {
  taskId: string;
  onBack: () => void;
}): React.ReactNode {
  const queryClient = useQueryClient();
  const [comment, setComment] = useState('');
  const [promptExpanded, setPromptExpanded] = useState(false);
  const [idCopied, setIdCopied] = useState(false);
  const [promptCopied, setPromptCopied] = useState(false);

  const { data: detail, isLoading } = useQuery({
    queryKey: gbrainKeys.task(taskId),
    queryFn: () => fetchKanbanTask(taskId),
    refetchInterval: 5_000,
  });

  const { data: taskFiles = [] } = useQuery({
    queryKey: gbrainKeys.taskFiles(taskId),
    queryFn: () => fetchTaskFiles(taskId),
  });

  const updateMut = useMutation({
    mutationFn: (data: UpdateTaskData) => updateKanbanTask(taskId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: gbrainKeys.tasks() });
      void queryClient.invalidateQueries({ queryKey: gbrainKeys.task(taskId) });
    },
  });

  const deleteMut = useMutation({
    mutationFn: () => deleteKanbanTask(taskId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: gbrainKeys.tasks() });
      onBack();
    },
  });

  const dispatchMut = useMutation({
    mutationFn: () => dispatchTask(taskId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: gbrainKeys.tasks() });
    },
  });

  const commentMut = useMutation({
    mutationFn: (body: string) => addTaskComment(taskId, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: gbrainKeys.task(taskId) });
      setComment('');
    },
  });

  const handleRun = async (): Promise<void> => {
    await updateMut.mutateAsync({ status: 'ready', assignee: 'default' });
    dispatchMut.mutate();
  };

  if (isLoading || !detail) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  const t = detail.task;
  const col = mapStatus(t);
  const agentProfile = PROFILES.find((p) => p.id === t.assignee) ?? null;
  const resultText = t.result ?? (detail.runs.length > 0 ? detail.runs[0]?.summary : null);
  const errorText = detail.runs.length > 0 ? detail.runs[0]?.error : null;
  // Show started time for running tasks
  const startedLabel = t.started_at ? formatTime(t.started_at) : '';
  const isPromptLong =
    (t.body?.split('\n').length ?? 0) > PROMPT_CLAMP_LINES || (t.body?.length ?? 0) > PROMPT_CLAMP_CHARS;

  // Right-rail timeline — lifecycle events derived strictly from task data
  interface TimelineEvent {
    icon: typeof Clock;
    label: string;
    time?: string;
    sub?: string;
  }
  const timeline: TimelineEvent[] = [
    { icon: Clock, label: 'Created', time: formatTime(t.created_at), sub: t.created_by ? `by ${t.created_by}` : undefined },
    ...(t.started_at ? [{ icon: Play, label: 'Started', time: formatTime(t.started_at) }] : []),
    ...(taskFiles.length > 0
      ? [{ icon: FileText, label: 'Files produced', time: String(taskFiles.length) }]
      : []),
    ...(col === 'failed' && detail.runs[0]?.ended_at
      ? [{ icon: XCircle, label: 'Failed', time: formatTime(detail.runs[0].ended_at) }]
      : []),
    ...(t.completed_at ? [{ icon: CheckCircle, label: 'Completed', time: formatTime(t.completed_at) }] : []),
  ];

  return (
    <div className="space-y-4 animate-fadeInUp">
      {/* Detail header — app-wide pattern: back button + title + CTA, rest below */}
      <PageHeader
        title={t.title}
        onBack={onBack}
        badges={
          <Badge variant={COLUMN_CONFIG[col].badgeVariant}>
            {COLUMN_CONFIG[col].label}
          </Badge>
        }
        actions={
          <>
            <Button
              variant="outline-destructive"
              size="sm"
              onClick={() => deleteMut.mutate()}
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
            </Button>
            {col !== 'done' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateMut.mutate({ status: 'done' })}
              >
                <CheckCircle className="w-3.5 h-3.5 mr-1" /> Mark Done
              </Button>
            )}
            {col === 'running' && (
              <Button
                size="sm"
                variant="outline"
                className="text-red-600 border-red-200"
                onClick={() => updateMut.mutate({ status: 'blocked' })}
              >
                <Square className="w-3.5 h-3.5 mr-1" /> Stop
              </Button>
            )}
            {col !== 'running' && col !== 'done' && (
              <Button size="sm" onClick={() => void handleRun()}>
                {col === 'failed' ? (
                  <RotateCcw className="w-3.5 h-3.5 mr-1" />
                ) : (
                  <Play className="w-3.5 h-3.5 mr-1" />
                )}
                {col === 'failed' ? 'Retry' : 'Run Now'}
              </Button>
            )}
          </>
        }
      />

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Main column \u2014 outcome first, then prompt, session log, comments */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Running progress hint */}
          {col === 'running' && (
            <Card className="p-3 border-amber-200 bg-amber-50">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-amber-600 animate-spin shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Working on it...</p>
                  <p className="text-xs text-amber-600 mt-0.5">
                    Research and PDF generation tasks typically take 3-8 minutes. The page auto-refreshes every 5 seconds.
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Result */}
          {resultText && (
            <Card className="p-4">
              <p className="text-xs font-medium text-gray-500 uppercase mb-2">Result</p>
              <div className="text-sm text-green-800 bg-green-50 border border-green-200 rounded-lg p-4 whitespace-pre-wrap">
                {resultText}
              </div>
            </Card>
          )}

          {/* Error */}
          {errorText && (
            <Card className="p-4">
              <p className="text-xs font-medium text-red-500 uppercase mb-2">Error</p>
              <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-4 whitespace-pre-wrap">
                {errorText}
              </div>
            </Card>
          )}

          {/* Results (files) */}
          {taskFiles.length > 0 && (
            <Card className="p-4">
              <p className="text-xs font-medium text-gray-500 uppercase mb-2">Results</p>
              <div className="space-y-2">
                {taskFiles.map((f, i) => {
                  const ext = f.name.split('.').pop()?.toLowerCase() ?? '';
                  return (
                    <div key={i} className="flex items-center gap-3 border border-gray-200 rounded-lg p-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center shrink-0">
                        <span className="text-[9px] text-primary font-mono uppercase">{ext}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 truncate">{f.name}</p>
                        <p className="text-xs text-gray-400">{(f.size / 1024).toFixed(1)} KB</p>
                      </div>
                      <a
                        href={gbrainUrl(f.path.replace(/^\/api\//, '/api/gbrain/'))}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary-700 bg-primary/5 px-3 py-1.5 rounded-lg shrink-0"
                      >
                        <FileText className="w-3 h-3" />
                        {['md', 'txt', 'csv', 'json', 'html'].includes(ext) ? 'View' : 'Download'}
                      </a>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Prompt */}
          {t.body && (
            <Card className="p-4">
              <div className="mb-2 flex items-center">
                <p className="text-xs font-medium text-gray-500 uppercase">Prompt</p>
                <button
                  type="button"
                  onClick={() => {
                    if (!t.body) return;
                    void navigator.clipboard.writeText(t.body);
                    setPromptCopied(true);
                    setTimeout(() => setPromptCopied(false), COPY_FEEDBACK_MS);
                  }}
                  aria-label="Copy prompt"
                  className="ml-auto rounded-sm p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus-kb:ring-2 focus-kb:ring-primary"
                >
                  {promptCopied ? (
                    <Check className="w-3.5 h-3.5 text-green-600" aria-hidden />
                  ) : (
                    <Copy className="w-3.5 h-3.5" aria-hidden />
                  )}
                </button>
              </div>
              <div
                className={cn(
                  'text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-lg p-4 border border-gray-200',
                  isPromptLong && !promptExpanded && 'line-clamp-[20]',
                )}
              >
                {t.body}
              </div>
              {isPromptLong && (
                <button
                  type="button"
                  onClick={() => setPromptExpanded(!promptExpanded)}
                  aria-expanded={promptExpanded}
                  className="mt-2 flex items-center gap-1 rounded-sm text-xs font-medium text-primary hover:underline focus-visible:outline-none focus-kb:ring-2 focus-kb:ring-primary"
                >
                  {promptExpanded ? (
                    <ChevronDown className="w-3 h-3" aria-hidden />
                  ) : (
                    <ChevronRight className="w-3 h-3" aria-hidden />
                  )}
                  {promptExpanded ? 'Show less' : 'Show full prompt'}
                </button>
              )}
            </Card>
          )}

          {/* Session Log */}
          <TaskSessionLog taskId={taskId} isRunning={col === 'running'} />

      {/* Comments */}
      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <p className="text-sm font-semibold text-gray-900">
            Comments ({detail.comments.length})
          </p>
        </div>
        <div className="p-4 space-y-3">
          {detail.comments.map((c) => (
            <div key={c.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-primary font-medium">{c.author}</span>
                <span className="text-[10px] text-gray-400">{formatTime(c.created_at)}</span>
              </div>
              <p className="text-sm text-gray-700">{c.body}</p>
            </div>
          ))}
          <div className="flex gap-2">
            {/* eslint-disable-next-line no-restricted-syntax -- comment input needs inline styling within card context */}
            <input
              className="h-11 flex-1 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus-kb:ring-2 focus-kb:ring-primary/20 focus-kb:border-primary transition"
              placeholder="Add a comment..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && comment.trim()) {
                  commentMut.mutate(comment);
                }
              }}
              aria-label="Add comment"
            />
            <Button
              onClick={() => comment.trim() && commentMut.mutate(comment)}
              disabled={!comment.trim()}
              aria-label="Send comment"
              className="h-11 min-h-[44px]"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
        </div>

        {/* Right rail — details, timeline, files, run history */}
        <div className="w-full lg:w-80 shrink-0 space-y-4">
          {/* Details */}
          <Card className="p-4 space-y-3">
            <p className="text-xs font-medium text-gray-500 uppercase">Details</p>
            {col === 'running' && startedLabel && (
              <p className="text-xs text-gray-500">
                Started {startedLabel}
                <span className="text-gray-400 ml-1">(typically 3-8 min for research tasks)</span>
              </p>
            )}
            <dl className="space-y-2 text-sm">
              <div className="group flex items-center gap-3">
                <dt className="flex shrink-0 items-center gap-1.5 text-gray-500">
                  <Hash className="w-3.5 h-3.5 text-gray-400" aria-hidden />
                  Task ID
                </dt>
                <dd className="relative ml-auto min-w-0">
                  <span className="block truncate font-mono text-xs text-gray-500">{t.id}</span>
                  {/* Copy overlays the value's right edge on hover (SkillPill pattern) —
                      gradient ramp so the id can't ghost through the glyph, no space reserved */}
                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard.writeText(t.id);
                      setIdCopied(true);
                      setTimeout(() => setIdCopied(false), COPY_FEEDBACK_MS);
                    }}
                    aria-label="Copy task ID"
                    className="absolute inset-y-0 right-0 flex items-stretch text-gray-400 opacity-0 transition-opacity hover:text-gray-600 focus:outline-none focus-kb:ring-2 focus-kb:ring-primary group-hover:opacity-100 touch:opacity-100 focus-kb:opacity-100"
                  >
                    <span aria-hidden className="w-4 bg-gradient-to-r from-transparent to-white" />
                    <span className="flex items-center bg-white">
                      {idCopied ? (
                        <Check className="w-3.5 h-3.5 text-green-600" aria-hidden />
                      ) : (
                        <Copy className="w-3.5 h-3.5" aria-hidden />
                      )}
                    </span>
                  </button>
                </dd>
              </div>
              {t.assignee && (
                <div className="flex items-center gap-3">
                  <dt className="flex shrink-0 items-center gap-1.5 text-gray-500">
                    <Bot className="w-3.5 h-3.5 text-gray-400" aria-hidden />
                    Agent
                  </dt>
                  <dd className="ml-auto">
                    {agentProfile ? (
                      <HoverCard
                        title="Agent"
                        trigger={
                          <Badge variant="primary" className="cursor-help">@{t.assignee}</Badge>
                        }
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-gray-50">
                            <agentProfile.icon className="w-5 h-5 text-gray-500" aria-hidden />
                          </div>
                          <div className="min-w-0 pt-0.5">
                            <p className="truncate text-sm font-medium text-gray-900">{agentProfile.label}</p>
                            <p className="mt-1 text-xs leading-relaxed text-gray-500">{agentProfile.desc}</p>
                          </div>
                        </div>
                      </HoverCard>
                    ) : (
                      <Badge variant="primary">@{t.assignee}</Badge>
                    )}
                  </dd>
                </div>
              )}
              <div className="flex items-center gap-3">
                <dt className="flex shrink-0 items-center gap-1.5 text-gray-500">
                  <Clock className="w-3.5 h-3.5 text-gray-400" aria-hidden />
                  Created on
                </dt>
                <dd className="ml-auto text-gray-900">{formatTime(t.created_at)}</dd>
              </div>
              {t.started_at ? (
                <div className="flex items-center gap-3">
                  <dt className="flex shrink-0 items-center gap-1.5 text-gray-500">
                    <Play className="w-3.5 h-3.5 text-gray-400" aria-hidden />
                    Started on
                  </dt>
                  <dd className="ml-auto text-gray-900">{formatTime(t.started_at)}</dd>
                </div>
              ) : null}
              {t.completed_at ? (
                <div className="flex items-center gap-3">
                  <dt className="flex shrink-0 items-center gap-1.5 text-gray-500">
                    <CheckCircle className="w-3.5 h-3.5 text-gray-400" aria-hidden />
                    Completed on
                  </dt>
                  <dd className="ml-auto text-gray-900">{formatTime(t.completed_at)}</dd>
                </div>
              ) : null}
              <div className="flex items-center gap-3">
                <dt className="flex shrink-0 items-center gap-1.5 text-gray-500">
                  <User className="w-3.5 h-3.5 text-gray-400" aria-hidden />
                  Created by
                </dt>
                <dd className="ml-auto text-gray-900">{t.created_by ?? '-'}</dd>
              </div>
            </dl>
          </Card>

          {/* Timeline */}
          <Card className="p-4">
            <p className="text-xs font-medium text-gray-500 uppercase mb-3">Timeline</p>
            <ol className="space-y-3">
              {timeline.map((e) => (
                <li key={e.label} className="flex items-center gap-3">
                  {/* 36px tile = label line (20px) + support line (16px), so the icon
                      spans the full text block and reads optically centered */}
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-50 border border-gray-200">
                    <e.icon className="w-4 h-4 text-gray-500" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm text-gray-900">{e.label}</p>
                    {(e.time ?? e.sub) && (
                      <p className="text-xs text-gray-500">
                        {e.time}
                        {e.sub ? ` · ${e.sub}` : ''}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </Card>

          {/* Run History */}
          {detail.runs.length > 0 && (
            <Card className="overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200">
                <p className="text-sm font-semibold text-gray-900">
                  Run History ({detail.runs.length})
                </p>
              </div>
              <div className="divide-y divide-gray-100">
                {detail.runs.map((r) => (
                  <div key={r.id} className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={
                          r.outcome === 'completed' ? 'success'
                            : r.status === 'running' ? 'warning'
                              : 'error'
                        }
                        size="sm"
                      >
                        {r.outcome ?? r.status}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {formatTime(r.started_at)}
                        {r.ended_at ? ` → ${formatTime(r.ended_at)}` : ' (in progress)'}
                      </span>
                    </div>
                    {r.summary && (
                      <p className="text-xs text-gray-600 mt-2 whitespace-pre-wrap">{r.summary}</p>
                    )}
                    {r.error && (
                      <p className="text-xs text-red-500 mt-2 whitespace-pre-wrap">{r.error}</p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Launch Dialog ──────────────────────────────────────────────────────────

const PROFILES = [
  { id: 'default', label: 'General Assistant', desc: 'Handle wide-ranging business tasks', icon: Bot },
  { id: 'design-agent', label: 'Design Agent', desc: 'Style bank, design briefs, trend analysis', icon: Wand2 },
  { id: 'costing-agent', label: 'Costing Agent', desc: 'BOM costing, techpack generation, pricing', icon: BarChart3 },
  { id: 'data-agent', label: 'Research Agent', desc: 'Market data, competitor analysis, reports', icon: Brain },
] as const;

function LaunchDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}): React.ReactNode {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [profile, setProfile] = useState('default');
  const [files, setFiles] = useState<File[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const launchMut = useMutation({
    mutationFn: async () => {
      let taskBody = body;
      if (files.length > 0) {
        const filePaths = await uploadFiles(files);
        taskBody += `\n\nAttached files:\n${filePaths.join('\n')}`;
      }
      const result = await launchKanbanTask({
        title,
        body: taskBody || undefined,
        assignee: profile,
        auto_dispatch: true,
      });
      try {
        await dispatchTask(result.id);
      } catch {
        // dispatch will be picked up by the next sweep
      }
      return result;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: gbrainKeys.tasks() });
      onOpenChange(false);
      setTitle('');
      setBody('');
      setFiles([]);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* flex column capped to the viewport: header + footer stay pinned,
          only the form body scrolls (min-h-0 lets the flex child shrink) */}
      <DialogContent className="flex max-h-[85dvh] max-w-lg flex-col">
        <DialogHeader>
          <DialogTitle>
            <span className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" /> Run
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto py-2">
          <p className="text-xs text-gray-500">
            Describe what you need done. It starts immediately.
          </p>

          <div>
            <Label htmlFor="launch-title">What needs to be done?</Label>
            <Input
              id="launch-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Research competitors, Generate report..."
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="launch-body">Details (optional)</Label>
            <Textarea
              id="launch-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Additional context..."
              className="mt-1"
              rows={3}
            />
          </div>

          <div>
            <Label>Assign to Agent</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {PROFILES.map((p) => {
                const AgentIcon = p.icon;
                const isSelected = profile === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setProfile(p.id)}
                    className={cn(
                      'flex items-start gap-3 p-3 rounded-lg border transition text-left min-h-[44px]',
                      isSelected
                        ? 'bg-primary/5 border-primary/30 ring-1 ring-primary/20'
                        : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50',
                    )}
                    type="button"
                  >
                    <div className={cn(
                      'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
                      isSelected ? 'bg-primary/10' : 'bg-gray-100',
                    )}>
                      <AgentIcon className={cn('w-4.5 h-4.5', isSelected ? 'text-primary' : 'text-gray-500')} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={cn('text-sm font-medium', isSelected ? 'text-primary' : 'text-gray-900')}>
                        {p.label}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{p.desc}</p>
                    </div>
                    {isSelected && (
                      <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <Label>Attach Files</Label>
            {/* eslint-disable-next-line no-restricted-syntax -- file input is hidden, not user-visible */}
            <input
              ref={fileRef}
              type="file"
              accept="image/*,.pdf,.zip,.doc,.docx"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files) setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
              }}
            />
            <div
              onClick={() => fileRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') fileRef.current?.click();
              }}
              role="button"
              tabIndex={0}
              aria-label="Attach files"
              className="mt-1 border-2 border-dashed border-gray-200 rounded-lg p-4 text-center cursor-pointer hover:border-primary/30 transition"
            >
              {files.length === 0 ? (
                <div className="flex flex-col items-center gap-1.5">
                  <Upload className="w-5 h-5 text-gray-400" />
                  <p className="text-xs text-gray-500">Drop files here or click to browse</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 justify-center">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5">
                      <FileText className="w-3.5 h-3.5 text-primary" />
                      <span className="text-xs text-gray-700 truncate max-w-[100px]">{f.name}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setFiles((prev) => prev.filter((_, j) => j !== i));
                        }}
                        className="text-gray-400 hover:text-red-500"
                        aria-label={`Remove ${f.name}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!title.trim() || launchMut.isPending}
            onClick={() => launchMut.mutate()}
          >
            {launchMut.isPending ? (
              <Spinner size="sm" className="mr-1" />
            ) : (
              <Zap className="w-3.5 h-3.5 mr-1" />
            )}
            Launch{files.length > 0 ? ` (${files.length} files)` : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export function VirtualTeamPage(): React.ReactNode {
  const queryClient = useQueryClient();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [launchOpen, setLaunchOpen] = useState(false);

  const {
    data: tasks,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: gbrainKeys.tasks(),
    queryFn: () => fetchKanbanTasks(),
    refetchInterval: 5_000,
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTaskData }) =>
      updateKanbanTask(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: gbrainKeys.tasks() });
    },
  });

  const dispatchMut = useMutation({
    mutationFn: dispatchTask,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: gbrainKeys.tasks() });
    },
  });

  const handleRunTask = async (taskId: string): Promise<void> => {
    // Ensure task is ready + assigned, then dispatch
    try {
      await updateMut.mutateAsync({ id: taskId, data: { status: 'ready', assignee: 'default' } });
    } catch {
      // Task might already be in ready state — continue to dispatch
    }
    dispatchMut.mutate(taskId);
  };

  const handleStopTask = (taskId: string): void => {
    updateMut.mutate({ id: taskId, data: { status: 'blocked' } });
  };

  // Detail view
  if (selectedTaskId) {
    return (
      <TaskDetailView
        taskId={selectedTaskId}
        onBack={() => setSelectedTaskId(null)}
      />
    );
  }

  const taskList = tasks ?? [];

  // Group by mapped status
  const byStatus = new Map<Column, KanbanTask[]>();
  for (const col of COLUMNS) byStatus.set(col, []);
  for (const t of taskList) {
    const col = mapStatus(t);
    byStatus.get(col)!.push(t);
  }

  const counts = {
    total: taskList.length,
    ready: byStatus.get('ready')!.length,
    running: byStatus.get('running')!.length,
    done: byStatus.get('done')!.length,
    failed: byStatus.get('failed')!.length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={XCircle}
        title="Failed to load tasks"
        description="Could not connect to the Agentic Brain backend."
        action={
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Retry
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-4 animate-fadeInUp">
      {/* Title bar — menu name + CTAs on the right */}
      <PageHeader
        title="Operations"
        actions={
          <Button size="sm" onClick={() => setLaunchOpen(true)}>
            <Zap className="w-3.5 h-3.5 mr-1" /> Run
          </Button>
        }
      />

      {/* Summary KPIs */}
      <MetricGrid columns={5}>
        <MetricCard label="Total" value={counts.total} icon={Activity} iconColor="info" />
        <MetricCard label="Ready" value={counts.ready} icon={Clock} iconColor="info" />
        <MetricCard label="Running" value={counts.running} icon={Play} iconColor="warning" />
        <MetricCard label="Done" value={counts.done} icon={CheckCircle} iconColor="success" />
        <MetricCard label="Failed" value={counts.failed} icon={XCircle} iconColor="error" />
      </MetricGrid>

      {/* Kanban Board */}
      {taskList.length === 0 ? (
        <EmptyState
          icon={Zap}
          title="No tasks yet"
          description="Click Run to get started."
          action={
            <Button size="sm" onClick={() => setLaunchOpen(true)}>
              <Zap className="w-3.5 h-3.5 mr-1" /> Run
            </Button>
          }
        />
      ) : (
        <MetricGrid columns={4}>
          {COLUMNS.map((col) => {
            const cfg = COLUMN_CONFIG[col];
            const colTasks = byStatus.get(col) ?? [];
            return (
              <Card key={col} className="overflow-hidden">
                <div className="px-3 py-2.5 border-b border-gray-200 bg-gray-50">
                  <SectionHeader
                    title={
                      <span className="flex items-center gap-2">
                        {cfg.label}
                        <Badge variant={cfg.badgeVariant} size="sm">{colTasks.length}</Badge>
                      </span>
                    }
                    className="mb-0"
                  />
                </div>
                <div className="p-3 space-y-2 min-h-[120px] max-h-[60vh] overflow-y-auto">
                  {colTasks.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-6">No tasks</p>
                  ) : (
                    colTasks.map((t) => (
                      <TaskCard
                        key={t.id}
                        task={t}
                        onClick={() => setSelectedTaskId(t.id)}
                        onRun={() => void handleRunTask(t.id)}
                        onStop={() => handleStopTask(t.id)}
                        hasRunningTask={counts.running > 0}
                      />
                    ))
                  )}
                </div>
              </Card>
            );
          })}
        </MetricGrid>
      )}

      {/* Launch dialog */}
      <LaunchDialog open={launchOpen} onOpenChange={setLaunchOpen} />
    </div>
  );
}
