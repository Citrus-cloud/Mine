// =====================================================================
// ClickFlow — src/ocr-provider-interface.js (Step 38)
// ---------------------------------------------------------------------
// Pure-renderer module that formalises the OCR-provider contract.
//
// Step 38 is "Real OCR Research + Safe Integration Plan". We do NOT
// connect a real OCR engine in this build. Instead we describe the
// shape every future provider must satisfy, so the existing mock
// engine and the planned Tesseract provider can sit behind the same
// surface.
//
// SAFETY (Step 38):
//   - This module NEVER runs OCR. It defines and validates shapes.
//   - This module NEVER imports `tesseract`, `tesseract.js`,
//     `tesseract-ocr`, `node-tesseract-ocr`, OpenCV, sharp, jimp,
//     pixelmatch, looks-same, robotjs, nut.js, iohook, uiohook-napi,
//     or any other prohibited module.
//   - This module NEVER opens a new IPC channel.
//   - This module NEVER stores `imageDataUrl`. The OCR input shape
//     is reused from the existing Step-32 pipeline (preview metadata
//     + an optional region rectangle), and we explicitly strip
//     anything that smells like pixel data from the validated input.
//   - `isRealOcrAllowed(flags, settings)` is hard-coded to return
//     `false` at Step 38, regardless of the feature-flag values.
//
// Public surface:
//   - createOcrProviderResult(success, data, error)
//   - validateOcrProviderInput(input)
//   - normalizeOcrProviderOptions(options)
//   - getOcrProviderContract()
//   - getSupportedOcrLanguages()
//   - isRealOcrAllowed(flags, settings)
//   - createOcrProviderStatus(provider)
// =====================================================================

'use strict';

// Stable list of languages that EVERY provider must accept.
// The mock engine already accepts these three; the future Tesseract
// provider will need to load `eng.traineddata` / `rus.traineddata`
// before it can claim support.
var _SUPPORTED_OCR_LANGUAGES = Object.freeze(['ru', 'en', 'ru+en']);
var _SUPPORTED_MATCH_MODES   = Object.freeze(['contains', 'exact']);

// Stable list of provider IDs that the registry knows about. Only
// `mock` is implemented at Step 38. Other entries are PLANNED.
var _SUPPORTED_PROVIDERS = Object.freeze(['mock']);
var _PLANNED_PROVIDERS   = Object.freeze(['tesseract']);

// Stable error IDs returned by `validateOcrProviderInput`.
var OCR_PROVIDER_ERROR_IDS = Object.freeze({
  InputMissing:       'inputMissing',
  ScreenPreviewMissing: 'screenPreviewMissing',
  ScreenPreviewSizeMissing: 'screenPreviewSizeMissing',
  TargetTextMissing:  'targetTextMissing',
  TargetTextTooLong:  'targetTextTooLong',
  LanguageInvalid:    'languageInvalid',
  MatchModeInvalid:   'matchModeInvalid',
  RegionInvalid:      'regionInvalid',
  RegionOutOfBounds:  'regionOutOfBounds',
  PixelDataNotAllowed: 'pixelDataNotAllowed'
});

// Maximum target text length we accept. Mirrors the Step-32 limit so
// behaviour is consistent across providers.
var _MAX_TARGET_TEXT_LEN = 200;

// =====================================================================
// 1. createOcrProviderResult(success, data, error)
// =====================================================================

// Wraps a provider response in a stable envelope. Every provider —
// including the mock — must return one of these. The wrapper is
// deliberately minimal: it does not hold pixel data, and it does not
// hold the full target text (callers can correlate via `requestId`).
//
// Returns:
//   {
//     success: boolean,
//     data: object | null,
//     error: { id: string, message?: string } | null,
//     createdAt: ISOString
//   }
function createOcrProviderResult(success, data, error) {
  var ok = success === true;
  var result = {
    success: ok,
    data: ok ? _sanitizeProviderData(data) : null,
    error: ok ? null : _sanitizeProviderError(error),
    createdAt: new Date().toISOString()
  };
  return result;
}

