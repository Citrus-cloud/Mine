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


## Step 22 — Release smoke sequence

This is the **manual** smoke run that immediately precedes
publishing the `v0.1.0-beta` GitHub pre-release. It is the bridge
between [`docs/RELEASE_FINAL_CHECK.md`](./RELEASE_FINAL_CHECK.md)
and [`docs/TAG_AND_RELEASE_GUIDE.md`](./TAG_AND_RELEASE_GUIDE.md).
Walk every step on the build host that will produce the artifacts.

| #    | Step                                  | Expected                                                                                                          |
|------|---------------------------------------|-------------------------------------------------------------------------------------------------------------------|
| 135  | `git status` is clean                 | `nothing to commit, working tree clean`. No untracked files.                                                       |
| 136  | `npm install`                         | Completes without errors.                                                                                          |
| 137  | `npm run smoke`                       | All checks `OK`. **Failed: 0**. The smoke check at step 22 is 130+ checks.                                          |
| 138  | `npm start`                           | App window opens with no console errors.                                                                            |
| 139  | Manual main flow                      | Walk #117–#129 from the Step 20 section. **No real cursor movement, no input arrives anywhere else.**              |
| 140  | Manual advanced flow                  | Cycle all 7 tabs in Advanced. Each renders without console errors.                                                 |
| 141  | Adapter self-test                     | Advanced → Safety → "Run adapter self-test". Log: `Adapter self-test passed (4/4)`.                                |
| 142  | Dry-run preview                       | Advanced → Safety → "Create dry-run preview" → "Confirm dry-run". Logs `Dry-run confirmed. No real actions executed.` then `Dry-run completed safely`. **No real actions.** |
| 143  | No real click verification            | While running any scenario for 60 s, watch the cursor and a focused text editor: cursor unchanged, editor receives no input. |
| 144  | Diagnostics line                      | Advanced → Safety → Copy diagnostics → paste. Output contains `Simulation only: true`, `Sandbox: realActionsAllowed=false`, `Adapter: active=mock, ...realActionsAllowed=false`, `Release: ..., releaseDocsReady=true`. |
| 145  | `npm run pack`                        | Completes on the build host. `dist/<platform>-unpacked/` appears. (Skip if the host cannot build for any target.) |
| 146  | `npm run dist`                        | Completes on the build host. Final installers / images appear under `dist/`.                                       |
| 147  | Inspect `dist/`                       | No `node_modules/.cache`, no `*.broken-*` files, no nested `dist/`. Only the expected installer / image files.    |
| 148  | Smoke-launch the artifact             | Launch the produced binary on the target OS. Repeat #138 / #139 / #143 / #144 against the launched binary.         |
| 149  | Rename per `BUILD_ARTIFACTS.md`       | Rename produced files to `ClickFlow-0.1.0-beta-<platform>-<arch>.<ext>` before upload.                              |
| 150  | (Manual) Walk `RELEASE_FINAL_CHECK.md`| Sign off the maintainer line at the bottom of the file before any tag is created.                                  |



## Step 25 — Screen Capture Foundation smoke checks

These manual checks verify the new **Screen Capture** tab in the
Advanced dashboard. They never expect a real click, OCR, or image
recognition — Step 25 only adds the foundation.

| #    | Step                                  | Expected                                                                                                          |
|------|---------------------------------------|-------------------------------------------------------------------------------------------------------------------|
| 151  | `npm install`                         | Completes without errors. No new native modules, no new dependencies (the foundation is pure Electron API).        |
| 152  | `npm run smoke`                       | All checks `OK`. **Failed: 0**. The smoke check is now extended with Step 25 invariants (screen-capture-client / screen-capture-ui / SCREEN_CAPTURE.md / preload screenCapture API / main.js IPC handlers / no OCR / no OpenCV / no robotjs / no nut.js). |
| 153  | `npm start`                           | App window opens with no console errors.                                                                            |
| 154  | Open Advanced → Screen Capture        | Click Advanced mode → switch to the **Screen Capture** tab. Header `Screen Capture` is visible. Safety notice card with the simulation-only / no-real-clicks / not-saved-without-action wording is visible. Three buttons: **Refresh sources**, **Capture preview** (disabled until a source is selected), **Clear preview**. |
| 155  | Refresh sources                       | Click **Refresh sources**. The sources grid populates with the available `screen` and `window` thumbnails. Each card shows a thumbnail, the source name (via `textContent`), a `screen` / `window` type badge, and a **Select** button. Empty state, error state, and permission notice render correctly when applicable (e.g. macOS Screen Recording prompt). |
| 156  | Select a source                       | Click **Select** on one card. The card gains the `.selected` highlight. The **Selected source** card shows the name, type, and id. The **Capture preview** button becomes enabled. |
| 157  | Capture preview                       | Click **Capture preview**. The **Screen preview** card displays the captured thumbnail (preview only, ~1280×720), source name, type, id, size, captured-at timestamp, and the literal "Preview only · Not saved to disk" reminder. **No real cursor movement, no input arrives in any other application.** |
| 158  | Clear preview                         | Click **Clear preview**. The Screen preview card returns to the empty state. The renderer-only memory cache is also dropped. |
| 159  | Diagnostics block                     | Switch to Advanced → Safety. The **Screen capture status** card shows `available`, `sourcesCount`, `selectedSource`, `previewAvailable`, `capturedAt`, `lastError`. |
| 160  | Copy diagnostics                      | Advanced → Safety → **Copy diagnostics** → paste. Output contains a `Screen capture: available=…, supported=…, sourcesCount=…, selectedSource=…, previewAvailable=…, lastCapturedAt=…, lastError=…, ocrImplemented=false, imageRecognitionImplemented=false, savesScreenshotsToDisk=false` line. |
| 161  | No disk persistence                   | After capturing a preview, inspect `userData/`. There is **no** new screenshot file. Restart the app — the preview is empty (it was never persisted). |
| 162  | No real clicks                        | While the Screen Capture tab is open and a preview is shown, watch the cursor and a focused text editor for 60 s. The cursor does not move; the editor receives no input. |
| 163  | Permissions denied path               | (macOS only) Without the Screen Recording grant, `Refresh sources` shows an empty list and a notice that OS permissions may be required. The app does not crash. |
| 164  | Headless / CI path                    | If `desktopCapturer` is unavailable, the IPC returns `{ success: false, error: "Screen capture is not available on this system" }`. The diagnostics block shows `available=false`. The app does not crash. |
| 165  | Switch language                       | Settings → English → Save. Walk #154–#159 again. All Screen Capture strings appear in English. Switch back to Russian. |
| 166  | Hard guarantees                       | DevTools console: `getState().screenCapture.preview` is `null` after Clear preview; `getState().screenCapture.sources` is an array; `validateScreenSource({id:"unknown", name:"x"})` returns `false`. `setActiveAdapter('real-desktop')` still returns `{ success: false, blocked: true, ... }` — Step 25 did not flip any safety flag. |



## Step 26 — Region Selector Foundation smoke checks

These manual checks verify the new **Region Selector** card and
overlay in the **Screen Capture** tab. They never expect a real
click, OCR, or image recognition — Step 26 only adds the rectangle
foundation.

