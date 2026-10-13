import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TooltipProvider } from '@/components/ui';
import type { PlmPublicationItem } from '@/modules/range/api/rangeApi';
import * as validationData from '@/modules/range/data/mockValidation';

const state = vi.hoisted(() => ({
  submission: {
    submission_id: '08c65195-ce3b-4dfb-9520-c36db2c2e2c7', run_id: 'run-1', transport: 'kafka', status: 'PUBLISHED',
    total: 2, greyed: 0, category: 'cat', subcategory: 'subcat', fashion_grade: '',
    created_at: '2026-09-17T05:00:00Z', plm_creation_status: 'not_tracked', legacy_result: null,
    counts: { pending: 0, publishing: 0, published: 2, failed: 0, unknown: 0 },
    processing: {
      status: 'NOT_TRACKED',
      counts: { awaiting: 0, success: 0, validation_failed: 0, failed: 0, skipped: 0, not_tracked: 2 },
    },
  },
  mutate: vi.fn(),
  retry: vi.fn(),
  refetch: vi.fn(),
  isSuccess: false,
  items: [] as PlmPublicationItem[],
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useParams: () => ({ id: 'run-1' }),
  useSearchParams: () => [new URLSearchParams('category=cat&subcategory=subcat&fashion_grade=')],
}));
vi.mock('@/hooks/useDownload', () => ({
  useDownload: () => ({ download: vi.fn(), isDownloading: false }),
}));
vi.mock('@/modules/range/api/rangeHooks', () => ({
  useNetworkOverviewDetail: () => ({ data: undefined, isLoading: false, isFetching: false }),
  useNetworkOverviewDetailFilters: () => ({ data: undefined }),
  useNetworkOverviewDetailStores: () => ({ data: undefined, isLoading: false }),
  useRAActivityLog: () => ({ data: { items: [] } }),
  useBulkBuyerEdit: () => ({ mutate: vi.fn(), isPending: false }),
  useSubmitToPlm: () => ({ mutate: state.mutate, isPending: false, isSuccess: state.isSuccess }),
  usePlmSubmission: () => ({
    data: { transport: 'kafka', submission: state.submission }, isPending: false, isError: false,
    refetch: state.refetch,
  }),
  usePlmSubmissionItems: () => ({ data: { items: state.items, total: 2 }, isLoading: false }),
  useRetryPlmSubmission: () => ({ mutate: state.retry, isPending: false }),
}));

import RABrickAttributeVariantsPage from '@/modules/range/pages/RABrickAttributeVariantsPage';

function renderPage() {
  return render(<TooltipProvider><RABrickAttributeVariantsPage /></TooltipProvider>);
}

function item(overrides: Partial<PlmPublicationItem> = {}): PlmPublicationItem {
  return {
    id: 'item-1', state: 'PUBLISHED', error_code: null, retry_eligible: false,
    attempts: 1, ack_requested: true, style: { brick_name: 'SHRUGS' }, ...overrides,
  };
}

function openDrawer() {
  fireEvent.click(screen.getByRole('button', { name: 'View Submission' }));
  const drawer = within(screen.getByRole('dialog'));
  expect(drawer.getAllByRole('columnheader').map(header => header.textContent)).toEqual([
    'Brick', 'Brand', 'Attributes', 'Status', 'Detail',
  ]);
  expect(drawer.queryByText(/PLM results:|results were not requested/)).not.toBeInTheDocument();
  return drawer;
}

function expectCard(label: string, count: number) {
  const card = within(screen.getByRole('dialog')).getByText(label, { selector: 'p' }).parentElement;
  expect(card).toHaveTextContent(new RegExp(`^${count}${label}$`));
}

beforeEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
  state.isSuccess = false;
  state.items = [];
  state.submission.status = 'PUBLISHED';
  state.submission.total = 2;
  state.submission.counts = { pending: 0, publishing: 0, published: 2, failed: 0, unknown: 0 };
  state.submission.processing = {
    status: 'NOT_TRACKED',
    counts: { awaiting: 0, success: 0, validation_failed: 0, failed: 0, skipped: 0, not_tracked: 2 },
  };
});

