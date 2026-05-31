# Text Click Test Tools (Step 34)

> **Status: Mock-only — simulation-only.**
>
> Step 34 ships a **Test OCR / Test Text Match** flow inside the
> `text_click` scenario form. It runs the Step-32 mock OCR engine
> against the captured preview using the form's current values
> (target text, language, match mode, case sensitive, optional
> region) and renders a structured debug result, a recognised-blocks
> list, a visual overlay, and a `text_click` action preview. **It
> never recognises real text. It never moves the cursor. It never
> clicks. It never executes the scenario. It never persists the
> screenshot or the debug result on disk.**

## Purpose

Step 33 introduced the `text_click` scenario type. It works, but
authoring a scenario is awkward without a way to verify the inputs
before saving and running:

- did the user actually type the right target text?
- did the user capture a fresh enough preview?
- is the region correct (or the user forgot to attach it)?
- is the chosen language / match mode / case sensitivity sane?

Step 34 closes that gap with **Test OCR** — a one-click debug
flow embedded in the text_click scenario form that:

- shows the current screen-capture preview status (source name,
  size, capturedAt);
- shows the region currently used by the form draft (and the
  region selector slice for reference);
- shows a summary of the OCR settings (target text trimmed,
  language label, match mode label, case-sensitive flag,
  Mock OCR only reminder);
- runs the **Step-32** mock engine over the captured preview
  with the form's target text / language / match mode / case
  sensitivity / region;
- renders a structured **debug result**: matched / matched text /
  confidence / bounding box / target point / duration / errors;
- renders the **recognised-blocks list** with a *matched* badge
  on the highlighted row;
- draws a visual **OCR blocks overlay** on top of the preview
  with a region rectangle, all OCR blocks (mock — yellow-dashed),
  the matched block (solid green with a tiny label), and the
  target point (red dot);
- renders an **action preview** (JSON) of the future `text_click`
  action — explicitly marked `realClick: false` and
  `realOcr: false`, never executed;
- exposes localized error reasons (target text required, capture
  screen preview first, region invalid, mock OCR engine
  unavailable, target text was not found, language invalid, match
  mode invalid).

Test OCR never auto-saves the scenario, never auto-runs it, never
clicks, and never performs real OCR. It only checks if the target
text can be found by the mock engine.

## Current status

| Capability                                                            | Status   |
|-----------------------------------------------------------------------|----------|
| Quick navigation row (Open OCR / Screen Capture / Region Selector)    | Done     |
| Screen preview status card                                            | Done     |
| Region summary card                                                   | Done     |
| OCR settings summary card                                             | Done     |
| Test OCR button (uses form values, never persisted)                   | Done     |
| Clear OCR result button                                               | Done     |
| Structured debug result (matched / confidence / bbox / target / etc)  | Done     |
| OCR blocks list with *matched* badge                                  | Done     |
| Visual debug overlay (region / blocks / matched block / target dot)   | Done     |
| Action preview JSON (`<pre>.textContent`)                             | Done     |
| Localized error reasons (RU / EN)                                     | Done     |
| Audit events `textClick.test.*`                                       | Done     |
| Diagnostics card + `Text click test:` line                            | Done     |
| **Real OCR engine (Tesseract / native)**                              | **Not implemented** |
| **Real text_click execution**                                         | **Not implemented** |
| **Multi-match candidates / top-N**                                    | Not implemented |
| **Live-screen continuous OCR**                                        | Out of scope for `0.1.x` |

## Test OCR flow

1. The user opens the scenario form (Create or Edit) with
   `Scenario type = Text click`.
2. The form's text_click section renders the type select, target
   text input, OCR language / match mode selects, case-sensitive
   checkbox, region buttons, timeout / interval / repeat — and
   now also the new **Text click test tools** panel beneath them.
3. The user types a target text (or jumps to *Open OCR* via the
   quick-navigation button), captures the screen preview (or
   refreshes it via *Open Screen Capture*), and optionally
   attaches a region (via *Use selected region* / the region
   selector accessible through *Open Region Selector*).
4. The user presses **Test OCR**. The renderer calls
   `runTextClickTest(buildTextClickTestInput(formData,
   appState))`:
   - validation (`validateTextClickTestInput`) — gathers errors
     in stable IDs that map to localized strings;
   - mock engine call (`createOcrInput` →
     `runMockOcr` from
     [`ocr-mock-engine.js`](./OCR_FOUNDATION.md));
   - debug result (`createTextClickDebugResult`) — composes a
     plain-data structure with the matched block, the OCR
     blocks list, the action preview, and any errors / warnings.
