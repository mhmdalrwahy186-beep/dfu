# Known upstream issues

Found while verifying the installed skills against Blender 5.3.0 and Bonsai 0.9.0 source on
2026-11-13. The third-party skill files are left unmodified; work around these when using them.

| Skill | Issue | Workaround |
|---|---|---|
| `blender-export` | The glTF recipes (SKILL.md and references/overview.md) pass `export_textures=True` to `bpy.ops.export_scene.gltf`; Blender 5.3 rejects that keyword. | Omit it. Textures are exported through `export_image_format` (`AUTO`, `JPEG`, `WEBP`, `NONE`). |
| `wireframe-to-3d` | One recipe sets `DecimateModifier.use_collapse_degenerate`, which does not exist. | Leave it out; `use_collapse_triangulate` and `use_symmetry` are the available options. The analyzer script itself works. |
| `blender-rendering` | `references/overview.md` sets `BLENDER_EEVEE_NEXT` without the fallback that SKILL.md uses; Blender 5.x calls it `BLENDER_EEVEE`. One snippet in that file is an indented fragment. | Use the SKILL.md recipe (try/except fallback). |
| `blender-rendering` | OptiX denoising needs an NVIDIA GPU. | Use `OPENIMAGEDENOISE` on CPU or other GPUs. |
| `text-to-blender` | Links to `references/intent-routing.md` and `references/code-execution-rules.md`, which are not in the upstream repo. | The routing table in SKILL.md and `references/mcp-backends.md` cover the same ground. |
| `text-to-blender` | Mentions `quality-refinement-autoloop`, which was not installed (it edits skill files). | Iterate on the scene instead; see residential-design-studio. |
| `blender-export` | `obj.asset_generate_preview()` crashes headless Blender. | Run it only in the Blender GUI. |
| `interior-design-master` | `fetch-assets.mjs` needs access to dl.polyhaven.org. | Optional; the viewer falls back to procedural textures. |
| `bonsai-*` | Written for Bonsai 0.8.5 on Blender 5.1. Statically checked against Bonsai 0.9.0 (all operators and classes exist), not executed. | Test on a copy of your IFC first; report breakage upstream. |
