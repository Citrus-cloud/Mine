// Главный модуль рендерера ClickFlow

// DOM — главный экран
const statusIndicator = document.getElementById('status-indicator');
const statusValue = document.getElementById('status-value');
const scenarioValue = document.getElementById('scenario-value');
const btnStart = document.getElementById('btn-start');
const btnStop = document.getElementById('btn-stop');
const btnScenario = document.getElementById('btn-scenario');
const btnSettings = document.getElementById('btn-settings');
const btnAdvanced = document.getElementById('btn-advanced');
const logsContainer = document.getElementById('logs-container');
const progressMeta = document.getElementById('progress-meta');
const progressBarFill = document.getElementById('progress-bar-fill');
const lastActionEl = document.getElementById('last-action');

// DOM — виды
const viewMain = document.getElementById('view-main');
const viewScenarios = document.getElementById('view-scenarios');
const viewScenarioForm = document.getElementById('view-scenario-form');
const viewSettings = document.getElementById('view-settings');
const viewAdvanced = document.getElementById('view-advanced');

// DOM — список сценариев
const scenarioListEl = document.getElementById('scenario-list');
const btnCreateScenario = document.getElementById('btn-create-scenario');
const btnScenariosBack = document.getElementById('btn-scenarios-back');

// DOM — форма сценария
const formTitle = document.getElementById('form-title');
const formError = document.getElementById('form-error');
const inputName = document.getElementById('input-name');
const inputDescription = document.getElementById('input-description');
const inputX = document.getElementById('input-x');
const inputY = document.getElementById('input-y');
const inputInterval = document.getElementById('input-interval');
const inputRepeat = document.getElementById('input-repeat');
const inputButton = document.getElementById('input-button');
const btnSaveScenario = document.getElementById('btn-save-scenario');
const btnFormCancel = document.getElementById('btn-form-cancel');

// Step 30: image_click form fields.
const inputScenarioType       = document.getElementById('input-scenario-type');
const formSectionSimple       = document.getElementById('form-section-simple-click');
const formSectionImage        = document.getElementById('form-section-image-click');
const formSectionText         = document.getElementById('form-section-text-click');
const inputTemplateId         = document.getElementById('input-template-id');
const inputImageThreshold     = document.getElementById('input-image-threshold');
const inputImageStep          = document.getElementById('input-image-step');
const inputImageTimeout       = document.getElementById('input-image-timeout');
const inputImageInterval      = document.getElementById('input-image-interval');
const inputImageRepeat        = document.getElementById('input-image-repeat');
const imageClickRegionSummary = document.getElementById('image-click-region-summary');
const imageClickNoTemplates   = document.getElementById('image-click-no-templates');
const btnImageClickUseRegion  = document.getElementById('btn-image-click-use-region');
const btnImageClickClearRegion= document.getElementById('btn-image-click-clear-region');
let _imageClickFormRegion = null;

// Step 33: text_click form fields.
const inputTextTarget         = document.getElementById('input-text-target');
const inputTextLanguage       = document.getElementById('input-text-language');
const inputTextMatchMode      = document.getElementById('input-text-match-mode');
const inputTextCaseSensitive  = document.getElementById('input-text-case-sensitive');
const inputTextTimeout        = document.getElementById('input-text-timeout');
const inputTextInterval       = document.getElementById('input-text-interval');
const inputTextRepeat         = document.getElementById('input-text-repeat');
const textClickRegionSummary  = document.getElementById('text-click-region-summary');
const textClickNoPreview      = document.getElementById('text-click-no-preview');
const btnTextClickUseRegion   = document.getElementById('btn-text-click-use-region');
const btnTextClickClearRegion = document.getElementById('btn-text-click-clear-region');
let _textClickFormRegion = null;

// DOM — настройки
const settingsLanguage = document.getElementById('settings-language');
const settingsTheme = document.getElementById('settings-theme');
const settingsMinInterval = document.getElementById('settings-min-interval');
const settingsMaxRepeats = document.getElementById('settings-max-repeats');
const safetyModeBadge = document.getElementById('safety-mode-badge');
const emergencyStopBadge = document.getElementById('emergency-stop-badge');
const btnSaveSettings = document.getElementById('btn-save-settings');
const btnSettingsBack = document.getElementById('btn-settings-back');
const btnBack = document.getElementById('btn-back');

const MAX_VISIBLE_LOGS = 5;
let advancedLogFilter = "all";
let lastAdapterSelfTestResult = null; // Step 18: in-memory last result
let currentDryRunPlan = null;        // Step 19: in-memory dry-run plan


// --- Views ---
function showView(viewName) {
  setCurrentView(viewName);
  // Bug fix: `.view-hidden` in styles.css uses `display: none !important`,
  // which beats any inline `style.display = 'flex'`. To switch views
  // reliably we toggle the class itself and clear any leftover inline
  // display from earlier showView() calls.
  const views = [
    ['main',         viewMain],
    ['scenarios',    viewScenarios],
    ['scenarioForm', viewScenarioForm],
    ['settings',     viewSettings],
    ['advanced',     viewAdvanced]
  ];
  views.forEach(function (pair) {
    var name = pair[0]; var el = pair[1];
    if (!el) return;
    el.style.display = '';
    if (name === viewName) {
      el.classList.remove('view-hidden');
    } else {
      el.classList.add('view-hidden');
    }
  });
  const container = document.querySelector('.container');
  container.style.maxWidth = (viewName === 'advanced') ? '720px' : '520px';
}

// --- Render State ---
function renderState() {
  const state = getState();
  if (state.isRunning) {
    statusValue.textContent = t('running');
    statusIndicator.classList.add('running');
    statusIndicator.classList.remove('stopped');
  } else {
    statusValue.textContent = t('stopped');
    statusIndicator.classList.add('stopped');
    statusIndicator.classList.remove('running');
  }
  scenarioValue.textContent = state.selectedScenarioName;
  btnStart.disabled = state.execution.isRunning;
  btnStop.disabled = !state.execution.isRunning;
  renderExecutionProgress(state.execution);
  renderLogs(state.logs);
  if (state.currentView === 'advanced') renderAdvancedDashboard();
}

function renderExecutionProgress(ex) {
  progressMeta.textContent = `${ex.progressCurrent} / ${ex.progressTotal} · ${ex.progressPercent}%`;
  progressBarFill.style.width = ex.progressPercent + '%';
  progressBarFill.classList.toggle('complete', ex.progressPercent >= 100);
  lastActionEl.textContent = `${t('lastAction')}: ${formatLastAction(ex.lastAction)}`;
}

// Step 30 — render either simple_click or image_click last action.
// Step 33 — also render text_click last action.
// Returns a short text fragment (no HTML).
function formatLastAction(action) {
  if (!action) return t('none');
  if (action.type === 'image_click') {
    var tplId = action.templateId || '';
    var tp = action.targetPoint || { x: 0, y: 0 };
    var conf = (typeof action.confidence === 'number') ? Math.round(action.confidence * 100) + '%' : '?';
    if (action.status === 'no_match') {
      return 'image_click ' + t('imageClickNoMatch') + ' template=' + tplId + ' confidence=' + conf;
    }
    return 'image_click template=' + tplId + ' x=' + (tp.x | 0) + ' y=' + (tp.y | 0) + ' confidence=' + conf + ' (simulated)';
  }
  if (action.type === 'text_click') {
    var ttext = typeof action.text === 'string' ? action.text : '';
    var ttp = action.targetPoint || { x: 0, y: 0 };
    var tconf = (typeof action.confidence === 'number') ? Math.round(action.confidence * 100) + '%' : '?';
    if (action.status === 'no_match') {
      return 'text_click ' + t('textClickNoMatch');
    }
    // Render only the first 40 chars of the text to avoid leaking
    // huge user input into the on-screen status bar.
    var safeText = ttext.length > 40 ? ttext.slice(0, 40) + '…' : ttext;
    return 'text_click text="' + safeText + '" x=' + (ttp.x | 0) + ' y=' + (ttp.y | 0) + ' confidence=' + tconf + ' (simulated)';
  }
  return 'click x=' + action.x + ' y=' + action.y + ' ' + action.button;
}

function shouldLogAction(c, total) { return c <= 3 || c === total || c % 10 === 0; }

function renderLogs(logs) {
  const recent = logs.slice(-MAX_VISIBLE_LOGS);
  logsContainer.innerHTML = '';
  if (recent.length === 0) {
    const p = document.createElement('p');
    p.className = 'logs-empty'; p.textContent = t('noEvents');
    logsContainer.appendChild(p); return;
  }
  recent.forEach(log => logsContainer.appendChild(createLogEl(log)));
}

function createLogEl(log) {
  const el = document.createElement('div');
  el.className = `log-entry log-${log.type}`;
  const icon = document.createElement('span'); icon.className = 'log-icon'; icon.textContent = getLogLabel(log.type);
  const time = document.createElement('span'); time.className = 'log-time'; time.textContent = log.time;
  const msg = document.createElement('span'); msg.className = 'log-message'; msg.textContent = log.message;
  el.appendChild(icon); el.appendChild(time); el.appendChild(msg);
  return el;
}

function addCardRow(card, label, value) {
  const row = document.createElement('div'); row.className = 'adv-card-row';
  const lbl = document.createElement('span'); lbl.className = 'adv-card-label'; lbl.textContent = label;
  const val = document.createElement('span'); val.className = 'adv-card-value'; val.textContent = value;
  row.appendChild(lbl); row.appendChild(val); card.appendChild(row);
}


// --- Scenario List ---
function renderScenarioList() {
  const scns = getScenarios(); const state = getState();
  scenarioListEl.innerHTML = '';
  if (scns.length === 0) { const e = document.createElement('p'); e.className = 'scenario-empty'; e.textContent = t('noScenarios'); scenarioListEl.appendChild(e); return; }
  scns.forEach(sc => {
    const card = document.createElement('div'); card.className = 'scenario-card';
    if (sc.id === state.selectedScenarioId) card.classList.add('active');
    const header = document.createElement('div'); header.className = 'scenario-card-header';
    const name = document.createElement('span'); name.className = 'scenario-card-name'; name.textContent = sc.name; header.appendChild(name);
    if (sc.meta && sc.meta.isDefault) { const badge = document.createElement('span'); badge.className = 'scenario-card-badge'; badge.textContent = t('defaultBadge'); header.appendChild(badge); }
    if (sc.type === 'image_click') {
      const typeBadge = document.createElement('span');
      typeBadge.className = 'scenario-card-badge scenario-card-badge-image-click';
      typeBadge.textContent = t('imageClick') || 'image_click';
      header.appendChild(typeBadge);
    }
    if (sc.type === 'text_click') {
      const typeBadge = document.createElement('span');
      typeBadge.className = 'scenario-card-badge scenario-card-badge-text-click';
      typeBadge.textContent = t('textClick') || 'text_click';
      header.appendChild(typeBadge);
    }
    card.appendChild(header);
    const info = document.createElement('div'); info.className = 'scenario-card-settings';
    info.textContent = formatScenarioSettingsLine(sc);
    card.appendChild(info);
    const actions = document.createElement('div'); actions.className = 'scenario-card-actions';
    const bSel = document.createElement('button'); bSel.className = 'btn-sm btn-sm-select'; bSel.textContent = t('select'); bSel.addEventListener('click', () => selectScenarioById(sc.id)); actions.appendChild(bSel);
    const bEdit = document.createElement('button'); bEdit.className = 'btn-sm btn-sm-edit'; bEdit.textContent = t('edit'); bEdit.addEventListener('click', () => openEditScenarioForm(sc.id)); actions.appendChild(bEdit);
    if (!sc.meta || !sc.meta.isDefault) { const bDel = document.createElement('button'); bDel.className = 'btn-sm btn-sm-delete'; bDel.textContent = t('delete'); bDel.addEventListener('click', () => deleteScenarioById(sc.id)); actions.appendChild(bDel); }
    card.appendChild(actions); scenarioListEl.appendChild(card);
  });
}

function openScenarioList() { addLogEntry(createLog('info', t('logScenariosOpened'))); showView('scenarios'); renderScenarioList(); renderState(); }
function selectScenarioById(id) { const sc = getScenarioById(id); if (!sc) return; setSelectedScenario(sc); addLogEntry(createLog('success', `${t('select')}: ${sc.name}`)); showView('main'); renderState(); }
function openCreateScenarioForm() { setScenarioFormMode('create'); setEditingScenarioId(null); clearScenarioForm(); clearFormError(); formTitle.textContent = t('createScenarioTitle'); showView('scenarioForm'); if (typeof clearImageClickTestResultUi === 'function') clearImageClickTestResultUi(); if (typeof initImageClickTestUi === 'function') initImageClickTestUi(); else if (typeof refreshImageClickTestPanel === 'function') refreshImageClickTestPanel(); if (typeof clearTextClickTestResultUi === 'function') clearTextClickTestResultUi(); if (typeof initTextClickTestUi === 'function') initTextClickTestUi(); else if (typeof refreshTextClickTestPanel === 'function') refreshTextClickTestPanel(); }
function openEditScenarioForm(id) { const sc = getScenarioById(id); if (!sc) return; setScenarioFormMode('edit'); setEditingScenarioId(id); fillScenarioForm(sc); clearFormError(); formTitle.textContent = t('editScenarioTitle'); showView('scenarioForm'); if (typeof clearImageClickTestResultUi === 'function') clearImageClickTestResultUi(); if (typeof initImageClickTestUi === 'function') initImageClickTestUi(); else if (typeof refreshImageClickTestPanel === 'function') refreshImageClickTestPanel(); if (typeof clearTextClickTestResultUi === 'function') clearTextClickTestResultUi(); if (typeof initTextClickTestUi === 'function') initTextClickTestUi(); else if (typeof refreshTextClickTestPanel === 'function') refreshTextClickTestPanel(); }
function closeScenarioForm() { setScenarioFormMode(null); setEditingScenarioId(null); clearFormError(); if (typeof clearImageClickTestResultUi === 'function') clearImageClickTestResultUi(); if (typeof clearTextClickTestResultUi === 'function') clearTextClickTestResultUi(); showView('scenarios'); renderScenarioList(); }

async function saveScenarioFromForm() {
  const data = getScenarioFormData(); const state = getState(); let result;
  if (state.scenarioFormMode === 'create') result = createScenario(data);
  else if (state.scenarioFormMode === 'edit') result = updateScenario(state.editingScenarioId, data);
  if (!result || !result.success) { showFormError(result ? result.error : 'Error'); reportError({ code: 'SCENARIO_SAVE', message: result ? result.error : 'Unknown' }, 'scenario-form'); return; }
  await saveScenarios(); addLogEntry(createLog('success', `${data.name}`)); closeScenarioForm(); renderState();
}

async function deleteScenarioById(id) {
  const sc = getScenarioById(id); if (!sc || (sc.meta && sc.meta.isDefault)) return;
  if (!confirm(`${t('delete')} "${sc.name}"?`)) return;
  const result = deleteScenario(id); if (!result.success) return;
  const state = getState();
  if (state.selectedScenarioId === id) { setSelectedScenario(getDefaultScenario()); }
  await saveScenarios(); addLogEntry(createLog('info', `${t('delete')}: ${sc.name}`)); renderScenarioList(); renderState();
}

function getScenarioFormData() {
  // Step 30: dispatch on the type selector. simple_click keeps
  // its old shape (so old callers / tests stay happy); image_click
  // returns the full new shape including templateId / region /
  // threshold / step / timeoutMs.
  // Step 33: text_click returns its own shape with targetText /
  // language / matchMode / caseSensitive / region.
  var type = (inputScenarioType && inputScenarioType.value) ? inputScenarioType.value : 'simple_click';
  if (type === 'image_click') {
    return {
      type: 'image_click',
      name: inputName.value,
      description: inputDescription.value,
      templateId: inputTemplateId ? inputTemplateId.value : '',
      region: _imageClickFormRegion ? { ..._imageClickFormRegion } : null,
      threshold: inputImageThreshold ? Number(inputImageThreshold.value) : 0.75,
      step:      inputImageStep      ? Number(inputImageStep.value)      : 4,
      timeoutMs: inputImageTimeout   ? Number(inputImageTimeout.value)   : 10000,
      intervalMs:inputImageInterval  ? Number(inputImageInterval.value)  : 1000,
      repeatCount:inputImageRepeat   ? Number(inputImageRepeat.value)    : 1
    };
  }
  if (type === 'text_click') {
    return {
      type: 'text_click',
      name: inputName.value,
      description: inputDescription.value,
      targetText:    inputTextTarget       ? inputTextTarget.value       : '',
      language:      inputTextLanguage     ? inputTextLanguage.value     : 'ru+en',
      matchMode:     inputTextMatchMode    ? inputTextMatchMode.value    : 'contains',
      caseSensitive: inputTextCaseSensitive ? !!inputTextCaseSensitive.checked : false,
      region:        _textClickFormRegion ? { ..._textClickFormRegion } : null,
      timeoutMs:     inputTextTimeout      ? Number(inputTextTimeout.value)  : 10000,
      intervalMs:    inputTextInterval     ? Number(inputTextInterval.value) : 1000,
      repeatCount:   inputTextRepeat       ? Number(inputTextRepeat.value)   : 1
    };
  }
  return {
    type: 'simple_click',
    name: inputName.value,
    description: inputDescription.value,
    x: inputX.value, y: inputY.value,
    intervalMs: inputInterval.value, repeatCount: inputRepeat.value,
    button: inputButton.value
  };
}

