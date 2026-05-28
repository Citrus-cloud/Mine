// =====================================================================
// ClickFlow — action-pipeline.js (Step 17, extended in Step 18)
// ---------------------------------------------------------------------
// Centralized pipeline that every scenario action flows through. It
// validates the action, evaluates safety, picks an execution mode,
// and either simulates the action or blocks a real-action attempt.
//
// Step 18: simulation now flows through the active desktop adapter
// (the mock adapter). The pipeline still NEVER runs a real-action
// adapter. Even if one were somehow active, executeAction() refuses.
//
// IMPORTANT
//   - Real desktop actions are NOT implemented in this build.
//   - executeAction() ALWAYS routes to the simulate path unless the
//     caller explicitly asks for executionMode === "real", in which
//     case the request is blocked with a clear error and an
//     "action.real.blocked" audit event.
//   - There is NO code path in this file that performs real input.
// =====================================================================

// --- Pipeline status snapshot. Used by diagnostics + UI. ---
function getActionPipelineStatus() {
  return {
    simulationOnly: true,
    realActionsEnabled: false,
    realActionsImplemented: false,
    pipelineReady: true
  };
}

// --- Action validation (single source of truth). ---
// The Action schema for 0.1.x is:
//   { type: "click", x: number >= 0, y: number >= 0, button: "left"|"right"|"middle" }
function validateAction(action) {
  if (!action || typeof action !== 'object') {
    return { ok: false, error: 'Action is missing' };
  }
  if (action.type !== 'click') {
    return { ok: false, error: 'Unsupported action type: ' + action.type };
  }
  if (typeof action.x !== 'number' || action.x < 0) {
    return { ok: false, error: 'Invalid x coordinate' };
  }
  if (typeof action.y !== 'number' || action.y < 0) {
    return { ok: false, error: 'Invalid y coordinate' };
  }
  var validButtons = ['left', 'right', 'middle'];
  if (validButtons.indexOf(action.button) === -1) {
    return { ok: false, error: 'Invalid mouse button: ' + action.button };
  }
  return { ok: true };
}

// --- Build a context for an execution run. ---
// `executionMode` is forced to "simulation" so a caller can never
// silently up-grade to real actions. A caller that explicitly passes
// `executionMode: "real"` (e.g. a future test harness) goes through
// the blocked branch in executeAction().
function createActionContext(scenario, settings) {
  return {
    scenarioId: scenario && scenario.id ? scenario.id : null,
    scenarioName: scenario && scenario.name ? scenario.name : null,
    settings: settings || {},
    executionMode: 'simulation',
    pipelineStatus: getActionPipelineStatus(),
    createdAt: new Date().toISOString()
  };
}

// --- Combined safety evaluation: schema + safety-gates. ---
function evaluateActionSafety(action, context) {
  var schema = validateAction(action);
  if (!schema.ok) {
    return { ok: false, errors: [schema.error], warnings: [] };
  }
  // Defer to safety-gates if available.
  if (typeof validateActionSafety === 'function') {
    var gate = validateActionSafety(action, context && context.settings);
    if (!gate.ok) return gate;
    return gate;
  }
  return { ok: true, errors: [], warnings: [] };
}

// --- Hard gate. ALWAYS false on this step. ---
function canExecuteRealAction(/* context */) {
  return false;
}

// --- Simulated execution path. ---
// This is what a normal scenario step calls. No OS input. The result
// shape is intentionally close to what a future real-action adapter
// would return so callers do not need to branch on mode.
function executeSimulatedAction(action, context) {
  // Audit (best-effort, non-fatal if module missing).
  if (typeof recordAuditEvent === 'function') {
    recordAuditEvent('action.simulated', {
      scenarioId: context && context.scenarioId,
      actionType: action.type,
      x: action.x,
      y: action.y,
      button: action.button
    });
  }
  return {
    ok: true,
    mode: 'simulation',
    simulated: true,
    blocked: false,
    action: action,
    timestamp: new Date().toISOString()
  };
}

