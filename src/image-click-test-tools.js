// =====================================================================
// ClickFlow — src/image-click-test-tools.js (Step 31)
// ---------------------------------------------------------------------
// Pure-logic helpers for the Test Match flow inside the scenario
// form. The user picks a template, optionally a region, sets the
// threshold / step, and presses **Test Match** before saving the
// scenario or running it. The tools collect the inputs, run the
// Step-29 template-matching engine over the captured preview, and
// build a structured debug result the UI can render directly.
//
// HARD GUARANTEES (Step 31):
//   - This module is renderer-only logic. It never imports
//     `electron`, `ipcRenderer`, `fs`, or anything via
//     `require()`. It never opens a new IPC channel.
//   - It NEVER executes the scenario (no `runScenario`, no
//     `runImageClickScenario`).
//   - It NEVER moves the cursor, NEVER clicks, NEVER types,
//     NEVER touches the OS. It only compares two ImageData
//     buffers that are already in renderer memory.
//   - It NEVER persists the screenshot, the template image, or
//     the debug result on disk. The single piece of module-local
//     state (`_lastTestResult`) lives in renderer memory and is
//     reset on `clearImageClickTestResult()`.
//   - It NEVER stores `imageDataUrl` inside a scenario, the
//     debug result, or any returned diagnostics line.
//   - It does NOT call `executeAction` for real execution — only
//     `createImageClickActionPreview` (Step 28) which builds a
//     plain-data preview marked `realClick: false`.
//   - It does NOT add OCR, Tesseract, OpenCV, robotjs, nut.js,
//     iohook, or uiohook-napi.
//
// The module exposes:
//   - buildImageClickTestInput(formData, appState)
//   - validateImageClickTestInput(input)
//   - runImageClickTest(input)            (async; returns debug result)
//   - createImageClickDebugResult(matchResult, input)
//   - clearImageClickTestResult()
//   - getImageClickTestStatus()
//   - getLastImageClickTestResult()
// =====================================================================

// ---------------------------------------------------------------------
// Module-local state (renderer memory only).
// ---------------------------------------------------------------------
//
// We keep ONLY metadata here — never `imageDataUrl`, never pixel
// buffers. That way diagnostics, audit payloads and copy-to-clipboard
// can read this safely.

var _lastTestResult = null;
var _diagnostics = {
  lastImageClickTestAt:           null,
  lastImageClickTestMatched:      null,
  lastImageClickTestConfidence:   null,
  lastImageClickTestDurationMs:   null,
  lastImageClickTestTemplateId:   null,
  lastImageClickTestErrorsCount:  0
};

// Stable error and warning IDs. The UI maps these to localised
// strings via `i18n.js`.
var IMAGE_CLICK_TEST_ERROR_IDS = Object.freeze({
  NoTemplateSelected:        'noTemplateSelected',
  TemplateImageMissing:      'templateImageMissing',
  CaptureScreenPreviewFirst: 'captureScreenPreviewFirst',
  InvalidRegion:             'invalidRegion',
  TemplateLargerThanSearchArea: 'templateLargerThanSearchArea',
  MatchingTookTooLong:       'matchingTookTooLong',
  MatchingEngineUnavailable: 'matchingEngineUnavailable',
  ThresholdInvalid:          'thresholdInvalid',
  StepInvalid:               'stepInvalid'
});

var IMAGE_CLICK_TEST_WARNING_IDS = Object.freeze({
  MatchBelowThreshold: 'matchBelowThreshold',
  SearchAreaCostHigh:  'searchAreaCostHigh',
  StepRaisedByEngine:  'stepRaisedByEngine',
  TemplateDownscaled:  'templateDownscaled',
  SearchAreaDownscaled:'searchAreaDownscaled'
});

// Soft cap on how long Test Match is allowed to run. The Step-29
// engine has its own cost guards but we add this defence-in-depth
// so the UI never freezes the form.
var IMAGE_CLICK_TEST_TIMEOUT_MS = 8000;

