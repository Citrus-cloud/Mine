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

// DOM — прогресс
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
const hotkeyStartEl = document.getElementById('hotkey-start');
const hotkeyStopEl = document.getElementById('hotkey-stop');
const hotkeyEmergencyEl = document.getElementById('hotkey-emergency');
const btnSaveSettings = document.getElementById('btn-save-settings');
const btnSettingsBack = document.getElementById('btn-settings-back');

// DOM — расширенный режим
const btnBack = document.getElementById('btn-back');

const MAX_VISIBLE_LOGS = 5;

// --- Управление видами ---

function showView(viewName) {
  setCurrentView(viewName);
  viewMain.style.display = 'none';
  viewScenarios.style.display = 'none';
  viewScenarioForm.style.display = 'none';
  viewSettings.style.display = 'none';
  viewAdvanced.style.display = 'none';

  // Adjust container width for advanced view
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

// --- Отрисовка ---

function renderState() {
  const state = getState();

  // Статус
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

  // Кнопки
  btnStart.disabled = state.execution.isRunning;
  btnStop.disabled = !state.execution.isRunning;

  // Прогресс
  renderExecutionProgress(state.execution);

  // Логи
  renderLogs(state.logs);

  // Update advanced dashboard if visible
  if (state.currentView === 'advanced') {
    renderAdvancedDashboard();
  }
}

function renderExecutionProgress(execution) {
  const current = execution.progressCurrent;
  const total = execution.progressTotal;
  const percent = execution.progressPercent;

  progressMeta.textContent = `${current} / ${total} · ${percent}%`;
  progressBarFill.style.width = percent + '%';

  if (percent >= 100) {
    progressBarFill.classList.add('complete');
  } else {
    progressBarFill.classList.remove('complete');
  }

  if (execution.lastAction) {
    lastActionEl.textContent = formatLastAction(execution.lastAction);
  } else {
    lastActionEl.textContent = t('lastAction') + ': ' + t('none');
  }
}

function formatLastAction(action) {
  if (!action) return t('lastAction') + ': ' + t('none');
  return `${t('lastAction')}: ${action.type} x=${action.x} y=${action.y} button=${action.button}`;
}

function shouldLogAction(current, total) {
  if (current <= 3) return true;
  if (current === total) return true;
  if (current % 10 === 0) return true;
  return false;
}

function renderLogs(logs) {
  const recent = logs.slice(-MAX_VISIBLE_LOGS);
  logsContainer.innerHTML = '';

  if (recent.length === 0) {
    const p = document.createElement('p');
    p.className = 'logs-empty';
    p.textContent = t('noEvents');
    logsContainer.appendChild(p);
    return;
  }

  recent.forEach(log => {
    const el = document.createElement('div');
    el.className = `log-entry log-${log.type}`;

    const icon = document.createElement('span');
    icon.className = 'log-icon';
    icon.textContent = getLogLabel(log.type);

    const time = document.createElement('span');
    time.className = 'log-time';
    time.textContent = log.time;

    const msg = document.createElement('span');
    msg.className = 'log-message';
    msg.textContent = log.message;

    el.appendChild(icon);
    el.appendChild(time);
    el.appendChild(msg);
    logsContainer.appendChild(el);
  });
}

// --- Список сценариев ---

function renderScenarioList() {
  const scenarios = getScenarios();
  const state = getState();
  scenarioListEl.innerHTML = '';

  if (scenarios.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'scenario-empty';
    empty.textContent = t('noScenarios');
    scenarioListEl.appendChild(empty);
    return;
  }

  scenarios.forEach(sc => {
    const card = document.createElement('div');
    card.className = 'scenario-card';
    if (sc.id === state.selectedScenarioId) card.classList.add('active');

    const header = document.createElement('div');
    header.className = 'scenario-card-header';

    const name = document.createElement('span');
    name.className = 'scenario-card-name';
    name.textContent = sc.name;
    header.appendChild(name);

    if (sc.meta && sc.meta.isDefault) {
      const badge = document.createElement('span');
      badge.className = 'scenario-card-badge';
      badge.textContent = t('defaultBadge');
      header.appendChild(badge);
    }

    card.appendChild(header);

    const settings = document.createElement('div');
    settings.className = 'scenario-card-settings';
    const s = sc.settings;
    settings.textContent = `x:${s.x} y:${s.y} · ${s.intervalMs}ms · ${s.repeatCount}× · ${s.button}`;
    card.appendChild(settings);

    const actions = document.createElement('div');
    actions.className = 'scenario-card-actions';

    const btnSelect = document.createElement('button');
    btnSelect.className = 'btn-sm btn-sm-select';
    btnSelect.textContent = t('select');
    btnSelect.addEventListener('click', () => selectScenarioById(sc.id));
    actions.appendChild(btnSelect);

    const btnEdit = document.createElement('button');
    btnEdit.className = 'btn-sm btn-sm-edit';
    btnEdit.textContent = t('edit');
    btnEdit.addEventListener('click', () => openEditScenarioForm(sc.id));
    actions.appendChild(btnEdit);

    if (!sc.meta || !sc.meta.isDefault) {
      const btnDel = document.createElement('button');
      btnDel.className = 'btn-sm btn-sm-delete';
      btnDel.textContent = t('delete');
      btnDel.addEventListener('click', () => deleteScenarioById(sc.id));
      actions.appendChild(btnDel);
    }

    card.appendChild(actions);
    scenarioListEl.appendChild(card);
  });
}

// --- Действия со сценариями ---

function openScenarioList() {
  addLogEntry(createLog('info', t('logScenariosOpened')));
  showView('scenarios');
  renderScenarioList();
  renderState();
}

function selectScenarioById(id) {
  const sc = getScenarioById(id);
  if (!sc) return;
  setSelectedScenario(sc);
  addLogEntry(createLog('success', `${t('select')}: ${sc.name}`));
  showView('main');
  renderState();
}

function openCreateScenarioForm() {
  setScenarioFormMode('create');
  setEditingScenarioId(null);
  clearScenarioForm();
  clearFormError();
  formTitle.textContent = t('createScenarioTitle');
  showView('scenarioForm');
}

function openEditScenarioForm(id) {
  const sc = getScenarioById(id);
  if (!sc) return;
  setScenarioFormMode('edit');
  setEditingScenarioId(id);
  fillScenarioForm(sc);
  clearFormError();
  formTitle.textContent = t('editScenarioTitle');
  showView('scenarioForm');
}

function closeScenarioForm() {
  setScenarioFormMode(null);
  setEditingScenarioId(null);
  clearFormError();
  showView('scenarios');
  renderScenarioList();
}

async function saveScenarioFromForm() {
  const data = getScenarioFormData();
  const state = getState();
  let result;

  if (state.scenarioFormMode === 'create') {
    result = createScenario(data);
  } else if (state.scenarioFormMode === 'edit') {
    result = updateScenario(state.editingScenarioId, data);
  }

  if (!result || !result.success) {
    showFormError(result ? result.error : 'Unknown error');
    return;
  }

  await saveScenarios();
  addLogEntry(createLog('success', `${state.scenarioFormMode === 'create' ? t('createScenarioTitle') : t('editScenarioTitle')}: ${data.name}`));
  closeScenarioForm();
  renderState();
}

async function deleteScenarioById(id) {
  const sc = getScenarioById(id);
  if (!sc) return;
  if (sc.meta && sc.meta.isDefault) return;
  if (!confirm(`${t('delete')} "${sc.name}"?`)) return;

  const result = deleteScenario(id);
  if (!result.success) return;

  const state = getState();
  if (state.selectedScenarioId === id) {
    const def = getDefaultScenario();
    setSelectedScenario(def);
  }

  await saveScenarios();
  addLogEntry(createLog('info', `${t('delete')}: ${sc.name}`));
  renderScenarioList();
  renderState();
}

// --- Форма сценария ---

function getScenarioFormData() {
  return {
    name: inputName.value,
    description: inputDescription.value,
    x: inputX.value,
    y: inputY.value,
    intervalMs: inputInterval.value,
    repeatCount: inputRepeat.value,
    button: inputButton.value
  };
}

function fillScenarioForm(sc) {
  inputName.value = sc.name;
  inputDescription.value = sc.description || '';
  inputX.value = sc.settings.x;
  inputY.value = sc.settings.y;
  inputInterval.value = sc.settings.intervalMs;
  inputRepeat.value = sc.settings.repeatCount;
  inputButton.value = sc.settings.button;
}

function clearScenarioForm() {
  inputName.value = '';
  inputDescription.value = '';
  inputX.value = '500';
  inputY.value = '400';
  inputInterval.value = '500';
  inputRepeat.value = '100';
  inputButton.value = 'left';
}

function showFormError(message) {
  formError.textContent = message;
  formError.classList.add('visible');
}

function clearFormError() {
  formError.textContent = '';
  formError.classList.remove('visible');
}

// --- Настройки ---

function openSettings() {
  addLogEntry(createLog('info', t('logSettingsOpened')));
  renderSettingsForm();
  showView('settings');
  renderState();
}

function renderSettingsForm() {
  const s = getSettings();
  settingsLanguage.value = s.language;
  settingsTheme.value = s.theme;
  settingsMinInterval.value = s.safety.minIntervalMs;
  settingsMaxRepeats.value = s.safety.maxRepeatCount;
  hotkeyStartEl.textContent = s.hotkeys.start;
  hotkeyStopEl.textContent = s.hotkeys.stop;
  hotkeyEmergencyEl.textContent = s.hotkeys.emergencyStop;
  safetyModeBadge.textContent = s.safety.safeMode ? t('enabled') : t('disabled');
  safetyModeBadge.className = 'safety-badge ' + (s.safety.safeMode ? 'safety-on' : 'safety-off');
  emergencyStopBadge.textContent = s.safety.emergencyStopEnabled ? t('enabled') : t('disabled');
  emergencyStopBadge.className = 'safety-badge ' + (s.safety.emergencyStopEnabled ? 'safety-on' : 'safety-off');
}

async function saveSettingsFromForm() {
  const newSettings = {
    language: settingsLanguage.value,
    theme: settingsTheme.value,
    hotkeys: getSettings().hotkeys,
    safety: {
      safeMode: true,
      emergencyStopEnabled: true,
      minIntervalMs: Math.max(50, Number(settingsMinInterval.value) || 50),
      maxRepeatCount: Math.min(100000, Math.max(1, Number(settingsMaxRepeats.value) || 100000))
    }
  };

  setSettings(newSettings);
  await saveSettings(newSettings);

  // Применить язык
  setLanguage(newSettings.language);
  applyTranslations();

  addLogEntry(createLog('success', t('logSettingsSaved')));
  showView('main');
  renderState();
}

function goBackFromSettings() {
  addLogEntry(createLog('info', t('logMainOpened')));
  showView('main');
  renderState();
}

// --- Start / Stop ---

function startScenario() {
  const state = getState();

  if (state.execution.isRunning) {
    addLogEntry(createLog('warning', t('logAlreadyRunning')));
    renderState();
    return;
  }

  const sc = getScenarioById(state.selectedScenarioId);
  if (!sc) {
    addLogEntry(createLog('error', t('logNoScenario')));
    renderState();
    return;
  }

  const safetyOpts = state.settings.safety;

  runScenario(sc, {
    onStart: () => {
      setRunning(true);
      setExecutionRunning(true);
      setExecutionProgress(0, sc.settings.repeatCount);
      setExecutionStartedAt(new Date().toISOString());
      setExecutionFinishedAt(null);
      setExecutionLastAction(null);
      addLogEntry(createLog('success', `${t('logScenarioStarted')}: ${sc.name}`));
      renderState();
    },
    onAction: (action, current, total) => {
      setExecutionLastAction(action);
      if (shouldLogAction(current, total)) {
        addLogEntry(createLog('info', `${current}/${total}: click x=${action.x} y=${action.y}`));
      }
    },
    onProgress: (current, total) => {
      setExecutionProgress(current, total);
      renderState();
    },
    onStop: () => {
      setRunning(false);
      setExecutionRunning(false);
      setExecutionFinishedAt(new Date().toISOString());
      addLogEntry(createLog('warning', t('logScenarioStopped')));
      renderState();
    },
    onComplete: () => {
      setRunning(false);
      setExecutionRunning(false);
      setExecutionFinishedAt(new Date().toISOString());
      addLogEntry(createLog('success', t('logScenarioComplete')));
      renderState();
    },
    onError: (message) => {
      setRunning(false);
      setExecutionRunning(false);
      addLogEntry(createLog('error', message));
      renderState();
    }
  }, { safety: safetyOpts });
}

function stopScenario() {
  const state = getState();
  if (!state.execution.isRunning) {
    addLogEntry(createLog('info', t('logNoActiveStop')));
    renderState();
    return;
  }
  stopEngine();
  addLogEntry(createLog('info', t('logStopping')));
  renderState();
}

function triggerEmergencyStop() {
  const state = getState();
  if (!state.execution.isRunning) return;
  stopEngine();
  setRunning(false);
  setExecutionRunning(false);
  setExecutionFinishedAt(new Date().toISOString());
  addLogEntry(createLog('warning', t('logEmergencyStop')));
  renderState();
}

// --- Расширенный режим ---

let advancedLogFilter = "all";

function openAdvancedMode() {
  addLogEntry(createLog('info', t('logAdvancedOpened')));
  showView('advanced');
  setAdvancedTab('overview');
  renderAdvancedDashboard();
  renderState();
}

function goBackToMain() {
  addLogEntry(createLog('info', t('logMainOpened')));
  showView('main');
  renderState();
}

// --- Advanced Tab Management ---

function setAdvancedTab(tab) {
  setActiveAdvancedTab(tab);

  // Update tab buttons
  document.querySelectorAll('.adv-tab').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-advanced-tab') === tab);
  });

  // Show/hide sections
  document.querySelectorAll('.adv-section').forEach(sec => {
    sec.classList.add('adv-section-hidden');
  });
  const activeSection = document.getElementById('advanced-tab-' + tab);
  if (activeSection) activeSection.classList.remove('adv-section-hidden');

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
  const state = getState();
  const sc = getScenarioById(state.selectedScenarioId);
  const scenarios = getScenarios();
  const container = document.getElementById('advanced-tab-overview');
  container.innerHTML = '';

  // Grid
  const grid = document.createElement('div');
  grid.className = 'adv-grid';

  // Active scenario card
  const scCard = document.createElement('div');
  scCard.className = 'adv-card';
  const scTitle = document.createElement('div');
  scTitle.className = 'adv-card-title';
  scTitle.textContent = t('activeScenario');
  scCard.appendChild(scTitle);
  if (sc) {
    addCardRow(scCard, t('scenarioName'), sc.name);
    addCardRow(scCard, t('type'), sc.type);
    addCardRow(scCard, t('coordinates'), `${sc.settings.x}, ${sc.settings.y}`);
    addCardRow(scCard, t('interval'), `${sc.settings.intervalMs} ms`);
    addCardRow(scCard, t('repeats'), `${sc.settings.repeatCount}`);
  } else {
    addCardRow(scCard, '', t('noData'));
  }
  grid.appendChild(scCard);

  // Execution status card
  const exCard = document.createElement('div');
  exCard.className = 'adv-card';
  const exTitle = document.createElement('div');
  exTitle.className = 'adv-card-title';
  exTitle.textContent = t('executionStatus');
  exCard.appendChild(exTitle);
  addCardRow(exCard, t('status'), state.isRunning ? t('running') : t('stopped'));
  addCardRow(exCard, t('progress'), `${state.execution.progressCurrent}/${state.execution.progressTotal} (${state.execution.progressPercent}%)`);
  if (state.execution.lastAction) {
    addCardRow(exCard, t('lastAction'), `x=${state.execution.lastAction.x} y=${state.execution.lastAction.y}`);
  }
  grid.appendChild(exCard);

  // Settings summary
  const setCard = document.createElement('div');
  setCard.className = 'adv-card';
  const setTitle = document.createElement('div');
  setTitle.className = 'adv-card-title';
  setTitle.textContent = t('settingsSummary');
  setCard.appendChild(setTitle);
  addCardRow(setCard, t('language'), state.settings.language === 'ru' ? t('langRu') : t('langEn'));
  addCardRow(setCard, t('theme'), t('theme' + state.settings.theme.charAt(0).toUpperCase() + state.settings.theme.slice(1)));
  addCardRow(setCard, t('safeMode'), state.settings.safety.safeMode ? t('enabled') : t('disabled'));
  addCardRow(setCard, t('emergencyStop'), state.settings.safety.emergencyStopEnabled ? t('enabled') : t('disabled'));
  grid.appendChild(setCard);

  // Statistics
  const statCard = document.createElement('div');
  statCard.className = 'adv-card';
  const statTitle = document.createElement('div');
  statTitle.className = 'adv-card-title';
  statTitle.textContent = t('statistics');
  statCard.appendChild(statTitle);
  addCardRow(statCard, t('scenarioCount'), `${scenarios.length}`);
  addCardRow(statCard, t('logCount'), `${state.logs.length}`);
  addCardRow(statCard, t('minInterval'), `${state.settings.safety.minIntervalMs} ms`);
  addCardRow(statCard, t('maxRepeats'), `${state.settings.safety.maxRepeatCount}`);
  grid.appendChild(statCard);

  container.appendChild(grid);

  // Recent events (full width)
  const recentCard = document.createElement('div');
  recentCard.className = 'adv-card';
  const recentTitle = document.createElement('div');
  recentTitle.className = 'adv-card-title';
  recentTitle.textContent = t('recentEvents');
  recentCard.appendChild(recentTitle);
  const recentLogs = state.logs.slice(-3);
  if (recentLogs.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'adv-log-empty';
    empty.textContent = t('noEvents');
    recentCard.appendChild(empty);
  } else {
    recentLogs.forEach(log => recentCard.appendChild(createLogEl(log)));
  }
  container.appendChild(recentCard);
}

