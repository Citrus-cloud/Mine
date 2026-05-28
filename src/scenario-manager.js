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
  const validation = validateScenario(updates);
  if (!validation.valid) return { success: false, error: validation.error };
  const existing = scenarios[index];
  scenarios[index] = {
    ...existing, name: updates.name.trim(), description: (updates.description || "").trim(),
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