function fillScenarioForm(sc) {
  inputName.value = sc.name; inputDescription.value = sc.description || '';
  // Step 30: render either branch depending on the loaded scenario.
  // Step 33: text_click branch.
  var type = 'simple_click';
  if (sc.type === 'image_click') type = 'image_click';
  else if (sc.type === 'text_click') type = 'text_click';
  if (inputScenarioType) inputScenarioType.value = type;
  if (type === 'image_click') {
    var s = sc.settings || {};
    populateTemplateSelect(s.templateId || '');
    _imageClickFormRegion = (s.region && typeof s.region === 'object') ? { ...s.region } : null;
    if (inputImageThreshold) inputImageThreshold.value = (typeof s.threshold === 'number') ? s.threshold : 0.75;
    if (inputImageStep)      inputImageStep.value      = String((typeof s.step === 'number') ? s.step : 4);
    if (inputImageTimeout)   inputImageTimeout.value   = (typeof s.timeoutMs === 'number') ? s.timeoutMs : 10000;
    if (inputImageInterval)  inputImageInterval.value  = (typeof s.intervalMs === 'number') ? s.intervalMs : 1000;
    if (inputImageRepeat)    inputImageRepeat.value    = (typeof s.repeatCount === 'number') ? s.repeatCount : 1;
    refreshImageClickRegionSummary();
    syncScenarioFormSections();
    return;
  }
  if (type === 'text_click') {
    var ts = sc.settings || {};
    if (inputTextTarget)        inputTextTarget.value        = (typeof ts.targetText === 'string') ? ts.targetText : '';
    if (inputTextLanguage)      inputTextLanguage.value      = (ts.language === 'ru' || ts.language === 'en' || ts.language === 'ru+en') ? ts.language : 'ru+en';
    if (inputTextMatchMode)     inputTextMatchMode.value     = (ts.matchMode === 'exact') ? 'exact' : 'contains';
    if (inputTextCaseSensitive) inputTextCaseSensitive.checked = !!ts.caseSensitive;
    if (inputTextTimeout)       inputTextTimeout.value       = (typeof ts.timeoutMs === 'number') ? ts.timeoutMs : 10000;
    if (inputTextInterval)      inputTextInterval.value      = (typeof ts.intervalMs === 'number') ? ts.intervalMs : 1000;
    if (inputTextRepeat)        inputTextRepeat.value        = (typeof ts.repeatCount === 'number') ? ts.repeatCount : 1;
    _textClickFormRegion = (ts.region && typeof ts.region === 'object') ? { ...ts.region } : null;
    refreshTextClickRegionSummary();
    refreshTextClickPreviewWarning();
    syncScenarioFormSections();
    return;
  }
  // simple_click branch.
  inputX.value = sc.settings.x; inputY.value = sc.settings.y;
  inputInterval.value = sc.settings.intervalMs; inputRepeat.value = sc.settings.repeatCount;
  inputButton.value = sc.settings.button;
  syncScenarioFormSections();
}

function clearScenarioForm() {
  inputName.value = ''; inputDescription.value = '';
  inputX.value = '500'; inputY.value = '400';
  inputInterval.value = '500'; inputRepeat.value = '100'; inputButton.value = 'left';
  if (inputScenarioType) inputScenarioType.value = 'simple_click';
  // Reset image_click defaults.
  _imageClickFormRegion = null;
  populateTemplateSelect('');
  if (inputImageThreshold) inputImageThreshold.value = '0.75';
  if (inputImageStep)      inputImageStep.value      = '4';
  if (inputImageTimeout)   inputImageTimeout.value   = '10000';
  if (inputImageInterval)  inputImageInterval.value  = '1000';
  if (inputImageRepeat)    inputImageRepeat.value    = '1';
  refreshImageClickRegionSummary();
  // Step 33: reset text_click defaults.
  _textClickFormRegion = null;
  if (inputTextTarget)        inputTextTarget.value        = '';
  if (inputTextLanguage)      inputTextLanguage.value      = 'ru+en';
  if (inputTextMatchMode)     inputTextMatchMode.value     = 'contains';
  if (inputTextCaseSensitive) inputTextCaseSensitive.checked = false;
  if (inputTextTimeout)       inputTextTimeout.value       = '10000';
  if (inputTextInterval)      inputTextInterval.value      = '1000';
  if (inputTextRepeat)        inputTextRepeat.value        = '1';
  refreshTextClickRegionSummary();
  refreshTextClickPreviewWarning();
  syncScenarioFormSections();
}
function showFormError(msg) { formError.textContent = msg; formError.classList.add('visible'); }
function clearFormError() { formError.textContent = ''; formError.classList.remove('visible'); }


// --- Settings ---
function openSettings() { addLogEntry(createLog('info', t('logSettingsOpened'))); renderSettingsForm(); showView('settings'); renderState(); }
function renderSettingsForm() {
  const s = getSettings();
  settingsLanguage.value = s.language; settingsTheme.value = s.theme;
  settingsMinInterval.value = s.safety.minIntervalMs; settingsMaxRepeats.value = s.safety.maxRepeatCount;
  document.getElementById('hotkey-start').textContent = s.hotkeys.start;
  document.getElementById('hotkey-stop').textContent = s.hotkeys.stop;
  document.getElementById('hotkey-emergency').textContent = s.hotkeys.emergencyStop;
  safetyModeBadge.textContent = s.safety.safeMode ? t('enabled') : t('disabled');
  safetyModeBadge.className = 'safety-badge ' + (s.safety.safeMode ? 'safety-on' : 'safety-off');
  emergencyStopBadge.textContent = s.safety.emergencyStopEnabled ? t('enabled') : t('disabled');
  emergencyStopBadge.className = 'safety-badge ' + (s.safety.emergencyStopEnabled ? 'safety-on' : 'safety-off');
}
async function saveSettingsFromForm() {
  const newSettings = { language: settingsLanguage.value, theme: settingsTheme.value, hotkeys: getSettings().hotkeys,
    safety: { safeMode: true, emergencyStopEnabled: true, minIntervalMs: Math.max(50, Number(settingsMinInterval.value) || 50), maxRepeatCount: Math.min(100000, Math.max(1, Number(settingsMaxRepeats.value) || 100000)) }
  };
  setSettings(newSettings); await saveSettings(newSettings);
  setLanguage(newSettings.language); applyTranslations(); applyTheme(newSettings.theme);
  if (typeof recordAuditEvent === 'function') {
    recordAuditEvent('settings.changed', { language: newSettings.language, theme: newSettings.theme });
  }
  addLogEntry(createLog('success', t('logSettingsSaved'))); showView('main'); renderState();
}
function goBackFromSettings() { addLogEntry(createLog('info', t('logMainOpened'))); showView('main'); renderState(); }

// --- Start / Stop ---
function startScenario() {
  const state = getState();
  if (state.execution.isRunning) { addLogEntry(createLog('warning', t('logAlreadyRunning'))); renderState(); return; }
  const sc = getScenarioById(state.selectedScenarioId);
  if (!sc) { addLogEntry(createLog('error', t('logNoScenario'))); reportError({ code: 'NO_SCENARIO', message: t('logNoScenario') }, 'start'); renderState(); return; }
  // Step 17: audit the start request (in-memory).
  if (typeof recordAuditEvent === 'function') {
    recordAuditEvent('scenario.start.requested', { scenarioId: sc.id, scenarioName: sc.name });
  }
  runScenario(sc, {
    onStart: () => { setRunning(true); setExecutionRunning(true); setExecutionProgress(0, sc.settings.repeatCount); setExecutionStartedAt(new Date().toISOString()); setExecutionFinishedAt(null); setExecutionLastAction(null); addLogEntry(createLog('success', `${t('logScenarioStarted')}: ${sc.name}`)); window.clickflow.system.setExecutionRunning(true); if (typeof recordAuditEvent === 'function') recordAuditEvent('scenario.start.approved', { scenarioId: sc.id }); renderState(); },
    onAction: (action, c, total) => {
      setExecutionLastAction(action);
      // Step 30: log either type. For image_click we always log
      // (no_match included) because the user benefits from seeing
      // every match cycle; for simple_click we keep the rate
      // limit so 100k iterations don't flood the log.
      // Step 33: text_click follows the same "always log" rule as
      // image_click — the user explicitly asked to find a text,
      // so each cycle is worth surfacing.
      if (action && action.type === 'image_click') {
        var tplId = action.templateId || '';
        if (action.status === 'no_match') {
          addLogEntry(createLog('warning', `${c}/${total}: ${t('imageClickNoMatch')} template=${tplId} confidence=${(typeof action.confidence === 'number') ? Math.round(action.confidence * 100) + '%' : '?'}`));
        } else {
          var tp = action.targetPoint || { x: 0, y: 0 };
          addLogEntry(createLog('info', `${c}/${total}: ${t('imageClickSimulated')} x=${tp.x | 0} y=${tp.y | 0} confidence=${(typeof action.confidence === 'number') ? Math.round(action.confidence * 100) + '%' : '?'}`));
        }
      } else if (action && action.type === 'text_click') {
        if (action.status === 'no_match') {
          addLogEntry(createLog('warning', `${c}/${total}: ${t('textClickNoMatch')}`));
        } else {
          var ttp = action.targetPoint || { x: 0, y: 0 };
          // Truncate the target text inside the log so a huge
          // input doesn't blow up the renderer log card.
          var safe = typeof action.text === 'string'
            ? (action.text.length > 60 ? action.text.slice(0, 60) + '…' : action.text)
            : '';
          addLogEntry(createLog('info', `${c}/${total}: ${t('textClickSimulated')} text="${safe}" x=${ttp.x | 0} y=${ttp.y | 0} confidence=${(typeof action.confidence === 'number') ? Math.round(action.confidence * 100) + '%' : '?'}`));
        }
      } else if (shouldLogAction(c, total)) {
        addLogEntry(createLog('info', `${c}/${total}: click x=${action.x} y=${action.y}`));
      }
    },
    onProgress: (c, total) => { setExecutionProgress(c, total); renderState(); },
    onStop: () => { setRunning(false); setExecutionRunning(false); setExecutionFinishedAt(new Date().toISOString()); addLogEntry(createLog('warning', t('logScenarioStopped'))); window.clickflow.system.setExecutionRunning(false); renderState(); },
    onComplete: () => { setRunning(false); setExecutionRunning(false); setExecutionFinishedAt(new Date().toISOString()); addLogEntry(createLog('success', t('logScenarioComplete'))); window.clickflow.system.setExecutionRunning(false); if (typeof recordAuditEvent === 'function') recordAuditEvent('scenario.completed', { scenarioId: sc.id }); renderState(); },
    onError: (msg) => { setRunning(false); setExecutionRunning(false); reportError({ code: 'EXEC_ERROR', message: msg }, 'click-engine'); addLogEntry(createLog('error', msg)); window.clickflow.system.setExecutionRunning(false); if (typeof recordAuditEvent === 'function') recordAuditEvent('safety.validation.failed', { scenarioId: sc.id, reason: msg }); renderState(); }
  }, { safety: state.settings.safety });
}

function stopScenario() {
  const state = getState();
  if (!state.execution.isRunning) { addLogEntry(createLog('info', t('logNoActiveStop'))); renderState(); return; }
  if (typeof recordAuditEvent === 'function') recordAuditEvent('scenario.stop.requested', { scenarioId: state.selectedScenarioId });
  stopEngine(); addLogEntry(createLog('info', t('logStopping'))); renderState();
}

function triggerEmergencyStop() {
  const state = getState(); if (!state.execution.isRunning) return;
  if (typeof recordAuditEvent === 'function') recordAuditEvent('emergency.stop', { scenarioId: state.selectedScenarioId });
  stopEngine(); setRunning(false); setExecutionRunning(false); setExecutionFinishedAt(new Date().toISOString());
  addLogEntry(createLog('warning', t('logEmergencyStop'))); window.clickflow.system.setExecutionRunning(false); renderState();
}


// --- Advanced Dashboard ---
function openAdvancedMode() { addLogEntry(createLog('info', t('logAdvancedOpened'))); showView('advanced'); setAdvancedTab('overview'); renderAdvancedDashboard(); renderState(); }
function goBackToMain() { addLogEntry(createLog('info', t('logMainOpened'))); showView('main'); renderState(); }

function setAdvancedTab(tab) {
  setActiveAdvancedTab(tab);
  document.querySelectorAll('.adv-tab').forEach(btn => btn.classList.toggle('active', btn.getAttribute('data-advanced-tab') === tab));
  document.querySelectorAll('.adv-section').forEach(sec => sec.classList.add('adv-section-hidden'));
  const active = document.getElementById('advanced-tab-' + tab);
  if (active) active.classList.remove('adv-section-hidden');
  renderAdvancedDashboard();
}

function renderAdvancedDashboard() {
  const state = getState();
  switch (state.activeAdvancedTab) {
    case 'overview': renderAdvancedOverview(); break;
    case 'scenarios': renderAdvancedScenarios(); break;
    case 'execution': renderAdvancedExecution(); break;
    case 'logs': renderAdvancedLogs(); break;
    case 'settings': renderAdvancedSettings(); break;
    case 'safety': renderAdvancedSafety(); break;
    case 'screenCapture': if (typeof renderScreenCapture === 'function') renderScreenCapture(); break;
    case 'templates': if (typeof renderTemplatesTab === 'function') renderTemplatesTab(); break;
    case 'templateMatching': if (typeof renderTemplateMatchingTab === 'function') renderTemplateMatchingTab(); break;
    case 'ocr': if (typeof renderOcrTab === 'function') renderOcrTab(); break;
    case 'future': renderAdvancedFuture(); break;
  }
}

function renderAdvancedOverview() {
  const state = getState(); const sc = getScenarioById(state.selectedScenarioId); const scns = getScenarios();
  const c = document.getElementById('advanced-tab-overview'); c.innerHTML = '';
  const grid = document.createElement('div'); grid.className = 'adv-grid';
  // Active scenario
  const scCard = document.createElement('div'); scCard.className = 'adv-card';
  const scT = document.createElement('div'); scT.className = 'adv-card-title'; scT.textContent = t('activeScenario'); scCard.appendChild(scT);
  if (sc) { addCardRow(scCard, t('scenarioName'), sc.name); addCardRow(scCard, t('coordinates'), `${sc.settings.x}, ${sc.settings.y}`); addCardRow(scCard, t('interval'), `${sc.settings.intervalMs} ms`); addCardRow(scCard, t('repeats'), `${sc.settings.repeatCount}`); }
  else addCardRow(scCard, '', t('noData'));
  grid.appendChild(scCard);
  // Execution
  const exCard = document.createElement('div'); exCard.className = 'adv-card';
  const exT = document.createElement('div'); exT.className = 'adv-card-title'; exT.textContent = t('executionStatus'); exCard.appendChild(exT);
  addCardRow(exCard, t('status'), state.isRunning ? t('running') : t('stopped'));
  addCardRow(exCard, t('progress'), `${state.execution.progressCurrent}/${state.execution.progressTotal} (${state.execution.progressPercent}%)`);
  grid.appendChild(exCard);
  // Stats
  const stCard = document.createElement('div'); stCard.className = 'adv-card';
  const stT = document.createElement('div'); stT.className = 'adv-card-title'; stT.textContent = t('statistics'); stCard.appendChild(stT);
  addCardRow(stCard, t('scenarioCount'), `${scns.length}`);
  addCardRow(stCard, t('profileCount'), `${getProfileCount()}`);
  addCardRow(stCard, t('logCount'), `${state.logs.length}`);
  addCardRow(stCard, t('errorCount'), `${getErrorCount()}`);
  grid.appendChild(stCard);
  // Settings summary
  const seCard = document.createElement('div'); seCard.className = 'adv-card';
  const seT = document.createElement('div'); seT.className = 'adv-card-title'; seT.textContent = t('settingsSummary'); seCard.appendChild(seT);
  addCardRow(seCard, t('language'), state.settings.language === 'ru' ? t('langRu') : t('langEn'));
  addCardRow(seCard, t('safeMode'), state.settings.safety.safeMode ? t('enabled') : t('disabled'));
  addCardRow(seCard, t('activeProfile'), getActiveProfile().name);
  grid.appendChild(seCard);
  c.appendChild(grid);
  // Recent events
  const reCard = document.createElement('div'); reCard.className = 'adv-card';
  const reT = document.createElement('div'); reT.className = 'adv-card-title'; reT.textContent = t('recentEvents'); reCard.appendChild(reT);
  state.logs.slice(-3).forEach(log => reCard.appendChild(createLogEl(log)));
  if (state.logs.length === 0) { const em = document.createElement('div'); em.className = 'adv-log-empty'; em.textContent = t('noEvents'); reCard.appendChild(em); }
  c.appendChild(reCard);
}


function renderAdvancedScenarios() {
  const state = getState(); const scns = getScenarios();
  const c = document.getElementById('advanced-tab-scenarios'); c.innerHTML = '';
  // Info card
  const card = document.createElement('div'); card.className = 'adv-card';
  const title = document.createElement('div'); title.className = 'adv-card-title'; title.textContent = t('tabScenarios'); card.appendChild(title);
  addCardRow(card, t('scenarioCount'), `${scns.length}`);
  addCardRow(card, t('activeScenario'), state.selectedScenarioName);
  scns.slice(0, 3).forEach(sc => addCardRow(card, sc.name, `${sc.settings.x},${sc.settings.y} · ${sc.settings.intervalMs}ms`));
  const openBtn = document.createElement('button'); openBtn.className = 'adv-btn'; openBtn.textContent = t('openScenarioList'); openBtn.addEventListener('click', openScenarioList); card.appendChild(openBtn);
  c.appendChild(card);
  // Import/Export card
  const ieCard = document.createElement('div'); ieCard.className = 'adv-card';
  const ieTitle = document.createElement('div'); ieTitle.className = 'adv-card-title'; ieTitle.textContent = t('importExport'); ieCard.appendChild(ieTitle);
  const btnGroup = document.createElement('div'); btnGroup.className = 'adv-btn-group';
  const bExpAll = document.createElement('button'); bExpAll.className = 'adv-btn adv-btn-secondary'; bExpAll.textContent = t('exportAll'); bExpAll.addEventListener('click', () => doExportScenarios('all'));
  const bExpCust = document.createElement('button'); bExpCust.className = 'adv-btn adv-btn-secondary'; bExpCust.textContent = t('exportCustom'); bExpCust.addEventListener('click', () => doExportScenarios('custom'));
  const bBackup = document.createElement('button'); bBackup.className = 'adv-btn adv-btn-secondary'; bBackup.textContent = t('backupScenarios'); bBackup.addEventListener('click', () => doExportScenarios('backup'));
  const bImport = document.createElement('button'); bImport.className = 'adv-btn'; bImport.textContent = t('importScenarios'); bImport.addEventListener('click', doImportScenarios);
  btnGroup.appendChild(bExpAll); btnGroup.appendChild(bExpCust); btnGroup.appendChild(bBackup); btnGroup.appendChild(bImport);
  ieCard.appendChild(btnGroup); c.appendChild(ieCard);
  // Import preview
  const preview = getState().importPreview;
  if (preview) { renderImportPreview(c, preview); }
  // Profiles card
  const pCard = document.createElement('div'); pCard.className = 'adv-card';
  const pTitle = document.createElement('div'); pTitle.className = 'adv-card-title'; pTitle.textContent = t('profiles'); pCard.appendChild(pTitle);
  addCardRow(pCard, t('activeProfile'), getActiveProfile().name);
  addCardRow(pCard, t('profileCount'), `${getProfileCount()}`);
  const pList = document.createElement('div'); pList.className = 'profile-list';
  getProfiles().forEach(p => {
    const pEl = document.createElement('div'); pEl.className = 'profile-card' + (p.id === getActiveProfileId() ? ' active' : '');
    const pName = document.createElement('span'); pName.className = 'profile-card-name'; pName.textContent = p.name;
    const pMeta = document.createElement('span'); pMeta.className = 'profile-card-meta'; pMeta.textContent = `${p.scenarioIds.length} ${t('scenarioCount').toLowerCase()}`;
    pEl.appendChild(pName); pEl.appendChild(pMeta);
    pEl.addEventListener('click', async () => { setActiveProfile(p.id); await saveProfiles(); addLogEntry(createLog('info', `${t('activeProfile')}: ${p.name}`)); renderAdvancedScenarios(); });
    pList.appendChild(pEl);
  });
  pCard.appendChild(pList); c.appendChild(pCard);
}

