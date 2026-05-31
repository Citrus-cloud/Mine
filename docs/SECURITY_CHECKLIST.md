# ClickFlow — Security Checklist

## Electron Security

- [x] `contextIsolation: true`
- [x] `nodeIntegration: false`
- [x] No `remote` module usage
- [x] No direct `ipcRenderer` exposure in renderer
- [x] CSP header in index.html
- [x] No `eval()` usage
- [x] User text rendered via `textContent` (never `innerHTML`)
- [x] File operations exclusively in main process
- [x] JSON import validated before use
- [x] Settings JSON normalized and validated
- [x] `preload.js` exposes only safe wrappers via `contextBridge`
- [x] No shell commands executed from renderer
- [x] No external URLs loaded

## Automation Safety

- [x] Simulation-only execution (no real OS clicks)
- [x] No mouse/keyboard control library installed
- [x] No OCR or image recognition
- [x] No CAPTCHA or anti-bot bypass
- [x] Emergency stop available (Escape + CmdOrCtrl+Alt+E)
- [x] Safety limits enforced (minInterval, maxRepeat)
- [x] Quit confirmation when execution is running
- [x] **Step 17:** Real desktop actions disabled (`feature-flags.js → realDesktopActions: false`)
- [x] **Step 17:** `src/action-pipeline.js` blocks any `executionMode === "real"` request with the explicit error `Real desktop actions are disabled in this build` and emits an `action.real.blocked` audit event
- [x] **Step 17:** `src/safety-gates.js` exposes the gate predicates; `isRealActionAllowed()` is hard-coded to return `false`
- [x] **Step 17:** `src/audit-events.js` provides an in-memory audit event model (no file persistence yet); allowlist only — no PII, no paths
- [x] **Step 17:** `npm run smoke` verifies action-pipeline / safety-gates / feature-flags sources contain the simulation-only invariants and that `package.json` declares no real-input modules (including `uiohook-napi`)
- [x] **Step 18:** Mock adapter only (`src/mock-desktop-adapter.js`) — the only `available: true` adapter in the registry, `realActions: false`, `simulationOnly: true`
- [x] **Step 18:** Real adapter unavailable — `src/adapter-registry.js` lists `real-desktop` as `available: false`, `planned: true`, with `disabledReason` set
- [x] **Step 18:** Adapter registry blocks real adapter — `setActiveAdapter("real-desktop")` returns `{ success: false, blocked: true, ... }` and emits `adapter.selection.blocked` + `adapter.real.unavailable`
- [x] **Step 18:** `src/desktop-adapter-interface.js`'s `isRealAdapterAllowed()` is hard-coded to return `false`
- [x] **Step 18:** No real-input dependencies — `package.json` declares no `robotjs` / `nut.js` / `iohook` / `uiohook-napi` / `node-key-sender` (verified by `npm run smoke`)
- [x] **Step 19:** Dry-run only — `src/real-action-sandbox.js` performs **no** OS input. `evaluateRealActionReadiness()` always returns `{ allowed: false, ... }`; `confirmDryRunPlan()` returns `realExecution: false`; the new `executionMode === "dry-run"` path in `action-pipeline.js` never invokes any adapter
- [x] **Step 19:** Pipeline block message for real mode is `Real desktop actions are disabled. Dry-run preview is available only.`
- [x] **Step 19:** Audit allowlist gained six sandbox event types (`real.sandbox.preview.created`, `real.sandbox.dryrun.confirmed`, `real.sandbox.dryrun.cancelled`, `real.sandbox.blocked`, `real.permission.checklist.created`, `real.blocked.reason.generated`); payloads carry only ids and counts (no PII, no paths)

## Global Hotkeys

- [x] Registered via main process `globalShortcut`
- [x] Unregistered on `will-quit`
- [x] Renderer receives only events, no direct Electron API access

## Data Storage

- [x] User data in `app.getPath('userData')` only
- [x] No sensitive data stored
- [x] No network requests
- [x] Export files contain only scenario/settings data

## Packaging

- [ ] Code signing (planned)
- [ ] Auto-update (planned)
- [x] App metadata configured


## Final release security (Step 22)

Run this before every public release tag. All items must be `[x]`.

- [ ] Prohibited dependencies absent from `package.json`:
      `robotjs`, `nut.js`, `iohook`, `uiohook-napi`,
      `node-key-sender`. (Verified by `npm run smoke`.)
