// =====================================================================
// ClickFlow — src/text-click-test-tools.js (Step 34)
// ---------------------------------------------------------------------
// Pure-logic helpers for the **Test OCR / Test Text Match** flow
// inside the text_click scenario form. The user types a target text,
// optionally a region, picks language / match mode / case sensitive,
// and presses *Test OCR* before saving the scenario or running it.
// This module collects the inputs, calls the Step-32 mock OCR
// engine, and builds a structured debug result the UI can render.
//
// HARD GUARANTEES (Step 34):
//   - This module is renderer-only logic. It NEVER imports
//     `electron`, `ipcRenderer`, `fs`, `tesseract`, `tesseract.js`,
//     `tesseract-ocr`, `node-tesseract-ocr`, `opencv4nodejs`,
//     `@u4/opencv4nodejs`, `opencv.js`, `opencv-js`, `sharp`,
//     `jimp`, `pixelmatch`, `looks-same`, `robotjs`, `nut.js`,
//     `iohook`, or `uiohook-napi`. It opens no IPC channel and
//     contains no `require()` call.
//   - It NEVER executes the scenario (no `runScenario`, no
//     `runTextClickScenario`, no `runImageClickScenario`).
//   - It NEVER moves the cursor, NEVER clicks, NEVER types,
//     NEVER touches the OS.
//   - It NEVER performs real OCR. It only delegates to the
//     Step-32 mock engine (`ocr-mock-engine.js`) which fabricates
//     plausible OCR blocks from preview metadata.
//   - It NEVER persists the screenshot, the OCR blocks, or the
//     debug result on disk. Module-local state lives in renderer
//     memory only and is reset on `clearTextClickTestResult()`.
//   - It NEVER stores `imageDataUrl` inside any returned object,
//     diagnostics line, or audit payload.
//
// The module exposes:
//   - buildTextClickTestInput(formData, appState)
//   - validateTextClickTestInput(input)
//   - runTextClickTest(input)            (sync; returns debug result)
//   - createTextClickDebugResult(ocrResult, input)
//   - clearTextClickTestResult()
//   - getTextClickTestStatus()
//   - getLastTextClickTestResult()
// =====================================================================

// ---------------------------------------------------------------------
// Module-local state (renderer memory only).
// ---------------------------------------------------------------------
//
// We keep ONLY metadata here — never `imageDataUrl`, never a
// thumbnail, never the full target text. That way diagnostics,
// audit payloads, and copy-to-clipboard can read this safely.

var _lastTextClickTestResult = null;
var _textClickTestDiagnostics = {
  lastTextClickTestAt:           null,
  lastTextClickTestMatched:      null,
  lastTextClickTestConfidence:   null,
  lastTextClickTestDurationMs:   null,
  lastTextClickTestTargetTextLen:0,
  lastTextClickTestErrorsCount:  0,
  lastTextClickTestLanguage:     null,
  lastTextClickTestMatchMode:    null,
  lastTextClickTestRegionUsed:   false,
  lastTextClickTestBlocksCount:  0,
  ocrMockOnly:                   true,
  realOcrEnabled:                false,
  realTextClickEnabled:          false
};

// Stable error / warning IDs. The UI maps these to localised
// strings via `i18n.js`.
var TEXT_CLICK_TEST_ERROR_IDS = Object.freeze({
  TargetTextRequired:               'targetTextRequired',
  CaptureScreenPreviewFirst:        'captureScreenPreviewFirst',
  InvalidRegion:                    'invalidRegion',
  InvalidOcrLanguage:               'invalidOcrLanguage',
  InvalidMatchMode:                 'invalidMatchMode',
  MockOcrEngineUnavailable:         'mockOcrEngineUnavailable',
  TargetTextNotFound:               'targetTextWasNotFound',
  // Step 41 — extra error ids surfaced by the Tesseract path.
  TesseractDisabledByFeatureFlag:   'tesseractDisabledByFeatureFlag',
  TesseractEngineUnavailable:       'tesseractEngineUnavailable',
  TesseractEngineThrew:              'tesseractEngineThrew'
});

