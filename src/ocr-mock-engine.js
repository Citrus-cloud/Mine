// =====================================================================
// ClickFlow — src/ocr-mock-engine.js (Step 32)
// ---------------------------------------------------------------------
// Mock OCR engine. Imitates the shape of a future real-OCR pipeline
// without doing any text recognition. The user picks a target text,
// language, match mode, and (optionally) a region; the engine
// fabricates a deterministic-looking set of OCR blocks based on the
// preview metadata, picks the best match against the target text,
// and builds a `text_click` ACTION PREVIEW the renderer can show.
//
// HARD GUARANTEES (Step 32):
//   - This module is renderer-only logic. It never imports
//     `electron`, `ipcRenderer`, `fs`, `tesseract`, `tesseract.js`,
//     `opencv4nodejs`, `@u4/opencv4nodejs`, `opencv.js`,
//     `opencv-js`, `sharp`, `jimp`, `pixelmatch`, `looks-same`,
//     `robotjs`, `nut.js`, `iohook`, or `uiohook-napi`. It opens
//     no IPC channel.
//   - It NEVER performs real OCR. The "blocks" are fabricated from
//     the preview width / height / region / target text. Real text
//     recognition requires an OCR engine which Step 32 explicitly
//     does NOT add.
//   - It NEVER moves the cursor, NEVER clicks, NEVER types. Even
//     when a match is found, only an ACTION PREVIEW is returned;
//     the click engine and the action pipeline never consume it.
//   - It NEVER persists pixel data, the preview, the blocks, or the
//     debug result on disk. Module-local state lives in renderer
//     memory only and is reset on `clearOcrMockResult()`.
//   - It NEVER stores `imageDataUrl` inside any returned object —
//     only metadata (sourceId / sourceName / width / height /
//     capturedAt) flows through.
//
// The module exposes:
//   - createOcrInput(screenPreview, region, options)
//   - validateOcrInput(input)
//   - runMockOcr(input)                 (sync; returns a result)
//   - createMockOcrBlocks(input)
//   - findTextInOcrBlocks(blocks, targetText, matchMode, opts)
//   - createOcrResult(input, blocks, match)
//   - createTextClickActionPreview(match, input)
//   - getOcrMockStatus()
//   - clearOcrMockResult()
//   - getLastOcrMockResult()
// =====================================================================

// ---------------------------------------------------------------------
// Module-local state (renderer memory only).
// ---------------------------------------------------------------------

var _lastOcrResult = null;
var _ocrDiagnostics = {
  ocrMockAvailable:    true,
  realOcrAvailable:    false,
  lastOcrRunAt:        null,
  lastOcrMatched:      null,
  lastOcrConfidence:   null,
  lastOcrDurationMs:   null,
  lastOcrLanguage:     null,
  lastOcrMatchMode:    null,
  lastOcrTargetTextLen:0,
  lastOcrBlocksCount:  0,
  lastOcrRegionUsed:   false,
  realClick:           false,
  realOcr:             false
};

// Stable error / warning IDs. The UI maps them to localised strings
// via `i18n.js`.
var OCR_ERROR_IDS = Object.freeze({
  ScreenPreviewMissing:  'captureScreenPreviewFirst',
  TargetTextRequired:    'targetTextRequired',
  InvalidLanguage:       'invalidOcrLanguage',
  InvalidMatchMode:      'invalidMatchMode',
  InvalidRegion:         'invalidRegion'
});

// Allowed languages and match modes — kept tiny on purpose. New
// values must be added here AND in `i18n.js`.
var OCR_LANGUAGES = Object.freeze(['ru', 'en', 'ru+en']);
var OCR_MATCH_MODES = Object.freeze(['contains', 'exact']);

// Counter for unique block / result ids inside this session.
var _blockSeq = 0;
var _resultSeq = 0;

// ---------------------------------------------------------------------
// 1. createOcrInput(screenPreview, region, options)
// ---------------------------------------------------------------------
//
// Sanitises every piece of input the caller passed and returns a
// plain-data object the rest of the engine accepts. The fields
// match the shape documented in `docs/OCR_FOUNDATION.md`.

