# ClickFlow Desktop v1 Alpha QA Report

> Static + structural QA snapshot for the Desktop v1 Alpha
> (`v1.0.0-alpha.1`). Real coordinate click is **experimental,
> disabled by default, session-only, one click per fresh
> confirmation**. Real `image_click`/`text_click`, keyboard, scroll,
> hotkeys, repeats and batches remain disabled. The runtime,
> interactive checks below are filled in during **manual** QA
> (`docs/V1_ALPHA_MANUAL_TESTS.md`).

## Scope

- simulation mode
- dry-run mode
- real-coordinate mode
- Safety Center
- audit logs
- run summary
- packaging

## Environment

- OS: _____
- App version: `1.0.0-alpha.1` (release tag `v1.0.0-alpha.1`)
- Build type: _____ (dev / packed / dist)
- Date: _____

## Automated / static results

- `npm run smoke`: **PASS** (1600+ invariants, 0 failed) on the dev tree.
- RU/EN i18n parity: **PASS** (equal key counts).
- Forbidden dependencies (`robotjs`/`iohook`/`uiohook-napi`/`opencv`):
  **none present**.
- Electron security: `contextIsolation: true`, `nodeIntegration: false`,
  CSP unchanged: **PASS**.
- Default flags `realDesktopActions` / `realCoordinateClick` /
  `realImageClick` / `realTextClick` / `keyboardAutomation`: **false**.

## Test results

### simple_click simulation

Status: Not tested

### simple_click dry-run

Status: Not tested

### simple_click real-coordinate

Status: Not tested

### Safety gates

Status: Not tested

### Confirmation flow

Status: Not tested

### Audit logs

Status: Not tested

### Run summary

Status: Not tested

### Packaging

Status: Not tested

## Blockers

- None from automated/static checks. Manual real-coordinate QA on at
  least one target OS is required before tagging.

## Known issues

- The real desktop adapter native backend (`@nut-tree/nut-js`) is not a
  declared dependency in this build, so on a stock checkout the adapter
  reports **unavailable** and real clicks are blocked ("dependency not
  installed"). Dry-run and the safety blocking still work.

## Release recommendation

Release recommendation:
Ready for v1 alpha after manual real-coordinate QA.
