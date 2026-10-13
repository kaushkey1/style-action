# Space Planning User Guide

## Overview

Space Planning is the module that translates demand intelligence into physical store layouts. It determines how much space each merchandise segment, brand, and fixture type should receive based on Gross Margin Return on Footage (GMROF) optimization.

The module operates across three levels: individual store allocation, category-level performance analysis, and network-wide capacity planning.

## Key Metrics and Terminology

| Metric | Definition | Formula |
|--------|-----------|---------|
| GMROF | Gross Margin Return on Footage | GM / Allocated SFT |
| SPSF | Sales Per Square Foot | Net Sales / Saleable Area |
| MDQ | Minimum Display Quantity | Minimum stock per fixture type |
| LFT | Linear Feet | Fixture display capacity measure |

### Store Grades

Stores are classified into grades based on their sales and profit performance:

- **A (HSHP)**: High Sales, High Profit — flagship stores with the highest SPSF and GMROF targets
- **A1 (HSLP)**: High Sales, Low Profit — volume leaders requiring margin optimization
- **A2 (LSHP)**: Low Sales, High Profit — efficient stores with room for revenue growth
- **A3 (LSLP)**: Low Sales, Low Profit — optimization candidates requiring space rebalancing

### Fashion Grades

The 70/30 rule governs fashion mix: Core and Ultimate grades must comprise at least 70% of merchandise, while Fashion and Fast Fashion are capped at 30%.

- **Core (45-50%)**: Evergreen styles with auto-replenishment and 30-day stock cover
- **Ultimate (20-25%)**: Premium styles with auto-replenishment and 30-day stock cover
- **Fashion (15-20%)**: Seasonal styles with one-time buy and 60-day window
- **Fast Fashion (5-10%)**: Trend-driven styles with one-time buy and 45-day window

## Admin Setup

### Fixture Type Master

The Fixture Type Master defines all 12 fixture types used across the store network. Each fixture type has a code, capacity range (options x size set = quantity per fixture), linear feet measurement, and display method.

![Admin Fixtures Configuration](/docs/space-planning/admin-fixtures.png)

Navigate to **Admin > Fixtures** to configure:
- **Fixture Types**: 4-Way Rack, Straight Rack (4ft/6ft), Wall Unit (4ft/8ft), Gondola (4ft/8ft), Nested Table, Display Table, Mannequin Platform, Waterfall Arm, Slatwall Panel
- **Store Assignments**: Which fixture types are deployed at each store
- **Fixture Coding**: Convention format: `{Store}-{Floor}-{Segment}-{FixtureType}-{Sequence}` (e.g., `PHX-GF-MC-SR6-001`)
- **Space Norms**: Standard spacing rules (900mm between fixtures, 1200mm main aisles, 1800mm decompression zone, 65% saleable area ratio)

### Store Grades Configuration

![Store Grades Configuration](/docs/space-planning/admin-store-grades.png)

Store grades determine SPSF and GMROF targets. Navigate to **Admin > Store Grades** to view and configure grade assignments with performance thresholds.

Each grade has defined SPSF bands:
- **A**: Floor Rs775, Target Rs900, Stretch Rs950
- **A1**: Floor Rs640, Target Rs770, Stretch Rs820
- **A2**: Floor Rs450, Target Rs560, Stretch Rs620
- **A3**: Floor Rs340, Target Rs430, Stretch Rs480

### GMROF Thresholds and SPSF Targets

![GMROF and SPSF Configuration](/docs/space-planning/admin-space-planning.png)

Navigate to **Admin > Space Planning** to configure:

- **GMROF Thresholds**: Module rebalance trigger (1.2x), segment expansion trigger (>15% for 2 months), external brand exit threshold (<70% for 2 quarters), external brand mix floor/ceiling (15-40%)
- **Fashion Grade Rules**: Target percentage ranges per grade with stock cover and replenishment type
- **SPSF Targets**: Per-grade current, target, stretch, and floor values with RAG status thresholds

## Store Space Dashboard

Navigate to **Plan > Space Planning** in the sidebar, then select a store from the picker.

### Overview Tab

![Overview Tab](/docs/space-planning/overview-tab.png)

The Overview tab provides a comprehensive view of store space allocation:

- **Summary Metrics**: Carpet area, saleable area (with ratio), fixtures, options, garments, SPSF (with RAG status), and GMROF
- **Saleable Area Breakdown**: Deduction tree showing how carpet area converts to net saleable area (entry decompression, main aisles, trial rooms, cash counters, stockroom/staff)
- **Capacity Summary**: Total fixtures, option capacity, garment capacity, and stocking density (pcs/SFT)
- **Segment Space Map**: Visual treemap showing proportional space allocation per segment with GMROF values
- **Segment Details Table**: Full breakdown with SFT, Space%, NSV%, Efficiency, GMROF, Fixtures, Options, and Garments per segment
- **GMROF Bar Chart**: Horizontal bar chart comparing GMROF across segments with store average reference line
- **Stocking Density**: Current density vs target with RAG status deviation indicator
- **MDQ Compliance**: Fixture-level table showing stock vs minimum display quantity with status badges

