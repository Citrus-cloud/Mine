# ClickFlow — Smoke Tests

Quick verification checklist before release or major changes.
Status: aligned with `0.1.0-beta` (Step 14).

## Pre-requisites

```bash
npm install
```

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
