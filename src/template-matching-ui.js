// =====================================================================
// ClickFlow — src/template-matching-ui.js (Step 28)
// ---------------------------------------------------------------------
// Renderer UI for the new Advanced → Template Matching tab.
//
// HARD GUARANTEES (Step 28):
//   - All user-visible text is rendered with `textContent`. The only
//     `innerHTML` use in this file is `= ''` to clear a container.
//   - Image thumbnails (the screen-capture preview backdrop for the
//     overlay) come from the safe IPC chain and are written to
//     `<img>.src` only. They are never re-injected as raw HTML.
//   - This module never imports Node, Electron, or `ipcRenderer`.
//   - This module never executes a real click and never calls a
//     real matcher. The "Run mock match" button calls the pure-
//     logic `runMockTemplateMatch` from `template-matching-mock.js`,
//     which only consumes plain-data metadata.
// =====================================================================

// ---------------------------------------------------------------------
// Audit / log helpers (no-ops if their host modules are missing).
// ---------------------------------------------------------------------
function _tmAudit(type, payload) {
  if (typeof recordAuditEvent === 'function') {
    try { recordAuditEvent(type, payload || {}); } catch (e) {}
  }
}
function _tmLog(level, message) {
  if (typeof addLogEntry === 'function' && typeof createLog === 'function') {
    try { addLogEntry(createLog(level, message)); } catch (e) {}
  }
}
function _tt(key, fallback) {
  if (typeof t === 'function') {
    var v = t(key);
    if (v !== undefined && v !== null) return v;
  }
  return (typeof fallback === 'string') ? fallback : key;
}

// ---------------------------------------------------------------------
// DOM helpers.
// ---------------------------------------------------------------------
function _tmAddCardRow(card, label, value) {
  var row = document.createElement('div'); row.className = 'adv-card-row';
  var lbl = document.createElement('span'); lbl.className = 'adv-card-label'; lbl.textContent = label;
  var val = document.createElement('span'); val.className = 'adv-card-value'; val.textContent = value;
  row.appendChild(lbl); row.appendChild(val); card.appendChild(row);
}
function _tmTabContainer() {
  return document.getElementById('advanced-tab-templateMatching');
}
function _tmBoolText(v) {
  return v ? _tt('yes', 'yes') : _tt('no', 'no');
}
function _tmFormatPoint(p) {
  if (!p || typeof p !== 'object') return _tt('none2', '—');
  return (p.x | 0) + ', ' + (p.y | 0);
}
function _tmFormatRect(r) {
  if (!r || typeof r !== 'object') return _tt('none2', '—');
  return (r.x | 0) + ',' + (r.y | 0) + ' · ' + (r.width | 0) + '×' + (r.height | 0);
}
function _tmFormatConfidence(c) {
  if (typeof c !== 'number' || !isFinite(c)) return '—';
  return (Math.round(c * 1000) / 10).toFixed(1) + '%';
}

// =====================================================================
// Public entry points
// =====================================================================

// Programmatically open the Template Matching tab.
function openTemplateMatchingTab() {
  if (typeof setAdvancedTab === 'function') {
    setAdvancedTab('templateMatching');
  } else {
    renderTemplateMatchingTab();
  }
}

// Top-level renderer for the tab. Idempotent — safe to call
// multiple times (it always rebuilds the section).
function renderTemplateMatchingTab() {
  var c = _tmTabContainer();
  if (!c) return;
  c.innerHTML = ''; // clear container only — never user text

  // 1. Header
  var header = document.createElement('div'); header.className = 'adv-card';
  var headerTitle = document.createElement('div');
  headerTitle.className = 'adv-card-title';
  headerTitle.textContent = _tt('templateMatching', 'Template Matching');
  header.appendChild(headerTitle);
  c.appendChild(header);

  // 2. Mock / dry-run safety notice. Same visual style as the
  //    screen-capture and templates safety notices, but with copy
  //    that explicitly names the mock contract.
  var notice = document.createElement('div');
  notice.className = 'adv-warning template-matching-mock-notice';
  notice.textContent = _tt(
    'mockMatchNotice',
    'This is a mock/dry-run. Real image recognition and clicks are not performed yet.'
  );
  c.appendChild(notice);

  // 3. Requirements checklist (preview / template / region /
  //    real-matching disabled / real-click disabled).
  c.appendChild(renderTemplateMatchingRequirements());

  // 4. Current input summary (preview / template / region snapshot).
  c.appendChild(renderTemplateMatchingInputSummary());

  // 5. Match mode + algorithm controls (Step 29). The user picks
  //    between Mock (Step 28 deterministic) and Real preview
  //    (Step 29 plain-JS engine analysing the captured preview
  //    image). Threshold and step are forwarded to the engine on
  //    every run.
  c.appendChild(renderTemplateMatchingControls());

  // 6. Action buttons. Run is enabled only when input is valid.
  var actions = document.createElement('div'); actions.className = 'adv-btn-group template-matching-actions';

  var state = _tmReadState();
  var mode = (state.templateMatching && state.templateMatching.mode) || 'mock';
  var isReal = (mode === 'real-preview');

  var runBtn = document.createElement('button');
  runBtn.className = 'adv-btn'; runBtn.id = 'tm-btn-run';
  runBtn.textContent = isReal
    ? _tt('runRealPreviewMatch', 'Run real preview match')
    : _tt('runMockMatch', 'Run mock match');
  runBtn.addEventListener('click', runTemplateMatchingDispatch);
  actions.appendChild(runBtn);

  var clearBtn = document.createElement('button');
  clearBtn.className = 'adv-btn adv-btn-secondary'; clearBtn.id = 'tm-btn-clear';
  clearBtn.textContent = _tt('clearMatchResult', 'Clear result');
  clearBtn.addEventListener('click', clearTemplateMatchingMockResult);
  actions.appendChild(clearBtn);

  c.appendChild(actions);

  // 7. Visual overlay (compact preview with the bounding box +
  //    target point drawn on top). Empty state if no preview.
  c.appendChild(renderTemplateMatchingOverlay());

  // 8. Result card.
  c.appendChild(renderTemplateMatchingResult());

  // 9. Action preview card — the planned `image_click` action,
  //    rendered as text. Never executed.
  c.appendChild(renderActionPreview());

  // Disable Run when the matcher is busy or the input is invalid;
  // the user still gets a clear explanation in the requirements
  // checklist above.
  var input = buildTemplateMatchInputFromState();
  var validation = (typeof validateTemplateMatchInput === 'function')
    ? validateTemplateMatchInput(input)
    : { valid: !!(input && input.screenPreview && input.template), reason: null };
  var slice = state.templateMatching || { isRunning: false };
  // Real preview also needs the active template to have a
  // previewDataUrl available — without pixel data the engine can
  // only run in mock mode.
  var hasTemplatePixels = isReal ? _activeTemplateHasPreview(state) : true;
  var hasPreviewPixels  = isReal ? _activePreviewHasPixels(state)   : true;
  runBtn.disabled = !!slice.isRunning || !validation.valid ||
    !hasTemplatePixels || !hasPreviewPixels;
}

