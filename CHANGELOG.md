# Changelog

All notable changes to **ClickFlow** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project follows a step-based development log (see README).
This project is currently in **beta** — `simulation-only`.

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
