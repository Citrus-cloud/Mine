# ClickFlow Smart Desktop Beta — Release Checklist

> **Step 43 — pre-release checklist for the smart desktop beta.**
> Tick every item before cutting the `v0.2.0-smart-beta` tag.
> ClickFlow stays **simulation-only** at every layer. Real
> cursor work is NOT in this release.

---

## 0. Tag plan

- **Suggested tag:** `v0.2.0-smart-beta`
- **`package.json` `version`:** `0.2.0-beta` (semver-clean
  pre-release identifier; `-smart-beta` is the human-facing
  release-tag suffix only).
- **Pre-release flag on GitHub:** **yes**.

## 1. Engineering checks

- [ ] `npm install` succeeds on a clean checkout.
- [ ] `npm run smoke` reports `0 Failed`.
- [ ] `node --check` passes for every modified module.
- [ ] `package.json` declares `tesseract.js` and ZERO of
      `tesseract-ocr`, `node-tesseract-ocr`, `opencv4nodejs`,
      `@u4/opencv4nodejs`, `opencv.js`, `opencv-js`, `sharp`,
      `jimp`, `pixelmatch`, `looks-same`, `robotjs`, `nut-js`,
      `nutjs`, `@nut-tree/nut-js`, `iohook`, `uiohook-napi`,
      `node-key-sender`.
- [ ] `main.js` keeps `contextIsolation: true` and
      `nodeIntegration: false`.
- [ ] `src/index.html` keeps the CSP `default-src 'self';
      script-src 'self'; style-src 'self';`.
- [ ] No new IPC channel introduced beyond the Step 25-34
      smart-features set.

## 2. Smart-features dev-mode QA

- [ ] `npm start` opens the app on the host OS.
- [ ] **Coordinate flow** — create + run `simple_click`. Cursor
      never moves. Audit emits `action.simulated` cycles.
- [ ] **Screen capture** — capture preview, clear preview.
      Audit emits `screen.capture.preview.captured/.cleared`.
- [ ] **Region selector** — select + save + attach + clear.
      Audit emits `region.selection.completed`,
      `region.attached.toScenario`.
- [ ] **Templates** — import, set active, delete, reset.
      Audit emits `template.import.completed`,
      `template.selected`, `template.deleted`, `template.reset`.
- [ ] **Template matching** — mock + real-preview. Result card
      shows bounding box + target dot + confidence.
- [ ] **`image_click` scenario** — Test Match draws debug
      overlay; Start runs simulation cycles. Cursor never
      moves.
- [ ] **Mock OCR** — Run mock OCR shows blocks list +
      overlay + action preview.
- [ ] **Real OCR session** — Enable Tesseract for this session
      (confirmation dialog appears), Use Tesseract OCR, Run
      Real OCR. Progress card renders. After Disable Real OCR
      / reload, Run Real OCR is disabled again.
- [ ] **`text_click` scenario** — Mock and Tesseract paths.
      Tesseract path refuses without session opt-in. Cursor
      never moves.
- [ ] **Visual Builder** — overlays toggle, draft preview shows
      `OCR provider used` + `Real OCR`. Drafts NEVER auto-save.
- [ ] **Presets** — coordinate / image / text. The text_click
      preset opens the form with `OCR provider` set to `mock`
      (Step 42 bugfix).
- [ ] **Diagnostics** — Copy diagnostics carries the `Smart
      beta:` line (every readiness boolean +
      `releaseBlockersCount` + `simulationOnly=true` +
      `realClick=false`). No `imageDataUrl` / full target text
      / PII anywhere.
- [ ] **Safety** — `setRuntimeFeatureFlag('realDesktopActions',
      true)` returns `flagNotRuntimeTogglable`. Action pipeline
      rejects every `realClick: true` outright.

## 3. Packaging

- [ ] `npm run pack` produces an unpacked dir under `dist/`.
- [ ] Inspect `dist/<platform>/resources/app.asar` (or
      unpacked dir): NO `userData/`, NO temporary screenshots,
      NO `.env`, NO `dist/` recursion, NO `coverage/`.
- [ ] `npm run dist` produces installable artifacts:
      - **Windows:** `ClickFlow Setup x.y.z.exe` (NSIS).
      - **macOS:** `ClickFlow-x.y.z.dmg`.
      - **Linux:** `ClickFlow-x.y.z.AppImage`.
- [ ] Each artifact opens on the target OS.
- [ ] Re-run section 2 against the packaged build on each
      target OS.

## 4. Documentation

- [ ] `README.md` updated to Steps 42-43.
- [ ] `PROJECT_CONTEXT.md` updated to Steps 42-43.
- [ ] `CHANGELOG.md` carries Step 42 + Step 43 entries.
- [ ] `RELEASE_NOTES.md` references the smart-beta release
      notes.
- [ ] `docs/SMART_BETA_QA_REPORT.md` exists and reports the
      expected pass / blocker state.
- [ ] `docs/SMART_BETA_MANUAL_TESTS.md` exists with the
      per-section `Status: Not tested` placeholders ready for
      manual QA.
- [ ] `docs/SMART_BETA_RELEASE_NOTES.md` exists.
- [ ] `docs/SMART_BETA_RELEASE_DRAFT.md` exists.
- [ ] `docs/TAG_AND_RELEASE_GUIDE.md` adds the smart-beta tag
      plan.
- [ ] `docs/SECURITY_CHECKLIST.md` carries the smart-beta
      safety section.
- [ ] `docs/KNOWN_LIMITATIONS.md` carries the smart-beta
      limitations section.

## 5. Release sign-off

- [ ] Engineering ✓ (sections 1-3)
- [ ] Documentation ✓ (section 4)
- [ ] Manual QA ✓ on Windows.
- [ ] Manual QA ✓ on macOS.
- [ ] Manual QA ✓ on Linux.
- [ ] Cut tag `v0.2.0-smart-beta`.
- [ ] Publish GitHub release as **pre-release** with the body
      from `docs/SMART_BETA_RELEASE_DRAFT.md` and the
      installable artifacts attached.

If any item fails, file the result in
[`docs/SMART_BETA_QA_REPORT.md`](./SMART_BETA_QA_REPORT.md)
under "Blockers" and resolve before re-attempting the tag.
