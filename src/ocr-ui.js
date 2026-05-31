// =====================================================================
// ClickFlow — src/ocr-ui.js (Step 32)
// ---------------------------------------------------------------------
// UI layer for the OCR Foundation tab inside the Advanced dashboard.
// Renders a notice (real OCR is not connected), the screen-preview
// status, the OCR settings (target text, language, match mode, case
// sensitivity, "use selected region"), the region summary, the
// run / clear / open-screen-capture / open-region-selector buttons,
// the OCR result card, the recognised-blocks list, the visual
// overlay, and the `text_click` action preview.
//
// HARD GUARANTEES (Step 32):
//   - Pure renderer code. Never imports `electron`, `ipcRenderer`,
//     `fs`. Never opens a new IPC channel.
//   - User-visible text rendered through `textContent`. `innerHTML`
//     is used only as `= ''` to clear a container.
//   - Image previews go to `<img>.src` only. No HTML injection.
//   - The Run mock OCR button NEVER calls `runScenario`,
//     `runImageClickScenario`, or `executeAction` for real
//     execution. It calls `runMockOcr`, which is a pure mock.
//   - The action preview is rendered through `<pre>.textContent`.
//     The click engine, the action pipeline, the mock adapter, and
//     the dry-run sandbox NEVER consume `text_click` actions.
// =====================================================================

// ---------------------------------------------------------------------
// Public entry: rebuild the OCR tab content.
// ---------------------------------------------------------------------

function renderOcrTab() {
  var c = document.getElementById('advanced-tab-ocr');
  if (!c) return;
  c.innerHTML = '';

  // 1. Notice (mock OCR — real OCR is not connected).
  var notice = document.createElement('div');
  notice.className = 'ocr-notice';
  var noticeBadge = document.createElement('span');
  noticeBadge.className = 'ocr-notice-badge';
  noticeBadge.textContent = _ocrT('ocrMockBadge', 'MOCK');
  var noticeText = document.createElement('span');
  noticeText.className = 'ocr-notice-text';
  noticeText.textContent = _ocrT('ocrMockNotice', 'This is mock OCR. Real text recognition is not connected yet.');
  notice.appendChild(noticeBadge);
  notice.appendChild(noticeText);
  c.appendChild(notice);

  // 1b. OCR provider readiness card (Step 38). Architecture-only:
  //     surfaces the registry status + a "Run provider self-test"
  //     button. The mock provider is the only active provider; real
  //     OCR providers are listed as planned and unavailable. The
  //     button NEVER runs real OCR — it dispatches the synthetic
  //     mock self-test from `ocr-provider-registry.js`.
  var readinessCard = document.createElement('div');
  readinessCard.className = 'adv-card ocr-readiness-card';
  readinessCard.id = 'ocr-readiness-card';
  c.appendChild(readinessCard);
  renderOcrProviderReadiness(readinessCard);

  // 1c. OCR provider status card (Step 39). Reports the Tesseract
  //     dependency / feature-flag / engine state side by side with
  //     the active provider, plus a "Check Tesseract readiness"
  //     button. The button NEVER runs real OCR. It calls the
  //     readiness helper in `src/tesseract-ocr-provider.js`, which
  //     returns a structured report and emits audit events.
  var providerStatusCard = document.createElement('div');
  providerStatusCard.className = 'adv-card ocr-provider-status-card';
  providerStatusCard.id = 'ocr-provider-status-card';
  c.appendChild(providerStatusCard);
  renderOcrProviderStatusCard(providerStatusCard);

  // 2. Screen preview status card.
  var screenCard = document.createElement('div');
  screenCard.className = 'adv-card ocr-screen-card';
  var screenTitle = document.createElement('div');
  screenTitle.className = 'adv-card-title';
  screenTitle.textContent = _ocrT('screenPreviewStatus', 'Screen preview status');
  screenCard.appendChild(screenTitle);
  renderOcrScreenPreviewStatus(screenCard);
  c.appendChild(screenCard);

  // 3. OCR settings card (target text + language + match mode +
  //    case sensitive + use selected region).
  var settingsCard = document.createElement('div');
  settingsCard.className = 'adv-card ocr-settings-card';
  var settingsTitle = document.createElement('div');
  settingsTitle.className = 'adv-card-title';
  settingsTitle.textContent = _ocrT('ocrSettings', 'OCR settings');
  settingsCard.appendChild(settingsTitle);
  renderOcrSettings(settingsCard);
  c.appendChild(settingsCard);

  // 4. Region summary card.
  var regionCard = document.createElement('div');
  regionCard.className = 'adv-card ocr-region-card';
  var regionTitle = document.createElement('div');
  regionTitle.className = 'adv-card-title';
  regionTitle.textContent = _ocrT('regionSummary', 'Region summary');
  regionCard.appendChild(regionTitle);
  renderOcrRegionSummary(regionCard);
  c.appendChild(regionCard);

  // 5. Buttons: Run mock OCR, Clear OCR result, Open Screen Capture,
  //    Open Region Selector.
  var btnRow = document.createElement('div');
  btnRow.className = 'ocr-buttons';
  var runBtn = document.createElement('button');
  runBtn.type = 'button';
  runBtn.className = 'btn btn-accent ocr-run-button';
  runBtn.textContent = _ocrT('runMockOcr', 'Run mock OCR');
  runBtn.addEventListener('click', function (e) { e.preventDefault(); runMockOcrFromUi(); });
  btnRow.appendChild(runBtn);

  var clearBtn = document.createElement('button');
  clearBtn.type = 'button';
  clearBtn.className = 'btn btn-back ocr-clear-button';
  clearBtn.textContent = _ocrT('clearOcrResult', 'Clear OCR result');
  clearBtn.addEventListener('click', function (e) { e.preventDefault(); clearOcrResultUi(); });
  btnRow.appendChild(clearBtn);

  var openCaptureBtn = document.createElement('button');
  openCaptureBtn.type = 'button';
  openCaptureBtn.className = 'btn btn-secondary ocr-nav-button';
  openCaptureBtn.textContent = _ocrT('openScreenCapture', 'Open Screen Capture');
  openCaptureBtn.addEventListener('click', function (e) {
    e.preventDefault();
    if (typeof setAdvancedTab === 'function') setAdvancedTab('screenCapture');
  });
  btnRow.appendChild(openCaptureBtn);

  var openRegionBtn = document.createElement('button');
  openRegionBtn.type = 'button';
  openRegionBtn.className = 'btn btn-secondary ocr-nav-button';
  openRegionBtn.textContent = _ocrT('openRegionSelector', 'Open Region Selector');
  openRegionBtn.addEventListener('click', function (e) {
    e.preventDefault();
    if (typeof setAdvancedTab === 'function') setAdvancedTab('screenCapture');
  });
  btnRow.appendChild(openRegionBtn);

  c.appendChild(btnRow);

  // 6. OCR result card + visual overlay + action preview.
  var resultHost = document.createElement('div');
  resultHost.id = 'ocr-result-host';
  resultHost.className = 'ocr-result-host';
  c.appendChild(resultHost);
  renderOcrResult(resultHost);
}