// =====================================================================
// Build the matching input from current renderer state
// =====================================================================

// Helper: read state safely. Always returns a populated object.
function _tmReadState() {
  if (typeof getState !== 'function') {
    return {
      screenCapture: { preview: null },
      templates: { items: [], activeTemplateId: null },
      regionSelector: { normalizedRegion: null, selectedRegion: null }
    };
  }
  return getState();
}

// Resolve the active template metadata from the templates slice.
function _tmActiveTemplate(state) {
  if (!state || !state.templates) return null;
  var activeId = state.templates.activeTemplateId;
  if (!activeId) return null;
  var items = Array.isArray(state.templates.items) ? state.templates.items : [];
  for (var i = 0; i < items.length; i++) {
    if (items[i] && items[i].id === activeId) return items[i];
  }
  return null;
}

// Build the matching input from `screenCapture.preview` + active
// template + (optional) `regionSelector.normalizedRegion`.
//
// We deliberately use `normalizedRegion` (image-space) so the
// rectangle we hand to the mock matcher lines up with the preview
// pixels we report as the source. When there is no region we pass
// `null` and the mock centres on the whole preview.
function buildTemplateMatchInputFromState() {
  var state = _tmReadState();
  var preview = (state.screenCapture && state.screenCapture.preview) ? state.screenCapture.preview : null;
  var tpl = _tmActiveTemplate(state);
  var region = null;
  if (state.regionSelector && state.regionSelector.normalizedRegion) {
    region = state.regionSelector.normalizedRegion;
  }
  if (typeof createTemplateMatchInput === 'function') {
    return createTemplateMatchInput(preview, tpl, region);
  }
  // Fallback if the mock module hasn't loaded yet — should not
  // happen in production because index.html loads it before this
  // file, but we keep the renderer resilient.
  return {
    screenPreview: preview ? {
      sourceId: preview.sourceId || '',
      name: preview.name || '',
      type: preview.type || 'screen',
      width: Number(preview.width) || 0,
      height: Number(preview.height) || 0,
      capturedAt: preview.capturedAt || ''
    } : null,
    template: tpl ? {
      id: tpl.id || '',
      name: tpl.name || '',
      width: Number(tpl.width) || 0,
      height: Number(tpl.height) || 0
    } : null,
    region: region ? {
      x: Number(region.x) || 0, y: Number(region.y) || 0,
      width: Number(region.width) || 0, height: Number(region.height) || 0
    } : null
  };
}

// =====================================================================
// Requirements checklist
// =====================================================================

