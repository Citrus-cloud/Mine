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
  // Step 33: text_click joins the dispatcher.
  var t;
  if (scenario.type === 'image_click')      t = 'image_click';
  else if (scenario.type === 'text_click')  t = 'text_click';
  else                                       t = 'simple_click';
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
  if (t === 'text_click') {
    if (typeof validateTextClickScenario === 'function') {
      var tv = validateTextClickScenario({
        name:          scenario.name,
        description:   scenario.description,
        targetText:    scenario.settings && scenario.settings.targetText,
        language:      scenario.settings && scenario.settings.language,
        matchMode:     scenario.settings && scenario.settings.matchMode,
        caseSensitive: scenario.settings && scenario.settings.caseSensitive,
        region:        scenario.settings && scenario.settings.region,
        timeoutMs:     scenario.settings && scenario.settings.timeoutMs,
        intervalMs:    scenario.settings && scenario.settings.intervalMs,
        repeatCount:   scenario.settings && scenario.settings.repeatCount
      });
      if (!tv.valid) return { ok: false, message: tv.error || 'Сценарий text_click невалиден' };
    }
    // Safety bounds (user-configurable safe-mode floors / ceilings).
    var tcSettings = scenario.settings;
    if (safetySettings && safetySettings.safeMode) {
      if (tcSettings.intervalMs < safetySettings.minIntervalMs) {
        return { ok: false, message: 'Интервал ниже безопасного минимума (' + safetySettings.minIntervalMs + ' мс)' };
      }
      if (tcSettings.repeatCount > safetySettings.maxRepeatCount) {
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
  // Step 33: text_click flow lives in `runTextClickScenario` and
  // uses the Step-32 mock OCR engine. Mock only — no real OCR,
  // no real click.
  if (scenario.type === 'image_click') {
    return runImageClickScenario(scenario, cb, options);
  }
  if (scenario.type === 'text_click') {
    return runTextClickScenario(scenario, cb, options);
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




// =====================================================================
// Step 33 — text_click execution path (simulation only)
// ---------------------------------------------------------------------
// Runs a `text_click` scenario:
//   1. Validate prerequisites (target text present, preview exists,
//      mock OCR engine available).
//   2. For each iteration:
//        a. Build OCR input via createOcrInput().
//        b. Run the Step-32 mock OCR engine via runMockOcr().
//        c. Search recognised blocks for the target text.
//        d. If found → simulated `text_click` action via the
//           action-pipeline.
//        e. If not found → onAction with status: 'no_match'.
//   3. NEVER moves the cursor, NEVER clicks, NEVER does real OCR.
//   4. Honors `stopEngine()`, `safetySettings.minIntervalMs`,
//      `safetySettings.maxRepeatCount`, and updates `progress`.
//
// Dependencies are pulled from renderer globals when available, or
// accepted via `options.deps` for tests:
//   options.deps = {
//     getScreenPreview, createOcrInput, runMockOcr,
//     findTextInOcrBlocks, createTextClickActionPreview
//   }
// =====================================================================

function _getTextClickDeps(options) {
  var deps = (options && options.deps) || {};
  if (!deps.getScreenPreview && typeof getState === 'function') {
    deps.getScreenPreview = function () {
      var st = getState();
      return st && st.screenCapture ? st.screenCapture.preview : null;
    };
  }
  if (!deps.createOcrInput && typeof createOcrInput === 'function') {
    deps.createOcrInput = createOcrInput;
  }
  if (!deps.runMockOcr && typeof runMockOcr === 'function') {
    deps.runMockOcr = runMockOcr;
  }
  if (!deps.findTextInOcrBlocks && typeof findTextInOcrBlocks === 'function') {
    deps.findTextInOcrBlocks = findTextInOcrBlocks;
  }
  if (!deps.createTextClickActionPreview && typeof createTextClickActionPreview === 'function') {
    deps.createTextClickActionPreview = createTextClickActionPreview;
  }
  return deps;
}

async function runTextClickScenario(scenario, callbacks, options) {
  var cb = callbacks || {};
  var deps = _getTextClickDeps(options);

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
    // Payload carries only short metadata. NEVER the full target
    // text, NEVER an imageDataUrl, NEVER a screenshot.
    var s0 = scenario.settings || {};
    recordAuditEvent('scenario.textClick.started', {
      scenarioId:  scenario.id,
      language:    s0.language || null,
      matchMode:   s0.matchMode || null,
      caseSensitive: !!s0.caseSensitive,
      hasRegion:   !!s0.region,
      timeoutMs:   s0.timeoutMs | 0,
      targetTextLen: typeof s0.targetText === 'string' ? s0.targetText.length : 0,
      realClick:   false,
      realOcr:     false
    });
  }

  if (cb.onStart) cb.onStart();

  var ctx = (typeof createActionContext === 'function')
    ? createActionContext(scenario, options && options.settings)
    : { scenarioId: scenario.id, executionMode: 'simulation' };

  function _failOut(reason, friendly) {
    clickEngineState.isRunning = false;
    clickEngineState.shouldStop = false;
    clickEngineState.finishedAt = new Date().toISOString();
    if (typeof recordAuditEvent === 'function') {
      recordAuditEvent('scenario.textClick.failed', {
        scenarioId: scenario.id,
        reason:     reason
      });
    }
    if (cb.onError) cb.onError(friendly || reason);
  }

  // 1. Mock OCR engine + helpers must be present.
  if (typeof deps.runMockOcr !== 'function') {
    return _failOut('mock-ocr-unavailable', 'Mock OCR engine unavailable');
  }
  if (typeof deps.createOcrInput !== 'function') {
    return _failOut('mock-ocr-unavailable', 'Mock OCR engine unavailable');
  }

  // 2. Target text must be a non-empty string.
  var sSettings = scenario.settings || {};
  var targetText = typeof sSettings.targetText === 'string' ? sSettings.targetText.trim() : '';
  if (targetText.length === 0) {
    return _failOut('missing-target-text', 'Введите целевой текст.');
  }

  // Step 41 — pick the OCR provider for this scenario. Default
  // mock so existing scenarios keep working unchanged. If the
  // scenario asks for `tesseract`, we still re-check the runtime
  // feature flags below; without the runtime opt-in we refuse
  // before any iteration runs.
  var desiredOcrProvider = (sSettings.ocrProvider === 'tesseract') ? 'tesseract' : 'mock';
  var ocrFeatureStatus = (typeof getOcrFeatureStatus === 'function') ? getOcrFeatureStatus() : null;
  var realOcrEnabledForSession = !!(ocrFeatureStatus && ocrFeatureStatus.realOcrEnabledForSession);
  if (desiredOcrProvider === 'tesseract' && !realOcrEnabledForSession) {
    return _failOut('tesseract-disabled-by-flag',
      'Tesseract OCR is disabled. Enable it for this session or use mock OCR.');
  }
  if (desiredOcrProvider === 'tesseract' && typeof recognizeTextWithTesseract !== 'function') {
    return _failOut('tesseract-engine-unavailable',
      'Tesseract OCR engine is not available in this build.');
  }

  // 3. Screen preview must exist with an imageDataUrl in memory.
  //    (We don't read the imageDataUrl in the engine itself —
  //    the mock OCR engine only consumes metadata — but the user
  //    needs to see the overlay against the same preview, and a
  //    missing preview means the screenshot pipeline is empty.)
  var preview = (typeof deps.getScreenPreview === 'function') ? deps.getScreenPreview() : null;
  if (!preview || typeof preview.imageDataUrl !== 'string' || preview.imageDataUrl.indexOf('data:image/') !== 0) {
    return _failOut('missing-preview', 'Сначала получите screenshot preview.');
  }

  var total = scenario.settings.repeatCount | 0;

  try {
    for (var i = 1; i <= total; i++) {
      if (clickEngineState.shouldStop) {
        if (cb.onStop) cb.onStop();
        clickEngineState.isRunning = false;
        clickEngineState.shouldStop = false;
        clickEngineState.finishedAt = new Date().toISOString();
        return;
      }

      clickEngineState.currentIteration = i;

      if (typeof recordAuditEvent === 'function') {
        recordAuditEvent('scenario.textClick.ocr.started', {
          scenarioId: scenario.id, iteration: i, total: total,
          ocrProvider: desiredOcrProvider
        });
      }

      // 4. Build OCR input. Region is taken from scenario settings
      //    first; if absent, the mock searches the whole preview.
      var ocrInput;
      try {
        ocrInput = deps.createOcrInput(
          preview,
          sSettings.region || null,
          {
            language:      sSettings.language || 'ru+en',
            targetText:    targetText,
            matchMode:     sSettings.matchMode || 'contains',
            caseSensitive: !!sSettings.caseSensitive
          }
        );
      } catch (err) {
        return _failOut('ocr-input-failed', 'Не удалось построить OCR input.');
      }

      // 5. Run OCR. Branch on the desired provider:
      //    - mock      → Step-32 deterministic engine.
      //    - tesseract → Step-40 real provider, gated by runtime
      //                  feature flags. Returns a unified envelope
      //                  shape (`{ success, blocks, match, ... }`)
      //                  via `recognizeTextWithTesseract`.
      var ocrResult;
      var sourceIsRealOcr = false;
      if (desiredOcrProvider === 'tesseract') {
        try {
          var tessRes = await recognizeTextWithTesseract({
            imageDataUrl: preview.imageDataUrl,
            region: sSettings.region || null,
            options: {
              language:      sSettings.language || 'ru+en',
              targetText:    targetText,
              matchMode:     sSettings.matchMode || 'contains',
              caseSensitive: !!sSettings.caseSensitive
            }
          }, {});
          if (!tessRes || tessRes.success === false) {
            var tErr = tessRes && tessRes.error ? tessRes.error : 'tesseract-failed';
            return _failOut('tesseract-ocr-failed-' + tErr, 'Real OCR failed: ' + tErr);
          }
          // Adapt to the legacy mock-engine shape.
          ocrResult = {
            success: true,
            blocks: tessRes.blocks || [],
            match: tessRes.match || null,
            matched: !!tessRes.matched,
            language: tessRes.language || sSettings.language,
            matchMode: tessRes.matchMode || sSettings.matchMode,
            durationMs: typeof tessRes.durationMs === 'number' ? tessRes.durationMs : 0,
            providerId: 'tesseract',
            realOcr: true
          };
          sourceIsRealOcr = true;
        } catch (err) {
          return _failOut('tesseract-engine-exception',
            'Ошибка Tesseract OCR: ' + (err && err.message ? err.message : 'unknown'));
        }
      } else {
        try {
          ocrResult = deps.runMockOcr(ocrInput);
        } catch (err) {
          return _failOut('ocr-engine-exception', 'Ошибка mock OCR: ' + (err && err.message ? err.message : 'unknown'));
        }
      }

      if (!ocrResult) {
        return _failOut('ocr-engine-empty',
          desiredOcrProvider === 'tesseract' ? 'Tesseract OCR не вернул результат.' : 'Mock OCR не вернул результат.');
      }

      if (ocrResult.success === false) {
        var firstErr = (Array.isArray(ocrResult.errors) && ocrResult.errors.length > 0) ? ocrResult.errors[0] : 'ocr-failed';
        return _failOut('ocr-validation-failed-' + firstErr,
          (desiredOcrProvider === 'tesseract' ? 'Tesseract' : 'Mock') + ' OCR не выполнен: ' + firstErr);
      }

      if (typeof recordAuditEvent === 'function') {
        recordAuditEvent('scenario.textClick.ocr.completed', {
          scenarioId:    scenario.id, iteration: i, total: total,
          ocrProvider:   desiredOcrProvider,
          blocksCount:   Array.isArray(ocrResult.blocks) ? ocrResult.blocks.length : 0,
          durationMs:    typeof ocrResult.durationMs === 'number' ? ocrResult.durationMs : 0,
          matched:       !!ocrResult.matched,
          confidence:    ocrResult.match && typeof ocrResult.match.confidence === 'number' ? ocrResult.match.confidence : null,
          language:      ocrResult.language || null,
          matchMode:     ocrResult.matchMode || null,
          realOcr:       !!sourceIsRealOcr
        });
      }

      var match = ocrResult.match || null;

      if (!match) {
        if (typeof recordAuditEvent === 'function') {
          recordAuditEvent('scenario.textClick.noTextFound', {
            scenarioId: scenario.id, iteration: i, total: total,
            language:   sSettings.language,
            matchMode:  sSettings.matchMode,
            hasRegion:  !!sSettings.region,
            ocrProvider: desiredOcrProvider
          });
        }
        // Surface as an action with status no_match so the
        // renderer's onAction callback can render a clear message.
        var noMatchAction = {
          type:          'text_click',
          status:        'no_match',
          text:          targetText,
          confidence:    0,
          language:      sSettings.language,
          matchMode:     sSettings.matchMode,
          caseSensitive: !!sSettings.caseSensitive,
          ocrProvider:   desiredOcrProvider,
          realClick:     false,
          realOcr:       !!sourceIsRealOcr,
          simulated:     true
        };
        if (cb.onAction) cb.onAction(noMatchAction, i, total);
        if (cb.onProgress) cb.onProgress(i, total);
        if (i < total) await delay(scenario.settings.intervalMs);
        continue;
      }

      // 6. Build the simulated `text_click` action and route it
      //    through the action-pipeline. The pipeline will block
      //    any caller that asks for `realClick: true`. `realOcr`
      //    is allowed as a SOURCE marker — the action stays
      //    simulation-only either way.
      if (typeof recordAuditEvent === 'function') {
        recordAuditEvent('scenario.textClick.textFound', {
          scenarioId: scenario.id, iteration: i, total: total,
          confidence: match.confidence,
          targetX:    match.targetPoint ? match.targetPoint.x : null,
          targetY:    match.targetPoint ? match.targetPoint.y : null,
          textLen:    typeof match.text === 'string' ? match.text.length : 0,
          ocrProvider: desiredOcrProvider
        });
      }

      var action = {
        type:          'text_click',
        text:          typeof match.text === 'string' ? match.text : targetText,
        targetPoint:   match.targetPoint ? { x: match.targetPoint.x | 0, y: match.targetPoint.y | 0 } : null,
        boundingBox:   match.boundingBox ? {
          x: match.boundingBox.x | 0, y: match.boundingBox.y | 0,
          width: match.boundingBox.width | 0, height: match.boundingBox.height | 0
        } : null,
        confidence:    typeof match.confidence === 'number' ? match.confidence : 0,
        language:      sSettings.language,
        matchMode:     sSettings.matchMode,
        caseSensitive: !!sSettings.caseSensitive,
        ocrProvider:   desiredOcrProvider,
        realClick:     false,
        realOcr:       !!sourceIsRealOcr,
        simulated:     true
      };

      if (typeof executeAction === 'function') {
        var result = executeAction(action, ctx);
        if (result && result.ok === false && result.blocked === true) {
          return _failOut('blocked-by-pipeline', result.error || 'Action blocked');
        }
      }

      if (typeof recordAuditEvent === 'function') {
        recordAuditEvent('scenario.textClick.simulated', {
          scenarioId: scenario.id, iteration: i, total: total,
          confidence: match.confidence,
          targetX:    match.targetPoint ? match.targetPoint.x : null,
          targetY:    match.targetPoint ? match.targetPoint.y : null,
          textLen:    typeof match.text === 'string' ? match.text.length : 0,
          realClick:  false,
          realOcr:    false
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
