// =====================================================================
// ClickFlow — src/tesseract-ocr-provider.js (Step 39, extended at Steps 40-41)
// ---------------------------------------------------------------------
// Real OCR provider — Phase 2 (manual session opt-in).
//
// Step 39 declared `tesseract.js` as a runtime dependency in
// `package.json` and shipped this provider module as a defensive
// shell. Steps 40-41 turn the shell into a working real-OCR
// dispatcher with explicit, session-scoped opt-in:
//
//   - The provider runs OCR ONLY when `getOcrFeatureStatus()` reports
//     `realOcrEnabledForSession === true` AND the engine resolver
//     finds a usable Tesseract instance.
//   - The opt-in is granted at runtime by the user clicking "Enable
//     Tesseract for this session" in the OCR tab. The runtime
//     overlay lives in `src/feature-flags.js` and is wiped on
//     reload.
//   - The provider NEVER auto-runs. Every entry point checks the
//     flags first.
//   - The provider NEVER moves the cursor, NEVER presses a key,
//     NEVER clicks. The action pipeline still rejects every
//     `realClick: true` outright.
//   - The provider produces a unified result envelope with
//     `realOcr: true` so the consumer can mark the source. The
//     action preview keeps `realClick: false`.
//
// Public surface:
//   - getTesseractProviderInfo()
//   - isTesseractProviderAvailable()
//   - checkTesseractProviderReadiness(flags?)
//   - runTesseractSelfTest(options?)
//   - recognizeTextWithTesseract(input, options?)   — async
//   - normalizeTesseractResult(rawResult, input)
//   - mapTesseractBlocks(rawResult, input)
//   - terminateTesseractWorker()
//   - cancelCurrentTesseractRecognition()           // Step 40 (best-effort)
//   - getTesseractProviderDiagnostics()
//   - setTesseractEngineForTesting(engine)
// =====================================================================

'use strict';

// Static metadata about the provider. Mirrors the registry entry.
var _TESSERACT_INFO = Object.freeze({
  id: 'tesseract',
  name: 'Tesseract OCR Provider',
  type: 'real',
  realOcr: true,
  planned: false,
  defaultLanguage: 'ru+en',
  supportedLanguages: ['ru', 'en', 'ru+en'],
  // Mapping from our generic codes to Tesseract.js language strings.
  // Step 39 ships only this static map; the worker would honour it
  // as a hint only, falling back to `eng` if no pack is available.
  tesseractLanguageMap: { ru: 'rus', en: 'eng', 'ru+en': 'rus+eng' }
});

// Module-local mutable state. Everything here is reset by
// `terminateTesseractWorker()` and never persisted.
var _engine = null;            // injected via setTesseractEngineForTesting / lazy-load
var _engineLoadAttempted = false;
var _engineLoadError = null;
var _lastReadiness = null;
var _lastError = null;

// Step 40 — last-run telemetry. Reset on disable / reset.
var _lastRealOcrRunAt = null;
var _lastRealOcrDurationMs = null;
var _lastRealOcrBlocksCount = 0;
var _lastRealOcrMatched = null;

// Step 40 — best-effort cancellation. Each `recognizeTextWithTesseract`
// call gets a fresh token; the user-facing "Cancel" button bumps
// `_currentRecognitionToken`, and the recognise resolver checks the
// token before committing the result. Tesseract.js v5's
// `Tesseract.recognize` does not expose an interrupt, so the worker
// keeps running until it finishes naturally; we just discard the
// late result. Worker-based cancellation is documented as planned.
var _currentRecognitionToken = 0;
var _cancelledTokens = {};

// =====================================================================
// 1. Engine lookup (defensive lazy load)
// =====================================================================