function renderTemplateMatchingRequirements() {
  var card = document.createElement('div'); card.className = 'adv-card template-matching-requirements';
  var title = document.createElement('div'); title.className = 'adv-card-title';
  title.textContent = _tt('matchInputSummary', 'Matching prerequisites');
  card.appendChild(title);

  var input = buildTemplateMatchInputFromState();
  var hasPreview = !!(input.screenPreview && input.screenPreview.width > 0 && input.screenPreview.height > 0);
  var hasTemplate = !!(input.template && input.template.id && input.template.width > 0 && input.template.height > 0);
  var hasRegion = !!(input.region && input.region.width > 5 && input.region.height > 5);

  var list = document.createElement('div'); list.className = 'template-matching-checklist';

  function addCheck(label, ok, options) {
    var row = document.createElement('div'); row.className = 'template-matching-checklist-row';
    var marker = document.createElement('span');
    marker.className = 'template-matching-check-marker' +
      (ok ? ' template-matching-check-ok' :
       (options && options.optional) ? ' template-matching-check-optional' :
       ' template-matching-check-todo');
    marker.textContent = ok ? '✓' : ((options && options.optional) ? '○' : '×');
    var lbl = document.createElement('span'); lbl.className = 'template-matching-check-label';
    lbl.textContent = label;
    row.appendChild(marker); row.appendChild(lbl);
    if (options && options.hint) {
      var hint = document.createElement('span'); hint.className = 'template-matching-check-hint';
      hint.textContent = options.hint;
      row.appendChild(hint);
    }
    list.appendChild(row);
  }

  addCheck(_tt('screenPreviewRequired', 'Screen preview available'), hasPreview, {
    hint: hasPreview ? '' : _tt('capturePreviewFirst', 'Capture a screenshot preview first.')
  });
  addCheck(_tt('activeTemplateRequired', 'Active template selected'), hasTemplate, {
    hint: hasTemplate ? '' : _tt('noActiveTemplate', 'No template selected')
  });
  addCheck(_tt('regionOptional', 'Region (optional)'), hasRegion, { optional: true });

  // Step 29: when the user picks Real preview, surface whether the
  // pixel data needed by the engine is actually in renderer memory.
  var stateForChecks = _tmReadState();
  var modeForChecks = (stateForChecks.templateMatching && stateForChecks.templateMatching.mode) || 'mock';
  if (modeForChecks === 'real-preview') {
    var hasPreviewPixels  = _activePreviewHasPixels(stateForChecks);
    var hasTemplatePixels = _activeTemplateHasPreview(stateForChecks);
    addCheck(_tt('engineAvailable', 'Engine available'),
      typeof runTemplateMatch === 'function', { optional: true });
    addCheck(_tt('analyzesPreviewOnly', 'Analyzes preview only'), true, { optional: true });
    if (!hasPreviewPixels) {
      addCheck(_tt('screenPreviewMissing', 'Screen preview is missing'), false, {
        hint: _tt('capturePreviewFirst', 'Capture a screenshot preview first.')
      });
    }
    if (!hasTemplatePixels) {
      addCheck(_tt('templateImageMissing', 'Template image is missing'), false, {
        hint: _tt('templateImageMissing', 'Template image is missing')
      });
    }
  }

  // Hard "no real" rows — visually identical to the others so the
  // user always sees the simulation contract on this tab.
  addCheck(_tt('realMatchingDisabled', 'Real matching disabled'), false, {
    optional: true,
    hint: _tt('realImageRecognitionNotImplemented', 'Real image recognition is not implemented.')
  });
  addCheck(_tt('realClickDisabled', 'Real click disabled'), false, {
    optional: true,
    hint: _tt('realActionsDisabledDryRunOnly', 'Real actions are disabled — dry-run preview only.')
  });

  card.appendChild(list);
  return card;
}

// =====================================================================
// Input summary
// =====================================================================

function renderTemplateMatchingInputSummary() {
  var card = document.createElement('div'); card.className = 'adv-card template-matching-input-card';
  var title = document.createElement('div'); title.className = 'adv-card-title';
  title.textContent = _tt('matchInputSummary', 'Current input');
  card.appendChild(title);

  var input = buildTemplateMatchInputFromState();
  var sp = input.screenPreview;
  var tpl = input.template;
  var rg = input.region;

  _tmAddCardRow(card, _tt('screenPreview', 'Screenshot source'),
    sp ? (sp.name || sp.sourceId || '—') : _tt('noPreview', 'No preview yet.'));
  _tmAddCardRow(card, _tt('coordinates', 'Screenshot size'),
    sp ? ((sp.width | 0) + ' × ' + (sp.height | 0)) : _tt('none2', '—'));
  _tmAddCardRow(card, _tt('activeTemplate', 'Active template'),
    tpl ? (tpl.name || tpl.id || '—') : _tt('noActiveTemplate', 'No template selected'));
  _tmAddCardRow(card, _tt('imageSize', 'Template size'),
    tpl ? ((tpl.width | 0) + ' × ' + (tpl.height | 0)) : _tt('none2', '—'));
  _tmAddCardRow(card, _tt('usedRegion', 'Selected region'),
    rg ? _tmFormatRect(rg) : _tt('noRegionSelected', 'No region selected'));

  return card;
}

// =====================================================================
// Visual overlay (compact preview + bounding box + target point)
// =====================================================================

