// =====================================================================
// ClickFlow — src/visual-builder.js (Step 36)
// ---------------------------------------------------------------------
// Pure-renderer logic module for the Visual Builder.
//
// The Visual Builder is a smart-features dashboard that gathers every
// foundation we have built so far (Screen Capture, Region Selector,
// Templates, Template Matching, Image Click test tools, OCR mock,
// Text Click test tools) into a single read/draft surface.
//
// SAFETY (Step 36):
//   - The Visual Builder NEVER clicks. It NEVER moves the cursor.
//   - The Visual Builder NEVER auto-saves a scenario.
//   - The Visual Builder NEVER auto-runs a scenario.
//   - The Visual Builder NEVER imports robotjs / nut.js / iohook /
//     uiohook-napi / Tesseract / OpenCV / sharp / jimp.
//   - The Visual Builder NEVER persists `imageDataUrl` to disk.
//   - Drafts created here go through the existing scenario form;
//     the user must press Save manually.
//
// This module owns:
//   - overlay settings (which overlays are visible);
//   - the selected action type (simple_click / image_click / text_click);
//   - the last-built draft preview (in-memory only, not persisted).
//
// It exposes:
//   - getVisualBuilderState()
//   - setOverlaySetting(key, value), showAllOverlays(), hideAllOverlays()
//   - clearOverlays()
//   - setSelectedActionType(type)
//   - buildVisualContextFromState(state)
//   - buildDraftPreviewFromState(state, type, options)
//   - clearDraftPreview()
//   - getMissingRequirements(state, type)
//   - getOverlayLayers(state)            — declarative overlay description
//   - getVisualBuilderDiagnostics()
// =====================================================================

'use strict';

// --- Module-local state ---------------------------------------------

var _overlaySettings = {
  showRegion: true,
  showTemplateMatch: true,
  showTemplateTarget: true,
  showOcrBlocks: true,
  showOcrTarget: true,
  showActionTarget: true
};

var _selectedActionType = 'simple_click';
var _lastDraftPreview = null;
var _lastUsedPresetId = null;
var _lastDraftType = null;
var _missingRequirementsCount = 0;

// --- Public: state snapshot -----------------------------------------

function getVisualBuilderState() {
  return {
    overlaySettings: { ..._overlaySettings },
    selectedActionType: _selectedActionType,
    lastDraftPreview: _lastDraftPreview ? _cloneDraft(_lastDraftPreview) : null,
    lastUsedPresetId: _lastUsedPresetId,
    lastDraftType: _lastDraftType,
    missingRequirementsCount: _missingRequirementsCount
  };
}

// --- Public: overlay settings ---------------------------------------

var OVERLAY_KEYS = [
  'showRegion',
  'showTemplateMatch',
  'showTemplateTarget',
  'showOcrBlocks',
  'showOcrTarget',
  'showActionTarget'
];

function setOverlaySetting(key, value) {
  if (OVERLAY_KEYS.indexOf(key) === -1) return false;
  _overlaySettings[key] = !!value;
  return true;
}

function showAllOverlays() {
  for (var i = 0; i < OVERLAY_KEYS.length; i++) {
    _overlaySettings[OVERLAY_KEYS[i]] = true;
  }
}

function hideAllOverlays() {
  for (var i = 0; i < OVERLAY_KEYS.length; i++) {
    _overlaySettings[OVERLAY_KEYS[i]] = false;
  }
}

function clearOverlays() {
  // "clear" means remove last drawn overlays from the result slices
  // but keep the user's preferences intact. The actual DOM clearing
  // is done by visual-builder-ui.js; this function just clears the
  // last draft preview so the legend resets.
  _lastDraftPreview = null;
}

function getOverlayKeys() {
  return OVERLAY_KEYS.slice();
}

// --- Public: selected action type -----------------------------------

function setSelectedActionType(type) {
  if (type === 'simple_click' || type === 'image_click' || type === 'text_click') {
    _selectedActionType = type;
    return true;
  }
  return false;
}

// --- Public: visual context -----------------------------------------

