# ClickFlow — Smoke Tests

Quick verification checklist before release or major changes.
Status: aligned with `0.1.0-beta` (Step 14).

## Pre-requisites

```bash
npm install
```

## Static smoke check (no Electron) — Step 15

| #  | Test                          | Steps                          | Expected                                    |
|----|-------------------------------|--------------------------------|---------------------------------------------|
| 0a | `npm run smoke`               | `npm run smoke`                | Exit code `0`. All checks `OK`. No `FAIL`.  |
| 0b | Smoke check finds main.js     | inspect output                 | Includes `OK file exists: main.js` line.    |
| 0c | Smoke check finds docs        | inspect output                 | All `doc exists:` lines are `OK`.           |
| 0d | Smoke check confirms security | inspect output                 | `main.js sets contextIsolation: true`, `main.js sets nodeIntegration: false`, `src/index.html declares Content-Security-Policy`, no `unsafe-inline` / `unsafe-eval`. |
| 0e | No real-input modules         | inspect output                 | `OK no real-input native modules required in source` and `OK package.json declares no real-input modules`. |
| 0f | Step 17 invariants            | inspect output                 | `OK action-pipeline declares simulationOnly: true`, `realActionsEnabled: false`, `realActionsImplemented: false`, blocks real actions; `OK safety-gates.isRealActionAllowed returns false`; `OK feature-flags.realDesktopActions = false in source`. |
| 0g | Step 17 files                 | inspect output                 | `OK file exists: src/action-pipeline.js`, `safety-gates.js`, `audit-events.js`. |

## Core tests

| #  | Test                       | Steps                                                       | Expected                                            |
|----|----------------------------|-------------------------------------------------------------|-----------------------------------------------------|
| 1  | Launch                     | `npm start`                                                 | App window opens.                                   |
| 2  | Main screen                | Observe UI                                                  | Status, scenario, progress, badges visible.         |
| 3  | Simulation badge           | Look at the header                                          | "Simulation mode" / "Режим имитации" badge present.|
| 4  | Version badge              | Look at the header                                          | `vX.Y.Z` badge present, matches `package.json`.     |
| 5  | Create scenario            | Scenarios → Create → fill → Save                            | Scenario added to the list.                         |
| 6  | Edit scenario              | Scenarios → Edit a custom scenario → Save                   | Changes persist.                                    |
| 7  | Delete scenario            | Scenarios → Delete a custom scenario                        | Removed; default cannot be deleted.                 |
| 8  | Run simulation             | Select scenario → Start                                     | Progress fills, logs appear, status indicator pulses. |
| 9  | Stop simulation            | Click Stop during execution                                 | Stops; status returns to Stopped.                   |
| 10 | Emergency Stop (in-window) | Press Escape during execution                               | Immediate stop.                                     |
| 11 | Change language            | Settings → English → Save                                   | UI switches to English (incl. new beta keys).       |
| 12 | Restart persistence        | Quit → Reopen                                               | Language and scenarios preserved.                   |
| 13 | Import scenario            | Advanced → Scenarios → Import → JSON file                   | Preview shown, confirm adds.                        |
| 14 | Export scenario            | Advanced → Scenarios → Export All                           | File saved.                                         |
| 15 | Advanced dashboard         | Click Advanced mode                                         | 7 tabs visible and switchable.                      |
| 16 | Global hotkeys — start     | Press `CmdOrCtrl+Alt+S` (other window focused)              | Scenario starts.                                    |
| 17 | Global hotkeys — stop      | Press `CmdOrCtrl+Alt+X` during execution                    | Stops.                                              |
| 18 | Global hotkeys — emergency | Press `CmdOrCtrl+Alt+E` during execution                    | Emergency stop.                                     |
| 19 | Menu commands              | Scenario → Start (from app menu)                            | Starts execution.                                   |
| 20 | Quit while running         | Start → close window                                        | Confirm dialog appears.                             |
| 21 | **No real clicks**         | Start scenario → observe desktop / other windows            | **No** mouse movement, **no** key presses anywhere. |
| 22 | Diagnostics                | Advanced → Safety → Copy diagnostics                        | Text on clipboard, contains `Simulation only: true`, no private paths. |