// --- Block path. Used when a caller asks for executionMode === "real". ---
function blockRealAction(action, context) {
  if (typeof recordAuditEvent === 'function') {
    recordAuditEvent('action.real.blocked', {
      scenarioId: context && context.scenarioId,
      actionType: action && action.type,
      reason: 'realDesktopActions=false; simulationOnly=true'
    });
  }
  return {
    ok: false,
    mode: 'real',
    blocked: true,
    error: 'Real desktop actions are disabled. Dry-run preview is available only.',
    action: action,
    timestamp: new Date().toISOString()
  };
}

// --- Dry-run path (Step 19). ---
// Build a single-action dry-run preview without touching the OS and
// without going through the simulate path. Returns a synthetic result
// that callers can ignore (the click engine never asks for "dry-run").
function executeDryRunAction(action, context) {
  if (typeof recordAuditEvent === 'function') {
    recordAuditEvent('real.sandbox.preview.created', {
      scenarioId: context && context.scenarioId,
      actionType: action && action.type,
      mode: 'pipeline-dry-run'
    });
  }
  return {
    ok: true,
    mode: 'dry-run',
    simulated: false,
    realExecution: false,
    blocked: false,
    action: action,
    timestamp: new Date().toISOString()
  };
}

// --- Public entry point used by the click-engine. ---
// Routing rules:
//   - missing/empty executionMode    -> simulate via active adapter
//   - "simulation" or "simulate"     -> simulate via active adapter
//   - any other value (incl. "real") -> block
// We also re-check schema before dispatching so a malformed action
// never reaches even the simulate path.
//
// Step 18: simulate path goes through the adapter registry. If the
// active adapter is the mock adapter, executeMockAction() runs. If
// somehow the active adapter were a real-action adapter (it cannot
// be in 0.1.x — adapter-registry.js refuses to activate it), the
// pipeline still rejects via blockRealAction().
function executeAction(action, context) {
  var schema = validateAction(action);
  if (!schema.ok) {
    if (typeof recordAuditEvent === 'function') {
      recordAuditEvent('safety.validation.failed', {
        scenarioId: context && context.scenarioId,
        reason: schema.error
      });
    }
    return {
      ok: false,
      mode: 'rejected',
      blocked: false,
      error: schema.error,
      action: action,
      timestamp: new Date().toISOString()
    };
  }

  var mode = (context && typeof context.executionMode === 'string')
    ? context.executionMode
    : 'simulation';

  // Step 19: dry-run path takes priority, never reaches the OS.
  if (mode === 'dry-run') {
    return executeDryRunAction(action, context);
  }

  if (mode === 'simulation' || mode === 'simulate' || mode === '') {
    // Step 18: defensive — never use an adapter that claims real actions.
    if (typeof getActiveAdapter === 'function') {
      var active = getActiveAdapter();
      if (active && (active.realActions === true || active.type === 'real')) {
        return blockRealAction(action, context);
      }
      // Route through the mock adapter when registered.
      if (active && active.id === 'mock' && typeof executeMockAction === 'function') {
        var mockResult = executeMockAction(action, context);
        // Keep the existing action.simulated audit event for parity
        // with Step 17 callers; the adapter itself records
        // adapter.mock.executed.
        if (typeof recordAuditEvent === 'function') {
          recordAuditEvent('action.simulated', {
            scenarioId: context && context.scenarioId,
            actionType: action.type,
            x: action.x,
            y: action.y,
            button: action.button,
            adapter: 'mock'
          });
        }
        return {
          ok: !!mockResult.success,
          mode: 'simulation',
          simulated: true,
          blocked: false,
          action: action,
          timestamp: mockResult.timestamp || new Date().toISOString(),
          adapter: 'mock'
        };
      }
    }
    // Fallback: legacy simulate path (no adapter registered yet).
    return executeSimulatedAction(action, context);
  }

  // Anything that is not the simulate path is blocked. This includes
  // an explicit "real" request and any unknown / typo'd mode name.
  return blockRealAction(action, context);
}