function renderTemplateMatchingOverlay() {
  var card = document.createElement('div'); card.className = 'adv-card template-matching-overlay-card';
  var title = document.createElement('div'); title.className = 'adv-card-title';
  title.textContent = _tt('visualMatchOverlay', 'Visual overlay');
  card.appendChild(title);

  var state = _tmReadState();
  var preview = (state.screenCapture && state.screenCapture.preview) ? state.screenCapture.preview : null;
  if (!preview) {
    var empty = document.createElement('div'); empty.className = 'adv-log-empty template-matching-empty';
    empty.textContent = _tt('capturePreviewFirst', 'Capture a screenshot preview first.');
    card.appendChild(empty);
    return card;
  }

  var match = state.templateMatching ? state.templateMatching.lastResult : null;

  // Build a positioning wrapper. The overlay sits on top of the
  // preview image and uses CSS percentages keyed off the original
  // image dimensions, so the rectangle stays visually correct
  // regardless of how the browser scales the preview.
  var wrapper = document.createElement('div');
  wrapper.className = 'template-matching-overlay-wrapper';

  var img = document.createElement('img');
  img.className = 'template-matching-overlay-image';
  img.alt = '';
  img.src = preview.imageDataUrl || ''; // safe DataURL from preload IPC
  img.addEventListener('dragstart', function (e) { e.preventDefault(); });
  wrapper.appendChild(img);

  // Used region (Step 26). Rendered as a thin dashed rectangle so
  // the user can see the search area distinctly from the match.
  var rg = state.regionSelector ? state.regionSelector.normalizedRegion : null;
  if (rg && _isPositiveSize(preview)) {
    var rgRect = document.createElement('div');
    rgRect.className = 'template-matching-overlay-region';
    rgRect.style.left   = (rg.x      / preview.width)  * 100 + '%';
    rgRect.style.top    = (rg.y      / preview.height) * 100 + '%';
    rgRect.style.width  = (rg.width  / preview.width)  * 100 + '%';
    rgRect.style.height = (rg.height / preview.height) * 100 + '%';
    wrapper.appendChild(rgRect);
  }

  // Bounding box of the match.
  if (match && match.boundingBox && _isPositiveSize(preview)) {
    var bb = match.boundingBox;
    var bbEl = document.createElement('div');
    bbEl.className = 'template-matching-overlay-bbox';
    if (match.mode === 'real-preview') {
      bbEl.classList.add('template-matching-overlay-bbox-real');
    }
    if (!match.matched) {
      // Low-confidence / candidate styling — dashed border, faint
      // fill, no centered confidence badge.
      bbEl.classList.add('template-matching-overlay-bbox-candidate');
    }
    bbEl.style.left   = (bb.x      / preview.width)  * 100 + '%';
    bbEl.style.top    = (bb.y      / preview.height) * 100 + '%';
    bbEl.style.width  = (bb.width  / preview.width)  * 100 + '%';
    bbEl.style.height = (bb.height / preview.height) * 100 + '%';
    wrapper.appendChild(bbEl);

    // Confidence badge (small label inside the rectangle).
    var conf = document.createElement('span');
    conf.className = 'template-matching-overlay-confidence';
    var modeLabel = (match.mode === 'real-preview')
      ? _tt('realPreviewMatching', 'real preview')
      : _tt('mockTemplateMatching', 'mock');
    var stateLabel = match.matched ? '' : ' · ' + _tt('lowConfidence', 'low');
    conf.textContent = _tmFormatConfidence(match.confidence) + ' · ' + modeLabel + stateLabel;
    bbEl.appendChild(conf);
  }

  // Target point marker.
  if (match && match.targetPoint && _isPositiveSize(preview)) {
    var tp = match.targetPoint;
    var dot = document.createElement('div');
    dot.className = 'template-matching-overlay-target';
    dot.style.left = (tp.x / preview.width)  * 100 + '%';
    dot.style.top  = (tp.y / preview.height) * 100 + '%';
    wrapper.appendChild(dot);
  }

  card.appendChild(wrapper);

  // Always-visible "preview only" reminder beneath the overlay.
  var note = document.createElement('div');
  note.className = 'template-matching-overlay-note';
  note.textContent = _tt('mockMatchNotice', 'This is a mock/dry-run. Real image recognition and clicks are not performed yet.');
  card.appendChild(note);

  return card;
}

function _isPositiveSize(p) {
  return p && typeof p === 'object' &&
         typeof p.width === 'number' && p.width > 0 &&
         typeof p.height === 'number' && p.height > 0;
}

// =====================================================================
// Step 29: Match-mode controls (mode / threshold / step)
// =====================================================================

