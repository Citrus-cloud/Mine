# ClickFlow — Real Coordinate Click Stabilization (Step 48)

> **Status:** Stabilization + safety QA of the Step 47 coordinate-click
> prototype. **No new real action types were added.** Real clicks stay
> **disabled by default**, **session-only**, **one click per
> confirmation**. ClickFlow is simulation-only by default
> (`realDesktopActions:false`, `realCoordinateClick:false`,
> `simulationOnly:true`, `contextIsolation:true`,
> `nodeIntegration:false`, CSP unchanged).

## Purpose

Harden and QA the single real coordinate-click path: stronger gates,
fresh per-click confirmation, better emergency-stop handling, richer
audit events and diagnostics, and a clear manual QA checklist — without
expanding real actions beyond a coordinate click.

## Current status

- Coordinate click only. image/text real clicks, keyboard, scroll,
  hotkeys, loops, batches, and background automation are blocked.
- The optional native backend (`@nut-tree/nut-js`/`nut-js`) is **not**
  a declared dependency; absent backend ⇒ adapter **unavailable** and
  every real click is blocked with a clear reason. The app never
  crashes.

## One click per confirmation

Every real click requires its **own** fresh confirmation. Confirmation
is never stored or reused. Repeats (`repeatCount > 1`) and batches
(arrays of actions) are blocked in the renderer pipeline **and**
re-checked in the main process.

## Feature flags

Frozen defaults: `realDesktopActions:false`, `realCoordinateClick:false`,
`realImageClick:false`, `realTextClick:false`, `keyboardAutomation:false`,
`simulationOnly:true`. Runtime-togglable (session-only, never
persisted): `realDesktopActions`, `realCoordinateClick` (plus the OCR
flags). `realImageClick`, `realTextClick`, `keyboardAutomation`, and any
key/scroll/hotkey real action are **not** togglable; an attempt returns
`flagNotRuntimeTogglable` and is audited. `isRealCoordinateClickSessionEnabled()`
is true only when both umbrella + per-action flags are on.

## Safety gates

`getRealCoordinateClickGateStatus(settings, flags, permissions,
adapterStatus, context)` (default-deny) requires: both session flags,
`safeMode`, emergency stop, audit logs, adapter available, permissions
not missing, user confirmation, one click per confirmation, action type
`click` only, no batch, no repeat, no image/text real, no keyboard.
The renderer pipeline (`getRealDesktopActionBlockReason`) and the main
adapter re-validate independently.

## Confirmation flow

1. Enable session → modal with "I understand … session only" checkbox.
2. Each real click → modal showing coordinates, button, current mode,
   warnings, prohibited use cases, emergency-stop shortcut, and a
   "I confirm this single coordinate click." checkbox.
3. Only then is `context.userConfirmed`/`oneClickOnly` set and the
   action sent to the pipeline → main.

## Audit events

`feature.flag.toggle.rejected`, `emergencyStop.status.checked`,
`emergencyStop.requiredForRealAction`,
`emergencyStop.notReadyBlockedRealAction`,
`realCoordinate.session.enable.requested` / `.enabled` / `.disabled`,
`realCoordinate.safetyCheck.started` / `.passed` / `.failed`,
`realCoordinate.confirmation.requested` / `.accepted` / `.cancelled`,
`realCoordinate.click.requested` / `.executed` / `.blocked`,
`realCoordinate.adapter.unavailable`,
`realCoordinate.unsupportedAction.blocked`. No screenshots, base64,
paths, or PII.

## Emergency Stop

Escape and `CmdOrCtrl+Alt+E` remain active. Emergency-stop readiness is
checked before every real click; if not ready, the click is blocked
(`emergencyStop.notReadyBlockedRealAction`). Only one click runs per
confirmation, so there is no loop to interrupt.

## Adapter unavailable behavior

When the backend is absent the adapter returns
`{ success:false, blocked:true, reason:"Real desktop adapter
dependency is unavailable" }`. The UI disables "Test real coordinate
click" and shows the reason; dry-run and blocking still work.

## Testing checklist

See `docs/REAL_COORDINATE_CLICK_QA.md`.

## What remains disabled

Real `image_click`/`text_click`, keyboard/scroll/hotkey real actions,
repeats/batches/loops, background/hidden clicks. Permanently
prohibited: captcha/anti-bot bypass, ad-click automation,
banking/payment/protected-app automation. No `robotjs`/`iohook`/
`uiohook-napi`/`opencv`. No mobile.
