# ClickFlow 0.1.0-beta — Release Notes

## Summary

ClickFlow `0.1.0-beta` is the first public beta of a minimal,
cross-platform, **simulation-only** click-flow automator built on
Electron and vanilla JavaScript. It is intended for testing the user
experience, the safety model, and the persistence layer **without**
performing any real system input.

This release closes Steps 1 — 24 of the development plan and is
the candidate basis for a public GitHub pre-release.

> **Quick safety summary.** Six independent layers refuse real
> desktop input: feature flags, safety gates, adapter interface,
> adapter registry, action pipeline, and the dry-run sandbox.
> No real cursor movement and no real keystrokes are produced by
> this build. See **§ Safety model** below.
>
> **Beta note.** This is a beta pre-release. **Manual packaged-app
> testing is recommended before relying on a build for any
> non-test workflow.** See `docs/PACKAGED_APP_QA.md`,
> `docs/PRE_RELEASE_CHECKLIST.md`, and
> `docs/RELEASE_BLOCKERS.md`.

---

## What works

### Core
- App shell with `contextIsolation: true`, `nodeIntegration: false`,
  CSP `default-src 'self'`.
- Application menu (ClickFlow / Scenario / View / Help).
- Tray icon with Show / Start / Stop / Emergency Stop / Quit.
- Lifecycle: confirmation when quitting while a scenario is running.

### Scenarios
- Default `simple_click` scenario.
- Create / edit / delete user scenarios.
- Validation, name & numeric bounds.
- Persistence to `userData/scenarios.json` via main-process IPC.

### Execution (simulation)
- `click-engine` simulates clicks at the configured interval and
  repeat count. **No system input is generated.**
- Progress card with bar, percentage, step counter and last simulated
  action.
- Start / Stop / Emergency Stop (Escape and global
  `CmdOrCtrl+Alt+E`).

### Settings & safety
- Language (RU / EN), theme (system / light / dark).
- Safety: safe mode (always on for this release), emergency stop,
  minimum interval, maximum repeats.
- Settings persistence with normalize-on-load.

### Profiles, import/export
- Default profiles (default / work / testing / personal).
- Active profile selection.
- Import scenarios with preview / confirm / cancel flow.
- Export all / custom / backup variants.
- Import / export / reset for settings (JSON, validated).

### Diagnostics
- Diagnostics summary in **Advanced → Safety**.
- Copy diagnostics to clipboard (no private filesystem paths).
- Error history with codes (`error-manager`).

### Localization
- RU / EN, all UI strings via i18n with `data-i18n` attribute.
- Language change is immediate and persists.

### Global hotkeys
- `CmdOrCtrl+Alt+S` — start.
- `CmdOrCtrl+Alt+X` — stop.
- `CmdOrCtrl+Alt+E` — emergency stop.
- `Escape` (in-window) — emergency stop.

### Packaging
- `electron-builder` configured for Windows (NSIS), macOS (DMG)
  and Linux (AppImage).
- `npm run pack` for unpacked builds.
- `npm run dist` for installer artifacts.
- `assets/` directory with a local SVG icon and packaging-resource
  documentation.

### Beta polish (this release)
- "Simulation mode" badge and version badge on the main screen.
- Re-worked `styles.css` with design tokens, polished forms, polished
  dashboard, animated status indicator.
- Re-worked dark theme (full token override + per-component fixes).
- Responsive layout for the 1000 x 700 advanced window.

### Step 17 — Controlled action pipeline
- `src/action-pipeline.js` — central `executeAction()`.
- `src/safety-gates.js` — `isRealActionAllowed()` hard-coded `false`.
- `src/audit-events.js` — in-memory allowlist event store
  (no file persistence yet).
- Real-mode requests are blocked with `Real desktop actions are
  disabled. Dry-run preview is available only.`

### Step 18 — Desktop adapter interface + mock adapter
- `src/desktop-adapter-interface.js` — adapter contract.
- `src/mock-desktop-adapter.js` — the only `available: true`
  adapter. Self-test passes 4 / 4. **No OS input.**
- `src/adapter-registry.js` — `setActiveAdapter("real-desktop")`
  is blocked.

### Step 19 — Real-action sandbox
- `src/real-action-sandbox.js` — read-only dry-run preview layer.
  Permission checklist (11 items), blocked reasons (7 ids).
  `evaluateRealActionReadiness()` always returns
  `{ allowed: false }`. **No real execution, ever.**

### Step 20 — Final beta QA
- Static structural audit: 0 dup ids, 0 missing refs, 0 forbidden
  imports, RU/EN parity 359/359.
- Smoke check 113 invariants, exit 0.
- `docs/BETA_QA_REPORT.md`, `docs/I18N_CHECKLIST.md`.

### Step 21 — Beta release packaging pass
- `.gitignore`, extended `package.json` `build` block, explicit
  exclusions for `*.broken-*` and OS junk.
- `docs/RELEASE_CHECKLIST.md`, `docs/BUILD_ARTIFACTS.md`,
  `docs/GITHUB_RELEASE_DRAFT.md`, `docs/VERSIONING.md`.
- New IPC `system:get-release-status` and a **Release status**
  diagnostics card.

### Step 22 — GitHub beta release finalization
- `docs/RELEASE_FINAL_CHECK.md` — short pre-tag sign-off page.
- `docs/TAG_AND_RELEASE_GUIDE.md` — manual git / GitHub
  command sequence.
- Smoke check expanded; Release status card now also reports the
  presence of the final-check and tag-and-release-guide docs.

