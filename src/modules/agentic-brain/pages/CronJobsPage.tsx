import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Clock, Play, Trash2, RefreshCw, XCircle, Plus, ChevronDown, ChevronRight, History } from 'lucide-react';
import { useState } from 'react';
import {
  Card,
  Badge,
  Button,
  SectionHeader,
  Spinner,
  EmptyState,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Input,
  Textarea,
  Label,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui';
import { cn } from '@/lib/utils';
import {
  fetchCronJobs,
  createCronJob,
  deleteCronJob,
  runCronJob,
  gbrainKeys,
} from '../api/agenticBrainApi';
import type { CronJob } from '../data/agenticBrainTypes';

// ─── Frequency helpers ──────────────────────────────────────────────────────

const FREQUENCIES = [
  { id: 'once-daily', label: 'Daily' },
  { id: 'weekdays', label: 'Weekdays' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'minutes', label: 'Every N mins' },
  { id: 'hourly', label: 'Every N hours' },
] as const;

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const MINUTES = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0'));
const MINUTE_INTERVALS = ['1', '2', '3', '5', '10', '15', '20', '30'];
const HOUR_INTERVALS = ['1', '2', '3', '4', '6', '8', '12'];

function buildCron(freq: string, hour: string, minute: string, day: string, interval: string): string {
  const h = parseInt(hour) || 7;
  const m = parseInt(minute) || 0;
  // IST to UTC: subtract 5:30
  let utcH = h - 5;
  let utcM = m - 30;
  if (utcM < 0) { utcM += 60; utcH -= 1; }
  if (utcH < 0) utcH += 24;
  switch (freq) {
    case 'once-daily': return `${utcM} ${utcH} * * *`;
    case 'weekdays': return `${utcM} ${utcH} * * 1-5`;
    case 'weekly': {
      const d = DAYS.indexOf(day) + 1;
      return `${utcM} ${utcH} * * ${d === 7 ? 0 : d}`;
    }
    case 'minutes': return `*/${parseInt(interval) || 5} * * * *`;
    case 'hourly': return `0 */${parseInt(interval) || 6} * * *`;
    default: return `${utcM} ${utcH} * * *`;
  }
}

function formatScheduleIST(cron: string): string {
  const parts = cron.split(' ');
  if (parts.length !== 5) return cron;
  const [min, hour, , , dow] = parts;
  if (min?.includes('/')) return `Every ${min.replace('*/', '')} minutes`;
  if (hour?.includes('/')) return `Every ${hour.replace('*/', '')} hours`;
  const utcH = parseInt(hour ?? '0');
  const utcM = parseInt(min ?? '0');
  if (isNaN(utcH)) return cron;
  let istH = utcH + 5;
  let istM = utcM + 30;
  if (istM >= 60) { istM -= 60; istH += 1; }
  if (istH >= 24) istH -= 24;
  const t = `${istH.toString().padStart(2, '0')}:${istM.toString().padStart(2, '0')} IST`;
  if (dow === '*') return `Daily at ${t}`;
  if (dow === '1-5') return `Weekdays at ${t}`;
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayIdx = parseInt(dow ?? '0');
  if (!isNaN(dayIdx)) return `Every ${dayNames[dayIdx]} at ${t}`;
  return `${t} (${cron})`;
}

// ─── Cron Job Card ──────────────────────────────────────────────────────────

function CronJobCard({
  job,
  onRun,
  onDelete,
  runPending,
  deletePending,
}: {
  job: CronJob;
  onRun: () => void;
  onDelete: () => void;
  runPending: boolean;
  deletePending: boolean;
}): React.ReactNode {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 transition-colors min-h-[44px]"
        aria-expanded={expanded}
        aria-label={`Cron job: ${job.name}`}
      >
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900">{job.name}</h4>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-primary">{formatScheduleIST(job.schedule)}</span>
            <span className="text-xs text-gray-400 font-mono">{job.schedule}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => { e.stopPropagation(); onRun(); }}
            disabled={runPending}
          >
            <Play className="w-3 h-3 mr-1" />
            Run
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            disabled={deletePending}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </button>

      {expanded && (() => {
        // Parse task from YAML content (format: task: "...")
        const taskMatch = job.content.match(/task:\s*"([^"]+)"/);
        const taskText = taskMatch?.[1] ?? job.content;
        const createdMatch = job.content.match(/created:\s*(\S+)/);
        const created = createdMatch?.[1] ?? '';
        return (
          <div className="border-t border-gray-100 p-4 bg-gray-50 space-y-3">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase mb-1">Task</p>
              <p className="text-sm text-gray-900">{taskText}</p>
            </div>
            {created && (
              <p className="text-xs text-gray-400">Created: {new Date(created).toLocaleString()}</p>
            )}
            <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-white rounded-lg px-3 py-2 border border-gray-200">
              <History className="w-3.5 h-3.5" />
              Output appears in <a href="/agents-brain/sessions" className="text-primary hover:underline font-medium">Activity Log</a> after each run.
            </div>
          </div>
        );
      })()}
    </Card>
  );
}

// ─── Create Dialog ──────────────────────────────────────────────────────────

function CreateCronDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}): React.ReactNode {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [task, setTask] = useState('');
  const [frequency, setFrequency] = useState('once-daily');
  const [hour, setHour] = useState('09');
  const [minute, setMinute] = useState('00');
  const [day, setDay] = useState('Monday');
  const [interval, setIntervalVal] = useState('5');

  const cronPreview = buildCron(frequency, hour, minute, day, interval);
  const scheduleLabel = formatScheduleIST(cronPreview);
  const showTimePicker = frequency !== 'minutes' && frequency !== 'hourly';

  const createMut = useMutation({
    mutationFn: () => createCronJob({ name, schedule: cronPreview, content: task }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: gbrainKeys.cronJobs() });
      onOpenChange(false);
      setName('');
      setTask('');
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Schedule a Run</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Job Name */}
          <div>
            <Label htmlFor="cron-name">Job Name</Label>
            <Input
              id="cron-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="daily-report"
              className="mt-1"
            />
          </div>

          {/* Frequency */}
          <div>
            <Label>Frequency</Label>
            <div className="flex gap-2 flex-wrap mt-1">
              {FREQUENCIES.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFrequency(f.id)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs border transition min-h-[36px]',
                    frequency === f.id
                      ? 'bg-primary/5 border-primary/30 text-primary font-medium'
                      : 'bg-white border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300',
                  )}
                  type="button"
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Time picker (IST) */}
          {showTimePicker && (
            <div>
              <Label>Time (IST)</Label>
              <div className="flex gap-2 items-center mt-1">
                <Select value={hour} onValueChange={setHour}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HOURS.map((h) => (
                      <SelectItem key={h} value={h}>{h}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-gray-500 font-medium">:</span>
                <Select value={minute} onValueChange={setMinute}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MINUTES.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-xs text-gray-500">IST</span>
              </div>
            </div>
          )}

          {/* Day picker (weekly) */}
          {frequency === 'weekly' && (
            <div>
              <Label>Day</Label>
              <Select value={day} onValueChange={setDay}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Minutes interval */}
          {frequency === 'minutes' && (
            <div>
              <Label>Every N minutes</Label>
              <Select value={interval} onValueChange={setIntervalVal}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MINUTE_INTERVALS.map((n) => (
                    <SelectItem key={n} value={n}>Every {n} min{n !== '1' ? 's' : ''}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Hours interval */}
          {frequency === 'hourly' && (
            <div>
              <Label>Every N hours</Label>
              <Select value={interval} onValueChange={setIntervalVal}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HOUR_INTERVALS.map((n) => (
                    <SelectItem key={n} value={n}>Every {n} hr{n !== '1' ? 's' : ''}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Task description */}
          <div>
            <Label htmlFor="cron-task">Task Description</Label>
            <Textarea
              id="cron-task"
              value={task}
              onChange={(e) => setTask(e.target.value)}
              placeholder="Search web for latest FYND news, summarize in 5 bullets"
              className="mt-1"
              rows={3}
            />
          </div>

          {/* Preview */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
            <p className="text-xs text-gray-500">Preview:</p>
            <p className="text-sm text-primary font-medium">{scheduleLabel}</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={() => createMut.mutate()}
            disabled={!name.trim() || !task.trim() || createMut.isPending}
          >
            {createMut.isPending ? <Spinner size="sm" className="mr-1" /> : null}
            Schedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export function CronJobsPage({
  createDialogOpen,
  onCreateDialogOpenChange,
}: {
  /** When provided, the create dialog is controlled by the parent (which also
      renders the "Schedule New" CTA in its own title bar) and the internal
      section-header action is hidden. Standalone route usage stays unchanged. */
  createDialogOpen?: boolean;
  onCreateDialogOpenChange?: (open: boolean) => void;
} = {}): React.ReactNode {
  const queryClient = useQueryClient();
  const [internalDialogOpen, setInternalDialogOpen] = useState(false);
  const isDialogControlled = createDialogOpen !== undefined;
  const dialogOpen = isDialogControlled ? createDialogOpen : internalDialogOpen;
  const setDialogOpen = (open: boolean): void => {
    if (isDialogControlled) onCreateDialogOpenChange?.(open);
    else setInternalDialogOpen(open);
  };

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: gbrainKeys.cronJobs(),
    queryFn: fetchCronJobs,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCronJob,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: gbrainKeys.cronJobs() });
    },
  });

  const runMutation = useMutation({
    mutationFn: runCronJob,
  });

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
        title="Failed to load cron jobs"
        description="Could not connect to the Agentic Brain backend."
        action={
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Retry
          </Button>
        }
      />
    );
  }

  const jobs: CronJob[] = data?.jobs ?? [];

  return (
    <div className="space-y-4 animate-fadeInUp">
      <SectionHeader
        title={
          <span className="flex items-center gap-2">
            Scheduled Runs
            <Badge variant="default" size="sm">{jobs.length}</Badge>
          </span>
        }
        actions={
          isDialogControlled ? undefined : (
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Schedule New
            </Button>
          )
        }
      />

      {jobs.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="No scheduled runs"
          description="Schedule a recurring run to automate tasks."
          action={
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Schedule
            </Button>
          }
        />
      ) : (
        <div className="space-y-2">
          {jobs.map((job) => (
            <CronJobCard
              key={job.name}
              job={job}
              onRun={() => runMutation.mutate(job.name)}
              onDelete={() => deleteMutation.mutate(job.name)}
              runPending={runMutation.isPending}
              deletePending={deleteMutation.isPending}
            />
          ))}
        </div>
      )}

      <CreateCronDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
