# Changelog

All notable changes to **ClickFlow** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project follows a step-based development log (see README).
This project is currently in **beta** — `simulation-only`.

---

## [Unreleased] — Step 45 — Post-release cleanup and feedback tracking

Post-release / post-smart-beta cleanup for `v0.2.0-smart-beta`
(`package.json` `version: "0.2.0-beta"`). No new large features and
**no real desktop actions** were added. ClickFlow stays
**simulation-only**.

### Clarified

- **Step 44 was a final testing / release-preparation milestone**,
  not a standalone runtime feature. It covered the final smart-beta
  sign-off before the `v0.2.0-smart-beta` tag: `npm install`,
  `npm run smoke`, `npm start`, `npm run pack`, `npm run dist`,
  manual packaged-app QA, and verifying that the app launches, the
  smoke-check passes, the packaged app works, real desktop clicks
  are still disabled, and the release docs / tag plan / release
  notes are in place. It therefore has **no** files such as
  `src/step-44.js`.

### Added (docs)

- **`docs/POST_RELEASE_CHECKLIST.md` (new).** Post-release checklist
  for `v0.2.0-smart-beta`: Release verification, Smoke after
  release, Feedback tracking, Follow-up.
- **`docs/FEEDBACK_TRIAGE.md` (new).** Feedback triage guide:
  Purpose, Issue labels, Severity levels (S0 security/safety, S1
  app cannot launch, S2 core flow broken, S3 feature bug, S4
  polish/docs), Priority levels (P0 immediate, P1 next patch, P2
  planned, P3 backlog), Bug triage process, Feature request process,
  Safety report process, Release-blocker criteria, When to make
  v0.2.1, When to defer to v0.3.0.
- **`docs/V0_2_1_PATCH_PLAN.md` (new).** Bugfix-only patch plan:
  Scope, Allowed changes (crash fixes / broken UI / missing
  translations / packaging / smoke-check / docs / minor UX), Not
  allowed changes (real desktop clicks / new OCR engine changes /
  new OpenCV / mobile / major refactor), Candidate fixes, QA
  checklist, Release checklist.
- **`docs/V0_3_0_REAL_ADAPTER_BRANCH_PLAN.md` (new).** Real-adapter
  research branch **plan only** (no real clicks implemented): Goal,
  Why a separate branch, Safety prerequisites, Feature flags,
  Adapter architecture, OS permissions, Emergency stop audit, Audit
  log persistence, Manual confirmation flow, Test matrix, Rollback
  plan, Disallowed use cases. States explicitly that real desktop
  actions remain disabled until the safety review passes, that there
  is no captcha / anti-bot / ad-click / banking automation, that the
  real adapter must sit behind a feature flag, and that the action
  pipeline blocks by default.

### Changed

- `README.md` — current status updated to the post-release / Step 45
  phase; added Step 44 (release/testing milestone) and Step 45
  history; links to the four new docs; how to send feedback; where
  to read known limitations; next patch `v0.2.1`; future `v0.3.0`
  real-adapter research line.
- `PROJECT_CONTEXT.md` — current step set to Step 45; Step 44
  explained as a release/testing milestone; final release commands
  recorded; post-release cleanup + feedback tracking + v0.2.1 patch
  plan + v0.3.0 branch plan noted; simulation-only and real clicks
  disabled re-asserted.
- `docs/ROADMAP.md` — refreshed `v0.2.1` (bugfixes / packaging / UI
  / translation / docs) and `v0.3.0` (real desktop adapter research,
  safety gates, audit persistence, feature flag, confirmation flow,
  OS permissions, emergency stop audit) lines; Future research
  (improved OCR, better template matching, Android research, plugin
  system).

### Smoke check (Step 45)

- New invariants: the four new docs exist
  (`POST_RELEASE_CHECKLIST.md`, `FEEDBACK_TRIAGE.md`,
  `V0_2_1_PATCH_PLAN.md`, `V0_3_0_REAL_ADAPTER_BRANCH_PLAN.md`);
  README and PROJECT_CONTEXT mention Step 45; README or
  PROJECT_CONTEXT explains Step 44 was a release/testing milestone;
  CHANGELOG mentions Step 45; `package.json` declares none of
  `robotjs` / `nut.js` / `iohook` / `uiohook-napi` / `opencv`;
  feature flags still pin `realDesktopActions: false`. The
  smoke-check does not launch Electron, OCR, screenshots, pack/dist,
  git, or any system action.

### Safety invariants kept (Step 45)

- ClickFlow remains **simulation-only**. No real desktop actions
  were added.
- No `robotjs` / `nut.js` / `iohook` / `uiohook-napi` / OpenCV.
- `realDesktopActions: false`, `simulationOnly: true`.
- `image_click` and `text_click` stay simulation-only; OCR does not
  click; Visual Builder creates drafts only; presets do not execute
  automatically.
- The action pipeline rejects every `realClick: true`.
- `contextIsolation: true`, `nodeIntegration: false`, CSP unchanged.

---

## [Unreleased] — Steps 15-43

ClickFlow Smart Desktop Beta preparation (`v0.2.0-smart-beta`).
Final QA + bugfix audit of the smart-features chain
(Step 42) and packaging / release pass (Step 43). The
`package.json` `version` bumps from `0.1.0` to `0.2.0-beta`
(semver-clean pre-release identifier; the human-facing release
tag is `v0.2.0-smart-beta`).

ClickFlow stays **simulation-only**:

- The action pipeline rejects every `realClick: true` for every
  scenario type.
- `realDesktopActions: false`, `simulationOnly: true` baked into
  `FEATURE_FLAGS`. Neither is in the runtime-togglable whitelist.
- `realOcr` and `tesseractProvider` are session-scoped runtime
  toggles only. The session flag wipes on reload.
- No new IPC channel introduced beyond the Step 25-34
  smart-features set.
- `contextIsolation: true`, `nodeIntegration: false`, CSP
  unchanged.

### Added (Step 42 — Smart OCR/Image QA + Bugfix Pass)

- **Smart-features audit.** Step 42 ran the five smart-features
  chains end-to-end (Coordinate / Image / OCR-Text / Visual
  Builder / Presets) plus the Diagnostics and Packaging
  surfaces, and patched the bugs the audit surfaced:
  - `src/scenario-presets.js` — `preset-text-click-basic` did
    NOT carry the `ocrProvider` field introduced at Step 41.
    Bugfix: added `ocrProvider: 'mock'` to the frozen preset,
    extended `validateScenarioPreset` with a new error id
    `presetOcrProviderInvalid`, extended the clone whitelist
    to keep the field, propagated the active provider through
    `applyVisualContextToPreset` and `_sanitizeVisualContext`.
  - `src/visual-builder.js` — `buildVisualContextFromState`
    did NOT consult `getActiveOcrProvider()`. Bugfix: now
    copies the active provider id into the visual context so
    drafts created from the Visual Builder + presets used
    "with current visual context" reflect the user's actual
    OCR-tab selection.
  - `src/ocr-provider-interface.js` — `isRealOcrAllowed` was
    a Step-38 hard-stop that always returned `false`. Bugfix:
    now reflects the merged base + runtime feature-flag
    snapshot. Returns `true` only when `realOcr === true &&
    tesseractProvider === true && simulationOnly !== true`.
    In production builds (where `simulationOnly: true` stays
    baked in) the function still evaluates to `false`, but
    the semantics are now correct for unit tests and future
    builds. Smoke-check invariants updated accordingly.
  - `src/ocr-provider-registry.js` —
    `getOcrProviderRegistryStatus` reported
    `realOcrEnabled: false` even after the user pressed
    "Enable Tesseract for this session". Bugfix: now reads
    `realOcrEnabledForSession` from `getOcrFeatureStatus()`,
    so the diagnostics line and the readiness UI accurately
    reflect the runtime overlay.
- **`src/smart-beta-health.js` (new).** Pure-renderer module
  consolidating every smart-features readiness boolean into
  one snapshot:
  - `getSmartBetaHealth()` returns the 10 readiness booleans
    (`screenCaptureReady`, `regionSelectorReady`,
    `templatesReady`, `templateMatchingReady`,
    `imageClickReady`, `ocrMockReady`,
    `tesseractProviderReady`, `textClickReady`,
    `visualBuilderReady`, `presetsReady`) plus
    `realClicksEnabled: false` and `releaseBlockersCount`.
  - `countSmartBetaReleaseBlockers()` reports how many
    smart-features modules are not loaded. A production
    build returns `0`.
  - `getSmartBetaHealthDiagnostics()` is an alias used by the
    Copy diagnostics line.
  - The module never opens an IPC channel, never runs OCR,
    never reads pixel data.
- **`src/renderer.js` Copy diagnostics.** New `Smart beta:`
  line listing every readiness boolean plus
  `releaseBlockersCount`, `simulationOnly=true`,
  `realClick=false`. The line never carries the full target
  text, an `imageDataUrl`, a thumbnail, or PII.
- **`src/audit-events.js`.** Five new allowlisted types:
  `smartBeta.qa.started`, `smartBeta.qa.completed`,
  `smartBeta.blocker.found`, `smartBeta.blocker.fixed`,
  `smartBeta.releaseCandidate.checked`.
- **`src/i18n.js`.** 16 new keys per language. Final parity:
  835 ru / 835 en. New keys: `smartBetaStatus`,
  `smartBetaQa`, `screenCaptureReady`,
  `regionSelectorReady`, `templatesReady`,
  `templateMatchingReady`, `imageClickReady`,
  `ocrMockReady`, `tesseractProviderReady`, `textClickReady`,
  `visualBuilderReady`, `presetsReady`,
  `releaseBlockersCount`, `readyAfterManualQa`,
  `manualOcrTestingRequired`, `smartBetaManualTests`,
  `smartBetaQaReport`.
- **`src/index.html`.** New `<script src="smart-beta-health.js">`
  loaded between `visual-builder-ui.js` and `renderer.js`.
- **`docs/SMART_BETA_QA_REPORT.md` (new).** Step-42 audit +
  bugfix report. Sections: Scope, Environment, Checked flows
  (Coordinate / Image / OCR-Text / Visual Builder / Presets /
  Diagnostics / Packaging), Results, Known issues, Blockers,
  Safety verification, Release recommendation. Status:
  Ready after manual packaged-app QA.
- **`docs/SMART_BETA_MANUAL_TESTS.md` (new).** 15-section
  manual checklist with `Status: Not tested` placeholders for
  every section: Install / Smoke check / Screen capture /
  Region selector / Templates / Template matching /
  image_click / OCR mock / Real OCR session / text_click /
  Visual Builder / Presets / Diagnostics / Safety / Packaging.
- **`docs/SMOKE_TESTS.md`.** New "Smart Beta smoke sequence"
  section covering steps S1-S18 (npm install → npm run smoke
  → npm start → smart-features chain → npm run pack → npm
  run dist).
- **`docs/SECURITY_CHECKLIST.md`.** New "Smart beta safety"
  section listing 12 invariants (screen capture only by user
  action, real OCR only by session flag, OCR does not click,
  image_click / text_click simulation only, Visual Builder
  drafts only, presets do not auto-execute, action-pipeline
  blocks `realClick: true`, `realDesktopActions: false`, no
  `robotjs` / `nut.js`, no OpenCV).
- **`docs/KNOWN_LIMITATIONS.md`.** New section
  **21. Smart Beta — Step 42 limitations** with subsections
  21.1-21.7 (Tesseract may require language data, OCR can be
  slow, OCR result quality depends on screenshot quality,
  template matching is plain-JS preview matching, Visual
  Builder is foundation-level, real clicks not implemented,
  mobile not implemented).

### Added (Step 43 — Smart Beta Packaging/Release Pass)

- **`package.json`.**
  - `version` bumped `0.1.0` → `0.2.0-beta` (semver-clean
    pre-release identifier; the GitHub release tag is
    `v0.2.0-smart-beta`).
  - `description` updated to "Electron, simulation-only smart
    desktop beta".
  - `build.files` tightened:
    - explicit include of `tesseract.js` runtime files under
      `node_modules/` (`tesseract.js`, `tesseract.js-core`,
      `wasm-feature-detect`, `idb-keyval`, `bmp-js`,
      `regenerator-runtime`, `zlibjs`, `is-electron`,
      `opencollective-postinstall`) so the packaged build can
      run real OCR after the user enables Tesseract for the
      session;
    - explicit exclude of `userData/`, `.env*`, `*.tmp`,
      `*.log`, `screenshots/`, `screenshot-*.png|jpg`,
      `dist/`, `coverage/`, `.cache/`, `.npm/`. No private
      data, no temporary screenshots, no env files leak into
      the artifacts.
- **`docs/SMART_BETA_RELEASE_NOTES.md` (new).** Full smart-beta
  release notes. Sections: Summary, New smart features
  (Screen Capture / Region Selector / Templates / Image
  matching / image_click / OCR mock and real OCR session /
  text_click / Visual Builder / Presets), Safety model, What
  is still not included, Known limitations, How to test,
  Feedback.
