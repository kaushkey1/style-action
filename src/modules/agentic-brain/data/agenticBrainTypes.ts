/**
 * TypeScript Types for Agentic Brain API
 * Ported from costing-ui gbrain-types.ts — adapted for strict TS (no `any`)
 */

// ─── Health ─────────────────────────────────────────────────────────────────

export interface GBrainHealth {
  status: string;
  vm: {
    nanoclaw: string;
    ollama: string;
    onecli: string;
    whatsapp: string;
  } | null;
}

// ─── Search ─────────────────────────────────────────────────────────────────

export interface SearchResult {
  title: string;
  content: string;
  category?: string;
  score?: number;
  source?: string;
  /** CDN URL of the original ingested document (PDF, etc.) */
  doc_url?: string;
}

export interface SearchResponse {
  results: SearchResult[];
  query: string;
  mode: string;
  count: number;
}

export type SearchMode = 'hybrid' | 'vector' | 'keyword';

// ─── Knowledge Graph ────────────────────────────────────────────────────────

export interface GraphNode {
  id: string;
  label: string;
  type: string;
  depth: number;
}

export interface GraphEdge {
  from: string;
  to: string;
  type: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  root: string;
}

// ─── Kanban / Virtual Team ──────────────────────────────────────────────────

export interface KanbanTask {
  id: string;
  title: string;
  body: string | null;
  assignee: string | null;
  status: string;
  priority: number;
  created_by: string | null;
  created_at: number;
  started_at: number | null;
  completed_at: number | null;
  result: string | null;
  skills: string | null;
  consecutive_failures: number;
}

export interface TaskComment {
  id: number;
  task_id: string;
  author: string;
  body: string;
  created_at: number;
}

export interface TaskEvent {
  id: number;
  kind: string;
  payload: string | null;
  created_at: number;
}

export interface TaskRun {
  id: number;
  task_id: string;
  status: string;
  started_at: number;
  ended_at: number | null;
  outcome: string | null;
  summary: string | null;
  error: string | null;
}

export interface TaskDetail {
  task: KanbanTask;
  comments: TaskComment[];
  events: TaskEvent[];
  runs: TaskRun[];
}

export interface TaskFile {
  name: string;
  size: number;
  path: string;
}

export interface CreateTaskData {
  title: string;
  body?: string;
  assignee?: string;
  priority?: number;
  skills?: string;
}

export interface UpdateTaskData {
  title?: string;
  body?: string;
  assignee?: string;
  status?: string;
  priority?: number;
  result?: string;
  skills?: string;
}

export interface LaunchTaskData {
  title: string;
  body?: string;
  assignee?: string;
  priority?: number;
  skills?: string;
  auto_dispatch?: boolean;
}

export interface TasksResponse {
  tasks: KanbanTask[];
}

export interface TaskFilesResponse {
  files: TaskFile[];
}

// ─── Chat ───────────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: string;
  content: string;
  timestamp?: number;
}

export interface ChatResponse {
  response: string;
  messages?: ChatMessage[];
  turns?: number;
}

// ─── Wiki ───────────────────────────────────────────────────────────────────

export interface WikiPage {
  path: string;
  name: string;
  category: string;
  modified: string;
  /** "wiki" for real markdown pages; "knowledge-base" for RAG-store index
      entries whose page fetch returns no markdown content. */
  source?: string;
}

export interface WikiPagesResponse {
  pages: WikiPage[];
}

export interface WikiPageContent {
  path: string;
  content: string;
  category?: string;
  /** Absent for RAG-store index entries — the backend omits it with empty content. */
  modified?: string;
}

// ─── Skills ─────────────────────────────────────────────────────────────────

export interface Skill {
  name: string;
  category: string;
  path: string;
  /** Optional status for planned/community skills not yet on the backend */
  source?: 'backend' | 'planned' | 'community';
  description?: string;
}

export interface SkillsResponse {
  skills: Skill[];
}

export interface SkillDetail {
  name: string;
  category: string;
  path: string;
  content: string;
  config?: Record<string, unknown>;
}

// ─── Cron ───────────────────────────────────────────────────────────────────

export interface CronJob {
  name: string;
  schedule: string;
  content: string;
}

export interface CronJobsResponse {
  jobs: CronJob[];
}

export interface CreateCronJobData {
  name: string;
  schedule: string;
  content: string;
}

export interface UpdateCronJobData {
  schedule?: string;
  content?: string;
}

export interface CronRunResponse {
  status: string;
  job_id?: string;
  message?: string;
}

// ─── Hermes Sessions ────────────────────────────────────────────────────────

export interface HermesStatus {
  version: string;
  gateway_running: boolean;
  active_sessions: number;
  config?: {
    model?: string;
    [key: string]: unknown;
  };
}

export interface HermesSession {
  id: string;
  model?: string;
  started_at?: number;
  ended_at?: number;
  source?: string;
}

export interface SessionsResponse {
  sessions: HermesSession[];
}

export interface SessionMessage {
  id?: number;
  role: string;
  content: string;
  timestamp?: number;
  model?: string;
}

export interface SessionMessagesResponse {
  messages: SessionMessage[];
  session_id: string;
}

// ─── Upload ─────────────────────────────────────────────────────────────────

export interface UploadedFile {
  name: string;
  path: string;
  size: number;
  url?: string;
}

export interface UploadResponse {
  files: UploadedFile[];
}

// ─── Job Status ─────────────────────────────────────────────────────────────

export interface JobStatus {
  id: string;
  status: string;
  progress?: number;
  result?: unknown;
  error?: string;
  created_at?: number;
  completed_at?: number;
}
