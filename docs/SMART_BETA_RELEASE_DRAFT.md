# ClickFlow Smart Desktop Beta — GitHub Release Draft

> **Title:** `ClickFlow Smart Desktop Beta`
> **Suggested tag:** `v0.2.0-smart-beta`
> **`package.json` `version`:** `0.2.0-beta`
> **Pre-release flag:** `yes`

This document holds the body of the GitHub release. Paste it
into the GitHub release editor when cutting the tag.

---

## ClickFlow Smart Desktop Beta

ClickFlow Smart Desktop Beta extends the simulation-only clicker
MVP with a full smart-features chain — live screen capture,
region selection, image templates, preview-only template
matching, an `image_click` scenario type, a mock OCR engine, an
optional Tesseract OCR provider behind a session flag, a
`text_click` scenario type, a Visual Builder, scenario presets,
and a smart-beta diagnostics surface.

ClickFlow remains **simulation-only**. Real cursor work, real
keyboard input, and real OCR-driven clicks are NOT in this
release.

### Highlights

- 📸 **Screen Capture + Region Selector.** Capture a still
  preview through `desktopCapturer`, drag a region rectangle,
  attach the region to a scenario.
- 🖼️ **Templates + Template Matching.** Import small image
  templates, run a deterministic mock matcher and a plain-JS
  preview-only real matcher. No OpenCV.
- 🎯 **`image_click` scenario.** Click a template visually
  through a debug overlay (Test Match) and run simulated
  cycles. Cursor never moves.
- 🔠 **OCR mock + Tesseract session.** Mock OCR (Step 32) is
  always available. The Tesseract OCR provider is wired but
  disabled by default — the user must press **Enable Tesseract
  for this session** before Run Real OCR works. The session
  flag wipes on reload.
- 📝 **`text_click` scenario.** Per-scenario OCR-provider
  selection (`mock | tesseract`). The Tesseract path refuses
  without the session opt-in. Action stays simulation-only.
- 🧰 **Visual Builder.** Smart-features dashboard that
  produces drafts. Drafts NEVER auto-save.
- 🃏 **Scenario presets.** Three frozen presets
  (`coordinate-basic`, `image-click-basic`,
  `text-click-basic`).
- 🩺 **Smart-beta diagnostics.** New `Smart beta:` line in
  Copy diagnostics with every readiness boolean and a
  release-blockers count.

### Safety model

- `simulationOnly: true`, `realDesktopActions: false`,
  `realOcr: false`, `tesseractProvider: false` baked into
  `FEATURE_FLAGS`. None of the umbrella safety flags are in
  the runtime-togglable whitelist.
- The action pipeline rejects every `realClick: true` for
  every scenario type. `realOcr: true` on a `text_click`
  action is a SOURCE marker — it does not move the cursor.
- Real OCR runs only after THREE explicit user actions:
  Enable Tesseract for this session → Use Tesseract OCR →
  Run Real OCR. The session flag wipes on reload.
- `contextIsolation: true`, `nodeIntegration: false`, CSP
  unchanged (`default-src 'self'; script-src 'self';
  style-src 'self';`).
- No new IPC channel introduced beyond the Step 25-34
  smart-features set.
- Audit payloads carry only stable string ids, durations,
  counts, language strings, source flags — never the full
  target text, never an `imageDataUrl`, never PII.

### How to run

1. Download the artifact for your OS:
   - **Windows:** `ClickFlow Setup 0.2.0-beta.exe`
   - **macOS:** `ClickFlow-0.2.0-beta.dmg`
   - **Linux:** `ClickFlow-0.2.0-beta.AppImage`
2. Open the app.
3. (Optional) Enable Tesseract for the session in Advanced →
   OCR.
4. Capture a screen preview. Build a scenario. Press Start.

The cursor never moves. The action pipeline records simulated
events in the audit timeline.

### How to test

1. Run the manual QA checklist in
   [`docs/SMART_BETA_MANUAL_TESTS.md`](https://github.com/Citrus-cloud/Mine/blob/main/docs/SMART_BETA_MANUAL_TESTS.md).
2. Follow the smoke sequence in
   [`docs/SMOKE_TESTS.md`](https://github.com/Citrus-cloud/Mine/blob/main/docs/SMOKE_TESTS.md)
   (steps S1-S18) on each target OS.
3. Inspect Copy diagnostics. Confirm the `Smart beta:` line
   reports `realClicksEnabled=false` and `simulationOnly=true`.

### Known limitations

- **Tesseract language data.** Tesseract.js v5 fetches its
  language packs from its CDN by default; our CSP blocks
  remote fetches. The user falls back to the mock provider
  with the localised `Failed to load OCR language data.`
  message. Bundling local language packs is planned for
  Step 44+.
- **OCR cancellation is best-effort.** Tesseract.js v5 has no
  abort handle for `Tesseract.recognize`. The Cancel button
  marks the in-flight token; worker-based cancellation is
  planned.
- **Region cropping is best-effort.** The provider crops the
  captured preview via a `<canvas>` and falls back to the
  full image when the canvas API rejects.
- **Visual Builder is foundation-level.** One draft per
  scenario; multi-action drafts are planned.

### What is not included

- Real desktop clicks (no `robotjs`, no `nut.js`, no `iohook`,
  no `uiohook-napi`, no `node-key-sender`).
- Real keyboard input.
- OpenCV (no `opencv4nodejs`, no `@u4/opencv4nodejs`, no
  `opencv.js`, no `opencv-js`, no `sharp`, no `jimp`, no
  `pixelmatch`, no `looks-same`).
- Mobile / Android / iOS port.
- Bundled OCR language data (planned for Step 44+).

### Feedback

Open issues at <https://github.com/Citrus-cloud/Mine/issues>
with the `smart-beta` label. Please attach the `Copy
diagnostics` output (text only — it never carries the full
target text or image data).

### Security note

Real OCR runs entirely in the renderer's Tesseract.js worker.
The recognised text never leaves the renderer. The runtime
flag does NOT persist; reloading the app resets the session.
The action pipeline rejects every `realClick: true` outright.
The cursor never moves; the keyboard never receives input.
