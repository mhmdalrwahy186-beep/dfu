# Concept render contract

The concept-render stage is a fast visual decision aid between input intake and detailed 3D implementation. It is recommended when the host exposes an image-generation tool, MCP server, skill, or API, and it is optional in every case. It is never a substitute for the spatial or product evidence contracts.

## Generation

1. Read the plan far enough to identify rooms, major openings, fixed elements, approximate camera positions, and hard constraints.
2. Use supplied style images as reference images with an explicit role. Generate 2–4 alternatives for the room or composition that actually needs a design decision.
3. Put the intended room, camera/framing, palette, materials, lighting, furniture language, required objects, and avoid-list in the prompt. Do not ask the image model to invent exact walls, dimensions, product models, or construction facts.
4. Pick the generator from what the host actually exposes, and preserve the same metadata contract whichever one you use:
   - **Codex**: follow the local image-generation skill's built-in-tool path. Use a CLI or API fallback only when the user explicitly chooses or confirms it.
   - **Claude Code**: use an available image-generation MCP server or image skill, for example a nanobanana or Gemini image MCP. If none is connected, use an image-generation HTTP API the project is already configured for, such as Runware, reading its key from the project's own environment configuration. Never paste a key into a case file, a prompt, or a committed file, and never hard-code a machine-specific path.
   - **Neither available**: record the stage as skipped in `concept-renders.json` with the reason, and continue to the white-model gate. A skipped concept stage is a normal outcome, not a failure.
5. Save project-bound selected images under the case output, not only in a host cache. Do not overwrite an existing concept image; create a versioned sibling.

## Required record

Maintain `concept-renders.json` with one record per generated alternative; validate its shape against [concept-render.schema.json](concept-render.schema.json). Each record should contain:

- stable `id`, room/style references, and `sourceInputs`;
- prompt, negative/avoid constraints, provider/model, and `generatedAt`;
- project-relative `outputPath` when the image is retained;
- `status`: `candidate`, `selected`, `rejected`, or `blocked`;
- camera/composition hints and notes about constraints the image violated or left unresolved.

The selected render becomes a style and composition reference for `style.json`; it does not become a product source, a dimension source, or a proof that the layout is buildable. If a generated render conflicts with the plan, the plan wins and the conflict is recorded.

## Handoff to 3D

Translate the selected render into explicit palette, material, lighting, furniture-role, and camera tokens. Research real products separately. Use the 3D model and `plan.json` as the source of truth for walls, openings, scale, clearances, and object placement. Present the selected concept beside the corresponding 3D camera so the user can see what was preserved and what was intentionally changed.
