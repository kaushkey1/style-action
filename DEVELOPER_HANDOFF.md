# Inventory prototype — developer handoff

Updated 13 October 2026. Start here; the original README covers the broader application.

## Run the current demo

Use Node.js 22 and npm. This is the React / TypeScript / Vite frontend, including the shared app shell, local dummy data and tests. A backend is not included or required for the Style Actions demo.

1. Clone this repository (or unzip the handoff package) and open a terminal in its root directory.
2. Install the locked dependencies:

   ```sh
   npm ci
   ```

3. Start the local demo:

   ```sh
   node start-demo.mjs
   ```

4. Open one of the URLs below. Stop the server with Ctrl+C.

The launcher sets local demo flags, skips sign-in and serves HTTP on port 5183. It works without the original machine's environment files or certificates. Port 5183 must be free. If it is occupied, stop the process using it before starting this demo. When using a ZIP without Git history, Husky may warn that there is no Git repository. A normal Git clone includes the initial handoff commit.

Current Engine actions view:
http://127.0.0.1:5183/style-actions-product?snap=snap_demo_20261008&dc=DCWEST&store=PUN01&sort=shortfall_desc&position=stock&view=engines&eaction=decisions

Inventory journey:
http://127.0.0.1:5183/style-actions-product?snap=snap_demo_20261008&dc=DCWEST&store=PUN01&position=stock&view=journey

Per-option engine results (36-unit lifecycle exit):
http://127.0.0.1:5183/style-actions-product?snap=snap_demo_20261008&dc=DCWEST&store=PUN01&position=stock&view=engines&eaction=movement&ebrick=TEES&option=700000206_SAND

These URLs become usable on the recipient's computer after they start the server. They are not public preview links.

## What to review

- Inventory journey: in-store, in-transit and sold position cards; age, price-stage and transit-direction stacked bars within each position; brick → option → size/evidence drill-down. The combined stock/transit/cumulative-sales bar is removed; totals remain on the position cards.
- Compact workspace: smaller headings, inline summary metrics, reduced card padding, tighter charts, filters and rows across inventory, engine actions and option drawers. The data-status strip shows compact badges, a gap count and Data health access. Engine actions omits the introductory sentence and aggregate footer; its three summary cards sit in one row from tablet widths. Move stock highlights both distinct option count and requested units, and pricing is labelled Markdown. Coarse-pointer controls retain larger targets. Shared application UI primitives are unchanged.
- In-store and sold breakdowns: age and selling-price stage. Transit: incoming / outgoing.
- Engine actions: movement, pricing and options with no action lines; brick and option views with filters. Legends follow the selected action group and show only engines with emitted lines in the current scope. An active zero-count filter remains visible so it can be cleared. Broken sizes, consolidation and overfill remain movement engines when they emit pullback lines; No action lines contains only recorded option decisions without any emitted line.
- Option drawer: three sections — Engine results, Inventory & sizes, and History. Engine results shows the highlighted rule-tree outcome, decision gates and expandable engine logic. The standalone engine-checks panel and input cross-check (including applied settings) have been removed. Inventory & sizes combines the position breakdown, size quantities and availability; it stays selected when the position changes.
- The option drawer no longer shows a separate Engine outputs section or its action-line details. Detailed engine checks and output numbers remain accessible by selecting an engine node inside the expanded logic tree. The Engine actions workspace still lists the emitted actions.
- Decision-gate summaries omit gates and sub-gates recorded as Not reached. Not evaluated and unavailable evidence remain visible. The complete engine tree still includes untaken branches in grey.
- Gate selection and numeric evidence share one card. A single reached gate uses one compact header with its name, deciding status and result; multiple reached gates use a selector strip in the same card without repeating the selected gate heading.
- Engine results starts with a highlighted rule-tree outcome and deciding gate. The option drawer hides the run metadata card (run/snapshot/settings IDs, status and completion time); a small illustrative-data note remains beside demo outcomes.
- Engine logic chevron within Engine results (collapsed by default): one connected, zoomable tree containing every rule outcome, replenishment, pullbacks, markdown, review and execution. Jump controls pan within the same tree; Expand opens a larger canvas. Untaken branches and connectors are grey, recorded paths are highlighted, failed checks stay red and unavailable evidence stays amber. Click an engine node for numeric checks without replacing the tree. A dagger marks defaults not confirmed for this run.
- Inventory journey and Engine actions open the same full inventory option drawer, including position totals, engine results, inventory and sizes, and history. The separate engine-only drawer and View inventory step are removed. Closing or returning to the brick preserves the engine workspace and filters. Engine evidence stays pinned to the originating run and remains available if inventory metadata cannot load.
- Filters and selected options persist in the URL.

