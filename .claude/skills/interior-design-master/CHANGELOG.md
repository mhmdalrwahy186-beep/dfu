# Changelog

[English](CHANGELOG.md) · [繁體中文](CHANGELOG.zh-TW.md) · [简体中文](CHANGELOG.zh-CN.md)<br>
[README](README.md) · [繁體中文](README.zh-TW.md) · [简体中文](README.zh-CN.md)

All notable changes to Interior Design Master are documented here. Version numbers describe the Skill package and its contracts; they do not claim that every compatible 3D runtime implements every optional feature.

## [0.2.3] — 2026-09-11

### Changed

- Added the MIT License for original material in the repository.
- Audited the public README and removed host-local validator instructions while keeping the public Node, build, and browser checks.
- Reworded the reference-implementation notes so they describe public provenance without exposing private project context.

### Verified

- README local links resolve, and the documented checks run from the repository root.
- `node scripts/test-scripts.mjs` and strict validation of `examples/minimal-case` passed.
- `npm run build` in `runtime-starter` succeeded.

## [0.2.2] — 2026-09-11

### Changed

- Made English the default language for the skill metadata, instructions, bundled viewer UI, HTML document, example case, and newly initialized cases.
- Added an English-first GitHub introduction and repository-facing description while retaining the localized README and changelog versions.

### Verified

- `node scripts/test-scripts.mjs`: all offline tests passed.
- `node scripts/validate-case.mjs examples/minimal-case --strict`: valid with 0 errors and 0 warnings.
- `node scripts/check-product-links.mjs examples/minimal-case`: 1 checked, 1 OK, 0 blocked, 0 failed.
- `npm run build` and `node runtime-starter/scripts/smoke.mjs`: build succeeded; 17 browser checks passed with 0 failures and no desktop or mobile console errors.

## [0.2.1] — 2026-09-10

Five issues found by a clean-room test (a real one-bedroom-plus-flex plan authored from an image, strict-valid, with an IKEA Taiwan sofa product).

### Fixed

- `placeProduct(productId)` called with no coordinates used the plan's bounding-box centre, which lands on a wall or a narrow room in a real plan. It now resolves a room first — the room a matching `style.json` `furnitureRoles[]` entry assigns to the product's role, else the largest indoor non-wet room (the same rule the inside/walk camera already used) — and targets that room's polygon centroid. Because a long, narrow piece dropped at rotation 0 into a room that is narrower on the x-axis than the z-axis can never fit the existing spiral overlap search no matter where it probes, the default path also starts the piece rotated so its long side matches the room's long side before handing off to that unchanged search. `runtime-starter/scripts/smoke.mjs`'s "places a product proxy" check now exercises this default path (no explicit coordinates) and reports the room chosen and its source (`style-role`, `largest-indoor-room`, or `bbox-fallback`) in its detail.
- With `public/textures` and `public/hdri` empty (a fresh clone before `fetch-assets.mjs` runs), the page threw `pageerror: Cannot read properties of undefined (reading 'image')`. Root cause: a Vite dev/preview server answers a missing static asset with a 200 and the SPA-fallback `index.html` rather than a 404; three.js's `HDRLoader`/`DataTextureLoader` throws parsing that HTML as an HDR file, and its own `catch` block calls `onError` but still falls through to use the never-assigned parse result, throwing an uncaught error. `runtime-starter/src/render.js` now checks the response's leading bytes for the real RADIANCE/RGBE magic header (`#?`) before ever handing it to `HDRLoader`, so that broken code path never runs; the `RoomEnvironment` + procedural-canvas-texture fallback carries the scene with zero page errors either way. Verified 17/17 with assets absent and 17/17 with assets present.
- The "Start from runtime-starter" block in `SKILL.md`, `references/runtime-adapter.md`, and the three READMEs' quick-start now say explicitly, and show with a `cd`, that `fetch-assets.mjs`, `link-case.mjs`, and `smoke.mjs` run with cwd inside the copied `runtime-starter`/viewer directory, while `init-case.mjs`, `validate-case.mjs`, `check-product-links.mjs`, `image-inventory.mjs`, and `test-scripts.mjs` are the skill's own separate `scripts/`, run from the skill root.
- `references/input-contract.md`'s "Image and drawing handling" item 5 now has a worked example of deriving `metresPerPixel` from a drawn double bed (and, briefly, a standard door leaf) on a no-scale marketing plan, the matching `plan.json.source` (`scaleStatus: "estimated"`, `metresPerPixel`) and `assumptions[]` entry with `basis`, plus a note that the bundled `examples/minimal-case` is an authored plan with `scaleStatus: "confirmed"` and does not exercise this path.
- `scripts/image-inventory.mjs` only parsed dimensions for PNG and JPEG. It now also parses WebP (VP8, VP8L, and VP8X headers) and GIF; for formats it does not parse (avif, svg, pdf, bmp) it now reports `"dimensions": null` with an explicit `"dimensionsNote": "not probed for this format"` instead of a silent `null`. `references/input-contract.md` item 1 states which formats get probed dimensions. `scripts/test-scripts.mjs` gained a WebP fixture (a minimal generated VP8L header) asserting the parsed width/height.

