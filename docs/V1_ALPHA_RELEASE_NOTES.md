# ClickFlow Desktop v1 Alpha — Release Notes

## Summary

ClickFlow Desktop **v1 Alpha** (`v1.0.0-alpha.1`) introduces the first
**experimental** real desktop action — a single **coordinate click** —
behind a hard safety gate. By default ClickFlow is still
**simulation-only**: nothing performs real input unless the user
explicitly enables a session and confirms each click. This is a
**pre-release (alpha)** for testing the safety flow, not for production
automation.

## What is new

- A `simple_click` scenario can run **one** real coordinate click via a
  runtime execution mode (`simulation` | `dry-run` | `real-coordinate`),
  default `simulation`.
- Safety Center "Scenario real run readiness" with an execution-mode
  selector, readiness checks, per-run confirmation, and an automatic
  reset to simulation after a real run.
- v1 Alpha QA + release documentation.

## Real coordinate click alpha

- **Experimental** and **disabled by default**.
- **Session-only** — enabling is never persisted and resets on restart.
- **One click per fresh confirmation** — confirmation is never reused;
  `repeatCount` must be `1`.
- Requires: session enabled, safe mode, emergency stop ready, audit
  logs ready, adapter available, safety gate passed.
- Real input happens only in the main process via a narrow adapter; the
  renderer never performs input.

## Safety model

Defense in depth: feature flags (all real flags default `false`),
safety gates (`getRealCoordinateClickGateStatus`, default-deny), the
renderer action-pipeline pre-flight, and main-process re-validation.
"When in doubt, block." `contextIsolation: true`,
`nodeIntegration: false`, CSP unchanged.

## What works

- Simulation mode (with `repeatCount > 1`), dry-run mode.
- Smart visual features: Screen Capture, Region Selector, Templates,
  Template Matching, `image_click` simulation, mock / session Tesseract
  OCR, `text_click` simulation, Visual Builder, Scenario Presets.
- Safety Center, permissions checklist, audit logs, run summaries.
- One real coordinate click (when a native backend is installed).

## What is intentionally disabled

- Real `image_click` and real `text_click`.
- Keyboard automation, scroll automation, hotkey automation.
- Repeat real clicks (> 1), batch real clicks, background/hidden clicks.
- Captcha / anti-bot bypass, ad-click automation, banking / payment /
  protected-application automation. **Out of scope permanently.**
- No `robotjs` / `iohook` / `uiohook-napi` / OpenCV. No mobile build.

## How to test

See `docs/V1_ALPHA_MANUAL_TESTS.md` and
`docs/V1_ALPHA_RELEASE_CHECKLIST.md`. Quick path: `npm install` →
`npm run smoke` → `npm start` → Advanced → Safety Center.

## Known limitations

- The real adapter native backend is not bundled; without it the real
  click is blocked ("dependency not installed") while dry-run and
  blocking still work.
- Manual packaged-app QA on at least one OS is required before
  tagging.

## Safety warning

This alpha can perform a **real** mouse click at a screen coordinate
once you enable the session and confirm. Never test over banking,
payment, or other protected applications. Keep the emergency stop
(Escape / `Ctrl+Alt+E`) in mind.

## Feedback

- Bug: `.github/ISSUE_TEMPLATE/bug_report.md`
- Feature request: `.github/ISSUE_TEMPLATE/feature_request.md`
- Safety concern: `.github/ISSUE_TEMPLATE/safety_report.md`