- [ ] No real desktop action adapter is bundled. The
      `real-desktop` entry in `src/adapter-registry.js` is
      registered as `available: false, planned: true` with a
      non-null `disabledReason`. (Verified by `npm run smoke`.)
- [ ] Action pipeline blocks `executionMode: "real"` with the
      literal message
      `Real desktop actions are disabled. Dry-run preview is
      available only.`. (Verified by `npm run smoke`.)
- [ ] Real-action sandbox is dry-run only.
      `evaluateRealActionReadiness()` returns `allowed: false`,
      `confirmDryRunPlan()` returns `realExecution: false`.
      (Verified by `npm run smoke`.)
- [ ] Mock adapter only — self-test 4 / 4 passing on the build
      host. (Verified manually.)
- [ ] No OCR engine, no OpenCV, no `sharp`-based template
      matching is bundled or imported.
- [ ] Electron security settings checked — `contextIsolation: true`,
      `nodeIntegration: false`, CSP unchanged. (Verified by
      `npm run smoke`.)
- [ ] `preload.js` does not expose `ipcRenderer` directly. The
      smoke check `preload.js does not expose ipcRenderer
      directly` is `OK`.
- [ ] `Copy diagnostics` output contains `Simulation only: true`
      and the `Sandbox: realActionsAllowed=false`,
      `Adapter: active=mock, ...realActionsAllowed=false`,
      `Release: ..., releaseDocsReady=true` lines on the build
      host.
- [ ] Release artifacts are verified manually on the target OS
      per `docs/BUILD_ARTIFACTS.md` §7 before they are uploaded
      to GitHub.



## Screen capture (Step 25)

ClickFlow `0.1.x` exposes a **screen-capture foundation** built on
Electron `desktopCapturer`. It is **preview-only** and shares the
simulation-only contract of the rest of the build.

- [x] Screenshots are **not** saved to disk by the application.
      The main process never writes a screenshot file, and the
      renderer never persists `imageDataUrl` to `localStorage`,
      `userData/scenarios.json`, `userData/settings.json`, or
      `userData/profiles.json`.
- [x] Screen capture is invoked **only** in response to a user
      action (`Refresh sources` or `Capture preview`). No
      automatic capture on app start, no background capture, no
      timer-driven capture.
- [x] Screen capture goes **only** through IPC. `desktopCapturer`
      is imported in `main.js` only; the renderer reaches it via
      `window.clickflow.screenCapture.{listSources, capturePreview,
      getStatus}` exposed by `preload.js`. The renderer never
      receives raw `ipcRenderer` (smoke check `preload.js does not
      expose ipcRenderer directly` is `OK`).
- [x] `contextIsolation: true`, `nodeIntegration: false`, and CSP
      `default-src 'self'; script-src 'self'; style-src 'self';`
      remain unchanged in `main.js` and `src/index.html`.
- [x] No OCR. `package.json` declares no `tesseract.js`,
      `tesseract-ocr`, `node-tesseract-ocr`. Verified by
      `npm run smoke`.
- [x] No image recognition / template matching. `package.json`
      declares no `opencv4nodejs`, `@u4/opencv4nodejs`, `sharp`,
      `jimp`-based recognition library. Verified by `npm run
      smoke`.
- [x] No real clicks. `realDesktopActions=false`,
      `realActionsImplemented=false` — unchanged from Steps
      17–24. The screen-capture path never triggers a click,
      keyboard input, or any input event.
- [x] IPC payloads are **allowlisted**. Sources are normalised to
      `{ id, name, type, thumbnailDataUrl, display_id, width,
      height, capturedAt }` before crossing the boundary. No
      window owners, no PIDs, no filesystem paths, no full
      Electron `Display` objects, no native error messages or
      stack traces.
- [x] `sourceId` validation. The `screen-capture:capture-preview`
      handler accepts only ids that begin with `screen:` or
      `window:` and are at most 200 characters; everything else
      is rejected with `Invalid source id`.
- [x] Audit payloads carry **no pixels**. The six new allowlisted
      event types
      (`screen.capture.sources.requested`,
      `screen.capture.sources.loaded`,
      `screen.capture.preview.requested`,
      `screen.capture.preview.created`,
      `screen.capture.preview.cleared`,
      `screen.capture.error`)
      carry only counts, ids, and source types — never an
      `imageDataUrl`.
