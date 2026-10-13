---
name: Impetus Agentic Command Center
description: Calm, dense, light-mode operations workspace for Reliance Retail Fashion & Lifestyle; the Style Actions product extends it unchanged.
colors:
  indigo-primary: "#6366f1"
  indigo-primary-deep: "#4f46e5"
  indigo-wash: "#eef2ff"
  ember-secondary: "#F97316"
  ember-secondary-deep: "#c2410c"
  success: "#10B981"
  warning: "#F59E0B"
  error: "#EF4444"
  error-deep: "#dc2626"
  status-green-ink: "oklch(52.7% 0.154 150.069)"
  status-green-wash: "oklch(96.2% 0.044 156.743)"
  status-amber-ink: "oklch(55.5% 0.163 48.998)"
  status-amber-wash: "oklch(96.2% 0.059 95.617)"
  status-amber-edge: "oklch(92.4% 0.12 95.746)"
  status-amber-deep-ink: "oklch(47.3% 0.137 46.201)"
  status-amber-mist: "oklch(98.7% 0.022 95.277)"
  status-red-ink: "oklch(50.5% 0.213 27.518)"
  status-red-wash: "oklch(93.6% 0.032 17.717)"
  status-blue-ink: "oklch(48.8% 0.243 264.376)"
  status-blue-wash: "oklch(93.2% 0.032 255.585)"
  paper-white: "#ffffff"
  ground-gray: "oklch(98.5% 0.002 247.839)"
  wash-gray: "oklch(96.7% 0.003 264.542)"
  hairline-gray: "oklch(92.8% 0.006 264.531)"
  control-edge-gray: "oklch(87.2% 0.01 258.338)"
  hint-gray: "oklch(70.7% 0.022 261.325)"
  muted-ink: "oklch(55.1% 0.027 264.364)"
  secondary-ink: "oklch(44.6% 0.03 256.802)"
  body-ink: "oklch(37.3% 0.034 259.733)"
  heading-ink: "oklch(21% 0.034 264.665)"
typography:
  headline:
    fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: "2rem"
  figure:
    fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: "1.5rem"
    fontFeature: "\"tnum\""
  drawer-title:
    fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: "1.5rem"
  title:
    fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: "1.25rem"
  body:
    fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: "1.25rem"
  label:
    fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: "1rem"
  meta:
    fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: "1rem"
  mono:
    fontFamily: "ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: "1rem"
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  full: "9999px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "6": "24px"
components:
  button-primary:
    backgroundColor: "{colors.indigo-primary}"
    textColor: "{colors.paper-white}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "0 16px"
    height: "40px"
  button-primary-hover:
    backgroundColor: "{colors.indigo-primary-deep}"
  button-outline:
    backgroundColor: "{colors.paper-white}"
    textColor: "{colors.body-ink}"
    rounded: "{rounded.lg}"
    padding: "0 12px"
    height: "32px"
  button-outline-hover:
    backgroundColor: "{colors.ground-gray}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.body-ink}"
    rounded: "{rounded.lg}"
    padding: "0 12px"
    height: "32px"
  button-ghost-hover:
    backgroundColor: "{colors.wash-gray}"
  button-secondary:
    backgroundColor: "{colors.ember-secondary-deep}"
    textColor: "{colors.paper-white}"
    rounded: "{rounded.lg}"
    padding: "0 16px"
    height: "40px"
  button-destructive:
    backgroundColor: "{colors.error}"
    textColor: "{colors.paper-white}"
    rounded: "{rounded.lg}"
    padding: "0 16px"
    height: "40px"
  card:
    backgroundColor: "{colors.paper-white}"
    textColor: "{colors.heading-ink}"
    rounded: "{rounded.lg}"
    padding: "12px"
  input-search:
    backgroundColor: "{colors.paper-white}"
    textColor: "{colors.heading-ink}"
    typography: "{typography.meta}"
    rounded: "{rounded.lg}"
    padding: "0 12px 0 32px"
    height: "32px"
  toggle-group:
    backgroundColor: "{colors.paper-white}"
    rounded: "{rounded.lg}"
    padding: "4px"
  toggle-item:
    backgroundColor: "transparent"
    textColor: "{colors.muted-ink}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "32px"
  toggle-item-selected:
    backgroundColor: "{colors.wash-gray}"
    textColor: "{colors.heading-ink}"
  badge-success:
    backgroundColor: "{colors.status-green-wash}"
    textColor: "{colors.status-green-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
  badge-warning:
    backgroundColor: "{colors.status-amber-wash}"
    textColor: "{colors.status-amber-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
  badge-error:
    backgroundColor: "{colors.status-red-wash}"
    textColor: "{colors.status-red-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
  badge-info:
    backgroundColor: "{colors.status-blue-wash}"
    textColor: "{colors.status-blue-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
  badge-neutral:
    backgroundColor: "{colors.wash-gray}"
    textColor: "{colors.body-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
  table-header:
    backgroundColor: "{colors.ground-gray}"
    textColor: "{colors.muted-ink}"
    typography: "{typography.label}"
    padding: "8px 12px"
  table-cell:
    backgroundColor: "{colors.paper-white}"
    textColor: "{colors.body-ink}"
    typography: "{typography.meta}"
    padding: "8px 12px"
  table-row-selected:
    backgroundColor: "{colors.indigo-wash}"
  tooltip:
    backgroundColor: "{colors.heading-ink}"
    textColor: "{colors.paper-white}"
    typography: "{typography.meta}"
    rounded: "{rounded.lg}"
    padding: "6px 12px"
  sheet:
    backgroundColor: "{colors.paper-white}"
    textColor: "{colors.heading-ink}"
    width: "576px"
  provenance-chip-observed:
    backgroundColor: "transparent"
    textColor: "{colors.body-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: "1px 6px"
  provenance-chip-derived:
    backgroundColor: "transparent"
    textColor: "{colors.secondary-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: "1px 6px"
  provenance-chip-provisional:
    backgroundColor: "{colors.status-amber-mist}"
    textColor: "{colors.status-amber-deep-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: "1px 6px"
  provenance-chip-unavailable:
    backgroundColor: "{colors.ground-gray}"
    textColor: "{colors.muted-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: "1px 6px"