// Build a "visual context" object from the current renderer state.
// This object is the standard input to
// `applyVisualContextToPreset` / `createScenarioDraftFromPreset`.
//
// Numbers and short strings only — never an `imageDataUrl`.
function buildVisualContextFromState(state) {
  if (!state || typeof state !== 'object') return {};
  var ctx = {};
  // Region
  if (state.regionSelector && state.regionSelector.normalizedRegion) {
    var r = state.regionSelector.normalizedRegion;
    ctx.region = {
      x: r.x | 0, y: r.y | 0, width: r.width | 0, height: r.height | 0
    };
  }
  // Active template
  if (state.templates && state.templates.activeTemplateId) {
    ctx.templateId = state.templates.activeTemplateId;
  }
  // Last image-match target point + threshold/step
  if (state.templateMatching && state.templateMatching.lastResult) {
    var lr = state.templateMatching.lastResult;
    if (lr.targetPoint && typeof lr.targetPoint.x === 'number' && typeof lr.targetPoint.y === 'number') {
      ctx.targetPoint = { x: lr.targetPoint.x | 0, y: lr.targetPoint.y | 0 };
    }
    if (typeof state.templateMatching.threshold === 'number') ctx.threshold = state.templateMatching.threshold;
    if (typeof state.templateMatching.step === 'number')      ctx.step      = state.templateMatching.step;
  }
  // Last OCR matched text
  if (state.ocr && state.ocr.lastResult) {
    var ocr = state.ocr.lastResult;
    if (ocr.matched && ocr.match && typeof ocr.match.text === 'string') {
      ctx.matchedText = ocr.match.text;
    } else if (ocr.targetText) {
      ctx.matchedText = ocr.targetText;
    }
    if (ocr.language)  ctx.ocrLanguage = ocr.language;
    if (ocr.matchMode) ctx.matchMode   = ocr.matchMode;
    if (typeof ocr.caseSensitive === 'boolean') ctx.caseSensitive = ocr.caseSensitive;
  }
  return ctx;
}

// --- Public: draft preview ------------------------------------------

// Build a draft preview from the current state. This is what the
// "Create scenario draft" button surfaces BEFORE we open the
// scenario form. The draft is plain data and the caller still has
// to navigate the user through the form and Save manually.
//
// `type` is one of 'simple_click' | 'image_click' | 'text_click'.
// `options.fallbackName`, `options.description` are optional.
//
// Returns { ok: true, draft } or { ok: false, errors: [stableId] }.
function buildDraftPreviewFromState(state, type, options) {
  options = options || {};
  if (type !== 'simple_click' && type !== 'image_click' && type !== 'text_click') {
    return { ok: false, errors: ['invalidScenarioType'] };
  }
  var missing = getMissingRequirements(state, type);
  _missingRequirementsCount = missing.length;
  // Hard-fail conditions (the user MUST fix before we open the form).
  var hardErrors = [];
  if (type === 'image_click') {
    if (missing.indexOf('templateMissing') !== -1) hardErrors.push('templateMissing');
  }
  if (type === 'text_click') {
    if (missing.indexOf('targetTextMissing') !== -1) hardErrors.push('targetTextMissing');
  }
  if (hardErrors.length > 0) {
    return { ok: false, errors: hardErrors, missing: missing };
  }
  var visualCtx = buildVisualContextFromState(state);
  // Settings filled per type. Coordinate fallback:
  //   - if there is a region but no last image-match target,
  //     pick the centre of the region;
  //   - else use 500/400.
  var settings;
  if (type === 'simple_click') {
    var x = 500, y = 400;
    if (visualCtx.targetPoint) {
      x = visualCtx.targetPoint.x | 0;
      y = visualCtx.targetPoint.y | 0;
    } else if (visualCtx.region) {
      x = (visualCtx.region.x + visualCtx.region.width  / 2) | 0;
      y = (visualCtx.region.y + visualCtx.region.height / 2) | 0;
    }
    settings = {
      x: x, y: y,
      button: 'left',
      intervalMs: 500,
      repeatCount: 10
    };
  } else if (type === 'image_click') {
    settings = {
      templateId: visualCtx.templateId || null,
      region:     visualCtx.region     || null,
      threshold:  typeof visualCtx.threshold === 'number' ? visualCtx.threshold : 0.75,
      step:       typeof visualCtx.step      === 'number' ? visualCtx.step      : 4,
      timeoutMs:  10000,
      intervalMs: 1000,
      repeatCount: 1
    };
  } else {
    // text_click
    settings = {
      targetText:    typeof visualCtx.matchedText === 'string' ? visualCtx.matchedText : '',
      language:      visualCtx.ocrLanguage || 'ru+en',
      matchMode:     visualCtx.matchMode   || 'contains',
      caseSensitive: typeof visualCtx.caseSensitive === 'boolean' ? visualCtx.caseSensitive : false,
      region:        visualCtx.region || null,
      timeoutMs:  10000,
      intervalMs: 1000,
      repeatCount: 1
    };
  }
  var draft = {
    ok: true,
    type: type,
    name: typeof options.fallbackName === 'string' && options.fallbackName.length > 0
      ? options.fallbackName
      : _defaultDraftName(type),
    description: typeof options.description === 'string' ? options.description : '',
    settings: settings,
    source: 'visual-builder',
    realClick: false,
    createdAt: new Date().toISOString(),
    missing: missing
  };
  if (type === 'text_click') draft.realOcr = false;
  _lastDraftPreview = _cloneDraft(draft);
  _lastDraftType = type;
  return { ok: true, draft: draft, missing: missing };
}

