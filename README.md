# viv-web-viz

Standalone webapp for exploring the [Viv runtime](https://github.com/siftystudio/viv)
timestep-by-timestep. Step the simulation (one frame or in bulk), scrub through
history, and inspect the Chronicle, character memories, queued constructs,
active plans, sifting matches, and the `.viv` source code that compiled to the
running bundle.

**Live site:** https://possibly.github.io/viv-web-viz/

## Run

```sh
npm install
npm run dev
# open http://localhost:5173
```

## Requirements

Depends on a **browser-capable Viv runtime**, which does not yet officially
exist upstream. This repo vendors a prebuilt browser bundle at
`src/vendor/viv-runtime.js`, produced from the `browser/runtime` branch of
[possibly/viv](https://github.com/possibly/viv):

```sh
# in the viv monorepo, on the browser/runtime branch
cd runtimes/js && npm run build
cp dist/index.browser.js /path/to/viv-web-viz/src/vendor/viv-runtime.js
cp dist/index.d.ts       /path/to/viv-web-viz/src/vendor/viv-runtime.d.ts
```

## Controls

- **Step** — advance one timestep (every character runs `selectAction`, story
  time advances by 10, character memories decay via `fadeCharacterMemories`).
- **Step ×N** — bulk-generate N frames in one click.
- **Scrubber** (`←` / `→` on desktop) — move through captured snapshots.
  Snapshots are append-only: scrubbing back does *not* rewind the runtime;
  stepping from a past frame continues from the live head.
- **Reload hello-viv demo** — re-initialize against the default bundle.
- **Load bundle…** — pick a compiled `.json` content bundle from disk to load
  and simulate in place.
- On mobile, the ☰ button toggles the tab drawer and ▲/▼ toggles the control
  bar; a tap-outside backdrop closes the drawer.

## Tabs

Each tab has a small **docs ↗** pill linking to the relevant section of
[viv.sifty.studio](https://viv.sifty.studio/reference/language/).

| Tab | What it shows |
|-----|----------------|
| **Chronicle** | Every action produced so far, with the most-recent step flagged `new`. Each row shows `[T=…]` and the action's `report` or `gloss`. |
| **Characters** | Per-character memories, sorted most-recent-first, with a salience bar (green → blue → red as it fades, amber when `forgotten`). On mobile, picking a character swaps into a dedicated detail view with a back button. |
| **Queues** | Per-initiator action queues, the planner's plan queue, and a *Recently resolved* section. Every queued construct shows its status (`pending` / `succeeded` / `failed`) with a color-coded badge. |
| **Plans** | Plans split into *Active* (currently underway, with the phase name highlighted and role bindings shown), *Queued*, and *Resolved*. Each active plan has a collapsible raw dump. |
| **Sifting** | Runs the bundle's `queries` and `siftingPatterns`. Pick a character (or leave blank for the whole chronicle), hit *Run*, see the match bindings resolved to glosses and — for pattern matches — expand an ASCII causal-tree diagram produced by `constructSiftingMatchDiagram`. |
| **Source** | The companion `.viv` source, with lightweight syntax highlighting (keywords, roles, phases, associations). Read-only. Only shown when a `.viv` companion exists next to the loaded bundle; hidden otherwise. |
| **Raw State** | The full host state, the runtime's `vivInternalState`, or the entity dictionary. Useful when the structured tabs don't tell the whole story. |

## Loading bundles

### The default bundle

`public/bundles/hello-viv.json` is auto-loaded on first visit. It's a small demo
defining `hello` / `celebrate` / `argue` / `provoke` actions, a `retaliate`
reaction, a two-phase `befriend` plan, and two queries + two patterns — enough
for every tab to have something to show after a few steps.

### Swapping bundles at runtime

Click **Load bundle…** in the top bar and pick a compiled `.json`. The runtime
is re-initialized in place. The adapter seeds the same three-character demo
world (Alice/Bob/Carol in The Tavern), so your bundle must address that world
shape — or edit `src/lib/viv.ts#seedDemoWorld` to fit your own.

### Viv source files (optional)

If a bundle has a companion `.viv` source file, it's picked up automatically and
shown read-only on the **Source** tab with syntax highlighting. There is **no
UI for uploading source**; it's a static-file convention:

- **Default bundle:** drop both `bundle.json` and `bundle.viv` into
  `public/bundles/` with matching stems. The app fetches `hello-viv.viv`
  alongside `hello-viv.json`.
- **User-uploaded bundle:** source display isn't wired up for ad-hoc uploads
  (which only provide the JSON). The Source tab disappears for bundles with no
  known companion `.viv`.

If you edit a `.viv` file, recompile it to regenerate the JSON:

```sh
vivc -i public/bundles/hello-viv.viv -o public/bundles/hello-viv.json
```

## Deploy

Pushes to `main` trigger `.github/workflows/deploy.yml`, which builds with
`VITE_BASE=/viv-web-viz/` and publishes to GitHub Pages.

## CDP smoke tests

`scripts/cdp-smoke.mjs` and `scripts/cdp-sifting.mjs` drive a headless Chrome
via the Chrome DevTools Protocol to assert the app loads, stepping produces
actions, scrubbing restores frame 0, every tab renders, and the Sifting tab
enumerates its patterns/queries. Run them against a live dev server:

```sh
npm run dev &
node scripts/cdp-smoke.mjs
node scripts/cdp-sifting.mjs
```

## Caveat: replay, not time-travel

Scrubbing back shows a historical snapshot but does *not* rewind the runtime
singleton. Stepping always continues from the live head, not the frame you're
viewing. True time-travel would require re-initializing the runtime from a
stored `vivInternalState` on every scrub — not implemented.
