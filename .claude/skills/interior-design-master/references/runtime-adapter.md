# Runtime adapter contract

The Skill is the workflow and data contract. A runtime is the web application that renders and edits the case. This package ships one: `runtime-starter/`. Use it by default, and adapt an existing runtime only when the workspace already has a compatible one. Never treat a prior example's coordinates as a generic template.

## Default runtime: runtime-starter

A Vite plus Three.js viewer driven by the case JSON contract. It is checked into the skill, so a copied skill folder can produce a working viewer without scaffolding.

`fetch-assets.mjs`, `link-case.mjs`, and `smoke.mjs` below are this runtime's own `scripts/`, run with cwd inside the copied `runtime-starter`/viewer directory — a different, unrelated directory from the skill's own `scripts/` (`init-case.mjs`, `validate-case.mjs`, `check-product-links.mjs`, `image-inventory.mjs`, `test-scripts.mjs`), which run from the skill root instead.

```text
cp -r runtime-starter <project>/viewer     # or run it in place
cd <project>/viewer
npm install
node scripts/fetch-assets.mjs              # optional CC0 HDRI + PBR textures
node scripts/link-case.mjs <case-dir>      # copies case JSON into public/case/
npm run dev
npm run build                              # smoke serves dist/, so build before smoke
node scripts/smoke.mjs                     # Playwright smoke pass (builds dist automatically unless --no-build)
```

`public/case/` is pre-linked to `examples/minimal-case`, a valid strict case with one real, link-checked product record. Run the app before touching a real case so you know the baseline works.

### File map

| Path | Responsibility |
|---|---|
| `package.json` | three, suncalc, vite; `@playwright/test` as a dev dependency |
| `scripts/fetch-assets.mjs` | Downloads CC0 Poly Haven HDRI and PBR textures listed in `assets-manifest.json` |
| `scripts/link-case.mjs <case-dir>` | Copies the case JSON files into `public/case/` |
| `scripts/smoke.mjs` | Desktop and mobile screenshots, console-error check, view toggle, proxy placement, share-hash round trip |
| `src/render.js` | ACES tone mapping, PCF soft shadows, PMREM RoomEnvironment then HDRI swap, GTAO, Bloom, SMAA, Output passes, quality tiers, render-on-demand |
| `src/shell.js` | `plan.json` to floor, walls, openings, ceiling, fixed elements, and room labels, each with a stable id and collision metadata |
| `src/materials.js` | Procedural materials plus the fetched PBR set when present |
| `src/lighting.js` | suncalc sun position, cloud, curtains, lamps, kelvin, day and night, time-lapse |
| `src/proxy.js` | Dimension-accurate procedural proxies by role; a GLB is loaded when `geometry.assetPath` supplies one |
| `src/placement.js` | 5 cm grid, 15 degree rotation, wall snap, overlap rejection, undo and redo |
| `src/walk.js` | First-person movement with collision, mobile joystick |
| `src/views.js` | Orbit, top, axonometric, inside, room focus, walk |
| `src/measure.js` | Two-point floor measurement |
| `src/capture.js` | 2x PNG capture |
| `src/state.js` | Up to 6 saved combinations, share hash, import, JSON and text export; `productId` is never dropped |
| `src/products.js` | Product panel with dimensions, evidence badges, source and purchase URLs, fit status, proxy label |
| `src/i18n.js` | Interface strings, English by default |

### API

```text
createViewer(container, caseData) -> {
  setProducts, setLayout, selectItem, focusItem,
  getState, exportProducts, setQuality, setView
}
```

The framework is replaceable; the invariant is not. An object cannot lose its `productId` when moved, duplicated, saved, shared, or exported, and `getState()` must round-trip through the share hash.

### Quality tiers

One control, three tiers, persisted in `localStorage` under `idm-render-quality`.

| Tier | Contains | Default |
|---|---|---|
| `high` | HDRI reflections, bloom, SMAA, large shadow map, glass transmission | Desktop |
| `medium` | Transmission off, reduced sampling | Viewport width under 800px |
| `low` | Bloom and antialiasing also off | Manual only |

Expose exactly one quality control in the interface. Do not add a second toggle for a sub-effect such as contact shadows; fold it into the tier.

The app renders without downloaded assets: `RoomEnvironment` and procedural textures cover the fallback. `fetch-assets.mjs` improves the `high` tier and is not a dependency.

## Swapping to an existing runtime

Keep the case JSON contract and the API surface above. Then confirm, in the browser, that the substitute runtime still provides:

- orbit, inside, axonometric, top or 2D plan, room focus, and first-person walkthrough with collision;
- furniture selection, X and Z movement, Y rotation, grid and angle snapping, undo and redo;
- wall, room, wet-area, ceiling, and overlap rejection;
- save, restore, share state, PNG capture, and product or furniture export;
- a product panel bound to the selected object, with dimensions, evidence, source URL, purchase URL, fit status, and a proxy or asset label;
- responsive mobile controls and a visible status for conceptual, inferred, and product-backed content.

State in the receipt which of these you actually exercised.

## Layer separation

- **Fixed architecture.** Walls, floors, ceilings, columns, openings, stairs, wet areas, fixed cabinetry, and utilities come from `plan.json`, each with a stable id and a collision role. This layer stays unchanged when a style or product is replaced.
- **Replaceable design layers.** One independent layer per style or scenario, owning furniture, movable cabinetry, finishes, lights, soft furnishings, art, plants, and product metadata. A style switch preserves the selected camera unless the user asks for a reset.
- **Review annotations.** Room labels, plan overlay, route lines, clearance warnings, measurement marks, and evidence badges live in a hideable layer excluded from exports when appropriate.
- **Concept board.** AI concept images stay outside the geometry source of truth, linked to their prompt, provider, model, timestamp, and selected or rejected status. They never establish scale, product identity, or wall geometry.

## Lessons from the home project

Generalizable findings from earlier verification rounds on a real residential viewer.

- **One-off scripts are records, not tooling.** Upgrade, fix, migration, and polish scripts describe a single past edit. Mark them do-not-rerun and keep them out of the runtime directory; re-running one silently reapplies stale geometry.
- **A mobile preview served from `dist` is stale until you rebuild.** If phone testing points at a preview server, run the build after every change or you are inspecting the previous version.
- **Default to a lower tier on small viewports.** Under 800px, start at `medium`. Expose exactly one quality control so a user cannot land in a contradictory combination.
- **iOS needs a fullscreen fallback.** The standard fullscreen request fails there; ship an explicit fallback path for walkthrough and capture.
- **Render on demand needs explicit invalidation.** Turn `shadowMap.autoUpdate` off and invalidate deliberately when lighting, geometry, or the camera changes, otherwise shadows freeze or every idle frame is paid for.
- **Merge only static geometry.** Merging static meshes by material cuts draw calls sharply, but anything animated, individually toggled, transparent, or clickable must stay separate, and the merged mesh must carry the pre-merge collision boxes so walk collision does not degrade into one large box.
- **Keep architecture immutable and selectable items addressable.** Performance work must not make a furniture item unselectable or cost it its `productId`.
- **Measure first load, style switch, drag, and walk separately.** They have different bottlenecks, and a single average hides the one that hurts. A cold shader cache affects only the first visit; say so instead of reporting it as the normal load time.
- **A desktop viewport with simulated touch is not a phone GPU test.** Report it as a layout and interaction check, and leave real-device performance unverified until a real device runs it.

## Platform boundary

Keep the build and data validation in portable Node scripts. Browser inspection may use whichever browser tooling the host provides, but the receipt must state which checks actually ran and in which environment.
