# ClickFlow Smart Desktop Beta Release Notes

> **Status: Smart Desktop Beta (`v0.2.0-smart-beta`).**
> ClickFlow stays **simulation-only** at every layer. Real
> cursor work, real keyboard input, and real OCR-driven clicks
> are NOT in this release.

---

## Summary

ClickFlow Smart Desktop Beta extends the simulation-only
clicker MVP with a smart-features chain: live screen-capture
preview, rectangular region selection, image template assets,
preview-only template matching, an `image_click` scenario type,
a mock OCR engine, an optional Tesseract OCR provider behind a
session flag, a `text_click` scenario type, a Visual Builder,
three scenario presets, and a Smart-Beta diagnostics surface.

The beta is intended for testers who want to author smart
scenarios without any real cursor work. Every action a scenario
emits is a simulation. Every audit payload carries
`realClick: false`. The action pipeline rejects every
`realClick: true` outright.

## New smart features

### Screen Capture

- Advanced → **Screen Capture** tab lists desktopCapturer
  sources and lets the user capture a still preview.
- The captured preview lives only in renderer memory; nothing
  is written to disk.
- See [`docs/SCREEN_CAPTURE.md`](./SCREEN_CAPTURE.md).

### Region Selector

- Advanced → **Region Selector** lets the user drag a rectangle
  on the captured preview.
- The region persists in the renderer state and can be attached
  to the active scenario.
- See [`docs/REGION_SELECTOR.md`](./REGION_SELECTOR.md).

### Templates

- Advanced → **Templates** lets the user import small
  PNG / JPG / WebP images (≤ 16 MiB), edit metadata, set an
  active template, delete or reset.
- The metadata file is rewritten through the main process; no
  renderer-side filesystem access.
- See [`docs/TEMPLATE_ASSETS.md`](./TEMPLATE_ASSETS.md).

### Image matching

- Advanced → **Template Matching** ships both a deterministic
  mock matcher and a plain-JS preview-only real matcher.
- Output: bounding box, target point, confidence (`0..1`).
- Cursor never moves. No OpenCV dependency.
- See [`docs/TEMPLATE_MATCHING_ENGINE.md`](./TEMPLATE_MATCHING_ENGINE.md).

### `image_click`

- New scenario type that combines a template, an optional
  region, threshold, step, timeout, interval, and repeat count.
- Test Match panel (Step 31) draws a debug overlay.
- Start runs simulated `image_click` cycles through the action
  pipeline. The cursor never moves.
- See [`docs/IMAGE_CLICK_SCENARIO.md`](./IMAGE_CLICK_SCENARIO.md).

### OCR mock and real OCR session

- Advanced → **OCR** ships the deterministic mock engine
  (Step 32) plus a Tesseract.js provider (Steps 39-41) gated
  by a session-scoped feature-flag overlay.
- Real OCR runs only after THREE explicit user actions: Enable
  Tesseract for this session → Use Tesseract OCR → Run Real
  OCR.
- The runtime overlay wipes on reload. After restarting the
  app the user must enable Tesseract again.
- Real OCR analyses ONLY the captured screen preview. There is
  no live-screen loop.
- See [`docs/REAL_OCR_USAGE.md`](./REAL_OCR_USAGE.md) and
  [`docs/TESSERACT_PROVIDER.md`](./TESSERACT_PROVIDER.md).

### `text_click`

- New scenario type with target text, language (`ru`, `en`,
  `ru+en`), match mode (`contains`, `exact`), case sensitivity,
  optional region, and a per-scenario `ocrProvider` field
  (`mock` or `tesseract`).
- The Tesseract path requires the runtime overlay; without the
  session opt-in the click engine fails with the localised
  message `Tesseract OCR is disabled. Enable it for this
  session or use mock OCR.`
- Action stays simulation-only: `realClick: false` always;
  `realOcr: true` only on the Tesseract path is a SOURCE
  marker.
- See [`docs/TEXT_CLICK_SCENARIO.md`](./TEXT_CLICK_SCENARIO.md).

### Visual Builder

- Advanced → **Visual Builder** gathers the smart-features
  chain into a single dashboard.
- Status row, onboarding hints, action-type selector, preview
  with overlays, six overlay checkboxes + Show all / Hide all
  / Clear overlays, quick-action buttons.
- Drafts only — the user must press Save manually.
- See [`docs/VISUAL_BUILDER.md`](./VISUAL_BUILDER.md).

### Presets

- Three scenario presets ship: `coordinate-basic`,
  `image-click-basic`, `text-click-basic`.
- Each preset opens the existing scenario form pre-filled.
  Presets NEVER auto-save.
- The text_click preset persists `ocrProvider: 'mock'` (Step 42
  bugfix).

## Safety model

- **`simulationOnly: true`** in `FEATURE_FLAGS`. Hard-coded.
  Not in the runtime-togglable whitelist.
- **`realDesktopActions: false`** in `FEATURE_FLAGS`. Hard-
  coded. Not in the runtime-togglable whitelist.
- **`realOcr: false`** and **`tesseractProvider: false`** in
  `FEATURE_FLAGS`. Both are session-scoped runtime-togglable
  via `setRuntimeFeatureFlag`. The user must explicitly opt
  in. The overlay wipes on reload.
- **action-pipeline rejects `realClick: true`** outright for
  every scenario type. `realOcr: true` on a `text_click`
  action is a SOURCE marker only — it does not trigger a
  cursor move.
- **No new IPC channel** beyond the Step 25-34 smart-features
  set.
- **`contextIsolation: true`**, **`nodeIntegration: false`**,
  CSP unchanged (`default-src 'self'; script-src 'self';
  style-src 'self';`).
- **Audit payloads** carry only stable string ids, durations,
  counts, language strings, source flags — never the full
  target text, never an `imageDataUrl`, never PII.

## What is still not included

- **Real cursor / keyboard input.** No `robotjs`, no `nut.js`,
  no `iohook`, no `uiohook-napi`, no `node-key-sender`. The
  action pipeline rejects every `realClick: true` outright.
- **OpenCV.** No `opencv4nodejs`, no `@u4/opencv4nodejs`, no
  `opencv.js`, no `opencv-js`, no `sharp`, no `jimp`, no
  `pixelmatch`, no `looks-same`. Template matching is
  plain-JS preview matching.
- **Mobile.** No Android / iOS port. ClickFlow is an Electron
  desktop app only.
- **Bundled OCR language data.** Tesseract.js v5 fetches
  language packs from its CDN by default; our CSP blocks
  remote fetches. Bundling local `eng.traineddata` /
  `rus.traineddata` is planned for Step 44+.
- **Worker-based OCR cancellation.** The Cancel button is
  best-effort and discards the in-flight result on completion.
  Tesseract.js v5 has no abort handle. Worker-based
  cancellation is planned.
- **Multi-action drafts in the Visual Builder.** The Visual
  Builder is foundation-only; one draft = one scenario.

## Known limitations

See [`docs/KNOWN_LIMITATIONS.md`](./KNOWN_LIMITATIONS.md)
sections 19-21 for the full list.

## How to test

Follow the manual QA checklist in
[`docs/SMART_BETA_MANUAL_TESTS.md`](./SMART_BETA_MANUAL_TESTS.md).
The smoke sequence in
[`docs/SMOKE_TESTS.md`](./SMOKE_TESTS.md) (S1-S18) walks the
end-to-end flow.

## Feedback

Open issues at
<https://github.com/Citrus-cloud/Mine/issues> with the
`smart-beta` label. Please attach the `Copy diagnostics`
output (text only — it never carries the full target text or
image data).
