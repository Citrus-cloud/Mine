# Real Template Matching Engine Foundation (Step 29)

> **Status: Real preview-only — simulation-only, preview-only.**
>
> Step 29 ships the first **real** template-matching engine in
> ClickFlow. The engine analyses the **screen-capture preview**
> the user explicitly captured in Step 25, looks for the active
> Step-27 template inside it, and returns a bounding box plus a
> confidence score. Despite the name, the engine **does not click
> the screen, does not move the cursor, and does not analyse the
> live screen**. The whole MVP remains
> [`simulation-only`](./KNOWN_LIMITATIONS.md). The mock matcher
> from Step 28 is **kept** as a separate mode so users can still
> exercise the data shapes without spending CPU.

## Purpose

The smart-visual roadmap (find image / find icon / find text /
template matching / OCR / visual scenario builder) eventually
needs a real matching backend. Step 29 unblocks that line **on
the renderer side**, with a small, dependency-free algorithm:

- the user already has the screen preview (Step 25), the active
  template (Step 27), and an optional region (Step 26);
- the engine wires those three together and returns a bounding
  box, a target point, a confidence score and a duration;
- the renderer reuses the Step-28 visual overlay and the planned
  `image_click` action preview;
- ClickFlow still does **not** click anywhere — the action
  preview is text only.

## Current status

| Capability                                              | Status    |
|---------------------------------------------------------|-----------|
| Plain-JS template matching over `ImageData`             | ✅ Done   |
| Mode picker (Mock / Real preview) in the UI             | ✅ Done   |
| Threshold + step controls in the UI                     | ✅ Done   |
| Region scoping (Step 26)                                | ✅ Done   |
| Search-area downscaling for big previews                | ✅ Done   |
| Template downscaling for big templates                  | ✅ Done   |
| Cost guard with engine-raised step + warnings           | ✅ Done   |
| Result card / overlay / `image_click` action preview    | ✅ Done   |
| Audit `template.match.realPreview.*` events             | ✅ Done   |
| Diagnostics card and `Template matching: …` line        | ✅ Done   |
| **Real cursor movement**                                | ❌ Not implemented (gated) |
| **Real click on the matched location**                  | ❌ Not implemented (gated) |
| **OCR / text detection**                                | ❌ Not implemented (planned) |
| **OpenCV / opencv.js / opencv-js**                      | ❌ Out of scope for this step |
| **`image_click` scenario action type executed**         | ❌ Out of scope for this step |
| **Live-screen continuous matching**                     | ❌ Out of scope for `0.1.x` |

## Real preview matching vs real clicks

The name "real preview matching" intentionally splits two things
that other automation tools usually couple:

1. **Real matching.** ClickFlow really computes a similarity
   score. It is not a deterministic mock.
2. **Real clicks.** ClickFlow does **not** move the cursor. The
   `image_click` action is rendered as JSON-like text via
   `<pre>.textContent` and never reaches the click engine, the
   action pipeline, the mock adapter, or the dry-run sandbox.

In other words: the result is real, the side effects are not.

## Algorithm

The engine is plain JavaScript over `ImageData.data`. No native
modules, no OpenCV, no opencv.js. The flow:

1. **Decode** the preview `imageDataUrl` and the active template
   `previewDataUrl` into an `HTMLImageElement`, render each into
   an off-DOM `<canvas>`, and read back an `ImageData`.
2. **Crop** the search area to the optional Step-26 region.
3. **Downscale** the search area if it exceeds
   `maxSearchWidth × maxSearchHeight` (default 1200×800). The
   bounding box is mapped back to the original preview
   coordinates before it returns to the UI.
4. **Match the template's downscale** to the search area's
   downscale, then apply a hard cap at 320×320 so the inner
   loop stays small. If the cap triggers, the result carries a
   `template-downscaled` warning.
5. **Estimate the cost** as `positions × template_pixels`. If
   the estimate exceeds the soft threshold (4 M comparisons),
   the result carries a `search-area-cost-high` warning. If it
   exceeds the hard cap (16 M comparisons), the engine raises
   the step until it fits and emits a `step-raised-by-engine`
   warning.
6. **Walk the search grid** with the (possibly raised) step. For
   each candidate position, compute the score as the mean RGB
   absolute difference between the patch and the template:
   `score = 1 - (mean_diff / 255)`. Alpha is ignored (the
   canvas premultiplies it for us). The template itself is
   sampled with a per-pixel sub-step (1 / 2 / 3 / 4 depending on
   template area) so the inner loop stays bounded.
