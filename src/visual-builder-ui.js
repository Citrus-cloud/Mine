// =====================================================================
// ClickFlow — src/visual-builder-ui.js (Step 36)
// ---------------------------------------------------------------------
// Renderer DOM/UI module for the Visual Builder tab.
//
// Wires the Step 25–34 foundations into one dashboard:
//   - Status row (Screen preview, Region, Template, Image match,
//     OCR result, Real clicks);
//   - Onboarding hints with quick-action buttons (Open Screen
//     Capture / Open Templates / Open Region Selector / Open OCR);
//   - Preview image with declarative overlay layers
//     (region / template match / template target / OCR blocks /
//     OCR target / action target);
//   - Overlay controls (6 checkboxes + Show all / Hide all / Clear);
//   - Selected action type selector (simple_click / image_click /
//     text_click);
//   - Scenario presets cards with Use preset / Use with current
//     visual context buttons;
//   - Draft preview card with Open in form button;
//   - Quick-action buttons (Capture preview / Select region /
//     Run image test / Run OCR test / Create scenario draft /
//     Open scenario form).
//
// SAFETY (Step 36):
//   - Renders user data ONLY through `textContent` /
//     element-construction. Never via `innerHTML` (the only allowed
//     `innerHTML` form is `= ''` for clearing children).
//   - NEVER stores `imageDataUrl` outside the existing screen-capture
//     slice. The preview <img>'s `src` is the only consumer.
//   - NEVER opens a new IPC channel.
//   - NEVER calls `runScenario`, `runImageClickScenario`,
//     `runTextClickScenario`, or any real click backend.
//   - NEVER auto-saves scenarios. The user must press Save inside
//     the existing scenario form.
// =====================================================================

'use strict';

// --- Public entry point ---------------------------------------------

function renderVisualBuilderTab() {
  var container = document.getElementById('advanced-tab-visualBuilder');
  if (!container) return;
  // Clear children safely.
  while (container.firstChild) container.removeChild(container.firstChild);

  var state = (typeof getState === 'function') ? getState() : {};

  // Header
  var header = _el('div', 'adv-card vb-header-card');
  var title = _el('div', 'adv-card-title', _t('visualBuilder'));
  header.appendChild(title);
  var subtitle = _el('div', 'vb-subtitle', _t('visualBuilderSubtitle'));
  header.appendChild(subtitle);
  // Always-on simulation-only safety banner.
  var safety = _el('div', 'vb-safety-banner', _t('visualBuilderSimulationOnlyNotice'));
  header.appendChild(safety);
  container.appendChild(header);

  // Status row
  container.appendChild(_renderStatusRow(state));

  // Onboarding hints
  container.appendChild(_renderOnboardingHints(state));

  // Action type selector + preview area
  container.appendChild(_renderActionTypeAndPreview(state));

  // Overlay controls
  container.appendChild(_renderOverlayControls(state));

  // Quick-action buttons
  container.appendChild(_renderActionsPanel(state));

  // Scenario presets
  container.appendChild(_renderScenarioPresets(state));

  // Draft preview (if any)
  container.appendChild(_renderDraftPreview(state));
}

// --- Status row -----------------------------------------------------

function _renderStatusRow(state) {
  var card = _el('div', 'adv-card vb-status-card');
  var t = _el('div', 'adv-card-title', _t('visualBuilderStatus'));
  card.appendChild(t);
  var grid = _el('div', 'vb-status-grid');

  var hasPreview = !!(state.screenCapture && state.screenCapture.preview &&
    typeof state.screenCapture.preview.imageDataUrl === 'string' &&
    state.screenCapture.preview.imageDataUrl.indexOf('data:image/') === 0);
  var hasRegion = !!(state.regionSelector && state.regionSelector.normalizedRegion);
  var hasTemplate = !!(state.templates && state.templates.activeTemplateId);
  var hasImageMatch = !!(state.templateMatching && state.templateMatching.lastResult &&
    state.templateMatching.lastResult.success && state.templateMatching.lastResult.matched);
  var hasOcrResult = !!(state.ocr && state.ocr.lastResult);

  grid.appendChild(_statusCell(_t('screenPreview'), hasPreview ? _t('ready') : _t('missing'), hasPreview));
  grid.appendChild(_statusCell(_t('region'),         hasRegion ? _t('ready') : _t('missing'), hasRegion, true /* warning when missing */));
  grid.appendChild(_statusCell(_t('template'),       hasTemplate ? _t('ready') : _t('missing'), hasTemplate, true));
  grid.appendChild(_statusCell(_t('imageMatch'),     hasImageMatch ? _t('ready') : _t('missing'), hasImageMatch, true));
  grid.appendChild(_statusCell(_t('ocrResult'),      hasOcrResult ? _t('ready') : _t('missing'), hasOcrResult, true));
  // Real clicks: ALWAYS disabled. Stamped in red so the user sees it.
  grid.appendChild(_statusCell(_t('realClicks'), _t('disabled'), false, false, true /* danger */));
  card.appendChild(grid);
  return card;
}

