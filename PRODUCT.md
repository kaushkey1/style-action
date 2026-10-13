# Product

<!-- impeccable:product-schema 1 -->

Scope: this record covers the **Style Actions product** module (`src/modules/style-actions-product/`, routes under `/style-actions-product`) inside the Impetus Agentic Command Center app: the real-data build of Style Actions, backed by `style-actions-backend`. The read-only design reference is the Style Actions platform prototype (`src/modules/style-actions-platform/` on branch `feat/style-actions-platform-claude`). The rest of the app follows the repo-wide context in `CLAUDE.md`.

## Platform

web

## Users

Confirmed by the user (2 October 2026): the eight personas in `specs/style-actions-ux-prototype-v1.md` §3 are the primary users. The commercial/category leader is the lead persona for the calibration screen.

- Commercial/category leader: sets targets, compares material choices, approves.
- Planner/buyer: investigates products and stores, reviews stock movements, proposes or challenges actions.
- Pricing/markdown manager: price structures, margin floors, markdown waves.
- Campaign manager: briefs, offers, readiness, campaign results.
- Brand/finance owner: restrictions, funding, margin exposure.
- Store/DC/channel operator: readiness and failed or partial execution.
- Data/model owner: missing or stale data, unreliable recommendations.
- Administrator: configuration, access, approval routes, connections.

They work inside Reliance Retail Fashion & Lifestyle. The job: decide what to do with products (replenish, reposition/remove, markdown, promote, set/revise price, or hold), put approved decisions into operation, and learn whether they worked.

## Product Purpose

One commercial workspace around specialist calculation engines. It turns engine output into a durable decision record that connects policy, evidence, alternatives, approval, execution and measured outcome. Loop: Observe → Diagnose → Compare → Recommend → Approve → Execute → Verify → Measure → Learn.

Success for Scope 1 (this release): for any store in scope, a planner or category lead sees from real data what the store holds, sells and misses; how every option is doing against the sell-through curve; one option's full story; and how options spread across the lifecycle. No recommendations yet; later scopes add replenishment, pullback and markdown on the same surfaces.

## Positioning

The platform separates states that other tools merge: engine evaluation complete ≠ recommendation ≠ approved decision ≠ accepted instruction ≠ verified execution ≠ forecast accuracy ≠ incremental impact. "Not selling" is a diagnosis trigger, not a markdown instruction.

## Operating Context

- Real data: dated snapshots of BigQuery inputs (stock, sales, GRN dates, STOs, planogram, lead times) built by `style-actions-backend`; measures from the shared `cortex-core-computation` library. Read-only; nothing is dispatched.
- Test scope: DC S3KG (47 stores), focus stores 8080 (Trends Bandra) and 5943 (Trends Infiniti Malad), as of 29 Sep 2026. Scope is configuration, never code.
- Scale: a store holds roughly 5,000–15,000 options; lists must page, filter and stay dense.
- Geography: DC → store → option → size.

## Capabilities and Constraints

- Must preserve 24 screen responsibilities from the original Price & Margin spec and nine stock workflow jobs. These are user jobs, not a fixed route count.
- Policies, lifecycle thresholds (60 vs 90 day), margin floors, discount limits and approval thresholds in the demo are illustrative, not signed business policy.
- Null is unknown, never zero. Counts state what they count (distinct options, option-store combinations, SKUs, units).
- A demo persona selector never grants authority. Separation of duties applies.
- Terminology: "Approve movement", "Request block", "Approve block" (stops the move), "Needs reevaluation".

## Brand Commitments

Extends the incumbent Impetus design system, confirmed by the user on 2 October 2026: shared `@/components/ui` primitives, light mode only, semantic colour only, Inter, Stripe-Dashboard-like calm density (`CLAUDE.md` Design Context). The voice is clear, calm and capable: a trusted chief of staff, not an alarm.

## Evidence on Hand

- Specs: `docs/specs/style-actions-product/scope-1-real-data-foundation.md` (this release); Style Actions spec v2 and the engine flows live in `style-actions-backend/docs/spec-inputs/`.
- Store, option and sales figures are real snapshot data; the isolated test runtime uses a small hand-computed fixture. Do not fabricate images or results.

## Product Principles

1. Lead with the decision that is needed, then the evidence to make it.
2. Always show hold/do-nothing alongside alternatives, on the same scope and horizon.
3. Keep every state honest: observed, derived, engine, local illustration, unavailable.
4. Approved history never changes silently; changes create visible revisions.
5. Execution is not impact; measure against the frozen expectation.
6. Structure follows the job, not a rule about tabs. Separate tabs or pages are welcome when they hold a genuinely different job or audience; what is refused is unnecessary tabs: splitting one job's summary, list, detail and health across tabs, or adding a tab where a section, drawer or filter on the same surface would do. (User feedback, 5 Oct 2026, refining the Scope 1a "too many tabs" review: "I am not against new tabs. Just no unnecessary tabs when not needed.")

## Accessibility & Inclusion

WCAG AA. Keyboard navigation through filters, rows, dialogs and back links. Colour is never the only status signal. Works at 375, 768 and 1024+ px (repo rules in `.claude/rules/mobile-friendly-ui.md`).
