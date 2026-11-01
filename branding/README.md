# Deck Fork launcher artwork

`icon.svg` is the scalable full-color fork icon. The Android adaptive foreground
is `app/src/main/res/drawable/ic_launcher_foreground.xml`; the historical `dev`
flavor inherits it. The same foreground is used for Android's monochrome icon.
The FORK badge is outlined geometry, so no font is loaded or bundled at runtime.
Badge outlines were produced from DejaVu Sans Bold; the original Deck card-stack
artwork and its in-app attribution are retained.

The committed PNGs are exports of `icon.svg` at 48, 72, 96, 144 and 192 pixels
for legacy launcher densities, and 512 pixels for the web/store artwork. Export
them with an SVG renderer such as CairoSVG. Android adaptive icons use the
original gradient background and the vector foreground, allowing the launcher
to apply its own icon mask.

Artwork modifications dated 2026-11-01: replace the DEV badge with FORK and apply
the fork badge consistently to adaptive, monochrome and legacy icons. See
[`FORK.md`](../FORK.md) for provenance and licensing.