---

# Design System: Impetus Agentic Command Center

This file is a token-bearing digest of the incumbent Impetus design system as the code ships it (`src/index.css` `@theme`, Tailwind v4 defaults, and the primitives in `src/components/ui/`). The usage rulebooks remain `docs/references/ui/ui-design-system.md` and `docs/references/ui/ux-patterns.md`; where those documents and the shipped primitives disagree, the values below follow the code. Patterns marked *(Style Actions extension)* were introduced by the Style Actions product (`src/modules/style-actions-product/`) inside this system and are reused across its components; they add vocabulary without changing any incumbent token.

## Overview

**Creative North Star: "The Trusted Chief of Staff"**

The work is already done and laid out in order: white panels resting on a pale gray ground, separated by hairlines rather than shadows, with one quiet indigo voice for anything a person can touch. The reference point is a Stripe-like dashboard: clean Inter typography, a clear data hierarchy, tasteful status colour, and density that comes from discipline instead of clutter. Nothing on screen is decorative. If an element does not help someone understand the state of the business or act on it, it is not there.

Density is high and calm. Body copy sits at 14px and metadata at 12px; numbers set in tabular figures so columns line up; cards pad at 12px or 16px and grids gap at 12px. Summary comes first and detail sits one click away, usually in a right-hand sheet so the list underneath keeps its place. Status is measured, never alarming: green, amber and red appear only to mean something, always with words beside them, and red is used sparingly.

The system is light mode only. It uses no illustration, no emoji, no gradients and no playful motion.

**Key Characteristics:**
- White panels (`paper-white`) on a `ground-gray` page, separated by `hairline-gray` borders, flat at rest.
- One interactive colour: indigo for actions, focus, links and selection; never decorative and never in data text.
- Semantic status palette (green, amber, red, blue info) delivered through badges, always paired with text.
- Inter at 12/14px with tabular figures for every number in a column or figure.
- One radius (8px) for cards, buttons, inputs, sheets and tooltips; full pills only for badges and chips.
- Detail on demand through right-hand sheets and tooltips, not separate pages.

## Colors

A neutral, cool-gray world with one indigo accent for interaction and a strictly semantic status palette.

### Primary
- **Command Indigo** (`indigo-primary`): primary buttons, links, active tab underlines, switch-on state, focus rings (at 20% alpha), and the selected-row tint. It marks what can be touched or what is currently chosen.
- **Pressed Indigo** (`indigo-primary-deep`): hover state of the primary button.
- **Indigo Wash** (`indigo-wash`): selected list and table rows (primary at roughly 10% tint), active filter backgrounds.

### Secondary
- **Ember Orange** (`ember-secondary`, button fill `ember-secondary-deep`): accent or promotional calls to action only, used sparingly. The secondary button fills with the deeper step for contrast with white text.