Demo scope: 12 stores, 3 distribution centres, 96 options per store, 2 snapshots. All numbers and engine traces are illustrative. No stock movements, replenishment or markdowns execute from this demo.

## Code map

Paths below are relative to the package root.

| Area | Main files |
| --- | --- |
| Workspace and routing | `src/modules/style-actions-product/pages/WorkspacePage.tsx`, `route.tsx` |
| Workspace control density | `src/modules/style-actions-product/components/CompactButton.tsx` |
| Inventory journey and stacked breakdowns | `src/modules/style-actions-product/components/journey/` |
| Engine actions workspace and drawer | `src/modules/style-actions-product/components/engine/EngineActions.tsx` |
| Shared inventory option drawer | `src/modules/style-actions-product/components/OptionDrawer.tsx` |
| Rule-tree gates and engine result table | `src/modules/style-actions-product/components/engine/OptionEngineResults.tsx` |
| Unified tree, recorded-path states and workflow reference model | `src/modules/style-actions-product/components/engine/EngineLogicDiagram.tsx`, `wholeEngineTree.ts`, `engineLogicModel.ts` |
| Per-engine checks and outputs | `src/modules/style-actions-product/components/engine/EngineEvaluationDetail.tsx`, `evaluationDisplay.ts` |
| Engine data types, loaders and validation | `src/modules/style-actions-product/components/engine/optionEngineData.ts`, `storeEngineData.ts` |
| Query-string state | `src/modules/style-actions-product/components/useWorkspaceParams.ts` |
| API client and contracts | `src/modules/style-actions-product/api/` |
| Dummy data and illustrative traces | `src/modules/style-actions-product/data/demoApi.ts`, `demoOptionEngine.ts`, `demoEngineEvaluations.ts`, `demoJourneyBreakdown.ts` |
| Tests | `src/test/modules/style-actions-product/` |

## Connecting the backend

This handoff contains view changes and demo fixtures. The new per-engine trace is a proposed optional frontend read contract; adding its TypeScript type does not mean the existing backend already returns it.

The existing engine loaders read runs, action lines and option gates under `/v1/engine/runs`. The full per-option gate response is read from:

```text
/v1/engine/runs/{run_id}/gates/{store_code}/{option_code}
```

`OptionGateResult.engine_evaluations` is the new optional array. Supply an entry for every evaluated engine, including engines with no emitted action lines. Exact types are in `optionEngineData.ts`:

- `engine`: replenishment, broken, consolidation, overfill, lifecycle_end, replacement or markdown. Additional engine names can also be displayed.
- `status`: passed, blocked, skipped or not_evaluated.
- `reason_code`: short recorded reason.
- `checks`: stable ID, label, pass/fail/skipped/not_evaluated result, input value, optional operator/threshold/unit, parameter and setting scope.
- `outputs`: named numeric or other scalar result metrics, including zero values.
- `line_ids`: emitted action line identifiers when available.
- `run_id`: the run that produced the trace; must match the selected run when supplied.

Keep the run, snapshot, store and option aligned. Missing trace data renders as Not recorded; missing values render as unavailable. Do not turn absent data or zero emitted lines into a passing evaluation. Preserve null versus zero and complete paginated action-line/gate results.

Before using real services, use your team's API/auth configuration, disable the demo flag and authentication bypass, and start through the normal app workflow instead of `start-demo.mjs`. The current `api/demoMode.ts` only enables dummy data during Vite development. A production build does not retain this demo mode; `npm run build` alone will not create a hosted dummy-data preview.

The supplied `handoff-reference/engines-workflow.txt` is the user's workflow reference. Reconcile any business-rule ambiguities with the backend team; fixture calculations are illustrative and are not a production rules engine. The reference describes rule-tree and replenishment evaluation in parallel, followed by pullback processing. The drawer's visual order does not change execution order.

## Verification

Run the Style Actions module tests:

```sh
npm test -- src/test/modules/style-actions-product
```

Validation on 12 October: TypeScript project checks (`npx tsc -b --pretty false`) passed. The final logic and drawer integration suites passed all 20 tests. Coverage includes both drawer entry points, all stages mounted together, terminal versus unavailable branches, shadow versus live paths, missing evidence and recorded-versus-default thresholds. ESLint passed for the changed tree components, model and tests. Expanded navigation, zoom, numeric evidence, card bounds and grey execution branches were inspected in the browser. No production deployment or full application bundle build is claimed.

