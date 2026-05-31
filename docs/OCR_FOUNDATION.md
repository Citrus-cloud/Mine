# OCR Foundation (Step 32)

> **Status: Mock only — simulation-only.**
>
> Step 32 ships the first OCR-shaped surface in ClickFlow: the
> Advanced → **OCR** tab, the `ocr-mock-engine.js` module, and a
> `text_click` ACTION PREVIEW. **No real text recognition is
> connected.** There is no Tesseract, no `tesseract.js`, no native
> OCR engine, no live-screen analysis. The mock fabricates
> recognised-text blocks from preview metadata so the data shapes
> can be exercised end-to-end without spending CPU and without
> shipping any non-allowed dependency. The whole MVP remains
> [`simulation-only`](./KNOWN_LIMITATIONS.md).

## Purpose

The smart-visual roadmap (find image / find icon / **find text** /
template matching / OCR / visual scenario builder) eventually
needs a real OCR backend. Step 32 unblocks that line **on the
renderer side**, with three small pieces:

- a deterministic mock engine that fabricates plausible OCR blocks
  from the captured screen-preview metadata and an optional
  region;
- an OCR tab in the Advanced dashboard with target text input,
  language / match-mode controls, region toggle, run / clear
  buttons, the recognised-blocks list, and a visual overlay;
- a `text_click` action PREVIEW the renderer can show — plain
  data, never executed.

ClickFlow still does **not** click anywhere — the action preview
is metadata only.

## Current status

| Capability                                                 | Status   |
|------------------------------------------------------------|----------|
| Mock OCR engine (`ocr-mock-engine.js`)                     | Done     |
| Advanced → OCR tab UI (`ocr-ui.js`)                        | Done     |
| Target text input                                          | Done     |
| Language select (`ru` / `en` / `ru+en`)                    | Done     |
| Match mode select (`contains` / `exact`)                   | Done     |
| Case-sensitive toggle                                      | Done     |
| Use selected region toggle                                 | Done     |
| Run mock OCR button                                        | Done     |
| Clear OCR result button                                    | Done     |
| Open Screen Capture / Open Region Selector buttons         | Done     |
| Recognised-blocks list                                     | Done     |
| Visual overlay (preview + region + blocks + matched + target) | Done  |
| `text_click` action preview (`<pre>.textContent`)          | Done     |
| OCR diagnostics card + `OCR:` line in Copy diagnostics     | Done     |
| Localized strings (RU + EN)                                | Done     |
| Audit events `ocr.mock.*` + `text.click.preview.created`   | Done     |
| **Real OCR engine (Tesseract / native)**                   | Not implemented |
| **Real text_click action execution**                       | Not implemented |
| **Live-screen continuous OCR**                             | Out of scope for `0.1.x` |
| **Image preprocessing pipeline**                           | Out of scope for `0.1.x` |
| **Multi-language model swap at runtime**                   | Out of scope for `0.1.x` |

## Mock OCR flow

1. The user opens **Advanced → OCR**.
2. The tab renders:
   - a yellow **MOCK** notice at the top: "This is mock OCR. Real
     text recognition is not connected yet.";
   - **Screen preview status** — source name, image size,
     captured-at timestamp, "Preview only = enabled";
   - **OCR settings** — target text input, language select
     (`ru` / `en` / `ru+en`), match mode select (`contains` /
     `exact`), `Case sensitive` checkbox, `Use selected region`
     checkbox;
   - **Region summary** — the region from the region-selector
     slice (in image-space coordinates) when "Use selected
     region" is on, otherwise an "off" hint;
   - **Buttons** — Run mock OCR, Clear OCR result, Open Screen
     Capture, Open Region Selector.
3. The user types a target text (e.g. `Continue`) and presses
   **Run mock OCR**.
4. The renderer calls `runMockOcr(buildOcrInputFromState())`.
5. The engine validates inputs (`validateOcrInput`), fabricates
   blocks (`createMockOcrBlocks`), picks the best match
   (`findTextInOcrBlocks`), builds the result
   (`createOcrResult`), and emits a `text_click` action preview
   via `createTextClickActionPreview`.
6. The UI renders the result card (matched / failed / no-match
   headline + metric rows), the recognised-blocks list, the
   visual overlay (preview `<img>` + dashed blue region +
   yellow-dashed candidate blocks + green solid matched block +
   red target dot), and the action preview JSON
   (`<pre>.textContent`).
7. The user can re-run with different settings, clear the result,
   or jump to **Screen Capture** / **Region Selector** via the
   navigation buttons.

The result is also mirrored into `appState.ocr.lastResult`
(numbers / ids / short text only — no `imageDataUrl`) so the
diagnostics card and the `OCR:` line in `Copy diagnostics`
surface the same numbers.