- [x] Renderer DOM safety. The new UI uses `textContent` for
      every user-visible string. `imageDataUrl` and
      `thumbnailDataUrl` are written **only** to `img.src`,
      never inserted as raw HTML. `innerHTML` is used only as
      `= ''` (container clear), matching the rest of `renderer.js`.
- [x] No mobile platforms. Screen capture remains a desktop-only
      surface.
- [x] No captcha / antibot bypass. Out of scope, permanently.
- [x] No automation against banking, payment, or other protected
      apps. Out of scope, permanently.

See [`docs/SCREEN_CAPTURE.md`](./SCREEN_CAPTURE.md) for the full
description, the IPC flow, and per-OS limitations.



## Region selector (Step 26)

ClickFlow `0.1.x` exposes a **region selector foundation** — a
rectangular drag selector that sits on top of the Step 25
screen-capture preview. It is **preview-only** and shares the
simulation-only contract of the rest of the build.

- [x] No real clicks. The region selector never fires a click,
      never opens a context menu, never enqueues a real action.
      `realActionsImplemented=false` and `realDesktopActions=false`
      are unchanged.
- [x] No OCR. `package.json` declares no `tesseract.js`,
      `tesseract`, or any OCR library at Step 26. Verified by
      `npm run smoke`.
- [x] No image recognition. `package.json` declares no
      `opencv4nodejs`, `@u4/opencv4nodejs`, `sharp`, or template
      matching dependency at Step 26. Verified by `npm run smoke`.
- [x] No automatic action triggered by a region. Nothing in the
      app reads `appState.regionSelector` or
      `scenario.settings.region` to trigger a click, an OCR call,
      or any other side effect.
- [x] Preview is not saved to disk. Step 25 contract unchanged:
      no screenshot file is written by the application.
- [x] Region is stored as **numbers**, not pixels. Both
      `appState.regionSelector` and the optional
      `scenario.settings.region` carry `{ x, y, width, height }`
      only. No `imageDataUrl`, no cropped pixel buffer.
- [x] Audit payloads carry **no pixels**. The six new allowlisted
      event types
      (`region.selection.started`,
      `region.selection.updated`,
      `region.selection.completed`,
      `region.selection.cleared`,
      `region.attached.toScenario`,
      `region.validation.failed`)
      carry only rectangle dimensions and the scenario id (for
      attach). No `imageDataUrl`.
- [x] No new IPC channel. The region selector runs entirely in
      the renderer; nothing crosses the Electron IPC boundary
      because of it. `contextIsolation: true`,
      `nodeIntegration: false`, CSP — unchanged.
- [x] Renderer DOM safety. The overlay is a tree of empty
      `<div>`s. The coordinate badge renders text via
      `textContent`. `innerHTML` is used only as `= ''`
      (container clear).
- [x] Backwards compatibility. Old scenarios without
      `settings.region` keep working unchanged.
      `validateRegionSettings(null)` is `valid: true`.
- [x] No mobile platforms. Region selector remains a desktop-only
      surface.

See [`docs/REGION_SELECTOR.md`](./REGION_SELECTOR.md) for the full
description, the coordinate-space model, and the future-step gating.



## Template Asset Manager (Step 27)

Step 27 introduces a storage-only Template Asset Manager. The
checks below confirm that the new code does not weaken any of the
beta-MVP safety invariants.

### File-level invariants
- [x] Templates are imported **only through `dialog.showOpenDialog`**
      with the explicit filter
      `{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp'] }`.
      The renderer never sends an arbitrary path.
- [x] Imports go through a **two-stage allow-list**: the dialog
      extension filter AND a magic-bytes check on the file
      content (`89 50 4E 47 …` for PNG, `FF D8 FF` for JPEG,
      `RIFF???WEBP` for WebP). A renamed `.exe` cannot pass.
- [x] Imports are capped at **16 MiB**. Larger files are
      rejected before the copy with a generic error message.
- [x] After the copy the original chosen path is forgotten by
      the main process. Only the basename is stored as
      `originalFileName`, never the directory.

### Storage-level invariants
- [x] `templates.json` carries **metadata only**. It is forbidden
      to write `previewDataUrl`, `imageDataUrl`, base64 strings,
      or pixel bytes into it. The main module strips any such
      field through `_stripRuntimeOnlyFields()` before saving.
- [x] Image files live exclusively under
      `userData/templates/images/template-<id>.<ext>`. Path
      validation (`_isInsideImagesDir`) refuses anything that
      contains `..` or path separators.