function _statusCell(label, value, ok, warning, danger) {
  var cell = _el('div', 'vb-status-cell');
  cell.appendChild(_el('div', 'vb-status-label', label));
  var badge = _el('div', 'vb-status-badge ' + (danger ? 'vb-status-badge-danger' : (ok ? 'vb-status-badge-ok' : (warning ? 'vb-status-badge-warning' : 'vb-status-badge-missing'))), value);
  cell.appendChild(badge);
  return cell;
}

// --- Onboarding hints ----------------------------------------------

function _renderOnboardingHints(state) {
  var card = _el('div', 'adv-card vb-hints-card');
  var t = _el('div', 'adv-card-title', _t('onboardingHints'));
  card.appendChild(t);

  var hints = [];

  var hasPreview = !!(state.screenCapture && state.screenCapture.preview &&
    typeof state.screenCapture.preview.imageDataUrl === 'string');
  if (!hasPreview) {
    hints.push({ key: 'screenPreviewMissingHint', action: 'screenCapture', actionKey: 'openScreenCapture' });
  }
  var hasRegion = !!(state.regionSelector && state.regionSelector.normalizedRegion);
  if (!hasRegion) {
    hints.push({ key: 'regionOptionalHint', action: 'screenCapture', actionKey: 'openRegionSelector' });
  }
  var type = _vbState().selectedActionType;
  if (type === 'image_click') {
    var hasTemplate = !!(state.templates && state.templates.activeTemplateId);
    if (!hasTemplate) {
      hints.push({ key: 'templateMissingHint', action: 'templates', actionKey: 'openTemplates' });
    }
  }
  if (type === 'text_click') {
    var hasOcrRes = !!(state.ocr && state.ocr.lastResult);
    if (!hasOcrRes) {
      hints.push({ key: 'ocrResultMissingHint', action: 'ocr', actionKey: 'openOcr' });
    }
  }

  if (hints.length === 0) {
    card.appendChild(_el('div', 'vb-hints-empty', _t('noOnboardingHints')));
    return card;
  }

  hints.forEach(function (h) {
    var row = _el('div', 'vb-hint-row');
    row.appendChild(_el('div', 'vb-hint-text', _t(h.key)));
    var btn = _el('button', 'adv-btn adv-btn-secondary vb-hint-button', _t(h.actionKey));
    btn.addEventListener('click', function () {
      if (typeof setAdvancedTab === 'function') setAdvancedTab(h.action);
    });
    row.appendChild(btn);
    card.appendChild(row);
  });
  return card;
}

// --- Action-type selector + preview --------------------------------