function renderImportPreview(container, preview) {
  const div = document.createElement('div'); div.className = 'import-preview';
  const title = document.createElement('div'); title.className = 'import-preview-title'; title.textContent = `${t('importPreview')}: ${preview.length} ${t('scenariosToImport').toLowerCase()}`;
  div.appendChild(title);
  const list = document.createElement('ul'); list.className = 'import-preview-list';
  preview.slice(0, 5).forEach(sc => { const li = document.createElement('li'); li.textContent = sc.name || 'Unnamed'; list.appendChild(li); });
  if (preview.length > 5) { const li = document.createElement('li'); li.textContent = `... +${preview.length - 5}`; list.appendChild(li); }
  div.appendChild(list);
  const btnGroup = document.createElement('div'); btnGroup.className = 'adv-btn-group';
  const bConfirm = document.createElement('button'); bConfirm.className = 'adv-btn'; bConfirm.textContent = t('confirmImport'); bConfirm.addEventListener('click', confirmImport);
  const bCancel = document.createElement('button'); bCancel.className = 'adv-btn adv-btn-secondary'; bCancel.textContent = t('cancelImport'); bCancel.addEventListener('click', cancelImport);
  btnGroup.appendChild(bConfirm); btnGroup.appendChild(bCancel);
  div.appendChild(btnGroup); container.appendChild(div);
}

async function doExportScenarios(mode) {
  const result = await exportScenarios(mode);
  if (result.success) { addLogEntry(createLog('success', t('exportedScenarios'))); if (typeof recordAuditEvent === 'function') recordAuditEvent('export.completed', { kind: 'scenarios', mode: mode }); }
  else if (result.cancelled) { addLogEntry(createLog('info', t('operationCancelled'))); }
  else { addLogEntry(createLog('error', result.error || t('invalidImportFile'))); reportError({ code: 'EXPORT_FAIL', message: result.error }, 'export'); }
  renderState();
}

async function doImportScenarios() {
  const result = await window.clickflow.scenarios.importFile();
  if (result.cancelled) { addLogEntry(createLog('info', t('operationCancelled'))); renderState(); return; }
  if (!result.success) { addLogEntry(createLog('error', result.error || t('invalidImportFile'))); reportError({ code: 'IMPORT_FAIL', message: result.error }, 'import'); renderState(); return; }
  setImportPreview(result.data.scenarios);
  renderAdvancedScenarios();
}

async function confirmImport() {
  const preview = getState().importPreview;
  if (!preview) return;
  const result = importScenarios(preview);
  clearImportPreview();
  if (result.success) { await saveScenarios(); addLogEntry(createLog('success', `${t('importedScenarios')}: ${result.count}`)); if (typeof recordAuditEvent === 'function') recordAuditEvent('import.completed', { kind: 'scenarios', count: result.count }); }
  else { addLogEntry(createLog('error', result.error)); }
  renderAdvancedScenarios(); renderState();
}
function cancelImport() { clearImportPreview(); addLogEntry(createLog('info', t('operationCancelled'))); renderAdvancedScenarios(); }


function renderAdvancedExecution() {
  const state = getState(); const c = document.getElementById('advanced-tab-execution'); c.innerHTML = '';
  const card = document.createElement('div'); card.className = 'adv-card';
  const title = document.createElement('div'); title.className = 'adv-card-title'; title.textContent = t('executionStatus'); card.appendChild(title);
  addCardRow(card, t('status'), state.isRunning ? t('running') : t('stopped'));
  addCardRow(card, t('executionMode'), t('simulationMode'));
  addCardRow(card, t('progress'), `${state.execution.progressCurrent} / ${state.execution.progressTotal} · ${state.execution.progressPercent}%`);
  addCardRow(card, t('lastAction'), formatLastAction(state.execution.lastAction));
  addCardRow(card, t('startedAt'), state.execution.startedAt || t('none'));
  addCardRow(card, t('finishedAt'), state.execution.finishedAt || t('none'));
  const bar = document.createElement('div'); bar.className = 'adv-progress-bar';
  const fill = document.createElement('div'); fill.className = 'adv-progress-fill' + (state.execution.progressPercent >= 100 ? ' complete' : ''); fill.style.width = state.execution.progressPercent + '%';
  bar.appendChild(fill); card.appendChild(bar); c.appendChild(card);
  const actions = document.createElement('div'); actions.style.cssText = 'display:flex;gap:10px;width:100%';
  const sBtn = document.createElement('button'); sBtn.className = 'adv-btn'; sBtn.textContent = t('start'); sBtn.disabled = state.execution.isRunning; sBtn.style.flex = '1'; sBtn.addEventListener('click', startScenario);
  const xBtn = document.createElement('button'); xBtn.className = 'adv-btn adv-btn-danger'; xBtn.textContent = t('stop'); xBtn.disabled = !state.execution.isRunning; xBtn.style.flex = '1'; xBtn.addEventListener('click', stopScenario);
  actions.appendChild(sBtn); actions.appendChild(xBtn); c.appendChild(actions);
}

function renderAdvancedLogs() {
  const state = getState(); const c = document.getElementById('advanced-tab-logs'); c.innerHTML = '';
  const filtersDiv = document.createElement('div'); filtersDiv.className = 'adv-log-filters';
  ['all','info','success','warning','error'].forEach(key => {
    const btn = document.createElement('button'); btn.className = 'adv-log-filter' + (advancedLogFilter === key ? ' active' : '');
    btn.textContent = t('logFilter' + key.charAt(0).toUpperCase() + key.slice(1));
    btn.addEventListener('click', () => { advancedLogFilter = key; renderAdvancedLogs(); });
    filtersDiv.appendChild(btn);
  });
  c.appendChild(filtersDiv);
  const card = document.createElement('div'); card.className = 'adv-card';
  const title = document.createElement('div'); title.className = 'adv-card-title'; title.textContent = `${t('fullLogs')} (${state.logs.length})`; card.appendChild(title);
  const logList = document.createElement('div'); logList.className = 'adv-log-list';
  let filtered = advancedLogFilter === 'all' ? state.logs : state.logs.filter(l => l.type === advancedLogFilter);
  if (filtered.length === 0) { const em = document.createElement('div'); em.className = 'adv-log-empty'; em.textContent = t('noLogs'); logList.appendChild(em); }
  else filtered.forEach(log => logList.appendChild(createLogEl(log)));
  card.appendChild(logList); c.appendChild(card);
  const clearBtn = document.createElement('button'); clearBtn.className = 'adv-btn adv-btn-danger'; clearBtn.textContent = t('clearLogs');
  clearBtn.addEventListener('click', () => { if (confirm(t('confirmClearLogs'))) { clearLogs(); renderAdvancedLogs(); renderState(); } });
  c.appendChild(clearBtn);
}

function renderAdvancedSettings() {
  const state = getState(); const c = document.getElementById('advanced-tab-settings'); c.innerHTML = '';
  const card = document.createElement('div'); card.className = 'adv-card';
  const title = document.createElement('div'); title.className = 'adv-card-title'; title.textContent = t('settingsSummary'); card.appendChild(title);
  addCardRow(card, t('language'), state.settings.language === 'ru' ? t('langRu') : t('langEn'));
  addCardRow(card, t('theme'), state.settings.theme);
  addCardRow(card, t('hotkeyStart'), state.settings.hotkeys.start);
  addCardRow(card, t('hotkeyStop'), state.settings.hotkeys.stop);
  addCardRow(card, t('hotkeyEmergency'), state.settings.hotkeys.emergencyStop);
  addCardRow(card, t('safeMode'), state.settings.safety.safeMode ? t('enabled') : t('disabled'));
  const hint = document.createElement('div'); hint.className = 'hotkey-hint'; hint.textContent = t('hotkeysFocusedOnly'); card.appendChild(hint);
  const openBtn = document.createElement('button'); openBtn.className = 'adv-btn'; openBtn.textContent = t('openSettings'); openBtn.addEventListener('click', openSettings); card.appendChild(openBtn);
  c.appendChild(card);
  // Import/Export/Reset settings
  const ieCard = document.createElement('div'); ieCard.className = 'adv-card';
  const ieT = document.createElement('div'); ieT.className = 'adv-card-title'; ieT.textContent = t('importExport'); ieCard.appendChild(ieT);
  const btnG = document.createElement('div'); btnG.className = 'adv-btn-group';
  const bExp = document.createElement('button'); bExp.className = 'adv-btn adv-btn-secondary'; bExp.textContent = t('exportSettings'); bExp.addEventListener('click', doExportSettings);
  const bImp = document.createElement('button'); bImp.className = 'adv-btn adv-btn-secondary'; bImp.textContent = t('importSettings'); bImp.addEventListener('click', doImportSettings);
  const bReset = document.createElement('button'); bReset.className = 'adv-btn adv-btn-danger'; bReset.textContent = t('resetSettings'); bReset.addEventListener('click', doResetSettings);
  btnG.appendChild(bExp); btnG.appendChild(bImp); btnG.appendChild(bReset); ieCard.appendChild(btnG); c.appendChild(ieCard);
}

async function doExportSettings() {
  const data = { format: 'clickflow-settings', version: 1, exportedAt: new Date().toISOString(), settings: getSettings() };
  const result = await window.clickflow.settings.export(data);
  if (result.success) addLogEntry(createLog('success', t('settingsExported')));
  else if (result.cancelled) addLogEntry(createLog('info', t('operationCancelled')));
  else { addLogEntry(createLog('error', result.error)); reportError({ code: 'SETTINGS_EXPORT', message: result.error }, 'settings'); }
  renderState();
}
async function doImportSettings() {
  const result = await window.clickflow.settings.importFile();
  if (result.cancelled) { addLogEntry(createLog('info', t('operationCancelled'))); renderState(); return; }
  if (!result.success) { addLogEntry(createLog('error', result.error)); reportError({ code: 'SETTINGS_IMPORT', message: result.error }, 'settings'); renderState(); return; }
  if (!confirm(t('confirmImportSettings'))) { renderState(); return; }
  const normalized = normalizeSettings(result.data);
  setSettings(normalized); await saveSettings(normalized); setLanguage(normalized.language); applyTranslations();
  addLogEntry(createLog('success', t('settingsImported'))); renderState();
}
async function doResetSettings() {
  if (!confirm(t('confirmResetSettings'))) return;
  await resetSettings(); const defaults = getDefaultSettings(); setSettings(defaults); setLanguage(defaults.language); applyTranslations();
  addLogEntry(createLog('success', t('settingsReset'))); renderState();
}


