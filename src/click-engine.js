// Безопасный движок выполнения сценариев ClickFlow
// Имитация кликов без реальных системных действий

const clickEngineState = {
  isRunning: false,
  shouldStop: false,
  currentScenarioId: null,
  currentIteration: 0,
  totalIterations: 0,
  startedAt: null,
  finishedAt: null
};

function getClickEngineState() {
  return { ...clickEngineState };
}

function resetEngineState() {
  clickEngineState.isRunning = false;
  clickEngineState.shouldStop = false;
  clickEngineState.currentScenarioId = null;
  clickEngineState.currentIteration = 0;
  clickEngineState.totalIterations = 0;
  clickEngineState.startedAt = null;
  clickEngineState.finishedAt = null;
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function buildClickActionFromScenario(scenario) {
  return {
    type: "click",
    x: scenario.settings.x,
    y: scenario.settings.y,
    button: scenario.settings.button
  };
}

// Имитация клика — в будущем здесь будет реальный системный вызов
// (Step 17) Тонкая обёртка над action-pipeline. Сохранена для
// обратной совместимости — все вызовы внутри click-engine идут
// через executeAction() в action-pipeline.js, который никогда
// не выполняет реальных кликов.
function simulateClick(action) {
  if (typeof executeAction === 'function') {
    var ctx = (typeof createActionContext === 'function')
      ? createActionContext({ id: clickEngineState.currentScenarioId }, null)
      : { executionMode: 'simulation' };
    return executeAction(action, ctx);
  }
  return {
    ok: true,
    mode: 'simulation',
    simulated: true,
    action: action,
    timestamp: new Date().toISOString()
  };
}

function validateRunnableScenario(scenario, safetySettings) {
  if (!scenario) {
    return { ok: false, message: 'Сценарий не найден' };
  }
  if (scenario.type !== 'simple_click') {
    return { ok: false, message: 'Неподдерживаемый тип сценария' };
  }
  if (!scenario.settings) {
    return { ok: false, message: 'Настройки сценария отсутствуют' };
  }

  const s = scenario.settings;
  if (typeof s.x !== 'number' || s.x < 0) {
    return { ok: false, message: 'Некорректная координата X' };
  }
  if (typeof s.y !== 'number' || s.y < 0) {
    return { ok: false, message: 'Некорректная координата Y' };
  }
  if (typeof s.intervalMs !== 'number' || s.intervalMs < 50) {
    return { ok: false, message: 'Интервал должен быть >= 50 мс' };
  }
  if (typeof s.repeatCount !== 'number' || s.repeatCount < 1 || s.repeatCount > 100000) {
    return { ok: false, message: 'Повторы: от 1 до 100000' };
  }
  const validButtons = ['left', 'right', 'middle'];
  if (!validButtons.includes(s.button)) {
    return { ok: false, message: 'Кнопка мыши: left, right или middle' };
  }

  // Проверка безопасных лимитов
  if (safetySettings && safetySettings.safeMode) {
    if (s.intervalMs < safetySettings.minIntervalMs) {
      return { ok: false, message: `Интервал ниже безопасного минимума (${safetySettings.minIntervalMs} мс)` };
    }
    if (s.repeatCount > safetySettings.maxRepeatCount) {
      return { ok: false, message: `Повторы превышают безопасный максимум (${safetySettings.maxRepeatCount})` };
    }
  }

  return { ok: true };
}

function stopEngine() {
  if (!clickEngineState.isRunning) {
    return false;
  }
  clickEngineState.shouldStop = true;
  return true;
}

async function runScenario(scenario, callbacks, options) {
  const cb = callbacks || {};
  const safetySettings = (options && options.safety) || null;

  // Валидация с учётом безопасных лимитов
  const validation = validateRunnableScenario(scenario, safetySettings);
  if (!validation.ok) {
    if (typeof recordAuditEvent === 'function') {
      recordAuditEvent('safety.validation.failed', {
        scenarioId: scenario && scenario.id,
        reason: validation.message
      });
    }
    if (cb.onError) cb.onError(validation.message);
    return;
  }

  // Защита от повторного запуска
  if (clickEngineState.isRunning) {
    if (cb.onError) cb.onError('Сценарий уже выполняется');
    return;
  }

  // Инициализация состояния движка
  clickEngineState.isRunning = true;
  clickEngineState.shouldStop = false;
  clickEngineState.currentScenarioId = scenario.id;
  clickEngineState.currentIteration = 0;
  clickEngineState.totalIterations = scenario.settings.repeatCount;
  clickEngineState.startedAt = new Date().toISOString();
  clickEngineState.finishedAt = null;

  // Step 17: build a single context for this run.
  // executionMode is forced to "simulation" — no real-action path here.
  const ctx = (typeof createActionContext === 'function')
    ? createActionContext(scenario, options && options.settings)
    : { scenarioId: scenario.id, executionMode: 'simulation' };

  if (cb.onStart) cb.onStart();

  try {
    const total = scenario.settings.repeatCount;

    for (let i = 1; i <= total; i++) {
      if (clickEngineState.shouldStop) {
        if (cb.onStop) cb.onStop();
        return;
      }

      clickEngineState.currentIteration = i;

      const action = buildClickActionFromScenario(scenario);

      // Step 17: every action goes through the central pipeline.
      // The pipeline does the schema check, runs the simulate path,
      // and emits an "action.simulated" audit event. It NEVER
      // performs real OS input.
      if (typeof executeAction === 'function') {
        const result = executeAction(action, ctx);
        if (result && result.ok === false && result.blocked === true) {
          // Defensive: should not happen because ctx.executionMode === 'simulation'.
          if (cb.onError) cb.onError(result.error || 'Real action blocked');
          return;
        }
      } else {
        // Fallback to the legacy simulate path if action-pipeline is missing.
        simulateClick(action);
      }

      if (cb.onAction) cb.onAction(action, i, total);
      if (cb.onProgress) cb.onProgress(i, total);

      if (i < total) {
        await delay(scenario.settings.intervalMs);
      }
    }

    if (cb.onComplete) cb.onComplete();

  } catch (err) {
    if (cb.onError) cb.onError('Ошибка выполнения: ' + err.message);
  } finally {
    clickEngineState.isRunning = false;
    clickEngineState.shouldStop = false;
    clickEngineState.finishedAt = new Date().toISOString();
  }
}
