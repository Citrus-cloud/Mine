# Image Click Test Tools (Step 31)

> **Status: Simulation-only.** Test Match is a debug helper inside
> the `image_click` scenario form. It runs the Step-29 template
> matcher against the captured preview and renders a structured
> debug result. It **never moves the cursor**, **never clicks**,
> **never executes the scenario**, **never persists the
> screenshot to disk**. The whole MVP remains
> [`simulation-only`](./KNOWN_LIMITATIONS.md).

## Purpose

Step 30 introduced the `image_click` scenario type. It works, but
authoring a scenario is awkward without a way to verify the inputs
before saving and running:

- did the matcher actually see the right template?
- did the user capture a fresh enough preview?
- is the region correct (or the user forgot to click *Use selected
  region*)?
- is the chosen threshold reasonable?

Step 31 closes that gap with **Test Match** — a one-click debug
flow embedded in the scenario form that:

- shows the active template's preview, name, dimensions, file size;
- shows the current screen-capture preview status (source name,
  size, capturedAt);
- shows the region currently used by the form draft (and the
  region selector slice for reference);
- runs the **Step-29** matching engine against the captured
  preview with the form's threshold / step / region / template;
- renders a structured **debug result**: matched / confidence /
  bounding box / target point / duration / warnings / errors;
- draws a visual **debug overlay** on top of the preview with the
  bounding box, target point, region rectangle and a confidence
  badge;
- renders an **action preview** (JSON) of the future `image_click`
  action — explicitly marked `realClick: false`, never executed;
- exposes localized error reasons (no template selected, template
  image missing, region invalid, template too large for search
  area, match below threshold, matching too long, matching engine
  unavailable).

Test Match never auto-saves the scenario, never auto-runs it, and
never clicks. It only checks if the template can be found.

## Current status

| Capability                                                            | Status   |
|-----------------------------------------------------------------------|----------|
| Template preview card                                                 | Done     |
| Screen preview status card                                            | Done     |
| Region summary (Use selected region / Clear region)                  | Done     |
| Test Match button (form values used, never persisted)                | Done     |
| Structured debug result (matched / confidence / bbox / target / etc) | Done     |
| Visual debug overlay (bbox / target / region / confidence badge)     | Done     |
| Action preview JSON (`<pre>.textContent`)                            | Done     |
| Localized error reasons (RU / EN)                                    | Done     |
| Quick navigation (Open Templates / Screen Capture / Region Selector) | Done     |
| Audit events `imageClick.test.*`                                     | Done     |
| Diagnostics card + `Image click test:` line                          | Done     |
| **Real cursor movement / real click**                                 | **Not implemented** |
| **OCR / text detection**                                              | **Not implemented** |
| **OpenCV / native matcher**                                           | **Not implemented** |
| **Live-screen continuous matching**                                   | **Out of scope for `0.1.x`** |

## Test Match flow

1. The user opens the scenario form (Create or Edit) with
   `Scenario type = Image click`.
2. The form's image_click section renders the type select,
   template select, region buttons, threshold / step / timeout /
   interval / repeat — and now also the new **Image click test
   tools** panel beneath them.
3. The user picks a template (or imports one via the *Open
   Templates* quick navigation button), captures the screen
   preview (or refreshes it via *Open Screen Capture*), and
   optionally attaches a region (via *Use selected region* / the
   region selector accessible through *Open Region Selector*).
4. The user presses **Run Test Match**. The renderer calls
   `runImageClickTest(buildImageClickTestInput(formData,
   appState))`:
   - validation (`validateImageClickTestInput`) — gathers errors
     in stable IDs that map to localized strings;
   - matching (`runTemplateMatch` from
     [`template-matching-engine.js`](./TEMPLATE_MATCHING_ENGINE.md));
   - debug result (`createImageClickDebugResult`) — composes a
     plain-data structure with all the numbers the UI renders.