function _sanitizeProviderData(data) {
  if (!data || typeof data !== 'object') return null;
  // Whitelist only the fields the consumer is allowed to see.
  // We deliberately drop `imageDataUrl` / pixel buffers / raw
  // screenshots even if a buggy provider attaches them.
  var clean = {};
  if (typeof data.providerId   === 'string') clean.providerId   = data.providerId;
  if (typeof data.providerName === 'string') clean.providerName = data.providerName;
  if (typeof data.requestId    === 'string') clean.requestId    = data.requestId;
  if (typeof data.matched      === 'boolean') clean.matched     = data.matched;
  if (typeof data.confidence   === 'number')  clean.confidence  = data.confidence;
  if (typeof data.durationMs   === 'number')  clean.durationMs  = data.durationMs;
  if (typeof data.language     === 'string')  clean.language    = data.language;
  if (typeof data.matchMode    === 'string')  clean.matchMode   = data.matchMode;
  if (typeof data.caseSensitive === 'boolean') clean.caseSensitive = data.caseSensitive;
  if (typeof data.blocksCount  === 'number')  clean.blocksCount = data.blocksCount;
  if (Array.isArray(data.blocks)) {
    clean.blocks = data.blocks.map(_sanitizeBlock).filter(function (b) { return b !== null; });
  }
  if (data.match && typeof data.match === 'object') {
    clean.match = _sanitizeBlock(data.match);
  }
  if (data.region && typeof data.region === 'object') {
    clean.region = _cloneRegion(data.region);
  }
  return clean;
}

function _sanitizeBlock(b) {
  if (!b || typeof b !== 'object') return null;
  var out = {};
  if (typeof b.id         === 'string') out.id         = b.id;
  if (typeof b.text       === 'string') out.text       = b.text;
  if (typeof b.confidence === 'number') out.confidence = b.confidence;
  if (b.boundingBox && typeof b.boundingBox === 'object') {
    out.boundingBox = _cloneRegion(b.boundingBox);
  }
  if (b.targetPoint && typeof b.targetPoint === 'object') {
    out.targetPoint = {
      x: Number(b.targetPoint.x) | 0,
      y: Number(b.targetPoint.y) | 0
    };
  }
  return out;
}

function _sanitizeProviderError(err) {
  if (!err) return { id: 'unknownError' };
  if (typeof err === 'string') return { id: err };
  if (typeof err === 'object') {
    return {
      id: typeof err.id === 'string' && err.id.length > 0 ? err.id : 'unknownError',
      message: typeof err.message === 'string' ? err.message : undefined
    };
  }
  return { id: 'unknownError' };
}

function _cloneRegion(r) {
  if (!r || typeof r !== 'object') return null;
  var x = Number(r.x);
  var y = Number(r.y);
  var w = Number(r.width);
  var h = Number(r.height);
  if (!isFinite(x) || !isFinite(y) || !isFinite(w) || !isFinite(h)) return null;
  if (w <= 0 || h <= 0) return null;
  return { x: x | 0, y: y | 0, width: w | 0, height: h | 0 };
}

// =====================================================================
// 2. validateOcrProviderInput(input)
// =====================================================================

