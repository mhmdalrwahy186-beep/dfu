# Interior Design Master: AI Floor Plan to Interactive 3D Interior Design

[English](README.md) · [繁體中文](README.zh-TW.md) · [简体中文](README.zh-CN.md)<br>
[Changelog](CHANGELOG.md) · [繁體中文](CHANGELOG.zh-TW.md) · [简体中文](CHANGELOG.zh-CN.md)

> Interior Design Master is an English-first, reusable Codex and Claude Code skill for turning floor plans and style-reference images into an editable, browser-based residential 3D viewer—with AI concept renders, real furniture dimensions, purchase links, multiple camera views, and walkthrough validation.

Give the Skill a floor plan and a few style references, and it helps you move from an initial visual direction to an editable residential 3D viewer. English is the default language for the skill and bundled viewer; localized README and changelog versions remain available. The workflow can start with 2–4 AI concept renders, confirm the architectural shell, research real furniture in your market, and carry dimensions, source evidence, and purchase links into the scene.

Because the package is local and reusable, it can support a free or self-hosted interior design 3D modeling project, a floor-plan-to-3D model workflow, an AI interior design room planner, or an interactive 3D room viewer.

## Quick start (runtime-starter)

The viewer ships with the skill. Copy the folder, install, and you have a running 3D case in a browser before you write a single line of your own.

Note the `cd runtime-starter` below: `init-case.mjs` is the skill's own `scripts/`, run from the skill root, while `fetch-assets.mjs`, `link-case.mjs`, and `smoke.mjs` are the viewer's own separate `scripts/`, run with cwd inside `runtime-starter/`.

```text
node scripts/init-case.mjs ./case --name "My apartment concept"

cd runtime-starter
npm install
node scripts/fetch-assets.mjs
node scripts/link-case.mjs ../../case
npm run dev
npm run build     # smoke serves dist/, so build before smoke
node scripts/smoke.mjs  # builds dist automatically unless --no-build
```

- `init-case.mjs` creates the case directory and its JSON contracts.
- `fetch-assets.mjs` downloads CC0 Poly Haven HDRI and PBR textures. It is optional; without it the viewer falls back to `RoomEnvironment` lighting and procedural textures.
- `link-case.mjs` copies a case's JSON files into `public/case/`. Out of the box `public/case/` is already linked to `examples/minimal-case`, a valid strict case with one real, link-checked product record, so `npm run dev` works immediately.
- `smoke.mjs` is a Playwright pass: desktop and mobile screenshots, a console-error check, a view toggle, a proxy placement, and a share-hash round trip.

## Rendering quality

The runtime has three quality tiers and exactly one control for them, stored in the browser under `idm-render-quality`.

| Tier | What it renders | Default for |
|---|---|---|
| High | HDRI reflections, bloom, SMAA, large shadow map, glass transmission | Desktop |
| Medium | Transmission off, reduced sampling | Viewport width under 800px |
| Low | Bloom and antialiasing also off | Manual selection |

`fetch-assets.mjs` is what makes the high tier look its best: real HDRI environment lighting and PBR floor, wall, and fabric textures instead of the procedural fallback. The application renders correctly with or without those files, so the download is a quality upgrade, not a prerequisite.

## What this skill does

Interior Design Master keeps the plan, design language, researched products, and 3D runtime connected. A generated image can guide the design, but it never becomes proof of geometry.

