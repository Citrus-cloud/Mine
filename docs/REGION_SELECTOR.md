# Region Selector (Step 26)

ClickFlow `0.1.x` has a **region selector foundation** built on top
of the screen-capture preview from Step 25. This document describes
what the foundation is, what it deliberately is **not**, and the
safety / privacy contract it ships with.

> Status: **simulation-only** and **preview-only**. The region
> selector turns the user's mouse drag into a rectangle. It never
> performs a click, never runs OCR, never runs image matching, and
> never saves a screenshot or any rectangle pixels to disk.

---

## 1. Purpose

The region selector exists so that future ClickFlow steps can build
smart visual features on top of an audited primitive. The features
themselves are out of scope for `0.1.x`. The roadmap targets:

- "click on a found image / icon" inside a region;
- "click on a found text" inside a region;
- template matching scoped to the region;
- OCR scoped to the region;
- visual scenario builder that uses the region as an anchor.

None of those features are implemented in Step 26. Step 26 only
adds the rectangle plumbing those steps will consume.

---

## 2. Current status

- Pure logic in [`src/region-selector.js`](../src/region-selector.js)
  — `createRegion`, `normalizeRegion`, `validateRegion`,
  `scaleRegionToImage`, `scaleRegionToPreview`, `getRegionArea`,
  `formatRegion`, `createEmptyRegionState`. No DOM, no IPC, no I/O.
- Renderer state slice `appState.regionSelector` in
  [`src/app-state.js`](../src/app-state.js) with 8 mutators
  (`setRegionSelecting`, `setSelectedRegion`,
  `setNormalizedRegion`, `setRegionPreviewSize`,
  `setRegionImageSize`, `setRegionError`, `clearSelectedRegion`,
  `resetRegionSelectorState`). `getState()` deep-copies the slice.
- Renderer drag overlay in
  [`src/region-selector-ui.js`](../src/region-selector-ui.js):
  `attachRegionOverlay`, `enable/disableRegionSelection`,
  `handleRegionMouseDown/Move/Up`, `renderRegionSelectorCard`,
  `renderRegionSelection`, `renderRegionInfo`,
  `clearRegionSelection`, `saveRegionSelection`,
  `attachRegionToActiveScenario`. Mounts itself on the wrapper
  built by `screen-capture-ui.js`.
- Scenario format gained an **optional**
  `settings.region = { x, y, width, height }` (image-space) on
  `simple_click` scenarios. Updates go through new
  [`scenario-manager.js`](../src/scenario-manager.js) helpers
  `updateScenarioRegion`, `clearScenarioRegion`,
  `validateRegionSettings`. Old scenarios without `settings.region`
  keep working unchanged.
- Audit allowlist gained six event types in
  [`src/audit-events.js`](../src/audit-events.js):
  `region.selection.started`, `region.selection.updated`,
  `region.selection.completed`, `region.selection.cleared`,
  `region.attached.toScenario`, `region.validation.failed`.
  Payloads carry only numeric metadata (rectangle dimensions,
  scenario id) — never an `imageDataUrl`.
- Diagnostics gained a compact **Region selector status** card in
  Advanced → Safety, plus a `Region selector: …` line in
  `Copy diagnostics`.
- Styles in `src/styles.css` Section 18.
- 22 RU + 22 EN i18n keys.
- Smoke check extended in `scripts/smoke-check.js`.

---

## 3. How region selection works

### 3.1 The user gesture

1. The user opens **Advanced → Screen Capture** and captures a
   preview (Step 25).
2. They click **Enable region selection** in the Region Selector
   card. The overlay above the preview becomes interactive
   (`pointer-events: auto`, `cursor: crosshair`, dashed outline).
3. They press the left mouse button on the preview, drag, and
   release. ClickFlow tracks `start` and current pointer, builds a
   rectangle via `createRegion`, and re-renders the overlay
   `<div class="region-selection">` on every `mousemove`.
4. On `mouseup`, the rectangle is validated (`validateRegion`
   requires `width > 5`, `height > 5`, non-negative origin). If
   valid, it is projected from preview-space to image-space via
   `scaleRegionToImage` and stored in
   `appState.regionSelector.normalizedRegion`. If invalid, the
   selection is dropped and an audit `region.validation.failed`
   event is recorded.
