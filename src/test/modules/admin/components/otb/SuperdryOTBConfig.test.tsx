import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { TooltipProvider } from '@/components/ui';
import { SuperdryOTBConfig } from '@/modules/admin/components/otb/SuperdryOTBConfig';
import { fetchOtbConfiguration, type OtbConfiguration } from '@/modules/admin/api/otbConfigurationApi';
import {
  triggerOtbRun,
  getOtbRunStatus,
  getActiveOtbRun,
  getLatestOtbRun,
} from '@/modules/admin/api/otbRunApi';

// ── Mocks ────────────────────────────────────────────────────────────────
vi.mock('@/modules/admin/api/otbConfigurationApi', () => ({
  fetchOtbConfiguration: vi.fn(),
}));
vi.mock('@/modules/admin/api/otbRunApi', () => {
  class OtbRunConflictError extends Error {}
  return {
    triggerOtbRun: vi.fn(),
    getOtbRunStatus: vi.fn(),
    getActiveOtbRun: vi.fn(),
    getLatestOtbRun: vi.fn(),
    OtbRunConflictError,
  };
});
vi.mock('@/modules/otb/api/otbDashboardApi', () => ({
  otbKeys: { all: ['otb'] as const },
}));
const toast = { success: vi.fn(), info: vi.fn(), error: vi.fn() };
vi.mock('@/hooks/useToast', () => ({ useToast: () => toast }));
vi.mock('@/hooks/useAuthStore', () => ({
  useAuthStore: (selector: (s: { user: { email: string } }) => unknown) =>
    selector({ user: { email: 'tester@example.com' } }),
}));

// Stub the heavy child tabs; the Parameters stub exposes an onSaved trigger.
vi.mock('@/modules/admin/components/otb/SuperdryParametersTab', () => ({
  SuperdryParametersTab: ({ onSaved }: { onSaved?: () => void }) => (
    <button onClick={() => onSaved?.()}>save-params</button>
  ),
}));
vi.mock('@/modules/admin/components/otb/SuperdryPlanningTab', () => ({
  SuperdryPlanningTab: () => <div>planning-tab</div>,
}));
vi.mock('@/modules/admin/components/otb/SuperdryKpiFormulaeTab', () => ({
  SuperdryKpiFormulaeTab: () => <div>kpi-tab</div>,
}));

const mockFetch = vi.mocked(fetchOtbConfiguration);
const mockTrigger = vi.mocked(triggerOtbRun);
const mockStatus = vi.mocked(getOtbRunStatus);
const mockActive = vi.mocked(getActiveOtbRun);
const mockLatest = vi.mocked(getLatestOtbRun);

const CONFIG = { version: 3, updated_at: new Date(2026, 2, 23, 14, 30).toISOString() } as OtbConfiguration;
const LAST_RUN = {
  workflow_id: 'otb-x-current',
  status: 'COMPLETED' as const,
  completed_at: new Date(2026, 2, 23, 15, 45).toISOString(),
};
const BANNER = /Recalculating OTB… Please wait!/;

function renderScreen() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <TooltipProvider>
        <MemoryRouter>
          <SuperdryOTBConfig />
        </MemoryRouter>
      </TooltipProvider>
    </QueryClientProvider>,
  );
}

describe('SuperdryOTBConfig — trigger + lock flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue(CONFIG);
    mockActive.mockResolvedValue(null);
    mockLatest.mockResolvedValue(LAST_RUN);
    mockStatus.mockResolvedValue({ workflow_id: 'otb-x-current', status: 'RUNNING' });
    mockTrigger.mockResolvedValue({ workflow_id: 'otb-x-current', status: 'RUNNING' });
  });

  it('shows persisted config and run timestamps after loading the screen', async () => {
    renderScreen();
    expect(await screen.findByText('Last config updated: 2026-03-23 14:30')).toBeInTheDocument();
    expect(await screen.findByText('Last OTB run performed: 2026-03-23 15:45')).toBeInTheDocument();
  });

  it('refreshes the config timestamp after saving without changing the run timestamp', async () => {
    renderScreen();
    const save = await screen.findByRole('button', { name: 'save-params' });
    mockFetch.mockResolvedValue({ ...CONFIG, updated_at: new Date(2026, 2, 24, 9, 5).toISOString() });
    fireEvent.click(save);
    expect(await screen.findByText('Last config updated: 2026-03-24 09:05')).toBeInTheDocument();
    expect(screen.getByText('Last OTB run performed: 2026-03-23 15:45')).toBeInTheDocument();
  });

  it('uses the completed run timestamp immediately, before visibility catches up', async () => {
    mockStatus.mockResolvedValue({ ...LAST_RUN, completed_at: new Date(2026, 2, 24, 10, 0).toISOString() });
    mockActive.mockResolvedValue({ workflow_id: LAST_RUN.workflow_id, status: 'RUNNING' });
    renderScreen();
    expect(await screen.findByText('Last OTB run performed: 2026-03-24 10:00')).toBeInTheDocument();
  });

  it('keeps the previous successful timestamp when a run fails', async () => {
    mockStatus.mockResolvedValue({ workflow_id: LAST_RUN.workflow_id, status: 'FAILED' });
    mockActive.mockResolvedValue({ workflow_id: LAST_RUN.workflow_id, status: 'RUNNING' });
    renderScreen();
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(screen.getByText('Last OTB run performed: 2026-03-23 15:45')).toBeInTheDocument();
  });

  it('shows a dash when no successful run exists', async () => {
    mockLatest.mockResolvedValue(null);
    renderScreen();
    expect(await screen.findByText('Last OTB run performed: —')).toBeInTheDocument();
  });

  it('distinguishes an unavailable run lookup from an empty history', async () => {
    mockLatest.mockRejectedValue(new Error('Temporal unavailable'));
    renderScreen();
    expect(await screen.findByText('Last OTB run performed: Unavailable')).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'save-params' })).toBeEnabled();
  });

  it('shows the confirm modal after a save, then locks on Proceed', async () => {
    renderScreen();
    const saveBtn = await screen.findByRole('button', { name: 'save-params' });

    // Not locked initially.
    expect(screen.queryByText(BANNER)).not.toBeInTheDocument();

    fireEvent.click(saveBtn); // simulate a successful config save
    expect(await screen.findByText('Do you want to trigger an OTB run?')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Proceed' }));

    await waitFor(() => expect(mockTrigger).toHaveBeenCalledTimes(1));
    // config_version threaded through
    expect(mockTrigger).toHaveBeenCalledWith('tester@example.com', { config_version: 3 });
    // Screen is now locked.
    expect(await screen.findByText(BANNER)).toBeInTheDocument();
  });

  it('unlocks and refreshes when the run completes', async () => {
    mockStatus.mockResolvedValue({ workflow_id: 'otb-x-current', status: 'COMPLETED' });
    renderScreen();

    fireEvent.click(await screen.findByRole('button', { name: 'save-params' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Proceed' }));

    await waitFor(() => expect(toast.success).toHaveBeenCalled());
    await waitFor(() => expect(screen.queryByText(BANNER)).not.toBeInTheDocument());
    // config re-fetched on load + after completion
    expect(mockFetch.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it('re-locks on mount when a run is already in progress (reload-aware)', async () => {
    mockActive.mockResolvedValue({ workflow_id: 'otb-x-current', status: 'RUNNING' });
    renderScreen();

    // Locked without any save/interaction.
    expect(await screen.findByText(BANNER)).toBeInTheDocument();
  });
});