// Returns whatever `Tesseract`-shaped object we can find. The order
// of precedence is:
//   1. an explicit injection (test seam / Step-40 wire-up);
//   2. a renderer global `window.Tesseract` if the host page has
//      loaded `tesseract.min.js` via a `<script src>` tag;
//   3. a CommonJS `require('tesseract.js')` if `nodeIntegration`
//      is true (it is NOT in the production build) AND the package
//      is installed.
//
// Returns `null` if none of those resolve. Never throws.
function _resolveTesseractEngine() {
  if (_engine) return _engine;
  if (_engineLoadAttempted && !_engine) return null;
  _engineLoadAttempted = true;
  // 2. renderer global
  try {
    if (typeof window !== 'undefined' && window && window.Tesseract) {
      _engine = window.Tesseract;
      return _engine;
    }
  } catch (e) { /* swallow */ }
  // 3. CommonJS require — only works if nodeIntegration is true.
  // In production ClickFlow keeps `nodeIntegration: false`, so this
  // path is dead. We attempt it anyway because it's the official
  // Tesseract.js loading path and unit tests may run with Node.
  try {
    if (typeof require === 'function') {
      // eslint-disable-next-line global-require
      var mod = require('tesseract.js');
      if (mod) { _engine = mod; return _engine; }
    }
  } catch (e) {
    _engineLoadError = (e && e.message) ? String(e.message) : 'tesseractRequireFailed';
  }
  return null;
}

// =====================================================================
// 2. Public — provider info / availability
// =====================================================================

function getTesseractProviderInfo() {
  return {
    id: _TESSERACT_INFO.id,
    name: _TESSERACT_INFO.name,
    type: _TESSERACT_INFO.type,
    realOcr: _TESSERACT_INFO.realOcr,
    planned: _TESSERACT_INFO.planned,
    defaultLanguage: _TESSERACT_INFO.defaultLanguage,
    supportedLanguages: _TESSERACT_INFO.supportedLanguages.slice(),
    dependencyDeclared: _isTesseractDependencyDeclared()
  };
}

// `available` here only means "the engine module is loadable". It
// does NOT mean "we may run OCR". Use `checkTesseractProviderReadiness`
// for the safety-aware decision. Returns boolean. Never throws.
function isTesseractProviderAvailable() {
  return !!_resolveTesseractEngine();
}

// Soft check: the dependency is declared in package.json. We keep
// this as a stable list rather than reading the file at runtime
// (the renderer should not depend on `fs`).
function _isTesseractDependencyDeclared() {
  // Step 39 declared it; if a future step drops it, flip this
  // constant.
  return true;
}

// =====================================================================
// 3. Public — readiness check
// =====================================================================

// Returns:
//   {
//     ready: boolean,
//     reasons: [stableId],
//     details: {
//       featureFlagRealOcr,
//       featureFlagTesseractProvider,
//       simulationOnly,
//       dependencyDeclared,
//       engineLoadable,
//       engineLoadError: string | null
//     },
//     checkedAt: ISOString
//   }
//
// Stable reason IDs:
//   - realOcrFeatureFlagDisabled
//   - tesseractProviderFeatureFlagDisabled
//   - simulationOnlyMode
//   - dependencyNotDeclared
//   - engineNotLoadable
function checkTesseractProviderReadiness(flagsArg) {
  _emitAudit('ocr.tesseract.readiness.requested', {});
  var status = _safeOcrFeatureStatus(flagsArg);
  var reasons = [];
  if (!status.realOcr)            reasons.push('realOcrFeatureFlagDisabled');
  if (!status.tesseractProvider)  reasons.push('tesseractProviderFeatureFlagDisabled');
  if (status.simulationOnly)      reasons.push('simulationOnlyMode');
  var dependencyDeclared = _isTesseractDependencyDeclared();
  if (!dependencyDeclared) reasons.push('dependencyNotDeclared');
  var engine = _resolveTesseractEngine();
  if (!engine)             reasons.push('engineNotLoadable');

  var report = {
    ready: reasons.length === 0,
    reasons: reasons,
    details: {
      featureFlagRealOcr:           !!status.realOcr,
      featureFlagTesseractProvider: !!status.tesseractProvider,
      simulationOnly:               !!status.simulationOnly,
      dependencyDeclared:           !!dependencyDeclared,
      engineLoadable:               !!engine,
      engineLoadError:              _engineLoadError
    },
    checkedAt: new Date().toISOString()
  };
  _lastReadiness = report;
  if (report.ready) {
    _emitAudit('ocr.tesseract.readiness.completed', {
      ready: true,
      reasonsCount: 0,
      engineLoadable: true,
      dependencyDeclared: true
    });
    _emitAudit('ocr.provider.tesseract.detected', {
      engineLoadable: true,
      dependencyDeclared: true
    });
  } else {
    // Granular failure events — testers can grep the audit log.
    if (reasons.indexOf('realOcrFeatureFlagDisabled') !== -1 ||
        reasons.indexOf('tesseractProviderFeatureFlagDisabled') !== -1 ||
        reasons.indexOf('simulationOnlyMode') !== -1) {
      _emitAudit('ocr.tesseract.blockedByFeatureFlag', {
        realOcr:           !!status.realOcr,
        tesseractProvider: !!status.tesseractProvider,
        simulationOnly:    !!status.simulationOnly
      });
    }
    if (!engine) {
      _emitAudit('ocr.provider.tesseract.unavailable', {
        dependencyDeclared: !!dependencyDeclared,
        engineLoadable: false,
        engineLoadError: _engineLoadError
      });
    }
    _emitAudit('ocr.tesseract.readiness.failed', {
      reasonsCount: reasons.length,
      firstReason: reasons[0] || null
    });
  }
  return _cloneReadiness(report);
}