## Input format

`createOcrInput(screenPreview, region, options)` returns:

```json
{
  "screenPreview": {
    "sourceId":   "screen:0",
    "name":       "Display 1",
    "width":      1280,
    "height":     800,
    "capturedAt": "2026-05-31T12:34:56.789Z"
  },
  "region": { "x": 100, "y": 60, "width": 600, "height": 400 },
  "options": {
    "language":      "ru+en",
    "targetText":    "Continue",
    "matchMode":     "contains",
    "caseSensitive": false
  }
}
```

`region` is optional. When the "Use selected region" toggle is
off, the engine receives `region: null` and works against the
full preview rectangle.

`validateOcrInput(input)` returns
`{ valid, errors: [stableId], warnings: [stableId] }`. Stable
error IDs (mapped to localized strings via `i18n.js`):

| ID                          | Meaning                                      |
|-----------------------------|----------------------------------------------|
| `captureScreenPreviewFirst` | No captured screen preview is available.     |
| `targetTextRequired`        | Target text is empty / whitespace.           |
| `invalidOcrLanguage`        | Language is not one of `ru` / `en` / `ru+en`.|
| `invalidMatchMode`          | Match mode is not `contains` or `exact`.     |
| `invalidRegion`             | Region escapes the preview / has zero size.  |

## Result format

`createOcrResult(input, blocks, match, runMeta)` returns:

```json
{
  "id":               "ocr-result-1",
  "mode":             "mock",
  "realOcr":          false,
  "realClick":        false,
  "success":          true,
  "matched":          true,
  "targetText":       "Continue",
  "language":         "ru+en",
  "matchMode":        "contains",
  "caseSensitive":    false,
  "region":           { "x": 100, "y": 60, "width": 600, "height": 400 },
  "screenSourceId":   "screen:0",
  "screenSourceName": "Display 1",
  "previewSize":      { "width": 1280, "height": 800 },
  "blocks": [
    {
      "id": "ocr-block-1",
      "text": "Continue",
      "confidence": 0.91,
      "boundingBox": { "x": 380, "y": 252, "width": 120, "height": 28 },
      "targetPoint": { "x": 440, "y": 266 }
    },
    { "id": "ocr-block-2", "text": "OK",       "confidence": 0.80, "boundingBox": { "x": 380, "y": 312, "width": 60, "height": 28 }, "targetPoint": { "x": 410, "y": 326 } },
    { "id": "ocr-block-3", "text": "Cancel",   "confidence": 0.83, "boundingBox": { "x": 380, "y": 372, "width": 80, "height": 28 }, "targetPoint": { "x": 420, "y": 386 } },
    { "id": "ocr-block-4", "text": "Settings", "confidence": 0.86, "boundingBox": { "x": 380, "y": 432, "width": 100, "height": 28 }, "targetPoint": { "x": 430, "y": 446 } }
  ],
  "match": { "id": "ocr-block-1", "text": "Continue", "confidence": 0.91, "boundingBox": { "x": 380, "y": 252, "width": 120, "height": 28 }, "targetPoint": { "x": 440, "y": 266 } },
  "actionPreview": {
    "type":          "text_click",
    "mode":          "preview",
    "text":          "Continue",
    "targetPoint":   { "x": 440, "y": 266 },
    "boundingBox":   { "x": 380, "y": 252, "width": 120, "height": 28 },
    "confidence":    0.91,
    "language":      "ru+en",
    "matchMode":     "contains",
    "caseSensitive": false,
    "usedRegion":    { "x": 100, "y": 60, "width": 600, "height": 400 },
    "realClick":     false,
    "realOcr":       false,
    "note":          "Preview only. Real OCR is not connected. text_click action is not executed."
  },
  "errors":     [],
  "warnings":   [],
  "durationMs": 1,
  "createdAt":  "2026-05-31T12:34:56.790Z"
}
```

## `text_click` action preview

`createTextClickActionPreview(match, input)` returns a plain-data
object with:

- `type: "text_click"` — the planned scenario action type.
- `mode: "preview"` — marker that the click engine, the action
  pipeline, the mock adapter, and the dry-run sandbox refuse to
  consume.
- `text` — the matched block's text.
- `targetPoint` / `boundingBox` — image-space rectangle.
- `confidence` — the block's mock confidence.
- `language` / `matchMode` / `caseSensitive` — the settings used.
- `usedRegion` — the optional search region.
- `realClick: false`, `realOcr: false` — invariants that future
  step (text_click execution) cannot remove without an explicit
  go/no-go pass.
- `note` — short reminder that the preview is never executed.

