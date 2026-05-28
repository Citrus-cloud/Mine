# ClickFlow — Desktop Action Adapter Plan

## 1. Purpose

The Desktop Action Adapter will be a future module responsible for executing real system-level actions (mouse clicks, keyboard input) on behalf of the user. Currently, ClickFlow operates in **simulation mode only** — no real OS interactions occur.

## 1.5. Step 17 preparation (current state)

Step 17 introduced the architectural scaffolding the future adapter will plug into. **No real input is performed.** What was added:

- **`src/action-pipeline.js`** — every action emitted by the click engine now flows through `executeAction(action, context)`. The pipeline validates the schema, evaluates safety, picks a mode, and dispatches:
  - `executionMode === "simulation"` (or empty / `"simulate"`) → `executeSimulatedAction()` — the only path implemented.
  - any other value, including `"real"` → `blockRealAction()` with the explicit error `Real desktop actions are disabled in this build` and an `action.real.blocked` audit event.
  - `canExecuteRealAction()` is hard-coded to return `false`.
  - `getActionPipelineStatus()` returns `{ simulationOnly: true, realActionsEnabled: false, realActionsImplemented: false, pipelineReady: true }`.
- **`src/safety-gates.js`** — central safety predicate layer:
  - `getSafetyGateStatus(settings)` for diagnostics.
  - `validateScenarioSafety(scenario, settings)` and `validateActionSafety(action, settings)` returning `{ ok, errors, warnings }`.
  - `getRealActionRequirements()` and `getMissingRealActionRequirements(settings)` — the contract the future adapter must satisfy.
  - `isSimulationAllowed(settings)` returns `true` for valid settings; `isRealActionAllowed(settings)` is hard-coded `false`.
- **`src/audit-events.js`** — in-memory audit event store with a fixed allowlist (`scenario.start.requested`, `scenario.start.approved`, `scenario.stop.requested`, `scenario.completed`, `emergency.stop`, `action.simulated`, `action.real.blocked`, `safety.validation.failed`, `settings.changed`, `import.completed`, `export.completed`). **No file persistence in this step** — file-based logs are tracked separately in `AUDIT_LOG_PLAN.md`.
- The Advanced → Safety panel now shows four new cards: **Action pipeline**, **Safety gates**, **Real actions readiness** (9-row checklist), and **Audit events** (count + last event).
- `Copy diagnostics` includes new lines for `Action pipeline`, `Safety gates`, and `Audit events`.

When the future real-input branch lands, it will subscribe to `executeAction()` for `executionMode === "real"`. Until every requirement in `REAL_ACTIONS_GO_NO_GO.md` is met, that branch will continue to be the `blockRealAction()` path.

## 2. Why Real Clicks Are NOT Implemented Yet

- Architecture validation is still in progress
- Safety mechanisms need thorough testing in simulation first
- Emergency stop reliability must be proven
- Audit logging is not yet implemented
- User confirmation flow is not finalized
- OS permission handling is not built
- Legal and ethical review of use cases is required

## 3. Security Requirements Before Enabling

Before any real desktop action can be executed, ALL of the following must be true:

1. `executionMode === "real"` explicitly set by user
2. `safeMode === true` (safety limits active)
3. User has confirmed the action via explicit dialog
4. Emergency stop is enabled and tested
5. Scenario has passed full validation
6. Safety limits (minInterval, maxRepeat) are enforced
7. Adapter availability has been verified
8. OS permissions have been granted (accessibility permissions on macOS, etc.)
9. Audit log is recording all actions

## 4. Future Execution Flow

```
User clicks Start
  → renderer.js: startScenario()
  → click-engine.js: runScenario(scenario, callbacks, options)
  → For each iteration:
      → buildClickActionFromScenario(scenario)
      → IF executionMode === "simulation":
          → simulateClick(action) — current behavior, no OS action
      → IF executionMode === "real":
          → preload.js: window.clickflow.desktop.executeAction(action)
          → IPC: "desktop:execute-action"
          → main.js: validates action, checks permissions
          → desktop-adapter.js (main process): performs OS action
          → Returns result to renderer via IPC
```

## 5. Why Renderer Must NOT Have Node.js Access

- Renderer process handles untrusted user input (scenario names, descriptions)
- Direct Node.js access would allow arbitrary file system or OS access
- contextBridge + IPC ensures every action is validated in main process
- Main process is the last line of defense for safety validation

## 6. Pre-Flight Checks Before Real Click

Before `desktop-adapter.js` executes any OS action, main.js must verify:

- [ ] executionMode is "real"
- [ ] safeMode is true
- [ ] User confirmation was received for this session
- [ ] Emergency stop is enabled
- [ ] Scenario passed validation
- [ ] Action coordinates are within screen bounds
- [ ] Interval respects minIntervalMs
- [ ] Repeat count respects maxRepeatCount
- [ ] Adapter module is available and loaded
- [ ] OS permissions are granted
- [ ] Audit log entry is created BEFORE action

## 7. What Must NEVER Be Automated

ClickFlow must NOT be used for:

- Bypassing CAPTCHA or anti-bot systems
- Clicking ads or manipulating ad revenue
- Automating banking, payment, or financial applications
- Automating actions in protected/secured windows
- Hidden or background automation without user awareness
- Violating terms of service of games or online platforms
- Mass registration, spam, or credential stuffing
- Surveillance or tracking without consent

## 8. Possible Libraries (Future Evaluation)

| Library | Platform | Notes |
|---------|----------|-------|
| @nut-tree/nut-js | Win/Mac/Linux | Modern, maintained, TypeScript |
| robotjs | Win/Mac/Linux | Older, native compilation issues |
| xdotool (via child_process) | Linux only | CLI-based |

Selection criteria:
- Cross-platform support
- Active maintenance
- Electron compatibility
- No excessive permissions
- Minimal native dependency issues

## 9. Implementation Plan (Future Steps)

1. **Step N**: Add `desktop-adapter.js` in main process (skeleton only)
2. **Step N+1**: Add IPC channel `desktop:execute-action` with full validation
3. **Step N+2**: Add user confirmation dialog before first real action
4. **Step N+3**: Add OS permission check (macOS accessibility, etc.)
5. **Step N+4**: Add audit log file writing
6. **Step N+5**: Integrate with click-engine via `executionMode` switch
7. **Step N+6**: Testing with real clicks in controlled environment
8. **Step N+7**: Add rollback/disable mechanism

## 10. Rollback Plan

If real clicks cause issues:

1. Set `executionMode = "simulation"` immediately
2. Emergency stop terminates any ongoing execution
3. Adapter can be completely disabled without affecting simulation mode
4. Settings reset returns to safe defaults
5. Uninstalling the adapter library removes all real-click capability

## 11. Audit Log Concept

Future audit log will record:

| Field | Description |
|-------|-------------|
| timestamp | ISO date of action |
| actionType | click, doubleClick, keyPress, etc. |
| coordinates | x, y (for mouse actions) |
| button | left, right, middle |
| scenarioId | Which scenario triggered this |
| scenarioName | Human-readable name |
| executionMode | simulation or real |
| userConfirmed | Whether user explicitly confirmed |
| result | success, failed, blocked |
| reason | Why blocked (if applicable) |

Audit logs will be stored in userData and will NOT contain personal data beyond action descriptions.
