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
