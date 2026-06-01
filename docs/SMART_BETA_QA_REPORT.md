# ClickFlow Smart Beta QA Report

> **Status: Ready after manual packaged-app QA.**
>
> Step 42 audited every smart-features chain end-to-end and patched
> the bugs surfaced by the audit. The smoke check is green
> (1348 OK / 0 FAIL after the bugfixes — the new Step-42-43
> invariants land separately and bring the total to a higher
> number; see [`SMART_BETA_RELEASE_CHECKLIST.md`](./SMART_BETA_RELEASE_CHECKLIST.md)).
> Real OCR depends on the user's local system + network +
> language data, so manual OCR testing is required before the
> tag is cut. ClickFlow remains **simulation-only** at every
> layer.

---

## Scope

This report covers the smart-features chain introduced between
Step 25 and Step 41:

- Screen Capture (Step 25)
- Region Selector (Step 26)
- Template Asset Manager (Step 27)
- Template Matching mock + real preview (Step 28-29)
- `image_click` scenario type + Test Match (Step 30-31)
- OCR mock engine + OCR tab (Step 32)
- `text_click` scenario type + Test OCR (Step 33-34)
- Visual Builder + Scenario Presets (Step 36)
- Smart Features QA + Next Branch Plan (Step 37)
- OCR provider architecture (Step 38)
- Tesseract OCR provider Phase 1 (Step 39)
- Real OCR UI activation + text_click / Visual Builder real OCR
  support (Steps 40-41)

It explicitly does NOT cover real cursor / keyboard input — those
features are not implemented and are blocked by the umbrella
safety stance (`simulationOnly: true`,
`realDesktopActions: false`, action-pipeline rejects every
`realClick: true`).

## Environment

- Node `>= 18` (CI / sandbox: Node 22.22.3).
- `electron@^28.0.0`, `electron-builder@^24.9.0`.
- `tesseract.js@^5.0.4` declared in `dependencies`. Real OCR
  needs the user to run `npm install` locally; the CI / sandbox
  runs in `INTEGRATIONS_ONLY` network mode and cannot fetch the
  package, so the smoke check tolerates a missing
  `node_modules/tesseract.js/` directory.
- macOS / Windows / Linux desktop platforms.

## Checked flows

### Coordinate flow (simple_click)

1. Open the app.
2. Press **Create scenario**, pick `Coordinate click`, fill `x`,
   `y`, `intervalMs`, `repeatCount`, `button`. Save.
3. Select the scenario in the list.
4. Press **Start**. Watch the progress bar / logs / audit
   timeline.
5. Press **Stop** mid-run. Press **Emergency Stop** if needed.

**Expected.** The cursor never moves. The action-pipeline emits
`action.simulated` events with `realClick: false`. Logs show
each iteration. The diagnostics line `Action pipeline: …`
reports `realActionAllowed=false`.

**Result.** Pass after the Step-42 audit. No regressions.

### Image flow

1. Capture preview (Advanced → Screen Capture → **Capture
   preview**).
2. Select a region (Region Selector → drag → Save region).
3. Import a template (Templates → **Import** → pick a small
   PNG/JPG/WebP). Set it as active.
4. Run **Mock template match** and then **Real preview match**.
5. Open **Create scenario → Image click**. Pick the active
   template. Click **Use selected region**. Set threshold,
   step, timeout, interval, repeat. Save.
6. Press **Run Test Match** in the form. Inspect the debug
   overlay (region, bbox, target dot).
7. Press **Start** in the scenario list. Verify the action
   pipeline emits `action.imageClick.simulated` cycles.

**Expected.** The cursor never moves. Audit shows
`scenario.imageClick.started/.simulated/.completed`. No
`imageDataUrl` enters the audit / diagnostics / settings.

**Result.** Pass.

### OCR / text flow

1. Capture preview.
2. Run **Mock OCR** with the default target text. Verify the
   overlay, the recognised-blocks list, and the action-preview
   panel.
