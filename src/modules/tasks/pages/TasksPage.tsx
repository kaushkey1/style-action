import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
import {
  Button,
  Spinner,
  FilterBar,
  FilterSearch,
  FilterMultiSelect,
  MobileFilterTrigger,
  MobileFilterSheet,
  type FilterDef,
} from '@/components/ui';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useAuthStore } from '@/hooks/useAuthStore';
import { useTasksList } from '../hooks/useTasksList';
import { useUsers } from '../hooks/useUsers';
import { useTasksFilterStore } from '../stores/useTasksFilterStore';
import { useTasksViewStore } from '../stores/useTasksViewStore';
import {
  DEFAULT_TASK_FILTERS,
  taskFilterKey,
  type TaskFilters,
  type TaskView,
} from '../types/task.types';
import { TaskListTableView } from '../components/TaskListTableView';
import { TaskListKanbanView } from '../components/TaskListKanbanView';
import { TaskListCardView } from '../components/TaskListCardView';
import { ViewSwitcher } from '../components/ViewSwitcher';
import { CreateTaskModal } from '../components/CreateTaskModal';

const PRIORITY_OPTIONS = [
  { value: 'Critical', label: 'Critical' },
  { value: 'High', label: 'High' },
  { value: 'Medium', label: 'Medium' },
  { value: 'Low', label: 'Low' },
];
const LINKED_OPTIONS = [
  { value: 'with_exception', label: 'With exception' },
  { value: 'general', label: 'General tasks' },
];

