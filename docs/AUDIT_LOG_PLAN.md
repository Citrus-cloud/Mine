# ClickFlow — Audit Log Plan (design only)

This is a **design document** for the audit log that will accompany
the future real-desktop-input adapter. **No file-based audit logs
are written by the current ClickFlow build.**

The goal is for the design to be reviewable now so that, when the
`0.3.x` adapter is implemented behind the
`docs/REAL_ACTIONS_GO_NO_GO.md` gate, the audit-logging story is
already settled.

---

## What we log

The audit log records **safety-relevant events**, not user activity
on the rest of the desktop. Concretely:

- `realModeStart` — a real-action scenario was just allowed to start.
  Fields: timestamp, scenario id, scenario name, action count,
  interval, repeats, locale, ClickFlow version.
- `realActionFired` — every real action emitted by the adapter.
  Fields: timestamp, scenario id, action index, action type,
  coordinates (only the ones the user authored — never the cursor's
  current location), button. Coordinates are pre-existing scenario
  data, not a snapshot of the user's screen.
- `realModeStop` — user pressed Stop or hit the per-scenario cap.
  Fields: timestamp, scenario id, action count fired.
- `realModeEmergencyStop` — `Escape` or
  `CmdOrCtrl+Alt+E` was pressed. Fields: timestamp, scenario id,
  action count fired, latency between trigger and abort.
- `realModeError` — adapter failed mid-run. Fields: timestamp,
  scenario id, error code, sanitized error message.
- `flagChange` — `realDesktopActions` (or another safety-sensitive
  flag) was flipped. Fields: timestamp, flag name, new value, source
  (`UI`, `import`, `migration`).
- `permissionCheck` — OS permission probe ran. Fields: timestamp,
  permission name (`accessibility`, `uac`, `wayland`), outcome.

## What we do **not** log

- The user's keyboard input.
- Window titles, app names, or any data about other apps on the
  desktop.
- Screen contents or screenshots.
- Cursor position outside of what the user authored in the scenario.
- Filesystem paths or environment variables.
- Network identifiers, account identifiers, machine identifiers.
- Personally identifiable information of any kind.

## Where it is stored

- One JSONL file per day under
  `userData/audit/clickflow-audit-YYYY-MM-DD.jsonl`.
- Each line is a single event JSON object — easy to grep, easy to
  rotate.
- The folder lives inside Electron's `app.getPath('userData')`. It
  is **never** synced anywhere by ClickFlow.

## Retention

- Default: keep 30 days. Older files are deleted on app start by a
  small house-keeping pass that only ever **deletes** within the
  `audit/` subfolder.
- User can change retention in Advanced → Safety, between 7 and
  365 days.
- User can also click "Clear audit log" with a confirmation prompt.

## Privacy considerations

- The audit log is local-only. It is never uploaded, never sent in
  a telemetry stream (there is no telemetry anyway — see
  `docs/PRIVACY.md`).
- Diagnostics output (`Copy diagnostics`) includes **counts**
  (e.g. "audit events today: 42") but never **content**.
- The "Open audit log location" UI uses `shell.openPath` from the
  main process. The renderer never sees the absolute path string.

## Export

- Advanced → Safety → "Export audit log" opens a save dialog.
- The exported file is a single JSONL stream, the same format that
  is on disk. The user controls where it is saved.

## Failure modes

- Disk full: the adapter falls back to "refuse to start a new real
  scenario" and surfaces the error inline. **It does not silently
  drop events.**
- Audit subsystem crash: the adapter must refuse to start any new
  real-action scenario until audit is healthy again.
- Clock skew: every event also stores a monotonic counter so that
  stop/start latencies are still meaningful even if the wall clock
  jumps.

## Implementation status

- 0.1.x — **partial**: `src/audit-events.js` ships an **in-memory**
  audit event model (Step 17). It records every event in the
  allowlist above with a stable id, a timestamp, a known/unknown
  flag, and a small payload of safe fields (no PII, no paths).
  **No file is written.** Step 19 added six sandbox event types to
  the allowlist (`real.sandbox.preview.created`,
  `real.sandbox.dryrun.confirmed`, `real.sandbox.dryrun.cancelled`,
  `real.sandbox.blocked`, `real.permission.checklist.created`,
  `real.blocked.reason.generated`). They are still in-memory only.
- 0.2.x — design firm, prototype optional. Adds JSONL files under
  `userData/audit/` per the layout above.
- 0.3.x — **must be implemented before** `realDesktopActions` flips
  to `true` for any user. See `docs/REAL_ACTIONS_GO_NO_GO.md` §4.
