// =====================================================================
// ClickFlow — src/text-click-test-ui.js (Step 34)
// ---------------------------------------------------------------------
// UI layer for the **Test OCR / Test Text Match** flow inside the
// text_click scenario form. Renders the Test panel under the
// text_click section: screen preview status, region summary, OCR
// settings summary, the Test OCR button, the debug result, the
// recognised-blocks list, the visual overlay, and the action
// preview. Quick navigation buttons jump to OCR / Screen Capture /
// Region Selector.
//
// HARD GUARANTEES (Step 34):
//   - Pure renderer code. Never imports `electron`, `ipcRenderer`,
//     `fs`, never opens a new IPC channel.
//   - User-visible text rendered via `textContent`. `innerHTML`
//     is used only as `= ''` to clear a container.
//   - Image previews go to `<img>.src` only. No HTML injection.
//   - The Test OCR button NEVER calls `runScenario`,
//     `runTextClickScenario`, or `executeAction` for real
//     execution. It calls `runTextClickTest`, which is preview /
//     debug only.
//   - The action preview is rendered through `<pre>.textContent`
//     and is never executed. The click engine, action pipeline,
//     mock adapter, and dry-run sandbox refuse to consume it.
//   - Saving the scenario remains the user's explicit action —
//     Test OCR never persists a draft and never auto-clicks Save.
// =====================================================================

// ---------------------------------------------------------------------
// DOM cache (filled lazily on first render — the scenario form
// view may be rendered before this module's listeners attach).
// ---------------------------------------------------------------------

var _tcteDom = {
  panel:                    null,
  navigationBlock:          null,
  screenPreviewStatusCard:  null,
  regionSummaryCard:        null,
  ocrSettingsCard:          null,
  testButton:               null,
  clearButton:              null,
  errorsBlock:              null,
  warningsBlock:            null,
  resultPanel:              null,
  blocksBlock:              null,
  overlay:                  null,
  actionPreviewBlock:       null,
  initialized:              false
};

// Busy flag so double-clicks don't queue parallel runs.
var _tcteIsRunning = false;

// ---------------------------------------------------------------------
// Public entry point — wired from renderer.js after init().
// ---------------------------------------------------------------------

function initTextClickTestUi() {
  if (_tcteIsTestUiAlreadyInitialized()) return;

  var textSection = document.getElementById('form-section-text-click');
  if (!textSection) return;

  // Build the panel container if it isn't already in the DOM.
  var panel = document.getElementById('text-click-test-panel');
  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'text-click-test-panel';
    panel.className = 'text-click-test-panel';
    textSection.appendChild(panel);
  }
  _tcteDom.panel = panel;
  _tcteRenderPanelSkeleton();
  _tcteDom.initialized = true;

  // Bind controls.
  if (_tcteDom.testButton) {
    _tcteDom.testButton.addEventListener('click', function (e) {
      e.preventDefault();
      runTextClickTestFromForm();
    });
  }
  if (_tcteDom.clearButton) {
    _tcteDom.clearButton.addEventListener('click', function (e) {
      e.preventDefault();
      _tcteHandleClearClick();
    });
  }

  // First render.
  refreshTextClickTestPanel();
}

// Convenience helper exported for renderer.js.
function refreshTextClickTestPanel() {
  if (!_tcteDom.initialized) return;
  renderTextClickScreenPreviewStatus();
  renderTextClickRegionSummary();
  renderTextClickOcrSettings();
  // Re-render last result if any.
  var last = (typeof getLastTextClickTestResult === 'function') ? getLastTextClickTestResult() : null;
  if (last) {
    renderTextClickTestResult(last);
  } else {
    clearTextClickTestResultUi();
  }
}

// ---------------------------------------------------------------------
// Skeleton — built once on initTextClickTestUi().
// ---------------------------------------------------------------------