| #    | Step                                  | Expected                                                                                                          |
|------|---------------------------------------|-------------------------------------------------------------------------------------------------------------------|
| 167  | `npm install`                         | Completes without errors. No new native modules.                                                                   |
| 168  | `npm run smoke`                       | All checks `OK`. **Failed: 0**. Smoke-check is now extended with Step 26 invariants (region-selector / region-selector-ui / REGION_SELECTOR.md / scenario-manager region helpers / audit allowlist / no OCR / no OpenCV). |
| 169  | `npm start`                           | App window opens with no console errors.                                                                            |
| 170  | Open Advanced → Screen Capture        | Click Advanced → switch to **Screen Capture**. Header / safety notice / Refresh / Capture / Clear buttons render as in Step 25. |
| 171  | No preview yet                        | Region Selector card shows *"Capture a screenshot preview first."*. Enable / Clear / Save / Attach buttons are inert (or hidden). |
| 172  | Capture preview                       | Refresh sources → Select a source → Capture preview. The preview image appears wrapped in `.screen-preview-wrapper`; the Region Selector card is now populated. |
| 173  | Enable region selection               | Click **Enable region selection**. The overlay above the preview gets a dashed accent outline; the cursor turns into a crosshair. |
| 174  | Draw a region                         | Press the left mouse button on the preview, drag, release. A solid-bordered translucent rectangle appears. The coordinate badge below it shows `x,y · w×h`. |
| 175  | Selected region rows                  | Region Selector card shows preview-space x / y / width / height and image-space x / y / width / height. Both rectangles are populated. Area is `width × height` of the preview rectangle. |
| 176  | Tiny gesture rejected                 | With selection enabled, click and immediately release without moving (or with a < 6 px move). The rectangle does NOT stick; a "Selection too small" warning appears in the log. |
| 177  | Clear region                          | Click **Clear region**. The rectangle disappears; both selectedRegion and normalizedRegion rows show "No region selected". |
| 178  | Save region                           | Re-draw a rectangle. Click **Save region**. A success log entry is emitted; the image-space rectangle stays in sync after a window resize. |
| 179  | Attach to active scenario             | Verify Settings → choose a scenario as active in the main view. Re-draw + Save. Click **Attach to active scenario**. A success log appears: *"Region attached to scenario"*. The card's `attachedToScenario` row updates. |
| 180  | Scenario JSON shape                   | DevTools console: `getScenarioById(state.selectedScenarioId).settings.region` returns `{ x, y, width, height }`. Other settings (`x`, `y`, `intervalMs`, `repeatCount`, `button`) are unchanged. `meta.updatedAt` is fresh. |
| 181  | Backward compatibility                | Pick a different scenario without a region. Region row shows "no". Start it. Simulation runs as before — the region field is ignored by the engine. |
| 182  | Disable selection                     | Click **Disable region selection**. The dashed outline disappears; clicking the preview no longer starts a drag. The existing rectangle remains visible. |
| 183  | Diagnostics block                     | Switch to Advanced → Safety. The **Region selector status** card shows `selectedRegion`, `normalizedRegion`, `previewCoordinates`, `imageCoordinates`, `regionArea`, `attachedToScenario`, `lastUpdatedAt`, `lastError`. |
| 184  | Copy diagnostics                      | Advanced → Safety → **Copy diagnostics** → paste. Output contains a `Region selector: selectedRegion=…, normalizedRegion=…, regionWidth=…, regionHeight=…, regionArea=…, attachedScenario=…, lastUpdatedAt=…, lastError=…, ocrImplemented=false, imageMatchingImplemented=false, realClicksImplemented=false` line. |
| 185  | Clear preview drops region            | Click **Clear preview** in the Screen Capture controls. Both the preview AND the region selector are dropped. The scenario's stored `settings.region`, however, is **preserved** (the on-disk attached region survives). |
| 186  | No real clicks                        | While the Screen Capture tab is open, draw / save / attach / clear a region. Watch the cursor and a focused text editor for 30 s. Cursor unchanged; editor receives no input. |
| 187  | Switch language                       | Settings → English → Save. Walk #170–#185. All Region Selector strings appear in English. Switch back to Russian. |
| 188  | Hard guarantees                       | DevTools console: `getState().regionSelector.selectedRegion` reflects the live rectangle; `validateRegionSettings({x:-1,y:0,width:10,height:10})` returns `{valid:false, error:…}`. `setActiveAdapter('real-desktop')` still returns `{ success: false, blocked: true, ... }` — Step 26 did not flip any safety flag. |



## Step 27 — Template Asset Manager smoke checks

These manual checks verify the new **Templates** tab in the
Advanced dashboard. They never expect image matching, OCR, or a
real click — Step 27 only adds the storage layer.

| #    | Step                                  | Expected                                                                                                          |
|------|---------------------------------------|-------------------------------------------------------------------------------------------------------------------|
| 200  | Open Templates tab                    | Advanced → Templates. Header "Image Templates / Шаблоны изображений", safety notice, three buttons (Import / Reset / Refresh), Active template card with empty state, Templates list card with "No templates yet." |
| 201  | Verify safety notice                  | Notice text contains "Templates are stored as image assets only" / "Шаблоны пока используются только как сохранённые изображения". No "real click" / "OCR" / "image matching" verbs anywhere on the page. |
| 202  | Import a PNG template                 | Click **Import template**. Pick a PNG. Card appears in the grid: preview, the file's basename as default name, original filename, image size in pixels (e.g. 128 × 64), file size, createdAt timestamp. Active template is auto-selected. Log: `Template imported: <name>`. |
| 203  | Import a JPG template                 | Repeat with a JPG. New card appears below the first. previewDataUrl renders. mimeType is `image/jpeg`. |
| 204  | Import a WebP template                | Repeat with a WebP. previewDataUrl renders. mimeType is `image/webp`. |
| 205  | Reject a non-image                    | Try to pick a `.txt` (rename it to `.png` first). The dialog filter limits visible files to png/jpg/jpeg/webp; even if the renamed file passes the filter the import fails with "File is not a supported image" and no card is added. |
| 206  | Reject an oversized image             | Try to pick a > 16 MiB image. Import fails with "Image is too large". No partial copy in `userData/templates/images/`. |
| 207  | Cancel the import                     | Click **Import template**, then Cancel in the dialog. Log: `Template import cancelled`. No card added, no error toast. |
| 208  | Select a different template           | Click **Select** on a non-active card. Selected badge moves; Active template card on the right updates. Log: `Template selected`. |
| 209  | Edit metadata                         | Click **Edit** on any card. Inline form replaces the card. Change name to "Submit button" and description. Click **Save**. Form collapses, name and description update. Log: `Template metadata saved`. |
| 210  | Validate empty name                   | Edit any card. Clear the name field. Click **Save**. Inline error: "Template name is required" / "Название шаблона обязательно". No IPC call made. |
| 211  | Validate too-long name                | Edit any card. Paste 81+ chars into the name field. Click **Save**. Inline error: "Template name is too long". |
| 212  | Validate too-long description         | Edit any card. Paste 301+ chars into the description. Click **Save**. Inline error: "Template description is too long". |
| 213  | Cancel an edit                        | Edit any card, change values, click **Cancel**. Form collapses. Card values remain unchanged. |
| 214  | Delete a template                     | Click **Delete** on any card. Confirm in the OS dialog. Card disappears. Image file under `userData/templates/images/` is also removed. Log: `Template deleted`. If the deleted template was active, no template is active any more. |
| 215  | Reset templates                       | Click **Reset templates** → Confirm. All cards disappear. Empty state returns. `userData/templates/templates.json` is removed. `userData/templates/images/template-*.{png,jpg,webp}` files are removed. Other folders are left alone. |
| 216  | Diagnostics card                      | Advanced → Safety. **Image templates** card visible: `Templates count`, `activeTemplateId`, `Active template`, `Templates storage ready`, `lastError`, `Screen matching not implemented = disabled`, `Template matching planned = planned`. |
| 217  | Copy diagnostics line                 | Advanced → Safety → Copy diagnostics → paste. Output contains `Templates: count=…, storageCount=…, storageReady=true, activeTemplateId=…, activeTemplateName=…, lastError=none, screenMatchingImplemented=false, ocrImplemented=false, realClicksImplemented=false`. |
| 218  | Restart preserves metadata            | Quit. Relaunch. Open Templates tab. Cards re-appear with previews (read from disk on `templates:load`). Active template id survives if the file still exists. |
| 219  | Corrupted templates.json fallback     | Quit. Manually corrupt `userData/templates/templates.json` (write `{not json`). Relaunch. App boots; Templates tab shows the empty state; broken file renamed to `templates.json.broken-<timestamp>`. |
| 220  | No real click happens                 | While the active scenario is running for 60 s and during a fresh import, watch the cursor and a focused text editor. Cursor unchanged, editor receives no input. **Templates do not trigger any real click in Step 27.** |
| 221  | No OCR / image matching               | Confirm there is no "Find on screen" / "Match" / "Search" button anywhere on the Templates tab. The diagnostics line still says `screenMatchingImplemented=false, ocrImplemented=false`. |



## Step 28 — Template Matching Mock / Dry-run smoke checks

These manual checks verify the new **Template Matching** tab in
the Advanced dashboard. They never expect real image matching,
real OCR, or a real click — Step 28 only adds the mock pipeline.