function renderAdvancedSafety() {
  const state = getState(); const c = document.getElementById('advanced-tab-safety'); c.innerHTML = '';
  const card = document.createElement('div'); card.className = 'adv-card';
  const title = document.createElement('div'); title.className = 'adv-card-title'; title.textContent = t('safetyOverview'); card.appendChild(title);
  addCardRow(card, t('safeMode'), state.settings.safety.safeMode ? t('enabled') : t('disabled'));
  addCardRow(card, t('emergencyStop'), state.settings.safety.emergencyStopEnabled ? t('enabled') : t('disabled'));
  addCardRow(card, t('minInterval'), `${state.settings.safety.minIntervalMs} ms`);
  addCardRow(card, t('maxRepeats'), `${state.settings.safety.maxRepeatCount}`);
  addCardRow(card, t('emergencyStopHint'), 'Escape / CmdOrCtrl+Alt+E');
  c.appendChild(card);

  // Global Hotkeys card
  const hkCard = document.createElement('div'); hkCard.className = 'adv-card';
  const hkTitle = document.createElement('div'); hkTitle.className = 'adv-card-title'; hkTitle.textContent = t('globalHotkeys'); hkCard.appendChild(hkTitle);
  addCardRow(hkCard, t('startHotkey'), '');
  addCardRow(hkCard, t('stopHotkey'), '');
  addCardRow(hkCard, t('emergencyHotkey'), '');
  const hkBtnGroup = document.createElement('div'); hkBtnGroup.className = 'adv-btn-group';
  const regBtn = document.createElement('button'); regBtn.className = 'adv-btn adv-btn-secondary'; regBtn.textContent = t('registerHotkeys');
  regBtn.addEventListener('click', async () => { const r = await window.clickflow.hotkeys.register(); addLogEntry(createLog(r.success ? 'success' : 'error', r.success ? t('hotkeyRegistered') : t('hotkeyRegistrationFailed'))); renderAdvancedSafety(); renderState(); });
  const unregBtn = document.createElement('button'); unregBtn.className = 'adv-btn adv-btn-secondary'; unregBtn.textContent = t('unregisterHotkeys');
  unregBtn.addEventListener('click', async () => { await window.clickflow.hotkeys.unregister(); addLogEntry(createLog('info', t('hotkeyUnregistered'))); renderAdvancedSafety(); renderState(); });
  const statusBtn = document.createElement('button'); statusBtn.className = 'adv-btn adv-btn-secondary'; statusBtn.textContent = t('refreshHotkeyStatus');
  statusBtn.addEventListener('click', async () => { const s = await window.clickflow.hotkeys.getStatus(); addLogEntry(createLog('info', s.registered ? t('globalHotkeysEnabled') : t('globalHotkeysDisabled'))); renderAdvancedSafety(); renderState(); });
  hkBtnGroup.appendChild(regBtn); hkBtnGroup.appendChild(unregBtn); hkBtnGroup.appendChild(statusBtn);
  hkCard.appendChild(hkBtnGroup); c.appendChild(hkCard);

  // Diagnostics
  const dCard = document.createElement('div'); dCard.className = 'adv-card';
  const dTitle = document.createElement('div'); dTitle.className = 'adv-card-title'; dTitle.textContent = t('diagnostics'); dCard.appendChild(dTitle);
  addCardRow(dCard, 'App version', window.clickflow.version);
  addCardRow(dCard, t('language'), state.settings.language);
  addCardRow(dCard, t('theme'), state.settings.theme);
  addCardRow(dCard, t('scenarioCount'), `${getScenarios().length}`);
  addCardRow(dCard, t('profileCount'), `${getProfileCount()}`);
  addCardRow(dCard, t('logCount'), `${state.logs.length}`);
  addCardRow(dCard, t('errorCount'), `${getErrorCount()}`);
  addCardRow(dCard, t('currentView'), state.currentView);
  addCardRow(dCard, t('executionRunning'), state.execution.isRunning ? 'yes' : 'no');
  const copyBtn = document.createElement('button'); copyBtn.className = 'adv-btn adv-btn-secondary'; copyBtn.textContent = t('copyDiagnostics');
  copyBtn.addEventListener('click', copyDiagnostics);
  dCard.appendChild(copyBtn); c.appendChild(dCard);

  // System info (from main process)
  const sysCard = document.createElement('div'); sysCard.className = 'adv-card';
  const sysTitle = document.createElement('div'); sysTitle.className = 'adv-card-title'; sysTitle.textContent = t('systemInfo'); sysCard.appendChild(sysTitle);
  window.clickflow.system.getInfo().then(info => {
    addCardRow(sysCard, t('electronVersion'), info.electronVersion || '?');
    addCardRow(sysCard, t('platformInfo'), `${info.platform} (${info.arch})`);
    addCardRow(sysCard, t('isPackaged'), info.isPackaged ? 'yes' : 'no');
    addCardRow(sysCard, t('simulationOnly'), 'true');
    addCardRow(sysCard, t('trayAvailable'), info.trayAvailable ? t('trayAvailable') : t('trayUnavailable'));
    addCardRow(sysCard, t('globalHotkeys'), info.globalHotkeysRegistered ? t('globalHotkeysEnabled') : t('globalHotkeysDisabled'));
  });
  c.appendChild(sysCard);

  // Beta health card (Step 15)
  const bhCard = document.createElement('div'); bhCard.className = 'adv-card';
  const bhTitle = document.createElement('div'); bhTitle.className = 'adv-card-title'; bhTitle.textContent = t('betaHealth'); bhCard.appendChild(bhTitle);
  // Render placeholder rows synchronously so the card renders even before
  // the IPC promise resolves; rows are then updated in place.
  addCardRow(bhCard, t('simulationOnly'), t('flagEnabled'));
  addCardRow(bhCard, t('realClicksImplemented'), t('no'));
  addCardRow(bhCard, t('ocrImplemented'), t('no'));
  addCardRow(bhCard, t('imageRecognitionImplemented'), t('no'));
  const bhDocsRow = document.createElement('div'); bhDocsRow.className = 'adv-card-row';
  const bhDocsLbl = document.createElement('span'); bhDocsLbl.className = 'adv-card-label'; bhDocsLbl.textContent = t('docsReady');
  const bhDocsVal = document.createElement('span'); bhDocsVal.className = 'adv-card-value'; bhDocsVal.textContent = '...';
  bhDocsRow.appendChild(bhDocsLbl); bhDocsRow.appendChild(bhDocsVal); bhCard.appendChild(bhDocsRow);
  const bhPackRow = document.createElement('div'); bhPackRow.className = 'adv-card-row';
  const bhPackLbl = document.createElement('span'); bhPackLbl.className = 'adv-card-label'; bhPackLbl.textContent = t('packagingConfigured');
  const bhPackVal = document.createElement('span'); bhPackVal.className = 'adv-card-value'; bhPackVal.textContent = '...';
  bhPackRow.appendChild(bhPackLbl); bhPackRow.appendChild(bhPackVal); bhCard.appendChild(bhPackRow);
  const bhSecRow = document.createElement('div'); bhSecRow.className = 'adv-card-row';
  const bhSecLbl = document.createElement('span'); bhSecLbl.className = 'adv-card-label'; bhSecLbl.textContent = t('securityChecklistPresent');
  const bhSecVal = document.createElement('span'); bhSecVal.className = 'adv-card-value'; bhSecVal.textContent = '...';
  bhSecRow.appendChild(bhSecLbl); bhSecRow.appendChild(bhSecVal); bhCard.appendChild(bhSecRow);
  const bhActRow = document.createElement('div'); bhActRow.className = 'adv-card-row';
  const bhActLbl = document.createElement('span'); bhActLbl.className = 'adv-card-label'; bhActLbl.textContent = t('actionSchemaPresent');
  const bhActVal = document.createElement('span'); bhActVal.className = 'adv-card-value'; bhActVal.textContent = '...';
  bhActRow.appendChild(bhActLbl); bhActRow.appendChild(bhActVal); bhCard.appendChild(bhActRow);
  c.appendChild(bhCard);
  window.clickflow.system.getBetaHealth().then(h => {
    bhDocsVal.textContent = h.docsReady ? t('yes') : t('no');
    bhPackVal.textContent = h.packagingConfigured ? t('yes') : t('no');
    bhSecVal.textContent  = h.securityChecklistPresent ? t('yes') : t('no');
    bhActVal.textContent  = h.actionSchemaPresent ? t('yes') : t('no');
  }).catch(() => {
    bhDocsVal.textContent = '?'; bhPackVal.textContent = '?'; bhSecVal.textContent = '?'; bhActVal.textContent = '?';
  });

  // Feature flags card (Step 16)
  const ffCard = document.createElement('div'); ffCard.className = 'adv-card';
  const ffTitle = document.createElement('div'); ffTitle.className = 'adv-card-title'; ffTitle.textContent = t('featureFlags'); ffCard.appendChild(ffTitle);
  const flags = (typeof getFeatureFlagsForDiagnostics === 'function')
    ? getFeatureFlagsForDiagnostics()
    : { safety: { simulationOnly: true, realDesktopActions: false, ocr: false, imageRecognition: false }, capabilities: {} };
  addCardRow(ffCard, t('simulationOnly'), flags.safety.simulationOnly ? t('flagEnabled') : t('flagDisabled'));
  addCardRow(ffCard, 'realDesktopActions', flags.safety.realDesktopActions ? t('flagEnabled') : t('flagDisabled'));
  addCardRow(ffCard, 'OCR', flags.safety.ocr ? t('flagEnabled') : t('flagDisabled'));
  addCardRow(ffCard, 'imageRecognition', flags.safety.imageRecognition ? t('flagEnabled') : t('flagDisabled'));
  c.appendChild(ffCard);

  // Warning
  const warning = document.createElement('div'); warning.className = 'adv-warning'; warning.textContent = t('simulationModeNotice'); c.appendChild(warning);

  // --- Step 17: Real desktop actions disabled notice (extra, explicit) ---
  const realWarning = document.createElement('div'); realWarning.className = 'adv-warning';
  realWarning.textContent = t('realDesktopActionsDisabledNotice'); c.appendChild(realWarning);

  // --- Step 17: Action pipeline card ---
  const apCard = document.createElement('div'); apCard.className = 'adv-card';
  const apTitle = document.createElement('div'); apTitle.className = 'adv-card-title'; apTitle.textContent = t('actionPipeline'); apCard.appendChild(apTitle);
  let pipelineStatus = { simulationOnly: true, realActionsEnabled: false, realActionsImplemented: false, pipelineReady: true };
  if (typeof getActionPipelineStatus === 'function') pipelineStatus = getActionPipelineStatus();
  addCardRow(apCard, t('pipelineReady'),            pipelineStatus.pipelineReady ? t('yes') : t('no'));
  addCardRow(apCard, t('simulationOnly'),           pipelineStatus.simulationOnly ? t('flagEnabled') : t('flagDisabled'));
  addCardRow(apCard, t('realActionsEnabled'),       pipelineStatus.realActionsEnabled ? t('flagEnabled') : t('flagDisabled'));
  addCardRow(apCard, t('realActionsImplemented'),   pipelineStatus.realActionsImplemented ? t('yes') : t('no'));
  let realAllowed = false;
  if (typeof isRealActionAllowed === 'function') realAllowed = isRealActionAllowed(state.settings);
  addCardRow(apCard, t('realActionAllowed'), realAllowed ? t('yes') : t('no'));
  let missingCount = 9;
  if (typeof getMissingRealActionRequirements === 'function') {
    missingCount = getMissingRealActionRequirements(state.settings).length;
  }
  addCardRow(apCard, t('missingRequirements'), String(missingCount));
  c.appendChild(apCard);

  // --- Step 17: Safety gates card ---
  const sgCard = document.createElement('div'); sgCard.className = 'adv-card';
  const sgTitle = document.createElement('div'); sgTitle.className = 'adv-card-title'; sgTitle.textContent = t('safetyGates'); sgCard.appendChild(sgTitle);
  let gateStatus = null;
  if (typeof getSafetyGateStatus === 'function') gateStatus = getSafetyGateStatus(state.settings);
  if (gateStatus) {
    addCardRow(sgCard, t('safeMode'),       gateStatus.safeMode      ? t('enabled') : t('disabled'));
    addCardRow(sgCard, t('emergencyStop'),  gateStatus.emergencyStop ? t('enabled') : t('disabled'));
    addCardRow(sgCard, t('minInterval'),    gateStatus.minIntervalMs == null ? t('none') : (gateStatus.minIntervalMs + ' ms'));
    addCardRow(sgCard, t('maxRepeats'),     gateStatus.maxRepeatCount == null ? t('none') : String(gateStatus.maxRepeatCount));
    addCardRow(sgCard, 'maxRunTimeMs',      gateStatus.maxRunTimeMs == null ? t('none') : (gateStatus.maxRunTimeMs + ' ms'));
  } else {
    addCardRow(sgCard, '', t('noData'));
  }
  c.appendChild(sgCard);

  // --- Step 17: Real actions readiness checklist ---
  const rrCard = document.createElement('div'); rrCard.className = 'adv-card';
  const rrTitle = document.createElement('div'); rrTitle.className = 'adv-card-title'; rrTitle.textContent = t('realActionsReadiness'); rrCard.appendChild(rrTitle);
  const rrList = document.createElement('div'); rrList.className = 'readiness-list';
  const ff = (typeof getFeatureFlags === 'function') ? getFeatureFlags() : { realDesktopActions: false, simulationOnly: true };
  const rrItems = [
    { label: t('simulationOnlyBuild'),         badge: t('flagEnabled'), status: 'ready' },
    { label: t('realActionsImplemented'),      badge: t('no'),          status: 'missing' },
    { label: t('realActionsFeatureFlag'),      badge: ff.realDesktopActions ? t('flagEnabled') : t('flagDisabled'), status: ff.realDesktopActions ? 'ready' : 'missing' },
    { label: t('safeMode'),                    badge: state.settings.safety.safeMode ? t('enabled') : t('disabled'), status: state.settings.safety.safeMode ? 'ready' : 'missing' },
    { label: t('emergencyStop'),               badge: state.settings.safety.emergencyStopEnabled ? t('enabled') : t('disabled'), status: state.settings.safety.emergencyStopEnabled ? 'ready' : 'missing' },
    { label: t('auditLogsPlanned'),            badge: t('planned'),     status: 'planned' },
    { label: t('desktopAdapterNotInstalled'),  badge: t('notInstalled'), status: 'missing' },
    { label: t('osPermissionsNotChecked'),     badge: t('notChecked'),  status: 'missing' },
    { label: t('finalSafetyReviewNotPassed'),  badge: t('notPassed'),   status: 'missing' }
  ];
  rrItems.forEach(it => {
    const item = document.createElement('div'); item.className = 'readiness-item';
    const lbl = document.createElement('span'); lbl.className = 'readiness-item-label'; lbl.textContent = it.label;
    const badge = document.createElement('span');
    badge.className = 'readiness-badge readiness-' + it.status;
    badge.textContent = it.badge;
    item.appendChild(lbl); item.appendChild(badge); rrList.appendChild(item);
  });
  rrCard.appendChild(rrList);
  c.appendChild(rrCard);

  // --- Step 17: Audit events summary ---
  const aeCard = document.createElement('div'); aeCard.className = 'adv-card';
  const aeTitle = document.createElement('div'); aeTitle.className = 'adv-card-title'; aeTitle.textContent = t('auditEvents'); aeCard.appendChild(aeTitle);
  let auditSummary = { count: 0, last: null };
  if (typeof getAuditSummary === 'function') auditSummary = getAuditSummary();
  addCardRow(aeCard, t('auditEventsCount'), String(auditSummary.count));
  addCardRow(aeCard, t('lastAuditEvent'),
    auditSummary.last ? (auditSummary.last.type + ' @ ' + auditSummary.last.timestamp) : t('none2'));
  c.appendChild(aeCard);

  // --- Step 25: Screen capture status (compact diagnostics block) ---
  const scCard = document.createElement('div'); scCard.className = 'adv-card';
  const scTitle = document.createElement('div'); scTitle.className = 'adv-card-title'; scTitle.textContent = t('screenCaptureStatus'); scCard.appendChild(scTitle);
  const scState = state.screenCapture || { sources: [], selectedSourceId: null, preview: null, lastCapturedAt: null, lastError: null };
  // available — async; show placeholder until status resolves.
  const scAvailRow = document.createElement('div'); scAvailRow.className = 'adv-card-row';
  const scAvailLbl = document.createElement('span'); scAvailLbl.className = 'adv-card-label'; scAvailLbl.textContent = 'available';
  const scAvailVal = document.createElement('span'); scAvailVal.className = 'adv-card-value'; scAvailVal.textContent = '...';
  scAvailRow.appendChild(scAvailLbl); scAvailRow.appendChild(scAvailVal); scCard.appendChild(scAvailRow);
  if (typeof getScreenCaptureStatus === 'function') {
    getScreenCaptureStatus().then(st => { scAvailVal.textContent = st && st.available ? t('yes') : t('no'); }).catch(() => { scAvailVal.textContent = '?'; });
  } else {
    scAvailVal.textContent = '?';
  }
  addCardRow(scCard, t('sourcesCount'), String((scState.sources || []).length));
  addCardRow(scCard, t('selectedScreenSource'), scState.selectedSourceId || t('none2'));
  addCardRow(scCard, t('previewAvailable'), scState.preview ? t('yes') : t('no'));
  addCardRow(scCard, t('capturedAt'), scState.lastCapturedAt || t('none2'));
  addCardRow(scCard, 'lastError', scState.lastError || t('none2'));
  c.appendChild(scCard);

  // --- Step 26: Region selector status (compact diagnostics block) ---
  const regCard = document.createElement('div'); regCard.className = 'adv-card';
  const regTitle = document.createElement('div'); regTitle.className = 'adv-card-title'; regTitle.textContent = t('regionSelectorStatus'); regCard.appendChild(regTitle);
  const regState = state.regionSelector || { selectedRegion: null, normalizedRegion: null, isSelecting: false, previewSize: null, imageSize: null, lastUpdatedAt: null, lastError: null };
  addCardRow(regCard, t('selectedRegion'), regState.selectedRegion ? t('yes') : t('no'));
  addCardRow(regCard, t('normalizedRegion'), regState.normalizedRegion ? t('yes') : t('no'));
  if (regState.selectedRegion) {
    addCardRow(regCard, t('previewCoordinates'),
      `${regState.selectedRegion.x | 0},${regState.selectedRegion.y | 0} · ${regState.selectedRegion.width | 0}×${regState.selectedRegion.height | 0}`);
  }
  if (regState.normalizedRegion) {
    addCardRow(regCard, t('imageCoordinates'),
      `${regState.normalizedRegion.x | 0},${regState.normalizedRegion.y | 0} · ${regState.normalizedRegion.width | 0}×${regState.normalizedRegion.height | 0}`);
  }
  let regArea = 0;
  if (typeof getRegionArea === 'function') regArea = getRegionArea(regState.selectedRegion);
  addCardRow(regCard, t('regionArea'), String(regArea));
  // attached-to-scenario indicator
  let regAttached = t('no');
  if (state.selectedScenarioId && typeof getScenarioById === 'function') {
    const _scForReg = getScenarioById(state.selectedScenarioId);
    if (_scForReg && _scForReg.settings && _scForReg.settings.region) {
      regAttached = `${state.selectedScenarioId} (${_scForReg.settings.region.width | 0}×${_scForReg.settings.region.height | 0})`;
    }
  }
  addCardRow(regCard, t('attachedToScenario'), regAttached);
  addCardRow(regCard, t('capturedAt'), regState.lastUpdatedAt || t('none2'));
  addCardRow(regCard, 'lastError', regState.lastError || t('none2'));
  c.appendChild(regCard);

  // --- Step 27: Template Asset Manager status (compact diagnostics block) ---
  const tplCard = document.createElement('div'); tplCard.className = 'adv-card';
  const tplTitle = document.createElement('div'); tplTitle.className = 'adv-card-title';
  tplTitle.textContent = t('templatesDiagnostics');
  tplCard.appendChild(tplTitle);
  const tplState = state.templates || { items: [], activeTemplateId: null, lastError: null };
  const tplItems = Array.isArray(tplState.items) ? tplState.items : [];
  addCardRow(tplCard, t('templatesCount'), String(tplItems.length));
  addCardRow(tplCard, 'activeTemplateId', tplState.activeTemplateId || t('none2'));
  // Active template name (from in-memory slice).
  let _activeName = t('none2');
  if (tplState.activeTemplateId) {
    const _foundActive = tplItems.find(_x => _x && _x.id === tplState.activeTemplateId);
    if (_foundActive && _foundActive.name) _activeName = _foundActive.name;
  }
  addCardRow(tplCard, t('activeTemplate'), _activeName);
  // storageReady — async.
  const tplStorageRow = document.createElement('div'); tplStorageRow.className = 'adv-card-row';
  const tplStorageLbl = document.createElement('span'); tplStorageLbl.className = 'adv-card-label'; tplStorageLbl.textContent = t('templatesStorageReady');
  const tplStorageVal = document.createElement('span'); tplStorageVal.className = 'adv-card-value'; tplStorageVal.textContent = '...';
  tplStorageRow.appendChild(tplStorageLbl); tplStorageRow.appendChild(tplStorageVal); tplCard.appendChild(tplStorageRow);
  if (typeof getTemplatesStats === 'function') {
    getTemplatesStats().then(st => { tplStorageVal.textContent = st && st.storageReady ? t('yes') : t('no'); }).catch(() => { tplStorageVal.textContent = '?'; });
  } else {
    tplStorageVal.textContent = '?';
  }
  addCardRow(tplCard, 'lastError', tplState.lastError || t('none2'));
  // Step 27 reminders — image matching / OCR / clicks still absent.
  addCardRow(tplCard, t('screenMatchingNotImplemented'), t('flagDisabled'));
  addCardRow(tplCard, t('templateMatchingPlanned'),      t('planned'));
  c.appendChild(tplCard);

  // --- Step 28: Template matching mock / dry-run status ---
  // The card sits next to the Step 27 templates card so the user
  // sees the whole "asset → mock match" pipeline in one column.
  const tmCard = document.createElement('div'); tmCard.className = 'adv-card';
  const tmTitle = document.createElement('div'); tmTitle.className = 'adv-card-title';
  tmTitle.textContent = t('templateMatchingDiagnostics');
  tmCard.appendChild(tmTitle);
  const tmState = state.templateMatching || { lastInput: null, lastResult: null, lastError: null, lastRunAt: null };
  const tmResult = tmState.lastResult || null;
  const tmActiveTplId = state.templates ? state.templates.activeTemplateId : null;
  const tmPreviewAvailable = !!(state.screenCapture && state.screenCapture.preview);
  const tmRegionAvailable  = !!(state.regionSelector && state.regionSelector.normalizedRegion);
  addCardRow(tmCard, t('lastRunAt'),                tmState.lastRunAt || t('none2'));
  addCardRow(tmCard, t('lastResult'),               tmResult ? t('yes') : t('no'));
  // Step 29 — match mode + algorithm parameters.
  addCardRow(tmCard, t('matchMode'),                (tmState.mode === 'real-preview') ? t('realPreviewMatching') : t('mockTemplateMatching'));
  addCardRow(tmCard, t('matchThreshold'),           (typeof tmState.threshold === 'number') ? ((tmState.threshold * 100).toFixed(0) + '%') : t('none2'));
  addCardRow(tmCard, t('step'),                     (typeof tmState.step === 'number') ? String(tmState.step) : t('none2'));
  addCardRow(tmCard, t('matchConfidence'),          tmResult ? ((Math.round(tmResult.confidence * 1000) / 10).toFixed(1) + '%') : t('none2'));
  if (tmResult && typeof tmResult.durationMs === 'number') {
    addCardRow(tmCard, t('durationMs'),             tmResult.durationMs + ' ms');
  }
  addCardRow(tmCard, t('targetPoint'),              tmResult && tmResult.targetPoint ? ((tmResult.targetPoint.x | 0) + ', ' + (tmResult.targetPoint.y | 0)) : t('none2'));
  addCardRow(tmCard, 'activeTemplateId',            tmActiveTplId || t('none2'));
  addCardRow(tmCard, t('previewAvailable'),         tmPreviewAvailable ? t('yes') : t('no'));
  addCardRow(tmCard, t('searchRegionUsed'),         tmRegionAvailable ? t('yes') : t('no'));
  addCardRow(tmCard, t('engineAvailable'),          (typeof runTemplateMatch === 'function') ? t('yes') : t('no'));
  addCardRow(tmCard, t('realMatchingDisabled'),     t('flagEnabled'));
  addCardRow(tmCard, t('realClickDisabled'),        t('flagEnabled'));
  addCardRow(tmCard, t('realImageRecognitionNotImplemented'), t('flagDisabled'));
  // Step 30 — `image_click` is now a real scenario type (still
  // simulation-only). Surface that here as `enabled`.
  addCardRow(tmCard, t('imageClickScenarioPlanned'),          t('flagEnabled'));
  if (tmState.lastError) {
    addCardRow(tmCard, 'lastError', tmState.lastError);
  }
  c.appendChild(tmCard);

  // --- Step 30: Image Click Scenario diagnostics card ---
  const icCard = document.createElement('div'); icCard.className = 'adv-card';
  const icTitle = document.createElement('div'); icTitle.className = 'adv-card-title';
  icTitle.textContent = t('imageClickScenario');
  icCard.appendChild(icTitle);
  // Count image_click scenarios via the Step-30 helper.
  let icCount = 0;
  if (typeof getScenariosByType === 'function') {
    icCount = getScenariosByType('image_click').length;
  }
  addCardRow(icCard, t('imageClickScenariosCount'), String(icCount));
  // Last image_click action — read from execution.lastAction.
  const lastIc = (state.execution && state.execution.lastAction && state.execution.lastAction.type === 'image_click')
    ? state.execution.lastAction : null;
  addCardRow(icCard, t('lastImageClickResult'),
    lastIc ? (lastIc.status === 'no_match' ? t('imageClickNoMatch') : t('imageClickSimulated'))
           : t('none2'));
  addCardRow(icCard, t('confidence'),
    (lastIc && typeof lastIc.confidence === 'number') ? Math.round(lastIc.confidence * 1000) / 10 + '%' : t('none2'));
  addCardRow(icCard, t('imageClickTarget'),
    (lastIc && lastIc.targetPoint) ? ((lastIc.targetPoint.x | 0) + ', ' + (lastIc.targetPoint.y | 0)) : t('none2'));
  // Hard "always-on" simulation flags so the user always sees the
  // contract on this card.
  addCardRow(icCard, t('imageClickSimulationOnly'), t('flagEnabled'));
  addCardRow(icCard, t('realImageClickDisabled'),   t('flagEnabled'));
  c.appendChild(icCard);

  // --- Step 33: Text Click Scenario diagnostics card ---
  const tcCard = document.createElement('div'); tcCard.className = 'adv-card';
  const tcTitle = document.createElement('div'); tcTitle.className = 'adv-card-title';
  tcTitle.textContent = t('textClickScenario');
  tcCard.appendChild(tcTitle);
  let tcCount = 0;
  if (typeof getScenariosByType === 'function') {
    tcCount = getScenariosByType('text_click').length;
  }
  addCardRow(tcCard, t('textClickScenariosCount'), String(tcCount));
  // Last text_click action — read from execution.lastAction.
  const lastTc = (state.execution && state.execution.lastAction && state.execution.lastAction.type === 'text_click')
    ? state.execution.lastAction : null;
  addCardRow(tcCard, t('lastTextClickResult'),
    lastTc ? (lastTc.status === 'no_match' ? t('textClickNoMatch') : t('textClickSimulated'))
           : t('none2'));
  addCardRow(tcCard, t('confidence'),
    (lastTc && typeof lastTc.confidence === 'number') ? Math.round(lastTc.confidence * 1000) / 10 + '%' : t('none2'));
  addCardRow(tcCard, t('textClickTarget'),
    (lastTc && lastTc.targetPoint) ? ((lastTc.targetPoint.x | 0) + ', ' + (lastTc.targetPoint.y | 0)) : t('none2'));
  // Render only the text length on the card — never the full
  // target text. The user can read the active text in the
  // scenario list / form anyway, and we don't want PII to leak
  // through `Copy diagnostics`.
  addCardRow(tcCard, t('targetTextPresent'),
    (lastTc && typeof lastTc.text === 'string' && lastTc.text.length > 0) ? t('yes') : t('no'));
  // Hard "always-on" simulation flags.
  addCardRow(tcCard, t('textClickSimulationOnly'), t('flagEnabled'));
  addCardRow(tcCard, t('realTextClickDisabled'),   t('flagEnabled'));
  addCardRow(tcCard, t('realOcrDisabled'),         t('flagEnabled'));
  c.appendChild(tcCard);

  // --- Step 31: Image Click Test Match diagnostics card ---
  // Surfaces the last Test Match invocation from the scenario form.
  // Test Match never clicks — these are debug numbers only.
  const ictCard = document.createElement('div'); ictCard.className = 'adv-card';
  const ictTitle = document.createElement('div'); ictTitle.className = 'adv-card-title';
  ictTitle.textContent = t('imageClickTestDiagnostics');
  ictCard.appendChild(ictTitle);
  let ictStatus = null;
  if (typeof getImageClickTestStatus === 'function') {
    try { ictStatus = getImageClickTestStatus(); } catch (e) { ictStatus = null; }
  }
  if (ictStatus) {
    addCardRow(ictCard, t('lastImageClickTestAt'),         ictStatus.lastImageClickTestAt        || t('none2'));
    addCardRow(ictCard, t('lastImageClickTestMatched'),    ictStatus.lastImageClickTestMatched === null ? t('none2') : (ictStatus.lastImageClickTestMatched ? t('yes') : t('no')));
    addCardRow(ictCard, t('lastImageClickTestConfidence'),
      (typeof ictStatus.lastImageClickTestConfidence === 'number')
        ? (Math.round(ictStatus.lastImageClickTestConfidence * 1000) / 10).toFixed(1) + '%'
        : t('none2'));
    addCardRow(ictCard, t('lastImageClickTestDurationMs'),
      (typeof ictStatus.lastImageClickTestDurationMs === 'number')
        ? ictStatus.lastImageClickTestDurationMs + ' ms'
        : t('none2'));
    addCardRow(ictCard, t('lastImageClickTestTemplateId'), ictStatus.lastImageClickTestTemplateId || t('none2'));
    addCardRow(ictCard, t('lastImageClickTestErrorsCount'), String(ictStatus.lastImageClickTestErrorsCount | 0));
  } else {
    addCardRow(ictCard, '', t('noData'));
  }
  // Always-on safety reminders.
  addCardRow(ictCard, t('testDoesNotClick'),         t('flagEnabled'));
  addCardRow(ictCard, t('realMatchingDisabled'),     t('flagEnabled'));
  addCardRow(ictCard, t('realClickDisabled'),        t('flagEnabled'));
  c.appendChild(ictCard);

  // --- Step 34: Text Click Test diagnostics card ---
  // Surfaces the last Test OCR invocation from the text_click
  // scenario form. Test OCR never clicks and never performs
  // real OCR — these are mock-engine debug numbers only. The
  // full target text NEVER appears here (only its length).
  const tctCard = document.createElement('div'); tctCard.className = 'adv-card';
  const tctTitle = document.createElement('div'); tctTitle.className = 'adv-card-title';
  tctTitle.textContent = t('textClickTestDiagnostics');
  tctCard.appendChild(tctTitle);
  let tctStatus = null;
  if (typeof getTextClickTestStatus === 'function') {
    try { tctStatus = getTextClickTestStatus(); } catch (e) { tctStatus = null; }
  }
  if (tctStatus) {
    addCardRow(tctCard, t('lastTextClickTestAt'),       tctStatus.lastTextClickTestAt        || t('none2'));
    addCardRow(tctCard, t('lastTextClickTestMatched'),
      tctStatus.lastTextClickTestMatched === null ? t('none2') : (tctStatus.lastTextClickTestMatched ? t('yes') : t('no')));
    addCardRow(tctCard, t('lastTextClickTestConfidence'),
      (typeof tctStatus.lastTextClickTestConfidence === 'number')
        ? (Math.round(tctStatus.lastTextClickTestConfidence * 1000) / 10).toFixed(1) + '%'
        : t('none2'));
    addCardRow(tctCard, t('lastTextClickTestDurationMs'),
      (typeof tctStatus.lastTextClickTestDurationMs === 'number')
        ? tctStatus.lastTextClickTestDurationMs + ' ms'
        : t('none2'));
    addCardRow(tctCard, t('lastTextClickTestTargetTextLen'),
      String(tctStatus.lastTextClickTestTargetTextLen | 0));
    addCardRow(tctCard, t('lastTextClickTestErrorsCount'),
      String(tctStatus.lastTextClickTestErrorsCount | 0));
    addCardRow(tctCard, t('ocrLanguage'),
      tctStatus.lastTextClickTestLanguage || t('none2'));
    addCardRow(tctCard, t('matchMode'),
      tctStatus.lastTextClickTestMatchMode || t('none2'));
    addCardRow(tctCard, t('regionUsed'),
      tctStatus.lastTextClickTestRegionUsed ? t('yes') : t('no'));
    addCardRow(tctCard, t('lastOcrBlocksCount'),
      String(tctStatus.lastTextClickTestBlocksCount | 0));
  } else {
    addCardRow(tctCard, '', t('noData'));
  }
  // Always-on safety reminders.
  addCardRow(tctCard, t('ocrMockOnly'),                 t('flagEnabled'));
  addCardRow(tctCard, t('realOcrDisabled'),             t('flagEnabled'));
  addCardRow(tctCard, t('realTextClickDisabled'),       t('flagEnabled'));
  addCardRow(tctCard, t('testDoesNotClick'),            t('flagEnabled'));
  c.appendChild(tctCard);

  // --- Step 32: OCR Foundation diagnostics card ---
  // Surfaces the last mock OCR run from the Advanced → OCR tab.
  // Real OCR is NOT connected at Step 32 — these are debug
  // numbers from the deterministic mock engine.
  const ocrCard = document.createElement('div'); ocrCard.className = 'adv-card';
  const ocrTitle = document.createElement('div'); ocrTitle.className = 'adv-card-title';
  ocrTitle.textContent = t('ocrDiagnostics');
  ocrCard.appendChild(ocrTitle);
  let ocrStatus = null;
  if (typeof getOcrMockStatus === 'function') {
    try { ocrStatus = getOcrMockStatus(); } catch (e) { ocrStatus = null; }
  }
  if (ocrStatus) {
    addCardRow(ocrCard, t('ocrMockAvailable'),   ocrStatus.ocrMockAvailable ? t('flagEnabled') : t('flagDisabled'));
    addCardRow(ocrCard, t('realOcrAvailable'),   ocrStatus.realOcrAvailable ? t('flagEnabled') : t('flagDisabled'));
    addCardRow(ocrCard, t('lastOcrRunAt'),       ocrStatus.lastOcrRunAt || t('none2'));
    addCardRow(ocrCard, t('lastOcrMatched'),
      ocrStatus.lastOcrMatched === null ? t('none2') : (ocrStatus.lastOcrMatched ? t('yes') : t('no')));
    addCardRow(ocrCard, t('lastOcrConfidence'),
      (typeof ocrStatus.lastOcrConfidence === 'number')
        ? (Math.round(ocrStatus.lastOcrConfidence * 1000) / 10).toFixed(1) + '%'
        : t('none2'));
    addCardRow(ocrCard, t('lastOcrDurationMs'),
      (typeof ocrStatus.lastOcrDurationMs === 'number')
        ? ocrStatus.lastOcrDurationMs + ' ms'
        : t('none2'));
    addCardRow(ocrCard, t('lastOcrLanguage'),    ocrStatus.lastOcrLanguage  || t('none2'));
    addCardRow(ocrCard, t('lastOcrMatchMode'),   ocrStatus.lastOcrMatchMode || t('none2'));
    addCardRow(ocrCard, t('lastOcrBlocksCount'), String(ocrStatus.lastOcrBlocksCount | 0));
    addCardRow(ocrCard, t('targetTextPresent'),
      (ocrStatus.lastOcrTargetTextLen | 0) > 0 ? t('yes') : t('no'));
    addCardRow(ocrCard, t('regionUsed'),         ocrStatus.lastOcrRegionUsed ? t('yes') : t('no'));
  } else {
    addCardRow(ocrCard, '', t('noData'));
  }
  // Always-on safety reminders.
  addCardRow(ocrCard, t('realOcrDisabled'),                 t('flagEnabled'));
  addCardRow(ocrCard, t('textRecognitionNotImplemented'),   t('flagEnabled'));
  addCardRow(ocrCard, t('realClickDisabled'),               t('flagEnabled'));
  c.appendChild(ocrCard);

  // --- Step 18: Desktop adapter status ---
  const adCard = document.createElement('div'); adCard.className = 'adv-card';
  const adTitle = document.createElement('div'); adTitle.className = 'adv-card-title'; adTitle.textContent = t('desktopAdapterStatus'); adCard.appendChild(adTitle);
  let regStatus = null;
  if (typeof getAdapterRegistryStatus === 'function') regStatus = getAdapterRegistryStatus();
  if (regStatus) {
    const activeName = regStatus.activeAdapter ? regStatus.activeAdapter.name : t('none2');
    addCardRow(adCard, t('activeAdapter'),         activeName);
    addCardRow(adCard, t('mockAdapterAvailable'),  regStatus.available.some(a => a.id === 'mock') ? t('yes') : t('no'));
    addCardRow(adCard, t('realAdapterAvailable'),  regStatus.realAdapterAvailable ? t('yes') : t('no'));
    addCardRow(adCard, t('realAdapterRegistered'), regStatus.realAdapterRegistered ? t('yes') : t('no'));
    addCardRow(adCard, t('realActionsAllowed'),    regStatus.realActionsAllowed ? t('yes') : t('no'));
    addCardRow(adCard, t('simulationOnly'),        regStatus.simulationOnly ? t('flagEnabled') : t('flagDisabled'));
  } else {
    addCardRow(adCard, '', t('noData'));
  }
  // Last self-test result line (in-memory only).
  let stLine = t('selfTestNeverRun');
  if (lastAdapterSelfTestResult) {
    const r = lastAdapterSelfTestResult;
    const total = r.tests ? r.tests.length : 0;
    const passed = r.tests ? r.tests.filter(t => t.passed).length : 0;
    stLine = (r.success ? t('selfTestPassed') : t('selfTestFailed')) + ' (' + passed + '/' + total + ')';
  }
  addCardRow(adCard, t('lastSelfTestResult'), stLine);
  // Run self-test button.
  const stBtn = document.createElement('button');
  stBtn.className = 'adv-btn'; stBtn.textContent = t('runAdapterSelfTest');
  stBtn.addEventListener('click', runAdapterSelfTestUi);
  adCard.appendChild(stBtn);
  c.appendChild(adCard);

  // --- Step 19: Real action sandbox card ---
  const sbCard = document.createElement('div'); sbCard.className = 'adv-card';
  const sbTitle = document.createElement('div'); sbTitle.className = 'adv-card-title'; sbTitle.textContent = t('realActionSandbox'); sbCard.appendChild(sbTitle);
  let sbStatus = { simulationOnly: true, realActionsImplemented: false, realActionsAllowed: false, dryRunAvailable: true, lastDryRunAt: null, lastDryRunActionCount: 0 };
  if (typeof getSandboxStatus === 'function') sbStatus = getSandboxStatus();
  addCardRow(sbCard, t('realActionsImplemented'), sbStatus.realActionsImplemented ? t('yes') : t('no'));
  addCardRow(sbCard, t('realExecutionAllowed'),   sbStatus.realActionsAllowed ? t('yes') : t('no'));
  addCardRow(sbCard, t('dryRunAvailable'),        sbStatus.dryRunAvailable ? t('yes') : t('no'));
  if (sbStatus.lastDryRunAt) {
    addCardRow(sbCard, t('dryRunPlanCreated'), sbStatus.lastDryRunAt + ' (' + sbStatus.lastDryRunActionCount + ')');
  }
  // Note for the user: no real actions will ever be executed by this card.
  const sbNote = document.createElement('div'); sbNote.className = 'adv-warning';
  sbNote.textContent = t('realActionsDisabledDryRunOnly'); sbCard.appendChild(sbNote);
  // Action: Create dry-run preview
  const sbBtn = document.createElement('button');
  sbBtn.className = 'adv-btn'; sbBtn.textContent = t('createDryRunPreview');
  sbBtn.addEventListener('click', createDryRunPreviewUi);
  sbCard.appendChild(sbBtn);
  c.appendChild(sbCard);

  // If a preview was just created, render it inline.
  if (currentDryRunPlan) {
    const pv = renderDryRunPreviewCard(currentDryRunPlan);
    c.appendChild(pv);
  }

  // --- Step 21: Release status card ---
  const rsCard = document.createElement('div'); rsCard.className = 'adv-card';
  const rsTitle = document.createElement('div'); rsTitle.className = 'adv-card-title'; rsTitle.textContent = t('releaseStatus'); rsCard.appendChild(rsTitle);
  // Synchronous placeholder rows so the card renders before IPC resolves.
  const rsVer = document.createElement('div'); rsVer.className = 'adv-card-row';
  const rsVerLbl = document.createElement('span'); rsVerLbl.className = 'adv-card-label'; rsVerLbl.textContent = 'App version';
  const rsVerVal = document.createElement('span'); rsVerVal.className = 'adv-card-value'; rsVerVal.textContent = '...';
  rsVer.appendChild(rsVerLbl); rsVer.appendChild(rsVerVal); rsCard.appendChild(rsVer);
  addCardRow(rsCard, t('betaRelease'),                t('yes'));
  addCardRow(rsCard, t('simulationOnly'),             t('flagEnabled'));
  addCardRow(rsCard, t('realActionsNotIncluded'),     t('yes'));
  // Async rows — placeholders + inline references for update.
  const placeholders = {};
  [
    { key: 'releaseTarget',             label: t('releaseTarget') },
    { key: 'smokeCheckScript',          label: t('smokeCheckScript') },
    { key: 'packagingConfigured',       label: t('packagingConfigured') },
    { key: 'releaseChecklistPresent',   label: t('releaseChecklistPresent') },
    { key: 'buildArtifactsPresent',     label: t('buildArtifacts') },
    { key: 'githubReleaseDraftPresent', label: t('githubReleaseDraftPresent') },
    { key: 'versioningPresent',         label: t('versioning') },
    { key: 'changelogPresent',          label: t('changelogPresent') },
    { key: 'releaseNotesPresent',       label: t('releaseNotesPresent') },
    { key: 'releaseFinalCheckPresent',  label: t('finalReleaseCheck') },
    { key: 'tagAndReleaseGuidePresent', label: t('tagAndReleaseGuide') },
    // Step 23 rows
    { key: 'releaseBlockersPresent',    label: t('releaseBlockers') },
    { key: 'packagedAppQaPresent',      label: t('packagedAppQa') },
    { key: 'packagedAppTested',         label: t('packagedAppTested') },
    // Step 24 rows
    { key: 'finalReleaseSummaryPresent',  label: t('finalReleaseSummary') },
    { key: 'preReleaseChecklistPresent',  label: t('preReleaseChecklist') },
    { key: 'releaseTagPlanPresent',       label: t('releaseTagPlan') },
    { key: 'releaseCommitMessagePresent', label: t('releaseCommitMessage') }
  ].forEach(item => {
    const row = document.createElement('div'); row.className = 'adv-card-row';
    const lbl = document.createElement('span'); lbl.className = 'adv-card-label'; lbl.textContent = item.label;
    const val = document.createElement('span'); val.className = 'adv-card-value'; val.textContent = '...';
    row.appendChild(lbl); row.appendChild(val); rsCard.appendChild(row);
    placeholders[item.key] = val;
  });
  // Bottom badge row — readiness summary.
  const rsBadgeRow = document.createElement('div'); rsBadgeRow.className = 'adv-card-row';
  const rsBadgeLbl = document.createElement('span'); rsBadgeLbl.className = 'adv-card-label'; rsBadgeLbl.textContent = t('releaseStatus');
  const rsBadge = document.createElement('span'); rsBadge.className = 'execution-mode-badge'; rsBadge.textContent = '...';
  rsBadgeRow.appendChild(rsBadgeLbl); rsBadgeRow.appendChild(rsBadge); rsCard.appendChild(rsBadgeRow);
  c.appendChild(rsCard);

  // Resolve the IPC and update placeholders in place (textContent only, safe).
  if (window.clickflow && window.clickflow.system && typeof window.clickflow.system.getReleaseStatus === 'function') {
    window.clickflow.system.getReleaseStatus().then(rs => {
      rsVerVal.textContent = rs.appVersion || '?';
      placeholders.releaseTarget.textContent             = rs.releaseTarget || '0.1.0-beta';
      placeholders.smokeCheckScript.textContent          = rs.smokeCheckScript ? t('present') : t('absent');
      placeholders.packagingConfigured.textContent       = rs.packagingConfigured ? t('yes') : t('no');
      placeholders.releaseChecklistPresent.textContent   = rs.releaseChecklistPresent ? t('present') : t('absent');
      placeholders.buildArtifactsPresent.textContent     = rs.buildArtifactsPresent ? t('present') : t('absent');
      placeholders.githubReleaseDraftPresent.textContent = rs.githubReleaseDraftPresent ? t('present') : t('absent');
      placeholders.versioningPresent.textContent         = rs.versioningPresent ? t('present') : t('absent');
      placeholders.changelogPresent.textContent          = rs.changelogPresent ? t('present') : t('absent');
      placeholders.releaseNotesPresent.textContent       = rs.releaseNotesPresent ? t('present') : t('absent');
      placeholders.releaseFinalCheckPresent.textContent  = rs.releaseFinalCheckPresent ? t('present') : t('absent');
      placeholders.tagAndReleaseGuidePresent.textContent = rs.tagAndReleaseGuidePresent ? t('present') : t('absent');
      placeholders.releaseBlockersPresent.textContent    = rs.releaseBlockersPresent ? t('present') : t('absent');
      placeholders.packagedAppQaPresent.textContent      = rs.packagedAppQaPresent ? t('present') : t('absent');
      placeholders.packagedAppTested.textContent         = rs.packagedAppTested ? t('yes') : t('manualPackagedTestingRequired');
      // Step 24 rows
      placeholders.finalReleaseSummaryPresent.textContent  = rs.finalReleaseSummaryPresent ? t('present') : t('absent');
      placeholders.preReleaseChecklistPresent.textContent  = rs.preReleaseChecklistPresent ? t('present') : t('absent');
      placeholders.releaseTagPlanPresent.textContent       = rs.releaseTagPlanPresent ? t('present') : t('absent');
      placeholders.releaseCommitMessagePresent.textContent = rs.releaseCommitMessagePresent ? t('present') : t('absent');
      // Step 22+23+24: badge prefers readyForPreReleaseAfterManualQa.
      const ready = (typeof rs.readyForPreReleaseAfterManualQa === 'boolean')
        ? rs.readyForPreReleaseAfterManualQa
        : (typeof rs.readyAfterManualQa === 'boolean'
            ? rs.readyAfterManualQa
            : (typeof rs.readyForManualRelease === 'boolean'
                ? rs.readyForManualRelease
                : !!rs.releaseDocsReady));
      rsBadge.textContent = ready ? t('readyForPreReleaseAfterManualQa') : t('releaseNotReady');
    }).catch(() => {
      rsVerVal.textContent = '?';
      Object.values(placeholders).forEach(p => p.textContent = '?');
      rsBadge.textContent = '?';
    });
  }
  // Error history
  const eCard = document.createElement('div'); eCard.className = 'adv-card';
  const eTitle = document.createElement('div'); eTitle.className = 'adv-card-title'; eTitle.textContent = `${t('errorHistory')} (${getErrorCount()})`; eCard.appendChild(eTitle);
  const errors = getErrorHistory();
  if (errors.length === 0) { const em = document.createElement('div'); em.className = 'adv-log-empty'; em.textContent = t('noErrors'); eCard.appendChild(em); }
  else { errors.slice(-5).forEach(err => { addCardRow(eCard, err.code, err.message); }); }
  if (errors.length > 0) { const clrBtn = document.createElement('button'); clrBtn.className = 'adv-btn adv-btn-danger'; clrBtn.textContent = t('clearErrors'); clrBtn.addEventListener('click', () => { clearErrorHistory(); renderAdvancedSafety(); }); eCard.appendChild(clrBtn); }
  c.appendChild(eCard);
}