function _tcteRenderPanelSkeleton() {
  var panel = _tcteDom.panel;
  panel.innerHTML = '';

  // Header.
  var header = document.createElement('div');
  header.className = 'text-click-test-header';
  var headerTitle = document.createElement('div');
  headerTitle.className = 'text-click-test-title';
  headerTitle.textContent = _tcteT('textClickTestTools', 'Text click test tools');
  var subtitle = document.createElement('div');
  subtitle.className = 'text-click-test-subtitle';
  subtitle.textContent = _tcteT('testDoesNotClick',
    'Test OCR does not click. It only checks if the target text can be found by the mock OCR.');
  var subtitle2 = document.createElement('div');
  subtitle2.className = 'text-click-test-subtitle text-click-test-subtitle-mock';
  subtitle2.textContent = _tcteT('testDoesNotUseRealOcr',
    'Test OCR does not use real OCR. Mock OCR only.');
  header.appendChild(headerTitle);
  header.appendChild(subtitle);
  header.appendChild(subtitle2);
  panel.appendChild(header);

  // Quick navigation row.
  var nav = document.createElement('div');
  nav.className = 'text-click-test-nav';
  _tcteAddNavButton(nav, 'openOcr',            'Open OCR',             'ocr');
  _tcteAddNavButton(nav, 'openScreenCapture',  'Open Screen Capture',  'screenCapture');
  _tcteAddNavButton(nav, 'openRegionSelector', 'Open Region Selector', 'screenCapture');
  panel.appendChild(nav);
  _tcteDom.navigationBlock = nav;

  // Screen preview status card.
  var screenCard = document.createElement('div');
  screenCard.id = 'text-click-test-screen-card';
  screenCard.className = 'text-click-test-card text-click-test-screen-card';
  panel.appendChild(screenCard);
  _tcteDom.screenPreviewStatusCard = screenCard;

  // Region summary card.
  var regionCard = document.createElement('div');
  regionCard.id = 'text-click-test-region-card';
  regionCard.className = 'text-click-test-card text-click-test-region-card';
  panel.appendChild(regionCard);
  _tcteDom.regionSummaryCard = regionCard;

  // OCR settings summary card.
  var ocrCard = document.createElement('div');
  ocrCard.id = 'text-click-test-ocr-card';
  ocrCard.className = 'text-click-test-card text-click-test-ocr-card';
  panel.appendChild(ocrCard);
  _tcteDom.ocrSettingsCard = ocrCard;

  // Controls row (Test OCR / Test Text Match + Clear result).
  var controls = document.createElement('div');
  controls.className = 'text-click-test-controls';
  var testBtn = document.createElement('button');
  testBtn.type = 'button';
  testBtn.className = 'btn btn-accent text-click-test-button';
  testBtn.textContent = _tcteT('runTextClickTest', 'Test OCR');
  controls.appendChild(testBtn);
  var clearBtn = document.createElement('button');
  clearBtn.type = 'button';
  clearBtn.className = 'btn btn-back text-click-test-clear-button';
  clearBtn.textContent = _tcteT('clearOcrResult', 'Clear OCR result');
  controls.appendChild(clearBtn);
  panel.appendChild(controls);
  _tcteDom.testButton  = testBtn;
  _tcteDom.clearButton = clearBtn;

  // Errors block (hidden by default).
  var errors = document.createElement('div');
  errors.className = 'text-click-test-errors view-hidden';
  panel.appendChild(errors);
  _tcteDom.errorsBlock = errors;

  // Warnings block.
  var warnings = document.createElement('div');
  warnings.className = 'text-click-test-warnings view-hidden';
  panel.appendChild(warnings);
  _tcteDom.warningsBlock = warnings;

  // Result panel.
  var result = document.createElement('div');
  result.id = 'text-click-test-result';
  result.className = 'text-click-test-result-panel view-hidden';
  panel.appendChild(result);
  _tcteDom.resultPanel = result;

  // Blocks list.
  var blocks = document.createElement('div');
  blocks.id = 'text-click-test-blocks';
  blocks.className = 'text-click-test-blocks-card view-hidden';
  panel.appendChild(blocks);
  _tcteDom.blocksBlock = blocks;

  // Overlay (visual debug — preview + blocks + matched + target).
  var overlay = document.createElement('div');
  overlay.id = 'text-click-test-overlay';
  overlay.className = 'text-click-test-overlay-card view-hidden';
  panel.appendChild(overlay);
  _tcteDom.overlay = overlay;

  // Action preview block.
  var ap = document.createElement('div');
  ap.id = 'text-click-test-action-preview';
  ap.className = 'text-click-test-action-preview view-hidden';
  panel.appendChild(ap);
  _tcteDom.actionPreviewBlock = ap;
}

function _tcteAddNavButton(container, key, fallback, advancedTab) {
  var btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'btn btn-secondary text-click-test-nav-button';
  btn.textContent = _tcteT(key, fallback);
  btn.setAttribute('data-advanced-tab', advancedTab);
  btn.addEventListener('click', function (e) {
    e.preventDefault();
    _tcteOpenAdvancedTab(advancedTab);
  });
  container.appendChild(btn);
}

// ---------------------------------------------------------------------
// renderTextClickScreenPreviewStatus()
// ---------------------------------------------------------------------

