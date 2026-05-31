// =====================================================================
// ClickFlow — src/image-click-test-ui.js (Step 31)
// ---------------------------------------------------------------------
// UI layer for the Test Match flow inside the scenario form. Renders
// the Test Match panel under the image_click section: template
// preview, screen preview status, region summary, controls, the
// debug result, the visual overlay, and the action preview.
//
// HARD GUARANTEES (Step 31):
//   - Pure renderer code. Never imports `electron`, `ipcRenderer`,
//     `fs`, never opens a new IPC channel.
//   - User-visible text rendered via `textContent`. `innerHTML` is
//     used only as `= ''` to clear a container.
//   - Image previews go to `<img>.src` only. No HTML injection.
//   - The Test Match button NEVER calls `runScenario`,
//     `runImageClickScenario`, or `executeAction` for real
//     execution. It calls `runImageClickTest`, which is preview /
//     debug only.
//   - Saving the scenario remains the user's explicit action — Test
//     Match never persists a draft and never auto-clicks Save.
// =====================================================================

// ---------------------------------------------------------------------
// DOM cache (filled lazily on first render — the scenario form
// view may be rendered before this module's listeners attach).
// ---------------------------------------------------------------------

var _icteDom = {
  panel:                    null,
  templatePreviewCard:      null,
  screenPreviewStatusCard:  null,
  regionSummaryCard:        null,
  matchingControlsCard:     null,
  testButton:               null,
  clearButton:              null,
  resultPanel:              null,
  errorsBlock:              null,
  warningsBlock:            null,
  overlay:                  null,
  actionPreviewBlock:       null,
  navigationBlock:          null,
  initialized:              false
};

// Last computed input (used by the test button) and a small busy
// flag so double-clicks don't queue parallel runs.
var _icteIsRunning = false;

// ---------------------------------------------------------------------
// Public entry point — wired from renderer.js after init().
// ---------------------------------------------------------------------

function initImageClickTestUi() {
  if (_icteIsTestUiAlreadyInitialized()) return;

  var imageSection = document.getElementById('form-section-image-click');
  if (!imageSection) return;

  // Build the panel container if it isn't already in the DOM.
  var panel = document.getElementById('image-click-test-panel');
  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'image-click-test-panel';
    panel.className = 'image-click-test-panel';
    imageSection.appendChild(panel);
  }
  _icteDom.panel = panel;
  _icteRenderPanelSkeleton();
  _icteDom.initialized = true;

  // Bind controls.
  if (_icteDom.testButton) {
    _icteDom.testButton.addEventListener('click', function (e) {
      e.preventDefault();
      runImageClickTestFromForm();
    });
  }
  if (_icteDom.clearButton) {
    _icteDom.clearButton.addEventListener('click', function (e) {
      e.preventDefault();
      _icteHandleClearClick();
    });
  }

  // First render.
  refreshImageClickTestPanel();
}

// Convenience helper exported for renderer.js.
function refreshImageClickTestPanel() {
  if (!_icteDom.initialized) return;
  renderImageClickTemplatePreview();
  renderImageClickScreenPreviewStatus();
  renderImageClickRegionSummary();
  // Re-render last result if any (new template / preview may have
  // changed; the matched bbox should still be drawn the same way).
  var last = (typeof getLastImageClickTestResult === 'function') ? getLastImageClickTestResult() : null;
  if (last) {
    renderImageClickTestResult(last);
  } else {
    clearImageClickTestResultUi();
  }
}

// ---------------------------------------------------------------------
// Skeleton — built once on initImageClickTestUi().
// ---------------------------------------------------------------------

