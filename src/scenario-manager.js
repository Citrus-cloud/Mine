// Менеджер сценариев ClickFlow

const DEFAULT_SCENARIO = {
  id: "basic-clicker",
  name: "Быстрый кликер",
  type: "simple_click",
  description: "Базовый сценарий для кликов по координатам",
  settings: {
    x: 500,
    y: 400,
    intervalMs: 500,
    repeatCount: 100,
    button: "left"
  },
  meta: {
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
    isDefault: true
  }
};

let scenarios = [{ ...DEFAULT_SCENARIO }];

// --- Инициализация ---

async function initScenarios() {
  const result = await window.clickflow.scenarios.load();
  if (result.success && result.data && Array.isArray(result.data)) {
    scenarios = result.data;
    // Гарантировать наличие базового сценария
    const hasDefault = scenarios.some(s => s.id === DEFAULT_SCENARIO.id);
    if (!hasDefault) {
      scenarios.unshift({ ...DEFAULT_SCENARIO });
    }
  } else {
    scenarios = [{ ...DEFAULT_SCENARIO }];
  }
}

// --- Чтение ---

function getScenarios() {
  return [...scenarios];
}

function getScenarioById(id) {
  return scenarios.find(s => s.id === id) || null;
}

function getDefaultScenario() {
  return scenarios.find(s => s.id === DEFAULT_SCENARIO.id) || DEFAULT_SCENARIO;
}

// --- Создание ---

function createScenarioId() {
  return 'scenario-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8);
}

function createScenario(input) {
  const validation = validateScenario(input);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  const now = new Date().toISOString();
  const newScenario = {
    id: createScenarioId(),
    name: input.name.trim(),
    type: "simple_click",
    description: (input.description || "").trim(),
    settings: {
      x: Number(input.x),
      y: Number(input.y),
      intervalMs: Number(input.intervalMs),
      repeatCount: Number(input.repeatCount),
      button: input.button
    },
    meta: {
      createdAt: now,
      updatedAt: now,
      isDefault: false
    }
  };

  scenarios.push(newScenario);
  return { success: true, scenario: newScenario };
}

// --- Редактирование ---

function updateScenario(id, updates) {
  const index = scenarios.findIndex(s => s.id === id);
  if (index === -1) {
    return { success: false, error: 'Сценарий не найден' };
  }

  const validation = validateScenario(updates);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  const existing = scenarios[index];
  scenarios[index] = {
    ...existing,
    name: updates.name.trim(),
    description: (updates.description || "").trim(),
    settings: {
      x: Number(updates.x),
      y: Number(updates.y),
      intervalMs: Number(updates.intervalMs),
      repeatCount: Number(updates.repeatCount),
      button: updates.button
    },
    meta: {
      ...existing.meta,
      updatedAt: new Date().toISOString()
    }
  };

  return { success: true, scenario: scenarios[index] };
}

// --- Удаление ---

function deleteScenario(id) {
  const scenario = scenarios.find(s => s.id === id);
  if (!scenario) {
    return { success: false, error: 'Сценарий не найден' };
  }
  if (scenario.meta && scenario.meta.isDefault) {
    return { success: false, error: 'Нельзя удалить базовый сценарий' };
  }

  scenarios = scenarios.filter(s => s.id !== id);
  return { success: true };
}

// --- Сохранение / сброс ---

async function saveScenarios() {
  return await window.clickflow.scenarios.save(scenarios);
}

async function loadSavedScenarios() {
  await initScenarios();
}

async function resetScenarios() {
  const result = await window.clickflow.scenarios.reset();
  if (result.success) {
    scenarios = [{ ...DEFAULT_SCENARIO }];
  }
  return result;
}

// --- Валидация ---

function validateScenario(input) {
  if (!input.name || input.name.trim().length === 0) {
    return { valid: false, error: 'Название обязательно' };
  }

  const x = Number(input.x);
  const y = Number(input.y);
  if (isNaN(x) || x < 0) {
    return { valid: false, error: 'X должен быть числом >= 0' };
  }
  if (isNaN(y) || y < 0) {
    return { valid: false, error: 'Y должен быть числом >= 0' };
  }

  const interval = Number(input.intervalMs);
  if (isNaN(interval) || interval < 50) {
    return { valid: false, error: 'Интервал должен быть >= 50 мс' };
  }

  const repeat = Number(input.repeatCount);
  if (isNaN(repeat) || repeat < 1 || repeat > 100000) {
    return { valid: false, error: 'Повторы: от 1 до 100000' };
  }

  const validButtons = ['left', 'right', 'middle'];
  if (!validButtons.includes(input.button)) {
    return { valid: false, error: 'Кнопка мыши: left, right или middle' };
  }

  return { valid: true };
}
