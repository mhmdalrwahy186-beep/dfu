# Real-world furniture research and provenance

This is a first-class design stage, not an afterthought. The purpose is to make the rendered layout useful for proportion and circulation decisions while keeping retail facts auditable.

## Search procedure

1. Determine the target market, delivery country, language, and currency. If no market is supplied, ask once when it changes the purchase result; otherwise use a broad search and mark regional availability unresolved.
2. Derive furniture roles from the plan and style: sofa, bed, desk, dining table, chair, cabinet, lamp, appliance, or other. Write the footprint, height, clearance, wall/floor, and room constraints before searching.
3. Search live using role + style + market + dimensions. Search the brand/manufacturer and the exact model name separately when possible.
4. Prefer sources in this order: official product page or specification sheet; authorized retailer; established retailer or marketplace. Use image-only or social references for inspiration only.
5. Preserve the exact variant. Do not combine dimensions from one color/size with a purchase URL for another variant.
6. Record selected and rejected candidates with the reason: too large, missing dimensions, unavailable market, wrong variant, no trustworthy purchase page, or style mismatch.
7. Re-read the source page immediately before delivery. Price, stock, shipping, and URL paths are volatile; include `retrievedAt` and `asOf` values.

## Product record requirements

Each selected product in `furniture-products.json` needs:

- stable `id`, role, brand, model, variant, and display name;
- `research.queries`, candidate URLs when available, and a short selected/rejected reason;
- `dimensionsMm.width`, `depth`, and `height`, with a status for each dimension, plus `dimensionSourceUrl` pointing to the page/specification that supplies those values;
- at least one evidence entry with a direct source URL and retrieval date;
- a direct `purchaseUrl`, not a search-result page, unless the source itself is a marketplace listing;
- market/region, currency, and optional price with an as-of date;
- geometry strategy: `provided-model`, `licensed-asset`, `procedural-proxy`, or `conceptual-proxy`;
- `fit.status` of `pass`, `warn`, `fail`, or `unknown`, plus reasons and unresolved clearances;
- a short note explaining what the source does not establish.

`dimensionSourceUrl` must match one of the product's evidence URLs. If the purchase page and specification page differ, keep both records and do not silently merge their variants.

Official dimensions can support the object's outer footprint and height. They do not prove assembly tolerance, packaging size, door delivery path, drawer/door swing, wall strength, ventilation, cable routing, human clearance, accessibility, fire safety, acoustic performance, or structural approval. These must be separate checks.

## Integrating a product into 3D

- Set the model's world dimensions from the normalized product dimensions, not from the reference image's apparent size.
- Attach `userData.productId`, `userData.dimensionSource`, `userData.geometrySource`, and `userData.fitStatus` to the selectable scene root.
- If a GLB/OBJ is provided, verify its bounding box and normalize its pivot once. Do not scale a visually similar model without documenting the scale source.
- If no model is available, generate a parametric proxy with the correct outer box and visible style cues. The UI must say `尺寸依產品資料；外觀為代理模型`.
- Show a product card from the selected object and allow the card to focus the object. Include dimensions, source, purchase URL, retrieval date, fit status, and unresolved checks.
- Export the product records together with the furniture layout so a shared link does not lose provenance.

## Evidence statuses

Use these meanings consistently:

- `confirmed`: directly supported by a current source or user-supplied measurement;
- `estimated`: derived from a stated scale or a source with a clear approximation;
- `inferred`: design interpretation, not a product or construction fact;
- `unknown`: not available or not safely derivable.

Never upgrade an image match, affiliate description, cached snippet, or model appearance to `confirmed` dimensions.

## What the Skill may not do

It may search and present public product information and links. It may not purchase, add to cart, contact sellers, submit a user's address, or claim inventory/price permanence. Do not download copyrighted product photos or meshes into a public viewer unless the asset license permits it; text metadata and a direct source link are sufficient for a procedural proxy.
