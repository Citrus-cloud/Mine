// =====================================================================
// ClickFlow — safety-center-ui.js (Step 46)
// ---------------------------------------------------------------------
// Renderer-only UI for the Advanced → Safety Center tab. It surfaces:
//   - current mode + safety status (simulation-only),
//   - V1 readiness dashboard,
//   - permissions checklist (status + guidance only),
//   - audit logs (list + filters + refresh/clear/export).
//
// SAFETY (Step 46):
//   - This module is renderer-only. It NEVER imports `electron`,
//     `ipcRenderer`, `fs`, or any prohibited native module.
//   - It renders ALL user / event data via `textContent`. The only
//     `innerHTML` use is clearing a container with `= ''`.
//   - There is NO control to turn on real desktop actions. This
//     module cannot enable real actions. It reads status and renders
//     it.
//   - Export actions are user-initiated (button clicks) and copy
//     redacted data to the clipboard; nothing is written to disk here.
// =====================================================================

// Active audit filter id. One of:
//   all | safety | scenario | action | adapter | ocr | visualBuilder
//   | error | warning | info
var _auditFilter = 'all';

// Step 47 — Real adapter prototype UI state (renderer memory only).
var _realAdapterStatus = null;     // last status snapshot from main (async)
var _realAdapterFetching = false;  // guard against re-entrant fetches
var _realTestX = null;             // test coordinate X (null → use scenario)
var _realTestY = null;             // test coordinate Y
var _realTestButton = 'left';      // test mouse button
var _realLastResultText = null;    // human-readable last test result

// --- Small DOM helpers (textContent only; never innerHTML w/ data) ---
function _scEl(tag, className, text) {
  var el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined && text !== null) el.textContent = String(text);
  return el;
}

function _scLabel(key, fallback) {
  if (typeof t === 'function') {
    var v = t(key);
    if (v && v !== key) return v;
  }
  return fallback || key;
}

function _scRow(labelText, valueText, valueClass) {
  var row = _scEl('div', 'sc-row');
  var l = _scEl('span', 'sc-row-label', labelText);
  var v = _scEl('span', 'sc-row-value' + (valueClass ? (' ' + valueClass) : ''), valueText);
  row.appendChild(l);
  row.appendChild(v);
  return row;
}

function _scCard(titleText) {
  var card = _scEl('div', 'sc-card');
  var h = _scEl('h3', 'sc-card-title', titleText);
  card.appendChild(h);
  return card;
}

function _scSafeSettings() {
  try { if (typeof getSettings === 'function') return getSettings(); } catch (e) {}
  try { if (typeof getState === 'function') return getState().settings; } catch (e) {}
  return { safety: {} };
}

function _scFeatureFlags() {
  try { if (typeof getFeatureFlags === 'function') return getFeatureFlags(); } catch (e) {}
  return {};
}

// =====================================================================
// Entry point
// =====================================================================
function openSafetyCenterTab() {
  if (typeof setAdvancedTab === 'function') setAdvancedTab('safetyCenter');
}

