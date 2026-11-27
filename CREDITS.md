# THE PYRAMID: credits

The Pyramid of Advaithian Horror, Konrad Weissel and the Fête de l'Orge: the Silent Witness Archive, an alternate-history fiction by Advaith Sajith (2026).
Game design, code, maps and in-game writing (including the lines attributed to Weissel): made with Claude Code.

Konrad Weissel and *Die Pyramide des Grauens* are invented.

## Textures
Wall, floor and metal surfaces are from **Poly Haven** (polyhaven.com), licence **CC0**,
downsampled to 128 px and palette-reduced:
long_white_tiles, dirty_tiles, painted_worn_brick, factory_brick, concrete_block_wall,
rusty_corrugated_iron, metal_plate, peeling_painted_wall, dark_paneled_wood,
concrete_floor_worn_001, dirty_concrete, asphalt_02, brown_mud_02, old_linoleum_flooring_01,
dirty_carpet, metal_grate_rusty, rusty_metal_02, green_metal_rust, rusty_metal_sheet,
worn_plaster_wall, wooden_planks.
All other textures (cobbles, facades, people, signs, paper, water) are generated in code (`js/tex2.js`).

## Sound
Most audio is synthesised live. Fourteen samples are from **freesound.org**, all **CC0**;
the full list with authors and links is in `assets/sfx/CREDITS.md`.

## Libraries
three.js r128, MIT licence.

## Engine
The renderer and audio (`js/gfx.js`, `js/audio.js`) come from Hanging Weight. The level builder,
people and extra sounds (`js/world.js`, `js/people.js`, `js/sfx2.js`) are shared between
Uncounted and The Pyramid.
