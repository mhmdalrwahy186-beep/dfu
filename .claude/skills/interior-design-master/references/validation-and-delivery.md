# Validation and delivery contract

## Sequence

1. Run `node scripts/test-scripts.mjs`. These are offline self-tests for the skill's own scripts; they need no network and no case. A failure here means the tooling is wrong, so fix it before trusting any later result.
2. Run `node scripts/validate-case.mjs <case-dir> --strict`. The validator enforces the plan, style, concept-render, product, and case-state schemas in full; a strict pass is a schema pass, not a design review.
3. If the concept stage was used, inspect every selected concept image and verify its prompt, source, provider, model, and timestamp record. Compare the selected concept with the 3D result. Generated pixels are neither geometry nor product evidence.
4. Run the runtime's install and build checks.
5. Run `node scripts/smoke.mjs` from the runtime. It builds `dist/` first (unless `--no-build` is passed) since it serves the app via `vite preview`, then captures desktop and mobile screenshots, checks for console errors, toggles views, places a proxy, and round-trips the share hash. A smoke pass is a floor, not a substitute for step 6.
6. Open the actual viewer and inspect at least one overall view, one interior view, one top or plan view, and one product-linked furniture view.
7. Test a style switch, room focus, furniture move, rotate, and undo, a blocked placement, walkthrough collision, save and restore, and share and import if implemented.
8. Check desktop and mobile layouts when responsive delivery is requested. Record simulated versus real-device testing; a desktop viewport with simulated touch is a layout check only.
9. For every selected product, open the source and purchase URL, verify the exact variant, and compare the recorded dimensions with the product page. A dead or redirected page is a failed evidence check, not a silent pass.
10. When network access is available, run `node scripts/check-product-links.mjs <case-dir>` and include its output verbatim.
11. Produce a receipt with commands, timestamps, input and spec hashes, browser and device context, screenshots, product coverage, failures, and remaining unknowns.

## Link check semantics

`check-product-links.mjs` separates two outcomes and they must not be merged in the report.

| Result | Meaning | Recorded as | Exit code effect |
|---|---|---|---|
| `failed` | The page is gone or wrong: 404, 410, a redirect to an unrelated page | evidence failure, fix or drop the product | exits 1 |
| `blocked` | The checker could not reach a verdict: 403, 429, 503, timeout, network error | `unverified` | does not fail the run |

A blocked URL never counts as a passing check. Either re-check it manually in a browser and record what you saw, or leave the product `unverified` and say so in the receipt.

## Required distinctions

- `verified`: the stated check ran and passed in the named environment;
- `inferred`: a design or geometry decision derived from incomplete source material;
- `unverified`: a check could not be run or its evidence was insufficient;
- `blocked`: a required output cannot be responsibly produced without new input or tooling.

Do not report a successful build as successful browser behavior. Do not report a product URL as current stock. Do not report a model coordinate measurement as a site measurement.

## Delivery bundle

The normal bundle contains:

- the runnable viewer, its install and run commands, and the case link step;
- `plan.json`, `style.json`, `furniture-products.json`, and current `state.json`;
- selected concept renders and `concept-renders.json` metadata when the image-generation stage was used;
- product and furniture export with direct source and purchase links;
- representative screenshots, including the smoke screenshots, and a shareable state URL when supported;
- validation receipt and assumptions and unknowns report;
- model exports only when the runtime can export them without dropping product IDs or fixed-layer boundaries.

Do not publish or push to a remote repository unless the user authorized that target. Keep user-provided inputs and private product notes separate from a public Skill package.