// ---------------------------------------------------------------------
// 1. buildImageClickTestInput(formData, appState)
// ---------------------------------------------------------------------
//
// Gathers everything the matcher needs from:
//   - the scenario-form fields (templateId, threshold, step, region,
//     scenario draft name);
//   - the renderer state (screen capture preview, templates list).
//
// The result is a plain-data object. It carries the in-memory
// `imageDataUrl`s for the matcher to read, but the helpers that
// store / log / persist data NEVER copy them onward.

function buildImageClickTestInput(formData, appState) {
  var fd = (formData && typeof formData === 'object') ? formData : {};
  var st = (appState && typeof appState === 'object') ? appState : {};

  // Template — id from the form, full record from app-state.
  var templateId = (typeof fd.templateId === 'string') ? fd.templateId : '';
  var templateRecord = null;
  var items = (st.templates && Array.isArray(st.templates.items)) ? st.templates.items : [];
  for (var i = 0; i < items.length; i++) {
    var it = items[i];
    if (it && it.id === templateId) { templateRecord = it; break; }
  }

  // Screen preview — taken straight from the capture slice.
  var preview = (st.screenCapture && st.screenCapture.preview) ? st.screenCapture.preview : null;

  // Region — optional. The form keeps a copy in image-space
  // coordinates already, so we trust the values but clamp them.
  var region = null;
  if (fd.region && typeof fd.region === 'object') {
    var rx = Number(fd.region.x);
    var ry = Number(fd.region.y);
    var rw = Number(fd.region.width);
    var rh = Number(fd.region.height);
    if (isFinite(rx) && isFinite(ry) && isFinite(rw) && isFinite(rh) &&
        rx >= 0 && ry >= 0 && rw > 0 && rh > 0) {
      region = {
        x:      Math.round(rx),
        y:      Math.round(ry),
        width:  Math.round(rw),
        height: Math.round(rh)
      };
    }
  }

  var threshold = Number(fd.threshold);
  if (!isFinite(threshold)) threshold = 0.75;
  if (threshold < 0) threshold = 0;
  if (threshold > 1) threshold = 1;

  var step = Number(fd.step) | 0;
  if (step < 1) step = 4;

  return {
    scenarioDraftName: (fd.name ? String(fd.name).trim() : ''),
    templateId:        templateId,
    template:          templateRecord ? {
      id:              typeof templateRecord.id === 'string' ? templateRecord.id : '',
      name:            typeof templateRecord.name === 'string' ? templateRecord.name : '',
      width:           Number(templateRecord.width)  || 0,
      height:          Number(templateRecord.height) || 0,
      sizeBytes:       Number(templateRecord.sizeBytes) || 0,
      // The data URL is needed by the matcher. It does NOT leak
      // into diagnostics, audit, or persistence. It is re-read
      // from the templates slice each time the user presses
      // Test Match — so a Reset Templates run wipes it.
      previewDataUrl:  typeof templateRecord.previewDataUrl === 'string' ? templateRecord.previewDataUrl : ''
    } : null,
    screenPreview:     preview ? {
      sourceId:        typeof preview.sourceId === 'string' ? preview.sourceId : '',
      sourceName:      typeof preview.name === 'string' ? preview.name : '',
      width:           Number(preview.width)  || 0,
      height:          Number(preview.height) || 0,
      capturedAt:      typeof preview.capturedAt === 'string' ? preview.capturedAt : '',
      // Same reasoning as above — never persisted.
      imageDataUrl:    typeof preview.imageDataUrl === 'string' ? preview.imageDataUrl : ''
    } : null,
    region:            region,
    threshold:         Math.round(threshold * 100) / 100,
    step:              step
  };
}

// ---------------------------------------------------------------------
// 2. validateImageClickTestInput(input)
// ---------------------------------------------------------------------
//
// Returns `{ valid: bool, errors: [stableId], warnings: [stableId] }`.
// Errors block the run; warnings are surfaced to the UI but do not.

