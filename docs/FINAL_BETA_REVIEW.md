# ClickFlow — Final Beta Review (0.1.0-beta)

This is the final cross-cutting review of the ClickFlow beta MVP at
the close of Step 15. It is the single page reviewers should read
before signing off the GitHub `v0.1.0-beta` pre-release.

> **Reading order.** This doc summarizes status only.
> Source of truth for individual concerns:
> - `RELEASE_NOTES.md` — what shipped.
> - `docs/KNOWN_LIMITATIONS.md` — what intentionally did not ship.
> - `docs/ROADMAP.md` — what comes next.
> - `docs/SECURITY_CHECKLIST.md` — Electron security stance.
> - `docs/SMOKE_TESTS.md` — manual verification checklist.
> - `docs/PRIVACY.md` — local-data and diagnostics policy.

---

## Current status

- Release line: `0.1.x`.
- Version: **`0.1.0-beta`**.
- Mode: **simulation-only**. The runtime click engine never
  produces real OS input.
- Steps 1–16 of the development plan are complete.
- `npm run smoke` (Step 15 helper) verifies the static repository
  invariants without launching Electron.

## What works

- Electron app shell (`contextIsolation: true`, `nodeIntegration: false`).
- Application menu, tray icon, lifecycle prompt when quitting while
  a scenario is running.
- Scenarios CRUD, default `simple_click`, persistence.
- `click-engine` runs scenarios as a fully internal loop with
  progress and logs.
- Start / Stop / Emergency Stop (Escape and `CmdOrCtrl+Alt+E`).
- Settings (language, theme, safety limits) with normalize-on-load.
- Localization RU / EN, switchable on the fly.
- Advanced dashboard with seven tabs.
- Profiles, import / export, backup, settings reset.
- Diagnostics with safe Beta-health card and Feature-flags card.
- `error-manager` and visible error history.
- Global hotkeys via `globalShortcut` (`CmdOrCtrl+Alt+S/X/E`).
- `electron-builder` configuration for Win NSIS, macOS DMG, Linux
  AppImage, with a local SVG app mark in `assets/icons/`.
- Resilient JSON loaders: corrupted `scenarios.json`, `settings.json`,
  or `profiles.json` is **renamed** to `<file>.broken-<timestamp>` and
  defaults take over without crashing.
- Static `scripts/smoke-check.js` smoke harness (Step 15).

## What is simulation-only

- The `click-engine` does not call any OS input API. Every "click"
  is an internal callback that only updates progress and logs.
- The `Future` tab in the Advanced dashboard advertises real desktop
  clicks, OCR, image recognition, and the desktop action adapter as
  **planned**, never as enabled.
- `src/feature-flags.js` exposes `realDesktopActions: false`, `ocr: false`,
  `imageRecognition: false`. There is no UI lever that flips them.
- The Diagnostics output explicitly contains
  `Simulation only: true` and the feature-flags row.

## What is not implemented (and is documented)

- Real mouse / keyboard input.
- OCR.
- Image recognition / OpenCV.
- Mobile build.
- Cloud sync.
- Auto-update.
- Code signing.
- Permanently out of scope: captcha bypass, antibot bypass,
  ad-click automation, automation against banking / payment /
  protected applications.

## Security checks

- `contextIsolation: true` (verified via `smoke-check`).
- `nodeIntegration: false` (verified via `smoke-check`).
- CSP `default-src 'self'; script-src 'self'; style-src 'self';`
  unchanged (verified via `smoke-check`).
- Renderer never receives a raw `ipcRenderer` — only the
  `window.clickflow.*` surface from `preload.js`.
- All user-supplied strings are rendered with `textContent`.
  The only `innerHTML` calls are `= ''` to clear containers.
- No `eval`, no `new Function`, no `setTimeout("string", ...)`.
- No remote scripts, no remote stylesheets, no remote `<img>`.
- Diagnostics never include private filesystem paths.
- `package.json` and source files **must not** declare or import
  `robotjs`, `nut.js`, `iohook`, or `node-key-sender`. Verified by
  `npm run smoke`.

## UX checks

- Main screen stays minimal: status, scenario, progress, big
  Start/Stop, three secondary entry points, Safe-mode footer,
  "Simulation mode" badge, version badge.
- Advanced dashboard fits 1000 x 700 with responsive grids.
- Forms use focus rings, disabled states, validation messages.
- Dark theme rewritten with full token override (Step 13).
- All long async I/O has visible feedback in the log strip.
- Reset / import / export flows always emit a localized log entry,
  never a raw error.
- Empty states for logs, scenarios, errors, profiles.

## Localization checks

- All UI strings live in `src/i18n.js` under both `ru` and `en`.
- The smoke-check helper does not load the renderer, but every key
  used in the renderer is present in both locales (manual audit
  for Step 15: 17 new keys added in this step also exist in both
  locales).
- Theme switch and language switch never crash a partially rendered
  view.

## Packaging checks

- `package.json → build` declares `appId`, `productName`, `files`,
  `directories.buildResources`, and per-platform targets
  (`win.target = nsis`, `mac.target = dmg`, `linux.target = AppImage`).
- `assets/` ships a local SVG mark + READMEs.
- `package.json → scripts.smoke = node scripts/smoke-check.js`.
- Smoke check confirms `package.json.main === "main.js"`.

## Known risks

- Tray ships an empty `nativeImage` placeholder. Public packaged
  builds need real PNG/ICO/ICNS first.
- No code signing yet — Gatekeeper / SmartScreen will warn on first
  launch of any packaged binary.
- No automated end-to-end harness yet. Manual smoke tests only
  (`docs/SMOKE_TESTS.md`).
- `globalShortcut` semantics on Linux vary by desktop environment;
  ClickFlow surfaces this via the Advanced → Safety hotkey card.
- The "Beta health" IPC reads files inside the app installation. If
  someone runs an extracted source tree with renamed docs, those
  rows correctly turn `no` — that is expected behavior, not a bug.

## Go / No-Go summary

| Concern                      | Status   |
|------------------------------|----------|
| Simulation-only invariants   | **Go**   |
| Electron security flags      | **Go**   |
| CSP                          | **Go**   |
| Diagnostics privacy          | **Go**   |
| Localization RU + EN         | **Go**   |
| Reset / import / export UX   | **Go**   |
| Corrupted-JSON resilience    | **Go**   |
| Beta polish (Step 13)        | **Go**   |
| Release docs (Step 14)       | **Go**   |
| `npm run smoke`              | **Go**   |
| Public real-input shipping   | **No-Go** — see `docs/REAL_ACTIONS_GO_NO_GO.md` |
| Code-signed installers       | **No-Go** — planned for `0.1.x` polish |
| Automated CI smoke           | **No-Go** — planned for `0.1.x` polish |

**Overall recommendation for `v0.1.0-beta` GitHub pre-release: Go.**
Real desktop input remains **No-Go** and gated behind
`docs/REAL_ACTIONS_GO_NO_GO.md`.
