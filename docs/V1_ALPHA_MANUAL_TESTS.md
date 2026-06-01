# ClickFlow Desktop v1 Alpha Manual Tests

> Manual QA walkthrough for `v1.0.0-alpha.1`. Real coordinate click is
> experimental, disabled by default, session-only, one click per fresh
> confirmation. Mark each item PASS / FAIL with notes.

## 1. Install and smoke

- [ ] `npm install`
- [ ] `npm run smoke` (0 failures; performs no real click)
- [ ] `npm start`

## 2. Simulation mode

- [ ] Create a `simple_click` scenario.
- [ ] `repeatCount > 1` works in simulation.
- [ ] Progress / logs correct; no real cursor movement.

## 3. Dry-run mode

- [ ] Select **Dry-run** execution mode.
- [ ] Run a `simple_click`.
- [ ] No real click happens.
- [ ] Action preview shown; progress completes.

## 4. Real mode default blocked

- [ ] App starts with real mode **disabled**.
- [ ] `realCoordinateClick` disabled.
- [ ] `realDesktopActions` disabled.
- [ ] A real run is blocked before session enable.

## 5. Session enable

- [ ] Safety Center opens.
- [ ] Enabling requires the "I understand … session only" confirmation.
- [ ] Session-only warning visible.
- [ ] Disabled actions (image/text/keyboard) visible.

## 6. Real coordinate click

- [ ] `repeatCount` must be 1.
- [ ] Fresh confirmation required.
- [ ] One click performed (if backend installed).
- [ ] Confirmation reset after the click.
- [ ] Execution mode returns to simulation.

## 7. Blocking tests

- [ ] `repeatCount > 1` blocked (message suggests simulation / set to 1).
- [ ] `image_click` real blocked.
- [ ] `text_click` real blocked.
- [ ] Keyboard blocked / unavailable.
- [ ] Adapter unavailable handled safely (clear reason; no crash).

## 8. Emergency Stop

- [ ] Status visible.
- [ ] Real action blocked if emergency stop not ready.

## 9. Audit logs

- [ ] Blocked event logged.
- [ ] Executed event logged.
- [ ] No screenshot / base64 / private path logged.

## 10. Run summary

- [ ] Blocked summary correct (`realActionsPerformed: false`).
- [ ] Executed summary correct (`realActionsPerformed: true`,
      `executionMode: "real-coordinate"`, x/y/button).

## 11. Packaging

- [ ] `npm run pack`
- [ ] `npm run dist`
- [ ] Packaged app opens.
- [ ] The same checks (2–10) pass in the packaged app.
