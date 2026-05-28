# ClickFlow 0.1.0-beta Final Release Summary

This is the single-page snapshot a maintainer reads immediately
before publishing the `v0.1.0-beta` GitHub pre-release. It is the
final cross-link between the longer release docs.

> **Reading order.** This page = the executive summary.
> [`docs/RELEASE_FINAL_CHECK.md`](./RELEASE_FINAL_CHECK.md) =
> sign-off. [`docs/PRE_RELEASE_CHECKLIST.md`](./PRE_RELEASE_CHECKLIST.md)
> = the boxes you tick. [`docs/RELEASE_TAG_PLAN.md`](./RELEASE_TAG_PLAN.md)
> = the manual command sequence. [`docs/GITHUB_RELEASE_DRAFT.md`](./GITHUB_RELEASE_DRAFT.md)
> = the body you paste into GitHub.

---

## Release

- **Version:** `0.1.0-beta`
- **`package.json` version field:** `0.1.0` (the `-beta`
  qualifier lives on the GitHub tag, not the runtime version).
- **Type:** Beta / Pre-release. The GitHub release MUST be
  marked **Pre-release**.
- **Mode:** **Simulation-only.**
- **Step closing this work:** 24 — Final beta release
  preparation.

## Current status

- All static / structural / source-level checks pass at the
  close of step 24.
- `npm run smoke` reports `Failed: 0` (170+ checks at step 24).
- All six runtime safety layers refuse real desktop input
  (verified by the vm-based unit-style harness; the result is
  reproduced in every step PR description).
- i18n parity is exact: every key in `ru` is in `en` and
  vice-versa; every `data-i18n` attribute and every `t()` call
  resolves in both locales.
- DOM ids in `src/index.html` have no duplicates and no
  unresolved references from `src/renderer.js`.
- Mock adapter self-test passes 4 / 4.
- Corrupted-JSON fallback verified: `scenarios.json`,
  `settings.json`, `profiles.json` are renamed to
  `<file>.broken-<timestamp>` if unparseable, and the renderer
  uses defaults without crashing.
- `package.json` declares no `robotjs` / `nut.js` / `iohook` /
  `uiohook-napi` / `node-key-sender`.
- `docs/RELEASE_BLOCKERS.md` reports **no automated/static
  release blockers.** Manual packaged-app QA on at least one
  target OS is the only remaining gate.

## Included in this beta

- Default `simple_click` scenario.
- Scenario CRUD (create / edit / delete / persistence /
  validation).
- Simulation execution via `click-engine` (no OS input).
- Progress card with bar, percentage, step counter, last
  simulated action.
- Stop and Emergency Stop (`Escape` and global
  `CmdOrCtrl+Alt+E`).
- Settings: language (RU / EN), theme (system / light / dark),
  safety limits (`minIntervalMs`, `maxRepeatCount`).
- Localization RU / EN with on-the-fly switching.
- Profiles (default / work / testing / personal) with active
  profile selection.
- Import / export / backup for scenarios; export / import /
  reset for settings.
- Advanced dashboard with seven tabs (Overview, Scenarios,
  Execution, Logs, Settings, Safety, Future).
- Diagnostics with `Copy diagnostics` (no private paths).
- `error-manager` and visible error history.
- Global hotkeys via `globalShortcut`
  (`CmdOrCtrl+Alt+S/X/E`), tray icon, application menu,
  lifecycle prompt when quitting while a scenario is running.
- **Action pipeline** + **safety gates** + in-memory
  **audit events** (Step 17).
- **Mock desktop adapter** with self-test (Step 18).
- **Real-action sandbox** with dry-run preview, permission
  checklist (11 items), and blocked reasons (7 ids)
  (Step 19).
- **Beta health** card, **Feature flags** card,
  **Real actions readiness** checklist, **Audit events**
  summary, **Desktop adapter status**, **Real action
  sandbox**, and **Release status** card in Advanced → Safety.
- `npm run smoke` static smoke harness (no Electron, no deps).
- Packaging configuration via `electron-builder`.
- Release documents:
  [`RELEASE_CHECKLIST.md`](./RELEASE_CHECKLIST.md),
  [`BUILD_ARTIFACTS.md`](./BUILD_ARTIFACTS.md),
  [`GITHUB_RELEASE_DRAFT.md`](./GITHUB_RELEASE_DRAFT.md),
  [`VERSIONING.md`](./VERSIONING.md),
  [`RELEASE_FINAL_CHECK.md`](./RELEASE_FINAL_CHECK.md),
  [`TAG_AND_RELEASE_GUIDE.md`](./TAG_AND_RELEASE_GUIDE.md),
  [`RELEASE_BLOCKERS.md`](./RELEASE_BLOCKERS.md),
  [`PACKAGED_APP_QA.md`](./PACKAGED_APP_QA.md),
  this page,
  [`PRE_RELEASE_CHECKLIST.md`](./PRE_RELEASE_CHECKLIST.md),
  [`RELEASE_TAG_PLAN.md`](./RELEASE_TAG_PLAN.md),
  [`RELEASE_COMMIT_MESSAGE.md`](./RELEASE_COMMIT_MESSAGE.md).

