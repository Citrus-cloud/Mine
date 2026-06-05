# Changelog — ClickFlow Desktop (Mine)

All notable changes are documented here.

## [Unreleased]

### Step 78 — Real image_click + text_click under safety gate

- New `src/real-smart-click.js` — wraps real-desktop-adapter dispatch:
  - `imageClick(request, adapterDispatch)` — 5-step protocol: gate → validate
    templateId → dispatch → `_postDispatch()` (clearConsent + recordAction) → result.
  - `textClick(request, adapterDispatch)` — same protocol, validates `query`.
  - `ClickResultStatus { DISPATCHED, BLOCKED, ERROR }`.
  - Injected `adapterDispatch(payload)` → `{ ok, error? }` for testability.
  - Both clear consent after one successful dispatch (one-use consent).
- New `tests/real-smart-click.test.js` — 15 Node.js tests (no deps):
  imageClick: gate closed, invalid/empty templateId, null request, dispatched,
  adapter error, adapter throw, consent one-use, rate recorded, regionHint
  forwarded. textClick: gate closed, empty query, dispatched, caseSensitive
  forwarded, adapter error, consent one-use.
- Run: `node tests/real-smart-click.test.js`

### Step 77 — Desktop real-input safety review
- `real-input-safety-review.js` — 4-check gate. 15 tests.

### Step 51 and earlier — see git history