| Capability | Result | Evidence boundary |
|---|---|---|
| AI concept-render bridge | Generate 2–4 visual directions before detailed 3D furnishing when the host provides Imagen, native image generation, or another image tool. | Concept images guide mood, materials, and composition; they do not prove dimensions or product identity. |
| Floor plan to spatial model | Convert a plan image, PDF, scan, SVG, or CAD export into rooms, walls, openings, fixed elements, routes, assumptions, and stable IDs. | Missing scale, north, height, or opening direction stays estimated, inferred, or unknown. |
| White-model confirmation | Build and review the architectural shell before style and furniture are finalized. | Architecture remains a separate, protected layer. |
| Editable residential 3D | A Three.js/Vite runtime is included as `runtime-starter/` and renders replaceable style layers straight from the case JSON. Swap in an existing compatible runtime when the workspace already has one. | The runtime must actually be run and inspected; this skill does not pretend that a written plan or a green build is browser proof. |
| Multi-view exploration | Support orbit, inside/perspective, axonometric, top/2D plan, room focus, saved cameras, and first-person walkthrough when the runtime supports them. | Walkthrough, collision, mobile behavior, and camera framing require actual browser checks. |
| Real furniture research | Search the target market for purchasable furniture, verify the exact variant, record dimensions in millimetres, and attach source evidence. | Confirm an exact variant with live source evidence before marking it as selected. |
| Product-linked 3D placement | Use the researched outer dimensions in the 3D footprint; use a labeled procedural proxy when no licensed model is available. | Label procedural proxies separately from manufacturer meshes; keep fit warnings separate from product dimensions. |
| Purchase-ready reference | Show a direct purchase URL, dimension source, retrieval date, price date when available, fit status, and unresolved checks. | Keep the link and its retrieval context visible in the product record. |
| Review and delivery proof | Validate JSON contracts, build/runtime behavior, rendered views, editing, state restore, exports, and product links. | `verified`, `inferred`, `unverified`, and `blocked` remain distinct. |

## Why the workflow is staged

Style references are useful for choosing mood and composition. They cannot reliably establish wall positions, room scale, door swings, or real product dimensions, so the workflow follows this order:

```text
floor plan + style references
        ↓
preliminary spatial understanding
        ↓
2–4 AI concept renders (optional but recommended)
        ↓
user selects a direction
        ↓
white architectural model
        ↓
style layers + live furniture research
        ↓
editable interactive 3D viewer
        ↓
browser checks + evidence receipt
```

The 3D model and `plan.json` are the geometry source of truth. The selected concept render is a style and composition reference. Real product pages and specification pages are the source of product dimensions and purchase links.

## Real furniture, dimensions, and purchase links

When a design includes furniture the user could buy, the workflow researches it before placing it in the scene.

The workflow will:

1. Confirm the target market, delivery country, language, currency, and budget context.
2. Derive furniture roles and room constraints before searching: sofa, bed, desk, dining table, cabinet, lamp, appliance, and so on.
3. Search live using the role, style, market, and size constraints.
4. Prefer an official manufacturer or specification page, then an authorized retailer, then an established retailer or marketplace.
5. Preserve the exact model, size, color, and variant; never merge dimensions from one variant with the purchase URL of another.
6. Record selected and rejected candidates, research queries, dimension evidence, direct purchase URL, market, retrieval date, price date, geometry source, and fit status.
7. Re-read product and purchase pages immediately before delivery and run the product-link checker.

Each selected product record includes:

- a stable `productId`;
- width, depth, and height in millimetres;
- `dimensionSourceUrl` matching an evidence URL;
- a direct `purchaseUrl` or an explicit missing-link status;
- `fit.status`: `pass`, `warn`, `fail`, or `unknown`;
- `geometry.source`: provided model, licensed asset, procedural proxy, or conceptual proxy;
- unresolved clearance, delivery-path, swing, ventilation, cable, ergonomic, and accessibility questions.

Retail dimensions anchor the object’s outer size. Doorway clearance, wall capacity, and building, fire, accessibility, or structural review remain separate checks.

## Install and invoke

### Invoke from Codex

Install or copy the `interior-design-master` folder into the Codex skills directory, then provide the floor plan and style-reference images with a request such as:

```text
Use $interior-design-master to turn these floor-plan and style-reference images into 2–4 concept renders first, then build a source-backed interactive residential 3D viewer. Research real furniture in my market, use verified dimensions in the model, and include direct purchase URLs.
```

### Use with Claude Code

Copy the folder into the Claude Code skills directory configured for your environment. Invoke the skill by its configured name and provide the same input contract. The spatial files and Node scripts are platform-neutral; browser inspection and image-generation calls stay behind the host adapter.

### Initialize a case

Run these commands from the installed skill directory, or replace the script paths with absolute paths:

