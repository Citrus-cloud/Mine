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
