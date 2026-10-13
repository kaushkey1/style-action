import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// vi.fn() returns `any`, so these satisfy the real hook signatures without
// reconstructing their full return types. Set per-test with mockReturnValue.
const isMobileMock = vi.fn();
const isTouchMock = vi.fn();
const glossaryMock = vi.fn();

vi.mock('@/hooks/useMediaQuery', () => ({
  useIsMobile: () => isMobileMock(),
  useIsTouch: () => isTouchMock(),
}));

vi.mock('@/modules/glossary/useGlossary', () => ({
  useGlossary: () => glossaryMock(),
}));

vi.mock('@/modules/glossary/useGlossaryStore', () => ({
  useGlossaryStore: (selector: (s: { openGlossary: () => void }) => unknown) =>
    selector({ openGlossary: () => undefined }),
}));

// Stub the leaf banners/modal so the test isolates PageInfoBanners' branching
// (and avoids react-query / WAAPI dependencies in jsdom).
vi.mock('@/components/data-scope/DataScopeBanner', () => ({
  DataScopeBanner: ({ note }: { note: string }) => <div data-testid="data-scope-banner">{note}</div>,
}));

vi.mock('@/components/data-scope/GlossaryBanner', () => ({
  GlossaryBanner: () => <div data-testid="glossary-banner" />,
}));

vi.mock('@/components/data-scope/DataScopeModal', () => ({
  DataScopeModal: () => null,
}));

vi.mock('@/components/data-scope/InfoBannerDeck', () => ({
  InfoBannerDeck: ({ slides }: { slides: Array<{ actionLabel: string }> }) => (
    <div data-testid="info-banner-deck">{slides.map((s) => s.actionLabel).join('|')}</div>
  ),
}));

import { PageInfoBanners } from '@/components/data-scope/PageInfoBanners';

const NOTE = 'Store performance data refreshed on a T-2 cycle.';

describe('PageInfoBanners', () => {
  beforeEach(() => {
    isMobileMock.mockReturnValue(false);
    isTouchMock.mockReturnValue(false);
    glossaryMock.mockReturnValue({ pageCount: 0 });
  });

  it('merges both banners into the rotating deck on desktop', () => {
    glossaryMock.mockReturnValue({ pageCount: 8 });
    render(<PageInfoBanners note={NOTE} />);

    const deck = screen.getByTestId('info-banner-deck');
    expect(deck).toBeInTheDocument();
    // Both slides handed to the deck, Data Scope first.
    expect(deck).toHaveTextContent('View Data Scope|View Glossary');
    // The individual banners are not also rendered.
    expect(screen.queryByTestId('data-scope-banner')).not.toBeInTheDocument();
    expect(screen.queryByTestId('glossary-banner')).not.toBeInTheDocument();
  });

  it('renders only the Data Scope banner on mobile (no deck)', () => {
    isMobileMock.mockReturnValue(true);
    isTouchMock.mockReturnValue(true);
    glossaryMock.mockReturnValue({ pageCount: 8 });
    render(<PageInfoBanners note={NOTE} />);

    expect(screen.queryByTestId('info-banner-deck')).not.toBeInTheDocument();
    expect(screen.getByTestId('data-scope-banner')).toHaveTextContent(NOTE);
  });

  it('renders the single Data Scope banner on desktop when the page has no metrics', () => {
    glossaryMock.mockReturnValue({ pageCount: 0 });
    render(<PageInfoBanners note={NOTE} />);

    expect(screen.queryByTestId('info-banner-deck')).not.toBeInTheDocument();
    expect(screen.getByTestId('data-scope-banner')).toHaveTextContent(NOTE);
  });

  it('does not render the deck when there is no note (glossary-only path)', () => {
    glossaryMock.mockReturnValue({ pageCount: 8 });
    render(<PageInfoBanners />);

    expect(screen.queryByTestId('info-banner-deck')).not.toBeInTheDocument();
    expect(screen.queryByTestId('data-scope-banner')).not.toBeInTheDocument();
    expect(screen.getByTestId('glossary-banner')).toBeInTheDocument();
  });
});