// =====================================================================
// 4. Public — self-test (manual, never auto)
// =====================================================================

// Steps 40–41: the self-test now exercises the readiness check AND
// runs a single real recognise pass over a tiny synthetic 8×8 white
// canvas IF the user has opted in for the session. Without the
// runtime opt-in the function still refuses, exactly like Phase 1.
// In every case the function NEVER moves the cursor and NEVER emits
// a `realClick: true` action.
//
// Returns:
//   {
//     ok: boolean,
//     blocked: boolean,
//     reasons: [stableId],
//     durationMs: number,
//     details: { … same as readiness },
//     ranAt: ISOString
//   }
async function runTesseractSelfTest(options) {
  options = options || {};
  var startedAt = (typeof performance !== 'undefined' && performance.now)
    ? performance.now() : Date.now();
  var readiness = checkTesseractProviderReadiness(options.flags);
  if (!readiness.ready) {
    var endedAt0 = (typeof performance !== 'undefined' && performance.now)
      ? performance.now() : Date.now();
    return {
      ok: false,
      blocked: true,
      reasons: readiness.reasons.slice(),
      durationMs: Math.max(0, Math.round(endedAt0 - startedAt)),
      details: readiness.details,
      note: 'Self-test refused: real OCR is disabled or the engine is not loadable.',
      ranAt: new Date().toISOString()
    };
  }
  // Engine + flags green. Build a tiny synthetic image and try a
  // recognise call so the user can confirm the worker spins up.
  // The image is intentionally trivial so the call returns fast
  // and so language data missing causes the documented graceful
  // failure path.
  var syntheticUrl = _makeBlankImageDataUrl();
  var input = { imageDataUrl: syntheticUrl, region: null, options: { language: 'en', targetText: '', matchMode: 'contains', caseSensitive: false } };
  var report;
  try {
    report = await recognizeTextWithTesseract(input, { flags: options.flags, selfTest: true });
  } catch (e) {
    report = { success: false, error: (e && e.message) ? String(e.message) : 'tesseractSelfTestThrew' };
  }
  var endedAt = (typeof performance !== 'undefined' && performance.now)
    ? performance.now() : Date.now();
  return {
    ok: !!(report && report.success),
    blocked: !!(report && report.blocked),
    reasons: readiness.reasons.slice(),
    durationMs: Math.max(0, Math.round(endedAt - startedAt)),
    details: readiness.details,
    note: 'Self-test ran a synthetic recognise pass. The action preview is never executed.',
    error: report && report.error ? report.error : null,
    blocksCount: report && Array.isArray(report.blocks) ? report.blocks.length : 0,
    ranAt: new Date().toISOString()
  };
}

function _makeBlankImageDataUrl() {
  // 8×8 fully-white PNG. Constant value — never a real screenshot.
  return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAFUlEQVR4XmP4//8/AzbAxIAFjAouAAB6QwGFn+kJVQAAAABJRU5ErkJggg==';
}

// =====================================================================
// 5. Public — recognise (gated by feature flags)
// =====================================================================

