# Volume Templates

## volume-template/ (Minimal Skeleton)

A minimal starter template with just the required structure, IDs, and placeholder comments. Use this to create new volumes from scratch.

## volume-example/ (Full Example)

A complete working example based on the regression volume. Use this as a reference for how a finished volume looks.

## Quick Start

1. Copy `volume-template/` to `volumes/your-volume-id/`
2. Update `config.json` with your volume settings
3. Customize `game.html` with your content and questions
4. Add an entry to `volumes/registry.json`
5. Run `scripts/validate-volumes.html` to verify everything is wired up correctly

## Documentation

- **[Game Design Guide](../../../docs/GAME_DESIGN_GUIDE.md)** -- How to convert course materials (slides, notebooks, code) into engaging 15-20 minute games. Covers the full design methodology: material analysis, concept extraction, narrative design, interactive element design, question design with Bloom's taxonomy progression, and case studies showing how Session 2 became the regression game and Session 3 became the multiple regression game.
- **[Adding Volumes](../../../docs/ADDING_VOLUMES.md)** -- Technical reference for HTML structure, config fields, required IDs, shared functions, analytics integration, and testing checklists.

## Source Materials

Course materials used as the basis for games are stored in `reference_materials/` (gitignored). Each session folder typically contains slides (.pdf/.pptx/.tex), Jupyter notebooks, analysis scripts, and visualization images. See the [Game Design Guide](../../../docs/GAME_DESIGN_GUIDE.md) for how to convert these into games.