function createOcrInput(screenPreview, region, options) {
  var sp  = (screenPreview && typeof screenPreview === 'object') ? screenPreview : null;
  var rg  = (region && typeof region === 'object') ? region : null;
  var op  = (options && typeof options === 'object') ? options : {};

  var input = {
    screenPreview: sp ? {
      sourceId:   typeof sp.sourceId === 'string' ? sp.sourceId : '',
      name:       typeof sp.name === 'string' ? sp.name : (typeof sp.sourceName === 'string' ? sp.sourceName : ''),
      width:      Number(sp.width)  || 0,
      height:     Number(sp.height) || 0,
      capturedAt: typeof sp.capturedAt === 'string' ? sp.capturedAt : ''
    } : null,
    region: null,
    options: {
      language:       _normalizeLanguage(op.language),
      targetText:     typeof op.targetText === 'string' ? op.targetText : '',
      matchMode:      _normalizeMatchMode(op.matchMode),
      caseSensitive:  !!op.caseSensitive
    }
  };

  // Region is optional; clamp it inside the preview so the mock
  // never emits a block that escapes the preview rectangle.
  if (rg && typeof rg === 'object') {
    var rx = Number(rg.x); var ry = Number(rg.y);
    var rw = Number(rg.width); var rh = Number(rg.height);
    if (isFinite(rx) && isFinite(ry) && isFinite(rw) && isFinite(rh) &&
        rx >= 0 && ry >= 0 && rw > 0 && rh > 0) {
      input.region = {
        x:      Math.round(rx),
        y:      Math.round(ry),
        width:  Math.round(rw),
        height: Math.round(rh)
      };
    }
  }

  return input;
}

// ---------------------------------------------------------------------
// 2. validateOcrInput(input)
// ---------------------------------------------------------------------