- **`docs/SMART_BETA_RELEASE_CHECKLIST.md` (new).**
  Engineering / smart-features dev-mode QA / packaging /
  documentation / release sign-off checklist. Five sections,
  per-platform sign-offs (Windows, macOS, Linux).
- **`docs/SMART_BETA_RELEASE_DRAFT.md` (new).** Body to paste
  into the GitHub release editor. Sections: Title, Tag,
  Summary, Highlights, Safety model, How to run, How to test,
  Known limitations, What is not included, Feedback,
  Security note.
- **`RELEASE_NOTES.md`.** New "Smart Desktop Beta —
  `v0.2.0-smart-beta`" section linking to the smart-beta
  docs.
- **`docs/TAG_AND_RELEASE_GUIDE.md`.** New "Smart Desktop Beta
  tag plan (`v0.2.0-smart-beta`)" section: tag procedure
  (10 steps), rollback guidance.
- **`README.md` / `PROJECT_CONTEXT.md` / `CHANGELOG.md`.**
  Updated to Steps 42-43.

### Smoke check (Steps 42-43)

- New invariants for Step 42:
  - `src/smart-beta-health.js` exists and exports the public
    surface (`getSmartBetaHealth`,
    `getSmartBetaHealthDiagnostics`,
    `countSmartBetaReleaseBlockers`).
  - `index.html` loads `smart-beta-health.js` between
    `visual-builder-ui.js` and `renderer.js`.
  - `renderer.js` Copy diagnostics has a `Smart beta:` line.
  - 5 new audit types in the allowlist.
  - i18n parity preserved (835 ru / 835 en).
  - 5 bugfix invariants:
    - `scenario-presets.js` declares `ocrProvider: 'mock'`
      on the text_click preset and clones the field.
    - `visual-builder.js` consults `getActiveOcrProvider`.
    - `ocr-provider-interface.js` `isRealOcrAllowed` short-
      circuits on `simulationOnly` and checks the
      `tesseractProvider` gate (replacing the retired
      Step-38 hard-stop invariant).
    - `ocr-provider-registry.js`
      `getOcrProviderRegistryStatus` reads
      `realOcrEnabledForSession`.
  - `docs/SMART_BETA_QA_REPORT.md` and
    `docs/SMART_BETA_MANUAL_TESTS.md` exist with the
    expected sections.
- New invariants for Step 43:
  - `package.json` declares `"version": "0.2.0-beta"`.
  - `package.json` `build.files` excludes `userData/`,
    `.env`, screenshots, `dist/`, `coverage/`, `.cache/`,
    `.npm/`.
  - `docs/SMART_BETA_RELEASE_CHECKLIST.md`,
    `docs/SMART_BETA_RELEASE_NOTES.md`,
    `docs/SMART_BETA_RELEASE_DRAFT.md` exist with the
    expected sections.
  - README / PROJECT_CONTEXT / CHANGELOG mention Steps 42
    and 43.
  - `RELEASE_NOTES.md` mentions the smart-beta release
    target.
  - `docs/TAG_AND_RELEASE_GUIDE.md` carries the smart-beta
    tag plan.
- Total: 1348 + Step-42 + Step-43 invariants. Smoke runs are
  recorded in [`docs/SMART_BETA_QA_REPORT.md`](./docs/SMART_BETA_QA_REPORT.md).

### Safety invariants kept (Steps 42-43)

- ClickFlow remains **simulation-only**.
- `nodeIntegration: false`, `contextIsolation: true`, CSP
  unchanged.
- Base `FEATURE_FLAGS` defaults: `realDesktopActions: false`,
  `simulationOnly: true`, `realOcr: false`,
  `tesseractProvider: false`, `ocrMockProvider: true`. None
  of the umbrella safety flags are in the runtime-togglable
  whitelist.
- The action pipeline rejects every `realClick: true` for
  every scenario type. `realOcr: true` on a `text_click`
  action is a SOURCE marker only.
- No new IPC channel.
- `package.json` declares `tesseract.js` and zero of the
  forbidden modules (`tesseract-ocr`, `node-tesseract-ocr`,
  `opencv*`, `sharp`, `jimp`, `pixelmatch`, `looks-same`,
  `robotjs`, `nut-js`, `nutjs`, `@nut-tree/nut-js`, `iohook`,
  `uiohook-napi`, `node-key-sender`).
- `build.files` exclude removes `userData/`, `.env`,
  screenshots, `dist/`, `coverage/`, `.cache/`, `.npm/`,
  `*.tmp`, `*.log` from the packaged artifacts.
- Audit payloads carry only stable string ids, durations,
  counts, language strings, source flags — never the full
  target text, never an `imageDataUrl`, never PII.

## [Unreleased] — Steps 15-41

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
Step 31 Image Click Scenario UX Polish + Visual Test Tools, the
Step 32 OCR Foundation (mock only), the
Step 33 Text Click Scenario Type Foundation, the
Step 34 Text Click Test Tools + OCR UX Polish, the
Step 36 Visual Builder UX Polish + Scenario Presets, the
Step 37 Smart Features QA + Next Branch Preparation, the
Step 38 Real OCR Research + Safe Integration Plan, the
Step 39 Real OCR Provider Integration Phase 1, the
**Step 40 Real OCR UI Activation**, and the
**Step 41 Real OCR for text_click and Visual Builder**
(Tesseract.js wired through async `recognizeTextWithTesseract`,
session-scoped runtime overlay for `realOcr` /
`tesseractProvider`, four provider-control buttons + Run Real OCR
+ progress card in the OCR tab, `text_click` scenarios persist
`ocrProvider`, click-engine and Test OCR branch on provider,
Visual Builder copies the active provider into drafts).
**Still simulation-only** — no real cursor work, no real
keyboard input, action-pipeline still rejects every
`realClick: true`.

### Added (Step 40 — Real OCR UI Activation)

- `src/feature-flags.js` — runtime overlay surface:
  `setRuntimeFeatureFlag(flag, value)`,
  `getRuntimeFeatureFlags()`,
  `resetRuntimeFeatureFlags()`,
  `getRuntimeTogglableFlags()`. The whitelist
  `_RUNTIME_TOGGLABLE_FLAGS` contains exactly two entries:
  `'realOcr'` and `'tesseractProvider'`. Trying to flip
  `realDesktopActions`, `simulationOnly`, `ocr`,
  `imageRecognition`, `globalHotkeys`, `profiles`,
  `importExport`, `ocrProviderRegistry`, or `ocrMockProvider`
  returns `{ ok: false, error: 'flagNotRuntimeTogglable' }`.
  `getFeatureFlags()` now returns a merged base + runtime
  snapshot. `getOcrFeatureStatus()` consults the merged
  snapshot too and exposes a new boolean
  `realOcrEnabledForSession`. Runtime overlay lives only in
  module-local memory: it is NOT persisted to settings,
  profiles, scenarios, localStorage or disk, and the
  `_runtimeFlags` map resets on every renderer reload.
- `src/tesseract-ocr-provider.js` — Phase 2 implementation of
  `recognizeTextWithTesseract(input, options)`. The function
  is now `async` and:
  - re-checks `getOcrFeatureStatus()` at every call;
  - returns a blocked envelope (`success: false, blocked:
    true, error: 'Real OCR provider is disabled by feature
    flag', realOcr: false`) when either flag is off;
  - resolves the engine through three defensive lookups
    (test-seam → `window.Tesseract` → `require('tesseract.js')`
    in try/catch);
  - best-effort crops the captured preview via a `<canvas>`
    when the input carries a region; falls back to the full
    image on canvas failure;
  - maps language codes via the static
    `tesseractLanguageMap` (`ru → 'rus'`, `en → 'eng'`,
    `ru+en → 'rus+eng'`);
  - calls `engine.recognize(image, lang, { logger })` and
    forwards every progress event to the optional
    `options.onProgress` callback plus the
    `ocr.real.progress` audit;
  - normalises the raw payload through
    `mapTesseractBlocks` / `normalizeTesseractResult` so the
    rest of ClickFlow consumes the unified
    `{ blocks, match, matched, ... }` shape;
  - stamps `mode: 'real-ocr'`, `provider: 'tesseract'`,
    `realOcr: true`, `realClick: false` on every successful
    envelope and builds an `actionPreview` for matches
    (`type: 'text_click'`, `mode: 'preview'`,
    `realClick: false`, `realOcr: true`);
  - emits `ocr.real.started` → `ocr.real.completed` (or
    `.failed` / `.blocked`) audit events with stable string
    ids, durations, counts, language strings — never the
    full target text, never an `imageDataUrl`, never PII;
  - exposes a best-effort
    `cancelCurrentTesseractRecognition()` that bumps the
    in-flight token so the resolver discards the late
    result. Worker-based cancellation is documented as
    planned (Tesseract.js v5 has no abort handle).
  `runTesseractSelfTest(options?)` is now `async` too. It
  exercises the readiness check and runs a single recognise
  pass over a synthetic 8×8 blank PNG when the flags allow
  it; otherwise it returns a blocked envelope. Either way it
  never moves the cursor.
- `src/audit-events.js` — 8 new allowlisted event types:
  `ocr.real.enabledForSession`,
  `ocr.real.disabled`,
  `ocr.real.started`,
  `ocr.real.progress`,
  `ocr.real.completed`,
  `ocr.real.failed`,
  `ocr.real.blocked`,
  `ocr.provider.switched`.
  Payloads carry only flag booleans, error counts, stable
  reason ids, durations, language strings — never the full
  target text, never an `imageDataUrl`, never PII.
- `src/ocr-ui.js` — extended OCR provider status card with
  four explicit user-action buttons:
  - **Use Mock OCR** → `setActiveOcrProvider('mock')`;
  - **Enable Tesseract for this session** → renderer
    `confirm()` dialog → `setRuntimeFeatureFlag('realOcr',
    true)` + `setRuntimeFeatureFlag('tesseractProvider',
    true)`. Logs `ocr.real.enabledForSession`;
  - **Use Tesseract OCR** → `setActiveOcrProvider('tesseract')`.
    Disabled until the runtime overlay is on AND the engine
    resolver finds a Tesseract instance;
  - **Disable Real OCR** → `resetRuntimeFeatureFlags()` +
    `setActiveOcrProvider('mock')`. Logs `ocr.real.disabled`.
  Plus a new **Run Real OCR** button next to Run Mock OCR.
  The button is disabled until: runtime
  `realOcrEnabledForSession` is true, the active provider is
  `tesseract`, and a screen preview exists. Clicking it
  awaits `recognizeTextWithTesseract`, drives the new
  **Real OCR progress** card (stage label + percent bar +
  Cancel button), and renders the result through the
  existing OCR result panels. Step 40 deliberately ships no
  "auto-enable real OCR" toggle.
- `src/styles.css` — Step 40 OCR provider control styles
  + progress card styles (dark theme + mobile fallback).
- `src/renderer.js` — `Real OCR:` line in `Copy
  diagnostics` now consults `getTesseractProviderDiagnostics()`
  through the runtime overlay and reports
  `realOcrRuntimeEnabled`, `lastRealOcrRunAt`,
  `lastRealOcrDurationMs`, `lastRealOcrBlocksCount`,
  `lastRealOcrMatched`, `tesseractReady`.
- `src/index.html` — best-effort
  `<script src="../node_modules/tesseract.js/dist/tesseract.min.js">`
  load. Falls back silently when the file is missing — the
  provider's defensive engine resolver simply reports the
  provider as unavailable and the mock continues to back
  every OCR consumer. CSP unchanged.

### Added (Step 41 — Real OCR for text_click and Visual Builder)

- `src/scenario-manager.js` — text_click scenarios gain a
  per-scenario `settings.ocrProvider` field
  (`'mock' | 'tesseract'`, default `'mock'`). New constant
  `TEXT_CLICK_ALLOWED_OCR_PROVIDERS`.
  `validateTextClickScenario` rejects unknown values with
  `OCR provider must be mock or tesseract`.
  `_buildTextClickScenarioFromInput` persists the field;
  legacy scenarios without the field default to mock.
- `src/index.html` — text_click form gains a new select
  `#input-text-ocr-provider` with two options
  (Use Mock OCR / Use Tesseract OCR) and the localised
  hint "Tesseract must be enabled for this session before
  running."
- `src/renderer.js` — `getScenarioFormData`,
  `fillScenarioForm`, `clearScenarioForm` propagate the new
  field. The reset always returns to mock.
- `src/click-engine.js` — `runTextClickScenario` branches on
  `desiredOcrProvider`. The tesseract branch:
  - re-checks `getOcrFeatureStatus().realOcrEnabledForSession`
    BEFORE the loop starts. Without the runtime overlay it
    returns the localised error
    "Tesseract OCR is disabled. Enable it for this session
    or use mock OCR." through `_failOut`;
  - awaits `recognizeTextWithTesseract` per iteration;
  - adapts the real-OCR envelope to the legacy mock-engine
    shape so the existing `match` / `no_match` /
    `simulated`-action plumbing keeps working;
  - emits the same `scenario.textClick.ocr.started/.completed`
    audit events with new `ocrProvider` and `realOcr`
    fields;
  - builds the simulated `text_click` action with
    `realClick: false`, `realOcr: !!sourceIsRealOcr`,
    `ocrProvider: desiredOcrProvider`. The cursor never
    moves.