function _icteRenderPanelSkeleton() {
  var panel = _icteDom.panel;
  panel.innerHTML = '';

  // Header.
  var header = document.createElement('div');
  header.className = 'image-click-test-header';
  var headerTitle = document.createElement('div');
  headerTitle.className = 'image-click-test-title';
  headerTitle.textContent = _icteT('imageClickTestTools', 'Image click test tools');
  var subtitle = document.createElement('div');
  subtitle.className = 'image-click-test-subtitle';
  subtitle.textContent = _icteT('testDoesNotClick', 'Test Match does not click. It only checks if the template can be found.');
  header.appendChild(headerTitle);
  header.appendChild(subtitle);
  panel.appendChild(header);

  // Quick navigation row.
  var nav = document.createElement('div');
  nav.className = 'image-click-test-nav';
  _icteAddNavButton(nav, 'openTemplates',     'Open Templates',       'templates');
  _icteAddNavButton(nav, 'openScreenCapture', 'Open Screen Capture',  'screenCapture');
  _icteAddNavButton(nav, 'openRegionSelector','Open Region Selector', 'screenCapture');
  panel.appendChild(nav);
  _icteDom.navigationBlock = nav;

  // Template preview card.
  var tplCard = document.createElement('div');
  tplCard.id = 'image-click-test-template-card';
  tplCard.className = 'image-click-test-card image-click-test-template-card';
  panel.appendChild(tplCard);
  _icteDom.templatePreviewCard = tplCard;

  // Screen preview status card.
  var screenCard = document.createElement('div');
  screenCard.id = 'image-click-test-screen-card';
  screenCard.className = 'image-click-test-card image-click-test-screen-card';
  panel.appendChild(screenCard);
  _icteDom.screenPreviewStatusCard = screenCard;

  // Region summary card.
  var regionCard = document.createElement('div');
  regionCard.id = 'image-click-test-region-card';
  regionCard.className = 'image-click-test-card image-click-test-region-card';
  panel.appendChild(regionCard);
  _icteDom.regionSummaryCard = regionCard;

  // Controls row (Test Match + Clear result + busy indicator).
  var controls = document.createElement('div');
  controls.className = 'image-click-test-controls';
  var testBtn = document.createElement('button');
  testBtn.type = 'button';
  testBtn.className = 'btn btn-accent image-click-test-button';
  testBtn.textContent = _icteT('runTestMatch', 'Run Test Match');
  controls.appendChild(testBtn);
  var clearBtn = document.createElement('button');
  clearBtn.type = 'button';
  clearBtn.className = 'btn btn-back image-click-test-clear-button';
  clearBtn.textContent = _icteT('clearMatchResult', 'Clear result');
  controls.appendChild(clearBtn);
  panel.appendChild(controls);
  _icteDom.testButton  = testBtn;
  _icteDom.clearButton = clearBtn;

  // Errors block (hidden by default).
  var errors = document.createElement('div');
  errors.className = 'image-click-test-errors view-hidden';
  panel.appendChild(errors);
  _icteDom.errorsBlock = errors;

  // Warnings block.
  var warnings = document.createElement('div');
  warnings.className = 'image-click-test-warnings view-hidden';
  panel.appendChild(warnings);
  _icteDom.warningsBlock = warnings;

  // Result panel.
  var result = document.createElement('div');
  result.id = 'image-click-test-result';
  result.className = 'image-click-test-result-panel view-hidden';
  panel.appendChild(result);
  _icteDom.resultPanel = result;

  // Overlay (visual debug — preview + bbox + target + region).
  var overlay = document.createElement('div');
  overlay.id = 'image-click-test-overlay';
  overlay.className = 'image-click-test-overlay-card view-hidden';
  panel.appendChild(overlay);
  _icteDom.overlay = overlay;

  // Action preview block.
  var ap = document.createElement('div');
  ap.id = 'image-click-test-action-preview';
  ap.className = 'image-click-test-action-preview view-hidden';
  panel.appendChild(ap);
  _icteDom.actionPreviewBlock = ap;
}

function _icteAddNavButton(container, key, fallback, advancedTab) {
  var btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'btn btn-secondary image-click-test-nav-button';
  btn.textContent = _icteT(key, fallback);
  btn.setAttribute('data-advanced-tab', advancedTab);
  btn.addEventListener('click', function (e) {
    e.preventDefault();
    _icteOpenAdvancedTab(advancedTab);
  });
  container.appendChild(btn);
}