function renderTextClickScreenPreviewStatus() {
  var card = _tcteDom.screenPreviewStatusCard;
  if (!card) return;
  card.innerHTML = '';
  var title = document.createElement('div');
  title.className = 'text-click-test-card-title';
  title.textContent = _tcteT('screenPreviewStatus', 'Screen preview status');
  card.appendChild(title);

  var state = (typeof getState === 'function') ? getState() : null;
  var preview = state && state.screenCapture ? state.screenCapture.preview : null;
  if (!preview) {
    var empty = document.createElement('div');
    empty.className = 'text-click-test-empty';
    empty.textContent = _tcteT('captureScreenPreviewFirst', 'Capture a screen preview first.');
    card.appendChild(empty);
    return;
  }
  var meta = document.createElement('div');
  meta.className = 'text-click-test-screen-meta';
  _tcteAddRow(meta, _tcteT('selectedSource', 'Source'), preview.name || preview.sourceId || _tcteT('none2', '—'));
  if (Number(preview.width) > 0 && Number(preview.height) > 0) {
    _tcteAddRow(meta, _tcteT('imageSize', 'Image size'), preview.width + ' × ' + preview.height + ' px');
  }
  if (preview.capturedAt) {
    _tcteAddRow(meta, _tcteT('capturedAt', 'Captured'), preview.capturedAt);
  }
  // Always-on simulation reminder.
  _tcteAddRow(meta, _tcteT('previewOnly', 'Preview only'), _tcteT('flagEnabled', 'enabled'));
  card.appendChild(meta);
}

// ---------------------------------------------------------------------
// renderTextClickRegionSummary()
// ---------------------------------------------------------------------

function renderTextClickRegionSummary() {
  var card = _tcteDom.regionSummaryCard;
  if (!card) return;
  card.innerHTML = '';
  var title = document.createElement('div');
  title.className = 'text-click-test-card-title';
  title.textContent = _tcteT('regionSummary', 'Region summary');
  card.appendChild(title);

  // The form keeps a private region copy in `_textClickFormRegion`;
  // we read it via guarded `typeof` so the script-load order
  // doesn't matter.
  var formRegion = (typeof _textClickFormRegion !== 'undefined') ? _textClickFormRegion : null;
  var state = (typeof getState === 'function') ? getState() : null;
  var selectedRegion = state && state.regionSelector ? state.regionSelector.normalizedRegion : null;

  var meta = document.createElement('div');
  meta.className = 'text-click-test-region-meta';
  if (formRegion && typeof formRegion === 'object') {
    _tcteAddRow(meta,
      _tcteT('usedRegion', 'Used region'),
      (formRegion.x | 0) + ', ' + (formRegion.y | 0) + ' · ' + (formRegion.width | 0) + ' × ' + (formRegion.height | 0));
  } else {
    _tcteAddRow(meta, _tcteT('usedRegion', 'Used region'), _tcteT('none', 'none'));
  }
  if (selectedRegion) {
    _tcteAddRow(meta,
      _tcteT('selectedRegion', 'Selected region'),
      (selectedRegion.x | 0) + ', ' + (selectedRegion.y | 0) + ' · ' + (selectedRegion.width | 0) + ' × ' + (selectedRegion.height | 0));
  }
  card.appendChild(meta);
}

// ---------------------------------------------------------------------
// renderTextClickOcrSettings()
// ---------------------------------------------------------------------

function renderTextClickOcrSettings() {
  var card = _tcteDom.ocrSettingsCard;
  if (!card) return;
  card.innerHTML = '';
  var title = document.createElement('div');
  title.className = 'text-click-test-card-title';
  title.textContent = _tcteT('ocrSettings', 'OCR settings');
  card.appendChild(title);

  // Read directly from the form fields (DOM is the source of truth
  // until Save). Empty target text is rendered as "—" so the card
  // never shows leftover state.
  var langSel = document.getElementById('input-text-language');
  var modeSel = document.getElementById('input-text-match-mode');
  var caseSel = document.getElementById('input-text-case-sensitive');
  var textSel = document.getElementById('input-text-target');
  var lang = langSel ? langSel.value : 'ru+en';
  var mode = modeSel ? modeSel.value : 'contains';
  var caseSens = caseSel ? !!caseSel.checked : false;
  var text = textSel ? textSel.value : '';

  var meta = document.createElement('div');
  meta.className = 'text-click-test-ocr-meta';
  _tcteAddRow(meta, _tcteT('targetText', 'Target text'),
    text && text.trim().length > 0
      ? (text.length > 60 ? text.slice(0, 60) + '…' : text)
      : _tcteT('none2', '—'));
  _tcteAddRow(meta, _tcteT('ocrLanguage', 'OCR language'), _tcteOcrLanguageLabel(lang));
  _tcteAddRow(meta, _tcteT('matchMode', 'Match mode'),
    mode === 'exact' ? _tcteT('matchModeExact', 'exact') : _tcteT('matchModeContains', 'contains'));
  _tcteAddRow(meta, _tcteT('caseSensitive', 'Case sensitive'),
    caseSens ? _tcteT('yes', 'yes') : _tcteT('no', 'no'));
  // Always-on simulation reminder.
  _tcteAddRow(meta, _tcteT('ocrMockOnly', 'Mock OCR only'), _tcteT('flagEnabled', 'enabled'));
  card.appendChild(meta);
}