function renderAdvancedScenarios() {
  const state = getState();
  const scenarios = getScenarios();
  const container = document.getElementById('advanced-tab-scenarios');
  container.innerHTML = '';

  const card = document.createElement('div');
  card.className = 'adv-card';
  const title = document.createElement('div');
  title.className = 'adv-card-title';
  title.textContent = t('tabScenarios');
  card.appendChild(title);
  addCardRow(card, t('scenarioCount'), `${scenarios.length}`);
  addCardRow(card, t('activeScenario'), state.selectedScenarioName);

  // Show first 3 scenarios as mini cards
  scenarios.slice(0, 3).forEach(sc => {
    const row = document.createElement('div');
    row.className = 'adv-card-row';
    const lbl = document.createElement('span');
    lbl.className = 'adv-card-label';
    lbl.textContent = sc.name;
    const val = document.createElement('span');
    val.className = 'adv-card-value';
    val.textContent = `${sc.settings.x},${sc.settings.y} · ${sc.settings.intervalMs}ms · ${sc.settings.repeatCount}×`;
    row.appendChild(lbl);
    row.appendChild(val);
    card.appendChild(row);
  });

  const btn = document.createElement('button');
  btn.className = 'adv-btn';
  btn.textContent = t('openScenarioList');
  btn.addEventListener('click', () => {
    openScenarioList();
  });
  card.appendChild(btn);
  container.appendChild(card);
}

