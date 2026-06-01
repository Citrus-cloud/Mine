# ClickFlow Desktop v1 Alpha Final Summary

> Single-page snapshot the maintainer signs off before tagging
> `v1.0.0-alpha.1`. Tag and publication are **manual** — see
> `docs/V1_ALPHA_TAG_PLAN.md`.

## Release

- Target: `v1.0.0-alpha.1`
- Type: Alpha / Pre-release
- Mode: Desktop v1 alpha (simulation-only by default)
- `package.json` version: `1.0.0-alpha.1`

## Included

- simple_click simulation
- simple_click dry-run
- real coordinate click alpha
- Screen Capture
- Region Selector
- Template Assets
- Template Matching Preview
- image_click simulation
- OCR mock
- optional Tesseract session OCR, if available
- text_click simulation
- Visual Builder
- Scenario Presets
- Safety Center
- Audit logs
- Permission readiness
- Diagnostics
- Import/export
- Profiles

## Real coordinate click alpha

- Disabled by default
- Session-only
- Fresh confirmation required
- One click per confirmation
- repeatCount > 1 blocked
- Audit logged
- Emergency Stop required
- Safety gates required

## Intentionally disabled

- real image_click
- real text_click
- keyboard automation
- scroll automation
- hotkey automation
- batch real clicks
- background/hidden clicks
- captcha/anti-bot/ad click/banking/protected apps automation
- mobile version

## Safety model

- contextIsolation true
- nodeIntegration false
- CSP not weakened
- action-pipeline blocks unsupported real actions
- realDesktopActions false by default
- realCoordinateClick false by default

## Required before publishing

- npm install
- npm run smoke
- npm start
- npm run pack
- npm run dist
- manual v1 alpha QA (`docs/V1_ALPHA_MANUAL_TESTS.md`)
- packaged app QA (`docs/PACKAGED_APP_QA.md`)
- verify no prohibited dependencies
- verify no real click without explicit confirmation

## Release recommendation

Ready for Desktop v1 Alpha pre-release after final manual packaged-app QA.

---

**Maintainer sign-off (fill at release time):**

- Date: ____
- Platform(s) walked: ____
- Reviewer: ____
- Decision: Ready / Not ready
