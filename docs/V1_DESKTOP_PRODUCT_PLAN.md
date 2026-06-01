# ClickFlow Desktop v1 — Product Plan

> **Status:** Step 46 — Desktop v1 architecture + safety foundation.
>
> This document describes the *target* shape of ClickFlow Desktop v1.
> It is an architectural plan. **Step 46 adds no real system clicks.**
> ClickFlow is still simulation-only: `realDesktopActions: false`,
> `simulationOnly: true`, `contextIsolation: true`,
> `nodeIntegration: false`, CSP unchanged. The action pipeline keeps
> rejecting every `realClick: true`.

---

## Product goal

Give a user a safe, transparent, local-only desktop automation tool
that can eventually perform **real** mouse/keyboard actions — but only
behind explicit, auditable safety gates, with a one-keystroke
emergency stop, and never for abusive use cases. Until the safety
review passes, every "action" is a simulation/preview.

## Desktop v1 scope

- **Desktop first.** Windows, macOS, Linux (X11; Wayland documented
  as limited).
- Real coordinate `click`, `image_click`, and `text_click` — each
  gated, opt-in, confirmed, and audited.
- A Safety Center that makes the current mode and readiness obvious.
- Persistent, redacted audit logs.
- A permission/readiness model per OS.

> **Platform ordering:** Desktop v1 first. **Android is a later,
> separate research branch** (`v1-android-research`). **iOS is
> intentionally limited** — the OS does not allow general
> cross-application input automation, so iOS is out of scope beyond a
> possible read-only companion concept.

## What is included

- Desktop v1 architecture, safety model, and readiness surfaces.
- Real desktop adapter **interface** (contract only; execution
  disabled).
- Action pipeline v1 readiness (action-type taxonomy + uniform result
  shape + multi-condition real-mode gate that blocks by default).
- Persistent audit log design + in-memory manager.
- Permission manager (status/guidance only).
- Safety Center + V1 readiness diagnostics.
- Scenario metadata migration to `version: 1` + run summaries.

## What is excluded

- **No real system clicks in this build.**
- No `robotjs`, `nut.js`, `iohook`, `uiohook-napi`, OpenCV /
  `opencv.js`.
- No mobile version, no real mouse/keyboard control, no hidden/remote
  device control.
- **No captcha solving/bypass, no anti-bot bypass, no ad-click
  automation, no banking/payment/protected-application automation.**
  These are permanently out of scope.

## Safety model

Defense in depth — multiple independent layers, all of which must
agree before any real action could run (none can today):

1. `feature-flags.js` — `realDesktopActions:false`, `simulationOnly:true`.
2. `safety-gates.js` — `isRealActionAllowed()` hard-coded `false`.
3. `real-desktop-adapter-interface.js` — every `executeReal*` blocks.
4. `adapter-registry.js` — real adapter cannot be activated.
5. `action-pipeline.js` — real mode blocked by default; needs a full
   multi-condition gate to even be considered.
6. Persistent **audit logs** + **emergency stop** + per-run **user
   confirmation** (designed, not yet enabling real input).

See `docs/V1_SAFETY_MODEL.md`.

## Real desktop adapter architecture

The real adapter implements the same contract as the mock adapter
(`desktop-adapter-interface.js`). It is the only place permitted to
talk to an OS input API, and only after the pipeline approves. In
Step 46 the interface exists (`real-desktop-adapter-interface.js`) but
`checkRealAdapterAvailability()` returns unavailable/disabled and
every `executeReal*` returns a blocked result. See
`docs/V1_REAL_ADAPTER_REQUIREMENTS.md` and
`docs/NUTJS_INTEGRATION_PLAN.md`.

## Action pipeline

Uniform action result for every mode:

```
{ success, mode: "simulation"|"real"|"dry-run", simulated,
  realAction, action, result, error, timestamp }
```

Action types: `click`, `image_click`, `text_click`, `wait` (active);
`move_mouse`, `scroll`, `key_press`, `hotkey` (planned/disabled).
Real mode requires ALL of: `realDesktopActions` flag, explicit user
confirmation, `safeMode`, emergency stop enabled, audit logs enabled,
adapter available, permission check passed. Missing any → blocked +
audit + friendly error. See `docs/V1_ACTION_PIPELINE.md`.

## Visual actions

Visual Builder stays **drafts-only**: it composes scenarios (coords,
regions, templates, target text) and never auto-saves, auto-runs, or
clicks. In v1 it gains a clear "this will perform a real action once
enabled" banner, but the gate is unchanged.

## OCR actions

OCR has a mock engine (default) and an optional session-scoped real
Tesseract provider. **OCR never clicks.** `text_click` consumes OCR
output to build a simulated action only.

## Image matching actions

Template matching analyzes the captured *preview* image (not the live
screen), produces a target point, and feeds `image_click` as a
simulation. No live-screen pixel access, no real cursor movement.

## Emergency Stop

Escape, `CmdOrCtrl+Alt+E`, and the in-window stop all halt a run. In
v1, every emergency stop during a (future) real run is audited and
must interrupt before the next action.

## Audit logs

Redacted, persisted, append-only history of safety-relevant events.
**Never** stores screenshots, base64/`imageDataUrl`, private
filesystem paths, or PII. See `docs/V1_AUDIT_LOGS.md`.

## Permissions

Per-OS readiness checks (screen capture, accessibility, input
monitoring) plus app-level prerequisites (adapter availability, safe
mode, emergency stop, audit logs). Status/guidance only — no
"Enable Real Clicks" button. See `docs/V1_PERMISSION_MODEL.md`.

## Release plan

- `main` — stable smart beta (`v0.2.0-smart-beta`), simulation-only.
- `hotfix/v0.2.x` — smart-beta bugfixes (no real clicks).
- `v1-desktop` — real desktop automation work; real actions enabled
  only after the safety review passes.
- `v1-android-research` — Android future research.

See `docs/FULL_PRODUCT_BRANCH_PLAN.md` and
`docs/V1_RELEASE_CRITERIA.md`.

## Android future branch

Android is researched later on `v1-android-research`. Android imposes
strong restrictions on cross-app automation (Accessibility Service
policies, Play Store rules). Any Android work is its own safety review
and its own release line. iOS is limited by design and is not a
target beyond a possible read-only companion.