### Step 23 — Post-pack QA and release blocker pass
- `docs/RELEASE_BLOCKERS.md` — release-blocker tracker.
  No active blockers after automated and static checks.
- `docs/PACKAGED_APP_QA.md` — manual checklist for the packaged
  binary, including a mandatory "no real clicks verification"
  step.
- Smoke check expanded to 168 invariants.
- Release status diagnostics card extended with Release blockers
  / Packaged app QA / Packaged app tested rows; badge now reads
  `Ready after manual QA`.
- **Manual packaged-app testing on at least one target OS is
  required before publishing the GitHub release tag.**

### Step 24 — Final beta release preparation
- `docs/FINAL_RELEASE_SUMMARY.md` — single-page release snapshot
  with included / not included / safety status / required steps
  / release recommendation.
- `docs/PRE_RELEASE_CHECKLIST.md` — the boxes the maintainer
  ticks before tagging.
- `docs/RELEASE_TAG_PLAN.md` — the manual command sequence the
  maintainer follows.
- `docs/RELEASE_COMMIT_MESSAGE.md` — the recommended commit
  message for the release-prep commit, including a list of body
  lines that are forbidden because they would contradict the
  build (no claims of real input / OCR / image recognition /
  mobile / `realDesktopActions` flip).
- Release decision in `docs/RELEASE_BLOCKERS.md`: "Pending
  manual verification — no automated/static release blockers".
- Smoke check expanded to 170+ invariants.

---

## Safety model

ClickFlow is **simulation-only** in this release.

- The `click-engine` does **not** call any OS input API.
- There is no `robotjs`, no `nut.js`, no `iohook`, no native bindings
  that move the mouse or fire keyboard events.
- All file system access is funneled through main-process IPC handlers
  in `main.js`.
- The renderer never has direct `ipcRenderer` access; the `preload.js`
  contextBridge exposes only a fixed `window.clickflow` surface.
- Emergency stop is always enabled and is the most defensive control:
  it short-circuits the engine loop immediately.
- Real system input requires a separate **safety review** before it is
  ever shipped (see `CONTRIBUTING.md` and `docs/DESKTOP_ADAPTER_PLAN.md`).

---

## Known limitations

A short overview here; full list in `docs/KNOWN_LIMITATIONS.md`.

- No real system clicks. **Simulation-only.**
- No OCR. No image recognition. No OpenCV bindings.
- No mobile build.
- No cloud sync.
- No auto-update.
- Tray icon ships empty (placeholder `nativeImage`); a packaged icon
  must be provided per platform before public distribution.
- Global hotkeys depend on the OS — on Linux, this varies by desktop
  environment and may require permissions.
- Theme / RU-EN switch redraws the dashboard, but does not animate.
- Manual smoke-test plan only; no automated test suite yet.

---

## How to run

Requires Node.js 18+ and npm.

```bash
git clone https://github.com/Citrus-cloud/Mine.git clickflow
cd clickflow
npm install
npm start
```

The default window opens the **Main** view. Use:
- `Settings` to switch language / theme,
- `Choose scenario` to manage scenarios,
- `Advanced mode` to open the dashboard with diagnostics, profiles,
  full logs, safety readiness, future features.

---

## How to test

See `docs/BETA_TESTING_GUIDE.md` for the full beta-tester walkthrough,
`docs/SMOKE_TESTS.md` Step 20 / Step 22 for the manual smoke run,
and `docs/RELEASE_FINAL_CHECK.md` for the maintainer pre-tag
sign-off.

Quick smoke test:

1. Launch with `npm start`.
2. Press **Start** on the default scenario; confirm progress card fills,
   logs appear, and **no** real cursor movement happens anywhere on the
   desktop.
3. Press **Stop**, then **Escape** during a fresh run for emergency stop.
4. Open **Settings** → switch language → save → confirm UI updates.
5. Open **Settings** → switch theme to **Dark** → save → confirm dark
   theme is consistent across all views.
6. Open **Advanced** → cycle all 7 tabs → check **Safety → Diagnostics**
   shows `simulationOnly: true` and **no** filesystem paths.
7. Open **Advanced → Scenarios → Export All** → save JSON → re-import →
   confirm preview → confirm import.
8. Trigger global hotkey `CmdOrCtrl+Alt+S` while another window is
   focused — ClickFlow should pick it up.

If any of these fail, please file a bug report (see below).

---

## What is not implemented

- Real system clicks of any kind.
- OCR.
- Image recognition / template matching / OpenCV.
- Mobile (iOS / Android) version.
- Cloud sync, account system, telemetry.
- Auto-update.
- Captcha / antibot bypass — **out of scope permanently**.
- Ad-click automation — **out of scope permanently**.
- Automation against banking, payment, or any protected application
  — **out of scope permanently**.

---

## Next steps

Planned for upcoming releases (see `docs/ROADMAP.md`):

- `0.1.x` — additional beta polish, accessibility audit, automated
  smoke harness, GitHub Actions CI for `npm run smoke`, the first
  signed builds.
- `0.2.x` — profile and template improvements, richer import/export,
  better error reporting.
- `0.3.x` — desktop action adapter prototype, **gated behind a separate
  safety review**, opt-in by default to "off". Real-input work will not
  ship without an explicit safety review and explicit user confirmation.
- Future research — OCR, image recognition, and a possible mobile
  client are research items only and will not ship in this release line.

---

## Reporting issues

- Bug: `.github/ISSUE_TEMPLATE/bug_report.md`
- Feature request: `.github/ISSUE_TEMPLATE/feature_request.md`
- Safety concern: `.github/ISSUE_TEMPLATE/safety_report.md`

Thank you for testing ClickFlow.