function validateImageClickTestInput(input) {
  var errors = [];
  var warnings = [];

  if (!input || typeof input !== 'object') {
    return { valid: false, errors: [IMAGE_CLICK_TEST_ERROR_IDS.NoTemplateSelected], warnings: warnings };
  }

  // Template chain.
  if (!input.templateId || typeof input.templateId !== 'string') {
    errors.push(IMAGE_CLICK_TEST_ERROR_IDS.NoTemplateSelected);
  } else if (!input.template || typeof input.template !== 'object') {
    errors.push(IMAGE_CLICK_TEST_ERROR_IDS.NoTemplateSelected);
  } else {
    if (!input.template.previewDataUrl || typeof input.template.previewDataUrl !== 'string') {
      errors.push(IMAGE_CLICK_TEST_ERROR_IDS.TemplateImageMissing);
    } else if (input.template.previewDataUrl.indexOf('data:image/') !== 0) {
      errors.push(IMAGE_CLICK_TEST_ERROR_IDS.TemplateImageMissing);
    }
    if (!(Number(input.template.width) > 0) || !(Number(input.template.height) > 0)) {
      errors.push(IMAGE_CLICK_TEST_ERROR_IDS.TemplateImageMissing);
    }
  }

  // Screen preview.
  if (!input.screenPreview || typeof input.screenPreview !== 'object') {
    errors.push(IMAGE_CLICK_TEST_ERROR_IDS.CaptureScreenPreviewFirst);
  } else {
    if (!input.screenPreview.imageDataUrl || typeof input.screenPreview.imageDataUrl !== 'string') {
      errors.push(IMAGE_CLICK_TEST_ERROR_IDS.CaptureScreenPreviewFirst);
    } else if (input.screenPreview.imageDataUrl.indexOf('data:image/') !== 0) {
      errors.push(IMAGE_CLICK_TEST_ERROR_IDS.CaptureScreenPreviewFirst);
    }
    if (!(Number(input.screenPreview.width) > 0) || !(Number(input.screenPreview.height) > 0)) {
      errors.push(IMAGE_CLICK_TEST_ERROR_IDS.CaptureScreenPreviewFirst);
    }
  }

  // Region (optional).
  if (input.region) {
    var r = input.region;
    if (typeof r !== 'object' ||
        !(Number(r.width) > 0) || !(Number(r.height) > 0) ||
        Number(r.x) < 0 || Number(r.y) < 0) {
      errors.push(IMAGE_CLICK_TEST_ERROR_IDS.InvalidRegion);
    } else if (input.screenPreview && Number(input.screenPreview.width) > 0 && Number(input.screenPreview.height) > 0) {
      // Region must lie inside the preview.
      var sw = Number(input.screenPreview.width);
      var sh = Number(input.screenPreview.height);
      if (Number(r.x) + Number(r.width)  > sw ||
          Number(r.y) + Number(r.height) > sh) {
        errors.push(IMAGE_CLICK_TEST_ERROR_IDS.InvalidRegion);
      }
    }
  }

  // Threshold / step.
  if (typeof input.threshold !== 'number' || !isFinite(input.threshold) ||
      input.threshold < 0 || input.threshold > 1) {
    errors.push(IMAGE_CLICK_TEST_ERROR_IDS.ThresholdInvalid);
  }
  if (typeof input.step !== 'number' || !isFinite(input.step) ||
      input.step < 1 || input.step > 32) {
    errors.push(IMAGE_CLICK_TEST_ERROR_IDS.StepInvalid);
  }

  // Template-vs-search-area sanity check (early). The engine does
  // its own check too, but this lets the UI fail fast without
  // decoding the data URLs.
  if (input.template && input.screenPreview &&
      Number(input.template.width)  > 0 && Number(input.template.height) > 0 &&
      Number(input.screenPreview.width) > 0 && Number(input.screenPreview.height) > 0) {
    var searchW = (input.region && Number(input.region.width)  > 0)
      ? Number(input.region.width)  : Number(input.screenPreview.width);
    var searchH = (input.region && Number(input.region.height) > 0)
      ? Number(input.region.height) : Number(input.screenPreview.height);
    if (Number(input.template.width)  > searchW ||
        Number(input.template.height) > searchH) {
      errors.push(IMAGE_CLICK_TEST_ERROR_IDS.TemplateLargerThanSearchArea);
    }
  }

  // Engine availability.
  if (typeof runTemplateMatch !== 'function') {
    errors.push(IMAGE_CLICK_TEST_ERROR_IDS.MatchingEngineUnavailable);
  }

  // Dedupe — a single root cause shouldn't appear twice.
  var uniqErrors = [];
  for (var i = 0; i < errors.length; i++) {
    if (uniqErrors.indexOf(errors[i]) === -1) uniqErrors.push(errors[i]);
  }

  return { valid: uniqErrors.length === 0, errors: uniqErrors, warnings: warnings };
}

