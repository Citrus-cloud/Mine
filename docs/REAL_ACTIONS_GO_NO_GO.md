# ClickFlow — Real Actions Go / No-Go Checklist

This is the **mandatory** checklist for any future work that introduces
real desktop input (mouse / keyboard) into ClickFlow. It is the
sign-off gate for the `0.3.x` release line.

> **Current status (0.1.0-beta, after Step 17).** Real clicks are
> **NOT implemented**. ClickFlow only runs in **simulation mode**.
> Step 17 added the architectural scaffolding the future adapter
> will plug into — `src/action-pipeline.js` (centralized
> `executeAction()`), `src/safety-gates.js` (`isRealActionAllowed`
> hard-coded `false`), and `src/audit-events.js` (in-memory
> allowlist-only audit model). None of those files perform real
> OS input. `src/feature-flags.js` still ships
> `realDesktopActions: false`, `ocr: false`, `imageRecognition: false`,
> `simulationOnly: true`. No UI in the app can flip those values.
>
> A green checklist below is **necessary but not sufficient**: a
> separate written safety review in a Safety report issue
> (`.github/ISSUE_TEMPLATE/safety_report.md`) must accompany any PR
> that turns `realDesktopActions` on.

---

## 0. What step 17 changed

- [x] Action pipeline (`src/action-pipeline.js`) routes every action
      through `executeAction(action, context)`. Only the simulate
      path is wired. `executionMode === "real"` calls `blockRealAction()`
      and never invokes any OS API.
- [x] Safety gate layer (`src/safety-gates.js`) gives the future
      adapter a single place to consult. `isRealActionAllowed()`
      is hard-coded `false` for `0.1.x` and `0.2.x`.
- [x] Audit event model (`src/audit-events.js`) records start /
      stop / completion / emergency stop / simulated action /
      real-blocked / safety-validation-failed / settings changed /
      import / export, in memory only.
- [x] Diagnostics show `Action pipeline`, `Safety gates`, `Real
      actions readiness`, and `Audit events` cards.
- [x] Smoke check (`npm run smoke`) verifies the new files exist
      and the simulation-only invariants are baked into source.

These additions are **preparation only**. They do not constitute
implementation of real input. The list below is unchanged.

## 0bis. What step 18 changed

- [x] **Mock desktop adapter is ready** (`src/mock-desktop-adapter.js`).
      It is the only `available: true` adapter in the registry. It
      validates inputs, emits `adapter.mock.executed`, and returns a
      structured result. It performs **no** OS input.
- [x] **Adapter registry** (`src/adapter-registry.js`) lists both
      adapters. The `real-desktop` adapter is registered with
      `available: false`, `planned: true`, and a non-null
      `disabledReason: "Real desktop actions are not implemented in
      this build"`. `setActiveAdapter("real-desktop")` returns
      `{ success: false, blocked: true, ... }` and emits both
      `adapter.selection.blocked` and `adapter.real.unavailable`
      audit events.
- [x] **Adapter interface** (`src/desktop-adapter-interface.js`)
      defines the contract — `getAdapterContract()`,
      `validateAdapterAction()`, `normalizeAdapterAction()`,
      `createAdapterResult()`, `getSupportedAdapterActions()`,
      `isRealAdapterAllowed()` (hard-coded `false`).
- [x] **Action pipeline** routes the simulate path through the
      active adapter (mock). The real path is unchanged
      (`blockRealAction()`).
- [x] **Audit allowlist** gained six adapter event types.
- [x] **UI** gained a `Desktop adapter status` card in
      Advanced → Safety with a "Run adapter self-test" button.
- [x] **Smoke check** verifies the new files and that
      `setActiveAdapter("real-desktop")` cannot succeed in source.

**The real adapter is still No-Go.** The list below is unchanged.

These additions are **preparation only**. They do not constitute
implementation of real input.

## 0ter. What step 19 changed

- [x] **Real-action sandbox** (`src/real-action-sandbox.js`) — a
      read-only preview layer. `getSandboxStatus()` returns
      `dryRunAvailable: true`, `realActionsAllowed: false`,
      `realActionsImplemented: false`. `createRealActionPreview()`
      builds a description-only dry-run plan capped at 10 actions
      in the preview. `confirmDryRunPlan()` only confirms the
      dry-run; it never asks any adapter to execute and returns
      `realExecution: false`.
- [x] **Permission checklist** is built by
      `createPermissionChecklist()` — 11 items including
      `realAdapterInstalled` (`blocked`), `osPermissions`
      (`missing`), `finalSafetyReview` (`missing`),
      `realFeatureFlag` (`blocked`).
- [x] **Blocked reasons** are enumerated by
      `getRealActionBlockedReasons()` — 7 stable ids covering the
      feature flag, the simulation-only mode, the missing real
      adapter, the missing OS permissions, the missing safety
      review, the missing audit persistence, and the project-level
      decision to keep real actions disabled.
- [x] **Action pipeline** now also recognises `executionMode === "dry-run"`
      and handles it via `executeDryRunAction()` without crossing
      into any adapter. The real-mode block message now reads
      `Real desktop actions are disabled. Dry-run preview is available only.`
- [x] **Audit allowlist** gained six sandbox events.
- [x] **UI** gained a `Real action sandbox` card with an inline
      `Dry-run preview` panel including Confirm / Cancel buttons.