5. The result panel shows a coloured headline (*Target text
   found* / *Target text was not found* / *Test failed*), the
   metric rows, the OCR blocks list, the visual overlay, and
   the action preview JSON.
6. The user can iterate (change target text / language / match
   mode / case sensitivity / region) and press **Test OCR**
   again. Test OCR never auto-saves. The user must press **Save**
   to persist the scenario.

## Test Text Match flow

The Test Text Match flow is the **same** Test OCR button —
when a match is found, the panel surfaces the matched text plus
the resulting `text_click` action preview. Pressing Test OCR
already covers both "did the OCR run?" and "did it find the
target text?" The Step-32 mock fabricates the target block from
the user's input, so the mock will always find the text when the
preview / region / settings are valid; the *Target text was not
found* path triggers when the engine ran fine but no block
matched (rare with the mock; useful when a future real OCR
backend is wired in).

## Required data

Test OCR requires three pieces of data:

| Required               | Source                                                                |
|------------------------|-----------------------------------------------------------------------|
| Target text            | The form's `Целевой текст` / `Target text` input. Trimmed before validation. |
| Captured screen preview | `appState.screenCapture.preview` from `screen-capture-client.js`. The preview needs `imageDataUrl` + `width`/`height`. |
| Language / match mode  | The form's `OCR language` and `Match mode` selects, plus the `Case sensitive` checkbox. |

Optional: a region in image-space coordinates
(`{ x, y, width, height }`). When present it scopes the search
to that rectangle inside the preview.

## OCR blocks overlay

`renderTextClickOcrOverlay(result)` renders on top of an `<img>`
of the captured preview using percentage-based positioning (so
the rectangles stay correct when the browser scales the
preview):

- **Region** — dashed blue rectangle drawn from `result.region`.
- **OCR blocks** — every fabricated block drawn as a thin
  yellow-dashed rectangle. Non-matched blocks are dimmed if no
  match was found (the user can still see the mock result).
- **Matched block** — solid green rectangle with a tiny text
  label inside.
- **Target point** — red dot centered on `result.targetPoint`
  (with white halo).

The overlay never decodes pixels — it just positions DOM
elements with CSS percentages.

## Action preview

`result.actionPreview` is a plain-data object with
`type: 'text_click'`, `mode: 'preview'`, `realClick: false`,
`realOcr: false`. It is rendered through `<pre>.textContent`
(no HTML interpolation). The click engine, the action pipeline,
the mock adapter, and the dry-run sandbox refuse to consume
preview-mode actions.

A user can copy-paste the JSON for documentation purposes; the
ClickFlow runtime never executes it.

## What is not executed

Test OCR does **not**:

- call `click-engine.runScenario` or
  `click-engine.runTextClickScenario`;
- call `action-pipeline.executeAction({ executionMode: 'real' })`
  — even the simulation path is **not** invoked, only the
  action preview is built;
- call any IPC channel that performs system actions;
- move the cursor;
- press a key;
- save / overwrite the draft scenario;
- persist the screenshot, the OCR blocks, or the debug result on
  disk;
- decode the live screen — only the in-memory preview the user
  explicitly captured in Step 25 is read;
- invoke any real OCR engine — Test OCR delegates to the Step-32
  mock engine, which fabricates blocks from preview metadata.

## Troubleshooting

| Symptom                                                       | Likely cause / next step                                                                            |
|---------------------------------------------------------------|-----------------------------------------------------------------------------------------------------|
| `Target text is required.`                                    | Type a non-empty target text. Whitespace-only is rejected.                                          |
| `Capture a screen preview first.`                             | Press *Open Screen Capture* and capture a preview before running Test OCR.                          |
| `Region is invalid.`                                          | The region escapes the preview bounds. Re-draw it via the region selector or click *Clear region*. |
| `Mock OCR engine is unavailable.`                             | `ocr-mock-engine.js` did not load. Hard reload the renderer.                                        |
| `Unsupported OCR language.` / `Unsupported match mode.`       | Pick a value from the form's drop-downs. Manual JSON tampering is rejected.                         |
| `Target text was not found.`                                  | The Step-32 mock didn't fabricate a matching block. Adjust language / match mode / case sensitivity, or refresh the preview. |
| Headline is yellow but no errors                              | The mock ran fine; the target text wasn't matched against any block. The blocks list and the overlay still render so the user can debug. |

## Safety notes

- **Test OCR does not click. Test OCR does not use real OCR.**
  No real cursor movement. No real click. No real text
  recognition. The action preview is rendered through
  `<pre>.textContent` and is rejected by the click engine, the
  action pipeline, the mock adapter, and the dry-run sandbox.