// Build the controls card. Uses native <select> / <input> elements
// — no third-party form widgets — and writes back through the
// app-state mutators, so the diagnostics card immediately reflects
// the change.
function renderTemplateMatchingControls() {
  var card = document.createElement('div'); card.className = 'adv-card template-matching-controls-card';
  var title = document.createElement('div'); title.className = 'adv-card-title';
  title.textContent = _tt('matchMode', 'Match mode');
  card.appendChild(title);

  var state = _tmReadState();
  var slice = state.templateMatching || { mode: 'mock', threshold: 0.75, step: 4 };
  var mode = slice.mode || 'mock';
  var isReal = (mode === 'real-preview');

  // --- Mode picker (Mock / Real preview) ---
  var modeRow = document.createElement('div'); modeRow.className = 'template-matching-control-row';
  var modeLabel = document.createElement('label');
  modeLabel.className = 'template-matching-control-label';
  modeLabel.textContent = _tt('matchMode', 'Match mode');
  var modeSelect = document.createElement('select');
  modeSelect.className = 'template-matching-mode-select';
  modeSelect.id = 'tm-input-mode';
  [
    { value: 'mock',         label: _tt('mockTemplateMatching', 'Mock / dry-run') },
    { value: 'real-preview', label: _tt('realPreviewMatching',  'Real preview matching') }
  ].forEach(function (opt) {
    var o = document.createElement('option');
    o.value = opt.value;
    o.textContent = opt.label;
    if (opt.value === mode) o.selected = true;
    modeSelect.appendChild(o);
  });
  modeSelect.addEventListener('change', function () {
    if (typeof setTemplateMatchingMode === 'function') {
      setTemplateMatchingMode(modeSelect.value);
    }
    renderTemplateMatchingTab();
  });
  modeRow.appendChild(modeLabel);
  modeRow.appendChild(modeSelect);
  card.appendChild(modeRow);

  // --- Real-preview safety notice (only shown for real preview) ---
  if (isReal) {
    var realNotice = document.createElement('div');
    realNotice.className = 'adv-warning template-matching-real-preview-notice';
    realNotice.textContent = _tt(
      'realPreviewMatchNotice',
      'Real preview matching analyzes the preview image only. It does not click or control the device.'
    );
    card.appendChild(realNotice);
  }

  // --- Threshold (number input) ---
  var thrRow = document.createElement('div'); thrRow.className = 'template-matching-control-row';
  var thrLabel = document.createElement('label');
  thrLabel.className = 'template-matching-control-label';
  thrLabel.textContent = _tt('threshold', 'Threshold');
  thrLabel.setAttribute('for', 'tm-input-threshold');
  var thrInput = document.createElement('input');
  thrInput.type = 'number';
  thrInput.id = 'tm-input-threshold';
  thrInput.className = 'template-matching-threshold-input';
  thrInput.min = '0'; thrInput.max = '1'; thrInput.step = '0.05';
  var rawThr = (typeof slice.threshold === 'number' && isFinite(slice.threshold)) ? slice.threshold : 0.75;
  thrInput.value = String(rawThr);
  thrInput.addEventListener('change', function () {
    if (typeof setTemplateMatchingThreshold === 'function') {
      setTemplateMatchingThreshold(thrInput.value);
    }
    renderTemplateMatchingTab();
  });
  thrRow.appendChild(thrLabel);
  thrRow.appendChild(thrInput);
  card.appendChild(thrRow);

  // --- Step (select 1/2/4/8/16) ---
  var stepRow = document.createElement('div'); stepRow.className = 'template-matching-control-row';
  var stepLabel = document.createElement('label');
  stepLabel.className = 'template-matching-control-label';
  stepLabel.textContent = _tt('step', 'Step');
  stepLabel.setAttribute('for', 'tm-input-step');
  var stepSelect = document.createElement('select');
  stepSelect.id = 'tm-input-step';
  stepSelect.className = 'template-matching-step-select';
  var rawStep = (typeof slice.step === 'number' && slice.step > 0) ? slice.step : 4;
  [1, 2, 4, 8, 16].forEach(function (s) {
    var o = document.createElement('option');
    o.value = String(s); o.textContent = String(s);
    if (s === rawStep) o.selected = true;
    stepSelect.appendChild(o);
  });
  stepSelect.addEventListener('change', function () {
    if (typeof setTemplateMatchingStep === 'function') {
      setTemplateMatchingStep(stepSelect.value);
    }
    renderTemplateMatchingTab();
  });
  stepRow.appendChild(stepLabel);
  stepRow.appendChild(stepSelect);
  card.appendChild(stepRow);

  return card;
}

// Helper: does the active template have a previewDataUrl in memory?
// Real-preview matching needs pixel bytes; without them we keep
// the Run button disabled (and surface a hint via the requirements
// checklist).
function _activeTemplateHasPreview(state) {
  if (!state || !state.templates) return false;
  var activeId = state.templates.activeTemplateId;
  if (!activeId) return false;
  var items = Array.isArray(state.templates.items) ? state.templates.items : [];
  for (var i = 0; i < items.length; i++) {
    if (items[i] && items[i].id === activeId) {
      return typeof items[i].previewDataUrl === 'string' && items[i].previewDataUrl.indexOf('data:image/') === 0;
    }
  }
  return false;
}

// Helper: does the captured preview have an imageDataUrl in memory?
function _activePreviewHasPixels(state) {
  if (!state || !state.screenCapture) return false;
  var p = state.screenCapture.preview;
  if (!p) return false;
  return typeof p.imageDataUrl === 'string' && p.imageDataUrl.indexOf('data:image/') === 0;
}

// =====================================================================
// Step 29: dispatcher — picks Mock or Real preview
// =====================================================================

function runTemplateMatchingDispatch() {
  var state = _tmReadState();
  var slice = state.templateMatching || { mode: 'mock' };
  var mode = slice.mode || 'mock';
  if (mode === 'real-preview') {
    runTemplateMatchingRealPreview();
  } else {
    runTemplateMatchingMock();
  }
}