// ---------------------------------------------------------------------
// renderImageClickTemplatePreview()
// ---------------------------------------------------------------------

function renderImageClickTemplatePreview() {
  var card = _icteDom.templatePreviewCard;
  if (!card) return;
  card.innerHTML = '';
  var title = document.createElement('div');
  title.className = 'image-click-test-card-title';
  title.textContent = _icteT('templatePreview', 'Template preview');
  card.appendChild(title);

  var template = _icteResolveTemplateFromForm();
  if (!template || !template.id) {
    var empty = document.createElement('div');
    empty.className = 'image-click-test-empty';
    empty.textContent = _icteT('noTemplateSelected', 'No template selected.');
    card.appendChild(empty);
    return;
  }

  var body = document.createElement('div');
  body.className = 'image-click-test-template-body';

  // Preview image — rendered through `<img>.src` only. If the
  // previewDataUrl is missing we fall back to the empty box.
  var previewBox = document.createElement('div');
  previewBox.className = 'image-click-test-template-preview-box';
  if (template.previewDataUrl && typeof template.previewDataUrl === 'string') {
    var img = document.createElement('img');
    img.className = 'image-click-test-template-preview-image';
    img.alt = '';
    img.src = template.previewDataUrl;
    img.addEventListener('dragstart', function (e) { e.preventDefault(); });
    previewBox.appendChild(img);
  } else {
    var ph = document.createElement('div');
    ph.className = 'image-click-test-empty';
    ph.textContent = _icteT('templateImageMissing', 'Template image is missing.');
    previewBox.appendChild(ph);
  }
  body.appendChild(previewBox);

  var meta = document.createElement('div');
  meta.className = 'image-click-test-template-meta';
  _icteAddRow(meta, _icteT('templateName', 'Template'), template.name || template.id);
  if (template.width > 0 && template.height > 0) {
    _icteAddRow(meta, _icteT('imageSize', 'Image size'), template.width + ' × ' + template.height + ' px');
  }
  if (template.sizeBytes > 0) {
    _icteAddRow(meta, _icteT('fileSize', 'File size'), _icteFormatBytes(template.sizeBytes));
  }
  body.appendChild(meta);

  card.appendChild(body);
}

// ---------------------------------------------------------------------
// renderImageClickScreenPreviewStatus()
// ---------------------------------------------------------------------

function renderImageClickScreenPreviewStatus() {
  var card = _icteDom.screenPreviewStatusCard;
  if (!card) return;
  card.innerHTML = '';
  var title = document.createElement('div');
  title.className = 'image-click-test-card-title';
  title.textContent = _icteT('screenPreviewStatus', 'Screen preview status');
  card.appendChild(title);

  var state = (typeof getState === 'function') ? getState() : null;
  var preview = state && state.screenCapture ? state.screenCapture.preview : null;
  if (!preview) {
    var empty = document.createElement('div');
    empty.className = 'image-click-test-empty';
    empty.textContent = _icteT('captureScreenPreviewFirst', 'Capture screen preview first.');
    card.appendChild(empty);
    return;
  }

  var meta = document.createElement('div');
  meta.className = 'image-click-test-screen-meta';
  _icteAddRow(meta, _icteT('selectedSource', 'Source'), preview.name || preview.sourceId || _icteT('none2', '—'));
  if (preview.width > 0 && preview.height > 0) {
    _icteAddRow(meta, _icteT('imageSize', 'Image size'), preview.width + ' × ' + preview.height + ' px');
  }
  if (preview.capturedAt) {
    _icteAddRow(meta, _icteT('capturedAt', 'Captured'), preview.capturedAt);
  }
  // Always-on simulation reminder.
  _icteAddRow(meta, _icteT('previewOnly', 'Preview only'), _icteT('flagEnabled', 'enabled'));
  card.appendChild(meta);
}

// ---------------------------------------------------------------------
// renderImageClickRegionSummary()
// ---------------------------------------------------------------------

