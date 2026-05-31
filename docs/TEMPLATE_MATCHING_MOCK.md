# Template Matching Mock / Dry-run (Step 28)

> **Status: Mock / dry-run only — simulation-only, preview-only.**
>
> Step 28 wires together the three Step 25–27 foundations
> (screen-capture preview, region selector, template assets) into
> a **mock matching pipeline**. The pipeline never decodes a single
> pixel, never runs OpenCV / Tesseract / OCR / image recognition,
> and never executes a real click. All it produces is a
> deterministic mock match record + a planned `image_click` action
> preview, both rendered in the new Advanced → **Template Matching**
> tab. The whole MVP remains [`simulation-only`](./KNOWN_LIMITATIONS.md).

## Purpose

Before a real matcher ever ships, every other layer of the
"smart-visual" pipeline needs to be exercised with realistic
inputs and outputs:

- the renderer needs to know how to **draw a bounding box and a
  target point** on top of the screen-capture preview;
- the diagnostics card and `Copy diagnostics` need to know how to
  **report a match without leaking pixel data**;
- the audit timeline needs to know how to **record a match request
  and an `image_click` action preview** without smuggling an
  `imageDataUrl`;
- the future `image_click` scenario type needs a **stable shape**
  that the click engine can later validate against;
- the safety story needs a public, smoke-checked promise that the
  matcher remains **mock-only** until the
  [real-actions go/no-go review](./REAL_ACTIONS_GO_NO_GO.md) is met.

Step 28 delivers all five at once. None of them require a real
matcher.

## Current status

| Capability                                              | Status    |
|---------------------------------------------------------|-----------|
| Build a sanitised match input from renderer state       | ✅ Done   |
| Validate the input (preview + template + region)        | ✅ Done   |
| Produce a deterministic mock match record               | ✅ Done   |
| Build a planned `image_click` action preview            | ✅ Done   |
| Render a visual overlay (bbox + target + region)        | ✅ Done   |
| Persist the result in the renderer slice                | ✅ Done (renderer memory only) |
| Audit `template.match.mock.*` events                    | ✅ Done   |
| Diagnostics card and `Template matching mock: …` line   | ✅ Done   |
| **Real image matching**                                 | ❌ Not implemented (planned, gated) |
| **OCR**                                                 | ❌ Not implemented (planned, gated) |
| **`image_click` scenario action type**                  | ❌ Not implemented (preview only) |
| **Click on the matched location**                       | ❌ Not implemented (planned, gated) |
| **Auto-rerun matching against a live screen**           | ❌ Out of scope for `0.1.x` |

## Why mock first

ClickFlow's safety contract is "no real input, no real matching,
no real click without an explicit go/no-go review". Shipping a
real matcher first would have to fight that contract on day one.
Shipping a mock first lets us:

1. **Lock the data shapes.** The mock returns the same
   `boundingBox / targetPoint / confidence / usedRegion` shape a
   real matcher will. The UI, diagnostics, and audit code learn
   the shape now; switching to the real backend later is a
   per-call change inside `runMockTemplateMatch`'s callsite.
2. **Lock the safety invariants.** Every audit event, every
   diagnostics line, and every visible UI string is already
   stamped `realMatching=false / realClick=false /
   matcherImplemented=false`. Flipping any of them later is a
   conscious, reviewable change — not an oversight.
3. **Avoid native dependencies in `0.1.x`.** No `tesseract`,
   no `opencv4nodejs`, no `sharp`, no `jimp`, no `pixelmatch`,
   no `looks-same`. The smoke check enforces it.

## Input data

The matcher consumes a plain-data input built by
`createTemplateMatchInput(screenPreview, template, region)`:

```js
{
  screenPreview: {
    sourceId:   "screen:1:0",
    name:       "Screen 1",
    type:       "screen",   // or "window"
    width:      1280,
    height:     720,
    capturedAt: "2026-05-31T10:00:00.000Z"
  },
  template: {
    id:     "template-1717000000000-abcd1234efef5678",
    name:   "Submit button",
    width:  128,
    height: 64
  },
  region: {                 // OR null
    x:      100,
    y:      200,
    width:  400,
    height: 200
  }
}
```

`validateTemplateMatchInput` enforces:

- `screenPreview.width / height > 0`;
- `template.id` is a non-empty string and `template.width / height > 0`;
- `region`, if present, is `validateRegion`-clean (Step 26's
  contract: `width > 5`, `height > 5`, non-negative origin) and
  fits inside the preview.

The renderer **never** passes pixel data to this function.
`imageDataUrl` and `previewDataUrl` are explicitly stripped at
construction time.

## Mock result format

```js
{
  id:           "mock-match-<unix-ms>-<base36>",
  mode:         "mock",
  matched:      true,
  confidence:   0.87,                          // deterministic in [0, 1]
  boundingBox:  { x, y, width, height },       // inside the preview
  targetPoint:  { x, y },                      // center of bbox
  usedRegion:   null | { x, y, width, height },
  templateId:   "template-...",
  templateName: "Submit button",
  sourceId:     "screen:1:0",
  sourceName:   "Screen 1",
  previewSize:  { width, height },
  createdAt:    "2026-05-31T10:00:01.000Z",
  realMatching: false,
  realClick:    false
}
```

The geometry rules:

- if a `region` is supplied, the bounding box is **inside** the
  region (centered, capped to half the region's size on each axis
  so it always fits visibly);
