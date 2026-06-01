// =====================================================================
// ClickFlow — main/real-desktop-adapter.js (Step 47)
// ---------------------------------------------------------------------
// Main-process module: the FIRST real desktop adapter prototype, behind
// a hard safety gate. It supports ONLY a single coordinate click, and
// even that is DISABLED BY DEFAULT.
//
// HARD GUARANTEES (Step 47):
//   - Real input only ever happens in the MAIN process, never in the
//     renderer. The renderer reaches this module exclusively through
//     the three narrow IPC channels registered below — there is NO
//     generic "execute arbitrary action" channel.
//   - The adapter is UNAVAILABLE unless an optional native backend
//     (`@nut-tree/nut-js` or `nut-js`) is installed. The dependency is
//     NOT declared in package.json at Step 47, so on a stock checkout
//     the adapter reports `available:false` and every execute call is
//     blocked with a clear reason. require() failures never crash.
//   - Only `type:"click"` with `realClick:true` is accepted. No
//     image_click, no text_click, no keyboard, no scroll, no mouse
//     move as a separate action, no loops.
//   - Every execution path re-validates the FULL hard context
//     (session enabled + user confirmed + safety check passed +
//     emergency stop ready + audit logs enabled). Missing anything →
//     block. "When in doubt, block."
//   - Prohibited use cases (captcha/anti-bot/ad/banking/protected
//     apps, hidden/background clicks) are never supported.
//   - No screenshots / base64 / private paths are returned or logged.
// =====================================================================

'use strict';

// ---------------------------------------------------------------------
// Optional native backend — loaded defensively.
// ---------------------------------------------------------------------
// We try @nut-tree/nut-js first, then nut-js. If neither is installed
// (the Step 47 default), `_backend` stays null and the adapter is
// unavailable. We NEVER throw out of this module on a missing module.
var _backend = null;
var _backendName = null;
var _backendLoadError = null;

(function _loadBackend() {
  var candidates = ['@nut-tree/nut-js', 'nut-js'];
  for (var i = 0; i < candidates.length; i++) {
    try {
      // eslint-disable-next-line global-require
      var mod = require(candidates[i]);
      if (mod && mod.mouse && mod.Button && mod.Point) {
        _backend = mod;
        _backendName = candidates[i];
        _backendLoadError = null;
        return;
      }
    } catch (err) {
      // Record only a short, generic reason — never the full stack or
      // any filesystem path.
      _backendLoadError = 'dependency not installed';
    }
  }
  if (!_backend && !_backendLoadError) {
    _backendLoadError = 'dependency not installed';
  }
})();

// ---------------------------------------------------------------------
// Diagnostics state (process memory only; no PII, no paths).
// ---------------------------------------------------------------------
var _lastRealActionAttemptAt = null;
var _lastRealActionBlockedReason = null;
var _lastRealActionResult = null;

function _now() { return new Date().toISOString(); }

// ---------------------------------------------------------------------
// Public: static info about the prototype.
// ---------------------------------------------------------------------
function getRealDesktopAdapterInfo() {
  return {
    id: 'real-desktop-prototype',
    name: 'Real Desktop Adapter (prototype)',
    type: 'real',
    experimental: true,
    enabledByDefault: false,
    supportedActionTypes: ['click'],           // coordinate click ONLY
    unsupportedActionTypes: ['image_click', 'text_click', 'key_press', 'hotkey', 'scroll', 'move_mouse'],
    backendCandidates: ['@nut-tree/nut-js', 'nut-js'],
    backendName: _backendName,
    dependencyLoaded: _backend !== null
  };
}

// ---------------------------------------------------------------------
// Public: availability check. Available ONLY if a backend loaded.
// ---------------------------------------------------------------------
function checkRealDesktopAdapterAvailability() {
  var available = _backend !== null;
  return {
    available: available,
    dependencyLoaded: available,
    backendName: _backendName,
    reason: available ? null : (_backendLoadError || 'dependency not installed'),
    checkedAt: _now()
  };
}

