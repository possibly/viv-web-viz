# viv-web-viz

Standalone webapp for exploring the Viv runtime timestep-by-timestep. Step the
simulation (one frame or in bulk), scrub through history, and inspect the
Chronicle, character memories, queued constructs, active plans, and raw state.

## Requirements

Depends on a **browser-capable Viv runtime**, which does not yet officially
exist upstream. This repo vendors a prebuilt browser bundle at
`public/vendor/viv-runtime.js`, produced from the `browser/runtime` branch of
[possibly/viv](https://github.com/possibly/viv):

```sh
# in the viv monorepo, on the browser/runtime branch
cd runtimes/js && npm run build
cp dist/index.browser.js /path/to/viv-web-viz/public/vendor/viv-runtime.js
cp dist/index.d.ts       /path/to/viv-web-viz/public/vendor/viv-runtime.d.ts
```

A default content bundle (`public/bundles/hello-viv.json`) ships with the app,
taken from `examples/hello-viv-browser/bundle.json`. You can load your own
bundle via the **Load bundle…** button in the top bar.

## Run

```sh
npm install
npm run dev
# open http://localhost:5173
```

## Features

- **Step / Step ×N** — run one or many timesteps (each character selects an
  action, story time advances by 10).
- **Scrubber** (`←` / `→`) — move through captured snapshots. Snapshots are
  append-only: scrubbing back does *not* rewind the runtime; stepping from a
  past frame continues from the live head.
- **Tabs**:
  - *Chronicle* — every action produced so far, with the most recent flagged.
  - *Characters* — per-character memories, sorted most-recent-first, with
    salience and forgotten flags.
  - *Queues* — queued actions, plans, selectors (from `vivInternalState.queueManager`).
  - *Plans* — planner state slices.
  - *Raw State* — host state, `vivInternalState`, or entities dump.

## Notes

The host adapter seeds a demo world (Alice/Bob/Carol in The Tavern) matching
`hello-viv-js`. To simulate a different world shape, you'll want to edit
`src/lib/viv.ts#seedDemoWorld` or add a bundle-specific seed.