// Run the real preview-only matching engine. Pulls the screen
// preview imageDataUrl and the active template previewDataUrl from
// state, then forwards them to the engine.
async function runTemplateMatchingRealPreview() {
  if (typeof runTemplateMatch !== 'function') {
    _tmLog('error', _tt('mockMatchFailed', 'Match failed') + ': engine unavailable');
    return;
  }
  var state = _tmReadState();
  var preview = state.screenCapture ? state.screenCapture.preview : null;
  var activeTpl = (function () {
    if (!state.templates || !state.templates.activeTemplateId) return null;
    var items = Array.isArray(state.templates.items) ? state.templates.items : [];
    for (var i = 0; i < items.length; i++) {
      if (items[i] && items[i].id === state.templates.activeTemplateId) return items[i];
    }
    return null;
  })();
  if (!preview || !preview.imageDataUrl) {
    _tmLog('error', _tt('screenPreviewMissing', 'Screen preview is missing'));
    if (typeof setTemplateMatchingError === 'function') setTemplateMatchingError(_tt('screenPreviewMissing', 'Screen preview is missing'));
    _tmAudit('template.match.realPreview.failed', { reason: 'screen-preview-missing' });
    renderTemplateMatchingTab();
    return;
  }
  if (!activeTpl || typeof activeTpl.previewDataUrl !== 'string' || activeTpl.previewDataUrl.length === 0) {
    _tmLog('error', _tt('templateImageMissing', 'Template image is missing'));
    if (typeof setTemplateMatchingError === 'function') setTemplateMatchingError(_tt('templateImageMissing', 'Template image is missing'));
    _tmAudit('template.match.realPreview.failed', { reason: 'template-image-missing' });
    renderTemplateMatchingTab();
    return;
  }

  // Build the sanitised input snapshot (Step 28's helper drops any
  // imageDataUrl from the metadata it stores in app-state).
  var input = buildTemplateMatchInputFromState();
  if (typeof setTemplateMatchingInput === 'function') setTemplateMatchingInput(input);

  // Audit (numbers / ids only — no pixel bytes ever).
  _tmAudit('template.match.realPreview.requested', {
    sourceId:  input.screenPreview ? (input.screenPreview.sourceId || '') : '',
    templateId: input.template     ? (input.template.id            || '') : '',
    hasRegion: !!input.region,
    threshold: state.templateMatching ? state.templateMatching.threshold : null,
    step:      state.templateMatching ? state.templateMatching.step : null
  });

  if (typeof setTemplateMatchingError   === 'function') setTemplateMatchingError(null);
  if (typeof setTemplateMatchingRunning === 'function') setTemplateMatchingRunning(true);
  renderTemplateMatchingTab();

  var threshold = (state.templateMatching && typeof state.templateMatching.threshold === 'number') ? state.templateMatching.threshold : 0.75;
  var step      = (state.templateMatching && typeof state.templateMatching.step === 'number')      ? state.templateMatching.step      : 4;

  var resp;
  try {
    resp = await runTemplateMatch(preview.imageDataUrl, activeTpl.previewDataUrl, {
      region:    input.region || null,
      threshold: threshold,
      step:      step,
      screenSize: { width: preview.width || 0, height: preview.height || 0 }
    });
  } catch (err) {
    resp = { success: false, error: 'engine-exception', warnings: [] };
  }

  if (typeof setTemplateMatchingRunning === 'function') setTemplateMatchingRunning(false);

  if (!resp || !resp.success || !resp.match) {
    var msg = (resp && resp.error) ? resp.error : 'real-preview-match-failed';
    if (typeof setTemplateMatchingError === 'function') setTemplateMatchingError(msg);
    _tmAudit('template.match.realPreview.failed', { reason: msg });
    _tmLog('error', _tt('mockMatchFailed', 'Match failed') + ': ' + msg);
    renderTemplateMatchingTab();
    return;
  }

  // Audit any engine warnings up-front so the audit timeline shows
  // "we capped the search area" / "we raised the step" before the
  // completed event.
  if (Array.isArray(resp.warnings)) {
    resp.warnings.forEach(function (w) {
      _tmAudit('template.match.engine.warning', { reason: w });
    });
  }

  // Convert the engine match into the renderer-shared shape and
  // store it in the slice. From this point onwards the existing
  // result card / overlay / action preview render the result the
  // same way they render a mock result.
  var result = (typeof createTemplateMatchResult === 'function')
    ? createTemplateMatchResult(resp.match, input)
    : null;
  if (!result) {
    _tmAudit('template.match.realPreview.failed', { reason: 'result-shape-invalid' });
    _tmLog('error', _tt('mockMatchFailed', 'Match failed') + ': result shape invalid');
    renderTemplateMatchingTab();
    return;
  }

  if (typeof setTemplateMatchingResult === 'function') setTemplateMatchingResult(result);

  if (result.matched) {
    _tmAudit('template.match.realPreview.completed', {
      templateId: result.templateId || '',
      confidence: result.confidence,
      threshold:  result.threshold,
      targetX:    result.targetPoint ? (result.targetPoint.x | 0) : 0,
      targetY:    result.targetPoint ? (result.targetPoint.y | 0) : 0,
      boxW:       result.boundingBox ? (result.boundingBox.width  | 0) : 0,
      boxH:       result.boundingBox ? (result.boundingBox.height | 0) : 0,
      durationMs: result.durationMs || 0,
      step:       result.step || 0,
      pixelStep:  result.pixelStep || 0,
      scannedPositions: result.scannedPositions || 0,
      usedRegion:    !!result.usedRegion,
      realMatching:  false,
      realClick:     false
    });
    _tmLog('success', _tt('matchFound', 'Match found') + ' (' + Math.round(result.confidence * 100) + '%)');
  } else {
    _tmAudit('template.match.lowConfidence', {
      templateId: result.templateId || '',
      confidence: result.confidence,
      threshold:  result.threshold,
      durationMs: result.durationMs || 0
    });
    _tmLog('warning', _tt('lowConfidence', 'Low confidence') + ' (' + Math.round(result.confidence * 100) + '% < ' + Math.round(result.threshold * 100) + '%)');
  }

  // Action preview (planned image_click) — same audit as Step 28.
  if (typeof createImageClickActionPreview === 'function') {
    var ap = createImageClickActionPreview(result);
    if (ap) {
      _tmAudit('image.click.preview.created', {
        templateId:  ap.templateId || '',
        targetX:     ap.targetPoint ? (ap.targetPoint.x | 0) : 0,
        targetY:     ap.targetPoint ? (ap.targetPoint.y | 0) : 0,
        confidence:  ap.confidence,
        realClick:   false,
        realMatching: false
      });
    }
  }
  renderTemplateMatchingTab();
}

