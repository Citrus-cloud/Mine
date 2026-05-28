# ClickFlow — Desktop Adapter Interface

This document describes the contract every desktop action adapter
in ClickFlow must follow, the mock adapter that ships in `0.1.x`,
and the safety invariants the future real adapter will inherit.

> **Current status (0.1.0-beta, after Step 18).** The mock adapter
> is the **only** adapter that is `available: true`. The real
> adapter is registered, but it is **unavailable, planned, and
> cannot be activated**. Real desktop actions are **not implemented**.
> See `docs/REAL_ACTIONS_GO_NO_GO.md`.

---

## 1. Purpose

The adapter interface decouples the action pipeline from any
concrete way of "performing" an action. In `0.1.x`, "performing"
an action means *recording it* — the mock adapter validates the
input, emits an `adapter.mock.executed` audit event, and returns
a structured success result. No OS input is produced.

Decoupling makes it possible to:

- ship the simulation-only beta with a clean architecture;
- write a future real-action adapter that satisfies the same
  contract, behind the safety review in `docs/REAL_ACTIONS_GO_NO_GO.md`;
- run a self-test against the active adapter without touching the OS.

## 2. Files

| File                                      | Role                                                    |
|-------------------------------------------|---------------------------------------------------------|
| `src/desktop-adapter-interface.js`        | Contract + helpers (`getAdapterContract`, `validateAdapterAction`, `normalizeAdapterAction`, `createAdapterResult`, `isRealAdapterAllowed`). |
| `src/mock-desktop-adapter.js`             | The only available adapter. `executeMockAction`, `runMockAdapterSelfTest`, `getMockAdapterStatus`. Pure JS. |
| `src/adapter-registry.js`                 | Lists adapters; `getActiveAdapter`, `setActiveAdapter`, `runActiveAdapterSelfTest`, `getAdapterRegistryStatus`. Blocks real adapter selection. |
| `src/action-pipeline.js`                  | Routes every action through the registry. Real path is `blockRealAction()`. |

## 3. Adapter contract

`getAdapterContract()` returns a frozen-shape object:

```js
{
  version: 1,
  supportedActions: ["click"],
  realActionsAllowed: false,
  simulationOnly: true,
  requiresMainProcess: true,
  requiresUserConfirmation: true,
  requiresEmergencyStop: true
}
```

Any future adapter MUST report values consistent with the live
state of the build. In `0.1.x`, every adapter currently reports
`realActionsAllowed: false` and `simulationOnly: true`.

## 4. Supported actions (current)

Only the simulated `click` action is supported in `0.1.x`:

```js
{
  type: "click",
  x: number >= 0,
  y: number >= 0,
  button: "left" | "right" | "middle"
}
```

`validateAdapterAction(action)` returns `{ ok: true }` or
`{ ok: false, error: "<reason>" }`. `normalizeAdapterAction(action)`
returns a defensive copy with numeric coercion.

## 5. Mock adapter

`Mock Desktop Adapter` is the default, the only `available: true`
adapter, and the active adapter at app start. Its public surface:

- `getMockAdapterInfo()` — id / name / version / contract.
- `checkMockAdapterAvailability()` — `{ available: true, reason: null }`.
- `executeMockAction(action, context)` — validates + emits
  `adapter.mock.executed` + returns:
  ```js
  {
    success: true,
    mode: "mock",
    simulated: true,
    action,
    timestamp: "<ISO>",
    adapter: "mock-desktop-adapter"
  }
  ```
- `runMockAdapterSelfTest()` — see §8.
- `getMockAdapterStatus()` — for diagnostics.

The mock adapter never moves the cursor and never presses keys.

## 6. Real adapter (planned)

The real adapter is **registered**, but **unavailable**:

```js
{
  id: "real-desktop",
  name: "Real Desktop Adapter",
  type: "real",
  available: false,
  realActions: true,
  simulationOnly: false,
  planned: true,
  disabledReason: "Real desktop actions are not implemented in this build"
}
```

