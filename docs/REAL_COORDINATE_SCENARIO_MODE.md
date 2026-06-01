# ClickFlow — Real Coordinate Click Scenario Mode (Step 49)

> **Status:** A `simple_click` scenario may run **one** real coordinate
> click, but only through the strict safety flow. Real mode is
> **disabled by default**, **session-only**, **one click per fresh
> confirmation**. Real `image_click`/`text_click`, keyboard, scroll,
> hotkeys, repeats and batches remain disabled. Default invariants:
> `realDesktopActions:false`, `realCoordinateClick:false`,
> `simulationOnly:true`, `contextIsolation:true`,
> `nodeIntegration:false`, CSP unchanged.

## Purpose

Let the user run a single `simple_click` scenario as a real coordinate
click — reusing the Step 47/48 hardened adapter, gate, and confirmation
— without expanding real actions to any other scenario type.

## Current status

- Execution mode is a **runtime-only** run option held in app-state
  (`simulation` | `dry-run` | `real-coordinate`); default `simulation`.
  It is **not** stored in a scenario and resets to `simulation` on
  reload and after every real run.
- `real-coordinate` is offered only when the active scenario is
  `simple_click`, `repeatCount === 1`, the session is enabled, the
  adapter is available, emergency stop + audit logs are ready, and the
  safety gate passes.

## How to enable session

Advanced → Safety Center → **Real adapter prototype** → "Enable real
coordinate click for this session" (requires the "I understand …"
checkbox). Session-only; resets on restart.

## How to run one real coordinate click scenario

1. Select a `simple_click` scenario with `repeatCount = 1`.
2. Safety Center → **Scenario real run readiness** → set Execution mode
   to **Real coordinate** (disabled with a reason if not ready).
3. Click **Run scenario safety check** (optional) to see readiness.
4. Click **Run one real coordinate click** → confirm in the modal
   (coordinates, button, repeatCount, mode, warnings, emergency-stop
   reminder, and the "I confirm one real click…" checkbox).
5. The click goes through `action-pipeline` → main adapter; the result
   and run summary are shown; the execution mode resets to simulation.

## Why repeatCount must be 1

Real input must be deliberate and bounded. A repeat/loop of real clicks
is exactly the abusive pattern we refuse. At Step 49 real mode performs
**one** click per fresh confirmation; `repeatCount > 1` is blocked with
a clear message (use simulation, or set repeatCount to 1).

## Confirmation flow

Per-run, fresh, never reused: enabling the session and running a real
scenario each require an explicit checkbox confirmation. After one real
click the confirmation is consumed and the execution mode resets to
simulation, so a second real click needs a brand-new confirmation.

## Safety gates

`getRealCoordinateClickGateStatus(...)` (default-deny) plus the
renderer pipeline pre-flight (`getRealDesktopActionBlockReason`) plus
the main-process adapter re-validation. All require: both session
flags, safe mode, emergency stop, audit logs, adapter available,
permissions not missing, action type `click` only, `oneClickOnly`, no
repeat/batch, no image/text/keyboard.

## Audit events

`scenario.realCoordinate.run.requested`,
`scenario.realCoordinate.confirmation.requested` / `.accepted` /
`.cancelled`, `scenario.realCoordinate.safetyCheck.passed` / `.failed`,
`scenario.realCoordinate.blocked`, `scenario.realCoordinate.executed`,
`scenario.realCoordinate.completed`, `scenario.realCoordinate.failed`,
`scenario.realCoordinate.repeatBlocked`,
`scenario.realCoordinate.unsupportedScenarioBlocked`. No screenshots,
base64, paths, or PII.

## Run summary

Records `{ scenarioId, scenarioType:"simple_click",
executionMode:"real-coordinate", realActionsPerformed, oneClickOnly,
x, y, button, status, blockedReason, startedAt, completedAt,
durationMs }`. `realActionsPerformed` is `true` only on a real
executed click, `false` when blocked.

## What remains disabled

Real `image_click`/`text_click`, keyboard/scroll/hotkey, repeats,
batches, loops, background/hidden clicks. Permanently prohibited:
captcha/anti-bot bypass, ad-click, banking/payment/protected-app
automation. No `robotjs`/`iohook`/`uiohook-napi`/`opencv`. No mobile.

## Troubleshooting

- **Real coordinate option disabled:** the readiness row lists the
  reason (not simple_click, repeatCount ≠ 1, session off, adapter
  unavailable, emergency stop off, audit logs off).
- **Blocked at run:** the gate/main re-validation found a missing
  precondition; the reason is shown and audited.
- **No backend:** the adapter is unavailable — the real click is
  blocked with "dependency not installed"; simulation/dry-run still
  work.