```text
node scripts/init-case.mjs ./case --name "My apartment concept"
node scripts/image-inventory.mjs ./case/inputs
node scripts/validate-case.mjs ./case --strict
node scripts/check-product-links.mjs ./case
node scripts/test-scripts.mjs
```

`validate-case.mjs --strict` enforces the shipped schemas in full. `check-product-links.mjs` separates `blocked` results (403, 429, 503, network errors) from `failed` results (404 and similar) and exits non-zero only on `failed`; a blocked URL is recorded as `unverified`, never as a pass. `test-scripts.mjs` runs offline self-tests for the scripts themselves and needs no network.

The initializer creates:

```text
case/
├─ case.json
├─ plan.json
├─ style.json
├─ concept-renders.json
├─ furniture-products.json
├─ state.json
├─ inputs/
│  ├─ plan/
│  ├─ style/
│  └─ products/
├─ evidence/
└─ output/
```

Preserve original inputs and hashes. Keep product evidence and private notes inside the case, not inside the public skill package.

## Expected deliverables

A successful case should contain, when supported by the chosen runtime:

- a runnable editable 3D viewer;
- a fixed architectural layer and one or more replaceable design layers;
- selected concept renders with prompts and generation provenance;
- 2D/top, perspective/orbit, interior, and first-person views;
- furniture selection, movement, rotation, snapping, undo/redo, and conservative collision checks;
- a product panel connected to the selected scene object;
- product dimensions, evidence sources, purchase URLs, fit warnings, and proxy labels;
- save/restore, share state, PNG capture, and product/furniture JSON or CSV export;
- validation receipt with input/spec hashes, commands, browser/device context, screenshots, failures, and remaining unknowns.

## Architecture and data contracts

The skill separates four concerns:

1. `plan.json` — geometry, rooms, openings, fixed elements, routes, source scale, assumptions, and unknowns.
2. `style.json` — palettes, materials, lighting, furniture language, and design rules.
3. `concept-renders.json` — AI concept alternatives, prompts, source-input roles, provider/model, selection status, and output paths.
4. `furniture-products.json` — real product identity, dimensions, evidence, purchase URL, geometry strategy, and fit status.

The runtime must preserve stable IDs and `productId` values when an object is moved, duplicated, saved, shared, or exported. Static architecture may be merged for performance, but selectable furniture and collision metadata must remain addressable.

## Current scope versus roadmap

### In the current base contract

- a bundled Three.js/Vite runtime (`runtime-starter/`) and a valid strict example case;
- staged plan intake, concept bridge, white-model gate, and style handoff;
- real-world furniture research with dimensions and direct purchase URLs;
- product-linked procedural proxies and fit warnings;
- multi-view viewer, walkthrough, editing, state, capture, export, and QA contracts;
- evidence statuses and strict validation scripts.

### Deferred candidates

The roadmap records useful features that need additional tooling or proof before they become default behavior:

- natural-language constrained edits and reversible previews;
- multi-scheme visual diff and decision boards;
- budget ranges, product alternatives, and multi-vendor procurement;
- RoomPlan/LiDAR/Matterport scan import and manual correction;
- AR placement, photo cleanup, and user-furniture capture;
- material/finish laboratory and richer PBR assets;
- collaboration, comments, versions, 360/video, and WebXR/VR;
- daylight, sun, wind, noise, microclimate, energy, and carbon analysis;
- elevations, finish schedules, BOM/BOQ, and professional handoff;
- LOD, GPU capability detection, progressive loading, and offline mode.

Read [the feature roadmap](references/feature-roadmap.md) before activating a deferred module. A roadmap item is not an implemented feature.

## Scope

Interior Design Master delivers a conceptual, editable residential 3D viewer. Construction documents, BIM/MEP/structural review, physical measurement, digital-twin accuracy, professional code review, and purchase transactions sit outside this package.

## Frequently asked questions

### Is this a free interior design 3D modeling tool?

It is a local skill, runtime, and validation package, not a hosted tool. It can support a free or self-hosted project; the image model, browser, product research, and hosting are chosen separately. The repository's original material is MIT-licensed, while external services and assets remain subject to their own terms.

### Can it turn a floor plan into a 3D model?

