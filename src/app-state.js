// Модуль состояния приложения ClickFlow

const appState = {
  isRunning: false,
  selectedScenarioId: "basic-clicker",
  selectedScenarioName: "Быстрый кликер",
  currentView: "main",
  theme: "system",
  logs: []
};

// Возвращает копию состояния (защита от мутации извне)
function getState() {
  return { ...appState, logs: [...appState.logs] };
}

function setRunning(isRunning) {
  appState.isRunning = isRunning;
}

function setSelectedScenario(scenario) {
  appState.selectedScenarioId = scenario.id;
  appState.selectedScenarioName = scenario.name;
}

function setCurrentView(view) {
  appState.currentView = view;
}

function setTheme(theme) {
  appState.theme = theme;
}

function addLogEntry(logEntry) {
  appState.logs.push(logEntry);
}

function clearLogs() {
  appState.logs = [];
}
