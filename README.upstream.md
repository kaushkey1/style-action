# Impetus Agentic Command Center
<!-- temp -->

An interactive web prototype for an AI-powered retail operations command center, built for Reliance Retail's Fashion & Lifestyle business.

## What is this?

A frontend-only prototype demonstrating an AI agent workforce managing retail operations across Plan, Buy, Make, Move, Sell, and Market domains. Features include:

- **Persona-driven dashboards** — 8 personas (CEO, Category Director, Ops Head, etc.) each see tailored views
- **AI Agent Workforce** — 30 agents with autonomy tiers (HA1–HA4) and human approval gates
- **Exception Management** — Cross-system exception detection with cascade chains and SLA tracking
- **Control Tower** — Per-persona KPI tabs with RAG status and drilldown tables
- **Calendar Systems** — Retail, Marketing, and Store calendars with N-day backward journey tracking
- **Three-Strike Enforcement** — Category team performance tracking with automated restructuring triggers
- **Admin Console** — Organization setup, KPI calibration, role transitions, audit logging

All data is hardcoded mock data — no backend.

## Tech Stack

React 19 + TypeScript 5.9 + Vite 7 + Tailwind CSS v4 + Radix UI + Recharts + Zustand

## Getting Started

```bash
npm install
npm run dev       # Start dev server at http://localhost:5173
```

For local env overrides, copy `env.local.example` to `.env.local`. Production/runtime config is injected into the app as `window._conf`, following the same pattern used in `storeops-frontend-app`.

## Commands

```bash
npm run dev       # Start Vite dev server
npm run build     # Type-check + production build
npm run lint      # ESLint
npm run start     # Serve dist with runtime config + /api proxy
npm run preview   # Preview production build
```

## Project Structure

```
src/
├── components/       # UI primitives, layout, feature components
├── data/             # 20 mock data files (~8,500 lines)
├── hooks/            # Zustand stores (persona, time period, toast)
├── lib/              # Utilities (cn, formatters, debounce)
├── pages/            # 23 page components (12 main + 11 admin)
├── App.tsx           # Router (23 routes)
└── index.css         # Tailwind v4 theme tokens

docs/
├── specs/            # Product specifications & user journeys
├── reference/        # KPI frameworks, RAG thresholds, org design
├── strategy/         # Business strategy documents
├── reports/          # Audit reports, gap analysis, developer handoff
├── backlog/          # Product backlog with prioritized horizons
├── architecture/     # Architecture Decision Records
├── planning/         # Active scope & sprint plans
└── archive/          # Completed sprint archives
```

## How to Create / Edit Features

This project follows a **spec-driven development lifecycle**. Every feature goes through a structured process to ensure consistency, completeness, and traceability.

### Step 1: Generate Spec
Add a prompt covering all requirements for the feature. Ask Claude to generate a detailed spec file.

### Step 2: Review Spec
Review the generated spec for:
- Missing requirements
- Errors or incorrect assumptions
- Extra steps added by the LLM that are unnecessary

Ask Claude to fix issues. Iterate until finalized. Save the final spec to `docs/specs/`.

### Step 3: Implement
Ask Claude to implement the spec in auto-edit mode. Claude reads the spec, identifies affected files, and writes code following all project rules and skills.

### Step 4: Bug / Improvement Loop
When a bug or improvement is needed:
1. Ask Claude to read the spec file for context
2. Update the spec file to describe the fix or improvement
3. Verify the spec update is correct
4. Save the updated spec
5. Implement the changes

### Step 5: Repeat
Follow this process for every requirement. The spec file is the single source of truth for what was built and why.

## Agent & Skills Architecture

### Senior Frontend Dev Agent

The primary development agent (`senior-frontend-dev`) has 7 specialized skills:

