# ClickFlow `v0.3.0` — Real Adapter Branch Plan (planning only)

> **THIS IS A PLAN, NOT AN IMPLEMENTATION.**
>
> Nothing in this document enables real desktop input. No code in
> this repository performs real clicks. The `v0.3.0` line is a
> **research / planning** branch for a *possible* future, gated
> desktop-action adapter. It will not be implemented until a written
> safety review passes.
>
> **Non-negotiable invariants for any future real-adapter work:**
> - **Real desktop actions must remain disabled until the safety
>   review passes.**
> - **No captcha / anti-bot bypass, no ad-click automation, no
>   banking / payment / protected-application automation — ever.**
> - **The real adapter must be behind a feature flag.**
> - **The action pipeline must block real actions by default.**
>
> Until those conditions are met, ClickFlow stays
> **simulation-only**: `realDesktopActions: false`,
> `simulationOnly: true`, `nodeIntegration: false`,
> `contextIsolation: true`, CSP unchanged.

---

## Goal

Describe, on paper, what a safe real desktop-action adapter *could*
look like, so that:

- The design can be safety-reviewed before any code is written.
- The existing simulation-only layers (feature flags, safety gates,
  adapter interface, adapter registry, action pipeline, dry-run
  sandbox) are reused, not bypassed.
- The blast radius is understood up front: who could be harmed, how
  it is contained, and how it is rolled back.

This document does **not** authorize implementation.

## Why a separate branch

- Keeps the published `0.2.x` smart beta strictly simulation-only.
- Lets the real-adapter research proceed without ever shipping real
  input into a beta artifact.
- Makes the safety review a hard gate: `main` / release branches
  stay safe even while research happens elsewhere.
- Allows the work to be abandoned cleanly (the branch is deleted)
  without touching shipped builds.

## Safety prerequisites

All of these must be satisfied **before** any real action can run.
They extend `docs/REAL_ACTIONS_GO_NO_GO.md`.

1. A written, reviewed safety design for the adapter.
2. An explicit, per-scenario **user confirmation** flow.
3. **Audit logs** of every real action, persisted, with timestamps.
4. A hard-coded **emergency stop** that halts any real-action run
   immediately (Escape, global hotkey, focus-loss option).
5. A **target allowlist** plus a permanent **denylist** for
   restricted application classes (banking / payment / protected).
6. Per-OS **permission** handling and clear user prompts.
7. A passing safety review sign-off recorded in the repo.

## Feature flags

- `realDesktopActions` stays `false` by default and is **not** in
  the runtime-togglable whitelist. Enabling it requires a source
  change plus the safety sign-off.
- Any real-adapter capability sits behind its own dedicated flag
  (e.g. a future `realDesktopAdapter` gate), also defaulting to
  `false`.
- `simulationOnly: true` remains the shipped default. A real build
  would be a separate, clearly-labelled, opt-in artifact — never
  the default download.
- The runtime overlay continues to refuse any attempt to flip a
  safety flag it does not explicitly whitelist.

## Adapter architecture

- Reuse `src/desktop-adapter-interface.js` as the contract. The
  real adapter implements the same interface as the mock adapter.
- `src/adapter-registry.js` keeps `mock` as the default active
  adapter. Selecting a real adapter is blocked unless every safety
  prerequisite is met (mirrors today's `adapter.selection.blocked`
  behavior).
- The real adapter is the **only** place allowed to talk to an OS
  input API, and only after the action pipeline approves the action.
- No real-input native module is added to `package.json` during the
  planning phase. (`robotjs`, `nut.js`, `iohook`, `uiohook-napi`,
  `node-key-sender`, OpenCV, etc. remain absent.)

## OS permissions

- **macOS:** Accessibility + Screen Recording permission prompts;
  the app must degrade gracefully if denied.
- **Windows:** UAC / elevation considerations; never silently
  request elevation.
- **Linux:** Wayland vs X11 differences; document where real input
  is not possible and fail closed.
- In all cases: if a permission is missing, the adapter stays
  unavailable and the pipeline keeps blocking.

## Emergency stop audit

- The existing emergency stop (Escape, `CmdOrCtrl+Alt+E`, in-window
  stop) must short-circuit any real-action loop before the next
  action fires.
- Every emergency stop during a real run is written to the audit
  log with a timestamp and the action index it interrupted.
- A test matrix entry verifies the emergency stop halts a real run
  within one action cycle.

## Audit log persistence

- Today's audit events live in memory only. The real adapter
  requires **persisted** audit logs.
- Logs record: action type, target identity (allowlisted), result,
  timestamp, and the confirming user action.
- Logs must **never** contain secrets, full screenshots, OCR text
  dumps, or PII. Redaction rules are defined before persistence
  ships. See `docs/AUDIT_LOG_PLAN.md`.

## Manual confirmation flow

- Each real-action scenario requires an explicit, per-run user
  confirmation before the first real action.
- The confirmation surface states exactly what will happen, on
  which target, and how to abort.
- No "remember my choice forever" option for real actions.
- The pipeline refuses to start if confirmation is absent.

## Test matrix

| Dimension        | Cases                                            |
|------------------|--------------------------------------------------|
| OS               | Windows, macOS, Linux (X11 + Wayland)            |
| Permission state | granted, denied, revoked mid-run                 |
| Flag state       | `realDesktopActions` false (default), true (gated) |
| Confirmation     | confirmed, cancelled, timed-out                  |
| Emergency stop   | Escape, global hotkey, focus-loss                |
| Target           | allowlisted, non-allowlisted, denylisted         |
| Pipeline         | approves, blocks, blocks-by-default              |

Every "default" / "denied" / "denylisted" / "cancelled" case must
result in **no real action**.

## Rollback plan

- The real adapter is feature-flagged off by default; disabling the
  flag reverts to simulation-only with no migration.
- If a safety problem is found post-release, ship a patch that
  forces the flag off and, if necessary, removes the real adapter
  build entirely.
- Published `0.2.x` artifacts are never retroactively given real
  input; a real build is always a separate, newer, opt-in artifact.
- The research branch can be deleted without affecting any released
  build.

## Disallowed use cases (permanent)

These are out of scope forever and no safety review can authorize
them:

- Captcha solving / bypass.
- Anti-bot system bypass.
- Automated ad clicking.
- Automation against banking, payment, or otherwise protected
  applications.
- Mass surveillance, tracking, or impersonation.

See `docs/KNOWN_LIMITATIONS.md` and `docs/ROADMAP.md`
("Hard rule") for the permanent exclusions.