### Verified

- `node runtime-starter/scripts/smoke.mjs` against a clean-room case (assets absent): 17 passed, 0 failed, zero console/page errors, default placement landed the sofa in `rm-living` via `style-role`.
- `node runtime-starter/scripts/smoke.mjs` against `examples/minimal-case` (assets present, real HDRI loaded): 17 passed, 0 failed.
- `node scripts/test-scripts.mjs`: all tests passed, including the new WebP fixture assertion.
- `node scripts/validate-case.mjs examples/minimal-case --strict`: `valid: true`.

## [0.2.0] — 2026-09-10

### Added

- Added `runtime-starter/`, a Vite and Three.js viewer driven by the case JSON contract, so a copied skill folder can produce a running, editable residential 3D viewer without scaffolding one first.
- Added `examples/minimal-case`, a valid strict case with a real, link-checked product record, pre-linked into the starter's `public/case/`.
- Added `runtime-starter/scripts/fetch-assets.mjs` for optional CC0 Poly Haven HDRI and PBR textures, with a `RoomEnvironment` and procedural-texture fallback when they are absent.
- Added `runtime-starter/scripts/link-case.mjs` to copy a case's JSON files into the running viewer.
- Added `runtime-starter/scripts/smoke.mjs`, a Playwright pass covering desktop and mobile screenshots, console errors, view toggling, proxy placement, and a share-hash round trip.
- Added `scripts/test-scripts.mjs`, offline self-tests for the skill's own scripts.
- Added quality tiers (high, medium, low) with a single control, a medium default under 800px viewport width, and persistence under `idm-render-quality`.

### Changed

- Rewrote the SKILL.md frontmatter description as triggering conditions only, in third person, with English and Chinese trigger terms and no workflow summary.
- Slimmed the SKILL.md body to the gate list, the runtime-starter start path, the state and evidence commands, honesty boundaries, a red-flags list, and continuation rules. Product-research and runtime detail now live only in the references that already cover them.
- Aligned `validate-case.mjs` with the shipped schemas so `--strict` enforces them in full.
- Changed `check-product-links.mjs` to report `blocked` (403, 429, 503, network) separately from `failed` (404 and similar), exiting non-zero only on `failed`. Blocked URLs are recorded as `unverified`, never as passed.
- Rewrote `references/runtime-adapter.md` around runtime-starter as the default runtime, with a module map, the API surface, the quality-tier contract, swap-out guidance, and generalizable lessons distilled from the reference project's verification rounds.
- Updated `references/validation-and-delivery.md` for the smoke step, the offline self-tests, and the blocked versus failed distinction.
- Made the concept-render stage concrete for Claude Code: use an available image-generation MCP server, skill, or configured API, and otherwise record the stage as skipped.
- Updated the three READMEs with a quick start, a rendering-quality section, and a capability row stating that a runtime is included. The 0.1.0 boundary that a compatible runtime is still required externally no longer applies.

