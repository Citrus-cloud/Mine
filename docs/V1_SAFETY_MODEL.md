# ClickFlow Desktop v1 — Safety Model

> **Status:** Step 46. ClickFlow is simulation-only. Real desktop
> actions are disabled until a written safety review passes.

## Defense in depth

Real actions can only run if **every** layer agrees. Today none do.

1. **Feature flags** (`src/feature-flags.js`): `realDesktopActions:false`,
   `simulationOnly:true`, both frozen; `realDesktopActions` is **not**
   in the runtime-togglable whitelist.
2. **Safety gates** (`src/safety-gates.js`): `isRealActionAllowed()`
   returns `false`; `getMissingRealActionRequirements()` enumerates the
   unmet contract.
3. **Real adapter interface** (`src/real-desktop-adapter-interface.js`):
   `checkRealAdapterAvailability()` → unavailable/disabled; every
   `executeReal*()` returns a blocked result.
4. **Adapter registry** (`src/adapter-registry.js`): the real adapter
   is `available:false`; `setActiveAdapter('real-desktop')` is blocked
   and audited.
5. **Action pipeline** (`src/action-pipeline.js`): real mode is blocked
   by default; the multi-condition gate must pass to even be
   considered.
6. **Operational controls:** persistent **audit logs**, **emergency
   stop**, and per-run **user confirmation**.

## Real-mode preconditions (all required)

- `realDesktopActions` feature flag enabled.
- Explicit per-run user confirmation.
- `safeMode` true.
- Emergency stop enabled.
- Audit logs enabled.
- Real adapter available (native backend loaded).
- Permission check passed for the OS.

Missing any precondition → the action is **blocked**, an audit event is
recorded, and a user-friendly error is returned.

## Permanent exclusions

No captcha solving/bypass, no anti-bot bypass, no ad-click automation,
no banking/payment/protected-application automation, no hidden/remote
device control, no mass surveillance or impersonation. No safety
review can authorize these.

## Invariants that never change

`contextIsolation:true`, `nodeIntegration:false`, CSP not weakened,
renderer never gets direct Node access, no screenshots written to
disk, no `imageDataUrl` persisted in scenarios/settings, no real action
auto-runs at app start.



---

## Step 47 update — real coordinate-click gate

The coordinate-click prototype adds a strict, defense-in-depth gate
(`getRealDesktopActionGateStatus` in `src/safety-gates.js`) that is
**default-deny**. A real click runs only if every requirement holds:
session flags `realDesktopActions` + `realCoordinateClick` enabled,
`safeMode`, emergency stop, audit logs, adapter available, permissions
not missing, action type `click` only, and explicit per-click
confirmation. The main process re-validates the full context and is
the authority. Session flags are never persisted and reset to `false`
on restart. image/text real clicks and keyboard remain hard-disabled.



---

## Step 48 update — coordinate-click stabilization

Added `getRealCoordinateClickGateStatus(settings, flags, permissions,
adapterStatus, context)` — a default-deny superset of the Step 47 gate
that also enforces per-action context: fresh user confirmation, one
click per confirmation, action type `click` only, no batch, no repeat,
no image/text real, no keyboard. `keyboardAutomation` is a new
hard-coded-false, non-togglable flag. The renderer pipeline and the
main adapter both re-validate independently. "When in doubt, block."



---

## Step 49 update — real coordinate scenario mode

`simple_click` may run one real coordinate click through the same
default-deny gate, with the execution mode held in runtime state
(never persisted), `repeatCount === 1` enforced, a fresh per-run
confirmation, and an automatic reset to simulation after the run.
image/text real modes and keyboard remain disabled.