// ---------------------------------------------------------------------
// 3. runImageClickTest(input)
// ---------------------------------------------------------------------
//
// Validates, runs the Step-29 engine, builds the debug result. Async
// because the engine decodes data URLs through HTMLImageElement.
//
// IMPORTANT: this function does NOT execute the scenario. It does
// NOT call `runScenario`, `runImageClickScenario`, or
// `executeAction({ executionMode: 'real' })`. It only builds an
// `image_click` ACTION PREVIEW (Step 28) for display.

async function runImageClickTest(input) {
  var startedAt = Date.now();

  if (typeof recordAuditEvent === 'function') {
    recordAuditEvent('imageClick.test.started', {
      templateId:  input && input.templateId ? input.templateId : '',
      hasRegion:   !!(input && input.region),
      threshold:   input && typeof input.threshold === 'number' ? input.threshold : null,
      step:        input && typeof input.step === 'number' ? input.step : null
    });
  }

  var validation = validateImageClickTestInput(input);
  if (!validation.valid) {
    var errorResult = createImageClickDebugResult({
      success: false,
      errors:  validation.errors,
      warnings: validation.warnings,
      durationMs: Date.now() - startedAt
    }, input);
    _commitDebugResult(errorResult);
    if (typeof recordAuditEvent === 'function') {
      recordAuditEvent('imageClick.test.failed', {
        templateId:  errorResult.templateId,
        errorsCount: errorResult.errors.length,
        durationMs:  errorResult.durationMs
      });
    }
    return errorResult;
  }

  // Enforce a soft timeout so a slow engine never hangs the form.
  var enginePromise;
  try {
    enginePromise = runTemplateMatch(
      input.screenPreview.imageDataUrl,
      input.template.previewDataUrl,
      {
        region:    input.region,
        threshold: input.threshold,
        step:      input.step
      }
    );
  } catch (err) {
    var failureResult = createImageClickDebugResult({
      success:    false,
      errors:     [IMAGE_CLICK_TEST_ERROR_IDS.MatchingEngineUnavailable],
      warnings:   [],
      durationMs: Date.now() - startedAt
    }, input);
    _commitDebugResult(failureResult);
    if (typeof recordAuditEvent === 'function') {
      recordAuditEvent('imageClick.test.failed', {
        templateId:  failureResult.templateId,
        errorsCount: failureResult.errors.length,
        durationMs:  failureResult.durationMs
      });
    }
    return failureResult;
  }

  var timeoutPromise = new Promise(function (resolve) {
    setTimeout(function () {
      resolve({ __timeout: true });
    }, IMAGE_CLICK_TEST_TIMEOUT_MS);
  });

  var raceResult;
  try {
    raceResult = await Promise.race([enginePromise, timeoutPromise]);
  } catch (err) {
    raceResult = { success: false, error: 'engine-threw', warnings: [] };
  }

  if (raceResult && raceResult.__timeout) {
    var timeoutResult = createImageClickDebugResult({
      success:    false,
      errors:     [IMAGE_CLICK_TEST_ERROR_IDS.MatchingTookTooLong],
      warnings:   [],
      durationMs: Date.now() - startedAt
    }, input);
    _commitDebugResult(timeoutResult);
    if (typeof recordAuditEvent === 'function') {
      recordAuditEvent('imageClick.test.failed', {
        templateId:  timeoutResult.templateId,
        errorsCount: timeoutResult.errors.length,
        durationMs:  timeoutResult.durationMs
      });
    }
    return timeoutResult;
  }

  // Engine returned. raceResult is the runTemplateMatch payload:
  // `{ success, match?, error?, warnings: [] }`.
  var debug = createImageClickDebugResult({
    success:    !!raceResult.success,
    match:      raceResult.match || null,
    error:      raceResult.error || null,
    warnings:   Array.isArray(raceResult.warnings) ? raceResult.warnings : [],
    durationMs: Date.now() - startedAt
  }, input);

  _commitDebugResult(debug);

  if (typeof recordAuditEvent === 'function') {
    if (debug.matched) {
      recordAuditEvent('imageClick.test.completed', {
        templateId:   debug.templateId,
        confidence:   debug.confidence,
        targetX:      debug.targetPoint ? debug.targetPoint.x : null,
        targetY:      debug.targetPoint ? debug.targetPoint.y : null,
        durationMs:   debug.durationMs,
        warningsCount: debug.warnings.length
      });
    } else if (debug.errors.length > 0) {
      recordAuditEvent('imageClick.test.failed', {
        templateId:  debug.templateId,
        errorsCount: debug.errors.length,
        durationMs:  debug.durationMs
      });
    } else {
      // Engine ran fine but the score is below threshold OR the
      // engine reported `success:false` without our error ids.
      recordAuditEvent('imageClick.test.lowConfidence', {
        templateId:    debug.templateId,
        confidence:    debug.confidence,
        threshold:     debug.threshold,
        durationMs:    debug.durationMs,
        warningsCount: debug.warnings.length
      });
    }
  }

  return debug;
}

