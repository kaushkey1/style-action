# Folder Structure

```text
src/
├── modules/
│   ├── admin/
│   │   ├── pages/           # 23 Admin*Page.tsx files
│   │   ├── components/      # ANRConfigEditor, CollapsibleSection, OrgSelector, etc.
│   │   ├── data/            # mockAdminData, mockGuardrails, anrConfig*, etc.
│   │   ├── stores/          # useANRAdminStore
│   │   ├── api/             # adminApi
│   │   └── route.tsx
│   │
│   ├── agents/
│   │   ├── pages/           # AgentWorkforcePage, ControlTowerPage
│   │   ├── data/            # mockAgents, mockSystems, mockControlTower
│   │   ├── api/             # controlTowerApi
│   │   └── route.tsx
│   │
│   ├── aop/
│   │   ├── pages/           # AOPDashboardPage, AOPStore*, Scenario* pages
│   │   ├── components/      # VarianceTrackerContent
│   │   ├── data/            # mockAOP*, mockScenarios
│   │   ├── stores/          # useAOPStore
│   │   ├── api/             # aopApi
│   │   └── route.tsx
│   │
│   ├── auth/
│   │   ├── pages/           # LoginPage
│   │   ├── components/      # RequireAuth, RedirectIfAuth
│   │   └── route.tsx
│   │
│   ├── calendar/
│   │   ├── pages/           # DropTrackerPage, CalendarHealth*, Marketing*, StoreCalendar*
│   │   ├── components/      # RetailCalendarJourney, MilestoneDetail, DailyCadenceStrip
│   │   ├── data/            # mockCalendar*, mockCadence, mockDrops, mockMarketing*, mockStoreCalendar
│   │   ├── stores/          # useCalendarStore
│   │   └── route.tsx
│   │
│   ├── dashboard/
│   │   ├── pages/           # DashboardPage, ConsoleHomePage, TradingWallPage, AR*Page
│   │   ├── components/      # PersonaDashboardCards, MorningBriefing, ApexCategory*, ApexGeography*
│   │   ├── data/            # mockPersonaDashboards, mockKPIs, mockAIBriefs, mockApexData, mockAR, etc.
│   │   ├── stores/          # useDashboardFilterStore
│   │   ├── api/             # dashboardApi
│   │   └── route.tsx
│   │
│   ├── docs/
│   │   ├── pages/           # DocsSpacePlanningPage
│   │   ├── components/      # DocsLayout, MarkdownRenderer
│   │   └── route.tsx
│   │
│   ├── exceptions/
│   │   ├── pages/           # ExceptionFeedPage, ApprovalQueuePage
│   │   ├── components/      # ApprovalCountdown, HumanGateCard
│   │   ├── data/            # mockExceptions, mockHumanGates
│   │   ├── stores/          # useExceptionStore, useHumanGateStore
│   │   └── route.tsx
│   │
│   ├── inventory/
│   │   ├── pages/           # InventoryLifecyclePage, InventoryActionsPage, InventoryReplenishmentPage
│   │   ├── data/            # mockAllocation, mockInventory, mockInventoryWorkflows, configs/
│   │   ├── stores/          # useInventoryFilterStore
│   │   ├── api/             # inventoryApi
│   │   └── route.tsx
│   │
│   ├── otb/
│   │   ├── pages/           # OTBDashboard*, OTBPodDetail*, OTBCalculationSheet*, Chase*, MicroDrop*, BuyPlan*, etc.
│   │   ├── components/      # OTBTabNavigation, ChaseDecisionPanel
│   │   ├── data/            # mockOTB, mockWorkingCapital, mockBuyPlan
│   │   ├── stores/          # otb.store
│   │   ├── types/           # otb.types, buyingModels
│   │   └── route.tsx
│   │
│   ├── range/
│   │   ├── pages/           # RangeArchitecture*, RangeDashboard*, RangePerformance*, RA*, StoreRange*, CarryoverDecision*, etc.
│   │   ├── components/      # HierarchyNavigator, SpacePlanningPanel, CascadeRiskPanel, BmCodeBadge, etc.
│   │   ├── data/            # mockRange*, mockCarryoverStyles, mockFixturePerformance, mockHierarchy, mockSpacePlanning, etc.
│   │   │   └── types/       # rangeArchitecture
│   │   ├── stores/          # useRangeStore
│   │   ├── api/             # rangeApi
│   │   └── route.tsx
│   │
│   ├── store-view/
│   │   ├── pages/           # StoreViewPage
│   │   ├── components/      # StoreView, StoreIntelligence*, IntelligenceCluster*, SpaceAllocation, etc.
│   │   ├── data/            # mockStoreProfiles, mockStoreSituations, mockStoreIntelligence, mockStoreData, etc.
│   │   ├── stores/          # intelligence.store, retail-planning.store, unified-planning.store
│   │   ├── types/           # storeIntelligence.types, retail-planning.types, unified-planning.types
│   │   ├── api/             # storeIntelligenceApi, insightsApi
│   │   └── route.tsx
│   │
│   └── style-bank/
│       ├── pages/           # StyleBankPage
│       ├── components/      # ShowroomLayout, ShowroomJourneyOverview, CurationWorkflow, StyleBankDashboard, etc.
│       ├── data/            # mockStyleBank, mockBrandDNA, lere27_collection.json
│       ├── stores/          # store, useShowroomCurationStore
│       ├── types/           # types, showroom-types
│       ├── api/             # api, normalizers
│       └── route.tsx
│
├── components/
│   ├── ui/                  # Shared design system primitives (33+ files), exported via index.ts
│   ├── layout/              # App shell: AppLayout, ConsoleLayout, Sidebar, TopBar, L2Panel, ConsoleSidebar
│   ├── ErrorBoundary.tsx    # App-level error boundary
│   ├── NotificationDrawer.tsx  # App-level notification UI
│   └── TimePeriodFilter.tsx    # Shared filter used across modules
│
├── data/
│   ├── kpiRegistry.ts       # Cross-cutting KPI definitions
│   ├── kpiGlossary.ts       # KPI glossary reference
│   ├── ragThresholds.ts     # Cross-cutting RAG status thresholds
│   ├── tooltipRegistry.ts   # Cross-cutting tooltip content
│   ├── canonicalStores.ts   # Shared store master list
│   └── navigationConfig.ts  # Sidebar/navigation structure
│
├── hooks/
│   ├── usePersonaStore.ts   # App-wide persona state
│   ├── useNavigationStore.ts # App-wide navigation/auth state
│   ├── useSidebarStore.ts   # App-wide sidebar state
│   ├── useTimePeriodStore.ts # App-wide time period state
│   ├── usePersonaConfig.ts  # Persona configuration
│   ├── useToast.ts          # App-wide toast notifications
│   ├── useResetOnPersonaChange.ts # Cross-cutting persona reset
│   ├── useApiData.ts        # Generic data-fetching hook
│   ├── useFilters.ts        # Generic filter hook
│   ├── useSearch.ts         # Generic search hook
│   ├── useSort.ts           # Generic sort hook
│   ├── useSelection.ts     # Generic selection hook
│   ├── useListState.ts     # Generic list state hook
│   └── usePagination.ts    # Generic pagination hook
│
├── lib/
│   ├── utils.ts             # Canonical utilities (cn(), formatters, etc.)
│   └── api.ts               # Shared API base (fetch wrapper, headers)
│
├── pages/
│   └── PlaceholderPage.tsx  # Catch-all for unbuilt product routes
│
├── routes.tsx               # Central route composition (imports all module routes)
├── App.tsx                  # App shell: providers, auth wrapper, route rendering
├── main.tsx                 # React entry point
├── environment.ts           # Runtime environment config
└── index.css                # Tailwind v4 @theme tokens, base styles, animations
```

