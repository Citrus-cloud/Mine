// =====================================================================
// ClickFlow — src/template-matching-mock.js (Step 28)
// ---------------------------------------------------------------------
// Mock / dry-run pipeline for the future image-matching feature.
//
// HARD GUARANTEES (Step 28):
//   - This module is PURE LOGIC. It never decodes a single pixel.
//   - It produces a deterministic mock match result derived only
//     from the input metadata (preview width/height, template
//     width/height, optional region). No `tesseract`, no
//     `opencv4nodejs`, no `sharp` — those packages are not in
//     `package.json` and the smoke check enforces it.
//   - It produces an `image_click` ACTION PREVIEW. The preview is a
//     plain-data object with `mode: "preview"` and `realClick: false`.
//     Nothing in the click-engine, the action-pipeline, or the
//     adapters knows what to do with `image_click` — the action
//     PREVIEW is for display only.
//   - This module never imports Node, Electron, or `ipcRenderer`.
//   - This module never persists anything. The single piece of
//     module-local state (`_lastMockResult`) lives in renderer
//     memory and is reset on `clearMockMatchResult()`.
//
// The result shape is an explicit contract between this file and
// `template-matching-ui.js`. Both sides validate; this module is
// the source of truth for the format.
// =====================================================================

// ---------------------------------------------------------------------
// Module-local state (renderer memory only)
// ---------------------------------------------------------------------
var _lastMockResult = null;
var _lastMockRunAt = null;

// Stable, frozen list of confidence values we cycle through. We
// pick one based on a small hash of the input so the same input
// always yields the same number — useful for snapshot testing. We
// deliberately keep them just below 1.0 so the UI never confuses a
// mock result with a "perfect" real match.
var MOCK_CONFIDENCE_VALUES = Object.freeze([0.87, 0.82, 0.91, 0.78, 0.85, 0.89]);

// ---------------------------------------------------------------------
// Input construction
// ---------------------------------------------------------------------

// Build a sanitised, plain-data input from the renderer's slices.
// The renderer hands us screenCapture.preview, the active template
// from the templates slice, and (optionally) the region.
//
// Anything we can't read collapses to `null`. Pixel data
// (imageDataUrl, previewDataUrl) is INTENTIONALLY DROPPED here —
// the matcher is mock and never needs to look at the bytes.
function createTemplateMatchInput(screenPreview, template, region) {
  var sp = null;
  if (screenPreview && typeof screenPreview === 'object') {
    sp = {
      sourceId:   typeof screenPreview.sourceId === 'string' ? screenPreview.sourceId : '',
      name:       typeof screenPreview.name === 'string' ? screenPreview.name : '',
      type:       typeof screenPreview.type === 'string' ? screenPreview.type : 'screen',
      width:      _toFiniteNumber(screenPreview.width),
      height:     _toFiniteNumber(screenPreview.height),
      capturedAt: typeof screenPreview.capturedAt === 'string' ? screenPreview.capturedAt : ''
    };
  }
  var tpl = null;
  if (template && typeof template === 'object') {
    tpl = {
      id:     typeof template.id === 'string' ? template.id : '',
      name:   typeof template.name === 'string' ? template.name : '',
      width:  _toFiniteNumber(template.width),
      height: _toFiniteNumber(template.height)
    };
  }
  var rg = null;
  if (region && typeof region === 'object') {
    var rx = _toFiniteNumber(region.x);
    var ry = _toFiniteNumber(region.y);
    var rw = _toFiniteNumber(region.width);
    var rh = _toFiniteNumber(region.height);
    if (rx >= 0 && ry >= 0 && rw > 0 && rh > 0) {
      rg = { x: rx, y: ry, width: rw, height: rh };
    }
  }
  return { screenPreview: sp, template: tpl, region: rg };
}

// ---------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------