| # | Skill | Purpose |
|---|-------|---------|
| 1 | UI/UX Design | Verify designs against the design system before implementation |
| 2 | Component Design | Build components following project architecture and patterns |
| 3 | API Integration | Integrate APIs using TanStack Query with caching and type safety |
| 4 | Unit Test | Write unit tests with Vitest + React Testing Library |
| 5 | Performance Optimization | Optimize bundle size, code splitting, rendering, and Core Web Vitals |
| 6 | Security Verification | Sanitize all user inputs (forms, textareas, query params, URLs) |
| 7 | Playwright Verification | Run E2E tests post-deployment with Playwright |

### Supporting Agents

| Agent | Purpose |
|-------|---------|
| `design-enforcer` | Read-only audit of components against design system rules |
| `auditor` | Chrome DevTools MCP-based accessibility and performance audit |

Configuration lives in `.claude/agents/` and `.claude/skills/`.

## Testing

### Unit Tests (Vitest + React Testing Library)
```bash
npm run test:unit           # Run all unit tests
npm run test:unit:watch     # Watch mode
npm run test:unit:coverage  # With coverage report
```

### E2E Tests (Playwright)
```bash
npm run test:e2e            # Chromium smoke + page tests
npm run test:e2e:headed     # Headed mode (visible browser)
npm run test:e2e:cross      # Cross-browser (Chromium + Firefox + WebKit)
npm run test:e2e:mobile     # Mobile viewports (Pixel 5 + iPhone 13)
```

### Multi-Browser Testing (Playwright)

Playwright is configured for cross-browser testing across:

| Project | Engine | Viewport |
|---------|--------|----------|
| `chromium` | Chromium | Desktop (1440x900) |
| `firefox` | Firefox | Desktop (1440x900) |
| `webkit` | WebKit/Safari | Desktop (1440x900) |
| `mobile-chrome` | Chromium | Pixel 5 (393x851) |
| `mobile-safari` | WebKit | iPhone 13 (390x844) |
| `tablet` | Chromium | iPad gen 7 (810x1080) |

### Multi-Device Testing (BrowserStack / LambdaTest)

For real-device testing beyond Playwright emulation:

- **Platform**: BrowserStack or LambdaTest (via MCP integration)
- **When**: Before major releases, or for device-specific behavior validation
- **Integration**: BrowserStack MCP server for Claude-driven real-device testing

**Target device matrix**:

| Device | OS | Browser |
|--------|-----|---------|
| iPhone 15 Pro | iOS 17 | Safari |
| iPhone 14 | iOS 16 | Safari |
| Samsung Galaxy S24 | Android 14 | Chrome |
| Samsung Galaxy S23 | Android 13 | Samsung Internet |
| iPad Pro 12.9 | iPadOS 17 | Safari |
| Pixel 8 | Android 14 | Chrome |

### Design Language Verification

The `design-enforcer` agent verifies that all UI changes comply with the design system (`docs/references/ui/ui-design-system.md`). It checks:

- Border radius, padding, and spacing compliance
- Typography scale adherence
- Icon sizing by context
- Component usage (UI primitives, not raw HTML)
- Accessibility attributes on interactive elements
- Page header format

Run it after any UI change or as part of PR review.

## Agentic Workflow

This project uses Claude Code skills for structured development:

```
/backlog -> /triage -> /scope -> /sprint -> execute -> /archive-sprint
```

See `CLAUDE.md` for full details on the workflow, design system rules, and conventions.

## Documentation

| Document | Location |
|----------|----------|
| Frontend standardization spec | `docs/specs/frontend-standardization-spec.md` |
| Coding standards & design system | `CLAUDE.md` |
| Frontend best practices (rules) | `.claude/rules/frontend-best-practices.md` |
| UI design system | `docs/references/ui/ui-design-system.md` |
| UX patterns | `docs/references/ui/ux-patterns.md` |
| Developer handoff package | `docs/reports/DEVELOPER_HANDOFF.md` |
| UI audit report | `docs/reports/AUDIT_REPORT.md` |
| Primary business spec | `docs/specs/Impetus_Agentic_Command_Center_User_Journey_v2.docx` |
| Product backlog | `docs/backlog/README.md` |