## Beta polish & release prep tests (Steps 13–14)

| #   | Test                              | Steps                                                             | Expected                                                  |
|-----|-----------------------------------|-------------------------------------------------------------------|-----------------------------------------------------------|
| 23  | Visual polish — main              | Visual inspection                                                 | Cards, shadows, badges, focus rings render cleanly.       |
| 24  | Visual polish — advanced          | Advanced → cycle all 7 tabs                                       | No layout breakage in 1000 x 700.                         |
| 25  | Dark theme — main                 | Settings → Dark → Save → Main view                                | Background, cards, badges, progress all dark-correct.     |
| 26  | Dark theme — forms                | Dark → open scenario form / settings form                         | Inputs, selects, textarea, hints, errors readable.        |
| 27  | Dark theme — advanced             | Dark → walk through all 7 tabs                                    | Logs, filter chips, profiles, diagnostics, future cards readable. |
| 28  | Responsive — small window         | Resize the window down to ~760 px wide                            | Form rows stack, action buttons stack, tabs scroll horizontally. |
| 29  | `assets/` exists                  | `ls assets/`                                                      | `README.md`, `icons/README.md`, `icons/clickflow-icon.svg` present. |
| 30  | SVG icon is local                 | Open `assets/icons/clickflow-icon.svg`                            | No remote `href`, no `<script>`, no `<foreignObject>`.    |
| 31  | `CHANGELOG.md` exists             | `ls`                                                              | Present and includes `0.1.0-beta`.                        |
| 32  | `RELEASE_NOTES.md` exists         | `ls`                                                              | Present.                                                  |
| 33  | `CONTRIBUTING.md` exists          | `ls`                                                              | Present.                                                  |
| 34  | GitHub issue templates exist      | `ls .github/ISSUE_TEMPLATE`                                       | `bug_report.md`, `feature_request.md`, `safety_report.md`. |
| 35  | GitHub PR template exists         | `ls .github`                                                      | `pull_request_template.md`.                               |
| 36  | `docs/BETA_TESTING_GUIDE.md`      | `ls docs/`                                                        | Present.                                                  |
| 37  | `docs/KNOWN_LIMITATIONS.md`       | `ls docs/`                                                        | Present.                                                  |
| 38  | `docs/ROADMAP.md`                 | `ls docs/`                                                        | Present.                                                  |
| 39  | README updated                    | Open `README.md`                                                  | Version `0.1.0-beta`, RU + EN summary, GitHub-ready sections. |
| 40  | PROJECT_CONTEXT updated           | Open `PROJECT_CONTEXT.md`                                         | "Шаг 14 завершён" / `0.1.0-beta preparation` status.      |

## No-real-clicks verification

This MUST pass before tagging any release.

| #  | Test                                    | Steps                                                     | Expected                                          |
|----|-----------------------------------------|-----------------------------------------------------------|---------------------------------------------------|
| 41 | No real-input native modules in deps    | `node -e "require('robotjs')"` etc. should fail           | `Cannot find module` for `robotjs`, `nut-js`, `iohook`, `node-key-sender`. |
| 42 | Source has no `robotjs` import          | `grep -R "robotjs\|nut-js\|iohook" main.js src/`         | No matches.                                       |
| 43 | Diagnostics says simulation only        | Advanced → Safety → Copy diagnostics → paste in editor    | `Simulation only: true` present.                  |
| 44 | Cursor stays put on Start               | Start a scenario → watch cursor for 30s                   | No movement.                                      |
| 45 | Other apps receive no input             | Focus an editor → Start                                    | No characters or clicks arrive in the editor.     |

## Security smoke

| #  | Test                              | Steps                                                                | Expected                                                    |
|----|-----------------------------------|----------------------------------------------------------------------|-------------------------------------------------------------|
| 46 | `contextIsolation` & `nodeIntegration` | `grep -n "contextIsolation\|nodeIntegration" main.js`           | `contextIsolation: true`, `nodeIntegration: false`.         |
| 47 | CSP intact                        | `grep -n "Content-Security-Policy" src/index.html`                   | `default-src 'self'; script-src 'self'; style-src 'self';`. |
| 48 | No `innerHTML` with data          | `grep -n "innerHTML" src/`                                           | Only `= ''` clears; no template strings or user data.       |
| 49 | No `eval`                         | `grep -n "eval(" main.js src/`                                       | No matches.                                                 |