// Pure predicate. Returns { valid: bool, reason: string|null }.
function validateTemplateMatchInput(input) {
  if (!input || typeof input !== 'object') {
    return { valid: false, reason: 'input is missing' };
  }
  var sp = input.screenPreview;
  if (!sp || typeof sp !== 'object') {
    return { valid: false, reason: 'screenPreview is missing' };
  }
  if (!_isPositiveNumber(sp.width) || !_isPositiveNumber(sp.height)) {
    return { valid: false, reason: 'screenPreview width/height must be > 0' };
  }
  var tpl = input.template;
  if (!tpl || typeof tpl !== 'object') {
    return { valid: false, reason: 'template is missing' };
  }
  if (typeof tpl.id !== 'string' || tpl.id.length === 0) {
    return { valid: false, reason: 'template.id is missing' };
  }
  if (!_isPositiveNumber(tpl.width) || !_isPositiveNumber(tpl.height)) {
    return { valid: false, reason: 'template width/height must be > 0' };
  }
  if (input.region !== null && input.region !== undefined) {
    var r = input.region;
    if (!r || typeof r !== 'object') {
      return { valid: false, reason: 'region must be an object or null' };
    }
    // Reuse Step 26's contract: width/height must be > 5 to be a
    // meaningful selection. If `validateRegion` is loaded (it is in
    // the renderer, since region-selector.js precedes this file in
    // index.html) we delegate to it. Otherwise we fall back to a
    // small inline check.
    if (typeof validateRegion === 'function') {
      var v = validateRegion(r);
      if (!v.valid) {
        return { valid: false, reason: 'region invalid: ' + (v.reason || '') };
      }
    } else {
      if (!(_isPositiveNumber(r.width) && r.width > 5 &&
            _isPositiveNumber(r.height) && r.height > 5 &&
            r.x >= 0 && r.y >= 0)) {
        return { valid: false, reason: 'region must be x>=0, y>=0, w>5, h>5' };
      }
    }
    // The region must lie inside the preview. We are strict here so
    // a future real matcher inherits a clean contract.
    if (r.x + r.width  > sp.width)  return { valid: false, reason: 'region escapes preview width' };
    if (r.y + r.height > sp.height) return { valid: false, reason: 'region escapes preview height' };
  }
  return { valid: true, reason: null };
}

// ---------------------------------------------------------------------
// Mock match construction
// ---------------------------------------------------------------------

// Run the mock pipeline. Synchronous, deterministic, no I/O.
// `options` (currently unused but reserved): { confidence?, seed? }
function runMockTemplateMatch(input, options) {
  var validation = validateTemplateMatchInput(input);
  if (!validation.valid) {
    var failure = {
      success: false,
      mode: 'mock',
      error: validation.reason || 'invalid input',
      realMatching: false,
      realClick: false
    };
    _lastMockResult = null;
    _lastMockRunAt = new Date().toISOString();
    return failure;
  }
  var match = createMockMatchResult(input, options || {});
  _lastMockResult = match;
  _lastMockRunAt = match.createdAt;
  return { success: true, match: match };
}

// Build the mock match record from the (already-validated) input.
// This is the function unit-tested by the smoke harness; keep it
// pure (no side effects, no `Date.now()`, no globals beyond the
// frozen `MOCK_CONFIDENCE_VALUES`).
function createMockMatchResult(input, options) {
  var sp = input.screenPreview;
  var tpl = input.template;
  var rg = input.region || null;

  // 1. Resolve the search bounds.
  var bounds = rg
    ? { x: rg.x, y: rg.y, width: rg.width, height: rg.height }
    : { x: 0,    y: 0,    width: sp.width, height: sp.height };

  // 2. Derive the bounding box. We try the template's natural size
  //    first, but cap it at half of each search-bound dimension so
  //    the rectangle is always visibly *inside* the bounds. The
  //    match is centered on the bounds.
  var maxBoxW = Math.max(8, Math.floor(bounds.width  / 2));
  var maxBoxH = Math.max(8, Math.floor(bounds.height / 2));
  var boxW = Math.max(8, Math.min(_toFiniteNumber(tpl.width)  || maxBoxW, maxBoxW));
  var boxH = Math.max(8, Math.min(_toFiniteNumber(tpl.height) || maxBoxH, maxBoxH));
  // Clamp once more — defensive, against pathological inputs.
  if (boxW > bounds.width)  boxW = Math.max(1, bounds.width  - 1);
  if (boxH > bounds.height) boxH = Math.max(1, bounds.height - 1);

  var boxX = Math.round(bounds.x + (bounds.width  - boxW) / 2);
  var boxY = Math.round(bounds.y + (bounds.height - boxH) / 2);
  // Final clamp to preview bounds.
  if (boxX < 0) boxX = 0;
  if (boxY < 0) boxY = 0;
  if (boxX + boxW > sp.width)  boxX = Math.max(0, sp.width  - boxW);
  if (boxY + boxH > sp.height) boxY = Math.max(0, sp.height - boxH);

  var boundingBox = {
    x:      boxX,
    y:      boxY,
    width:  Math.round(boxW),
    height: Math.round(boxH)
  };

  // 3. Target point — center of the bounding box.
  var targetPoint = {
    x: Math.round(boundingBox.x + boundingBox.width  / 2),
    y: Math.round(boundingBox.y + boundingBox.height / 2)
  };

  // 4. Confidence — deterministic but unique per input.
  var confidence = (options && _isFiniteNumberInRange(options.confidence, 0, 1))
    ? Math.round(options.confidence * 1000) / 1000
    : _pickMockConfidence(sp, tpl, rg);

  // 5. Compose the record.
  var createdAt = new Date().toISOString();
  return {
    id:           'mock-match-' + Date.now() + '-' + Math.floor(Math.random() * 1e6).toString(36),
    mode:         'mock',
    matched:      true,
    confidence:   confidence,
    boundingBox:  boundingBox,
    targetPoint:  targetPoint,
    usedRegion:   rg ? { x: rg.x, y: rg.y, width: rg.width, height: rg.height } : null,
    templateId:   tpl.id,
    templateName: tpl.name || '',
    sourceId:     sp.sourceId || '',
    sourceName:   sp.name || '',
    previewSize:  { width: sp.width, height: sp.height },
    createdAt:    createdAt,
    realMatching: false,
    realClick:    false
  };
}

