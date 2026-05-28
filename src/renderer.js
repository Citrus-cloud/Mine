// Главный модуль рендерера ClickFlow

// DOM — главный экран
const statusIndicator = document.getElementById('status-indicator');
const statusValue = document.getElementById('status-value');
const scenarioValue = document.getElementById('scenario-value');
const btnStart = document.getElementById('btn-start');
const btnStop = document.getElementById('btn-stop');
const btnScenario = document.getElementById('btn-scenario');
const btnAdvanced = document.getElementById('btn-advanced');
const logsContainer = document.getElementById('logs-container');

// DOM — виды
const viewMain = document.getElementById('view-main');
const viewScenarios = document.getElementById('view-scenarios');
const viewScenarioForm = document.getElementById('view-scenario-form');
const viewAdvanced = document.getElementById('view-advanced');

// DOM — список сценариев
const scenarioListEl = document.getElementById('scenario-list');
const btnCreateScenario = document.getElementById('btn-create-scenario');
const btnScenariosBack = document.getElementById('btn-scenarios-back');

// DOM — форма
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

// DOM — расширенный режим
const btnBack = document.getElementById('btn-back');

const MAX_VISIBLE_LOGS = 5;


// --- Управление видами ---

function showView(viewName) {
  setCurrentView(viewName);
  viewMain.style.display = 'none';
  viewScenarios.style.display = 'none';
  viewScenarioForm.style.display = 'none';
  viewAdvanced.style.display = 'none';

  switch (viewName) {
    case 'main': viewMain.style.display = 'flex'; break;
    case 'scenarios': viewScenarios.style.display = 'flex'; break;
    case 'scenarioForm': viewScenarioForm.style.display = 'flex'; break;
    case 'advanced': viewAdvanced.style.display = 'flex'; break;
  }
}

// --- Отрисовка главного экрана ---

function renderState() {
  const state = getState();

  if (state.isRunning) {
    statusValue.textContent = 'Работает';
    statusIndicator.classList.add('running');
    statusIndicator.classList.remove('stopped');
  } else {
    statusValue.textContent = 'Остановлен';
    statusIndicator.classList.add('stopped');
    statusIndicator.classList.remove('running');
  }

  scenarioValue.textContent = state.selectedScenarioName;
  renderLogs(state.logs);
}


function renderLogs(logs) {
  const recent = logs.slice(-MAX_VISIBLE_LOGS);
  logsContainer.innerHTML = '';

  if (recent.length === 0) {
    const p = document.createElement('p');
    p.className = 'logs-empty';
    p.textContent = 'Нет событий';
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
    empty.textContent = 'Нет сценариев';
    scenarioListEl.appendChild(empty);
    return;
  }

  scenarios.forEach(sc => {
    const card = document.createElement('div');
    card.className = 'scenario-card';
    if (sc.id === state.selectedScenarioId) {
      card.classList.add('active');
    }

    // Заголовок карточки
    const header = document.createElement('div');
    header.className = 'scenario-card-header';

    const name = document.createElement('span');
    name.className = 'scenario-card-name';
    name.textContent = sc.name;
    header.appendChild(name);

    if (sc.meta && sc.meta.isDefault) {
      const badge = document.createElement('span');
      badge.className = 'scenario-card-badge';
      badge.textContent = 'базовый';
      header.appendChild(badge);
    }

    card.appendChild(header);

    // Настройки
    const settings = document.createElement('div');
    settings.className = 'scenario-card-settings';
    const s = sc.settings;
    settings.textContent = `x:${s.x} y:${s.y} · ${s.intervalMs}мс · ${s.repeatCount}× · ${s.button}`;
    card.appendChild(settings);

    // Кнопки действий
    const actions = document.createElement('div');
    actions.className = 'scenario-card-actions';

    const btnSelect = document.createElement('button');
    btnSelect.className = 'btn-sm btn-sm-select';
    btnSelect.textContent = 'Выбрать';
    btnSelect.addEventListener('click', () => selectScenarioById(sc.id));
    actions.appendChild(btnSelect);

    const btnEdit = document.createElement('button');
    btnEdit.className = 'btn-sm btn-sm-edit';
    btnEdit.textContent = 'Изменить';
    btnEdit.addEventListener('click', () => openEditScenarioForm(sc.id));
    actions.appendChild(btnEdit);

    if (!sc.meta || !sc.meta.isDefault) {
      const btnDel = document.createElement('button');
      btnDel.className = 'btn-sm btn-sm-delete';
      btnDel.textContent = 'Удалить';
      btnDel.addEventListener('click', () => deleteScenarioById(sc.id));
      actions.appendChild(btnDel);
    }

    card.appendChild(actions);
    scenarioListEl.appendChild(card);
  });
}