## Not included (intentional)

- **Real system clicks.**
- **OCR.**
- **Image recognition / OpenCV.**
- **Mobile version.**
- **Cloud sync, auto-update, telemetry.**
- **Code signing** (Authenticode, notarization) — known
  limitation `KNI-1` / `KNI-2`.
- File-based audit log persistence — known limitation `KNI-4`.
- GitHub Actions CI — known limitation `KNI-5`.
- Cross-platform builds — known limitation `KNI-7`.
- **Permanently out of scope:** captcha bypass, antibot bypass,
  ad-click automation, automation against banking / payment /
  protected applications.

See [`docs/KNOWN_LIMITATIONS.md`](./KNOWN_LIMITATIONS.md) and
[`docs/RELEASE_BLOCKERS.md`](./RELEASE_BLOCKERS.md) for the full
non-blocking-issues list.

## Safety status

Six independent layers all refuse real desktop input. Each was
verified at source by `npm run smoke` and at runtime by the vm
harness:

| # | Layer                                         | Predicate / behavior                                                                                       |
|---|-----------------------------------------------|------------------------------------------------------------------------------------------------------------|
| 1 | `src/feature-flags.js`                        | `realDesktopActions: false` (frozen).                                                                      |
| 2 | `src/safety-gates.js`                         | `isRealActionAllowed()` → `false`.                                                                         |
| 3 | `src/desktop-adapter-interface.js`            | `isRealAdapterAllowed()` → `false`.                                                                        |
| 4 | `src/adapter-registry.js`                     | `setActiveAdapter("real-desktop")` → `{success: false, blocked: true}`.                                    |
| 5 | `src/action-pipeline.js`                      | `executeAction(..., {executionMode: "real"})` → `Real desktop actions are disabled. Dry-run preview is available only.` |
| 6 | `src/real-action-sandbox.js`                  | `evaluateRealActionReadiness()` → `{allowed: false, ...}`.                                                 |

Electron security stance:

- `contextIsolation: true`.
- `nodeIntegration: false`.
- CSP `default-src 'self'; script-src 'self'; style-src 'self';`
  unchanged.
- `preload.js` does not expose `ipcRenderer` directly.
- Renderer never receives a raw `ipcRenderer`.

## Required before publishing

```bash
# 1. Clean working tree
git status

# 2. Install
npm install

# 3. Static smoke (must be exit 0)
npm run smoke

# 4. App boots; walk docs/SMOKE_TESTS.md Step 20 + Step 22
npm start

# 5. Build artifacts on the target OS
npm run pack
npm run dist

# 6. Walk docs/PACKAGED_APP_QA.md against the produced binary.
#    Section 13 ("No real clicks verification") is mandatory.
#    Sign off the page at the bottom.

# 7. Confirm the Release decision in
#    docs/RELEASE_BLOCKERS.md is "Ready"; no rows in the
#    Blockers table.

# 8. Sign off docs/RELEASE_FINAL_CHECK.md.

# 9. Walk docs/PRE_RELEASE_CHECKLIST.md end-to-end.
```

If `npm run pack` / `npm run dist` cannot run on the current
build host, document the deferral and reschedule on the right
target OS.

## Release recommendation

**Ready for beta pre-release after manual packaged-app QA.**

- Static and source-level checks all pass.
- The simulation-only contract is verified at six independent
  layers.
- Documentation is internally consistent and references each
  release artifact.
- The remaining gate is the manual packaged-app walk on at
  least one target OS, signed off at the bottom of
  [`docs/PACKAGED_APP_QA.md`](./PACKAGED_APP_QA.md), with
  `docs/RELEASE_BLOCKERS.md` decision = "Ready".
- After that, follow
  [`docs/RELEASE_TAG_PLAN.md`](./RELEASE_TAG_PLAN.md) to create
  the tag and GitHub Release. **Tag and publication remain
  manual.**

## Sign-off

- Date: ____
- Maintainer: ____
- Decision: Ready for beta pre-release / Not ready