Click any segment row to expand the **Brand Allocation Panel**, showing brand-level GMROF breakdown with PL/EB type, tier, and expansion/exit indicators.

### Fixture Capacity Tab

![Fixtures Tab](/docs/space-planning/fixtures-tab.png)

View all fixtures grouped by segment with:
- Fixture code (following the coding convention), type, and brand assignment
- Current quantity vs maximum capacity
- Linear feet per fixture
- Utilization percentage with color-coded progress bar (green >80%, amber 60-80%, red <60%)

### SPSF Optimization Tab

![SPSF Tab](/docs/space-planning/spsf-tab.png)

A semicircular gauge showing current SPSF vs target with color-coded zones:
- **Red**: Below floor — immediate intervention needed
- **Amber**: Below target — optimization opportunities exist
- **Green**: On target — maintain current allocation
- **Blue**: Above stretch — potential for expansion or reallocation

Five optimization levers with current state, recommended action, and projected impact:
1. GMROF Rebalancing (+Rs12-18/SFT)
2. Segment Reallocation (+Rs8-14/SFT)
3. Fixture Density optimization (+Rs5-10/SFT)
4. ASP Mix Optimization (+Rs6-9/SFT)
5. Option Rationalization (+Rs4-8/SFT)

### Fashion Grade Split Tab

![Fashion Split Tab](/docs/space-planning/fashion-split-tab.png)

Monitor the 70/30 fashion grade compliance:
- **Stacked bar chart**: Actual Core+Ultimate vs Fashion+Fast Fashion with 70% target line
- **Compliance badge**: Green "Compliant" or red "Non-Compliant" at store level
- **Per-segment validation table**: Each segment's grade breakdown with individual compliance status

### Allocation Process Tab

![Process Tab](/docs/space-planning/process-tab.png)

The 8-step allocation process shows the complete workflow for a store:

1. **Compute Store GMROF** — Calculate store-level margin density
2. **Compute Segment GMROF** — Rank segments by margin contribution
3. **Compute Brand GMROF** — Rank brands within each segment
4. **Set Fixture Allocation** — Distribute fixtures based on GMROF rankings
5. **Apply Fixture Capacity** — Validate no fixtures exceed maximum capacity
6. **Apply Fashion Grade Split** — Ensure 70/30 compliance
7. **Compute Projected SPSF** — Calculate expected SPSF after allocation
8. **Iterate & Optimize** — Review and apply recommendations

Each step displays a status badge (Complete, Warning, In Progress), output summary, and expandable computation details.

## Category View

### Category Space Performance

![Category Space Performance](/docs/space-planning/category-space.png)

View category-level space metrics across the store network:
- Space allocation by store with SFT, GMROF, and efficiency
- Store-by-store comparison table with Expand/Hold/Contract/Review status
- Brand penetration analysis showing PL vs EB coverage
- Hierarchy coverage assessment at Segment, Class, Brick, and Fashion Grade levels

### Space Recommendations

![Space Recommendations](/docs/space-planning/recommendations.png)

AI-generated recommendations grouped by type:
- **Module-Level Adjustments**: Cross-segment space rebalancing (e.g., transfer fixtures between brands)
- **Segment-Level Adjustments**: Within-segment optimization (e.g., reduce underperforming segment allocation)
- **Brand Exit / Replace**: Underperforming brand recommendations (e.g., exit brands below 70% of segment avg GMROF)

Each recommendation shows trigger condition, constraint, projected impact, and SPSF delta. Click **Simulate** on any recommendation to see a side-by-side before/after comparison with projected impact on GMROF and SPSF.

## Network View

![Network View](/docs/space-planning/network-view.png)

The Network Space Dashboard provides a bird's eye view:
- **Total Network Capacity**: 15M garments across all stores, broken down by grade (A: 34%, A1: 28%, A2: 21%, A3: 17%)
- **Grade-Level Metrics**: Stores per grade, FY revenue, monthly units, in-store stock, and per-store allocation
- **SPSF Heatmap**: Visual comparison of SPSF performance across the store network
- **Activity Log**: Recent space planning actions and decisions

## Cross-Cutting Integration

### Exceptions

Space planning exceptions surface in the Exception feed when:
- GMROF drops below minimum threshold for a segment or brand
- SPSF deviates more than 10% from target
- Fashion grade split violates the 70/30 rule
- Fixture utilization falls below 60% threshold

### Guardrails

Guardrails enforce space planning constraints automatically:
- Minimum and maximum segment allocation percentages
- Fixture capacity limits per type
- Fashion grade boundaries (Core+Ultimate >= 70%)
- External brand mix floor (15%) and ceiling (40%)

### OTB Capacity Validation

When planned OTB units exceed fixture capacity for any category, a warning banner appears in the store view prompting order reduction or fixture addition. This prevents over-ordering that would result in stockroom overflow or display overcrowding.