### Validation

- `node scripts/test-scripts.mjs`: 23 offline assertions passed, exit 0.
- `node scripts/validate-case.mjs examples/minimal-case --strict`: valid, 0 errors, 0 warnings (6 rooms, 2 styles, 1 product).
- `node scripts/check-product-links.mjs examples/minimal-case`: 1 URL checked, HTTP 200, 0 failed, 0 blocked. Example product: IKEA EKTORP 3-seat sofa (Hakebo dark grey), official GB page, dimensions read from the page on 2026-09-10.
- runtime-starter: `npm install` and `npm run build` succeed (three r183, Vite 7). `node scripts/fetch-assets.mjs` downloaded 27 CC0 Poly Haven files with sha256 verified.
- `node scripts/smoke.mjs` (Playwright Chromium, SwiftShader, vite preview): 17 passed, 0 failed; desktop 1440×900 and mobile 390×844 screenshots; zero console errors on both; HDRI environment active; view preset switch, product proxy placement with productId preserved, focusItem, share-hash round trip, quality tiers low/medium/high with persistence, mobile defaulting to medium, exportProducts carrying evidence, walkthrough collision all verified.
- Not verified: real-phone GPU behaviour (mobile pass is an emulated viewport under a software renderer), iOS fake-fullscreen fallback, GLB loading via geometry.assetPath (code path exists, no example supplies a model), clipboard copy of the share link (encode/decode covered by the round trip).

## [0.1.0] — 2026-09-09

### Added

- Created the reusable `interior-design-master` Skill for Codex and Claude Code.
- Added a staged workflow from floor-plan intake and spatial specification through white-model review, style layers, product research, interactive 3D integration, and browser QA.
- Added the concept-render bridge for 2–4 AI image alternatives before detailed 3D furnishing when a host image-generation tool is available.
- Added `concept-renders.json`, its schema, provenance requirements, selected/rejected states, and the rule that concept images cannot establish geometry or product facts.
- Added plan, style, furniture-product, and case-state schemas with stable IDs and explicit confirmed/estimated/inferred/unknown boundaries.
- Added mandatory live furniture research for purchasable recommendations, including exact variants, dimensions in millimetres, source evidence, direct purchase URLs, market/date context, geometry strategy, and fit status.
- Added `init-case.mjs`, `image-inventory.mjs`, `validate-case.mjs`, and `check-product-links.mjs`.
- Added runtime guidance for orbit, perspective, axonometric, top/2D plan, first-person walkthrough, collision, editing history, snapping, save/share, capture, exports, and product panels.
- Distilled reusable patterns from the referenced residential spatial-design project without copying its example coordinates, private inputs, model assets, deployment data, or validation receipts.
- Added a research-informed roadmap covering natural-language editing, design comparison, budgeting, scan import, AR, user-furniture capture, materials, collaboration, environmental analysis, VR, construction handoff, procurement, and performance modes.
- Added GitHub-ready English, Traditional Chinese, and Simplified Chinese README/CHANGELOG navigation and semantic-parity requirements.

### Boundaries

- The package is a workflow and data-contract layer. A compatible Three.js/Vite or React/Three.js runtime is still required for a runnable viewer.
- The default output is a conceptual editable model, not BIM, a permit/construction drawing, a physical measurement, a photoreal digital twin, or a purchase guarantee.
- Product links and prices are time-sensitive evidence; the Skill does not check out, add to cart, contact sellers, submit addresses, or guarantee stock.
- At that release, no repository license was declared; third-party code and assets must not be redistributed without compatible permission.

### Validation

- Skill structure validated with the package's public validation scripts.
- Node scripts syntax-checked and exercised with initialized, concept, positive-product, and strict-blocked cases.
- Canonical Skill and Codex/Claude Code mirrors verified with matching file hashes.
