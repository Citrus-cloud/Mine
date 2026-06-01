// =====================================================================
// ClickFlow — audit-log-manager.js (Step 46)
// ---------------------------------------------------------------------
// Desktop v1 audit log manager. Builds on the in-memory audit-events
// model with a v1-shaped event record and an optional, prepared file
// persistence path through main IPC (window.clickflow.auditLogs).
//
// SAFETY (Step 46):
//   - This module is renderer-only logic. It NEVER imports `electron`,
//     `ipcRenderer`, `fs`, or any prohibited native module
//     (robotjs / nut.js / iohook / uiohook-napi / opencv).
//   - It NEVER stores a screenshot, thumbnail, base64, `imageDataUrl`,
//     or any pixel data.
//   - It NEVER stores private filesystem paths, machine identifiers,
//     or PII. Free-form text is length-limited and the full OCR
//     target text is reduced to a length.
//   - File persistence, when present, goes through the safe preload
//     bridge `window.clickflow.auditLogs`. When that bridge is absent
//     the manager stays fully in memory.
//   - Export only ever happens via an explicit user action.
// =====================================================================

// Allowed severities and modes — kept tiny on purpose.
var AUDIT_LOG_SEVERITIES = ['info', 'warning', 'error', 'safety'];
var AUDIT_LOG_MODES      = ['simulation', 'real', 'dry-run'];

// In-memory ring. Capped so memory stays bounded.
var AUDIT_LOG_MAX_EVENTS = 500;
var _auditLogEvents = [];
var _auditLogCounter = 0;

// Fields that are allowed to survive into an event's `metadata`. Any
// other key is dropped defensively. None of these can hold pixel data.
var AUDIT_LOG_METADATA_ALLOWLIST = [
  'reason', 'adapter', 'provider', 'confidence', 'durationMs',
  'targetX', 'targetY', 'threshold', 'step', 'count', 'language',
  'matchMode', 'textLen', 'blocksCount', 'errorsCount', 'warningsCount',
  'permissionId', 'permissionStatus', 'flag', 'requirement', 'source',
  'hasRegion', 'missingCount'
];

// Keys that must NEVER appear in metadata — stripped even if a buggy
// caller passes them.
var AUDIT_LOG_METADATA_DENYLIST = [
  'imageDataUrl', 'thumbnail', 'thumbnailDataUrl', 'previewDataUrl',
  'dataUrl', 'image', 'screenshot', 'pixels', 'buffer', 'base64',
  'path', 'filePath', 'fullPath', 'home', 'targetText', 'text', 'pii'
];

function _auditNow() {
  return new Date().toISOString();
}

function _clampString(value, max) {
  if (typeof value !== 'string') return '';
  var limit = (typeof max === 'number' && max > 0) ? max : 200;
  return value.length > limit ? value.slice(0, limit) : value;
}

// Build a redacted metadata object: allowlist only, denylist always
// stripped, strings clamped, numbers/booleans passed through.
function _redactMetadata(metadata) {
  var out = {};
  if (!metadata || typeof metadata !== 'object') return out;
  for (var i = 0; i < AUDIT_LOG_METADATA_ALLOWLIST.length; i++) {
    var key = AUDIT_LOG_METADATA_ALLOWLIST[i];
    if (!Object.prototype.hasOwnProperty.call(metadata, key)) continue;
    if (AUDIT_LOG_METADATA_DENYLIST.indexOf(key) !== -1) continue;
    var v = metadata[key];
    if (typeof v === 'string') {
      out[key] = _clampString(v, 120);
    } else if (typeof v === 'number' && isFinite(v)) {
      out[key] = v;
    } else if (typeof v === 'boolean') {
      out[key] = v;
    }
    // objects / arrays / functions are intentionally dropped — they
    // could smuggle pixel data or PII.
  }
  return out;
}

function _normalizeSeverity(severity) {
  return AUDIT_LOG_SEVERITIES.indexOf(severity) !== -1 ? severity : 'info';
}

