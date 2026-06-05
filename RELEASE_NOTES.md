# Release Notes — ClickFlow Desktop

## v1.0.0-alpha.1 (Step 79)

**Phase 4 complete — smart click with safety gate.**

This release introduces real `image_click` and `text_click` dispatch under
a four-check safety gate. All prior Phase 1–3 features (OCR, template
matching, visual scenario builder, region selector, audit log) are included.

### What's new

- **Safety review gate** (`real-input-safety-review.js`):
  reviewPassed + consentFresh (15 s TTL) + rateLimitOk (≤10/min) +
  emergencyStopClear. `evaluateGate()` / `canDispatchRealInput()`.
- **Real smart click** (`real-smart-click.js`):
  `imageClick(request, adapterDispatch)` and
  `textClick(request, adapterDispatch)` — injected adapter, one-use consent,
  rate recording, full `ClickResultStatus` enum.
- **30 new automated tests** across Steps 77–78 (Node.js, no external deps).

### Known limitations (alpha)

- `adapterDispatch` must be wired by the caller; no default robot adapter
  ships in this release.
- E2E hardware dispatch (mouse move + click) is not yet connected to the UI
  consent flow.
- Localization covers en-US only.

### Upgrade notes

First alpha release — no migration required.

---

## v1.0.0-alpha.0 and earlier — see CHANGELOG.md