- `src/text-click-test-tools.js` — `runTextClickTest` is now
  `async` and propagates the form's `ocrProvider` through
  the test pipeline. The tesseract branch:
  - validates the runtime overlay (returns
    `tesseractDisabledByFeatureFlag` when off);
  - calls `recognizeTextWithTesseract` and adapts the
    envelope to the legacy mock shape used by
    `createTextClickDebugResult`;
  - stamps `debug.ocrProvider` and `debug.realOcr` so the UI
    surfaces "OCR provider used".
  `createTextClickDebugResult` now stamps
  `actionPreview.ocrProvider` and
  `actionPreview.realOcr = (provider === 'tesseract')`.
  Three new error ids: `tesseractDisabledByFeatureFlag`,
  `tesseractEngineUnavailable`, `tesseractEngineThrew`.
- `src/text-click-test-ui.js` — `runTextClickTestFromForm` is
  `async` and awaits the new helper. The log line includes
  the chosen provider.
- `src/visual-builder.js` — `buildDraftPreviewFromState` for
  the text_click branch now copies
  `getActiveOcrProvider().id` into the draft's
  `settings.ocrProvider`. Default mock when the registry is
  unavailable.
- `src/visual-builder-ui.js` — draft preview card surfaces a
  new row "OCR provider used" plus
  `Real OCR: true|false` (always `Real clicks: false`).
  `_fillScenarioFormFromDraft` propagates
  `settings.ocrProvider` into the form's new select.
- `src/action-pipeline.js` — `validateAction` for
  `text_click` no longer rejects `realOcr: true`. The flag
  is now a SOURCE marker (the match came from a real OCR
  engine). The hard-stop on `realClick: true` stays
  unchanged. `executeSimulatedAction` propagates `realOcr`
  and `ocrProvider` into the
  `action.textClick.simulated` audit payload. The action
  result still carries `realClick: false`.

### Added (docs)

- `docs/REAL_OCR_USAGE.md` — user-facing manual: how to
  enable Tesseract for the current session, how to run real
  OCR manually, OCR provider selection, text_click with
  provider, Visual Builder with provider, safety notes,
  known limitations (first-call latency, language data,
  cancellation, region cropping), troubleshooting.
- `docs/REAL_OCR_INTEGRATION_PLAN.md`,
  `docs/TESSERACT_PROVIDER.md`,
  `docs/OCR_PROVIDER_INTERFACE.md`,
  `docs/OCR_FOUNDATION.md`,
  `docs/TEXT_CLICK_SCENARIO.md`,
  `docs/TEXT_CLICK_TEST_TOOLS.md`,
  `docs/SECURITY_CHECKLIST.md`,
  `docs/KNOWN_LIMITATIONS.md`,
  `README.md`,
  `PROJECT_CONTEXT.md`,
  `CHANGELOG.md` — Step 40-41 progress entries describing
  the runtime overlay, the four provider control buttons,
  the text_click `ocrProvider` field, the Visual Builder
  copy of the active provider, and the safety guarantees.

### i18n (Step 40-41)

- ~24 new keys per language (RU + EN). Final parity:
  819 ru / 819 en. New keys:
  `enableTesseractForSession`, `disableRealOcr`,
  `useMockOcr`, `useTesseractOcr`, `runRealOcr`,
  `realOcrProgress`, `ocrStage`, `loadingOcrLanguage`,
  `recognizingText`, `realOcrCompleted`, `realOcrFailed`,
  `realOcrBlocked`, `tesseractMustBeEnabled`,
  `ocrProviderSelect`, `selectedOcrProvider`,
  `testWithSelectedProvider`, `realOcrMayBeSlower`,
  `noClicksWillBePerformed`, `ocrCancellationPlanned`,
  `languageDataFailed`, `targetTextNotFound`,
  `ocrProviderUsed`, `realOcrSource`,
  `textClickStillSimulationOnly`.

### Smoke check (Step 40-41)

- `scripts/smoke-check.js` — Step-40-41 invariants. Total
  now 1428 OK / 0 FAIL. Highlights:
  - feature-flags exposes the runtime overlay surface;
  - whitelist contains ONLY `realOcr` + `tesseractProvider`;
  - base defaults still pin `realOcr: false`,
    `tesseractProvider: false`, `simulationOnly: true`;
  - tesseract-ocr-provider declares
    `recognizeTextWithTesseract` as async;
  - tesseract provider still refuses recognise when flags
    are off (blocked envelope);
  - tesseract provider dispatches to `engine.recognize`;
  - tesseract provider never sets `realClick: true`;
  - action-pipeline accepts text_click `realOcr=true` as a
    source marker (Step 41 retiring of the Step-33
    rejection) but still rejects `realClick=true`;
  - scenario-manager validates `ocrProvider`;
  - click-engine branches text_click on
    `desiredOcrProvider` and refuses tesseract without
    session opt-in;
  - text-click-test-tools is async and dispatches to
    Tesseract;
  - text-click-test-ui awaits the new async helper;
  - ocr-ui renders the four provider-control buttons +
    Run Real OCR + progress card and never adds an
    "Enable real OCR" persistent toggle;
  - audit allowlist contains the 8 new `ocr.real.*` /
    `ocr.provider.switched` types;
  - text_click form has the OCR provider select;
  - Visual Builder draft persists `ocrProvider` and the
    preview surfaces `ocrProviderUsed`;
  - i18n parity holds (819 ru / 819 en);
  - README + PROJECT_CONTEXT + CHANGELOG mention Steps 40
    and 41;
  - `docs/REAL_OCR_USAGE.md` exists, mentions
    "Enable Tesseract for this session" and the no-real-click
    invariant.
- The historical Step-25..38 invariant
  "all `<script src=...>` resolve on disk" is relaxed to
  skip `../node_modules/...` paths so the best-effort
  tesseract.js script tag does not flag the smoke check
  when `npm install` has not been run.
- The historical Step-33 invariant
  "action-pipeline rejects text_click realOcr=true" is
  retired. The Step-41 invariant
  "action-pipeline accepts text_click realOcr=true as a
  source marker" replaces it. The hard-stop on
  `realClick=true` is unchanged.
- The historical Step-34 invariant
  "text-click-test-tools.js never imports tesseract /
  opencv" is tightened to "never imports any OCR engine via
  `require()` / `import`" — the renderer global
  `recognizeTextWithTesseract` reference is allowed.

### Safety invariants kept (Steps 40-41)

- ClickFlow remains **simulation-only**.
- `nodeIntegration: false`, `contextIsolation: true`, CSP
  unchanged (`default-src 'self'; script-src 'self';
  style-src 'self';`).
- Base feature-flag defaults: `realOcr: false`,
  `tesseractProvider: false`, `ocrMockProvider: true`,
  `simulationOnly: true`, `realDesktopActions: false`. None
  of these can be flipped at runtime.
- Real OCR only runs after THREE explicit user actions:
  Enable Tesseract for this session → Use Tesseract OCR →
  Run Real OCR.
- Real OCR only analyses the captured screen preview in the
  renderer's screen-capture slice. There is no live-screen
  capture loop.
- text_click actions stay simulation-only: the action
  pipeline emits `realClick: false` and rejects every
  `realClick: true` outright. `realOcr` on an action only
  marks the source.
- Action-pipeline audit payloads carry only stable string
  ids, durations, counts, language strings, source flags —
  never the full target text, never an `imageDataUrl`,
  never PII.
- Runtime overlay flags wipe on reload. After restarting
  the app the user must enable Tesseract again.
- `setActiveOcrProvider('tesseract')` still gated by both
  flags + engine loadability. Without the runtime overlay
  the call returns
  `{ ok: false, error: { id: 'realOcrBlocked' } }`.
- No new IPC channel. `main.js` / `preload.js` unchanged.
- `src/tesseract-ocr-provider.js` only references
  `tesseract.js` via `require('tesseract.js')` wrapped in
  try/catch and the renderer global `window.Tesseract`. It
  imports nothing else forbidden.
- `package.json` declares `tesseract.js` (Phase 1
  dependency, kept). Still declares ZERO of `tesseract-ocr`,
  `node-tesseract-ocr`, `opencv*`, `sharp`, `jimp`,
  `pixelmatch`, `looks-same`, `robotjs`, `nut-js`, `iohook`,
  `uiohook-napi`, `node-key-sender`.
- text_click / image_click / simple_click / screen capture
  / templates / template matching / OCR mock / Visual
  Builder / Scenario Presets continue to work unchanged.

## [Unreleased] — Steps 15-39

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
Step 31 Image Click Scenario UX Polish + Visual Test Tools, the
Step 32 OCR Foundation (mock only), the
Step 33 Text Click Scenario Type Foundation, the
Step 34 Text Click Test Tools + OCR UX Polish, the
Step 36 Visual Builder UX Polish + Scenario Presets, the
Step 37 Smart Features QA + Next Branch Preparation, the
Step 38 Real OCR Research + Safe Integration Plan, and the
**Step 39 Real OCR Provider Integration Phase 1** (real-OCR
provider shell behind feature flags — `tesseract.js` declared
as a dependency, defensive provider with disabled-by-default
recognise path, OCR provider status UI, `Real OCR:` diagnostics
line).
**Still simulation-only.**

### Added (Step 39 — Real OCR Provider Integration Phase 1)

- `package.json` declares `tesseract.js` as a runtime
  dependency (`^5.0.4`). The dependency is the FIRST
  OCR-engine package ClickFlow ships. It stays unloaded by
  the renderer at Step 39 — there is no `<script src>` for
  `tesseract.min.js` and no static `require()` of
  `tesseract.js`. Source-file imports of `tesseract.js`
  remain banned in every Step-25–Step-38 module by the
  smoke-check.
- `src/tesseract-ocr-provider.js` (new pure-renderer module):
  - `getTesseractProviderInfo()` — static metadata
    (`id: 'tesseract'`, `type: 'real'`, `realOcr: true`,
    `defaultLanguage: 'ru+en'`, supported languages
    `ru / en / ru+en`, `tesseractLanguageMap` with
    `ru → 'rus'`, `en → 'eng'`, `ru+en → 'rus+eng'`,
    `dependencyDeclared: true`).
  - `isTesseractProviderAvailable()` — boolean. Returns
    `true` only when an engine reference resolves;
    defensive — never throws.
  - `checkTesseractProviderReadiness(flagsArg?)` — returns
    `{ ready, reasons: [stableId], details: { … }, checkedAt }`.
    Stable reason IDs: `realOcrFeatureFlagDisabled`,
    `tesseractProviderFeatureFlagDisabled`,
    `simulationOnlyMode`, `dependencyNotDeclared`,
    `engineNotLoadable`. Emits
    `ocr.tesseract.readiness.requested` →
    `ocr.tesseract.readiness.completed` (or `.failed`) plus
    granular `ocr.tesseract.blockedByFeatureFlag` /
    `ocr.provider.tesseract.detected` /
    `ocr.provider.tesseract.unavailable` events.
  - `runTesseractSelfTest(options?)` — runs the readiness
    check, exercises the public surface, returns
    `{ ok: false, blocked: true, reasons, durationMs,
    details, note, ranAt }`. Step 39 NEVER executes real
    OCR even on a passing readiness check.
  - `recognizeTextWithTesseract(input, options?)` — Step 39
    hard-stop. Re-checks the feature flags; returns
    `{ success: false, blocked: true, error: 'Real OCR
    provider is disabled by feature flag', providerId:
    'tesseract', realClick: false, realOcr: false }` whenever
    `realOcr` / `tesseractProvider` is off OR
    `simulationOnly` is true. Even when every flag is set,
    the function returns a defensive blocked envelope; the
    actual `Tesseract.recognize` call lives behind a future
    Step-40 review.
  - `normalizeTesseractResult(rawResult, input)` and
    `mapTesseractBlocks(rawResult, input)` — pure functions
    that translate Tesseract.js native shapes
    (`data.words` / `data.blocks` with `bbox: { x0, y0, x1,
    y1 }`) into the unified ClickFlow OCR shape
    (`{ id, text, confidence (0..1), boundingBox, targetPoint }`).
    Region offset is honoured. No module state.
  - `terminateTesseractWorker()` — Step 39 no-op that resets
    the engine reference. Step 40+ replaces the body with
    the real worker termination call.
  - `getTesseractProviderDiagnostics()` — diagnostics
    snapshot (`tesseractDependencyPresent`,
    `tesseractProviderAvailable`, `tesseractProviderEnabled`,
    `realOcrFeatureFlag`, `realOcrAutoRun: false`,
    `activeOcrProvider`, `lastTesseractReadinessCheck`,
    `lastTesseractError`, `realClick: false`).
  - `setTesseractEngineForTesting(engine)` — unit-test seam.