7. **Return** the best position with its score, plus the input
   shape, the search/template downscale flags, the actual step
   used, and the duration.

The score is in `[0, 1]`. A perfect pixel-for-pixel match scores
`1.0`. Real screenshots scaled / antialiased by the OS typically
land in `0.85–0.97` on a true match, depending on font hinting
and rendering quirks. The default `threshold` is **0.75**.

If `score >= threshold`, the result is rendered as a green solid
bounding box and emits `template.match.realPreview.completed`.
If `score < threshold`, the result is rendered as a dashed
"best candidate" rectangle and emits `template.match.lowConfidence`.

## Threshold

Renderer-side, in `[0, 1]`. Stored as
`appState.templateMatching.threshold` (default `0.75`). Updated
through `setTemplateMatchingThreshold(value)`; the setter
silently rounds and clamps invalid values. The threshold is
forwarded to the engine on every run and copied into the
result so the UI / diagnostics can show the comparison.

Choosing the threshold is a usability question, not a security
one — the safety contract is unchanged at any threshold.

## Step

Renderer-side integer in `[1, 32]`. Stored as
`appState.templateMatching.step` (default `4`). Updated through
`setTemplateMatchingStep(value)`. The UI exposes `1 / 2 / 4 / 8 /
16` in a `<select>`. The engine may **raise** (never lower) the
effective step internally if the cost estimate exceeds the hard
cap; the result then carries `step` (effective) and
`requestedStep` (what the user picked), and the audit timeline
gets a `template.match.engine.warning` event with reason
`step-raised-by-engine`.

## Region support

If `appState.regionSelector.normalizedRegion` is set (Step 26),
the engine crops the preview to that rectangle **before** any
downscale. The rectangle is in image-space (original preview
pixels), so the user sees the same region they drew on the
preview. The bounding box comes back in the same image-space and
the renderer projects it to percentages on the overlay.

Without a region, the engine searches the whole preview. The
result's `usedRegion` is `null` in that case.

## Performance limitations

- The engine is single-threaded JavaScript. It can chew through
  about 8–16 million pixel comparisons per second on a typical
  laptop. The cost guard keeps each run under one second by
  raising the step.
- Big templates are downscaled to ≤ 320×320 (proportional). The
  effective resolution of the search drops accordingly. Users
  who want sub-pixel accuracy will need a real matcher.