// ---------------------------------------------------------------------
// runTextClickTestFromForm()
// ---------------------------------------------------------------------

function runTextClickTestFromForm() {
  if (_tcteIsRunning) return;
  if (typeof getScenarioFormData !== 'function') return;
  if (typeof buildTextClickTestInput !== 'function' ||
      typeof runTextClickTest !== 'function') return;

  var formData = getScenarioFormData();
  if (!formData || formData.type !== 'text_click') {
    _tcteShowFlash('warning', _tcteT('textClickTestFormTypeMismatch',
      'Test OCR is available only for text_click scenarios.'));
    return;
  }

  var state = (typeof getState === 'function') ? getState() : null;
  var input = buildTextClickTestInput(formData, state || {});

  _tcteIsRunning = true;
  _tcteSetButtonsBusy(true);
  if (typeof addLogEntry === 'function' && typeof createLog === 'function') {
    addLogEntry(createLog('info', _tcteT('textClickTestStarted', 'Text click test started')));
  }

  var debug;
  try {
    debug = runTextClickTest(input);
  } catch (err) {
    debug = createTextClickDebugResult(null, input, {
      success:    false,
      errors:     ['mockOcrEngineUnavailable'],
      warnings:   [],
      durationMs: 0
    });
  } finally {
    _tcteIsRunning = false;
    _tcteSetButtonsBusy(false);
  }

  renderTextClickTestResult(debug);

  // Logs.
  if (typeof addLogEntry === 'function' && typeof createLog === 'function') {
    if (debug.matched) {
      addLogEntry(createLog('success',
        _tcteT('textClickTestCompleted', 'Text click test matched') +
        ' · ' + Math.round((debug.confidence || 0) * 100) + '%' +
        (debug.durationMs ? ' · ' + debug.durationMs + ' ms' : '')));
    } else if (debug.errors && debug.errors.length > 0 &&
               debug.errors.indexOf('targetTextWasNotFound') === -1) {
      addLogEntry(createLog('error',
        _tcteT('textClickTestFailed', 'Text click test failed') +
        ' · ' + debug.errors.map(function (id) { return _tcteT(id, id); }).join('; ')));
    } else {
      addLogEntry(createLog('warning',
        _tcteT('textClickTestNoMatch', 'Text click test — no match')));
    }
  }

  if (typeof renderState === 'function') renderState();
}

// ---------------------------------------------------------------------
// renderTextClickTestResult(result)
// ---------------------------------------------------------------------