- `src/ocr-provider-registry.js`:
  - The `tesseract` entry no longer claims `planned: true`.
    It now exposes `enabledByFeatureFlag` and a dynamic
    `available` field computed from the live feature
    flags + the engine resolver.
  - New helper `_evaluateTesseractSelectability()` returns
    `{ selectable, flagsAllow, engineLoadable, reason,
    reasonText }`. Tesseract is selectable only when BOTH
    `realOcr === true` AND `tesseractProvider === true` AND
    `simulationOnly === false` AND the engine resolver
    reports `engineLoadable: true`.
  - `setActiveOcrProvider('tesseract')` returns
    `{ ok: false, error: { id: 'realOcrBlocked', reason:
    'realOcrBlockedByFeatureFlag' | 'tesseractEngineNotLoadable' } }`
    with stable reason ids. Emits
    `ocr.provider.selection.blocked` +
    `ocr.provider.real.unavailable`. The active provider
    stays `mock`.
  - New public `getTesseractProviderStatus()` returns the
    Tesseract-specific snapshot for the OCR readiness card +
    diagnostics line (`registered`, `available`,
    `enabledByFeatureFlag`, `engineLoadable`, `realOcr`,
    `disabledReason`, `dependencyDeclared`,
    `realOcrFeatureFlag`, `tesseractProviderFlag`,
    `realOcrAutoRun: false`, `activeProviderId`,
    `lastReadinessCheck`, `lastError`, `realClick: false`).
  - `getOcrProviderRegistryStatus()` now reflects the
    live Tesseract availability (`tesseractProviderEnabled`)
    plus the existing Step-38 fields.
  - `isRealOcrProviderRegistered()` now consults the dynamic
    Tesseract availability rather than the frozen base
    entry.
- `src/feature-flags.js`:
  - The four OCR flags keep their Step-38 safe defaults
    (`realOcr: false`, `tesseractProvider: false`,
    `ocrMockProvider: true`, `simulationOnly: true`). Comments
    are extended to spell out the Step-39 selection rule.
  - New `getOcrFeatureStatus()` — flat snapshot consumed by
    every OCR call site:
    `{ realOcr, tesseractProvider, ocrMockProvider,
    ocrProviderRegistry, simulationOnly, realOcrAllowed,
    realOcrAutoRun: false }`. `realOcrAllowed` is true only
    when `realOcr && tesseractProvider && !simulationOnly`,
    so it evaluates to `false` at Step 39.
- `src/audit-events.js` — 6 new allowlisted event types:
  `ocr.tesseract.readiness.requested`,
  `ocr.tesseract.readiness.completed`,
  `ocr.tesseract.readiness.failed`,
  `ocr.tesseract.blockedByFeatureFlag`,
  `ocr.provider.tesseract.detected`,
  `ocr.provider.tesseract.unavailable`. Payloads carry only
  flag booleans, error counts, stable reason ids, durations,
  and engine-loadability — never the full target text,
  never an `imageDataUrl`, never PII.
- `src/i18n.js` — ~18 new keys per language (RU + EN):
  `tesseractProvider`, `tesseractInstalled`,
  `tesseractEnabled`, `checkTesseractReadiness`,
  `tesseractReadiness`, `tesseractReady`,
  `tesseractUnavailable`, `tesseractBlockedByFeatureFlag`,
  `realOcrFeatureFlag`, `realOcrAutoRunDisabled`,
  `realOcrProviderDisabled`, `realOcrWillBeEnabledLater`,
  `activeProviderMock`, `activeProviderTesseract`,
  `ocrProviderStatus`, `tesseractDependencyPresent`,
  `tesseractReadinessCheckCompleted`,
  `tesseractReadinessCheckFailed`,
  `tesseractEngineNotLoadable`. Final i18n parity:
  795 ru / 795 en.
- `src/index.html` — new `<script src="tesseract-ocr-provider.js">`
  loaded between the OCR provider interface and the OCR
  provider registry, so the registry can dispatch into the
  Tesseract shell. CSP unchanged.