function clearDraftPreview() {
  _lastDraftPreview = null;
  _lastDraftType = null;
}

function setLastUsedPresetId(id) {
  _lastUsedPresetId = (typeof id === 'string' && id.length > 0) ? id : null;
}

// --- Public: missing requirements -----------------------------------

// Returns an array of stable string IDs describing what is missing
// from the renderer state for the given scenario type. UI maps each
// id to a translation key + a quick-action button.
//
// Stable IDs:
//   - screenPreviewMissing
//   - regionMissing             (warning, not a blocker)
//   - templateMissing           (image_click blocker)
//   - targetTextMissing         (text_click blocker)
//   - ocrResultMissing          (text_click hint, not a blocker)
//   - imageMatchMissing         (image_click hint, not a blocker)
function getMissingRequirements(state, type) {
  if (!state || typeof state !== 'object') return [];
  var missing = [];
  var hasPreview = !!(state.screenCapture && state.screenCapture.preview &&
    typeof state.screenCapture.preview.imageDataUrl === 'string' &&
    state.screenCapture.preview.imageDataUrl.indexOf('data:image/') === 0);
  if (!hasPreview) missing.push('screenPreviewMissing');

  var hasRegion = !!(state.regionSelector && state.regionSelector.normalizedRegion);
  if (!hasRegion) missing.push('regionMissing');

  if (type === 'image_click') {
    var hasTemplate = !!(state.templates && state.templates.activeTemplateId);
    if (!hasTemplate) missing.push('templateMissing');
    var hasMatch = !!(state.templateMatching && state.templateMatching.lastResult &&
      state.templateMatching.lastResult.success && state.templateMatching.lastResult.matched);
    if (!hasMatch) missing.push('imageMatchMissing');
  }
  if (type === 'text_click') {
    var hasOcrResult = !!(state.ocr && state.ocr.lastResult);
    var hasMatchedText = !!(state.ocr && state.ocr.lastResult && state.ocr.lastResult.matched);
    var hasTargetTextInOcr = !!(state.ocr && typeof state.ocr.targetText === 'string' && state.ocr.targetText.length > 0);
    if (!hasOcrResult)  missing.push('ocrResultMissing');
    if (!hasMatchedText && !hasTargetTextInOcr) missing.push('targetTextMissing');
  }
  return missing;
}

// --- Public: declarative overlay layers -----------------------------

