// =====================================================================
// ClickFlow — desktop-adapter-interface.js (Step 18)
// ---------------------------------------------------------------------
// Pure interface module. Describes the contract every desktop action
// adapter (mock or future real) must follow. Performs NO real OS
// input. Loaded as a plain script tag in the renderer.
//
// IMPORTANT
//   - Real desktop actions are NOT implemented in this build.
//   - `isRealAdapterAllowed()` ALWAYS returns false in 0.1.x.
//   - This file does not require Node.js modules and never moves
//     the cursor or presses keys.
// =====================================================================

// --- Adapter contract: stable shape every adapter agrees on. ---
function getAdapterContract() {
  return {
    version: 1,
    supportedActions: ['click'],
    realActionsAllowed: false,
    simulationOnly: true,
    requiresMainProcess: true,
    requiresUserConfirmation: true,
    requiresEmergencyStop: true
  };
}

// --- What action types are accepted at the interface level. ---
function getSupportedAdapterActions() {
  return ['click'];
}

// --- Result helper. Adapters and the registry use this consistently. ---
function createAdapterResult(success, data, error) {
  return {
    success: success === true,
    data: (data && typeof data === 'object') ? data : null,
    error: (typeof error === 'string') ? error : null,
    timestamp: new Date().toISOString()
  };
}

// --- Action validation at the adapter boundary. ---
// Mirrors action-pipeline.validateAction() but is intentionally
// duplicated so the adapter stays self-sufficient if loaded in
// isolation (e.g. by smoke harness).
function validateAdapterAction(action) {
  if (!action || typeof action !== 'object') {
    return { ok: false, error: 'Action is missing' };
  }
  if (action.type !== 'click') {
    return { ok: false, error: 'Unsupported adapter action type: ' + action.type };
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

// --- Defensive copy + coercion of an action into the canonical shape. ---
// Numeric strings are coerced to numbers; unknown fields are dropped.
function normalizeAdapterAction(action) {
  if (!action || typeof action !== 'object') return null;
  var x = (typeof action.x === 'number') ? action.x : Number(action.x);
  var y = (typeof action.y === 'number') ? action.y : Number(action.y);
  return {
    type: 'click',
    x: isNaN(x) ? -1 : x,
    y: isNaN(y) ? -1 : y,
    button: (typeof action.button === 'string') ? action.button : 'left'
  };
}

// --- Hard gate: is a real adapter allowed under the given flags? ---
// HARD-CODED FALSE on this step. Both `realDesktopActions` must be
// true AND `simulationOnly` must be false before the future real
// adapter could be considered — and even then, the requirements in
// docs/REAL_ACTIONS_GO_NO_GO.md must be met by a separate review.
function isRealAdapterAllowed(flags, settings) {
  // Step 18: never allow.
  if (true) return false;
  // Reference predicate kept for documentation; unreachable in 0.1.x.
  /* istanbul ignore next */
  var ff = flags || {};
  /* istanbul ignore next */
  if (ff.realDesktopActions !== true) return false;
  /* istanbul ignore next */
  if (ff.simulationOnly === true) return false;
  /* istanbul ignore next */
  return !!(settings && settings.safety && settings.safety.safeMode === true);
}
