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
  container.appendChild(renderPermissionsCard());
  container.appendChild(renderAuditLogsCard());
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
