# ClickFlow — Smoke Tests

Quick verification checklist before release or major changes.
Status: aligned with `0.1.0-beta` (Step 20 — Final beta QA and bugfix pass).

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


## Step 18 — desktop adapter interface, mock adapter, registry

| #    | Test                                  | Steps                                                                                                       | Expected                                                                                                          |
|------|---------------------------------------|-------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------|
| 0h   | smoke-check Step 18 files             | inspect output of `npm run smoke`                                                                            | `OK file exists: src/desktop-adapter-interface.js`, `mock-desktop-adapter.js`, `adapter-registry.js`, `docs/ADAPTER_INTERFACE.md`. |
| 0i   | smoke-check Step 18 invariants        | inspect output                                                                                              | `adapter-registry registers mock adapter`, `... real-desktop adapter as unavailable / planned`, `... activeId to mock by default`, `... blocks real adapter selection`, `... has Real desktop disabled reason`. Mock adapter source has `realActions: false`, `simulationOnly: true`, `runMockAdapterSelfTest`. Adapter interface has `realActionsAllowed: false` and `isRealAdapterAllowed` returns false. Audit allowlist contains all six adapter event types. |
| 93   | Desktop adapter status card           | Advanced → Safety                                                                                            | "Desktop adapter status" card visible. Active adapter = `Mock Desktop Adapter`. Mock adapter available = yes. Real adapter available = no. Real adapter registered = yes. Real actions allowed = no. Simulation only = enabled. |
| 94   | Last self-test placeholder            | First open                                                                                                  | Last self-test result = "Not run yet" / "Ещё не запускался".                                                       |
| 95   | Run adapter self-test from UI         | Click "Run adapter self-test"                                                                               | Log entries `Adapter self-test started`, then `Adapter self-test passed`. Card row updates to `Passed (4/4)`.     |
| 96   | Audit events for self-test            | DevTools console: `getAuditSummary()`                                                                       | `byType['adapter.selftest.started']` ≥ 1; `byType['adapter.selftest.completed']` ≥ 1; `byType['adapter.mock.executed']` ≥ 1 (from inside the self-test).                                |
| 97   | Real adapter activation blocked       | DevTools console: `setActiveAdapter('real-desktop')`                                                        | Returns `{ success: false, blocked: true, error: 'Real desktop actions are not implemented in this build' }`. `getAuditSummary().byType['adapter.selection.blocked']` ≥ 1; `byType['adapter.real.unavailable']` ≥ 1. Active adapter remains `mock`. |
| 98   | Mock adapter executes during run      | Press Start; wait a few iterations                                                                          | `getAuditSummary().byType['action.simulated']` and `byType['adapter.mock.executed']` both > 0. No real cursor movement, no real input. |
| 99   | Adapter line in diagnostics           | Advanced → Safety → Copy diagnostics → paste                                                                | Output contains `Adapter: active=mock, realRegistered=true, realAvailable=false, realActionsAllowed=false, simulationOnly=true`. |
| 100  | No real-input modules (final)         | `npm run smoke`                                                                                              | `OK no real-input native modules required in source` and `OK package.json declares no real-input modules`. Cursor unchanged for an entire scenario run. |


## Step 19 — real-action sandbox / dry-run

| #    | Test                                  | Steps                                                                                                       | Expected                                                                                                          |
|------|---------------------------------------|-------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------|
| 0j   | smoke-check Step 19 files             | inspect output of `npm run smoke`                                                                            | `OK file exists: src/real-action-sandbox.js` and `OK doc exists: docs/REAL_ACTION_SANDBOX.md`. |
| 0k   | smoke-check Step 19 invariants        | inspect output                                                                                              | `real-action-sandbox getSandboxStatus returns realActionsAllowed: false`, `dryRunAvailable: true`, `evaluateRealActionReadiness returns allowed: false`, `confirmDryRunPlan never sets realExecution: true`. Audit allowlist contains all six sandbox event types. README/PROJECT_CONTEXT mentions dry-run/sandbox. Pipeline block message mentions dry-run preview. |
| 101  | Real action sandbox card visible      | Advanced → Safety                                                                                            | "Real action sandbox" card visible. Real actions implemented = no. Real execution allowed = no. Dry-run preview available = yes. Warning: "Real desktop actions are disabled. Dry-run preview is available only." |
| 102  | Create dry-run preview                | Click "Create dry-run preview" with the default scenario active                                             | "Dry-run preview" card appears. Scenario name = `Быстрый кликер` (or current). Action count = scenario.repeatCount. Estimated duration = repeatCount × intervalMs. Real execution allowed = no. |
| 103  | Preview action list                   | Inspect the preview                                                                                         | At most 10 rows, each labelled `#N click x=… y=… left`. If actionCount > 10, the title shows "First actions shown".                                                              |
| 104  | Permission checklist visible          | Inspect the preview                                                                                         | 11 rows. `Real adapter installed` is `blocked`, `OS permissions verified` is `missing`, `Final safety review passed` is `missing`, `Real feature flag enabled` is `blocked`.     |
| 105  | Blocked reasons visible               | Inspect the preview                                                                                         | 7 rows including "realDesktopActions feature flag is disabled", "real adapter is not installed", "OS permissions are not verified", "final safety review has not passed", "audit log persistence is not implemented", "real actions are intentionally disabled in this build". |
| 106  | Confirm dry-run                       | Click "Confirm dry-run"                                                                                     | Log entries `Dry-run confirmed. No real actions executed.` and `Dry-run completed safely`. Card disappears. **No** real cursor movement, no input arrives in any other app.       |
| 107  | Cancel dry-run                        | Re-create preview, then click "Cancel"                                                                       | Log entry `Dry-run cancelled`. Card disappears.                                                                  |
| 108  | Audit events for sandbox              | DevTools console: `getAuditSummary()`                                                                       | `byType['real.sandbox.preview.created']` ≥ 1; `byType['real.sandbox.dryrun.confirmed']` ≥ 1 after step 106; `byType['real.sandbox.dryrun.cancelled']` ≥ 1 after step 107; `byType['real.permission.checklist.created']` and `byType['real.blocked.reason.generated']` ≥ 1. |
| 109  | DevTools real-mode through pipeline   | DevTools: `executeAction({type:'click',x:1,y:1,button:'left'},{executionMode:'real'})`                       | Returns `{ ok: false, mode: 'real', blocked: true, error: 'Real desktop actions are disabled. Dry-run preview is available only.' }`. `byType['action.real.blocked']` increments. |
| 110  | DevTools dry-run through pipeline     | DevTools: `executeAction({type:'click',x:1,y:1,button:'left'},{executionMode:'dry-run'})`                    | Returns `{ ok: true, mode: 'dry-run', simulated: false, realExecution: false, blocked: false, ... }`. No real input. `byType['real.sandbox.preview.created']` increments.        |
| 111  | Diagnostics shows sandbox             | Advanced → Safety → Copy diagnostics → paste                                                                | Output contains `Sandbox: dryRunAvailable=true, realActionsAllowed=false, realActionsImplemented=false, blockedReasons=7, checklistReady=…, lastDryRunAt=…, lastDryRunActionCount=…`. |
| 112  | Simulation still works                | Press Start                                                                                                  | Progress fills, status indicator pulses, no real cursor movement, no real input. Existing `byType['action.simulated']` and `byType['adapter.mock.executed']` continue to grow.    |
| 113  | No active scenario for dry-run        | Manually clear `state.selectedScenarioId` (DevTools), then click "Create dry-run preview"                    | Log entry "No active scenario for dry-run".                                                                       |
| 114  | No real-input modules (final)         | `npm run smoke`                                                                                              | `OK no real-input native modules required in source` and `OK package.json declares no real-input modules`.        |