function renderImageClickRegionSummary() {
  var card = _icteDom.regionSummaryCard;
  if (!card) return;
  card.innerHTML = '';
  var title = document.createElement('div');
  title.className = 'image-click-test-card-title';
  title.textContent = _icteT('regionSummary', 'Region summary');
  card.appendChild(title);

  var formRegion = (typeof window !== 'undefined' && typeof _imageClickFormRegion !== 'undefined')
    ? _imageClickFormRegion : null;
  var state = (typeof getState === 'function') ? getState() : null;
  var selectedRegion = state && state.regionSelector ? state.regionSelector.normalizedRegion : null;

  var meta = document.createElement('div');
  meta.className = 'image-click-test-region-meta';
  if (formRegion && typeof formRegion === 'object') {
    _icteAddRow(meta,
      _icteT('usedRegion', 'Used region'),
      (formRegion.x | 0) + ', ' + (formRegion.y | 0) + ' · ' + (formRegion.width | 0) + ' × ' + (formRegion.height | 0));
  } else {
    _icteAddRow(meta, _icteT('usedRegion', 'Used region'), _icteT('none', 'none'));
  }
  if (selectedRegion) {
    _icteAddRow(meta,
      _icteT('selectedRegion', 'Selected region'),
      (selectedRegion.x | 0) + ', ' + (selectedRegion.y | 0) + ' · ' + (selectedRegion.width | 0) + ' × ' + (selectedRegion.height | 0));
  }
  card.appendChild(meta);
}

// ---------------------------------------------------------------------
// runImageClickTestFromForm()
// ---------------------------------------------------------------------

async function runImageClickTestFromForm() {
  if (_icteIsRunning) return;
  if (typeof getScenarioFormData !== 'function') return;
  if (typeof buildImageClickTestInput !== 'function' ||
      typeof runImageClickTest !== 'function') return;

  var formData = getScenarioFormData();
  if (!formData || formData.type !== 'image_click') {
    _icteShowFlash('warning', _icteT('imageClickTestFormTypeMismatch',
      'Test Match is available only for image_click scenarios.'));
    return;
  }

  var state = (typeof getState === 'function') ? getState() : null;
  var input = buildImageClickTestInput(formData, state || {});
  // The form keeps a private region copy; the test tools also
  // accept it via formData.region. If the user never used the
  // "Use selected region" button but a region selection exists
  // in the renderer state, we don't pull it automatically — the
  // explicit form state wins (least-surprise principle).

  _icteIsRunning = true;
  _icteSetButtonsBusy(true);
  if (typeof addLogEntry === 'function' && typeof createLog === 'function') {
    addLogEntry(createLog('info', _icteT('imageClickTestStarted', 'Image click test started')));
  }

  var debug;
  try {
    debug = await runImageClickTest(input);
  } catch (err) {
    debug = createImageClickDebugResult({
      success:    false,
      errors:     ['matchingEngineUnavailable'],
      warnings:   [],
      durationMs: 0
    }, input);
  } finally {
    _icteIsRunning = false;
    _icteSetButtonsBusy(false);
  }

  renderImageClickTestResult(debug);

  // Logs.
  if (typeof addLogEntry === 'function' && typeof createLog === 'function') {
    if (debug.matched) {
      addLogEntry(createLog('success',
        _icteT('imageClickTestCompleted', 'Image click test matched') +
        ' · ' + Math.round((debug.confidence || 0) * 100) + '%' +
        (debug.durationMs ? ' · ' + debug.durationMs + ' ms' : '')));
    } else if (debug.errors && debug.errors.length > 0) {
      addLogEntry(createLog('error',
        _icteT('testFailed', 'Test Match failed') +
        ' · ' + debug.errors.map(function (id) { return _icteT(id, id); }).join('; ')));
    } else {
      addLogEntry(createLog('warning',
        _icteT('imageClickTestLowConfidence', 'Image click test — low confidence') +
        ' · ' + Math.round((debug.confidence || 0) * 100) + '%'));
    }
  }

  // Mirror the debug result into the templateMatching slice so the
  // existing diagnostics card in Advanced → Safety updates without
  // leaking pixel data. We only push numbers / ids.
  if (typeof setTemplateMatchingResult === 'function' && debug && debug.boundingBox) {
    try {
      setTemplateMatchingResult({
        id:           'image-click-test-' + Date.now(),
        mode:         'real-preview',
        matched:      !!debug.matched,
        confidence:   debug.confidence,
        threshold:    debug.threshold,
        boundingBox:  debug.boundingBox,
        targetPoint:  debug.targetPoint,
        usedRegion:   debug.region,
        templateId:   debug.templateId,
        templateName: debug.templateName,
        sourceId:     debug.screenSourceId,
        sourceName:   debug.screenSourceName,
        previewSize:  debug.previewSize,
        durationMs:   debug.durationMs,
        step:         debug.step,
        pixelStep:    debug.pixelStep,
        scannedPositions: debug.scannedPositions,
        downscaledSearch: debug.downscaledSearch,
        downscaledTemplate: debug.downscaledTemplate,
        createdAt:    debug.createdAt,
        realMatching: false,
        realClick:    false
      });
    } catch (e) {
      // Best-effort — never break the form on diagnostics mirror.
    }
  }
  if (typeof renderState === 'function') renderState();
}