// ---------------------------------------------------------------------
// 4. createImageClickDebugResult(matchResult, input)
// ---------------------------------------------------------------------
//
// Build the structured debug result the UI renders. Plain-data —
// no DOM nodes, no canvas, no `imageDataUrl`. Both successful and
// failing runs go through this function.

function createImageClickDebugResult(matchResult, input) {
  var mr = (matchResult && typeof matchResult === 'object') ? matchResult : {};
  var inp = (input && typeof input === 'object') ? input : {};

  var errors = Array.isArray(mr.errors) ? mr.errors.slice() : [];
  var warnings = Array.isArray(mr.warnings) ? mr.warnings.slice() : [];

  // Translate engine error string into a stable error id, when the
  // engine ran but returned `success: false`.
  if (errors.length === 0 && mr.success === false && typeof mr.error === 'string') {
    var translated = _translateEngineError(mr.error);
    if (translated) errors.push(translated);
  }

  // Translate engine warnings (Step 29: 'search-area-downscaled',
  // 'template-downscaled', 'search-area-cost-high',
  // 'step-raised-by-engine', 'template-too-large').
  var translatedWarnings = [];
  for (var iw = 0; iw < warnings.length; iw++) {
    var w = warnings[iw];
    var tw = _translateEngineWarning(w);
    if (tw && translatedWarnings.indexOf(tw) === -1) translatedWarnings.push(tw);
  }

  var match = mr.match || null;
  var threshold = (typeof inp.threshold === 'number') ? inp.threshold : 0.75;
  var matched = false;
  var confidence = 0;
  if (match && typeof match.score === 'number') {
    confidence = Math.max(0, Math.min(1, match.score));
    matched = confidence >= threshold;
  } else if (match && typeof match.confidence === 'number') {
    confidence = Math.max(0, Math.min(1, match.confidence));
    matched = confidence >= threshold;
  }

  // If the match is below threshold and there is no hard error,
  // surface the "matchBelowThreshold" warning so the UI can show
  // a yellow banner.
  if (mr.success && match && !matched &&
      translatedWarnings.indexOf(IMAGE_CLICK_TEST_WARNING_IDS.MatchBelowThreshold) === -1) {
    translatedWarnings.push(IMAGE_CLICK_TEST_WARNING_IDS.MatchBelowThreshold);
  }

  var boundingBox = null;
  if (match) {
    if (match.boundingBox && typeof match.boundingBox === 'object') {
      boundingBox = {
        x:      Math.max(0, Math.round(Number(match.boundingBox.x) || 0)),
        y:      Math.max(0, Math.round(Number(match.boundingBox.y) || 0)),
        width:  Math.max(0, Math.round(Number(match.boundingBox.width)  || 0)),
        height: Math.max(0, Math.round(Number(match.boundingBox.height) || 0))
      };
    } else if (typeof match.x === 'number' && typeof match.y === 'number' &&
               typeof match.width === 'number' && typeof match.height === 'number') {
      boundingBox = {
        x:      Math.max(0, Math.round(match.x)),
        y:      Math.max(0, Math.round(match.y)),
        width:  Math.max(0, Math.round(match.width)),
        height: Math.max(0, Math.round(match.height))
      };
    }
  }

  var targetPoint = null;
  if (boundingBox) {
    targetPoint = {
      x: boundingBox.x + Math.round(boundingBox.width  / 2),
      y: boundingBox.y + Math.round(boundingBox.height / 2)
    };
  }

  // Action preview — uses the Step-28 helper if available so the
  // shape stays consistent with the existing Template Matching tab.
  var actionPreview = null;
  if (boundingBox && typeof createImageClickActionPreview === 'function') {
    try {
      actionPreview = createImageClickActionPreview({
        boundingBox:  boundingBox,
        targetPoint:  targetPoint,
        confidence:   confidence,
        templateId:   inp.template ? (inp.template.id || '') : '',
        templateName: inp.template ? (inp.template.name || '') : '',
        usedRegion:   inp.region || null
      });
    } catch (err) {
      actionPreview = null;
    }
  }
  if (!actionPreview && boundingBox) {
    // Defensive fallback so the UI still has a preview to render.
    actionPreview = {
      type:         'image_click',
      mode:         'preview',
      templateId:   inp.template ? (inp.template.id || '') : '',
      templateName: inp.template ? (inp.template.name || '') : '',
      targetPoint:  targetPoint,
      boundingBox:  boundingBox,
      confidence:   confidence,
      usedRegion:   inp.region || null,
      realClick:    false,
      realMatching: false,
      note:         'Preview only. Test Match does not click.'
    };
  }

  var debug = {
    scenarioDraftName: inp.scenarioDraftName || '',
    templateId:        inp.template ? (inp.template.id || '') : (inp.templateId || ''),
    templateName:      inp.template ? (inp.template.name || '') : '',
    screenSourceName:  inp.screenPreview ? (inp.screenPreview.sourceName || '') : '',
    screenSourceId:    inp.screenPreview ? (inp.screenPreview.sourceId   || '') : '',
    previewSize:       inp.screenPreview ? {
      width:  Number(inp.screenPreview.width)  || 0,
      height: Number(inp.screenPreview.height) || 0
    } : null,
    region:            inp.region ? { x: inp.region.x, y: inp.region.y, width: inp.region.width, height: inp.region.height } : null,
    threshold:         threshold,
    step:              (typeof inp.step === 'number') ? inp.step : null,
    matched:           !!matched,
    confidence:        confidence,
    boundingBox:       boundingBox,
    targetPoint:       targetPoint,
    durationMs:        (typeof mr.durationMs === 'number') ? mr.durationMs : 0,
    actionPreview:     actionPreview,
    errors:            errors,
    warnings:          translatedWarnings,
    createdAt:         new Date().toISOString(),
    realClick:         false,
    realMatching:      false,
    // Step 29 extras when the engine produced a match — useful in
    // the diagnostics overlay.
    engineMode:        match && typeof match.mode === 'string' ? match.mode : null,
    pixelStep:         match && typeof match.pixelStep === 'number' ? match.pixelStep : null,
    scannedPositions:  match && typeof match.scannedPositions === 'number' ? match.scannedPositions : null,
    downscaledSearch:  match && typeof match.downscaledSearch === 'boolean' ? match.downscaledSearch : null,
    downscaledTemplate: match && typeof match.downscaledTemplate === 'boolean' ? match.downscaledTemplate : null
  };

  return debug;
}