`setActiveAdapter("real-desktop")` returns
`{ success: false, blocked: true, error: "<disabledReason>" }` and
emits **two** audit events:

- `adapter.selection.blocked` — every blocked selection.
- `adapter.real.unavailable` — every blocked real-adapter selection.

There is no other code path that activates this adapter.

## 7. Safety gates

All four layers must reject real input independently. Even if one
were misconfigured, the others would still refuse.

| Layer                          | What it returns for a real-action attempt        |
|--------------------------------|---------------------------------------------------|
| `feature-flags.js`             | `realDesktopActions: false` (frozen).             |
| `safety-gates.js`              | `isRealActionAllowed()` → `false` (hard-coded).   |
| `desktop-adapter-interface.js` | `isRealAdapterAllowed()` → `false` (hard-coded).  |
| `adapter-registry.js`          | `setActiveAdapter("real-desktop")` → blocked.     |
| `action-pipeline.js`           | `executeAction(..., { executionMode: "real" })` → `blockRealAction()`. |

## 8. Self-test

`runActiveAdapterSelfTest()` runs the active adapter's self-test.
For the mock adapter, `runMockAdapterSelfTest()` performs four
checks without producing any input:

1. `validate click action` — `validateAdapterAction()` accepts a
   well-formed click.
2. `execute mock action` — `executeMockAction()` returns
   `success: true`.
3. `real action blocked` — `isRealAdapterAllowed({ realDesktopActions: true }, { safety: { safeMode: true } })`
   still returns `false`.
4. `reject malformed action` — a negative-coordinate action is
   rejected by `executeMockAction()`.

Result shape on success:

```js
{ success: true, tests: [ { name, passed: true }, ... ] }
```

Result shape on failure:

```js
{ success: false, tests: [...], errors: [ "<test name>: <error>", ... ] }
```

The UI exposes "Run adapter self-test" in **Advanced → Safety →
Desktop adapter status**. The result is kept in memory only.

## 9. Why the real adapter is disabled

Three reasons, each independently sufficient:

1. **No safety review.** `docs/REAL_ACTIONS_GO_NO_GO.md` lists 9
   requirements that must all be met before any real-input PR can
   land. None are met in `0.1.x`.
2. **No audit log persistence.** `docs/AUDIT_LOG_PLAN.md` describes
   the local file format that must accompany real input. ClickFlow
   currently has only the in-memory model from Step 17.
3. **Project scope.** ClickFlow is a simulation-only beta. Real
   input is targeted at the `0.3.x` release line.

## 10. Future implementation checklist

A future PR introducing the real adapter must, at minimum:

- [ ] Pass `docs/REAL_ACTIONS_GO_NO_GO.md` end-to-end.
- [ ] Implement file-based audit logs per `docs/AUDIT_LOG_PLAN.md`.
- [ ] Add a per-scenario user-confirmation flow with a typed phrase.
- [ ] Add a persistent on-screen banner during real-action runs.
- [ ] Add OS permission probes (macOS Accessibility, Windows UAC,
      Linux Wayland-vs-X11).
- [ ] Add a strict allowlist of supported targets and a non-empty
      denylist of banned application classes.
- [ ] Provide a kill-switch test: `Escape` and the global emergency
      hotkey both abort within 200 ms.
- [ ] Provide a "with the flag off, the adapter cannot fire even
      via direct IPC" test.
- [ ] Update `feature-flags.js`, `safety-gates.js`,
      `desktop-adapter-interface.js`, `adapter-registry.js`, and
      `action-pipeline.js` so the four layers are flipped together
      and atomically.
- [ ] Update `docs/ACTION_SCHEMA.md`, `docs/SECURITY_CHECKLIST.md`,
      `docs/SMOKE_TESTS.md`, README, PROJECT_CONTEXT, CHANGELOG.
- [ ] Add a Safety report issue that closes alongside the PR.

Until every box above is checked, the real adapter remains
`available: false` in the registry.
