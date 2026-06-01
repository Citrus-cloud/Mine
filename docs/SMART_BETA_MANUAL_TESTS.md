# ClickFlow Smart Beta — Manual Test Checklist

> **Step 42 — manual QA checklist for the smart-features chain.**
> Every section below carries Steps + Expected result + a
> `Status: Not tested` placeholder. Tick each section after
> running the corresponding flow. Real OCR sections must be
> exercised on each target OS (Windows, macOS, Linux) because
> Tesseract.js performance and language-data availability vary.

ClickFlow stays **simulation-only**: the cursor never moves, the
keyboard never receives input, and the action pipeline rejects
every `realClick: true` outright.

---

## 1. Install and launch

**Steps**

1. `npm install` (one-time — pulls `tesseract.js` and the
   Electron toolchain).
2. `npm run smoke`.
3. `npm start`.

**Expected**

- `npm install` succeeds without errors.
- `npm run smoke` reports `0 Failed`.
- The Electron window opens. Logs panel is empty. Status is
  "Idle". Default scenario list contains the seeded examples.

**Status:** Not tested.

## 2. Smoke check

**Steps**

1. `npm run smoke`.

**Expected**

- 0 failures.
- Counts match the per-step running totals (Step 41: 1348;
  Step 42: 1348 + Step-42 invariants; Step 43: + Step-43
  invariants).
- The script does NOT spawn Electron, does NOT hit the
  network, does NOT touch the filesystem outside the
  repository.

**Status:** Not tested.

## 3. Screen capture

**Steps**

1. Advanced → Screen Capture → **Refresh sources**.
2. Pick a source.
3. **Capture preview**.
4. **Clear preview**.

**Expected**

- Source list populates.
- The captured preview renders inside the card.
- Audit emits `screen.capture.sources.requested`,
  `screen.capture.preview.captured`, `screen.capture.preview.cleared`.
- The screenshot is held only in renderer memory; nothing is
  written to disk.

**Status:** Not tested.

## 4. Region selector

**Steps**

1. After Section 3, switch to **Region Selector**.
2. Drag a rectangle.
3. **Save region**.
4. **Attach to active scenario**.
5. **Clear region**.

**Expected**

- The drag overlay tracks the cursor inside the preview.
- The region card shows preview-space and image-space
  rectangles.
- Audit emits `region.selection.completed`,
  `region.attached.toScenario`, `region.cleared`.

**Status:** Not tested.

## 5. Templates

**Steps**

1. Advanced → Templates → **Import** → pick a small
   PNG/JPG/WebP.
2. Edit name + description.
3. **Select** to make it active.
4. **Delete** another template.
5. **Reset** the storage.

**Expected**

- Imports of `png` / `jpg` / `jpeg` / `webp` ≤ 16 MiB succeed.
- Other extensions are rejected with a clear message.
- Audit emits `template.import.completed`,
  `template.metadata.updated`, `template.selected`,
  `template.deleted`, `template.reset`.
- The metadata file is rewritten through the main process.
- The original filesystem path is never displayed.

**Status:** Not tested.

## 6. Template matching

**Steps**

1. After Sections 3-5, switch to **Template Matching**.
2. Pick **Mock** mode → **Run mock match**.
3. Switch to **Real preview** mode.
4. Set Threshold = `0.75`, Step = `4`. **Run match**.
5. **Clear result**.

**Expected**

- Mock mode produces deterministic results.
- Real-preview mode runs the plain-JS engine over the
  captured preview only.
- The result card shows bounding box, target point, confidence.
- Low-confidence runs draw a dashed orange candidate.
- Audit emits `template.match.realPreview.requested/.completed/.failed`.
- No real cursor movement. No real click.

**Status:** Not tested.

## 7. image_click scenario

**Steps**

1. **Create scenario** → pick `Image click`.
2. Choose an active template.
3. **Use selected region**.
4. Set threshold `0.75`, step `4`, timeout `10000`, interval
   `1000`, repeat `1`.
5. **Run Test Match**.
6. Save the scenario, select it, **Start**.

**Expected**

- Test Match draws a debug overlay (region, bbox, target dot).
- The scenario engine emits `scenario.imageClick.started/.simulated/.completed`.
- `action.imageClick.simulated` enters the audit list.
- The cursor never moves. No real click.

**Status:** Not tested.

## 8. OCR mock

**Steps**

1. After Section 3, switch to **OCR**.
2. Type a target text.
3. Pick language `ru+en`, match mode `contains`.
4. **Run mock OCR**.
5. **Clear OCR result**.

**Expected**

- The mock fabricates a small list of blocks.
- Best match is highlighted; target dot points at its
  centre.
- The action preview JSON shows `mode: 'preview'`,
  `realClick: false`, `realOcr: false`.
- Audit emits `ocr.mock.requested/.completed/.cleared`.

**Status:** Not tested.

## 9. Real OCR session

**Steps**

1. After Section 3, switch to **OCR**.
2. **Enable Tesseract for this session**. Confirm the
   "Real OCR may be slower and uses local image processing. No
   clicks will be performed." dialog.
