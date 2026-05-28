# ClickFlow 0.1.0-beta — Pre-Release Checklist

The maintainer ticks every box on this page **manually** before
running the commands in
[`RELEASE_TAG_PLAN.md`](./RELEASE_TAG_PLAN.md). One copy of this
checklist is filled per release — paste it into the release PR
or attach it to the maintainer notes.

> **Skipped boxes block the tag.** If a box cannot be ticked
> right now, record the reason in
> [`RELEASE_BLOCKERS.md`](./RELEASE_BLOCKERS.md) and stop.

---

## Repo / build host

- [ ] Repository is clean (`git status` reports
      `nothing to commit, working tree clean`).
- [ ] On `main`, fast-forwarded from `origin/main`.
- [ ] All step-24 PRs are merged.
- [ ] Build host can produce installers / images for at least
      one target OS (Windows for NSIS, macOS for DMG, Linux for
      AppImage).

## Static smoke

- [ ] `npm install` completes without errors.
- [ ] `npm run smoke` exits **0** with `Failed: 0`.
- [ ] No new warnings from `node --check` for any modified file.
- [ ] `package.json → version` is `0.1.0` (the `-beta` qualifier
      is on the tag, not the runtime version).

## Run from source

- [ ] `npm start` opens the app window without console errors.
- [ ] Main screen renders (Simulation mode badge, version
      badge, status / scenario / progress cards, Start / Stop
      buttons, footer).

## Manual main flow (run from source first)

- [ ] **Scenario CRUD** — create / edit / delete a custom
      scenario; default scenario cannot be deleted; persistence
      survives quit + relaunch.
- [ ] **Simulation Start / Stop** — Start fills progress, log
      entries appear, status indicator pulses; Stop returns to
      Stopped. **No real cursor movement, no input arrives in
      any other application.**
- [ ] **Emergency Stop** — `Escape` aborts the run; the global
      `CmdOrCtrl+Alt+E` aborts when ClickFlow is not focused.
- [ ] **RU / EN** — Settings → English → Save updates the UI
      immediately and persists across restart.
- [ ] **Theme** — Light / Dark / System switch is consistent.
- [ ] **Advanced dashboard** cycles through all 7 tabs without
      console errors.
- [ ] **Diagnostics** — `Copy diagnostics` contains
      `Simulation only: true`, `Sandbox: realActionsAllowed=false`,
      `Adapter: active=mock, ...realActionsAllowed=false`,
      `Release: ..., readyAfterManualQa=true`.
- [ ] **Mock adapter self-test** — logs
      `Adapter self-test passed (4/4)`.
- [ ] **Dry-run sandbox** — Create dry-run preview shows the
      action list, permission checklist, blocked reasons.
      Confirm dry-run logs
      `Dry-run confirmed. No real actions executed.`
      followed by `Dry-run completed safely`.
- [ ] **Import / export** — round-trip works for scenarios
      and settings.
- [ ] **Profiles** — selection persists; default + work +
      testing + personal are present.

## Packaged app

- [ ] `npm run pack` succeeds on the build host.
- [ ] `npm run dist` succeeds on the build host.
- [ ] `dist/` contains only the expected installer / image
      (no `node_modules/.cache`, no `*.broken-*`, no nested
      `dist/`).
- [ ] Smoke-launch the produced binary on the target OS and
      walk every section in
      [`PACKAGED_APP_QA.md`](./PACKAGED_APP_QA.md), including
      section 13 (No real clicks verification, mandatory).

## Safety invariants — re-check on the packaged binary

- [ ] **No real clicks happen.** Cursor stays put for at least
      60 seconds while any scenario runs; no input arrives in a
      focused text editor; no synthetic input events appear in
      the OS event log.
- [ ] DevTools (or the in-app diagnostics) reports the six
      safety layers all blocking real input:
      `realDesktopActions=false`,
      `isRealActionAllowed=false`,
      `isRealAdapterAllowed=false`,
      `setActiveAdapter("real-desktop")` blocked,
      `executeAction({...},{executionMode:"real"})` blocked,
      `evaluateRealActionReadiness().allowed=false`.
- [ ] `package.json` declares no `robotjs` / `nut.js` /
      `iohook` / `uiohook-napi` / `node-key-sender`.

## Documentation freshness

- [ ] `README.md` references step 24 / `0.1.0-beta`.
- [ ] `PROJECT_CONTEXT.md` references step 24.
- [ ] `RELEASE_NOTES.md` references step 24 and the simulation-
      only contract.
- [ ] `CHANGELOG.md` has the step-24 entry.
- [ ] `docs/GITHUB_RELEASE_DRAFT.md` body is finalized and
      ready to paste.
- [ ] `docs/KNOWN_LIMITATIONS.md` is consistent with the
      release notes.
- [ ] `docs/RELEASE_BLOCKERS.md` Release decision = **Ready**;
      no active rows in the Blockers table.

## Sign-offs

- [ ] [`PACKAGED_APP_QA.md`](./PACKAGED_APP_QA.md) sign-off line
      filled (date / build host / reviewer / decision).
- [ ] [`RELEASE_FINAL_CHECK.md`](./RELEASE_FINAL_CHECK.md)
      sign-off line filled.

## Pre-release flag

- [ ] The GitHub Release will be marked **Pre-release** when
      published. (Confirmed in advance; the maintainer must not
      forget to tick the box on the release form.)

---

## Result

- [ ] **All boxes ticked.** Proceed to
      [`RELEASE_TAG_PLAN.md`](./RELEASE_TAG_PLAN.md).
- [ ] **One or more boxes unticked.** Stop. Record the reason
      in [`RELEASE_BLOCKERS.md`](./RELEASE_BLOCKERS.md) and
      reschedule.

**Maintainer:** ____ **Date:** ____ **Decision:** Proceed /
Stop.