function renderAdvancedExecution() {
  const state = getState();
  const container = document.getElementById('advanced-tab-execution');
  container.innerHTML = '';

  const card = document.createElement('div');
  card.className = 'adv-card';
  const title = document.createElement('div');
  title.className = 'adv-card-title';
  title.textContent = t('executionStatus');
  card.appendChild(title);

  addCardRow(card, t('status'), state.isRunning ? t('running') : t('stopped'));
  addCardRow(card, t('executionMode'), t('simulationMode'));
  addCardRow(card, t('progress'), `${state.execution.progressCurrent} / ${state.execution.progressTotal} · ${state.execution.progressPercent}%`);

  if (state.execution.lastAction) {
    addCardRow(card, t('lastAction'), `click x=${state.execution.lastAction.x} y=${state.execution.lastAction.y} ${state.execution.lastAction.button}`);
  } else {
    addCardRow(card, t('lastAction'), t('none'));
  }

  addCardRow(card, t('startedAt'), state.execution.startedAt || t('none'));
  addCardRow(card, t('finishedAt'), state.execution.finishedAt || t('none'));

  // Progress bar
  const bar = document.createElement('div');
  bar.className = 'adv-progress-bar';
  const fill = document.createElement('div');
  fill.className = 'adv-progress-fill' + (state.execution.progressPercent >= 100 ? ' complete' : '');
  fill.style.width = state.execution.progressPercent + '%';
  bar.appendChild(fill);
  card.appendChild(bar);

  container.appendChild(card);

  // Start/Stop buttons
  const actions = document.createElement('div');
  actions.style.cssText = 'display:flex;gap:10px;width:100%';
  const startBtn = document.createElement('button');
  startBtn.className = 'adv-btn';
  startBtn.textContent = t('start');
  startBtn.disabled = state.execution.isRunning;
  startBtn.style.flex = '1';
  startBtn.addEventListener('click', startScenario);

  const stopBtn = document.createElement('button');
  stopBtn.className = 'adv-btn adv-btn-danger';
  stopBtn.textContent = t('stop');
  stopBtn.disabled = !state.execution.isRunning;
  stopBtn.style.flex = '1';
  stopBtn.addEventListener('click', stopScenario);

  actions.appendChild(startBtn);
  actions.appendChild(stopBtn);
  container.appendChild(actions);
}

