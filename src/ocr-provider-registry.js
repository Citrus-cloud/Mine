// =====================================================================
// ClickFlow — src/ocr-provider-registry.js (Step 38)
// ---------------------------------------------------------------------
// Pure-renderer module that holds the OCR provider registry.
//
// At Step 38 the registry knows two providers:
//   1. `mock`      — implemented (Step 32). Always active.
//   2. `tesseract` — PLANNED. Marked unavailable. Selecting it via
//                    `setActiveOcrProvider('tesseract')` is BLOCKED
//                    and emits an audit event.
//
// SAFETY (Step 38):
//   - This module NEVER runs OCR. It does not import the mock engine
//     directly — it only references it indirectly via the global
//     `runMockOcr` symbol the renderer already loads.
//   - This module NEVER imports `tesseract`, `tesseract.js`,
//     `tesseract-ocr`, `node-tesseract-ocr`, OpenCV, sharp, jimp,
//     pixelmatch, looks-same, robotjs, nut.js, iohook, uiohook-napi,
//     or any other prohibited module.
//   - This module NEVER opens a new IPC channel.
//   - Self-test runs the mock provider only and uses pre-cooked
//     metadata. No screenshot is captured during the self-test.
//
// Public surface:
//   - getOcrProviders()
//   - getOcrProviderById(id)
//   - getActiveOcrProvider()
//   - setActiveOcrProvider(id)
//   - getOcrProviderRegistryStatus()
//   - isRealOcrProviderRegistered()
//   - runOcrProviderSelfTest()
//   - runActiveOcrProvider(input)            // thin dispatcher
// =====================================================================

'use strict';

// Frozen provider definitions. Mutating these is impossible by
// design — `getOcrProviders()` returns deep copies.
var _PROVIDERS = Object.freeze([
  Object.freeze({
    id: 'mock',
    name: 'Mock OCR Provider',
    type: 'mock',
    available: true,
    realOcr: false,
    active: true,
    planned: false,
    disabledReason: null
  }),
  Object.freeze({
    id: 'tesseract',
    name: 'Tesseract OCR Provider',
    type: 'real',
    available: false,
    realOcr: true,
    active: false,
    planned: true,
    disabledReason: 'Real OCR is not connected in this build'
  })
]);

// Module-local mutable state. Only the active provider id can change
// at runtime, and only via `setActiveOcrProvider`. The registry
// content itself is frozen.
var _activeProviderId = 'mock';
var _lastSelfTest = null;          // last self-test report (or null)
var _registryReady = true;          // sanity flag for diagnostics

// =====================================================================
// 1. getOcrProviders()
// =====================================================================

function getOcrProviders() {
  return _PROVIDERS.map(_cloneProvider);
}

function _cloneProvider(p) {
  return {
    id: p.id,
    name: p.name,
    type: p.type,
    available: !!p.available,
    realOcr: !!p.realOcr,
    active: p.id === _activeProviderId && !!p.available,
    planned: !!p.planned,
    disabledReason: p.disabledReason || null
  };
}

// =====================================================================
// 2. getOcrProviderById(id)
// =====================================================================

function getOcrProviderById(id) {
  if (typeof id !== 'string' || id.length === 0) return null;
  for (var i = 0; i < _PROVIDERS.length; i++) {
    if (_PROVIDERS[i].id === id) return _cloneProvider(_PROVIDERS[i]);
  }
  return null;
}

// =====================================================================
// 3. getActiveOcrProvider()
// =====================================================================

function getActiveOcrProvider() {
  return getOcrProviderById(_activeProviderId);
}

// =====================================================================
// 4. setActiveOcrProvider(id)
// =====================================================================

