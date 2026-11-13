---
name: residential-design-studio
description: >-
  Entry point and router for residential architecture work in this project: briefing, site and
  floor planning, CAD drawings, BIM, interior design and furniture layout, exterior and facade
  design, landscaping, and photorealistic 3D visualization. Read it first for any house,
  apartment, renovation, room, garden or archviz request, or when a request spans more than one
  stage (for example "design a house and render it", "furnish this plan", "make this IFC model
  look real"), then load the specialist skills it names in the order it gives. Also use when the
  user asks which design skills are installed, whether they work, or how to set them up.
---

# Residential design studio

One workflow over the 36 specialist design skills in `.claude/skills/`. This skill decides **which skill runs
when**, what each stage hands to the next, and which stages need software the user must install.
The specialist skills do the work; follow their own instructions once loaded.

Status of every skill, what was verified, and what each needs: [skills-manifest.json](skills-manifest.json)
and [references/verification.md](references/verification.md). Setup on the user's machine:
[references/setup.md](references/setup.md). Known upstream bugs to avoid:
[references/known-issues.md](references/known-issues.md).

## Ground rules

1. **No paid services without asking.** `meltflex-*` skills (except `meltflex-embed`'s docs) call a
   paid API billed per image (10 to 75+ credits) and need `MELTFLEX_API_KEY`. Never call them, ask
   for a key, or run `meltflex-mcp auth login` until the user agrees to that cost in this
   conversation. The same applies to BlenderMCP's Hyper3D, Sketchfab or other key-based provider
   tools. Free paths exist for every stage; offer those first.
2. **One source of truth per stage.** The `design.json` from architectural-concept-design owns
   room sizes, walls and openings. Later stages read it; they do not silently change the layout.
   If interior or visualization work reveals a layout problem, fix `design.json`, re-run `check`
   and rebuild, then carry the change forward.
3. **Never invent site facts** (boundary, north, setbacks, area limits, product dimensions). Ask,
   or label them as placeholders or assumptions, as each skill requires.
4. **Check before running.** Before any Blender stage, confirm a Blender MCP backend is connected
   (tools named `mcp__blender__*` or `mcp__blender_official__*`). If none is, say so, point the
   user to `references/setup.md`, and deliver the stages that do not need Blender.
5. **Concept stage only.** Say plainly that outputs are concept design; structure, services,
   permits and code compliance need licensed professionals.

## Pipeline

| # | Stage | Primary skill | Supporting skills | Needs | Hands off |
|---|---|---|---|---|---|
| 1 | Brief, requirement matrix, decision questions | `architectural-concept-design` (steps 1-4) | - | Python 3.10+ | `brief.md`, `specification.md` |
| 2 | Site plan, floor plans, elevations, section, areas | `architectural-concept-design` (steps 5-8) | - | Python + ezdxf, PyMuPDF, Pillow; Chrome for renders | `design.json`, DXF/PDF/PNG set, `model/index.html`, area schedule |
| 3 | BIM model (optional): IFC walls, slabs, openings, stairs, roof, spaces, grids, BIM drawings | `bonsai-project-setup` then `bonsai-walls`, `bonsai-openings`, `bonsai-stairs`, `bonsai-roofs`, `bonsai-spaces-grid`, `bonsai-drawings` | - | Blender 5.1+, Bonsai add-on, BlenderMCP | `.ifc`, SVG drawings, IDS/BCF |
| 4 | Interior design: style spec, furniture layout, products, walkable 3D viewer | `interior-design-master` | `set-dressing` | Node 20+, npm; Chromium for smoke tests | case dir (`plan.json`, `style.json`, `furniture-products.json`, `state.json`), viewer |
| 5 | Exterior and landscape massing | `environment-artist` | `vegetation-artist`, `set-dressing`, `materials` | Blender + MCP | site, terrain, planting in the Blender scene |
| 6 | 3D scene build in Blender | `text-to-blender` (router) | `blender-pro-workflow`, `blender-modeling`, `blender-uv-texturing`, `wireframe-to-3d` | Blender + MCP | Blender scene at real-world scale |
| 7 | Materials and look development | `archviz` | `blender-materials`, `materials`, `realistic-style`, `lookdev`, `reference-look-calibration` | Blender + MCP | PBR materials |
| 8 | Lighting, cameras, photoreal stills and walkthroughs | `archviz` | `blender-lighting`, `lighting`, `blender-cameras`, `camera-cinematography`, `blender-rendering`, `rendering`, `compositing` | Blender + MCP (Cycles) | PNG/EXR stills, animation |
| 9 | Export for web, AR or other tools | `blender-export` | - | Blender + MCP | GLB/FBX/USD/OBJ |
| 10 | Photo-based redesign (paid, opt-in) | `meltflex-design` | `meltflex-furniture`, `meltflex-3d` | MeltFlex subscription + API key | AI renders, GLB, 3D world link |
| - | Put a design tool on a website | `meltflex-embed` | - | MeltFlex account (site owner pays per design) | iframe snippet |

Run only the stages the request needs. Typical routes:

- **New house, drawings only:** 1 → 2.
- **New house, full package:** 1 → 2 → 4 → 6 → 7 → 8 (add 3 when the user wants IFC/BIM, and 5 for
  landscape).
- **Furnish or restyle an existing plan:** 4 (feed it the plan image or `design.json` rooms) → 7 → 8.
- **Exterior and garden:** 2 for the building, 5 for the site, then 7 → 8 with an HDRI or sun/sky.
- **Make an existing BIM model look real:** 3 (audit) → 6 → 7 → 8.
- **Photo of an existing room or facade:** offer free stages first. Use 10 only on explicit consent.

## Hand-offs between stages

- **2 → 4.** Write `plan.json` rooms, walls and openings from `design.json` (same IDs, metres, same
  origin). Record the source as `design.json` so the interior stage treats geometry as fact, not
  inference. The plan PNGs in `output/drawings/png/` are the image inputs.
- **2 → 6.** Rebuild the shell in Blender from `design.json` coordinates (walls as boxes or
  solidified outlines, openings as cut-outs, slab per level). Alternatively import
  `output/drawings/model_1to1_metres.dxf` for tracing. Keep real scale (1 unit = 1 m) and the
  level heights from `design.json`.
- **2 → 3.** Map `design.json` walls to `bonsai-walls` polylines, openings to `bonsai-openings`,
  stairs to `bonsai-stairs`, rooms to `bonsai-spaces-grid`, roof type and pitch to `bonsai-roofs`.
- **4 → 6/7.** Use `furniture-products.json` outer dimensions for furniture blocks and
  `style.json` palettes and finishes for the material choices.
- **6 → 8.** Lock cameras (24-35 mm interiors, vertical shift rather than tilt for exteriors)
  before the heavy look-dev, as `archviz` requires.

## Precedence when skills overlap

Two packs cover Blender lighting, materials and rendering. Use them like this:

- **`archviz` sets the intent** for architectural scenes (scale checks, lens range, HDRI plus
  practicals, plausible glass, no oversaturation).
- **`blender-*` skills (cc-blender-skill) supply the executable recipes** and MCP backend
  handling. `text-to-blender` routes and `blender-skill-harmonizer` settles conflicts between them.
- **`lighting`, `materials`, `rendering`, `compositing`, `lookdev`, `camera-cinematography`,
  `realistic-style` (arjun988 pack) add art direction and checklists.** Ignore their game-engine
  and horror-specific advice for architectural work.
- Shared notes for the arjun988 skills live in `.claude/skills/references/` (not a skill).
- `text-to-blender` mentions `quality-refinement-autoloop`, which was deliberately not installed
  because it edits skill files. When a result is rejected, iterate on the scene instead.

## Delivery checklist

- Drawing set PDF and area schedule against each limit (stage 2).
- Interactive 3D: `output/model/index.html` and/or the interior viewer (stage 4).
- Photoreal stills: at least one exterior and the key interiors (stage 8), plus the `.blend` path.
- Assumptions, open issues, which stages were skipped and why (missing software, no consent for
  paid services), and the concept-stage disclaimer.

## Checking the installation

```bash
python3 -I .claude/skills/residential-design-studio/scripts/verify_skills.py          # table
python3 -I .claude/skills/residential-design-studio/scripts/verify_skills.py --json   # machine-readable
```

It checks every skill in the manifest (frontmatter, linked files, script syntax) and which local
tools are present (Python packages, Node, Blender, a browser, the Blender MCP config, whether a
MeltFlex key is set, without printing it). It never runs third-party code or calls a network
service.