describe('persisted PLM publication status', () => {
  it.each(['View Submission', 'Submitted to PLM'])('refreshes the saved status when opening %s', label => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: label }));
    expect(state.refetch).toHaveBeenCalledTimes(1);
    expect(state.mutate).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('shows Submitted to PLM on refresh without mutation state or legacy activity', () => {
    const page = renderPage();
    expect(screen.getByRole('button', { name: 'Submitted to PLM' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'View Submission' })).toBeInTheDocument();
    page.unmount();
    renderPage();
    expect(screen.getByRole('button', { name: 'Submitted to PLM' })).toBeInTheDocument();
    expect(state.mutate).not.toHaveBeenCalled();
  });

  it('does not treat HTTP 202 acceptance as completed publication', () => {
    state.isSuccess = true;
    state.submission.status = 'ACCEPTED';
    state.submission.counts = { pending: 2, publishing: 0, published: 0, failed: 0, unknown: 0 };
    renderPage();
    expect(screen.getByRole('button', { name: 'Submitting' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Submitted to PLM' })).not.toBeInTheDocument();
  });

  it('updates the badge when the saved state becomes published', () => {
    state.submission.status = 'PUBLISHING';
    state.submission.counts = { pending: 0, publishing: 1, published: 1, failed: 0, unknown: 0 };
    const page = renderPage();
    expect(screen.getByRole('button', { name: 'Submitting' })).toBeInTheDocument();
    state.submission.status = 'PUBLISHED';
    state.submission.counts = { pending: 0, publishing: 0, published: 2, failed: 0, unknown: 0 };
    page.rerender(<TooltipProvider><RABrickAttributeVariantsPage /></TooltipProvider>);
    expect(screen.getByRole('button', { name: 'Submitted to PLM' })).toBeInTheDocument();
  });

  it.each([false, true])('shows one submitted status before a PLM result (ACK requested: %s)', ackRequested => {
    state.items = [item({ ack_requested: ackRequested })];
    renderPage();
    const drawer = openDrawer();
    expect(screen.getByText('PLM-2026-09-08C65195CE3B')).toBeInTheDocument();
    expect(screen.queryByText(state.submission.submission_id)).not.toBeInTheDocument();
    expect(drawer.getByRole('cell', { name: 'Submitted to PLM' })).toBeInTheDocument();
    expect(drawer.getByText(ackRequested
      ? 'Awaiting confirmation from PLM.' : 'Sent to PLM. No result is available.')).toBeInTheDocument();
    expect(drawer.getByText('Validation Readiness')).toBeInTheDocument();
    expect(drawer.getByText('Ready — no blocking validation failures')).toBeInTheDocument();
    expect(drawer.queryByRole('cell', { name: 'Accepted' })).not.toBeInTheDocument();
    expectCard('Accepted', 0);
    expectCard('Failed', 0);
    expectCard('Total', 2);
    expect(screen.queryByRole('button', { name: /Retry .* failed items/ })).not.toBeInTheDocument();
  });

  it('shows failed after PLM validation failure even though Kafka publication succeeded', () => {
    state.submission.processing.status = 'VALIDATION_FAILED';
    state.submission.processing.counts = {
      awaiting: 0, success: 0, validation_failed: 2, failed: 0, skipped: 0, not_tracked: 0,
    };
    renderPage();
    expect(screen.getByRole('button', { name: 'Failed' })).toBeInTheDocument();
    openDrawer();
    expect(screen.getByText('Ready — no blocking validation failures')).toBeInTheDocument();
    expectCard('Accepted', 0);
    expectCard('Failed', 2);
    expect(screen.queryByRole('button', { name: 'Retry failed items' })).not.toBeInTheDocument();
  });

  it('keeps skipped replies separate and shows review instead of success', () => {
    state.submission.processing.status = 'NEEDS_REVIEW';
    state.submission.processing.counts = {
      awaiting: 0, success: 1, validation_failed: 0, failed: 0, skipped: 1, not_tracked: 0,
    };
    state.items = [item({ plm_result: { correlation_id: 'item-1', status: 'SKIPPED' } })];
    renderPage();
    expect(screen.getByRole('button', { name: 'Needs review' })).toBeInTheDocument();
    const drawer = openDrawer();
    expect(drawer.getByRole('cell', { name: 'Skipped' })).toBeInTheDocument();
    expect(drawer.queryByRole('cell', { name: 'Submitted to PLM' })).not.toBeInTheDocument();
    expectCard('Accepted', 1);
    expectCard('Failed', 0);
  });

  it.each([
    {
      status: 'FAILED' as const,
      detail: { error: 'Database connection refused' },
      message: 'Database connection refused',
    },
    {
      status: 'VALIDATION_FAILED' as const,
      detail: { errors: ['missing style.brick_cd', 'invalid mrp'] },
      message: 'missing style.brick_cd; invalid mrp',
    },
  ])('shows the saved $status result as the only status after remount', ({ status, detail, message }) => {
    state.submission.processing.status = status;
    state.submission.processing.counts = {
      awaiting: 0, success: 0, validation_failed: status === 'VALIDATION_FAILED' ? 2 : 0,
      failed: status === 'FAILED' ? 2 : 0, skipped: 0, not_tracked: 0,
    };
    state.items = [{
      id: 'item-1', state: 'PUBLISHED', error_code: null, retry_eligible: false,
      attempts: 1, ack_requested: true, style: { brick_name: 'SHRUGS' },
      plm_result: { correlation_id: 'item-1', status, ...detail },
    }];
    const page = renderPage();
    expect(screen.getByRole('button', { name: 'Failed' })).toBeInTheDocument();
    page.unmount();
    renderPage();
    expect(screen.getByRole('button', { name: 'Failed' })).toBeInTheDocument();
    const drawer = openDrawer();
    expect(drawer.getByRole('cell', { name: 'Failed' })).toBeInTheDocument();
    expect(drawer.queryByRole('cell', { name: 'Submitted to PLM' })).not.toBeInTheDocument();
    expectCard('Accepted', 0);
    expectCard('Failed', 2);
    expect(screen.getByText(message)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Retry failed items' })).not.toBeInTheDocument();
    expect(state.mutate).not.toHaveBeenCalled();
  });

  it.each(['PUBLISHED', 'PUBLISHING', 'UNKNOWN'] as const)(
    'shows Accepted when SUCCESS is saved, overriding %s and any old delivery error', publishedState => {
      state.submission.processing.status = 'SUCCESS';
      state.submission.processing.counts = {
        awaiting: 0, success: 2, validation_failed: 0, failed: 0, skipped: 0, not_tracked: 0,
      };
      state.items = [item({
        state: publishedState, error_code: 'OldDeliveryTimeout',
        plm_result: { correlation_id: 'item-1', status: 'SUCCESS', style_code: 'PLM-001' },
      })];
      renderPage();
      const drawer = openDrawer();
      expect(drawer.getByRole('cell', { name: 'Accepted' })).toBeInTheDocument();
      expect(drawer.queryByRole('cell', { name: 'Submitted to PLM' })).not.toBeInTheDocument();
      expect(drawer.queryByText('OldDeliveryTimeout')).not.toBeInTheDocument();
      expect(drawer.getByText('Style: PLM-001')).toBeInTheDocument();
      expect(drawer.getByText('Ready — no blocking validation failures')).toBeInTheDocument();
      expectCard('Accepted', 2);
      expectCard('Failed', 0);
    },
  );

  it('uses the whole submission results for the original three cards, independent of item pagination', () => {
    state.submission.total = 100;
    state.submission.counts.published = 99;
    state.submission.counts.failed = 1;
    state.submission.processing.status = 'AWAITING_RESPONSE';
    state.submission.processing.counts = {
      awaiting: 81, success: 7, validation_failed: 1, failed: 1, skipped: 10, not_tracked: 0,
    };
    state.items = [item()];
    renderPage();
    openDrawer();
    expectCard('Accepted', 7);
    expectCard('Failed', 3);
    expectCard('Total', 100);
  });

  it.each([
    ['PENDING', 'Processing'], ['UNKNOWN', 'Needs review'], ['FAILED', 'Failed'],
  ] as const)('shows one status for %s without a PLM result', (publishedState, label) => {
    state.items = [item({ state: publishedState, retry_eligible: publishedState === 'FAILED' })];
    renderPage();
    const drawer = openDrawer();
    expect(drawer.getByRole('cell', { name: label })).toBeInTheDocument();
    expect(drawer.getAllByRole('cell')).toHaveLength(5);
    if (publishedState === 'FAILED') {
      expect(drawer.getByRole('button', { name: 'Retry failed items' })).toBeInTheDocument();
    }
  });

  it('keeps the readable batch reference on refresh and uses the original ID for retry', () => {
    state.items = [item({ state: 'FAILED', retry_eligible: true })];
    const page = renderPage();
    openDrawer();
    expect(screen.getByText('PLM-2026-09-08C65195CE3B')).toBeInTheDocument();
    page.unmount();
    renderPage();
    const drawer = openDrawer();
    expect(drawer.getByText('PLM-2026-09-08C65195CE3B')).toBeInTheDocument();
    fireEvent.click(drawer.getByRole('button', { name: 'Retry failed items' }));
    expect(state.retry).toHaveBeenCalledWith('08c65195-ce3b-4dfb-9520-c36db2c2e2c7');
  });

  it('preserves RA readiness while PLM replies are outstanding', () => {
    state.submission.processing.status = 'AWAITING_RESPONSE';
    state.submission.processing.counts = {
      awaiting: 1, success: 1, validation_failed: 0, failed: 0, skipped: 0, not_tracked: 0,
    };
    renderPage();
    const drawer = openDrawer();
    expect(drawer.getByText('Ready — no blocking validation failures')).toBeInTheDocument();
    expect(drawer.queryByText('Awaiting validation results from PLM.')).not.toBeInTheDocument();
  });

  it.each(['FAILED', 'SKIPPED'] as const)('does not replace the existing RA readiness with PLM %s', status => {
    state.submission.processing.status = status === 'FAILED' ? 'FAILED' : 'NEEDS_REVIEW';
    state.submission.processing.counts = {
      awaiting: 0, success: 1, validation_failed: 0, failed: status === 'FAILED' ? 1 : 0,
      skipped: status === 'SKIPPED' ? 1 : 0, not_tracked: 0,
    };
    renderPage();
    const drawer = openDrawer();
    expect(drawer.getByText('Ready — no blocking validation failures')).toBeInTheDocument();
  });

  it('retains the original blocking RA validation check for retries', () => {
    const checks = validationData.buildValidationChecks(4, 6, null);
    checks[0] = { ...checks[0], evaluationState: 'evaluated', outcome: 'fail', submissionImpact: 'blocking' };
    vi.spyOn(validationData, 'buildValidationChecks').mockReturnValue(checks);
    state.items = [item({ state: 'FAILED', retry_eligible: true })];
    renderPage();
    const drawer = openDrawer();
    expect(drawer.getByText('Blocked — resolve blocking validation failures before resubmitting')).toBeInTheDocument();
    expect(drawer.getByRole('button', { name: 'Retry failed items' })).toBeDisabled();
    expect(state.retry).not.toHaveBeenCalled();
  });

  it.each([
    { status: 'SUCCESS' as const, message: 'PLM confirmed this style.' },
    { status: 'FAILED' as const, message: 'Submission failed. No reason was provided.' },
    { status: 'SKIPPED' as const, message: 'This style already exists in PLM.' },
  ])('shows a useful detail when $status contains empty optional fields', ({ status, message }) => {
    state.items = [item({ plm_result: {
      correlation_id: 'item-1', status, error_message: '', error: ' ', errors: ['', ' '],
      style_id: '', style_code: ' ',
    } })];
    renderPage();
    expect(openDrawer().getByText(message)).toBeInTheDocument();
  });
});
