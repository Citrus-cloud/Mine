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