// Allowed languages and match modes — kept in lock-step with
// `ocr-mock-engine.js` and `scenario-manager.js`.
var TEXT_CLICK_TEST_LANGUAGES   = Object.freeze(['ru', 'en', 'ru+en']);
var TEXT_CLICK_TEST_MATCH_MODES = Object.freeze(['contains', 'exact']);

// ---------------------------------------------------------------------
// 1. buildTextClickTestInput(formData, appState)
// ---------------------------------------------------------------------
//
// Gathers everything the mock OCR engine needs from:
//   - the scenario-form fields (targetText, language, matchMode,
//     caseSensitive, region, scenario draft name);
//   - the renderer state (screen capture preview).
//
// Returns a plain-data object. The returned input may carry the
// in-memory preview's `imageDataUrl` for the mock engine to read,
// but the helpers that store / log / persist data NEVER copy it
// onward.

function buildTextClickTestInput(formData, appState) {
  var fd = (formData && typeof formData === 'object') ? formData : {};
  var st = (appState && typeof appState === 'object') ? appState : {};

  // Screen preview comes straight from the capture slice.
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

  return {
    scenarioDraftName: (fd.name ? String(fd.name).trim() : ''),
    // Step 41 — propagate the desired OCR provider so the
    // run helper can dispatch to either the mock engine or
    // the Tesseract provider. The default is `mock` (matches
    // the form's safe default).
    ocrProvider: (fd.ocrProvider === 'tesseract') ? 'tesseract' : 'mock',
    screenPreview: preview ? {
      sourceId:   typeof preview.sourceId === 'string' ? preview.sourceId : '',
      name:       typeof preview.name === 'string' ? preview.name : '',
      width:      Number(preview.width)  || 0,
      height:     Number(preview.height) || 0,
      capturedAt: typeof preview.capturedAt === 'string' ? preview.capturedAt : '',
      // The data URL is needed only by the mock engine for the
      // overlay `<img>.src`. It does NOT leak into diagnostics,
      // audit payloads, or persistence.
      imageDataUrl: typeof preview.imageDataUrl === 'string' ? preview.imageDataUrl : ''
    } : null,
    region: region,
    options: {
      language:       _normalizeTextClickLanguage(fd.language),
      targetText:     typeof fd.targetText === 'string' ? fd.targetText : '',
      matchMode:      _normalizeTextClickMatchMode(fd.matchMode),
      caseSensitive:  !!fd.caseSensitive
    }
  };
}

// ---------------------------------------------------------------------
// 2. validateTextClickTestInput(input)
// ---------------------------------------------------------------------
//
// Returns `{ valid: bool, errors: [stableId], warnings: [stableId] }`.
// Errors block the run; warnings are surfaced to the UI but do not.

