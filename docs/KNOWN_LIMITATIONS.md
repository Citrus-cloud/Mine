# ClickFlow — Known Limitations (0.1.0-beta)

This document is a single source of truth for what ClickFlow
**does not** do in this release. Some items are temporary; some are
permanently out of scope. Each entry says which.

> **Beta note (Step 22).** `0.1.0-beta` is the first public
> pre-release. The list below is the contract beta testers see;
> nothing on it is a surprise. Open a Safety report if you observe
> behavior that contradicts any entry here.

---

## 1. Execution model

### 1.1 Simulation only — no real clicks
- **Status:** intentional in `0.1.x`. Targeted at `0.3.x` behind a
  separate safety review (see `docs/ROADMAP.md`).
- **Effect:** The `click-engine` does not call any OS input API.
  Scenarios run as a fully internal loop that updates progress and
  logs. No mouse movement, no key presses are emitted.
- **Why:** Real input requires careful threat modeling, explicit
  user confirmation flows, audit logs, and a kill switch. None of
  that is in place yet, so we do not ship the capability at all.

### 1.2 No keyboard automation
- **Status:** same as 1.1.

### 1.3 No native input modules
- **Status:** intentional. ClickFlow does not depend on `robotjs`,
  `nut.js`, `iohook`, `node-key-sender`, or any kernel-level hook.

---

## 2. Recognition / vision

### 2.1 No OCR
- **Status:** research item only. May appear in a future
  `0.4.x+` line and only behind a safety gate.

### 2.2 No image recognition / template matching
- **Status:** research item only. No OpenCV, no `sharp`-based
  matching shipped.

---

## 3. Platform reach

### 3.1 No mobile (iOS / Android) build
- **Status:** out of scope for this release line. Research only.
- **Effect:** the app is desktop-only via Electron.

### 3.2 Tray icon ships empty
- **Status:** temporary. The tray uses an empty `nativeImage`
  placeholder. A packaged build for public distribution must
  provide platform-specific icons; see `docs/PACKAGING.md` and
  `assets/icons/README.md`.

### 3.3 Global hotkey behavior on Linux
- **Status:** known constraint. `globalShortcut` semantics depend on
  the desktop environment, the compositor (X11 vs. Wayland), and
  permission policies. ClickFlow tries to register and reports
  success/failure via Advanced → Safety → "Hotkey status".

### 3.4 No code signing
- **Status:** temporary. `electron-builder` is configured but
  installers are not signed yet. macOS Gatekeeper and Windows
  SmartScreen will warn on first launch.

---

## 4. Sync / lifecycle

### 4.1 No cloud sync
- **Status:** intentional in `0.1.x`. May appear later as an
  optional, opt-in feature only.

### 4.2 No auto-update
- **Status:** intentional in `0.1.x`. Updates are manual: pull or
  download a new release.

### 4.3 No telemetry
- **Status:** intentional. ClickFlow does not phone home. Diagnostics
  stay on your machine and only leave it when you copy them and
  paste them into an issue.

### 4.4 No automated tests
- **Status:** temporary. Manual smoke-test plan only
  (`docs/SMOKE_TESTS.md`). An automated harness is planned for
  `0.1.x` polish.

---

## 5. UI / UX

### 5.1 Theme switch redraws, does not animate
- **Status:** acceptable. Theme change is immediate but does not
  use a smooth transition.

### 5.2 No drag-and-drop reordering of scenarios
- **Status:** planned for a later release.

### 5.3 No rich-text descriptions
- **Status:** intentional. Plain-text only, rendered through
  `textContent`, to keep the DOM safe.

### 5.4 Limited accessibility audit
- **Status:** baseline only. Focus rings exist, but a full
  accessibility audit (screen-reader labels, `aria-live` for status,
  full keyboard navigation across the dashboard) is planned in
  `0.1.x` polish.

---

## 6. Permanently out of scope

These are **never** going to be in ClickFlow:

- **Captcha bypass**, antibot bypass, "I am not a robot" defeats.
- **Ad-click automation** of any kind (publisher fraud, ad arbitrage,
  click farming).
- Automation against **banking, payment, brokerage, exchange, or
  any protected application**.
- Automation against any application whose terms of service or
  whose anti-automation controls forbid programmatic input.
- Anything designed to harass, mislead, scam, or violate the
  privacy of another user or system.

If any of these is what you are looking for, ClickFlow is not the
project for you.

---

## 7. Where to discuss / extend this list

- File a **Feature request** if the limitation is a gap that should
  be closed.
