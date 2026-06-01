// =====================================================================
// ClickFlow — src/ocr-provider-registry.js (Step 38, extended at Step 39)
// ---------------------------------------------------------------------
// Pure-renderer module that holds the OCR provider registry.
//
// At Step 39 the registry knows two providers:
//   1. `mock`      — implemented (Step 32). Always active by default.
//   2. `tesseract` — Phase-1 shell (Step 39). The dependency is
//                    declared in `package.json` and the provider
//                    module ships in `src/tesseract-ocr-provider.js`,
//                    but selection stays BLOCKED unless BOTH the
//                    `realOcr` AND `tesseractProvider` feature flags
//                    are true. Both flags are hard-coded `false` in
//                    `src/feature-flags.js`.
//
// SAFETY (Step 39):
//   - This module NEVER runs OCR.
//   - This module NEVER imports `tesseract`, `tesseract.js`,
//     `tesseract-ocr`, `node-tesseract-ocr`, OpenCV, sharp, jimp,
//     pixelmatch, looks-same, robotjs, nut.js, iohook, uiohook-napi,
//     or any other prohibited module. It dispatches via the renderer
//     globals exposed by `src/tesseract-ocr-provider.js`.
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
//   - getTesseractProviderStatus()           // Step 39
//   - isRealOcrProviderRegistered()
//   - runOcrProviderSelfTest()
//   - runActiveOcrProvider(input)            // thin dispatcher
// =====================================================================

'use strict';