// ---------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------

function renderOcrScreenPreviewStatus(host) {
  var card = host || document.querySelector('.ocr-screen-card');
  if (!card) return;
  // Drop everything except the title.
  Array.prototype.slice.call(card.querySelectorAll('.adv-card-row, .ocr-empty')).forEach(function (n) { n.remove(); });

  var state = (typeof getState === 'function') ? getState() : null;
  var preview = state && state.screenCapture ? state.screenCapture.preview : null;
  if (!preview) {
    var empty = document.createElement('div');
    empty.className = 'ocr-empty';
    empty.textContent = _ocrT('captureScreenPreviewFirst', 'Capture a screen preview first.');
    card.appendChild(empty);
    return;
  }
  _ocrAddCardRow(card, _ocrT('selectedSource', 'Source'), preview.name || preview.sourceId || _ocrT('none2', '—'));
  if (Number(preview.width) > 0 && Number(preview.height) > 0) {
    _ocrAddCardRow(card, _ocrT('imageSize', 'Image size'), preview.width + ' × ' + preview.height + ' px');
  }
  if (preview.capturedAt) {
    _ocrAddCardRow(card, _ocrT('capturedAt', 'Captured'), preview.capturedAt);
  }
  _ocrAddCardRow(card, _ocrT('previewOnly', 'Preview only'), _ocrT('flagEnabled', 'enabled'));
}

function renderOcrSettings(host) {
  var card = host || document.querySelector('.ocr-settings-card');
  if (!card) return;
  Array.prototype.slice.call(card.querySelectorAll('.ocr-setting-row')).forEach(function (n) { n.remove(); });

  var state = (typeof getState === 'function') ? getState() : null;
  var ocr = state && state.ocr ? state.ocr : { targetText: '', language: 'ru+en', matchMode: 'contains', caseSensitive: false, useSelectedRegion: true };

  // Target text.
  var ttRow = _ocrCreateSettingRow(_ocrT('targetText', 'Target text'));
  var ttInput = document.createElement('input');
  ttInput.type = 'text';
  ttInput.id = 'ocr-target-text';
  ttInput.className = 'ocr-input';
  ttInput.placeholder = _ocrT('targetTextPlaceholder', 'Продолжить / Continue');
  ttInput.value = ocr.targetText || '';
  ttInput.addEventListener('input', function () {
    if (typeof setOcrTargetText === 'function') setOcrTargetText(ttInput.value);
  });
  ttRow.appendChild(ttInput);
  card.appendChild(ttRow);

  // Language select.
  var langRow = _ocrCreateSettingRow(_ocrT('ocrLanguage', 'OCR language'));
  var langSelect = document.createElement('select');
  langSelect.id = 'ocr-language';
  langSelect.className = 'ocr-select';
  [
    { value: 'ru',    label: _ocrT('languageRu', 'Russian') },
    { value: 'en',    label: _ocrT('languageEn', 'English') },
    { value: 'ru+en', label: _ocrT('languageRuEn', 'Russian + English') }
  ].forEach(function (opt) {
    var o = document.createElement('option');
    o.value = opt.value;
    o.textContent = opt.label;
    if (ocr.language === opt.value) o.selected = true;
    langSelect.appendChild(o);
  });
  langSelect.addEventListener('change', function () {
    if (typeof setOcrLanguage === 'function') setOcrLanguage(langSelect.value);
  });
  langRow.appendChild(langSelect);
  card.appendChild(langRow);

  // Match mode select.
  var mmRow = _ocrCreateSettingRow(_ocrT('matchMode', 'Match mode'));
  var mmSelect = document.createElement('select');
  mmSelect.id = 'ocr-match-mode';
  mmSelect.className = 'ocr-select';
  [
    { value: 'contains', label: _ocrT('matchModeContains', 'contains') },
    { value: 'exact',    label: _ocrT('matchModeExact',    'exact') }
  ].forEach(function (opt) {
    var o = document.createElement('option');
    o.value = opt.value;
    o.textContent = opt.label;
    if (ocr.matchMode === opt.value) o.selected = true;
    mmSelect.appendChild(o);
  });
  mmSelect.addEventListener('change', function () {
    if (typeof setOcrMatchMode === 'function') setOcrMatchMode(mmSelect.value);
  });
  mmRow.appendChild(mmSelect);
  card.appendChild(mmRow);

  // Case sensitive checkbox.
  var csRow = _ocrCreateSettingRow('');
  var csLabel = document.createElement('label');
  csLabel.className = 'ocr-checkbox-label';
  var csCheckbox = document.createElement('input');
  csCheckbox.type = 'checkbox';
  csCheckbox.id = 'ocr-case-sensitive';
  csCheckbox.checked = !!ocr.caseSensitive;
  csCheckbox.addEventListener('change', function () {
    if (typeof setOcrCaseSensitive === 'function') setOcrCaseSensitive(!!csCheckbox.checked);
  });
  var csText = document.createElement('span');
  csText.textContent = _ocrT('caseSensitive', 'Case sensitive');
  csLabel.appendChild(csCheckbox);
  csLabel.appendChild(csText);
  csRow.appendChild(csLabel);
  card.appendChild(csRow);

  // Use selected region checkbox.
  var urRow = _ocrCreateSettingRow('');
  var urLabel = document.createElement('label');
  urLabel.className = 'ocr-checkbox-label';
  var urCheckbox = document.createElement('input');
  urCheckbox.type = 'checkbox';
  urCheckbox.id = 'ocr-use-region';
  urCheckbox.checked = !!ocr.useSelectedRegion;
  urCheckbox.addEventListener('change', function () {
    if (typeof setOcrUseSelectedRegion === 'function') setOcrUseSelectedRegion(!!urCheckbox.checked);
    renderOcrRegionSummary();
  });
  var urText = document.createElement('span');
  urText.textContent = _ocrT('useSelectedRegion', 'Use selected region');
  urLabel.appendChild(urCheckbox);
  urLabel.appendChild(urText);
  urRow.appendChild(urLabel);
  card.appendChild(urRow);
}

