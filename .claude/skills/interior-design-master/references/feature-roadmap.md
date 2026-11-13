# Deferred feature roadmap

This is a research-informed backlog, not a claim that every item is implemented. The concept-render bridge and product-evidence workflow are part of the current base contract; the remaining items are deferred candidates. Re-check the current official documentation and the host's available tools before activating a module. Every activated module needs an artifact, a failure state, and a receipt entry.

## Signals from current tools

The following official product pages show recurring patterns worth distilling:

- [Planner 5D plan upload](https://support.planner5d.com/en/articles/14434484-how-to-upload-a-floor-plan) turns supported plan images/documents into editable 3D projects; [its 360 Walkthrough](https://support.planner5d.com/en/articles/10581383-360-walkthrough-feature) adds immersive first-person review.
- [Coohom's all-in-one workflow](https://www.coohom.com/all-in-one-software) combines floor-plan-to-3D, a large furniture catalog, high-resolution renders, 360 walkthroughs, and budget-oriented tooling; [its AI home-design page](https://www.coohom.com/case/ai-home-design) adds conversational layout/design changes.
- [IKEA Kreativ](https://www.ikea.com/us/en/customer-service/knowledge/articles/43460e1e-dd01-4fe8-86ac-74efecd7743f.html) combines photo/room-scan/manual-dimension entry, furniture removal, catalog placement, room-scale products, sharing, and shopping. Its LiDAR and platform limitations are part of the capability contract, not implementation details to hide.
- [REimagineHome](https://www.reimaginehome.ai/) demonstrates structure locking, real products, budgets, and shoppable sets. Interior Design Master may expose links and a shopping list, but must stop before checkout and must preserve product evidence.
- [Apple RoomPlan](https://developer.apple.com/augmented-reality/roomplan/) exposes a LiDAR-based parametric room scan with dimensions, furniture types, scan guidance, and USD/USDZ export.
- [Matterport measurements](https://matterport.com/matterport-academy/intro-to-editing-tools/take-custom-measurements) shows the value of labeled measurements, guided tours, tags, notes, and multiple spatial views.
- [Autodesk Forma environmental analysis](https://www.autodesk.com/products/forma/environmental-impact-analysis) points to sun-hours, daylight, wind, noise, microclimate, embodied carbon, energy, area analysis, and side-by-side concept comparison.
- [SketchUp AI Render](https://help.sketchup.com/en/using-ai-render) shows a useful image-to-model loop: generate from a 3D scene and blend the AI image with the model to inspect divergence. The concept image is still not geometry proof.

## Prioritized backlog

### P0 — high value, relatively portable

- **Concept-to-3D board (base contract).** Generate several mood/render alternatives first, let the user select one, and trace the selected image to style tokens and camera presets. Preserve prompt and model provenance.
- **Design scheme comparison.** Keep multiple complete style/layout variants, compare the same camera across variants, and show a diff of changed furniture, finishes, lighting, budget, and unresolved risks.
- **Natural-language constrained edits.** Support commands such as “move the sofa 20 cm left” or “replace the cabinet with a lighter wood option” by converting them into a previewable, undoable operation. Never let a language command bypass wall, opening, product, or clearance checks.
- **Product alternatives and budget.** For each role, show 2–3 researched alternatives, a budget range with retrieval dates, dimensions, fit warnings, and a source-backed shopping list. Never imply stock or price permanence.
- **Clearance and living-quality checks.** Add door swings, circulation width, reach/ergonomic warnings, accessibility flags, ventilation/cable notes, and a human-review queue. A geometry intersection is not the same as a safe or comfortable layout.
- **Guided presentation.** Save named camera tours, room storyboards, before/after comparisons, annotated snapshots, and a shareable review mode.
- **Evidence-first UI.** Add badges and filters for confirmed, estimated, inferred, unknown, proxy, and blocked content at room, object, product, and render level.

### P1 — valuable but device/data dependent

- **Room scanning import.** Accept RoomPlan/USDZ, Matterport, LiDAR, depth-camera, or other scanner exports; map recognized walls, openings, furniture, and dimensions into `plan.json` with per-object confidence. Keep manual correction and source provenance.
- **Photo cleanup and replacement.** Let a user erase existing furniture/clutter from a room photo, then map the edited image to a locked 3D plan. Treat the edit as presentation-only until the 3D model is updated.
- **AR placement.** Place researched products in a live phone camera view, show a scale/grid/occlusion status, and fall back to the browser viewer when AR, depth, or device permissions are unavailable.
- **User-owned furniture capture.** Turn a user photo or scan into an approximate asset with measured or estimated bounds. Clearly label it as user-supplied/proxy; do not claim manufacturer mesh accuracy.
- **Material and finish lab.** Swap paint, flooring, stone, wood, fabric, and light temperature while preserving the architecture and furniture IDs. Store PBR/texture source and license metadata when assets are used.
- **Multi-floor and linked spaces.** Support levels, stairs, vertical circulation, and shared camera/navigation context without duplicating or corrupting stable IDs.
- **Collaboration layer.** Add comments, pins, approval states, version snapshots, and role-based review while keeping private inputs and product research scoped to the case.

### P2 — advanced or dependent on professional tooling

- **Daylight/environment simulation.** Use geolocation, north, date/time, openings, and weather assumptions to show sun/daylight scenarios. Keep this separate from photoreal lighting and label analysis uncertainty.
- **WebXR/VR and 360/video exports.** Provide an immersive headset mode, guided tours, and camera-path exports only when the target browser/device supports them; retain the normal orbit/walkthrough fallback.
- **Construction handoff.** Generate elevations, reflected ceiling plans, finish schedules, quantities, and BOM/BOQ only from dimensioned, reviewed data. This does not turn an inferred model into permit or structural documentation.
- **Multi-vendor procurement.** Normalize retailer variants, shipping region, price/stock timestamps, alternatives, and package totals. Keep every line item tied to its exact purchase and dimension evidence.
- **Performance and edge-device mode.** Add LODs, progressive asset loading, offline/PWA caching, GPU capability detection, and a real-device test matrix.
- **Professional environmental/safety analysis.** Integrate jurisdiction-specific code, acoustics, energy, carbon, ventilation, or structural checks only with authoritative inputs and domain review; otherwise keep them as informational warnings.

## Activation rule

Do not add a roadmap item merely because a competing tool advertises it. Activate it when the case requests it, the host can execute it, the data contract can preserve provenance, and a meaningful validation method exists. Mark each feature `planned`, `experimental`, `verified`, `unverified`, or `blocked`; a marketing description, generated image, or successful build is not proof of runtime behavior.