- File a **Safety report** if the limitation is being violated by
  the current build (e.g. real input being fired in a place where
  this document says it is not).
- Read `docs/ROADMAP.md` for which limitations are scheduled to
  be lifted, and when.



---

## 8. Beta release (Step 22)

The items below are scoped to the `v0.1.0-beta` GitHub pre-release.
They will be revisited (or closed) in subsequent `0.1.x` patches.

### 8.1 Simulation-only is a hard contract for `0.1.x`
- The runtime never produces OS input. Six independent layers
  agree on this; see `docs/REAL_ACTION_SANDBOX.md` §7.
- Even confirming a dry-run plan does **not** invoke any adapter.

### 8.2 Dry-run sandbox is preview-only
- `Confirm dry-run` records the user's "I have inspected the plan"
  decision. It does not ask any adapter to execute.
- Any caller using `executionMode: "real"` is rejected with the
  literal message
  `Real desktop actions are disabled. Dry-run preview is available only.`.

### 8.3 Mock adapter only
- `mock` is the only `available: true` adapter in the registry.
- `real-desktop` is registered with `available: false,
  planned: true, disabledReason: "Real desktop actions are not
  implemented in this build"`. Activation is blocked at the
  registry layer.

### 8.4 Packaging needs OS-specific verification
- `npm run pack` and `npm run dist` produce platform-specific
  installers / images. Cross-builds are not configured in
  `0.1.0-beta`. Each target OS must be built **on that OS**.
- Verify each artifact per `docs/BUILD_ARTIFACTS.md` §7 before
  uploading to a GitHub release.
- macOS DMGs are **not** notarized; Windows installers are
  **not** Authenticode-signed in `0.1.0-beta`. Code-signing is on
  the `0.1.x` polish backlog.

### 8.5 Global hotkeys may vary by OS
- `globalShortcut` semantics depend on the desktop environment,
  the compositor (X11 vs. Wayland on Linux), and OS-level
  permission policies. ClickFlow surfaces success / failure via
  Advanced → Safety → Global hotkeys.

### 8.6 Tray may vary by OS
- Tray availability depends on the OS shell. ClickFlow ships a
  placeholder `nativeImage` icon in `0.1.0-beta`. Public packaged
  builds should produce platform-specific raster icons before a
  wider release.

### 8.7 No automated CI yet
- `npm run smoke` is run locally for `v0.1.0-beta`. GitHub Actions
  wiring is planned for the next step.



---

## 9. Screen capture (Step 25)

Step 25 introduces a **screen-capture foundation** built on Electron
`desktopCapturer`. The foundation is preview-only; the smart visual
features (find image, find icon, find text, region selection,
template matching, OCR, visual scenario builder) are **not** part
of `0.1.x`.

### 9.1 Preview only
- The user can list available `screen` and `window` sources, select
  one, and request a single thumbnail-sized preview.
- The preview is **never** saved to disk, **never** sent over the
  network, and **never** processed by any image / text recognition
  library.

### 9.2 No image matching, no OCR, no auto-clicks yet
- "Click on a found image / icon / text" is **not** implemented.
- Template matching is **not** implemented.
- OCR is **not** implemented.
- Auto-clicks based on a screenshot are **not** implemented.
- Any future step that adds one of those goes through the existing
  safety review process (`docs/REAL_ACTIONS_GO_NO_GO.md`).

### 9.3 OS permissions may vary
- **Windows.** Works on Win10/Win11 desktop sessions without
  prompts in most setups. Remote desktop sessions may return
  empty thumbnails for windows that the session does not own.
- **macOS.** macOS 10.15+ prompts for the **Screen Recording**
  privacy permission on first call. Without the grant,
  `desktopCapturer.getSources` may return an empty list or
  empty thumbnails. ClickFlow surfaces this in the
  **Screen capture status** card and inline notice.
- **Linux (X11).** Works in most desktop environments.
- **Linux (Wayland).** Strict Wayland compositors may return an
  empty list. Some compositors require per-application Pipewire
  portal grants.
- **Headless / CI.** `desktopCapturer` may be unavailable; the
  IPC returns `{ success: false, error: "Screen capture is not
  available on this system" }` and the diagnostics line shows
  `available=false`.

### 9.4 Renderer-only memory
- The preview lives only in the renderer's process memory
  (`appState.screenCapture.preview` and the in-memory cache in
  `screen-capture-client.js`).
- Closing the window or clearing the preview drops it
  immediately.