function renderOcrRegionSummary(host) {
  var card = host || document.querySelector('.ocr-region-card');
  if (!card) return;
  Array.prototype.slice.call(card.querySelectorAll('.adv-card-row, .ocr-empty')).forEach(function (n) { n.remove(); });

  var state = (typeof getState === 'function') ? getState() : null;
  var useRegion = state && state.ocr ? !!state.ocr.useSelectedRegion : true;
  var regionSel = state && state.regionSelector ? state.regionSelector.normalizedRegion : null;

  if (!useRegion) {
    var off = document.createElement('div');
    off.className = 'ocr-empty';
    off.textContent = _ocrT('useSelectedRegion', 'Use selected region') + ': ' + _ocrT('flagDisabled', 'off');
    card.appendChild(off);
    return;
  }

  if (!regionSel) {
    var none = document.createElement('div');
    none.className = 'ocr-empty';
    none.textContent = _ocrT('none', 'none');
    card.appendChild(none);
    return;
  }

  _ocrAddCardRow(card, _ocrT('selectedRegion', 'Selected region'),
    (regionSel.x | 0) + ', ' + (regionSel.y | 0) + ' · ' +
    (regionSel.width | 0) + ' × ' + (regionSel.height | 0));
}

// ---------------------------------------------------------------------
// Build the OCR input from current state and run the mock engine.
// ---------------------------------------------------------------------

function buildOcrInputFromState() {
  var state = (typeof getState === 'function') ? getState() : null;
  if (!state) return null;
  var preview = state.screenCapture ? state.screenCapture.preview : null;
  var useRegion = state.ocr ? !!state.ocr.useSelectedRegion : true;
  var region = (useRegion && state.regionSelector && state.regionSelector.normalizedRegion)
    ? state.regionSelector.normalizedRegion
    : null;
  var ocr = state.ocr || {};
  if (typeof createOcrInput !== 'function') return null;
  return createOcrInput(preview, region, {
    language:      ocr.language || 'ru+en',
    targetText:    ocr.targetText || '',
    matchMode:     ocr.matchMode || 'contains',
    caseSensitive: !!ocr.caseSensitive
  });
}

function runMockOcrFromUi() {
  if (typeof runMockOcr !== 'function') return;
  var input = buildOcrInputFromState();
  if (!input) {
    if (typeof addLogEntry === 'function' && typeof createLog === 'function') {
      addLogEntry(createLog('error', _ocrT('captureScreenPreviewFirst', 'Capture a screen preview first.')));
    }
    return;
  }
  if (typeof setOcrInput === 'function')   setOcrInput(input);
  if (typeof setOcrRunning === 'function') setOcrRunning(true);

  if (typeof addLogEntry === 'function' && typeof createLog === 'function') {
    addLogEntry(createLog('info', _ocrT('ocrRunStarted', 'Mock OCR started')));
  }

  var result = null;
  try {
    result = runMockOcr(input);
  } catch (e) {
    if (typeof setOcrError === 'function') setOcrError('mock-engine-threw');
  }

  if (typeof setOcrRunning === 'function') setOcrRunning(false);
  if (result) {
    if (result.success === false || (Array.isArray(result.errors) && result.errors.length > 0)) {
      if (typeof setOcrError === 'function')  setOcrError(result.errors[0] || 'ocr-failed');
      if (typeof setOcrResult === 'function') setOcrResult(result);
      if (typeof addLogEntry === 'function' && typeof createLog === 'function') {
        addLogEntry(createLog('error',
          _ocrT('ocrRunFailed', 'Mock OCR failed') + ' · ' +
          result.errors.map(function (id) { return _ocrT(id, id); }).join('; ')));
      }
    } else {
      if (typeof setOcrError === 'function')  setOcrError(null);
      if (typeof setOcrResult === 'function') setOcrResult(result);
      if (typeof addLogEntry === 'function' && typeof createLog === 'function') {
        if (result.matched) {
          addLogEntry(createLog('success',
            _ocrT('ocrRunCompleted', 'Mock OCR completed') + ' · ' + (result.match ? result.match.text : '')));
        } else {
          addLogEntry(createLog('warning', _ocrT('ocrNoMatch', 'OCR did not find a match')));
        }
      }
    }
  }
  renderOcrResult();
  if (typeof renderState === 'function') renderState();
}

