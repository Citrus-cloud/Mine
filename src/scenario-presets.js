// =====================================================================
// ClickFlow — src/scenario-presets.js (Step 36)
// ---------------------------------------------------------------------
// Pure-renderer module that ships ready-made scenario presets for the
// three supported scenario types: simple_click (Step 0+),
// image_click (Step 30) and text_click (Step 33).
//
// A preset is NOT a saved scenario. It is a lightweight template:
//   - the user picks a preset;
//   - we pre-fill the scenario form with safe defaults
//     (and, optionally, with the current visual context — region /
//     active template / matched text);
//   - the user STILL has to press "Save" manually to persist it.
//
// SAFETY (Step 36):
//   - Presets DO NOT auto-save. They DO NOT auto-run.
//   - Presets DO NOT click. Presets DO NOT call the action pipeline.
//   - Presets DO NOT touch the dry-run sandbox.
//   - Presets carry NO `imageDataUrl`, NO thumbnails, NO PII.
//   - Visual context applied to a preset carries only numbers
//     (region rectangle, target X/Y, threshold/step) and short
//     ids/strings (templateId, targetText). It NEVER carries
//     pixel data.
//   - `realClick: false` and (where applicable) `realOcr: false`
//     are stamped defensively.
//
// This module exposes:
//   - getScenarioPresets()
//   - getScenarioPresetById(id)
//   - createScenarioDraftFromPreset(presetId, context)
//   - applyVisualContextToPreset(preset, visualContext)
//   - validateScenarioPreset(preset)
//
// All identifiers and the list itself are Object.freeze-locked so a
// future caller cannot silently extend the surface.
// =====================================================================

'use strict';

// Stable, frozen list of preset definitions.
// `nameKey` / `descriptionKey` reference i18n keys defined in
// src/i18n.js (Step 36 additions).
var SCENARIO_PRESETS = Object.freeze([
  Object.freeze({
    id: 'preset-coordinate-basic',
    type: 'simple_click',
    nameKey: 'presetCoordinateBasic',
    descriptionKey: 'presetCoordinateBasicDesc',
    settings: Object.freeze({
      x: 500,
      y: 400,
      button: 'left',
      intervalMs: 500,
      repeatCount: 10
    })
  }),
  Object.freeze({
    id: 'preset-image-click-basic',
    type: 'image_click',
    nameKey: 'presetImageClickBasic',
    descriptionKey: 'presetImageClickBasicDesc',
    settings: Object.freeze({
      templateId: null,
      region: null,
      threshold: 0.75,
      step: 4,
      timeoutMs: 10000,
      intervalMs: 1000,
      repeatCount: 1
    })
  }),
  Object.freeze({
    id: 'preset-text-click-basic',
    type: 'text_click',
    nameKey: 'presetTextClickBasic',
    descriptionKey: 'presetTextClickBasicDesc',
    settings: Object.freeze({
      targetText: '',
      language: 'ru+en',
      matchMode: 'contains',
      caseSensitive: false,
      // Step 42 bugfix — text_click presets carry the ocrProvider
      // field introduced at Step 41. Default `mock` so the preset
      // round-trips through the form without surprising users; the
      // user can flip the form's select to `tesseract` after Save
      // and after enabling Tesseract for the session.
      ocrProvider: 'mock',
      region: null,
      timeoutMs: 10000,
      intervalMs: 1000,
      repeatCount: 1
    })
  })
]);

var ALLOWED_TYPES = Object.freeze(['simple_click', 'image_click', 'text_click']);

// --- Public: list / lookup -------------------------------------------

// Returns a deep-copy array so a caller cannot mutate the frozen list
// indirectly (e.g. via tests that .push to it).
function getScenarioPresets() {
  var out = [];
  for (var i = 0; i < SCENARIO_PRESETS.length; i++) {
    out.push(_clonePreset(SCENARIO_PRESETS[i]));
  }
  return out;
}

function getScenarioPresetById(id) {
  if (typeof id !== 'string' || id.length === 0) return null;
  for (var i = 0; i < SCENARIO_PRESETS.length; i++) {
    if (SCENARIO_PRESETS[i].id === id) return _clonePreset(SCENARIO_PRESETS[i]);
  }
  return null;
}