- [x] `previewDataUrl` is materialised in memory only (returned
      by `templates:load` and `templates:import-image`). It
      never reaches `templates.json`, `settings.json`,
      `scenarios.json`, `profiles.json`, or `localStorage`.
- [x] Corrupt `templates.json` is renamed to
      `templates.json.broken-<timestamp>` and the app boots
      with an empty list — same fallback as the other JSON
      stores.

### Renderer-level invariants
- [x] The renderer reaches the templates feature only through
      `window.clickflow.templates.*`. Raw `ipcRenderer` is
      still **not** exposed.
- [x] The renderer modules (`template-manager.js`,
      `template-ui.js`) do **not** `require('electron')` or
      `require('ipcRenderer')`.
- [x] All user-visible strings (template name, description,
      original filename, error messages) render via
      `textContent`. `innerHTML` is used only as `= ''`
      (container clear).
- [x] `previewDataUrl` is written exclusively to `<img>.src`. It
      is never inserted as raw HTML.

### Format / behaviour invariants
- [x] Templates are stored ASSETS only. ClickFlow does **not**
      match a template against the screenshot, run OCR, or
      trigger any click on a matched location at Step 27.
- [x] No new dependencies. `package.json` declares **zero** of
      `tesseract`, `tesseract.js`, `opencv4nodejs`,
      `@u4/opencv4nodejs`, `sharp`, `jimp`, `pixelmatch`,
      `looks-same`, `robotjs`, `nut-js`, `nutjs`,
      `@nut-tree/nut-js`, `iohook`, `uiohook-napi`,
      `node-key-sender`. Smoke check enforces this.
- [x] No real clicks. The click engine, action pipeline, safety
      gates, mock adapter, and dry-run sandbox are unchanged.
      `simulationOnly: true`, `realActionsImplemented: false`
      hold across every status response.
- [x] No mobile platforms. Templates remain desktop-only.

### Audit / diagnostics invariants
- [x] All eight new audit-event types
      (`template.import.requested/completed/cancelled/failed`,
      `template.metadata.updated`, `template.selected`,
      `template.deleted`, `template.reset`) are part of the
      frozen `AUDIT_EVENT_TYPES` allowlist. Payloads carry only
      template id and short metadata — never base64 or pixel
      data.
- [x] The `Templates: …` line in **Copy diagnostics** carries
      numbers and ids only — no base64, no original path, no
      previewDataUrl.

### Electron-security invariants (re-checked at Step 27)
- [x] `contextIsolation: true`.
- [x] `nodeIntegration: false`.
- [x] CSP unchanged: `default-src 'self'; script-src 'self';
      style-src 'self';` — no `unsafe-inline`, no `unsafe-eval`,
      no remote sources.
- [x] `preload.js` does **not** expose `ipcRenderer` — only
      namespaced helper functions.

See [`docs/TEMPLATE_ASSETS.md`](./TEMPLATE_ASSETS.md) for the full
description, the storage model, and the list of features that are
**not** implemented in Step 27.



## Template matching mock (Step 28)

Step 28 introduces a mock / dry-run pipeline that wires the Step
25 preview, the Step 26 region, and the Step 27 templates into a
deterministic mock match. The checks below confirm that the new
code does not weaken any of the beta-MVP safety invariants.

### Pipeline-level invariants
- [x] **Mock matching only.** `src/template-matching-mock.js` is
      pure logic. It never decodes a single pixel and never
      reads any image bytes. `runMockTemplateMatch` consumes
      only widths, heights, ids, and rectangles.
- [x] **No OpenCV / opencv.js / opencv4nodejs / @u4/opencv4nodejs.**
      `package.json` declares zero of these dependencies at Step
      28. Verified by `npm run smoke`.
- [x] **No OCR / Tesseract / tesseract.js.** Same.
- [x] **No real clicks.** The action preview produced by
      `createImageClickActionPreview` is rendered as text only.
      The click engine, the action pipeline, the mock adapter,
      and the dry-run sandbox do not recognise the
      `image_click` action type.
- [x] **`image_click` scenario action is not executed.**
      `realActionsImplemented=false`,
      `realActionsAllowed=false`,
      `imageClickScenarioImplemented=false` hold across every
      status response and audit event at Step 28.

### Renderer-level invariants
- [x] The matcher and the matching UI never `require('electron')`
      or `ipcRenderer.invoke`. They live entirely in the renderer.
- [x] All user-visible strings render via `textContent`.
      `innerHTML` is used only as `= ''` (container clear).