function validateOcrInput(input) {
  var errors = [];
  var warnings = [];

  if (!input || typeof input !== 'object') {
    return { valid: false, errors: [OCR_ERROR_IDS.ScreenPreviewMissing], warnings: warnings };
  }

  if (!input.screenPreview || typeof input.screenPreview !== 'object') {
    errors.push(OCR_ERROR_IDS.ScreenPreviewMissing);
  } else if (!(Number(input.screenPreview.width) > 0) || !(Number(input.screenPreview.height) > 0)) {
    errors.push(OCR_ERROR_IDS.ScreenPreviewMissing);
  }

  if (!input.options || typeof input.options !== 'object' ||
      typeof input.options.targetText !== 'string' ||
      input.options.targetText.trim() === '') {
    errors.push(OCR_ERROR_IDS.TargetTextRequired);
  }

  if (input.options && OCR_LANGUAGES.indexOf(input.options.language) === -1) {
    errors.push(OCR_ERROR_IDS.InvalidLanguage);
  }
  if (input.options && OCR_MATCH_MODES.indexOf(input.options.matchMode) === -1) {
    errors.push(OCR_ERROR_IDS.InvalidMatchMode);
  }

  if (input.region) {
    var r = input.region;
    if (typeof r !== 'object' ||
        !(Number(r.width) > 0) || !(Number(r.height) > 0) ||
        Number(r.x) < 0 || Number(r.y) < 0) {
      errors.push(OCR_ERROR_IDS.InvalidRegion);
    } else if (input.screenPreview &&
               Number(input.screenPreview.width) > 0 && Number(input.screenPreview.height) > 0) {
      if (Number(r.x) + Number(r.width)  > Number(input.screenPreview.width) ||
          Number(r.y) + Number(r.height) > Number(input.screenPreview.height)) {
        errors.push(OCR_ERROR_IDS.InvalidRegion);
      }
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
// 3. runMockOcr(input)
// ---------------------------------------------------------------------
//
// End-to-end synchronous helper. Validates, fabricates blocks, picks
// the best match, builds the result. Records audit events when the
// audit module is present.

function runMockOcr(input) {
  var startedAt = Date.now();
  if (typeof recordAuditEvent === 'function') {
    recordAuditEvent('ocr.mock.requested', {
      language:    input && input.options ? input.options.language : null,
      matchMode:   input && input.options ? input.options.matchMode : null,
      hasRegion:   !!(input && input.region),
      targetTextLen: input && input.options && typeof input.options.targetText === 'string'
        ? input.options.targetText.length : 0
    });
  }

  var validation = validateOcrInput(input);
  if (!validation.valid) {
    var failedResult = createOcrResult(input, [], null, {
      success:    false,
      errors:     validation.errors,
      warnings:   validation.warnings,
      durationMs: Date.now() - startedAt
    });
    _commitOcrResult(failedResult);
    if (typeof recordAuditEvent === 'function') {
      recordAuditEvent('ocr.mock.failed', {
        errorsCount: failedResult.errors.length,
        durationMs:  failedResult.durationMs
      });
    }
    return failedResult;
  }

  var blocks = createMockOcrBlocks(input);
  var match = findTextInOcrBlocks(blocks, input.options.targetText, input.options.matchMode, {
    caseSensitive: input.options.caseSensitive
  });
  var result = createOcrResult(input, blocks, match, {
    success:    true,
    errors:     [],
    warnings:   [],
    durationMs: Date.now() - startedAt
  });
  _commitOcrResult(result);

  if (typeof recordAuditEvent === 'function') {
    recordAuditEvent('ocr.mock.completed', {
      matched:       result.matched,
      confidence:    result.match ? result.match.confidence : null,
      blocksCount:   result.blocks.length,
      durationMs:    result.durationMs,
      language:      result.language,
      matchMode:     result.matchMode,
      hasRegion:     !!input.region
    });
    if (result.actionPreview) {
      recordAuditEvent('text.click.preview.created', {
        textLen:       (result.actionPreview.text || '').length,
        targetX:       result.actionPreview.targetPoint ? result.actionPreview.targetPoint.x : null,
        targetY:       result.actionPreview.targetPoint ? result.actionPreview.targetPoint.y : null,
        confidence:    result.actionPreview.confidence,
        realClick:     false,
        realOcr:       false
      });
    }
  }
  return result;
}

// ---------------------------------------------------------------------
// 4. createMockOcrBlocks(input)
// ---------------------------------------------------------------------
//
// Fabricates a deterministic-looking set of OCR blocks. The TARGET
// block uses the user's target text and lands inside the region (if
// any) or near the centre of the preview. Up to three "surrounding"
// blocks are added so the UI can show a non-trivial list.
//
// Block layout principles:
//   - All bounding boxes lie inside the preview (and the region,
//     when present).
//   - Block heights are derived from the preview height so the
//     overlay scales correctly across resolutions.
//   - Confidences live in [0.80, 0.95].

function createMockOcrBlocks(input) {
  if (!input || !input.screenPreview ||
      !(Number(input.screenPreview.width)  > 0) ||
      !(Number(input.screenPreview.height) > 0)) {
    return [];
  }

  var pw = Number(input.screenPreview.width);
  var ph = Number(input.screenPreview.height);

  // Effective search rectangle.
  var searchRect = (input.region && typeof input.region === 'object')
    ? { x: input.region.x, y: input.region.y, width: input.region.width, height: input.region.height }
    : { x: 0, y: 0, width: pw, height: ph };

  // Approximate text height — keeps the overlay readable on very
  // small previews. We clamp between 14 and 48 px.
  var lineHeight = Math.max(14, Math.min(48, Math.round(searchRect.height / 14)));

  // Pre-defined surrounding labels — short, neutral, no PII.
  var surrounding = ['OK', 'Cancel', 'Settings'];

  var blocks = [];
  var targetText = (input.options && typeof input.options.targetText === 'string')
    ? input.options.targetText.trim() : '';

  // 1. Target block — centred (slightly above centre) inside the
  //    search rect.
  if (targetText.length > 0) {
    var tw = Math.max(40, Math.min(searchRect.width  - 8, _approxTextWidth(targetText, lineHeight)));
    var th = lineHeight;
    var tx = searchRect.x + Math.max(0, Math.round((searchRect.width  - tw) / 2));
    var ty = searchRect.y + Math.max(0, Math.round((searchRect.height - th) / 2) - Math.round(lineHeight / 2));
    if (tx + tw > searchRect.x + searchRect.width)  tw = (searchRect.x + searchRect.width)  - tx;
    if (ty + th > searchRect.y + searchRect.height) th = (searchRect.y + searchRect.height) - ty;

    blocks.push({
      id:           'ocr-block-' + (++_blockSeq),
      text:         targetText,
      confidence:   0.91,
      boundingBox:  { x: tx, y: ty, width: tw, height: th },
      targetPoint:  { x: tx + Math.round(tw / 2), y: ty + Math.round(th / 2) }
    });
  }

  // 2. Up to three surrounding blocks. We stack them under the
  //    target block, clipped to the search rect.
  var stackY = (blocks.length > 0)
    ? blocks[0].boundingBox.y + blocks[0].boundingBox.height + Math.round(lineHeight * 0.6)
    : searchRect.y + Math.round(lineHeight * 0.6);
  var stackX = searchRect.x + Math.max(0, Math.round(searchRect.width / 2) - 60);

  for (var i = 0; i < surrounding.length; i++) {
    if (stackY + lineHeight > searchRect.y + searchRect.height) break;

    var label = surrounding[i];
    var bw = Math.max(32, Math.min(searchRect.width - 8, _approxTextWidth(label, lineHeight)));
    var bx = Math.max(searchRect.x, Math.min(searchRect.x + searchRect.width - bw, stackX));
    var bh = lineHeight;

    blocks.push({
      id:           'ocr-block-' + (++_blockSeq),
      text:         label,
      confidence:   0.80 + (i * 0.03), // 0.80 / 0.83 / 0.86
      boundingBox:  { x: bx, y: stackY, width: bw, height: bh },
      targetPoint:  { x: bx + Math.round(bw / 2), y: stackY + Math.round(bh / 2) }
    });

    stackY += Math.round(lineHeight * 1.6);
  }

  return blocks;
}

// ---------------------------------------------------------------------
// 5. findTextInOcrBlocks(blocks, targetText, matchMode, opts)
// ---------------------------------------------------------------------
//
// Returns the best matching block (highest confidence among matches)
// or null. `matchMode` is `contains` or `exact`. `opts.caseSensitive`
// flips between case-sensitive and case-insensitive comparison.

function findTextInOcrBlocks(blocks, targetText, matchMode, opts) {
  if (!Array.isArray(blocks) || blocks.length === 0) return null;
  if (typeof targetText !== 'string' || targetText.trim() === '') return null;

  var mode = (matchMode === 'exact') ? 'exact' : 'contains';
  var caseSensitive = !!(opts && opts.caseSensitive);
  var target = caseSensitive ? targetText.trim() : targetText.trim().toLowerCase();

  var best = null;
  for (var i = 0; i < blocks.length; i++) {
    var b = blocks[i];
    if (!b || typeof b.text !== 'string') continue;
    var candidate = caseSensitive ? b.text : b.text.toLowerCase();

    var ok = false;
    if (mode === 'exact') {
      ok = (candidate === target);
    } else {
      ok = (candidate.indexOf(target) !== -1);
    }
    if (!ok) continue;

    if (!best || (typeof b.confidence === 'number' && b.confidence > best.confidence)) {
      best = b;
    }
  }
  return best || null;
}

// ---------------------------------------------------------------------
// 6. createOcrResult(input, blocks, match, runMeta)
// ---------------------------------------------------------------------

function createOcrResult(input, blocks, match, runMeta) {
  var inp = (input && typeof input === 'object') ? input : {};
  var meta = (runMeta && typeof runMeta === 'object') ? runMeta : {};
  var safeBlocks = Array.isArray(blocks) ? blocks.slice() : [];

  var result = {
    id:           'ocr-result-' + (++_resultSeq),
    mode:         'mock',
    realOcr:      false,
    realClick:    false,
    success:      meta.success === undefined ? !!match : !!meta.success,
    matched:      !!match,
    targetText:   inp.options && typeof inp.options.targetText === 'string' ? inp.options.targetText : '',
    language:     inp.options && typeof inp.options.language === 'string' ? inp.options.language : 'ru+en',
    matchMode:    inp.options && typeof inp.options.matchMode === 'string' ? inp.options.matchMode : 'contains',
    caseSensitive: !!(inp.options && inp.options.caseSensitive),
    region:       inp.region ? { x: inp.region.x, y: inp.region.y, width: inp.region.width, height: inp.region.height } : null,
    screenSourceId:   inp.screenPreview ? (inp.screenPreview.sourceId || '') : '',
    screenSourceName: inp.screenPreview ? (inp.screenPreview.name     || '') : '',
    previewSize:  inp.screenPreview ? {
      width:  Number(inp.screenPreview.width)  || 0,
      height: Number(inp.screenPreview.height) || 0
    } : null,
    blocks:       safeBlocks,
    match:        match ? _cloneOcrBlock(match) : null,
    actionPreview: match ? createTextClickActionPreview(match, inp) : null,
    errors:       Array.isArray(meta.errors)   ? meta.errors.slice()   : [],
    warnings:     Array.isArray(meta.warnings) ? meta.warnings.slice() : [],
    durationMs:   typeof meta.durationMs === 'number' ? meta.durationMs : 0,
    createdAt:    new Date().toISOString()
  };
  return result;
}

// ---------------------------------------------------------------------
// 7. createTextClickActionPreview(match, input)
// ---------------------------------------------------------------------
//
// Builds a plain-data preview of the future `text_click` action.
// **The renderer renders this through `<pre>.textContent`. The
// click engine, the action pipeline, the mock adapter, and the
// dry-run sandbox NEVER consume this preview at Step 32.**

function createTextClickActionPreview(match, input) {
  if (!match || typeof match !== 'object') return null;
  var inp = (input && typeof input === 'object') ? input : {};
  return {
    type:         'text_click',
    mode:         'preview',
    text:         typeof match.text === 'string' ? match.text : '',
    targetPoint:  match.targetPoint ? { x: match.targetPoint.x | 0, y: match.targetPoint.y | 0 } : null,
    boundingBox:  match.boundingBox ? {
      x:      match.boundingBox.x      | 0,
      y:      match.boundingBox.y      | 0,
      width:  match.boundingBox.width  | 0,
      height: match.boundingBox.height | 0
    } : null,
    confidence:   typeof match.confidence === 'number' ? match.confidence : 0,
    language:     inp.options && typeof inp.options.language === 'string' ? inp.options.language : 'ru+en',
    matchMode:    inp.options && typeof inp.options.matchMode === 'string' ? inp.options.matchMode : 'contains',
    caseSensitive: !!(inp.options && inp.options.caseSensitive),
    usedRegion:   inp.region ? { x: inp.region.x, y: inp.region.y, width: inp.region.width, height: inp.region.height } : null,
    realClick:    false,
    realOcr:      false,
    note:         'Preview only. Real OCR is not connected. text_click action is not executed.'
  };
}

// ---------------------------------------------------------------------
// 8. getOcrMockStatus()
// ---------------------------------------------------------------------

function getOcrMockStatus() {
  return {
    ocrMockAvailable:    !!_ocrDiagnostics.ocrMockAvailable,
    realOcrAvailable:    !!_ocrDiagnostics.realOcrAvailable,
    lastOcrRunAt:        _ocrDiagnostics.lastOcrRunAt,
    lastOcrMatched:      _ocrDiagnostics.lastOcrMatched,
    lastOcrConfidence:   _ocrDiagnostics.lastOcrConfidence,
    lastOcrDurationMs:   _ocrDiagnostics.lastOcrDurationMs,
    lastOcrLanguage:     _ocrDiagnostics.lastOcrLanguage,
    lastOcrMatchMode:    _ocrDiagnostics.lastOcrMatchMode,
    lastOcrTargetTextLen:_ocrDiagnostics.lastOcrTargetTextLen,
    lastOcrBlocksCount:  _ocrDiagnostics.lastOcrBlocksCount,
    lastOcrRegionUsed:   _ocrDiagnostics.lastOcrRegionUsed,
    realClick:           false,
    realOcr:             false,
    hasResult:           !!_lastOcrResult
  };
}

// ---------------------------------------------------------------------
// 9. clearOcrMockResult()
// ---------------------------------------------------------------------

function clearOcrMockResult() {
  _lastOcrResult = null;
  _ocrDiagnostics.lastOcrRunAt         = null;
  _ocrDiagnostics.lastOcrMatched       = null;
  _ocrDiagnostics.lastOcrConfidence    = null;
  _ocrDiagnostics.lastOcrDurationMs    = null;
  _ocrDiagnostics.lastOcrLanguage      = null;
  _ocrDiagnostics.lastOcrMatchMode     = null;
  _ocrDiagnostics.lastOcrTargetTextLen = 0;
  _ocrDiagnostics.lastOcrBlocksCount   = 0;
  _ocrDiagnostics.lastOcrRegionUsed    = false;
  if (typeof recordAuditEvent === 'function') {
    recordAuditEvent('ocr.mock.cleared', {});
  }
}

function getLastOcrMockResult() {
  if (!_lastOcrResult) return null;
  // Shallow copy so callers can mutate freely without affecting
  // module state.
  return _cloneOcrResult(_lastOcrResult);
}

// ---------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------

function _commitOcrResult(result) {
  _lastOcrResult = result;
  _ocrDiagnostics.lastOcrRunAt         = result && result.createdAt ? result.createdAt : new Date().toISOString();
  _ocrDiagnostics.lastOcrMatched       = result ? !!result.matched : null;
  _ocrDiagnostics.lastOcrConfidence    = (result && result.match && typeof result.match.confidence === 'number')
    ? result.match.confidence : null;
  _ocrDiagnostics.lastOcrDurationMs    = (result && typeof result.durationMs === 'number')
    ? result.durationMs : null;
  _ocrDiagnostics.lastOcrLanguage      = result ? (result.language || null) : null;
  _ocrDiagnostics.lastOcrMatchMode     = result ? (result.matchMode || null) : null;
  _ocrDiagnostics.lastOcrTargetTextLen = (result && typeof result.targetText === 'string')
    ? result.targetText.length : 0;
  _ocrDiagnostics.lastOcrBlocksCount   = (result && Array.isArray(result.blocks))
    ? result.blocks.length : 0;
  _ocrDiagnostics.lastOcrRegionUsed    = !!(result && result.region);
}

function _normalizeLanguage(value) {
  if (typeof value !== 'string') return 'ru+en';
  var v = value.toLowerCase().trim();
  if (OCR_LANGUAGES.indexOf(v) !== -1) return v;
  return 'ru+en';
}

function _normalizeMatchMode(value) {
  if (typeof value !== 'string') return 'contains';
  var v = value.toLowerCase().trim();
  if (OCR_MATCH_MODES.indexOf(v) !== -1) return v;
  return 'contains';
}

// Approximate text width based on character count and line height.
// Pure heuristic — the engine does NOT measure real glyph widths.
function _approxTextWidth(text, lineHeight) {
  var n = (typeof text === 'string') ? text.length : 0;
  return Math.max(40, Math.round(n * Math.max(8, lineHeight * 0.55)));
}

function _cloneOcrBlock(b) {
  if (!b || typeof b !== 'object') return null;
  return {
    id:           typeof b.id === 'string' ? b.id : '',
    text:         typeof b.text === 'string' ? b.text : '',
    confidence:   typeof b.confidence === 'number' ? b.confidence : 0,
    boundingBox:  b.boundingBox ? {
      x: b.boundingBox.x | 0, y: b.boundingBox.y | 0,
      width: b.boundingBox.width | 0, height: b.boundingBox.height | 0
    } : null,
    targetPoint:  b.targetPoint ? {
      x: b.targetPoint.x | 0, y: b.targetPoint.y | 0
    } : null
  };
}

function _cloneOcrResult(r) {
  if (!r || typeof r !== 'object') return null;
  return {
    id:               r.id,
    mode:             r.mode,
    realOcr:          false,
    realClick:        false,
    success:          !!r.success,
    matched:          !!r.matched,
    targetText:       r.targetText,
    language:         r.language,
    matchMode:        r.matchMode,
    caseSensitive:    !!r.caseSensitive,
    region:           r.region ? Object.assign({}, r.region) : null,
    screenSourceId:   r.screenSourceId,
    screenSourceName: r.screenSourceName,
    previewSize:      r.previewSize ? Object.assign({}, r.previewSize) : null,
    blocks:           Array.isArray(r.blocks) ? r.blocks.map(_cloneOcrBlock) : [],
    match:            r.match ? _cloneOcrBlock(r.match) : null,
    actionPreview:    r.actionPreview ? Object.assign({}, r.actionPreview, {
      targetPoint:  r.actionPreview.targetPoint ? Object.assign({}, r.actionPreview.targetPoint) : null,
      boundingBox:  r.actionPreview.boundingBox ? Object.assign({}, r.actionPreview.boundingBox) : null,
      usedRegion:   r.actionPreview.usedRegion  ? Object.assign({}, r.actionPreview.usedRegion)  : null
    }) : null,
    errors:           Array.isArray(r.errors)   ? r.errors.slice()   : [],
    warnings:         Array.isArray(r.warnings) ? r.warnings.slice() : [],
    durationMs:       typeof r.durationMs === 'number' ? r.durationMs : 0,
    createdAt:        r.createdAt
  };
}
