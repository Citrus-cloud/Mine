# Smart Features QA — ClickFlow

> **Step 37 — Smart-features QA pass.**
> This document is a manual checklist that walks the full
> smart-features chain from **Screen Capture → Region Selector →
> Templates → Template Matching → Image Click → OCR Mock →
> Text Click → Visual Builder → Scenario Presets**, plus the
> always-on safety checks. Until a tester ticks every box, the
> default status of every step is **Not tested**.
>
> The QA pass is **simulation-only**. It must never trigger a real
> click, real OCR, real cursor movement, or real keyboard input.

---

## 0. Scope

ClickFlow `0.1.x` is a **simulation-only** desktop MVP. The
smart-features layer covers reading the screen, picking a region,
storing template images, mock matching them, mock recognising text,
and authoring `simple_click` / `image_click` / `text_click`
scenario drafts inside the Visual Builder.

**Out of scope of this document:**
- real desktop clicks (`robotjs` / `nut.js` / `iohook` /
  `uiohook-napi`) — not implemented;
- real OCR (`tesseract`, `tesseract.js`) — not implemented;
- real image matching (`opencv*`, `sharp`, `jimp`) — not
  implemented;
- mobile / Android — not implemented.

These are deliberately tracked as **not implemented** in
[`KNOWN_LIMITATIONS.md`](./KNOWN_LIMITATIONS.md) and
[`SMART_FEATURES_LIMITATIONS.md`](./SMART_FEATURES_LIMITATIONS.md).

---

## 1. Screen Capture QA

**Steps**

1. `npm start`.
2. Open **Advanced → Screen Capture**.
3. Press **Refresh sources**.
4. Select a source.
5. Press **Capture preview**.
6. Press **Clear preview**.

**Expected result**

- The sources grid shows at least one entry per active display.
- `screen.capture.sources.requested` and
  `screen.capture.sources.loaded` appear in the audit list.
- The preview thumbnail renders inside the card.
- The preview's `imageDataUrl` lives only in renderer memory.
- No file appears under `userData/`.
- No new IPC channel is opened beyond `screen-capture:*`.

**Status:** Not tested.

---

## 2. Region Selector QA

**Steps**

1. Capture a preview (Section 1).
2. Open **Advanced → Screen Capture**.
3. Press **Enable region selection**.
4. Drag a rectangle on the preview.
5. Press **Save region**.
6. Press **Attach to active scenario**.
7. Press **Clear region**.

**Expected result**

- The drag overlay follows the cursor inside the preview only.
- `mousemove` / `mouseup` are bound only during the drag and
  unbound on `mouseup`.
- The region card shows preview-space and image-space rectangles.
- `region.selection.completed` appears in the audit list.
- `region.attached.toScenario` appears once attached.
- The active scenario gains `settings.region` (image-space).
- Old scenarios without `region` keep working.
- The screenshot is **never** saved on disk.

**Status:** Not tested.

---

## 3. Template Assets QA

**Steps**

1. Open **Advanced → Templates**.
2. Press **Import**.
3. Pick a small PNG / JPG / WebP.
4. Edit name + description.
5. Press **Select** to make it active.
6. Press **Delete** on a different template.
7. Press **Reset** (clears the storage).
8. Press **Refresh**.

**Expected result**

- Imports of `png` / `jpg` / `jpeg` / `webp` ≤ 16 MiB succeed.
- Other extensions are rejected with a clear message.
- The metadata file is rewritten through the main process; nothing
  is persisted from the renderer.
- `template.import.completed` / `template.metadata.updated` /
  `template.selected` / `template.deleted` / `template.reset`
  appear in the audit list.
- `previewDataUrl` lives only in renderer memory.
- The original filesystem path is never displayed.

**Status:** Not tested.

---

## 4. Template Matching QA

**Steps**

1. Capture a preview (Section 1).
2. Optionally select a region (Section 2).
3. Open **Advanced → Template Matching**.
4. Pick **Mock** mode and press **Run mock match**.
5. Switch to **Real preview** mode.
6. Set Threshold = `0.75`, Step = `4`.
7. Press **Run match**.
8. Press **Clear result**.

**Expected result**

