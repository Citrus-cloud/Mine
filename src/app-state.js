// Модуль состояния приложения ClickFlow

const appState = {
  isRunning: false,
  selectedScenarioId: "basic-clicker",
  selectedScenarioName: "Быстрый кликер",
  currentView: "main",
  theme: "system",
  logs: [],
  scenarioFormMode: null,   // "create" | "edit" | null
  editingScenarioId: null,
  execution: {
    isRunning: false,
    progressCurrent: 0,
    progressTotal: 0,
    progressPercent: 0,
    lastAction: null,
    startedAt: null,
    finishedAt: null
  }
};

function getState() {
  return {
    ...appState,
    logs: [...appState.logs],
    execution: { ...appState.execution }
  };
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

function setScenarioFormMode(mode) {
  appState.scenarioFormMode = mode;
}

function setEditingScenarioId(id) {
  appState.editingScenarioId = id;
}

// --- Execution state ---

function setExecutionRunning(isRunning) {
  appState.execution.isRunning = isRunning;
}

function setExecutionProgress(current, total) {
  appState.execution.progressCurrent = current;
  appState.execution.progressTotal = total;
  appState.execution.progressPercent = total > 0 ? Math.round((current / total) * 100) : 0;
}

function setExecutionLastAction(action) {
  appState.execution.lastAction = action;
}

function setExecutionStartedAt(value) {
  appState.execution.startedAt = value;
}

function setExecutionFinishedAt(value) {
  appState.execution.finishedAt = value;
}

function resetExecution() {
  appState.execution.isRunning = false;
  appState.execution.progressCurrent = 0;
  appState.execution.progressTotal = 0;
  appState.execution.progressPercent = 0;
  appState.execution.lastAction = null;
  appState.execution.startedAt = null;
  appState.execution.finishedAt = null;
}
