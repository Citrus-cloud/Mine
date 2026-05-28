# ClickFlow — Smoke Tests

Quick verification checklist before release or major changes.

## Pre-requisites
```bash
npm install
```

## Tests

| # | Test | Steps | Pass? |
|---|------|-------|-------|
| 1 | Launch | `npm start` | App window opens |
| 2 | Main screen | Observe UI | Status card, buttons, progress visible |
| 3 | Create scenario | Scenarios → Create → Fill → Save | Scenario in list |
| 4 | Run simulation | Select scenario → Start | Progress bar fills, logs appear |
| 5 | Stop simulation | Click Stop during execution | Stops, status returns to Stopped |
| 6 | Emergency Stop | Press Escape during execution | Immediate stop |
| 7 | Change language | Settings → English → Save | UI switches to English |
| 8 | Restart persistence | Quit → Reopen | Language and scenarios preserved |
| 9 | Import scenario | Advanced → Scenarios → Import → JSON file | Preview shown, confirm adds |
| 10 | Export scenario | Advanced → Scenarios → Export All | File saved |
| 11 | Advanced dashboard | Click Advanced mode | 7 tabs visible and switchable |
| 12 | Global hotkeys | Press CmdOrCtrl+Alt+S | Scenario starts |
| 13 | Global stop | Press CmdOrCtrl+Alt+X during execution | Stops |
| 14 | Global emergency | Press CmdOrCtrl+Alt+E during execution | Emergency stop |
| 15 | Menu commands | Scenario → Start from menu | Starts execution |
| 16 | Quit while running | Start scenario → Close window | Confirm dialog appears |
| 17 | No real clicks | Start scenario → Observe desktop | NO mouse movement anywhere |
| 18 | Diagnostics | Advanced → Safety → Copy diagnostics | Text copied to clipboard |

## After Packaging

| # | Test | Steps |
|---|------|-------|
| 1 | Pack | `npm run pack` succeeds |
| 2 | Run packed | Launch from dist/ directory |
| 3 | Basic flow | Create → Run → Stop in packed version |