function _renderActionTypeAndPreview(state) {
  var card = _el('div', 'adv-card vb-preview-card');
  var t = _el('div', 'adv-card-title', _t('visualBuilderPreview'));
  card.appendChild(t);

  // Action type selector
  var typeRow = _el('div', 'vb-type-row');
  typeRow.appendChild(_el('label', 'vb-type-label', _t('selectedActionType') + ':'));
  var sel = _el('select', 'vb-type-select');
  [
    ['simple_click', _t('simple_click') || _t('coordinateClick') || 'Coordinate click'],
    ['image_click',  _t('imageClick')   || 'Image click'],
    ['text_click',   _t('textClick')    || 'Text click']
  ].forEach(function (pair) {
    var opt = document.createElement('option');
    opt.value = pair[0];
    opt.textContent = pair[1];
    if (pair[0] === _vbState().selectedActionType) opt.selected = true;
    sel.appendChild(opt);
  });
  sel.addEventListener('change', function () {
    if (typeof setSelectedActionType === 'function') {
      setSelectedActionType(sel.value);
    }
    renderVisualBuilderTab();
  });
  typeRow.appendChild(sel);
  card.appendChild(typeRow);

  // Preview wrapper
  var previewWrap = _el('div', 'vb-preview-wrapper');
  if (!state.screenCapture || !state.screenCapture.preview ||
      typeof state.screenCapture.preview.imageDataUrl !== 'string' ||
      state.screenCapture.preview.imageDataUrl.indexOf('data:image/') !== 0) {
    var empty = _el('div', 'vb-preview-empty', _t('screenPreviewMissingHint'));
    previewWrap.appendChild(empty);
  } else {
    var img = document.createElement('img');
    img.className = 'vb-preview-image';
    // The dataURL was already validated in screen-capture-client.js;
    // we simply consume it as the <img>'s src. No innerHTML.
    img.src = state.screenCapture.preview.imageDataUrl;
    img.alt = _t('screenPreview');
    previewWrap.appendChild(img);

    // Overlays
    var pw = (state.screenCapture.preview.width  | 0) || 1;
    var ph = (state.screenCapture.preview.height | 0) || 1;
    var layers = (typeof getOverlayLayers === 'function') ? getOverlayLayers(state) : [];
    layers.forEach(function (layer) {
      previewWrap.appendChild(_buildOverlayElement(layer, pw, ph));
    });
  }
  card.appendChild(previewWrap);

  // Overlay legend
  card.appendChild(_renderOverlayLegend(state));

  return card;
}

function _buildOverlayElement(layer, pw, ph) {
  var el;
  if (layer.kind === 'point') {
    el = _el('div', 'vb-overlay-point vb-overlay-color-' + layer.color);
    el.style.left = ((layer.coords.x / pw) * 100).toFixed(2) + '%';
    el.style.top  = ((layer.coords.y / ph) * 100).toFixed(2) + '%';
    el.title = layer.label || '';
    return el;
  }
  // region / bbox / block all use percentage rectangles
  el = _el('div', 'vb-overlay-rect vb-overlay-kind-' + layer.kind + ' vb-overlay-color-' + layer.color);
  var w = layer.coords.width  || 0;
  var h = layer.coords.height || 0;
  el.style.left   = ((layer.coords.x / pw) * 100).toFixed(2) + '%';
  el.style.top    = ((layer.coords.y / ph) * 100).toFixed(2) + '%';
  el.style.width  = ((w / pw) * 100).toFixed(2) + '%';
  el.style.height = ((h / ph) * 100).toFixed(2) + '%';
  if (layer.label) {
    var lab = _el('div', 'vb-overlay-label', layer.label);
    el.appendChild(lab);
  }
  return el;
}

function _renderOverlayLegend(state) {
  var legend = _el('div', 'vb-overlay-legend');
  legend.appendChild(_el('div', 'vb-legend-title', _t('overlayLegend')));
  var items = [
    { color: 'blue',   labelKey: 'showRegionOverlay' },
    { color: 'green',  labelKey: 'showTemplateMatchOverlay' },
    { color: 'red',    labelKey: 'showTemplateTargetOverlay' },
    { color: 'yellow', labelKey: 'showOcrBlocksOverlay' },
    { color: 'red',    labelKey: 'showOcrTargetOverlay' },
    { color: 'cyan',   labelKey: 'showActionTargetOverlay' }
  ];
  items.forEach(function (it) {
    var row = _el('div', 'vb-legend-row');
    var sw = _el('span', 'vb-legend-swatch vb-overlay-color-' + it.color);
    row.appendChild(sw);
    row.appendChild(_el('span', 'vb-legend-label', _t(it.labelKey)));
    legend.appendChild(row);
  });
  return legend;
}

// --- Overlay controls ----------------------------------------------