## Step 20 — Final beta QA checklist

This is the **end-to-end** manual smoke-run that must be performed
before any GitHub pre-release tag is published. Do all of it on at
least one platform.

| #    | Test                                  | Expected                                                                                                          |
|------|---------------------------------------|-------------------------------------------------------------------------------------------------------------------|
| 115  | `npm install`                         | Completes without errors.                                                                                         |
| 116  | `npm run smoke`                       | All checks `OK`. **Failed: 0**.                                                                                    |
| 117  | `npm start`                           | App window opens.                                                                                                  |
| 118  | Open main screen                      | Status / Scenario / Progress cards render. "Simulation mode" badge present. Version badge populated.              |
| 119  | Create scenario                       | Scenarios → Create → fill form → Save. Scenario appears in list.                                                  |
| 120  | Run simulation                        | Select scenario → Start. Progress fills. **No real cursor movement, no input arrives in any other application.** |
| 121  | Stop simulation                       | Click Stop during run. State returns to Stopped.                                                                  |
| 122  | Emergency Stop                        | Start, then press `Escape`. Run aborts. Repeat with `CmdOrCtrl+Alt+E` while another window is focused.            |
| 123  | Switch language                       | Settings → English → Save. UI switches to English. Restart → preserved. Switch back to Russian.                    |
| 124  | Open advanced dashboard               | Click Advanced mode. All 7 tabs cycle without console errors.                                                     |
| 125  | Open diagnostics                      | Advanced → Safety. Diagnostics card visible. Beta health rows show `simulationOnly=true`. Action pipeline / Safety gates / Audit events / Adapter / Sandbox cards visible. |
| 126  | Run adapter self-test                 | Click "Run adapter self-test". Log: `Adapter self-test started` then `Adapter self-test passed`. Card row shows `Passed (4/4)`. |
| 127  | Create dry-run preview                | Click "Create dry-run preview". Inline preview card appears with scenario name, action count, estimated duration, capped action list, permission checklist (11 items), blocked reasons (7 items), Confirm / Cancel. |
| 128  | Confirm dry-run                       | Click Confirm. Log: `Dry-run confirmed. No real actions executed.` followed by `Dry-run completed safely`. **No real actions performed.** |
| 129  | Verify no real click happens          | While running any scenario for 60 s and after the dry-run confirm, watch the cursor and a focused text editor: cursor unchanged, editor receives no input. |
| 130  | Import / export scenarios             | Advanced → Scenarios → Export All. Save JSON. Then Import → choose the same file → Confirm. Counts match. Try importing a non-JSON file → friendly error. |
| 131  | Reset settings                        | Advanced → Settings → Reset settings → Confirm. Defaults restored. Language and theme reset accordingly.          |
| 132  | Corrupted JSON fallback               | Quit. Manually corrupt `userData/scenarios.json` (write `{not json`). Relaunch. App boots; default scenario shown; warning log; broken file renamed to `<file>.broken-<timestamp>` next to the original location. Repeat for `settings.json` and `profiles.json`. |
| 133  | Check real actions disabled           | DevTools console: `executeAction({type:'click',x:1,y:1,button:'left'},{executionMode:'real'})` returns `{ ok: false, mode: 'real', blocked: true, error: 'Real desktop actions are disabled. Dry-run preview is available only.' }`. `setActiveAdapter('real-desktop')` returns `{ success: false, blocked: true, ... }`. |
| 134  | Diagnostics line                      | Copy diagnostics → paste. Output contains `Sandbox: dryRunAvailable=true, realActionsAllowed=false, realActionsImplemented=false`. |