- `src/ocr-ui.js` — new **OCR provider status** card rendered
  below the Step-38 readiness card. Surfaces the Active
  provider, Tesseract installed, Tesseract enabled, Real OCR
  feature flag, Real OCR auto-run disabled, Real clicks
  disabled rows, plus an info banner ("Real OCR provider
  disabled by default · Real OCR auto-run disabled · Real
  OCR will be enabled later, after manual review."). Adds a
  **Check Tesseract readiness** button that calls
  `runTesseractReadinessCheckFromUi`, logs the outcome, and
  re-renders the card. The card NEVER renders an "Enable
  real OCR" toggle.
- `src/renderer.js` — new `Real OCR:` line in
  `Copy diagnostics`:
  `tesseractDependencyPresent=true,
  tesseractProviderAvailable=false,
  tesseractProviderEnabled=false,
  tesseractEngineLoadable=false,
  realOcrFeatureFlag=false, activeOcrProvider=mock,
  realOcrAutoRun=false,
  lastTesseractReadinessCheck=…,
  lastTesseractError=…,
  tesseractDisabledReason=…,
  realOcr=false, realClick=false`.
- `src/styles.css` — new section "Step 39 — OCR provider
  status card (Real OCR Phase 1)":
  `.ocr-provider-status-card`,
  `.ocr-provider-status-banner`,
  `.ocr-provider-status-banner-badge`,
  `.ocr-provider-status-button-row`,
  `.ocr-provider-status-check-button`,
  `.ocr-provider-status-readiness-result`
  (with `-ok`, `-blocked`, `-fail` modifiers). Dark-theme
  variants. Mobile fallback at 760px.
- `docs/TESSERACT_PROVIDER.md` (new): full reference for the
  Tesseract provider — Purpose / Current status / Dependency
  / Feature flags / Why disabled by default / Provider
  readiness / Future activation plan / Privacy model /
  Performance risks / Known limitations / Safety notes.
- `docs/OCR_FOUNDATION.md` — Tesseract-prepared-but-disabled
  note.
- `docs/OCR_PROVIDER_INTERFACE.md` — Tesseract implementation
  notes (engine resolution / readiness contract / recognise
  hard-stop / result mapping / audit / worker).
- `docs/REAL_OCR_INTEGRATION_PLAN.md` — Step 39 Phase 1
  progress appendix.
- `docs/TEXT_CLICK_SCENARIO.md` — provider-architecture note
  (Step 39: text_click still uses mock OCR by default).
- `docs/SECURITY_CHECKLIST.md` — new "Tesseract OCR Provider
  (Step 39 — Phase 1)" section with behavioural / audit /
  diagnostics / Electron-security invariants.
- `docs/KNOWN_LIMITATIONS.md` — new section
  **19. Tesseract provider installed/prepared but disabled
  by feature flag (Step 39)** with subsections 19.1 (not
  loaded at runtime), 19.2 (disabled by feature flag), 19.3
  (recognition hard-stopped), 19.4 (text_click stays on
  mock), 19.5 (no real click).
- `scripts/smoke-check.js` — Step 39 invariants. New module
  / new doc / new audit allowlist / feature-flag safe
  defaults / `tesseract.js` ALLOWED in package.json (other
  forbidden modules still forbidden) / `tesseract.js`
  NOT required by any Step-25–Step-38 source file / no new
  IPC channel / CSP unchanged / OCR UI renders the new
  card / OCR UI does NOT add an "Enable real OCR" toggle /
  README + PROJECT_CONTEXT mention Step 39 + Tesseract
  provider + real OCR disabled by default.
- `README.md` / `PROJECT_CONTEXT.md` / `CHANGELOG.md` —
  Step 39 entries. Current status updated to mention the
  Tesseract OCR provider Phase 1.

### Safety invariants kept (Step 39)

- ClickFlow remains **simulation-only**.
- `nodeIntegration: false`, `contextIsolation: true`, CSP
  unchanged (`default-src 'self'; script-src 'self';
  style-src 'self';`).
- `simulationOnly: true`, `realDesktopActions: false`,
  `realOcr: false`, `tesseractProvider: false`,
  `realOcrAutoRun: false`, `realOcrAllowed: false`,
  `activeOcrProvider: mock`,
  `tesseractProviderEnabled: false`,
  `tesseractProviderAvailable: false` (engine not loaded
  in production-build), `tesseractDependencyPresent: true`,
  `ocrEngineImplemented: false`, `ocrMockOnly: true`,
  `realOcrEnabled: false`, `realTextClickEnabled: false`,
  `realImageClickEnabled: false`,
  `autoSavesScenarios: false`, `autoRunsScenarios: false`,
  `realClick: false`, `realOcr: false` in every status
  response, audit payload, and diagnostics line.
- The Tesseract provider runs entirely in the renderer.
  It never opens a new IPC channel. `main.js` registers no
  `ocr.tesseract.*` handler. `preload.js` exposes no
  `ocrTesseract*` / `tesseractProvider*` API.
- `src/tesseract-ocr-provider.js` does not statically
  `require()` any forbidden module. It references
  `tesseract.js` only via a defensive `require('tesseract.js')`
  wrapped in `try/catch`, behind a runtime engine resolver
  that returns `null` (and triggers the mock fallback) when
  the package is missing.
- `package.json` declares `tesseract.js` as a runtime
  dependency. It still declares zero of `tesseract-ocr`,
  `node-tesseract-ocr`, `opencv4nodejs`, `@u4/opencv4nodejs`,
  `opencv.js`, `opencv-js`, `sharp`, `jimp`, `pixelmatch`,
  `looks-same`, `robotjs`, `nut-js`, `nutjs`,
  `@nut-tree/nut-js`, `iohook`, `uiohook-napi`,
  `node-key-sender`.
- `setActiveOcrProvider('tesseract')` returns
  `{ ok: false, error: { id: 'realOcrBlocked' } }` when
  either feature flag is off OR the engine resolver reports
  `engineLoadable: false`. The active provider stays
  `mock`.
- `recognizeTextWithTesseract` returns a blocked envelope at
  Step 39 even when the flags are flipped. There is no
  call site executing real OCR in this phase.
- `runTesseractSelfTest` exercises the readiness check and
  the public surface but never executes
  `Tesseract.recognize`.
- The action-pipeline / safety-gates / mock adapter /
  dry-run sandbox are unchanged. They still reject every
  `realClick: true` outright.
- text_click / image_click / simple_click / screen capture /
  templates / template matching / OCR mock / Visual Builder /
  Scenario Presets continue to work unchanged via the mock
  provider.

## [Unreleased] — Steps 15-38

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
Step 31 Image Click Scenario UX Polish + Visual Test Tools, the
Step 32 OCR Foundation (mock only), the
Step 33 Text Click Scenario Type Foundation, the
Step 34 Text Click Test Tools + OCR UX Polish, the
Step 36 Visual Builder UX Polish + Scenario Presets, the
Step 37 Smart Features QA + Next Branch Preparation, and the
**Step 38 Real OCR Research + Safe Integration Plan**
(architecture-only OCR provider registry that prepares the
project for a future Tesseract integration without shipping a
real OCR runtime).
**Still simulation-only.**

### Added (Step 38 — Real OCR Research + Safe Integration Plan)

- `src/ocr-provider-interface.js` (new pure-renderer module):
  - `getOcrProviderContract()` — frozen-shape snapshot:
    `version: 1`, `supportedProviders: ['mock']`,
    `plannedProviders: ['tesseract']`,
    `realOcrAllowed: false`, `mockOcrAvailable: true`,
    `realOcrAvailable: false`, `requiresUserAction: true`,
    `storesImages: false`, `supportedLanguages: ['ru', 'en',
    'ru+en']`, `supportedMatchModes: ['contains', 'exact']`,
    `maxTargetTextLength: 200`.
  - `getSupportedOcrLanguages()` — `['ru', 'en', 'ru+en']`.
  - `validateOcrProviderInput(input)` — returns
    `{ valid, errors: [stableId] }`. Stable error IDs:
    `inputMissing`, `screenPreviewMissing`,
    `screenPreviewSizeMissing`, `targetTextMissing`,
    `targetTextTooLong`, `languageInvalid`,
    `matchModeInvalid`, `regionInvalid`,
    `regionOutOfBounds`, `pixelDataNotAllowed`. Defensive:
    rejects `imageDataUrl` / `previewDataUrl` / pixel
    buffers inside the input envelope.
  - `normalizeOcrProviderOptions(options)` — safe defaults
    (`ru+en`, `contains`, case-insensitive, no region,
    no requestId).
  - `createOcrProviderResult(success, data, error)` —
    sanitised envelope. Whitelists fields and drops
    anything that smells like pixel data even from a
    buggy provider.
  - `createOcrProviderStatus(provider)` — readiness
    snapshot. Real providers are forced
    `available: false` at Step 38 regardless of input.
  - `isRealOcrAllowed(flags, settings)` — central gate
    for "is real OCR allowed". Hard-stop at Step 38:
    always returns `false`, even with
    `flags.realOcr === true`.
- `src/ocr-provider-registry.js` (new pure-renderer module):
  - Two frozen provider entries: `mock` (active,
    available, type `mock`, `realOcr: false`) and
    `tesseract` (planned, unavailable, type `real`,
    `realOcr: true`, `disabledReason: "Real OCR is not
    connected in this build"`).
  - `getOcrProviders()` — deep-copy array of every
    provider.
  - `getOcrProviderById(id)` / `getActiveOcrProvider()`.
  - `setActiveOcrProvider(id)` — returns
    `{ ok: true, provider }` for the mock; returns
    `{ ok: false, error: { id: 'realOcrBlocked' } }` for
    any real provider, emits
    `ocr.provider.selection.blocked` +
    `ocr.provider.real.unavailable`.
  - `getOcrProviderRegistryStatus()` — diagnostics-shaped
    snapshot with `activeProviderId`,
    `activeProviderName`, `mockProviderAvailable`,
    `tesseractProviderAvailable`, `realOcrEnabled`
    (always `false`), `realOcrAllowed` (always `false`),
    `supportedLanguages`, `lastProviderSelfTest`,
    `providerRegistryReady`, `storesImages: false`,
    `requiresUserAction: true`, `realClick: false`.
  - `isRealOcrProviderRegistered()` — always `false` at
    Step 38.
  - `runOcrProviderSelfTest()` — runs the mock engine
    against synthetic `1280×720` preview metadata
    (`sourceId: 'self-test'`, no pixels), validates the
    input against the contract, asserts the result
    envelope shape. Returns `{ ok, providerId, durationMs,
    errors, details, ranAt }`. Emits
    `ocr.provider.selftest.started` →
    `ocr.provider.selftest.completed` (or `.failed`).
  - `runActiveOcrProvider(input)` — thin dispatcher.
    Routes to the mock engine through the existing
    `runMockOcr` symbol. Defensive: if the active
    provider is somehow non-mock at Step 38, emits
    `ocr.provider.real.unavailable` and falls back to
    the mock.
- `src/feature-flags.js` — four new safe-default flags:
  `realOcr: false`, `ocrProviderRegistry: true`,
  `ocrMockProvider: true`, `tesseractProvider: false`.
  `getFeatureFlagsForDiagnostics` reports them under
  `safety` (`realOcr`, `tesseractProvider`) and
  `capabilities` (`ocrProviderRegistry`,
  `ocrMockProvider`). The flags are frozen; there is no
  UI to toggle them.
- `src/audit-events.js` — 6 new allowlisted event types:
  `ocr.provider.selftest.started`,
  `ocr.provider.selftest.completed`,
  `ocr.provider.selftest.failed`,
  `ocr.provider.selection.blocked`,
  `ocr.provider.mock.active`,
  `ocr.provider.real.unavailable`. Payloads carry only
  provider ids, durations, counts, stable error IDs,
  and booleans — never the full target text, never an
  `imageDataUrl`, never PII.
- `src/i18n.js` — ~26 new keys per language (RU + EN):
  `ocrProvider`, `ocrProviders`, `activeOcrProvider`,
  `mockOcrProvider`, `tesseractOcrProvider`,
  `realOcrProvider`, `realOcrUnavailable`,
  `realOcrPlanned`, `ocrReadiness`, `providerSelfTest`,
  `runProviderSelfTest`, `providerSelfTestPassed`,
  `providerSelfTestFailed`, `ocrProviderRegistry`,
  `mockProviderAvailable`, `tesseractProviderAvailable`,
  `realOcrEnabled`, `realOcrAllowed`,
  `supportedOcrLanguages`, `realOcrNotConnectedYet`,
  `mockProviderCurrentlyUsed`, `ocrImagesNotStored`,
  `ocrRequiresUserAction`, `realOcrProviderBlocked`,
  `providerSelfTestNotRun`, `ocrProviderArchitectureOnly`,
  plus small `flagYes`, `flagNo`, `flagAvailable`,
  `flagUnavailable`, `flagActive`. Final i18n parity:
  771 ru / 771 en.
- `src/index.html` — two new `<script src>` tags
  (`ocr-provider-interface.js`, `ocr-provider-registry.js`)
  loaded between `ocr-mock-engine.js` and `ocr-ui.js`.
  CSP unchanged.
- `src/ocr-ui.js` — new **OCR readiness card** rendered
  at the top of the OCR tab below the existing notice.
  The card surfaces the provider list (mock vs
  tesseract), the readiness flags
  (`Real OCR enabled: no`, `Real OCR allowed: no`,
  `OCR images not saved to disk: yes`,
  `OCR requires user action: yes`,
  `Real clicks: disabled`), the supported languages,
  the active provider, and a **Run provider self-test**
  button. The button calls `runOcrProviderSelfTest`,
  prints a success / warning log line, and re-renders
  the card so the inline status updates.
- `src/renderer.js` — new `OCR provider:` line in
  `Copy diagnostics`:
  `activeProviderId=mock,
  activeProviderName=Mock OCR Provider,
  mockProviderAvailable=true,
  tesseractProviderAvailable=false,
  realOcrEnabled=false, realOcrAllowed=false,
  supportedLanguages=ru|en|ru+en,
  providerRegistryReady=true,
  lastProviderSelfTestOk=…,
  lastProviderSelfTestAt=…,
  lastProviderSelfTestBlocksCount=…,
  lastProviderSelfTestDurationMs=…,
  ocrEngineImplemented=false,
  tesseractAvailable=false,
  realOcr=false, realClick=false`.
- `src/styles.css` — new section "Step 38 — OCR
  provider readiness card": `.ocr-readiness-card`,
  `.ocr-readiness-warning`, `.ocr-readiness-warning-badge`,
  `.ocr-readiness-list`, `.ocr-readiness-provider-row`
  (with `-active`, `-real` modifiers),
  `.ocr-readiness-provider-name`,
  `.ocr-readiness-provider-type` (with `-real`
  modifier), `.ocr-readiness-provider-status` (with
  `-active`, `-available`, `-planned`, `-unavailable`
  modifiers), `.ocr-readiness-provider-reason`,
  `.ocr-readiness-selftest-row`,
  `.ocr-readiness-selftest-button`,
  `.ocr-readiness-selftest-status` (with `-ok`, `-fail`
  modifiers). Dark-theme variants. Mobile fallback at
  760px.
- `docs/REAL_OCR_INTEGRATION_PLAN.md` (new): full
  step-by-step roadmap to Tesseract.js integration —
  library / language data / worker model / performance
  risks / privacy / security / UI progress / fallback /
  no real click — with the explicit recommendation that
  Step 39 follow this document and require a
  `docs/REAL_OCR_GO_NO_GO.md` review before adding any
  dependency.
- `docs/OCR_PROVIDER_INTERFACE.md` (new): formal
  contract reference. Sections: Provider contract,
  Input format (with the full stable error-ID table),
  Output format, Provider registry, Mock provider,
  Planned real provider, Self-test, Safety rules.
- `docs/OCR_FOUNDATION.md` — new "Provider architecture
  (Step 38)" section that explains how the Step-32 mock
  engine sits behind the new contract.
- `docs/TEXT_CLICK_SCENARIO.md` — provider-architecture
  note clarifying that `text_click` continues to use
  the mock provider.
- `docs/TEXT_CLICK_TEST_TOOLS.md` — provider-architecture
  note clarifying that Test OCR uses the active
  provider (currently mock).
- `docs/NEXT_BRANCH_PLAN.md` — "Branch A — progress
  note (Step 38)" section listing the deliverables
  shipped at Step 38 and the umbrella safety flags
  that remain unchanged.
- `docs/SECURITY_CHECKLIST.md` — new "OCR Provider
  Registry (Step 38)" section with behavioural / audit /
  diagnostics / Electron-security invariants.
- `docs/KNOWN_LIMITATIONS.md` — new section
  **18. Real OCR is planned, not connected (Step 38)**
  with subsections 18.1 (Architecture only),
  18.2 (Tesseract provider is planned),
  18.3 (Self-test is mock-only),
  18.4 (Real OCR not connected).
- `scripts/smoke-check.js` — Step 38 invariants. New
  modules / docs / audit allowlist / new feature flags /
  i18n parity / diagnostics line / no prohibited
  dependencies / no new IPC handler / CSP unchanged.
- `README.md` — new Step 38 paragraph in the linear
  history. Updated current-status line to mention OCR
  provider architecture and "real OCR is not
  connected".
- `PROJECT_CONTEXT.md` — promoted "Шаги 36 и 37
  завершены вместе" to "Прошлый шаг" and replaced the
  current step with Step 38 details.

### Safety invariants kept (Step 38)

- ClickFlow remains **simulation-only**.
- `nodeIntegration: false`, `contextIsolation: true`, CSP
  unchanged.
- `simulationOnly: true`, `realDesktopActions: false`,
  `realOcr: false`, `tesseractProvider: false`,
  `ocrEngineImplemented: false`, `tesseractAvailable:
  false`, `ocrMockOnly: true`, `realOcrEnabled: false`,
  `realTextClickEnabled: false`,
  `realImageClickEnabled: false`,
  `autoSavesScenarios: false`, `autoRunsScenarios: false`,
  `realClick: false`, `realOcr: false` in every status
  response, audit payload, and diagnostics line.
- The OCR provider interface and the registry run entirely
  in the renderer. They never open a new IPC channel.
  `main.js` registers no `ocr.provider.*` handler.
  `preload.js` exposes no `ocrProvider*` API.
- `src/ocr-provider-interface.js` and
  `src/ocr-provider-registry.js` contain no `require()`
  of any prohibited module (`tesseract` / `tesseract.js`
  / `tesseract-ocr` / `node-tesseract-ocr` /
  `opencv4nodejs` / `@u4/opencv4nodejs` / `opencv.js` /
  `opencv-js` / `sharp` / `jimp` / `pixelmatch` /
  `looks-same` / `robotjs` / `nut-js` / `nutjs` /
  `@nut-tree/nut-js` / `iohook` / `uiohook-napi` /
  `node-key-sender`).
- The action-pipeline / safety-gates / mock adapter /
  dry-run sandbox are unchanged. They still reject every
  `realClick: true` outright. The OCR provider registry
  never sends any action through those.
- `setActiveOcrProvider('tesseract')` returns
  `{ ok: false, error: { id: 'realOcrBlocked' } }` and
  emits `ocr.provider.selection.blocked` +
  `ocr.provider.real.unavailable`. The active provider
  stays `mock`.
- The provider self-test runs the mock engine against
  synthetic preview metadata (`1280×720`, no pixels). It
  never captures a screenshot.
- Audit payloads carry only ids, counts, durations,
  stable error IDs, and booleans. No `imageDataUrl`, no
  thumbnails, never the full target text, no PII.
- No new dependencies. `package.json` declares zero of
  every prohibited module.
- Visual Builder + Scenario Presets + image_click +
  text_click + simple_click flows are unchanged.

## [Unreleased] — Steps 15-37

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
Step 31 Image Click Scenario UX Polish + Visual Test Tools, the
Step 32 OCR Foundation (mock only), the
Step 33 Text Click Scenario Type Foundation, the
Step 34 Text Click Test Tools + OCR UX Polish, the
**Step 36 Visual Builder UX Polish + Scenario Presets**, and
the **Step 37 Smart Features QA + Next Branch Preparation**
(documentation-only QA pass that prepares the project for the
next big direction — Real OCR Integration is recommended).
**Still simulation-only.**

### Added (Step 36 — Visual Builder UX Polish + Scenario Presets)

- `src/scenario-presets.js` (new pure-renderer module):
  - Three frozen preset definitions:
    `preset-coordinate-basic` (`simple_click`,
    `x: 500, y: 400, button: 'left', intervalMs: 500,
    repeatCount: 10`),
    `preset-image-click-basic` (`image_click`,
    `templateId: null, region: null, threshold: 0.75,
    step: 4, timeoutMs: 10000, intervalMs: 1000,
    repeatCount: 1`),
    `preset-text-click-basic` (`text_click`,
    `targetText: '', language: 'ru+en',
    matchMode: 'contains', caseSensitive: false,
    region: null, timeoutMs: 10000, intervalMs: 1000,
    repeatCount: 1`).
  - `getScenarioPresets()` returns deep-copies of every
    preset so a buggy caller cannot mutate the frozen
    list.
  - `getScenarioPresetById(id)` returns a deep-copy or
    `null`.
  - `validateScenarioPreset(preset)` returns
    `{ valid, errors: [stableId] }` with stable error IDs:
    `presetMissing`, `presetIdMissing`,
    `presetTypeInvalid`, `presetSettingsMissing`,
    `presetCoordinatesInvalid`, `presetIntervalInvalid`,
    `presetRepeatInvalid`, `presetButtonInvalid`,
    `presetThresholdInvalid`, `presetStepInvalid`,
    `presetTimeoutInvalid`, `presetLanguageInvalid`,
    `presetMatchModeInvalid`.
  - `applyVisualContextToPreset(preset, visualContext)`
    merges numbers and short ids/strings from a visual
    context into a copy of the preset:
    - coordinate preset borrows `targetPoint` (e.g. from
      a recent image-match) or falls back to the centre
      of the selected region;
    - image preset borrows `templateId`, `region`,
      `threshold`, `step`;
    - text preset borrows `matchedText` (truncated to
      200 chars), `region`, `ocrLanguage`, `matchMode`,
      `caseSensitive`.
    Pixel data is NEVER copied. The function
    `_sanitizeVisualContext` strips anything that smells
    like an `imageDataUrl` even if a buggy caller
    attaches one.
  - `createScenarioDraftFromPreset(presetId, context)`
    returns `{ ok: true, presetId, type, name, settings,
    source: 'preset' | 'preset+visual', realClick: false,
    realOcr?: false, createdAt }` or
    `{ ok: false, errors: [stableId] }`. Defensive:
    `realClick: false` and (for text_click)
    `realOcr: false` are stamped on every draft.
- `src/visual-builder.js` (new pure-renderer module):
  - Module-local state: `_overlaySettings` (six booleans),
    `_selectedActionType`, `_lastDraftPreview`,
    `_lastUsedPresetId`, `_lastDraftType`,
    `_missingRequirementsCount`.
  - `getVisualBuilderState()` returns a deep-copy
    snapshot.
  - Overlay control: `setOverlaySetting(key, value)`
    (validated against the frozen `OVERLAY_KEYS` list),
    `showAllOverlays()`, `hideAllOverlays()`,
    `clearOverlays()` (clears the last draft preview so
    the action-target dot disappears).
  - `setSelectedActionType(type)` accepts only
    `simple_click` / `image_click` / `text_click`.
  - `buildVisualContextFromState(state)` builds the
    plain-data visual context from the renderer slices:
    `region` from the region-selector slice (numbers
    only), `templateId` from `state.templates`,
    `targetPoint` / `threshold` / `step` from
    `state.templateMatching.lastResult`, `matchedText` /
    `ocrLanguage` / `matchMode` / `caseSensitive` from
    `state.ocr.lastResult`. Pixel data is never copied.
  - `buildDraftPreviewFromState(state, type, options)`
    builds a draft per type with safe defaults. Hard
    errors: `image_click` without an active template,
    `text_click` without target text. Returns
    `{ ok, draft, missing }` or
    `{ ok: false, errors, missing }`.
  - `getMissingRequirements(state, type)` returns stable
    string ids: `screenPreviewMissing`, `regionMissing`,
    `templateMissing`, `targetTextMissing`,
    `ocrResultMissing`, `imageMatchMissing`.
  - `getOverlayLayers(state)` returns a declarative list
    of overlay layers: region (blue dashed), template
    match bbox (green / orange depending on confidence),
    template target point (red), OCR blocks (yellow
    dashed; matched is green solid with label), OCR
    target point (red), action-target derived from the
    last draft preview (cyan).
  - `getVisualBuilderDiagnostics()` returns
    `{ presetsAvailable, presetsCount, lastUsedPresetId,
    lastDraftType, visualBuilderDraftAvailable,
    overlaySettings, selectedActionType,
    missingRequirementsCount, realClick: false,
    realOcr: false, autoSavesScenarios: false,
    autoRunsScenarios: false }`.
  - `clearDraftPreview()` wipes module-local
    `_lastDraftPreview` and `_lastDraftType`.
  - All cloning helpers (`_cloneDraft`,
    `_sanitizeVisualContext`) defensively delete
    `imageDataUrl` / `previewDataUrl` even if a buggy
    caller attaches them.
- `src/visual-builder-ui.js` (new renderer UI module):
  - `renderVisualBuilderTab()` builds the entire tab
    inside `#advanced-tab-visualBuilder` from scratch.
    Idempotent.
  - Header card with title, subtitle, always-on safety
    banner ("Visual Builder runs in simulation only. No
    real clicks. No real OCR.").
  - `_renderStatusRow(state)` — six status cells
    (Screen preview / Region / Template / Image match /
    OCR result / Real clicks). Real clicks is **always**
    `disabled` (red badge).
  - `_renderOnboardingHints(state)` — surfaces context-
    aware hints:
    - no preview → "Capture a screen preview first." +
      Open Screen Capture button;
    - no region → "You can select a region…" + Open
      Region Selector button;
    - `image_click` + no template → "Import a template
      image." + Open Templates button;
    - `text_click` + no OCR result → "Run mock OCR or
      enter target text manually." + Open OCR button.
    Each button calls `setAdvancedTab(tab)` only.
  - `_renderActionTypeAndPreview(state)` — action-type
    select (Coordinate / Image / Text), preview card
    with `<img>.src = imageDataUrl` (only consumer of
    the captured preview) and percentage-positioned
    overlay layers, overlay legend.
  - `_renderOverlayControls(state)` — six checkboxes
    bound to `setOverlaySetting`, plus Show all / Hide
    all / Clear overlays buttons. Each change records
    `visualBuilder.overlay.changed`.
  - `_renderActionsPanel(state)` — six quick-action
    buttons (Capture preview / Select region / Run
    image test / Run OCR test / Create scenario draft /
    Open scenario form). The first four navigate to
    other tabs; the fifth runs
    `buildDraftPreviewFromState` and re-renders;
    the sixth opens the existing scenario form.
  - `_renderScenarioPresets(state)` — three preset
    cards. Each card has name (i18n), monospace type
    badge, description (i18n), brief settings summary
    line, and two buttons (Use preset / Use with
    current visual context). Each click runs
    `createScenarioDraftFromPreset` and opens the
    scenario form pre-filled (via
    `setTimeout(..., 0)` after
    `openCreateScenarioForm()`).
  - `_renderDraftPreview(state)` — draft preview card
    with type / name / source / `realClicks: false`
    (and `realOcr: false` for `text_click`) /
    settings summary, plus an Open draft in form
    button.
  - `_openScenarioFormFromDraft(draft)` patches the
    existing scenario-form inputs after opening the
    form. NEVER calls `createScenario` /
    `updateScenario` / `saveScenarios`.
  - All user data is rendered via `textContent` only.
    `innerHTML = ''` is the only `innerHTML` form
    used (for clearing a container).
- `src/audit-events.js` — 6 new allowlisted event types:
  `scenarioPreset.selected`,
  `scenarioPreset.draft.created`,
  `scenarioPreset.form.opened`,
  `visualBuilder.overlay.changed`,
  `visualBuilder.requirement.missing`,
  `visualBuilder.draft.preview.created`. Payloads carry
  only ids, type strings, and short metadata
  (`hasRegion`, `hasTemplate`, `targetTextLen`,
  `missingCount`, `withVisualContext`, overlay
  `key` / `value`). Payloads NEVER carry the full target
  text, an `imageDataUrl`, a thumbnail, or PII.
- `src/i18n.js` — ~70 new keys per language (RU + EN):
  `visualBuilder`, `visualBuilderSubtitle`,
  `visualBuilderSimulationOnlyNotice`,
  `visualBuilderStatus`, `visualBuilderPreview`,
  `visualBuilderActions`, `visualBuilderDraftCreated`,
  `onboardingHints`, `noOnboardingHints`,
  `screenPreview`, `region`, `template`, `imageMatch`,
  `ocrResult`, `realClicks`, `ready`, `missing`,
  `disabled`, `selectedActionType`, `overlayLegend`,
  `capturePreview`, `selectRegion`, `runImageTest`,
  `runOcrTest`, `createScenarioDraft`,
  `openScenarioForm`, `scenarioPresets`,
  `presetCoordinateBasic`, `presetCoordinateBasicDesc`,
  `presetImageClickBasic`, `presetImageClickBasicDesc`,
  `presetTextClickBasic`, `presetTextClickBasicDesc`,
  `usePreset`, `useWithCurrentVisualContext`,
  `draftPreview`, `noDraftPreview`, `openDraftInForm`,
  `missingVisualRequirement`, `screenPreviewMissingHint`,
  `templateMissingHint`, `regionOptionalHint`,
  `ocrResultMissingHint`, `showRegionOverlay`,
  `showTemplateMatchOverlay`,
  `showTemplateTargetOverlay`, `showOcrBlocksOverlay`,
  `showOcrTargetOverlay`, `showActionTargetOverlay`,
  `showAllOverlays`, `hideAllOverlays`, `clearOverlays`,
  `overlaySettings`, `presetSelected`,
  `scenarioDraftOpened`, `presetDraftFailed`,
  `openTemplates`, `openRegionSelector`,
  `openScreenCapture`, `noPresets`,
  `visualBuilderDiagnostics`, `presetsAvailable`,
  `presetsCount`, `lastUsedPresetId`, `lastDraftType`,
  `visualBuilderDraftAvailable`,
  `selectedActionTypeShort`, `missingRequirementsCount`,
  `source`, `realClicksLabel`, `realOcrLabel`. Final
  i18n parity: 745/745.
- `src/index.html` — new tab button
  `data-advanced-tab="visualBuilder"`, new
  `<section id="advanced-tab-visualBuilder">`, three new
  `<script src="…">` tags (`scenario-presets.js`,
  `visual-builder.js`, `visual-builder-ui.js`) loaded
  between `text-click-test-ui.js` and `renderer.js`.
  CSP unchanged.
- `src/renderer.js`:
  - `renderAdvancedDashboard` dispatches
    `case 'visualBuilder': renderVisualBuilderTab()`.
  - New `Visual Builder:` line in `Copy diagnostics`
    (`presetsAvailable`, `presetsCount`,
    `lastUsedPresetId`, `lastDraftType`,
    `visualBuilderDraftAvailable`, `selectedActionType`,
    `missingRequirementsCount`, six `show*` overlay
    booleans, `autoSavesScenarios=false`,
    `autoRunsScenarios=false`, `realClick=false`,
    `realOcr=false`). NO full target text. NO
    `imageDataUrl`.
- `src/styles.css` — new section "Step 36 — Visual
  Builder UX Polish + Scenario Presets":
  `.vb-header-card`, `.vb-subtitle`, `.vb-safety-banner`
  (yellow), `.vb-status-card`, `.vb-status-grid`,
  `.vb-status-cell`, `.vb-status-label`,
  `.vb-status-badge` with four variants (`-ok`,
  `-missing`, `-warning`, `-danger`),
  `.vb-hints-card`, `.vb-hint-row`, `.vb-hint-text`,
  `.vb-hint-button`, `.vb-preview-card`,
  `.vb-type-row`, `.vb-type-label`, `.vb-type-select`,
  `.vb-preview-wrapper`, `.vb-preview-image`,
  `.vb-preview-empty`, `.vb-overlay-rect`,
  `.vb-overlay-kind-region` / `-bbox` / `-block`,
  `.vb-overlay-point`, `.vb-overlay-color-blue` /
  `-green` / `-red` / `-yellow` / `-orange` / `-cyan`,
  `.vb-overlay-label`, `.vb-overlay-legend`,
  `.vb-legend-row`, `.vb-legend-swatch`,
  `.vb-overlay-controls-card`,
  `.vb-overlay-controls-grid`,
  `.vb-overlay-checkbox-row`, `.vb-overlay-buttons`,
  `.vb-actions-card`, `.vb-actions-grid`,
  `.vb-action-btn`, `.vb-presets-card`,
  `.vb-presets-list`, `.vb-presets-empty`,
  `.vb-preset-card`, `.vb-preset-name`,
  `.vb-preset-type-badge` (with three monospace
  variants), `.vb-preset-description`,
  `.vb-preset-summary`, `.vb-preset-buttons`,
  `.vb-draft-card`, `.vb-draft-empty`,
  `.vb-draft-grid`, `.vb-draft-row`,
  `.vb-draft-row-label`, `.vb-draft-row-value`. Dark
  theme variants. Mobile fallback at
  `max-width: 760px`.

### Safety invariants kept (Step 36)

- `nodeIntegration: false`, `contextIsolation: true`, CSP
  unchanged.
- `simulationOnly: true`, `realActionsImplemented: false`,
  `realMatching: false`, `realClick: false`,
  `realOcr: false`, `ocrEngineImplemented: false`,
  `tesseractAvailable: false`, `ocrMockOnly: true`,
  `realOcrEnabled: false`, `realTextClickEnabled: false`,
  `autoSavesScenarios: false`, `autoRunsScenarios: false`
  in every status response, audit payload, and
  diagnostics line.
- The Visual Builder runs entirely in the renderer. It
  never opens a new IPC channel. `main.js` registers no
  `visualBuilder.*` / `scenarioPreset.*` handler.
  `preload.js` exposes no `visualBuilder.*` /
  `scenarioPreset.*` API.
- `scenario-presets.js`, `visual-builder.js`, and
  `visual-builder-ui.js` contain no `require()` of any
  prohibited module (`tesseract` / `tesseract.js` /
  `tesseract-ocr` / `node-tesseract-ocr` /
  `opencv4nodejs` / `@u4/opencv4nodejs` / `opencv.js` /
  `opencv-js` / `sharp` / `jimp` / `pixelmatch` /
  `looks-same` / `robotjs` / `nut-js` / `nutjs` /
  `@nut-tree/nut-js` / `iohook` / `uiohook-napi` /
  `node-key-sender`).
- The action-pipeline / safety-gates / mock adapter /
  dry-run sandbox are unchanged. They still reject every
  `realClick: true` (and every `realOcr: true` for
  text_click) outright. The Visual Builder never sends
  any action through those — it only opens the existing
  scenario form pre-filled.
- The screenshot is never persisted on disk by the
  Visual Builder. The draft preview is module-local and
  never written into `scenarios.json`, `settings.json`,
  `profiles.json`, `templates.json`, or
  `localStorage`. Module-local `_lastDraftPreview`
  lives in renderer memory and is cleared by
  `clearDraftPreview()`.
- Audit payloads carry only ids and short metadata. No
  `imageDataUrl`, no thumbnails, never the full target
  text (only `targetTextLen`), no PII.
- No new dependencies. `package.json` declares zero of
  every prohibited module.

### Added (Step 37 — Smart Features QA + Next Branch Preparation)

- `docs/SMART_FEATURES_QA.md` — manual QA-checklist for
  the entire smart-features chain: 12 sections (Scope,
  Screen Capture, Region Selector, Template Assets,
  Template Matching, Image Click, OCR Mock, Text Click,
  Visual Builder, Scenario Presets, Safety checks,
  Known issues, Release recommendation). Each QA
  section ships Steps + Expected + `Status: Not tested`.
- `docs/NEXT_BRANCH_PLAN.md` — three-branch roadmap
  document:
  - **Branch A — Real OCR Integration:** Tesseract /
    `tesseract.js` research, language data packaging,
    worker setup, performance, privacy, fallback, UI
    progress, no real click yet. *Risk: medium.*
  - **Branch B — Real Desktop Adapter:** final safety
    review, feature flag, OS permissions, adapter
    installation, audit persistence, emergency-stop
    audit, manual QA, real click only after approval.
    *Risk: high.*
  - **Branch C — Android Research:** Accessibility
    Service, MediaProjection, permissions,
    limitations, separate repository or subproject.
    *Risk: low (research only).*
  - **Recommendation: start with Branch A** because real
    OCR without real clicks is significantly less risky
    than a real desktop adapter. Branch B should wait
    for at least one stable Branch A release in the
    wild plus a fresh
    `docs/REAL_ACTIONS_GO_NO_GO.md` review.
- `docs/SMART_FEATURES_LIMITATIONS.md` — consolidated
  smart-features limitations: screen-capture
  permissions vary by OS, single rectangular region,
  template asset constraints, simple JS preview
  matcher, mock OCR only, image_click simulation only,
  text_click uses mock OCR only, Visual Builder is
  foundation only, scenario drafts require manual
  save, no real click.
- `docs/SMOKE_TESTS.md` — adds **Step 36 — Visual
  Builder UX Polish + Scenario Presets** smoke checks
  (#359–#381) and **Step 37 — Smart Features QA + Next
  Branch Preparation** smoke checks (#382–#388).
- `docs/SECURITY_CHECKLIST.md` — adds **Visual Builder
  + Scenario Presets (Step 36)** section with
  behavioural / audit / diagnostics / Electron-security
  invariants. Confirms drafts only, no auto-save, no
  auto-run, no real click, no real OCR, no
  `imageDataUrl` outside the screen-capture slice, no
  new IPC channel, no prohibited dependencies.
- `docs/KNOWN_LIMITATIONS.md` — adds new section
  **17. Visual Builder + Scenario Presets are
  foundation-only (Step 36)** with subsections 17.1
  (OCR still mock only), 17.2 (Presets are basic),
  17.3 (Visual Builder is foundation only), 17.4
  (Scenario drafts require manual save), 17.5
  (Matching accuracy limited), 17.6 (No real click).
- `README.md` — updates the current-status section and
  adds Step 36 + Step 37 paragraphs. Asserts
  simulation-only, no real clicks, no real OCR, no
  OpenCV, no mobile.
- `PROJECT_CONTEXT.md` — promotes the previous "Шаг
  34" entry to "Прошлый шаг" and replaces the
  "Текущий шаг" entry with a Step 36 + Step 37 summary.
- `scripts/smoke-check.js` — Step 36 + Step 37
  invariants.

### Safety invariants kept (Step 37)

- ClickFlow remains **simulation-only**. No real clicks.
  No real OCR. No OpenCV. No mobile. No new IPC channel.
  No new dependency.
- The smoke-check suite still passes with 0 failures
  after the Step 36 / Step 37 invariants are added.
- Documentation explicitly states the recommended next
  branch: **Branch A — Real OCR Integration**.

## [Unreleased] — Steps 15-34

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
Step 31 Image Click Scenario UX Polish + Visual Test Tools, the
Step 32 OCR Foundation (mock only), the
Step 33 Text Click Scenario Type Foundation, and the
**Step 34 Text Click Test Tools + OCR UX Polish** (Test OCR /
Test Text Match panel inside the `text_click` scenario form —
never executes the scenario, never clicks, never performs real
OCR, never opens a new IPC channel). **Still simulation-only.**

### Added (Step 34 — Text Click Test Tools + OCR UX Polish)

- `src/text-click-test-tools.js` (new pure-renderer module):
  - `buildTextClickTestInput(formData, appState)` — collects
    target text, language, match mode, case-sensitive flag,
    optional region (form copy), and the captured screen
    preview from the renderer state slices. Sanitises every
    field; copies the preview's `imageDataUrl` only into the
    input so the mock engine can read it — never copies it
    onward into diagnostics, audit payloads, or persisted
    state.
  - `validateTextClickTestInput(input)` — returns
    `{ valid, errors: [stableId], warnings: [stableId] }`.
    Stable error IDs: `targetTextRequired`,
    `captureScreenPreviewFirst`, `invalidRegion`,
    `invalidOcrLanguage`, `invalidMatchMode`,
    `mockOcrEngineUnavailable`, `targetTextWasNotFound`.
  - `runTextClickTest(input)` (sync) — validates, calls the
    Step-32 `createOcrInput` + `runMockOcr`, builds a debug
    result. Records `textClick.test.started` /
    `textClick.test.completed` / `textClick.test.failed` /
    `textClick.test.noMatch` /
    `textClick.test.actionPreview.created` audit events.
    NEVER calls `runScenario`, `runTextClickScenario`,
    `executeAction` real branch, the mock adapter, or the
    dry-run sandbox. NEVER calls a real OCR backend — only
    delegates to the Step-32 mock engine.
  - `createTextClickDebugResult(ocrResult, input, runMeta)`
    — builds `{ scenarioDraftName, targetText, language,
    matchMode, caseSensitive, region, screenSourceId / Name,
    previewSize, matched, matchedText, confidence,
    boundingBox, targetPoint, durationMs, blocks,
    actionPreview, errors, warnings, createdAt,
    realOcr: false, realClick: false }`. The action preview
    is built by the Step-32 mock engine and re-stamped with
    `mode: "preview"`, `realClick: false`, `realOcr: false`
    defensively.
  - `clearTextClickTestResult()` — wipes module-local
    `_lastTextClickTestResult` + `_textClickTestDiagnostics`
    and emits `textClick.test.cleared`.
  - `getTextClickTestStatus()` — diagnostics snapshot
    (`hasResult`, `lastTextClickTestAt`,
    `lastTextClickTestMatched`,
    `lastTextClickTestConfidence`,
    `lastTextClickTestDurationMs`,
    `lastTextClickTestTargetTextLen`,
    `lastTextClickTestErrorsCount`,
    `lastTextClickTestLanguage`,
    `lastTextClickTestMatchMode`,
    `lastTextClickTestRegionUsed`,
    `lastTextClickTestBlocksCount`, `ocrMockOnly: true`,
    `realOcrEnabled: false`, `realTextClickEnabled: false`,
    `realClick: false`, `realOcr: false`).
  - `getLastTextClickTestResult()` — shallow copy of the
    last debug result. Module-local; never persisted.
- `src/text-click-test-ui.js` (new renderer UI module):
  - `initTextClickTestUi()` — builds the panel skeleton
    inside `#form-section-text-click` once. Idempotent.
  - `refreshTextClickTestPanel()` — re-renders the three
    info cards.
  - `renderTextClickScreenPreviewStatus()` — Screen preview
    status card (source name, image size, capturedAt,
    `Preview only = enabled` reminder).
  - `renderTextClickRegionSummary()` — Region summary card
    (used region from form draft + selected region from the
    region-selector slice).
  - `renderTextClickOcrSettings()` — OCR settings card
    (target text trimmed and truncated to 60 chars, language
    label, match mode label, case sensitive flag,
    `Mock OCR only = enabled` reminder). Auto-refreshes on
    every form change.
  - `runTextClickTestFromForm()` — collects form data,
    validates, runs the mock engine, renders the result,
    logs.
  - `renderTextClickTestResult(result)` — coloured headline
    (matched=green / failed=red / no-match=yellow), metric
    rows.
  - `renderTextClickBlocksList(result)` — recognised-blocks
    list with matched-row highlight + MATCHED badge.
  - `renderTextClickOcrOverlay(result)` — preview `<img>` +
    region rectangle (dashed blue) + every OCR block
    (yellow-dashed, dimmed when no match) + matched block
    (solid green with text label) + target dot (red with
    white halo). CSS percentage positioning so the overlay
    scales correctly.
  - `renderTextClickActionPreview(result)` — JSON of the
    planned `text_click` action via `<pre>.textContent` (no
    HTML interpolation, never executed).
  - `clearTextClickTestResultUi()` — collapses every block.
  - Three quick navigation buttons (Open OCR / Open Screen
    Capture / Open Region Selector → `setAdvancedTab(tab)`).
- `src/audit-events.js` — 6 new allowlisted event types:
  `textClick.test.started`, `textClick.test.completed`,
  `textClick.test.failed`, `textClick.test.noMatch`,
  `textClick.test.cleared`,
  `textClick.test.actionPreview.created`. Payloads carry
  only ids and short metadata (confidence, target X / Y,
  durationMs, threshold, errorsCount, blocksCount, language,
  matchMode, hasRegion, targetTextLen / textLen) — never
  the full target text, never an `imageDataUrl`, never a
  thumbnail, never PII.
- `src/i18n.js` — 30 new keys per language (RU + EN):
  `testOcr`, `testTextMatch`, `runTextClickTest`,
  `textClickTestTools`, `textClickTestResult`,
  `textClickBlocks`, `ocrBlocksOverlay`, `matchedBlock`,
  `targetTextWasNotFound`, `mockOcrEngineUnavailable`,
  `openOcr`, `textClickTestStarted`,
  `textClickTestCompleted`, `textClickTestFailed`,
  `textClickTestNoMatch`, `textClickTestCleared`,
  `textClickTestFormTypeMismatch`, `ocrMockOnly`,
  `testDoesNotUseRealOcr`, `textClickDebugPanel`,
  `matchedTextBlock`, `noTextClickTestResult`,
  `textClickTestDiagnostics`, `lastTextClickTestAt`,
  `lastTextClickTestMatched`, `lastTextClickTestConfidence`,
  `lastTextClickTestDurationMs`,
  `lastTextClickTestTargetTextLen`,
  `lastTextClickTestErrorsCount`, plus
  `targetTextRequired` / `invalidOcrLanguage` /
  `invalidMatchMode` reused from Step 32.
- `src/index.html` — loads `text-click-test-tools.js` and
  `text-click-test-ui.js` between `ocr-ui.js` and
  `renderer.js`. CSP unchanged. No new IPC channel. No new
  `<script>` injected at runtime.
- `src/renderer.js`:
  - `init()` ends with `initTextClickTestUi()` (in addition
    to the existing `initImageClickTestUi()`).
  - `openCreateScenarioForm` / `openEditScenarioForm` /
    `closeScenarioForm` clear the test panel result via
    `clearTextClickTestResultUi()` and refresh / init the
    panel.
  - `syncScenarioFormSections` refreshes the test panel when
    the user switches to the text_click section.
  - `bindScenarioFormTextClickHandlers` wires `input` /
    `change` listeners on the target text / language /
    match mode / case-sensitive form fields so the OCR
    settings card auto-refreshes.
  - `refreshTextClickRegionSummary` ends with
    `renderTextClickRegionSummary()` (different module, no
    recursion).
  - `refreshTextClickPreviewWarning` ends with
    `renderTextClickScreenPreviewStatus()` (different
    module, no recursion).
  - New **Text click test diagnostics** card in
    `renderAdvancedSafety` with last-run rows + always-on
    safety reminders.
  - New `Text click test:` line in `Copy diagnostics`
    (numeric / metadata only — `lastTextClickTestTargetTextLen`
    instead of the full text, `ocrMockOnly=true`,
    `realOcrEnabled=false`, `realTextClickEnabled=false`,
    `testDoesNotClick=true`, `realClick=false`,
    `realOcr=false`).
- `src/styles.css` — new section "Step 34 — text_click test
  tools": `.text-click-test-panel`,
  `.text-click-test-header`, `.text-click-test-title`,
  `.text-click-test-subtitle`,
  `.text-click-test-subtitle-mock`, `.text-click-test-nav`,
  `.text-click-test-nav-button`, `.text-click-test-card`,
  `.text-click-test-card-title`, `.text-click-test-empty`,
  `.text-click-test-row`, `.text-click-test-row-label`,
  `.text-click-test-row-value`, `.text-click-test-controls`,
  `.text-click-test-button`, `.text-click-test-button-busy`,
  `.text-click-test-clear-button`,
  `.text-click-test-errors`,
  `.text-click-test-errors-title-soft`,
  `.text-click-test-warnings`,
  `.text-click-test-result-panel`,
  `.text-click-test-result-headline` with three coloured
  variants (matched=green, failed=red, no-match=yellow),
  `.text-click-test-blocks-card`,
  `.text-click-test-blocks-list`,
  `.text-click-test-block-row`,
  `.text-click-test-block-row-matched`,
  `.text-click-test-block-badge`,
  `.text-click-test-overlay-card`,
  `.text-click-test-overlay-wrapper`,
  `.text-click-test-overlay-image` (`max-width: 100%`),
  `.text-click-test-overlay-region` (dashed blue),
  `.text-click-test-overlay-block` (yellow-dashed),
  `.text-click-test-overlay-block-matched` (solid green),
  `.text-click-test-overlay-block-muted` (dimmed),
  `.text-click-test-overlay-block-label`,
  `.text-click-test-overlay-target` (red dot with white
  halo), `.text-click-test-action-preview-json` (max-height
  280 px, monospace, `<pre>.textContent` only). Dark-theme
  tweaks via `[data-theme="dark"]`. Mobile fallback at
  `max-width: 760px`.
- `docs/TEXT_CLICK_TEST_TOOLS.md` — new doc covering
  purpose, current status, Test OCR flow, Test Text Match
  flow, required data, OCR blocks overlay, action preview,
  what is not executed, troubleshooting, safety notes.
- `docs/TEXT_CLICK_SCENARIO.md` — adds **Test OCR / Test
  Match (Step 34)** section linking to the new doc.
- `docs/OCR_FOUNDATION.md` — adds **Step 34 — mock OCR is
  also used by the text_click test tools** section.
- `docs/SECURITY_CHECKLIST.md` — adds **text_click test
  tools (Step 34)** section with behavioural / pipeline /
  Electron-security invariants.
- `docs/SMOKE_TESTS.md` — adds **Step 34 — Text Click Test
  Tools + OCR UX Polish** smoke checks (#337–#358).
- `scripts/smoke-check.js` — Step 34 invariants (see below).

### Safety invariants kept (Step 34)

- `nodeIntegration: false`, `contextIsolation: true`, CSP
  unchanged.
- `simulationOnly: true`, `realActionsImplemented: false`,
  `realMatching: false`, `realClick: false`,
  `realOcr: false`, `ocrEngineImplemented: false`,
  `tesseractAvailable: false`, `ocrMockOnly: true`,
  `realOcrEnabled: false`, `realTextClickEnabled: false`,
  `testDoesNotClick: true` in every status response, audit
  payload, and diagnostics line.
- Test OCR runs entirely in the renderer. It never opens a
  new IPC channel, never imports `electron`, `ipcRenderer`,
  `fs`, or `localStorage`. `text-click-test-tools.js` and
  `text-click-test-ui.js` contain no `require()` of any
  prohibited module (`tesseract` / `tesseract.js` /
  `opencv4nodejs` / `@u4/opencv4nodejs` / `opencv.js` /
  `opencv-js` / `sharp` / `jimp` / `pixelmatch` /
  `looks-same` / `robotjs` / `nut-js` / `nutjs` /
  `@nut-tree/nut-js` / `iohook` / `uiohook-napi` /
  `node-key-sender`).
- The mock desktop adapter does not consume `text_click`
  preview-mode actions. The dry-run sandbox does not consume
  `text_click` either. Any `realClick: true` /
  `realOcr: true` is rejected by `validateAction`.
- The action preview is rendered through `<pre>.textContent`.
  No HTML interpolation. The click engine, the action
  pipeline, the mock adapter, and the dry-run sandbox do not
  consume `mode: "preview"` actions.
- The screenshot is never persisted on disk by Test OCR.
  The debug result is never written into `scenarios.json`,
  `settings.json`, `profiles.json`, `templates.json`, or
  `localStorage`. Module-local `_lastTextClickTestResult`
  lives in renderer memory and is cleared on
  `clearTextClickTestResult()` and on every scenario form
  open / close.
- Audit payloads carry only ids and short metadata. No
  `imageDataUrl`, no thumbnails, never the full target text
  (only `targetTextLen` / `textLen`), no PII.

## [Unreleased] — Steps 15-33

### Added (Step 33 — Text Click Scenario Type Foundation)

- `src/scenario-manager.js`:
  - `validateTextClickScenario(input)` — validates name,
    target text, language (`ru` / `en` / `ru+en`), match mode
    (`contains` / `exact`), case-sensitive, optional region
    (numbers only), `timeoutMs >= 1000`, `intervalMs >= 100`,
    `repeatCount` 1..1000.
  - `_buildTextClickScenarioFromInput(input, baseId)` — pure
    helper that builds the text_click record with normalised
    settings.
  - `createTextClickScenario(input)`,
    `updateTextClickScenario(id, updates)`,
    `getTextClickScenarios()`.
  - `createScenario` / `updateScenario` dispatch to the
    text_click branch when `type === 'text_click'`. Missing
    `type` is still treated as `simple_click` for backward
    compatibility.
  - `TEXT_CLICK_ALLOWED_LANGUAGES` and
    `TEXT_CLICK_ALLOWED_MATCH_MODES` are tiny frozen-style
    arrays so adding a new value requires a code change in
    three places (engine + manager + i18n).
- `src/click-engine.js`:
  - `validateRunnableScenario` learns the third type. Routing:
    `image_click` → `runImageClickScenario`,
    `text_click` → `runTextClickScenario`,
    everything else → simple_click validation.
  - `runScenario` dispatches `text_click` to
    `runTextClickScenario`.
  - `runTextClickScenario(scenario, callbacks, options)` —
    runs the full simulation-only flow:
    1. validate target text and screen preview;
    2. for each iteration: build OCR input via
       `createOcrInput`, run Step-32 `runMockOcr`,
       search recognised blocks via `findTextInOcrBlocks`,
       and dispatch the simulated `text_click` action through
       `executeAction(action, ctx)`;
    3. emit `scenario.textClick.*` audit events with only
       short metadata (NEVER the full target text);
    4. honor `stopEngine()` and the user's safety bounds
       (`safety.minIntervalMs`, `safety.maxRepeatCount`).
- `src/action-pipeline.js`:
  - `validateAction` accepts `text_click` actions with a
    non-empty `text`, a valid `targetPoint`, and BOTH
    `realClick: !== true` AND `realOcr: !== true`.
  - The simulate path emits `action.textClick.simulated`
    (payload carries `textLen`, NEVER the full text).
  - `blockRealAction` emits `action.textClick.realBlocked`
    with the exact reason in the payload (`reason:
    "...realClick=true rejected"` or `"...realOcr=true
    rejected"`).
  - The mock desktop adapter is BYPASSED for `text_click`
    (it only knows `click`); the legacy simulate path is
    used. The dry-run sandbox does NOT consume `text_click`.
  - A defensive double-check inside the simulate path
    rejects `text_click` with `realClick: true` or
    `realOcr: true` even if a buggy future caller bypasses
    `validateAction`.
- `src/safety-gates.js`:
  - `validateActionSafety` learns the third action type with
    the same `realClick: false` / `realOcr: false` invariants
    as the action-pipeline.
- `src/audit-events.js`:
  - 9 new allowlisted event types:
    `scenario.textClick.started`,
    `scenario.textClick.ocr.started`,
    `scenario.textClick.ocr.completed`,
    `scenario.textClick.textFound`,
    `scenario.textClick.noTextFound`,
    `scenario.textClick.simulated`,
    `scenario.textClick.failed`,
    `action.textClick.simulated`,
    `action.textClick.realBlocked`.
- `src/i18n.js` — 22 new keys per language (RU + EN):
  `textClick`, `textClickScenario`,
  `createTextClickScenario`, `editTextClickScenario`,
  `textClickSettings`, `clearScenarioRegion`,
  `mockOcrOnlyNotice`, `textClickSimulated`,
  `textClickNoMatch`, `textClickMissingPreview`,
  `textClickMissingTargetText`, `mockOcrStarted`,
  `targetTextFound`, `textClickTarget`,
  `realTextClickDisabled`, `lastTextClickResult`,
  `textClickScenariosCount`, `textClickSimulationOnly`,
  `textClickScenarioCompleted`, `textClickScenarioFailed`,
  `textClickRealOcrDisabled`. (`targetText`, `ocrLanguage`,
  `matchMode`, `contains`, `exact`, `caseSensitive`,
  `useSelectedRegion`, `realOcrDisabled`, `targetTextRequired`
  are reused from Step 32.)
- `src/index.html`:
  - The scenario-type select now has three options:
    `simple_click`, `image_click`, `text_click`.
  - New `<div id="form-section-text-click" class="form-section
    view-hidden">` with a yellow mock-OCR notice, a red
    no-preview warning, target text input, language /
    match-mode selects, case-sensitive checkbox, region
    summary + Use selected region / Clear scenario region
    buttons, timeout / interval / repeat inputs.
- `src/renderer.js`:
  - New DOM references for the text_click form fields.
  - `getScenarioFormData()` / `fillScenarioForm()` /
    `clearScenarioForm()` / `formatLastAction()` /
    `formatScenarioSettingsLine()` learn the third type.
  - `syncScenarioFormSections()` toggles the new
    `form-section-text-click` and refreshes the warning + the
    region summary.
  - The run-scenario `onAction` callback logs `text_click`
    events (text truncated to 60 chars in the log line).
  - New **text_click scenario** diagnostics card in
    `renderAdvancedSafety` with last-run rows + always-on
    safety reminders.
  - New `Text click scenario:` line in `Copy diagnostics`
    (numeric / metadata only — `lastTextClickTextLen` instead
    of the full text).
  - `applySelectedRegionToTextClickForm`,
    `clearTextClickFormRegion`,
    `refreshTextClickRegionSummary`,
    `refreshTextClickPreviewWarning`,
    `bindScenarioFormTextClickHandlers`.
- `src/styles.css` — new section "Step 33 — text_click
  scenario type": `.text-click-mock-ocr-notice` (yellow
  banner), `.text-click-no-preview` (red banner),
  `.text-click-region-summary`,
  `.text-click-region-summary-active`,
  `.scenario-card-badge-text-click` (yellow),
  `.form-row-checkboxes`, `.form-checkbox-label`. Dark theme
  variants. Mobile fallback at `max-width: 760px`.
- `docs/TEXT_CLICK_SCENARIO.md` — new doc covering purpose,
  current status, scenario format, target text, OCR settings,
  optional region, execution flow, simulation-only behavior,
  what is not implemented, future real OCR integration, and
  future real click integration.
- `docs/ACTION_SCHEMA.md` — adds **Step 33 — `text_click`
  action (simulation-only)** section with shape, validation,
  routing, and audit.
- `docs/REGION_SELECTOR.md` — adds note that the region can
  scope a `text_click` scenario.
- `docs/OCR_FOUNDATION.md` — adds note that the mock OCR
  engine is now used by the `text_click` scenario.
- `docs/SECURITY_CHECKLIST.md` — adds **text_click scenario
  (Step 33)** section with behavioural / storage / pipeline /
  audit / Electron-security invariants.
- `docs/SMOKE_TESTS.md` — adds **Step 33 — Text Click Scenario
  Type Foundation** smoke checks (#319–#336).
- `docs/KNOWN_LIMITATIONS.md` — adds new section
  **16. text_click uses mock OCR only (Step 33)** covering
  "no real text recognition", "no real click from
  text_click", "no `text_click` Test Match panel yet", "no
  live-screen OCR".
- `scripts/smoke-check.js` — Step 33 invariants (see below).

### Safety invariants kept (Step 33)

- `nodeIntegration: false`, `contextIsolation: true`, CSP
  unchanged.
- `simulationOnly: true`, `realActionsImplemented: false`,
  `realMatching: false`, `realClick: false`, `realOcr: false`,
  `ocrEngineImplemented: false`, `tesseractAvailable: false`,
  `ocrMockAvailable: true` in every status response, audit
  payload, and diagnostics line.
- `text_click` scenarios run entirely in the renderer. They
  never open a new IPC channel. `main.js` registers no
  `scenario.textClick.*` / `action.textClick.*` handler;
  `preload.js` exposes no `textClick.*` API.
- The action-pipeline rejects `text_click` actions with
  `realClick: true` AND `realOcr: true` AND
  `executionMode: "real"`. Even a fake real-OCR-flag never
  translates into a click. The mock desktop adapter and the
  dry-run sandbox refuse to consume `text_click` outright.
- `imageDataUrl` never enters scenarios, audit payloads, or
  the diagnostics line. The full target text never enters
  audit payloads or the diagnostics line either — only its
  length (`textLen`).
- No new dependencies (no `tesseract`, `tesseract.js`,
  `tesseract-ocr`, `node-tesseract-ocr`, `opencv4nodejs`,
  `@u4/opencv4nodejs`, `opencv.js`, `opencv-js`, `sharp`,
  `jimp`, `pixelmatch`, `looks-same`, `robotjs`, `nut-js`,
  `iohook`, `uiohook-napi`).

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