The renderer renders this via `<pre>.textContent` (no HTML
interpolation). At Step 32 there is no `text_click` scenario
type — the click engine continues to know only `simple_click`
and `image_click`.

## Region support

When **Use selected region** is on, the OCR engine receives the
`appState.regionSelector.normalizedRegion` rectangle (image-space
coordinates from Step 26). The engine clamps every fabricated
block inside the region; if a block doesn't fit it is dropped.

When the toggle is off, the engine receives `region: null` and
works over the whole preview rectangle.

This mirrors the Step-30 image_click behaviour and lets future
real OCR plug in without additional UI work.

## What is not implemented

- No `tesseract.js`, no `tesseract`, no native OCR. `package.json`
  declares zero of these.
- No live-screen analysis. The engine only sees preview metadata
  (width / height / region / capturedAt) — never pixel buffers.
- No real `text_click` execution. The action preview is plain
  data and is rejected by the action pipeline if anyone tries to
  run it.
- No multi-match candidates / top-N. The mock returns the
  highest-confidence matching block.
- No language-model selection at runtime.
- No image preprocessing (binarisation, deskew, denoise, scaling).
- No image_click / text_click hybrid scenarios.

## Future Tesseract integration

When the real OCR gate opens (after a separate
[`docs/REAL_ACTIONS_GO_NO_GO.md`](./REAL_ACTIONS_GO_NO_GO.md)
review focused specifically on text recognition):

- `ocr-mock-engine.js` will be paired with `ocr-engine.js` (a real
  engine module).
- The renderer will gain a `mode: "mock" | "real"` toggle on the
  OCR tab; the data shapes already match.
- The `text_click` action preview will become the input shape of
  a future `text_click` scenario type. The action pipeline will
  gain a simulation branch first (`action.textClick.simulated`),
  then — and only then, behind another go/no-go review — a real
  branch with the same `realClick: true` rejection contract that
  `image_click` uses today.
- Mock OCR will remain in the codebase as a separate mode so
  developers can exercise the data shape without spending CPU.

Until that gate opens, OCR is the **renderer-side mock** and
`text_click` is the **non-executable preview**.

## Safety notes

- **Mock OCR never clicks. Mock OCR never moves the cursor.**
  No real click. No real cursor movement. The action preview is
  rendered through `<pre>.textContent` and is rejected by the
  click engine, the action pipeline, the mock adapter, and the
  dry-run sandbox.
- `ocr-mock-engine.js` and `ocr-ui.js` are renderer-only. They
  never `require()` anything, never import `electron` /
  `ipcRenderer` / `fs` / `localStorage`, and never use unsafe
  `innerHTML` on user data. Image previews go to `<img>.src`
  only.
- The mock engine never opens a new IPC channel. `main.js`
  registers no `ocr.*` handler. `preload.js` exposes no `ocr.*`
  API.
- The mock engine never persists pixel data, the recognised
  blocks, or the action preview to disk. Module-local
  `_lastOcrResult` / `_ocrDiagnostics` live in renderer memory
  only and are reset on `clearOcrMockResult()`.
- Audit events `ocr.mock.requested` / `ocr.mock.completed` /
  `ocr.mock.failed` / `ocr.mock.cleared` /
  `text.click.preview.created` carry only short metadata
  (matchMode, language, hasRegion, blocksCount, durationMs,
  target text length — never the full target text, never an
  `imageDataUrl`, never PII).
- Diagnostics card "OCR diagnostics" and the new `OCR:` line in
  `Copy diagnostics` carry only metadata —
  `ocrMockAvailable`, `realOcrAvailable`, `lastOcrRunAt`,
  `lastOcrMatched`, `lastOcrConfidence`, `lastOcrDurationMs`,
  `ocrLanguage`, `ocrMatchMode`, `targetTextPresent`,
  `lastOcrBlocksCount`, `regionUsed`, `realOcr=false`,
  `realClick=false`, `tesseractAvailable=false`,
  `ocrEngineImplemented=false`.
- `simulationOnly: true`, `realActionsImplemented: false`,
  `realClick: false`, `ocrImplemented: false`,
  `tesseractAvailable: false`. Step 32 changes none of these.
- `nodeIntegration: false`, `contextIsolation: true`. CSP
  unchanged.

See also:

- [`docs/IMAGE_CLICK_TEST_TOOLS.md`](./IMAGE_CLICK_TEST_TOOLS.md)
- [`docs/IMAGE_CLICK_SCENARIO.md`](./IMAGE_CLICK_SCENARIO.md)
- [`docs/SCREEN_CAPTURE.md`](./SCREEN_CAPTURE.md)
- [`docs/REGION_SELECTOR.md`](./REGION_SELECTOR.md)
- [`docs/ACTION_SCHEMA.md`](./ACTION_SCHEMA.md)
- [`docs/SECURITY_CHECKLIST.md`](./SECURITY_CHECKLIST.md)
- [`docs/SMOKE_TESTS.md`](./SMOKE_TESTS.md)
- [`docs/REAL_ACTIONS_GO_NO_GO.md`](./REAL_ACTIONS_GO_NO_GO.md)



