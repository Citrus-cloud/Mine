# ClickFlow — Real Coordinate Scenario QA Checklist (Step 49)

> Manual QA for running a `simple_click` scenario as one real
> coordinate click. Real mode is disabled by default and session-only.
> Read `docs/REAL_COORDINATE_SCENARIO_MODE.md` first.

## Build / launch

- [ ] `npm install` succeeds.
- [ ] `npm run smoke` passes (0 failures) and performs **no** real click.
- [ ] `npm start` launches; **no** real click at app start.

## Simulation & dry-run

- [ ] `simple_click` **simulation** works as before (repeatCount honored).
- [ ] **Dry-run** mode works: preview only, no real input, progress
      completes.

## Real mode gating

- [ ] Real-coordinate mode is **disabled by default** (selector option
      disabled with a reason until ready).
- [ ] Real mode **blocked without session enable**.
- [ ] Real mode **blocked for image_click** ("Real mode is only
      available for coordinate click scenarios.").
- [ ] Real mode **blocked for text_click**.
- [ ] Real mode **blocked when repeatCount > 1** (message suggests
      simulation or repeatCount = 1).

## One real coordinate click

- [ ] With session enabled, `simple_click`, repeatCount = 1, adapter
      available: selecting Real coordinate + **Run one real coordinate
      click** opens a confirmation modal.
- [ ] Confirm is disabled until "I confirm one real click…" is ticked.
- [ ] After confirmation, one click is attempted via the pipeline →
      main adapter (executed if a backend is installed; otherwise
      blocked with a clear reason).

## Post-run

- [ ] **Confirmation is reset** (a second real run needs a new
      confirmation).
- [ ] **Execution mode resets to simulation** after the real run.
- [ ] **Audit logs** record requested / confirmation / safetyCheck /
      executed-or-blocked events.
- [ ] **Run summary** is correct: `executionMode:"real-coordinate"`,
      `realActionsPerformed` true only when executed, `oneClickOnly:true`,
      x/y/button, status.

## Invariants

- [ ] `realDesktopActions`/`realCoordinateClick`/`realImageClick`/
      `realTextClick` default false; reset to false after restart.
- [ ] `contextIsolation:true`, `nodeIntegration:false`, CSP unchanged.
- [ ] No `robotjs`/`iohook`/`uiohook-napi`/`opencv`.
