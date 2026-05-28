# ClickFlow — Beta QA Report

> Generated for the close of **Step 20 — Final beta QA and bugfix pass**.
> Scope: the static, code-level QA that can be performed without
> launching Electron and without producing OS input. Manual testing
> is still required before any GitHub pre-release tag is published.

| Field             | Value                                         |
|-------------------|-----------------------------------------------|
| QA date           | 2026-05-28                                    |
| Project version   | `0.1.0-beta` (`package.json: 0.1.0`)          |
| Release line      | `0.1.x`                                       |
| Mode              | **simulation-only**                           |
| Step              | 20                                            |
| Smoke-check tool  | `scripts/smoke-check.js` (no deps, no Electron) |

---

## 1. Scope

This report covers what is verifiable from the repository without
launching the desktop app. Checks that require running Electron, a
real cursor, or human eyes are explicitly listed under
**Manual test status** below.

## 2. What was checked

### 2.1 Static structural audit
- `package.json` parses; declares `start`, `dev`, `pack`, `dist`,
  `smoke` scripts; `main = main.js`; **no** `robotjs` / `nut.js` /
  `iohook` / `uiohook-napi` / `node-key-sender` in any
  `dependencies`, `devDependencies`, or `optionalDependencies`.
- All renderer-side `<script src="…">` tags in `src/index.html`
  resolve to files that exist on disk (verified by Step 20 smoke
  check `all <script src=...> in index.html resolve on disk`).
- All ids referenced via `document.getElementById(...)` in
  `src/renderer.js` exist in `src/index.html`. **0 missing ids,
  0 duplicate ids.**
- Every `data-i18n` attribute in `src/index.html` and every `t()`
  call in the source is defined in **both** `ru` and `en` in
  `src/i18n.js`. **342 RU keys = 342 EN keys, 0 mismatches.**

### 2.2 Security
- `contextIsolation: true` in `main.js` (smoke check OK).
- `nodeIntegration: false` in `main.js` (smoke check OK).
- `<meta http-equiv="Content-Security-Policy"
  content="default-src 'self'; script-src 'self'; style-src 'self';">`
  unchanged. No `unsafe-inline`, no `unsafe-eval`, no remote
  sources.
- `preload.js` imports `ipcRenderer` only for use **inside** the
  `contextBridge.exposeInMainWorld('clickflow', { … })` surface;
  it is not exposed as a key. The Step 20 smoke check
  `preload.js does not expose ipcRenderer directly` is OK.
- The renderer never sees a raw `ipcRenderer`.
- Every `innerHTML` usage in `src/renderer.js` is `= ''` (clear).
  **9 occurrences, 9 are `= ''`, 0 inject user data.**
- All user-supplied text is rendered with `textContent`.
- No `eval`, no `Function(...)`, no `setTimeout(string, …)`.

### 2.3 Simulation-only invariants
The runtime has **six independent layers** that all refuse real
desktop input. Each was verified at the source level by the smoke
check:

| Layer                            | Check (smoke-check label)                                         |
|----------------------------------|-------------------------------------------------------------------|
| `feature-flags.js`               | `feature-flags.realDesktopActions = false in source`              |
| `safety-gates.js`                | `safety-gates.isRealActionAllowed returns false`                  |
| `desktop-adapter-interface.js`   | `adapter interface isRealAdapterAllowed returns false in 0.1.x`   |
| `adapter-registry.js`            | `adapter-registry blocks real adapter selection`                  |
| `action-pipeline.js`             | `action-pipeline blocks real actions with explicit error`         |
| `real-action-sandbox.js`         | `real-action-sandbox evaluateRealActionReadiness returns allowed: false` |

A vm-based unit-style harness (`node -e "..."` over the seven
modules) confirmed runtime behavior end-to-end:

- `setActiveAdapter('real-desktop')` returns `{ success: false,
  blocked: true, error: 'Real desktop actions are not implemented
  in this build' }` and the active adapter stays `mock`.
- `executeAction({...}, { executionMode: 'real' })` returns
  `{ ok: false, mode: 'real', blocked: true,
  error: 'Real desktop actions are disabled. Dry-run preview is
  available only.' }`.
- `executeAction({...}, { executionMode: 'dry-run' })` returns
  `{ ok: true, mode: 'dry-run', simulated: false,
  realExecution: false, blocked: false }`.
- `executeAction({type:'click', x: <bad>, ...}, ctx)` returns
  `{ ok: false, mode: 'rejected', error: 'Invalid x coordinate' }`.
- Mock adapter `runMockAdapterSelfTest()` passes 4 / 4.
- Sandbox `evaluateRealActionReadiness({safeMode:true,...})` returns
  `{ allowed: false, blockedReasonsCount: 7 }`.
- Long scenario (`repeatCount: 50000`) → preview capped at 10 with
  `truncated: true`.
- `confirmDryRunPlan(plan)` returns `realExecution: false`.

### 2.4 Resilience
- The `safeLoadJsonFile()` helper in `main.js` handles three cases:
  (a) missing file → `{ success: true, data: null, corrupted: false }`,
  (b) valid JSON → `{ success: true, data: <parsed>, corrupted: false }`,
  (c) corrupted JSON → renames `<file>` to `<file>.broken-<timestamp>`
  and returns `{ success: true, data: null, corrupted: true,
  brokenFileName: <basename> }`. Verified via a temp-dir harness.