function _renderOverlayControls(state) {
  var card = _el('div', 'adv-card vb-overlay-controls-card');
  card.appendChild(_el('div', 'adv-card-title', _t('overlaySettings')));

  var grid = _el('div', 'vb-overlay-controls-grid');
  var keys = (typeof getOverlayKeys === 'function') ? getOverlayKeys() : [];
  var current = _vbState().overlaySettings || {};
  keys.forEach(function (key) {
    var label = _el('label', 'vb-overlay-checkbox-row');
    var cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = !!current[key];
    cb.addEventListener('change', function () {
      if (typeof setOverlaySetting === 'function') {
        setOverlaySetting(key, cb.checked);
      }
      if (typeof recordAuditEvent === 'function') {
        recordAuditEvent('visualBuilder.overlay.changed', { key: key, value: !!cb.checked });
      }
      renderVisualBuilderTab();
    });
    label.appendChild(cb);
    label.appendChild(_el('span', 'vb-overlay-checkbox-label', _t(_overlayLabelKey(key))));
    grid.appendChild(label);
  });
  card.appendChild(grid);

  var btnRow = _el('div', 'vb-overlay-buttons');
  var btnShow = _el('button', 'adv-btn adv-btn-secondary', _t('showAllOverlays'));
  btnShow.addEventListener('click', function () {
    if (typeof showAllOverlays === 'function') showAllOverlays();
    if (typeof recordAuditEvent === 'function') recordAuditEvent('visualBuilder.overlay.changed', { action: 'showAll' });
    renderVisualBuilderTab();
  });
  var btnHide = _el('button', 'adv-btn adv-btn-secondary', _t('hideAllOverlays'));
  btnHide.addEventListener('click', function () {
    if (typeof hideAllOverlays === 'function') hideAllOverlays();
    if (typeof recordAuditEvent === 'function') recordAuditEvent('visualBuilder.overlay.changed', { action: 'hideAll' });
    renderVisualBuilderTab();
  });
  var btnClear = _el('button', 'adv-btn adv-btn-secondary', _t('clearOverlays'));
  btnClear.addEventListener('click', function () {
    if (typeof clearOverlays === 'function') clearOverlays();
    if (typeof recordAuditEvent === 'function') recordAuditEvent('visualBuilder.overlay.changed', { action: 'clear' });
    renderVisualBuilderTab();
  });
  btnRow.appendChild(btnShow);
  btnRow.appendChild(btnHide);
  btnRow.appendChild(btnClear);
  card.appendChild(btnRow);
  return card;
}

function _overlayLabelKey(key) {
  switch (key) {
    case 'showRegion':         return 'showRegionOverlay';
    case 'showTemplateMatch':  return 'showTemplateMatchOverlay';
    case 'showTemplateTarget': return 'showTemplateTargetOverlay';
    case 'showOcrBlocks':      return 'showOcrBlocksOverlay';
    case 'showOcrTarget':      return 'showOcrTargetOverlay';
    case 'showActionTarget':   return 'showActionTargetOverlay';
  }
  return key;
}

// --- Quick-action buttons ------------------------------------------

function _renderActionsPanel(state) {
  var card = _el('div', 'adv-card vb-actions-card');
  card.appendChild(_el('div', 'adv-card-title', _t('visualBuilderActions')));

  var grid = _el('div', 'vb-actions-grid');

  // Capture preview → just navigate to Screen Capture tab.
  _addAction(grid, 'capturePreview', function () {
    if (typeof setAdvancedTab === 'function') setAdvancedTab('screenCapture');
  });
  _addAction(grid, 'selectRegion', function () {
    if (typeof setAdvancedTab === 'function') setAdvancedTab('screenCapture');
  });
  _addAction(grid, 'runImageTest', function () {
    if (typeof setAdvancedTab === 'function') setAdvancedTab('templateMatching');
  });
  _addAction(grid, 'runOcrTest', function () {
    if (typeof setAdvancedTab === 'function') setAdvancedTab('ocr');
  });
  _addAction(grid, 'createScenarioDraft', function () {
    _onCreateScenarioDraft();
  });
  _addAction(grid, 'openScenarioForm', function () {
    if (typeof openCreateScenarioForm === 'function') openCreateScenarioForm();
  });
  card.appendChild(grid);
  return card;
}

function _addAction(grid, key, handler) {
  var btn = _el('button', 'adv-btn vb-action-btn', _t(key));
  btn.addEventListener('click', handler);
  grid.appendChild(btn);
}

