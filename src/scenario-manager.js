// Менеджер сценариев ClickFlow

const DEFAULT_SCENARIO = {
  id: "basic-clicker",
  name: "Быстрый кликер",
  type: "simple_click",
  description: "Базовый сценарий для кликов по координатам",
  settings: { x: 500, y: 400, intervalMs: 500, repeatCount: 100, button: "left" },
  meta: { createdAt: "2025-01-01T00:00:00.000Z", updatedAt: "2025-01-01T00:00:00.000Z", isDefault: true }
};

let scenarios = [{ ...DEFAULT_SCENARIO }];
let scenariosCorrupted = false; // Step 15: track JSON corruption fallback

async function initScenarios() {
  const result = await window.clickflow.scenarios.load();
  scenariosCorrupted = !!(result && result.corrupted);
  if (result.success && result.data && Array.isArray(result.data)) {
    scenarios = result.data;
    if (!scenarios.some(s => s.id === DEFAULT_SCENARIO.id)) {
      scenarios.unshift({ ...DEFAULT_SCENARIO });
    }
  } else {
    scenarios = [{ ...DEFAULT_SCENARIO }];
  }
}

function getScenariosCorrupted() { return scenariosCorrupted; }
function getScenarios() { return [...scenarios]; }
function getScenarioById(id) { return scenarios.find(s => s.id === id) || null; }
function getDefaultScenario() { return scenarios.find(s => s.id === DEFAULT_SCENARIO.id) || DEFAULT_SCENARIO; }
function createScenarioId() { return 'scenario-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8); }


function createScenario(input) {
  // Step 30: dispatch on `type`. Default is `simple_click` for
  // backward compatibility — old callers don't pass a `type`
  // field and they keep working unchanged.
  var t = (input && typeof input.type === 'string') ? input.type : 'simple_click';
  if (t === 'image_click') return createImageClickScenario(input);
  const validation = validateScenario(input);
  if (!validation.valid) return { success: false, error: validation.error };
  const now = new Date().toISOString();
  const newScenario = {
    id: createScenarioId(),
    name: input.name.trim(),
    type: "simple_click",
    description: (input.description || "").trim(),
    settings: { x: Number(input.x), y: Number(input.y), intervalMs: Number(input.intervalMs), repeatCount: Number(input.repeatCount), button: input.button },
    meta: { createdAt: now, updatedAt: now, isDefault: false }
  };
  scenarios.push(newScenario);
  return { success: true, scenario: newScenario };
}

function updateScenario(id, updates) {
  const index = scenarios.findIndex(s => s.id === id);
  if (index === -1) return { success: false, error: 'Сценарий не найден' };
  // Step 30: route to the image_click branch when either the
  // updates or the existing scenario is an image_click.
  var existingType = scenarios[index] && scenarios[index].type;
  var updatesType = (updates && typeof updates.type === 'string') ? updates.type : existingType;
  if (updatesType === 'image_click' || existingType === 'image_click') {
    return updateImageClickScenario(id, updates);
  }
  const validation = validateScenario(updates);
  if (!validation.valid) return { success: false, error: validation.error };
  const existing = scenarios[index];
  scenarios[index] = {
    ...existing, name: updates.name.trim(), description: (updates.description || "").trim(),
    type: 'simple_click',
    settings: { x: Number(updates.x), y: Number(updates.y), intervalMs: Number(updates.intervalMs), repeatCount: Number(updates.repeatCount), button: updates.button },
    meta: { ...existing.meta, updatedAt: new Date().toISOString() }
  };
  return { success: true, scenario: scenarios[index] };
}

function deleteScenario(id) {
  const scenario = scenarios.find(s => s.id === id);
  if (!scenario) return { success: false, error: 'Сценарий не найден' };
  if (scenario.meta && scenario.meta.isDefault) return { success: false, error: 'Нельзя удалить базовый сценарий' };
  scenarios = scenarios.filter(s => s.id !== id);
  return { success: true };
}

async function saveScenarios() { return await window.clickflow.scenarios.save(scenarios); }
async function loadSavedScenarios() { await initScenarios(); }
async function resetScenarios() {
  const result = await window.clickflow.scenarios.reset();
  if (result.success) scenarios = [{ ...DEFAULT_SCENARIO }];
  return result;
}


function validateScenario(input) {
  if (!input.name || input.name.trim().length === 0) return { valid: false, error: 'Название обязательно' };
  const x = Number(input.x); const y = Number(input.y);
  if (isNaN(x) || x < 0) return { valid: false, error: 'X должен быть числом >= 0' };
  if (isNaN(y) || y < 0) return { valid: false, error: 'Y должен быть числом >= 0' };
  const interval = Number(input.intervalMs);
  if (isNaN(interval) || interval < 50) return { valid: false, error: 'Интервал должен быть >= 50 мс' };
  const repeat = Number(input.repeatCount);
  if (isNaN(repeat) || repeat < 1 || repeat > 100000) return { valid: false, error: 'Повторы: от 1 до 100000' };
  const validButtons = ['left', 'right', 'middle'];
  if (!validButtons.includes(input.button)) return { valid: false, error: 'Кнопка мыши: left, right или middle' };
  return { valid: true };
}

// --- Import/Export (Step 7) ---

function buildExportData(scenariosToExport) {
  return {
    format: "clickflow-scenarios",
    version: 1,
    exportedAt: new Date().toISOString(),
    app: { name: "ClickFlow", version: window.clickflow.version },
    scenarios: scenariosToExport
  };
}

async function exportScenarios(mode, scenarioId) {
  let toExport = [];
  if (mode === 'selected' && scenarioId) {
    const sc = getScenarioById(scenarioId);
    if (sc) toExport = [sc];
  } else if (mode === 'custom') {
    toExport = scenarios.filter(s => !s.meta || !s.meta.isDefault);
  } else {
    toExport = [...scenarios];
  }
  if (toExport.length === 0) return { success: false, error: 'No scenarios to export' };
  const data = buildExportData(toExport);
  const isBackup = mode === 'backup';
  return await window.clickflow.scenarios.export({ mode: isBackup ? 'backup' : mode, data });
}

function normalizeImportedScenario(sc) {
  const existingIds = scenarios.map(s => s.id);
  const existingNames = scenarios.map(s => s.name);
  let newId = sc.id;
  let newName = sc.name;
  if (existingIds.includes(newId)) newId = createScenarioId();
  if (existingNames.includes(newName)) newName = newName + ' (' + t('importedScenarios').split(' ')[0].toLowerCase() + ')';
  return { ...sc, id: newId, name: newName, meta: { ...(sc.meta || {}), isDefault: false, updatedAt: new Date().toISOString() } };
}

function importScenarios(importedScenarios) {
  if (!Array.isArray(importedScenarios)) return { success: false, error: 'Invalid data' };
  let count = 0;
  importedScenarios.forEach(sc => {
    if (!sc.name || !sc.settings) return;
    const normalized = normalizeImportedScenario(sc);
    scenarios.push(normalized);
    count++;
  });
  return { success: true, count };
}


// =====================================================================
// Step 26 — Region Selector Foundation
// ---------------------------------------------------------------------
// Optional `settings.region` on `simple_click` scenarios. When
// present it carries an IMAGE-space rectangle (i.e. coordinates
// relative to the original screenshot, not the displayed preview).
// Old scenarios without `settings.region` keep working unchanged —
// every read is gated by `if (sc.settings.region)` and every write
// goes through these helpers, never directly.
//
// The region is just numbers (x / y / width / height). It NEVER
// carries an `imageDataUrl`, a screenshot, or any pixel data — a
// future image-matching step would have to load pixels separately
// at runtime, by which time it goes through its own safety review.
// =====================================================================

// Pure validation: returns { valid: bool, error: string|null }.
// Spec from the step:
//   - x >= 0, y >= 0
//   - width > 0, height > 0
//   - all four must be finite numbers
function validateRegionSettings(region) {
  if (region === null || region === undefined) return { valid: true, error: null }; // optional
  if (typeof region !== 'object') return { valid: false, error: 'region must be an object' };
  var nx = Number(region.x);
  var ny = Number(region.y);
  var nw = Number(region.width);
  var nh = Number(region.height);
  if (!isFinite(nx) || nx < 0) return { valid: false, error: 'region.x must be a non-negative finite number' };
  if (!isFinite(ny) || ny < 0) return { valid: false, error: 'region.y must be a non-negative finite number' };
  if (!isFinite(nw) || nw <= 0) return { valid: false, error: 'region.width must be a positive finite number' };
  if (!isFinite(nh) || nh <= 0) return { valid: false, error: 'region.height must be a positive finite number' };
  return { valid: true, error: null };
}

// Attach / replace the region on a scenario by id. Updates
// meta.updatedAt. Never touches any other field. Returns
// `{ success: true, scenario }` or `{ success: false, error }`.
function updateScenarioRegion(scenarioId, region) {
  if (typeof scenarioId !== 'string' || scenarioId.length === 0) {
    return { success: false, error: 'scenarioId is required' };
  }
  var index = scenarios.findIndex(function (s) { return s.id === scenarioId; });
  if (index === -1) return { success: false, error: 'Сценарий не найден' };
  var v = validateRegionSettings(region);
  if (!v.valid) return { success: false, error: v.error };
  if (region === null || region === undefined) {
    return { success: false, error: 'region is required' };
  }
  var existing = scenarios[index];
  var existingSettings = existing.settings || {};
  scenarios[index] = {
    ...existing,
    settings: {
      ...existingSettings,
      region: {
        x:      Math.round(Number(region.x)),
        y:      Math.round(Number(region.y)),
        width:  Math.round(Number(region.width)),
        height: Math.round(Number(region.height))
      }
    },
    meta: {
      ...(existing.meta || {}),
      updatedAt: new Date().toISOString()
    }
  };
  return { success: true, scenario: scenarios[index] };
}

// Drop the region from a scenario. Updates meta.updatedAt. Other
// fields are preserved. Returns `{ success: true, scenario }` or
// `{ success: false, error }`.
function clearScenarioRegion(scenarioId) {
  if (typeof scenarioId !== 'string' || scenarioId.length === 0) {
    return { success: false, error: 'scenarioId is required' };
  }
  var index = scenarios.findIndex(function (s) { return s.id === scenarioId; });
  if (index === -1) return { success: false, error: 'Сценарий не найден' };
  var existing = scenarios[index];
  if (!existing.settings || !existing.settings.region) {
    // Idempotent: clearing an already-clear region is a no-op success.
    return { success: true, scenario: existing };
  }
  var newSettings = { ...existing.settings };
  delete newSettings.region;
  scenarios[index] = {
    ...existing,
    settings: newSettings,
    meta: {
      ...(existing.meta || {}),
      updatedAt: new Date().toISOString()
    }
  };
  return { success: true, scenario: scenarios[index] };
}



// =====================================================================
// Step 30 — Image Click Scenario Type
// ---------------------------------------------------------------------
// New scenario type `image_click` that uses a Step-27 template and
// (optionally) a Step-26 region as the click target. The full flow
// (capture preview → match template → simulated click) is wired in
// click-engine.js. Here we only own the data shape and validation.
//
// HARD GUARANTEES (Step 30):
//   - `image_click` scenarios NEVER carry an `imageDataUrl` or any
//     pixel buffer. Only the `templateId`, optional `region`
//     (numbers only), `threshold`, `step`, `timeoutMs`,
//     `intervalMs`, and `repeatCount` are persisted.
//   - The shape is forward-compatible with the planned scenario
//     action-type and the click-engine dispatcher.
//   - simple_click scenarios are unchanged. `validateScenario`
//     keeps its old single-type behaviour for callers that don't
//     pass `type`. Polymorphic dispatch only happens in
//     `createScenario` / `updateScenario`.
// =====================================================================

// Allowed `step` values match the engine UI (1 / 2 / 4 / 8).
var IMAGE_CLICK_ALLOWED_STEPS = [1, 2, 4, 8];

// Validation. Returns { valid: bool, error: string|null }. Mirrors
// `validateScenario`'s contract so the form can render the error
// straight to the user.
function validateImageClickScenario(input) {
  if (!input || typeof input !== 'object') {
    return { valid: false, error: 'Ввод обязателен' };
  }
  if (!input.name || String(input.name).trim().length === 0) {
    return { valid: false, error: 'Название обязательно' };
  }
  if (typeof input.templateId !== 'string' || input.templateId.length === 0) {
    return { valid: false, error: 'Шаблон обязателен' };
  }
  var threshold = Number(input.threshold);
  if (!isFinite(threshold) || threshold < 0 || threshold > 1) {
    return { valid: false, error: 'Порог должен быть числом от 0 до 1' };
  }
  var step = Number(input.step) | 0;
  if (IMAGE_CLICK_ALLOWED_STEPS.indexOf(step) === -1) {
    return { valid: false, error: 'Шаг должен быть 1, 2, 4 или 8' };
  }
  var timeoutMs = Number(input.timeoutMs);
  if (!isFinite(timeoutMs) || timeoutMs < 1000) {
    return { valid: false, error: 'Таймаут должен быть >= 1000 мс' };
  }
  var intervalMs = Number(input.intervalMs);
  if (!isFinite(intervalMs) || intervalMs < 100) {
    return { valid: false, error: 'Интервал должен быть >= 100 мс' };
  }
  var repeatCount = Number(input.repeatCount);
  if (!isFinite(repeatCount) || repeatCount < 1 || repeatCount > 1000) {
    return { valid: false, error: 'Повторы: от 1 до 1000' };
  }
  // Region is optional; if present it must be a valid rectangle.
  if (input.region !== null && input.region !== undefined) {
    var rv = validateRegionSettings(input.region);
    if (!rv.valid) return { valid: false, error: rv.error || 'Неверная область' };
  }
  return { valid: true, error: null };
}

// Build a fresh image_click scenario record. Pure helper — does
// NOT mutate the scenarios array. `createImageClickScenario`
// below takes care of the push + the meta timestamps.
function _buildImageClickScenarioFromInput(input, baseId) {
  var now = new Date().toISOString();
  var region = null;
  if (input.region && typeof input.region === 'object') {
    region = {
      x:      Math.round(Number(input.region.x)),
      y:      Math.round(Number(input.region.y)),
      width:  Math.round(Number(input.region.width)),
      height: Math.round(Number(input.region.height))
    };
  }
  return {
    id:          baseId || createScenarioId(),
    name:        String(input.name).trim(),
    type:        'image_click',
    description: input.description ? String(input.description).trim() : '',
    settings: {
      templateId:  String(input.templateId),
      region:      region,
      threshold:   Math.round(Number(input.threshold) * 100) / 100,
      step:        Number(input.step) | 0,
      timeoutMs:   Number(input.timeoutMs)   | 0,
      intervalMs:  Number(input.intervalMs)  | 0,
      repeatCount: Number(input.repeatCount) | 0
    },
    meta: { createdAt: now, updatedAt: now, isDefault: false }
  };
}

function createImageClickScenario(input) {
  var v = validateImageClickScenario(input);
  if (!v.valid) return { success: false, error: v.error };
  var fresh = _buildImageClickScenarioFromInput(input, null);
  scenarios.push(fresh);
  return { success: true, scenario: fresh };
}

// Update an existing image_click scenario by id. Refuses to flip
// the type from simple_click → image_click without all the new
// fields, and refuses to flip image_click → simple_click without
// `x` / `y` / `button` (the simple_click branch in
// `updateScenario` handles that case).
function updateImageClickScenario(id, updates) {
  if (typeof id !== 'string' || id.length === 0) {
    return { success: false, error: 'scenarioId is required' };
  }
  var index = scenarios.findIndex(function (s) { return s.id === id; });
  if (index === -1) return { success: false, error: 'Сценарий не найден' };
  var v = validateImageClickScenario(updates);
  if (!v.valid) return { success: false, error: v.error };
  var existing = scenarios[index];
  var nextSettings = _buildImageClickScenarioFromInput(updates, existing.id).settings;
  scenarios[index] = {
    ...existing,
    name:        String(updates.name).trim(),
    type:        'image_click',
    description: updates.description ? String(updates.description).trim() : '',
    settings:    nextSettings,
    meta: {
      ...(existing.meta || {}),
      updatedAt: new Date().toISOString()
    }
  };
  return { success: true, scenario: scenarios[index] };
}

// Helper — `getScenariosByType('image_click')` etc. Treats the
// missing-type case as `simple_click` for backward compatibility,
// matching the click-engine's dispatch rule.
function getScenariosByType(type) {
  if (typeof type !== 'string' || type.length === 0) return [];
  return scenarios.filter(function (s) {
    var st = (s && typeof s.type === 'string') ? s.type : 'simple_click';
    return st === type;
  });
}