// =====================================================================
// Result card
// =====================================================================

function renderTemplateMatchingResult() {
  var card = document.createElement('div'); card.className = 'adv-card template-matching-result-card';
  var title = document.createElement('div'); title.className = 'adv-card-title';
  title.textContent = _tt('matchResult', 'Match result');
  card.appendChild(title);

  var state = _tmReadState();
  var slice = state.templateMatching || { lastResult: null, lastError: null, lastRunAt: null };
  if (slice.lastError) {
    var errEl = document.createElement('div'); errEl.className = 'adv-warning template-matching-error';
    errEl.textContent = slice.lastError;
    card.appendChild(errEl);
  }

  if (!slice.lastResult) {
    var empty = document.createElement('div'); empty.className = 'adv-log-empty template-matching-empty';
    empty.textContent = _tt('noMatchResult', 'No match result yet.');
    card.appendChild(empty);
    return card;
  }

  var r = slice.lastResult;
  // Mock badge. Always shows even after a "successful" mock match.
  var badge = document.createElement('div'); badge.className = 'template-matching-mock-badge';
  if (r.mode === 'real-preview') {
    badge.classList.add('template-matching-real-preview-badge');
    badge.textContent = _tt('realPreviewMatching', 'Real preview matching');
  } else {
    badge.textContent = _tt('mockTemplateMatching', 'mock / dry-run');
  }
  card.appendChild(badge);

  // "Match found" / "Low confidence" / "No match" headline. The
  // bbox is still shown — for a low-confidence run it is the best
  // candidate the engine could find.
  var headline = document.createElement('div');
  headline.className = 'template-matching-headline';
  if (r.matched) {
    headline.classList.add('template-matching-headline-ok');
    headline.textContent = _tt('matchFound', 'Match found');
  } else if (r.mode === 'real-preview') {
    headline.classList.add('template-matching-headline-low');
    headline.textContent = _tt('lowConfidence', 'Low confidence — showing best candidate');
  } else {
    headline.classList.add('template-matching-headline-low');
    headline.textContent = _tt('matchNotFound', 'No match');
  }
  card.appendChild(headline);

  _tmAddCardRow(card, 'matched',                              _tmBoolText(!!r.matched));
  _tmAddCardRow(card, _tt('matchConfidence', 'Confidence'),   _tmFormatConfidence(r.confidence));
  if (typeof r.threshold === 'number' && isFinite(r.threshold)) {
    _tmAddCardRow(card, _tt('matchThreshold', 'Threshold'),   _tmFormatConfidence(r.threshold));
  }
  _tmAddCardRow(card, _tt('boundingBox', 'Bounding box'),     _tmFormatRect(r.boundingBox));
  _tmAddCardRow(card, _tt('targetPoint', 'Target point'),     _tmFormatPoint(r.targetPoint));
  _tmAddCardRow(card, _tt('usedRegion', 'Used region'),       r.usedRegion ? _tmFormatRect(r.usedRegion) : _tt('noRegionSelected', 'No region selected'));
  _tmAddCardRow(card, _tt('templateName', 'Template name'),   r.templateName || r.templateId || '—');
  if (typeof r.durationMs === 'number' && isFinite(r.durationMs)) {
    _tmAddCardRow(card, _tt('durationMs', 'Duration'),        r.durationMs + ' ms');
  }
  if (typeof r.step === 'number' && r.step > 0) {
    var stepText = String(r.step);
    if (typeof r.requestedStep === 'number' && r.requestedStep > 0 && r.requestedStep !== r.step) {
      stepText = r.step + ' (requested ' + r.requestedStep + ')';
    }
    _tmAddCardRow(card, _tt('step', 'Step'), stepText);
  }
  if (typeof r.pixelStep === 'number' && r.pixelStep > 0 && r.pixelStep !== 1) {
    _tmAddCardRow(card, 'pixelStep', String(r.pixelStep));
  }
  if (r.downscaledSearch) {
    _tmAddCardRow(card, _tt('searchAreaTooLarge', 'Search area downscaled'), _tmBoolText(true));
  }
  if (r.downscaledTemplate) {
    _tmAddCardRow(card, _tt('templateTooLarge', 'Template downscaled'), _tmBoolText(true));
  }
  _tmAddCardRow(card, _tt('capturedAt', 'Captured at'),       r.createdAt || _tt('none2', '—'));
  _tmAddCardRow(card, _tt('realMatchingDisabled', 'Real matching disabled'), _tmBoolText(!r.realMatching));
  _tmAddCardRow(card, _tt('realClickDisabled', 'Real click disabled'),       _tmBoolText(!r.realClick));

  return card;
}

// =====================================================================
// Action preview (planned image_click — not executed)
// =====================================================================

