// =====================================================================
// ClickFlow — real-desktop-adapter-interface.js (Step 46)
// ---------------------------------------------------------------------
// Contract description for the FUTURE real desktop adapter. This module
// describes the surface a real adapter must implement and provides the
// blocked-by-default implementations used in this build.
//
// SAFETY (Step 46) — THIS MODULE PERFORMS NO REAL INPUT:
//   - Renderer-only logic. NEVER imports `electron`, `ipcRenderer`,
//     `fs`, `robotjs`, `nut.js`, `iohook`, `uiohook-napi`, OpenCV, or
//     any other native / prohibited module.
//   - `checkRealAdapterAvailability()` ALWAYS returns
//     unavailable/disabled in this build.
//   - `executeRealClick()` / `executeRealImageClick()` /
//     `executeRealTextClick()` ALWAYS block. There is no code path
//     here that moves a cursor, presses a key, or touches the OS.
//   - Real execution is enabled only after the safety review passes
//     (docs/REAL_ACTIONS_GO_NO_GO.md, docs/V1_RELEASE_CRITERIA.md) and
//     only behind the `realDesktopActions` feature flag on the
//     dedicated v1-desktop branch.
// =====================================================================

// User-facing reason returned by every blocked call. Kept stable so
// the UI and i18n can match on it.
var REAL_ADAPTER_DISABLED_REASON = 'Real desktop actions are not enabled in this build.';

function _realAdapterNow() {
  return new Date().toISOString();
}

function _realFeatureFlags() {
  return (typeof getFeatureFlags === 'function') ? getFeatureFlags() : {};
}

// --- Public: static metadata about the (future) real adapter. ---
function getRealAdapterInfo() {
  return {
    id: 'real-desktop',
    name: 'Real Desktop Adapter',
    type: 'real',
    available: false,
    realActions: true,            // what it WOULD do once enabled
    realActionsEnabled: false,    // what it does now: nothing
    simulationOnly: true,
    planned: true,
    backendCandidate: 'nut.js',   // see docs/NUTJS_INTEGRATION_PLAN.md
    supportedActionTypes: ['click', 'image_click', 'text_click'],
    plannedActionTypes: ['move_mouse', 'scroll', 'key_press', 'hotkey'],
    disabledReason: REAL_ADAPTER_DISABLED_REASON
  };
}

// --- Public: availability check. ALWAYS unavailable in this build. ---
// The reason is multi-part so the Safety Center can show exactly why.
function checkRealAdapterAvailability() {
  var ff = _realFeatureFlags();
  var reasons = [];
  if (ff.realDesktopActions !== true) reasons.push('realDesktopActions flag is false');
  if (ff.simulationOnly !== false)    reasons.push('simulationOnly is true');
  reasons.push('native backend not installed');
  reasons.push('safety review not passed');
  return {
    available: false,
    enabled: false,
    reason: REAL_ADAPTER_DISABLED_REASON,
    details: reasons,
    checkedAt: _realAdapterNow()
  };
}

// --- Public: validate an action shape for the real adapter. ---
// Shape-only validation. Returning { ok: true } here does NOT mean the
// action will run — execution is still blocked. This exists so the
// future adapter and the test matrix can validate inputs uniformly.
function validateRealAdapterAction(action) {
  if (!action || typeof action !== 'object') {
    return { ok: false, error: 'Action is missing' };
  }
  var supported = ['click', 'image_click', 'text_click'];
  if (supported.indexOf(action.type) === -1) {
    return { ok: false, error: 'Unsupported real action type: ' + action.type };
  }
  return { ok: true };
}

// --- Public: the uniform blocked result + audit event. ---
// Every real-execution entry point funnels through here. The result
// matches the action-pipeline result shape so callers never branch.
function blockRealAction(reason, action, context) {
  var msg = (typeof reason === 'string' && reason.length > 0) ? reason : REAL_ADAPTER_DISABLED_REASON;
  if (typeof recordAuditEvent === 'function') {
    try {
      recordAuditEvent('real.adapter.blocked', {
        scenarioId: context && context.scenarioId,
        actionType: action && action.type,
        reason: msg
      });
    } catch (err) { /* never throw from the block path */ }
  }
  if (typeof recordAuditLogEvent === 'function') {
    try {
      recordAuditLogEvent('real.adapter.blocked', {
        severity: 'safety',
        scenarioId: context && context.scenarioId,
        actionType: action && action.type,
        mode: 'real',
        message: 'Real adapter blocked a real action request',
        metadata: { reason: msg }
      });
    } catch (err) { /* swallow */ }
  }
  return {
    success: false,
    mode: 'real',
    simulated: false,
    realAction: false,
    blocked: true,
    action: action || null,
    result: null,
    error: msg,
    timestamp: _realAdapterNow()
  };
}

// --- Public: real execution entry points. ALL BLOCK. ---
function executeRealClick(action, context) {
  return blockRealAction(REAL_ADAPTER_DISABLED_REASON, action, context);
}

function executeRealImageClick(action, context) {
  return blockRealAction(REAL_ADAPTER_DISABLED_REASON, action, context);
}

function executeRealTextClick(action, context) {
  return blockRealAction(REAL_ADAPTER_DISABLED_REASON, action, context);
}

// --- Public: status snapshot for the Safety Center. ---
function getRealDesktopAdapterStatus() {
  var avail = checkRealAdapterAvailability();
  return {
    id: 'real-desktop',
    available: false,
    enabled: false,
    realActionsImplemented: false,
    reason: avail.reason,
    details: avail.details
  };
}