// ---------------------------------------------------------------------
// 5. clearImageClickTestResult()
// ---------------------------------------------------------------------

function clearImageClickTestResult() {
  _lastTestResult = null;
  _diagnostics.lastImageClickTestAt          = null;
  _diagnostics.lastImageClickTestMatched     = null;
  _diagnostics.lastImageClickTestConfidence  = null;
  _diagnostics.lastImageClickTestDurationMs  = null;
  _diagnostics.lastImageClickTestTemplateId  = null;
  _diagnostics.lastImageClickTestErrorsCount = 0;
  if (typeof recordAuditEvent === 'function') {
    recordAuditEvent('imageClick.test.cleared', {});
  }
}

// ---------------------------------------------------------------------
// 6. getImageClickTestStatus()
// ---------------------------------------------------------------------
//
// Used by diagnostics card and Copy diagnostics. Numbers / strings
// only — never an `imageDataUrl`, never a thumbnail.

function getImageClickTestStatus() {
  return {
    hasResult:                     !!_lastTestResult,
    lastImageClickTestAt:          _diagnostics.lastImageClickTestAt,
    lastImageClickTestMatched:     _diagnostics.lastImageClickTestMatched,
    lastImageClickTestConfidence:  _diagnostics.lastImageClickTestConfidence,
    lastImageClickTestDurationMs:  _diagnostics.lastImageClickTestDurationMs,
    lastImageClickTestTemplateId:  _diagnostics.lastImageClickTestTemplateId,
    lastImageClickTestErrorsCount: _diagnostics.lastImageClickTestErrorsCount,
    realClick:                     false,
    realMatching:                  false,
    testDoesNotClick:              true
  };
}