function _onCreateScenarioDraft() {
  var state = (typeof getState === 'function') ? getState() : {};
  var type = _vbState().selectedActionType;
  if (typeof buildDraftPreviewFromState !== 'function') return;
  var res = buildDraftPreviewFromState(state, type, {});
  if (!res || !res.ok) {
    var errs = (res && Array.isArray(res.errors)) ? res.errors : ['unknownError'];
    if (typeof recordAuditEvent === 'function') {
      recordAuditEvent('visualBuilder.requirement.missing', { type: type, errors: errs.slice(0, 5) });
    }
    if (typeof addLogEntry === 'function' && typeof createLog === 'function') {
      addLogEntry(createLog('warning', _t('missingVisualRequirement') + ': ' + errs.join(', ')));
    }
    renderVisualBuilderTab();
    return;
  }
  if (typeof recordAuditEvent === 'function') {
    recordAuditEvent('visualBuilder.draft.preview.created', {
      type: res.draft.type,
      hasRegion: !!(res.draft.settings && res.draft.settings.region),
      hasTemplate: !!(res.draft.settings && res.draft.settings.templateId),
      targetTextLen: (res.draft.settings && typeof res.draft.settings.targetText === 'string') ? res.draft.settings.targetText.length : 0,
      missingCount: Array.isArray(res.missing) ? res.missing.length : 0
    });
  }
  if (typeof addLogEntry === 'function' && typeof createLog === 'function') {
    addLogEntry(createLog('info', _t('visualBuilderDraftCreated') + ': ' + res.draft.type));
  }
  renderVisualBuilderTab();
}

// --- Scenario presets ----------------------------------------------

function _renderScenarioPresets(state) {
  var card = _el('div', 'adv-card vb-presets-card');
  card.appendChild(_el('div', 'adv-card-title', _t('scenarioPresets')));

  var presets = (typeof getScenarioPresets === 'function') ? getScenarioPresets() : [];
  if (presets.length === 0) {
    card.appendChild(_el('div', 'vb-presets-empty', _t('noPresets')));
    return card;
  }
  var list = _el('div', 'vb-presets-list');
  presets.forEach(function (p) {
    list.appendChild(_renderPresetCard(p, state));
  });
  card.appendChild(list);
  return card;
}

function _renderPresetCard(preset, state) {
  var c = _el('div', 'vb-preset-card');
  var name = _el('div', 'vb-preset-name', _t(preset.nameKey) || preset.id);
  c.appendChild(name);
  var typeBadge = _el('div', 'vb-preset-type-badge vb-preset-type-' + preset.type, preset.type);
  c.appendChild(typeBadge);
  var desc = _el('div', 'vb-preset-description', _t(preset.descriptionKey) || '');
  c.appendChild(desc);

  // Brief settings summary line
  var summary = _el('div', 'vb-preset-summary', _formatPresetSummary(preset));
  c.appendChild(summary);

  // Buttons
  var btns = _el('div', 'vb-preset-buttons');
  var btnUse = _el('button', 'adv-btn vb-preset-btn-use', _t('usePreset'));
  btnUse.addEventListener('click', function () {
    _onPresetSelected(preset, state, false);
  });
  var btnUseCtx = _el('button', 'adv-btn adv-btn-secondary vb-preset-btn-use-ctx', _t('useWithCurrentVisualContext'));
  btnUseCtx.addEventListener('click', function () {
    _onPresetSelected(preset, state, true);
  });
  btns.appendChild(btnUse);
  btns.appendChild(btnUseCtx);
  c.appendChild(btns);
  return c;
}

function _formatPresetSummary(preset) {
  if (!preset || !preset.settings) return '';
  var s = preset.settings;
  if (preset.type === 'simple_click') {
    return 'x:' + s.x + ' y:' + s.y + ' · ' + s.intervalMs + 'ms · ' + s.repeatCount + '× · ' + s.button;
  }
  if (preset.type === 'image_click') {
    return 'threshold ' + Math.round((s.threshold || 0) * 100) + '% · step ' + s.step +
      ' · ' + s.timeoutMs + 'ms · ' + s.intervalMs + 'ms · ' + s.repeatCount + '×';
  }
  if (preset.type === 'text_click') {
    return s.language + ' · ' + s.matchMode + (s.caseSensitive ? ' · case' : '') +
      ' · ' + s.timeoutMs + 'ms · ' + s.intervalMs + 'ms · ' + s.repeatCount + '×';
  }
  return '';
}