| #    | Step                                  | Expected                                                                                                          |
|------|---------------------------------------|-------------------------------------------------------------------------------------------------------------------|
| 222  | Open Template Matching tab            | Advanced → Template Matching. Mock notice "This is a mock/dry-run…", requirements checklist with five rows (preview, active template, region, real matching disabled, real click disabled), input summary, two buttons (Run mock match / Clear result), empty visual overlay placeholder, empty result card, empty action preview card. |
| 223  | Run mock match without preview        | With no preview captured yet, click **Run mock match**. Button is disabled. Requirements checklist row "Screen preview available" shows the red marker and the hint "Capture a screenshot preview first." |
| 224  | Capture a preview                     | Switch to Screen Capture, refresh sources, select one, click **Capture preview**. Switch back to Template Matching. Preview row in the input summary shows the source name + size; "Screen preview available" row turns green. |
| 225  | Run without an active template        | If no template is selected, the **Run mock match** button stays disabled and the "Active template selected" row shows the red marker with the hint "No template selected". |
| 226  | Pick an active template               | Switch to Templates, import or select a template. Switch back to Template Matching. Input summary updates; "Active template selected" turns green. **Run mock match** button is now enabled. |
| 227  | (Optional) Draw a region              | Switch to Screen Capture, **Enable region selection**, draw a rectangle, **Save region**. Switch back to Template Matching. "Region (optional)" turns green and the input summary shows `x, y · w × h` of the normalized region. |
| 228  | Run a mock match (no region)          | Click **Run mock match** without a region. Result card shows `matched=yes`, `Confidence ≈ 87.0%`, bounding box centred on the preview (≈ half preview width × half preview height), target point at the center of the bbox. Visual overlay shows a red rectangle + central dot on top of the preview. Action preview card shows the JSON of the `image_click` shape with `mode: "preview"` and `realClick: false`. Log: `Mock match completed`. |
| 229  | Re-run yields a stable confidence     | Click **Run mock match** again with the same input. Confidence is identical (deterministic by input). Bounding box geometry is identical. |
| 230  | Run a mock match with a region        | With a saved region, click **Run mock match**. Visual overlay shows BOTH the dashed region rectangle AND the solid match rectangle, with the match centred inside the region. Result card "Used region" shows the same `x, y · w × h` as the input summary. |
| 231  | Action preview JSON                   | Result card → Action preview shows the planned `image_click` JSON via `<pre>.textContent`. The block contains literal substrings `"type": "image_click"`, `"mode": "preview"`, `"realClick": false`, `"realMatching": false`. **No real click happens.** |
| 232  | Clear result                          | Click **Clear result**. Result card returns to the empty state, action preview returns to the empty state, the visual overlay drops the rectangle and target point but keeps the preview. Log: `Mock result cleared`. |
| 233  | Clear preview also drops the result   | Switch to Screen Capture, **Clear preview**. Switch back to Template Matching. The visual overlay returns to the empty state ("Capture a screenshot preview first."). The result card and action preview are cleared. |
| 234  | Diagnostics block                     | Advanced → Safety. The **Template matching (mock)** card shows `Last run at`, `Last result`, `Confidence`, `Target point`, `activeTemplateId`, `Preview available`, `regionAvailable`, `Real matching disabled = on`, `Real click disabled = on`, `Real image recognition is not implemented = disabled`, `image_click scenario action is planned = planned`. |
| 235  | Copy diagnostics                      | Advanced → Safety → **Copy diagnostics** → paste. Output contains a `Template matching mock: lastRunAt=…, lastResult=…, lastConfidence=…, lastTargetPoint=…, activeTemplateId=…, screenPreviewAvailable=…, regionAvailable=…, lastError=…, realMatching=false, realClick=false, matcherImplemented=false, imageClickScenarioImplemented=false` line. |
| 236  | No real clicks                        | While the Template Matching tab is open, run / clear / re-run for 30 s. Watch the cursor and a focused text editor. Cursor unchanged, editor receives no input. **The action preview is never executed.** |
| 237  | No OCR / no OpenCV                    | DevTools console: `package.json` declares zero of `tesseract`, `tesseract.js`, `opencv4nodejs`, `@u4/opencv4nodejs`, `sharp`, `jimp`, `pixelmatch`, `looks-same`, `robotjs`, `nut-js`, `iohook`, `uiohook-napi`. `runMockTemplateMatch({})` returns `{ success: false, mode: 'mock', error: 'screenPreview is missing', realMatching: false, realClick: false }`. |
| 238  | Switch language                       | Settings → English → Save. Walk #222–#234. All Template Matching strings appear in English. Switch back to Russian. |
| 239  | Hard guarantees                       | DevTools console: `getState().templateMatching.lastResult.realMatching === false`, `.realClick === false`. `getTemplateMatchingMockStatus().matcherImplemented === false`. `setActiveAdapter('real-desktop')` still returns `{ success: false, blocked: true, ... }` — Step 28 did not flip any safety flag. |



## Step 29 — Real Template Matching Engine smoke checks

These manual checks verify the new **Real preview** mode in the
Template Matching tab. They never expect a real click, real
cursor movement, OCR, or OpenCV — Step 29 only adds the
renderer-side matching engine.