// ---------------------------------------------------------------------
// renderImageClickTestResult(result)
// ---------------------------------------------------------------------

function renderImageClickTestResult(result) {
  var resultEl = _icteDom.resultPanel;
  if (!resultEl) return;
  if (!result) { clearImageClickTestResultUi(); return; }

  resultEl.innerHTML = '';
  resultEl.classList.remove('view-hidden');

  var headline = document.createElement('div');
  headline.className = 'image-click-test-result-headline';
  if (result.matched) {
    headline.classList.add('image-click-test-result-headline-matched');
    headline.textContent = _icteT('testMatched', 'Template matched');
  } else if (result.errors && result.errors.length > 0) {
    headline.classList.add('image-click-test-result-headline-failed');
    headline.textContent = _icteT('testFailed', 'Test Match failed');
  } else {
    headline.classList.add('image-click-test-result-headline-no-match');
    headline.textContent = _icteT('testNoMatch', 'Template not found');
  }
  resultEl.appendChild(headline);

  // Subtitle — Test does not click reminder.
  var subtitle = document.createElement('div');
  subtitle.className = 'image-click-test-result-subtitle';
  subtitle.textContent = _icteT('testDoesNotClick', 'Test Match does not click. It only checks if the template can be found.');
  resultEl.appendChild(subtitle);

  // Metric rows.
  var meta = document.createElement('div');
  meta.className = 'image-click-test-result-meta';
  if (result.scenarioDraftName) {
    _icteAddRow(meta, _icteT('scenarioDraft', 'Scenario draft'), result.scenarioDraftName);
  }
  _icteAddRow(meta, _icteT('templateName', 'Template'), result.templateName || result.templateId || _icteT('none', 'none'));
  if (result.screenSourceName) {
    _icteAddRow(meta, _icteT('selectedSource', 'Source'), result.screenSourceName);
  }
  _icteAddRow(meta, _icteT('confidence', 'Confidence'),
    (typeof result.confidence === 'number') ? (Math.round(result.confidence * 1000) / 10).toFixed(1) + '%' : _icteT('none', 'none'));
  _icteAddRow(meta, _icteT('matchThreshold', 'Threshold'),
    (typeof result.threshold === 'number') ? (Math.round(result.threshold * 100)) + '%' : _icteT('none', 'none'));
  if (result.boundingBox) {
    _icteAddRow(meta, _icteT('boundingBox', 'Bounding box'),
      result.boundingBox.x + ', ' + result.boundingBox.y + ' · ' + result.boundingBox.width + ' × ' + result.boundingBox.height);
  }
  if (result.targetPoint) {
    _icteAddRow(meta, _icteT('targetPoint', 'Target point'),
      result.targetPoint.x + ', ' + result.targetPoint.y);
  }
  if (typeof result.durationMs === 'number') {
    _icteAddRow(meta, _icteT('durationMs', 'Duration'), result.durationMs + ' ms');
  }
  if (typeof result.step === 'number') {
    _icteAddRow(meta, _icteT('step', 'Step'), String(result.step));
  }
  // Always-on simulation reminders.
  _icteAddRow(meta, _icteT('realMatchingDisabled', 'Real matching disabled'), _icteT('flagEnabled', 'enabled'));
  _icteAddRow(meta, _icteT('realClickDisabled', 'Real click disabled'),       _icteT('flagEnabled', 'enabled'));
  resultEl.appendChild(meta);

  // Errors block.
  _icteRenderErrors(result.errors || []);
  // Warnings block.
  _icteRenderWarnings(result.warnings || []);

  // Visual overlay.
  renderImageClickDebugOverlay(result);

  // Action preview.
  renderImageClickActionPreview(result);
}