// ---------------------------------------------------------------------
// Public: shape validation for a real coordinate-click action.
// ---------------------------------------------------------------------
function validateRealClickAction(action) {
  if (!action || typeof action !== 'object') {
    return { ok: false, error: 'Action is missing' };
  }
  if (action.type !== 'click') {
    return { ok: false, error: 'Real adapter supports coordinate click only (type must be "click")' };
  }
  if (action.realClick !== true) {
    return { ok: false, error: 'realClick must be true for a real coordinate click' };
  }
  if (typeof action.x !== 'number' || !isFinite(action.x) || action.x < 0) {
    return { ok: false, error: 'Invalid x coordinate' };
  }
  if (typeof action.y !== 'number' || !isFinite(action.y) || action.y < 0) {
    return { ok: false, error: 'Invalid y coordinate' };
  }
  var validButtons = ['left', 'right', 'middle'];
  if (validButtons.indexOf(action.button) === -1) {
    return { ok: false, error: 'Invalid mouse button: ' + String(action.button) };
  }
  return { ok: true };
}

// ---------------------------------------------------------------------
// Public: uniform blocked result. Records diagnostics; no PII.
// ---------------------------------------------------------------------
function blockRealDesktopAction(reason, action, context) {
  var msg = (typeof reason === 'string' && reason.length > 0)
    ? reason
    : 'Real desktop action blocked';
  _lastRealActionAttemptAt = _now();
  _lastRealActionBlockedReason = msg;
  var result = {
    success: false,
    mode: 'real',
    simulated: false,
    realAction: false,         // nothing happened
    blocked: true,
    actionType: action && action.type ? action.type : null,
    error: msg,
    reason: msg,               // Step 48 — explicit reason field
    timestamp: _now()
  };
  _lastRealActionResult = { blocked: true, error: msg, timestamp: result.timestamp };
  return result;
}

// ---------------------------------------------------------------------
// Hard context check. ALL of these must be explicitly true.
// "When in doubt, block."
// ---------------------------------------------------------------------
function _checkHardContext(context) {
  var c = (context && typeof context === 'object') ? context : {};
  var missing = [];
  if (c.sessionRealModeEnabled !== true) missing.push('sessionRealModeEnabled');
  // Step 48: the per-action coordinate-click session gate and the
  // one-click-per-confirmation flag are now mandatory in main too.
  if (c.sessionRealCoordinateClickEnabled !== true) missing.push('sessionRealCoordinateClickEnabled');
  if (c.userConfirmed !== true)          missing.push('userConfirmed');
  if (c.safetyCheckPassed !== true)      missing.push('safetyCheckPassed');
  if (c.emergencyStopReady !== true)     missing.push('emergencyStopReady');
  if (c.auditLogsEnabled !== true)       missing.push('auditLogsEnabled');
  if (c.oneClickOnly !== true)           missing.push('oneClickOnly');
  return missing;
}