// --- Действия со сценариями ---

function openScenarioList() {
  addLogEntry(createLog('info', 'Открыт список сценариев'));
  showView('scenarios');
  renderScenarioList();
  renderState();
}

function selectScenarioById(id) {
  const sc = getScenarioById(id);
  if (!sc) return;
  setSelectedScenario(sc);
  addLogEntry(createLog('success', `Выбран сценарий: ${sc.name}`));
  showView('main');
  renderState();
}

function openCreateScenarioForm() {
  setScenarioFormMode('create');
  setEditingScenarioId(null);
  clearScenarioForm();
  clearFormError();
  formTitle.textContent = 'Создать сценарий';
  showView('scenarioForm');
}

function openEditScenarioForm(id) {
  const sc = getScenarioById(id);
  if (!sc) return;
  setScenarioFormMode('edit');
  setEditingScenarioId(id);
  fillScenarioForm(sc);
  clearFormError();
  formTitle.textContent = 'Редактировать сценарий';
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
    showFormError(result ? result.error : 'Неизвестная ошибка');
    return;
  }

  await saveScenarios();

  const actionLabel = state.scenarioFormMode === 'create' ? 'Создан' : 'Обновлён';
  addLogEntry(createLog('success', `${actionLabel} сценарий: ${data.name}`));

  closeScenarioForm();
  renderState();
}

async function deleteScenarioById(id) {
  const sc = getScenarioById(id);
  if (!sc) return;
  if (sc.meta && sc.meta.isDefault) return;

  if (!confirm(`Удалить сценарий "${sc.name}"?`)) return;

  const result = deleteScenario(id);
  if (!result.success) return;

  // Если удалён активный сценарий, выбрать базовый
  const state = getState();
  if (state.selectedScenarioId === id) {
    const def = getDefaultScenario();
    setSelectedScenario(def);
  }

  await saveScenarios();
  addLogEntry(createLog('info', `Удалён сценарий: ${sc.name}`));
  renderScenarioList();
  renderState();
}


// --- Форма ---

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


// --- Start / Stop ---

function startScenario() {
  const sc = getScenarioById(getState().selectedScenarioId);
  if (!sc) {
    addLogEntry(createLog('error', 'Сценарий не найден'));
    renderState();
    return;
  }
  setRunning(true);
  addLogEntry(createLog('success', 'Сценарий запущен'));
  renderState();
}

function stopScenario() {
  setRunning(false);
  addLogEntry(createLog('info', 'Сценарий остановлен'));
  renderState();
}

// --- Расширенный режим ---

function openAdvancedMode() {
  addLogEntry(createLog('info', 'Открыт расширенный режим'));
  showView('advanced');
  renderState();
}

function goBackToMain() {
  addLogEntry(createLog('info', 'Открыто главное меню'));
  showView('main');
  renderState();
}


// --- Обработчики событий ---

btnStart.addEventListener('click', startScenario);
btnStop.addEventListener('click', stopScenario);
btnScenario.addEventListener('click', openScenarioList);
btnAdvanced.addEventListener('click', (e) => { e.preventDefault(); openAdvancedMode(); });
btnBack.addEventListener('click', goBackToMain);

btnCreateScenario.addEventListener('click', openCreateScenarioForm);
btnScenariosBack.addEventListener('click', goBackToMain);
btnSaveScenario.addEventListener('click', saveScenarioFromForm);
btnFormCancel.addEventListener('click', closeScenarioForm);

// --- Инициализация ---

async function init() {
  await initScenarios();
  const def = getDefaultScenario();
  setSelectedScenario(def);
  addLogEntry(createLog('info', 'Приложение готово'));
  showView('main');
  renderState();
}

init();
