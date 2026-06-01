# ClickFlow Desktop v1 — Action Pipeline

> **Status:** Step 46. The pipeline is v1-ready in shape but real mode
> is blocked by default. No real input runs in this build.

## Action types

| Type          | State            | Notes                                  |
|---------------|------------------|----------------------------------------|
| `click`       | active           | coordinate click, simulation-only      |
| `image_click` | active           | template match → simulated click       |
| `text_click`  | active           | OCR match → simulated click            |
| `wait`        | active           | non-input delay action                 |
| `move_mouse`  | planned/disabled | reserved; validates but never executes |
| `scroll`      | planned/disabled | reserved; validates but never executes |
| `key_press`   | planned/disabled | reserved; validates but never executes |
| `hotkey`      | planned/disabled | reserved; validates but never executes |

Planned/disabled types are recognized by the taxonomy
(`getActionTypeInfo`) so the UI and diagnostics can show them, but the
pipeline never executes them — a real request is blocked.

## Uniform result shape

```
{
  success,                         // bool
  mode: "simulation"|"real"|"dry-run",
  simulated,                       // bool
  realAction,                      // bool (always false in this build)
  action,                          // echoed action
  result,                          // mode-specific data (or null)
  error,                           // string|null
  timestamp                        // ISO string
}
```

`normalizeActionResult()` guarantees these fields exist on every
return path so callers never branch on mode to read a result.

## Modes

- **simulation** (default): runs through the mock adapter / simulate
  path. `simulated:true`, `realAction:false`.
- **dry-run**: builds a preview without touching the OS.
- **real**: **blocked by default.** Requires the full precondition set
  (see `docs/V1_SAFETY_MODEL.md`). In this build it always blocks.

## Real-mode gate

`evaluateRealModeReadiness(context)` returns the list of unmet
preconditions. `canExecuteRealAction()` returns `true` only if that
list is empty **and** the adapter reports available — neither is
possible in this build, so it returns `false`. A blocked real request
emits an audit event and returns a friendly error:
"Real desktop actions are not enabled in this build."



---

## Step 47 update — real mode (coordinate click only)

The renderer pipeline (`src/action-pipeline.js`) adds
`canExecuteRealDesktopAction(action, context)`,
`executeRealDesktopAction(action, context)`, and
`createRealActionBlockedResult(reason, action)`. Real mode is **blocked
by default**. Only `type:"click"` with `realClick:true` is eligible;
`image_click`/`text_click`/keyboard/scroll real modes are blocked
before any IPC. When the pre-flight passes, execution is delegated to
the main-process adapter (`main/real-desktop-adapter.js`), which
re-validates everything. The result is returned verbatim (a genuine
real click reports `realAction:true`); the simulation-only
`normalizeActionResult` is intentionally not applied to real results.



---

## Step 48 update — explicit blocked reasons + one-click-only

`getRealDesktopActionBlockReason(action, context)` returns a stable
blocked-reason id (or null when permitted); `canExecuteRealDesktopAction`
delegates to it. New context requirements:
`sessionRealCoordinateClickEnabled`, `adapterAvailable`, `oneClickOnly`.
Repeats (`repeatCount > 1`) and batches (action arrays) are blocked.
image_click/text_click/keyboard/scroll/move_mouse real modes each map
to their own blocked reason.



---

## Step 49 update — scenario real mode wrapper

Added `executeRealCoordinateScenarioAction(action, context)` — a thin
wrapper over `executeRealDesktopAction` for the scenario-run path. It
accepts only `type:"click"` (image/text blocked), delegates to the
hardened real path (and main re-validation), and returns the Step-49
result shape `{ success, blocked, mode:"real-coordinate", realAction,
oneClickOnly, action, result, reason, timestamp }`.