// ---------------------------------------------------------------------
// Public: execute a real coordinate click. Blocks unless EVERYTHING
// is in order. This is the only place that talks to the backend.
// ---------------------------------------------------------------------
async function executeRealCoordinateClick(action, context) {
  _lastRealActionAttemptAt = _now();

  // 1) Hard context first — refuse the moment anything is missing.
  var missing = _checkHardContext(context);
  if (missing.length > 0) {
    return blockRealDesktopAction(
      'Real coordinate click blocked: missing ' + missing.join(', '),
      action, context
    );
  }

  // 2) Dependency / availability.
  var avail = checkRealDesktopAdapterAvailability();
  if (!avail.available) {
    return blockRealDesktopAction(
      'Real desktop adapter unavailable: ' + (avail.reason || 'dependency not installed'),
      action, context
    );
  }

  // 3) Action shape (type click, realClick true, coords, button).
  var v = validateRealClickAction(action);
  if (!v.ok) {
    return blockRealDesktopAction('Invalid real click action: ' + v.error, action, context);
  }

  // 4) Hard refusal of every non-coordinate-click real action. This is
  //    redundant with validateRealClickAction but kept explicit as a
  //    defence-in-depth guard against a future regression.
  if (action.type === 'image_click' || action.type === 'text_click' ||
      action.type === 'key_press' || action.type === 'hotkey' ||
      action.type === 'scroll' || action.type === 'move_mouse') {
    return blockRealDesktopAction('Action type not supported by the prototype: ' + action.type, action, context);
  }

  // 4b) Step 48: refuse repeats and batches. One click per
  //     confirmation — never a loop, never an array of actions.
  if (typeof action.repeatCount === 'number' && action.repeatCount > 1) {
    return blockRealDesktopAction('Repeat real clicks are blocked (one click per confirmation)', action, context);
  }
  if (Array.isArray(action.actions) && action.actions.length > 1) {
    return blockRealDesktopAction('Batch real clicks are blocked (one click per confirmation)', action, context);
  }

  // 5) Perform exactly ONE click. No loops, no extra movement beyond
  //    positioning the cursor at the target.
  try {
    var Button = _backend.Button;
    var Point = _backend.Point;
    var mouse = _backend.mouse;
    var btn = (action.button === 'right') ? Button.RIGHT
            : (action.button === 'middle') ? Button.MIDDLE
            : Button.LEFT;
    await mouse.setPosition(new Point(Math.round(action.x), Math.round(action.y)));
    await mouse.click(btn);
    var ok = {
      success: true,
      mode: 'real',
      simulated: false,
      realAction: true,
      blocked: false,
      actionType: 'click',
      button: action.button,
      x: Math.round(action.x),
      y: Math.round(action.y),
      error: null,
      timestamp: _now()
    };
    _lastRealActionBlockedReason = null;
    _lastRealActionResult = { blocked: false, success: true, x: ok.x, y: ok.y, button: ok.button, timestamp: ok.timestamp };
    return ok;
  } catch (err) {
    // Backend threw — treat as a blocked/failed real action. Never
    // leak the native error text (could contain paths); use a short
    // generic message.
    return blockRealDesktopAction('Real click failed in the backend', action, context);
  }
}

// ---------------------------------------------------------------------
// Public: status snapshot for diagnostics / Safety Center.
// ---------------------------------------------------------------------
function getRealDesktopAdapterStatus() {
  var avail = checkRealDesktopAdapterAvailability();
  return {
    adapterName: 'Real Desktop Adapter (prototype)',
    adapterAvailable: avail.available,
    dependencyLoaded: avail.dependencyLoaded,
    backendName: _backendName,
    experimental: true,
    supportedActionTypes: ['click'],
    realImageClickEnabled: false,
    realTextClickEnabled: false,
    keyboardActionsEnabled: false,
    lastRealActionAttemptAt: _lastRealActionAttemptAt,
    lastRealActionBlockedReason: _lastRealActionBlockedReason,
    lastRealActionResult: _lastRealActionResult,
    unavailableReason: avail.reason
  };
}

// ---------------------------------------------------------------------
// IPC registration (Task 4). Three narrow channels only.
// ---------------------------------------------------------------------
function registerRealDesktopAdapterIpc(ctx) {
  // ctx = { ipcMain }
  var ipcMain = ctx.ipcMain;

  ipcMain.handle('real-adapter:get-status', async function () {
    return getRealDesktopAdapterStatus();
  });

  ipcMain.handle('real-adapter:check-availability', async function () {
    return checkRealDesktopAdapterAvailability();
  });

  // The ONLY execution channel. It is coordinate-click specific; there
  // is no generic action runner. The renderer must pass the full hard
  // context — main re-validates everything and never trusts it blindly.
  ipcMain.handle('real-adapter:execute-coordinate-click', async function (event, action, context) {
    // Defensive: ignore anything that is not a plain coordinate click.
    if (!action || typeof action !== 'object' || action.type !== 'click') {
      return blockRealDesktopAction('Only coordinate click is accepted on this channel', action || null, context);
    }
    return await executeRealCoordinateClick(action, context);
  });
}

module.exports = {
  getRealDesktopAdapterInfo: getRealDesktopAdapterInfo,
  checkRealDesktopAdapterAvailability: checkRealDesktopAdapterAvailability,
  validateRealClickAction: validateRealClickAction,
  executeRealCoordinateClick: executeRealCoordinateClick,
  blockRealDesktopAction: blockRealDesktopAction,
  getRealDesktopAdapterStatus: getRealDesktopAdapterStatus,
  registerRealDesktopAdapterIpc: registerRealDesktopAdapterIpc
};