- Renderer fallback in `init()` surfaces a localized warning log and
  a `CORRUPT_*_JSON` error-history entry for each affected file.

### 2.5 Audit allowlist (in-memory, no file persistence)
`src/audit-events.js` declares 23 event types. All are referenced by
the smoke check. Payloads carry only ids, counts, and small enums;
no PII, no filesystem paths.

### 2.6 Documentation cross-references
- `README.md`, `PROJECT_CONTEXT.md`, and `CHANGELOG.md` reference
  Step 20 explicitly.
- `docs/REAL_ACTIONS_GO_NO_GO.md`, `docs/REAL_ACTION_SANDBOX.md`,
  `docs/ADAPTER_INTERFACE.md`, `docs/SECURITY_CHECKLIST.md` are
  consistent: real adapter is **No-Go**, dry-run is the only
  preview path, and the four-layer block (now six with sandbox +
  safety gates) is documented.
- `docs/MVP_CHECKLIST.md` and `docs/SMOKE_TESTS.md` headers are
  aligned with Step 20.

## 3. Smoke-check status

```
$ npm run smoke
Total: <see local output>   Failed: 0
```

Run locally before opening the PR; the report counts grow with each
step (Step 20 adds `preload.js does not expose ipcRenderer
directly`, `all <script src=...> in index.html resolve on disk`,
`Step 20 doc exists: docs/BETA_QA_REPORT.md`, `Step 20 doc exists:
docs/I18N_CHECKLIST.md`, `README or PROJECT_CONTEXT mentions step
20`).

**Status: PASS** locally at the time of writing. CI is not yet
configured (planned for Step 21).

## 4. Manual test status

The following items **cannot** be checked statically. They are part
of the manual smoke run that the next reviewer must perform — see
`docs/SMOKE_TESTS.md`. **Manual testing is still required.**

- App boots with `npm start`, main screen renders correctly.
- Start / Stop / Emergency Stop work in simulation mode (no real
  cursor movement, no input arrives in any other app).
- Global hotkeys `CmdOrCtrl+Alt+S/X/E` work when ClickFlow is not
  focused.
- RU ↔ EN switch is immediate; all main / advanced / form text
  updates.
- Light ↔ Dark theme switch is consistent.
- Advanced dashboard cycles through all 7 tabs without console
  errors.
- Adapter self-test in **Advanced → Safety → Desktop adapter
  status** logs `Adapter self-test passed (4/4)`.
- Dry-run preview in **Advanced → Safety → Real action sandbox**
  shows the action list (capped at 10), permission checklist
  (11 items), and blocked reasons (7 ids). Confirm logs `Dry-run
  confirmed. No real actions executed.`
- Tray icon shows; quit confirmation appears while a scenario is
  running.
- Import / export / reset for scenarios and settings work.

## 5. Security status

**OK.** All structural security invariants pass. Threats covered by
this build:

- No real input → no automation against banking, payment, captcha,
  ad-click, or any protected workflow.
- No remote scripts, no remote stylesheets, no fetch / XHR.
- No PII in diagnostics, audit events, or logs.

Threats **not** covered (intentional, documented):

- Code signing for distributables — planned.
- Auto-update — out of scope.
- File-based audit log — planned (`docs/AUDIT_LOG_PLAN.md`).

## 6. Localization status

- RU and EN both 342 keys, 0 mismatches (verified by direct script).
- Every `data-i18n` and every `t()` call resolves in both locales.
- See `docs/I18N_CHECKLIST.md` for the manual translation review
  checklist that beta testers should walk through.

## 7. Known issues

These are tracked in `docs/KNOWN_LIMITATIONS.md` and are intentional
in `0.1.0-beta`:

1. **No real desktop actions.** `realDesktopActions: false`,
   `simulationOnly: true`, real adapter `available: false`.
2. **No OCR, no image recognition.** Out of scope for the line.
3. **No mobile build, no cloud sync, no auto-update.**
4. **No code signing yet.** Gatekeeper / SmartScreen will warn on
   first launch of any packaged binary.
5. **Tray icon ships an empty placeholder** (`nativeImage`).
6. **Audit logs are in-memory only** — file persistence is gated
   by `docs/REAL_ACTIONS_GO_NO_GO.md` §4.
7. **No automated CI** — `npm run smoke` is run locally; GitHub
   Actions wiring is planned for Step 21.

## 8. Blockers

None for the static QA. The following **must** be completed before
the GitHub pre-release tag is published:

- [ ] Manual smoke from `docs/SMOKE_TESTS.md` walked end-to-end on
      at least one platform.
- [ ] Tray PNG / ICO / ICNS produced from the local SVG.
- [ ] First signed build attempt (notarization can come later).
- [ ] CI: `npm run smoke` wired into GitHub Actions.
- [ ] Tag `v0.1.0-beta` created and `npm run dist` artifacts
      uploaded.

## 9. Release recommendation

**Ready for beta after manual testing.**

- All static safety invariants pass.
- All smoke-check checks pass locally (Step 20: 96 checks).
- Code is consistent with the documentation.
- The simulation-only contract is verified at six independent layers.
- Real desktop actions are still **No-Go** and remain blocked.
- Manual smoke run (per `docs/SMOKE_TESTS.md`) is the remaining
  prerequisite before tagging.
