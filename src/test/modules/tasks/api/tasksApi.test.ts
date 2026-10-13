import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DEFAULT_TASK_FILTERS } from '@/modules/tasks/types/task.types';

const getMock = vi.fn();
const postMock = vi.fn();
const patchMock = vi.fn();

vi.mock('@/lib/api', () => ({
  ApiService: {
    get: (...args: unknown[]) => getMock(...args),
    post: (...args: unknown[]) => postMock(...args),
    patch: (...args: unknown[]) => patchMock(...args),
  },
  IMPETUS_BASE: '/service/public/impetus-agentic/v1.0',
  getImpetusHeaders: () => ({ 'X-Tenant-ID': 'fnl', 'X-Org-ID': 'org-1' }),
}));

// Import AFTER the mock so the api module wires up to the stub.
import {
  listTasks,
  createTask,
  patchTask,
  getTask,
  fetchPendingCount,
} from '@/modules/tasks/api/tasksApi';

const apiTaskFixture = {
  id: '3e059b5e-949d-445d-86e3-98841bd4501c',
  title: 'Investigate margin breach',
  description: 'S2 breach',
  priority: 'critical' as const,
  status: 'open' as const,
  assigned_to: 'bob@fynd.com',
  created_by: 'alice@fynd.com',
  exception_id: 'EXC-1',
  due_date: '2026-06-05T17:00:00Z',
  unread_by_assignee: true,
  subscribers: ['alice@fynd.com', 'bob@fynd.com'],
  created_at: '2026-05-30T08:03:04.812Z',
  updated_at: '2026-05-30T08:03:04.812Z',
};

beforeEach(() => {
  getMock.mockReset();
  postMock.mockReset();
  patchMock.mockReset();
});

describe('tasksApi.listTasks', () => {
  it('does not send assigned_to or created_by params', async () => {
    getMock.mockResolvedValueOnce({ data: { data: [apiTaskFixture] } });
    const tasks = await listTasks({
      tab: 'assigned-to-me',
      filters: DEFAULT_TASK_FILTERS,
      userEmail: 'bob@fynd.com',
    });
    const [, opts] = getMock.mock.calls[0]!;
    expect(opts.params.assigned_to).toBeUndefined();
    expect(opts.params.created_by).toBeUndefined();
    expect(opts.headers['x-user-data']).toBe(JSON.stringify({ email: 'bob@fynd.com' }));
    expect(tasks).toHaveLength(1);
    expect(tasks[0]!.priority).toBe('Critical');
    expect(tasks[0]!.assignor).toBe('alice@fynd.com');
  });

  it('filters priority client-side from the multi-select CSV (no wire param)', async () => {
    const critical = { ...apiTaskFixture, id: 'a', priority: 'critical' as const };
    const medium = { ...apiTaskFixture, id: 'b', priority: 'medium' as const };
    const high = { ...apiTaskFixture, id: 'c', priority: 'high' as const };
    getMock.mockResolvedValueOnce({ data: { data: [critical, medium, high] } });
    const tasks = await listTasks({
      tab: 'assigned-to-me',
      filters: { ...DEFAULT_TASK_FILTERS, priority: 'Critical,High' },
      userEmail: 'bob@fynd.com',
    });
    const [, opts] = getMock.mock.calls[0]!;
    // Priority is multi-select now — filtered locally, never sent as a query param.
    expect(opts.params.priority).toBeUndefined();
    expect(tasks.map((t) => t.priority).sort()).toEqual(['Critical', 'High']);
  });

  it('filters assignor client-side from the multi-select CSV', async () => {
    const byAlice = { ...apiTaskFixture, id: 'a', created_by: 'alice@fynd.com' };
    const byCarol = { ...apiTaskFixture, id: 'b', created_by: 'carol@fynd.com' };
    getMock.mockResolvedValueOnce({ data: { data: [byAlice, byCarol] } });
    const tasks = await listTasks({
      tab: 'assigned-to-me',
      filters: { ...DEFAULT_TASK_FILTERS, assignor: 'alice@fynd.com' },
      userEmail: 'bob@fynd.com',
    });
    expect(tasks).toHaveLength(1);
    expect(tasks[0]!.assignor).toBe('alice@fynd.com');
  });

  it('filters linked=with_exception client-side', async () => {
    const withException = { ...apiTaskFixture, id: 'a', exception_id: 'EXC-1' };
    const general = { ...apiTaskFixture, id: 'b', exception_id: null };
    getMock.mockResolvedValueOnce({ data: { data: [withException, general] } });
    const tasks = await listTasks({
      tab: 'assigned-to-me',
      filters: { ...DEFAULT_TASK_FILTERS, linked: 'with_exception' },
      userEmail: 'bob@fynd.com',
    });
    expect(tasks).toHaveLength(1);
    expect(tasks[0]!.exception_id).toBe('EXC-1');
  });

  it('search filter matches title case-insensitively', async () => {
    const matching = { ...apiTaskFixture, id: 'a', title: 'Sarees margin' };
    const other = { ...apiTaskFixture, id: 'b', title: 'Vendor SLA escalation', description: '' };
    getMock.mockResolvedValueOnce({ data: { data: [matching, other] } });
    const tasks = await listTasks({
      tab: 'assigned-to-me',
      filters: { ...DEFAULT_TASK_FILTERS, search: 'SAREES' },
      userEmail: 'bob@fynd.com',
    });
    expect(tasks).toHaveLength(1);
    expect(tasks[0]!.title).toBe('Sarees margin');
  });
});

