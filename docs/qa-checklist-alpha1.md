# QA Checklist — v1.0.0-alpha.1

This checklist must be completed before tagging `v1.0.0-alpha.1`.

## Safety gate

- [ ] `node tests/real-input-safety-review.test.js` — all 15 tests pass.
- [ ] Gate closed by default (no review pass, no consent, no E-stop armed).
- [ ] `canDispatchRealInput()` returns `false` until all four checks explicitly set.
- [ ] Emergency stop fires within one event-loop turn; clears consent.
- [ ] Consent expires exactly at `CONSENT_TTL_MS` (15 s) boundary.
- [ ] Rate limiter resets correctly after rolling 60 s window.

## Real click dispatch

- [ ] `node tests/real-smart-click.test.js` — all 15 tests pass.
- [ ] `imageClick` blocked when `templateId` is empty / null.
- [ ] `textClick` blocked when `query` is empty / null.
- [ ] One-use consent: second call immediately after dispatch returns BLOCKED.
- [ ] Adapter error propagated as `ClickResultStatus.ERROR`.
- [ ] Adapter exception caught and returned as `ClickResultStatus.ERROR`.

## Integration smoke test (manual)

- [ ] App launches without JS errors.
- [ ] Safety Center UI reflects gate state in real time.
- [ ] E-stop button in UI triggers `activateEmergencyStop()` and blocks further dispatch.
- [ ] Consent dialog sets `recordConsent()` and is consumed after one action.
- [ ] Rate-limit badge updates after each dispatch.

## Regression

- [ ] OCR provider loads (stub or Tesseract).
- [ ] Template manager CRUD — add / edit / delete template.
- [ ] Region selector draws and commits region correctly.
- [ ] Visual builder — add / remove / reorder actions.
- [ ] Scenario presets — TAP_CENTER and TAP_AND_WAIT load without error.

## Release

- [ ] `package.json` version = `1.0.0-alpha.1`.
- [ ] `RELEASE_NOTES.md` entry written.
- [ ] Git tag `v1.0.0-alpha.1` created on HEAD.
- [ ] GitHub Release draft created with release notes.
