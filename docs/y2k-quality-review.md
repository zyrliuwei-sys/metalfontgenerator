# Y2K Font Maker — quality review

Reviewed 2026-10-28. Scope: `/y2k-font-maker` and its Chinese locale.

The requested benchmark is the craft associated with Awwwards, the Webby Awards and FWA. This is a local implementation and self-review, not an award, jury score, or guarantee of winning. The review covers visual authorship, usability, interaction, content, responsiveness and implementation quality. The [Webby website criteria](https://www.webbyawards.com/about/webbyfact/) provide a useful independent framework for those dimensions.

## Three refinement passes

1. **Art direction and authorship.** Replaced the generic lettering treatment with the original Vector 2000 alphabet: uppercase Latin letters, digits and selected punctuation are drawn as SVG paths. Classic remains available. The page now uses the lettering as its visual focus, with a clear control dock, varied poster compositions, larger body copy, and a usable guide index. Removed repeated decorative stars, chapter tags and miniature interface labels.
2. **Composition and responsive correction.** Visual inspection caught intrinsic SVG dimensions pushing lettering below the intended canvas, then a mobile crop that cut off the first and last letters. Corrected the stage framing independently of the full export canvas. Reviewed 320, 375, 414 and 768 px screenshots, with additional layout measurements at 1024, 1440 and 1920 px. No document overflow or overflowing HTML layout elements remained in those checks.
3. **Interaction, accessibility and output.** Added drag-to-relight with a native keyboard-operable range equivalent. Verified the material changes, full preset restoration, both letterform modes, empty input, 24-character input, reset and real PNG downloads. Increased touch targets, reserved helper space, checked focus styling, and retained a reduced-motion path. Regenerated the sharing image from the actual vector renderer.

## Evidence and practical limits

| Check                        | Result                                                                                                                            |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Responsive widths            | 320, 375, 414, 768, 1024, 1440 and 1920 px: document width equals viewport width                                                  |
| Main control targets         | At least 44 × 44 CSS px; mobile navigation target enlarged to the same minimum                                                    |
| Sampled text contrast        | Key body/control pairs: 6.32:1 or higher; pink composition caption: 10.48:1                                                       |
| Moving the light             | Pointer movement updated the light setting to 70 and the SVG reflection gradient to `x1=0.1`                                      |
| Preset restoration           | CYBER CLUB restores Vector mode, depth 12, spacing 5, slant 10 and light 62                                                       |
| Vector and Classic downloads | Real browser downloads visually inspected; both 2400 × 1200 PNG with alpha                                                        |
| Export consistency           | The current SVG is snapshotted at the start of export; changing the UI during preparation does not alter that snapshot            |
| Empty and long input         | Empty text disables download with an explanation; 24-character Vector input produces 24 glyphs                                    |
| Localization                 | All Y2K keys have English and Chinese values; editorial content is approximately 1210 English words                               |
| SEO                          | Existing route metadata, localized canonical/hreflang, server-rendered guide, sitemap and application/breadcrumb schemas retained |
| Runtime additions            | No new dependency, WebGL runtime, external image service or perpetual animation                                                   |
| Production build             | `pnpm build` passes                                                                                                               |

The letterforms and material are generated artwork; their gradients intentionally differ from the flat, token-based UI palette. The preview uses a tighter camera crop to use the screen well; PNG export restores the complete transparent 2:1 canvas around the same artwork.

Full-project TypeScript checking still reports the six pre-existing template errors in `audiences`, `changes-keeps`, `features`, `free-tier` and `how-it-works`. No Y2K-file errors were reported. The existing bundler warnings about large chunks and the Zod `validate` export remain. No Lighthouse or real-user Core Web Vitals score is claimed, and no Safari/device-lab certification was performed.

## Design self-assessment

Hallmark's six subjective axes, on a 1–5 scale: philosophy 4, hierarchy 4, execution 4, specificity 5, restraint 4, structural variety 5. These are internal design judgments, not Awwwards/Webby/FWA scores. The strongest improvement is specificity: the page now has its own letterforms and a material interaction that changes the downloaded artwork.