async function copyDiagnostics() {
  const state = getState();
  let sysInfo = {};
  let betaHealth = {};
  let releaseStatus = {};
  try { sysInfo = await window.clickflow.system.getInfo(); } catch(e) {}
  try { betaHealth = await window.clickflow.system.getBetaHealth(); } catch(e) {}
  try { releaseStatus = await window.clickflow.system.getReleaseStatus(); } catch(e) {}
  const ff = (typeof getFeatureFlagsForDiagnostics === 'function') ? getFeatureFlagsForDiagnostics() : null;
  const ffLine = ff
    ? `Feature flags: simulationOnly=${ff.safety.simulationOnly}, realDesktopActions=${ff.safety.realDesktopActions}, ocr=${ff.safety.ocr}, imageRecognition=${ff.safety.imageRecognition}`
    : 'Feature flags: simulationOnly=true, realDesktopActions=false, ocr=false, imageRecognition=false';
  const ap = (typeof getActionPipelineStatus === 'function') ? getActionPipelineStatus() : { simulationOnly: true, realActionsEnabled: false, realActionsImplemented: false, pipelineReady: true };
  const realAllowed = (typeof isRealActionAllowed === 'function') ? isRealActionAllowed(state.settings) : false;
  const missingReqs = (typeof getMissingRealActionRequirements === 'function') ? getMissingRealActionRequirements(state.settings) : [];
  const apLine = `Action pipeline: pipelineReady=${ap.pipelineReady}, simulationOnly=${ap.simulationOnly}, realActionsEnabled=${ap.realActionsEnabled}, realActionsImplemented=${ap.realActionsImplemented}, realActionAllowed=${realAllowed}, missingRequirements=${missingReqs.length}`;
  const sg = (typeof getSafetyGateStatus === 'function') ? getSafetyGateStatus(state.settings) : null;
  const sgLine = sg
    ? `Safety gates: safeMode=${sg.safeMode}, emergencyStop=${sg.emergencyStop}, minIntervalMs=${sg.minIntervalMs}, maxRepeatCount=${sg.maxRepeatCount}, maxRunTimeMs=${sg.maxRunTimeMs == null ? 'none' : sg.maxRunTimeMs}`
    : 'Safety gates: unavailable';
  const auditSummary = (typeof getAuditSummary === 'function') ? getAuditSummary() : { count: 0, last: null };
  const auLine = `Audit events: count=${auditSummary.count}, lastType=${auditSummary.last ? auditSummary.last.type : 'none'}`;
  // Step 18: adapter line.
  const reg = (typeof getAdapterRegistryStatus === 'function') ? getAdapterRegistryStatus() : null;
  const adLine = reg
    ? `Adapter: active=${reg.activeId}, realRegistered=${reg.realAdapterRegistered}, realAvailable=${reg.realAdapterAvailable}, realActionsAllowed=${reg.realActionsAllowed}, simulationOnly=${reg.simulationOnly}`
    : 'Adapter: unavailable';
  // Step 19: sandbox line.
  const sb = (typeof getSandboxStatus === 'function') ? getSandboxStatus() : null;
  let sbLine = 'Sandbox: unavailable';
  if (sb) {
    let blockedCount = 0;
    let readyCount = 0;
    try {
      if (typeof getRealActionBlockedReasons === 'function') blockedCount = getRealActionBlockedReasons(state.settings).length;
      if (typeof createPermissionChecklist === 'function') readyCount = createPermissionChecklist(state.settings).filter(i => i.status === 'ready').length;
    } catch (e) {}
    sbLine = `Sandbox: dryRunAvailable=${sb.dryRunAvailable}, realActionsAllowed=${sb.realActionsAllowed}, realActionsImplemented=${sb.realActionsImplemented}, blockedReasons=${blockedCount}, checklistReady=${readyCount}, lastDryRunAt=${sb.lastDryRunAt || 'none'}, lastDryRunActionCount=${sb.lastDryRunActionCount}`;
  }
  // Step 25: screen capture line (no imageDataUrl ever embedded).
  let screenCaptureStatus = null;
  try { if (typeof getScreenCaptureStatus === 'function') screenCaptureStatus = await getScreenCaptureStatus(); } catch(e) {}
  const sc = state.screenCapture || { sources: [], selectedSourceId: null, preview: null, lastError: null, lastCapturedAt: null };
  const scLine = `Screen capture: available=${screenCaptureStatus ? !!screenCaptureStatus.available : '?'}, supported=${screenCaptureStatus ? !!screenCaptureStatus.supported : '?'}, sourcesCount=${(sc.sources || []).length}, selectedSource=${sc.selectedSourceId || 'none'}, previewAvailable=${!!sc.preview}, lastCapturedAt=${sc.lastCapturedAt || 'none'}, lastError=${sc.lastError || 'none'}, ocrImplemented=false, imageRecognitionImplemented=false, savesScreenshotsToDisk=false`;
  // Step 26: region selector line (numeric metadata only, never pixels).
  const rs = state.regionSelector || { selectedRegion: null, normalizedRegion: null, lastUpdatedAt: null, lastError: null };
  const rsArea2 = (typeof getRegionArea === 'function') ? getRegionArea(rs.selectedRegion) : 0;
  let rsAttachedScenario = 'none';
  if (state.selectedScenarioId && typeof getScenarioById === 'function') {
    const _sc = getScenarioById(state.selectedScenarioId);
    if (_sc && _sc.settings && _sc.settings.region) {
      rsAttachedScenario = `${state.selectedScenarioId}(${_sc.settings.region.width | 0}x${_sc.settings.region.height | 0})`;
    }
  }
  const rsLine = `Region selector: selectedRegion=${!!rs.selectedRegion}, normalizedRegion=${!!rs.normalizedRegion}, regionWidth=${rs.selectedRegion ? (rs.selectedRegion.width|0) : 0}, regionHeight=${rs.selectedRegion ? (rs.selectedRegion.height|0) : 0}, regionArea=${rsArea2}, attachedScenario=${rsAttachedScenario}, lastUpdatedAt=${rs.lastUpdatedAt || 'none'}, lastError=${rs.lastError || 'none'}, ocrImplemented=false, imageMatchingImplemented=false, realClicksImplemented=false`;
  // Step 27: Template Asset Manager line. Numeric / metadata only —
  // never base64, never pixel data, never the original filesystem path.
  let templatesStats = { count: 0, storageReady: false, lastError: null };
  try {
    if (typeof getTemplatesStats === 'function') templatesStats = await getTemplatesStats();
  } catch (e) {}
  const tpl = state.templates || { items: [], activeTemplateId: null, lastError: null };
  const tplItemsForDiag = Array.isArray(tpl.items) ? tpl.items : [];
  let tplActiveName = 'none';
  if (tpl.activeTemplateId) {
    const _foundForDiag = tplItemsForDiag.find(x => x && x.id === tpl.activeTemplateId);
    if (_foundForDiag && _foundForDiag.name) tplActiveName = _foundForDiag.name;
  }
  const tplLine = `Templates: count=${tplItemsForDiag.length}, storageCount=${templatesStats.count|0}, storageReady=${!!templatesStats.storageReady}, activeTemplateId=${tpl.activeTemplateId || 'none'}, activeTemplateName=${tplActiveName}, lastError=${tpl.lastError || 'none'}, screenMatchingImplemented=false, ocrImplemented=false, realClicksImplemented=false`;
  // Step 28: Template Matching Mock / Dry-run line. Numbers and ids
  // only — never base64, never imageDataUrl, never pixel data.
  const tm = state.templateMatching || { lastResult: null, lastError: null, lastRunAt: null };
  const tmResultForDiag = tm.lastResult || null;
  const tmConfidence = tmResultForDiag && typeof tmResultForDiag.confidence === 'number' ? tmResultForDiag.confidence : 'none';
  const tmTargetX = tmResultForDiag && tmResultForDiag.targetPoint ? (tmResultForDiag.targetPoint.x | 0) : 'none';
  const tmTargetY = tmResultForDiag && tmResultForDiag.targetPoint ? (tmResultForDiag.targetPoint.y | 0) : 'none';
  const tmActiveTplDiag = state.templates ? (state.templates.activeTemplateId || 'none') : 'none';
  const tmPreviewAvailDiag = !!(state.screenCapture && state.screenCapture.preview);
  const tmRegionAvailDiag = !!(state.regionSelector && state.regionSelector.normalizedRegion);
  // Step 29 — current match mode + algorithm parameters + the
  // boolean engine availability. Numbers and short strings only —
  // never base64, never imageDataUrl, never pixel data.
  const tmMode = (tm.mode === 'real-preview') ? 'real-preview' : 'mock';
  const tmThreshold = (typeof tm.threshold === 'number') ? tm.threshold : 0.75;
  const tmStep = (typeof tm.step === 'number') ? tm.step : 4;
  const tmDuration = (tmResultForDiag && typeof tmResultForDiag.durationMs === 'number') ? tmResultForDiag.durationMs : 'none';
  const tmEngineAvail = (typeof runTemplateMatch === 'function');
  const tmLastResultMode = tmResultForDiag ? (tmResultForDiag.mode || 'mock') : 'none';
  const tmLine = `Template matching: lastRunAt=${tm.lastRunAt || 'none'}, lastResult=${!!tmResultForDiag}, lastMode=${tmLastResultMode}, lastConfidence=${tmConfidence}, lastDurationMs=${tmDuration}, lastTargetPoint=${tmTargetX},${tmTargetY}, mode=${tmMode}, threshold=${tmThreshold}, step=${tmStep}, engineAvailable=${tmEngineAvail}, activeTemplateId=${tmActiveTplDiag}, screenPreviewAvailable=${tmPreviewAvailDiag}, searchRegionUsed=${tmRegionAvailDiag}, lastError=${tm.lastError || 'none'}, realMatching=false, realClick=false, ocrImplemented=false, opencvAvailable=false, matcherImplemented=true, imageClickScenarioImplemented=true`;
  // Step 30: Image Click Scenario line. Numbers and ids only —
  // never base64, never imageDataUrl, never pixel data.
  let icCountDiag = 0;
  try { if (typeof getScenariosByType === 'function') icCountDiag = getScenariosByType('image_click').length; } catch (e) {}
  const lastIcDiag = (state.execution && state.execution.lastAction && state.execution.lastAction.type === 'image_click')
    ? state.execution.lastAction : null;
  const lastIcConfidence = (lastIcDiag && typeof lastIcDiag.confidence === 'number') ? lastIcDiag.confidence : 'none';
  const lastIcStatus = lastIcDiag ? (lastIcDiag.status === 'no_match' ? 'no_match' : 'simulated') : 'none';
  const lastIcTargetX = (lastIcDiag && lastIcDiag.targetPoint) ? (lastIcDiag.targetPoint.x | 0) : 'none';
  const lastIcTargetY = (lastIcDiag && lastIcDiag.targetPoint) ? (lastIcDiag.targetPoint.y | 0) : 'none';
  const icLine = `Image click scenario: imageClickScenariosCount=${icCountDiag}, lastImageClickStatus=${lastIcStatus}, lastImageClickConfidence=${lastIcConfidence}, lastImageClickTargetPoint=${lastIcTargetX},${lastIcTargetY}, imageClickSimulationOnly=true, realImageClickEnabled=false, ocrImplemented=false`;
  // Step 33: text_click scenario line. Numbers / metadata only —
  // never the full target text, only its length.
  let tcCountDiag = 0;
  if (typeof getScenariosByType === 'function') {
    tcCountDiag = getScenariosByType('text_click').length;
  }
  const lastTcDiag = (state.execution && state.execution.lastAction && state.execution.lastAction.type === 'text_click')
    ? state.execution.lastAction : null;
  const lastTcStatus     = lastTcDiag ? (lastTcDiag.status === 'no_match' ? 'no_match' : 'simulated') : 'none';
  const lastTcConfidence = (lastTcDiag && typeof lastTcDiag.confidence === 'number') ? lastTcDiag.confidence : 'none';
  const lastTcTargetX    = (lastTcDiag && lastTcDiag.targetPoint) ? (lastTcDiag.targetPoint.x | 0) : 'none';
  const lastTcTargetY    = (lastTcDiag && lastTcDiag.targetPoint) ? (lastTcDiag.targetPoint.y | 0) : 'none';
  const lastTcTextLen    = (lastTcDiag && typeof lastTcDiag.text === 'string') ? lastTcDiag.text.length : 0;
  const lastTcLanguage   = lastTcDiag ? (lastTcDiag.language || 'none') : 'none';
  const lastTcMatchMode  = lastTcDiag ? (lastTcDiag.matchMode || 'none') : 'none';
  const tcLine = `Text click scenario: textClickScenariosCount=${tcCountDiag}, lastTextClickStatus=${lastTcStatus}, lastTextClickConfidence=${lastTcConfidence}, lastTextClickTargetPoint=${lastTcTargetX},${lastTcTargetY}, lastTextClickTextLen=${lastTcTextLen}, lastTextClickLanguage=${lastTcLanguage}, lastTextClickMatchMode=${lastTcMatchMode}, textClickSimulationOnly=true, realTextClickEnabled=false, realOcrEnabled=false, tesseractAvailable=false, ocrEngineImplemented=false`;
  // Step 31: Image Click Test Match line. Numbers and short
  // strings only — never base64, never imageDataUrl.
  let ictDiagStatus = null;
  if (typeof getImageClickTestStatus === 'function') {
    try { ictDiagStatus = getImageClickTestStatus(); } catch (e) { ictDiagStatus = null; }
  }
  const ictHasResult     = ictDiagStatus ? !!ictDiagStatus.hasResult : false;
  const ictAt            = ictDiagStatus ? (ictDiagStatus.lastImageClickTestAt || 'none') : 'none';
  const ictMatched       = ictDiagStatus ? (ictDiagStatus.lastImageClickTestMatched === null ? 'none' : !!ictDiagStatus.lastImageClickTestMatched) : 'none';
  const ictConfidence    = ictDiagStatus && (typeof ictDiagStatus.lastImageClickTestConfidence === 'number')
    ? ictDiagStatus.lastImageClickTestConfidence : 'none';
  const ictDuration      = ictDiagStatus && (typeof ictDiagStatus.lastImageClickTestDurationMs === 'number')
    ? ictDiagStatus.lastImageClickTestDurationMs : 'none';
  const ictTemplateId    = ictDiagStatus ? (ictDiagStatus.lastImageClickTestTemplateId || 'none') : 'none';
  const ictErrors        = ictDiagStatus ? (ictDiagStatus.lastImageClickTestErrorsCount | 0) : 0;
  const ictLine = `Image click test: hasResult=${ictHasResult}, lastImageClickTestAt=${ictAt}, lastImageClickTestMatched=${ictMatched}, lastImageClickTestConfidence=${ictConfidence}, lastImageClickTestDurationMs=${ictDuration}, lastImageClickTestTemplateId=${ictTemplateId}, lastImageClickTestErrorsCount=${ictErrors}, testDoesNotClick=true, realMatching=false, realClick=false`;
  // Step 34: text_click Test OCR / Test Text Match line. Numbers
  // and short strings only — never the full target text, never
  // an imageDataUrl.
  let tctDiagStatus = null;
  if (typeof getTextClickTestStatus === 'function') {
    try { tctDiagStatus = getTextClickTestStatus(); } catch (e) { tctDiagStatus = null; }
  }
  const tctHasResult     = tctDiagStatus ? !!tctDiagStatus.hasResult : false;
  const tctAt            = tctDiagStatus ? (tctDiagStatus.lastTextClickTestAt || 'none') : 'none';
  const tctMatched       = tctDiagStatus
    ? (tctDiagStatus.lastTextClickTestMatched === null ? 'none' : !!tctDiagStatus.lastTextClickTestMatched)
    : 'none';
  const tctConfidence    = (tctDiagStatus && (typeof tctDiagStatus.lastTextClickTestConfidence === 'number'))
    ? tctDiagStatus.lastTextClickTestConfidence : 'none';
  const tctDuration      = (tctDiagStatus && (typeof tctDiagStatus.lastTextClickTestDurationMs === 'number'))
    ? tctDiagStatus.lastTextClickTestDurationMs : 'none';
  const tctTextLen       = tctDiagStatus ? (tctDiagStatus.lastTextClickTestTargetTextLen | 0) : 0;
  const tctErrors        = tctDiagStatus ? (tctDiagStatus.lastTextClickTestErrorsCount | 0) : 0;
  const tctLanguage      = tctDiagStatus ? (tctDiagStatus.lastTextClickTestLanguage || 'none') : 'none';
  const tctMatchMode     = tctDiagStatus ? (tctDiagStatus.lastTextClickTestMatchMode || 'none') : 'none';
  const tctRegionUsed    = tctDiagStatus ? !!tctDiagStatus.lastTextClickTestRegionUsed : false;
  const tctBlocksCount   = tctDiagStatus ? (tctDiagStatus.lastTextClickTestBlocksCount | 0) : 0;
  const tctLine = `Text click test: hasResult=${tctHasResult}, lastTextClickTestAt=${tctAt}, lastTextClickTestMatched=${tctMatched}, lastTextClickTestConfidence=${tctConfidence}, lastTextClickTestDurationMs=${tctDuration}, lastTextClickTestTargetTextLen=${tctTextLen}, lastTextClickTestErrorsCount=${tctErrors}, lastTextClickTestLanguage=${tctLanguage}, lastTextClickTestMatchMode=${tctMatchMode}, lastTextClickTestRegionUsed=${tctRegionUsed}, lastTextClickTestBlocksCount=${tctBlocksCount}, ocrMockOnly=true, realOcrEnabled=false, realTextClickEnabled=false, testDoesNotClick=true, realClick=false, realOcr=false`;
  // Step 32: OCR Foundation line. Numbers / metadata only — never
  // base64, never imageDataUrl, never the full target text.
  let ocrDiagStatus = null;
  if (typeof getOcrMockStatus === 'function') {
    try { ocrDiagStatus = getOcrMockStatus(); } catch (e) { ocrDiagStatus = null; }
  }
  const ocrMockAvail   = ocrDiagStatus ? !!ocrDiagStatus.ocrMockAvailable : true;
  const ocrRealAvail   = ocrDiagStatus ? !!ocrDiagStatus.realOcrAvailable : false;
  const ocrLastAt      = ocrDiagStatus ? (ocrDiagStatus.lastOcrRunAt || 'none') : 'none';
  const ocrLastMatched = ocrDiagStatus
    ? (ocrDiagStatus.lastOcrMatched === null ? 'none' : !!ocrDiagStatus.lastOcrMatched)
    : 'none';
  const ocrLastConf    = ocrDiagStatus && (typeof ocrDiagStatus.lastOcrConfidence === 'number')
    ? ocrDiagStatus.lastOcrConfidence : 'none';
  const ocrLastDur     = ocrDiagStatus && (typeof ocrDiagStatus.lastOcrDurationMs === 'number')
    ? ocrDiagStatus.lastOcrDurationMs : 'none';
  const ocrLastLang    = ocrDiagStatus ? (ocrDiagStatus.lastOcrLanguage || 'none') : 'none';
  const ocrLastMode    = ocrDiagStatus ? (ocrDiagStatus.lastOcrMatchMode || 'none') : 'none';
  const ocrTargetLen   = ocrDiagStatus ? (ocrDiagStatus.lastOcrTargetTextLen | 0) : 0;
  const ocrBlocksCnt   = ocrDiagStatus ? (ocrDiagStatus.lastOcrBlocksCount | 0) : 0;
  const ocrRegionUsed  = ocrDiagStatus ? !!ocrDiagStatus.lastOcrRegionUsed : false;
  const ocrLine = `OCR: ocrMockAvailable=${ocrMockAvail}, realOcrAvailable=${ocrRealAvail}, lastOcrRunAt=${ocrLastAt}, lastOcrMatched=${ocrLastMatched}, lastOcrConfidence=${ocrLastConf}, lastOcrDurationMs=${ocrLastDur}, ocrLanguage=${ocrLastLang}, ocrMatchMode=${ocrLastMode}, targetTextPresent=${ocrTargetLen > 0}, lastOcrBlocksCount=${ocrBlocksCnt}, regionUsed=${ocrRegionUsed}, realOcr=false, realClick=false, tesseractAvailable=false, ocrEngineImplemented=false`;
  const text = `ClickFlow Diagnostics\nVersion: ${window.clickflow.version}\nElectron: ${sysInfo.electronVersion || '?'}\nPlatform: ${sysInfo.platform || '?'} (${sysInfo.arch || '?'})\nPackaged: ${sysInfo.isPackaged || false}\nLanguage: ${state.settings.language}\nTheme: ${state.settings.theme}\nScenarios: ${getScenarios().length}\nProfiles: ${getProfileCount()}\nLogs: ${state.logs.length}\nErrors: ${getErrorCount()}\nSafe mode: ${state.settings.safety.safeMode}\nGlobal hotkeys: ${sysInfo.globalHotkeysRegistered || false}\nTray: ${sysInfo.trayAvailable || false}\nExecution: ${state.execution.isRunning ? 'running' : 'idle'}\nSimulation only: true\n${ffLine}\n${apLine}\n${sgLine}\n${auLine}\n${adLine}\n${sbLine}\n${scLine}\n${rsLine}\n${tplLine}\n${tmLine}\n${icLine}\n${tcLine}\n${ictLine}\n${tctLine}\n${ocrLine}\nBeta health: docsReady=${!!betaHealth.docsReady}, packagingConfigured=${!!betaHealth.packagingConfigured}, securityChecklistPresent=${!!betaHealth.securityChecklistPresent}, actionSchemaPresent=${!!betaHealth.actionSchemaPresent}\nRelease: appVersion=${releaseStatus.appVersion || '?'}, releaseTarget=${releaseStatus.releaseTarget || '0.1.0-beta'}, beta=${!!releaseStatus.beta}, smokeCheckScript=${!!releaseStatus.smokeCheckScript}, packagingConfigured=${!!releaseStatus.packagingConfigured}, releaseChecklistPresent=${!!releaseStatus.releaseChecklistPresent}, buildArtifactsPresent=${!!releaseStatus.buildArtifactsPresent}, githubReleaseDraftPresent=${!!releaseStatus.githubReleaseDraftPresent}, versioningPresent=${!!releaseStatus.versioningPresent}, changelogPresent=${!!releaseStatus.changelogPresent}, releaseNotesPresent=${!!releaseStatus.releaseNotesPresent}, releaseFinalCheckPresent=${!!releaseStatus.releaseFinalCheckPresent}, tagAndReleaseGuidePresent=${!!releaseStatus.tagAndReleaseGuidePresent}, releaseBlockersPresent=${!!releaseStatus.releaseBlockersPresent}, packagedAppQaPresent=${!!releaseStatus.packagedAppQaPresent}, finalReleaseSummaryPresent=${!!releaseStatus.finalReleaseSummaryPresent}, preReleaseChecklistPresent=${!!releaseStatus.preReleaseChecklistPresent}, releaseTagPlanPresent=${!!releaseStatus.releaseTagPlanPresent}, releaseCommitMessagePresent=${!!releaseStatus.releaseCommitMessagePresent}, packagedAppTested=${!!releaseStatus.packagedAppTested}, readyAfterManualQa=${!!releaseStatus.readyAfterManualQa}, readyForPreReleaseAfterManualQa=${!!releaseStatus.readyForPreReleaseAfterManualQa}, releaseDocsReady=${!!releaseStatus.releaseDocsReady}, readyForManualRelease=${!!releaseStatus.readyForManualRelease}`;
  try { await navigator.clipboard.writeText(text); addLogEntry(createLog('success', t('diagnosticsCopied'))); }
  catch (e) { addLogEntry(createLog('warning', t('diagnosticsCopyFailed'))); }
  renderState();
}

