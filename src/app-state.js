// Модуль состояния приложения ClickFlow

const appState = {
  isRunning: false,
  selectedScenarioId: "basic-clicker",
  selectedScenarioName: "Быстрый кликер",
  currentView: "main",
  logs: [],
  scenarioFormMode: null,
  editingScenarioId: null,
  activeAdvancedTab: "overview",
  execution: {
    isRunning: false,
    progressCurrent: 0,
    progressTotal: 0,
    progressPercent: 0,
    lastAction: null,
    startedAt: null,
    finishedAt: null
  },
  settings: {
    language: "ru",
    theme: "system",
    hotkeys: {
      start: "Ctrl+Alt+S",
      stop: "Ctrl+Alt+X",
      emergencyStop: "Escape"
    },
    safety: {
      safeMode: true,
      emergencyStopEnabled: true,
      minIntervalMs: 50,
      maxRepeatCount: 100000
    }
  }
};

function getState() {
  return {
    ...appState,
    logs: [...appState.logs],
    execution: { ...appState.execution },
    settings: {
      ...appState.settings,
      hotkeys: { ...appState.settings.hotkeys },
      safety: { ...appState.settings.safety }
    },
    activeAdvancedTab: appState.activeAdvancedTab
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

function setActiveAdvancedTab(tab) {
  appState.activeAdvancedTab = tab;
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

// --- Settings state ---

function setSettings(settings) {
  appState.settings = {
    language: settings.language || "ru",
    theme: settings.theme || "system",
    hotkeys: { ...(settings.hotkeys || appState.settings.hotkeys) },
    safety: { ...(settings.safety || appState.settings.safety) }
  };
}

function updateSettings(partial) {
  if (partial.language !== undefined) appState.settings.language = partial.language;
  if (partial.theme !== undefined) appState.settings.theme = partial.theme;
  if (partial.hotkeys) {
    appState.settings.hotkeys = { ...appState.settings.hotkeys, ...partial.hotkeys };
  }
  if (partial.safety) {
    appState.settings.safety = { ...appState.settings.safety, ...partial.safety };
  }
}

function setLanguageSetting(language) {
  appState.settings.language = language;
}

function setThemeSetting(theme) {
  appState.settings.theme = theme;
}

function updateSafetySettings(partialSafety) {
  appState.settings.safety = { ...appState.settings.safety, ...partialSafety };
}

function getSettings() {
  return {
    ...appState.settings,
    hotkeys: { ...appState.settings.hotkeys },
    safety: { ...appState.settings.safety }
  };
}