// ---------------------------------------------------------------------
// clearImageClickTestResultUi()
// ---------------------------------------------------------------------

function clearImageClickTestResultUi() {
  if (typeof clearImageClickTestResult === 'function') {
    clearImageClickTestResult();
  }
  var resultEl = _icteDom.resultPanel;
  if (resultEl) {
    resultEl.innerHTML = '';
    resultEl.classList.add('view-hidden');
  }
  var overlay = _icteDom.overlay;
  if (overlay) {
    overlay.innerHTML = '';
    overlay.classList.add('view-hidden');
  }
  var ap = _icteDom.actionPreviewBlock;
  if (ap) {
    ap.innerHTML = '';
    ap.classList.add('view-hidden');
  }
  var errors = _icteDom.errorsBlock;
  if (errors) {
    errors.innerHTML = '';
    errors.classList.add('view-hidden');
  }
  var warnings = _icteDom.warningsBlock;
  if (warnings) {
    warnings.innerHTML = '';
    warnings.classList.add('view-hidden');
  }
}

function _icteHandleClearClick() {
  clearImageClickTestResultUi();
  if (typeof addLogEntry === 'function' && typeof createLog === 'function') {
    addLogEntry(createLog('info', _icteT('imageClickTestCleared', 'Image click test result cleared')));
  }
  if (typeof renderState === 'function') renderState();
}

// ---------------------------------------------------------------------
// renderImageClickDebugOverlay(result)
// ---------------------------------------------------------------------