function renderTextClickTestResult(result) {
  var resultEl = _tcteDom.resultPanel;
  if (!resultEl) return;
  if (!result) { clearTextClickTestResultUi(); return; }

  resultEl.innerHTML = '';
  resultEl.classList.remove('view-hidden');

  var headline = document.createElement('div');
  headline.className = 'text-click-test-result-headline';
  if (result.matched) {
    headline.classList.add('text-click-test-result-headline-matched');
    headline.textContent = _tcteT('targetTextFound', 'Target text found');
  } else if (result.errors && result.errors.length > 0 &&
             result.errors.indexOf('targetTextWasNotFound') === -1) {
    headline.classList.add('text-click-test-result-headline-failed');
    headline.textContent = _tcteT('textClickTestFailed', 'Text click test failed');
  } else {
    headline.classList.add('text-click-test-result-headline-no-match');
    headline.textContent = _tcteT('textClickTestNoMatch', 'Target text was not found');
  }
  resultEl.appendChild(headline);

  // Subtitle — Test does not click reminder.
  var subtitle = document.createElement('div');
  subtitle.className = 'text-click-test-result-subtitle';
  subtitle.textContent = _tcteT('testDoesNotClick',
    'Test OCR does not click. It only checks if the target text can be found by the mock OCR.');
  resultEl.appendChild(subtitle);

  // Metric rows.
  var meta = document.createElement('div');
  meta.className = 'text-click-test-result-meta';
  if (result.scenarioDraftName) {
    _tcteAddRow(meta, _tcteT('scenarioDraft', 'Scenario draft'), result.scenarioDraftName);
  }
  // Render the target text truncated so a long input cannot blow up
  // the result card.
  if (typeof result.targetText === 'string' && result.targetText.length > 0) {
    _tcteAddRow(meta, _tcteT('targetText', 'Target text'),
      result.targetText.length > 60 ? result.targetText.slice(0, 60) + '…' : result.targetText);
  }
  _tcteAddRow(meta, _tcteT('ocrLanguage', 'OCR language'), _tcteOcrLanguageLabel(result.language));
  _tcteAddRow(meta, _tcteT('matchMode', 'Match mode'),
    result.matchMode === 'exact' ? _tcteT('matchModeExact', 'exact') : _tcteT('matchModeContains', 'contains'));
  _tcteAddRow(meta, _tcteT('caseSensitive', 'Case sensitive'),
    result.caseSensitive ? _tcteT('yes', 'yes') : _tcteT('no', 'no'));
  if (typeof result.matchedText === 'string' && result.matchedText.length > 0) {
    _tcteAddRow(meta, _tcteT('matchedText', 'Matched text'),
      result.matchedText.length > 60 ? result.matchedText.slice(0, 60) + '…' : result.matchedText);
  }
  _tcteAddRow(meta, _tcteT('confidence', 'Confidence'),
    (typeof result.confidence === 'number')
      ? (Math.round(result.confidence * 1000) / 10).toFixed(1) + '%'
      : _tcteT('none', 'none'));
  if (result.boundingBox) {
    _tcteAddRow(meta, _tcteT('boundingBox', 'Bounding box'),
      result.boundingBox.x + ', ' + result.boundingBox.y + ' · ' +
      result.boundingBox.width + ' × ' + result.boundingBox.height);
  }
  if (result.targetPoint) {
    _tcteAddRow(meta, _tcteT('targetPoint', 'Target point'),
      result.targetPoint.x + ', ' + result.targetPoint.y);
  }
  if (typeof result.durationMs === 'number') {
    _tcteAddRow(meta, _tcteT('durationMs', 'Duration'), result.durationMs + ' ms');
  }
  // Always-on simulation reminders.
  _tcteAddRow(meta, _tcteT('realOcrDisabled', 'Real OCR disabled'),       _tcteT('flagEnabled', 'enabled'));
  _tcteAddRow(meta, _tcteT('realTextClickDisabled', 'Real text_click disabled'), _tcteT('flagEnabled', 'enabled'));
  resultEl.appendChild(meta);

  // Errors block.
  _tcteRenderErrors(result.errors || []);
  // Warnings block.
  _tcteRenderWarnings(result.warnings || []);
  // Blocks list.
  renderTextClickBlocksList(result);
  // Visual overlay.
  renderTextClickOcrOverlay(result);
  // Action preview.
  renderTextClickActionPreview(result);
}

// ---------------------------------------------------------------------
// clearTextClickTestResultUi()
// ---------------------------------------------------------------------

function clearTextClickTestResultUi() {
  if (typeof clearTextClickTestResult === 'function') {
    clearTextClickTestResult();
  }
  var resultEl = _tcteDom.resultPanel;
  if (resultEl) {
    resultEl.innerHTML = '';
    resultEl.classList.add('view-hidden');
  }
  var blocks = _tcteDom.blocksBlock;
  if (blocks) {
    blocks.innerHTML = '';
    blocks.classList.add('view-hidden');
  }
  var overlay = _tcteDom.overlay;
  if (overlay) {
    overlay.innerHTML = '';
    overlay.classList.add('view-hidden');
  }
  var ap = _tcteDom.actionPreviewBlock;
  if (ap) {
    ap.innerHTML = '';
    ap.classList.add('view-hidden');
  }
  var errors = _tcteDom.errorsBlock;
  if (errors) {
    errors.innerHTML = '';
    errors.classList.add('view-hidden');
  }
  var warnings = _tcteDom.warningsBlock;
  if (warnings) {
    warnings.innerHTML = '';
    warnings.classList.add('view-hidden');
  }
}