function clearOcrResultUi() {
  if (typeof clearOcrMockResult === 'function') clearOcrMockResult();
  if (typeof clearOcrResult === 'function')      clearOcrResult();
  if (typeof addLogEntry === 'function' && typeof createLog === 'function') {
    addLogEntry(createLog('info', _ocrT('ocrRunCleared', 'OCR result cleared')));
  }
  renderOcrResult();
  if (typeof renderState === 'function') renderState();
}

// ---------------------------------------------------------------------
// Result rendering
// ---------------------------------------------------------------------

function renderOcrResult(host) {
  var resultHost = host || document.getElementById('ocr-result-host');
  if (!resultHost) return;
  resultHost.innerHTML = '';

  var state = (typeof getState === 'function') ? getState() : null;
  var result = state && state.ocr ? state.ocr.lastResult : null;
  if (!result) {
    var empty = document.createElement('div');
    empty.className = 'ocr-empty ocr-empty-result';
    empty.textContent = _ocrT('noOcrResult', 'No OCR result');
    resultHost.appendChild(empty);
    return;
  }

  // Result summary card.
  var card = document.createElement('div');
  card.className = 'adv-card ocr-result-card';

  var headline = document.createElement('div');
  headline.className = 'ocr-result-headline';
  if (result.matched) {
    headline.classList.add('ocr-result-headline-matched');
    headline.textContent = _ocrT('ocrMatched', 'OCR found a match');
  } else if (Array.isArray(result.errors) && result.errors.length > 0) {
    headline.classList.add('ocr-result-headline-failed');
    headline.textContent = _ocrT('ocrRunFailed', 'Mock OCR failed');
  } else {
    headline.classList.add('ocr-result-headline-no-match');
    headline.textContent = _ocrT('ocrNoMatch', 'OCR did not find a match');
  }
  card.appendChild(headline);

  var subtitle = document.createElement('div');
  subtitle.className = 'ocr-result-subtitle';
  subtitle.textContent = _ocrT('realOcrNotConnected', 'Real OCR is not connected yet.');
  card.appendChild(subtitle);

  // Metric rows.
  _ocrAddCardRow(card, _ocrT('targetText', 'Target text'), result.targetText || _ocrT('none', 'none'));
  _ocrAddCardRow(card, _ocrT('ocrLanguage', 'OCR language'),
    _ocrLanguageLabel(result.language));
  _ocrAddCardRow(card, _ocrT('matchMode', 'Match mode'),
    result.matchMode === 'exact' ? _ocrT('matchModeExact', 'exact') : _ocrT('matchModeContains', 'contains'));
  _ocrAddCardRow(card, _ocrT('caseSensitive', 'Case sensitive'),
    result.caseSensitive ? _ocrT('yes', 'yes') : _ocrT('no', 'no'));
  if (result.match) {
    _ocrAddCardRow(card, _ocrT('matchedText', 'Matched text'), result.match.text || '');
    _ocrAddCardRow(card, _ocrT('confidence', 'Confidence'),
      (typeof result.match.confidence === 'number')
        ? (Math.round(result.match.confidence * 1000) / 10).toFixed(1) + '%'
        : '—');
    if (result.match.boundingBox) {
      _ocrAddCardRow(card, _ocrT('boundingBox', 'Bounding box'),
        result.match.boundingBox.x + ', ' + result.match.boundingBox.y + ' · ' +
        result.match.boundingBox.width + ' × ' + result.match.boundingBox.height);
    }
    if (result.match.targetPoint) {
      _ocrAddCardRow(card, _ocrT('targetPoint', 'Target point'),
        result.match.targetPoint.x + ', ' + result.match.targetPoint.y);
    }
  }
  if (typeof result.durationMs === 'number') {
    _ocrAddCardRow(card, _ocrT('durationMs', 'Duration'), result.durationMs + ' ms');
  }
  // Always-on safety reminders.
  _ocrAddCardRow(card, _ocrT('realOcrDisabled', 'Real OCR disabled'), _ocrT('flagEnabled', 'enabled'));
  _ocrAddCardRow(card, _ocrT('realClickDisabled', 'Real click disabled'), _ocrT('flagEnabled', 'enabled'));
  resultHost.appendChild(card);

  // Errors block.
  if (Array.isArray(result.errors) && result.errors.length > 0) {
    var errBlock = document.createElement('div');
    errBlock.className = 'ocr-errors';
    var errTitle = document.createElement('div');
    errTitle.className = 'ocr-errors-title';
    errTitle.textContent = _ocrT('ocrRunFailed', 'Mock OCR failed');
    errBlock.appendChild(errTitle);
    var errList = document.createElement('ul');
    errList.className = 'ocr-errors-list';
    result.errors.forEach(function (id) {
      var li = document.createElement('li');
      li.className = 'ocr-errors-item';
      li.textContent = _ocrT(id, id);
      errList.appendChild(li);
    });
    errBlock.appendChild(errList);
    resultHost.appendChild(errBlock);
  }

  // Recognised blocks list.
  renderOcrBlocks(result.blocks, result.match, resultHost);

  // Visual overlay.
  renderOcrOverlay(result, resultHost);

  // text_click action preview.
  renderTextClickActionPreview(result, resultHost);
}