function validateTextClickTestInput(input) {
  var errors = [];
  var warnings = [];

  if (!input || typeof input !== 'object') {
    return {
      valid: false,
      errors: [TEXT_CLICK_TEST_ERROR_IDS.TargetTextRequired],
      warnings: warnings
    };
  }

  // Target text.
  if (!input.options || typeof input.options !== 'object' ||
      typeof input.options.targetText !== 'string' ||
      input.options.targetText.trim() === '') {
    errors.push(TEXT_CLICK_TEST_ERROR_IDS.TargetTextRequired);
  }

  // Screen preview.
  if (!input.screenPreview || typeof input.screenPreview !== 'object') {
    errors.push(TEXT_CLICK_TEST_ERROR_IDS.CaptureScreenPreviewFirst);
  } else {
    if (!(Number(input.screenPreview.width) > 0) || !(Number(input.screenPreview.height) > 0)) {
      errors.push(TEXT_CLICK_TEST_ERROR_IDS.CaptureScreenPreviewFirst);
    }
  }

  // Language / match mode.
  if (input.options) {
    if (TEXT_CLICK_TEST_LANGUAGES.indexOf(input.options.language) === -1) {
      errors.push(TEXT_CLICK_TEST_ERROR_IDS.InvalidOcrLanguage);
    }
    if (TEXT_CLICK_TEST_MATCH_MODES.indexOf(input.options.matchMode) === -1) {
      errors.push(TEXT_CLICK_TEST_ERROR_IDS.InvalidMatchMode);
    }
  }

  // Region (optional).
  if (input.region) {
    var r = input.region;
    if (typeof r !== 'object' ||
        !(Number(r.width) > 0) || !(Number(r.height) > 0) ||
        Number(r.x) < 0 || Number(r.y) < 0) {
      errors.push(TEXT_CLICK_TEST_ERROR_IDS.InvalidRegion);
    } else if (input.screenPreview &&
               Number(input.screenPreview.width) > 0 && Number(input.screenPreview.height) > 0) {
      var sw = Number(input.screenPreview.width);
      var sh = Number(input.screenPreview.height);
      if (Number(r.x) + Number(r.width)  > sw ||
          Number(r.y) + Number(r.height) > sh) {
        errors.push(TEXT_CLICK_TEST_ERROR_IDS.InvalidRegion);
      }
    }
  }

  // Engine availability. The mock path always needs `runMockOcr`;
  // the Tesseract path needs `recognizeTextWithTesseract`. We
  // accept either as long as one is present, so a build with only
  // tesseract.js loaded would still validate.
  var providerWanted = (input && input.ocrProvider === 'tesseract') ? 'tesseract' : 'mock';
  if (providerWanted === 'tesseract') {
    if (typeof recognizeTextWithTesseract !== 'function') {
      errors.push(TEXT_CLICK_TEST_ERROR_IDS.TesseractEngineUnavailable);
    }
  } else {
    if (typeof createOcrInput !== 'function' || typeof runMockOcr !== 'function') {
      errors.push(TEXT_CLICK_TEST_ERROR_IDS.MockOcrEngineUnavailable);
    }
  }

  // Dedupe.
  var unique = [];
  for (var i = 0; i < errors.length; i++) {
    if (unique.indexOf(errors[i]) === -1) unique.push(errors[i]);
  }
  return { valid: unique.length === 0, errors: unique, warnings: warnings };
}

// ---------------------------------------------------------------------
// 3. runTextClickTest(input)
// ---------------------------------------------------------------------
//
// End-to-end synchronous helper. Validates, calls the Step-32 mock
// OCR engine, builds the debug result. Records audit events when
// the audit module is present.
//
// IMPORTANT: this function does NOT execute the scenario. It NEVER
// calls `runScenario`, `runTextClickScenario`, or `executeAction`
// for real execution. It only builds a `text_click` ACTION
// PREVIEW (Step 32) for display.