// Returns:
//   { ok: true,  provider }
//   { ok: false, error: { id: stableId, message } }
//
// Stable error IDs:
//   - providerNotFound
//   - providerUnavailable
//   - realOcrBlocked            // attempted to switch to a real provider
function setActiveOcrProvider(id) {
  var target = null;
  for (var i = 0; i < _PROVIDERS.length; i++) {
    if (_PROVIDERS[i].id === id) { target = _PROVIDERS[i]; break; }
  }
  if (!target) {
    _emitAudit('ocr.provider.selection.blocked', { requestedId: String(id || ''), reason: 'providerNotFound' });
    return { ok: false, error: { id: 'providerNotFound', message: 'Unknown OCR provider id.' } };
  }
  // Hard-stop: any "real" provider is blocked at Step 38.
  if (target.realOcr || target.type === 'real') {
    _emitAudit('ocr.provider.selection.blocked', {
      requestedId: target.id, reason: 'realOcrBlocked', planned: !!target.planned
    });
    _emitAudit('ocr.provider.real.unavailable', {
      requestedId: target.id, planned: !!target.planned
    });
    return {
      ok: false,
      error: {
        id: 'realOcrBlocked',
        message: 'Real OCR providers are not connected in this build. Mock provider remains active.'
      }
    };
  }
  if (!target.available) {
    _emitAudit('ocr.provider.selection.blocked', { requestedId: target.id, reason: 'providerUnavailable' });
    return {
      ok: false,
      error: { id: 'providerUnavailable', message: 'Provider is not available.' }
    };
  }
  _activeProviderId = target.id;
  if (target.id === 'mock') {
    _emitAudit('ocr.provider.mock.active', {});
  }
  return { ok: true, provider: _cloneProvider(target) };
}

// =====================================================================
// 5. getOcrProviderRegistryStatus()
// =====================================================================

// Returns the diagnostics-shaped snapshot of the whole registry.
function getOcrProviderRegistryStatus() {
  var providers = getOcrProviders();
  var mock = providers.filter(function (p) { return p.id === 'mock'; })[0] || null;
  var tess = providers.filter(function (p) { return p.id === 'tesseract'; })[0] || null;
  var active = getActiveOcrProvider();
  var contract = (typeof getOcrProviderContract === 'function')
    ? getOcrProviderContract()
    : null;
  return {
    activeProviderId:           active ? active.id : null,
    activeProviderName:         active ? active.name : null,
    mockProviderAvailable:      !!(mock && mock.available),
    tesseractProviderAvailable: !!(tess && tess.available),
    realOcrEnabled:             false,                // hard-coded false at Step 38
    realOcrAllowed:             _isRealOcrAllowedFromFlags(),
    supportedLanguages:         contract ? contract.supportedLanguages.slice() : ['ru', 'en', 'ru+en'],
    supportedProviders:         contract ? contract.supportedProviders.slice() : ['mock'],
    plannedProviders:           contract ? contract.plannedProviders.slice() : ['tesseract'],
    lastProviderSelfTest:       _lastSelfTest ? _cloneSelfTest(_lastSelfTest) : null,
    providerRegistryReady:      !!_registryReady,
    storesImages:               false,
    requiresUserAction:         true,
    realClick:                  false
  };
}

function _isRealOcrAllowedFromFlags() {
  if (typeof getFeatureFlags !== 'function') return false;
  if (typeof isRealOcrAllowed !== 'function') return false;
  try {
    return !!isRealOcrAllowed(getFeatureFlags(), null);
  } catch (e) {
    return false;
  }
}

// =====================================================================
// 6. isRealOcrProviderRegistered()
// =====================================================================

// True iff a real provider is BOTH registered AND available. At
// Step 38 this is ALWAYS false (the tesseract entry is unavailable).
function isRealOcrProviderRegistered() {
  for (var i = 0; i < _PROVIDERS.length; i++) {
    if (_PROVIDERS[i].realOcr && _PROVIDERS[i].available) return true;
  }
  return false;
}

// =====================================================================
// 7. runOcrProviderSelfTest()
// =====================================================================