function renderOcrBlocks(blocks, match, host) {
  if (!Array.isArray(blocks) || blocks.length === 0) return;
  if (!host) return;

  var card = document.createElement('div');
  card.className = 'adv-card ocr-blocks-card';
  var title = document.createElement('div');
  title.className = 'adv-card-title';
  title.textContent = _ocrT('recognizedBlocks', 'Recognized blocks');
  card.appendChild(title);

  var list = document.createElement('div');
  list.className = 'ocr-blocks-list';
  for (var i = 0; i < blocks.length; i++) {
    var b = blocks[i];
    if (!b) continue;
    var row = document.createElement('div');
    row.className = 'ocr-block-row';
    if (match && match.id && b.id === match.id) {
      row.classList.add('ocr-block-row-matched');
    }
    var idx = document.createElement('span');
    idx.className = 'ocr-block-index';
    idx.textContent = '#' + (i + 1);
    var text = document.createElement('span');
    text.className = 'ocr-block-text';
    text.textContent = b.text || '';
    var conf = document.createElement('span');
    conf.className = 'ocr-block-confidence';
    conf.textContent = (typeof b.confidence === 'number')
      ? (Math.round(b.confidence * 1000) / 10).toFixed(1) + '%'
      : '—';
    var bbox = document.createElement('span');
    bbox.className = 'ocr-block-bbox';
    if (b.boundingBox) {
      bbox.textContent = b.boundingBox.x + ',' + b.boundingBox.y + ' · ' +
        b.boundingBox.width + '×' + b.boundingBox.height;
    } else {
      bbox.textContent = '—';
    }
    row.appendChild(idx);
    row.appendChild(text);
    row.appendChild(conf);
    row.appendChild(bbox);
    list.appendChild(row);
  }
  card.appendChild(list);
  host.appendChild(card);
}

function renderOcrOverlay(result, host) {
  if (!host || !result) return;

  var card = document.createElement('div');
  card.className = 'adv-card ocr-overlay-card';

  var title = document.createElement('div');
  title.className = 'adv-card-title';
  title.textContent = _ocrT('debugOverlay', 'Debug overlay');
  card.appendChild(title);

  var state = (typeof getState === 'function') ? getState() : null;
  var preview = state && state.screenCapture ? state.screenCapture.preview : null;
  if (!preview || !preview.imageDataUrl ||
      !(Number(preview.width) > 0) || !(Number(preview.height) > 0)) {
    var empty = document.createElement('div');
    empty.className = 'ocr-empty';
    empty.textContent = _ocrT('captureScreenPreviewFirst', 'Capture a screen preview first.');
    card.appendChild(empty);
    host.appendChild(card);
    return;
  }

  var wrapper = document.createElement('div');
  wrapper.className = 'ocr-overlay-wrapper';

  var img = document.createElement('img');
  img.className = 'ocr-overlay-image';
  img.alt = '';
  img.src = preview.imageDataUrl;
  img.addEventListener('dragstart', function (e) { e.preventDefault(); });
  wrapper.appendChild(img);

  // Region rectangle (dashed) — when a region was used.
  if (result.region) {
    var rg = result.region;
    var rgEl = document.createElement('div');
    rgEl.className = 'ocr-overlay-region';
    rgEl.style.left   = (rg.x      / preview.width)  * 100 + '%';
    rgEl.style.top    = (rg.y      / preview.height) * 100 + '%';
    rgEl.style.width  = (rg.width  / preview.width)  * 100 + '%';
    rgEl.style.height = (rg.height / preview.height) * 100 + '%';
    wrapper.appendChild(rgEl);
  }

  // All blocks — translucent rectangles. The matched block gets a
  // saturated border + label.
  if (Array.isArray(result.blocks)) {
    for (var i = 0; i < result.blocks.length; i++) {
      var b = result.blocks[i];
      if (!b || !b.boundingBox) continue;
      var bbEl = document.createElement('div');
      bbEl.className = 'ocr-overlay-block';
      if (result.match && result.match.id && b.id === result.match.id) {
        bbEl.classList.add('ocr-overlay-block-matched');
      }
      bbEl.style.left   = (b.boundingBox.x      / preview.width)  * 100 + '%';
      bbEl.style.top    = (b.boundingBox.y      / preview.height) * 100 + '%';
      bbEl.style.width  = (b.boundingBox.width  / preview.width)  * 100 + '%';
      bbEl.style.height = (b.boundingBox.height / preview.height) * 100 + '%';
      // Tiny text label inside the rectangle.
      var label = document.createElement('span');
      label.className = 'ocr-overlay-block-label';
      label.textContent = b.text || '';
      bbEl.appendChild(label);
      wrapper.appendChild(bbEl);
    }
  }

  // Target point dot.
  if (result.match && result.match.targetPoint) {
    var tp = result.match.targetPoint;
    var dot = document.createElement('div');
    dot.className = 'ocr-overlay-target';
    dot.style.left = (tp.x / preview.width)  * 100 + '%';
    dot.style.top  = (tp.y / preview.height) * 100 + '%';
    wrapper.appendChild(dot);
  }

  card.appendChild(wrapper);

  // Reminder beneath the overlay.
  var note = document.createElement('div');
  note.className = 'ocr-overlay-note';
  note.textContent = _ocrT('textClickNotExecuted', 'text_click is not executed') +
    ' · ' + _ocrT('realOcrNotConnected', 'Real OCR is not connected yet.');
  card.appendChild(note);

  host.appendChild(card);
}