// --- Public: validation ----------------------------------------------

function validateScenarioPreset(preset) {
  var errors = [];
  if (!preset || typeof preset !== 'object') {
    errors.push('presetMissing');
    return { valid: false, errors: errors };
  }
  if (typeof preset.id !== 'string' || preset.id.length === 0) {
    errors.push('presetIdMissing');
  }
  if (ALLOWED_TYPES.indexOf(preset.type) === -1) {
    errors.push('presetTypeInvalid');
  }
  if (!preset.settings || typeof preset.settings !== 'object') {
    errors.push('presetSettingsMissing');
    return { valid: errors.length === 0, errors: errors };
  }
  // Per-type sanity checks. We deliberately keep them light — full
  // validation lives in scenario-manager.js. The point here is to
  // catch obviously malformed presets early.
  if (preset.type === 'simple_click') {
    var s = preset.settings;
    if (typeof s.x !== 'number' || typeof s.y !== 'number') errors.push('presetCoordinatesInvalid');
    if (typeof s.intervalMs !== 'number' || s.intervalMs < 50) errors.push('presetIntervalInvalid');
    if (typeof s.repeatCount !== 'number' || s.repeatCount < 1) errors.push('presetRepeatInvalid');
    if (s.button !== 'left' && s.button !== 'right' && s.button !== 'middle') errors.push('presetButtonInvalid');
  } else if (preset.type === 'image_click') {
    var ic = preset.settings;
    if (typeof ic.threshold !== 'number' || ic.threshold < 0 || ic.threshold > 1) errors.push('presetThresholdInvalid');
    if (typeof ic.step !== 'number' || ic.step < 1) errors.push('presetStepInvalid');
    if (typeof ic.timeoutMs !== 'number' || ic.timeoutMs < 1000) errors.push('presetTimeoutInvalid');
    if (typeof ic.intervalMs !== 'number' || ic.intervalMs < 100) errors.push('presetIntervalInvalid');
    if (typeof ic.repeatCount !== 'number' || ic.repeatCount < 1) errors.push('presetRepeatInvalid');
  } else if (preset.type === 'text_click') {
    var tc = preset.settings;
    if (tc.language !== 'ru' && tc.language !== 'en' && tc.language !== 'ru+en') errors.push('presetLanguageInvalid');
    if (tc.matchMode !== 'contains' && tc.matchMode !== 'exact') errors.push('presetMatchModeInvalid');
    if (typeof tc.timeoutMs !== 'number' || tc.timeoutMs < 1000) errors.push('presetTimeoutInvalid');
    if (typeof tc.intervalMs !== 'number' || tc.intervalMs < 100) errors.push('presetIntervalInvalid');
    if (typeof tc.repeatCount !== 'number' || tc.repeatCount < 1) errors.push('presetRepeatInvalid');
    // Step 42 bugfix — ocrProvider is optional but if present must be
    // either `mock` or `tesseract`. Anything else is rejected so a
    // typo (`'tesseractr'`, `'real'`, etc.) cannot land a buggy
    // preset that the click-engine refuses at run time.
    if (tc.ocrProvider !== undefined && tc.ocrProvider !== null &&
        tc.ocrProvider !== 'mock' && tc.ocrProvider !== 'tesseract') {
      errors.push('presetOcrProviderInvalid');
    }
  }
  return { valid: errors.length === 0, errors: errors };
}

// --- Public: visual-context application ------------------------------