function renderAdvancedLogs() {
  const state = getState();
  const container = document.getElementById('advanced-tab-logs');
  container.innerHTML = '';

  // Filters
  const filtersDiv = document.createElement('div');
  filtersDiv.className = 'adv-log-filters';
  const filters = [
    { key: 'all', label: t('logFilterAll') },
    { key: 'info', label: t('logFilterInfo') },
    { key: 'success', label: t('logFilterSuccess') },
    { key: 'warning', label: t('logFilterWarning') },
    { key: 'error', label: t('logFilterError') }
  ];
  filters.forEach(f => {
    const btn = document.createElement('button');
    btn.className = 'adv-log-filter' + (advancedLogFilter === f.key ? ' active' : '');
    btn.textContent = f.label;
    btn.addEventListener('click', () => {
      advancedLogFilter = f.key;
      renderAdvancedLogs();
    });
    filtersDiv.appendChild(btn);
  });
  container.appendChild(filtersDiv);

  // Log list
  const card = document.createElement('div');
  card.className = 'adv-card';
  const title = document.createElement('div');
  title.className = 'adv-card-title';
  title.textContent = t('fullLogs') + ` (${state.logs.length})`;
  card.appendChild(title);

  const logList = document.createElement('div');
  logList.className = 'adv-log-list';

  let filtered = state.logs;
  if (advancedLogFilter !== 'all') {
    filtered = state.logs.filter(l => l.type === advancedLogFilter);
  }

  if (filtered.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'adv-log-empty';
    empty.textContent = t('noLogs');
    logList.appendChild(empty);
  } else {
    filtered.forEach(log => logList.appendChild(createLogEl(log)));
  }

  card.appendChild(logList);
  container.appendChild(card);

  // Clear button
  const clearBtn = document.createElement('button');
  clearBtn.className = 'adv-btn adv-btn-danger';
  clearBtn.textContent = t('clearLogs');
  clearBtn.addEventListener('click', () => {
    clearAllLogs();
  });
  container.appendChild(clearBtn);
}

