# Smart-Features Limitations — ClickFlow

> **Step 37 — known limitations of the smart-features layer.**
>
> ClickFlow `0.1.x` ships smart-features as a **simulation-only**
> dashboard. This document collects every intentional limitation
> in one place so testers, contributors, and downstream users
> have an honest picture of what works and what does not.
>
> See also:
> - [`KNOWN_LIMITATIONS.md`](./KNOWN_LIMITATIONS.md) for the
>   project-wide limitations list.
> - [`SMART_FEATURES_QA.md`](./SMART_FEATURES_QA.md) for the
>   smart-features QA checklist.
> - [`NEXT_BRANCH_PLAN.md`](./NEXT_BRANCH_PLAN.md) for the
>   roadmap of what gets unlocked next.

---

## Screen capture

- Screen-capture permissions vary by OS (macOS asks for Screen
  Recording; Wayland on Linux requires PipeWire + xdg-desktop-
  portal; Windows is the most permissive). When permission is
  missing, the source list is empty and the user must grant
  access manually in OS settings.
- The captured preview is a **single image**, never a video stream.
- The preview is held only in renderer memory. It is **never**
  written to disk.
- The thumbnail in the sources grid is intentionally low-resolution.

## Region selector

- The region is a single axis-aligned rectangle. Polygons,
  rotated rectangles, and multi-region selections are not
  supported.
- Region coordinates are stored as four numbers (x / y / width /
  height) in **image-space**. `imageDataUrl` is never stored
  inside a region.
- Old scenarios without `settings.region` keep working. The
  matching engine simply searches the full preview.

## Template assets

- Allowed file types: `png`, `jpg`, `jpeg`, `webp`. Anything else
  is rejected.
- Max template file size: 16 MiB.
- Template image dimensions are read from the file header only;
  pixels are not decoded by the main process.
- The metadata file is `userData/templates.json`. A corrupted
  file is moved aside as `templates.json.broken-<ts>` and the
  renderer falls back to defaults.
- `previewDataUrl` lives only in renderer memory. Templates do
  not store base64 in `templates.json`.
- Template names ≤ 80 chars; descriptions ≤ 300 chars.

## Template matching

- The matcher is a plain-JS preview-only engine. It analyses the
  **captured preview**, never the live screen.
- It does not call OpenCV, sharp, jimp, pixelmatch, looks-same,
  or any native bindings.
- Large previews are downscaled to ≤ `1200×800`; large templates
  to ≤ `320×320`. The bounding box is then re-projected to the
  original preview coordinates.
- The matcher is intentionally simple. Accuracy on heavily
  compressed JPEGs, transparent PNGs, or rotated subjects is
  limited.
- Matching can be slow on very large previews. The engine emits
  a low-confidence event for any score below the user-set
  threshold.

## OCR

- OCR is **mock-only**. The engine fabricates plausible
  recognised blocks (one block carries the user's target text;
  the rest are decoys like `OK` / `Cancel` / `Settings`).
- Tesseract / `tesseract.js` / native OCR are **not connected**
  and **not declared in `package.json`**.
- The mock engine never reads pixels. It only consumes preview
  metadata (sourceId, name, width, height, capturedAt).
- The mock engine never writes results to disk.
- Recognised confidence values are derived from a deterministic
  function of the preview metadata; they are **not** real OCR
  confidences.

## Image-click scenarios

- `image_click` runs the matcher iteratively over the captured
  preview only — never the live screen.
- The action emitted on each iteration is a **simulation** (`type:
  "image_click"`, `realClick: false`). The action pipeline
  rejects any `realClick: true`.
- The cursor never moves. No real click ever fires.
- Test Match (Step 31) never saves the scenario, never runs the
  scenario, never moves the cursor.

## Text-click scenarios

- `text_click` uses the **mock OCR** engine on every iteration.
  No real OCR runs.
- Each iteration emits a `text_click` simulated action through
  the action pipeline. The pipeline rejects any `realClick: true`
  or `realOcr: true`.
- The mock desktop adapter is bypassed for `text_click` (it only
  knows `click`). Dry-run sandbox does not consume `text_click`.
- The cursor never moves. No real click ever fires.
- The full target text never enters the audit log; only its
  length is recorded.
- Test OCR (Step 34) never saves, never runs the scenario,
  never moves the cursor, never performs real OCR.

## Visual Builder

- The Visual Builder is **foundation-only**: it gathers the other
  smart-features into one dashboard, but it does not introduce a
  new execution path.
- Drafts created by the Visual Builder are **drafts**: they are
  never saved automatically. The user must press Save inside the
  scenario form.
- The Visual Builder never clicks, never runs a scenario, never
  performs real OCR, never moves the cursor.
- Overlays (region / template match / template target / OCR
  blocks / OCR target / action target) are visualisation only.
  Toggling an overlay never executes anything.
- Onboarding hints are derived from the renderer state. They
  disappear once the corresponding requirement is met.

## Scenario presets

- Presets are **basic**: three frozen entries (`coordinate-basic`,
  `image-click-basic`, `text-click-basic`).
- Presets do not auto-save and do not auto-run. They open the
  scenario form pre-filled.
- "Use with current visual context" can borrow numbers (region
  rectangle, target X/Y, threshold/step, language, matchMode)
  and short ids/strings (templateId, matchedText). It never
  borrows pixel data.
- A preset's `matchedText` is truncated to 200 characters so a
  huge OCR result does not blow up the form.

## Real clicks / keyboard / mobile

- Real clicks are **not implemented**. ClickFlow does not depend
  on `robotjs`, `nut.js`, `iohook`, `uiohook-napi`,
  `node-key-sender`, or any equivalent native input library.
- Keyboard automation is **not implemented**.
- A mobile (Android / iOS) version is **not implemented**.
- All six safety layers (feature flags, safety gates, action
  pipeline, adapter interface, adapter registry, real-action
  sandbox) refuse `executionMode === "real"` outright.

If any of the limitations above changes, it must be reflected in
this document, in [`KNOWN_LIMITATIONS.md`](./KNOWN_LIMITATIONS.md),
and behind an explicit `docs/REAL_ACTIONS_GO_NO_GO.md` sign-off.