// Validates the shape of a provider input. The input shape mirrors
// the Step-32 mock-engine contract:
//   {
//     screenPreview: { sourceId, name, width, height, capturedAt },
//     targetText: string (1..200 chars),
//     options: {
//       language?:    'ru' | 'en' | 'ru+en',
//       matchMode?:   'contains' | 'exact',
//       caseSensitive?: boolean,
//       region?:      { x, y, width, height } | null,
//       requestId?:   string
//     }
//   }
//
// Returns: { valid: boolean, errors: [stableId] }.
//
// Pixel data (`imageDataUrl`, `previewDataUrl`, ArrayBuffer fields)
// is rejected with `pixelDataNotAllowed`. The whole MVP keeps pixel
// data inside the renderer's screen-capture slice; providers must
// look it up themselves at execution time, never inside the input
// envelope.
function validateOcrProviderInput(input) {
  var errors = [];
  if (!input || typeof input !== 'object') {
    errors.push(OCR_PROVIDER_ERROR_IDS.InputMissing);
    return { valid: false, errors: errors };
  }
  var preview = input.screenPreview;
  if (!preview || typeof preview !== 'object') {
    errors.push(OCR_PROVIDER_ERROR_IDS.ScreenPreviewMissing);
  } else {
    var w = Number(preview.width);
    var h = Number(preview.height);
    if (!isFinite(w) || !isFinite(h) || w <= 0 || h <= 0) {
      errors.push(OCR_PROVIDER_ERROR_IDS.ScreenPreviewSizeMissing);
    }
    // Defensive: reject pixel data if a buggy caller attaches it.
    if (typeof preview.imageDataUrl === 'string' ||
        typeof preview.previewDataUrl === 'string' ||
        preview.pixels instanceof ArrayBuffer) {
      errors.push(OCR_PROVIDER_ERROR_IDS.PixelDataNotAllowed);
    }
  }
  var tt = input.targetText;
  if (typeof tt !== 'string' || tt.length === 0) {
    errors.push(OCR_PROVIDER_ERROR_IDS.TargetTextMissing);
  } else if (tt.length > _MAX_TARGET_TEXT_LEN) {
    errors.push(OCR_PROVIDER_ERROR_IDS.TargetTextTooLong);
  }
  var opts = input.options || {};
  if (typeof opts.language !== 'undefined' && _SUPPORTED_OCR_LANGUAGES.indexOf(opts.language) === -1) {
    errors.push(OCR_PROVIDER_ERROR_IDS.LanguageInvalid);
  }
  if (typeof opts.matchMode !== 'undefined' && _SUPPORTED_MATCH_MODES.indexOf(opts.matchMode) === -1) {
    errors.push(OCR_PROVIDER_ERROR_IDS.MatchModeInvalid);
  }
  if (typeof opts.region !== 'undefined' && opts.region !== null) {
    var r = _cloneRegion(opts.region);
    if (!r) {
      errors.push(OCR_PROVIDER_ERROR_IDS.RegionInvalid);
    } else if (preview && typeof preview === 'object') {
      var pw = Number(preview.width)  | 0;
      var ph = Number(preview.height) | 0;
      if (pw > 0 && ph > 0) {
        if (r.x < 0 || r.y < 0 || r.x + r.width > pw || r.y + r.height > ph) {
          errors.push(OCR_PROVIDER_ERROR_IDS.RegionOutOfBounds);
        }
      }
    }
  }
  return { valid: errors.length === 0, errors: errors };
}

// =====================================================================
// 3. normalizeOcrProviderOptions(options)
// =====================================================================

// Returns a plain object with safe defaults for any provider call.
// Unknown keys are dropped. Unknown values fall back to defaults.
function normalizeOcrProviderOptions(options) {
  var src = (options && typeof options === 'object') ? options : {};
  var lang = (typeof src.language === 'string' && _SUPPORTED_OCR_LANGUAGES.indexOf(src.language) !== -1)
    ? src.language : 'ru+en';
  var mm = (typeof src.matchMode === 'string' && _SUPPORTED_MATCH_MODES.indexOf(src.matchMode) !== -1)
    ? src.matchMode : 'contains';
  var cs = (typeof src.caseSensitive === 'boolean') ? src.caseSensitive : false;
  var region = (src.region && typeof src.region === 'object') ? _cloneRegion(src.region) : null;
  var requestId = (typeof src.requestId === 'string' && src.requestId.length > 0) ? src.requestId : null;
  return {
    language: lang,
    matchMode: mm,
    caseSensitive: cs,
    region: region,
    requestId: requestId
  };
}

// =====================================================================
// 4. getOcrProviderContract()
// =====================================================================