5. The user may then **Clear region** (drop both rectangles),
   **Save region** (re-snapshot the projection — useful if the
   window was resized between drag and save), or
   **Attach to active scenario** (call
   `updateScenarioRegion(activeScenarioId, normalizedRegion)`,
   which stores an image-space rectangle inside
   `scenario.settings.region`).

### 3.2 Listener lifecycle

`mousemove` and `mouseup` are bound on `document` **only for the
duration of an active drag**. They are detached the moment the
user releases the button or the user switches tabs. The overlay's
own `mousedown` handler is only attached while the Screen Capture
tab is rendered, and `attachRegionOverlay` detaches old listeners
before binding new ones — so we never leak listeners across
re-renders.

### 3.3 Idempotency

Re-rendering the Screen Capture tab recreates the overlay DOM
node. `attachRegionOverlay` is idempotent — if a `.region-overlay`
already exists in the wrapper, it is reused; otherwise it is built.
The visual rectangle (`.region-selection`) is `display: none` until
the user has dragged at least one pixel.

---

## 4. Preview coordinates vs. image coordinates

ClickFlow always works with **two** coordinate spaces and stores
both:

| Space          | Meaning                                                              | Stored in                                  |
|----------------|----------------------------------------------------------------------|--------------------------------------------|
| Preview pixels | The rectangle the user drew, in the displayed `<img>` element's CSS pixels. | `appState.regionSelector.selectedRegion`   |
| Image pixels   | The same rectangle re-projected onto the original screenshot pixels (`preview.width × preview.height` from the IPC payload). | `appState.regionSelector.normalizedRegion` |

