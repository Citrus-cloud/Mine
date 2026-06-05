# E2E QA Scenarios — Step 81

End-to-end test scenarios for ClickFlow Desktop.
All scenarios must pass before promoting to public beta (Step 83).

---

## Scenario 1 — Safety gate lifecycle

**Goal:** Verify the full safety gate open/close cycle.

1. Launch app — `canDispatchRealInput()` must be `false`.
2. Call `markReviewPassed()` — gate still closed (consent missing).
3. Call `recordConsent()` — gate now open.
4. Wait 16 s — gate closed again (consent expired).
5. Record consent again — gate open.
6. Call `activateEmergencyStop()` — gate closed, consent cleared.
7. Call `deactivateEmergencyStop()` — gate requires fresh consent to reopen.

**Expected:** Gate state matches at each step.

---

## Scenario 2 — image_click happy path

1. Open gate (markReviewPassed + recordConsent).
2. Call `imageClick({ templateId: 'test-tmpl' }, mockOkDispatch)`.
3. Assert result is DISPATCHED.
4. Assert consent cleared (second call → BLOCKED).
5. Assert `recordAction()` called (rate counter = 1).

---

## Scenario 3 — text_click happy path

1. Open gate.
2. Call `textClick({ query: 'Submit', caseSensitive: false }, mockOkDispatch)`.
3. Assert DISPATCHED, action = 'text_click'.
4. Assert consent cleared.

---

## Scenario 4 — Rate limit enforcement

1. Open gate, record consent before each action.
2. Dispatch 10 actions (refresh consent each time).
3. 11th dispatch → gate blocked by `rateLimitOk: false`.
4. Advance time by 61 s → gate open again.

---

## Scenario 5 — Emergency stop mid-session

1. Open gate, begin dispatching.
2. Mid-dispatch: `activateEmergencyStop()`.
3. Next dispatch → BLOCKED (`emergencyStopClear: false`).
4. Deactivate + re-consent → dispatch resumes.

---

## Scenario 6 — Adapter error handling

1. Open gate.
2. `imageClick` with adapter returning `{ ok: false, error: 'hw_error' }` → ERROR.
3. `imageClick` with adapter throwing → ERROR (exception caught).
4. Consent NOT cleared on error (gate still open for retry).

---

## Scenario 7 — Localization switcher (ru/en)

1. Set locale to `ru`.
2. Safety gate labels display in Russian (from `i18n-ru-smartclick.js`).
3. Switch to `en` — labels revert.
4. No missing key warnings in console.

---

## Scenario 8 — Android / Desktop parity smoke

| Test | Android | Desktop |
|------|---------|----------|
| Template add | `TemplateManager.add` | template-manager.js |
| Region normalize | `CaptureRegion.isValid` | region-selector.js |
| OCR find text | `OcrController.findText` | ocr-provider-interface.js |
| Safety gate | `SafetyGate` 4 flags | `real-input-safety-review.js` |
| Emergency stop | `SmartSessionEmergencyStop` | `activateEmergencyStop()` |

All rows must produce equivalent results for identical inputs.