3. **Use Tesseract OCR**.
4. **Run Real OCR**.
5. Watch the progress card (stage label, percent bar, Cancel
   button).
6. After the run, inspect the result card.
7. **Disable Real OCR**.
8. Reload the renderer (Ctrl/Cmd + R).
9. Confirm the runtime overlay is empty (Run Real OCR is
   disabled again).

**Expected**

- The Run Real OCR button is enabled only after **all** of:
  runtime overlay set, active provider is `tesseract`, screen
  preview present.
- Audit emits
  `ocr.real.enabledForSession/.started/.progress/.completed/.disabled`,
  `ocr.provider.switched`.
- After Disable Real OCR or reload, the active provider is
  `mock` and the Run Real OCR button is disabled.
- If language data fails to load (CSP blocks the CDN), the
  result card shows the localised
  `Failed to load OCR language data.` message and the user
  can fall back to the mock provider.
- The cursor never moves. No real click.

**Status:** Not tested.

## 10. text_click scenario

**Steps**

1. **Create scenario** → pick `Text click`.
2. Set target text, language, match mode.
3. **OCR provider**: try `Use Mock OCR` first, then
   `Use Tesseract OCR` (after Section 9).
4. **Test OCR** in the form for both providers.
5. Save and run the scenario for both providers.

**Expected**

- The form select persists per-scenario.
- With `tesseract` and no session opt-in, the click engine
  fails with the localised
  `Tesseract OCR is disabled. Enable it for this session or
  use mock OCR.` message.
- Each iteration emits a simulated `text_click` action.
  `realClick: false` always; `realOcr: true` only on the
  Tesseract path.
- The cursor never moves. No real click.

**Status:** Not tested.

## 11. Visual Builder

**Steps**

1. Advanced → **Visual Builder**.
2. Confirm the status row (`Screen preview`, `Region`,
   `Template`, `Image match`, `OCR result`, `Real clicks: disabled`).
3. Toggle the six overlay checkboxes. **Show all** / **Hide
   all** / **Clear overlays**.
4. Switch the action type.
5. Press **Create scenario draft**.
6. Inspect the draft preview card. For text_click confirm
   "OCR provider used" + "Real OCR".
7. **Open draft in form**. Save manually.

**Expected**

- The status row paints the right badges. `Real clicks` is
  always `disabled` (red).
- Onboarding hints appear / disappear based on slice state.
- Overlay toggles produce visible overlays on the preview.
- Audit emits `visualBuilder.overlay.changed`,
  `visualBuilder.draft.preview.created`,
  `visualBuilder.requirement.missing`.
- The Visual Builder never auto-saves, never auto-runs.

**Status:** Not tested.

## 12. Presets

**Steps**

1. Visual Builder → **Use preset** on each of the three
   preset cards.
2. **Use with current visual context** on each preset after
   preparing the relevant slices.
3. Inspect each pre-filled scenario form (in particular the
   text_click form's `OCR provider` select).
4. **Save**.

**Expected**

- The text_click preset opens the form with `ocrProvider:
  'mock'` (Step 42 bugfix). `Use with current visual context`
  swaps it to `tesseract` only when the OCR tab's active
  provider is `tesseract`.
- Audit emits `scenarioPreset.selected/.draft.created/.form.opened`.
- Presets NEVER auto-save.

**Status:** Not tested.

## 13. Diagnostics

**Steps**

1. Advanced → Safety → **Copy diagnostics** → paste.

**Expected**

- The text contains the `Smart beta:` line (Step 42) with
  every readiness boolean and `releaseBlockersCount`,
  `simulationOnly=true`, `realClick=false`.
- `Real OCR:` line reflects the runtime overlay
  (`realOcrFeatureFlag=…`, `activeOcrProvider=…`,
  `realOcrAutoRun=false`, `realClick=false`).
- `Action pipeline:` line reports
  `realActionAllowed=false`.
- No `imageDataUrl` / full target text / PII anywhere.

**Status:** Not tested.

## 14. Safety

**Steps**

1. Try `setRuntimeFeatureFlag('realDesktopActions', true)`
   from DevTools.
2. Try emitting a `realClick: true` action through DevTools.
3. Inspect the audit list.

**Expected**

- The setter returns
  `{ ok: false, error: 'flagNotRuntimeTogglable' }`.
- The action pipeline rejects with `realClick=true is blocked`
  and emits `action.real.blocked`.
- `realDesktopActions=false` stays false in the diagnostics.

**Status:** Not tested.

## 15. Packaging

**Steps**

1. `npm run pack` → unpacked dir under `dist/`.
2. `npm run dist` → installable artifacts (NSIS / DMG /
   AppImage).
3. Run the packaged build on each target OS.
4. Re-run every section above against the packaged build.

**Expected**

- The packaged build is a thin wrapper around the renderer
  bundle. No userData / temporary screenshots leak into the
  artifacts.
- All flows behave identically to dev mode.

**Status:** Not tested.