async function runTextClickTest(input) {
  var startedAt = Date.now();

  // Step 41 — desired OCR provider for this test run. Default mock.
  var desiredProvider = (input && input.ocrProvider === 'tesseract') ? 'tesseract' : 'mock';

  if (typeof recordAuditEvent === 'function') {
    recordAuditEvent('textClick.test.started', {
      hasRegion:    !!(input && input.region),
      language:     input && input.options ? input.options.language : null,
      matchMode:    input && input.options ? input.options.matchMode : null,
      caseSensitive: !!(input && input.options && input.options.caseSensitive),
      targetTextLen: input && input.options && typeof input.options.targetText === 'string'
        ? input.options.targetText.length : 0,
      ocrProvider:   desiredProvider
    });
  }

  var validation = validateTextClickTestInput(input);
  if (!validation.valid) {
    var failedResult = createTextClickDebugResult(null, input, {
      success:    false,
      errors:     validation.errors,
      warnings:   validation.warnings,
      durationMs: Date.now() - startedAt
    });
    _commitTextClickTestResult(failedResult);
    if (typeof recordAuditEvent === 'function') {
      recordAuditEvent('textClick.test.failed', {
        errorsCount: failedResult.errors.length,
        durationMs:  failedResult.durationMs,
        ocrProvider: desiredProvider
      });
    }
    return failedResult;
  }

  // Step 41 — Tesseract path: re-check runtime feature flags. The
  // user must have clicked "Enable Tesseract for this session" in
  // the OCR tab. Without it we refuse cleanly.
  if (desiredProvider === 'tesseract') {
    var ocrFlags = (typeof getOcrFeatureStatus === 'function') ? getOcrFeatureStatus() : null;
    var sessionEnabled = !!(ocrFlags && ocrFlags.realOcrEnabledForSession);
    if (!sessionEnabled) {
      var blockedResult = createTextClickDebugResult(null, input, {
        success:    false,
        errors:     [TEXT_CLICK_TEST_ERROR_IDS.TesseractDisabledByFeatureFlag || 'tesseractDisabledByFeatureFlag'],
        warnings:   [],
        durationMs: Date.now() - startedAt
      });
      _commitTextClickTestResult(blockedResult);
      if (typeof recordAuditEvent === 'function') {
        recordAuditEvent('textClick.test.failed', {
          errorsCount: blockedResult.errors.length,
          durationMs:  blockedResult.durationMs,
          ocrProvider: desiredProvider,
          reason: 'tesseractDisabledByFeatureFlag'
        });
      }
      return blockedResult;
    }
    if (typeof recognizeTextWithTesseract !== 'function') {
      var unavailableResult = createTextClickDebugResult(null, input, {
        success:    false,
        errors:     [TEXT_CLICK_TEST_ERROR_IDS.TesseractEngineUnavailable || 'tesseractEngineUnavailable'],
        warnings:   [],
        durationMs: Date.now() - startedAt
      });
      _commitTextClickTestResult(unavailableResult);
      if (typeof recordAuditEvent === 'function') {
        recordAuditEvent('textClick.test.failed', {
          errorsCount: unavailableResult.errors.length,
          durationMs:  unavailableResult.durationMs,
          ocrProvider: desiredProvider,
          reason: 'tesseractEngineUnavailable'
        });
      }
      return unavailableResult;
    }
  }

  // Run the OCR engine. Branch on the desired provider:
  //   - mock      → Step-32 deterministic engine.
  //   - tesseract → Step-40 real provider, gated by runtime flags.
  // The mock engine never performs real OCR. The Tesseract path
  // calls the real engine via `recognizeTextWithTesseract` and
  // adapts its result to the legacy `runMockOcr` shape so the
  // existing debug-result builder works unchanged.
  var ocrResult;

  if (desiredProvider === 'tesseract') {
    try {
      var preview = input.screenPreview || {};
      var tessRes = await recognizeTextWithTesseract({
        imageDataUrl: typeof preview.imageDataUrl === 'string' ? preview.imageDataUrl : '',
        region: input.region || null,
        options: input.options || {}
      }, {});
      if (!tessRes || tessRes.success === false) {
        var tErr = tessRes && tessRes.error ? tessRes.error : 'tesseractFailed';
        var tessFailed = createTextClickDebugResult(null, input, {
          success:    false,
          errors:     [tErr],
          warnings:   [],
          durationMs: Date.now() - startedAt
        });
        _commitTextClickTestResult(tessFailed);
        if (typeof recordAuditEvent === 'function') {
          recordAuditEvent('textClick.test.failed', {
            errorsCount: tessFailed.errors.length,
            durationMs:  tessFailed.durationMs,
            ocrProvider: desiredProvider
          });
        }
        return tessFailed;
      }
      // Adapt the real-OCR envelope to the mock-engine shape used
      // by `createTextClickDebugResult`.
      ocrResult = {
        success: true,
        blocks: tessRes.blocks || [],
        match: tessRes.match || null,
        matched: !!tessRes.matched,
        targetText: tessRes.targetText || (input.options && input.options.targetText) || '',
        language: tessRes.language || (input.options && input.options.language) || 'ru+en',
        matchMode: tessRes.matchMode || (input.options && input.options.matchMode) || 'contains',
        caseSensitive: !!tessRes.caseSensitive,
        durationMs: typeof tessRes.durationMs === 'number' ? tessRes.durationMs : (Date.now() - startedAt),
        region: input.region || null
      };
    } catch (err) {
      var tessThrew = createTextClickDebugResult(null, input, {
        success:    false,
        errors:     ['tesseractEngineThrew'],
        warnings:   [],
        durationMs: Date.now() - startedAt
      });
      _commitTextClickTestResult(tessThrew);
      if (typeof recordAuditEvent === 'function') {
        recordAuditEvent('textClick.test.failed', {
          errorsCount: tessThrew.errors.length,
          durationMs:  tessThrew.durationMs,
          ocrProvider: desiredProvider
        });
      }
      return tessThrew;
    }
  } else {
    // Mock path (Step 32 — unchanged).
    var ocrInput;
    try {
      ocrInput = createOcrInput(
        input.screenPreview,
        input.region,
        input.options
      );
    } catch (err) {
      var inputErr = createTextClickDebugResult(null, input, {
        success:    false,
        errors:     [TEXT_CLICK_TEST_ERROR_IDS.MockOcrEngineUnavailable],
        warnings:   [],
        durationMs: Date.now() - startedAt
      });
      _commitTextClickTestResult(inputErr);
      if (typeof recordAuditEvent === 'function') {
        recordAuditEvent('textClick.test.failed', {
          errorsCount: inputErr.errors.length,
          durationMs:  inputErr.durationMs,
          ocrProvider: desiredProvider
        });
      }
      return inputErr;
    }

    try {
      ocrResult = runMockOcr(ocrInput);
    } catch (err) {
      var engineErr = createTextClickDebugResult(null, input, {
        success:    false,
        errors:     [TEXT_CLICK_TEST_ERROR_IDS.MockOcrEngineUnavailable],
        warnings:   [],
        durationMs: Date.now() - startedAt
      });
      _commitTextClickTestResult(engineErr);
      if (typeof recordAuditEvent === 'function') {
        recordAuditEvent('textClick.test.failed', {
          errorsCount: engineErr.errors.length,
          durationMs:  engineErr.durationMs,
          ocrProvider: desiredProvider
        });
      }
      return engineErr;
    }
  }

  // Engine returned. Build the debug result.
  var debug = createTextClickDebugResult(ocrResult, input, {
    success:    !!ocrResult && ocrResult.success !== false,
    errors:     [],
    warnings:   [],
    durationMs: Date.now() - startedAt
  });
  // Stamp the source provider on the debug result so the UI can
  // surface "OCR provider used: mock|tesseract".
  debug.ocrProvider = desiredProvider;
  debug.realOcr = (desiredProvider === 'tesseract');

  _commitTextClickTestResult(debug);

  if (typeof recordAuditEvent === 'function') {
    if (debug.errors.length > 0) {
      recordAuditEvent('textClick.test.failed', {
        errorsCount: debug.errors.length,
        durationMs:  debug.durationMs
      });
    } else if (debug.matched) {
      recordAuditEvent('textClick.test.completed', {
        confidence:    debug.confidence,
        targetX:       debug.targetPoint ? debug.targetPoint.x : null,
        targetY:       debug.targetPoint ? debug.targetPoint.y : null,
        durationMs:    debug.durationMs,
        blocksCount:   Array.isArray(debug.blocks) ? debug.blocks.length : 0,
        language:      debug.language,
        matchMode:     debug.matchMode,
        targetTextLen: typeof debug.targetText === 'string' ? debug.targetText.length : 0
      });
      if (debug.actionPreview) {
        recordAuditEvent('textClick.test.actionPreview.created', {
          textLen:    typeof debug.actionPreview.text === 'string' ? debug.actionPreview.text.length : 0,
          targetX:    debug.actionPreview.targetPoint ? debug.actionPreview.targetPoint.x : null,
          targetY:    debug.actionPreview.targetPoint ? debug.actionPreview.targetPoint.y : null,
          confidence: debug.actionPreview.confidence,
          realClick:  false,
          realOcr:    debug.realOcr === true,
          ocrProvider: debug.ocrProvider || 'mock'
        });
      }
    } else {
      recordAuditEvent('textClick.test.noMatch', {
        durationMs:    debug.durationMs,
        blocksCount:   Array.isArray(debug.blocks) ? debug.blocks.length : 0,
        language:      debug.language,
        matchMode:     debug.matchMode,
        targetTextLen: typeof debug.targetText === 'string' ? debug.targetText.length : 0
      });
    }
  }

  return debug;
}