Projection is uniform (`sx = imageWidth / previewWidth`,
`sy = imageHeight / previewHeight`) and clamped to the image
bounds. If preview or image size is missing (e.g. the image hasn't
laid out yet, or the IPC didn't return dimensions), `normalizedRegion`
is left `null` and the user can re-trigger projection by clicking
**Save region**.

A future image-matching / OCR step is expected to consume the
**image-space** rectangle and never the preview-space one.

---

## 5. Scenario region settings

When the user clicks **Attach to active scenario**, the renderer
calls `updateScenarioRegion(scenarioId, normalizedRegion)`. The
scenario stored in `scenarios.json` will then look like this:

```json
{
  "id": "my-scenario",
  "name": "Demo",
  "type": "simple_click",
  "settings": {
    "x": 500,
    "y": 400,
    "intervalMs": 500,
    "repeatCount": 100,
    "button": "left",
    "region": { "x": 320, "y": 180, "width": 480, "height": 270 }
  },
  "meta": { "createdAt": "...", "updatedAt": "..." }
}
```

### 5.1 Validation

`validateRegionSettings(region)` returns `{ valid: boolean, error: string|null }`:

- `region === null` / `undefined` → valid (the field is optional).
- `region.x < 0`, `region.y < 0`, non-finite, missing → invalid.
- `region.width <= 0`, `region.height <= 0`, non-finite → invalid.

### 5.2 Backward compatibility

Old scenarios without `settings.region` keep working unchanged.
Every reader uses `if (sc.settings.region)` before consuming it.
The click engine ignores `settings.region` entirely — the field
exists today only as an anchor for future image-matching / OCR
steps.

### 5.3 Removing a region

`clearScenarioRegion(scenarioId)` deletes only the `settings.region`
field, leaves every other `settings.*` value intact, and stamps
`meta.updatedAt`. Calling it on a scenario without a region is a
no-op success (idempotent).

---

## 6. What is **not** implemented yet

The following remain absent in Step 26 and remain blocked by the
existing safety contract:

- real mouse / keyboard input;
- automatic clicks anywhere — including inside the region;
- "click on the centre of the region" / "click and drag through the
  region";
- template matching scoped to the region;
- OCR scoped to the region;
- image recognition;
- captcha / anti-bot bypass;
- automation against banking, payment, or other protected apps;
- mobile platforms;
- saving the rectangle's pixels (the captured area) to disk;
- saving the screenshot to disk;
- multi-region selection;
- non-rectangular regions;
- rotation, scale, or other geometric transforms.

If any future step adds one of these, it goes through the existing
safety review per
[`docs/REAL_ACTIONS_GO_NO_GO.md`](./REAL_ACTIONS_GO_NO_GO.md).

---

## 7. Future use for image matching / OCR

The region selector is a **coordinate primitive**. Future steps
that add image matching, template matching, or OCR will:

1. file a safety review (`docs/REAL_ACTIONS_GO_NO_GO.md`);
2. introduce a new feature flag with safe defaults
   (`src/feature-flags.js`);
3. extend the audit allowlist with new, scoped event types
   (`src/audit-events.js`);
4. consume `scenario.settings.region` (image-space) without
   modifying its shape;
5. update this document, [`docs/SCREEN_CAPTURE.md`](./SCREEN_CAPTURE.md),
   [`docs/SECURITY_CHECKLIST.md`](./SECURITY_CHECKLIST.md), and
   [`docs/KNOWN_LIMITATIONS.md`](./KNOWN_LIMITATIONS.md);
6. extend `npm run smoke` with new invariants.

Until then, the region selector is read-only and inert.

---

## 8. Privacy / safety notes

- **No pixel data ever crosses an IPC boundary because of the
  region selector.** The rectangle is a four-number tuple. The
  preview itself is bound by the Step 25 contract (preview-only,
  not saved to disk).
- **No automatic action is taken because of a region.** The
  rectangle is metadata. Nothing in the app reads
  `appState.regionSelector` or `scenario.settings.region` to
  trigger a click, an OCR call, or any other side effect.
- **No persistence by default.** `appState.regionSelector` lives
  only in the renderer's memory. The only path that writes a
  region to disk is the explicit **Attach to active scenario**
  action, which goes through the existing scenario-save pipeline
  (`saveScenarios()`) — same code path used by every other
  scenario edit.
- **Audit payloads are pixel-free.** Each of the six new event
  types carries only counts, dimensions, and the scenario id (for
  `region.attached.toScenario`). No `imageDataUrl`, no PII, no
  filesystem path, no native-error string.
- **DOM safety.** The overlay is a tree of empty `<div>`s. The
  rectangle's coordinate badge renders the rectangle text via
  `textContent` (not `innerHTML`). The image's `src` continues to
  come exclusively from the safe IPC payload.
- **Six-layer safety contract is unchanged.** `realDesktopActions=false`,
  `simulationOnly=true`, `realActionsImplemented=false` —
  unchanged from Steps 17–25.

---

## 9. Files touched in Step 26

- `src/region-selector.js` — new pure-logic module.
- `src/region-selector-ui.js` — new renderer overlay / UI module.
- `src/app-state.js` — new `regionSelector` slice + 8 mutators.
- `src/audit-events.js` — 6 new allowlisted event types.
- `src/scenario-manager.js` — `validateRegionSettings`,
  `updateScenarioRegion`, `clearScenarioRegion`.
- `src/screen-capture-ui.js` — preview wrapped in
  `.screen-preview-wrapper`; overlay attached; region card
  appended.
- `src/renderer.js` — Region selector diagnostics card; new
  `Region selector: …` line in `Copy diagnostics`.
- `src/index.html` — script tags for `region-selector.js` and
  `region-selector-ui.js`.
- `src/styles.css` — Section 18 (Region Selector).
- `src/i18n.js` — 22 RU + 22 EN keys.
- `docs/REGION_SELECTOR.md` (this file).
- `docs/SCREEN_CAPTURE.md`, `docs/ACTION_SCHEMA.md`,
  `docs/SECURITY_CHECKLIST.md`, `docs/KNOWN_LIMITATIONS.md`,
  `docs/SMOKE_TESTS.md` — Step 26 entries.
- `README.md`, `PROJECT_CONTEXT.md`, `CHANGELOG.md` — Step 26 entries.
- `scripts/smoke-check.js` — Step 26 invariants.



---

## Step 28 — Region scopes the mock matcher

Step 28 introduces a [Template Matching Mock / Dry-run](./TEMPLATE_MATCHING_MOCK.md)
that consumes the optional region from
`appState.regionSelector.normalizedRegion`. When a region is
present:

- the mock bounding box is constructed **inside** the region
  (centered, capped to half the region's width / height on each
  axis so it always fits visibly);
- the mock target point is the center of that bounding box;
- the visual overlay renders the region as a dashed rectangle
  underneath the (solid) match rectangle so the user can tell
  the search area apart from the match.

The region is still preview-anchored: clearing the screen-capture
preview clears the region selector AND the matching result.
Scenarios that already have a region attached via
`scenario.settings.region` remain untouched — the click engine
ignores the field, exactly like in Step 26.

See [`docs/TEMPLATE_MATCHING_MOCK.md`](./TEMPLATE_MATCHING_MOCK.md).