### 9.5 No background or auto capture
- Screen capture is invoked only on `Refresh sources` or
  `Capture preview` clicks. There is no timer, no auto-refresh,
  and no capture at app launch.



---

## 10. Region selector (Step 26)

Step 26 introduces a **rectangular region selector** that sits on
top of the screen-capture preview from Step 25. The selector is
preview-only — the smart visual features (find image, find icon,
find text, template matching, OCR, visual scenario builder) are
**not** part of `0.1.x`.

### 10.1 Foundation only
- The region selector turns a mouse drag into a four-number
  rectangle (`{ x, y, width, height }`) in two coordinate spaces
  (preview pixels and original-screenshot pixels).
- Nothing in the app currently reads the region to take an action.
  It exists as an anchor for future image-matching / OCR steps.
- "Attach to active scenario" stores an image-space rectangle
  inside the scenario's `settings.region`. The click engine
  ignores the field — old scenarios and scenarios with a region
  are executed identically.

### 10.2 Single rectangle only
- Only one rectangle is tracked at a time
  (`appState.regionSelector.selectedRegion`).
- Multi-region selection, polygons, ellipses, and rotated
  rectangles are out of scope for `0.1.x`.

### 10.3 Preview must exist
- Drawing a region requires a captured preview. With no preview,
  the Region Selector card shows
  *"Capture a screenshot preview first."* and the buttons are
  inert.
- Clearing the screenshot preview also clears the region — the
  preview-space coordinates are no longer meaningful without an
  image.

### 10.4 Validation thresholds
- Selections smaller than ~6 px on either side are rejected as
  accidental clicks (`validateRegion` requires `width > 5` and
  `height > 5`). The user sees a "selection too small" log entry
  and an audit `region.validation.failed` event.

### 10.5 No image matching, no OCR, no auto-clicks yet
- "Click on the centre of the region" is **not** implemented.
- Template matching scoped to the region is **not** implemented.
- OCR scoped to the region is **not** implemented.
- These remain blocked by the existing safety contract; future
  work goes through `docs/REAL_ACTIONS_GO_NO_GO.md`.

### 10.6 No persistence by default
- The drag itself never writes to disk.
- Only the explicit **Attach to active scenario** action stores
  the rectangle, and only inside the scenario JSON
  (numbers only — no pixels).



---

## 11. Template asset manager (Step 27)

Step 27 introduces a **Template Asset Manager**: a storage layer
for the small reference images (icons, button captures, etc.)
that *future* steps will use for image search / OCR / template-
anchored clicks. The MVP intentionally stops at storage.

### 11.1 Foundation only — assets, not a matcher
- Templates are stored ASSETS. ClickFlow does **not** match a
  template against the screenshot, run OCR, or trigger any
  click on a matched location.
- Step 27 adds nothing to the click engine, the action pipeline,
  the mock adapter, or any safety gate.
- The "Active template" selection is a UI hint — no scenario
  reads it, no automation step uses it.

### 11.2 Single rectangle ≠ template region
- Step 26 lets the user draw a region on top of the screen-
  capture preview. Step 27 templates are **not** projected onto
  that region. The two foundations exist side by side; the
  matcher that connects them is future work.

### 11.3 Templates are stored but not matched yet
- Imported templates live in
  `userData/templates/templates.json` and
  `userData/templates/images/template-<id>.<ext>`.
- The matcher and the planned `image_click` action type are
  blocked by the existing safety contract; future work goes
  through [`docs/REAL_ACTIONS_GO_NO_GO.md`](./REAL_ACTIONS_GO_NO_GO.md).

### 11.4 Supported formats only
- The importer accepts only `png`, `jpg`, `jpeg`, `webp`. Other
  formats — including BMP, GIF, TIFF, AVIF, SVG, HEIC — are
  rejected at the dialog filter level AND at the magic-bytes
  level.
- Maximum image size is **16 MiB** per file. Larger images are
  refused with a generic error message.

### 11.5 Header-only width / height
- Pixel dimensions come from format-header parsing only. We
  never decode pixels in Step 27. For exotic but valid header
  layouts the parser may report `0 × 0`; this never blocks the
  import — the metadata is still saved.

### 11.6 No drag-and-drop import
- The only entry point is the **Import template** button, which
  opens `dialog.showOpenDialog`. Drag-and-drop import,
  clipboard import, and URL import are out of scope for `0.1.x`.

### 11.7 No export / import bundle
- Templates are not part of the existing scenarios export /
  import flow. A `templates:export-bundle` / `import-bundle`
  pair is a candidate for a future step.

