// =====================================================================
// ClickFlow — audit-events.js (Step 17)
// ---------------------------------------------------------------------
// In-memory audit event model. NO file persistence on this step.
// File-based audit logs are designed in docs/AUDIT_LOG_PLAN.md and
// will land only after the docs/REAL_ACTIONS_GO_NO_GO.md gate is met.
//
// All recorded events are SAFE BY CONSTRUCTION:
//   - no PII;
//   - no filesystem paths;
//   - no machine identifiers;
//   - only event types from the fixed allowlist below.
// =====================================================================

// Stable, frozen allowlist of event types.
var AUDIT_EVENT_TYPES = Object.freeze({
  ScenarioStartRequested:  'scenario.start.requested',
  ScenarioStartApproved:   'scenario.start.approved',
  ScenarioStopRequested:   'scenario.stop.requested',
  ScenarioCompleted:       'scenario.completed',
  EmergencyStop:           'emergency.stop',
  ActionSimulated:         'action.simulated',
  ActionRealBlocked:       'action.real.blocked',
  SafetyValidationFailed:  'safety.validation.failed',
  SettingsChanged:         'settings.changed',
  ImportCompleted:         'import.completed',
  ExportCompleted:         'export.completed'
});

var KNOWN_TYPES = Object.freeze(
  Object.keys(AUDIT_EVENT_TYPES).map(function (k) { return AUDIT_EVENT_TYPES[k]; })
);

// In-memory ring of recent events. Capped to keep memory bounded.
var AUDIT_MAX_EVENTS = 500;
var auditEvents = [];
var auditCounter = 0;

function _now() {
  return new Date().toISOString();
}

// Build a normalized audit event. Unknown types are accepted but tagged.
function createAuditEvent(type, payload) {
  auditCounter++;
  var safeType = (typeof type === 'string') ? type : 'unknown';
  var known = KNOWN_TYPES.indexOf(safeType) !== -1;
  return {
    id: 'evt-' + auditCounter,
    type: safeType,
    known: known,
    timestamp: _now(),
    payload: (payload && typeof payload === 'object') ? payload : {}
  };
}

// Append an event. Always succeeds; rolls over the oldest if at cap.
function addAuditEvent(event) {
  if (!event || typeof event !== 'object' || typeof event.type !== 'string') {
    return null;
  }
  auditEvents.push(event);
  if (auditEvents.length > AUDIT_MAX_EVENTS) {
    auditEvents.splice(0, auditEvents.length - AUDIT_MAX_EVENTS);
  }
  return event;
}

// Convenience: build + append in one call.
function recordAuditEvent(type, payload) {
  var ev = createAuditEvent(type, payload);
  addAuditEvent(ev);
  return ev;
}

// Defensive copy.
function getAuditEvents() {
  return auditEvents.slice();
}

function clearAuditEvents() {
  auditEvents = [];
  return { cleared: true };
}

// Compact summary for diagnostics / dashboard.
function getAuditSummary() {
  var byType = {};
  for (var i = 0; i < auditEvents.length; i++) {
    var t = auditEvents[i].type;
    byType[t] = (byType[t] || 0) + 1;
  }
  var last = auditEvents.length > 0 ? auditEvents[auditEvents.length - 1] : null;
  return {
    count: auditEvents.length,
    capacity: AUDIT_MAX_EVENTS,
    byType: byType,
    last: last
        ? { type: last.type, timestamp: last.timestamp }
        : null
  };
}
