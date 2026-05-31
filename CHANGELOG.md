# Changelog

All notable changes to **ClickFlow** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project follows a step-based development log (see README).
This project is currently in **beta** — `simulation-only`.

---

## [Unreleased] — Steps 15-32

Final stabilization of the simulation-only beta, design-only handoff
to the future real-input release line, the Step 17 architectural
scaffolding, the Step 18 desktop adapter interface plus mock
adapter, the Step 19 real-action sandbox with dry-run preview, the
Step 20 final beta QA pass, the Step 21 beta release packaging
pass, the Step 22 GitHub beta release finalization, the Step 23
post-pack QA and release blocker pass, the Step 24 final beta
release preparation, the Step 25 Screen Capture Foundation, the
Step 26 Region Selector Foundation, the Step 27 Template Asset
Manager, the Step 28 Template Matching Mock / Dry-run, the
Step 29 Real Template Matching Engine Foundation, the
Step 30 Image Click Scenario Type Foundation, the
Step 31 Image Click Scenario UX Polish + Visual Test Tools, and
the **Step 32 OCR Foundation** (mock OCR engine + Advanced → OCR
tab + `text_click` action PREVIEW; never recognises real text,
never clicks, never opens a new IPC channel). **Still simulation-only.**

### Added (Step 32 — OCR Foundation)

- `src/ocr-mock-engine.js` (new pure-renderer module):
  - `createOcrInput(screenPreview, region, options)` — sanitises
    every input. The `screenPreview` carries only metadata
    (`sourceId` / `name` / `width` / `height` / `capturedAt`);
    pixel buffers never enter the engine.
  - `validateOcrInput(input)` — returns
    `{ valid, errors: [stableId], warnings: [stableId] }`.
    Stable error IDs: `captureScreenPreviewFirst`,
    `targetTextRequired`, `invalidOcrLanguage`,
    `invalidMatchMode`, `invalidRegion`.
  - `runMockOcr(input)` — synchronous, validates, fabricates
    blocks via `createMockOcrBlocks`, picks the best match via
    `findTextInOcrBlocks`, builds the result via
    `createOcrResult`, attaches a `text_click` action preview
    via `createTextClickActionPreview`. Records
    `ocr.mock.requested` / `ocr.mock.completed` /
    `ocr.mock.failed` / `text.click.preview.created` audit
    events. Never calls `runScenario`, `runImageClickScenario`,
    `executeAction` real branch, the mock adapter, or the
    dry-run sandbox.
  - `createMockOcrBlocks(input)` — fabricates a target block
    centred inside the region (or near the centre of the
    preview) with the user's target text + 1–3 surrounding
    labels (`OK` / `Cancel` / `Settings`) stacked underneath.
    Confidences in `[0.80, 0.95]`. Block heights derived from
    the search rectangle so the overlay scales across
    resolutions. Bounding boxes always lie inside the search
    rectangle.
  - `findTextInOcrBlocks(blocks, targetText, matchMode, opts)`
    — `contains` / `exact` mode, `caseSensitive` flag. Returns
    the highest-confidence matching block or `null`.
  - `createOcrResult(input, blocks, match, runMeta)` — builds
    the structured plain-data result (success, matched,
    targetText, language, matchMode, caseSensitive, region,
    screenSourceId / Name, previewSize, blocks, match,
    actionPreview, errors, warnings, durationMs, createdAt,
    `realOcr: false`, `realClick: false`).
  - `createTextClickActionPreview(match, input)` — builds a
    plain-data preview of the planned `text_click` action.
    Always carries `mode: "preview"`, `realClick: false`,
    `realOcr: false`, and a "Preview only…" note. The click
    engine, the action pipeline, the mock adapter, and the
    dry-run sandbox all refuse to consume it.
  - `getOcrMockStatus()` — diagnostics snapshot
    (`ocrMockAvailable: true`, `realOcrAvailable: false`,
    `lastOcrRunAt`, `lastOcrMatched`, `lastOcrConfidence`,
    `lastOcrDurationMs`, `lastOcrLanguage`, `lastOcrMatchMode`,
    `lastOcrTargetTextLen`, `lastOcrBlocksCount`,
    `lastOcrRegionUsed`, `realClick: false`, `realOcr: false`,
    `hasResult`).
  - `clearOcrMockResult()` — wipes module-local state and
    emits `ocr.mock.cleared`.
  - `getLastOcrMockResult()` — shallow copy.
  - All identifiers, errors, languages, and match modes are
    Object.freeze-locked allowlists so the engine cannot
    silently extend its surface.
