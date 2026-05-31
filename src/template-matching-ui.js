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

  // 5. Action buttons. Run is enabled only when input is valid.
  var actions = document.createElement('div'); actions.className = 'adv-btn-group template-matching-actions';

  var runBtn = document.createElement('button');
  runBtn.className = 'adv-btn'; runBtn.id = 'tm-btn-run';
  runBtn.textContent = _tt('runMockMatch', 'Run mock match');
  runBtn.addEventListener('click', runTemplateMatchingMock);
  actions.appendChild(runBtn);

  var clearBtn = document.createElement('button');
  clearBtn.className = 'adv-btn adv-btn-secondary'; clearBtn.id = 'tm-btn-clear';
  clearBtn.textContent = _tt('clearMatchResult', 'Clear result');
  clearBtn.addEventListener('click', clearTemplateMatchingMockResult);
  actions.appendChild(clearBtn);

  c.appendChild(actions);

  // 6. Visual overlay (compact preview with the bounding box +
  //    target point drawn on top). Empty state if no preview.
  c.appendChild(renderTemplateMatchingOverlay());

  // 7. Result card.
  c.appendChild(renderTemplateMatchingResult());

  // 8. Action preview card — the planned `image_click` action,
  //    rendered as text. Never executed.
  c.appendChild(renderActionPreview());

  // Disable Run when input is invalid; the user still gets a clear
  // explanation in the requirements checklist above.
  var input = buildTemplateMatchInputFromState();
  var validation = (typeof validateTemplateMatchInput === 'function')
    ? validateTemplateMatchInput(input)
    : { valid: !!(input && input.screenPreview && input.template), reason: null };
  runBtn.disabled = !validation.valid;
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
    bbEl.style.left   = (bb.x      / preview.width)  * 100 + '%';
    bbEl.style.top    = (bb.y      / preview.height) * 100 + '%';
    bbEl.style.width  = (bb.width  / preview.width)  * 100 + '%';
    bbEl.style.height = (bb.height / preview.height) * 100 + '%';
    wrapper.appendChild(bbEl);

    // Confidence badge (small label inside the rectangle).
    var conf = document.createElement('span');
    conf.className = 'template-matching-overlay-confidence';
    conf.textContent = _tmFormatConfidence(match.confidence) + ' · ' + _tt('mockTemplateMatching', 'mock');
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
  badge.textContent = _tt('mockTemplateMatching', 'mock / dry-run');
  card.appendChild(badge);

  _tmAddCardRow(card, 'matched',                              _tmBoolText(!!r.matched));
  _tmAddCardRow(card, _tt('matchConfidence', 'Confidence'),   _tmFormatConfidence(r.confidence));
  _tmAddCardRow(card, _tt('boundingBox', 'Bounding box'),     _tmFormatRect(r.boundingBox));
  _tmAddCardRow(card, _tt('targetPoint', 'Target point'),     _tmFormatPoint(r.targetPoint));
  _tmAddCardRow(card, _tt('usedRegion', 'Used region'),       r.usedRegion ? _tmFormatRect(r.usedRegion) : _tt('noRegionSelected', 'No region selected'));
  _tmAddCardRow(card, _tt('templateName', 'Template name'),   r.templateName || r.templateId || '—');
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
