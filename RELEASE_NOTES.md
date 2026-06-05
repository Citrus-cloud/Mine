# Release Notes — ClickFlow Desktop

## v1.0.0 🏁 (Step 84 — Final Release)

**ClickFlow Desktop v1.0.0 is the first stable release.**

### What’s included

#### Safety gate (Step 77)
- Four independent checks: `reviewPassed`, `consentFresh` (15 s TTL),
  `rateLimitOk` (≤10/min rolling window), `emergencyStopClear`.
- `evaluateGate()` → `{ allowed, failedChecks[], checks{} }`.
- `canDispatchRealInput()` convenience boolean.
- Emergency stop fires synchronously; clears consent.

#### Real smart click (Step 78)
- `imageClick(request, adapterDispatch)` — image-template based click.
- `textClick(request, adapterDispatch)` — OCR text-based click.
- One-use consent model; rate counter updated on success.
- `ClickResultStatus { DISPATCHED, BLOCKED, ERROR }`.

#### Parity & l10n (Step 80)
- Full Android ↔ Desktop feature parity (16 feature groups).
- Russian UI strings for all Phase 3–4 features.

#### Documentation (Step 82)
- Desktop user guide + Android companion guide (en + ru).
- E2E QA scenarios (8 scenarios, 12 automated tests).
- Beta readiness checklist.

### Test coverage

| Suite | Tests |
|-------|-------|
| Safety review (Step 77) | 15 |
| Real smart click (Step 78) | 15 |
| E2E runner (Step 81) | 12 |
| **Total desktop** | **42** |
| Android JVM (Steps 64–76) | 93+ |

### Known limitations

- `adapterDispatch` must be wired by the host application; no default
  robot adapter ships in this release (platform-specific).
- E2E hardware dispatch (mouse move + click) requires host wiring.
- Android real-tap `dispatchGesture` is behind the safety gate
  (gate opens only when all four Android flags are set).

### Upgrade from alpha.1

No data migration required. `package.json` version: `1.0.0`.

---

## v1.0.0-alpha.1 (Step 79) — see CHANGELOG.md
