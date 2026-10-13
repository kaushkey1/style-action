import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/hooks/useMediaQuery';

export interface InfoBannerSlide {
  icon: LucideIcon;
  /** Rich message content (supports the bolded "{n} metrics" span). */
  message: React.ReactNode;
  actionLabel: string;
  onAction: () => void;
}

const ROTATE_MS = 6000; // dwell per slide before auto-advancing
const DECK_ENTER_MS = 440; // front card rises in
const DECK_EXIT_MS = 320; // previous card deals off the top
const REDUCED_MS = 200; // plain fade when reduced motion is requested
const DECK_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'; // soft, calm ease-out

// Mirrors `Alert variant="info" size="sm"` so the deck reads identically to the page's
// other info banners — but `flex-nowrap` keeps each card a single line so the two
// overlaid cards stay equal-height and the shuffle never jumps.
const INFO_BANNER_BAR =
  'flex flex-nowrap items-center gap-x-2 rounded-lg border border-primary-100 bg-primary-50 px-3 py-2 text-xs leading-relaxed text-primary-700';
const NAV_BTN =
  'rounded p-1 text-primary-600 transition-[transform,background-color,color] duration-150 ease-out hover:bg-primary-100 hover:text-primary-800 active:scale-[0.97] focus-visible:outline-none focus-kb:ring-2 focus-kb:ring-primary-500/30';

/** Auto-advance loop with hover/focus pause + reduced-motion guard. */
function useAutoRotate(
  count: number,
  intervalMs: number,
  reduced: boolean,
): { index: number; setIndex: React.Dispatch<React.SetStateAction<number>>; bind: Record<string, () => void> } {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused || reduced || count <= 1) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % count), intervalMs);
    return () => window.clearInterval(id);
  }, [paused, reduced, count, intervalMs]);
  const bind = {
    onMouseEnter: () => setPaused(true),
    onMouseLeave: () => setPaused(false),
    onFocusCapture: () => setPaused(true),
    onBlurCapture: () => setPaused(false),
  };
  return { index, setIndex, bind };
}

/** Icon + message + action row shared by the live and outgoing cards. */
function DeckCard({ slide, live }: { slide: InfoBannerSlide; live: boolean }): React.JSX.Element {
  const Icon = slide.icon;
  return (
    <div className="flex min-w-0 flex-1 items-center gap-2">
      <Icon className="h-4 w-4 shrink-0 text-primary-600" aria-hidden />
      <p className="min-w-0 flex-1 truncate">{slide.message}</p>
      <Button
        variant="ghost"
        size="sm"
        tabIndex={live ? 0 : -1}
        className="min-h-8 shrink-0 text-primary-700 hover:bg-primary-100 hover:text-primary-800"
        onClick={slide.onAction}
      >
        {slide.actionLabel}
      </Button>
    </div>
  );
}

/** Manual prev/next chevrons. Inert (tabIndex -1) on the transient outgoing card. */
function ChevronNav({
  onStep,
  interactive,
}: {
  onStep: (dir: number) => void;
  interactive: boolean;
}): React.JSX.Element {
  return (
    <div className="flex shrink-0 items-center gap-0.5 border-l border-primary-200/70 pl-2">
      <button
        type="button"
        aria-label="Previous message"
        tabIndex={interactive ? 0 : -1}
        onClick={() => onStep(-1)}
        className={NAV_BTN}
      >
        <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
      </button>
      <button
        type="button"
        aria-label="Next message"
        tabIndex={interactive ? 0 : -1}
        onClick={() => onStep(1)}
        className={NAV_BTN}
      >
        <ChevronRight className="h-3.5 w-3.5" aria-hidden />
      </button>
    </div>
  );
}

/**
 * Desktop-only "stacked deck" info banner: a single indigo card resting on a peeking
 * card, auto-rotating between its slides with manual ‹ › chevrons. The front card deals
 * off the top as the next gently rises (transform + opacity only). Auto-loops every 6s,
 * pauses on hover/focus, and degrades to a plain fade with no auto-advance under
 * `prefers-reduced-motion`. Carousel semantics (region, not a status live-region) keep
 * screen readers from re-announcing on every auto-advance.
 */
