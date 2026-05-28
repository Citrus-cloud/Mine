# ClickFlow — Security Checklist

## Electron Security

- [x] `contextIsolation: true`
- [x] `nodeIntegration: false`
- [x] No `remote` module usage
- [x] No direct `ipcRenderer` exposure in renderer
- [x] CSP header in index.html
- [x] No `eval()` usage
- [x] User text rendered via `textContent` (never `innerHTML`)
- [x] File operations exclusively in main process
- [x] JSON import validated before use
- [x] Settings JSON normalized and validated
- [x] `preload.js` exposes only safe wrappers via `contextBridge`
- [x] No shell commands executed from renderer
- [x] No external URLs loaded

## Automation Safety

- [x] Simulation-only execution (no real OS clicks)
- [x] No mouse/keyboard control library installed
- [x] No OCR or image recognition
- [x] No CAPTCHA or anti-bot bypass
- [x] Emergency stop available (Escape + CmdOrCtrl+Alt+E)
- [x] Safety limits enforced (minInterval, maxRepeat)
- [x] Quit confirmation when execution is running
- [x] **Step 17:** Real desktop actions disabled (`feature-flags.js → realDesktopActions: false`)
- [x] **Step 17:** `src/action-pipeline.js` blocks any `executionMode === "real"` request with the explicit error `Real desktop actions are disabled in this build` and emits an `action.real.blocked` audit event
- [x] **Step 17:** `src/safety-gates.js` exposes the gate predicates; `isRealActionAllowed()` is hard-coded to return `false`
- [x] **Step 17:** `src/audit-events.js` provides an in-memory audit event model (no file persistence yet); allowlist only — no PII, no paths
- [x] **Step 17:** `npm run smoke` verifies action-pipeline / safety-gates / feature-flags sources contain the simulation-only invariants and that `package.json` declares no real-input modules (including `uiohook-napi`)
- [x] **Step 18:** Mock adapter only (`src/mock-desktop-adapter.js`) — the only `available: true` adapter in the registry, `realActions: false`, `simulationOnly: true`
- [x] **Step 18:** Real adapter unavailable — `src/adapter-registry.js` lists `real-desktop` as `available: false`, `planned: true`, with `disabledReason` set
- [x] **Step 18:** Adapter registry blocks real adapter — `setActiveAdapter("real-desktop")` returns `{ success: false, blocked: true, ... }` and emits `adapter.selection.blocked` + `adapter.real.unavailable`
- [x] **Step 18:** `src/desktop-adapter-interface.js`'s `isRealAdapterAllowed()` is hard-coded to return `false`
- [x] **Step 18:** No real-input dependencies — `package.json` declares no `robotjs` / `nut.js` / `iohook` / `uiohook-napi` / `node-key-sender` (verified by `npm run smoke`)
- [x] **Step 19:** Dry-run only — `src/real-action-sandbox.js` performs **no** OS input. `evaluateRealActionReadiness()` always returns `{ allowed: false, ... }`; `confirmDryRunPlan()` returns `realExecution: false`; the new `executionMode === "dry-run"` path in `action-pipeline.js` never invokes any adapter
- [x] **Step 19:** Pipeline block message for real mode is `Real desktop actions are disabled. Dry-run preview is available only.`
- [x] **Step 19:** Audit allowlist gained six sandbox event types (`real.sandbox.preview.created`, `real.sandbox.dryrun.confirmed`, `real.sandbox.dryrun.cancelled`, `real.sandbox.blocked`, `real.permission.checklist.created`, `real.blocked.reason.generated`); payloads carry only ids and counts (no PII, no paths)

## Global Hotkeys

- [x] Registered via main process `globalShortcut`
- [x] Unregistered on `will-quit`
- [x] Renderer receives only events, no direct Electron API access

## Data Storage

- [x] User data in `app.getPath('userData')` only
- [x] No sensitive data stored
- [x] No network requests
- [x] Export files contain only scenario/settings data

## Packaging

- [ ] Code signing (planned)
- [ ] Auto-update (planned)
- [x] App metadata configured


## Final release security (Step 22)

Run this before every public release tag. All items must be `[x]`.

- [ ] Prohibited dependencies absent from `package.json`:
      `robotjs`, `nut.js`, `iohook`, `uiohook-napi`,
      `node-key-sender`. (Verified by `npm run smoke`.)
- [ ] No real desktop action adapter is bundled. The
      `real-desktop` entry in `src/adapter-registry.js` is
      registered as `available: false, planned: true` with a
      non-null `disabledReason`. (Verified by `npm run smoke`.)
- [ ] Action pipeline blocks `executionMode: "real"` with the
      literal message
      `Real desktop actions are disabled. Dry-run preview is
      available only.`. (Verified by `npm run smoke`.)
- [ ] Real-action sandbox is dry-run only.
      `evaluateRealActionReadiness()` returns `allowed: false`,
      `confirmDryRunPlan()` returns `realExecution: false`.
      (Verified by `npm run smoke`.)
- [ ] Mock adapter only — self-test 4 / 4 passing on the build
      host. (Verified manually.)
- [ ] No OCR engine, no OpenCV, no `sharp`-based template
      matching is bundled or imported.
- [ ] Electron security settings checked — `contextIsolation: true`,
      `nodeIntegration: false`, CSP unchanged. (Verified by
      `npm run smoke`.)
- [ ] `preload.js` does not expose `ipcRenderer` directly. The
      smoke check `preload.js does not expose ipcRenderer
      directly` is `OK`.
- [ ] `Copy diagnostics` output contains `Simulation only: true`
      and the `Sandbox: realActionsAllowed=false`,
      `Adapter: active=mock, ...realActionsAllowed=false`,
      `Release: ..., releaseDocsReady=true` lines on the build
      host.
- [ ] Release artifacts are verified manually on the target OS
      per `docs/BUILD_ARTIFACTS.md` §7 before they are uploaded
      to GitHub.