function _onPresetSelected(preset, state, useVisualContext) {
  if (typeof recordAuditEvent === 'function') {
    recordAuditEvent('scenarioPreset.selected', {
      presetId: preset.id,
      type: preset.type,
      withVisualContext: !!useVisualContext
    });
  }
  if (typeof addLogEntry === 'function' && typeof createLog === 'function') {
    addLogEntry(createLog('info', _t('presetSelected') + ': ' + preset.id));
  }
  if (typeof setLastUsedPresetId === 'function') setLastUsedPresetId(preset.id);

  // Build the draft
  var ctx = useVisualContext && typeof buildVisualContextFromState === 'function'
    ? buildVisualContextFromState(state)
    : null;
  var draftRes = (typeof createScenarioDraftFromPreset === 'function')
    ? createScenarioDraftFromPreset(preset.id, ctx ? { visualContext: ctx } : null)
    : null;

  if (!draftRes || !draftRes.ok) {
    if (typeof addLogEntry === 'function' && typeof createLog === 'function') {
      addLogEntry(createLog('warning', _t('presetDraftFailed')));
    }
    return;
  }

  if (typeof recordAuditEvent === 'function') {
    recordAuditEvent('scenarioPreset.draft.created', {
      presetId: preset.id,
      type: draftRes.type,
      hasRegion: !!(draftRes.settings && draftRes.settings.region),
      hasTemplate: !!(draftRes.settings && draftRes.settings.templateId),
      targetTextLen: (draftRes.settings && typeof draftRes.settings.targetText === 'string') ? draftRes.settings.targetText.length : 0,
      withVisualContext: !!useVisualContext
    });
  }

  // Open the scenario form pre-filled with the draft's values.
  // We let the renderer's openCreateScenarioForm() build the empty
  // form, then we patch the inputs from the draft. This reuses the
  // existing form so we don't duplicate any save logic.
  _openScenarioFormFromDraft(draftRes);

  if (typeof recordAuditEvent === 'function') {
    recordAuditEvent('scenarioPreset.form.opened', {
      presetId: preset.id,
      type: draftRes.type
    });
  }
  if (typeof addLogEntry === 'function' && typeof createLog === 'function') {
    addLogEntry(createLog('info', _t('scenarioDraftOpened') + ': ' + draftRes.type));
  }
}

// --- Draft preview card --------------------------------------------

function _renderDraftPreview(state) {
  var card = _el('div', 'adv-card vb-draft-card');
  card.appendChild(_el('div', 'adv-card-title', _t('draftPreview')));

  var vb = _vbState();
  if (!vb.lastDraftPreview) {
    card.appendChild(_el('div', 'vb-draft-empty', _t('noDraftPreview')));
    return card;
  }
  var d = vb.lastDraftPreview;
  var grid = _el('div', 'vb-draft-grid');
  _draftRow(grid, _t('scenarioType'),     d.type);
  _draftRow(grid, _t('scenarioName'),     d.name);
  _draftRow(grid, _t('source'),           d.source);
  _draftRow(grid, _t('realClicksLabel'),  String(false));
  // Step 41 — surface the OCR provider chosen for the draft and
  // whether the source was real OCR. Both rows are visualisation
  // only; the real-OCR check still happens at runtime.
  if (d.type === 'text_click') {
    var draftProv = (d.settings && d.settings.ocrProvider) ? d.settings.ocrProvider : 'mock';
    _draftRow(grid, _t('ocrProviderUsed'), draftProv);
    _draftRow(grid, _t('realOcrLabel'),    String(draftProv === 'tesseract'));
  }
  _draftRow(grid, _t('settingsSummary'),  _formatDraftSettingsLine(d));
  card.appendChild(grid);

  // Open in form button
  var btn = _el('button', 'adv-btn', _t('openDraftInForm'));
  btn.addEventListener('click', function () {
    _openScenarioFormFromDraft(d);
  });
  card.appendChild(btn);
  return card;
}

function _draftRow(grid, label, value) {
  var row = _el('div', 'vb-draft-row');
  row.appendChild(_el('div', 'vb-draft-row-label', label));
  row.appendChild(_el('div', 'vb-draft-row-value', String(value || '')));
  grid.appendChild(row);
}

function _formatDraftSettingsLine(d) {
  if (!d || !d.settings) return '';
  var s = d.settings;
  if (d.type === 'simple_click') {
    return 'x:' + (s.x | 0) + ' y:' + (s.y | 0) + ' · ' + (s.intervalMs | 0) + 'ms · ' + (s.repeatCount | 0) + '× · ' + (s.button || 'left');
  }
  if (d.type === 'image_click') {
    return 'template:' + (s.templateId || 'none') + ' · threshold ' + Math.round((s.threshold || 0) * 100) +
      '% · step ' + (s.step | 0) + ' · region:' + (s.region ? 'yes' : 'no') + ' · ' + (s.intervalMs | 0) + 'ms · ' + (s.repeatCount | 0) + '×';
  }
  if (d.type === 'text_click') {
    var tt = (typeof s.targetText === 'string')
      ? (s.targetText.length > 24 ? s.targetText.slice(0, 24) + '…' : s.targetText)
      : '';
    return 'targetText:"' + tt + '" · ' + (s.language || 'ru+en') + ' · ' + (s.matchMode || 'contains') +
      (s.caseSensitive ? ' · case' : '') + ' · region:' + (s.region ? 'yes' : 'no') + ' · ' + (s.intervalMs | 0) + 'ms';
  }
  return '';
}

