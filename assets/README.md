# ClickFlow — assets/

This directory holds static art and packaging resources used by the
ClickFlow desktop application.

## Layout

```
assets/
  README.md          (this file)
  icons/
    README.md        (notes on icon formats)
    clickflow-icon.svg (minimal app mark, simulation-only)
```

## Rules

- All assets must be **local** to this repository — no remote URLs,
  no `<script>` tags, no `<foreignObject>` HTML payloads in SVGs.
- SVGs must not include external references (`href`, `xlink:href` to
  remote URLs), embedded fonts, or scripts.
- Images and icons should reflect that ClickFlow is a **simulation-only**
  MVP. Avoid imagery that suggests real input automation, captcha bypass,
  ad clicking, or any restricted workflow.
- Keep file size small. Prefer SVG over raster.

## Used by

- `package.json` → `build.directories.buildResources` points to this
  directory for `electron-builder` (used by `npm run pack` / `npm run dist`).
- The renderer process **does not** load remote images. Everything
  visible inside the app is shipped from this folder or `src/`.

## Adding a new icon

1. Drop the file into `assets/icons/`.
2. Update `assets/icons/README.md` with the dimensions and intended use.
3. If the icon will be used as the application icon for `electron-builder`,
   provide platform-specific raster formats (`.ico`, `.icns`, `.png`)
   in addition to the SVG source — see the packaging docs in
   `docs/PACKAGING.md`.
