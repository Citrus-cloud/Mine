# ClickFlow Desktop v1 — Real Adapter Requirements

> **Status:** Step 46. The real adapter **interface** exists; real
> execution is disabled. These are the requirements that must be met
> before a real adapter could be enabled.

## Contract

The real adapter implements the same contract as the mock adapter
(`src/desktop-adapter-interface.js`) and is described by
`src/real-desktop-adapter-interface.js`:

- `getRealAdapterInfo()` — static metadata; `available:false`,
  `realActionsEnabled:false`.
- `checkRealAdapterAvailability()` — returns unavailable/disabled with
  a stable reason.
- `validateRealAdapterAction(action)` — shape validation only.
- `executeRealClick / executeRealImageClick / executeRealTextClick` —
  **always blocked** in this build via `blockRealAction()`.
- `blockRealAction(reason, action, context)` — uniform blocked result +
  audit event.

## Requirements before enabling (all mandatory)

1. Written safety review sign-off recorded in the repo.
2. `realDesktopActions` feature flag (default false) intentionally
   enabled in source for a dedicated build.
3. Native backend (e.g. nut.js) loads successfully at runtime;
   otherwise the adapter stays `available:false`.
4. Per-run explicit user confirmation flow.
5. Persistent, redacted audit logs enabled.
6. Emergency stop verified to interrupt within one action cycle.
7. Per-OS permission checks passed (see `docs/V1_PERMISSION_MODEL.md`).
8. Target allowlist + permanent denylist enforced.

## Behavior in this build

`checkRealAdapterAvailability()` reports unavailable. Every
`executeReal*()` returns:

```
{ success:false, mode:"real", blocked:true, realAction:false,
  error:"Real desktop actions are not enabled in this build.", ... }
```

No code path performs real input. See
`docs/REAL_ACTIONS_GO_NO_GO.md` for the enabling gate and
`docs/NUTJS_INTEGRATION_PLAN.md` for the candidate backend.