### Tertiary
- **Status palette.** Success (`success`), warning (`warning`) and error (`error`, hover `error-deep`) are the theme tokens behind destructive buttons, toast accents and success empty states. Badges and inline status use the Tailwind pairs: green (`status-green-ink` on `status-green-wash`), amber (`status-amber-ink` on `status-amber-wash`), red (`status-red-ink` on `status-red-wash`) and blue for information (`status-blue-ink` on `status-blue-wash`).

### Neutral
- **Paper White** (`paper-white`): every card, panel, table body, sheet and input.
- **Ground Gray** (`ground-gray`): the page background, table headers, disabled inputs, and button-outline hover.
- **Wash Gray** (`wash-gray`): ghost-button hover, neutral badges, selected segmented-control items, track of progress and mix bars.
- **Hairline Gray** (`hairline-gray`): the default border for cards, panels, tables and inputs (applied globally to every element).
- **Divider** (the `wash-gray` value reused as a line): row dividers inside tables and lists, sheet section rules, card footers.
- **Control Edge** (`control-edge-gray`): outline buttons and outline badges.
- **Heading Ink** (`heading-ink`): page titles, section titles, key figures, tooltip background.
- **Body Ink** (`body-ink`): body text and table cell values.
- **Secondary Ink** (`secondary-ink`): supporting lines in dense rows.
- **Muted Ink** (`muted-ink`): subtitles, hints, table headers, placeholders that must meet contrast.
- **Hint Gray** (`hint-gray`): non-essential metadata and decorative icons only; never text that carries meaning.

### Named Rules
**The Indigo Means Touch Rule.** Indigo appears only on things a person can act on or has selected: buttons, links, focus rings, active tabs, selected rows. It never colours data values, table text or headings (`text-indigo-*` is lint-banned in application code).

**The Status Speaks in Words Rule.** Green, amber and red always travel with a text label. A status state is a `Badge`; a coloured number is allowed only when it states direction or a count that needs attention, at the 700 step, with medium or semibold weight, never bold.

**The No Decoration Rule.** No colour is ever chosen to make something prettier. If a colour cannot be named by its meaning, remove it.

## Typography

**Display Font:** none; the system has no display face.
**Body Font:** Inter (with system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial)
**Label/Mono Font:** ui-monospace stack, used only for code and identifiers in tooling views.
**Hosting:** the main app loads Inter (400, 500, 600, 700) from Google Fonts in `index.html`. The Style Actions dev and test host (`style-actions.html`) self-hosts the same four weights of Inter 4.1 from `public/fonts/` under the SIL Open Font License (`public/fonts/OFL.txt`), because its test runner forbids third-party origins *(Style Actions extension, decision F-D7)*.

**Character:** One neutral grotesque, carried at small sizes with weight doing the hierarchy work. It reads as a working instrument, not a publication.

### Hierarchy
- **Headline** (700, 24px, 32px line): the page title in `PageHeader`, and large hero KPI values on dashboard cards.
- **Figure** (600, 18px, 24px line, tabular figures): dense summary figures in strips and detail measures where several figures share a row.
- **Drawer Title** (600, 16px, 24px line): the title of a right-hand sheet.
- **Title** (600, 14px, 20px line): card titles, section headers, panel headings. Card titles are never larger than this.
- **Body** (400, 14px, 20px line): body text, list primary lines, button text.
- **Label** (500, 12px, 16px line): badge text, table headers, input labels at compact density.
- **Meta** (400, 12px, 16px line): hints, secondary row lines, timestamps, table cells in the `DataTable` family.

### Named Rules
**The Tabular Figures Rule.** Every number that sits in a column, a figure tile or a ranked list uses tabular figures so digits align. Unknown values render as an em dash, never as zero.

**The Two-Step Floor Rule.** Readable content never drops below 12px, and body copy on mobile stays at 14px. Hierarchy comes from weight and ink, not from more sizes.

## Layout

Pages are a single column of stacked panels. The app shell pads the content area; inside a page, major sections stack with 12px to 16px between them and grids gap at 12px. Cards pad at 12px for dense panels and 16px for standard ones; 24px is reserved for modal bodies and the app shell, and 32px only for empty states.

Layout is mobile first with breakpoints at 430px (`xs`), 640px, 768px, 1024px and 1280px. Grids start at one column and widen (`1 → 2 → 3/4`). Data tables scroll horizontally inside their card with a stated minimum width; below 768px dense tables switch to stacked row cards. Side-by-side panel rows (for example three attention panels) stack below 768px and show fewer rows so the primary list stays within reach. Touch targets reach 44px on touch widths and relax to the compact 32px control height from 768px or 1024px up. Breadcrumbs appear only from 1024px.

