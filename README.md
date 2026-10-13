# Impetus inventory prototype

Developer handoff for the inventory journey and engine-actions UI. Includes the shared React application, illustrative data, engine traces, and tests. No backend is needed for the Style Actions demo.

## Start the demo

Use Node.js 22 and npm:

```sh
nvm use
npm ci
node start-demo.mjs
```

Open [Engine actions](http://127.0.0.1:5183/style-actions-product?snap=snap_demo_20261008&dc=DCWEST&store=PUN01&sort=shortfall_desc&position=stock&view=engines&eaction=movement) or [Inventory journey](http://127.0.0.1:5183/style-actions-product?snap=snap_demo_20261008&dc=DCWEST&store=PUN01&position=stock&view=journey).

The launcher binds to localhost on port 5183, supplies local demo flags and skips sign-in. The URLs work after the developer starts the server. The data is illustrative; no inventory movements or price changes execute. Production builds do not enable the demo fixtures.

## What is included

- Inventory positions: in store, in transit, and sold, with age, price-stage, and direction breakdowns.
- Brick, option, and size drill-down with compact stacked charts.
- Engine actions grouped into stock movement, price changes, and options without action lines.
- Shared option details with a highlighted outcome, merged gate evidence, collapsible engine outputs and the complete engine logic diagram.
- Current API types, demo fixtures, and regression tests.

Read [DEVELOPER_HANDOFF.md](DEVELOPER_HANDOFF.md) for the code map, API expectations, verification history, and workflow reference. [README.upstream.md](README.upstream.md) describes the broader application from the supplied prototype.

## Checks

```sh
npm test -- src/test/modules/style-actions-product
npx tsc -b --pretty false
```

This repository starts from the supplied prototype and includes the latest inventory UI work. Earlier upstream Git history was not present in the supplied ZIP. Local environment files, certificates, installed dependencies and unrelated local reports are excluded.
