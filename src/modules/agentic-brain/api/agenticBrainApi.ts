/**
 * Agentic Brain API — proxied through the SIT FastAPI backend.
 * All endpoints go through: API_BASE_URL + GBRAIN_BASE + /api/gbrain/...
 */

import { ApiService } from '@/lib/api';
import environment from '@/environment';
import type {
  GBrainHealth,
  SearchResponse,
  SearchMode,
  GraphData,
  KanbanTask,
  TaskDetail,
  TasksResponse,
  TaskFile,
  TaskFilesResponse,
  CreateTaskData,
  UpdateTaskData,
  LaunchTaskData,
  ChatResponse,
  WikiPagesResponse,
  WikiPageContent,
  Skill,
  SkillsResponse,
  SkillDetail,
  CronJob,
  CronJobsResponse,
  CreateCronJobData,
  UpdateCronJobData,
  CronRunResponse,
  HermesSession,
  HermesStatus,
  SessionsResponse,
  SessionMessagesResponse,
  UploadResponse,
  JobStatus,
} from '../data/agenticBrainTypes';

// ─── Base URL ───────────────────────────────────────────────────────────────

/** Resolves the gbrain proxy base URL (SIT FastAPI backend). */
export function gbrainUrl(path: string): string {
  const base = environment.GBRAIN_API_BASE_URL;
  // If the configured base is a relative path (starts with /), resolve it
  // against the window origin so ApiService's resolveUrl doesn't prepend the
  // wrong API_BASE_URL and the Vite dev proxy handles CORS.
  if (base.startsWith('/') && typeof window !== 'undefined') {
    return `${window.location.origin}${base}${path}`;
  }
  return `${base}${path}`;
}

const TIMEOUT_CHAT = 180_000; // 3 minutes for chat responses
const TIMEOUT_UPLOAD = 60_000; // 1 minute for file uploads

// ─── Health ─────────────────────────────────────────────────────────────────

export async function fetchGBrainHealth(): Promise<GBrainHealth> {
  const res = await ApiService.get(gbrainUrl('/api/gbrain/health'));
  return res.data;
}

// ─── Search ─────────────────────────────────────────────────────────────────

export async function searchKnowledge(
  query: string,
  limit = 10,
  mode: SearchMode = 'hybrid',
): Promise<SearchResponse> {
  const res = await ApiService.post(gbrainUrl('/api/gbrain/search'), {
    data: { query, limit, mode },
  });
  return res.data;
}

// ─── Knowledge Graph ────────────────────────────────────────────────────────

export async function fetchKnowledgeGraph(
  slug = 'companies/fynd',
  depth = 2,
): Promise<GraphData> {
  const res = await ApiService.get(gbrainUrl('/api/gbrain/graph'), {
    params: { slug, depth },
  });
  return res.data;
}

// ─── Kanban Tasks ───────────────────────────────────────────────────────────

export async function fetchKanbanTasks(status?: string): Promise<KanbanTask[]> {
  const res = await ApiService.get(gbrainUrl('/api/gbrain/kanban/tasks'), {
    params: status ? { status } : {},
  });
  const data = res.data as TasksResponse;
  return data.tasks;
}

export async function fetchKanbanTask(id: string): Promise<TaskDetail> {
  const res = await ApiService.get(gbrainUrl(`/api/gbrain/kanban/tasks/${id}`));
  return res.data as TaskDetail;
}

export async function createKanbanTask(data: CreateTaskData): Promise<KanbanTask> {
  const res = await ApiService.post(gbrainUrl('/api/gbrain/kanban/tasks'), {
    data,
  });
  return res.data as KanbanTask;
}

export async function updateKanbanTask(
  id: string,
  data: UpdateTaskData,
): Promise<void> {
  await ApiService.patch(gbrainUrl(`/api/gbrain/kanban/tasks/${id}`), {
    data,
  });
}