function renderTextClickActionPreview(result, host) {
  if (!host || !result || !result.actionPreview) return;

  var card = document.createElement('div');
  card.className = 'adv-card ocr-action-preview-card';

  var title = document.createElement('div');
  title.className = 'adv-card-title';
  title.textContent = _ocrT('textClickActionPreview', 'text_click action preview');
  card.appendChild(title);

  var note = document.createElement('div');
  note.className = 'ocr-action-preview-note';
  note.textContent = _ocrT('textClickPreview', 'text_click preview') +
    ' · ' + _ocrT('realClickDisabled', 'Real click disabled');
  card.appendChild(note);

  // Render via <pre>.textContent — never innerHTML on user data.
  var pre = document.createElement('pre');
  pre.className = 'ocr-action-preview-json';
  try {
    pre.textContent = JSON.stringify(result.actionPreview, null, 2);
  } catch (err) {
    pre.textContent = '[unserializable preview]';
  }
  card.appendChild(pre);

  host.appendChild(card);
}

// ---------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------

function _ocrCreateSettingRow(label) {
  var row = document.createElement('div');
  row.className = 'ocr-setting-row';
  if (label) {
    var lbl = document.createElement('div');
    lbl.className = 'ocr-setting-label';
    lbl.textContent = label;
    row.appendChild(lbl);
  }
  return row;
}

// =====================================================================
// Step 38 — OCR provider readiness card.
// =====================================================================
//
// Pure DOM rendering. Reads the OCR provider registry status, paints
// a "Готовность OCR" / "OCR readiness" card, plus a Run-self-test
// button. The button NEVER triggers real OCR — `runOcrProviderSelfTest`
// only runs the mock engine against a synthetic preview.
function renderOcrProviderReadiness(host) {
  var card = host || document.getElementById('ocr-readiness-card');
  if (!card) return;
  // Clear previous content (the title is part of this card too —
  // we redraw everything from scratch).
  card.innerHTML = '';

  var title = document.createElement('div');
  title.className = 'adv-card-title';
  title.textContent = _ocrT('ocrReadiness', 'OCR readiness');
  card.appendChild(title);

  var status = (typeof getOcrProviderRegistryStatus === 'function')
    ? getOcrProviderRegistryStatus()
    : null;
  var providers = (typeof getOcrProviders === 'function') ? getOcrProviders() : [];

  // Warning row — always visible at Step 38.
  var warn = document.createElement('div');
  warn.className = 'ocr-readiness-warning';
  var warnBadge = document.createElement('span');
  warnBadge.className = 'ocr-readiness-warning-badge';
  warnBadge.textContent = _ocrT('realOcrUnavailable', 'Real OCR unavailable');
  var warnText = document.createElement('span');
  warnText.className = 'ocr-readiness-warning-text';
  warnText.textContent =
    _ocrT('realOcrNotConnectedYet', 'Real OCR is not connected yet.') +
    ' ' +
    _ocrT('mockProviderCurrentlyUsed', 'The mock provider is currently used.');
  warn.appendChild(warnBadge);
  warn.appendChild(warnText);
  card.appendChild(warn);

  // Status rows.
  if (status) {
    _ocrAddCardRow(card, _ocrT('mockOcrProvider', 'Mock OCR provider'),
      status.mockProviderAvailable
        ? _ocrT('flagAvailable', 'available')
        : _ocrT('flagUnavailable', 'unavailable'));
    _ocrAddCardRow(card, _ocrT('tesseractOcrProvider', 'Tesseract OCR provider'),
      status.tesseractProviderAvailable
        ? _ocrT('flagAvailable', 'available')
        : (_ocrT('realOcrPlanned', 'Real OCR — planned') + ' / ' + _ocrT('flagUnavailable', 'unavailable')));
    _ocrAddCardRow(card, _ocrT('realOcrEnabled', 'Real OCR enabled'),
      status.realOcrEnabled ? _ocrT('flagYes', 'yes') : _ocrT('flagNo', 'no'));
    _ocrAddCardRow(card, _ocrT('realOcrAllowed', 'Real OCR allowed'),
      status.realOcrAllowed ? _ocrT('flagYes', 'yes') : _ocrT('flagNo', 'no'));
    _ocrAddCardRow(card, _ocrT('supportedOcrLanguages', 'Supported OCR languages'),
      Array.isArray(status.supportedLanguages) ? status.supportedLanguages.join(' / ') : '');
    _ocrAddCardRow(card, _ocrT('activeOcrProvider', 'Active OCR provider'),
      (status.activeProviderName || status.activeProviderId || '—'));
    _ocrAddCardRow(card, _ocrT('ocrImagesNotStored', 'OCR images are not saved to disk.'),
      _ocrT('flagYes', 'yes'));
    _ocrAddCardRow(card, _ocrT('ocrRequiresUserAction', 'OCR requires user action.'),
      _ocrT('flagYes', 'yes'));
    _ocrAddCardRow(card, _ocrT('realClicks', 'Real clicks'),
      _ocrT('disabled', 'disabled'));
  }

  // Provider list — one row per registered provider.
  if (Array.isArray(providers) && providers.length > 0) {
    var listTitle = document.createElement('div');
    listTitle.className = 'ocr-readiness-list-title';
    listTitle.textContent = _ocrT('ocrProviders', 'OCR providers') +
      ' (' + providers.length + ')';
    card.appendChild(listTitle);

    var list = document.createElement('div');
    list.className = 'ocr-readiness-list';
    providers.forEach(function (p) {
      var row = document.createElement('div');
      row.className = 'ocr-readiness-provider-row';
      if (p.active) row.classList.add('ocr-readiness-provider-row-active');
      if (p.realOcr) row.classList.add('ocr-readiness-provider-row-real');

      var nameEl = document.createElement('div');
      nameEl.className = 'ocr-readiness-provider-name';
      nameEl.textContent = p.name || p.id;
      row.appendChild(nameEl);

      var typeBadge = document.createElement('div');
      typeBadge.className = 'ocr-readiness-provider-type ocr-readiness-provider-type-' + p.type;
      typeBadge.textContent = p.type;
      row.appendChild(typeBadge);

      var statusBadge = document.createElement('div');
      statusBadge.className = 'ocr-readiness-provider-status';
      if (p.active) {
        statusBadge.classList.add('ocr-readiness-provider-status-active');
        statusBadge.textContent = _ocrT('flagActive', 'active');
      } else if (p.available) {
        statusBadge.classList.add('ocr-readiness-provider-status-available');
        statusBadge.textContent = _ocrT('flagAvailable', 'available');
      } else if (p.planned) {
        statusBadge.classList.add('ocr-readiness-provider-status-planned');
        statusBadge.textContent = _ocrT('realOcrPlanned', 'Real OCR — planned');
      } else {
        statusBadge.classList.add('ocr-readiness-provider-status-unavailable');
        statusBadge.textContent = _ocrT('flagUnavailable', 'unavailable');
      }
      row.appendChild(statusBadge);

      if (p.disabledReason) {
        var reason = document.createElement('div');
        reason.className = 'ocr-readiness-provider-reason';
        reason.textContent = p.disabledReason;
        row.appendChild(reason);
      }

      list.appendChild(row);
    });
    card.appendChild(list);
  }

  // Self-test row.
  var selfTestRow = document.createElement('div');
  selfTestRow.className = 'ocr-readiness-selftest-row';
  var selfTestBtn = document.createElement('button');
  selfTestBtn.type = 'button';
  selfTestBtn.className = 'btn btn-secondary ocr-readiness-selftest-button';
  selfTestBtn.id = 'ocr-readiness-selftest-button';
  selfTestBtn.textContent = _ocrT('runProviderSelfTest', 'Run provider self-test');
  selfTestBtn.addEventListener('click', function (e) {
    e.preventDefault();
    runOcrProviderSelfTestFromUi();
  });
  selfTestRow.appendChild(selfTestBtn);

  // Last self-test result inline.
  var last = status && status.lastProviderSelfTest ? status.lastProviderSelfTest : null;
  var lastEl = document.createElement('span');
  lastEl.className = 'ocr-readiness-selftest-status';
  if (!last) {
    lastEl.textContent = _ocrT('providerSelfTestNotRun', 'Self-test has not been run yet');
  } else if (last.ok) {
    lastEl.classList.add('ocr-readiness-selftest-status-ok');
    lastEl.textContent = _ocrT('providerSelfTestPassed', 'Provider self-test passed') +
      ' · ' + (last.durationMs | 0) + ' ms · blocks=' + ((last.details && last.details.blocksCount) | 0) +
      ' · matched=' + String(last.details && last.details.matched);
  } else {
    lastEl.classList.add('ocr-readiness-selftest-status-fail');
    lastEl.textContent = _ocrT('providerSelfTestFailed', 'Provider self-test failed') +
      ' · ' + (Array.isArray(last.errors) ? last.errors.join(', ') : '');
  }
  selfTestRow.appendChild(lastEl);
  card.appendChild(selfTestRow);
}

