// =====================================================================
// ClickFlow — safety-gates.js (Step 17)
// ---------------------------------------------------------------------
// Centralized safety validation for scenarios and actions. Pure
// functions — no DOM, no IPC, no real input. Consumed by the action
// pipeline and the Advanced dashboard.
//
// IMPORTANT
//   - Real desktop actions are NOT implemented in this build.
//   - `isRealActionAllowed()` ALWAYS returns false in 0.1.x.
//   - The list returned by `getRealActionRequirements()` is the
//     contract that future real-input work must satisfy. See
//     docs/REAL_ACTIONS_GO_NO_GO.md.
// =====================================================================

// --- Real-action requirements (contract for the future 0.3.x line). ---
// Each entry has a stable `key`, a human-readable label, and the
// concrete check (or `null` for "not implementable in this build").
function getRealActionRequirements() {
  return [
    { key: 'realDesktopActionsFlag',  label: 'Feature flag realDesktopActions enabled' },
    { key: 'simulationOnlyOff',       label: 'simulationOnly false' },
    { key: 'safeModeOn',              label: 'safeMode true' },
    { key: 'emergencyStopOn',         label: 'emergencyStop enabled' },
    { key: 'userConfirmationFlow',    label: 'User confirmation required' },
    { key: 'auditLogsEnabled',        label: 'Audit logs enabled' },
    { key: 'desktopAdapterInstalled', label: 'Desktop adapter installed' },
    { key: 'osPermissionsVerified',   label: 'OS permissions verified' },
    { key: 'finalSafetyReviewPassed', label: 'Final safety review passed' }
  ];
}

// Returns the subset of requirements that are currently NOT met.
// On this step, every requirement is unmet for one of two reasons:
// either the corresponding capability is not implemented, or the
// `realDesktopActions` feature flag is hard-coded false.
function getMissingRealActionRequirements(settings) {
  var s = settings || {};
  var safety = s.safety || {};
  var ff = (typeof getFeatureFlags === 'function') ? getFeatureFlags() : {};
  var missing = [];

  // realDesktopActionsFlag — flag must be true (currently always false).
  if (ff.realDesktopActions !== true) {
    missing.push('realDesktopActionsFlag');
  }
  // simulationOnly must be false to allow real actions (currently always true).
  if (ff.simulationOnly !== false) {
    missing.push('simulationOnlyOff');
  }
  // safeMode and emergencyStop are user-controllable; require true.
  if (safety.safeMode !== true)              missing.push('safeModeOn');
  if (safety.emergencyStopEnabled !== true)  missing.push('emergencyStopOn');

  // The remaining requirements are simply not implemented in 0.1.x.
  missing.push('userConfirmationFlow');
  missing.push('auditLogsEnabled');
  missing.push('desktopAdapterInstalled');
  missing.push('osPermissionsVerified');
  missing.push('finalSafetyReviewPassed');

  return missing;
}

// --- Public predicate: is simulation allowed? ---
// Simulation is allowed whenever settings are structurally valid.
// In 0.1.x simulation is always allowed for valid settings.
function isSimulationAllowed(settings) {
  if (!settings || typeof settings !== 'object') return false;
  var s = settings.safety;
  if (!s || typeof s !== 'object') return false;
  if (typeof s.minIntervalMs !== 'number' || s.minIntervalMs < 0) return false;
  if (typeof s.maxRepeatCount !== 'number' || s.maxRepeatCount < 1) return false;
  return true;
}

// --- Public predicate: is real action allowed? ---
// HARD-CODED FALSE on this step. Do not flip without a passing
// run of docs/REAL_ACTIONS_GO_NO_GO.md.
function isRealActionAllowed(/* settings */) {
  return false;
}

// --- Status snapshot used by Diagnostics and Advanced UI. ---
function getSafetyGateStatus(settings) {
  var s = settings || {};
  var safety = s.safety || {};
  var ff = (typeof getFeatureFlags === 'function') ? getFeatureFlags() : {};
  return {
    safeMode:           !!safety.safeMode,
    emergencyStop:      !!safety.emergencyStopEnabled,
    minIntervalMs:      typeof safety.minIntervalMs === 'number' ? safety.minIntervalMs : null,
    maxRepeatCount:     typeof safety.maxRepeatCount === 'number' ? safety.maxRepeatCount : null,
    maxRunTimeMs:       typeof safety.maxRunTimeMs === 'number' ? safety.maxRunTimeMs : null,
    simulationOnly:     ff.simulationOnly !== false,
    realActionAllowed:  isRealActionAllowed(settings),
    missingRequirementsCount: getMissingRealActionRequirements(settings).length
  };
}

// --- Result helpers ---
function _ok(warnings) {
  return { ok: true, errors: [], warnings: warnings || [] };
}
function _fail(errors, warnings) {
  return { ok: false, errors: errors || [], warnings: warnings || [] };
}