export async function deleteKanbanTask(id: string): Promise<void> {
  await ApiService.del(gbrainUrl(`/api/gbrain/kanban/tasks/${id}`));
}

export async function launchKanbanTask(data: LaunchTaskData): Promise<KanbanTask> {
  const res = await ApiService.post(gbrainUrl('/api/gbrain/kanban/launch'), {
    data,
  });
  return res.data as KanbanTask;
}

export async function dispatchTask(taskId: string): Promise<{ status: string }> {
  const res = await ApiService.post(
    gbrainUrl(`/api/gbrain/kanban/tasks/${taskId}/dispatch`),
  );
  return res.data as { status: string };
}

export async function fetchTaskFiles(taskId: string): Promise<TaskFile[]> {
  const res = await ApiService.get(
    gbrainUrl(`/api/gbrain/kanban/tasks/${taskId}/files`),
  );
  const data = res.data as TaskFilesResponse;
  return data.files;
}

export async function addTaskComment(taskId: string, body: string): Promise<void> {
  await ApiService.post(
    gbrainUrl(`/api/gbrain/kanban/tasks/${taskId}/comments`),
    { data: { body, author: 'dashboard' } },
  );
}

// ─── Chat ───────────────────────────────────────────────────────────────────

export interface ChatFilePayload {
  data: string;       // base64-encoded file content
  mimeType: string;   // e.g. "image/png", "application/pdf"
  name: string;       // original filename
}

/** Convert a browser File to a base64 ChatFilePayload for inline chat upload */
export function fileToChatPayload(file: File): Promise<ChatFilePayload> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip "data:<mime>;base64," prefix
      const base64 = result.split(',')[1] ?? '';
      resolve({ data: base64, mimeType: file.type, name: file.name });
    };
    reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
    reader.readAsDataURL(file);
  });
}

export async function sendGBrainChat(
  text: string,
  maxTurns = 3,
  files?: ChatFilePayload[],
): Promise<ChatResponse> {
  const payload: Record<string, unknown> = { text, maxTurns };
  if (files && files.length > 0) {
    payload.files = files;
  }
  const res = await ApiService.axios({
    method: 'POST',
    url: gbrainUrl('/api/gbrain/chat'),
    data: payload,
    headers: { 'Content-Type': 'application/json' },
  });
  // axios returns { data: ... } — the chat endpoint returns ChatResponse at top level
  return res.data as ChatResponse;
}

// Add a timeout wrapper for chat that can be used by the caller
export { TIMEOUT_CHAT, TIMEOUT_UPLOAD };

// ─── Wiki ───────────────────────────────────────────────────────────────────

export async function fetchWikiPages(group?: string): Promise<WikiPagesResponse> {
  const res = await ApiService.get(gbrainUrl('/api/gbrain/wiki'), {
    params: group ? { group } : {},
  });
  return res.data as WikiPagesResponse;
}

export async function fetchWikiPage(pagePath: string): Promise<WikiPageContent> {
  const res = await ApiService.get(
    gbrainUrl(`/api/gbrain/wiki/${encodeURIComponent(pagePath)}`),
  );
  return res.data as WikiPageContent;
}

export async function updateWikiPage(pagePath: string, content: string): Promise<void> {
  await ApiService.put(
    gbrainUrl(`/api/gbrain/wiki/${encodeURIComponent(pagePath)}`),
    { data: { content } },
  );
}

export async function ingestWikiContent(
  title: string,
  url?: string,
  content?: string,
): Promise<{ success: boolean; message?: string }> {
  const res = await ApiService.post(gbrainUrl('/api/gbrain/wiki/ingest'), {
    data: { title, url, content },
  });
  return res.data as { success: boolean; message?: string };
}

export async function fetchSources(): Promise<
  { name: string; size: number; modified: string }[]
> {
  const res = await ApiService.get(gbrainUrl('/api/gbrain/sources'));
  const data = res.data as { sources: { name: string; size: number; modified: string }[] };
  return data.sources;
}