// Step 18: run the active adapter's self-test from UI. Pure-JS, no IPC.
function runAdapterSelfTestUi() {  addLogEntry(createLog('info', t('adapterSelfTestStarted')));
  let result;
  try {
    result = (typeof runActiveAdapterSelfTest === 'function')
      ? runActiveAdapterSelfTest()
      : { success: false, errors: ['Adapter registry not loaded'] };
  } catch (e) {
    result = { success: false, errors: [e && e.message ? e.message : String(e)] };
  }
  lastAdapterSelfTestResult = result;
  if (result.success) {
    addLogEntry(createLog('success', t('adapterSelfTestCompleted')));
  } else {
    const detail = result.errors && result.errors.length ? (': ' + result.errors.join('; ')) : '';
    addLogEntry(createLog('error', t('adapterSelfTestFailed') + detail));
    reportError({ code: 'ADAPTER_SELFTEST', message: t('adapterSelfTestFailed') + detail }, 'adapter');
  }
  renderAdvancedSafety();
}

// =====================================================================
// Step 19: Real action sandbox / dry-run preview UI
// =====================================================================

function _statusBadgeClass(status) {
  if (status === 'ready')   return 'readiness-ready';
  if (status === 'planned') return 'readiness-planned';
  // Both "blocked" and "missing" use the same neutral missing badge.
  return 'readiness-missing';
}