function _normalizeMode(mode) {
  return AUDIT_LOG_MODES.indexOf(mode) !== -1 ? mode : 'simulation';
}

// --- Public: build a normalized v1 audit-log event. ---
// `data` is a loose object; only known fields are read and all
// free-form text is redacted. `realAction` is forced to false in this
// build — there is no real-action code path.
function createAuditLogEvent(type, data) {
  _auditLogCounter++;
  var d = (data && typeof data === 'object') ? data : {};
  return {
    id:           'al-' + _auditLogCounter,
    time:         _auditNow(),
    type:         (typeof type === 'string' && type.length > 0) ? _clampString(type, 80) : 'unknown',
    severity:     _normalizeSeverity(d.severity),
    scenarioId:   (typeof d.scenarioId === 'string') ? _clampString(d.scenarioId, 80) : null,
    scenarioType: (typeof d.scenarioType === 'string') ? _clampString(d.scenarioType, 40) : null,
    actionType:   (typeof d.actionType === 'string') ? _clampString(d.actionType, 40) : null,
    mode:         _normalizeMode(d.mode),
    realAction:   false,
    message:      _clampString(d.message, 200),
    metadata:     _redactMetadata(d.metadata)
  };
}

// --- Public: append an event to the in-memory ring. ---
// Best-effort, never throws. If the optional preload bridge exists we
// also forward the (already redacted) event for file persistence; a
// failure there is swallowed so the UI is never blocked.
function addAuditLogEvent(event) {
  if (!event || typeof event !== 'object' || typeof event.type !== 'string') {
    return null;
  }
  _auditLogEvents.push(event);
  if (_auditLogEvents.length > AUDIT_LOG_MAX_EVENTS) {
    _auditLogEvents.splice(0, _auditLogEvents.length - AUDIT_LOG_MAX_EVENTS);
  }
  _persistAppend(event);
  return event;
}

// Convenience: build + append in one call.
function recordAuditLogEvent(type, data) {
  var ev = createAuditLogEvent(type, data);
  return addAuditLogEvent(ev);
}

// --- Public: read events with optional filters. ---
// Filters (all optional):
//   { severity, mode, scenarioId, actionType, type, realActionOnly }
// Returns a defensive copy.
function getAuditLogEvents(filters) {
  var f = (filters && typeof filters === 'object') ? filters : {};
  return _auditLogEvents.filter(function (e) {
    if (f.severity   && e.severity   !== f.severity)   return false;
    if (f.mode       && e.mode       !== f.mode)       return false;
    if (f.scenarioId && e.scenarioId !== f.scenarioId) return false;
    if (f.actionType && e.actionType !== f.actionType) return false;
    if (f.type       && e.type       !== f.type)       return false;
    if (f.realActionOnly && !e.realAction)             return false;
    return true;
  }).map(function (e) {
    return {
      id: e.id, time: e.time, type: e.type, severity: e.severity,
      scenarioId: e.scenarioId, scenarioType: e.scenarioType,
      actionType: e.actionType, mode: e.mode, realAction: e.realAction,
      message: e.message, metadata: { ...e.metadata }
    };
  });
}

// --- Public: clear all events (in memory + prepared persistence). ---
function clearAuditLogEvents() {
  _auditLogEvents = [];
  _persistClear();
  return { cleared: true };
}

// --- Public: compact summary for diagnostics / dashboard. ---
function getAuditLogSummary() {
  var bySeverity = { info: 0, warning: 0, error: 0, safety: 0 };
  var byMode = { simulation: 0, real: 0, 'dry-run': 0 };
  for (var i = 0; i < _auditLogEvents.length; i++) {
    var e = _auditLogEvents[i];
    if (bySeverity[e.severity] !== undefined) bySeverity[e.severity]++;
    if (byMode[e.mode] !== undefined) byMode[e.mode]++;
  }
  var last = _auditLogEvents.length > 0 ? _auditLogEvents[_auditLogEvents.length - 1] : null;
  return {
    count:      _auditLogEvents.length,
    capacity:   AUDIT_LOG_MAX_EVENTS,
    bySeverity: bySeverity,
    byMode:     byMode,
    realActions: byMode.real,
    persistenceAvailable: _persistenceAvailable(),
    last: last ? { id: last.id, type: last.type, severity: last.severity, time: last.time } : null
  };
}