### 11.8 No persistence of `previewDataUrl`
- The data URL needed to draw a preview lives only in the
  renderer's process memory. It is **never** written back to
  `templates.json`, `settings.json`, `scenarios.json`,
  `profiles.json`, or `localStorage`. It is regenerated every
  time `templates:load` reads `templates.json`.

### 11.9 No mobile platforms
- Templates remain a desktop-only feature, in line with the
  rest of the app.



---

## 12. Template matching is mock only (Step 28)

Step 28 introduces a [Template Matching Mock / Dry-run](./TEMPLATE_MATCHING_MOCK.md)
pipeline. Despite the name, **no real image matching happens** in
`0.1.x`. The pipeline:

- consumes the screen-capture preview (Step 25), the active
  template (Step 27), and an optional region (Step 26);
- produces a deterministic mock match record + a planned
  `image_click` action preview;
- renders a bounding box and a target point on top of the preview.

It does **not**:

- decode any pixel of the screenshot or of the template;
- compare any pixel against any other pixel;
- run any image-recognition / template-matching / OCR backend;
- execute any cursor movement or click on the matched location;
- accept the `image_click` action type in scenarios.

### 12.1 Why it is "mock only"

ClickFlow's safety contract gates **all** real matchers and real
input through [`docs/REAL_ACTIONS_GO_NO_GO.md`](./REAL_ACTIONS_GO_NO_GO.md).
Until that gate opens, the matcher remains mock. Smoke check
enforces that `package.json` declares zero of `tesseract`,
`tesseract.js`, `opencv4nodejs`, `@u4/opencv4nodejs`, `opencv.js`,
`sharp`, `jimp`, `pixelmatch`, `looks-same`, `robotjs`, `nut-js`,
`nutjs`, `@nut-tree/nut-js`, `iohook`, `uiohook-napi`,
`node-key-sender`.

### 12.2 The action preview is text-only

The `image_click` action preview is rendered through
`<pre>.textContent`. It is **not** submitted to the click engine,
the action pipeline, the mock adapter, or the dry-run sandbox.
Step 28 stops at the visual representation of the future shape.

### 12.3 No persistence

The mock result lives only in `appState.templateMatching.lastResult`
(renderer memory). It does **not** survive an app restart, and it
is **never** written to disk.

### 12.4 No multi-match, no top-N candidates

The mock returns exactly one bounding box per run.
Top-N candidate matches, multi-match search, and "find all
occurrences" are out of scope for `0.1.x`.

### 12.5 No cross-platform divergence

The mock pipeline is identical on Windows / macOS / Linux. There
is no per-OS code path; every platform receives the same
deterministic result for the same input.



---

## 13. Real preview matching has plain-JS limits (Step 29)

Step 29 introduces a [Real Template Matching Engine](./TEMPLATE_MATCHING_ENGINE.md)
that produces a **real** confidence score against the captured
preview. The engine is intentionally lightweight (plain JS over
Canvas / `ImageData`) so `0.1.x` does not pull in OpenCV.

### 13.1 What "real preview matching" means
- The engine analyses the **screen-capture preview** the user
  captured (Step 25) and the active template (Step 27). It
  does **not** analyse the live screen, the cursor position,
  or the keyboard.
- ClickFlow still does **not** click anywhere. The
  `image_click` action preview is text only.
- `realMatching = false` and `realClick = false` invariants
  hold because the engine analyses the captured preview, not
  the OS screen, and because no click is ever submitted.

### 13.2 Algorithmic limits
- Plain-JS algorithm (mean RGB absolute difference). Runs at
  ~ 8–16 million pixel comparisons per second on a typical
  laptop. Fine for small previews and small templates;
  noticeably slower on very large inputs.
- Big previews are **downscaled** to ≤ 1200×800 before
  matching. Big templates are **downscaled** to ≤ 320×320.
  The bounding box returned to the UI is mapped back to the
  original preview coordinates.
- The cost guard may raise the effective step when the
  estimated comparison count exceeds 16 M. The result's
  `step` shows the actual step used; `requestedStep` shows
  what the user asked for.
- The algorithm is **not** rotation-, scale-, or
  illumination-invariant. It compares pixels at the requested
  position only.
- The engine runs synchronously inside one tick; the renderer
  becomes briefly unresponsive on very large previews. The
  cost guard is the bound on that delay.

