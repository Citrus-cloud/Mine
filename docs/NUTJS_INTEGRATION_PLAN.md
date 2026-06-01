# ClickFlow — nut.js Integration Plan (planning only)

> **Status:** Step 46 — **plan only**. **nut.js is NOT added as a
> dependency in this step.** Nothing here changes the build. ClickFlow
> stays simulation-only.

---

## Why nut.js

`nut.js` is a cross-platform (Windows/macOS/Linux) Node desktop
automation library that could back the future real desktop adapter
(mouse move/click, keyboard, screen). It is a candidate because it is
actively maintained, has a single high-level API, and matches the
adapter interface contract.

## Installation risks

- Native dependencies / prebuilt binaries per OS+arch; install can
  fail offline or on unusual platforms.
- Larger install footprint and longer packaging times.
- Must be an **optional** path so a missing/failed install degrades to
  simulation-only rather than breaking the app.

## Platform notes

- **Windows:** generally works; consider UAC-elevated targets.
- **macOS:** requires Accessibility + (for screen) Screen Recording
  permissions; must prompt and degrade gracefully if denied.
- **Linux:** X11 supported; **Wayland is restricted** — document as
  limited / unsupported for real input.

## Build risks

- electron-builder must bundle native binaries correctly per target;
  rebuilds against the Electron ABI required.
- Risk of breaking `npm run dist`. Mitigation: keep nut.js out of the
  default build; gate behind the `v1-desktop` branch and a feature
  flag; never block packaging on it.

## Adapter design

- A `RealDesktopAdapter` implements the same contract as the mock
  adapter and wraps nut.js calls.
- The adapter is registered but `available:false` until the safety
  review passes and the native module loads successfully at runtime.
- All calls flow through `action-pipeline.js`, which blocks real mode
  by default.

## Safety gates

- `realDesktopActions` flag (default false, not runtime-togglable),
  explicit per-run confirmation, `safeMode`, emergency stop, audit
  logs, permission checks — ALL required before a real call.
- Target allowlist + permanent denylist (banking/payment/protected).

## Rollback plan

- nut.js lives behind a feature flag and an optional dependency;
  disabling the flag reverts to simulation-only with no migration.
- If a native or safety problem appears, ship a patch forcing the flag
  off and, if needed, removing the real build artifact.

## Alternative if nut.js fails

- Evaluate per-OS native approaches behind the same adapter interface
  (e.g. platform-specific helpers), or defer real input entirely.
- The adapter interface insulates ClickFlow from the choice of
  backend, so swapping libraries does not ripple through the app.
