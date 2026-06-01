# ClickFlow Desktop v1 — Permission Model

> **Status:** Step 46. Permission manager shipped
> (`src/permission-manager.js`); status/guidance only. There is **no**
> "Enable Real Clicks" control anywhere.

## Purpose

Show whether the environment *would* be ready for a future real mode,
and guide the user on OS permissions — without enabling anything.

## Permission items

```
{ id, labelKey, status, requiredForRealMode, guidanceKey }
```

`status` is one of: `ready` | `missing` | `unknown` | `planned` |
`notRequired`.

| id                  | requiredForRealMode | typical status                |
|---------------------|---------------------|-------------------------------|
| `screenCapture`     | yes                 | ready (desktopCapturer)       |
| `accessibility`     | yes (macOS)         | unknown / guidance (macOS)    |
| `inputMonitoring`   | yes (macOS)         | planned / notRequired         |
| `adapterAvailability` | yes               | missing (real adapter off)    |
| `safeMode`          | yes                 | ready/missing (user setting)  |
| `emergencyStop`     | yes                 | ready/missing (user setting)  |
| `auditLogs`         | yes                 | ready (manager present)       |

## Per-OS notes

- **Windows:** many input permissions are `unknown` or `notRequired`;
  no system prompt for general input.
- **macOS:** Accessibility and (for capture) Screen Recording require
  user-granted permissions; the app shows **guidance** and degrades
  gracefully — automated probing is not required at Step 46.
- **Linux:** X11 generally fine; Wayland restricted for real input
  (documented as limited).

## API (`src/permission-manager.js`)

- `getPermissionStatus()`
- `getPermissionChecklist(settings, flags)`
- `getMissingPermissions(settings, flags)`
- `refreshPermissions()`
- `getPermissionManagerStatus()`

The manager only reports status and guidance. It cannot grant
permissions and cannot enable real actions.



---

## Step 47 update — real coordinate-click readiness

New checklist items: `realCoordinateClickPermission`,
`sessionRealModeEnabled`, `userConfirmationAvailable`,
`auditLogPersistenceReady` (plus the existing `adapterAvailability`).
These report **status/guidance only** and never enable real mode. On
Windows the OS-level input permission is typically `notRequired` /
`unknown`, but adapter availability (native backend loaded) is always
checked. The manager still keeps `realModeEnabled:false`.