function renderActionPreview() {
  var card = document.createElement('div'); card.className = 'adv-card template-matching-action-preview-card';
  var title = document.createElement('div'); title.className = 'adv-card-title';
  title.textContent = _tt('actionPreview', 'Action preview');
  card.appendChild(title);

  var state = _tmReadState();
  var match = state.templateMatching ? state.templateMatching.lastResult : null;
  if (!match) {
    var empty = document.createElement('div'); empty.className = 'adv-log-empty template-matching-empty';
    empty.textContent = _tt('noMatchResult', 'No match result yet.');
    card.appendChild(empty);
    return card;
  }

  if (typeof createImageClickActionPreview !== 'function') {
    var unavail = document.createElement('div'); unavail.className = 'adv-warning';
    unavail.textContent = 'createImageClickActionPreview unavailable';
    card.appendChild(unavail);
    return card;
  }

  var preview = createImageClickActionPreview(match);
  if (!preview) {
    var empty2 = document.createElement('div'); empty2.className = 'adv-log-empty template-matching-empty';
    empty2.textContent = _tt('noMatchResult', 'No match result yet.');
    card.appendChild(empty2);
    return card;
  }

  // Mock badge.
  var badge = document.createElement('div'); badge.className = 'template-matching-mock-badge';
  badge.textContent = _tt('imageClickPreview', 'image_click preview');
  card.appendChild(badge);

  // JSON-like display via textContent so user data is never
  // injected as HTML. We pretty-print to two-space indentation.
  var pre = document.createElement('pre');
  pre.className = 'template-matching-action-preview-json';
  try {
    pre.textContent = JSON.stringify(preview, null, 2);
  } catch (e) {
    pre.textContent = '{ "error": "Failed to serialise action preview" }';
  }
  card.appendChild(pre);

  // Always-visible "preview only" reminder.
  var note = document.createElement('div'); note.className = 'template-matching-action-preview-note';
  note.textContent = _tt('imageClickScenarioPlanned',
    'Planned scenario action — not executed by the click engine yet.');
  card.appendChild(note);

  return card;
}

// =====================================================================
// Actions
// =====================================================================

function runTemplateMatchingMock() {
  var input = buildTemplateMatchInputFromState();
  // Persist the input snapshot so the diagnostics card and
  // copyDiagnostics reflect "what the user just attempted".
  if (typeof setTemplateMatchingInput === 'function') setTemplateMatchingInput(input);

  // Audit. Payload carries only metadata — no image bytes.
  _tmAudit('template.match.mock.requested', {
    sourceId:   input.screenPreview ? (input.screenPreview.sourceId || '') : '',
    templateId: input.template      ? (input.template.id            || '') : '',
    hasRegion:  !!input.region
  });

  if (typeof setTemplateMatchingError === 'function') setTemplateMatchingError(null);
  if (typeof setTemplateMatchingRunning === 'function') setTemplateMatchingRunning(true);

  if (typeof runMockTemplateMatch !== 'function') {
    if (typeof setTemplateMatchingRunning === 'function') setTemplateMatchingRunning(false);
    if (typeof setTemplateMatchingError === 'function') setTemplateMatchingError('template-matching-mock unavailable');
    _tmAudit('template.match.mock.failed', { reason: 'mock module unavailable' });
    _tmLog('error', _tt('mockMatchFailed', 'Mock match failed') + ': mock module unavailable');
    renderTemplateMatchingTab();
    return;
  }

  var resp = runMockTemplateMatch(input);
  if (typeof setTemplateMatchingRunning === 'function') setTemplateMatchingRunning(false);

  if (resp && resp.success && resp.match) {
    if (typeof setTemplateMatchingResult === 'function') setTemplateMatchingResult(resp.match);
    _tmAudit('template.match.mock.completed', {
      templateId:  resp.match.templateId || '',
      confidence:  resp.match.confidence,
      targetX:     resp.match.targetPoint ? (resp.match.targetPoint.x | 0) : 0,
      targetY:     resp.match.targetPoint ? (resp.match.targetPoint.y | 0) : 0,
      boxW:        resp.match.boundingBox ? (resp.match.boundingBox.width  | 0) : 0,
      boxH:        resp.match.boundingBox ? (resp.match.boundingBox.height | 0) : 0,
      usedRegion:  !!resp.match.usedRegion,
      realMatching: false,
      realClick:    false
    });
    _tmLog('success', _tt('mockMatchCompleted', 'Mock match completed'));

    // Audit the action preview separately so the audit timeline shows
    // the exact moment we materialised an `image_click` shape.
    if (typeof createImageClickActionPreview === 'function') {
      var ap = createImageClickActionPreview(resp.match);
      if (ap) {
        _tmAudit('image.click.preview.created', {
          templateId:  ap.templateId || '',
          targetX:     ap.targetPoint ? (ap.targetPoint.x | 0) : 0,
          targetY:     ap.targetPoint ? (ap.targetPoint.y | 0) : 0,
          confidence:  ap.confidence,
          realClick:   false,
          realMatching: false
        });
      }
    }
  } else {
    var msg = (resp && resp.error) ? resp.error :
      _tt('mockMatchFailed', 'Mock match failed');
    if (typeof setTemplateMatchingError === 'function') setTemplateMatchingError(msg);
    _tmAudit('template.match.mock.failed', { reason: msg });
    _tmLog('error', _tt('mockMatchFailed', 'Mock match failed') + ': ' + msg);
  }

  renderTemplateMatchingTab();
}

function clearTemplateMatchingMockResult() {
  if (typeof clearMockMatchResult === 'function') clearMockMatchResult();
  if (typeof clearTemplateMatchingResult === 'function') clearTemplateMatchingResult();
  _tmAudit('template.match.mock.cleared', {});
  _tmLog('info', _tt('mockMatchCleared', 'Mock match cleared'));
  renderTemplateMatchingTab();
}