// ─── Skills ─────────────────────────────────────────────────────────────────

export async function fetchSkills(): Promise<SkillsResponse> {
  const res = await ApiService.get(gbrainUrl('/api/gbrain/skills'));
  // API returns raw array or { skills: [...] } — normalize
  const raw = res.data;
  if (Array.isArray(raw)) return { skills: raw as Skill[] };
  return raw as SkillsResponse;
}

export async function fetchSkill(name: string): Promise<SkillDetail> {
  const res = await ApiService.get(gbrainUrl(`/api/gbrain/skills/${name}`));
  return res.data as SkillDetail;
}

// ─── Skill Manifest & Executions ────────────────────────────────────────────

export interface SkillManifest {
  name: string;
  category: string;
  description: string;
  total_runs: number;
  successful_runs: number;
  failed_runs: number;
  last_run_at: string | null;
  avg_duration_s: number;
  success_rate: number;
}

export interface SkillExecution {
  id: string;
  task_id: string;
  status: 'success' | 'failed';
  started_at: string;
  duration_s: number;
  triggered_by: string;
}

export async function fetchSkillManifest(name: string): Promise<SkillManifest | null> {
  try {
    const res = await ApiService.get(gbrainUrl(`/api/gbrain/skills/${name}/manifest`));
    return res.data as SkillManifest;
  } catch {
    return null;
  }
}

export async function fetchSkillExecutions(name: string): Promise<SkillExecution[]> {
  try {
    const res = await ApiService.get(gbrainUrl(`/api/gbrain/skills/${name}/executions`));
    const raw = res.data;
    if (Array.isArray(raw)) return raw as SkillExecution[];
    return (raw as { executions: SkillExecution[] }).executions ?? [];
  } catch {
    return [];
  }
}

// ─── Task Session (direct endpoint) ─────────────────────────────────────────

export interface TaskSessionResponse {
  session_id: string;
  session: {
    messages: { role: string; content: string }[];
  };
}

export async function fetchTaskSession(taskId: string): Promise<TaskSessionResponse | null> {
  try {
    const res = await ApiService.get(
      gbrainUrl(`/api/gbrain/kanban/tasks/${taskId}/session`),
    );
    return res.data as TaskSessionResponse;
  } catch {
    // 404 = agent hasn't spawned yet, or no session exists
    return null;
  }
}

// ─── Hermes Sessions ────────────────────────────────────────────────────────

export async function fetchHermesStatus(): Promise<HermesStatus | null> {
  try {
    const res = await ApiService.get(gbrainUrl('/api/gbrain/hermes/status'));
    return res.data as HermesStatus;
  } catch {
    return null;
  }
}

export async function fetchHermesSessions(limit = 20): Promise<SessionsResponse> {
  try {
    const res = await ApiService.get(gbrainUrl('/api/gbrain/sessions'), {
      params: { limit },
    });
    const raw = res.data;
    // API may return raw array of { name, modified, size } or { sessions: [...] }
    if (Array.isArray(raw)) {
      const sessions: HermesSession[] = (raw as { name: string; modified: string; size: number }[]).map((f) => ({
        id: f.name.replace('.json', ''),
        started_at: Math.floor(new Date(f.modified).getTime() / 1000),
        source: 'hermes',
      }));
      return { sessions };
    }
    return raw as SessionsResponse;
  } catch {
    return { sessions: [] };
  }
}

export async function fetchSessionMessages(
  id: string,
): Promise<SessionMessagesResponse> {
  try {
    const res = await ApiService.get(
      gbrainUrl(`/api/gbrain/sessions/${id}/messages`),
    );
    return res.data as SessionMessagesResponse;
  } catch {
    return { messages: [], session_id: id };
  }
}

// ─── Cron Jobs ──────────────────────────────────────────────────────────────