function runOcrProviderSelfTestFromUi() {
  if (typeof runOcrProviderSelfTest !== 'function') return;
  var report;
  try {
    report = runOcrProviderSelfTest();
  } catch (e) {
    report = { ok: false, providerId: 'mock', errors: ['exception'], durationMs: 0, details: null };
  }
  if (typeof addLogEntry === 'function' && typeof createLog === 'function') {
    if (report && report.ok) {
      addLogEntry(createLog('success',
        _ocrT('providerSelfTestPassed', 'Provider self-test passed') +
        ' · ' + (report.durationMs | 0) + ' ms'));
    } else {
      addLogEntry(createLog('warning',
        _ocrT('providerSelfTestFailed', 'Provider self-test failed') +
        (report && Array.isArray(report.errors) ? ' · ' + report.errors.join(', ') : '')));
    }
  }
  // Re-render the readiness card so the inline status updates.
  renderOcrProviderReadiness();
}

// =====================================================================
// Step 39 — OCR provider status card.
// =====================================================================
//
// Pure DOM rendering. Reads the OCR provider registry + the
// Tesseract provider shell, paints an "OCR provider status" card,
// and offers a "Check Tesseract readiness" button.
//
// The button NEVER triggers real OCR — `checkTesseractProviderReadiness`
// inspects feature flags + the engine resolver and returns a
// structured report. Step 39 deliberately does not expose any
// "turn on real OCR" toggle here — Phase 1 is readiness only.
function renderOcrProviderStatusCard(host) {
  var card = host || document.getElementById('ocr-provider-status-card');
  if (!card) return;
  while (card.firstChild) card.removeChild(card.firstChild);

  var title = document.createElement('div');
  title.className = 'adv-card-title';
  title.textContent = _ocrT('ocrProviderStatus', 'OCR provider status');
  card.appendChild(title);

  var registry = (typeof getOcrProviderRegistryStatus === 'function')
    ? getOcrProviderRegistryStatus() : null;
  var tess = (typeof getTesseractProviderStatus === 'function')
    ? getTesseractProviderStatus() : null;

  // Reassuring banner — Step 39 invariant, always rendered.
  var banner = document.createElement('div');
  banner.className = 'ocr-provider-status-banner';
  var bannerBadge = document.createElement('span');
  bannerBadge.className = 'ocr-provider-status-banner-badge';
  bannerBadge.textContent = _ocrT('realOcrProviderDisabled', 'Real OCR provider disabled by default');
  var bannerText = document.createElement('span');
  bannerText.className = 'ocr-provider-status-banner-text';
  bannerText.textContent =
    _ocrT('realOcrAutoRunDisabled', 'Real OCR auto-run disabled') + ' · ' +
    _ocrT('realOcrWillBeEnabledLater', 'Real OCR will be enabled later, after manual review.');
  banner.appendChild(bannerBadge);
  banner.appendChild(bannerText);
  card.appendChild(banner);

  // Status rows.
  _ocrAddCardRow(card,
    _ocrT('activeOcrProvider', 'Active OCR provider'),
    (registry && registry.activeProviderName) ||
    (registry && registry.activeProviderId) ||
    _ocrT('activeProviderMock', 'Active provider: mock'));
  _ocrAddCardRow(card,
    _ocrT('tesseractInstalled', 'Tesseract installed'),
    tess && tess.dependencyDeclared
      ? (tess.engineLoadable ? _ocrT('flagYes', 'yes') : _ocrT('flagYes', 'yes') + ' · ' + _ocrT('tesseractEngineNotLoadable', 'Tesseract engine is not loadable in this build'))
      : _ocrT('flagNo', 'no'));
  _ocrAddCardRow(card,
    _ocrT('tesseractEnabled', 'Tesseract enabled'),
    tess && tess.enabledByFeatureFlag ? _ocrT('flagYes', 'yes') : _ocrT('flagNo', 'no'));
  _ocrAddCardRow(card,
    _ocrT('realOcrFeatureFlag', 'Real OCR feature flag'),
    tess && tess.realOcrFeatureFlag ? _ocrT('flagEnabled', 'enabled') : _ocrT('flagDisabled', 'disabled'));
  _ocrAddCardRow(card,
    _ocrT('realOcrAutoRunDisabled', 'Real OCR auto-run disabled'),
    _ocrT('flagYes', 'yes'));
  _ocrAddCardRow(card,
    _ocrT('realClicks', 'Real clicks'),
    _ocrT('disabled', 'disabled'));

  // Check Tesseract readiness button.
  var btnRow = document.createElement('div');
  btnRow.className = 'ocr-provider-status-button-row';
  var checkBtn = document.createElement('button');
  checkBtn.type = 'button';
  checkBtn.className = 'btn btn-secondary ocr-provider-status-check-button';
  checkBtn.id = 'ocr-tesseract-readiness-button';
  checkBtn.textContent = _ocrT('checkTesseractReadiness', 'Check Tesseract readiness');
  checkBtn.addEventListener('click', function (e) {
    e.preventDefault();
    runTesseractReadinessCheckFromUi();
  });
  btnRow.appendChild(checkBtn);

  // Last readiness result inline.
  var inline = document.createElement('span');
  inline.className = 'ocr-provider-status-readiness-result';
  if (!tess || !tess.lastReadinessCheck) {
    inline.textContent = '—';
  } else {
    if (tess.available) {
      inline.classList.add('ocr-provider-status-readiness-result-ok');
      inline.textContent = _ocrT('tesseractReady', 'Tesseract ready') + ' · ' + tess.lastReadinessCheck;
    } else if (!tess.enabledByFeatureFlag) {
      inline.classList.add('ocr-provider-status-readiness-result-blocked');
      inline.textContent = _ocrT('tesseractBlockedByFeatureFlag', 'Tesseract blocked by feature flag') + ' · ' + tess.lastReadinessCheck;
    } else {
      inline.classList.add('ocr-provider-status-readiness-result-fail');
      inline.textContent = _ocrT('tesseractUnavailable', 'Tesseract unavailable') + ' · ' + tess.lastReadinessCheck;
    }
  }
  btnRow.appendChild(inline);
  card.appendChild(btnRow);
}

