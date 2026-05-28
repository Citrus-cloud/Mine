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


// --- Views ---
function showView(viewName) {
  setCurrentView(viewName);
  viewMain.style.display = 'none';
  viewScenarios.style.display = 'none';
  viewScenarioForm.style.display = 'none';
  viewSettings.style.display = 'none';
  viewAdvanced.style.display = 'none';
  const container = document.querySelector('.container');
  container.style.maxWidth = (viewName === 'advanced') ? '720px' : '520px';
  switch (viewName) {
    case 'main': viewMain.style.display = 'flex'; break;
    case 'scenarios': viewScenarios.style.display = 'flex'; break;
    case 'scenarioForm': viewScenarioForm.style.display = 'flex'; break;
    case 'settings': viewSettings.style.display = 'flex'; break;
    case 'advanced': viewAdvanced.style.display = 'flex'; break;
  }
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
  lastActionEl.textContent = ex.lastAction
    ? `${t('lastAction')}: click x=${ex.lastAction.x} y=${ex.lastAction.y} ${ex.lastAction.button}`
    : `${t('lastAction')}: ${t('none')}`;
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
    card.appendChild(header);
    const info = document.createElement('div'); info.className = 'scenario-card-settings';
    info.textContent = `x:${sc.settings.x} y:${sc.settings.y} · ${sc.settings.intervalMs}ms · ${sc.settings.repeatCount}× · ${sc.settings.button}`;
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
function openCreateScenarioForm() { setScenarioFormMode('create'); setEditingScenarioId(null); clearScenarioForm(); clearFormError(); formTitle.textContent = t('createScenarioTitle'); showView('scenarioForm'); }
function openEditScenarioForm(id) { const sc = getScenarioById(id); if (!sc) return; setScenarioFormMode('edit'); setEditingScenarioId(id); fillScenarioForm(sc); clearFormError(); formTitle.textContent = t('editScenarioTitle'); showView('scenarioForm'); }
function closeScenarioForm() { setScenarioFormMode(null); setEditingScenarioId(null); clearFormError(); showView('scenarios'); renderScenarioList(); }

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

function getScenarioFormData() { return { name: inputName.value, description: inputDescription.value, x: inputX.value, y: inputY.value, intervalMs: inputInterval.value, repeatCount: inputRepeat.value, button: inputButton.value }; }
function fillScenarioForm(sc) { inputName.value = sc.name; inputDescription.value = sc.description || ''; inputX.value = sc.settings.x; inputY.value = sc.settings.y; inputInterval.value = sc.settings.intervalMs; inputRepeat.value = sc.settings.repeatCount; inputButton.value = sc.settings.button; }
function clearScenarioForm() { inputName.value = ''; inputDescription.value = ''; inputX.value = '500'; inputY.value = '400'; inputInterval.value = '500'; inputRepeat.value = '100'; inputButton.value = 'left'; }
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
  addLogEntry(createLog('success', t('logSettingsSaved'))); showView('main'); renderState();
}
function goBackFromSettings() { addLogEntry(createLog('info', t('logMainOpened'))); showView('main'); renderState(); }

// --- Start / Stop ---
function startScenario() {
  const state = getState();
  if (state.execution.isRunning) { addLogEntry(createLog('warning', t('logAlreadyRunning'))); renderState(); return; }
  const sc = getScenarioById(state.selectedScenarioId);
  if (!sc) { addLogEntry(createLog('error', t('logNoScenario'))); reportError({ code: 'NO_SCENARIO', message: t('logNoScenario') }, 'start'); renderState(); return; }
  runScenario(sc, {
    onStart: () => { setRunning(true); setExecutionRunning(true); setExecutionProgress(0, sc.settings.repeatCount); setExecutionStartedAt(new Date().toISOString()); setExecutionFinishedAt(null); setExecutionLastAction(null); addLogEntry(createLog('success', `${t('logScenarioStarted')}: ${sc.name}`)); window.clickflow.system.setExecutionRunning(true); renderState(); },
    onAction: (action, c, total) => { setExecutionLastAction(action); if (shouldLogAction(c, total)) addLogEntry(createLog('info', `${c}/${total}: click x=${action.x} y=${action.y}`)); },
    onProgress: (c, total) => { setExecutionProgress(c, total); renderState(); },
    onStop: () => { setRunning(false); setExecutionRunning(false); setExecutionFinishedAt(new Date().toISOString()); addLogEntry(createLog('warning', t('logScenarioStopped'))); window.clickflow.system.setExecutionRunning(false); renderState(); },
    onComplete: () => { setRunning(false); setExecutionRunning(false); setExecutionFinishedAt(new Date().toISOString()); addLogEntry(createLog('success', t('logScenarioComplete'))); window.clickflow.system.setExecutionRunning(false); renderState(); },
    onError: (msg) => { setRunning(false); setExecutionRunning(false); reportError({ code: 'EXEC_ERROR', message: msg }, 'click-engine'); addLogEntry(createLog('error', msg)); window.clickflow.system.setExecutionRunning(false); renderState(); }
  }, { safety: state.settings.safety });
}

function stopScenario() {
  const state = getState();
  if (!state.execution.isRunning) { addLogEntry(createLog('info', t('logNoActiveStop'))); renderState(); return; }
  stopEngine(); addLogEntry(createLog('info', t('logStopping'))); renderState();
}

function triggerEmergencyStop() {
  const state = getState(); if (!state.execution.isRunning) return;
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
  if (result.success) { addLogEntry(createLog('success', t('exportedScenarios'))); }
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
  if (result.success) { await saveScenarios(); addLogEntry(createLog('success', `${t('importedScenarios')}: ${result.count}`)); }
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
  addCardRow(card, t('lastAction'), state.execution.lastAction ? `click x=${state.execution.lastAction.x} y=${state.execution.lastAction.y}` : t('none'));
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

  // Warning
  const warning = document.createElement('div'); warning.className = 'adv-warning'; warning.textContent = t('simulationModeNotice'); c.appendChild(warning);
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
  try { sysInfo = await window.clickflow.system.getInfo(); } catch(e) {}
  const text = `ClickFlow Diagnostics\nVersion: ${window.clickflow.version}\nElectron: ${sysInfo.electronVersion || '?'}\nPlatform: ${sysInfo.platform || '?'} (${sysInfo.arch || '?'})\nPackaged: ${sysInfo.isPackaged || false}\nLanguage: ${state.settings.language}\nTheme: ${state.settings.theme}\nScenarios: ${getScenarios().length}\nProfiles: ${getProfileCount()}\nLogs: ${state.logs.length}\nErrors: ${getErrorCount()}\nSafe mode: ${state.settings.safety.safeMode}\nGlobal hotkeys: ${sysInfo.globalHotkeysRegistered || false}\nTray: ${sysInfo.trayAvailable || false}\nExecution: ${state.execution.isRunning ? 'running' : 'idle'}\nSimulation only: true`;
  try { await navigator.clipboard.writeText(text); addLogEntry(createLog('success', t('diagnosticsCopied'))); }
  catch (e) { addLogEntry(createLog('warning', t('diagnosticsCopyFailed'))); }
  renderState();
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
  const def = getDefaultScenario(); setSelectedScenario(def);
  resetExecution();

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
}
init();