## After packaging

| #   | Test            | Steps                                          |
|-----|-----------------|------------------------------------------------|
| 50  | Pack            | `npm run pack` succeeds.                       |
| 51  | Run packed      | Launch from `dist/` directory.                 |
| 52  | Basic flow      | Create → Run → Stop in packed version.         |
| 53  | No real clicks (packed) | Repeat tests #21, #44, #45 in the packaged build. |

## Steps 15-16 — final stabilization & handoff tests
| #   | Test                           | Steps                                                                   | Expected                                                |
|-----|--------------------------------|-------------------------------------------------------------------------|---------------------------------------------------------|
| 54  | Beta health card visible       | Advanced → Safety → scroll to "Beta health"                             | Rows for `simulationOnly`, `realClicksImplemented`, `ocrImplemented`, `imageRecognitionImplemented`, `docsReady`, `packagingConfigured`, `securityChecklistPresent`, `actionSchemaPresent`. |
| 55  | Beta health values             | inspect rows                                                            | `simulationOnly` = enabled; the three "Implemented" rows = no; the four presence rows = yes. |
| 56  | Feature flags card visible     | Advanced → Safety → scroll to "Feature flags"                           | Rows for simulationOnly, realDesktopActions, OCR, imageRecognition. realDesktopActions = disabled. |
| 57  | Next safety milestone visible  | Advanced → Future → scroll to "Next safety milestone"                   | Six rows; five `Planned`; "Real mode disabled" = `Ready`. |
| 58  | Diagnostics include flags      | Advanced → Safety → Copy diagnostics → paste                            | Output line `Feature flags: simulationOnly=true, realDesktopActions=false, ocr=false, imageRecognition=false`. |
| 59  | Diagnostics include beta health| same                                                                    | Output line `Beta health: docsReady=true, packagingConfigured=true, securityChecklistPresent=true, actionSchemaPresent=true`. |
| 60  | Corrupted scenarios.json       | Quit app → corrupt `userData/scenarios.json` (e.g. write `not json`) → relaunch | App boots; default scenario shown; warning log entry "Corrupted file detected, using defaults (scenarios.json)"; original file renamed to `.broken-<ts>` next to it. |
| 61  | Corrupted settings.json        | Quit → corrupt `userData/settings.json` → relaunch                      | App boots; default settings active; warning log entry; broken file renamed.   |
| 62  | Corrupted profiles.json        | Quit → corrupt `userData/profiles.json` → relaunch                      | App boots; default profiles; warning log entry; broken file renamed.          |
| 63  | Reset settings flow            | Settings → Advanced → Reset settings → confirm                          | Defaults restored, language and theme reset, success log. |
| 64  | Reset scenarios via IPC test   | Use main-process test (or remove `scenarios.json` manually) and relaunch | Default scenario only; no crash.                       |
| 65  | Import malformed JSON          | Advanced → Scenarios → Import → choose a `.txt` or invalid JSON         | Error log entry "Invalid file format" or "Import failed: invalid JSON"; UI does not crash; no stack trace shown. |
| 66  | Import valid → confirm         | Advanced → Scenarios → Import → valid JSON → confirm                    | Preview shown, then success log "Scenarios imported: N".  |
| 67  | Export failed (cancel dialog)  | Advanced → Scenarios → Export All → press Cancel in dialog              | Info log "Operation cancelled".                          |
| 68  | docs/FINAL_BETA_REVIEW exists  | `ls docs/`                                                              | Present.                                                  |
| 69  | docs/REAL_ACTIONS_GO_NO_GO     | `ls docs/`                                                              | Present.                                                  |
| 70  | docs/FEATURE_FLAGS             | `ls docs/`                                                              | Present.                                                  |
| 71  | docs/AUDIT_LOG_PLAN            | `ls docs/`                                                              | Present.                                                  |
| 72  | docs/PRIVACY                   | `ls docs/`                                                              | Present.                                                  |
| 73  | scripts/smoke-check.js exists  | `ls scripts/`                                                           | Present.                                                  |
| 74  | scripts/README.md exists       | `ls scripts/`                                                           | Present.                                                  |
| 75  | feature-flags safe defaults    | DevTools console: `getFeatureFlagsForDiagnostics()`                     | `safety.simulationOnly === true`; everything else in `safety` is `false`. |
| 76  | feature-flags frozen           | DevTools console: `getFeatureFlags().realDesktopActions = true; getFeatureFlags().realDesktopActions` | Stays `false` (Object.freeze + defensive copy). |
| 77  | No real clicks (final)         | Run any scenario for 60 s while watching cursor and a focused editor    | Cursor unchanged; editor receives no input.               |