Inline summaries use plain 12px muted text with middle-dot separators (`·`) rather than extra tiles.

### Named Rules
**The Gap-3 Rule.** 12px is the unit of rhythm: grid gaps, dense card padding, the space between stacked panels. Larger gaps need a reason.

**The Place-Keeping Rule.** Detail opens beside the list (right sheet, tooltip) so the list keeps its scroll position, filters and selection.

## Elevation & Depth

The system is flat at rest and separates surfaces with hairline borders and the white-on-gray contrast. Shadows exist only as a response: clickable cards lift slightly on hover, and overlays (sheets, tooltips, toasts, dialogs) sit above a dimmed, lightly blurred backdrop. Focus is shown with a soft indigo ring, not elevation.

### Shadow Vocabulary
- **Hover lift** (`box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)`): standard clickable card on hover, with the border shifting toward indigo.
- **Soft lift** (`box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)`): list cards on hover, the active pill inside a default tab list.
- **Floating** (`box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)`): tooltips and toasts.
- **Overlay** (`box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)`): right-hand sheets, over a 40% black backdrop with a small blur.

### Named Rules
**The Flat-At-Rest Rule.** No surface carries a shadow until it is hovered, floating or modal. Panels in a page are told apart by border and spacing alone.

## Shapes

One gently rounded corner (8px) is the house shape: cards, panels, buttons, inputs, selects, sheets' inner controls, tooltips and empty-state containers. Segmented-control items and tab pills step down to 6px so they nest inside an 8px container; skeleton blocks use 6px. Fully round pills belong to badges, chips, avatars, switch thumbs and thin progress or mix bars. Larger radii are defined as tokens but are not used for standard components.

Borders are 1px hairlines. A dashed edge has a meaning *(Style Actions extension)*: it marks something not directly observed, such as a derived value's chip, a placeholder for evidence the source does not hold, an option code that is only a colour, or an unknown lifecycle bucket.

### Named Rules
**The One Radius Rule.** 8px everywhere a component has corners; nest at 6px; pills only for labels.

**The Dashed Means Not Observed Rule.** *(Style Actions extension)* Solid edges are observed facts. Dashed edges are derived, unknown or missing. Never dash a border for ornament.

## Components

### Buttons
Restrained and certain: one primary per section, everything else steps down.
- **Shape:** gently rounded (8px).
- **Primary:** indigo fill, white 14px medium text, 40px tall (32px small, 48px large), 16px side padding; hover deepens the indigo.
- **Hover / Focus:** colour transitions only, a slight press scale (0.97) on activation, and a 4px soft ring on keyboard focus; disabled at 50% opacity.
- **Outline:** white with a `control-edge-gray` border and body ink; the default secondary action (Cancel, Retry, Previous/Next).
- **Ghost:** transparent with body ink, wash-gray on hover; tertiary and inline actions, including whole-row buttons inside ranked lists.
- **Secondary / Destructive / Outline-destructive:** deep orange fill for rare accents; red fill for destructive actions behind confirmation; red outline for reject-style actions.

### Chips and Badges
- **Style:** fully round, 12px medium text, tinted wash with the matching 700-step ink (`badge-*`), or an outline badge with a control-edge border for neutral facts such as an as-of date.
- **State:** badges are never interactive. Extra context comes from a tooltip; actions sit in a button beside the badge.

### Cards / Containers
- **Corner Style:** 8px.
- **Background:** paper white on the ground-gray page.
- **Shadow Strategy:** flat; hover lift only when the whole card is clickable (see Elevation & Depth).
- **Border:** 1px hairline gray.
- **Internal Padding:** 12px for dense panels, 16px for standard cards; titles at the Title step with a 12px muted hint line beneath.

### Inputs / Fields
- **Style:** white field, 1px hairline border, 8px radius; compact search fields are 32px tall with 12px text and a 14px leading search icon.
- **Focus:** border shifts to indigo with a 2px indigo ring at 20% alpha, shown for keyboard focus only.
- **Error / Disabled:** error border and ring in the error token with a linked message; disabled fields take the ground-gray fill and a not-allowed cursor.

### Navigation
- **Segmented control (`ToggleGroup`):** an 8px bordered container with 4px padding; items are 6px-radius, muted ink, and turn wash-gray with heading ink when selected. Counts sit inside the item in muted tabular figures.
- **Tabs:** underline variant uses an indigo 2px underline and indigo label for the active tab; never more than five tabs in a row.
- **Page header:** title plus inline badges and right-aligned actions; no icons or subtitles in the header.