// Merges a "visual context" object — typically built from the
// renderer state (selected region, active template, last image-match
// or last OCR result) — into a fresh copy of the preset. Never
// mutates the input. Strips anything that smells like pixel data.
//
// `visualContext` shape (all fields optional):
//   {
//     region:      { x, y, width, height } | null,
//     templateId:  string | null,
//     targetPoint: { x, y } | null,           // image_click hint
//     matchedText: string | null,              // text_click hint from OCR
//     threshold:   number | null,
//     step:        number | null,
//     ocrLanguage: 'ru' | 'en' | 'ru+en' | null,
//     matchMode:   'contains' | 'exact' | null,
//     caseSensitive: boolean | null
//   }
function applyVisualContextToPreset(preset, visualContext) {
  var clone = _clonePreset(preset);
  if (!clone || !clone.settings) return clone;
  if (!visualContext || typeof visualContext !== 'object') return clone;

  var ctx = _sanitizeVisualContext(visualContext);

  if (clone.type === 'simple_click') {
    // Coordinate preset can borrow target X/Y from the visual context
    // (e.g. a recent image-match target) or fall back to the centre of
    // a selected region. Numbers only — no pixel data.
    if (ctx.targetPoint && typeof ctx.targetPoint.x === 'number' && typeof ctx.targetPoint.y === 'number') {
      clone.settings.x = ctx.targetPoint.x | 0;
      clone.settings.y = ctx.targetPoint.y | 0;
    } else if (ctx.region) {
      clone.settings.x = (ctx.region.x + ctx.region.width  / 2) | 0;
      clone.settings.y = (ctx.region.y + ctx.region.height / 2) | 0;
    }
  } else if (clone.type === 'image_click') {
    if (ctx.templateId) clone.settings.templateId = ctx.templateId;
    if (ctx.region)     clone.settings.region     = _cloneRegion(ctx.region);
    if (typeof ctx.threshold === 'number') {
      clone.settings.threshold = _clamp(ctx.threshold, 0, 1);
    }
    if (typeof ctx.step === 'number' && ctx.step > 0) {
      clone.settings.step = ctx.step | 0;
    }
  } else if (clone.type === 'text_click') {
    if (typeof ctx.matchedText === 'string' && ctx.matchedText.length > 0) {
      // Truncate to a sane length so the form does not get a huge blob.
      clone.settings.targetText = ctx.matchedText.length > 200
        ? ctx.matchedText.slice(0, 200)
        : ctx.matchedText;
    }
    if (ctx.region) clone.settings.region = _cloneRegion(ctx.region);
    if (ctx.ocrLanguage === 'ru' || ctx.ocrLanguage === 'en' || ctx.ocrLanguage === 'ru+en') {
      clone.settings.language = ctx.ocrLanguage;
    }
    if (ctx.matchMode === 'contains' || ctx.matchMode === 'exact') {
      clone.settings.matchMode = ctx.matchMode;
    }
    if (typeof ctx.caseSensitive === 'boolean') {
      clone.settings.caseSensitive = ctx.caseSensitive;
    }
    // Step 42 bugfix — propagate the active OCR provider hint from
    // the visual context so a "Use with current visual context"
    // flow on the text preset reflects what the user is actively
    // using. Default mock when unspecified.
    if (ctx.ocrProvider === 'mock' || ctx.ocrProvider === 'tesseract') {
      clone.settings.ocrProvider = ctx.ocrProvider;
    }
  }
  return clone;
}

// --- Public: draft creation ------------------------------------------

// Builds a "draft" object suitable for opening the scenario form.
// The draft is plain data — no DOM, no IPC. The caller is
// responsible for navigating the user to the scenario form and
// filling its inputs from `draft.settings`.
//
// Returns:
//   {
//     ok: true, presetId, type, name, settings,
//     source: 'preset' | 'preset+visual',
//     realClick: false, realOcr?: false,
//     createdAt: ISOString
//   }
//   or { ok: false, errors: [stableId] }.
function createScenarioDraftFromPreset(presetId, context) {
  var preset = getScenarioPresetById(presetId);
  if (!preset) {
    return { ok: false, errors: ['presetNotFound'] };
  }
  var validation = validateScenarioPreset(preset);
  if (!validation.valid) {
    return { ok: false, errors: validation.errors };
  }
  var hasVisualCtx = !!(context && typeof context === 'object' && context.visualContext);
  var working = preset;
  if (hasVisualCtx) {
    working = applyVisualContextToPreset(preset, context.visualContext);
  }
  var name = (context && typeof context.name === 'string' && context.name.length > 0)
    ? context.name
    : _defaultDraftName(preset);
  var description = (context && typeof context.description === 'string')
    ? context.description
    : '';
  // Defensive flag stamping — the action pipeline / safety gates
  // will refuse anything that looks real anyway, but presets MUST
  // never look real to begin with.
  var draft = {
    ok: true,
    presetId: preset.id,
    type: working.type,
    name: name,
    description: description,
    settings: _cloneSettings(working.settings),
    source: hasVisualCtx ? 'preset+visual' : 'preset',
    realClick: false,
    createdAt: new Date().toISOString()
  };
  if (working.type === 'text_click') draft.realOcr = false;
  return draft;
}

