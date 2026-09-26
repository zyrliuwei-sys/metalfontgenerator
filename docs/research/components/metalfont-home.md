# metalfontgenerator home specification

## Overview

The homepage is a dark creative-tool landing page with a generator workbench above the fold. It should feel like a type foundry's browser editor, not a generic AI dashboard.

## Content structure

1. Narrow site header with product mark, navigation, language / theme utilities, and account CTA.
2. Marquee hero with short copy and a large, angled metal word sample.
3. Workbench with the editable word, material presets, three angle buttons, range controls, upload reference affordance, and Generate action.
4. Material studies arranged as an asymmetric grid of real CSS previews.
5. Short feature rail explaining multi-angle output, reflective materials, and export-ready results.
6. Dark footer retaining the product brand and utility links.

## Exact visual direction

- Base: obsidian charcoal, not pure black.
- Action hue: annealed copper / orange. No purple AI gradients.
- Display: Space Grotesk with Inter body copy and a monospace micro-label.
- Edges: hairline rules and compact rectangular controls. Rounded pills are reserved for small utility controls.
- Signature: metal type itself. The canvas is the hero visual and updates with user input.

## States and behaviors

- Word input: updates the canvas text as the user types.
- Finish tiles: selected tile gets copper rule and a small selected label.
- Orbit controls: Front / three-quarter / profile update angle.
- Sliders: update values and the CSS metal preview with no page navigation.
- Generate: button enters a short loading state, then shows `Preview ready`. It is intentionally local in v1 so the interface is testable before a provider is configured.
- Export: shows `Export queued` in the workbench status area. The real file / provider connection is a follow-up module.
- Upload: opens a real file input and displays the selected filename.

## Responsive behavior

- At 768px and below, hero stacks copy over preview; workbench becomes one column.
- At 480px and below, controls stay full width, the material grid becomes one column, and no clickable label wraps.
- The page root uses `overflow-x: clip` to avoid accidental horizontal scroll from the oversized hero word.