// Returns a plain-data list describing the overlay layers we should
// draw given the current state and overlay settings. The actual DOM
// rendering is done by visual-builder-ui.js; this function just
// computes what should be visible.
//
// Each layer:
//   { id: string, kind: 'region' | 'bbox' | 'point' | 'block',
//     visible: boolean, color: string, label: string,
//     coords: { x, y, width?, height? } }
function getOverlayLayers(state) {
  var layers = [];
  if (!state || typeof state !== 'object') return layers;

  // Region layer
  if (state.regionSelector && state.regionSelector.normalizedRegion && _overlaySettings.showRegion) {
    var r = state.regionSelector.normalizedRegion;
    layers.push({
      id: 'region',
      kind: 'region',
      visible: true,
      color: 'blue',
      label: 'region',
      coords: { x: r.x | 0, y: r.y | 0, width: r.width | 0, height: r.height | 0 }
    });
  }

  // Template match bbox + target
  if (state.templateMatching && state.templateMatching.lastResult) {
    var lr = state.templateMatching.lastResult;
    if (lr.success && lr.matched && lr.boundingBox && _overlaySettings.showTemplateMatch) {
      layers.push({
        id: 'template-match',
        kind: 'bbox',
        visible: true,
        color: lr.confidence >= (state.templateMatching.threshold || 0.75) ? 'green' : 'orange',
        label: 'template match',
        coords: { x: lr.boundingBox.x | 0, y: lr.boundingBox.y | 0, width: lr.boundingBox.width | 0, height: lr.boundingBox.height | 0 }
      });
    }
    if (lr.success && lr.matched && lr.targetPoint && _overlaySettings.showTemplateTarget) {
      layers.push({
        id: 'template-target',
        kind: 'point',
        visible: true,
        color: 'red',
        label: 'template target',
        coords: { x: lr.targetPoint.x | 0, y: lr.targetPoint.y | 0 }
      });
    }
  }

  // OCR blocks + matched target
  if (state.ocr && state.ocr.lastResult) {
    var ocr = state.ocr.lastResult;
    if (Array.isArray(ocr.blocks) && _overlaySettings.showOcrBlocks) {
      ocr.blocks.forEach(function (b) {
        if (!b || !b.boundingBox) return;
        layers.push({
          id: 'ocr-block-' + (b.id || layers.length),
          kind: 'block',
          visible: true,
          color: ocr.match && ocr.match.id === b.id ? 'green' : 'yellow',
          label: typeof b.text === 'string' ? (b.text.length > 24 ? b.text.slice(0, 24) + '…' : b.text) : '',
          coords: { x: b.boundingBox.x | 0, y: b.boundingBox.y | 0, width: b.boundingBox.width | 0, height: b.boundingBox.height | 0 }
        });
      });
    }
    if (ocr.match && ocr.match.targetPoint && _overlaySettings.showOcrTarget) {
      layers.push({
        id: 'ocr-target',
        kind: 'point',
        visible: true,
        color: 'red',
        label: 'ocr target',
        coords: { x: ocr.match.targetPoint.x | 0, y: ocr.match.targetPoint.y | 0 }
      });
    }
  }

  // Action target — derived from the last draft preview
  if (_lastDraftPreview && _overlaySettings.showActionTarget) {
    var s = _lastDraftPreview.settings || {};
    if (_lastDraftPreview.type === 'simple_click' && typeof s.x === 'number' && typeof s.y === 'number') {
      layers.push({
        id: 'action-target',
        kind: 'point',
        visible: true,
        color: 'cyan',
        label: 'action target',
        coords: { x: s.x | 0, y: s.y | 0 }
      });
    }
  }

  return layers;
}

// --- Public: diagnostics --------------------------------------------

function getVisualBuilderDiagnostics() {
  var presetsCount = 0;
  var presetsAvailable = false;
  if (typeof getScenarioPresets === 'function') {
    var arr = getScenarioPresets();
    presetsCount = Array.isArray(arr) ? arr.length : 0;
    presetsAvailable = presetsCount > 0;
  }
  return {
    presetsAvailable: presetsAvailable,
    presetsCount: presetsCount,
    lastUsedPresetId: _lastUsedPresetId,
    lastDraftType: _lastDraftType,
    visualBuilderDraftAvailable: !!_lastDraftPreview,
    overlaySettings: { ..._overlaySettings },
    selectedActionType: _selectedActionType,
    missingRequirementsCount: _missingRequirementsCount,
    realClick: false,
    realOcr: false,
    autoSavesScenarios: false,
    autoRunsScenarios: false
  };
}

// --- Internal helpers -----------------------------------------------

function _defaultDraftName(type) {
  if (type === 'image_click') return 'Image click draft';
  if (type === 'text_click')  return 'Text click draft';
  return 'Coordinate click draft';
}

function _cloneDraft(d) {
  if (!d || typeof d !== 'object') return null;
  var settings = d.settings ? JSON.parse(JSON.stringify(d.settings)) : {};
  // Defensive: drop any imageDataUrl that snuck in.
  if (settings && typeof settings === 'object') {
    delete settings.imageDataUrl;
    delete settings.previewDataUrl;
  }
  return {
    ok: !!d.ok,
    type: d.type,
    name: d.name,
    description: d.description,
    settings: settings,
    source: d.source,
    realClick: false,
    realOcr: d.type === 'text_click' ? false : undefined,
    createdAt: d.createdAt,
    missing: Array.isArray(d.missing) ? d.missing.slice() : []
  };
}