function _tcteHandleClearClick() {
  clearTextClickTestResultUi();
  if (typeof addLogEntry === 'function' && typeof createLog === 'function') {
    addLogEntry(createLog('info', _tcteT('textClickTestCleared', 'Text click test result cleared')));
  }
  if (typeof renderState === 'function') renderState();
}

// ---------------------------------------------------------------------
// renderTextClickBlocksList(result)
// ---------------------------------------------------------------------

function renderTextClickBlocksList(result) {
  var card = _tcteDom.blocksBlock;
  if (!card) return;
  card.innerHTML = '';
  if (!result || !Array.isArray(result.blocks) || result.blocks.length === 0) {
    card.classList.add('view-hidden');
    return;
  }
  card.classList.remove('view-hidden');

  var title = document.createElement('div');
  title.className = 'text-click-test-card-title';
  title.textContent = _tcteT('textClickBlocks', 'OCR blocks');
  card.appendChild(title);

  var matchedId = (result.match && result.match.id)
    ? result.match.id
    : (result.matched && result.blocks.length > 0 ? _tcteFindMatchedBlockId(result) : null);

  var list = document.createElement('div');
  list.className = 'text-click-test-blocks-list';
  for (var i = 0; i < result.blocks.length; i++) {
    var b = result.blocks[i];
    if (!b) continue;
    var row = document.createElement('div');
    row.className = 'text-click-test-block-row';
    if (matchedId && b.id === matchedId) {
      row.classList.add('text-click-test-block-row-matched');
    }
    var idx = document.createElement('span');
    idx.className = 'text-click-test-block-index';
    idx.textContent = '#' + (i + 1);
    var text = document.createElement('span');
    text.className = 'text-click-test-block-text';
    text.textContent = (typeof b.text === 'string')
      ? (b.text.length > 60 ? b.text.slice(0, 60) + '…' : b.text)
      : '';
    var conf = document.createElement('span');
    conf.className = 'text-click-test-block-confidence';
    conf.textContent = (typeof b.confidence === 'number')
      ? (Math.round(b.confidence * 1000) / 10).toFixed(1) + '%'
      : '—';
    var bbox = document.createElement('span');
    bbox.className = 'text-click-test-block-bbox';
    bbox.textContent = b.boundingBox
      ? (b.boundingBox.x + ',' + b.boundingBox.y + ' · ' + b.boundingBox.width + '×' + b.boundingBox.height)
      : '—';
    if (matchedId && b.id === matchedId) {
      var badge = document.createElement('span');
      badge.className = 'text-click-test-block-badge';
      badge.textContent = _tcteT('matchedBlock', 'matched');
      row.appendChild(badge);
    }
    row.appendChild(idx);
    row.appendChild(text);
    row.appendChild(conf);
    row.appendChild(bbox);
    list.appendChild(row);
  }
  card.appendChild(list);
}

// ---------------------------------------------------------------------
// renderTextClickOcrOverlay(result)
// ---------------------------------------------------------------------

