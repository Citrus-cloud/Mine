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
  // Step 26 — Region Selector Foundation. Renderer-side memory only.
  // `region` is in PREVIEW pixel space; `normalizedRegion` is the
  // same rectangle re-projected onto the original screenshot
  // (image-space). previewSize / imageSize accompany them so a
  // future image-matching step can re-use the projection without
  // re-deriving anything. Nothing here is persisted to disk
  // automatically — only the explicit "Attach to scenario" action
  // saves an image-space region into the active scenario.
  regionSelector: {
    selectedRegion: null,
    normalizedRegion: null,
    isSelecting: false,
    previewSize: null,
    imageSize: null,
    lastUpdatedAt: null,
    lastError: null
  },
  // Step 27 — Template Asset Manager. Renderer-side memory only.
  // `items` is a list of metadata records returned by the main-process
  // IPC `templates:load`. `previewDataUrl` lives only inside each
  // item and is never written back to settings / scenarios /
  // profiles. We do NOT persist this slice — the source of truth is
  // templates.json owned by the main process.
  templates: {
    items: [],
    activeTemplateId: null,
    isLoading: false,
    lastError: null
  },
  // Step 28 — Template Matching Mock / Dry-run. Renderer-side
  // memory only. `lastInput` carries plain-data references to the
  // current preview (sourceId / size only — never imageDataUrl)
  // and active template (id / name / size only — never
  // previewDataUrl). `lastResult` is a mock match record produced
  // by `runMockTemplateMatch` in `template-matching-mock.js` —
  // numbers and ids only, no pixel buffers. Nothing here ever
  // crosses an IPC boundary or hits the disk.
  templateMatching: {
    lastInput: null,
    lastResult: null,
    isRunning: false,
    lastError: null,
    lastRunAt: null,
    // Step 29 — match mode + algorithm tuning. `mode` is one of
    // `"mock"` (Step 28 deterministic mock) or `"real-preview"`
    // (Step 29 plain-JS engine analysing the captured preview
    // image only — never the live screen, never a real click).
    mode: 'mock',
    threshold: 0.75,
    step: 4
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
    regionSelector: {
      selectedRegion:   appState.regionSelector.selectedRegion   ? { ...appState.regionSelector.selectedRegion }   : null,
      normalizedRegion: appState.regionSelector.normalizedRegion ? { ...appState.regionSelector.normalizedRegion } : null,
      isSelecting:      appState.regionSelector.isSelecting,
      previewSize:      appState.regionSelector.previewSize ? { ...appState.regionSelector.previewSize } : null,
      imageSize:        appState.regionSelector.imageSize   ? { ...appState.regionSelector.imageSize }   : null,
      lastUpdatedAt:    appState.regionSelector.lastUpdatedAt,
      lastError:        appState.regionSelector.lastError
    },
    templates: {
      items:            appState.templates.items.map(function (it) { return it ? { ...it } : it; }),
      activeTemplateId: appState.templates.activeTemplateId,
      isLoading:        appState.templates.isLoading,
      lastError:        appState.templates.lastError
    },
    templateMatching: {
      lastInput:  appState.templateMatching.lastInput  ? _cloneTemplateMatchInput(appState.templateMatching.lastInput)   : null,
      lastResult: appState.templateMatching.lastResult ? _cloneTemplateMatchResult(appState.templateMatching.lastResult) : null,
      isRunning:  appState.templateMatching.isRunning,
      lastError:  appState.templateMatching.lastError,
      lastRunAt:  appState.templateMatching.lastRunAt,
      mode:       appState.templateMatching.mode,
      threshold:  appState.templateMatching.threshold,
      step:       appState.templateMatching.step
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


// --- Step 26: Region selector state (renderer memory only) ---
// All eight mutators accept loose / null inputs and never throw;
// invalid values collapse to safe defaults. The renderer is the
// only writer, and it goes through these helpers (never touching
// appState.regionSelector directly) so we keep the slice serialisable.
function setRegionSelecting(isSelecting) {
  appState.regionSelector.isSelecting = !!isSelecting;
}
function setSelectedRegion(region) {
  if (region && typeof region === 'object') {
    appState.regionSelector.selectedRegion = {
      x:      Number(region.x)      || 0,
      y:      Number(region.y)      || 0,
      width:  Number(region.width)  || 0,
      height: Number(region.height) || 0
    };
    appState.regionSelector.lastUpdatedAt = new Date().toISOString();
  } else {
    appState.regionSelector.selectedRegion = null;
  }
}
function setNormalizedRegion(region) {
  if (region && typeof region === 'object') {
    appState.regionSelector.normalizedRegion = {
      x:      Number(region.x)      || 0,
      y:      Number(region.y)      || 0,
      width:  Number(region.width)  || 0,
      height: Number(region.height) || 0
    };
  } else {
    appState.regionSelector.normalizedRegion = null;
  }
}
function setRegionPreviewSize(size) {
  if (size && typeof size === 'object' &&
      Number(size.width)  > 0 &&
      Number(size.height) > 0) {
    appState.regionSelector.previewSize = {
      width:  Math.round(Number(size.width)),
      height: Math.round(Number(size.height))
    };
  } else {
    appState.regionSelector.previewSize = null;
  }
}
function setRegionImageSize(size) {
  if (size && typeof size === 'object' &&
      Number(size.width)  > 0 &&
      Number(size.height) > 0) {
    appState.regionSelector.imageSize = {
      width:  Math.round(Number(size.width)),
      height: Math.round(Number(size.height))
    };
  } else {
    appState.regionSelector.imageSize = null;
  }
}
function setRegionError(error) {
  appState.regionSelector.lastError = (typeof error === 'string' && error.length > 0) ? error : null;
}
function clearSelectedRegion() {
  appState.regionSelector.selectedRegion = null;
  appState.regionSelector.normalizedRegion = null;
  appState.regionSelector.lastUpdatedAt = new Date().toISOString();
  appState.regionSelector.lastError = null;
}
function resetRegionSelectorState() {
  appState.regionSelector.selectedRegion = null;
  appState.regionSelector.normalizedRegion = null;
  appState.regionSelector.isSelecting = false;
  appState.regionSelector.previewSize = null;
  appState.regionSelector.imageSize = null;
  appState.regionSelector.lastUpdatedAt = null;
  appState.regionSelector.lastError = null;
}



// --- Step 27: Template asset state (renderer memory only) ---
// All mutators accept loose / null inputs and never throw; invalid
// values collapse to safe defaults. The renderer is the only writer
// and it goes through these helpers (it never touches
// appState.templates directly) so the slice stays serialisable.
//
// Note: previewDataUrl is allowed inside individual `items`, but
// nothing here ever writes the slice to disk. The source of truth
// for templates is templates.json, owned by the main process.
function setTemplates(items) {
  appState.templates.items = Array.isArray(items)
    ? items.map(function (it) { return (it && typeof it === 'object') ? { ...it } : null; }).filter(Boolean)
    : [];
}
function setActiveTemplateId(id) {
  appState.templates.activeTemplateId = (typeof id === 'string' && id.length > 0) ? id : null;
}
function setTemplatesLoading(isLoading) {
  appState.templates.isLoading = !!isLoading;
}
function setTemplatesError(error) {
  appState.templates.lastError = (typeof error === 'string' && error.length > 0) ? error : null;
}
function resetTemplatesState() {
  appState.templates.items = [];
  appState.templates.activeTemplateId = null;
  appState.templates.isLoading = false;
  appState.templates.lastError = null;
}



// --- Step 28: Template matching mock / dry-run state (renderer memory only) ---
// All mutators accept loose / null inputs and never throw; invalid
// values collapse to safe defaults. The renderer is the only writer
// and it goes through these helpers (it never touches
// appState.templateMatching directly) so the slice stays
// serialisable.
//
// IMPORTANT: nothing in this slice ever holds a screenshot, a
// thumbnail, or any pixel buffer. The shapes that are accepted
// here are limited to plain-data metadata. If a buggy caller
// passes an `imageDataUrl` field we strip it via the cloning
// helpers below so the slice stays clean.
function setTemplateMatchingInput(input) {
  if (input && typeof input === 'object') {
    appState.templateMatching.lastInput = _cloneTemplateMatchInput(input);
  } else {
    appState.templateMatching.lastInput = null;
  }
}
function setTemplateMatchingResult(result) {
  if (result && typeof result === 'object') {
    appState.templateMatching.lastResult = _cloneTemplateMatchResult(result);
    if (typeof result.createdAt === 'string') {
      appState.templateMatching.lastRunAt = result.createdAt;
    } else {
      appState.templateMatching.lastRunAt = new Date().toISOString();
    }
  } else {
    appState.templateMatching.lastResult = null;
  }
}
function setTemplateMatchingRunning(isRunning) {
  appState.templateMatching.isRunning = !!isRunning;
}
function setTemplateMatchingError(error) {
  appState.templateMatching.lastError = (typeof error === 'string' && error.length > 0) ? error : null;
}
function clearTemplateMatchingResult() {
  appState.templateMatching.lastResult = null;
  appState.templateMatching.lastError  = null;
}
function resetTemplateMatchingState() {
  appState.templateMatching.lastInput  = null;
  appState.templateMatching.lastResult = null;
  appState.templateMatching.isRunning  = false;
  appState.templateMatching.lastError  = null;
  appState.templateMatching.lastRunAt  = null;
}

// Step 29 — match mode + algorithm tuning. The setters validate
// the inputs and silently ignore unknown values so the slice
// always holds a sane combination. `mode` is the only field the
// engine cares about; `threshold` and `step` are passed straight
// through to `runTemplateMatch`. Neither setter triggers any I/O
// and neither setter persists anything to disk.
function setTemplateMatchingMode(mode) {
  if (mode === 'mock' || mode === 'real-preview') {
    appState.templateMatching.mode = mode;
  }
}
function setTemplateMatchingThreshold(value) {
  var v = Number(value);
  if (typeof v === 'number' && isFinite(v)) {
    if (v < 0) v = 0;
    if (v > 1) v = 1;
    appState.templateMatching.threshold = Math.round(v * 100) / 100;
  }
}
function setTemplateMatchingStep(value) {
  var v = Number(value) | 0;
  if (v >= 1 && v <= 32) {
    appState.templateMatching.step = v;
  }
}

// in depth — the matching mock already drops `imageDataUrl` /
// `previewDataUrl`, but if a buggy caller passes them we never let
// them reach the slice or the diagnostics output.
function _cloneTemplateMatchInput(input) {
  if (!input || typeof input !== 'object') return null;
  var out = {};
  if (input.screenPreview && typeof input.screenPreview === 'object') {
    out.screenPreview = {
      sourceId:   typeof input.screenPreview.sourceId === 'string' ? input.screenPreview.sourceId : '',
      name:       typeof input.screenPreview.name === 'string' ? input.screenPreview.name : '',
      type:       typeof input.screenPreview.type === 'string' ? input.screenPreview.type : 'screen',
      width:      Number(input.screenPreview.width)  || 0,
      height:     Number(input.screenPreview.height) || 0,
      capturedAt: typeof input.screenPreview.capturedAt === 'string' ? input.screenPreview.capturedAt : ''
    };
  } else {
    out.screenPreview = null;
  }
  if (input.template && typeof input.template === 'object') {
    out.template = {
      id:     typeof input.template.id === 'string' ? input.template.id : '',
      name:   typeof input.template.name === 'string' ? input.template.name : '',
      width:  Number(input.template.width)  || 0,
      height: Number(input.template.height) || 0
    };
  } else {
    out.template = null;
  }
  if (input.region && typeof input.region === 'object') {
    out.region = {
      x:      Number(input.region.x)      || 0,
      y:      Number(input.region.y)      || 0,
      width:  Number(input.region.width)  || 0,
      height: Number(input.region.height) || 0
    };
  } else {
    out.region = null;
  }
  return out;
}

function _cloneTemplateMatchResult(result) {
  if (!result || typeof result !== 'object') return null;
  return {
    id:           typeof result.id === 'string' ? result.id : '',
    mode:         typeof result.mode === 'string' ? result.mode : 'mock',
    matched:      !!result.matched,
    confidence:   typeof result.confidence === 'number' ? result.confidence : 0,
    // Step 29 — both shapes (mock and real-preview) may carry these.
    // We pass the optional fields through unchanged so the renderer
    // can show step / pixelStep / durationMs etc.
    threshold:        typeof result.threshold === 'number' ? result.threshold : null,
    durationMs:       typeof result.durationMs === 'number' ? result.durationMs : null,
    step:             typeof result.step === 'number' ? result.step : null,
    requestedStep:    typeof result.requestedStep === 'number' ? result.requestedStep : null,
    pixelStep:        typeof result.pixelStep === 'number' ? result.pixelStep : null,
    scannedPositions: typeof result.scannedPositions === 'number' ? result.scannedPositions : null,
    downscaledSearch:   typeof result.downscaledSearch === 'boolean' ? result.downscaledSearch : null,
    downscaledTemplate: typeof result.downscaledTemplate === 'boolean' ? result.downscaledTemplate : null,
    boundingBox:  result.boundingBox ? { ...result.boundingBox } : null,
    targetPoint:  result.targetPoint ? { ...result.targetPoint } : null,
    usedRegion:   result.usedRegion  ? { ...result.usedRegion }  : null,
    templateId:   typeof result.templateId === 'string' ? result.templateId : '',
    templateName: typeof result.templateName === 'string' ? result.templateName : '',
    sourceId:     typeof result.sourceId === 'string' ? result.sourceId : '',
    sourceName:   typeof result.sourceName === 'string' ? result.sourceName : '',
    previewSize:  result.previewSize ? { ...result.previewSize } : null,
    createdAt:    typeof result.createdAt === 'string' ? result.createdAt : '',
    realMatching: false,
    realClick:    false
  };
}