- [x] The visual overlay uses `<img>.src` for the preview
      backdrop and absolutely-positioned `<div>` elements for
      the bounding box, the target point, and the region. No
      SVG, no canvas, no inline `<script>` injection.
- [x] The action preview JSON is rendered through
      `<pre>.textContent`. No `JSON.parse` of user-controlled
      input ever feeds back into the DOM as HTML.

### Storage-level invariants
- [x] The mock match result lives ONLY in
      `appState.templateMatching.lastResult`. Renderer process
      memory only; never persisted to `templates.json`,
      `settings.json`, `scenarios.json`, `profiles.json`, or
      `localStorage`.
- [x] The slice carries metadata only — no `imageDataUrl`, no
      thumbnails, no pixel buffers. `_cloneTemplateMatchInput`
      / `_cloneTemplateMatchResult` strip any unexpected
      pixel-bearing fields a buggy caller might pass.
- [x] No new IPC channel is registered for matching at Step 28.
      The renderer does not gain any new privilege over the
      operating system.

### Audit invariants
- [x] All five new audit-event types
      (`template.match.mock.requested`,
      `template.match.mock.completed`,
      `template.match.mock.failed`,
      `template.match.mock.cleared`,
      `image.click.preview.created`) are part of the frozen
      `AUDIT_EVENT_TYPES` allowlist.
- [x] Payloads carry only ids and numeric metadata
      (confidence, target X / Y, bounding-box width / height,
      `usedRegion: bool`). Never an `imageDataUrl`, never a
      thumbnail, never a screenshot.

### Electron-security invariants (re-checked at Step 28)
- [x] `contextIsolation: true`.
- [x] `nodeIntegration: false`.
- [x] CSP unchanged: `default-src 'self'; script-src 'self';
      style-src 'self';` — no `unsafe-inline`, no
      `unsafe-eval`, no remote sources.
- [x] `preload.js` does not gain any new namespace at Step 28
      (matching is renderer-only).

See [`docs/TEMPLATE_MATCHING_MOCK.md`](./TEMPLATE_MATCHING_MOCK.md)
for the full description, the input / output contracts, and the
list of features that are **not** implemented at Step 28.



## Real preview matching engine (Step 29)

Step 29 introduces a renderer-side real template matching engine.
The checks below confirm that the engine does not weaken any of
the beta-MVP safety invariants.

### Engine-level invariants
- [x] **Matching analyses preview only.** The engine consumes
      only the `imageDataUrl` of the preview the user explicitly
      captured in Step 25 and the `previewDataUrl` of the active
      Step-27 template. It never reads pixels from the live
      screen, never polls a window, never opens a new IPC
      channel.
- [x] **No real click.** The engine never moves the cursor,
      never enqueues a click, never types. The `image_click`
      action preview is rendered through `<pre>.textContent`
      and is not consumed by the click engine, the action
      pipeline, the mock adapter, or the dry-run sandbox.
- [x] **No OCR.** No Tesseract, no tesseract.js, no custom
      OCR. `getTemplateMatchEngineStatus().ocrImplemented ===
      false`.
- [x] **No OpenCV.** `package.json` declares zero of
      `opencv4nodejs`, `@u4/opencv4nodejs`, `opencv.js`,
      `opencv-js`, `sharp`, `jimp`, `pixelmatch`,
      `looks-same` at Step 29. `getTemplateMatchEngineStatus()
      .opencvAvailable === false`. Verified by `npm run smoke`.
- [x] **No prohibited dependencies.** `package.json` still
      declares zero of `robotjs`, `nut-js`, `nutjs`,
      `@nut-tree/nut-js`, `iohook`, `uiohook-napi`,
      `node-key-sender`, `tesseract`, `tesseract.js`. Verified
      by `npm run smoke`.

### Renderer-level invariants
- [x] The engine and the matching UI never `require('electron')`
      or `ipcRenderer.invoke`. They live entirely in the
      renderer.
- [x] All user-visible strings render via `textContent`.
      `innerHTML` is used only as `= ''` (container clear).
- [x] The visual overlay uses `<img>.src` for the preview
      backdrop and absolutely-positioned `<div>` elements for
      the bounding box, the target point, and the region.
- [x] The action preview JSON is rendered through
      `<pre>.textContent`. No HTML interpolation.

### Storage-level invariants
- [x] The match result lives ONLY in
      `appState.templateMatching.lastResult` (renderer memory).
      Never persisted to `templates.json`, `settings.json`,
      `scenarios.json`, `profiles.json`, or `localStorage`.
