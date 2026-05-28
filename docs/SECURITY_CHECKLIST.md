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
