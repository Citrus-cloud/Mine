# ClickFlow — Real Action Sandbox

This document describes the safety sandbox introduced in Step 19. The
sandbox is a **read-only preview layer**. It builds dry-run plans for
the future real desktop adapter. **It never executes a real action.**

> **Current status (0.1.0-beta, after Step 19).** Real desktop
> actions are **not implemented**. The sandbox can preview what
> *would* happen if a real adapter were available; it cannot ask any
> adapter to execute. `evaluateRealActionReadiness()` always returns
> `{ allowed: false, ... }`. `confirmDryRunPlan()` only confirms the
> dry-run; it never crosses into real execution.

---

## 1. Purpose

Three reasons:

1. **Safety surface practice.** The future safety review
   (`docs/REAL_ACTIONS_GO_NO_GO.md`) requires explicit user
   confirmation, audit logging, and a permission checklist. The
   sandbox lets us build the UI for those without yet shipping the
   capability.
2. **Predictability.** Beta users can see exactly what a scenario
   would do before any real-input code lands. They can verify there
   is nothing surprising in the action list.
3. **Auditability.** Every preview, confirmation, and cancellation
   is recorded as an in-memory audit event with a stable id. When
   audit log persistence ships (`docs/AUDIT_LOG_PLAN.md`), these
   events will already have the right shape.

## 2. What "dry-run" means

A dry-run plan is **a description**, not a behavior. Concretely,
`createRealActionPreview(scenario, actions, settings)` returns:

```js
{
  ok: true,
  plan: {
    id: "dryrun-<ts>-<rand>",
    scenarioId: "...",
    scenarioName: "...",
    createdAt: "<ISO>",
    mode: "dry-run",
    realExecution: false,
    actionCount: 100,             // total iterations
    estimatedDurationMs: 50000,
    actionsPreview: [
      { index: 1, type: "click", x: 500, y: 400, button: "left" },
      ...
    ],
    truncated: true,              // true when actionCount > preview.length
    blockedReasons: [...],
    permissionChecklist: [...]
  }
}
```

Notes:

- The preview is capped at `SANDBOX_PREVIEW_MAX = 10` items. The
  full list is never materialized (`repeatCount` may be 100 000).
- `truncated: true` means the plan represents more actions than the
  `actionsPreview` array shows.
- `realExecution` is **always** `false`. There is no flag in this
  module that turns it `true`.

## 3. What is blocked

- Activating the real adapter — refused by `adapter-registry.js`.
- Asking the pipeline for `executionMode: "real"` — refused by
  `action-pipeline.js → blockRealAction()` with the message
  `Real desktop actions are disabled. Dry-run preview is available only.`
- Calling `confirmDryRunPlan(plan)` — recorded, but does not ask
  any adapter to execute. Returns `realExecution: false`.

## 4. Permission checklist

`createPermissionChecklist(settings, flags)` returns an array of:

```js
{ id, label, status: "ready" | "missing" | "planned" | "blocked" }
```

Items in `0.1.x`:

| id                      | typical status (default safe settings) |
|-------------------------|----------------------------------------|
| `safeMode`              | `ready`                                |
| `emergencyStop`         | `ready`                                |
| `safetyLimits`          | `ready`                                |
| `userConfirmation`      | `planned`                              |
| `auditEvents`           | `ready`                                |
| `adapterInterface`      | `ready`                                |
| `mockAdapter`           | `ready`                                |
| `realAdapterInstalled`  | `blocked` (registered but unavailable) |
| `osPermissions`         | `missing`                              |
| `finalSafetyReview`     | `missing`                              |
| `realFeatureFlag`       | `blocked`                              |

The UI shows the items in **Advanced → Safety → Real action sandbox
→ dry-run preview**, with neutral colors. A `blocked` item does not
indicate the user did anything wrong — it indicates the build
intentionally has not opened that gate.

## 5. Blocked reasons

`getRealActionBlockedReasons(settings, flags)` enumerates the
reasons real execution is currently denied. Stable ids:

- `realDesktopActionsFlagDisabled`
- `simulationOnlyEnabled`
- `realAdapterNotInstalled`
- `osPermissionsNotVerified`
- `finalSafetyReviewNotPassed`
- `auditPersistenceNotImplemented`
- `realActionsIntentionallyDisabled`

Each reason carries a human-readable label. The renderer renders
them via `textContent` only.

## 6. Audit preview

The sandbox emits the following audit events on the in-memory
allowlist (`src/audit-events.js`):

- `real.sandbox.preview.created` — every successful
  `createRealActionPreview()` call.
- `real.sandbox.dryrun.confirmed` — every successful
  `confirmDryRunPlan()` call.
- `real.sandbox.dryrun.cancelled` — every `cancelDryRunPlan()` call.
- `real.sandbox.blocked` — when an invalid plan is rejected by
  `confirmDryRunPlan()` or `createRealActionPreview()`.
- `real.permission.checklist.created` — every time the checklist is
  built.
- `real.blocked.reason.generated` — every time the blocked-reasons
  list is built.

Payloads carry only ids, counts, and small enums (no PII, no
filesystem paths).

## 7. Why real actions are still disabled

- `feature-flags.js → realDesktopActions` is `false`.
- `safety-gates.js → isRealActionAllowed()` returns `false`.
- `desktop-adapter-interface.js → isRealAdapterAllowed()` returns
  `false`.
- `adapter-registry.js → setActiveAdapter("real-desktop")` is
  blocked with `disabledReason: "Real desktop actions are not
  implemented in this build"`.
- `action-pipeline.js → executeAction(..., { executionMode: "real" })`
  routes to `blockRealAction()`.
- `real-action-sandbox.js → evaluateRealActionReadiness()` returns
  `{ allowed: false, ... }`.

Six independent layers must agree before any real input could fire.
None of them is open in `0.1.x`.

## 8. Future path to real adapter

The dry-run sandbox is the **first** UI that the future real
adapter will inherit. The future PR must:

1. Pass every requirement in `docs/REAL_ACTIONS_GO_NO_GO.md`.
2. Re-use `createPermissionChecklist()` so the checklist is shown
   verbatim before any real run.
3. Re-use `getRealActionBlockedReasons()` so the user can see, even
   after the gate opens, what would still block them.
4. Make `evaluateRealActionReadiness()` actually consult the live
   state — currently it short-circuits to `false` for safety.
5. Persist audit events per `docs/AUDIT_LOG_PLAN.md`.
6. Add an explicit user-confirmation dialog *separate from* the
   dry-run confirmation. Confirming a dry-run will never imply a
   real-run consent.

Until every box above is checked, ClickFlow ships dry-run only.
