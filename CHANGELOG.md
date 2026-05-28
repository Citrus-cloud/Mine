# Changelog

All notable changes to **ClickFlow** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project follows a step-based development log (see README).
This project is currently in **beta** — `simulation-only`.

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
