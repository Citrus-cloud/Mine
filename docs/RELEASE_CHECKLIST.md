# ClickFlow — Release Checklist

Mandatory checklist before publishing any GitHub release tag.

> **Current target:** `v0.1.0-beta` (simulation-only). The beta tag
> may be published only after every applicable item below is checked.
> Anything related to **real desktop input** is out of scope and
> remains gated behind `docs/REAL_ACTIONS_GO_NO_GO.md`.

---

## 1. Pre-release checks

- [ ] You are on a clean working tree (`git status` reports nothing).
- [ ] You are on the release branch (or `main` after PR merge).
- [ ] `package.json → version` matches the tag you intend to push
      (`0.1.0` for `v0.1.0-beta`).
- [ ] `package.json → description` is current.
- [ ] All step PRs that should land in this release have been merged.

## 2. Security checks

- [ ] `npm run smoke` passes locally.
- [ ] `main.js` declares `contextIsolation: true` and
      `nodeIntegration: false`. (smoke-check verifies.)
- [ ] `src/index.html` keeps the unchanged CSP
      `default-src 'self'; script-src 'self'; style-src 'self';`.
- [ ] `preload.js` does not expose `ipcRenderer` directly.
- [ ] `package.json` declares no `robotjs` / `nut.js` / `iohook` /
      `uiohook-napi` / `node-key-sender`.
- [ ] No remote scripts, stylesheets, or fonts referenced anywhere.
- [ ] No `eval`, no `Function(...)`, no `setTimeout("string", …)`.

## 3. Simulation-only checks

- [ ] `feature-flags.js → realDesktopActions` is `false`.
- [ ] `safety-gates.js → isRealActionAllowed()` returns `false`.
- [ ] `desktop-adapter-interface.js → isRealAdapterAllowed()` returns
      `false`.
- [ ] `adapter-registry.js → setActiveAdapter("real-desktop")` is
      blocked.
- [ ] `action-pipeline.js → executeAction(..., {executionMode:"real"})`
      returns the literal block message
      `Real desktop actions are disabled. Dry-run preview is available only.`.
- [ ] `real-action-sandbox.js → evaluateRealActionReadiness()`
      returns `{ allowed: false, ... }`.
- [ ] No OCR engine is bundled.
- [ ] No image-recognition / vision library is bundled.

## 4. Packaging checks

- [ ] `npm install` succeeds.
- [ ] `npm run pack` succeeds on the build host
      (`electron-builder --dir`). The unpacked tree appears under
      `dist/`.
- [ ] `npm run dist` succeeds on the build host
      (`electron-builder`). One or more platform installers /
      images appear under `dist/`.
  > Note. `pack` / `dist` may not run inside CI sandboxes that
  > lack platform tooling. In that case, run the steps locally
  > on the target OS before publishing the tag.
- [ ] Inspect `dist/` and confirm:
  - [ ] No `node_modules/.cache`, no source maps for third-party
        modules.
  - [ ] No leftover developer artifacts (`.broken-*`, `*.tmp`,
        `userData/`, `dist/` nested inside `dist/`).
  - [ ] `assets/icons/clickflow-icon.svg` is included; if you have
        produced platform-specific raster icons, verify they are
        used by the installers.
- [ ] Smoke-launch the produced binary on at least one platform.
      Confirm Start / Stop / Emergency Stop in **simulation mode**
      and that no real cursor movement happens.

## 5. Documentation checks

- [ ] `README.md` references the current step (21).
- [ ] `PROJECT_CONTEXT.md` references the current step (21).
- [ ] `CHANGELOG.md` has an entry for this release.
- [ ] `RELEASE_NOTES.md` is current and consistent with
      `CHANGELOG.md`.
- [ ] `docs/KNOWN_LIMITATIONS.md` is reviewed.
- [ ] `docs/ROADMAP.md` is reviewed.
- [ ] `docs/SECURITY_CHECKLIST.md` is reviewed.
- [ ] `docs/BETA_QA_REPORT.md` recommendation is "Ready for beta
      after manual testing" or stronger.
- [ ] `docs/GITHUB_RELEASE_DRAFT.md` is finalized for this tag.

## 6. Localization checks

- [ ] `npm run smoke` passes the i18n parity invariants
      (RU keys = EN keys, all `data-i18n` and `t()` resolve).
- [ ] Manual review per `docs/I18N_CHECKLIST.md` is signed off by
      a beta tester.

## 7. Manual QA checks

Walk every entry in `docs/SMOKE_TESTS.md` Step 20 (#115–#134) on at
least one platform. Track pass/fail in the PR description or in a
linked issue.

- [ ] App boots, main screen renders.
- [ ] Create / edit / delete scenario.
- [ ] Run simulation; **no real cursor movement, no input arrives
      anywhere else**.
- [ ] Stop and Emergency Stop (`Escape`, `CmdOrCtrl+Alt+E`).
- [ ] Global hotkeys when ClickFlow is not focused.
- [ ] RU ↔ EN switch.
- [ ] Light ↔ Dark theme.
- [ ] Advanced dashboard cycles all 7 tabs without console errors.
- [ ] Adapter self-test passes 4 / 4.
- [ ] Dry-run preview shows action list, permission checklist,
      blocked reasons, Confirm / Cancel.
- [ ] Confirm dry-run logs `Dry-run confirmed. No real actions
      executed.` and `Dry-run completed safely`.
- [ ] Import / export for scenarios and settings.
- [ ] Reset scenarios / settings / profiles.
- [ ] Corrupted-JSON fallback (manually corrupt a `userData` JSON
      file).
- [ ] DevTools spot-check: `executeAction({...},{executionMode:'real'})`
      blocks; `setActiveAdapter('real-desktop')` blocks.

## 8. GitHub release checklist

- [ ] Branch is pushed and the PR for the step has been merged
      into `main`.
- [ ] Tag `v0.1.0-beta` (or the version you are releasing) is
      created from `main`.
- [ ] GitHub release draft uses the text in
      `docs/GITHUB_RELEASE_DRAFT.md`.
- [ ] **Pre-release** flag is checked.
- [ ] Build artifacts (per `docs/BUILD_ARTIFACTS.md`) are uploaded
      under their canonical names. **Do not upload artifacts that
      were not built from the tagged commit.**
- [ ] Release description points readers to:
  - `docs/KNOWN_LIMITATIONS.md`
  - `docs/PRIVACY.md`
  - `docs/SECURITY_CHECKLIST.md`
  - `.github/ISSUE_TEMPLATE/bug_report.md`
  - `.github/ISSUE_TEMPLATE/safety_report.md`
- [ ] Release explicitly states that real clicks, OCR, and image
      recognition are not implemented.

## 9. Post-release checks

- [ ] Open `Releases` on GitHub, verify the artifacts download.
- [ ] Run the downloaded artifact on at least one platform.
- [ ] `Copy diagnostics` from the launched app contains
      `Simulation only: true`, `Sandbox: realActionsAllowed=false`,
      `Adapter: active=mock, ...realActionsAllowed=false`.
- [ ] If a regression is found post-release, file a Safety report
      issue and prepare a follow-up patch tag.