- `src/ocr-ui.js` (new renderer UI module):
  - `renderOcrTab()` — builds the OCR section content.
  - `renderOcrScreenPreviewStatus()` — Screen preview status
    card (source name, image size, capturedAt, "Preview only =
    enabled").
  - `renderOcrSettings()` — target text input, language select
    (`ru` / `en` / `ru+en`), match mode select (`contains` /
    `exact`), case-sensitive checkbox, use-selected-region
    checkbox.
  - `renderOcrRegionSummary()` — region from
    `appState.regionSelector.normalizedRegion` when "use
    selected region" is on.
  - `runMockOcrFromUi()` — collects state via
    `buildOcrInputFromState()`, runs the mock engine, sets the
    result on the OCR slice, logs.
  - `renderOcrResult()` — coloured headline (matched=green /
    failed=red / no-match=yellow), metric rows.
  - `renderOcrBlocks()` — recognised-blocks list with matched
    row highlight.
  - `renderOcrOverlay()` — preview `<img>` + dashed blue
    region rectangle + yellow-dashed candidate rectangles +
    green solid matched rectangle (with tiny text label) + red
    target dot. CSS percentage positioning so the overlay
    scales correctly.
  - `renderTextClickActionPreview()` — JSON of the planned
    `text_click` action via `<pre>.textContent` (no HTML
    interpolation, never executed).
  - `clearOcrResultUi()` — collapses every block.
  - Quick navigation buttons: Open Screen Capture / Open
    Region Selector → `setAdvancedTab('screenCapture')`.
- `src/app-state.js`:
  - New `ocr: { targetText, language, matchMode, caseSensitive,
    useSelectedRegion, lastInput, lastResult, isRunning,
    lastError, lastRunAt }` slice.
  - 11 new setters: `setOcrTargetText`, `setOcrLanguage`,
    `setOcrMatchMode`, `setOcrCaseSensitive`,
    `setOcrUseSelectedRegion`, `setOcrRunning`, `setOcrInput`,
    `setOcrResult`, `setOcrError`, `clearOcrResult`,
    `resetOcrState`.
  - `_cloneOcrSliceInput(input)` and
    `_cloneOcrSliceResult(result)` strip `imageDataUrl`
    defensively even if a buggy caller attaches one. The slice
    only carries metadata.
  - `getState()` returns a defensive copy of the OCR slice.
- `src/audit-events.js` — 5 new allowlisted event types:
  `ocr.mock.requested`, `ocr.mock.completed`, `ocr.mock.failed`,
  `ocr.mock.cleared`, `text.click.preview.created`. Payloads
  carry only short metadata (matchMode, language, hasRegion,
  blocksCount, durationMs, target text length — never the full
  target text, never an `imageDataUrl`, never PII).
- `src/i18n.js` — 56 new keys per language (RU + EN):
  `ocr`, `ocrFoundation`, `mockOcr`, `runMockOcr`,
  `clearOcrResult`, `ocrResult`, `realOcrNotConnected`,
  `targetText`, `targetTextPlaceholder`, `ocrLanguage`,
  `matchMode`, `contains`, `exact`, `caseSensitive`,
  `useSelectedRegion`, `recognizedBlocks`, `matchedText`,
  `textClickPreview`, `realOcrDisabled`,
  `textRecognitionNotImplemented`, `ocrMockNotice`,
  `noOcrResult`, `ocrMatched`, `ocrNoMatch`, `ocrConfidence`,
  `ocrBlocks`, `ocrDiagnostics`, `realOcrAvailable`,
  `ocrMockAvailable`, `targetTextRequired`,
  `invalidOcrLanguage`, `invalidMatchMode`, `ocrTabTitle`,
  `ocrSettings`, `ocrRunStarted`, `ocrRunCompleted`,
  `ocrRunFailed`, `ocrRunCleared`, `textClickActionPreview`,
  `textClickNotExecuted`, `ocrMockBadge`, `languageRu`,
  `languageEn`, `languageRuEn`, `matchModeContains`,
  `matchModeExact`, `lastOcrRunAt`, `lastOcrMatched`,
  `lastOcrConfidence`, `lastOcrDurationMs`, `lastOcrLanguage`,
  `lastOcrMatchMode`, `lastOcrBlocksCount`, `targetTextPresent`,
  `regionUsed`, `confidenceLabel`.
- `src/index.html`:
  - New tab button `data-advanced-tab="ocr"` next to **Поиск
    шаблона**.
  - New `<section id="advanced-tab-ocr"
    class="adv-section adv-section-hidden">`.
  - Loads `ocr-mock-engine.js` and `ocr-ui.js` between
    `image-click-test-ui.js` and `renderer.js`. CSP unchanged.
- `src/renderer.js`:
  - `renderAdvancedDashboard` dispatches `case 'ocr':
    renderOcrTab()`.
  - New **OCR diagnostics** card in `renderAdvancedSafety` with
    last-run rows + always-on safety reminders (`Real OCR
    disabled = enabled`, `Text recognition is not implemented
    yet = enabled`, `Real click disabled = enabled`).
  - New `OCR: ocrMockAvailable=…, realOcrAvailable=false,
    lastOcrRunAt=…, lastOcrMatched=…, lastOcrConfidence=…,
    lastOcrDurationMs=…, ocrLanguage=…, ocrMatchMode=…,
    targetTextPresent=…, lastOcrBlocksCount=…, regionUsed=…,
    realOcr=false, realClick=false, tesseractAvailable=false,
    ocrEngineImplemented=false` line in `Copy diagnostics`.
    Numeric / metadata only — never base64, never the full
    target text.
- `src/styles.css` — new section "Step 32 — OCR Foundation":
  `.ocr-notice` (yellow MOCK banner), `.ocr-notice-badge`,
  `.ocr-screen-card`, `.ocr-settings-card`, `.ocr-region-card`,
  `.ocr-empty`, `.ocr-setting-row`, `.ocr-setting-label`,
  `.ocr-input`, `.ocr-select`, `.ocr-checkbox-label`,
  `.ocr-buttons`, `.ocr-run-button`, `.ocr-clear-button`,
  `.ocr-nav-button`, `.ocr-result-host`, `.ocr-result-card`,
  `.ocr-result-headline` with three coloured variants
  (matched=green, failed=red, no-match=yellow),
  `.ocr-result-subtitle`, `.ocr-errors`, `.ocr-blocks-card`,
  `.ocr-blocks-list`, `.ocr-block-row`,
  `.ocr-block-row-matched`, `.ocr-block-index`,
  `.ocr-block-text`, `.ocr-block-confidence`,
  `.ocr-block-bbox`, `.ocr-overlay-card`,
  `.ocr-overlay-wrapper`, `.ocr-overlay-image`
  (`max-width: 100%`), `.ocr-overlay-region` (dashed blue),
  `.ocr-overlay-block` (yellow-dashed candidate),
  `.ocr-overlay-block-matched` (solid green),
  `.ocr-overlay-block-label`, `.ocr-overlay-target` (red dot
  with white halo), `.ocr-overlay-note`,
  `.ocr-action-preview-card`, `.ocr-action-preview-note`,
  `.ocr-action-preview-json` (max-height 280 px, monospace,
  `<pre>.textContent` only). Dark-theme tweaks via
  `[data-theme="dark"]`. Mobile fallback at `max-width: 760px`.
- `docs/OCR_FOUNDATION.md` — new doc covering purpose,
  current status, mock OCR flow, input format, result format,
  `text_click` action preview, region support, what is not
  implemented, future Tesseract integration, safety notes.
- `docs/ACTION_SCHEMA.md` — adds **Step 32 — `text_click`
  (planned, preview only)** section with the planned action
  shape and the invariants `text_click` will keep when it lands.
- `docs/SCREEN_CAPTURE.md` — adds note that the preview is also
  consumed by the OCR mock (metadata only).
- `docs/REGION_SELECTOR.md` — adds note that the region can
  scope the OCR mock.
- `docs/SECURITY_CHECKLIST.md` — adds **OCR Foundation (Step 32)**
  section with behavioural / storage / pipeline / Electron-
  security invariants.
- `docs/SMOKE_TESTS.md` — adds **Step 32 — OCR Foundation
  (mock only)** smoke checks (#299–#318).
- `docs/KNOWN_LIMITATIONS.md` — adds new section
  **15. OCR is mock only (Step 32)** covering "the OCR engine
  is fake", "no `text_click` scenario yet", "no real cursor /
  click from OCR", "no live-screen OCR".
- `scripts/smoke-check.js` — Step 32 invariants (see below).

### Safety invariants kept (Step 32)

- `nodeIntegration: false`, `contextIsolation: true`, CSP
  unchanged.
- `simulationOnly: true`, `realActionsImplemented: false`,
  `realMatching: false`, `realClick: false`,
  `realOcr: false`, `ocrEngineImplemented: false`,
  `tesseractAvailable: false`, `ocrMockAvailable: true` in
  every status response, audit payload, and diagnostics line.
- The OCR Foundation runs entirely in the renderer. It never
  opens a new IPC channel, never imports `electron`,
  `ipcRenderer`, `fs`, or `localStorage`.
  `ocr-mock-engine.js` and `ocr-ui.js` contain no `require()`
  of any prohibited module (`tesseract` / `tesseract.js` /
  `tesseract-ocr` / `node-tesseract-ocr` / `opencv4nodejs` /
  `@u4/opencv4nodejs` / `opencv.js` / `opencv-js` / `sharp` /
  `jimp` / `pixelmatch` / `looks-same` / `robotjs` / `nut-js` /
  `nutjs` / `@nut-tree/nut-js` / `iohook` / `uiohook-napi` /
  `node-key-sender`).
- The action preview is rendered through `<pre>.textContent`.
  No HTML interpolation. The click engine, the action
  pipeline, the mock adapter, and the dry-run sandbox do not
  consume `mode: "preview"` actions, and there is no
  `text_click` scenario type at Step 32.
- The screenshot is never persisted on disk by the OCR mock.
  The result is never written into `scenarios.json`,
  `settings.json`, `profiles.json`, `templates.json`, or
  `localStorage`. Module-local `_lastOcrResult` /
  `_ocrDiagnostics` live in renderer memory and are cleared
  on `clearOcrMockResult()` / `clearOcrResult()`.
- Audit payloads carry only ids and short metadata. No
  `imageDataUrl`, no thumbnails, no full target text, no PII.

## [Unreleased] — Steps 15-31

Final stabilization of the simulation-only beta, design-only handoff
to the future real-input release line, the Step 17 architectural
scaffolding, the Step 18 desktop adapter interface plus mock
adapter, the Step 19 real-action sandbox with dry-run preview, the
Step 20 final beta QA pass, the Step 21 beta release packaging
pass, the Step 22 GitHub beta release finalization, the Step 23
post-pack QA and release blocker pass, the Step 24 final beta
release preparation, the Step 25 Screen Capture Foundation, the
Step 26 Region Selector Foundation, the Step 27 Template Asset
Manager, the Step 28 Template Matching Mock / Dry-run, the
Step 29 Real Template Matching Engine Foundation, the
Step 30 Image Click Scenario Type Foundation, and the
**Step 31 Image Click Scenario UX Polish + Visual Test Tools**
(Test Match panel inside the `image_click` scenario form — never
executes the scenario, never moves the cursor, never clicks).
**Still simulation-only.**

### Added (Step 31 — Image Click Scenario UX Polish + Visual Test Tools)

- `src/image-click-test-tools.js` (new pure-renderer module):
  - `buildImageClickTestInput(formData, appState)` — collects
    template, screen preview, region (form copy), threshold,
    step, scenarioDraftName from the form + the renderer state
    slices. Sanitises every field; copies pixel-bearing fields
    (`previewDataUrl` / `imageDataUrl`) into the input only —
    never copies them onward into diagnostics, audit payloads,
    or persisted state.
  - `validateImageClickTestInput(input)` — returns
    `{ valid, errors: [stableId], warnings: [stableId] }`.
    Stable error IDs: `noTemplateSelected`,
    `templateImageMissing`, `captureScreenPreviewFirst`,
    `invalidRegion`, `templateLargerThanSearchArea`,
    `matchingTookTooLong`, `matchingEngineUnavailable`,
    `thresholdInvalid`, `stepInvalid`. Stable warning IDs:
    `matchBelowThreshold`, `searchAreaCostHigh`,
    `stepRaisedByEngine`, `templateDownscaled`,
    `searchAreaDownscaled`.
  - `runImageClickTest(input)` (async) — validates, calls the
    Step-29 `runTemplateMatch(screenDataUrl, templateDataUrl,
    options)` engine, builds a debug result. 8-second soft
    timeout cap. Records `imageClick.test.started` /
    `imageClick.test.completed` / `imageClick.test.failed` /
    `imageClick.test.lowConfidence` audit events. Never calls
    `runScenario`, `runImageClickScenario`, `executeAction`
    real branch, the mock adapter, or the dry-run sandbox.
  - `createImageClickDebugResult(matchResult, input)` — builds
    `{ scenarioDraftName, templateId, templateName,
    screenSourceName, screenSourceId, previewSize, region,
    threshold, step, matched, confidence, boundingBox,
    targetPoint, durationMs, actionPreview, errors, warnings,
    createdAt, realClick: false, realMatching: false,
    engineMode, pixelStep, scannedPositions, downscaledSearch,
    downscaledTemplate }`. The action preview is built via the
    Step-28 `createImageClickActionPreview` helper and is
    plain-data (`mode: "preview"`, `realClick: false`,
    `realMatching: false`, `note: "Preview only…"`).
  - `clearImageClickTestResult()` — wipes module-local
    `_lastTestResult` + `_diagnostics` and emits
    `imageClick.test.cleared`.
  - `getImageClickTestStatus()` — diagnostics snapshot
    (`hasResult`, `lastImageClickTestAt`,
    `lastImageClickTestMatched`,
    `lastImageClickTestConfidence`,
    `lastImageClickTestDurationMs`,
    `lastImageClickTestTemplateId`,
    `lastImageClickTestErrorsCount`, `realClick: false`,
    `realMatching: false`, `testDoesNotClick: true`).
  - `getLastImageClickTestResult()` — shallow copy of the
    last debug result. Module-local; never persisted.
- `src/image-click-test-ui.js` (new renderer UI module):
  - `initImageClickTestUi()` — builds the panel skeleton
    inside `#form-section-image-click` once. Idempotent.
  - `refreshImageClickTestPanel()` — re-renders the three
    info cards.
  - `renderImageClickTemplatePreview()` — Template preview
    card (image preview via `<img>.src`, name, image size in
    pixels, file size in KiB / MiB).
  - `renderImageClickScreenPreviewStatus()` — Screen preview
    status card (source name, image size, capturedAt,
    `Preview only = enabled` reminder).
  - `renderImageClickRegionSummary()` — Region summary card
    (used region from form draft + selected region from the
    region-selector slice).
  - `runImageClickTestFromForm()` — collects form data,
    validates, runs the engine, renders the result, mirrors
    the result into `appState.templateMatching.lastResult`
    (numbers / ids only).
  - `renderImageClickTestResult(result)` — coloured headline
    (matched=green / failed=red / no-match=yellow), metric
    rows, errors block, warnings block, debug overlay,
    action preview.
  - `clearImageClickTestResultUi()` — collapses every block.
  - `renderImageClickDebugOverlay(result)` — preview `<img>`
    with overlay rectangles positioned via CSS percentages:
    region (dashed blue), bounding box (solid green for
    matched, dashed orange for low-confidence candidate),
    confidence badge inside the rectangle, target dot.
  - `renderImageClickActionPreview(result)` — JSON of the
    planned `image_click` action via `<pre>.textContent`
    (no HTML interpolation, never executed).
  - Three quick navigation buttons (Open Templates / Open
    Screen Capture / Open Region Selector → `setAdvancedTab(tab)`).
- `src/audit-events.js` — 5 new allowlisted event types:
  `imageClick.test.started`,
  `imageClick.test.completed`,
  `imageClick.test.failed`,
  `imageClick.test.lowConfidence`,
  `imageClick.test.cleared`. Payloads carry only ids and
  numeric metadata (confidence, target X / Y, durationMs,
  threshold, step, errorsCount, warningsCount, hasRegion).
- `src/i18n.js` — 47 new keys per language (RU + EN):
  `testMatch`, `runTestMatch`, `testMatchResult`,
  `imageClickTestTools`, `templatePreview`, `screenPreviewStatus`,
  `regionSummary`, `noTemplateSelected`,
  `captureScreenPreviewFirst`, `invalidRegion`,
  `templateLargerThanSearchArea`, `matchBelowThreshold`,
  `matchingTookTooLong`, `matchingEngineUnavailable`,
  `thresholdInvalid`, `stepInvalid`, `openTemplates`,
  `openScreenCapture`, `openRegionSelector`, `testMatched`,
  `testNoMatch`, `testFailed`, `debugOverlay`, `confidenceBadge`,
  `scenarioDraft`, `testDoesNotClick`, `imageClickTestStarted`,
  `imageClickTestCompleted`, `imageClickTestLowConfidence`,
  `imageClickTestCleared`, `imageClickTestFormTypeMismatch`,
  `searchAreaCostHigh`, `stepRaisedByEngine`,
  `templateDownscaled`, `searchAreaDownscaled`,
  `openingAdvancedTab`, `imageClickTestDiagnostics`,
  `lastImageClickTestAt`, `lastImageClickTestMatched`,
  `lastImageClickTestConfidence`, `lastImageClickTestDurationMs`,
  `lastImageClickTestTemplateId`, `lastImageClickTestErrorsCount`.
  (`templateImageMissing` and `lowConfidence` already exist
  from Step 29.)
- `src/index.html` — loads `image-click-test-tools.js` and
  `image-click-test-ui.js` between `template-matching-ui.js`
  and `renderer.js`. CSP unchanged. Tab list unchanged. No new
  `<script>` injected at runtime.
- `src/renderer.js`:
  - `init()` ends with `initImageClickTestUi()`.
  - `openCreateScenarioForm` / `openEditScenarioForm` /
    `closeScenarioForm` clear the test panel result via
    `clearImageClickTestResultUi()` and refresh the cards.
  - `syncScenarioFormSections` refreshes the test panel when
    the user switches to the image_click section.
  - `populateTemplateSelect` ends with
    `renderImageClickTemplatePreview()`.
  - `refreshImageClickRegionSummary` ends with the UI module's
    `renderImageClickRegionSummary()` (different name, no
    recursion).
  - `inputTemplateId` `change` listener refreshes the template
    preview card.
  - New **Image click test diagnostics** card in
    `renderAdvancedSafety` with last-test rows + always-on
    safety reminders.
  - New `Image click test: hasResult=…, lastImageClickTestAt=…,
    lastImageClickTestMatched=…, lastImageClickTestConfidence=…,
    lastImageClickTestDurationMs=…,
    lastImageClickTestTemplateId=…,
    lastImageClickTestErrorsCount=…, testDoesNotClick=true,
    realMatching=false, realClick=false` line in
    `Copy diagnostics`. Numeric / metadata only — never
    base64, never `imageDataUrl`.
- `src/styles.css` — new section "Step 31 — Image Click
  Scenario UX Polish + Visual Test Tools": `.image-click-test-panel`,
  `.image-click-test-header`, `.image-click-test-title`,
  `.image-click-test-subtitle`, `.image-click-test-nav`,
  `.image-click-test-nav-button`, `.image-click-test-card`,
  `.image-click-test-card-title`, `.image-click-test-empty`,
  `.image-click-test-row`, `.image-click-test-row-label`,
  `.image-click-test-row-value`, `.image-click-test-template-card`,
  `.image-click-test-template-preview-box`,
  `.image-click-test-template-preview-image` (max-height 100%,
  `object-fit: contain`), `.image-click-test-controls`,
  `.image-click-test-button`, `.image-click-test-button-busy`,
  `.image-click-test-clear-button`, `.image-click-test-errors`,
  `.image-click-test-warnings`, `.image-click-test-result-panel`,
  `.image-click-test-result-headline` with three coloured
  variants (matched=green, failed=red, no-match=yellow),
  `.image-click-test-overlay-card`,
  `.image-click-test-overlay-wrapper`,
  `.image-click-test-overlay-image` (`max-width: 100%`),
  `.image-click-test-overlay-region` (dashed blue),
  `.image-click-test-overlay-bbox` (solid green),
  `.image-click-test-overlay-bbox-candidate` (dashed orange),
  `.image-click-test-confidence-badge`,
  `.image-click-test-confidence-badge-low`,
  `.image-click-test-overlay-target` (red dot with white halo),
  `.image-click-test-action-preview-json` (max-height 280 px,
  monospace, `<pre>.textContent` only). Dark-theme tweaks via
  `[data-theme="dark"]`. Mobile fallback at `max-width: 760px`.
- `docs/IMAGE_CLICK_TEST_TOOLS.md` — new doc covering purpose,
  current status, Test Match flow, required data, debug
  result with example JSON, stable error / warning IDs
  tables, debug overlay, action preview, what is not
  executed, troubleshooting, safety notes.
- `docs/IMAGE_CLICK_SCENARIO.md` — adds **Test Match (Step 31)**
  section linking to the new doc.
- `docs/TEMPLATE_MATCHING_ENGINE.md` — adds **Step 31 — engine
  is also used by Test Match** section.
- `docs/SECURITY_CHECKLIST.md` — adds **image_click test tools
  (Step 31)** section with behavioural / pipeline-level /
  Electron-security invariants.
- `docs/SMOKE_TESTS.md` — adds **Step 31 — Image Click Scenario
  UX Polish + Visual Test Tools** smoke checks (#278–#298).
- `scripts/smoke-check.js` — Step 31 invariants (see below).

### Safety invariants kept (Step 31)

- `nodeIntegration: false`, `contextIsolation: true`, CSP
  unchanged.
- `simulationOnly: true`, `realActionsImplemented: false`,
  `realMatching: false`, `realClick: false`,
  `ocrImplemented: false`, `opencvAvailable: false`,
  `imageClickTestRealExecution: false`,
  `testDoesNotClick: true` in every status response, audit
  payload, and diagnostics line.
- Test Match runs entirely in the renderer. It never opens a
  new IPC channel, never imports `electron`, `ipcRenderer`,
  `fs`, or `localStorage`. `image-click-test-tools.js` and
  `image-click-test-ui.js` contain no `require()` of any
  prohibited module (`tesseract` / `tesseract.js` /
  `opencv4nodejs` / `@u4/opencv4nodejs` / `opencv.js` /
  `opencv-js` / `sharp` / `jimp` / `pixelmatch` / `looks-same`
  / `robotjs` / `nut-js` / `nutjs` / `@nut-tree/nut-js` /
  `iohook` / `uiohook-napi` / `node-key-sender`).
- The mock desktop adapter does not consume preview-mode
  `image_click` actions. Any `realClick: true` is rejected
  by `validateAction`. `executionMode: "real"` is blocked
  exactly as it is for `simple_click`.
- The action preview is rendered through `<pre>.textContent`.
  No HTML interpolation. The click engine, the action
  pipeline, the mock adapter, and the dry-run sandbox do
  not consume `mode: "preview"` actions.
- The screenshot is never persisted on disk by Test Match.
  The debug result is never written into `scenarios.json`,
  `settings.json`, `profiles.json`, `templates.json`, or
  `localStorage`. Module-local `_lastTestResult` lives in
  renderer memory and is cleared on
  `clearImageClickTestResult()` and on every scenario form
  open / close.
- Audit payloads carry only ids and numeric metadata. No
  `imageDataUrl`, no thumbnails, no PII.

### Added (Step 30 — Image Click Scenario Type Foundation)

- `src/scenario-manager.js`:
  - `validateImageClickScenario(input)` — name required,
    templateId required, threshold in `[0, 1]`, step in
    `{1, 2, 4, 8}`, `timeoutMs >= 1000`,
    `intervalMs >= 100`, `repeatCount in [1, 1000]`, region
    optional but valid via `validateRegionSettings`.
  - `createImageClickScenario(input)` /
    `updateImageClickScenario(id, updates)` — owners of
    the new scenario shape.
  - `getScenariosByType(type)` — convenience selector;
    treats missing `type` as `simple_click`.
  - `createScenario` / `updateScenario` dispatch on `type`.
    `simple_click` keeps its old shape and old behaviour.
- `src/click-engine.js`:
  - `runImageClickScenario(scenario, callbacks, options)`
    — capture → match → simulated `image_click` action.
    Honors `stopEngine()`, the user-configured
    `safetySettings.minIntervalMs` /
    `safetySettings.maxRepeatCount`, and updates
    `progress` / `lastAction` exactly like the
    `simple_click` branch. Audit events:
    `scenario.imageClick.started / stopped /
    match.started / match.completed / noMatch /
    simulated / failed`.
  - `runScenario` dispatches on `scenario.type`. The
    `simple_click` branch is unchanged.
  - `validateRunnableScenario` now branches on type and
    delegates to `validateImageClickScenario` for
    `image_click`. Safe-mode bounds still apply.
- `src/action-pipeline.js`:
  - `validateAction` accepts the `image_click` action
    shape: `{ type: 'image_click', templateId, targetPoint,
    boundingBox?, confidence?, realClick: false }`.
  - `executeAction` routes `image_click` through the
    legacy simulate path (the mock adapter only knows
    `click`). Emits `action.imageClick.simulated`.
  - `realClick: true` is rejected by `validateAction`.
    Even if a caller bypassed the schema and asked for
    `executionMode: 'real'`, `blockRealAction` would
    refuse and emit `action.imageClick.realBlocked`.
- `src/safety-gates.js`:
  - `validateActionSafety` accepts the `image_click`
    shape with the same hard `realClick: true` rejection.
- `src/audit-events.js` — 9 new allowlisted event types:
  `scenario.imageClick.started`,
  `scenario.imageClick.stopped`,
  `scenario.imageClick.match.started`,
  `scenario.imageClick.match.completed`,
  `scenario.imageClick.noMatch`,
  `scenario.imageClick.simulated`,
  `scenario.imageClick.failed`,
  `action.imageClick.simulated`,
  `action.imageClick.realBlocked`. Payloads carry only
  ids and numeric metadata.
- `src/index.html` — scenario form gains a `Scenario type`
  select (Coordinate click / Image click) plus an
  `image_click`-only section with: template select,
  region summary + Use selected region / Clear region
  buttons, threshold, step, timeout, interval, repeat,
  and a "No templates yet" warning.
- `src/renderer.js`:
  - `getScenarioFormData` / `fillScenarioForm` /
    `clearScenarioForm` understand both types.
  - `populateTemplateSelect`,
    `applySelectedRegionToImageClickForm`,
    `clearImageClickFormRegion`,
    `refreshImageClickRegionSummary`,
    `syncScenarioFormSections`,
    `bindScenarioFormImageClickHandlers`.
  - `formatLastAction(action)` renders both `simple_click`
    and `image_click` consistently. The Advanced
    Overview's "Last action" row uses it.
  - `startScenario`'s `onAction` callback formats logs
    for both types (no-match, simulated).
  - `renderAdvancedSafety` adds the **image_click
    scenario** card (count, last status / confidence /
    target, simulation-only flags).
  - `copyDiagnostics` carries a new `Image click
    scenario: …` line; the existing `Template matching:
    …` line flips `imageClickScenarioImplemented` from
    `false` to `true`. Both lines stay numeric / metadata
    only — never base64 / pixel data.
  - Scenario cards show an `image_click` badge and a
    type-aware settings line.
- `src/styles.css` — new section "Step 30 — Image Click
  Scenario Type": `.form-section`, `.form-warning`,
  `.image-click-region-summary`,
  `.image-click-region-summary-active`,
  `.form-group-region`,
  `.scenario-card-badge-image-click`. Dark-theme tweaks
  via `[data-theme="dark"]`. Mobile fallback at
  `max-width: 760px`.
- `src/i18n.js` — 26 new keys per language (RU + EN).
- `docs/IMAGE_CLICK_SCENARIO.md` — new doc covering
  purpose, current status, scenario format, required
  template, optional region, threshold / step,
  execution flow, simulation-only behaviour, what is
  not implemented, future real click integration.
- `docs/ACTION_SCHEMA.md` / `docs/TEMPLATE_MATCHING_ENGINE.md`
  / `docs/TEMPLATE_ASSETS.md` / `docs/REGION_SELECTOR.md`
  cross-link to the new doc; `docs/SECURITY_CHECKLIST.md`
  adds the **image_click scenario (Step 30)** section;
  `docs/KNOWN_LIMITATIONS.md` adds section 14
  **image_click does not perform a real click**;
  `docs/SMOKE_TESTS.md` adds Step 30 smoke checks
  (#260–#277).
- `scripts/smoke-check.js` — Step 30 invariants (see below).

### Safety invariants kept (Step 30)

- `nodeIntegration: false`, `contextIsolation: true`, CSP
  unchanged.
- `simulationOnly: true`, `realActionsImplemented: false`,
  `realMatching: false`, `realClick: false`,
  `ocrImplemented: false`, `opencvAvailable: false`,
  `matcherImplemented: true` (Step 29 engine exists),
  `imageClickScenarioImplemented: true` (Step 30 scenario
  type exists), `imageClickSimulationOnly: true`,
  `realImageClickEnabled: false` in every status response,
  audit event, and diagnostics line.
- `image_click` scenarios persist `templateId`, optional
  region (numbers), threshold, step, timeoutMs,
  intervalMs, repeatCount **only**. No `imageDataUrl`,
  no thumbnails, no pixel data is written into a
  scenario.
- Screen-capture preview is still never written to disk.
  The matcher only sees the in-memory data URL the user
  explicitly captured.
- The mock desktop adapter does not consume
  `image_click`. The action flows through the legacy
  simulate path.
- Both `validateAction` and `validateActionSafety` refuse
  any `image_click` action with `realClick: true`.
- No new IPC channel, no new dependency.

### Added (Step 29 — Real Template Matching Engine Foundation)

- `src/template-matching-engine.js` — new pure-renderer module:
  `loadImageFromDataUrl(dataUrl)`,
  `imageToCanvas(image, optWidth?, optHeight?)`,
  `getImageDataFromDataUrl(dataUrl, optWidth?, optHeight?)`,
  `cropImageData(imageData, region)` (sub-rect copy via
  `putImageData` dirty-rect arguments),
  `resizeImageDataIfNeeded(imageData, maxWidth, maxHeight)`
  (returns `{ imageData, scaleX, scaleY }`),
  `runTemplateMatch(screenDataUrl, templateDataUrl, options)`
  (top-level entry point; returns
  `{ success, match, error?, warnings: [] }`),
  `findBestMatch(screenImageData, templateImageData, options)`
  (regular-grid scan over candidate positions),
  `calculatePatchScore(screenData, templateData, screenWidth,
  templateWidth, startX, startY, options)` (mean RGB absolute
  difference, per-template sub-step `1 / 2 / 3 / 4` based on
  template area),
  `createTemplateMatchResult(match, input)` (renderer-shared
  result shape — same shape Step 28 returns from the mock so
  the existing UI / audit / diagnostics code renders both),
  `getTemplateMatchEngineStatus()` (stamps
  `realClick: false`, `ocrImplemented: false`,
  `opencvAvailable: false`, `nativeMatchingAvailable: false`,
  `analyzesPreviewOnly: true`),
  `estimateSearchCost(screenSize, templateSize, region)`. Pure
  logic — never imports `electron` / `ipcRenderer` / `fs`,
  never decodes the live screen, never opens a new IPC
  channel.
- Mock mode from Step 28 is **kept**. The Template Matching
  tab gains a Match-mode `<select>` with two options
  (`Mock` / `Real preview`), a Threshold number `<input>`
  (default `0.75`), and a Step `<select>` with `1 / 2 / 4 /
  8 / 16` (default `4`). Switching modes re-renders the tab
  but does not re-run the matcher.
- `src/template-matching-ui.js` —
  - new `renderTemplateMatchingControls()` (mode / threshold
    / step controls + the real-preview safety notice);
  - new `runTemplateMatchingDispatch()` (picks Mock or
    Real preview based on `appState.templateMatching.mode`);
  - new `runTemplateMatchingRealPreview()` (pulls the
    `imageDataUrl` from `screenCapture.preview` and the
    `previewDataUrl` from the active template, calls
    `runTemplateMatch`, audits warnings, audits
    `template.match.realPreview.completed` /
    `template.match.lowConfidence` on the score outcome,
    audits `image.click.preview.created`);
  - new `_activeTemplateHasPreview(state)` and
    `_activePreviewHasPixels(state)` helpers that gate the
    Run button and add explicit hints to the requirements
    checklist when the user picks Real preview without
    pixel data;
  - `renderTemplateMatchingResult` adds a `Match found` /
    `Low confidence — showing best candidate` headline,
    threshold / duration / step / pixelStep /
    downscaledSearch / downscaledTemplate rows, and a
    distinct real-preview badge;
  - `renderTemplateMatchingOverlay` renders solid green for
    matches and dashed for low-confidence "best candidate"
    runs, with the badge text switching between
    `mock` / `real preview` / `… · low`.
- `src/app-state.js` — `appState.templateMatching` gains
  `mode` (`"mock" | "real-preview"`, default `"mock"`),
  `threshold` (default `0.75`), `step` (default `4`); three
  setters (`setTemplateMatchingMode`,
  `setTemplateMatchingThreshold`, `setTemplateMatchingStep`)
  with input validation. `_cloneTemplateMatchResult` carries
  the new `threshold / durationMs / step / requestedStep /
  pixelStep / scannedPositions / downscaledSearch /
  downscaledTemplate` fields so the result survives a
  deep-copy round trip.
- `src/audit-events.js` — five new allowlisted event types:
  `template.match.realPreview.requested`,
  `template.match.realPreview.completed`,
  `template.match.realPreview.failed`,
  `template.match.lowConfidence`,
  `template.match.engine.warning`. Payloads carry only ids
  and numeric metadata.
- `src/index.html` — loads `template-matching-engine.js`
  between `template-matching-mock.js` and
  `template-matching-ui.js`. Tab list, CSP, and contentSandbox
  flags unchanged.
- `src/renderer.js` — `renderAdvancedSafety()` adds
  `Match mode`, `Threshold`, `Step`, `Duration`,
  `Engine available`, `Search region used` rows to the
  Template matching diagnostics card. `copyDiagnostics()`
  broadens the line to `Template matching: …, mode=…,
  threshold=…, step=…, engineAvailable=…, lastDurationMs=…,
  lastMode=…, …, realMatching=false, realClick=false,
  ocrImplemented=false, opencvAvailable=false,
  matcherImplemented=true, imageClickScenarioImplemented=false`
  (numeric / metadata only — never base64).
- `src/styles.css` — new section "Step 29 — Real Template
  Matching Engine Foundation": `.template-matching-controls-
  card`, `.template-matching-control-row`,
  `.template-matching-mode-select`,
  `.template-matching-threshold-input`,
  `.template-matching-step-select`,
  `.template-matching-real-preview-notice`,
  `.template-matching-real-preview-badge` (green badge
  variant), `.template-matching-headline` (ok / low),
  `.template-matching-overlay-bbox-real` (solid green
  border + faint fill),
  `.template-matching-overlay-bbox-candidate` (dashed,
  no fill). Dark-theme tweaks via `[data-theme="dark"]`.
  Mobile fallback at `max-width: 760px`.
- `src/i18n.js` — 27 new keys per language (RU + EN):
  `realPreviewMatch`, `realPreviewMatching`, `matchMode`,
  `threshold`, `step`, `runRealPreviewMatch`,
  `matchingInProgress`, `matchFound`, `matchNotFound`,
  `lowConfidence`, `bestCandidate`, `durationMs`,
  `realPreviewMatchNotice`, `analyzesPreviewOnly`,
  `doesNotControlDevice`, `templateImageMissing`,
  `screenPreviewMissing`, `templateTooLarge`,
  `searchAreaTooLarge`, `engineAvailable`,
  `searchRegionUsed`, `matchScore`, `matchThreshold`.
- `docs/TEMPLATE_MATCHING_ENGINE.md` — new doc covering
  purpose, current status, real preview matching vs real
  clicks, algorithm, threshold, step, region support,
  performance limitations, what is not implemented, future
  OpenCV option, safety notes.
- `docs/TEMPLATE_MATCHING_MOCK.md`, `docs/SCREEN_CAPTURE.md`,
  `docs/REGION_SELECTOR.md`, `docs/TEMPLATE_ASSETS.md`
  cross-link to the new engine doc.
- `docs/SECURITY_CHECKLIST.md` — adds **Real preview matching
  engine (Step 29)** section.
- `docs/KNOWN_LIMITATIONS.md` — adds section 13 **Real
  preview matching has plain-JS limits (Step 29)**.
- `docs/SMOKE_TESTS.md` — adds **Step 29 — Real Template
  Matching Engine** smoke checks (#240–#259).
- `docs/ACTION_SCHEMA.md` — notes that the `image_click`
  action preview now carries real-engine numbers (still not
  executed).
- `scripts/smoke-check.js` — adds Step-29 invariants:
  `src/template-matching-engine.js` exists,
  `docs/TEMPLATE_MATCHING_ENGINE.md` exists, all documented
  function names declared, the engine never imports
  `electron` / `ipcRenderer` / `fs` / `localStorage`, the
  engine stamps `realClick: false` and `realMatching: false`
  on every result, the action preview is rendered through
  `<pre>.textContent`, the renderer-side modules never
  require `tesseract`, `tesseract.js`, `opencv4nodejs`,
  `@u4/opencv4nodejs`, `opencv.js`, `opencv-js`, `sharp`,
  `jimp`, `pixelmatch`, `looks-same`, `robotjs`, `nut.js`,
  `iohook`, `uiohook-napi`, the diagnostics card and the
  `Copy diagnostics` line surface the new fields, and
  `package.json` STILL declares zero of the same set.
  The Step-28 line check was broadened to accept the new
  `Template matching:` prefix as well.

### Safety invariants kept (Step 29)

- `nodeIntegration: false`, `contextIsolation: true`, CSP
  unchanged.
- `simulationOnly: true`, `realActionsImplemented: false`,
  `realMatching: false`, `realClick: false`,
  `ocrImplemented: false`, `opencvAvailable: false`,
  `imageClickScenarioImplemented: false` in every status
  response, audit event, and diagnostics line.
- The engine analyses the **captured preview** — the
  `imageDataUrl` of the screenshot the user explicitly
  captured in Step 25 — never the live screen.
- The match result lives only in
  `appState.templateMatching.lastResult` (renderer memory).
  It is never written to `templates.json`, `settings.json`,
  `scenarios.json`, `profiles.json`, or `localStorage`.
- The action preview is rendered through `<pre>.textContent`.
  No HTML interpolation. The click engine, the action
  pipeline, the mock adapter, and the dry-run sandbox do
  not recognise the `image_click` action type.
- No new IPC channel is registered for matching at Step 29.
  The renderer does not gain any new privilege over the OS.
- Audit payloads carry only ids and numeric metadata.

### Added (Step 28 — Template Matching Mock / Dry-run)

- `src/template-matching-mock.js` — new pure-logic module:
  `createTemplateMatchInput(screenPreview, template, region)`
  (sanitises plain-data inputs and explicitly drops any
  `imageDataUrl` / `previewDataUrl`),
  `validateTemplateMatchInput(input)` (preview width/height > 0,
  template id + width/height > 0, optional region delegated to
  `validateRegion` with bounds inside the preview),
  `runMockTemplateMatch(input, options)`,
  `createMockMatchResult(input, options)` (deterministic
  geometry: bounding box centred on region or preview, capped to
  half the search-bound dimensions; target point = bbox center;
  confidence picked from a frozen `[0.87, 0.82, 0.91, 0.78,
  0.85, 0.89]` set by hashing the input metadata),
  `getMockTargetPoint(match)`,
  `createImageClickActionPreview(match)` (returns the planned
  `image_click` shape — `mode: "preview"`, `realClick: false`,
  `realMatching: false`),
  `clearMockMatchResult()`,
  `getLastMockMatchResult()`,
  `getTemplateMatchingMockStatus()`. The matcher is pure logic
  — it never decodes a pixel, never imports `electron` or
  `ipcRenderer`, never persists anything outside the
  module-local `_lastMockResult`.
- `src/template-matching-ui.js` — new renderer UI module driving
  the Template Matching tab:
  `openTemplateMatchingTab`, `renderTemplateMatchingTab`,
  `buildTemplateMatchInputFromState`, `runTemplateMatchingMock`,
  `clearTemplateMatchingMockResult`,
  `renderTemplateMatchingRequirements` (five-row checklist:
  screen preview / active template / region [optional] / real
  matching disabled / real click disabled; coloured markers),
  `renderTemplateMatchingInputSummary`,
  `renderTemplateMatchingResult` (mock badge + matched / confidence /
  bounding box / target point / used region / template name /
  createdAt / real-matching-disabled / real-click-disabled rows),
  `renderTemplateMatchingOverlay` (preview backdrop with the
  dashed used-region rectangle + the solid match rectangle +
  confidence badge inside the rectangle + target-point dot),
  `renderActionPreview` (planned `image_click` JSON block
  rendered via `<pre>.textContent`, never executed). All
  user-visible text via `textContent`; `innerHTML` only as
  `= ''` (container clear).
- `src/app-state.js` — new `appState.templateMatching` slice
  (`lastInput`, `lastResult`, `isRunning`, `lastError`,
  `lastRunAt`) + six mutators (`setTemplateMatchingInput`,
  `setTemplateMatchingResult`, `setTemplateMatchingRunning`,
  `setTemplateMatchingError`, `clearTemplateMatchingResult`,
  `resetTemplateMatchingState`). `getState()` deep-copies via
  `_cloneTemplateMatchInput` / `_cloneTemplateMatchResult`,
  which strip any unexpected pixel-bearing fields (defence in
  depth — the matching mock already drops them, but the slice
  enforces the invariant a second time).
- `src/audit-events.js` — five new allowlisted event types:
  `template.match.mock.requested`,
  `template.match.mock.completed`,
  `template.match.mock.failed`,
  `template.match.mock.cleared`,
  `image.click.preview.created`. Payloads carry only ids and
  numeric metadata (confidence, target X/Y, bounding-box
  width/height, `usedRegion: bool`) — never an `imageDataUrl`,
  never a thumbnail.
- `src/index.html` — adds the Template Matching tab button and
  section, and loads `template-matching-mock.js` then
  `template-matching-ui.js` before `renderer.js`. Tab list is
  now ten entries.
- `src/renderer.js` —
  - `setAdvancedTab` switch gains `case 'templateMatching'`;
  - `renderAdvancedSafety()` gains a compact
    **Template matching (mock)** diagnostics card
    (`Last run at`, `Last result`, `Confidence`, `Target point`,
    `activeTemplateId`, `Preview available`, `regionAvailable`,
    `Real matching disabled`, `Real click disabled`,
    `Real image recognition is not implemented`,
    `image_click scenario action is planned`, `lastError`);
  - `copyDiagnostics()` gains a new `Template matching mock: …`
    line (numeric / metadata only — never base64).
- `src/styles.css` — new section "Step 28 — Template Matching
  Mock / Dry-run" at the bottom: `.template-matching-mock-notice`,
  `.template-matching-actions`, `.template-matching-checklist`,
  `.template-matching-check-marker` (ok / todo / optional
  variants), `.template-matching-mock-badge`,
  `.template-matching-overlay-wrapper`,
  `.template-matching-overlay-image` (no native drag),
  `.template-matching-overlay-region` (dashed),
  `.template-matching-overlay-bbox` (solid + faint fill),
  `.template-matching-overlay-confidence` (small badge inside
  the box), `.template-matching-overlay-target` (centered dot),
  `.template-matching-action-preview-json` (monospace, max-height
  280 px), dark-theme tweaks via `[data-theme="dark"]`, mobile
  fallback at `max-width: 760px`.
- `src/i18n.js` — 27 new keys per language (RU + EN):
  `templateMatching`, `mockTemplateMatching`, `runMockMatch`,
  `clearMatchResult`, `matchResult`, `matchConfidence`,
  `boundingBox`, `targetPoint`, `usedRegion`, `actionPreview`,
  `imageClickPreview`, `realMatchingDisabled`,
  `realClickDisabled`, `mockMatchNotice`, `screenPreviewRequired`,
  `activeTemplateRequired`, `regionOptional`, `matchInputSummary`,
  `noMatchResult`, `mockMatchCompleted`, `mockMatchFailed`,
  `mockMatchCleared`, `visualMatchOverlay`,
  `realImageRecognitionNotImplemented`,
  `imageClickScenarioPlanned`, `templateMatchingDiagnostics`,
  `lastRunAt`, `lastResult`.
- `docs/TEMPLATE_MATCHING_MOCK.md` — new doc covering purpose,
  current status, why mock first, input data, mock result format,
  action preview format, what is **not** implemented, future real
  template matching, and safety notes.
- `docs/SECURITY_CHECKLIST.md` — adds **Template matching mock
  (Step 28)** section.
- `docs/KNOWN_LIMITATIONS.md` — adds section 12 **Template
  matching is mock only (Step 28)**.
- `docs/SMOKE_TESTS.md` — adds **Step 28 — Template Matching
  Mock / Dry-run** smoke checks (#222–#239).
- `docs/ACTION_SCHEMA.md` — adds the `image_click` action
  preview shape (still **not** executed).
- `docs/SCREEN_CAPTURE.md` / `docs/REGION_SELECTOR.md` /
  `docs/TEMPLATE_ASSETS.md` — cross-link to the Step 28 mock
  pipeline.
- `scripts/smoke-check.js` — adds Step-28 invariants:
  `src/template-matching-mock.js` exists,
  `src/template-matching-ui.js` exists,
  `docs/TEMPLATE_MATCHING_MOCK.md` exists, all documented
  function names declared by both modules, neither module
  imports `electron` or `ipcRenderer`, no `localStorage` use,
  no `innerHTML` on user data, `appState.templateMatching`
  slice + six mutators, audit allowlist contains the five
  new types, `index.html` wires the tab, the renderer's
  switch statement, the diagnostics card, the Copy diagnostics
  line, and `package.json` STILL declares zero of `tesseract`,
  `tesseract.js`, `opencv4nodejs`, `@u4/opencv4nodejs`,
  `opencv.js`, `sharp`, `jimp`, `pixelmatch`, `looks-same`,
  `robotjs`, `nut-js`, `nutjs`, `@nut-tree/nut-js`, `iohook`,
  `uiohook-napi`, `node-key-sender`.

### Safety invariants kept (Step 28)

- `nodeIntegration: false`, `contextIsolation: true`, CSP
  unchanged.
- `simulationOnly: true`, `realActionsImplemented: false`,
  `ocrImplemented: false`, `imageRecognitionImplemented: false`,
  `realMatching: false`, `realClick: false`,
  `matcherImplemented: false`,
  `imageClickScenarioImplemented: false` in every status
  response, audit event, and diagnostics line.
- The mock matcher is pure metadata math. It never decodes a
  pixel, never reads an image file, never compares pixels.
- The mock match result lives only in
  `appState.templateMatching.lastResult` (renderer memory). It
  is never written to `templates.json`, `settings.json`,
  `scenarios.json`, `profiles.json`, or `localStorage`.
- The action preview is rendered via `<pre>.textContent`. No
  HTML interpolation. The click engine, the action pipeline,
  the mock adapter, and the dry-run sandbox do not recognise
  the `image_click` action type.
- No new IPC channel is registered for matching at Step 28.
  The renderer does not gain any new privilege over the OS.
- Audit payloads carry only ids and numeric metadata.

### Added (Step 27 — Template Asset Manager)

- `main/template-assets.js` — new main-process module that owns
  the template asset manager. Registers six IPC handlers
  through a single `registerTemplateAssetsIpc({ ipcMain, dialog,
  getMainWindow, getUserDataPath })` entry point:
  - `templates:load` — reads `userData/templates/templates.json`,
    materialises an in-memory `previewDataUrl` for each entry
    whose image is still on disk, and returns
    `{ success, data: { templates: [...] }, corrupted: bool }`.
    Corrupt JSON quarantines the file as
    `templates.json.broken-<timestamp>` and falls back to `[]`.
  - `templates:import-image` — opens `dialog.showOpenDialog`
    with a `png/jpg/jpeg/webp` filter, re-checks the file via
    magic bytes (PNG / JPEG / WebP signatures), enforces a
    16 MiB cap, copies the bytes into
    `userData/templates/images/template-<id>.<ext>`, parses
    width/height from the file header (no pixel decoding),
    appends metadata to `templates.json`, and returns
    `{ template: {...}, previewDataUrl: "..." }`.
  - `templates:save-metadata` — updates `name` and `description`
    only. `id`, `fileName`, `mimeType`, `sizeBytes`, `width`,
    `height`, `createdAt` stay frozen.
  - `templates:delete` — removes one entry; deletes the image
    file best-effort; never throws on a missing file.
  - `templates:reset` — wipes `templates.json` and removes any
    file in `images/` whose basename starts with `template-`.
  - `templates:get-stats` — read-only diagnostics passthrough
    (`{ count, storageReady, lastError }`).
  Also exports `getTemplatesStats` for the diagnostics card and
  an `_internal` test-only handle. **No native dependencies.**
- `main.js` — wires the new module:
  `const templateAssets = require('./main/template-assets');`
  + `templateAssets.registerTemplateAssetsIpc({...})` right
  before `app.whenReady()`.
- `preload.js` — exposes the new `window.clickflow.templates`
  namespace through `contextBridge` (raw `ipcRenderer` is still
  not exposed):
  `templates: { load, importImage, saveMetadata(templateId, updates),
  delete(templateId), reset, getStats }`.
- `src/template-manager.js` — new renderer client built on top
  of the preload bridge:
  `initTemplates`, `getTemplates`, `getTemplateById`,
  `getActiveTemplate`, `setActiveTemplate`, `importTemplateImage`,
  `updateTemplateMetadata`, `deleteTemplate`, `resetTemplates`,
  `validateTemplateMetadata`, `loadTemplates`,
  `getTemplatesStats`. Validates locally (name required,
  ≤80 chars; description ≤300 chars; mime in
  `image/png|image/jpeg|image/webp`); main is the final gate.
  Never imports `electron` or `ipcRenderer`.
- `src/template-ui.js` — new renderer UI module driving the
  Templates tab:
  `openTemplatesTab`, `renderTemplatesTab`, `renderTemplateList`,
  `renderTemplateCard`, `renderActiveTemplate`,
  `openTemplateImport`, `openTemplateEdit`, `saveTemplateEdit`,
  `cancelTemplateEdit`, `deleteTemplateById`,
  `resetTemplateAssets`, `refreshTemplates`. All user-visible
  text via `textContent`; `innerHTML` only as `= ''` (container
  clear). Image previews go to `<img>.src` only.
- `src/app-state.js` — new `appState.templates` slice:
  `items`, `activeTemplateId`, `isLoading`, `lastError`. Five
  mutators: `setTemplates`, `setActiveTemplateId`,
  `setTemplatesLoading`, `setTemplatesError`,
  `resetTemplatesState`. `getState()` deep-copies the slice.
- `src/audit-events.js` — eight new allowlisted event types:
  `template.import.requested`, `template.import.completed`,
  `template.import.cancelled`, `template.import.failed`,
  `template.metadata.updated`, `template.selected`,
  `template.deleted`, `template.reset`. Payloads carry only
  template id and short metadata — never base64 / pixel data.
- `src/index.html` — adds the Templates tab button and section,
  and loads `template-manager.js` then `template-ui.js` before
  `renderer.js`. Tab list is now nine entries.
- `src/renderer.js` —
  - `setAdvancedTab` switch gains `case 'templates'`;
  - `init()` calls `await initTemplates()` after profiles;
  - `renderAdvancedSafety()` gains a compact **Image templates**
    diagnostics card (`templatesCount`, `activeTemplateId`,
    `activeTemplateName`, `templatesStorageReady`, `lastError`,
    `screenMatchingNotImplemented`, `templateMatchingPlanned`);
  - `copyDiagnostics()` gains a new `Templates: …` line
    (numeric / metadata only — never base64).
- `src/styles.css` — new section "Step 27 — Template Asset
  Manager" at the bottom: `.template-actions`,
  `.template-grid`, `.template-card`, `.template-card.selected`,
  `.template-selected-badge`, `.template-preview-box`,
  `.template-preview-image` (`max-height: 140px` so big
  templates can't stretch the layout), `.template-card-name`,
  `.template-card-description`, `.template-card-meta`,
  `.template-card-actions`, `.template-active-card`,
  `.template-empty-state`, `.template-edit-input`,
  `.template-edit-textarea`, `.template-edit-error`. Dark-theme
  tweaks via `[data-theme="dark"]`. Mobile fallback at
  `max-width: 760px`.
- `src/i18n.js` — 27 new keys per language (RU + EN):
  `templates`, `imageTemplates`, `importTemplate`,
  `resetTemplates`, `refreshTemplates`, `noTemplates`,
  `activeTemplate`, `noActiveTemplate`, `selectedTemplate`,
  `selectTemplate`, `editTemplate`, `deleteTemplate`,
  `templateName`, `templateDescription`, `originalFileName`,
  `imageSize`, `fileSize`, `createdAt`, `templateImported`,
  `templateImportCancelled`, `templateImportFailed`,
  `templateDeleted`, `templateSelected`, `templateMetadataSaved`,
  `templatesReset`, `templateSafetyNote`, `templatesDiagnostics`,
  `templatesCount`, `templatesStorageReady`,
  `templateNameRequired`, `templateNameTooLong`,
  `templateDescriptionTooLong`, `screenMatchingNotImplemented`,
  `templateMatchingPlanned`.
- `docs/TEMPLATE_ASSETS.md` — new doc covering purpose, current
  status, storage model, supported formats, metadata format,
  privacy/safety notes, what is **not** implemented, future use
  for template matching, and the planned `image_click` action.
- `docs/SECURITY_CHECKLIST.md` — adds **Template Asset Manager
  (Step 27)** section.
- `docs/KNOWN_LIMITATIONS.md` — adds **Template asset manager
  (Step 27)** section.
- `docs/SMOKE_TESTS.md` — adds **Step 27 — Template Asset
  Manager** smoke checks.
- `docs/ACTION_SCHEMA.md` — adds the planned `image_click`
  action description (still **not** implemented).
- `scripts/smoke-check.js` — adds Step-27 invariants:
  `main/template-assets.js` exists, `src/template-manager.js`
  exists, `src/template-ui.js` exists, `docs/TEMPLATE_ASSETS.md`
  exists, `preload.js` exposes `templates: { load, importImage,
  saveMetadata, delete, reset, getStats }`, `main.js` registers
  the five `templates:*` IPC handlers, `package.json` still
  declares zero OCR / OpenCV / robotjs / nut.js / iohook /
  uiohook-napi / sharp / jimp / pixelmatch / looks-same
  dependencies, and the renderer modules don't import `electron`
  or `ipcRenderer`.

### Safety invariants kept (Step 27)

- `nodeIntegration: false`, `contextIsolation: true`,
  `webPreferences.preload` — unchanged.
- CSP unchanged (`default-src 'self'`, no `unsafe-inline`, no
  `unsafe-eval`).
- `simulationOnly: true`, `realActionsImplemented: false`,
  `ocrImplemented: false`, `imageRecognitionImplemented: false`
  in every system-info / status response.
- `previewDataUrl` lives only in renderer process memory. It is
  never written to `templates.json`, `settings.json`,
  `scenarios.json`, or `profiles.json`.
- `templates.json` is metadata-only — no base64 / no pixel data.
- Image imports go through `dialog.showOpenDialog` only, with a
  `png/jpg/jpeg/webp` allow-list and a magic-bytes check.
- The renderer never sees the original chosen filesystem path —
  only the basename, stored in `originalFileName`.
- The click engine, the action pipeline, the safety gates, the
  mock adapter, and the dry-run sandbox are unchanged. **Real
  desktop clicks remain blocked.**
- Templates are stored ASSETS only. ClickFlow does **not** match
  a template against the screenshot, run OCR, or trigger any
  click on a matched location. The matcher and any
  `image_click` action are gated behind
  [`docs/REAL_ACTIONS_GO_NO_GO.md`](./docs/REAL_ACTIONS_GO_NO_GO.md).

### Added (Step 26 — Region Selector Foundation)

- `src/region-selector.js` — new pure-logic module:
  `createRegion`, `normalizeRegion`, `validateRegion`,
  `scaleRegionToImage`, `scaleRegionToPreview`, `getRegionArea`,
  `formatRegion`, `createEmptyRegionState`. No DOM, no IPC, no
  disk I/O. Sandbox-tested for swapped-corner round-tripping,
  out-of-bounds clamping, and tiny-gesture rejection.
- `src/region-selector-ui.js` — new renderer module driving the
  drag overlay above the screen-capture preview:
  `attachRegionOverlay(wrapper, img)`,
  `enable/disableRegionSelection`,
  `handleRegionMouseDown/Move/Up`,
  `renderRegionSelectorCard`,
  `renderRegionSelection`, `renderRegionInfo`,
  `clearRegionSelection`, `saveRegionSelection`,
  `attachRegionToActiveScenario`,
  `getPreviewElementSize`, `getImageOriginalSize`,
  `getPointerPositionInPreview`, `initRegionSelectorUi`.
  `mousemove` / `mouseup` are bound on `document` only for the
  duration of an active drag and detached on release. The
  overlay is inert (`pointer-events: none`) until the user
  enables selection. All user-visible text via `textContent`;
  `innerHTML` only as `= ''`.
- `src/app-state.js` — `appState.regionSelector` slice
  (`selectedRegion`, `normalizedRegion`, `isSelecting`,
  `previewSize`, `imageSize`, `lastUpdatedAt`, `lastError`)
  plus 8 mutators (`setRegionSelecting`, `setSelectedRegion`,
  `setNormalizedRegion`, `setRegionPreviewSize`,
  `setRegionImageSize`, `setRegionError`,
  `clearSelectedRegion`, `resetRegionSelectorState`).
  `getState()` deep-copies the slice.
- `src/scenario-manager.js` — `validateRegionSettings(region)`
  (treats `null`/`undefined` as valid since the field is
  optional), `updateScenarioRegion(scenarioId, region)` and
  `clearScenarioRegion(scenarioId)`. Both helpers preserve all
  unrelated `settings.*` fields, stamp `meta.updatedAt`, never
  throw, and return `{ success: true, scenario }` or
  `{ success: false, error }`. `clearScenarioRegion` is
  idempotent. Old scenarios without `settings.region` keep
  working unchanged.
- `src/audit-events.js` — 6 new allowlisted event types:
  `region.selection.started`, `region.selection.updated`,
  `region.selection.completed`, `region.selection.cleared`,
  `region.attached.toScenario`, `region.validation.failed`.
  Payloads carry only rectangle dimensions and the scenario id
  (for `attached.toScenario`). No `imageDataUrl`, no PII.
- `src/screen-capture-ui.js` — `renderScreenPreview` now wraps
  the `<img>` in `.screen-preview-wrapper` and binds the region
  overlay via `attachRegionOverlay`; `renderScreenCapture`
  appends `renderRegionSelectorCard()` after the preview card.
  `clearScreenPreview` also calls `resetRegionSelectorState()`
  so the rectangle is dropped together with the preview
  (scenario `settings.region` values are preserved on disk).
- `src/index.html` — `<script src="region-selector.js">` and
  `<script src="region-selector-ui.js">` loaded after
  `screen-capture-ui.js`, before `renderer.js`.
- `src/styles.css` — Section 18 (Region Selector):
  `.screen-preview-wrapper`, `.region-overlay` +
  `.region-overlay-enabled` / `.region-overlay-disabled`,
  `.region-selection`, `.region-coordinate-badge`,
  `.region-selector-card`, `.region-info-block`,
  `.region-info-subtitle`. Light/dark theme parity, responsive
  breakpoint at 760 px.
- `src/renderer.js` — new compact **Region selector status**
  diagnostic card in Advanced → Safety, immediately after the
  Step 25 Screen capture card. Rows: `selectedRegion`,
  `normalizedRegion`, `previewCoordinates`, `imageCoordinates`,
  `regionArea`, `attachedToScenario`, `lastUpdatedAt`,
  `lastError`. `Copy diagnostics` extended with a new
  `Region selector: selectedRegion=…, normalizedRegion=…,
  regionWidth=…, regionHeight=…, regionArea=…,
  attachedScenario=…, lastUpdatedAt=…, lastError=…,
  ocrImplemented=false, imageMatchingImplemented=false,
  realClicksImplemented=false` line.
- `docs/REGION_SELECTOR.md` — new document covering Purpose,
  Current status, How region selection works (gesture + listener
  lifecycle + idempotency), Preview vs. image coordinates,
  Scenario region settings (validation + backwards compatibility),
  What is **not** implemented yet, Future use for image matching
  / OCR (gated by safety review), Privacy / safety notes.
- 22 new RU + EN i18n keys: `regionSelector`,
  `enableRegionSelection`, `disableRegionSelection`,
  `clearRegion`, `saveRegion`, `attachRegionToScenario`,
  `selectedRegion`, `normalizedRegion`, `regionArea`,
  `noRegionSelected`, `capturePreviewFirst`,
  `regionSelectionStarted`, `regionSelectionCompleted`,
  `regionSelectionCleared`, `regionAttachedToScenario`,
  `regionValidationFailed`, `previewCoordinates`,
  `imageCoordinates`, `selectionTooSmall`,
  `regionSelectorStatus`, `attachedToScenario`,
  `clearScenarioRegion`. Parity 428/428.

### Changed (Step 26)

- `docs/SCREEN_CAPTURE.md` — new "Step 26 — Region Selector
  Foundation" link section pointing at `docs/REGION_SELECTOR.md`.
- `docs/ACTION_SCHEMA.md` — new "Optional `settings.region`
  (Step 26)" section describing the inert image-space rectangle
  on `simple_click` scenarios, validation rules
  (`validateRegionSettings`), and backwards compatibility.
- `docs/SECURITY_CHECKLIST.md` — new "Region selector (Step 26)"
  section: no real clicks, no OCR, no image recognition, no
  automatic action triggered by a region, region stored as
  numbers only, audit payloads carry no pixels, no new IPC
  channel, renderer DOM safety, backwards compatibility, no
  mobile platforms.
- `docs/KNOWN_LIMITATIONS.md` — new section 10 (Region
  selector): foundation only, single rectangle only, preview
  must exist, validation thresholds (`width > 5`, `height > 5`),
  no image matching / OCR / auto-clicks yet, no persistence by
  default.
- `docs/SMOKE_TESTS.md` — new manual checklist (#167–#188)
  including: open Advanced → Screen Capture, capture preview,
  enable region selection, draw / clear / save / attach a
  region, verify scenario JSON shape, verify backwards
  compatibility, verify diagnostics block, verify no real
  clicks while drawing.
- `scripts/smoke-check.js` — extended with Step 26 invariants.
- `README.md`, `PROJECT_CONTEXT.md` updated to step 26.

### Security (Step 26)

- The region selector never fires a click, runs OCR, or runs
  image matching. `realActionsImplemented=false` and
  `realDesktopActions=false` are unchanged.
- Nothing in the app reads `appState.regionSelector` or
  `scenario.settings.region` to trigger any side effect; the
  rectangle is metadata only.
- Region is stored as four numbers only. No `imageDataUrl`, no
  cropped pixel buffer, no on-disk file is written because of
  the region selector.
- The screen-capture preview contract from Step 25 is
  unchanged — no screenshot is persisted to disk by the
  application.
- Audit payloads carry only rectangle dimensions and the
  scenario id. No `imageDataUrl`, no PII.
- No new IPC channel — the entire region selector is renderer-
  side. `contextIsolation: true`, `nodeIntegration: false`, CSP,
  and `preload.js` not exposing raw `ipcRenderer` — all
  unchanged.

---

## [Unreleased] — Steps 15-25

Final stabilization of the simulation-only beta, design-only handoff
to the future real-input release line, the Step 17 architectural
scaffolding, the Step 18 desktop adapter interface plus mock
adapter, the Step 19 real-action sandbox with dry-run preview, the
Step 20 final beta QA pass, the Step 21 beta release packaging
pass, the Step 22 GitHub beta release finalization, the Step 23
post-pack QA and release blocker pass, the Step 24 final beta
release preparation, and the **Step 25 Screen Capture Foundation**
(new line of smart visual features — only the foundation, the
features themselves are not implemented yet). **Still
simulation-only.**

### Added (Step 25 — Screen Capture Foundation)

- `main.js` — three new IPC handlers built on Electron
  `desktopCapturer`:
  `screen-capture:list-sources`,
  `screen-capture:capture-preview`,
  `screen-capture:get-status`. Sources are normalised to a safe
  shape (`id`, `name`, `type`, `thumbnailDataUrl`, `display_id`,
  `width`, `height`, `capturedAt`) before crossing the IPC
  boundary; `sourceId` is validated by prefix (`screen:` /
  `window:`) and length; errors are mapped to generic strings;
  the handlers never throw, never write to disk, never run OCR
  or image recognition.
- `preload.js` — `window.clickflow.screenCapture` API
  (`listSources`, `capturePreview`, `getStatus`). No raw
  `ipcRenderer` is exposed.
- `src/screen-capture-client.js` — renderer-side wrapper:
  `listScreenSources`, `captureScreenPreview`,
  `getScreenCaptureStatus`, `validateScreenSource`, plus
  in-memory cache helpers (`getLastScreenCapturePreview`,
  `setLastScreenCapturePreview`, `clearScreenCapturePreview`).
  The `clearScreenCapturePreview` declaration intentionally
  unifies with the same-named app-state mutator: a single call
  clears both the cache and the state slice.
- `src/screen-capture-ui.js` — new Advanced → **Screen Capture**
  tab: header, safety notice, **Refresh sources / Capture
  preview / Clear preview** buttons, sources grid with
  thumbnails, selected source card, preview card with metadata
  (`name`, `type`, `id`, size, `capturedAt`, "Preview only"
  reminder). All user-visible text rendered with `textContent`;
  `innerHTML` used only as `= ''` (container clear).
- `src/app-state.js` — `appState.screenCapture` slice
  (`sources`, `selectedSourceId`, `preview`, `isLoading`,
  `lastError`, `lastCapturedAt`); 7 mutators:
  `setScreenCaptureSources`, `setSelectedScreenSource`,
  `setScreenCapturePreview`, `setScreenCaptureLoading`,
  `setScreenCaptureError`, `clearScreenCapturePreview`,
  `resetScreenCaptureState`. `getState()` returns a deep copy.
- `src/audit-events.js` — 6 new allowlisted event types
  (`screen.capture.sources.requested`,
  `screen.capture.sources.loaded`,
  `screen.capture.preview.requested`,
  `screen.capture.preview.created`,
  `screen.capture.preview.cleared`,
  `screen.capture.error`). Payloads carry only counts / ids /
  source types — never `imageDataUrl`.
- `src/index.html` — 8th Advanced tab `screenCapture`, new
  `#advanced-tab-screenCapture` section, scripts
  `screen-capture-client.js` and `screen-capture-ui.js` loaded
  after `i18n.js` and before `renderer.js`.
- `src/styles.css` — Section 17 (`.screen-capture-*` styles):
  sources grid auto-fill 180px, source-card hover/selected
  state, thumb max-height 110px, preview image
  `max-width: 100%; max-height: 360px`, light/dark theme
  parity, responsive breakpoint at 760px.
- `src/renderer.js` — `renderAdvancedDashboard` switch
  dispatches `screenCapture` to `renderScreenCapture()`; new
  compact **Screen capture status** diagnostic card in
  Advanced → Safety; `Copy diagnostics` extended with a
  `Screen capture: available=…, supported=…, sourcesCount=…,
  selectedSource=…, previewAvailable=…, lastCapturedAt=…,
  lastError=…, ocrImplemented=false, imageRecognitionImplemented=false,
  savesScreenshotsToDisk=false` line.
- `docs/SCREEN_CAPTURE.md` — new document describing purpose,
  current status, what works, what is **not** implemented,
  privacy model, no-disk-saving guarantee, IPC flow, future
  use for image matching / OCR (gated by safety review),
  known limitations by OS.
- 24 new RU + EN i18n keys: `screenCapture`, `refreshSources`,
  `capturePreview`, `clearPreview`, `screenSources`,
  `noScreenSources`, `selectedSource`, `noSelectedSource`,
  `screenPreview`, `noPreview`, `previewOnly`, `sourceType`,
  `sourceScreen`, `sourceWindow`, `capturedAt`,
  `captureFailed`, `sourcesLoadFailed`,
  `screenCaptureSafetyNotice`, `previewNotSaved`,
  `permissionMayBeRequired`, `screenCaptureStatus`,
  `previewAvailable`, `selectedScreenSource`, `sourcesCount`.
  Parity 406/406, no duplicates.

### Changed (Step 25)

- `docs/SECURITY_CHECKLIST.md` — new "Screen capture (Step 25)"
  section: screenshots not saved by default, screen capture
  only via IPC, no OCR, no image recognition, no real clicks,
  preview-only contract.
- `docs/KNOWN_LIMITATIONS.md` — new "Screen capture (Step 25)"
  section: permissions may vary by OS (macOS Screen Recording
  prompt, Linux Wayland Pipewire portal, Windows remote
  sessions, headless / CI), preview only, no image matching /
  OCR yet.
- `docs/SMOKE_TESTS.md` — new Step 25 row block with the manual
  walk-through (open Advanced → Screen Capture → Refresh
  sources → select → Capture preview → Clear preview, observe
  no real cursor movement, no input arrives elsewhere).
- `scripts/smoke-check.js` — extended with Step 25 invariants:
  `src/screen-capture-client.js` exists,
  `src/screen-capture-ui.js` exists,
  `docs/SCREEN_CAPTURE.md` exists,
  `preload.js` exposes `screenCapture` API,
  `main.js` registers `screen-capture:list-sources` and
  `screen-capture:capture-preview` and `screen-capture:get-status`,
  README or PROJECT_CONTEXT mentions screen capture / захват
  экрана, `package.json` declares no OCR / OpenCV / robotjs /
  nut.js / iohook / uiohook-napi / tesseract / `sharp`-based
  template matching, audit allowlist contains the 6 new types.
- README, PROJECT_CONTEXT updated to step 25.

### Security (Step 25)

- Screenshots are never persisted to disk by the application.
  The preview lives only in renderer memory.
- Screen capture is only invoked in response to a user action
  (`Refresh sources` or `Capture preview`). No background
  capture, no auto-capture at app launch.
- `contextIsolation: true`, `nodeIntegration: false`, CSP, and
  `preload.js` not exposing raw `ipcRenderer` — all unchanged.
- IPC payloads are allowlisted: only `id`, `name`, `type`,
  `thumbnailDataUrl`, `display_id`, `width`, `height`,
  `capturedAt`. No window owners, no PIDs, no filesystem paths,
  no full Electron `Display` objects.
- `realDesktopActions=false`, `simulationOnly=true`,
  `realActionsImplemented=false`, `ocrImplemented=false`,
  `imageRecognitionImplemented=false` — unchanged.

---

## [Unreleased] — Steps 15-24

Final stabilization of the simulation-only beta, design-only handoff
to the future real-input release line, the Step 17 architectural
scaffolding, the Step 18 desktop adapter interface plus mock
adapter, the Step 19 real-action sandbox with dry-run preview, the
Step 20 final beta QA pass, the Step 21 beta release packaging
pass, the Step 22 GitHub beta release finalization, the Step 23
post-pack QA and release blocker pass, and the Step 24 final beta
release preparation. **Still simulation-only.**

### Added (Step 24 — Final beta release preparation)

- `docs/FINAL_RELEASE_SUMMARY.md` — single-page release snapshot
  with sections Release / Current status / Included in this beta
  / Not included (intentional) / Safety status (six-layer table)
  / Required before publishing / Release recommendation =
  "Ready for beta pre-release after manual packaged-app QA" +
  sign-off lines.
- `docs/PRE_RELEASE_CHECKLIST.md` — the boxes the maintainer
  ticks before tagging: Repo / Static smoke / Run from source /
  Manual main flow / Packaged app / Safety invariants /
  Documentation freshness / Sign-offs / Pre-release flag /
  Result.
- `docs/RELEASE_TAG_PLAN.md` — the manual command sequence:
  pre-tag verification → optional release-prep commit → tag
  commands (`git tag -a v0.1.0-beta`, `git push origin
  v0.1.0-beta`) → publish via web UI or `gh release create
  --prerelease` → post-publication checks → hard rules
  (no automation, no force-push, no retag, no `realDesktopActions`
  flip).
- `docs/RELEASE_COMMIT_MESSAGE.md` — recommended commit title
  (`Prepare ClickFlow 0.1.0-beta release`) and body, plus an
  explicit list of **forbidden body lines** (no claims of real
  input / OCR / image recognition / mobile / `realDesktopActions`
  flip).
- IPC `system:get-release-status` extended with
  `finalReleaseSummaryPresent`, `preReleaseChecklistPresent`,
  `releaseTagPlanPresent`, `releaseCommitMessagePresent`,
  `readyForPreReleaseAfterManualQa`
  (= `readyAfterManualQa && all four step-24 docs present`).
- Renderer — **Release status** card now has 18 rows (added
  Final release summary, Pre-release checklist, Release tag
  plan, Release commit message). Bottom badge switched to
  `Ready for pre-release after manual QA` /
  `Not ready for release`.
- `Copy diagnostics` includes the new release fields.
- 7 new RU + EN i18n keys: `finalReleaseSummary`,
  `preReleaseChecklist`, `releaseTagPlan`, `readyForPreRelease`,
  `manualQaRequired`, `releaseCommitMessage`,
  `readyForPreReleaseAfterManualQa`.

### Changed (Step 24)

- `docs/RELEASE_FINAL_CHECK.md` — Documentation checks section
  references the four new docs; Release decision = "Ready for
  beta pre-release after manual packaged-app QA"; cross-references
  block extended.
- `docs/RELEASE_BLOCKERS.md` — Status updated to "No automated/
  static release blockers at this stage"; Last updated to end
  of Step 24.
- `docs/GITHUB_RELEASE_DRAFT.md` — Step 24 added to highlights;
  Feedback section gained an intro line.
- `RELEASE_NOTES.md` — closes Steps 1–24; new Step 24 section.
- `scripts/smoke-check.js` — extended from 168 to 193 checks
  with Step 24 invariants (new docs presence + content sanity
  for each, cross-references RELEASE_FINAL_CHECK → 4 new docs,
  README mentions 0.1.0-beta, RELEASE_NOTES asserts no real
  clicks, RELEASE_BLOCKERS asserts no automated/static blockers
  and manual QA required).
- README, PROJECT_CONTEXT, CHANGELOG updated to step 24.

### Verified (Step 24 — no source-level safety changes required)

- All six runtime safety layers still hard-coded false (verified
  by vm-based unit-style harness): feature flags, safety gates,
  adapter interface, adapter registry, action pipeline, sandbox
  readiness.
- `package.json` declares no `robotjs` / `nut.js` / `iohook` /
  `uiohook-napi` / `node-key-sender`.
- CSP unchanged. `contextIsolation: true`, `nodeIntegration: false`
  unchanged.
- `node --check` passes for every modified or new JS file.
- `npm run smoke` — 193 / 193 OK, exit 0.
- i18n parity: 382 ru = 382 en, 0 mismatches.

### Security (Step 24)

- New IPC fields stay inside `app.getAppPath()`. No private user
  paths flow to the renderer.
- `docs/RELEASE_COMMIT_MESSAGE.md` makes the forbidden commit
  body lines explicit, so any release-prep commit that contradicts
  the build is caught at review time.
- `docs/RELEASE_TAG_PLAN.md` re-asserts that the repository
  will not create a tag, push, or publish a release for the
  maintainer.

### Not included yet

Same as the `0.1.0-beta` baseline: no real clicks, no OCR, no
image recognition, no mobile, no cloud sync, no auto-update, no
code signing.

---

## [Unreleased] — Steps 15-23

Final stabilization of the simulation-only beta, design-only handoff
to the future real-input release line, the Step 17 architectural
scaffolding, the Step 18 desktop adapter interface plus mock
adapter, the Step 19 real-action sandbox with dry-run preview, the
Step 20 final beta QA pass, the Step 21 beta release packaging
pass, the Step 22 GitHub beta release finalization, and the
Step 23 post-pack QA and release blocker pass.
**Still simulation-only.**

### Added (Step 23 — Post-pack QA and release blocker pass)

- `docs/RELEASE_BLOCKERS.md` — 6-section release-blocker tracker
  with **status** ("Pending manual verification"), an empty
  **Blockers** table, **Non-blocking known issues** (KNI-1..7
  covering code signing, tray icon, audit persistence, CI,
  Linux hotkeys, cross-builds), **Verification notes** (smoke,
  manual QA, packaging, security, localization), and
  **Release decision** = "Ready after manual packaged-app QA".
- `docs/PACKAGED_APP_QA.md` — 16-section manual checklist for
  the packaged binary: build context / launch / main screen /
  scenarios / simulation start-stop / emergency stop / RU-EN /
  settings / import-export / advanced dashboard / diagnostics
  (with the exact `Copy diagnostics` lines to verify) / mock
  adapter self-test / dry-run sandbox / **no real clicks
  verification (mandatory)** / quit-reopen / known packaged
  issues + sign-off.
- IPC `system:get-release-status` extended with
  `releaseBlockersPresent`, `packagedAppQaPresent`,
  `packagedAppTested` (always `false` — manual-only),
  `readyAfterManualQa`.
- Renderer — **Release status** card now has 14 rows (added
  Release blockers, Packaged app QA, Packaged app tested) and
  switched its bottom badge to `Ready after manual QA` /
  `Not ready for release`.
- `Copy diagnostics` includes the new release fields.
- 7 new RU + EN i18n keys: `releaseBlockers`, `packagedAppQa`,
  `readyAfterManualQa`, `manualPackagedTestingRequired`,
  `packagedAppTested`, `noKnownReleaseBlockers`,
  `releaseBlocked`.

### Changed (Step 23)

- `docs/RELEASE_FINAL_CHECK.md` — updated to Step 23, added
  packaged-app QA gate; Release decision = "Ready for beta
  release after packaged app QA".
- `docs/TAG_AND_RELEASE_GUIDE.md` — new section "0a. Before
  creating the tag" requiring `npm run pack`, `PACKAGED_APP_QA`
  walk, no active blockers in `RELEASE_BLOCKERS.md`, and a
  warning "do not tag from a broken working tree".
- `docs/GITHUB_RELEASE_DRAFT.md` — new "Beta QA status" section
  referencing `PACKAGED_APP_QA.md` and `RELEASE_BLOCKERS.md`,
  explicit "Manual packaged-app testing recommended" and
  "No real actions are included" notices.
- `RELEASE_NOTES.md` — references manual packaged-app testing.
- `scripts/smoke-check.js` — extended from 137 to 168 checks
  with Step 23 invariants (new docs presence + content sanity,
  cross-references, `RELEASE_BLOCKERS` "Release decision",
  README/PROJECT_CONTEXT mention step 23, RELEASE_NOTES mentions
  packaged, SECURITY_CHECKLIST explicitly asserts
  `contextIsolation: true` and `nodeIntegration: false`).
- README, PROJECT_CONTEXT, CHANGELOG updated to step 23.

### Verified (Step 23 — no source-level safety changes required)

- 0 release blockers found by automated / static checks.
- All six runtime safety layers still hard-coded false (verified
  by vm-based unit-style harness): feature flags, safety gates,
  adapter interface, adapter registry, action pipeline, sandbox
  readiness.
- `package.json` declares no `robotjs` / `nut.js` / `iohook` /
  `uiohook-napi` / `node-key-sender`.
- CSP unchanged. `contextIsolation: true`, `nodeIntegration: false`
  unchanged.
- `node --check` passes for every modified or new JS file.
- `npm run smoke` — 168 / 168 OK, exit 0.
- i18n parity: 375 ru = 375 en, 0 mismatches.

### Security (Step 23)

- New IPC fields stay inside `app.getAppPath()`. No private user
  paths flow to the renderer.
- `docs/RELEASE_BLOCKERS.md` separates "blocker" from "non-blocking
  known issue" so the next reviewer sees what is intentional and
  what is not.
- `docs/PACKAGED_APP_QA.md` makes the no-real-clicks verification
  a numbered, mandatory check on the packaged binary.

### Not included yet

Same as the `0.1.0-beta` baseline: no real clicks, no OCR, no
image recognition, no mobile, no cloud sync, no auto-update, no
code signing.

---

## [Unreleased] — Steps 15-22

Final stabilization of the simulation-only beta, design-only handoff
to the future real-input release line, the Step 17 architectural
scaffolding (controlled action pipeline, safety gates, in-memory
audit events), the Step 18 desktop adapter interface plus mock
adapter, the Step 19 real-action sandbox with dry-run preview, the
Step 20 final beta QA pass, the Step 21 beta release packaging
pass, and the Step 22 GitHub beta release finalization.
**Still simulation-only.**

### Added (Step 22 — GitHub beta release finalization)

- `docs/RELEASE_FINAL_CHECK.md` — short pre-tag sign-off for the
  maintainer. Sections: Release target / Required checks / Safety
  checks / Documentation checks / Manual QA checks / Release
  decision (default: "Ready after manual verification"). Ends
  with maintainer sign-off lines (date / platform / reviewer /
  decision).
- `docs/TAG_AND_RELEASE_GUIDE.md` — manual git / GitHub command
  sequence covering: clean working tree check; `npm install`;
  `npm run smoke`; `npm start` smoke-launch; `npm run pack` /
  `npm run dist`; `git tag -a v0.1.0-beta`; `git push origin
  v0.1.0-beta`; GitHub release creation via web UI or `gh` CLI
  with `--prerelease`; post-publication checks; regression
  rollback policy. Explicit "things this guide will NEVER do for
  you" section.
- IPC `system:get-release-status` extended with `releaseTarget`
  (`"0.1.0-beta"`), `releaseFinalCheckPresent`,
  `tagAndReleaseGuidePresent`, `readyForManualRelease`
  (= `releaseDocsReady && simulationOnly && !realActionsImplemented`).
- Renderer — **Release status** card now has 12 rows (added
  Final release check, Tag and release guide) and switched its
  bottom badge to `Ready for manual release` /
  `Not ready for release`.
- `Copy diagnostics` includes the new release fields.
- `scripts/smoke-check.js` — extended from 113 to 137 checks
  (Step 22 adds presence + sanity assertions for the two new
  docs, package version `=== "0.1.0"`, RELEASE_NOTES /
  README / GITHUB_RELEASE_DRAFT mentioning `0.1.0-beta`,
  README or PROJECT_CONTEXT mentioning step 22, SECURITY_CHECKLIST
  having a "Final release security" section, KNOWN_LIMITATIONS
  mentioning "dry-run sandbox is preview-only" and "mock adapter
  only", `RELEASE_CHECKLIST.md` cross-referencing RELEASE_NOTES.md
  and GITHUB_RELEASE_DRAFT.md, etc.).
- 9 new RU + EN i18n keys: `releaseFinalization`, `releaseTarget`,
  `finalReleaseCheck`, `tagAndReleaseGuide`,
  `readyForManualRelease`, `githubReleaseDraft`, `betaPrerelease`,
  `releaseDocsReady`, `manualVerificationRequired`.

### Changed (Step 22)

- `docs/GITHUB_RELEASE_DRAFT.md` finalized — explicit "dry-run
  sandbox is preview-only" and "mock adapter only" lines added to
  "What is intentionally not included"; Authenticode warning for
  Windows installers added; Steps 1—22 referenced.
- `RELEASE_NOTES.md` finalized — closes Steps 1—22, adds
  per-step sections for 17—22, links to
  `docs/RELEASE_FINAL_CHECK.md` and `docs/SMOKE_TESTS.md` Step 22.
- `docs/SECURITY_CHECKLIST.md` — new "Final release security"
  section with 10 mandatory boxes.
- `docs/KNOWN_LIMITATIONS.md` — new section 8 (Beta release) with
  7 subsections.
- `docs/SMOKE_TESTS.md` — new "Step 22 — Release smoke sequence"
  section (#135–#150).
- README, PROJECT_CONTEXT, CHANGELOG updated to step 22.

### Verified (Step 22 — no source-level safety changes required)

- All six runtime safety layers still hard-coded false: feature
  flags, safety gates, adapter interface, adapter registry,
  action pipeline, sandbox readiness.
- `package.json` declares no `robotjs` / `nut.js` / `iohook` /
  `uiohook-napi` / `node-key-sender`.
- CSP unchanged. `contextIsolation: true`, `nodeIntegration: false`
  unchanged.
- `node --check` passes for every modified or new JS file.
- `npm run smoke` — 137 / 137 OK, exit 0.
- i18n parity: 368 ru = 368 en, 0 mismatches.

### Security (Step 22)

- New IPC `system:get-release-status` reads only inside
  `app.getAppPath()`. No private user paths flow to the
  renderer.
- `docs/RELEASE_FINAL_CHECK.md` enumerates every safety
  invariant that must be reverified before tagging.
- `docs/TAG_AND_RELEASE_GUIDE.md` makes it explicit that
  this repository will never create a tag or publish a release
  automatically — every action is manual.

### Not included yet

Same as the `0.1.0-beta` baseline: no real clicks, no OCR, no
image recognition, no mobile, no cloud sync, no auto-update, no
code signing.

---

## [Unreleased] — Steps 15-21

Final stabilization of the simulation-only beta, design-only handoff
to the future real-input release line, the Step 17 architectural
scaffolding (controlled action pipeline, safety gates, in-memory
audit events), the Step 18 desktop adapter interface plus mock
adapter, the Step 19 real-action sandbox with dry-run preview, the
Step 20 final beta QA pass, and the Step 21 beta release packaging
pass. **Still simulation-only.**

### Added (Step 21 — Beta release packaging pass)

- `.gitignore` (new) — covers `node_modules/`, `dist/`, `out/`,
  `build/`, `release/`, `*.log`, OS junk (`.DS_Store`, `Thumbs.db`),
  IDE caches, `.env*`, `userData/`, `*.broken-*`, and local
  `clickflow-*-*.json` backup files.
- `docs/RELEASE_CHECKLIST.md` — 9-section release checklist
  (pre-release / security / simulation-only / packaging /
  documentation / localization / manual QA / GitHub release /
  post-release).
- `docs/BUILD_ARTIFACTS.md` — what `npm run pack` / `npm run dist`
  produce, GitHub release naming scheme, what must NOT ship,
  how to verify each artifact before upload.
- `docs/GITHUB_RELEASE_DRAFT.md` — ready-to-paste release body
  for the `v0.1.0-beta` pre-release.
- `docs/VERSIONING.md` — semver approach, future release lines,
  hard rule for real-input gating.
- New IPC `system:get-release-status` (read-only, reads only
  `app.getAppPath()`, never returns private paths). Surfaces
  `appVersion`, `beta`, `simulationOnly`, `realActionsImplemented`,
  `smokeCheckScript`, `packagingConfigured`,
  `releaseChecklistPresent`, `buildArtifactsPresent`,
  `githubReleaseDraftPresent`, `versioningPresent`,
  `changelogPresent`, `releaseNotesPresent`, `gitignorePresent`,
  `releaseDocsReady`.
- Renderer — Advanced → Safety has a new **Release status** card
  with 12 rows (app version, beta, simulation only, real actions
  not included, smoke-check script, packaging configured, release
  checklist, build artifacts, GitHub release draft, versioning,
  CHANGELOG, RELEASE_NOTES) plus a final readiness badge
  (`Ready for beta release` / `Not ready for release`).
- `Copy diagnostics` now includes a `Release:` line.
- 19 new RU + EN i18n keys (`releaseStatus`, `betaVersion21`,
  `smokeCheckScript`, `packagingConfigured`,
  `releaseChecklistPresent`, `changelogPresent`,
  `releaseNotesPresent`, `githubReleaseDraftPresent`,
  `buildArtifacts`, `releaseReady`, `releaseNotReady`,
  `betaRelease`, `simulationOnlyRelease`,
  `realActionsNotIncluded`, `packagingDocs`, `versioning`,
  `present`, `absent`).

### Changed (Step 21)

- `package.json` — extended `build.files` array to include
  `assets/**/*`, `docs/**/*`, README/PROJECT_CONTEXT/CHANGELOG/
  RELEASE_NOTES/CONTRIBUTING.md, with explicit exclusions
  `!**/*.broken-*`, `!**/.DS_Store`, `!**/Thumbs.db`, `!**/.git`,
  `!**/.gitignore`. Added `directories.output: "dist"`. Added
  `mac.category: public.app-category.utilities` and
  `linux.category: Utility`. **Version stays `0.1.0`.**
- `scripts/smoke-check.js` — extended from 96 to 113 checks:
  `.gitignore` covers `node_modules` / `dist` / `.DS_Store` /
  `Thumbs.db` / `*.log`; `package.json` declares `scripts.pack`
  and `scripts.dist`; `electron-builder` is a devDependency;
  `build.appId`, `build.productName`, `build.files`,
  `build.directories.output`, `build.directories.buildResources`
  all set; all 4 new release docs exist; README or
  PROJECT_CONTEXT mentions step 21; `RELEASE_NOTES.md` mentions
  simulation-only; `RELEASE_CHECKLIST.md` and
  `GITHUB_RELEASE_DRAFT.md` assert simulation-only and no real
  clicks / OCR / image recognition.
- README + PROJECT_CONTEXT updated to step 21.

### Verified (Step 21 — no source-level changes required)

- `package.json` declares no `robotjs` / `nut.js` / `iohook` /
  `uiohook-napi` / `node-key-sender`.
- All six runtime safety layers still hard-coded false: feature
  flags, safety gates, adapter interface, adapter registry,
  action pipeline, sandbox readiness.
- CSP unchanged. `contextIsolation: true`, `nodeIntegration: false`
  unchanged.
- `node --check` passes for every modified or new JS file.
- `npm run smoke` — 113 / 113 OK, exit 0.

### Security (Step 21)

- New IPC reads only from `app.getAppPath()`. No private user
  paths flow to the renderer.
- New `.gitignore` patterns prevent accidental commits of broken
  JSON quarantines and local user backups.
- Build `files` array explicitly excludes `*.broken-*` and OS
  junk so they cannot leak into a packaged binary.
- `RELEASE_CHECKLIST.md` enumerates every safety invariant that
  must be reverified before tagging.

### Not included yet

Same as the `0.1.0-beta` baseline: no real clicks, no OCR, no
image recognition, no mobile, no cloud sync, no auto-update, no
code signing.

---

## [Unreleased] — Steps 15-20

Final stabilization of the simulation-only beta, design-only handoff
to the future real-input release line, the Step 17 architectural
scaffolding (controlled action pipeline, safety gates, in-memory
audit events), the Step 18 desktop adapter interface plus mock
adapter, the Step 19 real-action sandbox with dry-run preview, and
the Step 20 final beta QA and bugfix pass.
**Still simulation-only.**

### Added (Step 20 — Final beta QA and bugfix pass)

- `docs/BETA_QA_REPORT.md` — final QA report with sections
  Scope / What was checked / Smoke-check status / Manual test
  status / Security status / Localization status / Known issues
  / Blockers / Release recommendation. Recommendation:
  **Ready for beta after manual testing.**
- `docs/I18N_CHECKLIST.md` — manual RU / EN review checklist
  covering language switch, main screen, scenarios, settings,
  Advanced dashboard tabs, forms, errors, diagnostics, sandbox,
  and "no mixed language" guard.
- `docs/SMOKE_TESTS.md` — new "Step 20 — Final beta QA checklist"
  section with end-to-end manual tests #115–#134 (npm install /
  smoke / start / scenarios / simulation / emergency stop /
  language / advanced dashboard / diagnostics / adapter
  self-test / dry-run / corrupted JSON / DevTools real-mode
  blocked / diagnostics line).
- `docs/MVP_CHECKLIST.md` — new section 20 documenting all
  Step 20 verification results.
- `scripts/smoke-check.js` — five new structural checks
  (now 96 total, exit 0):
  - `preload.js does not expose ipcRenderer directly` (regex check
    that ignores the import line and looks for `ipcRenderer:` or
    `ipcRenderer,` in the contextBridge expose call).
  - `all <script src="…"> in index.html resolve on disk` (parses
    every `<script src="...">` and confirms the file exists under
    `src/` and is not a remote URL).
  - `Step 20 doc exists: docs/BETA_QA_REPORT.md`.
  - `Step 20 doc exists: docs/I18N_CHECKLIST.md`.
  - `README or PROJECT_CONTEXT mentions step 20`.

### Changed (Step 20)

- `docs/MVP_CHECKLIST.md` and `docs/SMOKE_TESTS.md` headers
  updated to "Step 20 — Final beta QA and bugfix pass".
- `README.md`, `PROJECT_CONTEXT.md` updated to Step 20.

### Verified (Step 20 — no code changes required)

- 0 duplicate DOM ids in `src/index.html`.
- 0 missing references — every `getElementById(...)` in
  `src/renderer.js` resolves.
- 0 forbidden runtime modules — `package.json` and source files
  declare no `robotjs` / `nut.js` / `iohook` / `uiohook-napi` /
  `node-key-sender`.
- All 9 `innerHTML` assignments in `src/renderer.js` are `= ''`
  (clear-only).
- 342 keys in `ru` = 342 keys in `en` in `src/i18n.js`.
  All 55 `data-i18n` attributes in `src/index.html` resolve in
  both locales. All 220 `t()` calls in source resolve in both
  locales.
- Adapter self-test passes 4 / 4 (vm-based unit-style harness).
- Sandbox dry-run preview never sets `realExecution: true` and
  caps preview at 10 with `truncated` flag for long scenarios.
- Pipeline block message for `executionMode: "real"` is
  `Real desktop actions are disabled. Dry-run preview is
  available only.`
- Pipeline `executionMode: "dry-run"` returns
  `{ ok: true, mode: "dry-run", simulated: false,
  realExecution: false, blocked: false }`.
- Corrupted-JSON fallback verified in temp-dir harness:
  missing → `{ success: true, data: null, corrupted: false }`;
  valid → parsed; corrupt → renamed to
  `<file>.broken-<timestamp>` and `{ success: true, data: null,
  corrupted: true }`.

### Security (Step 20)

- All six independent layers (feature flags, safety gates,
  adapter interface, adapter registry, action pipeline, sandbox
  readiness) verified to refuse real input both at source level
  (smoke check) and at runtime (vm harness).
- `preload.js` does not expose `ipcRenderer`. The renderer never
  receives a raw `ipcRenderer`. Verified by smoke check.
- CSP unchanged. `contextIsolation: true`, `nodeIntegration: false`
  unchanged.

---

## [Unreleased] — Steps 15-19

Final stabilization of the simulation-only beta, design-only handoff
to the future real-input release line, the Step 17 architectural
scaffolding (controlled action pipeline, safety gates, in-memory
audit events), the Step 18 desktop adapter interface plus mock
adapter, and the Step 19 real-action sandbox with dry-run preview.
**Still simulation-only.**

### Added (Step 19 — real-action sandbox / dry-run preview)

- `src/real-action-sandbox.js` — read-only preview module:
  - `getSandboxStatus()` returns
    `{ simulationOnly: true, realActionsImplemented: false,
    realActionsAllowed: false, dryRunAvailable: true, ... }`.
  - `evaluateRealActionReadiness(settings, flags)` — **always**
    returns `{ allowed: false, ... }` in 0.1.x.
  - `getRealActionBlockedReasons(settings, flags)` — 7 stable ids
    (`realDesktopActionsFlagDisabled`, `simulationOnlyEnabled`,
    `realAdapterNotInstalled`, `osPermissionsNotVerified`,
    `finalSafetyReviewNotPassed`, `auditPersistenceNotImplemented`,
    `realActionsIntentionallyDisabled`).
  - `createPermissionChecklist(settings, flags)` — 11 items with
    `ready / missing / planned / blocked` status.
  - `createDryRunPlan(scenario, actions, settings)` — description
    only. Capped at 10 preview items; reports `truncated`.
  - `createRealActionPreview()`, `confirmDryRunPlan(plan)`,
    `cancelDryRunPlan(plan)` — sandbox lifecycle, **all return
    `realExecution: false`**.
- `src/action-pipeline.js` — added `executeDryRunAction()` for
  `executionMode === "dry-run"`. The block message for
  `executionMode === "real"` is now
  `Real desktop actions are disabled. Dry-run preview is available only.`
- `src/audit-events.js` — allowlist gained six sandbox event types:
  `real.sandbox.preview.created`,
  `real.sandbox.dryrun.confirmed`,
  `real.sandbox.dryrun.cancelled`,
  `real.sandbox.blocked`,
  `real.permission.checklist.created`,
  `real.blocked.reason.generated`.
- Renderer — Advanced → Safety has a new **Real action sandbox**
  card and an inline **Dry-run preview** panel (action list capped
  at 10 with "First actions shown" hint, permission checklist,
  blocked reasons, Confirm / Cancel buttons).
- `Copy diagnostics` includes a new `Sandbox:` line.
- `src/index.html` loads `real-action-sandbox.js` after
  `adapter-registry.js` and before `action-pipeline.js`.
- `scripts/smoke-check.js` — verifies the new file and doc, that
  `getSandboxStatus()` reports `realActionsAllowed: false`,
  `dryRunAvailable: true`; that
  `evaluateRealActionReadiness()` returns `allowed: false`; that
  `confirmDryRunPlan` never sets `realExecution: true`; that the
  audit allowlist contains all six new event types; that
  README/PROJECT_CONTEXT mentions dry-run/sandbox; that the
  pipeline block message mentions dry-run preview.
- `docs/REAL_ACTION_SANDBOX.md` — new dedicated document.
- 28 new RU + EN i18n keys covering the sandbox UI surfaces.

### Changed (Step 19)

- `src/action-pipeline.js` — `dry-run` mode now takes priority
  over the simulate path; both paths still never reach any OS
  API. The block message is updated.
- `src/audit-events.js` — six new types added to the frozen
  allowlist; everything else unchanged.
- Docs updated: `DESKTOP_ADAPTER_PLAN` (§1.7),
  `REAL_ACTIONS_GO_NO_GO` (§0ter), `AUDIT_LOG_PLAN`
  (in-memory model now also covers sandbox events),
  `ACTION_SCHEMA` (preview ≠ execution),
  `SECURITY_CHECKLIST`, `SMOKE_TESTS` (#0j, #0k, #101–#114),
  `MVP_CHECKLIST` (§19), README, PROJECT_CONTEXT.

### Security (Step 19)

- The sandbox is read-only with respect to the OS. Six layers
  (feature flags, safety gates, adapter interface, adapter
  registry, action pipeline, sandbox readiness) all independently
  refuse real input.
- `evaluateRealActionReadiness()` is hard-coded to deny. The
  reference predicate is preserved in a comment but is unreachable
  in 0.1.x.
- Sandbox event payloads carry only ids, counts, and small enums.
  No PII, no filesystem paths.
- `package.json` still declares no `robotjs` / `nut.js` / `iohook` /
  `uiohook-napi` / `node-key-sender`. Verified by `npm run smoke`.
- `node --check` passes for every new and modified file.
- `npm run smoke` passes (existing tests still green, new Step 19
  rows green).

---

## [Unreleased] — Steps 15-18

Final stabilization of the simulation-only beta, design-only handoff
to the future real-input release line, the Step 17 architectural
scaffolding (controlled action pipeline, safety gates, in-memory
audit events), and the Step 18 desktop adapter interface plus
mock adapter. **Still simulation-only.**

### Added (Step 18 — desktop adapter interface, mock adapter, registry)

- `src/desktop-adapter-interface.js` — adapter contract.
  `getAdapterContract()` returns
  `{ version: 1, supportedActions: ["click"], realActionsAllowed: false,
  simulationOnly: true, requiresMainProcess: true,
  requiresUserConfirmation: true, requiresEmergencyStop: true }`.
  Helpers: `getSupportedAdapterActions()`, `validateAdapterAction(action)`,
  `normalizeAdapterAction(action)`, `createAdapterResult(success, data, error)`.
  `isRealAdapterAllowed(flags, settings)` is **hard-coded `false`**.
- `src/mock-desktop-adapter.js` — the only `available: true`
  adapter. `getMockAdapterInfo()`, `checkMockAdapterAvailability()`,
  `executeMockAction(action, context)` (validate → emit
  `adapter.mock.executed` → return structured result),
  `runMockAdapterSelfTest()` (4 pure-JS checks; emits
  `adapter.selftest.started` and either
  `adapter.selftest.completed` or `adapter.selftest.failed`),
  `getMockAdapterStatus()`. **No OS input.**
- `src/adapter-registry.js` — registry of adapters with the mock
  active by default. `getAvailableAdapters`, `getAdapterById`,
  `getActiveAdapter`, `setActiveAdapter`, `getAdapterRegistryStatus`,
  `runActiveAdapterSelfTest`, `isRealAdapterRegistered`,
  `isRealAdapterAvailable`. `setActiveAdapter("real-desktop")`
  returns `{ success: false, blocked: true, error:
  "Real desktop actions are not implemented in this build" }` and
  emits `adapter.selection.blocked` plus `adapter.real.unavailable`.
- `src/action-pipeline.js` — simulate path now routes through the
  active adapter. Mock adapter calls `executeMockAction()`. The
  pipeline still rejects any real-action attempt via
  `blockRealAction()`. The legacy `executeSimulatedAction()`
  remains as a fallback.
- `src/audit-events.js` — allowlist gained six new types:
  `adapter.selftest.started`, `adapter.selftest.completed`,
  `adapter.selftest.failed`, `adapter.selection.blocked`,
  `adapter.mock.executed`, `adapter.real.unavailable`.
- Renderer — Advanced → Safety has a new **Desktop adapter status**
  card with rows for active adapter, mock available, real
  available, real registered, real actions allowed, simulation
  only, last self-test result, and a **Run adapter self-test**
  button. `Copy diagnostics` includes a new `Adapter:` line.
- `src/index.html` loads `desktop-adapter-interface.js`,
  `mock-desktop-adapter.js`, and `adapter-registry.js` between
  `safety-gates.js` and `action-pipeline.js`.
- `scripts/smoke-check.js` — verifies new files and source-level
  invariants: registry contents (mock + real-desktop, the latter
  unavailable / planned with the disabled reason), block messages,
  audit allowlist (all six adapter types), mock adapter flags,
  adapter interface contract.
- `docs/ADAPTER_INTERFACE.md` — new dedicated document.
- 21 new i18n keys in RU and EN: `desktopAdapterStatus`,
  `activeAdapter`, `mockAdapter`, `realDesktopAdapter`,
  `mockAdapterAvailable`, `realAdapterAvailable`,
  `realAdapterRegistered`, `realActionsAllowed`,
  `runAdapterSelfTest`, `adapterSelfTestStarted`,
  `adapterSelfTestCompleted`, `adapterSelfTestFailed`,
  `adapterSelectionBlocked`, `adapterMockExecuted`,
  `adapterRealUnavailable`, `lastSelfTestResult`,
  `selfTestPassed`, `selfTestFailed`, `realAdapterDisabledReason`,
  `mockModeOnly`, `selfTestNeverRun`.

### Changed (Step 18)

- `src/action-pipeline.js` simulate path goes through the active
  adapter. Defensive: even if the active adapter ever claimed
  `realActions: true`, the pipeline still calls `blockRealAction()`.
- `src/audit-events.js` allowlist extended; everything else
  unchanged (capacity 500, defensive copies, `getAuditSummary()`).
- `docs/DESKTOP_ADAPTER_PLAN.md` — new section 1.6.
- `docs/REAL_ACTIONS_GO_NO_GO.md` — new section 0bis "What step 18
  changed". Real adapter remains No-Go.
- `docs/ACTION_SCHEMA.md` — Step 18 update note.
- `docs/SECURITY_CHECKLIST.md` — five new Step 18 rows.
- `docs/SMOKE_TESTS.md` — tests #0h, #0i, and #93–#100.
- `docs/MVP_CHECKLIST.md` — section 18.
- README + PROJECT_CONTEXT updated to step 18.

### Security (Step 18)

- Four independent layers must reject real input — feature flags,
  safety gates, adapter interface, adapter registry, action
  pipeline. Each is hard-coded false / blocked. None can be flipped
  by a user-facing path.
- The mock adapter never imports Node modules and never calls any
  OS API. Verified by `node --check` and a vm-based unit-style
  harness.
- `package.json` still declares no `robotjs` / `nut.js` / `iohook` /
  `uiohook-napi` / `node-key-sender`. Verified by `npm run smoke`.
- The audit allowlist remains a fixed set; the new adapter event
  payloads carry only ids and small enums — no PII, no paths.

---

## [Unreleased] — Steps 15-17

Final stabilization of the simulation-only beta, design-only handoff
to the future real-input release line, and the Step 17 architectural
scaffolding (controlled action pipeline, safety gates, in-memory
audit events). **Still simulation-only.**

### Added (Step 17 — controlled action pipeline)

- `src/action-pipeline.js` — central `executeAction(action, context)`
  used by the click-engine. Validates the action schema, evaluates
  safety, and dispatches to `executeSimulatedAction()` for the
  simulate path. Any caller with `executionMode === "real"` is
  rejected by `blockRealAction()` with the explicit error
  `Real desktop actions are disabled in this build` and an
  `action.real.blocked` audit event. `canExecuteRealAction()` is
  hard-coded `false`. `getActionPipelineStatus()` returns
  `{ simulationOnly: true, realActionsEnabled: false,
  realActionsImplemented: false, pipelineReady: true }`.
- `src/safety-gates.js` — central safety predicates:
  `getSafetyGateStatus`, `validateScenarioSafety`,
  `validateActionSafety`, `getRealActionRequirements` (9-item
  contract), `getMissingRealActionRequirements`,
  `isSimulationAllowed` (true for valid settings),
  `isRealActionAllowed` (always `false`).
- `src/audit-events.js` — in-memory audit event model with a fixed
  allowlist of types
  (`scenario.start.requested`, `scenario.start.approved`,
  `scenario.stop.requested`, `scenario.completed`,
  `emergency.stop`, `action.simulated`, `action.real.blocked`,
  `safety.validation.failed`, `settings.changed`,
  `import.completed`, `export.completed`). Capacity-bounded
  ring (500 events). `createAuditEvent`, `addAuditEvent`,
  `recordAuditEvent`, `getAuditEvents`, `clearAuditEvents`,
  `getAuditSummary`. **No file persistence in this step.**
- `click-engine.js` — every iteration now dispatches through
  `executeAction()` from the pipeline. The legacy
  `simulateClick()` is preserved as a thin wrapper for backward
  compatibility. `validateRunnableScenario` failures emit
  `safety.validation.failed`.
- Renderer audit instrumentation at start, approved-start, stop,
  completed, emergency-stop, import, export, and settings change.
- Advanced → Safety: new cards **Action pipeline**, **Safety gates**,
  **Real actions readiness** (9-row checklist), **Audit events**
  (count + last event). New explicit warning
  "Real desktop actions are disabled. ClickFlow still runs in
  simulation mode only."
- `Copy diagnostics` now includes `Action pipeline:`,
  `Safety gates:`, and `Audit events:` lines.
- `scripts/smoke-check.js` — verifies the new files exist and that
  source-level invariants hold:
  `simulationOnly: true`, `realActionsEnabled: false`,
  `realActionsImplemented: false`, the explicit block message,
  `isRealActionAllowed` returning `false`, and
  `realDesktopActions: false`. `uiohook-napi` added to the
  forbidden-modules list.
- 22 new i18n keys (RU + EN): `realActionsReadiness`,
  `realActionsDisabled`, `simulationOnlyBuild`,
  `realActionsImplemented`, `realActionsFeatureFlag`,
  `desktopAdapterNotInstalled`, `osPermissionsNotChecked`,
  `finalSafetyReviewNotPassed`, `actionPipeline`, `pipelineReady`,
  `realActionsEnabled`, `realActionAllowed`, `missingRequirements`,
  `safetyGates`, `auditEvents`, `auditEventsCount`,
  `lastAuditEvent`, `realDesktopActionsDisabledNotice`,
  `actionRealBlocked`, `safetyValidationFailed`, plus
  `notImplemented`, `notInstalled`, `notChecked`, `notPassed`.
- Docs updated: `docs/REAL_ACTIONS_GO_NO_GO.md` (new "What step
  17 changed" section), `docs/DESKTOP_ADAPTER_PLAN.md` (new
  "Step 17 preparation" section), `docs/AUDIT_LOG_PLAN.md`
  (in-memory model now live), `docs/ACTION_SCHEMA.md` (validation
  centralized), `docs/SECURITY_CHECKLIST.md` (new Step 17 rows),
  `docs/SMOKE_TESTS.md` (#0f, #0g, #78–#92). README and
  PROJECT_CONTEXT updated to step 17.

### Changed (Step 17)

- `src/click-engine.js` calls `executeAction()` instead of the
  direct `simulateClick()` body. Behavior preserved.
- `src/index.html` loads `audit-events.js`, `safety-gates.js`, and
  `action-pipeline.js` between `feature-flags.js` and the manager
  modules.
- Smoke check now also verifies that `package.json` does not
  declare `uiohook-napi` and prints the Step 17 invariant rows.

### Security (Step 17)

- The pipeline is the only path to fire any action. There is no
  source-level escape hatch from the simulate path.
- The `isRealActionAllowed()` predicate is hard-coded false; the
  `realDesktopActions` flag is hard-coded false; the pipeline
  rejects `executionMode === "real"`. All three layers must be
  flipped — and the requirements in `REAL_ACTIONS_GO_NO_GO.md`
  must be met — before any real action could run.
- The audit event allowlist is fixed and contains no PII fields.
  Payloads are bounded to safe ids and small enums.
- `node --check` passes for every new file.
- `npm run smoke` passes (existing tests still green, new Step 17
  rows green).

---

## [Unreleased] — Steps 15-16

Final stabilization of the simulation-only beta and design-only handoff
to the future real-input release line. **Still simulation-only.**

### Added

- **Final stabilization** (Step 15)
  - `scripts/smoke-check.js` — dependency-free static smoke check
    that verifies file presence, security flags, CSP, package.json
    wiring, and the absence of forbidden real-input modules.
  - `npm run smoke` script.
  - `scripts/README.md` describing the rules for repo helper scripts.
  - `docs/FINAL_BETA_REVIEW.md` — single-page go/no-go review for the
    `v0.1.0-beta` GitHub pre-release.
  - **Beta health** card in Advanced → Safety, showing
    `simulationOnly`, `realClicksImplemented`, `ocrImplemented`,
    `imageRecognitionImplemented`, `docsReady`, `packagingConfigured`,
    `securityChecklistPresent`, `actionSchemaPresent`.
  - New IPC handler `system:get-beta-health` (read-only, looks up
    docs presence inside the app installation only — never user paths).
  - **Corrupted-JSON guard** in main.js: `scenarios.json`,
    `settings.json`, `profiles.json` loaders quarantine unparseable
    files as `<file>.broken-<timestamp>` and fall back to defaults
    without crashing. Renderer surfaces a localized warning log and
    a `CORRUPT_*_JSON` entry in the error history.
  - Smoke-tests #54-#77 covering Beta health, feature flags, next
    safety milestone, corrupted-JSON behavior, reset / import
    failures, and final no-real-clicks verification.

- **Handoff to next branch** (Step 16)
  - `src/feature-flags.js` — frozen safe defaults
    (`realDesktopActions: false`, `ocr: false`, `imageRecognition: false`,
    `simulationOnly: true`, `globalHotkeys: true`, `profiles: true`,
    `importExport: true`). Helpers `getFeatureFlags()`,
    `isFeatureEnabled()`, `getFeatureFlagsForDiagnostics()`. **No UI
    can flip safety-sensitive flags.**
  - **Feature flags** card in Advanced → Safety.
  - **Next safety milestone** card in Advanced → Future
    (final safety review, adapter availability check, global
    emergency stop verified, audit logs planned, user confirmation
    flow — all `Planned`; `Real mode disabled` is `Ready`).
  - `Copy diagnostics` now includes a `Feature flags` line and a
    `Beta health` line.
  - `docs/REAL_ACTIONS_GO_NO_GO.md` — mandatory checklist before any
    real-input shipping.
  - `docs/FEATURE_FLAGS.md` — runtime flag layer documentation.
  - `docs/AUDIT_LOG_PLAN.md` — design-only audit log plan.
  - `docs/PRIVACY.md` — single-page privacy policy.
  - 25 new i18n keys in RU and EN: `betaHealth`, `docsReady`,
    `packagingConfigured`, `securityChecklistPresent`,
    `actionSchemaPresent`, `realClicksImplemented`, `ocrImplemented`,
    `imageRecognitionImplemented`, `featureFlags`,
    `nextSafetyMilestone`, `finalSafetyReview`,
    `adapterAvailabilityCheck`, `globalEmergencyStopVerified`,
    `userConfirmationFlow`, `realModeDisabled`,
    `corruptedDataFallback`, `resetCompleted`, `smokeCheck`,
    `flagDisabled`, `flagEnabled`, plus the supporting labels.

### Changed

- `package.json` — added `scripts.smoke = node scripts/smoke-check.js`.
  **Version stays `0.1.0`.**
- `src/index.html` — loads `feature-flags.js` before `renderer.js`.
- `main.js` — `scenarios:load`, `settings:load`, `profiles:load`
  now route through a single `safeLoadJsonFile` helper.
- `src/scenario-manager.js`, `src/profile-manager.js`,
  `src/settings-manager.js` — track corruption fallback and expose
  it to the renderer init.
- `docs/MVP_CHECKLIST.md` and `docs/SMOKE_TESTS.md` extended.

### Security

- New IPC `system:get-beta-health` is read-only, reads only from
  `app.getAppPath()`, and never returns absolute filesystem paths
  to the renderer.
- Feature flags object is `Object.freeze`-d. There is no mutation
  path, no IPC mutation, no setting persistence for the
  safety-sensitive flags.
- Corrupted JSON files are **renamed**, not deleted, so a user can
  forensically inspect what went wrong without losing data.
- CSP unchanged. `contextIsolation: true`, `nodeIntegration: false`
  unchanged.

### Not included yet

Same as the `0.1.0-beta` baseline: no real clicks, no OCR, no image
recognition, no mobile, no cloud sync, no auto-update, no code
signing.

---

## [0.1.0-beta] — 2026-05-28

First public beta of ClickFlow. Safe MVP with simulation execution,
scenarios, settings, profiles, advanced dashboard, global hotkeys,
packaging configuration, and full RU/EN localization.

### Added

- **Beta polish** (Step 13)
  - "Simulation mode" / "Режим имитации" badge on the main screen.
  - Version badge on the main screen, populated via `window.clickflow.version`.
  - Animated status indicator (running pulse).
  - Re-organized `styles.css` into 16 numbered sections with a full
    design-token system: spacing scale, radius scale, shadow scale,
    focus ring, transitions.
  - New badge classes: `.badge`, `.badge-simulation`, `.badge-version`,
    `.badge-safe`, `.badge-warning`.
  - Polished forms: focus-ring via `box-shadow`, disabled state,
    `is-invalid` class hook, placeholder color, hint helper class.
  - Polished advanced dashboard: better tab state, card shadows,
    log filter chips, responsive grid for 1000x700 windows.
  - Responsive layout breakpoints at 880px and 760px.
  - Re-worked dark theme: full token override and per-component fixes
    (forms, badges, dashboard, scenario cards, profiles, hints,
    progress, log entries).
  - `assets/` directory with `assets/README.md`, `assets/icons/README.md`
    and a local minimal `assets/icons/clickflow-icon.svg`.

- **Release preparation** (Step 14)
  - This `CHANGELOG.md`.
  - `RELEASE_NOTES.md` with summary, what works, safety model,
    known limitations, how to run, how to test, what is not implemented,
    and next steps.
  - `CONTRIBUTING.md` with run instructions, architecture, security
    rules, RU/EN policy, IPC rules and the safety review gate for any
    real-input work.
  - GitHub templates:
    - `.github/ISSUE_TEMPLATE/bug_report.md`
    - `.github/ISSUE_TEMPLATE/feature_request.md`
    - `.github/ISSUE_TEMPLATE/safety_report.md`
    - `.github/pull_request_template.md`
  - `docs/BETA_TESTING_GUIDE.md`.
  - `docs/KNOWN_LIMITATIONS.md`.
  - `docs/ROADMAP.md`.
  - 15 new i18n keys (RU/EN): `beta`, `release`, `betaVersion`,
    `simulationBadge`, `safeBadge`, `readyStatus`, `appReady`,
    `packagingStatus`, `knownLimitations`, `roadmap`, `releaseNotes`,
    `changelog`, `contributing`, `noRealClicks`, `simulationOnlyShort`.

- **From earlier steps (cumulative summary)**
  - Electron app shell with `contextIsolation: true` and
    `nodeIntegration: false`.
  - Minimal main menu, scenarios CRUD, simulation `click-engine`,
    progress UI, Stop / Emergency Stop.
  - Settings, themes (system / light / dark), safe mode, safety
    limits (min interval, max repeats).
  - Localization RU / EN.
  - Advanced dashboard with 7 tabs (Overview, Scenarios, Execution,
    Logs, Settings, Safety, Future).
  - Import / export, backup, profiles.
  - `error-manager`, diagnostics, copy-diagnostics-to-clipboard.
  - Global hotkeys via `globalShortcut`
    (CmdOrCtrl+Alt+S / X / E), application menu, tray, lifecycle
    quit confirmation.
  - `electron-builder` configuration and packaging documentation.

### Changed

- `package.json` description clarified, `keywords` array added,
  `repository` field added. **Version remains `0.1.0`.**
- `index.html` main-screen header now renders a badge row.
- Renderer `init()` sets the version badge via `textContent` (safe).

### Security

- All user-provided data is rendered via `textContent`. The remaining
  `innerHTML` calls are only used to **clear** containers (`= ''`).
- No `eval`, no remote scripts, no dynamic `<script>` injection.
- CSP `default-src 'self'; script-src 'self'; style-src 'self';`
  is unchanged.
- No private filesystem paths are exposed in diagnostics or in the
  copy-diagnostics output.

### Not included yet

ClickFlow `0.1.0-beta` is **simulation-only**. The following are
intentionally **not** implemented in this release:

- Real system clicks (no `robotjs`, no `nut.js`, no `iohook`,
  no kernel-level injection).
- OCR / text recognition.
- Image recognition / OpenCV.
- Mobile version.
- Cloud sync.
- Auto-update.
- Code signing for installers.
- Captcha / antibot bypass — **out of scope, ever**.
- Ad-click automation, banking, payment, or other protected
  applications — **out of scope, ever**.

See `docs/KNOWN_LIMITATIONS.md` and `docs/ROADMAP.md`.

---

## Step history (development log)

| Step | Theme | Highlights |
|------|-------|------------|
| 1 | Bootstrap | Base Electron project. |
| 2 | State | `app-state`, `logger`, `scenario-manager`. |
| 3 | Scenarios CRUD | Create / edit / delete; IPC persistence. |
| 4 | Engine | Safe `click-engine` (simulation), progress. |
| 5 | UX | Settings, i18n RU/EN, hotkeys, safety. |
| 6 | Advanced | Dashboard (7 tabs). |
| 7 | Data ops | Import / export, profiles. |
| 8 | Resilience | `error-manager`, diagnostics. |
| 9 | Stabilization | Test plan, MVP checklist, accessibility. |
| 10 | Adapter docs | `DESKTOP_ADAPTER_PLAN`, `ACTION_SCHEMA`, readiness. |
| 11 | OS integration | Global hotkeys, menu, tray, lifecycle. |
| 12 | Packaging | `electron-builder`, packaging & security docs. |
| 13 | Beta polish | UI / dark theme / assets / CSS structure. |
| 14 | Release prep | This release scaffolding. |
| 15 | Final stabilization | Smoke helper, beta health, JSON corruption guard. |
| 16 | Handoff design | Feature flags, go/no-go, audit log plan, privacy doc. |
| 17 | Action pipeline | `action-pipeline.js`, `safety-gates.js`, `audit-events.js` (in-memory). Real actions blocked. |
| 18 | Adapter interface | `desktop-adapter-interface.js`, `mock-desktop-adapter.js`, `adapter-registry.js`. Mock active. Real adapter blocked. |
| 19 | Real-action sandbox | `real-action-sandbox.js`. Dry-run preview, permission checklist, blocked reasons. No real execution. |
| 20 | Final beta QA | Structural audit (0 dup ids, perfect i18n parity 342/342), expanded smoke-check (96 checks), `BETA_QA_REPORT.md`, `I18N_CHECKLIST.md`. Manual testing required before tag. |
| 21 | Beta release packaging | `.gitignore`, extended `package.json` `build` block, `RELEASE_CHECKLIST.md`, `BUILD_ARTIFACTS.md`, `GITHUB_RELEASE_DRAFT.md`, `VERSIONING.md`, Release status diagnostics, smoke-check 113 checks. |
| 22 | GitHub beta release finalization | `RELEASE_FINAL_CHECK.md`, `TAG_AND_RELEASE_GUIDE.md`, finalized RELEASE_NOTES / GITHUB_RELEASE_DRAFT, expanded Release status card, smoke-check 137 checks. Tag and publication remain manual. |
| 23 | Post-pack QA and release blocker pass | `RELEASE_BLOCKERS.md`, `PACKAGED_APP_QA.md`, expanded Release status card (14 rows + ready-after-manual-QA badge), smoke-check 168 checks. Manual packaged-app QA remains the last gate. |
| 24 | Final beta release preparation | `FINAL_RELEASE_SUMMARY.md`, `PRE_RELEASE_CHECKLIST.md`, `RELEASE_TAG_PLAN.md`, `RELEASE_COMMIT_MESSAGE.md`, expanded Release status card (18 rows + ready-for-pre-release-after-manual-QA badge), smoke-check 193 checks. Tag and publication remain manual. |