- if no region is supplied, the bounding box is centered on the
  whole preview;
- the target point is always the center of the bounding box;
- the confidence value is one of `[0.87, 0.82, 0.91, 0.78, 0.85,
  0.89]`, picked by hashing the input metadata so the same input
  yields the same number on every run.

The values are deliberately **just below 1.0** so the UI never
visually confuses a mock match with a "perfect" real match.

## Action preview format

`createImageClickActionPreview(match)` returns the planned
`image_click` action shape — **without** ever submitting it to
the click engine:

```js
{
  type:         "image_click",
  mode:         "preview",
  templateId:   "template-...",
  templateName: "Submit button",
  targetPoint:  { x, y },
  boundingBox:  { x, y, width, height },
  confidence:   0.87,
  usedRegion:   null | { x, y, width, height },
  realClick:    false,
  realMatching: false,
  note:         "Preview only. Not executed by the click engine."
}
```

The renderer renders this preview as JSON via `<pre>.textContent`.
No HTML interpolation happens, ever. The shape lines up with the
planned `image_click` entry in
[`docs/ACTION_SCHEMA.md`](./ACTION_SCHEMA.md) — when the real
matcher ships, the click engine will be the one to validate it.

## What is *not* implemented

- Real image matching (OpenCV, opencv.js, naive pixel matching,
  fuzzy matching, perceptual hashing).
- OCR (Tesseract, tesseract.js, custom).
- Real cursor movement or real click on the target point.
- A scenario action of type `image_click` accepted by the click
  engine, the action pipeline, the mock adapter, or the dry-run
  sandbox. Step 28 stops at the **preview** of that future shape.
- Auto-rerun matching against the live screen (continuous match).
- Multi-match (top-N candidates).
- Per-channel preprocessing (grayscale conversion, edge detection,
  thresholding).
- Confidence calibration against a real matcher.
- Saving the screenshot or the bounding-box crop to disk.

## Future real template matching

When the [`docs/REAL_ACTIONS_GO_NO_GO.md`](./REAL_ACTIONS_GO_NO_GO.md)
gate is met, only the body of `runMockTemplateMatch` changes:

- the input contract stays;
- the return shape stays — the new matcher just has to honour it;
- the diagnostics line and audit events stay;
- the renderer overlay code is reused 1:1.

The matcher itself will live in the **main process** (so the
renderer never gains access to the OS) and read the screenshot
from `screen-capture:capture-preview`, the optional region from
`appState.regionSelector.normalizedRegion`, and the template
bytes from `userData/templates/images/<fileName>`.

## Safety notes

- **No real image matching.** No template matching, no fuzzy
  matching, no perceptual hashing, no naive pixel comparison.
  The matcher is **still not implemented** in `0.1.x`.
- **No OCR.** No Tesseract, no tesseract.js, no custom OCR. The
  matcher never runs OCR against the screenshot or the template.
- **No real clicks.** ClickFlow does **not** execute a real
  click on the matched location at Step 28. The action preview
  is a text-only display.
- `package.json` declares **zero** of `tesseract`, `tesseract.js`,
  `opencv4nodejs`, `@u4/opencv4nodejs`, `opencv.js`, `sharp`,
  `jimp`, `pixelmatch`, `looks-same`, `robotjs`, `nut-js`,
  `nutjs`, `@nut-tree/nut-js`, `iohook`, `uiohook-napi`,
  `node-key-sender`. The smoke check enforces it.
- `src/template-matching-mock.js` and
  `src/template-matching-ui.js` do not `require('electron')` or
  `ipcRenderer.invoke`.
- The matcher never reads pixels. It consumes only widths,
  heights, ids, and rectangles.
- The result lives in renderer memory only
  (`appState.templateMatching.lastResult`). It is never written
  to `templates.json`, `settings.json`, `scenarios.json`,
  `profiles.json`, or `localStorage`.
- Audit payloads carry numeric metadata + ids only — no
  `imageDataUrl`, no thumbnails, no PII.
- The visual overlay uses `<img>.src` for the preview backdrop
  and absolutely-positioned `<div>`s for the bounding box and
  target point. `innerHTML` is used only as `= ''` (container
  clear).
- `simulationOnly: true`, `realActionsImplemented: false`,
  `realClick: false`, `realMatching: false` invariants hold
  across every status response and audit event.
- No mobile platforms. The Template Matching tab remains a
  desktop-only feature.

## Cross-references

- [`KNOWN_LIMITATIONS.md`](./KNOWN_LIMITATIONS.md) — section
  "Template matching is mock only".
- [`SECURITY_CHECKLIST.md`](./SECURITY_CHECKLIST.md) — section
  "Template matching mock (Step 28)".
- [`SMOKE_TESTS.md`](./SMOKE_TESTS.md) — Step 28 smoke checks.
- [`SCREEN_CAPTURE.md`](./SCREEN_CAPTURE.md) — the upstream
  preview source.
- [`REGION_SELECTOR.md`](./REGION_SELECTOR.md) — the upstream
  region scoping.
- [`TEMPLATE_ASSETS.md`](./TEMPLATE_ASSETS.md) — the upstream
  template storage.
- [`REAL_ACTIONS_GO_NO_GO.md`](./REAL_ACTIONS_GO_NO_GO.md) — the
  contract that gates the matcher and the `image_click` action.
- [`ACTION_SCHEMA.md`](./ACTION_SCHEMA.md) — the planned
  `image_click` schema entry.