// ---------------------------------------------------------------------
// 4. createTextClickDebugResult(ocrResult, input, runMeta)
// ---------------------------------------------------------------------
//
// Build the structured debug result the UI renders. Plain-data —
// no DOM nodes, no canvas, no `imageDataUrl`. Both successful and
// failing runs go through this function.

function createTextClickDebugResult(ocrResult, input, runMeta) {
  var inp = (input && typeof input === 'object') ? input : {};
  var meta = (runMeta && typeof runMeta === 'object') ? runMeta : {};
  var errors = Array.isArray(meta.errors) ? meta.errors.slice() : [];
  var warnings = Array.isArray(meta.warnings) ? meta.warnings.slice() : [];

  // Translate engine error IDs into our test-tools IDs.
  if (ocrResult && Array.isArray(ocrResult.errors)) {
    for (var ie = 0; ie < ocrResult.errors.length; ie++) {
      var translated = _translateOcrError(ocrResult.errors[ie]);
      if (translated && errors.indexOf(translated) === -1) errors.push(translated);
    }
  }

  var matched = !!(ocrResult && ocrResult.matched);
  var match = (ocrResult && ocrResult.match) ? ocrResult.match : null;
  var blocks = (ocrResult && Array.isArray(ocrResult.blocks)) ? ocrResult.blocks.slice() : [];
  var confidence = (match && typeof match.confidence === 'number') ? match.confidence : 0;

  var matchedText = (match && typeof match.text === 'string') ? match.text : '';
  var boundingBox = null;
  if (match && match.boundingBox) {
    boundingBox = {
      x:      match.boundingBox.x      | 0,
      y:      match.boundingBox.y      | 0,
      width:  match.boundingBox.width  | 0,
      height: match.boundingBox.height | 0
    };
  }
  var targetPoint = null;
  if (match && match.targetPoint) {
    targetPoint = {
      x: match.targetPoint.x | 0,
      y: match.targetPoint.y | 0
    };
  }

  // If validation passed AND the engine ran fine but produced no
  // match, surface a stable error id so the UI can show
  // "Target text was not found." inline.
  if (errors.length === 0 && ocrResult && ocrResult.success !== false && !matched) {
    errors.push(TEXT_CLICK_TEST_ERROR_IDS.TargetTextNotFound);
  }

  // Action preview — built ONLY when we have a real match. The
  // mock engine already builds it; we re-use it as-is. The UI
  // renders the preview through `<pre>.textContent`.
  // Step 41 — when the OCR source was the Tesseract provider, the
  // preview keeps `realClick: false` (no cursor work) but stamps
  // `realOcr: true` so the consumer can see "this match came from
  // a real OCR engine".
  var providerForPreview = (inp && inp.ocrProvider === 'tesseract') ? 'tesseract' : 'mock';
  var actionPreviewRealOcr = (providerForPreview === 'tesseract');
  var actionPreview = null;
  if (matched && ocrResult && ocrResult.actionPreview) {
    actionPreview = Object.assign({}, ocrResult.actionPreview);
    actionPreview.realClick = false;
    actionPreview.realOcr   = actionPreviewRealOcr;
    actionPreview.ocrProvider = providerForPreview;
    if (!actionPreview.mode) actionPreview.mode = 'preview';
    if (!actionPreview.type) actionPreview.type = 'text_click';
  } else if (matched && match && targetPoint) {
    // Defensive fallback — if the mock didn't attach an action
    // preview, build one ourselves. Plain-data only.
    actionPreview = {
      type:          'text_click',
      mode:          'preview',
      text:          matchedText,
      targetPoint:   targetPoint,
      boundingBox:   boundingBox,
      confidence:    confidence,
      language:      inp.options ? inp.options.language : 'ru+en',
      matchMode:     inp.options ? inp.options.matchMode : 'contains',
      caseSensitive: !!(inp.options && inp.options.caseSensitive),
      usedRegion:    inp.region ? Object.assign({}, inp.region) : null,
      ocrProvider:   providerForPreview,
      realClick:     false,
      realOcr:       actionPreviewRealOcr,
      note:          'Preview only. Real OCR is not connected. text_click action is not executed.'
    };
  }

  return {
    scenarioDraftName: inp.scenarioDraftName || '',
    targetText:        inp.options ? (inp.options.targetText || '') : '',
    language:          inp.options ? (inp.options.language    || 'ru+en')    : 'ru+en',
    matchMode:         inp.options ? (inp.options.matchMode   || 'contains') : 'contains',
    caseSensitive:     !!(inp.options && inp.options.caseSensitive),
    region:            inp.region ? Object.assign({}, inp.region) : null,
    screenSourceId:    inp.screenPreview ? (inp.screenPreview.sourceId || '') : '',
    screenSourceName:  inp.screenPreview ? (inp.screenPreview.name     || '') : '',
    previewSize:       inp.screenPreview ? {
      width:  Number(inp.screenPreview.width)  || 0,
      height: Number(inp.screenPreview.height) || 0
    } : null,
    matched:           matched,
    matchedText:       matchedText,
    confidence:        confidence,
    boundingBox:       boundingBox,
    targetPoint:       targetPoint,
    durationMs:        (typeof meta.durationMs === 'number') ? meta.durationMs : 0,
    blocks:            blocks,
    actionPreview:     actionPreview,
    errors:            errors,
    warnings:          warnings,
    realOcr:           false,
    realClick:         false,
    createdAt:         new Date().toISOString()
  };
}

