// Главный модуль рендерера ClickFlow
// Использует: app-state.js, logger.js, scenario-manager.js (подключены через script tags)

// Элементы DOM — главный экран
const statusIndicator = document.getElementById('status-indicator');
const statusValue = document.getElementById('status-value');
const scenarioValue = document.getElementById('scenario-value');
const btnStart = document.getElementById('btn-start');
const btnStop = document.getElementById('btn-stop');
const btnScenario = document.getElementById('btn-scenario');
const btnAdvanced = document.getElementById('btn-advanced');
const logsContainer = document.getElementById('logs-container');

// Виды (views)
const viewMain = document.getElementById('view-main');
const viewAdvanced = document.getElementById('view-advanced');
const btnBack = document.getElementById('btn-back');

// Максимальное количество логов на экране
const MAX_VISIBLE_LOGS = 5;

// --- Отрисовка ---

function renderState() {
  const state = getState();

  // Статус
  if (state.isRunning) {
    statusValue.textContent = 'Работает';
    statusIndicator.classList.add('running');
    statusIndicator.classList.remove('stopped');
  } else {
    statusValue.textContent = 'Остановлен';
    statusIndicator.classList.add('stopped');
    statusIndicator.classList.remove('running');
  }

  // Сценарий
  scenarioValue.textContent = state.selectedScenarioName;

  // Логи
  renderLogs(state.logs);
}

function renderLogs(logs) {
  const recentLogs = logs.slice(-MAX_VISIBLE_LOGS);
  logsContainer.innerHTML = '';

  if (recentLogs.length === 0) {
    logsContainer.innerHTML = '<p class="logs-empty">Нет событий</p>';
    return;
  }

  recentLogs.forEach(log => {
    const el = document.createElement('div');
    el.className = `log-entry log-${log.type}`;
    el.innerHTML = `
      <span class="log-icon">${getLogLabel(log.type)}</span>
      <span class="log-time">${log.time}</span>
      <span class="log-message">${log.message}</span>
    `;
    logsContainer.appendChild(el);
  });
}

function showView(viewName) {
  setCurrentView(viewName);

  if (viewName === 'main') {
    viewMain.style.display = 'flex';
    viewAdvanced.style.display = 'none';
  } else if (viewName === 'advanced') {
    viewMain.style.display = 'none';
    viewAdvanced.style.display = 'flex';
  }
}

// --- Действия ---

function startScenario() {
  setRunning(true);
  addLogEntry(createLog('success', 'Сценарий запущен'));
  renderState();
}

function stopScenario() {
  setRunning(false);
  addLogEntry(createLog('info', 'Сценарий остановлен'));
  renderState();
}

function openAdvancedMode() {
  addLogEntry(createLog('info', 'Открыт расширенный режим'));
  showView('advanced');
  renderState();
}

function goBack() {
  addLogEntry(createLog('info', 'Открыто главное меню'));
  showView('main');
  renderState();
}

function selectScenario() {
  addLogEntry(createLog('warning', 'Выбор сценариев будет добавлен позже'));
  renderState();
}

// --- Обработчики событий ---

btnStart.addEventListener('click', startScenario);
btnStop.addEventListener('click', stopScenario);
btnScenario.addEventListener('click', selectScenario);

btnAdvanced.addEventListener('click', (e) => {
  e.preventDefault();
  openAdvancedMode();
});

btnBack.addEventListener('click', goBack);

// --- Инициализация ---

function init() {
  const defaultScenario = getDefaultScenario();
  setSelectedScenario(defaultScenario);
  addLogEntry(createLog('info', 'Приложение готово'));
  showView('main');
  renderState();
}

init();