function renderImageClickDebugOverlay(result) {
  var card = _icteDom.overlay;
  if (!card) return;
  card.innerHTML = '';
  card.classList.remove('view-hidden');

  var title = document.createElement('div');
  title.className = 'image-click-test-card-title';
  title.textContent = _icteT('debugOverlay', 'Debug overlay');
  card.appendChild(title);

  var state = (typeof getState === 'function') ? getState() : null;
  var preview = state && state.screenCapture ? state.screenCapture.preview : null;
  if (!preview || !preview.imageDataUrl ||
      !(preview.width > 0) || !(preview.height > 0)) {
    var empty = document.createElement('div');
    empty.className = 'image-click-test-empty';
    empty.textContent = _icteT('captureScreenPreviewFirst', 'Capture screen preview first.');
    card.appendChild(empty);
    return;
  }

  var wrapper = document.createElement('div');
  wrapper.className = 'image-click-test-overlay-wrapper';

  var img = document.createElement('img');
  img.className = 'image-click-test-overlay-image';
  img.alt = '';
  img.src = preview.imageDataUrl;
  img.addEventListener('dragstart', function (e) { e.preventDefault(); });
  wrapper.appendChild(img);

  // Region rectangle (dashed) — when the user used a region.
  if (result.region && _icteIsPositiveSize(preview)) {
    var rg = result.region;
    var rgEl = document.createElement('div');
    rgEl.className = 'image-click-test-overlay-region';
    rgEl.style.left   = (rg.x      / preview.width)  * 100 + '%';
    rgEl.style.top    = (rg.y      / preview.height) * 100 + '%';
    rgEl.style.width  = (rg.width  / preview.width)  * 100 + '%';
    rgEl.style.height = (rg.height / preview.height) * 100 + '%';
    wrapper.appendChild(rgEl);
  }

  // Bounding box.
  if (result.boundingBox && _icteIsPositiveSize(preview)) {
    var bb = result.boundingBox;
    var bbEl = document.createElement('div');
    bbEl.className = 'image-click-test-overlay-bbox';
    if (!result.matched) {
      bbEl.classList.add('image-click-test-overlay-bbox-candidate');
    }
    bbEl.style.left   = (bb.x      / preview.width)  * 100 + '%';
    bbEl.style.top    = (bb.y      / preview.height) * 100 + '%';
    bbEl.style.width  = (bb.width  / preview.width)  * 100 + '%';
    bbEl.style.height = (bb.height / preview.height) * 100 + '%';
    wrapper.appendChild(bbEl);

    // Confidence badge inside the box.
    var badge = document.createElement('span');
    badge.className = 'image-click-test-confidence-badge';
    if (!result.matched) badge.classList.add('image-click-test-confidence-badge-low');
    var label = (typeof result.confidence === 'number')
      ? Math.round(result.confidence * 100) + '%'
      : '?';
    var modeLabel = result.matched
      ? _icteT('testMatched', 'matched')
      : _icteT('lowConfidence', 'low');
    badge.textContent = label + ' · ' + modeLabel;
    bbEl.appendChild(badge);
  }

  // Target point.
  if (result.targetPoint && _icteIsPositiveSize(preview)) {
    var tp = result.targetPoint;
    var dot = document.createElement('div');
    dot.className = 'image-click-test-overlay-target';
    dot.style.left = (tp.x / preview.width)  * 100 + '%';
    dot.style.top  = (tp.y / preview.height) * 100 + '%';
    wrapper.appendChild(dot);
  }

  card.appendChild(wrapper);

  // Always-visible reminder beneath the overlay.
  var note = document.createElement('div');
  note.className = 'image-click-test-overlay-note';
  note.textContent = _icteT('testDoesNotClick', 'Test Match does not click. It only checks if the template can be found.');
  card.appendChild(note);
}

// ---------------------------------------------------------------------
// renderImageClickActionPreview(result)
// ---------------------------------------------------------------------

function renderImageClickActionPreview(result) {
  var card = _icteDom.actionPreviewBlock;
  if (!card) return;
  card.innerHTML = '';
  if (!result || !result.actionPreview) {
    card.classList.add('view-hidden');
    return;
  }
  card.classList.remove('view-hidden');

  var title = document.createElement('div');
  title.className = 'image-click-test-card-title';
  title.textContent = _icteT('actionPreview', 'Action preview');
  card.appendChild(title);

  var note = document.createElement('div');
  note.className = 'image-click-test-action-preview-note';
  note.textContent = _icteT('imageClickPreview', 'image_click preview') +
    ' · ' + _icteT('realClickDisabled', 'Real click disabled');
  card.appendChild(note);

  // Render via <pre>.textContent — never innerHTML on user data.
  var pre = document.createElement('pre');
  pre.className = 'image-click-test-action-preview-json';
  try {
    pre.textContent = JSON.stringify(result.actionPreview, null, 2);
  } catch (err) {
    pre.textContent = '[unserializable preview]';
  }
  card.appendChild(pre);
}

// ---------------------------------------------------------------------
// Errors / warnings blocks
// ---------------------------------------------------------------------

function _icteRenderErrors(errors) {
  var el = _icteDom.errorsBlock;
  if (!el) return;
  el.innerHTML = '';
  if (!Array.isArray(errors) || errors.length === 0) {
    el.classList.add('view-hidden');
    return;
  }
  el.classList.remove('view-hidden');
  var title = document.createElement('div');
  title.className = 'image-click-test-errors-title';
  title.textContent = _icteT('testFailed', 'Test Match failed');
  el.appendChild(title);
  var list = document.createElement('ul');
  list.className = 'image-click-test-errors-list';
  for (var i = 0; i < errors.length; i++) {
    var li = document.createElement('li');
    li.className = 'image-click-test-errors-item';
    li.textContent = _icteT(errors[i], errors[i]);
    list.appendChild(li);
  }
  el.appendChild(list);
}