- The algorithm is **not rotation-invariant**, **not scale-
  invariant** (beyond the engine's own downscale), and **not
  illumination-invariant**. It compares pixels at the requested
  position only.
- The engine runs synchronously inside one tick. The renderer
  becomes briefly unresponsive on very large previews. The cost
  guard is the bound on that delay.

## What is *not* implemented

- Real cursor movement / real click. The `image_click` action
  preview is JSON text, never executed.
- OCR / text detection. No Tesseract, no tesseract.js, no
  custom OCR. **No OCR runs at Step 29.**
  `ocrImplemented = false`.
- OpenCV / opencv.js / opencv-js / sharp / jimp / pixelmatch /
  looks-same. `opencvAvailable = false`,
  `nativeMatchingAvailable = false`. The smoke check enforces
  it.
- Multi-match / top-N candidates.
- Rotation, scale, illumination, blur invariants.
- Auto-rerun against the live screen.
- Saving the search area, the template, or any matched crop to
  disk.

## Future OpenCV option

When the [real-actions go/no-go review](./REAL_ACTIONS_GO_NO_GO.md)
opens the matcher gate, the renderer-side engine will become a
**fallback**:

- a future main-process implementation can use OpenCV /
  opencv.js / a native template matcher;
- the renderer keeps the plain-JS engine for environments
  where the native option is unavailable;
- the `runTemplateMatch(screenDataUrl, templateDataUrl,
  options)` signature stays — only the body changes;
- the result shape stays — the renderer overlay code is
  reused 1:1.

Until that gate opens, the engine is intentionally lightweight
and dependency-free.

## Safety notes

- The engine **never** runs against the live screen. It only
  consumes the `imageDataUrl` of the preview the user
  explicitly captured in Step 25. No real cursor movement, no
  real click, no real keyboard.
- `simulationOnly: true`, `realActionsImplemented: false`,
  `realMatching: false`, `realClick: false`,
  `ocrImplemented: false`, `opencvAvailable: false`,
  `imageClickScenarioImplemented: false` invariants hold across
  every status response, audit event, and diagnostics line.
- `package.json` declares **zero** of `tesseract`,
  `tesseract.js`, `opencv4nodejs`, `@u4/opencv4nodejs`,
  `opencv.js`, `opencv-js`, `sharp`, `jimp`, `pixelmatch`,
  `looks-same`, `robotjs`, `nut-js`, `nutjs`, `@nut-tree/nut-js`,
  `iohook`, `uiohook-napi`, `node-key-sender`. The smoke check
  enforces it.
- The engine never imports `electron` or `ipcRenderer`. It is
  pure renderer code over Canvas / `ImageData`.
- The result lives only in `appState.templateMatching.lastResult`
  (renderer memory). It is never written to `templates.json`,
  `settings.json`, `scenarios.json`, `profiles.json`, or
  `localStorage`.
- The `image_click` action preview is rendered through
  `<pre>.textContent`. No HTML interpolation. The click engine,
  the action pipeline, the mock adapter, and the dry-run
  sandbox do not recognise the `image_click` action type.
- Audit payloads carry only ids and numeric metadata
  (confidence, threshold, target X / Y, bounding-box width /
  height, durationMs, step, scannedPositions). They never
  contain an `imageDataUrl`, a thumbnail, or a screenshot.
- No new IPC channel is registered for matching at Step 29.
  The renderer does not gain any new privilege over the OS.
- Field name reminder: `realMatching` / `nativeMatchingAvailable`
  describe the *engine*. They stay `false` because Step 29 is
  the **renderer-side preview** matcher, not a native or
  live-screen matcher. The whole MVP remains simulation-only.

## Cross-references

- [`KNOWN_LIMITATIONS.md`](./KNOWN_LIMITATIONS.md) — section
  "Real preview matching has plain-JS limits".
- [`SECURITY_CHECKLIST.md`](./SECURITY_CHECKLIST.md) — section
  "Real preview matching engine (Step 29)".
- [`SMOKE_TESTS.md`](./SMOKE_TESTS.md) — Step 29 smoke checks.
- [`SCREEN_CAPTURE.md`](./SCREEN_CAPTURE.md) — the upstream
  preview source.
- [`REGION_SELECTOR.md`](./REGION_SELECTOR.md) — the upstream
  region scoping.
- [`TEMPLATE_ASSETS.md`](./TEMPLATE_ASSETS.md) — the upstream
  template storage.
- [`TEMPLATE_MATCHING_MOCK.md`](./TEMPLATE_MATCHING_MOCK.md) —
  the Step 28 mock pipeline; still available as the `mock`
  mode in the same Template Matching tab.
- [`REAL_ACTIONS_GO_NO_GO.md`](./REAL_ACTIONS_GO_NO_GO.md) — the
  contract that gates the matcher → click handoff.
- [`ACTION_SCHEMA.md`](./ACTION_SCHEMA.md) — the planned
  `image_click` schema entry.



---

## Step 30 — engine is now used by the `image_click` scenario

[Step 30](./IMAGE_CLICK_SCENARIO.md) introduces a new scenario
type called `image_click` that runs this engine on every
iteration. The engine itself is unchanged: it still analyses
only the captured preview, never the live screen, and never
executes a real click. The new scenario type just orchestrates
the engine + the action-pipeline so the user can run a full
"capture → match → simulated click" loop end-to-end.

See [`docs/IMAGE_CLICK_SCENARIO.md`](./IMAGE_CLICK_SCENARIO.md).



---

## Step 31 — engine is also used by Test Match

[Step 31](./IMAGE_CLICK_TEST_TOOLS.md) ships a Test Match panel
inside the `image_click` scenario form. The panel calls
`runTemplateMatch(screenDataUrl, templateDataUrl, options)`
directly with the form's current threshold / step / region —
the same way the Step-30 click engine does — and renders the
result as a debug overlay, an action preview, and a structured
debug result.

The engine itself is unchanged at Step 31:

- still pure renderer code, no IPC, no native deps;
- still analyses **only** the captured preview, never the live
  screen;
- still emits warnings via the `warnings: []` array
  (`search-area-downscaled`, `template-downscaled`,
  `search-area-cost-high`, `step-raised-by-engine`);
- still refuses to fire any real click.

Test Match adds a soft 8-second timeout on top of the engine's
own cost guards so the scenario form never hangs while the
user is editing.

See [`docs/IMAGE_CLICK_TEST_TOOLS.md`](./IMAGE_CLICK_TEST_TOOLS.md).
