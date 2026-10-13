import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { apiFetch, apiPost } from '@/lib/api';
import { CompanionBriefing } from '@/modules/store-view/shared/CompanionBriefing';
import { companionKeys } from '@/modules/store-view/api/companionHooks';
import { briefing, range } from './companionFixtures';
import { mockCompanionResponses, renderCompanion } from './companionTestUtils';

vi.mock('@/lib/api', () => ({ apiFetch: vi.fn(), apiPost: vi.fn() }));

beforeEach(() => {
  vi.resetAllMocks();
  mockCompanionResponses();
});

describe('Companion live AI briefing', () => {
  it.each(['business', 'product'] as const)('shows unavailable and retries the %s briefing without mock text', async (view) => {
    vi.mocked(apiFetch).mockRejectedValueOnce(new Error('Unavailable'));
    const user = userEvent.setup();
    renderCompanion(<CompanionBriefing view={view} />, range);
    await screen.findByText('AI briefing unavailable');
    expect(screen.queryByText('AI Generated')).not.toBeInTheDocument();
    expect(screen.queryByText(briefing.summary)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Retry briefing' }));
    expect(await screen.findByText(briefing.summary)).toBeInTheDocument();
    expect(apiFetch).toHaveBeenCalledWith('/companion/ai-summary', { view, ...range });
  });

  it('shows loading without claims until the briefing is available', async () => {
    let complete!: (value: typeof briefing) => void;
    vi.mocked(apiFetch).mockImplementationOnce(() => new Promise((resolve) => { complete = resolve; }));
    renderCompanion(<CompanionBriefing view="product" />);
    expect(screen.getByText('Product briefing')).toBeInTheDocument();
    expect(screen.queryByText('AI briefing unavailable')).not.toBeInTheDocument();
    expect(screen.queryByText(briefing.summary)).not.toBeInTheDocument();
    complete(briefing);
    expect(await screen.findByText(briefing.summary)).toBeInTheDocument();
  });

  it('hides an old cached briefing after a refetch fails', async () => {
    const { client } = renderCompanion(<CompanionBriefing view="product" />, range);
    await screen.findByText(briefing.summary);
    vi.mocked(apiFetch).mockRejectedValueOnce(new Error('Unavailable'));
    await client.refetchQueries({ queryKey: companionKeys.aiSummary('product', range) });
    await screen.findByText('AI briefing unavailable');
    expect(screen.queryByText(briefing.summary)).not.toBeInTheDocument();
  });

  it('refreshes the selected view and period, disables duplicate refresh, and updates the visible summary', async () => {
    let complete!: (value: typeof briefing) => void;
    vi.mocked(apiPost).mockImplementationOnce(() => new Promise((resolve) => { complete = resolve; }));
    const user = userEvent.setup();
    renderCompanion(<CompanionBriefing view="product" />, range);
    await screen.findByText(briefing.summary);
    await user.click(screen.getByRole('button', { name: 'Regenerate briefing' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Regenerate briefing' })).toBeDisabled());
    const [url] = vi.mocked(apiPost).mock.calls[0]!;
    const request = new URL(url, 'http://test');
    expect(request.pathname).toBe('/companion/ai-summary/refresh');
    expect(Object.fromEntries(request.searchParams)).toEqual({ view: 'product', ...range });
    complete({ ...briefing, summary: 'Updated live metrics.' });
    expect(await screen.findByText('Updated live metrics.')).toBeInTheDocument();
    expect(screen.queryByText(briefing.summary)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Regenerate briefing' })).toBeEnabled();
  });
});