function getLastImageClickTestResult() {
  return _lastTestResult ? _shallowClone(_lastTestResult) : null;
}

// ---------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------

function _commitDebugResult(debug) {
  _lastTestResult = debug;
  _diagnostics.lastImageClickTestAt          = debug.createdAt || new Date().toISOString();
  _diagnostics.lastImageClickTestMatched     = !!debug.matched;
  _diagnostics.lastImageClickTestConfidence  = (typeof debug.confidence === 'number') ? debug.confidence : null;
  _diagnostics.lastImageClickTestDurationMs  = (typeof debug.durationMs === 'number') ? debug.durationMs : null;
  _diagnostics.lastImageClickTestTemplateId  = debug.templateId || null;
  _diagnostics.lastImageClickTestErrorsCount = Array.isArray(debug.errors) ? debug.errors.length : 0;
}

function _translateEngineError(engineError) {
  switch (engineError) {
    case 'screen-preview-missing':         return IMAGE_CLICK_TEST_ERROR_IDS.CaptureScreenPreviewFirst;
    case 'screen-preview-decode-failed':   return IMAGE_CLICK_TEST_ERROR_IDS.CaptureScreenPreviewFirst;
    case 'template-image-missing':         return IMAGE_CLICK_TEST_ERROR_IDS.TemplateImageMissing;
    case 'template-decode-failed':         return IMAGE_CLICK_TEST_ERROR_IDS.TemplateImageMissing;
    case 'template-too-large':             return IMAGE_CLICK_TEST_ERROR_IDS.TemplateLargerThanSearchArea;
    case 'region-empty':                   return IMAGE_CLICK_TEST_ERROR_IDS.InvalidRegion;
    default:                               return null;
  }
}

function _translateEngineWarning(engineWarning) {
  switch (engineWarning) {
    case 'search-area-cost-high':   return IMAGE_CLICK_TEST_WARNING_IDS.SearchAreaCostHigh;
    case 'step-raised-by-engine':   return IMAGE_CLICK_TEST_WARNING_IDS.StepRaisedByEngine;
    case 'template-downscaled':     return IMAGE_CLICK_TEST_WARNING_IDS.TemplateDownscaled;
    case 'search-area-downscaled':  return IMAGE_CLICK_TEST_WARNING_IDS.SearchAreaDownscaled;
    default:                        return null;
  }
}

function _shallowClone(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  var out = {};
  for (var k in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, k)) {
      var v = obj[k];
      if (v && typeof v === 'object' && !Array.isArray(v)) {
        out[k] = Object.assign({}, v);
      } else if (Array.isArray(v)) {
        out[k] = v.slice();
      } else {
        out[k] = v;
      }
    }
  }
  return out;
}