// ---------------------------------------------------------------------
// 5. clearTextClickTestResult()
// ---------------------------------------------------------------------

function clearTextClickTestResult() {
  _lastTextClickTestResult = null;
  _textClickTestDiagnostics.lastTextClickTestAt            = null;
  _textClickTestDiagnostics.lastTextClickTestMatched       = null;
  _textClickTestDiagnostics.lastTextClickTestConfidence    = null;
  _textClickTestDiagnostics.lastTextClickTestDurationMs    = null;
  _textClickTestDiagnostics.lastTextClickTestTargetTextLen = 0;
  _textClickTestDiagnostics.lastTextClickTestErrorsCount   = 0;
  _textClickTestDiagnostics.lastTextClickTestLanguage      = null;
  _textClickTestDiagnostics.lastTextClickTestMatchMode     = null;
  _textClickTestDiagnostics.lastTextClickTestRegionUsed    = false;
  _textClickTestDiagnostics.lastTextClickTestBlocksCount   = 0;
  if (typeof recordAuditEvent === 'function') {
    recordAuditEvent('textClick.test.cleared', {});
  }
}

// ---------------------------------------------------------------------
// 6. getTextClickTestStatus()
// ---------------------------------------------------------------------
//
// Used by diagnostics card and Copy diagnostics. Numbers / strings
// only — never an `imageDataUrl`, never the full target text.