### Data Table
- 12px text, ground-gray header row with muted medium labels, 8px by 12px cells, divider-gray row rules, right-aligned numeric columns in tabular figures.
- Clickable rows take a ground-gray hover, are keyboard focusable with an inset indigo focus ring, and show selection with the indigo wash.
- Cell text stays neutral (heading, body, secondary, muted ink); only directional values may carry status colour.

### Sheet (Detail Drawer)
- Right-hand panel 576px wide by default (the Style Actions option drawer widens to 672px; full width on mobile) over a dimmed, blurred backdrop, with a 16px semibold title, a 14px muted description, a hairline under the header, and 16px body padding. Sections inside are separated by a divider-gray rule with a Title-step heading.

### Tooltip
- Heading-ink background, white 12px text, 8px radius, floating shadow, at most 320px wide. On touch devices it opens on tap.

### Provenance Chip *(Style Actions extension)*
- A small round chip (12px medium, 1px by 6px padding) stating where a value comes from, with a tooltip and a screen-reader explanation: **Observed** solid control-edge border with body ink; **Derived** dashed border with secondary ink; **Provisional** pale amber fill (`status-amber-mist`), amber edge (`status-amber-edge`) and deep amber ink (`status-amber-deep-ink`); **Unavailable** ground-gray fill with muted ink. One chip covers a group of measures; an individual measure carries its own chip only when it differs.

### Store Selector *(Style Actions extension)*
- One searchable `FilterSelect` in the header, every store with equal weight, labelled "code · name · city". It opts into the shared control's width props (`labelClassName`, `panelClassName`, `optionLabelClassName`) so the trigger shows the full label at 448px from 1024px and the list is exactly as wide; on phones the bottom-sheet list wraps full names and the trigger truncates. Beside it, at every width, a 12px muted count ("212 stores with data · 59 without", the second part omitted when it is zero) and a ghost toggle ("Show 59 stores with no data" / "Hide stores with no data", `aria-pressed`), with a one-line muted reason below them ("Stores with no stock or sales rows in this snapshot are hidden.") that the toggle references through `aria-describedby`. Copy about such stores states what the snapshot's rows show, never that the store held or sold nothing. Stores without data are hidden by default and marked "no data" when shown; one opened by link shows an empty state with an Open Data health action instead of a page of zeros.

### Ranked Attention List *(Style Actions extension)*
- A card at 12px padding holding a title, a one-line muted hint, and up to five whole-row ghost buttons separated by divider-gray rules: a 14px medium identifier and a 12px muted meta line on the left, a 14px semibold tabular figure on the right, and a ghost "See all" footer above a divider. Three cards share a row from 768px and stack, three rows each, below it.

## Do's and Don'ts

### Do:
- **Do** import every primitive from the `@/components/ui` barrel and use the compounds (`PageHeader`, `SectionHeader`, `FilterBar`, `MetricGrid`, `EmptyState`, `ListItemCard`) for the layouts they own.
- **Do** pad cards at 12px or 16px and gap grids at 12px.
- **Do** use 8px corners on every cornered component.
- **Do** express status with a `Badge` and a word; colour a number only for direction or an attention count, at the 700 step.
- **Do** set every number in a column or figure in tabular figures, and render unknown values as an em dash.
- **Do** give every data view loading, empty, error (with retry) and success states.
- **Do** open detail in a right sheet or tooltip so the list keeps its place.
- **Do** take chart colours from `src/data/chartColors.ts` (data and chrome constants), wrap charts in `ResponsiveContainer`, and hide the Y axis on mobile.
- **Do** make touch targets 44px on touch widths and respect reduced motion for every animation.

### Don't:
- **Don't** use a dark theme, gradients, illustrations, emoji or playful motion.
- **Don't** use corners larger than 8px on standard components (`rounded-xl` and above are lint-banned), or card padding above 16px.
- **Don't** colour table cell text, headings or data values indigo.
- **Don't** express status with a coloured left border, a standalone coloured dot, bold coloured label text, or a tinted row background; legend dots in charts and mix bars are the exception.
- **Don't** make a badge clickable.
- **Don't** use `text-gray-200`/`text-gray-300` for text, or hint gray for anything that carries meaning.
- **Don't** put more than five tabs in a row.
- **Don't** add shadows to panels at rest.
- **Don't** use text glyphs as icons; icons come from Lucide.