---

## Step 33 — OCR mock is now used by the `text_click` scenario

[Step 33](./TEXT_CLICK_SCENARIO.md) introduces a new scenario
type `text_click` that runs this mock OCR engine on every
iteration. The engine itself is unchanged: it still fabricates
plausible recognised-text blocks from the captured preview
metadata and the user's target text — never from real pixel
analysis. The new scenario type just orchestrates the engine +
the action-pipeline so the user can run a full
"capture → mock OCR → simulated click" loop end-to-end.

`runTextClickScenario` calls `createOcrInput()`,
`runMockOcr()`, and reads `result.match` to build the
`text_click` action. No real OCR. No real click. The mock
engine continues to NOT recognise real text.

See [`docs/TEXT_CLICK_SCENARIO.md`](./TEXT_CLICK_SCENARIO.md).



---

## Step 34 — mock OCR is also used by the text_click test tools

[Step 34](./TEXT_CLICK_TEST_TOOLS.md) ships a **Test OCR / Test
Text Match** panel inside the `text_click` scenario form. The
panel calls `createOcrInput()` and `runMockOcr()` directly with
the form's current target text / language / match mode / case
sensitivity / region — the same way the Step-33 click engine
does — and renders the result as a debug overlay, an
OCR-blocks list, an action preview, and a structured debug
result.

The mock engine itself is unchanged at Step 34:

- still pure renderer code, no IPC, no native deps;
- still fabricates blocks from preview metadata only;
- still NEVER recognises real text;
- still emits `ocr.mock.requested` / `ocr.mock.completed` /
  `ocr.mock.failed` audit events with only short metadata
  (no full target text, no `imageDataUrl`).

Test OCR adds its own audit lifecycle on top of the engine:
`textClick.test.started`, `textClick.test.completed`,
`textClick.test.failed`, `textClick.test.noMatch`,
`textClick.test.cleared`, `textClick.test.actionPreview.created`.

See [`docs/TEXT_CLICK_TEST_TOOLS.md`](./TEXT_CLICK_TEST_TOOLS.md).



## Provider architecture (Step 38)

The Step-32 mock engine documented above is now wrapped in an
explicit OCR-provider contract introduced at Step 38. The mock
remains the single active provider and the only runtime that
analyses anything; the new layer simply formalises the shape
every backend has to satisfy so a future Tesseract provider can
be wired up without rewriting consumers.

- [`src/ocr-provider-interface.js`](../src/ocr-provider-interface.js)
  — pure-renderer contract: `createOcrProviderResult`,
  `validateOcrProviderInput`, `normalizeOcrProviderOptions`,
  `getOcrProviderContract`, `getSupportedOcrLanguages`,
  `isRealOcrAllowed` (always `false` at Step 38),
  `createOcrProviderStatus`.
- [`src/ocr-provider-registry.js`](../src/ocr-provider-registry.js)
  — pure-renderer registry: `getOcrProviders`,
  `getOcrProviderById`, `getActiveOcrProvider`,
  `setActiveOcrProvider` (BLOCKS real providers),
  `getOcrProviderRegistryStatus`,
  `isRealOcrProviderRegistered`, `runOcrProviderSelfTest`,
  `runActiveOcrProvider`.

The Advanced → OCR tab now renders an **OCR readiness** card
above the existing settings: provider list (mock = active,
tesseract = planned/unavailable), real-OCR flags
(`realOcrEnabled: no`, `realOcrAllowed: no`), supported
languages, image-storage stance (`OCR images are not saved to
disk: yes`), and a **Run provider self-test** button. The
self-test runs the mock engine against a synthetic `1280×720`
preview and reports the result inline.

The diagnostics line `OCR provider: ...` joins the existing
`OCR: ...` line; both still report `realOcr=false` and
`realClick=false`. Six new allowlisted audit events
(`ocr.provider.selftest.started/.completed/.failed`,
`ocr.provider.selection.blocked`, `ocr.provider.mock.active`,
`ocr.provider.real.unavailable`) carry counts / durations /
stable error IDs only — never pixel data, never the full
target text.

For the full integration roadmap see
[`REAL_OCR_INTEGRATION_PLAN.md`](./REAL_OCR_INTEGRATION_PLAN.md).
For the contract reference see
[`OCR_PROVIDER_INTERFACE.md`](./OCR_PROVIDER_INTERFACE.md).