function getTextClickTestStatus() {
  return {
    hasResult:                      !!_lastTextClickTestResult,
    lastTextClickTestAt:            _textClickTestDiagnostics.lastTextClickTestAt,
    lastTextClickTestMatched:       _textClickTestDiagnostics.lastTextClickTestMatched,
    lastTextClickTestConfidence:    _textClickTestDiagnostics.lastTextClickTestConfidence,
    lastTextClickTestDurationMs:    _textClickTestDiagnostics.lastTextClickTestDurationMs,
    lastTextClickTestTargetTextLen: _textClickTestDiagnostics.lastTextClickTestTargetTextLen,
    lastTextClickTestErrorsCount:   _textClickTestDiagnostics.lastTextClickTestErrorsCount,
    lastTextClickTestLanguage:      _textClickTestDiagnostics.lastTextClickTestLanguage,
    lastTextClickTestMatchMode:     _textClickTestDiagnostics.lastTextClickTestMatchMode,
    lastTextClickTestRegionUsed:    _textClickTestDiagnostics.lastTextClickTestRegionUsed,
    lastTextClickTestBlocksCount:   _textClickTestDiagnostics.lastTextClickTestBlocksCount,
    ocrMockOnly:                    true,
    realOcrEnabled:                 false,
    realTextClickEnabled:           false,
    realClick:                      false,
    realOcr:                        false
  };
}

function getLastTextClickTestResult() {
  return _lastTextClickTestResult ? _shallowCloneTextClickResult(_lastTextClickTestResult) : null;
}

// ---------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------