function renderSafetyCenter() {
  var container = document.getElementById('advanced-tab-safetyCenter');
  if (!container) return;
  container.innerHTML = '';

  var header = _scEl('div', 'sc-header');
  header.appendChild(_scEl('h2', 'sc-title', _scLabel('safetyCenter', 'Safety Center')));
  header.appendChild(_scEl('p', 'sc-subtitle', _scLabel('realDesktopActionsDisabled', 'Real desktop actions disabled')));
  container.appendChild(header);

  // Action buttons
  var actions = _scEl('div', 'sc-actions');
  var btnCheck = _scEl('button', 'sc-btn', _scLabel('runSafetyCheck', 'Run safety check'));
  btnCheck.addEventListener('click', runSafetyCheck);
  var btnExport = _scEl('button', 'sc-btn', _scLabel('exportDiagnostics', 'Export diagnostics'));
  btnExport.addEventListener('click', exportSafetyDiagnostics);
  var btnAudit = _scEl('button', 'sc-btn', _scLabel('openAuditLogs', 'Open audit logs'));
  btnAudit.addEventListener('click', function () {
    var sec = document.getElementById('sc-audit-section');
    if (sec && typeof sec.scrollIntoView === 'function') sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  var btnPerm = _scEl('button', 'sc-btn', _scLabel('openPermissionsChecklist', 'Open permissions checklist'));
  btnPerm.addEventListener('click', function () {
    var sec = document.getElementById('sc-permissions-section');
    if (sec && typeof sec.scrollIntoView === 'function') sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  actions.appendChild(btnCheck);
  actions.appendChild(btnExport);
  actions.appendChild(btnAudit);
  actions.appendChild(btnPerm);
  container.appendChild(actions);

  container.appendChild(renderSafetyStatusCard());
  container.appendChild(renderV1ReadinessCard());
  container.appendChild(renderRealAdapterCard());
  container.appendChild(renderPermissionsCard());
  container.appendChild(renderAuditLogsCard());

  // Step 47: fetch the real adapter status from main (async) once, then
  // re-render so the prototype card shows live availability. Guarded so
  // it does not loop.
  if (_realAdapterStatus === null && !_realAdapterFetching) {
    _realAdapterFetching = true;
    Promise.resolve(_fetchRealAdapterStatus()).then(function (st) {
      _realAdapterFetching = false;
      if (st) { _realAdapterStatus = st; renderSafetyCenter(); }
    }).catch(function () { _realAdapterFetching = false; });
  }
}

// =====================================================================
// Safety status card
// =====================================================================
function _scStatusValue(ok, planned) {
  if (planned) return { text: _scLabel('statusPartial', 'partial'), cls: 'sc-warn' };
  return ok
    ? { text: _scLabel('statusReady', 'ready'), cls: 'sc-ok' }
    : { text: _scLabel('statusDisabled', 'disabled'), cls: 'sc-bad' };
}

function renderSafetyStatusCard() {
  var card = _scCard(_scLabel('safetyCenter', 'Safety Center'));
  var settings = _scSafeSettings();
  var safety = (settings && settings.safety) ? settings.safety : {};

  // Current mode
  card.appendChild(_scRow(_scLabel('currentMode', 'Current mode'),
    _scLabel('modeSimulation', 'Simulation'), 'sc-ok'));

  // Real desktop actions: disabled
  card.appendChild(_scRow(_scLabel('realDesktopActionsDisabled', 'Real desktop actions disabled'),
    _scLabel('statusDisabled', 'disabled'), 'sc-bad'));

  // Emergency stop
  var es = safety.emergencyStopEnabled === true;
  card.appendChild(_scRow(_scLabel('emergencyStop', 'Emergency stop'),
    es ? _scLabel('statusReady', 'ready') : _scLabel('permissionMissing', 'missing'),
    es ? 'sc-ok' : 'sc-warn'));

  // Audit logs
  var auditReady = (typeof getAuditLogManagerStatus === 'function');
  card.appendChild(_scRow(_scLabel('auditLogs', 'Audit logs'),
    auditReady ? _scLabel('statusReady', 'ready') : _scLabel('statusPartial', 'partial'),
    auditReady ? 'sc-ok' : 'sc-warn'));

  // Permissions summary
  var permText = _scLabel('statusPartial', 'partial');
  var permCls = 'sc-warn';
  try {
    if (typeof getPermissionStatus === 'function') {
      var ps = getPermissionStatus(settings, _scFeatureFlags());
      permText = ps.ready + '/' + ps.total;
      permCls = ps.allReady ? 'sc-ok' : 'sc-warn';
    }
  } catch (e) {}
  card.appendChild(_scRow(_scLabel('permissions', 'Permissions'), permText, permCls));

  // Adapter
  var adapterText = _scLabel('adapterMock', 'Mock adapter');
  card.appendChild(_scRow(_scLabel('adapterAvailability', 'Adapter availability'), adapterText, 'sc-ok'));
  card.appendChild(_scRow(_scLabel('realAdapterNotEnabled', 'Real adapter not enabled'),
    _scLabel('statusDisabled', 'disabled'), 'sc-bad'));

  // OCR
  var ocrText = _scLabel('statusReady', 'ready');
  var ocrCls = 'sc-ok';
  try {
    if (typeof getOcrFeatureStatus === 'function') {
      var ocrSt = getOcrFeatureStatus();
      if (ocrSt && ocrSt.realOcrEnabledForSession) { ocrText = 'real (session)'; }
      else { ocrText = 'mock'; }
    } else { ocrText = 'mock'; }
  } catch (e) { ocrText = 'mock'; }
  card.appendChild(_scRow('OCR', ocrText, ocrCls));

  // Screen capture
  card.appendChild(_scRow(_scLabel('screenCapture', 'Screen capture'),
    _scLabel('statusReady', 'ready'), 'sc-ok'));

  // Action pipeline
  var pipeReady = true;
  try { if (typeof getActionPipelineStatus === 'function') pipeReady = !!getActionPipelineStatus().pipelineReady; } catch (e) {}
  card.appendChild(_scRow(_scLabel('actionPipelineReady', 'Action pipeline ready'),
    pipeReady ? _scLabel('statusReady', 'ready') : _scLabel('statusPartial', 'partial'),
    pipeReady ? 'sc-ok' : 'sc-warn'));

  // Release safety
  card.appendChild(_scRow(_scLabel('releaseSafety', 'Release safety'), 'smart beta / v1 foundation', 'sc-ok'));

  return card;
}

// =====================================================================
// V1 readiness card
// =====================================================================
function renderV1ReadinessCard() {
  var card = _scCard(_scLabel('v1Readiness', 'V1 readiness'));

  function readyRow(labelKey, fallback, value, cls) {
    card.appendChild(_scRow(_scLabel(labelKey, fallback), value, cls));
  }
  var R = _scLabel('statusReady', 'ready');
  var P = _scLabel('statusPartial', 'partial');
  var D = _scLabel('statusDisabled', 'disabled');

  readyRow('coordinateClickSimulation', 'Coordinate click simulation', R, 'sc-ok');
  readyRow('imageMatching', 'Image matching', P, 'sc-warn');
  readyRow('imageClickReady', 'image_click ready', R, 'sc-ok');
  readyRow('ocrMockReady', 'OCR (mock/real session)', P, 'sc-warn');
  readyRow('textClickReady', 'text_click ready', R, 'sc-ok');
  readyRow('visualBuilderReady', 'Visual Builder ready', R, 'sc-ok');
  readyRow('scenarioPresets', 'Scenario presets', R, 'sc-ok');
  readyRow('realAdapterNotEnabled', 'Real adapter not enabled', D, 'sc-bad');
  readyRow('auditLogs', 'Audit logs', R, 'sc-ok');
  readyRow('permissions', 'Permissions', P, 'sc-warn');
  readyRow('packaging', 'Packaging', R, 'sc-ok');

  return card;
}

// =====================================================================
// Permissions card
// =====================================================================
function _scPermStatusLabel(status) {
  switch (status) {
    case 'ready':       return _scLabel('permissionReady', 'ready');
    case 'missing':     return _scLabel('permissionMissing', 'missing');
    case 'planned':     return _scLabel('permissionPlanned', 'planned');
    case 'notRequired': return _scLabel('permissionNotRequired', 'not required');
    default:            return _scLabel('permissionUnknown', 'unknown');
  }
}

function _scPermStatusClass(status) {
  if (status === 'ready' || status === 'notRequired') return 'sc-ok';
  if (status === 'missing') return 'sc-bad';
  return 'sc-warn';
}

function renderPermissionsCard() {
  var card = _scCard(_scLabel('permissions', 'Permissions'));
  card.id = 'sc-permissions-section';

  var refresh = _scEl('button', 'sc-btn sc-btn-small', _scLabel('refresh', 'Refresh'));
  refresh.addEventListener('click', function () {
    if (typeof refreshPermissions === 'function') {
      Promise.resolve(refreshPermissions(_scSafeSettings(), _scFeatureFlags())).then(function () {
        renderSafetyCenter();
      });
    } else {
      renderSafetyCenter();
    }
  });
  card.appendChild(refresh);

  var checklist = [];
  try {
    if (typeof getPermissionChecklist === 'function') {
      checklist = getPermissionChecklist(_scSafeSettings(), _scFeatureFlags());
    }
  } catch (e) { checklist = []; }

  if (!checklist.length) {
    card.appendChild(_scEl('p', 'sc-empty', _scLabel('permissionUnknown', 'unknown')));
    return card;
  }

  checklist.forEach(function (item) {
    var wrap = _scEl('div', 'sc-perm-item');
    var label = _scLabel(item.labelKey, item.id);
    wrap.appendChild(_scRow(label, _scPermStatusLabel(item.status), _scPermStatusClass(item.status)));
    var guidance = _scLabel(item.guidanceKey, '');
    if (guidance && guidance !== item.guidanceKey) {
      wrap.appendChild(_scEl('p', 'sc-perm-guidance', guidance));
    }
    card.appendChild(wrap);
  });

  return card;
}

// =====================================================================
// Audit logs card
// =====================================================================
function _scReadAuditEvents() {
  try { if (typeof getAuditEvents === 'function') return getAuditEvents(); } catch (e) {}
  return [];
}

function _scDeriveSeverity(type) {
  var ty = String(type || '').toLowerCase();
  if (ty.indexOf('blocked') !== -1 || ty.indexOf('failed') !== -1 ||
      ty.indexOf('error') !== -1 || ty.indexOf('emergency') !== -1) return 'error';
  if (ty.indexOf('lowconfidence') !== -1 || ty.indexOf('nomatch') !== -1 ||
      ty.indexOf('cancelled') !== -1 || ty.indexOf('warning') !== -1 ||
      ty.indexOf('unavailable') !== -1 || ty.indexOf('missing') !== -1) return 'warning';
  return 'info';
}

function _scMatchesFilter(ev) {
  if (_auditFilter === 'all') return true;
  var ty = String(ev.type || '').toLowerCase();
  var sev = _scDeriveSeverity(ev.type);
  switch (_auditFilter) {
    case 'safety':       return ty.indexOf('real') !== -1 || ty.indexOf('blocked') !== -1 ||
                                ty.indexOf('safety') !== -1 || ty.indexOf('emergency') !== -1 ||
                                ty.indexOf('permission') !== -1 || ty.indexOf('adapter') !== -1;
    case 'scenario':     return ty.indexOf('scenario') === 0 || ty.indexOf('scenario.') !== -1;
    case 'action':       return ty.indexOf('action.') === 0 || ty.indexOf('action') === 0;
    case 'adapter':      return ty.indexOf('adapter') !== -1;
    case 'ocr':          return ty.indexOf('ocr') !== -1 || ty.indexOf('textclick') !== -1;
    case 'visualBuilder':return ty.indexOf('visualbuilder') !== -1 || ty.indexOf('scenariopreset') !== -1;
    case 'error':        return sev === 'error';
    case 'warning':      return sev === 'warning';
    case 'info':         return sev === 'info';
    default:             return true;
  }
}

function renderAuditLogsCard() {
  var card = _scCard(_scLabel('auditLogs', 'Audit logs'));
  card.id = 'sc-audit-section';

  // Controls: filter + buttons
  var controls = _scEl('div', 'sc-audit-controls');

  var select = document.createElement('select');
  select.className = 'sc-audit-filter';
  var filters = [
    ['all', _scLabel('none', 'all')],
    ['safety', _scLabel('tabSafety', 'safety')],
    ['scenario', _scLabel('scenario', 'scenario')],
    ['action', 'action'],
    ['adapter', _scLabel('adapterAvailability', 'adapter')],
    ['ocr', 'OCR'],
    ['visualBuilder', 'Visual Builder'],
    ['error', 'error'],
    ['warning', 'warning'],
    ['info', 'info']
  ];
  filters.forEach(function (pair) {
    var opt = document.createElement('option');
    opt.value = pair[0];
    opt.textContent = pair[1];
    if (pair[0] === _auditFilter) opt.selected = true;
    select.appendChild(opt);
  });
  select.addEventListener('change', function () {
    _auditFilter = select.value;
    renderSafetyCenter();
  });
  controls.appendChild(select);

  var btnRefresh = _scEl('button', 'sc-btn sc-btn-small', _scLabel('refresh', 'Refresh'));
  btnRefresh.addEventListener('click', renderSafetyCenter);
  var btnClear = _scEl('button', 'sc-btn sc-btn-small', _scLabel('clearAuditLog', 'Clear audit log'));
  btnClear.addEventListener('click', function () {
    try { if (typeof clearAuditEvents === 'function') clearAuditEvents(); } catch (e) {}
    try { if (typeof clearAuditLogEvents === 'function') clearAuditLogEvents(); } catch (e) {}
    if (typeof recordAuditLogEvent === 'function') {
      recordAuditLogEvent('audit.log.cleared', { severity: 'info', mode: 'simulation', message: 'Audit log cleared by user' });
    }
    renderSafetyCenter();
  });
  var btnExport = _scEl('button', 'sc-btn sc-btn-small', _scLabel('exportAuditLog', 'Export audit log'));
  btnExport.addEventListener('click', exportAuditLogsUi);
  controls.appendChild(btnRefresh);
  controls.appendChild(btnClear);
  controls.appendChild(btnExport);
  card.appendChild(controls);

  // Event list
  var events = _scReadAuditEvents().filter(_scMatchesFilter).reverse();
  if (!events.length) {
    card.appendChild(_scEl('p', 'sc-empty', _scLabel('auditLogEmpty', 'No audit events yet')));
    return card;
  }

  var list = _scEl('div', 'sc-audit-list');
  var max = 60;
  events.slice(0, max).forEach(function (ev) {
    var sev = _scDeriveSeverity(ev.type);
    var item = _scEl('div', 'sc-audit-item sc-sev-' + sev);
    var head = _scEl('div', 'sc-audit-item-head');
    head.appendChild(_scEl('span', 'sc-audit-type', ev.type));
    head.appendChild(_scEl('span', 'sc-audit-sev', sev));
    item.appendChild(head);
    var meta = _scEl('div', 'sc-audit-item-meta');
    var time = (ev.timestamp || '').replace('T', ' ').replace(/\..*$/, '');
    meta.appendChild(_scEl('span', 'sc-audit-time', time));
    // mode (if present in payload) — never render full payload text
    var mode = ev.payload && typeof ev.payload.mode === 'string' ? ev.payload.mode : null;
    if (mode) meta.appendChild(_scEl('span', 'sc-audit-mode', mode));
    item.appendChild(meta);
    list.appendChild(item);
  });
  card.appendChild(list);
  return card;
}

// =====================================================================
// Actions
// =====================================================================
function runSafetyCheck() {
  var settings = _scSafeSettings();
  var report = {
    simulationOnly: true,
    realDesktopActions: false,
    realAdapterAvailable: false
  };
  try { if (typeof getActionPipelineStatus === 'function') report.pipeline = getActionPipelineStatus(); } catch (e) {}
  try { if (typeof getSafetyGateStatus === 'function') report.gates = getSafetyGateStatus(settings); } catch (e) {}
  try { if (typeof getPermissionStatus === 'function') report.permissions = getPermissionStatus(settings, _scFeatureFlags()); } catch (e) {}
  try { if (typeof getRealDesktopAdapterStatus === 'function') report.realAdapter = getRealDesktopAdapterStatus(); } catch (e) {}

  if (typeof recordAuditEvent === 'function') {
    recordAuditEvent('safetyCenter.check.run', { mode: 'simulation' });
  }
  if (typeof recordAuditLogEvent === 'function') {
    recordAuditLogEvent('safetyCenter.check.run', {
      severity: 'info', mode: 'simulation',
      message: 'Safety check run from Safety Center'
    });
  }
  if (typeof addLogEntry === 'function' && typeof createLog === 'function') {
    addLogEntry(createLog('info', _scLabel('safetyCheckPassed', 'Safety check passed')));
    if (typeof renderState === 'function') renderState();
  }
  renderSafetyCenter();
  return report;
}

function _scCopyToClipboard(text) {
  try {
    if (navigator && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      navigator.clipboard.writeText(text);
      return true;
    }
  } catch (e) {}
  return false;
}

function exportSafetyDiagnostics() {
  var settings = _scSafeSettings();
  var diag = {
    format: 'clickflow-safety-diagnostics',
    version: 1,
    exportedAt: new Date().toISOString(),
    simulationOnly: true,
    realDesktopActions: false,
    pipeline: (typeof getActionPipelineStatus === 'function') ? getActionPipelineStatus() : null,
    gates: (typeof getSafetyGateStatus === 'function') ? getSafetyGateStatus(settings) : null,
    permissions: (typeof getPermissionStatus === 'function') ? getPermissionStatus(settings, _scFeatureFlags()) : null,
    realAdapter: (typeof getRealDesktopAdapterStatus === 'function') ? getRealDesktopAdapterStatus() : null,
    auditSummary: (typeof getAuditLogSummary === 'function') ? getAuditLogSummary() : null
  };
  var json = '';
  try { json = JSON.stringify(diag, null, 2); } catch (e) { json = '{}'; }
  _scCopyToClipboard(json);
  if (typeof recordAuditEvent === 'function') {
    recordAuditEvent('safetyCenter.diagnostics.exported', { mode: 'simulation' });
  }
  if (typeof addLogEntry === 'function' && typeof createLog === 'function') {
    addLogEntry(createLog('info', _scLabel('exportDiagnostics', 'Export diagnostics')));
    if (typeof renderState === 'function') renderState();
  }
}

function exportAuditLogsUi() {
  var json = '';
  try {
    if (typeof exportAuditLog === 'function') {
      json = exportAuditLog();
    } else if (typeof getAuditEvents === 'function') {
      json = JSON.stringify({ format: 'clickflow-audit-log', version: 1, events: getAuditEvents() }, null, 2);
    }
  } catch (e) { json = '{}'; }
  _scCopyToClipboard(json);
  if (typeof recordAuditLogEvent === 'function') {
    recordAuditLogEvent('audit.log.exported', { severity: 'info', mode: 'simulation', message: 'Audit log exported by user' });
  }
  if (typeof addLogEntry === 'function' && typeof createLog === 'function') {
    addLogEntry(createLog('info', _scLabel('exportAuditLog', 'Export audit log')));
    if (typeof renderState === 'function') renderState();
  }
}

// Best-effort init: load any persisted audit-log events. Safe no-op
// when the preload bridge is absent.
async function initSafetyCenter() {
  try {
    if (typeof loadPersistedAuditLog === 'function') {
      await loadPersistedAuditLog();
    }
  } catch (e) { /* ignore */ }
}



// =====================================================================
// Step 47 — Experimental Real Coordinate Click (prototype) card.
// ---------------------------------------------------------------------
// Disabled by default. Session-only. One click per confirmation.
// Coordinate click ONLY — image/text real clicks and keyboard are not
// offered here at all. Every real click requires its own confirmation.
// =====================================================================

async function _fetchRealAdapterStatus() {
  try {
    if (typeof window !== 'undefined' && window.clickflow &&
        window.clickflow.realAdapter &&
        typeof window.clickflow.realAdapter.getStatus === 'function') {
      var st = await window.clickflow.realAdapter.getStatus();
      if (typeof recordAuditEvent === 'function') {
        recordAuditEvent('realAdapter.availability.checked', {
          adapter: 'real-desktop-prototype'
        });
      }
      return st;
    }
  } catch (e) { /* ignore */ }
  return { adapterAvailable: false, dependencyLoaded: false, unavailableReason: 'bridge unavailable' };
}

function _scRealFeatureStatus() {
  try { if (typeof getRealAdapterFeatureStatus === 'function') return getRealAdapterFeatureStatus(); } catch (e) {}
  return { realDesktopActions: false, realCoordinateClick: false, realCoordinateClickSessionEnabled: false, realImageClick: false, realTextClick: false };
}

// Resolve the coordinates/button to test. Defaults to the selected
// simple_click scenario's coordinates (a safe, user-chosen target).
function _scResolveTestCoords() {
  var x = _realTestX;
  var y = _realTestY;
  var button = _realTestButton || 'left';
  if (x === null || y === null) {
    try {
      var st = getState();
      var sc = (typeof getScenarioById === 'function') ? getScenarioById(st.selectedScenarioId) : null;
      if (sc && sc.type === 'simple_click' && sc.settings) {
        if (typeof sc.settings.x === 'number') x = sc.settings.x;
        if (typeof sc.settings.y === 'number') y = sc.settings.y;
        if (sc.settings.button) button = sc.settings.button;
      }
    } catch (e) {}
  }
  if (typeof x !== 'number' || x < 0) x = 0;
  if (typeof y !== 'number' || y < 0) y = 0;
  return { x: x, y: y, button: button };
}

function renderRealAdapterCard() {
  var card = _scCard(_scLabel('realAdapterPrototype', 'Real adapter prototype'));
  card.id = 'sc-real-adapter-section';

  // Experimental warning.
  card.appendChild(_scEl('p', 'sc-subtitle', _scLabel('experimentalRealCoordinateClick', 'Experimental real coordinate click')));
  card.appendChild(_scEl('p', 'sc-perm-guidance', _scLabel('realDesktopActionsStillExperimental', 'Real desktop actions are still experimental and disabled by default.')));
  card.appendChild(_scEl('p', 'sc-perm-guidance', _scLabel('prohibitedUseCases', 'Prohibited use cases')));

  var feat = _scRealFeatureStatus();
  var status = _realAdapterStatus || {};
  var sessionEnabled = feat.realCoordinateClickSessionEnabled === true;

  // --- Diagnostics rows (Task 12) ---
  card.appendChild(_scRow(_scLabel('adapterAvailableLabel', 'Adapter available'),
    status.adapterAvailable ? _scLabel('statusReady', 'ready') : _scLabel('adapterUnavailable', 'unavailable'),
    status.adapterAvailable ? 'sc-ok' : 'sc-bad'));
  card.appendChild(_scRow(_scLabel('dependencyLoadedLabel', 'Dependency loaded'),
    status.dependencyLoaded ? _scLabel('statusReady', 'ready') : _scLabel('dependencyUnavailable', 'dependency not installed'),
    status.dependencyLoaded ? 'sc-ok' : 'sc-warn'));
  card.appendChild(_scRow(_scLabel('realCoordinateClickEnabled', 'Real coordinate click enabled'),
    sessionEnabled ? _scLabel('statusReady', 'ready') : _scLabel('statusDisabled', 'disabled'),
    sessionEnabled ? 'sc-ok' : 'sc-bad'));
  card.appendChild(_scRow(_scLabel('imageTextRealClickDisabled', 'Real image/text click disabled'),
    _scLabel('statusDisabled', 'disabled'), 'sc-bad'));
  card.appendChild(_scRow(_scLabel('keyboardActionsDisabled', 'Keyboard actions disabled'),
    _scLabel('statusDisabled', 'disabled'), 'sc-bad'));

  // Safety gate snapshot.
  var gate = null;
  try {
    if (typeof getRealDesktopActionGateStatus === 'function') {
      var perms = (typeof getPermissionChecklist === 'function') ? getPermissionChecklist(_scSafeSettings(), _scFeatureFlags()) : null;
      gate = getRealDesktopActionGateStatus(_scSafeSettings(), feat, perms, status);
    }
  } catch (e) { gate = null; }
  if (gate) {
    card.appendChild(_scRow(_scLabel('safetyGateFailed', 'Safety gate'),
      gate.allowed ? _scLabel('statusReady', 'ready') : _scLabel('safetyGateFailed', 'Safety check failed'),
      gate.allowed ? 'sc-ok' : 'sc-warn'));
  }

  if (status.lastRealActionBlockedReason) {
    card.appendChild(_scRow(_scLabel('realActionBlocked', 'Real action blocked'),
      String(status.lastRealActionBlockedReason), 'sc-warn'));
  }
  if (_realLastResultText) {
    card.appendChild(_scRow(_scLabel('lastRealActionResultLabel', 'Last real action result'),
      String(_realLastResultText), 'sc-warn'));
  }

  // --- Coordinate inputs ---
  var coords = _scResolveTestCoords();
  var inputsWrap = _scEl('div', 'sc-real-inputs');
  function numInput(labelText, value, onInput) {
    var w = _scEl('label', 'sc-real-input');
    w.appendChild(_scEl('span', null, labelText));
    var inp = document.createElement('input');
    inp.type = 'number'; inp.min = '0'; inp.value = String(value);
    inp.className = 'sc-real-num';
    inp.addEventListener('change', function () { onInput(parseInt(inp.value, 10)); });
    w.appendChild(inp);
    return w;
  }
  inputsWrap.appendChild(numInput('X', coords.x, function (v) { _realTestX = (isNaN(v) || v < 0) ? 0 : v; }));
  inputsWrap.appendChild(numInput('Y', coords.y, function (v) { _realTestY = (isNaN(v) || v < 0) ? 0 : v; }));
  var btnSel = document.createElement('select');
  btnSel.className = 'sc-real-num';
  ['left', 'right', 'middle'].forEach(function (b) {
    var o = document.createElement('option'); o.value = b; o.textContent = b;
    if (b === (coords.button || 'left')) o.selected = true;
    btnSel.appendChild(o);
  });
  btnSel.addEventListener('change', function () { _realTestButton = btnSel.value; });
  var btnWrap = _scEl('label', 'sc-real-input');
  btnWrap.appendChild(_scEl('span', null, _scLabel('mouseButton', 'Button')));
  btnWrap.appendChild(btnSel);
  inputsWrap.appendChild(btnWrap);
  card.appendChild(inputsWrap);

  // --- Controls ---
  var controls = _scEl('div', 'sc-actions');

  var btnGate = _scEl('button', 'sc-btn sc-btn-small', _scLabel('runSafetyCheck', 'Run safety check'));
  btnGate.addEventListener('click', runRealAdapterSafetyCheck);
  controls.appendChild(btnGate);

  var btnDry = _scEl('button', 'sc-btn sc-btn-small', _scLabel('testDryRunCoordinateClick', 'Test dry-run coordinate click'));
  btnDry.addEventListener('click', testDryRunCoordinateClick);
  controls.appendChild(btnDry);

  if (!sessionEnabled) {
    var btnEnable = _scEl('button', 'sc-btn sc-btn-small', _scLabel('enableRealCoordinateClickForSession', 'Enable real coordinate click for this session'));
    btnEnable.addEventListener('click', enableRealCoordinateClickSession);
    controls.appendChild(btnEnable);
  } else {
    var btnDisable = _scEl('button', 'sc-btn sc-btn-small', _scLabel('disableRealCoordinateClick', 'Disable real coordinate click'));
    btnDisable.addEventListener('click', disableRealCoordinateClickSession);
    controls.appendChild(btnDisable);

    var btnReal = _scEl('button', 'sc-btn sc-btn-small sc-btn-danger', _scLabel('testRealCoordinateClick', 'Test real coordinate click'));
    btnReal.addEventListener('click', testRealCoordinateClick);
    controls.appendChild(btnReal);
  }
  card.appendChild(controls);

  card.appendChild(_scEl('p', 'sc-perm-guidance', _scLabel('realClicksSessionOnly', 'Session only') + ' · ' + _scLabel('oneClickPerConfirmation', 'One click per confirmation')));
  return card;
}

// --- Generic confirmation modal (DOM-safe; textContent only) ---
function _scShowModal(opts) {
  var o = opts || {};
  // Remove any existing modal first.
  var existing = document.getElementById('sc-modal-overlay');
  if (existing && existing.parentNode) existing.parentNode.removeChild(existing);

  var overlay = _scEl('div', 'sc-modal-overlay');
  overlay.id = 'sc-modal-overlay';
  var modal = _scEl('div', 'sc-modal');
  if (o.title) modal.appendChild(_scEl('h3', 'sc-modal-title', o.title));
  (o.lines || []).forEach(function (line) {
    modal.appendChild(_scEl('p', 'sc-modal-line', line));
  });

  var confirmBtn = _scEl('button', 'sc-btn sc-btn-danger', o.confirmLabel || _scLabel('save', 'Confirm'));
  var checkbox = null;
  if (o.requireCheckbox) {
    var lbl = _scEl('label', 'sc-modal-check');
    checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    confirmBtn.disabled = true;
    checkbox.addEventListener('change', function () { confirmBtn.disabled = !checkbox.checked; });
    lbl.appendChild(checkbox);
    lbl.appendChild(_scEl('span', null, o.checkboxLabel || ''));
    modal.appendChild(lbl);
  }

  var btnRow = _scEl('div', 'sc-modal-actions');
  var cancelBtn = _scEl('button', 'sc-btn', o.cancelLabel || _scLabel('cancel', 'Cancel'));
  function close() { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }
  confirmBtn.addEventListener('click', function () { close(); if (typeof o.onConfirm === 'function') o.onConfirm(); });
  cancelBtn.addEventListener('click', function () { close(); if (typeof o.onCancel === 'function') o.onCancel(); });
  btnRow.appendChild(cancelBtn);
  btnRow.appendChild(confirmBtn);
  modal.appendChild(btnRow);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
}

// --- Enable session (with confirmation) ---
function enableRealCoordinateClickSession() {
  if (typeof recordAuditEvent === 'function') recordAuditEvent('realAction.confirmation.requested', { source: 'enableSession' });
  _scShowModal({
    title: _scLabel('enableRealCoordinateClickForSession', 'Enable real coordinate click for this session'),
    lines: [
      _scLabel('realClickWarning', 'Warning: this will perform a real mouse click.'),
      _scLabel('realClicksSessionOnly', 'Session only.'),
      _scLabel('coordinateClickOnly', 'Coordinate click only.'),
      _scLabel('imageTextRealClickDisabled', 'Real image/text click disabled.'),
      _scLabel('keyboardActionsDisabled', 'Keyboard actions disabled.'),
      _scLabel('prohibitedUseCases', 'Prohibited use cases.')
    ],
    requireCheckbox: true,
    checkboxLabel: _scLabel('confirmRealClick', 'I understand this will allow real coordinate clicks for this session only.'),
    confirmLabel: _scLabel('enableRealCoordinateClickForSession', 'Enable'),
    onConfirm: function () {
      if (typeof setRuntimeFeatureFlag === 'function') {
        setRuntimeFeatureFlag('realDesktopActions', true);
        setRuntimeFeatureFlag('realCoordinateClick', true);
      }
      if (typeof recordAuditEvent === 'function') {
        recordAuditEvent('realAction.confirmation.accepted', { source: 'enableSession' });
        recordAuditEvent('realAdapter.session.enabled', { adapter: 'real-desktop-prototype' });
      }
      if (typeof recordAuditLogEvent === 'function') {
        recordAuditLogEvent('realAdapter.session.enabled', { severity: 'safety', mode: 'real', message: 'Real coordinate click enabled for session' });
      }
      _realLastResultText = null;
      renderSafetyCenter();
    },
    onCancel: function () {
      if (typeof recordAuditEvent === 'function') recordAuditEvent('realAction.confirmation.cancelled', { source: 'enableSession' });
    }
  });
}

function disableRealCoordinateClickSession() {
  if (typeof setRuntimeFeatureFlag === 'function') {
    setRuntimeFeatureFlag('realDesktopActions', false);
    setRuntimeFeatureFlag('realCoordinateClick', false);
  }
  if (typeof recordAuditEvent === 'function') recordAuditEvent('realAdapter.session.disabled', { adapter: 'real-desktop-prototype' });
  if (typeof recordAuditLogEvent === 'function') {
    recordAuditLogEvent('realAdapter.session.disabled', { severity: 'info', mode: 'real', message: 'Real coordinate click disabled' });
  }
  _realLastResultText = null;
  renderSafetyCenter();
}

// --- Safety check specific to the real gate ---
function runRealAdapterSafetyCheck() {
  var feat = _scRealFeatureStatus();
  var perms = (typeof getPermissionChecklist === 'function') ? getPermissionChecklist(_scSafeSettings(), _scFeatureFlags()) : null;
  var gate = (typeof getRealDesktopActionGateStatus === 'function')
    ? getRealDesktopActionGateStatus(_scSafeSettings(), feat, perms, _realAdapterStatus || {})
    : { allowed: false, reasons: ['gateUnavailable'] };
  if (!gate.allowed && typeof recordAuditEvent === 'function') {
    recordAuditEvent('realAction.safetyGate.failed', { reason: (gate.reasons || []).join(',').slice(0, 80) });
  }
  _realLastResultText = gate.allowed
    ? _scLabel('safetyCheckPassed', 'Safety check passed')
    : (_scLabel('safetyGateFailed', 'Safety check failed') + ': ' + (gate.reasons || []).join(', '));
  renderSafetyCenter();
}

// --- Dry-run coordinate click (no real input) ---
function testDryRunCoordinateClick() {
  var c = _scResolveTestCoords();
  var action = { type: 'click', x: c.x, y: c.y, button: c.button, realClick: false };
  var result = null;
  try {
    if (typeof executeAction === 'function') {
      result = executeAction(action, { executionMode: 'dry-run', scenarioId: null });
    }
  } catch (e) { result = null; }
  var ok = result && (result.mode === 'dry-run');
  _realLastResultText = (_scLabel('testDryRunCoordinateClick', 'Dry-run') + ': ' +
    (ok ? 'preview (X=' + c.x + ', Y=' + c.y + ', ' + c.button + ', realClick=false)' : 'unavailable'));
  if (typeof recordAuditLogEvent === 'function') {
    recordAuditLogEvent('action.simulated', { severity: 'info', mode: 'dry-run', actionType: 'click', message: 'Dry-run coordinate click preview', metadata: { targetX: c.x, targetY: c.y } });
  }
  renderSafetyCenter();
}

// --- Real coordinate click (requires its own confirmation) ---
function testRealCoordinateClick() {
  var feat = _scRealFeatureStatus();
  if (feat.realCoordinateClickSessionEnabled !== true) {
    _realLastResultText = _scLabel('realActionBlocked', 'Real action blocked') + ': ' + _scLabel('realCoordinateClickDisabled', 'disabled');
    renderSafetyCenter();
    return;
  }
  var c = _scResolveTestCoords();
  if (typeof recordAuditEvent === 'function') recordAuditEvent('realAction.confirmation.requested', { source: 'testRealClick' });
  _scShowModal({
    title: _scLabel('testRealCoordinateClick', 'Test real coordinate click'),
    lines: [
      _scLabel('realClickWarning', 'Warning: this will perform a real mouse click.'),
      'X: ' + c.x + '   Y: ' + c.y + '   ' + _scLabel('mouseButton', 'Button') + ': ' + c.button,
      _scLabel('noProtectedApps', 'Do not click in banking / protected apps'),
      _scLabel('oneClickPerConfirmation', 'One click per confirmation'),
      'Emergency stop: Escape / Ctrl+Alt+E'
    ],
    confirmLabel: _scLabel('confirmRealClick', 'Confirm real click'),
    onConfirm: function () {
      if (typeof recordAuditEvent === 'function') recordAuditEvent('realAction.confirmation.accepted', { source: 'testRealClick' });
      _runRealCoordinateClick(c);
    },
    onCancel: function () {
      if (typeof recordAuditEvent === 'function') recordAuditEvent('realAction.confirmation.cancelled', { source: 'testRealClick' });
    }
  });
}

async function _runRealCoordinateClick(c) {
  var settings = _scSafeSettings();
  var safety = (settings && settings.safety) ? settings.safety : {};
  var action = { type: 'click', x: c.x, y: c.y, button: c.button, realClick: true };
  var context = {
    userConfirmed: true,
    safetyCheckPassed: true,           // user ran/accepted; main re-checks
    emergencyStopReady: safety.emergencyStopEnabled === true,
    auditLogsEnabled: (typeof getAuditLogManagerStatus === 'function'),
    sessionRealModeEnabled: _scRealFeatureStatus().realCoordinateClickSessionEnabled === true,
    scenarioId: null
  };
  var result = null;
  try {
    if (typeof executeRealDesktopAction === 'function') {
      result = await executeRealDesktopAction(action, context);
    }
  } catch (e) { result = null; }

  if (result && result.success && result.realAction === true && !result.blocked) {
    _realLastResultText = _scLabel('realActionExecuted', 'Real action executed') + ' (X=' + c.x + ', Y=' + c.y + ', ' + c.button + ')';
    if (typeof recordAuditLogEvent === 'function') {
      recordAuditLogEvent('realAction.coordinate.executed', { severity: 'safety', mode: 'real', actionType: 'click', message: 'Real coordinate click executed', metadata: { targetX: c.x, targetY: c.y } });
    }
  } else {
    var reason = (result && result.error) ? result.error : _scLabel('realActionBlocked', 'Real action blocked');
    _realLastResultText = _scLabel('realActionBlocked', 'Real action blocked') + ': ' + reason;
    if (typeof recordAuditLogEvent === 'function') {
      recordAuditLogEvent('realAction.coordinate.blocked', { severity: 'warning', mode: 'real', actionType: 'click', message: 'Real coordinate click blocked', metadata: { reason: String(reason).slice(0, 100) } });
    }
  }
  // Refresh adapter status (last attempt/result may have changed).
  _realAdapterStatus = null;
  renderSafetyCenter();
}