// Returns a deep-copy of the provider contract. The contract is the
// canonical source of truth for the OCR readiness UI, the
// diagnostics line, and the Step-38 smoke checks.
function getOcrProviderContract() {
  return {
    version: 1,
    supportedProviders: _SUPPORTED_PROVIDERS.slice(),
    plannedProviders:   _PLANNED_PROVIDERS.slice(),
    realOcrAllowed:     false,
    mockOcrAvailable:   true,
    realOcrAvailable:   false,
    requiresUserAction: true,
    storesImages:       false,
    supportedLanguages: _SUPPORTED_OCR_LANGUAGES.slice(),
    supportedMatchModes: _SUPPORTED_MATCH_MODES.slice(),
    maxTargetTextLength: _MAX_TARGET_TEXT_LEN,
    notes: 'Step 38 — Real OCR Research. Architecture only. Mock is the only active provider.'
  };
}

// =====================================================================
// 5. getSupportedOcrLanguages()
// =====================================================================

function getSupportedOcrLanguages() {
  return _SUPPORTED_OCR_LANGUAGES.slice();
}

// =====================================================================
// 6. isRealOcrAllowed(flags, settings)
// =====================================================================

// Centralised gate that says "is real OCR allowed to run?".
//
// Step 38 introduced this function as a hard-stop returning `false`
// regardless of input. Step 40 wired the runtime overlay so the
// user can opt in for the current session. The gate now reflects
// the merged base + runtime feature-flag snapshot:
//   - if the umbrella `simulationOnly` is true → still returns `false`
//     (the umbrella safety stance does not bend);
//   - if `realOcr` is false → returns `false`;
//   - if `tesseractProvider` is false → returns `false`;
//   - otherwise returns `true`.
//
// In production builds `simulationOnly` stays `true`, so this
// function still evaluates to `false` for the umbrella safety
// surface. The session-scoped opt-in is exposed separately as
// `realOcrEnabledForSession` in `getOcrFeatureStatus()`. Call sites
// that drive recognition use the session flag; call sites that
// describe the umbrella safety stance use this function.
//
// Defensive: any unexpected input returns `false`.
function isRealOcrAllowed(flags, settings) {
  if (!flags || typeof flags !== 'object') return false;
  if (flags.simulationOnly === true) return false;
  if (flags.realOcr !== true) return false;
  if (flags.tesseractProvider !== true) return false;
  if (settings && typeof settings === 'object') {
    if (settings.realOcrConfirmed === false) return false;
  }
  return true;
}

// =====================================================================
// 7. createOcrProviderStatus(provider)
// =====================================================================

// Builds the readiness/status snapshot for a single provider. Used
// by the OCR readiness UI and the diagnostics line.
//
// Returns:
//   {
//     id: string,
//     name: string,
//     type: 'mock' | 'real',
//     available: boolean,
//     active: boolean,
//     realOcr: boolean,
//     planned: boolean,
//     disabledReason: string | null,
//     supportedLanguages: string[],
//     selfTestSupported: boolean,
//     storesImages: false,
//     requiresUserAction: boolean
//   }
function createOcrProviderStatus(provider) {
  var src = (provider && typeof provider === 'object') ? provider : {};
  var id   = typeof src.id === 'string' ? src.id : 'unknown';
  var name = typeof src.name === 'string' && src.name.length > 0 ? src.name : id;
  var type = (src.type === 'real' || src.type === 'mock') ? src.type : 'mock';
  var realOcr = type === 'real';
  var available = !!src.available && !realOcr; // Step 38: real providers never available.
  var active    = !!src.active && available;
  var planned   = !!src.planned;
  var disabledReason = (typeof src.disabledReason === 'string' && src.disabledReason.length > 0)
    ? src.disabledReason
    : (realOcr ? 'Real OCR is not connected in this build' : null);
  return {
    id: id,
    name: name,
    type: type,
    available: available,
    active: active,
    realOcr: realOcr,
    planned: planned,
    disabledReason: disabledReason,
    supportedLanguages: _SUPPORTED_OCR_LANGUAGES.slice(),
    selfTestSupported: !realOcr,           // only mock is self-testable at Step 38
    storesImages: false,                   // contract invariant
    requiresUserAction: true               // capture must happen first
  };
}