// --- Internal helpers -------------------------------------------------

function _clonePreset(p) {
  if (!p || typeof p !== 'object') return null;
  return {
    id: p.id,
    type: p.type,
    nameKey: p.nameKey,
    descriptionKey: p.descriptionKey,
    settings: _cloneSettings(p.settings)
  };
}

function _cloneSettings(s) {
  if (!s || typeof s !== 'object') return {};
  var out = {};
  // Whitelist allowed keys per type so we never accidentally copy a
  // future imageDataUrl or pixel buffer that might leak in.
  // Step 42 bugfix — `ocrProvider` is the new text_click field
  // introduced at Step 41. Without this entry the preset's
  // `ocrProvider` value would be silently dropped during clone.
  var allowed = [
    'x', 'y', 'button', 'intervalMs', 'repeatCount',
    'templateId', 'region', 'threshold', 'step', 'timeoutMs',
    'targetText', 'language', 'matchMode', 'caseSensitive',
    'ocrProvider'
  ];
  for (var i = 0; i < allowed.length; i++) {
    var k = allowed[i];
    if (Object.prototype.hasOwnProperty.call(s, k)) {
      if (k === 'region' && s[k] && typeof s[k] === 'object') {
        out.region = _cloneRegion(s[k]);
      } else {
        out[k] = s[k];
      }
    }
  }
  return out;
}

function _cloneRegion(r) {
  if (!r || typeof r !== 'object') return null;
  var x = Number(r.x) || 0;
  var y = Number(r.y) || 0;
  var w = Number(r.width)  || 0;
  var h = Number(r.height) || 0;
  if (w <= 0 || h <= 0) return null;
  return { x: x | 0, y: y | 0, width: w | 0, height: h | 0 };
}

function _clamp(v, lo, hi) {
  if (v < lo) return lo;
  if (v > hi) return hi;
  return v;
}

// Strip anything that smells like pixel data from the visual context
// even if a buggy caller attached one.
function _sanitizeVisualContext(ctx) {
  return {
    region: _cloneRegion(ctx.region),
    templateId: typeof ctx.templateId === 'string' ? ctx.templateId : null,
    targetPoint: (ctx.targetPoint && typeof ctx.targetPoint === 'object')
      ? { x: Number(ctx.targetPoint.x) || 0, y: Number(ctx.targetPoint.y) || 0 }
      : null,
    matchedText: typeof ctx.matchedText === 'string' ? ctx.matchedText : null,
    threshold:   typeof ctx.threshold   === 'number' ? ctx.threshold : null,
    step:        typeof ctx.step        === 'number' ? ctx.step      : null,
    ocrLanguage: typeof ctx.ocrLanguage === 'string' ? ctx.ocrLanguage : null,
    matchMode:   typeof ctx.matchMode   === 'string' ? ctx.matchMode   : null,
    caseSensitive: typeof ctx.caseSensitive === 'boolean' ? ctx.caseSensitive : null,
    // Step 42 bugfix — preserve the active OCR provider hint so
    // "Use with current visual context" reflects the user's
    // current OCR-tab selection. Other values are ignored
    // defensively (typo-protection).
    ocrProvider: (ctx.ocrProvider === 'mock' || ctx.ocrProvider === 'tesseract')
      ? ctx.ocrProvider : null
  };
}

function _defaultDraftName(preset) {
  if (preset.type === 'image_click') return 'Image click draft';
  if (preset.type === 'text_click')  return 'Text click draft';
  return 'Coordinate click draft';
}

// Diagnostics snapshot for the Visual Builder / Safety cards.
function getScenarioPresetsStatus() {
  return {
    presetsAvailable: SCENARIO_PRESETS.length > 0,
    presetsCount: SCENARIO_PRESETS.length,
    presetIds: SCENARIO_PRESETS.map(function (p) { return p.id; }),
    realClick: false,
    realOcr: false
  };
}