## Step 17 — action pipeline / safety gates / audit events

| #   | Test                              | Steps                                                            | Expected                                                  |
|-----|-----------------------------------|------------------------------------------------------------------|-----------------------------------------------------------|
| 78  | Action pipeline card              | Advanced → Safety                                                | "Action pipeline" card visible. Rows: pipelineReady=yes, simulationOnly=enabled, realActionsEnabled=disabled, realActionsImplemented=no, realActionAllowed=no, missingRequirements=9. |
| 79  | Safety gates card                 | Advanced → Safety                                                | "Safety gates" card visible. Rows for safeMode, emergencyStop, minIntervalMs, maxRepeatCount, maxRunTimeMs. |
| 80  | Real actions readiness checklist  | Advanced → Safety                                                | 9 rows. Simulation-only build = `enabled`/ready. Real actions implemented = `no`/missing. Real actions feature flag = `disabled`/missing. desktop adapter = `not installed`. OS permissions = `not checked`. Final safety review = `not passed`. |
| 81  | Real actions disabled notice      | Advanced → Safety                                                | Localized warning: RU "Реальные действия рабочего стола пока отключены..." or EN "Real desktop actions are disabled. ClickFlow still runs in simulation mode only." |
| 82  | Audit events card                 | Advanced → Safety                                                | "Audit events" card visible. count > 0 after using the app; lastAuditEvent shows event type and timestamp. |
| 83  | Audit on start                    | Run any scenario; open DevTools console: `getAuditSummary()`     | `byType['scenario.start.requested']` and `byType['scenario.start.approved']` both > 0; `byType['action.simulated']` > 0. |
| 84  | Audit on stop                     | Press Stop during run                                            | `byType['scenario.stop.requested']` > 0. |
| 85  | Audit on emergency stop           | Press Escape during run                                          | `byType['emergency.stop']` > 0. |
| 86  | Audit on import / export          | Advanced → Scenarios → Export All; Advanced → Scenarios → Import valid JSON → confirm | `byType['export.completed']` > 0 and `byType['import.completed']` > 0. |
| 87  | Audit on settings change          | Settings → change theme → Save                                   | `byType['settings.changed']` > 0. |
| 88  | Real-action attempt blocked       | DevTools: `executeAction({type:'click',x:1,y:1,button:'left'}, {executionMode:'real'})` | Returns `{ ok: false, mode: 'real', blocked: true, error: 'Real desktop actions are disabled in this build' }`. `getAuditSummary().byType['action.real.blocked']` > 0. |
| 89  | Simulation still works            | Press Start                                                      | Progress fills, status indicator pulses, no real cursor movement, no input arrives in any other app. |
| 90  | Diagnostics shows pipeline        | Advanced → Safety → Copy diagnostics → paste                     | Output contains `Action pipeline: pipelineReady=true, simulationOnly=true, realActionsEnabled=false, realActionsImplemented=false, realActionAllowed=false, missingRequirements=9` and `Safety gates: ...` and `Audit events: count=N, lastType=...`. |
| 91  | smoke-check Step 17 invariants    | `npm run smoke`                                                  | New rows pass: action-pipeline declares simulationOnly/realActionsEnabled/realActionsImplemented; blocks real actions; safety-gates returns false; feature-flags realDesktopActions=false in source. |
| 92  | No real clicks (post Step 17)     | Run any scenario for 60s, attempt the DevTools real-mode trick   | Cursor unchanged; no input arrives anywhere; pipeline rejects with the explicit error. |
