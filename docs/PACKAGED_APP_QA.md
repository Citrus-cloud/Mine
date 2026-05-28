# ClickFlow — Packaged App QA Checklist

This is the **manual** QA checklist for a packaged ClickFlow
build (`npm run pack` / `npm run dist`). It is the last gate
before the `v0.1.0-beta` GitHub Release is published.

> **Important.** This checklist exists because a packaged Electron
> app can behave differently from `npm start` (paths, file
> dialogs, signed-vs-unsigned launch flow, tray availability).
> Static smoke checks cannot catch these. **The packaged app must
> remain simulation-only on every platform you ship.**

Run this walk on **at least one target OS** before publishing the
GitHub Release. Repeat per platform if you ship multi-OS assets.

---

## 0. Build context

Fill out the next four lines per build host:

- **Build command used:** `npm run pack` / `npm run dist`
- **OS / version:** ____ (e.g. macOS 14.6 / Windows 11 23H2 / Ubuntu 24.04)
- **Arch:** ____ (e.g. arm64, x64)
- **Artifact file name:** ____ (per
  [`docs/BUILD_ARTIFACTS.md`](./BUILD_ARTIFACTS.md) §6)

## 1. Launch

- [ ] The packaged binary launches without console errors.
- [ ] App window opens at 1000 × 700 (or the system default for
      your DPI).
- [ ] No popup other than the OS' first-run security warning
      (Gatekeeper / SmartScreen — these are documented as
      `KNI-1` / `KNI-2` in
      [`docs/RELEASE_BLOCKERS.md`](./RELEASE_BLOCKERS.md)).

## 2. Main screen

- [ ] App title and description render in the active language.
- [ ] **Simulation mode** badge is visible.
- [ ] Version badge is populated (`v0.1.0`).
- [ ] Status / Scenario rows are present.
- [ ] Progress card initially reads `0 / 0 · 0%`.
- [ ] Footer shows "Safe mode enabled".

## 3. Scenarios

- [ ] **Create scenario** — fill the form, save, scenario appears
      in the list.
- [ ] **Edit scenario** — the change persists after Save.
- [ ] **Delete scenario** — non-default scenarios deletable; the
      default scenario cannot be deleted.
- [ ] **Persistence** — after a full quit + relaunch, your custom
      scenarios are still present.

## 4. Simulation Start / Stop

- [ ] Press **Start**. Progress fills, status indicator pulses,
      log entries appear.
- [ ] **No real cursor movement** anywhere on the desktop.
- [ ] **No input arrives in any other application.** Keep a text
      editor focused for at least 60 seconds and confirm nothing
      lands in it.
- [ ] Press **Stop** mid-run. State returns to Stopped.

## 5. Emergency Stop

- [ ] During a run, press `Escape`. Run aborts immediately.
- [ ] Start again, switch focus to another app, press
      `CmdOrCtrl+Alt+E` (the global emergency-stop hotkey). Run
      aborts within ~1 second.
- [ ] No real input is fired in the moments around emergency
      stop.

## 6. RU / EN switch

- [ ] **Settings → Language → English → Save.** Header, badges,
      status / scenario rows, footer, and Advanced dashboard tab
      labels all switch to English.
- [ ] Switch back to Russian and confirm everything reverts.
- [ ] After full quit + relaunch, the saved language is restored.

## 7. Settings persistence

- [ ] **Theme** switch (Light / Dark / System) — immediate; survives
      restart.
- [ ] **Min interval / Max repeats** — saved values are loaded on
      next launch and enforced when starting a scenario.
- [ ] **Reset settings** in Advanced → Settings — defaults restored
      after confirmation.

## 8. Import / export

- [ ] **Export All** scenarios → save JSON file. Open the file:
      it contains the expected scenario records and an
      `app.version` of `0.1.0`.
- [ ] **Import** the exported file → preview shown → confirm →
      counts match.
- [ ] **Export settings** → JSON file. **Import settings** with
      that file → confirmation dialog → settings applied.
- [ ] Try to import a non-JSON / malformed file → friendly error
      log. **App does not crash.**

## 9. Advanced dashboard

- [ ] All 7 tabs cycle (Overview / Scenarios / Execution / Logs /
      Settings / Safety / Future) without console errors.
- [ ] **Overview** card shows active scenario, execution status,
      stats, settings summary, recent events.