// --- Scenario-level safety ---
function validateScenarioSafety(scenario, settings) {
  var errors = [];
  var warnings = [];

  if (!scenario || typeof scenario !== 'object') {
    return _fail(['Scenario is missing']);
  }
  var sc = scenario.settings || {};
  var safety = (settings && settings.safety) || {};

  // Interval floor.
  var minInterval = typeof safety.minIntervalMs === 'number' ? safety.minIntervalMs : 50;
  if (typeof sc.intervalMs !== 'number') {
    errors.push('intervalMs is not a number');
  } else if (sc.intervalMs < minInterval) {
    errors.push('intervalMs ' + sc.intervalMs + ' below safe minimum ' + minInterval);
  }

  // Repeat ceiling.
  var maxRepeats = typeof safety.maxRepeatCount === 'number' ? safety.maxRepeatCount : 100000;
  if (typeof sc.repeatCount !== 'number') {
    errors.push('repeatCount is not a number');
  } else if (sc.repeatCount < 1) {
    errors.push('repeatCount must be >= 1');
  } else if (sc.repeatCount > maxRepeats) {
    errors.push('repeatCount ' + sc.repeatCount + ' above safe maximum ' + maxRepeats);
  }

  // Approximate run-time check (only if both numbers are valid).
  if (typeof safety.maxRunTimeMs === 'number' &&
      typeof sc.intervalMs === 'number' &&
      typeof sc.repeatCount === 'number') {
    var approx = sc.intervalMs * sc.repeatCount;
    if (approx > safety.maxRunTimeMs) {
      errors.push('Approx run time ' + approx + 'ms exceeds maxRunTimeMs ' + safety.maxRunTimeMs);
    }
  }

  // Soft warning when interval is very low even if it is >= minInterval.
  if (typeof sc.intervalMs === 'number' && sc.intervalMs < 100) {
    warnings.push('intervalMs is very low (< 100 ms). Simulation only.');
  }

  return errors.length === 0 ? _ok(warnings) : _fail(errors, warnings);
}

// --- Action-level safety ---
// For 0.1.x this is narrow: a `click` action with valid coordinates
// and button is OK. Step 30 also accepts the new `image_click`
// action type (target derived from a real preview matcher) but
// keeps the simulation-only invariant — `realClick: true` is
// always rejected and there is no real-input adapter anywhere.
function validateActionSafety(action /*, settings */) {
  if (!action || typeof action !== 'object') {
    return _fail(['Action is missing']);
  }
  if (action.type === 'click') {
    if (typeof action.x !== 'number' || action.x < 0) {
      return _fail(['Invalid x coordinate']);
    }
    if (typeof action.y !== 'number' || action.y < 0) {
      return _fail(['Invalid y coordinate']);
    }
    var validButtons = ['left', 'right', 'middle'];
    if (validButtons.indexOf(action.button) === -1) {
      return _fail(['Invalid mouse button: ' + action.button]);
    }
    return _ok();
  }
  if (action.type === 'image_click') {
    if (action.realClick === true) {
      return _fail(['image_click never carries realClick=true at this step']);
    }
    if (typeof action.templateId !== 'string' || action.templateId.length === 0) {
      return _fail(['image_click requires templateId']);
    }
    var tp = action.targetPoint;
    if (!tp || typeof tp !== 'object') {
      return _fail(['image_click requires targetPoint']);
    }
    if (typeof tp.x !== 'number' || tp.x < 0) {
      return _fail(['Invalid image_click target x']);
    }
    if (typeof tp.y !== 'number' || tp.y < 0) {
      return _fail(['Invalid image_click target y']);
    }
    return _ok();
  }
  if (action.type === 'text_click') {
    // Step 33: text_click is simulation-only. Both realClick AND
    // realOcr must be falsy. Real text recognition is not
    // connected at Step 33 — mock OCR fabricates the target
    // point — so any caller that asks for real OCR is rejected
    // alongside any caller that asks for a real click.
    if (action.realClick === true) {
      return _fail(['text_click never carries realClick=true at this step']);
    }
    if (action.realOcr === true) {
      return _fail(['text_click never carries realOcr=true at this step']);
    }
    if (typeof action.text !== 'string' || action.text.length === 0) {
      return _fail(['text_click requires text']);
    }
    var ttp = action.targetPoint;
    if (!ttp || typeof ttp !== 'object') {
      return _fail(['text_click requires targetPoint']);
    }
    if (typeof ttp.x !== 'number' || ttp.x < 0) {
      return _fail(['Invalid text_click target x']);
    }
    if (typeof ttp.y !== 'number' || ttp.y < 0) {
      return _fail(['Invalid text_click target y']);
    }
    return _ok();
  }
  return _fail(['Unsupported action type: ' + action.type]);
}
