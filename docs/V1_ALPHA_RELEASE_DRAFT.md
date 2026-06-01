# ClickFlow Desktop v1 Alpha

> Paste this into the GitHub Release editor. **Mark as pre-release
> (alpha).**
>
> **Title:** ClickFlow Desktop v1 Alpha
> **Tag:** `v1.0.0-alpha.1`

## Summary

ClickFlow Desktop **v1 Alpha** adds the first **experimental** real
desktop action — a single **coordinate click** — behind a hard safety
gate. ClickFlow remains **simulation-only by default**; real input only
happens after an explicit session enable and a fresh per-click
confirmation. This is an **alpha pre-release** for testing the safety
flow, not for production automation.

## Highlights

- Real coordinate click (alpha) for `simple_click`, one click per fresh
  confirmation.
- Execution mode selector: simulation / dry-run / real-coordinate.
- Safety Center "Scenario real run readiness", audit logs, run
  summaries, permission readiness, diagnostics.
- Smart visual features remain available (simulation-only).

## Real coordinate click alpha

- **Experimental** and **disabled by default**.
- **Session-only** — never persisted; resets on restart and after each
  real run.
- **Fresh confirmation required** — confirmation is never reused.
- **One click per confirmation**; **repeat real clicks are blocked**
  (`repeatCount` must be `1`).
- Requires: session enabled + safe mode + emergency stop + audit logs +
  adapter available + safety gate passed.

## Safety model

- All real flags default `false` (`realDesktopActions`,
  `realCoordinateClick`, `realImageClick`, `realTextClick`,
  `keyboardAutomation`).
- Default-deny safety gate + renderer pre-flight + main re-validation.
- Real input only in the main process via a narrow adapter; the
  renderer never performs input.
- `contextIsolation: true`, `nodeIntegration: false`, CSP unchanged.

## Smart visual features

Screen Capture, Region Selector, Templates, Template Matching Preview,
`image_click` simulation, `text_click` simulation, Visual Builder,
Scenario Presets — all **simulation-only**.

## OCR notes

OCR has a mock engine (default) and an **optional** session-scoped real
Tesseract provider. **OCR never clicks.** `text_click` consumes OCR
output to build a *simulated* action only. Real OCR depends on local
system/network/language data and is opt-in per session.

## What works

- `simple_click` simulation (including `repeatCount > 1`).
- `simple_click` dry-run preview.
- One real coordinate click (alpha), when a native backend is installed.
- All smart visual features (simulation-only).
- Safety Center, audit logs, run summaries, permissions, diagnostics,
  import/export, profiles.

## What is intentionally disabled

- Real `image_click` and real `text_click`.
- Keyboard automation, scroll automation, hotkey automation.
- Repeat real clicks (> 1), batch real clicks, background/hidden clicks.
- Captcha / anti-bot bypass, ad-click automation, banking / payment /
  protected-application automation. **Out of scope permanently.**
- No `robotjs` / `iohook` / `uiohook-napi` / OpenCV.
- **Mobile version is not included.**

## Installation from source

```bash
npm install
npm start
```

## Packaged builds

Download the artifact for your OS — Windows NSIS, macOS DMG, or Linux
AppImage — produced by `npm run pack` / `npm run dist`. macOS DMGs are
not notarized and Windows installers are not signed in alpha; the OS
may warn on first launch.

## Testing notes

Follow `docs/V1_ALPHA_MANUAL_TESTS.md` and
`docs/V1_ALPHA_PRE_RELEASE_CHECKLIST.md`; record results in
`docs/V1_ALPHA_QA_REPORT.md`. Quick path: `npm install` →
`npm run smoke` → `npm start` → Advanced → Safety Center.

## Known limitations

The real adapter native backend is not bundled — without it the real
click is blocked ("dependency not installed") while dry-run and the
safety blocking still work. Manual packaged-app QA on at least one OS is
required before relying on a build.

## Feedback

Use the GitHub issue templates (bug / feature / safety).

## Security note

This alpha can perform a **real** mouse click once enabled + confirmed.
Do not use it against captcha/anti-bot systems, ads, or
banking/payment/protected applications. Prohibited automation is out of
scope permanently.