| #    | Step                                  | Expected                                                                                                          |
|------|---------------------------------------|-------------------------------------------------------------------------------------------------------------------|
| 240  | Mode picker visible                   | Advanced → Template Matching. The new **Match mode** card carries a `<select>` with two options (Mock / Real preview), a Threshold number input (default `0.75`), and a Step `<select>` with `1 / 2 / 4 / 8 / 16` (default `4`). |
| 241  | Default mode is Mock                  | First open after install: mode is `Mock`. The Run button label reads `Run mock match`. |
| 242  | Switch to Real preview                | Pick `Real preview` in the mode select. The Run button label switches to `Run real preview match`. A safety notice appears: "Real preview matching analyzes the preview image only. It does not click or control the device." |
| 243  | Real-preview disabled without preview | With no captured preview, the Run button stays disabled and the requirements checklist shows the red marker for `Screen preview is missing`. |
| 244  | Real-preview disabled without template| With a captured preview but no active template, the Run button stays disabled and the checklist shows `Template image is missing` (real-preview also needs the template's previewDataUrl). |
| 245  | Run a real preview match              | Capture a preview (Screen Capture → Refresh → Select → Capture preview). Import / Select a template. Switch to Template Matching → Real preview → click **Run real preview match**. Result card appears with a green `Match found` headline (or amber `Low confidence — showing best candidate`), a `real preview` badge, the engine confidence (e.g. 92.4%), the threshold (75%), the bounding box, the target point, the duration in ms, the effective step, and the captured-at timestamp. |
| 246  | Visual overlay shows green bbox       | When `confidence >= threshold`, the overlay rectangle on top of the preview is solid green. The confidence badge inside the box reads `<percent> · real preview`. The target-point dot sits at the center of the rectangle. |
| 247  | Low-confidence run                    | Lower the threshold to e.g. `0.95` and re-run with a template that does not exist on screen. The result card shows the amber `Low confidence — showing best candidate` headline; the overlay rectangle is dashed. The audit log records `template.match.lowConfidence`. |
| 248  | Region scoping                        | Screen Capture → Enable region selection → drag → Save. Re-run real preview match. Result card "Used region" matches the saved region; the bbox stays inside the region; the audit `template.match.realPreview.completed` payload carries `usedRegion: true`. |
| 249  | Threshold control                     | Change the threshold input from `0.75` → `0.5` → `0.9`. Each change re-renders the requirements checklist and the diagnostics card without running the matcher. The next run uses the new threshold. |
| 250  | Step control                          | Change the Step select from `4` → `1`. The next run is slower (more grid positions). The result card shows the actual step. With a tiny step on a huge preview the engine may auto-raise to keep the cost bounded; in that case the result shows `Step: 4 (requested 1)` and the audit log gets `template.match.engine.warning` with reason `step-raised-by-engine`. |
| 251  | Engine cost guard                     | With Step=1 and a 1920×1080 preview + 256×256 template, the engine reports `search-area-cost-high` in the audit log and (if it exceeds the hard cap) a `step-raised-by-engine` warning. The match still completes and never freezes the renderer for more than ~1 s. |
| 252  | Action preview JSON                   | Result card → Action preview shows the `image_click` JSON via `<pre>.textContent`. Required substrings: `"type": "image_click"`, `"mode": "preview"`, `"realClick": false`, `"realMatching": false`. **No real click happens.** |
| 253  | Clear result                          | Click **Clear result**. Result card returns to the empty state, action preview clears, the bbox / target point disappear. |
| 254  | Diagnostics card                      | Advanced → Safety. The **Template matching (mock)** card shows `Match mode = Real preview matching`, `Threshold = 75%`, `Step = 4`, `Confidence = …%`, `Duration = … ms`, `Engine available = yes`, `Real matching disabled = on`, `Real click disabled = on`, `image_click scenario action is planned = planned`. |
| 255  | Copy diagnostics                      | Advanced → Safety → Copy diagnostics → paste. The output contains a `Template matching: lastRunAt=…, lastResult=…, lastMode=real-preview, lastConfidence=…, lastDurationMs=…, …, mode=real-preview, threshold=…, step=…, engineAvailable=true, …, realMatching=false, realClick=false, ocrImplemented=false, opencvAvailable=false, matcherImplemented=true, imageClickScenarioImplemented=false` line. |
| 256  | No real click verification            | Run / clear / re-run for 60 s with focus in any other application. Watch the cursor and a focused text editor. Cursor unchanged, editor receives no input. **The engine never executes the action preview.** |
| 257  | No OCR / OpenCV                       | DevTools console: `package.json` still declares zero of `tesseract`, `tesseract.js`, `opencv4nodejs`, `@u4/opencv4nodejs`, `opencv.js`, `opencv-js`, `sharp`, `jimp`, `pixelmatch`, `looks-same`, `robotjs`, `nut-js`, `iohook`, `uiohook-napi`. `getTemplateMatchEngineStatus().opencvAvailable === false`, `.ocrImplemented === false`. |
| 258  | Switch language                       | Settings → English → Save. Walk #240–#254. All Real preview strings appear in English. Switch back to Russian. |
| 259  | Hard guarantees                       | DevTools console: `getState().templateMatching.lastResult.realMatching === false`, `.realClick === false`. `setActiveAdapter('real-desktop')` still returns `{ success: false, blocked: true, ... }` — Step 29 did not flip any safety flag. |



## Step 30 — Image Click Scenario Type smoke checks

These manual checks verify the new `image_click` scenario type
end-to-end. They never expect a real click, real cursor
movement, OCR, or OpenCV — Step 30 only orchestrates the
existing simulation primitives.

| #    | Step                                  | Expected                                                                                                          |
|------|---------------------------------------|-------------------------------------------------------------------------------------------------------------------|
| 260  | Open the scenario form                | Scenarios → New scenario. The form has a new **Scenario type** select with two options: **Coordinate click** (default) and **Image click**. The default selection keeps the old simple_click fields visible. |
| 261  | Switch to image_click                 | Pick **Image click** in the type selector. The X / Y / Mouse button rows are hidden; the image_click section appears with: template select, region summary + Use selected region / Clear region buttons, threshold input (default `0.75`), step select (`1 / 2 / 4 / 8`, default `4`), timeout (default `10000`), interval (default `1000`), repeat (default `1`). |
| 262  | No templates yet → warning            | Without any imported templates, the image_click section shows the warning **"No templates yet. Import a template first."** and the template select is disabled. |
| 263  | Import a template                     | Templates → Import template → pick a PNG/JPG/WebP. Switch back to the scenario form → Image click. The warning disappears, the template select lists the imported template, and Save is enabled. |
| 264  | Save without templateId               | Manually clear the template select (DevTools) and click Save. The form refuses with **"Шаблон обязателен"** / **"Template is required"**. No scenario is created. |
| 265  | Save valid image_click                | Pick a template, leave defaults, give the scenario a name, and Save. Scenarios list shows the new scenario with an **image_click** badge and a settings line `image_click <id> · 75% · step 4 · ·full · 1000ms · 1×`. |
| 266  | Use selected region                   | Screen Capture → Refresh → Select → Capture preview → Enable region selection → drag → Save region. Scenario form → Edit the image_click scenario → click **Use selected region**. The summary line updates to `x, y · w × h` of the saved region. Save. The scenario list line switches to `…·region` instead of `·full`. |
| 267  | Run image_click — match found         | Make sure the preview is captured AND the active template is one that exists in the preview. Select the image_click scenario as active → Start. Logs show: `Сценарий запущен`, `1/1: image_click симулирован x=… y=… confidence=…%`, `Сценарий завершён`. The progress bar reaches 100%. **The cursor never moves.** |
| 268  | Run image_click — no match            | Lower threshold to e.g. 0.95 with a template that does not exist on screen. Save. Run. Log: `1/1: Шаблон не найден template=… confidence=…%`. Progress reaches 100%. The audit timeline shows `scenario.imageClick.noMatch`. **No real click.** |
| 269  | Run image_click — missing preview     | Clear the screen-capture preview (Screen Capture → Clear preview). Run an image_click scenario. The scenario fails fast with **"Сначала получите screenshot preview."** / **"Capture a screen preview first."**. Audit shows `scenario.imageClick.failed` with `reason: missing-preview`. |
| 270  | Run image_click — missing template    | Edit the scenario via DevTools to point at a non-existent template id, save, run. The scenario fails with **"Шаблон не найден. Импортируйте шаблон."** and `scenario.imageClick.failed` `reason: missing-template`. |
| 271  | Stop image_click                      | Run a scenario with `repeatCount > 5`. Click Stop. The current iteration finishes its match call and the engine stops. Logs show `Сценарий остановлен`. Audit shows `scenario.imageClick.stopped`. |
| 272  | simple_click still works              | Open a simple_click scenario, edit it, save, run. The form fields are unchanged; runtime behaviour is unchanged. The scenario card shows the old `x:… y:… · …ms · …× · left` line, no image_click badge. |
| 273  | Diagnostics card                      | Advanced → Safety. The new **image_click scenario** card shows: `image_click scenarios count`, `Last image_click`, `Confidence`, `image_click target`, `image_click is simulation-only = on`, `Real image_click is disabled = on`. |
| 274  | Copy diagnostics                      | Advanced → Safety → Copy diagnostics → paste. The output contains a `Image click scenario: imageClickScenariosCount=…, lastImageClickStatus=…, lastImageClickConfidence=…, lastImageClickTargetPoint=…, imageClickSimulationOnly=true, realImageClickEnabled=false, ocrImplemented=false` line. |
| 275  | No real click verification            | While running an image_click scenario for 30 s, watch the cursor and a focused text editor. Cursor unchanged, editor receives no input. **The simulated action is never executed by the OS.** |
| 276  | No OCR / OpenCV                       | DevTools console: `package.json` still declares zero of `tesseract`, `tesseract.js`, `opencv4nodejs`, `@u4/opencv4nodejs`, `opencv.js`, `opencv-js`, `sharp`, `jimp`, `pixelmatch`, `looks-same`, `robotjs`, `nut-js`, `iohook`, `uiohook-napi`. |
| 277  | Hard guarantees                       | DevTools console: `getState().execution.lastAction.realClick === false`. `executeAction({ type: 'image_click', templateId: 't', targetPoint: { x: 1, y: 1 }, realClick: true }, { executionMode: 'real' })` returns `{ ok: false, blocked: true }`. `setActiveAdapter('real-desktop')` still returns `{ success: false, blocked: true, ... }` — Step 30 did not flip any safety flag. |



## Step 31 — Image Click Scenario UX Polish + Visual Test Tools

These manual checks verify the new Test Match flow inside the
`image_click` scenario form. **Test Match never clicks**, never
executes the scenario, never persists the screenshot or the
debug result on disk.

| #    | Step                                            | Expected                                                                                                          |
|------|-------------------------------------------------|-------------------------------------------------------------------------------------------------------------------|
| 278  | Open scenario form (Create) → image_click       | Scenarios → New scenario → switch type to **Image click**. Beneath the threshold / step / timeout block a new **Image click test tools** panel is rendered with a header, a Test Match subtitle, three quick navigation buttons (Open Templates / Open Screen Capture / Open Region Selector), three cards (Template preview / Screen preview status / Region summary), a **Run Test Match** primary button, and a **Clear result** button. |
| 279  | Quick navigation buttons                        | Click **Open Templates** → Advanced view, Templates tab. Click **Open Screen Capture** → Advanced view, Screen Capture tab. Click **Open Region Selector** → Advanced view, Screen Capture tab (the region selector lives there). The scenario form is preserved when navigating back. |
| 280  | Empty state — no template, no preview           | Without an active template, the **Template preview** card shows "No template selected." (RU/EN). Without a captured preview, the **Screen preview status** card shows "Capture a screen preview first." Run Test Match → result panel renders with **Test Match failed** headline and stable error IDs `noTemplateSelected` and `captureScreenPreviewFirst`. **No click.** |
| 281  | Template preview card                           | After importing a template and selecting it, the Template preview card renders an `<img>` (max-height 120 px), the template name, the image dimensions in pixels, and the file size. Switching the template select updates the card immediately. |
| 282  | Screen preview status card                      | After capturing the screen preview, the Screen preview status card shows source name, image size in pixels, capturedAt timestamp, and a "Preview only = enabled" reminder row. Switching the captured source updates the card. |
| 283  | Region summary — none / Use selected            | Without a selected region, the Region summary card shows `Used region — none`. After Region Selector → Save region → click **Use selected region** in the form, the form's region row shows `x, y · w × h` and the Region summary card renders the same values. **Clear region** resets it to `none`. |
| 284  | Run Test Match — match found                    | With a captured preview, an active template, and a reasonable threshold (`0.75`), press **Run Test Match**. Result panel: **Template matched** headline (green), Confidence (e.g. `82.4%`), Threshold (`75%`), Bounding box `x, y · w × h`, Target point `x, y`, Duration in ms, Step, plus "Real matching disabled / Real click disabled" rows. Logs show **Image click test matched** (success) with the percentage and duration. **The cursor never moves.** |
| 285  | Visual debug overlay                            | Below the result panel, a Debug overlay card shows the captured preview as `<img>` with: (a) a dashed blue rectangle for the region (if any); (b) a solid green rectangle for the matched bounding box; (c) a small confidence badge inside the rectangle (`<percent> · matched`); (d) a red dot for the target point. The overlay scales with the image (`max-width: 100%`). |
| 286  | Action preview JSON                             | Below the overlay, an **Action preview** card shows a `<pre>` block with a JSON of the planned `image_click` action: `type:"image_click"`, `mode:"preview"`, `templateId`, `templateName`, `targetPoint`, `boundingBox`, `confidence`, `usedRegion`, `realClick:false`, `realMatching:false`, `note:"Preview only…"`. The JSON is rendered through `<pre>.textContent` (no HTML interpolation). |
| 287  | Run Test Match — match below threshold          | Raise the threshold to `0.99`, keep the same template / preview, press Run Test Match. Headline switches to **Template not found** (yellow). Warnings block lists `Match confidence is below threshold.`. Overlay shows a dashed orange "candidate" rectangle (instead of solid green) with `<percent> · low` badge. Logs show **Image click test — low confidence**. Audit timeline contains `imageClick.test.lowConfidence`. **No click.** |
| 288  | Run Test Match — invalid region                 | DevTools: set `_imageClickFormRegion = { x: 99999, y: 0, width: 10, height: 10 }`. Press Run Test Match. Headline **Test Match failed** (red). Errors list contains `Region is invalid.`. Audit shows `imageClick.test.failed` with `errorsCount >= 1`. |
| 289  | Run Test Match — template too large             | Pick a template whose dimensions exceed the captured preview. Press Run Test Match. Errors list contains `Template is larger than the search area.` and `Template image is missing` is NOT shown. **No click.** |
| 290  | Clear result                                    | After any Test Match run, press **Clear result**. The Result panel, the Debug overlay card, and the Action preview card collapse to hidden. The diagnostics card resets `Last test at`, `Last test matched`, `Last test confidence`, `Last test duration`, `Last test template`, `Last test errors` to `—`. Audit shows `imageClick.test.cleared`. |
| 291  | Save scenario after Test Match                  | After a successful Test Match, press **Save**. The scenario persists in `scenarios.json` with the same `templateId`, `region`, `threshold`, `step`, `timeoutMs`, `intervalMs`, `repeatCount` as the form fields — and **NO** `imageDataUrl`, **NO** thumbnail, **NO** debug result. The scenario list shows the saved card. |
| 292  | Run image_click scenario — still simulation     | Select the saved image_click scenario as active and press the main Start button. The scenario runs through the click engine the same way as Step 30 (capture → match → simulated click). The cursor never moves. Audit shows `scenario.imageClick.started` / `.simulated` / `.completed`. |
| 293  | simple_click still works                        | Create a Coordinate click scenario, run it. The simple_click branch is unchanged; the Test Match panel does NOT appear in that section. |
| 294  | Diagnostics card                                | Advanced → Safety → **Image click test diagnostics** card shows the rows: `Last test at`, `Last test matched`, `Last test confidence`, `Last test duration`, `Last test template`, `Last test errors`, `Test Match does not click = enabled`, `Real matching disabled = enabled`, `Real click disabled = enabled`. |
| 295  | Copy diagnostics line                           | Advanced → Safety → Copy diagnostics → paste. The output contains a single `Image click test: hasResult=…, lastImageClickTestAt=…, lastImageClickTestMatched=…, lastImageClickTestConfidence=…, lastImageClickTestDurationMs=…, lastImageClickTestTemplateId=…, lastImageClickTestErrorsCount=…, testDoesNotClick=true, realMatching=false, realClick=false` line. **No base64 / `imageDataUrl` / pixel data anywhere in the diagnostics text.** |
| 296  | No real click verification                      | While iterating Test Match for at least 30 seconds (different templates / thresholds / regions), watch the cursor and a focused text editor. Cursor unchanged, editor receives no input. **Test Match never clicks.** |
| 297  | No OCR / OpenCV                                 | DevTools console: `package.json` still declares zero of `tesseract`, `tesseract.js`, `opencv4nodejs`, `@u4/opencv4nodejs`, `opencv.js`, `opencv-js`, `sharp`, `jimp`, `pixelmatch`, `looks-same`, `robotjs`, `nut-js`, `iohook`, `uiohook-napi`. The `image-click-test-tools.js` and `image-click-test-ui.js` modules contain no `require()` of any of those. |
| 298  | Hard guarantees                                 | DevTools console: `runImageClickTest` and friends only return debug data. `getImageClickTestStatus().testDoesNotClick === true`. `getImageClickTestStatus().realClick === false`. The action preview's `realClick` is always `false`. The audit allowlist contains exactly `imageClick.test.started/completed/failed/lowConfidence/cleared` (5 entries). Step 31 added no new IPC channel. |



## Step 32 — OCR Foundation (mock only)

These manual checks verify the new OCR Foundation tab inside the
Advanced dashboard. **Mock OCR never clicks**, never executes a
`text_click` action, never recognises real text, never opens a
new IPC channel, never persists the screenshot or the result
on disk.

| #    | Step                                         | Expected                                                                                                                                                                                                                                              |
|------|----------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| 299  | Open Advanced → OCR                          | Advanced → tab list shows a new **OCR** button next to **Поиск шаблона**. Clicking it switches to the OCR section. The very first element is a yellow **MOCK** notice: "This is mock OCR. Real text recognition is not connected yet." (RU/EN). |
| 300  | Empty state — no preview                     | Without a captured preview, the **Screen preview status** card shows "Capture a screen preview first." Press **Run mock OCR** → result panel renders **Mock OCR failed** headline and lists `captureScreenPreviewFirst`. **No click.**                |
| 301  | Capture a preview                            | Open Screen Capture (via the *Open Screen Capture* button on the OCR tab) → Refresh → Select source → Capture preview. Switch back to OCR. Screen preview status card now shows source name, image size in pixels, capturedAt, "Preview only = enabled". |
| 302  | Target text required                         | Without typing a target text, press **Run mock OCR**. Errors block lists `Target text is required.` Result panel: **Mock OCR failed**. **No click.**                                                                                                  |
| 303  | Run mock OCR (no region)                     | Type `Continue`, leave Use selected region on, ensure no region is saved → press **Run mock OCR**. Headline: **OCR found a match** (green). Recognised blocks list shows 4 entries: `Continue`, `OK`, `Cancel`, `Settings`. The matched row is highlighted. |
| 304  | Visual overlay (no region)                   | Below the result card, the Debug overlay card shows the captured preview as `<img>` with: yellow-dashed rectangles for all blocks, a green solid rectangle for the matched block (with a tiny text label), and a red dot for the target point. **No region rectangle is drawn.** |
| 305  | text_click action preview                    | Below the overlay, an **text_click action preview** card shows a `<pre>` block with a JSON of `{ type:"text_click", mode:"preview", text:"Continue", targetPoint, boundingBox, confidence, language, matchMode, caseSensitive, usedRegion:null, realClick:false, realOcr:false, note:"Preview only…" }`. The JSON is rendered through `<pre>.textContent`. |
| 306  | Run mock OCR (with region)                   | Switch to Screen Capture → Save a region → switch back to OCR. The Region summary card shows the rectangle. Press **Run mock OCR** → the overlay also shows a dashed blue region rectangle, and every block lies inside it. The action preview JSON shows `usedRegion: {x,y,width,height}`. |
| 307  | Match mode `exact`                           | Set match mode to `exact`. The mock ALWAYS creates a target block with the user's verbatim text, so an `exact` lookup of the typed text still matches the fabricated block (mock OCR is a positive demo by design). Verify the matched row in the blocks list updates as the match mode changes (e.g., the surrounding labels `OK` / `Cancel` / `Settings` no longer fuzz-match). |
| 308  | Case sensitive toggle                        | Toggle Case sensitive ON / OFF and re-run mock OCR. The mock always finds the user-typed target block (case matches itself). Audit timeline contains an `ocr.mock.completed` payload with the chosen flags. The toggle persists across runs. |
| 309  | Language select                              | Switch language to `ru`, then `en`, then `ru+en`. The select reflects the change and persists across runs. Audit timeline shows `ocr.mock.requested` payloads with the selected language. |
| 310  | Use selected region toggle                   | Toggle Use selected region OFF. The Region summary card shows `Use selected region: off`. Re-run mock OCR. The overlay omits the region rectangle even if a region exists in the regionSelector slice. |
| 311  | Clear OCR result                             | Press **Clear OCR result**. The result card, the recognised blocks card, the overlay card, and the action preview card are removed. The placeholder "No OCR result" appears. The diagnostics card resets `Last OCR run at` etc. to `—`. Audit shows `ocr.mock.cleared`. |
| 312  | Open Screen Capture / Open Region Selector   | Each navigation button switches to the Screen Capture tab. The OCR settings (target text, language, match mode, case sensitive, use selected region) persist when navigating away and back. |
| 313  | Diagnostics card                             | Advanced → Safety → **OCR diagnostics** card shows: `Mock OCR available = enabled`, `Real OCR available = disabled`, `Last OCR run at`, `Last OCR matched`, `Last OCR confidence`, `Last OCR duration`, `Last OCR language`, `Last OCR match mode`, `Last OCR blocks count`, `Target text present`, `Region used`, `Real OCR disabled = enabled`, `Text recognition is not implemented yet = enabled`, `Real click disabled = enabled`. |
| 314  | Copy diagnostics line                        | Advanced → Safety → Copy diagnostics → paste. Output contains a single `OCR: ocrMockAvailable=true, realOcrAvailable=false, lastOcrRunAt=…, lastOcrMatched=…, lastOcrConfidence=…, lastOcrDurationMs=…, ocrLanguage=…, ocrMatchMode=…, targetTextPresent=…, lastOcrBlocksCount=…, regionUsed=…, realOcr=false, realClick=false, tesseractAvailable=false, ocrEngineImplemented=false` line. **No base64 / `imageDataUrl` / pixel data, and never the full target text in this line.** |
| 315  | No real click verification                   | While iterating Mock OCR for at least 30 seconds (different texts / languages / match modes / regions), watch the cursor and a focused text editor. Cursor unchanged, editor receives no input. **Mock OCR never clicks.** |
| 316  | No Tesseract / OpenCV                        | DevTools console: `package.json` still declares zero of `tesseract`, `tesseract.js`, `tesseract-ocr`, `node-tesseract-ocr`, `opencv4nodejs`, `@u4/opencv4nodejs`, `opencv.js`, `opencv-js`, `sharp`, `jimp`, `pixelmatch`, `looks-same`, `robotjs`, `nut-js`, `iohook`, `uiohook-napi`. Neither `ocr-mock-engine.js` nor `ocr-ui.js` calls `require()`. |
| 317  | image_click and simple_click still work      | Create a simple_click scenario, run it. Create an image_click scenario, run Test Match, save, run. Both flows are unchanged at Step 32 — the OCR slice is independent. **No click in any flow.** |
| 318  | Hard guarantees                              | DevTools console: `getOcrMockStatus().ocrMockAvailable === true`. `getOcrMockStatus().realOcrAvailable === false`. `getOcrMockStatus().realClick === false`. `getOcrMockStatus().realOcr === false`. The action preview's `realClick` is always `false` and `realOcr` is always `false`. The audit allowlist contains exactly five new entries (`ocr.mock.requested`, `ocr.mock.completed`, `ocr.mock.failed`, `ocr.mock.cleared`, `text.click.preview.created`). Step 32 added no new IPC channel. |



## Step 33 — Text Click Scenario Type Foundation

These manual checks verify the new `text_click` scenario type
end-to-end. **`text_click` never clicks**, never executes a real
click, never recognises real text, never opens a new IPC
channel, never persists the screenshot or the OCR result on
disk.

| #    | Step                                            | Expected                                                                                                              |
|------|-------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------|
| 319  | New scenario type in the form                   | Scenarios → New scenario. The **Тип сценария** select now has three options: **Coordinate click** (default), **Image click**, **Text click**. Default selection still keeps the simple_click fields visible. |
| 320  | Switch to text_click                            | Pick **Text click**. The simple_click and image_click sections collapse; the text_click section appears with: yellow **mock OCR** notice, target text input (placeholder `Продолжить / Continue`), language select (`ru` / `en` / `ru+en`, default `ru+en`), match mode select (`contains` / `exact`, default `contains`), case-sensitive checkbox (default off), region summary + Use selected region / Clear region buttons, timeout (default `10000`), interval (default `1000`), repeat (default `1`). |
| 321  | Empty target text → validation error            | Without typing a target text and without saving, switch back and forth. The form does not auto-clean. Press **Save** → form refuses with `Целевой текст обязателен` / `Target text is required` and no scenario is created. |
| 322  | Save valid text_click                           | Type `Continue`, leave defaults, give the scenario a name, press **Save**. Scenarios list shows the new scenario with a **text_click** badge and a settings line `text_click "Continue" · ru+en · contains · ·full · 1000ms · 1×`. |
| 323  | Use selected region                             | Open Screen Capture → Refresh → Capture preview → Region Selector → Save region. Edit the text_click scenario → press **Use selected region**. The summary line updates to `x, y · w × h`. Save. The scenario list line switches to `…·region`. |
| 324  | Clear scenario region                           | Edit the saved text_click scenario, press **Clear scenario region**. The summary line resets to `Область не выбрана`. Save. The scenario list line switches back to `·full`. |
| 325  | Run text_click — text found (no region)         | Make sure a preview is captured. Set the saved text_click scenario as active → Start. Logs show `Сценарий запущен`, `1/1: text_click симулирован text="Continue" x=… y=… confidence=…%`, `Сценарий завершён`. Progress reaches 100%. **The cursor never moves.** |
| 326  | Run text_click — text found (with region)       | Re-attach a region, save, run. The mock fabricates the target block inside the region. The audit timeline shows `scenario.textClick.ocr.completed` with `hasRegion: true`. **No real click.** |
| 327  | Run text_click — empty target text              | DevTools: bypass the form and set `scenario.settings.targetText = ""` then run. The scenario fails fast with `Введите целевой текст.` / `Target text is required.` Audit shows `scenario.textClick.failed` with `reason: "missing-target-text"`. **No real click.** |
| 328  | Run text_click — missing preview                | Clear the screen-capture preview (Screen Capture → Clear preview). Run a text_click scenario. The scenario fails fast with `Сначала получите screenshot preview.` / `Capture a screen preview first.` Audit shows `scenario.textClick.failed` with `reason: "missing-preview"`. The text_click form's red "no preview" warning appears whenever the preview is empty AND the form is on the text_click branch. |
| 329  | Stop text_click                                 | Run a scenario with `repeatCount: 5`. Click Stop. The current iteration finishes its mock OCR call and the engine stops cleanly. Logs show `Сценарий остановлен`. Audit timeline contains the in-flight events, no `scenario.textClick.simulated` after the stop. |
| 330  | simple_click still works                        | Open a simple_click scenario, edit it, save, run. The form fields are unchanged; runtime behaviour is unchanged. The scenario card shows the `x:… y:… · …ms · …× · left` line, no text_click badge. |
| 331  | image_click still works                         | Open an image_click scenario, edit, save, run. Test Match still functions. The image_click form section is unchanged. |
| 332  | Diagnostics card                                | Advanced → Safety. The new **text_click scenario** card shows: `text_click scenarios count`, `Last text_click`, `Confidence`, `text_click target`, `Target text present`, `text_click is simulation-only = enabled`, `Real text_click disabled = enabled`, `Real OCR disabled = enabled`. |
| 333  | Copy diagnostics line                           | Advanced → Safety → Copy diagnostics → paste. Output contains a single `Text click scenario: textClickScenariosCount=…, lastTextClickStatus=…, lastTextClickConfidence=…, lastTextClickTargetPoint=…, lastTextClickTextLen=…, lastTextClickLanguage=…, lastTextClickMatchMode=…, textClickSimulationOnly=true, realTextClickEnabled=false, realOcrEnabled=false, tesseractAvailable=false, ocrEngineImplemented=false` line. **The full target text is NEVER in this line — only its length.** |
| 334  | No real click verification                      | While running a text_click scenario for 30 s, watch the cursor and a focused text editor. Cursor unchanged, editor receives no input. **The simulated action is never executed by the OS.** |
| 335  | No real OCR verification                        | DevTools console: `package.json` still declares zero of `tesseract`, `tesseract.js`, `tesseract-ocr`, `node-tesseract-ocr`, `opencv4nodejs`, `@u4/opencv4nodejs`, `opencv.js`, `opencv-js`, `sharp`, `jimp`, `pixelmatch`, `looks-same`, `robotjs`, `nut-js`, `iohook`, `uiohook-napi`. The `runTextClickScenario` function never `require()`s any of those. |
| 336  | Hard guarantees                                 | DevTools console: `getState().execution.lastAction.realClick === false`. `getState().execution.lastAction.realOcr === false`. `executeAction({ type: 'text_click', text: 't', targetPoint: { x: 1, y: 1 }, realClick: true }, { executionMode: 'real' })` returns `{ ok: false, blocked: true }`. `executeAction({ type: 'text_click', text: 't', targetPoint: { x: 1, y: 1 }, realOcr: true }, { executionMode: 'simulation' })` returns `{ ok: false, blocked: true }`. The audit allowlist contains exactly nine new entries (`scenario.textClick.started/ocr.started/ocr.completed/textFound/noTextFound/simulated/failed`, `action.textClick.simulated/realBlocked`). Step 33 added no new IPC channel. |



## Step 34 — Text Click Test Tools + OCR UX Polish

These manual checks verify the new **Test OCR / Test Text Match**
flow inside the `text_click` scenario form. **Test OCR never
clicks**, never executes the scenario, never performs real OCR,
never opens a new IPC channel, never persists the screenshot
or the debug result on disk.

| #    | Step                                            | Expected                                                                                                          |
|------|-------------------------------------------------|-------------------------------------------------------------------------------------------------------------------|
| 337  | Open scenario form (Create) → text_click        | Scenarios → New scenario → switch type to **Text click**. Beneath the timeout / interval / repeat block a new **Text click test tools** panel is rendered with a header, "Test OCR does not click" / "Test OCR does not use real OCR. Mock OCR only." subtitles, three quick navigation buttons (Open OCR / Open Screen Capture / Open Region Selector), three cards (Screen preview status / Region summary / OCR settings), a **Test OCR** primary button, and a **Clear OCR result** button. |
| 338  | Quick navigation buttons                        | Click **Open OCR** → Advanced view, OCR tab. Click **Open Screen Capture** → Advanced view, Screen Capture tab. Click **Open Region Selector** → Advanced view, Screen Capture tab (the region selector lives there). The scenario form is preserved when navigating back. |
| 339  | Empty state — no preview / no target text       | Without a captured preview, the **Screen preview status** card shows "Capture a screen preview first." Without a target text in the form, the **OCR settings** card shows the target row as `—`. Press **Test OCR** → result panel renders with **Text click test failed** headline (red) and lists `targetTextRequired` and `captureScreenPreviewFirst`. **No click. No real OCR.** |
| 340  | OCR settings card auto-refresh                  | Type a target text into the form. The OCR settings card immediately shows the trimmed target text (truncated to 60 chars), the language label (Russian / English / Russian + English), the match mode label (contains / exact), the case sensitive flag (yes / no), and a static "Mock OCR only = enabled" reminder. Switching language / match mode / case sensitive updates the card live. The Test OCR result is NOT auto-recomputed — the user must press the button. |
| 341  | Region summary card                             | Without a selected region, the Region summary card shows `Used region — none`. After Region Selector → Save region → click **Use selected region** in the form, the form's region row shows `x, y · w × h` and the test panel's Region summary card renders the same values along with `Selected region: …` for reference. **Clear scenario region** resets it to `none`. |
| 342  | Run Test OCR — match found                      | With a captured preview, a target text (e.g. `Continue`), and language `ru+en` / match mode `contains` / case sensitive off, press **Test OCR**. Headline: **Target text found** (green). Metric rows: target text (truncated), language label, match mode label, case sensitive `no`, matched text, confidence (e.g. `91.0%`), bounding box, target point, duration, plus "Real OCR disabled / Real text_click disabled" rows. Logs show **Text click test matched** (success) with the percentage and duration. **The cursor never moves. Real OCR is never called.** |
| 343  | OCR blocks list                                 | Below the result panel, the **OCR blocks** card shows 4 rows (target block + `OK` / `Cancel` / `Settings`). The matched row is highlighted (green border / soft green background) and carries a **MATCHED** badge on the left. Each row shows index, text (truncated to 60 chars), confidence, bbox numbers. |
| 344  | Visual overlay (no region)                      | Below the blocks list, the OCR blocks overlay card shows the captured preview as `<img>` with: yellow-dashed rectangles for every OCR block; the matched block as a solid green rectangle with a tiny text label; a red dot for the target point. **No region rectangle is drawn.** |
| 345  | Visual overlay (with region)                    | Re-run Test OCR with a region attached. The overlay also shows a dashed blue region rectangle, and every block lies inside it. The action preview JSON shows `usedRegion: {x,y,width,height}`. |
| 346  | text_click action preview                       | Below the overlay, an **text_click action preview** card shows a `<pre>` block with a JSON of `{ type:"text_click", mode:"preview", text:"Continue", targetPoint, boundingBox, confidence, language, matchMode, caseSensitive, usedRegion, realClick:false, realOcr:false, note:"Preview only…" }`. The JSON is rendered through `<pre>.textContent`. |
| 347  | Test OCR — invalid match mode (DevTools)        | DevTools: tamper with `inputTextMatchMode.value = 'fuzzy'` and press Test OCR. Errors block lists `Unsupported match mode.` Headline **Text click test failed** (red). The form-level dropdown remains correct after refresh. Audit shows `textClick.test.failed`. |
| 348  | Test OCR — invalid language (DevTools)          | DevTools: tamper with `inputTextLanguage.value = 'fr'` and press Test OCR. Errors block lists `Unsupported OCR language.` Audit shows `textClick.test.failed`. |
| 349  | Test OCR — invalid region                       | DevTools: set `_textClickFormRegion = { x: 99999, y: 0, width: 10, height: 10 }`. Press Test OCR. Errors block lists `Region is invalid.` Audit shows `textClick.test.failed`. |
| 350  | Clear OCR result                                | Press **Clear OCR result**. The Result panel, the Blocks list, the Overlay card, and the Action preview card collapse to hidden. The diagnostics card resets `Last text_click test at`, `Last text_click test matched`, `Last text_click test confidence`, `Last text_click test duration`, `Last text_click test target length`, `Last text_click test errors` to `—` / `0`. Audit shows `textClick.test.cleared`. |
| 351  | Save scenario after Test OCR                    | After a successful Test OCR, press **Save**. The scenario persists in `scenarios.json` with the same `targetText`, `language`, `matchMode`, `caseSensitive`, optional `region`, `timeoutMs`, `intervalMs`, `repeatCount` as the form fields — and **NO** `imageDataUrl`, **NO** OCR blocks, **NO** debug result. The scenario list shows the saved card. |
| 352  | Run text_click scenario — still simulation      | Select the saved text_click scenario as active and press the main Start button. The scenario runs through the click engine the same way as Step 33 (mock OCR → simulated `text_click` action). The cursor never moves. Audit shows `scenario.textClick.started` / `.simulated` / `.completed`. |
| 353  | image_click and simple_click still work         | Create a Coordinate click scenario, run it. Create an Image click scenario, run Test Match, save, run. Both flows are unchanged at Step 34. **No click in any flow.** |
| 354  | Diagnostics card                                | Advanced → Safety → **Text click test diagnostics** card shows: `Last text_click test at`, `Last text_click test matched`, `Last text_click test confidence`, `Last text_click test duration`, `Last text_click test target length`, `Last text_click test errors`, OCR language, Match mode, Region used, Last OCR blocks count, `Mock OCR only = enabled`, `Real OCR disabled = enabled`, `Real text_click disabled = enabled`, `Test Match does not click = enabled`. |
| 355  | Copy diagnostics line                           | Advanced → Safety → Copy diagnostics → paste. The output contains a single `Text click test: hasResult=…, lastTextClickTestAt=…, lastTextClickTestMatched=…, lastTextClickTestConfidence=…, lastTextClickTestDurationMs=…, lastTextClickTestTargetTextLen=…, lastTextClickTestErrorsCount=…, lastTextClickTestLanguage=…, lastTextClickTestMatchMode=…, lastTextClickTestRegionUsed=…, lastTextClickTestBlocksCount=…, ocrMockOnly=true, realOcrEnabled=false, realTextClickEnabled=false, testDoesNotClick=true, realClick=false, realOcr=false` line. **The full target text is NEVER in this line — only its length. No base64 / `imageDataUrl` / pixel data anywhere in the diagnostics text.** |
| 356  | No real click verification                      | While iterating Test OCR for at least 30 seconds (different target texts / languages / match modes / regions), watch the cursor and a focused text editor. Cursor unchanged, editor receives no input. **Test OCR never clicks.** |
| 357  | No real OCR verification                        | DevTools console: `package.json` still declares zero of `tesseract`, `tesseract.js`, `tesseract-ocr`, `node-tesseract-ocr`, `opencv4nodejs`, `@u4/opencv4nodejs`, `opencv.js`, `opencv-js`, `sharp`, `jimp`, `pixelmatch`, `looks-same`, `robotjs`, `nut-js`, `iohook`, `uiohook-napi`. The `text-click-test-tools.js` and `text-click-test-ui.js` modules contain no `require()` of any of those. |
| 358  | Hard guarantees                                 | DevTools console: `runTextClickTest` and friends only return debug data. `getTextClickTestStatus().ocrMockOnly === true`. `getTextClickTestStatus().realOcrEnabled === false`. `getTextClickTestStatus().realTextClickEnabled === false`. `getTextClickTestStatus().realClick === false`. `getTextClickTestStatus().realOcr === false`. The action preview's `realClick` and `realOcr` are always `false`. The audit allowlist contains exactly `textClick.test.started/completed/failed/noMatch/cleared/actionPreview.created` (6 entries). Step 34 added no new IPC channel. |



## Step 36 — Visual Builder UX Polish + Scenario Presets

These manual checks verify the new **Visual Builder** tab plus the
three **Scenario Presets** (`coordinate-basic`, `image-click-basic`,
`text-click-basic`). The Visual Builder never auto-saves a scenario,
never auto-runs a scenario, never moves the cursor, never performs
real OCR.

| #    | Step                                         | Expected                                                                                                                                                                  |
|------|----------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| 359  | Visual Builder tab loads                     | Open Advanced → **Visual Builder**. The header shows the title, subtitle, and the always-on safety banner ("Visual Builder runs in simulation only. No real clicks. No real OCR."). |
| 360  | Status row                                   | Below the header, the status row shows six cells: Screen preview / Region / Template / Image match / OCR result / Real clicks. Each badge reads `ready` / `missing` / `disabled`. The Real clicks badge is **always** `disabled` and red. |
| 361  | Onboarding hints — empty state               | After capturing a preview, picking a region, importing a template, running mock OCR, the Onboarding hints card shows "No hints needed." Logs do not record any `visualBuilder.requirement.missing` event. |
| 362  | Onboarding hints — quick actions             | With no captured preview, the hints card shows "Capture a screen preview first." plus the **Open Screen Capture** button. Clicking the button switches the active tab. The same flow applies to **Open Templates** (when no template), **Open Region Selector** (when no region), **Open OCR** (when no OCR result and the type is `text_click`). |
| 363  | Action-type selector                         | The preview card has a select with three options: Coordinate click, Image click, Text click. Switching changes which onboarding hints appear. The selected type is preserved when re-rendering the tab. |
| 364  | Preview + overlays                           | After a captured preview, the preview card shows the captured image. Toggle the six overlay checkboxes (Show region, Show template match, Show template target, Show OCR blocks, Show OCR target, Show action target) and verify each overlay appears or disappears. The preview <img> consumes only the captured `imageDataUrl` from the screen-capture slice. No new `<img>` source is created elsewhere. |
| 365  | Overlay legend                               | Below the overlays, the legend lists every layer (region / template match / template target / OCR blocks / OCR target / action target) with a colour swatch and a localised label. |
| 366  | Show all / Hide all / Clear overlays         | Pressing **Show all overlays** turns every checkbox on. Pressing **Hide all overlays** turns every checkbox off. Pressing **Clear overlays** removes the last action-target dot. Each press logs `visualBuilder.overlay.changed` with the action name. |
| 367  | Quick-action buttons                         | The actions card shows: Capture preview / Select region / Run image test / Run OCR test / Create scenario draft / Open scenario form. Each button switches to the relevant tab (or opens the form). None of them save a scenario or run a scenario. |
| 368  | Create scenario draft — simple_click         | Pick `simple_click`, press **Create scenario draft**. The Draft preview card fills with: type `simple_click`, name `Coordinate click draft`, source `visual-builder`, real clicks `false`, settings summary (`x:500 y:400 · 500ms · 10× · left` or the centre of the selected region). Audit shows `visualBuilder.draft.preview.created`. |
| 369  | Create scenario draft — image_click          | Pick `image_click` without an active template. **Create scenario draft** fails with a `Visual Builder requirements missing: templateMissing` log line. Audit shows `visualBuilder.requirement.missing`. With a template selected, the draft fills with `templateId`, region (if attached), threshold `0.75`, step `4`. |
| 370  | Create scenario draft — text_click           | Pick `text_click` without OCR result and without a target text. **Create scenario draft** fails with `Visual Builder requirements missing: targetTextMissing`. Audit shows `visualBuilder.requirement.missing`. After running mock OCR, the draft fills with the matched text, language, match mode, optional region. |
| 371  | Open draft in form                           | After a successful draft preview, press **Open draft in form**. The scenario form opens pre-filled with the right type and values. The form **never** auto-saves. Pressing **Cancel** discards the draft. |
| 372  | Scenario presets — list                      | The Scenario presets card shows three cards: coordinate / image / text. Each card has a name (localised), a type badge (with monospace text), a localised description, a one-line summary, and two buttons: **Use preset** / **Use with current visual context**. |
| 373  | Use preset — coordinate                      | Press **Use preset** on `Basic coordinate click`. The scenario form opens pre-filled with `simple_click`, `x=500, y=400, button=left, intervalMs=500, repeatCount=10`. Audit shows `scenarioPreset.selected` → `scenarioPreset.draft.created` → `scenarioPreset.form.opened`. |
| 374  | Use preset — image                           | Press **Use preset** on `Basic image click`. Form: `image_click`, threshold `0.75`, step `4`, timeoutMs `10000`, intervalMs `1000`, repeatCount `1`. With a template imported and selected as active, the templateId field is populated. |
| 375  | Use with current visual context — image      | Capture a preview, select a region, import + select a template, run mock template matching. Press **Use with current visual context** on `Basic image click`. The form opens with the active templateId, the region from the region-selector slice, and threshold/step from the matching slice. Audit shows `scenarioPreset.draft.created` with `withVisualContext: true`. |
| 376  | Use with current visual context — text       | Run mock OCR. Press **Use with current visual context** on `Basic text click`. The form opens with target text = matched text (truncated to 200 chars), language / matchMode / case sensitive copied from the OCR result, region copied from the region-selector slice. The full target text is never in the audit log — only its length. |
| 377  | Save scenario from preset                    | Press **Save** in the form opened by a preset. The scenario persists in `scenarios.json` with no `imageDataUrl`, no thumbnail, no preset metadata. Selecting it as active and pressing **Start** runs the same simulation-only flow as Steps 30 / 33. The cursor never moves. |
| 378  | Diagnostics — Visual Builder card            | Advanced → Safety → diagnostics carry a `Visual Builder:` line with `presetsAvailable=true, presetsCount=3, lastUsedPresetId=…, lastDraftType=…, visualBuilderDraftAvailable=…, selectedActionType=…, missingRequirementsCount=…, showRegion=…, showTemplateMatch=…, showTemplateTarget=…, showOcrBlocks=…, showOcrTarget=…, showActionTarget=…, autoSavesScenarios=false, autoRunsScenarios=false, realClick=false, realOcr=false`. **No `imageDataUrl` or full target text in this line. The full target text never appears in any diagnostics line.** |
| 379  | No real click verification                   | While iterating Visual Builder + presets for at least 60 seconds (different action types, different overlay combinations, different presets, different visual contexts), watch the cursor and a focused text editor. Cursor unchanged, editor receives no input. **Visual Builder never clicks. Presets never click.** |
| 380  | No new dependencies                          | `package.json` still declares zero of `robotjs`, `nut-js`, `iohook`, `uiohook-napi`, `node-key-sender`, `tesseract`, `tesseract.js`, `tesseract-ocr`, `node-tesseract-ocr`, `opencv4nodejs`, `@u4/opencv4nodejs`, `opencv.js`, `opencv-js`. `src/scenario-presets.js`, `src/visual-builder.js`, `src/visual-builder-ui.js` contain no `require()` of any of those. |
| 381  | Hard guarantees                              | DevTools: `getVisualBuilderDiagnostics().autoSavesScenarios === false`. `getVisualBuilderDiagnostics().autoRunsScenarios === false`. `getVisualBuilderDiagnostics().realClick === false`. `getVisualBuilderDiagnostics().realOcr === false`. The audit allowlist contains exactly the 6 new entries: `scenarioPreset.selected/draft.created/form.opened`, `visualBuilder.overlay.changed/requirement.missing/draft.preview.created`. Step 36 added no new IPC channel. |

## Step 37 — Smart-Features QA + Next Branch Preparation

These checks verify the documentation pass for Step 37.

| #    | Step                                                  | Expected                                                                                            |
|------|-------------------------------------------------------|-----------------------------------------------------------------------------------------------------|
| 382  | docs/SMART_FEATURES_QA.md present                     | The file exists and lists 12 sections: Scope, Screen Capture QA, Region Selector QA, Template Assets QA, Template Matching QA, Image Click Scenario QA, OCR Mock QA, Text Click Scenario QA, Visual Builder QA, Scenario Presets QA, Safety checks, Known issues, Release recommendation. Each QA section has steps + expected + status. |
| 383  | docs/NEXT_BRANCH_PLAN.md present                      | The file exists and describes Branch A (Real OCR), Branch B (Real Desktop Adapter), Branch C (Android Research), and recommends Branch A first. |
| 384  | docs/SMART_FEATURES_LIMITATIONS.md present            | The file exists and lists every smart-features limitation: screen capture, region, templates, matching, OCR, image_click, text_click, Visual Builder, presets, real clicks. |
| 385  | README mentions Step 36 + Step 37                     | `README.md` has a section / bullet for Step 36 (Visual Builder UX Polish + Scenario Presets) and Step 37 (Smart Features QA + Next Branch Preparation). It still asserts simulation-only. |
| 386  | PROJECT_CONTEXT mentions Step 37                      | `PROJECT_CONTEXT.md` describes Step 37 with the same wording: simulation-only, no real OCR, no real clicks, recommendation Branch A. |
| 387  | CHANGELOG mentions Step 36 + Step 37                  | `CHANGELOG.md` has entries "Step 36 — Visual Builder UX Polish + Scenario Presets" and "Step 37 — Smart Features QA + Next Branch Preparation" with bullet lists. |
| 388  | Smoke check passes Step 37 invariants                 | `npm run smoke` reports 0 failures. New invariants: `src/scenario-presets.js`, `src/visual-builder.js`, `src/visual-builder-ui.js`, `docs/SMART_FEATURES_QA.md`, `docs/NEXT_BRANCH_PLAN.md`, `docs/SMART_FEATURES_LIMITATIONS.md` exist. README / PROJECT_CONTEXT mention Step 37 + Visual Builder + Scenario Presets. `package.json` still does not declare any forbidden module. |



## Smart Beta smoke sequence (Step 42)

End-to-end manual sequence that exercises the full smart-features
chain in dev mode and the packaged build. The cursor never moves;
the action-pipeline rejects every `realClick: true` outright.

| #   | Step                                                | Expected                                                                                                                          |
|-----|-----------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------|
| S1  | `npm install`                                       | Pulls `tesseract.js@^5.0.4` plus the Electron toolchain.                                                                          |
| S2  | `npm run smoke`                                     | 0 failures.                                                                                                                       |
| S3  | `npm start`                                         | The app opens. Scenario list is populated. Status: Idle.                                                                          |
| S4  | Capture a screen preview                            | Audit emits `screen.capture.preview.captured`. The screenshot is held only in renderer memory.                                    |
| S5  | Select a region                                     | Audit emits `region.selection.completed`. Region card shows preview-space + image-space rectangles.                               |
| S6  | Import a template                                   | Audit emits `template.import.completed`. Metadata file is rewritten through the main process.                                     |
| S7  | Run mock + real-preview template matching           | Result card shows bbox + target dot + confidence. Audit emits `template.match.realPreview.requested/.completed`.                  |
| S8  | Create + save an `image_click` scenario             | Test Match draws the debug overlay. The scenario engine emits `scenario.imageClick.simulated` cycles. Cursor never moves.         |
| S9  | Run mock OCR                                        | Mock blocks list + overlay + action preview render. Audit emits `ocr.mock.requested/.completed`.                                  |
| S10 | Enable Tesseract for the session                    | Confirmation dialog appears. After confirm, audit emits `ocr.real.enabledForSession`. Use Tesseract OCR enables.                  |
| S11 | Run real OCR manually                               | Progress card shows stages + percent bar. Audit emits `ocr.real.started/.progress/.completed`. Cursor never moves.                |
| S12 | Create + save a `text_click` scenario               | Provider select persists. With Tesseract and no session opt-in, the engine fails cleanly. Otherwise audit emits `scenario.textClick.simulated`. |
| S13 | Open the Visual Builder                             | Status row paints. Real clicks badge is always `disabled` (red).                                                                  |
| S14 | Create a draft from the Visual Builder              | Audit emits `visualBuilder.draft.preview.created`. Draft preview card surfaces `OCR provider used` + `Real OCR`.                  |
| S15 | Use a preset (e.g. `coordinate-basic`)              | Form opens pre-filled. Audit emits `scenarioPreset.selected/.draft.created/.form.opened`. Presets NEVER auto-save.                |
| S16 | Verify no real clicks                               | Watch a focused text editor for 60 s while iterating. Cursor unchanged. Editor receives no input. `Action pipeline:` line reports `realActionAllowed=false`. |
| S17 | `npm run pack`                                      | electron-builder produces an unpacked dir under `dist/`. No userData / temp screenshots in the artifacts.                          |
| S18 | `npm run dist`                                      | Installable artifacts (NSIS / DMG / AppImage). Open and re-run every step above against the packaged build.                       |

For the per-platform release sign-offs see
[`docs/SMART_BETA_RELEASE_CHECKLIST.md`](./SMART_BETA_RELEASE_CHECKLIST.md).
