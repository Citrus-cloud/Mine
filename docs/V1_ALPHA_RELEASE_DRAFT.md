# ClickFlow Desktop v1 Alpha

> Paste this into the GitHub Release editor. **Mark as pre-release
> (alpha).** Suggested tag: `v1.0.0-alpha.1`.

## Summary

ClickFlow Desktop **v1 Alpha** adds the first **experimental** real
desktop action — a single **coordinate click** — behind a hard safety
gate. ClickFlow remains **simulation-only by default**; real input only
happens after an explicit session enable and a fresh per-click
confirmation. This is an **alpha pre-release** for testing the safety
flow.

## Highlights

- Real coordinate click (alpha) for `simple_click`, one click per
  confirmation.
- Execution mode selector: simulation / dry-run / real-coordinate.
- Safety Center "Scenario real run readiness", audit logs, run
  summaries.
- Smart visual features remain available (simulation-only).

## Safety model

- All real flags default `false`; session-only, never persisted.
- Default-deny safety gate + renderer pre-flight + main re-validation.
- `contextIsolation: true`, `nodeIntegration: false`, CSP unchanged.

## Real coordinate click alpha

- Experimental, disabled by default, session-only.
- `repeatCount` must be `1`; one click per fresh confirmation.
- Requires session enabled + safe mode + emergency stop + audit logs +
  adapter available + gate passed.

## Smart visual features

Screen Capture, Region Selector, Templates, Template Matching,
`image_click` simulation, mock / session Tesseract OCR, `text_click`
simulation, Visual Builder, Scenario Presets — all simulation-only.

## What is disabled

- Real `image_click` / `text_click`, keyboard, scroll, hotkey
  automation.
- Repeat / batch real clicks, background/hidden clicks.
- Captcha / anti-bot bypass, ad-click, banking / protected-app
  automation.
- No `robotjs` / `iohook` / `uiohook-napi` / OpenCV. No mobile.

## Installation

Download the artifact for your OS (Windows NSIS / macOS DMG / Linux
AppImage), or run from source: `npm install` → `npm start`.

## Testing

Follow `docs/V1_ALPHA_MANUAL_TESTS.md` and
`docs/V1_ALPHA_RELEASE_CHECKLIST.md`.

## Known limitations

Real adapter native backend is not bundled — without it the real click
is blocked ("dependency not installed"); dry-run and blocking still
work. Manual packaged-app QA is required before relying on a build.

## Feedback

Use the GitHub issue templates (bug / feature / safety).

## Security note

This alpha can perform a real mouse click once enabled + confirmed.
Do not use it against captcha/anti-bot systems, ads, or
banking/payment/protected applications. Prohibited automation is out of
scope permanently.
