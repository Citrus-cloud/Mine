// Состояние приложения
const appState = {
  isRunning: false,
  selectedScenario: 'Быстрый кликер'
};

// Элементы DOM
const statusIndicator = document.getElementById('status-indicator');
const statusValue = document.getElementById('status-value');
const scenarioValue = document.getElementById('scenario-value');
const btnStart = document.getElementById('btn-start');
const btnStop = document.getElementById('btn-stop');
const btnScenario = document.getElementById('btn-scenario');
const btnAdvanced = document.getElementById('btn-advanced');

// Обновление интерфейса на основе состояния
function renderState() {
  if (appState.isRunning) {
    statusValue.textContent = 'Работает';
    statusIndicator.classList.add('running');
    statusIndicator.classList.remove('stopped');
  } else {
    statusValue.textContent = 'Остановлен';
    statusIndicator.classList.add('stopped');
    statusIndicator.classList.remove('running');
  }

  scenarioValue.textContent = appState.selectedScenario;
}

// Запуск сценария
function startScenario() {
  appState.isRunning = true;
  renderState();
}

// Остановка сценария
function stopScenario() {
  appState.isRunning = false;
  renderState();
}

// Обработчики событий
btnStart.addEventListener('click', startScenario);
btnStop.addEventListener('click', stopScenario);

btnScenario.addEventListener('click', () => {
  alert('Выбор сценария будет добавлен на следующем шаге');
});

btnAdvanced.addEventListener('click', (e) => {
  e.preventDefault();
  alert('Расширенный режим будет добавлен позже');
});

// Начальная отрисовка
renderState();