function _statusLabel(status) {
  if (status === 'ready')   return t('statusReady');
  if (status === 'planned') return t('statusPlanned');
  if (status === 'blocked') return t('statusBlocked');
  return t('statusMissing');
}

// Build the inline preview card after a dry-run plan was created.
function renderDryRunPreviewCard(plan) {
  const card = document.createElement('div'); card.className = 'adv-card';
  const title = document.createElement('div'); title.className = 'adv-card-title';
  title.textContent = t('dryRunPreview'); card.appendChild(title);

  // Top-level summary
  addCardRow(card, t('scenarioName'),     plan.scenarioName || t('none2'));
  addCardRow(card, t('actionCount'),      String(plan.actionCount));
  addCardRow(card, t('estimatedDuration'),plan.estimatedDurationMs + ' ms');
  addCardRow(card, t('realExecutionAllowed'), plan.realExecution ? t('yes') : t('no'));

  // Reminder warning — no real actions will be executed.
  const warn = document.createElement('div'); warn.className = 'adv-warning';
  warn.textContent = t('noRealActionsExecuted'); card.appendChild(warn);

  // Actions preview list (capped, rendered with textContent only)
  const apTitle = document.createElement('div'); apTitle.className = 'adv-card-title';
  apTitle.textContent = t('actionsPreview') + (plan.truncated ? ' — ' + t('previewTruncated') : '');
  card.appendChild(apTitle);
  const list = document.createElement('div'); list.className = 'readiness-list';
  plan.actionsPreview.forEach(a => {
    const item = document.createElement('div'); item.className = 'readiness-item';
    const lbl = document.createElement('span'); lbl.className = 'readiness-item-label';
    lbl.textContent = '#' + a.index + '  click x=' + a.x + ' y=' + a.y + ' ' + a.button;
    const badge = document.createElement('span'); badge.className = 'readiness-badge readiness-planned';
    badge.textContent = t('statusPlanned');
    item.appendChild(lbl); item.appendChild(badge); list.appendChild(item);
  });
  if (plan.actionsPreview.length === 0) {
    const empty = document.createElement('div'); empty.className = 'readiness-item';
    const lbl = document.createElement('span'); lbl.className = 'readiness-item-label'; lbl.textContent = t('noData');
    empty.appendChild(lbl); list.appendChild(empty);
  }
  card.appendChild(list);

  // Permission checklist
  const pcTitle = document.createElement('div'); pcTitle.className = 'adv-card-title';
  pcTitle.textContent = t('permissionChecklist'); card.appendChild(pcTitle);
  const pcList = document.createElement('div'); pcList.className = 'readiness-list';
  plan.permissionChecklist.forEach(it => {
    const row = document.createElement('div'); row.className = 'readiness-item';
    const lbl = document.createElement('span'); lbl.className = 'readiness-item-label'; lbl.textContent = it.label;
    const badge = document.createElement('span'); badge.className = 'readiness-badge ' + _statusBadgeClass(it.status);
    badge.textContent = _statusLabel(it.status);
    row.appendChild(lbl); row.appendChild(badge); pcList.appendChild(row);
  });
  card.appendChild(pcList);

  // Blocked reasons
  const brTitle = document.createElement('div'); brTitle.className = 'adv-card-title';
  brTitle.textContent = t('blockedReasons'); card.appendChild(brTitle);
  const brList = document.createElement('div'); brList.className = 'readiness-list';
  plan.blockedReasons.forEach(r => {
    const row = document.createElement('div'); row.className = 'readiness-item';
    const lbl = document.createElement('span'); lbl.className = 'readiness-item-label'; lbl.textContent = r.label;
    const badge = document.createElement('span'); badge.className = 'readiness-badge readiness-missing';
    badge.textContent = t('statusBlocked');
    row.appendChild(lbl); row.appendChild(badge); brList.appendChild(row);
  });
  card.appendChild(brList);

  // Confirm / Cancel buttons
  const btnGroup = document.createElement('div'); btnGroup.className = 'adv-btn-group';
  const okBtn = document.createElement('button'); okBtn.className = 'adv-btn'; okBtn.textContent = t('confirmDryRun');
  okBtn.addEventListener('click', confirmDryRunUi);
  const cancelBtn = document.createElement('button'); cancelBtn.className = 'adv-btn adv-btn-secondary'; cancelBtn.textContent = t('cancelDryRun');
  cancelBtn.addEventListener('click', cancelDryRunUi);
  btnGroup.appendChild(okBtn); btnGroup.appendChild(cancelBtn);
  card.appendChild(btnGroup);

  return card;
}

function createDryRunPreviewUi() {
  const state = getState();
  const sc = getScenarioById(state.selectedScenarioId);
  if (!sc) {
    addLogEntry(createLog('warning', t('noActiveScenarioForDryRun')));
    renderState();
    return;
  }
  if (typeof createRealActionPreview !== 'function') {
    addLogEntry(createLog('error', 'real-action-sandbox not loaded'));
    renderState();
    return;
  }
  const result = createRealActionPreview(sc, null, state.settings);
  if (!result.ok) {
    addLogEntry(createLog('error', result.error || 'dry-run failed'));
    renderAdvancedSafety();
    return;
  }
  currentDryRunPlan = result.plan;
  addLogEntry(createLog('info', t('dryRunPlanCreated') + ': ' + result.plan.actionCount + ' ' + t('actionCount').toLowerCase()));
  renderAdvancedSafety();
}

function confirmDryRunUi() {
  if (!currentDryRunPlan) return;
  let result = { ok: false };
  if (typeof confirmDryRunPlan === 'function') {
    result = confirmDryRunPlan(currentDryRunPlan);
  }
  if (result.ok) {
    addLogEntry(createLog('success', t('dryRunConfirmed')));
    addLogEntry(createLog('info', t('dryRunCompletedSafely')));
  } else {
    addLogEntry(createLog('error', result.error || 'dry-run confirm failed'));
  }
  currentDryRunPlan = null;
  renderAdvancedSafety();
}

function cancelDryRunUi() {
  if (!currentDryRunPlan) return;
  if (typeof cancelDryRunPlan === 'function') cancelDryRunPlan(currentDryRunPlan);
  addLogEntry(createLog('info', t('dryRunCancelled')));
  currentDryRunPlan = null;
  renderAdvancedSafety();
}

function renderAdvancedFuture() {
  const c = document.getElementById('advanced-tab-future'); c.innerHTML = '';
  const titleCard = document.createElement('div'); titleCard.className = 'adv-card';
  const title = document.createElement('div'); title.className = 'adv-card-title'; title.textContent = t('futureFeatures'); titleCard.appendChild(title); c.appendChild(titleCard);
  const grid = document.createElement('div'); grid.className = 'adv-future-grid';
  ['ocrTextDetection','imageRecognition','visualActionBuilder','profiles','globalHotkeysPlanned','desktopActionAdapter','realDesktopClicks'].forEach(key => {
    const card = document.createElement('div'); card.className = 'adv-future-card';
    const name = document.createElement('div'); name.className = 'adv-future-card-name'; name.textContent = t(key);
    const badge = document.createElement('span'); badge.className = 'adv-future-card-badge'; badge.textContent = t('planned');
    card.appendChild(name); card.appendChild(badge); grid.appendChild(card);
  });
  c.appendChild(grid);

  // Desktop Adapter Readiness Checklist
  const rCard = document.createElement('div'); rCard.className = 'adv-card';
  const rTitle = document.createElement('div'); rTitle.className = 'adv-card-title'; rTitle.textContent = t('desktopAdapterReadiness'); rCard.appendChild(rTitle);
  const rList = document.createElement('div'); rList.className = 'readiness-list';
  const state = getState();
  const checks = [
    { label: t('safeModeEnabledCheck'), status: state.settings.safety.safeMode ? 'ready' : 'missing' },
    { label: t('emergencyStopEnabledCheck'), status: state.settings.safety.emergencyStopEnabled ? 'ready' : 'missing' },
    { label: t('safetyLimitsConfigured'), status: 'ready' },
    { label: t('userConfirmationRequired'), status: 'planned' },
    { label: t('simulationModeActive'), status: 'ready' },
    { label: t('adapterNotInstalled'), status: 'planned' },
    { label: t('realClicksNotImplemented'), status: 'planned' },
    { label: t('auditLogsPlanned'), status: 'planned' },
    { label: t('osPermissionsPlanned'), status: 'planned' }
  ];
  checks.forEach(ch => {
    const item = document.createElement('div'); item.className = 'readiness-item';
    const lbl = document.createElement('span'); lbl.className = 'readiness-item-label'; lbl.textContent = ch.label;
    const badge = document.createElement('span');
    badge.className = 'readiness-badge readiness-' + ch.status;
    badge.textContent = ch.status === 'ready' ? t('ready') : ch.status === 'planned' ? t('planned') : t('missing');
    item.appendChild(lbl); item.appendChild(badge); rList.appendChild(item);
  });
  rCard.appendChild(rList);
  const modeBadge = document.createElement('div'); modeBadge.className = 'execution-mode-badge'; modeBadge.textContent = t('executionModeSimulation');
  rCard.appendChild(modeBadge);
  c.appendChild(rCard);

  // Next safety milestone card (Step 16) — every item is "planned" or "disabled".
  // No UI lever flips real mode here; this is informational only.
  const nsCard = document.createElement('div'); nsCard.className = 'adv-card';
  const nsTitle = document.createElement('div'); nsTitle.className = 'adv-card-title'; nsTitle.textContent = t('nextSafetyMilestone'); nsCard.appendChild(nsTitle);
  const nsList = document.createElement('div'); nsList.className = 'readiness-list';
  const nsItems = [
    { label: t('finalSafetyReview'),         status: 'planned' },
    { label: t('adapterAvailabilityCheck'),  status: 'planned' },
    { label: t('globalEmergencyStopVerified'), status: 'planned' },
    { label: t('auditLogsPlanned'),          status: 'planned' },
    { label: t('userConfirmationFlow'),      status: 'planned' },
    { label: t('realModeDisabled'),          status: 'ready' }
  ];
  nsItems.forEach(it => {
    const row = document.createElement('div'); row.className = 'readiness-item';
    const lbl = document.createElement('span'); lbl.className = 'readiness-item-label'; lbl.textContent = it.label;
    const badge = document.createElement('span');
    badge.className = 'readiness-badge readiness-' + it.status;
    badge.textContent = it.status === 'ready' ? t('ready') : t('planned');
    row.appendChild(lbl); row.appendChild(badge); nsList.appendChild(row);
  });
  nsCard.appendChild(nsList);
  c.appendChild(nsCard);
}