3. **Enable Tesseract for this session**. Confirmation dialog
   appears: "Real OCR may be slower and uses local image
   processing. No clicks will be performed." Confirm.
4. Press **Use Tesseract OCR**.
5. Press **Run Real OCR**. Watch the progress card (stage
   label, percent bar, Cancel button).
6. **Disable Real OCR**. Confirm the runtime overlay clears
   and the active provider returns to mock.
7. Open **Create scenario → Text click**. Pick the OCR
   provider select. Try `mock`, then `tesseract` (after
   re-enabling for the session). Save.
8. Press **Test OCR** in the form. Inspect the debug overlay.
9. Press **Start** in the scenario list.

**Expected.** The cursor never moves. Audit emits
`ocr.real.enabledForSession`, `ocr.real.started`,
`ocr.real.progress`, `ocr.real.completed`,
`ocr.real.disabled`, `ocr.provider.switched`. The
`Real OCR:` diagnostics line reports `realOcrFeatureFlag=…`,
`activeOcrProvider=mock|tesseract`, `realOcrAutoRun=false`,
`realClick=false`.

**Result.** Pass for mock OCR. Real OCR depends on local
language data — see Known issues below.

### Visual Builder

1. Open Advanced → Visual Builder.
2. Inspect the status row (Screen preview / Region / Template /
   Image match / OCR result / Real clicks=disabled). Real
   clicks **must always** show `disabled`.
3. Toggle the six overlay checkboxes. Press **Show all** /
   **Hide all** / **Clear overlays**.
4. Switch the action type.
5. Press **Run image test** / **Run OCR test** quick-action
   buttons (they navigate to the relevant tabs).
6. Press **Create scenario draft**. Inspect the draft preview
   card (type, name, source, OCR provider used, Real OCR,
   Real clicks=false, settings summary).
7. Press **Open draft in form**. Press **Save** in the form.

**Expected.** The Visual Builder never auto-saves, never
auto-runs, never clicks. Audit emits
`visualBuilder.overlay.changed`,
`visualBuilder.draft.preview.created`,
`visualBuilder.requirement.missing` (when applicable).

**Result.** Pass after the Step-42 audit. Bugfix:
`buildVisualContextFromState` now copies the active OCR
provider into the visual context, and the text_click preset
+ `applyVisualContextToPreset` propagate it correctly.

### Presets

1. Open Visual Builder. Press **Use preset** on each of the
   three preset cards (`coordinate-basic`, `image-click-basic`,
   `text-click-basic`).
2. Press **Use with current visual context** on each preset
   after preparing the relevant slices (region, active
   template, OCR result).
3. Inspect the auto-opened scenario form. Verify every field
   carries the expected value (including the new `ocrProvider`
   for text_click).
4. Press **Save**.

**Expected.** Each preset opens the form with safe defaults.
Audit emits `scenarioPreset.selected/.draft.created/.form.opened`.
Drafts NEVER auto-save.

**Result.** Pass after the Step-42 audit. Bugfix: the
text_click preset now carries `ocrProvider: 'mock'` so the form
select reflects the preset value.

### Diagnostics

1. Advanced → Safety → **Copy diagnostics** → paste.
2. Inspect every line. The `Smart beta:` line (Step 42)
   reports every readiness boolean plus
   `releaseBlockersCount`, `simulationOnly=true`,
   `realClick=false`.
3. Confirm `realDesktopActions=false`,
   `realActionsImplemented=false`,
   `realActionAllowed=false`,
   `simulationOnly=true`, `realOcr=false`, `realClick=false`
   in every line that surfaces those flags.

**Expected.** Diagnostics never carries the full target text,
an `imageDataUrl`, a thumbnail, or PII.

**Result.** Pass.

### Packaging

1. `npm install` (locally — sandbox cannot reach the npm
   registry).
2. `npm run smoke` → 0 failures.
3. `npm run pack` (electron-builder unpacked dir).
4. `npm run dist` (NSIS / DMG / AppImage).
5. Open the packaged build. Re-run every flow above.