function _commitTextClickTestResult(debug) {
  _lastTextClickTestResult = debug;
  _textClickTestDiagnostics.lastTextClickTestAt            = debug.createdAt || new Date().toISOString();
  _textClickTestDiagnostics.lastTextClickTestMatched       = !!debug.matched;
  _textClickTestDiagnostics.lastTextClickTestConfidence    = (typeof debug.confidence === 'number') ? debug.confidence : null;
  _textClickTestDiagnostics.lastTextClickTestDurationMs    = (typeof debug.durationMs === 'number') ? debug.durationMs : null;
  _textClickTestDiagnostics.lastTextClickTestTargetTextLen = (typeof debug.targetText === 'string') ? debug.targetText.length : 0;
  _textClickTestDiagnostics.lastTextClickTestErrorsCount   = Array.isArray(debug.errors) ? debug.errors.length : 0;
  _textClickTestDiagnostics.lastTextClickTestLanguage      = debug.language || null;
  _textClickTestDiagnostics.lastTextClickTestMatchMode     = debug.matchMode || null;
  _textClickTestDiagnostics.lastTextClickTestRegionUsed    = !!debug.region;
  _textClickTestDiagnostics.lastTextClickTestBlocksCount   = Array.isArray(debug.blocks) ? debug.blocks.length : 0;
}

function _normalizeTextClickLanguage(value) {
  if (typeof value !== 'string') return 'ru+en';
  var v = value.toLowerCase().trim();
  if (TEXT_CLICK_TEST_LANGUAGES.indexOf(v) !== -1) return v;
  return 'ru+en';
}

function _normalizeTextClickMatchMode(value) {
  if (typeof value !== 'string') return 'contains';
  var v = value.toLowerCase().trim();
  if (TEXT_CLICK_TEST_MATCH_MODES.indexOf(v) !== -1) return v;
  return 'contains';
}

function _translateOcrError(engineError) {
  switch (engineError) {
    case 'captureScreenPreviewFirst':
      return TEXT_CLICK_TEST_ERROR_IDS.CaptureScreenPreviewFirst;
    case 'targetTextRequired':
      return TEXT_CLICK_TEST_ERROR_IDS.TargetTextRequired;
    case 'invalidOcrLanguage':
      return TEXT_CLICK_TEST_ERROR_IDS.InvalidOcrLanguage;
    case 'invalidMatchMode':
      return TEXT_CLICK_TEST_ERROR_IDS.InvalidMatchMode;
    case 'invalidRegion':
      return TEXT_CLICK_TEST_ERROR_IDS.InvalidRegion;
    default:
      return null;
  }
}

function _shallowCloneTextClickResult(r) {
  if (!r || typeof r !== 'object') return r;
  return {
    scenarioDraftName: r.scenarioDraftName,
    targetText:        r.targetText,
    language:          r.language,
    matchMode:         r.matchMode,
    caseSensitive:     !!r.caseSensitive,
    region:            r.region ? Object.assign({}, r.region) : null,
    screenSourceId:    r.screenSourceId,
    screenSourceName:  r.screenSourceName,
    previewSize:       r.previewSize ? Object.assign({}, r.previewSize) : null,
    matched:           !!r.matched,
    matchedText:       r.matchedText,
    confidence:        typeof r.confidence === 'number' ? r.confidence : 0,
    boundingBox:       r.boundingBox ? Object.assign({}, r.boundingBox) : null,
    targetPoint:       r.targetPoint ? Object.assign({}, r.targetPoint) : null,
    durationMs:        typeof r.durationMs === 'number' ? r.durationMs : 0,
    blocks:            Array.isArray(r.blocks) ? r.blocks.map(function (b) {
      return b ? {
        id:          b.id,
        text:        b.text,
        confidence:  typeof b.confidence === 'number' ? b.confidence : 0,
        boundingBox: b.boundingBox ? Object.assign({}, b.boundingBox) : null,
        targetPoint: b.targetPoint ? Object.assign({}, b.targetPoint) : null
      } : null;
    }).filter(Boolean) : [],
    actionPreview:     r.actionPreview ? Object.assign({}, r.actionPreview, {
      targetPoint: r.actionPreview.targetPoint ? Object.assign({}, r.actionPreview.targetPoint) : null,
      boundingBox: r.actionPreview.boundingBox ? Object.assign({}, r.actionPreview.boundingBox) : null,
      usedRegion:  r.actionPreview.usedRegion  ? Object.assign({}, r.actionPreview.usedRegion)  : null
    }) : null,
    errors:            Array.isArray(r.errors)   ? r.errors.slice()   : [],
    warnings:          Array.isArray(r.warnings) ? r.warnings.slice() : [],
    realOcr:           false,
    realClick:         false,
    createdAt:         r.createdAt
  };
}