// --- Theme ---
function applyTheme(theme) {
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else if (theme === 'light') {
    document.documentElement.removeAttribute('data-theme');
  } else {
    // system: check prefers-color-scheme
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }
}

// --- Hotkeys ---
function handleGlobalHotkeys(event) {
  const state = getState();
  const focused = document.activeElement;
  const isInput = focused && (focused.tagName === 'INPUT' || focused.tagName === 'TEXTAREA' || focused.tagName === 'SELECT');

  // Escape — Emergency Stop (works even in inputs)
  if (event.key === 'Escape' && state.settings.safety.emergencyStopEnabled) {
    if (state.execution.isRunning) { event.preventDefault(); triggerEmergencyStop(); return; }
  }

  // Don't intercept hotkeys when user is typing
  if (isInput) return;

  // Ctrl+Alt+S — Start
  if (event.ctrlKey && event.altKey && event.key.toLowerCase() === 's') { event.preventDefault(); startScenario(); return; }
  // Ctrl+Alt+X — Stop
  if (event.ctrlKey && event.altKey && event.key.toLowerCase() === 'x') { event.preventDefault(); stopScenario(); return; }
}
document.addEventListener('keydown', handleGlobalHotkeys);

// --- Event Listeners ---
btnStart.addEventListener('click', startScenario);
btnStop.addEventListener('click', stopScenario);
btnScenario.addEventListener('click', openScenarioList);
btnSettings.addEventListener('click', openSettings);
btnAdvanced.addEventListener('click', (e) => { e.preventDefault(); openAdvancedMode(); });
btnBack.addEventListener('click', goBackToMain);
btnCreateScenario.addEventListener('click', openCreateScenarioForm);
btnScenariosBack.addEventListener('click', goBackToMain);
btnSaveScenario.addEventListener('click', saveScenarioFromForm);
btnFormCancel.addEventListener('click', closeScenarioForm);
btnSaveSettings.addEventListener('click', saveSettingsFromForm);
btnSettingsBack.addEventListener('click', goBackFromSettings);
document.getElementById('advanced-tabs').addEventListener('click', (e) => {
  const tab = e.target.getAttribute('data-advanced-tab');
  if (tab) setAdvancedTab(tab);
});

// --- Init ---
async function init() {
  const settings = await loadSettings();
  setSettings(settings); setLanguage(settings.language); applyTranslations();
  applyTheme(settings.theme);
  await initScenarios();
  await initProfiles();
  // Step 27: load template assets so the Templates tab and the
  // diagnostics card see them right away. Failures degrade
  // gracefully — the slice stays empty and lastError is surfaced.
  if (typeof initTemplates === 'function') {
    try { await initTemplates(); } catch (e) {}
  }
  const def = getDefaultScenario(); setSelectedScenario(def);
  resetExecution();
  // Step 15: surface JSON corruption fallback to the user as warning logs
  // (no crash — defaults are already in use, broken file kept on disk).
  if (settings.__corrupted) {
    addLogEntry(createLog('warning', t('corruptedDataFallback') + ' (settings.json)'));
    reportError({ code: 'CORRUPT_SETTINGS_JSON', message: 'settings.json was corrupted, defaults loaded' }, 'storage');
  }
  if (typeof getScenariosCorrupted === 'function' && getScenariosCorrupted()) {
    addLogEntry(createLog('warning', t('corruptedDataFallback') + ' (scenarios.json)'));
    reportError({ code: 'CORRUPT_SCENARIOS_JSON', message: 'scenarios.json was corrupted, defaults loaded' }, 'storage');
  }
  if (typeof getProfilesCorrupted === 'function' && getProfilesCorrupted()) {
    addLogEntry(createLog('warning', t('corruptedDataFallback') + ' (profiles.json)'));
    reportError({ code: 'CORRUPT_PROFILES_JSON', message: 'profiles.json was corrupted, defaults loaded' }, 'storage');
  }

  // Set version badge (textContent, safe)
  const verBadge = document.getElementById('badge-version');
  if (verBadge && window.clickflow && window.clickflow.version) {
    verBadge.textContent = 'v' + window.clickflow.version;
  }

  // Register global hotkey listeners from main process
  window.clickflow.hotkeys.onStart(() => startScenario());
  window.clickflow.hotkeys.onStop(() => stopScenario());
  window.clickflow.hotkeys.onEmergencyStop(() => triggerEmergencyStop());

  // Register app menu command listeners
  window.clickflow.appCommands.onStart(() => startScenario());
  window.clickflow.appCommands.onStop(() => stopScenario());
  window.clickflow.appCommands.onEmergencyStop(() => triggerEmergencyStop());
  window.clickflow.appCommands.onOpenSettings(() => openSettings());
  window.clickflow.appCommands.onOpenScenarios(() => openScenarioList());
  window.clickflow.appCommands.onOpenAdvanced(() => openAdvancedMode());
  window.clickflow.appCommands.onOpenMain(() => { showView('main'); renderState(); });
  window.clickflow.appCommands.onShowAbout(() => alert(`${t('aboutClickFlow')}\nv${window.clickflow.version}\n${t('simulationOnlyMvp')}`));
  window.clickflow.appCommands.onShowSafetyNotice(() => alert(t('safetyNotice')));

  addLogEntry(createLog('info', t('logAppReady')));
  showView('main'); renderState();

  // Step 31: build the Test Match panel skeleton inside the
  // image_click section once the DOM is fully ready. Safe to call
  // even if the user never opens the scenario form.
  if (typeof initImageClickTestUi === 'function') {
    try { initImageClickTestUi(); } catch (e) {}
  }
  // Step 34: build the Test OCR panel skeleton inside the
  // text_click section. Same idempotent pattern as Step 31.
  if (typeof initTextClickTestUi === 'function') {
    try { initTextClickTestUi(); } catch (e) {}
  }
}
init();



// =====================================================================
// Step 30 — image_click form helpers
// =====================================================================

// Toggle the simple_click vs image_click section based on the
// type selector. Idempotent — safe to call repeatedly.
function syncScenarioFormSections() {
  var type = (inputScenarioType && inputScenarioType.value) ? inputScenarioType.value : 'simple_click';
  if (formSectionSimple) formSectionSimple.classList.toggle('view-hidden', type !== 'simple_click');
  if (formSectionImage)  formSectionImage.classList.toggle('view-hidden',  type !== 'image_click');
  if (formSectionText)   formSectionText.classList.toggle('view-hidden',   type !== 'text_click');
  // Step 31: keep the Test Match panel in sync with the visible
  // section. The panel itself lives inside the image_click section
  // so it auto-hides with it, but we still refresh its content so
  // the user sees current template / preview / region as soon as
  // they switch.
  if (type === 'image_click' && typeof refreshImageClickTestPanel === 'function') {
    refreshImageClickTestPanel();
  }
  // Step 33: refresh the text_click "no preview" warning whenever
  // the user switches to text_click — preview state may have
  // changed since the form was last open.
  // Step 34: also refresh the new Test OCR panel so the screen /
  // region / OCR-settings cards mirror the form state.
  if (type === 'text_click') {
    refreshTextClickPreviewWarning();
    refreshTextClickRegionSummary();
    if (typeof refreshTextClickTestPanel === 'function') {
      refreshTextClickTestPanel();
    }
  }
}

// Populate the <select id="input-template-id"> with the current
// templates from app-state. If there are no templates, surface
// the warning banner and disable the select.
function populateTemplateSelect(activeId) {
  if (!inputTemplateId) return;
  // Clear via element removal — never user data via innerHTML.
  while (inputTemplateId.firstChild) inputTemplateId.removeChild(inputTemplateId.firstChild);
  var items = (typeof getTemplates === 'function') ? getTemplates() : [];
  if (imageClickNoTemplates) {
    imageClickNoTemplates.classList.toggle('view-hidden', items.length > 0);
  }
  if (items.length === 0) {
    inputTemplateId.disabled = true;
    var opt = document.createElement('option');
    opt.value = '';
    opt.textContent = t('noTemplatesImportFirst') || 'No templates yet';
    inputTemplateId.appendChild(opt);
    return;
  }
  inputTemplateId.disabled = false;
  items.forEach(function (item) {
    if (!item || typeof item.id !== 'string') return;
    var opt = document.createElement('option');
    opt.value = item.id;
    opt.textContent = item.name || item.originalFileName || item.id;
    if (activeId && item.id === activeId) opt.selected = true;
    inputTemplateId.appendChild(opt);
  });
  // If the previously-selected template is gone but the form
  // tried to keep it, fall back to the first one.
  if (!inputTemplateId.value && items[0] && items[0].id) {
    inputTemplateId.value = items[0].id;
  }
  // Step 31: refresh the Test Match template preview card whenever
  // the select content changes.
  if (typeof renderImageClickTemplatePreview === 'function') {
    renderImageClickTemplatePreview();
  }
}

// Render the region summary line — text only, never HTML.
function refreshImageClickRegionSummary() {
  if (!imageClickRegionSummary) return;
  if (_imageClickFormRegion && typeof _imageClickFormRegion === 'object') {
    var r = _imageClickFormRegion;
    imageClickRegionSummary.textContent = (r.x | 0) + ', ' + (r.y | 0) + ' · ' + (r.width | 0) + '×' + (r.height | 0);
    imageClickRegionSummary.classList.add('image-click-region-summary-active');
  } else {
    imageClickRegionSummary.textContent = t('noRegionSelected') || 'No region selected';
    imageClickRegionSummary.classList.remove('image-click-region-summary-active');
  }
  // Step 31: keep the Test Match Region summary card in sync.
  if (typeof renderImageClickRegionSummary === 'function') {
    renderImageClickRegionSummary();
  }
}

// "Use selected region" — copies the current region-selector
// state into the form. Numbers only — never an imageDataUrl.
function applySelectedRegionToImageClickForm() {
  if (typeof getState !== 'function') return;
  var st = getState();
  var r = st.regionSelector ? st.regionSelector.normalizedRegion : null;
  if (!r) {
    addLogEntry(createLog('warning', t('noRegionSelected') || 'No region selected'));
    return;
  }
  _imageClickFormRegion = {
    x: r.x | 0, y: r.y | 0, width: r.width | 0, height: r.height | 0
  };
  refreshImageClickRegionSummary();
}

function clearImageClickFormRegion() {
  _imageClickFormRegion = null;
  refreshImageClickRegionSummary();
}

// Wire up the Step-30 form controls. Called from the bottom of
// renderer.js (where the rest of the listeners live).
function bindScenarioFormImageClickHandlers() {
  if (inputScenarioType) {
    inputScenarioType.addEventListener('change', function () {
      syncScenarioFormSections();
      // Refresh the template list so a freshly-imported template
      // shows up if the user just switched to image_click.
      if (inputScenarioType.value === 'image_click') populateTemplateSelect(inputTemplateId ? inputTemplateId.value : '');
      // Step 33: refresh the text_click warning + region summary
      // when the user switches to text_click.
      if (inputScenarioType.value === 'text_click') {
        refreshTextClickPreviewWarning();
        refreshTextClickRegionSummary();
      }
    });
  }
  if (btnImageClickUseRegion) {
    btnImageClickUseRegion.addEventListener('click', applySelectedRegionToImageClickForm);
  }
  if (btnImageClickClearRegion) {
    btnImageClickClearRegion.addEventListener('click', clearImageClickFormRegion);
  }
  // Step 31: when the user changes the active template / threshold
  // / step inside the form, refresh the Test Match preview card
  // (template metadata may differ; threshold/step affect the
  // engine call). We do NOT auto-run the test — the user must
  // press the button.
  if (inputTemplateId) {
    inputTemplateId.addEventListener('change', function () {
      if (typeof renderImageClickTemplatePreview === 'function') renderImageClickTemplatePreview();
    });
  }
}
bindScenarioFormImageClickHandlers();

// =====================================================================
// Step 33 — text_click form helpers
// =====================================================================

// Render the region summary line — text only, never HTML.
function refreshTextClickRegionSummary() {
  if (!textClickRegionSummary) return;
  if (_textClickFormRegion && typeof _textClickFormRegion === 'object') {
    var r = _textClickFormRegion;
    textClickRegionSummary.textContent = (r.x | 0) + ', ' + (r.y | 0) + ' · ' + (r.width | 0) + '×' + (r.height | 0);
    textClickRegionSummary.classList.add('text-click-region-summary-active');
  } else {
    textClickRegionSummary.textContent = t('noRegionSelected') || 'No region selected';
    textClickRegionSummary.classList.remove('text-click-region-summary-active');
  }
  // Step 34: keep the Test OCR Region summary card in sync.
  if (typeof renderTextClickRegionSummary === 'function') {
    renderTextClickRegionSummary();
  }
}

// Show the "capture a screen preview first" warning whenever the
// preview slice is empty AND the form is on the text_click branch.
function refreshTextClickPreviewWarning() {
  if (!textClickNoPreview) return;
  var hasPreview = false;
  if (typeof getState === 'function') {
    var st = getState();
    var p = st && st.screenCapture ? st.screenCapture.preview : null;
    hasPreview = !!(p && typeof p.imageDataUrl === 'string' && p.imageDataUrl.indexOf('data:image/') === 0);
  }
  textClickNoPreview.classList.toggle('view-hidden', hasPreview);
  // Step 34: keep the Test OCR Screen preview status card in sync.
  if (typeof renderTextClickScreenPreviewStatus === 'function') {
    renderTextClickScreenPreviewStatus();
  }
}

// "Use selected region" — copies the current region-selector
// state into the form. Numbers only — never an imageDataUrl.
function applySelectedRegionToTextClickForm() {
  if (typeof getState !== 'function') return;
  var st = getState();
  var r = st.regionSelector ? st.regionSelector.normalizedRegion : null;
  if (!r) {
    addLogEntry(createLog('warning', t('noRegionSelected') || 'No region selected'));
    return;
  }
  _textClickFormRegion = {
    x: r.x | 0, y: r.y | 0, width: r.width | 0, height: r.height | 0
  };
  refreshTextClickRegionSummary();
}

function clearTextClickFormRegion() {
  _textClickFormRegion = null;
  refreshTextClickRegionSummary();
}

function bindScenarioFormTextClickHandlers() {
  if (btnTextClickUseRegion) {
    btnTextClickUseRegion.addEventListener('click', applySelectedRegionToTextClickForm);
  }
  if (btnTextClickClearRegion) {
    btnTextClickClearRegion.addEventListener('click', clearTextClickFormRegion);
  }
  // Step 34: refresh the Test OCR settings card whenever the user
  // edits the target text / language / match mode / case
  // sensitivity. The Test OCR result itself is NOT re-run — the
  // user must press the button.
  function _refreshOcrCard() {
    if (typeof renderTextClickOcrSettings === 'function') {
      renderTextClickOcrSettings();
    }
  }
  if (inputTextTarget)        inputTextTarget.addEventListener('input',  _refreshOcrCard);
  if (inputTextLanguage)      inputTextLanguage.addEventListener('change', _refreshOcrCard);
  if (inputTextMatchMode)     inputTextMatchMode.addEventListener('change', _refreshOcrCard);
  if (inputTextCaseSensitive) inputTextCaseSensitive.addEventListener('change', _refreshOcrCard);
}
bindScenarioFormTextClickHandlers();



// Step 30 — short text summary of a scenario's settings for the
// scenario list. Both types render via textContent only.
// Step 33 — text_click summary line.
function formatScenarioSettingsLine(sc) {
  if (!sc || !sc.settings) return '';
  if (sc.type === 'image_click') {
    var s = sc.settings;
    var thr = (typeof s.threshold === 'number') ? Math.round(s.threshold * 100) + '%' : '?';
    var hasRegion = !!s.region ? '·region' : '·full';
    return 'image_click ' + (s.templateId || '?') + ' · ' + thr + ' · step ' + (s.step | 0) + ' ' + hasRegion + ' · ' + (s.intervalMs | 0) + 'ms · ' + (s.repeatCount | 0) + '×';
  }
  if (sc.type === 'text_click') {
    var ts = sc.settings;
    // Truncate the target text inside the summary line so the
    // scenario card doesn't grow on long inputs. Render via
    // textContent only — never innerHTML.
    var truncText = (typeof ts.targetText === 'string')
      ? (ts.targetText.length > 24 ? ts.targetText.slice(0, 24) + '…' : ts.targetText)
      : '?';
    var hasReg = !!ts.region ? '·region' : '·full';
    return 'text_click "' + truncText + '" · ' + (ts.language || '?') + ' · ' + (ts.matchMode || '?') +
           (ts.caseSensitive ? ' · case' : '') + ' ' + hasReg +
           ' · ' + (ts.intervalMs | 0) + 'ms · ' + (ts.repeatCount | 0) + '×';
  }
  return 'x:' + sc.settings.x + ' y:' + sc.settings.y + ' · ' + sc.settings.intervalMs + 'ms · ' + sc.settings.repeatCount + '× · ' + sc.settings.button;
}