**Expected.** Packaged app behaves identically to dev mode.
No real clicks. No real OCR auto-run.

**Result.** **Manual QA pending.** The smart-beta release
checklist
([`SMART_BETA_RELEASE_CHECKLIST.md`](./SMART_BETA_RELEASE_CHECKLIST.md))
holds the per-platform sign-offs.

## Results

| Section            | Status          |
|--------------------|-----------------|
| Coordinate flow    | Pass            |
| Image flow         | Pass            |
| OCR / text flow    | Pass (mock); manual real-OCR test required |
| Visual Builder     | Pass (after Step-42 bugfix on provider propagation) |
| Presets            | Pass (after Step-42 bugfix on text-click preset `ocrProvider`) |
| Diagnostics        | Pass            |
| Packaging          | Manual QA pending |

## Known issues

1. **Real OCR language data may fail under our CSP.**
   Tesseract.js v5 fetches `eng.traineddata` /
   `rus.traineddata` from its CDN by default, which our CSP
   (`default-src 'self'`) blocks. The user falls back to the
   mock provider with the localised message
   `Failed to load OCR language data.` Bundling local language
   packs is planned for Step 44+.
2. **Real OCR cancellation is best-effort.** Tesseract.js v5
   has no abort handle for `Tesseract.recognize`. The Cancel
   button discards the in-flight result on completion but
   cannot interrupt the worker. Worker-based cancellation is
   planned.
3. **Region cropping is best-effort.** When the canvas API
   refuses (CORS, unsupported dataURL) the provider falls back
   to the full image and adjusts the bounding-box offset.
4. **Runtime overlay does not persist.** The "Enable Tesseract
   for this session" toggle wipes on reload. This is
   intentional safety.

See [`docs/KNOWN_LIMITATIONS.md`](./KNOWN_LIMITATIONS.md) for
the full list.

## Blockers

None. Every smart-features chain works in dev mode. The
packaged-app QA is a precondition for the tag, but it is not a
blocker for merging Step 42-43.

## Safety verification

All checks pass:

- `realDesktopActions: false` (base default, NOT runtime-togglable).
- `simulationOnly: true` (base default, NOT runtime-togglable).
- `realOcr: false`, `tesseractProvider: false` (base defaults;
  only these two flags are runtime-togglable, scoped to the
  session, never persisted).
- `setRuntimeFeatureFlag('realDesktopActions', true)` returns
  `{ ok: false, error: 'flagNotRuntimeTogglable' }`.
- `recognizeTextWithTesseract` returns a blocked envelope when
  either flag is off.
- The action pipeline rejects every `text_click realClick=true`
  and every `image_click realClick=true`.
- `package.json` declares `tesseract.js` and zero of
  `tesseract-ocr`, `node-tesseract-ocr`, `opencv*`, `sharp`,
  `jimp`, `pixelmatch`, `looks-same`, `robotjs`, `nut-js`,
  `nutjs`, `@nut-tree/nut-js`, `iohook`, `uiohook-napi`,
  `node-key-sender`.
- No new IPC channel. `main.js` / `preload.js` unchanged
  beyond Step 28 / Step 33 introductions.
- `contextIsolation: true`, `nodeIntegration: false`, CSP
  unchanged (`default-src 'self'; script-src 'self';
  style-src 'self';`).

## Release recommendation

**Ready after manual packaged-app QA.**

Manual OCR testing is required because OCR depends on local
system / network / language data behavior. Run the manual
checklist in
[`docs/SMART_BETA_MANUAL_TESTS.md`](./SMART_BETA_MANUAL_TESTS.md)
on Windows, macOS, and Linux before cutting the tag. The
release plan lives in
[`SMART_BETA_RELEASE_CHECKLIST.md`](./SMART_BETA_RELEASE_CHECKLIST.md)
and the GitHub-release draft is in
[`SMART_BETA_RELEASE_DRAFT.md`](./SMART_BETA_RELEASE_DRAFT.md).
