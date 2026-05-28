# ClickFlow — assets/icons/

Icons used by the ClickFlow desktop app and by `electron-builder`
during packaging.

## Files

| File                 | Size   | Purpose                                  |
|----------------------|--------|------------------------------------------|
| `clickflow-icon.svg` | 256x256 | Minimal app mark (vector, scalable).    |

## Notes

- `clickflow-icon.svg` is **fully local** — no remote references,
  no `<script>` elements, no embedded fonts, no `<foreignObject>`.
- For final platform packaging, generate raster icons from this SVG:
  - Windows: `clickflow-icon.ico` (256x256, 128x128, 64x64, 48x48,
    32x32, 16x16 stacked)
  - macOS: `clickflow-icon.icns`
  - Linux: `clickflow-icon.png` (512x512)
- Keep the visual style minimal: a soft rounded square in the
  ClickFlow accent color with a single click target. The icon must
  not imply real automation, ad clicking, captcha bypass, or any
  restricted workflow — ClickFlow is simulation-only.

## How it is referenced

- `package.json → build.directories.buildResources = "assets"`.
- `electron-builder` automatically picks up an icon if a file named
  `icon.png` / `icon.ico` / `icon.icns` is placed at the root of the
  build resources. If you decide to publish a release, copy/convert
  `clickflow-icon.svg` into the appropriate format and rename it
  to `icon.<ext>` next to this file.