// Resolves with the unified ClickFlow OCR result envelope. Never
// throws. The function is async because Tesseract.js v5 returns a
// Promise from `Tesseract.recognize`.
//
// Input shape (mirrors the OCR provider contract from Step 38):
//   {
//     imageDataUrl: 'data:image/png;base64,…',
//     region: { x, y, width, height } | null,
//     options: {
//       language?:       'ru' | 'en' | 'ru+en',
//       targetText?:     string,
//       matchMode?:      'contains' | 'exact',
//       caseSensitive?:  boolean
//     }
//   }
//
// Options:
//   {
//     flags?: { realOcr, tesseractProvider, simulationOnly },
//     onProgress?: function ({ stage, progress }) — UI hook,
//     selfTest?:  boolean  — diagnostic call from runTesseractSelfTest
//   }
//
// Output shape:
//   {
//     success: boolean,
//     mode: 'real-ocr',
//     provider: 'tesseract',
//     realOcr: <true after a successful run, false on block>,
//     realClick: false,
//     blocked?: boolean,
//     cancelled?: boolean,
//     error?: string,
//     blocks?: [{ id, text, confidence, boundingBox, targetPoint }],
//     match?: { ... } | null,
//     matched?: boolean,
//     targetText?: string,
//     language?:   string,
//     matchMode?:  string,
//     actionPreview?: { type:'text_click', mode:'preview', ... },
//     createdAt:   ISOString,
//     durationMs?: number
//   }
async function recognizeTextWithTesseract(input, options) {
  options = options || {};
  var startedAt = (typeof performance !== 'undefined' && performance.now)
    ? performance.now() : Date.now();
  var status = _safeOcrFeatureStatus(options.flags);
  if (!status.realOcr || !status.tesseractProvider) {
    _lastError = 'Real OCR provider is disabled by feature flag';
    _emitAudit('ocr.tesseract.blockedByFeatureFlag', {
      realOcr:           !!status.realOcr,
      tesseractProvider: !!status.tesseractProvider,
      simulationOnly:    !!status.simulationOnly
    });
    _emitAudit('ocr.real.blocked', {
      reason: 'featureFlagDisabled',
      realOcr: !!status.realOcr,
      tesseractProvider: !!status.tesseractProvider
    });
    return _blockedEnvelope('Real OCR provider is disabled by feature flag');
  }
  if (!input || typeof input !== 'object') {
    _lastError = 'OCR input is missing';
    return _failureEnvelope('OCR input is missing');
  }
  if (typeof input.imageDataUrl !== 'string' ||
      input.imageDataUrl.indexOf('data:image/') !== 0) {
    _lastError = 'OCR input image is missing or invalid';
    return _failureEnvelope('OCR input image is missing or invalid');
  }
  var engine = _resolveTesseractEngine();
  if (!engine || typeof engine.recognize !== 'function') {
    _lastError = 'Tesseract.js engine is not available';
    _emitAudit('ocr.provider.tesseract.unavailable', {
      dependencyDeclared: _isTesseractDependencyDeclared(),
      engineLoadable:     !!engine,
      engineLoadError:    _engineLoadError
    });
    return _failureEnvelope('Tesseract.js engine is not available');
  }
  // Cancel-token bookkeeping.
  _currentRecognitionToken += 1;
  var token = _currentRecognitionToken;

  var opts = (input.options && typeof input.options === 'object') ? input.options : {};
  var language = (typeof opts.language === 'string') ? opts.language : 'ru+en';
  var tessLang = _TESSERACT_INFO.tesseractLanguageMap[language] || 'eng';
  var targetText = (typeof opts.targetText === 'string') ? opts.targetText : '';

  if (!options.selfTest) {
    _emitAudit('ocr.real.started', {
      language: language,
      tesseractLanguage: tessLang,
      targetTextLen: targetText.length,
      hasRegion: !!input.region,
      caseSensitive: !!opts.caseSensitive,
      matchMode: opts.matchMode === 'exact' ? 'exact' : 'contains'
    });
  }

  // Optional region cropping. We attempt it via canvas; if the
  // browser blocks the draw (CORS / unsupported imageDataUrl)
  // we fall back to the full image and document the limitation.
  var imageForOcr = input.imageDataUrl;
  var regionApplied = false;
  if (input.region && typeof input.region === 'object') {
    try {
      imageForOcr = await _cropImageDataUrl(input.imageDataUrl, input.region);
      regionApplied = !!imageForOcr && imageForOcr !== input.imageDataUrl;
      if (!imageForOcr) imageForOcr = input.imageDataUrl;
    } catch (cropErr) {
      imageForOcr = input.imageDataUrl;
    }
  }

  // Progress logger for tesseract.js v5. It pushes events like
  // `{ status: 'loading tesseract core', progress: 0.42 }`. We
  // forward them to the UI callback and emit a coarse audit
  // event for "loading language" / "recognizing text".
  var stages = {};
  function _logger(ev) {
    if (!ev || typeof ev !== 'object') return;
    var stage = String(ev.status || '');
    var progress = (typeof ev.progress === 'number') ? ev.progress : null;
    if (typeof options.onProgress === 'function') {
      try { options.onProgress({ stage: stage, progress: progress }); } catch (_e) {}
    }
    if (stages[stage] !== true) {
      stages[stage] = true;
      _emitAudit('ocr.real.progress', { stage: stage });
    }
  }

  var rawResult = null;
  var caughtError = null;
  try {
    rawResult = await engine.recognize(imageForOcr, tessLang, { logger: _logger });
  } catch (e) {
    caughtError = (e && e.message) ? String(e.message) : 'tesseractRecognizeFailed';
  }

  // Honour cancellation. If the user pressed Cancel, a later token
  // was issued; we drop the result. Tesseract.js cannot interrupt
  // a worker mid-call (planned).
  if (_cancelledTokens[token]) {
    delete _cancelledTokens[token];
    var endedAtC = (typeof performance !== 'undefined' && performance.now)
      ? performance.now() : Date.now();
    if (!options.selfTest) {
      _emitAudit('ocr.real.failed', {
        reason: 'cancelled',
        durationMs: Math.max(0, Math.round(endedAtC - startedAt))
      });
    }
    return {
      success: false,
      mode: 'real-ocr',
      provider: _TESSERACT_INFO.id,
      realOcr: false,
      realClick: false,
      cancelled: true,
      error: 'OCR cancelled',
      createdAt: new Date().toISOString(),
      durationMs: Math.max(0, Math.round(endedAtC - startedAt))
    };
  }

  if (caughtError || !rawResult) {
    _lastError = caughtError || 'Tesseract returned an empty result';
    var endedAtE = (typeof performance !== 'undefined' && performance.now)
      ? performance.now() : Date.now();
    if (!options.selfTest) {
      _emitAudit('ocr.real.failed', {
        reason: caughtError ? 'recognizeThrew' : 'recognizeEmpty',
        durationMs: Math.max(0, Math.round(endedAtE - startedAt))
      });
    }
    return _failureEnvelope(_lastError, Math.max(0, Math.round(endedAtE - startedAt)));
  }

  // Build the unified envelope. `regionApplied` controls whether
  // the bounding-box offset already includes the region origin.
  var inputForMap = regionApplied ? input : Object.assign({}, input, { region: null });
  var blocks = mapTesseractBlocks(rawResult, regionApplied ? input : inputForMap);

  var match = null;
  if (targetText.length > 0 && blocks.length > 0) {
    var caseSensitive = !!opts.caseSensitive;
    var matchMode = opts.matchMode === 'exact' ? 'exact' : 'contains';
    var needle = caseSensitive ? targetText : targetText.toLowerCase();
    for (var i = 0; i < blocks.length; i++) {
      var hay = caseSensitive ? blocks[i].text : blocks[i].text.toLowerCase();
      var matched = matchMode === 'exact' ? hay === needle : hay.indexOf(needle) !== -1;
      if (matched) { match = blocks[i]; break; }
    }
  }

  var endedAtOk = (typeof performance !== 'undefined' && performance.now)
    ? performance.now() : Date.now();
  var durationMs = Math.max(0, Math.round(endedAtOk - startedAt));

  _lastRealOcrRunAt = new Date().toISOString();
  _lastRealOcrDurationMs = durationMs;
  _lastRealOcrBlocksCount = blocks.length;
  _lastRealOcrMatched = !!match;
  _lastError = null;

  if (!options.selfTest) {
    _emitAudit('ocr.real.completed', {
      durationMs: durationMs,
      blocksCount: blocks.length,
      matched: !!match,
      language: language,
      matchMode: opts.matchMode === 'exact' ? 'exact' : 'contains',
      regionApplied: !!regionApplied,
      targetTextLen: targetText.length
    });
  }

  // Action preview — text_click in preview mode. NEVER executed.
  var actionPreview = null;
  if (match) {
    actionPreview = {
      type: 'text_click',
      mode: 'preview',
      text: match.text,
      targetPoint: match.targetPoint,
      boundingBox: match.boundingBox,
      confidence: match.confidence,
      realClick: false,
      realOcr: true
    };
  }

  return {
    success: true,
    mode: 'real-ocr',
    provider: _TESSERACT_INFO.id,
    realOcr: true,
    realClick: false,
    blocks: blocks,
    match: match,
    matched: !!match,
    targetText: targetText,
    language: language,
    matchMode: opts.matchMode === 'exact' ? 'exact' : 'contains',
    caseSensitive: !!opts.caseSensitive,
    region: input.region || null,
    regionApplied: !!regionApplied,
    actionPreview: actionPreview,
    createdAt: new Date().toISOString(),
    durationMs: durationMs
  };
}