describe('tasksApi.createTask', () => {
  it('POSTs lowercase priority + sends x-user-data', async () => {
    postMock.mockResolvedValueOnce({ data: { data: apiTaskFixture } });
    const task = await createTask(
      {
        title: 'X',
        description: 'Y',
        assigned_to: 'bob@fynd.com',
        priority: 'High',
        due_date: null,
        exception_id: null,
      },
      'alice@fynd.com',
    );
    const [, opts] = postMock.mock.calls[0]!;
    expect(opts.data.priority).toBe('high');
    expect(opts.data.subscribers).toEqual(['alice@fynd.com', 'bob@fynd.com']);
    expect(opts.headers['x-user-data']).toBe(JSON.stringify({ email: 'alice@fynd.com' }));
    expect(task.priority).toBe('Critical');
  });
});

describe('tasksApi.patchTask', () => {
  it('PATCHes status with optional reason', async () => {
    patchMock.mockResolvedValueOnce({ data: { data: { ...apiTaskFixture, status: 'in_review' } } });
    const task = await patchTask(
      { id: 'T1', patch: { status: 'in_review' }, reason: 'ready' },
      'bob@fynd.com',
    );
    const [url, opts] = patchMock.mock.calls[0]!;
    expect(url).toContain('/tasks/T1');
    expect(opts.data.status).toBe('in_review');
    expect(opts.data.reason).toBe('ready');
    expect(task.status).toBe('in_review');
  });

  it('omits reason when blank', async () => {
    patchMock.mockResolvedValueOnce({ data: { data: apiTaskFixture } });
    await patchTask({ id: 'T1', patch: { status: 'done' } }, 'bob@fynd.com');
    const [, opts] = patchMock.mock.calls[0]!;
    expect(opts.data.reason).toBeUndefined();
  });
});

describe('tasksApi.getTask', () => {
  it('returns task + embedded comments', async () => {
    getMock.mockResolvedValueOnce({
      data: {
        data: {
          ...apiTaskFixture,
          comments: [
            {
              id: 'CMT-1',
              task_id: apiTaskFixture.id,
              body: 'hi',
              comment_type: 'comment' as const,
              created_by: 'alice@fynd.com',
              created_at: '2026-05-30T09:00:00Z',
              updated_at: '2026-05-30T09:00:00Z',
            },
          ],
        },
      },
    });
    const result = await getTask(apiTaskFixture.id, 'bob@fynd.com');
    expect(result?.task.id).toBe(apiTaskFixture.id);
    expect(result?.comments).toHaveLength(1);
    expect(result?.comments[0]!.author).toBe('alice@fynd.com');
  });
});

describe('tasksApi.fetchPendingCount', () => {
  it('returns count from the server', async () => {
    getMock.mockResolvedValueOnce({ data: { data: { count: 7 } } });
    const count = await fetchPendingCount('bob@fynd.com');
    const [url, opts] = getMock.mock.calls[0]!;
    expect(url).toContain('/tasks/count/pending');
    expect(opts.params.user).toBe('bob@fynd.com');
    expect(count).toBe(7);
  });
});