function runTesseractReadinessCheckFromUi() {
  if (typeof checkTesseractProviderReadiness !== 'function') return;
  var report;
  try {
    report = checkTesseractProviderReadiness();
  } catch (e) {
    report = { ready: false, reasons: ['exception'], details: null };
  }
  if (typeof addLogEntry === 'function' && typeof createLog === 'function') {
    if (report && report.ready) {
      addLogEntry(createLog('success',
        _ocrT('tesseractReadinessCheckCompleted', 'Tesseract readiness check completed') +
        ' · ' + _ocrT('tesseractReady', 'Tesseract ready')));
    } else {
      var reasons = (report && Array.isArray(report.reasons)) ? report.reasons.join(', ') : '';
      addLogEntry(createLog('info',
        _ocrT('tesseractReadinessCheckCompleted', 'Tesseract readiness check completed') +
        (reasons ? ' · ' + reasons : '')));
    }
  }
  renderOcrProviderStatusCard();
}

function _ocrAddCardRow(card, label, value) {
  var row = document.createElement('div');
  row.className = 'adv-card-row';
  var lbl = document.createElement('span');
  lbl.className = 'adv-card-label';
  lbl.textContent = label;
  var val = document.createElement('span');
  val.className = 'adv-card-value';
  val.textContent = value == null ? '' : String(value);
  row.appendChild(lbl);
  row.appendChild(val);
  card.appendChild(row);
}

function _ocrLanguageLabel(language) {
  if (language === 'ru') return _ocrT('languageRu',   'Russian');
  if (language === 'en') return _ocrT('languageEn',   'English');
  return _ocrT('languageRuEn', 'Russian + English');
}

function _ocrT(key, fallback) {
  if (typeof t === 'function') {
    var s = t(key);
    if (s && s !== key) return s;
  }
  return fallback || key;
}