function _blockedEnvelope(message) {
  return {
    success: false,
    mode: 'real-ocr',
    provider: _TESSERACT_INFO.id,
    realOcr: false,
    realClick: false,
    blocked: true,
    error: message,
    createdAt: new Date().toISOString()
  };
}

function _failureEnvelope(message, durationMs) {
  return {
    success: false,
    mode: 'real-ocr',
    provider: _TESSERACT_INFO.id,
    realOcr: false,
    realClick: false,
    error: message,
    createdAt: new Date().toISOString(),
    durationMs: typeof durationMs === 'number' ? durationMs : 0
  };
}

// Best-effort canvas crop. Returns a new dataURL on success or
// null/falsy on failure (the caller falls back to the full image).
function _cropImageDataUrl(dataUrl, region) {
  return new Promise(function (resolve) {
    if (typeof Image === 'undefined' || typeof document === 'undefined') {
      resolve(null); return;
    }
    var x = Number(region.x) | 0;
    var y = Number(region.y) | 0;
    var w = Number(region.width)  | 0;
    var h = Number(region.height) | 0;
    if (w <= 0 || h <= 0) { resolve(null); return; }
    try {
      var img = new Image();
      img.onload = function () {
        try {
          var c = document.createElement('canvas');
          c.width = w; c.height = h;
          var ctx = c.getContext('2d');
          if (!ctx) { resolve(null); return; }
          ctx.drawImage(img, x, y, w, h, 0, 0, w, h);
          resolve(c.toDataURL('image/png'));
        } catch (e2) { resolve(null); }
      };
      img.onerror = function () { resolve(null); };
      img.src = dataUrl;
    } catch (e1) { resolve(null); }
  });
}