Yes. `runtime-starter/` reads the case JSON and renders it, so no external runtime has to be sourced first. The skill records rooms, walls, openings, scale status, and assumptions, then builds a white model before furnishing. An unscaled or ambiguous plan remains explicitly provisional.

### Does it generate a realistic interior render before the 3D viewer?

Yes, when Imagen, Codex native image generation, or another host image tool is available. It generates a small set of concept alternatives, preserves their prompts and provenance, and passes the selected style direction to the 3D workflow. The image is not used as proof of geometry.

### Does it use real furniture?

Yes. Purchasable furniture must be researched from live market sources, tied to an exact variant, measured from a source page, and connected to a direct purchase URL. If no licensed 3D model exists, the viewer uses a dimension-accurate procedural proxy and says so.

### Can I walk around the design?

The runtime contract includes first-person walkthrough, camera presets, orbit, top/2D plan, room focus, collision, and mobile controls where supported. Browser and device checks are required before claiming those behaviors are verified.

### Can Codex and Claude Code use the same skill?

Yes. The data contracts and Node validators are portable. Codex and Claude Code may use different image, browser, filesystem, or hosting adapters; those differences must not change the evidence or geometry contract.

### Can it produce construction drawings?

Not by default. It produces a conceptual, editable 3D design. Construction handoff is a deferred module and requires dimensioned, reviewed source data plus qualified professional verification.

## Research basis

The workflow is informed by current interior-design and spatial-planning patterns, including plan-to-editable-3D conversion and 360 walkthroughs in [Planner 5D](https://support.planner5d.com/en/articles/14434484-how-to-upload-a-floor-plan), catalog/budget/360 workflows in [Coohom](https://www.coohom.com/all-in-one-software), scan/remove/place/shop flows in [IKEA Kreativ](https://www.ikea.com/us/en/customer-service/knowledge/articles/43460e1e-dd01-4fe8-86ac-74efecd7743f.html), parametric LiDAR room capture in [Apple RoomPlan](https://developer.apple.com/augmented-reality/roomplan/), spatial measurements and guided tours in [Matterport](https://matterport.com/matterport-academy/intro-to-editing-tools/take-custom-measurements), and environmental analysis in [Autodesk Forma](https://www.autodesk.com/products/forma/environmental-impact-analysis). These sources are capability references, not dependencies or guarantees.

## Suggested GitHub topics

Use only the topics that accurately describe the repository:

`ai-interior-design` · `3d-interior-design` · `free-interior-design` · `floor-plan-to-3d` · `3d-room-planner` · `room-planner` · `threejs` · `claude-code` · `codex-skill` · `furniture-research` · `procedural-3d` · `interactive-3d-viewer`

## Contributing

Good contributions improve a real task or make the contracts easier to use. Keep changes aligned with the plan, style, product, and state contracts. Keep the three language versions aligned on capabilities, outputs, constraints, and links. Add focused validation where possible, and label experiments as experimental or unverified. Do not add private floor plans, user addresses, credentials, retailer accounts, or unlicensed product assets.

Before opening a pull request, run:

```text
node scripts/test-scripts.mjs
node scripts/validate-case.mjs <case-dir> --strict

cd runtime-starter
npm install
npm run build
node scripts/smoke.mjs
```

Then record the actual browser/device checks and remaining unknowns. A successful static validator does not prove that a 3D viewer works in a browser.

## Related files

- [Skill instructions](SKILL.md)
- [Bundled runtime](runtime-starter/README.md)
- [Minimal example case](examples/minimal-case)
- [Input contract](references/input-contract.md)
- [Concept-render contract](references/concept-render-contract.md)
- [Product research and provenance](references/product-research-and-provenance.md)
- [Runtime adapter](references/runtime-adapter.md)
- [Validation and delivery](references/validation-and-delivery.md)
- [Deferred feature roadmap](references/feature-roadmap.md)
- [Reference implementation notes](references/github-distillation.md)
- [Changelog](CHANGELOG.md)

## License

The original material in this repository is licensed under the [MIT License](LICENSE). This permission does not extend to third-party dependencies, product photos, meshes, textures, catalog data, or other external assets; source links do not grant copying rights for those materials.