## Module Convention

Each module under `src/modules/<name>/` is a self-contained business domain:

| Directory | Contents |
|-----------|----------|
| `pages/` | Route-level page components |
| `components/` | Feature-specific UI components |
| `data/` | Mock data files with co-located TypeScript types |
| `stores/` | Zustand stores for domain state |
| `types/` | Domain-specific TypeScript types (when not co-located in data) |
| `api/` | Domain-specific API client functions |
| `route.tsx` | Route definitions for this module |

## Import Rules

1. **Intra-module**: Use relative imports (`../data/mockOTB`, `./ChaseDecisionPanel`)
2. **Cross-module**: Use `@/modules/<module>/...` (`@/modules/otb/data/mockOTB`)
3. **Shared code**: Use `@/` prefix (`@/components/ui`, `@/hooks/usePersonaStore`, `@/lib/utils`)
4. **Modules must not import other modules' internal components** — data/type imports are acceptable when needed

## What Lives Where

- **Module-specific** pages, components, data, stores, API clients, types → `src/modules/<name>/`
- **App-wide** stores (persona, navigation, sidebar, time period) → `src/hooks/`
- **Generic reusable** hooks (filters, search, sort, pagination) → `src/hooks/`
- **Cross-cutting config** (KPIs, RAG thresholds, navigation) → `src/data/`
- **Design system** primitives → `src/components/ui/`
- **App shell** layout → `src/components/layout/`
- **Shared utilities** → `src/lib/utils.ts`
- **Shared API base** → `src/lib/api.ts`
