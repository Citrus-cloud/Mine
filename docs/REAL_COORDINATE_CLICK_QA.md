# ClickFlow — Real Coordinate Click QA Checklist (Step 48)

> Manual QA for the stabilized coordinate-click prototype. Real clicks
> are disabled by default and session-only. Read
> `docs/REAL_CLICK_TESTING_GUIDE.md` first.

## Build / launch

- [ ] `npm install` succeeds.
- [ ] `npm run smoke` passes (0 failures) and performs **no** real click.
- [ ] `npm start` launches the app; **no** real click happens at start.

## Safety Center

- [ ] **Advanced → Safety Center** opens.
- [ ] Real adapter prototype card shows **real mode disabled by default**
      (badges: Default real actions: disabled; Session real coordinate:
      disabled; One click per confirmation; image/text real click:
      disabled; keyboard automation: disabled).

## Dry-run

- [ ] **Test dry-run coordinate click** shows a preview (`realClick=false`)
      and performs **no** input.

## Blocking without session

- [ ] With the session **not** enabled, a real click is blocked
      (no "Test real coordinate click" execution; reason shown).

## Enable session (confirmation required)

- [ ] **Enable real coordinate click for this session** opens a modal.
- [ ] The Enable button is disabled until the "I understand … session
      only" checkbox is ticked.

## Real click (fresh confirmation required)

- [ ] **Test real coordinate click** opens its own confirmation modal
      showing coordinates, button, warnings, emergency-stop shortcut.
- [ ] Confirm is disabled until "I confirm this single coordinate click."
      is ticked.
- [ ] **One click only** — a second real click requires a **new**
      confirmation (confirmation is never reused).

## Repeat / batch blocked

- [ ] Repeat real clicks blocked (`repeatCount > 1` → blocked).
- [ ] Batch real clicks blocked (array of actions → blocked).

## Out-of-scope blocked

- [ ] `image_click` real mode blocked.
- [ ] `text_click` real mode blocked.
- [ ] Keyboard automation unavailable / blocked.

## Audit & emergency stop

- [ ] Audit log records blocked **and** executed events
      (`realCoordinate.click.blocked` / `.executed`, confirmation,
      session, safetyCheck events).
- [ ] Emergency stop required: with emergency stop disabled, a real
      click is blocked (`emergencyStop.notReadyBlockedRealAction`).

## Adapter unavailable

- [ ] With no native backend installed, the adapter reports
      **unavailable**, "Test real coordinate click" is disabled, and the
      reason ("dependency not installed") is shown. Dry-run still works.

## Invariants

- [ ] `realDesktopActions` / `realCoordinateClick` / `realImageClick` /
      `realTextClick` default false.
- [ ] After restart, all real flags are false again (session not
      persisted).
- [ ] `contextIsolation:true`, `nodeIntegration:false`, CSP unchanged.
- [ ] No `robotjs`/`iohook`/`uiohook-napi`/`opencv`.
