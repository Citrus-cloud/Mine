# ClickFlow — Real Desktop Adapter Prototype (Step 47)

> **Status:** Experimental prototype behind a hard safety gate.
> **Disabled by default. Session-only. One click per confirmation.**
> ClickFlow remains simulation-only by default
> (`realDesktopActions:false`, `realCoordinateClick:false`,
> `simulationOnly:true`, `contextIsolation:true`,
> `nodeIntegration:false`, CSP unchanged).

## Purpose

Lay the first *real* desktop action path — a single coordinate click —
behind a strict, auditable safety gate so it can be exercised
manually. Everything else (image/text real clicks, keyboard, scroll,
loops, background automation) stays out of scope.

## Current status

- Main-process module: `main/real-desktop-adapter.js`.
- Optional native backend (`@nut-tree/nut-js` / `nut-js`) is **not**
  declared as a dependency at Step 47. On a stock checkout the backend
  is absent, so the adapter reports **unavailable** and every execute
  call is blocked. `require()` failures never crash the app.
- Renderer reaches the adapter only through three narrow IPC channels;
  there is no generic "run any action" channel.

## Supported action

- `click` (coordinate click) with `realClick: true`, valid
  non-negative `x`/`y`, and `button` ∈ {left, right, middle}.

## Unsupported actions (always blocked)

- `image_click` real mode, `text_click` real mode.
- `key_press`, `hotkey`, `scroll`, standalone `move_mouse`.
- Any loop / repeat of a real click.
- Hidden / background clicks, automation without a visible app.

## Safety gates

A real click runs only if **all** hold (see
`src/safety-gates.js` → `getRealDesktopActionGateStatus`):

- `realDesktopActions` session flag enabled;
- `realCoordinateClick` session flag enabled;
- `safeMode` true; emergency stop enabled;
- audit logs available; adapter available (backend loaded);
- permissions not missing; action type is `click` only;
- explicit per-click user confirmation.

The main process **re-validates** the full context and is the real
authority. "When in doubt, block."

## Session flags

`realDesktopActions` and `realCoordinateClick` are runtime-togglable
**for the session only** (`src/feature-flags.js`). They are never
written to settings/localStorage/disk and reset to `false` on restart.
`realImageClick` / `realTextClick` / keyboard are **not** togglable.

## User confirmation

Two layers: (1) enabling the session shows a modal requiring an
explicit "I understand…" checkbox; (2) **each** test click shows its
own confirmation modal with the coordinates, button, warnings, and the
emergency-stop shortcut. One click per confirmation.

## Audit logs

Events: `realAdapter.availability.checked`,
`realAdapter.session.enabled` / `.disabled`,
`realAction.confirmation.requested` / `.accepted` / `.cancelled`,
`realAction.coordinate.requested` / `.executed` / `.blocked`,
`realAction.disallowed.blocked`, `realAction.safetyGate.failed`. No
screenshots, base64, or filesystem paths are ever logged.

## Emergency stop

Escape and `CmdOrCtrl+Alt+E` remain active. Only a single click runs
per confirmation, so there is no loop to interrupt at Step 47.

## Dependency notes

Recommended backend: `@nut-tree/nut-js` (or `nut-js`). It is **not**
added at Step 47 (the build/network here cannot install it safely). If
you add it later: `npm install`, then `npm run smoke`, then
`npm start`; if it breaks the build, remove it — the adapter stays
unavailable and the app keeps working. Do **not** use
`robotjs` / `iohook` / `uiohook-napi` / OpenCV.

## How to test

See `docs/REAL_CLICK_TESTING_GUIDE.md`. In short: Advanced → Safety
Center → Real adapter prototype → Run safety check → dry-run → enable
session (confirm) → Test real coordinate click (confirm).

## Rollback

Disable the session (one click) or restart the app — both revert to
simulation-only. Removing the optional dependency also reverts to
"unavailable" with no migration.

## Disallowed use cases (permanent)

Captcha/anti-bot bypass, ad-click automation, banking/payment/protected
applications, hidden/background device control, game/service rule
violations, keyloggers/input hooks. No safety review authorizes these.



---

## Step 48 update — stabilization + safety QA

The prototype was hardened (no new action types). Highlights:
- `keyboardAutomation` flag added (hard-coded false, not togglable).
- One click per confirmation enforced; repeats/batches blocked in the
  renderer pipeline **and** re-checked in main.
- Per-click confirmation now requires a checkbox ("I confirm this
  single coordinate click."); confirmation is never reused.
- Emergency-stop readiness is checked before every real click; if not
  ready the click is blocked.
- Stabilized gate `getRealCoordinateClickGateStatus(...)` and explicit
  blocked-reason ids (`getRealDesktopActionBlockReason`).
- Adapter returns a `reason` field; "Test real coordinate click" is
  disabled in the UI when the backend is unavailable.
See `docs/REAL_COORDINATE_CLICK_STABILIZATION.md` and
`docs/REAL_COORDINATE_CLICK_QA.md`.