- Test OCR runs entirely in the renderer. It never opens a new
  IPC channel, never imports `electron` / `ipcRenderer` / `fs`
  / `localStorage`.
- The text-click-test-tools module persists no data on disk.
  The module-local `_lastTextClickTestResult` lives in renderer
  memory only and is cleared on `clearTextClickTestResult()`
  and on every scenario form open / close.
- Audit events (`textClick.test.started`,
  `textClick.test.completed`, `textClick.test.failed`,
  `textClick.test.noMatch`, `textClick.test.cleared`,
  `textClick.test.actionPreview.created`) carry **only** ids,
  numbers, and short metadata — **never** the full target
  text (only `targetTextLen`), **never** an `imageDataUrl`,
  **never** a thumbnail.
- The diagnostics card (Advanced → Safety → *Text click test
  diagnostics*) and the new `Text click test:` line in
  `Copy diagnostics` carry only:
  `lastTextClickTestAt`, `lastTextClickTestMatched`,
  `lastTextClickTestConfidence`, `lastTextClickTestDurationMs`,
  `lastTextClickTestTargetTextLen`, `lastTextClickTestErrorsCount`,
  `lastTextClickTestLanguage`, `lastTextClickTestMatchMode`,
  `lastTextClickTestRegionUsed`, `lastTextClickTestBlocksCount`,
  `ocrMockOnly`, `realOcrEnabled`, `realTextClickEnabled`,
  `testDoesNotClick`, `realClick`, `realOcr`.
- `simulationOnly: true`, `realActionsImplemented: false`,
  `realClick: false`, `ocrEngineImplemented: false`,
  `tesseractAvailable: false`, `ocrMockOnly: true`,
  `realOcrEnabled: false`, `realTextClickEnabled: false`. The
  Test OCR button cannot bypass any of these — they are static
  module constants kept frozen across Steps 16–34.
- `nodeIntegration: false`, `contextIsolation: true`. CSP
  unchanged.
- Test OCR does not add `tesseract`, `tesseract.js`,
  `opencv4nodejs`, `@u4/opencv4nodejs`, `opencv.js`, `opencv-js`,
  `sharp`, `jimp`, `pixelmatch`, `looks-same`, `robotjs`,
  `nut.js`, `iohook`, or `uiohook-napi`.

See also:

- [`docs/TEXT_CLICK_SCENARIO.md`](./TEXT_CLICK_SCENARIO.md)
- [`docs/OCR_FOUNDATION.md`](./OCR_FOUNDATION.md)
- [`docs/IMAGE_CLICK_TEST_TOOLS.md`](./IMAGE_CLICK_TEST_TOOLS.md)
- [`docs/SCREEN_CAPTURE.md`](./SCREEN_CAPTURE.md)
- [`docs/REGION_SELECTOR.md`](./REGION_SELECTOR.md)
- [`docs/SECURITY_CHECKLIST.md`](./SECURITY_CHECKLIST.md)
- [`docs/SMOKE_TESTS.md`](./SMOKE_TESTS.md)



## Provider architecture note (Step 38)

Test OCR uses the active OCR provider, which is `mock` at
Step 38. The mock engine continues to back the panel through
the existing `runMockOcr` call. The provider registry is
described in
[`OCR_PROVIDER_INTERFACE.md`](./OCR_PROVIDER_INTERFACE.md);
the integration plan for the future Tesseract provider lives
in [`REAL_OCR_INTEGRATION_PLAN.md`](./REAL_OCR_INTEGRATION_PLAN.md).

The Test OCR panel does not switch providers and does not
expose any real-OCR toggle. The diagnostics card and the
`Copy diagnostics` text both surface
`realOcr=false`, `realClick=false`, `tesseractAvailable=false`.
The panel still never clicks, never persists screenshots, and
never runs real OCR.



## Test with selected provider (Steps 40-41)

Test OCR now reads the form's `OCR provider` select and
dispatches accordingly:

- **Mock provider** — Step-32 deterministic engine
  (`runMockOcr`). Behaviour unchanged.
- **Tesseract provider** — async path through
  `recognizeTextWithTesseract`. The Test OCR helper
  re-checks the runtime overlay first; without the
  session opt-in it returns the stable error
  `tesseractDisabledByFeatureFlag` and the panel surfaces a
  warning.

The debug result and the action preview both stamp
`ocrProvider` and `realOcr` so the panel can show
"OCR provider used: mock | tesseract". The action preview
keeps `realClick: false` regardless of source. Test OCR
never executes the action — it is a preview only.

For the runtime user manual see
[`REAL_OCR_USAGE.md`](./REAL_OCR_USAGE.md).