- Mock mode produces deterministic results (numbers and IDs only).
- Real-preview mode runs the plain-JS engine over the captured
  preview only — never the live screen.
- Bounding box, target point, and a confidence number appear.
- Low-confidence runs draw a dashed orange candidate.
- Audit records `template.match.realPreview.requested` /
  `.completed` (or `.failed`).
- No real cursor movement. No real click.

**Status:** Not tested.

---

## 5. Image Click Scenario QA

**Steps**

1. Open **Scenarios → Create**.
2. Pick type `Image click`.
3. Choose an active template.
4. Optionally press **Use selected region**.
5. Set threshold `0.75`, step `4`, timeout `10000`,
   interval `1000`, repeat `1`.
6. Press **Run Test Match** (Step 31 panel).
7. Save the scenario, select it, press **Start**.

**Expected result**

- Test Match draws a debug overlay (region, bbox, target dot).
- Test Match never saves and never clicks.
- The scenario engine emits `scenario.imageClick.simulated`
  cycles.
- `action.imageClick.simulated` enters the audit list.
- `action.imageClick.realBlocked` is **never** emitted in normal
  flow (no `realClick: true` ever appears).
- The cursor never moves. No real click.

**Status:** Not tested.

---

## 6. OCR Mock QA

**Steps**

1. Capture a preview.
2. Optionally select a region.
3. Open **Advanced → OCR**.
4. Enter target text (e.g. `Continue`).
5. Pick language `ru+en`, match mode `contains`, case-sensitive
   off.
6. Press **Run mock OCR**.
7. Inspect the OCR blocks list, the overlay, and the
   `text_click` action preview.
8. Press **Clear OCR result**.

**Expected result**

- The mock engine fabricates a small list of blocks (target text +
  one or more decoys).
- Best match is highlighted; target dot points at its centre.
- The action preview JSON shows `mode: "preview"`,
  `realClick: false`, `realOcr: false`.
- Audit records `ocr.mock.requested` / `ocr.mock.completed` /
  `text.click.preview.created` (or `ocr.mock.failed`).
- The action preview is **never** consumed by the click engine,
  the action pipeline, the mock adapter, or the dry-run sandbox.
- `imageDataUrl` never enters audit / diagnostics / disk.

**Status:** Not tested.

---

## 7. Text Click Scenario QA

**Steps**

1. Capture a preview.
2. Open **Scenarios → Create**.
3. Pick type `Text click`.
4. Set target text, language `ru+en`, match mode `contains`.
5. Optionally press **Use selected region**.
6. Press **Test OCR** (Step 34 panel).
7. Save the scenario, select it, press **Start**.

**Expected result**

- Test OCR renders a coloured headline (matched / failed /
  no-match), metric rows, OCR blocks list, overlay and
  `text_click` action preview.
- Test OCR never saves and never clicks.
- The scenario engine emits `scenario.textClick.simulated` cycles
  with `textLen` (never the full text).
- `action.textClick.simulated` enters the audit list.
- `action.textClick.realBlocked` is **never** emitted in normal
  flow.
- The cursor never moves. No real click. No real OCR.

**Status:** Not tested.

---

## 8. Visual Builder QA

**Steps**

1. Open **Advanced → Visual Builder**.
2. Confirm the status row shows: Screen preview / Region /
   Template / Image match / OCR result / Real clicks.
3. Press the onboarding hint buttons (`Open Screen Capture`,
   `Open Templates`, `Open Region Selector`, `Open OCR`) and
   verify each one switches tabs.
4. Toggle the six overlay checkboxes and press **Show all** /
   **Hide all** / **Clear overlays**.
5. Switch the action-type select between `simple_click`,
   `image_click`, `text_click`.
6. Press **Create scenario draft** with each type.
7. Inspect the **Draft preview** card, then press **Open draft
   in form**.

**Expected result**

- The status row paints `ready` / `missing` / `disabled` badges.
- `Real clicks` is always `disabled`.
- Onboarding hints disappear once the corresponding state slice
  fills up.
- Overlay toggles produce visible overlays on the preview image
  (region = blue dashed, template match = green/orange, OCR
  blocks = yellow dashed, OCR matched block = green solid, target
  points = red, action target = cyan).
