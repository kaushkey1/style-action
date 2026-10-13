# Prototype Sandbox Rules

You are working in the **prototype sandbox** (`src/prototypes/`). These rules replace the strict production rules when editing files in this directory.

## Scope

**ONLY edit files inside `src/prototypes/`.** Never modify production code, config files, or anything outside this directory.

## What's Relaxed

- **TypeScript**: `any` is OK. No explicit return types required. Unused variables are fine.
- **ESLint**: Prototypes are excluded from linting entirely.
- **Tests**: No tests required. No coverage thresholds.
- **SDLC Pipeline**: No spec, no dev docs, no EM review, no code review. Just build and preview.
- **Accessibility**: Not enforced (but UI components from `@/components/ui` retain their built-in a11y).
- **Responsive**: Not enforced, but encouraged.

## What's Still Required

- **No production edits**: Never modify files outside `src/prototypes/`.
- **No package installs**: Use only existing dependencies.
- **No config changes**: Don't modify `package.json`, `tsconfig*.json`, `eslint.config.js`, `vite.config.ts`, etc.

## Available UI Components

Import from `@/components/ui`:

**Layout & Structure**: `Card`, `CardHeader`, `CardTitle`, `CardContent`, `CardFooter`, `PageHeader`, `SectionHeader`, `MetricGrid`, `ListItemCard`, `EmptyState`

**Form Controls**: `Button`, `Input`, `Select`, `SelectItem`, `SelectTrigger`, `SelectContent`, `SelectValue`, `Checkbox`, `Switch`, `Slider`

**Data Display**: `Badge`, `MetricCard`, `KpiLabel`, `DataTable`, `DataTableHeader`, `DataTableBody`, `DataTableRow`, `DataTableHead`, `DataTableCell`, `Pagination`

**Feedback**: `Toast`, `ToastProvider`, `Spinner`, `Progress`, `CircularProgress`, `PageSkeleton`, `Skeleton`

**Overlays**: `Modal`, `ModalFooter`, `DetailPanel`, `BottomSheet`, `Sheet`, `ConfirmDialog`, `DropdownMenu`

**Navigation**: `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`

**Tooltips**: `Tooltip`, `TooltipTrigger`, `TooltipContent`, `TooltipProvider`

**Filters**: `FilterBar`, `FilterSelect`, `FilterMultiSelect`, `FilterSearch`, `FilterDateRange`, `FilterClear`, `FilterPills`

**Charts**: `ChartContainer`, `ChartTooltip`, `ChartTooltipContent`, `ChartLegend`, `ChartLegendContent`

## Available Utilities

Import from `@/lib/utils`:

- `cn()` — Tailwind class merging (use this for conditional classes)
- `formatCurrency()`, `formatNumber()`, `formatPercent()` — number formatting
- `debounce()`, `sleep()` — timing utilities

## CAN Import From Production

```tsx
// UI components
import { Button, Badge, Card } from '@/components/ui'

// Utilities
import { cn, formatCurrency } from '@/lib/utils'

// Shared mock data
import { kpiRegistry } from '@/data/kpiRegistry'

// Module mock data (read-only)
import { mockExceptions } from '@/modules/exceptions/data/mockExceptions'

// Types
import type { ExceptionItem } from '@/modules/exceptions/data/mockExceptions'
```

## CANNOT

- Modify any file outside `src/prototypes/`
- Install, remove, or upgrade npm packages
- Edit config files (`package.json`, `tsconfig*.json`, `eslint.config.js`, etc.)
- Import from `src/prototypes/` in production code (blocked by ESLint)

## Creating a New Prototype

1. **Copy the example**: `cp -r src/prototypes/_example src/prototypes/your-concept`
2. **Edit `Page.tsx`** with your layout, components, and mock data
3. **Register it** in `src/prototypes/registry.ts`:
   ```ts
   {
     name: 'your-concept',
     title: 'Your Concept',
     description: 'One-line description of what this explores.',
     author: 'Your Name',
     date: '2026-04-17',
     component: lazy(() => import('./your-concept/Page')),
   },
   ```
4. **Run**: `npm run prototype`
5. **Open**: `https://localhost:5174` (or `http://` if no certs)

## Tech Stack Available

- React 19 with hooks
- Tailwind CSS v4 (all design tokens from `src/index.css`)
- Recharts for charts
- Lucide React for icons (`import { IconName } from 'lucide-react'`)
- React Router DOM for navigation within your prototype
- Zustand for local state (if needed)
- React Hook Form + Zod for forms (if needed)
