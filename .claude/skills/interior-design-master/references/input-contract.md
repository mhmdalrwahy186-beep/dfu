# Input contract

## Minimum useful input

Accept any of the following and state what is missing:

- A readable floor-plan image, scan, PDF, SVG, or CAD export.
- One known length or a trustworthy scale bar. Without it, use an explicitly provisional scale.
- Room labels or intended uses, if labels are absent.
- Style references: room photos, furniture references, material samples, or a mood board.
- Optional: location/market, budget, occupancy, fixed appliances, existing furniture, preferred retailers, accessibility needs, and products that must remain.

Do not require the user to provide every field before making progress. Ask once only for a missing fact that materially changes geometry, purchase region, or safety/fit. Otherwise continue with a provisional value and put it in `assumptions`.

## Image and drawing handling

1. Preserve original files under `inputs/` and record SHA-256, type, dimensions, and source role.
   `scripts/image-inventory.mjs` probes pixel dimensions for `png`, `jpg`/`jpeg`, `webp` (VP8,
   VP8L, and VP8X headers), and `gif`. For `avif`, `svg`, `pdf`, and `bmp` it does not parse
   dimensions and instead reports `"dimensions": null` with `"dimensionsNote": "not probed for
   this format"` — read those from the file another way before relying on them.
2. Separate visible evidence into `confirmed`, `inferred`, and `unknown`.
3. Identify outer boundary, interior walls, columns, doors and swing/slide direction, windows, stairs, wet areas, fixed cabinetry, utilities, room boundaries, and likely circulation.
4. Prefer a source-coordinate representation that can be overlaid on the generated model. Do not use a decorative 3D image as a construction plan.
5. If the plan has no scale, cross-check a bed, standard door, fixture, or user-provided dimension, label the scale as estimated, and do not report model measurements as site measurements.

   Worked example: a no-scale marketing floor plan shows a double bed drawn 187 px wide. A standard
   double bed is 1.35 m wide, so `metresPerPixel = 1.35 / 187 = 0.00722`. (A standard door leaf works
   the same way: e.g. a 210 px drawn leaf against a real 0.8 m leaf gives `0.8 / 210 = 0.00381`.) Write
   in `plan.json.source`:

   ```json
   {"scaleStatus": "estimated", "metresPerPixel": 0.00722}
   ```

   and add a matching entry to `assumptions[]`:

   ```json
   {"field": "plan.scale", "value": "0.00722 m/px", "basis": "double bed drawn at 187px, assumed 1.35m standard width; no scale bar or stated dimension on the source image"}
   ```

   The bundled `examples/minimal-case` is an authored plan with `scaleStatus: "confirmed"` and does not
   exercise this estimation path; use it as a structural reference only, not as a scale-estimation example.
6. If north/orientation is absent, do not claim real morning/afternoon sun. Use a neutral or clearly labeled illustrative orientation.

## Style extraction

Translate references into design tokens rather than copying a single image:

- dominant and accent colors;
- wood, stone, metal, glass, paint, fabric, and floor material cues;
- furniture silhouettes, proportions, leg/base language, hardware, and softness;
- lighting direction, warmth, contrast, and fixture language;
- art, plants, textiles, and object density;
- composition principles and what must remain visually quiet.

The style spec may propose product roles, but product identity and dimensions must come from product evidence, not visual resemblance.

## Case files

The preferred case directory is:

```text
case/
├─ case.json
├─ inputs/plan/
├─ inputs/style/
├─ inputs/products/
├─ plan.json
├─ style.json
├─ concept-renders.json
├─ furniture-products.json
├─ state.json
├─ evidence/
└─ output/
```

The initializer creates these files at the case root for a small project. Larger projects may move specs under `spec/`, but the paths used by the validator and receipt must remain explicit.