function _icteRenderWarnings(warnings) {
  var el = _icteDom.warningsBlock;
  if (!el) return;
  el.innerHTML = '';
  if (!Array.isArray(warnings) || warnings.length === 0) {
    el.classList.add('view-hidden');
    return;
  }
  el.classList.remove('view-hidden');
  var title = document.createElement('div');
  title.className = 'image-click-test-warnings-title';
  title.textContent = _icteT('lowConfidence', 'Low confidence');
  el.appendChild(title);
  var list = document.createElement('ul');
  list.className = 'image-click-test-warnings-list';
  for (var i = 0; i < warnings.length; i++) {
    var li = document.createElement('li');
    li.className = 'image-click-test-warnings-item';
    li.textContent = _icteT(warnings[i], warnings[i]);
    list.appendChild(li);
  }
  el.appendChild(list);
}

// ---------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------

function _icteIsTestUiAlreadyInitialized() {
  return _icteDom.initialized && _icteDom.panel && document.body && document.body.contains(_icteDom.panel);
}

function _icteResolveTemplateFromForm() {
  var sel = document.getElementById('input-template-id');
  var id = sel ? sel.value : '';
  if (!id) {
    if (typeof getActiveTemplate === 'function') {
      var active = getActiveTemplate();
      return active || null;
    }
    return null;
  }
  if (typeof getTemplateById === 'function') {
    return getTemplateById(id);
  }
  return null;
}

function _icteAddRow(container, label, value) {
  var row = document.createElement('div');
  row.className = 'image-click-test-row';
  var lbl = document.createElement('span');
  lbl.className = 'image-click-test-row-label';
  lbl.textContent = label;
  var val = document.createElement('span');
  val.className = 'image-click-test-row-value';
  val.textContent = value;
  row.appendChild(lbl);
  row.appendChild(val);
  container.appendChild(row);
}

function _icteFormatBytes(bytes) {
  var n = Number(bytes) || 0;
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KiB';
  return (n / (1024 * 1024)).toFixed(2) + ' MiB';
}

function _icteIsPositiveSize(p) {
  return p && typeof p === 'object' &&
    typeof p.width === 'number' && p.width > 0 &&
    typeof p.height === 'number' && p.height > 0;
}

function _icteSetButtonsBusy(busy) {
  if (_icteDom.testButton) {
    _icteDom.testButton.disabled = !!busy;
    if (busy) {
      _icteDom.testButton.classList.add('image-click-test-button-busy');
      _icteDom.testButton.textContent = _icteT('matchingInProgress', 'Matching…');
    } else {
      _icteDom.testButton.classList.remove('image-click-test-button-busy');
      _icteDom.testButton.textContent = _icteT('runTestMatch', 'Run Test Match');
    }
  }
  if (_icteDom.clearButton) _icteDom.clearButton.disabled = !!busy;
}

function _icteShowFlash(level, message) {
  if (typeof addLogEntry === 'function' && typeof createLog === 'function') {
    addLogEntry(createLog(level || 'info', message));
  }
  // Surface inline as a one-line warning above the result panel.
  var el = _icteDom.warningsBlock;
  if (!el) return;
  el.innerHTML = '';
  el.classList.remove('view-hidden');
  var p = document.createElement('div');
  p.className = 'image-click-test-warnings-item';
  p.textContent = message;
  el.appendChild(p);
}

function _icteOpenAdvancedTab(tab) {
  if (typeof addLogEntry === 'function' && typeof createLog === 'function') {
    addLogEntry(createLog('info', _icteT('openingAdvancedTab', 'Opening advanced tab') + ': ' + tab));
  }
  if (typeof showView === 'function')        showView('advanced');
  if (typeof setAdvancedTab === 'function')  setAdvancedTab(tab);
}

function _icteT(key, fallback) {
  if (typeof t === 'function') {
    var s = t(key);
    if (s && s !== key) return s;
  }
  return fallback || key;
}