function renderTextClickOcrOverlay(result) {
  var card = _tcteDom.overlay;
  if (!card) return;
  card.innerHTML = '';
  card.classList.remove('view-hidden');

  var title = document.createElement('div');
  title.className = 'text-click-test-card-title';
  title.textContent = _tcteT('ocrBlocksOverlay', 'OCR blocks overlay');
  card.appendChild(title);

  var state = (typeof getState === 'function') ? getState() : null;
  var preview = state && state.screenCapture ? state.screenCapture.preview : null;
  if (!preview || !preview.imageDataUrl ||
      !(Number(preview.width) > 0) || !(Number(preview.height) > 0)) {
    var empty = document.createElement('div');
    empty.className = 'text-click-test-empty';
    empty.textContent = _tcteT('captureScreenPreviewFirst', 'Capture a screen preview first.');
    card.appendChild(empty);
    return;
  }

  var wrapper = document.createElement('div');
  wrapper.className = 'text-click-test-overlay-wrapper';

  var img = document.createElement('img');
  img.className = 'text-click-test-overlay-image';
  img.alt = '';
  img.src = preview.imageDataUrl;
  img.addEventListener('dragstart', function (e) { e.preventDefault(); });
  wrapper.appendChild(img);

  // Region rectangle (dashed) — when the user used a region.
  if (result && result.region && _tcteIsPositiveSize(preview)) {
    var rg = result.region;
    var rgEl = document.createElement('div');
    rgEl.className = 'text-click-test-overlay-region';
    rgEl.style.left   = (rg.x      / preview.width)  * 100 + '%';
    rgEl.style.top    = (rg.y      / preview.height) * 100 + '%';
    rgEl.style.width  = (rg.width  / preview.width)  * 100 + '%';
    rgEl.style.height = (rg.height / preview.height) * 100 + '%';
    wrapper.appendChild(rgEl);
  }

  // OCR blocks — translucent rectangles. Matched block is emphasised.
  var matchedId = (result && result.match && result.match.id)
    ? result.match.id
    : (result && result.matched ? _tcteFindMatchedBlockId(result) : null);

  var hasMatch = !!(result && result.matched);
  var blocks = (result && Array.isArray(result.blocks)) ? result.blocks : [];
  for (var i = 0; i < blocks.length; i++) {
    var b = blocks[i];
    if (!b || !b.boundingBox) continue;
    var bbEl = document.createElement('div');
    bbEl.className = 'text-click-test-overlay-block';
    if (matchedId && b.id === matchedId) {
      bbEl.classList.add('text-click-test-overlay-block-matched');
    } else if (!hasMatch) {
      bbEl.classList.add('text-click-test-overlay-block-muted');
    }
    bbEl.style.left   = (b.boundingBox.x      / preview.width)  * 100 + '%';
    bbEl.style.top    = (b.boundingBox.y      / preview.height) * 100 + '%';
    bbEl.style.width  = (b.boundingBox.width  / preview.width)  * 100 + '%';
    bbEl.style.height = (b.boundingBox.height / preview.height) * 100 + '%';
    // Tiny text label inside the rectangle.
    var label = document.createElement('span');
    label.className = 'text-click-test-overlay-block-label';
    label.textContent = (typeof b.text === 'string') ? b.text : '';
    bbEl.appendChild(label);
    wrapper.appendChild(bbEl);
  }

  // Target point dot.
  if (result && result.targetPoint && _tcteIsPositiveSize(preview)) {
    var tp = result.targetPoint;
    var dot = document.createElement('div');
    dot.className = 'text-click-test-overlay-target';
    dot.style.left = (tp.x / preview.width)  * 100 + '%';
    dot.style.top  = (tp.y / preview.height) * 100 + '%';
    wrapper.appendChild(dot);
  }

  card.appendChild(wrapper);

  var note = document.createElement('div');
  note.className = 'text-click-test-overlay-note';
  note.textContent = _tcteT('testDoesNotClick',
    'Test OCR does not click. It only checks if the target text can be found by the mock OCR.');
  card.appendChild(note);
}

// ---------------------------------------------------------------------
// renderTextClickActionPreview(result)
// ---------------------------------------------------------------------

