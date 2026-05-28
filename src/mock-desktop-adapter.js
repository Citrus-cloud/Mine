// =====================================================================
// ClickFlow — mock-desktop-adapter.js (Step 18)
// ---------------------------------------------------------------------
// Safe mock implementation of the desktop adapter contract defined in
// `desktop-adapter-interface.js`. Every method here is pure: NO OS
// input is ever produced.
//
// IMPORTANT
//   - This adapter is `realActions: false`, `simulationOnly: true`.
//   - `executeMockAction()` only validates and returns a structured
//     result; it never moves the cursor or presses keys.
//   - It is the only `available: true` adapter in the registry.
// =====================================================================

function getMockAdapterInfo() {
  return {
    id: 'mock',
    name: 'Mock Desktop Adapter',
    type: 'mock',
    version: 1,
    realActions: false,
    simulationOnly: true,
    contract: (typeof getAdapterContract === 'function') ? getAdapterContract() : null
  };
}

function checkMockAdapterAvailability() {
  return { available: true, reason: null };
}

// Validate-then-record-then-return. No real input.
function executeMockAction(action, context) {
  var v = (typeof validateAdapterAction === 'function')
    ? validateAdapterAction(action)
    : { ok: true };
  if (!v.ok) {
    return {
      success: false,
      mode: 'mock',
      simulated: true,
      action: action,
      error: v.error,
      timestamp: new Date().toISOString(),
      adapter: 'mock-desktop-adapter'
    };
  }
  if (typeof recordAuditEvent === 'function') {
    recordAuditEvent('adapter.mock.executed', {
      scenarioId: context && context.scenarioId,
      actionType: action.type,
      x: action.x,
      y: action.y,
      button: action.button
    });
  }
  return {
    success: true,
    mode: 'mock',
    simulated: true,
    action: action,
    timestamp: new Date().toISOString(),
    adapter: 'mock-desktop-adapter'
  };
}

// Self-test: validates the contract end-to-end without touching the OS.
// Returns:
//   { success: true,  tests: [...] }
//   { success: false, tests: [...], errors: [name, ...] }
function runMockAdapterSelfTest() {
  if (typeof recordAuditEvent === 'function') {
    recordAuditEvent('adapter.selftest.started', { adapter: 'mock' });
  }

  var tests = [];

  // Test 1: validateAdapterAction recognises a well-formed click.
  var v = (typeof validateAdapterAction === 'function')
    ? validateAdapterAction({ type: 'click', x: 1, y: 1, button: 'left' })
    : { ok: false, error: 'interface missing' };
  tests.push({ name: 'validate click action', passed: !!v.ok, error: v.ok ? null : v.error });

  // Test 2: executeMockAction returns success for the same input.
  var r = executeMockAction({ type: 'click', x: 1, y: 1, button: 'left' }, null);
  tests.push({ name: 'execute mock action', passed: !!r.success, error: r.success ? null : r.error });

  // Test 3: real action is blocked at the interface level.
  var realBlocked = false;
  if (typeof isRealAdapterAllowed === 'function') {
    realBlocked = isRealAdapterAllowed({ realDesktopActions: true }, { safety: { safeMode: true } }) === false;
  }
  tests.push({ name: 'real action blocked', passed: realBlocked, error: realBlocked ? null : 'isRealAdapterAllowed did not return false' });

  // Test 4: a malformed action is rejected by executeMockAction.
  var bad = executeMockAction({ type: 'click', x: -1, y: 1, button: 'left' }, null);
  tests.push({ name: 'reject malformed action', passed: bad.success === false, error: bad.success === false ? null : 'malformed action was accepted' });

  var failed = tests.filter(function (t) { return !t.passed; });
  var success = failed.length === 0;

  if (typeof recordAuditEvent === 'function') {
    recordAuditEvent(success ? 'adapter.selftest.completed' : 'adapter.selftest.failed', {
      adapter: 'mock',
      total: tests.length,
      passed: tests.length - failed.length,
      failed: failed.length
    });
  }

  if (success) {
    return { success: true, tests: tests };
  }
  return {
    success: false,
    tests: tests,
    errors: failed.map(function (t) { return t.name + (t.error ? (': ' + t.error) : ''); })
  };
}

function getMockAdapterStatus() {
  return {
    id: 'mock',
    name: 'Mock Desktop Adapter',
    available: true,
    realActions: false,
    simulationOnly: true,
    contract: (typeof getAdapterContract === 'function') ? getAdapterContract() : null
  };
}