- [ ] **Logs** filter chips work (All / Info / Success / Warning /
      Error). Clear logs requires confirmation.

## 10. Diagnostics

- [ ] **Advanced → Safety → Copy diagnostics**. Paste somewhere
      readable. Confirm the output contains:
  - `Simulation only: true`
  - `Feature flags: simulationOnly=true, realDesktopActions=false, ocr=false, imageRecognition=false`
  - `Action pipeline: ..., realActionsEnabled=false, realActionsImplemented=false, realActionAllowed=false`
  - `Adapter: active=mock, ..., realActionsAllowed=false`
  - `Sandbox: dryRunAvailable=true, realActionsAllowed=false, realActionsImplemented=false`
  - `Release: appVersion=0.1.0, releaseTarget=0.1.0-beta, beta=true, ..., readyForManualRelease=true`
- [ ] **Beta health** card lists `simulationOnly` enabled, the
      three "Implemented" rows = no, the four document presence
      rows = yes.
- [ ] **Release status** card shows version / Beta release: yes /
      simulation only: enabled / 8 release-doc rows = present /
      bottom badge `Ready for manual release`.

## 11. Mock adapter self-test

- [ ] **Advanced → Safety → Desktop adapter status → Run adapter
      self-test.** Log entries: `Adapter self-test started` then
      `Adapter self-test passed`. Card row: `Passed (4/4)`.
- [ ] DevTools console: `setActiveAdapter('real-desktop')` returns
      `{ success: false, blocked: true, error: "Real desktop
      actions are not implemented in this build" }`. Active
      adapter remains `mock`.

## 12. Dry-run sandbox

- [ ] **Advanced → Safety → Real action sandbox → Create dry-run
      preview.** Inline preview card appears with action list
      (capped at 10), permission checklist (11 items), blocked
      reasons (7 items), and Confirm / Cancel buttons.
- [ ] Click **Confirm dry-run.** Logs:
      `Dry-run confirmed. No real actions executed.` then
      `Dry-run completed safely`.
- [ ] **No real cursor movement, no input arrives in any other
      application** during or after the confirm.
- [ ] Re-create the preview. Click **Cancel.** Log:
      `Dry-run cancelled`.
- [ ] DevTools console:
      `executeAction({type:'click',x:1,y:1,button:'left'},{executionMode:'real'})`
      returns `{ ok: false, mode: 'real', blocked: true, error:
      'Real desktop actions are disabled. Dry-run preview is
      available only.' }`.

## 13. No real clicks verification (mandatory)

This is the most important check on this page.

- [ ] Run any scenario for **60 seconds** while watching the OS
      cursor. **It must not move on its own.**
- [ ] Keep a text editor focused. **No characters or clicks
      arrive in it.**
- [ ] Open a system event log (e.g. `xev` on Linux, `Console.app`
      on macOS, `PowerShell -Get-WinEvent` on Windows) and
      confirm no synthetic input events are emitted by ClickFlow.
- [ ] Alt-tab to another app while a scenario is running.
      Confirm that focusing another app does not cause any input
      to land in ClickFlow's coordinates.

## 14. Quit / re-open

- [ ] While a scenario is running, attempt to close the window.
      A confirmation dialog appears.
- [ ] Cancel the dialog. App stays open. Quit again from the
      tray / menu after stopping. App quits cleanly.
- [ ] Relaunch the app from the OS launcher. Persistence
      survives (scenarios, settings, profiles).

## 15. Known packaged issues

Document any new packaged-only issue you discover while walking
this checklist:

- [ ] None observed on this build host. _(Otherwise, list each issue
      with platform, arch, and a brief description, then add a
      row to [`docs/RELEASE_BLOCKERS.md`](./RELEASE_BLOCKERS.md)
      → "Blockers" or "Non-blocking known issues".)_

---

## Sign-off

- **Date:** ____
- **Build host:** ____
- **Reviewer:** ____
- **Decision:**
  - [ ] Ready to publish `v0.1.0-beta`.
  - [ ] **NOT ready** — see new entries in
        `docs/RELEASE_BLOCKERS.md`.

If the decision is "Ready", proceed to
[`docs/TAG_AND_RELEASE_GUIDE.md`](./TAG_AND_RELEASE_GUIDE.md).