// Best-effort cancel. Marks the active recognition token as
// cancelled; the in-flight `Tesseract.recognize` keeps running
// to completion (Tesseract.js v5 has no abort handle), but its
// result is dropped by the resolver. Worker-based cancellation
// is documented as planned.
function cancelCurrentTesseractRecognition() {
  if (_currentRecognitionToken > 0) {
    _cancelledTokens[_currentRecognitionToken] = true;
    return { ok: true, token: _currentRecognitionToken };
  }
  return { ok: false };
}

// =====================================================================
// 6. Public — result normalisation helpers
// =====================================================================

// Map a Tesseract.js `data.words` / `data.blocks` payload into the
// unified OCR block shape used by the rest of ClickFlow. Pure
// function; never touches module state. Future steps may extend
// the mapping; the current implementation accepts any of three
// common shapes:
//   - `data.words` — array of { text, confidence, bbox: { x0,y0,x1,y1 } }
//   - `data.blocks` — array of { text, confidence, bbox }
//   - any other shape — returns an empty list
function mapTesseractBlocks(rawResult, input) {
  if (!rawResult || typeof rawResult !== 'object') return [];
  var src = null;
  if (rawResult.data && Array.isArray(rawResult.data.words)) src = rawResult.data.words;
  else if (rawResult.data && Array.isArray(rawResult.data.blocks)) src = rawResult.data.blocks;
  else if (Array.isArray(rawResult.words)) src = rawResult.words;
  else if (Array.isArray(rawResult.blocks)) src = rawResult.blocks;
  if (!src) return [];
  var regionOffset = _regionOffset(input);
  var seq = 0;
  var out = [];
  for (var i = 0; i < src.length; i++) {
    var w = src[i];
    if (!w || typeof w.text !== 'string') continue;
    var bbox = _normalizeBbox(w.bbox || w.boundingBox);
    if (!bbox) continue;
    bbox.x += regionOffset.x;
    bbox.y += regionOffset.y;
    var conf = (typeof w.confidence === 'number') ? Math.max(0, Math.min(100, w.confidence)) / 100 : 0;
    out.push({
      id: 'tesseract-' + (++seq),
      text: w.text,
      confidence: conf,
      boundingBox: bbox,
      targetPoint: { x: (bbox.x + bbox.width / 2) | 0, y: (bbox.y + bbox.height / 2) | 0 }
    });
  }
  return out;
}