// Frozen base provider definitions. The dynamic state — whether the
// tesseract entry is currently selectable — is computed at read-time
// from the feature flags + the Step-39 provider shell.
var _PROVIDERS = Object.freeze([
  Object.freeze({
    id: 'mock',
    name: 'Mock OCR Provider',
    type: 'mock',
    available: true,
    realOcr: false,
    active: true,
    planned: false,
    enabledByFeatureFlag: true,
    disabledReason: null
  }),
  Object.freeze({
    id: 'tesseract',
    name: 'Tesseract OCR Provider',
    type: 'real',
    // Base availability is `false`; the real value is computed by
    // `_isTesseractSelectable()` from the feature flags + the
    // Step-39 provider shell.
    available: false,
    realOcr: true,
    active: false,
    planned: false,
    enabledByFeatureFlag: false,
    disabledReason: 'Tesseract OCR provider is installed but disabled by feature flag'
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
  // Compute Step-39 dynamic fields. The base entry holds the safe
  // defaults; here we project the runtime view used by the UI.
  var available, enabledByFeatureFlag, disabledReason;
  if (p.id === 'tesseract') {
    var sel = _evaluateTesseractSelectability();
    available = sel.selectable;
    enabledByFeatureFlag = sel.flagsAllow;
    disabledReason = sel.reasonText || p.disabledReason;
  } else {
    available = !!p.available;
    enabledByFeatureFlag = !!p.enabledByFeatureFlag;
    disabledReason = p.disabledReason || null;
  }
  return {
    id: p.id,
    name: p.name,
    type: p.type,
    available: available,
    realOcr: !!p.realOcr,
    active: p.id === _activeProviderId && available,
    planned: !!p.planned,
    enabledByFeatureFlag: enabledByFeatureFlag,
    disabledReason: disabledReason
  };
}

// Step 39 helper. Tesseract is selectable only when:
//   - `realOcr` flag is true,
//   - `tesseractProvider` flag is true,
//   - the provider shell reports the engine as loadable.
// Returns:
//   {
//     selectable: boolean,
//     flagsAllow: boolean,
//     engineLoadable: boolean,
//     reason: stableId | null,
//     reasonText: string | null
//   }
function _evaluateTesseractSelectability() {
  var status = (typeof getOcrFeatureStatus === 'function')
    ? getOcrFeatureStatus()
    : { realOcr: false, tesseractProvider: false, simulationOnly: true };
  var flagsAllow = !!status.realOcr && !!status.tesseractProvider && status.simulationOnly !== true;
  var engineLoadable = (typeof isTesseractProviderAvailable === 'function')
    ? !!isTesseractProviderAvailable() : false;
  var selectable = flagsAllow && engineLoadable;
  var reason = null;
  var reasonText = null;
  if (!flagsAllow) {
    reason = 'realOcrBlockedByFeatureFlag';
    reasonText = 'Tesseract OCR provider is installed but disabled by feature flag';
  } else if (!engineLoadable) {
    reason = 'tesseractEngineNotLoadable';
    reasonText = 'Tesseract OCR provider is enabled but the engine is not loadable in this build';
  }
  return {
    selectable: selectable,
    flagsAllow: flagsAllow,
    engineLoadable: engineLoadable,
    reason: reason,
    reasonText: reasonText
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
  // Step 39: real providers are gated by both the umbrella `realOcr`
  // flag and the per-provider `tesseractProvider` flag. Without both
  // the selection is BLOCKED. The active provider stays `mock`.
  if (target.realOcr || target.type === 'real') {
    var sel = (target.id === 'tesseract')
      ? _evaluateTesseractSelectability()
      : { selectable: false, flagsAllow: false, engineLoadable: false, reason: 'realOcrBlocked' };
    if (!sel.selectable) {
      var blockReason = sel.reason === 'tesseractEngineNotLoadable'
        ? 'tesseractEngineNotLoadable'
        : 'realOcrBlockedByFeatureFlag';
      _emitAudit('ocr.provider.selection.blocked', {
        requestedId: target.id,
        reason: blockReason,
        flagsAllow: !!sel.flagsAllow,
        engineLoadable: !!sel.engineLoadable
      });
      _emitAudit('ocr.provider.real.unavailable', {
        requestedId: target.id,
        flagsAllow: !!sel.flagsAllow,
        engineLoadable: !!sel.engineLoadable
      });
      // Backwards-compat: keep the historical `realOcrBlocked`
      // error id for tests / callers that already check it.
      return {
        ok: false,
        error: {
          id: 'realOcrBlocked',
          reason: blockReason,
          message: blockReason === 'tesseractEngineNotLoadable'
            ? 'Tesseract OCR provider is enabled but the engine is not loadable in this build.'
            : 'Real OCR providers are disabled by feature flag. Mock provider remains active.'
        }
      };
    }
    // Flags + engine both allow it — accept the switch. Step 40+
    // will exercise this branch; at Step 39 the flags refuse, so
    // we never reach here in production.
  }
  if (target.id !== 'tesseract' && !target.available) {
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
// Step 42 — `realOcrEnabled` now reflects the runtime
// (session-scoped) opt-in. `realOcrAllowed` retains the umbrella
// safety semantics (false when `simulationOnly: true`). Call
// sites that drive recognition use `realOcrEnabled`; call sites
// that describe the umbrella safety stance use `realOcrAllowed`.
function getOcrProviderRegistryStatus() {
  var providers = getOcrProviders();
  var mock = providers.filter(function (p) { return p.id === 'mock'; })[0] || null;
  var tess = providers.filter(function (p) { return p.id === 'tesseract'; })[0] || null;
  var active = getActiveOcrProvider();
  var contract = (typeof getOcrProviderContract === 'function')
    ? getOcrProviderContract()
    : null;
  var ocrFeatureSnapshot = (typeof getOcrFeatureStatus === 'function')
    ? getOcrFeatureStatus() : null;
  var realOcrEnabled = !!(ocrFeatureSnapshot && ocrFeatureSnapshot.realOcrEnabledForSession);
  return {
    activeProviderId:           active ? active.id : null,
    activeProviderName:         active ? active.name : null,
    mockProviderAvailable:      !!(mock && mock.available),
    tesseractProviderAvailable: !!(tess && tess.available),
    tesseractProviderEnabled:   !!(tess && tess.enabledByFeatureFlag),
    realOcrEnabled:             realOcrEnabled,
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

// Step 39 — Tesseract-specific status for the OCR readiness card +
// diagnostics line. Combines the registry view of the provider with
// the live shell readiness.
function getTesseractProviderStatus() {
  var entry = null;
  for (var i = 0; i < _PROVIDERS.length; i++) {
    if (_PROVIDERS[i].id === 'tesseract') { entry = _PROVIDERS[i]; break; }
  }
  if (!entry) {
    return {
      registered: false,
      available: false,
      enabledByFeatureFlag: false,
      realOcr: true,
      disabledReason: 'Tesseract entry not registered'
    };
  }
  var sel = _evaluateTesseractSelectability();
  var diag = (typeof getTesseractProviderDiagnostics === 'function')
    ? getTesseractProviderDiagnostics() : null;
  return {
    registered: true,
    available: sel.selectable,
    enabledByFeatureFlag: sel.flagsAllow,
    engineLoadable: sel.engineLoadable,
    realOcr: true,
    name: entry.name,
    type: entry.type,
    disabledReason: sel.reasonText || entry.disabledReason,
    dependencyDeclared: diag ? !!diag.tesseractDependencyPresent : true,
    realOcrFeatureFlag: diag ? !!diag.realOcrFeatureFlag : false,
    tesseractProviderFlag: diag ? !!diag.tesseractProviderEnabled : false,
    realOcrAutoRun: false,
    activeProviderId: _activeProviderId,
    lastReadinessCheck: diag ? diag.lastTesseractReadinessCheck : null,
    lastError: diag ? diag.lastTesseractError : null,
    realClick: false
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

// True iff a real provider is BOTH registered AND currently available
// per the runtime feature flags. At Step 39 this is `true` only when
// the flags are flipped AND the engine is loadable, which by design
// never happens in the production build.
function isRealOcrProviderRegistered() {
  for (var i = 0; i < _PROVIDERS.length; i++) {
    if (!_PROVIDERS[i].realOcr) continue;
    var clone = _cloneProvider(_PROVIDERS[i]);
    if (clone.available) return true;
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
