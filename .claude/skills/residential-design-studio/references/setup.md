# Setup on your own machine

What each stage needs, cheapest first. Nothing here needs a paid service except stage 10
(MeltFlex), which stays off until you opt in.

## Stages 1-2: concept design, CAD drawings, 3D page (architectural-concept-design)

- Python 3.10+.
- Either `uv` (installs dependencies on the fly: `uv run .claude/skills/architectural-concept-design/scripts/concept.py ...`)
  or `pip install -r .claude/skills/architectural-concept-design/scripts/requirements.txt`
  (ezdxf, PyMuPDF, Pillow).
- Optional: Chrome, Edge or Chromium for `build --renders`. Without one, drawings and
  `output/model/index.html` are still produced.

## Stage 4: interior design viewer (interior-design-master)

- Node.js 20+ and npm.
- Copy the viewer into your design project rather than building inside `.claude/`:
  ```bash
  cp -r .claude/skills/interior-design-master/runtime-starter <project>/viewer
  cd <project>/viewer && npm install
  node scripts/fetch-assets.mjs     # optional, free CC0 textures from Poly Haven (hash-checked)
  ```
- `node scripts/smoke.mjs` uses Playwright's Chromium. Run `npx playwright install chromium`
  once if it reports a missing browser.

## Stages 3 and 5-9: Blender, BIM and photoreal visualization

1. **Blender 5.1 or newer** from blender.org. The Blender recipes were written against 5.1.1 and
   checked here against 5.3.0. Bonsai needs 5.1+.
2. **A Blender MCP server.** This is how Claude drives Blender. The skills support two backends:
   - `blender-mcp` by ahujasid (PyPI package, run with `uvx blender-mcp`), plus its Blender add-on
     (`addon.py` from that project), started from Blender's sidebar (BlenderMCP tab, "Connect").
   - Blender's official MCP server, if your Blender build ships it.
   See `.claude/skills/text-to-blender/references/agent-hosts.md` and `mcp-backends.md` for both.
   This is third-party software that runs code inside Blender. Read its source before enabling it.
3. **Register the server with Claude Code.** A template is in
   `../config/blender-mcp.example.json`. Copy the `blender` entry into a project `.mcp.json` (or
   run `claude mcp add blender -- uvx blender-mcp`). On Windows use `"command": "cmd"`,
   `"args": ["/c", "uvx", "blender-mcp"]`. Keep the server name `blender`: the skills'
   `allowed-tools` lists expect `mcp__blender__*`.
4. **Bonsai add-on** for BIM (stage 3): in Blender, Edit > Preferences > Get Extensions, search
   "Bonsai", install, restart. See the upstream INSTALL notes linked from the manifest.
5. Optional: an NVIDIA GPU for OptiX denoising. Without one, use OpenImageDenoise (CPU), which
   works everywhere.

Free asset sources the skills can use: Poly Haven HDRIs and textures (CC0). BlenderMCP's
Sketchfab and Hyper3D tools need accounts and keys; treat them like stage 10 and ask first.

## Stage 10: MeltFlex (paid, opt-in)

Only if you decide to pay for it: a MeltFlex subscription, then an API key exported as
`MELTFLEX_API_KEY`. Each generation costs credits (about 10 per image, more for 3D and video).
The skills are installed but inactive until then.

## Check what is ready

```bash
python3 -I .claude/skills/residential-design-studio/scripts/verify_skills.py
```