function renderAdvancedSettings() {
  const state = getState();
  const container = document.getElementById('advanced-tab-settings');
  container.innerHTML = '';

  const card = document.createElement('div');
  card.className = 'adv-card';
  const title = document.createElement('div');
  title.className = 'adv-card-title';
  title.textContent = t('settingsSummary');
  card.appendChild(title);

  addCardRow(card, t('language'), state.settings.language === 'ru' ? t('langRu') : t('langEn'));
  addCardRow(card, t('theme'), state.settings.theme);
  addCardRow(card, t('hotkeyStart'), state.settings.hotkeys.start);
  addCardRow(card, t('hotkeyStop'), state.settings.hotkeys.stop);
  addCardRow(card, t('hotkeyEmergency'), state.settings.hotkeys.emergencyStop);
  addCardRow(card, t('safeMode'), state.settings.safety.safeMode ? t('enabled') : t('disabled'));

  const btn = document.createElement('button');
  btn.className = 'adv-btn';
  btn.textContent = t('openSettings');
  btn.addEventListener('click', () => {
    openSettings();
  });
  card.appendChild(btn);
  container.appendChild(card);
}

function renderAdvancedSafety() {
  const state = getState();
  const container = document.getElementById('advanced-tab-safety');
  container.innerHTML = '';

  const card = document.createElement('div');
  card.className = 'adv-card';
  const title = document.createElement('div');
  title.className = 'adv-card-title';
  title.textContent = t('safetyOverview');
  card.appendChild(title);

  addCardRow(card, t('safeMode'), state.settings.safety.safeMode ? t('enabled') : t('disabled'));
  addCardRow(card, t('emergencyStop'), state.settings.safety.emergencyStopEnabled ? t('enabled') : t('disabled'));
  addCardRow(card, t('minInterval'), `${state.settings.safety.minIntervalMs} ms`);
  addCardRow(card, t('maxRepeats'), `${state.settings.safety.maxRepeatCount}`);
  container.appendChild(card);

  // Warning
  const warning = document.createElement('div');
  warning.className = 'adv-warning';
  warning.textContent = t('simulationModeNotice');
  container.appendChild(warning);
}

