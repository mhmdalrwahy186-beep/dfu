# Verification record

Installed and verified on 2026-11-13 in a Linux cloud sandbox (Python 3.13, Node 22, Chromium).
Third-party scripts were read before anything ran, and tests ran in a scratch directory outside the
project. Re-check your own machine with `scripts/verify_skills.py`.

## Security review (before execution)

| Pack | Code | Findings |
|---|---|---|
| architectural-concept-design | Python engine, vendored three.js r147 | Local file I/O only. One subprocess call runs the local Chrome for screenshots. No network, eval or deletes. three.js files are byte-identical to the `three@0.147.0` npm release. |
| interior-design-master | Node scripts, Vite/three.js viewer | Network use is opt-in and visible: `fetch-assets.mjs` (CC0 Poly Haven files, SHA-256 checked) and `check-product-links.mjs` (HEAD/GET on product URLs you supply). `smoke.mjs` starts a local preview server on 127.0.0.1. |
| arjun988 blender-skills | Markdown only | Nothing executable. |
| bonsai-bim-skills | Python helpers for inside Blender | Only Bonsai/IfcOpenShell/bpy calls plus writing the CSV, HTML or IFC files you request. No network or subprocess. |
| cc-blender-skill | Markdown, Python analysis scripts | Scripts read images or JSON and write reports. No network or subprocess. |
| MeltFlex skills | Markdown only | They instruct calls to the paid MeltFlex REST API. Its MCP server (`mcpb/`) was not installed. |

## Functional tests

| Skill(s) | Test | Result |
|---|---|---|
| architectural-concept-design | `init`, `check`, `build --renders` on the bundled two-storey example | Pass: 0 errors, 7 sheets, DXF audit clean, 3D page, 6 renders |
| interior-design-master | `test-scripts.mjs`; `validate-case --strict` on the example; viewer `npm ci`, build and `smoke.mjs` | Pass: all script tests; 17/17 smoke checks (desktop and mobile, walkthrough collision, product placement, share-link round trip). Texture download was blocked by the sandbox network (optional). |
| text-to-blender, blender-* (12 skills) | Ran all 132 Python blocks from their SKILL.md and reference files in headless Blender 5.3.0. Blocks that use named objects were re-run with those objects created first. | 77 ran clean. 34 need earlier context, 9 do file I/O (skipped), 3 use placeholder paths or need the GUI. Real API mismatches: 3, listed in known-issues.md. |
| archviz pipeline (archviz + blender-materials/lighting/cameras/rendering) | 5 x 4 m room with window, PBR finishes, sun and sky, 24 mm camera, Cycles 64 spp with OIDN, AgX | Pass: 1280 x 800 render in about 60 s on CPU |
| wireframe-to-3d | `wireframe_analyzer.py` on a generated elevation sheet (OpenCV 5) | Pass: 119 contours with Bezier fits |
| bonsai-* (7 skills) | Syntax check, plus a static check of every Bonsai class and `bpy.ops.bim.*` operator the helpers use against the Bonsai 0.9.0 source | Pass: 4/4 classes, 31/31 operators, 7/7 tool classes. Not executed: running Bonsai itself was outside what this session was allowed to run. |
| arjun988 skills | Frontmatter and linked references | Pass |
| meltflex-* | Frontmatter only | Not run: needs a paid key; not activated by design |
