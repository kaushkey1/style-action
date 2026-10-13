/**
 * Shared motion constants for the Ask AI send flights.
 *
 * HERO_* drives the welcome → conversation dock (the composer FLIPs from
 * center to bottom). SEND_* drives the per-message text flight (the typed
 * text FLIPs from the composer row into the user bubble) — it runs on every
 * send, so it is deliberately faster than the one-time hero dock.
 *
 * The *_FLIGHT_SPRING variants add a one-beat hold before the glide: the
 * send commit's first frame is expensive (style recalc + paint + layer
 * setup for the freshly mounted elements, ~25-35ms measured), and Motion's
 * spring clock starts at commit — without the hold, the first visible frame
 * lands ~10% into the flight and reads as hesitate-then-jump. The hold lets
 * that frame paint while the text still rests at the composer, then the
 * spring runs on a clean frame cadence. Use the FLIGHT variants only on the
 * flying (newly mounted) elements — never on the composer row itself, or
 * its auto-grow layout animation would lag behind typing.
 *
 * Springs are non-bouncy so the motion reads calm; the *_FLIGHT_MS timers
 * run slightly past hold + perceptual duration so layoutId pairings are
 * dropped only after the animation has settled.
 */
export const FLIGHT_HOLD_S = 0.05;
export const HERO_SPRING = { type: 'spring', duration: 0.4, bounce: 0 } as const;
export const HERO_FLIGHT_SPRING = { ...HERO_SPRING, delay: FLIGHT_HOLD_S } as const;
export const SEND_SPRING = { type: 'spring', duration: 0.3, bounce: 0 } as const;
export const SEND_FLIGHT_SPRING = { ...SEND_SPRING, delay: FLIGHT_HOLD_S } as const;
export const HERO_FLIGHT_MS = 650;
export const SEND_FLIGHT_MS = 550;
