# Changelog — ClickFlow Desktop (Mine)

All notable changes are documented here.

## [Unreleased]

### Step 77 — Desktop real-input safety review

Phase 4 begins. Added `src/real-input-safety-review.js` — the single source of
truth for the desktop real-input gate before `image_click` / `text_click` can
be dispatched (Step 78).

- Four independent checks (all must pass for `canDispatchRealInput()` = true):
  - **REVIEW_PASSED** — human sign-off via `markReviewPassed()`.
  - **CONSENT_FRESH** — per-action consent via `recordConsent()`, TTL 15 s.
  - **RATE_LIMIT_OK** — rolling 1-min window, max 10 real actions.
  - **EMERGENCY_STOP_CLEAR** — `activateEmergencyStop()` blocks immediately
    and also clears pending consent; `deactivateEmergencyStop()` re-opens.
- `evaluateGate()` returns `{ allowed, failedChecks[], checks{} }`.
- `canDispatchRealInput()` convenience boolean.
- `recordAction()` updates the rate-limit rolling window (called post-dispatch in Step 78).
- `setNowProvider(fn)` for clock injection in tests.
- `_resetForTest()` resets all state.
- New `tests/real-input-safety-review.test.js` — 15 Node.js tests (no deps):
  gate closed by default, markReviewPassed, revokeReview, recordConsent fresh,
  consent expires at TTL, clearConsent, rate OK initially, rate exceeded at MAX,
  rate resets after window, E-stop blocks, E-stop clears consent, deactivate
  E-stop, canDispatch false when check fails, canDispatch true all pass,
  failedChecks lists only failures.
- Run tests: `node tests/real-input-safety-review.test.js`.

### Step 51 and earlier — see git history