- `visualBuilder.overlay.changed` enters the audit list on every
  toggle.
- `visualBuilder.draft.preview.created` enters the audit list on
  every successful draft.
- `visualBuilder.requirement.missing` enters the audit list when
  a hard requirement fails (e.g. `image_click` without a
  template).
- The scenario form opens with type / fields pre-filled and
  **never** auto-saves.

**Status:** Not tested.

---

## 9. Scenario Presets QA

**Steps**

1. Inside Visual Builder, find the Scenario Presets section.
2. Press **Use preset** on each of the three presets
   (`coordinate-basic`, `image-click-basic`, `text-click-basic`).
3. Press **Use with current visual context** on the
   `image-click-basic` preset after capturing a preview, picking
   a region, and selecting an active template.
4. For each draft, inspect the auto-opened scenario form and
   press **Cancel**.
5. Repeat the visual-context flow for `text-click-basic` after
   running mock OCR.

**Expected result**

- The form opens pre-filled per preset:
  - coordinate preset → `simple_click`, `x=500, y=400` (or the
    centre of the selected region), interval / repeat from the
    preset;
  - image preset → `image_click`, threshold / step / timeout /
    interval from the preset, plus active templateId / region
    when "with visual context" is used;
  - text preset → `text_click`, language / matchMode from the
    preset, plus matchedText / region when "with visual context"
    is used.
- `scenarioPreset.selected` enters the audit list.
- `scenarioPreset.draft.created` enters the audit list.
- `scenarioPreset.form.opened` enters the audit list.
- The form **never** auto-saves. Save requires a click on the
  Save button.
- No `imageDataUrl` or pixel buffer enters the preset draft.

**Status:** Not tested.

---

## 10. Safety checks

**Steps**

1. Open the Safety tab.
2. Press **Copy diagnostics**.
3. Inspect the clipboard text.
4. Re-run any scenario from sections 5 / 7 and watch the audit
   list / pipeline status.

**Expected result**

The diagnostics text contains every line below with its safety
flag pinned to `false`:

- `Feature flags: simulationOnly=true, realDesktopActions=false,
  ocr=false, imageRecognition=false`;
- `Action pipeline: ... realActionsEnabled=false,
  realActionsImplemented=false, realActionAllowed=false`;
- `Adapter: ... realAdapterAvailable=false,
  realActionsAllowed=false, simulationOnly=true`;
- `Sandbox: dryRunAvailable=true, realActionsAllowed=false,
  realActionsImplemented=false`;
- `Image click scenario: ... imageClickSimulationOnly=true,
  realImageClickEnabled=false`;
- `Text click scenario: ... textClickSimulationOnly=true,
  realTextClickEnabled=false, realOcrEnabled=false,
  tesseractAvailable=false, ocrEngineImplemented=false`;
- `Visual Builder: ... autoSavesScenarios=false,
  autoRunsScenarios=false, realClick=false, realOcr=false`.

The audit log must never contain `action.real.*` events outside
the `*.realBlocked` family. `npm run smoke` must pass with **0
failures**.

**Status:** Not tested.

---

## 11. Known issues

Issues found during Step-37 QA must be added below as `### YYYY-MM-DD
short title` with reproduction steps, expected vs actual, and
priority. Until a tester runs this checklist, this section is
intentionally empty.

---

## 12. Release recommendation

Recommendation tracker. Update after running every section:

- **Visual Builder UX polish + Scenario Presets:** Not tested.
- **Smart-features chain:** Not tested.
- **Safety invariants:** Not tested.

A release tag may be cut **only when**:

1. Every section above is `Status: Passed`.
2. `npm run smoke` reports `Failed: 0`.
3. `package.json` declares **none** of `robotjs`, `nut-js`,
   `iohook`, `uiohook-napi`, `tesseract`, `tesseract.js`,
   `opencv*`.
4. `realDesktopActions=false`, `simulationOnly=true`,
   `contextIsolation: true`, `nodeIntegration: false` remain
   true at runtime.
5. The next-branch direction is documented in
   [`NEXT_BRANCH_PLAN.md`](./NEXT_BRANCH_PLAN.md).