function renderAdvancedFuture() {
  const container = document.getElementById('advanced-tab-future');
  container.innerHTML = '';

  const titleCard = document.createElement('div');
  titleCard.className = 'adv-card';
  const title = document.createElement('div');
  title.className = 'adv-card-title';
  title.textContent = t('futureFeatures');
  titleCard.appendChild(title);
  container.appendChild(titleCard);

  const grid = document.createElement('div');
  grid.className = 'adv-future-grid';

  const features = [
    'ocrTextDetection',
    'imageRecognition',
    'visualActionBuilder',
    'profiles',
    'importExport',
    'realDesktopClicks'
  ];

  features.forEach(key => {
    const card = document.createElement('div');
    card.className = 'adv-future-card';
    const name = document.createElement('div');
    name.className = 'adv-future-card-name';
    name.textContent = t(key);
    const badge = document.createElement('span');
    badge.className = 'adv-future-card-badge';
    badge.textContent = t('planned');
    card.appendChild(name);
    card.appendChild(badge);
    grid.appendChild(card);
  });

  container.appendChild(grid);
}

// --- Helper: create log element ---
function createLogEl(log) {
  const el = document.createElement('div');
  el.className = `log-entry log-${log.type}`;
  const icon = document.createElement('span');
  icon.className = 'log-icon';
  icon.textContent = getLogLabel(log.type);
  const time = document.createElement('span');
  time.className = 'log-time';
  time.textContent = log.time;
  const msg = document.createElement('span');
  msg.className = 'log-message';
  msg.textContent = log.message;
  el.appendChild(icon);
  el.appendChild(time);
  el.appendChild(msg);
  return el;
}

