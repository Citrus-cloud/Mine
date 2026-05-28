# ClickFlow — Feature Flags

ClickFlow uses a small, **read-only** feature-flag layer to make the
simulation-only invariants visible at runtime and to leave room for a
future, gated, real-input release line.

> **Current state (0.1.0-beta).** All safety-sensitive flags are
> hard-coded to safe values in `src/feature-flags.js`. There is no
> UI to toggle them, no IPC handler that mutates them, no
> environment variable that flips them. Future versions may persist
> overrides — but only after the requirements in
> `docs/REAL_ACTIONS_GO_NO_GO.md` are met.

---

## Where the flags live

`src/feature-flags.js` defines `FEATURE_FLAGS` as a `Object.freeze`-d
record. It exports three helpers:

- `getFeatureFlags()` — defensive copy.
- `isFeatureEnabled(name)` — `true` only if the named flag is `true`.
- `getFeatureFlagsForDiagnostics()` — grouped by safety stance, used
  by the Advanced → Safety panel and `Copy diagnostics`.

The renderer loads `feature-flags.js` via a plain `<script>` tag in
`src/index.html`, before `renderer.js`. The main process does not
read it; the renderer reads it for display purposes only.

## Shipped flags (0.1.0-beta)

| Flag                  | Value   | Notes                                      |
|-----------------------|---------|--------------------------------------------|
| `realDesktopActions`  | `false` | Hard-coded. Gated by `REAL_ACTIONS_GO_NO_GO`. |
| `ocr`                 | `false` | Hard-coded. Research item, no roadmap line. |
| `imageRecognition`    | `false` | Hard-coded. Research item, no roadmap line. |
| `simulationOnly`      | `true`  | Hard-coded. The runtime invariant.          |
| `globalHotkeys`       | `true`  | Shipped in Step 11 (`globalShortcut`).      |
| `profiles`            | `true`  | Shipped in Step 7.                          |
| `importExport`        | `true`  | Shipped in Step 7.                          |

## Planned future flags (not implemented yet)

These are documented for design alignment. **They are not present
in the codebase.**

| Flag                       | Type    | Notes                                   |
|----------------------------|---------|-----------------------------------------|
| `realDesktopActionsBeta`   | boolean | Per-build override for `0.3.x` private testing. |
| `auditLogsEnabled`         | boolean | Once `AUDIT_LOG_PLAN.md` is implemented. |
| `confirmRealActionsModal`  | boolean | Behaves like a kill switch on the modal. |
| `idlePresenceCheck`        | boolean | OS-level "user is at the keyboard" gate. |
| `wayLandFallback`          | boolean | Linux Wayland adapter mode.             |

## Rules

- **No flag may flip a security invariant from a less-safe to a
  more-safe value silently.** Flipping `realDesktopActions` to
  `true` must trigger the user-confirmation flow described in
  `docs/REAL_ACTIONS_GO_NO_GO.md` §3.
- **No flag may be read from a remote source.** All flags are local.
- **Diagnostics expose flags read-only.** The Advanced → Safety
  panel shows the current values and the `Copy diagnostics` output
  includes them. Neither path can mutate them.
- **Tests must cover the off path.** Whenever a future flag controls
  a destructive capability, the off path is the path that ships by
  default and must have automated coverage before the on path lands.

## How to add a new flag (future)

1. Add the flag to `FEATURE_FLAGS` in `src/feature-flags.js` with a
   safe default value.
2. Update the table in this document.
3. If the flag is safety-sensitive, update
   `docs/REAL_ACTIONS_GO_NO_GO.md` accordingly.
4. Surface the flag in the Advanced → Safety → Feature flags card
   (use `getFeatureFlagsForDiagnostics` so it groups correctly).
5. Add it to the `Copy diagnostics` text in `renderer.js`.
6. Add an i18n key in `src/i18n.js` for the user-visible label.

## What is **not** part of this layer

- Telemetry. ClickFlow does not phone home; flags are not used as
  experiment knobs.
- A/B testing.
- Anything that would persist user-level overrides across machines.