// --- Open scenario form from a draft -------------------------------

function _openScenarioFormFromDraft(draft) {
  if (!draft || !draft.type) return;
  if (typeof openCreateScenarioForm !== 'function') return;
  // Open the empty form first, then patch its inputs.
  openCreateScenarioForm();
  setTimeout(function () { _fillScenarioFormFromDraft(draft); }, 0);
}

function _fillScenarioFormFromDraft(draft) {
  // Set the type selector first; this triggers the existing
  // syncScenarioFormSections() path through the change event when
  // we dispatch a change.
  var typeSel = document.getElementById('input-scenario-type');
  if (typeSel) {
    typeSel.value = draft.type;
    typeSel.dispatchEvent(new Event('change'));
  }
  var name = document.getElementById('input-name');
  if (name) name.value = draft.name || '';
  var desc = document.getElementById('input-description');
  if (desc) desc.value = draft.description || '';

  var s = draft.settings || {};
  if (draft.type === 'simple_click') {
    _setVal('input-x', s.x);
    _setVal('input-y', s.y);
    _setVal('input-interval', s.intervalMs);
    _setVal('input-repeat', s.repeatCount);
    var btnSel = document.getElementById('input-button');
    if (btnSel) btnSel.value = s.button || 'left';
  } else if (draft.type === 'image_click') {
    var tplSel = document.getElementById('input-template-id');
    if (tplSel && s.templateId) tplSel.value = s.templateId;
    _setVal('input-image-threshold', s.threshold);
    _setVal('input-image-step',      s.step);
    _setVal('input-image-timeout',   s.timeoutMs);
    _setVal('input-image-interval',  s.intervalMs);
    _setVal('input-image-repeat',    s.repeatCount);
    // Region: use the existing renderer hook if present.
    if (s.region && typeof window.applySelectedRegionToImageClickForm === 'function' && false) {
      // We don't call applySelectedRegionToImageClickForm here because
      // it reads from the region-selector slice; instead we rely on
      // the user pressing "Use selected region" if needed. The
      // summary reflects whichever region is already attached.
    }
  } else if (draft.type === 'text_click') {
    _setVal('input-text-target',   s.targetText);
    var lang = document.getElementById('input-text-language');
    if (lang && s.language)  lang.value = s.language;
    var mm = document.getElementById('input-text-match-mode');
    if (mm && s.matchMode)   mm.value = s.matchMode;
    var cs = document.getElementById('input-text-case-sensitive');
    if (cs) cs.checked = !!s.caseSensitive;
    // Step 41 — propagate the draft's OCR provider into the form.
    var prov = document.getElementById('input-text-ocr-provider');
    if (prov && (s.ocrProvider === 'mock' || s.ocrProvider === 'tesseract')) {
      prov.value = s.ocrProvider;
    } else if (prov) {
      prov.value = 'mock';
    }
    _setVal('input-text-timeout',  s.timeoutMs);
    _setVal('input-text-interval', s.intervalMs);
    _setVal('input-text-repeat',   s.repeatCount);
  }
}

function _setVal(id, value) {
  var el = document.getElementById(id);
  if (!el || value === undefined || value === null) return;
  el.value = String(value);
}

// --- Helpers -------------------------------------------------------

function _t(key) {
  if (typeof t === 'function') {
    var v = t(key);
    if (v && v !== key) return v;
  }
  return key;
}

function _el(tag, className, text) {
  var e = document.createElement(tag);
  if (className) e.className = className;
  if (text !== undefined && text !== null) e.textContent = String(text);
  return e;
}

function _vbState() {
  if (typeof getVisualBuilderState === 'function') {
    return getVisualBuilderState();
  }
  return { overlaySettings: {}, selectedActionType: 'simple_click', lastDraftPreview: null };
}