- [x] **Smoke check** verifies the new module, doc, and audit types,
      and that the README/PROJECT_CONTEXT mentions dry-run/sandbox.

**Real adapter remains No-Go.** Dry-run is now the *required*
intermediate step before any real-input PR can be considered.

---

## 1. Required before implementation

- [ ] Written design doc updated: `docs/DESKTOP_ADAPTER_PLAN.md`
      reflects the chosen native module, fall-back behavior, and the
      kill-switch wiring.
- [ ] Action schema reviewed: `docs/ACTION_SCHEMA.md` covers every
      action the new adapter can emit. No action types beyond the
      schema may be reachable.
- [ ] Threat model written: who is the user, what new capability is
      being shipped, who could be harmed if this is misused, what
      guardrails are in place.
- [ ] Safety review issue filed and approved
      (`.github/ISSUE_TEMPLATE/safety_report.md`).
- [ ] Maintainer sign-off recorded in the safety review issue.

## 2. Required safety gates (runtime)

- [ ] Per-scenario opt-in: a scenario must be explicitly marked as
      "real action" in its schema. The default for all existing
      scenarios stays simulation.
- [ ] Default global feature flag: `realDesktopActions = false`. The
      flag is **not** flipped on install or update.
- [ ] No CLI / env-var path can flip the flag without showing the
      user-confirmation flow described below.
- [ ] Adapter loads lazily and refuses to fire any action if the
      flag is `false`.

## 3. Required UI confirmations

- [ ] First-run "real mode is dangerous" full-screen modal that
      requires a typed confirmation (e.g. "I understand"), localized
      RU + EN.
- [ ] Per-scenario confirmation immediately before any real-action
      run, showing: target coordinates, button, interval, total
      repeats, expected duration, kill-switch hotkey.
- [ ] Persistent on-screen banner while a real-action scenario runs:
      "Real desktop actions in progress" + a visible counter of
      actions fired + the emergency-stop hotkey.
- [ ] No "Don't show this again" affordance for the per-scenario
      confirmation in `0.3.x`.

## 4. Required audit logs

- [ ] Audit log designed and built per `docs/AUDIT_LOG_PLAN.md`.
- [ ] Every real-action start, stop, completion, error, and emergency
      stop is logged with timestamp, scenario id, and counts.
- [ ] No PII, no full filesystem paths in audit logs.
- [ ] Logs are local-only by default.
- [ ] An "Export audit log" UI exists in Advanced → Safety.
- [ ] An "Open audit log location" UI exists for power users.

## 5. Required OS permission checks

- [ ] macOS: detect Accessibility permission state and surface a
      readable "Grant Accessibility access" panel before the first
      real action.
- [ ] Windows: detect UAC elevation state if relevant; refuse to fire
      real input against elevated windows.
- [ ] Linux: detect Wayland vs X11 and refuse on Wayland with a
      readable error if the chosen adapter does not work there.
- [ ] On any OS, refuse to start a real-action scenario if the OS
      user has not interacted with the ClickFlow window in the last
      five seconds (rough idle-presence check).

## 6. Required tests

- [ ] Unit tests for the adapter (mocked OS).
- [ ] Manual smoke matrix: each action type exercised on each
      supported OS.
- [ ] Emergency-stop latency test: every adapter must abort within
      200 ms of `Escape` or the global emergency hotkey.
- [ ] Kill-switch test: forcing the OS to lose focus from ClickFlow
      stops the run within 200 ms.
- [ ] Settings-and-flags test: with `realDesktopActions = false`,
      the adapter cannot fire even via direct IPC manipulation.
- [ ] Diagnostics test: with `realDesktopActions = true`, diagnostics
      and audit logs reflect the change.

## 7. Disallowed use cases (permanent)

The following are **always** out of scope. A green checklist above
**does not** unlock them:

- Captcha bypass, antibot bypass, "I am not a robot" defeats.
- Ad-click automation (publisher fraud, click farms, ad arbitrage).
- Automation against banking, payment, brokerage, exchange, or any
  protected application.
- Automation against any application whose terms of service or
  whose technical anti-automation controls forbid programmatic
  input.
- Stalking, doxxing, harassment, or any privacy-violating workflow.

## 8. Rollback plan

- [ ] A single config switch (`realDesktopActions`) flips the entire
      adapter off without uninstall.
- [ ] If a regression is found in production, the next patch release
      ships `realDesktopActions: false` by default and shows a
      one-time notice on first launch explaining the rollback.
- [ ] User audit logs are retained across rollback so the user can
      see what was fired before the rollback.
- [ ] No data loss: scenarios marked as "real action" stay on disk
      but cannot run while the flag is off.

## 9. Go / No-Go decision

| Section                                      | Status  |
|----------------------------------------------|---------|
| 1. Required before implementation            | TBD     |
| 2. Required safety gates                     | TBD     |
| 3. Required UI confirmations                 | TBD     |
| 4. Required audit logs                       | TBD     |
| 5. Required OS permission checks             | TBD     |
| 6. Required tests                            | TBD     |
| 7. Disallowed use cases respected            | always  |
| 8. Rollback plan tested                      | TBD     |

**Decision for `0.1.0-beta`:** **No-Go** for any real desktop input.
Simulation mode is the only mode that ships in this release line.

**Decision for `0.3.x`:** Each item above must be **Go** before any
PR that flips `realDesktopActions` to `true` is merged. The PR must
link to a closed Safety report issue and include reviewer sign-off.