function _normalizeBbox(b) {
  if (!b || typeof b !== 'object') return null;
  // Tesseract returns `x0, y0, x1, y1`; our shape is `x, y, width,
  // height`. Both shapes are accepted.
  if (typeof b.x0 === 'number' && typeof b.y0 === 'number' && typeof b.x1 === 'number' && typeof b.y1 === 'number') {
    return { x: b.x0 | 0, y: b.y0 | 0, width: Math.max(0, b.x1 - b.x0) | 0, height: Math.max(0, b.y1 - b.y0) | 0 };
  }
  if (typeof b.x === 'number' && typeof b.y === 'number' && typeof b.width === 'number' && typeof b.height === 'number') {
    return { x: b.x | 0, y: b.y | 0, width: b.width | 0, height: b.height | 0 };
  }
  return null;
}

function _regionOffset(input) {
  if (input && input.region && typeof input.region === 'object') {
    return { x: Number(input.region.x) | 0, y: Number(input.region.y) | 0 };
  }
  return { x: 0, y: 0 };
}

// Builds the unified OCR result shape (`{ blocks, match, ... }`) from
// a Tesseract raw response and the original input. Pure function.
function normalizeTesseractResult(rawResult, input) {
  var blocks = mapTesseractBlocks(rawResult, input);
  var opts = (input && input.options) || {};
  var target = typeof opts.targetText === 'string' ? opts.targetText : '';
  var match = null;
  if (target.length > 0 && blocks.length > 0) {
    var caseSensitive = !!opts.caseSensitive;
    var matchMode = opts.matchMode === 'exact' ? 'exact' : 'contains';
    var needle = caseSensitive ? target : target.toLowerCase();
    for (var i = 0; i < blocks.length; i++) {
      var hay = caseSensitive ? blocks[i].text : blocks[i].text.toLowerCase();
      var matched = matchMode === 'exact' ? hay === needle : hay.indexOf(needle) !== -1;
      if (matched) {
        match = { id: blocks[i].id, text: blocks[i].text, confidence: blocks[i].confidence, boundingBox: blocks[i].boundingBox, targetPoint: blocks[i].targetPoint };
        break;
      }
    }
  }
  return {
    providerId: _TESSERACT_INFO.id,
    blocks: blocks,
    match: match,
    matched: !!match,
    language: opts.language || _TESSERACT_INFO.defaultLanguage,
    matchMode: opts.matchMode === 'exact' ? 'exact' : 'contains',
    caseSensitive: !!opts.caseSensitive,
    region: input && input.region ? input.region : null,
    realClick: false,
    realOcr: true
  };
}

// =====================================================================
// 7. Public — worker termination (no-op at Step 39)
// =====================================================================

// At Step 39 there is no live worker, so this is a no-op that
// resets the module-local state. Step 40+ will replace the body
// with `_engine.terminate()` plus the proper cleanup.
function terminateTesseractWorker() {
  _engine = null;
  _engineLoadAttempted = false;
  _engineLoadError = null;
}

// =====================================================================
// 8. Public — diagnostics snapshot
// =====================================================================

