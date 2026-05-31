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
  // Step 30: dispatch on type. simple_click keeps its old strict
  // validation; image_click delegates to the scenario-manager
  // helper. Missing `type` is treated as simple_click for
  // backward compatibility.
  var t = (scenario.type === 'image_click') ? 'image_click' : 'simple_click';
  if (t === 'image_click') {
    if (typeof validateImageClickScenario === 'function') {
      var v = validateImageClickScenario({
        name:        scenario.name,
        description: scenario.description,
        templateId:  scenario.settings && scenario.settings.templateId,
        region:      scenario.settings && scenario.settings.region,
        threshold:   scenario.settings && scenario.settings.threshold,
        step:        scenario.settings && scenario.settings.step,
        timeoutMs:   scenario.settings && scenario.settings.timeoutMs,
        intervalMs:  scenario.settings && scenario.settings.intervalMs,
        repeatCount: scenario.settings && scenario.settings.repeatCount
      });
      if (!v.valid) return { ok: false, message: v.error || 'Сценарий image_click невалиден' };
    }
    // Safety bounds for image_click. We still respect the
    // user-configured min interval / max repeats so the safety
    // section in Settings keeps applying.
    var icSettings = scenario.settings;
    if (safetySettings && safetySettings.safeMode) {
      if (icSettings.intervalMs < safetySettings.minIntervalMs) {
        return { ok: false, message: 'Интервал ниже безопасного минимума (' + safetySettings.minIntervalMs + ' мс)' };
      }
      if (icSettings.repeatCount > safetySettings.maxRepeatCount) {
        return { ok: false, message: 'Повторы превышают безопасный максимум (' + safetySettings.maxRepeatCount + ')' };
      }
    }
    return { ok: true };
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

  // Step 30: dispatch on scenario type. The simple_click flow is
  // unchanged. The image_click flow lives in
  // `runImageClickScenario` and uses the renderer's screen-capture
  // preview + the renderer's template-matching engine, but never
  // executes a real click.
  if (scenario.type === 'image_click') {
    return runImageClickScenario(scenario, cb, options);
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



// =====================================================================
// Step 30 — image_click execution path (simulation only)
// ---------------------------------------------------------------------
// Runs an `image_click` scenario:
//   1. Validate prerequisites (template exists, preview exists,
//      imageDataUrl in memory, engine present).
//   2. For each iteration: real-preview match (Step 29 engine) →
//      simulated `image_click` action via the action-pipeline.
//   3. NEVER moves the cursor, NEVER clicks, NEVER OCR's anything.
//   4. Honors `stopEngine()`, `safetySettings.minIntervalMs` and
//      `safetySettings.maxRepeatCount`, and updates `progress`.
//
// Dependencies are pulled from renderer globals when available,
// or accepted via `options.deps` for tests:
//   options.deps = {
//     getScreenPreview, getTemplateById, runTemplateMatch,
//     createTemplateMatchInput, validateTemplateMatchInput
//   }
// =====================================================================

function _getImageClickDeps(options) {
  var deps = (options && options.deps) || {};
  // Each fallback is tested with `typeof X === 'function'` so a
  // missing module never throws here — runImageClickScenario will
  // surface a friendly error instead.
  if (!deps.getScreenPreview && typeof getState === 'function') {
    deps.getScreenPreview = function () {
      var st = getState();
      return st && st.screenCapture ? st.screenCapture.preview : null;
    };
  }
  if (!deps.getTemplateById && typeof getTemplateById === 'function') {
    deps.getTemplateById = getTemplateById;
  }
  if (!deps.runTemplateMatch && typeof runTemplateMatch === 'function') {
    deps.runTemplateMatch = runTemplateMatch;
  }
  if (!deps.createTemplateMatchInput && typeof createTemplateMatchInput === 'function') {
    deps.createTemplateMatchInput = createTemplateMatchInput;
  }
  return deps;
}

async function runImageClickScenario(scenario, callbacks, options) {
  var cb = callbacks || {};
  var deps = _getImageClickDeps(options);

  // Already-running guard. Same shape as the simple_click branch.
  if (clickEngineState.isRunning) {
    if (cb.onError) cb.onError('Сценарий уже выполняется');
    return;
  }

  // Initialise engine state up-front so onStop / stopEngine work
  // even if we exit through the prerequisite-check branch below.
  clickEngineState.isRunning = true;
  clickEngineState.shouldStop = false;
  clickEngineState.currentScenarioId = scenario.id;
  clickEngineState.currentIteration = 0;
  clickEngineState.totalIterations = scenario.settings.repeatCount;
  clickEngineState.startedAt = new Date().toISOString();
  clickEngineState.finishedAt = null;

  if (typeof recordAuditEvent === 'function') {
    recordAuditEvent('scenario.imageClick.started', {
      scenarioId: scenario.id,
      templateId: scenario.settings.templateId,
      threshold:  scenario.settings.threshold,
      step:       scenario.settings.step,
      timeoutMs:  scenario.settings.timeoutMs,
      hasRegion:  !!scenario.settings.region,
      realClick:  false,
      ocrUsed:    false
    });
  }

  if (cb.onStart) cb.onStart();

  // Build a single context for this run. executionMode is forced
  // to 'simulation' — the action-pipeline blocks anything else.
  var ctx = (typeof createActionContext === 'function')
    ? createActionContext(scenario, options && options.settings)
    : { scenarioId: scenario.id, executionMode: 'simulation' };

  function _failOut(reason, friendly) {
    clickEngineState.isRunning = false;
    clickEngineState.shouldStop = false;
    clickEngineState.finishedAt = new Date().toISOString();
    if (typeof recordAuditEvent === 'function') {
      recordAuditEvent('scenario.imageClick.failed', {
        scenarioId: scenario.id,
        reason: reason
      });
    }
    if (cb.onError) cb.onError(friendly || reason);
  }

  // 1. Engine + template-manager dependencies must be present.
  if (typeof deps.runTemplateMatch !== 'function') {
    return _failOut('engine-unavailable', 'Template matching engine unavailable');
  }
  if (typeof deps.getTemplateById !== 'function') {
    return _failOut('templates-unavailable', 'Template manager unavailable');
  }

  // 2. Active template must exist and carry pixel data
  //    (previewDataUrl). We never read pixel data from disk here
  //    — the data URL was materialised in memory by templates:load.
  var template = deps.getTemplateById(scenario.settings.templateId);
  if (!template) {
    return _failOut('missing-template', 'Шаблон не найден. Импортируйте шаблон.');
  }
  if (typeof template.previewDataUrl !== 'string' || template.previewDataUrl.indexOf('data:image/') !== 0) {
    return _failOut('missing-template-image', 'Изображение шаблона недоступно.');
  }

  // 3. Screen preview must exist with an imageDataUrl in memory.
  var preview = (typeof deps.getScreenPreview === 'function') ? deps.getScreenPreview() : null;
  if (!preview || typeof preview.imageDataUrl !== 'string' || preview.imageDataUrl.indexOf('data:image/') !== 0) {
    return _failOut('missing-preview', 'Сначала получите screenshot preview.');
  }

  var total = scenario.settings.repeatCount | 0;

  try {
    for (var i = 1; i <= total; i++) {
      if (clickEngineState.shouldStop) {
        if (typeof recordAuditEvent === 'function') {
          recordAuditEvent('scenario.imageClick.stopped', { scenarioId: scenario.id });
        }
        if (cb.onStop) cb.onStop();
        clickEngineState.isRunning = false;
        clickEngineState.shouldStop = false;
        clickEngineState.finishedAt = new Date().toISOString();
        return;
      }

      clickEngineState.currentIteration = i;

      if (typeof recordAuditEvent === 'function') {
        recordAuditEvent('scenario.imageClick.match.started', {
          scenarioId: scenario.id, iteration: i, total: total
        });
      }

      // 4. Run the matcher (Step 29). The engine analyses the
      //    captured preview image — never the live screen.
      var match;
      try {
        match = await deps.runTemplateMatch(preview.imageDataUrl, template.previewDataUrl, {
          region:          scenario.settings.region || null,
          threshold:       scenario.settings.threshold,
          step:            scenario.settings.step,
          screenSize:      { width: preview.width || 0, height: preview.height || 0 }
        });
      } catch (err) {
        return _failOut('engine-exception', 'Ошибка движка: ' + (err && err.message ? err.message : 'unknown'));
      }

      if (!match || match.success !== true || !match.match) {
        return _failOut(match && match.error ? match.error : 'engine-failed',
          'Не удалось выполнить поиск шаблона.');
      }

      var m = match.match;
      var threshold = scenario.settings.threshold;
      var matched = (typeof m.score === 'number') && (m.score >= threshold);

      if (typeof recordAuditEvent === 'function') {
        recordAuditEvent('scenario.imageClick.match.completed', {
          scenarioId: scenario.id, iteration: i, total: total,
          confidence: m.score, threshold: threshold,
          targetX: m.x + Math.round(m.width / 2),
          targetY: m.y + Math.round(m.height / 2),
          durationMs: m.durationMs || 0,
          usedRegion: !!m.regionUsed,
          matched: matched
        });
      }

      if (!matched) {
        if (typeof recordAuditEvent === 'function') {
          recordAuditEvent('scenario.imageClick.noMatch', {
            scenarioId: scenario.id, iteration: i, total: total,
            confidence: m.score, threshold: threshold
          });
        }
        // Surface as an action with status no_match so the
        // renderer's onAction callback can render a clear message.
        var noMatchAction = {
          type:        'image_click',
          status:      'no_match',
          templateId:  scenario.settings.templateId,
          confidence:  m.score,
          threshold:   threshold,
          realClick:   false,
          simulated:   true
        };
        if (cb.onAction) cb.onAction(noMatchAction, i, total);
        if (cb.onProgress) cb.onProgress(i, total);
        if (i < total) await delay(scenario.settings.intervalMs);
        continue;
      }

      // 5. Build the simulated `image_click` action and route it
      //    through the action-pipeline. The pipeline will block
      //    any caller that asks for `executionMode: 'real'` and
      //    will refuse `realClick: true` on image_click outright.
      var targetX = m.x + Math.round(m.width / 2);
      var targetY = m.y + Math.round(m.height / 2);
      var action = {
        type:        'image_click',
        templateId:  scenario.settings.templateId,
        targetPoint: { x: targetX, y: targetY },
        boundingBox: { x: m.x | 0, y: m.y | 0, width: m.width | 0, height: m.height | 0 },
        confidence:  m.score,
        realClick:   false,
        simulated:   true
      };

      if (typeof executeAction === 'function') {
        var result = executeAction(action, ctx);
        if (result && result.ok === false && result.blocked === true) {
          return _failOut('blocked-by-pipeline', result.error || 'Action blocked');
        }
      }

      if (typeof recordAuditEvent === 'function') {
        recordAuditEvent('scenario.imageClick.simulated', {
          scenarioId: scenario.id, iteration: i, total: total,
          templateId: scenario.settings.templateId,
          confidence: m.score, targetX: targetX, targetY: targetY,
          realClick: false
        });
      }

      if (cb.onAction) cb.onAction(action, i, total);
      if (cb.onProgress) cb.onProgress(i, total);

      if (i < total) await delay(scenario.settings.intervalMs);
    }

    if (cb.onComplete) cb.onComplete();
  } catch (err) {
    return _failOut('exception', 'Ошибка выполнения: ' + (err && err.message ? err.message : 'unknown'));
  } finally {
    clickEngineState.isRunning = false;
    clickEngineState.shouldStop = false;
    clickEngineState.finishedAt = new Date().toISOString();
  }
}