// Convenience getter: target point of the *current* match (or null).
function getMockTargetPoint(match) {
  if (match && match.targetPoint && typeof match.targetPoint === 'object' &&
      _isFiniteNumber(match.targetPoint.x) && _isFiniteNumber(match.targetPoint.y)) {
    return { x: match.targetPoint.x, y: match.targetPoint.y };
  }
  return null;
}

// ---------------------------------------------------------------------
// Action preview
// ---------------------------------------------------------------------

// Build a plain-data preview of the future `image_click` action.
// This is NOT a real action: nothing in the click-engine knows what
// to do with it, and we explicitly mark it `mode: "preview"` and
// `realClick: false`. The renderer renders the preview via
// `textContent` (no HTML injection) — see template-matching-ui.js.
function createImageClickActionPreview(match) {
  if (!match || typeof match !== 'object') return null;
  var bb = (match.boundingBox && typeof match.boundingBox === 'object')
    ? { x: _toFiniteNumber(match.boundingBox.x), y: _toFiniteNumber(match.boundingBox.y),
        width: _toFiniteNumber(match.boundingBox.width), height: _toFiniteNumber(match.boundingBox.height) }
    : null;
  var tp = getMockTargetPoint(match);
  return {
    type:         'image_click',
    mode:         'preview',
    templateId:   typeof match.templateId === 'string' ? match.templateId : '',
    templateName: typeof match.templateName === 'string' ? match.templateName : '',
    targetPoint:  tp,
    boundingBox:  bb,
    confidence:   _isFiniteNumberInRange(match.confidence, 0, 1) ? match.confidence : 0,
    usedRegion:   match.usedRegion ? { x: match.usedRegion.x, y: match.usedRegion.y,
                                       width: match.usedRegion.width, height: match.usedRegion.height } : null,
    realClick:    false,
    realMatching: false,
    note:         'Preview only. Not executed by the click engine.'
  };
}

// ---------------------------------------------------------------------
// State helpers
// ---------------------------------------------------------------------

function clearMockMatchResult() {
  _lastMockResult = null;
  _lastMockRunAt = null;
}

function getLastMockMatchResult() {
  return _lastMockResult ? _cloneShallow(_lastMockResult) : null;
}

// Small status snapshot for the diagnostics card / smoke harness.
function getTemplateMatchingMockStatus() {
  return {
    hasResult:        !!_lastMockResult,
    lastRunAt:        _lastMockRunAt,
    lastConfidence:   _lastMockResult ? _lastMockResult.confidence : null,
    lastTargetPoint:  _lastMockResult ? getMockTargetPoint(_lastMockResult) : null,
    lastTemplateId:   _lastMockResult ? _lastMockResult.templateId : null,
    realMatching:     false,
    realClick:        false,
    matcherImplemented: false
  };
}

// ---------------------------------------------------------------------
// Internal numeric helpers
// ---------------------------------------------------------------------

function _toFiniteNumber(v) {
  var n = Number(v);
  return (typeof n === 'number' && isFinite(n)) ? n : 0;
}
function _isFiniteNumber(v) {
  return typeof v === 'number' && isFinite(v);
}
function _isPositiveNumber(v) {
  return _isFiniteNumber(v) && v > 0;
}
function _isFiniteNumberInRange(v, lo, hi) {
  return _isFiniteNumber(v) && v >= lo && v <= hi;
}
function _cloneShallow(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  var out = {};
  for (var k in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, k)) {
      var v = obj[k];
      if (v && typeof v === 'object') {
        out[k] = Object.assign({}, v);
      } else {
        out[k] = v;
      }
    }
  }
  return out;
}

// Deterministic "random-feeling" confidence picker. We hash a small
// slice of the input metadata into one of MOCK_CONFIDENCE_VALUES so
// each (preview, template, region) tuple yields the same number on
// every invocation — useful for smoke tests and the user mental
// model alike.
function _pickMockConfidence(sp, tpl, rg) {
  var seed = '' +
    (sp.sourceId || '') + '|' +
    (sp.width | 0) + 'x' + (sp.height | 0) + '|' +
    (tpl.id || '') + '|' +
    (tpl.width | 0) + 'x' + (tpl.height | 0) + '|' +
    (rg ? (rg.x | 0) + ',' + (rg.y | 0) + ',' + (rg.width | 0) + 'x' + (rg.height | 0) : 'no-region');
  var h = 0;
  for (var i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) | 0;
  }
  var idx = Math.abs(h) % MOCK_CONFIDENCE_VALUES.length;
  return MOCK_CONFIDENCE_VALUES[idx];
}