export async function fetchCronJobs(): Promise<CronJobsResponse> {
  const res = await ApiService.get(gbrainUrl('/api/gbrain/cron'));
  // API returns raw array or { jobs: [...] } — normalize
  const raw = res.data;
  if (Array.isArray(raw)) return { jobs: raw as CronJob[] };
  return raw as CronJobsResponse;
}

export async function createCronJob(data: CreateCronJobData): Promise<void> {
  // Backend expects { name, schedule, task } — not "content"
  await ApiService.post(gbrainUrl('/api/gbrain/cron'), {
    data: { name: data.name, schedule: data.schedule, task: data.content },
  });
}

export async function updateCronJob(
  name: string,
  data: UpdateCronJobData,
): Promise<void> {
  await ApiService.put(
    gbrainUrl(`/api/gbrain/cron/${name}`),
    { data },
  );
}

export async function deleteCronJob(name: string): Promise<void> {
  await ApiService.del(
    gbrainUrl(`/api/gbrain/cron/${encodeURIComponent(name)}`),
  );
}

export async function runCronJob(name: string): Promise<CronRunResponse> {
  const res = await ApiService.post(
    gbrainUrl(`/api/gbrain/cron/${encodeURIComponent(name)}/run`),
  );
  return res.data as CronRunResponse;
}

// ─── Upload ─────────────────────────────────────────────────────────────────

export async function uploadFiles(files: File[]): Promise<string[]> {
  const formData = new FormData();
  files.forEach((f) => formData.append('files', f));

  const res = await ApiService.axios({
    method: 'POST',
    url: gbrainUrl('/api/gbrain/upload'),
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  const data = res.data as UploadResponse;
  return data.files.map((f) => f.path);
}

export async function uploadWikiFile(file: File, title?: string): Promise<void> {
  const formData = new FormData();
  formData.append('file', file);
  if (title) formData.append('title', title);

  await ApiService.axios({
    method: 'POST',
    url: gbrainUrl('/api/gbrain/wiki/upload'),
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

// ─── Job Status ─────────────────────────────────────────────────────────────

export async function checkJobStatus(jobId: string): Promise<JobStatus> {
  const res = await ApiService.get(gbrainUrl(`/api/gbrain/jobs/${jobId}`));
  return res.data as JobStatus;
}

// ─── Query Key Factory ──────────────────────────────────────────────────────

export const gbrainKeys = {
  all: ['gbrain'] as const,
  health: () => [...gbrainKeys.all, 'health'] as const,
  search: (query: string, mode: SearchMode) =>
    [...gbrainKeys.all, 'search', query, mode] as const,
  graph: (slug: string, depth: number) =>
    [...gbrainKeys.all, 'graph', slug, depth] as const,
  tasks: () => [...gbrainKeys.all, 'tasks'] as const,
  task: (id: string) => [...gbrainKeys.all, 'task', id] as const,
  taskFiles: (id: string) => [...gbrainKeys.all, 'task-files', id] as const,
  taskSession: (id: string) => [...gbrainKeys.all, 'task-session', id] as const,
  wiki: () => [...gbrainKeys.all, 'wiki'] as const,
  wikiPage: (path: string) => [...gbrainKeys.all, 'wiki', path] as const,
  skills: () => [...gbrainKeys.all, 'skills'] as const,
  skill: (name: string) => [...gbrainKeys.all, 'skill', name] as const,
  skillManifest: (name: string) => [...gbrainKeys.all, 'skill-manifest', name] as const,
  skillExecutions: (name: string) => [...gbrainKeys.all, 'skill-executions', name] as const,
  hermes: () => [...gbrainKeys.all, 'hermes'] as const,
  sessions: () => [...gbrainKeys.all, 'sessions'] as const,
  sessionMessages: (id: string) =>
    [...gbrainKeys.all, 'session-messages', id] as const,
  cronJobs: () => [...gbrainKeys.all, 'cron'] as const,
  sources: () => [...gbrainKeys.all, 'sources'] as const,
};