- [x] The slice carries metadata only — no `imageDataUrl`, no
      thumbnails, no pixel buffers.
      `_cloneTemplateMatchInput` / `_cloneTemplateMatchResult`
      strip any unexpected pixel-bearing fields a buggy caller
      might pass.
- [x] No new IPC channel is registered for matching at Step 29.
      The renderer does not gain any new privilege over the OS.

### Audit invariants
- [x] All five new audit-event types
      (`template.match.realPreview.requested`,
      `template.match.realPreview.completed`,
      `template.match.realPreview.failed`,
      `template.match.lowConfidence`,
      `template.match.engine.warning`) are part of the frozen
      `AUDIT_EVENT_TYPES` allowlist.
- [x] Payloads carry only ids and numeric metadata
      (confidence, threshold, target X / Y, bbox W / H,
      durationMs, step, scannedPositions, `usedRegion: bool`,
      `realClick: false`, `realMatching: false`). Never an
      `imageDataUrl`, never a thumbnail, never a screenshot.

### Electron-security invariants (re-checked at Step 29)
- [x] `contextIsolation: true`.
- [x] `nodeIntegration: false`.
- [x] CSP unchanged: `default-src 'self'; script-src 'self';
      style-src 'self';` — no `unsafe-inline`, no
      `unsafe-eval`, no remote sources.
- [x] `preload.js` does not gain any new namespace at Step 29
      (matching is renderer-only).

See [`docs/TEMPLATE_MATCHING_ENGINE.md`](./TEMPLATE_MATCHING_ENGINE.md)
for the full description, the algorithm, the threshold / step
controls, the region support, the performance limits, and the
list of features that are **not** implemented at Step 29.



## image_click scenario (Step 30)

Step 30 introduces a new scenario type `image_click` that
combines the Step-25 preview, the Step-26 region, the Step-27
templates and the Step-29 matcher into a single executable
scenario. The checks below confirm that the new scenario type
does not weaken any of the beta-MVP safety invariants.

### Scenario-level invariants
- [x] **`image_click` is simulation only.** The click-engine's
      `runImageClickScenario` produces an `image_click` action
      with `realClick: false` and `simulated: true`. The action
      flows through the action-pipeline's simulate path. The
      cursor never moves, no key is pressed.
- [x] **`realClick: true` is blocked outright.** Both
      `validateAction` and `validateActionSafety` refuse an
      `image_click` action with `realClick: true`. The audit
      event `action.imageClick.realBlocked` records the
      attempt.
- [x] **No new IPC channel** is registered for image_click at
      Step 30. The renderer does not gain any new privilege
      over the OS.

### Storage-level invariants
- [x] **No `imageDataUrl` in scenario data.** Scenario JSON
      carries only `templateId`, optional region (numbers
      only), threshold, step, timeoutMs, intervalMs and
      repeatCount. The exporter / importer are untouched —
      they only ever see metadata.
- [x] **No screenshot persisted.** `image_click` scenarios
      never write the screen-capture preview to disk. The
      preview lives in renderer memory exactly as it did at
      Step 25; only the user's explicit Capture preview action
      brings new pixel bytes into memory.

### Pipeline-level invariants
- [x] **The mock desktop adapter does not consume
      `image_click`.** Only `click` actions go through the
      adapter; `image_click` flows through the legacy
      simulate branch which emits
      `action.imageClick.simulated`.
- [x] **No prohibited dependencies.** `package.json` declares
      zero of `tesseract`, `tesseract.js`, `opencv4nodejs`,
      `@u4/opencv4nodejs`, `opencv.js`, `opencv-js`, `sharp`,
      `jimp`, `pixelmatch`, `looks-same`, `robotjs`, `nut-js`,
      `nutjs`, `@nut-tree/nut-js`, `iohook`, `uiohook-napi`,
      `node-key-sender`. Verified by `npm run smoke`.

### Audit invariants
- [x] All nine new audit-event types
      (`scenario.imageClick.started`,
      `scenario.imageClick.stopped`,
      `scenario.imageClick.match.started`,
      `scenario.imageClick.match.completed`,
      `scenario.imageClick.noMatch`,
      `scenario.imageClick.simulated`,
      `scenario.imageClick.failed`,
      `action.imageClick.simulated`,
      `action.imageClick.realBlocked`) are part of the frozen
      `AUDIT_EVENT_TYPES` allowlist. Payloads carry only ids
      and numeric metadata.