// Runs a synthetic check against the mock provider. The self-test:
//   - builds a fake screen-preview metadata object (no pixels);
//   - validates it against the provider input contract;
//   - calls `runMockOcr` if available;
//   - asserts the result envelope is well-formed.
//
// Returns:
//   {
//     ok: boolean,
//     providerId: 'mock',
//     durationMs: number,
//     errors: [stableId],
//     details: {
//       inputValid: boolean,
//       resultShapeOk: boolean,
//       blocksCount: number,
//       matched: boolean | null
//     },
//     ranAt: ISOString
//   }
function runOcrProviderSelfTest() {
  _emitAudit('ocr.provider.selftest.started', { providerId: 'mock' });
  var startedAt = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
  var errors = [];
  var details = { inputValid: false, resultShapeOk: false, blocksCount: 0, matched: null };

  // Build a synthetic input. NO pixel data is involved.
  var input = {
    screenPreview: {
      sourceId: 'self-test',
      name: 'Self-test preview',
      width: 1280, height: 720,
      capturedAt: new Date().toISOString()
    },
    targetText: 'Continue',
    options: {
      language: 'ru+en',
      matchMode: 'contains',
      caseSensitive: false,
      region: null,
      requestId: 'selftest-' + Date.now().toString(36)
    }
  };

  // Step A: validate against the provider interface.
  if (typeof validateOcrProviderInput === 'function') {
    var v = validateOcrProviderInput(input);
    details.inputValid = !!(v && v.valid);
    if (!details.inputValid) {
      errors.push('inputInvalid');
      Array.prototype.push.apply(errors, (v && Array.isArray(v.errors)) ? v.errors : []);
    }
  } else {
    errors.push('interfaceMissing');
  }

  // Step B: run the mock engine through the existing Step-32 surface.
  // We adapt the input shape: the mock engine expects
  //   createOcrInput(screenPreview, region, options)
  // followed by `runMockOcr(input)`.
  var mockResult = null;
  if (errors.length === 0) {
    if (typeof createOcrInput !== 'function' || typeof runMockOcr !== 'function') {
      errors.push('mockEngineMissing');
    } else {
      try {
        var legacyInput = createOcrInput(input.screenPreview, input.options.region, {
          targetText: input.targetText,
          language: input.options.language,
          matchMode: input.options.matchMode,
          caseSensitive: input.options.caseSensitive
        });
        mockResult = runMockOcr(legacyInput);
      } catch (e) {
        errors.push('mockEngineThrew');
      }
    }
  }

  // Step C: assert the result envelope is well-formed.
  if (mockResult && typeof mockResult === 'object') {
    var hasBlocks = Array.isArray(mockResult.blocks);
    var hasMatchedFlag = typeof mockResult.matched === 'boolean';
    details.resultShapeOk = hasBlocks && hasMatchedFlag;
    details.blocksCount = hasBlocks ? mockResult.blocks.length : 0;
    details.matched = hasMatchedFlag ? mockResult.matched : null;
    if (!details.resultShapeOk) errors.push('mockEngineShape');
  } else if (errors.length === 0) {
    errors.push('mockEngineEmpty');
  }

  var endedAt = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
  var report = {
    ok: errors.length === 0,
    providerId: 'mock',
    durationMs: Math.max(0, Math.round(endedAt - startedAt)),
    errors: errors,
    details: details,
    ranAt: new Date().toISOString()
  };
  _lastSelfTest = report;
  if (report.ok) {
    _emitAudit('ocr.provider.selftest.completed', {
      providerId: 'mock',
      durationMs: report.durationMs,
      blocksCount: details.blocksCount,
      matched: details.matched === true
    });
  } else {
    _emitAudit('ocr.provider.selftest.failed', {
      providerId: 'mock',
      durationMs: report.durationMs,
      errorsCount: errors.length,
      firstError: errors[0] || null
    });
  }
  return _cloneSelfTest(report);
}

// =====================================================================
// 8. runActiveOcrProvider(input)
// =====================================================================

// Thin dispatcher. At Step 38 it always routes to the mock engine.
// Future steps swap this for the real provider behind the
// `realOcr` flag — but only after the registry registers a real
// provider, which Step 38 deliberately does not do.
//
// Returns the legacy mock-engine result (for backwards
// compatibility with `text_click` / Test OCR / `runMockOcr`-based
// call sites). The provider envelope from
// `createOcrProviderResult` is exposed via `runOcrProviderSelfTest`
// for the architecture-only surfaces.
function runActiveOcrProvider(input) {
  var active = getActiveOcrProvider();
  if (!active || active.id !== 'mock') {
    // Defensive: the registry should never let us reach this
    // branch at Step 38. If we do, we still refuse to run anything
    // real and fall back to the mock.
    _emitAudit('ocr.provider.real.unavailable', {
      requestedId: active ? active.id : null
    });
  }
  if (typeof runMockOcr !== 'function') return null;
  return runMockOcr(input);
}

// =====================================================================
// Internal helpers
// =====================================================================

function _emitAudit(type, payload) {
  if (typeof recordAuditEvent !== 'function') return;
  try { recordAuditEvent(type, payload || {}); } catch (e) { /* swallow */ }
}

function _cloneSelfTest(r) {
  if (!r) return null;
  return {
    ok: !!r.ok,
    providerId: r.providerId,
    durationMs: typeof r.durationMs === 'number' ? r.durationMs : null,
    errors: Array.isArray(r.errors) ? r.errors.slice() : [],
    details: r.details ? {
      inputValid: !!r.details.inputValid,
      resultShapeOk: !!r.details.resultShapeOk,
      blocksCount: r.details.blocksCount | 0,
      matched: typeof r.details.matched === 'boolean' ? r.details.matched : null
    } : null,
    ranAt: r.ranAt
  };
}