5. The result panel shows a coloured headline (matched / no match
   / failed), the metric rows, the warnings block (e.g. "Match
   confidence is below threshold"), the visual overlay, and the
   action preview JSON.
6. The user can iterate (change threshold / step / region / pick
   another template) and press **Run Test Match** again. Test
   Match never auto-saves. The user must press **Save** to
   persist the scenario.

The result is also mirrored into the existing
`appState.templateMatching.lastResult` slice (numbers / ids only —
no `imageDataUrl`) so the existing **Template matching** tab and
the Advanced → Safety diagnostics card see the same numbers.

## Required data

Test Match requires three pieces of data:

| Required               | Source                                      |
|------------------------|---------------------------------------------|
| Active template        | `getTemplateById(formData.templateId)` from `template-manager.js`. The template needs a `previewDataUrl` and `width`/`height`. |
| Captured screen preview | `appState.screenCapture.preview` from `screen-capture-client.js`. The preview needs `imageDataUrl` + `width`/`height`. |
| Threshold and step     | The form's `Threshold` input (0..1) and the `Step` select (`1` / `2` / `4` / `8`). |

Optional: a region in image-space coordinates
(`{ x, y, width, height }`). When present it scopes the search to
that rectangle inside the preview.

## Debug result

`createImageClickDebugResult(matchResult, input)` returns a plain
object:

```json
{
  "scenarioDraftName":  "Click Submit by image",
  "templateId":         "template-1717000000000-abcd1234efef5678",
  "templateName":       "Submit button icon",
  "screenSourceName":   "Display 1",
  "screenSourceId":     "screen:0",
  "previewSize":        { "width": 1280, "height": 800 },
  "region":             { "x": 100, "y": 60, "width": 600, "height": 400 },
  "threshold":          0.75,
  "step":               4,
  "matched":            true,
  "confidence":         0.84,
  "boundingBox":        { "x": 320, "y": 188, "width": 96, "height": 32 },
  "targetPoint":        { "x": 368, "y": 204 },
  "durationMs":         142,
  "actionPreview":      {
    "type":         "image_click",
    "mode":         "preview",
    "templateId":   "template-1717000000000-abcd1234efef5678",
    "templateName": "Submit button icon",
    "targetPoint":  { "x": 368, "y": 204 },
    "boundingBox":  { "x": 320, "y": 188, "width": 96, "height": 32 },
    "confidence":   0.84,
    "usedRegion":   { "x": 100, "y": 60, "width": 600, "height": 400 },
    "realClick":    false,
    "realMatching": false,
    "note":         "Preview only. Test Match does not click."
  },
  "errors":             [],
  "warnings":           [],
  "createdAt":          "2026-05-31T12:34:56.789Z",
  "realClick":          false,
  "realMatching":       false,
  "engineMode":         "real-preview",
  "pixelStep":          2,
  "scannedPositions":   3072,
  "downscaledSearch":   false,
  "downscaledTemplate": false
}
```

`errors` and `warnings` are **stable IDs** that map to localized
strings via `i18n.js`. The UI renders them through `textContent`
(never `innerHTML`).

Stable error IDs:

| ID                           | Meaning                                            |
|------------------------------|----------------------------------------------------|
| `noTemplateSelected`         | The form has no active template id.                |
| `templateImageMissing`       | The template lacks `previewDataUrl` or dimensions. |
| `captureScreenPreviewFirst`  | No captured preview is available (or it can't decode). |
| `invalidRegion`              | The region is outside the preview or has zero size. |
| `templateLargerThanSearchArea` | The template doesn't fit in the search rectangle. |
| `matchingTookTooLong`        | The engine exceeded the 8-second soft cap.         |
| `matchingEngineUnavailable`  | `runTemplateMatch` is not loaded.                  |
| `thresholdInvalid`           | Threshold is not a finite number in `[0, 1]`.      |
| `stepInvalid`                | Step is not a finite integer in `[1, 32]`.         |

Stable warning IDs:

| ID                       | Meaning                                                       |
|--------------------------|---------------------------------------------------------------|
| `matchBelowThreshold`    | Engine returned a candidate but its score is below threshold. |
| `searchAreaCostHigh`     | The estimated cost is high; matching may be slow.             |
| `stepRaisedByEngine`     | The engine raised the effective step to keep matching fast.   |
| `templateDownscaled`     | The template was downscaled internally for matching.          |
| `searchAreaDownscaled`   | The search area was downscaled internally for matching.       |

## Debug overlay

The overlay renders on top of an `<img>` of the captured preview
using percentage-based positioning (so the rectangle stays
correct when the browser scales the preview):

- **Region** — dashed blue rectangle drawn from
  `result.region`.
- **Bounding box** — solid green rectangle drawn from
  `result.boundingBox`. If `matched === false` the rectangle
  switches to a dashed orange "candidate" style.
- **Confidence badge** — small label inside the bounding box
  with the percentage and `matched`/`low` mode hint.
- **Target point** — red dot centered on `result.targetPoint`
  (with white halo).

The overlay never decodes pixels — it just positions DOM elements
with CSS percentages.

## Action preview

`result.actionPreview` is a plain-data object with
`type: 'image_click'`, `mode: 'preview'`, `realClick: false`,
`realMatching: false`. It is rendered through
`<pre>.textContent` (no HTML interpolation). The click engine,
the action pipeline, the mock adapter, and the dry-run sandbox
do not consume preview-mode actions.

A user can copy-paste the JSON for documentation purposes; the
ClickFlow runtime never executes it.

## What is not executed

Test Match does **not**:

- call `click-engine.runScenario` or
  `click-engine.runImageClickScenario`;
- call `action-pipeline.executeAction({ executionMode: 'real' })`
  — even the simulation path is **not** invoked, only the action
  preview is built;
- call any IPC channel that performs system actions;
- move the cursor;
- press a key;
- save / overwrite the draft scenario;
- persist the screenshot, the template image, the bounding box,
  or the debug result on disk;
- decode the live screen — only the in-memory preview the user
  explicitly captured in Step 25 is read.

## Troubleshooting

| Symptom                                                       | Likely cause / next step                                                                          |
|---------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| `No template selected`                                        | Pick a template in the Templates tab (use the *Open Templates* quick nav button).                |
| `Template image is missing`                                   | The active template's `previewDataUrl` is empty. Re-import the image.                            |
| `Capture a screen preview first`                              | Press *Open Screen Capture* and capture a preview before running Test Match.                     |
| `Region is invalid`                                           | The region escapes the preview bounds. Re-draw it via the region selector or click *Clear region*. |
| `Template is larger than the search area`                     | Either the template is bigger than the preview, or the region is too small. Pick a tighter template or a wider region. |
| `Match confidence is below threshold`                         | Lower the threshold, refresh the preview, or refine the template image. The bbox shows the best candidate. |
| `Matching took too long`                                      | The search area is huge. Pick a region or raise the step.                                        |
| `Matching engine unavailable`                                 | `template-matching-engine.js` did not load. Hard reload the renderer.                            |
| Bounding box but `matched: false`                             | Confidence is below threshold. The dashed orange rectangle is the candidate, not a match.        |

## Safety notes

- Test Match runs entirely in the renderer. It never opens a new
  IPC channel, never calls `electron`, `ipcRenderer`, `fs`, or
  `localStorage`.
- The image-click-test-tools module persists no data on disk. The
  module-local `_lastTestResult` lives in renderer memory only and
  is cleared on `clearImageClickTestResult()` and on every
  scenario form open / close.
- Audit events (`imageClick.test.started`,
  `imageClick.test.completed`, `imageClick.test.failed`,
  `imageClick.test.lowConfidence`, `imageClick.test.cleared`)
  carry **only** ids and numbers — never an `imageDataUrl`,
  never a thumbnail.
- The diagnostics card (Advanced → Safety → *Image click test
  diagnostics*) and the new `Image click test:` line in
  `Copy diagnostics` carry only:
  `lastImageClickTestAt`, `lastImageClickTestMatched`,
  `lastImageClickTestConfidence`, `lastImageClickTestDurationMs`,
  `lastImageClickTestTemplateId`, `lastImageClickTestErrorsCount`.
- `simulationOnly: true`, `realActionsImplemented: false`,
  `realClick: false`, `ocrImplemented: false`,
  `imageClickTestRealExecution: false`. The Test Match button
  cannot bypass any of these — they are static module
  constants (Step 16, kept frozen across Steps 17–31).
- `nodeIntegration: false`, `contextIsolation: true`. CSP
  unchanged.
- Test Match does not add `tesseract`, `tesseract.js`,
  `opencv4nodejs`, `@u4/opencv4nodejs`, `opencv.js`, `opencv-js`,
  `sharp`, `jimp`, `pixelmatch`, `looks-same`, `robotjs`,
  `nut.js`, `iohook`, or `uiohook-napi`.

See also:

- [`docs/IMAGE_CLICK_SCENARIO.md`](./IMAGE_CLICK_SCENARIO.md)
- [`docs/TEMPLATE_MATCHING_ENGINE.md`](./TEMPLATE_MATCHING_ENGINE.md)
- [`docs/SCREEN_CAPTURE.md`](./SCREEN_CAPTURE.md)
- [`docs/REGION_SELECTOR.md`](./REGION_SELECTOR.md)
- [`docs/TEMPLATE_ASSETS.md`](./TEMPLATE_ASSETS.md)
- [`docs/SECURITY_CHECKLIST.md`](./SECURITY_CHECKLIST.md)
- [`docs/SMOKE_TESTS.md`](./SMOKE_TESTS.md)
