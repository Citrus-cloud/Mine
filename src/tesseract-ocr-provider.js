// =====================================================================
// ClickFlow — src/tesseract-ocr-provider.js (Step 39)
// ---------------------------------------------------------------------
// Real OCR provider shell — Phase 1.
//
// Step 39 ships the `tesseract.js` dependency declaration in
// `package.json` and this provider module. The provider is
// **defensive by design**: it works whether or not `tesseract.js` is
// actually present in `node_modules`, and it refuses to do any OCR
// when the OCR safety flags say so.
//
// SAFETY (Step 39):
//   - This module NEVER auto-runs OCR. Every entry point that could
//     touch the engine starts with a flag check
//     (`getOcrFeatureStatus` from `src/feature-flags.js`).
//   - This module NEVER `require()`s tesseract.js statically. The
//     dependency is loaded lazily through a tiny adapter so a missing
//     install reports `unavailable` instead of crashing the renderer.
//   - This module NEVER opens a new IPC channel.
//   - This module NEVER stores `imageDataUrl` outside the local
//     scope of a single recognise call. Pixel data is consumed by
//     `Tesseract.recognize` and discarded; nothing is written to
//     disk.
//   - This module NEVER moves the cursor, NEVER presses a key, and
//     NEVER emits a `realClick: true` action. The renderer's action
//     pipeline still rejects every `realClick: true` outright.
//   - The OCR safety flags `realOcr` and `tesseractProvider` are
//     hard-coded `false` at Step 39. There is no UI to toggle them.
//
// Public surface:
//   - getTesseractProviderInfo()
//   - isTesseractProviderAvailable()
//   - checkTesseractProviderReadiness(flags?)
//   - runTesseractSelfTest(options?)
//   - recognizeTextWithTesseract(input, options?)
//   - normalizeTesseractResult(rawResult, input)
//   - mapTesseractBlocks(rawResult, input)
//   - terminateTesseractWorker()
//   - getTesseractProviderDiagnostics()
//   - setTesseractEngineForTesting(engine)   // unit-test seam
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

// At Step 39 the self-test does NOT execute real OCR. It exercises
// the provider envelope: it confirms the engine reference can be
// resolved (when allowed), it asserts the public surface is intact,
// and it returns a structured report. This keeps the manual button
// safe even if a future debug build temporarily flips the flags.
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
function runTesseractSelfTest(options) {
  options = options || {};
  var startedAt = (typeof performance !== 'undefined' && performance.now)
    ? performance.now() : Date.now();
  var readiness = checkTesseractProviderReadiness(options.flags);
  // We refuse to run any OCR even if `readiness.ready === true`.
  // Step 39 is the dependency-and-shell phase; running a real
  // recognise call is the responsibility of Step 40.
  var endedAt = (typeof performance !== 'undefined' && performance.now)
    ? performance.now() : Date.now();
  return {
    ok: false,
    blocked: !readiness.ready || true,
    reasons: readiness.reasons.slice(),
    durationMs: Math.max(0, Math.round(endedAt - startedAt)),
    details: readiness.details,
    note: 'Step 39 self-test does not execute real OCR. The dependency is declared and the provider is wired, but recognition stays disabled until Step 40+.',
    ranAt: new Date().toISOString()
  };
}

// =====================================================================
// 5. Public — recognise (BLOCKED at Step 39)
// =====================================================================

// `recognizeTextWithTesseract(input, options)` is the entry point a
// future Step-40 dispatcher would call. At Step 39 it returns a
// blocked envelope every time, even with the engine present, because
// the safety flags say so.
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
// Output shape:
//   {
//     success: boolean,
//     blocked?: boolean,        // present when refused for safety
//     error?: string,
//     blocks?: [{ id, text, confidence, boundingBox, targetPoint }],
//     match?: { id, text, confidence, boundingBox, targetPoint } | null,
//     durationMs?: number,
//     providerId: 'tesseract',
//     realClick: false,
//     realOcr: <true only when actually run>
//   }
function recognizeTextWithTesseract(input, options) {
  options = options || {};
  var status = _safeOcrFeatureStatus(options.flags);
  if (!status.realOcr || !status.tesseractProvider || status.simulationOnly) {
    _lastError = 'Real OCR provider is disabled by feature flag';
    _emitAudit('ocr.tesseract.blockedByFeatureFlag', {
      realOcr:           !!status.realOcr,
      tesseractProvider: !!status.tesseractProvider,
      simulationOnly:    !!status.simulationOnly
    });
    return {
      success: false,
      blocked: true,
      error: 'Real OCR provider is disabled by feature flag',
      providerId: _TESSERACT_INFO.id,
      realClick: false,
      realOcr: false
    };
  }
  // Even if the flags were flipped in source, we still refuse at
  // Step 39 because the engine wiring is not finished. This keeps
  // a single hard-stop in the codebase.
  var engine = _resolveTesseractEngine();
  if (!engine) {
    _lastError = 'Tesseract.js engine is not available';
    _emitAudit('ocr.provider.tesseract.unavailable', {
      dependencyDeclared: _isTesseractDependencyDeclared(),
      engineLoadable: false,
      engineLoadError: _engineLoadError
    });
    return {
      success: false,
      blocked: false,
      error: 'Tesseract.js engine is not available',
      providerId: _TESSERACT_INFO.id,
      realClick: false,
      realOcr: false
    };
  }
  // The Step-40 happy path lives behind this guard. For now we
  // refuse defensively so a buggy debug build cannot run real OCR
  // without a fresh review.
  _lastError = 'Real OCR execution is not enabled in this build (Step 39 — Phase 1)';
  _emitAudit('ocr.provider.tesseract.unavailable', {
    dependencyDeclared: _isTesseractDependencyDeclared(),
    engineLoadable: true,
    reason: 'phase1NotReady'
  });
  return {
    success: false,
    blocked: true,
    error: _lastError,
    providerId: _TESSERACT_INFO.id,
    realClick: false,
    realOcr: false
  };
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
    realOcrAutoRun:               false,
    activeOcrProvider:            (typeof getActiveOcrProvider === 'function' && getActiveOcrProvider()) ? getActiveOcrProvider().id : null,
    lastTesseractReadinessCheck:  _lastReadiness ? _lastReadiness.checkedAt : null,
    lastTesseractError:           _lastError,
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
    return {
      realOcr:             !!override.realOcr,
      tesseractProvider:   !!override.tesseractProvider,
      simulationOnly:      override.simulationOnly !== false,
      ocrMockProvider:     override.ocrMockProvider !== false,
      ocrProviderRegistry: override.ocrProviderRegistry !== false
    };
  }
  if (typeof getOcrFeatureStatus === 'function') {
    try { return getOcrFeatureStatus(); } catch (e) { /* swallow */ }
  }
  if (typeof getFeatureFlags === 'function') {
    try {
      var f = getFeatureFlags();
      return {
        realOcr:             !!f.realOcr,
        tesseractProvider:   !!f.tesseractProvider,
        simulationOnly:      f.simulationOnly !== false,
        ocrMockProvider:     f.ocrMockProvider !== false,
        ocrProviderRegistry: f.ocrProviderRegistry !== false
      };
    } catch (e) { /* swallow */ }
  }
  // Last resort: be conservative.
  return {
    realOcr: false, tesseractProvider: false, simulationOnly: true,
    ocrMockProvider: true, ocrProviderRegistry: true
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