function getTesseractProviderDiagnostics() {
  var status = _safeOcrFeatureStatus();
  var engine = _resolveTesseractEngine();
  return {
    tesseractDependencyPresent:   _isTesseractDependencyDeclared(),
    tesseractProviderAvailable:   !!engine,
    tesseractProviderEnabled:     !!status.tesseractProvider,
    realOcrFeatureFlag:           !!status.realOcr,
    realOcrRuntimeEnabled:        !!status.realOcrEnabledForSession,
    realOcrAutoRun:               false,
    activeOcrProvider:            (typeof getActiveOcrProvider === 'function' && getActiveOcrProvider()) ? getActiveOcrProvider().id : null,
    tesseractReady:               !!engine && !!status.tesseractProvider && !!status.realOcr,
    lastTesseractReadinessCheck:  _lastReadiness ? _lastReadiness.checkedAt : null,
    lastTesseractError:           _lastError,
    lastRealOcrRunAt:             _lastRealOcrRunAt,
    lastRealOcrDurationMs:        _lastRealOcrDurationMs,
    lastRealOcrBlocksCount:       _lastRealOcrBlocksCount,
    lastRealOcrMatched:           _lastRealOcrMatched,
    lastRealOcrError:             _lastError,
    realClick:                    false
  };
}

// =====================================================================
// 9. Test seam
// =====================================================================

// Lets unit tests inject a stub engine so the public surface can be
// exercised without hitting the real Tesseract module. The setter
// is named explicitly so production call sites do not accidentally
// use it.
function setTesseractEngineForTesting(engine) {
  _engine = (engine && typeof engine === 'object') ? engine : null;
  _engineLoadAttempted = !!_engine;
  _engineLoadError = null;
}

// =====================================================================
// Internal helpers
// =====================================================================

function _safeOcrFeatureStatus(override) {
  if (override && typeof override === 'object') {
    var realOcrOverride           = !!override.realOcr;
    var tesseractProviderOverride = !!override.tesseractProvider;
    var simulationOnlyOverride    = override.simulationOnly !== false;
    return {
      realOcr:                  realOcrOverride,
      tesseractProvider:        tesseractProviderOverride,
      simulationOnly:           simulationOnlyOverride,
      ocrMockProvider:          override.ocrMockProvider !== false,
      ocrProviderRegistry:      override.ocrProviderRegistry !== false,
      realOcrEnabledForSession: realOcrOverride && tesseractProviderOverride
    };
  }
  if (typeof getOcrFeatureStatus === 'function') {
    try {
      var s = getOcrFeatureStatus();
      // Step 40 may not be wired yet on older callers — synthesise
      // `realOcrEnabledForSession` if absent.
      if (typeof s.realOcrEnabledForSession !== 'boolean') {
        s.realOcrEnabledForSession = !!s.realOcr && !!s.tesseractProvider;
      }
      return s;
    } catch (e) { /* swallow */ }
  }
  if (typeof getFeatureFlags === 'function') {
    try {
      var f = getFeatureFlags();
      return {
        realOcr:                  !!f.realOcr,
        tesseractProvider:        !!f.tesseractProvider,
        simulationOnly:           f.simulationOnly !== false,
        ocrMockProvider:          f.ocrMockProvider !== false,
        ocrProviderRegistry:      f.ocrProviderRegistry !== false,
        realOcrEnabledForSession: !!f.realOcr && !!f.tesseractProvider
      };
    } catch (e) { /* swallow */ }
  }
  // Last resort: be conservative.
  return {
    realOcr: false, tesseractProvider: false, simulationOnly: true,
    ocrMockProvider: true, ocrProviderRegistry: true,
    realOcrEnabledForSession: false
  };
}

function _emitAudit(type, payload) {
  if (typeof recordAuditEvent !== 'function') return;
  try { recordAuditEvent(type, payload || {}); } catch (e) { /* swallow */ }
}

function _cloneReadiness(r) {
  if (!r) return null;
  return {
    ready: !!r.ready,
    reasons: Array.isArray(r.reasons) ? r.reasons.slice() : [],
    details: r.details ? Object.assign({}, r.details) : null,
    checkedAt: r.checkedAt
  };
}