function renderTextClickActionPreview(result) {
  var card = _tcteDom.actionPreviewBlock;
  if (!card) return;
  card.innerHTML = '';
  if (!result || !result.actionPreview) {
    card.classList.add('view-hidden');
    return;
  }
  card.classList.remove('view-hidden');

  var title = document.createElement('div');
  title.className = 'text-click-test-card-title';
  title.textContent = _tcteT('textClickActionPreview', 'text_click action preview');
  card.appendChild(title);

  var note = document.createElement('div');
  note.className = 'text-click-test-action-preview-note';
  note.textContent = _tcteT('textClickPreview', 'text_click preview') +
    ' · ' + _tcteT('realTextClickDisabled', 'Real text_click disabled') +
    ' · ' + _tcteT('realOcrDisabled', 'Real OCR disabled');
  card.appendChild(note);

  // Render via <pre>.textContent — never innerHTML on user data.
  var pre = document.createElement('pre');
  pre.className = 'text-click-test-action-preview-json';
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

function _tcteRenderErrors(errors) {
  var el = _tcteDom.errorsBlock;
  if (!el) return;
  el.innerHTML = '';
  if (!Array.isArray(errors) || errors.length === 0) {
    el.classList.add('view-hidden');
    return;
  }
  el.classList.remove('view-hidden');
  var title = document.createElement('div');
  title.className = 'text-click-test-errors-title';
  // If the only "error" is "target text was not found" we treat it
  // as a benign result, not a failure — render under a softer
  // headline so the user sees it as a hint rather than a red flag.
  var onlyNoMatch = errors.length === 1 && errors[0] === 'targetTextWasNotFound';
  title.textContent = onlyNoMatch
    ? _tcteT('textClickTestNoMatch', 'Target text was not found')
    : _tcteT('textClickTestFailed', 'Text click test failed');
  if (onlyNoMatch) title.classList.add('text-click-test-errors-title-soft');
  el.appendChild(title);
  var list = document.createElement('ul');
  list.className = 'text-click-test-errors-list';
  for (var i = 0; i < errors.length; i++) {
    var li = document.createElement('li');
    li.className = 'text-click-test-errors-item';
    li.textContent = _tcteT(errors[i], errors[i]);
    list.appendChild(li);
  }
  el.appendChild(list);
}

function _tcteRenderWarnings(warnings) {
  var el = _tcteDom.warningsBlock;
  if (!el) return;
  el.innerHTML = '';
  if (!Array.isArray(warnings) || warnings.length === 0) {
    el.classList.add('view-hidden');
    return;
  }
  el.classList.remove('view-hidden');
  var title = document.createElement('div');
  title.className = 'text-click-test-warnings-title';
  title.textContent = _tcteT('lowConfidence', 'Warnings');
  el.appendChild(title);
  var list = document.createElement('ul');
  list.className = 'text-click-test-warnings-list';
  for (var i = 0; i < warnings.length; i++) {
    var li = document.createElement('li');
    li.className = 'text-click-test-warnings-item';
    li.textContent = _tcteT(warnings[i], warnings[i]);
    list.appendChild(li);
  }
  el.appendChild(list);
}

// ---------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------

function _tcteIsTestUiAlreadyInitialized() {
  return _tcteDom.initialized && _tcteDom.panel && document.body && document.body.contains(_tcteDom.panel);
}

function _tcteAddRow(container, label, value) {
  var row = document.createElement('div');
  row.className = 'text-click-test-row';
  var lbl = document.createElement('span');
  lbl.className = 'text-click-test-row-label';
  lbl.textContent = label;
  var val = document.createElement('span');
  val.className = 'text-click-test-row-value';
  val.textContent = value;
  row.appendChild(lbl);
  row.appendChild(val);
  container.appendChild(row);
}

function _tcteIsPositiveSize(p) {
  return p && typeof p === 'object' &&
    typeof p.width === 'number' && p.width > 0 &&
    typeof p.height === 'number' && p.height > 0;
}

function _tcteSetButtonsBusy(busy) {
  if (_tcteDom.testButton) {
    _tcteDom.testButton.disabled = !!busy;
    if (busy) {
      _tcteDom.testButton.classList.add('text-click-test-button-busy');
      _tcteDom.testButton.textContent = _tcteT('matchingInProgress', 'Matching…');
    } else {
      _tcteDom.testButton.classList.remove('text-click-test-button-busy');
      _tcteDom.testButton.textContent = _tcteT('runTextClickTest', 'Test OCR');
    }
  }
  if (_tcteDom.clearButton) _tcteDom.clearButton.disabled = !!busy;
}

function _tcteShowFlash(level, message) {
  if (typeof addLogEntry === 'function' && typeof createLog === 'function') {
    addLogEntry(createLog(level || 'info', message));
  }
  var el = _tcteDom.warningsBlock;
  if (!el) return;
  el.innerHTML = '';
  el.classList.remove('view-hidden');
  var p = document.createElement('div');
  p.className = 'text-click-test-warnings-item';
  p.textContent = message;
  el.appendChild(p);
}

function _tcteOpenAdvancedTab(tab) {
  if (typeof addLogEntry === 'function' && typeof createLog === 'function') {
    addLogEntry(createLog('info', _tcteT('openingAdvancedTab', 'Opening advanced tab') + ': ' + tab));
  }
  if (typeof showView === 'function')        showView('advanced');
  if (typeof setAdvancedTab === 'function')  setAdvancedTab(tab);
}

function _tcteOcrLanguageLabel(lang) {
  if (lang === 'ru') return _tcteT('languageRu', 'Russian');
  if (lang === 'en') return _tcteT('languageEn', 'English');
  return _tcteT('languageRuEn', 'Russian + English');
}

// In the rare case the engine returned `match: null` but
// `matched: true` (defensive — should never happen with the
// Step-32 mock), fall back to scanning the blocks.
function _tcteFindMatchedBlockId(result) {
  if (!result || !Array.isArray(result.blocks)) return null;
  if (typeof result.matchedText !== 'string' || result.matchedText.length === 0) return null;
  for (var i = 0; i < result.blocks.length; i++) {
    var b = result.blocks[i];
    if (b && typeof b.text === 'string' && b.text === result.matchedText) {
      return b.id || null;
    }
  }
  return null;
}

function _tcteT(key, fallback) {
  if (typeof t === 'function') {
    var s = t(key);
    if (s && s !== key) return s;
  }
  return fallback || key;
}