### Electron-security invariants (re-checked at Step 30)
- [x] `contextIsolation: true`.
- [x] `nodeIntegration: false`.
- [x] CSP unchanged: `default-src 'self'; script-src 'self';
      style-src 'self';` — no `unsafe-inline`, no
      `unsafe-eval`, no remote sources.

See [`docs/IMAGE_CLICK_SCENARIO.md`](./IMAGE_CLICK_SCENARIO.md)
for the full description, the data shape, the execution flow,
and the list of features that are **not** implemented at Step 30.



## image_click test tools (Step 31)

> Step 31 ships a Test Match panel inside the `image_click`
> scenario form ([`docs/IMAGE_CLICK_TEST_TOOLS.md`](./IMAGE_CLICK_TEST_TOOLS.md)).
> The panel never executes the scenario, never clicks, never
> persists the screenshot or the debug result on disk, and
> never opens a new IPC channel. The whole MVP remains
> simulation-only.

### Behavioural invariants
- [x] **Test Match does not click.** The Run Test Match button
      calls `runImageClickTest`, which validates inputs,
      invokes the Step-29 `runTemplateMatch` engine over the
      captured preview (`imageDataUrl`) and the template's
      `previewDataUrl`, and returns a debug result. It NEVER
      calls `click-engine.runScenario`,
      `click-engine.runImageClickScenario`, the action
      pipeline's real branch, the mock adapter, or the
      dry-run sandbox. realClick: false in every result.
- [x] **Test Match uses preview only.** The matcher analyses
      the screen-capture preview the user explicitly captured
      in Step 25. It never reads the live screen, never opens
      a new screenshot session, never decodes anything outside
      the `imageDataUrl` that is already in renderer memory.
- [x] **Test Match never persists the screenshot.** Neither
      `image-click-test-tools.js` nor `image-click-test-ui.js`
      writes to disk. The module-local `_lastTestResult` lives
      in renderer memory only and is cleared on
      `clearImageClickTestResult()` and on every scenario form
      open / close.
- [x] **Test Match never persists the debug result.** The
      result is **not** serialised into `scenarios.json`,
      `settings.json`, `profiles.json`, `templates.json` or
      `localStorage`. Saving the scenario only persists the
      Step-30 fields (`templateId`, `region`, `threshold`,
      `step`, `timeoutMs`, `intervalMs`, `repeatCount`).
- [x] **No `imageDataUrl` in audit / diagnostics.** The five
      new audit event types
      (`imageClick.test.started`,
      `imageClick.test.completed`,
      `imageClick.test.failed`,
      `imageClick.test.lowConfidence`,
      `imageClick.test.cleared`)
      and the `Image click test:` line in `Copy diagnostics`
      carry only ids, numbers, and short reasons — never an
      `imageDataUrl`, never a thumbnail, never a screenshot.
- [x] **The action preview is never executed.** It is rendered
      through `<pre>.textContent` (no HTML interpolation) and
      its `realClick: false` / `realMatching: false` /
      `mode: 'preview'` markers ensure the click engine, the
      action pipeline, the mock adapter, and the dry-run
      sandbox refuse to consume it.

### Pipeline-level invariants
- [x] **No new IPC channel at Step 31.** The renderer does not
      gain any new privilege over the OS. `main.js` registers
      no `imageClick.test.*` handler. `preload.js` exposes no
      `imageClick.test.*` API.
- [x] **No prohibited dependencies.** `package.json` still
      declares zero of `tesseract`, `tesseract.js`,
      `opencv4nodejs`, `@u4/opencv4nodejs`, `opencv.js`,
      `opencv-js`, `sharp`, `jimp`, `pixelmatch`, `looks-same`,
      `robotjs`, `nut-js`, `nutjs`, `@nut-tree/nut-js`,
      `iohook`, `uiohook-napi`, `node-key-sender`.
- [x] **No prohibited imports.** `image-click-test-tools.js`
      and `image-click-test-ui.js` never call `require()`,
      never import `electron` or `ipcRenderer`, never use
      `localStorage`, and never use `innerHTML` on user data.

### Electron-security invariants (re-checked at Step 31)
- [x] `contextIsolation: true`.
- [x] `nodeIntegration: false`.
- [x] CSP unchanged: `default-src 'self'; script-src 'self';
      style-src 'self';` — no `unsafe-inline`, no
      `unsafe-eval`, no remote sources.