### 13.3 No OpenCV yet
- `package.json` declares zero of `opencv4nodejs`,
  `@u4/opencv4nodejs`, `opencv.js`, `opencv-js`, `sharp`,
  `jimp`, `pixelmatch`, `looks-same`. The smoke check
  enforces this. A future step may add a native /
  main-process matcher behind the existing
  `runTemplateMatch` signature; until then the renderer-side
  engine is the only matcher.

### 13.4 Mode coexistence with the Step 28 mock
- The Mock mode from Step 28 is **kept**. Users can switch
  between `Mock` and `Real preview` from the new Match mode
  selector. The result shapes are identical so the renderer
  renders both through the same code.



---

## 14. image_click does not perform a real click (Step 30)

[Step 30](./IMAGE_CLICK_SCENARIO.md) ships a new scenario type
called `image_click` that orchestrates the screen-capture
preview, the region selector, the template assets and the
real preview matching engine into a single executable
scenario. Despite the name, **the scenario never performs a
real click**.

### 14.1 What `image_click` does
- Captures: re-uses whatever preview the user already pinned
  via Screen Capture.
- Matches: runs the Step-29 engine on the preview; never
  on the live screen.
- Simulates: emits an `image_click` action through the
  action-pipeline simulate path. The cursor does not move.
- Reports: writes `progress`, `lastAction`, log entries and
  audit events the same way `simple_click` does.

### 14.2 What `image_click` does NOT do
- Does **not** move the cursor.
- Does **not** click anywhere on the OS.
- Does **not** run OCR / text detection.
- Does **not** load OpenCV / opencv.js / opencv-js / sharp /
  jimp / pixelmatch / looks-same / robotjs / nut.js / iohook
  / uiohook-napi.
- Does **not** auto-recapture the preview between iterations
  — the user is responsible for refreshing the preview
  manually if the screen has changed.

### 14.3 simple_click coexistence
- The existing `simple_click` scenarios are unchanged.
  `validateScenario`, `createScenario`, and `updateScenario`
  dispatch on `type` so old scenarios keep their old shape.
- A scenario without a `type` field is treated as
  `simple_click` for backward compatibility.

### 14.4 No real-click escape hatch
- Both `validateAction` and `validateActionSafety` refuse an
  `image_click` action that carries `realClick: true`. The
  action-pipeline's `executeAction` rejects it with
  `blocked: true` and emits
  `action.imageClick.realBlocked`. Any future real
  integration will require explicit code changes behind
  [`REAL_ACTIONS_GO_NO_GO.md`](./REAL_ACTIONS_GO_NO_GO.md).



## 15. OCR is mock only (Step 32)

Step 32 ships the **OCR Foundation** as a mock-only renderer
feature.

### 15.1 The OCR engine is fake
- `src/ocr-mock-engine.js` fabricates OCR blocks from the
  captured screen-preview metadata (width / height / region /
  target text). It NEVER decodes pixel data and NEVER recognises
  real text.
- `package.json` declares zero of `tesseract`, `tesseract.js`,
  `tesseract-ocr`, `node-tesseract-ocr`, `opencv4nodejs`,
  `@u4/opencv4nodejs`, `opencv.js`, `opencv-js`, `sharp`, `jimp`.
  The mock engine never `require()`s anything.
- The recognised-block confidences (`0.80`–`0.95`) are
  deterministic and have no relationship to the actual content
  of the preview.

### 15.2 No `text_click` scenario yet
- The mock engine builds a `text_click` ACTION PREVIEW
  (`type: "text_click"`, `mode: "preview"`, `realClick: false`,
  `realOcr: false`). The click engine, the action pipeline, the
  mock adapter, and the dry-run sandbox refuse to consume it.
- There is no `text_click` scenario type. `validateScenario`
  still accepts only `simple_click` and `image_click`.
- Saving an `image_click` scenario does NOT pull in any text /
  OCR settings — the OCR slice and the scenarios slice are
  independent.

### 15.3 No real cursor / click from OCR
- Even when a match is found, ClickFlow performs no system
  action. The cursor never moves. No key is pressed. No window
  is focused.
- Future real `text_click` integration is gated behind a
  separate go/no-go review (see
  [`REAL_ACTIONS_GO_NO_GO.md`](./REAL_ACTIONS_GO_NO_GO.md)).

### 15.4 No live-screen OCR
- Mock OCR only sees the preview the user explicitly captured
  in Step 25. It never opens a new screenshot session, never
  reads the live screen, never streams.

See [`docs/OCR_FOUNDATION.md`](./OCR_FOUNDATION.md) for the
full description, the data shapes, the troubleshooting list,
and the safety contract.