// --- Helper: add card row ---
function addCardRow(card, label, value) {
  const row = document.createElement('div');
  row.className = 'adv-card-row';
  const lbl = document.createElement('span');
  lbl.className = 'adv-card-label';
  lbl.textContent = label;
  const val = document.createElement('span');
  val.className = 'adv-card-value';
  val.textContent = value;
  row.appendChild(lbl);
  row.appendChild(val);
  card.appendChild(row);
}

function clearAllLogs() {
  clearLogs();
  renderAdvancedLogs();
  renderState();
}

// --- Горячие клавиши ---

function handleGlobalHotkeys(event) {
  const state = getState();
  const hotkeys = state.settings.hotkeys;

  // Ctrl+Alt+S — Start
  if (event.ctrlKey && event.altKey && event.key.toLowerCase() === 's') {
    event.preventDefault();
    startScenario();
    return;
  }

  // Ctrl+Alt+X — Stop
  if (event.ctrlKey && event.altKey && event.key.toLowerCase() === 'x') {
    event.preventDefault();
    stopScenario();
    return;
  }

  // Escape — Emergency Stop
  if (event.key === 'Escape' && state.settings.safety.emergencyStopEnabled) {
    event.preventDefault();
    triggerEmergencyStop();
    return;
  }
}

document.addEventListener('keydown', handleGlobalHotkeys);

// --- Обработчики событий ---

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

// Advanced tabs
document.getElementById('advanced-tabs').addEventListener('click', (e) => {
  const tab = e.target.getAttribute('data-advanced-tab');
  if (tab) setAdvancedTab(tab);
});

// --- Инициализация ---

async function init() {
  // Загрузить настройки
  const settings = await loadSettings();
  setSettings(settings);
  setLanguage(settings.language);
  applyTranslations();

  // Загрузить сценарии
  await initScenarios();
  const def = getDefaultScenario();
  setSelectedScenario(def);
  resetExecution();

  addLogEntry(createLog('info', t('logAppReady')));
  showView('main');
  renderState();
}

init();
