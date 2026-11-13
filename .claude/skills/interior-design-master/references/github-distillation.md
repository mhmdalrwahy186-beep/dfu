# Reference implementation notes

This package was informed by publicly accessible residential spatial-design patterns, including the [chyxin071-sys/interiordesign](https://github.com/chyxin071-sys/interiordesign) project and its `residential-spatial-design` Skill at the reviewed main-branch snapshot.

## Patterns retained

- A staged workflow: inspect inputs, generate a white model, obtain or use confirmation, then generate replaceable designs.
- Data-first spatial definitions with stable room, wall, opening, furniture, route, and camera IDs.
- A fixed architectural layer separated from independent style/design layers.
- Explicit inference notes for missing scale, north, height, open-air conditions, and construction facts.
- Dedicated view modes, room focus, camera presets, display modes, section/review annotations, and model/PNG export.
- Separate model and design validators for geometry validity, connectivity, coverage, style differences, camera obstacles, and performance.
- Editing safeguards: stable local pivots, layer-scoped history, X/Z movement, Y rotation, snapping, deselection, and fixed-architecture protection.

## Bundled runtime additions

The bundled runtime adds reusable interaction behavior without making any one home's data the primary contract: furniture-library placement, wall snapping, conservative overlap checks, first-person walk collision, measurement, 2x capture, quality tiers, browser save/share state, and mobile joystick support. These mechanisms belong in the runtime adapter, while each project's walls, rooms, zones, product choices, and copy belong in the case spec.

## Do not copy as generic truth

- the example plan's pixel scale, coordinates, dimensions, room IDs, camera positions, or open-air conclusions;
- the example styles, furniture, source images, GLB, or validation numbers;
- deployment IDs, remote settings, or any user/project-specific text;
- a prior browser or geometry receipt as proof for a new case.

The reviewed source is a design reference, not a source of redistributable code or assets for this package. Do not copy its code, example data, images, models, or deployment material without compatible permission.