See [`docs/IMAGE_CLICK_TEST_TOOLS.md`](./IMAGE_CLICK_TEST_TOOLS.md)
for the full description, the debug-result shape, the error /
warning IDs, the troubleshooting list, and the list of features
that are **not** implemented at Step 31.



## OCR Foundation (Step 32)

> Step 32 ships the OCR Foundation as a renderer-only mock
> ([`docs/OCR_FOUNDATION.md`](./OCR_FOUNDATION.md)). The mock
> engine fabricates plausible OCR blocks from preview metadata.
> It NEVER recognises real text, NEVER clicks, NEVER persists
> the screenshot or the result on disk, and NEVER opens a new
> IPC channel.

### Behavioural invariants
- [x] **OCR mock only.** `runMockOcr` builds the blocks from the
      preview width / height / region / target text. It never
      decodes pixels and never calls a real OCR engine.
- [x] **No Tesseract.** `package.json` declares zero of
      `tesseract`, `tesseract.js`, `tesseract-ocr`,
      `node-tesseract-ocr`. The mock engine and the OCR UI never
      `require()` anything.
- [x] **No OpenCV.** `package.json` declares zero of
      `opencv4nodejs`, `@u4/opencv4nodejs`, `opencv.js`,
      `opencv-js`, `sharp`, `jimp`, `pixelmatch`, `looks-same`.
- [x] **No real click.** The mock never moves the cursor, never
      presses a key, never focuses a window. The action preview
      it builds is `mode: "preview"`, `realClick: false`,
      `realOcr: false` and is rendered through
      `<pre>.textContent`. The click engine, the action
      pipeline, the mock adapter, and the dry-run sandbox refuse
      to consume `text_click` actions.
- [x] **`text_click` action preview not executed.** There is no
      `text_click` scenario type at Step 32. `validateScenario`
      still accepts only `simple_click` and `image_click`.
      `validateAction` accepts only `click` and `image_click`.
      Any caller that builds a `text_click` and tries to run it
      is rejected.
- [x] **Mock OCR uses preview only.** The engine never opens a
      new screenshot session. It only sees the preview the user
      explicitly captured in Step 25, and only the metadata
      portion (sourceId / name / width / height / capturedAt) —
      the `imageDataUrl` is read by the UI for the overlay
      `<img>.src` only and is never sent to the engine, never
      audited, never persisted.

### Storage-level invariants
- [x] **No `imageDataUrl` in the OCR slice.** `appState.ocr` and
      its `lastInput` / `lastResult` carry only ids, numbers and
      short text — never an `imageDataUrl`, never a thumbnail.
      The cloning helpers in `app-state.js` strip pixel fields
      defensively.
- [x] **No `imageDataUrl` in audit / diagnostics.** The five new
      audit event types (`ocr.mock.requested`,
      `ocr.mock.completed`, `ocr.mock.failed`, `ocr.mock.cleared`,
      `text.click.preview.created`) and the new `OCR:` line in
      `Copy diagnostics` carry only short metadata — never the
      full target text, never an `imageDataUrl`, never PII.
- [x] **No screenshot persisted.** Mock OCR never writes the
      preview, the recognised blocks, the action preview, or
      the result on disk. Module-local state lives in renderer
      memory only and is reset on `clearOcrMockResult()`.

### Pipeline-level invariants
- [x] **No new IPC channel at Step 32.** `main.js` registers no
      `ocr.*` handler. `preload.js` exposes no `ocr.*` API. OCR
      is a renderer-only feature.
- [x] **No prohibited dependencies / imports.** `ocr-mock-engine.js`
      and `ocr-ui.js` contain no `require()` of any
      OCR / OpenCV / image-matching / real-input module.
- [x] **No HTML interpolation.** Every user-visible OCR string
      is rendered through `textContent`. The action-preview JSON
      uses `<pre>.textContent`. Image previews use `<img>.src`
      only.

### Electron-security invariants (re-checked at Step 32)
- [x] `contextIsolation: true`.
- [x] `nodeIntegration: false`.
- [x] CSP unchanged: `default-src 'self'; script-src 'self';
      style-src 'self';` — no `unsafe-inline`, no
      `unsafe-eval`, no remote sources.

See [`docs/OCR_FOUNDATION.md`](./OCR_FOUNDATION.md) for the full
description, the data shapes, the troubleshooting list, and the
list of features that are **not** implemented at Step 32.