// --- Public: export as a redacted JSON string. ---
// Returns a string the caller can hand to a save dialog. The export
// is already redacted by construction (events were redacted on
// creation). Export must be triggered by an explicit user action.
function exportAuditLog() {
  var payload = {
    format: 'clickflow-audit-log',
    version: 1,
    exportedAt: _auditNow(),
    simulationOnly: true,
    realActionsPerformed: false,
    summary: getAuditLogSummary(),
    events: getAuditLogEvents({})
  };
  try {
    return JSON.stringify(payload, null, 2);
  } catch (err) {
    return JSON.stringify({ format: 'clickflow-audit-log', version: 1, events: [] });
  }
}

// --- Manager status snapshot for the Safety Center. ---
function getAuditLogManagerStatus() {
  var summary = getAuditLogSummary();
  return {
    ready: true,
    inMemory: true,
    persistenceAvailable: _persistenceAvailable(),
    persistencePlanned: !_persistenceAvailable(),
    count: summary.count,
    capacity: summary.capacity,
    realActions: summary.realActions
  };
}

// --- Optional, prepared file persistence via the preload bridge. ---
// These helpers are intentionally defensive: the bridge may be absent
// (current default), in which case the manager is purely in-memory.
function _persistenceAvailable() {
  try {
    return !!(typeof window !== 'undefined' &&
              window.clickflow &&
              window.clickflow.auditLogs &&
              typeof window.clickflow.auditLogs.append === 'function');
  } catch (err) {
    return false;
  }
}

function _persistAppend(event) {
  if (!_persistenceAvailable()) return;
  try {
    // The event is already redacted; forward a shallow copy.
    window.clickflow.auditLogs.append({
      id: event.id, time: event.time, type: event.type,
      severity: event.severity, scenarioId: event.scenarioId,
      scenarioType: event.scenarioType, actionType: event.actionType,
      mode: event.mode, realAction: event.realAction,
      message: event.message, metadata: { ...event.metadata }
    });
  } catch (err) { /* swallow — persistence must never block the UI */ }
}

function _persistClear() {
  if (!_persistenceAvailable()) return;
  try {
    if (typeof window.clickflow.auditLogs.clear === 'function') {
      window.clickflow.auditLogs.clear();
    }
  } catch (err) { /* swallow */ }
}

// Load previously-persisted events (best-effort) into memory. Called
// during init if the bridge exists. Each loaded record is re-run
// through createAuditLogEvent so redaction is re-applied.
async function loadPersistedAuditLog() {
  if (!_persistenceAvailable()) {
    return { success: true, loaded: 0, persistence: false };
  }
  try {
    if (typeof window.clickflow.auditLogs.load !== 'function') {
      return { success: true, loaded: 0, persistence: false };
    }
    var res = await window.clickflow.auditLogs.load();
    var events = (res && res.success && Array.isArray(res.events)) ? res.events : [];
    var loaded = 0;
    events.forEach(function (raw) {
      if (!raw || typeof raw !== 'object') return;
      var ev = createAuditLogEvent(raw.type, raw);
      _auditLogEvents.push(ev);
      loaded++;
    });
    if (_auditLogEvents.length > AUDIT_LOG_MAX_EVENTS) {
      _auditLogEvents.splice(0, _auditLogEvents.length - AUDIT_LOG_MAX_EVENTS);
    }
    return { success: true, loaded: loaded, persistence: true };
  } catch (err) {
    return { success: false, loaded: 0, persistence: false };
  }
}
