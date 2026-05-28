# ClickFlow 0.1.0-beta — GitHub Release Draft

Copy the body below into the GitHub Release form for the
`v0.1.0-beta` tag. Mark the release as **Pre-release**.

---

## Title

`ClickFlow 0.1.0-beta`

## Summary

ClickFlow is a minimal cross-platform click-flow automator built on
Electron and vanilla JavaScript. **`0.1.0-beta` is simulation-only:
no real mouse or keyboard input, no OCR, no image recognition.**
This release is intended for testing the user experience, the
safety model, and the persistence layer **without** producing any
OS input.

The release closes Steps 1 — 21 of the development plan and is the
first public pre-release.

## Highlights

- Electron app shell with `contextIsolation: true`,
  `nodeIntegration: false`, CSP `default-src 'self';
  script-src 'self'; style-src 'self';`.
- Minimal main screen, scenarios CRUD, simulation `click-engine`,
  progress UI, Stop / Emergency Stop.
- Settings (language, theme, safety limits), profiles, import /
  export, backup, error history, diagnostics with `Copy
  diagnostics`.
- Advanced dashboard with 7 tabs.
- Global hotkeys via `globalShortcut`
  (`CmdOrCtrl+Alt+S/X/E`), tray icon, application menu, lifecycle
  prompt when quitting while a scenario is running.
- **Step 17:** controlled action pipeline + safety gates +
  in-memory audit events.
- **Step 18:** desktop adapter interface, mock adapter (active),
  adapter registry. Real adapter registered as
  `available: false, planned: true`.
- **Step 19:** real-action sandbox with dry-run preview,
  permission checklist, blocked reasons. **No real execution.**
- **Step 20:** final beta QA pass. Smoke-check at 96 invariants.
- **Step 21:** beta release packaging pass.
- Localization RU + EN, parity verified (342 keys each).

## Safety model

ClickFlow is **simulation-only** in this release. **Six independent
layers** all refuse real desktop input:

1. `feature-flags.js → realDesktopActions: false`.
2. `safety-gates.js → isRealActionAllowed()` returns `false`.
3. `desktop-adapter-interface.js → isRealAdapterAllowed()` returns
   `false`.
4. `adapter-registry.js → setActiveAdapter("real-desktop")` is
   blocked.
5. `action-pipeline.js → executeAction(..., {executionMode: "real"})`
   returns `Real desktop actions are disabled. Dry-run preview is
   available only.`.
6. `real-action-sandbox.js → evaluateRealActionReadiness()` returns
   `{ allowed: false, ... }`.

The `Copy diagnostics` text in **Advanced → Safety** explicitly
shows `Simulation only: true`, `Sandbox: realActionsAllowed=false,
realActionsImplemented=false`, and `Adapter: active=mock,
realActionsAllowed=false`.

## What works

- Scenarios CRUD, persistence, validation.
- Simulation execution with progress, Stop, Emergency Stop.
- Hotkeys, tray, menu, lifecycle.
- Settings normalization, theme switch, language switch.
- Import / export / backup / reset.
- Diagnostics, error history, Copy diagnostics (no private paths).
- Mock adapter self-test (4 / 4 passing).
- Dry-run preview with permission checklist (11 items) and
  blocked reasons (7 items).
- Corrupted-JSON fallback: a broken `scenarios.json`,
  `settings.json`, or `profiles.json` is renamed to
  `<file>.broken-<timestamp>` and defaults take over without
  crashing.

## What is **not** included

- **No real system clicks.**
- **No OCR.**
- **No image recognition / OpenCV.**
- **No mobile build.**
- **No cloud sync, no auto-update, no telemetry.**
- **No code signing yet.** Gatekeeper / SmartScreen will warn on
  first launch of any packaged binary.
- **Permanently out of scope:** captcha bypass, antibot bypass,
  ad-click automation, automation against banking / payment /
  protected applications.

See [`docs/KNOWN_LIMITATIONS.md`](../docs/KNOWN_LIMITATIONS.md) for
the full list.

## Installation

### Run from source

```bash
git clone https://github.com/Citrus-cloud/Mine.git clickflow
cd clickflow
npm install
npm start
```

Requires Node.js 18+ and npm.

### Run a packaged build

Download the artifact for your platform from this release and
launch it normally. For asset names, see
[`docs/BUILD_ARTIFACTS.md`](../docs/BUILD_ARTIFACTS.md).

> Note. macOS DMGs are **not** notarized in `0.1.0-beta`.
> First launch may require Right-click → Open or
> System Settings → Privacy & Security → "Open anyway".

## Testing notes

Please walk through the manual checklist in
[`docs/SMOKE_TESTS.md`](../docs/SMOKE_TESTS.md) Step 20
(#115–#134). The most important checks:

- Press Start; **no real cursor movement, no input arrives in any
  other application**.
- Press `Escape` during a run — emergency stop fires.
- Switch language; UI updates; restart preserves the choice.
- Open Advanced → Safety. Click **Run adapter self-test**;
  expect `Adapter self-test passed (4/4)`.
- Click **Create dry-run preview**; inspect the action list,
  permission checklist, blocked reasons. Click Confirm; expect
  log entries `Dry-run confirmed. No real actions executed.`
  followed by `Dry-run completed safely`.
- DevTools spot check:
  `executeAction({type:'click',x:1,y:1,button:'left'},{executionMode:'real'})`
  returns `{ ok: false, mode: 'real', blocked: true, error:
  'Real desktop actions are disabled. Dry-run preview is available
  only.' }`. `setActiveAdapter('real-desktop')` returns
  `{ success: false, blocked: true, ... }`.

## Known limitations

See [`docs/KNOWN_LIMITATIONS.md`](../docs/KNOWN_LIMITATIONS.md).

## Download artifacts

> Replace this section with the actual asset list once
> `npm run dist` is executed for the tagged commit.
> See [`docs/BUILD_ARTIFACTS.md`](../docs/BUILD_ARTIFACTS.md) for
> naming.

```
ClickFlow-0.1.0-beta-windows-x64.exe
ClickFlow-0.1.0-beta-windows-x64.zip
ClickFlow-0.1.0-beta-macos-arm64.dmg
ClickFlow-0.1.0-beta-macos-x64.dmg
ClickFlow-0.1.0-beta-linux-x64.AppImage
```

## Feedback / bug reports

- **Bug:** [`.github/ISSUE_TEMPLATE/bug_report.md`](../.github/ISSUE_TEMPLATE/bug_report.md)
- **Feature request:** [`.github/ISSUE_TEMPLATE/feature_request.md`](../.github/ISSUE_TEMPLATE/feature_request.md)
- **Safety concern:** [`.github/ISSUE_TEMPLATE/safety_report.md`](../.github/ISSUE_TEMPLATE/safety_report.md)

When in doubt, file a Safety report.

## Security note

If you observe ClickFlow producing real input on your desktop —
moving the cursor on its own, typing into another window, etc. —
**stop immediately** and file a Safety report. That would be a
regression: by design, this build cannot perform real input.
[`docs/SECURITY_CHECKLIST.md`](../docs/SECURITY_CHECKLIST.md) and
[`docs/PRIVACY.md`](../docs/PRIVACY.md) describe the safety
posture.
