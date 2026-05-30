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
  importPreview: null,
  execution: {
    isRunning: false,
    progressCurrent: 0,
    progressTotal: 0,
    progressPercent: 0,
    lastAction: null,
    startedAt: null,
    finishedAt: null
  },
  // Step 25 — Screen Capture Foundation. Renderer-side memory only.
  // imageDataUrl is held only for the active preview; nothing here
  // is persisted to disk, settings, scenarios, or profiles.
  screenCapture: {
    sources: [],
    selectedSourceId: null,
    preview: null,
    isLoading: false,
    lastError: null,
    lastCapturedAt: null
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
    screenCapture: {
      sources: appState.screenCapture.sources.slice(),
      selectedSourceId: appState.screenCapture.selectedSourceId,
      preview: appState.screenCapture.preview ? { ...appState.screenCapture.preview } : null,
      isLoading: appState.screenCapture.isLoading,
      lastError: appState.screenCapture.lastError,
      lastCapturedAt: appState.screenCapture.lastCapturedAt
    },
    settings: {
      ...appState.settings,
      hotkeys: { ...appState.settings.hotkeys },
      safety: { ...appState.settings.safety }
    },
    activeAdvancedTab: appState.activeAdvancedTab,
    importPreview: appState.importPreview
  };
}

function setRunning(isRunning) { appState.isRunning = isRunning; }
function setSelectedScenario(scenario) {
  appState.selectedScenarioId = scenario.id;
  appState.selectedScenarioName = scenario.name;
}
function setCurrentView(view) { appState.currentView = view; }
function addLogEntry(logEntry) { appState.logs.push(logEntry); }
function clearLogs() { appState.logs = []; }
function setScenarioFormMode(mode) { appState.scenarioFormMode = mode; }
function setEditingScenarioId(id) { appState.editingScenarioId = id; }
function setActiveAdvancedTab(tab) { appState.activeAdvancedTab = tab; }
function setImportPreview(data) { appState.importPreview = data; }
function clearImportPreview() { appState.importPreview = null; }

// --- Execution state ---
function setExecutionRunning(isRunning) { appState.execution.isRunning = isRunning; }
function setExecutionProgress(current, total) {
  appState.execution.progressCurrent = current;
  appState.execution.progressTotal = total;
  appState.execution.progressPercent = total > 0 ? Math.round((current / total) * 100) : 0;
}
function setExecutionLastAction(action) { appState.execution.lastAction = action; }
function setExecutionStartedAt(value) { appState.execution.startedAt = value; }
function setExecutionFinishedAt(value) { appState.execution.finishedAt = value; }
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
  if (partial.hotkeys) appState.settings.hotkeys = { ...appState.settings.hotkeys, ...partial.hotkeys };
  if (partial.safety) appState.settings.safety = { ...appState.settings.safety, ...partial.safety };
}
function setLanguageSetting(language) { appState.settings.language = language; }
function setThemeSetting(theme) { appState.settings.theme = theme; }
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


// --- Step 25: Screen capture state (renderer memory only) ---
function setScreenCaptureSources(sources) {
  appState.screenCapture.sources = Array.isArray(sources) ? sources.slice() : [];
}
function setSelectedScreenSource(sourceId) {
  appState.screenCapture.selectedSourceId = (typeof sourceId === 'string' && sourceId.length > 0) ? sourceId : null;
}
function setScreenCapturePreview(preview) {
  if (preview && typeof preview === 'object') {
    appState.screenCapture.preview = { ...preview };
    if (typeof preview.capturedAt === 'string') {
      appState.screenCapture.lastCapturedAt = preview.capturedAt;
    }
  } else {
    appState.screenCapture.preview = null;
  }
}
function setScreenCaptureLoading(isLoading) {
  appState.screenCapture.isLoading = !!isLoading;
}
function setScreenCaptureError(error) {
  appState.screenCapture.lastError = (typeof error === 'string' && error.length > 0) ? error : null;
}
function clearScreenCapturePreview() {
  appState.screenCapture.preview = null;
}
function resetScreenCaptureState() {
  appState.screenCapture.sources = [];
  appState.screenCapture.selectedSourceId = null;
  appState.screenCapture.preview = null;
  appState.screenCapture.isLoading = false;
  appState.screenCapture.lastError = null;
  appState.screenCapture.lastCapturedAt = null;
}