export function TasksPage(): React.JSX.Element {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const userEmail = useAuthStore((s) => s.user?.email ?? '');
  const [createOpen, setCreateOpen] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useTasksFilterStore((s) => s.filters);
  const setFilter = useTasksFilterStore((s) => s.setFilter);
  const clearFilters = useTasksFilterStore((s) => s.clearFilters);
  const setFilters = useTasksFilterStore((s) => s.setFilters);

  const storeView = useTasksViewStore((s) => s.view);
  const setView = useTasksViewStore((s) => s.setView);
  // Mobile is Card-only (Kanban/Table are desktop views). Coerce the persisted
  // value to a valid option for the current breakpoint.
  const view: TaskView = isMobile
    ? 'card'
    : storeView === 'table'
      ? 'table'
      : 'kanban';

  // On mount: hydrate store from URL params so filters persist on refresh.
  useEffect(() => {
    const search = searchParams.get('search');
    const priority = searchParams.get('priority');
    const assignor = searchParams.get('assignor');
    const linked = searchParams.get('linked');
    if (search !== null || priority !== null || assignor !== null || linked !== null) {
      setFilters({
        search: search ?? DEFAULT_TASK_FILTERS.search,
        priority: priority ?? DEFAULT_TASK_FILTERS.priority,
        assignor: assignor ?? DEFAULT_TASK_FILTERS.assignor,
        linked: linked ?? DEFAULT_TASK_FILTERS.linked,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only: hydrate from URL once
  }, []);

  // Keep URL in sync whenever filters change.
  useEffect(() => {
    const next = new URLSearchParams();
    if (filters.search) next.set('search', filters.search);
    if (filters.priority !== DEFAULT_TASK_FILTERS.priority) next.set('priority', filters.priority);
    if (filters.assignor !== DEFAULT_TASK_FILTERS.assignor) next.set('assignor', filters.assignor);
    if (filters.linked !== DEFAULT_TASK_FILTERS.linked) next.set('linked', filters.linked);
    setSearchParams(next, { replace: true });
  }, [filters, setSearchParams]);

  const [appliedFilters, setAppliedFilters] = useState<TaskFilters>(filters);
  const filtersChanged = taskFilterKey(filters) !== taskFilterKey(appliedFilters);
  const hasActiveFilters =
    taskFilterKey(appliedFilters) !== taskFilterKey(DEFAULT_TASK_FILTERS);

  const { data: users = [] } = useUsers();

  const { data: tasks = [], isLoading } = useTasksList({
    tab: 'assigned-to-me',
    filters: appliedFilters,
    userEmail,
  });

  const handleApply = (): void => {
    setAppliedFilters(filters);
  };

  const handleClear = (): void => {
    clearFilters();
    setAppliedFilters(DEFAULT_TASK_FILTERS);
  };

  // Mobile: search applies live; the multiselects apply via the bottom sheet.
  const handleSearchChange = (v: string): void => {
    setFilter('search', v);
    setAppliedFilters((prev) => ({ ...prev, search: v }));
  };

  const mobileFilterDefs: FilterDef[] = [
    { type: 'multiselect', key: 'priority', label: 'Priority', options: PRIORITY_OPTIONS },
    {
      type: 'multiselect',
      key: 'assignor',
      label: 'Assignor',
      options: users.map((u) => ({ value: u.email, label: u.name })),
      searchable: true,
    },
    { type: 'multiselect', key: 'linked', label: 'Linked', options: LINKED_OPTIONS },
  ];
  const mobileFilterValues: Record<string, string> = {
    priority: filters.priority,
    assignor: filters.assignor,
    linked: filters.linked,
  };
  const mobileActiveCount = [filters.priority, filters.assignor, filters.linked].filter(
    (v) => v !== 'all',
  ).length;
  const handleMobileFilterApply = (vals: Record<string, string>): void => {
    const next: TaskFilters = {
      search: filters.search,
      priority: vals.priority ?? 'all',
      assignor: vals.assignor ?? 'all',
      linked: vals.linked ?? 'all',
    };
    setFilters(next);
    setAppliedFilters(next);
  };

  const body = isLoading ? (
    <div className="flex justify-center py-12">
      <Spinner size="lg" />
    </div>
  ) : view === 'table' ? (
    <TaskListTableView tasks={tasks} tab="assigned-to-me" />
  ) : view === 'card' ? (
    <TaskListCardView tasks={tasks} tab="assigned-to-me" />
  ) : (
    <TaskListKanbanView tasks={tasks} tab="assigned-to-me" />
  );

  if (isMobile) {
    return (
      <div className="animate-fadeInUp space-y-3 pb-24">
        {/* Header — back + title on one row (Tasks is reached from any product). */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void navigate(-1)}
            aria-label="Go back"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Tasks</h1>
        </div>

        {/* Toolbar — search · filter sheet · layout switcher. */}
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <FilterSearch
              placeholder="Search tasks…"
              value={filters.search}
              onChange={handleSearchChange}
            />
          </div>
          <MobileFilterTrigger
            activeCount={mobileActiveCount}
            onOpen={() => setMobileFilterOpen(true)}
          />
        </div>

        {body}

        <CreateTaskModal isOpen={createOpen} onClose={() => setCreateOpen(false)} />
        <MobileFilterSheet
          isOpen={mobileFilterOpen}
          onClose={() => setMobileFilterOpen(false)}
          filters={mobileFilterDefs}
          values={mobileFilterValues}
          onApply={handleMobileFilterApply}
          onClear={handleClear}
        />

        {/* Sticky Create Task bar — owns the bottom (the Command bottom nav is
            hidden on /tasks). Portaled to <body>: the page root's animate-fadeInUp
            transform would otherwise become the containing block and break fixed. */}
        {createPortal(
          <div className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
            <Button
              variant="primary"
              onClick={() => setCreateOpen(true)}
              className="min-h-11 w-full"
            >
              <Plus className="h-4 w-4" />
              Create Task
            </Button>
          </div>,
          document.body,
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fadeInUp">
      {/* eslint-disable-next-line design-system/prefer-section-header -- flat page header (title + page action), matching Action Register / Store Detail; SectionHeader is for in-page sections */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4" />
          Create Task
        </Button>
      </div>

      <CreateTaskModal isOpen={createOpen} onClose={() => setCreateOpen(false)} />

      {/* Surface card — toolbar (search · filters · layout switcher) over the
          board/table, on a single white card. */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 p-3">
          <FilterBar className="mb-0 min-w-0 flex-1">
            <FilterSearch
              placeholder="Search tasks…"
              value={filters.search}
              onChange={(v) => setFilter('search', v)}
            />
            <FilterMultiSelect
              value={filters.priority}
              onChange={(v) => setFilter('priority', v)}
              placeholder="All priorities"
              options={PRIORITY_OPTIONS}
            />
            <FilterMultiSelect
              value={filters.assignor}
              onChange={(v) => setFilter('assignor', v)}
              placeholder="All assignors"
              options={users.map((u) => ({ value: u.email, label: u.name }))}
            />
            <FilterMultiSelect
              value={filters.linked}
              onChange={(v) => setFilter('linked', v)}
              placeholder="All tasks"
              options={LINKED_OPTIONS}
            />
            {filtersChanged && (
              <Button size="sm" onClick={handleApply} className="text-xs text-nowrap">
                Apply
              </Button>
            )}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="text-xs text-nowrap"
              >
                Clear
              </Button>
            )}
          </FilterBar>
          <ViewSwitcher value={view} onChange={setView} />
        </div>

        <div className="p-3">{body}</div>
      </div>
    </div>
  );
}