The archive includes locked dependencies metadata, but excludes installed dependencies, local environment files, private certificates, browser captures, generated build output and Git history. Install dependencies on the recipient's machine. `SOURCE_MANIFEST.json` records SHA-256 hashes for the packaged files.

Latest legend correction: all 12 engine-actions tests and TypeScript project checks passed. ESLint reports no errors and one existing section-layout advisory warning. Both action legends were verified in the browser, including counts and brick drill-down.

Compact-layout validation: all 32 tests in inventoryJourney, inventoryBreakdown, engineActions and optionEngine passed, plus TypeScript project checks. ESLint found no errors and six layout-advice warnings in the changed files. Inventory, engine actions and option drawers were inspected at the normal desktop width; 390px inventory and engine views had no page-width overflow. No data calculations or API contracts changed in this density update.

Merged-option validation (13 October): 42 relevant tests passed across inventoryJourney, engineActions, optionEngine, engineEvaluations, engineLogic and the existing history/size drawer case in scope2bc. TypeScript passed; ESLint found no errors and five existing layout-advice warnings in the checked files. Verified the inline logic disclosure, input comparison table, combined inventory and size view, and preserved section selection when switching positions in the browser. No API or calculation changes.

Latest simplification (13 October): removed the input cross-check and separate engine-checks panel from both option drawer entry points, including obsolete engine-name buttons. All 33 relevant engine-actions, option-engine, engine-evaluation and engine-logic tests passed; TypeScript passed; ESLint reported no errors and three existing layout-advice warnings. The shortened output section was verified in the browser. The logic tree and action-line details remain available.

Decision-gate summary update (13 October): Not reached gates and sub-gates are hidden from the summary, while unknown evidence remains visible. All 19 engine-actions and option-engine tests passed, including both drawer entry points and preservation of Not evaluated gates. TypeScript passed; ESLint reported no errors and three existing layout-advice warnings. The lifecycle-exit option shows only G0 in the browser; the full tree is unchanged.

Shared option drawer update (13 October): Engine actions now opens the existing full inventory drawer directly. All 19 engine-actions and inventory-journey tests passed, including inventory tabs, position changes, filtered-list retention on close and missing inventory evidence. TypeScript passed; ESLint reported no errors and two existing layout-advice warnings. Verified opening an option from the price-action list and viewing its inventory mix and size table in the browser.

Result emphasis update (13 October): the rule-tree outcome is highlighted first in Engine results; the option run-metadata card is removed. All 26 engine-actions, inventory-journey and option-engine tests passed, along with TypeScript. ESLint reported no errors and two existing layout-advice warnings. Banner placement and removed metadata were verified in the browser.

Compact engine disclosure update (13 October): gate selection and numeric evidence now share one card; Engine outputs and its action-line details are collapsed by default with counts visible. All 32 engine-actions, inventory-journey, option-engine and engine-evaluation tests passed, along with TypeScript. ESLint reported no errors and two existing layout-advice warnings. Verified output expansion/collapse and the merged single-gate card in the browser.

Produced-output legend update (13 October): zero-output engines are hidden from the legend, keeping action grouping and no-line option counts unchanged. All 12 engine-actions tests and TypeScript checks passed; ESLint reported no errors or warnings. The movement overview was verified in the browser with only Lifecycle exit (24 lines) in its legend.

Compact engine overview update (13 October): condensed the workspace status strip, removed the engine introduction and aggregate footer, renamed Change price to Markdown, and made option count and requested units prominent in Move stock. All 12 engine-actions tests and 22 scope2Pages tests passed. The workspace suite was rerun with a 15-second timeout after intermittent 5-second timeouts; the two initial failing cases also passed in isolation. TypeScript passed. ESLint reported no errors and one layout advisory. Verified the three-card overview and Data health open/close in the browser.

Option-output removal (13 October): removed the separate Engine outputs accordion, evaluation summary table and action-line detail controls from both option drawer entry points. The rule-tree result, gate evidence and engine logic remain; recorded checks and output numbers are available inside the logic tree. All 40 engine-actions, inventory-journey, option-engine, engine-evaluation and engine-logic tests passed, along with TypeScript. ESLint reported no errors and one layout advisory. Verified the simplified drawer and logic expansion/collapse in the browser.