export function InfoBannerDeck({ slides }: { slides: InfoBannerSlide[] }): React.ReactNode {
  const reduced = useReducedMotion();
  const count = slides.length;
  const { index, setIndex, bind } = useAutoRotate(count, ROTATE_MS, reduced);
  const go = (dir: number): void => setIndex((i) => (i + dir + count) % count);

  // `deal.prev` = the slide currently dealing off. Held in state (not derived) so an
  // unrelated re-render (hover/pause) can never drop the outgoing layer mid-deal.
  const [deal, setDeal] = useState<{ prev: number } | null>(null);
  // Block pointer events on the incoming card while it animates in — prevents the CTA
  // button materialising under the cursor mid-deal (DB-3).
  const [incoming, setIncoming] = useState(false);
  const shownRef = useRef(index); // last committed index
  const incomingRef = useRef<HTMLDivElement>(null);
  const outgoingRef = useRef<HTMLDivElement>(null);
  const peekRef = useRef<HTMLDivElement>(null);

  // Record the outgoing slide before paint, so both layers are in the DOM by the time
  // the animation effect runs — no flash, no extra painted frame.
  useLayoutEffect(() => {
    if (shownRef.current === index) return;
    setDeal({ prev: shownRef.current });
    setIncoming(true);
    shownRef.current = index;
  }, [index]);

  // Animate both layers together, before paint. transform + opacity only.
  useLayoutEffect(() => {
    if (!deal) return;
    const incomingEl = incomingRef.current;
    const outgoing = outgoingRef.current;
    const peek = peekRef.current;

    if (incomingEl) {
      incomingEl.getAnimations().forEach((a) => a.cancel());
      const enter = incomingEl.animate(
        reduced
          ? [{ opacity: 0 }, { opacity: 1 }]
          : [
              { opacity: 0, transform: 'translateY(6px) scale(0.97)' },
              { opacity: 1, transform: 'translateY(0) scale(1)' },
            ],
        { duration: reduced ? REDUCED_MS : DECK_ENTER_MS, easing: reduced ? 'ease-out' : DECK_EASE, fill: 'backwards' },
      );
      enter.onfinish = () => setIncoming(false);
    }

    if (outgoing) {
      outgoing.getAnimations().forEach((a) => a.cancel());
      const exit = outgoing.animate(
        reduced
          ? [{ opacity: 1 }, { opacity: 0 }]
          : [
              { opacity: 1, transform: 'translateY(0) scale(1)' },
              { opacity: 0, transform: 'translateY(-6px) scale(0.99)' },
            ],
        { duration: reduced ? REDUCED_MS : DECK_EXIT_MS, easing: reduced ? 'ease-out' : DECK_EASE, fill: 'forwards' },
      );
      exit.onfinish = () => setDeal(null); // drop the outgoing layer once it's fully gone
    }

    if (peek && !reduced) {
      peek.getAnimations().forEach((a) => a.cancel());
      peek.animate(
        [
          { opacity: 0.5, transform: 'scale(0.99)' },
          { opacity: 0.6, transform: 'scale(1)' },
        ],
        { duration: DECK_ENTER_MS, easing: DECK_EASE },
      );
    }
  }, [deal, reduced]);

  const slide = slides[index];
  if (!slide) return null;
  const outSlide = deal != null ? slides[deal.prev] : undefined;
  const multi = count > 1;

  return (
    // pb-2 leaves room for the peek card's -bottom-2 overhang.
    <div className="pb-2">
      <div
        role="region"
        aria-roledescription="carousel"
        aria-label="Page information"
        {...bind}
        className="relative"
      >
        {/* Peek card behind — depth cue; settles subtly as a card deals off. */}
        {multi && (
          <div
            ref={peekRef}
            aria-hidden
            className="absolute inset-x-2.5 top-0 -bottom-2 rounded-lg border border-primary-200/70 bg-primary-50/60 opacity-60"
          />
        )}

        {/* Live / incoming front card (stable node; the rise replays on each change). */}
        <div ref={incomingRef} className={cn(INFO_BANNER_BAR, 'relative shadow-sm', incoming && 'pointer-events-none')}>
          <DeckCard slide={slide} live />
          {multi && <ChevronNav onStep={go} interactive />}
        </div>

        {/* Outgoing front — transient overlay dealing off the top (click-through). */}
        {outSlide && deal != null && (
          <div
            ref={outgoingRef}
            aria-hidden
            className={cn(INFO_BANNER_BAR, 'pointer-events-none absolute inset-0 shadow-sm')}
          >
            <DeckCard slide={outSlide} live={false} />
            {multi && <ChevronNav onStep={() => undefined} interactive={false} />}
          </div>
        )}
      </div>
    </div>
  );
}
