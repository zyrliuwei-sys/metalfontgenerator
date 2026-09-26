# Studio 2am reference notes

Source: https://studio2am.co/

This is a design reference only. The first metalfontgenerator build borrows the source's visual language, not its copy, assets, or marketplace structure.

## Observed DNA

- Deep charcoal / black canvas with a compressed, gallery-like page rhythm.
- Narrow top navigation with a centered wordmark and utility controls.
- Content is grouped into named collections such as Staff Selects, Trending Fonts, and New Releases.
- Product imagery is the main visual object, arranged in irregular or masonry-like cards instead of a uniform three-card row.
- High contrast display lettering and compact metadata keep the page editorial while remaining commerce-oriented.
- A distinct feature block introduces an interactive editor with the concise promise: make louder visuals.

## Translation into metalfontgenerator

- Marketplace collections become material studies and saved angle presets.
- Product cards become real, interactive CSS metal word previews instead of decorative thumbnails.
- The source's dark background becomes an obsidian workbench with annealed copper as the single action color.
- The source's modular sections are retained as a loose rhythm, while the core page action is a single generator surface.

## Interaction model

- Reference site: click-driven navigation, wishlist actions, search, and an embedded editor CTA.
- metalfontgenerator v1: click / range-input driven controls. `angle`, `extrusion`, `light`, `tracking`, `finish`, and the text field all update the canvas immediately. The Generate button plays a short local preview state and leaves a clear integration point for a real provider.

## Captured visual facts

- Body font observed: Inter, sans-serif.
- Viewport used for capture: 1728px wide.
- Body text observed: rgb(236, 236, 243) on an effectively black page.
- Product thumbnails surfaced as compact square assets, commonly rendered around 180x180.
- Full-page screenshot: `docs/design-references/studio2am-home.png`.
